import { gsap } from "gsap";
import { useId } from "react";
import {
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
	createDirector,
	EndCard,
	filmFrame,
	Hatch,
	Lines,
	lineCount,
	TitleCard,
	Word,
} from "../walkthrough/film-kit";
import {
	breakEven,
	buys,
	payoffAt,
	priceParts,
	STRIKES,
	writes,
} from "./premium-payoff-model";

/*
 * Premium, payoff and profit, as a film. It opens on the Oct 18 95 call at $7.30 and asks
 * what it is worth on Oct 18 if ALFA hasn't moved. The price splits in two: $5.00 of
 * intrinsic value and $2.30 of time value, and at expiry the time value is gone. Then the
 * buyer of the 100 call: value at $102 is $200, but after the $420 premium that is −$220;
 * break-even is $104.20, and $110 keeps $580. Last, the writer of the 95 put keeps $205
 * above $95 and loses below $92.95; a written call has no floor at all.
 *
 *   open      0–4      "Premium, payoff and profit"
 *   question  4–9.5    the 95 call at $7.30: worth what on Oct 18?
 *   parts     9.5–20   intrinsic + time for five strikes; at expiry, time is gone
 *   profit    20–31    value and profit lines; $102: −$220; break-even $104.20; $110: +$580
 *   writer    31–40    the 95 put written for $205; break-even $92.95; cut: the claim
 *   next      40–42.5  Next: put-call parity
 */

const END = 42.5;
const X = [80, 120] as const;
const Y = [-1_500, 1_500] as const;
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
const callWriter = (spot: number) =>
	optionQuote(writes.c105).bid - value(writes.c105, spot);

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const left = Math.max(margin, narrow ? 46 : 0);
	const right = width * 0.965;
	const top = H * (narrow ? 0.4 : 0.3);
	const bottom = H * 0.84;
	const x = (spot: number) =>
		left + ((spot - X[0]) / (X[1] - X[0])) * (right - left);
	const y = (dollars: number) =>
		bottom - ((dollars - Y[0]) / (Y[1] - Y[0])) * (bottom - top);
	const slot = room / STRIKES.length;
	const barTop = H * (narrow ? 0.32 : 0.3);
	const barBottom = H * (narrow ? 0.72 : 0.76);
	return {
		...frame,
		left,
		right,
		top,
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
		barW: Math.min(slot * 0.5, 60),
		barBottom,
		/** A price in cents per share as a bar height. */
		barH: (cents: number) => (cents / MAX_PRICE) * (barBottom - barTop),
	};
}

