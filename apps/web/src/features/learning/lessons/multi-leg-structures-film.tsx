import { type Copy, pick, signedUsd, usd } from "@/content/world";
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
	BEARISH,
	BULLISH,
	CALL_100,
	CALL_CREDIT,
	CREDIT,
	callSpread,
	condor,
	LEGS,
	legPremium,
	legPrice,
	MAX_LOSS,
	PACKAGE_CREDIT,
	PACKAGE_RISK,
	PUT_100,
	PUT_CREDIT,
	putSpread,
	RANGE,
	SIZE,
	STRADDLE_COST,
	STRADDLE_HIGH,
	STRADDLE_LOW,
	straddle,
	worth,
} from "./multi-leg-structures-model";

/*
 * Straddles, condors and multi-leg prints, as a film. Four ALFA prints in one second, 200
 * each: sold 95 puts, bought 90 puts, sold 105 calls, bought 110 calls. Bullish or
 * bearish? First a straddle, a V that needs a move of $8.40 either way; then an iron
 * condor, two credit spreads that keep $2.17 inside $95–$105 and risk $2.83 outside. Then
 * the four prints: labelled one by one they net −$1,400, "slightly bearish"; read as one
 * package they are 200 short iron condors, a range.
 *
 *   open      0–4      "Straddles and condors"
 *   question  4–9.5    four prints in one second: bullish or bearish?
 *   straddle  9.5–19.5 call and put; a V at $100; break-even $91.60 and $108.40
 *   condor    19.5–29.5 put spread and call spread; together; break-evens
 *   package   29.5–39.5 four labels; a −$1,400 tally; one package; cut: the claim
 *   next      39.5–42  Next: checking one trade
 */

const END = 42;
const CENTS = (perShare: number) => Math.round(perShare * 100);
/** Dollars a share as whole dollars a contract: "+$375", "−$283". */
const perContract = (perShare: number) => signedUsd(CENTS(perShare) * 100, 0);
const share = (dollars: number) => usd(CENTS(dollars));
const NET_LABELS = BULLISH - BEARISH;
const CONDOR_LOW = 95 - CREDIT;
const CONDOR_HIGH = 105 + CREDIT;
/** Each chart's own vertical range, in dollars a contract, and its ticks. */
const S_Y = [-1500, 2100] as const;
const C_Y = [-450, 400] as const;
const S_TICKS = [-1000, 0, 1000, 2000];
const C_TICKS = [-400, -200, 0, 200];

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
		y: (range: readonly [number, number], dollars: number) =>
			bottom - ((dollars - range[0]) / (range[1] - range[0])) * (bottom - top),
		rowY: (i: number) =>
			H * (narrow ? 0.26 : 0.27) + i * H * (narrow ? 0.085 : 0.09),
		rowH: H * (narrow ? 0.07 : 0.075),
		tallyY: H * (narrow ? 0.67 : 0.68),
		cardY: H * (narrow ? 0.63 : 0.64),
		cardH: H * (narrow ? 0.22 : 0.2),
	};
}

const legCopy: Record<string, Copy> = {
	a: ["sold 200 · 95 put", "卖出 200 · 95 看跌"],
	b: ["bought 200 · 90 put", "买入 200 · 90 看跌"],
	c: ["sold 200 · 105 call", "卖出 200 · 105 看涨"],
	d: ["bought 200 · 110 call", "买入 200 · 110 看涨"],
};

