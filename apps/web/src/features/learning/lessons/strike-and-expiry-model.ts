import {
	ALFA,
	type Contract,
	type Copy,
	daysToExpiry,
	type ExpiryId,
	expiries,
	modelValue,
	mondayActivity,
	NEXT_SESSION_DATE,
	oct18OpenInterest,
	optionQuote,
	quoteAt,
	signedUsd,
	usd,
	valueAtExpiry,
} from "@/content/world";

/**
 * The numbers the strike-and-expiry lesson teaches with, shared by its film and its
 * playground. One view (ALFA, $100 on Sep 16, higher in a month) and the calls that can
 * express it.
 *
 * Pricing assumptions, the same for every contract:
 * - Entry: one contract bought on Sep 16 at the ask of the world's chain quote
 *   (`optionQuote`): authored for the Oct 18 100 and 105 calls and the Dec 20 110 call, the
 *   model quote for the rest (the Oct 18 95 call's $7.30 is the price premium-payoff uses).
 * - A sale before expiry: at the bid of the model quote for that day and stock price
 *   (`quoteAt`), implied volatility unchanged. These results are modeled, never observed.
 * - At expiry: the contract is worth its intrinsic value.
 * - Delta is shown to two places and theta to a tenth of a cent a share, as the delta and
 *   theta lessons show them; a contract's daily decay is the shown theta × 100.
 * - Commissions and fees are left out.
 *
 * Money per share is in cents, as in the world. Cents per share equal dollars per 100-share
 * contract, so every per-contract figure below is in whole dollars.
 */

/** ALFA's price on Sep 16, in dollars. */
export const SPOT = ALFA.open / 100;

export const call = (expiry: ExpiryId, strike: number): Contract => ({
	expiry,
	strike,
	right: "call",
});

/** Cents per share paid at the Sep 16 ask; also dollars for one contract. */
export const paid = (contract: Contract) => optionQuote(contract).ask;
/** The price at expiry at which a bought call repays its premium, in dollars. */
export const breakEven = (contract: Contract) =>
	contract.strike + paid(contract) / 100;
const round = (value: number, places: number) =>
	Math.round(value * 10 ** places) / 10 ** places;
export const deltaOf = (contract: Contract) =>
	round(modelValue(contract).delta, 2);
/** Model theta in dollars per share per calendar day, to a tenth of a cent. */
export const thetaOf = (contract: Contract) =>
	round(modelValue(contract).theta, 3);
/** What one contract loses to a day's time decay on Sep 16, in dollars (negative). */
export const decayPerDay = (contract: Contract) =>
	round(thetaOf(contract) * ALFA.multiplier, 2);

/** One contract's result in dollars if ALFA is at `spot` dollars at its expiry. */
export const resultAtExpiry = (contract: Contract, spot: number) =>
	valueAtExpiry(contract, Math.round(spot * 100)) - paid(contract);
/** What one contract is worth at expiry, in dollars. */
export const worthAtExpiry = (contract: Contract, spot: number) =>
	valueAtExpiry(contract, Math.round(spot * 100));
/** The model bid, in dollars for one contract, with ALFA at `spot` dollars on a date. */
export const bidOn = (contract: Contract, spot: number, on: string) =>
	quoteAt(contract, Math.round(spot * 100), on).bid;
/** One contract's result in dollars if it is sold at the model bid on a date before expiry. */
export const resultOn = (contract: Contract, spot: number, on: string) =>
	bidOn(contract, spot, on) - paid(contract);
/** A result as a fraction of the premium paid. */
export const returnOn = (contract: Contract, result: number) =>
	result / paid(contract);

// ——— Three strikes, one expiry ———

export type StrikeId = "itm" | "atm" | "otm";
export const strikeCalls: readonly {
	id: StrikeId;
	contract: Contract;
	moneyness: Copy;
}[] = [
	{
		id: "itm",
		contract: call("oct18", 95),
		moneyness: ["in the money", "实值"],
	},
	{
		id: "atm",
		contract: call("oct18", 100),
		moneyness: ["at the money", "平值"],
	},
	{
		id: "otm",
		contract: call("oct18", 105),
		moneyness: ["out of the money", "虚值"],
	},
];
export const strikeCall = (id: StrikeId) =>
	strikeCalls.find((row) => row.id === id) ?? strikeCalls[0];

/** The small move soon after entry: ALFA $2 higher on the next session. */
export const SOON_SPOT = SPOT + 2;
export const SOON_DATE = NEXT_SESSION_DATE;
/** The move the film and the lesson follow to expiry: ALFA at $106 on Oct 18. */
export const EXPIRY_SPOT = SPOT + 6;
export const resultSoon = (contract: Contract, spot: number = SOON_SPOT) =>
	resultOn(contract, spot, SOON_DATE);

/** The range of ALFA prices the playground lets a learner try, in whole dollars. */
export const SPOT_RANGE = [94, 114] as const;
const wholeSpots = Array.from(
	{ length: SPOT_RANGE[1] - SPOT_RANGE[0] + 1 },
	(_, i) => SPOT_RANGE[0] + i,
);
const expiryReturn = (id: StrikeId, spot: number) => {
	const { contract } = strikeCall(id);
	return returnOn(contract, resultAtExpiry(contract, spot));
};
/**
 * The lowest whole-dollar price at expiry at which the out-of-the-money call's percentage
 * return passes the in-the-money call's.
 */
