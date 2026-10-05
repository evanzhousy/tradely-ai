import {
	type Copy,
	count,
	mondayPacket,
	packetContracts,
	packetPremium,
	usd,
} from "@/content/world";

export const dollars = (cents: number) => usd(cents, 0);

export const PREMIUM = packetPremium(mondayPacket);
/** The report dropped the 100 shares per contract, so every amount is a hundredth. */
export const REPORTED = PREMIUM / 100;
export const CONTRACTS = packetContracts(mondayPacket);
export const rowById = (id: string) =>
	mondayPacket.find((row) => row.id === id);

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
	tone: "gain" | "accent" | "loss" | "muted";
	text: Copy;
}[] = [
	{
		id: "supported",
		label: ["Supported", "有依据"],
		tone: "gain",
		text: [
			`ALFA Oct 18 calls, Mon Sep 16: ${dollars(PREMIUM)} in premium and ${count(CONTRACTS)} contracts over 4 of 5 strikes (packet P1)`,
			`ALFA 10月18日 看涨，9月16日周一：权利金 ${dollars(PREMIUM)}，成交 ${count(CONTRACTS)} 张，覆盖 5 个行权价中的 4 个（研究包 P1）`,
		],
	},
	{
		id: "repaired",
		label: ["Repaired", "已修复"],
		tone: "accent",
		text: [
			"× 100 restored; new positions → contracts traded; the 120 call's 0 → no data; forecast removed",
			"补回 × 100；新增仓位 → 成交张数；120 看涨的 0 → 无数据；删除预测",
		],
	},
	{
		id: "open",
		label: ["Open", "未解决"],
		tone: "loss",
		text: [
			"The 120 call's Monday trades, delivered Tue 09:00; the 110 call's open-interest change, in Tuesday's report",
			"120 看涨的周一成交（周二 09:00 送达）；110 看涨的未平仓变化（见周二的报告）",
		],
	},
	{
		id: "reopen",
		label: ["Reopen if", "重新审查的条件"],
		tone: "muted",
		text: [
			"Monday's tape is corrected, or the 120 call's data changes a claim",
			"周一的成交记录被更正，或 120 看涨的数据改变了某个结论",
		],
	},
];
