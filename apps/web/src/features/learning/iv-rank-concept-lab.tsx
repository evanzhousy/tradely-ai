import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	IvRankData,
	RankCoverageScene,
	RankFrequencyScene,
	RankOutlierScene,
} from "./iv-rank-concept-scenes";

const scenes = [
	{
		id: "measures",
		label: ["Compare two measures", "比较两项指标"],
		title: ["A range position is not a frequency", "区间位置不是频率"],
		prompt: [
			"Move a hypothetical current IV while the history stays fixed. Watch range distance, below counts and ties separately.",
			"保持历史固定，移动假设当前 IV，分别观察区间距离、较低计数与相等值。",
		],
		demonstration: [
			[
				"Range location and historical frequency respond differently to the current IV.",
				"区间位置与历史频率，对当前 IV 的响应不同。",
			],
		],
		Component: RankFrequencyScene,
	},
	{
		id: "outlier",
		label: ["Change one extreme", "改变一个极端值"],
		title: [
			"One outlier can move rank much more than percentile",
			"一个极端值对 Rank 的影响可远大于百分位",
		],
		prompt: [
			"Replace only the high observation, keeping it above the fixed current IV. Replay the controlled values or drag directly.",
			"仅替换高值观测，并保持其高于固定当前 IV，回放控制值或直接拖动。",
		],
		demonstration: [
			[
				"One extreme observation stretches the range without adding many days below today's IV.",
				"一个极端值会拉长区间，却不会增加许多低于当前 IV 的日期。",
			],
		],
		Component: RankOutlierScene,
	},
	{
		id: "coverage",
		label: ["Audit the sample", "审计样本"],
		title: ["A percentage needs a defined history", "百分比需要定义明确的历史"],
		prompt: [
			"Compare shorter, flat, incomplete and incompatible histories. Check which statistics remain supported.",
			"比较较短、不变、不完整与不兼容历史，检查哪些统计量仍受支持。",
		],
		demonstration: [
			[
				"A percentage needs a defined reference, window, tie rule and adequate history.",
				"一个百分比需要明确参考、窗口、相等值规则与足够历史。",
			],
		],
		Component: RankCoverageScene,
	},
] as const satisfies readonly ConceptScene[];
export function IvRankConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "iv-rank-percentile")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<IvRankData value={data}>
			<ConceptLab
				locale={locale}
				id="iv-rank"
				label={[
					"Interactive IV rank and percentile lesson",
					"IV Rank 与百分位互动课堂",
				]}
				scenes={scenes}
			/>
		</IvRankData>
	);
}
