import {isStreamlessStaticSource, isUnprobedPlaceholder, probedSources} from './placeholderSource';

const audio = {Type: 'Audio', Index: 1};
const channelItem = {Id: 'i1', Type: 'Movie', MediaSources: [{Id: 'ph', MediaStreams: []}]};

describe('isStreamlessStaticSource', () => {
	test("spots a channel item's lone placeholder", () => {
		expect(isStreamlessStaticSource(channelItem, 'ph')).toBe(true);
		expect(isStreamlessStaticSource({...channelItem, MediaSources: [{Id: 'ph'}]}, 'ph')).toBe(true);
	});

	test('keeps the id of a probed item, a live channel, another version or another id', () => {
		expect(isStreamlessStaticSource({...channelItem, MediaSources: [{Id: 'ph', MediaStreams: [audio]}]}, 'ph')).toBe(false);
		expect(isStreamlessStaticSource({...channelItem, MediaStreams: [audio]}, 'ph')).toBe(false);
		expect(isStreamlessStaticSource({...channelItem, Type: 'TvChannel'}, 'ph')).toBe(false);
		expect(isStreamlessStaticSource({...channelItem, MediaSources: [{Id: 'ph'}, {Id: 'v2'}]}, 'ph')).toBe(false);
		expect(isStreamlessStaticSource(channelItem, 'other')).toBe(false);
		expect(isStreamlessStaticSource(channelItem, undefined)).toBe(false);
	});
});

describe('isUnprobedPlaceholder and probedSources', () => {
	test('a source with nothing probed that can only be transcoded, unless it is a live stream', () => {
		expect(isUnprobedPlaceholder({Id: 'ph', MediaStreams: [], SupportsDirectPlay: false, SupportsDirectStream: false})).toBe(true);
		expect(isUnprobedPlaceholder({Id: 'ph', LiveStreamId: 'live'})).toBe(false);
		expect(isUnprobedPlaceholder({Id: 'ph', SupportsDirectStream: true})).toBe(false);
		expect(isUnprobedPlaceholder({Id: 'real', MediaStreams: [audio]})).toBe(false);
	});

	test('keeps only the sources that came back with streams', () => {
		expect(probedSources({MediaSources: [{Id: 'ph'}, {Id: 'real', MediaStreams: [audio]}]}).map((source) => source.Id)).toEqual(['real']);
		expect(probedSources(null)).toEqual([]);
	});
});
