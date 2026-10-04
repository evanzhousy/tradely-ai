import { type Copy, expiries, pick, signedUsd, usd } from "@/content/world";
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
	chainRows,
	FEE,
	routeFacts,
	strikes,
	thinBook,
} from "./trading-options-model";

/*
 * Trading an option, as a film. It opens on one strike, the ALFA 100 call, in two
 * expiries and asks which costs more. The chain answers row by row: $4.20 for Oct 18,
 * $5.45 for Nov 15, because more time costs more. Then a thin contract with a 45-cent
 * spread: a market buy pays the $2.65 ask at once, a limit buy at $2.40 waits as the new
 * best bid and saves $25 only if a seller comes. Last, three ways the Nov 15 105 call,
 * bought for $325.65, can end: sold, expired or exercised.
 *
 *   open      0–4      "Trading an option"
 *   question  4–9.5    Oct 18 or Nov 15: which 100 call costs more?
 *   chain     9.5–19   the Oct 18 chain; Nov 15; one contract is 100 shares
 *   order     19–30    a thin book; market at the ask; a limit that waits; filled or not
 *   end       30–40.5  sell, expire, exercise; cut: the claim
 *   next      40.5–43  Next: risk first
 */

const END = 43;
const TABS = ["oct18", "nov15"] as const;
const ROWS = Object.fromEntries(
	TABS.map((id) => [id, chainRows(id)]),
) as Record<(typeof TABS)[number], ReturnType<typeof chainRows>>;
const FOCUS = 100;
const LIMIT = 240;
const ASK = thinBook.asks[0].price;
const ASKS = [...thinBook.asks].reverse();
const BIDS = thinBook.bids;
const MAX_SIZE = Math.max(
	...[...thinBook.asks, ...thinBook.bids].map((level) => level.size),
);
const PAID = 325 * 100 + FEE;
const ROUTES = ["sell", "expire", "exercise"] as const;
const cents = (value: number) => usd(value, 2);

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const rowTop = H * (narrow ? 0.4 : 0.38);
	const rowStep = H * (narrow ? 0.085 : 0.08);
	const colW = room / 5;
	const bookTop = H * (narrow ? 0.29 : 0.27);
	const bookStep = H * (narrow ? 0.075 : 0.07);
	const bookW = room * (narrow ? 0.6 : 0.56);
	const priceW = narrow ? 50 : width * 0.1;
	return {
		...frame,
		tabY: H * (narrow ? 0.27 : 0.26),
		rowY: (i: number) => rowTop + i * rowStep,
		rowStep,
		colX: (i: number) => margin + colW * (i + 0.5),
		colW,
		bookStep,
		rowH: bookStep * 0.78,
		askY: (i: number) => bookTop + i * bookStep,
		bidY: (i: number) =>
			bookTop + (ASKS.length + i) * bookStep + bookStep * 0.5,
		bookW,
		priceW,
		barX: margin + priceW + 10,
		barMax: bookW - priceW - 10 - (narrow ? 34 : 60),
		panelX: margin + room * (narrow ? 0.65 : 0.62),
		panelY: bookTop,
		cardY: H * (narrow ? 0.3 : 0.32),
		cardH: H * (narrow ? 0.5 : 0.44),
		cardW: (room - 2 * (narrow ? 8 : 18)) / 3,
		gap: narrow ? 8 : 18,
	};
}

