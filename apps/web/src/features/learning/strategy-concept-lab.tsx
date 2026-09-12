import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	CompositionScene,
	ExpirationStrategyScene,
	RollScene,
	StrategyData,
} from "./strategy-concept-scenes";

const scenes = [
	{
		id: "composition",
		label: ["Connect the legs", "连接策略腿"],
		title: [
			"One position can belong to different structures",
			"单一持仓可属于不同结构",
		],
		prompt: [
			"Inspect the supplied strategy, then switch to the evidence from just one position.",
			"检查给定策略，再切换到仅有单一持仓证据的视角。",
		],
		Component: CompositionScene,
	},
	{
		id: "expiry",
		label: ["Explore expiration", "探索到期结果"],
		title: [
			"Add signed legs before reading the profit",
			"先合并带符号的各腿，再读取盈亏",
		],
		prompt: [
			"Drag the underlying price. Compare the strategy shapes on shared axes, then separate terminal value, entry cost and fees.",
			"拖动标的价格，在共同坐标轴上比较策略形状，再区分到期价值、入场成本与费用。",
		],
		Component: ExpirationStrategyScene,
	},
	{
		id: "roll",
		label: ["Close, then open", "先平仓，再开仓"],
		title: ["A roll is two linked transactions", "移仓是两笔关联交易"],
		prompt: [
			"Replay the supplied closing and opening fills. Follow contract identity, inventory and cash flow.",
			"回放给定平仓与开仓成交，追踪合约身份、持仓和现金流。",
		],
		Component: RollScene,
	},
] as const satisfies readonly ConceptScene[];
export function StrategyConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "option-strategies")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<StrategyData value={data}>
			<ConceptLab
				locale={locale}
				id="strategy"
				label={["Interactive option strategy lesson", "期权策略互动课堂"]}
				scenes={scenes}
			/>
		</StrategyData>
	);
}
