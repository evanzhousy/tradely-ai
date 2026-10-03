import { type Copy, dayCount, pick, signedUsd, usd } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { RangeControl } from "../concept-scene";
import {
	PayoffChart,
	type PayoffLine,
	type PayoffMarker,
} from "../walkthrough/instruments/payoff-chart";
import {
	Waterfall,
	type WaterfallStep,
} from "../walkthrough/instruments/waterfall";
import { Player } from "../walkthrough/player";
import { Stage } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame } from "../walkthrough/walkthrough";
import { thetaVegaRhoFilm } from "./theta-vega-rho-film";
import {
	afterWeek,
	contracts,
	contributions,
	DAYS,
	DELTA,
	DOLLAR_IV,
	dateAfter,
	FAST_DAY,
	GAMMA,
	IV,
	IV_RELATIVE,
	IV_UP,
	ivRelative,
	ivUp,
	lastDay,
	lastWeek,
	points,
	price,
	RHO,
	round,
	SCENARIO,
	SPOT,
	scenario,
	signedPrice,
	THETA,
	TODAY,
	VEGA,
	value,
	WEEK,
} from "./theta-vega-rho-model";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

const chartHeight = (width: number) => (width < 520 ? 260 : 290);

// ——— Scene 1: time passes ———

type TimeState = { elapsed: number };

