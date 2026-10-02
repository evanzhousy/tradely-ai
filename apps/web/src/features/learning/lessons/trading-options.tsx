import { FieldGroup } from "@tradely/ui/components/field";
import {
	type Contract,
	type Copy,
	contractLabel,
	count,
	type ExpiryId,
	expiries,
	optionQuote,
	pick,
	signedUsd,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import {
	ChainGrid,
	type ChainRow,
	chainHeight,
} from "../walkthrough/instruments/chain-grid";
import {
	type BookLevel,
	bookHeight,
	OrderBook,
} from "../walkthrough/instruments/order-book";
import {
	type FlowParty,
	type FlowTransfer,
	TransferFlow,
	transferFlowHeight,
} from "../walkthrough/instruments/transfer-flow";
import { Stage } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);
const FEE = 65;

// ——— Scene 1: read a chain ———

const chainExpiries: readonly ExpiryId[] = ["sep20", "oct18", "nov15"];
const strikes = [90, 95, 100, 105, 110];
type ChainState = { expiry: ExpiryId; strike: number; right: "call" | "put" };

function chainRows(expiry: ExpiryId): ChainRow[] {
	return strikes.map((strike) => ({
		strike,
		call: optionQuote({ expiry, strike, right: "call" }),
		put: optionQuote({ expiry, strike, right: "put" }),
	}));
}

