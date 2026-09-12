import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	AccountCashScene,
	OptionValueScene,
	PnlData,
	StockAccountingScene,
} from "./pnl-concept-scenes";

const scenes = [
	{
		id: "lots",
		label: ["Separate P&L components", "区分盈亏组成"],
		title: [
			"A closed lot and an open mark answer different questions",
			"平仓批次与持仓估值回答不同问题",
		],
		prompt: [
			"Replay supplied checkpoints, compare FIFO with average-cost attribution, and include or withhold fee evidence.",
			"回放给定检查点，比较 FIFO 与平均成本归因，并纳入或撤去费用证据。",
		],
		Component: StockAccountingScene,
	},
	{
		id: "cash",
		label: ["Separate cash and profit", "区分现金与利润"],
		title: [
			"A deposit changes value without creating trading profit",
			"存款改变价值，不创造交易利润",
		],
		prompt: [
			"Add a hypothetical deposit while holding positions fixed. Inspect marked allocation and the limits of reported buying power.",
			"保持持仓固定，加入假设存款，检查估值配置及报告购买力的限制。",
		],
		Component: AccountCashScene,
	},
	{
		id: "options",
		label: ["Value a signed option position", "估值带符号期权持仓"],
		title: [
			"Received premium is not a short-call loss limit",
			"收到权利金不是卖出看涨的亏损上限",
		],
		prompt: [
			"Change long/short side and the hypothetical mark. Retain multiplier, notional and missing-Greeks context.",
			"改变多空方向与假设估值价，保留乘数、名义金额及希腊值缺失上下文。",
		],
		Component: OptionValueScene,
	},
] as const satisfies readonly ConceptScene[];
export function PnlConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "portfolio-pnl")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<PnlData value={data}>
			<ConceptLab
				locale={locale}
				id="pnl"
				label={["Interactive portfolio P&L lesson", "组合盈亏互动课堂"]}
				scenes={scenes}
			/>
		</PnlData>
	);
}
