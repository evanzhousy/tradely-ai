import {
	clampReplayPosition,
	type ReplayTimeline,
	replayFrameIndex,
} from "./replay";
import type { LearningCopy } from "./types";

export type DatedObservation = {
	value: number | null;
	asOf: string;
	scope: string;
};

export type FlowStructureComparison = {
	id: string;
	scope: string;
	sessionDate: string;
	reportedOi: DatedObservation;
	previousOi: DatedObservation | null;
	gex: DatedObservation;
	note: LearningCopy;
	replay: ReplayTimeline<{ position: number; volume: number }>;
};

/** Only comparable cleared reports can produce a delta; missing never means zero. */
export function reportedOiChange(data: FlowStructureComparison): number | null {
	const previous = data.previousOi;
	const latest = data.reportedOi;
	if (
		!previous ||
		previous.value === null ||
		latest.value === null ||
		previous.scope !== latest.scope ||
		previous.asOf >= latest.asOf
	)
		return null;
	return latest.value - previous.value;
}

/** The tape interpolates; reported positions and model snapshots do not. */
export function sampleSessionVolume(
	data: FlowStructureComparison,
	rawPosition: number,
): number {
	const position = clampReplayPosition(rawPosition);
	const frames = data.replay.frames;
	const index = replayFrameIndex(frames, position);
	const start = frames[index];
	const end = frames[Math.min(index + 1, frames.length - 1)];
	const fraction = Math.min(
		1,
		Math.max(
			0,
			(position - start.position) / (end.position - start.position || 1),
		),
	);
	const eased = fraction * fraction * (3 - 2 * fraction);
	return Math.round(start.volume + (end.volume - start.volume) * eased);
}
