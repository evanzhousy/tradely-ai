import {
	type Contract,
	type Copy,
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
import {
	PRICE_LINE_HEIGHT,
	PriceLine,
} from "../walkthrough/instruments/price-line";
import { Label, Stage } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

/** The checkpoint's day: two weeks after the lessons' Monday, with ALFA higher. */
const ON = "2030-10-02";
const DAY: Copy = ["Wed Oct 2", "10月2日 周三"];
/** ALFA's quote that morning, in cents. */
const STOCK = { bid: 10_410, ask: 10_416, last: 10_412 };
const MID = (STOCK.bid + STOCK.ask) / 2;

// ——— Scene 1: selling shares right away ———

type QuoteState = { stage: 0 | 1 | 2; side: "buy" | "sell"; shares: number };

function QuoteBoard({
	width,
	state,
	locale,
}: {
	width: number;
	state: QuoteState;
	locale: Locale;
}) {
	const t = tr(locale);
	const price = state.side === "buy" ? STOCK.ask : STOCK.bid;
	const rows: { id: string; label: Copy; cents: number; on: boolean }[] = [
		{
			id: "bid",
			label: ["Bid", "买价"],
			cents: STOCK.bid,
			on: state.side === "sell",
		},
		{
			id: "ask",
			label: ["Ask", "卖价"],
			cents: STOCK.ask,
			on: state.side === "buy",
		},
		{
			id: "last",
			label: ["Last trade", "最新成交"],
			cents: STOCK.last,
			on: false,
		},
	];
	return (
		<g>
			<Label x={14} y={18} tone="muted">
				{t([`ALFA quote · ${DAY[0]}, 10:02`, `ALFA 报价 · ${DAY[1]} 10:02`])}
			</Label>
			{rows.map((row, i) => (
				<g key={row.id}>
					<rect
						x={10}
						y={30 + i * 34}
						width={width - 20}
						height={28}
						rx={6}
						className={
							row.on && state.stage >= 1 ? "wt-focus-shape" : "wt-panel-shape"
						}
					/>
					<Label x={22} y={49 + i * 34}>
						{t(row.label)}
					</Label>
					<Label
						x={width - 22}
						y={49 + i * 34}
						anchor="end"
						tone={row.on && state.stage >= 1 ? "accent" : undefined}
					>
						{usd(row.cents)}
					</Label>
				</g>
			))}
			{state.stage >= 1 ? (
				<Label x={14} y={150} maxWidth={width - 28}>
					{t([
						`${state.side === "buy" ? "Buy" : "Sell"} ${state.shares} right away: ${state.shares} × ${usd(price)} = ${usd(price * state.shares)}`,
						`立即${state.side === "buy" ? "买入" : "卖出"} ${state.shares} 股：${state.shares} × ${usd(price)} = ${usd(price * state.shares)}`,
					])}
				</Label>
			) : null}
			{state.stage >= 2 ? (
				<Label x={14} y={172} tone="small" maxWidth={width - 28}>
					{t([
						`a round trip costs ${usd(STOCK.ask - STOCK.bid)} a share: ${usd((STOCK.ask - STOCK.bid) * state.shares)} on ${state.shares}`,
						`一买一卖每股成本 ${usd(STOCK.ask - STOCK.bid)}：${state.shares} 股共 ${usd((STOCK.ask - STOCK.bid) * state.shares)}`,
					])}
				</Label>
			) : null}
		</g>
	);
}

function QuoteView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: QuoteState;
	explore: QuoteState | null;
	setExplore: (next: QuoteState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const price = shown.side === "buy" ? STOCK.ask : STOCK.bid;
	const result: ResultItem[] = [
		{
			id: "trade",
			label:
				shown.side === "buy"
					? t([`Buy ${shown.shares} now`, `立即买入 ${shown.shares} 股`])
					: t([`Sell ${shown.shares} now`, `立即卖出 ${shown.shares} 股`]),
			value: usd(price * shown.shares),
			note: t([
				`at the ${shown.side === "buy" ? "ask" : "bid"}, ${usd(price)}`,
				`按${shown.side === "buy" ? "卖价" : "买价"} ${usd(price)}`,
			]),
			evidence: "calculated",
		},
		{
			id: "round",
			label: t(["Round trip", "一买一卖"]),
			value: signedUsd(-(STOCK.ask - STOCK.bid) * shown.shares),
			tone: "loss",
			evidence: "calculated",
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"ALFA's quote on the checkpoint morning, and what trading right away gets or costs",
						"检查点当天上午 ALFA 的报价，以及立即交易能得到或要付出多少",
					])}
					height={() => 186}
				>
					{(width) => (
						<QuoteBoard width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<>
						<ChoiceField
							label={t(["Side", "方向"])}
							value={explore.side}
							options={[
								["sell", t(["Sell", "卖出"])],
								["buy", t(["Buy", "买入"])],
							]}
							onChange={(side) => setExplore({ ...explore, side })}
						/>
						<RangeControl
							label={t(["Shares", "股数"])}
							value={explore.shares}
							display={String(explore.shares)}
							min={10}
							max={200}
							step={10}
							onChange={(shares) => setExplore({ ...explore, shares })}
						/>
					</>
				) : null
			}
		/>
	);
}

