import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start/server-only", () => ({}));

import { sessionFlowScenarios } from "@/content/scenarios/session-flow";
import {
	assessAttempt,
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "./engine";
import { reportedOiChange, sampleSessionVolume } from "./flow-structure";

const data = sessionFlowScenarios[0].steps[0].flowStructure;
if (!data) throw new Error("Missing flow fixture");

describe("flow and structure clocks", () => {
	it("replays exact volume checkpoints, rewinds deterministically, and leaves report snapshots intact", () => {
		const original = JSON.stringify(data);
		for (const frame of data.replay.frames)
			expect(sampleSessionVolume(data, frame.position)).toBe(frame.volume);
		let previous = 0;
		for (let index = 0; index <= 200; index++) {
			const volume = sampleSessionVolume(data, index / 200);
			expect(volume).toBeGreaterThanOrEqual(previous);
			previous = volume;
		}
		expect(sampleSessionVolume(data, 150 / 390)).toBe(2100);
		expect(sampleSessionVolume(data, -1)).toBe(0);
		expect(sampleSessionVolume(data, 2)).toBe(8400);
		expect(JSON.stringify(data)).toBe(original);
		expect(reportedOiChange(data)).toBe(-200);
	});
	it("does not fabricate a delta from mismatched scopes, missing data, or reversed dates", () => {
		const alternate = sessionFlowScenarios[1].steps[2].flowStructure;
		if (!alternate) throw new Error("Missing alternate");
		expect(reportedOiChange(alternate)).toBeNull();
		expect(alternate.gex.value).toBeNull();
		expect(reportedOiChange({ ...data, previousOi: null })).toBeNull();
		expect(
			reportedOiChange({
				...data,
				reportedOi: { ...data.reportedOi, value: null },
			}),
		).toBeNull();
		expect(
			reportedOiChange({
				...data,
				previousOi: { ...data.reportedOi, asOf: "2026-09-04" },
			}),
		).toBeNull();
		expect(
			reportedOiChange({
				...data,
				previousOi: { ...data.reportedOi, value: 12000, asOf: "2026-09-01" },
			}),
		).toBe(0);
	});
	it("projects only the current case, and keeps unopened evidence and rubrics on the server", () => {
		const scenario = sessionFlowScenarios[0];
		const first = JSON.stringify(
			projectAttempt(scenario, initialAttemptState(), "attempt", 0),
		);
		for (const privateText of ["BETA", "accepted", "explanation", "oi-reports"])
			expect(first).not.toContain(privateText);
	});
	it.each([0, 1])(
		"grades independent report reasoning for variant %i and rejects memorizing the other variant",
		(variant) => {
			const scenario = sessionFlowScenarios[variant];
			let state = initialAttemptState();
			for (const step of scenario.steps) {
				for (const id of step.requiredEvidence)
					state = transitionAttempt(scenario, state, {
						type: "inspect",
						evidenceId: id,
					});
				for (const question of step.questions)
					state = transitionAttempt(scenario, state, {
						type: "answer",
						questionId: question.id,
						choiceId: question.accepted[0],
					});
				if (step.kind === "independent") {
					const wrong = transitionAttempt(scenario, state, {
						type: "answer",
						questionId: "report-change",
						choiceId: variant === 0 ? "scope-mismatch" : "minus-400",
					});
					expect(
						assessAttempt(
							scenario,
							transitionAttempt(scenario, wrong, { type: "submit" }),
						),
					).toMatchObject({ status: "practiced", met: 2, total: 3 });
				}
				state = transitionAttempt(scenario, state, { type: "submit" });
				if (state.phase !== "complete")
					state = transitionAttempt(scenario, state, { type: "continue" });
			}
			expect(assessAttempt(scenario, state)).toEqual({
				status: "demonstrated",
				met: 3,
				total: 3,
				usedHint: false,
			});
		},
	);
});
