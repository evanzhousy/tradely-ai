import {
	ALFA,
	type Contract,
	type Copy,
	contractLabel,
	dayLabel,
	daysToExpiry,
	expiries,
	pick,
	quoteAt,
	signedUsd,
	usd,
	valueAtExpiry,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import type { TapeRow } from "../walkthrough/instruments/trade-tape";
import { defineScene, type Phase } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";
import { type SheetLine, SheetStage } from "./checkpoint-kit";

/**
 * The trading checkpoint has a day of its own, later than every other checkpoint's and a week
 * after ALFA's earnings: Thursday Oct 10, ALFA at $103.80, and two calls the module's lessons
 * never priced on that day, the Nov 15 105 and 110 calls. Every figure below is derived from
 * these and from the model's quotes; the account and the rule are an example trader's own.
 *
 * Money per share is in cents, as in the world; `each` turns it into cents for one contract.
 */
const DATE = "2030-10-10";
const DAY = dayLabel(DATE);
/** ALFA's price that morning, in cents. */
const ALFA_CENTS = 10_380;
const SHARES = ALFA.multiplier;
const LOWER: Contract = { expiry: "nov15", strike: 105, right: "call" };
const UPPER: Contract = { expiry: "nov15", strike: 110, right: "call" };
const EXPIRY = expiries[LOWER.expiry];
const DAYS = daysToExpiry(LOWER.expiry, DATE);
const LOWER_QUOTE = quoteAt(LOWER, ALFA_CENTS, DATE);
const UPPER_QUOTE = quoteAt(UPPER, ALFA_CENTS, DATE);
const LOWER_NAME = contractLabel(LOWER, false);
const UPPER_NAME = contractLabel(UPPER, false);

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);
const twoColumns = (t: (value: Copy) => string, labelShare = 0.52) => [
	{ label: t(["Field", "项目"]), share: labelShare },
	{ label: t(["Value", "数值"]), share: 1 - labelShare, align: "end" as const },
];
const row = (
	key: string,
	label: string,
	value: string,
	muted = false,
): TapeRow => ({
	key,
	cells: [label, value],
	muted,
});
/** Cents for one contract from cents per share. */
const each = (perShare: number) => perShare * SHARES;
/** Whole dollars from cents: "$370". */
const whole = (cents: number) => usd(cents, 0);
/** Signed whole dollars from cents: "+$230", "−$85". */
const signedWhole = (cents: number) => signedUsd(cents, 0);
/** A whole-dollar ALFA price: "$111". */
const stock = (dollars: number) => `$${dollars}`;
const tone = (cents: number): "gain" | "loss" => (cents >= 0 ? "gain" : "loss");
const wholeDollars = (from: number, to: number) =>
	Array.from({ length: to - from + 1 }, (_, i) => from + i);

// ——— Scene 1: one view, two strikes ———

type StrikeId = "lower" | "upper";
type StrikeState = { stage: 0 | 1 | 2; strike: StrikeId; close: number };

const calls: Record<StrikeId, { contract: Contract; paid: number }> = {
	lower: { contract: LOWER, paid: LOWER_QUOTE.ask },
	upper: { contract: UPPER, paid: UPPER_QUOTE.ask },
};
/** ALFA's close on Nov 15 that the question states, in dollars. */
const VIEW_CLOSE = 111;
const CLOSE_RANGE = [100, 118] as const;
/** Cents for one contract at expiry with ALFA at `close` dollars. */
const worthAt = (strike: StrikeId, close: number) =>
	each(valueAtExpiry(calls[strike].contract, close * 100));
const resultAt = (strike: StrikeId, close: number) =>
	worthAt(strike, close) - each(calls[strike].paid);
/** The close at which a bought call repays its premium, in cents. */
const breakEven = (strike: StrikeId) =>
	calls[strike].contract.strike * 100 + calls[strike].paid;
/** The lowest whole-dollar close at which one call ends with a gain. */
const firstGain = (strike: StrikeId) =>
	wholeDollars(...CLOSE_RANGE).find((close) => resultAt(strike, close) > 0) ??
	CLOSE_RANGE[1];

function StrikeView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: StrikeState;
	explore: StrikeState | null;
	setExplore: (next: StrikeState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const { contract, paid } = calls[shown.strike];
	const worth = worthAt(shown.strike, shown.close);
	const result = resultAt(shown.strike, shown.close);
	const quoteRow = (key: string, id: StrikeId, narrow: boolean) =>
		row(
			key,
			t(
				narrow
					? [
							`${calls[id].contract.strike} call, ask`,
							`${calls[id].contract.strike} 看涨，卖价`,
						]
					: [
							`${contractLabel(calls[id].contract, false)[0]}, at the ask`,
							`${contractLabel(calls[id].contract, false)[1]}，按卖价`,
						],
			),
			t(
				shown.stage < 1
					? [`${usd(calls[id].paid)} a share`, `每股 ${usd(calls[id].paid)}`]
					: narrow
						? [
								`${usd(calls[id].paid)} · ${whole(each(calls[id].paid))}`,
								`${usd(calls[id].paid)} · ${whole(each(calls[id].paid))}`,
							]
						: [
								`${usd(calls[id].paid)} a share · ${whole(each(calls[id].paid))}`,
								`每股 ${usd(calls[id].paid)} · ${whole(each(calls[id].paid))}`,
							],
			),
			shown.stage >= 1 && shown.strike !== id,
		);
	const rows = (narrow: boolean): TapeRow[] => [
		row("a", t([`ALFA, ${DAY[0]}`, `ALFA，${DAY[1]}`]), usd(ALFA_CENTS)),
		quoteRow("b", "lower", narrow),
		quoteRow("c", "upper", narrow),
		row(
			"d",
			t([
				narrow
					? `Close, ${EXPIRY.label[0]}`
					: `ALFA's close, ${EXPIRY.label[0]}`,
				narrow ? `${EXPIRY.label[1]} 收盘` : `ALFA ${EXPIRY.label[1]} 收盘价`,
			]),
			stock(shown.close),
		),
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: t(
				worth > 0
					? [
							`worth at ${stock(shown.close)}: (${stock(shown.close)} − ${stock(contract.strike)}) × ${SHARES} shares = ${whole(worth)}`,
							`${stock(shown.close)} 时的价值：(${stock(shown.close)} − ${stock(contract.strike)}) × ${SHARES} 股 = ${whole(worth)}`,
						]
					: [
							`worth at ${stock(shown.close)}: not above the ${stock(contract.strike)} strike, so ${whole(0)}`,
							`${stock(shown.close)} 时的价值：不高于 ${stock(contract.strike)} 的行权价，为 ${whole(0)}`,
						],
			),
		});
	if (shown.stage >= 2)
		lines.push({
			text: t([
				`result: ${whole(worth)} − ${whole(each(paid))} paid = ${signedWhole(result)}`,
				`结果：${whole(worth)} − 已付 ${whole(each(paid))} = ${signedWhole(result)}`,
			]),
			tone: tone(result),
		});
	return (
		<SceneFrame
			stage={
				<SheetStage
					label={t([
						"Two ALFA calls for one expiry on the checkpoint day, what each costs, and what one of them is worth and returns at a closing price",
						"检查点当天同一到期日的两张 ALFA 看涨、各自的成本，以及其中一张在某个收盘价下的价值与结果",
					])}
					lineSlots={2}
					title={t([
						`One view, two strikes · ${DAYS} days to ${EXPIRY.label[0]}`,
						`一个看法，两个行权价 · 距 ${EXPIRY.label[1]} ${DAYS} 天`,
					])}
					columns={twoColumns(t)}
					rows={(width) => rows(width < 520)}
					maxRows={4}
					lines={lines}
				/>
			}
			result={[
				{
					id: "result",
					label: t([
						`One ${contract.strike} call, ALFA at ${stock(shown.close)}`,
						`一张 ${contract.strike} 看涨，ALFA 收于 ${stock(shown.close)}`,
					]),
					value: shown.stage >= 2 ? signedWhole(result) : "…",
					note:
						shown.stage >= 2
							? t([
									`break-even ${usd(breakEven(shown.strike))}`,
									`盈亏平衡点 ${usd(breakEven(shown.strike))}`,
								])
							: undefined,
					tone: shown.stage >= 2 ? tone(result) : undefined,
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<>
						<ChoiceField
							label={t(["You bought", "你买入的是"])}
							value={explore.strike}
							options={[
								["lower", t([`${LOWER.strike} call`, `${LOWER.strike} 看涨`])],
								["upper", t([`${UPPER.strike} call`, `${UPPER.strike} 看涨`])],
							]}
							onChange={(strike) => setExplore({ ...explore, strike })}
						/>
						<RangeControl
							label={t([
								`ALFA's close, ${EXPIRY.label[0]}`,
								`ALFA ${EXPIRY.label[1]} 收盘价`,
							])}
							value={explore.close}
							display={stock(explore.close)}
							min={CLOSE_RANGE[0]}
							max={CLOSE_RANGE[1]}
							onChange={(close) => setExplore({ ...explore, close })}
						/>
					</>
				) : null
			}
		/>
	);
}

