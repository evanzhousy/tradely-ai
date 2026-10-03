import {
	ALFA,
	daysToExpiry,
	modelVolatility,
	normalCdf,
	OCT_100_CALL,
	oct100CallMonday,
	priceOption,
	SESSION_DATE,
	signedUsd,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";

/** The numbers the theta, vega and rho lesson teaches with, shared by its film and its playground. */

export const SPOT = ALFA.open / 100;
export const STRIKE = OCT_100_CALL.strike;
export const DAYS = daysToExpiry(OCT_100_CALL.expiry);
export const IV = modelVolatility(OCT_100_CALL.expiry, STRIKE);
export const value = (spot: number, days: number, iv: number) =>
	priceOption({ spot, strike: STRIKE, days, iv, right: "call" });

export const round = (value: number, places: number) =>
	Math.round(value * 10 ** places) / 10 ** places;
export const TODAY = value(SPOT, DAYS, IV);
/** Delta and gamma as the last two lessons showed them; theta and vega to the tenth of a cent. */
export const DELTA = round(TODAY.delta, 2);
export const GAMMA = round(TODAY.gamma, 2);
export const THETA = round(TODAY.theta, 3);
export const VEGA = round(TODAY.vega, 3);
/** Rho at a zero rate: strike × years × N(d2), per percentage point. */
export const RHO = (() => {
	const years = DAYS / 365;
	const sd = IV * Math.sqrt(years);
	return round((STRIKE * years * normalCdf(-sd / 2)) / 100, 3);
})();

/** Per-share dollars: "$4.13", or "−$0.065" with three places. */
export const price = (dollars: number, places = 2) =>
	usd(round(dollars * 100, places - 2), places);
export const signedPrice = (dollars: number, places = 2) =>
	signedUsd(round(dollars * 100, places - 2), places);
export const points = (iv: number) => `${round(iv * 100, 2)}%`;

/** A date `days` after the session, "Sep 23" / "9月23日". */
export const dateAfter = (days: number, locale: Locale) => {
	const date = new Date(`${SESSION_DATE}T12:00:00Z`);
	date.setUTCDate(date.getUTCDate() + days);
	return locale === "zh"
		? `${date.getUTCMonth() + 1}月${date.getUTCDate()}日`
		: date.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				timeZone: "UTC",
			});
};

export const contracts = (holder: "you" | "ben") =>
	oct100CallMonday.trades.reduce(
		(sum, trade) =>
			sum +
			(trade.buyer === holder ? trade.quantity : 0) -
			(trade.seller === holder ? trade.quantity : 0),
		oct100CallMonday.startPositions[holder],
	);

export type Scenario = { move: number; days: number; volPoints: number };

/** Each Greek's contribution to a scenario, their sum, and the model's full repricing. */
export function contributions(state: Scenario) {
	const delta = DELTA * state.move;
	const gamma = 0.5 * GAMMA * state.move * state.move;
	const theta = THETA * state.days;
	const vega = VEGA * state.volPoints;
	const total =
		round(delta, 2) + round(gamma, 2) + round(theta, 2) + round(vega, 2);
	const repriced =
		value(SPOT + state.move, DAYS - state.days, IV + state.volPoints / 100)
			.price - TODAY.price;
	return { delta, gamma, theta, vega, total: round(total, 2), repriced };
}

export const WEEK = 7;
export const afterWeek = value(SPOT, DAYS - WEEK, IV);
export const lastWeek = value(SPOT, WEEK, IV);
export const lastDay = value(SPOT, 1, IV);
export const IV_UP = IV + 0.03;
export const ivUp = value(SPOT, DAYS, IV_UP).price - TODAY.price;
export const IV_RELATIVE = round(IV * 1.03, 4);
export const ivRelative = value(SPOT, DAYS, IV_RELATIVE).price - TODAY.price;
export const SCENARIO = { move: 1, days: 6, volPoints: -3 } as const;
export const scenario = contributions(SCENARIO);

/** The first day on which the call loses more than $0.10 a day, ALFA and IV unchanged. */
export const FAST_DAY =
	Array.from({ length: DAYS }, (_, i) => i).find(
		(elapsed) => -value(SPOT, DAYS - elapsed, IV).theta > 0.1,
	) ?? DAYS - 1;
/** The highest IV, in whole points, at which the call is worth at least $1 less than today. */
export const DOLLAR_IV =
	Array.from({ length: 31 }, (_, i) => 50 - i).find(
		(point) => TODAY.price - value(SPOT, DAYS, point / 100).price >= 1,
	) ?? 20;
