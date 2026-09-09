import { gexTotal } from "@/domain/learning/metrics";

// Public, authored examples. These are independent of the paid scenario library.
export const gexContributions = [2000, -1500, 500] as const;

export function summarizeGex(values: readonly (number | null)[]) {
	const cells = values.map((value) => ({ value }));
	const net = gexTotal(cells);
	return {
		net,
		gross:
			net === null
				? null
				: values.reduce<number>((sum, value) => sum + Math.abs(value ?? 0), 0),
		knownSubtotal: values.reduce<number>((sum, value) => sum + (value ?? 0), 0),
	};
}

export const oiTrades = [
	{ label: "Both sides open", contracts: 80, change: 80 },
	{ label: "Both sides close", contracts: 40, change: -40 },
	{ label: "One opens; one closes", contracts: 70, change: 0 },
] as const;

export function oiLedger(steps: number) {
	const rows = oiTrades.slice(
		0,
		Math.max(0, Math.min(oiTrades.length, Math.trunc(steps))),
	);
	return {
		volume: rows.reduce((sum, row) => sum + row.contracts, 0),
		oi: 100 + rows.reduce((sum, row) => sum + row.change, 0),
	};
}

/** Supplied hypothetical quotes, not a pricing model or isolated IV attribution. */
export const ivQuotes = [
	{
		id: "before",
		label: "Before event",
		spot: 100,
		iv: 60,
		days: 7,
		premium: 3,
	},
	{
		id: "smaller",
		label: "Smaller rise",
		spot: 103,
		iv: 35,
		days: 6,
		premium: 1,
	},
	{
		id: "larger",
		label: "Larger rise",
		spot: 110,
		iv: 35,
		days: 6,
		premium: 6,
	},
] as const;

export function quotePnl(premium: number) {
	return Math.round((premium - ivQuotes[0].premium) * 100);
}
