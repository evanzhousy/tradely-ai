import {
	ALFA,
	type Contract,
	type Copy,
	daysToExpiry,
	modelValue,
	OCT_100_CALL,
	oct100CallMonday,
	signedUsd,
	usd,
} from "@/content/world";

/** The numbers the delta lesson teaches with, shared by its film and its playground. */

export type Right = "call" | "put";
export const contractFor = (right: Right): Contract => ({
	...OCT_100_CALL,
	right,
});
export const rightName = (right: Right): Copy =>
	right === "call" ? ["call", "看涨"] : ["put", "看跌"];

/** ALFA's price in dollars. */
export const SPOT = ALFA.open / 100;
export const DAYS = daysToExpiry(OCT_100_CALL.expiry);
export const model = (right: Right, spot: number) =>
	modelValue(contractFor(right), Math.round(spot * 100));
/** Deltas are shown to two places and every estimate uses the shown figure. */
export const round2 = (value: number) => Math.round(value * 100) / 100;
export const deltaAt = (right: Right, spot: number) =>
	round2(model(right, spot).delta);
export const valueAt = (right: Right, spot: number) => model(right, spot).price;
export const CALL_DELTA = deltaAt("call", SPOT);
export const PUT_DELTA = deltaAt("put", SPOT);

/** Dollars per share: "$4.13". */
export const price = (dollars: number) => usd(Math.round(dollars * 100));
/** ALFA prices and moves in whole dollars: "$100", "+$10". */
export const stock = (dollars: number) =>
	usd(Math.round(dollars * 100), Number.isInteger(dollars) ? 0 : 2);
export const signedStock = (dollars: number) =>
	signedUsd(Math.round(dollars * 100), Number.isInteger(dollars) ? 0 : 2);
export const signedPrice = (dollars: number) =>
	signedUsd(Math.round(dollars * 100));
export const fixed2 = (value: number) =>
	value <= -0.005
		? `−${Math.abs(value).toFixed(2)}`
		: Math.abs(value).toFixed(2);

export const X_RANGE = [88, 112] as const;
export const curve = (right: Right) =>
	Array.from({ length: X_RANGE[1] - X_RANGE[0] + 1 }, (_, i) => {
		const spot = X_RANGE[0] + i;
		return [spot, valueAt(right, spot)] as const;
	});
/** The tangent at `at`: the straight line delta alone predicts. */
export const tangent = (right: Right, at: number) => {
	const slope = deltaAt(right, at);
	const base = valueAt(right, at);
	return X_RANGE.map((spot) => [spot, base + slope * (spot - at)] as const);
};

export const MOVE = 0.4;
const endPosition = (holder: "you" | "ben") =>
	oct100CallMonday.trades.reduce(
		(sum, trade) =>
			sum +
			(trade.buyer === holder ? trade.quantity : 0) -
			(trade.seller === holder ? trade.quantity : 0),
		oct100CallMonday.startPositions[holder],
	);
export const holders = [
	{ id: "you", name: ["You", "你"] as Copy, contracts: endPosition("you") },
	{ id: "ben", name: ["Ben", "Ben"] as Copy, contracts: endPosition("ben") },
] as const;
export const perContract = Math.round(CALL_DELTA * ALFA.multiplier);
export const positionDelta = (contracts: number) => contracts * perContract;
export const moveDollars = (contracts: number) =>
	Math.round(positionDelta(contracts) * MOVE * 100);

export const up1 = valueAt("call", SPOT + 1) - valueAt("call", SPOT);
export const up10 = valueAt("call", SPOT + 10) - valueAt("call", SPOT);
export const down10 = valueAt("call", SPOT - 10) - valueAt("call", SPOT);

/** The lowest whole-dollar price at which the call's delta passes 0.80. */
export const DEEP =
	Array.from({ length: 21 }, (_, i) => 90 + i).find(
		(spot) => deltaAt("call", spot) > 0.8,
	) ?? 110;
/** The smallest rise for which delta alone misses the model's price change by over $1. */
export const MISS_AT =
	Array.from({ length: 12 }, (_, i) => i + 1).find(
		(move) =>
			Math.abs(
				valueAt("call", SPOT + move) -
					valueAt("call", SPOT) -
					CALL_DELTA * move,
			) > 1,
	) ?? 12;
