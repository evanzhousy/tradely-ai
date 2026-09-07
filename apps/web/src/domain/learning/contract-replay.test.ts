import { describe, expect, it, vi } from "vitest";
import { sampleContractReplay } from "./contract-replay";

vi.mock("@tanstack/react-start/server-only", () => ({}));

import { contractNeighborhoodScenarios } from "@/content/scenarios/contract-neighborhood";
import type { ReplayClock } from "./replay";
import { clampReplayPosition, replayPositionAt, replayTime } from "./replay";

describe("illustrative session replay", () => {
	const data = contractNeighborhoodScenarios[0].steps[0].neighborhood;
	if (!data?.replay) throw new Error("Missing replay fixture");
	const replay = data.replay;
	it("has exact authored checkpoints and the unchanged closing assessment snapshot", () => {
		const baseline = JSON.stringify(data);
		for (const frame of replay.frames) {
			const sampled = sampleContractReplay(data, frame.position);
			for (const contract of sampled.contracts)
				expect(contract.volume).toBe(frame.volumes[contract.id]);
		}
		expect(sampleContractReplay(data, 1)).toBe(data);
		expect(sampleContractReplay(data, 2)).toBe(data);
		expect(JSON.stringify(data)).toBe(baseline);
		expect(replayTime(data, 0)).toBe("09:30");
		expect(replayTime(data, 1)).toBe("16:00");
	});
	it("grows current-session volume monotonically while stale and missing observations stay fixed", () => {
		let previous = sampleContractReplay(data, 0);
		for (let frame = 1; frame <= 200; frame++) {
			const next = sampleContractReplay(data, frame / 200);
			for (let index = 0; index < data.contracts.length; index++) {
				const original = data.contracts[index];
				const current = next.contracts[index].volume;
				if (!original.fresh || original.volume === null)
					expect(current).toBe(original.volume);
				else {
					expect(current).toBeGreaterThanOrEqual(
						previous.contracts[index].volume ?? 0,
					);
					expect(current).toBeLessThanOrEqual(original.volume);
					expect(Number.isInteger(current)).toBe(true);
				}
			}
			previous = next;
		}
	});
	it("samples a shared clock deterministically and clamps the end", () => {
		const clock: ReplayClock = {
			position: 0.25,
			startedAt: 1000,
			playing: true,
			rate: 2,
			stepOnly: false,
		};
		expect(replayPositionAt(data, clock, 2750)).toBe(0.5);
		expect(replayPositionAt(data, clock, 100000)).toBe(1);
		expect(replayPositionAt(data, { ...clock, playing: false }, 100000)).toBe(
			0.25,
		);
		expect(replayPositionAt(data, clock, 0)).toBe(0.25);
		expect(clampReplayPosition(Number.NaN)).toBe(1);
		expect(clampReplayPosition(-1)).toBe(0);
	});
	it("reduced-motion playback holds at checkpoints without rewinding a resumed position", () => {
		const clock: ReplayClock = {
			position: 0.42,
			startedAt: 0,
			playing: true,
			rate: 1,
			stepOnly: true,
		};
		expect(replayPositionAt(data, clock, 1000)).toBe(0.42);
		expect(replayPositionAt(data, clock, 5000)).toBeCloseTo(300 / 390);
		expect(replayPositionAt(data, clock, 14000)).toBe(1);
	});
});
