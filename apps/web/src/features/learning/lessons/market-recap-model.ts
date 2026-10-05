import {
	type Copy,
	count,
	mondayPacket,
	type PacketRow,
	rowContracts,
	rowPremium,
	usd,
} from "@/content/world";

export const dollars = (cents: number) => usd(cents, 0);

export type Metric = "contracts" | "premium";

export const measureOf = (row: PacketRow, metric: Metric) =>
	metric === "contracts" ? rowContracts(row) : rowPremium(row);
export const leaderOf = (metric: Metric) =>
	mondayPacket.reduce((best, row) =>
		(measureOf(row, metric) ?? -1) > (measureOf(best, metric) ?? -1)
			? row
			: best,
	);

export const PREMIUM_MAX = 12_000_000;
export const CONTRACTS_MAX = 600;
export const chartMax = (metric: Metric) =>
	metric === "contracts" ? CONTRACTS_MAX : PREMIUM_MAX;

export const leadValue = (metric: Metric) => {
	const value = measureOf(leaderOf(metric), metric) ?? 0;
	return metric === "contracts" ? count(value) : dollars(value);
};
export const headline = (metric: Metric): Copy =>
	metric === "contracts"
		? [
				`Most contracts: the ${leaderOf(metric).strike} call, ${leadValue(metric)}`,
				`成交张数最多：${leaderOf(metric).strike} 看涨，${leadValue(metric)} 张`,
			]
		: [
				`Most premium: the ${leaderOf(metric).strike} call, ${leadValue(metric)}`,
				`权利金最多：${leaderOf(metric).strike} 看涨，${leadValue(metric)}`,
			];

export const r2 = mondayPacket.find((row) => row.strike === 105);
export const r3 = mondayPacket.find((row) => row.strike === 110);
export const C105 = (r2 && rowContracts(r2)) ?? 0;
export const C110 = (r3 && rowContracts(r3)) ?? 0;

export const leader = leaderOf("contracts");
export const drafts: Record<"over" | "bounded", Copy> = {
	over: [
		`Call buyers piled into ALFA's ${leader.strike} strike, Monday's busiest call`,
		`看涨买家涌入 ALFA ${leader.strike} 行权价，周一最活跃的看涨`,
	],
	bounded: [
		`${count(rowContracts(leader) ?? 0)} contracts traded in ALFA's Oct 18 ${leader.strike} call on Monday, the most of the four strikes with data`,
		`周一 ALFA 10月18日 ${leader.strike} 看涨成交 ${count(rowContracts(leader) ?? 0)} 张，在有数据的四个行权价中最多`,
	],
};
export const caption: Copy = [
	"Contracts by strike, axis from 0. ALFA Oct 18 calls, Mon Sep 16, corrected tape as of 16:05 (packet P1). 120 call: no data yet.",
	"按行权价的成交张数，轴从 0 开始。ALFA 10月18日 看涨，9月16日周一，截至 16:05 的更正后成交记录（研究包 P1）。120 看涨：尚无数据。",
];

export const premiumLeader = leaderOf("premium");