// ——— Scene 2: a covered call's best case and break-even ———

type CoveredState = { stage: 0 | 1 | 2; close: number };

/** The call is sold at its bid, cents per share. */
const SOLD = UPPER_QUOTE.bid;
const COVERED_RANGE = [96, 116] as const;
/** Cents on 100 shares bought at the checkpoint price, with ALFA at `close` dollars. */
const sharesResult = (close: number) => each(close * 100 - ALFA_CENTS);
/** What the sold call owes at expiry, cents for the contract. */
const callOwes = (close: number) => each(valueAtExpiry(UPPER, close * 100));
const callResult = (close: number) => each(SOLD) - callOwes(close);
const covered = (close: number) => sharesResult(close) + callResult(close);
/** The most the pair can make: reached at the strike and held above it. */
const COVERED_BEST = covered(UPPER.strike);
/** The close at which the pair breaks even, in cents. */
const COVERED_EVEN = ALFA_CENTS - SOLD;
/** With ALFA at $0. */
const COVERED_WORST = covered(0);
const COVERED_FIRST_GAIN =
	wholeDollars(...COVERED_RANGE).find((close) => covered(close) > 0) ??
	COVERED_RANGE[1];
/** A close above the strike, to show the cap. */
const ABOVE_CLOSE = COVERED_RANGE[1];

function CoveredView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: CoveredState;
	explore: CoveredState | null;
	setExplore: (next: CoveredState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const total = covered(shown.close);
	const rows = (narrow: boolean): TapeRow[] => [
		row(
			"a",
			t([
				narrow
					? `${SHARES} shares, bought at`
					: `${SHARES} ALFA shares, bought at`,
				narrow ? `${SHARES} 股，买入价` : `${SHARES} 股 ALFA，买入价`,
			]),
			usd(ALFA_CENTS),
		),
		row(
			"b",
			t([
				narrow
					? `${UPPER.strike} call, sold at`
					: `1 ${UPPER_NAME[0]}, sold at the bid`,
				narrow
					? `${UPPER.strike} 看涨，卖出价`
					: `1 张 ${UPPER_NAME[1]}，按买价卖出`,
			]),
			shown.stage >= 1
				? `${usd(SOLD)} · ${whole(each(SOLD))}`
				: t([`${usd(SOLD)} a share`, `每股 ${usd(SOLD)}`]),
		),
		row(
			"c",
			t([
				narrow
					? `Close, ${EXPIRY.label[0]}`
					: `ALFA's close, ${EXPIRY.label[0]}`,
				narrow ? `${EXPIRY.label[1]} 收盘` : `ALFA ${EXPIRY.label[1]} 收盘价`,
			]),
			stock(shown.close),
		),
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: t([
				`shares: (${stock(shown.close)} − ${usd(ALFA_CENTS)}) × ${SHARES} = ${signedWhole(sharesResult(shown.close))}`,
				`股票：(${stock(shown.close)} − ${usd(ALFA_CENTS)}) × ${SHARES} = ${signedWhole(sharesResult(shown.close))}`,
			]),
		});
	if (shown.stage >= 2)
		lines.push({
			text: t(
				callOwes(shown.close) > 0
					? [
							`call: ${whole(each(SOLD))} − (${stock(shown.close)} − ${stock(UPPER.strike)}) × ${SHARES} = ${signedWhole(callResult(shown.close))} · together ${signedWhole(total)}`,
							`看涨：${whole(each(SOLD))} − (${stock(shown.close)} − ${stock(UPPER.strike)}) × ${SHARES} = ${signedWhole(callResult(shown.close))} · 合计 ${signedWhole(total)}`,
						]
					: [
							`call: ${whole(each(SOLD))} premium kept · together ${signedWhole(total)}`,
							`看涨：留下 ${whole(each(SOLD))} 权利金 · 合计 ${signedWhole(total)}`,
						],
			),
			tone: tone(total),
		});
	return (
		<SceneFrame
			stage={
				<SheetStage
					label={t([
						"A covered call opened on the checkpoint day: 100 ALFA shares and one call sold against them, and what the two return together at a closing price",
						"检查点当天建立的备兑看涨：100 股 ALFA 加上对着它卖出的一张看涨，以及两者在某个收盘价下的合计结果",
					])}
					lineSlots={2}
					title={t([`Covered call · ${DAY[0]}`, `备兑看涨 · ${DAY[1]}`])}
					columns={twoColumns(t, 0.56)}
					rows={(width) => rows(width < 520)}
					maxRows={3}
					lines={lines}
				/>
			}
			result={[
				{
					id: "together",
					label: t([
						`Shares and call, ALFA at ${stock(shown.close)}`,
						`股票加看涨，ALFA 收于 ${stock(shown.close)}`,
					]),
					value: shown.stage >= 2 ? signedWhole(total) : "…",
					note:
						shown.stage >= 2
							? t([
									`break-even ${usd(COVERED_EVEN)}`,
									`盈亏平衡点 ${usd(COVERED_EVEN)}`,
								])
							: undefined,
					tone: shown.stage >= 2 ? tone(total) : undefined,
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<RangeControl
						label={t([
							`ALFA's close, ${EXPIRY.label[0]}`,
							`ALFA ${EXPIRY.label[1]} 收盘价`,
						])}
						value={explore.close}
						display={stock(explore.close)}
						min={COVERED_RANGE[0]}
						max={COVERED_RANGE[1]}
						onChange={(close) => setExplore({ ...explore, close })}
					/>
				) : null
			}
		/>
	);
}

// ——— Scene 3: how many spreads fit a loss limit ———

type SizeState = { stage: 0 | 1 | 2; percent: number };

/** The example trader's account, in cents. */
const ACCOUNT = 1_200_000;
/** The example trader's own rule: the share of the account one trade may lose, in percent. */
const RULE_PERCENT = 4;
/** Buy the 105 call at its ask, sell the 110 call at its bid: cents per share. */
const DEBIT = LOWER_QUOTE.ask - UPPER_QUOTE.bid;
/** The most one spread can lose, in cents. */
const SPREAD_WORST = each(DEBIT);
/** The example plan: sell the spread if its net price falls to half, on the 5-cent tick. */
const LOSS_POINT = Math.round(DEBIT / 2 / 5) * 5;
const PLANNED_LOSS = each(DEBIT - LOSS_POINT);
const allowed = (percent: number) => Math.round((ACCOUNT * percent) / 100);
/** Whole spreads whose loss of `perSpread` fits the rule: rounded down, never up. */
const fits = (percent: number, perSpread: number = SPREAD_WORST) =>
	Math.floor(allowed(percent) / perSpread);
const SIZE = fits(RULE_PERCENT);
const SIZE_BY_PLAN = fits(RULE_PERCENT, PLANNED_LOSS);
const PERCENT_RANGE = [1, 6] as const;
/** The smallest whole percent at which one more spread fits. */
const ONE_MORE_AT =
	wholeDollars(...PERCENT_RANGE).find((percent) => fits(percent) > SIZE) ??
	PERCENT_RANGE[1];
