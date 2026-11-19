import { useId } from "react";
import {
	ALFA,
	ALFA_SHARES_OUTSTANDING,
	alfaStockBook,
	type Copy,
	count,
	instruments,
	pick,
	signedUsd,
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
	toneClass,
	Word,
} from "../walkthrough/film-kit";
import {
	type Kind,
	kindOrder,
	kinds,
	tradeAgainst,
} from "./stocks-and-prices-model";

/*
 * Stocks and prices, as a film. This is the course's first lesson, so it says what a share is
 * before its question counts ten of them. ALFA is one bar of 50,000,000 shares; your ten are
 * ten squares, drawn large out of a speck of that bar, at $100.00 each. When the price moves
 * $1, a dollar rises over each square and a bracket over the ten reads +$10. Then ALFA's last trade,
 * $100.02, and the question: what do 10 shares cost right now? Every other film asks first;
 * here the question would use a word the learner has not met.
 *
 * The quote is a picture, not a table (a pilot, 2026-11-19). The book is a price ladder drawn
 * to scale: each level is a bar at the height of its price, as long as its size, so the
 * spread is a real gap and the last price sits inside it. A rail beside the ladder shows
 * where a trade lands. The question's $100.02 flies onto the rail. Buy 10: the pointer lands
 * at the $100.05 ask, $1,000.50. Sell 10: at the $100.00 bid, $1,000.00, 50¢ apart, with the
 * last price between them. Those trades stay done. The hero: 1,000 shares at once take the
 * asks one level after another (290, 500 and 210 shares, counted beside the rail), and their
 * average climbs the rail to $100.061: $41.30 over the same 1,000 at the last price. Only
 * the prices in play are bright; the book's sizes are bar lengths, not digits.
 * Last, a stock, an exchange-traded fund (ETF) and an index.
 *
 *   open      0–4        "Stocks and prices"
 *   slice     4–12       ALFA's bar, your ten squares, $100.00 each; each $1: +$10
 *   question  12–16.55   last $100.02: what do 10 shares cost?
 *   quote     16.55–37.0 the ladder and the rail; buy 10: $1,000.50, sell 10: $1,000.00,
 *                        a bracket: 50¢; hero: buy 1,000, the average climbs to $100.061;
 *                        after it, the rail between the last price and that average
 *   kinds     37.0–41.45 stock, ETF, index, drawn: one square, 500 dots, a number; what
 *                        an option on each delivers
 *   claim     41.45–45.85 you trade against the quote, not the last price
 *   next      45.85–47.45 Next: options, a paid right
 */

const END = 47.45;
const OPEN = ALFA.open;
const MINE = 10;
const SHARES = ALFA_SHARES_OUTSTANDING;
const BUY10 = tradeAgainst("buy", 10);
const SELL10 = tradeAgainst("sell", 10);
const BIG = 1_000;
/** The 1,000 climb the book the 10-share trades left: a trade never un-happens. */
const BUY_BIG = tradeAgainst("buy", BIG, BUY10);
/** What the 1,000 shares cost each, in cents. */
const AVERAGE = BUY_BIG.notional / BUY_BIG.filled;
/** What the 1,000 shares cost above the same 1,000 at the last price: "$41.30". */
const OVER_LAST = usd(BUY_BIG.notional - BIG * alfaStockBook.last);
const ASKS = [...alfaStockBook.asks].reverse();
const BIDS = alfaStockBook.bids;
const MAX_SIZE = Math.max(
	...[...alfaStockBook.asks, ...alfaStockBook.bids].map((level) => level.size),
);
const PRICE_HIGH = Math.max(...alfaStockBook.asks.map((level) => level.price));
const PRICE_LOW = Math.min(...alfaStockBook.bids.map((level) => level.price));
/** Cents to "$100.061": the climbing average keeps three places all the way up. */
const price3 = (cents: number) => `$${(cents / 100).toFixed(3)}`;
/** The fund's stocks are drawn as dots, this many to a row: 500 make 20 full rows. */
const DOT_COLUMNS = 25;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	// The book is a price ladder drawn to scale: a cent is as tall everywhere on it, so the
	// spread is a real gap between the best ask and the best bid, and the last price sits
	// inside that gap.
	const left = narrow ? 14 : margin;
	const ladderTop = H * (narrow ? 0.25 : 0.3);
	const ladderBottom = H * 0.835;
	const cent = (ladderBottom - ladderTop) / (PRICE_HIGH - PRICE_LOW);
	const priceW = narrow ? 54 : 78;
	const barX = left + priceW + (narrow ? 8 : 12);
	const barMax = narrow ? 84 : room * 0.33;
	// The rail beside the book: a trade lands on it at the height of the price it got.
	const railX = barX + barMax + (narrow ? 14 : 28);
	// A share: ALFA as one bar, and your ten shares as ten squares centred under it.
	const token = narrow ? 22 : 34;
	const tokenGap = narrow ? 6 : 8;
	const tokenX0 = (width - (MINE * token + (MINE - 1) * tokenGap)) / 2;
	const tokenY = H * (narrow ? 0.43 : 0.47);
	const kindTop = H * (narrow ? 0.27 : 0.25);
	const kindH = H * (narrow ? 0.55 : 0.6);
	return {
		...frame,
		left,
		priceX: left + priceW,
		priceY: (cents: number) => ladderBottom - (cents - PRICE_LOW) * cent,
		barX,
		/** A bar's length for a number of shares; 1,000 shares run the full width. */
		barW: (shares: number) => (shares / MAX_SIZE) * barMax,
		barH: Math.min(14, cent * 0.62),
		railX,
		readX: railX + (narrow ? 16 : 22),
		companyX: narrow ? 28 : margin,
		companyY: H * 0.27,
		companyW: width - 2 * (narrow ? 28 : margin),
		companyH: narrow ? 10 : 12,
		token,
		/** How tall a dollar stands over a share. */
		unitH: narrow ? 6 : 9,
		tokenX: (i: number) => tokenX0 + i * (token + tokenGap),
		tokenY,
		/** The tags under the squares: what one share costs, and what is yours. */
		readY: tokenY + token + (narrow ? 26 : 30),
		kindX: (i: number) => margin + (i * room) / 3,
		kindW: room / 3,
		kindTop,
		kindH,
		/** The middle of a column's picture. */
		kindPicY: kindTop + kindH * 0.44,
	};
}

