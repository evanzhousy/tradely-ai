import {
	ALFA,
	type Copy,
	count,
	mondayPacket,
	packetContracts,
	packetPremium,
	rowPremium,
	usd,
} from "@/content/world";

export const dollars = (cents: number) => usd(cents, 0);

export const PREMIUM = packetPremium(mondayPacket);
/** The report dropped the 100 shares per contract, so every amount is a hundredth. */
export const REPORTED = PREMIUM / 100;
export const CONTRACTS = packetContracts(mondayPacket);
export const rowById = (id: string) =>
	mondayPacket.find((row) => row.id === id);

/** The source trades behind the worked 105-call premium, in cents. */
const proofRow = mondayPacket.find((row) => row.strike === 105);
const proofPremium = proofRow ? rowPremium(proofRow) : null;
if (!proofRow?.trades || proofPremium === null)
	throw new Error("The worked premium needs the covered 105-call source row.");
export const premiumProof = {
	strike: proofRow.strike,
	trades: proofRow.trades,
	multiplier: ALFA.multiplier,
	premium: proofPremium,
};

export type Status = "supported" | "repaired" | "removed";

export const claims: readonly {
	id: string;
	text: Copy;
	status: Status;
	defect?: Copy;
	repair?: Copy;
}[] = [
	{
		id: "scope",
		text: [
			"ALFA Oct 18 calls, strikes 100–120, Mon Sep 16",
			"ALFA 10月18日 看涨，行权价 100–120，9月16日周一",
		],
		status: "supported",
	},
	{
		id: "premium",
		text: [`${usd(REPORTED)} in premium`, `权利金 ${usd(REPORTED)}`],
		status: "repaired",
		defect: ["units", "单位"],
		repair: [
			`${dollars(PREMIUM)} in premium, 4 of 5 strikes`,
			`权利金 ${dollars(PREMIUM)}，5 个行权价中的 4 个`,
		],
	},
	{
		id: "positions",
		text: ["540 new positions in the 110 call", "110 看涨新增 540 个仓位"],
		status: "repaired",
		defect: ["volume ≠ positions", "成交 ≠ 持仓"],
		repair: ["540 contracts traded in the 110 call", "110 看涨成交 540 张"],
	},
	{
		id: "missing",
		text: ["The 120 call traded 0", "120 看涨成交 0 张"],
		status: "repaired",
		defect: ["missing as zero", "缺失当作零"],
		repair: ["The 120 call: no data at the cutoff", "120 看涨：截止时没有数据"],
	},
	{
		id: "forecast",
		text: [
			"Traders expect ALFA above $110 by Oct 18",
			"交易者预期 ALFA 在 10月18日 前高于 $110",
		],
		status: "removed",
		defect: ["no evidence", "没有证据"],
	},
];

export const sections: readonly {
	id: string;
	label: Copy;
	text: Copy;
}[] = [
	{
		id: "supported",
		label: ["Supported", "有依据"],
		text: [
			`P1 · ALFA Oct 18 calls · Mon Sep 16: ${dollars(PREMIUM)} premium; ${count(CONTRACTS)} traded; 4/5 strikes.`,
			`P1 · ALFA 10月18日看涨 · 9月16日周一：权利金 ${dollars(PREMIUM)}；成交 ${count(CONTRACTS)} 张；覆盖 4/5 行权价。`,
		],
	},
	{
		id: "repaired",
		label: ["Repaired", "已修复"],
		text: [
			"×100 restored; new positions → volume; 120: no data; forecast removed.",
			"补回 ×100；新增仓位 → 成交；120：无数据；删除预测。",
		],
	},
	{
		id: "open",
		label: ["Open", "未解决"],
		text: [
			"120 Monday tape: Tue 09:00; 110 open-interest change: Tuesday report.",
			"120 周一成交：周二 09:00；110 未平仓变化：周二报告。",
		],
	},
	{
		id: "reopen",
		label: ["Reopen if", "重新审查的条件"],
		text: [
			"Corrected Monday tape, or 120 data changes a claim.",
			"周一成交记录更正，或 120 数据改变结论。",
		],
	},
];
