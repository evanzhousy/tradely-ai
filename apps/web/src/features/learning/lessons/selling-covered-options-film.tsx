import type { ReactNode } from "react";
import {
	type Copy,
	dayLabel,
	expiries,
	percent,
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
	PenTip,
	TitleCard,
	toneClass,
	toneColor,
	Word,
} from "../walkthrough/film-kit";
import {
	ACCOUNT,
	CALL,
	CALL_BID,
	CALL_PREMIUM,
	CASH,
	CASH_SHARE,
	COVERED_BEST,
	COVERED_CAP,
	COVERED_EVEN,
	COVERED_WORST,
	dayOfMonth,
	NET_PRICE,
	PUT,
	PUT_BID,
	PUT_PREMIUM,
	SECURED_BEST,
	SECURED_WORST,
	SHARES,
	STOCK_COST,
	securedProfit,
	TRADING_DAYS,
} from "./selling-covered-options-model";

/*
 * Selling an option you can cover, as a film. You own 100 ALFA shares on Monday: can you be
 * paid to wait? Sell one Oct 18 105 call against them at its $2.05 bid and keep $205; if it is
 * assigned the shares go at $105. The pair makes +$705 at best, breaks even at $97.95 and loses
 * −$9,795 if ALFA falls to $0, and above $107.05 the shares alone make more. Or sell one Oct
 * 18 95 put at its $2.05 bid with $9,500 set aside, 95% of the $10,000 example account:
 * assigned, 100 shares cost a net $92.95. On
 * the chart the put's line keeps +$205 above $95 and falls all the way to $0; the hero is its
 * worst case, −$9,295, locked as the pen reaches ALFA $0, then the $9,500 it ties up of a
 * $10,000 account, and the +$205 it can keep. Last, both can be assigned on any of the 25
 * trading days from Sep 16 to Oct 18, likelier in the money with little time value left; buying
 * the option back prevents it.
 *
 *   open      0–4        "Selling an option you can cover"
 *   question  4–8.6      you own 100 ALFA shares: get paid to wait?
 *   call      8.6–17.7   the call and the shares; +$705, $97.95, −$9,795; above $107.05
 *   put       17.7–24.2  the put and the cash set aside; assigned, a net $92.95
 *   payoff    24.2–33.9  the put's line down to $0; hero: −$9,295 (28.2); $9,500; +$205
 *   assign    33.9–40.5  25 trading days, Sep 16 to Oct 18; likelier in the money; buying the option back prevents it
 *   claim     40.5–45.0  selling pays you to take on an obligation
 *   next      45.0–47.5  Next: the module checkpoint
 */