const copy = {
	title: ["Stocks and prices", "股票与价格"],
	titleSub: ["what options are built on", "期权的基础"],
	qTag: ["ALFA · last price paid", "ALFA · 最新成交价"],
	qLine: [`Cost to buy ${MINE} shares now?`, "现在买 10 股要花多少？"],
	sliceHead: ["A share is one slice of ALFA.", "一股是 ALFA 的一份。"],
	sliceHeadShort: ["A share: one slice of ALFA.", "一股：ALFA 的一份。"],
	moveHead: [
		`Each $1 move: $${MINE} to you.`,
		`ALFA 每涨跌 $1，你的股票变动 $${MINE}。`,
	],
	moveHeadShort: [
		`Each $1: $${MINE} to you.`,
		`每动 $1：你的股票变 $${MINE}。`,
	],
	yours: [`your ${MINE} shares`, `你的 ${MINE} 股`],
	each: ["each", "每股"],
	company: [`ALFA, ${count(SHARES)} shares`, `ALFA，${count(SHARES)} 股`],
	companyShort: [
		`ALFA, ${SHARES / 1_000_000}M shares`,
		`ALFA，${SHARES / 10_000} 万股`,
	],
	bookHead: ["Buyers bid; sellers ask.", "买方出价，卖方要价。"],
	bookHeadShort: ["Buyers bid; sellers ask.", "买方出价，卖方要价。"],
	buyHead: ["Buy, sell: two prices.", "买入、卖出：两个价格。"],
	buyHeadShort: ["Buy, sell: two prices.", "买入、卖出：两个价。"],
	bigHead: ["A big order climbs the book.", "大单会一档一档往上买。"],
	bigHeadShort: ["A big order climbs the book.", "大单会逐档往上买。"],
	asks: ["asks · sellers' prices", "卖价 · 卖方"],
	/** On a phone the tags end short of the rail. */
	asksShort: ["asks · sellers", "卖价 · 卖方"],
	bids: ["bids · buyers' prices", "买价 · 买方"],
	bidsShort: ["bids · buyers", "买价 · 买方"],
	last: ["last", "最新"],
	pay: ["you pay", "你付出"],
	get: ["you get", "你收到"],
	/** The picture shows it; the blind juries still missed the sentence, so it is back. */
	diff: ["Last trade is neither.", "最新成交不是报价。"],
	/** What the 1,000 shares cost above the same 1,000 at the last price. */
	overLast: [`${OVER_LAST} over last`, `比最新价多付 ${OVER_LAST}`],
	kindsHead: [
		"Stock, ETF, index: what options deliver.",
		"股票、ETF、指数：期权如何交割？",
	],
	kindsHeadShort: [
		"Stock, ETF, index: what options deliver.",
		"股票、ETF、指数：期权如何交割？",
	],
	/** The lesson page never spells ETF out, so the film does, where the word is first met. */
	etfFund: ["exchange-traded fund", "交易所交易基金"],
	/** Without it the index's 5,000 was read as the cash an option pays. */
	indexNumber: ["a number you can't buy", "一个不能买的数"],
	claimBig: [
		"Trades happen at quotes, not last prices.",
		"成交按报价，不按最新成交价。",
	],
	// The claim keeps the lesson's word, quotes, and says what they are.
	claimSub: [
		"Quotes: the ask to buy, the bid to sell.",
		"报价：买入用卖价，卖出用买价。",
	],
	nextBig: ["Next: options, a paid right", "下一课：期权，付费的权利"],
	nextSub: ["what a call and a put give you", "看涨与看跌赋予你什么"],
} as const;

