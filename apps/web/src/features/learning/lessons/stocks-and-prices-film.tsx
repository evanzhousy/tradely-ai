import {
	ALFA,
	ALFA_SHARES_OUTSTANDING,
	alfaStockBook,
	type Copy,
	count,
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
	signTone,
	TitleCard,
	toneClass,
	Word,
} from "../walkthrough/film-kit";
import { textWidth } from "../walkthrough/text-measure";
import {
	companyValue,
	type Kind,
	kindOrder,
	kinds,
	tradeAgainst,
} from "./stocks-and-prices-model";

/*
 * Stocks and prices, as a film. This is the course's first lesson, so it says what a share is
 * before its question counts ten of them: one of 50 million slices of a $5 billion company,
 * so each $1 move is $10 on your 10 shares and $50 million on ALFA. Then ALFA's last trade,
 * $100.02, and the question: what do 10 shares cost right now? Every other film asks first;
 * here the question would use a word the learner has not met.
 *
 * The quote is a picture, not a table (a pilot, 2026-11-19). The book is a price ladder drawn
 * to scale: each level is a bar at the height of its price, as long as its size, so the
 * spread is a real gap and the last price sits inside it. A rail beside the ladder shows
 * where a trade lands. The question's $100.02 flies onto the rail. Buy 10: the pointer lands
 * at the $100.05 ask, $1,000.50. Sell 10: at the $100.00 bid, $1,000.00, 50¢ apart, with the
 * last price between them. Those trades stay done. The hero: 1,000 shares at once take the
 * asks one level after another, and their average climbs the rail to $100.061, 4.1¢ a share
 * over the last price. Only the prices in play are bright; sizes are bar lengths, not digits.
 * Last, a stock, an exchange-traded fund (ETF) and an index.
 *
 *   open      0–4        "Stocks and prices"
 *   slice     4–12       50M × $100 = $5B; each $1: $10 for you, $50M for ALFA
 *   question  12–16.55   last $100.02: what do 10 shares cost?
 *   quote     16.55–37.0 the ladder and the rail; buy 10: $1,000.50, sell 10: $1,000.00,
 *                        a bracket: 50¢; hero: buy 1,000, the average climbs to $100.061;
 *                        after it, the rail between the last price and that average
 *   kinds     37.0–41.45 stock, ETF, index; the index is a number, cash-settled
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
/** How far above the last price that average sits: "4.1¢". */
const OVER_LAST = `${(AVERAGE - alfaStockBook.last).toFixed(1)}¢`;
const ASKS = [...alfaStockBook.asks].reverse();
const BIDS = alfaStockBook.bids;
const MAX_SIZE = Math.max(
	...[...alfaStockBook.asks, ...alfaStockBook.bids].map((level) => level.size),
);
const PRICE_HIGH = Math.max(...alfaStockBook.asks.map((level) => level.price));
const PRICE_LOW = Math.min(...alfaStockBook.bids.map((level) => level.price));
/** Cents to "$100.061": the climbing average keeps three places all the way up. */
const price3 = (cents: number) => `$${(cents / 100).toFixed(3)}`;
const ROWS = ["buy", "settle"] as const;

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
	const colW = (room - (narrow ? 64 : room * 0.24)) / 3;
	const kindNoteY =
		H * 0.27 +
		frame.type.small * 2.2 +
		frame.type.head * 1.5 +
		frame.type.small * 1.6;
	const columnStep = (room - (narrow ? 64 : room * 0.24)) / 3;
	const trackedTagWidth = (text: string) =>
		textWidth(text, frame.type.small) +
		Math.max(0, [...text].length - 1) * frame.type.small * 0.12;
	// On phones the two glosses use the plain mono small face, without tag tracking.
	const etfPhoneGap =
		columnStep -
		(textWidth("EXCHANGE-TRADED", frame.type.small) +
			textWidth("A NUMBER", frame.type.small)) /
			2;
	const etfWideGap =
		columnStep -
		(trackedTagWidth("EXCHANGE-TRADED FUND") + trackedTagWidth("A NUMBER")) / 2;
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
		pair: narrow ? [0.27, 0.73] : [0.3, 0.7],
		colX: (i: number) =>
			margin +
			(narrow ? 64 : room * 0.24) +
			i * ((room - (narrow ? 64 : room * 0.24)) / 3),
		colW,
		kindNoteY,
		kindNoteLineStep: frame.type.small * 1.35,
		etfGlossPhoneFits: etfPhoneGap >= 6,
		etfGlossWideFits: etfWideGap >= 10,
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
	/** How far the 1,000 shares' average sits above the last price. */
	overLast: [`${OVER_LAST} over last`, `每股高 ${OVER_LAST}`],
	avg: [`average of ${count(BIG)} shares`, `${count(BIG)} 股的均价`],
	avgShort: [`avg of ${count(BIG)}`, `${count(BIG)} 股的均价`],
	kindsHead: [
		"Stock, ETF, index: what options deliver.",
		"股票、ETF、指数：期权如何交割？",
	],
	kindsHeadShort: [
		"Stock, ETF, index: what options deliver.",
		"股票、ETF、指数：期权如何交割？",
	],
	buyableBoth: ["Yes, both", "两者均可"],
	indexNumber: ["a number", "一个数"],
	etfFund: ["exchange-traded fund", "交易所交易基金"],
	rowLabels: {
		buy: ["buy it?", "能买吗"],
		settle: ["an option delivers", "期权交割"],
	},
	/** On a phone the row labels have 64 px beside the columns. */
	rowLabelsShort: {
		buy: ["buy it?", "能买吗"],
		settle: ["delivers", "交割"],
	},
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

			{/* A share and the company. */}
			{headline("s-head", copy.sliceHead, copy.sliceHeadShort)}
			{headline("m-head", copy.moveHead, copy.moveHeadShort)}
			<g data-f="slice">
				<Word
					name="px-tag"
					x={W / 2}
					y={H * 0.3}
					size={T.small}
					className="wt-film-tag"
				>
					{t(["ALFA · open", "ALFA · 开盘"]).toUpperCase()}
				</Word>
				<Word
					name="px"
					x={W / 2}
					y={H * 0.3 + T.title * 1.5}
					size={T.title * 1.3}
					className="wt-film-num wt-film-accent"
				>
					{usd(OPEN)}
				</Word>
				{(
					[
						["mine", copy.yours, copy.yours],
						["co", copy.company, copy.companyShort],
					] as const
				).map(([name, tag, short], i) => (
					<g key={name}>
						<Word
							name={`${name}-tag`}
							x={W * L.pair[i]}
							y={H * 0.58}
							size={T.small}
							className="wt-film-tag"
						>
							{t(narrow ? short : tag).toUpperCase()}
						</Word>
						<Word
							name={`${name}-val`}
							x={W * L.pair[i]}
							y={H * 0.58 + T.num * 1.3}
							size={T.num}
							className="wt-film-num"
						>
							{name === "mine"
								? usd(MINE * OPEN, 0)
								: companyValue(SHARES * OPEN, locale)}
						</Word>
						<Word
							name={`${name}-chg`}
							x={W * L.pair[i]}
							y={H * 0.58 + T.num * 1.3 + T.body * 1.9}
							size={T.body}
							className="wt-film-num wt-film-dim"
						>
							{signedUsd(0, 0)}
						</Word>
					</g>
				))}
			</g>

			{/* The book, as a price ladder to scale, and the rail where trades land. */}
			{headline("b-head", copy.bookHead, copy.bookHeadShort)}
			{headline("y-head", copy.buyHead, copy.buyHeadShort)}
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
			{pointer("pt-avg", L.priceY(BUY_BIG.fills[0].price))}
			<text
				data-f="p-avg-tag"
				x={heroX}
				y={heroBase - heroFig * 0.78 - T.small * 0.9}
				className="wt-film-tag"
				style={{ fontSize: T.small }}
			>
				{t(narrow ? copy.avgShort : copy.avg).toUpperCase()}
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

			{/* Three kinds of underlying. */}
			{headline("k-head", copy.kindsHead, copy.kindsHeadShort)}
			<g data-f="kinds">
				{kindOrder.map((kind: Kind, i) => (
					<g key={kind} data-f={`col-${kind}`}>
						<rect
							data-f={`colbg-${kind}`}
							x={L.colX(i) + 4}
							y={H * 0.27}
							width={L.colW - 8}
							height={H * 0.62}
							rx={12}
							className="wt-focus-shape"
						/>
						<text
							x={L.colX(i) + L.colW / 2}
							y={H * 0.27 + T.small * 2.2}
							textAnchor="middle"
							className="wt-film-tag"
							style={{ fontSize: T.small }}
						>
							{t(kinds[kind].kind).toUpperCase()}
						</text>
						<text
							x={L.colX(i) + L.colW / 2}
							y={H * 0.27 + T.small * 2.2 + T.head * 1.5}
							textAnchor="middle"
							className="wt-film-num"
							style={{ fontSize: narrow ? T.body : T.head }}
						>
							{kinds[kind].name}
						</text>
						{kind === "index" ? (
							<text
								data-f="index-note"
								x={L.colX(i) + L.colW / 2}
								y={L.kindNoteY}
								textAnchor="middle"
								className={narrow ? "wt-film-type wt-film-dim" : "wt-film-tag"}
								style={{ fontSize: T.small }}
							>
								{narrow
									? t(copy.indexNumber)
									: t(copy.indexNumber).toUpperCase()}
							</text>
						) : kind === "etf" ? (
							(narrow || L.etfGlossWideFits) && (
								<text
									data-f="etf-note"
									x={L.colX(i) + L.colW / 2}
									y={L.kindNoteY}
									textAnchor="middle"
									className={
										narrow ? "wt-film-type wt-film-dim" : "wt-film-tag"
									}
									style={{ fontSize: T.small }}
								>
									{(narrow && locale === "en"
										? ["exchange-traded", "fund"]
										: narrow
											? [t(copy.etfFund)]
											: [t(copy.etfFund).toUpperCase()]
									).map((line, lineIndex) => (
										<tspan
											key={line}
											x={L.colX(i) + L.colW / 2}
											dy={lineIndex === 0 ? 0 : L.kindNoteLineStep}
										>
											{line}
										</tspan>
									))}
								</text>
							)
						) : null}
						{ROWS.map((row, r) =>
							row === "buy" && kind !== "index" ? null : (
								<text
									key={row}
									data-f={`cell-${kind}-${row}`}
									x={L.colX(i) + L.colW / 2}
									y={H * (0.52 + r * 0.13)}
									textAnchor="middle"
									className="wt-film-type"
									style={{ fontSize: rowText }}
								>
									{t(kinds[kind][row])}
								</text>
							),
						)}
					</g>
				))}
				{ROWS.map((row, r) => (
					<text
						key={row}
						x={margin}
						y={H * (0.52 + r * 0.13)}
						className="wt-film-type wt-film-dim"
						style={{ fontSize: T.body }}
					>
						{t(narrow ? copy.rowLabelsShort[row] : copy.rowLabels[row])}
					</text>
				))}
				<text
					data-f="cell-buyable-both"
					x={(L.colX(0) + L.colW / 2 + L.colX(1) + L.colW / 2) / 2}
					y={H * 0.52}
					textAnchor="middle"
					className="wt-film-type"
					style={{ fontSize: rowText }}
				>
					{t(copy.buyableBoth)}
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
	const { width: W, locale } = context;
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
	const coVal = one<SVGTextElement>("co-val");
	const mineChg = one<SVGTextElement>("mine-chg");
	const coChg = one<SVGTextElement>("co-chg");
	const dollars = (v: number) => usd(Math.round(v), 2);
	const whole = (v: number) => usd(Math.round(v), 0);
	const signed = (v: number) => signedUsd(Math.round(v), 0);
	const signedMillions = (v: number) => {
		const m = Math.round(v / 100 / 1_000_000);
		return locale === "zh"
			? `${m < 0 ? "−" : m > 0 ? "+" : ""}${Math.abs(m * 100)} 万美元`
			: `${m < 0 ? "−" : m > 0 ? "+" : ""}$${Math.abs(m)} million`;
	};
	const company = (v: number) => companyValue(Math.round(v), locale);
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
	const kindText = [
		...flat("kinds").filter((el) => el.tagName === "text"),
		one("index-note"),
		one("cell-buyable-both"),
	].filter((el, i, all) => all.indexOf(el) === i);
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
		one("pt-avg"),
		one("p-avg-tag"),
		one("p-avg"),
		one("lock-avg"),
		one("over-gap"),
		one("over-label"),
		one("lock-index"),
		...kindOrder.flatMap((kind) => [one(`col-${kind}`), one(`colbg-${kind}`)]),
		...kindText,
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
	show([one("px-tag"), px], 4.95);
	show([one("mine-tag"), mineVal], 5.55);
	show([one("co-tag"), coVal], 5.95);
	// Each $1 move, under its own headline.
	d.swap(heads[0], heads[1], 8.15);
	hide(one("px-tag"), 7.85);
	show([mineChg, coChg], 8.15);
	tl.set(
		[mineChg, coChg],
		{ attr: { class: "wt-film-num wt-film-dim" } },
		8.15,
	);
	// Start together once the explanatory headline has settled; each count lasts one second.
	d.count(px, OPEN + 100, 9.0, dollars, OPEN, 1);
	d.count(mineVal, MINE * (OPEN + 100), 9.0, whole, MINE * OPEN, 1);
	d.count(coVal, SHARES * (OPEN + 100), 9.0, company, SHARES * OPEN, 1);
	// A rounded zero stays dim; the sign colour follows the figure actually being read.
	[
		{ target: mineChg, to: MINE * 100, format: signed, unit: 100 },
		{
			target: coChg,
			to: SHARES * 100,
			format: signedMillions,
			unit: 100_000_000,
		},
	].forEach(({ target, to, format, unit }) => {
		const state = { value: 0 };
		tl.fromTo(
			state,
			{ value: 0 },
			{
				value: to,
				duration: 1,
				ease: "power2.out",
				immediateRender: false,
				onUpdate: () => {
					const tone = signTone(Math.round(Math.round(state.value) / unit));
					target.textContent = format(state.value);
					target.setAttribute(
						"class",
						`wt-film-num ${tone ? toneClass[tone] : "wt-film-dim"}`,
					);
				},
			},
			9.0,
		);
	});

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
	tl.to(tick("ask", bestAsk), { opacity: 1, duration: 0.3 }, 26.15);
	show(heads[4], 26.5, "below", 0.3);
	const avg = one<SVGTextElement>("p-avg");
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
		}
		const at = filled ? paid / filled : BUY_BIG.fills[0].price;
		avg.textContent = price3(at);
		avgPointer.setAttribute("d", `M${L.railX + 1.5} ${L.priceY(at)}l9 -6v12z`);
	};
	// The first level is taken in half a second and the average appears at its price; each
	// further level takes a second, so the climb can be watched.
	const climbAt = [26.8, 27.9, 29.1];
	const climbFor = [0.5, 1, 1];
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
		if (i === 0) return;
		// The level the order has reached comes up; the one it has emptied stands back.
		tl.to(tick("ask", fill.price), { opacity: 1, duration: 0.3 }, climbAt[i]);
		tl.to(
			tick("ask", BUY_BIG.fills[i - 1].price),
			{ opacity: 0.5, duration: 0.3 },
			climbAt[i],
		);
	});
	fadeIn([avgPointer, one("p-avg-tag"), avg], 26.8);
	// The climb settles at 30.1; the brackets lock on the average at 30.5 and it stands,
	// bright and still, until 32.9.
	d.lock(one<SVGGraphicsElement>("lock-avg"), 30.5, {
		around: [one("p-avg-tag"), avg],
		pad: L.narrow ? 8 : 10,
	});
	tl.addLabel("hero-lock", 30.5);
	tl.to(
		tick("ask", BUY_BIG.fills[BUY_BIG.fills.length - 1].price),
		{ opacity: 0.5, duration: 0.3 },
		30.5,
	);
	// After the hero: the stretch of rail from the last price up to that average.
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
		],
		37.0,
	);
	show(heads[5], 37.35);
	show(kindText, 37.35, "below", 0.3);
	kindOrder.forEach((kind, i) => {
		show(one(`col-${kind}`), 37.35 + 0.12 * i, "below", 0.3);
	});
	tl.to(one("colbg-index"), { opacity: 1, duration: 0.4 }, 39.45);
	d.lock(one<SVGGraphicsElement>("lock-index"), 39.45, {
		around: one("colbg-index"),
		pad: 4,
	});
	// The last column settles at 37.89: 3.56 s to exit, 1.56 s to index focus.
	// The headline retains 4.1 s and settles at 37.85, 1.6 s before the index focus.
	// That focus settles at 39.9, leaving another 1.55 s of quiet comparison.

	// ——— claim ———
	tl.addLabel("claim", 41.45);
	hide(
		[
			heads[5],
			one("lock-index"),
			...kindOrder.map((kind) => one(`col-${kind}`)),
			...flat("kinds").filter((el) => el.tagName === "text"),
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
		`Stocks and prices, as a short film: a share as one of ${count(SHARES)} slices of a company worth ${companyValue(SHARES * OPEN, "en")}, where a $1 move is $${MINE} on your ${MINE} shares; then ALFA's last trade of ${usd(alfaStockBook.last)} and the question of what 10 shares cost now; the quote, where you buy 10 at the ask for ${usd(BUY10.notional)}, sell 10 at the bid for ${usd(SELL10.notional)}, and 1,000 at once run through three offers to an average of ${price3(AVERAGE)}; and a stock, an exchange-traded fund (ETF), and an index, the last a number you can't buy whose options deliver cash`,
		`股票与价格短片：一股是 ${count(SHARES)} 份中的一份，公司估值 ${companyValue(SHARES * OPEN, "zh")}，涨 $1 你的 ${MINE} 股就多 $${MINE}；然后是 ALFA 最新成交 ${usd(alfaStockBook.last)}，以及现在买 10 股要花多少；报价：买 10 股按卖价付 ${usd(BUY10.notional)}，卖 10 股按买价得 ${usd(SELL10.notional)}，一次买 1,000 股会吃掉三档卖单，均价 ${price3(AVERAGE)}；以及股票、交易所交易基金（ETF）和指数，指数是一个不能买入的数，它的期权以现金结算`,
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
