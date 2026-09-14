import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	HoldoutScene,
	KnowledgeCutoffScene,
	PointTimeData,
	RecencyDecayScene,
	ScoreMeaningScene,
} from "./point-time-concept-scenes";

const scenes = [
	{
		id: "cutoff",
		label: ["Respect the cutoff", "遵守截止"],
		title: ["An old event can be new information", "旧事件可以是新信息"],
		prompt: [
			"Move the decision cutoff. Compare event and receipt clocks, and inspect which revision is usable.",
			"移动决策截止，比较事件与接收时钟，检查可用版本。",
		],
		demonstration: [
			[
				"Records enter the replay when received, not merely when their event occurred.",
				"记录在被收到时进入回放，而不只是按事件发生时间进入。",
			],
		],
		Component: KnowledgeCutoffScene,
	},
	{
		id: "decay",
		label: ["Let weight decay", "观察权重衰减"],
		title: ["A score can fall without a new trade", "没有新成交，分数也可下降"],
		prompt: [
			"Replay elapsed time or change the half-life. Keep weighted activity separate from raw events and contracts.",
			"回放经过时间或改变半衰期，区分加权活动、原始事件与张数。",
		],
		demonstration: [
			[
				"A weighted score can decay with time while the original trade count stays unchanged.",
				"加权分数可随时间衰减，而原成交数量保持不变。",
			],
		],
		Component: RecencyDecayScene,
	},
	{
		id: "meaning",
		label: ["Read score meaning", "读取分数含义"],
		title: ["A percentile is not a probability", "百分位不是概率"],
		prompt: [
			"Inspect percentile, standardized score and outcome probability separately, then test the baseline requirements.",
			"分别检查百分位、标准分与结果概率，再检验基准要求。",
		],
		demonstration: [
			[
				"A percentile describes a position in a sample; it is not a probability of profit.",
				"百分位描述样本中的位置，不是盈利概率。",
			],
		],
		Component: ScoreMeaningScene,
	},
	{
		id: "holdout",
		label: ["Protect the holdout", "保护保留集"],
		title: [
			"An outcome-informed edit changes the test",
			"受结果影响的修改会改变检验",
		],
		prompt: [
			"Set the toy rule, freeze it and reveal the held-out outcomes. Then inspect what happens if you tune the threshold.",
			"设置示例规则，固定后展示保留结果，再检查调阈值后的变化。",
		],
		demonstration: [
			[
				"An outcome-informed rule change consumes the independence of the evaluation example.",
				"看过结果再修改规则，会消耗评估示例的独立性。",
			],
		],
		Component: HoldoutScene,
	},
] as const satisfies readonly ConceptScene[];
export function PointTimeConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "point-in-time-research")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<PointTimeData value={data}>
			<ConceptLab
				locale={locale}
				id="point-time"
				label={[
					"Interactive point-in-time research lesson",
					"时点研究互动课堂",
				]}
				scenes={scenes}
			/>
		</PointTimeData>
	);
}
