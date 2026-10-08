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
 * spot² × 1%, then a sign that is an assumption, and flipping it flips the number. Then
 * the whole Oct 18 chain as bars by strike, calls up and puts down, collapsing to a net
 * profile that changes sign between $100 and $105. The two sides' totals become two bars:
 * end to end they are the gross, $4.10M; side by side, the net is the sliver by which the
 * puts overhang the calls, −$512k. Last, coverage: only the traded contracts give
 * +$1.14M, and a missing put leaves a subtotal, not a total.
 *
 *   open      0–4        "GEX"
 *   question  4–8.9      "ALFA GEX: −$512k": which sign? which contracts?
 *   chain     8.9–18.65  0.0266 × 2,500 × 100 = 6,650 a $1; × $100² × 1% = $665k; × sign
 *   profile   18.65–33.75 calls +$1.79M, puts −$2.31M, net by strike; cut: the sides end to
 *                        end, $4.10M; side by side, the −$512k sliver, locked; then how
 *                        small: 12% of the gross
 *   coverage  33.75–45.85 traded only +$1.14M; the 95 put missing, +$330k known;
 *                        cut: "GEX is a model, not a reading."
 *   next      45.85–47.45 Next: gamma regimes
 */

const END = 47.45;
const RANGE = 900_000;
const NET_BY_STRIKE = STRIKES.map(
	(strike) => contribution(strike, "call") + contribution(strike, "put"),
);

/**
 * The hero's two bars, the calls' total above the puts': end to end they span the gross;
 * side by side, the puts overhang the calls by the net.
 */
function sides(frame: ReturnType<typeof filmFrame>) {
	const { width, height, narrow, room, type: T } = frame;
	const span = narrow ? room : room * 0.7;
	const x0 = (width - span) / 2;
	const unit = span / GROSS;
	const h = narrow ? 20 : 28;
	const y1 = height * 0.42;
	const y2 = y1 + h + 14;
	return {
		x0,
		span,
		h,
		y1,
		y2,
		calls: CALLS * unit,
		puts: -PUTS * unit,
		grossY: y1 + h + T.body + 18,
		/** The net, under the sliver it measures: its tag on the puts' tag line, then the figure. */
		netX: x0 + CALLS * unit,
		tagY: y2 + h + T.body + 4,
		netY: y2 + h + T.body + 4 + T.num * 1.6 * 0.95,
	};
}

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
		two: sides(frame),
	};
}

/** Leave room for both sign results even on a narrower phone. */
function signComparison(frame: ReturnType<typeof filmFrame>) {
	const { width, narrow, margin, type: T } = frame;
	const figure = narrow ? T.body * 1.15 : T.head;
	const figX = narrow ? width - margin * 0.5 : width * 0.7;
	const longX = narrow ? width * 0.38 : figX - figure * 1.5 * 6 - T.small * 8;
	return {
		figure,
		figX,
		longX,
		inputsX: (longX + figX - figure * 1.5 * 4.2) / 2,
	};
}

