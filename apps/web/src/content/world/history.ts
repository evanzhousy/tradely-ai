/**
 * ALFA's closes for the 21 sessions before the teaching Monday, Aug 15 to Fri Sep 13
 * (Sep 2 was a holiday). Late August swung harder than early September, so the window
 * chosen changes realized volatility.
 */
export const alfaCloses: readonly { date: string; close: number }[] = [
	{ date: "2030-08-15", close: 100.02 },
	{ date: "2030-08-16", close: 101.92 },
	{ date: "2030-08-19", close: 104.26 },
	{ date: "2030-08-20", close: 102.59 },
	{ date: "2030-08-21", close: 99.82 },
	{ date: "2030-08-22", close: 100.92 },
	{ date: "2030-08-23", close: 102.94 },
	{ date: "2030-08-26", close: 101.6 },
	{ date: "2030-08-27", close: 99.36 },
	{ date: "2030-08-28", close: 101.15 },
	{ date: "2030-08-29", close: 99.63 },
	{ date: "2030-08-30", close: 100.23 },
	{ date: "2030-09-03", close: 99.03 },
	{ date: "2030-09-04", close: 99.92 },
	{ date: "2030-09-05", close: 101.02 },
	{ date: "2030-09-06", close: 100.21 },
	{ date: "2030-09-09", close: 99.71 },
	{ date: "2030-09-10", close: 100.91 },
	{ date: "2030-09-11", close: 99.9 },
	{ date: "2030-09-12", close: 100.3 },
	{ date: "2030-09-13", close: 99.6 },
];

/** ALFA reports after the close on this date, inside the Oct 4, 11 and 18 expiries. */
export const ALFA_EARNINGS_DATE = "2030-10-03";

/** Daily log returns from consecutive closes, oldest first. */
export function dailyReturns(closes: readonly { close: number }[]) {
	return closes.slice(1).map((day, i) => Math.log(day.close / closes[i].close));
}

/** Sample standard deviation. */
export function standardDeviation(values: readonly number[]) {
	const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
	return Math.sqrt(
		values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
			(values.length - 1),
	);
}

/** Realized volatility: daily standard deviation scaled to a year of `periods` sessions. */
export function realizedVolatility(returns: readonly number[], periods = 252) {
	return standardDeviation(returns) * Math.sqrt(periods);
}