const copy = {
	title: ["Premium, payoff and profit", "权利金、到期价值与盈亏"],
	titleSub: ["both sides of the trade", "交易的两方"],
	qTag: ["Oct 18 95 call · ALFA $100", "10月18日 95 看涨 · ALFA $100"],
	qLine: [
		"If ALFA is still $100 on Oct 18, what is it worth?",
		"如果 10月18日 ALFA 仍是 $100，它值多少？",
	],
	partsHead: [
		"Each price is intrinsic value plus time value.",
		"每个价格都是内在价值加时间价值。",
	],
	partsHeadShort: ["Intrinsic + time value.", "内在价值 + 时间价值。"],
	ninetyFive: [
		"The 95 call: $5.00 intrinsic, $2.30 time value.",
		"95 看涨：内在价值 $5.00，时间价值 $2.30。",
	],
	ninetyFiveShort: ["95 call: $5.00 + $2.30.", "95 看涨：$5.00 + $2.30。"],
	expiryHead: [
		"On Oct 18 with ALFA at $100, the time value is gone.",
		"10月18日 ALFA 仍在 $100，时间价值全部消失。",
	],
	expiryHeadShort: ["At expiry: time value gone.", "到期：时间价值归零。"],
	intrinsic: ["intrinsic", "内在价值"],
	time: ["time value", "时间价值"],
	calls: ["Oct 18 calls · ALFA $100", "10月18日 看涨 · ALFA $100"],
	profitHead: [
		"The buyer of the 100 call paid $420: value at Oct 18, then profit.",
		"100 看涨的买方付了 $420：先看到期价值，再看盈亏。",
	],
	profitHeadShort: ["Bought the 100 call for $420.", "以 $420 买入 100 看涨。"],
	atHead: [
		"At $102 the call is worth $200, and you are down $220.",
		"在 $102，看涨值 $200，而你亏 $220。",
	],
	atHeadShort: ["$102: worth $200, down $220.", "$102：值 $200，亏 $220。"],
	beHead: [
		`Break-even is $${BE.toFixed(2)}: in the money from $100, profitable only above it.`,
		`盈亏平衡点是 $${BE.toFixed(2)}：从 $100 起是实值，超过它才盈利。`,
	],
	beHeadShort: [
		`Break-even $${BE.toFixed(2)}.`,
		`盈亏平衡 $${BE.toFixed(2)}。`,
	],
	axis: ["one contract at Oct 18", "一张合约，10月18日"],
	valueLine: ["value", "价值"],
	profitLine: ["profit", "盈亏"],
	itmLoss: ["in the money, still losing", "实值，仍在亏"],
	itmLossShort: ["ITM, losing", "实值仍亏"],
	writerHead: [
		`The writer of the 95 put collects $${(GOT / 100).toFixed(2)}: $205 to keep above $95.`,
		`95 看跌的义务方收取 $${(GOT / 100).toFixed(2)}：$95 以上全部保留 $205。`,
	],
	writerHeadShort: ["Wrote the 95 put for $205.", "以 $205 卖出 95 看跌。"],
	belowHead: [
		`Below $${PUT_BE.toFixed(2)} it loses: −$295 at $90, and more each dollar lower.`,
		`低于 $${PUT_BE.toFixed(2)} 就亏：$90 时 −$295，每低 $1 再多亏。`,
	],
	belowHeadShort: [
		`Below $${PUT_BE.toFixed(2)}: a loss.`,
		`低于 $${PUT_BE.toFixed(2)}：亏损。`,
	],
	callHead: [
		"A written call has no floor at all: each $1 higher costs $100.",
		"卖出看涨则完全没有下限：每涨 $1 多亏 $100。",
	],
	callHeadShort: ["A written call: no floor.", "卖出看涨：没有下限。"],
	putWriter: ["95 put, written", "95 看跌，卖出"],
	callWriter: ["105 call, written", "105 看涨，卖出"],
	claimBig: ["In the money isn't the same as profitable.", "实值不等于盈利。"],
	claimSub: [
		"Premium buys time value; profit starts past break-even, and a writer's best case is the premium.",
		"权利金买的是时间价值；越过盈亏平衡点才盈利，义务方最好的结果就是权利金。",
	],
	nextBig: ["Next: put-call parity", "下一课：看跌-看涨平价"],
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
								className="wt-film-num wt-film-accent"
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
						<text x={L.left} y={L.top - 12} className="wt-small">
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
							x={(L.x(CALL.strike) + beX) / 2}
							y={L.top + 14}
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
							<path
								data-f="profit-line"
								d={L.path(buyerProfit)}
								className="wt-line-position"
							/>
							<path
								data-f="put-line"
								d={L.path(writerProfit)}
								className="wt-line-short"
							/>
							<path
								data-f="call-line"
								d={L.path(callWriter)}
								className="wt-line-long"
							/>
						</g>
						<text
							data-f="value-tag"
							// On a phone the profit tag takes the right: name the value line from above.
							x={narrow ? L.x(110) - 6 : L.x(110) + 8}
							y={L.y(value(CALL, 110)) + (narrow ? -6 : 4)}
							textAnchor={narrow ? "end" : "start"}
							className="wt-small wt-halo"
						>
							{t(copy.valueLine)}
						</text>
						<text
							data-f="profit-tag"
							x={L.x(116)}
							y={L.y(buyerProfit(116)) + 18}
							textAnchor="end"
							className="wt-small wt-halo wt-accent"
						>
							{t(copy.profitLine)}
						</text>
						<text
							data-f="put-tag"
							x={L.x(108)}
							y={L.y(GOT) - 10}
							className="wt-small wt-halo"
							style={{ fill: "var(--wt-short)" }}
						>
							{t(copy.putWriter)}
						</text>
						<text
							data-f="callw-tag"
							x={L.x(119)}
							y={L.y(callWriter(119)) - 10}
							textAnchor="end"
							className="wt-small wt-halo"
							style={{ fill: "var(--wt-long)" }}
						>
							{t(copy.callWriter)}
						</text>
						<g data-f="be">
							<path
								d={`M${beX} ${L.top}V${L.bottom}`}
								className="wt-bracket"
								strokeDasharray="4 3"
							/>
							<text
								x={beX + 6}
								y={L.y(-1000)}
								className="wt-halo wt-accent wt-marker-label"
							>
								{`$${BE.toFixed(2)}`}
							</text>
						</g>
						<g data-f="put-be">
							<path
								d={`M${L.x(PUT_BE)} ${L.top}V${L.bottom}`}
								className="wt-bracket"
								strokeDasharray="4 3"
							/>
							<text
								x={L.x(PUT_BE) - 6}
								y={L.y(1000)}
								textAnchor="end"
								className="wt-halo wt-marker-label"
								style={{ fill: "var(--wt-short)" }}
							>
								{`$${PUT_BE.toFixed(2)}`}
							</text>
						</g>
						<circle
							data-f="marker"
							cx={L.x(102)}
							cy={L.y(buyerProfit(102))}
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
							x={L.x(90) + 10}
							y={L.y(writerProfit(90)) + 18}
							className="wt-halo wt-loss wt-marker-label"
						>
							{signedUsd(writerProfit(90) * 100, 0)}
						</text>
					</g>
				</g>
			</g>
			<g data-f="meter">
				<Word
					name="m-value-tag"
					x={L.right}
					y={L.headY + T.head * 1.25}
					size={T.small}
					anchor="end"
					className="wt-film-tag"
				>
					{t(copy.valueLine).toUpperCase()}
				</Word>
				<Word
					name="m-value"
					x={L.right}
					y={L.headY + T.head * 1.25 + T.num * 1.05}
					size={T.num}
					anchor="end"
					className="wt-film-num"
				>
					$200
				</Word>
				<Word
					name="m-profit"
					x={L.right}
					y={L.headY + T.head * 1.25 + T.num * 1.05 + T.body * 1.7}
					size={T.body}
					anchor="end"
					className="wt-film-num wt-film-loss"
				>
					−$220
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
					y={H * 0.72}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("s-head", copy.partsHead, copy.partsHeadShort)}
			{headline("f-head", copy.ninetyFive, copy.ninetyFiveShort)}
			{headline("x-head", copy.expiryHead, copy.expiryHeadShort)}
			{headline("p-head", copy.profitHead, copy.profitHeadShort)}
			{headline("a-head", copy.atHead, copy.atHeadShort)}
			{headline("b-head", copy.beHead, copy.beHeadShort)}
			{headline("w-head", copy.writerHead, copy.writerHeadShort)}
			{headline("l-head", copy.belowHead, copy.belowHeadShort)}
			{headline("c-head", copy.callHead, copy.callHeadShort)}
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
	const { tl, one, kids, show, hide, pop, rise, sink } = d;
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
	const draw = (path: SVGPathElement, time: number, duration = 1.0) => {
		const length = path.getTotalLength();
		tl.fromTo(
			path,
			{ opacity: 0, strokeDasharray: length, strokeDashoffset: length },
			{ opacity: 1, strokeDashoffset: 0, duration, ease: "power2.inOut" },
			time,
		);
	};
	const marker = one("marker");
	const meterValue = one<SVGTextElement>("m-value");
	const meterProfit = one<SVGTextElement>("m-profit");
	const whole = (v: number) => usd(Math.round(v) * 100, 0);
	const signed = (v: number) =>
		Math.round(v) === 0 ? "$0" : signedUsd(Math.round(v) * 100, 0);
	const heads = [
		"s-head",
		"f-head",
		"x-head",
		"p-head",
		"a-head",
		"b-head",
		"w-head",
		"l-head",
		"c-head",
	].map((name) => one(name));
	const bars = (k: number) => [one(`in-${k}`), one(`tv-${k}`)];

	d.hidden([
		...flat("q"),
		...heads,
		...flat("bars").filter((el) => el.tagName !== "path"),
		...STRIKES.flatMap((k) => [...bars(k), one(`p-${k}`), one(`e-${k}`)]),
		one("legend"),
		...[
			"itm-band",
			"itm-label",
			"value-line",
			"profit-line",
			"put-line",
			"call-line",
			"value-tag",
			"profit-tag",
			"put-tag",
			"callw-tag",
			"be",
			"put-be",
			"marker",
			"put-marker",
			"put-loss",
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
	show(one("q-tag"), 4.6);
	word(one("q-big"), 4.8);
	show(one("q-line"), 6.4);

	// ——— parts: intrinsic and time value ———
	tl.addLabel("parts", 9.5);
	hide(flat("q"), 9.5);
	show(heads[0], 9.7, "above");
	tl.set(one("bars"), { opacity: 1 }, 9.9);
	show(
		// The strike labels and the caption; the prices come in with their bars.
		flat("bars").filter(
			(el) => el.tagName === "text" && !el.hasAttribute("data-f"),
		),
		9.9,
	);
	STRIKES.forEach((k, i) => {
		const now = priceParts(k, "call", "now");
		const at = 10.2 + i * 0.2;
		tl.fromTo(
			one(`in-${k}`),
			{ opacity: 1, attr: { y: L.barBottom, height: 0 } },
			{
				attr: {
					y: L.barBottom - L.barH(now.intrinsic),
					height: L.barH(now.intrinsic),
				},
				duration: 0.5,
				ease: "power2.out",
			},
			at,
		);
		tl.fromTo(
			one(`tv-${k}`),
			{
				opacity: 1,
				attr: { y: L.barBottom - L.barH(now.intrinsic), height: 0 },
			},
			{
				attr: { y: L.barBottom - L.barH(now.price), height: L.barH(now.time) },
				duration: 0.5,
				ease: "power2.out",
			},
			at + 0.3,
		);
		show(one(`p-${k}`), at + 0.6);
	});
	show(one("legend"), 11.6);
	d.swap(heads[0], heads[1], 12.6);
	tl.to(
		STRIKES.filter((k) => k !== 95).flatMap((k) => [...bars(k), one(`p-${k}`)]),
		{ opacity: 0.3, duration: 0.4 },
		13.0,
	);
	// At expiry: time value is gone.
	d.swap(heads[1], heads[2], 15.2);
	tl.to(
		STRIKES.flatMap((k) => [...bars(k), one(`p-${k}`)]),
		{ opacity: 1, duration: 0.3 },
		15.6,
	);
	STRIKES.forEach((k) => {
		const now = priceParts(k, "call", "now");
		tl.to(
			one(`tv-${k}`),
			{
				attr: { y: L.barBottom - L.barH(now.intrinsic), height: 0 },
				duration: 0.8,
				ease: "power2.inOut",
			},
			15.8,
		);
		hide(one(`p-${k}`), 15.8, 0.3);
		show(one(`e-${k}`), 16.5);
	});

	// ——— profit: the buyer of the 100 call ———
	tl.addLabel("profit", 20);
	hide(
		[
			heads[2],
			...flat("bars"),
			...STRIKES.flatMap((k) => [...bars(k), one(`e-${k}`)]),
			one("legend"),
		],
		20.0,
	);
	show(heads[3], 20.2, "above");
	rise(20.3);
	draw(one<SVGPathElement>("value-line"), 20.8);
	show(one("value-tag"), 21.6);
	draw(one<SVGPathElement>("profit-line"), 21.8);
	show(one("profit-tag"), 22.6);
	d.swap(heads[3], heads[4], 23.6);
	pop(marker, 24.0);
	show(kids("meter"), 24.2, "above");
	// Break-even.
	d.swap(heads[4], heads[5], 26.0);
	tl.to(one("itm-band"), { opacity: 1, duration: 0.5 }, 26.4);
	show(one("itm-label"), 26.6);
	show(one("be"), 26.8);
	const walk = { spot: 102 };
	tl.to(
		walk,
		{
			spot: 110,
			duration: 1.2,
			ease: "power2.inOut",
			onUpdate: () =>
				gsap.set(marker, {
					attr: { cx: L.x(walk.spot), cy: L.y(buyerProfit(walk.spot)) },
				}),
		},
		28.0,
	);
	d.count(meterValue, value(CALL, 110), 28.0, whole, value(CALL, 102), 1.2);
	d.count(meterProfit, buyerProfit(110), 28.0, signed, buyerProfit(102), 1.2);
	tl.set(meterProfit, { attr: { class: "wt-film-num wt-film-gain" } }, 28.6);

	// ——— writer: the premium is the best case ———
	tl.addLabel("writer", 31);
	d.swap(heads[5], heads[6], 31.0);
	hide(
		[
			...kids("meter"),
			marker,
			one("be"),
			one("itm-band"),
			one("itm-label"),
			one("value-tag"),
			one("profit-tag"),
		],
		31.0,
	);
	tl.to(
		[one("value-line"), one("profit-line")],
		{ opacity: 0.15, duration: 0.4 },
		31.0,
	);
	draw(one<SVGPathElement>("put-line"), 31.4);
	show(one("put-tag"), 32.2);
	d.swap(heads[6], heads[7], 33.2);
	show(one("put-be"), 33.6);
	pop(one("put-marker"), 34.0);
	show(one("put-loss"), 34.2, "right");
	d.swap(heads[7], heads[8], 35.4);
	draw(one<SVGPathElement>("call-line"), 35.8);
	show(one("callw-tag"), 36.6);
	// Cut: the claim.
	hide(heads[8], 37.6);
	sink(37.6);
	word(one("z-big"), 38.0);
	show(one("z-sub"), 38.4);

	// ——— next ———
	tl.addLabel("next", 40);
	hide(kids("claim"), 40.0);
	d.close(40.0);
	return tl;
}

export const premiumPayoffFilm: Film = {
	id: "premium-payoff",
	label: [
		`Premium, payoff and profit, as a short film: the Oct 18 95 call at ${usd(priceParts(95, "call", "now").price)} and what it is worth on Oct 18 if ALFA hasn't moved; five calls split into intrinsic and time value, with all the time value gone at expiry; the buyer of the 100 call, whose $200 of value at $102 is −$220 after the $420 premium, breaking even at $${BE.toFixed(2)} and keeping $580 at $110; and the writer of the 95 put, who keeps $205 above $95 and loses below $${PUT_BE.toFixed(2)}, beside a written call with no floor`,
		`权利金、到期价值与盈亏短片：售价 ${usd(priceParts(95, "call", "now").price)} 的 10月18日 95 看涨，若 ALFA 不动，到期值多少；五张看涨拆成内在价值与时间价值，到期时时间价值全部归零；100 看涨的买方，在 $102 时价值 $200，扣除 $420 权利金后亏 $220，在 $${BE.toFixed(2)} 盈亏平衡，在 $110 赚 $580；以及 95 看跌的义务方，$95 以上保留 $205，低于 $${PUT_BE.toFixed(2)} 开始亏损，旁边是没有下限的卖出看涨`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Premium and payoff", "权利金与到期价值"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "parts", label: ["Intrinsic and time", "内在与时间价值"] },
		{ id: "profit", label: ["The buyer", "买方"] },
		{ id: "writer", label: ["The writer", "义务方"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
