import {
	type Copy,
	count,
	modelValue,
	pick,
	signedCount,
	signedUsd,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import type { TapeRow } from "../walkthrough/instruments/trade-tape";
import { Stage } from "../walkthrough/stage";
import { defineScene, type Phase } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";
import {
	CaseSheet,
	CHECKPOINT_ALFA,
	CHECKPOINT_DATE,
	CHECKPOINT_DAY,
	type SheetLine,
	sheetHeight,
} from "./checkpoint-kit";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);
const dollars = (value: number) => usd(value * 100, 0);
const signedDollars = (value: number) => signedUsd(value * 100, 0);

// ——— Scene 1: realized and unrealized P&L by lot ———

type Method = "fifo" | "average" | "lifo";
type LotState = { stage: 0 | 1 | 2; method: Method };

const LOTS = [
	{
		key: "a",
		when: ["Mon Sep 30 buy", "9月30日 周一 买入"] as Copy,
		contracts: 6,
		price: 2.1,
	},
	{
		key: "b",
		when: ["Tue Oct 1 buy", "10月1日 周二 买入"] as Copy,
		contracts: 4,
		price: 2.6,
	},
];
const HELD = LOTS.reduce((sum, lot) => sum + lot.contracts, 0);
const SOLD = 5;
const SALE = 2.95;
const MARK = 3.05;
const AVERAGE =
	LOTS.reduce((sum, lot) => sum + lot.contracts * lot.price, 0) / HELD;
/** The cost of the contracts sold, taking lots in the method's order. */
const soldCost = (method: Method) => {
	if (method === "average") return SOLD * AVERAGE;
	const order = method === "fifo" ? LOTS : [...LOTS].reverse();
	let left = SOLD;
	let cost = 0;
	for (const lot of order) {
		const take = Math.min(left, lot.contracts);
		cost += take * lot.price;
		left -= take;
	}
	return cost;
};
const TOTAL_COST = HELD * AVERAGE;
const realized = (method: Method) =>
	Math.round((SOLD * SALE - soldCost(method)) * 100);
const unrealized = (method: Method) =>
	Math.round(((HELD - SOLD) * MARK - (TOTAL_COST - soldCost(method))) * 100);
const matched: Record<Method, Copy> = {
	fifo: ["oldest first: 5 of the 6 at $2.10", "先进先出：6 张 $2.10 中的 5 张"],
	average: [
		`average cost: 5 at $${AVERAGE.toFixed(2)}`,
		`平均成本：5 张按 $${AVERAGE.toFixed(2)}`,
	],
	lifo: [
		"newest first: 4 at $2.60, 1 at $2.10",
		"后进先出：4 张 $2.60，1 张 $2.10",
	],
};

function LotView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: LotState;
	explore: LotState | null;
	setExplore: (next: LotState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const real = realized(shown.method);
	const open = unrealized(shown.method);
	const rows: TapeRow[] = [
		...LOTS.map((lot) => ({
			key: lot.key,
			cells: [t(lot.when), String(lot.contracts), `$${lot.price.toFixed(2)}`],
		})),
		{
			key: "c",
			cells: [
				t(["Wed Oct 2 sell", "10月2日 周三 卖出"]),
				String(SOLD),
				`$${SALE.toFixed(2)}`,
			],
		},
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1) lines.push({ text: t(matched[shown.method]) });
	if (shown.stage >= 2)
		lines.push(
			{
				text: t([
					`realized: ${signedDollars(real)}`,
					`已实现：${signedDollars(real)}`,
				]),
				tone: "strong",
			},
			{
				text: t([
					`5 left at a $${MARK.toFixed(2)} mark: ${signedDollars(open)}; total ${signedDollars(real + open)}`,
					`剩余 5 张按 $${MARK.toFixed(2)} 计：${signedDollars(open)}；合计 ${signedDollars(real + open)}`,
				]),
			},
		);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Two buys of the Oct 18 105 call and one sale, matched lot by lot",
						"两次买入 10月18日 105 看涨和一次卖出，按批次匹配",
					])}
					height={() => sheetHeight(3, 3)}
				>
					{(width) => (
						<CaseSheet
							width={width}
							title={t([
								"Oct 18 105 calls · your fills",
								"10月18日 105 看涨 · 你的成交",
							])}
							columns={[
								{ label: t(["Fill", "成交"]), share: 0.52 },
								{ label: t(["Contracts", "张数"]), share: 0.22, align: "end" },
								{ label: t(["Price", "价格"]), share: 0.26, align: "end" },
							]}
							rows={rows}
							maxRows={3}
							lines={lines}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "realized",
					label: t(["Realized", "已实现"]),
					value: shown.stage >= 2 ? signedDollars(real) : "…",
					evidence: "calculated",
					tone: shown.stage >= 2 ? (real >= 0 ? "gain" : "loss") : undefined,
				},
				{
					id: "unrealized",
					label: t(["Unrealized", "未实现"]),
					value: shown.stage >= 2 ? signedDollars(open) : "…",
					note: t([`at $${MARK.toFixed(2)}`, `按 $${MARK.toFixed(2)}`]),
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Match lots by", "批次匹配方式"])}
						value={explore.method}
						options={[
							["fifo", t(["First in", "先进先出"])],
							["average", t(["Average", "平均成本"])],
							["lifo", t(["Last in", "后进先出"])],
						]}
						onChange={(method) => setExplore({ ...explore, method })}
					/>
				) : null
			}
		/>
	);
}