const copy = {
	title: ["GEX", "GEX"],
	titleSub: [
		"a gamma exposure snapshot, and what it stands on",
		"Gamma 敞口快照，以及它建立在什么之上",
	],
	qTag: ["ALFA GEX, on a dashboard", "ALFA GEX，某个面板"],
	qLine: ["Which sign? Which contracts?", "哪个符号？哪些合约？"],
	sidesHead: ["How big are the two sides?", "两边各有多大？"],
	share: [
		`${Math.round((-NET / GROSS) * 100)}% of ${money(GROSS, false)} gross`,
		`总幅度 ${money(GROSS, false)} 的 ${Math.round((-NET / GROSS) * 100)}%`,
	],
	chainHead: [
		`One contract: the Oct 18 ${FOCUS_STRIKE} call.`,
		`一个合约：10月18日 ${FOCUS_STRIKE} 看涨。`,
	],
	contract: [`Oct 18 ${FOCUS_STRIKE} call`, `10月18日 ${FOCUS_STRIKE} 看涨`],
	sameInputs: ["same inputs", "相同输入"],
	trackGross: [`${money(GROSS, false)} gross`, `总幅度 ${money(GROSS, false)}`],
	tGamma: ["gamma, model, per $1", "Gamma（模型），每 $1"],
	tOi: ["× open interest, Friday's close", "× 未平仓量（周五收盘）"],
	tShares: ["× 100 shares", "× 100 股"],
	tSpot: [`× $${SPOT}² × 1%: per 1% move`, `× $${SPOT}² × 1%：每 1% 变动`],
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
	axis: ["$ of delta per 1% move", "每 1% 变动的 Delta 金额"],
	calls: ["calls", "看涨"],
	puts: ["puts", "看跌"],
	net: ["net", "净值"],
	gross: ["gross", "总幅度"],
	twoHead: ["Small net, large sides.", "净值小，两边大。"],
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
	claimSub: ["Declare the sign and the contracts.", "说明符号和合约范围。"],
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
	const { figure, figX, inputsX } = signComparison(L);
	// The figures close to their tags, so each row reads as one line.
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
									data-tone="neutral"
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
								// On a phone the label is wider than its hatch: under the axis instead.
								y={narrow ? L.bottom + 30 : L.y(-RANGE) - 6}
								textAnchor="middle"
								className="wt-small wt-halo"
							>
								{t(copy.missing)}
							</text>
						</g>
					</g>
				</g>
			</g>
			{/* On a phone the meter stands in from the edge: its figure grows as it is carried. */}
			<g data-f="meter">
				{(["calls", "puts", "net", "known"] as const).map((name) => (
					<Word
						key={name}
						name={`m-tag-${name}`}
						x={narrow ? L.right - T.num * 1.2 : L.right}
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
					x={narrow ? L.right - T.num * 1.2 : L.right}
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
					className="wt-film-num wt-film-accent"
				>
					{money(NET)}
				</Word>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.72}
					size={T.head}
					maxWidth={room}
					className="wt-film-type wt-film-accent"
				/>
			</g>
			<g data-f="chain">
				{headline("c-head", copy.chainHead, copy.chainHead)}
				<Word
					name="c-contract"
					x={figX}
					y={rowY(0) - figure * 1.7}
					size={T.small}
					anchor="end"
					className="wt-film-tag"
				>
					{t(copy.contract)}
				</Word>
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
					y={rowY(4) - figure}
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
					className="wt-film-num wt-film-accent"
				>
					{money(LONG)}
				</Word>
				<Word
					name="c-short"
					x={figX}
					y={rowY(4) + figure * 2}
					size={figure * 1.5}
					anchor="end"
					className="wt-film-num wt-film-accent"
				>
					{money(-LONG)}
				</Word>
				<Word
					name="c-same-inputs"
					x={inputsX}
					y={rowY(4) + figure * 2}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.sameInputs)}
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
			<Brackets name="lock-two" glow />
			<g data-f="two">
				<g data-f="two-calls">
					<rect
						data-f="two-calls-bar"
						className="wt-film-bar"
						data-tone="neutral"
						x={L.two.x0}
						y={L.two.y1}
						width={L.two.calls}
						height={L.two.h}
						rx={2}
					/>
					<Word
						name="two-calls-tag"
						x={L.two.x0}
						y={L.two.y1 - 8}
						size={T.body}
						anchor="start"
						className="wt-film-num"
					>
						{`${t(copy.calls).toUpperCase()} ${money(CALLS)}`}
					</Word>
				</g>
				<g data-f="two-puts">
					<rect
						data-f="two-puts-bar"
						className="wt-film-bar"
						data-tone="neutral"
						x={L.two.x0}
						y={L.two.y2}
						width={L.two.puts}
						height={L.two.h}
						rx={2}
					/>
					<Word
						name="two-puts-tag"
						x={L.two.x0}
						y={L.two.tagY}
						size={T.body}
						anchor="start"
						className="wt-film-num"
					>
						{`${t(copy.puts).toUpperCase()} ${money(PUTS)}`}
					</Word>
				</g>
				<g data-f="two-gross">
					<path
						d={`M${L.two.x0} ${L.two.grossY - 5}V${L.two.grossY + 5}M${L.two.x0} ${L.two.grossY}H${L.two.x0 + L.two.span}M${L.two.x0 + L.two.span} ${L.two.grossY - 5}V${L.two.grossY + 5}`}
						className="wt-axis"
					/>
					<Word
						name="two-gross-tag"
						x={L.two.x0 + L.two.span / 2}
						y={L.two.grossY + T.body + 6}
						size={T.body}
						className="wt-film-num"
					>
						{`${t(copy.gross).toUpperCase()} ${money(GROSS, false)}`}
					</Word>
				</g>
				<rect
					data-f="two-sliver"
					className="wt-film-bar"
					data-tone="total"
					x={L.two.x0 + L.two.calls}
					y={L.two.y2}
					width={L.two.puts - L.two.calls}
					height={L.two.h}
					rx={2}
				/>
				<path
					data-f="two-net-link"
					d={`M${L.two.netX + (L.two.puts - L.two.calls) / 2} ${L.two.y2 + L.two.h + 2}H${L.two.netX - 12}V${L.two.netY - T.num * 0.8}H${L.two.netX - 8}`}
					className="wt-axis"
				/>
				<Word
					name="two-net-num"
					x={L.two.netX}
					y={L.two.netY}
					size={T.num * 1.6}
					anchor="start"
					className="wt-film-num wt-film-accent"
				>
					{money(NET)}
				</Word>
				<Word
					name="two-net-tag"
					x={L.two.netX}
					y={L.two.tagY}
					size={T.small}
					anchor="start"
					className="wt-film-tag"
				>
					{t(copy.net).toUpperCase()}
				</Word>
				<Word
					name="two-share"
					x={L.two.netX}
					y={L.two.netY + T.body * 2.9}
					size={T.body}
					anchor="start"
					className="wt-film-type wt-film-dim"
				>
					{t(copy.share)}
				</Word>
				{/* How small: the gross as a track, the net's share of it lit, under the sliver. */}
				<rect
					data-f="two-track"
					className="wt-film-bar"
					data-tone="neutral"
					x={L.two.x0}
					y={L.two.netY + T.body * 3.9}
					width={L.two.span}
					height={6}
					rx={3}
				/>
				<rect
					data-f="two-track-net"
					className="wt-film-bar"
					data-tone="total"
					x={L.two.x0 + L.two.calls}
					y={L.two.netY + T.body * 3.9}
					width={L.two.puts - L.two.calls}
					height={6}
					rx={3}
				/>
				<Word
					name="two-track-label"
					x={L.two.x0}
					y={L.two.netY + T.body * 3.9 + T.small + 16}
					size={T.small}
					anchor="start"
					className="wt-film-tag"
				>
					{t(copy.trackGross)}
				</Word>
			</g>
			{headline("w1-head", copy.sidesHead, copy.sidesHead)}
			<Lines
				name="w-head"
				text={t(copy.twoHead)}
				x={L.margin}
				y={L.headY + lineCount(t(copy.sidesHead), room, T.head) * T.head * 1.35}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
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
	const { figure, figX, longX } = signComparison(L);
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
		...["s-head", "p-head", "w1-head", "w-head", "t-head", "x-head"].map(
			(name) => one(name),
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
	show(one("q-line"), 5.4, "below");

	// ——— chain: one contract, every input declared ———
	tl.addLabel("chain", 8.9);
	hide(flat("q"), 8.9);
	tl.fromTo(
		one("c-contract"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.1 },
		8.95,
	);
	show(one("c-head"), 9.1, "above");
	chainSteps.forEach((_, i) => {
		show(one(`c-tag-${i}`), 9.4 + i * 0.5);
		show(one(`c-num-${i}`), 9.6 + i * 0.5, "right");
	});
	show(one("c-tag-long"), 11.4);
	land(one("c-long"), 11.6);
	// The other sign: same inputs, opposite number.
	show(one("s-head"), 14.9);
	hide(one("c-tag-long"), 14.9);
	show(one("c-tag-short"), 15.15, "above");
	// Keep the first assumption beside the second, rather than erasing it.
	// Step down before moving sideways, clear of the incoming assumption label.
	tl.to(one("c-long"), { y: figure * 1.7, opacity: 0.3, duration: 0.2 }, 14.9);
	tl.to(
		one("c-long"),
		{
			x: longX - figX,
			duration: 0.35,
			ease: "power2.inOut",
		},
		15.1,
	);
	show(one("c-short"), 15.45, "below", 0.35);
	tl.fromTo(
		one("c-same-inputs"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.25 },
		15.8,
	);

	// ——— profile: the whole chain, calls up, puts down ———
	tl.addLabel("profile", 18.65);
	hide([...flat("chain"), one("s-head")], 18.65);
	show(one("p-head"), 19, "above");
	rise(19.05);
	show([one("m-tag-calls"), meter], 19.45, "above");
	// Each strike's count lands before the next starts: every reading is a real sum.
	let calls = 0;
	STRIKES.forEach((strike, i) => {
		const value = contribution(strike, "call");
		grow(bar(strike, "call"), value, 19.65 + i * 0.12);
		d.count(meter, calls + value, 19.65 + i * 0.12, dollars, calls, 0.12);
		calls += value;
	});
	retag("m-tag-calls", "m-tag-puts", 20.65);
	let puts = 0;
	STRIKES.forEach((strike, i) => {
		const value = contribution(strike, "put");
		grow(bar(strike, "put"), value, 20.85 + i * 0.12);
		d.count(meter, puts + value, 20.85 + i * 0.12, dollars, puts, 0.12);
		puts += value;
	});
	// Net by strike: negative up to $100, positive from $105.
	retag("m-tag-puts", "m-tag-net", 22.15);
	tl.to(
		STRIKES.flatMap((strike) => [bar(strike, "call"), bar(strike, "put")]),
		{ opacity: 0.22, duration: 0.5 },
		22.35,
	);
	NET_BY_STRIKE.forEach((value, i) => {
		tl.set(one(`net-${i}`), { opacity: 1 }, 22.45);
		grow(one(`net-${i}`), value, 22.45 + i * 0.1, 0.45);
	});
	d.count(meter, NET, 22.45, dollars, PUTS, 0.9);
	// Cut: the two sides' totals as bars, and a question for them. End to end, the gross;
	// side by side, the net.
	d.swap(one("p-head"), one("w1-head"), 24.65);
	sink(24.65);
	const callsSide = one("two-calls");
	const putsSide = one("two-puts");
	const widen = (target: Element, width: number, at: number) =>
		tl.fromTo(
			target,
			{ attr: { width: 0 } },
			{ attr: { width }, duration: 0.5, ease: "power3.out" },
			at,
		);
	tl.set([...callsSide.children], { opacity: 1 }, 24.95);
	widen(one("two-calls-bar"), L.two.calls, 24.95);
	tl.set([...putsSide.children], { opacity: 1 }, 25.25);
	widen(one("two-puts-bar"), L.two.puts, 25.25);
	// End to end: along its own row first, then up, so the bars never cross.
	tl.to(
		putsSide,
		{ x: L.two.calls, duration: 0.35, ease: "power2.inOut" },
		25.85,
	);
	tl.to(
		putsSide,
		{ y: L.two.y1 - L.two.y2, duration: 0.3, ease: "power2.inOut" },
		26.2,
	);
	const gross = [...one("two-gross").children];
	show(gross, 26.5);
	// Back: the gross has gone; down first, then along.
	hide(gross, 28, 0.25);
	tl.to(putsSide, { y: 0, duration: 0.3, ease: "power2.inOut" }, 28.25);
	tl.to(putsSide, { x: 0, duration: 0.35, ease: "power2.inOut" }, 28.55);
	// The overhang is the net: the meter's figure comes down beside it.
	tl.set(one("two-sliver"), { opacity: 1 }, 28.9);
	widen(one("two-sliver"), L.two.puts - L.two.calls, 28.9);
	hide(one("m-tag-net"), 28.9);
	d.carry(meter, one<SVGGraphicsElement>("two-net-num"), 28.9, {
		duration: 0.8,
		arc: "y",
	});
	tl.fromTo(
		one("two-net-tag"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.2 },
		29.7,
	);
	// The hero: a small net between two large sides, and how small.
	d.lock(lockTwo, 29.75, {
		around: [one("two-net-num"), one("two-net-tag")],
		pad: 6,
	});
	tl.addLabel("hero-lock", 29.75);
	show(one("w-head"), 29.75);
	d.trace(one<SVGPathElement>("two-net-link"), 30.2, { duration: 0.35 });
	// After the lock: how small, against the gross the bars just spanned.
	show(one("two-share"), 30.2, "below");
	// Then how small, drawn: the gross as a track; the net's share of it lights under the sliver.
	tl.set(one("two-track"), { opacity: 1 }, 30.9);
	tl.fromTo(
		one("two-track"),
		{ attr: { width: 0 } },
		{ attr: { width: L.two.span }, duration: 0.6, ease: "power2.out" },
		30.9,
	);
	show(one("two-track-label"), 30.9, "below");
	tl.to(one("two-track-net"), { opacity: 1, duration: 0.4 }, 31.6);

	// ——— coverage: which contracts, and what's missing ———
	tl.addLabel("coverage", 33.75);
	hide([...flat("two"), lockTwo, one("w1-head"), one("w-head")], 33.75);
	tl.set(
		STRIKES.map((_, i) => one(`net-${i}`)),
		{ opacity: 0 },
		33.95,
	);
	tl.set(
		STRIKES.flatMap((strike) => [bar(strike, "call"), bar(strike, "put")]),
		{ opacity: 1 },
		33.95,
	);
	rise(33.95);
	show([one("m-tag-net"), meter], 34.05, "above");
	d.count(meter, NET, 34.05, dollars, NET, 0.01);
	tl.to(
		STRIKES.flatMap((strike) =>
			(["call", "put"] as const)
				.filter((side) => !TRADED.includes(key(strike, side)))
				.map((side) => bar(strike, side)),
		),
		{ opacity: 0.12, duration: 0.5 },
		34.15,
	);
	show(one("t-head"), 34.2, "above");
	d.count(meter, tradedOnly, 34.3, dollars, NET, 0.8);
	// Back to the whole chain, but the 95 put never arrived.
	d.swap(one("t-head"), one("x-head"), 37.7);
	tl.to(
		STRIKES.flatMap((strike) => [bar(strike, "call"), bar(strike, "put")]),
		{ opacity: 1, duration: 0.4 },
		37.7,
	);
	retag("m-tag-net", "m-tag-known", 37.9);
	tl.to(bar(95, "put"), { opacity: 0, duration: 0.4 }, 38.05);
	tl.to(one("missing"), { opacity: 1, duration: 0.5 }, 38.25);
	d.count(meter, withGap, 38.25, dollars, tradedOnly, 0.8);
	// Cut: the claim.
	hide([one("x-head"), ...kids("meter")], 41.55);
	sink(41.55);
	tl.fromTo(
		one("z-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
		41.85,
	);
	show(one("z-sub"), 42.25);

	// ——— next ———
	// Coverage is at minimum holds: recover 0.4 s from the end card and use 0.1 s of headroom.
	tl.addLabel("next", 45.85);
	hide(kids("claim"), 45.85);
	d.close(45.85);
	return tl;
}

export const gammaExposureFilm: Film = {
	id: "gamma-exposure",
	label: [
		"GEX, as a short film: a dashboard's −$512k and the questions under it; one contract, the Oct 18 110 call, built from gamma, open interest, 100 shares and spot squared times 1% to $665k, then a sign that is an assumption; the whole Oct 18 chain by strike, calls +$1.79M and puts −$2.31M, end to end a gross of $4.10M and side by side a net of −$512k, the sliver by which the puts overhang the calls; and coverage, where the traded contracts alone give +$1.14M and a missing put leaves only a subtotal",
		"GEX 短片：面板上的 −$512k 以及它背后的问题；一个合约，10月18日 110 看涨，由 Gamma、未平仓量、100 股和现价平方乘 1% 得出 $665k，再加上一个本身是假设的符号；按行权价的完整 10月18日 期权链，看涨 +$1.79M、看跌 −$2.31M，首尾相接是 $4.10M 的总幅度，并排对比时看跌多出看涨的那一小段就是 −$512k 的净值；以及覆盖范围：只算有成交的合约得到 +$1.14M，缺了一个看跌就只剩小计",
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
