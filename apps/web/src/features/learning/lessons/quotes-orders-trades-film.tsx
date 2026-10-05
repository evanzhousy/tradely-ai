import {
	type Copy,
	count,
	oct105CallLast,
	oct105CallVenues,
	pick,
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
import {
	ADDED,
	BASE_ASKS,
	BASE_BIDS,
	BEST,
	TAKEN,
} from "./quotes-orders-trades-model";

/*
 * Quotes, orders and trades, as a film. It opens on the Oct 18 105 call's screen, bid
 * $2.05, ask $2.15, last $2.00, and asks what a market buy pays. The book answers: bids
 * and asks are offers, the midpoint is arithmetic, the last is history, and the buy takes
 * the $2.15 ask; only then does a trade print. Then orders: an added offer and a cancel
 * change the size with nothing on the tape; a trade prints. Every print stays on the tape,
 * and the size carries from shot to shot: 8, 7 after the buy, 12, 7, then 4. Last, the
 * book turns out to be three venues, whose best bid and best ask are the NBBO, $2.05 by
 * $2.15, until a buyer takes C's last 4 and it prints.
 *
 *   open      0–4      "Quotes, orders and trades"
 *   question  4–9.5    bid $2.05 · ask $2.15 · last $2.00: a market buy pays?
 *   quote     9.5–21   the numbers fly into the book; spread and mid; last; buy 1 at $2.15
 *   orders    21–31    add 5; cancel; take 3, a print; volume 5 → 6 → 9
 *   venues    31–39.8  A, B, C; NBBO $2.05 × $2.15; C's last 4 trade and print
 *   claim     39.8–44  a quote is an offer; only a trade prints
 *   next      44–46.5  Next: counterparties
 */

const END = 46.5;
const ASKS = [...BASE_ASKS].reverse();
const BIDS = BASE_BIDS;
const ASK = BASE_ASKS[0];
const BID = BASE_BIDS[0];
const MID = (ASK.price + BID.price) / 2;
const MAX = Math.max(
	...[...ASKS, ...BIDS].map((level) => level.size),
	ASK.size + ADDED,
);
const price = (cents: number) =>
	Number.isInteger(cents) ? usd(cents) : `$${(cents / 100).toFixed(3)}`;
const VENUES = oct105CallVenues;
/** What is left at the best ask after the film's two trades: the venue shot starts here. */
const LEFT = ASK.size - 1 - TAKEN;
const PRIOR = oct105CallLast.size;
const NEXT_ASK = [...VENUES]
	.filter((v) => v.venue !== BEST.ask.venue)
	.sort((a, b) => a.ask.price - b.ask.price)[0];

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const rowStep = H * (narrow ? 0.06 : 0.085);
	const bookTop = H * 0.27;
	const bookW = narrow ? room : room * 0.56;
	const priceW = narrow ? 52 : width * 0.08;
	const tapeX = narrow ? margin : margin + room * 0.62;
	const tapeY = narrow ? bookTop + 7 * rowStep + H * 0.05 : bookTop;
	return {
		...frame,
		rowStep,
		rowH: rowStep * 0.78,
		askY: (i: number) => bookTop + i * rowStep,
		bidY: (i: number) => bookTop + (ASKS.length + i) * rowStep + rowStep * 0.5,
		spreadY: bookTop + ASKS.length * rowStep + rowStep * 0.12,
		bookW,
		priceW,
		barX: margin + priceW + 10,
		barMax: bookW - priceW - 10 - (narrow ? 40 : 56),
		tapeX,
		tapeY,
		tapeW: narrow ? room : room * 0.38,
		tapeRow: (i: number) => tapeY + T(frame) * 1.6 + i * rowStep,
		venueX: (i: number) =>
			margin + i * ((room - 2 * (narrow ? 8 : 16)) / 3 + (narrow ? 8 : 16)),
		venueW: (room - 2 * (narrow ? 8 : 16)) / 3,
		/** How far a best-price pill sits inside its venue card. */
		pillInset: narrow ? 3 : 6,
		venueY: H * (narrow ? 0.3 : 0.3),
		venueH: H * (narrow ? 0.3 : 0.32),
	};
}
const T = (frame: ReturnType<typeof filmFrame>) => frame.type.small;

