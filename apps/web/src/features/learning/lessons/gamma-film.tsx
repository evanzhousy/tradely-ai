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
	signTone,
	TitleCard,
	toneClass,
	toneColor,
	Word,
} from "../walkthrough/film-kit";
import { textWidth } from "../walkthrough/text-measure";
import {
	benColumns,
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
 *   curve     9.4–22.15  carry 0.52 onto the delta curve; push in; +$2 along, +0.08 up;
 *                        cut: +0.08 ÷ $2 =
 *                        0.04, "gamma"
 *   hedge     22.15–35.4 you and Ben, one under the other; baseline settles for 1 s;
 *                        ALFA +$2 once, delta 0.52 → 0.60; hero: your
 *                        hedge drifts +128, locked, and you sell to flat; Ben's drifts −80
 *                        and he buys
 *   expiry    35.4–45.45 gamma's hill; the 4-day call's spike, 3×; cut: "Gamma lives near
 *                        the strike."
 *   next      45.45–47.45 Next: theta, vega and rho
 */

const END = 47.45;
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
const signedClass = (value: number) => {
	const tone = signTone(value);
	return `wt-film-num ${tone ? toneClass[tone] : "wt-film-dim"}`;
};
const exposureExpression = (quantity: number, delta: number) =>
	`${quantity < 0 ? `−${Math.abs(quantity)}` : quantity} × ${ALFA.multiplier} × ${fixed2(delta)}`;

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
	qLabel: ["delta", "Delta"],
	qTo: ["→ ?", "→ ?"],
	qLine: [
		`ALFA +$${MOVE}: does delta change?`,
		`ALFA 涨 $${MOVE}，Delta 变吗？`,
	],
	deltaAxis: ["call delta", "看涨 Delta"],
	gammaAxis: ["gamma per $1", "每 $1 的 Gamma"],
	priceAxis: ["ALFA price today", "ALFA 今天的价格"],
	gammaWord: ["gamma", "Gamma"],
	gammaSub: ["Delta change per $1", "每 $1 Delta 变动"],
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
		"Sharper near expiry; weaker off strike.",
		"临近到期更尖；远离行权价更弱。",
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
	const deltaChange = `Δ ${fixed2(DELTA)} → ${fixed2(NEW_DELTA)}`;
	const tableChipX = W / 2;
	const hedgeRows = {
		chip: H * (narrow ? 0.27 : 0.28),
		labels: H * 0.36,
		you: H * (narrow ? 0.49 : 0.5),
		ben: H * (narrow ? 0.68 : 0.69),
	};
	const column = (values: readonly number[], who: "you" | "ben") =>
		values.map((value, i) => (
			<text
				key={L.columns[i]}
				data-f={`h-${who}-${i}`}
				x={L.columns[i]}
				y={hedgeRows[who]}
				textAnchor="middle"
				// Operands stay ink; only the net, the row's result, shows its sign's colour.
				className={i === 2 ? signedClass(value) : "wt-film-num"}
				style={{ fontSize: i === 2 ? T.num * 1.35 : T.num, fontWeight: 600 }}
			>
				{shares(value)}
			</text>
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
						<g data-f="d-step">
							<line
								data-f="d-step-line"
								className="wt-film-step"
								style={{ stroke: toneColor("up") }}
								x1={mx}
								y1={my}
								x2={sx}
								y2={my}
							/>
							<text
								x={(mx + sx) / 2}
								y={my + 16}
								textAnchor="middle"
								className={`wt-small wt-halo ${toneClass.up}`}
								style={{ fontWeight: 600 }}
							>
								{`+$${MOVE}`}
							</text>
						</g>
						<g data-f="d-riser">
							<line
								data-f="d-riser-line"
								className="wt-film-riser"
								style={{ stroke: toneColor("up") }}
								x1={sx}
								y1={my}
								x2={sx}
								y2={my}
							/>
							<text
								x={sx + 8}
								y={(my + L.yD(NEW_DELTA)) / 2 + 4}
								className={`wt-halo wt-marker-label ${toneClass.up}`}
							>
								{`+${fixed2(NEW_DELTA - DELTA)}`}
							</text>
						</g>
						<g data-f="d-marker">
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
									style={{ stroke: "var(--tone-ink)" }}
								/>
								<path
									className="wt-line-position"
									strokeDasharray="6 5"
									d={L.path(sepCurve, L.yG)}
									style={{ stroke: toneColor("focus"), strokeWidth: 2.5 }}
								/>
							</g>
						))}
						{(
							[
								["g-oct-label", false, narrow ? copy.octShort : copy.octLabel],
								["g-sep-label", true, narrow ? copy.sepShort : copy.sepLabel],
							] as const
						).map(([name, focus, text], i) => (
							<g key={name} data-f={name}>
								<path
									d={`M${L.legend.x} ${L.legend.y + i * L.legend.row - 4}h18`}
									className="wt-line-position"
									style={{
										stroke: focus ? toneColor("focus") : "var(--tone-ink)",
										strokeWidth: focus ? 2.5 : 3,
									}}
									strokeDasharray="6 5"
								/>
								<text
									x={L.legend.x + 24}
									y={L.legend.y + i * L.legend.row}
									className="wt-small"
									style={{
										fontSize: L.legend.size,
										fill: focus ? toneColor("focus") : "var(--tone-ink)",
									}}
								>
									{t(text)}
								</text>
							</g>
						))}
						<Word
							name="g-times"
							x={L.x(SPOT + 1.6)}
							y={L.yG(sepAtStrike) + T.num * 0.3}
							size={T.num}
							anchor="start"
							className={`wt-film-num ${toneClass.focus}`}
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
					name="q-label"
					x={W / 2 - 8 - textWidth(`${fixed2(DELTA)} `, T.num)}
					y={H * 0.4}
					size={T.num}
					anchor="end"
					className="wt-film-num"
				>
					{t(copy.qLabel)}
				</Word>
				<Word
					name="q-value"
					x={W / 2 - 8}
					y={H * 0.4}
					size={T.num}
					anchor="end"
					className="wt-film-num wt-film-accent"
				>
					{fixed2(DELTA)}
				</Word>
				<Word
					name="q-to"
					x={W / 2 + 8}
					y={H * 0.4}
					size={T.num}
					anchor="start"
					className={`wt-film-num ${toneClass.caution}`}
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
						style={{ fill: toneColor("up") }}
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
			{/* The learner's worked exposure; its result becomes the table's first cell. */}
			{(
				[
					[
						"you",
						you,
						hedgeBefore.options,
						copy.youExposure,
						L.exposureRows.you,
					],
				] as const
			).map(([who, quantity, result, label, y]) => {
				const expression = `${exposureExpression(quantity, DELTA)} =`;
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
							// A share count to hold is a position, not a result: ink, like the cell it flies to.
							className="wt-film-num"
						>
							{shares(result)}
						</Word>
					</g>
				);
			})}
			<Brackets name="lock-hedge" tone="gain" glow />
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
					{/* Lift the chip 4 px to leave the full-size delta cue its own line. */}
					<rect
						x={tableChipX - tableChipW / 2}
						y={hedgeRows.chip - T.body - 9}
						width={tableChipW}
						height={T.body + 13}
						rx={7}
						className="wt-chip"
						style={{ fill: toneColor("up") }}
					/>
					<text
						x={tableChipX}
						y={hedgeRows.chip - 4}
						textAnchor="middle"
						className="wt-chip-text"
						style={{ fontSize: T.body }}
					>
						{t(copy.chip)}
					</text>
				</g>
				<g data-f="h-delta">
					<Word
						name="h-delta-change"
						x={tableChipX}
						y={hedgeRows.chip + T.body + 8}
						size={T.small}
						className="wt-film-num wt-film-accent"
					>
						{deltaChange}
					</Word>
				</g>
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
						className={`wt-film-type ${name === "h-trade-you" ? toneClass.focus : ""}`}
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
	const land = (target: Element, time: number, duration = 0.55) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.12, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration, ease: "power3.out" },
			time,
		);
	// These rows compare exact, settled exposures, not intermediate share counts.
	// Cut each whole row at its original settlement: no hold or quiet second is spent.
	// The explicit start state also restores values on backward seeks.
	const settleHedge = (
		who: "you" | "ben",
		from: { options: number; shares: number },
		to: { options: number; shares: number },
		settledAt: number,
	) => {
		const state = { settled: 0 };
		const marks = [0, 1, 2].map((i) => one<SVGTextElement>(`h-${who}-${i}`));
		tl.fromTo(
			state,
			{ settled: 0 },
			{
				settled: 1,
				duration: 0.01,
				ease: "none",
				immediateRender: false,
				onUpdate: () => {
					const row = state.settled === 1 ? to : from;
					const values = [row.options, row.shares, row.options + row.shares];
					marks.forEach((mark, i) => {
						mark.textContent = shares(values[i]);
						mark.setAttribute(
							"class",
							i === 2 ? signedClass(values[i]) : "wt-film-num",
						);
					});
				},
			},
			settledAt - 0.01,
		);
	};
	const lockHedge = one<SVGGraphicsElement>("lock-hedge");
	const mx = L.x(SPOT);
	const my = L.yD(DELTA);
	const marker = one("d-marker");
	const value = one<SVGTextElement>("d-value");
	const chartDelta = one("chart-delta");
	const chartGamma = one("chart-gamma");
	const pushIn = cam(
		narrow ? 1.6 : 2,
		{ x: L.x(SPOT + 1), y: L.yD(DELTA + 0.04) },
		{ x: W * 0.46, y: H * 0.54 },
	);

	// Everything at rest: hidden until its shot needs it.
	gsap.set(marker, { x: mx, y: my, opacity: 0 });
	gsap.set(one("d-step-line"), { attr: { x2: mx } });
	gsap.set(chartGamma, { opacity: 0 });
	d.hidden([
		value,
		one("d-step"),
		one("d-riser"),
		one("g-oct-label"),
		one("g-sep-label"),
		one("g-times"),
		...kids("q"),
		...kids("g"),
		one<SVGGraphicsElement>("lock-hedge"),
		...kids("hedge"),
		...kids("h-derive-you"),
		...kids("h-holder-you"),
		...kids("h-holder-ben"),
		one("k-head"),
		one("e-head"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: delta 0.52 → ? ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show([one("q-label"), one("q-value")], 4.6);
	show(one("q-to"), 5.0, "right");
	land(one("q-chip"), 5.4);
	show(one("q-line"), 5.8);

	// ——— curve: delta has a slope of its own ———
	tl.addLabel("curve", 9.4);
	hide([one("q-label"), one("q-to"), one("q-chip"), one("q-line")], 9.4);
	// The question's numeral becomes the chart readout as the marker lands.
	d.carry(one<SVGGraphicsElement>("q-value"), value, 9.4, {
		duration: 1.55,
		arc: "y",
	});
	rise(9.6);
	// The axes settle, then stand alone for a second before the marker appears.
	tl.to(marker, { opacity: 1, duration: 0.3 }, 11.4);
	// The curve grows from the settled marker, low and flat left, then up toward 1.
	tl.to(
		one("clip-dl"),
		{
			attr: { x: L.left - 4, width: mx - L.left + 4 },
			duration: 1.3,
			ease: "power2.inOut",
		},
		11.7,
	);
	tl.to(
		one("clip-dr"),
		{ attr: { width: L.right - mx + 4 }, duration: 1.3, ease: "power2.inOut" },
		11.7,
	);
	show(one("k-head"), 11.4, "above");
	// The camera has its own interval after the curve settles.
	tl.to(world, { ...pushIn, duration: 1.3, ease: "power2.inOut" }, 13.0);
	// Pushed in on the slope, the axis labels would crowd the frame's edges: they step out.
	const axisText = [
		...(chartDelta.firstElementChild as Element).querySelectorAll("text"),
	];
	tl.to(axisText, { opacity: 0, duration: 0.3 }, 13.0);
	// Both legs form one measured move, after the camera settles.
	tl.to(one("d-step"), { opacity: 1, duration: 0.3 }, 14.3);
	tl.to(
		one("d-step-line"),
		{ attr: { x2: L.x(SPOT + MOVE) }, duration: 0.5, ease: "power2.out" },
		14.3,
	);
	tl.to(one("d-riser"), { opacity: 1, duration: 0.3 }, 14.3);
	tl.to(
		one("d-riser-line"),
		{ attr: { y2: L.yD(NEW_DELTA) }, duration: 0.5, ease: "power3.out" },
		14.3,
	);
	// Then the marker climbs the curve, with its readout driven from the same model value.
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
		14.8,
	);
	// The curve ends with the +$2 and +0.08 already visible; keep one worked equation.
	hide(one("k-head"), 17.4);
	sink(17.4);
	land(one("g-num"), 20.2, 0.4);
	show(one("g-word"), 20.3, "below", 0.3);
	// The caption names what the worked equation measures, so it comes with the equation and
	// holds through the definition (a sentence is held 3.5 s); it fades in place, clear of the
	// worked label on both frames.
	tl.fromTo(one("g-sub"), { opacity: 0 }, { opacity: 1, duration: 0.3 }, 18.1);
	for (const [who, at] of [["you", 17.8]] as const) {
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
			{ opacity: 1, duration: 0.3 },
			at + 0.1,
		);
	}
	// The definition stays readable; its big number steps back for the worked positions.
	tl.to([one("g-num"), one("g-word")], { opacity: 0.45, duration: 0.3 }, 21.5);

	// ——— hedge: the same delta, carried onto a position ———
	tl.addLabel("hedge", 22.15);
	// The worked equation holds from source 17.8 until its result carries to the table.
	hide(kids("g"), 22.15, 0.3, 0);
	// Clear the learner's calculation before its result flies into the table.
	hide([one("h-derive-you-label"), one("h-derive-you-calc")], 22.15, 0.3, 0);
	d.carry(
		one<SVGGraphicsElement>("h-derive-you-result"),
		one<SVGGraphicsElement>("h-you-0"),
		22.45,
		{ duration: 0.75, arc: "x" },
	);
	show(one("h-head"), 22.35, "above");
	show([one("h-col-0"), one("h-col-1"), one("h-col-2")], 22.75);
	show(one("h-who-you"), 23.1, "above");
	land(one("h-you-1"), 23.2);
	land(one("h-you-2"), 23.35);
	show(one("h-who-ben"), 23.5, "above");
	land(one("h-ben-1"), 23.8);
	land(one("h-ben-2"), 23.95);
	land(one("h-ben-0"), 23.8);
	// Ben's final baseline cell settles at 24.5; nothing new arrives until 25.5.
	// ALFA rises $2, once, for both; the table stays the proof of the revised exposure.
	show(one("h-chip"), 25.5);
	tl.fromTo(
		one("h-delta"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		25.8,
	);
	settleHedge("you", hedgeBefore, hedgeAfter, 26.6);
	settleHedge("ben", benColumns[0], benColumns[1], 26.7);
	// Both table rows settle by 26.7; the table and delta cue stand quietly before the lock.
	// The hero: your hedge's drift, locked once its row has settled; the rest steps back.
	// The brackets are fitted now, so measure the figure with its settled text.
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
	show(one("h-trade-you"), 29.95);
	// Brackets settle at 28.45; the first fold/exit waits until 29.95 (1.5 s).
	hide(lockHedge, 29.95, 0.3);
	tl.to(rest, { opacity: 1, duration: 0.4 }, 29.95);
	// Fade in place: its phone lines never travel through the departing cue/chip lane.
	tl.fromTo(
		one("h-claim"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		30.2,
	);
	// Clear both worked rows and the delta-change cue; their holds stay unchanged.
	hide(one("h-delta"), 29.95, 0.3, 0);
	// On a phone the rule's second line needs the move chip's lane too.
	if (narrow) hide(one("h-chip"), 29.95, 0.3, 0);
	settleHedge("you", hedgeAfter, hedgeFixed, 32.4);
	show(one("h-trade-ben"), 31.85);
	settleHedge("ben", benColumns[1], benColumns[2], 33.2);
	// Bind signs before trading: both tags, signed quantities and rule settle by 30.7,
	// then stand quietly; the trades cut to flat at their unchanged settlement times.
	for (const [who, at] of [
		["you", 29.95],
		["ben", 30.05],
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
	show([one("g-oct-label"), one("g-sep-label")], 35.4, "below", 0.3);
	show(one("e-head"), 35.8, "above");
	rise(35.8);
	tl.to(
		one("clip-gl"),
		{
			attr: { x: L.left - 4, width: mx - L.left + 4 },
			duration: 0.9,
			ease: "power2.inOut",
		},
		37.6,
	);
	tl.to(
		one("clip-gr"),
		{ attr: { width: L.right - mx + 4 }, duration: 0.9, ease: "power2.inOut" },
		37.6,
	);
	// Both expiries reveal as one comparison; the curves carry their own height.
	// The ratio arrives when they settle, then keeps its original 2.25 s quiet hold.
	tl.fromTo(
		one("g-times"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		38.5,
	);
	// Cut: the claim, held to be read.
	hide(one("e-head"), 41.05);
	sink(41.05);
	tl.fromTo(
		one("c-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
		41.45,
	);
	show(one("c-sub"), 41.85);

	// ——— next ———
	tl.addLabel("next", 45.45);
	hide(kids("claim"), 45.45);
	d.close(45.45);
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
