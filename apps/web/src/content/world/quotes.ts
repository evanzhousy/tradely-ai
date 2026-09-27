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

/**
 * A 500-contract block in the Oct 18 105 call at 10:50, the print the review lesson checks.
 * It was one leg of a call spread: at the same instant 500 Oct 18 110 calls sold at $0.90.
 * Tuesday's open-interest report shows the 105 call up 480, so most of it opened.
 */
export const oct105CallBlock = {
	time: "10:50:00.4",
	quantity: 500,
	price: 215,
	quote: { time: "10:50:00.3", bid: 205, ask: 215 },
	staleQuote: { time: "10:48:30.4", bid: 200, ask: 210 },
	pairedLeg: { strike: 110, quantity: 500, price: 90, side: "sell" as const },
	openInterestChange: 480,
} as const;

/** One report on a trade feed. Price in cents; `trade` links reports about the same execution. */
export type FeedMessage = {
	id: string;
	received: string;
	kind: "new" | "duplicate" | "cancel" | "correct";
	trade: string;
	quantity?: number;
	price?: number;
};

/**
 * Every feed message about the Oct 18 105 call on Monday. Only two executions survive: the
 * 10:12 print and the 10:50 block. A bad 10:40 print is busted, and the block first arrives
 * with a mistyped price that a correction fixes.
 */
export const oct105CallMessages: readonly FeedMessage[] = [
	{
		id: "M1",
		received: "10:12:05.1",
		kind: "new",
		trade: "T-1",
		quantity: 5,
		price: 200,
	},
	{ id: "M2", received: "10:12:05.3", kind: "duplicate", trade: "T-1" },
	{
		id: "M3",
		received: "10:40:10.2",
		kind: "new",
		trade: "T-2",
		quantity: 20,
		price: 260,
	},
	{ id: "M4", received: "10:41:30.0", kind: "cancel", trade: "T-2" },
	{
		id: "M5",
		received: "10:50:00.5",
		kind: "new",
		trade: "T-3",
		quantity: 500,
		price: 251,
	},
	{
		id: "M6",
		received: "10:50:02.8",
		kind: "correct",
		trade: "T-3",
		quantity: 500,
		price: 215,
	},
];

/** The trades a feed represents after applying messages in order: duplicates ignored. */
export function applyMessages(messages: readonly FeedMessage[]) {
	const trades = new Map<string, { quantity: number; price: number }>();
	for (const message of messages) {
		if (message.kind === "new" && !trades.has(message.trade))
			trades.set(message.trade, {
				quantity: message.quantity ?? 0,
				price: message.price ?? 0,
			});
		if (message.kind === "cancel") trades.delete(message.trade);
		if (message.kind === "correct" && trades.has(message.trade))
			trades.set(message.trade, {
				quantity: message.quantity ?? 0,
				price: message.price ?? 0,
			});
	}
	return trades;
}