/** "2.4": how many times the worst case goes into the allowed loss. */
const ratio = (percent: number) =>
	String(Number((allowed(percent) / SPREAD_WORST).toFixed(2)));
const spreads = (n: number): Copy => [
	`${n} ${n === 1 ? "spread" : "spreads"}`,
	`${n} 组`,
];

function SizeView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SizeState;
	explore: SizeState | null;
	setExplore: (next: SizeState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const budget = allowed(shown.percent);
	const size = fits(shown.percent);
	const rows = (narrow: boolean): TapeRow[] => [
		row("a", t(["Account", "账户"]), whole(ACCOUNT)),
		row(
			"b",
			t([
				narrow ? "Your example rule" : "Your own rule, for this example",
				narrow ? "你的示例规则" : "这个例子里你自己的规则",
			]),
			t([
				narrow
					? `lose ≤ ${shown.percent}% a trade`
					: `lose at most ${shown.percent}% a trade`,
				`每笔最多亏 ${shown.percent}%`,
			]),
		),
		row(
			"c",
			t([
				narrow
					? `${LOWER.strike}/${UPPER.strike} spread, net`
					: `${EXPIRY.label[0]} ${LOWER.strike}/${UPPER.strike} call spread, net`,
				narrow
					? `${LOWER.strike}/${UPPER.strike} 价差净支出`
					: `${EXPIRY.label[1]} ${LOWER.strike}/${UPPER.strike} 看涨价差净支出`,
			]),
			t([`${usd(DEBIT)} a share`, `每股 ${usd(DEBIT)}`]),
		),
		row(
			"d",
			t([
				narrow ? "Planned loss point" : "Your planned loss point",
				narrow ? "计划的止损点" : "你计划的止损点",
			]),
			t([`sell at ${usd(LOSS_POINT)}`, `跌到 ${usd(LOSS_POINT)} 卖出`]),
		),
		row(
			"e",
			t([
				narrow ? "Worst case, a spread" : "The most one spread can lose",
				narrow ? "每组最坏情况" : "一组最多亏损",
			]),
			shown.stage >= 1 ? whole(SPREAD_WORST) : "?",
			shown.stage < 1,
		),
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: t([
				`the rule allows ${shown.percent}% × ${whole(ACCOUNT)} = ${whole(budget)} · worst case ${usd(DEBIT)} × ${SHARES} = ${whole(SPREAD_WORST)}`,
				`规则允许 ${shown.percent}% × ${whole(ACCOUNT)} = ${whole(budget)} · 最坏情况 ${usd(DEBIT)} × ${SHARES} = ${whole(SPREAD_WORST)}`,
			]),
		});
	if (shown.stage >= 2)
		lines.push({
			text: t([
				`${whole(budget)} ÷ ${whole(SPREAD_WORST)} = ${ratio(shown.percent)}, rounded down: ${spreads(size)[0]}`,
				`${whole(budget)} ÷ ${whole(SPREAD_WORST)} = ${ratio(shown.percent)}，向下取整：${spreads(size)[1]}`,
			]),
			tone: "strong",
		});
	return (
		<SceneFrame
			stage={
				<SheetStage
					label={t([
						"An example account, the trader's own loss rule and a call spread's net cost on the checkpoint day, and how many spreads fit inside the rule",
						"检查点当天的一个示例账户、交易者自己的亏损规则和一组看涨价差的净支出，以及按这条规则能买几组",
					])}
					lineSlots={2}
					title={t([`Size · ${DAY[0]}`, `数量 · ${DAY[1]}`])}
					columns={twoColumns(t, 0.58)}
					rows={(width) => rows(width < 520)}
					maxRows={5}
					lines={lines}
				/>
			}
			result={[
				{
					id: "size",
					label: t(["Spreads that fit the rule", "规则内能买的组数"]),
					value: shown.stage >= 2 ? String(size) : "…",
					note:
						shown.stage >= 2
							? t([
									`${whole(size * SPREAD_WORST)} at risk of ${whole(budget)} allowed`,
									`允许亏 ${whole(budget)}，实际承担 ${whole(size * SPREAD_WORST)}`,
								])
							: undefined,
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<RangeControl
						label={t(["Your rule, per trade", "你的规则，每笔交易"])}
						value={explore.percent}
						display={`${explore.percent}%`}
						min={PERCENT_RANGE[0]}
						max={PERCENT_RANGE[1]}
						onChange={(percent) => setExplore({ ...explore, percent })}
					/>
				) : null
			}
		/>
	);
}

// ——— Scene 4: the spread at expiry, between its strikes ———

type EndState = { stage: 0 | 1 | 2; action: "open" | "closed" };

/** The spreads held: the size the rule allowed. */
const HELD = SIZE;
/** ALFA's close on Nov 15, between the strikes, in dollars. */
const END_CLOSE = 108;
/** How far the bought call is in the money, cents per share. */
const IN_THE_MONEY = valueAtExpiry(LOWER, END_CLOSE * 100);
const SHARES_BOUGHT = SHARES * HELD;
/** Cents paid for the shares when the bought calls are exercised. */
const CASH_DUE = LOWER.strike * 100 * SHARES_BOUGHT;
/** One call's exercise alone, in cents. */
const ONE_CALL_DUE = LOWER.strike * 100 * SHARES;
/** The model's quotes on expiry afternoon: sell the bought call at its bid, buy the sold call back at its ask. */
const SELL_LOWER = quoteAt(LOWER, END_CLOSE * 100, EXPIRY.date).bid;
const BUY_UPPER = quoteAt(UPPER, END_CLOSE * 100, EXPIRY.date).ask;
const CLOSE_CREDIT = SELL_LOWER - BUY_UPPER;
const CLOSED_RESULT = each(CLOSE_CREDIT - DEBIT) * HELD;
/** The sale's proceeds with the debit left out. */
const CLOSE_PROCEEDS = each(CLOSE_CREDIT) * HELD;
/** The spreads at their expiry value, the shares counted at the close. */
const SPREAD_VALUE =
	each(IN_THE_MONEY - valueAtExpiry(UPPER, END_CLOSE * 100)) * HELD;
const PAPER_RESULT = SPREAD_VALUE - each(DEBIT) * HELD;
/** The first session after expiry day, a Friday: the Monday the shares can next be sold. */
const NEXT_SESSION = new Date(
	Date.parse(`${EXPIRY.date}T00:00:00Z`) + 3 * 86_400_000,
)
	.toISOString()
	.slice(0, 10);

