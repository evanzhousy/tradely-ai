import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	AssignmentScene,
	PositionActionsScene,
	RightsRolesScene,
} from "./rights-concept-scenes";
import { teachingSteps } from "./visual-step";

const scenes = [
	{
		id: "rights",
		label: ["Rights", "权利"],
		title: ["One contract, two different roles", "同一合约，两种不同角色"],
		prompt: [
			"Switch Call / Put, then choose a role. Follow the right and the obligation.",
			"切换看涨 / 看跌，再选择角色，追踪权利与义务。",
		],
		steps: teachingSteps(
			[
				[
					"The buyer holds a right. The writer takes the corresponding obligation. Follow the two sides together.",
					"买方持有权利，卖方承担对应义务，沿两条路径一起看。",
				],
			],
			[
				["Choose option type", "选择期权类型"],
				["Choose buyer or writer", "选择买方或卖方"],
				["Match right and obligation", "匹配权利与义务"],
			],
		),
		Component: RightsRolesScene,
	},
	{
		id: "position",
		label: ["Open / close", "开仓 / 平仓"],
		title: ["A sale can close a long position", "卖出也可以平掉多头持仓"],
		prompt: [
			"Change the starting position and trade. Watch the option inventory move.",
			"改变起始持仓与交易，观察期权持仓如何变化。",
		],
		steps: teachingSteps(
			[
				[
					"Compare separate starting positions: selling can close a long or open a short.",
					"比较不同起始持仓：卖出可以平掉多头，也可以建立空头。",
				],
			],
			[
				["Read starting position", "读取起始持仓"],
				["Apply the trade", "应用交易"],
				["Classify open or close", "判断开仓或平仓"],
			],
		),
		Component: PositionActionsScene,
	},
	{
		id: "assignment",
		label: ["Assignment", "指派"],
		title: ["Follow the shares and the cash", "追踪股票与现金的去向"],
		prompt: [
			"Step through a valid exercise and assignment. Reverse Call / Put to reverse the flows.",
			"逐步查看一次有效行权与指派，切换看涨 / 看跌，让资金与股票流向反转。",
		],
		steps: teachingSteps(
			[
				[
					"Follow the stated strike payment and deliverable shares through assignment.",
					"沿被指派流程，查看约定行权金额与交付股票。",
				],
			],
			[
				["Start with valid exercise", "从有效行权开始"],
				["Follow cash and shares", "追踪现金与股票"],
				["Reverse call and put flows", "反转看涨看跌流向"],
			],
		),
		Component: AssignmentScene,
	},
] as const satisfies readonly ConceptScene[];

export function RightsConceptLab({ locale }: { locale: Locale }) {
	return (
		<ConceptLab
			locale={locale}
			id="rights"
			label={["Interactive rights lesson", "权利与义务互动课堂"]}
			scenes={scenes}
		/>
	);
}
