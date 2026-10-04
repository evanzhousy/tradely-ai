import { gsap } from "gsap";
import { useId } from "react";
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
	createDirector,
	EndCard,
	filmFrame,
	Lines,
	lineCount,
	TitleCard,
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
	rv,
	type Source,
	shortDate,
	TIMELINE_END,
	windowReturns,
} from "./implied-realized-volatility-model";

/*
 * Implied and realized volatility, as a film. It opens on two numbers for one stock, 35%
 * and 24%, and shows where each comes from: IV is the input that makes the model reproduce
 * a price, so the bid, mid and ask give three of them; RV is measured from past closes, so
 * the window and the convention change it. Then the two windows on one timeline, one
 * behind today and one ahead, with earnings in it.
 *
 *   open      0–4     "IV and RV"
 *   question  4–9.5   IV 35%, RV 24%: which is ALFA's volatility?
 *   fit       9.5–19.5  the model's price against its volatility input; slide to the mid;
 *                     push in on the bid, mid and ask
 *   three     19.5–23.5  34.3%, 34.9%, 35.6%: same option, three IVs
 *   rv        23.5–35.5  twenty daily returns, their spread, × √252 = 24%; the last ten
 *                     only, 15%; × √365, 29%
 *   horizons  35.5–48  RV behind today, IV ahead with earnings; cut: +11 vol points;
 *                     "IV looks ahead. RV looks back."
 *   next      48–51   Next: the expected move
 */

