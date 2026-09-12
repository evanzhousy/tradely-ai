import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	NeighborhoodBreadthScene,
	NeighborhoodData,
	NeighborhoodExploreScene,
	NeighborhoodQualityScene,
} from "./neighborhood-concept-scenes";

const scenes = [
	{
		id: "explore",
		label: ["Explore the neighborhood", "探索邻域"],
		title: ["A contract needs nearby context", "合约需要邻近上下文"],
		prompt: [
			"Select a strike/expiry cell, focus an expiry and change the reference spot without changing observed volume.",
			"选择行权价/到期单元格，聚焦到期日，并改变参考现价而不改变观测量。",
		],
		Component: NeighborhoodExploreScene,
	},
	{
		id: "breadth",
		label: ["Compare the shapes", "比较形状"],
		title: [
			"Equal totals and peaks can hide different breadth",
			"相同总量与峰值可隐藏不同广度",
		],
		prompt: [
			"Compare two supplied layouts. Watch the nonzero-cell count while total activity and peak stay fixed.",
			"比较两个给定布局，观察非零格数量，同时总活动与峰值保持固定。",
		],
		Component: NeighborhoodBreadthScene,
	},
	{
		id: "quality",
		label: ["Audit the candidates", "审计候选"],
		title: [
			"The biggest visible value may be ineligible",
			"最大可见值可能不合格",
		],
		prompt: [
			"Inspect missing, prior-session and outside-scope rows. Keep known subtotals separate from complete totals.",
			"检查缺失、前日与范围外行，区分已知小计与完整总和。",
		],
		Component: NeighborhoodQualityScene,
	},
] as const satisfies readonly ConceptScene[];
export function NeighborhoodConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "rank-contracts")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<NeighborhoodData value={data}>
			<ConceptLab
				locale={locale}
				id="contract-neighborhood"
				label={["Interactive contract neighborhood lesson", "合约邻域互动课堂"]}
				scenes={scenes}
			/>
		</NeighborhoodData>
	);
}
