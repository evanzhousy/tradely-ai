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
	NOV_DAYS_LEFT,
	OCT_DAYS_LEFT,
	RANGE,
	ROLL_NET,
	ROLL_NET_CONTRACT,
	ROLL_NET_SHARE,
	ROLL_PAID,
	ROLL_QUANTITY,
	ROLL_REALIZED,
	ROLL_SPOT,
	ROLL_TOTAL_PAID,
	ROLL_WEEKS,
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
					? t(["uncovered short call", "无备兑的看涨空头"])
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
						label={t(["You also hold", "你同时持有"])}
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
						"A leg is one position; a strategy combines legs and sometimes shares. A covered call adds stock to a short call; a protective put adds a long put to stock; a collar does both; a straddle pairs a call and a put at one strike; a vertical spread pairs two strikes in one expiry. Each leg is its own contract with its own price; what the position can make or lose comes from all its legs, and any shares, together.",
						"一条腿是一项持仓；策略把多条腿、有时还有股票组合起来。备兑看涨是股票加看涨空头；保护性看跌是股票加看跌多头；领口两者都有；跨式是同一行权价的看涨加看跌；垂直价差是同一到期日的两个行权价。每条腿都是一份独立的合约，有自己的价格；整个持仓能赚多少、会亏多少，要把所有的腿和股票合在一起看。",
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
			tone: "reference",
		},
	];
	if (shown.stage >= 1)
		lines.push({
			id: "short",
			label: t(["short 110 call", "110 看涨空头"]),
			points: kinks(shortLeg110, [105, 110]),
			tone: "reference",
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
							shown.stage >= 3
								? profit > 0
									? "gain"
									: profit < 0
										? "loss"
										: "neutral"
								: "neutral",
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
			tone:
				shown.stage >= 3
					? profit > 0
						? "gain"
						: profit < 0
							? "loss"
							: "neutral"
					: undefined,
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

// ——— Scene 3: your own roll ———

type RollState = { step: 0 | 1 | 2 | 3 };

const POSITION_TOP = 30;
const POSITION_ROW = 44;
/** Whole dollars from cents: "$6,000", "−$590". */
const cash = (cents: number) => usd(cents, 0);
const signedCash = (cents: number) => signedUsd(cents, 0);
const SPOT_TEXT = usd(ROLL_SPOT, 0);

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
			label: t([
				`Oct 18 100 call · ${OCT_DAYS_LEFT} days left`,
				`10月18日 100 看涨 · 剩 ${OCT_DAYS_LEFT} 天`,
			]),
			size: step >= 1 ? 0 : ROLL_QUANTITY,
			before: step >= 1 ? ROLL_QUANTITY : null,
		},
		{
			id: "nov",
			label: t([
				`Nov 15 100 call · ${NOV_DAYS_LEFT} days left`,
				`11月15日 100 看涨 · 剩 ${NOV_DAYS_LEFT} 天`,
			]),
			size: step >= 2 ? ROLL_QUANTITY : 0,
			before: null,
		},
	];
	const left = width < 520 ? 14 : 264;
	const span = width - left - 60;
	const k = span / ROLL_QUANTITY;
	return (
		<g>
			<Label x={14} y={18} tone="muted">
				{t(["Example account · your contracts", "示例账户 · 你的持仓（张）"])}
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
							className="wt-accent"
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
				`bought on Monday Sep 16 for ${cash(ROLL_PAID)}; Fri Oct 4, ALFA ${SPOT_TEXT}`,
				`9月16日 周一以 ${cash(ROLL_PAID)} 买入；10月4日 周五，ALFA ${SPOT_TEXT}`,
			]),
		});
	if (shown.step >= 1)
		result.push({
			id: "in",
			label: t(["Sold to close", "卖出平仓"]),
			value: signedCash(CASH_IN),
			note: t([
				`${ROLL_QUANTITY} × ${usd(SELL_OCT)} × 100; they cost ${cash(ROLL_PAID)}`,
				`${ROLL_QUANTITY} × ${usd(SELL_OCT)} × 100；买入时花了 ${cash(ROLL_PAID)}`,
			]),
		});
	if (shown.step >= 2)
		result.push({
			id: "out",
			label: t(["Bought to open", "买入开仓"]),
			value: signedCash(-CASH_OUT),
			note: t([
				`${ROLL_QUANTITY} × ${usd(BUY_NOV)} × 100`,
				`${ROLL_QUANTITY} × ${usd(BUY_NOV)} × 100`,
			]),
		});
	if (shown.step >= 3)
		result.push({
			id: "net",
			label: t(["Net cost of the roll", "移仓净成本"]),
			value: cash(ROLL_NET),
			note: t([
				`${usd(ROLL_NET_SHARE)} a share, ${cash(ROLL_NET_CONTRACT)} a contract (×100), for ${ROLL_WEEKS} more weeks`,
				`每股 ${usd(ROLL_NET_SHARE)}，每张 ${cash(ROLL_NET_CONTRACT)}（×100），换来多 ${ROLL_WEEKS} 周`,
			]),
			tone: "focus",
			evidence: "calculated",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A roll in the course's example account: your Oct 18 100 calls closed and the same number of Nov 15 100 calls opened",
						"课程示例账户里的一次移仓：平掉你的 10月18日 100 看涨，开立同样张数的 11月15日 100 看涨",
					])}
					height={(width) => positionsHeight + (width < 520 ? 24 : 0)}
				>
					{(width) => (
						<Positions width={width} step={shown.step} locale={locale} />
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
						`A roll closes one contract and opens another, here the same strike ${ROLL_WEEKS} weeks later. Many brokers take it as one order with one net price, here ${usd(ROLL_NET_SHARE)} a share; it can also be placed as two orders. It keeps the strike and buys time. It does not undo a loss: the October calls cost ${cash(ROLL_PAID)} and sold for ${cash(CASH_IN)}, and that ${cash(-ROLL_REALIZED)} loss is final. Fees are left out. The ${ROLL_QUANTITY} contracts are the example account's size, not a suggested one.`,
						`移仓是平掉一张合约、再开另一张，这里是同一行权价、晚 ${ROLL_WEEKS} 周到期。很多券商可以把它作为一张订单、按一个净价下达，这里是每股 ${usd(ROLL_NET_SHARE)}；也可以分成两张订单。它保留行权价，买来时间，但不会抹掉亏损：十月看涨买入时花了 ${cash(ROLL_PAID)}，卖出收回 ${cash(CASH_IN)}，这 ${cash(-ROLL_REALIZED)} 的亏损已成定局。这里不计费用。${ROLL_QUANTITY} 张是示例账户的数量，不是建议的仓位。`,
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
				`You sell one Oct 18 105 call for ${usd(SOLD)} a share. Is that a bet that ALFA won't rise?`,
				`你以每股 ${usd(SOLD)} 卖出一张 10月18日 105 看涨。这是在押注 ALFA 不会上涨吗？`,
			],
			choices: [
				{
					id: "unknown",
					label: [
						"Not always: it depends on what else you hold",
						"不一定：要看你还持有什么",
					],
				},
				{
					id: "fall",
					label: [
						"Yes: a sold call always gains from a fall",
						"是的：卖出的看涨总是靠下跌获利",
					],
					why: [
						"A sold call can be one leg of a position that gains when ALFA rises: sold against 100 shares it's a covered call, and paired with a long 100 call it's a call spread.",
						"卖出的看涨可以是一组在 ALFA 上涨时获利的持仓中的一条腿：对着 100 股卖出是备兑看涨，与 100 看涨多头搭配是看涨价差。",
					],
				},
				{
					id: "risk",
					label: ["Yes, and with unlimited risk", "是的，而且风险无限"],
					why: [
						"Unlimited risk applies only to an uncovered call. Against 100 shares or a long 100 call, the risk above the strike is covered.",
						"只有未备兑的看涨空头才有无限风险。对着 100 股或 100 看涨多头时，行权价以上的风险已被覆盖。",
					],
				},
			],
			answer: "unknown",
			revealAt: 1,
			explain: [
				"Sold against 100 shares it caps a stock position that still gains as ALFA rises; paired with a long 100 call it forms a call spread that also gains from a rise. Only on its own does it lose, without limit, when ALFA rises.",
				"对着 100 股卖出，它给一个 ALFA 上涨时仍获利的股票持仓设了上限；与 100 看涨多头搭配，就组成同样靠上涨获利的看涨价差。只有单独卖出时，ALFA 上涨才会带来没有上限的亏损。",
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
					"Paired with a long Oct 18 100 call it caps a call spread: −$215 at worst, +$285 at best.",
					"与 10月18日 100 看涨多头搭配，它是看涨价差的上限：最坏 −$215，最好 +$285。",
				],
				state: { context: "spread" },
			},
		],
		explore: {
			prompt: [
				"Pick what else you hold and watch the position change.",
				"选择你还持有什么，观察持仓如何变化。",
			],
			start: () => ({ context: "alone" }),
			task: {
				kind: "answer",
				prompt: [
					"With which holding is your worst case on the sold call limited to $215?",
					"卖出这张看涨后，你同时持有什么时，最坏情况被限制在 $215？",
				],
				choices: [
					{ id: "spread", label: ["A long 100 call", "100 看涨多头"] },
					{ id: "covered", label: ["100 ALFA shares", "100 股 ALFA"] },
					{ id: "alone", label: ["Nothing", "什么都没有"] },
				],
				answer: "spread",
				done: [
					"With the long 100 call it is a call spread: the most it can lose is the $215 it cost. Covered by shares, the worst case is the shares' fall; alone, the loss has no limit.",
					"加上 100 看涨多头，它就是看涨价差：最多亏它花的 $215。用股票备兑时，最坏情况是股价下跌的损失；单独卖出时，亏损没有上限。",
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
				{
					id: "long",
					label: ["+$1,000", "+$1,000"],
					why: [
						"+$1,000 is the long 105 call alone. The short 110 call gives back $500 at $115, and the spread cost $125.",
						"+$1,000 只是 105 看涨多头本身。110 看涨空头在 $115 时要退回 $500，而且价差成本是 $125。",
					],
				},
				{
					id: "gross",
					label: ["+$875", "+$875"],
					why: [
						"+$875 takes the cost off the long call but leaves out the short 110 call, which costs $500 at $115.",
						"+$875 是从看涨多头中减去了成本，却漏掉了 110 看涨空头，它在 $115 时要付 $500。",
					],
				},
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
		title: [
			"A roll closes one contract and opens a later one",
			"移仓：平掉一张合约，开立更晚到期的一张",
		],
		predict: {
			prompt: [
				`You paid ${cash(ROLL_PAID)} for ${ROLL_QUANTITY} Oct 18 100 calls. With ${OCT_DAYS_LEFT} days left they sell for ${cash(CASH_IN)}. You roll: sell them and buy ${ROLL_QUANTITY} Nov 15 100 calls for ${cash(CASH_OUT)}. What has the roll done?`,
				`你花 ${cash(ROLL_PAID)} 买了 ${ROLL_QUANTITY} 张 10月18日 100 看涨。还剩 ${OCT_DAYS_LEFT} 天时，它们能卖 ${cash(CASH_IN)}。你移仓：卖掉它们，再花 ${cash(CASH_OUT)} 买入 ${ROLL_QUANTITY} 张 11月15日 100 看涨。这次移仓做了什么？`,
			],
			choices: [
				{
					id: "time",
					label: [
						`Bought ${ROLL_WEEKS} more weeks for ${cash(ROLL_NET)} more`,
						`多花 ${cash(ROLL_NET)}，换来多 ${ROLL_WEEKS} 周`,
					],
				},
				{
					id: "reset",
					label: [
						`Erased the ${cash(-ROLL_REALIZED)} loss so far`,
						`抹掉了到目前为止的 ${cash(-ROLL_REALIZED)} 亏损`,
					],
					why: [
						`The October calls cost ${cash(ROLL_PAID)} and sold for ${cash(CASH_IN)}. Selling them makes that ${cash(-ROLL_REALIZED)} loss final; the November calls are a new position with their own cost.`,
						`十月看涨买入时花了 ${cash(ROLL_PAID)}，卖出收回 ${cash(CASH_IN)}。卖出让这 ${cash(-ROLL_REALIZED)} 的亏损成为定局；十一月看涨是一个新持仓，有它自己的成本。`,
					],
				},
				{
					id: "free",
					label: [
						"Swapped expiries at no cost: the sale pays for the purchase",
						"不花钱换了到期日：卖出的钱够付买入",
					],
					why: [
						`The sale brings in ${cash(CASH_IN)}, but the November calls cost ${cash(CASH_OUT)}: ${ROLL_WEEKS} more weeks of time cost more. The ${cash(ROLL_NET)} difference is new money paid.`,
						`卖出收回 ${cash(CASH_IN)}，但十一月看涨要 ${cash(CASH_OUT)}：多 ${ROLL_WEEKS} 周的时间更贵。差额 ${cash(ROLL_NET)} 是新付出的钱。`,
					],
				},
				{
					id: "safer",
					label: [
						"Lowered the most you can lose from here",
						"降低了从现在起最多能亏的金额",
					],
					why: [
						`More premium is at risk after the roll, not less: ${cash(CASH_OUT)} in November calls, against ${cash(CASH_IN)} in the October calls before it.`,
						`移仓后承担风险的权利金更多，而不是更少：十一月看涨是 ${cash(CASH_OUT)}，移仓前的十月看涨是 ${cash(CASH_IN)}。`,
					],
				},
			],
			answer: "time",
			revealAt: 3,
			explain: [
				`${cash(CASH_OUT)} out less ${cash(CASH_IN)} in is ${cash(ROLL_NET)}: ${usd(ROLL_NET_SHARE)} a share, ${cash(ROLL_NET_CONTRACT)} a contract. The strike is still $100 and the expiry is ${ROLL_WEEKS} weeks later. The ${cash(-ROLL_REALIZED)} loss on the October calls is made, and ${cash(CASH_OUT)} of premium is now at risk.`,
				`支出 ${cash(CASH_OUT)} 减去收回的 ${cash(CASH_IN)}，是 ${cash(ROLL_NET)}：每股 ${usd(ROLL_NET_SHARE)}，每张 ${cash(ROLL_NET_CONTRACT)}。行权价仍是 $100，到期日晚了 ${ROLL_WEEKS} 周。十月看涨上 ${cash(-ROLL_REALIZED)} 的亏损已经发生，现在有 ${cash(CASH_OUT)} 的权利金承担风险。`,
			],
		},
		beats: [
			{
				id: "hold",
				label: ["Before", "之前"],
				caption: [
					`Fri Oct 4, ALFA ${SPOT_TEXT}: in the course's example account you hold ${ROLL_QUANTITY} Oct 18 100 calls, bought for ${cash(ROLL_PAID)}, with ${OCT_DAYS_LEFT} days left.`,
					`10月4日 周五，ALFA ${SPOT_TEXT}：在课程的示例账户里，你持有以 ${cash(ROLL_PAID)} 买入的 ${ROLL_QUANTITY} 张 10月18日 100 看涨，还剩 ${OCT_DAYS_LEFT} 天。`,
				],
				state: { step: 0 },
			},
			{
				id: "close",
				label: ["Close", "平仓"],
				caption: [
					`First leg: sell to close all ${ROLL_QUANTITY} at ${usd(SELL_OCT)} a share. ${cash(CASH_IN)} comes in, ${cash(-ROLL_REALIZED)} less than they cost.`,
					`第一条腿：以每股 ${usd(SELL_OCT)} 卖出平仓全部 ${ROLL_QUANTITY} 张。收回 ${cash(CASH_IN)}，比买入成本少 ${cash(-ROLL_REALIZED)}。`,
				],
				state: { step: 1 },
			},
			{
				id: "open",
				label: ["Open", "开仓"],
				caption: [
					`Second leg: buy to open ${ROLL_QUANTITY} Nov 15 100 calls at ${usd(BUY_NOV)} a share. ${cash(CASH_OUT)} goes out: the same strike, with ${NOV_DAYS_LEFT} days left.`,
					`第二条腿：以每股 ${usd(BUY_NOV)} 买入开仓 ${ROLL_QUANTITY} 张 11月15日 100 看涨。支出 ${cash(CASH_OUT)}：同一行权价，还剩 ${NOV_DAYS_LEFT} 天。`,
				],
				state: { step: 2 },
			},
			{
				id: "net",
				label: ["Net cost", "净成本"],
				caption: [
					`Together, one roll: ${usd(ROLL_NET_SHARE)} a share net, ${cash(ROLL_NET_CONTRACT)} a contract, ${cash(ROLL_NET)} for all ${ROLL_QUANTITY}. Same strike, ${ROLL_WEEKS} more weeks, more premium at risk.`,
					`合起来是一次移仓：每股净付 ${usd(ROLL_NET_SHARE)}，每张 ${cash(ROLL_NET_CONTRACT)}，${ROLL_QUANTITY} 张共 ${cash(ROLL_NET)}。同一行权价，多 ${ROLL_WEEKS} 周，承担风险的权利金更多。`,
				],
				state: { step: 3 },
			},
		],
		explore: {
			prompt: [
				"Step through the roll one leg at a time.",
				"逐条腿查看这次移仓。",
			],
			start: () => ({ step: 0 }),
			task: {
				kind: "answer",
				prompt: [
					"Once the roll is done, how much have you paid in all for these calls, October and November together?",
					"移仓完成后，十月和十一月合在一起，你为这些看涨总共付了多少？",
				],
				choices: [
					{
						id: "all",
						label: [cash(ROLL_TOTAL_PAID), cash(ROLL_TOTAL_PAID)],
					},
					{ id: "open", label: [cash(CASH_OUT), cash(CASH_OUT)] },
					{ id: "net", label: [cash(ROLL_NET), cash(ROLL_NET)] },
				],
				answer: "all",
				done: [
					`${cash(ROLL_PAID)} on Monday plus the roll's ${cash(ROLL_NET)}: ${cash(ROLL_TOTAL_PAID)} in all, for November calls bought at ${cash(CASH_OUT)}. The ${cash(-ROLL_REALIZED)} between them is the October loss. The roll bought time; it did not win that back.`,
					`周一的 ${cash(ROLL_PAID)} 加上移仓的 ${cash(ROLL_NET)}：一共 ${cash(ROLL_TOTAL_PAID)}，换来以 ${cash(CASH_OUT)} 买入的十一月看涨。两者之差 ${cash(-ROLL_REALIZED)} 就是十月看涨的亏损。移仓买来的是时间，并没有把这笔亏损赚回来。`,
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
