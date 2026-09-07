import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start/server-only", () => ({}));

import { optionPrintScenarios } from "@/content/scenarios/option-print";
import {
	assessAttempt,
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "./engine";
import type { AttemptState, LearningAction } from "./types";

describe("option print learning contract", () => {
	const scenario = optionPrintScenarios[0];
	function apply(state: AttemptState, ...actions: LearningAction[]) {
		return actions.reduce(
			(current, action) => transitionAttempt(scenario, current, action),
			state,
		);
	}
	function guidedComplete() {
		let state = apply(
			initialAttemptState(),
			{ type: "answer", questionId: "first-claim", choiceId: "bullish" },
			{ type: "submit" },
			{ type: "continue" },
		);
		state = apply(
			state,
			...["quote-clock", "neighboring-prints", "position-context"].map(
				(evidenceId): LearningAction => ({ type: "inspect", evidenceId }),
			),
			{ type: "hint" },
		);
		return apply(
			state,
			{ type: "answer", questionId: "aggressor", choiceId: "unresolved" },
			{ type: "answer", questionId: "intent", choiceId: "position" },
			{ type: "answer", questionId: "next-check", choiceId: "matched-quote" },
			{ type: "submit" },
			{ type: "continue" },
		);
	}
	function independentReady() {
		return apply(
			guidedComplete(),
			{ type: "inspect", evidenceId: "case-record" },
			{ type: "answer", questionId: "execution-side", choiceId: "seller" },
			{ type: "answer", questionId: "execution-premium", choiceId: "premium" },
			{ type: "answer", questionId: "claim-boundary", choiceId: "unknown" },
		);
	}

	it("does not send answer keys, unrevealed timing, or future case data", () => {
		const first = JSON.stringify(
			projectAttempt(scenario, initialAttemptState(), "id", 0),
		);
		for (const privateText of [
			"accepted",
			"explanation",
			"90 seconds",
			"10:00:30",
			"BETA",
			"case-record",
		])
			expect(first).not.toContain(privateText);
		const guided = apply(
			initialAttemptState(),
			{ type: "answer", questionId: "first-claim", choiceId: "execution" },
			{ type: "submit" },
			{ type: "continue" },
		);
		expect(
			JSON.stringify(projectAttempt(scenario, guided, "id", 2)),
		).not.toContain("10:00:30");
		const inspected = apply(guided, {
			type: "inspect",
			evidenceId: "quote-clock",
		});
		expect(
			JSON.stringify(projectAttempt(scenario, inspected, "id", 3)),
		).toContain("10:00:30");
		expect(
			JSON.stringify(projectAttempt(scenario, inspected, "id", 3)),
		).not.toContain("2,400");
	});

	it("requires current-stage choices and inspected evidence; committed answers cannot be rewritten", () => {
		expect(() => apply(initialAttemptState(), { type: "continue" })).toThrow();
		expect(() => apply(initialAttemptState(), { type: "submit" })).toThrow();
		expect(() =>
			apply(initialAttemptState(), {
				type: "inspect",
				evidenceId: "case-record",
			}),
		).toThrow();
		expect(() =>
			apply(initialAttemptState(), {
				type: "answer",
				questionId: "first-claim",
				choiceId: "unknown",
			}),
		).toThrow();
		const committed = apply(
			initialAttemptState(),
			{ type: "answer", questionId: "first-claim", choiceId: "bullish" },
			{ type: "submit" },
		);
		expect(() =>
			apply(committed, {
				type: "answer",
				questionId: "first-claim",
				choiceId: "execution",
			}),
		).toThrow();
		const notInspected = { ...independentReady(), inspected: {} };
		expect(() => apply(notInspected, { type: "submit" })).toThrow();
	});

	it("records improvement after an incorrect initial judgment; guided help does not invalidate independent work", () => {
		const state = apply(independentReady(), { type: "submit" });
		expect(assessAttempt(scenario, state)).toEqual({
			status: "demonstrated",
			met: 3,
			total: 3,
			usedHint: false,
		});
		expect(
			projectAttempt(scenario, state, "id", 12).initialJudgment?.en,
		).toContain("opened a bullish position");
		expect(() => apply(state, { type: "continue" })).toThrow();
	});

	it("requires every independent criterion and records independent hints as practice", () => {
		const wrong = apply(
			independentReady(),
			{ type: "answer", questionId: "claim-boundary", choiceId: "forecast" },
			{ type: "submit" },
		);
		expect(assessAttempt(scenario, wrong)).toMatchObject({
			status: "practiced",
			met: 2,
			total: 3,
		});
		const hinted = apply(
			independentReady(),
			{ type: "hint" },
			{ type: "submit" },
		);
		expect(assessAttempt(scenario, hinted)).toMatchObject({
			status: "practiced",
			met: 3,
			usedHint: true,
		});
		expect(assessAttempt(scenario, independentReady())).toBeNull();
	});

	it("the alternate case grades a midpoint execution differently", () => {
		const alternate = optionPrintScenarios[1];
		const state = independentReady();
		const wrong = transitionAttempt(alternate, state, { type: "submit" });
		expect(assessAttempt(alternate, wrong)).toMatchObject({
			status: "practiced",
			met: 2,
		});
		const correct = transitionAttempt(
			alternate,
			transitionAttempt(alternate, state, {
				type: "answer",
				questionId: "execution-side",
				choiceId: "uncertain",
			}),
			{ type: "submit" },
		);
		expect(assessAttempt(alternate, correct)?.status).toBe("demonstrated");
	});

	it("both authored cases have valid evidence references, independent rubrics and bilingual copy", () => {
		function checkCopy(value: unknown): void {
			if (Array.isArray(value)) {
				value.forEach(checkCopy);
				return;
			}
			if (!value || typeof value !== "object") return;
			if ("en" in value) {
				expect(value.en).toBeTruthy();
				expect("zh" in value && value.zh).toBeTruthy();
			}
			Object.values(value).forEach(checkCopy);
		}
		for (const item of optionPrintScenarios) {
			checkCopy(item);
			expect(new Set(item.steps.map((step) => step.id)).size).toBe(
				item.steps.length,
			);
			expect(item.steps.at(-1)?.kind).toBe("independent");
			for (const step of item.steps) {
				for (const id of step.requiredEvidence)
					expect(step.evidence.some((evidence) => evidence.id === id)).toBe(
						true,
					);
				for (const question of step.questions) {
					expect(question.accepted.length).toBeGreaterThan(0);
					for (const accepted of question.accepted)
						expect(
							question.choices.some((choice) => choice.id === accepted),
						).toBe(true);
				}
			}
		}
	});
});
