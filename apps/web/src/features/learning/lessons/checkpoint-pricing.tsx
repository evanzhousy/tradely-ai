import {
	ALFA_EARNINGS_DATE,
	alfaCloses,
	type Contract,
	type Copy,
	dailyReturns,
	dayLabel,
	daysToExpiry,
	modelValue,
	modelVolatility,
	pick,
	priceOption,
	quoteAt,
	realizedVolatility,
	signedUsd,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import type { TapeRow } from "../walkthrough/instruments/trade-tape";
import { defineScene, type Phase } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";
import { type SheetLine, SheetStage } from "./checkpoint-kit";

/**
 * The pricing checkpoint has a day of its own, earlier than the other checkpoints' Oct 2 and
 * still before ALFA's earnings: Tuesday Sep 24, ALFA at $102.70, and a contract the pricing
 * lessons never priced, the Oct 18 105 call. Every figure below is derived from these.
 */
const DATE = "2030-09-24";
const DAY = dayLabel(DATE);
/** ALFA's mid that morning, in cents. */
const ALFA_CENTS = 10_270;
const CALL: Contract = { expiry: "oct18", strike: 105, right: "call" };
const PUT: Contract = { expiry: "oct18", strike: 95, right: "put" };
const DAYS = daysToExpiry(CALL.expiry, DATE);

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);
const twoColumns = (t: (value: Copy) => string, labelShare = 0.58) => [
	{ label: t(["Input", "输入"]), share: labelShare },
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
const round = (value: number, places: number) =>
	Math.round(value * 10 ** places) / 10 ** places;

/** The model's Greeks that morning, as a screen shows them; all arithmetic uses these. */
const TODAY = modelValue(CALL, ALFA_CENTS, DATE);
const DELTA = round(TODAY.delta, 2);
const GAMMA = round(TODAY.gamma, 2);
const THETA = round(TODAY.theta, 3);
const VEGA = round(TODAY.vega, 3);
const PUT_DELTA = round(modelValue(PUT, ALFA_CENTS, DATE).delta, 2);
const QUOTE = quoteAt(CALL, ALFA_CENTS, DATE);
const IV = modelVolatility(CALL.expiry, CALL.strike);
const IV_POINTS = Math.round(IV * 100);

/** A Greek to two places with a true minus sign: "0.42", "−0.19". */
const greek = (value: number) =>
	value < 0 ? `−${Math.abs(value).toFixed(2)}` : value.toFixed(2);
/** Dollars per share to the tenth of a cent: "−$0.073". */
const perShare = (dollars: number) => usd(round(dollars * 100, 1), 3);
/** A per-share dollar amount as cents for one contract of 100 shares. */
const contractCents = (dollarsPerShare: number) =>
	Math.round(dollarsPerShare * 100 * 100);
const signedPoints = (points: number) =>
	points > 0 ? `+${points}` : points < 0 ? `−${Math.abs(points)}` : "0";

// ——— Scene 1: delta, in dollars per contract ———

type DeltaState = { stage: 0 | 1 | 2; holding: "calls" | "puts" };

const HELD = 3;
/** ALFA's rise, in dollars. */
const RISE = 1;
const deltaOf = (holding: DeltaState["holding"]) =>
	holding === "calls" ? DELTA : PUT_DELTA;
const oneContract = (holding: DeltaState["holding"]) =>
	contractCents(deltaOf(holding) * RISE);
const position = (holding: DeltaState["holding"]) =>
	oneContract(holding) * HELD;
/** What the model reprices one call by for the rise, in cents per contract. */
const MODEL_FIRST = contractCents(
	modelValue(CALL, ALFA_CENTS + RISE * 100, DATE).price - TODAY.price,
);

function DeltaView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: DeltaState;
	explore: DeltaState | null;
	setExplore: (next: DeltaState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const calls = shown.holding === "calls";
	const delta = deltaOf(shown.holding);
	const one = oneContract(shown.holding);
	const all = position(shown.holding);
	// A phone has room for the shorter labels only.
	const rows = (narrow: boolean): TapeRow[] => [
		row("a", t(["ALFA", "ALFA"]), usd(ALFA_CENTS)),
		row(
			"b",
			t([narrow ? "You hold" : "Your position", "你的持仓"]),
			t(
				calls
					? [`${HELD} Oct 18 105 calls`, `${HELD} 张 10月18日 105 看涨`]
					: [`${HELD} Oct 18 95 puts`, `${HELD} 张 10月18日 95 看跌`],
			),
		),
		row(
			"c",
			t([
				narrow ? "Delta, per share" : "Model delta, per share",
				"模型 Delta，每股",
			]),
			greek(delta),
		),
		row("d", t(["ALFA's move", "ALFA 的变动"]), signedUsd(RISE * 100, 0)),
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: t([
				`one contract: ${greek(delta)} × $${RISE} × 100 shares = ${signedUsd(one, 0)}`,
				`一张：${greek(delta)} × $${RISE} × 100 股 = ${signedUsd(one, 0)}`,
			]),
		});
	if (shown.stage >= 2)
		lines.push({
			text: t([
				`${HELD} contracts: ${HELD} × ${signedUsd(one, 0)} = ${signedUsd(all, 0)}, by delta alone`,
				`${HELD} 张：${HELD} × ${signedUsd(one, 0)} = ${signedUsd(all, 0)}，仅按 Delta 估算`,
			]),
			tone: all >= 0 ? "gain" : "loss",
		});
	return (
		<SceneFrame
			stage={
				<SheetStage
					label={t([
						"A three-contract option position on the checkpoint day and what delta estimates it gains or loses when ALFA rises $1",
						"检查点当天的三张期权持仓，以及按 Delta 估算 ALFA 上涨 $1 时它的盈亏",
					])}
					lineSlots={2}
					title={t([
						`Your options · ${DAY[0]}, ${DAYS} days to Oct 18`,
						`你的期权 · ${DAY[1]}，距 10月18日 ${DAYS} 天`,
					])}
					columns={twoColumns(t, 0.5)}
					rows={(width) => rows(width < 520)}
					maxRows={4}
					lines={lines}
				/>
			}
			result={[
				{
					id: "change",
					label: t([
						`${HELD} contracts, ALFA ${signedUsd(RISE * 100, 0)}`,
						`${HELD} 张，ALFA ${signedUsd(RISE * 100, 0)}`,
					]),
					value: shown.stage >= 2 ? signedUsd(all, 0) : "…",
					note: t(["estimate from delta alone", "仅按 Delta 的估算"]),
					tone: shown.stage >= 2 ? (all >= 0 ? "gain" : "loss") : undefined,
					evidence: "modeled",
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["You hold", "你持有"])}
						value={explore.holding}
						options={[
							["calls", t([`${HELD} 105 calls`, `${HELD} 张 105 看涨`])],
							["puts", t([`${HELD} 95 puts`, `${HELD} 张 95 看跌`])],
						]}
						onChange={(holding) => setExplore({ ...explore, holding })}
					/>
				) : null
			}
		/>
	);
}