const copy = {
	title: ["Quotes, orders and trades", "报价、订单与成交"],
	titleSub: ["three different events", "三种不同的事件"],
	qTag: ["ALFA Oct 18 105 call · 10:30", "ALFA 10月18日 105 看涨 · 10:30"],
	bid: ["bid", "买价"],
	ask: ["ask", "卖价"],
	last: ["last", "最新"],
	qLine: [
		"You buy one at market. What do you pay?",
		"你用市价单买 1 张。要付多少？",
	],
	bookHead: [
		"The book: offers to buy and to sell, not trades.",
		"订单簿：买入和卖出的挂单，不是成交。",
	],
	bookHeadShort: ["The book: offers, not trades.", "订单簿：挂单，不是成交。"],
	midHead: [
		`Spread $0.10; the ${price(MID)} midpoint is just arithmetic.`,
		`价差 $0.10；中间价 ${price(MID)} 是算出来的，没人成交。`,
	],
	midHeadShort: [
		`Mid ${price(MID)}: just arithmetic.`,
		`中间价 ${price(MID)}：算出来的。`,
	],
	lastHead: [
		"The last trade, $2.00 at 10:12, is history: you can't buy at it now.",
		"最新成交 10:12 的 $2.00 是历史：现在买不到这个价。",
	],
	lastHeadShort: ["Last $2.00: history.", "最新 $2.00：历史。"],
	buyHead: [
		"A market buy takes the $2.15 ask: now a trade prints.",
		"市价买单吃掉 $2.15 的卖价：这才产生成交。",
	],
	buyHeadShort: ["Market buy: $2.15. A print.", "市价买入：$2.15。成交。"],
	addHead: [
		`A seller adds ${ADDED} at $2.15: the size grows, the tape doesn't.`,
		`卖方在 $2.15 加挂 ${ADDED} 张：数量变大，成交记录不变。`,
	],
	addHeadShort: [`Add ${ADDED}: no print.`, `加挂 ${ADDED} 张：无成交。`],
	cancelHead: [
		"The seller cancels: the size shrinks, and still nothing traded.",
		"卖方撤单：数量变小，仍然没有成交。",
	],
	cancelHeadShort: ["Cancel: no print.", "撤单：无成交。"],
	takeHead: [
		`A buyer takes ${TAKEN}: a print, and volume +${TAKEN}.`,
		`买方吃掉 ${TAKEN} 张：出现一笔成交，成交量 +${TAKEN}。`,
	],
	takeHeadShort: [`Take ${TAKEN}: a print.`, `吃掉 ${TAKEN} 张：成交。`],
	tape: ["time and sales", "逐笔成交"],
	volume: ["volume", "成交量"],
	mid: ["mid", "中间价"],
	venueHead: [
		"That book was three venues' quotes, combined.",
		"刚才的订单簿，是三个交易场所报价的合并。",
	],
	venueHeadShort: ["Three venues, one book.", "三个场所，一本订单簿。"],
	nbboHead: [
		`Best bid ${usd(BEST.bid.price)} at ${BEST.bid.venue}, best ask ${usd(BEST.ask.price)} at ${BEST.ask.venue}: the NBBO.`,
		`最优买价 ${usd(BEST.bid.price)} 在 ${BEST.bid.venue}，最优卖价 ${usd(BEST.ask.price)} 在 ${BEST.ask.venue}：NBBO。`,
	],
	nbboHeadShort: [
		`NBBO ${usd(BEST.bid.price)} × ${usd(BEST.ask.price)}.`,
		`NBBO ${usd(BEST.bid.price)} × ${usd(BEST.ask.price)}。`,
	],
	goneHead: [
		`A buyer takes ${BEST.ask.venue}'s last ${LEFT}: the best ask becomes ${NEXT_ASK.venue}'s ${usd(NEXT_ASK.ask.price)}.`,
		`买方吃光 ${BEST.ask.venue} 剩下的 ${LEFT} 张：最优卖价变成 ${NEXT_ASK.venue} 的 ${usd(NEXT_ASK.ask.price)}。`,
	],
	goneHeadShort: [
		`${BEST.ask.venue}'s offer gone: ${usd(NEXT_ASK.ask.price)}.`,
		`${BEST.ask.venue} 的卖单被吃光：${usd(NEXT_ASK.ask.price)}。`,
	],
	venue: ["venue", "场所"],
	nbbo: ["NBBO", "NBBO"],
	claimBig: [
		"A quote is an offer; only a trade prints.",
		"报价只是挂单；只有成交才会留下记录。",
	],
	claimSub: [
		"Buy at the ask, sell at the bid; the last and the mid aren't on offer.",
		"按卖价买、按买价卖；最新价和中间价都不可成交。",
	],
	nextBig: ["Next: counterparties", "下一课：交易对手"],
	nextSub: ["who buys and who sells in one trade", "一笔成交里谁买谁卖"],
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
		side: "ask" | "bid",
		y: number,
		at: { price: number; size: number },
	) => {
		const key = `${side}-${at.price}`;
		return (
			<g key={key} data-f={`lv-${key}`}>
				<rect
					data-f={`hit-${key}`}
					x={margin}
					y={y}
					width={L.bookW}
					height={L.rowH}
					rx={7}
					className="wt-focus-shape"
				/>
				<text
					data-f={`px-${key}`}
					x={margin + L.priceW}
					y={rowText(y)}
					textAnchor="end"
					className="wt-film-num"
					style={{ fontSize: text }}
				>
					{usd(at.price)}
				</text>
				<rect
					data-f={`bar-${key}`}
					x={L.barX}
					y={y + L.rowH * 0.2}
					width={(at.size / MAX) * L.barMax}
					height={L.rowH * 0.6}
					rx={3}
					className="wt-film-bar"
					data-tone={side === "ask" ? "loss" : "gain"}
				/>
				<text
					data-f={`size-${key}`}
					x={margin + L.bookW - 6}
					y={rowText(y)}
					textAnchor="end"
					className="wt-film-num"
					style={{ fontSize: text }}
				>
					{count(at.size)}
				</text>
			</g>
		);
	};
	const prints = [
		["pr-buy", `10:30 · 1 @ ${usd(ASK.price)}`],
		["pr-take", `10:31 · ${TAKEN} @ ${usd(ASK.price)}`],
	] as const;
	const venueLine = (k: number) => L.venueY + L.venueH * [0.18, 0.48, 0.78][k];
	/** The best ask's row: where a market buy trades, and where its print sets off for the tape. */
	const bestRow = ASKS.length - 1;
	const venueLock = (
		venue: string,
		line: number,
		tone: "gain" | "loss",
		name: string,
	) => (
		<Brackets
			name={name}
			x={L.venueX(VENUES.findIndex((v) => v.venue === venue)) + L.pillInset}
			y={venueLine(line) - text * 1.2}
			width={L.venueW - 2 * L.pillInset}
			height={text * 1.7}
			arm={8}
			tone={tone}
		/>
	);
	return (
		<>
			<Backdrop frame={L} />

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				<Word
					name="q-tag"
					x={W / 2}
					y={H * 0.3}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.qTag).toUpperCase()}
				</Word>
				{(
					[
						["q-bid", copy.bid, usd(BID.price), "wt-film-gain"],
						["q-ask", copy.ask, usd(ASK.price), "wt-film-loss"],
						["q-last", copy.last, usd(oct105CallLast.price), "wt-film-dim"],
					] as const
				).map(([name, tag, num, tone], i) => (
					<g key={name}>
						<Word
							name={`${name}-tag`}
							x={W * (0.2 + i * 0.3)}
							y={H * 0.44}
							size={T.small}
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`${name}-num`}
							x={W * (0.2 + i * 0.3)}
							y={H * 0.44 + T.num * 1.4}
							size={T.num * 1.2}
							className={`wt-film-num ${tone}`}
						>
							{num}
						</Word>
					</g>
				))}
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.74}
					size={T.head}
					maxWidth={room}
					className="wt-film-type wt-film-accent"
				/>
			</g>

			{/* The book and its tape. */}
			{headline("k-head", copy.bookHead, copy.bookHeadShort)}
			{headline("m-head", copy.midHead, copy.midHeadShort)}
			{headline("l-head", copy.lastHead, copy.lastHeadShort)}
			{headline("b-head", copy.buyHead, copy.buyHeadShort)}
			{headline("a-head", copy.addHead, copy.addHeadShort)}
			{headline("c-head", copy.cancelHead, copy.cancelHeadShort)}
			{headline("t-head", copy.takeHead, copy.takeHeadShort)}
			<g data-f="book">
				{ASKS.map((at, i) => level("ask", L.askY(i), at))}
				<path
					d={`M${margin} ${L.spreadY + L.rowStep * 0.2}H${margin + L.bookW}`}
					className="wt-film-link"
				/>
				{BIDS.map((at, i) => level("bid", L.bidY(i), at))}
				<text
					x={margin}
					y={L.askY(0) - T.small * 0.9}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.ask).toUpperCase()}
				</text>
				<text
					x={margin}
					y={L.bidY(BIDS.length - 1) + L.rowH + T.small * 1.4}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.bid).toUpperCase()}
				</text>
			</g>
			<g data-f="mid">
				<path
					d={`M${L.barX} ${L.spreadY + L.rowStep * 0.2}H${L.barX + L.barMax}`}
					className="wt-film-riser"
				/>
				<text
					x={margin + L.bookW - 6}
					y={L.spreadY + L.rowStep * 0.2 - 5}
					textAnchor="end"
					className="wt-film-num wt-film-accent"
					style={{ fontSize: T.small * 1.1 }}
				>
					{`${t(copy.mid)} ${price(MID)}`}
				</text>
			</g>
			<g data-f="tape">
				<text
					x={L.tapeX}
					y={L.tapeY + T.small}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.tape).toUpperCase()}
				</text>
				<text
					data-f="vol"
					x={L.tapeX + L.tapeW}
					y={L.tapeY + T.small}
					textAnchor="end"
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{`${t(copy.volume).toUpperCase()} ${PRIOR}`}
				</text>
				<text
					data-f="pr-last"
					x={L.tapeX}
					y={L.tapeRow(0) + L.rowH * 0.6}
					className="wt-film-num wt-film-dim"
					style={{ fontSize: text }}
				>
					{`${oct105CallLast.time} · ${oct105CallLast.size} @ ${usd(oct105CallLast.price)}`}
				</text>
			</g>
			<Brackets
				name="lock-ask"
				x={margin - 5}
				y={L.askY(bestRow) - 4}
				width={L.bookW + 10}
				height={L.rowH + 8}
			/>
			{/* Each print leaves the book as a chip and lands on the tape. */}
			{prints.map(([name, label]) => (
				<text
					key={`carry-${name}`}
					data-f={`carry-${name}`}
					x={L.barX + 6}
					y={rowText(L.askY(bestRow))}
					className="wt-film-num wt-film-accent wt-halo"
					style={{ fontSize: text }}
				>
					{label.split(" · ")[1]}
				</text>
			))}
			{prints.map(([name, label]) => (
				<text
					key={name}
					data-f={name}
					x={L.tapeX}
					y={L.tapeRow(0) + L.rowH * 0.6}
					className="wt-film-num wt-film-accent"
					style={{ fontSize: text }}
				>
					{label}
				</text>
			))}

			{/* Three venues. */}
			{headline("v-head", copy.venueHead, copy.venueHeadShort)}
			{headline("n-head", copy.nbboHead, copy.nbboHeadShort)}
			{headline("g-head", copy.goneHead, copy.goneHeadShort)}
			<g data-f="venues">
				{VENUES.map((v, i) => (
					<g key={v.venue} data-f={`venue-${v.venue}`}>
						<rect
							x={L.venueX(i)}
							y={L.venueY}
							width={L.venueW}
							height={L.venueH}
							rx={12}
							className="wt-panel-shape"
						/>
						<text
							x={L.venueX(i) + L.venueW / 2}
							y={venueLine(0)}
							textAnchor="middle"
							className="wt-film-tag"
							style={{ fontSize: T.small }}
						>
							{`${t(copy.venue).toUpperCase()} ${v.venue}`}
						</text>
						<text
							data-f={`vb-${v.venue}`}
							x={L.venueX(i) + L.venueW / 2}
							y={venueLine(1)}
							textAnchor="middle"
							className="wt-film-num"
							style={{ fontSize: narrow ? T.body : T.head }}
						>
							{usd(v.bid.price)}
						</text>
						<text
							data-f={`va-${v.venue}`}
							x={L.venueX(i) + L.venueW / 2}
							y={venueLine(2)}
							textAnchor="middle"
							className="wt-film-num"
							style={{ fontSize: narrow ? T.body : T.head }}
						>
							{`${usd(v.ask.price)} × ${v.venue === BEST.ask.venue ? LEFT : v.ask.size}`}
						</text>
					</g>
				))}
				{venueLock(BEST.bid.venue, 1, "gain", "best-bid")}
				{venueLock(BEST.ask.venue, 2, "loss", "best-ask")}
				{venueLock(NEXT_ASK.venue, 2, "loss", "next-ask")}
			</g>
			{(
				[
					["nbbo-1", `${usd(BEST.bid.price)} × ${usd(BEST.ask.price)}`],
					["nbbo-2", `${usd(BEST.bid.price)} × ${usd(NEXT_ASK.ask.price)}`],
				] as const
			).map(([name, label]) => (
				<g key={name} data-f={name}>
					<text
						x={W / 2}
						y={L.venueY + L.venueH + H * (narrow ? 0.15 : 0.08)}
						textAnchor="middle"
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(copy.nbbo)}
					</text>
					<text
						x={W / 2}
						y={L.venueY + L.venueH + H * (narrow ? 0.15 : 0.08) + T.num * 1.3}
						textAnchor="middle"
						className="wt-film-num wt-film-accent"
						style={{ fontSize: T.num }}
					>
						{label}
					</text>
				</g>
			))}
			{/* C's last contracts leave its card and print on a strip of tape. */}
			<text
				data-f="carry-gone"
				x={
					L.venueX(VENUES.findIndex((v) => v.venue === BEST.ask.venue)) +
					L.venueW / 2
				}
				y={venueLine(2) + text * 1.6}
				textAnchor="middle"
				className="wt-film-num wt-film-accent wt-halo"
				style={{ fontSize: text }}
			>
				{`${LEFT} @ ${usd(BEST.ask.price)}`}
			</text>
			{/* The tape strip sits right under C, so its last contracts drop a short way, clear of the NBBO. */}
			<g data-f="strip">
				<text
					x={margin + room}
					y={L.venueY + L.venueH + T.small * 1.7}
					textAnchor="end"
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.tape).toUpperCase()}
				</text>
				<text
					data-f="pr-gone"
					x={margin + room}
					y={L.venueY + L.venueH + T.small * 1.7 + text * 1.5}
					textAnchor="end"
					className="wt-film-num wt-film-accent"
					style={{ fontSize: text }}
				>
					{`10:32 · ${LEFT} @ ${usd(BEST.ask.price)}`}
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
	/** A figure lands slightly large and settles, without overshoot: it is data. */
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const askKey = `ask-${ASK.price}`;
	const hit = one(`hit-${askKey}`);
	const bar = one(`bar-${askKey}`);
	const size = one<SVGTextElement>(`size-${askKey}`);
	const width = (n: number) => (n / MAX) * L.barMax;
	const sizeTo = (to: number, from: number, time: number) => {
		tl.to(
			bar,
			{ attr: { width: width(to) }, duration: 0.5, ease: "power2.out" },
			time,
		);
		d.count(size, to, time, (v) => count(Math.round(v)), from, 0.5);
	};
	const volume = one<SVGTextElement>("vol");
	const volumeTo = (to: number, from: number, time: number) =>
		d.count(
			volume,
			to,
			time,
			(v) => `${d.t(copy.volume).toUpperCase()} ${Math.round(v)}`,
			from,
			0.4,
		);
	/**
	 * A trade leaves the book as a chip, travels to the top of the tape and becomes its print,
	 * pushing the older prints down a row. Prints never leave the tape.
	 */
	const text = L.narrow ? L.type.small * 1.1 : L.type.body;
	const bestRow = ASKS.length - 1;
	const carryX = L.tapeX - (L.barX + 6);
	const carryY =
		L.tapeRow(0) + L.rowH * 0.6 - (L.askY(bestRow) + L.rowH / 2 + text * 0.36);
	const print = (name: string, below: Element[], time: number) => {
		const chip = one(`carry-${name}`);
		tl.fromTo(
			chip,
			{ opacity: 0, x: 0, y: 0 },
			{ opacity: 1, duration: 0.15 },
			time,
		);
		tl.to(
			chip,
			{ x: carryX, y: carryY, duration: 0.6, ease: "power2.inOut" },
			time + 0.15,
		);
		tl.to(
			below,
			{ y: `+=${L.rowStep}`, duration: 0.4, ease: "power2.inOut" },
			time + 0.3,
		);
		tl.set(chip, { opacity: 0 }, time + 0.75);
		tl.fromTo(
			one(name),
			{ opacity: 0 },
			{ opacity: 1, duration: 0.2 },
			time + 0.75,
		);
	};
	const lockAsk = one<SVGGraphicsElement>("lock-ask");
	const heads = [
		"k-head",
		"m-head",
		"l-head",
		"b-head",
		"a-head",
		"c-head",
		"t-head",
		"v-head",
		"n-head",
		"g-head",
	].map((name) => one(name));
	const levels = [
		...ASKS.map((at) => one(`lv-ask-${at.price}`)),
		...BIDS.map((at) => one(`lv-bid-${at.price}`)),
	];
	const pxAsk = one<SVGGraphicsElement>(`px-ask-${ASK.price}`);
	const pxBid = one<SVGGraphicsElement>(`px-bid-${BID.price}`);
	const last = one<SVGGraphicsElement>("pr-last");

	d.hidden([
		...flat("q"),
		...heads,
		...flat("book").filter(
			(el) => !el.getAttribute("data-f")?.startsWith("lv-"),
		),
		...levels,
		pxAsk,
		pxBid,
		...ASKS.map((at) => one(`hit-ask-${at.price}`)),
		...BIDS.map((at) => one(`hit-bid-${at.price}`)),
		one("mid"),
		...kids("tape"),
		one("pr-buy"),
		one("pr-take"),
		one("carry-pr-buy"),
		one("carry-pr-take"),
		lockAsk,
		...kids("venues"),
		one("nbbo-1"),
		one("nbbo-2"),
		one("carry-gone"),
		...kids("strip"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: three numbers on a screen ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	(["q-bid", "q-ask", "q-last"] as const).forEach((name, i) => {
		show(one(`${name}-tag`), 4.9 + i * 0.3);
		word(one(`${name}-num`), 5.0 + i * 0.3);
	});
	show(one("q-line"), 6.6);

	// ——— quote: the three numbers take their places in the book and on the tape ———
	tl.addLabel("quote", 9.5);
	hide(
		[
			one("q-tag"),
			one("q-line"),
			...(["q-bid", "q-ask", "q-last"] as const).map((n) => one(`${n}-tag`)),
		],
		9.5,
	);
	show(heads[0], 9.7);
	show(
		flat("book").filter((el) => !el.getAttribute("data-f")),
		10.0,
	);
	levels.forEach((lv, i) => {
		show(lv, 10.1 + i * 0.08, "right");
	});
	show(
		kids("tape").filter((el) => el !== last),
		10.6,
	);
	d.carry(one<SVGGraphicsElement>("q-bid-num"), pxBid, 9.9, 1.0);
	d.carry(one<SVGGraphicsElement>("q-ask-num"), pxAsk, 9.95, 1.0);
	d.carry(one<SVGGraphicsElement>("q-last-num"), last, 10.0, 1.0);
	d.swap(heads[0], heads[1], 12.4);
	show(one("mid"), 12.8);
	d.swap(heads[1], heads[2], 15.0);
	tl.to(
		last,
		{ attr: { class: "wt-film-num wt-film-warn" }, duration: 0.01 },
		15.4,
	);
	d.swap(heads[2], heads[3], 17.6);
	hide(one("mid"), 17.6);
	tl.to(hit, { opacity: 1, duration: 0.3 }, 18.0);
	d.lock(lockAsk, 18.0);
	sizeTo(ASK.size - 1, ASK.size, 18.2);
	print("pr-buy", [last], 18.4);
	volumeTo(PRIOR + 1, PRIOR, 19.2);

	// ——— orders: only trades print ———
	tl.addLabel("orders", 21);
	d.swap(heads[3], heads[4], 21.0);
	tl.to([hit, lockAsk], { opacity: 0, duration: 0.3 }, 21.0);
	sizeTo(ASK.size - 1 + ADDED, ASK.size - 1, 21.6);
	d.swap(heads[4], heads[5], 24.0);
	sizeTo(ASK.size - 1, ASK.size - 1 + ADDED, 24.4);
	d.swap(heads[5], heads[6], 26.6);
	tl.to(hit, { opacity: 1, duration: 0.3 }, 27.0);
	d.lock(lockAsk, 27.0);
	sizeTo(LEFT, ASK.size - 1, 27.2);
	print("pr-take", [one("pr-buy"), last], 27.4);
	volumeTo(PRIOR + 1 + TAKEN, PRIOR + 1, 28.2);

	// ——— venues: the best of three ———
	tl.addLabel("venues", 31);
	hide(
		[
			heads[6],
			...flat("book").filter(
				(el) => !el.getAttribute("data-f")?.startsWith("lv-"),
			),
			...levels,
			hit,
			lockAsk,
			...kids("tape"),
			one("pr-buy"),
			one("pr-take"),
		],
		31.0,
	);
	show(heads[7], 31.2);
	VENUES.forEach((v, i) => {
		show(one(`venue-${v.venue}`), 31.5 + i * 0.3);
	});
	d.swap(heads[7], heads[8], 33.8);
	d.lock(one<SVGGraphicsElement>("best-bid"), 34.2);
	d.lock(one<SVGGraphicsElement>("best-ask"), 34.4);
	word(one("nbbo-1"), 34.7);
	d.swap(heads[8], heads[9], 36.8);
	// C's last contracts trade: its size runs out, they print, and C drops out of the NBBO.
	const gone = one("carry-gone");
	d.count(
		one(`va-${BEST.ask.venue}`),
		0,
		37.2,
		(v) =>
			Math.round(v) > 0 ? `${usd(BEST.ask.price)} × ${Math.round(v)}` : "—",
		LEFT,
		0.5,
	);
	tl.fromTo(
		gone,
		{ opacity: 0, y: -text * 0.8 },
		{ opacity: 1, y: 0, duration: 0.2 },
		37.2,
	);
	// The strip's label comes in as the print lands under it.
	show(kids("strip")[0], 38.1);
	d.carry(
		gone as SVGGraphicsElement,
		one<SVGGraphicsElement>("pr-gone"),
		37.4,
		0.8,
	);
	tl.to(one("best-ask"), { opacity: 0, duration: 0.3 }, 37.7);
	tl.to(one(`venue-${BEST.ask.venue}`), { opacity: 0.4, duration: 0.3 }, 37.7);
	d.lock(one<SVGGraphicsElement>("next-ask"), 37.8);
	d.flip(one("nbbo-1"), one("nbbo-2"), 37.8);
	tl.set(one("nbbo-1"), { opacity: 0 }, 38.1);

	// ——— claim ———
	tl.addLabel("claim", 39.8);
	hide([heads[9], ...kids("venues"), one("nbbo-2"), ...kids("strip")], 39.8);
	word(one("z-big"), 40.1);
	show(one("z-sub"), 40.5);

	// ——— next ———
	tl.addLabel("next", 44);
	hide(kids("claim"), 44.0);
	d.close(44.0);
	return tl;
}

export const quotesOrdersTradesFilm: Film = {
	id: "quotes-orders-trades",
	label: [
		`Quotes, orders and trades, as a short film: the Oct 18 105 call at bid ${usd(BID.price)}, ask ${usd(ASK.price)} and last ${usd(oct105CallLast.price)}, and what a market buy pays; the book's offers, a ${price(MID)} midpoint nobody traded at, a last price that is history, and the buy that takes the ${usd(ASK.price)} ask and prints; an order added and cancelled with nothing on the tape, then ${TAKEN} contracts taken and printed; and the three venues behind the book, whose best bid and ask form the NBBO, ${usd(BEST.bid.price)} by ${usd(BEST.ask.price)}, until ${BEST.ask.venue}'s last ${LEFT} trade and print`,
		`报价、订单与成交短片：10月18日 105 看涨买价 ${usd(BID.price)}、卖价 ${usd(ASK.price)}、最新成交 ${usd(oct105CallLast.price)}，市价买入要付多少；订单簿上的出价、没人成交过的中间价 ${price(MID)}、属于历史的最新成交价，以及吃掉 ${usd(ASK.price)} 卖价并留下记录的买单；加挂再撤单都不留成交记录，然后 ${TAKEN} 张被吃掉并成交；以及订单簿背后的三个场所，最优买卖价组成 NBBO：${usd(BEST.bid.price)} × ${usd(BEST.ask.price)}，直到 ${BEST.ask.venue} 剩下的 ${LEFT} 张成交并留下记录`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Quotes and trades", "报价与成交"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "quote", label: ["A quote", "报价"] },
		{ id: "orders", label: ["Orders", "订单"] },
		{ id: "venues", label: ["Venues", "场所"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
