import { gsap } from "gsap";
import { useId } from "react";
import {
	ALFA,
	type Copy,
	count,
	OCT_100_CALL,
	pick,
	signedCount,
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
	TitleCard,
	Word,
} from "../walkthrough/film-kit";
import { textWidth } from "../walkthrough/text-measure";
import {
	benColumns,
	benDrift,
	benTrade,
	contracts,
	DAYS,
	DELTA,
	fixed2,
	GAMMA,
	gammaOf,
	hedgeAfter,
	hedgeBefore,
	hedgeFixed,
	MOVE,
	model,
	NEW_DELTA,
	octAtStrike,
	round2,
	SEP_20,
	SEP_DAYS,
	SPOT,
	sepAtStrike,
	series,
	signedPrice,
	withGamma,
	X_RANGE,
	youDrift,
	youTrade,
} from "./gamma-model";

/*
 * Gamma, as a film. It opens where delta's film closed: on 0.52. Subject: delta itself,
 * a marker riding the call's delta curve; gamma is that curve's slope. Secondary: the
 * hedge it moves and the strike it gathers at. Type carries the claims; two charts take
 * turns as the proof, rising from the depth when needed.
 *
 *   open      0–4        "Gamma" wipes on and becomes the corner tag
 *   question  4–9.4      delta 0.52 → ? if ALFA rises $2
 *   curve     9.4–23.6   the delta curve; push in; +$2 along, +0.08 up; cut: +0.08 ÷ $2 =
 *                        0.04, "gamma"
 *   hedge     23.6–35.4  you and Ben, one under the other; ALFA +$2 once; hero: your
 *                        hedge drifts +128, locked, and you sell to flat; Ben's drifts −80
 *                        and he buys
 *   expiry    35.4–45.4  gamma's hill; the 4-day call's spike, 3×; cut: "Gamma lives near
 *                        the strike."
 *   next      45.4–47.4  Next: theta, vega and rho
 */

const END = 47.4;
const DELTA_TOP = 1.15;
const GAMMA_TOP = 0.13;
const deltaAt = (spot: number) => model(OCT_100_CALL, spot).delta;
const deltaCurve = series(deltaAt);
const octCurve = series(
	(spot) => gammaOf(OCT_100_CALL, spot),
	...X_RANGE,
	0.25,
);
const sepCurve = series((spot) => gammaOf(SEP_20, spot), ...X_RANGE, 0.25);
const [you, ben] = [contracts.you, contracts.ben];
const youCols = [hedgeBefore, hedgeAfter] as const;
const times = Math.round(sepAtStrike / octAtStrike);
const shares = (value: number) =>
	Math.round(value) === 0 ? "0" : signedCount(Math.round(value));

function layout(width: number) {
	const frame = filmFrame(width);
	const { height, narrow, room, type: T } = frame;
	// Reserve both worked rows from the bottom up, then leave a 12 px glyph gap
	// below the gamma caption, including on the phone's shorter frame.
	const exposureLabelOffset = narrow
		? T.num * 1.3
		: Math.max(T.num * 1.3, T.num * 0.85 + T.body * 0.3 + 12);
	const exposureBenY = narrow ? height * 0.9 : height - 12 - T.num * 0.3;
	const exposureYouY = narrow
		? height * 0.75
		: exposureBenY - exposureLabelOffset - T.num * 0.25 - T.body - 12;
	const gammaCaptionOffset = T.big * 0.36 + T.head * 1.9 + T.body * 1.9;
	const gammaCardY = Math.min(
		height * 0.5,
		exposureYouY -
			exposureLabelOffset -
			T.body -
			12 -
			T.body * 0.35 -
			gammaCaptionOffset,
	);
	// A phone's axis labels sit left of the plot: room for them inside the frame's edge.
	const left = frame.margin + (narrow ? 18 : 0);
	const right = width * 0.965;
	const top = height * (narrow ? 0.3 : 0.2);
	const bottom = height * 0.84;
	const x = (value: number) =>
		left + ((value - X_RANGE[0]) / (X_RANGE[1] - X_RANGE[0])) * (right - left);
	const scale = (max: number) => (value: number) =>
		bottom - (Math.min(Math.max(value, 0), max) / max) * (bottom - top);
	const yD = scale(DELTA_TOP);
	const yG = scale(GAMMA_TOP);
	const path = (
		points: readonly (readonly [number, number])[],
		y: (value: number) => number,
	) =>
		points
			.map(
				([px, py], i) =>
					`${i ? "L" : "M"}${x(px).toFixed(1)} ${y(py).toFixed(1)}`,
			)
			.join("");
	/** Equations share one size: the largest at which the longer still fits. */
	const equations = [
		`${fixed2(DELTA)} + ${fixed2(GAMMA)} × ${MOVE} = ${fixed2(NEW_DELTA)}`,
		`${fixed2(DELTA)} × ${MOVE} + ½ × ${fixed2(GAMMA)} × ${MOVE}² = ${signedPrice(withGamma(MOVE))}`,
	] as const;
	const eqSize = Math.min(
		frame.type.head * 1.15,
		...equations.map((text) => (room / textWidth(text, 1)) * 0.98),
	);
	const columns = (narrow ? [0.2, 0.5, 0.8] : [0.28, 0.5, 0.72]).map(
		(f) => width * f,
	);
	/** The gamma chart's legend: top right of the plot, clear of the spike at the strike. */
	const legend = {
		x: narrow
			? Math.min(x(105.4), width - 18 - 24 - textWidth(`${DAYS} days`, T.body))
			: x(105.4),
		y: yG(0.122),
		size: narrow ? T.body : undefined,
		row: narrow ? T.body * 1.5 : 16,
	};
	return {
		...frame,
		left,
		right,
		top,
		bottom,
		x,
		yD,
		yG,
		legend,
		path,
		equations,
		eqSize,
		columns,
		gammaCardY,
		gammaCaptionY: gammaCardY + gammaCaptionOffset,
		exposureLabelOffset,
		exposureRows: { you: exposureYouY, ben: exposureBenY },
	};
}