// ——— Scene 2: a deposit is not a return ———

type ReturnState = { stage: 0 | 1 | 2; deposit: number };

const OPEN = 40_000;
const MIDWEEK = 41_000;
const DEPOSIT = 10_000;
const SECOND = 1.03;
const fridayFor = (deposit: number) => Math.round((MIDWEEK + deposit) * SECOND);
const TWR = (MIDWEEK / OPEN) * SECOND - 1;

function ReturnView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ReturnState;
	explore: ReturnState | null;
	setExplore: (next: ReturnState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const friday = fridayFor(shown.deposit);
	const growth = (friday - OPEN) / OPEN;
	const rows: TapeRow[] = [
		{ key: "a", cells: [t(["Mon open", "周一开盘"]), dollars(OPEN)] },
		{
			key: "b",
			cells: [t(["Wed, before the deposit", "周三存款前"]), dollars(MIDWEEK)],
		},
		{
			key: "c",
			cells: [t(["Wed deposit", "周三存款"]), signedDollars(shown.deposit)],
		},
		{ key: "d", cells: [t(["Fri close", "周五收盘"]), dollars(friday)] },
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push(
			{
				text: t([
					`Mon→Wed: ${dollars(MIDWEEK)} ÷ ${dollars(OPEN)} = +${((MIDWEEK / OPEN - 1) * 100).toFixed(1)}%`,
					`周一→周三：${dollars(MIDWEEK)} ÷ ${dollars(OPEN)} = +${((MIDWEEK / OPEN - 1) * 100).toFixed(1)}%`,
				]),
			},
			{
				text: t([
					`Wed→Fri: ${dollars(friday)} ÷ ${dollars(MIDWEEK + shown.deposit)} = +${((SECOND - 1) * 100).toFixed(1)}%`,
					`周三→周五：${dollars(friday)} ÷ ${dollars(MIDWEEK + shown.deposit)} = +${((SECOND - 1) * 100).toFixed(1)}%`,
				]),
			},
		);
	if (shown.stage >= 2)
		lines.push({
			text: t([
				`1.025 × 1.030 − 1 = +${(TWR * 100).toFixed(1)}%`,
				`1.025 × 1.030 − 1 = +${(TWR * 100).toFixed(1)}%`,
			]),
			tone: "strong",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"An account's week, split at a deposit into two periods whose returns are chained",
						"账户的一周在存款处分成两段，再把两段收益连乘",
					])}
					height={() => sheetHeight(4, 3)}
				>
					{(width) => (
						<CaseSheet
							width={width}
							title={t([
								"Your account · week of Sep 30",
								"你的账户 · 9月30日 当周",
							])}
							columns={[
								{ label: t(["When", "时间"]), share: 0.6 },
								{
									label: t(["Account value", "账户价值"]),
									share: 0.4,
									align: "end",
								},
							]}
							rows={rows}
							maxRows={4}
							lines={lines}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "twr",
					label: t(["Time-weighted return", "时间加权收益率"]),
					value: shown.stage >= 2 ? `+${(TWR * 100).toFixed(1)}%` : "…",
					evidence: "calculated",
				},
				{
					id: "growth",
					label: t(["Balance growth", "余额增长"]),
					value: `+${(growth * 100).toFixed(1)}%`,
					note: t(["deposit included", "含存款"]),
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<RangeControl
						label={t(["Wednesday deposit", "周三存款"])}
						value={explore.deposit}
						display={dollars(explore.deposit)}
						min={0}
						max={30_000}
						step={5_000}
						onChange={(deposit) => setExplore({ ...explore, deposit })}
					/>
				) : null
			}
		/>
	);
}

