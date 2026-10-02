import {
	type Contract,
	type Copy,
	count,
	pick,
	quoteAt,
	signedUsd,
	usd,
	valueAtExpiry,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import {
	PayoffChart,
	type PayoffLine,
	type PayoffMarker,
} from "../walkthrough/instruments/payoff-chart";
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

const CALL_105: Contract = { expiry: "oct18", strike: 105, right: "call" };
const CALL_110: Contract = { expiry: "oct18", strike: 110, right: "call" };
const QUOTE = quoteAt(CALL_105, CHECKPOINT_ALFA, CHECKPOINT_DATE);
const QUOTE_110 = quoteAt(CALL_110, CHECKPOINT_ALFA, CHECKPOINT_DATE);

type Code = "AASK" | "ASK" | "MID" | "BID";
type Print = {
	key: string;
	time: string;
	size: number;
	price: number;
	code: Code;
};
/** Four prints in the Oct 18 105 call against the matched quote, in cents. */
const PRINTS: readonly Print[] = [
	{ key: "a", time: "10:41:05", size: 20, price: QUOTE.ask, code: "ASK" },
	{ key: "b", time: "10:41:12", size: 5, price: QUOTE.bid + 8, code: "MID" },
	{ key: "c", time: "10:41:20", size: 12, price: QUOTE.bid, code: "BID" },
	{ key: "d", time: "10:41:31", size: 3, price: QUOTE.ask + 5, code: "AASK" },
];
const AT_OR_ABOVE = PRINTS.filter(
	(p) => p.code === "ASK" || p.code === "AASK",
).reduce((sum, p) => sum + p.size, 0);
const BID_SIDE = PRINTS.filter((p) => p.code === "BID").reduce(
	(sum, p) => sum + p.size,
	0,
);
const NET = AT_OR_ABOVE - BID_SIDE;
const flowLabel = (code: Code): Copy =>
	code === "MID"
		? ["neutral", "中性"]
		: code === "BID"
			? ["bearish", "看跌"]
			: ["bullish", "看涨"];

const tapeColumns = (
	t: (value: Copy) => string,
	narrow: boolean,
	last: Copy,
) =>
	narrow
		? [
				{ label: t(["Qty", "张数"]), share: 0.18, align: "end" as const },
				{ label: t(["Price", "价格"]), share: 0.32, align: "end" as const },
				{ label: t(last), share: 0.5, align: "end" as const },
			]
		: [
				{ label: t(["Time", "时间"]), share: 0.26 },
				{ label: t(["Qty", "张数"]), share: 0.14, align: "end" as const },
				{ label: t(["Price", "价格"]), share: 0.24, align: "end" as const },
				{ label: t(last), share: 0.36, align: "end" as const },
			];

// ——— Scenes 1 and 2: four prints against one quote ———

type TapeState = {
	stage: 0 | 1 | 2;
	show: "all" | "ask" | "bid" | "inside";
};

function PrintsView({
	labels,
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	labels: boolean;
	locale: Locale;
	phase: Phase;
	state: TapeState;
	explore: TapeState | null;
	setExplore: (next: TapeState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const matches = (p: Print) =>
		shown.show === "all" ||
		(shown.show === "ask" && (p.code === "ASK" || p.code === "AASK")) ||
		(shown.show === "bid" && p.code === "BID") ||
		(shown.show === "inside" && p.code === "MID");
	const last = (p: Print) =>
		shown.stage === 0 ? "" : labels ? t(flowLabel(p.code)) : p.code;
	const rows = (narrow: boolean): TapeRow[] =>
		PRINTS.map((p) => ({
			key: p.key,
			cells: narrow
				? [count(p.size), usd(p.price), last(p)]
				: [p.time, count(p.size), usd(p.price), last(p)],
			muted: !matches(p),
		}));
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: labels
				? t([
						`bullish ${AT_OR_ABOVE} · bearish ${BID_SIDE} · neutral 5`,
						`看涨 ${AT_OR_ABOVE} · 看跌 ${BID_SIDE} · 中性 5`,
					])
				: t([
						`at the ask: 20 · above it: 3 · at the bid: ${BID_SIDE} · inside: 5`,
						`卖价：20 · 高于卖价：3 · 买价：${BID_SIDE} · 价差内：5`,
					]),
		});
	if (shown.stage >= 2)
		lines.push({
			text: labels
				? t([
						`net: ${AT_OR_ABOVE} − ${BID_SIDE} = +${NET} contracts`,
						`净额：${AT_OR_ABOVE} − ${BID_SIDE} = +${NET} 张`,
					])
				: t([
						`at or above the ask: 20 + 3 = ${AT_OR_ABOVE} contracts`,
						`卖价及以上：20 + 3 = ${AT_OR_ABOVE} 张`,
					]),
			tone: "strong",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Four prints in the Oct 18 105 call on the checkpoint day, against the quote they matched",
						"检查点当天 10月18日 105 看涨的四笔成交，对照它们匹配的报价",
					])}
					height={() => sheetHeight(4, 2)}
				>
					{(width) => (
						<CaseSheet
							width={width}
							title={t([
								`Oct 18 105 call · quote ${usd(QUOTE.bid)} / ${usd(QUOTE.ask)} · ${CHECKPOINT_DAY[0]}`,
								`10月18日 105 看涨 · 报价 ${usd(QUOTE.bid)} / ${usd(QUOTE.ask)} · ${CHECKPOINT_DAY[1]}`,
							])}
							columns={tapeColumns(
								t,
								width < 520,
								labels ? ["Flow label", "成交流标签"] : ["Side", "位置"],
							)}
							rows={rows(width < 520)}
							maxRows={4}
							lines={lines}
						/>
					)}
				</Stage>
			}
			result={[
				labels
					? {
							id: "net",
							label: t(["Bullish − bearish", "看涨 − 看跌"]),
							value: `+${NET}`,
							note: t([
								"contracts, inside prints excluded",
								"张，价差内成交不计",
							]),
							evidence: "inferred",
						}
					: {
							id: "ask",
							label: t(["At or above the ask", "卖价及以上"]),
							value: count(AT_OR_ABOVE),
							note: t(["contracts", "张"]),
							evidence: "calculated",
						},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Highlight", "突出显示"])}
						value={explore.show}
						options={[
							["all", t(["All", "全部"])],
							["ask", t(["Ask side", "卖价侧"])],
							["bid", t(["Bid side", "买价侧"])],
							["inside", t(["Inside", "价差内"])],
						]}
						onChange={(show) => setExplore({ ...explore, show })}
					/>
				) : null
			}
		/>
	);
}
const SideView = (props: Omit<Parameters<typeof PrintsView>[0], "labels">) => (
	<PrintsView labels={false} {...props} />
);
const LabelView = (props: Omit<Parameters<typeof PrintsView>[0], "labels">) => (
	<PrintsView labels {...props} />
);

