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
 * $2.05, ask $2.15, last $2.00, and asks what a market buy pays. The three numbers fly to
 * their places: the bid and the ask into the book, the last onto the tape as history. The
 * midpoint is arithmetic; a market buy takes the $2.15 ask, and only then does a trade
 * print. Adds and cancels move the size with nothing on the tape; a take of 3 prints.
 * Every print stays on the tape, and the size carries from shot to shot: 8, 7, 12, 7, 4.
 * Then the hero: the book splits into the three venues it was made of, each level flying
 * to its venue. Their best bid and ask are the NBBO, $2.05 by $2.15, until a buyer takes
 * C's last 4, which print on the same tape: volume 13.
 *
 *   open      0–4        "Quotes, orders and trades"
 *   question  4–9.5      bid $2.05 · ask $2.15 · last $2.00: a market buy pays?
 *   quote     9.5–23.6   the numbers fly into the book; mid and last; buy 1 at $2.15
 *   orders    23.6–31.6  add 5 and cancel: no print; take 3, a print; volume 5 → 6 → 9
 *   venues    31.6–43.6  the book splits into A, B, C; NBBO; C's last 4 print: 13
 *   claim     43.6–47.6  a quote is an offer; only a trade prints
 *   next      47.6–50.1  Next: counterparties
 */

