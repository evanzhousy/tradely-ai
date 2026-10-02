import { FieldGroup } from "@tradely/ui/components/field";
import * as m from "motion/react-m";
import {
	ALFA,
	ALFA_SHARES_OUTSTANDING,
	alfaStockBook,
	type Copy,
	count,
	instruments,
	type Level,
	pick,
	signedUsd,
	sweep,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import {
	type BookLevel,
	bookHeight,
	OrderBook,
} from "../walkthrough/instruments/order-book";
import { Label, Stage, useTeachMotion } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

/** "$5.00 billion" / "50.0 亿美元". */
function companyValue(cents: number, locale: Locale) {
	const dollars = cents / 100;
	return locale === "zh"
		? `${(dollars / 1e8).toFixed(1)} 亿美元`
		: `$${(dollars / 1e9).toFixed(2)} billion`;
}

// ——— Scene 1: own a slice ———

type SliceState = { shares: number; price: number; before?: number };

const PRICE_MIN = 9_000;
const PRICE_MAX = 11_000;

function SliceStage({
	width,
	state,
	locale,
}: {
	width: number;
	state: SliceState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const narrow = width < 520;
	const perToken = state.shares > 100 ? 10 : 1;
	const tokens = Math.ceil(state.shares / perToken);
	const size = narrow ? 13 : 15;
	const gap = 4;
	const gridLeft = narrow ? 14 : Math.round(width * 0.46);
	const gridTop = narrow ? 118 : 30;
	const value = state.shares * state.price;
	const change =
		state.before === undefined
			? 0
			: state.shares * (state.price - state.before);
	const trackTop = narrow
		? gridTop + Math.ceil(tokens / 10) * (size + gap) + 96
		: 250;
	const x = (price: number) =>
		14 + ((price - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * (width - 28);
	return (
		<g>
			<Label x={14} y={24} tone="strong">
				{ALFA.symbol} {usd(state.price)}
			</Label>
			{change !== 0 ? (
				<Label x={14} y={46} tone="accent">
					{t(["price ", "价格 "])}
					{signedUsd(state.price - (state.before ?? state.price))}
				</Label>
			) : null}
			<Label x={14} y={70} tone="muted">
				{t([
					`${count(ALFA_SHARES_OUTSTANDING)} shares`,
					`共 ${count(ALFA_SHARES_OUTSTANDING)} 股`,
				])}
			</Label>
			<Label x={14} y={90} tone="muted">
				{t(["Company value ", "公司价值 "])}
				{companyValue(ALFA_SHARES_OUTSTANDING * state.price, locale)}
			</Label>
			<Label x={gridLeft} y={gridTop - 10} tone="muted">
				{t([
					perToken === 1
						? "Your shares · each square is 1 share"
						: "Your shares · each square is 10 shares",
					perToken === 1 ? "你的股票 · 每格 1 股" : "你的股票 · 每格 10 股",
				])}
			</Label>
			{Array.from({ length: tokens }, (_, i) => (
				<m.rect
					key={`${perToken}-${i}`}
					x={gridLeft + (i % 10) * (size + gap)}
					y={gridTop + Math.floor(i / 10) * (size + gap)}
					width={size}
					height={size}
					rx={3}
					className="wt-long"
					initial={motion.enabled ? { opacity: 0 } : false}
					animate={{ opacity: 1 }}
					transition={motion.after(Math.min(i, 40) * 0.01)}
				/>
			))}
			<Label
				x={14}
				y={narrow ? gridTop + Math.ceil(tokens / 10) * (size + gap) + 18 : 128}
				tone="muted"
			>
				{t(["Your position", "你的持仓"])}
			</Label>
			<Label
				x={14}
				y={narrow ? gridTop + Math.ceil(tokens / 10) * (size + gap) + 38 : 150}
			>
				{count(state.shares)} × {usd(state.price)}
			</Label>
			<text
				x={14}
				y={narrow ? gridTop + Math.ceil(tokens / 10) * (size + gap) + 62 : 176}
			>
				<tspan className="wt-strong">= {usd(value)}</tspan>
				{change !== 0 ? (
					<tspan dx="8" className={change > 0 ? "wt-gain" : "wt-loss"}>
						{signedUsd(change)}
					</tspan>
				) : null}
			</text>
			<path d={`M14 ${trackTop}H${width - 14}`} className="wt-axis" />
			{[PRICE_MIN, 10_000, PRICE_MAX].map((price) => (
				<Label
					key={price}
					x={x(price)}
					y={trackTop + 20}
					anchor={
						price === PRICE_MIN
							? "start"
							: price === PRICE_MAX
								? "end"
								: "middle"
					}
					tone="small"
				>
					{usd(price, 0)}
				</Label>
			))}
			{state.before !== undefined && state.before !== state.price ? (
				<circle cx={x(state.before)} cy={trackTop} r={7} className="wt-ghost" />
			) : null}
			<m.circle
				cy={trackTop}
				r={8}
				className="wt-chip"
				initial={false}
				animate={{ cx: x(state.price) }}
				transition={motion.move}
			/>
		</g>
	);
}

function sliceHeight(width: number, shares: number) {
	const narrow = width < 520;
	const tokens = Math.ceil(shares / (shares > 100 ? 10 : 1));
	return narrow ? 118 + Math.ceil(tokens / 10) * 17 + 126 : 280;
}

function SliceView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SliceState;
	explore: SliceState | null;
	setExplore: (next: SliceState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const change =
		shown.before === undefined
			? 0
			: shown.shares * (shown.price - shown.before);
	const result: ResultItem[] = [
		{
			id: "value",
			label: t(["Your position", "你的持仓价值"]),
			value: usd(shown.shares * shown.price),
			note: `${count(shown.shares)} × ${usd(shown.price)}`,
		},
		{
			id: "change",
			label: t(["Change", "变化"]),
			value: change === 0 ? "—" : signedUsd(change),
			tone: change > 0 ? "gain" : change < 0 ? "loss" : undefined,
			note:
				shown.before === undefined
					? t(["price unchanged", "价格未变"])
					: t([`from ${usd(shown.before)}`, `相对 ${usd(shown.before)}`]),
		},
		{
			id: "per-dollar",
			label: t(["Each $1 move", "每变动 $1"]),
			value: `±${usd(shown.shares * 100, 0)}`,
			note: t(["one dollar per share", "每股一美元"]),
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"ALFA's price, the company's value, and your shares with their total value",
						"ALFA 的价格、公司价值，以及你的股票与其总价值",
					])}
					height={(width) => sliceHeight(width, Math.max(shown.shares, 100))}
				>
					{(width) => (
						<SliceStage width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<FieldGroup>
						<RangeControl
							label={t(["Shares you own", "持有股数"])}
							value={explore.shares}
							display={count(explore.shares)}
							min={10}
							max={500}
							step={10}
							onChange={(shares) => setExplore({ ...explore, shares })}
						/>
						<RangeControl
							label={t(["ALFA price", "ALFA 价格"])}
							value={explore.price}
							display={usd(explore.price)}
							min={PRICE_MIN}
							max={PRICE_MAX}
							step={50}
							onChange={(price) => setExplore({ ...explore, price })}
						/>
					</FieldGroup>
				) : null
			}
			details={
				<p>
					{t([
						"Every owner's shares move with the same price, so a position's value is shares × price and a $1 move changes it by the number of shares. ALFA is fictional; fees are ignored.",
						"所有股东的股票都随同一价格变动，所以持仓价值 = 股数 × 价格，价格每变动 $1，价值就变动与股数相同的美元数。ALFA 为虚构，未计费用。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: read a quote ———

type QuoteState = {
	side: "buy" | "sell" | null;
	quantity: number;
};

function tradeAgainst(side: "buy" | "sell" | null, quantity: number) {
	const asks: Level[] = alfaStockBook.asks.map((level) => ({ ...level }));
	const bids: Level[] = alfaStockBook.bids.map((level) => ({ ...level }));
	if (!side)
		return { asks, bids, fills: [] as Level[], filled: 0, notional: 0 };
	const result = sweep(side === "buy" ? asks : bids, quantity);
	const after = (levels: Level[]) =>
		levels.map((level) => {
			const left = result.remaining.find((item) => item.price === level.price);
			return { ...level, size: left?.size ?? 0 };
		});
	return {
		asks: side === "buy" ? after(asks) : asks,
		bids: side === "sell" ? after(bids) : bids,
		fills: result.fills,
		filled: result.filled,
		notional: result.notional,
	};
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
	const trade = tradeAgainst(shown.side, shown.quantity);
	const withBefore = (
		levels: Level[],
		original: readonly Level[],
	): BookLevel[] =>
		levels.map((level, i) => ({
			price: level.price,
			size: level.size,
			before: level.size !== original[i].size ? original[i].size : undefined,
		}));
	const average = trade.filled ? trade.notional / trade.filled : 0;
	const result: ResultItem[] = shown.side
		? [
				{
					id: "total",
					label:
						shown.side === "buy"
							? t(["You pay", "你支付"])
							: t(["You receive", "你收到"]),
					value: usd(trade.notional),
					note: t([
						`${count(trade.filled)} shares, before fees`,
						`${count(trade.filled)} 股，不含费用`,
					]),
				},
				{
					id: "average",
					label: t(["Average price", "平均价格"]),
					value: usd(average, trade.fills.length > 1 ? 3 : 2),
					note:
						trade.fills.length > 1
							? t([
									`${trade.fills.length} price levels`,
									`${trade.fills.length} 个价位`,
								])
							: t(["one price level", "一个价位"]),
				},
				{
					id: "last",
					label: t(["Cost vs. the last price", "相对最新价的成本"]),
					value: signedUsd(
						(shown.side === "buy" ? 1 : -1) *
							(trade.notional - alfaStockBook.last * trade.filled),
					),
					tone: "loss",
					note: usd(alfaStockBook.last),
				},
			]
		: [
				{
					id: "bid",
					label: t(["Bid", "买价"]),
					value: usd(alfaStockBook.bids[0].price),
					note: t(["best price to sell into", "立即卖出可得"]),
				},
				{
					id: "ask",
					label: t(["Ask", "卖价"]),
					value: usd(alfaStockBook.asks[0].price),
					note: t(["best price to buy at", "立即买入需付"]),
				},
				{
					id: "last",
					label: t(["Last trade", "最新成交"]),
					value: usd(alfaStockBook.last),
					note: t(["history, not an offer", "历史价格，不是报价"]),
				},
			];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"ALFA's order book: bids below, asks above, with sizes in shares",
						"ALFA 的订单簿：买价在下，卖价在上，数量单位为股",
					])}
					height={bookHeight(3, 3)}
				>
					{(width) => (
						<OrderBook
							width={width}
							bids={withBefore(trade.bids, alfaStockBook.bids)}
							asks={withBefore(trade.asks, alfaStockBook.asks)}
							last={alfaStockBook.last}
							fills={trade.fills}
							sizeMax={1_000}
							labels={{
								bid: t(["Bids · shares", "买单 · 股"]),
								ask: t(["Asks · shares", "卖单 · 股"]),
								price: t(["Price", "价格"]),
								spread: t(["spread", "价差"]),
								last: t(["last", "最新"]),
								filled: (size) =>
									t([`took ${count(size)}`, `成交 ${count(size)}`]),
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
							label={t(["Trade right now", "立即交易"])}
							value={explore.side ?? "buy"}
							options={[
								["buy", t(["Buy", "买入"])],
								["sell", t(["Sell", "卖出"])],
							]}
							onChange={(side) => setExplore({ ...explore, side })}
						/>
						<RangeControl
							label={t(["Shares", "股数"])}
							value={explore.quantity}
							display={count(explore.quantity)}
							min={10}
							max={1_500}
							step={10}
							onChange={(quantity) => setExplore({ ...explore, quantity })}
						/>
					</FieldGroup>
				) : null
			}
			details={
				<p>
					{t([
						"A bigger order than the best level shows takes the next level too, so its average price is worse. Real books also have hidden size and change second by second. ALFA's quote is fictional.",
						"订单大于最优价位的数量时，会继续吃下一个价位，平均价格因此变差。真实的订单簿还有隐藏数量，并且每秒都在变化。ALFA 的报价为虚构。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: stock, ETF, index ———

type Kind = "stock" | "etf" | "index";
type KindState = { focus: Kind };

const kinds: Record<
	Kind,
	{
		name: string;
		kind: Copy;
		holds: Copy;
		buy: Copy;
		own: Copy;
		settle: Copy;
		quote: string;
	}
> = {
	stock: {
		name: ALFA.symbol,
		kind: ["Stock", "股票"],
		holds: ["1 company", "1 家公司"],
		buy: ["Yes", "可以"],
		own: ["Part of one company", "一家公司的一部分"],
		settle: ["Shares", "股票"],
		quote: usd(alfaStockBook.last),
	},
	etf: {
		name: instruments.etf.symbol,
		kind: ["ETF", "ETF"],
		holds: [
			`${instruments.etf.holds} stocks`,
			`${instruments.etf.holds} 只股票`,
		],
		buy: ["Yes", "可以"],
		own: ["Part of a fund", "一只基金的一部分"],
		settle: ["Fund shares", "基金份额"],
		quote: usd(instruments.etf.price),
	},
	index: {
		name: instruments.index.symbol,
		kind: ["Index", "指数"],
		holds: ["Nothing: a number", "无：只是一个数"],
		buy: ["No", "不可以"],
		own: ["Nothing: it is a measurement", "什么都没有：它是一个测量值"],
		settle: ["Cash", "现金"],
		quote: count(instruments.index.level),
	},
};
const kindOrder: readonly Kind[] = ["stock", "etf", "index"];

function KindStage({
	width,
	focus,
	locale,
}: {
	width: number;
	focus: Kind;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const narrow = width < 520;
	const cardWidth = narrow ? width - 16 : (width - 32) / 3;
	const cardHeight = narrow ? 86 : 190;
	return (
		<g>
			{kindOrder.map((id, i) => {
				const card = kinds[id];
				const x = narrow ? 8 : 8 + i * (cardWidth + 8);
				const y = narrow ? 8 + i * (cardHeight + 10) : 8;
				const active = id === focus;
				return (
					<m.g
						key={id}
						initial={false}
						animate={{ opacity: active ? 1 : 0.55 }}
						transition={motion.fade}
					>
						<rect
							x={x}
							y={y}
							width={cardWidth}
							height={cardHeight}
							rx={12}
							className={active ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						<Label x={x + 14} y={y + 28} tone="strong">
							{card.name}
						</Label>
						<Label x={x + cardWidth - 14} y={y + 28} anchor="end" tone="muted">
							{card.quote}
						</Label>
						<Label x={x + 14} y={y + 52} tone="muted">
							{t(card.kind)}
						</Label>
						<Label x={x + 14} y={y + (narrow ? 74 : 80)}>
							{t(card.holds)}
						</Label>
						{narrow ? null : (
							<>
								<Label x={x + 14} y={y + 122} tone="small">
									{t(["Buy it directly?", "能否直接买入？"])}
								</Label>
								<Label
									x={x + 14}
									y={y + 142}
									tone={card.buy[0] === "No" ? "loss" : "gain"}
								>
									{t(card.buy)}
								</Label>
								<Label x={x + 14} y={y + 166} tone="small">
									{t(["Options settle in", "期权结算方式"])}
								</Label>
								<Label x={x + 14} y={y + 184}>
									{t(card.settle)}
								</Label>
							</>
						)}
					</m.g>
				);
			})}
		</g>
	);
}

function KindView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: KindState;
	explore: KindState | null;
	setExplore: (next: KindState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const card = kinds[shown.focus];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A stock, an ETF and an index compared side by side",
						"股票、ETF 与指数并列比较",
					])}
					height={(width) => (width < 520 ? 3 * 96 + 16 : 206)}
				>
					{(width) => (
						<KindStage width={width} focus={shown.focus} locale={locale} />
					)}
				</Stage>
			}
			result={[
				{
					id: "buy",
					label: t(["Buy it directly?", "能否直接买入？"]),
					value: t(card.buy),
					tone: card.buy[0] === "No" ? "loss" : "gain",
				},
				{
					id: "own",
					label: t(["What you would own", "你将持有"]),
					value: t(card.own),
				},
				{
					id: "settle",
					label: t(["Its options settle in", "其期权结算方式"]),
					value: t(card.settle),
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Inspect", "查看"])}
						value={explore.focus}
						options={[
							["stock", t(["Stock", "股票"])],
							["etf", "ETF"],
							["index", t(["Index", "指数"])],
						]}
						onChange={(focus) => setExplore({ focus })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"All three can have options, but always check which one an option refers to: stock and ETF options usually deliver shares, while index options pay cash. ALFA, BRDX and IDX 500 are fictional.",
						"三者都可以有期权，但务必确认期权指向哪一个：股票和 ETF 期权通常交付股票或份额，指数期权则支付现金。ALFA、BRDX 与 IDX 500 均为虚构。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<SliceState, SliceState>({
		id: "shares",
		label: ["Own a slice", "拥有一小部分"],
		title: [
			"A share is a slice of a company; its value moves with the price",
			"股票是公司的一小部分，其价值随价格变动",
		],
		predict: {
			prompt: [
				"You own 100 ALFA shares at $100. ALFA rises to $101. How much does your position gain?",
				"你持有 100 股 ALFA，价格 $100。ALFA 涨到 $101。你的持仓增加多少？",
			],
			choices: [
				{ id: "one", label: ["$1", "$1"] },
				{ id: "hundred", label: ["$100", "$100"] },
				{ id: "value", label: ["$101", "$101"] },
			],
			answer: "hundred",
			revealAt: 2,
			entry: { answer: 100, prefix: "$" },
			explain: [
				"Each share gains $1 and you own 100 of them: 100 × $1 = $100. Value is shares × price, so gains grow with the number of shares you hold.",
				"每股涨 $1，你持有 100 股：100 × $1 = $100。价值 = 股数 × 价格，所以收益随持股数量增加。",
			],
		},
		beats: [
			{
				id: "ten",
				label: ["10 shares", "10 股"],
				caption: [
					"ALFA has 50 million shares at $100 each, so the company is valued at $5 billion. Your 10 shares are worth $1,000.",
					"ALFA 共有 5,000 万股，每股 $100，公司估值 50 亿美元。你的 10 股价值 $1,000。",
				],
				state: { shares: 10, price: 10_000 },
			},
			{
				id: "hundred",
				label: ["100 shares", "100 股"],
				caption: [
					"Buy 90 more and you own 100 shares. Their value is simply 100 × $100 = $10,000.",
					"再买 90 股，你就持有 100 股。它们的价值就是 100 × $100 = $10,000。",
				],
				state: { shares: 100, price: 10_000 },
			},
			{
				id: "up",
				label: ["Price +$1", "价格 +$1"],
				caption: [
					"ALFA rises $1 to $101. Every share gains $1, so your 100 shares gain $100 and the company gains $50 million.",
					"ALFA 涨 $1 到 $101。每股都涨 $1，你的 100 股增加 $100，公司价值增加 5,000 万美元。",
				],
				state: { shares: 100, price: 10_100, before: 10_000 },
			},
			{
				id: "down",
				label: ["Price −$1", "价格 −$1"],
				caption: [
					"If ALFA falls to $99 instead, the same 100 shares lose $100. Owning shares means your value moves both ways.",
					"如果 ALFA 反而跌到 $99，同样的 100 股就亏 $100。持有股票意味着价值双向波动。",
				],
				state: { shares: 100, price: 9_900, before: 10_000 },
			},
		],
		explore: {
			prompt: [
				"Change how many shares you own and ALFA's price, and watch your position value and its change.",
				"改变持股数量和 ALFA 价格，观察持仓价值及其变化。",
			],
			start: () => ({ shares: 100, price: 10_000, before: 10_000 }),
			task: {
				kind: "reach",
				prompt: [
					"Set up a position that is down exactly $500 from ALFA's $100 starting price.",
					"调出一个比 ALFA 起始价 $100 正好亏损 $500 的持仓。",
				],
				reached: (e) =>
					e.shares * (e.price - (e.before ?? e.price)) === -50_000,
				done: [
					"Shares × price change: 100 shares × −$5, 250 × −$2 and 500 × −$1 all lose $500. The more shares you hold, the smaller the move that costs the same.",
					"股数 × 价格变化：100 股 × −$5、250 股 × −$2、500 股 × −$1 都亏 $500。持股越多，造成同样亏损所需的价格变动越小。",
				],
			},
		},
		View: SliceView,
	}),
	defineScene<QuoteState, QuoteState>({
		id: "quote",
		label: ["Read a quote", "读懂报价"],
		title: ["You buy at the ask and sell at the bid", "买入按卖价，卖出按买价"],
		predict: {
			prompt: [
				"You buy 10 ALFA shares right away. Which price do you pay?",
				"你立即买入 10 股 ALFA。你付的是哪个价格？",
			],
			choices: [
				{ id: "bid", label: ["The bid, $100.00", "买价 $100.00"] },
				{
					id: "last",
					label: ["The last trade, $100.02", "最新成交价 $100.02"],
				},
				{ id: "ask", label: ["The ask, $100.05", "卖价 $100.05"] },
			],
			answer: "ask",
			explain: [
				"An immediate buy takes the best price a seller is offering: the ask. The last trade is history, and the bid is what buyers offer.",
				"立即买入会接受卖方给出的最优价格，也就是卖价。最新成交价是历史，买价是买方的出价。",
			],
		},
		beats: [
			{
				id: "quote",
				label: ["The quote", "报价"],
				caption: [
					"ALFA's quote: bid $100.00 for 400 shares, ask $100.05 for 300. The last trade was $100.02, but nobody is offering that now.",
					"ALFA 的报价：买价 $100.00（400 股），卖价 $100.05（300 股）。最新成交是 $100.02，但现在没人按这个价格报价。",
				],
				state: { side: null, quantity: 10 },
			},
			{
				id: "buy",
				label: ["Buy now", "立即买入"],
				caption: [
					"Buy 10 right away and you take the best offer: 10 × $100.05 = $1,000.50, not the $1,000.20 the last price suggests.",
					"立即买入 10 股，你接受最优卖价：10 × $100.05 = $1,000.50，而不是按最新价算的 $1,000.20。",
				],
				state: { side: "buy", quantity: 10 },
			},
			{
				id: "sell",
				label: ["Sell now", "立即卖出"],
				caption: [
					"Sell 10 right away and you receive the best bid: 10 × $100.00 = $1,000.00.",
					"立即卖出 10 股，你得到最优买价：10 × $100.00 = $1,000.00。",
				],
				state: { side: "sell", quantity: 10 },
			},
			{
				id: "big",
				label: ["A big order", "大额订单"],
				caption: [
					"Buy 1,000 at once and the best offer runs out: you also take $100.06 and $100.08, so your average price rises.",
					"一次买入 1,000 股，最优卖价的数量不够：你还会吃到 $100.06 和 $100.08，平均价格随之上升。",
				],
				state: { side: "buy", quantity: 1_000 },
			},
		],
		explore: {
			prompt: [
				"Choose buy or sell and the size. Watch which levels your order takes and what it costs.",
				"选择买入或卖出以及数量，观察订单吃掉哪些价位、花费多少。",
			],
			start: () => ({ side: "buy", quantity: 300 }),
			task: {
				kind: "reach",
				prompt: [
					"Sell enough shares at once that your average price falls below the $100.00 bid.",
					"一次卖出足够多的股票，让你的平均成交价低于 $100.00 的买价。",
				],
				reached: (e) =>
					e.side === "sell" && e.quantity > alfaStockBook.bids[0].size,
				done: [
					"Only 400 shares are bid at $100.00. Sell more and the rest fills at lower bids, so your average slips below $100. What you receive depends on size as well as price.",
					"$100.00 的买价只有 400 股。卖得更多，剩下的就会成交在更低的买价上，平均价随之低于 $100。你能拿到多少，取决于价格，也取决于数量。",
				],
			},
		},
		View: QuoteView,
	}),
	defineScene<KindState, KindState>({
		id: "instruments",
		label: ["Stock, ETF, index", "股票、ETF、指数"],
		title: [
			"A stock, an ETF and an index are different things",
			"股票、ETF 与指数是不同的东西",
		],
		predict: {
			prompt: [
				"ALFA is a stock, BRDX an ETF and IDX 500 an index. Which can you buy directly?",
				"ALFA 是股票，BRDX 是 ETF，IDX 500 是指数。哪些可以直接买入？",
			],
			choices: [
				{
					id: "two",
					label: ["ALFA and BRDX, not IDX 500", "ALFA 和 BRDX，不包括 IDX 500"],
				},
				{ id: "all", label: ["All three", "三个都可以"] },
				{ id: "one", label: ["Only ALFA", "只有 ALFA"] },
			],
			answer: "two",
			revealAt: 2,
			explain: [
				"ALFA and BRDX both trade as shares. IDX 500 is a calculated number, so you reach it only through products such as index options, which settle in cash.",
				"ALFA 与 BRDX 都以份额交易。IDX 500 是计算出来的数值，只能通过指数期权等产品参与，这类期权以现金结算。",
			],
		},
		beats: [
			{
				id: "stock",
				label: ["Stock", "股票"],
				caption: [
					"ALFA is a stock: each share is a slice of one company, and you can buy it directly.",
					"ALFA 是股票：每一股都是一家公司的一小部分，可以直接买入。",
				],
				state: { focus: "stock" },
			},
			{
				id: "etf",
				label: ["ETF", "ETF"],
				caption: [
					"BRDX is an ETF: a fund holding 500 stocks whose shares trade just like a stock.",
					"BRDX 是 ETF：一只持有 500 只股票的基金，其份额像股票一样交易。",
				],
				state: { focus: "etf" },
			},
			{
				id: "index",
				label: ["Index", "指数"],
				caption: [
					"IDX 500 is an index: a number calculated from 500 prices. You cannot buy it, and options on it settle in cash.",
					"IDX 500 是指数：由 500 个价格计算出的数值。你不能买入它，其期权以现金结算。",
				],
				state: { focus: "index" },
			},
		],
		explore: {
			prompt: [
				"Inspect each one: what you would own and how its options settle.",
				"逐一查看：你将持有什么，以及它的期权如何结算。",
			],
			start: (last) => last,
			task: {
				kind: "answer",
				prompt: [
					"Your option is exercised. Which underlying leaves you holding shares or fund units afterwards?",
					"你的期权被行权。哪种标的会让你之后持有股票或基金份额？",
				],
				choices: [
					{ id: "both", label: ["ALFA or BRDX", "ALFA 或 BRDX"] },
					{ id: "index", label: ["IDX 500", "IDX 500"] },
					{
						id: "none",
						label: [
							"None of them: options always pay cash",
							"都不会：期权总是现金结算",
						],
					},
				],
				answer: "both",
				done: [
					"Stock and ETF options deliver shares or fund units. An index can't be delivered, so IDX 500 options settle in cash.",
					"股票和 ETF 期权交付股票或基金份额。指数无法交付，所以 IDX 500 期权以现金结算。",
				],
			},
		},
		View: KindView,
	}),
] as const;

export function StocksAndPricesWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="stocks-and-prices"
			label={["Interactive lesson on stocks and prices", "股票与价格互动课"]}
			scenes={scenes}
		/>
	);
}
