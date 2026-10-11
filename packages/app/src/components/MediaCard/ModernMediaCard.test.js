import {fireEvent, render, screen} from '@testing-library/react';

import ModernMediaCard from './ModernMediaCard';
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
jest.mock('@enact/i18n/$L', () => (text) => text);
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
jest.mock('../../services/mdblistApi', () => ({isMdblistEnabled: () => false}));
jest.mock('../../platform', () => ({getPlatform: () => 'webos', isWebOS: () => false, isLegacyTizen: () => false}));
jest.mock('../../utils/perfTier', () => ({getPerfTier: () => 'high'}));
jest.mock('../RatingsRow', () => () => null);
jest.mock('../icons/SeerrIcon', () => () => null);
jest.mock('../AnimeMarkerPills', () => ({AnimeCardPill: () => null}));
jest.mock('../../hooks/useItemMenuHold', () => () => ({}));

const POSTER = 'https://image.tmdb.org/t/p/w342/poster.jpg';
const BACKDROP = 'https://image.tmdb.org/t/p/w1280/backdrop.jpg';
const THUMB = 'http://server/Moonfin/Tmdb/Thumb?type=tv&tmdbId=1396&ApiKey=token';

// A Seerr row show the way normalizeMediaItem leaves it.
const seerrShow = (overrides = {}) => ({
	Id: 'seerr-tv-1396',
	Name: 'Breaking Bad',
	Type: 'Series',
	_externalPosterUrl: POSTER,
	_externalBackdropUrl: BACKDROP,
	mediaInfo: {},
	_seerr: true,
	_seerrType: 'item',
	_seerrMediaType: 'tv',
	_seerrRaw: {mediaId: 1396, mediaType: 'tv'},
	...overrides
});

const draw = (item, isFocused) => {
	const {unmount} = render(<ModernMediaCard item={item} serverUrl="http://server" isFocused={isFocused} />);
	const src = screen.getByRole('img').getAttribute('src');
	unmount();
	return src;
};

beforeEach(() => setTmdbThumbsAvailable(true));
afterAll(() => setTmdbThumbsAvailable(false));

describe('ModernMediaCard with a Seerr title', () => {
	it('wears the poster at rest and grows into the titled thumb', () => {
		expect(draw(seerrShow(), false)).toBe(POSTER);
		expect(draw(seerrShow(), true)).toBe(THUMB);
	});

	it('grows into the plain backdrop when the plugin can\'t make thumbs', () => {
		setTmdbThumbsAvailable(false);
		expect(draw(seerrShow(), true)).toBe(BACKDROP);
	});

	it('hands over to the backdrop when the thumb fails to load', () => {
		render(<ModernMediaCard item={seerrShow()} serverUrl="http://server" isFocused />);
		fireEvent.error(screen.getByRole('img'));
		expect(screen.getByRole('img').getAttribute('src')).toBe(BACKDROP);
	});

	it('finds the thumb for a title with no poster', () => {
		expect(draw(seerrShow({_externalPosterUrl: null}), true)).toBe(THUMB);
	});

	it('keeps an owned outside list title on the art it already had', () => {
		const owned = seerrShow({Id: 'lib1', _external: true, _resolvedFromExternal: true, ImageTags: {Primary: 'p'}});
		expect(draw(owned, true)).toBe(BACKDROP);
	});

	it('grows an owned outside list title into its library thumb', () => {
		const owned = seerrShow({Id: 'lib1', _external: true, _resolvedFromExternal: true, ImageTags: {Primary: 'p', Thumb: 't'}});
		expect(draw(owned, true)).toContain('/Items/lib1/Images/Thumb');
	});
});
