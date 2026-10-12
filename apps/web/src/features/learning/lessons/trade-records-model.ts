import { type Copy, oct105CallBlock, oct105CallLast } from "@/content/world";

export type SourceId = "t1" | "t3" | "leg";
export const BLOCK_TIME = oct105CallBlock.time.slice(0, 5);
export const CONTRACT_MULTIPLIER = 100;

export const sources: Record<
	SourceId,
	{
		trade: string;
		time: string;
		contract: Copy;
		strike: number;
		quantity: number;
		price: number;
	}
> = {
	t1: {
		trade: "T-1",
		time: oct105CallLast.time,
		contract: ["105 call", "105 看涨"],
		strike: 105,
		quantity: oct105CallLast.size,
		price: oct105CallLast.price,
	},
	t3: {
		trade: "T-3",
		time: BLOCK_TIME,
		contract: ["105 call", "105 看涨"],
		strike: 105,
		quantity: oct105CallBlock.quantity,
		price: oct105CallBlock.price,
	},
	leg: {
		trade: "T-4",
		time: BLOCK_TIME,
		contract: ["110 call", "110 看涨"],
		strike: oct105CallBlock.pairedLeg.strike,
		quantity: oct105CallBlock.pairedLeg.quantity,
		price: oct105CallBlock.pairedLeg.price,
	},
};

/** Premium in cents for one print, including the option's share multiplier. */
export function premiumContribution(id: SourceId) {
	const row = sources[id];
	return row.price * row.quantity * CONTRACT_MULTIPLIER;
}

export function aggregate(include: readonly SourceId[]) {
	const rows = include.map((id) => sources[id]);
	const strikes = new Set(rows.map((row) => row.strike));
	const contracts = rows.reduce((sum, row) => sum + row.quantity, 0);
	const shares = contracts * CONTRACT_MULTIPLIER;
	/** Cents: price per share × contracts × 100. */
	const premium = include.reduce((sum, id) => sum + premiumContribution(id), 0);
	const weighted = shares ? premium / shares : 0;
	const simple = rows.length
		? rows.reduce((sum, row) => sum + row.price, 0) / rows.length
		: 0;
	return {
		valid: strikes.size <= 1,
		trades: rows.length,
		contracts,
		shares,
		premium,
		weighted,
		simple,
	};
}

/** "$2.1485" style: up to four decimals, as a weighted price needs. */
export const price4 = (cents: number) =>
	`$${(cents / 100).toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 4,
	})}`;