// ——— Scene 3: a spread printed as two legs ———

type SpreadState = { stage: 0 | 1 | 2; spot: number };

const NET_DEBIT = (QUOTE.ask - QUOTE_110.bid) / 100;
const RANGE = [95, 120] as const;
const spread = (spot: number) =>
	(valueAtExpiry(CALL_105, Math.round(spot * 100)) -
		valueAtExpiry(CALL_110, Math.round(spot * 100))) /
		100 -
	NET_DEBIT;
const perContract = (perShare: number) =>
	signedUsd(Math.round(perShare * 100) * 100, 0);
const FIRST_PROFIT = Array.from({ length: 26 }, (_, i) => 95 + i).find(
	(spot) => spread(spot) > 0,
);

function SpreadView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SpreadState;
	explore: SpreadState | null;
	setExplore: (next: SpreadState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const lines: PayoffLine[] =
		shown.stage >= 1
			? [
					{
						id: "spread",
						label: t(["105/110 call spread", "105/110 看涨价差"]),
						points: [RANGE[0], 105, 110, RANGE[1]].map(
							(spot) => [spot, spread(spot) * 100] as const,
						),
						tone: "position",
					},
				]
			: [];
	const markers: PayoffMarker[] =
		shown.stage >= 2
			? [
					{
						id: "at",
						x: shown.spot,
						y: spread(shown.spot) * 100,
						label: perContract(spread(shown.spot)),
						tone: spread(shown.spot) >= 0 ? "gain" : "loss",
					},
				]
			: [];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Two prints in the same second read as one 105/110 call spread, with its profit at expiry",
						"同一秒内的两笔成交作为一个 105/110 看涨价差来读，以及它的到期盈亏",
					])}
					height={(width) => (width < 520 ? 250 : 280)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 250 : 280}
							xRange={RANGE}
							yRange={[-300, 400]}
							xTicks={[95, 100, 105, 110, 115, 120]}
							yTicks={[-200, 0, 200, 400]}
							lines={lines}
							markers={markers}
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
								`Bought 105 call ${usd(QUOTE.ask)} · sold 110 call ${usd(QUOTE_110.bid)} · multi-leg`,
								`买入 105 看涨 ${usd(QUOTE.ask)} · 卖出 110 看涨 ${usd(QUOTE_110.bid)} · 多腿`,
							])}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "net",
					label: t(["Net paid, per share", "每股净支付"]),
					value: usd(Math.round(NET_DEBIT * 100)),
					note: t([
						`${usd(QUOTE.ask)} − ${usd(QUOTE_110.bid)}`,
						`${usd(QUOTE.ask)} − ${usd(QUOTE_110.bid)}`,
					]),
					evidence: "calculated",
				},
				...(shown.stage >= 2
					? [
							{
								id: "at",
								label: t([`At ALFA $${shown.spot}`, `ALFA $${shown.spot} 时`]),
								value: perContract(spread(shown.spot)),
								tone: (spread(shown.spot) >= 0 ? "gain" : "loss") as
									| "gain"
									| "loss",
								evidence: "calculated" as const,
							},
						]
					: []),
			]}
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
		/>
	);
}

