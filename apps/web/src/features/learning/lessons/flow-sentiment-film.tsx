import {
	type Copy,
	count,
	holders,
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
	type Action,
	FLOOR,
	type Flow,
	flowLabel,
	PUT_95,
	PUT_ASK,
	PUT_BID,
	printFlow,
	putValue,
	RANGE,
	type Right,
	STOCK_COST,
	stock,
	TRADES,
} from "./flow-sentiment-model";

/*
 * Sentiment labels, as a film. Someone buys Oct 18 95 puts at the ask: is buying bullish?
 * A two-by-two answers: the label needs both the option and what the aggressor did, and a
 * put bought reads bearish. Then Monday's three prints get one label each, bullish 10,
 * neutral 6, bearish 4, while the ledger shows the bullish 10 opening and the bearish 4
 * closing. Last, the same "bearish" put alone, beside 100 shares, and closing a short put.
 *
 *   open      0–4      "Sentiment labels"
 *   question  4–9.5    puts bought at the ask: bullish?
 *   matrix    9.5–20   call bought, call sold, put bought, put sold
 *   tally     20–30.5  10 bullish, 6 neutral, 4 bearish; the ledger behind them
 *   hedge     30.5–39.5 the put alone, with shares, closing a short; cut: the claim
 *   next      39.5–42  Next: strategies
 */

const END = 42;
const RIGHTS: Right[] = ["call", "put"];
const ACTIONS: Action[] = ["buy", "sell"];
const FLOWS: Flow[] = ["bullish", "neutral", "bearish"];
const TOTALS = FLOWS.map((flow) =>
	TRADES.filter((trade) => printFlow(trade).flow === flow).reduce(
		(sum, trade) => sum + trade.quantity,
		0,
	),
);
const ALL = TOTALS.reduce((sum, n) => sum + n, 0);
const BULL = TRADES.find((trade) => printFlow(trade).flow === "bullish");
const BEAR = TRADES.find((trade) => printFlow(trade).flow === "bearish");
const BREAK_EVEN = PUT_95.strike * 100 - PUT_ASK;
/** Dollars per contract at expiry, for each position around the one put. */
const lines = {
	alone: (s: number) => putValue(s) - PUT_ASK,
	stock: (s: number) => stock(s),
	hedged: (s: number) => stock(s) + putValue(s) - PUT_ASK,
	short: (s: number) => PUT_BID - putValue(s),
	flat: () => PUT_BID - PUT_ASK,
};
const Y = [-2200, 2200] as const;
const tone = (flow: Flow) =>
	flow === "bullish"
		? "wt-film-gain"
		: flow === "bearish"
			? "wt-film-loss"
			: "wt-film-dim";

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const labelW = narrow ? 46 : room * 0.14;
	const gap = narrow ? 8 : 14;
	const cellW = (room - labelW - gap) / 2;
	const cellTop = H * (narrow ? 0.3 : 0.32);
	const cellH = H * (narrow ? 0.2 : 0.23);
	const left = margin + (narrow ? 36 : 56);
	const right = margin + room;
	const top = H * (narrow ? 0.3 : 0.28);
	const bottom = H * 0.84;
	return {
		...frame,
		cellX: (col: number) => margin + labelW + col * (cellW + gap),
		cellY: (row: number) => cellTop + row * (cellH + gap),
		cellW,
		cellH,
		rowY: (i: number) =>
			H * (narrow ? 0.27 : 0.28) + i * H * (narrow ? 0.07 : 0.08),
		barY: H * (narrow ? 0.55 : 0.56),
		barH: H * (narrow ? 0.06 : 0.07),
		ledgerY: (i: number) => H * (narrow ? 0.76 : 0.77) + i * H * 0.065,
		left,
		right,
		top,
		bottom,
		x: (spot: number) =>
			left + ((spot - RANGE[0]) / (RANGE[1] - RANGE[0])) * (right - left),
		y: (dollars: number) =>
			bottom - ((dollars - Y[0]) / (Y[1] - Y[0])) * (bottom - top),
	};
}

