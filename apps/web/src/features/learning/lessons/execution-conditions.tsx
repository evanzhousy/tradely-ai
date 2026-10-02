import * as m from "motion/react-m";
import {
	type Copy,
	count,
	type Level,
	oct105BlockLegs,
	oct105CallBlock,
	oct105CallVenues,
	oct110CallSweep,
	pick,
	sweep,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
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
import { Label, Stage, useTeachMotion } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

function bookLabels(locale: Locale): BookLabels {
	const t = tr(locale);
	return {
		bid: t(["Bids · contracts", "买单 · 张"]),
		ask: t(["Asks · contracts", "卖单 · 张"]),
		price: t(["Price", "价格"]),
		spread: t(["spread", "价差"]),
		last: t(["last", "最新"]),
		filled: (size) => t([`took ${count(size)}`, `成交 ${count(size)}`]),
	};
}

/** "$0.9525": prices that need more than two decimals. */
const price4 = (cents: number) =>
	`$${(cents / 100).toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 4,
	})}`;

// ——— Scene 1: one order, several prints ———

type SweepStep = "order" | "sweep" | "cost";
type SweepState = { step: SweepStep; quantity: number };

const SWEEP = oct110CallSweep;
const SWEEP_ASKS: BookLevel[] = SWEEP.asks.map((ask) => ({
	price: ask.price,
	size: ask.size,
	venue: ask.venue,
}));
const SWEEP_BIDS: BookLevel[] = SWEEP.bids.map((bid) => ({
	price: bid.price,
	size: bid.size,
	venue: bid.venue,
}));

function SweepView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SweepState;
	explore: SweepState | null;
	setExplore: (next: SweepState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const order = sweep(SWEEP_ASKS, shown.quantity);
	const filled = shown.step !== "order";
	const asks = filled
		? afterTaking(SWEEP_ASKS, order.fills).map((level, i) => ({
				...level,
				venue: SWEEP_ASKS[i].venue,
			}))
		: SWEEP_ASKS;
	const prints: Print[] = filled
		? [...order.fills]
				.reverse()
				.map((fill) => ({ time: SWEEP.time, ...fill, condition: "ISO" }))
		: [];
	const average = order.notional / Math.max(order.filled, 1);
	const best = SWEEP_ASKS[0].price;
	const result: ResultItem[] =
		shown.step === "order"
			? [
					{
						id: "order",
						label: t(["One order", "一张订单"]),
						value: t([`buy ${shown.quantity}`, `买入 ${shown.quantity} 张`]),
						note: t([
							`limit ${usd(SWEEP.limit)}, sent to every venue at once`,
							`限价 ${usd(SWEEP.limit)}，同时发往各场所`,
						]),
					},
					{
						id: "best",
						label: t(["Best ask", "最优卖价"]),
						value: `${usd(best)} × ${SWEEP_ASKS[0].size}`,
						note: t(["venue A", "场所 A"]),
					},
				]
			: shown.step === "sweep"
				? [
						{
							id: "prints",
							label: t(["Prints", "成交记录"]),
							value: String(order.fills.length),
							note: t(["one per venue it took", "每个成交场所一笔"]),
						},
						{
							id: "filled",
							label: t(["Filled", "已成交"]),
							value: count(order.filled),
							note: order.fills
								.map((fill) => `${fill.size} @ ${usd(fill.price)}`)
								.join(" · "),
						},
					]
				: [
						{
							id: "average",
							label: t(["Average paid", "平均成交价"]),
							value: price4(average),
							note: t([
								`best displayed ask was ${usd(best)}`,
								`最优展示卖价为 ${usd(best)}`,
							]),
							evidence: "calculated",
						},
						{
							id: "premium",
							label: t(["Premium", "权利金"]),
							value: usd(order.notional * 100, 0),
							evidence: "calculated",
						},
						{
							id: "orders",
							label: t(["Orders behind it", "背后的订单"]),
							value: "1",
							note:
								order.fills.length === 1
									? t(["the tape shows one row", "逐笔成交显示一行"])
									: t([
											`the tape shows ${order.fills.length} rows`,
											`逐笔成交显示 ${order.fills.length} 行`,
										]),
						},
					];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"One buy order sweeping three venues' offers of the Oct 18 110 call and the prints it leaves",
						"一张买单扫过三个场所的 10月18日 110 看涨卖单，以及留下的成交记录",
					])}
					height={bookTapeHeight(3, 3, 3)}
				>
					{(width) => (
						<BookTape
							width={width}
							bids={SWEEP_BIDS}
							asks={asks}
							fills={
								filled
									? order.fills.map((fill) => ({
											...fill,
											side: "ask" as const,
										}))
									: []
							}
							prints={prints}
							sizeMax={30}
							labels={bookLabels(locale)}
							tape={{
								title: t([
									"Time and sales · Oct 18 110 call",
									"逐笔成交 · 10月18日 110 看涨",
								]),
								time: t(["Time", "时间"]),
								size: t(["Qty", "张数"]),
								price: t(["Price", "价格"]),
								condition: t(["Cond.", "条件"]),
								empty: t(["No prints yet", "尚无成交"]),
							}}
							tapeRows={3}
							incoming={
								shown.step === "order"
									? {
											side: "buy",
											label:
												width < 520
													? t([
															`sweep ${shown.quantity}`,
															`扫 ${shown.quantity}`,
														])
													: t([
															`sweep: buy ${shown.quantity}`,
															`扫单：买 ${shown.quantity}`,
														]),
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
						label={t(["Order size", "订单数量"])}
						value={String(explore.quantity) as "10" | "25" | "40" | "55"}
						options={[
							["10", "10"],
							["25", "25"],
							["40", "40"],
							["55", "55"],
						]}
						onChange={(value) =>
							setExplore({ ...explore, quantity: Number(value) })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A sweep sends one order to several venues at the same moment, usually as intermarket sweep orders (ISO), so it takes each venue's displayed size without waiting. Every fill prints on its own, and the later fills cost more than the best displayed ask. The ISO code says how the order was routed; it doesn't say who sent it or why.",
						"扫单在同一时刻把一张订单发往多个场所，通常以跨市场扫单指令（ISO）发出，从而不必等待就吃掉各场所显示的数量。每次成交单独打印，后面的成交比最优展示卖价更贵。ISO 代码说明订单如何路由，并不说明是谁发的、为什么发。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: a block arranged off-screen ———

type BlockStep = "displayed" | "block" | "meaning";
type BlockState = { step: BlockStep };

const BLOCK_ASKS: Level[] = oct105CallVenues
	.map((quote) => quote.ask)
	.sort((a, b) => a.price - b.price);
const BLOCK_BIDS: Level[] = oct105CallVenues
	.map((quote) => quote.bid)
	.sort((a, b) => b.price - a.price);
const COMPARE_HEIGHT = 108;

function SizeCompare({
	width,
	y,
	shown,
	locale,
}: {
	width: number;
	y: number;
	shown: boolean;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const displayed = BLOCK_ASKS[0].size;
	const traded = oct105CallBlock.quantity;
	const left = 8;
	const span = width - 16;
	const k = span / traded;
	return (
		<g>
			<Label x={left} y={y + 16} tone="muted">
				{t([
					`Contracts at ${usd(BLOCK_ASKS[0].price)}`,
					`${usd(BLOCK_ASKS[0].price)} 的张数`,
				])}
			</Label>
			<rect
				x={left}
				y={y + 26}
				width={Math.max(displayed * k, 3)}
				height={18}
				rx={3}
				className="wt-short"
			/>
			<Label x={left + Math.max(displayed * k, 3) + 8} y={y + 40}>
				{t([`${displayed} displayed`, `显示 ${displayed} 张`])}
			</Label>
			<m.rect
				x={left}
				y={y + 56}
				height={18}
				rx={3}
				className="wt-chip"
				initial={false}
				animate={{ width: shown ? traded * k : 0 }}
				transition={motion.move}
			/>
			<m.text
				x={left + 8}
				y={y + 70}
				className="wt-small wt-on-solid"
				initial={false}
				animate={{ opacity: shown ? 1 : 0 }}
				transition={motion.after(0.3)}
			>
				{t([
					`${traded} traded at ${oct105CallBlock.time} · auction`,
					`${oct105CallBlock.time} 成交 ${traded} 张 · 竞价`,
				])}
			</m.text>
			<m.text
				x={left}
				y={y + 96}
				className="wt-small"
				initial={false}
				animate={{ opacity: shown ? 1 : 0 }}
				transition={motion.after(0.4)}
			>
				{t([
					"arranged away from the screen, then printed",
					"先在屏幕外撮合，再打印成交",
				])}
			</m.text>
		</g>
	);
}

function BlockView({ locale, state }: { locale: Locale; state: BlockState }) {
	const t = tr(locale);
	const printed = state.step !== "displayed";
	const result: ResultItem[] =
		state.step === "meaning"
			? [
					{
						id: "shows",
						label: t(["The code shows", "代码说明"]),
						value: t(["how it was matched", "如何撮合"]),
						note: t(["an auction or cross", "竞价或交叉成交"]),
					},
					{
						id: "not",
						label: t(["It doesn't show", "代码不说明"]),
						value: t(["who, or what they knew", "谁、知道什么"]),
						evidence: "unknown",
					},
				]
			: [
					{
						id: "displayed",
						label: t(["Displayed at $2.15", "$2.15 显示数量"]),
						value: t([
							`${BLOCK_ASKS[0].size} contracts`,
							`${BLOCK_ASKS[0].size} 张`,
						]),
					},
					{
						id: "block",
						label: t(["Printed at $2.15", "$2.15 成交数量"]),
						value: printed
							? t([
									`${oct105CallBlock.quantity} contracts`,
									`${oct105CallBlock.quantity} 张`,
								])
							: "—",
						note: printed ? t(["condition: auction", "条件：竞价"]) : undefined,
					},
				];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The Oct 18 105 call's displayed offers against the 500-contract block that printed at $2.15",
						"10月18日 105 看涨的展示卖单，对比在 $2.15 成交的 500 张大单",
					])}
					height={bookHeight(3, 3) + 12 + COMPARE_HEIGHT}
				>
					{(width) => (
						<g>
							<OrderBook
								width={width}
								bids={BLOCK_BIDS}
								asks={BLOCK_ASKS}
								sizeMax={30}
								labels={bookLabels(locale)}
							/>
							<SizeCompare
								width={width}
								y={bookHeight(3, 3) + 12}
								shown={printed}
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
						"A block is a large trade usually negotiated away from the screen and then printed through an auction or a cross. Its price can sit at, inside or even outside the displayed quote, and its size can dwarf what was displayed. Large and arranged doesn't prove an institution, inside information or a new position.",
						"大宗交易通常先在屏幕外协商，再通过竞价或交叉成交打印。它的价格可以等于、位于甚至超出展示报价，数量也可能远超展示的数量。规模大、事先安排，并不能证明是机构、有内幕信息或新开仓位。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: read the legs as one package ———

type PackageState = { shown: 1 | 2 | 3 };

const LEGS = oct105BlockLegs;
const PACKAGE = {
	bid: LEGS.buy.bid - LEGS.sell.ask,
	ask: LEGS.buy.ask - LEGS.sell.bid,
	price: LEGS.buy.price - LEGS.sell.price,
};
const ROW_HEIGHT = 92;

function QuoteRow({
	width,
	y,
	title,
	bid,
	ask,
	price,
	priceLabel,
	min,
	max,
	accent,
}: {
	width: number;
	y: number;
	title: string;
	bid: number;
	ask: number;
	price: number;
	priceLabel: string;
	min: number;
	max: number;
	accent?: boolean;
}) {
	const left = 18;
	const right = width - 18;
	const x = (cents: number) =>
		left + ((cents - min) / (max - min)) * (right - left);
	const axis = y + 50;
	return (
		<g>
			<rect
				x={8}
				y={y}
				width={width - 16}
				height={ROW_HEIGHT - 10}
				rx={12}
				className={accent ? "wt-focus-shape" : "wt-panel-shape"}
			/>
			<Label x={left} y={y + 20} tone={accent ? "accent" : undefined}>
				{title}
			</Label>
			<path d={`M${left} ${axis}H${right}`} className="wt-axis" />
			<rect
				x={x(bid)}
				y={axis - 7}
				width={x(ask) - x(bid)}
				height={14}
				rx={3}
				className="wt-long-soft"
			/>
			<Label x={x(bid) - 4} y={axis + 22} anchor="end" tone="small">
				{usd(bid)}
			</Label>
			<Label x={x(ask) + 4} y={axis + 22} tone="small">
				{usd(ask)}
			</Label>
			<circle
				cx={x(price)}
				cy={axis}
				r={7}
				className="wt-chip"
				stroke="var(--foreground)"
				strokeWidth={1.5}
			/>
			<Label
				x={x(price)}
				y={axis - 12}
				anchor="middle"
				tone="accent"
				className="wt-halo"
			>
				{priceLabel}
			</Label>
		</g>
	);
}

function PackageView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: PackageState;
	explore: PackageState | null;
	setExplore: (next: PackageState) => void;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const shown = phase === "explore" && explore ? explore : state;
	const rows = [
		{
			id: "buy",
			title: t([
				`Bought ${LEGS.buy.quantity} Oct 18 105 calls`,
				`买入 ${LEGS.buy.quantity} 张 10月18日 105 看涨`,
			]),
			bid: LEGS.buy.bid,
			ask: LEGS.buy.ask,
			price: LEGS.buy.price,
			label: usd(LEGS.buy.price),
			min: LEGS.buy.bid - 15,
			max: LEGS.buy.ask + 15,
		},
		{
			id: "sell",
			title: t([
				`Sold ${LEGS.sell.quantity} Oct 18 110 calls`,
				`卖出 ${LEGS.sell.quantity} 张 10月18日 110 看涨`,
			]),
			bid: LEGS.sell.bid,
			ask: LEGS.sell.ask,
			price: LEGS.sell.price,
			label: usd(LEGS.sell.price),
			min: LEGS.sell.bid - 15,
			max: LEGS.sell.ask + 15,
		},
		{
			id: "package",
			title: t(["Package: 105/110 call spread", "整体：105/110 看涨价差"]),
			bid: PACKAGE.bid,
			ask: PACKAGE.ask,
			price: PACKAGE.price,
			label: t([`${usd(PACKAGE.price)} net`, `净价 ${usd(PACKAGE.price)}`]),
			min: PACKAGE.bid - 15,
			max: PACKAGE.ask + 15,
		},
	];
	const result: ResultItem[] = [
		{
			id: "buy",
			label: t(["105 call leg", "105 看涨腿"]),
			value: t([
				`bought @ ${usd(LEGS.buy.price)}`,
				`以 ${usd(LEGS.buy.price)} 买入`,
			]),
			note: t(["at its ask; alone it reads bullish", "在卖价；单看像看涨"]),
		},
	];
	if (shown.shown >= 2)
		result.push({
			id: "sell",
			label: t(["110 call leg", "110 看涨腿"]),
			value: t([
				`sold @ ${usd(LEGS.sell.price)}`,
				`以 ${usd(LEGS.sell.price)} 卖出`,
			]),
			note: t(["inside its quote", "位于报价之内"]),
		});
	if (shown.shown >= 3)
		result.push(
			{
				id: "net",
				label: t(["Package", "整体"]),
				value: t([
					`${usd(PACKAGE.price)} net debit`,
					`净支出 ${usd(PACKAGE.price)}`,
				]),
				note: t([
					`inside its ${usd(PACKAGE.bid)}–${usd(PACKAGE.ask)} market`,
					`位于 ${usd(PACKAGE.bid)}–${usd(PACKAGE.ask)} 的组合市场内`,
				]),
				evidence: "calculated",
			},
			{
				id: "max",
				label: t(["Most it can be worth", "最大价值"]),
				value: t(["$5.00 a share", "每股 $5.00"]),
				note: t(["if ALFA ends at $110 or higher", "若 ALFA 收于 $110 或以上"]),
			},
		);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Each leg of the block against its own quote, then the package against the spread's market",
						"大单的每条腿对照各自的报价，再把整体对照价差的组合市场",
					])}
					height={3 * ROW_HEIGHT}
				>
					{(width) => (
						<g>
							{rows.map((row, i) => (
								<m.g
									key={row.id}
									initial={false}
									animate={{ opacity: i < shown.shown ? 1 : 0 }}
									transition={motion.fade}
								>
									<QuoteRow
										width={width}
										y={i * ROW_HEIGHT}
										title={row.title}
										bid={row.bid}
										ask={row.ask}
										price={row.price}
										priceLabel={row.label}
										min={row.min}
										max={row.max}
										accent={i === shown.shown - 1}
									/>
								</m.g>
							))}
						</g>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Show", "显示"])}
						value={String(explore.shown) as "1" | "2" | "3"}
						options={[
							["1", t(["One leg", "一条腿"])],
							["2", t(["Both legs", "两条腿"])],
							["3", t(["The package", "整体"])],
						]}
						onChange={(value) =>
							setExplore({ shown: Number(value) as PackageState["shown"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A complex order prices several legs as one package, and the feed marks each leg's print as multi-leg. Judge the package against the spread's own market: here buying at the 105 call's ask and selling below the 110 call's ask nets $1.25, inside $1.12–$1.30. Legs can even print outside their own quotes while the package trades inside. Read alone, one leg tells the wrong story.",
						"复杂订单把多条腿作为一个整体定价，数据源会把每条腿的成交标为多腿。应把整体对照价差自己的市场来判断：这里在 105 看涨卖价买入、在低于 110 看涨卖价处卖出，净价 $1.25，位于 $1.12–$1.30 之内。单腿甚至可以超出各自报价成交，而整体仍在组合市场之内。单看一条腿，会得出错误的结论。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<SweepState, SweepState>({
		id: "sweep",
		label: ["Follow a sweep", "追踪扫单"],
		title: ["One order can leave several prints", "一张订单可以留下多笔成交"],
		predict: {
			prompt: [
				"A buy order for 40 Oct 18 110 calls sweeps three venues at once. How many prints appear on the tape?",
				"一张买入 40 张 10月18日 110 看涨的订单同时扫过三个场所。逐笔成交会出现几笔？",
			],
			choices: [
				{
					id: "three",
					label: ["3: one per venue it took", "3 笔：每个场所一笔"],
				},
				{ id: "one", label: ["1: it was one order", "1 笔：它是一张订单"] },
				{ id: "forty", label: ["40: one per contract", "40 笔：每张一笔"] },
			],
			answer: "three",
			entry: { answer: 3, unit: [" prints", " 笔"] },
			revealAt: 1,
			explain: [
				"Each venue executes its part separately, so one order prints three times: 10, 20 and 10 contracts.",
				"每个场所分别执行自己那一部分，所以一张订单打印三次：10 张、20 张和 10 张。",
			],
		},
		beats: [
			{
				id: "order",
				label: ["The order", "订单"],
				caption: [
					"11:20. A buyer wants 40 Oct 18 110 calls now, up to $0.98. Three venues display 10, 20 and 25 contracts.",
					"11:20。一位买方想立即买入 40 张 10月18日 110 看涨，最高 $0.98。三个场所分别显示 10、20、25 张。",
				],
				state: { step: "order", quantity: 40 },
			},
			{
				id: "sweep",
				label: ["The sweep", "扫单"],
				caption: [
					"Sent to all three at once as ISO orders, it takes 10 at $0.93, 20 at $0.95 and 10 at $0.98. Three prints, one order.",
					"以 ISO 指令同时发往三个场所，它吃下 $0.93 的 10 张、$0.95 的 20 张和 $0.98 的 10 张。三笔成交，一张订单。",
				],
				state: { step: "sweep", quantity: 40 },
			},
			{
				id: "cost",
				label: ["The cost", "成本"],
				caption: [
					"Speed has a price: the average paid is $0.9525 against a $0.93 best ask. The ISO code shows the routing, not who sent it or why.",
					"速度是有代价的：平均成交价 $0.9525，而最优卖价是 $0.93。ISO 代码显示路由方式，不说明是谁、为什么。",
				],
				state: { step: "cost", quantity: 40 },
			},
		],
		explore: {
			prompt: [
				"Change the order's size and watch how many prints it leaves.",
				"改变订单数量，观察它留下多少笔成交。",
			],
			start: () => ({ step: "cost", quantity: 55 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the order size that leaves exactly two prints.",
					"找出正好留下两笔成交记录的订单数量。",
				],
				reached: (e) => e.quantity === 25,
				done: [
					"25 contracts take venue A's 10 and 15 of venue B's 20: two prints from one order. The count of prints follows the venues touched, not the number of decisions.",
					"25 张会吃掉场所 A 的 10 张和场所 B 20 张中的 15 张：一笔订单，两笔成交记录。成交记录的笔数取决于触及的场所数，而不是决策的次数。",
				],
			},
		},
		View: SweepView,
	}),
	defineScene<BlockState, BlockState>({
		id: "block",
		label: ["Place a block", "定位大宗"],
		title: [
			"A block can dwarf the displayed size",
			"大宗成交可以远超展示的数量",
		],
		predict: {
			prompt: [
				"Only 8 Oct 18 105 calls were displayed at $2.15, yet 500 printed at $2.15. How?",
				"$2.15 只显示了 8 张 10月18日 105 看涨，却有 500 张在 $2.15 成交。这是怎么回事？",
			],
			choices: [
				{
					id: "arranged",
					label: [
						"It was arranged off-screen, then printed",
						"先在屏幕外撮合，再打印成交",
					],
				},
				{ id: "error", label: ["The feed must be wrong", "数据一定错了"] },
				{
					id: "forced",
					label: ["Market makers had to fill it", "做市商必须成交"],
				},
			],
			answer: "arranged",
			revealAt: 1,
			explain: [
				"Blocks are usually negotiated away from the screen and printed through an auction or cross, so displayed size doesn't limit them.",
				"大宗交易通常在屏幕外协商，再通过竞价或交叉成交打印，所以不受展示数量限制。",
			],
		},
		beats: [
			{
				id: "displayed",
				label: ["Displayed", "展示"],
				caption: [
					"At 10:50 the screen shows only 8 contracts offered at $2.15, the best ask for the Oct 18 105 call.",
					"10:50 屏幕上在 $2.15 只挂出 8 张，这是 10月18日 105 看涨的最优卖价。",
				],
				state: { step: "displayed" },
			},
			{
				id: "block",
				label: ["The block", "大宗"],
				caption: [
					"Then 500 contracts print at $2.15, marked as an auction. The trade was arranged away from the screen and only printed here.",
					"随后 500 张在 $2.15 成交，标记为竞价。这笔交易是在屏幕外安排的，只是在这里打印。",
				],
				state: { step: "block" },
			},
			{
				id: "meaning",
				label: ["What it shows", "它说明什么"],
				caption: [
					"The condition says how it was matched. It doesn't show an institution, inside information or whether a position opened.",
					"成交条件说明如何撮合。它不说明是机构、有内幕信息，或是否开了新仓。",
				],
				state: { step: "meaning" },
			},
		],
		explore: {
			prompt: [
				"Look again at what the block's condition records.",
				"再看看这笔大宗的条件代码记录了什么。",
			],
			start: (last) => last,
			task: {
				kind: "answer",
				prompt: [
					"What does the auction condition on the 500-lot tell you?",
					"这笔 500 张成交上的竞价条件代码告诉了你什么？",
				],
				choices: [
					{ id: "how", label: ["How it was matched", "它是如何撮合的"] },
					{
						id: "who",
						label: ["That an institution sent it", "它来自一家机构"],
					},
					{ id: "open", label: ["That it opened positions", "它开立了新持仓"] },
				],
				answer: "how",
				done: [
					"The condition records the mechanism: arranged away from the screen, then printed through an auction. Who traded, why, and whether positions opened are not in it.",
					"条件代码记录的是机制：在屏幕之外安排好，再通过竞价成交。谁在交易、为什么交易、是否开了新仓，都不在其中。",
				],
			},
		},
		View: BlockView,
	}),
	defineScene<PackageState, PackageState>({
		id: "package",
		label: ["Read the package", "整体解读"],
		title: ["A spread prints as one package", "价差以一个整体成交"],
		predict: {
			prompt: [
				"The block's 105 call leg printed at the ask, which alone looks like aggressive call buying. What was the whole trade?",
				"这笔大单的 105 看涨腿在卖价成交，单看像是激进买入看涨。整笔交易是什么？",
			],
			choices: [
				{
					id: "spread",
					label: [
						"A call spread bought for $1.25 net",
						"以净价 $1.25 买入的看涨价差",
					],
				},
				{
					id: "bullish",
					label: [
						"500 calls bought: very bullish",
						"买入 500 张看涨：非常看涨",
					],
				},
				{ id: "unrelated", label: ["Two unrelated trades", "两笔无关的交易"] },
			],
			answer: "spread",
			revealAt: 2,
			explain: [
				"The multi-leg code and the matching 110 call sale show one package: buy the 105 call, sell the 110 call, $1.25 net. Its value is capped at $5.00 a share.",
				"多腿代码与同时卖出的 110 看涨说明这是一个整体：买入 105 看涨、卖出 110 看涨，净价 $1.25。其价值最多为每股 $5.00。",
			],
		},
		beats: [
			{
				id: "buy",
				label: ["One leg", "一条腿"],
				caption: [
					"The block bought 500 Oct 18 105 calls at $2.15, right at their ask. Read alone, that looks like an eager call buyer.",
					"这笔大单以 $2.15 买入 500 张 10月18日 105 看涨，正好在卖价。单看像一位急切的看涨买家。",
				],
				state: { shown: 1 },
			},
			{
				id: "sell",
				label: ["The other leg", "另一条腿"],
				caption: [
					"At the same instant it sold 500 Oct 18 110 calls at $0.90, inside their $0.85 / $0.93 quote. Both prints carry a multi-leg code.",
					"同一时刻它以 $0.90 卖出 500 张 10月18日 110 看涨，位于 $0.85 / $0.93 报价之内。两笔成交都带多腿代码。",
				],
				state: { shown: 2 },
			},
			{
				id: "package",
				label: ["The package", "整体"],
				caption: [
					"Together it's a 105/110 call spread for $1.25 net, inside the spread's $1.12–$1.30 market. Its value is capped at $5.00 a share.",
					"合起来是一笔 105/110 看涨价差，净价 $1.25，位于价差 $1.12–$1.30 的组合市场内。其价值上限为每股 $5.00。",
				],
				state: { shown: 3 },
			},
		],
		explore: {
			prompt: [
				"Switch between one leg, both legs and the package.",
				"在单腿、两条腿和整体之间切换。",
			],
			start: () => ({ shown: 3 }),
			task: {
				kind: "answer",
				prompt: [
					"What is the most the package can be worth at expiry, per spread?",
					"到期时这个组合每份最多值多少？",
				],
				choices: [
					{ id: "cap", label: ["$500", "$500"] },
					{
						id: "none",
						label: ["No limit: it's 500 calls", "没有上限：它是 500 张看涨"],
					},
					{ id: "cost", label: ["$125", "$125"] },
				],
				answer: "cap",
				done: [
					"Long the 105, short the 110: the gap between strikes, $5.00 a share or $500 a spread, is the cap. It cost $125, so the most it can make is $375.",
					"买入 105、卖出 110：两个行权价之差，每股 $5.00，即每份 $500，就是上限。它花了 $125，所以最多赚 $375。",
				],
			},
		},
		View: PackageView,
	}),
] as const;

export function ExecutionConditionsWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="execution-conditions"
			label={[
				"Interactive lesson on sweeps, blocks and complex orders",
				"扫单、大宗与复杂订单互动课",
			]}
			scenes={scenes}
		/>
	);
}
