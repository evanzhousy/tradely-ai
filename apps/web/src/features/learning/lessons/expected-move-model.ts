import { type Contract, type Copy, modelValue, usd } from "@/content/world";

/** The numbers the expected-move lesson teaches with, shared by its film and its playground. */

export const SPOT = 100;
export const IV = 35;
export const DAYS = 32;
/** One standard deviation of the price at expiry, in dollars, under the model. */
export const oneSd = (iv: number, days: number) =>
	SPOT * (iv / 100) * Math.sqrt(days / 365);
export const MOVE = oneSd(IV, DAYS);
export const share = (dollars: number) => usd(Math.round(dollars * 100));
export const plusMinus = (dollars: number) => `±${share(dollars)}`;

export const CALL: Contract = { expiry: "oct18", strike: 100, right: "call" };
export const PUT: Contract = { expiry: "oct18", strike: 100, right: "put" };
export const STRADDLE = modelValue(CALL).price + modelValue(PUT).price;

/** Twelve past monthly expiries: each move at expiry as a multiple of its implied one-SD move. */
export const PAST = [
	0.4, 1.3, 0.7, 0.2, 1.1, 0.9, 0.5, 2.2, 0.3, 0.8, 1.2, 0.6,
];
export const MONTHS: readonly Copy[] = [
	["Oct", "10月"],
	["Nov", "11月"],
	["Dec", "12月"],
	["Jan", "1月"],
	["Feb", "2月"],
	["Mar", "3月"],
	["Apr", "4月"],
	["May", "5月"],
	["Jun", "6月"],
	["Jul", "7月"],
	["Aug", "8月"],
	["Sep", "9月"],
];
export const outside = (band: number) =>
	PAST.filter((ratio) => ratio > band).length;
/** The share of outcomes beyond one and two SD under the model, in percent. */
export const MODEL_OUTSIDE = { 1: 31.7, 2: 4.6 } as const;