const END = 47.5;
/** Both options expire together: "Oct 18" / "10月18日". */
const EXPIRY = expiries[CALL.expiry].label;
/** The payoff chart: ALFA at expiry from $0, and profit per contract in dollars. */
const X = [0, 120] as const;
const Y = [-10_000, 1_500] as const;
/** Whole dollars from cents: "$205", "+$705", "−$9,795". */
const whole = (cents: number) => usd(cents, 0);
const signedWhole = (cents: number) => signedUsd(cents, 0);
/** A trading day as a calendar cell: "Sep 16", or the day alone inside a month. */
const monthDay = (date: string): Copy => {
	const [en, zh] = dayLabel(date);
	return [en.slice(4), zh.split(" ")[0]];
};

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room, type: T } = frame;
	const left = margin + (narrow ? 54 : 66);
	const right = margin + room;
	const top = H * (narrow ? 0.3 : 0.28);
	const bottom = H * 0.84;
	const label = T.body;
	const heroSize = T.num * 1.6;
	const sizeSize = narrow ? label : label * 0.9;
	// The hero stands in the chart's empty bottom-right corner, under the falling line: its
	// tag, the figure, then the cash the put ties up, spaced as the neighbouring films space theirs.
	const sizeY = bottom - 6;
	const heroY = sizeY - sizeSize - 16 - heroSize * 0.25;
	const heroTagY = heroY - 16 - heroSize;
	// The trading days as a calendar, Monday to Friday, one week a row.
	const calWidth = narrow ? room : room * 0.5;
	const col = calWidth / 5;
	const calHeadY = H * 0.3;
	const cellTop = H * (narrow ? 0.32 : 0.325);
	const pitch = H * (narrow ? 0.075 : 0.09);
	const noteSize = narrow ? T.body : T.body * 1.2;
	const cellSize = narrow ? T.body : T.small * 1.15;
	const cellH = narrow ? Math.max(pitch - 6, cellSize * 1.8) : pitch - 7;
	const cellsBottom = cellTop + 4 * pitch + cellH;
	return {
		...frame,
		left,
		right,
		top,
		bottom,
		label,
		// On a phone the chart's labels are set at body size, a step up from the small type.
		tick: narrow ? T.body * 1.05 : T.small * 1.15,
		heroSize,
		sizeSize,
		sizeY,
		heroY,
		heroTagY,
		heroX: right - (narrow ? 8 : 12),
		x: (spot: number) =>
			left + ((spot - X[0]) / (X[1] - X[0])) * (right - left),
		y: (value: number) =>
			bottom - ((value - Y[0]) / (Y[1] - Y[0])) * (bottom - top),
		rowY: (i: number) =>
			H * (narrow ? 0.3 : 0.33) + i * H * (narrow ? 0.17 : 0.18),
		rowH: H * (narrow ? 0.14 : 0.15),
		putNetY: H * (narrow ? 0.7 : 0.78),
		sumY: H * (narrow ? 0.7 : 0.75),
		sumSize: narrow ? T.body : T.body * 1.2,
		calX: (i: number) => margin + col * (i + 0.5),
		col,
		calHeadY,
		cellY: (week: number) => cellTop + week * pitch,
		cellH,
		cellSize,
		cellsBottom,
		noteSize,
		noteX: narrow ? margin : margin + room * 0.56,
		noteRoom: narrow ? room : room * 0.42,
		noteY: narrow ? cellsBottom + 6 + noteSize * 1.6 : H * 0.38,
	};
}