const copy = {
	title: ["Trading an option", "交易期权"],
	titleSub: ["from chain to order", "从期权链到下单"],
	qTag: ["ALFA 100 call", "ALFA 100 看涨"],
	qLine: ["Which costs more?", "哪个更贵？"],
	chainHead: [
		"The chain: every contract has its own row and its own quote.",
		"期权链：每份合约都有自己的一行和自己的报价。",
	],
	chainHeadShort: ["Every contract has its own row.", "每份合约各占一行。"],
	novHead: [
		"Nov 15: four more weeks to move, so the same strike asks $5.45.",
		"11月15日：多四周时间，同一行权价要价 $5.45。",
	],
	novHeadShort: ["Nov 15: $5.45, more time.", "11月15日：$5.45，时间更长。"],
	contractHead: [
		"Quotes are per share; one contract is 100 shares: $545.",
		"报价是每股；一张合约是 100 股：$545。",
	],
	contractHeadShort: ["One contract: 100 × $5.45.", "一张合约：100 × $5.45。"],
	calls: ["calls", "看涨"],
	puts: ["puts", "看跌"],
	strike: ["strike", "行权价"],
	bidAsk: ["bid · ask", "买价 · 卖价"],
	thinHead: [
		"A thinly traded call: $2.20 bid, $2.65 ask, a few contracts each.",
		"一张冷门看涨：买价 $2.20，卖价 $2.65，每档只有几张。",
	],
	thinHeadShort: ["A thin call: $2.20 / $2.65.", "冷门看涨：$2.20 / $2.65。"],
	marketHead: [
		`A market buy takes the ask at once: ${usd(ASK * 100, 0)} a contract.`,
		`市价买单立即吃卖价：每张 ${usd(ASK * 100, 0)}。`,
	],
	marketHeadShort: [
		`Market: ${usd(ASK * 100, 0)}, now.`,
		`市价：${usd(ASK * 100, 0)}，立即。`,
	],
	limitHead: [
		"A limit buy at $2.40 joins the book as the best bid, and waits.",
		"$2.40 的限价买单成为最优买价，然后等待。",
	],
	limitHeadShort: ["Limit $2.40: it waits.", "限价 $2.40：等待。"],
	fillHead: [
		`If a seller takes $2.40 it fills, ${usd((ASK - LIMIT) * 100, 0)} cheaper. If none does, it never fills.`,
		`有卖方接受 $2.40 就成交，便宜 ${usd((ASK - LIMIT) * 100, 0)}；没有就一直不成交。`,
	],
	fillHeadShort: ["Fills only if a seller comes.", "有卖方才成交。"],
	asks: ["asks", "卖价"],
	bids: ["bids", "买价"],
	yours: ["you", "你"],
	pay: ["you pay", "你付出"],
	waiting: ["waiting", "等待中"],
	filled: ["filled at $2.40", "以 $2.40 成交"],
	endHead: [
		`The Nov 15 105 call, bought for ${cents(PAID)} with the fee, can end three ways.`,
		`含费用 ${cents(PAID)} 买入的 11月15日 105 看涨，有三种结束方式。`,
	],
	endHeadShort: [
		`Bought for ${cents(PAID)}: three endings.`,
		`${cents(PAID)} 买入：三种结局。`,
	],
	routes: {
		sell: {
			name: ["sell to close", "卖出平仓"],
			short: ["sell", "卖出"],
			when: ["Oct 11, at the $3.70 bid", "10月11日，买价 $3.70"],
			whenShort: ["Oct 11, at $3.70", "买价 $3.70"],
		},
		expire: {
			name: ["let it expire", "任其到期"],
			short: ["expire", "到期"],
			when: ["Nov 15, ALFA at $103", "11月15日，ALFA 在 $103"],
			whenShort: ["ALFA $103", "ALFA $103"],
		},
		exercise: {
			name: ["exercise", "行权"],
			short: ["exercise", "行权"],
			when: ["ALFA at $112: pay $10,500", "ALFA 在 $112：付 $10,500"],
			whenShort: ["ALFA $112, pay $10,500", "ALFA $112，付 $10,500"],
		},
	},
	claimBig: [
		"Pick the row, name your price, know how it ends.",
		"选对那一行，定好价格，弄清怎么结束。",
	],
	claimSub: [
		"A limit caps what you pay but not when; most positions end with a sale.",
		"限价控制价格但控制不了时间；多数持仓以卖出结束。",
	],
	nextBig: ["Next: risk first", "下一课：先看风险"],
	nextSub: ["how options lose money", "期权如何亏钱"],
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
	const rowText = narrow ? T.small * 1.1 : T.body;
	const center = (i: number) => L.rowY(i) + L.rowStep * 0.36 + rowText * 0.36;
	const bookText = (y: number) => y + L.rowH / 2 + rowText * 0.36;
	const quote = (q: { bid: number; ask: number }) =>
		narrow
			? `${(q.bid / 100).toFixed(2)}/${(q.ask / 100).toFixed(2)}`
			: `${usd(q.bid)} · ${usd(q.ask)}`;
	const bookLevel = (
		side: "ask" | "bid",
		name: string,
		y: number,
		price: number,
		size: number,
		tone: string,
	) => (
		<g key={name} data-f={name}>
			<text
				x={margin + L.priceW}
				y={bookText(y)}
				textAnchor="end"
				className="wt-film-num"
				style={{ fontSize: rowText }}
			>
				{usd(price)}
			</text>
			<rect
				x={L.barX}
				y={y + L.rowH * 0.2}
				width={(size / MAX_SIZE) * L.barMax}
				height={L.rowH * 0.6}
				rx={3}
				className="wt-film-bar"
				data-tone={tone}
			/>
			<text
				x={margin + L.bookW - 6}
				y={bookText(y)}
				textAnchor="end"
				className="wt-film-num wt-film-dim"
				style={{ fontSize: rowText }}
			>
				{side === "bid" && name === "bid-you" ? t(copy.yours) : String(size)}
			</text>
		</g>
	);
	const cardX = (i: number) => margin + i * (L.cardW + L.gap);
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
				{TABS.map((id, i) => (
					<Word
						key={id}
						name={`q-${id}`}
						x={W * (narrow ? [0.27, 0.73][i] : [0.32, 0.68][i])}
						y={H * 0.3 + T.big * 1.05}
						size={Math.min(
							T.big * 0.8,
							(W * 0.3) /
								(t(expiries[id].label).length * (locale === "zh" ? 0.9 : 0.62)),
						)}
						className="wt-film-num"
					>
						{t(expiries[id].label)}
					</Word>
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
			{headline("c-head", copy.chainHead, copy.chainHeadShort)}
			{headline("n-head", copy.novHead, copy.novHeadShort)}
			{headline("k-head", copy.contractHead, copy.contractHeadShort)}

			{/* The chain. */}
			<g data-f="chain">
				{TABS.map((id, i) => (
					<g key={id}>
						<rect
							data-f={`tab-${id}`}
							x={margin + i * (narrow ? 96 : 150)}
							y={L.tabY - T.body * 1.3}
							width={narrow ? 88 : 140}
							height={T.body * 2}
							rx={T.body}
							className="wt-focus-shape"
						/>
						<text
							x={margin + i * (narrow ? 96 : 150) + (narrow ? 44 : 70)}
							y={L.tabY}
							textAnchor="middle"
							className="wt-film-type"
							style={{ fontSize: rowText }}
						>
							{t(expiries[id].label)}
						</text>
					</g>
				))}
				<g data-f="chain-head">
					{(
						[
							[copy.calls, 0.5],
							[copy.strike, 2],
							[copy.puts, 3.5],
						] as const
					).map(([label, col]) => (
						<text
							key={label[0]}
							x={margin + (room / 5) * (col + 0.5)}
							y={L.rowY(0) - L.rowStep * 0.25}
							textAnchor="middle"
							className="wt-film-tag"
							style={{ fontSize: T.small }}
						>
							{`${t(label).toUpperCase()}${label === copy.strike || narrow ? "" : ` · ${t(copy.bidAsk)}`}`}
						</text>
					))}
				</g>
				{strikes.map((strike, i) => (
					<g key={strike}>
						<rect
							x={margin}
							y={L.rowY(i)}
							width={room}
							height={L.rowStep * 0.82}
							rx={8}
							className="wt-panel-shape"
						/>
						<text
							x={L.colX(2)}
							y={center(i)}
							textAnchor="middle"
							className="wt-film-num wt-film-accent"
							style={{ fontSize: rowText }}
						>
							{strike}
						</text>
					</g>
				))}
				<rect
					data-f="focus-cell"
					x={margin + 4}
					y={L.rowY(strikes.indexOf(FOCUS)) + 3}
					width={(room / 5) * 2 - 8}
					height={L.rowStep * 0.82 - 6}
					rx={7}
					className="wt-focus-shape"
				/>
				{TABS.map((id) => (
					<g key={id} data-f={`cells-${id}`}>
						{ROWS[id].map((row, i) => (
							<g key={row.strike}>
								<text
									x={margin + room / 5}
									y={center(i)}
									textAnchor="middle"
									className="wt-film-num"
									style={{ fontSize: rowText }}
								>
									{quote(row.call)}
								</text>
								<text
									x={margin + (room / 5) * 4}
									y={center(i)}
									textAnchor="middle"
									className="wt-film-num wt-film-dim"
									style={{ fontSize: rowText }}
								>
									{quote(row.put)}
								</text>
							</g>
						))}
					</g>
				))}
			</g>

			{/* A thin book. */}
			{headline("t-head", copy.thinHead, copy.thinHeadShort)}
			{headline("m-head", copy.marketHead, copy.marketHeadShort)}
			{headline("l-head", copy.limitHead, copy.limitHeadShort)}
			{headline("f-head", copy.fillHead, copy.fillHeadShort)}
			<g data-f="book">
				<text
					data-f="asks-tag"
					x={margin}
					y={L.askY(0) - T.small * 0.9}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.asks).toUpperCase()}
				</text>
				<rect
					data-f="ask-hit"
					x={margin}
					y={L.askY(ASKS.length - 1)}
					width={L.bookW}
					height={L.rowH}
					rx={7}
					className="wt-focus-shape"
				/>
				{ASKS.map((at, i) =>
					bookLevel(
						"ask",
						`ask-${at.price}`,
						L.askY(i),
						at.price,
						at.size,
						"loss",
					),
				)}
				<path
					data-f="spread"
					d={`M${margin} ${L.askY(ASKS.length) + L.bookStep * 0.1}H${margin + L.bookW}`}
					className="wt-film-link"
				/>
				<rect
					data-f="bid-hit"
					x={margin}
					y={L.bidY(0)}
					width={L.bookW}
					height={L.rowH}
					rx={7}
					className="wt-focus-shape"
				/>
				{bookLevel("bid", "bid-you", L.bidY(0), LIMIT, 1, "total")}
				{BIDS.map((at, i) =>
					bookLevel(
						"bid",
						`bid-${at.price}`,
						L.bidY(i + 1),
						at.price,
						at.size,
						"gain",
					),
				)}
				<text
					data-f="bids-tag"
					x={margin}
					y={L.bidY(BIDS.length) + L.rowH + T.small * 1.4}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.bids).toUpperCase()}
				</text>
			</g>
			<g data-f="panel">
				<text
					data-f="p-tag"
					x={L.panelX}
					y={L.panelY + T.small * 1.4}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.pay).toUpperCase()}
				</text>
				{(
					[
						["p-market", usd(ASK * 100, 0), "wt-film-accent"],
						["p-limit", usd(LIMIT * 100, 0), "wt-film-dim"],
						["p-filled", usd(LIMIT * 100, 0), "wt-film-gain"],
					] as const
				).map(([name, text, tone]) => (
					<text
						key={name}
						data-f={name}
						x={L.panelX}
						y={L.panelY + T.small * 1.4 + T.num * 1.25}
						className={`wt-film-num ${tone}`}
						style={{ fontSize: narrow ? T.num * 0.8 : T.num }}
					>
						{text}
					</text>
				))}
				{(
					[
						["s-waiting", copy.waiting, "wt-film-warn"],
						["s-filled", copy.filled, "wt-film-gain"],
					] as const
				).map(([name, text, tone]) => (
					<text
						key={name}
						data-f={name}
						x={L.panelX}
						y={L.panelY + T.small * 1.4 + T.num * 1.25 + T.body * 1.8}
						className={`wt-film-type ${tone}`}
						style={{ fontSize: T.body }}
					>
						{t(text)}
					</text>
				))}
			</g>

			{/* Three endings. */}
			{headline("e-head", copy.endHead, copy.endHeadShort)}
			{ROUTES.map((route, i) => {
				const r = copy.routes[route];
				const result = routeFacts(route).result;
				return (
					<g key={route} data-f={`card-${route}`}>
						<rect
							x={cardX(i)}
							y={L.cardY}
							width={L.cardW}
							height={L.cardH}
							rx={12}
							className="wt-panel-shape"
						/>
						<text
							x={cardX(i) + L.cardW / 2}
							y={L.cardY + L.cardH * 0.2}
							textAnchor="middle"
							className="wt-film-tag"
							style={{ fontSize: T.small }}
						>
							{t(narrow ? r.short : r.name).toUpperCase()}
						</text>
						<Lines
							name={`when-${route}`}
							text={t(narrow ? r.whenShort : r.when)}
							x={cardX(i) + L.cardW / 2}
							y={L.cardY + L.cardH * 0.42}
							size={narrow ? T.small : T.body}
							maxWidth={L.cardW - 12}
							className="wt-film-type wt-film-dim"
						/>
						<text
							x={cardX(i) + L.cardW / 2}
							y={L.cardY + L.cardH * 0.8}
							textAnchor="middle"
							className={`wt-film-num ${result >= 0 ? "wt-film-gain" : "wt-film-loss"}`}
							style={{ fontSize: narrow ? T.body * 1.15 : T.num * 0.85 }}
						>
							{signedUsd(result, 2)}
						</text>
					</g>
				);
			})}
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
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
			time,
		);
	const otherBids = BIDS.map((at) => one(`bid-${at.price}`));
	const cards = ROUTES.map((route) => one(`card-${route}`));
	const heads = [
		"c-head",
		"n-head",
		"k-head",
		"t-head",
		"m-head",
		"l-head",
		"f-head",
		"e-head",
	].map((name) => one(name));
	const chainParts = [
		...flat("chain").filter(
			(el) => !el.getAttribute("data-f")?.startsWith("cells-"),
		),
		one("cells-oct18"),
		one("cells-nov15"),
	];

	d.hidden([
		...flat("q"),
		...heads,
		...chainParts,
		...flat("book"),
		...flat("panel"),
		...cards,
		...kids("claim"),
	]);
	// The other bids start one place higher: your limit order hasn't arrived yet.
	tl.set(otherBids, { y: -L.bookStep }, 0);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: one strike, two expiries ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	word(one("q-oct18"), 4.8);
	word(one("q-nov15"), 5.2);
	show(one("q-line"), 6.4);

	// ——— chain: rows and quotes ———
	tl.addLabel("chain", 9.5);
	hide(flat("q"), 9.5);
	show(one("c-head"), 9.7, "above");
	show(
		flat("chain").filter(
			(el) =>
				!el.getAttribute("data-f")?.startsWith("cells-") &&
				!el.getAttribute("data-f")?.startsWith("tab-") &&
				el.getAttribute("data-f") !== "focus-cell",
		),
		10.0,
	);
	tl.to(one("tab-oct18"), { opacity: 1, duration: 0.3 }, 10.2);
	show(one("cells-oct18"), 10.4);
	tl.to(one("focus-cell"), { opacity: 1, duration: 0.3 }, 11.4);
	d.swap(one("c-head"), one("n-head"), 13.0);
	tl.to(one("tab-oct18"), { opacity: 0, duration: 0.3 }, 13.4);
	tl.to(one("tab-nov15"), { opacity: 1, duration: 0.3 }, 13.4);
	hide(one("cells-oct18"), 13.4, 0.25);
	show(one("cells-nov15"), 13.7);
	d.swap(one("n-head"), one("k-head"), 15.8);

	// ——— order: market or limit ———
	tl.addLabel("order", 19);
	hide([one("k-head"), ...chainParts], 19.0);
	show(one("t-head"), 19.2, "above");
	show(one("asks-tag"), 19.5);
	ASKS.forEach((at, i) => {
		show(one(`ask-${at.price}`), 19.6 + i * 0.1, "right");
	});
	show(one("spread"), 19.9);
	otherBids.forEach((bid, i) => {
		tl.fromTo(
			bid,
			{ opacity: 0, x: 18 },
			{ opacity: 1, x: 0, duration: 0.45 },
			20.0 + i * 0.1,
		);
	});
	show(one("bids-tag"), 20.3);
	// Market.
	d.swap(one("t-head"), one("m-head"), 21.8);
	tl.to(one("ask-hit"), { opacity: 1, duration: 0.3 }, 22.2);
	show([one("p-tag"), one("p-market")], 22.4);
	// Limit.
	d.swap(one("m-head"), one("l-head"), 24.2);
	tl.to(one("ask-hit"), { opacity: 0, duration: 0.3 }, 24.6);
	tl.to(otherBids, { y: 0, duration: 0.5, ease: "power2.inOut" }, 24.6);
	show(one("bid-you"), 25.0, "right");
	d.flip(one("p-market"), one("p-limit"), 25.0);
	tl.set(one("p-market"), { opacity: 0 }, 25.3);
	show(one("s-waiting"), 25.4);
	// Filled, if a seller comes.
	d.swap(one("l-head"), one("f-head"), 27.0);
	tl.to(one("bid-hit"), { opacity: 1, duration: 0.3 }, 27.4);
	d.flip(one("p-limit"), one("p-filled"), 27.6);
	tl.set(one("p-limit"), { opacity: 0 }, 27.9);
	d.swap(one("s-waiting"), one("s-filled"), 27.6);

	// ——— end: three ways out ———
	tl.addLabel("end", 30);
	hide(
		[
			one("f-head"),
			...flat("book"),
			one("bid-hit"),
			one("p-tag"),
			one("p-filled"),
			one("s-filled"),
		],
		30.0,
	);
	show(one("e-head"), 30.2, "above");
	cards.forEach((card, i) => {
		show(card, 30.6 + i * 0.6);
	});
	// Cut: the claim.
	hide([one("e-head"), ...cards], 35.6);
	word(one("z-big"), 36.0);
	show(one("z-sub"), 36.5);

	// ——— next ———
	tl.addLabel("next", 40.5);
	hide(kids("claim"), 40.5);
	d.close(40.5);
	return tl;
}