// ——— Scenes 2 and 3: the same call from both sides ———

type PayoffState = { stage: 0 | 1 | 2; spot: number };

const CALL_105: Contract = { expiry: "oct18", strike: 105, right: "call" };
const CALL_QUOTE = quoteAt(CALL_105, Math.round(MID), ON);
const RANGE = [95, 125] as const;
/** Dollars a share at expiry. */
const worth = (spot: number) =>
	valueAtExpiry(CALL_105, Math.round(spot * 100)) / 100;
const buyer = (spot: number) => worth(spot) - CALL_QUOTE.ask / 100;
const writer = (spot: number) => CALL_QUOTE.bid / 100 - worth(spot);
const perContract = (perShare: number) =>
	signedUsd(Math.round(perShare * 100) * 100, 0);

function CallView({
	side,
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	side: "buyer" | "writer";
	locale: Locale;
	phase: Phase;
	state: PayoffState;
	explore: PayoffState | null;
	setExplore: (next: PayoffState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const f = side === "buyer" ? buyer : writer;
	const lines: PayoffLine[] =
		shown.stage >= 1
			? [
					{
						id: "profit",
						label:
							side === "buyer"
								? t(["buyer's profit", "买方盈亏"])
								: t(["Ben's profit", "Ben 的盈亏"]),
						points: [RANGE[0], 105, RANGE[1]].map(
							(spot) => [spot, f(spot) * 100] as const,
						),
						tone: side === "buyer" ? "long" : "short",
					},
				]
			: [];
	const markers: PayoffMarker[] =
		shown.stage >= 1
			? [
					{
						id: "at",
						x: shown.spot,
						y: f(shown.spot) * 100,
						label: perContract(f(shown.spot)),
						tone: f(shown.spot) >= 0 ? "gain" : "loss",
					},
				]
			: [];
	const price = side === "buyer" ? CALL_QUOTE.ask : CALL_QUOTE.bid;
	const result: ResultItem[] = [
		{
			id: "premium",
			label:
				side === "buyer"
					? t(["Paid, at the ask", "按卖价支付"])
					: t(["Collected, at the bid", "按买价收取"]),
			value: usd(price * 100, 0),
			note: t([`${usd(price)} × 100`, `${usd(price)} × 100`]),
		},
	];
	if (shown.stage >= 1)
		result.push({
			id: "profit",
			label: t([`At ALFA $${shown.spot}`, `ALFA $${shown.spot} 时`]),
			value: perContract(f(shown.spot)),
			note: t([
				`call worth ${usd(Math.round(worth(shown.spot) * 100))} a share`,
				`看涨每股值 ${usd(Math.round(worth(shown.spot) * 100))}`,
			]),
			tone: f(shown.spot) >= 0 ? "gain" : "loss",
			evidence: "calculated",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						side === "buyer"
							? "Profit at expiry for a buyer of the Oct 18 105 call bought on the checkpoint day"
							: "Profit at expiry for Ben, who wrote the Oct 18 105 call on the checkpoint day",
						side === "buyer"
							? "检查点当天买入 10月18日 105 看涨的买方，到期时的盈亏"
							: "检查点当天卖出 10月18日 105 看涨的 Ben，到期时的盈亏",
					])}
					height={(width) => (width < 520 ? 250 : 280)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 250 : 280}
							xRange={RANGE}
							yRange={side === "buyer" ? [-500, 2000] : [-2000, 500]}
							xTicks={[95, 105, 115, 125]}
							yTicks={side === "buyer" ? [0, 1000, 2000] : [-2000, -1000, 0]}
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
								`Oct 18 105 call ${usd(CALL_QUOTE.bid)} / ${usd(CALL_QUOTE.ask)} · ${DAY[0]} · per contract`,
								`10月18日 105 看涨 ${usd(CALL_QUOTE.bid)} / ${usd(CALL_QUOTE.ask)} · ${DAY[1]} · 每张`,
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
		/>
	);
}
const BuyerView = (props: Omit<Parameters<typeof CallView>[0], "side">) => (
	<CallView side="buyer" {...props} />
);
const WriterView = (props: Omit<Parameters<typeof CallView>[0], "side">) => (
	<CallView side="writer" {...props} />
);
const BUYER_AT = 109;
const WRITER_AT = 115;
/** The lowest whole-dollar price at which the buyer is ahead. */
const FIRST_PROFIT = Array.from({ length: 31 }, (_, i) => 95 + i).find(
	(spot) => buyer(spot) > 0,
);
/** The lowest whole-dollar price at which Ben's loss passes $1,000. */
const PAST_THOUSAND = Array.from({ length: 31 }, (_, i) => 95 + i).find(
	(spot) => writer(spot) * 100 < -1000,
);

