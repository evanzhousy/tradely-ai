import { useState } from "react";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	ClosingExerciseScene,
	ExerciseTimingScene,
	SettlementComparisonScene,
	SettlementExample,
	type SettlementKind,
} from "./settlement-concept-scenes";
import { teachingSteps } from "./visual-step";

const scenes = [
	{
		id: "exit",
		label: ["Close / exercise", "平仓 / 行权"],
		title: [
			"Closing is a trade. Exercise uses a right.",
			"平仓是交易，行权是使用权利。",
		],
		prompt: [
			"Choose a route and play it through. Follow the option, shares and cash.",
			"选择一条路径并播放，追踪期权、股票与现金。",
		],
		steps: teachingSteps(
			[
				[
					"A closing trade exchanges the option. Exercise uses its contractual right. Watch what changes hands.",
					"平仓交易转让期权，行权使用合约权利。观察两种流程交付什么。",
				],
			],
			[
				["Choose close or exercise", "选择平仓或行权"],
				["Follow option transfer", "追踪期权转移"],
				["Compare delivered assets", "比较交付资产"],
			],
		),
		Component: ClosingExerciseScene,
	},
	{
		id: "timing",
		label: ["Exercise timing", "行权时间"],
		title: ["One expiry date, different windows", "同一到期日，不同时间窗口"],
		prompt: [
			"Drag the timeline and compare American and European exercise styles.",
			"拖动时间轴，比较美式与欧式行权安排。",
		],
		steps: teachingSteps(
			[
				[
					"Trading and exercise have separate windows. The supplied schedule makes that difference visible.",
					"交易与行权有各自的时间窗口，给定日程展示两者区别。",
				],
			],
			[
				["Read expiry schedule", "读取到期日程"],
				["Move through timeline", "沿时间轴移动"],
				["Compare exercise windows", "比较行权窗口"],
			],
		),
		Component: ExerciseTimingScene,
	},
	{
		id: "settlement",
		label: ["Settlement", "结算"],
		title: ["What actually changes hands?", "究竟交付什么？"],
		prompt: [
			"Compare shares with cash, then inspect the settlement reference.",
			"比较股票与现金的交付，再检查结算参考值。",
		],
		steps: teachingSteps(
			[
				[
					"Read the selected product, option type, strike and quantity. These are different illustrative contracts.",
					"读取所选产品、期权类型、行权价与张数。这是不同的教学合约。",
				],
				[
					"Use the product terms to determine delivery. Cash settlement requires the official reference.",
					"根据产品条款确定交付，现金结算需要官方参考值。",
				],
				[
					"Follow the labelled transfers. Physical settlement is a paired cash-and-share exchange, not two ordered events.",
					"追踪带标签的交付。实物结算是一组现金与股票交换，不表示两个事件的先后顺序。",
				],
				[
					"Read the holder's cash and shares. These are settlement movements, not profit. Missing references remain unknown.",
					"读取持有人的现金与股票变动。这是结算变动，不是利润。参考值缺失时仍保持未知。",
				],
			],
			[
				["Contract", "合约"],
				["Determine delivery", "确定交付"],
				["Transfer", "交付"],
				["Holder settlement", "持有人结算"],
			],
		),
		Component: SettlementComparisonScene,
	},
] as const satisfies readonly ConceptScene[];

export function SettlementConceptLab({ locale }: { locale: Locale }) {
	const [kind, select] = useState<SettlementKind>("physical");
	return (
		<SettlementExample value={{ kind, select }}>
			<ConceptLab
				locale={locale}
				id="settlement"
				label={[
					"Interactive expiration and settlement lesson",
					"到期与结算互动课堂",
				]}
				scenes={scenes}
			/>
		</SettlementExample>
	);
}
