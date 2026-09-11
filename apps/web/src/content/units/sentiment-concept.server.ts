import "@tanstack/react-start/server-only";
import type { SentimentConceptData } from "@/domain/learning/sentiment-concept";
import type { SideReference } from "@/domain/learning/side-concept";

const contractBase = "DELTA 2030-09-20 $55";
const quote: SideReference = {
	id: "aligned",
	label: ["Matched quote", "匹配报价"],
	contract: `${contractBase} PUT`,
	bid: 300,
	ask: 320,
	at: "10:45:00.000 ET",
	secondsBeforePrint: 0.01,
	timing: "matched",
	condition: "regular",
};
export const sentimentConceptData: SentimentConceptData = {
	kind: "flow-sentiment",
	contractBase,
	date: "2030-06-03",
	printAt: "10:45:00.010 ET",
	quantity: 10,
	multiplier: 100,
	price: 320,
	combinations: [
		{ option: "CALL", aggressor: "buy" },
		{ option: "CALL", aggressor: "sell" },
		{ option: "PUT", aggressor: "buy" },
		{ option: "PUT", aggressor: "sell" },
	],
	evidence: [
		{
			id: "ask",
			label: ["Matched ask · likely buying", "匹配卖价 · 推断买入"],
			price: 320,
			reference: quote,
		},
		{
			id: "bid",
			label: ["Matched bid · likely selling", "匹配买价 · 推断卖出"],
			price: 300,
			reference: quote,
		},
		{
			id: "inside",
			label: ["Inside spread · no reliable initiator", "价差内 · 主动方未确定"],
			price: 309,
			reference: quote,
		},
		{
			id: "stale",
			label: ["Ask price · stale reference", "卖价位置 · 参考已过时"],
			price: 320,
			reference: {
				...quote,
				id: "stale",
				at: "10:43:30.010 ET",
				secondsBeforePrint: 90,
				timing: "stale",
			},
		},
		{
			id: "missing",
			label: ["Reference missing", "参考缺失"],
			price: 320,
			reference: {
				...quote,
				id: "missing",
				bid: null,
				ask: null,
				at: null,
				secondsBeforePrint: null,
			},
		},
		{
			id: "complex",
			label: ["Complex leg · review conditions", "复杂单腿 · 审查条件"],
			price: 320,
			reference: { ...quote, id: "complex", condition: "complex" },
		},
	],
	contexts: [
		{
			id: "unknown",
			label: ["Print only · no linkage", "仅成交记录 · 无持仓关联"],
			beforeShares: null,
			beforePuts: null,
			meaning: "unknown",
		},
		{
			id: "protection",
			label: ["Linked stock protection", "关联股票保护"],
			beforeShares: 1000,
			beforePuts: 0,
			meaning: "protection",
		},
		{
			id: "close",
			label: ["Linked buy-to-close", "关联买入平仓"],
			beforeShares: null,
			beforePuts: -10,
			meaning: "close",
		},
	],
};