const copy = {
	title: ["Gamma", "Gamma"],
	titleSub: ["how fast delta moves", "Delta 变化的速度"],
	qFrom: [`delta ${fixed2(DELTA)}`, `Delta ${fixed2(DELTA)}`],
	qTo: ["→ ?", "→ ?"],
	qLine: [
		`If ALFA rises $${MOVE}, does the call's delta stay put?`,
		`ALFA 上涨 $${MOVE}，看涨的 Delta 会保持不变吗？`,
	],
	deltaAxis: ["call delta", "看涨 Delta"],
	gammaAxis: ["gamma per $1", "每 $1 的 Gamma"],
	priceAxis: ["ALFA price today", "ALFA 今天的价格"],
	gammaWord: ["gamma", "Gamma"],
	gammaSub: ["delta's change per $1 of ALFA", "ALFA 每变动 $1，Delta 的变化"],
	curveHead: ["Delta climbs as ALFA rises.", "ALFA 上涨，Delta 随之上升。"],
	colCallsShort: ["calls' Δ", "看涨 Δ"],
	colSharesShort: ["shares", "股票"],
	hedgeHead: ["Gamma moves the hedge.", "Gamma 会推动对冲。"],
	hedgeClaim: [
		"Long gamma sells a rise; short gamma buys.",
		"正 Gamma 涨时卖出，负 Gamma 买入。",
	],
	you: [`You · long ${you} calls`, `你 · 多头 ${you} 张看涨`],
	ben: [
		`Ben · short ${Math.abs(ben)} calls`,
		`Ben · 空头 ${Math.abs(ben)} 张看涨`,
	],
	youGamma: ["You · long gamma", "你 · 正 Gamma"],
	benGamma: ["Ben · short gamma", "Ben · 负 Gamma"],
	youCalls: [`${you} calls`, `${you} 张看涨`],
	benCalls: [`−${Math.abs(ben)} calls`, `−${Math.abs(ben)} 张看涨`],
	youExposure: ["You · share-equivalents", "你 · 等效股数"],
	benExposure: ["Ben · share-equivalents", "Ben · 等效股数"],
	colCalls: ["calls' delta", "看涨 Delta"],
	colShares: ["shares held", "持有股票"],
	colNet: ["net", "净额"],
	chip: [`ALFA +$${MOVE}`, `ALFA +$${MOVE}`],
	youTrade: [
		`→ sell ${count(-youTrade)} shares to be flat`,
		`→ 卖出 ${count(-youTrade)} 股回到中性`,
	],
	benTrade: [
		`→ buy ${count(benTrade)} shares to be flat`,
		`→ 买入 ${count(benTrade)} 股回到中性`,
	],
	expiryHead: [
		"Near expiry, gamma gathers at the strike.",
		"临近到期，Gamma 聚集在行权价。",
	],
	expiryHeadShort: ["Near expiry, gamma gathers.", "临近到期，Gamma 聚集。"],
	octLabel: [`Oct 18 · ${DAYS} days`, `10月18日 · ${DAYS} 天`],
	octShort: [`${DAYS} days`, `${DAYS} 天`],
	sepLabel: [`Sep 20 · ${SEP_DAYS} days`, `9月20日 · ${SEP_DAYS} 天`],
	sepShort: [`${SEP_DAYS} days`, `${SEP_DAYS} 天`],
	claimBig: ["Gamma lives near the strike.", "Gamma 集中在行权价。"],
	claimSub: [
		"Sharper near expiry; weaker away from the strike.",
		"越近到期越尖；远离行权价则减弱。",
	],
	nextBig: ["Next: theta, vega and rho", "下一课：Theta、Vega 与 Rho"],
	nextSub: [
		"what time, volatility and rates do to the price",
		"时间、波动率与利率对价格的影响",
	],
} as const satisfies Record<string, Copy>;

