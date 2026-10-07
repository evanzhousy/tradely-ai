import { useId } from "react";
import { type Copy, count, pick } from "@/content/world";
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
	TitleCard,
	Word,
} from "../walkthrough/film-kit";
import {
	CALLS,
	contribution,
	FOCUS_GAMMA,
	FOCUS_OI,
	FOCUS_STRIKE,
	GROSS,
	key,
	LONG,
	MISSING,
	money,
	NET,
	PUTS,
	SHARES,
	SPOT,
	STRIKES,
	TRADED,
	tradedOnly,
	withGap,
} from "./gamma-exposure-model";

/*
 * GEX, as a film. It opens on a dashboard number, ALFA GEX −$512k, and asks what it
 * stands on. One contract is built as a chain of type: gamma × open interest × 100 ×
 * spot × 1%, then a sign that is an assumption, and flipping it flips the number. Then
 * the whole Oct 18 chain as bars by strike, calls up and puts down, collapsing to a net
 * profile that changes sign between $100 and $105: −$512k is the small difference of
 * $4.10M. Last, coverage: only the traded contracts give +$1.14M, and a missing put
 * leaves a subtotal, not a total.
 *
 *   open      0–4        "GEX"
 *   question  4–9.6      "ALFA GEX: −$512k" — which sign? which contracts? which close?
 *   chain     9.6–19     0.0266 × 2,500 × 100 = 6,650 a $1; × $100 × 1% = $665k; × sign
 *   profile   19–32      calls +$1.79M, puts −$2.31M, net by strike; cut: −$512k of
 *                        $4.10M, locked
 *   coverage  32–44.3    traded only +$1.14M; the 95 put missing, +$330k known;
 *                        cut: "GEX is a model, not a reading."
 *   next      44.3–46.8  Next: gamma regimes
 */

const END = 46.8;
const RANGE = 900_000;
const NET_BY_STRIKE = STRIKES.map(
	(strike) => contribution(strike, "call") + contribution(strike, "put"),
);

function layout(width: number) {
	const frame = filmFrame(width);
	const { height, narrow } = frame;
	// Room on the left for the axis's "+$500k".
	const left = Math.max(frame.margin, narrow ? 60 : 0);
	const right = width * 0.965;
	const top = height * (narrow ? 0.4 : 0.3);
	const bottom = height * 0.86;
	const middle = (top + bottom) / 2;
	const slot = (right - left) / STRIKES.length;
	return {
		...frame,
		left,
		right,
		top,
		bottom,
		middle,
		slot,
		barX: (i: number) => left + slot * (i + 0.5),
		barWidth: Math.min(slot * 0.5, 44),
		y: (dollars: number) => middle - (dollars / RANGE) * ((bottom - top) / 2),
		pair: narrow ? [0.27, 0.73] : [0.32, 0.68],
	};
}

const copy = {
	title: ["GEX", "GEX"],
	titleSub: [
		"a gamma exposure snapshot, and what it stands on",
		"Gamma 敞口快照，以及它建立在什么之上",
	],
	qTag: ["ALFA GEX, on a dashboard", "ALFA GEX，某个面板"],
	q1: ["which sign?", "哪个符号？"],
	q2: ["which contracts?", "哪些合约？"],
	q3: ["which close?", "哪个收盘？"],
	chainHead: [
		`One contract: the Oct 18 ${FOCUS_STRIKE} call.`,
		`一个合约：10月18日 ${FOCUS_STRIKE} 看涨。`,
	],
	tGamma: ["gamma, model, per $1", "Gamma（模型），每 $1"],
	tOi: ["× open interest, Friday's close", "× 未平仓量（周五收盘）"],
	tShares: ["× 100 shares", "× 100 股"],
	tSpot: [`× $${SPOT} × 1%: per 1% move`, `× $${SPOT} × 1%：每 1% 变动`],
	tLong: ["× sign: dealers assumed long", "× 符号：假设做市商做多"],
	tShort: ["× sign: dealers assumed short", "× 符号：假设做市商做空"],
	signHead: [
		"The sign is an assumption, not a reading.",
		"符号是假设，不是读数。",
	],
	signHeadShort: ["The sign is an assumption.", "符号是假设。"],
	profileHead: [
		"The whole Oct 18 chain, by strike.",
		"完整的 10月18日 期权链，按行权价。",
	],
	profileHeadShort: ["The whole chain, by strike.", "整条链，按行权价。"],
	netHead: [
		"Net: negative to $100, positive from $105.",
		"净值：$100 及以下为负，$105 起为正。",
	],
	netHeadShort: [
		"Net: − up to $100, + from $105.",
		"净值：$100 及以下负，$105 起正。",
	],
	axis: ["$ of delta per 1% move", "每 1% 变动的 Delta 金额"],
	calls: ["calls", "看涨"],
	puts: ["puts", "看跌"],
	net: ["net", "净值"],
	gross: ["gross", "总幅度"],
	twoLine: [
		"The net is a small difference of two large sides. Show the profile.",
		"净值是两个大部分之间的小差额。要展示分布。",
	],
	tradedHead: [
		"Only the traded contracts: the sign flips.",
		"只算有成交的合约：符号翻转。",
	],
	tradedHeadShort: ["Traded only: the sign flips.", "只算有成交的：符号翻转。"],
	missingHead: [
		"The 95 put is missing: a subtotal.",
		"95 看跌缺失：这只是小计。",
	],
	missingHeadShort: ["95 put missing: a subtotal.", "95 看跌缺失：只是小计。"],
	missing: ["missing", "缺失"],
	known: ["known subtotal", "已知小计"],
	claimBig: ["GEX is a model, not a reading.", "GEX 是模型，不是读数。"],
	claimSub: [
		"Declare the sign, the chain and the OI close.",
		"说明符号、期权链和未平仓量的收盘时点。",
	],
	nextBig: ["Next: gamma regimes", "下一课：Gamma 状态"],
	nextSub: [
		"what hedging does above and below zero gamma",
		"零 Gamma 上下的对冲有何不同",
	],
} as const satisfies Record<string, Copy>;

