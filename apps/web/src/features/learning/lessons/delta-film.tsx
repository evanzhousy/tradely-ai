import { gsap } from "gsap";
import { useId } from "react";
import { type Copy, pick, signedCount, signedUsd } from "@/content/world";
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
	TitleCard,
	Word,
} from "../walkthrough/film-kit";
import { textWidth } from "../walkthrough/text-measure";
import {
	CALL_DELTA,
	curve,
	fixed2,
	holders,
	MOVE,
	moveDollars,
	PUT_DELTA,
	perContract,
	positionDelta,
	price,
	SPOT,
	signedPrice,
	stock,
	valueAt,
	X_RANGE,
} from "./delta-model";

/*
 * Delta, as a film. A dark stage; type carries the claims and the chart carries the proof,
 * each in its own shot, cut together. Subject: the number 0.52, born on the chart and
 * carried through the rest of the film. Secondary: the marker and its tangent. Background:
 * a grid that drifts, slowly, the whole way through.
 *
 *   open      0–4        "Delta" wipes on; the title shrinks into the corner as a tag
 *   question  4–9.5      ALFA $100 → $101: the call moves by about… ?
 *   slope     9.5–18.5   the chart rises from the depth; push in; the $1 step, the $0.52
 *                        rise; cut to 0.52, full frame
 *   put       18.5–24.5  the number flips to −0.48 while the curve folds into the put
 *   position  24.5–35.3  hero: 0.52 × 100 × 16 = +832, locked; Ben's chain beside it, the
 *                        sign flipped; +$0.40 in ALFA, in dollars, for each
 *   limits    35.3–40.9  the marker rides the curve, a ghost rides the line; cut: "Delta is
 *                        local."
 *   next      45.4–47.4  Next: gamma
 */

const Y_RANGE = [-2, 16] as const;
const V0 = valueAt("call", SPOT);
const P0 = valueAt("put", SPOT);
const [you, ben] = holders;
const call = curve("call");
const put = curve("put");
const UP = 10;
const DOWN = -10;
const END = 47.4;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height, narrow } = frame;
	// A phone's axis labels sit left of the plot: room for them inside the frame's edge.
	const left = frame.margin + (narrow ? 18 : 0);
	const right = width * 0.965;
	const top = height * 0.17;
	const bottom = height * 0.84;
	const x = (value: number) =>
		left + ((value - X_RANGE[0]) / (X_RANGE[1] - X_RANGE[0])) * (right - left);
	const y = (value: number) =>
		bottom -
		((value - Y_RANGE[0]) / (Y_RANGE[1] - Y_RANGE[0])) * (bottom - top);
	const path = (points: readonly (readonly [number, number])[]) =>
		points
			.map(
				([px, py], i) =>
					`${i ? "L" : "M"}${x(px).toFixed(1)} ${y(py).toFixed(1)}`,
			)
			.join("");
	/** The chain of a position: one line per beat, down the middle of the frame. */
	// A phone's headline wraps, so its chain starts lower and packs a little tighter.
	const rows = (
		narrow ? [0.35, 0.45, 0.55, 0.64, 0.73] : [0.31, 0.42, 0.53, 0.64, 0.75]
	).map((f) => height * f);
	const T = frame.type;
	const posY = rows[3] + T.body * 1.2 + T.num * 1.35 * 0.95;
	// The caption clears the locked figure's brackets by more than the arms' own width.
	const equivY = posY + T.num * 0.45 + T.small * 2.2;
	// On a phone the move's chip sits under the two positions, not between them.
	const chipY = narrow ? equivY + T.num * 1.3 : posY - T.num * 0.35;
	const payY = narrow ? chipY + T.num * 1.45 : equivY + T.num * 1.1;
	return {
		...frame,
		left,
		right,
		top,
		bottom,
		x,
		y,
		path,
		cx: (left + right) / 2,
		cy: (top + bottom) / 2,
		rows,
		posY,
		equivY,
		chipY,
		payY,
		/** How far the two positions stand from the middle once both are on stage. */
		side: width * (narrow ? 0.25 : 0.2),
	};
}

