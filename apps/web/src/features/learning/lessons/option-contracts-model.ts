import {
	ALFA,
	type Contract,
	expiries,
	oct100CallCloseQuote,
	optionQuote,
} from "@/content/world";

/** The symbol, quote and observations the contracts lesson teaches with, shared by its film and its playground. */

/** OCC-style option symbol: root padded to six characters, YYMMDD, C or P, strike × 1000. */
export function symbolParts(contract: Contract) {
	const date = expiries[contract.expiry].date;
	return {
		root: `${ALFA.symbol}  `,
		date: `${date.slice(2, 4)}${date.slice(5, 7)}${date.slice(8, 10)}`,
		right: contract.right === "call" ? "C" : "P",
		strike: String(contract.strike * 1000).padStart(8, "0"),
	};
}

export const call100: Contract = {
	expiry: "oct18",
	strike: 100,
	right: "call",
};
export const ASK = optionQuote(call100).ask;

/** Two observations of the Oct 18 100 call, in cents; `at` is minutes after 4:00. */
export const observations = {
	morning: { at: 630, time: "10:30", bid: 405, ask: 420, spot: 10_002 },
	close: { at: 959, ...oct100CallCloseQuote },
} as const;
