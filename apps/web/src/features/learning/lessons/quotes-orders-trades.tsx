import { FieldGroup } from "@tradely/ui/components/field";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import {
	bestQuote,
	type Contract,
	type Copy,
	contractLabel,
	count,
	type Level,
	oct105CallLast,
	oct105CallVenues,
	pick,
	QUOTE_TIME,
	sweep,
	usd,
	type VenueQuote,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import {
	afterTaking,
	BookTape,
	bookTapeHeight,
	type Print,
} from "../walkthrough/instruments/book-tape";
import type {
	BookFill,
	BookLevel,
} from "../walkthrough/instruments/order-book";
import { Label, Stage, useTeachMotion } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

const CALL_105: Contract = { expiry: "oct18", strike: 105, right: "call" };
const LABEL = contractLabel(CALL_105, false);
/** Every venue's levels combined into one book, best first. */
const BASE_ASKS: Level[] = oct105CallVenues
	.map((quote) => quote.ask)
	.sort((a, b) => a.price - b.price);
const BASE_BIDS: Level[] = oct105CallVenues
	.map((quote) => quote.bid)
	.sort((a, b) => b.price - a.price);
const BEST = bestQuote(oct105CallVenues);

const EARLIER: Print = oct105CallLast;

/** "$2.10" for whole cents, "$2.125" for half cents. */
const cents = (value: number) => usd(value, Number.isInteger(value) ? 2 : 3);

// ——— Shared stage: the book above its time and sales ———

const TAPE_ROWS = 3;
const bookTapeRows = () => bookTapeHeight(3, 3, TAPE_ROWS);

function ContractBookTape({
	width,
	bids,
	asks,
	fills,
	prints,
	locale,
}: {
	width: number;
	bids: readonly BookLevel[];
	asks: readonly BookLevel[];
	fills: readonly BookFill[];
	/** Newest first. */
	prints: readonly Print[];
	locale: Locale;
}) {
	const t = tr(locale);
	return (
		<BookTape
			width={width}
			bids={bids}
			asks={asks}
			fills={fills}
			prints={prints}
			sizeMax={30}
			labels={{
				bid: t(["Bids · contracts", "买单 · 张"]),
				ask: t(["Asks · contracts", "卖单 · 张"]),
				price: t(["Price", "价格"]),
				spread: t(["spread", "价差"]),
				last: t(["last", "最新"]),
				filled: (size) => t([`took ${count(size)}`, `成交 ${count(size)}`]),
			}}
			tape={{
				title: t([`Time and sales · ${LABEL[0]}`, `逐笔成交 · ${LABEL[1]}`]),
				time: t(["Time", "时间"]),
				size: t(["Contracts", "张数"]),
				price: t(["Price", "价格"]),
				empty: t(["No trades yet", "尚无成交"]),
			}}
			tapeRows={TAPE_ROWS}
		/>
	);
}

// ——— Scene 1: a quote is not a trade ———

type QuoteStep = "quote" | "spread" | "last" | "trade";
type QuoteState = { step: QuoteStep; side: "buy" | "sell"; size: number };

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
	const traded = shown.step === "trade";
	const buy = shown.side === "buy";
	const order = sweep(buy ? BASE_ASKS : BASE_BIDS, shown.size);
	const asks = traded && buy ? afterTaking(BASE_ASKS, order.fills) : BASE_ASKS;
	const bids = traded && !buy ? afterTaking(BASE_BIDS, order.fills) : BASE_BIDS;
	const fills = traded ? order.fills : [];
	// A sweep prints once per level it takes; the tape lists the newest first.
	const prints: Print[] = traded
		? [
				...[...order.fills]
					.reverse()
					.map((fill) => ({ time: QUOTE_TIME, ...fill })),
				EARLIER,
			]
		: [EARLIER];
	const average = order.notional / Math.max(order.filled, 1);
	const mid = (BEST.bid.price + BEST.ask.price) / 2;
	const result: ResultItem[] =
		shown.step === "quote"
			? [
					{
						id: "bid",
						label: t(["Bid", "买价"]),
						value: `${usd(BEST.bid.price)} × ${BEST.bid.size}`,
						note: t(["best offer to buy", "最高买入报价"]),
					},
					{
						id: "ask",
						label: t(["Ask", "卖价"]),
						value: `${usd(BEST.ask.price)} × ${BEST.ask.size}`,
						note: t(["best offer to sell", "最低卖出报价"]),
					},
					{
						id: "time",
						label: t(["Quote time", "报价时间"]),
						value: QUOTE_TIME,
					},
				]
			: shown.step === "spread"
				? [
						{
							id: "spread",
							label: t(["Spread", "价差"]),
							value: usd(BEST.ask.price - BEST.bid.price),
							note: t(["ask − bid", "卖价 − 买价"]),
							evidence: "calculated",
						},
						{
							id: "mid",
							label: t(["Midpoint", "中点"]),
							value: cents(mid),
							note: t([
								"(bid + ask) ÷ 2, not a trade",
								"(买价 + 卖价) ÷ 2，并非成交",
							]),
							evidence: "calculated",
						},
					]
				: shown.step === "last"
					? [
							{
								id: "last",
								label: t(["Last", "最新成交"]),
								value: usd(EARLIER.price),
								note: t([
									`${EARLIER.size} contracts at ${EARLIER.time}`,
									`${EARLIER.time} 成交 ${EARLIER.size} 张`,
								]),
							},
							{
								id: "quote",
								label: t(["Quote now", "当前报价"]),
								value: `${usd(BEST.bid.price)} / ${usd(BEST.ask.price)}`,
								note: t([`at ${QUOTE_TIME}`, `${QUOTE_TIME} 时`]),
							},
						]
					: [
							{
								id: "paid",
								label: buy
									? t(["You pay", "你支付"])
									: t(["You receive", "你收到"]),
								value: cents(average),
								note:
									order.fills.length > 1
										? t(["average across levels", "跨价位平均"])
										: buy
											? t(["the ask", "卖价"])
											: t(["the bid", "买价"]),
							},
							{
								id: "filled",
								label: t(["Filled", "成交"]),
								value: t([`${order.filled} contracts`, `${order.filled} 张`]),
								note: order.fills
									.map((fill) => `${fill.size} @ ${usd(fill.price)}`)
									.join(" · "),
							},
							{
								id: "last",
								label: t(["New last", "新的最新成交"]),
								value: usd(prints[0].price),
								note: t([`at ${QUOTE_TIME}`, `${QUOTE_TIME} 时`]),
							},
						];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						`The ${LABEL[0]} order book at ${QUOTE_TIME} above its time and sales`,
						`${QUOTE_TIME} 的 ${LABEL[1]} 订单簿及其逐笔成交`,
					])}
					height={bookTapeRows()}
				>
					{(width) => (
						<ContractBookTape
							width={width}
							bids={bids}
							asks={asks}
							fills={fills}
							prints={prints}
							locale={locale}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<FieldGroup>
						<ChoiceField
							label={t(["Market order", "市价单"])}
							value={explore.side}
							options={[
								["buy", t(["Buy", "买入"])],
								["sell", t(["Sell", "卖出"])],
							]}
							onChange={(side) => setExplore({ ...explore, side })}
						/>
						<ChoiceField
							label={t(["Contracts", "张数"])}
							value={String(explore.size) as "1" | "5" | "10"}
							options={[
								["1", "1"],
								["5", "5"],
								["10", "10"],
							]}
							onChange={(size) =>
								setExplore({ ...explore, size: Number(size) })
							}
						/>
					</FieldGroup>
				) : null
			}
			details={
				<p>
					{t([
						"A quote advertises the best prices and the sizes shown at them; it is not a trade. The midpoint is arithmetic, and a broker's mark is often just that midpoint: a valuation, not a price anyone traded. Last is the most recent execution, which can be minutes older than the quote, so always read each number with its time.",
						"报价展示最优价格及对应数量，它不是成交。中点只是算术结果，券商的估值价往往就是这个中点：它是估值，不是有人成交的价格。最新成交价是最近一笔执行，可能比报价早好几分钟，所以读每个数字都要看它的时间。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: orders change the book; only trades print ———

type BookEvent = "add" | "cancel" | "trade";
type EventState = { event: BookEvent };

const ADDED = 5;
const TAKEN = 3;

function eventBook(event: BookEvent): {
	asks: BookLevel[];
	fills: BookFill[];
	prints: Print[];
} {
	const best = BASE_ASKS[0];
	const rest = BASE_ASKS.slice(1);
	if (event === "add")
		return {
			asks: [{ ...best, size: best.size + ADDED, before: best.size }, ...rest],
			fills: [],
			prints: [EARLIER],
		};
	if (event === "cancel")
		return {
			asks: [{ ...best, before: best.size + ADDED }, ...rest],
			fills: [],
			prints: [EARLIER],
		};
	return {
		asks: [{ ...best, size: best.size - TAKEN, before: best.size }, ...rest],
		fills: [{ price: best.price, size: TAKEN }],
		prints: [{ time: "10:31", size: TAKEN, price: best.price }, EARLIER],
	};
}

function EventView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: EventState;
	explore: EventState | null;
	setExplore: (next: EventState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const book = eventBook(shown.event);
	const best = book.asks[0];
	const volume = book.prints.reduce((sum, print) => sum + print.size, 0);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"How adding, cancelling and trading change the ask size, and which of them prints",
						"新增、撤单与成交如何改变卖价数量，以及哪一种会产生成交记录",
					])}
					height={bookTapeRows()}
				>
					{(width) => (
						<ContractBookTape
							width={width}
							bids={BASE_BIDS}
							asks={book.asks}
							fills={book.fills}
							prints={book.prints}
							locale={locale}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "size",
					label: t([
						`Ask size at ${usd(best.price)}`,
						`${usd(best.price)} 卖价数量`,
					]),
					value: count(best.size),
					note: t([
						`was ${count(best.before ?? best.size)}`,
						`原为 ${count(best.before ?? best.size)}`,
					]),
				},
				{
					id: "volume",
					label: t(["Volume today", "今日成交量"]),
					value: count(volume),
					note:
						shown.event === "trade"
							? t([`+${TAKEN} from one print`, `一笔成交 +${TAKEN}`])
							: t(["no new print", "没有新成交"]),
					tone: shown.event === "trade" ? "gain" : undefined,
				},
				{
					id: "last",
					label: t(["Last", "最新成交"]),
					value: usd(book.prints[0].price),
					note: t([`at ${book.prints[0].time}`, `${book.prints[0].time} 时`]),
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["What happens", "发生了什么"])}
						value={explore.event}
						options={[
							["add", t([`Add ${ADDED}`, `新增 ${ADDED} 张`])],
							["cancel", t([`Cancel ${ADDED}`, `撤销 ${ADDED} 张`])],
							["trade", t([`Trade ${TAKEN}`, `成交 ${TAKEN} 张`])],
						]}
						onChange={(event) => setExplore({ event })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"An order is an instruction; a trade is a completed execution. Adding or cancelling orders changes the displayed sizes without any trade, so a shrinking size proves nothing by itself. Volume counts executed contracts only, and a print of 3 does not mean the whole displayed size traded.",
						"订单是指令，成交是已完成的执行。新增或撤销订单会改变显示的数量，但没有任何成交，所以数量减少本身什么也证明不了。成交量只计算已执行的合约，一笔 3 张的成交也不代表显示的全部数量都成交了。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: the best quote across venues ———

type VenueState = {
	shown: number;
	best: boolean;
	/** Venue C's ask in cents, or null once its size has traded away. */
	cAsk: number | null;
};

function venuesFor(state: VenueState): VenueQuote[] {
	return oct105CallVenues.map((quote) =>
		quote.venue === "C"
			? {
					...quote,
					ask:
						state.cAsk === null
							? { ...quote.ask, size: 0 }
							: { ...quote.ask, price: state.cAsk },
				}
			: quote,
	);
}

function venueLayout(width: number) {
	const narrow = width < 520;
	const venueWidth = narrow ? 78 : Math.min(140, width * 0.26);
	const cellWidth = (width - 16 - venueWidth - 10) / 2;
	return {
		bidX: 8 + venueWidth,
		askX: 8 + venueWidth + cellWidth + 10,
		cellWidth,
		rowY: (i: number) => 32 + i * 42,
		bestY: 32 + 3 * 42 + 20,
		height: 32 + 3 * 42 + 20 + 58,
	};
}

function VenueBoard({
	width,
	state,
	locale,
}: {
	width: number;
	state: VenueState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const layout = venueLayout(width);
	const venues = venuesFor(state);
	const visible = venues.slice(0, state.shown);
	const best = bestQuote(visible);
	const cell = (
		x: number,
		y: number,
		level: Level,
		focus: boolean,
		key: string,
	) => (
		<g key={key}>
			<rect
				x={x}
				y={y}
				width={layout.cellWidth}
				height={32}
				rx={8}
				className={focus ? "wt-focus-shape" : "wt-panel-shape"}
			/>
			<AnimatePresence initial={false}>
				<m.text
					key={`${level.price}-${level.size}`}
					x={x + layout.cellWidth / 2}
					y={y + 21}
					textAnchor="middle"
					className={
						level.size === 0 ? "wt-small" : focus ? "wt-accent" : undefined
					}
					initial={motion.enabled ? { opacity: 0 } : false}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={motion.fade}
				>
					{level.size === 0
						? t(["traded away", "已被成交"])
						: `${usd(level.price)} × ${level.size}`}
				</m.text>
			</AnimatePresence>
		</g>
	);
	return (
		<g>
			<Label
				x={layout.bidX + layout.cellWidth / 2}
				y={18}
				anchor="middle"
				tone="muted"
			>
				{t(["Bid × size", "买价 × 数量"])}
			</Label>
			<Label
				x={layout.askX + layout.cellWidth / 2}
				y={18}
				anchor="middle"
				tone="muted"
			>
				{t(["Ask × size", "卖价 × 数量"])}
			</Label>
			{venues.map((quote, i) => {
				const y = layout.rowY(i);
				return (
					<m.g
						key={quote.venue}
						initial={false}
						animate={{ opacity: i < state.shown ? 1 : 0 }}
						transition={motion.fade}
					>
						<Label x={14} y={y + 21}>
							{t([`Venue ${quote.venue}`, `场所 ${quote.venue}`])}
						</Label>
						{cell(
							layout.bidX,
							y,
							quote.bid,
							state.best && best.bid.venue === quote.venue,
							"bid",
						)}
						{cell(
							layout.askX,
							y,
							quote.ask,
							state.best && best.ask.venue === quote.venue,
							"ask",
						)}
					</m.g>
				);
			})}
			<m.g
				initial={false}
				animate={{ opacity: state.best ? 1 : 0 }}
				transition={motion.fade}
			>
				<path d={`M8 ${layout.bestY - 10}H${width - 8}`} className="wt-grid" />
				<Label x={14} y={layout.bestY + 16} tone="strong">
					{t(["Best", "最优"])}
				</Label>
				<Label x={14} y={layout.bestY + 34} tone="small">
					NBBO
				</Label>
				{cell(layout.bidX, layout.bestY, best.bid, true, "best-bid")}
				{cell(layout.askX, layout.bestY, best.ask, true, "best-ask")}
				<Label
					x={layout.bidX + layout.cellWidth / 2}
					y={layout.bestY + 48}
					anchor="middle"
					tone="small"
				>
					{t([`from venue ${best.bid.venue}`, `来自场所 ${best.bid.venue}`])}
				</Label>
				<Label
					x={layout.askX + layout.cellWidth / 2}
					y={layout.bestY + 48}
					anchor="middle"
					tone="small"
				>
					{t([`from venue ${best.ask.venue}`, `来自场所 ${best.ask.venue}`])}
				</Label>
			</m.g>
		</g>
	);
}

function VenueView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: VenueState;
	explore: VenueState | null;
	setExplore: (next: VenueState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const visible = venuesFor(shown).slice(0, shown.shown);
	const best = bestQuote(visible);
	const venueA = oct105CallVenues[0];
	const result: ResultItem[] =
		shown.shown === 1
			? [
					{
						id: "venue",
						label: t(["Venue A quotes", "场所 A 报价"]),
						value: `${usd(venueA.bid.price)} / ${usd(venueA.ask.price)}`,
					},
					{
						id: "spread",
						label: t(["Venue A spread", "场所 A 价差"]),
						value: usd(venueA.ask.price - venueA.bid.price),
						evidence: "calculated",
					},
				]
			: !shown.best
				? [
						{
							id: "venues",
							label: t(["Venues quoting", "报价场所"]),
							value: String(visible.length),
						},
						{
							id: "bids",
							label: t(["Bids range", "买价范围"]),
							value: `${usd(195)}–${usd(205)}`,
						},
						{
							id: "asks",
							label: t(["Asks range", "卖价范围"]),
							value: `${usd(215)}–${usd(225)}`,
						},
					]
				: [
						{
							id: "bid",
							label: t(["Best bid", "最优买价"]),
							value: `${usd(best.bid.price)} × ${best.bid.size}`,
							note: t([`venue ${best.bid.venue}`, `场所 ${best.bid.venue}`]),
						},
						{
							id: "ask",
							label: t(["Best ask", "最优卖价"]),
							value: `${usd(best.ask.price)} × ${best.ask.size}`,
							note:
								shown.cAsk === null
									? t([
											"venue A, after C's 8 traded",
											"场所 A，C 的 8 张成交后",
										])
									: t([`venue ${best.ask.venue}`, `场所 ${best.ask.venue}`]),
						},
						{
							id: "spread",
							label: t(["Best spread", "最优价差"]),
							value: usd(best.ask.price - best.bid.price),
							note: t(["across venues", "跨场所"]),
							evidence: "calculated",
						},
					];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						`Three venues' quotes for the ${LABEL[0]} and the best bid and ask across them`,
						`三个场所对 ${LABEL[1]} 的报价，以及跨场所的最优买卖价`,
					])}
					height={(width) => venueLayout(width).height}
				>
					{(width) => (
						<VenueBoard width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<RangeControl
						label={t(["Venue C's ask", "场所 C 的卖价"])}
						value={explore.cAsk ?? 215}
						display={usd(explore.cAsk ?? 215)}
						min={210}
						max={235}
						step={5}
						onChange={(cAsk) => setExplore({ ...explore, cAsk })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Options on the same contract trade on several venues at once. The national best bid and offer (NBBO) combines the highest bid and the lowest ask from any of them, so its two sides can come from different venues and its spread can be narrower than any one venue's. It changes whenever a venue's quote does.",
						"同一合约的期权会同时在多个场所交易。全国最优买卖报价（NBBO）取所有场所中的最高买价和最低卖价，因此两边可能来自不同场所，价差也可能比任一场所都窄。任一场所的报价变化，它都会随之改变。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<QuoteState, QuoteState>({
		id: "quote",
		label: ["Read a quote", "读懂报价"],
		title: ["A quote is an offer, not a trade", "报价是出价，不是成交"],
		predict: {
			prompt: [
				"The Oct 18 105 call shows bid $2.05, ask $2.15 and last $2.00. You buy one contract at market. What do you pay?",
				"10月18日 105 看涨显示买价 $2.05、卖价 $2.15、最新成交 $2.00。你用市价单买入 1 张，会付多少？",
			],
			choices: [
				{ id: "ask", label: ["$2.15, the ask", "$2.15，卖价"] },
				{ id: "last", label: ["$2.00, the last", "$2.00，最新成交价"] },
				{ id: "mid", label: ["$2.10, the midpoint", "$2.10，中点"] },
			],
			answer: "ask",
			entry: { answer: 2.15, prefix: "$", unit: [" a share", " 每股"] },
			revealAt: 3,
			explain: [
				"A market buy takes the best offer to sell: $2.15. The last trade is history and the midpoint is arithmetic; neither is a price on offer.",
				"市价买单吃掉最低的卖出报价：$2.15。最新成交是历史，中点只是算术结果，两者都不是可成交的报价。",
			],
		},
		beats: [
			{
				id: "quote",
				label: ["The quote", "报价"],
				caption: [
					"10:30 Monday. The Oct 18 105 call is bid $2.05 for 12 contracts and offered at $2.15 for 8. These are offers, not trades.",
					"周一 10:30。10月18日 105 看涨买价 $2.05（12 张），卖价 $2.15（8 张）。这些是报价，不是成交。",
				],
				state: { step: "quote", side: "buy", size: 1 },
			},
			{
				id: "spread",
				label: ["Spread and midpoint", "价差与中点"],
				caption: [
					"The spread is $0.10 and the midpoint $2.10. No one has traded at $2.10; the midpoint is just arithmetic.",
					"价差是 $0.10，中点是 $2.10。没有人在 $2.10 成交；中点只是算术结果。",
				],
				state: { step: "spread", side: "buy", size: 1 },
			},
			{
				id: "last",
				label: ["Last", "最新成交"],
				caption: [
					"Last is $2.00, from 5 contracts at 10:12. It is below today's bid: the quote has moved since, so last is history, not a price on offer.",
					"最新成交是 $2.00，来自 10:12 的 5 张。它低于当前买价：报价已经变了，所以最新成交是历史，不是可成交的价格。",
				],
				state: { step: "last", side: "buy", size: 1 },
			},
			{
				id: "trade",
				label: ["A trade", "一笔成交"],
				caption: [
					"A market order to buy one takes the $2.15 ask. Only now is there a new trade: the ask shows 7 and $2.15 becomes the last.",
					"买入 1 张的市价单吃掉 $2.15 卖价。此时才有新成交：卖价数量变为 7，$2.15 成为最新成交价。",
				],
				state: { step: "trade", side: "buy", size: 1 },
			},
		],
		explore: {
			prompt: [
				"Send a market order to buy or sell, and change its size.",
				"发送买入或卖出的市价单，并改变数量。",
			],
			start: () => ({ step: "trade", side: "buy", size: 10 }),
			task: {
				kind: "reach",
				prompt: [
					"Send the market order that leaves exactly 7 contracts on the best bid.",
					"发出一笔市价单，让最优买价上正好剩下 7 张。",
				],
				reached: (e) => e.side === "sell" && e.size === 5,
				done: [
					"A market sell hits the best bid: 12 contracts at $2.05, less your 5, leaves 7. The bid price only moves once its size is used up.",
					"市价卖单会成交在最优买价上：$2.05 的 12 张减去你的 5 张，剩 7 张。只有这一价位的数量用完，买价才会变。",
				],
			},
		},
		View: QuoteView,
	}),
	defineScene<EventState, EventState>({
		id: "orders",
		label: ["Orders and trades", "订单与成交"],
		title: [
			"Orders change the book; only trades print",
			"订单改变订单簿，只有成交才会记录",
		],
		predict: {
			prompt: [
				"The size offered at $2.15 falls from 13 contracts to 8. Did 5 contracts trade?",
				"$2.15 的卖出数量从 13 张降到 8 张。是否有 5 张成交？",
			],
			choices: [
				{
					id: "unknown",
					label: [
						"Not necessarily: a cancel does the same",
						"不一定：撤单也会这样",
					],
				},
				{ id: "traded", label: ["Yes, 5 traded", "是的，成交了 5 张"] },
				{
					id: "rose",
					label: ["Yes, and the price will rise", "是的，而且价格会上涨"],
				},
			],
			answer: "unknown",
			revealAt: 1,
			explain: [
				"A seller cancelling 5 contracts shrinks the size exactly as a trade would. Only a print on the tape shows that contracts actually traded.",
				"卖方撤销 5 张，数量减少的方式与成交完全一样。只有逐笔成交里的记录才能证明真的成交了。",
			],
		},
		beats: [
			{
				id: "add",
				label: ["Add", "新增"],
				caption: [
					"A seller adds 5 contracts at $2.15. The ask size grows from 8 to 13, but nothing traded: the tape is unchanged.",
					"一位卖方在 $2.15 新增 5 张。卖价数量从 8 增至 13，但没有成交：逐笔成交没有变化。",
				],
				state: { event: "add" },
			},
			{
				id: "cancel",
				label: ["Cancel", "撤单"],
				caption: [
					"The seller cancels. The size falls back to 8, again with no trade. A shrinking size alone doesn't mean anyone bought.",
					"卖方撤单，数量回到 8，同样没有成交。仅凭数量减少，不能说明有人买入。",
				],
				state: { event: "cancel" },
			},
			{
				id: "trade",
				label: ["Trade", "成交"],
				caption: [
					"A buyer takes 3 at $2.15. The size falls to 5 and this time a print appears: 3 contracts at 10:31. Volume rises by 3.",
					"一位买方在 $2.15 买入 3 张。数量降到 5，这次出现了成交记录：10:31 成交 3 张，成交量增加 3。",
				],
				state: { event: "trade" },
			},
		],
		explore: {
			prompt: [
				"Pick what happens to the offer at $2.15 and compare the book with the tape.",
				"选择 $2.15 卖单发生的事，比较订单簿与逐笔成交。",
			],
			start: () => ({ event: "cancel" }),
			task: {
				kind: "answer",
				prompt: [
					"Which of the three events adds to the day's volume?",
					"三个事件中，哪一个会增加当天的成交量？",
				],
				choices: [
					{ id: "trade", label: ["The trade", "成交"] },
					{ id: "cancel", label: ["The cancel", "撤单"] },
					{ id: "add", label: ["The added offer", "新增挂单"] },
				],
				answer: "trade",
				done: [
					"Only a trade prints on the tape and counts in volume. Adding or cancelling an offer changes the book's size without anyone trading.",
					"只有成交会出现在成交记录里并计入成交量。新增或撤销挂单只改变订单簿的数量，没有人成交。",
				],
			},
		},
		View: EventView,
	}),
	defineScene<VenueState, VenueState>({
		id: "venues",
		label: ["Across venues", "跨场所"],
		title: [
			"The best bid and ask can come from different venues",
			"最优买价与卖价可以来自不同场所",
		],
		predict: {
			prompt: [
				"Venue A quotes $2.00 / $2.20, B $2.05 / $2.25 and C $1.95 / $2.15. What is the best quote across them?",
				"场所 A 报 $2.00 / $2.20，B 报 $2.05 / $2.25，C 报 $1.95 / $2.15。跨场所的最优报价是多少？",
			],
			choices: [
				{ id: "best", label: ["$2.05 / $2.15", "$2.05 / $2.15"] },
				{
					id: "a",
					label: ["$2.00 / $2.20, venue A's", "$2.00 / $2.20，场所 A 的"],
				},
				{ id: "wide", label: ["$1.95 / $2.25", "$1.95 / $2.25"] },
			],
			answer: "best",
			revealAt: 2,
			explain: [
				"The best bid is the highest, $2.05 at B; the best ask is the lowest, $2.15 at C. Together they make a $0.10 spread that no single venue shows.",
				"最优买价取最高的 B 的 $2.05，最优卖价取最低的 C 的 $2.15。两者组成 $0.10 的价差，没有任何单一场所显示这个价差。",
			],
		},
		beats: [
			{
				id: "one",
				label: ["One venue", "单一场所"],
				caption: [
					"Venue A alone quotes the Oct 18 105 call at $2.00 bid and $2.20 ask: a $0.20 spread.",
					"仅看场所 A，10月18日 105 看涨买价 $2.00、卖价 $2.20：价差 $0.20。",
				],
				state: { shown: 1, best: false, cAsk: 215 },
			},
			{
				id: "all",
				label: ["Three venues", "三个场所"],
				caption: [
					"Two more venues quote the same contract at the same moment, each with its own prices and sizes.",
					"另外两个场所在同一时刻报出同一合约，各有自己的价格和数量。",
				],
				state: { shown: 3, best: false, cAsk: 215 },
			},
			{
				id: "best",
				label: ["Best of all", "最优组合"],
				caption: [
					"The best bid is B's $2.05 and the best ask is C's $2.15. Together they are the NBBO, $0.10 wide, tighter than any one venue.",
					"最优买价是 B 的 $2.05，最优卖价是 C 的 $2.15。两者合起来就是 NBBO，价差 $0.10，比任何单一场所都窄。",
				],
				state: { shown: 3, best: true, cAsk: 215 },
			},
			{
				id: "moves",
				label: ["It moves", "随时变化"],
				caption: [
					"A buyer takes all 8 contracts at C. The best ask becomes A's $2.20: the NBBO changes whenever a venue's quote does.",
					"一位买方吃掉 C 的全部 8 张。最优卖价变成 A 的 $2.20：任一场所报价变化，NBBO 就随之改变。",
				],
				state: { shown: 3, best: true, cAsk: null },
			},
		],
		explore: {
			prompt: [
				"Move venue C's ask and watch when it stops being the best.",
				"移动场所 C 的卖价，看看它何时不再是最优。",
			],
			start: () => ({ shown: 3, best: true, cAsk: 215 }),
			task: {
				kind: "reach",
				prompt: [
					"Raise venue C's ask until another venue sets the best ask.",
					"提高场所 C 的卖价，直到由另一个场所给出最优卖价。",
				],
				reached: (e) => (e.cAsk ?? 215) > 220,
				done: [
					"Above $2.20, venue A's ask is the lowest, so it becomes the best ask. The best quote is whichever venue is best at that moment.",
					"高于 $2.20 后，场所 A 的卖价最低，于是成为最优卖价。最优报价属于此刻报价最好的那个场所。",
				],
			},
		},
		View: VenueView,
	}),
] as const;

export function QuotesOrdersTradesWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="quotes-orders-trades"
			label={[
				"Interactive lesson on quotes, orders and trades",
				"报价、订单与成交互动课",
			]}
			scenes={scenes}
		/>
	);
}
