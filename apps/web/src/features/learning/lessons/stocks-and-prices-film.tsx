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
 * neither is the last trade. The hero: 1,000 shares at once climb the offers, one level
 * after another, to an average of $100.061. Last, a stock, an ETF and an index.
 *
 *   open      0–4        "Stocks and prices"
 *   question  4–9        last $100.02: what do 10 shares cost?
 *   slice     9–17.6     50M × $100 = $5B; each $1: $100 for you, $50M for ALFA
 *   quote     17.6–32    the book; buy 10: $1,000.50, sell 10: $1,000.00; hero: buy 1,000
 *   kinds     32–39.75   stock, ETF, index; the index is a number, cash-settled
 *   claim     39.75–44.15 you trade against the quote, not the last price
 *   next      44.15–46.65 Next: options, a paid right
 */

const END = 46.65;
const OPEN = ALFA.open;
const MINE = 10;
const SHARES = ALFA_SHARES_OUTSTANDING;
const BUY10 = tradeAgainst("buy", 10);
const SELL10 = tradeAgainst("sell", 10);
const BIG = 1_000;
const BUY_BIG = tradeAgainst("buy", BIG);
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
		`ALFA 每动 $1，你变动 $${MINE}。`,
	],
	moveHeadShort: [`Each $1: $${MINE} to you.`, `每动 $1：你变 $${MINE}。`],
	yours: [`your ${MINE} shares`, `你的 ${MINE} 股`],
	company: [`ALFA, ${count(SHARES)} shares`, `ALFA，${count(SHARES)} 股`],
	companyShort: ["ALFA, all shares", "ALFA，全部股份"],
	bookHead: ["Buyers bid; sellers ask.", "买方出价，卖方要价。"],
	bookHeadShort: ["Buyers bid; sellers ask.", "买方出价，卖方要价。"],
	buyHead: [
		"Buying 10 costs more than selling 10.",
		"买 10 股比卖 10 股花得多。",
	],
	buyHeadShort: ["Buying costs more than selling.", "买比卖花得多。"],
	bigHead: [
		`Buy ${count(BIG)} at once: you climb the book.`,
		`一次买 ${count(BIG)} 股：沿卖单往上吃。`,
	],
	bigHeadShort: [
		`Buy ${count(BIG)}: you climb the book.`,
		`买 ${count(BIG)} 股：往上吃。`,
	],
	diff: [
		`${Math.round(BUY10.notional - SELL10.notional)}¢ more to buy`,
		`买入多付 ${Math.round(BUY10.notional - SELL10.notional)} 美分`,
	],
	asks: ["asks · sellers", "卖价 · 卖方"],
	bids: ["bids · buyers", "买价 · 买方"],
	last: ["last", "最新"],
	fill: ["you pay", "你付出"],
	get: ["you get", "你收到"],
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
	const fig = narrow ? T.num * 0.9 : T.num;
	const heroFig = narrow ? T.num : T.num * 1.3;
	const slotX = (k: number) => (narrow ? margin + k * room * 0.5 : L.panelX);
	const tagY = (k: number) =>
		L.panelY + T.small * 1.4 + (narrow ? 0 : k * (fig * 1.25 + T.small * 2.4));
	const valY = (k: number, size = fig) => tagY(k) + size * 1.15;
	const diffY = narrow ? valY(0) + T.body * 1.7 : valY(1) + T.body * 1.9;
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
					ALFA
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
					y={
						narrow ? L.askY(0) - T.small * 0.9 : L.spreadY + L.rowStep * 0.2 - 5
					}
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
						["p-pay", copy.fill, 0],
						["p-get", copy.get, 1],
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
			<Word
				name="p-diff"
				x={slotX(0)}
				y={diffY}
				size={T.body}
				anchor="start"
				className="wt-film-num wt-film-loss"
			>
				{t(copy.diff)}
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
								x={L.colX(i) + L.colW / 2}
								y={H * (0.52 + r * 0.13)}
								textAnchor="middle"
								className={`wt-film-type ${kind === "index" ? "wt-film-accent" : ""}`}
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
		{ step = 0.4, paid }: { step?: number; paid?: { from: number } } = {},
	) => {
		const book = side === "ask" ? alfaStockBook.asks : alfaStockBook.bids;
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
		one("p-get"),
		one("p-avg-tag"),
		total,
		one("p-sell"),
		one("p-diff"),
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
	// Each $1 move, up and then down, under one headline.
	d.swap(heads[0], heads[1], 13.0);
	d.count(px, OPEN + 100, 13.4, dollars, OPEN, 0.8);
	d.count(mineVal, MINE * (OPEN + 100), 13.4, whole, MINE * OPEN, 0.8);
	d.count(coVal, SHARES * (OPEN + 100), 13.4, company, SHARES * OPEN, 0.8);
	show([mineChg, coChg], 13.6);
	d.count(mineChg, MINE * 100, 13.6, signed, 0, 0.8);
	d.count(coChg, SHARES * 100, 13.6, signedMillions, 0, 0.8);
	tl.set(
		[mineChg, coChg],
		{ attr: { class: "wt-film-num wt-film-gain" } },
		13.6,
	);
	d.count(px, OPEN - 100, 15.6, dollars, OPEN + 100, 0.9);
	d.count(mineVal, MINE * (OPEN - 100), 15.6, whole, MINE * (OPEN + 100), 0.9);
	d.count(
		coVal,
		SHARES * (OPEN - 100),
		15.6,
		company,
		SHARES * (OPEN + 100),
		0.9,
	);
	d.count(mineChg, -MINE * 100, 15.6, signed, MINE * 100, 0.9);
	d.count(coChg, -SHARES * 100, 15.6, signedMillions, SHARES * 100, 0.9);
	tl.set(
		[mineChg, coChg],
		{ attr: { class: "wt-film-num wt-film-loss" } },
		16.0,
	);

	// ——— quote: you trade against the book ———
	tl.addLabel("quote", 17.6);
	hide([heads[1], ...flat("slice")], 17.6);
	show(heads[2], 17.95);
	show(one("asks-tag"), 18.0);
	ASKS.forEach((at, i) => {
		show(one(`lv-${key("ask", at.price)}`), 18.1 + i * 0.1, "right");
	});
	show([one("spread"), one("last")], 18.5);
	BIDS.forEach((at, i) => {
		show(one(`lv-${key("bid", at.price)}`), 18.6 + i * 0.1, "right");
	});
	show(one("bids-tag"), 19.0);
	// Buy 10, then sell 10, under one headline: each ticket leaves the level it takes and
	// lands in its own slot, so what you pay and what you get stand side by side.
	const sell = one<SVGTextElement>("p-sell");
	// On a phone the slots are under the book: a ticket goes down first, clear of the sizes.
	const lane = L.narrow ? ("y" as const) : undefined;
	d.swap(heads[2], heads[3], 21.45);
	take("ask", BUY10.fills, 21.8, 24.0);
	tl.fromTo(
		one("chip-buy"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.15 },
		21.9,
	);
	show(one("p-pay"), 22.2);
	d.carry(one<SVGGraphicsElement>("chip-buy"), total, 22.05, {
		duration: 1,
		fit: false,
		arc: lane,
	});
	d.count(total, BUY10.notional, 23.05, dollars, 0, 0.5);
	take("bid", SELL10.fills, 24.0, 26.2);
	tl.fromTo(
		one("chip-sell"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.15 },
		24.1,
	);
	// On a phone the ticket comes down past this slot's tag: the tag comes in as it lands.
	show(one("p-get"), L.narrow ? 25.3 : 24.2, "above");
	d.carry(one<SVGGraphicsElement>("chip-sell"), sell, 24.25, {
		duration: 1,
		fit: false,
		arc: lane,
	});
	d.count(sell, SELL10.notional, 25.25, dollars, 0, 0.5);
	// Both on stage: the difference is made, then named.
	show(one("p-diff"), 26.0);
	// The hero: 1,000 at once climb the offers, and the average is what they paid.
	d.swap(heads[3], heads[4], 26.8);
	hide([one("p-get"), sell, one("p-diff")], 26.8);
	d.count(total, 0, 27.1, dollars, BUY10.notional, 0.3);
	take("ask", BUY_BIG.fills, 27.5, null, { step: 0.65, paid: { from: 0 } });
	show(one("p-avg-tag"), 29.2);
	word(one("p-avg"), 29.4);
	tl.to(lockRow, { opacity: 0, duration: 0.25 }, 29.8);
	d.lock(one<SVGGraphicsElement>("lock-avg"), 29.8, {
		around: [one("p-avg-tag"), one("p-avg")],
		pad: 8,
	});
	tl.addLabel("hero-lock", 29.8);

	// ——— kinds: what the underlying is ———
	tl.addLabel("kinds", 32);
	hide(
		[
			heads[4],
			one("asks-tag"),
			one("bids-tag"),
			one("spread"),
			one("last"),
			...levels,
			one("p-pay"),
			total,
			one("p-avg-tag"),
			one("p-avg"),
			one("lock-avg"),
		],
		32.0,
	);
	show(heads[5], 32.35);
	show(
		flat("kinds").filter((el) => el.tagName === "text"),
		32.6,
	);
	kindOrder.forEach((kind, i) => {
		show(one(`col-${kind}`), 32.8 + i * 0.3);
	});
	d.swap(heads[5], heads[6], 35.85);
	tl.to(one("colbg-index"), { opacity: 1, duration: 0.4 }, 36.35);
	d.lock(one<SVGGraphicsElement>("lock-index"), 36.35, {
		around: one("colbg-index"),
		pad: 4,
	});
	tl.to(
		[one("col-stock"), one("col-etf")],
		{ opacity: 0.4, duration: 0.4 },
		36.35,
	);

	// ——— claim ———
	tl.addLabel("claim", 39.75);
	hide(
		[
			heads[6],
			one("lock-index"),
			...kindOrder.map((kind) => one(`col-${kind}`)),
			...flat("kinds").filter((el) => el.tagName === "text"),
		],
		39.75,
	);
	word(one("z-big"), 40.15);
	show(one("z-sub"), 40.65);

	// ——— next ———
	tl.addLabel("next", 44.15);
	hide(kids("claim"), 44.15);
	d.close(44.15);
	return tl;
}

