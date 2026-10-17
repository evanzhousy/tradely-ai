import { gsap } from "gsap";
import {
	ALFA_EARNINGS_DATE,
	alfaCloses,
	type Copy,
	expiries,
	pick,
	SESSION_DATE,
	standardDeviation,
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
	toneClass,
	Word,
} from "../walkthrough/film-kit";
import {
	callAt,
	DAILY_SD,
	dayIndex,
	fitted,
	GAP,
	GUESS,
	IV_POINTS,
	percent,
	price,
	prices,
	RV_POINTS,
	RV10,
	RV20,
	returns,
	type Source,
	shortDate,
	TIMELINE_END,
	windowReturns,
} from "./implied-realized-volatility-model";

/*
 * Implied and realized volatility, as a film. It opens on two numbers for one stock, 35%
 * and 24%, and shows where each comes from: IV is the input that makes the model reproduce
 * a price, so the bid, mid and ask give three of them; RV is measured from past closes, so
 * the window changes it, and glowing brackets lock on the last ten sessions' 15%. Then the
 * two windows on one timeline, one behind today and one ahead, with earnings in it.
 *
 *   open      0–4        "IV and RV"
 *   question  4–9.6      IV 35%, RV 24%: which is ALFA's volatility?
 *   fit       9.6–22.25   the model's price against its volatility input; slide to the
 *                        mid; cut to the bid, mid and ask: same option, three IVs
 *   rv        22.25–31.55  hero: twenty daily returns, ±1.52% a day, 24% a year; the last
 *                        ten only, 15%, locked
 *   horizons  31.55–40.65  RV behind today, IV ahead with earnings; cut: +11 vol points
 *   claim     40.65–45.45  "IV looks ahead. RV looks back."
 *   next      45.45–47.45  Next: the expected move
 */

const END = 47.45;
const F_X = [0.2, 0.5] as const;
const F_Y = [2, 6] as const;
const R_RANGE = 0.03;
/** The same curve, zoomed to where the bid, mid and ask sit cents apart. */
const Z_X = [0.338, 0.36] as const;
const Z_Y = [4.0, 4.25] as const;
const SD10 = standardDeviation(windowReturns(10));
const fitCurve = Array.from({ length: 61 }, (_, i) => {
	const iv = F_X[0] + (i * (F_X[1] - F_X[0])) / 60;
	return [iv, callAt(iv)] as const;
});
const SOURCES: readonly Source[] = ["bid", "mid", "ask"];
const points = (fraction: number) => `${Math.round(fraction * 100)}%`;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height, narrow } = frame;
	// A phone's axis labels sit left of the plot: room for them inside the frame's edge.
	const left = frame.margin + (narrow ? 18 : 0);
	const right = width * 0.965;
	// Headroom for a two-line headline above the charts' captions.
	const top = height * (narrow ? 0.3 : 0.25);
	// The RV result has its own lane, above the returns and clear of their axes.
	const rvTop = height * (narrow ? 0.45 : 0.4);
	const bottom = height * 0.8;
	const xF = (iv: number) =>
		left + ((iv - F_X[0]) / (F_X[1] - F_X[0])) * (right - left);
	const yF = (dollars: number) =>
		bottom - ((dollars - F_Y[0]) / (F_Y[1] - F_Y[0])) * (bottom - top);
	const slot = (right - left) / returns.length;
	const barX = (i: number) => left + slot * (i + 0.5);
	const middle = (rvTop + bottom) / 2;
	const yR = (value: number) =>
		middle - (value / R_RANGE) * ((bottom - rvTop) / 2);
	const xZ = (day: number) => left + (day / TIMELINE_END) * (right - left);
	const xQ = (iv: number) =>
		left + ((iv - Z_X[0]) / (Z_X[1] - Z_X[0])) * (right - left);
	const yQ = (dollars: number) =>
		bottom - ((dollars - Z_Y[0]) / (Z_Y[1] - Z_Y[0])) * (bottom - top);
	return {
		...frame,
		left,
		right,
		top,
		rvTop,
		heroY: height * (narrow ? 0.35 : 0.33),
		bottom,
		xF,
		yF,
		slot,
		barX,
		barWidth: slot * 0.62,
		yR,
		xZ,
		xQ,
		yQ,
		zoomPath: Array.from({ length: 41 }, (_, i) => {
			const iv = Z_X[0] + (i * (Z_X[1] - Z_X[0])) / 40;
			return `${i ? "L" : "M"}${xQ(iv).toFixed(1)} ${yQ(callAt(iv)).toFixed(1)}`;
		}).join(""),
		axisZ: height * 0.62,
		pair: narrow ? [0.27, 0.73] : [0.32, 0.68],
		trio: narrow ? [0.2, 0.5, 0.8] : [0.24, 0.5, 0.76],
		fitPath: fitCurve
			.map(
				([iv, dollars], i) =>
					`${i ? "L" : "M"}${xF(iv).toFixed(1)} ${yF(dollars).toFixed(1)}`,
			)
			.join(""),
	};
}

