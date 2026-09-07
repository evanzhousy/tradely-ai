import type { ContractNeighborhood } from "./contracts";
import { clampReplayPosition, replayFrameIndex, replayTime } from "./replay";

/** Temporal interpolation is illustrative; the closing assessment snapshot is unchanged. */
export function sampleContractReplay(
	data: ContractNeighborhood,
	rawPosition: number,
): ContractNeighborhood {
	const position = clampReplayPosition(rawPosition);
	const frames = data.replay?.frames;
	if (!frames?.length || position >= 1) return data;
	const startIndex = replayFrameIndex(frames, position);
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
