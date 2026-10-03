import {
	ALFA,
	alfaCloses,
	type Copy,
	dailyReturns,
	daysToExpiry,
	expiries,
	OCT_100_CALL,
	optionQuote,
	priceOption,
	realizedVolatility,
	standardDeviation,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";

/** The numbers the implied and realized volatility lesson teaches with, shared by its film and its playground. */

export const SPOT = ALFA.open / 100;
export const STRIKE = OCT_100_CALL.strike;
export const DAYS = daysToExpiry(OCT_100_CALL.expiry);
export const callAt = (iv: number) =>
	priceOption({ spot: SPOT, strike: STRIKE, days: DAYS, iv, right: "call" })
		.price;

/** The volatility at which the model reproduces a price: bisection, since price rises with IV. */
export function impliedVolatility(target: number) {
	let low = 0.01;
	let high = 2;
	for (let i = 0; i < 60; i++) {
		const mid = (low + high) / 2;
		if (callAt(mid) < target) low = mid;
		else high = mid;
	}
	return (low + high) / 2;
}

export const quote = optionQuote(OCT_100_CALL);
export type Source = "bid" | "mid" | "ask";
export const prices: Record<Source, number> = {
	bid: quote.bid / 100,
	mid: (quote.bid + quote.ask) / 200,
	ask: quote.ask / 100,
};
export const fitted: Record<Source, number> = {
	bid: impliedVolatility(prices.bid),
	mid: impliedVolatility(prices.mid),
	ask: impliedVolatility(prices.ask),
};
export const sourceName: Record<Source, Copy> = {
	bid: ["bid", "买价"],
	mid: ["mid", "中间价"],
	ask: ["ask", "卖价"],
};

export const percent = (fraction: number, places = 1) =>
	`${fraction < 0 ? "−" : ""}${Math.abs(fraction * 100).toFixed(places)}%`;
export const price = (dollars: number) => usd(Math.round(dollars * 100));

export type Window = 20 | 10;
export const returns = dailyReturns(alfaCloses);
export const windowReturns = (window: Window) =>
	returns.slice(returns.length - window);
export const rv = (window: Window, periods: 252 | 365 = 252) =>
	realizedVolatility(windowReturns(window), periods);
export const RV20 = rv(20);
export const RV10 = rv(10);
export const DAILY_SD = standardDeviation(windowReturns(20));

/** "Aug 16" / "8月16日". */
export const shortDate = (iso: string, locale: Locale) => {
	const [, month, day] = iso.split("-").map(Number);
	return locale === "zh"
		? `${month}月${day}日`
		: new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				timeZone: "UTC",
			});
};

export const IV_POINTS = Math.round(fitted.mid * 100);
export const RV_POINTS = Math.round(RV20 * 100);
export const GAP = IV_POINTS - RV_POINTS;

export const dayIndex = (iso: string) =>
	Math.round(
		(Date.parse(`${iso}T12:00:00Z`) -
			Date.parse(`${alfaCloses[0].date}T12:00:00Z`)) /
			86_400_000,
	);
export const TIMELINE_END = dayIndex(expiries.oct18.date);
export const GUESS = 0.3;
