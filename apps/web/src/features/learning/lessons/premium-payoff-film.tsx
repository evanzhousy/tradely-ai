import { gsap } from "gsap";
import { useId } from "react";
import {
	ALFA,
	type Contract,
	type Copy,
	optionQuote,
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
	Hatch,
	Lines,
	lineCount,
	PenTip,
	signTone,
	TitleCard,
	toneClass,
	toneColor,
	Word,
} from "../walkthrough/film-kit";
import {
	BUYER_EXAMPLE_SPOT,
	breakEven,
	buys,
	payoffAt,
	priceParts,
	STRIKES,
	writes,
} from "./premium-payoff-model";

/*
 * Premium, payoff and profit, as a film. It opens on the Oct 18 95 call at $7.30 and asks
 * what it is worth on Oct 18 if ALFA hasn't moved. The $7.30 flies onto its bar: $5.00 of
 * intrinsic value and $2.30 of time value, and at expiry the time value is gone: $5.00.
 * Then the buyer of the 100 call: its value line drops by the $420 premium into the profit
 * line, and the marker walks from $102 (−$220) to the break-even of $104.20, where the
 * meter holds $420 and $0, then on to $110 (+$580) as the profit fills in green. Last,
 * the writer of the 95 put keeps $205 above $95 and loses below $92.95, with separate
 * readings for the credit, break-even and loss.
 *
 *   open      0–4        "Premium, payoff and profit"
 *   question  4–8.8      the 95 call at $7.30: worth what on Oct 18?
 *   parts     8.8–18.4   $7.30 lands on the 95 bar: $5.00 + $2.30; at expiry, $5.00
 *   profit    18.4–32.65 value drops into profit; $102; hero: break-even $104.20; $110
 *   writer    32.65–40.6 the 95 put written: +$205, break-even $92.95, and a loss at $90
 *   claim     40.6–44.95 in the money isn't the same as profitable
 *   next      44.95–47.45 Next: put-call parity
 */

const END = 47.45;
const X = [80, 120] as const;
const Y = [-2_000, 2_000] as const;
const CALL = buys.c100;
const PAID = optionQuote(CALL).ask;
const BE = breakEven(CALL, PAID);
const PUT = writes.p95;
const GOT = optionQuote(PUT).bid;
const PUT_BE = PUT.strike - GOT / 100;
const MAX_PRICE = Math.max(
	...STRIKES.map((k) => priceParts(k, "call", "now").price),
);
const spots = Array.from(
	{ length: (X[1] - X[0]) * 2 + 1 },
	(_, i) => X[0] + i / 2,
);
/** Dollars for one contract at expiry. */
const value = (contract: Contract, spot: number) => payoffAt(contract, spot);
const buyerProfit = (spot: number) => value(CALL, spot) - PAID;
const writerProfit = (spot: number) => GOT - value(PUT, spot);
/** The call the question asks about, and where it stands among the five. */
const ASKED = 95;
const ASKED_AT = STRIKES.indexOf(ASKED);

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room, type: T } = frame;
	const left = Math.max(margin, narrow ? 46 : 0);
	const right = width * 0.965;
	/** The meter's tags and figures sit under the headline (two lines of it, at most). */
	// A phone's headline lines sit closer together: its meter starts a little lower, so a
	// second line rising into place never touches the meter's tags.
	const meterY = frame.headY + T.head * (narrow ? 3.0 : 2.6);
	// The meter's figures stay below the headline's size: it is evidence, not the claim.
	const meterNum = meterY + T.head * 1.3;
	// The chart starts below the meter and the chart's caption above it.
	const top = narrow
		? H * 0.4
		: Math.max(H * 0.3, meterNum + T.small * 2.2 + 16);
	const bottom = H * 0.84;
	const x = (spot: number) =>
		left + ((spot - X[0]) / (X[1] - X[0])) * (right - left);
	const y = (dollars: number) =>
		bottom - ((dollars - Y[0]) / (Y[1] - Y[0])) * (bottom - top);
	const slot = room / STRIKES.length;
	// On the wide frame a headline may take two lines: the bars' caption starts below them.
	const barTop = H * (narrow ? 0.32 : 0.36);
	const barBottom = H * (narrow ? 0.72 : 0.76);
	return {
		...frame,
		left,
		right,
		top,
		meterY,
		meterNum,
		bottom,
		x,
		y,
		path: (f: (spot: number) => number) =>
			spots
				.map(
					(spot, i) =>
						`${i ? "L" : "M"}${x(spot).toFixed(1)} ${y(f(spot)).toFixed(1)}`,
				)
				.join(""),
		slot,
		barX: (i: number) => margin + slot * (i + 0.5),
		// Wide enough on a phone to carry the asked call's parts on the bar itself.
		barW: narrow ? slot * 0.64 : Math.min(slot * 0.5, 60),
		barBottom,
		/** A price in cents per share as a bar height. */
		barH: (cents: number) => (cents / MAX_PRICE) * (barBottom - barTop),
	};
}

