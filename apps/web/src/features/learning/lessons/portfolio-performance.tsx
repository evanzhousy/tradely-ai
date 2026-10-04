import { type Copy, pick, usd, yourAccount } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import { type Bar, BarChart } from "../walkthrough/instruments/bar-chart";
import {
	type PayoffBand,
	PayoffChart,
	type PayoffLine,
	type PayoffMarker,
} from "../walkthrough/instruments/payoff-chart";
import { Player } from "../walkthrough/player";
import { Stage } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame } from "../walkthrough/walkthrough";
import { portfolioPerformanceFilm } from "./portfolio-performance-film";
import {
	AFTER_DEPOSIT,
	CLOSE,
	deep,
	dollars,
	GROSS_LOSS,
	GROSS_WIN,
	GROWTH,
	LOSSES,
	MONTHS,
	maxDrawdown,
	OPEN,
	PROFIT_FACTOR,
	pct,
	R1,
	R2,
	SALE_REALIZED,
	signed,
	steady,
	TOTAL,
	TWR,
	trades,
	WEEK_END,
	WIN_RATE,
	WINS,
} from "./portfolio-performance-model";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

// ——— Scene 1: flows and returns ———

type FlowState = { stage: 0 | 1 | 2 };

const DAY_LABELS: readonly Copy[] = [
	["open", "开盘"],
	["close", "收盘"],
	["deposit", "存入"],
	["Fri", "周五"],
];

