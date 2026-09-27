/** Cents per share as dollars, with a third decimal for half-cent midpoints. */
export const quoteMoney = (cents: number) =>
	`$${(cents / 100).toFixed(Number.isInteger(cents) ? 2 : 3)}`;
