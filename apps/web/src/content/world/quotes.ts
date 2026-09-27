import type { Level } from "./book";

/** One venue's quote for a contract: its best bid and best ask, in cents per share. */
export type VenueQuote = { venue: string; bid: Level; ask: Level };

/**
 * The Oct 18 105 call at 10:30 on Monday, as three venues quote it. The combined best bid
 * (B) and best ask (C) make the chain's $2.05 / $2.15 quote. Its tape is separate from the
 * Oct 18 100 call's, so these examples leave that contract's day untouched.
 */
export const oct105CallVenues: readonly VenueQuote[] = [
	{ venue: "A", bid: { price: 200, size: 20 }, ask: { price: 220, size: 15 } },
	{ venue: "B", bid: { price: 205, size: 12 }, ask: { price: 225, size: 10 } },
	{ venue: "C", bid: { price: 195, size: 30 }, ask: { price: 215, size: 8 } },
];

/** The contract's only print before 10:30. */
export const oct105CallLast = { time: "10:12", price: 200, size: 5 } as const;

export const QUOTE_TIME = "10:30";

/** Highest bid and lowest ask across venues that still show size, with where they rest. */
export function bestQuote(venues: readonly VenueQuote[]) {
	const bids = venues.filter((quote) => quote.bid.size > 0);
	const asks = venues.filter((quote) => quote.ask.size > 0);
	const bid = bids.reduce((best, quote) =>
		quote.bid.price > best.bid.price ? quote : best,
	);
	const ask = asks.reduce((best, quote) =>
		quote.ask.price < best.ask.price ? quote : best,
	);
	return {
		bid: { ...bid.bid, venue: bid.venue },
		ask: { ...ask.ask, venue: ask.venue },
	};
}
