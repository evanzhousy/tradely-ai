import {
	type Level,
	oct100CallBookBeforeT1,
	oct100CallMonday,
	sweep,
} from "@/content/world";

/** The Oct 18 100 call's book at 10:05, just before Monday's first trade. */
export const BOOK = oct100CallBookBeforeT1;
/** Monday's first trade: you buy 10 from Ben's resting offer. */
export const T1 = oct100CallMonday.trades[0];
export const BIDS: readonly Level[] = BOOK.bids;
export const ASKS: readonly Level[] = BOOK.asks;

export type LimitState = {
	/** Cents per share. */
	limit: number;
	size: number;
	/** 0: the order arrives; 1–2: levels taken; 3: the remainder rests. */
	step: number;
};

/** The worked limit order: 30 contracts, at most $4.15. */
export const LIMIT_ORDER = { limit: 415, size: 30 } as const;

export function limitOutcome(state: LimitState) {
	const eligible = ASKS.filter((level) => level.price <= state.limit);
	const order = sweep(eligible, state.size);
	const fills = order.fills.slice(0, state.step >= 3 ? undefined : state.step);
	const filled = fills.reduce((sum, fill) => sum + fill.size, 0);
	const notional = fills.reduce((sum, fill) => sum + fill.price * fill.size, 0);
	const rests = state.step >= 3 ? state.size - filled : 0;
	return {
		fills,
		filled,
		notional,
		rests,
		unfilled: state.size - order.filled,
	};
}