const verb = (effect: "open" | "close", buy: boolean): Copy =>
	buy
		? effect === "open"
			? ["bought to open", "买入开仓"]
			: ["bought to close", "买入平仓"]
		: effect === "open"
			? ["sold to open", "卖出开仓"]
			: ["sold to close", "卖出平仓"];

const copy = {
	title: ["Sentiment labels", "情绪标签"],
	titleSub: ["when bullish or bearish is justified", "何时能称为看涨或看跌"],
	qTag: ["Oct 18 95 put · at the ask", "10月18日 95 看跌 · 卖价成交"],
	qLine: ["Someone buys puts, paying the ask.", "有人以卖价买入看跌期权。"],
	qBig: ["Buying: bullish?", "买入就是看涨？"],
	m0: [
		"A label needs two things: which option, and what the aggressor did.",
		"标签需要两样东西：哪种期权，以及主动方做了什么。",
	],
	m0Short: ["Option × action.", "期权 × 操作。"],
	m1: [
		"Calls taken at the ask: a long call gains as ALFA rises. Bullish.",
		"在卖价买入看涨：看涨多头随 ALFA 上涨获利。看涨。",
	],
	m1Short: ["Call bought: bullish.", "买入看涨：看涨。"],
	m2: [
		"Calls hit at the bid: a short call gains if ALFA falls or stalls. Bearish.",
		"在买价卖出看涨：看涨空头在 ALFA 下跌或横盘时获利。看跌。",
	],
	m2Short: ["Call sold: bearish.", "卖出看涨：看跌。"],
	m3: [
		"Puts bought at the ask flip it: a long put gains as ALFA falls. Bearish.",
		"在卖价买入看跌则相反：看跌多头随 ALFA 下跌获利。看跌。",
	],
	m3Short: ["Put bought: bearish.", "买入看跌：看跌。"],
	m4: [
		"And puts sold at the bid read bullish. Buying isn't bullish by itself.",
		"在买价卖出看跌读作看涨。买入本身并不代表看涨。",
	],
	m4Short: ["Put sold: bullish.", "卖出看跌：看涨。"],
	buys: ["aggressor buys", "主动方买入"],
	sells: ["aggressor sells", "主动方卖出"],
	call: ["call", "看涨"],
	put: ["put", "看跌"],
	bullish: ["bullish", "看涨"],
	bearish: ["bearish", "看跌"],
	neutral: ["neutral", "中性"],
	up: ["ALFA ↑ helps", "ALFA ↑ 有利"],
	down: ["ALFA ↓ helps", "ALFA ↓ 有利"],
	t0: [
		"Monday's prints: one label each, from where it met its quote.",
		"周一的成交：每笔一个标签，看它相对报价的位置。",
	],
	t0Short: ["One label per print.", "每笔一个标签。"],
	t1: [
		"Inside the spread there's no aggressor to label: neutral means unknown.",
		"价差之内没有主动方可贴标签：中性表示未知。",
	],
	t1Short: ["Inside: neutral.", "价差之内：中性。"],
	t2: [
		`The day reads ${TOTALS[0]} bullish, ${TOTALS[1]} neutral, ${TOTALS[2]} bearish.`,
		`当天读数：看涨 ${TOTALS[0]}、中性 ${TOTALS[1]}、看跌 ${TOTALS[2]}。`,
	],
	t2Short: [
		`${TOTALS[0]} bullish, ${TOTALS[1]} neutral, ${TOTALS[2]} bearish.`,
		`看涨 ${TOTALS[0]}、中性 ${TOTALS[1]}、看跌 ${TOTALS[2]}。`,
	],
	t3: [
		`Behind them: the bullish ${TOTALS[0]} opened, and the bearish ${TOTALS[2]} were two people closing.`,
		`幕后：看涨的 ${TOTALS[0]} 张是开仓，看跌的 ${TOTALS[2]} 张是两个人在平仓。`,
	],
	t3Short: ["Labels aren't people.", "标签不是人。"],
	h0: [
		`Bought alone at ${usd(PUT_ASK)}, the 95 put gains below ${usd(BREAK_EVEN)}: bearish fits.`,
		`单独以 ${usd(PUT_ASK)} 买入，95 看跌在 ${usd(BREAK_EVEN)} 以下获利：看跌贴切。`,
	],
	h0Short: ["Alone: bearish fits.", "单独买入：看跌贴切。"],
	h1: [
		`Beside 100 shares bought at $${STOCK_COST}, it still gains as ALFA rises, with a floor.`,
		`配上以 $${STOCK_COST} 买入的 100 股，ALFA 上涨仍然获利，还多了下限。`,
	],
	h1Short: ["With shares: a floor.", "有股票：多了下限。"],
	h2: [
		"Buying back a short put closes it: no view left at all.",
		"买回看跌空头就是平仓：一点观点都没有了。",
	],
	h2Short: ["Closing: no view.", "平仓：没有观点。"],
	feed: ["feed label: bearish", "数据标签：看跌"],
	axis: ["profit at Oct 18, per contract", "10月18日盈亏，每张合约"],
	longPut: ["long put", "看跌多头"],
	stockAlone: ["stock alone", "仅股票"],
	hedged: ["stock + put", "股票 + 看跌"],
	shortBefore: ["short put, before", "此前的看跌空头"],
	after: ["after buying back", "买回之后"],
	floor: [
		`floor ${signedUsd(FLOOR * 100, 0)}`,
		`下限 ${signedUsd(FLOOR * 100, 0)}`,
	],
	claimBig: [
		"A label describes a print, not a person.",
		"标签描述成交，不描述人。",
	],
	claimSub: [
		"It needs an option and a likely side, and it can't see what the account already holds.",
		"它需要期权类型和可能的方向，却看不到账户里已有的持仓。",
	],
	nextBig: ["Next: strategies", "下一课：策略"],
	nextSub: ["one leg, many possible positions", "一条腿，多种可能的持仓"],
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
	const path = (f: (s: number) => number) =>
		[RANGE[0], PUT_95.strike, RANGE[1]]
			.map(
				(s, i) =>
					`${i ? "L" : "M"}${L.x(s).toFixed(1)} ${L.y(f(s)).toFixed(1)}`,
			)
			.join("");
	/** A line's name, beside it near the left of the chart. */
	const tag = (
		name: string,
		at: number,
		f: (s: number) => number,
		label: Copy,
		className: string,
		dy: number,
		anchor: "start" | "end" = "start",
	) => (
		<text
			data-f={name}
			x={L.x(at) + (anchor === "end" ? -6 : 0)}
			y={L.y(f(at)) + dy}
			textAnchor={anchor}
			className={`wt-film-type ${className}`}
			style={{ fontSize: T.small * 1.1 }}
		>
			{t(label)}
		</text>
	);
	const legs: Record<string, Copy> = {
		"call-buy": ["long call", "看涨多头"],
		"call-sell": ["short call", "看涨空头"],
		"put-buy": ["long put", "看跌多头"],
		"put-sell": ["short put", "看跌空头"],
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
					y={H * 0.32}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.qTag).toUpperCase()}
				</Word>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.43}
					size={T.head}
					maxWidth={room}
					className="wt-film-type wt-film-accent"
				/>
				<Lines
					name="q-big"
					text={t(copy.qBig)}
					x={W / 2}
					y={H * 0.6}
					size={T.title}
					maxWidth={room}
				/>
			</g>

			{/* Option × action. */}
			{headline("m0", copy.m0, copy.m0Short)}
			{headline("m1", copy.m1, copy.m1Short)}
			{headline("m2", copy.m2, copy.m2Short)}
			{headline("m3", copy.m3, copy.m3Short)}
			{headline("m4", copy.m4, copy.m4Short)}
			<g data-f="grid">
				{[copy.buys, copy.sells].map((label, col) => (
					<text
						key={t(label)}
						x={L.cellX(col) + L.cellW / 2}
						y={L.cellY(0) - T.small * 1.1}
						textAnchor="middle"
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(label).toUpperCase()}
					</text>
				))}
				{[copy.call, copy.put].map((label, row) => (
					<text
						key={t(label)}
						x={margin}
						y={L.cellY(row) + L.cellH / 2 + T.small * 0.4}
						className="wt-film-tag"
						style={{ fontSize: T.small * 1.1 }}
					>
						{t(label).toUpperCase()}
					</text>
				))}
				{RIGHTS.flatMap((right, row) =>
					ACTIONS.map((action, col) => (
						<rect
							key={`${right}-${action}`}
							x={L.cellX(col)}
							y={L.cellY(row)}
							width={L.cellW}
							height={L.cellH}
							rx={12}
							className="wt-panel-shape"
						/>
					)),
				)}
			</g>
			{RIGHTS.flatMap((right, row) =>
				ACTIONS.map((action, col) => {
					const flow = flowLabel(right, action);
					const x = L.cellX(col) + L.cellW / 2;
					const y = L.cellY(row);
					return (
						<g key={`${right}-${action}`} data-f={`cell-${right}-${action}`}>
							<rect
								x={L.cellX(col)}
								y={y}
								width={L.cellW}
								height={L.cellH}
								rx={12}
								className="wt-focus-shape"
							/>
							<text
								x={x}
								y={y + L.cellH * 0.42}
								textAnchor="middle"
								className={`wt-film-type ${tone(flow)}`}
								style={{ fontSize: narrow ? T.body * 1.15 : T.head * 1.2 }}
							>
								{t(copy[flow])}
							</text>
							<text
								x={x}
								y={y + L.cellH * 0.64}
								textAnchor="middle"
								className="wt-film-type"
								style={{ fontSize: T.small * 1.1 }}
							>
								{t(flow === "bullish" ? copy.up : copy.down)}
							</text>
							<text
								x={x}
								y={y + L.cellH * 0.82}
								textAnchor="middle"
								className="wt-film-type wt-film-dim"
								style={{ fontSize: T.small }}
							>
								{t(legs[`${right}-${action}`])}
							</text>
						</g>
					);
				}),
			)}

			{/* Monday's tally. */}
			{headline("t0", copy.t0, copy.t0Short)}
			{headline("t1", copy.t1, copy.t1Short)}
			{headline("t2", copy.t2, copy.t2Short)}
			{headline("t3", copy.t3, copy.t3Short)}
			{TRADES.map((trade, i) => {
				const { side, flow } = printFlow(trade);
				return (
					<g key={trade.id} data-f={`row-${i}`}>
						<text
							x={margin}
							y={L.rowY(i)}
							className="wt-film-num"
							style={{ fontSize: text }}
						>
							{`${trade.time} · ${count(trade.quantity)} @ ${usd(trade.price)}`}
						</text>
						<text
							x={margin + room * (narrow ? 0.62 : 0.55)}
							y={L.rowY(i)}
							textAnchor="end"
							className="wt-film-num wt-film-dim"
							style={{ fontSize: text }}
						>
							{side ?? "—"}
						</text>
						<text
							x={margin + room}
							y={L.rowY(i)}
							textAnchor="end"
							className={`wt-film-type ${tone(flow)}`}
							style={{ fontSize: text }}
						>
							{`${t(copy[flow])} ${trade.quantity}`}
						</text>
					</g>
				);
			})}
			{FLOWS.map((flow, i) => {
				const before = TOTALS.slice(0, i).reduce((sum, n) => sum + n, 0);
				const x = margin + (before / ALL) * room;
				const w = (TOTALS[i] / ALL) * room;
				return (
					<g key={flow} data-f={`seg-${flow}`}>
						<rect
							data-f={`bar-${flow}`}
							x={x}
							y={L.barY}
							width={Math.max(w - 3, 0)}
							height={L.barH}
							rx={4}
							className="wt-film-bar"
							data-tone={
								flow === "bullish"
									? "gain"
									: flow === "bearish"
										? "loss"
										: "neutral"
							}
						/>
						<text
							x={x + w / 2}
							y={L.barY + L.barH + T.small * 1.6}
							textAnchor="middle"
							className={`wt-film-type ${tone(flow)}`}
							style={{ fontSize: T.small * 1.1 }}
						>
							{`${t(copy[flow])} ${TOTALS[i]}`}
						</text>
					</g>
				);
			})}
			{[BULL, BEAR].map((trade, i) =>
				trade ? (
					<Lines
						key={trade.id}
						name={`ledger-${i}`}
						text={`${t(copy[i ? "bearish" : "bullish"])} ${trade.quantity}: ${t(holders[trade.buyer].name)} ${t(verb(trade.buyerEffect, true))} · ${t(holders[trade.seller].name)} ${t(verb(trade.sellerEffect, false))}`}
						x={margin}
						y={L.ledgerY(i)}
						size={text}
						maxWidth={room}
						anchor="start"
						className={`wt-film-type ${i ? "wt-film-loss" : "wt-film-gain"}`}
					/>
				) : null,
			)}

			{/* One put, three positions. */}
			{headline("h0", copy.h0, copy.h0Short)}
			{headline("h1", copy.h1, copy.h1Short)}
			{headline("h2", copy.h2, copy.h2Short)}
			<g data-f="depth">
				<g data-f="world">
					<g data-f="chart">
						<text x={L.left} y={L.top - 12} className="wt-small">
							{t(copy.axis)}
						</text>
						{[-2000, -1000, 0, 1000, 2000].map((v) => (
							<g key={v}>
								<path
									d={`M${L.left} ${L.y(v)}H${L.right}`}
									className={v === 0 ? "wt-axis" : "wt-grid"}
								/>
								<text
									x={L.left - 8}
									y={L.y(v) + 4}
									textAnchor="end"
									className="wt-small"
								>
									{v === 0
										? "$0"
										: `${v < 0 ? "−" : "+"}${Math.abs(v) / 1000}k`}
								</text>
							</g>
						))}
						{[80, 90, 100, 110, 120].map((v) => (
							<text
								key={v}
								x={L.x(v)}
								y={L.bottom + 16}
								textAnchor={
									v === RANGE[1] ? "end" : v === RANGE[0] ? "start" : "middle"
								}
								className="wt-small"
							>
								{`$${v}`}
							</text>
						))}
						<path
							data-f="l-alone"
							d={path(lines.alone)}
							className="wt-line-position"
						/>
						<path
							data-f="l-stock"
							d={path(lines.stock)}
							className="wt-line-reference"
						/>
						<path
							data-f="l-hedged"
							d={path(lines.hedged)}
							className="wt-line-position"
						/>
						<path
							data-f="l-short"
							d={path(lines.short)}
							className="wt-line-reference"
						/>
						<path
							data-f="l-flat"
							d={path(lines.flat)}
							className="wt-line-position"
						/>
						<g data-f="floor">
							<path
								d={`M${L.x(RANGE[0])} ${L.y(FLOOR)}H${L.x(PUT_95.strike)}`}
								className="wt-bracket"
								strokeDasharray="4 3"
							/>
							<text
								x={L.x(PUT_95.strike) + 6}
								y={L.y(FLOOR) + 18}
								className="wt-small wt-halo"
							>
								{t(copy.floor)}
							</text>
						</g>
						{tag(
							"g-alone",
							82,
							lines.alone,
							copy.longPut,
							"wt-film-accent",
							-12,
						)}
						{tag(
							"g-stock",
							104,
							lines.stock,
							copy.stockAlone,
							"wt-film-dim",
							-10,
							"end",
						)}
						{tag(
							"g-hedged",
							112,
							lines.hedged,
							copy.hedged,
							"wt-film-accent",
							22,
						)}
						{tag(
							"g-short",
							81,
							lines.short,
							copy.shortBefore,
							"wt-film-dim",
							22,
						)}
						{tag(
							"g-flat",
							118,
							lines.flat,
							copy.after,
							"wt-film-accent",
							20,
							"end",
						)}
					</g>
				</g>
			</g>
			<g data-f="feed">
				<rect
					x={margin + room - (narrow ? 150 : 200)}
					y={L.top - (narrow ? 62 : 40)}
					width={narrow ? 150 : 200}
					height={narrow ? 24 : 28}
					rx={narrow ? 12 : 14}
					className="wt-panel-shape"
				/>
				<text
					x={margin + room - (narrow ? 75 : 100)}
					y={L.top - (narrow ? 62 : 40) + (narrow ? 16 : 19)}
					textAnchor="middle"
					className="wt-film-type wt-film-loss"
					style={{ fontSize: T.small * 1.1 }}
				>
					{t(copy.feed)}
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
	/** A line draws itself from its start. */
	const draw = (path: SVGPathElement, time: number) => {
		const length = path.getTotalLength();
		tl.fromTo(
			path,
			{ opacity: 0, strokeDasharray: length, strokeDashoffset: length },
			{ opacity: 1, strokeDashoffset: 0, duration: 0.7, ease: "power2.out" },
			time,
		);
	};
	const heads = [
		"m0",
		"m1",
		"m2",
		"m3",
		"m4",
		"t0",
		"t1",
		"t2",
		"t3",
		"h0",
		"h1",
		"h2",
	].map((name) => one(name));
	const cells = ["call-buy", "call-sell", "put-buy", "put-sell"].map((key) =>
		one(`cell-${key}`),
	);
	const rows = TRADES.map((_, i) => one(`row-${i}`));
	const segs = FLOWS.map((flow) => one(`seg-${flow}`));
	const bars = FLOWS.map((flow) => one(`bar-${flow}`));
	const ledger = [one("ledger-0"), one("ledger-1")];
	const chartLines = ["alone", "stock", "hedged", "short", "flat"].map((name) =>
		one<SVGPathElement>(`l-${name}`),
	);
	const tags = ["alone", "stock", "hedged", "short", "flat"].map((name) =>
		one(`g-${name}`),
	);

	d.hidden([
		...flat("q"),
		...heads,
		...kids("grid"),
		...cells,
		...rows,
		...segs,
		...ledger,
		...kids("chart"),
		one("feed"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: is buying bullish? ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	show(one("q-line"), 5.1);
	word(one("q-big"), 6.6);

	// ——— matrix: option × action ———
	tl.addLabel("matrix", 9.5);
	hide(flat("q"), 9.5);
	show(heads[0], 9.7, "above");
	show(kids("grid"), 10.0);
	cells.forEach((cell, i) => {
		const at = 11.4 + i * 2.0;
		d.swap(heads[i], heads[i + 1], at);
		d.pop(cell, at + 0.4);
	});

	// ——— tally: one label per print ———
	tl.addLabel("tally", 20);
	hide([heads[4], ...kids("grid"), ...cells], 20.0);
	show(heads[5], 20.2, "above");
	show(rows[0], 20.6, "right");
	d.swap(heads[5], heads[6], 22.2);
	show(rows[1], 22.6, "right");
	d.swap(heads[6], heads[7], 24.2);
	show(rows[2], 24.4, "right");
	segs.forEach((seg, i) => {
		tl.set(seg, { opacity: 1 }, 25.0);
		tl.fromTo(
			bars[i],
			{ attr: { width: 0 } },
			{
				attr: { width: Number(bars[i].getAttribute("width")) },
				duration: 0.5,
				ease: "power2.out",
			},
			25.0 + i * 0.4,
		);
		tl.fromTo(
			seg.lastElementChild,
			{ opacity: 0 },
			{ opacity: 1, duration: 0.3 },
			25.3 + i * 0.4,
		);
	});
	d.swap(heads[7], heads[8], 27.2);
	show(ledger[0], 27.6);
	show(ledger[1], 28.0);

	// ——— hedge: one put, three positions ———
	tl.addLabel("hedge", 30.5);
	hide([heads[8], ...rows, ...segs, ...ledger], 30.5);
	show(heads[9], 30.7, "above");
	d.rise(30.8);
	show(
		kids("chart").filter(
			(el) => !el.getAttribute("data-f")?.match(/^(l|g)-|^floor$/),
		),
		31.0,
	);
	d.pop(one("feed"), 31.3);
	draw(chartLines[0], 31.5);
	show(tags[0], 32.0);
	d.swap(heads[9], heads[10], 33.0);
	hide([chartLines[0], tags[0]], 33.0, 0.3);
	draw(chartLines[1], 33.4);
	show(tags[1], 33.8);
	draw(chartLines[2], 34.0);
	show(tags[2], 34.5);
	show(one("floor"), 34.6);
	d.swap(heads[10], heads[11], 35.4);
	hide(
		[chartLines[1], chartLines[2], tags[1], tags[2], one("floor")],
		35.4,
		0.3,
	);
	draw(chartLines[3], 35.8);
	show(tags[3], 36.2);
	draw(chartLines[4], 36.4);
	show(tags[4], 36.8);
	// Cut: the claim.
	hide([heads[11], one("feed")], 37.6);
	d.sink(37.6);
	word(one("z-big"), 37.9);
	show(one("z-sub"), 38.3);

	// ——— next ———
	tl.addLabel("next", 39.5);
	hide(kids("claim"), 39.5);
	d.close(39.5);
	return tl;
}

export const flowSentimentFilm: Film = {
	id: "flow-sentiment",
	label: [
		`Sentiment labels, as a short film: a two-by-two of call or put against the aggressor buying or selling, where calls bought and puts sold read bullish and calls sold and puts bought read bearish; Monday's three Oct 18 100 call prints labelled ${TOTALS[0]} bullish, ${TOTALS[1]} neutral and ${TOTALS[2]} bearish, while the ledger shows the bullish ${TOTALS[0]} opening and the bearish ${TOTALS[2]} closing; and the same Oct 18 95 put bought at ${usd(PUT_ASK)} as a bet below ${usd(BREAK_EVEN)}, as a floor of ${signedUsd(FLOOR * 100, 0)} under 100 shares, and as the close of a short put`,
		`情绪标签短片：看涨或看跌与主动方买入或卖出的二乘二表格，买入看涨和卖出看跌读作看涨，卖出看涨和买入看跌读作看跌；周一三笔 10月18日 100 看涨的成交被标为看涨 ${TOTALS[0]}、中性 ${TOTALS[1]}、看跌 ${TOTALS[2]}，而台账显示看涨的 ${TOTALS[0]} 张是开仓、看跌的 ${TOTALS[2]} 张是平仓；以及同一张以 ${usd(PUT_ASK)} 买入的 10月18日 95 看跌：押注跌破 ${usd(BREAK_EVEN)}、为 100 股设 ${signedUsd(FLOOR * 100, 0)} 的下限，或者平掉看跌空头`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Sentiment labels", "情绪标签"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "matrix", label: ["Option × action", "期权 × 操作"] },
		{ id: "tally", label: ["Monday's tally", "周一统计"] },
		{ id: "hedge", label: ["One put, three positions", "一张看跌，三种持仓"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