function FlowView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: FlowState;
	explore: FlowState | null;
	setExplore: (next: FlowState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const lines: PayoffLine[] = [
		{
			id: "value",
			label: "",
			points: [
				[0, OPEN / 100],
				[1, CLOSE / 100],
				[2, CLOSE / 100],
				[2, AFTER_DEPOSIT / 100],
				[3, WEEK_END / 100],
			],
			tone: "position",
		},
	];
	const markers: PayoffMarker[] = [
		{ id: "open", x: 0, y: OPEN / 100 },
		{ id: "end", x: 3, y: WEEK_END / 100 },
	];
	const bands: PayoffBand[] =
		shown.stage >= 2
			? [
					{ id: "r1", from: 0, to: 1, label: pct(R1), tone: "gain" },
					{ id: "r2", from: 2, to: 3, label: pct(R2), tone: "gain" },
				]
			: [];
	const result: ResultItem[] = [
		{
			id: "deposit",
			label: t(["Deposit, Tuesday", "周二存入"]),
			value: dollars(yourAccount.deposit),
			note: t(["your money, not a return", "你自己的钱，不是收益"]),
			evidence: "observed",
		},
	];
	if (shown.stage >= 1)
		result.push({
			id: "growth",
			label: t(["Balance growth", "余额增长"]),
			value: pct(GROWTH, 1),
			note: t([
				`${dollars(OPEN)} → ${dollars(WEEK_END)}`,
				`${dollars(OPEN)} → ${dollars(WEEK_END)}`,
			]),
			tone: "loss",
			evidence: "calculated",
		});
	if (shown.stage >= 2)
		result.push({
			id: "twr",
			label: t(["Time-weighted return", "时间加权收益"]),
			value: pct(TWR),
			note: t([
				`${(1 + R1).toFixed(4)} × ${(1 + R2).toFixed(4)} − 1`,
				`${(1 + R1).toFixed(4)} × ${(1 + R2).toFixed(4)} − 1`,
			]),
			tone: "gain",
			evidence: "calculated",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Your account value from Monday's open to Friday's close, with a jump at Tuesday's deposit and each period's return marked",
						"你的账户价值从周一开盘到周五收盘的变化，周二存入处有一次跳升，并标出每段的收益",
					])}
					height={(width) => (width < 520 ? 250 : 280)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 250 : 280}
							xRange={[-0.2, 3.2]}
							yRange={[28_000, 38_000]}
							xTicks={[0, 1, 2, 3]}
							yTicks={[30_000, 34_000, 38_000]}
							lines={lines}
							markers={markers}
							bands={bands}
							formatX={(day) => t(DAY_LABELS[Math.round(day)] ?? ["", ""])}
							formatY={(value) => usd(value * 100, 0)}
							xLabel={t(["Sep 16 to Sep 20", "9月16日 至 9月20日"])}
							title={t(["Your account · value", "你的账户 · 价值"])}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Show", "显示"])}
						value={String(explore.stage) as "0" | "1" | "2"}
						options={[
							["0", t(["Values", "数值"])],
							["1", t(["+ Growth", "+ 增长"])],
							["2", t(["+ Return", "+ 收益"])],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as FlowState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"An account's value moves with deposits and withdrawals as well as with returns. A time-weighted return cuts the history at each external cash flow, measures each piece from the value right after the flow, and chains them. It answers how the investments did, whatever you added or took out. Compare it with a benchmark only over the same dates, with the same fees and dividend treatment.",
						"账户价值会随存取款变化，也会随收益变化。时间加权收益在每一笔外部资金流处把历史切开，每一段都从资金流之后的价值开始计算，再把各段连乘。它回答的是投资本身表现如何，与你存入或取出了多少无关。与基准比较时，必须用相同的日期、相同的费用和股息处理方式。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: many wins can still lose ———

type TradeState = { stage: 0 | 1 | 2 };

function TradeView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: TradeState;
	explore: TradeState | null;
	setExplore: (next: TradeState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const bars: Bar[] = trades.map((trade) => ({
		id: trade.id,
		label: t(trade.label),
		value: Math.abs(trade.pnl) / 100,
	}));
	const result: ResultItem[] = [
		{
			id: "count",
			label: t(["Closed trades", "已平仓交易"]),
			value: String(trades.length),
			evidence: "observed",
		},
	];
	if (shown.stage >= 1)
		result.push({
			id: "rate",
			label: t(["Win rate", "胜率"]),
			value: `${Math.round(WIN_RATE * 100)}%`,
			note: t([
				`${WINS.length} of ${trades.length} made money`,
				`${trades.length} 笔中 ${WINS.length} 笔盈利`,
			]),
			evidence: "calculated",
		});
	if (shown.stage >= 2)
		result.push(
			{
				id: "total",
				label: t(["Total", "合计"]),
				value: signed(TOTAL),
				note: t([
					`${signed(GROSS_WIN)} won, ${signed(-GROSS_LOSS)} lost`,
					`盈利 ${signed(GROSS_WIN)}，亏损 ${signed(-GROSS_LOSS)}`,
				]),
				tone: "loss",
				evidence: "calculated",
			},
			{
				id: "factor",
				label: t(["Profit factor", "盈利因子"]),
				value: PROFIT_FACTOR.toFixed(2),
				note: t(["gross wins ÷ gross losses", "总盈利 ÷ 总亏损"]),
				tone: "loss",
				evidence: "calculated",
			},
		);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Your last five closed trades as bars sized by profit or loss, with the one loss highlighted",
						"你最近五笔已平仓交易，按盈亏大小画成柱，其中一笔亏损被突出显示",
					])}
					height={240}
				>
					{(width) => (
						<BarChart
							width={width}
							height={240}
							bars={bars}
							max={800}
							format={(value) => usd(value * 100, 0)}
							focus={shown.stage >= 1 ? LOSSES[0]?.id : undefined}
							title={
								shown.stage >= 1
									? t([
											"Your last five closed trades · size of P&L · highlighted: the loss",
											"你最近五笔已平仓交易 · 盈亏大小 · 突出：亏损",
										])
									: t([
											"Your last five closed trades · size of P&L",
											"你最近五笔已平仓交易 · 盈亏大小",
										])
							}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Show", "显示"])}
						value={String(explore.stage) as "0" | "1" | "2"}
						options={[
							["0", t(["Trades", "交易"])],
							["1", t(["+ Win rate", "+ 胜率"])],
							["2", t(["+ Totals", "+ 合计"])],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as TradeState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Win rate counts how many closed trades made money, not how much. Average win, average loss, total P&L and profit factor, gross wins divided by gross losses, each describe a different part of the same list. A high win rate with one large loss can still lose money, and the lot rule used to close trades can change which trades count as wins.",
						"胜率统计有多少笔已平仓交易赚钱，而不是赚了多少。平均盈利、平均亏损、总盈亏和盈利因子（总盈利除以总亏损）各自描述同一份清单的不同方面。胜率很高，但有一笔大亏，仍可能整体亏钱；平仓所用的批次规则也会改变哪些交易算作盈利。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: the worst fall ———

type DrawdownState = { stage: 0 | 1 | 2 };

function DrawdownView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: DrawdownState;
	explore: DrawdownState | null;
	setExplore: (next: DrawdownState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const lines: PayoffLine[] = [
		{
			id: "steady",
			label: t(["account A", "账户 A"]),
			points: steady.map((value, i) => [i, value] as const),
			tone: "position",
		},
	];
	if (shown.stage >= 1)
		lines.push({
			id: "deep",
			label: t(["account B", "账户 B"]),
			points: deep.map((value, i) => [i, value] as const),
			tone: "short",
		});
	const worst = maxDrawdown(deep);
	const markers: PayoffMarker[] =
		shown.stage >= 2
			? [
					{ id: "peak", x: worst.peakAt, y: deep[worst.peakAt] },
					{
						id: "trough",
						x: worst.troughAt,
						y: deep[worst.troughAt],
						label: pct(worst.fall, 0),
						tone: "loss",
					},
				]
			: [];
	const bands: PayoffBand[] =
		shown.stage >= 2
			? [{ id: "fall", from: worst.peakAt, to: worst.troughAt, tone: "loss" }]
			: [];
	const total = (values: readonly number[]) =>
		values[values.length - 1] / values[0] - 1;
	const result: ResultItem[] = [
		{
			id: "a",
			label: t(["Account A", "账户 A"]),
			value: pct(total(steady), 0),
			note:
				shown.stage >= 2
					? t([
							`worst fall ${pct(maxDrawdown(steady).fall, 1)}`,
							`最大跌幅 ${pct(maxDrawdown(steady).fall, 1)}`,
						])
					: t(["Jan to Aug", "1月至8月"]),
			evidence: "calculated",
		},
	];
	if (shown.stage >= 1)
		result.push({
			id: "b",
			label: t(["Account B", "账户 B"]),
			value: pct(total(deep), 0),
			note:
				shown.stage >= 2
					? t([
							`worst fall ${pct(worst.fall, 0)}`,
							`最大跌幅 ${pct(worst.fall, 0)}`,
						])
					: t(["Jan to Aug", "1月至8月"]),
			tone: shown.stage >= 2 ? "loss" : undefined,
			evidence: "calculated",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Two accounts' month-end values from January to August, both up 10%, one steady and one with a deep fall from its peak",
						"两个账户 1 月到 8 月的月末价值，都上涨 10%，一个平稳，一个从高点深度下跌",
					])}
					height={(width) => (width < 520 ? 250 : 280)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 250 : 280}
							xRange={[0, 7]}
							yRange={[22_000, 35_000]}
							xTicks={[0, 1, 2, 3, 4, 5, 6, 7]}
							yTicks={[24_000, 28_000, 32_000]}
							lines={lines}
							markers={markers}
							bands={bands}
							formatX={(i) => t(MONTHS[Math.round(i)] ?? ["", ""])}
							formatY={(value) => `$${Math.round(value / 1000)}k`}
							xLabel={t(["month-end values", "月末价值"])}
							title={t(["Two accounts · Jan to Aug", "两个账户 · 1月至8月"])}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Show", "显示"])}
						value={String(explore.stage) as "0" | "1" | "2"}
						options={[
							["0", "A"],
							["1", "+ B"],
							["2", t(["+ Worst fall", "+ 最大跌幅"])],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as DrawdownState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Maximum drawdown is the largest fall from a running peak to a later low, before a new peak. Two histories with the same start and end can carry very different drawdowns, and month-end values can hide falls within the month. It measures the path you'd have lived through, not the return you ended with.",
						"最大回撤是从一个阶段高点到之后低点的最大跌幅，在创出新高之前计算。起点和终点相同的两段历史，回撤可能大不相同；月末数值还可能掩盖月内的下跌。它衡量的是你经历过的路径，而不是最终得到的收益。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const deepWorst = maxDrawdown(deep);

const scenes = [
	defineScene<FlowState, FlowState>({
		id: "flows",
		label: ["Separate flows and returns", "区分资金流与收益"],
		title: [
			"Balance growth is not time-weighted return",
			"余额增长不是时间加权收益",
		],
		predict: {
			prompt: [
				`Your account went from ${dollars(OPEN)} to ${dollars(WEEK_END)} by Friday, including a ${dollars(yourAccount.deposit)} deposit. What's the time-weighted return?`,
				`到周五，你的账户从 ${dollars(OPEN)} 变为 ${dollars(WEEK_END)}，其中包括 ${dollars(yourAccount.deposit)} 的存入。时间加权收益是多少？`,
			],
			choices: [
				{ id: "twr", label: [`About ${pct(TWR, 1)}`, `约 ${pct(TWR, 1)}`] },
				{ id: "growth", label: [pct(GROWTH, 1), pct(GROWTH, 1)] },
				{
					id: "deposit",
					label: [
						`${pct(yourAccount.deposit / OPEN, 1)}: the deposit`,
						`${pct(yourAccount.deposit / OPEN, 1)}：存入部分`,
					],
				},
			],
			answer: "twr",
			entry: {
				answer: Math.round(TWR * 10_000) / 100,
				tolerance: 0.1,
				unit: ["%", "%"],
			},
			revealAt: 2,
			explain: [
				`Cut at the deposit: ${pct(R1)} before it, ${pct(R2)} after. Chained: ${(1 + R1).toFixed(4)} × ${(1 + R2).toFixed(4)} − 1 = ${pct(TWR)}. The ${pct(GROWTH, 1)} balance growth includes your own ${dollars(yourAccount.deposit)}.`,
				`在存入处切开：之前 ${pct(R1)}，之后 ${pct(R2)}。连乘：${(1 + R1).toFixed(4)} × ${(1 + R2).toFixed(4)} − 1 = ${pct(TWR)}。${pct(GROWTH, 1)} 的余额增长包含了你自己的 ${dollars(yourAccount.deposit)}。`,
			],
		},
		beats: [
			{
				id: "values",
				label: ["Values", "数值"],
				caption: [
					`Your account: ${dollars(OPEN)} at Monday's open, ${dollars(CLOSE)} at the close, ${dollars(AFTER_DEPOSIT)} after Tuesday's deposit, ${dollars(WEEK_END)} at Friday's close.`,
					`你的账户：周一开盘 ${dollars(OPEN)}，收盘 ${dollars(CLOSE)}，周二存入后 ${dollars(AFTER_DEPOSIT)}，周五收盘 ${dollars(WEEK_END)}。`,
				],
				state: { stage: 0 },
			},
			{
				id: "growth",
				label: ["Balance growth", "余额增长"],
				caption: [
					`The balance grew ${pct(GROWTH, 1)}, but ${dollars(yourAccount.deposit)} of that is money you added.`,
					`余额增长了 ${pct(GROWTH, 1)}，但其中 ${dollars(yourAccount.deposit)} 是你自己加进去的钱。`,
				],
				state: { stage: 1 },
			},
			{
				id: "twr",
				label: ["Time-weighted", "时间加权"],
				caption: [
					`Cut at the deposit and chain the pieces: ${pct(R1)} then ${pct(R2)}, a time-weighted return of ${pct(TWR)}.`,
					`在存入处切开，再把各段连乘：先 ${pct(R1)}，再 ${pct(R2)}，时间加权收益 ${pct(TWR)}。`,
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: ["Step through the measures.", "逐步查看这些度量。"],
			start: () => ({ stage: 2 }),
			task: {
				kind: "answer",
				prompt: [
					"Why is balance growth so much bigger than the time-weighted return?",
					"为什么余额增长远大于时间加权收益？",
				],
				choices: [
					{
						id: "deposit",
						label: ["It counts your own deposit", "它把你自己的存款也算进去了"],
					},
					{
						id: "luck",
						label: ["The second half of the week was better", "后半周表现更好"],
					},
					{
						id: "fees",
						label: ["Fees are left out of the return", "收益里没算费用"],
					},
				],
				answer: "deposit",
				done: [
					`Balance growth includes the ${dollars(yourAccount.deposit)} you added. Cutting at the deposit and chaining the two periods measures only what the money earned: ${pct(TWR)}.`,
					`余额增长包含你存入的 ${dollars(yourAccount.deposit)}。在存款处切开、把两段收益连乘，衡量的才是资金本身赚到的：${pct(TWR)}。`,
				],
			},
		},
		View: FlowView,
	}),
	defineScene<TradeState, TradeState>({
		id: "trades",
		label: ["Inspect the payoff distribution", "检查盈亏分布"],
		title: ["Many wins can still lose money", "多次盈利仍可能亏钱"],
		predict: {
			prompt: [
				`${WINS.length} of your last ${trades.length} closed trades made money. Did the ${trades.length} make money together?`,
				`你最近 ${trades.length} 笔已平仓交易中有 ${WINS.length} 笔盈利。这 ${trades.length} 笔合起来赚钱了吗？`,
			],
			choices: [
				{
					id: "depends",
					label: [
						"Not necessarily: it depends on the sizes",
						"不一定：取决于各笔大小",
					],
				},
				{
					id: "yes",
					label: [
						`Yes: ${Math.round(WIN_RATE * 100)}% won`,
						`是：${Math.round(WIN_RATE * 100)}% 盈利`,
					],
				},
				{ id: "most", label: ["Yes, most of the time", "是，大多数情况下"] },
			],
			answer: "depends",
			revealAt: 2,
			explain: [
				`Four wins add ${signed(GROSS_WIN)}; one loss takes ${signed(-GROSS_LOSS)}. Together: ${signed(TOTAL)}, a profit factor of ${PROFIT_FACTOR.toFixed(2)}.`,
				`四笔盈利合计 ${signed(GROSS_WIN)}；一笔亏损 ${signed(-GROSS_LOSS)}。合起来：${signed(TOTAL)}，盈利因子 ${PROFIT_FACTOR.toFixed(2)}。`,
			],
		},
		beats: [
			{
				id: "trades",
				label: ["Trades", "交易"],
				caption: [
					`Your last ${trades.length} closed trades, including the ${signed(SALE_REALIZED)} from selling 6 calls on Monday.`,
					`你最近 ${trades.length} 笔已平仓交易，包括周一卖出 6 张看涨得到的 ${signed(SALE_REALIZED)}。`,
				],
				state: { stage: 0 },
			},
			{
				id: "rate",
				label: ["Win rate", "胜率"],
				caption: [
					`${WINS.length} of ${trades.length} made money: a ${Math.round(WIN_RATE * 100)}% win rate. The highlighted bar is the one that didn't.`,
					`${trades.length} 笔中 ${WINS.length} 笔赚钱：胜率 ${Math.round(WIN_RATE * 100)}%。突出显示的那根柱就是没赚钱的那笔。`,
				],
				state: { stage: 1 },
			},
			{
				id: "totals",
				label: ["Totals", "合计"],
				caption: [
					`That one loss, ${signed(-GROSS_LOSS)}, outweighs the four wins: ${signed(TOTAL)} in total, profit factor ${PROFIT_FACTOR.toFixed(2)}.`,
					`这一笔亏损 ${signed(-GROSS_LOSS)} 超过了四笔盈利：合计 ${signed(TOTAL)}，盈利因子 ${PROFIT_FACTOR.toFixed(2)}。`,
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: ["Step through the measures.", "逐步查看这些度量。"],
			start: () => ({ stage: 2 }),
			task: {
				kind: "answer",
				prompt: [
					"Which figure tells you whether the five trades made money together?",
					"哪个数字能说明这五笔交易合起来是否赚钱？",
				],
				choices: [
					{
						id: "factor",
						label: ["The total, or the profit factor", "合计，或盈利因子"],
					},
					{ id: "rate", label: ["The win rate", "胜率"] },
					{ id: "best", label: ["The largest win", "最大的一笔盈利"] },
				],
				answer: "factor",
				done: [
					"A win rate counts trades, not dollars. The total, or gross wins over gross losses, weighs each trade by its size, and one large loss outweighs four small wins.",
					"胜率数的是交易笔数，不是金额。合计，或总盈利除以总亏损，会按金额给每笔交易加权；一笔大亏可以超过四笔小赚。",
				],
			},
		},
		View: TradeView,
	}),
	defineScene<DrawdownState, DrawdownState>({
		id: "drawdown",
		label: ["Measure the worst fall", "衡量最大跌幅"],
		title: ["The same return can hide a deep fall", "相同收益可能掩盖深度下跌"],
		predict: {
			prompt: [
				"Accounts A and B both went from $30,000 in January to $33,000 in August. Did they carry the same risk?",
				"账户 A 和 B 都从 1 月的 $30,000 变为 8 月的 $33,000。它们承担的风险相同吗？",
			],
			choices: [
				{
					id: "no",
					label: ["Not necessarily: check the path", "不一定：要看路径"],
				},
				{ id: "yes", label: ["Yes: both made 10%", "是：都赚了 10%"] },
				{ id: "later", label: ["Only the later one", "只有后面的那个"] },
			],
			answer: "no",
			revealAt: 2,
			explain: [
				`B fell ${pct(deepWorst.fall, 0)} from its ${MONTHS[deepWorst.peakAt][0]} peak to its ${MONTHS[deepWorst.troughAt][0]} low before recovering; A's worst fall was ${pct(maxDrawdown(steady).fall, 1)}. Same return, very different ride.`,
				`B 从 ${MONTHS[deepWorst.peakAt][1]} 的高点跌到 ${MONTHS[deepWorst.troughAt][1]} 的低点，跌了 ${pct(deepWorst.fall, 0)}，之后才回升；A 的最大跌幅是 ${pct(maxDrawdown(steady).fall, 1)}。收益相同，经历大不相同。`,
			],
		},
		beats: [
			{
				id: "a",
				label: ["Account A", "账户 A"],
				caption: [
					"Account A climbs from $30,000 to $33,000 with small dips: +10%.",
					"账户 A 从 $30,000 升到 $33,000，只有小幅回落：+10%。",
				],
				state: { stage: 0 },
			},
			{
				id: "b",
				label: ["Account B", "账户 B"],
				caption: [
					"Account B starts and ends at the same values, also +10%.",
					"账户 B 的起点和终点相同，同样 +10%。",
				],
				state: { stage: 1 },
			},
			{
				id: "fall",
				label: ["Worst fall", "最大跌幅"],
				caption: [
					`But B fell ${pct(deepWorst.fall, 0)} from its peak on the way. Maximum drawdown shows what the return hides.`,
					`但 B 途中从高点跌了 ${pct(deepWorst.fall, 0)}。最大回撤显示了收益所掩盖的东西。`,
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: ["Step through the two paths.", "逐步查看两条路径。"],
			start: () => ({ stage: 2 }),
			task: {
				kind: "answer",
				prompt: [
					"Account B's worst fall ran from which month's peak to which month's low?",
					"账户 B 的最大跌幅是从哪个月的高点到哪个月的低点？",
				],
				choices: [
					{
						id: "worst",
						label: [
							`${MONTHS[deepWorst.peakAt][0]} → ${MONTHS[deepWorst.troughAt][0]}`,
							`${MONTHS[deepWorst.peakAt][1]} → ${MONTHS[deepWorst.troughAt][1]}`,
						],
					},
					{
						id: "start",
						label: [
							`${MONTHS[0][0]} → ${MONTHS[deepWorst.peakAt][0]}`,
							`${MONTHS[0][1]} → ${MONTHS[deepWorst.peakAt][1]}`,
						],
					},
					{
						id: "recovery",
						label: [
							`${MONTHS[deepWorst.troughAt][0]} → ${MONTHS[MONTHS.length - 1][0]}`,
							`${MONTHS[deepWorst.troughAt][1]} → ${MONTHS[MONTHS.length - 1][1]}`,
						],
					},
				],
				answer: "worst",
				done: [
					`B fell ${pct(deepWorst.fall, 0)} from its ${MONTHS[deepWorst.peakAt][0]} peak to its ${MONTHS[deepWorst.troughAt][0]} low before recovering. Both accounts ended up 10%; only the path shows the risk.`,
					`B 从 ${MONTHS[deepWorst.peakAt][1]} 的高点跌到 ${MONTHS[deepWorst.troughAt][1]} 的低点，跌幅 ${pct(deepWorst.fall, 0)}，之后才回升。两个账户最终都赚 10%；只有路径能显示风险。`,
				],
			},
		},
		View: DrawdownView,
	}),
] as const;

export function PortfolioPerformanceWalkthrough({
	locale,
}: {
	locale: Locale;
}) {
	return (
		<Player
			locale={locale}
			id="portfolio-performance"
			label={["Interactive lesson on performance measures", "绩效度量互动课"]}
			film={portfolioPerformanceFilm}
			scenes={scenes}
		/>
	);
}