const copy = {
	title: ["IV and RV", "IV 与 RV"],
	titleSub: ["implied and realized volatility", "隐含波动率与已实现波动率"],
	qTagIv: ["from a price", "来自价格"],
	qTagRv: ["from closes", "来自收盘价"],
	zoomAxis: ["the same curve, zoomed in", "放大后的同一条曲线"],
	qLine: ["Same day. Which volatility?", "同一天，哪个波动率？"],
	fitHead: [
		"IV: the input that reproduces a price.",
		"IV：让模型重现价格的输入。",
	],
	fitHeadShort: ["IV reproduces a price.", "IV：重现价格的输入。"],
	fitAxis: ["Oct 18 100 call, model value", "10月18日 100 看涨，模型价值"],
	volAxis: ["volatility put into the model", "代入模型的波动率"],
	mid: [`mid ${price(prices.mid)}`, `中间价 ${price(prices.mid)}`],
	fitDependency: ["IV needs price and model.", "价格、模型决定 IV。"],
	rvHead: ["RV: measured from past closes.", "RV：由过去的收盘价测得。"],
	rvTenHead: ["Twenty returns become ten.", "二十个日收益率变为十个。"],
	returnsAxis: ["ALFA daily returns", "ALFA 每日收益"],
	perDay20: [
		`±${percent(DAILY_SD, 2)}/day · ${points(RV20)}/yr`,
		`±${percent(DAILY_SD, 2)}/日 · ${points(RV20)}/年`,
	],
	heroPeriod: ["annualized RV10", "年化 RV10"],
	/** A phone's band readings: the yearly figure only, clear of the chart's caption. */
	perYear20: [`RV20 ${points(RV20)}/yr`, `RV20 ${points(RV20)}/年`],
	sessionsPerYear: ["252 sessions/year", "每年252个交易日"],
	horizonHead: ["They look in opposite directions.", "它们朝相反的方向看。"],
	horizonHeadShort: ["Opposite directions.", "方向相反。"],
	rvBlock: [`RV20 ${RV_POINTS}%`, `RV20 ${RV_POINTS}%`],
	ivBlock: [`IV ${IV_POINTS}%`, `IV ${IV_POINTS}%`],
	today: ["today", "今天"],
	earnings: ["earnings", "财报"],
	gapWord: ["vol points", "个波动率点"],
	gapSub: [
		"No return forecast. No mispricing proof.",
		"不预测收益，不证明错价。",
	],
	claimBig: ["IV looks ahead. RV looks back.", "IV 向前看，RV 向后看。"],
	claimSub: ["Specify price, window, convention.", "注明价格、窗口、约定。"],
	nextBig: ["Next: the expected move", "下一课：预期波动幅度"],
	nextSub: [
		"the size of move an option's price implies",
		"期权价格所隐含的波动幅度",
	],
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
	const { height: H, type: T, room, narrow } = L;
	const W = width;
	const today = dayIndex(SESSION_DATE);
	const rvEnd = dayIndex(alfaCloses[alfaCloses.length - 1].date);
	const earnings = dayIndex(ALFA_EARNINGS_DATE);
	const block = 26;
	const headline = (name: string, text: Copy, short?: Copy) => (
		<Lines
			name={name}
			text={t(narrow && short ? short : text)}
			x={L.margin}
			y={L.headY}
			size={T.head}
			maxWidth={room}
			anchor="start"
		/>
	);
	return (
		<>
			<Backdrop frame={L} />
			<g data-f="depth">
				<g data-f="world">
					{/* The model's price against its volatility input. */}
					<g data-f="chart-fit">
						{[2, 3, 4, 5, 6]
							.filter((tick) => !narrow || tick % 2 === 0)
							.map((tick) => (
								<g key={tick}>
									<path
										d={`M${L.left} ${L.yF(tick)}H${L.right}`}
										className="wt-grid"
									/>
									<text
										x={L.left - 8}
										y={L.yF(tick) + 4}
										textAnchor="end"
										className="wt-small"
									>
										{`$${tick}`}
									</text>
								</g>
							))}
						{(narrow ? [0.2, 0.35, 0.5] : [0.2, 0.3, 0.4, 0.5]).map((tick) => (
							<text
								key={tick}
								x={L.xF(tick)}
								y={L.bottom + 18}
								textAnchor={tick === 0.5 ? "end" : "middle"}
								className="wt-small"
							>
								{points(tick)}
							</text>
						))}
						<text
							x={L.right}
							y={L.bottom + 32}
							textAnchor="end"
							className="wt-small"
						>
							{t(copy.volAxis)}
						</text>
						<text x={L.left} y={L.top - 12} className="wt-small">
							{t(copy.fitAxis)}
						</text>
						<line
							data-f="f-line-mid"
							className="wt-axis"
							style={{ strokeWidth: 1.75 }}
							x1={L.left}
							x2={L.left}
							y1={L.yF(prices.mid)}
							y2={L.yF(prices.mid)}
						/>
						<text
							data-f="f-mid-label"
							x={L.right - 4}
							y={L.yF(prices.mid) - 8}
							textAnchor="end"
							className="wt-small wt-halo"
						>
							{t(copy.mid)}
						</text>
						<path
							data-f="f-curve"
							className="wt-line-position"
							strokeDasharray="6 5"
							d={L.fitPath}
						/>
						<circle
							data-f="f-marker"
							r={6}
							cx={L.xF(GUESS)}
							cy={L.yF(callAt(GUESS))}
							className="wt-chip"
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
					</g>

					{/* Twenty daily returns and their spread. */}
					<g data-f="chart-rv">
						{[0.02, 0, -0.02].map((tick) => (
							<g key={tick}>
								<path
									d={`M${L.left} ${L.yR(tick)}H${L.right}`}
									className={tick === 0 ? "wt-axis" : "wt-grid"}
								/>
								<text
									x={L.left - 8}
									y={L.yR(tick) + 4}
									textAnchor="end"
									className="wt-small"
								>
									{tick === 0 ? "0" : `${tick > 0 ? "+" : "−"}2%`}
								</text>
							</g>
						))}
						<text x={L.left} y={L.rvTop - 12} className="wt-small">
							{t(copy.returnsAxis)}
						</text>
						<rect
							data-f="r-band"
							x={L.left}
							width={L.right - L.left}
							y={L.yR(DAILY_SD)}
							height={L.yR(-DAILY_SD) - L.yR(DAILY_SD)}
							className="wt-band-neutral"
						/>
						{returns.map((value, i) => (
							<rect
								key={alfaCloses[i + 1].date}
								data-f={`r-bar-${i}`}
								className="wt-film-bar"
								data-tone={value >= 0 ? "gain" : "loss"}
								x={L.barX(i) - L.barWidth / 2}
								y={L.yR(0)}
								width={L.barWidth}
								height={0}
								rx={2}
							/>
						))}
						{/* The band's reading, at the plot's top right: clear of every bar. */}
						<text
							data-f="r-sd-20"
							x={L.right - 12}
							y={L.rvTop + 4}
							textAnchor="end"
							className="wt-small wt-halo wt-accent"
						>
							{t(narrow ? copy.perYear20 : copy.perDay20)}
						</text>
						<text x={L.left} y={L.bottom + 18} className="wt-small">
							{shortDate(alfaCloses[1].date, locale)}
						</text>
						<text
							x={L.right}
							y={L.bottom + 18}
							textAnchor="end"
							className="wt-small"
						>
							{shortDate(alfaCloses[alfaCloses.length - 1].date, locale)}
						</text>
					</g>

					{/* Two windows on one timeline. */}
					<g data-f="chart-horizon">
						<path d={`M${L.left} ${L.axisZ}H${L.right}`} className="wt-axis" />
						<text x={L.left} y={L.axisZ + 18} className="wt-small">
							{shortDate(alfaCloses[0].date, locale)}
						</text>
						<text
							x={L.right}
							y={L.axisZ + 18}
							textAnchor="end"
							className="wt-small"
						>
							{shortDate(expiries.oct18.date, locale)}
						</text>
						<rect
							data-f="z-rv"
							x={L.xZ(0)}
							y={L.axisZ - block - 12}
							width={0}
							height={block}
							rx={6}
							className="wt-film-bar"
							data-tone="neutral"
						/>
						<text
							data-f="z-rv-label"
							x={(L.xZ(0) + L.xZ(rvEnd)) / 2}
							y={L.axisZ - 12 - block / 2 + 5}
							textAnchor="middle"
							className="wt-film-num"
							style={{ fontSize: T.body }}
						>
							{t(copy.rvBlock)}
						</text>
						<path
							data-f="z-today"
							d={`M${L.xZ(today)} ${L.axisZ - block - 34}V${L.axisZ + 6}`}
							className="wt-bracket"
							style={{ stroke: "var(--tone-dim)" }}
						/>
						<text
							data-f="z-today-label"
							x={L.xZ(today)}
							y={L.axisZ + 34}
							textAnchor="middle"
							className="wt-small wt-accent"
							style={{ fill: "var(--tone-dim)" }}
						>
							{t(copy.today)}
						</text>
						<rect
							data-f="z-iv"
							x={L.xZ(today) + 4}
							y={L.axisZ - block - 12}
							width={0}
							height={block}
							rx={6}
							className="wt-focus-shape"
						/>
						<text
							data-f="z-iv-label"
							x={(L.xZ(today) + L.right) / 2}
							y={L.axisZ - 12 - block / 2 + 5}
							textAnchor="middle"
							className="wt-film-num wt-film-accent"
							style={{ fontSize: T.body }}
						>
							{t(copy.ivBlock)}
						</text>
						<g data-f="z-earnings">
							<path
								d={`M${L.xZ(earnings)} ${L.axisZ - 8}V${L.axisZ + 8}`}
								className="wt-bracket"
								style={{ stroke: "var(--tone-dim)" }}
							/>
							<text
								x={L.xZ(earnings)}
								y={L.axisZ + 50}
								textAnchor="middle"
								className="wt-small"
							>
								{`${t(copy.earnings)} ${shortDate(ALFA_EARNINGS_DATE, locale)}`}
							</text>
						</g>
					</g>
				</g>
				<g data-f="chart-zoom">
					<text x={L.left} y={L.top - 12} className="wt-small">
						{t(copy.zoomAxis)}
					</text>
					<path d={`M${L.left} ${L.bottom}H${L.right}`} className="wt-axis" />
					{SOURCES.map((source) => (
						<g key={source}>
							<line
								data-f={`z-line-${source}`}
								className="wt-axis"
								style={{ strokeWidth: 1.75 }}
								x1={L.left}
								x2={L.right}
								y1={L.yQ(prices[source])}
								y2={L.yQ(prices[source])}
							/>
							<text
								data-f={`z-price-${source}`}
								x={L.left + 4}
								y={L.yQ(prices[source]) - 7}
								className={`wt-small wt-halo ${source === "mid" ? "wt-accent" : ""}`}
							>
								{`${t([source, { bid: "买价", mid: "中间价", ask: "卖价" }[source]])} ${price(prices[source])}`}
							</text>
							<path
								data-f={`z-drop-${source}`}
								d={`M${L.xQ(fitted[source])} ${L.yQ(prices[source])}V${L.bottom}`}
								className="wt-grid"
								strokeDasharray="3 3"
							/>
							<text
								data-f={`z-iv-${source}`}
								x={L.xQ(fitted[source])}
								y={L.bottom + 18}
								textAnchor="middle"
								className={`wt-marker-label ${source === "mid" ? "wt-accent" : "wt-small"}`}
							>
								{percent(fitted[source])}
							</text>
						</g>
					))}
					<path
						data-f="z-curve"
						className="wt-line-position"
						strokeDasharray="6 5"
						d={L.zoomPath}
					/>
					{SOURCES.map((source) => (
						<circle
							key={source}
							data-f={`z-dot-${source}`}
							cx={L.xQ(fitted[source])}
							cy={L.yQ(prices[source])}
							r={5}
							className={source === "mid" ? "wt-chip" : "wt-film-ghost"}
						/>
					))}
				</g>
			</g>

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				{(
					[
						[copy.qTagIv, `${IV_POINTS}%`, "wt-film-accent"],
						[copy.qTagRv, `${RV_POINTS}%`, ""],
					] as const
				).map(([tag, num, tone], i) => (
					<g key={tag[0]}>
						<Word
							name={`q-tag-${i}`}
							x={W * L.pair[i]}
							y={H * 0.3}
							size={T.small}
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`q-num-${i}`}
							x={W * L.pair[i]}
							y={H * 0.3 + T.big * 0.95}
							size={T.big * 0.85}
							className={`wt-film-num ${tone}`}
						>
							{`${i === 0 ? "IV" : "RV"} ${num}`}
						</Word>
					</g>
				))}
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
			{headline("f-head", copy.fitHead, copy.fitHeadShort)}
			{headline("r-head", copy.rvHead)}
			<Lines
				name="f-dependency"
				text={t(copy.fitDependency)}
				x={W / 2}
				y={H * 0.92}
				size={T.body}
				maxWidth={room}
				className="wt-film-type wt-film-dim"
			/>
			<text
				data-f="r-sd-10"
				x={L.right - 18}
				y={L.heroY}
				textAnchor="end"
				className="wt-film-num wt-film-accent"
				style={{ fontSize: T.big * (narrow ? 0.95 : 0.75) }}
			>
				{points(RV10)}
			</text>
			<text
				data-f="r-period-10"
				x={L.right - 18}
				y={L.heroY + T.small * 3}
				textAnchor="end"
				className="wt-small wt-accent"
			>
				{t(copy.heroPeriod)}
			</text>
			<text
				data-f="r-annualize"
				x={W / 2}
				y={H * 0.9}
				textAnchor="middle"
				className="wt-small wt-accent"
				style={{ fontSize: T.body, fill: "var(--tone-ink)" }}
			>
				{`${percent(SD10, 2)} × √252 `}
				<tspan className={toneClass.focus}>{` ≈ ${points(RV10)}`}</tspan>
			</text>
			<text
				data-f="r-convention-label"
				x={W / 2}
				y={H * 0.95}
				textAnchor="middle"
				className="wt-small wt-film-dim"
			>
				{t(copy.sessionsPerYear)}
			</text>
			{/* Name the selection while the band closes in on the last ten returns. */}
			<Lines
				name="r2-head"
				text={t(copy.rvTenHead)}
				x={L.margin}
				y={L.headY + lineCount(t(copy.rvHead), room, T.head) * T.head * 1.35}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
			<Brackets name="lock-rv" glow />
			{headline("z-head", copy.horizonHead, copy.horizonHeadShort)}
			<g data-f="gap">
				<Word
					name="g-formula"
					x={W / 2}
					y={H * 0.3}
					size={T.body}
					className="wt-film-num"
				>
					{`IV ${IV_POINTS}% − RV20 ${RV_POINTS}%`}
				</Word>
				<Word
					name="g-num"
					x={W / 2}
					y={H * 0.4 + T.num * 0.36}
					size={T.num}
					className={`wt-film-num ${toneClass.up}`}
				>
					{`= +${GAP}`}
				</Word>
				<Word
					name="g-word"
					x={W / 2}
					y={H * 0.4 + T.num * 0.36 + T.head * 1.9}
					size={T.head}
					className="wt-film-type wt-film-dim"
				>
					{t(copy.gapWord)}
				</Word>
				<Lines
					name="g-sub"
					text={t(copy.gapSub)}
					x={W / 2}
					y={H * 0.4 + T.num * 0.36 + T.head * 1.9 + T.body * 1.9}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
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
	const lockRv = one<SVGGraphicsElement>("lock-rv");
	const flat = (name: string) =>
		kids(name).flatMap((el) => (el.tagName === "g" ? [...el.children] : [el]));
	const marker = one("f-marker");
	const charts = {
		fit: one("chart-fit"),
		rv: one("chart-rv"),
		horizon: one("chart-horizon"),
	};
	const zoom = one("chart-zoom");
	const zoomCurve = one<SVGPathElement>("z-curve");
	const quoteLevels = SOURCES.map((source) =>
		one<SVGLineElement>(`z-line-${source}`),
	);
	const quoteMarks = SOURCES.flatMap((source) => [
		one(`z-price-${source}`),
		one(`z-drop-${source}`),
		one(`z-iv-${source}`),
		one(`z-dot-${source}`),
	]);
	const today = dayIndex(SESSION_DATE);

	gsap.set([charts.rv, charts.horizon, zoom], { opacity: 0 });
	d.hidden([
		one("f-curve"),
		one("f-line-mid"),
		one("z-curve"),
		...SOURCES.flatMap((source) => [
			one(`z-line-${source}`),
			one(`z-price-${source}`),
			one(`z-drop-${source}`),
			one(`z-iv-${source}`),
			one(`z-dot-${source}`),
		]),
		one("f-mid-label"),
		one("f-dependency"),
		marker,
		one("r-band"),
		one("r-sd-20"),
		one("r-sd-10"),
		one("r-period-10"),
		one("r-annualize"),
		one("r-convention-label"),
		one("z-rv-label"),
		one("z-today"),
		one("z-today-label"),
		one("z-iv-label"),
		one("z-earnings"),
		...flat("q"),
		lockRv,
		...["f-head", "r-head", "r2-head", "z-head"].map((name) => one(name)),
		...kids("gap"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: two volatilities ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag-0"), 4.6);
	land(one("q-num-0"), 4.8);
	show(one("q-tag-1"), 5.3);
	land(one("q-num-1"), 5.5);
	show(one("q-line"), 6.0);

	// ——— fit: IV is the input that reproduces a price ———
	tl.addLabel("fit", 9.6);
	hide(flat("q"), 9.6);
	show(one("f-head"), 9.8);
	rise(9.9);
	// The axes settle at 10.7, then get one second before the model is drawn.
	d.trace(one<SVGPathElement>("f-curve"), 11.7, {
		duration: 0.7,
		ease: "power2.out",
	});
	tl.to(one("f-line-mid"), { opacity: 1, duration: 0.3 }, 11.7);
	tl.to(
		one("f-line-mid"),
		{ attr: { x2: L.right }, duration: 0.7, ease: "power2.out" },
		11.7,
	);
	show(one("f-mid-label"), 12.1, "below", 0.4);
	land(marker, 12.6);
	// GSAP rounds plain numeric properties. A 0→1 progress endpoint stays exact,
	// so the marker's price lands exactly on the observed mid level.
	const fit = { progress: 0 };
	const slide = () => {
		const iv = GUESS + fit.progress * (fitted.mid - GUESS);
		const dollars = fit.progress === 1 ? prices.mid : callAt(iv);
		const x = L.xF(iv);
		const y = L.yF(dollars);
		gsap.set(marker, { attr: { cx: x, cy: y } });
	};
	tl.to(
		fit,
		{ progress: 1, duration: 1, ease: "power2.out", onUpdate: slide },
		14.05,
	);
	// A full second on the fitted price, then the separately laid-out detail chart.
	tl.to(charts.fit, { opacity: 0, duration: 0.4 }, 16.05);
	tl.fromTo(
		zoom,
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3, ease: "power2.out" },
		16.45,
	);
	// The detail scaffold settles at 16.75, then holds for one second. Draw the model
	// curve first; the three observed levels and their paired readings finish at 18.65.
	d.trace(zoomCurve, 17.75, { duration: 0.6, ease: "power2.out" });
	tl.fromTo(
		quoteLevels,
		{ opacity: 0, attr: { x2: L.left } },
		{ opacity: 1, attr: { x2: L.right }, duration: 0.3, ease: "power2.out" },
		18.35,
	);
	tl.fromTo(
		[...quoteMarks, one("f-dependency")],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3, ease: "power2.out" },
		18.35,
	);

	// ——— rv: the hero. Measured from past closes, and the window changes it. ———
	tl.addLabel("rv", 22.25);
	d.swap([one("f-head"), one("f-dependency")], one("r-head"), 22.25);
	sink(22.25);
	tl.set(zoom, { opacity: 0 }, 22.65);
	tl.set(charts.rv, { opacity: 1 }, 22.65);
	rise(22.65);
	returns.forEach((value, i) => {
		const top = Math.min(L.yR(value), L.yR(0));
		tl.fromTo(
			one(`r-bar-${i}`),
			{ attr: { y: L.yR(0), height: 0 } },
			{
				attr: { y: top, height: Math.abs(L.yR(value) - L.yR(0)) },
				duration: 0.35,
				ease: "power3.out",
			},
			24.45,
		);
	});
	tl.to(one("r-band"), { opacity: 1, duration: 0.6 }, 24.45);
	show(one("r-sd-20"), 24.45, "below", 0.4);
	// Clear the old statistic completely before the band's geometry changes.
	hide(one("r-sd-20"), 26.5, 0.35, 0);
	// Keep the accepted 1.4 s rest, then name the selection before it changes.
	tl.fromTo(
		one("r2-head"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3, ease: "power2.out" },
		26.45,
	);
	// The last ten sessions only: the calmer half.
	tl.to(
		Array.from({ length: 10 }, (_, i) => one(`r-bar-${i}`)),
		{ opacity: 0.25, duration: 0.5 },
		26.75,
	);
	tl.to(
		one("r-band"),
		{
			attr: {
				x: L.left + L.slot * 10,
				width: L.slot * 10,
				y: L.yR(SD10),
				height: L.yR(-SD10) - L.yR(SD10),
			},
			duration: 0.8,
			ease: "power2.inOut",
		},
		26.85,
	);
	tl.fromTo(
		[one("r-sd-10"), one("r-period-10")],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		27.65,
	);
	d.lock(lockRv, 27.95, {
		around: [one("r-sd-10"), one("r-period-10")],
		pad: 12,
	});
	tl.addLabel("hero-lock", 27.95);
	// Name the daily input as the completed band and its annualized result arrive.
	tl.fromTo(
		one("r-annualize"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		27.65,
	);
	// Name the annualization basis after the full 1.5 s hero stand.
	tl.fromTo(
		one("r-convention-label"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3, ease: "power2.out" },
		29.9,
	);

	// ——— horizons: two windows on one timeline ———
	tl.addLabel("horizons", 31.55);
	d.swap([one("r-head"), one("r2-head")], one("z-head"), 31.55);
	hide(lockRv, 31.55);
	hide([one("r-sd-10"), one("r-period-10")], 31.55, 0.35, 0);
	// Clear the formula and its basis before the horizon chart enters.
	hide([one("r-annualize"), one("r-convention-label")], 31.2, 0.35, 0);
	sink(31.55);
	tl.set(charts.rv, { opacity: 0 }, 31.95);
	tl.set(charts.horizon, { opacity: 1 }, 31.95);
	rise(32.05);
	tl.fromTo(
		[one("z-today"), one("z-today-label")],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.8, ease: "power2.out" },
		32.05,
	);
	// Today and the timeline are still from 32.85 to 33.85 before either window grows.
	const rvEnd = dayIndex(alfaCloses[alfaCloses.length - 1].date);
	tl.to(
		one("z-rv"),
		{
			attr: { width: L.xZ(rvEnd) - L.xZ(0) },
			duration: 0.8,
			ease: "power2.out",
		},
		33.85,
	);
	tl.to(
		one("z-iv"),
		{
			attr: { width: L.right - L.xZ(today) - 4 },
			duration: 0.9,
			ease: "power2.out",
		},
		33.85,
	);
	tl.fromTo(
		one("z-rv-label"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		34.65,
	);
	tl.fromTo(
		one("z-iv-label"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		34.75,
	);
	show(one("z-earnings"), 34.75);
	// Cut: the gap, and what it isn't, held to be read.
	hide(one("z-head"), 36.25);
	sink(36.25);
	tl.fromTo(
		one("g-formula"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.55 },
		36.65,
	);
	land(one("g-num"), 36.65);
	show(one("g-word"), 36.95);
	show(one("g-sub"), 36.95);
	hide(kids("gap"), 40.65);
	tl.addLabel("claim", 40.65);
	tl.fromTo(
		one("c-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
		40.95,
	);
	show(one("c-sub"), 41.35);

	// ——— next ———
	tl.addLabel("next", 45.45);
	hide(kids("claim"), 45.45);
	d.close(45.45);
	return tl;
}

export const impliedRealizedVolatilityFilm: Film = {
	id: "implied-realized-volatility",
	label: [
		"Implied and realized volatility, as a short film: IV as the volatility that makes the model reproduce the Oct 18 100 call's bid, mid and ask; RV measured from ALFA's last 20 daily returns, and how the window and the annualizing convention change it; and the two on one timeline, RV behind today and IV ahead through earnings",
		"隐含与已实现波动率短片：IV 是让模型重现 10月18日 100 看涨买价、中间价和卖价的波动率；RV 由 ALFA 最近 20 个每日收益测得，窗口和年化约定都会改变它；以及两者在同一条时间线上，RV 在今天之前，IV 在今天之后并包含财报",
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["IV and RV", "IV 与 RV"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "fit", label: ["IV is fitted", "IV 是拟合的"] },
		{ id: "rv", label: ["RV is measured", "RV 是测得的"] },
		{ id: "horizons", label: ["Two windows", "两个窗口"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
