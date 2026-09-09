import "@tanstack/react-start/server-only";
import type { LearningCopy } from "@/domain/learning/types";

type CoachingLesson = {
	version: number;
	reasonQuestionId: string | null;
	criteria: Array<{ id: string; guidance: LearningCopy }>;
};
const rule = (id: string, en: string, zh: string) => ({
	id,
	guidance: { en, zh },
});
const lessons: Record<string, CoachingLesson> = {
	"audited-boundary": {
		version: 1,
		reasonQuestionId: "question",
		criteria: [
			rule(
				"scope",
				"Name the instrument population, measure, source and cutoff. Accept valid alternative wording.",
				"明确工具范围、测量量、来源与截止时间，接受有效的不同表述。",
			),
			rule(
				"invalidation",
				"Identify a specific evidence failure that would require revising this question or limiting its answer.",
				"指出哪项具体证据失效会要求修订问题或限制结论。",
			),
		],
	},
	"rank-symbols": {
		version: 1,
		reasonQuestionId: null,
		criteria: [
			rule(
				"comparison",
				"Compare activity to each symbol's own comparable-session baseline, not just raw volume.",
				"与各标的自身可比时段基准比较，不能只比较原始成交量。",
			),
			rule(
				"claim-boundary",
				"Explain why a candidate deserves inspection without turning rank into a forecast or trade recommendation.",
				"说明候选值得检查的依据，不能把名次当作预测或买卖建议。",
			),
		],
	},
	"rank-contracts": {
		version: 1,
		reasonQuestionId: null,
		criteria: [
			rule(
				"fixed-grid",
				"Compare observed breadth in the complete fixed closing grids. Display slices and interpolated replay are not new observations.",
				"比较固定收盘完整网格的观测广度，显示切片与回放插值不是新观测。",
			),
			rule(
				"claim-boundary",
				"Distinguish peak, total, breadth and moneyness; do not infer ownership, future price or intent from these alone.",
				"区分峰值、总量、广度与价内外，不能单凭这些断言归属、未来价格或意图。",
			),
		],
	},
};
export const getCoachingLesson = (id: string) => lessons[id] ?? null;
