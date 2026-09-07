export type ReplayClock = {
	position: number;
	startedAt: number;
	playing: boolean;
	rate: number;
	stepOnly: boolean;
};
export type ReplayTimeline<
	Frame extends { position: number } = { position: number },
> = {
	durationMs: number;
	openMinute: number;
	closeMinute: number;
	frames: ReadonlyArray<Frame>;
};
export type ReplaySource = { replay?: ReplayTimeline };
export const REPLAY_RATES: readonly number[] = [0.5, 1, 2];

export function clampReplayPosition(position: number): number {
	return Number.isFinite(position) ? Math.min(1, Math.max(0, position)) : 1;
}

export function replayFrameIndex(
	frames: ReadonlyArray<{ position: number }>,
	position: number,
) {
	for (let index = frames.length - 1; index >= 0; index--)
		if (frames[index].position <= position) return index;
	return 0;
}

/** The renderer and the throttled DOM read from the same monotonic clock. */
export function replayPositionAt(
	data: ReplaySource,
	clock: ReplayClock,
	now: number,
): number {
	const duration = data.replay?.durationMs ?? 1;
	const raw = clampReplayPosition(
		clock.position +
			(clock.playing
				? (Math.max(0, now - clock.startedAt) * clock.rate) / duration
				: 0),
	);
	if (!clock.playing || !clock.stepOnly || !data.replay) return raw;
	const checkpoint =
		data.replay.frames[replayFrameIndex(data.replay.frames, raw)]?.position ??
		0;
	return Math.max(clock.position, checkpoint);
}

export function replayTime(data: ReplaySource, position: number): string {
	const open = data.replay?.openMinute ?? 960;
	const close = data.replay?.closeMinute ?? 960;
	const minute = Math.round(
		open + (close - open) * clampReplayPosition(position),
	);
	return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}
