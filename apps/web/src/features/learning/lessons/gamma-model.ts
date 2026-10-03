import {
	ALFA,
	type Contract,
	daysToExpiry,
	modelValue,
	OCT_100_CALL,
	oct100CallMonday,
	signedUsd,
	usd,
} from "@/content/world";

/** The numbers the gamma lesson teaches with, shared by its film and its playground. */

export const SPOT = ALFA.open / 100;
export const SEP_20: Contract = { expiry: "sep20", strike: 100, right: "call" };
export const DAYS = daysToExpiry(OCT_100_CALL.expiry);
export const SEP_DAYS = daysToExpiry(SEP_20.expiry);
export const model = (contract: Contract, spot: number) =>
	modelValue(contract, Math.round(spot * 100));

/** Greeks are taught to two places, and the arithmetic uses the shown figures. */
export const round2 = (value: number) => Math.round(value * 100) / 100;
export const DELTA = round2(model(OCT_100_CALL, SPOT).delta);
export const GAMMA = round2(model(OCT_100_CALL, SPOT).gamma);
export const MOVE = 2;
export const NEW_DELTA = round2(DELTA + GAMMA * MOVE);

// A figure that rounds to zero shows no sign, so a count through zero never reads "−0.00".
export const fixed2 = (value: number) =>
	value <= -0.005
		? `−${Math.abs(value).toFixed(2)}`
		: Math.abs(value).toFixed(2);
/** Greeks as shown: rounded to two places, then printed. */
export const greek = (value: number) => fixed2(round2(value));
export const stock = (dollars: number) =>
	usd(Math.round(dollars * 100), Number.isInteger(dollars) ? 0 : 2);
export const signedStock = (dollars: number) =>
	signedUsd(Math.round(dollars * 100), Number.isInteger(dollars) ? 0 : 2);
export const signedPrice = (dollars: number) =>
	signedUsd(Math.round(dollars * 100));

export const X_RANGE = [88, 112] as const;
export const series = (
	read: (spot: number) => number,
	from = X_RANGE[0],
	to = X_RANGE[1],
	step = 0.5,
) =>
	Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => {
		const spot = from + i * step;
		return [spot, read(spot)] as const;
	});

/** The price change delta alone predicts, and with the gamma term added. */
export const deltaOnly = (move: number) => DELTA * move;
export const withGamma = (move: number) =>
	DELTA * move + 0.5 * GAMMA * move * move;

const endPosition = (holder: "you" | "ben") =>
	oct100CallMonday.trades.reduce(
		(sum, trade) =>
			sum +
			(trade.buyer === holder ? trade.quantity : 0) -
			(trade.seller === holder ? trade.quantity : 0),
		oct100CallMonday.startPositions[holder],
	);
export const contracts = { you: endPosition("you"), ben: endPosition("ben") };
export const optionDelta = (holder: "you" | "ben", delta: number) =>
	Math.round(contracts[holder] * delta * ALFA.multiplier);

/** A delta hedge before the move, after it, and rehedged. */
export function hedgeColumns(holder: "you" | "ben") {
	const before = optionDelta(holder, DELTA);
	const after = optionDelta(holder, NEW_DELTA);
	return [
		{ id: "before", options: before, shares: -before },
		{ id: "after", options: after, shares: -before },
		{ id: "rehedged", options: after, shares: -after },
	] as const;
}

export const gammaOf = (contract: Contract, spot: number) =>
	model(contract, spot).gamma;

export const [hedgeBefore, hedgeAfter, hedgeFixed] = hedgeColumns("you");
export const youDrift = hedgeAfter.options + hedgeAfter.shares;
export const youTrade = hedgeFixed.shares - hedgeAfter.shares;
export const benColumns = hedgeColumns("ben");
export const benDrift = benColumns[1].options + benColumns[1].shares;
export const benTrade = benColumns[2].shares - benColumns[1].shares;
export const base = model(OCT_100_CALL, SPOT).price;
export const repricedUp = model(OCT_100_CALL, SPOT + MOVE).price - base;
export const sepAtStrike = gammaOf(SEP_20, SPOT);
export const octAtStrike = gammaOf(OCT_100_CALL, SPOT);
export const FAR = 92;

/** The whole-dollar price where the Oct 18 call's delta changes fastest: its gamma peak. */
export const STEEPEST = Array.from({ length: 21 }, (_, i) => 90 + i).reduce(
	(best, spot) =>
		gammaOf(OCT_100_CALL, spot) > gammaOf(OCT_100_CALL, best) ? spot : best,
	90,
);
