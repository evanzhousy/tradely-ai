import { FieldGroup } from "@tradely/ui/components/field";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import {
	type Copy,
	contractLabel,
	count,
	holders,
	type Level,
	OCT_100_CALL,
	oct100CallBookBeforeT1,
	oct100CallMonday,
	pick,
	sweep,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import {
	afterTaking,
	BookTape,
	bookTapeHeight,
	type Print,
} from "../walkthrough/instruments/book-tape";
import {
	type BookLabels,
	type BookLevel,
	bookHeight,
	OrderBook,
} from "../walkthrough/instruments/order-book";
import { Label, Stage, useStage, useTeachMotion } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

const BOOK = oct100CallBookBeforeT1;
const T1 = oct100CallMonday.trades[0];
const LABEL = contractLabel(OCT_100_CALL, false);
const BIDS: readonly Level[] = BOOK.bids;
const ASKS: readonly Level[] = BOOK.asks;

function bookLabels(locale: Locale): BookLabels {
	const t = tr(locale);
	return {
		bid: t(["Bids · contracts", "买单 · 张"]),
		ask: t(["Asks · contracts", "卖单 · 张"]),
		price: t(["Price", "价格"]),
		spread: t(["spread", "价差"]),
		last: t(["last", "最新"]),
		filled: (size) => t([`took ${count(size)}`, `成交 ${count(size)}`]),
		mine: t(["yours", "你的"]),
	};
}

// ——— Scene 1: one trade, two sides ———

type MatchStep = "resting" | "incoming" | "match";
type MatchState = { step: MatchStep; side: "buy" | "sell" };

/** Ben's offer is tagged so the resting side has a name. */
const tagged = (levels: readonly BookLevel[], locale: Locale): BookLevel[] =>
	levels.map((level, i) =>
		i === 0 && level.price === ASKS[0].price
			? { ...level, venue: pick(holders.ben.name, locale) }
			: level,
	);

function MatchView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: MatchState;
	explore: MatchState | null;
	setExplore: (next: MatchState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const buy = shown.side === "buy";
	const matched = shown.step === "match";
	const size = T1.quantity;
	const order = sweep(buy ? ASKS : BIDS, size);
	const asks =
		matched && buy
			? afterTaking(ASKS, order.fills)
			: ([...ASKS] as BookLevel[]);
	const bids =
		matched && !buy
			? afterTaking(BIDS, order.fills)
			: ([...BIDS] as BookLevel[]);
	const price = order.fills[0].price;
	const prints: Print[] = matched
		? [{ time: BOOK.time, size: order.filled, price }]
		: [];
	const you = t(holders.you.name);
	const resting = buy
		? t(holders.ben.name)
		: t(["A resting buyer", "挂单买方"]);
	const result: ResultItem[] =
		shown.step === "resting"
			? [
					{
						id: "ask",
						label: t(["Best ask", "最优卖价"]),
						value: `${usd(ASKS[0].price)} × ${ASKS[0].size}`,
						note: t(["Ben's resting offer", "Ben 的挂单卖出"]),
					},
					{
						id: "bid",
						label: t(["Best bid", "最优买价"]),
						value: `${usd(BIDS[0].price)} × ${BIDS[0].size}`,
					},
					{
						id: "trades",
						label: t(["Trades today", "今日成交"]),
						value: "0",
					},
				]
			: shown.step === "incoming"
				? [
						{
							id: "order",
							label: t(["Incoming order", "到来的订单"]),
							value: buy
								? t([`buy ${size} at market`, `市价买入 ${size} 张`])
								: t([`sell ${size} at market`, `市价卖出 ${size} 张`]),
							note: t(["yours, arriving now", "你的，刚刚到达"]),
						},
						{
							id: "meets",
							label: t(["It meets", "它将遇到"]),
							value: buy
								? t([
										`Ben's offer at ${usd(price)}`,
										`Ben 在 ${usd(price)} 的卖单`,
									])
								: t([`the bid at ${usd(price)}`, `${usd(price)} 的买单`]),
						},
						{
							id: "trades",
							label: t(["Trades today", "今日成交"]),
							value: "0",
						},
					]
				: [
						{
							id: "buyer",
							label: t(["Buyer", "买方"]),
							value: buy ? you : resting,
							note: buy
								? t(["incoming: the aggressor", "主动到来：主动方"])
								: t(["resting: was waiting", "挂单：一直在等待"]),
						},
						{
							id: "seller",
							label: t(["Seller", "卖方"]),
							value: buy ? resting : you,
							note: buy
								? t([
										`resting: waiting at ${usd(price)}`,
										`挂单：在 ${usd(price)} 等待`,
									])
								: t(["incoming: the aggressor", "主动到来：主动方"]),
						},
						{
							id: "volume",
							label: t(["Volume", "成交量"]),
							value: t([`${order.filled} contracts`, `${order.filled} 张`]),
							note: t(["one trade, not two", "一笔成交，不是两笔"]),
						},
					];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						`The ${LABEL[0]} book at ${BOOK.time}: an incoming order meets a resting one and prints once`,
						`${BOOK.time} 的 ${LABEL[1]} 订单簿：到来的订单遇到挂单，产生一笔成交`,
					])}
					height={bookTapeHeight(3, 3, 1)}
				>
					{(width) => (
						<BookTape
							width={width}
							bids={buy ? bids : tagged(bids, locale)}
							asks={tagged(asks, locale)}
							fills={
								matched
									? order.fills.map((fill) => ({
											...fill,
											side: buy ? ("ask" as const) : ("bid" as const),
										}))
									: []
							}
							prints={prints}
							sizeMax={25}
							labels={bookLabels(locale)}
							tape={{
								title: t([
									`Time and sales · ${LABEL[0]}`,
									`逐笔成交 · ${LABEL[1]}`,
								]),
								time: t(["Time", "时间"]),
								size: t(["Contracts", "张数"]),
								price: t(["Price", "价格"]),
								empty: t(["No trades yet today", "今日尚无成交"]),
							}}
							tapeRows={1}
							incoming={
								shown.step === "incoming"
									? {
											side: shown.side,
											label:
												width < 520
													? t([
															buy ? `buy ${size}` : `sell ${size}`,
															buy ? `买 ${size}` : `卖 ${size}`,
														])
													: buy
														? t([`you: buy ${size}`, `你：买 ${size}`])
														: t([`you: sell ${size}`, `你：卖 ${size}`]),
										}
									: undefined
							}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Your incoming order", "你到来的订单"])}
						value={explore.side}
						options={[
							["buy", t(["Buy 10 at market", "市价买入 10 张"])],
							["sell", t(["Sell 10 at market", "市价卖出 10 张"])],
						]}
						onChange={(side) => setExplore({ ...explore, side })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Every trade has one buyer and one seller. The order that arrives and trades at once is the aggressor; the order it meets was resting in the book. An incoming buyer pays the ask and the resting seller receives the same price: one execution, printed once, counted once in volume.",
						"每笔成交都有一个买方和一个卖方。到达后立即成交的订单是主动方；它遇到的是订单簿里的挂单。主动买方支付卖价，挂单卖方以同一价格卖出：这是一笔成交，只记录一次，成交量也只计一次。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: a limit cannot create liquidity ———

type LimitState = {
	/** Cents per share. */
	limit: number;
	size: number;
	/** 0: the order arrives; 1–2: levels taken; 3: the remainder rests. */
	step: number;
};

function limitOutcome(state: LimitState) {
	const eligible = ASKS.filter((level) => level.price <= state.limit);
	const order = sweep(eligible, state.size);
	const fills = order.fills.slice(0, state.step >= 3 ? undefined : state.step);
	const filled = fills.reduce((sum, fill) => sum + fill.size, 0);
	const notional = fills.reduce((sum, fill) => sum + fill.price * fill.size, 0);
	const rests = state.step >= 3 ? state.size - filled : 0;
	return {
		fills,
		filled,
		notional,
		rests,
		unfilled: state.size - order.filled,
	};
}

function LimitView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: LimitState;
	explore: LimitState | null;
	setExplore: (next: LimitState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const outcome = limitOutcome(shown);
	const asks = afterTaking(ASKS, outcome.fills);
	const bids: BookLevel[] =
		outcome.rests > 0
			? [
					{ price: shown.limit, size: outcome.rests, mine: true },
					...BIDS.filter((level) => level.price !== shown.limit),
				]
					.sort((a, b) => b.price - a.price)
					.slice(0, 4)
			: [...BIDS];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A buy limit order taking offers up to its limit, with the rest waiting as a bid",
						"买入限价单吃掉不超过限价的卖单，剩余部分作为买单等待",
					])}
					height={bookHeight(4, 3)}
				>
					{(width) => (
						<OrderBook
							width={width}
							bids={bids}
							asks={asks}
							fills={outcome.fills.map((fill) => ({
								...fill,
								side: "ask" as const,
							}))}
							sizeMax={25}
							labels={bookLabels(locale)}
							incoming={
								shown.step === 0
									? {
											side: "buy",
											label:
												width < 520
													? t([`buy ${shown.size}`, `买 ${shown.size}`])
													: t([
															`buy ${shown.size} · limit ${usd(shown.limit)}`,
															`买 ${shown.size} · 限价 ${usd(shown.limit)}`,
														]),
										}
									: undefined
							}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "filled",
					label: t(["Filled", "已成交"]),
					value: t([
						`${outcome.filled} of ${shown.size}`,
						`${shown.size} 张中的 ${outcome.filled} 张`,
					]),
					note: outcome.fills.length
						? outcome.fills
								.map((fill) => `${fill.size} @ ${usd(fill.price)}`)
								.join(" · ")
						: t(["nothing yet", "尚无成交"]),
				},
				{
					id: "average",
					label: t(["Average price", "平均价格"]),
					value: outcome.filled
						? usd(Math.round(outcome.notional / outcome.filled))
						: "—",
					evidence: outcome.filled ? "calculated" : undefined,
				},
				{
					id: "rest",
					label: t(["Unfilled", "未成交"]),
					value: shown.step >= 3 ? count(outcome.unfilled) : "—",
					note:
						shown.step >= 3 && outcome.unfilled > 0
							? t([
									`resting as your bid at ${usd(shown.limit)}`,
									`作为你的买单在 ${usd(shown.limit)} 等待`,
								])
							: undefined,
				},
			]}
			controls={
				explore ? (
					<FieldGroup>
						<RangeControl
							label={t(["Your limit", "你的限价"])}
							value={explore.limit}
							display={usd(explore.limit)}
							min={405}
							max={425}
							step={5}
							onChange={(limit) => setExplore({ ...explore, limit })}
						/>
						<ChoiceField
							label={t(["Contracts", "张数"])}
							value={String(explore.size) as "10" | "30" | "50"}
							options={[
								["10", "10"],
								["30", "30"],
								["50", "50"],
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
						"A limit order caps the price, not the outcome. It trades at once with whatever the book offers within the limit, best price first, and whatever is left waits in the book as a new order. A market order has no cap: it keeps taking the next price until it is filled. Neither can trade size that isn't there.",
						"限价单限制的是价格，而不是结果。它会立即与限价以内的挂单成交，价格优先，剩余部分作为新订单留在订单簿等待。市价单没有上限，会一直吃下一个价位直到成交完毕。两者都无法成交不存在的数量。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: what a print can't tell you ———

type OriginState = { known: 0 | 1 | 2; limit: number };

function originLayout(width: number) {
	const cardWidth = (width - 24) / 2;
	return {
		cards: [8, 16 + cardWidth],
		cardWidth,
		cardTop: 30,
		cardHeight: 78,
		printTop: 170,
		printWidth: Math.min(320, width - 16),
		height: 240,
	};
}

function OriginStage({
	width,
	state,
	locale,
}: {
	width: number;
	state: OriginState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const { hatch } = useStage();
	const layout = originLayout(width);
	const printX = (width - layout.printWidth) / 2;
	const records = [
		{
			id: "A",
			type: t(["market", "市价"]),
		},
		{
			id: "B",
			type: t([`limit ${usd(state.limit)}`, `限价 ${usd(state.limit)}`]),
		},
	];
	return (
		<g>
			<Label x={8} y={18} tone="muted">
				{t(["Order records · private to each broker", "订单记录 · 仅券商可见"])}
			</Label>
			{records.map((record, i) => {
				const x = layout.cards[i];
				const known = state.known > i;
				const cx = x + layout.cardWidth / 2;
				return (
					<g key={record.id}>
						<rect
							x={x}
							y={layout.cardTop}
							width={layout.cardWidth}
							height={layout.cardHeight}
							rx={12}
							className={known ? "wt-focus-shape" : "wt-panel-shape"}
							style={known ? undefined : { fill: hatch }}
						/>
						<Label x={x + 12} y={layout.cardTop + 22} tone="muted">
							{t([`Record ${record.id}`, `记录 ${record.id}`])}
						</Label>
						<AnimatePresence initial={false}>
							{known ? (
								<m.g
									key={`${record.id}-${record.type}`}
									initial={motion.enabled ? { opacity: 0, y: 6 } : false}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0 }}
									transition={motion.fade}
								>
									<Label x={x + 12} y={layout.cardTop + 46} tone="strong">
										{t([`Buy ${T1.quantity}`, `买入 ${T1.quantity} 张`])}
									</Label>
									<Label x={x + 12} y={layout.cardTop + 66} tone="accent">
										{record.type}
									</Label>
								</m.g>
							) : (
								<m.g
									key={`${record.id}-unknown`}
									initial={false}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
								>
									<Label x={x + 12} y={layout.cardTop + 56} tone="strong">
										?
									</Label>
								</m.g>
							)}
						</AnimatePresence>
						{known ? (
							<m.path
								d={`M${cx} ${layout.cardTop + layout.cardHeight + 6}L${width / 2 + (i === 0 ? -30 : 30)} ${layout.printTop - 8}`}
								className="wt-arrow wt-arrow-contract"
								initial={motion.enabled ? { pathLength: 0 } : false}
								animate={{ pathLength: 1 }}
								transition={motion.move}
							/>
						) : null}
					</g>
				);
			})}
			<Label x={printX} y={layout.printTop - 14} tone="muted">
				{t(["Public tape", "公开成交记录"])}
			</Label>
			<rect
				x={printX}
				y={layout.printTop}
				width={layout.printWidth}
				height={56}
				rx={12}
				className="wt-panel-shape"
			/>
			<Label x={printX + 14} y={layout.printTop + 24} tone="strong">
				{`${T1.time} · ${T1.quantity} @ ${usd(T1.price)}`}
			</Label>
			<Label x={printX + 14} y={layout.printTop + 44} tone="small">
				{t([
					"price, size, time: no order type",
					"价格、数量、时间：没有订单类型",
				])}
			</Label>
		</g>
	);
}

function OriginView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: OriginState;
	explore: OriginState | null;
	setExplore: (next: OriginState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] = [
		{
			id: "print",
			label: t(["The print", "成交记录"]),
			value: `${T1.quantity} @ ${usd(T1.price)}`,
			note: t([`${T1.time}, at the ask`, `${T1.time}，成交于卖价`]),
		},
		shown.known === 0
			? {
					id: "type",
					label: t(["Order type", "订单类型"]),
					value: t(["not on the tape", "成交记录中没有"]),
					evidence: "unknown",
				}
			: shown.known === 1
				? {
						id: "type",
						label: t(["Record A", "记录 A"]),
						value: t(["market buy", "市价买入"]),
						note: t(["what you actually sent", "你实际发送的订单"]),
					}
				: {
						id: "type",
						label: t(["Same print from", "同样的成交可能来自"]),
						value: t(["market or limit", "市价或限价"]),
						note: t([
							`a limit at ${usd(shown.limit)} fills at the ${usd(T1.price)} ask too`,
							`限价 ${usd(shown.limit)} 同样在 ${usd(T1.price)} 卖价成交`,
						]),
						evidence: "inferred",
					},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Two different order records that produce the same public print",
						"两份不同的订单记录产生同一条公开成交记录",
					])}
					height={(width) => originLayout(width).height}
				>
					{(width) => (
						<OriginStage width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Record B's limit", "记录 B 的限价"])}
						value={String(explore.limit) as "410" | "415" | "420"}
						options={[
							["410", "$4.10"],
							["415", "$4.15"],
							["420", "$4.20"],
						]}
						onChange={(limit) =>
							setExplore({ ...explore, limit: Number(limit) })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A print records price, size and time. It does not record whether the order was a market order or a limit order, who sent it, or why. Any buy limit at or above the $4.10 ask would have filled at $4.10, exactly like a market order. Only the brokers' own records show the instruction.",
						"成交记录只包含价格、数量和时间，不包含订单是市价还是限价、由谁发出、为何发出。任何不低于 $4.10 卖价的买入限价单都会在 $4.10 成交，与市价单完全一样。只有券商自己的记录才显示原始指令。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<MatchState, MatchState>({
		id: "two-sides",
		label: ["One trade, two sides", "一笔成交，两方"],
		title: [
			"Every trade has a buyer and a seller",
			"每笔成交都有一个买方和一个卖方",
		],
		predict: {
			prompt: [
				"You buy 10 Oct 18 100 calls from Ben's resting offer at $4.10. How much does this add to the day's volume?",
				"你从 Ben 在 $4.10 的挂单买入 10 张 10月18日 100 看涨。这会让当天成交量增加多少？",
			],
			choices: [
				{ id: "ten", label: ["10 contracts: one trade", "10 张：一笔成交"] },
				{ id: "twenty", label: ["20: a buy and a sell", "20 张：一买一卖"] },
				{ id: "none", label: ["0 until Ben confirms", "Ben 确认前为 0"] },
			],
			answer: "ten",
			entry: { answer: 10, unit: [" contracts", " 张"] },
			revealAt: 2,
			explain: [
				"Your buy and Ben's sell are the same execution seen from two sides. It prints once and adds 10 to volume.",
				"你的买入与 Ben 的卖出是同一笔成交的两面。它只记录一次，成交量增加 10。",
			],
		},
		beats: [
			{
				id: "resting",
				label: ["Resting", "挂单"],
				caption: [
					"10:05. Ben has offered 10 Oct 18 100 calls at $4.10 and is waiting. A resting order sits in the book until someone takes it.",
					"10:05。Ben 以 $4.10 挂出 10 张 10月18日 100 看涨并在等待。挂单会留在订单簿中，直到有人成交。",
				],
				state: { step: "resting", side: "buy" },
			},
			{
				id: "incoming",
				label: ["Incoming", "到来"],
				caption: [
					"Your market order to buy 10 arrives. It wants to trade now, so it goes straight to the best offer: Ben's.",
					"你的市价买入 10 张订单到达。它要求立即成交，所以直接找最优卖价：Ben 的挂单。",
				],
				state: { step: "incoming", side: "buy" },
			},
			{
				id: "match",
				label: ["One trade", "一笔成交"],
				caption: [
					"You buy 10 at $4.10 and Ben sells 10 at $4.10. That is one trade: it prints once and adds 10 to volume, not 20.",
					"你以 $4.10 买入 10 张，Ben 以 $4.10 卖出 10 张。这是一笔成交：只记录一次，成交量增加 10，而不是 20。",
				],
				state: { step: "match", side: "buy" },
			},
		],
		explore: {
			prompt: [
				"Send a sell instead and see which side is resting.",
				"改为发送卖单，看看哪一方是挂单。",
			],
			start: () => ({ step: "match", side: "sell" }),
			task: {
				kind: "answer",
				prompt: [
					"When you sell 10 at market, whose order was already waiting in the book?",
					"当你以市价卖出 10 张时，谁的订单已经在订单簿里等待？",
				],
				choices: [
					{ id: "bid", label: ["A buyer's bid", "一位买方的挂单"] },
					{ id: "you", label: ["Yours", "你的"] },
					{ id: "ben", label: ["Ben's offer", "Ben 的卖出挂单"] },
				],
				answer: "bid",
				done: [
					"A market sell takes the best bid: a buyer's order that was resting there. Yours arrived and traded at once, so you are the aggressor. The trade still prints once.",
					"市价卖单会成交在最优买价：那是一位买方早已挂着的订单。你的订单一到就成交，所以你是主动方。这笔成交仍然只记录一次。",
				],
			},
		},
		View: MatchView,
	}),
	defineScene<LimitState, LimitState>({
		id: "limits",
		label: ["Limits and size", "限价与数量"],
		title: [
			"A limit caps the price; it can't create size",
			"限价限制价格，但不能创造数量",
		],
		predict: {
			prompt: [
				"You send a buy limit at $4.15 for 30 contracts into this book. How many fill right away?",
				"你向这个订单簿发送 30 张、限价 $4.15 的买单。有多少会立即成交？",
			],
			choices: [
				{
					id: "some",
					label: [
						"22; the other 8 wait at $4.15",
						"22 张；另外 8 张在 $4.15 等待",
					],
				},
				{ id: "all", label: ["All 30, at $4.15", "全部 30 张，价格 $4.15"] },
				{
					id: "none",
					label: ["None: limit orders always wait", "0 张：限价单总是等待"],
				},
			],
			answer: "some",
			entry: { answer: 22, unit: [" contracts", " 张"] },
			revealAt: 3,
			explain: [
				"The limit lets you take 10 at $4.10 and 12 at $4.15, but nothing else is offered at $4.15 or less. The other 8 rest as your bid.",
				"限价允许你吃下 $4.10 的 10 张和 $4.15 的 12 张，但 $4.15 及以下已没有卖单。其余 8 张作为你的买单等待。",
			],
		},
		beats: [
			{
				id: "order",
				label: ["The order", "订单"],
				caption: [
					"Suppose instead you want 30 contracts and will pay at most $4.15. The book offers 10 at $4.10, 12 at $4.15 and 20 at $4.20.",
					"假设你想买 30 张，最多付 $4.15。订单簿上有 $4.10 的 10 张、$4.15 的 12 张和 $4.20 的 20 张。",
				],
				state: { limit: 415, size: 30, step: 0 },
			},
			{
				id: "first",
				label: ["Best price first", "价格优先"],
				caption: [
					"Your order takes the best offer first: 10 contracts at $4.10.",
					"你的订单先吃最优卖价：$4.10 的 10 张。",
				],
				state: { limit: 415, size: 30, step: 1 },
			},
			{
				id: "second",
				label: ["Next level", "下一档"],
				caption: [
					"Then all 12 at $4.15, still within your limit. That makes 22.",
					"接着吃下 $4.15 的全部 12 张，仍在限价以内。合计 22 张。",
				],
				state: { limit: 415, size: 30, step: 2 },
			},
			{
				id: "rest",
				label: ["The rest waits", "剩余等待"],
				caption: [
					"$4.20 is above your limit, so the last 8 stop there. They wait in the book as your bid at $4.15, now the best bid.",
					"$4.20 超过你的限价，最后 8 张就此停下。它们作为你在 $4.15 的买单留在订单簿，成为新的最优买价。",
				],
				state: { limit: 415, size: 30, step: 3 },
			},
		],
		explore: {
			prompt: [
				"Change your limit and size, and see what fills and what waits.",
				"改变限价和数量，看看哪些成交、哪些等待。",
			],
			start: () => ({ limit: 415, size: 30, step: 3 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the lowest limit that fills all 30 contracts right away.",
					"找出能让 30 张全部立即成交的最低限价。",
				],
				reached: (e) => e.size === 30 && e.limit === 420,
				done: [
					"At $4.20 the order reaches the third level: 10 + 12 + the last 8 at $4.20 make 30. One step lower and those 8 would wait as your bid.",
					"限价 $4.20 时，订单能吃到第三档：10 + 12 + 最后 8 张（$4.20）共 30 张。再低一档，这 8 张就会作为你的买单等待。",
				],
			},
		},
		View: LimitView,
	}),
	defineScene<OriginState, OriginState>({
		id: "print",
		label: ["What a print shows", "成交记录能说明什么"],
		title: [
			"The same print can come from different orders",
			"同一条成交记录可能来自不同订单",
		],
		predict: {
			prompt: [
				"The tape shows 10 contracts at $4.10, the ask, at 10:05. What kind of order sent it?",
				"成交记录显示 10:05 在卖价 $4.10 成交 10 张。是什么类型的订单发出的？",
			],
			choices: [
				{
					id: "unknown",
					label: ["Can't tell from the print", "仅凭成交记录无法判断"],
				},
				{ id: "market", label: ["A market order", "市价单"] },
				{ id: "limit", label: ["A limit order", "限价单"] },
			],
			answer: "unknown",
			revealAt: 2,
			explain: [
				"A market order and a buy limit at $4.10 or higher both fill at the $4.10 ask and print identically. The tape carries no order type.",
				"市价单和不低于 $4.10 的买入限价单都会在 $4.10 卖价成交，记录完全相同。成交记录不包含订单类型。",
			],
		},
		beats: [
			{
				id: "print",
				label: ["The print", "成交记录"],
				caption: [
					"The public tape shows the 10:05 trade: 10 contracts at $4.10. It records price, size and time, nothing about the order behind it.",
					"公开成交记录显示 10:05 的成交：10 张，$4.10。它记录价格、数量和时间，不涉及背后的订单。",
				],
				state: { known: 0, limit: 410 },
			},
			{
				id: "market",
				label: ["Record A", "记录 A"],
				caption: [
					"Your broker's record shows what you sent: a market order to buy 10.",
					"你的券商记录显示你发出的订单：市价买入 10 张。",
				],
				state: { known: 1, limit: 410 },
			},
			{
				id: "limit",
				label: ["Record B", "记录 B"],
				caption: [
					"A buy limit at $4.10 would have met the same offer and printed exactly the same line. The tape alone can't tell them apart.",
					"$4.10 的买入限价单也会遇到同一个卖单，产生完全相同的记录。仅凭成交记录无法区分两者。",
				],
				state: { known: 2, limit: 410 },
			},
		],
		explore: {
			prompt: [
				"Raise record B's limit. Does the print change?",
				"提高记录 B 的限价。成交记录会变吗？",
			],
			start: () => ({ known: 2, limit: 420 }),
			task: {
				kind: "answer",
				prompt: [
					"Raise record B's limit to $4.20. What changes on the tape?",
					"把记录 B 的限价提高到 $4.20。成交记录上有什么变化？",
				],
				choices: [
					{
						id: "nothing",
						label: ["Nothing: still 10 at $4.10", "没有变化：仍是 10 张 $4.10"],
					},
					{
						id: "price",
						label: ["The print moves to $4.20", "成交价变成 $4.20"],
					},
					{ id: "two", label: ["A second print appears", "出现第二笔成交"] },
				],
				answer: "nothing",
				done: [
					"The order still meets the $4.10 offer, so it prints 10 at $4.10 either way. A limit caps what you'd pay; it never shows on the tape.",
					"订单仍然成交在 $4.10 的卖价上，所以两种情况都记录为 10 张 $4.10。限价只是你愿付的上限，不会出现在成交记录里。",
				],
			},
		},
		View: OriginView,
	}),
] as const;

export function ExecutionCounterpartiesWalkthrough({
	locale,
}: {
	locale: Locale;
}) {
	return (
		<Walkthrough
			locale={locale}
			id="execution-counterparties"
			label={[
				"Interactive lesson on counterparties in one trade",
				"一笔成交中的交易双方互动课",
			]}
			scenes={scenes}
		/>
	);
}
