/** Synthetic test/preview records. Never imported by runtime services. */
import type { LessonAttempt } from "@tradely/db";
import { getLessonScenarios } from "@/content/scenarios/index.server";
import {
	initialAttemptState,
	transitionAttempt,
} from "@/domain/learning/engine";
import { referenceAction } from "@/domain/learning/test-helpers";
import type { CoachingFeedback, CoachingSnapshot } from "./types";

export const exampleReason =
	"The evidence supports comparison within the stated session and scope. It does not establish future price or who owns the position.";
export function guidedRecord(
	lessonId = "rank-symbols",
	id = "11111111-1111-4111-8111-111111111111",
): LessonAttempt {
	const scenario = getLessonScenarios(lessonId)[0];
	let state = transitionAttempt(scenario, initialAttemptState(), {
		type: "continue",
	});
	for (const question of scenario.steps[1].questions)
		state = transitionAttempt(scenario, state, referenceAction(question));
	return {
		id,
		userId: "learner-a",
		lessonId,
		scenarioId: scenario.id,
		scenarioVersion: scenario.version,
		status: "in_progress",
		revision: 0,
		state,
		assessment: null,
		lastCommandId: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		submittedAt: null,
	};
}
export function exampleFeedback(
	snapshot: CoachingSnapshot,
	revision = false,
): CoachingFeedback {
	const zh = snapshot.locale === "zh";
	return {
		schemaVersion: 1,
		strengths: [],
		gaps: [
			{
				criterionId: snapshot.criteria[0].id,
				text: zh
					? "请明确使用了哪项比较依据。"
					: "Name the comparison evidence you used.",
				referenceIds: ["case"],
			},
		],
		question: zh
			? "哪项证据能支持这个比较？"
			: "Which evidence supports this comparison?",
		nextAction: "revise",
		revisionSummary: revision
			? zh
				? "你补充了本次比较的依据。"
				: "You added evidence for this comparison."
			: null,
	};
}
