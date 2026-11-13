import { ALFA, type Copy, pick, signedUsd, usd } from "@/content/world";
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
	Word,
} from "../walkthrough/film-kit";
import {
	CALL_100,
	CALL_CREDIT,
	CLOSE,
	CLOSE_OWED,
	CLOSE_RESULT,
	CREDIT,
	callSpread,
	condor,
	LEGS,
	type Leg,
	legCash,
	legPrice,
	MAX_LOSS,
	NET_CASH,
	PUT_100,
	PUT_CREDIT,
	putSpread,
	RANGE,
	SIZE,
	STRADDLE_COST,
	STRADDLE_HIGH,
	STRADDLE_LOW,
	straddle,
	WIDTH,
	WORST_CASH,
	worth,
} from "./multi-leg-structures-model";

/*
 * Straddles and condors, as a film. You have no view on which way ALFA goes: is there
 * still a trade? First a straddle, a V that needs a move of $8.40 either way: it buys a
 * move. The hero is an iron condor: two credit spreads that together keep $217 inside
 * $95–$105 and can lose $283 outside, and glowing brackets lock on what it keeps: it sells a
 * range. Then your one condor as one order: four legs, each with the cash it brings in or
 * costs a contract, adding to a +$217 net credit, with −$283 the worst case at expiry; and
 * one worked close, ALFA at $108, where the 105 call owes $300 and the whole loses $83.
 *
 *   open      0–4        "Straddles and condors"
 *   question  4–8.6      no view on direction: is there still a trade?
 *   straddle  8.6–18.2   call and put; a V at $100; break-even $91.60 and $108.40
 *   condor    18.2–30.5  hero: put spread and call spread; together; it sells a range
 *   package   30.5–41.3  one order, four legs; net credit; worst case; a close at $108
 *   claim     41.3–45.6  four legs, one trade
 *   next      45.6–47.2  Next: size and exit
 */

const END = 47.2;
const CENTS = (perShare: number) => Math.round(perShare * 100);
/** Dollars a share as whole dollars a contract: "+$375", "−$283". */
const perContract = (perShare: number) => signedUsd(CENTS(perShare) * 100, 0);
const share = (dollars: number) => usd(CENTS(dollars));
// Model curves use a 100-share contract; WIDTH is dollars per share.
const WING_PAYOUT = CENTS(WIDTH) * 100;
/** The leg the worked close turns on: the one option worth anything at that price. */
const CLOSE_LEG = LEGS.findIndex(
	(leg) => leg.side === "sell" && worth(leg.contract, CLOSE) > 0,
);
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
	const rowY = (i: number) =>
		H * (narrow ? 0.26 : 0.27) + i * H * (narrow ? 0.085 : 0.09);
	const rowH = H * (narrow ? 0.07 : 0.075);
	// Under the four legs: their total, the worst case, then the card for the worked close.
	const totalY = rowY(LEGS.length);
	const cardY = H * (narrow ? 0.735 : 0.775);
	const cardH = H * (narrow ? 0.215 : 0.15);
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
		rowY,
		rowH,
		totalY,
		worstY: totalY + rowH + (cardY - totalY - rowH) * 0.68,
		cardY,
		cardH,
		closeY: cardY + cardH * (narrow ? 0.36 : 0.42),
		closeResultY: cardY + cardH * (narrow ? 0.76 : 0.82),
	};
}

const SIDE: Record<Leg["side"], Copy> = {
	sell: ["Sell", "卖出"],
	buy: ["Buy", "买入"],
};
const RIGHT: Record<Leg["contract"]["right"], Copy> = {
	call: ["call", "看涨"],
	put: ["put", "看跌"],
};
/** A leg of the order as its row reads: "Sell 1 · 95 put at $2.05"; shorter on a phone. */
const legRow = (leg: Leg, narrow: boolean): Copy => {
	const name = (i: 0 | 1) =>
		`${leg.contract.strike} ${RIGHT[leg.contract.right][i]}`;
	const price = usd(legPrice(leg));
	return narrow
		? [
				`${SIDE[leg.side][0]} ${name(0)} · ${price}`,
				`${SIDE[leg.side][1]} ${name(1)} · ${price}`,
			]
		: [
				`${SIDE[leg.side][0]} ${SIZE} · ${name(0)} at ${price}`,
				`${SIDE[leg.side][1]} ${SIZE} 张 · ${name(1)} · ${price}`,
			];
};