// ——— Scene 2: gamma moves delta, so the second dollar is not the first ———

type GammaState = { stage: 0 | 1 | 2; rise: number };

/** Delta after ALFA has risen `rise` dollars, estimated from the shown delta and gamma. */
const deltaAfter = (rise: number) => round(DELTA + GAMMA * rise, 2);
/** The model's own delta at that price, to two places. */
const modelDeltaAfter = (rise: number) =>
	round(modelValue(CALL, ALFA_CENTS + rise * 100, DATE).delta, 2);
/** What the next $1 adds to one contract at a delta, in cents. */
const nextDollar = (rise: number) => contractCents(deltaAfter(rise));
const FIRST = nextDollar(0);
const SECOND = nextDollar(1);
/** The model's repricing of the second dollar, in cents per contract. */
const MODEL_SECOND =
	contractCents(modelValue(CALL, ALFA_CENTS + 200, DATE).price - TODAY.price) -
	MODEL_FIRST;
const MAX_RISE = 4;
/** The smallest whole-dollar rise after which the next $1 adds more than $50 a contract. */
const PAST_50 =
	Array.from({ length: MAX_RISE + 1 }, (_, i) => i).find(
		(rise) => nextDollar(rise) > 5_000,
	) ?? MAX_RISE;

function GammaView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: GammaState;
	explore: GammaState | null;
	setExplore: (next: GammaState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const after = deltaAfter(shown.rise);
	const next = nextDollar(shown.rise);
	const rows = (narrow: boolean): TapeRow[] => [
		row(
			"a",
			t([
				narrow
					? `Delta at ${usd(ALFA_CENTS)}`
					: `Model delta at ALFA ${usd(ALFA_CENTS)}`,
				narrow
					? `${usd(ALFA_CENTS)} 时的 Delta`
					: `ALFA ${usd(ALFA_CENTS)} 时的模型 Delta`,
			]),
			greek(DELTA),
		),
		row("b", t(["Gamma, per $1", "Gamma，每 $1"]), greek(GAMMA)),
		row(
			"c",
			t(["ALFA has risen", "ALFA 已上涨"]),
			t([
				`${signedUsd(shown.rise * 100, 0)}, to ${usd(ALFA_CENTS + shown.rise * 100)}`,
				`${signedUsd(shown.rise * 100, 0)}，至 ${usd(ALFA_CENTS + shown.rise * 100)}`,
			]),
		),
		row(
			"d",
			t([
				narrow ? "Model delta there" : "The model's delta there",
				"模型在该价位的 Delta",
			]),
			shown.stage >= 1 ? greek(modelDeltaAfter(shown.rise)) : "?",
			shown.stage < 1,
		),
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: t([
				`new delta ≈ ${greek(DELTA)} + ${greek(GAMMA)} × ${shown.rise} = ${greek(after)}`,
				`新的 Delta ≈ ${greek(DELTA)} + ${greek(GAMMA)} × ${shown.rise} = ${greek(after)}`,
			]),
		});
	if (shown.stage >= 2)
		lines.push({
			text: t([
				`next $1: ${greek(after)} × 100 shares ≈ ${signedUsd(next, 0)} a contract`,
				`下一个 $1：${greek(after)} × 100 股 ≈ 每张 ${signedUsd(next, 0)}`,
			]),
			tone: "strong",
		});
	return (
		<SceneFrame
			stage={
				<SheetStage
					label={t([
						"The Oct 18 105 call's delta and gamma on the checkpoint day, the delta after ALFA rises, and what the next $1 adds to one contract",
						"检查点当天 10月18日 105 看涨的 Delta 与 Gamma、ALFA 上涨后的 Delta，以及下一个 $1 给一张合约增加多少",
					])}
					lineSlots={2}
					title={t([
						`Oct 18 105 call · ${DAY[0]}`,
						`10月18日 105 看涨 · ${DAY[1]}`,
					])}
					columns={twoColumns(t)}
					rows={(width) => rows(width < 520)}
					maxRows={4}
					lines={lines}
				/>
			}
			result={[
				{
					id: "next",
					label: t(["The next $1 adds, per contract", "下一个 $1 给每张增加"]),
					value: shown.stage >= 2 ? `≈ ${usd(next, 0)}` : "…",
					note: t([
						`the first $1 added about ${usd(FIRST, 0)}`,
						`第一个 $1 约增加 ${usd(FIRST, 0)}`,
					]),
					evidence: "modeled",
				},
			]}
			controls={
				explore ? (
					<RangeControl
						label={t(["ALFA has risen", "ALFA 已上涨"])}
						value={explore.rise}
						display={signedUsd(explore.rise * 100, 0)}
						min={0}
						max={MAX_RISE}
						onChange={(rise) => setExplore({ ...explore, rise })}
					/>
				) : null
			}
		/>
	);
}

// ——— Scene 3: a day of theta and points of vega, per contract ———

