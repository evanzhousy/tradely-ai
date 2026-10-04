import {
	ALFA,
	alfaStockBook,
	daysToExpiry,
	modelVolatility,
	oct18OpenInterest,
	priceOption,
	usd,
} from "@/content/world";

/** The numbers the gamma regimes lesson teaches with, shared by its film and its playground. */

export const SPOT = ALFA.open / 100;
export const DAYS = daysToExpiry("oct18");
/** Model gamma to four places at a given ALFA price, as the GEX lesson rounded it. */
export const gammaAt = (spot: number, strike: number) =>
	Math.round(
		priceOption({
			spot,
			strike,
			days: DAYS,
			iv: modelVolatility("oct18", strike),
			right: "call",
		}).gamma * 10_000,
	) / 10_000;

/**
 * The modeled book from the GEX lesson: dealers long every Oct 18 call and short every put.
 * Share-gamma is the change in its delta, in shares, for a $1 rise.
 */
export const shareGamma = (spot: number) =>
	oct18OpenInterest.reduce(
		(sum, row) => sum + gammaAt(spot, row.strike) * (row.call - row.put) * 100,
		0,
	);
/** Net GEX in dollars per 1% move at a given spot. */
export const netGex = (spot: number) => shareGamma(spot) * spot * spot * 0.01;

export const money = (dollars: number) => {
	const sign = dollars < 0 ? "−" : dollars > 0 ? "+" : "";
	const size = Math.abs(dollars);
	return size >= 1_000_000
		? `${sign}$${(size / 1_000_000).toFixed(2)}M`
		: `${sign}$${Math.round(size / 1_000)}k`;
};
export const stock = (dollars: number) =>
	usd(Math.round(dollars * 100), Number.isInteger(dollars) ? 0 : 2);
/** A modeled price level to one decimal: "$102.3". */
export const level = (dollars: number) => `$${dollars.toFixed(1)}`;

/** The spot where the repriced book's gamma changes sign. */
export const FLIP = (() => {
	let low = 95;
	let high = 110;
	for (let i = 0; i < 50; i++) {
		const mid = (low + high) / 2;
		if (shareGamma(mid) < 0) low = mid;
		else high = mid;
	}
	return Math.round(((low + high) / 2) * 10) / 10;
})();

/** The strike-chart shortcut: running sum of per-strike net GEX from the top strike down. */
export const cumulativeByStrike = (() => {
	const rows = [...oct18OpenInterest].sort((a, b) => b.strike - a.strike);
	let running = 0;
	return rows
		.map((row) => {
			running +=
				gammaAt(SPOT, row.strike) *
				(row.call - row.put) *
				100 *
				SPOT *
				SPOT *
				0.01;
			return [row.strike, running / 1_000_000] as const;
		})
		.reverse();
})();
export const SHORTCUT = (() => {
	for (let i = 0; i < cumulativeByStrike.length - 1; i++) {
		const [k1, v1] = cumulativeByStrike[i];
		const [k2, v2] = cumulativeByStrike[i + 1];
		if (v1 < 0 !== v2 < 0)
			return Math.round((k1 + ((0 - v1) / (v2 - v1)) * (k2 - k1)) * 10) / 10;
	}
	return null;
})();

export const TARGET = Math.round(-shareGamma(SPOT));
export const offered = alfaStockBook.asks.reduce(
	(sum, level) => sum + level.size,
	0,
);
export const lastAsk = alfaStockBook.asks[alfaStockBook.asks.length - 1];

export const BOOK = Math.round(shareGamma(SPOT));
export const ABOVE = 105;
