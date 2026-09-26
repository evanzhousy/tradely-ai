import { useState } from "react";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	ClosingExerciseScene,
	ExerciseTimingScene,
	ExpiryRisksScene,
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
	{
		id: "risks",
		label: ["Expiry risks", "到期风险"],
		title: [
			"Four ways expiration can surprise you",
			"到期时可能出乎意料的四种情况",
		],
		prompt: [
			"Step through four cases. For each, see who acts, what changes and what to check before expiration.",
			"逐一查看四种情况：由谁行动、会发生什么，以及到期前应检查什么。",
		],
		steps: teachingSteps(
			[
				[
					"A long option that finishes in the money by $0.01 or more is normally exercised automatically unless you instruct otherwise. Here that means buying 100 shares for $5,000.",
					"到期时价内 $0.01 或以上的多头期权，除非另行指示，通常会被自动行权。本例意味着以 $5,000 买入 100 股。",
				],
				[
					"When the stock closes right at the strike, the writer cannot know whether assignment will follow. An after-hours move can make exercise worthwhile, and the notice arrives later.",
					"股价恰好收在行权价附近时，义务方无法知道是否会被指派。盘后变动可能让行权变得有利，而指派通知稍后才到。",
				],
				[
					"American-style short calls can be assigned early. The day before an ex-dividend date, a holder may exercise when the dividend is larger than the call's remaining time value.",
					"美式空头看涨可能被提前指派。除息日前一天，如果股息大于看涨期权剩余的时间价值，持有人可能提前行权。",
				],
				[
					"Some index options stop trading the day before expiration and settle on a value calculated from opening prices. A call that was in the money at the last trade can still pay $0.",
					"部分指数期权在到期前一天停止交易，并以开盘价格计算的数值结算。最后交易时处于价内的看涨期权，仍可能支付 $0。",
				],
			],
			[
				["Automatic exercise", "自动行权"],
				["Pin risk", "钉住风险"],
				["Early assignment", "提前指派"],
				["AM settlement", "上午结算"],
			],
		),
		Component: ExpiryRisksScene,
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
