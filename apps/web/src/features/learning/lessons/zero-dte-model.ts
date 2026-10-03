import { modelVolatility, priceOption, usd } from "@/content/world";

/** The numbers the 0DTE lesson teaches with, shared by its film and its playground. */

/** Friday Sep 20, the Sep 20 options' last day. Times are hours of the clock: 9.5 is 9:30. */
export const OPEN = 9.5;
export const CLOSE = 16;
export const STRIKE = 100;
export const IV = modelVolatility("sep20", STRIKE);
export const sep20 = (time: number, spot = STRIKE) =>
	priceOption({
		spot,
		strike: STRIKE,
		days: Math.max(CLOSE - time, 0) / 24,
		iv: IV,
		right: "call",
	});
/** The Oct 18 100 call a month out, for contrast. */
export const oct18Delta = (spot: number) =>
	priceOption({ spot, strike: STRIKE, days: 32, iv: 0.35, right: "call" })
		.delta;
export const clock = (time: number) =>
	`${Math.floor(time)}:${time % 1 ? "30" : "00"}`;
export const share = (dollars: number) => usd(Math.round(dollars * 100));
export const fixed2 = (value: number) => value.toFixed(2);

export const AT_OPEN = sep20(OPEN).price;
export const steps = Array.from(
	{ length: (CLOSE - OPEN) * 2 + 1 },
	(_, i) => OPEN + i / 2,
);
/** The first half-hour by which the call has lost half its opening value. */
export const HALF_GONE =
	steps.find((time) => sep20(time).price <= AT_OPEN / 2) ?? CLOSE;

export const LOW = 99.8;
export const HIGH = 100.2;
export const swingAt = (time: number) =>
	sep20(time, HIGH).delta - sep20(time, LOW).delta;
/** The latest half-hour at which a 40-cent move still shifts delta by less than 0.3. */
export const LATEST_CALM =
	[...steps]
		.filter((time) => time < CLOSE)
		.reverse()
		.find((time) => swingAt(time) < 0.3) ?? OPEN;
export const HEDGE_CONTRACTS = 1_000;
/** Shares bought to stay hedged, short `contracts` calls, over the 40-cent rise at `time`. */
export const hedgeShares = (time: number, contracts = HEDGE_CONTRACTS) =>
	Math.round((swingAt(time) * 100 * contracts) / 1_000) * 1_000;

export const THURSDAY_OI = 3_400;
export const FRIDAY_VOLUME = 12_000;
export const FRIDAY_CLOSE = 100.6;