const copy = {
	title: ["Premium, payoff and profit", "权利金、到期价值与盈亏"],
	titleSub: ["buyer and writer", "交易的两方"],
	qTag: ["Oct 18 95 call · ALFA $100", "10月18日 95 看涨 · ALFA $100"],
	qLine: ["ALFA unchanged. Expiry value?", "若ALFA不变，到期价值？"],
	partsHead: [
		"$5 intrinsic + $2.30 time value.",
		"$5 内在价值 + $2.30 时间价值。",
	],
	partsHeadShort: ["Its parts: $5.00 + $2.30.", "拆开：$5.00 + $2.30。"],
	expiryHead: ["At expiry, the time value is gone.", "到期时，时间价值归零。"],
	expiryHeadShort: ["At expiry: time value gone.", "到期：时间价值归零。"],
	intrinsic: ["intrinsic", "内在价值"],
	time: ["time value", "时间价值"],
	calls: ["Oct 18 calls · ALFA $100", "10月18日 看涨 · ALFA $100"],
	profitHead: ["Buy the 100 call.", "买入 100 看涨。"],
	profitHeadShort: ["Buy the 100 call.", "买入 100 看涨。"],
	beHead: ["Profit doesn't start at $100.", "盈利不是从 $100 开始。"],
	beHeadShort: ["Profit after $100?", "过了 $100 就盈利？"],
	beHead2: [`Break-even is $${BE.toFixed(2)}.`, `盈亏平衡 $${BE.toFixed(2)}。`],
	beHead2Short: [
		`Break-even $${BE.toFixed(2)}.`,
		`盈亏平衡 $${BE.toFixed(2)}。`,
	],
	axis: ["one contract at Oct 18", "一张合约，10月18日"],
	valueLine: ["value", "价值"],
	profitLine: ["profit", "盈亏"],
	premiumDrop: [
		`${usd(-PAID)} × ${ALFA.multiplier} = `,
		`${usd(-PAID)} × ${ALFA.multiplier} = `,
	],
	exampleSpot: [
		`ALFA ${usd(BUYER_EXAMPLE_SPOT * 100, 0)}`,
		`ALFA ${usd(BUYER_EXAMPLE_SPOT * 100, 0)}`,
	],
	itmLoss: ["in the money, still losing", "实值，仍在亏"],
	itmLossShort: ["ITM, losing", "实值仍亏"],
	writerHead: ["Now write the 95 put.", "换成卖出 95 看跌。"],
	writerHeadShort: ["Now write the 95 put.", "换成卖出 95 看跌。"],
	putWriter: [
		`95 put, written: ${signedUsd(GOT * 100, 0)}`,
		`95 看跌，卖出：${signedUsd(GOT * 100, 0)}`,
	],
	profitFrom: ["profit from here →", "从这里开始盈利 →"],
	profitFromShort: ["profit →", "盈利 →"],
	claimBig: ["In the money can still lose.", "实值仍可能亏损。"],
	claimSub: ["Writers gain at most the premium.", "卖方最多赚取权利金。"],
	nextBig: ["Next: put-call parity", "下一课：看涨看跌平价"],
	nextSub: ["how calls, puts and shares line up", "看涨、看跌与股票如何对齐"],
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
	const id = useId().replace(/:/g, "");
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
	const beX = L.x(BE);
	return (
		<>
			<Backdrop frame={L} />
			<defs>
				<Hatch id={`hatch-${id}`} />
				<clipPath id={`plot-${id}`}>
					<rect
						x={L.left}
						y={L.top - 4}
						width={L.right - L.left}
						height={L.bottom - L.top + 8}
					/>
				</clipPath>
			</defs>

			{/* Five calls: intrinsic and time value. */}
			<g data-f="bars">
				<text
					x={margin}
					y={L.barBottom - L.barH(MAX_PRICE) - text * 1.4 - T.small * 1.4}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.calls).toUpperCase()}
				</text>
				<path
					d={`M${margin} ${L.barBottom}H${margin + room}`}
					className="wt-axis"
				/>
				{STRIKES.map((strike, i) => {
					const now = priceParts(strike, "call", "now");
					const x = L.barX(i) - L.barW / 2;
					return (
						<g key={strike}>
							<rect
								data-f={`in-${strike}`}
								x={x}
								y={L.barBottom - L.barH(now.intrinsic)}
								width={L.barW}
								height={L.barH(now.intrinsic)}
								rx={2}
								className="wt-film-bar"
								data-tone="total"
							/>
							<rect
								data-f={`tv-${strike}`}
								x={x}
								y={L.barBottom - L.barH(now.price)}
								width={L.barW}
								height={L.barH(now.time)}
								rx={2}
								className="wt-film-bar"
								data-tone="model"
							/>
							<text
								data-f={`p-${strike}`}
								x={L.barX(i)}
								y={L.barBottom - L.barH(now.price) - 8}
								textAnchor="middle"
								className="wt-film-num"
								style={{ fontSize: text }}
							>
								{usd(now.price)}
							</text>
							<text
								data-f={`e-${strike}`}
								x={L.barX(i)}
								y={L.barBottom - L.barH(now.intrinsic) - 8}
								textAnchor="middle"
								className={`wt-film-num ${now.intrinsic ? toneClass.focus : "wt-film-dim"}`}
								style={{ fontSize: text }}
							>
								{now.intrinsic ? usd(now.intrinsic) : "$0"}
							</text>
							<text
								x={L.barX(i)}
								y={L.barBottom + text * 1.5}
								textAnchor="middle"
								className="wt-film-num wt-film-dim"
								style={{ fontSize: text }}
							>
								{strike}
							</text>
						</g>
					);
				})}
				{/* The asked call's two parts, named on its bar while its headline is up. */}
				{(
					[
						[
							"part-in",
							usd(priceParts(ASKED, "call", "now").intrinsic),
							L.barBottom -
								L.barH(priceParts(ASKED, "call", "now").intrinsic) / 2,
						],
						[
							"part-tv",
							// A phone's bar has room for the figure alone; the headline has the plus.
							`${narrow ? "" : "+"}${usd(priceParts(ASKED, "call", "now").time)}`,
							L.barBottom -
								L.barH(priceParts(ASKED, "call", "now").intrinsic) -
								L.barH(priceParts(ASKED, "call", "now").time) / 2,
						],
					] as const
				).map(([name, label, y]) => (
					<text
						key={name}
						data-f={name}
						// Card-coloured type on the solid part, ink on the soft time value.
						x={L.barX(ASKED_AT)}
						y={y + T.small * 0.36}
						textAnchor="middle"
						className={`wt-film-num ${name === "part-in" ? "wt-on-solid" : ""}`}
						style={{ fontSize: T.small }}
					>
						{label}
					</text>
				))}
				{/* Fitted round the 95 call's bar and its price when it locks. */}
				<Brackets name="lock-asked" />
				<g data-f="legend">
					{(
						[
							["total", copy.intrinsic],
							["model", copy.time],
						] as const
					).map(([tone, label], i) => (
						<g key={tone}>
							<rect
								x={margin + i * (narrow ? 110 : 170)}
								y={L.barBottom + text * 3}
								width={12}
								height={12}
								rx={3}
								className="wt-film-bar"
								data-tone={tone}
							/>
							<text
								x={margin + i * (narrow ? 110 : 170) + 18}
								y={L.barBottom + text * 3 + 10}
								className="wt-film-type wt-film-dim"
								style={{ fontSize: text }}
							>
								{t(label)}
							</text>
						</g>
					))}
				</g>
			</g>

			{/* The payoff chart, for the buyer and then the writer. */}
			<g data-f="depth">
				<g data-f="world">
					<g data-f="chart">
						{/* Under the axis, away from the meter above the chart. */}
						<text
							x={L.left}
							y={L.bottom + 16 + T.small * 1.5}
							className="wt-small"
						>
							{t(copy.axis)}
						</text>
						{[-1000, 0, 1000].map((v) => (
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
										: narrow
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
									v === X[1] ? "end" : v === X[0] ? "start" : "middle"
								}
								className="wt-small"
							>
								{`$${v}`}
							</text>
						))}
						<rect
							data-f="itm-band"
							x={L.x(CALL.strike)}
							y={L.top}
							width={beX - L.x(CALL.strike)}
							height={L.bottom - L.top}
							className="wt-band-loss"
						/>
						<text
							data-f="itm-label"
							// Above the band, centred on it: the band is narrower than the note.
							x={(L.x(CALL.strike) + beX) / 2}
							y={L.top - 6}
							textAnchor="middle"
							className="wt-small wt-halo wt-loss"
						>
							{t(narrow ? copy.itmLossShort : copy.itmLoss)}
						</text>
						<g clipPath={`url(#plot-${id})`}>
							<path
								data-f="value-line"
								d={L.path((s) => value(CALL, s))}
								className="wt-line-reference"
							/>
							{/* Drawn as the value line, then moved down by the premium. */}
							<path
								data-f="profit-line"
								d={L.path((s) => value(CALL, s))}
								className="wt-line-position"
							/>
							{/* The writer's curve comes directly from its contract's payoff. */}
							<path
								data-f="put-line"
								d={L.path(writerProfit)}
								className="wt-line-position"
								style={{ strokeWidth: 2.5 }}
							/>
						</g>
						{/* The profit area, filled from break-even. */}
						<clipPath id={`win-${id}`}>
							<rect
								data-f="win-clip"
								x={beX}
								y={L.top}
								width={0}
								height={L.bottom - L.top}
							/>
						</clipPath>
						<path
							data-f="win-area"
							d={`M${beX} ${L.y(0)}${spots
								.filter((s) => s >= BE)
								.map(
									(s) =>
										`L${L.x(s).toFixed(1)} ${L.y(buyerProfit(s)).toFixed(1)}`,
								)
								.join("")}L${L.x(X[1])} ${L.y(0)}Z`}
							className="wt-band-gain"
							clipPath={`url(#win-${id})`}
						/>
						{/* The profit line, green where the marker has passed break-even. */}
						<path
							data-f="win-line"
							d={L.path(buyerProfit)}
							className="wt-line-position"
							style={{ stroke: "var(--diagram-gain)" }}
							clipPath={`url(#win-${id})`}
						/>
						{/* The premium, measured on the flat part where nothing else is drawn. */}
						<g data-f="drop">
							<path
								d={`M${L.x(90)} ${L.y(0) + 4}V${L.y(-PAID) - 4}`}
								className="wt-film-riser"
							/>
							<text
								// Above the drop, so the moving line never crosses it.
								x={L.x(90)}
								y={L.y(0) - 9}
								textAnchor="middle"
								className="wt-small wt-halo"
								style={{ fill: "var(--tone-ink)" }}
							>
								{t(copy.premiumDrop)}
								<tspan className={toneClass.down}>
									{usd(-PAID * ALFA.multiplier, 0)}
								</tspan>
							</text>
						</g>
						<PenTip name="tip-short" color={toneColor("focus")} />
						{/* Line names at the lines' far ends: value above its line, profit below. */}
						<text
							data-f="value-tag"
							x={L.x(117)}
							y={L.y(value(CALL, 117)) - 9}
							textAnchor="end"
							className="wt-small wt-halo"
						>
							{t(copy.valueLine)}
						</text>
						<text
							data-f="profit-tag"
							// On a phone the rising part is steep: name the line under its flat part instead.
							// Between the value and profit lines at the right end, off the green fill.
							x={narrow ? L.x(81) : L.x(119)}
							y={
								narrow
									? L.y(-PAID) + 16
									: (L.y(value(CALL, 119)) + L.y(buyerProfit(119))) / 2 + 4
							}
							textAnchor={narrow ? "start" : "end"}
							className="wt-small wt-halo wt-accent"
						>
							{t(copy.profitLine)}
						</text>
						<text
							data-f="put-tag"
							// Inside the right edge on a phone.
							x={narrow ? L.right - 8 : L.x(108)}
							y={L.y(GOT) - 10}
							textAnchor={narrow ? "end" : "start"}
							className={`wt-small wt-halo ${toneClass.focus}`}
						>
							{t(copy.putWriter).slice(0, -signedUsd(GOT * 100, 0).length)}
							<tspan className={toneClass.up}>{signedUsd(GOT * 100, 0)}</tspan>
						</text>
						<path
							data-f="be"
							d={`M${beX} ${L.top}V${L.bottom}`}
							className="wt-bracket"
							strokeDasharray="4 3"
						/>
						<text
							data-f="be-label"
							// The hero's figure, 1.3 times the meter's, the loudest on screen when the
							// brackets lock. On a phone the top is the value line's: it sits under the
							// axis, right of the line and below the brackets, where nothing is drawn.
							x={beX + 8}
							y={
								narrow
									? L.y(0) + 30 + T.head * 1.3 * 0.8
									: L.top + T.head * 1.3 * 0.9
							}
							className="wt-film-num wt-halo wt-accent"
							style={{ fontSize: T.head * 1.3 }}
						>
							{`$${BE.toFixed(2)}`}
						</text>
						{/* Past break-even, the profit starts: below the axis, right of the line. */}
						<text
							data-f="profit-from"
							// Clear of the break-even brackets.
							x={beX + 28}
							y={L.y(0) + 18}
							className="wt-small wt-halo"
							style={{ fill: "var(--diagram-gain)" }}
						>
							{t(narrow ? copy.profitFromShort : copy.profitFrom)}
						</text>
						{/* Down to just under the axis, where the writer's line crosses it. */}
						<path
							data-f="put-be"
							d={`M${L.x(PUT_BE)} ${L.top}V${L.y(0) + 8}`}
							className="wt-bracket"
							strokeDasharray="4 3"
						/>
						<text
							data-f="put-be-label"
							// Between the gridlines, not on one.
							x={L.x(PUT_BE) - 6}
							y={L.y(650)}
							textAnchor="end"
							className={`wt-halo wt-marker-label ${toneClass.focus}`}
						>
							{`$${PUT_BE.toFixed(2)}`}
						</text>
						<Brackets
							name="lock-be"
							x={beX - 22}
							y={L.y(0) - 22}
							width={44}
							height={44}
							arm={11}
							glow
						/>
						<circle
							data-f="marker"
							cx={L.x(BUYER_EXAMPLE_SPOT)}
							cy={L.y(buyerProfit(BUYER_EXAMPLE_SPOT))}
							r={6}
							className="wt-chip"
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
						<circle
							data-f="put-marker"
							cx={L.x(90)}
							cy={L.y(writerProfit(90))}
							r={6}
							className="wt-chip"
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
						<text
							data-f="put-loss"
							// Below and right of the marker, under the rising line and clear of the axis
							// just above it.
							x={L.x(90) + 10}
							y={L.y(writerProfit(90)) + 16}
							className="wt-halo wt-loss wt-marker-label"
						>
							{signedUsd(writerProfit(90) * 100, 0)}
						</text>
					</g>
				</g>
			</g>
			{/* The meter: value and profit at the marker, under the headline. */}
			<g data-f="meter">
				{(
					[
						[
							"m-value",
							copy.valueLine,
							usd(value(CALL, BUYER_EXAMPLE_SPOT) * 100, 0),
							"wt-film-num wt-film-dim",
							0.8,
						],
						[
							"m-profit",
							copy.profitLine,
							signedUsd(buyerProfit(BUYER_EXAMPLE_SPOT) * 100, 0),
							"wt-film-num wt-film-loss",
							1,
						],
					] as const
				).map(([name, tag, start, className, scale], i) => (
					<g key={name}>
						<Word
							name={`${name}-tag`}
							x={margin + i * (narrow ? 120 : 220)}
							y={L.meterY}
							size={T.small}
							anchor="start"
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={name}
							x={margin + i * (narrow ? 120 : 220)}
							y={L.meterNum}
							size={T.head * scale}
							anchor="start"
							className={className}
						>
							{start}
						</Word>
					</g>
				))}
				<Word
					name="m-spot"
					x={margin}
					y={L.meterNum + T.small * 1.7}
					size={T.small}
					anchor="start"
					className="wt-film-tag"
				>
					{t(copy.exampleSpot)}
				</Word>
			</g>

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
				<Word
					name="q-big"
					x={W / 2}
					y={H * 0.32 + T.big * 1.05}
					size={T.big}
					className="wt-film-num"
				>
					{usd(priceParts(95, "call", "now").price)}
				</Word>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					// Clear the large opening price and keep the scaffold below the question.
					y={H * (narrow ? 0.55 : 0.64)}
					size={T.head}
					maxWidth={room}
					className="wt-film-type"
				/>
			</g>
			{headline("s-head", copy.partsHead, copy.partsHeadShort)}
			{headline("x-head", copy.expiryHead, copy.expiryHeadShort)}
			{headline("p-head", copy.profitHead, copy.profitHeadShort)}
			{headline("b-head", copy.beHead, copy.beHeadShort)}
			{/* The headline's answer, a line under it, revealed as the brackets lock. */}
			<Lines
				name="b2-head"
				text={t(narrow ? copy.beHead2Short : copy.beHead2)}
				x={margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.beHeadShort : copy.beHead),
						narrow ? room : room * 0.74,
						T.head,
					) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			{headline("w-head", copy.writerHead, copy.writerHeadShort)}

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
	const { tl, one, kids, show, hide, pop, sink } = d;
	// Keep the scaffold at its final geometry even while it is hidden.
	gsap.set(one("depth"), { scale: 1 });
	const flat = (name: string) =>
		kids(name).flatMap((el) =>
			el.tagName === "g" && !el.hasAttribute("data-f")
				? [...el.children]
				: [el],
		);
	/** A figure lands slightly large and settles, without overshoot: it is data. */
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const marker = one("marker");
	const meterValue = one<SVGTextElement>("m-value");
	const meterProfit = one<SVGTextElement>("m-profit");
	const meterSpot = one<SVGTextElement>("m-spot");
	const whole = (v: number) => usd(Math.round(v) * 100, 0);
	const signed = (v: number) =>
		Math.round(v) === 0 ? "$0" : signedUsd(Math.round(v) * 100, 0);
	const heads = [
		"s-head",
		"x-head",
		"p-head",
		"b-head",
		"w-head",
		"b2-head",
	].map((name) => one(name));
	const bars = (k: number) => [one(`in-${k}`), one(`tv-${k}`)];
	const asked = one<SVGTextElement>(`p-${ASKED}`);
	const parts = [one("part-in"), one("part-tv")];
	const winClip = one("win-clip");
	const beX = L.x(BE);
	const putLine = one("put-line");
	const putBe = one("put-be");

	d.hidden([
		...flat("q"),
		...heads,
		...flat("bars").filter((el) => el.tagName !== "path"),
		...STRIKES.flatMap((k) => [...bars(k), one(`p-${k}`), one(`e-${k}`)]),
		one("legend"),
		...parts,
		...[
			"lock-asked",
			"itm-band",
			"itm-label",
			"value-line",
			"profit-line",
			"put-line",
			"value-tag",
			"profit-tag",
			"put-tag",
			"be",
			"be-label",
			"profit-from",
			"put-be",
			"put-be-label",
			"marker",
			"lock-be",
			"put-marker",
			"put-loss",
			"win-area",
			"win-line",
			"drop",
			"tip-short",
		].map((name) => one(name)),
		...kids("meter"),
		...kids("claim"),
	]);
	tl.set(one("bars"), { opacity: 0 }, 0);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: the 95 call at $7.30 ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.4);
	word(one("q-big"), 4.6);
	show(one("q-line"), 5.2);
	// The question and scaffold settle together at 5.70, with no data until 9.20.
	tl.to(one("bars"), { opacity: 1, duration: 0.5 }, 5.2);
	show(
		flat("bars").filter(
			(el) => el.tagName === "text" && !el.hasAttribute("data-f"),
		),
		5.2,
	);

	// ——— parts: the $7.30 lands on its bar, then the time value goes ———
	tl.addLabel("parts", 8.8);
	hide([one("q-tag"), one("q-line")], 8.8);
	// One histogram, one entrance: reveal its settled parts together, without a stagger
	// or a second growth of the time-value caps. Its headline and parts keep their times.
	tl.fromTo(
		STRIKES.flatMap(bars),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		9.2,
	);
	// Keep the earliest price's reading; the other comparisons gain time together.
	show(
		STRIKES.filter((k) => k !== ASKED).map((k) => one(`p-${k}`)),
		9.8,
	);
	// Carry only after the scaffold's quiet interval, over the same accepted path.
	d.carry(one<SVGTextElement>("q-big"), asked, 9.2, {
		duration: 1.2,
		arc: "y",
	});
	show(heads[0], 10.5);
	show(one("legend"), 10.8);
	// Read the settled parts first, then let the other contracts step back.
	tl.to(
		STRIKES.filter((k) => k !== ASKED).flatMap((k) => [
			...bars(k),
			one(`p-${k}`),
		]),
		{ opacity: 0.3, duration: 0.4 },
		12.3,
	);
	// With the headline that names them.
	show(parts, 10.5);
	// At expiry: time value is gone, and the 95 call answers the question.
	d.swap(heads[0], heads[1], 14.5);
	hide(parts, 14.5);
	tl.to(
		STRIKES.flatMap((k) => [...bars(k), one(`p-${k}`)]),
		{ opacity: 1, duration: 0.3 },
		14.6,
	);
	// One eased state drives every shrinking bar and its readout, including the other
	// contracts' prices while they fade away. Scrubbing back restores the same state.
	const expiry = { progress: 0 };
	const expiryBars = STRIKES.map((k) => ({
		now: priceParts(k, "call", "now"),
		time: one(`tv-${k}`),
		price: one<SVGTextElement>(`p-${k}`),
	}));
	tl.fromTo(
		expiry,
		{ progress: 0 },
		{
			progress: 1,
			duration: 1,
			ease: "power2.inOut",
			immediateRender: false,
			onUpdate: () => {
				for (const { now, time, price } of expiryBars) {
					const remaining = now.time * (1 - expiry.progress);
					const total = now.intrinsic + remaining;
					const top = L.barBottom - L.barH(total);
					gsap.set(time, { attr: { y: top, height: L.barH(remaining) } });
					gsap.set(price, { attr: { y: top - 8 } });
					price.textContent = usd(Math.round(total));
				}
			},
		},
		14.9,
	);
	STRIKES.forEach((k) => {
		if (k === ASKED) {
			tl.set(asked, { attr: { class: "wt-film-num wt-film-accent" } }, 15.9);
		} else {
			hide(one(`p-${k}`), 15.1, 0.3);
			// Reveal only at expiry; keep the existing 16.30 settlement and following rest.
			show(one(`e-${k}`), 15.9, "below", 0.4);
		}
	});
	// Fitted to the bar and its price where they end up: the price has moved down by then.
	{
		const now = priceParts(ASKED, "call", "now");
		const label = asked.getBBox();
		const drop = L.barH(now.price) - L.barH(now.intrinsic);
		const bar = one<SVGGraphicsElement>(`in-${ASKED}`);
		const x = Math.min(label.x, L.barX(ASKED_AT) - L.barW / 2);
		const right = Math.max(
			label.x + label.width,
			L.barX(ASKED_AT) + L.barW / 2,
		);
		d.lock(one<SVGGraphicsElement>("lock-asked"), 15.9, {
			around: [
				{
					getBBox: () => ({
						x,
						y: label.y + drop,
						width: right - x,
						height: 1,
					}),
				},
				bar,
			] as unknown as Element[],
		});
	}

	// ——— profit: the buyer of the 100 call ———
	tl.addLabel("profit", 18.4);
	hide(
		[
			heads[1],
			...flat("bars"),
			...STRIKES.flatMap((k) => [...bars(k), one(`e-${k}`)]),
			asked,
			one("lock-asked"),
			one("legend"),
		],
		18.4,
	);
	show(heads[2], 18.75);
	// No camera or pen: the fixed scaffold settles at 19.00, before the value line.
	tl.to(one("depth"), { opacity: 1, duration: 0.3 }, 18.7);
	d.trace(one<SVGPathElement>("value-line"), 20.15, { duration: 0.5 });
	show(one("value-tag"), 20.1);
	// The tag settles at 20.60 and the line at 20.65; keep the same full second of rest.
	// Keep the premium measure as context instead of spending another exit here.
	show(one("drop"), 21.65);
	tl.set(one("profit-line"), { opacity: 1 }, 21.65);
	d.morph(one("profit-line"), L.path(buyerProfit), 21.65, 0.9);
	tl.to(one("value-line"), { opacity: 0.45, duration: 0.4 }, 21.85);
	// The profit construction settles at 22.55. After 1.00 s, reveal one settled
	// counterexample in place: its stock price, marker, meter and loss region agree.
	// Record the resting class on the timeline so a reverse seek restores the accent.
	tl.set(marker, { attr: { class: "wt-chip" } }, 23.55);
	tl.fromTo(
		[
			marker,
			...kids("meter"),
			one("profit-tag"),
			one("itm-band"),
			one("itm-label"),
			one("be"),
		],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		23.55,
	);

	// Break-even, the hero: the marker walks to it, the meter holds $420 and $0, brackets
	// lock and $104.20 lands large; held three seconds, then past it the profit line turns
	// green with the area under it.
	// Ask the break-even question with the walk, after the counterexample has rested.
	d.swap(heads[2], heads[3], 26.15);
	// The example settles at 24.05 and keeps the existing 1.75 s of quiet. Keep its
	// stock-price context tied to the same value that drives the marker and meter.
	const place = (spot: number) => {
		const profit = Math.round(buyerProfit(spot));
		gsap.set(marker, {
			attr: {
				cx: L.x(spot),
				cy: L.y(buyerProfit(spot)),
				class: profit > 0 ? "wt-chip wt-film-gain" : "wt-chip",
			},
		});
		gsap.set(winClip, { attr: { width: Math.max(0, L.x(spot) - beX) } });
		meterValue.textContent = whole(value(CALL, spot));
		meterProfit.textContent = signed(profit);
		meterSpot.textContent = pick(copy.exampleSpot, context.locale).replace(
			usd(BUYER_EXAMPLE_SPOT * 100, 0),
			usd(spot * 100, 2),
		);
		const profitTone = signTone(profit);
		meterProfit.setAttribute(
			"class",
			`wt-film-num ${profitTone ? toneClass[profitTone] : "wt-film-dim"}`,
		);
	};
	const walk = (from: number, to: number, at: number, duration: number) => {
		const spot = { at: from };
		// Not rendered up front: the meter must read $102 until the walk begins.
		tl.fromTo(
			spot,
			{ at: from },
			{
				at: to,
				duration,
				ease: "power2.inOut",
				immediateRender: false,
				onUpdate: () => place(spot.at),
			},
			at,
		);
	};
	tl.set([one("win-area"), one("win-line")], { opacity: 1 }, 26.15);
	walk(BUYER_EXAMPLE_SPOT, BE, 26.15, 1.6);
	d.lock(one<SVGGraphicsElement>("lock-be"), 27.75);
	tl.addLabel("hero-lock", 27.75);
	show(heads[5], 27.75);
	word(one("be-label"), 27.85);
	// The brackets settle at 28.20 and stand for 1.85 s before this release. Clear them
	// completely before the marker-driven green reveal begins at 30.45.
	tl.to(one("lock-be"), { opacity: 0, duration: 0.35 }, 30.05);
	walk(BE, 110, 30.45, 1.2);
	tl.to(one("itm-label"), { opacity: 0.55, duration: 0.3 }, 30.65);
	// On a phone the green fill says it: no room for the note by the brackets.
	if (!L.narrow) show(one("profit-from"), 30.85);
	// The marker and green construction settle together at 31.65: one full second of
	// quiet before the writer arrives, with no second expansion beyond the marker.

	// ——— writer: the premium is the best case, and the loss below break-even ———
	tl.addLabel("writer", 32.65);
	d.swap([heads[3], heads[5]], heads[4], 32.65);

	hide(
		[
			...kids("meter"),
			marker,
			one("be"),
			one("be-label"),
			one("itm-band"),
			one("itm-label"),
			one("profit-from"),
			one("value-tag"),
			one("profit-tag"),
			one("win-area"),
			one("win-line"),
			one("value-line"),
			one("profit-line"),
			one("drop"),
		],
		32.65,
	);
	// Identify the new contract before its headline lands; fade in place in this lane.
	tl.fromTo(
		one("put-tag"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		32.65,
	);
	const pen = one("tip-short");
	d.trace(one<SVGPathElement>("put-line"), 33.05, { tip: pen });
	// Spend the removed call coda on three existing readings. The credit and curve
	// settle by 34.40, then break-even reads alone before the loss example arrives.
	show([putBe, one("put-be-label")], 36.4);
	pop(one("put-marker"), 38.5);
	show(one("put-loss"), 38.6, "right");
	// The complete proof settles at 39.10 and retains its accepted 1.50 s of quiet.

	// ——— claim ———
	tl.addLabel("claim", 40.6);
	hide(
		[
			heads[4],
			putLine,
			putBe,
			one("put-marker"),
			one("put-loss"),
			one("put-tag"),
			one("put-be-label"),
		],
		40.6,
	);
	sink(40.6);
	word(one("z-big"), 40.9);
	show(one("z-sub"), 41.2);

	// ——— next ———
	tl.addLabel("next", 44.95);
	hide(kids("claim"), 44.95);
	d.close(44.95);
	return tl;
}