function TimeView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: TimeState;
	explore: TimeState | null;
	setExplore: (next: TimeState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const left = DAYS - shown.elapsed;
	const now = value(SPOT, left, IV);
	const lines: PayoffLine[] = [
		{
			id: "value",
			label: t(["value, model", "价值（模型）"]),
			points: Array.from({ length: DAYS * 2 + 1 }, (_, i) => {
				const elapsed = i / 2;
				return [elapsed, value(SPOT, DAYS - elapsed, IV).price] as const;
			}),
			tone: "position",
			dashed: true,
		},
	];
	const markers: PayoffMarker[] = [
		{ id: "now", x: shown.elapsed, y: now.price, label: price(now.price) },
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The Oct 18 100 call's model value from today to expiry with ALFA held at $100 and volatility unchanged, falling faster near the end",
						"ALFA 保持 $100、波动率不变时，10月18日 100 看涨从今天到到期的模型价值，越接近到期跌得越快",
					])}
					height={chartHeight}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={chartHeight(width)}
							xRange={[0, DAYS]}
							yRange={[0, 5]}
							xTicks={width < 520 ? [0, 16, DAYS] : [0, 8, 16, 24, DAYS]}
							yTicks={[0, 1, 2, 3, 4, 5]}
							lines={lines}
							markers={markers}
							drag={
								explore
									? {
											markerId: "now",
											min: 0,
											max: DAYS - 1,
											step: 1,
											onChange: (elapsed) => setExplore({ elapsed }),
										}
									: undefined
							}
							formatX={(elapsed) => dateAfter(elapsed, locale)}
							formatY={(dollars) => usd(dollars * 100, 0)}
							xLabel={t([
								`ALFA held at $${SPOT}, IV ${points(IV)}`,
								`ALFA 保持 $${SPOT}，IV ${points(IV)}`,
							])}
							title={t([
								"ALFA Oct 18 100 call · value as days pass",
								"ALFA 10月18日 100 看涨 · 随天数流逝的价值",
							])}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "value",
					label: t([
						`Value, ${dateAfter(shown.elapsed, "en")}`,
						`${dateAfter(shown.elapsed, "zh")} 的价值`,
					]),
					value: price(now.price),
					note:
						shown.elapsed === 0
							? t(["today", "今天"])
							: t([
									`${signedPrice(now.price - TODAY.price)} since today`,
									`比今天 ${signedPrice(now.price - TODAY.price)}`,
								]),
					evidence: "modeled",
				},
				{
					id: "theta",
					label: t(["Theta", "Theta"]),
					value: t([
						`${price(round(now.theta, 3), 3)} a day`,
						`每天 ${price(round(now.theta, 3), 3)}`,
					]),
					note: t([`${dayCount(left)} left`, `剩 ${left} 天`]),
					evidence: "modeled",
				},
			]}
			controls={
				explore ? (
					<RangeControl
						label={t(["Days passed", "经过天数"])}
						value={explore.elapsed}
						display={dateAfter(explore.elapsed, locale)}
						min={0}
						max={DAYS - 1}
						step={1}
						onChange={(elapsed) => setExplore({ elapsed })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Theta is the change in value for one calendar day passing, with price and volatility held fixed. It is quoted per share per day; check whether a source counts calendar or trading days. It isn't a straight line: an at-the-money option loses value slowly at first and fastest in its last days, because the time left for the stock to move shrinks toward zero.",
						"Theta 是在价格和波动率不变时，过去一个自然日带来的价值变化，按每股每天报价；要看清数据源按自然日还是交易日计算。它不是一条直线：平值期权起初损失得慢，最后几天损失得最快，因为留给股价变动的时间趋近于零。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: volatility points ———

type VolState = { iv: number };

function VolView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: VolState;
	explore: VolState | null;
	setExplore: (next: VolState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const now = value(SPOT, DAYS, shown.iv);
	const change = now.price - TODAY.price;
	const pointsMoved = round((shown.iv - IV) * 100, 2);
	const signedPoints = `${pointsMoved < 0 ? "−" : "+"}${Math.abs(pointsMoved)}`;
	const moved = pointsMoved !== 0;
	const lines: PayoffLine[] = [
		{
			id: "value",
			label: t(["value, model", "价值（模型）"]),
			points: Array.from({ length: 31 }, (_, i) => {
				const iv = 0.2 + i * 0.01;
				return [iv * 100, value(SPOT, DAYS, iv).price] as const;
			}),
			tone: "position",
			dashed: true,
		},
	];
	const markers: PayoffMarker[] = [
		{ id: "today", x: IV * 100, y: TODAY.price },
		...(shown.iv !== IV
			? [
					{
						id: "now",
						x: shown.iv * 100,
						y: now.price,
						label: signedPrice(change),
						tone: change >= 0 ? ("gain" as const) : ("loss" as const),
					},
				]
			: []),
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The Oct 18 100 call's model value against implied volatility from 20% to 50%, nearly a straight line",
						"10月18日 100 看涨的模型价值随隐含波动率从 20% 到 50% 变化，几乎是一条直线",
					])}
					height={chartHeight}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={chartHeight(width)}
							xRange={[20, 50]}
							yRange={[2, 6]}
							xTicks={[20, 30, 40, 50]}
							yTicks={[2, 3, 4, 5, 6]}
							lines={lines}
							markers={markers}
							drag={
								explore
									? {
											markerId: shown.iv !== IV ? "now" : "today",
											min: 20,
											max: 50,
											step: 1,
											onChange: (iv) => setExplore({ iv: iv / 100 }),
										}
									: undefined
							}
							formatX={(iv) => `${iv}%`}
							formatY={(dollars) => usd(dollars * 100, 0)}
							xLabel={t(["implied volatility", "隐含波动率"])}
							title={t([
								`ALFA Oct 18 100 call · ALFA $${SPOT} · ${DAYS} days`,
								`ALFA 10月18日 100 看涨 · ALFA $${SPOT} · ${DAYS} 天`,
							])}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "iv",
					label: t(["IV", "IV"]),
					value: moved ? `${points(IV)} → ${points(shown.iv)}` : points(IV),
					note: moved
						? t([`${signedPoints} vol points`, `${signedPoints} 个波动率点`])
						: t(["today", "今天"]),
				},
				moved
					? {
							id: "change",
							label: t(["Value change", "价值变化"]),
							value: signedPrice(change),
							note: t([
								`vega ${price(VEGA, 3)} × ${signedPoints} = ${signedPrice(VEGA * pointsMoved)}`,
								`Vega ${price(VEGA, 3)} × ${signedPoints} = ${signedPrice(VEGA * pointsMoved)}`,
							]),
							tone: change > 0 ? "gain" : "loss",
							evidence: "modeled",
						}
					: {
							id: "change",
							label: t(["Vega", "Vega"]),
							value: price(VEGA, 3),
							note: t(["per vol point", "每个波动率点"]),
							evidence: "modeled",
						},
				{
					id: "rho",
					label: t(["Rho", "Rho"]),
					value: price(RHO, 3),
					note: t(["per rate point", "每个利率点"]),
					evidence: "modeled",
				},
			]}
			controls={
				explore ? (
					<RangeControl
						label={t(["Implied volatility", "隐含波动率"])}
						value={Math.round(explore.iv * 100)}
						display={points(explore.iv)}
						min={20}
						max={50}
						step={1}
						onChange={(iv) => setExplore({ iv: iv / 100 })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Vega is the change in value for one percentage point of implied volatility, with price and time held fixed. From 35% to 38% is three vol points, not a 3% increase; 3% of 35% would be just over one point. For an at-the-money option vega barely changes across this range, so the value line is nearly straight. Rho is the same idea for interest rates, per rate point, and is small for a month-long option.",
						"Vega 是在价格和时间不变时，隐含波动率每变动一个百分点带来的价值变化。从 35% 到 38% 是三个波动率点，而不是增加 3%；35% 的 3% 只比一个点多一点。对平值期权来说，在这个范围内 Vega 几乎不变，所以价值线接近直线。Rho 是利率上的同一概念，按每个利率点计，对一个月期的期权很小。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: add the contributions ———

type SumState = {
	move: number;
	days: number;
	volPoints: number;
	shown: 1 | 2 | 3;
};

function SumView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SumState;
	explore: SumState | null;
	setExplore: (next: SumState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const c = contributions(shown);
	const steps: WaterfallStep[] = [
		{
			id: "delta",
			label: "Δ",
			value: round(c.delta, 2),
			hidden: shown.shown < 1,
		},
		{
			id: "gamma",
			label: "Γ",
			value: round(c.gamma, 2),
			hidden: shown.shown < 1,
		},
		{
			id: "theta",
			label: "Θ",
			value: round(c.theta, 2),
			hidden: shown.shown < 2,
		},
		{
			id: "vega",
			label: "Vega",
			value: round(c.vega, 2),
			hidden: shown.shown < 2,
		},
		{
			id: "total",
			label: t(["sum", "合计"]),
			value: c.total,
			kind: "total",
			hidden: shown.shown < 2,
		},
		{
			id: "model",
			label: t(["model", "模型"]),
			value: round(c.repriced, 2),
			kind: "model",
			hidden: shown.shown < 2,
		},
	];
	// Bars must fit with room for their labels: step the scale up only when a scenario needs it.
	let running = 0;
	const ends: number[] = [];
	for (const step of steps) {
		if (step.kind) ends.push(Math.abs(step.value));
		else {
			running += step.value;
			ends.push(Math.abs(running));
		}
	}
	const reach = Math.max(...ends);
	const scale = [
		{ edge: 0.8, ticks: [-0.5, 0, 0.5] },
		{ edge: 1.6, ticks: [-1, 0, 1] },
		{ edge: 2.4, ticks: [-2, -1, 0, 1, 2] },
	].find((level) => reach * 1.35 <= level.edge) ?? {
		edge: 3.2,
		ticks: [-3, -2, -1, 0, 1, 2, 3],
	};
	const you = contracts("you");
	const ben = contracts("ben");
	const result: ResultItem[] = [
		{
			id: "scenario",
			label: t(["Scenario", "情景"]),
			value: t([
				`${signedUsd(shown.move * 100, 0)} · ${shown.days}d · ${shown.volPoints >= 0 ? "+" : "−"}${Math.abs(shown.volPoints)} pts`,
				`${signedUsd(shown.move * 100, 0)} · ${shown.days} 天 · ${shown.volPoints >= 0 ? "+" : "−"}${Math.abs(shown.volPoints)} 点`,
			]),
			note: t(["ALFA move, days, IV", "ALFA 变动、天数、IV"]),
		},
	];
	if (shown.shown >= 2)
		result.push({
			id: "total",
			label: t(["Sum of contributions", "各项贡献合计"]),
			value: signedPrice(c.total),
			note: t([
				`model: ${signedPrice(c.repriced)}`,
				`模型：${signedPrice(c.repriced)}`,
			]),
			tone: c.total >= 0 ? "gain" : "loss",
			evidence: "calculated",
		});
	if (shown.shown >= 3)
		result.push(
			{
				id: "you",
				label: t([`You, long ${you}`, `你，多头 ${you} 张`]),
				value: `≈ ${signedUsd(Math.round(c.total * 100 * you * 100), 0)}`,
				note: t(["× 100 shares × contracts", "× 100 股 × 张数"]),
				tone: c.total * you >= 0 ? "gain" : "loss",
				evidence: "calculated",
			},
			{
				id: "ben",
				label: t([
					`Ben, short ${Math.abs(ben)}`,
					`Ben，空头 ${Math.abs(ben)} 张`,
				]),
				value: `≈ ${signedUsd(Math.round(c.total * 100 * ben * 100), 0)}`,
				note: t(["every sign reversed", "所有符号都反过来"]),
				tone: c.total * ben >= 0 ? "gain" : "loss",
				evidence: "calculated",
			},
		);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A waterfall of per-share contributions from delta, gamma, theta and vega adding to an estimated change, beside the model's full repricing",
						"每股贡献瀑布图：Delta、Gamma、Theta 和 Vega 相加得到估计变化，旁边是模型完全重新定价的结果",
					])}
					height={chartHeight}
				>
					{(width) => (
						<Waterfall
							width={width}
							height={chartHeight(width)}
							steps={steps}
							range={[-scale.edge, scale.edge]}
							ticks={scale.ticks}
							format={
								width < 520
									? (dollars) =>
											dollars === 0
												? "0"
												: `${dollars > 0 ? "+" : "−"}${Math.abs(dollars).toFixed(2)}`
									: (dollars) => signedUsd(Math.round(dollars * 100))
							}
							title={t([
								"Oct 18 100 call · change per share, $ · by source",
								"10月18日 100 看涨 · 每股变化（美元）· 按来源",
							])}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<>
						<RangeControl
							label={t(["ALFA move", "ALFA 变动"])}
							value={explore.move}
							display={signedUsd(explore.move * 100, 0)}
							min={-3}
							max={3}
							step={1}
							onChange={(move) => setExplore({ ...explore, move })}
						/>
						<RangeControl
							label={t(["Days passed", "经过天数"])}
							value={explore.days}
							display={t([dayCount(explore.days), `${explore.days} 天`])}
							min={0}
							max={10}
							step={1}
							onChange={(days) => setExplore({ ...explore, days })}
						/>
						<RangeControl
							label={t(["IV change, points", "IV 变化（点）"])}
							value={explore.volPoints}
							display={`${explore.volPoints >= 0 ? "+" : "−"}${Math.abs(explore.volPoints)}`}
							min={-5}
							max={5}
							step={1}
							onChange={(volPoints) => setExplore({ ...explore, volPoints })}
						/>
					</>
				) : null
			}
			details={
				<p>
					{t([
						`Each Greek is local and assumes the others hold still, so add their contributions for small changes and check against a full repricing. Keep each one's unit: delta per $1, theta per day, vega per vol point, rho per rate point (${price(RHO, 3)} here, with rates unchanged). Scale by 100 shares and the signed contracts last; a short position reverses every sign, so Ben collects the time decay you pay.`,
						`每个希腊值都是局部的，并假设其他因素不动，所以小幅变化时可以把各项贡献相加，再用完全重新定价来核对。保留各自的单位：Delta 按每 $1，Theta 按每天，Vega 按每个波动率点，Rho 按每个利率点（这里是 ${price(RHO, 3)}，利率不变）。最后再乘以 100 股和带符号的张数；空头会把每个符号都反过来，所以 Ben 收取你支付的时间损耗。`,
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<TimeState, TimeState>({
		id: "time",
		label: ["Let time pass", "让时间流逝"],
		title: [
			"Theta is value lost per calendar day",
			"Theta 是每个自然日损失的价值",
		],
		predict: {
			prompt: [
				`ALFA stays at $${SPOT} and IV at ${points(IV)}. Over the next week, the Oct 18 100 call's model value…`,
				`ALFA 保持在 $${SPOT}，IV 保持 ${points(IV)}。接下来一周，10月18日 100 看涨的模型价值……`,
			],
			choices: [
				{
					id: "theta",
					label: [
						`Falls about ${price(-(afterWeek.price - TODAY.price))}`,
						`下跌约 ${price(-(afterWeek.price - TODAY.price))}`,
					],
				},
				{
					id: "flat",
					label: ["Stays the same: nothing moved", "不变：什么都没动"],
				},
				{
					id: "linear",
					label: [
						`Falls ${price((TODAY.price * WEEK) / DAYS)}: an even share per day`,
						`下跌 ${price((TODAY.price * WEEK) / DAYS)}：每天平均分摊`,
					],
				},
			],
			answer: "theta",
			explain: [
				`Theta is ${price(THETA, 3)} a day now, so a week costs about ${price(-THETA * WEEK)}; the model gives ${price(TODAY.price - afterWeek.price)}. It isn't an even share per day: most of the value goes in the last days.`,
				`现在 Theta 是每天 ${price(THETA, 3)}，所以一周大约损失 ${price(-THETA * WEEK)}；模型给出 ${price(TODAY.price - afterWeek.price)}。它不是每天平均分摊：大部分价值在最后几天流失。`,
			],
		},
		beats: [
			{
				id: "today",
				label: ["Today", "今天"],
				caption: [
					`Today the call is worth ${price(TODAY.price)} with ${DAYS} days left. Theta: ${price(THETA, 3)} for each calendar day, if nothing else changes.`,
					`今天这张看涨价值 ${price(TODAY.price)}，还剩 ${DAYS} 天。Theta：如果其他都不变，每过一个自然日 ${price(THETA, 3)}。`,
				],
				state: { elapsed: 0 },
			},
			{
				id: "week",
				label: ["A week", "一周"],
				caption: [
					`A week later, ALFA and IV unchanged, it's worth ${price(afterWeek.price)}: ${signedPrice(afterWeek.price - TODAY.price)}.`,
					`一周后，ALFA 和 IV 都不变，它价值 ${price(afterWeek.price)}：${signedPrice(afterWeek.price - TODAY.price)}。`,
				],
				state: { elapsed: WEEK },
			},
			{
				id: "last",
				label: ["Last week", "最后一周"],
				caption: [
					`With a week left it's ${price(lastWeek.price)} and losing ${price(-round(lastWeek.theta, 3), 3)} a day; on the last day, ${price(-round(lastDay.theta, 3), 3)}. At expiry, still at $${SPOT}, it's worth $0.`,
					`只剩一周时它价值 ${price(lastWeek.price)}，每天损失 ${price(-round(lastWeek.theta, 3), 3)}；最后一天每天 ${price(-round(lastDay.theta, 3), 3)}。到期时若仍在 $${SPOT}，价值为 $0。`,
				],
				state: { elapsed: DAYS - WEEK },
			},
		],
		explore: {
			prompt: [
				"Let the days pass and watch theta grow.",
				"让时间流逝，观察 Theta 变大。",
			],
			start: () => ({ elapsed: 28 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the first day on which the call loses more than $0.10 a day.",
					"找出看涨期权每天损失首次超过 $0.10 的那一天。",
				],
				reached: (e) => e.elapsed === FAST_DAY,
				done: [
					`With ${DAYS - FAST_DAY} days left, theta passes $0.10 a day, and it keeps growing to the last day. Most of the time value goes at the end.`,
					`还剩 ${DAYS - FAST_DAY} 天时，Theta 超过每天 $0.10，并一直增大到最后一天。大部分时间价值在最后流失。`,
				],
			},
		},
		View: TimeView,
	}),
	defineScene<VolState, VolState>({
		id: "vol",
		label: ["Read the units", "读取单位"],
		title: [
			"Vega counts volatility points, not percent",
			"Vega 按波动率点计，而不是百分比",
		],
		predict: {
			prompt: [
				`IV rises from ${points(IV)} to ${points(IV_UP)}. About how much does the call gain?`,
				`IV 从 ${points(IV)} 升到 ${points(IV_UP)}。看涨大约上涨多少？`,
			],
			choices: [
				{
					id: "points",
					label: [
						`About ${price(ivUp)}: three vol points`,
						`约 ${price(ivUp)}：三个波动率点`,
					],
				},
				{
					id: "percent",
					label: [
						`About ${price(ivRelative)}: 3% of ${points(IV)}`,
						`约 ${price(ivRelative)}：${points(IV)} 的 3%`,
					],
				},
				{ id: "dollars", label: ["About $3: $1 a point", "约 $3：每点 $1"] },
			],
			answer: "points",
			entry: {
				answer: Math.round(ivUp * 100) / 100,
				tolerance: 0.03,
				prefix: "$",
			},
			revealAt: 1,
			explain: [
				`Vega is ${price(VEGA, 3)} per vol point, and ${points(IV)} → ${points(IV_UP)} is 3 points: about ${price(VEGA * 3)}. The model gives ${price(ivUp)}.`,
				`Vega 是每个波动率点 ${price(VEGA, 3)}，${points(IV)} → ${points(IV_UP)} 是 3 个点：约 ${price(VEGA * 3)}。模型给出 ${price(ivUp)}。`,
			],
		},
		beats: [
			{
				id: "today",
				label: ["Today", "今天"],
				caption: [
					`At ${points(IV)} IV the call is worth ${price(TODAY.price)}. Vega: ${price(VEGA, 3)} for each percentage point of IV.`,
					`IV 为 ${points(IV)} 时，看涨价值 ${price(TODAY.price)}。Vega：IV 每变动一个百分点 ${price(VEGA, 3)}。`,
				],
				state: { iv: IV },
			},
			{
				id: "up",
				label: ["+3 points", "+3 点"],
				caption: [
					`IV ${points(IV)} → ${points(IV_UP)} is three vol points: ${signedPrice(ivUp)}.`,
					`IV ${points(IV)} → ${points(IV_UP)} 是三个波动率点：${signedPrice(ivUp)}。`,
				],
				state: { iv: IV_UP },
			},
			{
				id: "percent",
				label: ["3 percent", "3%"],
				caption: [
					`"IV up 3%" read as a percent of ${points(IV)} is only ${points(IV_RELATIVE)}: ${signedPrice(ivRelative)}. Same words, a third of the change.`,
					`把“IV 上涨 3%”理解成 ${points(IV)} 的百分之三，只到 ${points(IV_RELATIVE)}：${signedPrice(ivRelative)}。同样的说法，变化只有三分之一。`,
				],
				state: { iv: IV_RELATIVE },
			},
			{
				id: "rho",
				label: ["Rates: rho", "利率：Rho"],
				caption: [
					`Rho is the same idea for interest rates: a 1-point rise in rates adds about ${price(RHO, 3)} to this one-month call, against ${price(VEGA, 3)} for one vol point. It grows with time to expiry.`,
					`Rho 是同一概念在利率上的体现：利率上升 1 个百分点，这份一个月期看涨约增加 ${price(RHO, 3)}，而一个波动率点是 ${price(VEGA, 3)}。到期时间越长，Rho 越大。`,
				],
				state: { iv: IV },
			},
		],
		explore: {
			prompt: ["Move IV and read the change.", "移动 IV，读取变化。"],
			start: () => ({ iv: 0.3 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the highest IV at which the call is worth at least $1.00 less than today.",
					"找出让看涨期权价值比今天至少低 $1.00 的最高隐含波动率。",
				],
				reached: (e) => Math.round(e.iv * 100) === DOLLAR_IV,
				done: [
					`At ${DOLLAR_IV}%, ${Math.round(IV * 100) - DOLLAR_IV} vol points below today: at about ${price(VEGA, 3)} a point, it takes that many points to take a dollar off the call. Vega counts points of IV, not percent changes.`,
					`在 ${DOLLAR_IV}%，比今天低 ${Math.round(IV * 100) - DOLLAR_IV} 个波动率点：每点约 ${price(VEGA, 3)}，需要这么多个点才能让看涨期权少值一美元。Vega 按 IV 的点数计，而不是按百分比变化。`,
				],
			},
		},
		View: VolView,
	}),
	defineScene<SumState, SumState>({
		id: "sum",
		label: ["Build the contributions", "累加贡献"],
		title: [
			"Separate contributions before reading the total",
			"读取合计前区分各项贡献",
		],
		predict: {
			prompt: [
				`In ${SCENARIO.days} days ALFA is up $${SCENARIO.move}, but IV is down ${-SCENARIO.volPoints} points. With delta ${DELTA.toFixed(2)}, gamma ${GAMMA.toFixed(2)}, theta ${price(THETA, 3)} a day and vega ${price(VEGA, 3)} a point, about how much does the call's value change per share?`,
				`${SCENARIO.days} 天后 ALFA 上涨 $${SCENARIO.move}，但 IV 下降 ${-SCENARIO.volPoints} 个点。Delta ${DELTA.toFixed(2)}、Gamma ${GAMMA.toFixed(2)}、Theta 每天 ${price(THETA, 3)}、Vega 每点 ${price(VEGA, 3)}，看涨每股价值大约变化多少？`,
			],
			choices: [
				{
					id: "less",
					label: [
						`${signedPrice(scenario.total)}: time and IV outweigh the rise`,
						`${signedPrice(scenario.total)}：时间和 IV 抵消了上涨`,
					],
				},
				{
					id: "more",
					label: [
						`${signedPrice(DELTA * SCENARIO.move)}: the delta from the rise`,
						`${signedPrice(DELTA * SCENARIO.move)}：上涨带来的 Delta`,
					],
				},
				{ id: "same", label: ["$0: the effects cancel", "$0：各项相互抵消"] },
			],
			answer: "less",
			entry: { answer: scenario.total, tolerance: 0.03, prefix: "$" },
			revealAt: 1,
			explain: [
				`${signedPrice(scenario.delta)} + ${signedPrice(scenario.gamma)} from the move, ${signedPrice(scenario.theta)} from ${SCENARIO.days} days, ${signedPrice(scenario.vega)} from IV: ${signedPrice(scenario.total)}. The model reprices it at ${signedPrice(scenario.repriced)}.`,
				`变动带来 ${signedPrice(scenario.delta)} + ${signedPrice(scenario.gamma)}，${SCENARIO.days} 天带来 ${signedPrice(scenario.theta)}，IV 带来 ${signedPrice(scenario.vega)}：合计 ${signedPrice(scenario.total)}。模型重新定价为 ${signedPrice(scenario.repriced)}。`,
			],
		},
		beats: [
			{
				id: "move",
				label: ["The move", "变动"],
				caption: [
					`Start with the price: $${SCENARIO.move} up adds ${signedPrice(scenario.delta)} from delta and ${signedPrice(scenario.gamma)} from gamma.`,
					`先看价格：上涨 $${SCENARIO.move}，Delta 带来 ${signedPrice(scenario.delta)}，Gamma 带来 ${signedPrice(scenario.gamma)}。`,
				],
				state: { ...SCENARIO, shown: 1 },
			},
			{
				id: "rest",
				label: ["Time and IV", "时间与 IV"],
				caption: [
					`Theta over ${SCENARIO.days} days takes ${signedPrice(scenario.theta)} and the ${-SCENARIO.volPoints}-point IV drop ${signedPrice(scenario.vega)}. The sum is ${signedPrice(scenario.total)}; repricing gives ${signedPrice(scenario.repriced)}.`,
					`${SCENARIO.days} 天的 Theta 带走 ${signedPrice(scenario.theta)}，IV 下降 ${-SCENARIO.volPoints} 点带走 ${signedPrice(scenario.vega)}。合计 ${signedPrice(scenario.total)}；重新定价是 ${signedPrice(scenario.repriced)}。`,
				],
				state: { ...SCENARIO, shown: 2 },
			},
			{
				id: "position",
				label: ["Positions", "持仓"],
				caption: [
					`Scale last, with signs: your ${contracts("you")} calls lose about ${price(-scenario.total * 100 * contracts("you"), 0)}; Ben, short ${Math.abs(contracts("ben"))}, gains about ${price(scenario.total * 100 * contracts("ben"), 0)}.`,
					`最后带符号地放大：你的 ${contracts("you")} 张看涨约亏 ${price(-scenario.total * 100 * contracts("you"), 0)}；Ben 空头 ${Math.abs(contracts("ben"))} 张，约赚 ${price(scenario.total * 100 * contracts("ben"), 0)}。`,
				],
				state: { ...SCENARIO, shown: 3 },
			},
		],
		explore: {
			prompt: [
				"Change the move, the days and IV, and compare the sum with the model.",
				"改变变动、天数和 IV，比较合计与模型。",
			],
			start: (last) => last,
			task: {
				kind: "reach",
				prompt: [
					"Find a scenario in which ALFA falls but the call ends up worth more.",
					"找出一个 ALFA 下跌、看涨期权价值却上升的情景。",
				],
				reached: (e) => e.move < 0 && contributions(e).repriced > 0,
				done: [
					"A big enough IV rise outweighs a fall when little time passes: vega adds about $0.12 a point, more than delta takes for $1. Read each contribution before the total.",
					"时间流逝不多时，足够大的 IV 上升可以抵消下跌：Vega 每点约增加 $0.12，多于 Delta 因下跌 $1 减少的金额。先看每项贡献，再看合计。",
				],
			},
		},
		View: SumView,
	}),
] as const;

export function ThetaVegaRhoWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Player
			locale={locale}
			id="theta-vega-rho"
			label={[
				"Interactive lesson on theta, vega and rho",
				"Theta、Vega 与 Rho 互动课",
			]}
			film={thetaVegaRhoFilm}
			scenes={scenes}
		/>
	);
}
