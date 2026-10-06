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
	stock,
	TRADES,
} from "./flow-sentiment-model";

/*
 * Sentiment labels, as a film. Someone buys Oct 18 95 puts at the ask: is buying bullish?
 * A two-by-two answers: the label needs both the option and what the aggressor did, and a
 * put bought reads bearish. Then Monday's three prints get one label each, bullish 10,
 * neutral 6, bearish 4, and the ledger shows the bearish 4 were two people closing. The
 * hero: the same "bearish" put, alone a bet on a fall, beside 100 shares a floor, where
 * glowing brackets lock. Last, buying back a short put: no view at all.
 *
 *   open      0–4        "Sentiment labels"
 *   question  4–8.6      puts bought at the ask: bullish?
 *   matrix    8.6–15.7   call bought, call sold, put bought, put sold
 *   tally     15.7–23.1  10 bullish, 6 neutral, 4 bearish; the bearish 4 were closing
 *   hedge     23.1–30.5  hero: the put alone, then beside shares: a floor
 *   close     30.5–34.5  closing a short put: no view
 *   claim     34.5–39.6  a label describes a print, not a person
 *   next      39.6–42.1  Next: strategies
 */

const END = 42.1;
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
	mHead: ["A label needs option and action.", "标签取决于：期权 × 操作。"],
	m2Head: ["So a put bought reads bearish.", "所以买入看跌读作看跌。"],
	buys: ["aggressor buys", "主动方买入"],
	sells: ["aggressor sells", "主动方卖出"],
	call: ["call", "看涨"],
	put: ["put", "看跌"],
	bullish: ["bullish", "看涨"],
	bearish: ["bearish", "看跌"],
	neutral: ["neutral", "中性"],
	up: ["ALFA ↑ helps", "ALFA ↑ 有利"],
	down: ["ALFA ↓ helps", "ALFA ↓ 有利"],
	tHead: ["Monday: one label per print.", "周一：每笔成交一个标签。"],
	t2Head: [
		`The bearish ${TOTALS[2]} were closing.`,
		`看跌的 ${TOTALS[2]} 张其实是平仓。`,
	],
	hHead: ["Alone, this put bets on a fall.", "单独买入，这张看跌押注下跌。"],
	h2Head: ["Beside 100 shares, it's a floor.", "配上 100 股，它是一个下限。"],
	h3Head: ["Buying one back: no view at all.", "买回平仓：毫无观点。"],
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
		"It can't see what the account holds.",
		"它看不到账户里已有的持仓。",
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
	const headline = (name: string, text: Copy) => (
		<Lines
			name={name}
			text={t(text)}
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
			{headline("m-head", copy.mHead)}
			{/* The answer to the question, as the put bought lands. */}
			<Lines
				name="m2-head"
				text={t(copy.m2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.mHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
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
			{headline("t-head", copy.tHead)}
			{/* What the labels can't see, as the ledger shows it. */}
			<Lines
				name="t2-head"
				text={t(copy.t2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.tHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
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
			{headline("h-head", copy.hHead)}
			{/* The hero's answer, as the floor appears under the shares. */}
			<Lines
				name="h2-head"
				text={t(copy.h2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.hHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			{headline("h3-head", copy.h3Head)}
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
								data-f="floor-label"
								x={L.x(PUT_95.strike) + 6}
								y={L.y(FLOOR) + 18}
								className="wt-small wt-halo"
							>
								{t(copy.floor)}
							</text>
						</g>
						<Brackets name="lock-floor" glow />
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
					y={L.top - (narrow ? 44 : 40)}
					width={narrow ? 150 : 200}
					height={narrow ? 24 : 28}
					rx={narrow ? 12 : 14}
					className="wt-panel-shape"
				/>
				<text
					x={margin + room - (narrow ? 75 : 100)}
					y={L.top - (narrow ? 44 : 40) + (narrow ? 16 : 19)}
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
	/** A line lands slightly large and settles, without overshoot. */
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
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
		"m-head",
		"m2-head",
		"t-head",
		"t2-head",
		"h-head",
		"h2-head",
		"h3-head",
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
	const floor = one("floor");
	const lockFloor = one<SVGGraphicsElement>("lock-floor");

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
	word(one("q-big"), 6.4);

	// ——— matrix: option × action ———
	tl.addLabel("matrix", 8.6);
	hide(flat("q"), 8.6);
	show(heads[0], 8.8);
	show(kids("grid"), 9.1);
	cells.forEach((cell, i) => {
		show(cell, 9.8 + i * 1.0);
	});
	// The question's answer, as the put bought comes up.
	show(heads[1], 12.1);

	// ——— tally: one label per print, and what the labels can't see ———
	tl.addLabel("tally", 15.7);
	hide([heads[0], heads[1], ...kids("grid"), ...cells], 15.7);
	show(heads[2], 16.05);
	rows.forEach((row, i) => {
		show(row, 16.2 + i * 0.6, "right");
	});
	segs.forEach((seg, i) => {
		tl.set(seg, { opacity: 1 }, 18.0);
		tl.fromTo(
			bars[i],
			{ attr: { width: 0 } },
			{
				attr: { width: Number(bars[i].getAttribute("width")) },
				duration: 0.5,
				ease: "power2.out",
			},
			18.0 + i * 0.35,
		);
		tl.fromTo(
			seg.lastElementChild,
			{ opacity: 0 },
			{ opacity: 1, duration: 0.3 },
			18.3 + i * 0.35,
		);
	});
	show(ledger[0], 19.1);
	show(ledger[1], 19.5);
	show(heads[3], 19.5);

	// ——— hedge: the hero. The same "bearish" put, alone and then beside shares. ———
	tl.addLabel("hedge", 23.1);
	hide([heads[2], heads[3], ...rows, ...segs, ...ledger], 23.1);
	show(heads[4], 23.45);
	d.rise(23.4);
	show(
		kids("chart").filter(
			(el) => !el.getAttribute("data-f")?.match(/^(l|g|lock)-|^floor$/),
		),
		23.6,
	);
	d.pop(one("feed"), 23.9);
	draw(chartLines[0], 24.1);
	show(tags[0], 24.6);
	hide([chartLines[0], tags[0]], 25.1, 0.3);
	draw(chartLines[1], 25.3);
	show(tags[1], 25.7);
	draw(chartLines[2], 25.9);
	show(tags[2], 26.4);
	show(floor, 26.6);
	// On the floor's figure: brackets round the whole line would reach the axis labels.
	d.lock(lockFloor, 26.9, { around: one("floor-label"), pad: 5 });
	tl.addLabel("hero-lock", 26.9);
	show(heads[5], 26.9);

	// ——— close: buying back a short put ———
	tl.addLabel("close", 30.5);
	d.swap([heads[4], heads[5]], heads[6], 30.5);
	hide(
		[chartLines[1], chartLines[2], tags[1], tags[2], floor, lockFloor],
		30.5,
		0.3,
	);
	draw(chartLines[3], 31.0);
	show(tags[3], 31.4);
	draw(chartLines[4], 31.6);
	show(tags[4], 32.0);

	// ——— claim ———
	tl.addLabel("claim", 34.5);
	hide([heads[6], one("feed")], 34.5);
	d.sink(34.5);
	word(one("z-big"), 34.8);
	show(one("z-sub"), 35.2);

	// ——— next ———
	tl.addLabel("next", 39.6);
	hide(kids("claim"), 39.6);
	d.close(39.6);
	return tl;
}

export const flowSentimentFilm: Film = {
	id: "flow-sentiment",
	label: [
		`Sentiment labels, as a short film: a two-by-two of call or put against the aggressor buying or selling, where calls bought and puts sold read bullish and calls sold and puts bought read bearish; Monday's three Oct 18 100 call prints labelled ${TOTALS[0]} bullish, ${TOTALS[1]} neutral and ${TOTALS[2]} bearish, while the ledger shows the bearish ${TOTALS[2]} were two people closing; and the same Oct 18 95 put bought at ${usd(PUT_ASK)}: alone a bet below ${usd(BREAK_EVEN)}, beside 100 shares a floor of ${signedUsd(FLOOR * 100, 0)}, and bought back to close a short put, no view at all`,
		`情绪标签短片：看涨或看跌与主动方买入或卖出的二乘二表格，买入看涨和卖出看跌读作看涨，卖出看涨和买入看跌读作看跌；周一三笔 10月18日 100 看涨的成交被标为看涨 ${TOTALS[0]}、中性 ${TOTALS[1]}、看跌 ${TOTALS[2]}，而台账显示看跌的 ${TOTALS[2]} 张其实是两个人在平仓；以及同一张以 ${usd(PUT_ASK)} 买入的 10月18日 95 看跌：单独买入是押注跌破 ${usd(BREAK_EVEN)}，配上 100 股是 ${signedUsd(FLOOR * 100, 0)} 的下限，买回看跌空头则毫无观点`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Sentiment labels", "情绪标签"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "matrix", label: ["Option × action", "期权 × 操作"] },
		{ id: "tally", label: ["Monday's tally", "周一统计"] },
		{ id: "hedge", label: ["One put, two positions", "一张看跌，两种持仓"] },
		{ id: "close", label: ["Closing", "平仓"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
