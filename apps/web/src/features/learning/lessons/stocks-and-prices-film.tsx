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
 * company, so a $1 move is $100 on your 100 shares and $50 million on ALFA. Then the
 * quote: you buy at the $100.05 ask and sell at the $100.00 bid, not at the last trade, and
 * 1,000 shares at once run through three offers. Last, a stock, an ETF and an index.
 *
 *   open      0–4      "Stocks and prices"
 *   question  4–9.5    last $100.02: what do 10 shares cost?
 *   slice     9.5–18.5 50M × $100 = $5B; +$1: +$100 and +$50M; −$1
 *   quote     18.5–31  the book; buy 10: $1,000.50; sell 10: $1,000.00; buy 1,000
 *   kinds     31–39.5  stock, ETF, index; cut: the claim
 *   next      39.5–42  Next: options, a paid right with a deadline
 */

const END = 42;
const OPEN = ALFA.open;
const MINE = 100;
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
	const rowStep = H * (narrow ? 0.075 : 0.07);
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
		panelY: bookTop,
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
		"You buy 10 shares right now. What do they cost?",
		"你现在立即买入 10 股。要花多少？",
	],
	sliceHead: [
		`A share is one of ${count(SHARES)} slices of ALFA.`,
		`一股是 ALFA ${count(SHARES)} 份中的一份。`,
	],
	sliceHeadShort: ["A share: one slice of ALFA.", "一股：ALFA 的一份。"],
	upHead: [
		"ALFA rises $1: every share gains $1.",
		"ALFA 涨 $1：每一股都涨 $1。",
	],
	upHeadShort: ["ALFA +$1.", "ALFA +$1。"],
	downHead: [
		"Falls $1 instead, and the same shares lose $1 each.",
		"如果改为跌 $1，同样的股票每股亏 $1。",
	],
	downHeadShort: ["ALFA −$1.", "ALFA −$1。"],
	yours: [`your ${MINE} shares`, `你的 ${MINE} 股`],
	company: [`ALFA, ${count(SHARES)} shares`, `ALFA，${count(SHARES)} 股`],
	companyShort: ["ALFA, all shares", "ALFA，全部股份"],
	bookHead: [
		`The quote: bid ${usd(BIDS[0].price)}, ask ${usd(alfaStockBook.asks[0].price)}. Last: ${usd(alfaStockBook.last)}.`,
		`报价：买价 ${usd(BIDS[0].price)}，卖价 ${usd(alfaStockBook.asks[0].price)}。最新成交：${usd(alfaStockBook.last)}。`,
	],
	bookHeadShort: [
		`Bid ${usd(BIDS[0].price)}, ask ${usd(alfaStockBook.asks[0].price)}.`,
		`买价 ${usd(BIDS[0].price)}，卖价 ${usd(alfaStockBook.asks[0].price)}。`,
	],
	buyHead: [
		`Buy 10 now: you pay the ask, ${usd(BUY10.notional)}.`,
		`立即买 10 股：按卖价付 ${usd(BUY10.notional)}。`,
	],
	buyHeadShort: [
		`Buy 10: ${usd(BUY10.notional)}.`,
		`买 10 股：${usd(BUY10.notional)}。`,
	],
	sellHead: [
		`Sell 10 now: you get the bid, ${usd(SELL10.notional)}.`,
		`立即卖 10 股：按买价得 ${usd(SELL10.notional)}。`,
	],
	sellHeadShort: [
		`Sell 10: ${usd(SELL10.notional)}.`,
		`卖 10 股：${usd(SELL10.notional)}。`,
	],
	bigHead: [
		`Buy ${count(BIG)} at once: the best offer runs out, and the average rises.`,
		`一次买 ${count(BIG)} 股：最优卖价被吃光，均价上升。`,
	],
	bigHeadShort: [
		`Buy ${count(BIG)}: the offers run out.`,
		`买 ${count(BIG)} 股：卖单被吃光。`,
	],
	asks: ["asks · sellers", "卖价 · 卖方"],
	bids: ["bids · buyers", "买价 · 买方"],
	last: ["last", "最新"],
	fill: ["you pay", "你付出"],
	get: ["you get", "你收到"],
	avg: ["average", "均价"],
	avgShort: ["avg", "均价"],
	kindsHead: [
		"A stock, an ETF and an index are different things.",
		"股票、ETF 和指数是不同的东西。",
	],
	kindsHeadShort: ["Stock, ETF, index.", "股票、ETF、指数。"],
	indexHead: [
		"An index is a number: you can't buy it, and its options settle in cash.",
		"指数是一个数：不能买入，它的期权以现金结算。",
	],
	indexHeadShort: ["An index: cash-settled.", "指数：现金结算。"],
	rowLabels: {
		holds: ["holds", "持有"],
		buy: ["buy it?", "能买吗"],
		settle: ["options settle in", "期权交割"],
	},
	claimBig: [
		"You trade against the quote, not the last price.",
		"你按报价成交，而不是按最新成交价。",
	],
	claimSub: [
		"Buy at the ask, sell at the bid, and know what the underlying is.",
		"按卖价买，按买价卖，并弄清标的是什么。",
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
	const panelLine = (k: number) => L.panelY + T.small * 1.4 + k * T.num * 1.25;
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
					y={H * 0.74}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>

			{/* A share and the company. */}
			{headline("s-head", copy.sliceHead, copy.sliceHeadShort)}
			{headline("u-head", copy.upHead, copy.upHeadShort)}
			{headline("d-head", copy.downHead, copy.downHeadShort)}
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
			{headline("l-head", copy.sellHead, copy.sellHeadShort)}
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
					// A phone's rows leave no room on the spread line: it moves to the column beside the book.
					x={narrow ? L.panelX : L.bookX + L.bookW}
					y={
						narrow
							? L.bidY(BIDS.length - 1) + L.rowH + T.small * 1.4
							: L.spreadY + L.rowStep * 0.2 - 5
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
						["p-pay", copy.fill],
						["p-get", copy.get],
					] as const
				).map(([name, tag]) => (
					<text
						key={name}
						data-f={name}
						x={L.panelX}
						y={panelLine(0)}
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(tag).toUpperCase()}
					</text>
				))}
			</g>
			<Word
				name="p-total"
				x={L.panelX}
				y={panelLine(1)}
				size={narrow ? T.num * 0.68 : T.num}
				anchor="start"
				className="wt-film-num wt-film-accent"
			>
				{usd(0)}
			</Word>
			<Word
				name="p-avg"
				x={L.panelX}
				y={panelLine(1) + T.body * 1.8}
				size={T.body}
				anchor="start"
				className="wt-film-num wt-film-dim"
			>
				{`${t(narrow ? copy.avgShort : copy.avg)} ${price(BUY_BIG.notional / BUY_BIG.filled)}`}
			</Word>

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
								className={`wt-film-type ${kind === "index" ? "wt-film-warn" : ""}`}
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
						{t(copy.rowLabels[row])}
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
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
			time,
		);
	const px = one<SVGTextElement>("px");
	const mineVal = one<SVGTextElement>("mine-val");
	const coVal = one<SVGTextElement>("co-val");
	const mineChg = one<SVGTextElement>("mine-chg");
	const coChg = one<SVGTextElement>("co-chg");
	const total = one<SVGTextElement>("p-total");
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
		one(`hit-${key(side, cents)}`);
	const bar = (side: "ask" | "bid", cents: number) =>
		one(`bar-${key(side, cents)}`);
	const size = (side: "ask" | "bid", cents: number) =>
		one<SVGTextElement>(`size-${key(side, cents)}`);
	const levels = [
		...ASKS.map((at) => one(`lv-${key("ask", at.price)}`)),
		...BIDS.map((at) => one(`lv-${key("bid", at.price)}`)),
	];
	/** Takes `fills` off one side of the book: highlight, shrink, and come back. */
	const take = (
		side: "ask" | "bid",
		fills: readonly { price: number; size: number }[],
		time: number,
		restore: number,
	) => {
		const book = side === "ask" ? alfaStockBook.asks : alfaStockBook.bids;
		fills.forEach((fill, i) => {
			const at = book.find((item) => item.price === fill.price);
			if (!at) return;
			const left = at.size - fill.size;
			const when = time + i * 0.4;
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
	};

	d.hidden([
		...flat("q"),
		...[
			"s-head",
			"u-head",
			"d-head",
			"b-head",
			"y-head",
			"l-head",
			"g-head",
			"k-head",
			"i-head",
		].map((name) => one(name)),
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
		total,
		one("p-avg"),
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
	show(one("q-tag"), 4.6);
	word(one("q-big"), 4.8);
	show(one("q-line"), 6.4);

	// ——— slice: a share and the company ———
	tl.addLabel("slice", 9.5);
	hide(flat("q"), 9.5);
	show(one("s-head"), 9.7, "above");
	show([one("px-tag"), px], 10.0);
	show([one("mine-tag"), mineVal], 10.6);
	show([one("co-tag"), coVal], 11.0);
	d.swap(one("s-head"), one("u-head"), 12.6);
	d.count(px, OPEN + 100, 13.0, dollars, OPEN, 0.8);
	d.count(mineVal, MINE * (OPEN + 100), 13.0, whole, MINE * OPEN, 0.8);
	d.count(coVal, SHARES * (OPEN + 100), 13.0, company, SHARES * OPEN, 0.8);
	show([mineChg, coChg], 13.2);
	d.count(mineChg, MINE * 100, 13.2, signed, 0, 0.8);
	d.count(coChg, SHARES * 100, 13.2, signedMillions, 0, 0.8);
	tl.set(
		[mineChg, coChg],
		{ attr: { class: "wt-film-num wt-film-gain" } },
		13.2,
	);
	d.swap(one("u-head"), one("d-head"), 15.2);
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
	tl.addLabel("quote", 18.5);
	hide([one("d-head"), ...flat("slice")], 18.5);
	show(one("b-head"), 18.7, "above");
	show(one("asks-tag"), 19.0);
	ASKS.forEach((at, i) => {
		show(one(`lv-${key("ask", at.price)}`), 19.1 + i * 0.1, "right");
	});
	show([one("spread"), one("last")], 19.5);
	BIDS.forEach((at, i) => {
		show(one(`lv-${key("bid", at.price)}`), 19.6 + i * 0.1, "right");
	});
	show(one("bids-tag"), 20.0);
	// Buy 10.
	d.swap(one("b-head"), one("y-head"), 21.4);
	take("ask", BUY10.fills, 21.8, 24.0);
	show([one("p-pay"), total], 21.9);
	d.count(total, BUY10.notional, 22.0, dollars, 0, 0.5);
	// Sell 10.
	d.swap(one("y-head"), one("l-head"), 24.0);
	d.swap(one("p-pay"), one("p-get"), 24.0);
	take("bid", SELL10.fills, 24.4, 26.4);
	d.count(total, SELL10.notional, 24.4, dollars, BUY10.notional, 0.5);
	// Buy 1,000.
	d.swap(one("l-head"), one("g-head"), 26.4);
	d.swap(one("p-get"), one("p-pay"), 26.4);
	take("ask", BUY_BIG.fills, 26.8, 30.4);
	d.count(total, BUY_BIG.notional, 26.8, dollars, SELL10.notional, 1.2);
	show(one("p-avg"), 28.2);

	// ——— kinds: what the underlying is ———
	tl.addLabel("kinds", 31);
	hide(
		[
			one("g-head"),
			one("asks-tag"),
			one("bids-tag"),
			one("spread"),
			one("last"),
			...levels,
			one("p-pay"),
			total,
			one("p-avg"),
		],
		31.0,
	);
	show(one("k-head"), 31.2, "above");
	show(
		flat("kinds").filter((el) => el.tagName === "text"),
		31.6,
	);
	kindOrder.forEach((kind, i) => {
		show(one(`col-${kind}`), 31.8 + i * 0.3);
	});
	d.swap(one("k-head"), one("i-head"), 33.8);
	tl.to(one("colbg-index"), { opacity: 1, duration: 0.4 }, 34.2);
	tl.to(
		[one("col-stock"), one("col-etf")],
		{ opacity: 0.4, duration: 0.4 },
		34.2,
	);
	// Cut: the claim.
	hide(
		[
			one("i-head"),
			...kindOrder.map((kind) => one(`col-${kind}`)),
			...flat("kinds").filter((el) => el.tagName === "text"),
		],
		36.0,
	);
	word(one("z-big"), 36.4);
	show(one("z-sub"), 36.9);

	// ——— next ———
	tl.addLabel("next", 39.5);
	hide(kids("claim"), 39.5);
	d.close(39.5);
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
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
