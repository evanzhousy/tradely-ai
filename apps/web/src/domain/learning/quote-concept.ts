/** Authored examples arrive through the authorized Learn projection, never a client fixture. */
export type QuoteConceptData = {
	kind: "quotes-orders-trades";
	contract: string;
	asOf: string;
	quoteAt: string;
	outcomeAt: string;
	staleAt: string;
	bid: number;
	ask: number;
	bidSize: number;
	askSize: number;
	last: { price: number; at: string };
	askRange: readonly [number, number];
	eventLimit: number;
	venues: readonly VenueQuote[];
	staleVenue: string;
};
/** Prices are cents per share; sizes are contracts. */
export type VenueQuote = {
	id: string;
	bid: number;
	ask: number;
	bidSize: number;
	askSize: number;
};
export type BookEvent = "add" | "cancel" | "trade";
export const quoteMeasures = (bid: number, ask: number) => ({
	spread: ask - bid,
	midpoint: (bid + ask) / 2,
});
export const quoteMoney = (cents: number) =>
	`$${(cents / 100).toFixed(Number.isInteger(cents) ? 2 : 3)}`;
export function bookOutcome(
	data: QuoteConceptData,
	event: BookEvent,
	size: number,
	confirmed: boolean,
) {
	const quantity = Math.max(
		0,
		Math.min(Math.floor(size), data.eventLimit, data.askSize),
	);
	const traded = confirmed && event === "trade";
	return {
		askSize:
			data.askSize + (confirmed ? (event === "add" ? quantity : -quantity) : 0),
		volume: traded ? quantity : 0,
		prints: traded && quantity > 0 ? 1 : 0,
		last:
			traded && quantity > 0
				? { price: data.ask, at: data.outcomeAt }
				: data.last,
	};
}
export function bestQuotes(venues: readonly VenueQuote[]) {
	if (!venues.length) return null;
	const bid = Math.max(...venues.map((v) => v.bid));
	const ask = Math.min(...venues.map((v) => v.ask));
	return {
		bid,
		ask,
		bidVenues: venues.filter((v) => v.bid === bid).map((v) => v.id),
		askVenues: venues.filter((v) => v.ask === ask).map((v) => v.id),
		...quoteMeasures(bid, ask),
	};
}
