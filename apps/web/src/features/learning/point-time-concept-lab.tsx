import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	HoldoutScene,
	KnowledgeCutoffScene,
	PointTimeData,
	RecencyDecayScene,
	ScoreMeaningScene,
	SpecificationSearchScene,
} from "./point-time-concept-scenes";
import { teachingSteps } from "./visual-step";

const scenes = [
	{
		id: "cutoff",
		label: ["Respect the cutoff", "遵守截止"],
		title: [
			"Use only what was known at the decision time",
			"只用决策时已知的信息",
		],
		prompt: [
			"Apply the event and receipt clocks from the source-clock lesson: move the decision cutoff and see which revision was usable then.",
			"运用来源时钟一课的事件与接收时间：移动决策截止点，看看当时可用的是哪个版本。",
		],
		steps: teachingSteps(
			[
				[
					"A backtest may use only records received before its decision cutoff, even when the event itself happened earlier.",
					"回测只能使用在决策截止前已收到的记录，即使事件本身发生得更早。",
				],
			],
			[
				["Read event and receipt times", "读取事件与接收时间"],
				["Move decision cutoff", "移动决策截止点"],
				["Choose usable revision", "选择可用版本"],
			],
		),
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
		steps: teachingSteps(
			[
				[
					"A weighted score can decay with time while the original trade count stays unchanged.",
					"加权分数可随时间衰减，而原成交数量保持不变。",
				],
			],
			[
				["Read raw activity", "读取原始活动"],
				["Advance elapsed time", "推进经过时间"],
				["Compare decayed score", "比较衰减分数"],
			],
		),
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
		steps: teachingSteps(
			[
				[
					"A percentile describes a position in a sample; it is not a probability of profit.",
					"百分位描述样本中的位置，不是盈利概率。",
				],
			],
			[
				["Read percentile", "读取百分位"],
				["Compare z-score", "比较标准分"],
				["Separate outcome probability", "区分结果概率"],
			],
		),
		Component: ScoreMeaningScene,
	},
	{
		id: "search",
		label: ["Freeze the search", "冻结规格搜索"],
		title: [
			"Trying many specifications changes what the winner means",
			"尝试多个规格会改变“胜者”的含义",
		],
		prompt: [
			"Compare candidate specifications on development data, freeze one before opening the holdout, then see why any outcome-informed switch requires fresh evaluation data.",
			"在开发数据上比较候选规格，打开保留集前冻结一个，再观察为何任何受结果影响的切换都需要新的评估数据。",
		],
		steps: teachingSteps(
			[
				[
					"Searching across metrics, universes and thresholds is part of model development. The best development result is selected, not independently confirmed.",
					"在指标、范围与阈值之间搜索属于模型开发。最佳开发结果是被选择出来的，并未得到独立确认。",
				],
			],
			[
				["Compare development specifications", "比较开发规格"],
				["Freeze one before reveal", "揭示前冻结一个"],
				["Require fresh data after reuse", "复用后要求新数据"],
			],
		),
		Component: SpecificationSearchScene,
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
		steps: teachingSteps(
			[
				[
					"An outcome-informed rule change consumes the independence of the evaluation example.",
					"看过结果再修改规则，会消耗评估示例的独立性。",
				],
			],
			[
				["Set and freeze the rule", "设定并冻结规则"],
				["Reveal holdout outcomes", "揭示保留集结果"],
				["Reject post-result tuning", "拒绝看结果后调参"],
			],
		),
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
				evidenceBoundary={[
					"Question, population, features, cutoff and evaluation rule must be frozen before the unseen period is opened. Any outcome-informed change becomes a new specification and needs genuinely fresh evaluation data.",
					"打开未见评估期前，必须固定问题、群体、特征、截止与评价规则。任何受结果影响的修改都成为新规格，并需要真正新的评估数据。",
				]}
				scenes={scenes}
			/>
		</PointTimeData>
	);
}