const copy = {
	title: ["Straddles and condors", "跨式与铁鹰"],
	titleSub: [
		"four prints in one second, one package",
		"同一秒的四笔成交，一个整体",
	],
	qTag: [
		`ALFA Oct 18 · one second · ${SIZE} each`,
		`ALFA 10月18日 · 同一秒 · 每笔 ${SIZE} 张`,
	],
	qLegs: [
		"sold 95 puts · bought 90 puts · sold 105 calls · bought 110 calls",
		"卖出 95 看跌 · 买入 90 看跌 · 卖出 105 看涨 · 买入 110 看涨",
	],
	qBig: ["Bullish or bearish?", "看涨还是看跌？"],
	s0: [
		`Buy the 100 call and the 100 put for ${share(STRADDLE_COST)}: the call pays above $100, the put below.`,
		`以 ${share(STRADDLE_COST)} 买入 100 看涨和 100 看跌：看涨在 $100 以上赚钱，看跌在以下。`,
	],
	s0Short: ["Call above, put below.", "看涨在上，看跌在下。"],
	s1: [
		"Together they pay either way: a straddle, a V with its point at $100.",
		"合起来哪个方向都赚：跨式，一个尖点在 $100 的 V。",
	],
	s1Short: ["A V at $100.", "$100 处的 V。"],
	s2: [
		`Less the ${share(STRADDLE_COST)} paid: break-even at ${share(STRADDLE_LOW)} and ${share(STRADDLE_HIGH)}. It needs a big move.`,
		`减去已付的 ${share(STRADDLE_COST)}：盈亏平衡在 ${share(STRADDLE_LOW)} 和 ${share(STRADDLE_HIGH)}。它需要大幅变动。`,
	],
	s2Short: [
		`Break-even ${share(STRADDLE_LOW)} / ${share(STRADDLE_HIGH)}.`,
		`平衡点 ${share(STRADDLE_LOW)} / ${share(STRADDLE_HIGH)}。`,
	],
	c0: [
		`An iron condor: a put spread sold for ${share(PUT_CREDIT)}, a call spread for ${share(CALL_CREDIT)}.`,
		`铁鹰：${share(PUT_CREDIT)} 卖出看跌价差，${share(CALL_CREDIT)} 卖出看涨价差。`,
	],
	c0Short: ["Two credit spreads.", "两个收入价差。"],
	c1: [
		`Together: ${perContract(CREDIT)} kept from $95 to $105, and only one side can lose: ${perContract(-MAX_LOSS)} at worst.`,
		`合起来：$95 到 $105 之间保留 ${perContract(CREDIT)}，只有一侧可能亏损：最多 ${perContract(-MAX_LOSS)}。`,
	],
	c1Short: [
		`Keep ${perContract(CREDIT)}; risk ${perContract(-MAX_LOSS)}.`,
		`保留 ${perContract(CREDIT)}；风险 ${perContract(-MAX_LOSS)}。`,
	],
	c2: [
		`Break-even at ${share(CONDOR_LOW)} and ${share(CONDOR_HIGH)}: it wins if ALFA stays inside.`,
		`盈亏平衡在 ${share(CONDOR_LOW)} 和 ${share(CONDOR_HIGH)}：ALFA 留在区间内就赢。`,
	],
	c2Short: ["It sells a range.", "它卖出一个区间。"],
	callLeg: ["100 call", "100 看涨"],
	putLeg: ["100 put", "100 看跌"],
	both: ["both", "合计"],
	putSpread: ["put spread", "看跌价差"],
	callSpread: ["call spread", "看涨价差"],
	axis: ["profit at Oct 18, per contract", "10月18日盈亏，每张合约"],
	p0: [
		"Labelled one by one, the four prints read bullish, bearish, bearish, bullish.",
		"逐笔贴标签，四笔成交读作：看涨、看跌、看跌、看涨。",
	],
	p0Short: ["Four labels.", "四个标签。"],
	p1: [
		`Summed by label: ${signedUsd(NET_LABELS, 0)}, "slightly bearish". A view nobody chose.`,
		`按标签加总：${signedUsd(NET_LABELS, 0)}，“略偏看跌”。一个没人选择过的方向。`,
	],
	p1Short: [
		`Net ${signedUsd(NET_LABELS, 0)}?`,
		`净额 ${signedUsd(NET_LABELS, 0)}？`,
	],
	p2: [
		`Read as one package: ${SIZE} short iron condors, a bet ALFA stays between $95 and $105.`,
		`作为整体来读：${SIZE} 组铁鹰空头，押注 ALFA 留在 $95 到 $105 之间。`,
	],
	p2Short: ["One package: a range.", "一个整体：区间。"],
	bullish: ["bullish", "看涨"],
	bearish: ["bearish", "看跌"],
	tally: [
		`bullish ${usd(BULLISH, 0)} · bearish ${usd(BEARISH, 0)} · net ${signedUsd(NET_LABELS, 0)}`,
		`看涨 ${usd(BULLISH, 0)} · 看跌 ${usd(BEARISH, 0)} · 净额 ${signedUsd(NET_LABELS, 0)}`,
	],
	tallyShort: [
		`net ${signedUsd(NET_LABELS, 0)}: "slightly bearish"`,
		`净额 ${signedUsd(NET_LABELS, 0)}：“略偏看跌”`,
	],
	pkgTag: [`one package · ${SIZE} iron condors`, `一个整体 · ${SIZE} 组铁鹰`],
	pkgCredit: [
		`${signedUsd(PACKAGE_CREDIT, 0)} collected`,
		`收入 ${signedUsd(PACKAGE_CREDIT, 0)}`,
	],
	pkgRange: [
		`kept if ALFA stays $95–$105 · ${usd(PACKAGE_RISK, 0)} at risk`,
		`ALFA 留在 $95–$105 即保留 · 风险 ${usd(PACKAGE_RISK, 0)}`,
	],
	claimBig: ["Four prints, one trade.", "四笔成交，一笔交易。"],
	claimSub: [
		"Legs that print together are read together: the package is the view, not the sum of its labels.",
		"一起成交的腿要一起读：整体才是观点，而不是各个标签的加总。",
	],
	nextBig: ["Next: checking one trade", "下一课：核查一笔成交"],
	nextSub: ["facts, inferences and unknowns", "事实、推断与未知"],
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
	const KNOTS = [RANGE[0], 90, 95, 100, 105, 110, RANGE[1]];
	const path = (range: readonly [number, number], f: (s: number) => number) =>
		KNOTS.map(
			(s, i) =>
				`${i ? "L" : "M"}${L.x(s).toFixed(1)} ${L.y(range, f(s) * 100).toFixed(1)}`,
		).join("");
	const axes = (
		name: string,
		range: readonly [number, number],
		ticks: number[],
	) => (
		<g data-f={name}>
			<text x={L.left} y={L.top - 12} className="wt-small">
				{t(copy.axis)}
			</text>
			{ticks.map((v) => (
				<g key={v}>
					<path
						d={`M${L.left} ${L.y(range, v)}H${L.right}`}
						className={v === 0 ? "wt-axis" : "wt-grid"}
					/>
					<text
						x={L.left - 8}
						y={L.y(range, v) + 4}
						textAnchor="end"
						className="wt-small"
					>
						{v === 0
							? "$0"
							: Math.abs(v) >= 1000
								? `${v < 0 ? "−" : "+"}${Math.abs(v) / 1000}k`
								: signedUsd(v * 100, 0)}
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
		</g>
	);
	const label = (
		name: string,
		x: number,
		y: number,
		value: string,
		className: string,
		anchor: "start" | "middle" | "end" = "middle",
	) => (
		<text
			data-f={name}
			x={x}
			y={y}
			textAnchor={anchor}
			className={`wt-film-num wt-halo ${className}`}
			style={{ fontSize: T.small * 1.15 }}
		>
			{value}
		</text>
	);
	/** A break-even: a dashed riser across the chart with its price at the top. */
	const even = (name: string, spot: number) => (
		<g data-f={name}>
			<path
				d={`M${L.x(spot)} ${L.top}V${L.bottom}`}
				className="wt-bracket"
				strokeDasharray="4 3"
			/>
			<text
				x={L.x(spot)}
				y={L.top + 14}
				textAnchor="middle"
				className="wt-film-num wt-halo wt-film-accent"
				style={{ fontSize: T.small * 1.1 }}
			>
				{share(spot)}
			</text>
		</g>
	);
	const callPay = (s: number) => worth(CALL_100, s);
	const putPay = (s: number) => worth(PUT_100, s);
	const profit = (s: number) => straddle(s) - STRADDLE_COST;
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
				<Lines
					name="q-legs"
					text={t(copy.qLegs)}
					x={W / 2}
					y={H * 0.42}
					size={narrow ? T.body : T.head}
					maxWidth={narrow ? room * 0.8 : room}
					className="wt-film-type wt-film-accent"
				/>
				<Lines
					name="q-big"
					text={t(copy.qBig)}
					x={W / 2}
					y={H * 0.66}
					size={T.title}
					maxWidth={room}
				/>
			</g>

			{headline("s0", copy.s0, copy.s0Short)}
			{headline("s1", copy.s1, copy.s1Short)}
			{headline("s2", copy.s2, copy.s2Short)}
			{headline("c0", copy.c0, copy.c0Short)}
			{headline("c1", copy.c1, copy.c1Short)}
			{headline("c2", copy.c2, copy.c2Short)}
			<g data-f="depth">
				<g data-f="world">
					{/* The straddle, on its own scale. */}
					{axes("axes-s", S_Y, S_TICKS)}
					<path
						data-f="s-call"
						d={path(S_Y, callPay)}
						className="wt-line-long"
					/>
					<path
						data-f="s-put"
						d={path(S_Y, putPay)}
						className="wt-line-short"
					/>
					<path
						data-f="s-sum"
						d={path(S_Y, straddle)}
						className="wt-line-position"
						strokeDasharray="6 5"
					/>
					<path
						data-f="s-profit"
						d={path(S_Y, profit)}
						className="wt-line-position"
					/>
					{label(
						"s-call-tag",
						L.x(116) - 6,
						L.y(S_Y, callPay(116) * 100) - 10,
						t(copy.callLeg),
						"wt-film-type",
						"end",
					)}
					{label(
						"s-put-tag",
						L.x(84) + 6,
						L.y(S_Y, putPay(84) * 100) - 10,
						t(copy.putLeg),
						"wt-film-type",
						"start",
					)}
					{label(
						"s-cost",
						L.x(100),
						L.y(S_Y, profit(100) * 100) + 22,
						perContract(-STRADDLE_COST),
						"wt-film-loss",
					)}
					{even("s-low", STRADDLE_LOW)}
					{even("s-high", STRADDLE_HIGH)}

					{/* The condor, on a closer scale. */}
					{axes("axes-c", C_Y, C_TICKS)}
					<path
						data-f="c-put"
						d={path(C_Y, putSpread)}
						className="wt-line-short"
					/>
					<path
						data-f="c-call"
						d={path(C_Y, callSpread)}
						className="wt-line-long"
					/>
					<path
						data-f="c-sum"
						d={path(C_Y, condor)}
						className="wt-line-position"
					/>
					{label(
						"c-put-tag",
						L.x(84) + 6,
						L.y(C_Y, putSpread(84) * 100) - 10,
						t(copy.putSpread),
						"wt-film-type",
						"start",
					)}
					{label(
						"c-call-tag",
						L.x(116) - 6,
						L.y(C_Y, callSpread(116) * 100) - 10,
						t(copy.callSpread),
						"wt-film-type",
						"end",
					)}
					{label(
						"c-keep",
						L.x(100),
						L.y(C_Y, condor(100) * 100) - 12,
						perContract(CREDIT),
						"wt-film-gain",
					)}
					{label(
						"c-risk",
						L.x(84) + 6,
						L.y(C_Y, condor(84) * 100) + 22,
						perContract(-MAX_LOSS),
						"wt-film-loss",
						"start",
					)}
					{even("c-low", CONDOR_LOW)}
					{even("c-high", CONDOR_HIGH)}
				</g>
			</g>

			{/* Four prints, one package. */}
			{headline("p0", copy.p0, copy.p0Short)}
			{headline("p1", copy.p1, copy.p1Short)}
			{headline("p2", copy.p2, copy.p2Short)}
			{LEGS.map((leg, i) => (
				<g key={leg.key} data-f={`leg-${i}`}>
					<rect
						x={margin}
						y={L.rowY(i)}
						width={room}
						height={L.rowH}
						rx={10}
						className="wt-panel-shape"
					/>
					<text
						x={margin + 14}
						y={L.rowY(i) + L.rowH / 2 + text * 0.36}
						className="wt-film-num"
						style={{ fontSize: text }}
					>
						{narrow
							? t(legCopy[leg.key])
							: `${t(legCopy[leg.key])} @ ${usd(legPrice(leg))}`}
					</text>
					<text
						x={margin + room - (narrow ? 14 : room * 0.2)}
						y={L.rowY(i) + L.rowH / 2 + text * 0.36}
						textAnchor="end"
						className={`wt-film-type ${leg.label === "bullish" ? "wt-film-gain" : "wt-film-loss"}`}
						style={{ fontSize: text }}
					>
						{narrow
							? `${t(copy[leg.label])} ${usd(legPremium(leg), 0)}`
							: t(copy[leg.label])}
					</text>
					{narrow ? null : (
						<text
							x={margin + room - 14}
							y={L.rowY(i) + L.rowH / 2 + text * 0.36}
							textAnchor="end"
							className="wt-film-num wt-film-dim"
							style={{ fontSize: text }}
						>
							{usd(legPremium(leg), 0)}
						</text>
					)}
				</g>
			))}
			<Lines
				name="tally"
				text={t(narrow ? copy.tallyShort : copy.tally)}
				x={margin}
				y={L.tallyY}
				size={narrow ? T.body : T.head}
				maxWidth={room}
				anchor="start"
				className="wt-film-type wt-film-warn"
			/>
			<g data-f="pkg">
				<rect
					x={margin}
					y={L.cardY}
					width={room}
					height={L.cardH}
					rx={14}
					className="wt-focus-shape"
				/>
				<text
					x={margin + 16}
					y={L.cardY + L.cardH * 0.26}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.pkgTag).toUpperCase()}
				</text>
				<text
					x={margin + 16}
					y={L.cardY + L.cardH * 0.58}
					className="wt-film-num wt-film-gain"
					style={{ fontSize: narrow ? T.head : T.num * 0.8 }}
				>
					{t(copy.pkgCredit)}
				</text>
				<text
					x={margin + 16}
					y={L.cardY + L.cardH * 0.84}
					className="wt-film-type wt-film-dim"
					style={{ fontSize: T.small * 1.1 }}
				>
					{t(copy.pkgRange)}
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
	const p = (name: string) => one<SVGPathElement>(name);
	const heads = ["s0", "s1", "s2", "c0", "c1", "c2", "p0", "p1", "p2"].map(
		(name) => one(name),
	);
	const legs = LEGS.map((_, i) => one(`leg-${i}`));

	d.hidden([
		...flat("q"),
		...heads,
		...kids("world"),
		...legs,
		one("tally"),
		one("pkg"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: four prints ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	show(one("q-legs"), 5.1);
	word(one("q-big"), 6.6);

	// ——— straddle: a V that needs a move ———
	tl.addLabel("straddle", 9.5);
	hide(flat("q"), 9.5);
	show(heads[0], 9.7, "above");
	d.rise(9.8);
	show(one("axes-s"), 10.0);
	draw(p("s-call"), 10.4);
	show(one("s-call-tag"), 10.9);
	draw(p("s-put"), 11.1);
	show(one("s-put-tag"), 11.6);
	d.swap(heads[0], heads[1], 13.0);
	tl.to([p("s-call"), p("s-put")], { opacity: 0.3, duration: 0.4 }, 13.2);
	hide([one("s-call-tag"), one("s-put-tag")], 13.2, 0.3);
	draw(p("s-sum"), 13.4);
	d.swap(heads[1], heads[2], 15.6);
	tl.to(p("s-sum"), { opacity: 0.35, duration: 0.4 }, 15.8);
	draw(p("s-profit"), 16.0);
	show(one("s-cost"), 16.6);
	show([one("s-low"), one("s-high")], 17.0);

	// ——— condor: a range sold ———
	tl.addLabel("condor", 19.5);
	d.swap(heads[2], heads[3], 19.5);
	hide(
		[
			one("axes-s"),
			p("s-call"),
			p("s-put"),
			p("s-sum"),
			p("s-profit"),
			one("s-cost"),
			one("s-low"),
			one("s-high"),
		],
		19.5,
		0.3,
	);
	show(one("axes-c"), 19.9);
	draw(p("c-put"), 20.3);
	show(one("c-put-tag"), 20.8);
	draw(p("c-call"), 21.2);
	show(one("c-call-tag"), 21.7);
	d.swap(heads[3], heads[4], 23.4);
	tl.to([p("c-put"), p("c-call")], { opacity: 0.3, duration: 0.4 }, 23.6);
	hide([one("c-put-tag"), one("c-call-tag")], 23.6, 0.3);
	draw(p("c-sum"), 23.8);
	show(one("c-keep"), 24.4);
	show(one("c-risk"), 24.7);
	d.swap(heads[4], heads[5], 26.2);
	show([one("c-low"), one("c-high")], 26.6);

	// ——— package: four labels, one trade ———
	tl.addLabel("package", 29.5);
	hide([heads[5]], 29.5);
	d.sink(29.5);
	show(heads[6], 29.8, "above");
	legs.forEach((leg, i) => {
		show(leg, 30.1 + i * 0.3, "right");
	});
	d.swap(heads[6], heads[7], 32.2);
	show(one("tally"), 32.6);
	d.swap(heads[7], heads[8], 34.6);
	hide(one("tally"), 34.6, 0.3);
	tl.to(legs, { opacity: 0.45, duration: 0.4 }, 34.8);
	d.pop(one("pkg"), 35.0);
	// Cut: the claim.
	hide([heads[8], ...legs, one("pkg")], 37.4);
	word(one("z-big"), 37.7);
	show(one("z-sub"), 38.1);

	// ——— next ———
	tl.addLabel("next", 39.5);
	hide(kids("claim"), 39.5);
	d.close(39.5);
	return tl;
}

export const multiLegStructuresFilm: Film = {
	id: "multi-leg-structures",
	label: [
		`Straddles, condors and multi-leg prints, as a short film: a long Oct 18 100 straddle bought for ${share(STRADDLE_COST)}, a V with break-evens at ${share(STRADDLE_LOW)} and ${share(STRADDLE_HIGH)}; an iron condor sold for ${share(CREDIT)} as a 95/90 put spread and a 105/110 call spread, keeping ${perContract(CREDIT)} between $95 and $105 and risking ${perContract(-MAX_LOSS)}; and four prints in one second, ${SIZE} contracts each, that net ${signedUsd(NET_LABELS, 0)} when labelled leg by leg but are ${SIZE} short iron condors read as one package, ${signedUsd(PACKAGE_CREDIT, 0)} collected`,
		`跨式、铁鹰与多腿成交短片：以 ${share(STRADDLE_COST)} 买入 10月18日 100 跨式，一个 V 字，盈亏平衡在 ${share(STRADDLE_LOW)} 和 ${share(STRADDLE_HIGH)}；以 ${share(CREDIT)} 卖出的铁鹰，由 95/90 看跌价差和 105/110 看涨价差组成，$95 到 $105 之间保留 ${perContract(CREDIT)}，风险 ${perContract(-MAX_LOSS)}；以及同一秒的四笔成交，每笔 ${SIZE} 张：逐腿贴标签净额 ${signedUsd(NET_LABELS, 0)}，作为整体来读则是 ${SIZE} 组铁鹰空头，收入 ${signedUsd(PACKAGE_CREDIT, 0)}`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Straddles and condors", "跨式与铁鹰"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "straddle", label: ["A straddle", "跨式"] },
		{ id: "condor", label: ["An iron condor", "铁鹰"] },
		{ id: "package", label: ["One package", "一个整体"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
