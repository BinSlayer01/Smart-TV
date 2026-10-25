// An Emby channel item, like one from a plugin's virtual library such as HyperMS, lists a single
// placeholder source with no streams. PlaybackInfo probes the real file and answers with it under
// another id, while naming the placeholder gets back only the placeholder, which the server can
// only transcode and that transcode fails.

const isLiveChannel = (item) => item?.Type === 'TvChannel' || item?.Type === 'LiveTvChannel';

// Whether the id names the item's only source and that source lists no streams. A live channel's
// source has none until it's tuned, and an item that lists its own streams was probed, so both
// keep their id.
export const isStreamlessStaticSource = (item, mediaSourceId) => {
	if (!mediaSourceId || isLiveChannel(item) || item?.MediaStreams?.length) return false;
	const sources = item?.MediaSources;
	return sources?.length === 1 && sources[0].Id === mediaSourceId && !sources[0].MediaStreams?.length;
};

// How the placeholder comes back from PlaybackInfo. A live stream is left out, since its streams
// only show up once it's tuned.
export const isUnprobedPlaceholder = (source) => Boolean(source) &&
	!source.MediaStreams?.length && !source.SupportsDirectPlay && !source.SupportsDirectStream && !source.LiveStreamId;

// The sources a PlaybackInfo asked without an id came back with that were actually probed.
export const probedSources = (playbackInfo) => (playbackInfo?.MediaSources || []).filter((source) => source.MediaStreams?.length);

