import { gsap } from "gsap";
import { useId } from "react";
import {
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
 *   curve     9.4–22.8   the delta curve; push in; +$2 along, +0.08 up; cut to 0.04, "gamma"
 *   hedge     22.8–36.8  hero: your hedge drifts +128 and you sell; Ben's, in its place,
 *                        drifts −80 and he buys
 *   expiry    36.8–45.4  gamma's hill; the 4-day call's spike, 3×; cut: "Gamma lives near
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
	const { height, narrow, room } = frame;
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
	const legend = { x: x(105.4), y: yG(0.122) };
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
	gammaWord: ["gamma", "gamma"],
	gammaSub: ["delta's change per $1 of ALFA", "ALFA 每变动 $1，Delta 的变化"],
	hedgeHead: ["Gamma moves the hedge.", "Gamma 会推动对冲。"],
	hedgeClaim: [
		"Long gamma sells into a rise. Short gamma buys.",
		"正 Gamma 涨时卖出，负 Gamma 买入。",
	],
	you: [`You · long ${you} calls`, `你 · 多头 ${you} 张看涨`],
	ben: [
		`Ben · short ${Math.abs(ben)} calls`,
		`Ben · 空头 ${Math.abs(ben)} 张看涨`,
	],
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
	octShort: ["Oct 18", "10月18日"],
	sepLabel: [`Sep 20 · ${SEP_DAYS} days`, `9月20日 · ${SEP_DAYS} 天`],
	sepShort: ["Sep 20", "9月20日"],
	claimBig: ["Gamma lives near the strike.", "Gamma 集中在行权价。"],
	claimSub: [
		"It sharpens as expiry nears, and fades a few dollars away.",
		"越临近到期越集中；离行权价几美元，它就消退了。",
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
	const hedgeRows = {
		who: H * 0.3,
		labels: H * 0.42,
		numbers: H * 0.53,
		chip: H * 0.66,
		trade: H * 0.79,
	};
	const column = (values: readonly number[], who: "you" | "ben") =>
		values.map((value, i) => (
			<Word
				key={L.columns[i]}
				name={`h-${who}-${i}`}
				x={L.columns[i]}
				y={hedgeRows.numbers}
				size={T.num}
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
									d={`M${L.legend.x} ${L.legend.y + i * 16 - 4}h18`}
									className={line}
									strokeDasharray="6 5"
								/>
								<text
									x={L.legend.x + 24}
									y={L.legend.y + i * 16}
									className={`wt-small ${label}`}
								>
									{t(text)}
								</text>
							</g>
						))}
						<Word
							name="g-times"
							x={L.x(101.6)}
							y={L.yG(sepAtStrike) + T.num * 0.3}
							size={T.num}
							anchor="start"
							className="wt-film-num wt-film-accent"
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
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			<g data-f="g">
				<Word
					name="g-num"
					x={W / 2}
					y={H * 0.5 + T.big * 0.36}
					size={T.big}
					className="wt-film-num"
				>
					{fixed2(GAMMA)}
				</Word>
				<Word
					name="g-word"
					x={W / 2}
					y={H * 0.5 + T.big * 0.36 + T.head * 1.9}
					size={T.head}
					className="wt-film-type wt-film-accent"
				>
					{t(copy.gammaWord)}
				</Word>
				<Lines
					name="g-sub"
					text={t(copy.gammaSub)}
					x={W / 2}
					y={H * 0.5 + T.big * 0.36 + T.head * 1.9 + T.body * 1.9}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			<Brackets name="lock-hedge" glow />
			<g data-f="hedge">
				<Lines
					name="h-head"
					text={t(copy.hedgeHead)}
					x={W / 2}
					y={H * 0.17}
					size={T.head}
					maxWidth={room}
				/>
				<Lines
					name="h-claim"
					text={t(copy.hedgeClaim)}
					x={W / 2}
					y={H * 0.17}
					size={T.head}
					maxWidth={room}
				/>
				<Word
					name="h-who-you"
					x={W / 2}
					y={hedgeRows.who}
					size={T.body}
					className="wt-film-type wt-film-dim"
				>
					{t(copy.you)}
				</Word>
				<Word
					name="h-who-ben"
					x={W / 2}
					y={hedgeRows.who}
					size={T.body}
					className="wt-film-type wt-film-dim"
				>
					{t(copy.ben)}
				</Word>
				{[copy.colCalls, copy.colShares, copy.colNet].map((label, i) => (
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
						x={W / 2 - tableChipW / 2}
						y={hedgeRows.chip - T.body - 5}
						width={tableChipW}
						height={T.body + 13}
						rx={7}
						className="wt-chip"
					/>
					<text
						x={W / 2}
						y={hedgeRows.chip}
						textAnchor="middle"
						className="wt-chip-text"
						style={{ fontSize: T.body }}
					>
						{t(copy.chip)}
					</text>
				</g>
				<Word
					name="h-trade-you"
					x={W / 2}
					y={hedgeRows.trade}
					size={T.body}
					className="wt-film-type wt-film-accent"
				>
					{t(copy.youTrade)}
				</Word>
				<Word
					name="h-trade-ben"
					x={W / 2}
					y={hedgeRows.trade}
					size={T.body}
					className="wt-film-type wt-film-accent"
				>
					{t(copy.benTrade)}
				</Word>
			</g>
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
		...kids("q"),
		...kids("g"),
		one<SVGGraphicsElement>("lock-hedge"),
		...kids("hedge"),
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
	tl.to(
		one("d-dot"),
		{ scaleY: 0.72, scaleX: 1.2, duration: 0.1, ease: "power1.out" },
		10.95,
	);
	tl.to(
		one("d-dot"),
		{ scaleY: 1, scaleX: 1, duration: 0.7, ease: "elastic.out(1, 0.45)" },
		11.05,
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
	tl.to(world, { ...pushIn, duration: 1.3, ease: "power2.inOut" }, 13);
	// Pushed in on the slope, the axis labels would crowd the frame's edges: they step out.
	const axisText = [
		...(chartDelta.firstElementChild as Element).querySelectorAll("text"),
	];
	tl.to(axisText, { opacity: 0, duration: 0.3 }, 13);
	tl.to(tangent, { opacity: 1, duration: 0.2 }, 13.9);
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
		13.9,
	);
	tl.to(one("d-step"), { opacity: 1, duration: 0.2 }, 15);
	tl.to(
		one("d-step-line"),
		{ attr: { x2: L.x(SPOT + MOVE) }, duration: 0.5, ease: "power2.out" },
		15,
	);
	tl.to(one("d-riser"), { opacity: 1, duration: 0.2 }, 15.6);
	tl.to(
		one("d-riser-line"),
		{ attr: { y2: L.yD(NEW_DELTA) }, duration: 0.6, ease: "power3.out" },
		15.6,
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
		16.6,
	);
	// Cut: the slope gets its name.
	sink(18.2);
	land(one("g-num"), 18.6);
	show(one("g-word"), 19);
	show(one("g-sub"), 19.2);

	// ——— hedge: the same delta, carried onto a position ———
	tl.addLabel("hedge", 22.8);
	hide(kids("g"), 22.8);
	show(one("h-head"), 23.0, "above");
	show(one("h-who-you"), 23.5);
	show([one("h-col-0"), one("h-col-1"), one("h-col-2")], 23.8);
	land(one("h-you-0"), 24.1);
	land(one("h-you-1"), 24.3);
	land(one("h-you-2"), 24.5);
	land(one("h-chip"), 25.3);
	d.count(
		one<SVGTextElement>("h-you-0"),
		hedgeAfter.options,
		25.9,
		shares,
		hedgeBefore.options,
	);
	d.count(one<SVGTextElement>("h-you-2"), youDrift, 26.6, shares);
	tl.to(
		one("h-you-2"),
		{ attr: { class: "wt-film-num wt-film-warn" }, duration: 0.2 },
		26.6,
	);
	show(one("h-trade-you"), 27.9);
	// The hero: your hedge's drift, locked once its count has landed. The brackets are
	// fitted now, so measure the figure with the text its count ends on.
	const youNet = one<SVGTextElement>("h-you-2");
	const youNetText = youNet.textContent;
	youNet.textContent = shares(youDrift);
	d.lock(lockHedge, 28.0, { around: [one("h-col-2"), youNet], pad: 6 });
	youNet.textContent = youNetText;
	tl.addLabel("hero-lock", 28.0);
	// Ben takes your place under the same columns: short the same calls, so the move
	// pushes him the other way.
	d.swap(
		[
			one("h-who-you"),
			one("h-you-0"),
			one("h-you-1"),
			one("h-you-2"),
			one("h-trade-you"),
			one("h-chip"),
			lockHedge,
		],
		[one("h-who-ben"), one("h-ben-0"), one("h-ben-1"), one("h-ben-2")],
		31.4,
	);
	land(one("h-chip"), 31.9);
	d.count(
		one<SVGTextElement>("h-ben-0"),
		benColumns[1].options,
		32.15,
		shares,
		benColumns[0].options,
	);
	d.count(one<SVGTextElement>("h-ben-2"), benDrift, 32.45, shares);
	tl.to(
		one("h-ben-2"),
		{ attr: { class: "wt-film-num wt-film-warn" }, duration: 0.2 },
		32.45,
	);
	// The rule both rows made, up with Ben's trade.
	d.swap(one("h-head"), one("h-claim"), 32.95);
	show(one("h-trade-ben"), 33.3);

	// ——— expiry: where gamma lives ———
	tl.addLabel("expiry", 36.8);
	hide(kids("hedge"), 36.8);
	tl.set(world, home, 37.0);
	tl.set(chartDelta, { opacity: 0 }, 37.0);
	tl.set(chartGamma, { opacity: 1 }, 37.0);
	show(one("e-head"), 37.2, "above");
	rise(37.2);
	tl.to(
		one("clip-gl"),
		{
			attr: { x: L.left - 4, width: mx - L.left + 4 },
			duration: 0.9,
			ease: "power2.inOut",
		},
		37.5,
	);
	tl.to(
		one("clip-gr"),
		{ attr: { width: L.right - mx + 4 }, duration: 0.9, ease: "power2.inOut" },
		37.5,
	);
	tl.to(one("g-oct-label"), { opacity: 1, duration: 0.4 }, 38.3);
	// The 4-day call starts as the same hill, then rises into a spike at the strike.
	tl.to(one("g-sep"), { opacity: 1, duration: 0.2 }, 38.5);
	tl.to(
		one("g-sep"),
		{
			attr: { d: L.path(sepCurve, L.yG) },
			duration: 1.0,
			ease: "power3.inOut",
		},
		38.5,
	);
	tl.to(one("g-sep-label"), { opacity: 1, duration: 0.4 }, 39.3);
	land(one("g-times"), 39.5);
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