type DecayState = { stage: 0 | 1 | 2; points: number };

/** Calendar days that pass. */
const PASSED = 1;
/** The implied-volatility change the question asks about, in volatility points. */
const IV_DROP = -2;
const thetaShare = THETA * PASSED;
const vegaShare = (points: number) => round(VEGA * points, 3);
const changeShare = (points: number) =>
	round(thetaShare + vegaShare(points), 3);
const change = (points: number) => contractCents(changeShare(points));
/** The model's full repricing of one contract for the question's day and IV drop, in cents. */
const MODEL_CHANGE = contractCents(
	priceOption({
		spot: ALFA_CENTS / 100,
		strike: CALL.strike,
		days: DAYS - PASSED,
		iv: IV + IV_DROP / 100,
		right: CALL.right,
	}).price - TODAY.price,
);
/** The smallest whole-point IV rise that outweighs the day of theta. */
const OFFSET = [1, 2, 3].find((points) => change(points) > 0) ?? 3;

function DecayView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: DecayState;
	explore: DecayState | null;
	setExplore: (next: DecayState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const total = change(shown.points);
	const rows = (narrow: boolean): TapeRow[] => [
		row(
			"a",
			t([
				narrow ? "Theta, per day" : "Theta, per share per day",
				narrow ? "Theta，每天" : "Theta，每股每天",
			]),
			perShare(THETA),
		),
		row(
			"b",
			t([
				narrow ? "Vega, per vol point" : "Vega, per share per vol point",
				narrow ? "Vega，每波动率点" : "Vega，每股每个波动率点",
			]),
			perShare(VEGA),
		),
		row(
			"c",
			t(["Days passed, ALFA unchanged", "经过天数，ALFA 不变"]),
			String(PASSED),
		),
		row(
			"d",
			t(["Implied volatility (IV)", "隐含波动率（IV）"]),
			t([
				`${IV_POINTS}% → ${IV_POINTS + shown.points}%: ${signedPoints(shown.points)} ${Math.abs(shown.points) === 1 ? "point" : "points"}`,
				`${IV_POINTS}% → ${IV_POINTS + shown.points}%：${signedPoints(shown.points)} 点`,
			]),
		),
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: t([
				`per share: ${perShare(THETA)} × ${PASSED} + ${perShare(VEGA)} × ${signedPoints(shown.points)} = ${perShare(changeShare(shown.points))}`,
				`每股：${perShare(THETA)} × ${PASSED} + ${perShare(VEGA)} × ${signedPoints(shown.points)} = ${perShare(changeShare(shown.points))}`,
			]),
		});
	if (shown.stage >= 2)
		lines.push({
			text: t([
				`one contract: ${perShare(changeShare(shown.points))} × 100 shares = ${signedUsd(total)}`,
				`一张：${perShare(changeShare(shown.points))} × 100 股 = ${signedUsd(total)}`,
			]),
			tone: total >= 0 ? "gain" : "loss",
		});
	return (
		<SceneFrame
			stage={
				<SheetStage
					label={t([
						"One Oct 18 105 call's theta and vega on the checkpoint day, and what a day and a change in implied volatility do to the contract's value",
						"检查点当天一张 10月18日 105 看涨的 Theta 与 Vega，以及过一天、隐含波动率变动后合约价值的变化",
					])}
					lineSlots={2}
					title={t([
						`One Oct 18 105 call · ${DAY[0]}`,
						`一张 10月18日 105 看涨 · ${DAY[1]}`,
					])}
					columns={twoColumns(t)}
					rows={(width) => rows(width < 520)}
					maxRows={4}
					lines={lines}
				/>
			}
			result={[
				{
					id: "change",
					label: t(["One contract, a day later", "一张合约，一天后"]),
					value: shown.stage >= 2 ? signedUsd(total) : "…",
					note:
						shown.stage >= 2
							? t([
									`theta ${signedUsd(contractCents(thetaShare))} · vega ${signedUsd(contractCents(vegaShare(shown.points)))}`,
									`Theta ${signedUsd(contractCents(thetaShare))} · Vega ${signedUsd(contractCents(vegaShare(shown.points)))}`,
								])
							: undefined,
					tone: shown.stage >= 2 ? (total >= 0 ? "gain" : "loss") : undefined,
					evidence: "modeled",
				},
			]}
			controls={
				explore ? (
					<RangeControl
						label={t(["IV change, in points", "IV 变动（点）"])}
						value={explore.points}
						display={signedPoints(explore.points)}
						min={-3}
						max={3}
						onChange={(points) => setExplore({ ...explore, points })}
					/>
				) : null
			}
		/>
	);
}

// ——— Scene 4: implied against realized volatility ———

type VolState = { stage: 0 | 1 | 2; window: 20 | 10 };

/**
 * ALFA's closes from the teaching Monday (its last trade that day was $101.20) to the session
 * before the checkpoint day; with the world's closes to Sep 13 they give the last 20 daily
 * returns.
 */
const RECENT_CLOSES: readonly { date: string; close: number }[] = [
	{ date: "2030-09-16", close: 101.2 },
	{ date: "2030-09-17", close: 100.6 },
	{ date: "2030-09-18", close: 101.45 },
	{ date: "2030-09-19", close: 100.95 },
	{ date: "2030-09-20", close: 101.8 },
	{ date: "2030-09-23", close: 102.35 },
];
const RETURNS = dailyReturns([...alfaCloses, ...RECENT_CLOSES]);
/** Realized volatility over the last `window` sessions, annualized with √252, in points. */
const rvPoints = (window: VolState["window"]) =>
	Math.round(realizedVolatility(RETURNS.slice(RETURNS.length - window)) * 100);
const gap = (window: VolState["window"]) => IV_POINTS - rvPoints(window);
const EARNINGS = dayLabel(ALFA_EARNINGS_DATE);

