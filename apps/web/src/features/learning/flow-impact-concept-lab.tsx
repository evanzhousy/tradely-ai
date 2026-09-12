import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	FlowBuildScene,
	FlowDenominatorScene,
	FlowImpactData,
	FlowLineageScene,
} from "./flow-impact-concept-scenes";

const scenes = [
	{
		id: "flow",
		label: ["Build the flow", "构建成交流"],
		title: ["Large activity can cancel to zero", "大量活动也可相互抵消"],
		prompt: [
			"Change print B's size or inferred classification. Keep share equivalents separate from premium dollars.",
			"改变成交 B 的张数或推断分类，将股等价量与权利金美元分开。",
		],
		Component: FlowBuildScene,
	},
	{
		id: "denominator",
		label: ["Change the denominator", "改变分母"],
		title: ["Same flow, different percentage", "相同成交流，不同百分比"],
		prompt: [
			"Hold the original flow fixed. Adjust typical volume, then inspect proxy and missing-volume cases.",
			"固定原始成交流，调整典型量，再检查代理与缺失成交量情况。",
		],
		Component: FlowDenominatorScene,
	},
	{
		id: "lineage",
		label: ["Trace the source", "追溯来源"],
		title: [
			"Similar labels do not share a numerator",
			"相似标签不代表相同分子",
		],
		prompt: [
			"Select a source report. Check its clock, units and sign convention before routing it into this lesson's DEI.",
			"选择来源报告，在代入本课 DEI 前检查时点、单位与符号约定。",
		],
		Component: FlowLineageScene,
	},
] as const satisfies readonly ConceptScene[];
export function FlowImpactConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "dex-dei-gex")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<FlowImpactData value={data}>
			<ConceptLab
				locale={locale}
				id="flow-impact"
				label={[
					"Interactive DEX DEI and GEX lesson",
					"DEX DEI 与 GEX 互动课堂",
				]}
				scenes={scenes}
			/>
		</FlowImpactData>
	);
}