// ——— Scene 4: a smaller offer, and no print ———

type BookState = { stage: 0 | 1 | 2; event: "cancel" | "trade" };

const BEFORE = 40;
const AFTER = 25;

function BookView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: BookState;
	explore: BookState | null;
	setExplore: (next: BookState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const traded = shown.event === "trade";
	const rows: TapeRow[] = [
		{
			key: "a",
			cells: [
				"10:44:00",
				t(["offer size at the ask", "卖价挂单数量"]),
				count(BEFORE),
			],
		},
		{
			key: "b",
			cells: [
				"10:44:09",
				t(["offer size at the ask", "卖价挂单数量"]),
				count(AFTER),
			],
		},
		{
			key: "c",
			cells: [
				"10:44:09",
				t(["prints since 10:44:00", "10:44:00 以来的成交"]),
				traded ? `${BEFORE - AFTER} @ ${usd(QUOTE.ask)}` : t(["none", "无"]),
			],
			muted: shown.stage === 0,
		},
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: t([
				`the offer shrank by ${BEFORE - AFTER}: a cancel, or a trade?`,
				`挂单减少了 ${BEFORE - AFTER} 张：撤单，还是成交？`,
			]),
		});
	if (shown.stage >= 2)
		lines.push({
			text: traded
				? t([
						`a print shows ${BEFORE - AFTER} traded`,
						`成交记录显示成交了 ${BEFORE - AFTER} 张`,
					])
				: t([
						"no print, so nothing traded: 0 contracts",
						"没有成交记录，就没有成交：0 张",
					]),
			tone: "strong",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The Oct 18 105 call's offer size before and after, and the prints in between",
						"10月18日 105 看涨卖价挂单数量的前后变化，以及其间的成交",
					])}
					height={() => sheetHeight(3, 2)}
				>
					{(width) => (
						<CaseSheet
							width={width}
							title={t([
								"Book and tape · Oct 18 105 call",
								"订单簿与成交 · 10月18日 105 看涨",
							])}
							columns={[
								{ label: t(["Time", "时间"]), share: width < 520 ? 0.26 : 0.2 },
								{
									label: t(["Record", "记录"]),
									share: width < 520 ? 0.46 : 0.5,
								},
								{
									label: t(["Value", "数值"]),
									share: width < 520 ? 0.28 : 0.3,
									align: "end",
								},
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
					id: "volume",
					label: t(["Added to volume", "计入成交量"]),
					value: traded ? count(BEFORE - AFTER) : "0",
					note: t(["contracts", "张"]),
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["What happened", "发生了什么"])}
						value={explore.event}
						options={[
							["cancel", t(["A cancel", "撤单"])],
							["trade", t(["A trade", "成交"])],
						]}
						onChange={(event) => setExplore({ ...explore, event })}
					/>
				) : null
			}
		/>
	);
}

