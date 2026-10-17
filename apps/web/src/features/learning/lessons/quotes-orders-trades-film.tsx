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
import { textWidth } from "../walkthrough/text-measure";
import {
	ADDED,
	BASE_ASKS,
	BASE_BIDS,
	BEST,
	TAKEN,
} from "./quotes-orders-trades-model";

/*
 * Quotes, orders and trades, as a film. It opens on the Oct 18 105 call's screen, bid
 * $2.05, ask $2.15, last $2.00, and asks what a market buy pays. The three numbers fly to
 * their places: the bid and the ask into the book, the last onto the tape as history. The
 * midpoint is arithmetic; a market buy takes the $2.15 ask, and only then does a trade
 * print. Adds and cancels move the size with nothing on the tape; a take of 3 prints.
 * Every print stays on the tape, and the size carries from shot to shot: 8, 7, 12, 7, 4.
 * Then the hero: the book resolves into three venue cards, whose best prices combine
 * into the glowing NBBO, $2.05 by $2.15. It stands before C's last 4 are bought.
 * C's exhausted ask and the NBBO turn over together; the print lands with volume 13
 * while the new best ask stands without another lock.
 *
 *   open      0–4        "Quotes, orders and trades"
 *   question  4–8.9      bid $2.05 · ask $2.15 · last $2.00: a market buy pays?
 *   quote     8.9–22.2   the numbers fly into the book; mid and last; buy 1 at $2.15
 *   orders    22.2–28.75 add 5 and cancel 5, no print; take 3, a print; volume 5 → 6 → 9
 *   venues    28.75–35.1 hero: the book resolves into A, B, C; best prices combine into
 *                        the NBBO, $2.05 × $2.15
 *   gone      35.1–40.55 C's last 4 print: volume 13; best ask $2.20
 *   claim     40.55–45   a quote is an offer; only a trade prints
 *   next      45–47.5    Next: counterparties
 */

