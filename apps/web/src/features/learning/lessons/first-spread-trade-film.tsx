import type { ReactNode } from "react";
import { type Copy, pick, signedUsd, usd } from "@/content/world";
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
	PenTip,
	TitleCard,
	toneClass,
	toneColor,
	Word,
} from "../walkthrough/film-kit";
import {
	ACCOUNT,
	BREAK_EVEN,
	callProfit,
	DEBIT,
	ENDS,
	LONG,
	MAX_GAIN,
	MAX_LOSS,
	PAID,
	PLAN_SPREADS,
	RANGE,
	RECEIVED,
	SHARES,
	SHORT,
	settle,
	spreadProfit,
	VIEW_LEVEL,
	worstCase,
} from "./first-spread-trade-model";

/*
 * A first spread trade, as a film. Monday, ALFA $100, and a view that can be wrong: above
 * $105 on Oct 18. The film asks what happens if it is wrong, then builds one answer. Two
 * legs in one order, the 100 call bought at $4.20 and the 105 call sold at $2.05, cost a
 * net $2.15 a share, $215 a spread. On the chart the spread's profit line has a floor and
 * a ceiling (+$285); the 100 call alone is drawn beside it, losing $420 at worst and with
 * no ceiling. The hero: the most one spread can lose is the debit, and glowing brackets
 * lock on −$215, known before the order is sent; then the break-even, $102.15, and two
 * spreads' −$430 against a $10,000 account. Last, three ways Oct 18 can end: below both
 * strikes, above both, and between them, where the bought call is exercised into 100
 * shares for $10,000, which is why many close a spread before expiry.
 *
 *   open      0–4        "A first spread trade"
 *   question  4–8.6      the view: above $105 on Oct 18; and if it is wrong?
 *   legs      8.6–16.4   buy the 100 call, sell the 105; net debit; one order; legging
 *   payoff    16.4–33.7  floor and ceiling; the call alone; hero: −$215; break-even; size
 *   ends      33.7–40.5  below, between, above; in between, 100 shares; close before expiry
 *   claim     40.5–45.0  know the worst case before you order
 *   next      45.0–47.5  Next: the module checkpoint
 */

const END = 47.5;
const Y = [-500, 700] as const;
/** Dollars per spread as a whole-dollar figure: "$215", "+$285". */
const dollars = (value: number) => usd(value * 100, 0);
const signedDollars = (value: number) => signedUsd(value * 100, 0);
/** Where the call alone, drawn from its strike, reaches a profit in dollars. */
const callSpotAt = (profit: number) => LONG.strike + (profit + PAID) / 100;
const BETWEEN = settle(ENDS.between);

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room, type: T } = frame;
	const left = margin + (narrow ? 36 : 56);
	const right = margin + room;
	const top = H * (narrow ? 0.3 : 0.28);
	const bottom = H * 0.84;
	const heroSize = T.num * 1.8;
	// The hero stands in the chart's empty top-left corner: its tag, the figure, then the size.
	const heroTagY = top + T.small * 1.5;
	const heroY = heroTagY + 16 + heroSize;
	return {
		...frame,
		left,
		right,
		top,
		bottom,
		heroSize,
		heroTagY,
		heroY,
		sizeY: heroY + heroSize * 0.25 + 16 + T.small * 1.1,
		x: (spot: number) =>
			left + ((spot - RANGE[0]) / (RANGE[1] - RANGE[0])) * (right - left),
		y: (value: number) =>
			bottom - ((value - Y[0]) / (Y[1] - Y[0])) * (bottom - top),
		rowY: (i: number) =>
			H * (narrow ? 0.3 : 0.33) + i * H * (narrow ? 0.17 : 0.18),
		rowH: H * (narrow ? 0.14 : 0.15),
		sumY: H * (narrow ? 0.7 : 0.75),
	};
}

