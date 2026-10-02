import * as m from "motion/react-m";
import {
	ALFA,
	ALFA_EARNINGS_DATE,
	alfaCloses,
	type Copy,
	dailyReturns,
	daysToExpiry,
	expiries,
	OCT_100_CALL,
	optionQuote,
	pick,
	priceOption,
	realizedVolatility,
	SESSION_DATE,
	standardDeviation,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import {
	PayoffChart,
	type PayoffLine,
	type PayoffMarker,
} from "../walkthrough/instruments/payoff-chart";
import { Label, Stage, useTeachMotion } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

const SPOT = ALFA.open / 100;
const STRIKE = OCT_100_CALL.strike;
const DAYS = daysToExpiry(OCT_100_CALL.expiry);
const callAt = (iv: number) =>
	priceOption({ spot: SPOT, strike: STRIKE, days: DAYS, iv, right: "call" })
		.price;

/** The volatility at which the model reproduces a price: bisection, since price rises with IV. */
function impliedVolatility(target: number) {
	let low = 0.01;
	let high = 2;
	for (let i = 0; i < 60; i++) {
		const mid = (low + high) / 2;
		if (callAt(mid) < target) low = mid;
		else high = mid;
	}
	return (low + high) / 2;
}

const quote = optionQuote(OCT_100_CALL);
type Source = "bid" | "mid" | "ask";
const prices: Record<Source, number> = {
	bid: quote.bid / 100,
	mid: (quote.bid + quote.ask) / 200,
	ask: quote.ask / 100,
};
const fitted: Record<Source, number> = {
	bid: impliedVolatility(prices.bid),
	mid: impliedVolatility(prices.mid),
	ask: impliedVolatility(prices.ask),
};
const sourceName: Record<Source, Copy> = {
	bid: ["bid", "买价"],
	mid: ["mid", "中间价"],
	ask: ["ask", "卖价"],
};

const percent = (fraction: number, places = 1) =>
	`${fraction < 0 ? "−" : ""}${Math.abs(fraction * 100).toFixed(places)}%`;
const price = (dollars: number) => usd(Math.round(dollars * 100));

const chartHeight = (width: number) => (width < 520 ? 260 : 290);

// ——— Scene 1: IV is fitted to a price ———

type FitState = { guess: number; source: Source; all: boolean };

function FitView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: FitState;
	explore: FitState | null;
	setExplore: (next: FitState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const target = prices[shown.source];
	const model = callAt(shown.guess);
	const sources: Source[] = shown.all ? ["bid", "mid", "ask"] : [shown.source];
	// Bid, mid and ask sit cents apart, so comparing all three zooms in around them.
	const zoom = shown.all;
	const xRange = zoom ? ([33, 37] as const) : ([20, 50] as const);
	const lines: PayoffLine[] = [
		{
			id: "model",
			label: t(["model value", "模型价值"]),
			points: Array.from({ length: 41 }, (_, i) => {
				const iv = (xRange[0] + ((xRange[1] - xRange[0]) * i) / 40) / 100;
				return [iv * 100, callAt(iv)] as const;
			}),
			tone: "position",
			dashed: true,
		},
		...sources.map(
			(source): PayoffLine => ({
				id: source,
				label: t([
					`${pick(sourceName[source], "en")} ${price(prices[source])}`,
					`${pick(sourceName[source], "zh")} ${price(prices[source])}`,
				]),
				points: [
					[xRange[0], prices[source]],
					[xRange[1], prices[source]],
				],
				tone: "reference",
			}),
		),
	];
	const markers: PayoffMarker[] = shown.all
		? sources.map((source) => ({
				id: source,
				x: fitted[source] * 100,
				y: prices[source],
				label: percent(fitted[source]),
			}))
		: [
				{
					id: "guess",
					x: shown.guess * 100,
					y: model,
					label: price(model),
					tone: Math.abs(model - target) < 0.005 ? "gain" : "loss",
				},
			];
	const result: ResultItem[] = shown.all
		? sources.map((source) => ({
				id: source,
				label: t([
					`IV from the ${pick(sourceName[source], "en")}`,
					`由${pick(sourceName[source], "zh")}反推的 IV`,
				]),
				value: percent(fitted[source]),
				note: price(prices[source]),
				evidence: "modeled",
			}))
		: [
				{
					id: "guess",
					label: t([
						`Model at ${percent(shown.guess)}`,
						`IV ${percent(shown.guess)} 时的模型`,
					]),
					value: price(model),
					note: t([
						`${pick(sourceName[shown.source], "en")} ${price(target)}`,
						`${pick(sourceName[shown.source], "zh")} ${price(target)}`,
					]),
					tone: Math.abs(model - target) < 0.005 ? "gain" : "loss",
					evidence: "modeled",
				},
				...(phase === "explore" || Math.abs(model - target) < 0.005
					? [
							{
								id: "fit",
								label: t(["IV that fits", "拟合的 IV"]),
								value:
									Math.abs(model - target) < 0.005
										? percent(fitted[shown.source])
										: model < target
											? t(["higher", "更高"])
											: t(["lower", "更低"]),
								note: t(["solved through the model", "通过模型求解"]),
								evidence: "modeled" as const,
							},
						]
					: []),
			];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The Oct 18 100 call's model value against implied volatility, with the market price as a horizontal line; where they cross is the implied volatility",
						"10月18日 100 看涨的模型价值随隐含波动率变化，市场价格是一条水平线，两者的交点就是隐含波动率",
					])}
					height={chartHeight}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={chartHeight(width)}
							xRange={xRange}
							yRange={zoom ? [3.8, 4.4] : [2, 6]}
							xTicks={zoom ? [33, 34, 35, 36, 37] : [20, 30, 40, 50]}
							yTicks={zoom ? [3.8, 4, 4.2, 4.4] : [2, 3, 4, 5, 6]}
							lines={lines}
							markers={markers}
							drag={
								explore && !shown.all
									? {
											markerId: "guess",
											min: Math.max(25, xRange[0]),
											max: Math.min(45, xRange[1]),
											step: 0.1,
											onChange: (iv) =>
												setExplore({
													...explore,
													guess: Math.round(iv * 10) / 1000,
												}),
										}
									: undefined
							}
							formatX={(iv) => `${iv}%`}
							formatY={(dollars) =>
								usd(Math.round(dollars * 100), zoom ? 2 : 0)
							}
							xLabel={t(["volatility put into the model", "代入模型的波动率"])}
							title={t([
								`ALFA Oct 18 100 call · ALFA $${SPOT} · ${DAYS} days`,
								`ALFA 10月18日 100 看涨 · ALFA $${SPOT} · ${DAYS} 天`,
							])}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<>
						<ChoiceField
							label={t(["Price to fit", "拟合的价格"])}
							value={explore.source}
							options={[
								["bid", t(["Bid", "买价"])],
								["mid", t(["Mid", "中间价"])],
								["ask", t(["Ask", "卖价"])],
							]}
							onChange={(source) => setExplore({ ...explore, source })}
						/>
						<RangeControl
							label={t(["Volatility guess", "波动率猜测"])}
							value={Math.round(explore.guess * 1000) / 10}
							display={percent(explore.guess)}
							min={25}
							max={45}
							step={0.1}
							onChange={(guess) =>
								setExplore({ ...explore, guess: Math.round(guess * 10) / 1000 })
							}
						/>
					</>
				) : null
			}
			details={
				<p>
					{t([
						"Implied volatility isn't observed. It is the input that makes a stated model, here Black-Scholes with no rates or dividends, reproduce a chosen price. Choose the bid, mid, ask or a trade and you get a different IV; choose another model and you get another. It describes the price in volatility units; it isn't a measurement of future moves.",
						"隐含波动率不是观测得到的。它是让一个指定模型（这里是无利率、无股息的 Black-Scholes）重现某个价格的输入。选买价、中间价、卖价或某笔成交，会得到不同的 IV；换一个模型又会不同。它用波动率单位描述价格，而不是对未来变动的测量。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: realized volatility depends on the measurement ———

type Window = 20 | 10;
type MeasureState = { window: Window; annualized: boolean; periods: 252 | 365 };

const returns = dailyReturns(alfaCloses);
const windowReturns = (window: Window) =>
	returns.slice(returns.length - window);
const rv = (window: Window, periods: 252 | 365 = 252) =>
	realizedVolatility(windowReturns(window), periods);
const RV20 = rv(20);

/** "Aug 16" / "8月16日". */
const shortDate = (iso: string, locale: Locale) => {
	const [, month, day] = iso.split("-").map(Number);
	return locale === "zh"
		? `${month}月${day}日`
		: new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				timeZone: "UTC",
			});
};

const RETURN_TOP = 34;
const RETURN_BOTTOM = 196;
const returnsHeight = RETURN_BOTTOM + 24;

function ReturnsChart({
	width,
	state,
	locale,
}: {
	width: number;
	state: MeasureState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const left = 44;
	const right = width - 8;
	const slot = (right - left) / returns.length;
	const range = 0.03;
	const mid = (RETURN_TOP + RETURN_BOTTOM) / 2;
	const y = (value: number) =>
		mid - (value / range) * ((RETURN_BOTTOM - RETURN_TOP) / 2);
	const first = returns.length - state.window;
	const sd = standardDeviation(windowReturns(state.window));
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t([
					`ALFA daily returns · ${shortDate(alfaCloses[1].date, "en")} to ${shortDate(alfaCloses[alfaCloses.length - 1].date, "en")}`,
					`ALFA 每日收益 · ${shortDate(alfaCloses[1].date, "zh")} 至 ${shortDate(alfaCloses[alfaCloses.length - 1].date, "zh")}`,
				])}
			</Label>
			<m.rect
				y={y(sd)}
				height={y(-sd) - y(sd)}
				className="wt-band-neutral"
				initial={false}
				animate={{
					x: left + first * slot,
					width: state.window * slot,
					opacity: state.annualized ? 1 : 0,
				}}
				transition={motion.move}
			/>
			{[0.02, 0, -0.02].map((tick) => (
				<g key={tick}>
					<path
						d={`M${left} ${y(tick)}H${right}`}
						className={tick === 0 ? "wt-axis" : "wt-grid"}
					/>
					<Label x={left - 6} y={y(tick) + 4} anchor="end" tone="small">
						{tick === 0
							? "0"
							: `${tick > 0 ? "+" : "−"}${Math.abs(tick * 100)}%`}
					</Label>
				</g>
			))}
			{returns.map((value, i) => {
				const inWindow = i >= first;
				const top = value >= 0 ? y(value) : y(0);
				return (
					<m.rect
						key={alfaCloses[i + 1].date}
						x={left + i * slot + slot * 0.18}
						y={top}
						width={slot * 0.64}
						height={Math.abs(y(value) - y(0))}
						rx={2}
						className={value >= 0 ? "wt-long-soft" : "wt-short-soft"}
						initial={false}
						animate={{ opacity: inWindow ? 1 : 0.25 }}
						transition={motion.fade}
					/>
				);
			})}
			{state.annualized ? (
				<Label
					x={right}
					y={y(sd) - 5}
					anchor="end"
					tone="accent"
					className="wt-halo"
				>
					{t([`±${percent(sd, 2)} a day`, `每天 ±${percent(sd, 2)}`])}
				</Label>
			) : null}
			<Label x={left} y={RETURN_BOTTOM + 18} tone="small">
				{shortDate(alfaCloses[1].date, locale)}
			</Label>
			<Label x={right} y={RETURN_BOTTOM + 18} anchor="end" tone="small">
				{shortDate(alfaCloses[alfaCloses.length - 1].date, locale)}
			</Label>
		</g>
	);
}

function MeasureView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: MeasureState;
	explore: MeasureState | null;
	setExplore: (next: MeasureState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const sd = standardDeviation(windowReturns(shown.window));
	const annual = rv(shown.window, shown.periods);
	const window = windowReturns(shown.window);
	const result: ResultItem[] = [
		{
			id: "range",
			label: t([
				`Last ${shown.window} sessions`,
				`最近 ${shown.window} 个交易日`,
			]),
			value: t([
				`${percent(Math.min(...window))} to ${percent(Math.max(...window))}`,
				`${percent(Math.min(...window))} 至 ${percent(Math.max(...window))}`,
			]),
			note: t(["daily returns", "每日收益"]),
			evidence: "observed",
		},
	];
	if (shown.annualized)
		result.push(
			{
				id: "sd",
				label: t(["Daily standard deviation", "每日标准差"]),
				value: percent(sd, 2),
				evidence: "calculated",
			},
			{
				id: "rv",
				label: t([
					`RV${shown.window}, annualized`,
					`RV${shown.window}（年化）`,
				]),
				value: percent(annual, 0),
				note: t([`× √${shown.periods}`, `× √${shown.periods}`]),
				evidence: "calculated",
			},
		);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"ALFA's daily returns over 20 sessions as bars, with a band one standard deviation either side of zero for the chosen window",
						"ALFA 近 20 个交易日的每日收益柱状图，并按所选窗口在零两侧标出一个标准差的带",
					])}
					height={returnsHeight}
				>
					{(width) => (
						<ReturnsChart width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<>
						<ChoiceField
							label={t(["Window", "窗口"])}
							value={String(explore.window) as "20" | "10"}
							options={[
								["20", t(["20 sessions", "20 个交易日"])],
								["10", t(["10 sessions", "10 个交易日"])],
							]}
							onChange={(value) =>
								setExplore({ ...explore, window: Number(value) as Window })
							}
						/>
						<ChoiceField
							label={t(["Days per year", "每年天数"])}
							value={String(explore.periods) as "252" | "365"}
							options={[
								["252", t(["252 trading", "252 个交易日"])],
								["365", t(["365 calendar", "365 个自然日"])],
							]}
							onChange={(value) =>
								setExplore({ ...explore, periods: Number(value) as 252 | 365 })
							}
						/>
					</>
				) : null
			}
			details={
				<p>
					{t([
						"Realized volatility is measured from past prices: take daily returns over a window, find their standard deviation, and scale by the square root of the periods in a year. Every choice changes the answer: the window, closes or intraday data, log or simple returns, √252 or √365. A vendor's 'historical volatility' field is someone else's choices; read them before comparing.",
						"已实现波动率由过去的价格测量：取一个窗口内的每日收益，求标准差，再乘以一年期数的平方根。每个选择都会改变结果：窗口长短、用收盘价还是日内数据、对数收益还是简单收益、√252 还是 √365。供应商的“历史波动率”字段是别人的选择，比较之前先看清楚。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: forward and backward horizons ———

type HorizonState = { stage: 0 | 1 | 2 };

const IV_POINTS = Math.round(fitted.mid * 100);
const RV_POINTS = Math.round(RV20 * 100);
const GAP = IV_POINTS - RV_POINTS;

const dayIndex = (iso: string) =>
	Math.round(
		(Date.parse(`${iso}T12:00:00Z`) -
			Date.parse(`${alfaCloses[0].date}T12:00:00Z`)) /
			86_400_000,
	);
const TIMELINE_END = dayIndex(expiries.oct18.date);

function Horizons({
	width,
	state,
	locale,
}: {
	width: number;
	state: HorizonState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const left = 12;
	const right = width - 12;
	const x = (iso: string) =>
		left + (dayIndex(iso) / TIMELINE_END) * (right - left);
	const axisY = 120;
	const rvFrom = x(alfaCloses[0].date);
	const rvTo = x(alfaCloses[alfaCloses.length - 1].date);
	const today = x(SESSION_DATE);
	const expiry = x(expiries.oct18.date);
	const earnings = x(ALFA_EARNINGS_DATE);
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t(["Two windows around today", "今天前后的两个窗口"])}
			</Label>
			<path d={`M${left} ${axisY}H${right}`} className="wt-axis" />
			<path d={`M${today} ${axisY - 70}V${axisY + 8}`} className="wt-bracket" />
			<Label x={today} y={axisY + 24} anchor="middle" tone="accent">
				{t(["today", "今天"])}
			</Label>
			<Label x={left} y={axisY + 24} tone="small">
				{shortDate(alfaCloses[0].date, locale)}
			</Label>
			<Label x={right} y={axisY + 24} anchor="end" tone="small">
				{shortDate(expiries.oct18.date, locale)}
			</Label>
			<rect
				x={rvFrom}
				y={axisY - 34}
				width={rvTo - rvFrom}
				height={24}
				rx={6}
				className="wt-long-soft"
			/>
			<Label
				x={(rvFrom + rvTo) / 2}
				y={axisY - 17}
				anchor="middle"
				className="wt-on-soft"
			>
				{`RV20 ${RV_POINTS}%`}
			</Label>
			<Label
				x={(rvFrom + rvTo) / 2}
				y={axisY - 42}
				anchor="middle"
				tone="small"
			>
				{t(["measured from closes", "由收盘价测得"])}
			</Label>
			<m.g
				initial={false}
				animate={{ opacity: state.stage >= 1 ? 1 : 0 }}
				transition={motion.fade}
			>
				<rect
					x={today + 4}
					y={axisY - 34}
					width={expiry - today - 4}
					height={24}
					rx={6}
					className="wt-focus-shape"
				/>
				<Label
					x={(today + expiry) / 2}
					y={axisY - 17}
					anchor="middle"
					tone="accent"
				>
					{`IV ${IV_POINTS}%`}
				</Label>
				<Label
					x={(today + expiry) / 2}
					y={axisY - 42}
					anchor="middle"
					tone="small"
				>
					{t(["implied by prices", "由价格隐含"])}
				</Label>
				<path
					d={`M${earnings} ${axisY - 8}V${axisY + 8}`}
					className="wt-bracket"
				/>
				<Label x={earnings} y={axisY + 42} anchor="middle" tone="small">
					{t(["earnings", "财报"])}
				</Label>
			</m.g>
			<m.g
				initial={false}
				animate={{ opacity: state.stage >= 2 ? 1 : 0 }}
				transition={motion.fade}
			>
				<Label
					x={width / 2}
					y={axisY - 76}
					anchor="middle"
					tone="accent"
					className="wt-halo"
				>
					{t([`gap: +${GAP} vol points`, `差距：+${GAP} 个波动率点`])}
				</Label>
			</m.g>
		</g>
	);
}

function HorizonView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: HorizonState;
	explore: HorizonState | null;
	setExplore: (next: HorizonState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] = [
		{
			id: "rv",
			label: t(["RV20, backward", "RV20，向后"]),
			value: `${RV_POINTS}%`,
			note: t([
				"20 sessions to Sep 13, √252",
				"截至 9月13日 的 20 个交易日，√252",
			]),
			evidence: "calculated",
		},
	];
	if (shown.stage >= 1)
		result.push({
			id: "iv",
			label: t(["IV, forward", "IV，向前"]),
			value: `${IV_POINTS}%`,
			note: t([
				"Oct 18 100 call mid, to Oct 18",
				"10月18日 100 看涨中间价，至 10月18日",
			]),
			evidence: "modeled",
		});
	if (shown.stage >= 2)
		result.push({
			id: "gap",
			label: t(["IV − RV", "IV − RV"]),
			value: t([`+${GAP} points`, `+${GAP} 点`]),
			note: t([
				`not a return forecast; ${Math.round((GAP / RV_POINTS) * 100)}% relative is another number`,
				`不是收益预测；相对差 ${Math.round((GAP / RV_POINTS) * 100)}% 是另一个数`,
			]),
			evidence: "calculated",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A timeline with the 20 sessions realized volatility measures before today and the period to Oct 18 that implied volatility prices, including earnings",
						"一条时间线：今天之前用于测量已实现波动率的 20 个交易日，以及隐含波动率所定价的直到 10月18日 的时段（含财报）",
					])}
					height={180}
				>
					{(width) => <Horizons width={width} state={shown} locale={locale} />}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Show", "显示"])}
						value={String(explore.stage) as "0" | "1" | "2"}
						options={[
							["0", "RV"],
							["1", "+ IV"],
							["2", t(["+ Gap", "+ 差距"])],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as HorizonState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Realized volatility looks back over a window that already happened; implied volatility is priced over a window still to come, here one that includes ALFA's earnings. Their difference is in volatility points and says options price more movement than the recent past showed. It isn't a forecast of returns or proof of mispricing, and after earnings implied volatility often falls even when the stock moves the way you hoped.",
						"已实现波动率回看一个已经发生的窗口；隐含波动率定价的是一个尚未到来的窗口，这里包含 ALFA 的财报。两者之差以波动率点计，说明期权定价的波动比近期实际更大。它不是收益预测，也不证明定价错误；财报之后，即使股价按你希望的方向走，隐含波动率也常常下降。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const GUESS = 0.3;
const RV10 = rv(10);
const DAILY_SD = standardDeviation(windowReturns(20));

const scenes = [
	defineScene<FitState, FitState>({
		id: "fit",
		label: ["Infer IV from price", "从价格反推 IV"],
		title: ["IV is a model input fitted to a price", "IV 是拟合价格的模型输入"],
		predict: {
			prompt: [
				`At ${percent(GUESS, 0)} volatility the model prices the Oct 18 100 call at ${price(callAt(GUESS))}, below its ${price(prices.mid)} mid. The IV that fits the mid is…`,
				`波动率为 ${percent(GUESS, 0)} 时，模型给 10月18日 100 看涨的价格是 ${price(callAt(GUESS))}，低于中间价 ${price(prices.mid)}。拟合中间价的 IV 是……`,
			],
			choices: [
				{
					id: "higher",
					label: [
						`Higher: about ${percent(fitted.mid, 0)}`,
						`更高：约 ${percent(fitted.mid, 0)}`,
					],
				},
				{ id: "lower", label: ["Lower: about 25%", "更低：约 25%"] },
				{
					id: "observed",
					label: [
						`${percent(GUESS, 0)}: IV is observed`,
						`${percent(GUESS, 0)}：IV 是观测到的`,
					],
				},
			],
			answer: "higher",
			explain: [
				`A higher volatility raises the model price. At ${percent(fitted.mid)} the model matches the ${price(prices.mid)} mid, so that's the implied volatility.`,
				`波动率越高，模型价格越高。在 ${percent(fitted.mid)} 时模型与中间价 ${price(prices.mid)} 吻合，这就是隐含波动率。`,
			],
		},
		beats: [
			{
				id: "guess",
				label: ["A guess", "猜测"],
				caption: [
					`The quote is ${price(prices.bid)} bid, ${price(prices.ask)} ask. Put ${percent(GUESS, 0)} into the model and it says ${price(callAt(GUESS))}, below the ${price(prices.mid)} mid.`,
					`报价为买价 ${price(prices.bid)}、卖价 ${price(prices.ask)}。把 ${percent(GUESS, 0)} 代入模型，得到 ${price(callAt(GUESS))}，低于中间价 ${price(prices.mid)}。`,
				],
				state: { guess: GUESS, source: "mid", all: false },
			},
			{
				id: "fit",
				label: ["The fit", "拟合"],
				caption: [
					`Raise the input until the model matches: ${percent(fitted.mid)}. That input is the implied volatility of the mid.`,
					`提高输入，直到模型吻合：${percent(fitted.mid)}。这个输入就是中间价的隐含波动率。`,
				],
				state: { guess: fitted.mid, source: "mid", all: false },
			},
			{
				id: "sources",
				label: ["Bid and ask", "买价与卖价"],
				caption: [
					`Fit the bid instead and you get ${percent(fitted.bid)}; the ask, ${percent(fitted.ask)}. Same option, three IVs: say which price you used.`,
					`改为拟合买价，得到 ${percent(fitted.bid)}；拟合卖价，得到 ${percent(fitted.ask)}。同一张期权，三个 IV：要说明用的是哪个价格。`,
				],
				state: { guess: fitted.mid, source: "mid", all: true },
			},
		],
		explore: {
			prompt: [
				"Pick a price and try volatility guesses until the model matches it.",
				"选择一个价格，尝试不同的波动率，直到模型吻合。",
			],
			start: () => ({ guess: 0.4, source: "ask", all: false }),
			task: {
				kind: "reach",
				prompt: [
					"Fit the bid instead: find the guess at which the model matches $4.05.",
					"改为拟合买价：找出让模型等于 $4.05 的波动率猜测。",
				],
				reached: (e) =>
					e.source === "bid" && Math.abs(e.guess - fitted.bid) < 0.0006,
				done: [
					`${percent(fitted.bid)} fits the bid, against ${percent(fitted.mid)} for the mid and ${percent(fitted.ask)} for the ask. Same option, three IVs: always say which price you fitted.`,
					`${percent(fitted.bid)} 拟合买价，中间价是 ${percent(fitted.mid)}，卖价是 ${percent(fitted.ask)}。同一期权，三个 IV：务必说明拟合的是哪个价格。`,
				],
			},
		},
		View: FitView,
	}),
	defineScene<MeasureState, MeasureState>({
		id: "measure",
		label: ["Measure past returns", "测量历史收益"],
		title: [
			"Realized volatility depends on how you measure",
			"已实现波动率取决于测量方式",
		],
		predict: {
			prompt: [
				`ALFA's daily returns over 20 sessions have a standard deviation of ${percent(DAILY_SD, 2)}. Annualized, that's about…`,
				`ALFA 近 20 个交易日的每日收益标准差为 ${percent(DAILY_SD, 2)}。年化后大约是……`,
			],
			choices: [
				{
					id: "sqrt",
					label: [`${percent(RV20, 0)}: × √252`, `${percent(RV20, 0)}：× √252`],
				},
				{
					id: "linear",
					label: [
						`${percent(DAILY_SD * 252, 0)}: × 252`,
						`${percent(DAILY_SD * 252, 0)}：× 252`,
					],
				},
				{
					id: "daily",
					label: [
						`${percent(DAILY_SD, 2)}: it's already volatility`,
						`${percent(DAILY_SD, 2)}：这已经是波动率`,
					],
				},
			],
			answer: "sqrt",
			entry: {
				answer: Math.round(RV20 * 1000) / 10,
				tolerance: 1.5,
				unit: ["%", "%"],
			},
			revealAt: 1,
			explain: [
				`Variance adds up over days, so the standard deviation grows with the square root of time: ${percent(DAILY_SD, 2)} × √252 ≈ ${percent(RV20, 0)}.`,
				`方差随天数累加，所以标准差随时间的平方根增长：${percent(DAILY_SD, 2)} × √252 ≈ ${percent(RV20, 0)}。`,
			],
		},
		beats: [
			{
				id: "returns",
				label: ["Returns", "收益"],
				caption: [
					`Twenty daily returns from ALFA's closes, from ${percent(Math.min(...returns))} to ${percent(Math.max(...returns))}.`,
					`由 ALFA 收盘价得到的 20 个每日收益，从 ${percent(Math.min(...returns))} 到 ${percent(Math.max(...returns))}。`,
				],
				state: { window: 20, annualized: false, periods: 252 },
			},
			{
				id: "annualize",
				label: ["Annualize", "年化"],
				caption: [
					`Their standard deviation is ${percent(DAILY_SD, 2)} a day. Times √252 trading days: realized volatility of ${percent(RV20, 0)}.`,
					`它们的标准差是每天 ${percent(DAILY_SD, 2)}。乘以 √252 个交易日：已实现波动率 ${percent(RV20, 0)}。`,
				],
				state: { window: 20, annualized: true, periods: 252 },
			},
			{
				id: "window",
				label: ["10 sessions", "10 个交易日"],
				caption: [
					`Use only the calmer last 10 sessions and it's ${percent(RV10, 0)}. Same stock, same method, a different window.`,
					`只用较平静的最近 10 个交易日，结果是 ${percent(RV10, 0)}。同一只股票、同一种方法，只是窗口不同。`,
				],
				state: { window: 10, annualized: true, periods: 252 },
			},
		],
		explore: {
			prompt: [
				"Change the window and the days per year.",
				"改变窗口和每年天数。",
			],
			start: () => ({ window: 20, annualized: true, periods: 365 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the settings that report the lowest realized volatility.",
					"找出报告的已实现波动率最低的设置。",
				],
				reached: (e) => e.window === 10 && e.periods === 252,
				done: [
					"The calmer 10 sessions, annualized with 252 trading days, give the smallest number. Same stock and same returns: the window and the convention set the figure.",
					"较平静的 10 个交易日，用 252 个交易日年化，得到的数字最小。同一股票、同样的收益率：窗口和约定决定了数值。",
				],
			},
		},
		View: MeasureView,
	}),
	defineScene<HorizonState, HorizonState>({
		id: "horizons",
		label: ["Compare the horizons", "比较时间范围"],
		title: [
			"Forward and backward estimates answer different questions",
			"向前与向后估计回答不同问题",
		],
		predict: {
			prompt: [
				`IV is ${IV_POINTS}% and RV20 is ${RV_POINTS}%. What does the ${GAP}-point gap tell you?`,
				`IV 为 ${IV_POINTS}%，RV20 为 ${RV_POINTS}%。${GAP} 个点的差距说明了什么？`,
			],
			choices: [
				{
					id: "more",
					label: [
						"Options price more movement ahead than the last 20 sessions showed",
						"期权定价的未来波动比最近 20 个交易日更大",
					],
				},
				{
					id: "rise",
					label: [`ALFA will rise ${GAP}%`, `ALFA 将上涨 ${GAP}%`],
				},
				{
					id: "overpriced",
					label: [
						`Options are ${Math.round((GAP / RV_POINTS) * 100)}% overpriced`,
						`期权被高估了 ${Math.round((GAP / RV_POINTS) * 100)}%`,
					],
				},
			],
			answer: "more",
			revealAt: 2,
			explain: [
				"The windows differ: RV looks back at calm-ish sessions, IV prices a month that includes earnings. The gap is in volatility points, not a return and not a verdict on price.",
				"两个窗口不同：RV 回看较平静的交易日，IV 定价的是包含财报的一个月。这个差距以波动率点计，不是收益，也不是对价格的裁决。",
			],
		},
		beats: [
			{
				id: "rv",
				label: ["Backward", "向后"],
				caption: [
					`RV20 looks back: ${RV_POINTS}%, measured from ALFA's closes over the 20 sessions to Sep 13.`,
					`RV20 向后看：${RV_POINTS}%，由截至 9月13日 的 20 个交易日的 ALFA 收盘价测得。`,
				],
				state: { stage: 0 },
			},
			{
				id: "iv",
				label: ["Forward", "向前"],
				caption: [
					`IV looks forward: ${IV_POINTS}%, implied by the Oct 18 call's price over the ${DAYS} days to expiry. ALFA reports earnings inside that window.`,
					`IV 向前看：${IV_POINTS}%，由 10月18日 看涨在到期前 ${DAYS} 天的价格隐含。ALFA 的财报就在这个窗口内。`,
				],
				state: { stage: 1 },
			},
			{
				id: "gap",
				label: ["The gap", "差距"],
				caption: [
					`The difference is +${GAP} vol points: options price more movement for the month ahead, which holds earnings, than the last month delivered. That's all it says.`,
					`两者相差 +${GAP} 个波动率点：期权为包含财报的未来一个月定价的波动，比上个月实际发生的更大。它说明的仅此而已。`,
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: ["Step through the two windows.", "逐步查看两个窗口。"],
			start: () => ({ stage: 2 }),
			task: {
				kind: "answer",
				prompt: [
					"What is the gap between IV and RV measured in?",
					"IV 与 RV 之间的差距用什么衡量？",
				],
				choices: [
					{ id: "points", label: ["Volatility points", "波动率点"] },
					{ id: "return", label: ["Percent of return", "收益率百分比"] },
					{
						id: "verdict",
						label: ["How overpriced the options are", "期权被高估的程度"],
					},
				],
				answer: "points",
				done: [
					"35% minus 24% is 11 volatility points between two windows: one ahead that holds earnings, one behind that was calm. It isn't a return forecast or a verdict on price.",
					"35% 减 24% 是两个窗口之间相差 11 个波动率点：前面一个包含财报，后面一个相对平静。它既不是收益预测，也不是价格判断。",
				],
			},
		},
		View: HorizonView,
	}),
] as const;

export function ImpliedRealizedVolatilityWalkthrough({
	locale,
}: {
	locale: Locale;
}) {
	return (
		<Walkthrough
			locale={locale}
			id="implied-realized-volatility"
			label={[
				"Interactive lesson on implied and realized volatility",
				"隐含与已实现波动率互动课",
			]}
			scenes={scenes}
		/>
	);
}
