import { gsap } from "gsap";
import { useId } from "react";
import {
	type Copy,
	optionQuote,
	pick,
	signedUsd,
	usd,
	valueAtExpiry,
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
	Word,
} from "../walkthrough/film-kit";
import {
	CALL_COST,
	call100,
	positionPayoff,
	put100,
	putCost,
	shares,
	viewCost,
} from "./what-options-are-model";

/*
 * Options, as a film. It opens on an Oct 18 100 call bought for $420 and asks what it is
 * worth if ALFA ends at $95. The $420 lands on the chart as the premium line. The right to
 * buy at $100 is worthless at $95 and worth $1,000 at $110, the meter reading from the
 * marker itself; a put is the opposite right, $1,000 at $90. Then two uses next to owning
 * the shares. The hero is the first: as ALFA falls to $80 the shares lose $2,000 while the
 * shares with a 95 put stop at the −$715 floor, the difference filling in green. Then a
 * purchased 105 call bought for $215 is the only extra example: its maximum loss is $215.
 * Last, the other side: at $110 you are up $580 and Ben, who wrote the call, is down $580.
 *
 *   open      0–4        "Options"
 *   question  4–8.6      $420 for the Oct 18 100 call; ALFA ends at $95?
 *   right     8.6–21.4   the call: $0 at $95, $1,000 at $110; the put at $90
 *   uses      21.4–35.2  hero: shares, then with a 95 put as ALFA falls, the floor at −$715;
 *                        a purchased 105 call, costing $215
 *   sides     35.2–40.3  you +$580, Ben −$580
 *   claim     40.3–44.7  a right for you, an obligation for someone else
 *   next      44.7–46.7  Next: trading an option
 */

const END = 46.7;
const X = [80, 120] as const;
const VALUE_TOP = 2_100;
const USE_Y = [-2_000, 2_000] as const;
const spots = Array.from({ length: X[1] - X[0] + 1 }, (_, i) => X[0] + i);
/** Dollars for one contract, 100 shares, at expiry. */
const callValue = (spot: number) => valueAtExpiry(call100, spot * 100);
const putValue = (spot: number) => valueAtExpiry(put100, spot * 100);
const PREMIUM = CALL_COST;
const LOW = 95;
const HIGH = 110;
const PUT_AT = 90;
const NET_HIGH = callValue(HIGH) - PREMIUM;
/** The 100 put's own premium: the meter nets each right against what it cost. */
const PUT_COST = optionQuote(put100).ask;
/** Where the 95 put starts to pay for itself: below it, the shares with the put lose less. */
const SAVES_BELOW = 95 - putCost / 100;
const FALL_TO = 80;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, type: T } = frame;
	const left = Math.max(margin, narrow ? 46 : 0);
	const right = width * 0.965;
	/** The meter sits under the headline (two lines of it, at most), the chart under it. */
	const meterY = frame.headY + T.head * 2.6;
	const meterNum = meterY + T.head * 1.3;
	const top = narrow
		? H * 0.44
		: Math.max(H * 0.3, meterNum + T.small * 2.2 + 16);
	const bottom = H * 0.84;
	const x = (spot: number) =>
		left + ((spot - X[0]) / (X[1] - X[0])) * (right - left);
	const y = (dollars: number) =>
		bottom - (dollars / VALUE_TOP) * (bottom - top);
	const u = (dollars: number) =>
		bottom - ((dollars - USE_Y[0]) / (USE_Y[1] - USE_Y[0])) * (bottom - top);
	const path = (f: (spot: number) => number, scale: (v: number) => number) =>
		spots
			.map(
				(spot, i) =>
					`${i ? "L" : "M"}${x(spot).toFixed(1)} ${scale(f(spot)).toFixed(1)}`,
			)
			.join("");
	return {
		...frame,
		left,
		right,
		top,
		bottom,
		x,
		y,
		u,
		path,
		meterY,
		meterNum,
		meterCol: narrow ? 120 : 220,
		sideNum: H * 0.4 + T.big * 0.95,
		sideBasisTag: H * 0.4 + T.big * 1.27 + T.small * 1.5,
		sideBasis: H * 0.4 + T.big * 1.27 + T.small * 1.5 + T.body * 1.6,
		pair: narrow ? [0.27, 0.73] : [0.3, 0.7],
	};
}

