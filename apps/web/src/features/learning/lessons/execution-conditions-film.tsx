import {
	type Copy,
	count,
	oct105CallBlock,
	pick,
	sweep,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import type { Film, FilmContext } from "../walkthrough/film";
import {
	Backdrop,
	Brackets,
	createDirector,
	EndCard,
	filmFrame,
	Lines,
	lineCount,
	TitleCard,
	Word,
} from "../walkthrough/film-kit";
import { textWidth } from "../walkthrough/text-measure";
import {
	BLOCK_ASKS,
	LEGS,
	PACKAGE,
	price4,
	SWEEP,
	SWEEP_ASKS,
} from "./execution-conditions-model";

/*
 * Execution conditions, as a film. Three prints of the Oct 18 110 call in the same tenth of
 * a second at three venues: three buyers? The book answers: one 40-lot sent to all three
 * as ISO orders, 10, 20 and 10, at $0.9525 against the pre-order $0.93 best ask. The hero is
 * a block: 8 contracts displayed at $2.15, 500 printed there, marked as an auction; the
 * auction condition fills How; Who, Why and Opened? remain unknown and receive the lock.
 * Last, the block's two legs, a call bought at the ask and one sold inside its quote, that
 * are one $1.25 call spread.
 *
 *   open      0–4        "Execution conditions"
 *   question  4–8.6      three prints, three venues, one instant: three buyers?
 *   sweep     8.6–19.2   initial offers; one ISO order; three prints; $0.9525
 *   block     19.2–31    hero: 8 displayed, 500 printed; How known, three fields unknown
 *   package   31–40.2    connect bought/sold prices, subtract; one $1.25 debit
 *   claim     40.2–44.6  a condition says how a trade executed
 *   next      44.6–47.1  Next: unusual activity
 */

const END = 47.1;
/** The sweep's fills, best price first, each with the venue that filled it. */
const FILLS = sweep(SWEEP_ASKS, SWEEP.quantity).fills.map((fill) => ({
	...fill,
	venue: SWEEP.asks.find((ask) => ask.price === fill.price)?.venue ?? "",
}));
const NOTIONAL = FILLS.reduce((sum, fill) => sum + fill.price * fill.size, 0);
const AVERAGE = NOTIONAL / SWEEP.quantity;
const BEST = SWEEP.asks[0];
const TIME = SWEEP.time;
const BLOCK = oct105CallBlock;
const SHOWN = BLOCK_ASKS.find((level) => level.price === BLOCK.price);
const SHOWN_SIZE = SHOWN?.size ?? 0;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const gap = narrow ? 8 : 16;
	const cardW = (room - 2 * gap) / 3;
	return {
		...frame,
		cardX: (i: number) => margin + i * (cardW + gap),
		cardW,
		/** The order sits above the venues it is routed to. */
		chipY: H * (narrow ? 0.24 : 0.25),
		chipH: narrow ? 26 : 32,
		cardY: H * (narrow ? 0.36 : 0.37),
		cardH: H * (narrow ? 0.17 : 0.19),
		printY: (i: number) =>
			H * (narrow ? 0.64 : 0.64) + i * H * (narrow ? 0.065 : 0.065),
		barY: (i: number) =>
			H * (narrow ? 0.32 : 0.32) + i * H * (narrow ? 0.15 : 0.15),
		barH: H * (narrow ? 0.05 : 0.055),
		knownY: H * 0.59,
		unknownLabelY: H * 0.73,
		unknownValueY: H * 0.87,
		legY: (i: number) =>
			H * (narrow ? 0.27 : 0.27) + i * H * (narrow ? 0.17 : 0.17),
		legH: H * (narrow ? 0.14 : 0.14),
		pkgY: H * (narrow ? 0.63 : 0.64),
		pkgH: H * (narrow ? 0.2 : 0.2),
	};
}

