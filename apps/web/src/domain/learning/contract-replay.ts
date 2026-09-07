import type { ContractNeighborhood, ReplayClock } from "./contracts";

export function clampReplayPosition(position: number): number {
	return Number.isFinite(position) ? Math.min(1, Math.max(0, position)) : 1;
}

function frameIndex(
	frames: ReadonlyArray<{ position: number }>,
	position: number,
) {
	for (let index = frames.length - 1; index >= 0; index--)
		if (frames[index].position <= position) return index;
	return 0;
}

/** The renderer and the throttled DOM read from the same monotonic clock. */
export function replayPositionAt(
	data: ContractNeighborhood,
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
		data.replay.frames[frameIndex(data.replay.frames, raw)]?.position ?? 0;
	return Math.max(clock.position, checkpoint);
}

export function replayTime(
	data: ContractNeighborhood,
	position: number,
): string {
	const open = data.replay?.openMinute ?? 960;
	const close = data.replay?.closeMinute ?? 960;
	const minute = Math.round(
		open + (close - open) * clampReplayPosition(position),
	);
	return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

/** Temporal interpolation is illustrative; the closing assessment snapshot is unchanged. */
export function sampleContractReplay(
	data: ContractNeighborhood,
	rawPosition: number,
): ContractNeighborhood {
	const position = clampReplayPosition(rawPosition);
	const frames = data.replay?.frames;
	if (!frames?.length || position >= 1) return data;
	const startIndex = frameIndex(frames, position);
	const start = frames[startIndex];
	const end = frames[Math.min(startIndex + 1, frames.length - 1)];
	const fraction = Math.min(
		1,
		Math.max(
			0,
			(position - start.position) / (end.position - start.position || 1),
		),
	);
	const eased = fraction * fraction * (3 - 2 * fraction);
	const time = replayTime(data, position);
	return {
		...data,
		asOf: {
			en: `Illustrative replay · ${time} ET`,
			zh: `演示回放 · ${time} ET`,
		},
		contracts: data.contracts.map((contract) => {
			if (!contract.fresh || contract.volume === null) return contract;
			const from = start.volumes[contract.id];
			const to = end.volumes[contract.id];
			return {
				...contract,
				volume:
					from == null || to == null
						? null
						: Math.round(from + (to - from) * eased),
			};
		}),
	};
}
