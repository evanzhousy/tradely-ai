/** Authored snapshots are server-owned; this model only calculates local teaching outcomes. */
export type DepthLevel = { price: number; size: number };
export type ExecutionSide = "buy" | "sell";
export type OrderInstruction = "market" | "limit";
export type ExecutionConceptData = {
	kind: "execution-counterparties";
	contractBase: string;
	asOf: string;
	printedAt: string;
	bids: readonly [DepthLevel, DepthLevel, DepthLevel];
	asks: readonly [DepthLevel, DepthLevel, DepthLevel];
	unitTradeSize: number;
	defaultQuantity: number;
	maxQuantity: number;
	buyLimitRange: readonly [number, number];
	sellLimitRange: readonly [number, number];
	printId: string;
	records: readonly {
		id: string;
		instruction: OrderInstruction;
		limit: number | null;
	}[];
};

/** Prices are cents per share; quantity and displayed size are contracts. */
export function matchDisplayedBook(
	levels: readonly DepthLevel[],
	side: ExecutionSide,
	quantity: number,
	limit: number | null,
) {
	const requested = Math.max(0, Math.floor(quantity));
	let unfilled = requested;
	let value = 0;
	const rows = [...levels]
		.sort((a, b) => (side === "buy" ? a.price - b.price : b.price - a.price))
		.map((level) => {
			const eligible =
				limit === null ||
				(side === "buy" ? level.price <= limit : level.price >= limit);
			const filled = eligible ? Math.min(unfilled, Math.max(0, level.size)) : 0;
			unfilled -= filled;
			value += filled * level.price;
			return { ...level, eligible, filled };
		});
	const filled = requested - unfilled;
	return { rows, filled, unfilled, average: filled ? value / filled : null };
}

export function executionRoles(
	data: ExecutionConceptData,
	side: ExecutionSide,
	confirmed: boolean,
) {
	return {
		buyer: side === "buy" ? "incoming" : "resting",
		seller: side === "sell" ? "incoming" : "resting",
		price: side === "buy" ? data.asks[0].price : data.bids[0].price,
		location: side === "buy" ? "ASK" : "BID",
		prints: confirmed ? 1 : 0,
		volume: confirmed ? data.unitTradeSize : 0,
	} as const;
}
export const executionMoney = (cents: number) =>
	`$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
