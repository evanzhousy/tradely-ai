import { useId } from "react";
import { type Copy, count, pick, signedUsd, usd } from "@/content/world";
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
	BOUGHT_100,
	BUY_NOV,
	CALL_105,
	CALL_110,
	CASH_IN,
	CASH_OUT,
	longLeg,
	NET,
	RANGE,
	ROLL_QUANTITY,
	ROLL_SPOT,
	SELL_OCT,
	SOLD,
	STOCK_COST,
	shortLeg110,
	spreadPayoff,
	structures,
} from "./option-strategies-model";

/*
 * Strategies, as a film. One Oct 18 105 call sold at the $2.05 bid: a bet ALFA won't rise?
 * The chart answers with three positions it can belong to: alone, its loss has no limit;
 * against 100 shares it is a covered call; beside a long 100 call it caps a bull spread.
 * The hero adds a 105/110 spread's signed legs at $115: +$1,000, −$500, $500 together, and
 * glowing brackets lock on +$375 after its cost. Last, a roll: a sale at the bid and a
 * purchase at the ask, labelled bearish and bullish, that are one decision.
 *
 *   open      0–4        "Strategies"
 *   question  4–8.6      the 105 call sold at $2.05: a bet ALFA won't rise?
 *   leg       8.6–20.4   alone; covered by shares; capping a spread
 *   add       20.4–31.7  hero: long 105; short 110; payoff less cost; +$375 profit
 *   roll      31.7–38.0  sell October at the bid; buy November at the ask; one roll
 *   claim     38.0–42.7  one leg, many positions
 *   next      42.7–45.2  Next: straddles and condors
 */

const END = 45.2;
const Y = [-2200, 2200] as const;
const SPOT = 115;
const COVERED_TOP = structures.covered(RANGE[1]);
const SPREAD_LOW = structures.spread(RANGE[0]);
const SPREAD_HIGH = structures.spread(RANGE[1]);
const profit = (spot: number) => spreadPayoff(spot) - NET;
const stockLine = (spot: number) => (spot - STOCK_COST) * 100;
/** Dollars per contract as a whole-dollar figure: "$500", "+$375". */
const dollars = (value: number) => usd(value * 100, 0);
const signedDollars = (value: number) => signedUsd(value * 100, 0);
const ROLL_NET = CASH_OUT - CASH_IN;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const left = margin + (narrow ? 36 : 56);
	const right = margin + room;
	const top = H * (narrow ? 0.3 : 0.28);
	const bottom = H * 0.84;
	const readoutSize = narrow ? frame.type.small * 1.1 : frame.type.body;
	return {
		...frame,
		left,
		right,
		top,
		bottom,
		resultX: left + (narrow ? 78 : 110),
		resultY: top + readoutSize * 5.5,
		resultSize: frame.type.num * 1.8,
		x: (spot: number) =>
			left + ((spot - RANGE[0]) / (RANGE[1] - RANGE[0])) * (right - left),
		y: (dollars: number) =>
			bottom - ((dollars - Y[0]) / (Y[1] - Y[0])) * (bottom - top),
		rowY: (i: number) =>
			H * (narrow ? 0.3 : 0.33) + i * H * (narrow ? 0.17 : 0.18),
		rowH: H * (narrow ? 0.14 : 0.15),
		sumY: H * (narrow ? 0.7 : 0.75),
	};
}