export const premiumPayoffFilm: Film = {
	id: "premium-payoff",
	label: [
		`Premium, payoff and profit, as a short film: the Oct 18 95 call at ${usd(priceParts(95, "call", "now").price)} and what it is worth on Oct 18 if ALFA hasn't moved; five calls split into intrinsic and time value, with all the time value gone at expiry; the buyer of the 100 call, whose $200 of value at $102 is −$220 after the $420 premium, breaking even at $${BE.toFixed(2)} and keeping $580 at $110; and the writer of the 95 put, who keeps $205 above $95 and loses below $${PUT_BE.toFixed(2)}`,
		`权利金、到期价值与盈亏短片：售价 ${usd(priceParts(95, "call", "now").price)} 的 10月18日 95 看涨，若 ALFA 不动，到期值多少；五张看涨拆成内在价值与时间价值，到期时时间价值全部归零；100 看涨的买方，在 $102 时价值 $200，扣除 $420 权利金后亏 $220，在 $${BE.toFixed(2)} 盈亏平衡，在 $110 赚 $580；以及 95 看跌的义务方，$95 以上保留 $205，低于 $${PUT_BE.toFixed(2)} 开始亏损`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Premium and payoff", "权利金与到期价值"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "parts", label: ["Intrinsic and time", "内在与时间价值"] },
		{ id: "profit", label: ["The buyer", "买方"] },
		{ id: "writer", label: ["The writer", "义务方"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
