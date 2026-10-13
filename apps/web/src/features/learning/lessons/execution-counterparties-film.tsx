import { type Copy, count, pick, usd } from "@/content/world";
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
import {
	ASKS,
	BIDS,
	BOOK,
	LIMIT_ORDER,
	limitOutcome,
	T1,
} from "./execution-counterparties-model";

/*
 * Counterparties, as a film. Ben offers 10 Oct 18 100 calls at $4.10 and you buy all 10:
 * does the day's volume rise by 10 or by 20? The book answers: Ben's offer rests, your
 * market buy arrives and takes it, and the one trade prints once, volume +10. The hero is a
 * limit: buy 30 at most $4.15. It takes 10 at $4.10, then 12 at $4.15, and the last 8 drop
 * into the bids as your bid, earning the large resting eight and its glowing brackets.
 * Last, two mutually exclusive buys could have produced the same public print.
 *
 *   open      0–4        "Counterparties"
 *   question  4–8.8      Ben offers 10 at $4.10, you buy them: volume +10 or +20?
 *   match     8.8–19.6   resting; incoming; one trade, one print, volume +10
 *   limit     19.6–32.6  alternative: buy 30, limit $4.15; 10 and 12 fill; 8 rest
 *   print     32.6–39.8  possible market buy OR limit buy; one line on the tape
 *   claim     39.8–44.2  one trade, two sides, one print
 *   next      44.2–46.7  Next: execution side
 */

const END = 46.7;
/** Asks from the top of the book down to the best, as a ladder reads. */
const LADDER = [...ASKS].reverse();
const BEST = ASKS[0];
const MAX = 25;
const LIMIT = LIMIT_ORDER.limit;
const SIZE = LIMIT_ORDER.size;
const DONE = limitOutcome({ ...LIMIT_ORDER, step: 3 });
const TAKEN = DONE.fills;
const FIRST = TAKEN[0].size;
const RESTS = DONE.rests;
/** Tape rows read in whole cents. */
const at = (size: number, cents: number) => `${count(size)} @ ${usd(cents)}`;
/** The limit order as it waits in the spread, with what is still to fill. */
const limitChip = (buy: string, left: number) =>
	`${buy} ${count(left)} · ≤ ${usd(LIMIT)}`;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const rowStep = H * (narrow ? 0.05 : 0.065);
	const rowH = rowStep * 0.78;
	const bookTop = H * (narrow ? 0.25 : 0.27);
	const gapTop = bookTop + LADDER.length * rowStep;
	const gap = rowStep * 1.3;
	const bookW = narrow ? room : room * 0.56;
	const priceW = narrow ? 50 : width * 0.075;
	const sideX = narrow ? margin : margin + room * 0.63;
	const sideW = narrow ? room : room * 0.37;
	const sideY = narrow ? gapTop + gap + 4 * rowStep + H * 0.06 : bookTop;
	const cardW = narrow ? (room - 12) / 2 : room * 0.4;
	return {
		...frame,
		rowStep,
		rowH,
		askY: (i: number) => bookTop + i * rowStep,
		/** The spread: where an incoming order waits its turn. */
		chipY: gapTop + (gap - rowH) / 2,
		bidY: (i: number) => gapTop + gap + i * rowStep,
		bookW,
		priceW,
		barX: margin + priceW + 10,
		barMax: bookW - priceW - 10 - (narrow ? 34 : 48),
		/** The incoming orders' widths: a market buy's short label, a limit's longer one. */
		chipW: (long: boolean) =>
			narrow ? (long ? 128 : 86) : Math.min(bookW * (long ? 0.42 : 0.32), 190),
		/** An incoming order stops short of the sizes, so they stay readable as they run down. */
		chipRight: margin + bookW - (narrow ? 30 : 44),
		sideX,
		sideW,
		sideY,
		/** The second column of the side panel on a phone, or its lower half otherwise. */
		statX: narrow ? margin + room * 0.62 : sideX,
		statY: narrow ? sideY : sideY + H * 0.2,
		roleY: (i: number) =>
			narrow ? sideY + H * (0.13 + i * 0.05) : sideY + H * (0.37 + i * 0.08),
		cardW,
		cardX: [margin, narrow ? margin + cardW + 12 : margin + room - cardW],
		cardY: H * (narrow ? 0.27 : 0.27),
		cardH: H * (narrow ? 0.15 : 0.17),
		printW: narrow ? room : room * 0.5,
		printY: H * (narrow ? 0.6 : 0.62),
		printH: H * (narrow ? 0.14 : 0.16),
	};
}

