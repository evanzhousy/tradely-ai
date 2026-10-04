import {
	type Contract,
	type Copy,
	instruments,
	quoteAt,
	valueAtExpiry,
} from "@/content/world";

/** The calls, settlements and expiry cases the expiration lesson teaches with, shared by its film and its playground. */

export const CALL_95: Contract = { expiry: "oct18", strike: 95, right: "call" };
export const CALL_100: Contract = {
	expiry: "oct18",
	strike: 100,
	right: "call",
};
/** ALFA's price in the close-or-exercise and settlement scenes, in cents. */
export const ALFA_AT = 10_200;
export const INDEX = instruments.index;

export type ExitDay = "oct4" | "oct11" | "oct18";

export const exitDays: Record<ExitDay, { date: string; label: Copy }> = {
	oct4: { date: "2030-10-04", label: ["Fri Oct 4", "10月4日 周五"] },
	oct11: { date: "2030-10-11", label: ["Fri Oct 11", "10月11日 周五"] },
	oct18: { date: "2030-10-18", label: ["expiry day", "到期日"] },
};

/**
 * Cents per share for the Oct 18 95 call with ALFA at $102: the bid a seller gets, and the
 * intrinsic value an exercise captures. At expiry the call trades at intrinsic value.
 */
export function exitValues(day: ExitDay) {
	const intrinsic = valueAtExpiry(CALL_95, ALFA_AT);
	const bid =
		day === "oct18"
			? intrinsic
			: quoteAt(CALL_95, ALFA_AT, exitDays[day].date).bid;
	return { intrinsic, bid, time: Math.max(bid - intrinsic, 0) };
}

export const INDEX_STRIKE = 5_000;
export const INDEX_SETTLES = 5_025;
export const INDEX_LAST = 5_030;

/** Cash-settled payout in cents for a settlement value in index points. */
export const indexPayout = (level: number) =>
	Math.max(level - INDEX_STRIKE, 0) * INDEX.multiplier * 100;

/** Days from Mon Sep 16 to Fri Oct 18. */
export const WINDOW_DAYS = 32;
export const windowTicks: readonly { day: number; label: Copy }[] = [
	{ day: 0, label: ["Sep 16", "9月16日"] },
	{ day: 7, label: ["Sep 23", "9月23日"] },
	{ day: 14, label: ["Sep 30", "9月30日"] },
	{ day: 21, label: ["Oct 7", "10月7日"] },
	{ day: 32, label: ["Oct 18", "10月18日"] },
];
export const EARLY_DAY = 30;

export type ExpiryRole = "holder" | "writer";
export type ExpiryState = {
	role: ExpiryRole;
	/** ALFA's close on Oct 18, in dollars. */
	close: number;
	/** Where ALFA trades after the close, when it moves. */
	after: number | null;
	/** The holder told the broker not to exercise. */
	decline: boolean;
	/** False while the learner is still asked what will happen. */
	reveal: boolean;
};

/** What happens to the Oct 18 100 call, and what the account shows on Monday Oct 21. */
export function expiryOutcome(state: ExpiryState) {
	const finalPrice = state.after ?? state.close;
	const exercised =
		state.role === "holder"
			? state.close >= CALL_100.strike + 0.01 && !state.decline
			: state.after !== null && finalPrice > CALL_100.strike;
	const known =
		state.reveal && (state.role === "holder" || state.after !== null);
	return { exercised, known };
}
