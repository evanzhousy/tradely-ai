import * as m from "motion/react-m";
import { type Copy, count, pick, signedUsd, usd } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import {
	type PayoffBand,
	PayoffChart,
	type PayoffLine,
	type PayoffMarker,
} from "../walkthrough/instruments/payoff-chart";
import {
	type TapeRow,
	TradeTape,
	tapeHeight,
} from "../walkthrough/instruments/trade-tape";
import { Player } from "../walkthrough/player";
import { Label, Stage, useTeachMotion } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame } from "../walkthrough/walkthrough";
import { optionStrategiesFilm } from "./option-strategies-film";
import {
	BUY_NOV,
	CASH_IN,
	CASH_OUT,
	type Context,
	kinks,
	longLeg,
	NET,
	RANGE,
	ROLL_QUANTITY,
	SELL_OCT,
	SOLD,
	STOCK_COST,
	shortLeg,
	shortLeg110,
	spreadPayoff,
	structures,
} from "./option-strategies-model";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

// ——— Scene 1: one leg, three positions ———

type LegState = { context: Context };

function LegView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: LegState;
	explore: LegState | null;
	setExplore: (next: LegState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const f = structures[shown.context];
	const lines: PayoffLine[] = [
		...(shown.context === "alone"
			? []
			: [
					{
						id: "leg",
						label: t(["short 105 call alone", "单独的 105 看涨空头"]),
						points: kinks(shortLeg, [105]),
						tone: "reference" as const,
					},
				]),
		{
			id: "position",
			label:
				shown.context === "alone"
					? t(["uncovered short call", "无备兑看涨空头"])
					: shown.context === "covered"
						? t(["covered call", "备兑看涨"])
						: t(["100/105 call spread", "100/105 看涨价差"]),
			points: kinks(f, [100, 105]),
			tone: "position",
		},
	];
	const best = Math.max(f(RANGE[0]), f(105), f(RANGE[1]));
	const worst = Math.min(f(RANGE[0]), f(RANGE[1]));
	const structure: Copy =
		shown.context === "alone"
			? ["short 1 Oct 18 105 call", "1 张 10月18日 105 看涨空头"]
			: shown.context === "covered"
				? ["100 ALFA + short 105 call", "100 股 ALFA + 105 看涨空头"]
				: ["long 100 call + short 105 call", "100 看涨多头 + 105 看涨空头"];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The same short Oct 18 105 call inside three different positions, as profit at expiry",
						"同一张 10月18日 105 看涨空头放在三种不同持仓中，到期盈亏如何",
					])}
					height={(width) => (width < 520 ? 260 : 300)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 260 : 300}
							xRange={RANGE}
							yRange={[-2200, 1200]}
							xTicks={[80, 90, 100, 110, 120]}
							yTicks={[-2000, -1000, 0, 1000]}
							lines={lines}
							xLabel={t(["ALFA on Oct 18", "10月18日 ALFA"])}
							title={t([
								`Sold 1 Oct 18 105 call at ${usd(SOLD)} · per position`,
								`以 ${usd(SOLD)} 卖出 1 张 10月18日 105 看涨 · 每组持仓`,
							])}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "structure",
					label: t(["Position", "持仓"]),
					value: t(structure),
				},
				{
					id: "best",
					label: t(["Most it can make", "最大收益"]),
					value: signedUsd(best * 100, 0),
					tone: "gain",
					evidence: "calculated",
				},
				{
					id: "worst",
					label: t(["Worst case", "最坏情况"]),
					value:
						shown.context === "alone"
							? t(["no limit", "无上限"])
							: shown.context === "covered"
								? t([
										`${signedUsd((SOLD - STOCK_COST * 100) * 100, 0)} if ALFA goes to $0`,
										`ALFA 跌至 $0 时 ${signedUsd((SOLD - STOCK_COST * 100) * 100, 0)}`,
									])
								: signedUsd(worst * 100, 0),
					tone: "loss",
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["The seller also holds", "卖方同时持有"])}
						value={explore.context}
						options={[
							["alone", t(["Nothing", "无"])],
							["covered", t(["100 ALFA", "100 股 ALFA"])],
							["spread", t(["A long 100 call", "100 看涨多头"])],
						]}
						onChange={(context) => setExplore({ context })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A leg is one position; a strategy combines legs and sometimes shares. A covered call adds stock to a short call; a protective put adds a long put to stock; a collar does both; a straddle pairs a call and a put at one strike; a vertical spread pairs two strikes in one expiry. The tape shows legs, never the structure, unless linked-leg records say so.",
						"一条腿是一项持仓；策略把多条腿、有时还有股票组合起来。备兑看涨是股票加看涨空头；保护性看跌是股票加看跌多头；领口两者都有；跨式是同一行权价的看涨加看跌；垂直价差是同一到期日的两个行权价。除非有关联腿记录，逐笔成交只显示单腿，从不显示结构。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: add signed legs ———

type AddState = { stage: 0 | 1 | 2 | 3; spot: number };

/** Whole dollars from dollars: "$500", "+$375". */
const dollars = (value: number) => usd(value * 100, 0);
const signedDollars = (value: number) => signedUsd(value * 100, 0);

function AddView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: AddState;
	explore: AddState | null;
	setExplore: (next: AddState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const lines: PayoffLine[] = [
		{
			id: "long",
			label: t(["long 105 call", "105 看涨多头"]),
			points: kinks(longLeg, [105, 110]),
			tone: shown.stage >= 2 ? "reference" : "long",
		},
	];
	if (shown.stage >= 1)
		lines.push({
			id: "short",
			label: t(["short 110 call", "110 看涨空头"]),
			points: kinks(shortLeg110, [105, 110]),
			tone: shown.stage >= 2 ? "reference" : "short",
		});
	if (shown.stage >= 2)
		lines.push({
			id: "sum",
			label:
				shown.stage >= 3
					? t(["profit", "盈亏"])
					: t(["sum at expiry", "到期合计"]),
			points: kinks(
				(spot) => spreadPayoff(spot) - (shown.stage >= 3 ? NET : 0),
				[105, 110],
			),
			tone: "position",
		});
	const value = spreadPayoff(shown.spot);
	const profit = value - NET;
	const markers: PayoffMarker[] =
		shown.stage >= 2
			? [
					{
						id: "at",
						x: shown.spot,
						y: shown.stage >= 3 ? profit : value,
						label: shown.stage >= 3 ? signedDollars(profit) : dollars(value),
						tone:
							shown.stage >= 3 ? (profit >= 0 ? "gain" : "loss") : "neutral",
					},
				]
			: [];
	const bands: PayoffBand[] =
		shown.stage >= 2
			? [{ id: "cap", from: 110, to: RANGE[1], tone: "neutral" }]
			: [];
	const result: ResultItem[] = [
		{
			id: "long",
			label: t(["Long 105 call", "105 看涨多头"]),
			value: signedDollars(longLeg(shown.spot)),
			tween: { to: longLeg(shown.spot), format: signedDollars },
			note: t([`at ALFA $${shown.spot}`, `ALFA $${shown.spot} 时`]),
		},
	];
	if (shown.stage >= 1)
		result.push({
			id: "short",
			label: t(["Short 110 call", "110 看涨空头"]),
			value: signedDollars(shortLeg110(shown.spot)),
			tween: { to: shortLeg110(shown.spot), format: signedDollars },
		});
	if (shown.stage >= 2)
		result.push({
			id: "sum",
			label:
				shown.stage >= 3
					? t(["Profit", "盈亏"])
					: t(["Payoff, both legs", "两腿合计到期价值"]),
			value: shown.stage >= 3 ? signedDollars(profit) : dollars(value),
			// Counting from payoff to profit shows the cost coming off.
			tween:
				shown.stage >= 3
					? { to: profit, format: signedDollars }
					: { to: value, format: dollars },
			note:
				shown.stage >= 3
					? t([
							`payoff − ${usd(NET * 100, 0)} paid`,
							`到期价值 − 已付 ${usd(NET * 100, 0)}`,
						])
					: t(["add the signed legs", "把带符号的各腿相加"]),
			tone: shown.stage >= 3 ? (profit >= 0 ? "gain" : "loss") : undefined,
			evidence: "calculated",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The 105/110 call spread's legs at expiry, their sum, and the profit after its cost",
						"105/110 看涨价差各腿的到期价值、合计，以及扣除成本后的盈亏",
					])}
					height={(width) => (width < 520 ? 260 : 300)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 260 : 300}
							xRange={RANGE}
							yRange={[-1100, 1600]}
							xTicks={[80, 90, 100, 110, 120]}
							yTicks={[-1000, 0, 500, 1000, 1500]}
							lines={lines}
							markers={markers}
							bands={bands}
							drag={
								explore
									? {
											markerId: "at",
											min: RANGE[0],
											max: RANGE[1],
											step: 1,
											onChange: (spot) => setExplore({ ...explore, spot }),
										}
									: undefined
							}
							xLabel={t(["ALFA on Oct 18", "10月18日 ALFA"])}
							title={t([
								`105/110 call spread bought for ${usd(NET)} · per spread`,
								`以 ${usd(NET)} 买入 105/110 看涨价差 · 每组`,
							])}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<RangeControl
						label={t(["ALFA on Oct 18", "10月18日 ALFA"])}
						value={explore.spot}
						display={`$${explore.spot}`}
						min={RANGE[0]}
						max={RANGE[1]}
						onChange={(spot) => setExplore({ ...explore, spot })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Give each leg its sign: long legs add their value at expiry, short legs subtract it. Add them at the same price to get the structure's payoff, then subtract what it cost to get the profit. Keep the entry cost, fees and any early assignment separate from the expiry picture.",
						"给每条腿加上符号：多头腿加上到期价值，空头腿减去。在同一价格上相加得到结构的到期价值，再减去成本得到盈亏。入场成本、费用和提前指派要与到期图分开考虑。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: a roll is two linked trades ———

type RollState = { step: 0 | 1 | 2 | 3 };

const POSITION_TOP = 30;
const POSITION_ROW = 44;

function Positions({
	width,
	step,
	locale,
}: {
	width: number;
	step: number;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const rows = [
		{
			id: "oct",
			label: t(["Oct 18 100 call", "10月18日 100 看涨"]),
			size: step >= 1 ? 0 : ROLL_QUANTITY,
			before: step >= 1 ? ROLL_QUANTITY : null,
		},
		{
			id: "nov",
			label: t(["Nov 15 100 call", "11月15日 100 看涨"]),
			size: step >= 2 ? ROLL_QUANTITY : 0,
			before: null,
		},
	];
	const left = width < 520 ? 14 : 170;
	const span = width - left - 60;
	const k = span / ROLL_QUANTITY;
	return (
		<g>
			<Label x={14} y={18} tone="muted">
				{t(["Your position · contracts", "你的持仓 · 张"])}
			</Label>
			{rows.map((row, i) => {
				const y = POSITION_TOP + i * POSITION_ROW;
				const barY = width < 520 ? y + 18 : y + 4;
				return (
					<g key={row.id}>
						<Label x={14} y={width < 520 ? y + 12 : y + 18}>
							{row.label}
						</Label>
						{row.before !== null ? (
							<rect
								x={left}
								y={barY}
								width={row.before * k}
								height={18}
								className="wt-ghost"
							/>
						) : null}
						<m.rect
							x={left}
							y={barY}
							height={18}
							rx={3}
							className="wt-long"
							initial={false}
							animate={{ width: row.size * k }}
							transition={motion.move}
						/>
						<Label
							x={left + Math.max(row.size, row.before ?? 0) * k + 8}
							y={barY + 14}
						>
							{count(row.size)}
						</Label>
					</g>
				);
			})}
		</g>
	);
}

function RollView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: RollState;
	explore: RollState | null;
	setExplore: (next: RollState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const prints: TapeRow[] = [];
	if (shown.step >= 2)
		prints.push({
			key: "nov",
			cells: [
				"10:15:02",
				t(["Nov 15 100 c", "11月15日 100 看涨"]),
				count(ROLL_QUANTITY),
				usd(BUY_NOV),
				t(["bullish", "看涨"]),
			],
		});
	if (shown.step >= 1)
		prints.push({
			key: "oct",
			cells: [
				"10:15:01",
				t(["Oct 18 100 c", "10月18日 100 看涨"]),
				count(ROLL_QUANTITY),
				usd(SELL_OCT),
				t(["bearish", "看跌"]),
			],
		});
	const positionsHeight = POSITION_TOP + 2 * POSITION_ROW + 8;
	const result: ResultItem[] = [];
	if (shown.step === 0)
		result.push({
			id: "hold",
			label: t(["You hold", "你持有"]),
			value: t([
				`${ROLL_QUANTITY} Oct 18 100 calls`,
				`${ROLL_QUANTITY} 张 10月18日 100 看涨`,
			]),
			note: t([
				"Fri Oct 4, ALFA $102, 14 days left",
				"10月4日 周五，ALFA $102，剩 14 天",
			]),
		});
	if (shown.step >= 1)
		result.push({
			id: "in",
			label: t(["Sold to close", "卖出平仓"]),
			value: signedUsd(CASH_IN, 0),
			note: t([
				`${ROLL_QUANTITY} × ${usd(SELL_OCT)} × 100`,
				`${ROLL_QUANTITY} × ${usd(SELL_OCT)} × 100`,
			]),
		});
	if (shown.step >= 2)
		result.push({
			id: "out",
			label: t(["Bought to open", "买入开仓"]),
			value: signedUsd(-CASH_OUT, 0),
			note: t([
				`${ROLL_QUANTITY} × ${usd(BUY_NOV)} × 100`,
				`${ROLL_QUANTITY} × ${usd(BUY_NOV)} × 100`,
			]),
		});
	if (shown.step >= 3)
		result.push({
			id: "net",
			label: t(["Net cost of the roll", "移仓净成本"]),
			value: usd(CASH_OUT - CASH_IN, 0),
			note: t([
				`${usd(BUY_NOV - SELL_OCT)} a share for four more weeks`,
				`每股 ${usd(BUY_NOV - SELL_OCT)}，换来多四周`,
			]),
			evidence: "calculated",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A roll: your Oct 18 calls closed and Nov 15 calls opened, with the two prints it leaves",
						"移仓：平掉 10月18日 看涨、开立 11月15日 看涨，以及留下的两笔成交",
					])}
					height={(width) =>
						positionsHeight + (width < 520 ? 24 : 0) + 12 + tapeHeight(2)
					}
				>
					{(width) => (
						<g>
							<Positions width={width} step={shown.step} locale={locale} />
							<TradeTape
								x={8}
								y={positionsHeight + (width < 520 ? 24 : 0) + 12}
								width={width - 16}
								title={t([
									"Time and sales · Fri Oct 4",
									"逐笔成交 · 10月4日 周五",
								])}
								columns={
									width < 520
										? [
												{ label: t(["Contract", "合约"]), share: 0.44 },
												{
													label: t(["Qty", "张数"]),
													share: 0.12,
													align: "end",
												},
												{
													label: t(["Price", "价格"]),
													share: 0.2,
													align: "end",
												},
												{
													label: t(["Label", "标签"]),
													share: 0.24,
													align: "end",
												},
											]
										: [
												{ label: t(["Time", "时间"]), share: 0.2 },
												{ label: t(["Contract", "合约"]), share: 0.3 },
												{ label: t(["Qty", "张数"]), share: 0.1, align: "end" },
												{
													label: t(["Price", "价格"]),
													share: 0.18,
													align: "end",
												},
												{
													label: t(["Label", "标签"]),
													share: 0.22,
													align: "end",
												},
											]
								}
								rows={
									width < 520
										? prints.map((row) => ({
												...row,
												cells: row.cells.slice(1),
											}))
										: prints
								}
								maxRows={2}
								empty={t(["No trades yet", "尚无成交"])}
							/>
						</g>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Step", "步骤"])}
						value={String(explore.step) as "0" | "1" | "2" | "3"}
						options={[
							["0", t(["Before", "之前"])],
							["1", t(["Close", "平仓"])],
							["2", t(["Open", "开仓"])],
							["3", t(["Net", "净额"])],
						]}
						onChange={(value) =>
							setExplore({ step: Number(value) as RollState["step"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A roll closes one contract and opens another, here the same strike a month later. It usually goes in as one order, but it prints as two separate trades, so a feed that labels each print alone sees one bearish sale and one bullish purchase. Linked-leg records, or your own blotter, show they were one decision.",
						"移仓是平掉一张合约、再开另一张，这里是同一行权价、晚一个月到期。它通常作为一张订单下达，但会打印成两笔独立成交，所以逐笔贴标签的数据会看到一笔看跌的卖出和一笔看涨的买入。关联腿记录或你自己的交易记录会显示它们是同一个决定。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<LegState, LegState>({
		id: "one-leg",
		label: ["One leg, three positions", "一条腿，三种持仓"],
		title: [
			"The same leg can belong to different structures",
			"同一条腿可以属于不同的结构",
		],
		predict: {
			prompt: [
				"You see one Oct 18 105 call sold at the bid. Is the seller betting ALFA won't rise?",
				"你看到一张 10月18日 105 看涨在买价被卖出。卖方是在押注 ALFA 不会上涨吗？",
			],
			choices: [
				{
					id: "unknown",
					label: [
						"Can't tell: it may cover shares or cap a spread",
						"无法判断：可能是备兑股票或价差的上限",
					],
				},
				{
					id: "bearish",
					label: ["Yes: short calls are bearish", "是的：看涨空头就是看跌"],
				},
				{
					id: "risk",
					label: ["Yes, and with unlimited risk", "是的，而且风险无限"],
				},
			],
			answer: "unknown",
			revealAt: 1,
			explain: [
				"Written against 100 shares it caps a bullish stock position; paired with a long 100 call it forms a bull spread. Alone, one print can't tell you which.",
				"对着 100 股卖出，它是给看多的股票持仓设上限；与 100 看涨多头搭配，就组成看涨价差。仅凭一笔成交，无法判断是哪一种。",
			],
		},
		beats: [
			{
				id: "alone",
				label: ["Alone", "单独"],
				caption: [
					"Sold on its own at $2.05, the Oct 18 105 call keeps $205 if ALFA stays below $105, and its loss has no limit above that.",
					"单独以 $2.05 卖出 10月18日 105 看涨，若 ALFA 低于 $105 可保留 $205，高于此价时亏损没有上限。",
				],
				state: { context: "alone" },
			},
			{
				id: "covered",
				label: ["Covered", "备兑"],
				caption: [
					"Written against 100 shares bought at $100, the same sale is a covered call: it gains as ALFA rises, up to +$705.",
					"对着以 $100 买入的 100 股卖出，同样的卖出就是备兑看涨：ALFA 上涨时获利，最多 +$705。",
				],
				state: { context: "covered" },
			},
			{
				id: "spread",
				label: ["In a spread", "价差中"],
				caption: [
					"Paired with a long Oct 18 100 call it caps a bull call spread: −$215 at worst, +$285 at best.",
					"与 10月18日 100 看涨多头搭配，它是看涨价差的上限：最坏 −$215，最好 +$285。",
				],
				state: { context: "spread" },
			},
		],
		explore: {
			prompt: [
				"Pick what else the seller holds and watch the position change.",
				"选择卖方还持有什么，观察持仓如何变化。",
			],
			start: (last) => last,
			task: {
				kind: "answer",
				prompt: [
					"With which holding is the call seller's worst case limited to $215?",
					"卖出看涨的人同时持有什么时，最坏情况被限制在 $215？",
				],
				choices: [
					{ id: "spread", label: ["A long 100 call", "100 看涨多头"] },
					{ id: "covered", label: ["100 ALFA shares", "100 股 ALFA"] },
					{ id: "alone", label: ["Nothing", "什么都没有"] },
				],
				answer: "spread",
				done: [
					"With the long 100 call it is a bull call spread: the most it can lose is the $215 it cost. Covered by shares, the worst case is the shares' fall; alone, the loss has no limit.",
					"加上 100 看涨多头，它就是牛市看涨价差：最多亏它花的 $215。用股票备兑时，最坏情况是股价下跌的损失；单独卖出时，亏损没有上限。",
				],
			},
		},
		View: LegView,
	}),
	defineScene<AddState, AddState>({
		id: "add-legs",
		label: ["Add the legs", "合并各腿"],
		title: [
			"Add signed legs before reading the profit",
			"先合并带符号的各腿，再读盈亏",
		],
		predict: {
			prompt: [
				"At expiry ALFA is $115. The 105/110 call spread cost $1.25 a share. What is the profit per spread?",
				"到期时 ALFA 为 $115。105/110 看涨价差每股成本 $1.25。每组价差盈亏多少？",
			],
			choices: [
				{ id: "right", label: ["+$375", "+$375"] },
				{ id: "long", label: ["+$1,000", "+$1,000"] },
				{ id: "gross", label: ["+$875", "+$875"] },
			],
			answer: "right",
			entry: { answer: 375, prefix: "$" },
			revealAt: 3,
			explain: [
				"The long 105 call pays $1,000 and the short 110 call costs $500: $500 of payoff. Less the $125 it cost, that's +$375.",
				"105 看涨多头支付 $1,000，110 看涨空头需付 $500：合计到期价值 $500。扣除 $125 成本，盈利 +$375。",
			],
		},
		beats: [
			{
				id: "long",
				label: ["Long leg", "多头腿"],
				caption: [
					"The long Oct 18 105 call is worth ALFA minus $105 a share at expiry, or nothing: $1,000 at $115.",
					"10月18日 105 看涨多头到期时每股值 ALFA 减 $105，否则为零：$115 时为 $1,000。",
				],
				state: { stage: 0, spot: 115 },
			},
			{
				id: "short",
				label: ["Short leg", "空头腿"],
				caption: [
					"The short 110 call works against you above $110: at $115 it costs $500. Its sign is negative.",
					"110 看涨空头在 $110 以上对你不利：$115 时要付 $500。它的符号是负的。",
				],
				state: { stage: 1, spot: 115 },
			},
			{
				id: "sum",
				label: ["The sum", "合计"],
				caption: [
					"Add them at each price: nothing below $105, rising to $500 at $110, then flat. The short call caps the spread.",
					"在每个价格上相加：$105 以下为零，到 $110 升至 $500，之后持平。空头看涨给价差封了顶。",
				],
				state: { stage: 2, spot: 115 },
			},
			{
				id: "profit",
				label: ["Profit", "盈亏"],
				caption: [
					"Subtract the $1.25 a share paid: +$375 at $115, −$125 at worst, break-even at $106.25.",
					"减去每股已付的 $1.25：$115 时 +$375，最坏 −$125，盈亏平衡点 $106.25。",
				],
				state: { stage: 3, spot: 115 },
			},
		],
		explore: {
			prompt: [
				"Drag across the chart to move ALFA's price at expiry, and read each leg and the total.",
				"在图上左右拖动来移动到期时 ALFA 的价格，读出每条腿和合计。",
			],
			start: () => ({ stage: 3, spot: 108 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the lowest price where the spread makes its maximum profit.",
					"找出价差达到最大盈利的最低价格。",
				],
				reached: (e) => e.spot === 110,
				done: [
					"From $110 up, the short 110 call gives back every dollar the long 105 call adds: payoff stops at $500, profit at $375. Below $106.25 the spread loses.",
					"从 $110 起，110 看涨空头会把 105 看涨多头多赚的每一美元都还回去：到期价值封顶于 $500，盈利封顶于 $375。低于 $106.25 时价差亏损。",
				],
			},
		},
		View: AddView,
	}),
	defineScene<RollState, RollState>({
		id: "roll",
		label: ["Close, then open", "先平仓，再开仓"],
		title: ["A roll is two linked trades", "移仓是两笔关联的交易"],
		predict: {
			prompt: [
				"A trader sells 16 Oct 18 100 calls and a second later buys 16 Nov 15 100 calls. A feed labels them bearish and bullish. What happened?",
				"一位交易者卖出 16 张 10月18日 100 看涨，一秒后买入 16 张 11月15日 100 看涨。数据分别标为看跌和看涨。发生了什么？",
			],
			choices: [
				{
					id: "roll",
					label: [
						"One decision: a roll to a later expiry",
						"一个决定：移仓到更晚的到期日",
					],
				},
				{
					id: "flip",
					label: ["They changed their mind twice", "他改了两次主意"],
				},
				{ id: "two", label: ["Two different traders", "两个不同的交易者"] },
			],
			answer: "roll",
			revealAt: 2,
			explain: [
				"Closing the October calls and opening November ones at the same strike keeps the same view for four more weeks. The two opposite labels describe legs, not a change of mind.",
				"平掉十月看涨、开立同一行权价的十一月看涨，是把同样的观点再延长四周。两个相反的标签描述的是两条腿，而不是改变主意。",
			],
		},
		beats: [
			{
				id: "hold",
				label: ["Before", "之前"],
				caption: [
					"Fri Oct 4, ALFA $102: you still hold the 16 Oct 18 100 calls from Monday, with two weeks left.",
					"10月4日 周五，ALFA $102：你仍持有周一买入的 16 张 10月18日 100 看涨，还剩两周。",
				],
				state: { step: 0 },
			},
			{
				id: "close",
				label: ["Close", "平仓"],
				caption: [
					"First leg: sell to close all 16 at the $3.75 bid. $6,000 comes in, and the tape shows a sale at the bid.",
					"第一条腿：以 $3.75 的买价卖出平仓全部 16 张。收入 $6,000，逐笔成交显示一笔在买价的卖出。",
				],
				state: { step: 1 },
			},
			{
				id: "open",
				label: ["Open", "开仓"],
				caption: [
					"Second leg: buy to open 16 Nov 15 100 calls at the $5.70 ask. $9,120 goes out, and a purchase at the ask prints.",
					"第二条腿：以 $5.70 的卖价买入开仓 16 张 11月15日 100 看涨。支出 $9,120，打印出一笔在卖价的买入。",
				],
				state: { step: 2 },
			},
			{
				id: "net",
				label: ["One decision", "一个决定"],
				caption: [
					"Together: the same strike four weeks later for a net $3,120. One decision, two prints with opposite labels.",
					"合起来：同一行权价、晚四周到期，净支出 $3,120。一个决定，两笔标签相反的成交。",
				],
				state: { step: 3 },
			},
		],
		explore: {
			prompt: [
				"Step through the roll one leg at a time.",
				"逐条腿查看这次移仓。",
			],
			start: () => ({ step: 3 }),
			task: {
				kind: "answer",
				prompt: [
					"What did the whole roll cost, net?",
					"整个移仓的净成本是多少？",
				],
				choices: [
					{ id: "net", label: ["$3,120", "$3,120"] },
					{ id: "open", label: ["$9,120", "$9,120"] },
					{ id: "close", label: ["$6,000", "$6,000"] },
				],
				answer: "net",
				done: [
					"$9,120 out for the November calls less $6,000 in for the October ones: $3,120 for four more weeks at the same strike. One decision, two prints with opposite labels.",
					"买入 11月 看涨支出 $9,120，减去卖出 10月 看涨收回的 $6,000：花 $3,120 换来同一行权价多四周的时间。一个决定，两笔标签相反的成交。",
				],
			},
		},
		View: RollView,
	}),
] as const;

export function OptionStrategiesWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Player
			locale={locale}
			id="option-strategies"
			label={[
				"Interactive lesson on strategies and their legs",
				"策略与各条腿互动课",
			]}
			film={optionStrategiesFilm}
			scenes={scenes}
		/>
	);
}