function Axes({
	L,
	ticks,
	format,
	y,
	caption,
	locale,
}: {
	L: ReturnType<typeof layout>;
	ticks: readonly number[];
	format: (value: number) => string;
	y: (value: number) => number;
	caption: Copy;
	locale: Locale;
}) {
	const t = (value: Copy) => pick(value, locale);
	return (
		<g>
			{ticks.map((tick) => (
				<g key={tick}>
					<path
						d={`M${L.left} ${y(tick)}H${L.right}`}
						className={tick === 0 ? "wt-axis" : "wt-grid"}
					/>
					<text
						x={L.left - 8}
						y={y(tick) + 4}
						textAnchor="end"
						className="wt-small"
					>
						{format(tick)}
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
			<text x={L.right} y={L.bottom + 32} textAnchor="end" className="wt-small">
				{t(copy.priceAxis)}
			</text>
			<text x={L.left} y={L.top - 12} className="wt-small">
				{t(caption)}
			</text>
		</g>
	);
}

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
	const mx = L.x(SPOT);
	const my = L.yD(DELTA);
	const sx = L.x(SPOT + MOVE);
	const toWidth = textWidth(t(copy.qTo), T.num);
	const chipX = W / 2 + 8 + toWidth / 2;
	const chipY = H * 0.4 - T.num * 1.15;
	const chipW = textWidth(`+$${MOVE}`, T.small) + 14;
	const tableChipW = textWidth(t(copy.chip), T.body) + 20;
	const deltaCue = `Δ ${fixed2(DELTA)} → ${fixed2(NEW_DELTA)}`;
	const cueGap = 14;
	const tableChipX =
		(W - tableChipW - cueGap - textWidth(deltaCue, T.body)) / 2 +
		tableChipW / 2;
	const hedgeRows = {
		chip: H * (narrow ? 0.27 : 0.28),
		labels: H * 0.36,
		you: H * (narrow ? 0.49 : 0.5),
		ben: H * (narrow ? 0.68 : 0.69),
	};
	const column = (values: readonly number[], who: "you" | "ben") =>
		values.map((value, i) => (
			<Word
				key={L.columns[i]}
				name={`h-${who}-${i}`}
				x={L.columns[i]}
				y={hedgeRows[who]}
				size={i === 2 ? T.num * 1.35 : T.num}
				className="wt-film-num"
			>
				{shares(value)}
			</Word>
		));
	return (
		<>
			<Backdrop frame={L} />
			<defs>
				{(["d", "g"] as const).map((chart) => (
					<g key={chart}>
						<clipPath id={`${chart}l-${id}`}>
							<rect
								data-f={`clip-${chart}l`}
								x={mx}
								y={0}
								width={0}
								height={H}
							/>
						</clipPath>
						<clipPath id={`${chart}r-${id}`}>
							<rect
								data-f={`clip-${chart}r`}
								x={mx}
								y={0}
								width={0}
								height={H}
							/>
						</clipPath>
					</g>
				))}
			</defs>

			{/* The proof: two charts that take turns. */}
			<g data-f="depth">
				<g data-f="world">
					<g data-f="chart-delta">
						<Axes
							L={L}
							ticks={[0, 0.5, 1]}
							format={(value) => value.toFixed(1)}
							y={L.yD}
							caption={copy.deltaAxis}
							locale={locale}
						/>
						{(["l", "r"] as const).map((side) => (
							<g key={side} clipPath={`url(#d${side}-${id})`}>
								<path
									className="wt-line-position"
									strokeDasharray="6 5"
									d={L.path(deltaCurve, L.yD)}
								/>
							</g>
						))}
						<line
							data-f="d-tangent"
							className="wt-film-tangent"
							x1={mx}
							y1={my}
							x2={mx}
							y2={my}
						/>
						<g data-f="d-step">
							<line
								data-f="d-step-line"
								className="wt-film-step"
								x1={mx}
								y1={my}
								x2={sx}
								y2={my}
							/>
							<text
								x={(mx + sx) / 2}
								y={my + 16}
								textAnchor="middle"
								className="wt-small wt-halo wt-accent"
							>
								{`+$${MOVE}`}
							</text>
						</g>
						<g data-f="d-riser">
							<line
								data-f="d-riser-line"
								className="wt-film-riser"
								x1={sx}
								y1={my}
								x2={sx}
								y2={my}
							/>
							<text
								x={sx + 8}
								y={(my + L.yD(NEW_DELTA)) / 2 + 4}
								className="wt-halo wt-accent wt-marker-label"
							>
								{`+${fixed2(NEW_DELTA - DELTA)}`}
							</text>
						</g>
						<g data-f="d-marker">
							<circle data-f="d-ripple" r={6} className="wt-film-ripple" />
							<circle
								data-f="d-dot"
								r={6}
								className="wt-chip"
								stroke="var(--foreground)"
								strokeWidth={1.5}
							/>
						</g>
						<text
							data-f="d-value"
							x={mx - 10}
							y={my - 12}
							textAnchor="end"
							className="wt-halo wt-accent wt-marker-label"
						>
							{fixed2(DELTA)}
						</text>
					</g>
					<g data-f="chart-gamma">
						<Axes
							L={L}
							ticks={[0, 0.05, 0.1]}
							format={(value) => value.toFixed(2)}
							y={L.yG}
							caption={copy.gammaAxis}
							locale={locale}
						/>
						{(["l", "r"] as const).map((side) => (
							<g key={side} clipPath={`url(#g${side}-${id})`}>
								<path
									className="wt-line-position"
									strokeDasharray="6 5"
									d={L.path(octCurve, L.yG)}
								/>
							</g>
						))}
						<path
							data-f="g-sep"
							className="wt-line-long"
							strokeDasharray="6 5"
							d={L.path(octCurve, L.yG)}
						/>
						{(
							[
								[
									"g-oct-label",
									"wt-line-position",
									"wt-label-position",
									narrow ? copy.octShort : copy.octLabel,
								],
								[
									"g-sep-label",
									"wt-line-long",
									"wt-label-long",
									narrow ? copy.sepShort : copy.sepLabel,
								],
							] as const
						).map(([name, line, label, text], i) => (
							<g key={name} data-f={name}>
								<path
									d={`M${L.legend.x} ${L.legend.y + i * L.legend.row - 4}h18`}
									className={line}
									strokeDasharray="6 5"
								/>
								<text
									x={L.legend.x + 24}
									y={L.legend.y + i * L.legend.row}
									className={`wt-small ${label}`}
									style={{ fontSize: L.legend.size }}
								>
									{t(text)}
								</text>
							</g>
						))}
						{(
							[
								["g-oct-height", -12, octAtStrike, "wt-line-position"],
								["g-sep-height", 12, sepAtStrike, "wt-line-long"],
							] as const
						).map(([name, offset, gamma, color]) => (
							<path
								key={name}
								data-f={name}
								d={`M${L.x(SPOT) + offset - 4} ${L.bottom}h8M${L.x(SPOT) + offset} ${L.bottom}V${L.yG(gamma)}M${L.x(SPOT) + offset + Math.sign(offset) * 4} ${L.yG(gamma)}H${L.x(SPOT)}`}
								className={color}
								strokeWidth={2}
							/>
						))}
						<Word
							name="g-times"
							x={L.x(SPOT + 1.6)}
							y={L.yG(sepAtStrike) + T.num * 0.3}
							size={T.num}
							anchor="start"
							className="wt-film-num wt-label-long"
						>
							{`${times}×`}
						</Word>
					</g>
				</g>
			</g>

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				<Word
					name="q-from"
					x={W / 2 - 8}
					y={H * 0.4}
					size={T.num}
					anchor="end"
					className="wt-film-num"
				>
					{t(copy.qFrom)}
				</Word>
				<Word
					name="q-to"
					x={W / 2 + 8}
					y={H * 0.4}
					size={T.num}
					anchor="start"
					className="wt-film-num wt-film-accent"
				>
					{t(copy.qTo)}
				</Word>
				<g data-f="q-chip">
					<rect
						x={chipX - chipW / 2}
						y={chipY - T.small - 4}
						width={chipW}
						height={T.small + 10}
						rx={6}
						className="wt-chip"
					/>
					<text
						x={chipX}
						y={chipY}
						textAnchor="middle"
						className="wt-chip-text"
						style={{ fontSize: T.small }}
					>
						{`+$${MOVE}`}
					</text>
				</g>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.6}
					size={T.head}
					maxWidth={room}
				/>
			</g>
			<g data-f="g">
				<Word
					name="g-num"
					x={W / 2}
					y={L.gammaCardY + T.big * 0.36}
					size={T.big}
					className="wt-film-num"
				>
					{fixed2(GAMMA)}
				</Word>
				<Word
					name="g-word"
					x={W / 2}
					y={L.gammaCardY + T.big * 0.36 + T.head * 1.9}
					size={T.head}
					className="wt-film-type wt-film-accent"
				>
					{t(copy.gammaWord)}
				</Word>
				<Lines
					name="g-sub"
					text={t(copy.gammaSub)}
					x={W / 2}
					y={L.gammaCaptionY}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{/* Worked position deltas; the settled results become the table's first column. */}
			{(
				[
					[
						"you",
						you,
						hedgeBefore.options,
						copy.youExposure,
						L.exposureRows.you,
					],
					[
						"ben",
						ben,
						benColumns[0].options,
						copy.benExposure,
						L.exposureRows.ben,
					],
				] as const
			).map(([who, quantity, result, label, y]) => {
				const expression = `${quantity < 0 ? `−${Math.abs(quantity)}` : quantity} × ${ALFA.multiplier} × ${fixed2(DELTA)} =`;
				const prefixW = textWidth(expression, T.body);
				const resultW = textWidth(shares(result), T.num);
				const start = (W - prefixW - T.small - resultW) / 2;
				return (
					<g key={who} data-f={`h-derive-${who}`}>
						<Word
							name={`h-derive-${who}-label`}
							x={start}
							y={y - L.exposureLabelOffset}
							size={T.body}
							anchor="start"
							className="wt-film-tag"
						>
							{t(label).toUpperCase()}
						</Word>
						<Word
							name={`h-derive-${who}-calc`}
							x={start}
							y={y}
							size={T.body}
							anchor="start"
							className="wt-film-num"
						>
							{expression}
						</Word>
						<Word
							name={`h-derive-${who}-result`}
							x={start + prefixW + T.small + resultW / 2}
							y={y}
							size={T.num}
							className="wt-film-num"
						>
							{shares(result)}
						</Word>
					</g>
				);
			})}
			<Brackets name="lock-hedge" glow />
			<g data-f="hedge">
				<Lines
					name="h-head"
					text={t(copy.hedgeHead)}
					x={L.margin}
					y={L.headY}
					size={T.head}
					maxWidth={room}
					anchor="start"
				/>
				<Lines
					name="h-claim"
					text={t(copy.hedgeClaim)}
					x={L.margin}
					y={
						L.headY + lineCount(t(copy.hedgeHead), room, T.head) * T.head * 1.35
					}
					size={T.head}
					maxWidth={room}
					anchor="start"
				/>
				{(
					[
						["h-who-you", copy.you, hedgeRows.you],
						["h-who-ben", copy.ben, hedgeRows.ben],
					] as const
				).map(([name, label, y]) => (
					<Word
						key={name}
						name={name}
						x={L.margin}
						y={y - T.num * 1.15}
						size={T.small}
						anchor="start"
						className="wt-film-tag"
					>
						{t(label).toUpperCase()}
					</Word>
				))}
				{(
					[
						["you", copy.youGamma, copy.youCalls, hedgeRows.you],
						["ben", copy.benGamma, copy.benCalls, hedgeRows.ben],
					] as const
				).map(([who, gamma, calls, y]) => (
					<g key={who} data-f={`h-holder-${who}`}>
						<Word
							name={`h-gamma-${who}`}
							x={L.margin}
							y={y - T.num * 1.15}
							size={T.body}
							anchor="start"
							className="wt-film-type"
						>
							{t(gamma)}
						</Word>
						<Word
							name={`h-calls-${who}`}
							x={W - L.margin}
							y={y - T.num * 1.15}
							size={T.small}
							anchor="end"
							className="wt-film-tag"
						>
							{t(calls).toUpperCase()}
						</Word>
					</g>
				))}
				{(narrow
					? [copy.colCallsShort, copy.colSharesShort, copy.colNet]
					: [copy.colCalls, copy.colShares, copy.colNet]
				).map((label, i) => (
					<Word
						key={label[0]}
						name={`h-col-${i}`}
						x={L.columns[i]}
						y={hedgeRows.labels}
						size={T.small}
						className="wt-film-tag"
					>
						{t(label).toUpperCase()}
					</Word>
				))}
				{column([youCols[0].options, youCols[0].shares, 0], "you")}
				{column([benColumns[0].options, benColumns[0].shares, 0], "ben")}
				<g data-f="h-chip">
					<rect
						x={tableChipX - tableChipW / 2}
						y={hedgeRows.chip - T.body - 5}
						width={tableChipW}
						height={T.body + 13}
						rx={7}
						className="wt-chip"
					/>
					<text
						x={tableChipX}
						y={hedgeRows.chip}
						textAnchor="middle"
						className="wt-chip-text"
						style={{ fontSize: T.body }}
					>
						{t(copy.chip)}
					</text>
				</g>
				<Word
					name="h-delta"
					x={tableChipX + tableChipW / 2 + cueGap}
					y={hedgeRows.chip}
					size={T.body}
					anchor="start"
					className="wt-film-num wt-film-dim"
				>
					{deltaCue}
				</Word>
				{(
					[
						["h-trade-you", copy.youTrade, hedgeRows.you],
						["h-trade-ben", copy.benTrade, hedgeRows.ben],
					] as const
				).map(([name, label, y]) => (
					<Word
						key={name}
						name={name}
						x={narrow ? L.margin : W / 2}
						y={y + T.body * 1.75}
						size={T.body}
						anchor={narrow ? "start" : "middle"}
						className="wt-film-type wt-film-accent"
					>
						{t(label)}
					</Word>
				))}
			</g>
			<Lines
				name="k-head"
				text={t(copy.curveHead)}
				x={L.margin}
				y={L.headY}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
			<Word
				name="g-calc"
				x={W / 2}
				y={L.gammaCardY - T.big * (narrow ? 0.75 : 0.55)}
				size={T.head}
				className="wt-film-num wt-film-dim"
			>
				{`+${fixed2(NEW_DELTA - DELTA)} ÷ $${MOVE}`}
			</Word>
			<Lines
				name="e-head"
				text={t(narrow ? copy.expiryHeadShort : copy.expiryHead)}
				x={L.margin}
				y={L.headY}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
			<g data-f="claim">
				<Lines
					name="c-big"
					text={t(copy.claimBig)}
					x={W / 2}
					y={H * 0.46}
					size={T.title}
					maxWidth={room}
				/>
				<Lines
					name="c-sub"
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
	const { width: W, height: H } = context;
	const L = layout(W);
	const { narrow } = L;
	const d = createDirector(context, L, END);
	const { tl, one, kids, show, hide, rise, sink, cam, home, world } = d;
	/** A figure lands slightly large and settles, without overshoot: it is data. */
	const land = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.12, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const lockHedge = one<SVGGraphicsElement>("lock-hedge");
	const mx = L.x(SPOT);
	const my = L.yD(DELTA);
	const marker = one("d-marker");
	const value = one<SVGTextElement>("d-value");
	const tangent = one<SVGLineElement>("d-tangent");
	const chartDelta = one("chart-delta");
	const chartGamma = one("chart-gamma");
	const pushIn = cam(
		narrow ? 1.6 : 2,
		{ x: L.x(SPOT + 1), y: L.yD(DELTA + 0.04) },
		{ x: W * 0.46, y: H * 0.54 },
	);
	const tangentAt = (spot: number) => DELTA + GAMMA * (spot - SPOT);

	// Everything at rest: hidden until its shot needs it.
	gsap.set(marker, { x: mx, y: my - 90, opacity: 0 });
	gsap.set(one("d-dot"), { transformOrigin: "50% 100%" });
	gsap.set(one("d-ripple"), { opacity: 0, attr: { r: 6 } });
	gsap.set(one("d-step-line"), { attr: { x2: mx } });
	gsap.set(chartGamma, { opacity: 0 });
	d.hidden([
		value,
		tangent,
		one("d-step"),
		one("d-riser"),
		one("g-sep"),
		one("g-oct-label"),
		one("g-sep-label"),
		one("g-times"),
		one("g-oct-height"),
		one("g-sep-height"),
		...kids("q"),
		...kids("g"),
		one<SVGGraphicsElement>("lock-hedge"),
		...kids("hedge"),
		...kids("h-derive-you"),
		...kids("h-derive-ben"),
		...kids("h-holder-you"),
		...kids("h-holder-ben"),
		one("k-head"),
		one("g-calc"),
		one("e-head"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: delta 0.52 → ? ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-from"), 4.6);
	show(one("q-to"), 5.0, "right");
	land(one("q-chip"), 5.4);
	show(one("q-line"), 5.8);

	// ——— curve: delta has a slope of its own ———
	tl.addLabel("curve", 9.4);
	hide(kids("q"), 9.4);
	rise(9.6);
	tl.to(marker, { opacity: 1, duration: 0.2 }, 10.4);
	tl.to(marker, { y: my, duration: 0.55, ease: "power2.in" }, 10.4);
	tl.fromTo(
		one("d-dot"),
		{ scale: 1.3 },
		{ scale: 1, duration: 0.45, ease: "power3.out" },
		10.95,
	);
	tl.fromTo(
		one("d-ripple"),
		{ opacity: 0.6, attr: { r: 6 } },
		{ opacity: 0, attr: { r: 26 }, duration: 0.7, ease: "power2.out" },
		11,
	);
	// The curve grows out of the marker: low and flat to the left, up toward 1 on the right.
	tl.to(
		one("clip-dl"),
		{
			attr: { x: L.left - 4, width: mx - L.left + 4 },
			duration: 1.3,
			ease: "power2.inOut",
		},
		11.2,
	);
	tl.to(
		one("clip-dr"),
		{ attr: { width: L.right - mx + 4 }, duration: 1.3, ease: "power2.inOut" },
		11.2,
	);
	tl.fromTo(
		value,
		{ opacity: 0, attr: { y: my - 2 } },
		{ opacity: 1, attr: { y: my - 12 }, duration: 0.5 },
		11.7,
	);
	show(one("k-head"), 11.4, "above");
	tl.to(world, { ...pushIn, duration: 1.3, ease: "power2.inOut" }, 12.2);
	// Pushed in on the slope, the axis labels would crowd the frame's edges: they step out.
	const axisText = [
		...(chartDelta.firstElementChild as Element).querySelectorAll("text"),
	];
	tl.to(axisText, { opacity: 0, duration: 0.3 }, 12.2);
	tl.to(tangent, { opacity: 1, duration: 0.2 }, 13.1);
	tl.to(
		tangent,
		{
			attr: {
				x1: L.x(X_RANGE[0]),
				y1: L.yD(tangentAt(X_RANGE[0])),
				x2: L.x(X_RANGE[1]),
				y2: L.yD(tangentAt(X_RANGE[1])),
			},
			duration: 1.0,
			ease: "power2.inOut",
		},
		13.1,
	);
	tl.to(one("d-step"), { opacity: 1, duration: 0.2 }, 14.2);
	tl.to(
		one("d-step-line"),
		{ attr: { x2: L.x(SPOT + MOVE) }, duration: 0.5, ease: "power2.out" },
		14.2,
	);
	tl.to(one("d-riser"), { opacity: 1, duration: 0.2 }, 14.8);
	tl.to(
		one("d-riser-line"),
		{ attr: { y2: L.yD(NEW_DELTA) }, duration: 0.6, ease: "power3.out" },
		14.8,
	);
	// Then the marker climbs the curve to the top of the rise, its delta counting with it.
	const slide = { spot: SPOT };
	const place = () => {
		const px = L.x(slide.spot);
		const py = L.yD(deltaAt(slide.spot));
		gsap.set(marker, { x: px, y: py });
		value.setAttribute("x", String(px - 10));
		value.setAttribute("y", String(py - 12));
		value.textContent = fixed2(round2(deltaAt(slide.spot)));
	};
	tl.to(
		slide,
		{ spot: SPOT + MOVE, duration: 1.1, ease: "power2.inOut", onUpdate: place },
		15.8,
	);
	// Cut: the slope gets its name, worked out: +0.08 over $2.
	// The definition settles at 18.95, then the first application starts at 19.4.
	hide(one("k-head"), 17.4);
	sink(17.4);
	show(one("g-calc"), 17.8);
	land(one("g-num"), 18.2);
	show(one("g-word"), 18.35);
	// On a phone the caption fades in place instead of rising through the worked label.
	if (narrow) {
		tl.fromTo(
			one("g-sub"),
			{ opacity: 0 },
			{ opacity: 1, duration: 0.5 },
			18.45,
		);
	} else show(one("g-sub"), 18.45);
	for (const [who, at] of [
		["you", 19.4],
		["ben", 19.7],
	] as const) {
		// Fade the worked rows in place, so neither label nor equation travels across text.
		tl.fromTo(
			[one(`h-derive-${who}-label`), one(`h-derive-${who}-calc`)],
			{ opacity: 0 },
			{ opacity: 1, duration: 0.3 },
			at,
		);
		// A fade alone leaves the result untransformed for its later carry.
		tl.fromTo(
			one(`h-derive-${who}-result`),
			{ opacity: 0 },
			{ opacity: 1, duration: 0.18 },
			at + 0.1,
		);
	}
	// The definition stays readable; its big number steps back for the worked positions.
	tl.to(
		[one("g-num"), one("g-word"), one("g-calc")],
		{ opacity: 0.45, duration: 0.3 },
		21.0,
	);

	// ——— hedge: the same delta, carried onto a position ———
	tl.addLabel("hedge", 23.6);
	// Complete rows settle at 19.7/20.0 and hold 3.9/3.6 s before their lanes clear.
	hide([...kids("g"), one("g-calc")], 23.6, 0.1, 0);
	// Clear the calculation lanes before either result flies across, then upward.
	hide(
		[
			one("h-derive-you-label"),
			one("h-derive-you-calc"),
			one("h-derive-ben-label"),
			one("h-derive-ben-calc"),
		],
		23.6,
		0.1,
		0,
	);
	d.carry(
		one<SVGGraphicsElement>("h-derive-you-result"),
		one<SVGGraphicsElement>("h-you-0"),
		23.75,
		{ duration: 0.75, arc: "x" },
	);
	d.carry(
		one<SVGGraphicsElement>("h-derive-ben-result"),
		one<SVGGraphicsElement>("h-ben-0"),
		24.15,
		{ duration: 0.75, arc: "x" },
	);
	show(one("h-head"), 23.8, "above");
	show([one("h-col-0"), one("h-col-1"), one("h-col-2")], 24.2);
	show(one("h-who-you"), 24.55, "above");
	land(one("h-you-1"), 24.65);
	land(one("h-you-2"), 24.8);
	show(one("h-who-ben"), 24.95, "above");
	land(one("h-ben-1"), 25.25);
	land(one("h-ben-2"), 25.4);
	// ALFA rises $2, once, for both; the new delta settles before exposures change.
	show(one("h-chip"), 25.7);
	tl.fromTo(
		one("h-delta"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.25 },
		26.0,
	);
	d.count(
		one<SVGTextElement>("h-you-0"),
		hedgeAfter.options,
		26.5,
		shares,
		hedgeBefore.options,
	);
	const warn = { attr: { class: "wt-film-num wt-film-warn" }, duration: 0.2 };
	const flat = { attr: { class: "wt-film-num" }, duration: 0.2 };
	d.count(one<SVGTextElement>("h-you-2"), youDrift, 26.5, shares);
	tl.to(one("h-you-2"), warn, 26.5);
	d.count(
		one<SVGTextElement>("h-ben-0"),
		benColumns[1].options,
		26.9,
		shares,
		benColumns[0].options,
	);
	d.count(one<SVGTextElement>("h-ben-2"), benDrift, 26.9, shares);
	// The hero: your hedge's drift, locked once its count has landed; the rest steps back.
	// The brackets are fitted now, so measure the figure with the text its count ends on.
	const youNet = one<SVGTextElement>("h-you-2");
	const youNetText = youNet.textContent;
	youNet.textContent = shares(youDrift);
	d.lock(lockHedge, 28.0, { around: youNet, pad: 6 });
	youNet.textContent = youNetText;
	tl.addLabel("hero-lock", 28.0);
	const rest = [
		one("h-you-0"),
		one("h-you-1"),
		one("h-ben-0"),
		one("h-ben-1"),
		one("h-ben-2"),
	];
	tl.to(rest, { opacity: 0.45, duration: 0.4 }, 28.0);
	// After the lock, both drifts lit side by side: Ben's goes the other way, and the rule
	// is named while the two stand together. Then the trades, one step at a time.
	show(one("h-trade-you"), 28.4);
	hide(lockHedge, 29.8, 0.3);
	tl.to(rest, { opacity: 1, duration: 0.4 }, 29.8);
	tl.to(one("h-ben-2"), warn, 30.0);
	show(one("h-claim"), 30.2);
	// Clear the input cue before the rule enters; its settled hold is 3.55 s.
	hide(one("h-delta"), 29.8, 0.3, 0);
	// On a phone the rule's second line needs the move chip's lane too.
	if (narrow) hide(one("h-chip"), 29.8, 0.3, 0);
	d.count(
		one<SVGTextElement>("h-you-1"),
		hedgeFixed.shares,
		31.7,
		shares,
		hedgeAfter.shares,
	);
	d.count(one<SVGTextElement>("h-you-2"), 0, 31.7, shares, youDrift);
	tl.to(one("h-you-2"), flat, 32.4);
	show(one("h-trade-ben"), 31.85);
	d.count(
		one<SVGTextElement>("h-ben-1"),
		benColumns[2].shares,
		32.5,
		shares,
		benColumns[1].shares,
	);
	d.count(one<SVGTextElement>("h-ben-2"), 0, 32.5, shares, benDrift);
	tl.to(one("h-ben-2"), flat, 33.2);
	// Bind signs before trading: both tags and signed quantities settle by 31.65.
	for (const [who, at] of [
		["you", 30.6],
		["ben", 31.0],
	] as const) {
		tl.set(one(`h-holder-${who}`), { opacity: 1 }, at);
		d.flip(one(`h-who-${who}`), one(`h-gamma-${who}`), at);
		tl.set(one(`h-who-${who}`), { opacity: 0 }, at + 0.3);
		show(one(`h-calls-${who}`), at + 0.3, "above", 0.35);
	}

	// ——— expiry: where gamma lives ———
	tl.addLabel("expiry", 35.4);
	hide(kids("hedge"), 35.4);
	tl.set(world, home, 35.6);
	tl.set(chartDelta, { opacity: 0 }, 35.6);
	tl.set(chartGamma, { opacity: 1 }, 35.6);
	show(one("e-head"), 35.8, "above");
	rise(35.8);
	tl.to(
		one("clip-gl"),
		{
			attr: { x: L.left - 4, width: mx - L.left + 4 },
			duration: 0.9,
			ease: "power2.inOut",
		},
		36.1,
	);
	tl.to(
		one("clip-gr"),
		{ attr: { width: L.right - mx + 4 }, duration: 0.9, ease: "power2.inOut" },
		36.1,
	);
	tl.to(one("g-oct-label"), { opacity: 1, duration: 0.4 }, 36.9);
	// The 4-day call starts as the same hill, then rises into a spike at the strike.
	tl.to(one("g-sep"), { opacity: 1, duration: 0.2 }, 37.1);
	tl.to(
		one("g-sep"),
		{
			attr: { d: L.path(sepCurve, L.yG) },
			duration: 1.0,
			ease: "power3.inOut",
		},
		37.1,
	);
	tl.to(one("g-sep-label"), { opacity: 1, duration: 0.4 }, 37.9);
	// Both measures start at zero: the complete September height is about three Octobers.
	d.trace(one<SVGPathElement>("g-oct-height"), 37.7, { duration: 0.35 });
	d.trace(one<SVGPathElement>("g-sep-height"), 38.1, { duration: 0.4 });
	// Both zero-based heights are complete; the ratio settles for 2.25 s before the cut.
	tl.fromTo(
		one("g-times"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.25 },
		38.5,
	);
	// Cut: the claim, held to be read.
	hide(one("e-head"), 41.0);
	sink(41.0);
	tl.fromTo(
		one("c-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
		41.4,
	);
	show(one("c-sub"), 41.8);

	// ——— next ———
	tl.addLabel("next", 45.4);
	hide(kids("claim"), 45.4);
	d.close(45.4);
	return tl;
}

export const gammaFilm: Film = {
	id: "gamma",
	label: [
		"Gamma, as a short film: the call's delta against ALFA's price and the slope of that curve, how gamma moves a delta hedge for a long and a short holder, and how gamma gathers at the strike near expiry",
		"Gamma 短片：看涨的 Delta 随 ALFA 价格变化及这条曲线的斜率、Gamma 如何推动多头与空头的 Delta 对冲，以及临近到期时 Gamma 如何聚集在行权价",
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Gamma", "Gamma"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "curve", label: ["Delta's slope", "Delta 的斜率"] },
		{ id: "hedge", label: ["The hedge", "对冲"] },
		{ id: "expiry", label: ["Near expiry", "临近到期"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
