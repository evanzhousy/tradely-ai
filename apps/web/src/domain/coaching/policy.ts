import type { LearningView } from "@/domain/learning/types";
import { responseComplete } from "@/domain/learning/types";
import {
	CoachingError,
	type CoachingSnapshot,
	type CoachingSnapshotView,
	coachingFeedbackSchema,
} from "./types";

export const COACH_LESSON_IDS = [
	"audited-boundary",
	"rank-symbols",
	"rank-contracts",
] as const;
export const isCoachingLesson = (id: string) =>
	COACH_LESSON_IDS.some((lesson) => lesson === id);

export function canCoach(view: LearningView) {
	return (
		!view.archived && view.phase === "answer" && view.step.kind === "guided"
	);
}
export function requireCoachable(view: LearningView) {
	if (!canCoach(view))
		throw new CoachingError(view.archived ? "retired" : "invalid_action");
	if (
		!view.step.questions.every((q) =>
			responseComplete(q, view.answers[q.id]),
		) ||
		!view.step.evidence.every((e) => !e.required || e.detail)
	)
		throw new CoachingError("incomplete");
}
export function validateFeedback(
	value: unknown,
	snapshot: CoachingSnapshot,
	round: "initial" | "revision",
) {
	const parsed = coachingFeedbackSchema.safeParse(value);
	if (!parsed.success) throw new CoachingError("invalid_output");
	const feedback = parsed.data;
	const allowed = new Set(snapshot.references.map((r) => r.id));
	const criteria = new Set(snapshot.criteria.map((c) => c.id));
	if (
		[...feedback.strengths, ...feedback.gaps].some((item) =>
			item.referenceIds.some((id) => !allowed.has(id)),
		) ||
		feedback.gaps.some((g) => !criteria.has(g.criterionId)) ||
		(round === "initial" && feedback.revisionSummary !== null)
	)
		throw new CoachingError("invalid_output");
	return feedback;
}

/** An input change is evidence, not permission to overwrite the first snapshot. */
export function sameWork(a: CoachingSnapshotView, b: CoachingSnapshotView) {
	// PostgreSQL JSONB reorders object keys. Compare values in an explicit canonical order.
	const work = (snapshot: CoachingSnapshotView) =>
		JSON.stringify({
			reason: snapshot.reason,
			answers: snapshot.answers.map((answer) => [
				answer.question,
				answer.answer,
				answer.checked,
			]),
		});
	return work(a) === work(b);
}