const copy = {
	title: ["Strategies", "策略"],
	titleSub: ["one leg, many possible positions", "一条腿，多种可能的持仓"],
	qTag: ["Oct 18 105 call · at the bid", "10月18日 105 看涨 · 买价成交"],
	qLine: [`Someone sells it at ${usd(SOLD)}.`, `有人以 ${usd(SOLD)} 卖出它。`],
	qBig: ["A bet ALFA won't rise?", "押注 ALFA 不涨？"],
	lHead: ["Alone, its loss has no limit.", "单独卖出：亏损没有上限。"],
	cHead: ["With 100 shares: a covered call.", "配上 100 股：备兑看涨。"],
	sHead: [
		"With a long 100 call: a capped spread.",
		"配上 100 看涨多头：价差封顶。",
	],
	sold: ["105 call, sold", "105 看涨，卖出"],
	stock: [`stock · entry $${STOCK_COST}`, `股票 · 买入价 $${STOCK_COST}`],
	covered: ["covered call", "备兑看涨"],
	spread: [
		`long 100 cost ${dollars(BOUGHT_100)} · short 105`,
		`100 多头成本 ${dollars(BOUGHT_100)} · 105 空头`,
	],
	axisProfit: ["profit at Oct 18, per contract", "10月18日盈亏，每张合约"],
	axisPayoff: ["Oct 18 payoff · per contract", "10月18日到期价值 · 每张"],
	axisBoth: ["Oct 18 · payoff / profit", "10月18日 · 到期价值 / 盈亏"],
	aHead: ["New example: a 105/110 spread.", "新例子：105/110 看涨价差。"],
	a2Head: ["Profit after entry cost.", "扣除建仓成本后的盈亏。"],
	long105: ["long 105", "105 多头"],
	short110: ["short 110", "110 空头"],
	together: ["payoff", "到期价值"],
	lessCost: [
		`payoff ${dollars(spreadPayoff(SPOT))} − cost ${dollars(NET)}`,
		`到期 ${dollars(spreadPayoff(SPOT))} − 成本 ${dollars(NET)}`,
	],
	spot: [`ALFA $${SPOT}`, `ALFA $${SPOT}`],
	rHead: ["Sold at the bid, bought at the ask.", "买价卖出，卖价买入。"],
	r2Head: ["Two labels, one decision: a roll.", "两个标签，一个决定：移仓。"],
	rollTag: [
		`Fri Oct 4 · ALFA ${usd(ROLL_SPOT)}`,
		`10月4日 周五 · ALFA ${usd(ROLL_SPOT)}`,
	],
	sellOct: [
		`sell ${ROLL_QUANTITY} Oct 18 100 calls @ ${usd(SELL_OCT)}`,
		`卖出 ${ROLL_QUANTITY} 张 10月18日 100 看涨 @ ${usd(SELL_OCT)}`,
	],
	buyNov: [
		`buy ${ROLL_QUANTITY} Nov 15 100 calls @ ${usd(BUY_NOV)}`,
		`买入 ${ROLL_QUANTITY} 张 11月15日 100 看涨 @ ${usd(BUY_NOV)}`,
	],
	toClose: ["to close", "平仓"],
	toOpen: ["to open", "开仓"],
	bearish: ["feed: BID · bearish", "数据源：BID · 看跌"],
	bullish: ["feed: ASK · bullish", "数据源：ASK · 看涨"],
	roll: [
		`one roll: same $100 strike, four weeks later · net ${signedUsd(-ROLL_NET, 0)}`,
		`一次移仓：同一 $100 行权价，晚四周 · 净额 ${signedUsd(-ROLL_NET, 0)}`,
	],
	rollShort: [
		`one roll · net ${signedUsd(-ROLL_NET, 0)}`,
		`一次移仓 · 净额 ${signedUsd(-ROLL_NET, 0)}`,
	],
	rollDates: ["Oct 18 → Nov 15", "10月18日 → 11月15日"],
	rollWeeks: ["four weeks", "四周"],
	claimBig: ["One leg, many positions.", "一条腿，多种持仓。"],
	claimSub: [
		"A sale can cover, cap or roll.",
		"一笔卖出可以是备兑、封顶或移仓。",
	],
	nextBig: ["Next: straddles and condors", "下一课：跨式与铁鹰"],
	nextSub: [
		"four prints in one second, one package",
		"同一秒的四笔成交，一个整体",
	],
} as const satisfies Record<string, Copy>;

