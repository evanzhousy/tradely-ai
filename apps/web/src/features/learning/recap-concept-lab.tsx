import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	RecapAxisScene,
	RecapComposeScene,
	RecapData,
	RecapMetricScene,
} from "./recap-concept-scenes";
import { teachingSteps } from "./visual-step";

const scenes = [
	{
		id: "metric",
		label: ["Match chart and claim", "匹配图表与结论"],
		title: [
			"The chart must show the claimed quantity",
			"图表必须显示所声明的量",
		],
		prompt: [
			"Switch volume and premium independently for the chart and sample claim. Inspect their source rows and units.",
			"独立切换图表与示例结论的成交量、权利金，检查来源行及单位。",
		],
		steps: teachingSteps([
			[
				"The chart and claim both describe volume: 10 and 20 contracts.",
				"图表与结论均描述成交量：10 张与 20 张。",
			],
			[
				"Switching only the chart to premium leaves the volume claim unsupported by that chart.",
				"仅把图表改为权利金后，该图表无法支持成交量结论。",
			],
			[
				"Match the claim to premium: $2,000 and $6,000, with the missing row still visible.",
				"将结论匹配为权利金：$2,000 与 $6,000，同时保留缺失行。",
			],
		]),
		Component: RecapMetricScene,
	},
	{
		id: "axis",
		label: ["Inspect the scale", "检查尺度"],
		title: [
			"True labels can sit on misleading bars",
			"真实标签也可搭配误导柱形",
		],
		prompt: [
			"Raise the axis minimum while the source values stay 10 and 20. Compare the visual height ratio with the actual ratio.",
			"保持来源值 10 与 20 不变，提高轴下限，比较可见高度比与实际比率。",
		],
		steps: teachingSteps([
			[
				"Start with the supplied values and inspect the axis origin.",
				"从给定数值开始，观察坐标轴起点。",
			],
			[
				"The values stay fixed while the axis changes. Bar-height ratios can become misleading.",
				"数值固定而坐标轴变化，柱形高度比例可能产生误导。",
			],
			[
				"Use the displayed axis comparison to separate the visual ratio from the actual 2:1 ratio.",
				"通过显示的坐标轴对比，区分视觉比例与实际 2:1 比例。",
			],
		]),
		Component: RecapAxisScene,
	},
	{
		id: "compose",
		label: ["Build a bounded recap", "构建有边界复盘"],
		title: ["Keep the limitation beside the claim", "把限制放在结论旁"],
		prompt: [
			"Compare fixed headline examples, repair an overclaim, and assemble a caption that can travel with the chart.",
			"比较固定标题示例，修复过度结论，并组装可随图表传播的图注。",
		],
		steps: teachingSteps([
			[
				"The initial headline overstates coverage: a missing row prevents a complete total.",
				"初始标题夸大覆盖范围：存在缺失行，无法得到完整总量。",
			],
			[
				"Replace it with a bounded statement of the 30 observed contracts.",
				"改为有边界的描述：观测到 30 张合约。",
			],
			[
				"The finished caption carries the units, source, date and coverage limitation with the chart.",
				"完成的图注将单位、来源、日期与覆盖限制保留在图表旁。",
			],
		]),
		Component: RecapComposeScene,
	},
] as const satisfies readonly ConceptScene[];
export function RecapConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "market-recap")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<RecapData value={data}>
			<ConceptLab
				locale={locale}
				id="recap"
				label={["Interactive market recap lesson", "市场复盘互动课堂"]}
				scenes={scenes}
			/>
		</RecapData>
	);
}