export const OTM_LEADS_AT =
	wholeSpots.find(
		(spot) =>
			spot > SPOT && expiryReturn("otm", spot) > expiryReturn("itm", spot),
	) ?? SPOT_RANGE[1];

// ——— One strike, three expiries ———

export type ExpiryRowId = "near" | "mid" | "far";
export const expiryCalls: readonly { id: ExpiryRowId; contract: Contract }[] = [
	{ id: "near", contract: call("sep20", 100) },
	{ id: "mid", contract: call("oct18", 100) },
	{ id: "far", contract: call("nov15", 100) },
];
export const expiryCall = (id: ExpiryRowId) =>
	expiryCalls.find((row) => row.id === id) ?? expiryCalls[0];
export const daysLeft = (contract: Contract) => daysToExpiry(contract.expiry);
export const expiryName = (contract: Contract): Copy =>
	expiries[contract.expiry].label;

/** The day the middle call expires: where the two longer calls are compared. */
export const CHECK_DATE = expiries.oct18.date;
export const LATER_RANGE = [94, 116] as const;
/**
 * One contract's result on Oct 18 with ALFA at `spot`: the Oct 18 call at its expiry value,
 * the Nov 15 call sold at its model bid with four weeks left. Null for the Sep 20 call, which
 * expired four weeks earlier at a price this scene does not set.
 */
export const resultOnCheck = (id: ExpiryRowId, spot: number) => {
	const { contract } = expiryCall(id);
	if (id === "near") return null;
	return id === "mid"
		? resultAtExpiry(contract, spot)
		: resultOn(contract, spot, CHECK_DATE);
};
/**
 * The lowest whole-dollar price on Oct 18 at which the Oct 18 call's result is no longer
 * behind the Nov 15 call's: from there the shorter, cheaper call did at least as well.
 */
export const NEAR_LEADS_AT =
	Array.from(
		{ length: LATER_RANGE[1] - LATER_RANGE[0] + 1 },
		(_, i) => LATER_RANGE[0] + i,
	).find(
		(spot) =>
			spot > SPOT &&
			(resultOnCheck("mid", spot) ?? 0) > (resultOnCheck("far", spot) ?? 0),
	) ?? LATER_RANGE[1];

// ——— The liquidity check ———

export type QuoteRowId = "c95" | "c100" | "c105" | "dec110";
const fridayOpenInterest = (strike: number) =>
	oct18OpenInterest.find((row) => row.strike === strike)?.call ?? 0;
/** Bid, ask and Friday's open interest for four ALFA calls; prices in cents per share. */
export const quoteRows: readonly {
	id: QuoteRowId;
	contract: Contract;
	bid: number;
	ask: number;
	openInterest: number;
}[] = (
	[
		["c95", call("oct18", 95), fridayOpenInterest(95)],
		["c100", call("oct18", 100), fridayOpenInterest(100)],
		["c105", call("oct18", 105), fridayOpenInterest(105)],
		[
			"dec110",
			call("dec20", 110),
			mondayActivity.find((row) => row.id === "dec20-110")?.openInterest ?? 0,
		],
	] as const
).map(([id, contract, openInterest]) => ({
	id,
	contract,
	...optionQuote(contract),
	openInterest,
}));
export const quoteRow = (id: QuoteRowId) =>
	quoteRows.find((row) => row.id === id) ?? quoteRows[0];
/** Ask minus bid in cents per share: the dollars one contract gives up bought and sold at once. */
export const spreadOf = (row: { bid: number; ask: number }) =>
	row.ask - row.bid;
/** The spread as a fraction of the ask paid. */
export const spreadShare = (row: { bid: number; ask: number }) =>
	spreadOf(row) / row.ask;
/** Dollars lost buying `contracts` at the ask and selling them at the bid, quote unchanged. */
export const roundTrip = (
	row: { bid: number; ask: number },
	contracts: number,
) => spreadOf(row) * contracts;
/** The round trip the liquidity scene's task asks for. */
export const TASK_CONTRACTS = 5;

// ——— Formatting ———

/** A per-share price from cents: "$7.30". */
export const perShare = (cents: number) => usd(cents);
/** Whole dollars for one contract: "$730". */
export const dollars = (value: number) => usd(Math.round(value * 100), 0);
/** A signed result for one contract: "+$370", "−$115". */
export const signedDollars = (value: number) =>
	signedUsd(Math.round(value * 100), 0);
/** Dollars and cents: "$102.30", "−$6.50". */
export const exact = (value: number) => usd(Math.round(value * 100));
/** ALFA prices in whole dollars: "$106". */
export const stock = (value: number) =>
	usd(Math.round(value * 100), Number.isInteger(value) ? 0 : 2);
export const fixed2 = (value: number) => value.toFixed(2);
/** A signed whole percent with a true minus: "+51%", "−53%", "−100%". */
export const signedPercent = (fraction: number) => {
	const value = Math.round(fraction * 100);
	return value > 0 ? `+${value}%` : value < 0 ? `−${Math.abs(value)}%` : "0%";
};
