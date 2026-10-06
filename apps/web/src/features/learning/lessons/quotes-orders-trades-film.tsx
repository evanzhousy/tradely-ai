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
 * Then the hero: the book splits into the three venues it was made of, each level flying
 * to its venue, and brackets lock on their best bid and ask: the NBBO, $2.05 by $2.15.
 * Then a buyer takes C's last 4, one step at a time: the print lands, the volume counts to
 * 13, the NBBO's ask turns over to $2.20 as the headline says so, and brackets find the
 * new best ask.
 *
 *   open      0–4        "Quotes, orders and trades"
 *   question  4–8.9      bid $2.05 · ask $2.15 · last $2.00: a market buy pays?
 *   quote     8.9–22.4   the numbers fly into the book; mid and last; buy 1 at $2.15
 *   orders    22.4–28.2  add 5 and cancel 5, no print; take 3, a print; volume 5 → 6 → 9
 *   venues    28.2–33.2  hero: the book splits into A, B, C; NBBO $2.05 × $2.15
 *   gone      33.2–39.3  C's last 4 print: volume 13; best ask $2.20
 *   claim     39.3–43.8  a quote is an offer; only a trade prints
 *   next      43.8–46.3  Next: counterparties
 */

const END = 46.3;
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
	const bookW = narrow ? room : room * 0.56;
	const priceW = narrow ? 52 : width * 0.08;
	const askY = (i: number) => bookTop + i * rowStep;
	const bidY = (i: number) =>
		bookTop + (ASKS.length + i) * rowStep + rowStep * 0.5;
	const bookBottom = bidY(BIDS.length - 1) + rowH;
	const text = narrow ? T.small * 1.1 : T.body;
	const cardText = narrow ? text * 1.05 : text * 1.2;
	const rowText = (y: number) => y + rowH / 2 + text * 0.36;
	// The venue cards hold three lines, the venue, its ask and its bid, centred on the book's
	// middle on the wide frame; on a phone they sit at the book's top, leaving room for the
	// NBBO between them and the tape.
	const gap = narrow ? 8 : 12;
	const venueW = (bookW - 2 * gap) / 3;
	// Lines 1.8 apart, so brackets on the ask clear the bid under it.
	const cardGap = cardText * 1.8;
	const venueH = T.small * 1.7 + cardText * 1.6 + cardGap + cardText * 0.9;
	// On the wide frame C's ask line is level with the tape's top row, so C's last trade
	// flies straight across into it.
	const tapeTop = rowText(askY(ASKS.length - 1)) - rowH * 0.6 - T.small * 1.6;
	const venueY = narrow
		? askY(0) - T.small * 0.5
		: tapeTop + T.small * 1.6 + rowH * 0.6 - T.small * 1.7 - cardText * 1.6;

	// On a phone the tape sits under the book, below the NBBO, with tighter rows for four prints.
	const tapeX = narrow ? margin : margin + room * 0.62;
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
		tapeW: narrow ? room : room * 0.38,
		// A phone's first print keeps clear of the header's brackets.
		tapeRow: (i: number) =>
			tapeY + T.small * (narrow ? 1.9 : 1.6) + i * tapeStep,
		tapeStep,
		text,
		cardText,
		venueX: (i: number) => margin + i * (venueW + gap),
		venueW,
		venueY,
		venueH,
		/** A card's lines: its name, its ask, its bid. */
		venueLine: (k: number) =>
			venueY + T.small * 1.7 + [0, cardText * 1.6, cardText * 1.6 + cardGap][k],
		/**
		 * The NBBO: under the tape on the wide frame; on a phone between the cards and the tape,
		 * where it is the payoff's figure, 1.3 times the volume's.
		 */
		nbboX: narrow ? margin : tapeX,
		nbboY: narrow
			? (venueY + venueH + tapeY) / 2 - T.head * 0.6
			: tapeY + T.small * 1.6 + 3 * rowStep + rowStep * 1.45,
		nbboSize: narrow ? T.head * 1.3 : T.num,
	};
}
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
	bookHead: ["The book: offers, not trades.", "订单簿：挂单，不是成交。"],
	bookHeadShort: ["The book: offers, not trades.", "订单簿：挂单，不是成交。"],
	mlHead: [
		`Mid ${price(MID)} is math; last $2.00 is history.`,
		`中间价 ${price(MID)} 是算的；最新价 $2.00 是历史。`,
	],
	mlHeadShort: ["Mid: math. Last: history.", "中间价是算的，最新价是历史。"],
	buyHead: [
		"A market buy takes $2.15: a print.",
		"市价买单吃掉 $2.15 的卖单：成交。",
	],
	buyHeadShort: ["Market buy at $2.15: a print.", "市价买入，按 $2.15 成交。"],
	acHead: [
		`Add ${ADDED}, cancel ${ADDED}: no print.`,
		`挂 ${ADDED} 张、撤 ${ADDED} 张：无成交。`,
	],
	takeHead: [`Take ${TAKEN}: a print.`, `吃掉 ${TAKEN} 张：成交。`],
	tape: ["time and sales", "逐笔成交"],
	volume: ["volume", "成交量"],
	mid: ["mid", "中间价"],
	venueHead: [
		"Three venues; their best is the NBBO.",
		"三个场所，最优价合起来就是 NBBO。",
	],
	venueHeadShort: [
		"Three venues; best of all: NBBO.",
		"三个场所，最优价即 NBBO。",
	],
	goneHead: [
		`${BEST.ask.venue}'s last ${LEFT} are bought.`,
		`${BEST.ask.venue} 剩下的 ${LEFT} 张被买走。`,
	],
	newAskHead: [
		`Best ask: ${usd(NEXT_ASK.ask.price)}.`,
		`最优卖价：${usd(NEXT_ASK.ask.price)}。`,
	],
	newAskHeadShort: [
		`Ask: ${usd(NEXT_ASK.ask.price)}.`,
		`卖价：${usd(NEXT_ASK.ask.price)}。`,
	],
	venue: ["venue", "场所"],
	nbbo: ["NBBO · bid × ask", "NBBO · 买价 × 卖价"],
	claimBig: [
		"A quote is an offer; only a trade prints.",
		"报价只是挂单；只有成交才会留下记录。",
	],
	claimSub: ["Buy at the ask, sell at the bid.", "按卖价买，按买价卖。"],
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
	const midX = L.barX + L.barMax / 2;
	const midText = `${t(copy.mid)} ${price(MID)}`;
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
					// Asks red, bids green, as on the question's screen and on the venue cards.
					className={`wt-film-num ${side === "ask" ? "wt-film-loss" : "wt-film-gain"}`}
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
		["pr-gone", `10:32 · ${LEFT} @ ${usd(BEST.ask.price)}`],
	] as const;
	/** The best ask's row: where a market buy trades. */
	const bestRow = ASKS.length - 1;
	const venueAt = (venue: string) => VENUES.findIndex((v) => v.venue === venue);
	/**
	 * Where each trade sets off, clear of the counts it changes: just right of the book on the
	 * wide frame, on the empty spread line on a phone; C's last 4 take its ask line's place.
	 */
	const chipFrom = (name: string) =>
		name === "pr-gone"
			? {
					x: L.venueX(venueAt(BEST.ask.venue)) + L.venueW / 2,
					// On a phone the tape is below: leave from under the card, clear of the NBBO.
					y: narrow ? L.venueY + L.venueH + text * 1.3 : L.venueLine(1),
					anchor: "middle" as const,
				}
			: narrow
				? {
						x: margin + L.bookW * 0.56,
						// Clear of the focused ask row above.
						y: spreadAt + 2,
						anchor: "middle" as const,
					}
				: {
						x: margin + L.bookW + 8,
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
				<path
					data-f="mid-line"
					d={`M${L.barX} ${spreadAt}H${L.barX + L.barMax}`}
					className="wt-film-riser"
				/>
				<text
					data-f="mid-label"
					x={midX}
					y={spreadAt - 4}
					textAnchor="middle"
					className="wt-film-num wt-film-accent wt-halo"
					style={{ fontSize: text }}
				>
					{midText}
				</text>
				<text
					data-f="mid-lo"
					x={midX - textWidth(midText, text) / 2 - text * 1.2}
					y={spreadAt - 4}
					textAnchor="end"
					className="wt-film-num wt-film-gain wt-halo"
					style={{ fontSize: text }}
				>
					{usd(BID.price)}
				</text>
				<text
					data-f="mid-hi"
					x={midX + textWidth(midText, text) / 2 + text * 1.2}
					y={spreadAt - 4}
					className="wt-film-num wt-film-loss wt-halo"
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
				<text
					data-f="vol"
					x={L.tapeX + L.tapeW}
					y={L.tapeY + T.small * 1.1}
					textAnchor="end"
					className="wt-film-num wt-film-accent"
					style={{ fontSize: T.head }}
				>
					{PRIOR}
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
			{/* Adds and cancels, named beside the size they change; a phone has no room there. */}
			<g data-f="tags">
				{(narrow
					? []
					: ([
							["tag-add", `+${ADDED}`],
							["tag-cancel", `−${ADDED}`],
						] as const)
				).map(([name, label]) => (
					<text
						key={name}
						data-f={name}
						x={margin + L.bookW + 8}
						y={rowText(L.askY(ASKS.length - 1))}
						className="wt-film-num"
						style={{ fontSize: text }}
					>
						{label}
					</text>
				))}
			</g>
			{/* Fitted when they lock: the level a trade takes, the last print, the volume. */}
			<Brackets name="lock-ask" />
			<Brackets name="lock-last" />
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
			{/* On a phone a chip goes down a clear lane in the middle to the tape's empty top row,
			    stops here, and only then slides in under the header. */}
			<g data-f="vias">
				{(narrow ? prints : []).map(([name, label]) => (
					<text
						key={`via-${name}`}
						data-f={`via-${name}`}
						x={margin + L.bookW * 0.56}
						y={L.tapeRow(0) + L.rowH * 0.6}
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
					{label}
				</text>
			))}

			{/* The three venues the book was made of, in the book's place. */}
			{headline("v-head", copy.venueHead, copy.venueHeadShort)}
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
							y={L.venueLine(0)}
							textAnchor="middle"
							className="wt-film-tag"
							style={{ fontSize: T.small }}
						>
							{`${t(copy.venue).toUpperCase()} ${v.venue}`}
						</text>
						{/* Price · size, the ask in red above the bid in green, as in the book. */}
						{v.venue === BEST.ask.venue && (
							<text
								data-f="va-gone"
								x={L.venueX(i) + L.venueW / 2}
								y={L.venueLine(1)}
								textAnchor="middle"
								className="wt-film-num wt-film-dim"
								style={{ fontSize: cardText }}
							>
								—
							</text>
						)}
						<text
							data-f={`va-${v.venue}`}
							x={L.venueX(i) + L.venueW / 2}
							y={L.venueLine(1)}
							textAnchor="middle"
							className="wt-film-num wt-film-loss"
							style={{ fontSize: cardText }}
						>
							{`${usd(v.ask.price)} · `}
							<tspan className="wt-film-num">
								{v.venue === BEST.ask.venue ? LEFT : v.ask.size}
							</tspan>
						</text>
						<text
							data-f={`vb-${v.venue}`}
							x={L.venueX(i) + L.venueW / 2}
							y={L.venueLine(2)}
							textAnchor="middle"
							className="wt-film-num wt-film-gain"
							style={{ fontSize: cardText }}
						>
							{`${usd(v.bid.price)} · `}
							<tspan className="wt-film-num">{v.bid.size}</tspan>
						</text>
					</g>
				))}
				<Brackets name="best-bid" tone="gain" arm={8} />
				<Brackets name="best-ask" tone="loss" arm={8} />
				<Brackets name="next-ask" tone="loss" arm={8} />
			</g>
			<g data-f="nbbo">
				<text
					data-f="nbbo-tag"
					x={L.nbboX}
					y={L.nbboY}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.nbbo).toUpperCase()}
				</text>
				<text
					data-f="nbbo-bid"
					x={L.nbboX}
					y={L.nbboY + L.nbboSize * 1.3}
					className="wt-film-num wt-film-gain"
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
						className="wt-film-num wt-film-loss"
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
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const fade = (target: Element | Element[], time: number, to = 0) =>
		tl.to(target, { opacity: to, duration: 0.3 }, time);
	const askKey = `ask-${ASK.price}`;
	const bidKey = `bid-${BID.price}`;
	const hit = g(`hit-${askKey}`);
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
	const vol = one<SVGTextElement>("vol");
	const lockVol = g("lock-vol");
	/** Volume counts up as a print lands, and brackets lock on it. */
	const volumeTo = (to: number, from: number, time: number) => {
		d.count(vol, to, time, (v) => String(Math.round(v)), from, 0.4);
		d.lock(lockVol, time, { around: [g("vol-tag"), vol], pad: 5 });
		fade(lockVol, time + 1.4);
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
		const born = time + 0.4;
		const leave = born + (instant ? 0.05 : 0.15);
		tl.fromTo(
			chip,
			{ opacity: 0 },
			{ opacity: 1, duration: instant ? 0.01 : 0.15 },
			born,
		);
		stack.unshift(one(name));
		if (L.narrow) {
			// Down the lane (C's ticket first moves across to it), then along the row.
			const via = g(`via-${name}`);
			d.carry(chip, via, leave, {
				duration: 0.55,
				arc: name === "pr-gone" ? "x" : undefined,
				reveal: false,
			});
			d.carry(via, g(name), leave + 0.55, { duration: 0.6, arc: "x" });
			if (name !== "pr-gone") {
				fade(bidRows, born, 0.25);
				fade(bidRows, leave + 0.55, 1);
			}
			return leave + 1.15;
		}
		d.carry(chip, g(name), leave, { duration: 1, arc });
		return leave + 1;
	};
	const lockAsk = g("lock-ask");
	const heads = [
		"k-head",
		"m-head",
		"b-head",
		"a-head",
		"a2-head",
		"v-head",
		"g-head",
		"g2-head",
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
		...kids("tags"),
		...kids("vias"),
		lockAsk,
		g("lock-last"),
		lockVol,
		...cardFrames.flat(),
		...cardLines,
		g("va-gone"),
		g("best-bid"),
		g("best-ask"),
		g("next-ask"),
		...kids("nbbo"),
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

	// ——— quote: the three numbers fly to their places, and the book forms after them ———
	tl.addLabel("quote", 8.9);
	hide(
		[
			one("q-tag"),
			one("q-line"),
			...(["q-bid", "q-ask", "q-last"] as const).map((n) => one(`${n}-tag`)),
		],
		8.9,
	);
	// The bid first, then the ask, so their paths never cross; the last goes to the tape.
	d.carry(g("q-bid-num"), pxBid, 9.1);
	d.carry(g("q-ask-num"), pxAsk, 9.5);
	d.carry(g("q-last-num"), last, 9.8);
	// The best rows appear under their numbers as they land; the others, once all have.
	tl.set(bestRows[1], { opacity: 1 }, 10.0);
	tl.set(bestRows[0], { opacity: 1 }, 10.4);
	show(
		kids("tape").filter((el) => el !== last),
		10.6,
	);
	otherRows.forEach((lv, i) => {
		tl.fromTo(
			lv,
			{ opacity: 0 },
			{ opacity: 1, duration: 0.4 },
			10.8 + i * 0.05,
		);
	});
	tl.fromTo(bestSizes, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 10.8);
	bars.forEach((key, i) => {
		const at = [...ASKS, ...BIDS][i];
		tl.fromTo(
			one(`bar-${key}`),
			{ attr: { width: 0 } },
			{ attr: { width: width(at.size) }, duration: 0.5, ease: "power2.out" },
			11.0 + i * 0.05,
		);
	});
	show(
		flat("book").filter((el) => !el.getAttribute("data-f")?.startsWith("lv-")),
		11.0,
	);
	show(heads[0], 10.7);
	// Mid is arithmetic on two prices: the sizes step back, copies of the bid and the ask
	// lift off and land on the spread line, and the midpoint appears between them. The last
	// is history: brackets on it.
	d.swap(heads[0], heads[1], 14.4);
	const sizes = [
		...bars.map((key) => one(`bar-${key}`)),
		...bars.map((key) => one(`size-${key}`)),
		...flat("book").filter((el) => el.tagName === "path"),
	];
	fade(sizes, 14.6, 0.3);
	fade(sizes, 18.4, 1);
	d.carry(pxBid, g("mid-lo"), 14.9, { duration: 1, keep: true, fit: false });
	d.carry(pxAsk, g("mid-hi"), 14.9, { duration: 1, keep: true, fit: false });
	show(one("mid-line"), 15.9);
	word(one("mid-label"), 16.0);
	d.lock(g("lock-last"), 16.5, { around: last, pad: 5 });
	// A market buy takes the ask; the count drops, the tape makes room, the ticket lands.
	d.swap(heads[1], heads[2], 18.4);
	hide(kids("mid"), 18.4);
	fade(g("lock-last"), 18.4);
	fade(hit, 18.8, 1);
	d.lock(lockAsk, 18.8, { around: hit, pad: 4 });
	sizeTo(ASK.size - 1, ASK.size, 18.8);
	volumeTo(PRIOR + 1, PRIOR, print("pr-buy", 19.2) + 0.3);

	// ——— orders: adds and cancels move size, not the tape; a take prints ———
	tl.addLabel("orders", 22.4);
	d.swap(heads[2], heads[3], 22.4);
	fade([hit, lockAsk], 22.4);
	sizeTo(ASK.size - 1 + ADDED, ASK.size - 1, 22.9);
	if (!L.narrow) {
		word(one("tag-add"), 22.9);
		hide(one("tag-add"), 23.65);
	}
	sizeTo(ASK.size - 1, ASK.size - 1 + ADDED, 23.75);
	if (!L.narrow) {
		word(one("tag-cancel"), 23.75);
		hide(one("tag-cancel"), 24.45);
	}
	// Only now the take, and its half of the headline.
	show(heads[4], 24.6);
	fade(hit, 24.6, 1);
	d.lock(lockAsk, 24.6, { around: hit, pad: 4 });
	sizeTo(LEFT, ASK.size - 1, 24.6);
	volumeTo(PRIOR + 1 + TAKEN, PRIOR + 1, print("pr-take", 25.0) + 0.3);

	// ——— venues: the hero. The book splits into the three venues it was made of, and
	// their best bid and ask lock: the NBBO. ———
	tl.addLabel("venues", 28.2);
	hide(heads[3], 28.2, 0.35, L.narrow ? 0 : 12);
	d.swap(heads[4], heads[5], 28.2);
	fade(
		[
			hit,
			lockAsk,
			...flat("book").filter(
				(el) => !el.getAttribute("data-f")?.startsWith("lv-"),
			),
		],
		28.2,
	);
	tl.to(
		bars.map((key) => one(`bar-${key}`)),
		{ attr: { width: 0 }, opacity: 0, duration: 0.4, ease: "power2.in" },
		28.3,
	);
	VENUES.forEach((v, i) => {
		const at = 28.6 + i * 0.15;
		const ask = `ask-${v.ask.price}`;
		const bid = `bid-${v.bid.price}`;
		const askSize = v.venue === BEST.ask.venue ? LEFT : v.ask.size;
		const sideways = { duration: 1, arc: "x" as const };
		d.carry(g(`px-${ask}`), g(`va-${v.venue}`), at, sideways);
		// Sizes leave a beat after the prices, so a price going right and a size going left
		// never pass each other.
		d.carry(g(`size-${ask}`), g(`va-${v.venue}`), at + 0.25, {
			...sideways,
			match: String(askSize),
			last: true,
			reveal: false,
		});
		d.carry(g(`px-${bid}`), g(`vb-${v.venue}`), at + 0.05, sideways);
		d.carry(g(`size-${bid}`), g(`vb-${v.venue}`), at + 0.3, {
			...sideways,
			match: String(v.bid.size),
			last: true,
			reveal: false,
		});
		// The card draws round its numbers as they arrive.
		tl.to(cardFrames[i], { opacity: 1, duration: 0.4 }, at + 0.7);
	});
	tl.set(levels, { opacity: 0 }, 30.3);
	d.lock(g("best-bid"), 30.4, { around: g(`vb-${BEST.bid.venue}`), pad: 5 });
	d.lock(g("best-ask"), 30.6, { around: g(`va-${BEST.ask.venue}`), pad: 5 });
	tl.addLabel("hero-lock", 30.6);
	show(nbbo[0], 30.8);
	word(nbbo[1], 30.9);
	word(nbbo[2], 30.9);

	// ——— gone: C's last 4 are bought, one step at a time: the ticket leaves C's ask and
	// prints; the volume counts; then only the NBBO's ask turns over, with the headline's
	// second half; then brackets find the new best ask. ———
	tl.addLabel("gone", 33.2);
	d.swap(heads[5], heads[6], 33.2);
	// A phone's ticket takes two legs: it sets off 0.4 s sooner to land at the same time.
	const born = L.narrow ? 33.6 : 34.0;
	fade(g("best-ask"), born - 0.1);
	const landed = print("pr-gone", born - 0.4, !L.narrow, "y");
	if (!L.narrow) tl.set(g(`va-${BEST.ask.venue}`), { opacity: 0 }, born);
	else {
		fade(g(`va-${BEST.ask.venue}`), born, 0);
		// The ticket goes down past the NBBO: it steps back while it passes.
		fade(kids("nbbo"), born + 0.15, 0.25);
		fade(kids("nbbo"), landed - 0.6, 1);
	}
	fade(g("va-gone"), born + 0.4, 1);
	volumeTo(PRIOR + 1 + TAKEN + LEFT, PRIOR + 1 + TAKEN, landed + 0.3);
	d.flip(nbbo[2], one("nbbo-ask-2"), landed + 0.7);
	show(heads[7], landed + 0.7);
	d.lock(g("next-ask"), landed + 1.1, {
		around: g(`va-${NEXT_ASK.venue}`),
		pad: 5,
	});

	// ——— claim ———
	tl.addLabel("claim", 39.3);
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
		39.3,
	);
	word(one("z-big"), 39.6);
	show(one("z-sub"), 39.9);

	// ——— next ———
	tl.addLabel("next", 43.8);
	hide(kids("claim"), 43.8);
	d.close(43.8);
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
