import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start/server-only", () => ({}));

import {
	assessAttempt,
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import { referenceAction } from "@/domain/learning/test-helpers";
import { foundationIntroductions } from "../foundation-introductions";
import { getLessonScenarios, getScenario } from "../scenarios/index.server";
import { foundationUnits } from "./foundations.server";

describe("foundation application and edition history", () => {
	it("changes the identity decision, not just prices, across independent cases", () => {
		const unit = foundationUnits[0];
		expect(
			[0, 1, 2, 3].map((v) => unit.case(v).questions[0].accepted[0]),
		).toEqual(["different", "same", "unknown", "different"]);
		expect(unit.case(1).questions[1].accepted).toEqual(["105"]); // 7 × $1.50 × 10 supplied shares
		expect(unit.case(1).questions[2].accepted).toEqual(["70"]);
		expect(
			unit
				.case(2)
				.questions.slice(1)
				.every((q) => q.accepted[0] === "unknown"),
		).toBe(true);
	});
	it("cannot pass the identity check by repeating the guided response", () => {
		const scenario = getLessonScenarios("option-contracts")[0];
		let state = initialAttemptState();
		for (const step of scenario.steps) {
			for (const q of step.questions)
				state = transitionAttempt(
					scenario,
					state,
					step.kind === "independent" && q.id === "identity"
						? { type: "answer", questionId: q.id, choiceId: "different" }
						: referenceAction(q),
				);
			state = transitionAttempt(scenario, state, { type: "submit" });
			if (state.phase !== "complete")
				state = transitionAttempt(scenario, state, { type: "continue" });
		}
		expect(assessAttempt(scenario, state)).toMatchObject({
			status: "practiced",
			met: 2,
			total: 3,
		});
		expect(
			projectAttempt(scenario, state, "test", 0).feedback.find(
				(f) => f.questionId === "identity",
			)?.explanation.en,
		).toContain("observation time");
	});
	it("contrasts assignment with closing and includes fees, zero payoff and settlement references", () => {
		const rights = foundationUnits[1];
		expect(rights.case(1).questions.map((q) => q.accepted[0])).toEqual([
			"19500",
			"sell",
		]);
		expect(rights.case(2).questions.map((q) => q.accepted[0])).toEqual([
			"close-long",
			"500",
		]);
		expect(rights.case(3).questions[0].accepted).toEqual(["close-short"]);
		const payoff = foundationUnits[2];
		expect(payoff.case(1).questions.map((q) => q.accepted[0])).toEqual([
			"1200",
			"600",
			"-612",
			"itm",
		]);
		expect(payoff.case(2).questions.map((q) => q.accepted[0])).toEqual([
			"1000",
			"0",
			"-1000",
			"otm",
		]);
		const settlement = foundationUnits[3];
		expect(settlement.case(1).questions.map((q) => q.accepted[0])).toEqual([
			"200",
			"10000",
			"exercise",
		]);
		expect(settlement.case(2).questions.map((q) => q.accepted[0])).toEqual([
			"official",
			"1000",
			"cash",
		]);
		expect(settlement.case(3).questions[0].accepted).toEqual(["unknown"]);
	});
	it.each(foundationUnits.slice(0, 4).map((u) => u.id))(
		"keeps the old rubric and bilingual introduction for %s",
		(id) => {
			for (const scenario of getLessonScenarios(id)) {
				expect(scenario.version).toBe(4);
				const oldVersion = id === "option-contracts" ? 3 : 2;
				const old = getScenario(id, scenario.id, oldVersion);
				expect(old?.version).toBe(oldVersion);
				expect(old?.steps[1].questions).toEqual(scenario.steps[1].questions);
				expect(old?.steps[2].questions).not.toEqual(
					scenario.steps[2].questions,
				);
			}
			const intro = foundationIntroductions[id];
			for (const locale of ["en", "zh"] as const) {
				expect(intro.outcome[locale]).toBeTruthy();
				expect(intro.example[locale]).toBeTruthy();
				expect(intro.terms.every((t) => t.definition[locale])).toBe(true);
			}
		},
	);
	it("also retains version 2 of contract identity for earlier saved work", () => {
		const scenario = getLessonScenarios("option-contracts")[0];
		expect(
			getScenario("option-contracts", scenario.id, 2)?.steps[1].questions[0],
		).toMatchObject({ id: "market-cap", accepted: ["100"] });
	});
});
