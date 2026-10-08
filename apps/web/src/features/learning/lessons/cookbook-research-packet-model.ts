import {
	type Copy,
	mondayPacket,
	oct105CallMessages,
	type PacketRow,
	packetPremium,
	tuesdayPacket,
	usd,
} from "@/content/world";

export type Removed = "formula" | "exclusions" | "asof";

export const dollars = (cents: number) => usd(cents, 0);
export const series = (row: PacketRow): Copy => [
	`${row.strike} call`,
	`${row.strike} 看涨`,
];

export const MONDAY = packetPremium(mondayPacket);
export const TUESDAY = packetPremium(tuesdayPacket);
export const SERIES = mondayPacket.length;
export const COVERED = mondayPacket.filter((row) => row.trades !== null).length;
export const rowById = (id: string) =>
	mondayPacket.find((row) => row.id === id);

export const cancelled = oct105CallMessages.find(
	(message) => message.id === "M3",
);
export const repeated = oct105CallMessages.find(
	(message) => message.id === "M1",
);
export const extra = (message?: { quantity?: number; price?: number }) =>
	(message?.quantity ?? 0) * (message?.price ?? 0) * 100;

export const fields: readonly {
	id: Removed | "rows";
	label: Copy;
	value: Copy;
}[] = [
	{
		id: "asof",
		label: ["Data as of", "数据截至"],
		value: ["corrected tape, Mon 16:05", "更正后成交记录，周一 16:05"],
	},
	{
		id: "rows",
		label: ["Rows", "行"],
		value: ["R1–R4 covered; R5 no data", "R1–R4 已覆盖；R5 无数据"],
	},
	{
		id: "formula",
		label: ["Formula", "公式"],
		value: ["price × contracts × 100, summed", "价格 × 张数 × 100，求和"],
	},
	{
		id: "exclusions",
		label: ["Exclusions", "排除"],
		value: ["T-2 cancelled; M2 repeats T-1", "T-2 已取消；M2 重复 T-1"],
	},
];

export const reruns: Record<"none" | Removed, { cents: number; why: Copy }> = {
	none: { cents: MONDAY, why: ["every field present", "所有字段齐全"] },
	formula: {
		cents: MONDAY / 100,
		why: ["price × contracts, no × 100", "价格 × 张数，漏了 × 100"],
	},
	exclusions: {
		cents: MONDAY + extra(cancelled) + extra(repeated),
		why: ["counted T-2 and M2", "计入了 T-2 和 M2"],
	},
	asof: {
		cents: TUESDAY,
		why: ["reran Tuesday: R5 had arrived", "周二重跑：R5 已到达"],
	},
};
export const rerunText = (removed: Removed | null) => {
	const cents = reruns[removed ?? "none"].cents;
	return cents % 100 ? usd(cents) : dollars(cents);
};

export const r2 = rowById("R2");
export const r3 = rowById("R3");
export const spreadLegs =
	extra(r2?.trades?.find((trade) => trade.id === "T-3")) +
	extra(r3?.trades?.find((trade) => trade.id === "leg"));
export const WITHOUT_SPREAD = TUESDAY - spreadLegs;

export const records: readonly {
	id: string;
	head: Copy;
	cents: number;
	note: Copy;
	tag: Copy;
	method: 1 | 2;
}[] = [
	{
		id: "P1",
		head: ["P1 · as of Mon 16:05 · method v1", "P1 · 截至周一 16:05 · 方法 v1"],
		cents: MONDAY,
		note: [
			`observed subtotal, ${COVERED} of ${SERIES} series`,
			`观测小计，${SERIES} 个序列中的 ${COVERED} 个`,
		],
		tag: ["original", "原始记录"],
		method: 1,
	},
	{
		id: "P2",
		head: ["P2 · as of Tue 09:00 · method v1", "P2 · 截至周二 09:00 · 方法 v1"],
		cents: TUESDAY,
		note: ["all 5 series; R5 is 30 × $0.10", "全部 5 个序列；R5 为 30 × $0.10"],
		tag: ["rerun of P1", "P1 的重跑"],
		method: 1,
	},
	{
		id: "P3",
		head: ["P3 · as of Tue 09:00 · method v2", "P3 · 截至周二 09:00 · 方法 v2"],
		cents: WITHOUT_SPREAD,
		note: ["without the 10:50 spread's two legs", "去掉 10:50 价差的两条腿"],
		tag: ["new question", "新问题"],
		method: 2,
	},
];