/** The average's tag names the shares filled so far, so it is true while the order fills. */
const averageOf = (shares: number, narrow: boolean): Copy =>
	narrow
		? [`avg of ${count(shares)}`, `${count(shares)} 股的均价`]
		: [`average of ${count(shares)} shares`, `${count(shares)} 股的均价`];

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
	const rowText = narrow ? T.small * 1.15 : T.body;
	const tokens = Array.from({ length: MINE }, (_, i) => i);
	// The fund's basket: one dot a stock, in full rows, centred in the middle column.
	const id = useId().replace(/:/g, "");
	const dot = narrow ? 3 : 4;
	const dotRows = instruments.etf.holds / DOT_COLUMNS;
	const dotsX = L.kindX(1) + L.kindW / 2 - (DOT_COLUMNS * dot) / 2;
	const dotsY = L.kindPicY - (dotRows * dot) / 2;
	// Under each picture, what an option on it delivers.
	const settleSize = narrow ? T.body : T.head * 0.85;
	const settleY = L.kindTop + L.kindH - (narrow ? 22 : 30);
	// The index is its level: a number in a dashed box, nothing to hold.
	const levelSize = narrow ? T.body * 1.3 : T.head * 1.1;
	const levelBox = narrow
		? { width: 76, height: 46 }
		: { width: 116, height: 64 };
	// The bracket over the ten dollar caps, clear of them.
	const gainY = L.tokenY - 5 - L.unitH - 5;
	// What you pay and what you get stand beside the rail, each at the height of its price.
	const fig = narrow ? T.body * 1.1 : T.head * 1.15;
	const heroFig = T.num * 1.3;
	const bestAsk = BUY10.fills[0].price;
	const bestBid = SELL10.fills[0].price;
	const lastY = L.priceY(alfaStockBook.last);
	const avgY = L.priceY(AVERAGE);
	const heroX = L.readX + (narrow ? 6 : 4);
	const heroBase = avgY + heroFig * 0.36;
	const level = (side: "ask" | "bid", at: { price: number; size: number }) => {
		const y = L.priceY(at.price);
		const key = `${side}-${at.price}`;
		return (
			<g key={key} data-f={`lv-${key}`}>
				<text
					data-f={`px-${key}`}
					x={L.priceX}
					y={y + rowText * 0.36}
					textAnchor="end"
					className="wt-film-num"
					style={{ fontSize: rowText }}
				>
					{usd(at.price)}
				</text>
				<rect
					data-f={`bar-${key}`}
					x={L.barX}
					y={y - L.barH / 2}
					width={L.barW(at.size)}
					height={L.barH}
					rx={3}
					className="wt-film-bar"
					data-tone="neutral"
				/>
				{/* What you took of this level: it grows over the bar from its start. */}
				<rect
					data-f={`took-${key}`}
					x={L.barX}
					y={y - L.barH / 2}
					width={0}
					height={L.barH}
					rx={3}
					className="wt-film-bar"
					data-tone="total"
				/>
			</g>
		);
	};
	/** A trade's mark on the rail: it points at the price the trade got. */
	const pointer = (name: string, y: number) => (
		<path
			data-f={name}
			d={`M${L.railX + 1.5} ${y}l9 -6v12z`}
			style={{ fill: "var(--tone-focus)" }}
		/>
	);
	const readout = (name: string, tag: Copy, value: string, cents: number) => (
		<text data-f={name} x={L.readX} y={L.priceY(cents) + fig * 0.36}>
			<tspan className="wt-film-tag" style={{ fontSize: T.small }}>
				{t(tag).toUpperCase()}
			</tspan>
			<tspan
				dx={narrow ? 6 : 10}
				className="wt-film-num wt-film-accent"
				style={{ fontSize: fig }}
			>
				{value}
			</tspan>
		</text>
	);
	/** From the end of a level's bar to the rail, at that level's price. */
	const leader = (
		name: string,
		levels: readonly { price: number; size: number }[],
		cents: number,
	) => (
		<path
			data-f={name}
			d={`M${L.barX + L.barW(levels.find((at) => at.price === cents)?.size ?? 0) + 6} ${L.priceY(cents)}H${L.railX - 4}`}
			className="wt-film-link"
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
				<Word
					name="q-big"
					x={W / 2}
					y={H * 0.3 + T.big * 1.05}
					size={T.big}
					className="wt-film-num"
				>
					{usd(alfaStockBook.last)}
				</Word>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.72}
					size={T.head}
					maxWidth={room}
				/>
			</g>

			{/* A share and the company: ALFA is one bar, and your ten shares are ten squares,
			    drawn large beside the speck of the bar that they are. */}
			{headline("s-head", copy.sliceHead, copy.sliceHeadShort)}
			{headline("m-head", copy.moveHead, copy.moveHeadShort)}
			<g data-f="slice">
				<text
					data-f="co-tag"
					x={L.companyX}
					y={L.companyY - T.small * 0.9}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(narrow ? copy.companyShort : copy.company).toUpperCase()}
				</text>
				<rect
					data-f="co-bar"
					x={L.companyX}
					y={L.companyY}
					width={L.companyW}
					height={L.companyH}
					rx={3}
					className="wt-film-bar"
					data-tone="neutral"
				/>
				{/* Ten of 50 million shares are far thinner than this mark: it only says where. */}
				<rect
					data-f="co-speck"
					x={W / 2 - 1}
					y={L.companyY - 3}
					width={2}
					height={L.companyH + 6}
					className="wt-film-bar"
					data-tone="total"
				/>
				<path
					data-f="zoom"
					d={`M${W / 2} ${L.companyY + L.companyH + 6}L${L.tokenX(0)} ${L.tokenY - 8}M${W / 2} ${L.companyY + L.companyH + 6}L${L.tokenX(MINE - 1) + L.token} ${L.tokenY - 8}`}
					className="wt-film-link"
				/>
				{tokens.map((i) => (
					<rect
						key={`tok-${i}`}
						data-f={`tok-${i}`}
						x={L.tokenX(i)}
						y={L.tokenY}
						width={L.token}
						height={L.token}
						rx={narrow ? 3 : 5}
						className="wt-film-bar"
						data-tone="total"
					/>
				))}
				{/* A dollar a share: one green cap over each share, which the build raises with
				    the price. A bracket over the ten then says what they add up to. */}
				{tokens.map((i) => (
					<rect
						key={`up-${i}`}
						data-f={`up-${i}`}
						x={L.tokenX(i)}
						y={L.tokenY - 5}
						width={L.token}
						height={0}
						rx={2}
						className="wt-film-bar"
						data-tone="gain"
					/>
				))}
				<text
					data-f="px-tag"
					x={L.tokenX(0)}
					y={L.readY}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.each).toUpperCase()}
				</text>
				<Word
					name="px"
					x={L.tokenX(0)}
					y={L.readY + T.num * 1.15}
					size={T.num}
					anchor="start"
					className="wt-film-num wt-film-accent"
				>
					{usd(OPEN)}
				</Word>
				<text
					data-f="mine-tag"
					x={L.tokenX(MINE - 1) + L.token}
					y={L.readY}
					textAnchor="end"
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.yours).toUpperCase()}
				</text>
				<Word
					name="mine-val"
					x={L.tokenX(MINE - 1) + L.token}
					y={L.readY + T.num * 1.15}
					size={T.num}
					anchor="end"
					className="wt-film-num"
				>
					{usd(MINE * OPEN, 0)}
				</Word>
				<path
					data-f="gain-gap"
					d={`M${L.tokenX(0)} ${gainY + 4}V${gainY}H${L.tokenX(MINE - 1) + L.token}V${gainY + 4}`}
					className="wt-film-gap"
					style={{ stroke: "var(--tone-up)" }}
				/>
				<Word
					name="mine-chg"
					x={W / 2}
					y={gainY - 8}
					size={narrow ? T.body * 1.2 : T.head}
					className={`wt-film-num ${toneClass.up}`}
				>
					{signedUsd(MINE * 100, 0)}
				</Word>
			</g>

			{/* The book, as a price ladder to scale, and the rail where trades land. */}
			{headline("b-head", copy.bookHead, copy.bookHeadShort)}
			{headline("y-head", copy.buyHead, copy.buyHeadShort)}
			{/* The qualification beside the buy and sell comparison: its second line. */}
			<Lines
				name="y2-head"
				text={t(copy.diff)}
				x={margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.buyHeadShort : copy.buyHead),
						narrow ? room : room * 0.74,
						T.head,
					) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			{headline("g-head", copy.bigHead, copy.bigHeadShort)}
			<g data-f="book">
				<text
					data-f="asks-tag"
					x={L.left}
					y={L.priceY(PRICE_HIGH) - L.barH / 2 - 9}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(narrow ? copy.asksShort : copy.asks).toUpperCase()}
				</text>
				{ASKS.map((at) => level("ask", at))}
				{BIDS.map((at) => level("bid", at))}
				<text
					data-f="bids-tag"
					x={L.left}
					y={L.priceY(PRICE_LOW) + L.barH / 2 + T.small * 1.6}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(narrow ? copy.bidsShort : copy.bids).toUpperCase()}
				</text>
				<path
					data-f="rail"
					d={`M${L.railX} ${L.priceY(PRICE_HIGH) - 12}V${L.priceY(PRICE_LOW) + 12}`}
					className="wt-axis"
				/>
				<circle
					data-f="last-dot"
					cx={L.railX}
					cy={lastY}
					r={narrow ? 3.5 : 4}
					style={{ fill: "var(--tone-ink)" }}
				/>
				{/* The question's number lands here: the last price, inside the spread. */}
				<text
					data-f="last"
					x={L.readX}
					y={lastY + rowText * 0.36}
					className="wt-film-num"
					style={{ fontSize: rowText }}
				>
					{`${t(copy.last)} ${usd(alfaStockBook.last)}`}
				</text>
			</g>
			{leader("lead-ask", alfaStockBook.asks, bestAsk)}
			{leader("lead-bid", alfaStockBook.bids, bestBid)}
			{pointer("pt-pay", L.priceY(bestAsk))}
			{pointer("pt-get", L.priceY(bestBid))}
			{readout("p-pay", copy.pay, usd(BUY10.notional), bestAsk)}
			{readout("p-get", copy.get, usd(SELL10.notional), bestBid)}
			{/* The 50¢ between what you pay and what you get: fitted by the build, which
			    measures both lines as they will read. */}
			<path
				data-f="diff-gap"
				className="wt-film-gap"
				style={{ stroke: "var(--tone-ink)" }}
			/>
			<text
				data-f="diff-label"
				className="wt-film-num"
				style={{ fontSize: rowText }}
			>
				{`${Math.round(BUY10.notional - SELL10.notional)}¢`}
			</text>
			{/* The hero: the average price of 1,000 shares. Its pointer climbs the rail as
			    the order climbs the asks; the build moves it. */}
			{/* How many shares the order takes at each level, beside the rail: they add up
			    to the 1,000. The build counts each with its bar. */}
			{BUY_BIG.fills.map((fill) => (
				<text
					key={fill.price}
					data-f={`n-ask-${fill.price}`}
					x={L.railX - (narrow ? 6 : 10)}
					y={L.priceY(fill.price) + rowText * 0.36}
					textAnchor="end"
					className="wt-film-num wt-film-accent"
					style={{ fontSize: narrow ? T.small : T.small * 1.15 }}
				>
					{count(fill.size)}
				</text>
			))}
			{pointer("pt-avg", L.priceY(BUY_BIG.fills[0].price))}
			<text
				data-f="p-avg-tag"
				x={heroX}
				y={heroBase - heroFig * 0.78 - T.small * 0.9}
				className="wt-film-tag"
				style={{ fontSize: T.small }}
			>
				{t(averageOf(BIG, narrow)).toUpperCase()}
			</text>
			<Word
				name="p-avg"
				x={heroX}
				y={heroBase}
				size={heroFig}
				anchor="start"
				className="wt-film-num wt-film-accent"
			>
				{price3(AVERAGE)}
			</Word>
			{/* After the hero: the stretch of rail between the last price and that average,
			    named on the line above the last price. */}
			<path
				data-f="over-gap"
				d={`M${L.railX} ${lastY}V${avgY}`}
				className="wt-film-gap"
				style={{ stroke: "var(--tone-ink)" }}
			/>
			<text
				data-f="over-label"
				x={L.readX}
				y={lastY + rowText * 0.36 - rowText * 1.5}
				className="wt-film-num"
				style={{ fontSize: rowText }}
			>
				{t(copy.overLast)}
			</text>
			{/* Fitted when they lock: the average, the index column. */}
			<Brackets name="lock-avg" glow />
			<Brackets name="lock-index" />

			{/* Three kinds of underlying, drawn: one share of one company, a fund's basket of 500
			    stocks (500 dots, counted) and an index, which is only a number. Under each, what
			    an option on it delivers. */}
			{headline("k-head", copy.kindsHead, copy.kindsHeadShort)}
			<defs>
				<pattern
					id={`dots-${id}`}
					x={dotsX}
					y={dotsY}
					width={dot}
					height={dot}
					patternUnits="userSpaceOnUse"
				>
					<rect
						width={dot * 0.55}
						height={dot * 0.55}
						className="wt-film-bar"
						data-tone="total"
					/>
				</pattern>
			</defs>
			<g data-f="kinds">
				{kindOrder.map((kind: Kind, i) => {
					const cx = L.kindX(i) + L.kindW / 2;
					return (
						<g key={kind} data-f={`col-${kind}`}>
							<rect
								data-f={`colbg-${kind}`}
								x={L.kindX(i) + 6}
								y={L.kindTop}
								width={L.kindW - 12}
								height={L.kindH}
								rx={12}
								className="wt-focus-shape"
							/>
							<text
								data-f={`kind-${kind}`}
								x={cx}
								y={L.kindTop + T.small * 2.4}
								textAnchor="middle"
								className="wt-film-tag"
								style={{ fontSize: T.small }}
							>
								{t(kinds[kind].kind).toUpperCase()}
							</text>
							{kind === "index" ? (
								<text
									data-f="index-note"
									x={cx}
									y={L.kindTop + T.small * 4.1}
									textAnchor="middle"
									className={
										narrow ? "wt-film-type wt-film-dim" : "wt-film-tag"
									}
									style={{ fontSize: T.small }}
								>
									{(narrow && locale === "en"
										? ["a number", "you can't buy"]
										: [t(copy.indexNumber)]
									).map((line, lineIndex) => (
										<tspan
											key={line}
											x={cx}
											dy={lineIndex === 0 ? 0 : T.small * 1.35}
										>
											{narrow ? line : line.toUpperCase()}
										</tspan>
									))}
								</text>
							) : null}
							{kind === "etf" ? (
								<text
									data-f="etf-note"
									x={cx}
									y={L.kindTop + T.small * 4.1}
									textAnchor="middle"
									// A phone's column is narrower than the tracked capitals: plain small type there.
									className={
										narrow ? "wt-film-type wt-film-dim" : "wt-film-tag"
									}
									style={{ fontSize: T.small }}
								>
									{(narrow && locale === "en"
										? ["exchange-traded", "fund"]
										: [t(copy.etfFund)]
									).map((line, lineIndex) => (
										<tspan
											key={line}
											x={cx}
											dy={lineIndex === 0 ? 0 : T.small * 1.35}
										>
											{narrow ? line : line.toUpperCase()}
										</tspan>
									))}
								</text>
							) : null}
							{kind === "stock" ? (
								<rect
									data-f="pic-stock"
									x={cx - L.token / 2}
									y={L.kindPicY - L.token / 2}
									width={L.token}
									height={L.token}
									rx={narrow ? 3 : 5}
									className="wt-film-bar"
									data-tone="total"
								/>
							) : kind === "etf" ? (
								<rect
									data-f="pic-etf"
									x={dotsX}
									y={dotsY}
									width={DOT_COLUMNS * dot}
									height={dotRows * dot}
									fill={`url(#dots-${id})`}
								/>
							) : (
								<>
									<rect
										data-f="pic-index"
										x={cx - levelBox.width / 2}
										y={L.kindPicY - levelBox.height / 2}
										width={levelBox.width}
										height={levelBox.height}
										rx={6}
										className="wt-film-bar"
										data-tone="model"
									/>
									<text
										data-f="index-level"
										x={cx}
										y={L.kindPicY + levelSize * 0.36}
										textAnchor="middle"
										className="wt-film-num"
										style={{ fontSize: levelSize }}
									>
										{kinds.index.quote}
									</text>
								</>
							)}
							{/* From the thing to what an option on it delivers. */}
							<path
								data-f={`gives-${kind}`}
								d={`M${cx} ${L.kindPicY + (dotRows * dot) / 2 + 12}V${settleY - settleSize - 8}m-4 -5l4 5l4 -5`}
								className="wt-axis"
							/>
							<text
								data-f={`cell-${kind}-settle`}
								x={cx}
								y={settleY}
								textAnchor="middle"
								className="wt-film-type"
								style={{ fontSize: settleSize }}
							>
								{t(kinds[kind].settle)}
							</text>
						</g>
					);
				})}
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
	const px = one<SVGTextElement>("px");
	const mineVal = one<SVGTextElement>("mine-val");
	const mineChg = one<SVGGraphicsElement>("mine-chg");
	const tokens = Array.from({ length: MINE }, (_, i) => one(`tok-${i}`));
	const ups = Array.from({ length: MINE }, (_, i) => one(`up-${i}`));
	const dollars = (v: number) => usd(Math.round(v), 2);
	const key = (side: "ask" | "bid", cents: number) => `${side}-${cents}`;
	/** What you took of a level, drawn over its bar. */
	const took = (side: "ask" | "bid", cents: number) =>
		one(`took-${key(side, cents)}`);
	const tick = (side: "ask" | "bid", cents: number) =>
		one(`px-${key(side, cents)}`);
	/** A sliver stays visible on a phone, where ten shares are under a pixel long. */
	const tookW = (shares: number) => (shares ? Math.max(2, L.barW(shares)) : 0);
	const askLevels = ASKS.map((at) => one(`lv-${key("ask", at.price)}`));
	const bidLevels = BIDS.map((at) => one(`lv-${key("bid", at.price)}`));
	const levels = [...askLevels, ...bidLevels];
	const bestAsk = BUY10.fills[0].price;
	const bestBid = SELL10.fills[0].price;
	/** Prices away from the best bid and ask stand back until an order reaches them. */
	const deep = [
		...ASKS.filter((at) => at.price !== bestAsk).map((at) =>
			tick("ask", at.price),
		),
		...BIDS.filter((at) => at.price !== bestBid).map((at) =>
			tick("bid", at.price),
		),
	];
	const heads = [
		"s-head",
		"m-head",
		"b-head",
		"y-head",
		"g-head",
		"k-head",
	].map((name) => one(name));
	const fadeIn = (targets: Element | Element[], at: number, duration = 0.3) =>
		tl.fromTo(
			targets,
			{ opacity: 0 },
			{ opacity: 1, duration, ease: "power3.out" },
			at,
		);
	d.hidden([
		...flat("q"),
		...heads,
		...flat("slice"),
		one("asks-tag"),
		one("bids-tag"),
		one("rail"),
		one("last-dot"),
		one("last"),
		...levels,
		one("lead-ask"),
		one("lead-bid"),
		one("pt-pay"),
		one("pt-get"),
		one("p-pay"),
		one("p-get"),
		one("diff-gap"),
		one("diff-label"),
		one("y2-head"),
		...BUY_BIG.fills.map((fill) => one(`n-ask-${fill.price}`)),
		one("pt-avg"),
		one("p-avg-tag"),
		one("p-avg"),
		one("lock-avg"),
		one("over-gap"),
		one("over-label"),
		one("lock-index"),
		...kindOrder.flatMap((kind) => [one(`col-${kind}`), one(`colbg-${kind}`)]),
		...kids("claim"),
	]);
	tl.set(deep, { opacity: 0.4 }, 0);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— slice: a share and the company, before the question counts ten of them ———
	tl.addLabel("slice", 4);
	d.tag(4.0);
	// The title is still flying to its corner until 4.9. On a phone it crosses the end of this
	// headline's row between 4.55 and 4.65, so the headline comes up once it has gone by.
	show(heads[0], 4.65);
	// ALFA, whole; then your ten shares, drawn large out of a speck of it.
	fadeIn([one("co-bar"), one("co-tag")], 4.95);
	fadeIn(one("co-speck"), 5.55);
	d.trace(one<SVGPathElement>("zoom"), 5.55, { duration: 0.4 });
	tl.fromTo(
		tokens,
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3, stagger: 0.03, ease: "power3.out" },
		5.8,
	);
	show(one("mine-tag"), 5.8, "below", 0.3);
	// What one share costs, then what the ten are worth.
	show([one("px-tag"), px], 6.3);
	show(mineVal, 6.7);
	// Each $1 move, under its own headline. What the ten are worth leaves first, since the
	// price is about to change it; the company stands back.
	hide(mineVal, 7.85, 0.3);
	d.swap(heads[0], heads[1], 8.15);
	tl.to(
		[one("co-bar"), one("co-tag"), one("mine-tag")],
		{ opacity: 0.4, duration: 0.3 },
		8.15,
	);
	// The magnifier's lines leave: the space over the squares is the dollars' next.
	tl.to(
		[one("co-speck"), one("zoom")],
		{ opacity: 0, duration: 0.3, ease: "power2.in" },
		8.15,
	);
	// The price rises a dollar and a dollar rises over each share. One count drives both, so
	// every frame agrees: a unit is as tall as the price has moved.
	const rise = { dollars: 0 };
	const renderRise = () => {
		px.textContent = dollars(OPEN + 100 * rise.dollars);
		for (const up of ups) {
			up.setAttribute("height", `${L.unitH * rise.dollars}`);
			up.setAttribute("y", `${L.tokenY - 5 - L.unitH * rise.dollars}`);
		}
	};
	tl.set(ups, { opacity: 1 }, 9.0);
	tl.fromTo(
		rise,
		{ dollars: 0 },
		{
			dollars: 1,
			duration: 1,
			ease: "power2.out",
			immediateRender: false,
			onStart: renderRise,
			onUpdate: renderRise,
		},
		9.0,
	);
	// The price settles at 10.0. A bracket over the ten dollars then says what they add up to.
	d.trace(one<SVGPathElement>("gain-gap"), 10.3, { duration: 0.3 });
	show(mineChg, 10.3, "below", 0.3);

	// ——— question: the last trade, and what ten shares cost now ———
	tl.addLabel("question", 12.0);
	hide([heads[1], ...flat("slice")], 12.0);
	// The tag comes with its number, once the slice's price has gone: a moment earlier it would
	// label the outgoing figure.
	show(one("q-tag"), 12.3);
	word(one("q-big"), 12.3);
	show(one("q-line"), 13.05);

	// ——— quote: you trade against the book ———
	tl.addLabel("quote", 16.55);
	hide([one("q-tag"), one("q-line")], 16.55);
	// The question's number flies to the ladder and becomes the last price on it.
	d.carry(
		one<SVGGraphicsElement>("q-big"),
		one<SVGGraphicsElement>("last"),
		16.55,
		{ duration: 0.6, match: usd(alfaStockBook.last) },
	);
	show(heads[2], 16.9);
	// The rail and the tags come in as the number lands, then the levels, which stand a
	// full second before the first trade.
	fadeIn(
		[one("rail"), one("last-dot"), one("asks-tag"), one("bids-tag")],
		17.15,
	);
	fadeIn(levels, 17.85);
	{
		// The 50¢ bracket spans the two prices on the right of what you pay and what you get.
		const paid = one<SVGGraphicsElement>("p-pay").getBBox();
		const got = one<SVGGraphicsElement>("p-get").getBBox();
		const y1 = L.priceY(bestAsk);
		const y2 = L.priceY(bestBid);
		const x =
			Math.max(paid.x + paid.width, got.x + got.width) + (L.narrow ? 8 : 14);
		one("diff-gap").setAttribute("d", `M${x - 6} ${y1}H${x}V${y2}H${x - 6}`);
		const label = one("diff-label");
		if (L.narrow) {
			// A phone has no room beside the bracket: its label sits inside it, above the last price.
			label.setAttribute("x", `${x - 8}`);
			label.setAttribute("text-anchor", "end");
			label.setAttribute(
				"y",
				`${(y1 + L.priceY(alfaStockBook.last)) / 2 + L.type.small * 0.4}`,
			);
		} else {
			label.setAttribute("x", `${x + 10}`);
			label.setAttribute("y", `${(y1 + y2) / 2 + L.type.body * 0.36}`);
		}
	}
	// Buy 10: the order reaches the best ask and lands on the rail at that price. The tags
	// have been read and stand back.
	tl.to(
		[one("asks-tag"), one("bids-tag")],
		{ opacity: 0.35, duration: 0.3 },
		19.15,
	);
	tl.set(
		tick("ask", bestAsk),
		{ attr: { class: "wt-film-num wt-film-accent" } },
		19.15,
	);
	d.trace(one<SVGPathElement>("lead-ask"), 19.15, { duration: 0.4 });
	tl.to(
		took("ask", bestAsk),
		{ attr: { width: tookW(MINE) }, duration: 0.3 },
		19.55,
	);
	fadeIn(one("pt-pay"), 19.55);
	// What you pay settles at 20.15; the sale and its headline wait until 21.55 (1.4 s).
	fadeIn(one("p-pay"), 19.85);
	// Sell 10: the same, at the best bid. The trades stay done: each level keeps its sliver.
	d.swap(heads[2], heads[3], 21.55);
	tl.set(tick("ask", bestAsk), { attr: { class: "wt-film-num" } }, 21.55);
	tl.set(
		tick("bid", bestBid),
		{ attr: { class: "wt-film-num wt-film-accent" } },
		21.55,
	);
	d.trace(one<SVGPathElement>("lead-bid"), 21.55, { duration: 0.4 });
	tl.to(
		took("bid", bestBid),
		{ attr: { width: tookW(MINE) }, duration: 0.3 },
		21.95,
	);
	fadeIn(one("pt-get"), 21.95);
	// The sale and the 50¢ between the two arrive as one result. The last price stands
	// between them on the rail: neither trade happened at it.
	fadeIn(one("p-get"), 22.25);
	d.trace(one<SVGPathElement>("diff-gap"), 22.25, { duration: 0.3 });
	show(one("diff-label"), 22.25, "below", 0.3);
	show(one("y2-head"), 22.25);
	tl.set(tick("bid", bestBid), { attr: { class: "wt-film-num" } }, 22.25);
	tl.to(
		[tick("ask", bestAsk), tick("bid", bestBid)],
		{ opacity: 0.5, duration: 0.3 },
		22.25,
	);

	// The hero: 1,000 at once climb the asks, and their average price climbs the rail.
	hide(
		[
			heads[3],
			one("y2-head"),
			one("p-pay"),
			one("p-get"),
			one("diff-gap"),
			one("diff-label"),
			one("pt-pay"),
			one("pt-get"),
			one("lead-ask"),
			one("lead-bid"),
		],
		26.15,
	);
	// The asks are the subject now: the bids stand back, and the best ask's price comes up.
	tl.to(bidLevels, { opacity: 0.35, duration: 0.3 }, 26.15);
	// So does the last price, until the average is compared with it.
	tl.to(one("last"), { opacity: 0.5, duration: 0.3 }, 26.15);
	tl.to(tick("ask", bestAsk), { opacity: 1, duration: 0.3 }, 26.15);
	show(heads[4], 26.5, "below", 0.3);
	const avg = one<SVGTextElement>("p-avg");
	/** How many shares the big order has taken at a level so far. */
	const taken = (cents: number) => one(`n-ask-${cents}`);
	const avgTag = one("p-avg-tag");
	const avgPointer = one("pt-avg");
	/** What the 10-share buy had already taken of a level. */
	const before = (cents: number) =>
		(alfaStockBook.asks.find((at) => at.price === cents)?.size ?? 0) -
		(BUY10.asks.find((at) => at.price === cents)?.size ?? 0);
	// One count of filled shares drives the bars, the pointer and the average, so every frame
	// agrees: the average is what the shares taken so far cost, divided by how many they are.
	const climb = { filled: 0 };
	const renderClimb = () => {
		const filled = Math.round(climb.filled);
		let left = filled;
		let paid = 0;
		for (const fill of BUY_BIG.fills) {
			const n = Math.min(left, fill.size);
			paid += n * fill.price;
			left -= n;
			took("ask", fill.price).setAttribute(
				"width",
				`${tookW(before(fill.price) + n)}`,
			);
			taken(fill.price).textContent = count(n);
		}
		const at = filled ? paid / filled : BUY_BIG.fills[0].price;
		avg.textContent = price3(at);
		avgTag.textContent = d.t(averageOf(filled, L.narrow)).toUpperCase();
		avgPointer.setAttribute("d", `M${L.railX + 1.5} ${L.priceY(at)}l9 -6v12z`);
	};
	// Each level takes a full second, so its count can be read and the climb watched; the
	// average appears at the first level's price.
	const climbAt = [26.8, 27.95, 29.1];
	const climbFor = [1, 1, 1];
	let filledSoFar = 0;
	BUY_BIG.fills.forEach((fill, i) => {
		tl.fromTo(
			climb,
			{ filled: filledSoFar },
			{
				filled: filledSoFar + fill.size,
				duration: climbFor[i],
				ease: "power2.out",
				immediateRender: false,
				onStart: renderClimb,
				onUpdate: renderClimb,
			},
			climbAt[i],
		);
		filledSoFar += fill.size;
		// How many shares it takes here counts up with the bar.
		fadeIn(taken(fill.price), climbAt[i]);
		if (i === 0) return;
		// The level the order has reached comes up; the one it has emptied stands back, and
		// so does its count.
		tl.to(tick("ask", fill.price), { opacity: 1, duration: 0.3 }, climbAt[i]);
		tl.to(
			[
				tick("ask", BUY_BIG.fills[i - 1].price),
				taken(BUY_BIG.fills[i - 1].price),
			],
			{ opacity: 0.5, duration: 0.3 },
			climbAt[i],
		);
	});
	fadeIn([avgPointer, avgTag, avg], 26.8);
	// The climb settles at 30.1; the brackets lock on the average at 30.5 and it stands,
	// bright and still, until 32.9.
	d.lock(one<SVGGraphicsElement>("lock-avg"), 30.5, {
		around: [avgTag, avg],
		pad: L.narrow ? 8 : 10,
	});
	tl.addLabel("hero-lock", 30.5);
	tl.to(
		[
			tick("ask", BUY_BIG.fills[BUY_BIG.fills.length - 1].price),
			taken(BUY_BIG.fills[BUY_BIG.fills.length - 1].price),
		],
		{ opacity: 0.5, duration: 0.3 },
		30.5,
	);
	// After the hero: the stretch of rail from the last price up to that average.
	tl.to(one("last"), { opacity: 1, duration: 0.3 }, 32.9);
	d.trace(one<SVGPathElement>("over-gap"), 32.9, { duration: 0.4 });
	show(one("over-label"), 32.9, "below", 0.3);

	// ——— kinds: what the underlying is ———
	tl.addLabel("kinds", 37.0);
	hide(
		[
			heads[4],
			one("asks-tag"),
			one("bids-tag"),
			one("rail"),
			one("last-dot"),
			one("last"),
			...levels,
			one("pt-avg"),
			one("p-avg-tag"),
			one("p-avg"),
			one("lock-avg"),
			one("over-gap"),
			one("over-label"),
			...BUY_BIG.fills.map((fill) => one(`n-ask-${fill.price}`)),
		],
		37.0,
	);
	show(heads[5], 37.35);
	kindOrder.forEach((kind, i) => {
		show(one(`col-${kind}`), 37.35 + 0.12 * i, "below", 0.3);
	});
	tl.to(one("colbg-index"), { opacity: 1, duration: 0.4 }, 39.45);
	// The index is the subject now: the stock and the fund stand back.
	tl.to(
		[one("col-stock"), one("col-etf")],
		{ opacity: 0.45, duration: 0.3 },
		39.45,
	);
	d.lock(one<SVGGraphicsElement>("lock-index"), 39.45, {
		around: one("colbg-index"),
		pad: 4,
	});
	// The last column settles at 37.89, 1.56 s before the index comes into focus; that
	// focus settles at 39.9 and stands 1.55 s.

	// ——— claim ———
	tl.addLabel("claim", 41.45);
	hide(
		[
			heads[5],
			one("lock-index"),
			...kindOrder.map((kind) => one(`col-${kind}`)),
		],
		41.45,
	);
	word(one("z-big"), 41.85);
	show(one("z-sub"), 42.35);

	// ——— next ———
	tl.addLabel("next", 45.85);
	hide(kids("claim"), 45.85);
	d.close(45.85);
	return tl;
}

