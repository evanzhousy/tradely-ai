import {
	alfaShareVolume,
	type Contract,
	type Copy,
	modelValue,
	mondayActivity,
	oct100CallMonday,
	oct100CallQuoteAtTrade,
	oct105BlockLegs,
	oct105CallBlock,
	oct105CallLast,
	oct110CallSweep,
	sideCode,
	sweep,
} from "@/content/world";

/** The numbers the DEX and DEI lesson teaches with, shared by its film and its playground. */

/** Call deltas at ALFA $100, to two places as the Greeks lessons showed them. */
export const deltaOf = (strike: number) => {
	const contract: Contract = { expiry: "oct18", strike, right: "call" };
	return Math.round(modelValue(contract).delta * 100) / 100;
};

export type Lean = "bullish" | "bearish" | "neutral" | "unclassified";
export type Print = {
	id: string;
	time: string;
	strike: number;
	contracts: number;
	/** Premium paid, in cents. */
	premium: number;
	lean: Lean;
	/** Part of the 10:50 call spread. */
	spread?: boolean;
};

/** A call printed at or above the ask leans bullish, at or below the bid bearish. */
export const leanOf = (
	price: number,
	bid: number | null,
	ask: number | null,
): Lean => {
	const code = sideCode(price, bid, ask);
	if (code === null) return "unclassified";
	if (code === "ASK" || code === "AASK") return "bullish";
	if (code === "BID" || code === "BBID") return "bearish";
	return "neutral";
};

export const sweepFills = sweep(
	oct110CallSweep.asks,
	oct110CallSweep.quantity,
).fills;
export const nbboBid = Math.max(
	...oct110CallSweep.bids.map((level) => level.price),
);
export const nbboAsk = Math.min(
	...oct110CallSweep.asks.map((level) => level.price),
);

/** The 100 call's quote at each of its three trades. */
export const quoteAt = (id: string) =>
	oct100CallQuoteAtTrade[id as keyof typeof oct100CallQuoteAtTrade];

/** Monday's Oct 18 call prints in time order, each classified against its quote. */
export const prints: readonly Print[] = [
	...oct100CallMonday.trades.map((trade) => ({
		id: trade.id,
		time: trade.time,
		strike: 100,
		contracts: trade.quantity,
		premium: trade.price * trade.quantity * 100,
		lean: leanOf(trade.price, quoteAt(trade.id).bid, quoteAt(trade.id).ask),
	})),
	{
		id: "T-1",
		time: oct105CallLast.time,
		strike: 105,
		contracts: oct105CallLast.size,
		premium: oct105CallLast.price * oct105CallLast.size * 100,
		lean: "unclassified",
	},
	{
		id: "T-3",
		time: oct105CallBlock.time.slice(0, 5),
		strike: 105,
		contracts: oct105CallBlock.quantity,
		premium: oct105CallBlock.price * oct105CallBlock.quantity * 100,
		lean: leanOf(
			oct105CallBlock.price,
			oct105CallBlock.quote.bid,
			oct105CallBlock.quote.ask,
		),
		spread: true,
	},
	{
		id: "leg",
		time: oct105CallBlock.time.slice(0, 5),
		strike: 110,
		contracts: oct105BlockLegs.sell.quantity,
		premium: oct105BlockLegs.sell.price * oct105BlockLegs.sell.quantity * 100,
		lean: leanOf(
			oct105BlockLegs.sell.price,
			oct105BlockLegs.sell.bid,
			oct105BlockLegs.sell.ask,
		),
		spread: true,
	},
	{
		id: "sweep",
		time: oct110CallSweep.time.slice(0, 5),
		strike: 110,
		contracts: oct110CallSweep.quantity,
		premium: sweepFills.reduce(
			(sum, fill) => sum + fill.price * fill.size * 100,
			0,
		),
		lean: sweepFills.every(
			(fill) => leanOf(fill.price, nbboBid, nbboAsk) === "bullish",
		)
			? "bullish"
			: "neutral",
	},
];

/** Share-equivalents: |delta| × contracts × 100 shares. */
export const magnitude = (print: Print) =>
	Math.round(deltaOf(print.strike) * print.contracts * 100);
export const signOf = (lean: Lean) =>
	lean === "bullish" ? 1 : lean === "bearish" ? -1 : 0;

export type Row = { id: string; label: Copy; value: number; lean: Lean };

/** Rows as a flow table shows them, or with the call spread netted into one trade. */
export function flowRows(spreadAsOne: boolean): Row[] {
	const rows: Row[] = [];
	for (const print of prints) {
		if (spreadAsOne && print.spread) {
			if (print.id !== "T-3") continue;
			const legs = prints.filter((leg) => leg.spread);
			const net = legs.reduce(
				(sum, leg) => sum + (leg.id === "T-3" ? 1 : -1) * magnitude(leg),
				0,
			);
			rows.push({
				id: "spread",
				label: [
					`${print.time} spread ×${print.contracts}`,
					`${print.time} 价差 ×${print.contracts}`,
				],
				value: net,
				lean: "bullish",
			});
			continue;
		}
		rows.push({
			id: print.id,
			label: [
				`${print.time} ${print.strike}C ×${print.contracts}`,
				`${print.time} ${print.strike} 看涨 ×${print.contracts}`,
			],
			value: magnitude(print),
			lean: print.lean,
		});
	}
	return rows;
}

export function flowTotals(spreadAsOne: boolean) {
	const rows = flowRows(spreadAsOne);
	const bullish = rows
		.filter((row) => row.lean === "bullish")
		.reduce((sum, row) => sum + row.value, 0);
	const bearish = rows
		.filter((row) => row.lean === "bearish")
		.reduce((sum, row) => sum + row.value, 0);
	const neutral = rows
		.filter((row) => signOf(row.lean) === 0)
		.reduce((sum, row) => sum + row.value, 0);
	return {
		bullish,
		bearish,
		neutral,
		net: bullish - bearish,
		gross: bullish + bearish + neutral,
	};
}

export const leanName: Record<Lean, Copy> = {
	bullish: ["at the ask", "按卖价"],
	bearish: ["at the bid", "按买价"],
	neutral: ["mid", "中间价"],
	unclassified: ["no quote", "无报价"],
};

export const NET = flowTotals(false).net;
export const denominators: readonly {
	id: string;
	label: Copy;
	shares: number;
}[] = [
	{
		id: "d20",
		label: ["20-day avg", "20 日均量"],
		shares: alfaShareVolume.average20,
	},
	{
		id: "d60",
		label: ["60-day avg", "60 日均量"],
		shares: alfaShareVolume.average60,
	},
	{
		id: "noon",
		label: ["today by noon", "今天截至中午"],
		shares: alfaShareVolume.mondayByNoon,
	},
];
export const dei = (shares: number) => (Math.abs(NET) / shares) * 100;
export const netPremium = prints.reduce(
	(sum, print) => sum + signOf(print.lean) * print.premium,
	0,
);

/** Another platform's "DEX": open interest × delta × 100, dealers assumed short every call. */
export const oiRows = mondayActivity
	.filter((row) => row.id.startsWith("oct18"))
	.map((row) => ({
		strike: Number(row.id.split("-")[1]),
		openInterest: row.openInterest,
	}));
export const POSITIONING = -oiRows.reduce(
	(sum, row) => sum + Math.round(row.openInterest * deltaOf(row.strike) * 100),
	0,
);

export const printwise = flowTotals(false);
export const netted = flowTotals(true);
export const [d20, , noon] = denominators;
