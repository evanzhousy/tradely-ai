import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	RecapAxisScene,
	RecapComposeScene,
	RecapData,
	RecapMetricScene,
} from "./recap-concept-scenes";

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