const copy = {
	title: ["Execution conditions", "成交条件"],
	titleSub: ["sweeps, blocks and complex orders", "扫单、大宗与复杂订单"],
	qTag: [`Oct 18 110 call · ${TIME}`, `10月18日 110 看涨 · ${TIME}`],
	qLine: [
		FILLS.map((fill) => `${count(fill.size)} at ${fill.venue}`)
			.join(", ")
			.concat("."),
		FILLS.map((fill) => `${fill.venue} 成交 ${count(fill.size)} 张`)
			.join("，")
			.concat("。"),
	],
	qBig: ["Three buyers?", "三个买方？"],
	sHead: ["Initial quotes for the 110 call.", "下单前的 110 看涨报价。"],
	venue: ["venue", "场所"],
	offered: ["initial", "初始"],
	order: [
		`one order · buy ${SWEEP.quantity} · ≤ ${usd(SWEEP.limit)} · ISO`,
		`一张订单 · 买 ${SWEEP.quantity} · ≤ ${usd(SWEEP.limit)} · ISO`,
	],
	average: [
		`average ${price4(AVERAGE)} · pre-order best ask ${usd(BEST.price)}`,
		`均价 ${price4(AVERAGE)} · 成交前最优卖价 ${usd(BEST.price)}`,
	],
	bHead: ["What does this block reveal?", "这笔大宗能说明什么？"],
	displayed: [`displayed at ${usd(BLOCK.price)}`, `${usd(BLOCK.price)} 挂出`],
	printed: [`printed at ${usd(BLOCK.price)}`, `${usd(BLOCK.price)} 成交`],
	auction: ["auction", "竞价"],
	how: ["How", "撮合方式"],
	unknown: ["Unknown", "未知"],
	who: ["Who", "谁"],
	why: ["Why", "为何"],
	opened: ["Opened?", "是否开仓"],
	pHead: ["Two legs, one net debit.", "两条腿，一个净支出。"],
	multiLeg: ["multi-leg", "多腿"],
	buyLeg: [
		`buy ${count(LEGS.buy.quantity)} · 105 call`,
		`买 ${count(LEGS.buy.quantity)} · 105 看涨`,
	],
	sellLeg: [
		`sell ${count(LEGS.sell.quantity)} · 110 call`,
		`卖 ${count(LEGS.sell.quantity)} · 110 看涨`,
	],
	buyQuote: [
		`${usd(LEGS.buy.bid)} / ${usd(LEGS.buy.ask)} · at ask`,
		`报价 ${usd(LEGS.buy.bid)} / ${usd(LEGS.buy.ask)} · 在卖价`,
	],
	sellQuote: [
		`${usd(LEGS.sell.bid)} / ${usd(LEGS.sell.ask)} · inside`,
		`报价 ${usd(LEGS.sell.bid)} / ${usd(LEGS.sell.ask)} · 价差之内`,
	],
	pkgTag: ["one package · 105/110 call spread", "一个整体 · 105/110 看涨价差"],
	pkgDebit: ["net debit", "净支出"],
	claimBig: [
		"A condition says how a trade executed.",
		"成交条件说明成交是怎么发生的。",
	],
	claimSub: [
		"Sweeps, blocks and packages: how, not who.",
		"扫单、大宗与组合：怎么成交，不是谁。",
	],
	nextBig: ["Next: unusual activity", "下一课：异常成交"],
	nextSub: ["compared with what?", "与什么相比？"],
} as const satisfies Record<string, Copy>;

