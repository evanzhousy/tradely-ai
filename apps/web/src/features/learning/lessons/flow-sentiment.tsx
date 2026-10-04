import { FieldGroup } from "@tradely/ui/components/field";
import * as m from "motion/react-m";
import {
	type Copy,
	count,
	holders,
	pick,
	signedUsd,
	type Trade,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import {
	CellGrid,
	cellGridLayout,
	type GridLine,
} from "../walkthrough/instruments/cell-grid";
import {
	type PayoffBand,
	PayoffChart,
	type PayoffLine,
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
import { flowSentimentFilm } from "./flow-sentiment-film";
import {
	type Action,
	type Context,
	FLOOR,
	type Flow,
	flowLabel,
	LABEL,
	PUT_95,
	PUT_ASK,
	PUT_BID,
	printFlow,
	putValue,
	RANGE,
	type Right,
	stock,
	TRADES,
} from "./flow-sentiment-model";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

const flowCopy: Record<Flow, Copy> = {
	bullish: ["bullish", "看涨"],
	bearish: ["bearish", "看跌"],
	neutral: ["neutral", "中性"],
};

// ——— Scene 1: four combinations ———

type MatrixState = { right: Right; action: Action };

function cellLines(right: Right, action: Action, locale: Locale): GridLine[] {
	const t = tr(locale);
	const flow = flowLabel(right, action);
	return [
		{
			text: t(flow === "bullish" ? ["Bullish", "看涨"] : ["Bearish", "看跌"]),
			tone: flow === "bullish" ? "gain" : "loss",
		},
		{
			text:
				flow === "bullish"
					? t(["ALFA ↑ helps", "ALFA ↑ 有利"])
					: t(["ALFA ↓ helps", "ALFA ↓ 有利"]),
			tone: "small",
		},
		{
			text: t(
				action === "buy"
					? right === "call"
						? ["leg: long call", "单腿：看涨多头"]
						: ["leg: long put", "单腿：看跌多头"]
					: right === "call"
						? ["leg: short call", "单腿：看涨空头"]
						: ["leg: short put", "单腿：看跌空头"],
			),
			tone: "small",
		},
	];
}

function MatrixView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: MatrixState;
	explore: MatrixState | null;
	setExplore: (next: MatrixState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const rights: Right[] = ["call", "put"];
	const actions: Action[] = ["buy", "sell"];
	const flow = flowLabel(shown.right, shown.action);
	const example: Copy =
		shown.right === "call"
			? shown.action === "buy"
				? ["Oct 18 100 calls taken at the ask", "10月18日 100 看涨在卖价被买走"]
				: ["Oct 18 100 calls hit at the bid", "10月18日 100 看涨在买价被卖出"]
			: shown.action === "buy"
				? ["Oct 18 95 puts taken at the ask", "10月18日 95 看跌在卖价被买走"]
				: ["Oct 18 95 puts hit at the bid", "10月18日 95 看跌在买价被卖出"];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Call or put against the likely aggressor buying or selling, with the flow label each gets",
						"看涨或看跌与主动方买入或卖出的组合，以及各自得到的成交流标签",
					])}
					height={(width) => cellGridLayout(width, 2).height}
				>
					{(width) => (
						<CellGrid
							width={width}
							columns={[
								t(["Aggressor buys", "主动方买入"]),
								t(["Aggressor sells", "主动方卖出"]),
							]}
							rows={[
								{ short: t(["Call", "看涨"]), long: t(["Call", "看涨期权"]) },
								{ short: t(["Put", "看跌"]), long: t(["Put", "看跌期权"]) },
							]}
							cells={rights.map(
								(right) =>
									[
										cellLines(right, "buy", locale),
										cellLines(right, "sell", locale),
									] as const,
							)}
							active={[
								rights.indexOf(shown.right),
								actions.indexOf(shown.action),
							]}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "print",
					label: t(["Example", "例子"]),
					value: t(example),
				},
				{
					id: "label",
					label: t(["Flow label", "成交流标签"]),
					value: t(flowCopy[flow]),
					tone: flow === "bullish" ? "gain" : "loss",
					evidence: "inferred",
				},
				{
					id: "whose",
					label: t(["Whose view", "谁的观点"]),
					value: t(["the aggressor's leg, alone", "仅主动方这一条腿"]),
					note: t(["not a portfolio or a belief", "不是组合，也不是信念"]),
				},
			]}
			controls={
				explore ? (
					<FieldGroup>
						<ChoiceField
							label={t(["Option", "期权"])}
							value={explore.right}
							options={[
								["call", t(["Call", "看涨"])],
								["put", t(["Put", "看跌"])],
							]}
							onChange={(right) => setExplore({ ...explore, right })}
						/>
						<ChoiceField
							label={t(["Likely aggressor", "推断的主动方"])}
							value={explore.action}
							options={[
								["buy", t(["Buys", "买入"])],
								["sell", t(["Sells", "卖出"])],
							]}
							onChange={(action) => setExplore({ ...explore, action })}
						/>
					</FieldGroup>
				) : null
			}
			details={
				<p>
					{t([
						"Flow feeds label a print from the likely aggressor's side: buying calls or selling puts reads bullish, selling calls or buying puts bearish. The label describes that one leg's exposure to ALFA, not the trader's portfolio or belief. Option type alone says nothing: a put can be bought or sold.",
						"成交流数据从推断的主动方角度给成交贴标签：买入看涨或卖出看跌为看涨，卖出看涨或买入看跌为看跌。标签描述的是这一条腿对 ALFA 的敞口，而不是交易者的组合或信念。仅凭期权类型说明不了什么：看跌期权既可买也可卖。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: a day of labels ———

type TallyState = { shown: number; ledger: boolean };

const TALLY_HEIGHT = 74;
const flowClass: Record<Flow, string> = {
	bullish: "wt-long",
	neutral: "wt-panel-shape",
	bearish: "wt-short",
};

function Tally({
	width,
	y,
	totals,
	locale,
}: {
	width: number;
	y: number;
	totals: Record<Flow, number>;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const order: Flow[] = ["bullish", "neutral", "bearish"];
	const all = 20;
	const span = width - 16;
	let offset = 8;
	return (
		<g>
			<Label x={8} y={y + 14} tone="muted">
				{t(["Flow feed tally · contracts", "成交流统计 · 张数"])}
			</Label>
			{order.map((flow) => {
				const w = (totals[flow] / all) * span;
				const x = offset;
				offset += w;
				return (
					<g key={flow}>
						<m.rect
							y={y + 24}
							height={20}
							rx={4}
							className={flowClass[flow]}
							initial={false}
							animate={{ x, width: w }}
							transition={motion.move}
						/>
						{totals[flow] > 0 ? (
							<m.text
								y={y + 62}
								className="wt-small"
								initial={false}
								animate={{ x }}
								transition={motion.move}
							>
								{`${t(flowCopy[flow])} ${totals[flow]}`}
							</m.text>
						) : null}
					</g>
				);
			})}
		</g>
	);
}

const effectCopy = (trade: Trade, locale: Locale) => {
	const t = tr(locale);
	const verb = (effect: "open" | "close", buy: boolean): Copy =>
		buy
			? effect === "open"
				? ["bought to open", "买入开仓"]
				: ["bought to close", "买入平仓"]
			: effect === "open"
				? ["sold to open", "卖出开仓"]
				: ["sold to close", "卖出平仓"];
	return `${t(holders[trade.buyer].name)} ${t(verb(trade.buyerEffect, true))}, ${t(holders[trade.seller].name)} ${t(verb(trade.sellerEffect, false))}`;
};

function TallyView({ locale, state }: { locale: Locale; state: TallyState }) {
	const t = tr(locale);
	const shown = state;
	const labeled = TRADES.slice(0, shown.shown);
	const totals: Record<Flow, number> = { bullish: 0, neutral: 0, bearish: 0 };
	for (const trade of labeled) totals[printFlow(trade).flow] += trade.quantity;
	const rows: TapeRow[] = [...labeled].reverse().map((trade) => {
		const { side, flow } = printFlow(trade);
		return {
			key: trade.id,
			cells: [
				trade.time,
				count(trade.quantity),
				usd(trade.price),
				side ?? "—",
				t(flowCopy[flow]),
			],
		};
	});
	const tapeTop = 0;
	const result: ResultItem[] = labeled.map((trade) => {
		const { flow } = printFlow(trade);
		return {
			id: trade.id,
			label: `${trade.time} · ${t(flowCopy[flow])}`,
			value: t([`${trade.quantity} contracts`, `${trade.quantity} 张`]),
			note: shown.ledger
				? effectCopy(trade, locale)
				: flow === "neutral"
					? t(["inside the spread: not established", "价差之内：无法确定"])
					: flow === "bullish"
						? t(["call bought at the ask", "在卖价买入看涨"])
						: t(["call sold at the bid", "在买价卖出看涨"]),
			tone:
				flow === "bullish" ? "gain" : flow === "bearish" ? "loss" : undefined,
			evidence: flow === "neutral" ? "unknown" : "inferred",
		};
	});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Monday's three prints, each given one flow label, and the day's tally",
						"周一三笔成交各得到一个成交流标签，以及当天的统计",
					])}
					height={tapeHeight(3) + 12 + TALLY_HEIGHT}
				>
					{(width) => (
						<g>
							<TradeTape
								x={8}
								y={tapeTop}
								width={width - 16}
								title={t([
									`Time and sales · ${LABEL[0]}`,
									`逐笔成交 · ${LABEL[1]}`,
								])}
								columns={[
									{ label: t(["Time", "时间"]), share: 0.2 },
									{ label: t(["Qty", "张数"]), share: 0.16, align: "end" },
									{ label: t(["Price", "价格"]), share: 0.21, align: "end" },
									{ label: t(["Side", "位置"]), share: 0.18, align: "end" },
									{ label: t(["Label", "标签"]), share: 0.25, align: "end" },
								]}
								rows={rows}
								maxRows={3}
								empty={t(["No prints yet", "尚无成交"])}
							/>
							<Tally
								width={width}
								y={tapeHeight(3) + 12}
								totals={totals}
								locale={locale}
							/>
						</g>
					)}
				</Stage>
			}
			result={result}
			details={
				<p>
					{t([
						"Each print gets one label, from the likely aggressor's side. Labelling Ben's sale bearish as well would cancel every trade to zero. A print inside the spread gets no direction: neutral here means the evidence doesn't establish one, not that anyone expects a flat market.",
						"每笔成交只贴一个标签，从推断的主动方角度判断。如果把 Ben 的卖出也标为看跌，每笔成交都会相互抵消为零。价差之内的成交没有方向：这里的中性表示证据无法确定方向，而不是有人预期横盘。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: one put purchase, different portfolios ———

type PutState = { context: Context };

function contextLines(context: Context, locale: Locale): PayoffLine[] {
	const t = tr(locale);
	const points = (f: (spot: number) => number) =>
		[RANGE[0], PUT_95.strike, RANGE[1]].map((spot) => [spot, f(spot)] as const);
	if (context === "alone")
		return [
			{
				id: "after",
				label: t(["long put", "看跌多头"]),
				points: points((spot) => putValue(spot) - PUT_ASK),
				tone: "position",
			},
		];
	if (context === "stock")
		return [
			{
				id: "before",
				label: t(["stock alone", "仅股票"]),
				points: points(stock),
				tone: "reference",
			},
			{
				id: "after",
				label: t(["stock + put", "股票 + 看跌"]),
				points: points((spot) => stock(spot) + putValue(spot) - PUT_ASK),
				tone: "position",
			},
		];
	return [
		{
			id: "before",
			label: t(["short put before", "此前的看跌空头"]),
			points: points((spot) => PUT_BID - putValue(spot)),
			tone: "reference",
		},
		{
			id: "after",
			label: t(["after buying back", "买回之后"]),
			points: points(() => PUT_BID - PUT_ASK),
			tone: "position",
		},
	];
}

function PutView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: PutState;
	explore: PutState | null;
	setExplore: (next: PutState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const lines = contextLines(shown.context, locale);
	const floor = FLOOR;
	const bands: PayoffBand[] =
		shown.context === "stock"
			? [
					{
						id: "floor",
						from: RANGE[0],
						to: PUT_95.strike,
						label: t([
							`floor ${signedUsd(floor * 100, 0)}`,
							`下限 ${signedUsd(floor * 100, 0)}`,
						]),
						tone: "neutral",
					},
				]
			: [];
	const holding: Copy =
		shown.context === "alone"
			? ["1 long put", "1 张看跌多头"]
			: shown.context === "stock"
				? ["100 ALFA + 1 put", "100 股 ALFA + 1 张看跌"]
				: ["nothing: short put closed", "无：看跌空头已平仓"];
	const exposure: Copy =
		shown.context === "alone"
			? ["gains as ALFA falls", "ALFA 下跌时获利"]
			: shown.context === "stock"
				? ["gains as ALFA rises, with a floor", "ALFA 上涨时获利，并有下限"]
				: ["none left", "已无敞口"];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The same put purchase inside three different positions, as profit at expiry",
						"同一笔看跌买入放进三种不同持仓，到期盈亏如何",
					])}
					height={(width) => (width < 520 ? 260 : 300)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 260 : 300}
							xRange={RANGE}
							yRange={[-2200, 2200]}
							xTicks={[80, 90, 100, 110, 120]}
							yTicks={[-2000, -1000, 0, 1000, 2000]}
							lines={lines}
							bands={bands}
							xLabel={t(["ALFA on Oct 18", "10月18日 ALFA"])}
							title={t([
								`Bought 1 Oct 18 95 put at ${usd(PUT_ASK)} · per contract`,
								`以 ${usd(PUT_ASK)} 买入 1 张 10月18日 95 看跌 · 每张合约`,
							])}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "label",
					label: t(["Flow label", "成交流标签"]),
					value: t(flowCopy.bearish),
					note: t(["put bought at the ask", "在卖价买入看跌"]),
					tone: "loss",
					evidence: "inferred",
				},
				{
					id: "holding",
					label: t(["Holds afterwards", "交易后持有"]),
					value: t(holding),
				},
				{
					id: "exposure",
					label: t(["Exposure to ALFA", "对 ALFA 的敞口"]),
					value: t(exposure),
					tone:
						shown.context === "stock"
							? "gain"
							: shown.context === "alone"
								? "loss"
								: undefined,
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["The buyer already held", "买方原本持有"])}
						value={explore.context}
						options={[
							["alone", t(["Nothing", "无"])],
							["stock", t(["100 ALFA", "100 股 ALFA"])],
							["close", t(["A short put", "看跌空头"])],
						]}
						onChange={(context) => setExplore({ context })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"The flow label judges one leg in isolation. The same put purchase can be a bet on a fall, insurance on shares the buyer already owns, or the closing of a short put. Only the rest of the account tells you which, and the tape never shows it.",
						"成交流标签孤立地判断一条腿。同一笔看跌买入，可能是押注下跌，可能是为已持有的股票买保险，也可能是平掉看跌空头。只有账户里的其他持仓才能说明是哪一种，而逐笔成交从不显示这些。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<MatrixState, MatrixState>({
		id: "matrix",
		label: ["Four combinations", "四种组合"],
		title: [
			"Option type is only half of a flow label",
			"期权类型只是成交流标签的一半",
		],
		predict: {
			prompt: [
				"Someone buys Oct 18 95 puts, paying the ask. What label does a flow feed give that print?",
				"有人以卖价买入 10月18日 95 看跌。成交流数据会给这笔成交贴什么标签？",
			],
			choices: [
				{ id: "bearish", label: ["Bearish", "看跌"] },
				{ id: "bullish", label: ["Bullish: someone bought", "看涨：有人买入"] },
				{
					id: "none",
					label: ["No label: puts are different", "没有标签：看跌期权不同"],
				},
			],
			answer: "bearish",
			revealAt: 2,
			explain: [
				"A long put gains as ALFA falls, so a put bought by the aggressor is labelled bearish. Buying isn't bullish by itself; it depends on what was bought.",
				"看跌多头在 ALFA 下跌时获利，所以主动买入看跌被标为看跌。买入本身并不代表看涨，要看买的是什么。",
			],
		},
		beats: [
			{
				id: "call-buy",
				label: ["Call bought", "买入看涨"],
				caption: [
					"A call taken at the ask was probably bought by the aggressor. A long call gains as ALFA rises, so the feed labels it bullish.",
					"在卖价成交的看涨，多半是主动方买入。看涨多头在 ALFA 上涨时获利，所以数据标为看涨。",
				],
				state: { right: "call", action: "buy" },
			},
			{
				id: "call-sell",
				label: ["Call sold", "卖出看涨"],
				caption: [
					"A call hit at the bid was probably sold by the aggressor. A short call gains as ALFA falls or stalls: bearish.",
					"在买价成交的看涨，多半是主动方卖出。看涨空头在 ALFA 下跌或横盘时获利：看跌。",
				],
				state: { right: "call", action: "sell" },
			},
			{
				id: "put-buy",
				label: ["Put bought", "买入看跌"],
				caption: [
					"A put bought at the ask flips it: a long put gains as ALFA falls, so buying puts reads bearish.",
					"在卖价买入看跌则相反：看跌多头在 ALFA 下跌时获利，所以买入看跌读作看跌。",
				],
				state: { right: "put", action: "buy" },
			},
			{
				id: "put-sell",
				label: ["Put sold", "卖出看跌"],
				caption: [
					"And a put sold at the bid reads bullish: the seller gains if ALFA rises or stays put.",
					"而在买价卖出看跌读作看涨：卖方在 ALFA 上涨或不动时获利。",
				],
				state: { right: "put", action: "sell" },
			},
		],
		explore: {
			prompt: [
				"Pick an option and what the aggressor did.",
				"选择期权类型和主动方的操作。",
			],
			start: (last) => last,
			task: {
				kind: "reach",
				prompt: [
					"Find the combination a feed labels bearish although it involves a call.",
					"找出虽然涉及看涨期权、却被数据源标为看跌的组合。",
				],
				reached: (e) => e.right === "call" && e.action === "sell",
				done: [
					"A call sold at the bid: the likely seller gains if ALFA falls or stalls, so the feed calls it bearish. The label follows what the aggressor did with which option.",
					"在买价被卖出的看涨：可能的卖方在 ALFA 下跌或横盘时获益，所以数据源称之为看跌。标签取决于主动方对哪种期权做了什么。",
				],
			},
		},
		View: MatrixView,
	}),
	defineScene<TallyState, TallyState>({
		id: "tally",
		label: ["A day of labels", "一天的标签"],
		title: [
			"One label per print, and only with evidence",
			"每笔成交一个标签，而且要有证据",
		],
		predict: {
			prompt: [
				"On Monday 6 Oct 18 100 calls printed at $4.15, inside the $4.10 / $4.20 quote. What flow label do they get?",
				"周一有 6 张 10月18日 100 看涨在 $4.15 成交，位于 $4.10 / $4.20 报价之内。它们得到什么标签？",
			],
			choices: [
				{
					id: "neutral",
					label: ["Neutral: no direction established", "中性：无法确定方向"],
				},
				{
					id: "bullish",
					label: ["Bullish: calls were bought", "看涨：看涨期权被买入"],
				},
				{
					id: "split",
					label: ["Half bullish, half bearish", "一半看涨，一半看跌"],
				},
			],
			answer: "neutral",
			revealAt: 1,
			explain: [
				"Inside the spread, either side could have started the trade, so there's no aggressor to label. Neutral means unknown, not a view.",
				"在价差之内，任何一方都可能发起成交，没有主动方可以贴标签。中性表示未知，而不是一种观点。",
			],
		},
		beats: [
			{
				id: "t1",
				label: ["10:05 at the ask", "10:05 在卖价"],
				caption: [
					"10:05: 10 calls at the ask, so a buyer probably started it: bullish 10. Ben's matching sale isn't labelled too; that would cancel every trade.",
					"10:05：10 张看涨在卖价成交，多半是买方发起：看涨 10 张。Ben 对应的卖出不另贴标签，否则每笔成交都会被抵消。",
				],
				state: { shown: 1, ledger: false },
			},
			{
				id: "t2",
				label: ["11:42 inside", "11:42 在价差内"],
				caption: [
					"11:42: 6 contracts inside the spread. No likely aggressor, so no direction: neutral 6.",
					"11:42：6 张在价差之内成交。没有可推断的主动方，所以没有方向：中性 6 张。",
				],
				state: { shown: 2, ledger: false },
			},
			{
				id: "t3",
				label: ["14:18 at the bid", "14:18 在买价"],
				caption: [
					"14:18: 4 calls at the bid, so a seller probably started it: bearish 4. The feed's day reads 10 bullish, 6 neutral, 4 bearish.",
					"14:18：4 张看涨在买价成交，多半是卖方发起：看跌 4 张。当天数据显示看涨 10、中性 6、看跌 4。",
				],
				state: { shown: 3, ledger: false },
			},
			{
				id: "ledger",
				label: ["What really happened", "真实情况"],
				caption: [
					"The teaching ledger shows the rest: the bullish 10 was you opening, and the bearish 4 was two people closing. Labels describe prints, not people.",
					"教学账本揭示了其余部分：看涨的 10 张是你开仓，看跌的 4 张是两个人在平仓。标签描述的是成交，不是人。",
				],
				state: { shown: 3, ledger: true },
			},
		],
		explore: {
			prompt: [
				"Read the day's tally and the ledger beside it.",
				"读一读当天的标签统计，以及旁边的台账。",
			],
			start: (last) => last,
			task: {
				kind: "answer",
				prompt: [
					"The feed's day reads 10 bullish, 6 neutral, 4 bearish. What does that tally establish?",
					"数据源的当日统计是：看涨 10、中性 6、看跌 4。这个统计能确定什么？",
				],
				choices: [
					{
						id: "places",
						label: [
							"Where 20 contracts printed against their quotes",
							"20 张合约相对各自报价的成交位置",
						],
					},
					{
						id: "buyers",
						label: ["That buyers outnumbered sellers", "买方多于卖方"],
					},
					{
						id: "rise",
						label: ["That ALFA is more likely to rise", "ALFA 更可能上涨"],
					},
				],
				answer: "places",
				done: [
					"Each label sums where a print met its quote. Every trade had a buyer and a seller, and the ledger shows the 'bullish' 10 opened while the 'bearish' 4 were two people closing.",
					"每个标签统计的是成交与报价的相对位置。每笔成交都有一买一卖；台账显示“看涨”的 10 张是开仓，“看跌”的 4 张则是两个人在平仓。",
				],
			},
		},
		View: TallyView,
	}),
	defineScene<PutState, PutState>({
		id: "portfolio",
		label: ["Leg versus portfolio", "单腿与组合"],
		title: [
			"The same 'bearish' put can sit in a bullish account",
			"同一笔“看跌”买入，可能属于看涨的账户",
		],
		predict: {
			prompt: [
				"An investor who owns 100 ALFA buys an Oct 18 95 put at the ask. The flow feed calls it bearish. What do they hold now?",
				"一位持有 100 股 ALFA 的投资者以卖价买入 10月18日 95 看跌。成交流数据称其看跌。他现在持有什么？",
			],
			choices: [
				{
					id: "floor",
					label: ["Still long ALFA, with a floor", "仍然看多 ALFA，并有下限"],
				},
				{ id: "bearish", label: ["A bearish position", "看跌的持仓"] },
				{
					id: "flat",
					label: [
						"Nothing: the put cancels the stock",
						"什么都没有：看跌抵消了股票",
					],
				},
			],
			answer: "floor",
			revealAt: 1,
			explain: [
				"Stock plus the put still gains as ALFA rises; the put only stops losses below $95. The 'bearish' label described the leg, not the account.",
				"股票加看跌在 ALFA 上涨时仍然获利，看跌只是在 $95 以下止住亏损。“看跌”标签描述的是这条腿，而不是整个账户。",
			],
		},
		beats: [
			{
				id: "alone",
				label: ["On its own", "单独来看"],
				caption: [
					"Bought on its own at $2.15, the Oct 18 95 put gains as ALFA falls below $92.85. Here the bearish label fits.",
					"单独以 $2.15 买入，10月18日 95 看跌在 ALFA 跌破 $92.85 后获利。此时看跌标签是贴切的。",
				],
				state: { context: "alone" },
			},
			{
				id: "stock",
				label: ["With shares", "配合股票"],
				caption: [
					"If the buyer owns 100 ALFA bought at $100, stock plus put still gains as ALFA rises. The put just puts a floor at −$715.",
					"如果买方持有以 $100 买入的 100 股 ALFA，股票加看跌在 ALFA 上涨时仍然获利。看跌只是设了 −$715 的下限。",
				],
				state: { context: "stock" },
			},
			{
				id: "close",
				label: ["Closing", "平仓"],
				caption: [
					"Or the buyer was short that put and is buying it back. The same print removes a bullish position and leaves them flat.",
					"或者买方原本持有该看跌的空头，现在把它买回。同一笔成交移除了一个看涨持仓，使其回到空仓。",
				],
				state: { context: "close" },
			},
		],
		explore: {
			prompt: [
				"Pick what the buyer already held before the trade.",
				"选择买方在交易前已持有什么。",
			],
			start: (last) => last,
			task: {
				kind: "answer",
				prompt: [
					"In which case does buying this 'bearish' put leave the buyer with no position at all?",
					"在哪种情况下，买入这份“看跌”的看跌期权后，买方完全没有持仓？",
				],
				choices: [
					{
						id: "close",
						label: ["They were short the put", "他原本是看跌空头"],
					},
					{
						id: "stock",
						label: ["They owned 100 ALFA", "他原本持有 100 股 ALFA"],
					},
					{ id: "alone", label: ["They held nothing", "他原本什么都没有"] },
				],
				answer: "close",
				done: [
					"Buying back a short put closes it: flat. The same print the feed calls bearish removed a bullish position and added no view at all.",
					"买回看跌空头就是平仓：没有持仓。数据源称之为看跌的同一笔成交，其实是去掉了一个看涨的持仓，并没有增加任何观点。",
				],
			},
		},
		View: PutView,
	}),
] as const;

export function FlowSentimentWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Player
			locale={locale}
			id="flow-sentiment"
			label={[
				"Interactive lesson on bullish and bearish flow labels",
				"看涨与看跌成交流标签互动课",
			]}
			film={flowSentimentFilm}
			scenes={scenes}
		/>
	);
}
