import { referenceAction } from "@/domain/learning/test-helpers";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start/server-only", () => ({}));

import { getLessonScenarios } from "@/content/scenarios/index.server";
import type { LearningAction } from "@/domain/learning/types";
import { previewLearningSchema } from "./learning";
import { previewLearningImpl } from "./preview-learning.server";

describe("public practice boundary", () => {
	it("rejects paid lesson IDs, invalid histories, and unbounded requests", () => {
		expect(
			previewLearningImpl({ lessonId: "dex-dei-gex", variant: 0, actions: [] }),
		).toEqual({ ok: false, reason: "access_denied" });
		expect(
			previewLearningImpl({
				lessonId: "audited-boundary",
				variant: 0,
				actions: [{ type: "answer", questionId: "forged", choiceId: "forged" }],
			}),
		).toEqual({ ok: false, reason: "invalid_action" });
		expect(
			previewLearningSchema.safeParse({
				lessonId: "audited-boundary",
				variant: 0,
				actions: Array(257).fill({ type: "hint" }),
			}).success,
		).toBe(false);
	});
	it.each(["audited-boundary", "symbol-universe", "rank-symbols"])(
		"grades a free lesson from validated actions without account storage: %s",
		(lessonId) => {
			const actions: LearningAction[] = [];
			const scenario = getLessonScenarios(lessonId)[1];
			for (const [index, step] of scenario.steps.entries()) {
				for (const evidenceId of step.requiredEvidence)
					actions.push({ type: "inspect", evidenceId });
				for (const question of step.questions)
					actions.push(referenceAction(question));
				actions.push({ type: "submit" });
				if (index < scenario.steps.length - 1)
					actions.push({ type: "continue" });
			}
			const response = previewLearningImpl({ lessonId, variant: 1, actions });
			expect(response).toMatchObject({
				ok: true,
				view: { attemptId: "preview", result: { status: lessonId === "audited-boundary" ? "practiced" : "demonstrated" } },
			});
			expect(
				previewLearningImpl({ lessonId, variant: 1, actions: [] }),
			).toMatchObject({ ok: true, view: { phase: "answer", result: null } });
		},
	);
});
