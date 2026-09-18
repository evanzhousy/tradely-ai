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
			"Choose Call or Put, then buyer or writer. See who has the right and who has the obligation.",
			"选择看涨或看跌，再选择买方或卖方。看看谁有权利、谁有义务。",
		],
		steps: teachingSteps(
			[
				[
					"The buyer gets the right. The writer takes the matching obligation.",
					"买方获得权利，卖方承担对应义务。",
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
		title: ["Selling can close or open a position", "卖出可以平仓，也可以开仓"],
		prompt: [
			"Change the starting position and trade. Watch the number of contracts change.",
			"改变起始持仓和交易，观察合约张数如何变化。",
		],
		steps: teachingSteps(
			[
				[
					"Selling can close a long position or open a short one, depending on where you start.",
					"卖出既可能平掉多头，也可能建立空头，取决于起始持仓。",
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
			"Step through exercise and assignment. Switch Call / Put to see the flows reverse.",
			"逐步查看行权与指派。切换看涨 / 看跌，观察资金和股票流向反转。",
		],
		steps: teachingSteps(
			[
				[
					"Follow the strike payment and shares delivered during assignment.",
					"沿指派流程，查看行权价对应的付款与交付股票。",
				],
			],
			[
				["Start with exercise", "从行权开始"],
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
