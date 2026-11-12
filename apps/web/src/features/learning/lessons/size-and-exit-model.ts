import {
	ALFA,
	ALFA_EARNINGS_DATE,
	type Contract,
	daysBetween,
	daysToExpiry,
	expiries,
	optionQuote,
	priceOption,
	SESSION_DATE,
} from "@/content/world";

/**
 * Size and exit: the account, the example rule, the contracts it is tried on, the losing
 * streak and the written exit plan, shared by the film and the playground. Money in cents.
 *
 * Every rule here is an example to do arithmetic with (one common rule of thumb), never a
 * recommendation: the learner's own numbers are theirs to set.
 */

/** A small retail account. */
export const ACCOUNT = 1_000_000;
/** The example rule's share of the account put at risk on one trade, in percent. */
export const RULE_PERCENT = 2;
/** The most a trade may lose under a rule of `percent` of an account. */
export const budgetFor = (percent: number, account: number = ACCOUNT) =>
	Math.round((account * percent) / 100);
export const BUDGET = budgetFor(RULE_PERCENT);

// ——— What one unit of each candidate can lose ———

export const dearCall: Contract = {
	expiry: "oct18",
	strike: 100,
	right: "call",
};
export const cheapCall: Contract = {
	expiry: "nov15",
	strike: 110,
	right: "call",
};
/** The spread's legs: buy the 105 call, sell the 110 call, both Oct 18. */
export const spreadLong: Contract = {
	expiry: "oct18",
	strike: 105,
	right: "call",
};
export const spreadShort: Contract = {
	expiry: "oct18",
	strike: 110,
	right: "call",
};

/** Per share: a bought call costs its ask. */
export const DEAR_PRICE = optionQuote(dearCall).ask;
export const CHEAP_PRICE = optionQuote(cheapCall).ask;
/** Per share: pay the 105 call's ask, collect the 110 call's bid. */
export const SPREAD_PRICE =
	optionQuote(spreadLong).ask - optionQuote(spreadShort).bid;

export type Pick = "dear" | "cheap" | "spread";
export const picks: readonly Pick[] = ["dear", "cheap", "spread"];
/** What each candidate costs per share; for all three, that is also the most it can lose. */
export const pricePerShare: Record<Pick, number> = {
	dear: DEAR_PRICE,
	cheap: CHEAP_PRICE,
	spread: SPREAD_PRICE,
};
/** The worst case of one contract (or one spread): what was paid, times 100 shares. */
export const worstCase = (perShare: number) => perShare * ALFA.multiplier;
/** Whole contracts whose worst case fits inside the budget: rounded down, never up. */
export const sizeFor = (budget: number, worst: number) =>
	Math.floor(budget / worst);

export const DEAR_WORST = worstCase(DEAR_PRICE);
export const CHEAP_WORST = worstCase(CHEAP_PRICE);
export const SPREAD_WORST = worstCase(SPREAD_PRICE);
export const DEAR_SIZE = sizeFor(BUDGET, DEAR_WORST);
export const CHEAP_SIZE = sizeFor(BUDGET, CHEAP_WORST);
export const SPREAD_SIZE = sizeFor(BUDGET, SPREAD_WORST);

/** Everything the size scene shows for a rule and a candidate. */
export function sizeFacts(percent: number, pick: Pick) {
	const budget = budgetFor(percent);
	const worst = worstCase(pricePerShare[pick]);
	const contracts = sizeFor(budget, worst);
	return {
		budget,
		worst,
		contracts,
		/** Paid in full, in cash, and all of it at risk. */
		atRisk: contracts * worst,
		unused: budget - contracts * worst,
	};
}
/** The rule percentages the size scene offers. */
export const PERCENT_RANGE = { min: 0.5, max: 5, step: 0.5 } as const;
/** The smallest offered percentage at which one of the dearer calls fits. */
export const DEAR_FITS_AT =
	Array.from(
		{
			length: (PERCENT_RANGE.max - PERCENT_RANGE.min) / PERCENT_RANGE.step + 1,
		},
		(_, i) => PERCENT_RANGE.min + i * PERCENT_RANGE.step,
	).find((percent) => sizeFor(budgetFor(percent), DEAR_WORST) >= 1) ??
	PERCENT_RANGE.max;

// ——— A run of losses ———

export const STREAK = 10;
export const SMALL_PERCENT = RULE_PERCENT;
export const LARGE_PERCENT = 20;

/**
 * What is left after `losses` losing trades in a row, each losing `percent` of what was left
 * before it. Unrounded cents; `losses` may be a fraction while a marker walks between two.
 */
export const afterLosses = (
	percent: number,
	losses: number,
	start: number = ACCOUNT,
) => {
	const whole = Math.floor(losses);
	const settled = start * (1 - percent / 100) ** whole;
	// Between two losses the chart's line is straight, so the walk reads the line itself.
	const next = settled * (1 - percent / 100);
	return settled + (next - settled) * (losses - whole);
};
/** The gain, as a fraction of what is left, that gets back to where it started. */
export const gainToRecover = (lostFraction: number) =>
	lostFraction / (1 - lostFraction);
