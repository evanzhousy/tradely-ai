import {
	ALFA,
	daysToExpiry,
	modelVolatility,
	oct105BlockLegs,
	priceOption,
} from "@/content/world";

/** The numbers the charm and vanna lesson teaches with, shared by its film and its playground. */

export const SPOT = ALFA.open / 100;
export const DAYS = daysToExpiry("oct18");
export const WEEK = 7;
export const VOL_DROP = 3;
/** Model delta of an Oct 18 call, to three places: the small changes here need them. */
export const delta = (strike: number, elapsed = 0, volPoints = 0) =>
	Math.round(
		priceOption({
			spot: SPOT,
			strike,
			days: DAYS - elapsed,
			iv: modelVolatility("oct18", strike) + volPoints / 100,
			right: "call",
		}).delta * 1000,
	) / 1000;
export const fixed3 = (value: number) =>
	`${value < 0 ? "−" : value > 0 ? "+" : ""}${Math.abs(value).toFixed(3)}`;
export const plain3 = (value: number) => value.toFixed(3);

export const STRIKE = 110;
export const TODAY = delta(STRIKE);
export const AFTER_WEEK = delta(STRIKE, WEEK);
export const AFTER_BOTH = delta(STRIKE, WEEK, -VOL_DROP);
export const CHARM_DAY = delta(STRIKE, 1) - TODAY;
export const VANNA_POINT =
	Math.round((delta(STRIKE, 0, 1) - TODAY) * 10_000) / 10_000;
/** The same charm quoted per year of time remaining: time left runs the other way. */
export const PER_YEAR = `${-CHARM_DAY * 365 > 0 ? "+" : "−"}${Math.abs(CHARM_DAY * 365).toFixed(2)}`;

export const LONG = oct105BlockLegs.buy;
export const SHORT = oct105BlockLegs.sell;
export const positionDelta = (elapsed: number, volPoints: number) => {
	const long = Math.round(
		LONG.quantity * 100 * delta(LONG.strike, elapsed, volPoints),
	);
	const short = -Math.round(
		SHORT.quantity * 100 * delta(SHORT.strike, elapsed, volPoints),
	);
	return { long, short, net: long + short };
};
export const spreadAt = (stage: 0 | 1 | 2) =>
	stage === 0
		? positionDelta(0, 0)
		: stage === 1
			? positionDelta(WEEK, 0)
			: positionDelta(WEEK, -VOL_DROP);