function ChainView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ChainState;
	explore: ChainState | null;
	setExplore: (next: ChainState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const contract: Contract = shown;
	const quote = optionQuote(contract);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"ALFA's option chain for one expiry: calls left, puts right, strikes in the middle",
						"ALFA 某一到期日的期权链：左侧看涨，右侧看跌，中间为行权价",
					])}
					height={chainHeight(strikes.length)}
				>
					{(width) => (
						<ChainGrid
							width={width}
							expiries={chainExpiries.map((id) => ({
								id,
								label: t(expiries[id].label),
							}))}
							expiry={shown.expiry}
							rows={chainRows(shown.expiry)}
							spot={100}
							selected={{ strike: shown.strike, right: shown.right }}
							labels={{
								calls: t(["Calls · bid / ask", "看涨 · 买价 / 卖价"]),
								puts: t(["Puts · bid / ask", "看跌 · 买价 / 卖价"]),
								strike: t(["Strike", "行权价"]),
							}}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "contract",
					label: t(["Contract", "合约"]),
					value: t(contractLabel(contract)),
				},
				{
					id: "quote",
					label: t(["Bid / ask", "买价 / 卖价"]),
					value: `${usd(quote.bid)} / ${usd(quote.ask)}`,
					note: t(["per share", "每股"]),
				},
				{
					id: "cost",
					label: t(["One contract at the ask", "按卖价买一张"]),
					value: usd(quote.ask * 100, 0),
					note: t([
						`${usd(quote.ask)} × 100 shares`,
						`${usd(quote.ask)} × 100 股`,
					]),
				},
			]}
			controls={
				explore ? (
					<FieldGroup>
						<ChoiceField
							label={t(["Expiry", "到期日"])}
							value={explore.expiry}
							options={chainExpiries.map(
								(id) => [id, t(expiries[id].label)] as const,
							)}
							onChange={(expiry) => setExplore({ ...explore, expiry })}
						/>
						<ChoiceField
							label={t(["Right", "类型"])}
							value={explore.right}
							options={[
								["call", t(["Call", "看涨"])],
								["put", t(["Put", "看跌"])],
							]}
							onChange={(right) => setExplore({ ...explore, right })}
						/>
						<RangeControl
							label={t(["Strike", "行权价"])}
							value={explore.strike}
							display={`$${explore.strike}`}
							min={90}
							max={110}
							step={5}
							onChange={(strike) => setExplore({ ...explore, strike })}
						/>
					</FieldGroup>
				) : null
			}
			details={
				<p>
					{t([
						"Shaded cells are in the money with ALFA at $100: calls below the strike, puts above it. Quotes are per share and come from the course's fictional ALFA world.",
						"阴影单元格在 ALFA 为 $100 时处于价内：行权价低于股价的看涨、高于股价的看跌。报价按每股计，来自课程中虚构的 ALFA 市场。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: market or limit ———

const thin: Contract = { expiry: "dec20", strike: 110, right: "call" };
const thinBook = {
	asks: [
		{ price: 265, size: 3 },
		{ price: 275, size: 5 },
		{ price: 290, size: 8 },
	],
	bids: [
		{ price: 220, size: 4 },
		{ price: 210, size: 6 },
		{ price: 195, size: 10 },
	],
};

type OrderState = {
	kind: "none" | "market" | "limit";
	limit: number;
	/** A seller has arrived at the limit price. */
	filledByArrival: boolean;
};

function orderOutcome(state: OrderState) {
	const bestAsk = thinBook.asks[0].price;
	if (state.kind === "market") return { fill: bestAsk, resting: false };
	if (state.kind === "limit") {
		if (state.limit >= bestAsk) return { fill: bestAsk, resting: false };
		return {
			fill: state.filledByArrival ? state.limit : null,
			resting: !state.filledByArrival,
		};
	}
	return { fill: null, resting: false };
}

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
	const outcome = orderOutcome(shown);
	const takesAsk = outcome.fill === thinBook.asks[0].price;
	const asks: BookLevel[] = thinBook.asks.map((level, i) =>
		i === 0 && takesAsk
			? { ...level, size: level.size - 1, before: level.size }
			: level,
	);
	const showMine = shown.kind === "limit" && !takesAsk;
	const bids: BookLevel[] = [
		...(showMine
			? [
					{
						price: shown.limit,
						size: outcome.resting ? 1 : 0,
						before: outcome.resting ? undefined : 1,
						mine: true,
					},
				]
			: []),
		...thinBook.bids,
	];
	const orderLabel =
		shown.kind === "none"
			? t(["none yet", "尚未下单"])
			: shown.kind === "market"
				? t(["market buy 1", "市价买入 1 张"])
				: t([
						`limit buy 1 at ${usd(shown.limit)}`,
						`限价 ${usd(shown.limit)} 买入 1 张`,
					]);
	const result: ResultItem[] = [
		{
			id: "order",
			label: t(["Your order", "你的订单"]),
			value: orderLabel,
			note: t(contractLabel(thin)),
		},
		{
			id: "fill",
			label: t(["Fill", "成交"]),
			value:
				outcome.fill !== null
					? usd(outcome.fill)
					: outcome.resting
						? t(["waiting", "等待中"])
						: "—",
			note:
				outcome.fill !== null
					? t([
							`${usd(outcome.fill * 100, 0)} + ${usd(FEE)} fee`,
							`${usd(outcome.fill * 100, 0)} + ${usd(FEE)} 费用`,
						])
					: outcome.resting
						? t(["may never fill", "可能永远不成交"])
						: undefined,
			evidence: outcome.resting ? "unknown" : undefined,
		},
		{
			id: "spread",
			label: t(["Spread", "价差"]),
			value: usd(thinBook.asks[0].price - thinBook.bids[0].price),
			note: t(["$45 on one contract", "一张合约 $45"]),
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The order book of a thinly traded call, with your order in it",
						"一份交易清淡的看涨期权的订单簿，以及其中你的订单",
					])}
					height={bookHeight(showMine ? 4 : 3, 3)}
				>
					{(width) => (
						<OrderBook
							width={width}
							bids={bids}
							asks={asks}
							fills={
								takesAsk
									? [{ price: thinBook.asks[0].price, size: 1 }]
									: outcome.fill !== null && showMine
										? [{ price: shown.limit, size: 1 }]
										: []
							}
							sizeMax={10}
							labels={{
								bid: t(["Bids · contracts", "买单 · 张"]),
								ask: t(["Asks · contracts", "卖单 · 张"]),
								price: t(["Price", "价格"]),
								spread: t(["spread", "价差"]),
								last: t(["last", "最新"]),
								filled: (size) =>
									t([`filled ${count(size)}`, `成交 ${count(size)}`]),
								mine: t(["your order", "你的订单"]),
							}}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<FieldGroup>
						<ChoiceField
							label={t(["Order type", "订单类型"])}
							value={explore.kind === "none" ? "limit" : explore.kind}
							options={[
								["market", t(["Market", "市价"])],
								["limit", t(["Limit", "限价"])],
							]}
							onChange={(kind) =>
								setExplore({ ...explore, kind, filledByArrival: false })
							}
						/>
						{explore.kind === "limit" ? (
							<RangeControl
								label={t(["Your limit price", "你的限价"])}
								value={explore.limit}
								display={usd(explore.limit)}
								min={200}
								max={275}
								step={5}
								onChange={(limit) =>
									setExplore({ ...explore, limit, filledByArrival: false })
								}
							/>
						) : null}
					</FieldGroup>
				) : null
			}
			details={
				<p>
					{t([
						"A limit order at or above the ask is marketable and fills at once, at the ask or better. Below the ask it waits and may never fill. Fees here are $0.65 per contract; brokers differ.",
						"限价等于或高于卖价的限价单可立即成交，成交价为卖价或更优。低于卖价时它会等待，也可能永远不成交。本例每张合约费用 $0.65，各券商不同。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: how it ends ———

const nov105: Contract = { expiry: "nov15", strike: 105, right: "call" };
type Route = "hold" | "sell" | "expire" | "exercise";
type EndState = { route: Route };

function routeFacts(route: Route) {
	const paid = optionQuote(nov105).ask * 100 + FEE;
	if (route === "sell")
		return { cash: 370 * 100 - FEE, result: 370 * 100 - FEE - paid };
	if (route === "expire") return { cash: 0, result: -paid };
	if (route === "exercise")
		return { cash: 0, result: (112 - 105) * 100 * 100 - paid };
	return { cash: 0, result: -paid };
}

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
	const paid = optionQuote(nov105).ask * 100 + FEE;
	const facts = routeFacts(shown.route);
	const counterpart =
		shown.route === "sell"
			? {
					name: t(["A buyer", "某买方"]),
					role: t(["in the market", "市场中的交易者"]),
				}
			: shown.route === "exercise"
				? {
						name: t(["A writer", "某义务方"]),
						role: t(["assigned by clearing", "由清算机构指派"]),
					}
				: {
						name: t(["The market", "市场"]),
						role: t(["nothing moves", "无任何流动"]),
					};
	const transfers: FlowTransfer[] =
		shown.route === "sell"
			? [
					{
						id: "call",
						from: "you",
						to: "other",
						label: t(["1 call", "1 张看涨"]),
						kind: "contract",
					},
					{ id: "cash", from: "other", to: "you", label: "$370", kind: "cash" },
				]
			: shown.route === "exercise"
				? [
						{
							id: "cash",
							from: "you",
							to: "other",
							label: "$10,500",
							kind: "cash",
						},
						{
							id: "shares",
							from: "other",
							to: "you",
							label: t(["100 shares", "100 股"]),
							kind: "shares",
						},
					]
				: [];
	const parties: [FlowParty, FlowParty] = [
		{
			id: "you",
			name: t(["You", "你"]),
			role: t(["long 1 Nov 15 105 call", "多头 1 张 11月15日 105 看涨"]),
			holdings:
				shown.route === "hold"
					? [t([`paid ${usd(paid)}`, `支付 ${usd(paid)}`])]
					: [
							t([
								`result ${signedUsd(facts.result)}`,
								`结果 ${signedUsd(facts.result)}`,
							]),
						],
		},
		{
			id: "other",
			name: counterpart.name,
			role: counterpart.role,
			holdings: [],
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Three ways a long call can end: sold, expired or exercised",
						"多头看涨期权的三种结束方式：卖出、到期作废或行权",
					])}
					height={(width) => transferFlowHeight(width, 2)}
				>
					{(width) => (
						<TransferFlow
							width={width}
							parties={parties}
							transfers={transfers}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "paid",
					label: t(["You paid", "你支付"]),
					value: usd(paid),
					note: t(["$3.25 ask + $0.65 fee", "卖价 $3.25 + 费用 $0.65"]),
				},
				{
					id: "result",
					label: t(["Result", "结果"]),
					value: shown.route === "hold" ? "—" : signedUsd(facts.result),
					tone:
						shown.route === "hold"
							? undefined
							: facts.result > 0
								? "gain"
								: "loss",
				},
				{
					id: "route",
					label: t(["Route", "方式"]),
					value:
						shown.route === "sell"
							? t(["sell to close", "卖出平仓"])
							: shown.route === "expire"
								? t(["expire", "到期作废"])
								: shown.route === "exercise"
									? t(["exercise", "行权"])
									: t(["open", "持仓中"]),
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["How it ends", "结束方式"])}
						value={explore.route === "hold" ? "sell" : explore.route}
						options={[
							["sell", t(["Sell to close", "卖出平仓"])],
							["expire", t(["Expire", "到期作废"])],
							["exercise", t(["Exercise", "行权"])],
						]}
						onChange={(route) => setExplore({ route })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Most traders sell to close: it is one trade, and before expiry it keeps the time value that exercising would give up. Exercising needs cash for the shares, $10,500 here. Exercise fees vary by broker and are ignored.",
						"多数交易者会卖出平仓：只需一笔交易，而且在到期前能保留行权会放弃的时间价值。行权需要准备买股票的现金，这里是 $10,500。行权费用因券商而异，此处未计。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<ChainState, ChainState>({
		id: "chain",
		label: ["Read a chain", "读懂期权链"],
		title: [
			"Every contract has its own row and its own price",
			"每份合约都有自己的一行和自己的价格",
		],
		predict: {
			prompt: [
				"Which costs more: the Oct 18 100 call or the Nov 15 100 call?",
				"哪个更贵：10月18日 100 看涨，还是 11月15日 100 看涨？",
			],
			choices: [
				{
					id: "later",
					label: ["The Nov 15 call: more time", "11月15日：时间更长"],
				},
				{
					id: "sooner",
					label: ["The Oct 18 call: it's sooner", "10月18日：更快到期"],
				},
				{ id: "same", label: ["They cost the same", "价格相同"] },
			],
			answer: "later",
			explain: [
				"More time until expiry gives ALFA more chance to move above the strike, so the same strike costs more for a later expiry.",
				"距到期时间越长，ALFA 涨过行权价的机会越大，所以相同行权价下，到期越晚越贵。",
			],
		},
		beats: [
			{
				id: "oct",
				label: ["Oct 18 100 call", "10月18日 100 看涨"],
				caption: [
					"The chain lists every ALFA contract by expiry and strike. The Oct 18 100 call is quoted $4.05 bid and $4.20 ask per share.",
					"期权链按到期日与行权价列出每份 ALFA 合约。10月18日 100 看涨的报价是买价 $4.05、卖价 $4.20（每股）。",
				],
				state: { expiry: "oct18", strike: 100, right: "call" },
			},
			{
				id: "nov",
				label: ["More time", "更长时间"],
				caption: [
					"Switch to Nov 15 and the same strike asks $5.45: four more weeks give ALFA more time to move, so the right costs more.",
					"切换到 11月15日，同一行权价的卖价是 $5.45：多出四周，ALFA 有更多时间变动，这项权利也更贵。",
				],
				state: { expiry: "nov15", strike: 100, right: "call" },
			},
			{
				id: "put",
				label: ["A put", "看跌期权"],
				caption: [
					"Puts sit on the right of the same strikes. The Oct 18 95 put is $2.05 bid, $2.15 ask: $215 for one contract.",
					"看跌期权在同一行权价的右侧。10月18日 95 看跌为买价 $2.05、卖价 $2.15：一张 $215。",
				],
				state: { expiry: "oct18", strike: 95, right: "put" },
			},
		],
		explore: {
			prompt: [
				"Pick an expiry, a strike and a call or put, and read its quote and what one contract costs.",
				"选择到期日、行权价以及看涨或看跌，读出报价和一张合约的成本。",
			],
			start: (last) => last,
			task: {
				kind: "reach",
				prompt: [
					"In the Oct 18 chain, find the call that costs the same as this put: $215 for one contract.",
					"在 10月18日 的期权链中，找出与这份看跌期权价格相同的看涨期权：一张 $215。",
				],
				reached: (e) =>
					e.expiry === "oct18" && e.right === "call" && e.strike === 105,
				done: [
					"The Oct 18 105 call asks $2.15 too: $215 for 100 shares. A call above the stock and a put below it can cost the same; each row has its own price.",
					"10月18日 105 看涨的卖价也是 $2.15：100 股共 $215。高于股价的看涨和低于股价的看跌可以价格相同；每一行都有自己的价格。",
				],
			},
		},
		View: ChainView,
	}),
	defineScene<OrderState, OrderState>({
		id: "orders",
		label: ["Market or limit", "市价或限价"],
		title: [
			"A limit order protects you in a wide spread",
			"价差很宽时，限价单能保护你",
		],
		predict: {
			prompt: [
				"The quote is $2.20 bid, $2.65 ask. You send a limit buy for 2 contracts at $2.40. How many fill right away?",
				"报价为买价 $2.20、卖价 $2.65。你发出 2 张、限价 $2.40 的买单。立即成交几张？",
			],
			choices: [
				{
					id: "wait",
					label: [
						"None: it waits as the new best bid",
						"0 张：它作为新的最优买价等待",
					],
				},
				{ id: "ask", label: ["Both, at $2.65", "2 张，价格 $2.65"] },
				{ id: "limit", label: ["Both, at $2.40", "2 张，价格 $2.40"] },
			],
			answer: "wait",
			entry: { answer: 0, unit: [" contracts", " 张"] },
			revealAt: 2,
			explain: [
				"No seller is offering $2.40 yet, so a limit below the ask waits in the book. It fills only if a seller comes down to $2.40, and it may never fill.",
				"目前没有卖方愿以 $2.40 出售，所以低于卖价的限价单会在订单簿中等待。只有卖方降到 $2.40 才会成交，也可能永远不成交。",
			],
		},
		beats: [
			{
				id: "quote",
				label: ["A thin market", "清淡的市场"],
				caption: [
					"A thinly traded contract: the Dec 20 110 call shows $2.20 bid and $2.65 ask, with only a few contracts on each side.",
					"一份交易清淡的合约：12月20日 110 看涨显示买价 $2.20、卖价 $2.65，两边都只有几张。",
				],
				state: { kind: "none", limit: 240, filledByArrival: false },
			},
			{
				id: "market",
				label: ["Market order", "市价单"],
				caption: [
					"A market buy takes the ask at once: $2.65, or $265 for one contract. Fast, but it pays the whole spread.",
					"市价买单立即接受卖价：$2.65，一张 $265。成交快，但要付出整个价差。",
				],
				state: { kind: "market", limit: 240, filledByArrival: false },
			},
			{
				id: "limit",
				label: ["Limit order", "限价单"],
				caption: [
					"A limit buy at $2.40 never pays more than $2.40. It joins the book as the new best bid and waits for a seller.",
					"$2.40 的限价买单绝不会付出高于 $2.40 的价格。它作为新的最优买价进入订单簿，等待卖方。",
				],
				state: { kind: "limit", limit: 240, filledByArrival: false },
			},
			{
				id: "filled",
				label: ["A seller arrives", "卖方到来"],
				caption: [
					"If a seller accepts $2.40, your order fills and you save $25. If none does, it never fills: price is in your control, timing is not.",
					"如果有卖方接受 $2.40，你的订单成交，省下 $25。如果没有，它就不会成交：价格由你决定，时间则不然。",
				],
				state: { kind: "limit", limit: 240, filledByArrival: true },
			},
		],
		explore: {
			prompt: [
				"Try a market order, or set a limit price and see whether it fills at once or waits.",
				"试试市价单，或设定限价，看看它是立即成交还是等待。",
			],
			start: () => ({ kind: "limit", limit: 250, filledByArrival: false }),
			task: {
				kind: "reach",
				prompt: [
					"Set the lowest limit price that still fills right away.",
					"设定仍能立即成交的最低限价。",
				],
				reached: (e) => e.kind === "limit" && e.limit === 265,
				done: [
					"A buy limit at or above the $2.65 ask fills at once, at the ask. One step lower and it joins the book as a bid, filling only if a seller comes down to it.",
					"买入限价等于或高于 $2.65 的卖价就会立即成交，成交价为卖价。再低一档，它就作为买单进入订单簿，只有卖方降到这个价才会成交。",
				],
			},
		},
		View: OrderView,
	}),
	defineScene<EndState, EndState>({
		id: "lifecycle",
		label: ["How it ends", "如何结束"],
		title: [
			"Most option positions end with a sale, not exercise",
			"多数期权持仓以卖出结束，而非行权",
		],
		predict: {
			prompt: [
				"You own the call and want out before expiry. What do most traders do?",
				"你持有看涨期权，想在到期前退出。多数交易者会怎么做？",
			],
			choices: [
				{ id: "sell", label: ["Sell it to close", "卖出平仓"] },
				{ id: "exercise", label: ["Exercise it", "行权"] },
				{
					id: "wait",
					label: ["Wait for the broker to close it", "等券商帮你平仓"],
				},
			],
			answer: "sell",
			explain: [
				"Selling to close is one trade that returns the option's current value, including time value that exercising would throw away.",
				"卖出平仓只需一笔交易，就能收回期权的当前价值，其中包括行权会丢掉的时间价值。",
			],
		},
		beats: [
			{
				id: "hold",
				label: ["You own the call", "持有看涨"],
				caption: [
					"You buy the Nov 15 105 call at the $3.25 ask plus a $0.65 fee: $325.65. The position can end in three ways.",
					"你以卖价 $3.25 加 $0.65 费用买入 11月15日 105 看涨：共 $325.65。这笔持仓有三种结束方式。",
				],
				state: { route: "hold" },
			},
			{
				id: "sell",
				label: ["Sell to close", "卖出平仓"],
				caption: [
					"Sell to close: on Oct 11 the call bids $3.70, so you receive $370 minus a $0.65 fee. Result +$43.70.",
					"卖出平仓：10月11日 看涨买价为 $3.70，你收回 $370 减去 $0.65 费用。结果 +$43.70。",
				],
				state: { route: "sell" },
			},
			{
				id: "expire",
				label: ["Expire", "到期作废"],
				caption: [
					"Let it expire: if ALFA ends Nov 15 at $103, below the strike, the call is worthless and nothing moves. Result −$325.65.",
					"任其到期：若 ALFA 在 11月15日 收于 $103，低于行权价，看涨作废，不发生任何流动。结果 −$325.65。",
				],
				state: { route: "expire" },
			},
			{
				id: "exercise",
				label: ["Exercise", "行权"],
				caption: [
					"Exercise: if ALFA ends at $112, you pay $10,500 for 100 shares worth $11,200. Result +$374.35 before other fees.",
					"行权：若 ALFA 收于 $112，你支付 $10,500 买入价值 $11,200 的 100 股。结果 +$374.35（未计其他费用）。",
				],
				state: { route: "exercise" },
			},
		],
		explore: {
			prompt: [
				"Compare the three endings and what moves in each.",
				"比较三种结束方式，以及每种方式中流动的东西。",
			],
			start: () => ({ route: "sell" }),
			task: {
				kind: "answer",
				prompt: [
					"Which ending needs $10,500 of cash in your account?",
					"哪种结束方式需要你账户里有 $10,500 现金？",
				],
				choices: [
					{ id: "exercise", label: ["Exercise", "行权"] },
					{ id: "sell", label: ["Sell to close", "卖出平仓"] },
					{ id: "expire", label: ["Expire", "到期作废"] },
				],
				answer: "exercise",
				done: [
					"Exercising the 105 call buys 100 shares at $105: $10,500. Selling to close brings cash in instead, and letting it expire moves nothing.",
					"行使 105 看涨意味着以 $105 买入 100 股：$10,500。卖出平仓反而会收回现金，到期作废则什么都不动。",
				],
			},
		},
		View: EndView,
	}),
] as const;

export function TradingOptionsWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="trading-options"
			label={["Interactive lesson on trading an option", "期权交易互动课"]}
			scenes={scenes}
		/>
	);
}