// ——— Scene 3: win rate, profit factor and the worst fall ———

type TradesState = { stage: 0 | 1 | 2; shown: number };

const TRADES = [300, 250, -1_100, 200, 150];
const running = TRADES.map((_, i) =>
	TRADES.slice(0, i + 1).reduce((sum, value) => sum + value, 0),
);
const WINS = TRADES.filter((value) => value > 0);
const GROSS_WIN = WINS.reduce((sum, value) => sum + value, 0);
const GROSS_LOSS = -TRADES.filter((value) => value < 0).reduce(
	(sum, value) => sum + value,
	0,
);
const PROFIT_FACTOR = Math.round((GROSS_WIN / GROSS_LOSS) * 100) / 100;
/** Win count, gross wins and gross losses over the first `n` trades. */
const tally = (n: number) => {
	const first = TRADES.slice(0, n);
	const wins = first.filter((value) => value > 0);
	return {
		wins: wins.length,
		won: wins.reduce((sum, value) => sum + value, 0),
		lost: -first
			.filter((value) => value < 0)
			.reduce((sum, value) => sum + value, 0),
	};
};
/** The largest fall in running P&L from an earlier peak, over the first `n` trades. */
const worstFall = (n: number) => {
	let peak = 0;
	let worst = 0;
	for (const value of running.slice(0, n)) {
		peak = Math.max(peak, value);
		worst = Math.max(worst, peak - value);
	}
	return worst;
};

function TradesView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: TradesState;
	explore: TradesState | null;
	setExplore: (next: TradesState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const rows: TapeRow[] = TRADES.slice(0, shown.shown).map((value, i) => ({
		key: String(i),
		cells: [
			t([`Trade ${i + 1}`, `第 ${i + 1} 笔`]),
			signedDollars(value),
			signedDollars(running[i]),
		],
	}));
	const sums = tally(shown.shown);
	const net = running[shown.shown - 1];
	const factor = sums.lost > 0 ? (sums.won / sums.lost).toFixed(2) : null;
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: factor
				? t([
						`wins ${dollars(sums.won)} ÷ losses ${dollars(sums.lost)} = ${factor}`,
						`盈利 ${dollars(sums.won)} ÷ 亏损 ${dollars(sums.lost)} = ${factor}`,
					])
				: t([
						`wins ${dollars(sums.won)}, no losses yet`,
						`盈利 ${dollars(sums.won)}，还没有亏损`,
					]),
			tone: "strong",
		});
	if (shown.stage >= 2)
		lines.push({
			text: t([
				`win rate ${sums.wins} of ${shown.shown}, net ${signedDollars(net)}`,
				`胜率 ${shown.shown} 中 ${sums.wins}，净值 ${signedDollars(net)}`,
			]),
			tone: net < 0 ? "loss" : "gain",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Five closed trades with their running total, read as profit factor and the worst fall from a peak",
						"五笔已平仓交易及其累计值，读作盈亏比和从高点的最大回落",
					])}
					height={() => sheetHeight(5, 2)}
				>
					{(width) => (
						<CaseSheet
							width={width}
							title={t(["Closed trades · this week", "已平仓交易 · 本周"])}
							columns={[
								{ label: t(["Trade", "交易"]), share: 0.34 },
								{ label: "P&L", share: 0.3, align: "end" },
								{ label: t(["Running", "累计"]), share: 0.36, align: "end" },
							]}
							rows={rows}
							maxRows={5}
							lines={lines}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "pf",
					label: t(["Profit factor", "盈亏比"]),
					value: shown.stage >= 1 ? (factor ?? "—") : "…",
					evidence: "calculated",
				},
				{
					id: "fall",
					label: t(["Worst fall from a peak", "从高点的最大回落"]),
					value: dollars(worstFall(shown.shown)),
					note: t([
						shown.shown === 1 ? "over 1 trade" : `over ${shown.shown} trades`,
						`前 ${shown.shown} 笔`,
					]),
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<RangeControl
						label={t(["Trades shown", "显示的交易"])}
						value={explore.shown}
						display={String(explore.shown)}
						min={1}
						max={TRADES.length}
						onChange={(value) => setExplore({ ...explore, shown: value })}
					/>
				) : null
			}
		/>
	);
}

// ——— Scene 4: adding up delta with the right signs ———

type DeltaState = { stage: 0 | 1 | 2; shares: number };

