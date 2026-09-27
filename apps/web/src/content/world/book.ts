/** Price levels are in cents; sizes are shares for stock and contracts for options. */
export type Level = { price: number; size: number };

export type Sweep = {
	fills: Level[];
	/** Levels left after the order, with sizes reduced. */
	remaining: Level[];
	filled: number;
	/** Cents per unit times units, i.e. total cost in cents for one-share units. */
	notional: number;
};

/**
 * A marketable order takes the best level first, then the next, until it is filled or the
 * displayed size runs out. Real books can have hidden size and can change mid-order.
 */
export function sweep(levels: readonly Level[], quantity: number): Sweep {
	const fills: Level[] = [];
	const remaining: Level[] = [];
	let left = quantity;
	for (const level of levels) {
		if (left <= 0) {
			remaining.push(level);
			continue;
		}
		const take = Math.min(left, level.size);
		fills.push({ price: level.price, size: take });
		left -= take;
		if (level.size > take)
			remaining.push({ price: level.price, size: level.size - take });
	}
	return {
		fills,
		remaining,
		filled: quantity - left,
		notional: fills.reduce((sum, fill) => sum + fill.price * fill.size, 0),
	};
}
