import {
	ALFA,
	daysToExpiry,
	type ExpiryId,
	modelVolatility,
	priceOption,
} from "@/content/world";

/** The numbers the volatility surface lesson teaches with, shared by its film and its playground. */

export const SPOT = ALFA.open / 100;
export const STRIKES = [90, 95, 100, 105, 110] as const;
export const EXPIRIES: readonly ExpiryId[] = [
	"sep20",
	"sep27",
	"oct4",
	"oct18",
	"nov15",
	"dec20",
];
/** Implied volatility in whole vol points, as the grid shows it. */
export const ivPoints = (expiry: ExpiryId, strike: number) =>
	Math.round(modelVolatility(expiry, strike) * 100);

export const OCT18_DAYS = daysToExpiry("oct18");
export const deltaAt = (strike: number, right: "call" | "put") =>
	priceOption({
		spot: SPOT,
		strike,
		days: OCT18_DAYS,
		iv: modelVolatility("oct18", strike),
		right,
	}).delta;
/** The strike whose delta is `target`, found by bisection: delta falls as strike rises. */
export function strikeForDelta(right: "call" | "put", target: number) {
	let low = 60;
	let high = 140;
	for (let i = 0; i < 60; i++) {
		const mid = (low + high) / 2;
		if (deltaAt(mid, right) > target) low = mid;
		else high = mid;
	}
	return (low + high) / 2;
}
export const round1 = (value: number) => Math.round(value * 10) / 10;
export const CALL_WING = strikeForDelta("call", 0.25);
export const PUT_WING = strikeForDelta("put", -0.25);
export const CALL_IV = round1(modelVolatility("oct18", CALL_WING) * 100);
export const PUT_IV = round1(modelVolatility("oct18", PUT_WING) * 100);
export const ATM_IV = round1(modelVolatility("oct18", 100) * 100);
export const SKEW = round1(PUT_IV - CALL_IV);
export const signedPoints = (value: number) =>
	`${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toFixed(1)}`;

/** No IV where there was no usable price: the 4-day wings had no bid, Dec 20 105 no quote. */
export const MISSING: readonly { row: ExpiryId; strike: number }[] = [
	{ row: "sep20", strike: 90 },
	{ row: "sep20", strike: 110 },
	{ row: "dec20", strike: 105 },
];
export const INTERPOLATED = Math.round(
	(ivPoints("dec20", 100) + ivPoints("dec20", 110)) / 2,
);
export const term = EXPIRIES.map((expiry) => ivPoints(expiry, 100));