export const tradingOptionsFilm: Film = {
	id: "trading-options",
	label: [
		`Trading an option, as a short film: the ALFA 100 call in two expiries, $4.20 for Oct 18 and $5.45 for Nov 15, read from the chain, where one contract is 100 shares; a thin call quoted $2.20 bid and $2.65 ask, where a market buy pays ${usd(ASK * 100, 0)} at once and a limit buy at $2.40 waits as the best bid and fills only if a seller comes; and three ways the Nov 15 105 call bought for ${cents(PAID)} can end: sold for ${signedUsd(routeFacts("sell").result, 2)}, expired for ${signedUsd(routeFacts("expire").result, 2)}, or exercised for ${signedUsd(routeFacts("exercise").result, 2)}`,
		`交易期权短片：两个到期日的 ALFA 100 看涨，从期权链读出 10月18日 $4.20、11月15日 $5.45，一张合约是 100 股；一张报买价 $2.20、卖价 $2.65 的冷门看涨，市价买单立即付 ${usd(ASK * 100, 0)}，$2.40 的限价买单作为最优买价等待，只有卖方出现才成交；以及 ${cents(PAID)} 买入的 11月15日 105 看涨的三种结局：卖出 ${signedUsd(routeFacts("sell").result, 2)}，到期 ${signedUsd(routeFacts("expire").result, 2)}，行权 ${signedUsd(routeFacts("exercise").result, 2)}`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Trading an option", "交易期权"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "chain", label: ["The chain", "期权链"] },
		{ id: "order", label: ["Market or limit", "市价或限价"] },
		{ id: "end", label: ["How it ends", "如何结束"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