// ——— Scene 4: a limit order in a wide spread ———

type OrderState = { stage: 0 | 1; limit: number };

const NOV_105: Contract = { expiry: "nov15", strike: 105, right: "call" };
const NOV_QUOTE = quoteAt(NOV_105, Math.round(MID), ON);
const LIMIT = (NOV_QUOTE.bid + NOV_QUOTE.ask) / 2;

function OrderView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: OrderState;
	explore: OrderState | null;
	setExplore: (next: OrderState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const fills = shown.limit >= NOV_QUOTE.ask;
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The Nov 15 105 call's bid and ask, and where a limit buy sits against them",
						"11月15日 105 看涨的买价与卖价，以及一张限价买单相对它们的位置",
					])}
					height={() => PRICE_LINE_HEIGHT}
				>
					{(width) => (
						<PriceLine
							width={width}
							min={(NOV_QUOTE.bid - 40) / 100}
							max={(NOV_QUOTE.ask + 40) / 100}
							ticks={[NOV_QUOTE.bid / 100, NOV_QUOTE.ask / 100]}
							tickLabel={(tick) => usd(Math.round(tick * 100))}
							header={t([
								`Nov 15 105 call · ${DAY[0]} · per share`,
								`11月15日 105 看涨 · ${DAY[1]} · 每股`,
							])}
							zone={{
								from: NOV_QUOTE.bid / 100,
								to: NOV_QUOTE.ask / 100,
								label: t(["bid to ask", "买价到卖价"]),
							}}
							marker={{
								value: shown.limit / 100,
								label: t([
									`your limit ${usd(shown.limit)}`,
									`你的限价 ${usd(shown.limit)}`,
								]),
								tone:
									shown.stage >= 1 ? (fills ? "gain" : "neutral") : "neutral",
							}}
							note={
								shown.stage >= 1
									? fills
										? t([
												`at the ask or above: fills at ${usd(NOV_QUOTE.ask)}`,
												`不低于卖价：立即以 ${usd(NOV_QUOTE.ask)} 成交`,
											])
										: t([
												"below the ask: it waits as a bid",
												"低于卖价：作为买单等待",
											])
									: undefined
							}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "fill",
					label: t(["Filled right away", "立即成交"]),
					value: t([
						fills ? "2 of 2" : "0 of 2",
						fills ? "2 张中 2 张" : "2 张中 0 张",
					]),
					tone: fills ? "gain" : "neutral",
				},
			]}
			controls={
				explore ? (
					<RangeControl
						label={t(["Your limit", "你的限价"])}
						value={explore.limit}
						display={usd(explore.limit)}
						min={NOV_QUOTE.bid - 20}
						max={NOV_QUOTE.ask + 20}
						step={5}
						onChange={(limit) => setExplore({ ...explore, limit })}
					/>
				) : null
			}
		/>
	);
}