const chainSteps = [
	{ tag: copy.tGamma, text: `${FOCUS_GAMMA}` },
	{ tag: copy.tOi, text: `× ${count(FOCUS_OI)}` },
	{ tag: copy.tShares, text: `= ${count(SHARES)} shares/$1` },
	{ tag: copy.tSpot, text: `= ${money(LONG, false)}` },
] as const;

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
	const { height: H, type: T, room, narrow } = L;
	const W = width;
	const id = useId().replace(/:/g, "");
	const headline = (name: string, text: Copy, short: Copy) => (
		<Lines
			name={name}
			text={t(narrow ? short : text)}
			x={L.margin}
			y={L.headY}
			size={T.head}
			maxWidth={room}
			anchor="start"
		/>
	);
	/** The chain rows: a tag on the left, the figure on the right. */
	const rowY = (i: number) =>
		H * (narrow ? 0.34 : 0.3) + i * H * (narrow ? 0.12 : 0.115);
	const figure = narrow ? T.body * 1.15 : T.head;
	const figX = narrow ? W - L.margin * 0.5 : W * 0.86;
	const tagX = L.margin;
	const shareLabel = (text: string) =>
		locale === "zh" ? text.replace("shares/$1", "股/$1") : text;
	const missingIndex = STRIKES.indexOf(Number(MISSING[0].replace("P", "")));
	return (
		<>
			<Backdrop frame={L} />
			<defs>
				<Hatch id={`hatch-${id}`} />
			</defs>

			<g data-f="depth">
				<g data-f="world">
					<g data-f="chart">
						{[-RANGE / 1.8, 0, RANGE / 1.8].map((tick) => (
							<g key={tick}>
								<path
									d={`M${L.left} ${L.y(tick)}H${L.right}`}
									className={tick === 0 ? "wt-axis" : "wt-grid"}
								/>
								<text
									x={L.left - 8}
									y={L.y(tick) + 4}
									textAnchor="end"
									className="wt-small"
								>
									{tick === 0
										? "0"
										: narrow
											? money(tick).replace("$", "")
											: money(tick)}
								</text>
							</g>
						))}
						<text x={L.left} y={L.top - 12} className="wt-small">
							{t(copy.axis)}
						</text>
						{STRIKES.map((strike, i) => (
							<text
								key={strike}
								x={L.barX(i)}
								y={L.bottom + 16}
								textAnchor="middle"
								className="wt-small"
							>
								{`$${strike}`}
							</text>
						))}
						{STRIKES.map((strike, i) =>
							(["call", "put"] as const).map((side) => (
								<rect
									key={key(strike, side)}
									data-f={`bar-${key(strike, side)}`}
									className="wt-film-bar"
									data-tone={side === "call" ? "gain" : "loss"}
									x={L.barX(i) - L.barWidth / 2}
									y={L.y(0)}
									width={L.barWidth}
									height={0}
									rx={2}
								/>
							)),
						)}
						{STRIKES.map((strike, i) => (
							<rect
								key={`net-${strike}`}
								data-f={`net-${i}`}
								className="wt-film-bar"
								data-tone="total"
								x={L.barX(i) - L.barWidth * 0.32}
								y={L.y(0)}
								width={L.barWidth * 0.64}
								height={0}
								rx={2}
							/>
						))}
						<g data-f="missing">
							<rect
								x={L.barX(missingIndex) - L.barWidth / 2 - 2}
								y={L.y(0)}
								width={L.barWidth + 4}
								height={L.y(-RANGE) - L.y(0)}
								fill={`url(#hatch-${id})`}
							/>
							<text
								x={L.barX(missingIndex)}
								y={L.y(-RANGE) - 6}
								textAnchor="middle"
								className="wt-small wt-halo"
							>
								{t(copy.missing)}
							</text>
						</g>
					</g>
				</g>
			</g>
			<g data-f="meter">
				{(["calls", "puts", "net", "known"] as const).map((name) => (
					<Word
						key={name}
						name={`m-tag-${name}`}
						x={L.right}
						y={L.headY + T.head * 1.25}
						size={T.small}
						anchor="end"
						className="wt-film-tag"
					>
						{t(copy[name]).toUpperCase()}
					</Word>
				))}
				<Word
					name="m-value"
					x={L.right}
					y={L.headY + T.head * 1.25 + T.num * 1.05}
					size={T.num}
					anchor="end"
					className="wt-film-num wt-film-accent"
				>
					0
				</Word>
			</g>

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				<Word
					name="q-tag"
					x={W / 2}
					y={H * 0.27}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.qTag).toUpperCase()}
				</Word>
				<Word
					name="q-big"
					x={W / 2}
					y={H * 0.27 + T.big * 1.05}
					size={T.big}
					className="wt-film-num wt-film-loss"
				>
					{money(NET)}
				</Word>
				{([copy.q1, copy.q2, copy.q3] as const).map((question, i) => (
					<Word
						key={question[0]}
						name={`q-${i}`}
						x={narrow ? W / 2 : W * (0.22 + i * 0.28)}
						y={narrow ? H * (0.66 + i * 0.1) : H * 0.74}
						size={T.head}
						className="wt-film-type wt-film-accent"
					>
						{t(question)}
					</Word>
				))}
			</g>
			<g data-f="chain">
				{headline("c-head", copy.chainHead, copy.chainHead)}
				{chainSteps.map((step, i) => (
					<g key={step.tag[0]}>
						<Lines
							name={`c-tag-${i}`}
							text={t(step.tag)}
							x={tagX}
							y={rowY(i)}
							size={narrow ? T.small : T.body}
							maxWidth={narrow ? W * 0.5 : W * 0.5}
							anchor="start"
							className="wt-film-type wt-film-dim"
						/>
						<Word
							name={`c-num-${i}`}
							x={figX}
							y={rowY(i)}
							size={figure}
							anchor="end"
							className="wt-film-num"
						>
							{shareLabel(step.text)}
						</Word>
					</g>
				))}
				<Lines
					name="c-tag-long"
					text={t(copy.tLong)}
					x={tagX}
					y={rowY(4)}
					size={narrow ? T.small : T.body}
					maxWidth={W * 0.5}
					anchor="start"
					className="wt-film-type wt-film-accent"
				/>
				<Lines
					name="c-tag-short"
					text={t(copy.tShort)}
					x={tagX}
					y={rowY(4)}
					size={narrow ? T.small : T.body}
					maxWidth={W * 0.5}
					anchor="start"
					className="wt-film-type wt-film-accent"
				/>
				<Word
					name="c-long"
					x={figX}
					y={rowY(4) + figure * 0.3}
					size={figure * 1.5}
					anchor="end"
					className="wt-film-num wt-film-gain"
				>
					{money(LONG)}
				</Word>
				<Word
					name="c-short"
					x={figX}
					y={rowY(4) + figure * 0.3}
					size={figure * 1.5}
					anchor="end"
					className="wt-film-num wt-film-loss"
				>
					{money(-LONG)}
				</Word>
			</g>
			<Lines
				name="s-head"
				text={t(narrow ? copy.signHeadShort : copy.signHead)}
				x={L.margin}
				y={L.headY + lineCount(t(copy.chainHead), room, T.head) * T.head * 1.35}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
			{headline("p-head", copy.profileHead, copy.profileHeadShort)}
			{headline("n-head", copy.netHead, copy.netHeadShort)}
			<Brackets name="lock-two" glow />
			<g data-f="two">
				{(
					[
						[copy.net, money(NET), "wt-film-loss"],
						[copy.gross, money(GROSS, false), ""],
					] as const
				).map(([tag, num, tone], i) => (
					<g key={tag[0]}>
						<Word
							name={`w-tag-${i}`}
							x={W * L.pair[i]}
							y={H * 0.3}
							size={T.small}
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`w-num-${i}`}
							x={W * L.pair[i]}
							y={H * 0.3 + T.big * 0.95}
							// Both figures at one size, the longer's six characters leaving clear space
							// between them.
							size={Math.min(
								T.big * 0.85,
								(W * (L.pair[1] - L.pair[0]) * 0.7) / (6 * 0.62),
							)}
							className={`wt-film-num ${tone}`}
						>
							{num}
						</Word>
					</g>
				))}
				<Lines
					name="w-line"
					text={t(copy.twoLine)}
					x={W / 2}
					y={H * 0.72}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("t-head", copy.tradedHead, copy.tradedHeadShort)}
			{headline("x-head", copy.missingHead, copy.missingHeadShort)}
			<g data-f="claim">
				<Lines
					name="z-big"
					text={t(copy.claimBig)}
					x={W / 2}
					y={H * 0.46}
					size={T.title}
					maxWidth={room}
				/>
				<Lines
					name="z-sub"
					text={t(copy.claimSub)}
					x={W / 2}
					y={
						H * 0.46 +
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
	const { tl, one, kids, show, hide, rise, sink } = d;
	/** A figure lands slightly large and settles, without overshoot: it is data. */
	const land = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.12, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const flat = (name: string) =>
		kids(name).flatMap((el) => (el.tagName === "g" ? [...el.children] : [el]));
	const meter = one<SVGTextElement>("m-value");
	const bar = (strike: number, side: "call" | "put") =>
		one(`bar-${key(strike, side)}`);
	const grow = (el: Element, value: number, at: number, duration = 0.5) =>
		tl.fromTo(
			el,
			{ attr: { y: L.y(0), height: 0 } },
			{
				attr: {
					y: Math.min(L.y(0), L.y(value)),
					height: Math.abs(L.y(value) - L.y(0)),
				},
				duration,
				ease: "power3.out",
			},
			at,
		);
	const dollars = (value: number) => money(Math.round(value));
	/** The meter's tag changes from above: from below it would cross the figure. */
	const retag = (from: string, to: string, at: number) => {
		hide(one(from), at);
		show(one(to), at + 0.35, "above");
	};
	const lockTwo = one<SVGGraphicsElement>("lock-two");

	d.hidden([
		...STRIKES.map((_, i) => one(`net-${i}`)),
		one("missing"),
		...kids("meter"),
		...flat("q"),
		...flat("chain"),
		...["s-head", "p-head", "n-head", "t-head", "x-head"].map((name) =>
			one(name),
		),
		...flat("two"),
		lockTwo,
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: a number on a dashboard ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	land(one("q-big"), 4.8);
	for (const i of [0, 1, 2]) show(one(`q-${i}`), 5.8 + i * 0.5, "below");

	// ——— chain: one contract, every input declared ———
	tl.addLabel("chain", 9.6);
	hide(flat("q"), 9.6);
	show(one("c-head"), 9.8, "above");
	chainSteps.forEach((_, i) => {
		show(one(`c-tag-${i}`), 10.3 + i);
		show(one(`c-num-${i}`), 10.5 + i, "right");
	});
	show(one("c-tag-long"), 14.2);
	land(one("c-long"), 14.4);
	// The other sign: same inputs, opposite number.
	show(one("s-head"), 15.4);
	d.swap(one("c-tag-long"), one("c-tag-short"), 15.4);
	d.flip(one("c-long"), one("c-short"), 15.6);

	// ——— profile: the whole chain, calls up, puts down ———
	tl.addLabel("profile", 19);
	hide([...flat("chain"), one("s-head")], 19.0);
	show(one("p-head"), 19.35, "above");
	rise(19.4);
	show([one("m-tag-calls"), meter], 20.0, "above");
	let calls = 0;
	STRIKES.forEach((strike, i) => {
		const value = contribution(strike, "call");
		grow(bar(strike, "call"), value, 20.2 + i * 0.12);
		d.count(meter, calls + value, 20.2 + i * 0.12, dollars, calls, 0.4);
		calls += value;
	});
	retag("m-tag-calls", "m-tag-puts", 21.6);
	let puts = 0;
	STRIKES.forEach((strike, i) => {
		const value = contribution(strike, "put");
		grow(bar(strike, "put"), value, 21.9 + i * 0.12);
		d.count(
			meter,
			puts + value,
			21.9 + i * 0.12,
			dollars,
			i ? puts : CALLS,
			0.4,
		);
		puts += value;
	});
	// Net by strike.
	d.swap(one("p-head"), one("n-head"), 23.4);
	retag("m-tag-puts", "m-tag-net", 23.4);
	tl.to(
		STRIKES.flatMap((strike) => [bar(strike, "call"), bar(strike, "put")]),
		{ opacity: 0.22, duration: 0.5 },
		23.7,
	);
	NET_BY_STRIKE.forEach((value, i) => {
		tl.set(one(`net-${i}`), { opacity: 1 }, 23.9);
		grow(one(`net-${i}`), value, 23.9 + i * 0.1, 0.45);
	});
	d.count(meter, NET, 23.9, dollars, PUTS, 0.9);
	// Cut: the net against the gross. The hero: a small difference of two large sides.
	hide([one("n-head"), ...kids("meter")], 27.3);
	sink(27.3);
	show(one("w-tag-0"), 27.6);
	land(one("w-num-0"), 27.8);
	show(one("w-tag-1"), 28.2);
	land(one("w-num-1"), 28.4);
	d.lock(lockTwo, 29.0, {
		around: [one("w-tag-0"), one("w-num-0"), one("w-tag-1"), one("w-num-1")],
		pad: 10,
	});
	tl.addLabel("hero-lock", 29.0);
	show(one("w-line"), 29.4);

	// ——— coverage: which contracts, and what's missing ———
	tl.addLabel("coverage", 32);
	hide([...flat("two"), lockTwo], 32.0);
	tl.set(
		STRIKES.map((_, i) => one(`net-${i}`)),
		{ opacity: 0 },
		32.2,
	);
	tl.set(
		STRIKES.flatMap((strike) => [bar(strike, "call"), bar(strike, "put")]),
		{ opacity: 1 },
		32.2,
	);
	show(one("t-head"), 32.35, "above");
	rise(32.4);
	show([one("m-tag-net"), meter], 32.8, "above");
	d.count(meter, NET, 32.8, dollars, NET, 0.01);
	tl.to(
		STRIKES.flatMap((strike) =>
			(["call", "put"] as const)
				.filter((side) => !TRADED.includes(key(strike, side)))
				.map((side) => bar(strike, side)),
		),
		{ opacity: 0.12, duration: 0.5 },
		33.0,
	);
	d.count(meter, tradedOnly, 33.2, dollars, NET, 0.8);
	// Back to the whole chain, but the 95 put never arrived.
	tl.to(
		STRIKES.flatMap((strike) => [bar(strike, "call"), bar(strike, "put")]),
		{ opacity: 1, duration: 0.4 },
		36.0,
	);
	d.swap(one("t-head"), one("x-head"), 35.9);
	retag("m-tag-net", "m-tag-known", 36.2);
	tl.to(bar(95, "put"), { opacity: 0, duration: 0.4 }, 36.4);
	tl.to(one("missing"), { opacity: 1, duration: 0.5 }, 36.6);
	d.count(meter, withGap, 36.6, dollars, tradedOnly, 0.8);
	// Cut: the claim.
	hide([one("x-head"), ...kids("meter")], 39.8);
	sink(39.8);
	tl.fromTo(
		one("z-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
		40.2,
	);
	show(one("z-sub"), 40.6);

	// ——— next ———
	tl.addLabel("next", 44.3);
	hide(kids("claim"), 44.3);
	d.close(44.3);
	return tl;
}

export const gammaExposureFilm: Film = {
	id: "gamma-exposure",
	label: [
		"GEX, as a short film: a dashboard's −$512k and the questions under it; one contract, the Oct 18 110 call, built from gamma, open interest, 100 shares and a 1% move to $665k, then a sign that is an assumption; the whole Oct 18 chain by strike, calls +$1.79M and puts −$2.31M netting to −$512k of $4.10M gross; and coverage, where the traded contracts alone give +$1.14M and a missing put leaves only a subtotal",
		"GEX 短片：面板上的 −$512k 以及它背后的问题；一个合约，10月18日 110 看涨，由 Gamma、未平仓量、100 股和 1% 变动得出 $665k，再加上一个本身是假设的符号；按行权价的完整 10月18日 期权链，看涨 +$1.79M、看跌 −$2.31M，在 $4.10M 总幅度中净值为 −$512k；以及覆盖范围：只算有成交的合约得到 +$1.14M，缺了一个看跌就只剩小计",
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["GEX", "GEX"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "chain", label: ["One contract", "一个合约"] },
		{ id: "profile", label: ["The profile", "分布"] },
		{ id: "coverage", label: ["Coverage", "覆盖"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