export const stocksAndPricesFilm: Film = {
	id: "stocks-and-prices",
	label: [
		`Stocks and prices, as a short film: a share as one of ALFA's ${count(SHARES)}, with your ${MINE} drawn as ten squares, where a $1 move is $${MINE} on them; then ALFA's last trade of ${usd(alfaStockBook.last)} and the question of what 10 shares cost now; the quote, where you buy 10 at the ask for ${usd(BUY10.notional)}, sell 10 at the bid for ${usd(SELL10.notional)}, and 1,000 at once run through three offers to an average of ${price3(AVERAGE)}; and a stock, an exchange-traded fund (ETF) drawn as its 500 stocks, and an index, which is only a number and whose options deliver cash`,
		`股票与价格短片：一股是 ALFA ${count(SHARES)} 股中的一份，你的 ${MINE} 股画成十个方块，涨 $1 它们就多 $${MINE}；然后是 ALFA 最新成交 ${usd(alfaStockBook.last)}，以及现在买 10 股要花多少；报价：买 10 股按卖价付 ${usd(BUY10.notional)}，卖 10 股按买价得 ${usd(SELL10.notional)}，一次买 1,000 股会吃掉三档卖单，均价 ${price3(AVERAGE)}；以及股票、画成 500 只股票的交易所交易基金（ETF）和指数，指数只是一个数，它的期权以现金结算`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Stocks and prices", "股票与价格"] },
		{ id: "slice", label: ["A share", "一股"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "quote", label: ["The quote", "报价"] },
		{ id: "kinds", label: ["Stock, ETF, index", "股票、ETF、指数"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