const copy = {
	title: ["Straddles and condors", "跨式与铁鹰"],
	titleSub: ["trades that pick no direction", "不判断方向的交易"],
	qTag: [
		`ALFA ${usd(ALFA.open, 0)} · Oct 18`,
		`ALFA ${usd(ALFA.open, 0)} · 10月18日`,
	],
	qView: ["You have no view on ALFA's direction.", "你不判断 ALFA 的涨跌。"],
	qBig: ["Is there still a trade?", "还有交易可做吗？"],
	sHead: ["A long straddle needs a big move.", "买入跨式需大幅变动。"],
	cHead: ["An iron condor: two credit spreads.", "铁鹰：两个收入价差。"],
	c2Head: ["It sells a range.", "它卖出的是一个区间。"],
	callLeg: ["100 call", "100 看涨"],
	putLeg: ["100 put", "100 看跌"],
	putSpread: [
		`put credit ${usd(CENTS(PUT_CREDIT) * 100, 0)}`,
		`看跌收入 ${usd(CENTS(PUT_CREDIT) * 100, 0)}`,
	],
	callSpread: [
		`call +${usd(CENTS(CALL_CREDIT) * 100, 0)}`,
		`看涨 +${usd(CENTS(CALL_CREDIT) * 100, 0)}`,
	],
	valueAxis: ["Oct 18 value · 100 shares/leg", "10月18日价值 · 每腿100股"],
	straddleAxis: ["Oct 18 profit · per straddle", "10月18日盈亏 · 每组跨式"],
	condorAxis: ["Oct 18 profit · per condor", "10月18日盈亏 · 每组铁鹰"],
	paid: [
		`${perContract(-STRADDLE_COST)} paid`,
		`支付 ${perContract(-STRADDLE_COST)}`,
	],
	pHead: ["Your condor goes in as one order.", "你的铁鹰作为一张订单下达。"],
	p2Head: [
		`At $${CLOSE} the condor loses ${usd(-CLOSE_RESULT, 0)}.`,
		`收于 $${CLOSE}，铁鹰亏 ${usd(-CLOSE_RESULT, 0)}。`,
	],
	total: ["net credit a condor (×100 shares)", "每组净收入（×100 股）"],
	totalShort: ["net credit a condor (×100)", "每组净收入（×100）"],
	worst: ["worst case at expiry", "到期最坏情况"],
	close: [
		`Oct 18 close $${CLOSE} · the ${LEGS[CLOSE_LEG].contract.strike} call owes ${usd(CLOSE_OWED, 0)}`,
		`10月18日收于 $${CLOSE} · ${LEGS[CLOSE_LEG].contract.strike} 看涨要付 ${usd(CLOSE_OWED, 0)}`,
	],
	closeShort: [
		`close $${CLOSE} · ${LEGS[CLOSE_LEG].contract.strike} call owes ${usd(CLOSE_OWED, 0)}`,
		`收于 $${CLOSE} · ${LEGS[CLOSE_LEG].contract.strike} 看涨要付 ${usd(CLOSE_OWED, 0)}`,
	],
	claimBig: ["Four legs, one trade.", "四条腿，一笔交易。"],
	claimSub: [
		`Best ${signedUsd(NET_CASH, 0)}, worst ${signedUsd(WORST_CASH, 0)} a condor.`,
		`每组最好 ${signedUsd(NET_CASH, 0)}，最坏 ${signedUsd(WORST_CASH, 0)}。`,
	],
	nextBig: ["Next: size and exit", "下一课：仓位与出场"],
	nextSub: ["decide both before you buy", "买入前就定好"],
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
	/** A break-even: a dashed riser across the chart, starting under its price at the top. */
	const even = (name: string, spot: number) => (
		<g data-f={name}>
			<path
				d={`M${L.x(spot)} ${L.top + 22}V${L.bottom}`}
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
					name="q-line"
					text={t(copy.qView)}
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

			{headline("s-head", copy.sHead)}
			{headline("c-head", copy.cHead)}
			{/* The hero's answer, as the brackets lock on what the condor keeps. */}
			<Lines
				name="c2-head"
				text={t(copy.c2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.cHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			<g data-f="depth">
				<g data-f="world">
					{/* The straddle, on its own scale. */}
					{axes("axes-s", S_Y, S_TICKS)}
					<text
						data-f="s-value-caption"
						x={L.left}
						y={L.top - 25}
						className="wt-small"
					>
						{t(copy.valueAxis)}
					</text>
					<text
						data-f="s-profit-caption"
						x={L.left}
						y={L.top - 25}
						className="wt-small"
					>
						{t(copy.straddleAxis)}
					</text>
					<path
						data-f="s-call"
						d={path(S_Y, callPay)}
						className="wt-line-call"
					/>
					<path data-f="s-put" d={path(S_Y, putPay)} className="wt-line-put" />
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
						toneClass.call,
						"end",
					)}
					{label(
						"s-put-tag",
						L.x(84) + 6,
						L.y(S_Y, putPay(84) * 100) - 10,
						t(copy.putLeg),
						toneClass.put,
						"start",
					)}
					{label(
						"s-cost",
						L.x(100),
						L.y(S_Y, profit(100) * 100) + 22,
						t(copy.paid),
						"wt-film-loss",
					)}
					<path
						data-f="s-deduct"
						d={`M${L.x(100)} ${L.y(S_Y, 0)}V${L.y(S_Y, -STRADDLE_COST * 100)}m-4 -6 4 6 4 -6`}
						className="wt-line-position"
						style={{ stroke: "var(--diagram-loss)" }}
					/>
					{even("s-low", STRADDLE_LOW)}
					{even("s-high", STRADDLE_HIGH)}

					{/* The condor, on a closer scale. */}
					{axes("axes-c", C_Y, C_TICKS)}
					<text
						data-f="c-caption"
						x={L.left}
						y={L.top - 25}
						className="wt-small"
					>
						{t(copy.condorAxis)}
					</text>
					<path
						data-f="c-put"
						d={path(C_Y, putSpread)}
						className="wt-line-put"
					/>
					<path
						data-f="c-call"
						d={path(C_Y, callSpread)}
						className="wt-line-call"
					/>
					<path
						data-f="c-sum"
						d={path(C_Y, condor)}
						className="wt-line-position"
					/>
					<text
						data-f="c-put-tag"
						x={L.right - 6}
						y={L.y(C_Y, PUT_CREDIT * 100) - 16}
						textAnchor="end"
						className={`wt-film-type wt-halo ${toneClass.put}`}
						style={{ fontSize: T.small * 1.15 }}
					>
						{t(copy.putSpread)}
					</text>
					<text
						data-f="c-call-tag"
						x={L.left + 6}
						y={L.y(C_Y, CALL_CREDIT * 100) - 16}
						textAnchor="start"
						className={`wt-film-type wt-halo ${toneClass.call}`}
						style={{ fontSize: T.small * 1.15 }}
					>
						{t(copy.callSpread)}
					</text>
					<g data-f="c-range">
						<rect
							x={L.x(95)}
							y={L.y(C_Y, CREDIT * 100)}
							width={L.x(105) - L.x(95)}
							height={L.y(C_Y, 0) - L.y(C_Y, CREDIT * 100)}
							className="wt-film-gain"
							fill="currentColor"
							opacity={0.12}
						/>
						<text
							x={L.x(100)}
							y={(L.y(C_Y, CREDIT * 100) + L.y(C_Y, 0)) / 2 + T.small * 0.35}
							textAnchor="middle"
							className="wt-film-num"
							style={{ fontSize: T.small }}
						>
							$95–$105
						</text>
					</g>
					<path
						data-f="c-plateau"
						d={`M${L.x(95)} ${L.y(C_Y, CREDIT * 100)}H${L.x(105)}`}
						className="wt-line-position"
						style={{ strokeWidth: 5, stroke: "var(--diagram-gain)" }}
					/>
					<text
						data-f="c-keep"
						x={L.x(100)}
						y={L.y(C_Y, CREDIT * 100) - 32}
						textAnchor="middle"
						className="wt-film-num wt-halo wt-film-gain"
						style={{ fontSize: T.num * 1.4 }}
					>
						{perContract(CREDIT)}
					</text>
					<g data-f="c-risk">
						<text
							x={L.left + 6}
							y={L.y(C_Y, -MAX_LOSS * 100) + 22}
							className="wt-film-num wt-halo"
							style={{ fontSize: T.small * 1.15 }}
						>
							{`${pick(["wing", "翼宽"], locale)} ${usd(CENTS(WIDTH), 0)} × ${pick(["100 shares", "100股"], locale)} = ${usd(WING_PAYOUT, 0)}`}
						</text>
						<text
							x={L.left + 6}
							y={L.y(C_Y, -MAX_LOSS * 100) + 22 + T.small * 1.5}
							className="wt-film-num wt-halo"
							style={{ fontSize: T.small * 1.15 }}
						>
							<tspan className="wt-film-gain">{perContract(CREDIT)}</tspan>
							<tspan>{` − ${usd(WING_PAYOUT, 0)} = `}</tspan>
							<tspan className="wt-film-loss">{perContract(-MAX_LOSS)}</tspan>
						</text>
					</g>
					<Brackets name="lock-keep" glow />
				</g>
			</g>

			{/* Your one condor, entered as one order. */}
			{headline("p-head", copy.pHead)}
			{/* The worked close's answer, as its result lands. */}
			<Lines
				name="p2-head"
				text={t(copy.p2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.pHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
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
						{t(legRow(leg, narrow))}
					</text>
					<text
						x={margin + room - 14}
						y={L.rowY(i) + L.rowH / 2 + text * 0.36}
						textAnchor="end"
						className="wt-film-num"
						style={{ fontSize: text }}
					>
						{signedUsd(legCash(leg), 0)}
					</text>
				</g>
			))}
			{/* The legs' cash added up: one net price for the whole order. */}
			<g data-f="leg-total">
				<rect
					x={margin}
					y={L.totalY}
					width={room}
					height={L.rowH}
					rx={10}
					className="wt-panel-shape"
				/>
				<text
					x={margin + 14}
					y={L.totalY + L.rowH / 2 + text * 0.36}
					className="wt-film-type"
					style={{ fontSize: text }}
				>
					{t(narrow ? copy.totalShort : copy.total)}
				</text>
				<text
					x={margin + room - 14}
					y={L.totalY + L.rowH / 2 + text * 0.36}
					textAnchor="end"
					className="wt-film-num wt-film-gain"
					style={{ fontSize: text }}
				>
					{signedUsd(NET_CASH, 0)}
				</text>
			</g>
			<text
				data-f="pkg-worst"
				x={margin + room - 14}
				y={L.worstY}
				textAnchor="end"
				className="wt-film-type"
				style={{ fontSize: narrow ? T.small * 1.1 : T.small * 1.15 }}
			>
				<tspan className="wt-film-dim">{`${t(copy.worst)} `}</tspan>
				<tspan className="wt-film-num wt-film-loss">
					{signedUsd(WORST_CASH, 0)}
				</tspan>
			</text>
			{/* One worked close: the whole position at one ALFA price. */}
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
					y={L.closeY}
					className="wt-film-type"
					style={{ fontSize: narrow ? T.small * 1.1 : T.small * 1.15 }}
				>
					{t(narrow ? copy.closeShort : copy.close)}
				</text>
			</g>
			<text
				data-f="pkg-result"
				x={margin + 16}
				y={L.closeResultY}
				className="wt-film-num"
				style={{ fontSize: T.body }}
			>
				<tspan>{`${signedUsd(NET_CASH, 0)} − ${usd(CLOSE_OWED, 0)} = `}</tspan>
				<tspan className="wt-film-loss">{signedUsd(CLOSE_RESULT, 0)}</tspan>
			</text>

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
	const draw = (path: SVGPathElement, time: number) =>
		d.trace(path, time, { duration: 0.7, ease: "power2.out" });
	const fadeIn = (target: Element | Element[], at: number, duration = 0.5) =>
		tl.fromTo(target, { opacity: 0 }, { opacity: 1, duration }, at);
	const p = (name: string) => one<SVGPathElement>(name);
	const heads = {
		straddle: one("s-head"),
		condor: one("c-head"),
		condorAnswer: one("c2-head"),
		package: one("p-head"),
		packageAnswer: one("p2-head"),
	};
	const legs = LEGS.map((_, i) => one(`leg-${i}`));
	const lockKeep = one<SVGGraphicsElement>("lock-keep");
	d.hidden([
		...flat("q"),
		...Object.values(heads),
		...kids("world"),
		...legs,
		one("leg-total"),
		one("pkg-worst"),
		one("pkg"),
		one("pkg-result"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: no view on direction ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	show(one("q-line"), 4.8);
	word(one("q-big"), 5.1);

	// ——— straddle: a V that needs a move ———
	tl.addLabel("straddle", 8.6);
	// Whole-beat cut: the settled scaffold stands 1 s before the first trace.
	tl.set(flat("q"), { opacity: 0 }, 8.6);
	tl.set(one("depth"), { opacity: 1, scale: 1 }, 8.6);
	tl.set(
		[heads.straddle, one("axes-s"), one("s-value-caption")],
		{ opacity: 1, x: 0, y: 0 },
		8.6,
	);
	draw(p("s-call"), 9.6);
	show(one("s-call-tag"), 9.6);
	draw(p("s-put"), 10.4);
	show(one("s-put-tag"), 10.4);
	// The component value V settles at 11.1; deduction begins after 1 s of quiet.
	fadeIn(one("s-cost"), 12.1);
	d.trace(p("s-deduct"), 12.1, { duration: 0.5, ease: "power2.out" });
	// The premium deduction settles at 12.6, then stands for a full second.
	hide(one("s-value-caption"), 12.1, 0.3, 0);
	fadeIn(one("s-profit-caption"), 13.6, 0.3);
	tl.to([p("s-call"), p("s-put")], { opacity: 0.2, duration: 0.4 }, 13.6);
	hide([one("s-call-tag"), one("s-put-tag")], 13.6, 0.3);
	draw(p("s-profit"), 13.6);
	// Profit settles at 14.3, then earns 1 s before its break-even guides.
	fadeIn([one("s-low"), one("s-high")], 15.3);

	// ——— condor: the hero. Two credit spreads that sell a range. ———
	tl.addLabel("condor", 18.2);
	// Cut the whole chart and headline together, then keep the new scale still 1 s.
	tl.set(
		[
			heads.straddle,
			one("axes-s"),
			one("s-profit-caption"),
			p("s-call"),
			p("s-put"),
			p("s-profit"),
			p("s-deduct"),
			one("s-cost"),
			one("s-low"),
			one("s-high"),
		],
		{ opacity: 0 },
		18.2,
	);
	tl.set(
		[heads.condor, one("axes-c"), one("c-caption")],
		{ opacity: 1, x: 0, y: 0 },
		18.2,
	);
	draw(p("c-put"), 19.2);
	fadeIn(one("c-put-tag"), 19.4);
	draw(p("c-call"), 20.9);
	fadeIn(one("c-call-tag"), 20.9);
	// Put settles at 19.9, call at 21.6: each gets 1 s before the next proof.
	tl.to([p("c-put"), p("c-call")], { opacity: 0.2, duration: 0.4 }, 22.6);
	hide(one("c-put-tag"), 22.6, 0.3);
	// Retain the call label's prior 2 s hold while the combined curve finishes.
	hide(one("c-call-tag"), 22.9, 0.3);
	draw(p("c-sum"), 22.6);
	// One result construction: emphasize the plateau, credit and bounded loss.
	fadeIn([one("c-range"), one("c-keep"), one("c-risk")], 24.3);
	draw(p("c-plateau"), 24.3);
	// Range settles at 25.0 and stands 2.0 s before the hero lock.
	d.lock(lockKeep, 26.9, { around: one("c-keep"), pad: 6 });
	tl.addLabel("hero-lock", 26.9);
	show(heads.condorAnswer, 26.9);

	// ——— package: your one condor, one order ———
	tl.addLabel("package", 30.5);
	// Whole-stage cut: the condor heading and chart fade out together; the order's heading
	// fades in after they clear. It then stands for 1 s before all four legs arrive together.
	tl.to(
		[heads.condor, heads.condorAnswer, one("depth")],
		{ opacity: 0, duration: 0.3, ease: "power2.in" },
		30.5,
	);
	fadeIn(heads.package, 30.8, 0.3);
	show(legs, 32.1, "right", 0.3);
	// The legs settle at 32.4 and rest 1.2 s; their total is revealed settled, never counted.
	fadeIn(one("leg-total"), 33.6, 0.4);
	// The net credit settles at 34.0 and rests 1 s before the whole's worst case joins it.
	fadeIn(one("pkg-worst"), 35.0, 0.4);
	// Worst case settles at 35.4; a quiet second, then the one leg the close turns on stays lit.
	tl.to(
		legs.filter((_, i) => i !== CLOSE_LEG),
		{ opacity: 0.3, duration: 0.4 },
		36.4,
	);
	fadeIn(one("pkg"), 36.4, 0.4);
	// The close settles at 36.8 and rests 1 s; its result lands with the headline that names it.
	show(heads.packageAnswer, 37.8);
	fadeIn(one("pkg-result"), 37.8, 0.3);

	// ——— claim ———
	// The result settles at 38.1 and rests until the cut; its headline keeps a 3.5 s hold.
	tl.addLabel("claim", 41.3);
	hide(
		[
			heads.package,
			heads.packageAnswer,
			...legs,
			one("leg-total"),
			one("pkg-worst"),
			one("pkg"),
			one("pkg-result"),
		],
		41.3,
	);
	word(one("z-big"), 41.6);
	show(one("z-sub"), 42.0);

	// ——— next ———
	// The claim holds 4 s; the end card keeps the 1.6 s minimum the hero share leaves.
	tl.addLabel("next", 45.6);
	hide(kids("claim"), 45.6);
	d.close(45.6);
	return tl;
}

export const multiLegStructuresFilm: Film = {
	id: "multi-leg-structures",
	label: [
		`Straddles and condors, as a short film: with no view on which way ALFA goes, a long Oct 18 100 straddle bought for ${share(STRADDLE_COST)}, a V with break-evens at ${share(STRADDLE_LOW)} and ${share(STRADDLE_HIGH)}; an iron condor sold for ${share(CREDIT)} as a 95/90 put spread and a 105/110 call spread, keeping ${perContract(CREDIT)} between $95 and $105 and losing at most ${perContract(-MAX_LOSS)}; and that condor entered as one order of four legs, ${LEGS.map((leg) => signedUsd(legCash(leg), 0)).join(", ")} a contract, a net credit of ${signedUsd(NET_CASH, 0)}, which loses ${usd(-CLOSE_RESULT, 0)} if ALFA closes at $${CLOSE}`,
		`跨式与铁鹰短片：不判断 ALFA 涨跌时，以 ${share(STRADDLE_COST)} 买入 10月18日 100 跨式，一个 V 字，盈亏平衡在 ${share(STRADDLE_LOW)} 和 ${share(STRADDLE_HIGH)}；以 ${share(CREDIT)} 卖出的铁鹰，由 95/90 看跌价差和 105/110 看涨价差组成，$95 到 $105 之间保留 ${perContract(CREDIT)}，最多亏 ${perContract(-MAX_LOSS)}；这组铁鹰作为一张四条腿的订单下达，每张合约分别为 ${LEGS.map((leg) => signedUsd(legCash(leg), 0)).join("、")}，净收入 ${signedUsd(NET_CASH, 0)}，ALFA 收于 $${CLOSE} 时亏 ${usd(-CLOSE_RESULT, 0)}`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Straddles and condors", "跨式与铁鹰"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "straddle", label: ["A straddle", "跨式"] },
		{ id: "condor", label: ["An iron condor", "铁鹰"] },
		{ id: "package", label: ["One order", "一张订单"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
