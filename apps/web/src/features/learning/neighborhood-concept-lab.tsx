import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	NeighborhoodBreadthScene,
	NeighborhoodData,
	NeighborhoodExploreScene,
	NeighborhoodQualityScene,
} from "./neighborhood-concept-scenes";
import { teachingSteps } from "./visual-step";

const scenes = [
	{
		id: "explore",
		label: ["Explore the neighborhood", "探索邻域"],
		title: ["A contract needs nearby context", "合约需要邻近上下文"],
		prompt: [
			"Select a strike/expiry cell, focus an expiry and change the reference spot without changing observed volume.",
			"选择行权价/到期单元格，聚焦到期日，并改变参考现价而不改变观测量。",
		],
		steps: teachingSteps(
			[
				[
					"Move the spot reference while the supplied contract activity stays fixed.",
					"移动现价参考，给定合约活动保持不变。",
				],
			],
			[
				["Select a contract cell", "选择合约格子"],
				["Change spot reference", "改变现价参考"],
				["Compare nearby context", "比较邻近背景"],
			],
		),
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
		steps: teachingSteps(
			[
				[
					"Compare breadth as well as peak and total activity across the two neighborhoods.",
					"比较两个邻域时，同时观察广度、峰值与总活动。",
				],
			],
			[
				["Read layout A", "读取布局 A"],
				["Switch to layout B", "切换到布局 B"],
				["Compare breadth", "比较广度"],
			],
		),
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
		steps: teachingSteps(
			[
				[
					"A large visible value can remain outside the declared comparison scope.",
					"可见的大数值，也可能不属于给定比较范围。",
				],
			],
			[
				["Inspect visible rows", "检查可见记录"],
				["Exclude weak evidence", "排除弱证据"],
				["Keep known subtotal", "保留已知小计"],
			],
		),
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
				evidenceBoundary={[
					"Question: where is activity concentrated inside this fixed contract neighborhood? Keep strike, expiry, option type, session and coverage in scope. Reconsider if the neighborhood itself changes.",
					"问题：在这个固定合约邻域内，活动集中在哪里？固定行权价、到期、期权类型、时段与覆盖。若邻域本身变化，就重新判断。",
				]}
				scenes={scenes}
			/>
		</NeighborhoodData>
	);
}
