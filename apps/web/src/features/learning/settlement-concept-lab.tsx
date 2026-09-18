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
		title: ["Closing and exercising are different", "平仓和行权是两回事"],
		prompt: [
			"Choose close or exercise and follow what changes.",
			"选择平仓或行权，看看会发生什么变化。",
		],
		steps: teachingSteps(
			[
				[
					"Closing trades the option. Exercising uses the contract right and may move shares and cash.",
					"平仓是交易期权；行权是使用合约权利，并可能带来股票和现金交付。",
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
		title: [
			"Trading and exercise have different windows",
			"交易和行权有不同时间窗口",
		],
		prompt: [
			"Drag the timeline and compare American and European exercise styles.",
			"拖动时间轴，比较美式与欧式行权安排。",
		],
		steps: teachingSteps(
			[
				[
					"Trading and exercise do not always end at the same time.",
					"交易和行权并不总在同一时间结束。",
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
		title: ["What changes hands at settlement?", "结算时会交付什么？"],
		prompt: [
			"Compare share settlement with cash settlement.",
			"比较股票结算与现金结算。",
		],
		steps: teachingSteps(
			[
				[
					"Read the product, option type, strike and quantity.",
					"读取产品、期权类型、行权价与张数。",
				],
				[
					"The product terms decide what is delivered. Cash settlement uses an official reference value.",
					"产品条款决定交付什么。现金结算使用官方参考值。",
				],
				[
					"Physical settlement moves cash and shares together.",
					"实物结算会同时交换现金与股票。",
				],
				[
					"These settlement movements are not profit. If a required reference is missing, the result is unknown.",
					"这些结算变动不是利润。如果缺少必要参考值，结果就无法确定。",
				],
			],
			[
				["Read the contract", "读取合约"],
				["Find the delivery", "确定交付"],
				["Follow the transfer", "追踪交付"],
				["Read the settlement", "读取结算"],
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
