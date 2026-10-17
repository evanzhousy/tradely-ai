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
	toneClass,
	toneColor,
	Word,
} from "../walkthrough/film-kit";
import {
	CALL_105,
	CALL_110,
	CASH_IN,
	CASH_OUT,
	longLeg,
	NET,
	RANGE,
	ROLL_QUANTITY,
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
 *   leg       8.6–21.35   alone; covered by shares; capping a spread
 *   add       21.35–34.0  hero: long 105; short 110; payoff less cost; +$375 profit
 *   roll      34.0–40.3  sell October at the bid; buy November at the ask; one roll
 *   claim     40.3–45.0  one leg, many positions
 *   next      45.0–47.5  Next: straddles and condors
 */

const END = 47.5;
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
	qTag: ["Oct 18 105C · BID", "10/18 105C · 买价成交"],
	qLine: [`Sold for ${usd(SOLD)}.`, `以 ${usd(SOLD)} 卖出。`],
	qBig: ["A bet ALFA won't rise?", "押注 ALFA 不涨？"],
	lHead: ["Alone, its loss has no limit.", "单独卖出：亏损没有上限。"],
	cHead: ["100 shares: a covered call.", "100 股：备兑看涨。"],
	sHead: ["Long 100 call: capped spread.", "加上 100 看涨多头：价差封顶。"],
	sold: ["105 call, sold", "105 看涨，卖出"],
	stock: [`stock · entry $${STOCK_COST}`, `股票 · 买入价 $${STOCK_COST}`],
	covered: ["covered call", "备兑看涨"],
	spread: [
		`net cost ${dollars(-SPREAD_LOW)}`,
		`净成本 ${dollars(-SPREAD_LOW)}`,
	],
	spreadShort: ["short 105", "105 空头"],
	axisProfit: ["profit at Oct 18, per contract", "10月18日盈亏，每张合约"],
	axisPayoff: ["Oct 18 payoff · per contract", "10月18日到期价值 · 每张"],
	axisBoth: ["Oct 18", "10月18日"],
	profitLabel: ["profit", "盈亏"],
	aHead: ["New example: a 105/110 spread.", "新例子：105/110 看涨价差。"],
	a2Head: ["Profit after entry cost.", "扣除建仓成本后的盈亏。"],
	long105: ["long 105", "105 多头"],
	short110: ["short 110", "110 空头"],
	readoutLong: ["long", "多头"],
	readoutShort: ["short", "空头"],
	readoutTotal: ["total", "合计"],
	together: ["payoff", "到期价值"],
	lessCost: [
		`${dollars(spreadPayoff(SPOT))} − ${dollars(NET)}`,
		`${dollars(spreadPayoff(SPOT))} − ${dollars(NET)}`,
	],
	spot: [`ALFA $${SPOT}`, `ALFA $${SPOT}`],
	rHead: ["Sold at the bid, bought at the ask.", "买价卖出，卖价买入。"],
	r2Head: ["Two labels, one decision: a roll.", "两个标签，一个决定：移仓。"],
	rollTag: [
		`Fri Oct 4 · ${count(ROLL_QUANTITY)} contracts per leg`,
		`10月4日 周五 · 每腿 ${count(ROLL_QUANTITY)} 张合约`,
	],
	sellOct: ["sell Oct 18 · 100 call", "卖出 10月18日 · 100 看涨"],
	buyNov: ["buy Nov 15 · 100 call", "买入 11月15日 · 100 看涨"],
	toClose: ["to close", "平仓"],
	toOpen: ["to open", "开仓"],
	bearish: ["feed: BID · bearish", "数据源：BID · 看跌"],
	bullish: ["feed: ASK · bullish", "数据源：ASK · 看涨"],
	rollNet: ["net", "净额"],
	rollShort: ["same strike · four weeks later", "同一行权价 · 延后四周"],
	claimBig: ["One leg, many positions.", "一条腿，多种持仓。"],
	claimSub: ["A sale can cover, cap or roll.", "卖出可备兑、封顶或移仓。"],
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
		["ro-0", copy.readoutLong, signedDollars(longLeg(SPOT)), "var(--tone-ink)"],
		[
			"ro-1",
			copy.readoutShort,
			signedDollars(shortLeg110(SPOT)),
			"var(--tone-ink)",
		],
		[
			"ro-2",
			copy.readoutTotal,
			dollars(spreadPayoff(SPOT)),
			toneColor("focus"),
		],
	];
	const rows: [Copy, Copy, Copy][] = [
		[copy.sellOct, copy.toClose, copy.bearish],
		[copy.buyNov, copy.toOpen, copy.bullish],
	];
	const axisCaptions: [string, Copy][] = [
		["axis-profit", copy.axisProfit],
		["axis-payoff", copy.axisPayoff],
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
						<g data-f="axis-both">
							<text x={L.left} y={L.top - 12} className="wt-small">
								{t(copy.axisBoth)}
							</text>
							{[copy.together, copy.profitLabel].map((label, i) => {
								const x = L.left + (i === 0 ? 60 : 132);
								return (
									<g key={i === 0 ? "payoff" : "profit"}>
										<path
											d={`M${x} ${L.top - 16}h14`}
											className="wt-line-position"
											strokeDasharray={i === 0 ? "4 3" : undefined}
										/>
										<text x={x + 20} y={L.top - 12} className="wt-small">
											{t(label)}
										</text>
									</g>
								);
							})}
						</g>
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
							className="wt-line-position"
							style={{ strokeWidth: 2.5 }}
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
						<path
							data-f="l-long"
							d={path(longLeg)}
							className="wt-line-position"
							style={{ stroke: "var(--tone-ink)", strokeWidth: 2.5 }}
						/>
						<path
							data-f="l-short"
							d={path(shortLeg110)}
							className="wt-line-position"
							style={{ stroke: "var(--tone-ink)", strokeWidth: 2.5 }}
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
							`wt-film-dim ${toneClass.focus}`,
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
							"g-long",
							narrow ? SPOT - 2 : RANGE[1],
							longLeg,
							copy.long105,
							"wt-halo",
							-T.small * 1.2,
							"end",
						)}
						{tag(
							"g-short",
							narrow ? SPOT - 2 : RANGE[1],
							shortLeg110,
							copy.short110,
							"wt-halo",
							T.small * 1.8,
							"end",
						)}
						<Word
							name="g-spread"
							x={L.left}
							y={L.top + text * 1.5}
							size={T.small * 1.1}
							anchor="start"
							className={`wt-film-type wt-film-dim ${toneClass.focus}`}
						>
							{t(copy.spread)}
						</Word>
						<Word
							name="g-spread-low"
							x={L.left + 8}
							y={L.y(SPREAD_LOW) + T.body * 1.8}
							size={T.body}
							anchor="start"
							className="wt-film-num wt-film-loss"
						>
							{signedDollars(SPREAD_LOW)}
						</Word>
						<Word
							name="g-spread-high"
							x={L.right - 8}
							y={L.y(SPREAD_HIGH) - T.body}
							size={T.body}
							anchor="end"
							className={`wt-film-num ${toneClass.up}`}
						>
							{signedDollars(SPREAD_HIGH)}
						</Word>
						<Word
							name="g-spread-short"
							x={L.x(CALL_105.strike + 2)}
							y={L.y(SPREAD_HIGH) + T.small * 1.5}
							size={T.small * 1.1}
							anchor="start"
							className="wt-film-type wt-film-dim"
						>
							{t(copy.spreadShort)}
						</Word>
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
									style={{ fill: "var(--tone-ink)" }}
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
					{i === 2 && (
						<path
							d={`M${L.left + 12} ${L.top + 14 + i * text * 1.7}h${narrow ? 14 : 20}`}
							style={{
								stroke: color,
								strokeWidth: 2.5,
								strokeDasharray: i === 2 ? "4 3" : undefined,
							}}
						/>
					)}
					<text
						x={L.left + (narrow ? 32 : 40)}
						y={L.top + 14 + i * text * 1.7 + text * 0.36}
						className="wt-film-type"
						style={{ fontSize: text }}
					>
						{`${t(label)} · `}
						<tspan
							className={`wt-film-num ${i === 1 ? toneClass.down : i === 0 ? toneClass.up : toneClass.focus}`}
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
				className={`wt-film-num ${toneClass.up} wt-halo`}
			>
				{signedDollars(profit(SPOT))}
			</Word>
			<Brackets name="lock-profit" tone="gain" glow />

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
			{rows.map(([line, sub, label], i) => (
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
						className="wt-film-type"
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
			<g data-f="roll">
				<Word
					name="roll-net"
					x={margin}
					y={L.sumY}
					size={narrow ? T.body : T.body * 1.2}
					anchor="start"
					className="wt-film-type"
				>
					{`${t(copy.rollNet)} · `}
					<tspan className="wt-film-num wt-film-loss">
						{signedUsd(-ROLL_NET, 0)}
					</tspan>
				</Word>
				<Lines
					name="roll-expiry"
					text={t(copy.rollShort)}
					x={margin}
					y={L.sumY + T.body * 1.6}
					size={T.body}
					maxWidth={room}
					anchor="start"
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{/* Keep the accepted drawn after-beat; the dates are already readable above. */}
			<path
				data-f="roll-extension"
				d={`M${margin} ${L.sumY + T.body * (narrow ? 3.1 : 2.5)}H${margin + room * 0.65}l-7 -5m7 5l-7 5`}
				className="wt-bracket"
			/>

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
	// The kit's glow uses this local alias too, so it matches the signed gain's brackets.
	lockProfit.style.setProperty("--diagram-accent", toneColor("up"));
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
	d.rise(8.85);
	show(axes, 9.1);
	show(one("axis-profit"), 9.1);
	draw(line("alone"), 10.65);
	show(one("g-alone"), 11.25);
	d.swap(heads[0], heads[1], 13.35);
	hide([line("alone"), one("g-alone")], 13.35, 0.3);
	draw(line("stock"), 13.75);
	show(one("g-stock"), 14.25);
	draw(line("covered"), 14.35);
	show(one("g-covered"), 14.95);
	d.swap(heads[1], heads[2], 17.35);
	hide(
		[line("stock"), line("covered"), one("g-stock"), one("g-covered")],
		17.35,
		0.3,
	);
	draw(line("spread"), 17.75);
	const spreadLabelAt = L.narrow && context.locale === "en" ? 17.85 : 18.35;
	show(one("g-spread"), spreadLabelAt);
	// Fade the endpoint values in place, without taking time from the settled proof.
	tl.fromTo(
		[one("g-spread-low"), one("g-spread-high")],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		spreadLabelAt,
	);
	tl.fromTo(
		one("g-spread-short"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.35, ease: "power3.out" },
		18.35,
	);

	// ——— add: the hero. Signed legs at $115, then the cost. ———
	tl.addLabel("add", 21.35);
	d.swap(heads[2], heads[3], 21.35);
	d.swap(one("axis-profit"), one("axis-payoff"), 21.35);
	hide(
		[
			line("spread"),
			one("g-spread"),
			one("g-spread-low"),
			one("g-spread-high"),
			one("g-spread-short"),
		],
		21.35,
		0.3,
	);
	show(one("spot"), 21.45);
	show([one("k-105"), one("k-110")], 21.45);
	draw(line("long"), 23.2);
	show(readouts[0], 23.7, "right");
	tl.fromTo(one("g-long"), { opacity: 0 }, { opacity: 1, duration: 0.5 }, 23.7);
	// Each completed readout gets a full second before the next construction.
	tl.to([line("long"), one("g-long")], { opacity: 0.3, duration: 0.4 }, 25.2);
	draw(line("short"), 25.2);
	show(readouts[1], 25.7, "right");
	tl.fromTo(
		one("g-short"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		25.7,
	);
	tl.to(
		[line("long"), one("g-long"), line("short"), one("g-short")],
		{ opacity: 0.3, duration: 0.4 },
		27.2,
	);
	draw(line("sum"), 27.3);
	// Reveal the exact total only once its trace has settled, then keep it readable into the handoff.
	show(readouts[2], 28.0, "right");
	tl.to(line("sum"), { opacity: 0.35, duration: 0.4 }, 29.3);
	hide(
		[
			line("long"),
			one("g-long"),
			line("short"),
			one("g-short"),
			one("spot-guide"),
		],
		29.3,
		0.35,
		0,
	);
	hide(readouts.slice(0, 2), 29.4, 0.35, 0);
	hide(readouts[2], 29.7, 0.35, 0);
	d.swap(one("axis-payoff"), one("axis-both"), 29.4);
	show(heads[4], 29.4);
	draw(line("profit"), 29.4);
	show(one("cost"), 29.9);
	show(readouts[3], 29.9);
	d.lock(lockProfit, 30.4, { around: readouts[3], pad: 8 });
	tl.addLabel("hero-lock", 30.4);
	// After the hero's 1.5-second quiet stand, draw its profitable expiry region.
	tl.fromTo(
		one("profit-area"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		32.4,
	);
	tl.fromTo(
		one("profit-reveal"),
		{ attr: { width: 0 } },
		{
			attr: { width: L.right - L.x(CALL_105.strike + NET / 100) },
			duration: 0.6,
			ease: "power2.out",
		},
		32.4,
	);

	// ——— roll: two prints, one decision ———
	tl.addLabel("roll", 34.0);
	hide([heads[3], heads[4], readouts[3], one("cost"), lockProfit], 34.0);
	d.sink(34.0);
	show(heads[5], 34.35);
	show(one("roll-tag"), 34.4);
	show(rows, 34.6, "right");
	tl.fromTo(
		one("bracket"),
		{ opacity: 0, scaleY: 0, transformOrigin: "50% 50%" },
		{ opacity: 1, scaleY: 1, duration: 0.5 },
		36.4,
	);
	// Reveal the net as the bracket joins the settled rows, then hold before the after-beat.
	show(one("roll"), 36.4);
	show(heads[6], 36.4);
	d.trace(one<SVGPathElement>("roll-extension"), 38.6, { duration: 0.7 });

	// ——— claim ———
	tl.addLabel("claim", 40.3);
	hide(
		[
			heads[5],
			heads[6],
			one("roll-tag"),
			...rows,
			one("bracket"),
			one("roll"),
			one("roll-extension"),
		],
		40.3,
	);
	word(one("z-big"), 40.6);
	show(one("z-sub"), 41.0);

	// ——— next ———
	tl.addLabel("next", 45.0);
	hide(kids("claim"), 45.0);
	d.close(45.0);
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
