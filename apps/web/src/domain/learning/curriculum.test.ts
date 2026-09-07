import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start/server-only", () => ({}));

import { tradingFlowCourse } from "@/content/course";
import { learningRollout } from "@/content/learning-rollout";
import { getLessonScenarios } from "@/content/scenarios/index.server";
import { callMoneyness } from "./contracts";
import {
	assessAttempt,
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "./engine";
import { deiMagnitude, gexTotal } from "./metrics";
import { rankUniverse } from "./universe";

function required<T>(value: T | undefined | null): T {
	if (value === undefined || value === null)
		throw new Error("Required fixture value missing");
	return value;
}

describe("curriculum teaching contracts", () => {
	it.each(tradingFlowCourse.lessons.map((lesson) => lesson.id))(
		"has reachable bilingual assessments without leaking rubrics: %s",
		(lessonId) => {
			expect(learningRollout[lessonId]).toBeTruthy();
			const scenarios = getLessonScenarios(lessonId);
			expect(scenarios).toHaveLength(2);
			for (const scenario of scenarios) {
				let state = initialAttemptState();
				for (const step of scenario.steps) {
					const projected = JSON.stringify(
						projectAttempt(scenario, state, "attempt", 0),
					);
					expect(projected).not.toContain('"accepted"');
					expect(projected).not.toContain('"explanation"');
					for (const evidence of step.evidence) {
						expect(
							projectAttempt(scenario, state, "attempt", 0).step.evidence.find(
								(item) => item.id === evidence.id,
							)?.detail,
						).toBeNull();
						state = transitionAttempt(scenario, state, {
							type: "inspect",
							evidenceId: evidence.id,
						});
					}
					for (const question of step.questions) {
						expect(question.prompt.zh).toBeTruthy();
						expect(question.explanation.zh).toBeTruthy();
						expect(
							new Set(question.choices.map((choice) => choice.id)).size,
						).toBe(question.choices.length);
						expect(
							question.choices.every(
								(choice) => choice.label.en && choice.label.zh,
							),
						).toBe(true);
						state = transitionAttempt(scenario, state, {
							type: "answer",
							questionId: question.id,
							choiceId: question.accepted[0],
						});
					}
					state = transitionAttempt(scenario, state, { type: "submit" });
					if (state.phase !== "complete")
						state = transitionAttempt(scenario, state, { type: "continue" });
				}
				expect(assessAttempt(scenario, state)?.status).toBe("demonstrated");
				const final = required(scenario.steps.at(-1));
				const missed = {
					...state,
					answers: {
						...state.answers,
						[final.id]: {
							...state.answers[final.id],
							[final.questions[0].id]: required(
								final.questions[0].choices.find(
									(choice) => !final.questions[0].accepted.includes(choice.id),
								),
							).id,
						},
					},
				};
				expect(assessAttempt(scenario, missed)?.status).toBe("practiced");
			}
		},
	);
	it("teaches magnitude separately from direction and rejects non-positive denominators", () => {
		expect(deiMagnitude(-60000, 1000000)).toBe(6);
		expect(deiMagnitude(-60000, 2000000)).toBe(3);
		expect(deiMagnitude(50000, 0)).toBeNull();
		expect(deiMagnitude(0, 1000000)).toBe(0);
		expect(deiMagnitude(50000, -1)).toBeNull();
	});
	it("equal complete GEX totals hide opposite near-expiry signs, and missing is never zero", () => {
		const guided = required(
			getLessonScenarios("dex-dei-gex")[0].steps[1].metrics,
		);
		const [a, b] = guided.distributions;
		expect(gexTotal(a.cells)).toBe(100);
		expect(gexTotal(b.cells)).toBe(100);
		expect(gexTotal(a.cells.filter((cell) => cell.days === 7))).toBe(-150);
		expect(gexTotal(b.cells.filter((cell) => cell.days === 7))).toBe(40);
		const transfer = required(
			getLessonScenarios("dex-dei-gex")[1].steps[2].metrics,
		);
		expect(gexTotal(transfer.distributions[1].cells)).toBeNull();
	});
	it("equal contract peaks do not establish equal neighborhood breadth or moneyness", () => {
		for (const scenario of getLessonScenarios("rank-contracts")) {
			const stage = required(scenario.steps.at(-1));
			const pair = required(stage.neighborhoodPair);
			expect(
				pair.cases.map((item) =>
					Math.max(...item.data.contracts.map((cell) => cell.volume ?? 0)),
				),
			).toEqual([3000, 3000]);
			expect(
				new Set(
					pair.cases.map(
						(item) =>
							item.data.contracts.filter((cell) => (cell.volume ?? 0) > 0)
								.length,
					),
				).size,
			).toBe(2);
			expect(stage.questions[1].accepted).toEqual([
				callMoneyness(105, required(pair.cases[0].data.spot)),
			]);
		}
	});
	it("rank changes with peer observations while the focal volume remains fixed", () => {
		const data = required(
			getLessonScenarios("rank-symbols")[0].steps[1].universe,
		);
		const admitted = data.rows
			.filter((row) => row.eligible)
			.map((row) => row.symbol);
		const original = rankUniverse(data, admitted, false);
		const changed = rankUniverse(data, admitted, true);
		expect(original[2].symbol).toBe("ALFA");
		expect(changed[0].symbol).toBe("ALFA");
		expect(original[2].value).toBe(changed[0].value);
	});
});
