import {
	type Copy,
	count,
	modelVolatility,
	pick,
	priceOption,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import { BarChart } from "../walkthrough/instruments/bar-chart";
import {
	PayoffChart,
	type PayoffLine,
	type PayoffMarker,
} from "../walkthrough/instruments/payoff-chart";
import { Stage } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

/** Friday Sep 20, the Sep 20 options' last day. Times are hours of the clock: 9.5 is 9:30. */
const OPEN = 9.5;
const CLOSE = 16;
const STRIKE = 100;
const IV = modelVolatility("sep20", STRIKE);
const sep20 = (time: number, spot = STRIKE) =>
	priceOption({
		spot,
		strike: STRIKE,
		days: Math.max(CLOSE - time, 0) / 24,
		iv: IV,
		right: "call",
	});
/** The Oct 18 100 call a month out, for contrast. */
const oct18Delta = (spot: number) =>
	priceOption({ spot, strike: STRIKE, days: 32, iv: 0.35, right: "call" })
		.delta;
const clock = (time: number) => `${Math.floor(time)}:${time % 1 ? "30" : "00"}`;
const share = (dollars: number) => usd(Math.round(dollars * 100));
const fixed2 = (value: number) => value.toFixed(2);

// ——— Scene 1: value drains by the hour ———

type HourState = { stage: 0 | 1 | 2 | 3; time: number };

const AT_OPEN = sep20(OPEN).price;
const steps = Array.from(
	{ length: (CLOSE - OPEN) * 2 + 1 },
	(_, i) => OPEN + i / 2,
);
/** The first half-hour by which the call has lost half its opening value. */
const HALF_GONE =
	steps.find((time) => sep20(time).price <= AT_OPEN / 2) ?? CLOSE;

function HourView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: HourState;
	explore: HourState | null;
	setExplore: (next: HourState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const now = sep20(shown.time);
	const path = Array.from({ length: (CLOSE - OPEN) * 8 + 1 }, (_, i) => {
		const time = OPEN + i / 8;
		return [time, sep20(time).price] as const;
	});
	const lines: PayoffLine[] = [
		{
			id: "value",
			label: t(["call value, model", "看涨价值，模型"]),
			points: path,
			tone: "position",
			dashed: true,
		},
	];
	const markers: PayoffMarker[] = [
		{
			id: "now",
			x: shown.time,
			y: now.price,
			label: share(now.price),
			tone: shown.time === OPEN ? "neutral" : "loss",
		},
	];
	const result: ResultItem[] = [
		{
			id: "value",
			label: t([
				`Sep 20 100 call at ${clock(shown.time)}`,
				`9月20日 100 看涨，${clock(shown.time)}`,
			]),
			value: share(now.price),
			note: t(["ALFA $100, model", "ALFA $100，模型"]),
			evidence: "modeled",
		},
		{
			id: "lost",
			label: t(["Lost since 9:30", "9:30 以来损失"]),
			value: share(now.price - AT_OPEN),
			note: t([
				`${Math.round(((AT_OPEN - now.price) / AT_OPEN) * 100)}% of its opening value`,
				`开盘价值的 ${Math.round(((AT_OPEN - now.price) / AT_OPEN) * 100)}%`,
			]),
			tone: "loss",
			evidence: "modeled",
		},
	];
	if (shown.time < CLOSE)
		result.push({
			id: "theta",
			label: t(["Decay this hour", "这一小时的损耗"]),
			value: share(
				-(
					sep20(shown.time).price - sep20(Math.min(shown.time + 1, CLOSE)).price
				),
			),
			note: t(["if ALFA stays at $100", "若 ALFA 保持 $100"]),
			evidence: "modeled",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The Sep 20 100 call's model value through its last trading day, with ALFA held at $100",
						"ALFA 保持 $100 时，9月20日 100 看涨在最后一个交易日内的模型价值",
					])}
					height={(width) => (width < 520 ? 250 : 280)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 250 : 280}
							xRange={[OPEN, CLOSE]}
							yRange={[0, 0.42]}
							xTicks={
								width < 520 ? [10, 12, 14, 16] : [10, 11, 12, 13, 14, 15, 16]
							}
							yTicks={[0, 0.1, 0.2, 0.3, 0.4]}
							lines={lines}
							markers={markers}
							formatX={clock}
							formatY={(value) => share(value)}
							xLabel={t([
								"Fri Sep 20 · ALFA held at $100",
								"9月20日 周五 · ALFA 保持 $100",
							])}
							title={t([
								"ALFA Sep 20 100 call · expires today · per share",
								"ALFA 9月20日 100 看涨 · 今天到期 · 每股",
							])}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<RangeControl
						label={t(["Time of day", "时间"])}
						value={explore.time}
						display={clock(explore.time)}
						min={OPEN}
						max={CLOSE}
						step={0.5}
						onChange={(time) => setExplore({ ...explore, time })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"An option's time value shrinks with the square root of the time left, so the same hour costs more the closer it is to expiry. A month out, the Oct 18 100 call loses about $0.07 a day; on its last day the Sep 20 100 call loses more than that every hour of the afternoon. 0DTE options (zero days to expiry) are cheap because so little time is left, and that is also why their value can vanish in a few hours if the stock sits still.",
						"期权的时间价值随剩余时间的平方根收缩，所以越接近到期，同样一小时的代价越大。一个月后到期的 10月18日 100 看涨每天约损失 $0.07；而在最后一天，9月20日 100 看涨在下午每个小时损失的都比这还多。0DTE 期权（零天到期）之所以便宜，是因为剩下的时间太少；也正因为如此，只要股价不动，它们的价值几个小时内就可能消失。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: delta swings on small moves ———

type SwingState = { stage: 0 | 1 | 2; time: number };

const LOW = 99.8;
const HIGH = 100.2;
const swingAt = (time: number) =>
	sep20(time, HIGH).delta - sep20(time, LOW).delta;
/** The latest half-hour at which a 40-cent move still shifts delta by less than 0.3. */
const LATEST_CALM =
	[...steps]
		.filter((time) => time < CLOSE)
		.reverse()
		.find((time) => swingAt(time) < 0.3) ?? OPEN;
const HEDGE_CONTRACTS = 1_000;

function SwingView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SwingState;
	explore: SwingState | null;
	setExplore: (next: SwingState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const range = [98.5, 101.5] as const;
	const xs = Array.from({ length: 61 }, (_, i) => range[0] + i * 0.05);
	const lines: PayoffLine[] = [
		{
			id: "oct18",
			label: t(["Oct 18, 32 days", "10月18日，32 天"]),
			shortLabel: t(["Oct 18", "10月18日"]),
			points: xs.map((spot) => [spot, oct18Delta(spot)] as const),
			tone: "reference",
			dashed: true,
		},
	];
	if (shown.stage >= 1)
		lines.push({
			id: "sep20",
			label: t([
				`Sep 20 at ${clock(shown.time)}`,
				`9月20日 ${clock(shown.time)}`,
			]),
			shortLabel: t(["Sep 20", "9月20日"]),
			points: xs.map((spot) => [spot, sep20(shown.time, spot).delta] as const),
			tone: "position",
			dashed: true,
		});
	const low = shown.stage >= 1 ? sep20(shown.time, LOW).delta : oct18Delta(LOW);
	const high =
		shown.stage >= 1 ? sep20(shown.time, HIGH).delta : oct18Delta(HIGH);
	const markers: PayoffMarker[] = [
		{ id: "low", x: LOW, y: low, label: fixed2(low), labelBelow: true },
		{ id: "high", x: HIGH, y: high, label: fixed2(high) },
	];
	const result: ResultItem[] = [
		{
			id: "swing",
			label:
				shown.stage >= 1
					? t([
							`Sep 20 delta, ${clock(shown.time)}`,
							`9月20日 Delta，${clock(shown.time)}`,
						])
					: t(["Oct 18 delta", "10月18日 Delta"]),
			value: `${fixed2(low)} → ${fixed2(high)}`,
			note: t(["ALFA $99.80 → $100.20", "ALFA $99.80 → $100.20"]),
			evidence: "modeled",
		},
	];
	if (shown.stage >= 2)
		result.push({
			id: "hedge",
			label: t([
				`Hedge for ${count(HEDGE_CONTRACTS)} short calls`,
				`${count(HEDGE_CONTRACTS)} 张看涨空头的对冲`,
			]),
			value: t([
				`buy about ${count(Math.round(((high - low) * 100 * HEDGE_CONTRACTS) / 1_000) * 1_000)} shares`,
				`买入约 ${count(Math.round(((high - low) * 100 * HEDGE_CONTRACTS) / 1_000) * 1_000)} 股`,
			]),
			note: t(["over a 40-cent rise", "在 40 美分的上涨中"]),
			tone: "loss",
			evidence: "modeled",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Model delta of the Sep 20 100 call on its last day and of the Oct 18 100 call, against ALFA's price",
						"9月20日 100 看涨在最后一天的模型 Delta，与 10月18日 100 看涨的模型 Delta，随 ALFA 价格的变化",
					])}
					height={(width) => (width < 520 ? 250 : 280)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 250 : 280}
							xRange={range}
							yRange={[0, 1]}
							xTicks={[99, 100, 101]}
							yTicks={[0, 0.5, 1]}
							lines={lines}
							markers={markers}
							formatY={(value) => value.toFixed(1)}
							xLabel={t(["ALFA price", "ALFA 价格"])}
							title={t([
								"100 calls · delta · model",
								"100 看涨 · Delta · 模型",
							])}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<RangeControl
						label={t(["Time on Sep 20", "9月20日 时间"])}
						value={explore.time}
						display={clock(explore.time)}
						min={OPEN}
						max={CLOSE - 0.5}
						step={0.5}
						onChange={(time) => setExplore({ ...explore, time })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Gamma, how fast delta changes, piles up at the strike as expiry nears. With an hour left, the Sep 20 100 call is close to a bet on which side of $100 ALFA finishes, so its delta jumps between near 0 and near 1 across a few cents. Anyone hedging a large 0DTE position near its strike has to trade a lot of stock on small moves. That is a statement about the hedge a position requires, not proof that dealers hold it or that the stock will move.",
						"Gamma（Delta 变化的速度）会随到期临近而在行权价附近堆积。还剩一小时时，9月20日 100 看涨几乎就是押注 ALFA 收在 $100 的哪一边，所以它的 Delta 在几美分之内就会在接近 0 和接近 1 之间跳动。任何人在行权价附近对冲大笔 0DTE 持仓，都要在小幅变动中交易大量股票。这说的是一个持仓需要怎样的对冲，并不能证明做市商持有它，也不能证明股价会动。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: same-day flow never reaches open interest ———

type DayState = { stage: 0 | 1 | 2; holder: "closed" | "held" };

const THURSDAY_OI = 3_400;
const FRIDAY_VOLUME = 12_000;
const FRIDAY_CLOSE = 100.6;

function DayView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: DayState;
	explore: DayState | null;
	setExplore: (next: DayState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const bars = [
		{
			id: "thu",
			label: t(["Thu close OI", "周四收盘未平仓"]),
			value: THURSDAY_OI,
		},
		{
			id: "fri",
			label: t(["Fri volume", "周五成交量"]),
			value: FRIDAY_VOLUME,
			hidden: shown.stage < 1,
		},
		{
			id: "mon",
			label: t(["Mon OI", "周一未平仓"]),
			value: 0,
			hidden: shown.stage < 2,
		},
	];
	const result: ResultItem[] = [
		{
			id: "thu",
			label: t(["Open interest, Thu close", "周四收盘未平仓量"]),
			value: count(THURSDAY_OI),
			note: t(["reported Friday morning", "周五早上公布"]),
		},
	];
	if (shown.stage >= 1)
		result.push({
			id: "fri",
			label: t(["Traded Friday", "周五成交"]),
			value: count(FRIDAY_VOLUME),
			note: t(["opened and closed the same day", "当天开仓、当天平仓"]),
		});
	if (shown.stage >= 2)
		result.push({
			id: "mon",
			label: t(["Sep 20 OI on Monday", "周一的 9月20日 未平仓量"]),
			value: t(["none: expired", "无：已到期"]),
			note:
				shown.holder === "held"
					? t([
							`held to the close at $${FRIDAY_CLOSE.toFixed(2)}: 100 shares a contract`,
							`持有到收盘 $${FRIDAY_CLOSE.toFixed(2)}：每张变成 100 股`,
						])
					: t([
							"closed before the bell: nothing left",
							"收盘前平仓：什么都不剩",
						]),
			tone: "loss",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The Sep 20 100 call's open interest before its last day, the volume on that day, and its open interest after",
						"9月20日 100 看涨在最后一天之前的未平仓量、当天的成交量，以及之后的未平仓量",
					])}
					height={() => 220}
				>
					{(width) => (
						<BarChart
							width={width}
							height={220}
							bars={bars}
							max={13_000}
							format={(value) => count(value)}
							title={t([
								"ALFA Sep 20 100 call · contracts",
								"ALFA 9月20日 100 看涨 · 张",
							])}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Friday's buyers", "周五的买方"])}
						value={explore.holder}
						options={[
							["closed", t(["Closed by 4 pm", "4 点前平仓"])],
							["held", t(["Held to the close", "持有到收盘"])],
						]}
						onChange={(holder) => setExplore({ ...explore, holder })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Open interest is counted once a day, overnight. A contract opened and closed on the same day adds to volume but never to open interest, and an expiring series has no next-day count at all: whatever is still open at the close is exercised, assigned or worthless. So 0DTE volume can be huge while open interest says nothing about it, and a volume-to-open-interest ratio for an expiring contract describes the day's trading, not lasting positions.",
						"未平仓量每天在夜间统计一次。同一天开仓又平仓的合约会计入成交量，却永远不会计入未平仓量；而到期的系列根本没有第二天的统计：收盘时仍未平仓的合约，要么被行权、被指派，要么作废。所以 0DTE 的成交量可能很大，而未平仓量对此毫无反映；到期合约的成交量与未平仓量之比，描述的是当天的交易，而不是持续的持仓。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<HourState, HourState>({
		id: "hours",
		label: ["By the hour", "按小时"],
		title: [
			"On its last day, an option's value drains by the hour",
			"在最后一天，期权的价值按小时流失",
		],
		predict: {
			prompt: [
				"At 9:30 on its last day, with ALFA at $100, the Sep 20 100 call is worth $0.36. If ALFA is still $100 at the 4:00 pm close, what is the call worth then?",
				"在最后一天的 9:30，ALFA 为 $100，9月20日 100 看涨值 $0.36。如果下午 4:00 收盘时 ALFA 仍是 $100，这张看涨值多少？",
			],
			choices: [
				{ id: "zero", label: ["$0: no time is left", "$0：没有时间了"] },
				{ id: "half", label: ["About $0.18: half", "约 $0.18：一半"] },
				{ id: "same", label: ["$0.36: nothing moved", "$0.36：什么都没动"] },
			],
			answer: "zero",
			entry: { answer: 0, prefix: "$" },
			revealAt: 3,
			explain: [
				"At the close, the right to buy at $100 a stock that's worth $100 is worth nothing. All $0.36 was time value, and it runs out at 4:00 pm.",
				"收盘时，以 $100 买入一只价值 $100 的股票的权利一文不值。$0.36 全是时间价值，到下午 4:00 就耗尽了。",
			],
		},
		beats: [
			{
				id: "open",
				label: ["9:30", "9:30"],
				caption: [
					"Fri Sep 20, 9:30: ALFA is $100 and the Sep 20 100 call, expiring today, is worth $0.36, all of it time value.",
					"9月20日 周五 9:30：ALFA 为 $100，今天到期的 9月20日 100 看涨值 $0.36，全是时间价值。",
				],
				state: { stage: 0, time: OPEN },
			},
			{
				id: "noon",
				label: ["12:30", "12:30"],
				caption: [
					"By 12:30, with ALFA unchanged, it's worth $0.26: three hours took $0.10.",
					"到 12:30，ALFA 不变，它值 $0.26：三个小时拿走了 $0.10。",
				],
				state: { stage: 1, time: 12.5 },
			},
			{
				id: "three",
				label: ["15:00", "15:00"],
				caption: [
					"At 3:00 pm it's $0.14. The decay speeds up as the time left shrinks.",
					"下午 3:00 只剩 $0.14。剩余时间越少，损耗越快。",
				],
				state: { stage: 2, time: 15 },
			},
			{
				id: "close",
				label: ["16:00", "16:00"],
				caption: [
					"At the 4:00 pm close it's $0. The last hour took $0.14, more than the first three hours together.",
					"下午 4:00 收盘时为 $0。最后一个小时拿走了 $0.14，比前三个小时加起来还多。",
				],
				state: { stage: 3, time: CLOSE },
			},
		],
		explore: {
			prompt: [
				"Move through the day and watch the call's value and its hourly decay.",
				"在一天中移动，观察看涨的价值和每小时的损耗。",
			],
			start: () => ({ stage: 3, time: OPEN }),
			task: {
				kind: "reach",
				prompt: [
					"Find the first half-hour by which the call has lost half its 9:30 value.",
					"找出看涨损失一半 9:30 价值的第一个半小时整点。",
				],
				reached: (e) => e.time === HALF_GONE,
				done: [
					"By 14:30 it's $0.17, under half of $0.36: half the value goes in the first five hours, the other half in the last ninety minutes.",
					"到 14:30 它值 $0.17，不到 $0.36 的一半：前五个小时流失了一半价值，另一半在最后九十分钟流失。",
				],
			},
		},
		View: HourView,
	}),
	defineScene<SwingState, SwingState>({
		id: "delta-swing",
		label: ["Delta swings", "Delta 摆动"],
		title: [
			"Near the strike, a same-day option's delta swings on cents",
			"在行权价附近，当天到期期权的 Delta 随几美分摆动",
		],
		predict: {
			prompt: [
				"With an hour left, ALFA moves from $99.80 to $100.20. What happens to the Sep 20 100 call's delta?",
				"还剩一小时时，ALFA 从 $99.80 涨到 $100.20。9月20日 100 看涨的 Delta 会怎样？",
			],
			choices: [
				{
					id: "jump",
					label: [
						"It jumps, from about 0.29 to 0.72",
						"跳升，从约 0.29 到 0.72",
					],
				},
				{
					id: "flat",
					label: [
						"It barely moves, like a month-out option",
						"几乎不动，就像一个月后到期的期权",
					],
				},
				{ id: "one", label: ["It goes straight to 1", "直接变成 1"] },
			],
			answer: "jump",
			revealAt: 1,
			explain: [
				"With an hour left the call is close to a bet on which side of $100 ALFA finishes, so 40 cents moves its delta from 0.29 to 0.72. The Oct 18 100 call only goes from 0.51 to 0.53.",
				"还剩一小时时，这张看涨几乎就是押注 ALFA 收在 $100 的哪一边，所以 40 美分就让它的 Delta 从 0.29 变到 0.72。10月18日 100 看涨只从 0.51 变到 0.53。",
			],
		},
		beats: [
			{
				id: "month",
				label: ["A month out", "一个月后到期"],
				caption: [
					"The Oct 18 100 call, 32 days out: from ALFA $99.80 to $100.20 its delta barely moves, 0.51 to 0.53.",
					"32 天后到期的 10月18日 100 看涨：ALFA 从 $99.80 到 $100.20，它的 Delta 几乎不动，0.51 到 0.53。",
				],
				state: { stage: 0, time: 15 },
			},
			{
				id: "hour",
				label: ["An hour left", "还剩一小时"],
				caption: [
					"The Sep 20 100 call at 3:00 pm on its last day: the same 40 cents moves its delta from 0.29 to 0.72.",
					"9月20日 100 看涨在最后一天的下午 3:00：同样的 40 美分让它的 Delta 从 0.29 变到 0.72。",
				],
				state: { stage: 1, time: 15 },
			},
			{
				id: "hedge",
				label: ["The hedge", "对冲"],
				caption: [
					"Someone short 1,000 of these calls and hedging them would have to buy about 43,000 ALFA shares as it rises those 40 cents.",
					"如果有人做空 1,000 张这种看涨并进行对冲，ALFA 上涨这 40 美分时，他要买入约 43,000 股。",
				],
				state: { stage: 2, time: 15 },
			},
		],
		explore: {
			prompt: [
				"Move through Sep 20 and watch the same 40-cent move change delta.",
				"在 9月20日 这一天中移动，观察同样 40 美分的变动如何改变 Delta。",
			],
			start: () => ({ stage: 2, time: OPEN }),
			task: {
				kind: "reach",
				prompt: [
					"Find the latest half-hour at which the 40-cent move still shifts delta by less than 0.30.",
					"找出 40 美分的变动仍让 Delta 变化不到 0.30 的最晚半小时整点。",
				],
				reached: (e) => e.time === LATEST_CALM,
				done: [
					"Up to 13:30 the same 40 cents moves delta by less than 0.30; from 14:00 on it's more, and in the last half hour about 0.58. Gamma at the strike grows as the time left shrinks.",
					"到 13:30 为止，同样的 40 美分让 Delta 变化不到 0.30；从 14:00 起就超过了，最后半小时约为 0.58。剩余时间越短，行权价附近的 Gamma 越大。",
				],
			},
		},
		View: SwingView,
	}),
	defineScene<DayState, DayState>({
		id: "open-interest",
		label: ["Volume vs OI", "成交量与未平仓量"],
		title: [
			"Same-day flow never reaches open interest",
			"当天的成交流永远进不了未平仓量",
		],
		predict: {
			prompt: [
				"On Friday Sep 20, 12,000 Sep 20 100 calls trade, all opened that morning. How much do they add to Monday's open interest?",
				"9月20日 周五，9月20日 100 看涨成交了 12,000 张，全部是当天上午开的仓。它们会给周一的未平仓量增加多少？",
			],
			choices: [
				{
					id: "zero",
					label: ["0: the series expired Friday", "0：这个系列周五就到期了"],
				},
				{ id: "all", label: ["12,000", "12,000"] },
				{
					id: "sum",
					label: ["15,400, with Thursday's 3,400", "15,400，加上周四的 3,400"],
				},
			],
			answer: "zero",
			entry: { answer: 0, unit: [" contracts", " 张"] },
			revealAt: 2,
			explain: [
				"Open interest is counted overnight, and by Monday the Sep 20 series no longer exists: anything still open at Friday's close was exercised, assigned or expired. Those 12,000 contracts show up in Friday's volume and nowhere in open interest.",
				"未平仓量在夜间统计，而到了周一，9月20日 系列已经不存在了：周五收盘时仍未平仓的合约，要么被行权、被指派，要么作废。这 12,000 张只出现在周五的成交量里，不会出现在任何未平仓量中。",
			],
		},
		beats: [
			{
				id: "thursday",
				label: ["Thursday", "周四"],
				caption: [
					"Thursday's close leaves 3,400 Sep 20 100 calls open. That count, reported Friday morning, stays the same all day.",
					"周四收盘时，9月20日 100 看涨有 3,400 张未平仓。这个数在周五早上公布，一整天都不会变。",
				],
				state: { stage: 0, holder: "closed" },
			},
			{
				id: "friday",
				label: ["Friday", "周五"],
				caption: [
					"Friday, its last day, 12,000 trade, most opened and closed within hours. Volume counts every one of them.",
					"周五是它的最后一天，成交了 12,000 张，大多在几个小时内开仓又平仓。成交量把每一张都算进去了。",
				],
				state: { stage: 1, holder: "closed" },
			},
			{
				id: "monday",
				label: ["Monday", "周一"],
				caption: [
					"At 4:00 pm the series expires. On Monday there is no Sep 20 open interest at all: Friday's flow never shows up in it.",
					"下午 4:00 这个系列到期。到了周一，9月20日 根本没有未平仓量：周五的成交流永远不会出现在其中。",
				],
				state: { stage: 2, holder: "closed" },
			},
		],
		explore: {
			prompt: [
				"Choose what Friday's buyers did, and see what's left on Monday.",
				"选择周五的买方做了什么，看看周一还剩下什么。",
			],
			start: () => ({ stage: 2, holder: "held" }),
			task: {
				kind: "answer",
				prompt: [
					"A buyer holds 10 of these calls through the close, with ALFA at $100.60. What do they have on Monday?",
					"一位买方持有 10 张这种看涨直到收盘，ALFA 为 $100.60。周一他手上有什么？",
				],
				choices: [
					{
						id: "shares",
						label: [
							"1,000 ALFA shares, bought at $100",
							"1,000 股 ALFA，以 $100 买入",
						],
					},
					{
						id: "calls",
						label: [
							"10 calls, in Monday's open interest",
							"10 张看涨，计入周一的未平仓量",
						],
					},
					{ id: "cash", label: ["$600 in cash", "$600 现金"] },
				],
				answer: "shares",
				done: [
					"60 cents in the money at the close, the calls are exercised automatically: 10 × 100 = 1,000 shares bought at $100, worth $100,600. The position moved from options into stock, and open interest never counted it.",
					"收盘时实值 60 美分，这些看涨会被自动行权：10 × 100 = 1,000 股，以 $100 买入，价值 $100,600。持仓从期权变成了股票，而未平仓量从未统计过它。",
				],
			},
		},
		View: DayView,
	}),
] as const;

export function ZeroDteWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="zero-dte"
			label={["Interactive lesson on 0DTE options", "0DTE 期权互动课"]}
			scenes={scenes}
		/>
	);
}