const END = 47.5;
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
	const T = frame.type;
	const rowStep = H * (narrow ? 0.06 : 0.085);
	const rowH = rowStep * 0.78;
	const bookTop = H * 0.27;
	// A gutter of about 0.12 of the room between book and tape: tickets cross it.
	const bookW = narrow ? room : room * 0.52;
	const priceW = narrow ? 52 : width * 0.08;
	const askY = (i: number) => bookTop + i * rowStep;
	const bidY = (i: number) =>
		bookTop + (ASKS.length + i) * rowStep + rowStep * 0.5;
	const bookBottom = bidY(BIDS.length - 1) + rowH;
	const text = narrow ? T.small * 1.1 : T.body;
	const cardText = narrow ? T.body * 1.2 : text * 1.2;
	const rowText = (y: number) => y + rowH / 2 + text * 0.36;
	// Desktop cards centre on the book; the phone uses three venue rows with named
	// bid/ask columns. The accepted NBBO position remains fixed below either layout.
	const gap = narrow ? 8 : 12;
	const venueW = (bookW - 2 * gap) / 3;
	// Lines 1.8 apart, so brackets on the ask clear the bid under it.
	const cardGap = cardText * 1.8;
	const cardH = T.small * 1.7 + cardText * 1.6 + cardGap + cardText * 0.9;
	const nbboCardH = narrow ? T.small * 1.7 + text * 1.05 * 4.3 : cardH;
	const venueRowStep = cardText * 1.9;
	const venueH = narrow ? T.small * 2.8 + venueRowStep * 3 : cardH;
	// On the wide frame C's ask line is level with the tape's top row, so C's last trade
	// flies straight across into it.
	const tapeTop = rowText(askY(ASKS.length - 1)) - rowH * 0.6 - T.small * 1.6;
	const venueY = narrow
		? askY(0) - T.small * 0.5
		: tapeTop + T.small * 1.6 + rowH * 0.6 - T.small * 1.7 - cardText * 1.6;

	// On a phone the tape sits under the book, below the NBBO, with tighter rows for four prints.
	const tapeX = narrow ? margin : margin + room * 0.64;
	// On the wide frame the tape's top row is level with the best ask, so a trade flies
	// straight across into it, under nothing and over nothing.
	const tapeY = narrow ? bookBottom + H * 0.075 : tapeTop;
	const tapeStep = narrow ? H * 0.052 : rowStep;
	return {
		...frame,
		rowStep,
		rowH,
		askY,
		bidY,
		spreadY: bookTop + ASKS.length * rowStep + rowStep * 0.12,
		bookW,
		bookBottom,
		priceW,
		barX: margin + priceW + 10,
		barMax: bookW - priceW - 10 - (narrow ? 40 : 56),
		tapeX,
		tapeY,
		tapeW: narrow ? room : room * 0.36,
		// A phone's first print keeps clear of the header's brackets.
		tapeRow: (i: number) =>
			tapeY + T.small * (narrow ? 1.9 : 1.6) + i * tapeStep,
		tapeStep,
		text,
		cardText,
		venueX: (i: number) => (narrow ? margin : margin + i * (venueW + gap)),
		venueValueX: (i: number, side: "ask" | "bid") =>
			narrow
				? margin + bookW * (side === "bid" ? 0.39 : 0.79)
				: margin + i * (venueW + gap) + venueW / 2,
		venueRowStep,
		venueW,
		venueY,
		venueH,
		/** Desktop card lines; on the phone all three cells share their venue row. */
		venueLine: (k: number, i = 0) =>
			narrow
				? venueY + T.small * 2.8 + venueRowStep * (i + 0.5)
				: venueY +
					T.small * 1.7 +
					[0, cardText * 1.6, cardText * 1.6 + cardGap][k],
		/**
		 * The NBBO, under the cards its figures come from: on a phone between the cards and the
		 * tape, 1.3 times the volume.
		 */
		nbboX: margin,
		nbboY: narrow
			? (venueY + nbboCardH + tapeY) / 2 - T.head * 0.6
			: venueY + venueH + T.small * 2.6,
		nbboSize: narrow ? T.head * 1.3 : T.num,
	};
}
const copy = {
	title: ["Quotes, orders and trades", "报价、订单与成交"],
	titleSub: ["three different events", "三种不同的事件"],
	qTag: ["ALFA Oct 18 105 call · 10:30", "ALFA 10月18日 105 看涨 · 10:30"],
	bid: ["bid", "买价"],
	ask: ["ask", "卖价"],
	atAsk: ["at ask", "卖价"],
	last: ["last", "最新"],
	unit: ["quotes per share", "报价：每股"],
	qLine: ["Market buy: one contract. What price?", "市价买 1 张，付多少？"],
	bookHead: ["The book: offers, not trades.", "订单簿：挂单，不是成交。"],
	bookHeadShort: ["The book: offers, not trades.", "订单簿：挂单，不是成交。"],
	mlHead: ["Mid: math. Last: history.", "中间价要算，最新属历史。"],
	mlHeadShort: ["Mid: math. Last: history.", "中间价要算，最新属历史。"],
	buyHead: ["Market buy: $2.15 prints.", "市价买：$2.15 成交。"],
	buyHeadShort: ["Market buy: $2.15 prints.", "市价买：$2.15 成交。"],
	acHead: [
		`Add ${ADDED}, cancel ${ADDED}: no print.`,
		`挂 ${ADDED} 张、撤 ${ADDED} 张：无成交。`,
	],
	takeHead: [`Take ${TAKEN}: a print.`, `吃掉 ${TAKEN} 张：成交。`],
	tape: ["time and sales", "逐笔成交"],
	volume: ["volume", "成交量"],
	mid: ["mid", "中间价"],
	venueHead: ["The book was three venues.", "这本订单簿来自三个场所。"],
	nbboHead: ["Their best: the NBBO.", "最优价合起来：NBBO。"],
	goneHead: [
		`${BEST.ask.venue}'s last ${LEFT} are bought.`,
		`${BEST.ask.venue} 剩下的 ${LEFT} 张被买走。`,
	],
	newAskHead: [
		`Best ask: ${usd(NEXT_ASK.ask.price)}.`,
		`最优卖价：${usd(NEXT_ASK.ask.price)}。`,
	],
	newAskHeadShort: [
		`Best ask ${usd(NEXT_ASK.ask.price)}.`,
		`最优卖价 ${usd(NEXT_ASK.ask.price)}。`,
	],
	venue: ["venue", "场所"],
	nbbo: ["NBBO · bid × ask", "NBBO · 买价 × 卖价"],
	claimBig: [
		"Quotes are offers; only trades print.",
		"报价是挂单；只有成交才留记录。",
	],
	claimSub: ["Buy at ask; sell at bid.", "卖价买入，买价卖出。"],
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
	const { text, cardText } = L;
	const rowText = (y: number) => y + L.rowH / 2 + text * 0.36;
	const spreadAt = L.spreadY + L.rowStep * 0.2;
	const midText = price(MID);
	const midPrefix = `(${usd(BID.price)} + ${usd(ASK.price)}) ÷ 2 = `;
	const midX = margin + (L.bookW - textWidth(midPrefix + midText, text)) / 2;
	const midAt = (prefix: string) => midX + textWidth(prefix, text);
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
					// Prices are levels; the labels and row order identify the sides.
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
					data-tone="neutral"
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
		["pr-gone", `10:32 · ${LEFT} @ ${usd(BEST.ask.price)}`],
	] as const;
	// Only landed prints name the side; compact tickets keep their clear flight lanes.
	const executionLabel = (label: string, conciseSide = false) => (
		<>
			{label}
			<tspan className="wt-film-dim">
				{` ${t(conciseSide ? copy.ask : copy.atAsk)}`}
			</tspan>
		</>
	);
	/** The best ask's row: where a market buy trades. */
	const bestRow = ASKS.length - 1;
	const venueAt = (venue: string) => VENUES.findIndex((v) => v.venue === venue);
	/**
	 * Where each trade sets off, clear of the counts it changes: just right of the book on the
	 * wide frame, on the empty spread line on a phone; C's last 4 use a clear lane beside it.
	 */
	const chipFrom = (name: string) =>
		name === "pr-gone"
			? {
					x: narrow ? margin + L.bookW - 6 : margin + L.bookW + 16,
					// Under C on a phone, beside C on desktop: clear of its dash and the NBBO.
					y: narrow ? L.venueY + L.venueH + text * 1.3 : L.venueLine(1),
					anchor: narrow ? ("end" as const) : ("start" as const),
				}
			: narrow
				? {
						x: margin + L.bookW * 0.56,
						// Clear of the focused ask row above.
						y: spreadAt + 2,
						anchor: "middle" as const,
					}
				: {
						// 12 px clear of the brackets on the row it leaves.
						x: margin + L.bookW + 16,
						y: rowText(L.askY(bestRow)),
						anchor: "start" as const,
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
					y={H * 0.3}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.qTag).toUpperCase()}
				</Word>
				{(
					[
						["q-bid", copy.bid, usd(BID.price), ""],
						["q-ask", copy.ask, usd(ASK.price), ""],
						["q-last", copy.last, usd(oct105CallLast.price), "wt-film-dim"],
					] as const
				).map(([name, tag, num, tone], i) => (
					<g key={name}>
						<Word
							name={`${name}-tag`}
							x={W * (0.2 + i * 0.3)}
							y={H * (narrow ? 0.37 : 0.44)}
							size={T.small}
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`${name}-num`}
							x={W * (0.2 + i * 0.3)}
							y={H * (narrow ? 0.37 : 0.44) + T.num * 1.4}
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
				<Word
					name="q-unit"
					x={W / 2}
					y={H * 0.65}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.unit)}
				</Word>
			</g>

			{/* The book and its tape. */}
			{headline("k-head", copy.bookHead, copy.bookHeadShort)}
			{headline("m-head", copy.mlHead, copy.mlHeadShort)}
			{headline("b-head", copy.buyHead, copy.buyHeadShort)}
			{headline("a-head", copy.acHead, copy.acHead)}
			{/* The take's half of the headline, a line under the add and cancel. */}
			<Lines
				name="a2-head"
				text={t(copy.takeHead)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.acHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			<g data-f="book">
				{ASKS.map((at, i) => level("ask", L.askY(i), at))}
				<path
					d={`M${margin} ${L.spreadY + L.rowStep * 0.2}H${margin + L.bookW}`}
					className="wt-film-link"
				/>
				{BIDS.map((at, i) => level("bid", L.bidY(i), at))}
				<text
					data-f="book-ask-tag"
					x={margin}
					y={L.askY(0) - T.small * 0.9}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.ask).toUpperCase()}
				</text>
				<text
					data-f="book-bid-tag"
					x={margin}
					y={L.bidY(BIDS.length - 1) + L.rowH + T.small * 1.4}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.bid).toUpperCase()}
				</text>
			</g>
			{/* The midpoint, made from the bid and the ask on the spread line between them. */}
			<g data-f="mid">
				<text
					data-f="mid-line"
					y={spreadAt - 4}
					className="wt-film-num wt-halo"
					style={{ fontSize: text }}
				>
					<tspan x={midX}>(</tspan>
					<tspan x={midAt(`(${usd(BID.price)}`)}> + </tspan>
					<tspan x={midAt(`(${usd(BID.price)} + ${usd(ASK.price)}`)}>
						) ÷ 2 ={" "}
					</tspan>
				</text>
				<text
					data-f="mid-label"
					x={midAt(midPrefix)}
					y={spreadAt - 4}
					className="wt-film-num wt-film-accent wt-halo"
					style={{ fontSize: text }}
				>
					{midText}
				</text>
				<text
					data-f="mid-lo"
					x={midAt("(")}
					y={spreadAt - 4}
					className="wt-film-num wt-halo"
					style={{ fontSize: text }}
				>
					{usd(BID.price)}
				</text>
				<text
					data-f="mid-hi"
					x={midAt(`(${usd(BID.price)} + `)}
					y={spreadAt - 4}
					className="wt-film-num wt-halo"
					style={{ fontSize: text }}
				>
					{usd(ASK.price)}
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
				{/* Volume at figure size, with room for two digits: it reaches 13. */}
				<text
					data-f="vol-tag"
					x={L.tapeX + L.tapeW - T.head * 1.6}
					y={L.tapeY + T.small}
					textAnchor="end"
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.volume).toUpperCase()}
				</text>
				{[
					["vol", PRIOR],
					["vol-buy", PRIOR + 1],
					["vol-take", PRIOR + 1 + TAKEN],
					["vol-gone", PRIOR + 1 + TAKEN + LEFT],
				].map(([name, total]) => (
					<text
						key={name}
						data-f={name}
						x={L.tapeX + L.tapeW}
						y={L.tapeY + T.small * 1.1}
						textAnchor="end"
						className="wt-film-num wt-film-accent"
						style={{ fontSize: T.head }}
					>
						{total}
					</text>
				))}
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
			{/* Fitted when a print lands: its settled volume. */}
			<Brackets name="lock-vol" arm={8} />
			{/* Each trade leaves as a chip and lands on its print at the top of the tape. */}
			{prints.map(([name, label]) => {
				const from = chipFrom(name);
				return (
					<text
						key={`carry-${name}`}
						data-f={`carry-${name}`}
						x={from.x}
						y={from.y}
						textAnchor={from.anchor}
						className="wt-film-num wt-film-accent wt-halo"
						style={{ fontSize: name === "pr-gone" ? cardText : text }}
					>
						{label.split(" · ")[1]}
					</text>
				);
			})}
			{/* C's phone ticket clears the NBBO on the right, then crosses above the tape
			    header into its centre gap before descending into the empty row. */}
			<g data-f="vias">
				{narrow && (
					<text
						data-f="via-last"
						x={margin + L.bookW * 0.56}
						y={L.tapeY - text}
						textAnchor="middle"
						className="wt-film-num wt-film-dim"
						style={{ fontSize: text }}
					>
						{usd(oct105CallLast.price)}
					</text>
				)}
				{narrow && (
					<text
						data-f="via-gone-right"
						x={margin + L.bookW - 6}
						y={L.tapeY - text}
						textAnchor="end"
						className="wt-film-num wt-film-accent wt-halo"
						style={{ fontSize: text }}
					>
						{prints[2][1].split(" · ")[1]}
					</text>
				)}
				{(narrow ? prints : []).map(([name, label]) => (
					<text
						key={`via-${name}`}
						data-f={`via-${name}`}
						x={
							name === "pr-gone"
								? margin + L.bookW * 0.63
								: margin + L.bookW * 0.56
						}
						y={
							name === "pr-gone" ? L.tapeY - text : L.tapeRow(0) + L.rowH * 0.6
						}
						textAnchor="middle"
						className="wt-film-num wt-film-accent wt-halo"
						style={{ fontSize: text }}
					>
						{label.split(" · ")[1]}
					</text>
				))}
			</g>
			{prints.map(([name, label]) => (
				<text
					key={name}
					data-f={name}
					x={L.tapeX}
					y={L.tapeRow(0) + L.rowH * 0.6}
					className="wt-film-num wt-film-accent"
					style={{ fontSize: text }}
				>
					{executionLabel(label, name === "pr-gone")}
				</text>
			))}

			{/* The three venues the book was made of, in the book's place. */}
			{headline("v-head", copy.venueHead, copy.venueHead)}
			{/* The NBBO's half, a line under the venues, as the brackets lock. */}
			<Lines
				name="v2-head"
				text={t(copy.nbboHead)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.venueHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			{headline("g-head", copy.goneHead, copy.goneHead)}
			{/* The payoff's second half, a line under the first, only once the ask turns over. */}
			<Lines
				name="g2-head"
				text={t(narrow ? copy.newAskHeadShort : copy.newAskHead)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.goneHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			<g data-f="venues">
				{narrow && (
					<g data-f="venue-headers">
						{(
							[
								["venue", margin + 4, copy.venue],
								["bid", L.venueValueX(0, "bid"), copy.bid],
								["ask", L.venueValueX(0, "ask"), copy.ask],
							] as const
						).map(([key, x, label]) => (
							<text
								key={key}
								x={x}
								y={L.venueY + T.small * 1.2}
								textAnchor={key === "venue" ? "start" : "middle"}
								className="wt-film-tag"
								style={{ fontSize: T.small * 1.15 }}
							>
								{t(label).toUpperCase()}
							</text>
						))}
					</g>
				)}
				{VENUES.map((v, i) => (
					<g key={v.venue} data-f={`venue-${v.venue}`}>
						<rect
							x={L.venueX(i)}
							y={narrow ? L.venueLine(0, i) - cardText * 1.25 : L.venueY}
							width={narrow ? L.bookW : L.venueW}
							height={narrow ? L.venueRowStep * 0.9 : L.venueH}
							rx={12}
							className="wt-panel-shape"
						/>
						<text
							x={narrow ? margin + 8 : L.venueX(i) + L.venueW / 2}
							y={L.venueLine(0, i)}
							textAnchor={narrow ? "start" : "middle"}
							className="wt-film-tag"
							style={{ fontSize: T.small }}
						>
							{narrow
								? v.venue
								: `${v.venue} · ${t(copy.ask)}/${t(copy.bid)}`.toUpperCase()}
						</text>
						{/* Price · quantity; named columns on phone, ask above bid on desktop. */}
						{v.venue === BEST.ask.venue && (
							<text
								data-f="va-gone"
								x={L.venueValueX(i, "ask")}
								y={L.venueLine(1, i)}
								textAnchor="middle"
								className="wt-film-num wt-film-dim"
								style={{ fontSize: cardText }}
							>
								—
							</text>
						)}
						<text
							data-f={`va-${v.venue}`}
							x={L.venueValueX(i, "ask")}
							y={L.venueLine(1, i)}
							textAnchor="middle"
							className="wt-film-num"
							style={{ fontSize: cardText }}
						>
							{`${usd(v.ask.price)} · `}
							<tspan className="wt-film-num">
								{v.venue === BEST.ask.venue ? LEFT : v.ask.size}
							</tspan>
						</text>
						<text
							data-f={`vb-${v.venue}`}
							x={L.venueValueX(i, "bid")}
							y={L.venueLine(2, i)}
							textAnchor="middle"
							className="wt-film-num"
							style={{ fontSize: cardText }}
						>
							{`${usd(v.bid.price)} · `}
							<tspan className="wt-film-num">{v.bid.size}</tspan>
						</text>
					</g>
				))}
				<Brackets name="hero-nbbo" arm={8} glow />
			</g>
			{/* Copies of the best bid and ask, over their figures on B's and C's cards: they fly
			    down into the NBBO before its brackets lock. */}
			<g data-f="nbsrc">
				{(
					[
						["nbsrc-bid", BEST.bid, 2],
						["nbsrc-ask", BEST.ask, 1],
					] as const
				).map(([name, best, line]) => {
					const i = venueAt(best.venue);
					const v = VENUES[i];
					const full =
						line === 1
							? `${usd(v.ask.price)} · ${v.venue === BEST.ask.venue ? LEFT : v.ask.size}`
							: `${usd(v.bid.price)} · ${v.bid.size}`;
					return (
						<text
							key={name}
							data-f={name}
							x={
								L.venueValueX(i, line === 1 ? "ask" : "bid") -
								textWidth(full, cardText) / 2
							}
							y={L.venueLine(line, i)}
							className="wt-film-num"
							style={{ fontSize: cardText }}
						>
							{usd(best.price)}
						</text>
					);
				})}
			</g>
			<g data-f="nbbo">
				<text
					data-f="nbbo-tag"
					x={L.nbboX}
					y={L.nbboY + L.nbboSize * 1.3 + T.small * 2.5}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.nbbo).toUpperCase()}
				</text>
				<text
					data-f="nbbo-bid"
					x={L.nbboX}
					y={L.nbboY + L.nbboSize * 1.3}
					className="wt-film-num"
					style={{ fontSize: L.nbboSize }}
				>
					{`${usd(BEST.bid.price)} ×`}
				</text>
				{(
					[
						["nbbo-ask-1", BEST.ask.price],
						["nbbo-ask-2", NEXT_ASK.ask.price],
					] as const
				).map(([name, ask]) => (
					<text
						key={name}
						data-f={name}
						x={L.nbboX + textWidth(`${usd(BEST.bid.price)} × `, L.nbboSize)}
						y={L.nbboY + L.nbboSize * 1.3}
						className="wt-film-num"
						style={{ fontSize: L.nbboSize }}
					>
						{usd(ask)}
					</text>
				))}
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
	const g = <E extends Element = SVGGraphicsElement>(name: string) =>
		one<E>(name);
	/** A figure lands slightly large and settles, without overshoot: it is data. */
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{
				opacity: 1,
				scale: 1,
				duration: 0.55,
				ease: "power3.out",
				immediateRender: false,
			},
			time,
		);
	const fade = (target: Element | Element[], time: number, to = 0) =>
		tl.to(target, { opacity: to, duration: 0.3 }, time);
	const askKey = `ask-${ASK.price}`;
	const bidKey = `bid-${BID.price}`;
	const hit = g(`hit-${askKey}`);
	const bar = one(`bar-${askKey}`);
	const size = one<SVGTextElement>(`size-${askKey}`);
	// Rebuilds also begin from the model, before any future execution or order tween.
	size.textContent = count(ASK.size);
	const width = (n: number) => (n / MAX) * L.barMax;
	const sizeTo = (to: number, from: number, time: number, duration = 0.5) => {
		const state = { value: from };
		tl.fromTo(
			state,
			{ value: from },
			{
				value: to,
				immediateRender: false,
				duration,
				ease: "power2.out",
				onUpdate: () => {
					const contracts = Math.round(state.value);
					bar.setAttribute("width", String(width(contracts)));
					size.textContent = count(contracts);
				},
			},
			time,
		);
	};
	const lockVol = g("lock-vol");
	/** Static totals hand over with the landed print; opacity sets also reverse on seek. */
	const volumeTo = (next: string, previous: string, time: number) => {
		tl.set(g(previous), { opacity: 0 }, time);
		tl.set(g(next), { opacity: 1 }, time);
		d.lock(lockVol, time, { around: [g("vol-tag"), g(next)], pad: 5 });
		fade(lockVol, time + 1.45);
	};
	// What a phone's trade passes on its way down to the tape: the bids, and the spread line.
	const bidRows = [
		...BIDS.map((at) => one(`lv-bid-${at.price}`)),
		one("book-bid-tag"),
		...flat("book").filter((el) => el.tagName === "path"),
	];
	/**
	 * A trade. The tape makes room first: the older prints step down a row and back in tone.
	 * Then the chip appears clear of the count it changed (or, `instant`, in place of what it
	 * empties), flies to the empty top row and lands on its own text in the new print. On a
	 * phone it drops through the bids, which step back while it passes. Prints never leave.
	 * Returns when it lands.
	 */
	const stack: Element[] = [one("pr-last")];
	const print = (
		name: string,
		time: number,
		instant = false,
		arc: "x" | "y" | undefined = L.narrow ? "y" : undefined,
	) => {
		const older = [...stack];
		tl.to(
			older,
			{ y: `+=${L.tapeStep}`, duration: 0.4, ease: "power2.inOut" },
			time,
		);
		older.forEach((el, k) => {
			tl.set(el, { attr: { class: "wt-film-num wt-film-dim" } }, time + 0.2);
			tl.to(
				el,
				{ opacity: [0.72, 0.5, 0.36][k] ?? 0.3, duration: 0.3 },
				time + 0.2,
			);
		});
		const chip = g(`carry-${name}`);
		// Land on the compact execution text; the whole print, including its side,
		// is revealed by carry only when the copy arrives.
		const match = chip.textContent ?? undefined;
		const born = time + 0.4;
		// Execution is one event: size and bar hand over in place as its ticket is born.
		// The zero-duration fromTo supplies both states so reverse seeking restores them.
		if (name === "pr-buy") {
			sizeTo(ASK.size - 1, ASK.size, born, 0);
			fade(hit, born, 1);
		} else if (name === "pr-take") {
			sizeTo(LEFT, ASK.size - 1, born, 0);
			fade(hit, born, 1);
		}
		const leave = born + (instant ? 0.05 : 0.3);
		tl.fromTo(
			chip,
			{ opacity: 0 },
			{ opacity: 1, duration: instant ? 0.01 : 0.3, immediateRender: false },
			born,
		);
		stack.unshift(one(name));
		if (L.narrow) {
			const via = g(`via-${name}`);
			if (name === "pr-gone") {
				// Down beside the NBBO, left above the volume label, then through the gap
				// between the tape and volume headers. The three legs still total one second.
				const right = g("via-gone-right");
				d.carry(chip, right, leave, { duration: 0.3, arc: "y", reveal: false });
				d.carry(right, via, leave + 0.3, {
					duration: 0.3,
					arc: "x",
					reveal: false,
				});
				d.carry(via, g(name), leave + 0.6, { duration: 0.4, arc: "y", match });
				return leave + 1;
			}
			// Other tickets descend through the book lane, then travel along the row.
			d.carry(chip, via, leave, {
				duration: 0.55,
				reveal: false,
			});
			d.carry(via, g(name), leave + 0.55, { duration: 0.45, arc: "x", match });
			if (name !== "pr-gone") {
				fade(bidRows, born, 0.25);
				fade(bidRows, leave + 0.55, 1);
			}
			return leave + 1.0;
		}
		d.carry(chip, g(name), leave, { duration: 1, arc, match });
		return leave + 1;
	};
	const heads = [
		"k-head",
		"m-head",
		"b-head",
		"a-head",
		"a2-head",
		"v-head",
		"g-head",
		"g2-head",
		"v2-head",
	].map((name) => one(name));
	const levels = [
		...ASKS.map((at) => one(`lv-ask-${at.price}`)),
		...BIDS.map((at) => one(`lv-bid-${at.price}`)),
	];
	const bars = [
		...ASKS.map((at) => `ask-${at.price}`),
		...BIDS.map((at) => `bid-${at.price}`),
	];
	const pxAsk = g(`px-${askKey}`);
	const pxBid = g(`px-${bidKey}`);
	const bestRows = [one(`lv-${askKey}`), one(`lv-${bidKey}`)];
	const bestSizes = [one(`size-${askKey}`), one(`size-${bidKey}`)];
	const otherRows = levels.filter((lv) => !bestRows.includes(lv));
	const last = g("pr-last");
	const cardLines = VENUES.flatMap((v) => [
		one(`va-${v.venue}`),
		one(`vb-${v.venue}`),
	]);
	const venueHeaders = L.narrow ? kids("venue-headers") : [];
	const cardFrames = VENUES.map((v) =>
		[...one(`venue-${v.venue}`).children].filter(
			(el) => !el.getAttribute("data-f"),
		),
	);
	const nbbo = ["nbbo-tag", "nbbo-bid", "nbbo-ask-1"].map((n) => one(n));

	d.hidden([
		...flat("q"),
		...heads,
		...flat("book").filter(
			(el) => !el.getAttribute("data-f")?.startsWith("lv-"),
		),
		...levels,
		pxAsk,
		pxBid,
		...bestSizes,
		...bars.map((key) => one(`hit-${key}`)),
		...kids("mid"),
		...kids("tape"),
		...["pr-buy", "pr-take", "pr-gone"].flatMap((n) => [
			one(n),
			one(`carry-${n}`),
		]),
		...kids("vias"),
		lockVol,
		...cardFrames.flat(),
		...venueHeaders,
		...cardLines,
		g("va-gone"),
		g("hero-nbbo"),
		...kids("nbbo"),
		...kids("nbsrc"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: three numbers on a screen ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.4);
	(["q-bid", "q-ask", "q-last"] as const).forEach((name, i) => {
		show(one(`${name}-tag`), 4.6 + i * 0.3);
		word(one(`${name}-num`), 4.7 + i * 0.3);
	});
	show(one("q-line"), 5.2);
	show(one("q-unit"), 5.2);

	// ——— quote: establish the scaffold, then carry the three numbers into it ———
	tl.addLabel("quote", 8.9);
	hide(
		[
			one("q-tag"),
			one("q-line"),
			one("q-unit"),
			...(["q-bid", "q-ask", "q-last"] as const).map((n) => one(`${n}-tag`)),
		],
		8.9,
	);
	// Let the question clear before the fixed book/tape scaffold fades in. It settles
	// at 9.55, a full second before any carried price moves. Bars enter at their real
	// widths with their rows; there is no decorative growth or independent size count.
	const scaffold = [
		...flat("book").filter(
			(el) => !el.getAttribute("data-f")?.startsWith("lv-"),
		),
		...kids("tape").filter(
			(el) => el !== last && !el.getAttribute("data-f")?.startsWith("vol"),
		),
		one("vol-tag"),
	];
	tl.fromTo(
		scaffold,
		{ opacity: 0 },
		{
			opacity: (_: number, el: Element) =>
				!L.narrow && el.tagName === "path" ? 0.25 : 1,
			duration: 0.3,
			immediateRender: false,
		},
		9.25,
	);
	// The phone question's prices sit above the divider; on desktop it starts dim
	// behind the waiting prices. Step the phone rule back too while
	// the bid crosses it, then restore it within the original construction window.
	const divider = flat("book").filter((el) => el.tagName === "path");
	fade(divider, 10.55, 0.25);
	fade(divider, 11.45, 1);
	// The two book prices diverge vertically; last stays in the separate tape lane.
	d.carry(g("q-bid-num"), pxBid, 10.55, { duration: 0.7 });
	d.carry(g("q-ask-num"), pxAsk, 10.75, { duration: 0.7 });
	if (L.narrow) {
		// Descend out of the ask's horizontal flight lane before moving left toward
		// the header gap, then descend through it. The landing stays at 11.75.
		d.carry(g("q-last-num"), g("via-last"), 10.75, {
			duration: 0.6,
			arc: "y",
			reveal: false,
		});
		d.carry(g("via-last"), last, 11.35, { duration: 0.4, arc: "y" });
	} else {
		d.carry(g("q-last-num"), last, 10.75);
	}
	tl.set(bestRows[1], { opacity: 1 }, 11.25);
	tl.set(bestRows[0], { opacity: 1 }, 11.45);
	otherRows.forEach((lv, i) => {
		tl.fromTo(
			lv,
			{ opacity: 0 },
			{ opacity: 1, duration: 0.4, immediateRender: false },
			11.2 + i * 0.05,
		);
	});
	tl.fromTo(
		one(`size-${bidKey}`),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.4, immediateRender: false },
		11.35,
	);
	// Its row becomes visible at 11.45: start the size's fade then, so the parent
	// cannot expose an already-fading child in one frame. Settlement stays at 11.75.
	tl.fromTo(
		size,
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3, immediateRender: false },
		11.45,
	);
	show(one("vol"), 11.25);
	// Restore the authored widths on rebuild as well as during reverse seeking.
	bars.forEach((key, i) => {
		one(`bar-${key}`).setAttribute(
			"width",
			String(width([...ASKS, ...BIDS][i].size)),
		);
	});
	show(heads[0], 10.7);
	// Mid is arithmetic on two prices: the sizes step back, copies of the bid and the ask
	// lift off into a static averaging expression, then its settled result appears. The
	// timestamped print remains on the tape as history, without a competing flourish.
	d.swap(heads[0], heads[1], 14.35);
	const sizes = [
		...bars.map((key) => one(`bar-${key}`)),
		...bars.map((key) => one(`size-${key}`)),
		...flat("book").filter((el) => el.tagName === "path"),
	];
	fade(sizes, 14.55, 0.3);
	fade(sizes, 18.3, 1);
	d.carry(pxBid, g("mid-lo"), 14.85, { duration: 1, keep: true, fit: false });
	d.carry(pxAsk, g("mid-hi"), 14.85, { duration: 1, keep: true, fit: false });
	tl.fromTo(
		one("mid-line"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5, immediateRender: false },
		15.85,
	);
	word(one("mid-label"), 15.95);
	// The tape makes room, then execution updates the ask as its ticket appears and lands.
	d.swap(heads[1], heads[2], 18.3);
	hide(kids("mid"), 18.3);
	volumeTo("vol-buy", "vol", print("pr-buy", 19.05));

	// ——— orders: adds and cancels move size, not the tape; a take prints ———
	tl.addLabel("orders", 22.2);
	d.swap(heads[2], heads[3], 22.2);
	fade(hit, 22.2, 0.45);
	// The headline settles first; reversible hand-overs set bar and size together.
	sizeTo(ASK.size - 1 + ADDED, ASK.size - 1, 23.05, 0);
	// Each changed size stands for at least a full second; the tape stays unchanged.
	sizeTo(ASK.size - 1, ASK.size - 1 + ADDED, 24.05, 0);
	// Only now the take, and its half of the headline.
	show(heads[4], 25.2);
	volumeTo("vol-take", "vol-buy", print("pr-take", 25.6));

	// ——— venues: one construction, from the venue cards to the completed NBBO. ———
	tl.addLabel("venues", 28.75);
	hide(heads[3], 28.75, 0.35, L.narrow ? 0 : 12);
	d.swap(heads[4], heads[5], 28.75);
	// The six book-to-card flights are replaced by an in-place scene handover. Only the
	// two best prices travel, so the completed take keeps its quiet time.
	fade(
		[
			hit,
			...levels,
			...flat("book").filter(
				(el) => !el.getAttribute("data-f")?.startsWith("lv-"),
			),
		],
		28.75,
	);
	tl.to(
		venueHeaders,
		{ opacity: 1, duration: 0.3, immediateRender: false },
		29.05,
	);
	VENUES.forEach((v, i) => {
		tl.to(
			[...cardFrames[i], one(`va-${v.venue}`), one(`vb-${v.venue}`)],
			{
				opacity: 1,
				duration: 0.3,
				immediateRender: false,
			},
			29.05,
		);
	});
	// Cards settle at 29.35 and stand for one second before their best prices combine.
	d.carry(g("nbsrc-bid"), nbbo[1] as SVGGraphicsElement, 30.35, {
		duration: 0.9,
		arc: "y",
		match: usd(BEST.bid.price),
	});
	d.carry(g("nbsrc-ask"), nbbo[2] as SVGGraphicsElement, 30.5, {
		duration: 0.9,
		arc: "y",
	});
	// The venue values stay readable while the best prices travel; after the hero locks,
	// only the winning bid and ask keep full contrast.
	const otherVenueValues = cardLines.filter(
		(el) =>
			el !== g(`vb-${BEST.bid.venue}`) && el !== g(`va-${BEST.ask.venue}`),
	);
	fade(otherVenueValues, 30.35, 0.7);
	fade(otherVenueValues, 31.5, 0.3);
	show(nbbo[0], 31.4);
	show(heads[8], 31.5);
	d.lock(g("hero-nbbo"), 31.5, { around: nbbo.slice(1), pad: 5 });
	tl.addLabel("hero-lock", 31.5);

	// ——— gone: the venue and NBBO change as one state; the tape records it later. ———
	tl.addLabel("gone", 35.1);
	d.swap([heads[5], heads[8]], heads[6], 35.1);
	const born = L.narrow ? 35.05 : 35.45;
	// The glow has stood 2.35 s after settlement and clears before the ticket's path.
	fade(g("hero-nbbo"), 34.3);
	// A's unchanged $2.20 offer becomes the clear source of the replacement NBBO ask.
	fade(g(`va-${NEXT_ASK.venue}`), 34.3, 1);
	fade(
		cardLines.filter(
			(el) =>
				el !== g(`va-${NEXT_ASK.venue}`) && el !== g(`va-${BEST.ask.venue}`),
		),
		born - 0.3,
		0.3,
	);
	d.flip(g(`va-${BEST.ask.venue}`), g("va-gone"), born - 0.3);
	d.flip(nbbo[2], one("nbbo-ask-2"), born - 0.3);
	tl.set([g(`va-${BEST.ask.venue}`), nbbo[2]], { opacity: 0 }, born);
	const landed = print("pr-gone", born - 0.4, false, "y");
	volumeTo("vol-gone", "vol-take", landed);
	show(heads[7], Math.max(born + 0.35, 35.45));

	// ——— claim ———
	tl.addLabel("claim", 40.55);
	hide(
		[
			heads[6],
			heads[7],
			...kids("venues"),
			...kids("nbbo"),
			...kids("tape"),
			...stack,
			lockVol,
		],
		40.55,
	);
	word(one("z-big"), 40.85);
	show(one("z-sub"), 41.15);

	// ——— next ———
	tl.addLabel("next", 45.0);
	hide(kids("claim"), 45.0);
	d.close(45.0);
	return tl;
}

