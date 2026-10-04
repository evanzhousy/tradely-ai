import {
	alfaCloses,
	CONTRACT_FEE,
	type Copy,
	oct100CallCloseQuote,
	oct100CallMonday,
	signedUsd,
	usd,
	yourAccount,
} from "@/content/world";

/** The numbers the performance lesson teaches with, shared by its film and its playground. */

export const places = (cents: number) =>
	Math.round(cents) % 100 === 0 ? 0 : 2;
export const dollars = (cents: number) => usd(Math.round(cents), places(cents));
export const signed = (cents: number) =>
	signedUsd(Math.round(cents), places(cents));
export const pct = (fraction: number, digits = 2) =>
	`${fraction < 0 ? "−" : fraction > 0 ? "+" : ""}${Math.abs(fraction * 100).toFixed(digits)}%`;

/** Your account from the P&L lesson: Monday's open and close, then Tuesday's deposit. */
export const yours = oct100CallMonday.trades.filter(
	(trade) => trade.buyer === "you",
);
export const paid = yours.reduce(
	(sum, trade) => sum + trade.quantity * trade.price * 100,
	0,
);
export const held = yours.reduce((sum, trade) => sum + trade.quantity, 0);
export const FRIDAY = Math.round(alfaCloses[alfaCloses.length - 1].close * 100);
export const MID = (oct100CallCloseQuote.bid + oct100CallCloseQuote.ask) / 2;
export const OPEN = yourAccount.cashAtOpen + yourAccount.shares * FRIDAY;
export const CLOSE =
	yourAccount.cashAtOpen -
	paid -
	held * CONTRACT_FEE +
	yourAccount.shares * oct100CallCloseQuote.spot +
	held * MID * 100;
export const AFTER_DEPOSIT = CLOSE + yourAccount.deposit;
/** The account at Friday Sep 20's close: a 1.00% gain on the week after the deposit. */
export const WEEK_END = Math.round(AFTER_DEPOSIT * 1.01);

export const R1 = CLOSE / OPEN - 1;
export const R2 = WEEK_END / AFTER_DEPOSIT - 1;
export const TWR = (1 + R1) * (1 + R2) - 1;
export const GROWTH = WEEK_END / OPEN - 1;

export const SALE_REALIZED =
	6 * (oct100CallCloseQuote.bid - yours[0].price) * 100;
/** Your last five closed trades, in cents: the call sale from the P&L lesson and four others. */
export const trades: readonly { id: string; label: Copy; pnl: number }[] = [
	{ id: "a", label: ["Aug 22", "8月22日"], pnl: 9_500 },
	{ id: "b", label: ["Aug 29", "8月29日"], pnl: 8_000 },
	{ id: "c", label: ["Sep 5", "9月5日"], pnl: -78_000 },
	{ id: "d", label: ["Sep 10", "9月10日"], pnl: 12_000 },
	{ id: "e", label: ["Sep 16", "9月16日"], pnl: SALE_REALIZED },
];
export const WINS = trades.filter((trade) => trade.pnl > 0);
export const LOSSES = trades.filter((trade) => trade.pnl < 0);
export const WIN_RATE = WINS.length / trades.length;
export const GROSS_WIN = WINS.reduce((sum, trade) => sum + trade.pnl, 0);
export const GROSS_LOSS = -LOSSES.reduce((sum, trade) => sum + trade.pnl, 0);
export const TOTAL = GROSS_WIN - GROSS_LOSS;
export const PROFIT_FACTOR = GROSS_WIN / GROSS_LOSS;

export const MONTHS: readonly Copy[] = [
	["Jan", "1月"],
	["Feb", "2月"],
	["Mar", "3月"],
	["Apr", "4月"],
	["May", "5月"],
	["Jun", "6月"],
	["Jul", "7月"],
	["Aug", "8月"],
];
/** Two accounts' month-end values with the same start and end, in dollars. */
export const steady = [
	30_000, 30_600, 31_200, 30_900, 31_800, 32_400, 32_100, 33_000,
];
export const deep = [
	30_000, 31_500, 32_000, 27_000, 24_000, 26_500, 30_000, 33_000,
];

export function maxDrawdown(values: readonly number[]) {
	let peak = values[0];
	let worst = { fall: 0, peakAt: 0, troughAt: 0 };
	let peakAt = 0;
	values.forEach((value, i) => {
		if (value > peak) {
			peak = value;
			peakAt = i;
		}
		const fall = value / peak - 1;
		if (fall < worst.fall) worst = { fall, peakAt, troughAt: i };
	});
	return worst;
}
