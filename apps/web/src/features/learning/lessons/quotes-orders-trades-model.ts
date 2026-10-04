import {
	bestQuote,
	type Contract,
	type Level,
	oct105CallVenues,
	type VenueQuote,
} from "@/content/world";

/** The book and venues the quotes lesson teaches with, shared by its film and its playground. */

export const CALL_105: Contract = {
	expiry: "oct18",
	strike: 105,
	right: "call",
};

/** Every venue's levels combined into one book, best first. */
export const BASE_ASKS: Level[] = oct105CallVenues
	.map((quote) => quote.ask)
	.sort((a, b) => a.price - b.price);
export const BASE_BIDS: Level[] = oct105CallVenues
	.map((quote) => quote.bid)
	.sort((a, b) => b.price - a.price);
export const BEST = bestQuote(oct105CallVenues);

/** Contracts a seller adds to the best offer, and a buyer takes from it. */
export const ADDED = 5;
export const TAKEN = 3;

/** The venues, with venue C's ask moved or, at null, traded away. */
export function venuesFor(state: { cAsk: number | null }): VenueQuote[] {
	return oct105CallVenues.map((quote) =>
		quote.venue === "C"
			? {
					...quote,
					ask:
						state.cAsk === null
							? { ...quote.ask, size: 0 }
							: { ...quote.ask, price: state.cAsk },
				}
			: quote,
	);
}