const round4 = (value: number) => Math.round(value * 10_000) / 10_000;
const CALL_DELTA = round4(
	modelValue(
		{ expiry: "oct18", strike: 105, right: "call" },
		CHECKPOINT_ALFA,
		CHECKPOINT_DATE,
	).delta,
);
const PUT_DELTA = round4(
	modelValue(
		{ expiry: "oct18", strike: 100, right: "put" },
		CHECKPOINT_ALFA,
		CHECKPOINT_DATE,
	).delta,
);
const CALLS = 10;
const PUTS = -5;
const SHARES = 300;
const CALL_SHARES = Math.round(CALLS * CALL_DELTA * 100);
const PUT_SHARES = Math.round(PUTS * PUT_DELTA * 100);
const OPTIONS = CALL_SHARES + PUT_SHARES;
const TOTAL = SHARES + OPTIONS;
const NEAREST_FLAT = Math.round(-OPTIONS / 100) * 100;

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
	const total = shown.shares + OPTIONS;
	const rows: TapeRow[] = [
		{
			key: "a",
			cells: [
				t([
					`${shown.shares < 0 ? "Short" : "Long"} ${count(Math.abs(shown.shares))} shares`,
					`${shown.shares < 0 ? "空头" : "多头"} ${count(Math.abs(shown.shares))} 股`,
				]),
				"1",
				signedCount(shown.shares),
			],
		},
		{
			key: "b",
			cells: [
				t([`Long ${CALLS} × 105 call`, `多头 ${CALLS} 张 105 看涨`]),
				CALL_DELTA.toFixed(3),
				signedCount(CALL_SHARES),
			],
		},
		{
			key: "c",
			cells: [
				t([`Short ${-PUTS} × 100 put`, `空头 ${-PUTS} 张 100 看跌`]),
				PUT_DELTA.toFixed(3).replace("-", "−"),
				shown.stage >= 1 ? signedCount(PUT_SHARES) : "?",
			],
		},
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: t([
				`short puts: −${-PUTS} × ${PUT_DELTA.toFixed(3).replace("-", "−")} × 100 = ${signedCount(PUT_SHARES)}`,
				`看跌空头：−${-PUTS} × ${PUT_DELTA.toFixed(3).replace("-", "−")} × 100 = ${signedCount(PUT_SHARES)}`,
			]),
		});
	if (shown.stage >= 2)
		lines.push({
			text: t([
				`${signedCount(shown.shares)} ${CALL_SHARES >= 0 ? "+" : "−"} ${count(Math.abs(CALL_SHARES))} + ${count(PUT_SHARES)} = ${signedCount(total)}`,
				`${signedCount(shown.shares)} ${CALL_SHARES >= 0 ? "+" : "−"} ${count(Math.abs(CALL_SHARES))} + ${count(PUT_SHARES)} = ${signedCount(total)}`,
			]),
			tone: "strong",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Your ALFA shares, long calls and short puts, each turned into share-equivalents and added",
						"你的 ALFA 股票、看涨多头和看跌空头，各自换算成股等价后相加",
					])}
					height={() => sheetHeight(3, 2)}
				>
					{(width) => (
						<CaseSheet
							width={width}
							title={t([
								`ALFA and Oct 18 options · ${CHECKPOINT_DAY[0]}`,
								`ALFA 与 10月18日 期权 · ${CHECKPOINT_DAY[1]}`,
							])}
							columns={[
								{ label: t(["Position", "持仓"]), share: 0.5 },
								{ label: "Delta", share: 0.22, align: "end" },
								{ label: t(["Shares", "股等价"]), share: 0.28, align: "end" },
							]}
							rows={rows}
							maxRows={3}
							lines={lines}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "delta",
					label: t(["Portfolio delta", "组合 Delta"]),
					value: shown.stage >= 2 ? signedCount(total) : "…",
					note: t(["share-equivalents", "股等价"]),
					evidence: "modeled",
				},
			]}
			controls={
				explore ? (
					<RangeControl
						label={t(["ALFA shares held", "持有的 ALFA 股数"])}
						value={explore.shares}
						display={signedCount(explore.shares)}
						min={-1_000}
						max={500}
						step={100}
						onChange={(shares) => setExplore({ ...explore, shares })}
					/>
				) : null
			}
		/>
	);
}

// ——— Checkpoint ———

