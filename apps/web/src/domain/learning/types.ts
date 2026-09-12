import { z } from "zod";
import type { ActivityConceptData } from "./activity-concept";
import type { BoundaryConceptData } from "./boundary-concept";
import type { CharmVannaConceptData } from "./charm-vanna-concept";
import type { ContractNeighborhood, NeighborhoodPair } from "./contracts";
import type { DeltaConceptData } from "./delta-concept";
import type { EligibilityConceptData } from "./eligibility-concept";
import type { ExecutionConceptData } from "./execution-concept";
import type { FlowImpactConceptData } from "./flow-impact-concept";
import type { FlowStructureComparison } from "./flow-structure";
import type { GammaConceptData } from "./gamma-concept";
import type { GexConceptData } from "./gex-concept";
import type { IvRankConceptData } from "./iv-rank-concept";
import type { LevelsConceptData } from "./levels-concept";
import type { MetricsComparison } from "./metrics";
import type { NeighborhoodConceptData } from "./neighborhood-concept";
import type { OiConceptData } from "./oi-concept";
import type { PointTimeConceptData } from "./point-time-concept";
import type { PrintReviewConceptData } from "./print-review-concept";
import type { QuoteConceptData } from "./quote-concept";
import type { RankSymbolConceptData } from "./rank-symbol-concept";
import type { RegimeConceptData } from "./regime-concept";
import type { SentimentConceptData } from "./sentiment-concept";
import type { SideConceptData } from "./side-concept";
import type { SourceConceptData } from "./source-concept";
import type { StrategyConceptData } from "./strategy-concept";
import type { SurfaceConceptData } from "./surface-concept";
import type { TapeConceptData } from "./tape-concept";
import type { TimeVolRateConceptData } from "./time-vol-rate-concept";
import type { UniverseComparison } from "./universe";
import type { VolatilityConceptData } from "./volatility-concept";

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
	input?:
		| { kind: "number"; unit: LearningCopy }
		| { kind: "text"; minLength: number; maxLength: number };
};

export function numericResponse(value: string): number | null {
	const normalized = value.trim().replace(/^−/, "-");
	if (!/^[+-]?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d*)?|\.\d+)$/.test(normalized))
		return null;
	const number = Number(normalized.replaceAll(",", ""));
	return Number.isFinite(number) ? number : null;
}
export function responseComplete(
	question: LearningQuestion,
	value: string | undefined,
) {
	if (value === undefined) return false;
	if (question.input?.kind === "text")
		return (
			value.trim().length >= question.input.minLength &&
			value.length <= question.input.maxLength
		);
	if (question.input?.kind === "number") return numericResponse(value) !== null;
	return question.choices.some((choice) => choice.id === value);
}

const copySchema = z
	.object({ en: z.string().max(500), zh: z.string().max(500) })
	.strict();
const worksheetSchema = z
	.object({
		columns: z.array(copySchema).max(12),
		rows: z.array(z.array(z.string().max(200)).max(12)).max(100),
		caption: copySchema,
		chart: z
			.object({
				labelColumn: z.number().int().min(0).max(11),
				valueColumn: z.number().int().min(0).max(11),
				unit: copySchema,
			})
			.strict()
			.optional(),
	})
	.strict();
export const sourceWorkSchema = z
	.object({
		caseVariant: z.number().int().min(1).max(3).optional(),
		evidence: worksheetSchema.optional(),
		lessonId: z.string().max(100),
		attemptId: z.string().max(100),
		scenarioVersion: z.number().int().positive(),
		submittedAt: z.string().max(50),
		fields: z
			.array(
				z
					.object({
						label: copySchema,
						value: z.string().max(2000),
						localizedValue: copySchema.optional(),
					})
					.strict(),
			)
			.max(24),
	})
	.strict();
export type SourceWork = z.infer<typeof sourceWorkSchema>;

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
	/** Ungraded teaching interaction; access follows the lesson authorization. */
	conceptLab?:
		| "option-contracts"
		| "option-rights"
		| "premium-payoff"
		| "expiration-settlement"
		| "quotes-orders-trades"
		| "execution-counterparties"
		| "execution-side"
		| "flow-sentiment"
		| "validate-option-print"
		| "session-flow-vs-structure"
		| "trade-records"
		| "unusual-activity"
		| "option-strategies"
		| "symbol-drawer"
		| "delta"
		| "gamma"
		| "theta-vega-rho"
		| "implied-realized-volatility"
		| "volatility-surface"
		| "iv-rank-percentile"
		| "dex-dei-gex"
		| "gamma-exposure"
		| "gamma-regimes"
		| "structural-levels"
		| "charm-vanna"
		| "audited-boundary"
		| "symbol-universe"
		| "rank-symbols"
		| "rank-contracts"
		| "point-in-time-research";
	conceptData?:
		| QuoteConceptData
		| ExecutionConceptData
		| SideConceptData
		| SentimentConceptData
		| PrintReviewConceptData
		| OiConceptData
		| TapeConceptData
		| ActivityConceptData
		| StrategyConceptData
		| SourceConceptData
		| DeltaConceptData
		| GammaConceptData
		| TimeVolRateConceptData
		| VolatilityConceptData
		| SurfaceConceptData
		| IvRankConceptData
		| FlowImpactConceptData
		| GexConceptData
		| RegimeConceptData
		| LevelsConceptData
		| CharmVannaConceptData
		| BoundaryConceptData
		| EligibilityConceptData
		| RankSymbolConceptData
		| NeighborhoodConceptData
		| PointTimeConceptData;
	neighborhood: ContractNeighborhood | null;
	flowStructure: FlowStructureComparison | null;
	neighborhoodPair?: NeighborhoodPair | null;
	metrics?: MetricsComparison | null;
	universe?: UniverseComparison | null;
	execution?: {
		mode: "quote" | "counterparties" | "side" | "sentiment";
		optionType: "CALL" | "PUT";
		incoming?: "buy" | "sell";
	};
	worksheet?: {
		columns: LearningCopy[];
		rows: string[][];
		caption: LearningCopy;
		chart?: { labelColumn: number; valueColumn: number; unit: LearningCopy };
	};
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
	.record(identifier, z.string().max(2000))
	.refine((value) => Object.keys(value).length <= 12);
export const learningActionSchema = z.discriminatedUnion("type", [
	z
		.object({
			type: z.literal("answer"),
			questionId: identifier,
			choiceId: identifier,
		})
		.strict(),
	z
		.object({
			type: z.literal("respond"),
			questionId: identifier,
			value: z.string().max(2000),
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
		sourceWork: sourceWorkSchema.optional(),
	})
	.strict();
export type AttemptState = z.infer<typeof attemptStateSchema>;

export type CriterionFeedback = {
	questionId: string;
	prompt: LearningCopy;
	selected: LearningCopy;
	met: boolean;
	explanation: LearningCopy;
	reviewRequired?: boolean;
};
export const learningResultSchema = z
	.object({
		status: z.enum(["practiced", "demonstrated"]),
		met: z.number().int().nonnegative(),
		total: z.number().int().positive(),
		usedHint: z.boolean(),
		unreviewed: z.number().int().nonnegative().optional(),
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
	stepKinds?: LearningStepView["kind"][];
	phase: AttemptState["phase"];
	step: LearningStepView;
	answers: Record<string, string>;
	initialJudgment: LearningCopy | null;
	feedback: CriterionFeedback[];
	result: LearningResult | null;
	sourceWork?: SourceWork;
	work?: SourceWork;
	archived?: boolean;
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
