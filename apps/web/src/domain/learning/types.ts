import { z } from "zod";
import type { ContractNeighborhood } from "./contracts";
import type { FlowStructureComparison } from "./flow-structure";

export type LearningCopy = { en: string; zh: string };
export type LearningChoice = { id: string; label: LearningCopy };
export type LearningFact = { label: LearningCopy; value: LearningCopy };
export type LearningEvidence = {
	id: string;
	title: LearningCopy;
	facts: LearningFact[];
	note: LearningCopy;
};
export type LearningQuestion = {
	id: string;
	prompt: LearningCopy;
	choices: LearningChoice[];
};

/** Only this projection crosses the server boundary; it contains no answer key. */
export type LearningStepView = {
	id: string;
	kind: "prediction" | "guided" | "independent";
	title: LearningCopy;
	brief: LearningCopy;
	facts: LearningFact[];
	evidence: Array<{
		id: string;
		title: LearningCopy;
		required: boolean;
		detail: LearningEvidence | null;
	}>;
	questions: LearningQuestion[];
	hint: LearningCopy | null;
	neighborhood: ContractNeighborhood | null;
	flowStructure: FlowStructureComparison | null;
	quote: {
		bid: number;
		ask: number;
		trade: number;
		caption: LearningCopy;
	} | null;
};

const identifier = z
	.string()
	.min(1)
	.max(100)
	.regex(/^[a-z0-9-]+$/);
const answers = z
	.record(identifier, identifier)
	.refine((value) => Object.keys(value).length <= 12);
export const learningActionSchema = z.discriminatedUnion("type", [
	z
		.object({
			type: z.literal("answer"),
			questionId: identifier,
			choiceId: identifier,
		})
		.strict(),
	z.object({ type: z.literal("inspect"), evidenceId: identifier }).strict(),
	z.object({ type: z.literal("hint") }).strict(),
	z.object({ type: z.literal("submit") }).strict(),
	z.object({ type: z.literal("continue") }).strict(),
]);
export type LearningAction = z.infer<typeof learningActionSchema>;

export const attemptStateSchema = z
	.object({
		step: z.number().int().min(0).max(20),
		phase: z.enum(["answer", "feedback", "complete"]),
		answers: z.record(identifier, answers),
		inspected: z.record(identifier, z.array(identifier).max(12)),
		hinted: z.array(identifier).max(20),
	})
	.strict();
export type AttemptState = z.infer<typeof attemptStateSchema>;

export type CriterionFeedback = {
	questionId: string;
	prompt: LearningCopy;
	selected: LearningCopy;
	met: boolean;
	explanation: LearningCopy;
};
export const learningResultSchema = z
	.object({
		status: z.enum(["practiced", "demonstrated"]),
		met: z.number().int().nonnegative(),
		total: z.number().int().positive(),
		usedHint: z.boolean(),
	})
	.strict();
export type LearningResult = z.infer<typeof learningResultSchema>;
export type LearningView = {
	attemptId: string;
	scenarioId: string;
	scenarioVersion: number;
	lessonId: string;
	revision: number;
	stepIndex: number;
	stepCount: number;
	phase: AttemptState["phase"];
	step: LearningStepView;
	answers: Record<string, string>;
	initialJudgment: LearningCopy | null;
	feedback: CriterionFeedback[];
	result: LearningResult | null;
};

export type LearningFailure =
	| "access_denied"
	| "signed_out"
	| "unavailable"
	| "conflict"
	| "retired"
	| "invalid_action"
	| "not_found";
export type LearningResponse =
	| { ok: true; view: LearningView }
	| { ok: false; reason: LearningFailure };
