import { type Copy, count, pick, signedUsd, usd } from "@/content/world";
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
 * against 100 shares it is a covered call that gains up to +$705; beside a long 100 call it
 * caps a bull spread. Then a 105/110 spread built from signed legs at $115: +$1,000, −$500,
 * $500 together, +$375 after its cost. Last, a roll: a sale at the bid and a purchase at
 * the ask, labelled bearish and bullish, that are one decision.
 *
 *   open      0–4      "Strategies"
 *   question  4–9.5    the 105 call sold at $2.05: a bet ALFA won't rise?
 *   leg       9.5–20   alone; covered by shares; capping a spread
 *   add       20–30.5  long 105; short 110; together; less the cost
 *   roll      30.5–39.5 sell October at the bid; buy November at the ask; one roll; cut
 *   next      39.5–42  Next: straddles and condors
 */

const END = 42;
const Y = [-2200, 2200] as const;
const SPOT = 115;
const COVERED_TOP = structures.covered(RANGE[1]);
const SPREAD_LOW = structures.spread(RANGE[0]);
const SPREAD_HIGH = structures.spread(RANGE[1]);
const profit = (spot: number) => spreadPayoff(spot) - NET;
const BREAK_EVEN = CALL_105.strike + NET / 100;
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
	return {
		...frame,
		left,
		right,
		top,
		bottom,
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
	l0: [
		`Sold alone at ${usd(SOLD)}, it keeps $${SOLD} below $105, and its loss above has no limit.`,
		`单独以 ${usd(SOLD)} 卖出：低于 $105 留下 $${SOLD}，高于此价亏损没有上限。`,
	],
	l0Short: ["Alone: no limit.", "单独卖出：亏损无上限。"],
	l1: [
		`Against 100 shares bought at $${STOCK_COST}: a covered call, up to ${signedDollars(COVERED_TOP)}.`,
		`对着以 $${STOCK_COST} 买入的 100 股：备兑看涨，最多 ${signedDollars(COVERED_TOP)}。`,
	],
	l1Short: [
		`With shares: up to ${signedDollars(COVERED_TOP)}.`,
		`有股票：最多 ${signedDollars(COVERED_TOP)}。`,
	],
	l2: [
		`Beside a long 100 call, it caps a bull spread: ${signedDollars(SPREAD_LOW)} at worst, ${signedDollars(SPREAD_HIGH)} at best.`,
		`配上 100 看涨多头，它是看涨价差的上限：最坏 ${signedDollars(SPREAD_LOW)}，最好 ${signedDollars(SPREAD_HIGH)}。`,
	],
	l2Short: ["With a 100 call: a spread.", "配 100 看涨：价差。"],
	sold: ["105 call, sold", "105 看涨，卖出"],
	stock: ["stock alone", "仅股票"],
	covered: ["covered call", "备兑看涨"],
	spread: ["bull call spread", "牛市看涨价差"],
	axis: ["profit at Oct 18, per contract", "10月18日盈亏，每张合约"],
	a0: [
		`Add signed legs. The long 105 call is worth ${dollars(longLeg(SPOT))} at $${SPOT}.`,
		`把带符号的腿相加。$${SPOT} 时，105 看涨多头值 ${dollars(longLeg(SPOT))}。`,
	],
	a0Short: [
		`Long 105: ${signedDollars(longLeg(SPOT))}.`,
		`105 多头：${signedDollars(longLeg(SPOT))}。`,
	],
	a1: [
		`The short 110 call works against you above $110: ${signedDollars(shortLeg110(SPOT))} at $${SPOT}.`,
		`110 看涨空头在 $110 以上对你不利：$${SPOT} 时 ${signedDollars(shortLeg110(SPOT))}。`,
	],
	a1Short: [
		`Short 110: ${signedDollars(shortLeg110(SPOT))}.`,
		`110 空头：${signedDollars(shortLeg110(SPOT))}。`,
	],
	a2: [
		`Added at every price, it stops at ${dollars(spreadPayoff(RANGE[1]))} above $110: the short call caps it.`,
		`在每个价格上相加，$110 以上停在 ${dollars(spreadPayoff(RANGE[1]))}：空头看涨给它封了顶。`,
	],
	a2Short: [
		`Together: capped at ${dollars(spreadPayoff(RANGE[1]))}.`,
		`合计：封顶 ${dollars(spreadPayoff(RANGE[1]))}。`,
	],
	a3: [
		`Less the $${(NET / 100).toFixed(2)} a share paid: ${signedDollars(profit(SPOT))} at $${SPOT}, break-even $${BREAK_EVEN.toFixed(2)}.`,
		`减去每股已付的 $${(NET / 100).toFixed(2)}：$${SPOT} 时 ${signedDollars(profit(SPOT))}，盈亏平衡 $${BREAK_EVEN.toFixed(2)}。`,
	],
	a3Short: [
		`Less $${NET}: ${signedDollars(profit(SPOT))}.`,
		`减去 $${NET}：${signedDollars(profit(SPOT))}。`,
	],
	long105: ["long 105", "105 多头"],
	short110: ["short 110", "110 空头"],
	together: ["together", "合计"],
	lessCost: [`less $${NET}`, `减 $${NET}`],
	spot: [`ALFA $${SPOT}`, `ALFA $${SPOT}`],
	r0: [
		`Fri Oct 4: you sell ${ROLL_QUANTITY} Oct 18 100 calls at the ${usd(SELL_OCT)} bid. A feed says bearish.`,
		`10月4日周五：你以 ${usd(SELL_OCT)} 的买价卖出 ${ROLL_QUANTITY} 张 10月18日 100 看涨。数据说：看跌。`,
	],
	r0Short: ["Leg 1: sold at the bid.", "第一腿：买价卖出。"],
	r1: [
		`A second later you buy ${ROLL_QUANTITY} Nov 15 100 calls at the ${usd(BUY_NOV)} ask. A feed says bullish.`,
		`一秒后你以 ${usd(BUY_NOV)} 的卖价买入 ${ROLL_QUANTITY} 张 11月15日 100 看涨。数据说：看涨。`,
	],
	r1Short: ["Leg 2: bought at the ask.", "第二腿：卖价买入。"],
	r2: [
		`One decision: the same strike, four weeks later, for a net ${usd(ROLL_NET, 0)}.`,
		`一个决定：同一行权价，晚四周到期，净支出 ${usd(ROLL_NET, 0)}。`,
	],
	r2Short: ["One roll.", "一次移仓。"],
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
	toClose: [
		`to close · ${signedUsd(CASH_IN, 0)}`,
		`平仓 · ${signedUsd(CASH_IN, 0)}`,
	],
	toOpen: [
		`to open · ${signedUsd(-CASH_OUT, 0)}`,
		`开仓 · ${signedUsd(-CASH_OUT, 0)}`,
	],
	bearish: ["BID · bearish", "BID · 看跌"],
	bullish: ["ASK · bullish", "ASK · 看涨"],
	roll: [
		`one roll: same $100 strike, four weeks later · net ${signedUsd(-ROLL_NET, 0)}`,
		`一次移仓：同一 $100 行权价，晚四周 · 净额 ${signedUsd(-ROLL_NET, 0)}`,
	],
	rollShort: [
		`one roll · net ${signedUsd(-ROLL_NET, 0)}`,
		`一次移仓 · 净额 ${signedUsd(-ROLL_NET, 0)}`,
	],
	claimBig: ["One leg, many positions.", "一条腿，多种持仓。"],
	claimSub: [
		"Read a print with the legs beside it: a sale can cover shares, cap a spread or close half a roll.",
		"读一笔成交时要看旁边的腿：一笔卖出可能是备兑、价差的上限，或移仓的一半。",
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
		[
			"ro-3",
			copy.lessCost,
			signedDollars(profit(SPOT)),
			"var(--diagram-accent)",
		],
	];
	const rows: [Copy, Copy, Copy, string][] = [
		[copy.sellOct, copy.toClose, copy.bearish, "wt-film-loss"],
		[copy.buyNov, copy.toOpen, copy.bullish, "wt-film-gain"],
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
			{headline("l0", copy.l0, copy.l0Short)}
			{headline("l1", copy.l1, copy.l1Short)}
			{headline("l2", copy.l2, copy.l2Short)}
			{headline("a0", copy.a0, copy.a0Short)}
			{headline("a1", copy.a1, copy.a1Short)}
			{headline("a2", copy.a2, copy.a2Short)}
			{headline("a3", copy.a3, copy.a3Short)}
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
						<g data-f="spot">
							<path
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
							<circle
								key={c.strike}
								data-f={`k-${c.strike}`}
								cx={L.x(c.strike)}
								cy={L.y(0)}
								r={3.5}
								className="wt-film-ghost"
							/>
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
						<tspan className="wt-film-num wt-film-accent">{value}</tspan>
					</text>
				</g>
			))}

			{/* A roll: two prints, one decision. */}
			{headline("r0", copy.r0, copy.r0Short)}
			{headline("r1", copy.r1, copy.r1Short)}
			{headline("r2", copy.r2, copy.r2Short)}
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
						{t(sub)}
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
				size={narrow ? T.body : T.head}
				maxWidth={room}
				anchor="start"
				className="wt-film-type wt-film-accent"
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
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
			time,
		);
	/** A line draws itself from its start, then takes back its own dashes, if any. */
	const draw = (path: SVGPathElement, time: number) => {
		const dash = path.getAttribute("stroke-dasharray");
		const length = path.getTotalLength();
		tl.fromTo(
			path,
			{ opacity: 0, strokeDasharray: length, strokeDashoffset: length },
			{ opacity: 1, strokeDashoffset: 0, duration: 0.7, ease: "power2.out" },
			time,
		);
		if (dash) tl.set(path, { strokeDasharray: dash }, time + 0.7);
	};
	const line = (name: string) => one<SVGPathElement>(`l-${name}`);
	const heads = [
		"l0",
		"l1",
		"l2",
		"a0",
		"a1",
		"a2",
		"a3",
		"r0",
		"r1",
		"r2",
	].map((name) => one(name));
	const readouts = [0, 1, 2, 3].map((i) => one(`ro-${i}`));
	const rows = [one("row-0"), one("row-1")];
	const axes = kids("chart").filter(
		(el) => !el.getAttribute("data-f")?.match(/^(l|g|k)-|^spot$/),
	);

	d.hidden([
		...flat("q"),
		...heads,
		...kids("chart"),
		...readouts,
		one("roll-tag"),
		...rows,
		one("bracket"),
		one("roll"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: one sale ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	show(one("q-line"), 5.1);
	word(one("q-big"), 6.4);

	// ——— leg: the same sale in three positions ———
	tl.addLabel("leg", 9.5);
	hide(flat("q"), 9.5);
	show(heads[0], 9.7, "above");
	d.rise(9.8);
	show(axes, 10.0);
	draw(line("alone"), 10.6);
	show(one("g-alone"), 11.2);
	d.swap(heads[0], heads[1], 13.0);
	hide([line("alone"), one("g-alone")], 13.0, 0.3);
	draw(line("stock"), 13.4);
	show(one("g-stock"), 13.9);
	draw(line("covered"), 13.9);
	show(one("g-covered"), 14.5);
	d.swap(heads[1], heads[2], 16.2);
	hide(
		[line("stock"), line("covered"), one("g-stock"), one("g-covered")],
		16.2,
		0.3,
	);
	draw(line("spread"), 16.6);
	show(one("g-spread"), 17.2);

	// ——— add: signed legs at $115 ———
	tl.addLabel("add", 20);
	d.swap(heads[2], heads[3], 20.0);
	hide([line("spread"), one("g-spread")], 20.0, 0.3);
	show(one("spot"), 20.3);
	show([one("k-105"), one("k-110")], 20.3);
	draw(line("long"), 20.5);
	show(readouts[0], 21.0, "right");
	d.swap(heads[3], heads[4], 22.6);
	draw(line("short"), 22.9);
	show(readouts[1], 23.4, "right");
	d.swap(heads[4], heads[5], 25.0);
	tl.to([line("long"), line("short")], { opacity: 0.3, duration: 0.4 }, 25.2);
	draw(line("sum"), 25.3);
	show(readouts[2], 25.8, "right");
	d.swap(heads[5], heads[6], 27.4);
	tl.to(line("sum"), { opacity: 0.35, duration: 0.4 }, 27.6);
	draw(line("profit"), 27.7);
	show(readouts[3], 28.2, "right");

	// ——— roll: two prints, one decision ———
	tl.addLabel("roll", 30.5);
	hide([heads[6], ...readouts], 30.5);
	d.sink(30.5);
	show(heads[7], 30.8, "above");
	show(one("roll-tag"), 31.0);
	show(rows[0], 31.2, "right");
	d.swap(heads[7], heads[8], 32.6);
	show(rows[1], 33.0, "right");
	d.swap(heads[8], heads[9], 34.6);
	tl.fromTo(
		one("bracket"),
		{ opacity: 0, scaleY: 0, transformOrigin: "50% 50%" },
		{ opacity: 1, scaleY: 1, duration: 0.5 },
		35.0,
	);
	show(one("roll"), 35.3);
	// Cut: the claim.
	hide([heads[9], one("roll-tag"), ...rows, one("bracket"), one("roll")], 37.0);
	word(one("z-big"), 37.3);
	show(one("z-sub"), 37.7);

	// ——— next ———
	tl.addLabel("next", 39.5);
	hide(kids("claim"), 39.5);
	d.close(39.5);
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
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