const END = 50.1;
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
	// The venue cards take the book's place: the book was these three venues.
	const gap = narrow ? 8 : 12;
	const venueW = (bookW - 2 * gap) / 3;
	const venueY = bookTop;
	const venueH = H * (narrow ? 0.3 : 0.36);
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
		venueX: (i: number) => margin + i * (venueW + gap),
		venueW,
		venueY,
		venueH,
		/** A card's lines: its name, its ask, its bid (asks above bids, as in the book). */
		venueLine: (k: number) => venueY + venueH * [0.2, 0.52, 0.8][k],
		/** The NBBO under the cards, centred on them. */
		nbboX: margin + bookW / 2,
		nbboY: venueY + venueH + H * (narrow ? 0.07 : 0.08),
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
		"Adds and cancels move size, not the tape.",
		"加挂、撤单只改数量，不留成交。",
	],
	acHeadShort: ["Add, cancel: no print.", "加挂、撤单：无成交。"],
	takeHead: [
		`A buyer takes ${TAKEN}: a print, volume +${TAKEN}.`,
		`买方吃掉 ${TAKEN} 张：一笔成交，成交量 +${TAKEN}。`,
	],
	takeHeadShort: [`Take ${TAKEN}: a print.`, `吃掉 ${TAKEN} 张：成交。`],
	tape: ["time and sales", "逐笔成交"],
	volume: ["volume", "成交量"],
	mid: ["mid", "中间价"],
	venueHead: [
		"That book was three venues, combined.",
		"这本订单簿由三个场所合并而成。",
	],
	venueHeadShort: ["Three venues, one book.", "三个场所，一本订单簿。"],
	nbboHead: [
		`Best bid ${usd(BEST.bid.price)}, best ask ${usd(BEST.ask.price)}: the NBBO.`,
		`最优买价 ${usd(BEST.bid.price)}、最优卖价 ${usd(BEST.ask.price)}：NBBO。`,
	],
	nbboHeadShort: [
		`NBBO ${usd(BEST.bid.price)} × ${usd(BEST.ask.price)}.`,
		`NBBO ${usd(BEST.bid.price)} × ${usd(BEST.ask.price)}。`,
	],
	goneHead: [
		`${BEST.ask.venue}'s last ${LEFT} trade: best ask ${usd(NEXT_ASK.ask.price)}.`,
		`${BEST.ask.venue} 剩下的 ${LEFT} 张成交：最优卖价升到 ${usd(NEXT_ASK.ask.price)}。`,
	],
	goneHeadShort: [
		`${BEST.ask.venue}'s offer gone: ${usd(NEXT_ASK.ask.price)}.`,
		`${BEST.ask.venue} 被吃光，最优卖价升到 ${usd(NEXT_ASK.ask.price)}。`,
	],
	venue: ["venue", "场所"],
	nbbo: ["NBBO · bid × ask", "NBBO · 买价 × 卖价"],
	claimBig: [
		"A quote is an offer; only a trade prints.",
		"报价只是挂单；只有成交才会留下记录。",
	],
	claimSub: [
		"Buy at the ask, sell at the bid; the last is history, the mid is arithmetic.",
		"按卖价买、按买价卖；最新价是历史，中间价只是算术。",
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
		["pr-gone", `10:32 · ${LEFT} @ ${usd(BEST.ask.price)}`],
	] as const;
	/** The best ask's row: where a market buy trades. */
	const bestRow = ASKS.length - 1;
	const venueAt = (venue: string) => VENUES.findIndex((v) => v.venue === venue);
	const cardText = narrow ? text : text * 1.15;
	/** Where each trade sets off: the book's size column, or C's card for its last 4. */
	const chipFrom = (name: string) =>
		name === "pr-gone"
			? {
					x: L.venueX(venueAt(BEST.ask.venue)) + L.venueW / 2,
					y: L.venueLine(1),
					anchor: "middle" as const,
				}
			: {
					x: margin + L.bookW - 6,
					y: rowText(L.askY(bestRow)),
					anchor: "end" as const,
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
			{headline("a-head", copy.acHead, copy.acHeadShort)}
			{headline("t-head", copy.takeHead, copy.takeHeadShort)}
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
							y={L.venueLine(0)}
							textAnchor="middle"
							className="wt-film-tag"
							style={{ fontSize: T.small }}
						>
							{`${t(copy.venue).toUpperCase()} ${v.venue}`}
						</text>
						{/* Price · size, the ask in red above the bid in green, as in the book. */}
						<text
							data-f={`va-${v.venue}`}
							x={L.venueX(i) + L.venueW / 2}
							y={L.venueLine(1)}
							textAnchor="middle"
							className="wt-film-num wt-film-loss"
							style={{ fontSize: cardText }}
						>
							{`${usd(v.ask.price)} · ${v.venue === BEST.ask.venue ? LEFT : v.ask.size}`}
						</text>
						<text
							data-f={`vb-${v.venue}`}
							x={L.venueX(i) + L.venueW / 2}
							y={L.venueLine(2)}
							textAnchor="middle"
							className="wt-film-num wt-film-gain"
							style={{ fontSize: cardText }}
						>
							{`${usd(v.bid.price)} · ${v.bid.size}`}
						</text>
					</g>
				))}
				<Brackets name="best-bid" tone="gain" arm={8} />
				<Brackets name="best-ask" tone="loss" arm={8} />
				<Brackets name="next-ask" tone="loss" arm={8} />
			</g>
			{(
				[
					["nbbo-1", `${usd(BEST.bid.price)} × ${usd(BEST.ask.price)}`],
					["nbbo-2", `${usd(BEST.bid.price)} × ${usd(NEXT_ASK.ask.price)}`],
				] as const
			).map(([name, label]) => (
				<g key={name} data-f={name}>
					<text
						x={L.nbboX}
						y={L.nbboY}
						textAnchor="middle"
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(copy.nbbo).toUpperCase()}
					</text>
					<text
						x={L.nbboX}
						y={L.nbboY + T.num * 1.3}
						textAnchor="middle"
						className="wt-film-num wt-film-accent"
						style={{ fontSize: T.num }}
					>
						{label}
					</text>
				</g>
			))}
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
	/**
	 * A trade: its chip appears where it trades, flies to the top of the tape and lands on its
	 * own text in the new print, while the older prints step down a row and back in tone.
	 * Prints never leave the tape.
	 */
	const stack: Element[] = [one("pr-last")];
	const print = (name: string, time: number) => {
		const chip = g(`carry-${name}`);
		tl.fromTo(chip, { opacity: 0 }, { opacity: 1, duration: 0.15 }, time);
		d.carry(chip, g(name), time + 0.15, { duration: 1 });
		const older = [...stack];
		tl.to(
			older,
			{ y: `+=${L.rowStep}`, duration: 0.45, ease: "power2.inOut" },
			time + 0.45,
		);
		older.forEach((el, k) => {
			tl.set(el, { attr: { class: "wt-film-num wt-film-dim" } }, time + 0.6);
			tl.to(
				el,
				{ opacity: [0.72, 0.5, 0.36][k] ?? 0.3, duration: 0.3 },
				time + 0.6,
			);
		});
		stack.unshift(one(name));
	};
	const lockAsk = g("lock-ask");
	const heads = [
		"k-head",
		"m-head",
		"b-head",
		"a-head",
		"t-head",
		"v-head",
		"n-head",
		"g-head",
	].map((name) => one(name));
	const levels = [
		...ASKS.map((at) => one(`lv-ask-${at.price}`)),
		...BIDS.map((at) => one(`lv-bid-${at.price}`)),
	];
	const bars = [
		...ASKS.map((at) => `ask-${at.price}`),
		...BIDS.map((at) => `bid-${at.price}`),
	];
	const pxAsk = g(`px-ask-${ASK.price}`);
	const pxBid = g(`px-bid-${BID.price}`);
	const last = g("pr-last");
	const cardLines = VENUES.flatMap((v) => [
		one(`va-${v.venue}`),
		one(`vb-${v.venue}`),
	]);

	d.hidden([
		...flat("q"),
		...heads,
		...flat("book").filter(
			(el) => !el.getAttribute("data-f")?.startsWith("lv-"),
		),
		...levels,
		pxAsk,
		pxBid,
		...bars.map((key) => one(`hit-${key}`)),
		one("mid"),
		...kids("tape"),
		...["pr-buy", "pr-take", "pr-gone"].flatMap((n) => [
			one(n),
			one(`carry-${n}`),
		]),
		lockAsk,
		g("lock-last"),
		lockVol,
		...kids("venues"),
		...cardLines,
		one("nbbo-1"),
		one("nbbo-2"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: three numbers on a screen ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.5);
	(["q-bid", "q-ask", "q-last"] as const).forEach((name, i) => {
		show(one(`${name}-tag`), 4.8 + i * 0.3);
		word(one(`${name}-num`), 4.9 + i * 0.3);
	});
	show(one("q-line"), 6.2);

	// ——— quote: the three numbers fly to their places, then the book fills in ———
	tl.addLabel("quote", 9.5);
	hide([one("q-tag"), one("q-line")], 9.5);
	// The spread line comes in once the numbers have left the middle of the frame.
	show(
		flat("book").filter((el) => !el.getAttribute("data-f")),
		10.6,
	);
	levels.forEach((lv, i) => {
		show(lv, 9.8 + i * 0.06, "right");
	});
	bars.forEach((key, i) => {
		const at = [...ASKS, ...BIDS][i];
		tl.fromTo(
			one(`bar-${key}`),
			{ attr: { width: 0 } },
			{ attr: { width: width(at.size) }, duration: 0.5, ease: "power2.out" },
			11.0 + i * 0.06,
		);
	});
	show(
		kids("tape").filter((el) => el !== last),
		10.6,
	);
	// Each number takes its label along: ask first, then bid, then the last onto the tape.
	d.carry(g("q-ask-num"), pxAsk, 9.7);
	d.carry(g("q-ask-tag"), g("book-ask-tag"), 9.7);
	d.carry(g("q-bid-num"), pxBid, 10.0);
	d.carry(g("q-bid-tag"), g("book-bid-tag"), 10.0);
	d.carry(g("q-last-num"), last, 10.3);
	hide(one("q-last-tag"), 10.9);
	show(heads[0], 11.2);
	// Mid is arithmetic; the last is history, and brackets point at it on the tape.
	d.swap(heads[0], heads[1], 15.2);
	show(one("mid"), 15.6);
	d.lock(g("lock-last"), 17.0, { around: last, pad: 5 });
	// A market buy takes the ask, and a print appears.
	d.swap(heads[1], heads[2], 19.6);
	hide(one("mid"), 19.6);
	fade(g("lock-last"), 19.6);
	fade(hit, 20.0, 1);
	d.lock(lockAsk, 20.0, { around: hit, pad: 4 });
	print("pr-buy", 20.2);
	sizeTo(ASK.size - 1, ASK.size, 20.3);
	volumeTo(PRIOR + 1, PRIOR, 21.4);

	// ——— orders: size moves, the tape doesn't, until a trade ———
	tl.addLabel("orders", 23.6);
	d.swap(heads[2], heads[3], 23.6);
	fade([hit, lockAsk], 23.6);
	sizeTo(ASK.size - 1 + ADDED, ASK.size - 1, 24.2);
	sizeTo(ASK.size - 1, ASK.size - 1 + ADDED, 26.0);
	d.swap(heads[3], heads[4], 27.6);
	fade(hit, 28.0, 1);
	d.lock(lockAsk, 28.0, { around: hit, pad: 4 });
	print("pr-take", 28.2);
	sizeTo(LEFT, ASK.size - 1, 28.3);
	volumeTo(PRIOR + 1 + TAKEN, PRIOR + 1, 29.4);

	// ——— venues: the hero. The book splits into the three venues it was made of. ———
	tl.addLabel("venues", 31.6);
	d.swap(heads[4], heads[5], 31.6);
	fade(
		[
			hit,
			lockAsk,
			...flat("book").filter((el) => !el.getAttribute("data-f")),
			g("book-ask-tag"),
			g("book-bid-tag"),
		],
		31.6,
	);
	tl.to(
		bars.map((key) => one(`bar-${key}`)),
		{ attr: { width: 0 }, opacity: 0, duration: 0.4, ease: "power2.in" },
		31.7,
	);
	VENUES.forEach((v, i) => {
		show(one(`venue-${v.venue}`), 31.8 + i * 0.15);
		const at = 32.0 + i * 0.2;
		const ask = `ask-${v.ask.price}`;
		const bid = `bid-${v.bid.price}`;
		const askSize = v.venue === BEST.ask.venue ? LEFT : v.ask.size;
		d.carry(g(`px-${ask}`), g(`va-${v.venue}`), at);
		d.carry(g(`size-${ask}`), g(`va-${v.venue}`), at, {
			match: String(askSize),
			last: true,
			reveal: false,
		});
		d.carry(g(`px-${bid}`), g(`vb-${v.venue}`), at + 0.1);
		d.carry(g(`size-${bid}`), g(`vb-${v.venue}`), at + 0.1, {
			match: String(v.bid.size),
			last: true,
			reveal: false,
		});
	});
	tl.set(levels, { opacity: 0 }, 33.6);
	// The best of the three: the NBBO.
	d.swap(heads[5], heads[6], 35.6);
	d.lock(g("best-bid"), 36.0, { around: g(`vb-${BEST.bid.venue}`), pad: 5 });
	d.lock(g("best-ask"), 36.2, { around: g(`va-${BEST.ask.venue}`), pad: 5 });
	word(one("nbbo-1"), 36.5);
	// C's last 4 trade: they print on the same tape, and C drops out of the NBBO.
	d.swap(heads[6], heads[7], 39.6);
	d.count(
		one(`va-${BEST.ask.venue}`),
		0,
		40.0,
		(v) =>
			Math.round(v) > 0 ? `${usd(BEST.ask.price)} · ${Math.round(v)}` : "—",
		LEFT,
		0.5,
	);
	print("pr-gone", 40.0);
	volumeTo(PRIOR + 1 + TAKEN + LEFT, PRIOR + 1 + TAKEN, 41.2);
	fade(g("best-ask"), 40.5);
	fade(one(`venue-${BEST.ask.venue}`), 40.5, 0.4);
	d.lock(g("next-ask"), 40.7, { around: g(`va-${NEXT_ASK.venue}`), pad: 5 });
	d.flip(one("nbbo-1"), one("nbbo-2"), 40.7);
	tl.set(one("nbbo-1"), { opacity: 0 }, 41.0);

	// ——— claim ———
	tl.addLabel("claim", 43.6);
	hide(
		[
			heads[7],
			...kids("venues"),
			one("nbbo-2"),
			...kids("tape"),
			...stack,
			lockVol,
		],
		43.6,
	);
	word(one("z-big"), 43.9);
	show(one("z-sub"), 44.4);

	// ——— next ———
	tl.addLabel("next", 47.6);
	hide(kids("claim"), 47.6);
	d.close(47.6);
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
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