function VolView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: VolState;
	explore: VolState | null;
	setExplore: (next: VolState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const rv = rvPoints(shown.window);
	const rows = (narrow: boolean): TapeRow[] => [
		row(
			"a",
			t([
				narrow
					? `IV, next ${DAYS} days`
					: `Implied volatility (IV), next ${DAYS} days`,
				narrow ? `IV，未来 ${DAYS} 天` : `隐含波动率（IV），未来 ${DAYS} 天`,
			]),
			`${IV_POINTS}%`,
		),
		row(
			"b",
			t([
				narrow
					? `RV, last ${shown.window} sessions`
					: `Realized volatility (RV), last ${shown.window} sessions`,
				narrow
					? `RV，最近 ${shown.window} 个交易日`
					: `已实现波动率（RV），最近 ${shown.window} 个交易日`,
			]),
			`${rv}%`,
		),
		row(
			"c",
			t(["ALFA reports earnings", "ALFA 发布财报"]),
			t([
				narrow ? EARNINGS[0] : `${EARNINGS[0]}, before Oct 18`,
				narrow ? EARNINGS[1] : `${EARNINGS[1]}，早于 10月18日`,
			]),
		),
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: t([
				`${IV_POINTS}% − ${rv}% = ${gap(shown.window)} volatility points`,
				`${IV_POINTS}% − ${rv}% = ${gap(shown.window)} 个波动率点`,
			]),
			tone: "strong",
		});
	if (shown.stage >= 2)
		lines.push({
			text: t([
				`two windows: ${DAYS} days ahead, with earnings; ${shown.window} sessions behind`,
				`两个窗口：向前 ${DAYS} 天，含财报；向后 ${shown.window} 个交易日`,
			]),
		});
	return (
		<SceneFrame
			stage={
				<SheetStage
					label={t([
						"The Oct 18 105 call's implied volatility on the checkpoint day beside ALFA's realized volatility, and the gap between them in volatility points",
						"检查点当天 10月18日 105 看涨的隐含波动率与 ALFA 的已实现波动率，以及两者相差多少个波动率点",
					])}
					lineSlots={2}
					title={t([`ALFA volatility · ${DAY[0]}`, `ALFA 波动率 · ${DAY[1]}`])}
					columns={twoColumns(t, 0.62)}
					rows={(width) => rows(width < 520)}
					maxRows={3}
					lines={lines}
				/>
			}
			result={[
				{
					id: "iv",
					label: t(["Implied, looking ahead", "隐含，向前看"]),
					value: `${IV_POINTS}%`,
					evidence: "modeled",
				},
				{
					id: "rv",
					label: t(["Realized, looking back", "已实现，向后看"]),
					value: `${rv}%`,
					evidence: "calculated",
				},
				{
					id: "gap",
					label: t(["Gap", "差距"]),
					value:
						shown.stage >= 1
							? t([`${gap(shown.window)} points`, `${gap(shown.window)} 点`])
							: "…",
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Realized window", "已实现波动率的窗口"])}
						value={String(explore.window)}
						options={[
							["20", t(["Last 20 sessions", "最近 20 个交易日"])],
							["10", t(["Last 10 sessions", "最近 10 个交易日"])],
						]}
						onChange={(value) =>
							setExplore({ ...explore, window: value === "10" ? 10 : 20 })
						}
					/>
				) : null
			}
		/>
	);
}

// ——— Checkpoint ———