const copy = {
	title: ["A first spread trade", "第一笔价差交易"],
	titleSub: ["every number known first", "下单前，数字都已知"],
	qTag: ["Mon Sep 16 · ALFA $100", "9月16日 周一 · ALFA $100"],
	qLine: [
		`The view: above $${VIEW_LEVEL} on Oct 18.`,
		`看法：10月18日高于 $${VIEW_LEVEL}。`,
	],
	qBig: ["And if the view is wrong?", "如果看错了呢？"],
	sHead: [
		`Buy the ${LONG.strike} call, sell the ${SHORT.strike}.`,
		`买入 ${LONG.strike} 看涨，卖出 ${SHORT.strike} 看涨。`,
	],
	legsTag: ["One call spread · per share", "一组看涨价差 · 每股"],
	buyLeg: [
		`buy 1 Oct 18 ${LONG.strike} call`,
		`买入 1 张 10月18日 ${LONG.strike} 看涨`,
	],
	sellLeg: [
		`sell 1 Oct 18 ${SHORT.strike} call`,
		`卖出 1 张 10月18日 ${SHORT.strike} 看涨`,
	],
	atAsk: ["at the ask", "按卖价成交"],
	atBid: ["at the bid", "按买价成交"],
	youPay: ["you pay", "付出"],
	youReceive: ["you receive", "收到"],
	netA: ["net debit · ", "净支出 · "],
	netB: [" a share · ", " 每股 · "],
	netC: [" a spread", " 每组"],
	order: [
		"one order, two legs, one net limit price",
		"一张订单，两条腿，一个净限价",
	],
	legNote: [
		"Sent apart, one leg can fill alone.",
		"分两张单下，可能只成交一条腿。",
	],
	pHead: ["Its loss and its gain are capped.", "亏损和盈利都有上限。"],
	axis: ["profit on Oct 18, per spread", "10月18日盈亏，每组价差"],
	buyMark: [`buy ${LONG.strike}`, `买入 ${LONG.strike}`],
	sellMark: [`sell ${SHORT.strike}`, `卖出 ${SHORT.strike}`],
	ceil: [" at most", " 封顶"],
	cHead: [
		"Call alone: bigger loss, no ceiling.",
		"只买看涨：亏得更多，不封顶。",
	],
	callFloor: [`${LONG.strike} call alone · `, `只买 ${LONG.strike} 看涨 · `],
	callFloorShort: ["alone ", "只买 "],
	noCeiling: ["no ceiling", "不封顶"],
	hHead: ["The most one spread can lose?", "一组价差最多亏多少？"],
	h2Head: [
		`The debit you paid: ${dollars(MAX_LOSS)}.`,
		`就是付出的净支出：${dollars(MAX_LOSS)}。`,
	],
	heroTag: ["worst case · per spread", "最坏情况 · 每组价差"],
	breakEven: [
		`break-even $${BREAK_EVEN.toFixed(2)}`,
		`盈亏平衡 $${BREAK_EVEN.toFixed(2)}`,
	],
	sizeA: [`${PLAN_SPREADS} spreads: `, `${PLAN_SPREADS} 组：`],
	sizeB: [` of ${dollars(ACCOUNT)}`, `，账户 ${dollars(ACCOUNT)}`],
	eHead: ["Oct 18: three ways it can end.", "10月18日：三种结局。"],
	e2Head: [
		`In between, you buy ${SHARES} shares.`,
		`落在中间：要买入 ${SHARES} 股。`,
	],
	below: [
		`ALFA $${ENDS.below} · below both strikes`,
		`ALFA $${ENDS.below} · 低于两个行权价`,
	],
	belowShort: [
		`ALFA $${ENDS.below} · below both`,
		`ALFA $${ENDS.below} · 都低于`,
	],
	between: [
		`ALFA $${ENDS.between} · between the strikes`,
		`ALFA $${ENDS.between} · 两个行权价之间`,
	],
	betweenShort: [
		`ALFA $${ENDS.between} · in between`,
		`ALFA $${ENDS.between} · 在中间`,
	],
	above: [
		`ALFA $${ENDS.above} · above both strikes`,
		`ALFA $${ENDS.above} · 高于两个行权价`,
	],
	aboveShort: [
		`ALFA $${ENDS.above} · above both`,
		`ALFA $${ENDS.above} · 都高于`,
	],
	bothExpire: ["both calls expire worthless", "两张看涨都作废"],
	longExercised: [
		`the ${LONG.strike} call is exercised`,
		`${LONG.strike} 看涨被行权`,
	],
	bothUsed: ["one exercised, one assigned", "一张行权，一张被指派"],
	sharesIn: [`${SHARES} shares`, `${SHARES} 股`],
	due: [`${dollars(BETWEEN.due)} due`, `应付 ${dollars(BETWEEN.due)}`],
	closeNote: [
		"Many close the spread before expiry.",
		"很多人会在到期前平掉价差。",
	],
	claimBig: [
		"Know the worst case before you order.",
		"下单之前，先知道最坏情况。",
	],
	claimSub: [
		"The best case, break-even and exits too.",
		"最好情况、盈亏平衡和出场点也一样。",
	],
	nextBig: ["Next: the module checkpoint", "下一步：本模块检查点"],
	nextSub: [
		"choose and place a trade, on a new day",
		"在新的一天里运用“选择并下一笔交易”",
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
	const headRoom = narrow ? room : room * 0.74;
	const headline = (name: string, text: Copy) => (
		<Lines
			name={name}
			text={t(text)}
			x={margin}
			y={L.headY}
			size={T.head}
			maxWidth={headRoom}
			anchor="start"
		/>
	);
	/** A headline's second half, a line under the first. */
	const answer = (name: string, text: Copy, under: Copy) => (
		<Lines
			name={name}
			text={t(text)}
			x={margin}
			y={L.headY + lineCount(t(under), headRoom, T.head) * T.head * 1.35}
			size={T.head}
			maxWidth={headRoom}
			anchor="start"
		/>
	);
	const text = narrow ? T.small * 1.1 : T.body;
	const row = (
		name: string,
		i: number,
		line: Copy,
		sub: Copy,
		value: ReactNode,
		valueClass: string,
		valueSub?: Copy,
	) => (
		<g key={name} data-f={name}>
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
				y={L.rowY(i) + L.rowH * 0.42}
				textAnchor="end"
				className={valueClass}
				style={{ fontSize: text }}
			>
				{value}
			</text>
			{valueSub ? (
				<text
					x={margin + room - 14}
					y={L.rowY(i) + L.rowH * 0.76}
					textAnchor="end"
					className="wt-film-type wt-film-dim"
					style={{ fontSize: T.small * 1.1 }}
				>
					{t(valueSub)}
				</text>
			) : null}
		</g>
	);
	const point = (spot: number, value: number, i: number) =>
		`${i ? "L" : "M"}${L.x(spot).toFixed(1)} ${L.y(value).toFixed(1)}`;
	const spreadPath = [RANGE[0], LONG.strike, SHORT.strike, RANGE[1]]
		.map((spot, i) => point(spot, spreadProfit(spot), i))
		.join("");
	// The call alone leaves the top of the chart still rising: it is never drawn flat there.
	const callPath = [RANGE[0], LONG.strike, callSpotAt(Y[1])]
		.map((spot, i) => point(spot, callProfit(spot), i))
		.join("");
	const noCeilingY = L.y(560);
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

			{/* Two legs, one net price, one order. */}
			{headline("s-head", copy.sHead)}
			<text
				data-f="legs-tag"
				x={margin}
				y={L.rowY(0) - T.small * 1.2}
				className="wt-film-tag"
				style={{ fontSize: T.small }}
			>
				{t(copy.legsTag).toUpperCase()}
			</text>
			{row(
				"leg-0",
				0,
				copy.buyLeg,
				copy.atAsk,
				usd(PAID),
				"wt-film-num",
				copy.youPay,
			)}
			{row(
				"leg-1",
				1,
				copy.sellLeg,
				copy.atBid,
				usd(RECEIVED),
				"wt-film-num",
				copy.youReceive,
			)}
			<path
				data-f="legs-bracket"
				d={`M${margin - 8} ${L.rowY(0) + 8}h-6V${L.rowY(1) + L.rowH - 8}h6`}
				className="wt-film-riser"
			/>
			<Word
				name="net"
				x={margin}
				y={L.sumY}
				size={narrow ? T.body : T.body * 1.2}
				anchor="start"
				className="wt-film-type"
			>
				{t(copy.netA)}
				<tspan className="wt-film-num wt-film-accent">{usd(DEBIT)}</tspan>
				{t(copy.netB)}
				<tspan className="wt-film-num wt-film-accent">
					{dollars(MAX_LOSS)}
				</tspan>
				{t(copy.netC)}
			</Word>
			<Word
				name="order-line"
				x={margin}
				y={L.sumY + T.body * 1.7}
				size={T.body}
				anchor="start"
				className="wt-film-type wt-film-dim"
			>
				{t(copy.order)}
			</Word>
			<Word
				name="leg-note"
				x={margin}
				y={L.sumY + T.body * 3.4}
				size={T.body}
				anchor="start"
				className="wt-film-type wt-film-dim"
			>
				{t(copy.legNote)}
			</Word>

			{/* The chart: the spread's floor and ceiling, then the call alone. */}
			{headline("p-head", copy.pHead)}
			{headline("c-head", copy.cHead)}
			{headline("h-head", copy.hHead)}
			{/* The hero's answer, as the brackets lock. */}
			{answer("h2-head", copy.h2Head, copy.hHead)}
			<g data-f="depth">
				<g data-f="world">
					<g data-f="chart">
						<text x={L.left} y={L.top - 12} className="wt-small">
							{t(copy.axis)}
						</text>
						<path d={`M${L.left} ${L.y(0)}H${L.right}`} className="wt-axis" />
						{[-400, 0, 400].map((v) => (
							<g key={v}>
								<path d={`M${L.left - 5} ${L.y(v)}h5`} className="wt-axis" />
								<text
									x={L.left - 8}
									y={L.y(v) + 4}
									textAnchor="end"
									className="wt-small"
								>
									{v === 0 ? "$0" : signedDollars(v)}
								</text>
							</g>
						))}
						{[90, 95, 100, 105, 110, 115].map((v) => (
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
						{[LONG, SHORT].map((leg) => (
							<g key={leg.strike}>
								<circle
									cx={L.x(leg.strike)}
									cy={L.y(0)}
									r={3.5}
									className="wt-film-ghost"
								/>
								<text
									x={L.x(leg.strike)}
									y={L.bottom + 32}
									textAnchor={leg === LONG ? "end" : "start"}
									className="wt-small"
									style={{ fill: "var(--tone-ink)" }}
								>
									{t(leg === LONG ? copy.buyMark : copy.sellMark)}
								</text>
							</g>
						))}
						<path data-f="l-call" d={callPath} className="wt-line-reference" />
						<path
							data-f="l-spread"
							d={spreadPath}
							className="wt-line-position"
							style={{ strokeWidth: 2.5 }}
						/>
						<PenTip name="pen" />
						<text
							data-f="g-ceil"
							x={L.right - 8}
							y={L.y(MAX_GAIN) + T.small * 1.1 + 6}
							textAnchor="end"
							className="wt-film-type wt-film-dim"
							style={{ fontSize: T.small * 1.1 }}
						>
							<tspan className={`wt-film-num ${toneClass.up}`}>
								{signedDollars(MAX_GAIN)}
							</tspan>
							{narrow ? "" : t(copy.ceil)}
						</text>
						<text
							data-f="g-call"
							x={L.left + 6}
							y={L.y(-PAID) - 8}
							className="wt-film-type wt-film-dim"
							style={{ fontSize: T.small * 1.1 }}
						>
							{t(narrow ? copy.callFloorShort : copy.callFloor)}
							<tspan className={`wt-film-num ${toneClass.down}`}>
								{signedDollars(-PAID)}
							</tspan>
						</text>
						<text
							data-f="g-no-ceiling"
							// Left of the rising line at the label's own height, never across it.
							x={L.x(callSpotAt(520)) - 10}
							y={noCeilingY}
							textAnchor="end"
							className="wt-film-type wt-film-dim"
							style={{ fontSize: T.small * 1.1 }}
						>
							{t(copy.noCeiling)}
						</text>
						<g data-f="be">
							<circle
								cx={L.x(BREAK_EVEN)}
								cy={L.y(0)}
								r={4}
								className="wt-film-ghost"
							/>
							<text
								x={L.x(BREAK_EVEN) + 10}
								y={L.y(0) + T.small * 1.1 + 6}
								className="wt-film-type wt-film-accent"
								style={{ fontSize: T.small * 1.1 }}
							>
								{t(copy.breakEven)}
							</text>
						</g>
					</g>
				</g>
			</g>
			<Word
				name="hero-tag"
				x={L.left + 12}
				y={L.heroTagY}
				size={T.small}
				anchor="start"
				className="wt-film-tag"
			>
				{t(copy.heroTag).toUpperCase()}
			</Word>
			<Word
				name="hero"
				x={L.left + 12}
				y={L.heroY}
				size={L.heroSize}
				anchor="start"
				className={`wt-film-num ${toneClass.down} wt-halo`}
			>
				{signedDollars(-MAX_LOSS)}
			</Word>
			<Word
				name="size-line"
				x={L.left + 12}
				y={L.sizeY}
				size={T.small * 1.1}
				anchor="start"
				className="wt-film-type"
			>
				{t(copy.sizeA)}
				<tspan className={`wt-film-num ${toneClass.down}`}>
					{signedDollars(-worstCase(PLAN_SPREADS))}
				</tspan>
				{narrow ? "" : t(copy.sizeB)}
			</Word>
			<Brackets name="lock-worst" tone="loss" glow />

			{/* Three ways Oct 18 can end. */}
			{headline("e-head", copy.eHead)}
			{answer("e2-head", copy.e2Head, copy.eHead)}
			{row(
				"end-0",
				0,
				narrow ? copy.belowShort : copy.below,
				copy.bothExpire,
				signedDollars(spreadProfit(ENDS.below)),
				`wt-film-num ${toneClass.down}`,
			)}
			{row(
				"end-1",
				1,
				narrow ? copy.betweenShort : copy.between,
				copy.longExercised,
				t(copy.sharesIn),
				"wt-film-num wt-film-accent",
				copy.due,
			)}
			{row(
				"end-2",
				2,
				narrow ? copy.aboveShort : copy.above,
				copy.bothUsed,
				signedDollars(spreadProfit(ENDS.above)),
				`wt-film-num ${toneClass.up}`,
			)}
			<Word
				name="close-note"
				x={margin}
				y={L.rowY(2) + L.rowH + T.body * 1.9}
				size={T.body}
				anchor="start"
				className="wt-film-type"
			>
				{t(copy.closeNote)}
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
	const L = layout(context.width);
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
	/** A chart label fades in where it stands. */
	const fade = (targets: Element | Element[], time: number) =>
		tl.fromTo(targets, { opacity: 0 }, { opacity: 1, duration: 0.5 }, time);
	const head = (name: string) => one(`${name}-head`);
	const heads = ["s", "p", "c", "h", "h2", "e", "e2"].map(head);
	const legs = [one("leg-0"), one("leg-1")];
	const legMarks = [
		one("legs-tag"),
		...legs,
		one("legs-bracket"),
		one("net"),
		one("order-line"),
		one("leg-note"),
	];
	const ends = [one("end-0"), one("end-1"), one("end-2")];
	const hero = [one("hero-tag"), one("hero"), one("size-line")];
	const lock = one<SVGGraphicsElement>("lock-worst");
	// The kit's glow uses this local alias too, so it matches the signed loss's brackets.
	lock.style.setProperty("--diagram-accent", toneColor("down"));
	const axes = kids("chart").filter((el) => !el.hasAttribute("data-f"));
	const callMarks = [one("l-call"), one("g-call"), one("g-no-ceiling")];

	d.hidden([
		...flat("q"),
		...heads,
		...legMarks,
		...kids("chart"),
		...hero,
		lock,
		...ends,
		one("close-note"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: a view that can be wrong ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	show(one("q-line"), 4.8);
	word(one("q-big"), 5.1);

	// ——— legs: two legs, one net price, one order ———
	tl.addLabel("legs", 8.6);
	hide(flat("q"), 8.6);
	show(head("s"), 8.85);
	show(one("legs-tag"), 9.0);
	show(legs, 9.3, "right");
	// The legs rest a full second before the bracket joins them into one net price.
	tl.fromTo(
		one("legs-bracket"),
		{ opacity: 0, scaleY: 0, transformOrigin: "50% 50%" },
		{ opacity: 1, scaleY: 1, duration: 0.5 },
		11.3,
	);
	show(one("net"), 11.3);
	show(one("order-line"), 11.3);
	show(one("leg-note"), 12.8);

	// ——— payoff: floor and ceiling, the call alone, then the hero ———
	tl.addLabel("payoff", 16.4);
	d.swap(head("s"), head("p"), 16.4);
	hide(legMarks, 16.4);
	d.rise(16.6);
	show(axes, 16.9);
	// The scaffold has settled by 17.4; the line draws a full second later.
	d.trace(one<SVGPathElement>("l-spread"), 18.5, {
		tip: one("pen"),
		duration: 0.9,
		ease: "power2.out",
	});
	fade(one("g-ceil"), 19.5);
	d.swap(head("p"), head("c"), 21.2);
	d.trace(one<SVGPathElement>("l-call"), 21.9, {
		duration: 0.7,
		ease: "power2.out",
	});
	fade(one("g-call"), 22.1);
	fade(one("g-no-ceiling"), 22.6);
	// The comparison leaves whole before the hero's question is asked.
	d.swap(head("c"), head("h"), 25.65);
	hide(callMarks, 25.65, 0.3, 0);
	show(head("h2"), 27.05);
	show(one("hero-tag"), 27.05);
	word(one("hero"), 27.05);
	d.lock(lock, 27.6, { around: one("hero"), pad: 8 });
	tl.addLabel("hero-lock", 27.6);
	// After the hero's 1.5-second stand: where the trade breaks even, then its size.
	fade(one("be"), 29.7);
	show(one("size-line"), 31.2);

	// ——— ends: three ways Oct 18 can end ———
	tl.addLabel("ends", 33.7);
	hide([head("h"), head("h2"), ...hero, lock], 33.7);
	d.sink(33.7);
	show(head("e"), 34.05);
	show(ends, 34.3, "right");
	// All three are read first; then the two plain ends step back for the one with shares.
	tl.to([ends[0], ends[2]], { opacity: 0.3, duration: 0.4 }, 36.9);
	show(head("e2"), 36.9);
	show(one("close-note"), 36.9);

	// ——— claim ———
	tl.addLabel("claim", 40.5);
	hide([head("e"), head("e2"), ...ends, one("close-note")], 40.5);
	word(one("z-big"), 40.8);
	show(one("z-sub"), 41.2);

	// ——— next ———
	tl.addLabel("next", 45.0);
	hide(kids("claim"), 45.0);
	d.close(45.0);
	return tl;
}

export const firstSpreadTradeFilm: Film = {
	id: "first-spread-trade",
	label: [
		`A first spread trade, as a short film: on Mon Sep 16, with ALFA at $100, a view that ALFA will be above $${VIEW_LEVEL} on Oct 18; one order with two legs, the Oct 18 ${LONG.strike} call bought at ${usd(PAID)} and the ${SHORT.strike} call sold at ${usd(RECEIVED)}, for a net debit of ${usd(DEBIT)} a share, ${dollars(MAX_LOSS)} a spread; its profit on Oct 18, capped at ${signedDollars(MAX_GAIN)} above $${SHORT.strike}, beside the ${LONG.strike} call alone, which can lose ${dollars(PAID)} and has no ceiling; the most one spread can lose, ${signedDollars(-MAX_LOSS)}, known before the order is sent, with break-even at $${BREAK_EVEN.toFixed(2)} and ${PLAN_SPREADS} spreads risking ${dollars(worstCase(PLAN_SPREADS))} of a ${dollars(ACCOUNT)} account; and three ways Oct 18 can end: below both strikes the debit is lost, above both the spread keeps ${signedDollars(MAX_GAIN)}, and between them the ${LONG.strike} call is exercised into ${SHARES} shares for ${dollars(BETWEEN.due)}, which is why many traders close a spread before expiry`,
		`第一笔价差交易短片：9月16日周一，ALFA 为 $100，看法是 10月18日 ALFA 会高于 $${VIEW_LEVEL}；一张订单、两条腿：以 ${usd(PAID)} 买入 10月18日 ${LONG.strike} 看涨，以 ${usd(RECEIVED)} 卖出 ${SHORT.strike} 看涨，净支出每股 ${usd(DEBIT)}，每组 ${dollars(MAX_LOSS)}；它在 10月18日的盈亏，在 $${SHORT.strike} 以上封顶于 ${signedDollars(MAX_GAIN)}，旁边是只买 ${LONG.strike} 看涨的情形，最多亏 ${dollars(PAID)}，但不封顶；一组价差最多亏 ${signedDollars(-MAX_LOSS)}，下单之前就已知道，盈亏平衡点在 $${BREAK_EVEN.toFixed(2)}，${PLAN_SPREADS} 组价差在 ${dollars(ACCOUNT)} 的账户里最多亏 ${dollars(worstCase(PLAN_SPREADS))}；以及 10月18日的三种结局：低于两个行权价，亏掉净支出；高于两个行权价，价差赚到 ${signedDollars(MAX_GAIN)}；落在两者之间，${LONG.strike} 看涨被行权，要用 ${dollars(BETWEEN.due)} 买入 ${SHARES} 股，所以很多交易者会在到期前平掉价差`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["A first spread trade", "第一笔价差交易"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "legs", label: ["Two legs, one order", "两条腿，一张订单"] },
		{ id: "payoff", label: ["Floor and ceiling", "下限与上限"] },
		{ id: "ends", label: ["Three ends", "三种结局"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
