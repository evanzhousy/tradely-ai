import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import { QuoteData } from "./quote-concept-data";
import {
	BookEventScene,
	QuoteAnatomyScene,
	VenueQuoteScene,
} from "./quote-concept-scenes";

const scenes = [
	{
		id: "quote",
		label: ["Read a quote", "读懂报价"],
		title: [
			"Two prices. One spread. No trade yet.",
			"两个价格，一段价差，尚无成交。",
		],
		prompt: [
			"Move the ask and watch the spread and midpoint. Does the last trade move with them?",
			"移动卖价，观察价差与中点。最新成交价也会跟着改变吗？",
		],
		demonstration: [
			[
				"The ask moves, changing spread and midpoint. The last execution remains a separate observation.",
				"卖价变化带动价差与中点变化，最新成交仍是独立观测。",
			],
		],
		playbackStops: [
			["Original quote", "原报价"],
			["Ask changes", "卖价变化"],
			["Wider spread", "价差扩大"],
		],
		Component: QuoteAnatomyScene,
	},
	{
		id: "events",
		label: ["Order → trade?", "订单 → 成交？"],
		title: [
			"The same size change, a different story",
			"数量变化相同，原因却不同",
		],
		prompt: [
			"Play an order through to its supplied outcome. Compare a cancellation with a confirmed execution.",
			"播放订单直至给定结果，比较撤单与已确认成交。",
		],
		demonstration: [
			[
				"Follow an order from arrival to its outcome. A cancellation changes the book without creating a trade.",
				"跟随订单从进入到结果；撤单改变订单簿，但不产生交易。",
			],
		],
		playbackStops: [
			["Resting quote", "初始报价"],
			["Instruction sent", "指令发送"],
			["Outcome confirmed", "结果确认"],
		],
		Component: BookEventScene,
	},
	{
		id: "venues",
		label: ["Across venues", "跨场所比较"],
		title: [
			"The best bid and ask can come from different places",
			"最优买卖价可以来自不同场所",
		],
		prompt: [
			"Inspect one venue, then change which quotes are eligible for the combined best prices.",
			"检查一个场所，再改变参与汇总最优价格的合格报价范围。",
		],
		demonstration: [
			[
				"Best bid and best ask can come from different eligible venues.",
				"最优买价与最优卖价可以来自不同的合格场所。",
			],
		],
		Component: VenueQuoteScene,
	},
] as const satisfies readonly ConceptScene[];
export function QuoteConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "quotes-orders-trades")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<QuoteData value={data}>
			<ConceptLab
				locale={locale}
				id="quotes"
				label={[
					"Interactive quotes, orders and trades lesson",
					"报价、订单与成交互动课堂",
				]}
				scenes={scenes}
			/>
		</QuoteData>
	);
}