function Scene({
	width,
	locale,
}: {
	width: number;
	height: number;
	locale: Locale;
}) {
	const t = (value: Copy) => pick(value, locale);
	const L = layout(width);
	const { height: H, type: T, room, narrow, margin } = L;
	const W = width;
	const headline = (name: string, text: Copy) => (
		<Lines
			name={name}
			text={t(text)}
			x={margin}
			y={L.headY}
			size={T.head}
			maxWidth={narrow ? room : room * 0.74}
			anchor="start"
		/>
	);
	const text = narrow ? T.small * 1.1 : T.body;
	const orderW = Math.min(room, textWidth(t(copy.order), text) + 24);
	const tapeX = margin + room * (narrow ? 0.34 : 0.3);
	const barMax = room - (narrow ? 56 : room * 0.1);
	const bars: [string, Copy, number, string][] = [
		["bar-shown", copy.displayed, SHOWN_SIZE, "neutral"],
		["bar-printed", copy.printed, BLOCK.quantity, "total"],
	];
	const legs: [Copy, Copy][] = [
		[copy.buyLeg, copy.buyQuote],
		[copy.sellLeg, copy.sellQuote],
	];
	return (
		<>
			<Backdrop frame={L} />

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				<Word
					name="q-tag"
					x={W / 2}
					y={H * 0.32}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.qTag).toUpperCase()}
				</Word>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.43}
					size={T.head}
					maxWidth={room}
					className="wt-film-type wt-film-accent"
				/>
				<Lines
					name="q-big"
					text={t(copy.qBig)}
					x={W / 2}
					y={H * 0.6}
					size={T.title}
					maxWidth={room}
				/>
			</g>

			{/* A sweep: one order across three venues. */}
			{headline("s-head", copy.sHead)}
			{SWEEP.asks.map((ask, i) => {
				const cx = L.cardX(i) + L.cardW / 2;
				return (
					<g key={ask.venue} data-f={`venue-${i}`}>
						<rect
							data-f={`venue-${i}-box`}
							x={L.cardX(i)}
							y={L.cardY}
							width={L.cardW}
							height={L.cardH}
							rx={12}
							className="wt-panel-shape"
						/>
						<text
							x={cx}
							y={L.cardY + L.cardH * 0.22}
							textAnchor="middle"
							className="wt-film-tag"
							style={{ fontSize: T.small }}
						>
							{`${t(copy.venue).toUpperCase()} ${ask.venue}`}
						</text>
						<text
							x={cx}
							y={L.cardY + L.cardH * 0.6}
							textAnchor="middle"
							className="wt-film-num"
							style={{ fontSize: narrow ? T.head : T.num * 0.8 }}
						>
							{usd(ask.price)}
						</text>
						<text
							data-f={`venue-${i}-size`}
							x={cx}
							y={L.cardY + L.cardH * 0.84}
							textAnchor="middle"
							className="wt-film-type wt-film-dim"
							style={{ fontSize: T.small * 1.1 }}
						>
							{`${count(ask.size)} ${t(copy.offered)}`}
						</text>
					</g>
				);
			})}
			<g data-f="chip">
				<rect
					x={W / 2 - orderW / 2}
					y={L.chipY}
					width={orderW}
					height={L.chipH}
					rx={narrow ? 13 : 16}
					className="wt-focus-shape"
				/>
				<text
					x={W / 2}
					y={L.chipY + L.chipH * 0.66}
					textAnchor="middle"
					className="wt-film-type wt-film-accent"
					style={{ fontSize: text }}
				>
					{t(copy.order)}
				</text>
			</g>
			{FILLS.map((fill, i) => (
				<g key={fill.venue} data-f={`fill-${i}`}>
					<text
						x={margin}
						y={L.printY(i)}
						className="wt-film-num wt-film-dim"
						style={{ fontSize: text }}
					>
						{narrow ? TIME.slice(0, 8) : TIME}
					</text>
					<Word
						name={`fill-${i}-quantity`}
						x={tapeX}
						y={L.printY(i)}
						size={text}
						anchor="start"
						className="wt-film-num"
					>
						{count(fill.size)}
					</Word>
					<text
						x={tapeX + textWidth(`${count(fill.size)} `, text)}
						y={L.printY(i)}
						className="wt-film-num"
						style={{ fontSize: text }}
					>
						{`@ ${usd(fill.price)} · ${fill.venue}`}
					</text>
					<text
						x={margin + room}
						y={L.printY(i)}
						textAnchor="end"
						className="wt-film-tag wt-film-accent"
						style={{ fontSize: T.small }}
					>
						ISO
					</text>
				</g>
			))}
			{/* One order's allocations become the tape quantities, in matching mono type. */}
			{FILLS.map((fill, i) => (
				<Word
					key={fill.venue}
					name={`allocation-${i}`}
					x={
						W / 2 +
						(i - 1) * (narrow ? 42 : 56) -
						textWidth(count(fill.size), text) / 2
					}
					y={L.chipY + L.chipH + 18}
					size={text}
					anchor="start"
					className="wt-film-num"
				>
					{count(fill.size)}
				</Word>
			))}
			<g data-f="avg">
				<Word
					name="avg-price"
					x={margin}
					y={H * 0.85}
					size={narrow ? T.head : T.head * 1.1}
					anchor="start"
					className="wt-film-num wt-film-warn"
				>
					{t(copy.average).split(" · ")[0]}
				</Word>
				<Word
					name="avg-benchmark"
					x={margin}
					y={H * 0.92}
					size={T.body}
					anchor="start"
					className="wt-film-type wt-film-dim"
				>
					{t(copy.average).split(" · ")[1]}
				</Word>
			</g>

			{/* A block: arranged off-screen. */}
			{headline("b-head", copy.bHead)}
			<Brackets name="lock-know" glow />
			{bars.map(([name, label, size, tone], i) => (
				<g key={name} data-f={name}>
					<text
						x={margin}
						y={L.barY(i) - T.small * 0.8}
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(label).toUpperCase()}
					</text>
					<rect
						data-f={`${name}-rect`}
						x={margin}
						y={L.barY(i)}
						width={(size / BLOCK.quantity) * barMax}
						height={L.barH}
						rx={4}
						className="wt-film-bar"
						data-tone={tone}
					/>
					<text
						data-f={`${name}-n`}
						x={margin + (size / BLOCK.quantity) * barMax + 10}
						y={L.barY(i) + L.barH / 2 + T.num * 0.75 * 0.32}
						className="wt-film-num"
						style={{ fontSize: T.num * 0.75 }}
					>
						{count(size)}
					</text>
				</g>
			))}
			<g data-f="auction">
				<rect
					x={margin + room - (narrow ? 80 : 110)}
					y={L.barY(1) - T.small * 2.4}
					width={narrow ? 80 : 110}
					height={T.small * 2}
					rx={T.small}
					className="wt-focus-shape"
				/>
				<text
					data-f="auction-value"
					x={margin + room - (narrow ? 40 : 55)}
					y={L.barY(1) - T.small * 1.05}
					textAnchor="middle"
					className="wt-film-tag wt-film-accent"
					style={{ fontSize: T.small }}
				>
					{t(copy.auction).toUpperCase()}
				</text>
			</g>
			<Word
				name="known-label"
				x={margin}
				y={L.knownY}
				size={T.body}
				anchor="start"
				className="wt-film-type wt-film-dim"
			>
				{`${t(copy.how)}:`}
			</Word>
			<Word
				name="known-value"
				x={margin + textWidth(`${t(copy.how)}:`, T.body) + 12}
				y={L.knownY}
				size={T.small}
				anchor="start"
				className="wt-film-tag wt-film-accent"
			>
				{t(copy.auction).toUpperCase()}
			</Word>
			<Word
				name="unknown-label"
				x={margin}
				y={H * 0.66 - 12}
				size={T.small}
				anchor="start"
				className="wt-film-tag wt-film-warn"
			>
				{t(copy.unknown).toUpperCase()}
			</Word>
			<g data-f="unknown-fields">
				{[copy.who, copy.why, copy.opened].map((label, i) => (
					<g key={i} data-f={`unknown-${i}`}>
						<Word
							name={`unknown-${i}-label`}
							x={margin + room * ((i + 0.5) / 3)}
							y={L.unknownLabelY}
							size={T.body}
							className="wt-film-type wt-film-dim"
						>
							{t(label)}
						</Word>
						<Word
							name={`unknown-${i}-value`}
							x={margin + room * ((i + 0.5) / 3)}
							y={L.unknownValueY}
							size={T.num * 1.5}
							className="wt-film-num wt-film-warn"
						>
							?
						</Word>
					</g>
				))}
			</g>

			{/* Two legs, one package. */}
			{headline("p-head", copy.pHead)}
			{legs.map(([line, quote], i) => (
				<g key={t(line)} data-f={`leg-${i}`}>
					<rect
						data-f={`leg-${i}-box`}
						x={margin}
						y={L.legY(i)}
						width={room}
						height={L.legH}
						rx={12}
						className="wt-panel-shape"
					/>
					<text
						x={margin + 16}
						y={L.legY(i) + L.legH * 0.4}
						className="wt-film-num"
						style={{ fontSize: narrow ? T.small * 1.15 : T.body * 1.1 }}
					>
						{t(line)}
					</text>
					<text
						x={margin + 16}
						y={L.legY(i) + L.legH * 0.74}
						className="wt-film-type wt-film-dim"
						style={{ fontSize: T.small * 1.1 }}
					>
						{t(quote)}
					</text>
					<text
						data-f={`leg-${i}-price`}
						x={margin + room - 16}
						y={L.legY(i) + L.legH * 0.4}
						textAnchor="end"
						className="wt-film-num"
						style={{ fontSize: narrow ? T.small * 1.15 : T.body * 1.1 }}
					>
						{usd(i === 0 ? LEGS.buy.price : LEGS.sell.price)}
					</text>
					<Word
						name={`leg-${i}-condition`}
						x={margin + room - 16}
						y={L.legY(i) + L.legH * 0.74}
						size={T.small}
						anchor="end"
						className="wt-film-tag wt-film-accent"
					>
						{t(copy.multiLeg).toUpperCase()}
					</Word>
				</g>
			))}
			{legs.map((_, i) => (
				<path
					key={i}
					data-f={`price-link-${i}`}
					d={`M${margin + room - 12} ${L.legY(i) + L.legH * 0.4}H${margin + room - 6 + i * 4}V${L.pkgY - 18 + i * 8}H${margin + 16 + (i === 0 ? 0 : narrow ? 78 : room * 0.23) + (narrow ? T.head : T.num * 0.65) * 1.5}V${L.pkgY - 6}`}
					className="wt-film-link"
				/>
			))}
			<g data-f="pkg">
				<rect
					x={margin}
					y={L.pkgY}
					width={room}
					height={L.pkgH}
					rx={14}
					className="wt-focus-shape"
				/>
				<Word
					name="pkg-tag"
					x={margin + 16}
					y={L.pkgY + L.pkgH * 0.23}
					size={T.small}
					anchor="start"
					className="wt-film-tag"
				>
					{t(copy.pkgTag).toUpperCase()}
				</Word>
				<Word
					name="pkg-debit"
					x={margin + 16}
					y={L.pkgY + L.pkgH * 0.85}
					size={T.body}
					anchor="start"
					className="wt-film-type wt-film-dim"
				>
					{t(copy.pkgDebit)}
				</Word>
			</g>
			<Word
				name="pkg-buy"
				x={margin + 16}
				y={L.pkgY + L.pkgH * 0.58}
				size={narrow ? T.head : T.num * 0.65}
				anchor="start"
				className="wt-film-num"
			>
				{usd(LEGS.buy.price)}
			</Word>
			<Word
				name="pkg-minus"
				x={margin + 16 + (narrow ? 61 : room * 0.18)}
				y={L.pkgY + L.pkgH * 0.58}
				size={narrow ? T.head : T.num * 0.65}
				anchor="start"
				className="wt-film-num"
			>
				−
			</Word>
			<Word
				name="pkg-sell"
				x={margin + 16 + (narrow ? 78 : room * 0.23)}
				y={L.pkgY + L.pkgH * 0.58}
				size={narrow ? T.head : T.num * 0.65}
				anchor="start"
				className="wt-film-num"
			>
				{usd(LEGS.sell.price)}
			</Word>
			<Word
				name="pkg-result"
				x={margin + 16 + (narrow ? 146 : room * 0.46)}
				y={L.pkgY + L.pkgH * 0.58}
				size={narrow ? T.head : T.num * 0.65}
				anchor="start"
				className="wt-film-num wt-film-accent"
			>{`= ${usd(PACKAGE.price)}`}</Word>

			<g data-f="claim">
				<Lines
					name="z-big"
					text={t(copy.claimBig)}
					x={W / 2}
					y={H * 0.42}
					size={T.title}
					maxWidth={room}
				/>
				<Lines
					name="z-sub"
					text={t(copy.claimSub)}
					x={W / 2}
					y={
						H * 0.42 +
						T.title * 1.15 +
						(lineCount(t(copy.claimBig), room, T.title) - 1) * T.title * 1.35
					}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			<EndCard
				frame={L}
				locale={locale}
				next={t(copy.nextBig)}
				why={t(copy.nextSub)}
			/>
		</>
	);
}

