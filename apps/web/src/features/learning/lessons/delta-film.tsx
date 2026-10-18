import { gsap } from "gsap";
import { useId } from "react";
import { type Copy, pick, signedCount } from "@/content/world";
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
	toneClass,
	toneColor,
	Word,
} from "../walkthrough/film-kit";
import { textWidth } from "../walkthrough/text-measure";
import {
	CALL_DELTA,
	curve,
	fixed2,
	holders,
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
 *   slope     9.5–17.7   the chart rises from the depth; push in; the $1 step, the $0.52
 *                        rise; carry 0.52 into its definition, full frame
 *   put       17.7–23.7  the call proof leaves; its hidden geometry swaps to the put,
 *                        which returns paired with −0.48
 *   position  23.7–32    hero: 0.52 × 100 × 16 = +832, locked; the two positions follow
 *                        after the lock
 *   limits    32–41.3    the marker rides the curve, a ghost rides the line; compare their
 *                        settled readings before revealing the gap; cut: "Delta is
 *                        local."
 *   next      45.8–47.4  Next: gamma
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
const PHONE_ASIDE_SCALE = 0.62;
const PHONE_PROOF_SCALE = 2.7;

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
		narrow
			? width < 360
				? [0.33, 0.43, 0.53, 0.6, 0.69]
				: [0.35, 0.45, 0.55, 0.64, 0.73]
			: [0.25, 0.34, 0.43, 0.52, 0.61]
	).map((f) => height * f);
	const T = frame.type;
	// Keep the signed position and its share-equivalents caption inside the desktop frame.
	const captionTail = T.num * 0.45 + T.small * 2.2;
	if (!narrow) {
		const lift = Math.max(
			0,
			rows[3] + T.body * 1.2 + T.num * 1.35 * 0.95 + captionTail - height * 0.9,
		);
		for (let i = 0; i < rows.length; i++) rows[i] -= lift;
	}
	const posY = rows[3] + T.body * 1.2 + T.num * 1.35 * 0.95;
	// The caption clears the locked figure's brackets by more than the arms' own width.
	const equivY = posY + T.num * 0.45 + T.small * 2.2;
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
	deltaWord: [
		`delta at ${stock(SPOT)}: per share, per $1`,
		`${stock(SPOT)} 处的 Delta：每股，每 $1`,
	],
	deltaWordShort: [
		`delta at ${stock(SPOT)}: per share, per $1`,
		`${stock(SPOT)} 处的 Delta：每股，每 $1`,
	],
	slopeHead: ["What does the call gain?", "看涨期权价值会增加多少？"],
	putHead: ["Puts slope the other way.", "看跌期权的斜率方向相反。"],
	putSub: [
		`+$1 in ALFA takes about ${price(Math.abs(PUT_DELTA))} off the put.`,
		`ALFA 涨 $1，看跌约减少 ${price(Math.abs(PUT_DELTA))}。`,
	],
	chainHead: [
		"Same ALFA call: keep sign and multiplier.",
		"同一 ALFA 看涨：保留符号与乘数。",
	],
	op100: ["× 100 shares per contract", "× 每张 100 股"],
	opYou: [
		`× ${signedCount(you.contracts)} contracts, you`,
		`× 你持有 ${signedCount(you.contracts)} 张`,
	],
	opBen: [
		`Ben: ×${signedCount(ben.contracts)} contracts`,
		`Ben：×${signedCount(ben.contracts)} 张`,
	],
	opYouShort: [
		`× ${signedCount(you.contracts)}, you`,
		`× 你 ${signedCount(you.contracts)} 张`,
	],
	opBenShort: [
		`× ${signedCount(ben.contracts)}, Ben`,
		`× Ben ${signedCount(ben.contracts)} 张`,
	],
	equivalents: ["share-equivalents of ALFA", "相当于这么多股 ALFA"],
	/** A phone's headline must stay on one line above the chart. */
	limitHeadShort: ["Where the straight line stops.", "直线在哪里不再成立。"],
	limitHead: [
		"Where the straight line stops being true.",
		"直线在哪里不再成立。",
	],
	model: ["model", "模型"],
	deltaEstimate: ["delta estimate", "Delta 估算"],
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
	const keyX = L.left + 12;
	const keyY = L.headY + T.head * 1.4;
	// The two keys share a line. The labels are set in the sans, near 0.52 em a Latin glyph and
	// a full em a CJK one (textWidth measures the mono's 0.6): on a phone the gap follows the
	// sans, keeping the second key clear of the edge.
	const sansWidth = (text: string, size: number) =>
		[...text].reduce(
			(w, c) => w + ((c.codePointAt(0) ?? 0) > 0x2e80 ? size : size * 0.52),
			0,
		);
	const deltaKeyX = L.narrow
		? keyX + 34 + sansWidth(t(copy.callLabel), T.small) + 14
		: keyX + 34 + textWidth(t(copy.callLabel), T.small) + 18;
	const deltaKeyY = keyY;
	const proofTypeScale = L.narrow ? 2 / PHONE_PROOF_SCALE : 1;
	const deltaWord = t(L.narrow ? copy.deltaWordShort : copy.deltaWord);
	// Keep the definition in the number's lane when it moves beside the chart.
	const deltaWordWidth = W * (L.narrow ? 0.44 : 0.42);
	const numWordY = H * 0.5 + T.big * 0.36 + T.head * 1.9;
	const numSubY =
		numWordY +
		(lineCount(deltaWord, deltaWordWidth, T.head) - 1) * T.head * 1.35 +
		T.body * 1.9;
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
						{(L.narrow ? [0, 8, 16] : [0, 4, 8, 12, 16]).map((tick) => (
							<g key={tick}>
								<path
									d={`M${L.left} ${L.y(tick)}H${L.right}`}
									className={tick === 0 ? "wt-axis" : "wt-grid"}
								/>
								<text
									data-f={`axis-value-${tick}`}
									x={L.left - 8}
									y={L.y(tick) + 4}
									textAnchor="end"
									className="wt-small"
								>
									{`$${tick}`}
								</text>
							</g>
						))}
						{(L.narrow ? [90, 100, 110] : [90, 95, 100, 105, 110]).map(
							(tick) => (
								<text
									key={tick}
									x={L.x(tick)}
									y={L.bottom + 18}
									textAnchor="middle"
									className="wt-small"
								>
									{`$${tick}`}
								</text>
							),
						)}
						<text
							x={L.right}
							y={L.bottom + (L.narrow ? 42 : 32)}
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
							style={{ strokeWidth: 3 }}
							strokeDasharray="6 5"
							d={L.path(call)}
						/>
					</g>
					<g clipPath={`url(#right-${id})`}>
						<path
							data-f="curve-b"
							className="wt-line-position"
							style={{ strokeWidth: 3 }}
							strokeDasharray="6 5"
							d={L.path(call)}
						/>
					</g>
					{/* At the put's high left end: to its right the curve falls away from it. */}
					<text
						data-f="curve-label-put"
						x={L.left + 4}
						y={L.y(put[0][1]) - 16}
						textAnchor="start"
						className={`wt-small wt-halo ${toneClass.put}`}
					>
						{t(L.narrow ? copy.putShort : copy.putLabel)}
					</text>
					<line
						data-f="tangent"
						className="wt-film-tangent"
						strokeDasharray="2 4"
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
						{L.narrow && (
							<circle
								data-f="step-corner"
								cx={L.x(SPOT + 1)}
								cy={my}
								r={2}
								className="wt-film-step"
							/>
						)}
						<text
							data-f="step-label"
							x={(mx + L.x(SPOT + 1)) / 2}
							y={my + (L.narrow ? 24 : 16)}
							textAnchor="middle"
							className="wt-small wt-halo wt-accent"
							style={
								L.narrow
									? { fontSize: T.small * 1.2 * proofTypeScale }
									: undefined
							}
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
						{L.narrow && (
							<circle
								data-f="riser-tip"
								cx={L.x(SPOT + 1)}
								cy={L.y(V0 + CALL_DELTA)}
								r={2.5}
								className="wt-chip"
							/>
						)}
						<text
							data-f="riser-label"
							x={L.x(SPOT + 1) + (L.narrow ? 12 : 8)}
							y={
								L.narrow
									? (my + L.y(V0 + CALL_DELTA)) / 2 + 4
									: L.y(V0 + CALL_DELTA) + 14
							}
							className="wt-halo wt-accent wt-marker-label"
							style={L.narrow ? { fontSize: 13 * proofTypeScale } : undefined}
						>
							<tspan>+$</tspan>
							<tspan data-f="riser-number">{fixed2(CALL_DELTA)}</tspan>
						</text>
					</g>
					<g data-f="ghost">
						<circle r={L.narrow ? 3 : 6} className="wt-film-ghost" />
					</g>
					<text
						data-f="ghost-label"
						className="wt-halo"
						style={{ fontSize: T.body }}
					/>
					<line
						data-f="gap"
						className="wt-film-gap"
						style={{ stroke: toneColor("caution") }}
					/>
					<text
						data-f="gap-label"
						className={`wt-halo wt-marker-label ${toneClass.caution}`}
						style={{ fontSize: T.body * 1.15 }}
					/>
					<g data-f="marker">
						<circle
							data-f="ripple"
							r={L.narrow ? 3 : 6}
							className="wt-film-ripple"
						/>
						<circle
							data-f="dot"
							r={L.narrow ? 3 : 6}
							className="wt-chip"
							stroke="var(--foreground)"
							strokeWidth={L.narrow ? 1 : 1.5}
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
					<text
						data-f="move-label"
						className="wt-halo wt-marker-label"
						style={{ fontSize: T.body }}
					/>
					<text
						data-f="lim-move"
						x={L.left + 12}
						y={L.top + 18}
						className="wt-small wt-halo wt-accent"
					/>
				</g>
			</g>

			{/* The type: the claims. */}
			{/* Root coordinates keep the line key legible through the chart's push-in. */}
			<g data-f="line-key">
				<line
					x1={keyX}
					x2={keyX + 26}
					y1={keyY - T.small * 0.35}
					y2={keyY - T.small * 0.35}
					className="wt-line-position"
					strokeDasharray="6 5"
				/>
				<text
					x={keyX + 34}
					y={keyY}
					className="wt-small wt-label-position"
					style={{ fontSize: T.small }}
				>
					{t(copy.callLabel)}
				</text>
				<line
					x1={deltaKeyX}
					x2={deltaKeyX + 26}
					y1={deltaKeyY - T.small * 0.35}
					y2={deltaKeyY - T.small * 0.35}
					className="wt-film-tangent"
					strokeDasharray="2 4"
				/>
				<text
					x={deltaKeyX + 34}
					y={deltaKeyY}
					className="wt-small"
					style={{ fontSize: T.small }}
				>
					{t(copy.deltaEstimate)}
				</text>
			</g>
			{/* Replaced at build with the pushed-in riser's exact numeric position. */}
			<Word
				name="slope-number-proxy"
				x={0}
				y={0}
				size={13 * (L.narrow ? 2 : 2.1)}
				anchor="start"
				className="wt-film-num wt-film-accent"
			>
				{fixed2(CALL_DELTA)}
			</Word>
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
					x={W / 2}
					y={H * 0.5 + T.big * 0.36}
					size={T.big}
					className="wt-film-num wt-film-accent"
				>
					{fixed2(CALL_DELTA)}
				</Word>
				<Word
					name="num-put"
					x={W / 2}
					y={H * 0.5 + T.big * 0.36}
					size={T.big}
					className="wt-film-num wt-film-accent"
				>
					{fixed2(PUT_DELTA)}
				</Word>
				<Lines
					name="num-word"
					text={deltaWord}
					x={W / 2}
					y={numWordY}
					size={T.head}
					maxWidth={deltaWordWidth}
					className="wt-film-type wt-film-accent"
				/>
				<Lines
					name="num-sub"
					text={t(copy.perDollar)}
					x={W / 2}
					y={numSubY}
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
				<Lines
					name="ch-equiv"
					text={t(copy.equivalents)}
					x={W / 2}
					y={L.equivY}
					size={T.small}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
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
	const numCall = one<SVGTextElement>("num-call");
	const numPut = one("num-put");
	const slopeNumber = one<SVGTextElement>("slope-number-proxy");
	const riserNumber = one<SVGTSpanElement>("riser-number");
	const moveLabel = one<SVGTextElement>("move-label");
	const ghostLabel = one<SVGTextElement>("ghost-label");
	const limitMove = one<SVGTextElement>("lim-move");
	const gap = one<SVGLineElement>("gap");
	const gapLabel = one<SVGTextElement>("gap-label");
	const tangentLine = one<SVGLineElement>("tangent");
	const axisText = [...one("axes").querySelectorAll("text")];
	const callTangent = (spot: number) => V0 + CALL_DELTA * (spot - SPOT);
	const putTangent = (spot: number) => P0 + PUT_DELTA * (spot - SPOT);
	const riserX = L.x(SPOT + 1);
	const riserTop = L.y(V0 + CALL_DELTA);
	const pushIn = cam(
		narrow ? PHONE_PROOF_SCALE : 2.1,
		{ x: narrow ? (mx + riserX) / 2 : mx, y: my },
		{ x: W * (narrow ? 0.34 : 0.36), y: H * (narrow ? 0.64 : 0.5) },
	);
	const aside = cam(
		narrow ? PHONE_ASIDE_SCALE : 0.58,
		{ x: L.cx, y: L.cy },
		{ x: W * (narrow ? 0.71 : 0.73), y: H * 0.58 },
	);
	// The source lives in the camera; its mono proxy lives in root coordinates.
	// Measure the first digit, not the +$ prefix, so the handoff has no sideways jump.
	const digitStart = riserNumber.getStartPositionOfChar(0);
	gsap.set(slopeNumber, {
		attr: {
			x: pushIn.x + pushIn.scale * digitStart.x,
			y: pushIn.y + pushIn.scale * digitStart.y,
		},
		fontSize:
			Number.parseFloat(getComputedStyle(riserNumber).fontSize) * pushIn.scale,
	});

	// Everything at rest: hidden until its shot needs it.
	gsap.set(marker, { x: mx, y: my - 90, opacity: 0 });
	gsap.set(one("dot"), { transformOrigin: "50% 100%" });
	gsap.set(one("ripple"), { opacity: 0, attr: { r: narrow ? 3 : 6 } });
	d.hidden([
		lockPos,
		one("marker-label-call"),
		one("marker-label-put"),
		one("curve-label-put"),
		tangentLine,
		one("step"),
		one("riser"),
		one("riser-label"),
		one("line-key"),
		one("below"),
		one("below-label"),
		ghost,
		ghostLabel,
		gap,
		gapLabel,
		moveLabel,
		limitMove,
		...kids("q"),
		slopeNumber,
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
	if (narrow) d.hidden([one("step-corner"), one("riser-tip")]);
	gsap.set(one("step-line"), { attr: { x2: mx } });
	gsap.set(ghost, { x: mx, y: my });
	gsap.set(num, { x: 0, y: 0 });
	gsap.set([numCall, numPut], { transformOrigin: "50% 50%" });

	// ——— open: the title ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: ALFA $100 → $101, the call moves by… ? ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-price"), 4.7);
	show(one("q-next"), 5.0, "right");
	tl.fromTo(one("q-step"), { opacity: 0 }, { opacity: 1, duration: 0.4 }, 5.45);
	show(one("q-line"), 5.5);
	land(one("q-mark"), 5.45);

	// ——— slope: the chart proves it; cut to the number ———
	tl.addLabel("slope", 9.5);
	hide(kids("q"), 9.5);
	rise(9.7);
	tl.to(marker, { opacity: 1, duration: 0.3 }, 10.2);
	tl.to(marker, { y: my, duration: 0.55, ease: "power2.in" }, 10.2);
	tl.fromTo(
		one("dot"),
		{ scale: 1.3 },
		{ scale: 1, duration: 0.45, ease: "power3.out" },
		10.75,
	);
	tl.fromTo(
		one("ripple"),
		{ opacity: 0.6, attr: { r: narrow ? 3 : 6 } },
		{ opacity: 0, attr: { r: 26 }, duration: 0.7, ease: "power2.out" },
		10.8,
	);
	tl.to(
		one("clip-left"),
		{
			attr: { x: L.left - 4, width: mx - L.left + 4 },
			duration: 1.1,
			ease: "power2.inOut",
		},
		10.7,
	);
	tl.to(
		one("clip-right"),
		{ attr: { width: L.right - mx + 4 }, duration: 1.1, ease: "power2.inOut" },
		10.7,
	);
	tl.fromTo(
		one("marker-label-call"),
		{ opacity: 0, attr: { y: my - 4 } },
		{ opacity: 1, attr: { y: my - (narrow ? 22 : 14) }, duration: 0.5 },
		10.9,
	);
	tl.to(one("line-key"), { opacity: 1, duration: 0.3 }, 11.2);
	// Clear tick labels first, leaving the grid as a scaffold for the camera move.
	tl.to(axisText, { opacity: 0, duration: 0.3 }, 11.5);
	show(one("s-head"), 11.8, "above", 0.3);
	tl.to(world, { ...pushIn, duration: 1.3, ease: "power2.inOut" }, 12.1);
	if (narrow) {
		// Enlarge the geometry without enlarging its labels; retain the establishment size.
		tl.to(
			one("marker-label-call"),
			{ fontSize: (13 * 2) / PHONE_PROOF_SCALE, duration: 1.3 },
			12.1,
		);
	}
	// Pushed in on the slope, the axis labels would crowd the frame's edges: they step out.
	tl.set(axisText, { opacity: 1 }, 18);
	if (narrow) {
		// Keep the aside's type at an actual 11 px instead of shrinking it to 6.8 px.
		tl.set(
			[...axisText, one("curve-label-put")],
			{ fontSize: T.small / PHONE_ASIDE_SCALE },
			18,
		);
		tl.set(
			one("marker-label-put"),
			{
				fontSize: T.body / PHONE_ASIDE_SCALE,
				attr: {
					x: mx + 14 / PHONE_ASIDE_SCALE,
					y: L.y(P0) - 14 / PHONE_ASIDE_SCALE,
					"text-anchor": "start",
				},
			},
			18,
		);
		const valueTicks = [0, 8, 16].map((tick) => one(`axis-value-${tick}`));
		// Keep ticks outside the plot. Offset $8 above the big delta and $0 below
		// its operating-point caption, so clearing the curves does not crowd the type.
		for (const tick of [0, 8, 16]) {
			tl.set(
				one(`axis-value-${tick}`),
				{
					attr: {
						x: L.left - 10,
						y: L.y(tick) + (tick === 8 ? -14 : tick === 0 ? 22 : 4),
						"text-anchor": "end",
					},
				},
				18,
			);
		}
		tl.set(one("dot"), { attr: { r: 3 / PHONE_ASIDE_SCALE } }, 18);
		tl.set(axisText, { fontSize: T.small }, 32);
		tl.set(valueTicks, { attr: { x: L.left - 8, "text-anchor": "end" } }, 32);
		for (const tick of [0, 8, 16]) {
			tl.set(one(`axis-value-${tick}`), { attr: { y: L.y(tick) + 4 } }, 32);
		}
		tl.set(one("dot"), { attr: { r: 3 } }, 32);
	}
	tl.to(tangentLine, { opacity: 1, duration: 0.3 }, 13.4);
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
		13.4,
	);
	// Build the $1 leg and tangent only after the camera settles.
	tl.to(one("step"), { opacity: 1, duration: 0.3 }, 13.4);
	// The labelled $1 leg is revealed complete, so its length always agrees with its label.
	tl.set(one("step-line"), { attr: { x2: riserX } }, 13.4);
	if (narrow) tl.set(one("step-corner"), { opacity: 1 }, 13.4);
	tl.to(one("riser"), { opacity: 1, duration: 0.3 }, 13.9);
	tl.to(
		one("riser-line"),
		{ attr: { y2: riserTop }, duration: 0.6, ease: "power3.out" },
		13.9,
	);
	// Name the gain only once the line reaches it; hold the complete proof for 1.05 s.
	tl.to(one("riser-label"), { opacity: 1, duration: 0.3 }, 14.5);
	if (narrow) tl.to(one("riser-tip"), { opacity: 1, duration: 0.3 }, 14.5);
	// Hand the digits to a root proxy before the chart steps back. The original
	// digits disappear in the same frame, so there is no blank or doubled number.
	tl.set(riserNumber, { opacity: 0 }, 15.85);
	tl.set(slopeNumber, { opacity: 1 }, 15.85);
	tl.to(world, { opacity: 0.22, duration: 0.3 }, 15.85);
	tl.to(one("line-key"), { opacity: 0, duration: 0.3 }, 15.85);
	// The dim chart clears the upward flight across its tangent and price label.
	hide(one("s-head"), 16);
	sink(16);
	d.carry(slopeNumber, numCall, 16.15, {
		duration: 0.7,
		arc: "y",
		match: fixed2(CALL_DELTA),
	});
	tl.set(numCall, { scale: 1 }, 16.85);
	// The completed number and definition settle at 16.9, a quiet second before the put.
	show(one("num-word"), 16.4);

	// ——— put: replace the complete proof while hidden ———
	tl.addLabel("put", 17.7);
	// Only this shot compares the rights; the solo-call shots keep their focus colour.
	const curves = [one("curve-a"), one("curve-b")];
	tl.set(curves, { attr: { class: "wt-line-call" } }, 17.9);
	tl.set(one("dot"), { attr: { class: `wt-chip ${toneClass.call}` } }, 17.9);
	tl.set(
		one("marker-label-call"),
		{ attr: { class: `wt-halo wt-marker-label ${toneClass.call}` } },
		17.9,
	);
	show(one("put-head"), 17.9, "above");
	tl.to(
		num,
		{ x: -W * 0.26, y: H * 0.08, duration: 0.9, ease: "power3.inOut" },
		17.9,
	);
	tl.set(world, { ...aside, opacity: 1 }, 18);
	tl.set(
		[one("step"), one("riser"), one("marker-label-call")],
		{ opacity: 0 },
		18,
	);
	// The chart comes up once the number has moved aside, clear of its labels.
	rise(18.8);
	const chartProof = [one("curve-a"), one("curve-b"), tangentLine, marker];
	// The number and the geometry it names always leave and arrive as a pair.
	tl.to(
		[...chartProof, numCall],
		{ opacity: 0, duration: 0.3, ease: "power2.in" },
		19.5,
	);
	tl.set([one("curve-a"), one("curve-b")], { attr: { d: L.path(put) } }, 19.8);
	tl.set(curves, { attr: { class: "wt-line-put" } }, 19.8);
	tl.set(one("dot"), { attr: { class: `wt-chip ${toneClass.put}` } }, 19.8);
	tl.set(
		one("marker-label-put"),
		{ attr: { class: `wt-halo wt-marker-label ${toneClass.put}` } },
		19.8,
	);
	tl.set(marker, { x: mx, y: L.y(P0) }, 19.8);
	tl.set(
		tangentLine,
		{
			attr: {
				y1: L.y(putTangent(X_RANGE[0])),
				y2: L.y(putTangent(X_RANGE[1])),
			},
		},
		19.8,
	);
	tl.to(
		[...chartProof, numPut],
		{ opacity: 1, duration: 0.35, ease: "power2.out" },
		19.8,
	);
	tl.to(one("marker-label-put"), { opacity: 1, duration: 0.4 }, 20.5);
	tl.to(one("curve-label-put"), { opacity: 1, duration: 0.4 }, 20.7);
	// Keep the readout's 20.15 settlement and the sentence's full 3.5 s hold.
	show(one("put-sub"), 20.2);

	// ——— position: the chain ———
	tl.addLabel("position", 23.7);
	hide([one("put-head"), one("put-sub"), one("num-word")], 23.7);
	sink(23.7);
	// Clear the put geometry with its folding readout before the call returns.
	tl.to(chartProof, { opacity: 0, duration: 0.3, ease: "power2.in" }, 23.7);
	tl.to(numPut, { scaleY: 0, duration: 0.3, ease: "power2.in" }, 23.7);
	tl.fromTo(
		numCall,
		{ opacity: 0, scaleY: 0 },
		{
			opacity: 1,
			scaleY: 1,
			duration: 0.35,
			ease: "power2.out",
			immediateRender: false,
		},
		24,
	);
	// The number shrinks about its own centre to head the chain; a group would scale about
	// its box corner.
	tl.to(
		num,
		{
			x: 0,
			y: L.rows[0] - T.num * 0.36 - H * 0.5,
			duration: 0.8,
			ease: "power3.inOut",
		},
		24.3,
	);
	tl.to(
		numCall,
		{ scale: T.num / T.big, duration: 0.8, ease: "power3.inOut" },
		24.3,
	);
	show(one("ch-head"), 24.3, "above");
	// The moving delta is already above these rows before their entrances begin.
	// Complete the per-contract relationship at 25.4; the next operator waits until 26.4.
	show(one("ch-op100"), 24.75);
	land(one("ch-per"), 24.85);
	show(one("ch-op-you"), 26.4);
	land(one("ch-pos-you"), 26.9);
	show(one("ch-equiv"), 27.5);
	// Fixed multipliers require a settled result, rather than intermediate counted totals.
	// The hero: your position's delta, held, then locked; its inputs step back.
	d.lock(lockPos, 27.9, { around: one("ch-pos-you"), pad: 4 });
	tl.addLabel("hero-lock", 27.9);
	tl.to([numCall, one("ch-per")], { opacity: 0.5, duration: 0.4 }, 27.9);
	// The lock's settled 1.95 s hold is unchanged; the exposure pair follows it alone.
	hide(lockPos, 30.3, 0.3);
	tl.to(
		[one("ch-op-you"), one("ch-pos-you")],
		{ x: -L.side, duration: 0.55, ease: "power2.inOut" },
		30.35,
	);
	show(one("ch-op-ben"), 30.35, "below", 0.55);
	land(one("ch-pos-ben"), 30.35);
	// The exposure pair settles at 30.9, then keeps its quiet second before the cut.

	// ——— limits: the marker rides the curve, a ghost rides the line ———
	tl.addLabel("limits", 32);
	// Fade text in place with a fast initial release: at 32.2 its opacity is at most
	// (1 - 2/3)^3 = 0.037, safely below 0.25 before any chart text starts entering.
	tl.to(
		[...kids("chain"), numCall],
		{ opacity: 0, duration: 0.3, ease: "power2.out" },
		32,
	);
	// Axes may crossfade, but their text waits with the other incoming labels.
	tl.set(axisText, { opacity: 0 }, 32);
	tl.set(world, home, 32);
	tl.set([one("curve-a"), one("curve-b")], { attr: { d: L.path(call) } }, 32);
	tl.set(curves, { attr: { class: "wt-line-position" } }, 32);
	tl.set(one("dot"), { attr: { class: "wt-chip" } }, 32);
	tl.set(
		one("marker-label-call"),
		{ attr: { class: `wt-halo wt-marker-label ${toneClass.focus}` } },
		32,
	);
	tl.set(marker, { x: mx, y: my }, 32);
	tl.set(
		tangentLine,
		{
			attr: {
				y1: L.y(callTangent(X_RANGE[0])),
				y2: L.y(callTangent(X_RANGE[1])),
			},
		},
		32,
	);
	tl.set(chartProof, { opacity: 1 }, 32);
	tl.set([one("marker-label-put"), one("curve-label-put")], { opacity: 0 }, 32);
	// Omit a second chart zoom: its established geometry fades in at rest while the
	// upside move is made. The old headline clears before the limits headline enters.
	tl.set(one("depth"), { scale: 1 }, 32);
	tl.to(one("depth"), { opacity: 1, duration: 0.3 }, 32);
	show(one("lim-head"), 32.3, "above");
	tl.to(axisText, { opacity: 1, duration: 0.3 }, 32.2);
	tl.to(one("line-key"), { opacity: 1, duration: 0.3 }, 32.2);
	tl.to(ghost, { opacity: 1, duration: 0.3 }, 32);
	const slide = { spot: SPOT };
	/**
	 * The three readings stand still in the plot's empty top left, between its top two
	 * gridlines: riding beside the marker, they ran across the curve and the line.
	 */
	const readX = L.left + 12;
	const readY = (i: number) => L.y(Y_RANGE[1]) + 36 + i * T.body * 1.55;
	const place = () => {
		const spot = slide.spot;
		const repriced = valueAt("call", spot);
		const estimate = callTangent(spot);
		const px = L.x(spot);
		const py = L.y(repriced);
		const gy = L.y(estimate);
		// A single live reading replaces the two endpoint labels and their atomic swaps.
		limitMove.textContent = `ALFA ${signedPrice(spot - SPOT)}`;
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
		ghostLabel.textContent = `${t(copy.deltaEstimate)} ${signedPrice(estimate - V0)}`;
		gap.setAttribute("x1", String(px));
		gap.setAttribute("x2", String(px));
		const gapPad = Math.min(8, Math.abs(py - gy) / 2);
		gap.setAttribute("y1", String(Math.min(py, gy) + gapPad));
		gap.setAttribute("y2", String(Math.max(py, gy) - gapPad));
		gapLabel.setAttribute("x", String(readX));
		gapLabel.setAttribute("y", String(readY(2)));
		gapLabel.setAttribute("text-anchor", "start");
		gapLabel.textContent = `${t(copy.missed)} ${price(Math.abs(repriced - estimate))}`;
	};
	place();
	// Compare exact endpoint readings: cut instead of taking time from the quiet holds.
	tl.set(slide, { spot: SPOT + UP, onUpdate: place }, 32.2);
	// Reveal the live readings with the move, never during the preceding zero-value setup.
	tl.to(
		[limitMove, moveLabel, ghostLabel],
		{ opacity: 1, duration: 0.3 },
		32.2,
	);
	// Model and estimate finish entering at 32.5; their old 32.8–33.8 rest is intact.
	// The complete upside comparison settles at 34.2 and remains quiet for 2.3 s.
	tl.to([gap, gapLabel], { opacity: 1, duration: 0.4 }, 33.8);
	// Clear the discrepancy before travel, so the downside also begins as two readings.
	tl.to([gap, gapLabel], { opacity: 0, duration: 0.3 }, 36.5);
	tl.set(slide, { spot: SPOT + DOWN, onUpdate: place }, 36.8);
	tl.to(one("below"), { opacity: 1, duration: 0.4 }, 36.8);
	tl.to(one("below-label"), { opacity: 1, duration: 0.3 }, 37);
	// The endpoint cuts at 36.8; keep the old 37.6–38.6 quiet second before its gap.
	// Its complete comparison settles at 39.0, retaining the same 2.3 s endpoint hold.
	tl.to([gap, gapLabel], { opacity: 1, duration: 0.4 }, 38.6);
	// Cut: the claim, held to be read.
	hide(one("lim-head"), 41.3);
	hide(one("line-key"), 41.3);
	sink(41.3);
	tl.fromTo(
		one("z-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
		41.7,
	);
	show(one("z-sub"), 42.1);

	// ——— next ———
	tl.addLabel("next", 45.8);
	hide(kids("local"), 45.8);
	d.close(45.8);
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