const copy = {
	title: ["Options", "期权"],
	titleSub: ["a paid right with a deadline", "有期限的付费权利"],
	qTag: [
		"ALFA Oct 18 100 call · $4.20 a share",
		"ALFA 10月18日 100 看涨 · 每股 $4.20",
	],
	qLine: [
		`On Oct 18 ALFA ends at $${LOW}. What is the call worth?`,
		`10月18日 ALFA 收于 $${LOW}。这张看涨值多少？`,
	],
	rightHead: [
		"The right to buy 100 ALFA at $100.",
		"以 $100 买入 100 股 ALFA 的权利。",
	],
	rightHeadShort: ["The right to buy at $100.", "以 $100 买入的权利。"],
	callHead: [
		"Worth what ALFA is above $100.",
		"价值 = ALFA 高出 $100 的部分。",
	],
	callHeadShort: ["Worth ALFA above $100.", "价值 = ALFA 高出 $100 的部分。"],
	putHead: ["A put: the right to sell at $100.", "看跌：以 $100 卖出的权利。"],
	putHeadShort: ["A put: sell at $100.", "看跌：以 $100 卖出。"],
	axis: ["value at Oct 18, one contract", "10月18日 的价值，一张合约"],
	axisShort: ["value at expiry", "到期价值"],
	premium: [
		`premium ${usd(PREMIUM * 100, 0)}`,
		`权利金 ${usd(PREMIUM * 100, 0)}`,
	],
	strike: ["strike $100", "行权价 $100"],
	callLabel: ["call", "看涨"],
	putLabel: ["put", "看跌"],
	value: ["value", "价值"],
	net: ["after premium", "扣除权利金"],
	sharesAlone: ["100 shares", "100 股"],
	withPut: ["with the 95 put", "加 95 看跌"],
	protectHead: ["Protect the shares.", "保护持股。"],
	protectHeadShort: ["Protect the shares.", "保护持股。"],
	moreHead: ["Buy a call alone.", "单独买入看涨。"],
	moreHeadShort: ["Buy a call alone.", "单独买入看涨。"],
	viewContract: ["Buy ALFA Oct 18 105 call", "买入 ALFA 10月18日 105 看涨"],
	viewPremium: [
		`Premium ${usd(viewCost * 100, 0)}`,
		`权利金 ${usd(viewCost * 100, 0)}`,
	],
	sharesLabel: ["100 shares", "100 股"],
	floor: ["loss floor", "亏损下限"],
	most: [
		`Max loss ${usd(viewCost * 100, 0)}`,
		`最多亏 ${usd(viewCost * 100, 0)}`,
	],
	profitAxis: ["profit at Oct 18", "10月18日的盈亏"],
	result: [
		"Original 100 call · ALFA $110 · Oct 18",
		"原 100 看涨 · ALFA $110 · 10月18日",
	],
	holderBasis: ["value − premium", "价值 − 权利金"],
	writerBasis: ["premium − value", "权利金 − 价值"],
	sidesHead: ["The call has two sides.", "看涨合约的双方。"],
	sidesHeadShort: ["The call has two sides.", "看涨合约的双方。"],
	you: ["you · holder", "你 · 持有人"],
	ben: ["Ben · writer", "Ben · 义务方"],
	claimBig: [
		"A right for you, an obligation for someone else.",
		"你的权利，就是别人的义务。",
	],
	claimSub: ["The buyer can lose only the premium.", "买方最多只亏权利金。"],
	nextBig: ["Next: trading an option", "下一课：交易期权"],
	nextSub: ["from chain to order", "从期权链到下单"],
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
	const xTicks = [80, 90, 100, 110, 120];
	const ticks = (
		name: string,
		values: number[],
		scale: (v: number) => number,
	) => (
		<g data-f={name}>
			{values.map((v) => (
				<g key={v}>
					<path
						d={`M${L.left} ${scale(v)}H${L.right}`}
						className={v === 0 ? "wt-axis" : "wt-grid"}
					/>
					<text
						x={L.left - 8}
						y={scale(v) + 4}
						textAnchor="end"
						className="wt-small"
					>
						{v === 0
							? "$0"
							: narrow
								? `${v < 0 ? "−" : ""}${Math.abs(v) / 1000}k`
								: signedUsd(v * 100, 0).replace("+", "")}
					</text>
				</g>
			))}
			{xTicks.map((v) => (
				<text
					key={v}
					x={L.x(v)}
					y={L.bottom + 16}
					textAnchor={v === X[1] ? "end" : "middle"}
					className="wt-small"
				>
					{`$${v}`}
				</text>
			))}
		</g>
	);
	/**
	 * A line's label at a point: below it and to the right, or above it and to the left, so a
	 * rising line climbs away from the text on both sides. A flat line can take either side.
	 */
	const useLabel = (
		name: string,
		text: Copy,
		spot: number,
		value: number,
		tone: string,
		below = false,
		right = below,
	) => (
		<text
			data-f={name}
			x={L.x(spot) + (right ? 6 : -6)}
			y={L.u(value) + (below ? 20 : -10)}
			textAnchor={right ? "start" : "end"}
			className={`wt-halo wt-marker-label ${tone}`}
			style={tone.startsWith("wt-") ? undefined : { fill: tone }}
		>
			{t(text)}
		</text>
	);
	return (
		<>
			<Backdrop frame={L} />

			<g data-f="depth">
				<g data-f="world">
					{/* The right's value at expiry. */}
					<g data-f="value-chart">
						<text x={L.left} y={L.top - 12} className="wt-small">
							{t(narrow ? copy.axisShort : copy.axis)}
						</text>
						{ticks("v-ticks", [0, 1000, 2000], L.y)}
						<path
							data-f="strike"
							d={`M${L.x(100)} ${L.top}V${L.bottom}`}
							className="wt-bracket"
							strokeDasharray="4 3"
						/>
						<text
							data-f="strike-label"
							x={L.x(100) + 6}
							y={L.top + 14}
							className="wt-small wt-halo"
						>
							{t(copy.strike)}
						</text>
						<path
							data-f="premium"
							d={`M${L.left} ${L.y(PREMIUM)}H${L.right}`}
							className="wt-line-reference"
						/>
						<text
							data-f="premium-label"
							x={L.right - 4}
							y={L.y(PREMIUM) - 8}
							textAnchor="end"
							className="wt-small wt-halo"
						>
							{/* The figure white, like the question's $420 that lands on it. */}
							{t(copy.premium).replace(usd(PREMIUM * 100, 0), "")}
							<tspan className="wt-film-num">{usd(PREMIUM * 100, 0)}</tspan>
						</text>
						<path
							data-f="call-line"
							d={L.path(callValue, L.y)}
							className="wt-line-position"
						/>
						<path
							data-f="put-line"
							d={L.path(putValue, L.y)}
							className="wt-line-short"
						/>
						<text
							data-f="put-tag"
							x={L.x(83)}
							y={L.y(putValue(83)) - 10}
							className="wt-halo wt-marker-label"
							style={{ fill: "var(--wt-short)" }}
						>
							{t(copy.putLabel)}
						</text>
						<text
							data-f="call-tag"
							// Low on the line, clear of the meter in the corner.
							x={L.x(113) + 10}
							y={L.y(callValue(113)) + 16}
							className="wt-halo wt-accent wt-marker-label"
						>
							{t(copy.callLabel)}
						</text>
						<circle
							data-f="marker"
							cx={L.x(LOW)}
							cy={L.y(0)}
							r={6}
							className="wt-chip"
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
					</g>

					{/* Protection beside the shares alone, then a purchased call. */}
					<g data-f="use-chart">
						<text x={L.left} y={L.top - 12} className="wt-small">
							{t(copy.profitAxis)}
						</text>
						{ticks("u-ticks", [-1000, 0, 1000], L.u)}
						<path
							data-f="shares-line"
							d={L.path(shares, L.u)}
							className="wt-line-reference"
						/>
						<path
							data-f="protect-line"
							d={L.path(positionPayoff.protect, L.u)}
							className="wt-line-position"
						/>
						<path
							data-f="view-line"
							d={L.path(positionPayoff.view, L.u)}
							className="wt-line-long"
						/>
						{useLabel(
							"shares-tag",
							copy.sharesLabel,
							86,
							shares(86),
							"wt-film-dim",
							true,
						)}
						{/* Above the flat floor, to the right: the shares line runs below it. */}
						{useLabel(
							"floor-tag",
							copy.floor,
							narrow ? 80 : 84,
							positionPayoff.protect(narrow ? 80 : 84),
							"wt-accent",
							false,
							true,
						)}
						{useLabel(
							"most-tag",
							copy.most,
							104,
							positionPayoff.view(104),
							"wt-film-loss",
							true,
						)}
						{/* What the put saves: between the two lines, filled as ALFA falls. */}
						<clipPath id={`save-${id}`}>
							<rect
								data-f="save-clip"
								x={L.x(SAVES_BELOW)}
								y={L.top}
								width={0}
								height={L.bottom - L.top}
							/>
						</clipPath>
						<path
							data-f="save-area"
							d={`${L.path(positionPayoff.protect, L.u)}${[...spots]
								.reverse()
								.map(
									(spot) =>
										`L${L.x(spot).toFixed(1)} ${L.u(shares(spot)).toFixed(1)}`,
								)
								.join("")}Z`}
							className="wt-band-gain"
							clipPath={`url(#save-${id})`}
						/>
						<circle
							data-f="s-marker"
							cx={L.x(100)}
							cy={L.u(shares(100))}
							r={5}
							className="wt-chip"
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
						<circle
							data-f="p-marker"
							cx={L.x(100)}
							cy={L.u(positionPayoff.protect(100))}
							r={6}
							className="wt-chip"
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
					</g>
					<PenTip name="tip" />
					<PenTip name="put-tip" color="var(--wt-short)" />
					<PenTip name="view-tip" color="var(--wt-long)" />
				</g>
			</g>
			<Brackets name="lock-floor" tone="loss" glow />
			{/* Readouts under the headline: the right's value, then each use's two positions. */}
			{(
				[
					[
						"meter",
						[
							["m-value", copy.value, "$0", "wt-film-num wt-film-accent"],
							[
								"m-net",
								copy.net,
								signedUsd(-PREMIUM * 100, 0),
								"wt-film-num wt-film-loss",
							],
						],
					],
					[
						"umeter",
						[
							["u-shares", copy.sharesAlone, "$0", "wt-film-num"],
							[
								"u-put",
								copy.withPut,
								signedUsd(positionPayoff.protect(100) * 100, 0),
								"wt-film-num wt-film-loss",
							],
						],
					],
				] as const
			).map(([group, cells]) => (
				<g key={group} data-f={group}>
					{cells.map(([name, tag, start, className], i) => (
						<g key={name}>
							<Word
								name={`${name}-tag`}
								x={margin + i * L.meterCol}
								y={L.meterY}
								size={T.small}
								anchor="start"
								className="wt-film-tag"
							>
								{t(tag).toUpperCase()}
							</Word>
							<Word
								name={name}
								x={margin + i * L.meterCol}
								y={L.meterNum + (name === "u-put" ? T.head * 1.55 : 0)}
								size={T.head * (name === "u-put" ? 1.6 : 1.15)}
								anchor="start"
								className={className}
							>
								{start}
							</Word>
						</g>
					))}
				</g>
			))}

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
				<Word
					name="q-big"
					x={W / 2}
					y={H * 0.3 + T.big * 1.05}
					size={T.big}
					className="wt-film-num"
				>
					{usd(PREMIUM * 100, 0)}
				</Word>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.74}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("r-head", copy.rightHead, copy.rightHeadShort)}
			{headline("c-head", copy.callHead, copy.callHeadShort)}
			{headline("p-head", copy.putHead, copy.putHeadShort)}

			{headline("v-head", copy.protectHead, copy.protectHeadShort)}
			{headline("e-head", copy.moreHead, copy.moreHeadShort)}
			{headline("d-head", copy.sidesHead, copy.sidesHeadShort)}
			<g data-f="view-ticket">
				<Lines
					name="view-contract"
					text={t(copy.viewContract)}
					x={margin}
					y={L.meterY}
					size={T.body}
					maxWidth={room}
					anchor="start"
					className="wt-film-type"
				/>
				<Word
					name="view-premium"
					x={margin}
					y={L.meterY + T.body * 1.7}
					size={T.body}
					anchor="start"
					className="wt-film-num wt-film-dim"
				>
					{t(copy.viewPremium)}
				</Word>
			</g>
			<g data-f="sides">
				{(
					[
						[
							"you",
							copy.you,
							copy.holderBasis,
							`${usd(callValue(HIGH) * 100, 0)} − ${usd(PREMIUM * 100, 0)}`,
							signedUsd(NET_HIGH * 100, 0),
							"wt-film-gain",
						],
						[
							"ben",
							copy.ben,
							copy.writerBasis,
							`${usd(PREMIUM * 100, 0)} − ${usd(callValue(HIGH) * 100, 0)}`,
							signedUsd(-NET_HIGH * 100, 0),
							"wt-film-loss",
						],
					] as const
				).map(([name, tag, basisLabel, basis, after, tone], i) => (
					<g key={name}>
						<Word
							name={`${name}-tag`}
							x={W * L.pair[i]}
							y={H * 0.4}
							size={T.small}
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`${name}-basis-tag`}
							x={W * L.pair[i]}
							y={L.sideBasisTag}
							size={T.small}
							className="wt-film-tag"
						>
							{t(basisLabel)}
						</Word>
						<Word
							name={`${name}-basis`}
							x={W * L.pair[i]}
							y={L.sideBasis}
							size={T.body}
							className="wt-film-num wt-film-dim"
						>
							{basis}
						</Word>
						<Word
							name={`${name}-after`}
							x={W * L.pair[i]}
							y={L.sideNum}
							size={T.big * 0.8}
							className={`wt-film-num ${tone}`}
						>
							{after}
						</Word>
					</g>
				))}
				<Lines
					name="sides-line"
					text={t(copy.result)}
					x={W / 2}
					y={H * 0.26}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
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
	const { tl, one, kids, show, hide, pop, rise, sink } = d;
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
	gsap.set(one("lock-floor"), {
		filter:
			"drop-shadow(0 0 2px var(--diagram-loss)) drop-shadow(0 0 9px color-mix(in oklab, var(--diagram-loss) 60%, transparent))",
	});
	const tip = one("tip");
	const line = (name: string) => one<SVGPathElement>(name);
	const marker = one("marker");
	const value = one<SVGTextElement>("m-value");
	const net = one<SVGTextElement>("m-net");
	const uShares = one<SVGTextElement>("u-shares");
	const uPut = one<SVGTextElement>("u-put");
	const sMarker = one("s-marker");
	const pMarker = one("p-marker");
	const saveClip = one("save-clip");
	const dollars = (v: number) => usd(Math.round(v) * 100, 0);
	const signed = (v: number) =>
		Math.round(v) === 0 ? "$0" : signedUsd(Math.round(v) * 100, 0);
	const tone = (v: number) =>
		`wt-film-num ${Math.round(v) > 0 ? "wt-film-gain" : Math.round(v) < 0 ? "wt-film-loss" : ""}`;
	/**
	 * A tween that walks a spot from one price to another and draws everything from it each
	 * frame. Not rendered up front, so nothing reads the walk's end before it begins.
	 */
	const walk = (
		from: number,
		to: number,
		at: number,
		duration: number,
		place: (spot: number) => void,
	) => {
		const spot = { at: from };
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
	/** The marker on a right's value line, and the meter read from the marker. */
	const onRight =
		(f: (spot: number) => number, cost: number) => (spot: number) => {
			gsap.set(marker, { attr: { cx: L.x(spot), cy: L.y(f(spot)) } });
			value.textContent = dollars(f(spot));
			net.textContent = signed(f(spot) - cost);
			net.setAttribute("class", tone(f(spot) - cost));
		};
	/** Both positions as ALFA falls: the markers, the readouts and the saving behind them. */
	const onFall = (spot: number) => {
		gsap.set(sMarker, { attr: { cx: L.x(spot), cy: L.u(shares(spot)) } });
		gsap.set(pMarker, {
			attr: { cx: L.x(spot), cy: L.u(positionPayoff.protect(spot)) },
		});
		uShares.textContent = signed(shares(spot));
		uShares.setAttribute("class", tone(shares(spot)));
		uPut.textContent = signed(positionPayoff.protect(spot));
		uPut.setAttribute("class", tone(positionPayoff.protect(spot)));
		const left = Math.min(L.x(spot), L.x(SAVES_BELOW));
		gsap.set(saveClip, {
			attr: { x: left, width: L.x(SAVES_BELOW) - left },
		});
	};
	const heads = [
		"r-head",
		"c-head",
		"p-head",
		"v-head",
		"e-head",
		"d-head",
	].map((name) => one(name));

	d.hidden([
		one("use-chart"),
		one("strike"),
		one("strike-label"),
		one("premium"),
		one("premium-label"),
		one("call-line"),
		one("put-line"),
		one("call-tag"),
		one("put-tag"),
		marker,
		one("shares-line"),
		one("protect-line"),
		one("view-line"),
		one("shares-tag"),
		one("floor-tag"),
		one("most-tag"),
		one("save-area"),
		sMarker,
		pMarker,
		tip,
		one("put-tip"),
		one("view-tip"),
		one("lock-floor"),
		...kids("view-ticket"),
		...kids("meter"),
		...kids("umeter"),
		...flat("q"),
		...heads,
		...flat("sides"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: a call for $420 ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.4);
	word(one("q-big"), 4.6);
	show(one("q-line"), 5.1);

	// ——— right: what the call is worth at expiry ———
	tl.addLabel("right", 8.6);
	hide([one("q-tag"), one("q-line")], 8.6);
	rise(8.7);
	show([one("strike"), one("strike-label")], 9.2);
	// The $420 the question named lands on the chart as the premium line.
	d.carry(
		one<SVGGraphicsElement>("q-big"),
		one<SVGGraphicsElement>("premium-label"),
		8.8,
		{ duration: 1.1, arc: "y" },
	);
	tl.to(one("premium"), { opacity: 1, duration: 0.4 }, 9.7);
	show(heads[0], 10.0);
	d.trace(line("call-line"), 10.4, { tip, duration: 1.2 });
	show(one("call-tag"), 11.4);
	// The call at $95, then at $110: the meter reads from the marker.
	d.swap(heads[0], heads[1], 13.5);
	pop(marker, 13.9);
	show(kids("meter"), 14.0);
	walk(HIGH, HIGH, 13.89, 0.01, () => onRight(callValue, PREMIUM)(LOW));
	walk(LOW, HIGH, 15.5, 1.2, onRight(callValue, PREMIUM));
	// The put: the opposite right, walked down to $90.
	d.swap(heads[1], heads[2], 17.5);
	tl.to(
		[one("call-line"), one("call-tag")],
		{ opacity: 0.3, duration: 0.4 },
		17.9,
	);
	// The meter turns to the put where the marker stands, $110: worth $0, −$420.
	walk(HIGH, HIGH, 17.89, 0.01, onRight(putValue, PUT_COST));
	d.trace(line("put-line"), 17.9, { tip: one("put-tip"), duration: 1.0 });
	show(one("put-tag"), 18.7);
	walk(HIGH, PUT_AT, 18.9, 1.2, onRight(putValue, PUT_COST));

	// ——— uses: the hero first. Shares alone, then shares with a 95 put as ALFA falls. ———
	tl.addLabel("uses", 21.4);
	hide([heads[2], ...kids("meter")], 21.4);
	sink(21.4);
	tl.set(one("value-chart"), { opacity: 0 }, 21.8);
	tl.set(one("use-chart"), { opacity: 1 }, 21.8);
	show(heads[3], 21.8);
	rise(21.9);
	// Build one comparison, rather than two successive proofs. The reference and
	// protected position settle together; labels land with that construction.
	d.trace(line("shares-line"), 22.2, { duration: 1.2 });
	d.trace(line("protect-line"), 22.2, { tip, duration: 1.2 });
	show([one("shares-tag"), ...kids("umeter")], 23.4);
	// Everything settles by 23.9. The paired markers fade in only after 1.15 s
	// of quiet, then the same 1.6 s walk constructs the −$715 loss floor.
	tl.to(
		[sMarker, pMarker, one("save-area")],
		{ opacity: 1, duration: 0.35 },
		25.05,
	);
	walk(100, FALL_TO, 25.5, 1.6, onFall);
	show(one("floor-tag"), 26.9);
	d.lock(one<SVGGraphicsElement>("lock-floor"), 27.1, {
		around: uPut,
		pad: 5,
	});
	tl.addLabel("hero-lock", 27.1);
	// The enlarged loss meter and brackets keep their full 3.55 s settled stand.
	d.swap(heads[3], heads[4], 30.7);
	hide(
		[one("u-shares-tag"), uShares, one("u-put-tag"), sMarker, pMarker],
		30.7,
	);
	tl.to(
		[
			uPut,
			one("protect-line"),
			one("floor-tag"),
			one("shares-line"),
			one("shares-tag"),
			one("save-area"),
			one("lock-floor"),
		],
		{ opacity: 0, duration: 0.4 },
		31.1,
	);
	// One identified transaction owns the whole extra-use beat. No old curves
	// remain under the purchased call, and the bound explicitly names loss.
	show(kids("view-ticket"), 31.5);
	d.trace(line("view-line"), 31.9, { tip: one("view-tip"), duration: 1.2 });
	show(one("most-tag"), 33.1);
	// Label and pen settle by 33.6; the result rests 1.6 s before the cut.

	// ——— sides: holder and writer ———
	tl.addLabel("sides", 35.2);
	hide([heads[4], ...kids("view-ticket")], 35.2);
	sink(35.2);
	show(heads[5], 35.55);
	show(one("sides-line"), 35.55);
	show([one("you-tag"), one("ben-tag")], 35.55);
	// Build the two mirrored bases as one proof. After a full second of quiet,
	// reveal both settled results together; the original 2.7 s result rest remains.
	show(
		[
			one("you-basis-tag"),
			one("ben-basis-tag"),
			one("you-basis"),
			one("ben-basis"),
		],
		35.55,
	);
	word(one("you-after"), 37.05);
	word(one("ben-after"), 37.05);

	// ——— claim ———
	tl.addLabel("claim", 40.3);
	hide([heads[5], ...flat("sides")], 40.3);
	word(one("z-big"), 40.6);
	show(one("z-sub"), 40.9);

	// ——— next ———
	tl.addLabel("next", 44.7);
	hide(kids("claim"), 44.7);
	d.close(44.7);
	return tl;
}

export const whatOptionsAreFilm: Film = {
	id: "what-options-are",
	label: [
		`Options, as a short film: an Oct 18 100 call bought for ${usd(PREMIUM * 100, 0)} and its worth if ALFA ends at $${LOW}; the right to buy at $100, worthless at $${LOW} and worth $1,000 at $${HIGH}; a put worth $1,000 at $${PUT_AT}; 100 shares protected by a 95 put as ALFA falls to $80, with a loss floor of ${signedUsd(positionPayoff.protect(80) * 100, 0)}; an Oct 18 105 call bought for ${usd(viewCost * 100, 0)}, whose maximum loss is its premium; and the original 100 call at ALFA $${HIGH} on Oct 18, its $1,000 value minus $420 premium leaving you up $580 and Ben down $580`,
		`期权短片：花 ${usd(PREMIUM * 100, 0)} 买入的 10月18日 100 看涨，以及 ALFA 收于 $${LOW} 时它值多少；以 $100 买入的权利，在 $${LOW} 作废，在 $${HIGH} 值 $1,000；看跌在 $${PUT_AT} 值 $1,000；ALFA 跌到 $80 时，100 股加 95 看跌的亏损下限为 ${signedUsd(positionPayoff.protect(80) * 100, 0)}；花 ${usd(viewCost * 100, 0)} 买入 10月18日 105 看涨，最多只亏权利金；以及原来的 100 看涨在 10月18日 ALFA 收于 $${HIGH} 时，$1,000 价值减 $420 权利金，你赚 $580，Ben 亏 $580`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Options", "期权"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "right", label: ["The right", "权利"] },
		{ id: "uses", label: ["Two uses", "两种用途"] },
		{ id: "sides", label: ["Two sides", "两方"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
