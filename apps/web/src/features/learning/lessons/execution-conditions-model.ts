import {
	type Level,
	oct105BlockLegs,
	oct105CallVenues,
	oct110CallSweep,
} from "@/content/world";
import type { BookLevel } from "../walkthrough/instruments/order-book";

/** "$0.9525": prices that need more than two decimals. */
export const price4 = (cents: number) =>
	`$${(cents / 100).toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 4,
	})}`;

export const SWEEP = oct110CallSweep;
export const SWEEP_ASKS: BookLevel[] = SWEEP.asks.map((ask) => ({
	price: ask.price,
	size: ask.size,
	venue: ask.venue,
}));
export const SWEEP_BIDS: BookLevel[] = SWEEP.bids.map((bid) => ({
	price: bid.price,
	size: bid.size,
	venue: bid.venue,
}));

export const BLOCK_ASKS: Level[] = oct105CallVenues
	.map((quote) => quote.ask)
	.sort((a, b) => a.price - b.price);
export const BLOCK_BIDS: Level[] = oct105CallVenues
	.map((quote) => quote.bid)
	.sort((a, b) => b.price - a.price);

export const LEGS = oct105BlockLegs;
export const PACKAGE = {
	bid: LEGS.buy.bid - LEGS.sell.ask,
	ask: LEGS.buy.ask - LEGS.sell.bid,
	price: LEGS.buy.price - LEGS.sell.price,
};
