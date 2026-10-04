import { gsap } from "gsap";
import {
	type Copy,
	pick,
	signedUsd,
	usd,
	valueAtExpiry,
} from "@/content/world";
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
	CALL_COST,
	call100,
	callIncome,
	positionPayoff,
	put100,
	putCost,
	shares,
	viewCost,
} from "./what-options-are-model";

/*
 * Options, as a film. It opens on an Oct 18 100 call bought for $420 and asks what it is
 * worth if ALFA ends at $95. The right to buy at $100: worthless at $95, $1,000 at $110,
 * and a put is the opposite right. Then three uses next to owning the shares: a put that
 * puts a floor at −$715, a call sold for $85 that caps the gain at +$1,085, and a call
 * bought for a view that can lose only $215. Last, the other side: at $110 you are up
 * $580 and Ben, who wrote the call, is down $580.
 *
 *   open      0–4      "Options"
 *   question  4–9.5    $420 for the Oct 18 100 call; ALFA ends at $95?
 *   right     9.5–21   the call at $95: $0; at $110: $1,000; the put at $90
 *   uses      21–32    protect, earn, take a view
 *   sides     32–41    you +$580, Ben −$580; cut: the claim
 *   next      41–43.5  Next: trading an option
 */

const END = 43.5;
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

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin } = frame;
	const left = Math.max(margin, narrow ? 46 : 0);
	const right = width * 0.965;
	// On a phone the chart starts under the meter in the corner.
	const top = H * (narrow ? 0.44 : 0.3);
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
		"The right to buy 100 ALFA at $100, until Oct 18.",
		"在10月18日前以 $100 买入 100 股 ALFA 的权利。",
	],
	rightHeadShort: ["The right to buy at $100.", "以 $100 买入的权利。"],
	lowHead: [
		`At $${LOW}, nobody pays $100: the call expires worthless.`,
		`在 $${LOW}，没人会付 $100：看涨作废。`,
	],
	lowHeadShort: [`At $${LOW}: worthless.`, `在 $${LOW}：作废。`],
	highHead: [
		`At $${HIGH}, buying at $100 is worth $1,000.`,
		`在 $${HIGH}，以 $100 买入值 $1,000。`,
	],
	highHeadShort: [`At $${HIGH}: $1,000.`, `在 $${HIGH}：$1,000。`],
	putHead: [
		`A put is the opposite right: to sell at $100. At $${PUT_AT}: $1,000.`,
		`看跌是相反的权利：以 $100 卖出。在 $${PUT_AT}：$1,000。`,
	],
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
	net: ["net of the premium", "扣除权利金后"],
	usesHead: [
		"Own 100 shares: every $1 is ±$100, no floor, no cap.",
		"持有 100 股：每 $1 就是 ±$100，没有下限也没有上限。",
	],
	usesHeadShort: ["100 shares: no floor, no cap.", "100 股：无下限、无上限。"],
	protectHead: [
		`Protect: add a 95 put for ${usd(putCost * 100, 0)}. The worst case is ${signedUsd(positionPayoff.protect(80) * 100, 0)}.`,
		`保护：加一张 95 看跌，花 ${usd(putCost * 100, 0)}。最坏结果是 ${signedUsd(positionPayoff.protect(80) * 100, 0)}。`,
	],
	protectHeadShort: [
		`Protect: a floor at ${signedUsd(positionPayoff.protect(80) * 100, 0)}.`,
		`保护：下限 ${signedUsd(positionPayoff.protect(80) * 100, 0)}。`,
	],
	earnHead: [
		`Earn: sell a 110 call for ${usd(callIncome * 100, 0)}. Gains above $110 go to the buyer.`,
		`赚取：卖出一张 110 看涨，收 ${usd(callIncome * 100, 0)}。$110 以上的收益归买方。`,
	],
	earnHeadShort: [
		`Earn: capped at ${signedUsd(positionPayoff.earn(120) * 100, 0)}.`,
		`赚取：上限 ${signedUsd(positionPayoff.earn(120) * 100, 0)}。`,
	],
	viewHead: [
		`A view without shares: a 105 call for ${usd(viewCost * 100, 0)}, the most you can lose.`,
		`不持股表达观点：一张 105 看涨，花 ${usd(viewCost * 100, 0)}，这就是最多会亏的。`,
	],
	viewHeadShort: [
		`A view: lose at most ${usd(viewCost * 100, 0)}.`,
		`观点：最多亏 ${usd(viewCost * 100, 0)}。`,
	],
	sharesLabel: ["100 shares", "100 股"],
	floor: [
		`floor ${signedUsd(positionPayoff.protect(80) * 100, 0)}`,
		`下限 ${signedUsd(positionPayoff.protect(80) * 100, 0)}`,
	],
	cap: [
		`cap ${signedUsd(positionPayoff.earn(120) * 100, 0)}`,
		`上限 ${signedUsd(positionPayoff.earn(120) * 100, 0)}`,
	],
	most: [
		`at most ${signedUsd(-viewCost * 100, 0)}`,
		`最多 ${signedUsd(-viewCost * 100, 0)}`,
	],
	result: ["result at Oct 18", "10月18日 的结果"],
	sidesHead: [
		"Every option has a holder and a writer. You bought the call from Ben.",
		"每张期权都有持有人和义务方。你从 Ben 那里买了这张看涨。",
	],
	sidesHeadShort: ["You bought it from Ben.", "你从 Ben 那里买的。"],
	exerciseHead: [
		`At $${HIGH} you exercise: $10,000 for shares worth $11,000.`,
		`在 $${HIGH} 你行权：花 $10,000 买到值 $11,000 的股票。`,
	],
	exerciseHeadShort: [`At $${HIGH}: you exercise.`, `在 $${HIGH}：你行权。`],
	you: ["you · holder", "你 · 持有人"],
	ben: ["Ben · writer", "Ben · 义务方"],
	claimBig: [
		"A right for you, an obligation for someone else.",
		"你的权利，就是别人的义务。",
	],
	claimSub: [
		"The premium is the most the writer can gain and the most the buyer can lose.",
		"权利金是义务方最多能赚的，也是买方最多会亏的。",
	],
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
	const useLabel = (
		name: string,
		text: Copy,
		spot: number,
		value: number,
		tone: string,
		below = false,
	) => (
		<text
			data-f={name}
			x={L.x(spot)}
			y={L.u(value) + (below ? 18 : -10)}
			textAnchor="middle"
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
							{t(copy.premium)}
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

					{/* Three uses, beside the shares alone. */}
					<g data-f="use-chart">
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
							data-f="earn-line"
							d={L.path(positionPayoff.earn, L.u)}
							className="wt-line-short"
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
						{useLabel(
							"floor-tag",
							copy.floor,
							86,
							positionPayoff.protect(86),
							"wt-accent",
						)}
						{useLabel(
							"cap-tag",
							copy.cap,
							114,
							positionPayoff.earn(114),
							"var(--wt-short)",
							true,
						)}
						{useLabel(
							"most-tag",
							copy.most,
							101,
							positionPayoff.view(101),
							"var(--wt-long)",
							true,
						)}
					</g>
				</g>
			</g>
			<g data-f="meter">
				<Word
					name="m-tag"
					x={L.right}
					y={L.headY + T.head * 1.25}
					size={T.small}
					anchor="end"
					className="wt-film-tag"
				>
					{t(copy.value).toUpperCase()}
				</Word>
				<Word
					name="m-value"
					x={L.right}
					y={L.headY + T.head * 1.25 + T.num * 1.05}
					size={T.num}
					anchor="end"
					className="wt-film-num wt-film-accent"
				>
					$0
				</Word>
				<Word
					name="m-net"
					x={L.right}
					y={L.headY + T.head * 1.25 + T.num * 1.05 + T.body * 1.7}
					size={T.body}
					anchor="end"
					className="wt-film-num"
				>
					{signedUsd(-PREMIUM * 100, 0)}
				</Word>
			</g>

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
			{headline("o-head", copy.lowHead, copy.lowHeadShort)}
			{headline("h-head", copy.highHead, copy.highHeadShort)}
			{headline("p-head", copy.putHead, copy.putHeadShort)}
			{headline("s-head", copy.usesHead, copy.usesHeadShort)}
			{headline("v-head", copy.protectHead, copy.protectHeadShort)}
			{headline("e-head", copy.earnHead, copy.earnHeadShort)}
			{headline("w-head", copy.viewHead, copy.viewHeadShort)}
			{headline("d-head", copy.sidesHead, copy.sidesHeadShort)}
			{headline("x-head", copy.exerciseHead, copy.exerciseHeadShort)}
			<g data-f="sides">
				{(
					[
						[
							"you",
							copy.you,
							signedUsd(-PREMIUM * 100, 0),
							signedUsd(NET_HIGH * 100, 0),
							"wt-film-gain",
						],
						[
							"ben",
							copy.ben,
							signedUsd(PREMIUM * 100, 0),
							signedUsd(-NET_HIGH * 100, 0),
							"wt-film-loss",
						],
					] as const
				).map(([name, tag, before, after, tone], i) => (
					<g key={name}>
						<Word
							name={`${name}-tag`}
							x={W * L.pair[i]}
							y={H * 0.36}
							size={T.small}
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`${name}-before`}
							x={W * L.pair[i]}
							y={H * 0.36 + T.big * 0.95}
							size={T.big * 0.8}
							className="wt-film-num"
						>
							{before}
						</Word>
						<Word
							name={`${name}-after`}
							x={W * L.pair[i]}
							y={H * 0.36 + T.big * 0.95}
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
					y={H * 0.74}
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
	const value = one<SVGTextElement>("m-value");
	const net = one<SVGTextElement>("m-net");
	const dollars = (v: number) => usd(Math.round(v) * 100, 0);
	const signed = (v: number) => signedUsd(Math.round(v) * 100, 0);
	/** The marker walks along a value line from one price to another. */
	const walk = (
		f: (spot: number) => number,
		from: number,
		to: number,
		time: number,
	) => {
		const at = { spot: from };
		tl.to(
			at,
			{
				spot: to,
				duration: 1.0,
				ease: "power2.inOut",
				onUpdate: () =>
					gsap.set(marker, { attr: { cx: L.x(at.spot), cy: L.y(f(at.spot)) } }),
			},
			time,
		);
	};
	const heads = [
		"r-head",
		"o-head",
		"h-head",
		"p-head",
		"s-head",
		"v-head",
		"e-head",
		"w-head",
		"d-head",
		"x-head",
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
		one("earn-line"),
		one("view-line"),
		one("shares-tag"),
		one("floor-tag"),
		one("cap-tag"),
		one("most-tag"),
		...kids("meter"),
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
	show(one("q-tag"), 4.6);
	word(one("q-big"), 4.8);
	show(one("q-line"), 6.4);

	// ——— right: what the call is worth at expiry ———
	tl.addLabel("right", 9.5);
	hide(flat("q"), 9.5);
	show(one("r-head"), 9.7, "above");
	rise(9.8);
	show([one("strike"), one("strike-label")], 10.3);
	draw(one<SVGPathElement>("call-line"), 10.6);
	show(one("call-tag"), 11.4);
	tl.to(one("premium"), { opacity: 1, duration: 0.4 }, 11.6);
	show(one("premium-label"), 11.8);
	// At $95.
	d.swap(one("r-head"), one("o-head"), 13.0);
	pop(marker, 13.4);
	show(kids("meter"), 13.4, "above");
	d.count(value, 0, 13.4, dollars, 0, 0.01);
	tl.set(net, { attr: { class: "wt-film-num wt-film-loss" } }, 13.4);
	// At $110.
	d.swap(one("o-head"), one("h-head"), 15.4);
	walk(callValue, LOW, HIGH, 15.8);
	d.count(value, callValue(HIGH), 15.8, dollars, 0, 1.0);
	d.count(net, NET_HIGH, 15.8, signed, -PREMIUM, 1.0);
	tl.set(net, { attr: { class: "wt-film-num wt-film-gain" } }, 16.4);
	// The put.
	d.swap(one("h-head"), one("p-head"), 17.8);
	draw(one<SVGPathElement>("put-line"), 18.2);
	show(one("put-tag"), 18.8);
	tl.to(
		[one("call-line"), one("call-tag")],
		{ opacity: 0.3, duration: 0.4 },
		18.2,
	);
	walk(putValue, HIGH, PUT_AT, 18.6);
	d.count(value, putValue(PUT_AT), 18.6, dollars, callValue(HIGH), 1.0);
	d.count(net, putValue(PUT_AT) - PREMIUM, 18.6, signed, NET_HIGH, 1.0);

	// ——— uses: protect, earn, a view ———
	tl.addLabel("uses", 21);
	hide([one("p-head"), ...kids("meter")], 21.0);
	sink(21.0);
	tl.set(one("value-chart"), { opacity: 0 }, 21.4);
	tl.set(one("use-chart"), { opacity: 1 }, 21.4);
	show(one("s-head"), 21.4, "above");
	rise(21.5);
	draw(one<SVGPathElement>("shares-line"), 22.0, 0.9);
	show(one("shares-tag"), 22.7);
	d.swap(one("s-head"), one("v-head"), 23.6);
	draw(one<SVGPathElement>("protect-line"), 24.0);
	show(one("floor-tag"), 24.8);
	d.swap(one("v-head"), one("e-head"), 26.2);
	tl.to(
		[one("protect-line"), one("floor-tag")],
		{ opacity: 0.25, duration: 0.4 },
		26.6,
	);
	draw(one<SVGPathElement>("earn-line"), 26.6);
	show(one("cap-tag"), 27.4);
	d.swap(one("e-head"), one("w-head"), 28.8);
	tl.to(
		[one("earn-line"), one("cap-tag")],
		{ opacity: 0.25, duration: 0.4 },
		29.2,
	);
	draw(one<SVGPathElement>("view-line"), 29.2);
	show(one("most-tag"), 30.0);

	// ——— sides: holder and writer ———
	tl.addLabel("sides", 32);
	hide(one("w-head"), 32.0);
	sink(32.0);
	show(one("d-head"), 32.3, "above");
	show([one("you-tag"), one("ben-tag")], 32.6);
	word(one("you-before"), 32.8);
	word(one("ben-before"), 33.1);
	d.swap(one("d-head"), one("x-head"), 34.6);
	d.flip(one("you-before"), one("you-after"), 35.0);
	tl.set(one("you-before"), { opacity: 0 }, 35.3);
	d.flip(one("ben-before"), one("ben-after"), 35.2);
	tl.set(one("ben-before"), { opacity: 0 }, 35.5);
	show(one("sides-line"), 35.6);
	// Cut: the claim.
	hide([one("x-head"), ...flat("sides")], 37.4);
	word(one("z-big"), 37.8);
	show(one("z-sub"), 38.3);

	// ——— next ———
	tl.addLabel("next", 41);
	hide(kids("claim"), 41.0);
	d.close(41.0);
	return tl;
}

export const whatOptionsAreFilm: Film = {
	id: "what-options-are",
	label: [
		`Options, as a short film: an Oct 18 100 call bought for ${usd(PREMIUM * 100, 0)} and the question of its worth if ALFA ends at $${LOW}; the right to buy at $100, worthless at $${LOW} and $1,000 at $${HIGH}, and the put, the opposite right, worth $1,000 at $${PUT_AT}; three uses beside 100 shares, a put that floors the loss at ${signedUsd(positionPayoff.protect(80) * 100, 0)}, a sold call that caps the gain at ${signedUsd(positionPayoff.earn(120) * 100, 0)}, and a call bought for a view that can lose ${usd(viewCost * 100, 0)}; and the two sides at $${HIGH}, you up ${usd(NET_HIGH * 100, 0)} and Ben, the writer, down the same`,
		`期权短片：花 ${usd(PREMIUM * 100, 0)} 买入的 10月18日 100 看涨，以及 ALFA 收于 $${LOW} 时它值多少；以 $100 买入的权利，在 $${LOW} 作废，在 $${HIGH} 值 $1,000，看跌是相反的权利，在 $${PUT_AT} 值 $1,000；与 100 股相比的三种用途：看跌把亏损下限定在 ${signedUsd(positionPayoff.protect(80) * 100, 0)}，卖出看涨把收益封顶在 ${signedUsd(positionPayoff.earn(120) * 100, 0)}，买入看涨表达观点最多亏 ${usd(viewCost * 100, 0)}；以及 $${HIGH} 时的双方：你赚 ${usd(NET_HIGH * 100, 0)}，义务方 Ben 亏同样多`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Options", "期权"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "right", label: ["The right", "权利"] },
		{ id: "uses", label: ["Three uses", "三种用途"] },
		{ id: "sides", label: ["Two sides", "两方"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
