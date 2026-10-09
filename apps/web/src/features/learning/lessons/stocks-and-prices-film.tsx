import type { Level } from "@/content/world";
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
	TitleCard,
	Word,
} from "../walkthrough/film-kit";
import {
	companyValue,
	type Kind,
	kindOrder,
	kinds,
	tradeAgainst,
} from "./stocks-and-prices-model";

/*
 * Stocks and prices, as a film. It opens on ALFA's last trade, $100.02, and asks what 10
 * shares cost right now. First what a share is: one of 50 million slices of a $5 billion
 * company, so each $1 move is $10 on your 10 shares and $50 million on ALFA. Then the
 * quote: buy 10 and the ticket lands on what you pay, $1,000.50 at the $100.05 ask; sell 10
 * and it lands beside it on what you get, $1,000.00 at the $100.00 bid: 50¢ apart, and
 * neither is the last trade. Those trades stay done. The hero: 1,000 shares at once climb
 * the offers that are left, one level after another, to an average of $100.061. Last, a
 * stock, an ETF and an index.
 *
 *   open      0–4        "Stocks and prices"
 *   question  4–9        last $100.02: what do 10 shares cost?
 *   slice     9–16.55    50M × $100 = $5B; each $1: $10 for you, $50M for ALFA
 *   quote     16.55–37   the book; buy 10: $1,000.50, sell 10: $1,000.00, a bracket: 50¢
 *                        more to buy; hero: buy 1,000; after it, the same 1,000 at the last
 *                        price, and what the sweep added
 *   kinds     37–41.45   stock, ETF, index; the index is a number, cash-settled
 *   claim     41.45–45.85 you trade against the quote, not the last price
 *   next      45.85–47.45 Next: options, a paid right
 */

const END = 47.45;
const OPEN = ALFA.open;
const MINE = 10;
const SHARES = ALFA_SHARES_OUTSTANDING;
const BUY10 = tradeAgainst("buy", 10);
const SELL10 = tradeAgainst("sell", 10);
const PER_SHARE_GAP = BUY10.notional / MINE - SELL10.notional / MINE;
const BIG = 1_000;
/** The 1,000 climb the book the 10-share trades left: a trade never un-happens. */
const BUY_BIG = tradeAgainst("buy", BIG, BUY10);
/** The same 1,000 shares at the last price, and what climbing the book added to that. */
const AT_LAST = BIG * alfaStockBook.last;
const OVER_LAST = BUY_BIG.notional - AT_LAST;
const ASKS = [...alfaStockBook.asks].reverse();
const BIDS = alfaStockBook.bids;
const MAX_SIZE = Math.max(
	...[...alfaStockBook.asks, ...alfaStockBook.bids].map((level) => level.size),
);
/** Cents to "$100.05"; a fraction of a cent keeps three places. */
const price = (cents: number) =>
	Number.isInteger(cents) ? usd(cents) : `$${(cents / 100).toFixed(3)}`;
const ROWS = ["holds", "buy", "settle"] as const;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const rowStep = H * 0.07;
	const bookTop = H * (narrow ? 0.29 : 0.27);
	const priceW = narrow ? 56 : width * 0.12;
	// The book takes the left of the frame and what you pay sits beside it, on a phone too.
	const bookW = room * (narrow ? 0.6 : 0.56);
	const panelX = margin + room * (narrow ? 0.65 : 0.62);
	return {
		...frame,
		rowStep,
		rowH: rowStep * 0.78,
		askY: (i: number) => bookTop + i * rowStep,
		bidY: (i: number) => bookTop + (ASKS.length + i) * rowStep + rowStep * 0.5,
		spreadY: bookTop + ASKS.length * rowStep + rowStep * 0.12,
		bookX: margin,
		priceW,
		barX: margin + priceW + 10,
		barMax: bookW - priceW - 10 - (narrow ? 50 : 70),
		bookW,
		panelX,
		// On a phone what you pay sits under the book, below its "bids" tag.
		panelY: narrow
			? bookTop +
				(ASKS.length + BIDS.length) * rowStep +
				rowStep * 0.5 +
				frame.type.small * 3.2
			: bookTop,
		panelW: room * (narrow ? 0.35 : 0.38),
		pair: narrow ? [0.27, 0.73] : [0.3, 0.7],
		colX: (i: number) =>
			margin +
			(narrow ? 64 : room * 0.24) +
			i * ((room - (narrow ? 64 : room * 0.24)) / 3),
		colW: (room - (narrow ? 64 : room * 0.24)) / 3,
	};
}