const copy = {
	title: ["Selling an option you can cover", "卖出有保障的期权"],
	titleSub: ["calls on shares, puts on cash", "看涨靠股票，看跌靠现金"],
	qTag: ["Mon Sep 16 · ALFA $100", "9月16日 周一 · ALFA $100"],
	qLine: [`You own ${SHARES} ALFA shares.`, `你持有 ${SHARES} 股 ALFA。`],
	qBig: ["Get paid to wait?", "持股等待，还能收钱？"],
	cHead: ["Sell one call against your shares.", "对着你的股票卖出一张看涨。"],
	c2Head: [
		`Above ${usd(COVERED_CAP)}, shares alone make more.`,
		`高于 ${usd(COVERED_CAP)}，只持股赚得更多。`,
	],
	legsTag: ["An example · 100 shares a contract", "示例 · 每张 100 股"],
	legsTagShort: ["An example", "示例"],
	callLeg: [
		`sell 1 ${EXPIRY[0]} ${CALL.strike} call`,
		`卖出 1 张 ${EXPIRY[1]} ${CALL.strike} 看涨`,
	],
	atBid: ["at the bid", "按买价成交"],
	callShare: [`${usd(CALL_BID)} a share`, `每股 ${usd(CALL_BID)}`],
	callKeep: [`you keep ${whole(CALL_PREMIUM)}`, `留下 ${whole(CALL_PREMIUM)}`],
	sharesLine: [`your ${SHARES} ALFA shares`, `你的 ${SHARES} 股 ALFA`],
	sharesCost: [
		`bought at ${usd(STOCK_COST, 0)}`,
		`以 ${usd(STOCK_COST, 0)} 买入`,
	],
	sharesGo: [`sold at $${CALL.strike}`, `以 $${CALL.strike} 卖出`],
	ifCalled: ["if the call is assigned", "如果看涨被指派"],
	bestA: ["best case ", "最好情况 "],
	bestB: [
		` · ALFA $${CALL.strike} or higher`,
		` · ALFA 收于 $${CALL.strike} 或更高`,
	],
	even: ["break-even ", "盈亏平衡 "],
	worstA: ["worst case ", "最坏情况 "],
	worstB: [" · ALFA at $0", " · ALFA 跌到 $0"],
	cap: [
		`$${CALL.strike} strike + ${usd(CALL_BID)} premium = ${usd(COVERED_CAP)}`,
		`行权价 $${CALL.strike} + 权利金 ${usd(CALL_BID)} = ${usd(COVERED_CAP)}`,
	],
	capShort: [
		`$${CALL.strike} + ${usd(CALL_BID)} = ${usd(COVERED_CAP)}`,
		`$${CALL.strike} + ${usd(CALL_BID)} = ${usd(COVERED_CAP)}`,
	],
	pHead: [
		"Or sell one put, with cash set aside.",
		"或者卖出一张看跌，并预留现金。",
	],
	putLeg: [
		`sell 1 ${EXPIRY[0]} ${PUT.strike} put`,
		`卖出 1 张 ${EXPIRY[1]} ${PUT.strike} 看跌`,
	],
	putShare: [`${usd(PUT_BID)} a share`, `每股 ${usd(PUT_BID)}`],
	putKeep: [`you keep ${whole(PUT_PREMIUM)}`, `留下 ${whole(PUT_PREMIUM)}`],
	cashLine: ["cash set aside", "预留现金"],
	cashHow: [
		`$${PUT.strike} strike × ${SHARES} shares`,
		`行权价 $${PUT.strike} × ${SHARES} 股`,
	],
	cashAccount: [
		`${percent(CASH_SHARE, 0)} of a ${whole(ACCOUNT)} example account`,
		`${whole(ACCOUNT)} 示例账户的 ${percent(CASH_SHARE, 0)}`,
	],
	cashWhy: [`buys ${SHARES} shares if assigned`, "被指派时用来买股"],
	// The Chinese fits the phone card in full; the English has room for the condition only.
	cashWhyShort: ["if assigned", "被指派时用来买股"],
	netA: [
		`if assigned: ${SHARES} shares at $${PUT.strike}, net `,
		`如果被指派：以 $${PUT.strike} 买入 ${SHARES} 股，每股净价 `,
	],
	netAShort: [
		`assigned: ${SHARES} shares, net `,
		`被指派：${SHARES} 股，每股净价 `,
	],
	netB: [" a share", ""],
	netBShort: [" each", ""],
	hHead: ["What can one put lose?", "一张看跌最多能亏多少？"],
	h2Head: [
		`${whole(-SECURED_WORST)}, if ALFA falls to $0.`,
		`ALFA 跌到 $0 时，最多亏 ${whole(-SECURED_WORST)}。`,
	],
	axis: [`profit on ${EXPIRY[0]}, per contract`, `${EXPIRY[1]}盈亏，每张合约`],
	xAxis: [`ALFA's price on ${EXPIRY[0]}`, `${EXPIRY[1]} ALFA 股价`],
	xAxisShort: [`ALFA on ${EXPIRY[0]}`, `${EXPIRY[1]} ALFA 股价`],
	sellMark: [`sell ${PUT.strike}`, `卖出 ${PUT.strike}`],
	ceil: [" at most", " 封顶"],
	heroTag: ["worst case · per contract", "最坏情况 · 每张合约"],
	heroTagShort: ["worst, per contract", "最坏情况 · 每张合约"],
	sizeA: ["set aside: ", "预留 "],
	sizeB: [` of ${whole(ACCOUNT)}`, `（账户 ${whole(ACCOUNT)}）`],
	aHead: ["Both can be assigned any day.", "两者都可能在任一交易日被指派。"],
	a2Head: ["Buying the option back prevents it.", "只有先买回平仓，才能避免。"],
	calSpan: [
		`${TRADING_DAYS.length} trading days, ${monthDay(TRADING_DAYS[0])[0]} to ${monthDay(TRADING_DAYS[TRADING_DAYS.length - 1])[0]}`,
		`${monthDay(TRADING_DAYS[0])[1]}至${monthDay(TRADING_DAYS[TRADING_DAYS.length - 1])[1]}，共 ${TRADING_DAYS.length} 个交易日`,
	],
	calNote: ["you can't tell which day", "无法预知是哪一天"],
	calMore: [
		"likelier: in the money, little time value left",
		"更可能：实值、时间价值所剩无几",
	],
	claimBig: [
		"Selling pays you to take on an obligation.",
		"卖出期权，是收钱承担一项义务。",
	],
	claimSub: [
		"Know its worst case; assignment can come any day.",
		"先知道最坏情况；指派随时可能到来。",
	],
	nextBig: ["Next: the module checkpoint", "下一步：本模块检查点"],
	nextSub: [
		"choose and place a trade, on a new day",
		"在新的一天里运用“选择并下一笔交易”",
	],
} as const satisfies Record<string, Copy>;