// ——— Checkpoint ———

const scenes = [
	defineScene<TapeState, TapeState>({
		id: "side",
		label: ["Where they printed", "成交位置"],
		title: ["Place each print against its quote", "对照报价给每笔成交定位"],
		revisit: "execution-side",
		predict: {
			prompt: [
				`The Oct 18 105 call is quoted ${usd(QUOTE.bid)} / ${usd(QUOTE.ask)}. Prints: 20 at ${usd(PRINTS[0].price)}, 5 at ${usd(PRINTS[1].price)}, 12 at ${usd(PRINTS[2].price)}, 3 at ${usd(PRINTS[3].price)}. How many contracts printed at or above the ask?`,
				`10月18日 105 看涨报价 ${usd(QUOTE.bid)} / ${usd(QUOTE.ask)}。成交：20 张 ${usd(PRINTS[0].price)}，5 张 ${usd(PRINTS[1].price)}，12 张 ${usd(PRINTS[2].price)}，3 张 ${usd(PRINTS[3].price)}。在卖价及以上成交了多少张？`,
			],
			choices: [
				{ id: "right", label: [String(AT_OR_ABOVE), String(AT_OR_ABOVE)] },
				{ id: "ask", label: ["20", "20"] },
				{ id: "all", label: ["40", "40"] },
			],
			answer: "right",
			entry: { answer: AT_OR_ABOVE, unit: [" contracts", " 张"] },
			revealAt: 2,
			explain: [
				`20 printed at the ${usd(QUOTE.ask)} ask and 3 above it, at ${usd(PRINTS[3].price)}: ${AT_OR_ABOVE}. The 5 at ${usd(PRINTS[1].price)} sit inside the spread.`,
				`20 张成交在 ${usd(QUOTE.ask)} 的卖价，3 张高于卖价，在 ${usd(PRINTS[3].price)}：共 ${AT_OR_ABOVE} 张。${usd(PRINTS[1].price)} 的 5 张在价差之内。`,
			],
		},
		beats: [
			{
				id: "tape",
				label: ["The tape", "成交"],
				caption: [
					`Four prints in the Oct 18 105 call, all matched to the ${usd(QUOTE.bid)} / ${usd(QUOTE.ask)} quote.`,
					`10月18日 105 看涨的四笔成交，都匹配 ${usd(QUOTE.bid)} / ${usd(QUOTE.ask)} 的报价。`,
				],
				state: { stage: 0, show: "all" },
			},
			{
				id: "codes",
				label: ["Locate them", "定位"],
				caption: [
					"Against the quote: 20 at the ask, 3 above it, 12 at the bid and 5 inside.",
					"对照报价：20 张在卖价，3 张高于卖价，12 张在买价，5 张在价差内。",
				],
				state: { stage: 1, show: "all" },
			},
			{
				id: "count",
				label: ["Count", "计数"],
				caption: [
					`At or above the ask: 20 + 3 = ${AT_OR_ABOVE} contracts.`,
					`卖价及以上：20 + 3 = ${AT_OR_ABOVE} 张。`,
				],
				state: { stage: 2, show: "ask" },
			},
		],
		explore: {
			prompt: ["Highlight each side of the quote.", "分别突出显示报价的各侧。"],
			start: () => ({ stage: 2, show: "all" }),
			task: {
				kind: "answer",
				prompt: [
					"Which print most likely started with a seller?",
					"哪笔成交最可能是由卖方发起的？",
				],
				choices: [
					{ id: "bid", label: ["The 12 at the bid", "买价上的 12 张"] },
					{ id: "mid", label: ["The 5 inside", "价差内的 5 张"] },
					{ id: "above", label: ["The 3 above the ask", "高于卖价的 3 张"] },
				],
				answer: "bid",
				done: [
					"A print at the bid suggests a seller took the best bid. Inside the spread there's no clear side; above the ask points to an eager buyer.",
					"成交在买价，说明大概是卖方接受了最优买价。价差内看不出方向；高于卖价说明买方很急。",
				],
			},
		},
		View: SideView,
	}),
	defineScene<TapeState, TapeState>({
		id: "labels",
		label: ["Flow labels", "成交流标签"],
		title: [
			"Label each call print, then net them",
			"给每笔看涨成交贴标签，再求净额",
		],
		revisit: "flow-sentiment",
		predict: {
			prompt: [
				"Label those four call prints the way a flow feed does. Counting contracts, what is bullish minus bearish?",
				"像成交流数据那样给这四笔看涨成交贴标签。按张数计，看涨减看跌是多少？",
			],
			choices: [
				{ id: "right", label: [`+${NET}`, `+${NET}`] },
				{ id: "all", label: [`+${AT_OR_ABOVE + 5}`, `+${AT_OR_ABOVE + 5}`] },
				{ id: "zero", label: ["0", "0"] },
			],
			answer: "right",
			entry: { answer: NET, unit: [" contracts", " 张"] },
			revealAt: 2,
			explain: [
				`Calls bought at or above the ask are bullish (${AT_OR_ABOVE}), sold at the bid bearish (${BID_SIDE}), and the 5 inside are neutral: ${AT_OR_ABOVE} − ${BID_SIDE} = +${NET}.`,
				`在卖价及以上买入的看涨为看涨（${AT_OR_ABOVE} 张），在买价卖出的为看跌（${BID_SIDE} 张），价差内的 5 张为中性：${AT_OR_ABOVE} − ${BID_SIDE} = +${NET}。`,
			],
		},
		beats: [
			{
				id: "tape",
				label: ["The tape", "成交"],
				caption: [
					"The same four prints. A call bought at the ask is bullish flow; a call sold at the bid is bearish.",
					"同样的四笔成交。在卖价买入看涨是看涨成交流；在买价卖出看涨是看跌成交流。",
				],
				state: { stage: 0, show: "all" },
			},
			{
				id: "label",
				label: ["Label", "贴标签"],
				caption: [
					`Bullish: ${AT_OR_ABOVE}. Bearish: ${BID_SIDE}. The 5 inside the spread are neutral and count for neither.`,
					`看涨：${AT_OR_ABOVE} 张。看跌：${BID_SIDE} 张。价差内的 5 张为中性，两边都不计。`,
				],
				state: { stage: 1, show: "all" },
			},
			{
				id: "net",
				label: ["Net", "净额"],
				caption: [
					`Net +${NET} contracts. A label describes each print, not anyone's whole position.`,
					`净额 +${NET} 张。标签描述的是每笔成交，而不是任何人的完整持仓。`,
				],
				state: { stage: 2, show: "all" },
			},
		],
		explore: {
			prompt: ["Highlight each side of the quote.", "分别突出显示报价的各侧。"],
			start: () => ({ stage: 2, show: "inside" }),
			task: {
				kind: "answer",
				prompt: [
					"What does the 5-lot inside the spread add to the net?",
					"价差内的 5 张给净额增加了多少？",
				],
				choices: [
					{ id: "zero", label: ["Nothing: neutral", "零：中性"] },
					{ id: "plus", label: ["+5", "+5"] },
					{ id: "minus", label: ["−5", "−5"] },
				],
				answer: "zero",
				done: [
					"Inside the spread there's no reliable aggressor, so the print is neutral and adds nothing either way.",
					"价差之内没有可靠的主动方，所以这笔成交为中性，对任何一方都不增加。",
				],
			},
		},
		View: LabelView,
	}),
	defineScene<SpreadState, SpreadState>({
		id: "package",
		label: ["One package", "一个整体"],
		title: [
			"Two legs in one second are one spread",
			"同一秒的两条腿是一个价差",
		],
		revisit: "multi-leg-structures",
		predict: {
			prompt: [
				`In the same second, flagged multi-leg: 100 Oct 18 105 calls bought at ${usd(QUOTE.ask)} and 100 Oct 18 110 calls sold at ${usd(QUOTE_110.bid)}. What net did the package pay, per share?`,
				`同一秒内、带多腿标记：以 ${usd(QUOTE.ask)} 买入 100 张 10月18日 105 看涨，以 ${usd(QUOTE_110.bid)} 卖出 100 张 10月18日 110 看涨。这个整体每股净付了多少？`,
			],
			choices: [
				{
					id: "net",
					label: [
						usd(Math.round(NET_DEBIT * 100)),
						usd(Math.round(NET_DEBIT * 100)),
					],
				},
				{ id: "long", label: [usd(QUOTE.ask), usd(QUOTE.ask)] },
				{
					id: "sum",
					label: [
						usd(QUOTE.ask + QUOTE_110.bid),
						usd(QUOTE.ask + QUOTE_110.bid),
					],
				},
			],
			answer: "net",
			entry: { answer: NET_DEBIT, tolerance: 0.01, prefix: "$" },
			revealAt: 1,
			explain: [
				`Paid ${usd(QUOTE.ask)}, received ${usd(QUOTE_110.bid)}: a 105/110 call spread for ${usd(Math.round(NET_DEBIT * 100))} net. Its value is capped at $5.00 a share.`,
				`付出 ${usd(QUOTE.ask)}，收到 ${usd(QUOTE_110.bid)}：净价 ${usd(Math.round(NET_DEBIT * 100))} 的 105/110 看涨价差。其价值最多为每股 $5.00。`,
			],
		},
		beats: [
			{
				id: "legs",
				label: ["Two legs", "两条腿"],
				caption: [
					"Two prints in one second, both flagged multi-leg, 100 contracts each: one bought, one sold.",
					"同一秒的两笔成交，都带多腿标记，各 100 张：一买一卖。",
				],
				state: { stage: 0, spot: 110 },
			},
			{
				id: "spread",
				label: ["One spread", "一个价差"],
				caption: [
					`Together: a 105/110 call spread for ${usd(Math.round(NET_DEBIT * 100))} a share, worth at most $5.00.`,
					`合起来：每股 ${usd(Math.round(NET_DEBIT * 100))} 的 105/110 看涨价差，最多值 $5.00。`,
				],
				state: { stage: 1, spot: 110 },
			},
			{
				id: "profit",
				label: ["At $110", "$110 时"],
				caption: [
					`At $110 or above it pays $500 a spread: ${perContract(spread(110))} after its cost.`,
					`$110 及以上每组支付 $500：扣除成本后 ${perContract(spread(110))}。`,
				],
				state: { stage: 2, spot: 110 },
			},
		],
		explore: {
			prompt: ["Drag ALFA's expiry price.", "拖动 ALFA 的到期价格。"],
			start: () => ({ stage: 2, spot: 105 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the lowest whole-dollar price at which the spread makes money.",
					"找出价差开始赚钱的最低整数美元价格。",
				],
				reached: (e) => e.spot === FIRST_PROFIT,
				done: [
					`Break-even is $105 + ${usd(Math.round(NET_DEBIT * 100))} = ${usd(10500 + Math.round(NET_DEBIT * 100))}, so $${FIRST_PROFIT} is the first whole dollar in profit: ${perContract(spread(FIRST_PROFIT ?? 0))}.`,
					`盈亏平衡点是 $105 + ${usd(Math.round(NET_DEBIT * 100))} = ${usd(10500 + Math.round(NET_DEBIT * 100))}，所以 $${FIRST_PROFIT} 是第一个盈利的整数美元：${perContract(spread(FIRST_PROFIT ?? 0))}。`,
				],
			},
		},
		View: SpreadView,
	}),
	defineScene<BookState, BookState>({
		id: "book",
		label: ["Book vs tape", "订单簿与成交"],
		title: ["A smaller offer isn't a trade", "挂单变少不等于成交"],
		revisit: "quotes-orders-trades",
		predict: {
			prompt: [
				`The offer at ${usd(QUOTE.ask)} shrinks from ${BEFORE} contracts to ${AFTER}, and no print appears. How many contracts traded?`,
				`${usd(QUOTE.ask)} 的卖出挂单从 ${BEFORE} 张降到 ${AFTER} 张，而且没有出现成交记录。成交了多少张？`,
			],
			choices: [
				{ id: "none", label: ["0", "0"] },
				{ id: "drop", label: [String(BEFORE - AFTER), String(BEFORE - AFTER)] },
				{ id: "rest", label: [String(AFTER), String(AFTER)] },
			],
			answer: "none",
			entry: { answer: 0, unit: [" contracts", " 张"] },
			revealAt: 2,
			explain: [
				`With no print, nothing traded: a seller cancelled ${BEFORE - AFTER} contracts. The book shrinks the same way for a cancel and a trade; only the tape tells them apart.`,
				`没有成交记录，就没有成交：卖方撤销了 ${BEFORE - AFTER} 张。撤单和成交让订单簿以同样的方式缩小；只有成交记录能区分。`,
			],
		},
		beats: [
			{
				id: "book",
				label: ["The book", "订单簿"],
				caption: [
					`At 10:44:00 the ${usd(QUOTE.ask)} offer shows ${BEFORE}; nine seconds later it shows ${AFTER}.`,
					`10:44:00 时 ${usd(QUOTE.ask)} 的卖单显示 ${BEFORE} 张；九秒后显示 ${AFTER} 张。`,
				],
				state: { stage: 0, event: "cancel" },
			},
			{
				id: "either",
				label: ["Either", "两种可能"],
				caption: [
					"A cancel or a trade would shrink the offer the same way.",
					"撤单或成交都会让挂单以同样的方式变少。",
				],
				state: { stage: 1, event: "cancel" },
			},
			{
				id: "tape",
				label: ["The tape", "成交记录"],
				caption: [
					"The tape shows no print in between, so nothing traded: it was a cancel.",
					"其间成交记录没有任何成交，所以没有成交：那是撤单。",
				],
				state: { stage: 2, event: "cancel" },
			},
		],
		explore: {
			prompt: [
				"Choose what happened to the offer.",
				"选择这张卖单发生了什么。",
			],
			start: () => ({ stage: 2, event: "trade" }),
			task: {
				kind: "answer",
				prompt: [
					"Which event adds to the day's volume?",
					"哪个事件会计入当天的成交量？",
				],
				choices: [
					{ id: "trade", label: ["The trade", "成交"] },
					{ id: "cancel", label: ["The cancel", "撤单"] },
					{ id: "both", label: ["Both", "两者都会"] },
				],
				answer: "trade",
				done: [
					"Only a trade prints and counts in volume. A cancel changes the book without anyone trading.",
					"只有成交会打印并计入成交量。撤单改变的是订单簿，没有人成交。",
				],
			},
		},
		View: BookView,
	}),
] as const;

export function CheckpointExecutionWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="checkpoint-execution"
			label={[
				"Checkpoint for quotes, executions and sentiment",
				"“报价、成交与情绪分类”检查点",
			]}
			scenes={scenes}
			review
		/>
	);
}