const copy = {
	title: ["Stocks and prices", "股票与价格"],
	titleSub: ["what options are built on", "期权的基础"],
	qTag: ["ALFA · last trade", "ALFA · 最新成交"],
	qLine: [
		`You buy ${MINE} shares right now. What do they cost?`,
		"你现在立即买入 10 股。要花多少？",
	],
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
	buyHead: [
		"Buy 10 and sell 10: two prices.",
		"买 10 股和卖 10 股：两个价格。",
	],
	buyHeadShort: [
		"Buy 10, sell 10: two prices.",
		"买 10 股、卖 10 股：两个价。",
	],
	bigHead: [
		`Buy ${count(BIG)} at once: you climb the book.`,
		`一次买 ${count(BIG)} 股：一档档往上买。`,
	],
	bigHeadShort: [
		`Buy ${count(BIG)}: you climb the book.`,
		`买 ${count(BIG)} 股：逐档往上买。`,
	],
	diff: [
		`${Math.round(BUY10.notional - SELL10.notional)}¢ more to buy.`,
		`买比卖多付 ${Math.round(BUY10.notional - SELL10.notional)} 美分。`,
	],
	asks: ["asks · sellers", "卖价 · 卖方"],
	bids: ["bids · buyers", "买价 · 买方"],
	last: ["last", "最新"],
	fill: ["10 shares · you pay", "10 股 · 你付出"],
	fillBig: ["1,000 shares · you pay", "1,000 股 · 你付出"],
	fillBigShort: ["1,000 · you pay", "1,000 股 · 你付出"],
	/** On a phone the two slots share one line. */
	fillShort: ["10 · you pay", "10 股 · 你付出"],
	getShort: ["10 · you get", "10 股 · 你收到"],
	get: ["10 shares · you get", "10 股 · 你收到"],
	/** What the sweep added to the same shares at the last price. */
	overLast: ["over last", "高于最新价"],
	avg: ["average", "均价"],
	avgShort: ["avg", "均价"],
	kindsHead: [
		"Stock, ETF, index: how options settle.",
		"股票、ETF、指数：期权如何交割？",
	],
	kindsHeadShort: [
		"Stock, ETF, index: how options settle.",
		"股票、ETF、指数：期权如何交割？",
	],
	rowLabels: {
		holds: ["holds", "持有"],
		buy: ["buy it?", "能买吗"],
		settle: ["options settle in", "期权交割"],
	},
	/** On a phone the row labels have 64 px beside the columns. */
	rowLabelsShort: {
		holds: ["holds", "持有"],
		buy: ["buy it?", "能买吗"],
		settle: ["settles in", "交割"],
	},
	claimBig: [
		"You trade against the quote, not the last price.",
		"你按报价成交，而不是按最新成交价。",
	],
	claimSub: ["Buy at the ask, sell at the bid.", "按卖价买，按买价卖。"],
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
	const lastY = narrow
		? L.askY(0) - T.small * 0.9
		: L.spreadY + L.rowStep * 0.2 - 5;
	/** A phone's after-beat: beside the bids, the free space nearest the hero. */
	const phoneVsY = L.bidY(0) + T.small;
	const level = (
		side: "ask" | "bid",
		i: number,
		at: { price: number; size: number },
	) => {
		const y = side === "ask" ? L.askY(i) : L.bidY(i);
		const key = `${side}-${at.price}`;
		return (
			<g key={key} data-f={`lv-${key}`}>
				<rect
					data-f={`hit-${key}`}
					x={L.bookX}
					y={y}
					width={L.bookW}
					height={L.rowH}
					rx={7}
					className="wt-focus-shape"
				/>
				<text
					x={L.bookX + L.priceW}
					y={y + L.rowH / 2 + rowText * 0.36}
					textAnchor="end"
					className="wt-film-num"
					style={{ fontSize: rowText }}
				>
					{usd(at.price)}
				</text>
				<rect
					data-f={`bar-${key}`}
					x={L.barX}
					y={y + L.rowH * 0.2}
					width={(at.size / MAX_SIZE) * L.barMax}
					height={L.rowH * 0.6}
					rx={3}
					className="wt-film-bar"
					data-tone={side === "ask" ? "loss" : "gain"}
				/>
				<text
					data-f={`size-${key}`}
					x={L.bookX + L.bookW - 8}
					y={y + L.rowH / 2 + rowText * 0.36}
					textAnchor="end"
					className="wt-film-num wt-film-dim"
					style={{ fontSize: rowText }}
				>
					{count(at.size)}
				</text>
			</g>
		);
	};
	// What you pay and what you get, in two slots: side by side under the book on a phone,
	// stacked beside it on a desktop. The hero's average takes the second slot.
	const fig = narrow ? T.num * 0.8 : T.num;
	const heroFig = narrow ? T.num * 1.25 : T.num * 1.3;
	const slotX = (k: number) => (narrow ? margin + k * room * 0.5 : L.panelX);
	const tagY = (k: number) =>
		L.panelY + T.small * 1.4 + (narrow ? 0 : k * (fig * 1.25 + T.small * 2.4));
	const valY = (k: number, size = fig) => tagY(k) + size * 1.15;
	// The desktop stack leaves a separate division row above the average and its lock.
	const averageGap = narrow ? 0 : T.body * 3.5;
	// Under the locked average, clear of its brackets.
	const diffBaseY = valY(1, heroFig) + heroFig * 0.3 + 10 + T.body * 1.5;
	const vsY = diffBaseY + averageGap;
	const mathX = narrow ? L.bookX + L.bookW + 14 : L.panelX;
	const diffY = narrow ? phoneVsY : diffBaseY;
	const subtractionY = narrow ? phoneVsY + T.small * 0.9 : vsY + T.body * 1.9;
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
				{/* Once the price moves it is no longer the open. */}
				<Word
					name="px-tag-moving"
					x={W / 2}
					y={H * 0.3}
					size={T.small}
					className="wt-film-tag"
				>
					{t(["ALFA · price", "ALFA · 股价"]).toUpperCase()}
				</Word>
				<Word
					name="px-tag-up"
					x={W / 2}
					y={H * 0.3}
					size={T.small}
					className="wt-film-tag"
				>
					{t(["ALFA · up $1", "ALFA · 涨 $1"]).toUpperCase()}
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
							size={narrow ? T.num * 0.8 : T.num}
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
							className="wt-film-num"
						>
							{signedUsd(0, 0)}
						</Word>
					</g>
				))}
			</g>

			{/* The book. */}
			{headline("b-head", copy.bookHead, copy.bookHeadShort)}
			{headline("y-head", copy.buyHead, copy.buyHeadShort)}
			{/* The answer, made by the two tickets side by side. */}
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
					x={L.bookX}
					y={L.askY(0) - T.small * 0.9}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.asks).toUpperCase()}
				</text>
				{ASKS.map((at, i) => level("ask", i, at))}
				<path
					data-f="spread"
					d={`M${L.bookX} ${L.spreadY + L.rowStep * 0.2}H${L.bookX + L.bookW}`}
					className="wt-film-link"
				/>
				<text
					data-f="last"
					// A phone's rows leave no room on the spread line: it moves beside the book, on the
					// asks' tag line, above where the tickets set off.
					x={narrow ? L.bookX + L.bookW + 14 : L.bookX + L.bookW}
					y={lastY}
					textAnchor={narrow ? "start" : "end"}
					className="wt-film-num wt-film-dim"
					style={{ fontSize: T.small }}
				>
					{`${t(copy.last)} ${usd(alfaStockBook.last)}`}
				</text>
				{BIDS.map((at, i) => level("bid", i, at))}
				<text
					data-f="bids-tag"
					x={L.bookX}
					y={L.bidY(BIDS.length - 1) + L.rowH + T.small * 1.4}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.bids).toUpperCase()}
				</text>
			</g>
			<g data-f="panel">
				{(
					[
						["p-pay", narrow ? copy.fillShort : copy.fill, 0],
						["p-pay-big", narrow ? copy.fillBigShort : copy.fillBig, 0],
						["p-get", narrow ? copy.getShort : copy.get, 1],
						["p-avg-tag", copy.avg, 1],
					] as const
				).map(([name, tag, k]) => (
					<text
						key={name}
						data-f={name}
						x={slotX(k)}
						y={tagY(k) + (name === "p-avg-tag" ? averageGap : 0)}
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(tag).toUpperCase()}
					</text>
				))}
			</g>
			<Word
				name="p-total"
				x={slotX(0)}
				y={valY(0)}
				size={fig}
				anchor="start"
				className="wt-film-num wt-film-accent"
			>
				{usd(0)}
			</Word>
			{/* A desktop handoff uses the subtraction's type in a lane left of the hero. */}
			<Word
				name="p-transfer"
				x={slotX(0)}
				y={valY(0)}
				size={T.body}
				anchor="start"
				className="wt-film-num wt-film-accent"
			>
				{usd(BUY_BIG.notional)}
			</Word>
			<Word
				name="p-sell"
				x={slotX(1)}
				y={valY(1)}
				size={fig}
				anchor="start"
				className="wt-film-num wt-film-accent"
			>
				{usd(0)}
			</Word>
			{/* Build gives the division its own row, 12 px below the settled numerator. */}
			<Word
				name="p-divisor"
				x={slotX(0)}
				y={valY(0) + T.body * (narrow ? 1.8 : 1.05)}
				size={T.body}
				anchor="start"
				className="wt-film-num wt-film-accent"
			>
				{`÷ ${count(BUY_BIG.filled)}`}
			</Word>
			{/* The hero: the average price of 1,000 shares, the loudest figure on stage. */}
			<Word
				name="p-avg"
				x={slotX(1)}
				y={valY(1, heroFig) + averageGap}
				size={heroFig}
				anchor="start"
				className="wt-film-num wt-film-accent"
			>
				{price(BUY_BIG.notional / BUY_BIG.filled)}
			</Word>
			{/* The 50¢ between what you pay and what you get: drawn when the build has measured
			    both figures as they will read. */}
			<path data-f="diff-gap" className="wt-film-gap" />
			<text
				data-f="diff-label"
				className="wt-film-num wt-film-loss"
				style={{ fontSize: narrow ? T.small * 1.15 : T.body }}
			>
				{`${Math.round(BUY10.notional - SELL10.notional)}¢`}
			</text>
			<text
				data-f="diff-times"
				x={mathX}
				y={diffY + T.body * 5.9}
				className="wt-film-num wt-film-loss"
				style={{ fontSize: narrow ? T.small * 1.15 : T.body }}
			>
				{`${PER_SHARE_GAP}¢ × ${MINE} = ${Math.round(BUY10.notional - SELL10.notional)}¢`}
			</text>
			{/* The quote's per-share difference, then the ten-share difference below the
			    tickets. All results are settled; neither side of an equation counts. */}
			{[
				["diff-ask", usd(BUY10.notional / MINE)],
				["diff-bid", `− ${usd(SELL10.notional / MINE)}`],
				["diff-unit", `= ${PER_SHARE_GAP}¢ ${t(["/ share", "/ 股"])}`],
			].map(([name, text], i) => (
				<Word
					key={name}
					name={name}
					x={mathX}
					y={diffY + (i === 2 ? 4 : i * 1.9) * T.body}
					size={T.body}
					anchor="start"
					className={`wt-film-num ${i === 2 ? "wt-film-loss" : "wt-film-dim"}`}
				>
					{text}
				</Word>
			))}
			<path
				data-f="diff-rule"
				d={`M${mathX} ${diffY + T.body * 2.65}h${T.body * 6.8}`}
				className="wt-film-gap"
			/>
			{/* After the hero, the same 1,000 shares at the last price. A phone has room for it
			    only beside the book, under the "last" tag it extends. */}
			<g data-f="vs-last">
				{narrow ? (
					[`${t(copy.last)} × ${count(BIG)}`, `− ${usd(AT_LAST, 0)}`].map(
						(line, i) => (
							<text
								key={line}
								data-f={i ? "vs-eq" : "vs-x"}
								x={L.bookX + L.bookW + 14}
								y={i ? subtractionY + T.body * 1.5 : phoneVsY - T.small * 1.9}
								className={i ? "wt-film-num" : "wt-film-num wt-film-dim"}
								style={{ fontSize: i ? T.body : T.small }}
							>
								{line}
							</text>
						),
					)
				) : (
					<text
						data-f="vs-calc"
						x={L.panelX}
						y={vsY}
						className="wt-film-num wt-film-dim"
						style={{ fontSize: T.body }}
					>
						{`${count(BIG)} × `}
						<tspan className="wt-film-accent">{`${t(copy.last)} ${usd(alfaStockBook.last)}`}</tspan>
						{` = ${usd(AT_LAST, 0)}`}
					</text>
				)}
			</g>
			<Word
				name="vs-paid"
				x={mathX}
				y={subtractionY}
				size={T.body}
				anchor="start"
				className="wt-film-num wt-film-dim"
			>
				{usd(BUY_BIG.notional)}
			</Word>
			{!narrow ? (
				<Word
					name="vs-minus"
					x={mathX + T.body * 7.4}
					y={subtractionY}
					size={T.body}
					anchor="start"
					className="wt-film-num wt-film-dim"
				>
					{`− ${usd(AT_LAST, 0)}`}
				</Word>
			) : null}
			<path
				data-f="vs-rule"
				d={
					narrow
						? `M${mathX} ${subtractionY + T.body * 2.3}h${T.body * 8.1}`
						: `M${mathX} ${subtractionY + T.body * 0.45}h${T.body * 13.7}`
				}
				className="wt-film-gap"
			/>
			<Word
				name="p-over"
				x={narrow ? mathX : mathX + T.body * 14.5}
				y={narrow ? subtractionY + T.body * 3.7 : subtractionY}
				size={T.body}
				anchor="start"
				className="wt-film-num wt-film-loss"
			>
				{`= ${signedUsd(OVER_LAST, 2)}`}
			</Word>
			<text
				data-f="p-over-tag"
				x={narrow ? mathX : mathX + T.body * 14.5}
				y={
					narrow
						? subtractionY + T.body * 3.7 + T.small * 1.6
						: subtractionY + T.small * 1.8
				}
				className="wt-film-tag"
				style={{ fontSize: T.small }}
			>
				{t(copy.overLast).toUpperCase()}
			</text>
			{/* An order leaves the book as a ticket at the level it takes. */}
			{(
				[
					["chip-buy", "ask", ASKS.length - 1, BUY10.fills[0]?.price ?? 0],
					["chip-sell", "bid", 0, SELL10.fills[0]?.price ?? 0],
				] as const
			).map(([name, side, i, cents]) => {
				const y = side === "ask" ? L.askY(i) : L.bidY(i);
				// Born just right of the book, clear of the size that is counting down and of
				// the brackets on its row.
				return (
					<text
						key={name}
						data-f={name}
						x={L.bookX + L.bookW + 14}
						y={y + L.rowH / 2 + rowText * 0.36}
						textAnchor="start"
						className="wt-film-num wt-film-accent wt-halo"
						style={{ fontSize: rowText }}
					>
						{`10 @ ${usd(cents)}`}
					</text>
				);
			})}
			{/* Fitted when they lock: the level an order takes, the index column. */}
			<Brackets name="lock-row" />
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
						{ROWS.map((row, r) => (
							<text
								key={row}
								data-f={`cell-${kind}-${row}`}
								x={L.colX(i) + L.colW / 2}
								y={H * (0.52 + r * 0.13)}
								textAnchor="middle"
								className="wt-film-type"
								style={{ fontSize: rowText }}
							>
								{t(
									row === "holds"
										? kind === "index"
											? ["a number", "一个数"]
											: kinds[kind].holds
										: kinds[kind][row],
								)}
							</text>
						))}
					</g>
				))}
				{ROWS.map((row, r) => (
					<text
						key={row}
						x={margin}
						y={H * (0.52 + r * 0.13)}
						className="wt-film-type wt-film-dim"
						style={{ fontSize: narrow ? T.small : T.body }}
					>
						{t(narrow ? copy.rowLabelsShort[row] : copy.rowLabels[row])}
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
	const total = one<SVGTextElement>("p-total");
	const lockRow = one<SVGGraphicsElement>("lock-row");
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
	const hit = (side: "ask" | "bid", cents: number) =>
		one<SVGGraphicsElement>(`hit-${key(side, cents)}`);
	const bar = (side: "ask" | "bid", cents: number) =>
		one(`bar-${key(side, cents)}`);
	const size = (side: "ask" | "bid", cents: number) =>
		one<SVGTextElement>(`size-${key(side, cents)}`);
	const levels = [
		...ASKS.map((at) => one(`lv-${key("ask", at.price)}`)),
		...BIDS.map((at) => one(`lv-${key("bid", at.price)}`)),
	];
	const heads = [
		"s-head",
		"m-head",
		"b-head",
		"y-head",
		"y2-head",
		"g-head",
		"k-head",
	].map((name) => one(name));
	/**
	 * Takes `fills` off one side of the book, one level after another: brackets lock on the
	 * level, it lights and shrinks, and with `paid` one filled-quantity state drives the
	 * remaining size, bar and paid total together. The book comes back at `restore`.
	 */
	const take = (
		side: "ask" | "bid",
		fills: readonly { price: number; size: number }[],
		time: number,
		/** When the book refills; null leaves the taken levels taken (a trade never un-happens). */
		restore: number | null,
		{
			step = 0.4,
			duration = Math.min(step, 0.4),
			bracket = true,
			paid,
			from = alfaStockBook,
		}: {
			step?: number;
			duration?: number;
			bracket?: boolean;
			paid?: { from: number };
			from?: { asks: readonly Level[]; bids: readonly Level[] };
		} = {},
	) => {
		const book = side === "ask" ? from.asks : from.bids;
		let sum = paid?.from ?? 0;
		fills.forEach((fill, i) => {
			const at = book.find((item) => item.price === fill.price);
			if (!at) return;
			const when = time + i * step;
			const priorPaid = sum;
			const state = { filled: 0 };
			const levelBar = bar(side, fill.price);
			const levelSize = size(side, fill.price);
			// Quantize the shared fill to whole shares, so even the displayed size and cost
			// agree exactly; geometry cannot run ahead of the money or vice versa.
			const renderBook = () => {
				const filled = Math.round(state.filled);
				const remaining = at.size - filled;
				levelSize.textContent = count(remaining);
				levelBar.setAttribute("width", `${(remaining / MAX_SIZE) * L.barMax}`);
				return filled;
			};
			const renderFill = () => {
				const filled = renderBook();
				if (paid) total.textContent = dollars(priorPaid + fill.price * filled);
			};
			if (bracket)
				d.lock(lockRow, when, { around: hit(side, fill.price), pad: 4 });
			tl.to(
				hit(side, fill.price),
				{ opacity: 1, duration: Math.min(duration, 0.25) },
				when,
			);
			tl.fromTo(
				state,
				{ filled: 0 },
				{
					filled: fill.size,
					duration,
					ease: "power2.out",
					immediateRender: false,
					onStart: renderFill,
					onUpdate: renderFill,
				},
				when,
			);
			if (paid) sum += fill.price * fill.size;
			if (restore === null) return;
			tl.to(hit(side, fill.price), { opacity: 0, duration: 0.25 }, restore);
			tl.fromTo(
				state,
				{ filled: fill.size },
				{
					filled: 0,
					duration: 0.3,
					ease: "power2.out",
					immediateRender: false,
					onUpdate: renderBook,
				},
				restore,
			);
		});
		if (restore !== null)
			tl.to(lockRow, { opacity: 0, duration: 0.25 }, restore);
	};

	d.hidden([
		...flat("q"),
		...heads,
		...flat("slice"),
		one("asks-tag"),
		one("bids-tag"),
		one("spread"),
		one("last"),
		...levels,
		...ASKS.map((at) => hit("ask", at.price)),
		...BIDS.map((at) => hit("bid", at.price)),
		one("p-pay"),
		one("p-pay-big"),
		one("p-get"),
		one("p-avg-tag"),
		one("p-divisor"),
		total,
		one("p-transfer"),
		one("diff-gap"),
		one("diff-label"),
		one("diff-times"),
		one("diff-ask"),
		one("diff-bid"),
		one("diff-unit"),
		one("diff-rule"),
		...kids("vs-last"),
		one("vs-paid"),
		...(L.narrow ? [] : [one("vs-minus")]),
		one("vs-rule"),
		one("p-over"),
		one("p-over-tag"),
		one("p-sell"),
		one("p-avg"),
		one("lock-avg"),
		one("chip-buy"),
		one("chip-sell"),
		lockRow,
		one("lock-index"),
		...kindOrder.flatMap((kind) => [one(`col-${kind}`), one(`colbg-${kind}`)]),
		...flat("kinds").filter((el) => el.tagName === "text"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: the last trade ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.4);
	word(one("q-big"), 4.6);
	show(one("q-line"), 5.4);

	// ——— slice: a share and the company ———
	tl.addLabel("slice", 9.0);
	hide(flat("q"), 9.0);
	show(heads[0], 9.2);
	show([one("px-tag"), px], 9.5);
	show([one("mine-tag"), mineVal], 10.1);
	show([one("co-tag"), coVal], 10.5);
	// Each $1 move, under its own headline.
	d.swap(heads[0], heads[1], 12.7);
	d.swap(one("px-tag"), one("px-tag-moving"), 12.4);
	show([mineChg, coChg], 12.7);
	tl.set(
		[mineChg, coChg],
		{ attr: { class: "wt-film-num wt-film-gain" } },
		12.7,
	);
	d.count(px, OPEN + 100, 12.75, dollars, OPEN, 0.6);
	d.count(mineVal, MINE * (OPEN + 100), 12.75, whole, MINE * OPEN, 0.6);
	d.count(coVal, SHARES * (OPEN + 100), 12.75, company, SHARES * OPEN, 0.6);
	d.count(mineChg, MINE * 100, 12.75, signed, 0, 0.6);
	d.count(coChg, SHARES * 100, 12.75, signedMillions, 0, 0.6);
	// Only name the completed dollar rise once all five figures have settled.
	d.swap(one("px-tag-moving"), one("px-tag-up"), 13.35);

	// ——— quote: you trade against the book ———
	tl.addLabel("quote", 16.55);
	hide([heads[1], ...flat("slice")], 16.55);
	show(heads[2], 16.9);
	show(one("asks-tag"), 16.95);
	ASKS.forEach((at, i) => {
		show(one(`lv-${key("ask", at.price)}`), 17.05 + i * 0.1, "right");
	});
	show([one("spread"), one("last")], 17.45);
	BIDS.forEach((at, i) => {
		show(one(`lv-${key("bid", at.price)}`), 17.55 + i * 0.1, "right");
	});
	show(one("bids-tag"), 17.95);
	// Buy 10, then sell 10, under one headline: each ticket leaves the level it takes and
	// lands in its own slot, so what you pay and what you get stand side by side. The
	// trades stay done: the levels keep what they lost.
	const sell = one<SVGTextElement>("p-sell");
	// On a phone the slots are under the book: a ticket goes down first, clear of the sizes.
	const lane = L.narrow ? ("y" as const) : undefined;
	const measured = (el: SVGTextElement, text: string) => {
		const was = el.textContent;
		el.textContent = text;
		const box = el.getBBox();
		el.textContent = was;
		return box;
	};
	{
		const numerator = measured(total, dollars(BUY_BIG.notional));
		const divisor = one<SVGTextElement>("p-divisor");
		const box = divisor.getBBox();
		divisor.setAttribute(
			"y",
			`${Number(divisor.getAttribute("y")) + numerator.y + numerator.height + 12 - box.y}`,
		);
	}
	{
		const paid = measured(total, dollars(BUY10.notional));
		const got = measured(sell, dollars(SELL10.notional));
		const gap = one<SVGPathElement>("diff-gap");
		const label = one("diff-label");
		if (L.narrow) {
			// Side by side: a bracket under the two, its label beneath it.
			const y = Math.max(paid.y + paid.height, got.y + got.height) + 3;
			const x1 = paid.x + paid.width / 2;
			const x2 = got.x + got.width / 2;
			gap.setAttribute("d", `M${x1} ${y - 5}V${y}H${x2}V${y - 5}`);
			label.setAttribute("x", `${(x1 + x2) / 2}`);
			label.setAttribute("y", `${y + L.type.small * 1.35}`);
			label.setAttribute("text-anchor", "middle");
		} else {
			// One above the other: a bracket to their right, its label beside it.
			const x = Math.max(paid.x + paid.width, got.x + got.width) + 14;
			const y1 = paid.y + paid.height / 2;
			const y2 = got.y + got.height / 2;
			gap.setAttribute("d", `M${x - 7} ${y1}H${x}V${y2}H${x - 7}`);
			label.setAttribute("x", `${x + 10}`);
			label.setAttribute("y", `${(y1 + y2) / 2 + L.type.body * 0.36}`);
		}
		const times = one("diff-times");
		if (L.narrow) {
			for (const attr of ["x", "y", "text-anchor"]) {
				const value = label.getAttribute(attr);
				if (value !== null) times.setAttribute(attr, value);
			}
		}
	}
	if (L.narrow) {
		// Keep the body-size operands in one measured column beside the book. The echo,
		// subtraction, answer and meaning share an edge; the rule spans the widest operand.
		const names = ["vs-x", "vs-paid", "vs-eq", "p-over", "p-over-tag"];
		const marks = names.map((name) => one<SVGTextElement>(name));
		const widest = Math.max(...marks.map((mark) => mark.getBBox().width));
		const x = Math.min(L.bookX + L.bookW + 14, W - 12 - widest);
		marks.forEach((mark) => {
			mark.setAttribute("x", `${x}`);
		});
		const paid = marks[1];
		const minus = marks[2];
		const ruleY = Number(minus.getAttribute("y")) + L.type.body * 0.8;
		one("vs-rule").setAttribute(
			"d",
			`M${x} ${ruleY}h${Math.max(paid.getBBox().width, minus.getBBox().width)}`,
		);
	} else {
		// Measure the settled equation as a row, with clear gaps between its operands and
		// a generous right inset. Move the whole row together if the panel is too narrow.
		const paid = one<SVGTextElement>("vs-paid");
		const minus = one<SVGTextElement>("vs-minus");
		const over = one<SVGTextElement>("p-over");
		const paidW = paid.getBBox().width;
		const minusW = minus.getBBox().width;
		const rowW = paidW + minusW + over.getBBox().width + 24;
		const x = Math.min(L.panelX, W - Math.max(24, L.margin * 0.65) - rowW);
		paid.setAttribute("x", `${x}`);
		minus.setAttribute("x", `${x + paidW + 12}`);
		const resultX = x + paidW + minusW + 24;
		over.setAttribute("x", `${resultX}`);
		one("p-over-tag").setAttribute("x", `${resultX}`);
		const rule = one("vs-rule");
		const y = Number(paid.getAttribute("y")) + L.type.body * 0.45;
		rule.setAttribute("d", `M${x} ${y}h${paidW + minusW + 12}`);
	}
	d.swap(heads[2], heads[3], 20.4);
	take("ask", BUY10.fills, 20.75, null);
	tl.fromTo(
		one("chip-buy"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.15 },
		20.85,
	);
	show(one("p-pay"), L.narrow ? 21.95 : 21.15, "above", 0.15);
	d.carry(one<SVGGraphicsElement>("chip-buy"), total, 21.0, {
		duration: 1,
		fit: false,
		arc: lane,
	});
	d.count(total, BUY10.notional, 21.99, dollars, BUY10.notional, 0.01);
	take("bid", SELL10.fills, 21.55, null);
	tl.fromTo(
		one("chip-sell"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.15 },
		21.65,
	);
	// These short transfers construct one comparison; both tickets stay settled afterwards.
	show(one("p-get"), L.narrow ? 22.15 : 21.75, "above", 0.15);
	d.carry(one<SVGGraphicsElement>("chip-sell"), sell, 21.8, {
		duration: 0.4,
		fit: false,
		arc: lane,
	});
	d.count(sell, SELL10.notional, 22.19, dollars, SELL10.notional, 0.01);
	// Complete the same 50¢ proof earlier, retaining its 3.5 s reading window.
	d.trace(one<SVGPathElement>("diff-gap"), 22.0, { duration: 0.3 });
	if (!L.narrow) show(one("diff-label"), 22.15, "below", 0.15);
	show(heads[4], 22.25);
	tl.to(lockRow, { opacity: 0, duration: 0.25 }, 22.25);
	tl.to(
		[hit("ask", BUY10.fills[0].price), hit("bid", SELL10.fills[0].price)],
		{ opacity: 0, duration: 0.3 },
		22.25,
	);
	tl.set(one("diff-ask"), { opacity: 1 }, 22.0);
	tl.set(one("diff-bid"), { opacity: 1 }, 22.05);
	d.trace(one<SVGPathElement>("diff-rule"), 22.1, { duration: 0.15 });
	tl.set(one("diff-unit"), { opacity: 1 }, 22.25);
	tl.set(one("diff-times"), { opacity: 1 }, 22.3);
	// The hero: each 0.2 s fill has a full 1 s settled dwell before the next operation.
	// Steady row highlights locate the fills without spending that dwell on moving brackets.
	hide([heads[3], heads[4]], 25.8);
	show(heads[5], 26.15, "below", 0.2);
	hide(
		[
			one("p-get"),
			sell,
			one("diff-gap"),
			one("diff-label"),
			one("diff-times"),
			one("diff-ask"),
			one("diff-bid"),
			one("diff-unit"),
			one("diff-rule"),
		],
		25.8,
	);
	d.flip(one("p-pay"), one("p-pay-big"), 25.8);
	hide(total, 25.8, 0.25);
	// Reset the desktop exit translation before this mark becomes a later carry source.
	tl.set(total, { x: 0, y: 0 }, 26.3);
	tl.to(total, { opacity: 1, duration: 0.2 }, 26.3);
	take("ask", BUY_BIG.fills, 26.3, null, {
		step: 1.2,
		duration: 0.2,
		bracket: false,
		paid: { from: 0 },
		from: BUY10,
	});
	// Register the already-settled shared-state total for the director's carry measurement.
	// This is a constant, zero-duration handoff, never a second animated counter.
	d.count(total, BUY_BIG.notional, 28.9, dollars, BUY_BIG.notional, 0);
	// The last fill settles at 28.9 and reads for 1 s. Then construct the whole division.
	tl.fromTo(
		one("p-divisor"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.15 },
		29.9,
	);
	show(one("p-avg-tag"), 29.9, "below", 0.15);
	word(one("p-avg"), 29.9);
	tl.to(
		BUY_BIG.fills.map((fill) => hit("ask", fill.price)),
		{ opacity: 0.3, duration: 0.3 },
		30.05,
	);
	d.lock(one<SVGGraphicsElement>("lock-avg"), 30.05, {
		around: [one("p-avg-tag"), one("p-avg")],
		pad: 10,
	});
	tl.addLabel("hero-lock", 30.05);
	// Numerator, divisor, result and brackets remain bright and still from 30.5 to 32.0.
	// Clear the phone's book lane before the numerator leaves; the average stays bright.
	tl.to(
		[...levels, one("asks-tag"), one("bids-tag"), one("spread"), one("last")],
		{ opacity: 0.25, duration: 0.1 },
		32.0,
	);
	hide([one("p-divisor"), one("p-pay-big")], 32.0, 0.1, 0);
	const paid = one<SVGGraphicsElement>("vs-paid");
	tl.set(paid, { attr: { class: "wt-film-num wt-film-accent" } }, 32.1);
	if (L.narrow) {
		// Up first through the quiet book, then right into the subtraction: clear of the hero.
		d.carry(total, paid, 32.1, { duration: 0.55, arc: "y" });
	} else {
		// A waypoint to the hero's left prevents a vertical flight through its bright type.
		const transfer = one<SVGGraphicsElement>("p-transfer");
		transfer.setAttribute(
			"x",
			`${one<SVGGraphicsElement>("p-avg").getBBox().x - transfer.getBBox().width - 64}`,
		);
		d.carry(total, transfer, 32.1, { duration: 0.25, arc: "x" });
		d.carry(transfer, paid, 32.35, { duration: 0.3, arc: "y" });
	}
	// Only reveal the comparison's other operands after the payment has landed.
	tl.set(one("last"), { attr: { class: "wt-film-num wt-film-accent" } }, 32.65);
	tl.to(one("last"), { opacity: 1, duration: 0.15 }, 32.65);
	show(one(L.narrow ? "vs-x" : "vs-calc"), 32.65, "below", 0.15);
	tl.set(one(L.narrow ? "vs-eq" : "vs-minus"), { opacity: 1 }, 32.65);
	d.trace(one<SVGPathElement>("vs-rule"), 32.7, { duration: 0.2 });
	tl.set(paid, { attr: { class: "wt-film-num" } }, 33.0);
	tl.set(one("p-over"), { opacity: 1 }, 33.0);
	show(one("p-over-tag"), 32.85, "below", 0.15);
	// The complete subtraction retains its four seconds, 33.0–37.0.

	// ——— kinds: what the underlying is ———
	tl.addLabel("kinds", 37.0);
	hide(
		[
			heads[5],
			one("asks-tag"),
			one("bids-tag"),
			one("spread"),
			one("last"),
			...levels,
			one("p-pay"),
			one("p-pay-big"),
			total,
			one("p-transfer"),
			one("p-divisor"),
			one("p-avg-tag"),
			one("p-avg"),
			one("lock-avg"),
			...kids("vs-last"),
			one("vs-paid"),
			...(L.narrow ? [] : [one("vs-minus")]),
			one("vs-rule"),
			one("p-over"),
			one("p-over-tag"),
		],
		37.0,
	);
	show(heads[6], 37.35);
	show(
		flat("kinds").filter((el) => el.tagName === "text"),
		37.35,
		"below",
		0.25,
	);
	kindOrder.forEach((kind) => {
		show(one(`col-${kind}`), 37.35, "below", 0.25);
	});
	tl.to(one("colbg-index"), { opacity: 1, duration: 0.4 }, 38.85);
	d.lock(one<SVGGraphicsElement>("lock-index"), 38.85, {
		around: one("colbg-index"),
		pad: 4,
	});
	// All three columns retain full contrast from 37.6 to 41.45 (the same 3.85 s).
	// The headline settles at 37.85, then reads for 1 s before the index focus.
	// That focus settles at 39.3, leaving another 2.15 s of quiet comparison.

	// ——— claim ———
	tl.addLabel("claim", 41.45);
	hide(
		[
			heads[6],
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
		`Stocks and prices, as a short film: ALFA's last trade of ${usd(alfaStockBook.last)} and the question of what 10 shares cost now; a share as one of ${count(SHARES)} slices of a company worth ${companyValue(SHARES * OPEN, "en")}, where a $1 move is $${MINE} on your ${MINE} shares; the quote, where you buy 10 at the ask for ${usd(BUY10.notional)}, sell 10 at the bid for ${usd(SELL10.notional)}, and 1,000 at once run through three offers to an average of ${price(BUY_BIG.notional / BUY_BIG.filled)}; and a stock, an ETF and an index, the last a number you can't buy whose options settle in cash`,
		`股票与价格短片：ALFA 最新成交 ${usd(alfaStockBook.last)}，以及现在买 10 股要花多少；一股是 ${count(SHARES)} 份中的一份，公司估值 ${companyValue(SHARES * OPEN, "zh")}，涨 $1 你的 ${MINE} 股就多 $${MINE}；报价：买 10 股按卖价付 ${usd(BUY10.notional)}，卖 10 股按买价得 ${usd(SELL10.notional)}，一次买 1,000 股会吃掉三档卖单，均价 ${price(BUY_BIG.notional / BUY_BIG.filled)}；以及股票、ETF 和指数，指数是一个不能买入的数，它的期权以现金结算`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Stocks and prices", "股票与价格"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "slice", label: ["A share", "一股"] },
		{ id: "quote", label: ["The quote", "报价"] },
		{ id: "kinds", label: ["Stock, ETF, index", "股票、ETF、指数"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