// ——— Checkpoint ———

const scenes = [
	defineScene<QuoteState, QuoteState>({
		id: "quote",
		label: ["Sell shares", "卖出股票"],
		title: [
			"Trade at the quote, not the last price",
			"按报价成交，而不是最新价",
		],
		revisit: "stocks-and-prices",
		predict: {
			prompt: [
				`${DAY[0]}: ALFA shows bid ${usd(STOCK.bid)}, ask ${usd(STOCK.ask)}, last trade ${usd(STOCK.last)}. You sell 30 shares right away. What do you receive?`,
				`${DAY[1]}：ALFA 显示买价 ${usd(STOCK.bid)}、卖价 ${usd(STOCK.ask)}、最新成交 ${usd(STOCK.last)}。你立即卖出 30 股。你会收到多少？`,
			],
			choices: [
				{ id: "bid", label: [usd(STOCK.bid * 30), usd(STOCK.bid * 30)] },
				{ id: "last", label: [usd(STOCK.last * 30), usd(STOCK.last * 30)] },
				{ id: "ask", label: [usd(STOCK.ask * 30), usd(STOCK.ask * 30)] },
			],
			answer: "bid",
			entry: { answer: (STOCK.bid * 30) / 100, tolerance: 0.01, prefix: "$" },
			explain: [
				`Selling right away takes the best bid: 30 × ${usd(STOCK.bid)} = ${usd(STOCK.bid * 30)}. The last trade is history, and the ask is what sellers want.`,
				`立即卖出会成交在最优买价：30 × ${usd(STOCK.bid)} = ${usd(STOCK.bid * 30)}。最新成交是历史，卖价是卖方的要价。`,
			],
		},
		beats: [
			{
				id: "quote",
				label: ["The quote", "报价"],
				caption: [
					`${DAY[0]}, 10:02: ALFA is ${usd(STOCK.bid)} bid, ${usd(STOCK.ask)} ask, and last traded at ${usd(STOCK.last)}.`,
					`${DAY[1]} 10:02：ALFA 买价 ${usd(STOCK.bid)}、卖价 ${usd(STOCK.ask)}，最新成交 ${usd(STOCK.last)}。`,
				],
				state: { stage: 0, side: "sell", shares: 30 },
			},
			{
				id: "sell",
				label: ["Sell now", "立即卖出"],
				caption: [
					`Selling 30 right away takes the bid: ${usd(STOCK.bid * 30)}.`,
					`立即卖出 30 股成交在买价：${usd(STOCK.bid * 30)}。`,
				],
				state: { stage: 1, side: "sell", shares: 30 },
			},
			{
				id: "round",
				label: ["Round trip", "一买一卖"],
				caption: [
					`Buying them back right away costs ${usd(STOCK.ask * 30)}: the ${usd(STOCK.ask - STOCK.bid)} spread costs ${usd((STOCK.ask - STOCK.bid) * 30)} on 30 shares.`,
					`立即买回要 ${usd(STOCK.ask * 30)}：${usd(STOCK.ask - STOCK.bid)} 的价差，30 股就是 ${usd((STOCK.ask - STOCK.bid) * 30)}。`,
				],
				state: { stage: 2, side: "buy", shares: 30 },
			},
		],
		explore: {
			prompt: [
				"Choose a side and a size, and read what trading right away gets or costs.",
				"选择方向和数量，读出立即交易能得到或要付出多少。",
			],
			start: () => ({ stage: 2, side: "sell", shares: 30 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the smallest size at which a round trip costs more than $5.",
					"找出一买一卖成本超过 $5 的最小数量。",
				],
				reached: (e) => e.shares === 90,
				done: [
					`At ${usd(STOCK.ask - STOCK.bid)} a share, 90 shares cost ${usd((STOCK.ask - STOCK.bid) * 90)} round trip; 80 cost ${usd((STOCK.ask - STOCK.bid) * 80)}. The spread is a cost every time you trade right away.`,
					`每股 ${usd(STOCK.ask - STOCK.bid)}，90 股一买一卖要 ${usd((STOCK.ask - STOCK.bid) * 90)}；80 股是 ${usd((STOCK.ask - STOCK.bid) * 80)}。每次立即交易都要付出价差。`,
				],
			},
		},
		View: QuoteView,
	}),
	defineScene<PayoffState, PayoffState>({
		id: "buyer",
		label: ["Buy a call", "买入看涨"],
		title: [
			"A call pays above its strike, minus what it cost",
			"看涨在行权价以上赚钱，再减去成本",
		],
		revisit: "what-options-are",
		predict: {
			prompt: [
				`On ${DAY[0]} you buy the Oct 18 105 call at its ${usd(CALL_QUOTE.ask)} ask. ALFA ends Oct 18 at $${BUYER_AT}. What is your profit per contract?`,
				`${DAY[1]} 你按 ${usd(CALL_QUOTE.ask)} 的卖价买入 10月18日 105 看涨。10月18日 ALFA 收在 $${BUYER_AT}。每张盈亏多少？`,
			],
			choices: [
				{
					id: "profit",
					label: [perContract(buyer(BUYER_AT)), perContract(buyer(BUYER_AT))],
				},
				{
					id: "value",
					label: [perContract(worth(BUYER_AT)), perContract(worth(BUYER_AT))],
				},
				{
					id: "loss",
					label: [
						perContract(-CALL_QUOTE.ask / 100),
						perContract(-CALL_QUOTE.ask / 100),
					],
				},
			],
			answer: "profit",
			entry: {
				answer: Math.round(buyer(BUYER_AT) * 100),
				tolerance: 1,
				prefix: "$",
			},
			revealAt: 2,
			explain: [
				`At $${BUYER_AT} the call is worth $${BUYER_AT - 105} a share, $${(BUYER_AT - 105) * 100} a contract. Less the ${usd(CALL_QUOTE.ask * 100, 0)} paid: ${perContract(buyer(BUYER_AT))}.`,
				`$${BUYER_AT} 时看涨每股值 $${BUYER_AT - 105}，每张 $${(BUYER_AT - 105) * 100}。减去已付的 ${usd(CALL_QUOTE.ask * 100, 0)}：${perContract(buyer(BUYER_AT))}。`,
			],
		},
		beats: [
			{
				id: "cost",
				label: ["The cost", "成本"],
				caption: [
					`The Oct 18 105 call asks ${usd(CALL_QUOTE.ask)}: ${usd(CALL_QUOTE.ask * 100, 0)} for one contract.`,
					`10月18日 105 看涨卖价 ${usd(CALL_QUOTE.ask)}：一张 ${usd(CALL_QUOTE.ask * 100, 0)}。`,
				],
				state: { stage: 0, spot: BUYER_AT },
			},
			{
				id: "line",
				label: ["At expiry", "到期时"],
				caption: [
					`At expiry it pays ALFA minus $105, or nothing. Its profit line starts at ${perContract(-CALL_QUOTE.ask / 100)} and climbs $100 for each dollar above $105.`,
					`到期时它支付 ALFA 减 $105，否则为零。盈亏线从 ${perContract(-CALL_QUOTE.ask / 100)} 开始，在 $105 以上每多一美元增加 $100。`,
				],
				state: { stage: 1, spot: 105 },
			},
			{
				id: "at",
				label: [`At $${BUYER_AT}`, `$${BUYER_AT} 时`],
				caption: [
					`At $${BUYER_AT}: ${usd((BUYER_AT - 105) * 10000, 0)} of value less ${usd(CALL_QUOTE.ask * 100, 0)} paid is ${perContract(buyer(BUYER_AT))}.`,
					`$${BUYER_AT} 时：价值 ${usd((BUYER_AT - 105) * 10000, 0)}，减去已付 ${usd(CALL_QUOTE.ask * 100, 0)}，为 ${perContract(buyer(BUYER_AT))}。`,
				],
				state: { stage: 2, spot: BUYER_AT },
			},
		],
		explore: {
			prompt: ["Drag ALFA's expiry price.", "拖动 ALFA 的到期价格。"],
			start: () => ({ stage: 2, spot: 105 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the lowest whole-dollar price at which the buyer is ahead.",
					"找出买方开始盈利的最低整数美元价格。",
				],
				reached: (e) => e.spot === FIRST_PROFIT,
				done: [
					`Break-even is $105 + ${usd(CALL_QUOTE.ask)} = ${usd(10500 + CALL_QUOTE.ask)}, so $${FIRST_PROFIT} is the first whole dollar in profit: ${perContract(buyer(FIRST_PROFIT ?? 0))}.`,
					`盈亏平衡点是 $105 + ${usd(CALL_QUOTE.ask)} = ${usd(10500 + CALL_QUOTE.ask)}，所以 $${FIRST_PROFIT} 是第一个盈利的整数美元：${perContract(buyer(FIRST_PROFIT ?? 0))}。`,
				],
			},
		},
		View: BuyerView,
	}),
	defineScene<PayoffState, PayoffState>({
		id: "writer",
		label: ["The writer", "义务方"],
		title: [
			"The writer keeps the premium and owes the rest",
			"义务方保留权利金，承担其余",
		],
		revisit: "options-risks",
		predict: {
			prompt: [
				`Ben wrote that call at its ${usd(CALL_QUOTE.bid)} bid without owning ALFA. ALFA ends Oct 18 at $${WRITER_AT}. What is Ben's result per contract?`,
				`Ben 在不持有 ALFA 的情况下，按 ${usd(CALL_QUOTE.bid)} 的买价卖出了这张看涨。10月18日 ALFA 收在 $${WRITER_AT}。Ben 每张的结果是多少？`,
			],
			choices: [
				{
					id: "loss",
					label: [
						perContract(writer(WRITER_AT)),
						perContract(writer(WRITER_AT)),
					],
				},
				{
					id: "keep",
					label: [
						perContract(CALL_QUOTE.bid / 100),
						perContract(CALL_QUOTE.bid / 100),
					],
				},
				{
					id: "capped",
					label: [
						perContract(-CALL_QUOTE.bid / 100),
						perContract(-CALL_QUOTE.bid / 100),
					],
				},
			],
			answer: "loss",
			entry: {
				answer: Math.round(writer(WRITER_AT) * 100),
				tolerance: 1,
				prefix: "$",
			},
			revealAt: 2,
			explain: [
				`Ben owes ALFA minus $105, $${WRITER_AT - 105} a share, and keeps the ${usd(CALL_QUOTE.bid)} he collected: ${perContract(writer(WRITER_AT))}. The premium is the most he can make; the loss keeps growing as ALFA rises.`,
				`Ben 要付 ALFA 减 $105，每股 $${WRITER_AT - 105}，同时保留收取的 ${usd(CALL_QUOTE.bid)}：${perContract(writer(WRITER_AT))}。权利金是他最多能赚的；ALFA 越涨，亏损越大。`,
			],
		},
		beats: [
			{
				id: "collect",
				label: ["He collects", "收取"],
				caption: [
					`Ben sells the call at its ${usd(CALL_QUOTE.bid)} bid and collects ${usd(CALL_QUOTE.bid * 100, 0)}.`,
					`Ben 按 ${usd(CALL_QUOTE.bid)} 的买价卖出看涨，收取 ${usd(CALL_QUOTE.bid * 100, 0)}。`,
				],
				state: { stage: 0, spot: WRITER_AT },
			},
			{
				id: "line",
				label: ["At expiry", "到期时"],
				caption: [
					"At or below $105 he keeps it all. Above, he owes $100 for each dollar, with no ceiling.",
					"$105 及以下他全部保留。高于 $105，每多一美元要付 $100，没有上限。",
				],
				state: { stage: 1, spot: 105 },
			},
			{
				id: "at",
				label: [`At $${WRITER_AT}`, `$${WRITER_AT} 时`],
				caption: [
					`At $${WRITER_AT}: ${usd(CALL_QUOTE.bid * 100, 0)} collected less ${usd((WRITER_AT - 105) * 10000, 0)} owed is ${perContract(writer(WRITER_AT))}.`,
					`$${WRITER_AT} 时：收取 ${usd(CALL_QUOTE.bid * 100, 0)}，减去应付 ${usd((WRITER_AT - 105) * 10000, 0)}，为 ${perContract(writer(WRITER_AT))}。`,
				],
				state: { stage: 2, spot: WRITER_AT },
			},
		],
		explore: {
			prompt: ["Drag ALFA's expiry price.", "拖动 ALFA 的到期价格。"],
			start: () => ({ stage: 2, spot: 105 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the lowest whole-dollar price at which Ben's loss passes $1,000.",
					"找出 Ben 的亏损超过 $1,000 的最低整数美元价格。",
				],
				reached: (e) => e.spot === PAST_THOUSAND,
				done: [
					`At $${PAST_THOUSAND} Ben is at ${perContract(writer(PAST_THOUSAND ?? 0))}. Every dollar higher costs him another $100: a writer's loss has no fixed limit.`,
					`$${PAST_THOUSAND} 时 Ben 为 ${perContract(writer(PAST_THOUSAND ?? 0))}。再高一美元就再多亏 $100：义务方的亏损没有固定上限。`,
				],
			},
		},
		View: WriterView,
	}),
	defineScene<OrderState, OrderState>({
		id: "order",
		label: ["A limit order", "限价单"],
		title: ["Below the ask, a limit buy waits", "低于卖价，限价买单就要等待"],
		revisit: "trading-options",
		predict: {
			prompt: [
				`The Nov 15 105 call is ${usd(NOV_QUOTE.bid)} bid, ${usd(NOV_QUOTE.ask)} ask. You send a limit buy for 2 at ${usd(LIMIT)}. How many fill right away?`,
				`11月15日 105 看涨买价 ${usd(NOV_QUOTE.bid)}、卖价 ${usd(NOV_QUOTE.ask)}。你发出 2 张、限价 ${usd(LIMIT)} 的买单。立即成交几张？`,
			],
			choices: [
				{
					id: "none",
					label: ["None: it waits as a bid", "0 张：作为买单等待"],
				},
				{
					id: "all",
					label: [`Both, at ${usd(LIMIT)}`, `2 张，价格 ${usd(LIMIT)}`],
				},
				{
					id: "ask",
					label: [
						`Both, at ${usd(NOV_QUOTE.ask)}`,
						`2 张，价格 ${usd(NOV_QUOTE.ask)}`,
					],
				},
			],
			answer: "none",
			entry: { answer: 0, unit: [" contracts", " 张"] },
			revealAt: 1,
			explain: [
				`No seller is offering ${usd(LIMIT)}, so the order joins the book as the new best bid and waits. It fills only if a seller comes down to it.`,
				`没有卖方愿意以 ${usd(LIMIT)} 出售，所以这张单作为新的最优买价进入订单簿等待。只有卖方降到这个价格才会成交。`,
			],
		},
		beats: [
			{
				id: "quote",
				label: ["The quote", "报价"],
				caption: [
					`The Nov 15 105 call is ${usd(NOV_QUOTE.bid)} bid, ${usd(NOV_QUOTE.ask)} ask. Your limit buy at ${usd(LIMIT)} sits between them.`,
					`11月15日 105 看涨买价 ${usd(NOV_QUOTE.bid)}、卖价 ${usd(NOV_QUOTE.ask)}。你 ${usd(LIMIT)} 的限价买单在两者之间。`,
				],
				state: { stage: 0, limit: LIMIT },
			},
			{
				id: "wait",
				label: ["It waits", "等待"],
				caption: [
					"Below the ask, nothing fills. The order rests as the best bid until a seller accepts it, or never.",
					"低于卖价就不会成交。这张单作为最优买价挂着，直到有卖方接受，或者永远不成交。",
				],
				state: { stage: 1, limit: LIMIT },
			},
		],
		explore: {
			prompt: ["Move your limit price.", "移动你的限价。"],
			start: () => ({ stage: 1, limit: LIMIT }),
			task: {
				kind: "reach",
				prompt: [
					"Find the lowest limit price that fills right away.",
					"找出能立即成交的最低限价。",
				],
				reached: (e) => e.limit === NOV_QUOTE.ask,
				done: [
					`At ${usd(NOV_QUOTE.ask)}, the ask, the order fills at once. Any lower and it waits; any higher still fills at the ask, never above it.`,
					`在卖价 ${usd(NOV_QUOTE.ask)}，订单立即成交。再低就要等待；再高也只会按卖价成交，不会更高。`,
				],
			},
		},
		View: OrderView,
	}),
] as const;

export function CheckpointOrientationWalkthrough({
	locale,
}: {
	locale: Locale;
}) {
	return (
		<Walkthrough
			locale={locale}
			id="checkpoint-orientation"
			label={["Checkpoint for Start here", "“从这里开始”检查点"]}
			scenes={scenes}
			review
		/>
	);
}