function build(context: FilmContext) {
	const { width: W } = context;
	const L = layout(W);
	const d = createDirector(context, L, END);
	const { tl, one, kids, show, hide } = d;
	const flat = (name: string) =>
		kids(name).flatMap((el) =>
			el.tagName === "g" && !el.hasAttribute("data-f")
				? [...el.children]
				: [el],
		);
	/** A line lands slightly large and settles, without overshoot. */
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const heads = ["s-head", "b-head", "p-head"].map((name) => one(name));
	const venues = SWEEP.asks.map((_, i) => one(`venue-${i}`));
	const allocations = FILLS.map((_, i) =>
		one<SVGTextElement>(`allocation-${i}`),
	);
	const fills = FILLS.map((_, i) => one(`fill-${i}`));
	const legs = [one("leg-0"), one("leg-1")];
	const lockKnow = one<SVGGraphicsElement>("lock-know");
	const unknowns = [0, 1, 2].map((i) => one(`unknown-${i}`));
	const packageValues = ["pkg-buy", "pkg-minus", "pkg-sell", "pkg-result"].map(
		(name) => one(name),
	);

	d.hidden([
		...flat("q"),
		...heads,
		...venues,
		...allocations,
		one("chip"),
		...fills,
		one("avg"),
		one("bar-shown"),
		one("bar-printed"),
		one("auction"),
		one("known-label"),
		one("known-value"),
		one("unknown-label"),
		...unknowns,
		lockKnow,
		...legs,
		one("price-link-0"),
		one("price-link-1"),
		...packageValues,
		one("pkg"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: three prints at once ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	show(one("q-line"), 4.8);
	word(one("q-big"), 5.1);

	// ——— sweep: one order, three prints ———
	tl.addLabel("sweep", 8.6);
	hide(flat("q"), 8.6);
	show(heads[0], 8.8);
	venues.forEach((venue, i) => {
		show(venue, 9.3 + i * 0.2);
	});
	show(one("chip"), 11.0);
	// The allocation and its order arrive together; only the allocation then travels.
	tl.fromTo(allocations, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 11.0);
	// Step the initial-quote context back before the allocations pass through its area.
	tl.to(venues, { opacity: 0.2, duration: 0.5 }, 11.5);
	allocations.forEach((allocation, i) => {
		const quantity = one<SVGTextElement>(`fill-${i}-quantity`);
		const dx =
			Number(quantity.getAttribute("x")) - Number(allocation.getAttribute("x"));
		const dy =
			Number(quantity.getAttribute("y")) - Number(allocation.getAttribute("y"));
		const start = 12.0 + i * 0.1;
		const land = start + 1.0;
		// Separate vertical lanes avoid other allocations; enter each row horizontally only
		// after reaching its own baseline, clear of the earlier rows and their timestamps.
		tl.fromTo(
			allocation,
			{ x: 0, y: 0 },
			{
				x: 0,
				y: dy,
				duration: 0.6,
				ease: "power2.inOut",
				immediateRender: false,
			},
			start,
		);
		tl.fromTo(
			allocation,
			{ x: 0 },
			{
				x: dx,
				duration: 0.4,
				ease: "power2.inOut",
				immediateRender: false,
			},
			start + 0.6,
		);
		// Hold the landed copy at full opacity while the resting row fades in underneath.
		// Only then fade the identical overlaid copy; the visible quantity stays settled.
		// Opacity and position are timeline tweens, so backward seeking restores them too.
		tl.fromTo(
			fills[i],
			{ opacity: 0 },
			{ opacity: 1, duration: 0.3, ease: "none" },
			land,
		);
		tl.to(allocation, { opacity: 0, duration: 0.3, ease: "none" }, land + 0.3);
	});
	// Keep the cards explicitly historical: fills are not paired with independent counters.
	// Last row settles at 13.5; the average follows one quiet second later.
	// Restore its historical quote context alongside the pre-order benchmark.
	tl.to(venues, { opacity: 1, duration: 0.5 }, 14.5);
	show(one("avg"), 14.5);

	// ——— block: the hero. Arranged off-screen; the condition says how. ———
	tl.addLabel("block", 19.2);
	hide([heads[0], ...venues, one("chip"), ...fills, one("avg")], 19.2);
	show(heads[1], 19.55);
	show(one("bar-shown"), 20.0, "right");
	// Geometry and quantity arrive settled together, with a full second after each proof.
	show(one("bar-printed"), 21.5);
	show(one("auction"), 23.0);
	show(one("known-label"), 23.0);
	// Reduce the comparison before the condition travels into its known field.
	tl.to(
		[one("bar-shown"), one("bar-printed")],
		{ opacity: 0.2, duration: 0.5 },
		23.0,
	);
	d.carry(
		one<SVGGraphicsElement>("auction-value"),
		one<SVGGraphicsElement>("known-value"),
		23.6,
		{ duration: 0.6, arc: "y" },
	);
	hide(one("auction"), 23.6);
	// The condition fills How but supplies no values for these three questions.
	show(one("unknown-label"), 25.2);
	unknowns.forEach((field, i) => {
		show(field, 25.2 + i * 0.3);
	});
	// The last unknown settles at 26.3; the completed proof rests before the lock.
	d.lock(lockKnow, 27.4, { around: one("unknown-fields"), pad: 8 });
	tl.addLabel("hero-lock", 27.4);

	// ——— package: connect both execution prices before revealing their debit ———
	tl.addLabel("package", 31.0);
	hide(
		[
			heads[1],
			one("bar-shown"),
			one("bar-printed"),
			one("known-label"),
			one("known-value"),
			one("unknown-label"),
			one("unknown-fields"),
			lockKnow,
		],
		31.0,
	);
	show(heads[2], 31.35);
	// The first leg stays above the fading hero and settles at 31.8, a full second
	// before the second leg starts; both matching condition labels enter with their cards.
	show(legs[0], 31.3, "right");
	show(legs[1], 32.8, "right");
	// The second leg settles at 33.3; no new arrival until 34.3.
	show(one("pkg"), 34.3);
	tl.to(
		[one("leg-0-box"), one("leg-1-box")],
		{ opacity: 0.2, duration: 0.5 },
		34.3,
	);
	// Routes run in the clear right-hand lane and stop above the package, away from its type.
	d.trace(one<SVGPathElement>("price-link-0"), 34.8, { duration: 0.6 });
	d.trace(one<SVGPathElement>("price-link-1"), 34.8, { duration: 0.6 });
	show(packageValues.slice(0, 3), 35.4);
	// Never count after an equals sign; the equation becomes true as a settled result.
	show(one("pkg-result"), 36.9);

	// ——— claim ———
	tl.addLabel("claim", 40.2);
	hide(
		[
			heads[2],
			...legs,
			one("pkg"),
			...packageValues,
			one("price-link-0"),
			one("price-link-1"),
		],
		40.2,
	);
	word(one("z-big"), 40.5);
	show(one("z-sub"), 40.9);

	// ——— next ———
	tl.addLabel("next", 44.6);
	hide(kids("claim"), 44.6);
	d.close(44.6);
	return tl;
}

export const executionConditionsFilm: Film = {
	id: "execution-conditions",
	label: [
		`Execution conditions, as a short film: one ${SWEEP.quantity}-contract order for the Oct 18 110 call sent to three venues as ISO orders and printed three times, ${FILLS.map((fill) => `${count(fill.size)} at ${usd(fill.price)}`).join(", ")}, for ${price4(AVERAGE)} on average against the pre-order best ask of ${usd(BEST.price)}; a block of ${count(BLOCK.quantity)} 105 calls printed at ${usd(BLOCK.price)} as an auction while only ${SHOWN_SIZE} were displayed; the auction condition supplies how it matched, but who, why and whether it opened remain unknown; and the block's two legs, both marked multi-leg: a 105 call bought at the ask and a 110 call sold inside its quote, read together: ${usd(LEGS.buy.price)} minus ${usd(LEGS.sell.price)} is a ${usd(PACKAGE.price)} net debit for one 105/110 call spread`,
		`成交条件短片：一张 ${SWEEP.quantity} 张的 10月18日 110 看涨订单以 ISO 方式同时发往三个场所，成交三次：${FILLS.map((fill) => `${usd(fill.price)} 成交 ${count(fill.size)} 张`).join("，")}，平均 ${price4(AVERAGE)}，而成交前最优卖价是 ${usd(BEST.price)}；一笔 ${count(BLOCK.quantity)} 张的 105 看涨大宗以竞价方式在 ${usd(BLOCK.price)} 成交，而屏幕上只挂出 ${SHOWN_SIZE} 张；竞价条件给出撮合方式，但谁、为何、是否开仓仍未知；以及这笔大单的两条腿，均标为多腿：在卖价买入的 105 看涨与在报价之内卖出的 110 看涨，买价 ${usd(LEGS.buy.price)} 减去卖价 ${usd(LEGS.sell.price)}，合起来是一个净支出 ${usd(PACKAGE.price)} 的 105/110 看涨价差`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Execution conditions", "成交条件"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "sweep", label: ["A sweep", "扫单"] },
		{ id: "block", label: ["A block", "大宗"] },
		{ id: "package", label: ["A package", "一个整体"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