function Scene({
	width,
	locale,
}: {
	width: number;
	height: number;
	locale: Locale;
}) {
	const profitClip = useId().replace(/:/g, "");
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
		[RANGE[0], 100, 105, 110, RANGE[1]]
			.map(
				(s, i) =>
					`${i ? "L" : "M"}${L.x(s).toFixed(1)} ${L.y(Math.max(Math.min(f(s), Y[1]), Y[0])).toFixed(1)}`,
			)
			.join("");
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
	const readouts: [string, Copy, string, string][] = [
		["ro-0", copy.long105, signedDollars(longLeg(SPOT)), "var(--wt-long)"],
		[
			"ro-1",
			copy.short110,
			signedDollars(shortLeg110(SPOT)),
			"var(--wt-short)",
		],
		[
			"ro-2",
			copy.together,
			dollars(spreadPayoff(SPOT)),
			"var(--diagram-accent)",
		],
	];
	const rows: [Copy, Copy, Copy, string][] = [
		[copy.sellOct, copy.toClose, copy.bearish, "wt-film-loss"],
		[copy.buyNov, copy.toOpen, copy.bullish, "wt-film-gain"],
	];
	const axisCaptions: [string, Copy][] = [
		["axis-profit", copy.axisProfit],
		["axis-payoff", copy.axisPayoff],
		["axis-both", copy.axisBoth],
	];
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

			{/* The chart: three positions, then signed legs. */}
			{headline("l-head", copy.lHead)}
			{headline("c-head", copy.cHead)}
			{headline("s-head", copy.sHead)}
			{headline("a-head", copy.aHead)}
			{/* The hero's answer, as the profit after the cost comes up. */}
			<Lines
				name="a2-head"
				text={t(copy.a2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.aHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			<g data-f="depth">
				<g data-f="world">
					<g data-f="chart">
						{axisCaptions.map(([name, label]) => (
							<text
								key={name}
								data-f={name}
								x={L.left}
								y={L.top - 12}
								className="wt-small"
							>
								{t(label)}
							</text>
						))}
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
						<g data-f="spot">
							<path
								data-f="spot-guide"
								d={`M${L.x(SPOT)} ${L.top}V${L.bottom}`}
								className="wt-bracket"
								strokeDasharray="4 3"
							/>
							<text
								x={L.x(SPOT)}
								y={L.top - 12}
								textAnchor="middle"
								className="wt-small wt-halo"
							>
								{t(copy.spot)}
							</text>
						</g>
						<path
							data-f="l-alone"
							d={path(structures.alone)}
							className="wt-line-short"
						/>
						<path
							data-f="l-stock"
							d={path(stockLine)}
							className="wt-line-reference"
						/>
						<path
							data-f="l-covered"
							d={path(structures.covered)}
							className="wt-line-position"
						/>
						<path
							data-f="l-spread"
							d={path(structures.spread)}
							className="wt-line-position"
						/>
						<path data-f="l-long" d={path(longLeg)} className="wt-line-long" />
						<path
							data-f="l-short"
							d={path(shortLeg110)}
							className="wt-line-short"
						/>
						<path
							data-f="l-sum"
							d={path(spreadPayoff)}
							className="wt-line-position"
							strokeDasharray="6 5"
						/>
						<path
							data-f="l-profit"
							d={path(profit)}
							className="wt-line-position"
						/>
						<defs>
							<clipPath id={profitClip}>
								<rect
									data-f="profit-reveal"
									x={L.x(CALL_105.strike + NET / 100)}
									y={L.top}
									width={0}
									height={L.bottom - L.top}
								/>
							</clipPath>
						</defs>
						<path
							data-f="profit-area"
							clipPath={`url(#${profitClip})`}
							d={`M${L.x(CALL_105.strike + NET / 100)} ${L.y(0)}L${L.x(CALL_110.strike)} ${L.y(profit(CALL_110.strike))}H${L.right}V${L.y(0)}Z`}
							style={{ fill: "var(--diagram-accent)", fillOpacity: 0.16 }}
						/>
						{tag(
							"g-alone",
							82,
							structures.alone,
							copy.sold,
							"wt-film-dim",
							-10,
						)}
						{tag(
							"g-stock",
							115,
							stockLine,
							copy.stock,
							"wt-film-dim",
							-10,
							"end",
						)}
						{tag(
							"g-covered",
							119,
							structures.covered,
							copy.covered,
							"wt-film-accent",
							22,
							"end",
						)}
						{tag(
							"g-spread",
							119,
							structures.spread,
							copy.spread,
							"wt-film-accent",
							-10,
							"end",
						)}
						{[CALL_105, CALL_110].map((c) => (
							<g key={c.strike} data-f={`k-${c.strike}`}>
								<circle
									cx={L.x(c.strike)}
									cy={L.y(0)}
									r={3.5}
									className="wt-film-ghost"
								/>
								<text
									x={L.x(c.strike)}
									y={L.bottom + 32}
									textAnchor={c.strike === CALL_105.strike ? "end" : "start"}
									className="wt-small"
								>
									{t(
										c.strike === CALL_105.strike ? copy.long105 : copy.short110,
									)}
								</text>
							</g>
						))}
					</g>
				</g>
			</g>
			{readouts.map(([name, label, value, color], i) => (
				<g key={name} data-f={name}>
					<path
						d={`M${L.left + 12} ${L.top + 14 + i * text * 1.7}h${narrow ? 14 : 20}`}
						style={{
							stroke: color,
							strokeWidth: 2.5,
							strokeDasharray: i === 2 ? "4 3" : undefined,
						}}
					/>
					<text
						x={L.left + (narrow ? 32 : 40)}
						y={L.top + 14 + i * text * 1.7 + text * 0.36}
						className="wt-film-type"
						style={{ fontSize: text }}
					>
						{`${t(label)} · `}
						<tspan
							className={`wt-film-num ${i === 1 ? "wt-film-loss" : i === 0 ? "wt-long" : "wt-film-accent"}`}
						>
							{value}
						</tspan>
					</text>
				</g>
			))}

			<Word
				name="cost"
				x={L.left + 12}
				y={L.top + text * 1.2}
				size={text}
				anchor="start"
				className="wt-film-type wt-film-dim"
			>
				{t(copy.lessCost)}
			</Word>
			<Word
				name="ro-3"
				x={L.resultX}
				y={L.resultY}
				size={L.resultSize}
				className="wt-film-num wt-film-accent wt-halo"
			>
				{signedDollars(profit(SPOT))}
			</Word>
			<Brackets name="lock-profit" glow />

			{/* A roll: two prints, one decision. */}
			{headline("r-head", copy.rHead)}
			{/* The answer, as the bracket joins the two prints. */}
			<Lines
				name="r2-head"
				text={t(copy.r2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.rHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			<text
				data-f="roll-tag"
				x={margin}
				y={L.rowY(0) - T.small * 1.2}
				className="wt-film-tag"
				style={{ fontSize: T.small }}
			>
				{t(copy.rollTag).toUpperCase()}
			</text>
			{rows.map(([line, sub, label, tone], i) => (
				<g key={t(line)} data-f={`row-${i}`}>
					<rect
						x={margin}
						y={L.rowY(i)}
						width={room}
						height={L.rowH}
						rx={12}
						className="wt-panel-shape"
					/>
					<text
						x={margin + 14}
						y={L.rowY(i) + L.rowH * 0.42}
						className="wt-film-num"
						style={{ fontSize: text }}
					>
						{t(line)}
					</text>
					<text
						x={margin + 14}
						y={L.rowY(i) + L.rowH * 0.76}
						className="wt-film-type wt-film-dim"
						style={{ fontSize: T.small * 1.1 }}
					>
						{`${t(sub)} · `}
						<tspan className={i === 0 ? "wt-film-gain" : "wt-film-loss"}>
							{signedUsd(i === 0 ? CASH_IN : -CASH_OUT, 0)}
						</tspan>
					</text>
					<text
						x={margin + room - 14}
						y={L.rowY(i) + L.rowH * 0.76}
						textAnchor="end"
						className={`wt-film-type ${tone}`}
						style={{ fontSize: T.small * 1.1 }}
					>
						{t(label)}
					</text>
				</g>
			))}
			<path
				data-f="bracket"
				d={`M${margin - 8} ${L.rowY(0) + 8}h-6V${L.rowY(1) + L.rowH - 8}h6`}
				className="wt-film-riser"
			/>
			<Lines
				name="roll"
				text={t(narrow ? copy.rollShort : copy.roll)}
				x={margin}
				y={L.sumY}
				size={narrow ? T.body : T.body * 1.2}
				maxWidth={room}
				anchor="start"
				className="wt-film-type wt-film-loss"
			/>
			<path
				data-f="roll-extension"
				d={`M${margin} ${L.sumY + T.body * 2.5}H${margin + room * 0.65}l-7 -5m7 5l-7 5`}
				className="wt-bracket"
			/>
			<Word
				name="roll-dates"
				x={margin}
				y={L.sumY + T.body * 2.5 - 8}
				size={T.small}
				anchor="start"
				className="wt-film-type wt-film-dim"
			>
				{t(copy.rollDates)}
			</Word>
			<Word
				name="roll-weeks"
				x={margin + room * 0.65 + 10}
				y={L.sumY + T.body * 2.5 + T.small * 0.35}
				size={T.small}
				anchor="start"
				className="wt-film-type wt-film-dim"
			>
				{t(copy.rollWeeks)}
			</Word>

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
	/** Masked traces preserve a payoff curve's dashed identity throughout. */
	const draw = (path: SVGPathElement, time: number) =>
		d.trace(path, time, { duration: 0.7, ease: "power2.out" });
	const line = (name: string) => one<SVGPathElement>(`l-${name}`);
	const heads = [
		"l-head",
		"c-head",
		"s-head",
		"a-head",
		"a2-head",
		"r-head",
		"r2-head",
	].map((name) => one(name));
	const readouts = [0, 1, 2, 3].map((i) => one(`ro-${i}`));
	const lockProfit = one<SVGGraphicsElement>("lock-profit");
	const rows = [one("row-0"), one("row-1")];
	const axes = kids("chart").filter(
		(el) =>
			el.tagName !== "defs" &&
			!el.getAttribute("data-f")?.match(/^(l|g|k|axis)-|^spot$|^profit-area$/),
	);

	d.hidden([
		...flat("q"),
		...heads,
		...kids("chart").filter((el) => el.tagName !== "defs"),
		...readouts,
		one("cost"),
		lockProfit,
		one("roll-tag"),
		...rows,
		one("bracket"),
		one("roll"),
		one("roll-extension"),
		one("roll-dates"),
		one("roll-weeks"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: one sale ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	show(one("q-line"), 4.8);
	word(one("q-big"), 5.1);

	// ——— leg: the same sale in three positions ———
	tl.addLabel("leg", 8.6);
	hide(flat("q"), 8.6);
	show(heads[0], 8.8);
	d.rise(8.9);
	show(axes, 9.1);
	show(one("axis-profit"), 9.1);
	draw(line("alone"), 9.7);
	show(one("g-alone"), 10.3);
	d.swap(heads[0], heads[1], 12.4);
	hide([line("alone"), one("g-alone")], 12.4, 0.3);
	draw(line("stock"), 12.8);
	show(one("g-stock"), 13.3);
	draw(line("covered"), 13.4);
	show(one("g-covered"), 14.0);
	d.swap(heads[1], heads[2], 16.4);
	hide(
		[line("stock"), line("covered"), one("g-stock"), one("g-covered")],
		16.4,
		0.3,
	);
	draw(line("spread"), 16.8);
	show(one("g-spread"), L.narrow && context.locale === "en" ? 16.9 : 17.4);

	// ——— add: the hero. Signed legs at $115, then the cost. ———
	tl.addLabel("add", 20.4);
	d.swap(heads[2], heads[3], 20.4);
	d.swap(one("axis-profit"), one("axis-payoff"), 20.4);
	hide([line("spread"), one("g-spread")], 20.4, 0.3);
	show(one("spot"), 20.5);
	show([one("k-105"), one("k-110")], 20.5);
	draw(line("long"), 20.9);
	show(readouts[0], 21.4, "right");
	// Each completed readout gets a full second before the next construction.
	draw(line("short"), 22.9);
	show(readouts[1], 23.4, "right");
	tl.to([line("long"), line("short")], { opacity: 0.3, duration: 0.4 }, 24.9);
	draw(line("sum"), 25.0);
	show(readouts[2], 25.5, "right");
	tl.to(line("sum"), { opacity: 0.35, duration: 0.4 }, 27.0);
	hide([line("long"), line("short"), one("spot-guide")], 27.0, 0.35, 0);
	hide(readouts.slice(0, 3), 27.1, 0.35, 0);
	d.swap(one("axis-payoff"), one("axis-both"), 27.1);
	draw(line("profit"), 27.1);
	show(one("cost"), 27.6);
	show(readouts[3], 27.6);
	d.lock(lockProfit, 28.1, { around: readouts[3], pad: 8 });
	tl.addLabel("hero-lock", 28.1);
	show(heads[4], 28.1);
	// After the hero's 1.5-second quiet stand, draw its profitable expiry region.
	tl.fromTo(
		one("profit-area"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		30.1,
	);
	tl.fromTo(
		one("profit-reveal"),
		{ attr: { width: 0 } },
		{
			attr: { width: L.right - L.x(CALL_105.strike + NET / 100) },
			duration: 0.6,
			ease: "power2.out",
		},
		30.1,
	);

	// ——— roll: two prints, one decision ———
	tl.addLabel("roll", 31.7);
	hide([heads[3], heads[4], readouts[3], one("cost"), lockProfit], 31.7);
	d.sink(31.7);
	show(heads[5], 32.05);
	show(one("roll-tag"), 32.1);
	show(rows[0], 32.3, "right");
	show(rows[1], 33.1, "right");
	tl.fromTo(
		one("bracket"),
		{ opacity: 0, scaleY: 0, transformOrigin: "50% 50%" },
		{ opacity: 1, scaleY: 1, duration: 0.5 },
		34.1,
	);
	show(one("roll"), 34.4);
	show(heads[6], 34.4);
	d.trace(one<SVGPathElement>("roll-extension"), 36.3, { duration: 0.7 });
	show(one("roll-dates"), 36.3);
	show(one("roll-weeks"), 36.3);

	// ——— claim ———
	tl.addLabel("claim", 38.0);
	hide(
		[
			heads[5],
			heads[6],
			one("roll-tag"),
			...rows,
			one("bracket"),
			one("roll"),
			one("roll-extension"),
			one("roll-dates"),
			one("roll-weeks"),
		],
		38.0,
	);
	word(one("z-big"), 38.3);
	show(one("z-sub"), 38.7);

	// ——— next ———
	tl.addLabel("next", 42.7);
	hide(kids("claim"), 42.7);
	d.close(42.7);
	return tl;
}

export const optionStrategiesFilm: Film = {
	id: "option-strategies",
	label: [
		`Strategies, as a short film: one Oct 18 105 call sold at ${usd(SOLD)}, alone with a loss that has no limit, against 100 shares as a covered call that gains up to ${signedDollars(COVERED_TOP)}, and beside a long 100 call as the cap of a bull spread, ${signedDollars(SPREAD_LOW)} to ${signedDollars(SPREAD_HIGH)}; a 105/110 call spread added leg by leg at $${SPOT}, ${signedDollars(longLeg(SPOT))} and ${signedDollars(shortLeg110(SPOT))} for ${dollars(spreadPayoff(SPOT))}, and ${signedDollars(profit(SPOT))} after its cost; and a roll, ${count(ROLL_QUANTITY)} October calls sold at the bid and November calls bought at the ask, two opposite labels for one decision`,
		`策略短片：以 ${usd(SOLD)} 卖出的一张 10月18日 105 看涨：单独卖出亏损无上限；对着 100 股是备兑看涨，最多获利 ${signedDollars(COVERED_TOP)}；配上 100 看涨多头是牛市价差的上限，${signedDollars(SPREAD_LOW)} 到 ${signedDollars(SPREAD_HIGH)}；105/110 看涨价差在 $${SPOT} 逐腿相加：${signedDollars(longLeg(SPOT))} 与 ${signedDollars(shortLeg110(SPOT))} 合计 ${dollars(spreadPayoff(SPOT))}，扣除成本后 ${signedDollars(profit(SPOT))}；以及一次移仓：在买价卖出 ${ROLL_QUANTITY} 张十月看涨、在卖价买入十一月看涨，两个相反的标签，一个决定`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Strategies", "策略"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "leg", label: ["One leg", "一条腿"] },
		{ id: "add", label: ["Signed legs", "带符号的腿"] },
		{ id: "roll", label: ["A roll", "移仓"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