const copy = {
	title: ["Counterparties", "交易对手"],
	titleSub: ["who buys and who sells in one trade", "同一笔成交中谁买谁卖"],
	qTag: [`Oct 18 100 call · ${BOOK.time}`, `10月18日 100 看涨 · ${BOOK.time}`],
	qLine: [
		`Ben offers ${count(BEST.size)} at ${usd(BEST.price)}. You buy all ${count(BEST.size)}.`,
		`Ben 以 ${usd(BEST.price)} 挂出 ${count(BEST.size)} 张，你全部买下。`,
	],
	qBig: [
		`Volume +${BEST.size} or +${BEST.size * 2}?`,
		`成交量 +${BEST.size} 还是 +${BEST.size * 2}？`,
	],
	inHead: ["Your market buy needs a seller.", "你的市价买单需要卖方。"],
	oneHead: [
		`One trade: volume +${BEST.size}.`,
		`一笔成交：成交量 +${BEST.size}。`,
	],
	limHead: [
		`Instead: buy ${SIZE}, capped at ${usd(LIMIT)}.`,
		`另一种情况：买 ${SIZE} 张，限价 ${usd(LIMIT)}。`,
	],
	restsHead: [
		`The last ${RESTS} wait as your bid.`,
		`最后 ${RESTS} 张作为你的买单等待。`,
	],
	tapeHead: [
		"Two possible buys, the same print.",
		"两种可能的买单，同一条记录。",
	],
	ask: ["ask", "卖单"],
	bid: ["bid", "买单"],
	ben: ["Ben", "Ben"],
	yours: ["yours", "你的"],
	chipMarket: [`you: buy ${BEST.size}`, `你：买 ${BEST.size}`],
	buy: ["buy", "买"],
	tape: ["time and sales", "逐笔成交"],
	empty: ["no trades yet", "尚无成交"],
	matching: ["matching…", "撮合中…"],
	volume: ["volume", "成交量"],
	filled: ["filled", "已成交"],
	resting: ["resting", "挂单等待"],
	buyer: ["buyer: you, incoming", "买方：你，主动到来"],
	seller: ["seller: Ben, resting", "卖方：Ben，挂单"],
	recordA: ["possible A", "可能 A"],
	recordB: ["or: B", "或 B"],
	market: [`buy ${T1.quantity} · market`, `买 ${T1.quantity} · 市价`],
	limit: [
		`buy ${T1.quantity} · limit ${usd(T1.price)}`,
		`买 ${T1.quantity} · 限价 ${usd(T1.price)}`,
	],
	publicTape: ["public tape", "公开成交记录"],
	printSub: ["price, size, time", "价格、数量、时间"],
	claimBig: ["One trade, two sides, one print.", "一笔成交，两方，一条记录。"],
	claimSub: ["The tape never shows the orders.", "成交记录从不显示订单。"],
	nextBig: ["Next: execution side", "下一课：成交位置"],
	nextSub: ["where a trade printed against the quote", "成交价相对报价的位置"],
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
	const rowText = (y: number) => y + L.rowH / 2 + text * 0.36;
	const level = (
		name: string,
		side: "ask" | "bid",
		y: number,
		lv: { price: number; size: number },
	) => (
		<g key={name} data-f={`lv-${name}`}>
			<text
				x={margin + L.priceW}
				y={rowText(y)}
				textAnchor="end"
				className="wt-film-num"
				style={{ fontSize: text }}
			>
				{usd(lv.price)}
			</text>
			<rect
				data-f={`bar-${name}`}
				x={L.barX}
				y={y + L.rowH * 0.2}
				width={(lv.size / MAX) * L.barMax}
				height={L.rowH * 0.6}
				rx={3}
				className="wt-film-bar"
				data-tone={side === "ask" ? "loss" : "gain"}
			/>
			<text
				data-f={`size-${name}`}
				x={margin + L.bookW - 6}
				y={rowText(y)}
				textAnchor="end"
				className="wt-film-num wt-film-dim"
				style={{ fontSize: text }}
			>
				{count(lv.size)}
			</text>
		</g>
	);
	/** A label beside a bar's end: whose order it is. */
	const owner = (name: string, y: number, size: number, label: Copy) => (
		<text
			data-f={name}
			x={L.barX + (size / MAX) * L.barMax + 8}
			y={rowText(y)}
			className="wt-film-type wt-film-accent"
			style={{ fontSize: text }}
		>
			{t(label)}
		</text>
	);
	const chip = (name: string, label: string, long: boolean) => (
		<g data-f={name}>
			<rect
				x={L.chipRight - L.chipW(long)}
				y={L.chipY}
				width={L.chipW(long)}
				height={L.rowH}
				rx={L.rowH / 2}
				className="wt-focus-shape"
			/>
			<text
				data-f={`${name}-text`}
				x={L.chipRight - L.chipW(long) / 2}
				y={rowText(L.chipY)}
				textAnchor="middle"
				className="wt-film-type wt-film-accent"
				style={{ fontSize: text }}
			>
				{label}
			</text>
		</g>
	);
	const limitY = L.askY(1) - (L.rowStep - L.rowH) / 2;
	const stat = (name: string, tag: Copy, value: string, y: number) => (
		<g data-f={name}>
			<text
				x={L.statX + (narrow && name === "rest" ? T.num * 1.4 + 24 : 0)}
				y={y + T.small}
				className="wt-film-tag"
				style={{ fontSize: T.small }}
			>
				{t(tag).toUpperCase()}
			</text>
			<text
				data-f={`${name}-n`}
				x={L.statX}
				y={y + T.small + T.num * (name === "rest" ? 1.4 : 1) * 1.15}
				className="wt-film-num wt-film-accent"
				style={{ fontSize: T.num * (name === "rest" ? 1.4 : 1) }}
			>
				{value}
			</text>
		</g>
	);
	const cardText = (x: number, label: Copy, line: Copy) => (
		<>
			<text
				x={x + 14}
				y={L.cardY + L.cardH * 0.36}
				className="wt-film-tag"
				style={{ fontSize: T.small }}
			>
				{t(label).toUpperCase()}
			</text>
			<text
				x={x + 14}
				y={L.cardY + L.cardH * 0.72}
				className="wt-film-type"
				style={{ fontSize: text }}
			>
				{t(line)}
			</text>
		</>
	);
	const printX = margin + (room - L.printW) / 2;
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
					y={H * 0.62}
					size={T.title}
					maxWidth={room}
				/>
			</g>

			{/* The book. */}
			{headline("i-head", copy.inHead)}
			{/* The answer, a line under the buy, as the volume counts once. */}
			<Lines
				name="o-head"
				text={t(copy.oneHead)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.inHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			{headline("l-head", copy.limHead)}
			{/* The hero's answer, as the rest drops into the bids. */}
			<Lines
				name="l2-head"
				text={t(copy.restsHead)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.limHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			<g data-f="frame">
				<text
					x={margin}
					y={L.askY(0) - T.small * 0.9}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.ask).toUpperCase()}
				</text>
				{/* The spread, open where an incoming order waits. */}
				<path
					d={`M${margin} ${L.chipY + L.rowH / 2}H${L.chipRight - L.chipW(true) - 8}M${L.chipRight + 8} ${L.chipY + L.rowH / 2}H${margin + L.bookW}`}
					className="wt-film-link"
				/>
				<text
					x={margin}
					y={L.bidY(BIDS.length) + L.rowH + T.small * 1.4}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.bid).toUpperCase()}
				</text>
			</g>
			<g data-f="asks">
				{LADDER.map((lv, i) => level(`a${lv.price}`, "ask", L.askY(i), lv))}
			</g>
			<g data-f="bids">
				{BIDS.map((lv, i) => level(`b${lv.price}`, "bid", L.bidY(i), lv))}
			</g>
			{level("mine", "bid", L.bidY(0), { price: LIMIT, size: RESTS })}
			{owner("ben", L.askY(LADDER.length - 1), BEST.size, copy.ben)}
			<Brackets name="lock-mine" glow />
			{owner("yours", L.bidY(0), RESTS, copy.yours)}
			{chip("chip-m", t(copy.chipMarket), false)}
			{chip("chip-l", limitChip(t(copy.buy), SIZE), true)}
			{/* The limit, between what it can reach and what it can't. */}
			<path
				data-f="limit"
				d={`M${margin} ${limitY}H${margin + L.bookW}`}
				className="wt-film-riser"
				strokeDasharray="5 4"
			/>

			{/* Beside the book: the tape and the counts. */}
			<g data-f="tape">
				<text
					x={L.sideX}
					y={L.sideY + T.small}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.tape).toUpperCase()}
				</text>
				<text
					data-f="tape-empty"
					x={L.sideX}
					y={L.sideY + T.small + text * 1.9}
					className="wt-film-type wt-film-dim"
					style={{ fontSize: text }}
				>
					{t(copy.empty)}
				</text>
			</g>
			<text
				data-f="tape-matching"
				x={L.sideX}
				y={L.sideY + T.small + text * 1.9}
				className="wt-film-type wt-film-dim"
				style={{ fontSize: text }}
			>
				{t(copy.matching)}
			</text>
			<text
				data-f="tape-print"
				x={L.sideX}
				y={L.sideY + T.small + text * 1.9}
				className="wt-film-num wt-film-accent"
				style={{ fontSize: text }}
			>
				{`${T1.time} · ${at(T1.quantity, T1.price)}`}
			</text>
			{stat("vol", copy.volume, "0", L.statY)}
			{stat("fill", copy.filled, `0 / ${SIZE}`, L.sideY)}
			{stat(
				"rest",
				copy.resting,
				count(RESTS),
				L.sideY + H * (narrow ? 0.13 : 0.2),
			)}
			{(
				[
					["role-b", copy.buyer],
					["role-s", copy.seller],
				] as const
			).map(([name, label], i) => (
				<text
					key={name}
					data-f={name}
					x={L.sideX}
					y={L.roleY(i)}
					className="wt-film-type"
					style={{ fontSize: text }}
				>
					{t(label)}
				</text>
			))}

			{/* Mutually exclusive possibilities, not the two sides of a trade. */}
			{headline("t-head", copy.tapeHead)}
			{(
				[
					[copy.recordA, copy.market],
					[copy.recordB, copy.limit],
				] as const
			).map(([label, line], i) => (
				<g key={t(label)} data-f={`card-${i}`}>
					<rect
						x={L.cardX[i]}
						y={L.cardY}
						width={L.cardW}
						height={L.cardH}
						rx={12}
						className="wt-focus-shape"
					/>
					{cardText(L.cardX[i], label, line)}
				</g>
			))}
			<g data-f="print">
				<text
					x={W / 2}
					y={L.printY - 14}
					textAnchor="middle"
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.publicTape).toUpperCase()}
				</text>
				<rect
					x={printX}
					y={L.printY}
					width={L.printW}
					height={L.printH}
					rx={12}
					className="wt-panel-shape"
				/>
				<text
					x={W / 2}
					y={L.printY + L.printH * 0.48}
					textAnchor="middle"
					className="wt-film-num"
					style={{ fontSize: narrow ? T.head : T.head * 1.15 }}
				>
					{`${T1.time} · ${at(T1.quantity, T1.price)}`}
				</text>
				<text
					x={W / 2}
					y={L.printY + L.printH * 0.8}
					textAnchor="middle"
					className="wt-film-type wt-film-dim"
					style={{ fontSize: T.small * 1.1 }}
				>
					{t(copy.printSub)}
				</text>
			</g>

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
	const g = (name: string) => one<SVGGraphicsElement>(name);
	/** A figure lands slightly large and settles, without overshoot: it is data. */
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const width = (n: number) => (n / MAX) * L.barMax;
	/** One state drives the quote, its bar, and every quantity linked to its depletion. */
	const sizeTo = (
		name: string,
		to: number,
		from: number,
		time: number,
		linked?: (remaining: number) => void,
	) => {
		const state = { remaining: from };
		const bar = one(`bar-${name}`);
		const size = one<SVGTextElement>(`size-${name}`);
		tl.fromTo(
			state,
			{ remaining: from },
			{
				remaining: to,
				duration: 0.5,
				ease: "power2.out",
				immediateRender: false,
				onUpdate: () => {
					const remaining = Math.round(state.remaining);
					bar.setAttribute("width", String(width(remaining)));
					size.textContent = remaining === 0 ? "—" : count(remaining);
					linked?.(remaining);
				},
			},
			time,
		);
	};
	/** The incoming order rides up to the level it takes. */
	const ride = (name: string, row: number, time: number) =>
		tl.to(
			one(name),
			{ y: L.askY(row) - L.chipY, duration: 0.5, ease: "power2.inOut" },
			time,
		);
	const heads = ["i-head", "o-head", "l-head", "l2-head", "t-head"].map(
		(name) => one(name),
	);
	const bestRow = LADDER.length - 1;
	const best = `a${BEST.price}`;
	const second = `a${TAKEN[1].price}`;
	const asks = kids("asks");
	const bids = kids("bids");
	const book = [...kids("frame"), ...asks, ...bids];

	d.hidden([
		...flat("q"),
		...heads,
		...book,
		one("lv-mine"),
		one("ben"),
		one("yours"),
		one("chip-m"),
		one("chip-l"),
		one("limit"),
		...kids("tape"),
		one("tape-matching"),
		one("tape-print"),
		one("vol"),
		one("fill"),
		one("rest"),
		one("role-b"),
		one("role-s"),
		g("lock-mine"),
		one("card-0"),
		one("card-1"),
		one("print"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: one offer, one buyer ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	show(one("q-line"), 5.0);
	word(one("q-big"), 5.3);

	// ——— match: Ben's offer rests; your market buy takes it; one trade ———
	tl.addLabel("match", 8.8);
	hide(flat("q"), 8.8);
	show(heads[0], 9.0);
	show(kids("frame"), 9.2);
	[...asks, ...bids].forEach((lv, i) => {
		show(lv, 9.3 + i * 0.08, "right");
	});
	show(one("ben"), 10.0, "right");
	show(kids("tape"), 10.2);
	show(one("vol"), 10.4);
	d.pop(one("chip-m"), 13.2);
	ride("chip-m", bestRow, 13.6);
	// A matching state replaces the empty tape before any contracts execute.
	hide(one("tape-empty"), 13.85, 0.3, 0);
	tl.fromTo(
		one("tape-matching"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		14.15,
	);
	// Depletion and volume are complementary at every frame, not separate counts.
	hide([one("chip-m"), one("ben")], 14.15, 0.3);
	sizeTo(best, 0, BEST.size, 14.2, (remaining) => {
		one<SVGTextElement>("vol-n").textContent = count(BEST.size - remaining);
	});
	// Only the settled execution earns a fixed public print and the answer.
	hide(one("tape-matching"), 14.7, 0.3, 0);
	tl.fromTo(
		one("tape-print"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		15.0,
	);
	show(heads[1], 14.7);
	show(one("role-b"), 16.5);
	show(one("role-s"), 16.9);

	// ——— limit: the hero. Buy 30, at most $4.15: best price first, and the rest waits. ———
	tl.addLabel("limit", 19.6);
	d.swap([heads[0], heads[1]], heads[2], 19.6);
	hide(
		[
			...kids("tape"),
			one("tape-matching"),
			one("tape-print"),
			one("vol"),
			one("role-b"),
			one("role-s"),
		],
		19.6,
	);
	// Explicit alternative: dip the book, reset it while hidden, then reveal it afresh.
	hide(book, 19.6, 0.35, 0);
	sizeTo(best, BEST.size, 0, 19.95);
	tl.fromTo(book, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 20.45);
	// Its figures land with the alternative headline, before the fresh book arrives.
	d.pop(one("chip-l"), 19.95);
	d.trace(one<SVGPathElement>("limit"), 21.15, { duration: 0.6 });
	// Above the limit: out of reach.
	tl.to(one(`lv-a${LADDER[0].price}`), { opacity: 0.4, duration: 0.4 }, 21.55);
	show(one("fill"), 21.55);
	ride("chip-l", bestRow, 22.1);
	const chipText = one<SVGTextElement>("chip-l-text");
	const filled = one<SVGTextElement>("fill-n");
	const fillTo = (total: number) => {
		chipText.textContent = limitChip(
			pick(copy.buy, context.locale),
			SIZE - total,
		);
		filled.textContent = `${count(total)} / ${SIZE}`;
	};
	sizeTo(best, 0, BEST.size, 22.6, (remaining) => fillTo(FIRST - remaining));
	// Each completed fill stands for a full second before the next construction.
	ride("chip-l", bestRow - 1, 24.1);
	sizeTo(second, 0, TAKEN[1].size, 24.6, (remaining) =>
		fillTo(DONE.filled - remaining),
	);
	tl.to(
		[one(`lv-${best}`), one(`lv-${second}`)],
		{ opacity: 0.3, duration: 0.4 },
		26.1,
	);
	// The rest drops into the bids as the new best bid, and the old ones step down.
	tl.to(bids, { y: L.rowStep, duration: 0.5, ease: "power2.inOut" }, 26.1);
	tl.to(
		one("chip-l"),
		{ y: L.bidY(0) - L.chipY, opacity: 0, duration: 0.5, ease: "power2.inOut" },
		26.1,
	);
	show(one("lv-mine"), 26.6, "right");
	show(one("yours"), 27.0, "right");
	show(one("rest"), 27.5);
	tl.to(one("fill"), { opacity: 0.35, duration: 0.4 }, 27.5);
	d.lock(g("lock-mine"), 29.0, { around: one("rest-n"), pad: 6 });
	tl.addLabel("hero-lock", 29.0);
	show(heads[3], 29.0);
	// After the hero stands, the older book recedes around the earned resting bid.
	tl.to(book, { opacity: 0.25, duration: 0.4 }, 31.0);
	tl.to(one("limit"), { opacity: 0.25, duration: 0.4 }, 31.0);

	// ——— print: two orders, one line on the tape ———
	tl.addLabel("print", 32.6);
	hide(
		[
			heads[2],
			heads[3],
			...book,
			one("lv-mine"),
			one("yours"),
			one("limit"),
			one("fill"),
			one("rest"),
			g("lock-mine"),
		],
		32.6,
	);
	show(heads[4], 32.95);
	show(one("print"), 33.2);
	show(one("card-0"), 34.7);
	show(one("card-1"), 36.2);

	// ——— claim ———
	tl.addLabel("claim", 39.8);
	hide([heads[4], one("card-0"), one("card-1"), one("print")], 39.8);
	word(one("z-big"), 40.1);
	show(one("z-sub"), 40.4);

	// ——— next ———
	tl.addLabel("next", 44.2);
	hide(kids("claim"), 44.2);
	d.close(44.2);
	return tl;
}

export const executionCounterpartiesFilm: Film = {
	id: "execution-counterparties",
	label: [
		`Counterparties, as a short film: Ben's resting offer of ${count(BEST.size)} Oct 18 100 calls at ${usd(BEST.price)} met by your incoming market buy, one trade that prints once and adds ${BEST.size} to volume, not ${BEST.size * 2}; a buy limit for ${SIZE} at ${usd(LIMIT)} that takes ${TAKEN.map((f) => at(f.size, f.price)).join(" and ")} and leaves ${RESTS} waiting as your bid; and one print, ${at(T1.quantity, T1.price)} at ${T1.time}, that a market order and a ${usd(T1.price)} limit would both produce`,
		`交易对手短片：Ben 以 ${usd(BEST.price)} 挂出的 ${count(BEST.size)} 张 10月18日 100 看涨，被你到来的市价买单成交，一笔成交只记录一次，成交量 +${BEST.size} 而不是 +${BEST.size * 2}；${SIZE} 张、限价 ${usd(LIMIT)} 的买单吃下 ${TAKEN.map((f) => at(f.size, f.price)).join(" 和 ")}，剩余 ${RESTS} 张作为你的买单等待；以及 ${T1.time} 的一条成交记录 ${at(T1.quantity, T1.price)}，市价单和 ${usd(T1.price)} 限价单都会产生同样的记录`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Counterparties", "交易对手"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "match", label: ["One trade", "一笔成交"] },
		{ id: "limit", label: ["A limit", "限价"] },
		{ id: "print", label: ["The print", "成交记录"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
