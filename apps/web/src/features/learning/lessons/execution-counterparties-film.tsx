import { type Copy, count, pick, usd } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import type { Film, FilmContext } from "../walkthrough/film";
import {
	Backdrop,
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
 * does the day's volume rise by 10 or by 20? The book answers: Ben's offer was resting,
 * your market buy arrived and took it, and the one trade prints once, volume +10. Then a
 * limit: 30 contracts at most $4.15 takes 10 at $4.10 and 12 at $4.15, and the last 8 wait
 * as your bid. Last, the tape: a market buy and a $4.10 limit print the same line.
 *
 *   open      0–4      "Counterparties"
 *   question  4–9.5    Ben offers 10 at $4.10, you buy them: volume +10 or +20?
 *   match     9.5–20   resting; incoming; one trade, one print, volume +10
 *   limit     20–30.5  buy 30, limit $4.15; 10 and 12 fill; 8 rest as your bid
 *   print     30.5–39.5 the tape; record A, market; record B, limit; cut: the claim
 *   next      39.5–42  Next: execution side
 */

const END = 42;
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
	restHead: [
		`Ben offers ${count(BEST.size)} at ${usd(BEST.price)} and waits: a resting order.`,
		`Ben 以 ${usd(BEST.price)} 挂出 ${count(BEST.size)} 张并等待：这是挂单。`,
	],
	restHeadShort: ["Ben's offer rests.", "Ben 的卖单在等待。"],
	inHead: [
		"Your market buy arrives and takes the best offer now: you're the aggressor.",
		"你的市价买单到达，立即吃掉最优卖价：你是主动方。",
	],
	inHeadShort: ["Your buy takes it.", "你的买单吃掉它。"],
	oneHead: [
		`One trade: you buy ${count(BEST.size)}, Ben sells ${count(BEST.size)}. One print, volume +${BEST.size}.`,
		`一笔成交：你买 ${count(BEST.size)} 张，Ben 卖 ${count(BEST.size)} 张。一条记录，成交量 +${BEST.size}。`,
	],
	oneHeadShort: [`One trade: +${BEST.size}.`, `一笔成交：+${BEST.size}。`],
	limHead: [
		`Suppose instead: buy ${SIZE}, and pay at most ${usd(LIMIT)}.`,
		`换个情况：买 ${SIZE} 张，最多付 ${usd(LIMIT)}。`,
	],
	limHeadShort: [
		`Buy ${SIZE}, limit ${usd(LIMIT)}.`,
		`买 ${SIZE} 张，限价 ${usd(LIMIT)}。`,
	],
	fillHead: [
		`Best price first: ${count(TAKEN[0].size)} at ${usd(TAKEN[0].price)}, then all ${TAKEN[1].size} at ${usd(TAKEN[1].price)}.`,
		`价格优先：先吃 ${usd(TAKEN[0].price)} 的 ${count(TAKEN[0].size)} 张，再吃 ${usd(TAKEN[1].price)} 的全部 ${TAKEN[1].size} 张。`,
	],
	fillHeadShort: ["Best price first.", "价格优先。"],
	restsHead: [
		`Nothing is left at ${usd(LIMIT)} or less: the last ${RESTS} wait as your bid.`,
		`${usd(LIMIT)} 及以下已无卖单：最后 ${RESTS} 张作为你的买单等待。`,
	],
	restsHeadShort: [`The last ${RESTS} wait.`, `最后 ${RESTS} 张等待。`],
	tapeHead: [
		`The tape shows ${count(T1.quantity)} at ${usd(T1.price)}, ${T1.time}: no order type.`,
		`成交记录：${T1.time}，${usd(T1.price)} 成交 ${count(T1.quantity)} 张，没有订单类型。`,
	],
	tapeHeadShort: ["The tape: no order type.", "成交记录：无订单类型。"],
	aHead: [
		`A market buy of ${T1.quantity} prints this line.`,
		`市价买入 ${T1.quantity} 张会产生这条记录。`,
	],
	aHeadShort: ["A market buy prints it.", "市价单会产生它。"],
	bHead: [
		`So does a buy limit at ${usd(T1.price)}: the tape can't tell them apart.`,
		`${usd(T1.price)} 的买入限价单也一样：成交记录无法区分。`,
	],
	bHeadShort: ["So does a limit.", "限价单也一样。"],
	ask: ["ask", "卖单"],
	bid: ["bid", "买单"],
	ben: ["Ben", "Ben"],
	yours: ["yours", "你的"],
	chipMarket: [`you: buy ${BEST.size}`, `你：买 ${BEST.size}`],
	buy: ["buy", "买"],
	tape: ["time and sales", "逐笔成交"],
	empty: ["no trades yet", "尚无成交"],
	volume: ["volume", "成交量"],
	filled: ["filled", "已成交"],
	resting: ["resting", "挂单等待"],
	buyer: ["buyer: you, incoming", "买方：你，主动到来"],
	seller: ["seller: Ben, resting", "卖方：Ben，挂单"],
	recordA: ["record A", "记录 A"],
	recordB: ["record B", "记录 B"],
	market: [`buy ${T1.quantity} · market`, `买 ${T1.quantity} · 市价`],
	limit: [
		`buy ${T1.quantity} · limit ${usd(T1.price)}`,
		`买 ${T1.quantity} · 限价 ${usd(T1.price)}`,
	],
	publicTape: ["public tape", "公开成交记录"],
	printSub: ["price, size, time", "价格、数量、时间"],
	claimBig: ["One trade, two sides, one print.", "一笔成交，两方，一条记录。"],
	claimSub: [
		"The incoming order takes and the resting one waits. A limit caps the price, never the size, and the tape shows neither order.",
		"主动订单成交，挂单等待。限价只限制价格，不能创造数量；成交记录也不显示任何一方的订单。",
	],
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
	const headline = (name: string, text: Copy, short: Copy) => (
		<Lines
			name={name}
			text={t(narrow ? short : text)}
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
				x={L.statX}
				y={y + T.small}
				className="wt-film-tag"
				style={{ fontSize: T.small }}
			>
				{t(tag).toUpperCase()}
			</text>
			<text
				data-f={`${name}-n`}
				x={L.statX}
				y={y + T.small + T.num * 1.15}
				className="wt-film-num wt-film-accent"
				style={{ fontSize: T.num }}
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
	/** A record's line lands toward the print's ends, leaving its middle for the type. */
	const wire = (i: number) => {
		const from = L.cardX[i] + L.cardW / 2;
		const to = printX + (i === 0 ? L.printW * 0.18 : L.printW * 0.82);
		return `M${from} ${L.cardY + L.cardH + 6}L${to} ${L.printY - 8}`;
	};
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
			{headline("r-head", copy.restHead, copy.restHeadShort)}
			{headline("i-head", copy.inHead, copy.inHeadShort)}
			{headline("o-head", copy.oneHead, copy.oneHeadShort)}
			{headline("l-head", copy.limHead, copy.limHeadShort)}
			{headline("f-head", copy.fillHead, copy.fillHeadShort)}
			{headline("s-head", copy.restsHead, copy.restsHeadShort)}
			<g data-f="frame">
				<text
					x={margin}
					y={L.askY(0) - T.small * 0.9}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.ask).toUpperCase()}
				</text>
				<path
					d={`M${margin} ${L.chipY + L.rowH / 2}H${margin + L.bookW}`}
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

			{/* Two records, one print. */}
			{headline("t-head", copy.tapeHead, copy.tapeHeadShort)}
			{headline("a-head", copy.aHead, copy.aHeadShort)}
			{headline("b-head", copy.bHead, copy.bHeadShort)}
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
			<path data-f="wire-0" d={wire(0)} className="wt-film-riser" />
			<path data-f="wire-1" d={wire(1)} className="wt-film-riser" />
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
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
			time,
		);
	const width = (n: number) => (n / MAX) * L.barMax;
	/** A line draws itself from its start, then takes back its own dashes, if any. */
	const draw = (path: SVGPathElement, time: number, dash?: string) => {
		const length = path.getTotalLength();
		tl.fromTo(
			path,
			{ opacity: 0, strokeDasharray: length, strokeDashoffset: length },
			{ opacity: 1, strokeDashoffset: 0, duration: 0.5, ease: "power2.out" },
			time,
		);
		if (dash) tl.set(path, { strokeDasharray: dash }, time + 0.5);
	};
	/** A level's size runs to `to`: its bar and its number together. */
	const sizeTo = (name: string, to: number, from: number, time: number) => {
		tl.to(
			one(`bar-${name}`),
			{ attr: { width: width(to) }, duration: 0.5, ease: "power2.out" },
			time,
		);
		d.count(
			one<SVGTextElement>(`size-${name}`),
			to,
			time,
			(v) => count(Math.round(v)),
			from,
			0.5,
		);
	};
	/** The incoming order rides up to the level it takes. */
	const ride = (name: string, row: number, time: number) =>
		tl.to(
			one(name),
			{ y: L.askY(row) - L.chipY, duration: 0.5, ease: "power2.inOut" },
			time,
		);
	const heads = [
		"r-head",
		"i-head",
		"o-head",
		"l-head",
		"f-head",
		"s-head",
		"t-head",
		"a-head",
		"b-head",
	].map((name) => one(name));
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
		one("tape-print"),
		one("vol"),
		one("fill"),
		one("rest"),
		one("role-b"),
		one("role-s"),
		one("card-0"),
		one("card-1"),
		one("wire-0"),
		one("wire-1"),
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
	word(one("q-big"), 6.4);

	// ——— match: resting, incoming, one trade ———
	tl.addLabel("match", 9.5);
	hide(flat("q"), 9.5);
	show(heads[0], 9.7, "above");
	show(kids("frame"), 10.0);
	[...asks, ...bids].forEach((lv, i) => {
		show(lv, 10.1 + i * 0.08, "right");
	});
	d.pop(one("ben"), 10.9);
	show(kids("tape"), 11.0);
	show(one("vol"), 11.2);
	d.swap(heads[0], heads[1], 12.2);
	d.pop(one("chip-m"), 12.7);
	ride("chip-m", bestRow, 13.5);
	d.swap(heads[1], heads[2], 15.0);
	hide([one("chip-m"), one("ben")], 15.3, 0.3);
	sizeTo(best, 0, BEST.size, 15.4);
	d.flip(one("tape-empty"), one("tape-print"), 15.6);
	tl.set(one("tape-empty"), { opacity: 0 }, 15.9);
	d.count(
		one<SVGTextElement>("vol-n"),
		BEST.size,
		15.8,
		(v) => count(Math.round(v)),
		0,
		0.6,
	);
	show(one("role-b"), 16.6);
	show(one("role-s"), 16.9);

	// ——— limit: the price is capped, the size is not created ———
	tl.addLabel("limit", 20);
	d.swap(heads[2], heads[3], 20.0);
	hide(
		[
			...kids("tape"),
			one("tape-print"),
			one("vol"),
			one("role-b"),
			one("role-s"),
		],
		20.0,
	);
	// The same book as before the trade.
	sizeTo(best, BEST.size, 0, 20.2);
	draw(one<SVGPathElement>("limit"), 20.8, "5 4");
	// Above the limit: out of reach.
	tl.to(one(`lv-a${LADDER[0].price}`), { opacity: 0.4, duration: 0.4 }, 21.0);
	tl.set(one("chip-m"), { y: 0 }, 20.0);
	d.pop(one("chip-l"), 21.2);
	show(one("fill"), 21.4);
	d.swap(heads[3], heads[4], 22.8);
	ride("chip-l", bestRow, 23.2);
	sizeTo(best, 0, BEST.size, 23.7);
	const chipText = one<SVGTextElement>("chip-l-text");
	const chipLabel = (n: number) =>
		limitChip(pick(copy.buy, context.locale), Math.round(n));
	d.count(chipText, SIZE - FIRST, 23.7, chipLabel, SIZE, 0.5);
	d.count(
		one<SVGTextElement>("fill-n"),
		FIRST,
		23.7,
		(v) => `${Math.round(v)} / ${SIZE}`,
		0,
		0.5,
	);
	ride("chip-l", bestRow - 1, 24.6);
	sizeTo(second, 0, TAKEN[1].size, 25.1);
	d.count(chipText, RESTS, 25.1, chipLabel, SIZE - FIRST, 0.5);
	d.count(
		one<SVGTextElement>("fill-n"),
		DONE.filled,
		25.1,
		(v) => `${Math.round(v)} / ${SIZE}`,
		FIRST,
		0.5,
	);
	d.swap(heads[4], heads[5], 26.6);
	tl.to(
		[one(`lv-${best}`), one(`lv-${second}`)],
		{ opacity: 0.3, duration: 0.4 },
		27.0,
	);
	// The rest drops into the bids as the new best bid, and the old ones step down.
	tl.to(bids, { y: L.rowStep, duration: 0.5, ease: "power2.inOut" }, 27.1);
	tl.to(
		one("chip-l"),
		{ y: L.bidY(0) - L.chipY, opacity: 0, duration: 0.5, ease: "power2.inOut" },
		27.1,
	);
	show(one("lv-mine"), 27.5, "right");
	d.pop(one("yours"), 27.8);
	show(one("rest"), 28.0);

	// ——— print: two records, one line ———
	tl.addLabel("print", 30.5);
	hide(
		[
			heads[5],
			...book,
			one("lv-mine"),
			one("yours"),
			one("limit"),
			one("fill"),
			one("rest"),
		],
		30.5,
	);
	show(heads[6], 30.7, "above");
	show(one("print"), 31.0);
	d.swap(heads[6], heads[7], 32.6);
	show(one("card-0"), 33.0);
	draw(one<SVGPathElement>("wire-0"), 33.4);
	d.swap(heads[7], heads[8], 34.6);
	show(one("card-1"), 35.0);
	draw(one<SVGPathElement>("wire-1"), 35.4);
	// Cut: the claim.
	hide(
		[
			heads[8],
			one("card-0"),
			one("card-1"),
			one("wire-0"),
			one("wire-1"),
			one("print"),
		],
		37.0,
	);
	word(one("z-big"), 37.3);
	show(one("z-sub"), 37.7);

	// ——— next ———
	tl.addLabel("next", 39.5);
	hide(kids("claim"), 39.5);
	d.close(39.5);
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
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