/** The streak as a fraction of the account lost. */
export const lostAfter = (percent: number, losses: number) =>
	1 - afterLosses(percent, losses) / ACCOUNT;

export const SMALL_LEFT = Math.round(afterLosses(SMALL_PERCENT, STREAK));
export const LARGE_LEFT = Math.round(afterLosses(LARGE_PERCENT, STREAK));
export const SMALL_RECOVER = gainToRecover(lostAfter(SMALL_PERCENT, STREAK));
export const LARGE_RECOVER = gainToRecover(lostAfter(LARGE_PERCENT, STREAK));

export const streakPath = (percent: number, losses: number = STREAK) =>
	Array.from(
		{ length: losses + 1 },
		(_, i) => [i, afterLosses(percent, i) / 100] as const,
	);
/** The largest whole percentage that leaves more than half the account after the streak. */
export const HALF_KEPT_AT =
	Array.from({ length: 25 }, (_, i) => 25 - i).find(
		(percent) => afterLosses(percent, STREAK) > ACCOUNT / 2,
	) ?? 1;

// ——— The exit plan, written on the day of the purchase ———

/** The plan is for one of the cheaper calls, the size the example rule allowed. */
export const PLAN_PAID = CHEAP_PRICE;
/** Example exits: sell at twice the premium, or at half of it. */
export const PROFIT_POINT = PLAN_PAID * 2;
export const LOSS_POINT = PLAN_PAID / 2;
/** Example time stop: out with three weeks left, before time decay speeds up. */
export const TIME_STOP_DAYS_LEFT = 21;
export const PLAN_DAYS = daysToExpiry(cheapCall.expiry);
export const TIME_STOP_AFTER = PLAN_DAYS - TIME_STOP_DAYS_LEFT;
const dateAfter = (days: number) =>
	new Date(Date.parse(`${SESSION_DATE}T00:00:00Z`) + days * 86_400_000);
const timeStop = dateAfter(TIME_STOP_AFTER);
export const TIME_STOP_LABEL = [
	`${["Sep", "Oct", "Nov"][timeStop.getUTCMonth() - 8]} ${timeStop.getUTCDate()}`,
	`${timeStop.getUTCMonth() + 1}月${timeStop.getUTCDate()}日`,
] as const;
export const EXPIRY_LABEL = expiries[cheapCall.expiry].label;

/** Result per contract, in cents, of selling at a price per share. */
export const resultAt = (perShare: number) =>
	(perShare - PLAN_PAID) * ALFA.multiplier;
export const PROFIT_RESULT = resultAt(PROFIT_POINT);
export const PLANNED_LOSS = resultAt(LOSS_POINT);

/**
 * The gap: ALFA reports after the close and opens lower the next morning, with implied
 * volatility down. Options don't trade overnight, so the call's next price is the open's.
 */
export const GAP_SPOT = 94;
export const GAP_IV = 0.28;
const model = (spot: number, daysGone: number, iv: number) =>
	priceOption({
		spot,
		strike: cheapCall.strike,
		days: PLAN_DAYS - daysGone,
		iv,
		right: cheapCall.right,
	}).price;
/** Days from the purchase to the earnings close, and to the open after it. */
export const EARNINGS_AFTER = daysBetween(SESSION_DATE, ALFA_EARNINGS_DATE);
/** Model value per share at the close before the news, ALFA unchanged: above the loss point. */
export const BEFORE_GAP = Math.round(model(100, EARNINGS_AFTER, 0.33) * 100);
/** Model value per share at the next open, to the 5-cent tick: under the loss point. */
export const GAP_OPEN =
	Math.round((model(GAP_SPOT, EARNINGS_AFTER + 1, GAP_IV) * 100) / 5) * 5;
export const GAP_RESULT = resultAt(GAP_OPEN);
/** Held to expiry out of the money: the whole premium. This is what sizing uses. */
export const WORST_RESULT = -worstCase(PLAN_PAID);

export type Outcome = "target" | "stop" | "time" | "gap" | "worthless";
/** By the time stop ALFA has drifted up a little, not enough to reach either price point. */
export const TIME_STOP_SPOT = 104;
/** Model value per share on the time stop's day, to the 5-cent tick: between the two points. */
export const TIME_STOP_VALUE =
	Math.round((model(TIME_STOP_SPOT, TIME_STOP_AFTER, 0.33) * 100) / 5) * 5;
/** Where each outcome sells, per share, and its result per contract. */
export const outcomes: Record<Outcome, { exit: number; result: number }> = {
	target: { exit: PROFIT_POINT, result: PROFIT_RESULT },
	stop: { exit: LOSS_POINT, result: PLANNED_LOSS },
	time: { exit: TIME_STOP_VALUE, result: resultAt(TIME_STOP_VALUE) },
	gap: { exit: GAP_OPEN, result: GAP_RESULT },
	worthless: { exit: 0, result: WORST_RESULT },
};