function EndView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: EndState;
	explore: EndState | null;
	setExplore: (next: EndState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const closed = shown.action === "closed";
	const rows: TapeRow[] = [
		row(
			"a",
			t(["Your position", "你的持仓"]),
			t([
				`${HELD} ${EXPIRY.label[0]} ${LOWER.strike}/${UPPER.strike} call spreads`,
				`${HELD} 组 ${EXPIRY.label[1]} ${LOWER.strike}/${UPPER.strike} 看涨价差`,
			]),
		),
		row(
			"b",
			t([`ALFA's close, ${EXPIRY.label[0]}`, `ALFA ${EXPIRY.label[1]} 收盘价`]),
			stock(END_CLOSE),
		),
		row(
			"c",
			t([
				`The ${LOWER.strike} calls you bought`,
				`你买入的 ${LOWER.strike} 看涨`,
			]),
			closed
				? t([
						`sold at ${usd(SELL_LOWER)} before the close`,
						`收盘前以 ${usd(SELL_LOWER)} 卖出`,
					])
				: shown.stage >= 1
					? t([
							`${usd(IN_THE_MONEY)} in the money: exercised`,
							`实值 ${usd(IN_THE_MONEY)}：被行权`,
						])
					: t([
							`${usd(IN_THE_MONEY)} in the money`,
							`实值 ${usd(IN_THE_MONEY)}`,
						]),
		),
		row(
			"d",
			t([
				`The ${UPPER.strike} calls you sold`,
				`你卖出的 ${UPPER.strike} 看涨`,
			]),
			closed
				? t([`bought back at ${usd(BUY_UPPER)}`, `以 ${usd(BUY_UPPER)} 买回`])
				: shown.stage >= 1
					? t(["out of the money: expire worthless", "虚值：到期作废"])
					: t(["out of the money", "虚值"]),
		),
	];
	const lines: SheetLine[] = [];
	if (closed) {
		lines.push({
			text: t([
				`net received: ${usd(SELL_LOWER)} − ${usd(BUY_UPPER)} = ${usd(CLOSE_CREDIT)} a share`,
				`净收入：${usd(SELL_LOWER)} − ${usd(BUY_UPPER)} = 每股 ${usd(CLOSE_CREDIT)}`,
			]),
		});
		lines.push({
			text: t([
				`(${usd(CLOSE_CREDIT)} − ${usd(DEBIT)}) × ${SHARES} × ${HELD} = ${signedWhole(CLOSED_RESULT)}, and no shares`,
				`(${usd(CLOSE_CREDIT)} − ${usd(DEBIT)}) × ${SHARES} × ${HELD} = ${signedWhole(CLOSED_RESULT)}，没有股票`,
			]),
			tone: tone(CLOSED_RESULT),
		});
	} else {
		if (shown.stage >= 1)
			lines.push({
				text: t([
					`each exercised ${LOWER.strike} call buys ${SHARES} shares at ${stock(LOWER.strike)}`,
					`每张被行权的 ${LOWER.strike} 看涨以 ${stock(LOWER.strike)} 买入 ${SHARES} 股`,
				]),
			});
		if (shown.stage >= 2)
			lines.push({
				text: t([
					`${HELD} × ${SHARES} × ${stock(LOWER.strike)} = ${whole(CASH_DUE)} due, in a ${whole(ACCOUNT)} account`,
					`${HELD} × ${SHARES} × ${stock(LOWER.strike)} = 应付 ${whole(CASH_DUE)}，而账户只有 ${whole(ACCOUNT)}`,
				]),
				tone: "strong",
			});
	}
	return (
		<SceneFrame
			stage={
				<SheetStage
					label={t([
						"Two call spreads at expiry with ALFA between their strikes: what each call does if the spreads are left open, and what selling them before the close gives",
						"到期时 ALFA 停在两个行权价之间的两组看涨价差：不平仓时每张看涨的去向，以及收盘前卖出的结果",
					])}
					lineSlots={2}
					stackOnPhone
					title={t([
						`Expiry day · ${dayLabel(EXPIRY.date)[0]}`,
						`到期日 · ${dayLabel(EXPIRY.date)[1]}`,
					])}
					columns={twoColumns(t, 0.44)}
					rows={rows}
					maxRows={4}
					lines={lines}
				/>
			}
			result={[
				{
					id: "due",
					label: t(["Cash due for shares", "买入股票应付的现金"]),
					value: closed ? whole(0) : shown.stage >= 2 ? whole(CASH_DUE) : "…",
					note: closed
						? t(["no shares arrive", "没有股票进入账户"])
						: shown.stage >= 2
							? t([
									`for ${SHARES_BOUGHT} shares · account ${whole(ACCOUNT)}`,
									`买入 ${SHARES_BOUGHT} 股 · 账户 ${whole(ACCOUNT)}`,
								])
							: undefined,
					tone: !closed && shown.stage >= 2 ? "caution" : undefined,
					evidence: "calculated",
				},
				...(closed
					? [
							{
								id: "result",
								label: t([
									`Result, ${spreads(HELD)[0]}`,
									`${spreads(HELD)[1]}的结果`,
								]),
								value: signedWhole(CLOSED_RESULT),
								tone: tone(CLOSED_RESULT),
								evidence: "modeled" as const,
							},
						]
					: []),
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Before the close", "收盘之前"])}
						value={explore.action}
						options={[
							["open", t(["Leave them open", "不平仓"])],
							["closed", t(["Sell the spreads", "卖出价差"])],
						]}
						onChange={(action) => setExplore({ ...explore, action })}
					/>
				) : null
			}
		/>
	);
}

// ——— Checkpoint ———

