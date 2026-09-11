import "@tanstack/react-start/server-only";
import type { QuoteConceptData } from "@/domain/learning/quote-concept";

/** Fictional, ungraded evidence for the paid lesson. All times are on this snapshot date. */
export const quoteConceptData: QuoteConceptData = {
	kind: "quotes-orders-trades",
	contract: "ALFA 2030-06-21 $50 CALL",
	asOf: "2030-06-03 · 10:30:00 ET",
	quoteAt: "10:30:00 ET",
	outcomeAt: "10:30:01 ET",
	staleAt: "10:20:00 ET",
	bid: 200,
	ask: 210,
	bidSize: 40,
	askSize: 30,
	last: { price: 208, at: "10:29:45 ET" },
	askRange: [205, 230],
	eventLimit: 10,
	venues: [
		{ id: "A", bid: 195, ask: 215, bidSize: 30, askSize: 25 },
		{ id: "B", bid: 200, ask: 212, bidSize: 20, askSize: 15 },
		{ id: "C", bid: 198, ask: 210, bidSize: 40, askSize: 10 },
	],
	staleVenue: "C",
};
