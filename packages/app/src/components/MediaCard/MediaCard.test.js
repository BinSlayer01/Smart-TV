import {act, fireEvent, render, screen} from '@testing-library/react';

import MediaCard from './MediaCard';
import {setTmdbThumbsAvailable} from '../../utils/tmdbThumb';

// The CLI ships a second copy of React, so the components' JSX goes through the copy under test.
jest.mock('react/jsx-dev-runtime', () => {
	const React = require('react');
	return {
		Fragment: React.Fragment,
		jsxDEV: (type, {children, ...props}, key, isStaticChildren) => {
			const config = key === undefined ? props : {...props, key};
			if (children === undefined) return React.createElement(type, config);
			return isStaticChildren ? React.createElement(type, config, ...children) : React.createElement(type, config, children);
		}
	};
});
// Spotlight's own props would be unknown attributes on the plain element this mock renders.
jest.mock('@enact/spotlight/Spottable', () => (type) => {
	const React = require('react');
	return (props) => {
		const rest = {...props, 'data-spotlight-id': props.spotlightId};
		delete rest.spotlightId;
		delete rest.onSpotlightLeft;
		delete rest.onSpotlightRight;
		return React.createElement(type, rest);
	};
});
jest.mock('../../context/SettingsContext', () => ({useSettings: () => ({settings: {}})}));
jest.mock('../../services/jellyfinApi', () => ({
	getServerUrl: () => 'http://server',
	getApiKey: () => 'token',
	getTokenParam: () => 'ApiKey'
}));
jest.mock('../seerr/SeerrStatusBadge', () => ({SeerrSeasonDot: () => null}));
jest.mock('../icons/SeerrIcon', () => () => null);
jest.mock('../AnimeMarkerPills', () => ({AnimeCardPill: () => null}));
jest.mock('../../hooks/useItemMenuHold', () => () => ({}));

const POSTER = 'https://image.tmdb.org/t/p/w342/poster.jpg';
const BACKDROP = 'https://image.tmdb.org/t/p/w1280/backdrop.jpg';
const THUMB = 'http://server/Moonfin/Tmdb/Thumb?type=movie&tmdbId=603&ApiKey=token';

// A Seerr row title the way normalizeMediaItem leaves it.
const seerrMovie = (overrides = {}) => ({
	Id: 'seerr-movie-603',
	Name: 'The Matrix',
	Type: 'Movie',
	_externalPosterUrl: POSTER,
	_externalBackdropUrl: BACKDROP,
	mediaInfo: {},
	_seerr: true,
	_seerrType: 'item',
	_seerrMediaType: 'movie',
	_seerrRaw: {mediaId: 603, mediaType: 'movie'},
	...overrides
});

const draw = (item, rowImageType) => {
	render(<MediaCard item={item} serverUrl="http://server" rowImageType={rowImageType} />);
	return {
		card: () => document.querySelector('[class~="card"]'),
		image: () => screen.getByRole('img')
	};
};

beforeEach(() => setTmdbThumbsAvailable(true));
afterAll(() => setTmdbThumbsAvailable(false));

describe('MediaCard in a Thumb row', () => {
	it('shows the titled thumb for a Seerr title and turns landscape', () => {
		const {card, image} = draw(seerrMovie(), 'thumb');
		expect(image().getAttribute('src')).toBe(THUMB);
		expect(card().className).toContain('landscape');
	});

	it('shows the plain backdrop when the plugin can\'t make thumbs', () => {
		setTmdbThumbsAvailable(false);
		const {card, image} = draw(seerrMovie(), 'thumb');
		expect(image().getAttribute('src')).toBe(BACKDROP);
		expect(card().className).toContain('landscape');
	});

	it('hands over to the backdrop when the thumb fails to load', () => {
		const {card, image} = draw(seerrMovie(), 'thumb');
		fireEvent.error(image());
		expect(image().getAttribute('src')).toBe(BACKDROP);
		expect(card().className).toContain('landscape');
	});

	it('stays a poster when there is no wide art at all', () => {
		setTmdbThumbsAvailable(false);
		const {card, image} = draw(seerrMovie({_externalBackdropUrl: null}), 'thumb');
		expect(image().getAttribute('src')).toBe(POSTER);
		expect(card().className).toContain('portrait');
	});

	it('picks the thumb up once the plugin ping comes back', () => {
		setTmdbThumbsAvailable(false);
		const {image} = draw(seerrMovie(), 'thumb');
		expect(image().getAttribute('src')).toBe(BACKDROP);
		act(() => setTmdbThumbsAvailable(true));
		expect(image().getAttribute('src')).toBe(THUMB);
	});

	it('keeps an owned outside list title on its library art', () => {
		const owned = seerrMovie({Id: 'lib1', _external: true, _resolvedFromExternal: true, ImageTags: {Primary: 'p', Thumb: 't'}});
		const {image} = draw(owned, 'thumb');
		expect(image().getAttribute('src')).not.toContain('/Moonfin/Tmdb/Thumb');
	});
});

describe('MediaCard in other rows', () => {
	it('shows an owned outside list title on its library poster', () => {
		const owned = seerrMovie({Id: 'lib1', _external: true, _resolvedFromExternal: true, ImageTags: {Primary: 'p'}});
		const {image} = draw(owned, 'poster');
		expect(image().getAttribute('src')).toContain('/Items/lib1/Images/Primary');
	});

	it('keeps the poster in a Poster row', () => {
		const {card, image} = draw(seerrMovie(), 'poster');
		expect(image().getAttribute('src')).toBe(POSTER);
		expect(card().className).toContain('portrait');
	});

	it('leaves a Banner row as it was', () => {
		const {card, image} = draw(seerrMovie(), 'banner');
		expect(image().getAttribute('src')).toBe(POSTER);
		expect(card().className).toContain('banner');
	});
});
