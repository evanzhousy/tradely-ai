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
 *   quote     16.55–33.3 the book; buy 10: $1,000.50, sell 10: $1,000.00, a bracket: 50¢
 *                        more to buy; hero: buy 1,000; after it, the same 1,000 at the last
 *                        price, and what the sweep added
 *   kinds     33.3–41.05 stock, ETF, index; the index is a number, cash-settled
 *   claim     41.05–45.45 you trade against the quote, not the last price
 *   next      45.45–47.45 Next: options, a paid right
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
		"Stock, ETF, index: different things.",
		"股票、ETF、指数：不是一回事。",
	],
	kindsHeadShort: ["Stock, ETF, index.", "股票、ETF、指数。"],
	indexHead: [
		"An index: a number, settled in cash.",
		"指数是一个数：期权现金结算。",
	],
	indexHeadShort: ["An index: cash-settled.", "指数：现金结算。"],
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
	// Under the locked average, clear of its brackets.
	const vsY = valY(1, heroFig) + heroFig * 0.3 + 10 + T.body * 1.5;
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
						y={tagY(k)}
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
			{/* The hero: the average price of 1,000 shares, the loudest figure on stage. */}
			<Word
				name="p-avg"
				x={slotX(1)}
				y={valY(1, heroFig)}
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
			{/* After the hero, the same 1,000 shares at the last price. A phone has room for it
			    only beside the book, under the "last" tag it extends. */}
			<g data-f="vs-last">
				{narrow ? (
					[`${t(copy.last)} × ${count(BIG)}`, `= ${usd(AT_LAST, 0)}`].map(
						(line, i) => (
							<text
								key={line}
								data-f={i ? "vs-eq" : "vs-x"}
								x={L.bookX + L.bookW + 14}
								y={phoneVsY + T.small * i * 1.5}
								className="wt-film-num wt-film-dim"
								style={{ fontSize: T.small }}
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
				name="p-over"
				x={narrow ? L.bookX + L.bookW + 14 : L.panelX}
				y={
					narrow ? phoneVsY + T.small * 1.5 + T.body * 1.5 : vsY + T.body * 1.9
				}
				size={narrow ? T.body : T.body * 1.25}
				anchor="start"
				className="wt-film-num wt-film-loss"
			>
				{signedUsd(0, 2)}
			</Word>
			{narrow ? (
				<text
					data-f="p-over-tag"
					x={L.bookX + L.bookW + 14}
					y={phoneVsY + T.small * 1.5 + T.body * 1.5 + T.small * 1.5}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.overLast).toUpperCase()}
				</text>
			) : null}
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
			{headline("i-head", copy.indexHead, copy.indexHeadShort)}
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
		"i-head",
	].map((name) => one(name));
	/**
	 * Takes `fills` off one side of the book, one level after another: brackets lock on the
	 * level, it lights and shrinks, and with `paid` what you pay counts on by that fill. The
	 * book comes back at `restore`.
	 */
	const take = (
		side: "ask" | "bid",
		fills: readonly { price: number; size: number }[],
		time: number,
		/** When the book refills; null leaves the taken levels taken (a trade never un-happens). */
		restore: number | null,
		{
			step = 0.4,
			paid,
			from = alfaStockBook,
		}: {
			step?: number;
			paid?: { from: number };
			from?: { asks: readonly Level[]; bids: readonly Level[] };
		} = {},
	) => {
		const book = side === "ask" ? from.asks : from.bids;
		let sum = paid?.from ?? 0;
		fills.forEach((fill, i) => {
			const at = book.find((item) => item.price === fill.price);
			if (!at) return;
			const left = at.size - fill.size;
			const when = time + i * step;
			d.lock(lockRow, when, { around: hit(side, fill.price), pad: 4 });
			tl.to(hit(side, fill.price), { opacity: 1, duration: 0.25 }, when);
			tl.to(
				bar(side, fill.price),
				{ attr: { width: (left / MAX_SIZE) * L.barMax }, duration: 0.4 },
				when,
			);
			d.count(
				size(side, fill.price),
				left,
				when,
				(v) => count(Math.round(v)),
				at.size,
				0.4,
			);
			if (paid) {
				const next = sum + fill.price * fill.size;
				d.count(total, next, when, dollars, sum, Math.min(step, 0.5));
				sum = next;
			}
			if (restore === null) return;
			tl.to(hit(side, fill.price), { opacity: 0, duration: 0.25 }, restore);
			tl.to(
				bar(side, fill.price),
				{ attr: { width: (at.size / MAX_SIZE) * L.barMax }, duration: 0.3 },
				restore,
			);
			d.count(
				size(side, fill.price),
				at.size,
				restore,
				(v) => count(Math.round(v)),
				left,
				0.3,
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
		total,
		one("diff-label"),
		...kids("vs-last"),
		one("p-over"),
		...(L.narrow ? [one("p-over-tag")] : []),
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
	d.count(px, OPEN + 100, 13.1, dollars, OPEN, 0.8);
	d.count(mineVal, MINE * (OPEN + 100), 13.1, whole, MINE * OPEN, 0.8);
	d.count(coVal, SHARES * (OPEN + 100), 13.1, company, SHARES * OPEN, 0.8);
	show([mineChg, coChg], 13.3);
	d.count(mineChg, MINE * 100, 13.3, signed, 0, 0.8);
	d.count(coChg, SHARES * 100, 13.3, signedMillions, 0, 0.8);
	tl.set(
		[mineChg, coChg],
		{ attr: { class: "wt-film-num wt-film-gain" } },
		13.3,
	);

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
	}
	d.swap(heads[2], heads[3], 20.4);
	take("ask", BUY10.fills, 20.75, null);
	tl.fromTo(
		one("chip-buy"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.15 },
		20.85,
	);
	show(one("p-pay"), L.narrow ? 21.95 : 21.15, "above");
	d.carry(one<SVGGraphicsElement>("chip-buy"), total, 21.0, {
		duration: 1,
		fit: false,
		arc: lane,
	});
	d.count(total, BUY10.notional, 22.0, dollars, 0, 0.5);
	take("bid", SELL10.fills, 21.55, null);
	tl.fromTo(
		one("chip-sell"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.15 },
		21.65,
	);
	// On a phone the ticket comes down past this slot's tag: the tag comes in as it lands.
	show(one("p-get"), L.narrow ? 22.75 : 21.75, "above");
	d.carry(one<SVGGraphicsElement>("chip-sell"), sell, 21.8, {
		duration: 1,
		fit: false,
		arc: lane,
	});
	d.count(sell, SELL10.notional, 22.8, dollars, 0, 0.3);
	// Both on stage: a bracket makes the difference, the line names it, and both hold. The
	// taken levels step back.
	d.trace(one<SVGPathElement>("diff-gap"), 23.1, { duration: 0.3 });
	show(one("diff-label"), 23.25);
	show(heads[4], 23.35);
	tl.to(lockRow, { opacity: 0, duration: 0.25 }, 23.35);
	tl.to(
		[hit("ask", BUY10.fills[0].price), hit("bid", SELL10.fills[0].price)],
		{ opacity: 0, duration: 0.3 },
		23.35,
	);
	// The hero: 1,000 at once climb the offers that are left; the average is what they paid.
	d.swap([heads[3], heads[4]], heads[5], 26.9);
	hide([one("p-get"), sell, one("diff-gap"), one("diff-label")], 26.9);
	d.flip(one("p-pay"), one("p-pay-big"), 26.9);
	hide(total, 26.9, 0.25);
	tl.to(total, { opacity: 1, duration: 0.2 }, 27.4);
	take("ask", BUY_BIG.fills, 27.4, null, {
		step: 0.6,
		paid: { from: 0 },
		from: BUY10,
	});
	show(one("p-avg-tag"), 29.05);
	word(one("p-avg"), 29.25);
	tl.to(lockRow, { opacity: 0, duration: 0.25 }, 29.7);
	tl.to(
		BUY_BIG.fills.map((fill) => hit("ask", fill.price)),
		{ opacity: 0.3, duration: 0.3 },
		29.7,
	);
	d.lock(one<SVGGraphicsElement>("lock-avg"), 29.7, {
		around: [one("p-avg-tag"), one("p-avg")],
		pad: 8,
	});
	tl.addLabel("hero-lock", 29.7);
	tl.to(total, { opacity: 0.45, duration: 0.3 }, 29.7);
	tl.to(total, { opacity: 1, duration: 0.3 }, 30.5);
	const last = one<SVGGraphicsElement>("last");
	tl.set(last, { attr: { class: "wt-film-num wt-film-accent" } }, 30.4);
	if (L.narrow) {
		show(one("vs-x"), 30.45);
		show(one("vs-eq"), 30.75);
	} else {
		show(one("vs-calc"), 30.5);
	}
	tl.set(one("p-over"), { opacity: 1 }, 31.25);
	if (L.narrow) show(one("p-over-tag"), 31.5);
	d.count(
		one<SVGTextElement>("p-over"),
		OVER_LAST,
		31.25,
		(v) =>
			L.narrow
				? signedUsd(Math.round(v), 2)
				: `${signedUsd(Math.round(v), 2)} ${d.t(copy.overLast)}`,
		0,
		0.5,
	);

	// ——— kinds: what the underlying is ———
	tl.addLabel("kinds", 33.3);
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
			one("p-avg-tag"),
			one("p-avg"),
			one("lock-avg"),
			...kids("vs-last"),
			one("p-over"),
			...(L.narrow ? [one("p-over-tag")] : []),
		],
		33.3,
	);
	show(heads[6], 33.65);
	show(
		flat("kinds").filter((el) => el.tagName === "text"),
		33.9,
	);
	kindOrder.forEach((kind, i) => {
		show(one(`col-${kind}`), 34.1 + i * 0.3);
	});
	d.swap(heads[6], heads[7], 37.15);
	tl.to(one("colbg-index"), { opacity: 1, duration: 0.4 }, 37.65);
	d.lock(one<SVGGraphicsElement>("lock-index"), 37.65, {
		around: one("colbg-index"),
		pad: 4,
	});
	tl.to(
		[one("col-stock"), one("col-etf")],
		{ opacity: 0.4, duration: 0.4 },
		37.65,
	);
	// Down the index column: a number, can't buy it, settles in cash.
	ROWS.forEach((row, r) => {
		const cell = one(`cell-index-${row}`);
		const at = 38.1 + r * 0.45;
		tl.fromTo(
			cell,
			{ scale: 1.08, transformOrigin: "50% 50%" },
			{ scale: 1, duration: 0.4, ease: "power3.out" },
			at,
		);
	});

	// ——— claim ———
	tl.addLabel("claim", 41.05);
	hide(
		[
			heads[7],
			one("lock-index"),
			...kindOrder.map((kind) => one(`col-${kind}`)),
			...flat("kinds").filter((el) => el.tagName === "text"),
		],
		41.05,
	);
	word(one("z-big"), 41.45);
	show(one("z-sub"), 41.95);

	// ——— next ———
	tl.addLabel("next", 45.45);
	hide(kids("claim"), 45.45);
	d.close(45.45);
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
