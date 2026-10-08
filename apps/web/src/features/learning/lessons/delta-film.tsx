import { gsap } from "gsap";
import { Fragment, useId } from "react";
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
 *   slope     9.5–17.7   the chart rises from the depth; push in; the $1 step, the $0.52
 *                        rise; carry 0.52 into its definition, full frame
 *   put       17.7–23.7  the number flips to −0.48 while the curve folds into the put
 *   position  23.7–34.5  hero: 0.52 × 100 × 16 = +832, locked; Ben's chain beside it, the
 *                        sign flipped; +$0.40 in ALFA, in dollars, for each
 *   limits    34.5–40.9  the marker rides the curve, a ghost rides the line; cut: "Delta is
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
const PHONE_ASIDE_SCALE = 0.62;

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
	// Reserve a descender allowance and 10 px between each desktop payoff line.
	const multiplierSize = T.body * 1.3;
	const captionToMultiplier = T.small * 0.35 + multiplierSize + 10;
	const multiplierToPayoff = multiplierSize * 0.35 + T.num + 10;
	const payoffTail =
		T.num * 0.45 + T.small * 2.2 + captionToMultiplier + multiplierToPayoff;
	if (!narrow) {
		const lift = Math.max(
			0,
			rows[3] + T.body * 1.2 + T.num * 1.35 * 0.95 + payoffTail - height * 0.9,
		);
		for (let i = 0; i < rows.length; i++) rows[i] -= lift;
	}
	const posY = rows[3] + T.body * 1.2 + T.num * 1.35 * 0.95;
	// The caption clears the locked figure's brackets by more than the arms' own width.
	const equivY = posY + T.num * 0.45 + T.small * 2.2;
	// On a phone the move's chip sits under the two positions, not between them.
	const chipY = narrow ? equivY + T.num * 1.3 : posY - T.num * 0.35;
	const phonePayY = Math.min(chipY + T.num * 1.9, height - 20);
	const multiplyY = narrow
		? phonePayY - T.num * 1.35
		: equivY + captionToMultiplier;
	const payY = narrow ? phonePayY : multiplyY + multiplierToPayoff;
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
		multiplyY,
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
		`delta at ${stock(SPOT)}, per $1 of ALFA`,
		`ALFA ${stock(SPOT)} 处的 Delta：每变动 $1`,
	],
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
	limitUp: [`ALFA +${stock(UP)}`, `ALFA 涨 ${stock(UP)}`],
	limitDown: [`ALFA −${stock(-DOWN)}`, `ALFA 跌 ${stock(-DOWN)}`],
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
							style={L.narrow ? { fontSize: T.small * 1.2 } : undefined}
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
					<line data-f="gap" className="wt-film-gap" />
					<text
						data-f="gap-label"
						className="wt-halo wt-loss wt-marker-label"
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
					{(["lim-move-up", "lim-move-down"] as const).map((name, i) => (
						<text
							key={name}
							data-f={name}
							x={L.left + 12}
							y={L.top + 18}
							className="wt-small wt-halo wt-accent"
						>
							{t(i === 0 ? copy.limitUp : copy.limitDown)}
						</text>
					))}
				</g>
			</g>

			{/* The type: the claims. */}
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
					text={t(copy.deltaWord)}
					x={W / 2}
					y={H * 0.5 + T.big * 0.36 + T.head * 1.9}
					size={T.head}
					maxWidth={L.narrow ? W * 0.44 : room}
					className="wt-film-type wt-film-accent"
				/>
				<Lines
					name="num-sub"
					text={t(copy.perDollar)}
					x={W / 2}
					y={H * 0.5 + T.big * 0.36 + T.head * 1.9 + T.body * 1.9}
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
						["you", -L.side, you.contracts, "wt-film-gain"],
						["ben", L.side, ben.contracts, "wt-film-loss"],
					] as const
				).map(([holder, dx, contracts, tone]) => (
					<Fragment key={holder}>
						<Word
							name={`ch-multiply-${holder}`}
							x={W / 2 + dx}
							y={L.multiplyY}
							size={T.body * 1.3}
							className="wt-film-num wt-film-accent"
						>
							{`× $${MOVE.toFixed(2)}`}
						</Word>
						<Word
							name={`ch-usd-${holder}`}
							x={W / 2 + dx}
							y={L.payY}
							size={T.num * (L.narrow ? 1.2 : 1)}
							className={`wt-film-num ${tone}`}
						>
							{`≈ ${signedUsd(moveDollars(contracts), 0)}`}
						</Word>
						{/* A mono proxy matches the multiplication's face and lands on its $0.40. */}
						<Word
							name={`ch-move-proxy-${holder}`}
							x={W / 2 + T.small * 1.8}
							y={L.chipY + 4}
							size={T.small}
							className="wt-film-num wt-film-accent"
						>
							{`$${MOVE.toFixed(2)}`}
						</Word>
					</Fragment>
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
	const numCall = one<SVGTextElement>("num-call");
	const numPut = one("num-put");
	const slopeNumber = one<SVGTextElement>("slope-number-proxy");
	const riserNumber = one<SVGTSpanElement>("riser-number");
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
		narrow ? 2 : 2.1,
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
		one("lim-move-up"),
		one("lim-move-down"),
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
	tl.to(marker, { opacity: 1, duration: 0.2 }, 10.2);
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
	tl.to(one("curve-label-call"), { opacity: 1, duration: 0.2 }, 11.2);
	tl.to(one("curve-label-call"), { opacity: 0, duration: 0.3 }, 12.1);
	tl.to(world, { ...pushIn, duration: 1.3, ease: "power2.inOut" }, 12.1);
	show(one("s-head"), 12.5, "above");
	// Pushed in on the slope, the axis labels would crowd the frame's edges: they step out.
	const axisText = [...one("axes").querySelectorAll("text")];
	tl.to(axisText, { opacity: 0, duration: 0.3 }, 12.1);
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
		tl.set(axisText, { fontSize: T.small }, 34.7);
		tl.set(valueTicks, { attr: { x: L.left - 8, "text-anchor": "end" } }, 34.7);
		for (const tick of [0, 8, 16]) {
			tl.set(one(`axis-value-${tick}`), { attr: { y: L.y(tick) + 4 } }, 34.7);
		}
		tl.set(one("dot"), { attr: { r: 3 } }, 34.7);
	}
	tl.to(tangentLine, { opacity: 1, duration: 0.2 }, 13);
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
		13,
	);
	// The $1 leg is already present when the headline names it.
	tl.to(one("step"), { opacity: 1, duration: 0.1 }, 12.4);
	tl.to(
		one("step-line"),
		{ attr: { x2: riserX }, duration: 0.45, ease: "power2.out" },
		12.4,
	);
	if (narrow) tl.set(one("step-corner"), { opacity: 1 }, 12.85);
	tl.to(one("riser"), { opacity: 1, duration: 0.2 }, 14.7);
	tl.to(
		one("riser-line"),
		{ attr: { y2: riserTop }, duration: 0.6, ease: "power3.out" },
		14.7,
	);
	if (narrow) tl.set(one("riser-tip"), { opacity: 1 }, 15.3);
	// Hand the digits to a root proxy before the chart steps back. The original
	// digits disappear in the same frame, so there is no blank or doubled number.
	tl.set(riserNumber, { opacity: 0 }, 15.85);
	tl.set(slopeNumber, { opacity: 1 }, 15.85);
	tl.to(world, { opacity: 0.22, duration: 0.15 }, 15.85);
	// The dim chart clears the upward flight across its tangent and price label.
	hide(one("s-head"), 16);
	sink(16);
	d.carry(slopeNumber, numCall, 16, {
		duration: 0.7,
		arc: "y",
		match: fixed2(CALL_DELTA),
	});
	tl.set(numCall, { scale: 1 }, 16.7);
	show(one("num-word"), 16.8);

	// ——— put: the number flips while the curve folds ———
	tl.addLabel("put", 17.7);
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
	tl.to(
		[one("curve-a"), one("curve-b")],
		{ attr: { d: L.path(put) }, duration: 1.3, ease: "power2.inOut" },
		19.4,
	);
	tl.to(marker, { y: L.y(P0), duration: 1.3, ease: "power2.inOut" }, 19.4);
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
		19.55,
	);
	d.flip(numCall, numPut, 19.5);
	tl.to(one("marker-label-put"), { opacity: 1, duration: 0.4 }, 20.5);
	tl.to(one("curve-label-put"), { opacity: 1, duration: 0.4 }, 20.7);
	// The unfolded −0.48 settles at 20.15; its sentence then holds a full 3.5 s.
	show(one("put-sub"), 20.2);

	// ——— position: the chain ———
	tl.addLabel("position", 23.7);
	hide([one("put-head"), one("put-sub"), one("num-word")], 23.7);
	sink(23.7);
	d.flip(numPut, numCall, 23.7);
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
	const shares = (value: number) => signedCount(Math.round(value));
	show(one("ch-op100"), 25.1);
	land(one("ch-per"), 25.6);
	show(one("ch-op-you"), 26.4);
	land(one("ch-pos-you"), 26.9);
	d.count(
		one<SVGTextElement>("ch-pos-you"),
		positionDelta(you.contracts),
		26.9,
		shares,
	);
	show(one("ch-equiv"), 27.5);
	// The hero: your position's delta, counted, held, then locked; its inputs step back.
	d.lock(lockPos, 27.9, { around: one("ch-pos-you"), pad: 4 });
	tl.addLabel("hero-lock", 27.9);
	tl.to([numCall, one("ch-per")], { opacity: 0.5, duration: 0.4 }, 27.9);
	// Ben: the same chain beside yours, the sign flipped.
	// The lock holds 2.4 s before the column makes room for Ben; Ben's chain comes in close
	// behind, so the dollars both positions make get two seconds together before the cut.
	hide(lockPos, 30.3, 0.3);
	tl.to(
		[one("ch-op-you"), one("ch-pos-you"), one("ch-equiv")],
		{ x: -L.side, duration: 0.55, ease: "power2.inOut" },
		30.35,
	);
	show(one("ch-op-ben"), 30.7);
	land(one("ch-pos-ben"), 30.95);
	show(one("ch-equiv-ben"), 31.2, "below", 0.3);
	d.count(
		one<SVGTextElement>("ch-pos-ben"),
		positionDelta(ben.contracts),
		30.95,
		shares,
	);
	// One move, both positions: ALFA +$0.40, in dollars, for each.
	show(one("ch-chip"), 31.45, "below", 0.18);
	// The y-first route clears the positions and captions. Only the chip at takeoff
	// steps back: +832/−520 and their units stay readable as the dollars are made.
	tl.to(one("ch-chip"), { opacity: 0.22, duration: 0.02 }, 31.63);
	for (const [holder, at] of [
		["you", 31.65],
		["ben", 32.15],
	] as const) {
		d.carry(
			one<SVGGraphicsElement>(`ch-move-proxy-${holder}`),
			one<SVGGraphicsElement>(`ch-multiply-${holder}`),
			at,
			{ duration: 0.45, arc: "y", match: `$${MOVE.toFixed(2)}` },
		);
		// Approximate dollar results land settled, never as a counting equation.
		tl.set(one(`ch-usd-${holder}`), { opacity: 1 }, at + 0.45);
	}
	tl.to(one("ch-chip"), { opacity: 1, duration: 0.15 }, 32.6);

	// ——— limits: the marker rides the curve, a ghost rides the line ———
	tl.addLabel("limits", 34.5);
	hide([...kids("chain"), numCall], 34.5);
	tl.set(world, home, 34.7);
	tl.set([one("curve-a"), one("curve-b")], { attr: { d: L.path(call) } }, 34.7);
	tl.set(marker, { y: my }, 34.7);
	tl.set(
		tangentLine,
		{
			attr: {
				y1: L.y(callTangent(X_RANGE[0])),
				y2: L.y(callTangent(X_RANGE[1])),
			},
		},
		34.7,
	);
	tl.set(
		[one("marker-label-put"), one("curve-label-put")],
		{ opacity: 0 },
		34.7,
	);
	show(one("lim-head"), 34.85, "above");
	rise(34.85);
	tl.to(ghost, { opacity: 1, duration: 0.3 }, 35.3);
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
		const gapPad = Math.min(8, Math.abs(py - gy) / 2);
		gap.setAttribute("y1", String(Math.min(py, gy) + gapPad));
		gap.setAttribute("y2", String(Math.max(py, gy) - gapPad));
		gapLabel.setAttribute("x", String(readX));
		gapLabel.setAttribute("y", String(readY(2)));
		gapLabel.setAttribute("text-anchor", "start");
		gapLabel.textContent = `${t(copy.missed)} ${price(Math.abs(repriced - estimate))}`;
	};
	place();
	tl.to(
		slide,
		{ spot: SPOT + UP, duration: 0.8, ease: "power2.inOut", onUpdate: place },
		35.5,
	);
	// These labels name completed moves, so reveal them only at the endpoints.
	tl.set(one("lim-move-up"), { opacity: 1 }, 36.3);
	tl.to([moveLabel, ghostLabel], { opacity: 1, duration: 0.4 }, 35.5);
	tl.to([gap, gapLabel], { opacity: 0.45, duration: 0.4 }, 35.5);
	// Emphasize the error only once the complete comparison has landed.
	tl.set([gap, gapLabel], { opacity: 1 }, 36.3);
	// Each completed comparison stands still for 1.9 s: 36.3–38.2 and 39–40.9.
	tl.set(one("lim-move-up"), { opacity: 0 }, 38.2);
	tl.set([gap, gapLabel], { opacity: 0.45 }, 38.2);
	tl.set(one("lim-move-down"), { opacity: 1 }, 39);
	tl.set([gap, gapLabel], { opacity: 1 }, 39);
	tl.to(
		slide,
		{ spot: SPOT + DOWN, duration: 0.8, ease: "power2.inOut", onUpdate: place },
		38.2,
	);
	tl.to(one("below"), { opacity: 1, duration: 0.4 }, 38.2);
	tl.to(one("below-label"), { opacity: 1, duration: 0.3 }, 38.4);
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
