import { z } from "zod";

const text = z.string().trim().min(1).max(600);
const references = z.array(z.string().max(100)).min(1).max(4);
export const coachingFeedbackSchema = z
	.object({
		schemaVersion: z.literal(1),
		strengths: z
			.array(z.object({ text, referenceIds: references }).strict())
			.max(2),
		gaps: z
			.array(
				z
					.object({
						criterionId: z.string().max(60),
						text,
						referenceIds: references,
					})
					.strict(),
			)
			.max(2),
		question: text.nullable(),
		nextAction: z.enum(["revise", "continue"]),
		revisionSummary: text.nullable(),
	})
	.strict();
export type CoachingFeedback = z.infer<typeof coachingFeedbackSchema>;
export type CoachingRound = "initial" | "revision";
export type CoachingReference = { id: string; label: string; text: string };
export type CoachingSnapshot = {
	schemaVersion: 1;
	lessonId: string;
	scenarioId: string;
	scenarioVersion: number;
	attemptRevision: number;
	stepId: string;
	rubricVersion: number;
	locale: "en" | "zh";
	reason: string;
	answers: Array<{ question: string; answer: string; checked: boolean | null }>;
	references: CoachingReference[];
	criteria: Array<{ id: string; guidance: string }>;
};
export type CoachingSnapshotView = Omit<
	CoachingSnapshot,
	"criteria" | "rubricVersion"
>;
export function projectCoachingSnapshot(
	snapshot: CoachingSnapshot | null,
): CoachingSnapshotView | null {
	if (!snapshot) return null;
	return {
		schemaVersion: snapshot.schemaVersion,
		lessonId: snapshot.lessonId,
		scenarioId: snapshot.scenarioId,
		scenarioVersion: snapshot.scenarioVersion,
		attemptRevision: snapshot.attemptRevision,
		stepId: snapshot.stepId,
		locale: snapshot.locale,
		reason: snapshot.reason,
		answers: snapshot.answers,
		references: snapshot.references,
	};
}
export const coachingFailureSchema = z.enum([
	"signed_out",
	"access_denied",
	"unavailable",
	"not_found",
	"disabled",
	"not_eligible",
	"invalid_action",
	"conflict",
	"retired",
	"incomplete",
	"quota_exceeded",
	"budget_exceeded",
	"context_too_large",
	"invalid_output",
	"indeterminate",
	"deleted",
]);
export type CoachingFailure = z.infer<typeof coachingFailureSchema>;
export type CoachingGenerationView = {
	id: string;
	round: CoachingRound;
	status: "running" | "succeeded" | "failed" | "indeterminate";
	feedback: CoachingFeedback | null;
	error: CoachingFailure | null;
};
export type CoachingSessionView = {
	id: string;
	revision: number;
	locale: "en" | "zh";
	draftReason: string;
	initial: CoachingSnapshotView | null;
	revised: CoachingSnapshotView | null;
	generations: CoachingGenerationView[];
	deleted: boolean;
	stale: boolean;
};
export type CoachingView = {
	available: boolean;
	reason: CoachingFailure | null;
	reasonQuestionId: string | null;
	session: CoachingSessionView | null;
};
export type CoachingResponse =
	| { ok: true; view: CoachingView }
	| { ok: false; reason: CoachingFailure };

export const coachingIdentitySchema = z
	.object({
		lessonId: z
			.string()
			.min(1)
			.max(100)
			.regex(/^[a-z0-9-]+$/),
		attemptId: z.string().uuid(),
	})
	.strict();
export const coachingCommandSchema = coachingIdentitySchema
	.extend({
		attemptRevision: z.number().int().nonnegative(),
		sessionRevision: z.number().int().nonnegative().nullable(),
		commandId: z.string().uuid(),
		locale: z.enum(["en", "zh"]),
		action: z.discriminatedUnion("type", [
			z
				.object({ type: z.literal("save"), reason: z.string().max(1800) })
				.strict(),
			z
				.object({
					type: z.literal("review"),
					round: z.enum(["initial", "revision"]),
				})
				.strict(),
			z.object({ type: z.literal("delete") }).strict(),
		]),
	})
	.strict();
export type CoachingIdentity = z.infer<typeof coachingIdentitySchema>;
export type CoachingCommand = z.infer<typeof coachingCommandSchema>;

export class CoachingError extends Error {
	constructor(public readonly reason: CoachingFailure) {
		super(reason);
	}
}