const weekdays: readonly Copy[] = [
	["Mon", "周一"],
	["Tue", "周二"],
	["Wed", "周三"],
	["Thu", "周四"],
	["Fri", "周五"],
];

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
	/** A card's second line: on a phone a step up from the small type, so it reads at 1.5×. */
	const subText = narrow ? T.body : T.small * 1.1;
	const row = (
		name: string,
		i: number,
		line: Copy,
		sub: Copy,
		value: ReactNode,
		valueSub: Copy,
		third?: Copy,
	) => {
		const lineY = (k: number) => L.rowY(i) + L.rowH * [0.42, 0.76, 1.1][k];
		return (
			<g key={name} data-f={name}>
				<rect
					x={margin}
					y={L.rowY(i)}
					width={room}
					height={L.rowH * (third ? 1.3 : 1)}
					rx={12}
					className="wt-panel-shape"
				/>
				<text
					x={margin + 14}
					y={lineY(0)}
					className="wt-film-num"
					style={{ fontSize: text }}
				>
					{t(line)}
				</text>
				<text
					x={margin + 14}
					y={lineY(1)}
					className="wt-film-type wt-film-dim"
					style={{ fontSize: subText }}
				>
					{t(sub)}
				</text>
				<text
					x={margin + room - 14}
					y={lineY(0)}
					textAnchor="end"
					className="wt-film-num"
					style={{ fontSize: text }}
				>
					{value}
				</text>
				<text
					x={margin + room - 14}
					y={lineY(1)}
					textAnchor="end"
					className="wt-film-type wt-film-dim"
					style={{ fontSize: subText }}
				>
					{t(valueSub)}
				</text>
				{third && (
					<text
						x={margin + 14}
						y={lineY(2)}
						className="wt-film-type wt-film-dim"
						style={{ fontSize: subText }}
					>
						{t(third)}
					</text>
				)}
			</g>
		);
	};
	/** One of the covered call's results, a line under the two cards. */
	const result = (name: string, k: number, children: ReactNode) => (
		<Word
			name={name}
			x={margin}
			y={L.sumY + k * T.body * 1.7}
			size={L.sumSize}
			anchor="start"
			className="wt-film-type"
		>
			{children}
		</Word>
	);
	const point = (spot: number, i: number) =>
		`${i ? "L" : "M"}${L.x(spot).toFixed(1)} ${L.y(securedProfit(spot) / 100).toFixed(1)}`;
	// Drawn from the right: the pen ends where ALFA is $0, at the put's worst case.
	const putPath = [X[1], PUT.strike, X[0]].map(point).join("");
	const last = TRADING_DAYS.length - 1;
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

			{/* The covered call: the call, the shares behind it, what the pair can do. */}
			{headline("c-head", copy.cHead)}
			{answer("c2-head", copy.c2Head, copy.cHead)}
			<text
				data-f="legs-tag"
				x={margin}
				y={L.rowY(0) - T.small * 1.2}
				className="wt-film-tag"
				style={{ fontSize: T.small }}
			>
				{t(narrow ? copy.legsTagShort : copy.legsTag).toUpperCase()}
			</text>
			{row(
				"leg-0",
				0,
				copy.callLeg,
				copy.atBid,
				t(copy.callShare),
				copy.callKeep,
			)}
			{row(
				"leg-1",
				1,
				copy.sharesLine,
				copy.sharesCost,
				t(copy.sharesGo),
				copy.ifCalled,
			)}
			{result(
				"r-best",
				0,
				<>
					{t(copy.bestA)}
					<tspan className={`wt-film-num ${toneClass.up}`}>
						{signedWhole(COVERED_BEST)}
					</tspan>
					{t(copy.bestB)}
				</>,
			)}
			{result(
				"r-even",
				1,
				<>
					{t(copy.even)}
					<tspan className="wt-film-num">{usd(COVERED_EVEN)}</tspan>
				</>,
			)}
			{result(
				"r-worst",
				2,
				<>
					{t(copy.worstA)}
					<tspan className={`wt-film-num ${toneClass.down}`}>
						{signedWhole(COVERED_WORST)}
					</tspan>
					{t(copy.worstB)}
				</>,
			)}
			<Word
				name="r-cap"
				x={margin}
				y={L.sumY + T.body * 5.1}
				size={T.body}
				anchor="start"
				className="wt-film-num"
			>
				{t(narrow ? copy.capShort : copy.cap)}
			</Word>

			{/* The cash-secured put: the put, the cash behind it, the net price if assigned. */}
			{headline("p-head", copy.pHead)}
			{row("leg-2", 0, copy.putLeg, copy.atBid, t(copy.putShare), copy.putKeep)}
			{row(
				"leg-3",
				1,
				copy.cashLine,
				copy.cashHow,
				whole(CASH),
				narrow ? copy.cashWhyShort : copy.cashWhy,
				copy.cashAccount,
			)}
			<Word
				name="p-net"
				x={margin}
				y={L.putNetY}
				size={L.sumSize}
				anchor="start"
				className="wt-film-type"
			>
				{t(narrow ? copy.netAShort : copy.netA)}
				<tspan className="wt-film-num wt-film-accent">{usd(NET_PRICE)}</tspan>
				{t(narrow ? copy.netBShort : copy.netB)}
			</Word>

			{/* The put at expiry, from ALFA $120 down to $0. */}
			{headline("h-head", copy.hHead)}
			{answer("h2-head", copy.h2Head, copy.hHead)}
			<g data-f="depth">
				<g data-f="world">
					<g data-f="chart">
						<text
							x={L.left}
							y={L.top - 12}
							className="wt-small"
							style={{ fontSize: L.tick }}
						>
							{t(copy.axis)}
						</text>
						<path d={`M${L.left} ${L.y(0)}H${L.right}`} className="wt-axis" />
						{[-8_000, -4_000, 0].map((v) => (
							<g key={v}>
								<path d={`M${L.left - 5} ${L.y(v)}h5`} className="wt-axis" />
								<text
									x={L.left - 8}
									y={L.y(v) + 4}
									textAnchor="end"
									className="wt-small"
									style={{ fontSize: L.tick }}
								>
									{v === 0 ? "$0" : signedWhole(v * 100)}
								</text>
							</g>
						))}
						{[0, 30, 60, 90, 120].map((v) => (
							<text
								key={v}
								x={L.x(v)}
								y={L.bottom + 16}
								textAnchor={
									v === X[1] ? "end" : v === X[0] ? "start" : "middle"
								}
								className="wt-small"
								style={{ fontSize: L.tick }}
							>
								{`$${v}`}
							</text>
						))}
						<text
							x={L.left}
							y={L.bottom + 16 + L.tick * 1.5}
							className="wt-small"
							style={{ fontSize: L.tick }}
						>
							{t(narrow ? copy.xAxisShort : copy.xAxis)}
						</text>
						<g>
							<circle
								cx={L.x(PUT.strike)}
								cy={L.y(0)}
								r={3.5}
								className="wt-film-ghost"
							/>
							<text
								x={L.x(PUT.strike)}
								y={L.bottom + 16 + L.tick * 1.5}
								textAnchor="middle"
								className="wt-small"
								style={{ fill: "var(--tone-ink)", fontSize: L.tick }}
							>
								{t(copy.sellMark)}
							</text>
						</g>
						<path
							data-f="l-put"
							d={putPath}
							className="wt-line-position"
							style={{ strokeWidth: 2.5 }}
						/>
						<PenTip name="pen" />
						<text
							data-f="g-ceil"
							x={L.right - 8}
							y={L.y(SECURED_BEST / 100) - 10}
							textAnchor="end"
							className="wt-film-type wt-film-dim"
							style={{ fontSize: L.label }}
						>
							<tspan className={`wt-film-num ${toneClass.up}`}>
								{signedWhole(SECURED_BEST)}
							</tspan>
							{narrow ? "" : t(copy.ceil)}
						</text>
					</g>
				</g>
			</g>
			<Word
				name="hero-tag"
				x={L.heroX}
				y={L.heroTagY}
				size={T.small}
				anchor="end"
				className="wt-film-tag"
			>
				{t(narrow ? copy.heroTagShort : copy.heroTag).toUpperCase()}
			</Word>
			<Word
				name="hero"
				x={L.heroX}
				y={L.heroY}
				size={L.heroSize}
				anchor="end"
				className={`wt-film-num ${toneClass.down} wt-halo`}
			>
				{signedWhole(SECURED_WORST)}
			</Word>
			<Word
				name="size-line"
				x={L.heroX}
				y={L.sizeY}
				size={L.sizeSize}
				anchor="end"
				className="wt-film-type"
			>
				{t(copy.sizeA)}
				<tspan className="wt-film-num">{whole(CASH)}</tspan>
				{t(copy.sizeB)}
			</Word>
			<Brackets name="lock-worst" tone="loss" glow />

			{/* Assignment: any trading day to Oct 18. */}
			{headline("a-head", copy.aHead)}
			{answer("a2-head", copy.a2Head, copy.aHead)}
			<g data-f="cal">
				{weekdays.map((day, i) => (
					<text
						key={day[0]}
						x={L.calX(i)}
						y={L.calHeadY}
						textAnchor="middle"
						className="wt-film-tag"
						style={{ fontSize: narrow ? T.body : T.small }}
					>
						{t(day).toUpperCase()}
					</text>
				))}
				<g data-f="cal-cells">
					{TRADING_DAYS.map((date, i) => {
						const week = Math.floor(i / 5);
						const first =
							i === 0 ||
							i === last ||
							dayOfMonth(date) < dayOfMonth(TRADING_DAYS[i - 1]);
						return (
							<g key={date}>
								<rect
									x={L.calX(i % 5) - L.col / 2 + 4}
									y={L.cellY(week)}
									width={L.col - 8}
									height={L.cellH}
									rx={6}
									className="wt-panel-shape"
								/>
								<text
									x={L.calX(i % 5)}
									y={L.cellY(week) + L.cellH / 2 + L.cellSize * 0.35}
									textAnchor="middle"
									className="wt-film-num"
									style={{ fontSize: L.cellSize }}
								>
									{first ? t(monthDay(date)) : dayOfMonth(date)}
								</text>
							</g>
						);
					})}
				</g>
			</g>
			<Lines
				name="cal-span"
				text={t(copy.calSpan)}
				x={L.noteX}
				y={L.noteY}
				size={L.noteSize}
				maxWidth={L.noteRoom}
				anchor="start"
				className="wt-film-type wt-film-dim"
			/>
			<Lines
				name="cal-note"
				text={t(copy.calNote)}
				x={L.noteX}
				y={
					L.noteY +
					lineCount(t(copy.calSpan), L.noteRoom, L.noteSize) *
						L.noteSize *
						1.35 +
					L.noteSize * 0.6
				}
				size={L.noteSize}
				maxWidth={L.noteRoom}
				anchor="start"
			/>
			<Lines
				name="cal-more"
				text={t(copy.calMore)}
				x={L.noteX}
				y={
					L.noteY +
					lineCount(t(copy.calSpan), L.noteRoom, L.noteSize) *
						L.noteSize *
						1.35 +
					L.noteSize * 0.6 +
					lineCount(t(copy.calNote), L.noteRoom, L.noteSize) *
						L.noteSize *
						1.35 +
					L.noteSize * 0.6
				}
				size={L.noteSize}
				maxWidth={L.noteRoom}
				anchor="start"
				className="wt-film-type wt-film-dim"
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
	const heads = ["c", "c2", "p", "h", "h2", "a", "a2"].map(head);
	const callRows = [one("leg-0"), one("leg-1")];
	const putRows = [one("leg-2"), one("leg-3")];
	const results = [one("r-best"), one("r-even"), one("r-worst")];
	const hero = [one("hero-tag"), one("hero"), one("size-line")];
	const lock = one<SVGGraphicsElement>("lock-worst");
	// The kit's glow uses this local alias too, so it matches the signed loss's brackets.
	lock.style.setProperty("--diagram-accent", toneColor("down"));
	const axes = kids("chart").filter((el) => !el.hasAttribute("data-f"));
	const notes = [one("cal-span"), one("cal-note"), one("cal-more")];

	d.hidden([
		...flat("q"),
		...heads,
		one("legs-tag"),
		...callRows,
		...results,
		one("r-cap"),
		...putRows,
		one("p-net"),
		...kids("chart"),
		...hero,
		lock,
		one("cal"),
		...notes,
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: you own the shares; can they pay you to wait? ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	show(one("q-line"), 4.8);
	word(one("q-big"), 5.1);

	// ——— call: the call sold against the shares, and what the pair can do ———
	tl.addLabel("call", 8.6);
	hide(flat("q"), 8.6);
	show(head("c"), 8.85);
	show(one("legs-tag"), 9.0);
	show(callRows, 9.3, "right");
	// The two cards are read for two and a half seconds before the pair's results join them.
	show(results, 11.8);
	// The trade-off: the cap the premium sets, once the three results have been read.
	show(head("c2"), 14.15);
	show(one("r-cap"), 14.15);

	// ——— put: the put sold against cash set aside ———
	tl.addLabel("put", 17.7);
	hide([head("c"), head("c2"), ...callRows, ...results, one("r-cap")], 17.7);
	show(head("p"), 18.05);
	show(putRows, 18.3, "right");
	show(one("p-net"), 20.3);

	// ——— payoff: the put's line falls all the way to $0; then the hero ———
	tl.addLabel("payoff", 24.2);
	d.swap(head("p"), head("h"), 24.2);
	hide([one("legs-tag"), ...putRows, one("p-net")], 24.2);
	d.rise(24.4);
	show(axes, 24.7);
	// The scaffold has settled by 25.2; the line draws a full second later, right to left.
	d.trace(one<SVGPathElement>("l-put"), 26.2, {
		tip: one("pen"),
		duration: 1.3,
		ease: "power1.inOut",
	});
	show(head("h2"), 27.65);
	show(one("hero-tag"), 27.65);
	word(one("hero"), 27.65);
	d.lock(lock, 28.2, { around: one("hero"), pad: 8 });
	tl.addLabel("hero-lock", 28.2);
	// After the hero's 1.5-second stand: the cash it ties up, then the most it can keep.
	show(one("size-line"), 30.2);
	fade(one("g-ceil"), 31.3);

	// ——— assign: any trading day, and the one way to rule it out ———
	tl.addLabel("assign", 33.9);
	hide([head("h"), head("h2"), ...hero, lock, one("g-ceil")], 33.9);
	d.sink(33.9);
	show(head("a"), 34.25);
	show(one("cal"), 34.5);
	show(one("cal-span"), 34.5);
	show(one("cal-note"), 35.5);
	show(one("cal-more"), 36.3);
	// Bought back, the option has no day left on which it can be assigned.
	show(head("a2"), 36.95);
	tl.to(one("cal-cells"), { opacity: 0.3, duration: 0.4 }, 37.45);

	// ——— claim ———
	tl.addLabel("claim", 40.5);
	hide([head("a"), head("a2"), one("cal"), ...notes], 40.5);
	word(one("z-big"), 40.8);
	show(one("z-sub"), 41.2);

	// ——— next ———
	tl.addLabel("next", 45.0);
	hide(kids("claim"), 45.0);
	d.close(45.0);
	return tl;
}

export const sellingCoveredOptionsFilm: Film = {
	id: "selling-covered-options",
	label: [
		`Selling an option you can cover, as a short film: on Mon Sep 16, with ALFA at $100, you own ${SHARES} shares bought at ${usd(STOCK_COST, 0)} and sell one ${EXPIRY[0]} ${CALL.strike} call against them at its ${usd(CALL_BID)} bid, keeping ${whole(CALL_PREMIUM)}; if the call is assigned the shares are sold at $${CALL.strike}; the pair makes ${signedWhole(COVERED_BEST)} at best, breaks even at ${usd(COVERED_EVEN)} and loses ${signedWhole(COVERED_WORST)} if ALFA falls to $0, and above ${usd(COVERED_CAP)} the shares alone make more; or you sell one ${EXPIRY[0]} ${PUT.strike} put at its ${usd(PUT_BID)} bid with ${whole(CASH)} in cash set aside, and if it is assigned you buy ${SHARES} shares at $${PUT.strike}, a net ${usd(NET_PRICE)} a share; the put shot shows ${percent(CASH_SHARE, 0)} of a ${whole(ACCOUNT)} example account beside the cash set aside; the put's profit on ${EXPIRY[0]} is ${signedWhole(SECURED_BEST)} at most and falls to ${signedWhole(SECURED_WORST)} if ALFA falls to $0, while the cash it ties up is ${whole(CASH)} of ${whole(ACCOUNT)}; both can be assigned on any of the ${TRADING_DAYS.length} trading days, ${monthDay(TRADING_DAYS[0])[0]} to ${monthDay(TRADING_DAYS[TRADING_DAYS.length - 1])[0]}, likelier in the money with little time value left, and buying the option back prevents it`,
		`卖出有保障的期权短片：9月16日周一，ALFA 为 $100，你持有以 ${usd(STOCK_COST, 0)} 买入的 ${SHARES} 股，并按买价 ${usd(CALL_BID)} 对着它们卖出一张 ${EXPIRY[1]} ${CALL.strike} 看涨，留下 ${whole(CALL_PREMIUM)}；如果看涨被指派，股票以 $${CALL.strike} 卖出；这一组最多赚 ${signedWhole(COVERED_BEST)}，盈亏平衡点 ${usd(COVERED_EVEN)}，ALFA 跌到 $0 时亏 ${signedWhole(COVERED_WORST)}，而高于 ${usd(COVERED_CAP)} 时只持股赚得更多；或者，按买价 ${usd(PUT_BID)} 卖出一张 ${EXPIRY[1]} ${PUT.strike} 看跌，并预留 ${whole(CASH)} 现金，如果被指派就以 $${PUT.strike} 买入 ${SHARES} 股，每股净价 ${usd(NET_PRICE)}；看跌镜头在现金旁显示 ${whole(ACCOUNT)} 示例账户的 ${percent(CASH_SHARE, 0)}；这张看跌在 ${EXPIRY[1]} 最多赚 ${signedWhole(SECURED_BEST)}，ALFA 跌到 $0 时亏到 ${signedWhole(SECURED_WORST)}，而它占用的现金是 ${whole(CASH)}，占 ${whole(ACCOUNT)} 账户；两者都可能在 ${monthDay(TRADING_DAYS[0])[1]}至${monthDay(TRADING_DAYS[TRADING_DAYS.length - 1])[1]}，共 ${TRADING_DAYS.length} 个交易日中的任何一天被指派，处于实值且时间价值所剩无几时更可能，只有把期权买回平仓才能确保不被指派`,
	],
	stage: "dark",
	shots: [
		{
			id: "open",
			label: ["Selling an option you can cover", "卖出有保障的期权"],
		},
		{ id: "question", label: ["The question", "问题"] },
		{ id: "call", label: ["A covered call", "备兑看涨"] },
		{ id: "put", label: ["A cash-secured put", "现金担保看跌"] },
		{ id: "payoff", label: ["The worst case", "最坏情况"] },
		{ id: "assign", label: ["Assignment", "指派"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
