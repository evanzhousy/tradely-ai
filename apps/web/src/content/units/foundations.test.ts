import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start/server-only", () => ({}));

import { getLessonScenarios, getScenario } from "../scenarios/index.server";
import { foundationUnits } from "./foundations.server";

describe("contract foundations revision", () => {
	it("starts every case with identity and premium calculated from explicit execution units", () => {
		const unit = foundationUnits[0];
		for (let variant = 0; variant < 4; variant++) {
			const lessonCase = unit.case(variant);
			expect(lessonCase.questions.map((question) => question.id)).toEqual([
				"identity",
				"premium",
				"deliverable",
			]);
			expect(lessonCase.questions[0].accepted).toEqual(["different"]);
			const contracts = Number(lessonCase.facts?.[0].value.en);
			const price = Number(lessonCase.facts?.[1].value.en);
			expect(lessonCase.questions[1].accepted).toEqual([
				String(contracts * price * 100),
			]);
			expect(lessonCase.questions[1].input).toMatchObject({
				kind: "number",
				unit: { en: "USD", zh: "美元" },
			});
		}
	});
	it("issues version 3 while retaining the original rubric for saved version 2 work", () => {
		for (const scenario of getLessonScenarios("option-contracts")) {
			expect(scenario.version).toBe(3);
			const previous = getScenario("option-contracts", scenario.id, 2);
			expect(previous?.steps[1].questions[0]).toMatchObject({
				id: "market-cap",
				accepted: ["100"],
			});
			expect(
				previous?.steps[1].questions.map((question) => question.id),
			).toEqual(["market-cap", "deliverable", "identity"]);
			expect(scenario.steps[1].questions[0].id).toBe("identity");
		}
	});
});