const copy = {
	title: ["Delta", "Delta"],
	titleSub: ["a local price sensitivity", "局部的价格敏感度"],
	qPrice: [`ALFA ${stock(SPOT)}`, `ALFA ${stock(SPOT)}`],
	qNext: [`→ ${stock(SPOT + 1)}`, `→ ${stock(SPOT + 1)}`],
	qLine: ["The Oct 18 100 call moves by about", "10月18日 100 看涨约变动"],
	perDollar: [
		`per $1 of ALFA, at ${stock(SPOT)}`,
		`ALFA 在 ${stock(SPOT)} 时，每变动 $1`,
	],
	deltaWord: ["delta, per $1 of ALFA", "Delta：ALFA 每变动 $1"],
	slopeHead: ["Up $1: what does the call gain?", "ALFA 涨 $1：看涨涨多少？"],
	putHead: ["Puts slope the other way.", "看跌期权的斜率方向相反。"],
	putSub: [
		`+$1 in ALFA takes about ${price(Math.abs(PUT_DELTA))} off the put.`,
		`ALFA 涨 $1，看跌约减少 ${price(Math.abs(PUT_DELTA))}。`,
	],
	chainHead: ["Keep the sign and the multiplier attached.", "保留符号与乘数。"],
	op100: ["× 100 shares per contract", "× 每张 100 股"],
	opYou: [
		`× ${signedCount(you.contracts)} contracts, you`,
		`× 你持有 ${signedCount(you.contracts)} 张`,
	],
	opBen: [
		`× ${signedCount(ben.contracts)} contracts, Ben`,
		`× Ben 持有 ${signedCount(ben.contracts)} 张`,
	],
	opYouShort: [
		`× ${signedCount(you.contracts)}, you`,
		`× 你 ${signedCount(you.contracts)} 张`,
	],
	opBenShort: [
		`× ${signedCount(ben.contracts)}, Ben`,
		`× Ben ${signedCount(ben.contracts)} 张`,
	],
	chip: [`ALFA +$${MOVE.toFixed(2)}`, `ALFA +$${MOVE.toFixed(2)}`],
	equivalents: ["share-equivalents of ALFA", "相当于这么多股 ALFA"],
	pay: [
		`If ALFA rises $${MOVE.toFixed(2)}: about ${signedUsd(moveDollars(you.contracts), 0)} for you, ${signedUsd(moveDollars(ben.contracts), 0)} for Ben.`,
		`ALFA 涨 $${MOVE.toFixed(2)}：你约 ${signedUsd(moveDollars(you.contracts), 0)}，Ben 约 ${signedUsd(moveDollars(ben.contracts), 0)}。`,
	],
	/** A phone's headline must stay on one line above the chart. */
	limitHeadShort: ["Where the straight line stops.", "直线在哪里不再成立。"],
	limitHead: [
		"Where the straight line stops being true.",
		"直线在哪里不再成立。",
	],
	model: ["model", "模型"],
	deltaAlone: ["delta alone", "仅用 delta"],
	missed: ["missed by", "相差"],
	below: ["no option is worth less than zero", "期权不可能为负"],
	belowShort: ["can't go below zero", "不会低于零"],
	localBig: ["Delta is local.", "Delta 是局部的。"],
	localSub: [
		"It describes small moves. Reprice big ones.",
		"它描述小幅变动；大幅变动要重新定价。",
	],
	nextBig: ["Next: gamma", "下一课：Gamma"],
	nextSub: ["the bend you just watched", "你刚才看到的那段弯曲"],
	axis: ["ALFA price today", "ALFA 今天的价格"],
	callLabel: ["call value, model", "看涨价值（模型）"],
	putLabel: ["put value, model", "看跌价值（模型）"],
	putShort: ["put, model", "看跌（模型）"],
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
	const { height: H, type: T } = L;
	const W = width;
	const id = useId().replace(/:/g, "");
	const mx = L.x(SPOT);
	const my = L.y(V0);
	const room = L.room;
	const nextWidth = textWidth(t(copy.qNext), T.num);
	const stepX = W / 2 + 8 + nextWidth / 2;
	const stepY = H * 0.4 - T.num * 1.15;
	const stepW = textWidth("+$1", T.small) + 14;
	const chipW = textWidth(t(copy.chip), T.small) + 16;
	return (
		<>
			<Backdrop frame={L} />
			<defs>
				<Hatch id={`hatch-${id}`} />
				<clipPath id={`left-${id}`}>
					<rect data-f="clip-left" x={mx} y={0} width={0} height={H} />
				</clipPath>
				<clipPath id={`right-${id}`}>
					<rect data-f="clip-right" x={mx} y={0} width={0} height={H} />
				</clipPath>
			</defs>
			{/* The chart: the proof. It rises from the depth when a shot needs it. */}
			<g data-f="depth">
				<g data-f="world">
					<g data-f="axes">
						{[0, 4, 8, 12, 16].map((tick) => (
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
									{`$${tick}`}
								</text>
							</g>
						))}
						{[90, 95, 100, 105, 110].map((tick) => (
							<text
								key={tick}
								x={L.x(tick)}
								y={L.bottom + 18}
								textAnchor="middle"
								className="wt-small"
							>
								{`$${tick}`}
							</text>
						))}
						<text
							x={L.right}
							y={L.bottom + 32}
							textAnchor="end"
							className="wt-small"
						>
							{t(copy.axis)}
						</text>
					</g>
					<rect
						data-f="below"
						x={L.left}
						y={L.y(0)}
						width={L.right - L.left}
						height={L.y(Y_RANGE[0]) - L.y(0)}
						fill={`url(#hatch-${id})`}
					/>
					<text
						data-f="below-label"
						x={L.right - 8}
						y={L.y(-1) + 4}
						textAnchor="end"
						className="wt-small wt-halo"
					>
						{t(L.narrow ? copy.belowShort : copy.below)}
					</text>
					<g clipPath={`url(#left-${id})`}>
						<path
							data-f="curve-a"
							className="wt-line-position"
							strokeDasharray="6 5"
							d={L.path(call)}
						/>
					</g>
					<g clipPath={`url(#right-${id})`}>
						<path
							data-f="curve-b"
							className="wt-line-position"
							strokeDasharray="6 5"
							d={L.path(call)}
						/>
					</g>
					<text
						data-f="curve-label-call"
						x={L.right - 4}
						y={L.y(call[call.length - 1][1]) - 8}
						textAnchor="end"
						className="wt-small wt-halo wt-label-position"
					>
						{t(copy.callLabel)}
					</text>
					{/* At the put's high left end: to its right the curve falls away from it. */}
					<text
						data-f="curve-label-put"
						x={L.left + 4}
						y={L.y(put[0][1]) - 16}
						textAnchor="start"
						className="wt-small wt-halo wt-label-position"
					>
						{t(L.narrow ? copy.putShort : copy.putLabel)}
					</text>
					<line
						data-f="tangent"
						className="wt-film-tangent"
						x1={mx}
						y1={my}
						x2={mx}
						y2={my}
					/>
					<g data-f="step">
						<line
							data-f="step-line"
							className="wt-film-step"
							x1={mx}
							y1={my}
							x2={L.x(SPOT + 1)}
							y2={my}
						/>
						<text
							data-f="step-label"
							x={(mx + L.x(SPOT + 1)) / 2}
							y={my + 16}
							textAnchor="middle"
							className="wt-small wt-halo wt-accent"
						>
							+$1
						</text>
					</g>
					<g data-f="riser">
						<line
							data-f="riser-line"
							className="wt-film-riser"
							x1={L.x(SPOT + 1)}
							y1={my}
							x2={L.x(SPOT + 1)}
							y2={my}
						/>
						<text
							data-f="riser-label"
							x={L.x(SPOT + 1) + 8}
							y={L.y(V0 + CALL_DELTA) + 14}
							className="wt-halo wt-accent wt-marker-label"
						>
							{signedPrice(CALL_DELTA)}
						</text>
					</g>
					<g data-f="ghost">
						<circle r={6} className="wt-film-ghost" />
					</g>
					<text data-f="ghost-label" className="wt-small wt-halo" />
					<line data-f="gap" className="wt-film-gap" />
					<text
						data-f="gap-label"
						className="wt-small wt-halo wt-loss wt-marker-label"
					/>
					<g data-f="marker">
						<circle data-f="ripple" r={6} className="wt-film-ripple" />
						<circle
							data-f="dot"
							r={6}
							className="wt-chip"
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
					</g>
					<text
						data-f="marker-label-call"
						x={mx}
						y={my - 14}
						textAnchor="middle"
						className="wt-halo wt-accent wt-marker-label"
					>
						{price(V0)}
					</text>
					<text
						data-f="marker-label-put"
						x={mx}
						y={L.y(P0) - 14}
						textAnchor="middle"
						className="wt-halo wt-accent wt-marker-label"
					>
						{price(P0)}
					</text>
					<text data-f="move-label" className="wt-halo wt-marker-label" />
				</g>
			</g>

			{/* The type: the claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				<Word
					name="q-price"
					x={W / 2 - 8}
					y={H * 0.4}
					size={T.num}
					anchor="end"
					className="wt-film-num"
				>
					{t(copy.qPrice)}
				</Word>
				<Word
					name="q-next"
					x={W / 2 + 8}
					y={H * 0.4}
					size={T.num}
					anchor="start"
					className="wt-film-num wt-film-accent"
				>
					{t(copy.qNext)}
				</Word>
				<g data-f="q-step">
					<rect
						x={stepX - stepW / 2}
						y={stepY - T.small - 4}
						width={stepW}
						height={T.small + 10}
						rx={6}
						className="wt-chip"
					/>
					<text
						x={stepX}
						y={stepY}
						textAnchor="middle"
						className="wt-chip-text"
						style={{ fontSize: T.small }}
					>
						+$1
					</text>
				</g>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.58}
					size={T.head}
					maxWidth={room}
				/>
				<Word name="q-mark" x={W / 2} y={H * 0.78} size={T.title}>
					?
				</Word>
			</g>
			<g data-f="num">
				<Word
					name="num-call"
					x={0}
					y={T.big * 0.36}
					size={T.big}
					className="wt-film-num"
				>
					{fixed2(CALL_DELTA)}
				</Word>
				<Word
					name="num-put"
					x={0}
					y={T.big * 0.36}
					size={T.big}
					className="wt-film-num"
				>
					{fixed2(PUT_DELTA)}
				</Word>
				<Lines
					name="num-word"
					text={t(copy.deltaWord)}
					x={0}
					y={T.big * 0.36 + T.head * 1.9}
					size={T.head}
					maxWidth={L.narrow ? W * 0.44 : room}
					className="wt-film-type wt-film-accent"
				/>
				<Lines
					name="num-sub"
					text={t(copy.perDollar)}
					x={0}
					y={T.big * 0.36 + T.head * 1.9 + T.body * 1.9}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			<Lines
				name="s-head"
				text={t(copy.slopeHead)}
				x={L.margin}
				y={L.headY}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
			<Lines
				name="put-head"
				text={t(copy.putHead)}
				x={L.margin}
				y={L.headY}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
			<Lines
				name="put-sub"
				text={t(copy.putSub)}
				x={L.margin}
				y={L.headY + T.head * 1.7}
				size={T.body}
				maxWidth={L.narrow ? room : W * 0.42}
				anchor="start"
				className="wt-film-type wt-film-dim"
			/>
			<g data-f="chain">
				<Lines
					name="ch-head"
					text={t(copy.chainHead)}
					x={L.margin}
					y={L.headY}
					size={T.head}
					maxWidth={room}
					anchor="start"
				/>
				<Lines
					name="ch-op100"
					text={t(copy.op100)}
					x={W / 2}
					y={L.rows[1]}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
				<Word
					name="ch-per"
					x={W / 2}
					y={L.rows[2]}
					size={T.num}
					className="wt-film-num"
				>
					{perContract}
				</Word>
				<Lines
					name="ch-op-you"
					text={t(L.narrow ? copy.opYouShort : copy.opYou)}
					x={W / 2}
					y={L.rows[3]}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
				<Word
					name="ch-pos-you"
					x={W / 2}
					y={L.posY}
					size={T.num * 1.35}
					className="wt-film-num wt-film-gain"
				>
					{signedCount(positionDelta(you.contracts))}
				</Word>
				<Lines
					name="ch-op-ben"
					text={t(L.narrow ? copy.opBenShort : copy.opBen)}
					x={W / 2 + L.side}
					y={L.rows[3]}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
				<Word
					name="ch-pos-ben"
					x={W / 2 + L.side}
					y={L.posY}
					size={T.num * 1.35}
					className="wt-film-num wt-film-loss"
				>
					{signedCount(positionDelta(ben.contracts))}
				</Word>
				<g data-f="ch-chip">
					<rect
						x={W / 2 - chipW / 2}
						y={L.chipY - T.body - 2}
						width={chipW}
						height={T.body + 12}
						rx={7}
						className="wt-chip"
					/>
					<text
						x={W / 2}
						y={L.chipY + 4}
						textAnchor="middle"
						className="wt-chip-text"
						style={{ fontSize: T.small }}
					>
						{t(copy.chip)}
					</text>
				</g>
				{(
					[
						["ch-usd-you", -L.side, you.contracts, "wt-film-gain"],
						["ch-usd-ben", L.side, ben.contracts, "wt-film-loss"],
					] as const
				).map(([name, dx, contracts, tone]) => (
					<Word
						key={name}
						name={name}
						x={W / 2 + dx}
						y={L.payY}
						size={T.body * 1.3}
						className={`wt-film-num ${tone}`}
					>
						{`× $${MOVE.toFixed(2)} ≈ ${signedUsd(moveDollars(contracts), 0)}`}
					</Word>
				))}
				<Lines
					name="ch-equiv"
					text={t(copy.equivalents)}
					x={W / 2}
					y={L.equivY}
					size={T.small}
					maxWidth={L.narrow ? L.side * 1.8 : room}
					className="wt-film-type wt-film-dim"
				/>
				<Lines
					name="ch-equiv-ben"
					text={t(copy.equivalents)}
					x={W / 2 + L.side}
					y={L.equivY}
					size={T.small}
					maxWidth={L.narrow ? L.side * 1.8 : room}
					className="wt-film-type wt-film-dim"
				/>
				<Lines
					name="ch-pay"
					text={t(copy.pay)}
					x={W / 2}
					y={L.payY}
					size={T.body}
					maxWidth={room}
				/>
			</g>
			<Lines
				name="lim-head"
				text={t(L.narrow ? copy.limitHeadShort : copy.limitHead)}
				x={L.margin}
				y={L.headY}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
			<Brackets name="lock-pos" glow />
			<g data-f="local">
				<Lines
					name="z-big"
					text={t(copy.localBig)}
					x={W / 2}
					y={H * 0.48}
					size={T.title}
					maxWidth={room}
				/>
				<Lines
					name="z-sub"
					text={t(copy.localSub)}
					x={W / 2}
					y={H * 0.48 + T.title * 1.1}
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
	const { width: W, height: H } = context;
	const L = layout(W);
	const { type: T, narrow } = L;
	const d = createDirector(context, L, END);
	const { tl, one, kids, t, show, hide, rise, sink, cam, home, world } = d;
	/** A figure lands slightly large and settles, without overshoot: it is data. */
	const land = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.12, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const lockPos = one<SVGGraphicsElement>("lock-pos");
	const mx = L.x(SPOT);
	const my = L.y(V0);
	const marker = one("marker");
	const ghost = one("ghost");
	const num = one("num");
	const numCall = one("num-call");
	const numPut = one("num-put");
	const moveLabel = one<SVGTextElement>("move-label");
	const ghostLabel = one<SVGTextElement>("ghost-label");
	const gap = one<SVGLineElement>("gap");
	const gapLabel = one<SVGTextElement>("gap-label");
	const tangentLine = one<SVGLineElement>("tangent");
	const callTangent = (spot: number) => V0 + CALL_DELTA * (spot - SPOT);
	const putTangent = (spot: number) => P0 + PUT_DELTA * (spot - SPOT);
	const riserX = L.x(SPOT + 1);
	const riserTop = L.y(V0 + CALL_DELTA);
	const pushIn = cam(
		narrow ? 1.7 : 2.1,
		{ x: mx, y: my },
		{ x: W * 0.36, y: H * 0.5 },
	);
	const aside = cam(
		narrow ? 0.5 : 0.58,
		{ x: L.cx, y: L.cy },
		{ x: W * (narrow ? 0.72 : 0.73), y: H * 0.58 },
	);

	// Everything at rest: hidden until its shot needs it.
	gsap.set(marker, { x: mx, y: my - 90, opacity: 0 });
	gsap.set(one("dot"), { transformOrigin: "50% 100%" });
	gsap.set(one("ripple"), { opacity: 0, attr: { r: 6 } });
	d.hidden([
		lockPos,
		one("marker-label-call"),
		one("marker-label-put"),
		one("curve-label-call"),
		one("curve-label-put"),
		tangentLine,
		one("step"),
		one("riser"),
		one("below"),
		one("below-label"),
		ghost,
		ghostLabel,
		gap,
		gapLabel,
		moveLabel,
		...kids("q"),
		numCall,
		numPut,
		one("num-word"),
		one("num-sub"),
		one("s-head"),
		one("put-head"),
		one("put-sub"),
		...kids("chain"),
		one("lim-head"),
		...kids("local"),
	]);
	gsap.set(one("step-line"), { attr: { x2: mx } });
	gsap.set(ghost, { x: mx, y: my });
	gsap.set(num, { x: W / 2, y: H * 0.5 });
	gsap.set([numCall, numPut], { transformOrigin: "50% 50%" });

	// ——— open: the title ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: ALFA $100 → $101, the call moves by… ? ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-price"), 4.7);
	show(one("q-next"), 5.4, "right");
	land(one("q-step"), 5.9);
	show(one("q-line"), 6.0);
	land(one("q-mark"), 7.6);

	// ——— slope: the chart proves it; cut to the number ———
	tl.addLabel("slope", 9.5);
	hide(kids("q"), 9.5);
	rise(9.7);
	tl.to(marker, { opacity: 1, duration: 0.2 }, 10.5);
	tl.to(marker, { y: my, duration: 0.55, ease: "power2.in" }, 10.5);
	tl.fromTo(
		one("dot"),
		{ scale: 1.3 },
		{ scale: 1, duration: 0.45, ease: "power3.out" },
		11.05,
	);
	tl.fromTo(
		one("ripple"),
		{ opacity: 0.6, attr: { r: 6 } },
		{ opacity: 0, attr: { r: 26 }, duration: 0.7, ease: "power2.out" },
		11.1,
	);
	tl.to(
		one("clip-left"),
		{
			attr: { x: L.left - 4, width: mx - L.left + 4 },
			duration: 1.3,
			ease: "power2.inOut",
		},
		11.3,
	);
	tl.to(
		one("clip-right"),
		{ attr: { width: L.right - mx + 4 }, duration: 1.3, ease: "power2.inOut" },
		11.3,
	);
	tl.fromTo(
		one("marker-label-call"),
		{ opacity: 0, attr: { y: my - 4 } },
		{ opacity: 1, attr: { y: my - 14 }, duration: 0.5 },
		11.8,
	);
	tl.to(one("curve-label-call"), { opacity: 1, duration: 0.5 }, 12.5);
	tl.to(one("curve-label-call"), { opacity: 0, duration: 0.3 }, 12.9);
	tl.to(world, { ...pushIn, duration: 1.3, ease: "power2.inOut" }, 12.9);
	show(one("s-head"), 13.3, "above");
	// Pushed in on the slope, the axis labels would crowd the frame's edges: they step out.
	const axisText = [...one("axes").querySelectorAll("text")];
	tl.to(axisText, { opacity: 0, duration: 0.3 }, 12.9);
	tl.set(axisText, { opacity: 1 }, 18.8);
	tl.to(tangentLine, { opacity: 1, duration: 0.2 }, 13.8);
	tl.to(
		tangentLine,
		{
			attr: {
				x1: L.x(X_RANGE[0]),
				y1: L.y(callTangent(X_RANGE[0])),
				x2: L.x(X_RANGE[1]),
				y2: L.y(callTangent(X_RANGE[1])),
			},
			duration: 1.0,
			ease: "power2.inOut",
		},
		13.8,
	);
	tl.to(one("step"), { opacity: 1, duration: 0.2 }, 14.9);
	tl.to(
		one("step-line"),
		{ attr: { x2: riserX }, duration: 0.45, ease: "power2.out" },
		14.9,
	);
	tl.to(one("riser"), { opacity: 1, duration: 0.2 }, 15.5);
	tl.to(
		one("riser-line"),
		{ attr: { y2: riserTop }, duration: 0.6, ease: "power3.out" },
		15.5,
	);
	// Cut: the chart sinks, the number lands.
	hide(one("s-head"), 16.8);
	sink(16.8);
	land(numCall, 17.2);
	show(one("num-word"), 17.6);

	// ——— put: the number flips while the curve folds ———
	tl.addLabel("put", 18.5);
	show(one("put-head"), 18.7, "above");
	tl.to(
		num,
		{ x: W * 0.24, y: H * 0.58, duration: 0.9, ease: "power3.inOut" },
		18.7,
	);
	tl.set(world, aside, 18.8);
	tl.set(
		[one("step"), one("riser"), one("marker-label-call")],
		{ opacity: 0 },
		18.8,
	);
	// The chart comes up once the number has moved aside, clear of its labels.
	rise(19.6);
	tl.to(
		[one("curve-a"), one("curve-b")],
		{ attr: { d: L.path(put) }, duration: 1.3, ease: "power2.inOut" },
		20.2,
	);
	tl.to(marker, { y: L.y(P0), duration: 1.3, ease: "power2.inOut" }, 20.2);
	tl.to(
		tangentLine,
		{
			attr: {
				y1: L.y(putTangent(X_RANGE[0])),
				y2: L.y(putTangent(X_RANGE[1])),
			},
			duration: 1.3,
			ease: "power2.inOut",
		},
		20.35,
	);
	d.flip(numCall, numPut, 20.7);
	tl.to(one("marker-label-put"), { opacity: 1, duration: 0.4 }, 21.3);
	tl.to(one("curve-label-put"), { opacity: 1, duration: 0.4 }, 21.5);
	show(one("put-sub"), 20.9);

	// ——— position: the chain ———
	tl.addLabel("position", 24.5);
	hide([one("put-head"), one("put-sub"), one("num-word")], 24.5);
	sink(24.5);
	d.flip(numPut, numCall, 24.5);
	// The number shrinks about its own centre to head the chain; a group would scale about
	// its box corner.
	tl.to(
		num,
		{
			x: W / 2,
			y: L.rows[0] - T.num * 0.36,
			duration: 0.8,
			ease: "power3.inOut",
		},
		25.1,
	);
	tl.to(
		numCall,
		{ scale: T.num / T.big, duration: 0.8, ease: "power3.inOut" },
		25.1,
	);
	show(one("ch-head"), 25.1, "above");
	const shares = (value: number) => signedCount(Math.round(value));
	show(one("ch-op100"), 25.9);
	land(one("ch-per"), 26.4);
	show(one("ch-op-you"), 27.2);
	land(one("ch-pos-you"), 27.7);
	d.count(
		one<SVGTextElement>("ch-pos-you"),
		positionDelta(you.contracts),
		27.7,
		shares,
	);
	show(one("ch-equiv"), 28.3);
	// The hero: your position's delta, counted, held, then locked; its inputs step back.
	d.lock(lockPos, 28.7, { around: one("ch-pos-you"), pad: 4 });
	tl.addLabel("hero-lock", 28.7);
	tl.to([numCall, one("ch-per")], { opacity: 0.5, duration: 0.4 }, 28.7);
	// Ben: the same chain beside yours, the sign flipped.
	// The lock holds 2.6 s before the column makes room for Ben.
	hide(lockPos, 31.3, 0.3);
	tl.to(
		[one("ch-op-you"), one("ch-pos-you"), one("ch-equiv")],
		{ x: -L.side, duration: 0.6, ease: "power2.inOut" },
		31.4,
	);
	show(one("ch-op-ben"), 31.9);
	land(one("ch-pos-ben"), 32.3);
	show(one("ch-equiv-ben"), 32.6);
	d.count(
		one<SVGTextElement>("ch-pos-ben"),
		positionDelta(ben.contracts),
		32.3,
		shares,
	);
	// One move, both positions: ALFA +$0.40, in dollars, for each.
	show(one("ch-chip"), 33.0);
	show(one("ch-usd-you"), 33.5);
	show(one("ch-usd-ben"), 33.9);

	// ——— limits: the marker rides the curve, a ghost rides the line ———
	tl.addLabel("limits", 35.3);
	hide([...kids("chain"), numCall], 35.3);
	tl.set(world, home, 35.5);
	tl.set([one("curve-a"), one("curve-b")], { attr: { d: L.path(call) } }, 35.5);
	tl.set(marker, { y: my }, 35.5);
	tl.set(
		tangentLine,
		{
			attr: {
				y1: L.y(callTangent(X_RANGE[0])),
				y2: L.y(callTangent(X_RANGE[1])),
			},
		},
		35.5,
	);
	tl.set(
		[one("marker-label-put"), one("curve-label-put")],
		{ opacity: 0 },
		35.5,
	);
	show(one("lim-head"), 35.65, "above");
	rise(35.65);
	tl.to(ghost, { opacity: 1, duration: 0.3 }, 36.1);
	const slide = { spot: SPOT };
	/**
	 * The three readings stand still in the plot's empty top left, between its top two
	 * gridlines: riding beside the marker, they ran across the curve and the line.
	 */
	const readX = L.left + 12;
	const readY = (i: number) => L.y(Y_RANGE[1]) + 18 + i * 18;
	const place = () => {
		const spot = slide.spot;
		const repriced = valueAt("call", spot);
		const estimate = callTangent(spot);
		const px = L.x(spot);
		const py = L.y(repriced);
		const gy = L.y(estimate);
		gsap.set(marker, { x: px, y: py });
		gsap.set(ghost, { x: px, y: gy });
		moveLabel.setAttribute("x", String(readX));
		moveLabel.setAttribute("y", String(readY(0)));
		moveLabel.setAttribute("text-anchor", "start");
		moveLabel.textContent = `${t(copy.model)} ${signedPrice(repriced - V0)}`;
		moveLabel.setAttribute(
			"class",
			`wt-halo wt-marker-label ${repriced >= V0 ? "wt-gain" : "wt-loss"}`,
		);
		ghostLabel.setAttribute("x", String(readX));
		ghostLabel.setAttribute("y", String(readY(1)));
		ghostLabel.setAttribute("text-anchor", "start");
		ghostLabel.textContent = `${t(copy.deltaAlone)} ${signedPrice(estimate - V0)}`;
		gap.setAttribute("x1", String(px));
		gap.setAttribute("x2", String(px));
		gap.setAttribute("y1", String(Math.min(py, gy) + 8));
		gap.setAttribute("y2", String(Math.max(py, gy) - 8));
		gapLabel.setAttribute("x", String(readX));
		gapLabel.setAttribute("y", String(readY(2)));
		gapLabel.setAttribute("text-anchor", "start");
		gapLabel.textContent = `${t(copy.missed)} ${price(Math.abs(repriced - estimate))}`;
	};
	place();
	tl.to(
		slide,
		{ spot: SPOT + UP, duration: 1.0, ease: "power2.inOut", onUpdate: place },
		36.3,
	);
	tl.to(moveLabel, { opacity: 1, duration: 0.4 }, 36.6);
	tl.to(ghostLabel, { opacity: 1, duration: 0.4 }, 36.9);
	tl.fromTo(
		gap,
		{ opacity: 0, scaleY: 0, transformOrigin: "50% 0%" },
		{ opacity: 1, scaleY: 1, duration: 0.5 },
		37.3,
	);
	tl.to(gapLabel, { opacity: 1, duration: 0.4 }, 37.5);
	tl.to(
		slide,
		{ spot: SPOT + DOWN, duration: 1.0, ease: "power2.inOut", onUpdate: place },
		38.9,
	);
	tl.to(one("below"), { opacity: 1, duration: 0.6 }, 39.5);
	tl.to(one("below-label"), { opacity: 1, duration: 0.5 }, 39.8);
	// Cut: the claim, held to be read.
	hide(one("lim-head"), 40.9);
	sink(40.9);
	tl.fromTo(
		one("z-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
		41.3,
	);
	show(one("z-sub"), 41.7);

	// ——— next ———
	tl.addLabel("next", 45.4);
	hide(kids("local"), 45.4);
	d.close(45.4);
	return tl;
}

export const deltaFilm: Film = {
	id: "delta",
	label: [
		"Delta, as a short film: the value of ALFA's Oct 18 100 option against ALFA's price, the slope at today's price, that slope carried onto a position, and where a straight line stops describing the curve",
		"Delta 短片：ALFA 10月18日 100 期权的价值随 ALFA 价格变化、今天价格处的斜率、同一斜率放到持仓上，以及直线在哪里不再能描述曲线",
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Delta", "Delta"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "slope", label: ["The slope", "斜率"] },
		{ id: "put", label: ["The put", "看跌"] },
		{ id: "position", label: ["A position", "持仓"] },
		{ id: "limits", label: ["The limits", "局限"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