const END = 51;
const F_X = [0.2, 0.5] as const;
const F_Y = [2, 6] as const;
const R_RANGE = 0.03;
/** The same curve, zoomed to where the bid, mid and ask sit cents apart. */
const Z_X = [0.338, 0.36] as const;
const Z_Y = [4.0, 4.25] as const;
const SD10 = standardDeviation(windowReturns(10));
const RV20_365 = rv(20, 365);
const fitCurve = Array.from({ length: 61 }, (_, i) => {
	const iv = F_X[0] + (i * (F_X[1] - F_X[0])) / 60;
	return [iv, callAt(iv)] as const;
});
const SOURCES: readonly Source[] = ["bid", "mid", "ask"];
const points = (fraction: number) => `${Math.round(fraction * 100)}%`;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height, narrow } = frame;
	const left = frame.margin;
	const right = width * 0.965;
	const top = height * (narrow ? 0.3 : 0.22);
	const bottom = height * 0.8;
	const xF = (iv: number) =>
		left + ((iv - F_X[0]) / (F_X[1] - F_X[0])) * (right - left);
	const yF = (dollars: number) =>
		bottom - ((dollars - F_Y[0]) / (F_Y[1] - F_Y[0])) * (bottom - top);
	const slot = (right - left) / returns.length;
	const barX = (i: number) => left + slot * (i + 0.5);
	const middle = (top + bottom) / 2;
	const yR = (value: number) =>
		middle - (value / R_RANGE) * ((bottom - top) / 2);
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
	qLine: [
		"Two volatilities for one stock, on one day. Which is right?",
		"同一只股票、同一天，两个波动率。哪个对？",
	],
	fitHead: [
		"IV: the input that reproduces a price.",
		"IV：让模型重现价格的输入。",
	],
	fitHeadShort: ["IV reproduces a price.", "IV：重现价格的输入。"],
	fitAxis: ["Oct 18 100 call, model value", "10月18日 100 看涨，模型价值"],
	volAxis: ["volatility put into the model", "代入模型的波动率"],
	mid: [`market mid ${price(prices.mid)}`, `市场中间价 ${price(prices.mid)}`],
	threeHead: ["Same option, three IVs.", "同一张期权，三个 IV。"],
	threeLine: [
		"Say which price you fitted, and with which model.",
		"要说明拟合的是哪个价格、用的是哪个模型。",
	],
	rvHead: ["RV: measured from past closes.", "RV：由过去的收盘价测得。"],
	rvYear: [
		`${percent(DAILY_SD, 2)} a day × √252 = ${points(RV20)} a year.`,
		`每天 ${percent(DAILY_SD, 2)} × √252 = 年化 ${points(RV20)}。`,
	],
	rvTen: [
		`The last 10 sessions only: ${points(RV10)}.`,
		`只用最近 10 个交易日：${points(RV10)}。`,
	],
	rv365: [
		`× √365 instead of √252: ${points(RV20_365)}.`,
		`用 √365 代替 √252：${points(RV20_365)}。`,
	],
	rvClaim: [
		`Same closes: ${points(RV10)} to ${points(RV20_365)}.`,
		`同样的收盘价：${points(RV10)} 到 ${points(RV20_365)}。`,
	],
	returnsAxis: ["ALFA daily returns", "ALFA 每日收益"],
	perDay20: [`±${percent(DAILY_SD, 2)} a day`, `每天 ±${percent(DAILY_SD, 2)}`],
	perDay10: [`±${percent(SD10, 2)} a day`, `每天 ±${percent(SD10, 2)}`],
	horizonHead: ["They look in opposite directions.", "它们朝相反的方向看。"],
	horizonHeadShort: ["Opposite directions.", "方向相反。"],
	rvBlock: [`RV20 ${RV_POINTS}%`, `RV20 ${RV_POINTS}%`],
	ivBlock: [`IV ${IV_POINTS}%`, `IV ${IV_POINTS}%`],
	back: ["looking back", "向后看"],
	ahead: ["priced ahead", "向前定价"],
	today: ["today", "今天"],
	earnings: ["earnings", "财报"],
	gapWord: ["vol points", "个波动率点"],
	gapSub: [
		"More movement priced for the month ahead, earnings and all, than the last month showed. Not a forecast, not a verdict on price.",
		"为包含财报的未来一个月定价的波动，比上个月实际的更大。它不是预测，也不是对价格的裁决。",
	],
	claimBig: ["IV looks ahead. RV looks back.", "IV 向前看，RV 向后看。"],
	claimSub: [
		"Name the price, the window and the convention.",
		"说明价格、窗口和约定。",
	],
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
	const id = useId().replace(/:/g, "");
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
			<defs>
				<clipPath id={`fit-${id}`}>
					<rect data-f="fit-clip" x={L.left - 4} y={0} width={0} height={H} />
				</clipPath>
			</defs>

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
							className="wt-line-reference"
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
						<g clipPath={`url(#fit-${id})`}>
							<path
								className="wt-line-position"
								strokeDasharray="6 5"
								d={L.fitPath}
							/>
						</g>
						<circle
							data-f="f-dot-mid"
							cx={L.xF(fitted.mid)}
							cy={L.yF(prices.mid)}
							r={3}
							className="wt-chip"
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
						<text
							data-f="f-marker-label"
							x={L.xF(GUESS) + 10}
							y={L.yF(callAt(GUESS)) + 20}
							className="wt-halo wt-accent wt-marker-label"
						>
							{`${percent(GUESS)} → ${price(callAt(GUESS))}`}
						</text>
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
						<text x={L.left} y={L.top - 12} className="wt-small">
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
						<text
							data-f="r-sd-20"
							x={L.right - 4}
							y={L.yR(DAILY_SD) - 6}
							textAnchor="end"
							className="wt-small wt-halo wt-accent"
						>
							{t(copy.perDay20)}
						</text>
						<text
							data-f="r-sd-10"
							x={L.right - 4}
							y={L.yR(SD10) - 6}
							textAnchor="end"
							className="wt-small wt-halo wt-accent"
						>
							{t(copy.perDay10)}
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
							className="wt-long-soft"
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
						<text
							data-f="z-rv-caption"
							x={(L.xZ(0) + L.xZ(rvEnd)) / 2}
							y={L.axisZ - block - 20}
							textAnchor="middle"
							className="wt-small"
						>
							{t(copy.back)}
						</text>
						<path
							data-f="z-today"
							d={`M${L.xZ(today)} ${L.axisZ - block - 34}V${L.axisZ + 6}`}
							className="wt-bracket"
						/>
						<text
							data-f="z-today-label"
							x={L.xZ(today)}
							y={L.axisZ + 34}
							textAnchor="middle"
							className="wt-small wt-accent"
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
						<text
							data-f="z-iv-caption"
							x={(L.xZ(today) + L.right) / 2}
							y={L.axisZ - block - 20}
							textAnchor="middle"
							className="wt-small"
						>
							{t(copy.ahead)}
						</text>
						<g data-f="z-earnings">
							<path
								d={`M${L.xZ(earnings)} ${L.axisZ - 8}V${L.axisZ + 8}`}
								className="wt-bracket"
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
								className="wt-line-reference"
								x1={L.left}
								x2={L.left}
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
			<g data-f="three">
				<Lines
					name="t-head"
					text={t(copy.threeHead)}
					x={W / 2}
					y={H * 0.17}
					size={T.head}
					maxWidth={room}
				/>
				{SOURCES.map((source, i) => (
					<g key={source}>
						<Word
							name={`t-tag-${i}`}
							x={W * L.trio[i]}
							y={H * 0.36}
							size={T.small}
							className="wt-film-tag"
						>
							{`${t([source, { bid: "买价", mid: "中间价", ask: "卖价" }[source]])} ${price(prices[source])}`.toUpperCase()}
						</Word>
						<Word
							name={`t-num-${i}`}
							x={W * L.trio[i]}
							y={H * 0.36 + T.big * 0.75}
							size={T.big * 0.6}
							className={`wt-film-num ${source === "mid" ? "wt-film-accent" : ""}`}
						>
							{percent(fitted[source])}
						</Word>
					</g>
				))}
				<Lines
					name="t-line"
					text={t(copy.threeLine)}
					x={W / 2}
					y={H * 0.76}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("r-head", copy.rvHead)}
			{headline("r-year", copy.rvYear)}
			{headline("r-ten", copy.rvTen)}
			{headline("r-365", copy.rv365)}
			{headline("r-claim", copy.rvClaim)}
			{headline("z-head", copy.horizonHead, copy.horizonHeadShort)}
			<g data-f="gap">
				<Word
					name="g-num"
					x={W / 2}
					y={H * 0.4 + T.big * 0.36}
					size={T.big}
					className="wt-film-num wt-film-accent"
				>
					{`+${GAP}`}
				</Word>
				<Word
					name="g-word"
					x={W / 2}
					y={H * 0.4 + T.big * 0.36 + T.head * 1.9}
					size={T.head}
					className="wt-film-type wt-film-accent"
				>
					{t(copy.gapWord)}
				</Word>
				<Lines
					name="g-sub"
					text={t(copy.gapSub)}
					x={W / 2}
					y={H * 0.4 + T.big * 0.36 + T.head * 1.9 + T.body * 1.9}
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
	const { width: W, height: H } = context;
	const L = layout(W);
	const { narrow } = L;
	const d = createDirector(context, L, END);
	const { tl, one, kids, show, hide, pop, slam, rise, sink, cam, home, world } =
		d;
	const flat = (name: string) =>
		kids(name).flatMap((el) => (el.tagName === "g" ? [...el.children] : [el]));
	const marker = one("f-marker");
	const markerLabel = one<SVGTextElement>("f-marker-label");
	const charts = {
		fit: one("chart-fit"),
		rv: one("chart-rv"),
		horizon: one("chart-horizon"),
	};
	const zoom = one("chart-zoom");
	const pushIn = cam(
		narrow ? 1.8 : 2,
		{ x: L.xF(fitted.mid), y: L.yF(prices.mid) },
		{ x: W / 2, y: H * 0.52 },
	);
	const today = dayIndex(SESSION_DATE);

	gsap.set([charts.rv, charts.horizon, zoom], { opacity: 0 });
	gsap.set(zoom, { svgOrigin: `${W / 2} ${H * 0.52}` });
	d.hidden([
		one("f-line-mid"),
		one("f-dot-mid"),
		...SOURCES.flatMap((source) => [
			one(`z-price-${source}`),
			one(`z-drop-${source}`),
			one(`z-iv-${source}`),
			one(`z-dot-${source}`),
		]),
		one("f-mid-label"),
		marker,
		markerLabel,
		one("r-band"),
		one("r-sd-20"),
		one("r-sd-10"),
		one("z-rv-label"),
		one("z-rv-caption"),
		one("z-today"),
		one("z-today-label"),
		one("z-iv-label"),
		one("z-iv-caption"),
		one("z-earnings"),
		...flat("q"),
		one("f-head"),
		...flat("three"),
		...["r-head", "r-year", "r-ten", "r-365", "r-claim", "z-head"].map((name) =>
			one(name),
		),
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
	slam(one("q-num-0"), 4.8);
	show(one("q-tag-1"), 5.6);
	slam(one("q-num-1"), 5.8);
	show(one("q-line"), 6.8);

	// ——— fit: IV is the input that reproduces a price ———
	tl.addLabel("fit", 9.5);
	hide(flat("q"), 9.5);
	show(one("f-head"), 9.7, "above");
	rise(9.8);
	tl.to(
		one("fit-clip"),
		{
			attr: { width: L.right - L.left + 8 },
			duration: 1.2,
			ease: "power2.inOut",
		},
		10.4,
	);
	tl.to(one("f-line-mid"), { opacity: 1, duration: 0.2 }, 11.7);
	tl.to(
		one("f-line-mid"),
		{ attr: { x2: L.right }, duration: 0.7, ease: "power2.out" },
		11.7,
	);
	show(one("f-mid-label"), 12.2, "below", 0.4);
	pop(marker, 12.8);
	show(markerLabel, 13.0, "right", 0.4);
	const guess = { iv: GUESS };
	const slide = () => {
		const x = L.xF(guess.iv);
		const y = L.yF(callAt(guess.iv));
		gsap.set(marker, { attr: { cx: x, cy: y } });
		markerLabel.setAttribute("x", String(x + 10));
		markerLabel.setAttribute("y", String(y + 20));
		markerLabel.textContent = `${percent(guess.iv)} → ${price(callAt(guess.iv))}`;
	};
	tl.to(
		guess,
		{ iv: fitted.mid, duration: 1.5, ease: "power2.inOut", onUpdate: slide },
		13.8,
	);
	pop(one("f-dot-mid"), 15.3, 0.4);
	// Push in, and cut to the same curve zoomed: the bid and the ask sit cents either side.
	tl.to([markerLabel, one("f-mid-label")], { opacity: 0, duration: 0.3 }, 15.8);
	tl.to(world, { ...pushIn, duration: 0.8, ease: "power2.in" }, 15.9);
	tl.to(charts.fit, { opacity: 0, duration: 0.4 }, 16.3);
	tl.fromTo(
		zoom,
		{ opacity: 0, scale: 0.8 },
		{ opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" },
		16.5,
	);
	for (const [i, source] of SOURCES.entries()) {
		tl.to(
			one(`z-line-${source}`),
			{ attr: { x2: L.right }, duration: 0.6, ease: "power2.out" },
			16.9 + i * 0.2,
		);
		show(one(`z-price-${source}`), 17.3 + i * 0.2, "below", 0.4);
		pop(one(`z-dot-${source}`), 17.8 + i * 0.2, 0.4);
		tl.fromTo(
			one(`z-drop-${source}`),
			{ opacity: 0 },
			{ opacity: 1, duration: 0.3 },
			18.0 + i * 0.2,
		);
		show(one(`z-iv-${source}`), 18.1 + i * 0.2, "above", 0.4);
	}

	// ——— three: same option, three IVs ———
	tl.addLabel("three", 19.5);
	hide(one("f-head"), 19.6);
	sink(19.6);
	show(one("t-head"), 19.8, "above");
	for (const i of [0, 1, 2]) {
		show(one(`t-tag-${i}`), 20.3 + i * 0.3);
		slam(one(`t-num-${i}`), 20.4 + i * 0.3);
	}
	show(one("t-line"), 21.8);

	// ——— rv: measured from past closes ———
	tl.addLabel("rv", 23.5);
	hide(flat("three"), 23.5);
	tl.set(world, home, 23.7);
	tl.set(zoom, { opacity: 0 }, 23.7);
	tl.set(charts.rv, { opacity: 1 }, 23.7);
	show(one("r-head"), 23.8, "above");
	rise(23.9);
	returns.forEach((value, i) => {
		const top = Math.min(L.yR(value), L.yR(0));
		tl.fromTo(
			one(`r-bar-${i}`),
			{ attr: { y: L.yR(0), height: 0 } },
			{
				attr: { y: top, height: Math.abs(L.yR(value) - L.yR(0)) },
				duration: 0.35,
				ease: "back.out(1.6)",
			},
			24.6 + i * 0.07,
		);
	});
	tl.to(one("r-band"), { opacity: 1, duration: 0.6 }, 26.4);
	show(one("r-sd-20"), 26.7, "below", 0.4);
	d.swap(one("r-head"), one("r-year"), 27.2);
	// The last ten sessions only: the calmer half.
	tl.to(
		Array.from({ length: 10 }, (_, i) => one(`r-bar-${i}`)),
		{ opacity: 0.25, duration: 0.5 },
		29.3,
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
		29.4,
	);
	d.swap(one("r-sd-20"), one("r-sd-10"), 29.6);
	d.swap(one("r-year"), one("r-ten"), 29.8);
	// Back to twenty, annualized with calendar days.
	tl.to(
		Array.from({ length: 10 }, (_, i) => one(`r-bar-${i}`)),
		{ opacity: 1, duration: 0.5 },
		31.6,
	);
	tl.to(
		one("r-band"),
		{
			attr: {
				x: L.left,
				width: L.right - L.left,
				y: L.yR(DAILY_SD),
				height: L.yR(-DAILY_SD) - L.yR(DAILY_SD),
			},
			duration: 0.8,
			ease: "power2.inOut",
		},
		31.6,
	);
	d.swap(one("r-sd-10"), one("r-sd-20"), 31.7);
	d.swap(one("r-ten"), one("r-365"), 31.9);
	d.swap(one("r-365"), one("r-claim"), 33.6);

	// ——— horizons: two windows on one timeline ———
	tl.addLabel("horizons", 35.5);
	hide(one("r-claim"), 35.5);
	sink(35.5);
	tl.set(charts.rv, { opacity: 0 }, 35.9);
	tl.set(charts.horizon, { opacity: 1 }, 35.9);
	show(one("z-head"), 36.0, "above");
	rise(36.1);
	const rvEnd = dayIndex(alfaCloses[alfaCloses.length - 1].date);
	tl.to(
		one("z-rv"),
		{
			attr: { width: L.xZ(rvEnd) - L.xZ(0) },
			duration: 0.9,
			ease: "power2.out",
		},
		36.8,
	);
	show(one("z-rv-label"), 37.4);
	show(one("z-rv-caption"), 37.6);
	tl.fromTo(
		one("z-today"),
		{ opacity: 0, scaleY: 0, transformOrigin: "50% 100%" },
		{ opacity: 1, scaleY: 1, duration: 0.5 },
		38.2,
	);
	show(one("z-today-label"), 38.4);
	tl.to(
		one("z-iv"),
		{
			attr: { width: L.right - L.xZ(today) - 4 },
			duration: 1.0,
			ease: "power2.out",
		},
		38.9,
	);
	show(one("z-iv-label"), 39.6);
	show(one("z-iv-caption"), 39.8);
	show(one("z-earnings"), 40.4);
	// Cut: the gap, and what it isn't.
	hide(one("z-head"), 42.0);
	sink(42.0);
	slam(one("g-num"), 42.4);
	show(one("g-word"), 42.8);
	show(one("g-sub"), 43.3);
	hide(kids("gap"), 45.4);
	tl.fromTo(
		one("c-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
		45.8,
	);
	show(one("c-sub"), 46.3);

	// ——— next ———
	tl.addLabel("next", 48);
	hide(kids("claim"), 48.0);
	d.close(48.0);
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
		{ id: "three", label: ["Three IVs", "三个 IV"] },
		{ id: "rv", label: ["RV is measured", "RV 是测得的"] },
		{ id: "horizons", label: ["Two windows", "两个窗口"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
