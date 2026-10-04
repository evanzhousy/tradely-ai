import {
	type Copy,
	contractDte,
	mondayScreen,
	runScreen,
	SESSION_DATE,
	screenDefaults,
	volumeToOi,
} from "@/content/world";
import type { EvidenceKind } from "../walkthrough/types";

/** The answer, credits and AI actions the verify lesson teaches with, shared by its film and its playground. */

export const PASSED = runScreen(mondayScreen, screenDefaults, SESSION_DATE);
export const NAMES = new Set(PASSED.map((row) => row.symbol)).size;
export const CRUX = PASSED[0];
export const NEAR = PASSED.filter(
	(row) => contractDte(row, SESSION_DATE) <= 30,
).length;

/** TradingFlow AI's statements about Monday's screen, each with what backs it. */
export const STATEMENTS: readonly {
	id: string;
	text: Copy;
	basis: Copy;
	evidence: EvidenceKind;
	at: 0 | 1 | 2;
}[] = [
	{
		id: "count",
		text: [
			`The screen flagged ${PASSED.length} contracts across ${NAMES} names on Monday.`,
			`周一的筛选在 ${NAMES} 个标的中标出了 ${PASSED.length} 份合约。`,
		],
		basis: ["the key figures, for Mon Sep 16", "关键数字，9月16日周一"],
		evidence: "observed",
		at: 0,
	},
	{
		id: "ratio",
		text: [
			`The CRUX Oct 4 60 put traded ${volumeToOi(CRUX).toFixed(2)} times its open interest.`,
			`CRUX 10月4日 60 看跌的成交量是其未平仓量的 ${volumeToOi(CRUX).toFixed(2)} 倍。`,
		],
		basis: [
			`${CRUX.volume.toLocaleString("en-US")} ÷ ${CRUX.openInterest.toLocaleString("en-US")} from its row`,
			`其所在行：${CRUX.volume.toLocaleString("en-US")} ÷ ${CRUX.openInterest.toLocaleString("en-US")}`,
		],
		evidence: "calculated",
		at: 0,
	},
	{
		id: "bet",
		text: [
			"Someone opened a large bearish bet on CRUX ahead of news.",
			"有人在消息公布前对 CRUX 建立了大额看空押注。",
		],
		basis: [
			"the screen can't show who traded, why, or opening vs closing",
			"筛选无法显示谁交易、为什么，或是开仓还是平仓",
		],
		evidence: "unknown",
		at: 1,
	},
	{
		id: "near",
		text: [
			`${NEAR} of the ${PASSED.length} flagged contracts expire within 30 days.`,
			`${PASSED.length} 份入选合约中有 ${NEAR} 份在 30 天内到期。`,
		],
		basis: ["count the expiry column", "数一数到期日那一列"],
		evidence: "calculated",
		at: 2,
	},
	{
		id: "fall",
		text: ["CRUX will fall before Oct 4.", "CRUX 会在10月4日前下跌。"],
		basis: [
			"a forecast; no session's data supports it",
			"这是预测；任何交易时段的数据都不能支持它",
		],
		evidence: "unknown",
		at: 2,
	},
];

/** Credits per reply: plain text, or with a chart. */
export const COST = { text: 1, chart: 2 } as const;

export const INSIGHT_BODY: Copy = [
	"Explains this run: why five contracts passed, and what volume/OI can't tell you. The recipe is untouched.",
	"解释这次运行：为什么有五份合约通过，以及成交量/OI 不能告诉你什么。Recipe 不受影响。",
];
export const EDIT_BODY: Copy = [
	"Opens a private working draft you can change, review, undo and save. The official recipe stays as it is.",
	"打开一份可修改、审阅、撤销和保存的私有工作草稿。官方 Recipe 保持原样。",
];
