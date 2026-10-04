import {
	type Contract,
	modelValue,
	optionQuote,
	valueAtExpiry,
} from "@/content/world";

/** The legs, prices and prints the parity lesson teaches with, shared by its film and its playground. */

export const CALL: Contract = { expiry: "oct18", strike: 100, right: "call" };
export const PUT: Contract = { expiry: "oct18", strike: 100, right: "put" };
export const STRIKE = 100;

export const RANGE = [80, 120] as const;
/** Buy the call at its ask, sell the put at its bid: cents a share. */
export const CALL_PAID = optionQuote(CALL).ask;
export const PUT_RECEIVED = optionQuote(PUT).bid;
export const NET_DEBIT = (CALL_PAID - PUT_RECEIVED) / 100;
export const callLeg = (spot: number) =>
	valueAtExpiry(CALL, Math.round(spot * 100)) / 100;
export const putLeg = (spot: number) =>
	-valueAtExpiry(PUT, Math.round(spot * 100)) / 100;
export const synthetic = (spot: number) => callLeg(spot) + putLeg(spot);

/** Model mids in cents per share at a price in dollars. */
export const callMid = (spot: number) =>
	modelValue(CALL, Math.round(spot * 100)).price;
export const putMid = (spot: number) =>
	modelValue(PUT, Math.round(spot * 100)).price;

/** Three prints of the Oct 18 100 options, in dollars. */
export const MORNING = { spot: 100.02, call: 4.15, put: 4.1 };
export const AFTERNOON = { spot: 102, put: 3.25 };
/** The call print that arrives at 14:12 but executed at 13:58, with ALFA higher. */
export const LATE = { spot: 103.05, call: 5.9 };
export const LATE_PUT = putMid(LATE.spot);
export const AFTERNOON_PARITY = AFTERNOON.put + (AFTERNOON.spot - STRIKE);
export const GAP = LATE.call - AFTERNOON_PARITY;