const scenes = [
	defineScene<StrikeState, StrikeState>({
		id: "strike",
		label: ["Two strikes", "两个行权价"],
		title: [
			"The cheaper call needs the bigger move",
			"更便宜的看涨，需要更大的涨幅",
		],
		revisit: "strike-and-expiry",
		predict: {
			prompt: [
				`On ${DAY[0]} ALFA is ${usd(ALFA_CENTS)}, and the view is that it will be higher by ${EXPIRY.label[0]}. Two calls can hold that view: the ${LOWER_NAME[0]} at ${usd(LOWER_QUOTE.ask)} a share, or the ${UPPER_NAME[0]} at ${usd(UPPER_QUOTE.ask)}. Suppose ALFA closes at ${stock(VIEW_CLOSE)} on ${EXPIRY.label[0]}. What is the result for one ${UPPER.strike} call?`,
				`${DAY[1]}，ALFA 为 ${usd(ALFA_CENTS)}，看法是它到 ${EXPIRY.label[1]} 会更高。有两张看涨可以表达这个看法：每股 ${usd(LOWER_QUOTE.ask)} 的 ${LOWER_NAME[1]}，或每股 ${usd(UPPER_QUOTE.ask)} 的 ${UPPER_NAME[1]}。假设 ${EXPIRY.label[1]} ALFA 收于 ${stock(VIEW_CLOSE)}。一张 ${UPPER.strike} 看涨的结果是多少？`,
			],
			choices: [
				{
					id: "right",
					label: [
						signedWhole(resultAt("upper", VIEW_CLOSE)),
						signedWhole(resultAt("upper", VIEW_CLOSE)),
					],
				},
				{
					id: "worth",
					label: [
						`${signedWhole(worthAt("upper", VIEW_CLOSE))}: it ends in the money`,
						`${signedWhole(worthAt("upper", VIEW_CLOSE))}：它到期时是实值`,
					],
					why: [
						`${whole(worthAt("upper", VIEW_CLOSE))} is what the call is worth at ${stock(VIEW_CLOSE)}, not its result. It cost ${usd(UPPER_QUOTE.ask)} × ${SHARES} = ${whole(each(UPPER_QUOTE.ask))}, and that comes off first.`,
						`${whole(worthAt("upper", VIEW_CLOSE))} 是这张看涨在 ${stock(VIEW_CLOSE)} 时的价值，不是它的结果。它的成本是 ${usd(UPPER_QUOTE.ask)} × ${SHARES} = ${whole(each(UPPER_QUOTE.ask))}，要先扣掉。`,
					],
				},
				{
					id: "premium",
					label: [
						`${signedWhole(-each(UPPER_QUOTE.ask))}: the whole premium`,
						`${signedWhole(-each(UPPER_QUOTE.ask))}：全部权利金`,
					],
					why: [
						`The whole ${whole(each(UPPER_QUOTE.ask))} is lost only if ALFA closes at ${stock(UPPER.strike)} or below. At ${stock(VIEW_CLOSE)} the call is still worth ${whole(worthAt("upper", VIEW_CLOSE))}, which comes off the loss.`,
						`只有 ALFA 收在 ${stock(UPPER.strike)} 或以下，才会亏掉全部 ${whole(each(UPPER_QUOTE.ask))}。收于 ${stock(VIEW_CLOSE)} 时这张看涨还值 ${whole(worthAt("upper", VIEW_CLOSE))}，亏损要减去这一部分。`,
					],
				},
			],
			answer: "right",
			entry: {
				answer: -resultAt("upper", VIEW_CLOSE) / 100,
				tolerance: 0.5,
				eitherSign: true,
				prefix: "$",
			},
			revealAt: 2,
			explain: [
				`At ${stock(VIEW_CLOSE)} the ${UPPER.strike} call is worth (${stock(VIEW_CLOSE)} − ${stock(UPPER.strike)}) × ${SHARES} = ${whole(worthAt("upper", VIEW_CLOSE))} and cost ${whole(each(UPPER_QUOTE.ask))}: ${signedWhole(resultAt("upper", VIEW_CLOSE))}. Its break-even is ${usd(breakEven("upper"))}. The ${LOWER.strike} call cost ${whole(each(LOWER_QUOTE.ask))}, breaks even at ${usd(breakEven("lower"))} and ends at ${signedWhole(resultAt("lower", VIEW_CLOSE))}.`,
				`收于 ${stock(VIEW_CLOSE)} 时，${UPPER.strike} 看涨值 (${stock(VIEW_CLOSE)} − ${stock(UPPER.strike)}) × ${SHARES} = ${whole(worthAt("upper", VIEW_CLOSE))}，成本 ${whole(each(UPPER_QUOTE.ask))}：${signedWhole(resultAt("upper", VIEW_CLOSE))}。它的盈亏平衡点是 ${usd(breakEven("upper"))}。${LOWER.strike} 看涨成本 ${whole(each(LOWER_QUOTE.ask))}，盈亏平衡点 ${usd(breakEven("lower"))}，结果是 ${signedWhole(resultAt("lower", VIEW_CLOSE))}。`,
			],
		},
		beats: [
			{
				id: "calls",
				label: ["Two calls", "两张看涨"],
				caption: [
					`A new day and one view: ALFA, ${usd(ALFA_CENTS)} today, higher by ${EXPIRY.label[0]}. The ${LOWER.strike} call costs ${usd(LOWER_QUOTE.ask)} a share, ${whole(each(LOWER_QUOTE.ask))} a contract; the ${UPPER.strike} call ${usd(UPPER_QUOTE.ask)}, ${whole(each(UPPER_QUOTE.ask))}.`,
					`新的一天，一个看法：今天 ${usd(ALFA_CENTS)} 的 ALFA 到 ${EXPIRY.label[1]} 会更高。${LOWER.strike} 看涨每股 ${usd(LOWER_QUOTE.ask)}，每张 ${whole(each(LOWER_QUOTE.ask))}；${UPPER.strike} 看涨每股 ${usd(UPPER_QUOTE.ask)}，每张 ${whole(each(UPPER_QUOTE.ask))}。`,
				],
				state: { stage: 0, strike: "upper", close: VIEW_CLOSE },
			},
			{
				id: "worth",
				label: ["Worth", "价值"],
				caption: [
					`Suppose ALFA closes at ${stock(VIEW_CLOSE)}. The ${UPPER.strike} call ends ${usd(valueAtExpiry(UPPER, VIEW_CLOSE * 100))} a share in the money: worth ${whole(worthAt("upper", VIEW_CLOSE))} a contract.`,
					`假设 ALFA 收于 ${stock(VIEW_CLOSE)}。${UPPER.strike} 看涨到期时每股有 ${usd(valueAtExpiry(UPPER, VIEW_CLOSE * 100))} 的实值：每张值 ${whole(worthAt("upper", VIEW_CLOSE))}。`,
				],
				state: { stage: 1, strike: "upper", close: VIEW_CLOSE },
			},
			{
				id: "result",
				label: ["Result", "结果"],
				caption: [
					`${whole(worthAt("upper", VIEW_CLOSE))} − ${whole(each(UPPER_QUOTE.ask))} paid = ${signedWhole(resultAt("upper", VIEW_CLOSE))}. ALFA rose ${usd(VIEW_CLOSE * 100 - ALFA_CENTS)} and this call still lost: its break-even is ${usd(breakEven("upper"))}. The ${LOWER.strike} call ends at ${signedWhole(resultAt("lower", VIEW_CLOSE))}.`,
					`${whole(worthAt("upper", VIEW_CLOSE))} − 已付 ${whole(each(UPPER_QUOTE.ask))} = ${signedWhole(resultAt("upper", VIEW_CLOSE))}。ALFA 涨了 ${usd(VIEW_CLOSE * 100 - ALFA_CENTS)}，这张看涨仍然亏损：它的盈亏平衡点是 ${usd(breakEven("upper"))}。${LOWER.strike} 看涨的结果是 ${signedWhole(resultAt("lower", VIEW_CLOSE))}。`,
				],
				state: { stage: 2, strike: "upper", close: VIEW_CLOSE },
			},
		],
		explore: {
			prompt: [
				"Switch between the two calls and move ALFA's close.",
				"在两张看涨之间切换，并移动 ALFA 的收盘价。",
			],
			start: () => ({ stage: 2, strike: "lower", close: VIEW_CLOSE }),
			task: {
				kind: "reach",
				prompt: [
					`Hold the ${UPPER.strike} call and find the lowest whole-dollar close at which it ends with a gain.`,
					`持有 ${UPPER.strike} 看涨，找出让它以盈利收场的最低整数美元收盘价。`,
				],
				reached: (e) => e.strike === "upper" && e.close === firstGain("upper"),
				done: [
					`At ${stock(firstGain("upper"))} the ${UPPER.strike} call is worth ${whole(worthAt("upper", firstGain("upper")))} against ${whole(each(UPPER_QUOTE.ask))} paid: ${signedWhole(resultAt("upper", firstGain("upper")))}. Its break-even is ${stock(UPPER.strike)} + ${usd(UPPER_QUOTE.ask)} = ${usd(breakEven("upper"))}. The ${LOWER.strike} call first gains at ${stock(firstGain("lower"))}, but it cost ${whole(each(LOWER_QUOTE.ask))} against ${whole(each(UPPER_QUOTE.ask))}: less to lose on one side, a smaller move needed on the other.`,
					`收于 ${stock(firstGain("upper"))} 时，${UPPER.strike} 看涨值 ${whole(worthAt("upper", firstGain("upper")))}，已付 ${whole(each(UPPER_QUOTE.ask))}：${signedWhole(resultAt("upper", firstGain("upper")))}。它的盈亏平衡点是 ${stock(UPPER.strike)} + ${usd(UPPER_QUOTE.ask)} = ${usd(breakEven("upper"))}。${LOWER.strike} 看涨在 ${stock(firstGain("lower"))} 就开始盈利，但它的成本是 ${whole(each(LOWER_QUOTE.ask))}，而不是 ${whole(each(UPPER_QUOTE.ask))}：一边是可能亏掉的更少，另一边是需要的涨幅更小。`,
				],
			},
		},
		View: StrikeView,
	}),
	defineScene<CoveredState, CoveredState>({
		id: "covered",
		label: ["A covered call", "备兑看涨"],
		title: [
			"A call sold against shares caps the gain and lowers break-even",
			"对着股票卖出看涨：盈利封顶，盈亏平衡点下移",
		],
		revisit: "option-strategies",
		predict: {
			prompt: [
				`On ${DAY[0]} you buy ${SHARES} ALFA shares at ${usd(ALFA_CENTS)} and sell one ${UPPER_NAME[0]} against them at its ${usd(SOLD)} bid: a covered call. What is the most the shares and the call together can make by ${EXPIRY.label[0]}?`,
				`${DAY[1]}，你以 ${usd(ALFA_CENTS)} 买入 ${SHARES} 股 ALFA，并对着它们按买价 ${usd(SOLD)} 卖出一张 ${UPPER_NAME[1]}：这是备兑看涨。到 ${EXPIRY.label[1]}，股票和看涨合起来最多能赚多少？`,
			],
			choices: [
				{
					id: "right",
					label: [whole(COVERED_BEST), whole(COVERED_BEST)],
				},
				{
					id: "premium",
					label: [
						`${whole(each(SOLD))}: the premium`,
						`${whole(each(SOLD))}：权利金`,
					],
					why: [
						`${whole(each(SOLD))} is the premium, and it is kept whatever ALFA does. The shares can also gain up to the ${stock(UPPER.strike)} strike: (${stock(UPPER.strike)} − ${usd(ALFA_CENTS)}) × ${SHARES} = ${whole(sharesResult(UPPER.strike))} more.`,
						`${whole(each(SOLD))} 是权利金，无论 ALFA 怎么走都留在手里。股票在 ${stock(UPPER.strike)} 的行权价之前还能上涨：(${stock(UPPER.strike)} − ${usd(ALFA_CENTS)}) × ${SHARES} = 再多 ${whole(sharesResult(UPPER.strike))}。`,
					],
				},
				{
					id: "shares",
					label: [
						whole(sharesResult(UPPER.strike)),
						whole(sharesResult(UPPER.strike)),
					],
					why: [
						`${whole(sharesResult(UPPER.strike))} is the shares' gain up to the ${stock(UPPER.strike)} strike. The ${whole(each(SOLD))} premium collected for the call adds to it.`,
						`${whole(sharesResult(UPPER.strike))} 是股票涨到 ${stock(UPPER.strike)} 行权价时的盈利。卖出看涨收到的 ${whole(each(SOLD))} 权利金还要加上去。`,
					],
				},
				{
					id: "unlimited",
					label: [
						"No limit: the shares can keep rising",
						"没有上限：股票可以一直涨",
					],
					why: [
						`Above ${stock(UPPER.strike)} the call you sold is assigned and your shares are sold at ${stock(UPPER.strike)}. Each dollar the shares gain above the strike, the call gives back.`,
						`高于 ${stock(UPPER.strike)} 时，你卖出的看涨会被指派，你的股票按 ${stock(UPPER.strike)} 卖出。股票在行权价之上每多赚一美元，看涨就还回去一美元。`,
					],
				},
			],
			answer: "right",
			entry: { answer: COVERED_BEST / 100, tolerance: 0.5, prefix: "$" },
			revealAt: 1,
			explain: [
				`Up to the ${stock(UPPER.strike)} strike the shares gain (${stock(UPPER.strike)} − ${usd(ALFA_CENTS)}) × ${SHARES} = ${whole(sharesResult(UPPER.strike))}, and the ${whole(each(SOLD))} premium is kept: ${whole(COVERED_BEST)}. Above ${stock(UPPER.strike)} the shares are sold at the strike, so that is the most. The premium also lowers break-even to ${usd(ALFA_CENTS)} − ${usd(SOLD)} = ${usd(COVERED_EVEN)}.`,
				`在 ${stock(UPPER.strike)} 的行权价之前，股票盈利 (${stock(UPPER.strike)} − ${usd(ALFA_CENTS)}) × ${SHARES} = ${whole(sharesResult(UPPER.strike))}，再加上留下的 ${whole(each(SOLD))} 权利金：${whole(COVERED_BEST)}。高于 ${stock(UPPER.strike)} 时股票按行权价卖出，所以这就是上限。权利金还把盈亏平衡点降到 ${usd(ALFA_CENTS)} − ${usd(SOLD)} = ${usd(COVERED_EVEN)}。`,
			],
		},
		beats: [
			{
				id: "pair",
				label: ["The pair", "这一组"],
				caption: [
					`${SHARES} shares bought at ${usd(ALFA_CENTS)}, ${whole(each(ALFA_CENTS))} in all, and one ${UPPER_NAME[0]} sold at ${usd(SOLD)} a share: ${whole(each(SOLD))} collected, and an obligation to sell the shares at ${stock(UPPER.strike)}.`,
					`以 ${usd(ALFA_CENTS)} 买入 ${SHARES} 股，共 ${whole(each(ALFA_CENTS))}；再以每股 ${usd(SOLD)} 卖出一张 ${UPPER_NAME[1]}：收到 ${whole(each(SOLD))}，同时承担按 ${stock(UPPER.strike)} 卖出股票的义务。`,
				],
				state: { stage: 0, close: UPPER.strike },
			},
			{
				id: "strike",
				label: [`At ${stock(UPPER.strike)}`, `收于 ${stock(UPPER.strike)}`],
				caption: [
					`At a close of ${stock(UPPER.strike)} the shares are up ${whole(sharesResult(UPPER.strike))} and the call expires worthless, so its ${whole(each(SOLD))} is kept: ${signedWhole(COVERED_BEST)} together.`,
					`收于 ${stock(UPPER.strike)} 时，股票赚 ${whole(sharesResult(UPPER.strike))}，看涨到期作废，${whole(each(SOLD))} 权利金留下：合计 ${signedWhole(COVERED_BEST)}。`,
				],
				state: { stage: 2, close: UPPER.strike },
			},
			{
				id: "above",
				label: [`At ${stock(ABOVE_CLOSE)}`, `收于 ${stock(ABOVE_CLOSE)}`],
				caption: [
					`At ${stock(ABOVE_CLOSE)} the shares are up ${whole(sharesResult(ABOVE_CLOSE))}, but the call owes ${whole(callOwes(ABOVE_CLOSE))}: still ${signedWhole(covered(ABOVE_CLOSE))} together. The cap is the price of the premium.`,
					`收于 ${stock(ABOVE_CLOSE)} 时，股票赚 ${whole(sharesResult(ABOVE_CLOSE))}，但看涨要付出 ${whole(callOwes(ABOVE_CLOSE))}：合计仍是 ${signedWhole(covered(ABOVE_CLOSE))}。封顶就是收取权利金的代价。`,
				],
				state: { stage: 2, close: ABOVE_CLOSE },
			},
		],
		explore: {
			prompt: [
				"Move ALFA's close on expiry day.",
				"移动 ALFA 在到期日的收盘价。",
			],
			start: () => ({ stage: 2, close: UPPER.strike }),
			task: {
				kind: "reach",
				prompt: [
					"Find the lowest whole-dollar close at which the shares and the call together end with a gain.",
					"找出让股票和看涨合计以盈利收场的最低整数美元收盘价。",
				],
				reached: (e) => e.close === COVERED_FIRST_GAIN,
				done: [
					`Break-even is ${usd(ALFA_CENTS)} − ${usd(SOLD)} = ${usd(COVERED_EVEN)}, so ${stock(COVERED_FIRST_GAIN)} is the first whole dollar with a gain: ${signedWhole(covered(COVERED_FIRST_GAIN))}, against ${signedWhole(covered(COVERED_FIRST_GAIN - 1))} at ${stock(COVERED_FIRST_GAIN - 1)}. Below break-even the pair loses dollar for dollar with the shares; the premium covers only the first ${whole(each(SOLD))}. With ALFA at ${whole(0)} the loss would be ${whole(-COVERED_WORST)}.`,
					`盈亏平衡点是 ${usd(ALFA_CENTS)} − ${usd(SOLD)} = ${usd(COVERED_EVEN)}，所以 ${stock(COVERED_FIRST_GAIN)} 是第一个盈利的整数美元：${signedWhole(covered(COVERED_FIRST_GAIN))}，而 ${stock(COVERED_FIRST_GAIN - 1)} 时是 ${signedWhole(covered(COVERED_FIRST_GAIN - 1))}。低于盈亏平衡点后，这一组随股票一美元一美元地亏；权利金只能抵掉最初的 ${whole(each(SOLD))}。如果 ALFA 跌到 ${whole(0)}，亏损是 ${whole(-COVERED_WORST)}。`,
				],
			},
		},
		View: CoveredView,
	}),
	defineScene<SizeState, SizeState>({
		id: "size",
		label: ["How many fit", "能买几组"],
		title: [
			"Size from the worst case, and round down",
			"按最坏情况算数量，并向下取整",
		],
		revisit: "size-and-exit",
		predict: {
			prompt: [
				`Your account holds ${whole(ACCOUNT)} and your own rule, for this example, is to lose at most ${RULE_PERCENT}% of it on one trade. Buying the ${LOWER_NAME[0]} at ${usd(LOWER_QUOTE.ask)} and selling the ${UPPER.strike} call at ${usd(UPPER_QUOTE.bid)} is a call spread that costs a net ${usd(DEBIT)} a share. Your plan is to sell it if its price falls to ${usd(LOSS_POINT)}. How many spreads fit inside the rule?`,
				`你的账户有 ${whole(ACCOUNT)}。在这个例子里，你给自己定的规则是一笔交易最多亏掉账户的 ${RULE_PERCENT}%。以 ${usd(LOWER_QUOTE.ask)} 买入 ${LOWER_NAME[1]}，并以 ${usd(UPPER_QUOTE.bid)} 卖出 ${UPPER.strike} 看涨，是一组净支出每股 ${usd(DEBIT)} 的看涨价差。你的计划是它的价格跌到 ${usd(LOSS_POINT)} 就卖出。按这条规则能买几组？`,
			],
			choices: [
				{
					id: "right",
					label: [spreads(SIZE)[0], spreads(SIZE)[1]],
				},
				{
					id: "up",
					label: [spreads(SIZE + 1)[0], spreads(SIZE + 1)[1]],
					why: [
						`${whole(allowed(RULE_PERCENT))} ÷ ${whole(SPREAD_WORST)} is ${ratio(RULE_PERCENT)}, and a size rounds down. ${spreads(SIZE + 1)[0]} could lose ${SIZE + 1} × ${whole(SPREAD_WORST)} = ${whole((SIZE + 1) * SPREAD_WORST)}, more than the ${whole(allowed(RULE_PERCENT))} the rule allows.`,
						`${whole(allowed(RULE_PERCENT))} ÷ ${whole(SPREAD_WORST)} 是 ${ratio(RULE_PERCENT)}，数量要向下取整。${spreads(SIZE + 1)[1]}可能亏 ${SIZE + 1} × ${whole(SPREAD_WORST)} = ${whole((SIZE + 1) * SPREAD_WORST)}，超过了规则允许的 ${whole(allowed(RULE_PERCENT))}。`,
					],
				},
				{
					id: "plan",
					label: [spreads(SIZE_BY_PLAN)[0], spreads(SIZE_BY_PLAN)[1]],
					why: [
						`${SIZE_BY_PLAN} comes from the ${whole(PLANNED_LOSS)} a spread the plan expects to lose at ${usd(LOSS_POINT)}. A loss point is a plan to sell, not a limit: after overnight news the spread can open below it. The size uses the most a spread can lose, ${whole(SPREAD_WORST)}.`,
						`${SIZE_BY_PLAN} 组是按计划在 ${usd(LOSS_POINT)} 卖出、每组亏 ${whole(PLANNED_LOSS)} 算出来的。止损点只是卖出的计划，不是上限：隔夜消息之后，价差可能直接开在它下方。数量要按一组最多能亏的 ${whole(SPREAD_WORST)} 来算。`,
					],
				},
			],
			answer: "right",
			entry: { answer: SIZE, unit: [" spreads", " 组"] },
			revealAt: 2,
			explain: [
				`The rule allows ${RULE_PERCENT}% × ${whole(ACCOUNT)} = ${whole(allowed(RULE_PERCENT))}. One spread can lose all it cost: ${usd(DEBIT)} × ${SHARES} = ${whole(SPREAD_WORST)}. ${whole(allowed(RULE_PERCENT))} ÷ ${whole(SPREAD_WORST)} = ${ratio(RULE_PERCENT)}, rounded down: ${spreads(SIZE)[0]}, ${whole(SIZE * SPREAD_WORST)} at risk. The loss point at ${usd(LOSS_POINT)} is a plan, so it does not set the size.`,
				`规则允许 ${RULE_PERCENT}% × ${whole(ACCOUNT)} = ${whole(allowed(RULE_PERCENT))}。一组价差可能亏掉全部成本：${usd(DEBIT)} × ${SHARES} = ${whole(SPREAD_WORST)}。${whole(allowed(RULE_PERCENT))} ÷ ${whole(SPREAD_WORST)} = ${ratio(RULE_PERCENT)}，向下取整：${spreads(SIZE)[1]}，承担 ${whole(SIZE * SPREAD_WORST)} 的风险。${usd(LOSS_POINT)} 的止损点只是计划，不能用来决定数量。`,
			],
		},
		beats: [
			{
				id: "rule",
				label: ["The rule", "规则"],
				caption: [
					`A ${whole(ACCOUNT)} account and a rule that is yours, used here as an example: lose at most ${RULE_PERCENT}% on one trade. The spread costs ${usd(LOWER_QUOTE.ask)} − ${usd(UPPER_QUOTE.bid)} = ${usd(DEBIT)} a share, and the plan is to sell at ${usd(LOSS_POINT)}.`,
					`账户 ${whole(ACCOUNT)}，以及一条属于你自己、在这里只作例子的规则：一笔交易最多亏 ${RULE_PERCENT}%。这组价差的成本是每股 ${usd(LOWER_QUOTE.ask)} − ${usd(UPPER_QUOTE.bid)} = ${usd(DEBIT)}，计划在 ${usd(LOSS_POINT)} 卖出。`,
				],
				state: { stage: 0, percent: RULE_PERCENT },
			},
			{
				id: "worst",
				label: ["Worst case", "最坏情况"],
				caption: [
					`The rule allows ${whole(allowed(RULE_PERCENT))}. If both calls expire worthless a spread loses all it cost, ${whole(SPREAD_WORST)}, and a gap can carry its price straight past the ${usd(LOSS_POINT)} loss point.`,
					`规则允许亏 ${whole(allowed(RULE_PERCENT))}。如果两张看涨都到期作废，一组价差会亏掉全部成本 ${whole(SPREAD_WORST)}；而一次跳空就能让它的价格直接越过 ${usd(LOSS_POINT)} 的止损点。`,
				],
				state: { stage: 1, percent: RULE_PERCENT },
			},
			{
				id: "size",
				label: ["Round down", "向下取整"],
				caption: [
					`${whole(allowed(RULE_PERCENT))} ÷ ${whole(SPREAD_WORST)} = ${ratio(RULE_PERCENT)}, so ${spreads(SIZE)[0]}: ${whole(SIZE * SPREAD_WORST)} at risk and ${whole(allowed(RULE_PERCENT) - SIZE * SPREAD_WORST)} of the allowance unused. One more would break the rule.`,
					`${whole(allowed(RULE_PERCENT))} ÷ ${whole(SPREAD_WORST)} = ${ratio(RULE_PERCENT)}，所以是 ${spreads(SIZE)[1]}：承担 ${whole(SIZE * SPREAD_WORST)} 的风险，额度还剩 ${whole(allowed(RULE_PERCENT) - SIZE * SPREAD_WORST)} 没用。再多一组就违反规则了。`,
				],
				state: { stage: 2, percent: RULE_PERCENT },
			},
		],
		explore: {
			prompt: [
				"Change the percent your rule allows.",
				"改变你的规则允许的百分比。",
			],
			start: () => ({ stage: 2, percent: RULE_PERCENT }),
			task: {
				kind: "reach",
				prompt: [
					`Find the smallest whole percent at which ${spreads(SIZE + 1)[0]} fit.`,
					`找出能买下 ${spreads(SIZE + 1)[1]}的最小整数百分比。`,
				],
				reached: (e) => e.percent === ONE_MORE_AT,
				done: [
					`At ${ONE_MORE_AT}% the rule allows ${whole(allowed(ONE_MORE_AT))}, and ${SIZE + 1} × ${whole(SPREAD_WORST)} = ${whole((SIZE + 1) * SPREAD_WORST)} fits. The spread's worst case never moved; only the rule did. The percent is the trader's own choice, and this checkpoint does not suggest one.`,
					`${ONE_MORE_AT}% 时规则允许 ${whole(allowed(ONE_MORE_AT))}，${SIZE + 1} × ${whole(SPREAD_WORST)} = ${whole((SIZE + 1) * SPREAD_WORST)} 正好放得下。价差的最坏情况没有变，变的只是规则。这个百分比由交易者自己决定，本检查点不作任何建议。`,
				],
			},
		},
		View: SizeView,
	}),
	defineScene<EndState, EndState>({
		id: "end",
		label: ["Between the strikes", "两个行权价之间"],
		title: [
			"Left open between its strikes, a spread becomes shares",
			"停在两个行权价之间又不平仓，价差会变成股票",
		],
		revisit: "first-spread-trade",
		predict: {
			prompt: [
				`You hold ${HELD} ${EXPIRY.label[0]} ${LOWER.strike}/${UPPER.strike} call spreads in a ${whole(ACCOUNT)} account. Suppose that on ${EXPIRY.label[0]} ALFA closes at ${stock(END_CLOSE)}, between the strikes, and you do nothing. How much cash is due for shares?`,
				`你在 ${whole(ACCOUNT)} 的账户里持有 ${HELD} 组 ${EXPIRY.label[1]} ${LOWER.strike}/${UPPER.strike} 看涨价差。假设 ${EXPIRY.label[1]} ALFA 收于 ${stock(END_CLOSE)}，在两个行权价之间，而你什么都没做。买入股票要付多少现金？`,
			],
			choices: [
				{
					id: "right",
					label: [whole(CASH_DUE), whole(CASH_DUE)],
				},
				{
					id: "cash",
					label: [
						`Nothing: the spreads pay ${whole(SPREAD_VALUE)} in cash`,
						`不用付：价差以现金支付 ${whole(SPREAD_VALUE)}`,
					],
					why: [
						`ALFA options settle in shares, not cash: an exercised ${LOWER.strike} call buys ${SHARES} shares at ${stock(LOWER.strike)}. Cash settlement belongs to index options.`,
						`ALFA 期权以股票交割，不是现金：被行权的 ${LOWER.strike} 看涨要以 ${stock(LOWER.strike)} 买入 ${SHARES} 股。现金结算是指数期权的做法。`,
					],
				},
				{
					id: "nothing",
					label: [
						"Nothing: both calls have expired",
						"不用付：两张看涨都已到期",
					],
					why: [
						`Only the ${UPPER.strike} calls expire worthless. The ${LOWER.strike} calls are ${usd(IN_THE_MONEY)} in the money, and a call $0.01 or more in the money at expiry is exercised unless you instruct otherwise.`,
						`只有 ${UPPER.strike} 看涨到期作废。${LOWER.strike} 看涨有 ${usd(IN_THE_MONEY)} 的实值，而到期时实值 $0.01 或以上的看涨会被行权，除非你另行指示。`,
					],
				},
				{
					id: "one",
					label: [whole(ONE_CALL_DUE), whole(ONE_CALL_DUE)],
					why: [
						`${whole(ONE_CALL_DUE)} is one exercised call: ${SHARES} shares at ${stock(LOWER.strike)}. You hold ${spreads(HELD)[0]}, so ${HELD} calls are exercised.`,
						`${whole(ONE_CALL_DUE)} 只是一张看涨被行权：以 ${stock(LOWER.strike)} 买入 ${SHARES} 股。你持有 ${spreads(HELD)[1]}，所以被行权的是 ${HELD} 张。`,
					],
				},
			],
			answer: "right",
			entry: { answer: CASH_DUE / 100, prefix: "$" },
			revealAt: 2,
			explain: [
				`Between the strikes the ${UPPER.strike} calls you sold expire worthless, but the ${LOWER.strike} calls you bought are in the money and are exercised: ${HELD} × ${SHARES} shares × ${stock(LOWER.strike)} = ${whole(CASH_DUE)}, in a ${whole(ACCOUNT)} account. A broker may close a position like this on expiry day or issue a margin call; the practice differs by broker.`,
				`在两个行权价之间，你卖出的 ${UPPER.strike} 看涨到期作废，但你买入的 ${LOWER.strike} 看涨是实值，会被行权：${HELD} × ${SHARES} 股 × ${stock(LOWER.strike)} = ${whole(CASH_DUE)}，而账户只有 ${whole(ACCOUNT)}。券商可能在到期日替你平掉这样的持仓，或发出追加保证金通知；各家做法不同。`,
			],
		},
		beats: [
			{
				id: "close",
				label: ["The close", "收盘"],
				caption: [
					`${spreads(HELD)[0]}, bought for ${usd(DEBIT)} a share: ${whole(HELD * SPREAD_WORST)} paid, the most they could lose as spreads. Suppose that on ${EXPIRY.label[0]} ALFA closes at ${stock(END_CLOSE)}, above ${stock(LOWER.strike)} and below ${stock(UPPER.strike)}.`,
					`${spreads(HELD)[1]}价差，每股 ${usd(DEBIT)} 买入：共付 ${whole(HELD * SPREAD_WORST)}，这是它们作为价差最多能亏的金额。假设 ${EXPIRY.label[1]} ALFA 收于 ${stock(END_CLOSE)}，高于 ${stock(LOWER.strike)}，低于 ${stock(UPPER.strike)}。`,
				],
				state: { stage: 0, action: "open" },
			},
			{
				id: "exercised",
				label: ["Exercised", "被行权"],
				caption: [
					`The ${UPPER.strike} calls expire worthless. The ${LOWER.strike} calls are ${usd(IN_THE_MONEY)} in the money, and a call $0.01 or more in the money at expiry is exercised unless you tell your broker otherwise.`,
					`${UPPER.strike} 看涨到期作废。${LOWER.strike} 看涨有 ${usd(IN_THE_MONEY)} 的实值，而到期时实值 $0.01 或以上的看涨会被行权，除非你另行通知券商。`,
				],
				state: { stage: 1, action: "open" },
			},
			{
				id: "due",
				label: ["Cash due", "应付现金"],
				caption: [
					`${HELD} calls buy ${SHARES_BOUGHT} shares for ${whole(CASH_DUE)}. The ${whole(HELD * SPREAD_WORST)} limit belonged to the spreads; the shares are a new position, and they can open at any price on ${dayLabel(NEXT_SESSION)[0]}.`,
					`${HELD} 张看涨以 ${whole(CASH_DUE)} 买入 ${SHARES_BOUGHT} 股。${whole(HELD * SPREAD_WORST)} 的上限属于价差；股票是一个新的持仓，${dayLabel(NEXT_SESSION)[1]}它可能开在任何价位。`,
				],
				state: { stage: 2, action: "open" },
			},
		],
		explore: {
			prompt: [
				"Choose what you do before the close on expiry day.",
				"选择到期日收盘前你怎么做。",
			],
			start: () => ({ stage: 2, action: "open" }),
			task: {
				kind: "answer",
				prompt: [
					`Sell the ${spreads(HELD)[0]} before the close instead, at the model's quotes. What is the result on them?`,
					`改为在收盘前按模型报价卖出这 ${spreads(HELD)[1]}价差。它们的结果是多少？`,
				],
				choices: [
					{
						id: "closed",
						label: [signedWhole(CLOSED_RESULT), signedWhole(CLOSED_RESULT)],
					},
					{
						id: "proceeds",
						label: [signedWhole(CLOSE_PROCEEDS), signedWhole(CLOSE_PROCEEDS)],
					},
					{
						id: "paper",
						label: [signedWhole(PAPER_RESULT), signedWhole(PAPER_RESULT)],
					},
				],
				answer: "closed",
				done: [
					`The ${LOWER.strike} calls sell at ${usd(SELL_LOWER)} and the ${UPPER.strike} calls are bought back at ${usd(BUY_UPPER)}: ${usd(CLOSE_CREDIT)} net, against ${usd(DEBIT)} paid. (${usd(CLOSE_CREDIT)} − ${usd(DEBIT)}) × ${SHARES} × ${HELD} = ${signedWhole(CLOSED_RESULT)}, with no shares and nothing due. ${whole(CLOSE_PROCEEDS)} is the sale before the cost comes off; ${signedWhole(PAPER_RESULT)} is the spreads' value at the close itself, before the bid and the ask are crossed.`,
					`${LOWER.strike} 看涨以 ${usd(SELL_LOWER)} 卖出，${UPPER.strike} 看涨以 ${usd(BUY_UPPER)} 买回：净收入 ${usd(CLOSE_CREDIT)}，而当初付出 ${usd(DEBIT)}。(${usd(CLOSE_CREDIT)} − ${usd(DEBIT)}) × ${SHARES} × ${HELD} = ${signedWhole(CLOSED_RESULT)}，没有股票，也没有应付现金。${whole(CLOSE_PROCEEDS)} 是还没扣成本的卖出所得；${signedWhole(PAPER_RESULT)} 是按收盘价本身算的价值，还没有扣掉买卖价差。`,
				],
			},
		},
		View: EndView,
	}),
] as const;

export function CheckpointTradingWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="checkpoint-trading"
			label={[
				"Checkpoint for choosing and placing a trade",
				"“选择并下一笔交易”检查点",
			]}
			scenes={scenes}
			review
		/>
	);
}