export const quotesOrdersTradesFilm: Film = {
	id: "quotes-orders-trades",
	label: [
		`Quotes, orders and trades, as a short film: the Oct 18 105 call at bid ${usd(BID.price)}, ask ${usd(ASK.price)} and last ${usd(oct105CallLast.price)}, and what a market buy pays; the book's offers, a ${price(MID)} midpoint nobody traded at, a last price that is history, and the buy that takes the ${usd(ASK.price)} ask and prints; an order added and cancelled with nothing on the tape, then ${TAKEN} contracts taken and printed; and the three venues behind the book, whose best bid and ask form the NBBO, ${usd(BEST.bid.price)} by ${usd(BEST.ask.price)}, until ${BEST.ask.venue}'s last ${LEFT} trade and print on the same tape, taking the volume to ${PRIOR + 1 + TAKEN + LEFT}`,
		`报价、订单与成交短片：10月18日 105 看涨买价 ${usd(BID.price)}、卖价 ${usd(ASK.price)}、最新成交 ${usd(oct105CallLast.price)}，市价买入要付多少；订单簿上的挂单、没人成交过的中间价 ${price(MID)}、属于历史的最新成交价，以及吃掉 ${usd(ASK.price)} 卖单并留下记录的买单；加挂再撤单都不留成交记录，然后 ${TAKEN} 张被吃掉并成交；以及订单簿背后的三个场所，最优买卖价组成 NBBO：${usd(BEST.bid.price)} × ${usd(BEST.ask.price)}，直到 ${BEST.ask.venue} 剩下的 ${LEFT} 张成交，记在同一条逐笔成交上，成交量到 ${PRIOR + 1 + TAKEN + LEFT}`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Quotes and trades", "报价与成交"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "quote", label: ["A quote", "报价"] },
		{ id: "orders", label: ["Orders", "订单"] },
		{ id: "venues", label: ["Venues", "场所"] },
		{ id: "gone", label: ["The last 4", "最后 4 张"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