const scenes = [
	defineScene<DeltaState, DeltaState>({
		id: "delta",
		label: ["Delta in dollars", "Delta 换成金额"],
		title: [
			"Delta × the move × 100 shares, for each contract",
			"Delta × 变动 × 100 股，每张合约",
		],
		revisit: "delta",
		predict: {
			prompt: [
				`On ${DAY[0]} ALFA is ${usd(ALFA_CENTS)} and the Oct 18 105 call's model delta is ${greek(DELTA)}. You hold ${HELD} of these calls. If ALFA rises $${RISE}, about how much does your position gain, by delta alone?`,
				`${DAY[1]}，ALFA 为 ${usd(ALFA_CENTS)}，10月18日 105 看涨的模型 Delta 为 ${greek(DELTA)}。你持有 ${HELD} 张这种看涨。如果 ALFA 上涨 $${RISE}，仅按 Delta 估算，你的持仓大约赚多少？`,
			],
			choices: [
				{
					id: "right",
					label: [usd(position("calls"), 0), usd(position("calls"), 0)],
				},
				{
					id: "share",
					label: [usd(position("calls") / 100), usd(position("calls") / 100)],
					why: [
						`${usd(position("calls") / 100)} is ${greek(DELTA)} × ${HELD}: the change per share times the contracts, without the 100 shares each contract covers.`,
						`${usd(position("calls") / 100)} 是 ${greek(DELTA)} × ${HELD}：每股的变化乘以张数，却漏掉了每张合约对应的 100 股。`,
					],
				},
				{
					id: "full",
					label: [
						usd(RISE * 100 * 100 * HELD, 0),
						usd(RISE * 100 * 100 * HELD, 0),
					],
					why: [
						`${usd(RISE * 100 * 100 * HELD, 0)} is what ${HELD * 100} shares would gain, dollar for dollar. Only a delta of 1.00 moves like that; this call's delta is ${greek(DELTA)}, so it takes about that fraction of each $1.`,
						`${usd(RISE * 100 * 100 * HELD, 0)} 是 ${HELD * 100} 股股票一比一上涨的收益。只有 Delta 为 1.00 才会这样变动；这张看涨的 Delta 是 ${greek(DELTA)}，每 $1 它大约只取这一比例。`,
					],
				},
			],
			answer: "right",
			entry: { answer: position("calls") / 100, tolerance: 0.5, prefix: "$" },
			revealAt: 2,
			explain: [
				`${greek(DELTA)} a share × 100 shares = ${usd(oneContract("calls"), 0)} a contract for a $${RISE} rise, × ${HELD} = ${usd(position("calls"), 0)}. Delta alone leaves out gamma, time and volatility: the model reprices one contract at ${signedUsd(MODEL_FIRST)}.`,
				`每股 ${greek(DELTA)} × 100 股 = 上涨 $${RISE} 时每张 ${usd(oneContract("calls"), 0)}，× ${HELD} = ${usd(position("calls"), 0)}。仅按 Delta 没有计入 Gamma、时间和波动率：模型给一张合约的重新定价是 ${signedUsd(MODEL_FIRST)}。`,
			],
		},
		beats: [
			{
				id: "inputs",
				label: ["Inputs", "输入"],
				caption: [
					`A new day and a new contract: the Oct 18 105 call, quoted ${usd(QUOTE.bid)} bid, ${usd(QUOTE.ask)} ask, with a model delta of ${greek(DELTA)} per share.`,
					`新的一天，新的合约：10月18日 105 看涨，报价为买价 ${usd(QUOTE.bid)}、卖价 ${usd(QUOTE.ask)}，模型 Delta 为每股 ${greek(DELTA)}。`,
				],
				state: { stage: 0, holding: "calls" },
			},
			{
				id: "one",
				label: ["One contract", "一张"],
				caption: [
					`For a $${RISE} rise, one contract gains about ${greek(DELTA)} × 100 shares = ${usd(oneContract("calls"), 0)}.`,
					`上涨 $${RISE} 时，一张合约约赚 ${greek(DELTA)} × 100 股 = ${usd(oneContract("calls"), 0)}。`,
				],
				state: { stage: 1, holding: "calls" },
			},
			{
				id: "position",
				label: ["Your position", "你的持仓"],
				caption: [
					`${HELD} contracts: about ${usd(position("calls"), 0)}. It is an estimate for a small move, before gamma, time and volatility change anything.`,
					`${HELD} 张：约 ${usd(position("calls"), 0)}。这是对小幅变动的估算，未计 Gamma、时间和波动率带来的变化。`,
				],
				state: { stage: 2, holding: "calls" },
			},
		],
		explore: {
			prompt: [
				"Switch between the calls and the puts.",
				"在看涨与看跌之间切换。",
			],
			start: () => ({ stage: 2, holding: "calls" }),
			task: {
				kind: "answer",
				prompt: [
					`Hold ${HELD} Oct 18 95 puts instead, model delta ${greek(PUT_DELTA)}. ALFA rises $${RISE}. About how does that position change?`,
					`改为持有 ${HELD} 张 10月18日 95 看跌，模型 Delta 为 ${greek(PUT_DELTA)}。ALFA 上涨 $${RISE}。这个持仓大约怎样变化？`,
				],
				choices: [
					{
						id: "loses",
						label: [
							`It loses about ${usd(-position("puts"), 0)}`,
							`约亏 ${usd(-position("puts"), 0)}`,
						],
					},
					{
						id: "gains",
						label: [
							`It gains about ${usd(-position("puts"), 0)}`,
							`约赚 ${usd(-position("puts"), 0)}`,
						],
					},
					{
						id: "full",
						label: [
							`It loses ${usd(RISE * 100 * 100 * HELD, 0)}`,
							`亏 ${usd(RISE * 100 * 100 * HELD, 0)}`,
						],
					},
				],
				answer: "loses",
				done: [
					`A put's delta is negative: ${greek(PUT_DELTA)} × 100 shares × ${HELD} contracts × $${RISE} = ${signedUsd(position("puts"), 0)}. The same rise that adds to the calls takes from the puts.`,
					`看跌的 Delta 为负：${greek(PUT_DELTA)} × 100 股 × ${HELD} 张 × $${RISE} = ${signedUsd(position("puts"), 0)}。同样的上涨让看涨增值，却让看跌减值。`,
				],
			},
		},
		View: DeltaView,
	}),
	defineScene<GammaState, GammaState>({
		id: "gamma",
		label: ["The second dollar", "第二个 $1"],
		title: [
			"Gamma changes delta, so the second dollar is not the first",
			"Gamma 改变 Delta，所以第二个 $1 不同于第一个",
		],
		revisit: "gamma",
		predict: {
			prompt: [
				`At ALFA ${usd(ALFA_CENTS)} the Oct 18 105 call has delta ${greek(DELTA)} and gamma ${greek(GAMMA)} per $1. ALFA has just risen $1, to ${usd(ALFA_CENTS + 100)}. Using the delta it has now, about how much does one contract gain if ALFA rises another $1?`,
				`ALFA 为 ${usd(ALFA_CENTS)} 时，10月18日 105 看涨的 Delta 为 ${greek(DELTA)}，Gamma 为每 $1 ${greek(GAMMA)}。ALFA 刚刚上涨了 $1，到 ${usd(ALFA_CENTS + 100)}。按它现在的 Delta 估算，如果 ALFA 再涨 $1，一张合约大约赚多少？`,
			],
			choices: [
				{ id: "right", label: [usd(SECOND, 0), usd(SECOND, 0)] },
				{
					id: "same",
					label: [
						`${usd(FIRST, 0)}: the same as the first dollar`,
						`${usd(FIRST, 0)}：与第一个 $1 相同`,
					],
					why: [
						`${usd(FIRST, 0)} uses the old delta. Gamma moved delta as ALFA rose: ${greek(DELTA)} + ${greek(GAMMA)} = ${greek(deltaAfter(1))}, so the next $1 adds about ${usd(SECOND, 0)}.`,
						`${usd(FIRST, 0)} 用的是原来的 Delta。ALFA 上涨时 Gamma 已经改变了 Delta：${greek(DELTA)} + ${greek(GAMMA)} = ${greek(deltaAfter(1))}，所以下一个 $1 约增加 ${usd(SECOND, 0)}。`,
					],
				},
				{
					id: "gamma",
					label: [usd(contractCents(GAMMA), 0), usd(contractCents(GAMMA), 0)],
					why: [
						`${usd(contractCents(GAMMA), 0)} is gamma alone: ${greek(GAMMA)} × 100 shares. Gamma is the change in delta, not the delta. Add it to ${greek(DELTA)} first: ${greek(deltaAfter(1))} × 100 = ${usd(SECOND, 0)}.`,
						`${usd(contractCents(GAMMA), 0)} 只是 Gamma：${greek(GAMMA)} × 100 股。Gamma 是 Delta 的变化量，不是 Delta 本身。先把它加到 ${greek(DELTA)} 上：${greek(deltaAfter(1))} × 100 = ${usd(SECOND, 0)}。`,
					],
				},
			],
			answer: "right",
			entry: { answer: SECOND / 100, tolerance: 0.5, prefix: "$" },
			revealAt: 2,
			explain: [
				`Gamma changes delta: ${greek(DELTA)} + ${greek(GAMMA)} × 1 = ${greek(deltaAfter(1))}. The next $1 adds about ${greek(deltaAfter(1))} × 100 shares = ${usd(SECOND, 0)} a contract, against about ${usd(FIRST, 0)} for the first.`,
				`Gamma 改变 Delta：${greek(DELTA)} + ${greek(GAMMA)} × 1 = ${greek(deltaAfter(1))}。下一个 $1 约增加 ${greek(deltaAfter(1))} × 100 股 = 每张 ${usd(SECOND, 0)}，而第一个 $1 约为 ${usd(FIRST, 0)}。`,
			],
		},
		beats: [
			{
				id: "first",
				label: ["The first dollar", "第一个 $1"],
				caption: [
					`At ${usd(ALFA_CENTS)} the call's delta is ${greek(DELTA)}, so the first $1 added about ${usd(FIRST, 0)} a contract. Gamma, ${greek(GAMMA)} per $1, is how fast that delta changes.`,
					`${usd(ALFA_CENTS)} 时看涨的 Delta 为 ${greek(DELTA)}，所以第一个 $1 给每张约增加 ${usd(FIRST, 0)}。Gamma 为每 $1 ${greek(GAMMA)}，它是 Delta 变化的速度。`,
				],
				state: { stage: 0, rise: 1 },
			},
			{
				id: "delta",
				label: ["The new delta", "新的 Delta"],
				caption: [
					`ALFA is up $1, so delta is about ${greek(DELTA)} + ${greek(GAMMA)} = ${greek(deltaAfter(1))}. The model's own delta at ${usd(ALFA_CENTS + 100)} is ${greek(modelDeltaAfter(1))}.`,
					`ALFA 上涨了 $1，所以 Delta 约为 ${greek(DELTA)} + ${greek(GAMMA)} = ${greek(deltaAfter(1))}。模型在 ${usd(ALFA_CENTS + 100)} 的 Delta 是 ${greek(modelDeltaAfter(1))}。`,
				],
				state: { stage: 1, rise: 1 },
			},
			{
				id: "second",
				label: ["The second dollar", "第二个 $1"],
				caption: [
					`The next $1 adds about ${usd(SECOND, 0)} a contract, not ${usd(FIRST, 0)}. The model reprices the two dollars at ${signedUsd(MODEL_FIRST, 0)} and ${signedUsd(MODEL_SECOND, 0)}: delta keeps climbing inside each dollar too.`,
					`下一个 $1 给每张约增加 ${usd(SECOND, 0)}，而不是 ${usd(FIRST, 0)}。模型对这两个 $1 的重新定价是 ${signedUsd(MODEL_FIRST, 0)} 和 ${signedUsd(MODEL_SECOND, 0)}：在每个 $1 之内 Delta 也在继续上升。`,
				],
				state: { stage: 2, rise: 1 },
			},
		],
		explore: {
			prompt: [
				"Change how far ALFA has already risen.",
				"改变 ALFA 已经上涨的幅度。",
			],
			start: () => ({ stage: 2, rise: 1 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the smallest rise after which the next $1 adds more than $50 a contract.",
					"找出让下一个 $1 给每张增加超过 $50 的最小涨幅。",
				],
				reached: (e) => e.rise === PAST_50,
				done: [
					`After a $${PAST_50} rise the estimate is ${greek(DELTA)} + ${greek(GAMMA)} × ${PAST_50} = ${greek(deltaAfter(PAST_50))}, about ${usd(nextDollar(PAST_50), 0)} for the next $1; the model's delta there is ${greek(modelDeltaAfter(PAST_50))}. A long call gains delta as ALFA rises, so each dollar adds more than the last.`,
					`上涨 $${PAST_50} 后，估算的 Delta 是 ${greek(DELTA)} + ${greek(GAMMA)} × ${PAST_50} = ${greek(deltaAfter(PAST_50))}，下一个 $1 约增加 ${usd(nextDollar(PAST_50), 0)}；模型在该价位的 Delta 是 ${greek(modelDeltaAfter(PAST_50))}。ALFA 上涨时，看涨多头的 Delta 随之增大，所以每个 $1 都比上一个增加得多。`,
				],
			},
		},
		View: GammaView,
	}),
	defineScene<DecayState, DecayState>({
		id: "decay",
		label: ["A day and IV", "一天与 IV"],
		title: [
			"Theta counts days; vega counts volatility points",
			"Theta 按天计，Vega 按波动率点计",
		],
		revisit: "theta-vega-rho",
		predict: {
			prompt: [
				`You hold one Oct 18 105 call. Per share, its theta is ${perShare(THETA)} a day and its vega ${perShare(VEGA)} per volatility point. Tomorrow ALFA is unchanged, but implied volatility (IV) is down ${-IV_DROP} points, from ${IV_POINTS}% to ${IV_POINTS + IV_DROP}%. About how much does the contract lose?`,
				`你持有一张 10月18日 105 看涨。按每股计，它的 Theta 为每天 ${perShare(THETA)}，Vega 为每个波动率点 ${perShare(VEGA)}。明天 ALFA 不变，但隐含波动率（IV）下降 ${-IV_DROP} 个点，从 ${IV_POINTS}% 降到 ${IV_POINTS + IV_DROP}%。这张合约大约亏多少？`,
			],
			choices: [
				{
					id: "right",
					label: [usd(-change(IV_DROP)), usd(-change(IV_DROP))],
				},
				{
					id: "theta",
					label: [
						usd(-contractCents(thetaShare)),
						usd(-contractCents(thetaShare)),
					],
					why: [
						`${usd(-contractCents(thetaShare))} is the day of theta alone: ${perShare(-THETA)} × 100 shares. The ${-IV_DROP}-point IV drop takes another ${perShare(VEGA)} × ${-IV_DROP} × 100 = ${usd(-contractCents(vegaShare(IV_DROP)))}.`,
						`${usd(-contractCents(thetaShare))} 只是一天的 Theta：${perShare(-THETA)} × 100 股。IV 下降 ${-IV_DROP} 个点还要再减去 ${perShare(VEGA)} × ${-IV_DROP} × 100 = ${usd(-contractCents(vegaShare(IV_DROP)))}。`,
					],
				},
				{
					id: "share",
					label: [
						usd(Math.round(-changeShare(IV_DROP) * 100)),
						usd(Math.round(-changeShare(IV_DROP) * 100)),
					],
					why: [
						`${usd(Math.round(-changeShare(IV_DROP) * 100))} is the change per share. Theta and vega are quoted per share, and one contract covers 100 shares: ${usd(-change(IV_DROP))}.`,
						`${usd(Math.round(-changeShare(IV_DROP) * 100))} 是每股的变化。Theta 和 Vega 都按每股报价，而一张合约对应 100 股：${usd(-change(IV_DROP))}。`,
					],
				},
			],
			answer: "right",
			entry: {
				answer: -change(IV_DROP) / 100,
				tolerance: 0.1,
				eitherSign: true,
				prefix: "$",
			},
			revealAt: 2,
			explain: [
				`Per share: ${perShare(THETA)} for the day plus ${perShare(VEGA)} × ${signedPoints(IV_DROP)} = ${perShare(vegaShare(IV_DROP))} for IV, ${perShare(changeShare(IV_DROP))} in all. Times 100 shares: about ${signedUsd(change(IV_DROP))} a contract. The model reprices it at ${signedUsd(MODEL_CHANGE)}.`,
				`每股：一天的 Theta ${perShare(THETA)}，加上 IV 的 ${perShare(VEGA)} × ${signedPoints(IV_DROP)} = ${perShare(vegaShare(IV_DROP))}，合计 ${perShare(changeShare(IV_DROP))}。乘以 100 股：每张约 ${signedUsd(change(IV_DROP))}。模型的重新定价是 ${signedUsd(MODEL_CHANGE)}。`,
			],
		},
		beats: [
			{
				id: "greeks",
				label: ["Two Greeks", "两个希腊值"],
				caption: [
					`Theta is ${perShare(THETA)} per share for each calendar day; vega is ${perShare(VEGA)} per share for each volatility point. One day passes and IV falls ${-IV_DROP} points.`,
					`Theta 为每股每个自然日 ${perShare(THETA)}；Vega 为每股每个波动率点 ${perShare(VEGA)}。过了一天，IV 下降 ${-IV_DROP} 个点。`,
				],
				state: { stage: 0, points: IV_DROP },
			},
			{
				id: "share",
				label: ["Per share", "每股"],
				caption: [
					`The day takes ${perShare(-THETA)} and the IV drop ${perShare(-vegaShare(IV_DROP))}: ${perShare(changeShare(IV_DROP))} a share, though ALFA never moved.`,
					`这一天减去 ${perShare(-THETA)}，IV 下降再减去 ${perShare(-vegaShare(IV_DROP))}：每股 ${perShare(changeShare(IV_DROP))}，而 ALFA 根本没动。`,
				],
				state: { stage: 1, points: IV_DROP },
			},
			{
				id: "contract",
				label: ["Per contract", "每张"],
				caption: [
					`Times 100 shares: about ${signedUsd(change(IV_DROP))} for one contract, ${signedUsd(contractCents(thetaShare))} from theta and ${signedUsd(contractCents(vegaShare(IV_DROP)))} from vega.`,
					`乘以 100 股：一张合约约 ${signedUsd(change(IV_DROP))}，其中 Theta ${signedUsd(contractCents(thetaShare))}，Vega ${signedUsd(contractCents(vegaShare(IV_DROP)))}。`,
				],
				state: { stage: 2, points: IV_DROP },
			},
		],
		explore: {
			prompt: [
				"Change how many points IV moves over the day.",
				"改变这一天里 IV 变动的点数。",
			],
			start: () => ({ stage: 2, points: IV_DROP }),
			task: {
				kind: "reach",
				prompt: [
					"Find the smallest IV rise, in whole points, that outweighs the day of theta.",
					"找出足以抵过这一天 Theta 的最小 IV 涨幅（整数点）。",
				],
				reached: (e) => e.points === OFFSET,
				done: [
					`${OFFSET === 1 ? "One point" : `${OFFSET} points`} of IV adds ${usd(contractCents(vegaShare(OFFSET)))} a contract, more than the ${usd(-contractCents(thetaShare))} the day of theta takes: ${signedUsd(change(OFFSET))}. Theta is paid every day; vega counts only when IV moves, and it cuts both ways.`,
					`IV 上升 ${OFFSET} 个点给每张增加 ${usd(contractCents(vegaShare(OFFSET)))}，多于这一天 Theta 减去的 ${usd(-contractCents(thetaShare))}：${signedUsd(change(OFFSET))}。Theta 每天都在扣；Vega 只在 IV 变动时起作用，而且涨跌两个方向都算。`,
				],
			},
		},
		View: DecayView,
	}),
	defineScene<VolState, VolState>({
		id: "volatility",
		label: ["Implied vs realized", "隐含与已实现"],
		title: [
			"Implied looks ahead; realized looks back",
			"隐含向前看，已实现向后看",
		],
		revisit: "implied-realized-volatility",
		predict: {
			prompt: [
				`On ${DAY[0]} the Oct 18 105 call's implied volatility (IV) is ${IV_POINTS}%. ALFA's realized volatility (RV) over the last 20 sessions is ${rvPoints(20)}%. ALFA reports earnings on ${EARNINGS[0]}. What does the ${gap(20)}-point gap tell you?`,
				`${DAY[1]}，10月18日 105 看涨的隐含波动率（IV）为 ${IV_POINTS}%。ALFA 最近 20 个交易日的已实现波动率（RV）为 ${rvPoints(20)}%。ALFA 将在 ${EARNINGS[1]} 发布财报。这 ${gap(20)} 个点的差距说明了什么？`,
			],
			choices: [
				{
					id: "ahead",
					label: [
						"Options price more movement to Oct 18 than the last 20 sessions showed",
						"期权为到 10月18日 为止计入的波动，大于最近 20 个交易日实际出现的波动",
					],
				},
				{
					id: "overpriced",
					label: [
						`The call is overpriced by ${gap(20)} points`,
						`这张看涨被高估了 ${gap(20)} 个点`,
					],
					why: [
						`IV and RV cover different windows: RV looks back over 20 sessions, IV prices the ${DAYS} days ahead, which hold an earnings report. A gap between them is not a verdict that the call is overpriced.`,
						`IV 和 RV 覆盖的窗口不同：RV 回看 20 个交易日，IV 为未来 ${DAYS} 天定价，其中包含一次财报。两者有差距，并不等于判定这张看涨被高估。`,
					],
				},
				{
					id: "direction",
					label: [
						`ALFA is expected to rise ${gap(20)}%`,
						`预计 ALFA 将上涨 ${gap(20)}%`,
					],
					why: [
						"The gap is in volatility points, a size of movement up or down, not a direction. It says nothing about ALFA rising.",
						"差距的单位是波动率点，衡量的是涨跌的幅度，而不是方向。它并不说明 ALFA 会上涨。",
					],
				},
			],
			answer: "ahead",
			revealAt: 2,
			explain: [
				`${IV_POINTS}% − ${rvPoints(20)}% = ${gap(20)} volatility points. RV looks back over 20 sessions; IV looks ahead ${DAYS} days, across the ${EARNINGS[0]} earnings report. The gap says options price more movement ahead than ALFA just showed: a reason to look closer, not a verdict on price or direction.`,
				`${IV_POINTS}% − ${rvPoints(20)}% = ${gap(20)} 个波动率点。RV 回看 20 个交易日；IV 向前看 ${DAYS} 天，跨过 ${EARNINGS[1]} 的财报。这个差距说明期权为未来计入的波动大于 ALFA 刚刚表现出的波动：它是进一步查看的理由，而不是对价格或方向的判定。`,
			],
		},
		beats: [
			{
				id: "two",
				label: ["Two figures", "两个数字"],
				caption: [
					`Two annualized percentages: ${IV_POINTS}% implied by the call's price, and ${rvPoints(20)}% realized, measured from ALFA's last 20 daily closes.`,
					`两个年化百分比：由看涨价格推出的隐含波动率 ${IV_POINTS}%，以及由 ALFA 最近 20 个收盘价算出的已实现波动率 ${rvPoints(20)}%。`,
				],
				state: { stage: 0, window: 20 },
			},
			{
				id: "gap",
				label: ["The gap", "差距"],
				caption: [
					`${IV_POINTS}% − ${rvPoints(20)}% = ${gap(20)} volatility points. Two percentages subtract to points, not to a percent change.`,
					`${IV_POINTS}% − ${rvPoints(20)}% = ${gap(20)} 个波动率点。两个百分比相减得到的是点数，不是百分比变化。`,
				],
				state: { stage: 1, window: 20 },
			},
			{
				id: "windows",
				label: ["Two windows", "两个窗口"],
				caption: [
					`RV looks back; IV looks ahead ${DAYS} days, and ALFA reports earnings inside them. Options price more movement ahead than the last 20 sessions showed. That is all the gap says.`,
					`RV 向后看；IV 向前看 ${DAYS} 天，而 ALFA 的财报就在这段时间里。期权为未来计入的波动大于最近 20 个交易日的波动。这个差距只说明这一点。`,
				],
				state: { stage: 2, window: 20 },
			},
		],
		explore: {
			prompt: [
				"Change the window realized volatility is measured over.",
				"改变计算已实现波动率的窗口。",
			],
			start: () => ({ stage: 2, window: 20 }),
			task: {
				kind: "answer",
				prompt: [
					"Measure realized volatility over the last 10 sessions instead. How wide is the gap to the call's implied volatility then?",
					"改用最近 10 个交易日来计算已实现波动率。这时它与看涨隐含波动率的差距是多少？",
				],
				choices: [
					{
						id: "ten",
						label: [`${gap(10)} points`, `${gap(10)} 个点`],
					},
					{
						id: "twenty",
						label: [`${gap(20)} points`, `${gap(20)} 个点`],
					},
					{
						id: "rv",
						label: [`${rvPoints(10)} points`, `${rvPoints(10)} 个点`],
					},
				],
				answer: "ten",
				done: [
					`Over 10 sessions RV is ${rvPoints(10)}%, so the gap reads ${IV_POINTS} − ${rvPoints(10)} = ${gap(10)} points instead of ${gap(20)}. The call's price and its ${IV_POINTS}% IV did not move: the window you measure with sets the gap.`,
					`按 10 个交易日计算，RV 为 ${rvPoints(10)}%，差距读作 ${IV_POINTS} − ${rvPoints(10)} = ${gap(10)} 个点，而不是 ${gap(20)} 个点。看涨的价格和它 ${IV_POINTS}% 的 IV 都没有变：差距的大小取决于你选用的测量窗口。`,
				],
			},
		},
		View: VolView,
	}),
] as const;

export function CheckpointPricingWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="checkpoint-pricing"
			label={[
				"Checkpoint for what moves an option's price",
				"“什么在推动期权价格”检查点",
			]}
			scenes={scenes}
			review
		/>
	);
}
