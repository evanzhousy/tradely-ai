import { ALFA } from "./alfa";

/** The Oct 18 100 call's quote at 15:59 on the teaching Monday, with ALFA's last trade (cents). */
export const oct100CallCloseQuote = {
	time: "15:59",
	bid: 465,
	ask: 490,
	spot: 10_120,
} as const;

/** Broker commission per option contract, in cents. */
export const CONTRACT_FEE = 65;

/**
 * Your account on the teaching Monday: cash and 100 ALFA shares bought in August, before
 * the 16 Oct 18 100 calls you buy that morning. Money in cents.
 */
export const yourAccount = {
	cashAtOpen: 2_000_000,
	shares: 100,
	shareCost: 9_650,
	/** Tuesday's transfer in from the bank. */
	deposit: 500_000,
	/** Buying power a margin account allows per dollar of cash, before any positions. */
	marginMultiple: 2,
	symbol: ALFA.symbol,
} as const;

/** Your second account, at another broker: protective ALFA puts bought in August. */
export const yourSecondAccount = {
	puts: { expiry: "oct18", strike: 95, quantity: 5 },
} as const;