const scenes = [
	defineScene<LotState, LotState>({
		id: "lots",
		label: ["Realized P&L", "已实现盈亏"],
		title: ["Match the sale to a lot", "把卖出匹配到批次"],
		revisit: "portfolio-pnl",
		predict: {
			prompt: [
				`You bought 6 Oct 18 105 calls at $2.10 on Monday and 4 more at $2.60 on Tuesday. On ${CHECKPOINT_DAY[0]} you sell ${SOLD} at $${SALE.toFixed(2)}. First in, first out, what's your realized P&L, in dollars?`,
				`你周一以 $2.10 买入 6 张 10月18日 105 看涨，周二又以 $2.60 买入 4 张。${CHECKPOINT_DAY[1]}你以 $${SALE.toFixed(2)} 卖出 ${SOLD} 张。按先进先出，你的已实现盈亏是多少美元？`,
			],
			choices: [
				{
					id: "fifo",
					label: [
						signedDollars(realized("fifo")),
						signedDollars(realized("fifo")),
					],
				},
				{
					id: "average",
					label: [
						signedDollars(realized("average")),
						signedDollars(realized("average")),
					],
				},
				{
					id: "lifo",
					label: [
						signedDollars(realized("lifo")),
						signedDollars(realized("lifo")),
					],
				},
			],
			answer: "fifo",
			entry: { answer: realized("fifo"), prefix: "$" },
			revealAt: 2,
			explain: [
				`First in, first out sells the 5 from Monday's $2.10 lot: 5 × ($2.95 − $2.10) × 100 = +$425. Average cost gives ${signedDollars(realized("average"))} and last in ${signedDollars(realized("lifo"))}; the method moves P&L between realized and unrealized.`,
				`先进先出卖出的是周一 $2.10 那批中的 5 张：5 × ($2.95 − $2.10) × 100 = +$425。平均成本得出 ${signedDollars(realized("average"))}，后进先出得出 ${signedDollars(realized("lifo"))}；方法只是在已实现和未实现之间挪动盈亏。`,
			],
		},
		beats: [
			{
				id: "fills",
				label: ["Fills", "成交"],
				caption: [
					"Two buys at different prices, then a partial sale.",
					"两次不同价格的买入，然后部分卖出。",
				],
				state: { stage: 0, method: "fifo" },
			},
			{
				id: "match",
				label: ["Match", "匹配"],
				caption: [
					"First in, first out: the 5 sold come from Monday's $2.10 lot.",
					"先进先出：卖出的 5 张来自周一 $2.10 那批。",
				],
				state: { stage: 1, method: "fifo" },
			},
			{
				id: "split",
				label: ["Realized and open", "已实现与持仓"],
				caption: [
					`Realized ${signedDollars(realized("fifo"))}; the 5 still open show ${signedDollars(unrealized("fifo"))} at a $${MARK.toFixed(2)} mark.`,
					`已实现 ${signedDollars(realized("fifo"))}；仍持有的 5 张按 $${MARK.toFixed(2)} 计为 ${signedDollars(unrealized("fifo"))}。`,
				],
				state: { stage: 2, method: "fifo" },
			},
		],
		explore: {
			prompt: ["Switch how lots are matched.", "切换批次匹配方式。"],
			start: () => ({ stage: 2, method: "fifo" }),
			task: {
				kind: "answer",
				prompt: [
					`Under every method, what's your total P&L, realized plus unrealized, at a $${MARK.toFixed(2)} mark?`,
					`无论哪种方法，按 $${MARK.toFixed(2)} 计，你的总盈亏（已实现加未实现）是多少？`,
				],
				choices: [
					{
						id: "total",
						label: [
							signedDollars(realized("fifo") + unrealized("fifo")),
							signedDollars(realized("fifo") + unrealized("fifo")),
						],
					},
					{
						id: "realized",
						label: [
							signedDollars(realized("fifo")),
							signedDollars(realized("fifo")),
						],
					},
					{
						id: "open",
						label: [
							signedDollars(unrealized("fifo")),
							signedDollars(unrealized("fifo")),
						],
					},
				],
				answer: "total",
				done: [
					`${signedDollars(realized("fifo") + unrealized("fifo"))} every time. The lot method decides how much is realized now and how much stays open, not what the trades earned.`,
					`每次都是 ${signedDollars(realized("fifo") + unrealized("fifo"))}。批次方法决定现在实现多少、留在持仓里多少，而不是交易赚了多少。`,
				],
			},
		},
		View: LotView,
	}),
	defineScene<ReturnState, ReturnState>({
		id: "return",
		label: ["Return", "收益率"],
		title: ["Split the week at the deposit", "在存款处把一周分开"],
		revisit: "portfolio-performance",
		predict: {
			prompt: [
				`Your account was ${dollars(OPEN)} at Monday's open and ${dollars(MIDWEEK)} on Wednesday, when you deposited ${dollars(DEPOSIT)}. It closed Friday at ${dollars(fridayFor(DEPOSIT))}. What's the week's time-weighted return, in percent?`,
				`你的账户周一开盘时为 ${dollars(OPEN)}，周三为 ${dollars(MIDWEEK)}，当天你存入 ${dollars(DEPOSIT)}。周五收盘时为 ${dollars(fridayFor(DEPOSIT))}。这一周的时间加权收益率是百分之几？`,
			],
			choices: [
				{
					id: "twr",
					label: [`+${(TWR * 100).toFixed(1)}%`, `+${(TWR * 100).toFixed(1)}%`],
				},
				{
					id: "gain",
					label: [
						`+${(((fridayFor(DEPOSIT) - DEPOSIT - OPEN) / OPEN) * 100).toFixed(1)}%`,
						`+${(((fridayFor(DEPOSIT) - DEPOSIT - OPEN) / OPEN) * 100).toFixed(1)}%`,
					],
				},
				{
					id: "growth",
					label: [
						`+${(((fridayFor(DEPOSIT) - OPEN) / OPEN) * 100).toFixed(1)}%`,
						`+${(((fridayFor(DEPOSIT) - OPEN) / OPEN) * 100).toFixed(1)}%`,
					],
				},
			],
			answer: "twr",
			entry: {
				answer: Math.round(TWR * 10_000) / 100,
				tolerance: 0.05,
				unit: ["%", "%"],
			},
			revealAt: 2,
			explain: [
				`Split at the deposit and chain the two returns: 1.025 × 1.030 − 1 ≈ +${(TWR * 100).toFixed(1)}%. Dividing the dollar gain by the starting balance ignores that the second half ran on more money.`,
				`在存款处分开，把两段收益连乘：1.025 × 1.030 − 1 ≈ +${(TWR * 100).toFixed(1)}%。用美元收益除以期初余额，忽略了后半周用的是更多的钱。`,
			],
		},
		beats: [
			{
				id: "values",
				label: ["Values", "数值"],
				caption: [
					`The balance rose ${dollars(fridayFor(DEPOSIT) - OPEN)}, but ${dollars(DEPOSIT)} of that was your own deposit.`,
					`余额增加了 ${dollars(fridayFor(DEPOSIT) - OPEN)}，但其中 ${dollars(DEPOSIT)} 是你自己的存款。`,
				],
				state: { stage: 0, deposit: DEPOSIT },
			},
			{
				id: "periods",
				label: ["Two periods", "两段"],
				caption: [
					"Measure each period on the money it started with: +2.5% before the deposit, +3.0% after.",
					"每一段按它期初的资金计算：存款前 +2.5%，存款后 +3.0%。",
				],
				state: { stage: 1, deposit: DEPOSIT },
			},
			{
				id: "chain",
				label: ["Chain", "连乘"],
				caption: [
					`Chain them: +${(TWR * 100).toFixed(1)}% for the week, the return on each dollar you had in the account.`,
					`连乘：本周 +${(TWR * 100).toFixed(1)}%，即账户里每一美元的收益。`,
				],
				state: { stage: 2, deposit: DEPOSIT },
			},
		],
		explore: {
			prompt: ["Change the Wednesday deposit.", "改变周三的存款。"],
			start: () => ({ stage: 2, deposit: DEPOSIT }),
			task: {
				kind: "answer",
				prompt: [
					"Change the deposit. Which number stays the same?",
					"改变存款金额。哪个数保持不变？",
				],
				choices: [
					{ id: "twr", label: ["Time-weighted return", "时间加权收益率"] },
					{ id: "growth", label: ["Balance growth", "余额增长"] },
					{ id: "friday", label: ["Friday's value", "周五的价值"] },
				],
				answer: "twr",
				done: [
					`The time-weighted return stays +${(TWR * 100).toFixed(1)}% whatever you deposit. Balance growth moves with every dollar you add, so it can't tell you how well the account was traded.`,
					`无论存多少，时间加权收益率都是 +${(TWR * 100).toFixed(1)}%。余额增长随你存入的每一美元变化，所以它说明不了账户交易得好不好。`,
				],
			},
		},
		View: ReturnView,
	}),
	defineScene<TradesState, TradesState>({
		id: "trades",
		label: ["Profit factor", "盈亏比"],
		title: [
			"Win rate counts trades; profit factor weighs them",
			"胜率数笔数，盈亏比称金额",
		],
		revisit: "portfolio-performance",
		predict: {
			prompt: [
				`Your closed trades this week, in order: ${TRADES.map(signedDollars).join(", ")}. What's the profit factor?`,
				`你本周按顺序平仓的交易：${TRADES.map(signedDollars).join("、")}。盈亏比是多少？`,
			],
			choices: [
				{
					id: "pf",
					label: [PROFIT_FACTOR.toFixed(2), PROFIT_FACTOR.toFixed(2)],
				},
				{ id: "count", label: ["4.00", "4.00"] },
				{ id: "rate", label: ["0.80", "0.80"] },
			],
			answer: "pf",
			entry: { answer: PROFIT_FACTOR, tolerance: 0.01 },
			revealAt: 1,
			explain: [
				`Gross wins ${dollars(GROSS_WIN)} ÷ gross losses ${dollars(GROSS_LOSS)} = ${PROFIT_FACTOR.toFixed(2)}. Below 1, so together they lost ${dollars(-running[TRADES.length - 1])}, despite winning 4 of 5.`,
				`总盈利 ${dollars(GROSS_WIN)} ÷ 总亏损 ${dollars(GROSS_LOSS)} = ${PROFIT_FACTOR.toFixed(2)}。小于 1，所以尽管 5 笔中赢了 4 笔，合起来仍亏了 ${dollars(-running[TRADES.length - 1])}。`,
			],
		},
		beats: [
			{
				id: "trades",
				label: ["Trades", "交易"],
				caption: [
					"Five closed trades and the running total.",
					"五笔已平仓交易及累计值。",
				],
				state: { stage: 0, shown: TRADES.length },
			},
			{
				id: "factor",
				label: ["Factor", "盈亏比"],
				caption: [
					`Profit factor weighs the money: ${dollars(GROSS_WIN)} won against ${dollars(GROSS_LOSS)} lost.`,
					`盈亏比称的是金额：赢了 ${dollars(GROSS_WIN)}，亏了 ${dollars(GROSS_LOSS)}。`,
				],
				state: { stage: 1, shown: TRADES.length },
			},
			{
				id: "rate",
				label: ["Win rate", "胜率"],
				caption: [
					"An 80% win rate and a net loss: one large loser outweighed four small winners.",
					"80% 的胜率，却是净亏损：一笔大亏压过了四笔小赚。",
				],
				state: { stage: 2, shown: TRADES.length },
			},
		],
		explore: {
			prompt: ["Show the trades one at a time.", "逐笔显示交易。"],
			start: () => ({ stage: 2, shown: 1 }),
			task: {
				kind: "answer",
				prompt: [
					"Step through the trades. What was the worst fall in running P&L from an earlier peak?",
					"逐笔查看。累计盈亏从此前高点的最大回落是多少？",
				],
				choices: [
					{
						id: "fall",
						label: [
							dollars(worstFall(TRADES.length)),
							dollars(worstFall(TRADES.length)),
						],
					},
					{
						id: "trough",
						label: [
							dollars(-Math.min(...running)),
							dollars(-Math.min(...running)),
						],
					},
					{
						id: "net",
						label: [
							dollars(-running[TRADES.length - 1]),
							dollars(-running[TRADES.length - 1]),
						],
					},
				],
				answer: "fall",
				done: [
					`From the ${signedDollars(Math.max(...running))} peak after trade 2 to ${signedDollars(Math.min(...running))} after trade 3: a ${dollars(worstFall(TRADES.length))} fall. Drawdown is measured from a peak, not from zero.`,
					`从第 2 笔后的高点 ${signedDollars(Math.max(...running))} 到第 3 笔后的 ${signedDollars(Math.min(...running))}：回落 ${dollars(worstFall(TRADES.length))}。回撤从高点算起，而不是从零。`,
				],
			},
		},
		View: TradesView,
	}),
	defineScene<DeltaState, DeltaState>({
		id: "delta",
		label: ["Portfolio delta", "组合 Delta"],
		title: ["Short a negative delta and it adds", "做空负 Delta，结果是加"],
		revisit: "portfolio-exposure",
		predict: {
			prompt: [
				`On ${CHECKPOINT_DAY[0]} you hold ${SHARES} ALFA shares, are long ${CALLS} Oct 18 105 calls (delta ${CALL_DELTA.toFixed(3)}) and short ${-PUTS} Oct 18 100 puts (delta ${PUT_DELTA.toFixed(3).replace("-", "−")}). What's your portfolio's delta, in share-equivalents?`,
				`${CHECKPOINT_DAY[1]}，你持有 ${SHARES} 股 ALFA，做多 ${CALLS} 张 10月18日 105 看涨（Delta ${CALL_DELTA.toFixed(3)}），做空 ${-PUTS} 张 10月18日 100 看跌（Delta ${PUT_DELTA.toFixed(3).replace("-", "−")}）。你组合的 Delta 是多少股等价？`,
			],
			choices: [
				{ id: "right", label: [signedCount(TOTAL), signedCount(TOTAL)] },
				{
					id: "sign",
					label: [
						signedCount(TOTAL - 2 * PUT_SHARES),
						signedCount(TOTAL - 2 * PUT_SHARES),
					],
				},
				{
					id: "puts",
					label: [
						signedCount(TOTAL - PUT_SHARES),
						signedCount(TOTAL - PUT_SHARES),
					],
				},
			],
			answer: "right",
			entry: {
				answer: TOTAL,
				tolerance: 2,
				unit: [" share-equivalents", " 股等价"],
			},
			revealAt: 2,
			explain: [
				`Shares ${signedCount(SHARES)}, calls ${CALLS} × ${CALL_DELTA.toFixed(3)} × 100 = ${signedCount(CALL_SHARES)}, short puts −${-PUTS} × ${PUT_DELTA.toFixed(3).replace("-", "−")} × 100 = ${signedCount(PUT_SHARES)}. Total ${signedCount(TOTAL)}: being short a put adds to your delta.`,
				`股票 ${signedCount(SHARES)}，看涨 ${CALLS} × ${CALL_DELTA.toFixed(3)} × 100 = ${signedCount(CALL_SHARES)}，看跌空头 −${-PUTS} × ${PUT_DELTA.toFixed(3).replace("-", "−")} × 100 = ${signedCount(PUT_SHARES)}。合计 ${signedCount(TOTAL)}：做空看跌会增加你的 Delta。`,
			],
		},
		beats: [
			{
				id: "positions",
				label: ["Positions", "持仓"],
				caption: [
					"Three positions, each with its own delta per share.",
					"三个持仓，各有每股的 Delta。",
				],
				state: { stage: 0, shares: SHARES },
			},
			{
				id: "puts",
				label: ["The puts", "看跌"],
				caption: [
					`Short (−${-PUTS}) times a negative delta is positive: the puts add ${signedCount(PUT_SHARES)}.`,
					`空头（−${-PUTS}）乘以负 Delta 得正数：看跌贡献 ${signedCount(PUT_SHARES)}。`,
				],
				state: { stage: 1, shares: SHARES },
			},
			{
				id: "total",
				label: ["Total", "合计"],
				caption: [
					`Add them: ${signedCount(TOTAL)} share-equivalents, like owning about ${count(Math.round(TOTAL / 100) * 100)} shares for a small move.`,
					`相加：${signedCount(TOTAL)} 股等价，小幅变动时相当于持有约 ${count(Math.round(TOTAL / 100) * 100)} 股。`,
				],
				state: { stage: 2, shares: SHARES },
			},
		],
		explore: {
			prompt: ["Change your share position.", "改变你的股票持仓。"],
			start: () => ({ stage: 2, shares: SHARES }),
			task: {
				kind: "reach",
				prompt: [
					"Find the share position that brings the portfolio's delta closest to zero.",
					"找出让组合 Delta 最接近零的股票持仓。",
				],
				reached: (e) => e.shares === NEAREST_FLAT,
				done: [
					`${signedCount(NEAREST_FLAT)} shares leaves ${signedCount(NEAREST_FLAT + OPTIONS)}: flat on delta for a small move, but the calls' and puts' gamma, vega and assignment risk are all still there.`,
					`${signedCount(NEAREST_FLAT)} 股后剩 ${signedCount(NEAREST_FLAT + OPTIONS)}：小幅变动时 Delta 中性，但看涨和看跌的 Gamma、Vega 和被行权风险都还在。`,
				],
			},
		},
		View: DeltaView,
	}),
] as const;

export function CheckpointPortfolioWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="checkpoint-portfolio"
			label={["Checkpoint for portfolio understanding", "“理解投资组合”检查点"]}
			scenes={scenes}
			review
		/>
	);
}
