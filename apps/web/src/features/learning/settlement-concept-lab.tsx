import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	ClosingExerciseScene,
	ExerciseTimingScene,
	SettlementComparisonScene,
} from "./settlement-concept-scenes";

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
		demonstration: [
			[
				"A closing trade exchanges the option. Exercise uses its contractual right. Watch what changes hands.",
				"平仓交易转让期权，行权使用合约权利。观察两种流程交付什么。",
			],
		],
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
		demonstration: [
			[
				"Trading and exercise have separate windows. The supplied schedule makes that difference visible.",
				"交易与行权有各自的时间窗口，给定日程展示两者区别。",
			],
		],
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
		demonstration: [
			[
				"Cash settlement transfers an amount. Physical settlement transfers the stated shares and cash.",
				"现金结算交付金额，实物结算交付约定股票与现金。",
			],
		],
		Component: SettlementComparisonScene,
	},
] as const satisfies readonly ConceptScene[];

export function SettlementConceptLab({ locale }: { locale: Locale }) {
	return (
		<ConceptLab
			locale={locale}
			id="settlement"
			label={[
				"Interactive expiration and settlement lesson",
				"到期与结算互动课堂",
			]}
			scenes={scenes}
		/>
	);
}
