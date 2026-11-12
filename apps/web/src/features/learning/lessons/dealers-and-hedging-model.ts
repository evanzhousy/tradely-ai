import { ALFA, OCT_100_CALL, optionQuote } from "@/content/world";
import {
	FOCUS_GAMMA,
	FOCUS_OI,
	SHARES as FOCUS_SHARES,
	FOCUS_STRIKE,
} from "./gamma-exposure-model";
import { DELTA, GAMMA, MOVE, round2, SPOT } from "./gamma-model";

/**
 * The numbers the dealers-and-hedging lesson teaches with, shared by its film and its
 * playground. The contract, its delta and its gamma are the gamma lesson's (the Oct 18 100
 * call at ALFA $100: 0.52 and 0.04 per $1); the strike with many contracts open is the gamma
 * exposure lesson's (the Oct 18 110 call), so the later lessons start from figures seen here.
 */

export { DELTA, GAMMA, MOVE, SPOT };

/** You buy five calls; a dealer sells them. */
export const CONTRACTS = 5;
export const MULTIPLIER = ALFA.multiplier;

/** The dealer's two prices for the call, in cents a share, and the gap between them. */
export const QUOTE = optionQuote(OCT_100_CALL);
export const SPREAD = QUOTE.ask - QUOTE.bid;
/** Cents for one contract: a per-share price times the multiplier. */
export const perContract = (cents: number) => cents * MULTIPLIER;
/** What you pay for all five, in cents. */
export const PREMIUM = perContract(QUOTE.ask) * CONTRACTS;

/** The lesson's estimate of the call's delta after ALFA moves: delta + gamma × move. */
export const deltaAfter = (move: number) => round2(DELTA + GAMMA * move);
/** The shares a number of these calls moves like, at a delta. */
export const shareEquivalent = (contracts: number, delta: number) =>
	Math.round(contracts * MULTIPLIER * delta);
export const SHARES_PER_CONTRACT = shareEquivalent(1, DELTA);

/** Which side of the calls the dealer holds: sold to a customer, or bought from one. */
export type DealerSide = "short" | "long";
export const sideSign = (side: DealerSide) => (side === "short" ? -1 : 1);

/**
 * A dealer's hedged book in share-equivalents after ALFA moves, before any new trade: the
 * calls' delta now, the shares still held from the first hedge, what is left over, and the
 * trade that brings it back to zero (a purchase positive, a sale negative).
 */
export function hedgeBook(
	side: DealerSide,
	move: number,
	contracts: number = CONTRACTS,
) {
	const sign = sideSign(side);
	const options = sign * shareEquivalent(contracts, deltaAfter(move));
	const shares = -sign * shareEquivalent(contracts, DELTA);
	const net = options + shares;
	return { options, shares, net, trade: net === 0 ? 0 : -net };
}

/** The dealer who sold you the calls: hedged, after the rise, and after the same fall. */
export const HEDGE_SHARES = hedgeBook("short", 0).shares;
export const NEW_DELTA = deltaAfter(MOVE);
export const NEEDED_AFTER = -hedgeBook("short", MOVE).options;
export const BUY_AFTER_RISE = hedgeBook("short", MOVE).trade;
export const SELL_AFTER_FALL = -hedgeBook("short", -MOVE).trade;

/**
 * One strike with many contracts open: the Oct 18 110 call. Its open interest says how many
 * contracts exist, never who holds which side, so the shares a $1 move calls for depend on
 * an assumption: all of them bought by dealers, all sold by dealers, or half and half.
 */
export const STRIKE = FOCUS_STRIKE;
export const OPEN_INTEREST = FOCUS_OI;
export const STRIKE_GAMMA = FOCUS_GAMMA;
export const STRIKE_SHARES = FOCUS_SHARES;
export type Assumption = "short" | "long" | "split";
/** Shares dealers would trade for a move in dollars: a purchase positive, a sale negative. */
export const strikeTrade = (assumption: Assumption, move: number) =>
	assumption === "split" || move === 0
		? 0
		: -sideSign(assumption) * STRIKE_SHARES * move;
