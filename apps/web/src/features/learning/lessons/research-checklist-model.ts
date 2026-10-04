import type { Copy } from "@/content/world";

/** The checklists and chat the research-checklist lesson teaches with, shared by its film and its playground. */

/** A checklist step: what to check, and the TradingFlow tool it opens. */
export type Step = { id: string; text: Copy; tool: Copy };

/** Home's template for "Before I sell a call, what should I check?", applied to ALFA. */
export const TEMPLATE: readonly Step[] = [
	{
		id: "vol",
		text: [
			"Compare ALFA's IV with its realized volatility",
			"比较 ALFA 的隐含波动率与已实现波动率",
		],
		tool: ["Rank Symbols · volatility", "Rank Symbols · 波动率"],
	},
	{
		id: "gex",
		text: [
			"Inspect GEX and open-interest structure",
			"查看 GEX 与未平仓量结构",
		],
		tool: ["Rank Symbols · gamma", "Rank Symbols · Gamma"],
	},
	{
		id: "trade",
		text: [
			"Check the call's spread, liquidity and open interest",
			"检查该看涨期权的价差、流动性与未平仓量",
		],
		tool: ["Rank Contracts · tradeability", "Rank Contracts · 可交易性"],
	},
	{
		id: "flow",
		text: ["Review recent call flow", "回顾近期的看涨成交流"],
		tool: ["Option Trades · history", "Option Trades · 历史"],
	},
];
export const EARNINGS: Step = {
	id: "earnings",
	text: [
		"Check that ALFA reports on Oct 3, before the Oct 18 expiry",
		"确认 ALFA 在10月18日到期前的10月3日发布财报",
	],
	tool: ["Rank Symbols · earnings", "Rank Symbols · 财报"],
};

/** A friend's three steps for selling an ALFA call: the last one is a forecast. */
export const FRIEND: readonly Step[] = [
	TEMPLATE[0],
	TEMPLATE[2],
	{
		id: "forecast",
		text: [
			"Confirm ALFA stays below $105 until Oct 18",
			"确认 ALFA 在10月18日前一直低于 $105",
		],
		tool: ["no tool can check this", "没有工具能核查这一点"],
	},
];

/** The template with an earnings step added and recent call flow moved up. */
export const EDITED: readonly Step[] = [
	TEMPLATE[0],
	EARNINGS,
	TEMPLATE[3],
	TEMPLATE[2],
	TEMPLATE[1],
];

/** The Customize with AI conversation: a request, one clarifying question, an answer, a proposal. */
export const MESSAGES: readonly {
	id: string;
	from: "you" | "ai";
	text: Copy;
	at: 0 | 1 | 2;
}[] = [
	{
		id: "ask",
		from: "you",
		text: [
			"Adapt this checklist for ALFA's earnings on Oct 3.",
			"把这份清单改成针对 ALFA 10月3日 财报的版本。",
		],
		at: 0,
	},
	{
		id: "clarify",
		from: "ai",
		text: [
			"One question first: should it focus on how much the move is priced before earnings, or on positioning in the calls you'd sell?",
			"先问一个问题：清单应该聚焦财报前市场为波动定了多少价，还是聚焦你要卖出的看涨期权的持仓？",
		],
		at: 1,
	},
	{
		id: "answer",
		from: "you",
		text: ["How much the move is priced.", "财报前的波动定价。"],
		at: 2,
	},
	{
		id: "proposal",
		from: "ai",
		text: [
			"Proposed: add an expected-move step before the volatility step. Nothing is saved; a recipe is built only if your account has that feature and you confirm.",
			"建议：在波动率步骤之前加一步预期波动。不会保存任何内容；只有你的账户有该功能并且你确认后，才会构建 Recipe。",
		],
		at: 2,
	},
];