export const stocksAndPricesFilm: Film = {
	id: "stocks-and-prices",
	label: [
		`Stocks and prices, as a short film: ALFA's last trade of ${usd(alfaStockBook.last)} and the question of what 10 shares cost now; a share as one of ${count(SHARES)} slices of a company worth ${companyValue(SHARES * OPEN, "en")}, where a $1 move is $100 on your 100 shares; the quote, where you buy 10 at the ask for ${usd(BUY10.notional)}, sell 10 at the bid for ${usd(SELL10.notional)}, and 1,000 at once run through three offers to an average of ${price(BUY_BIG.notional / BUY_BIG.filled)}; and a stock, an ETF and an index, the last a number you can't buy whose options settle in cash`,
		`股票与价格短片：ALFA 最新成交 ${usd(alfaStockBook.last)}，以及现在买 10 股要花多少；一股是 ${count(SHARES)} 份中的一份，公司估值 ${companyValue(SHARES * OPEN, "zh")}，涨 $1 你的 100 股就多 $100；报价：买 10 股按卖价付 ${usd(BUY10.notional)}，卖 10 股按买价得 ${usd(SELL10.notional)}，一次买 1,000 股会吃掉三档卖单，均价 ${price(BUY_BIG.notional / BUY_BIG.filled)}；以及股票、ETF 和指数，指数是一个不能买入的数，它的期权以现金结算`,
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
