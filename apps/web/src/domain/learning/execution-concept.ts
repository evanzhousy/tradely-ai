/** One displayed price level: cents per share and a size in contracts. */
export type DepthLevel = { price: number; size: number };

export const executionMoney = (cents: number) =>
	`$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
