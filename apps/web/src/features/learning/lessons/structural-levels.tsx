import * as m from "motion/react-m";
import {
	ALFA,
	ALFA_ATR_14,
	type Copy,
	count,
	daysToExpiry,
	gammaExposure,
	modelValue,
	modelVolatility,
	oct18OpenInterest,
	pick,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import {
	type PayoffBand,
	PayoffChart,
	type PayoffLine,
	type PayoffMarker,
} from "../walkthrough/instruments/payoff-chart";
import { Label, Stage, useTeachMotion } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

const SPOT = ALFA.open / 100;
const STRIKES = oct18OpenInterest.map((row) => row.strike);
const stock = (dollars: number) =>
	usd(Math.round(dollars * 100), Number.isInteger(dollars) ? 0 : 2);
const gammaAt = (strike: number) =>
	Math.round(
		modelValue({ expiry: "oct18", strike, right: "call" }).gamma * 10_000,
	) / 10_000;

type Side = "call" | "put";
type Metric = "oi" | "gex";

/** Open interest, or gamma exposure in dollars per 1% move, by strike and side. */
const metricAt = (metric: Metric, strike: number, side: Side) => {
	const row = oct18OpenInterest.find((entry) => entry.strike === strike);
	if (!row) return 0;
	return metric === "oi"
		? row[side]
		: Math.abs(gammaExposure(gammaAt(strike), row[side], SPOT, 1));
};
const wallOf = (metric: Metric, side: Side) =>
	STRIKES.reduce((best, strike) =>
		metricAt(metric, strike, side) > metricAt(metric, best, side)
			? strike
			: best,
	);
const metricText = (metric: Metric, value: number) =>
	metric === "oi" ? count(value) : `$${Math.round(value / 1000)}k`;

// ——— Scene 1: the rule picks the wall ———

type WallState = { metric: Metric; walls: boolean };

const MIRROR_TOP = 40;
const MIRROR_BOTTOM = 236;
const mirrorHeight = MIRROR_BOTTOM + 24;

function MirrorBars({
	width,
	state,
	locale,
}: {
	width: number;
	state: WallState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const left = 44;
	const right = width - 8;
	const slot = (right - left) / STRIKES.length;
	const barWidth = Math.min(slot * 0.55, 28);
	const zero = (MIRROR_TOP + MIRROR_BOTTOM) / 2;
	const reach = zero - MIRROR_TOP - 16;
	const max = Math.max(
		...STRIKES.flatMap((strike) => [
			metricAt(state.metric, strike, "call"),
			metricAt(state.metric, strike, "put"),
		]),
	);
	const callWall = wallOf(state.metric, "call");
	const putWall = wallOf(state.metric, "put");
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{state.metric === "oi"
					? t([
							"ALFA Oct 18 · open interest by strike",
							"ALFA 10月18日 · 各行权价未平仓量",
						])
					: t([
							"ALFA Oct 18 · |GEX| by strike, $ per 1%",
							"ALFA 10月18日 · 各行权价 |GEX|，每 1% 美元",
						])}
			</Label>
			<Label x={left - 6} y={MIRROR_TOP + 10} anchor="end" tone="small">
				{t(["calls", "看涨"])}
			</Label>
			<Label x={left - 6} y={MIRROR_BOTTOM - 2} anchor="end" tone="small">
				{t(["puts", "看跌"])}
			</Label>
			<path d={`M${left} ${zero}H${right}`} className="wt-axis" />
			{STRIKES.map((strike, i) => {
				const cx = left + slot * (i + 0.5);
				return (
					<g key={strike}>
						{(["call", "put"] as const).map((side) => {
							const value = metricAt(state.metric, strike, side);
							const h = (value / max) * reach;
							const isWall =
								state.walls &&
								strike === (side === "call" ? callWall : putWall);
							return (
								<g key={side}>
									<m.rect
										x={cx - barWidth / 2}
										width={barWidth}
										rx={3}
										className={
											isWall
												? "wt-chip"
												: side === "call"
													? "wt-long-soft"
													: "wt-short-soft"
										}
										initial={false}
										animate={{
											y: side === "call" ? zero - h : zero,
											height: Math.max(h, 1),
										}}
										transition={motion.move}
									/>
									{isWall ? (
										<Label
											x={cx}
											y={side === "call" ? zero - h - 6 : zero + h + 14}
											anchor="middle"
											tone="accent"
										>
											{metricText(state.metric, value)}
										</Label>
									) : null}
								</g>
							);
						})}
						<Label x={cx} y={MIRROR_BOTTOM + 16} anchor="middle" tone="small">
							{strike}
						</Label>
					</g>
				);
			})}
		</g>
	);
}

function WallView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: WallState;
	explore: WallState | null;
	setExplore: (next: WallState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const rule =
		shown.metric === "oi"
			? t(["most open interest", "未平仓量最多"])
			: t(["most gamma exposure", "Gamma 敞口最大"]);
	const result: ResultItem[] = [
		{
			id: "rule",
			label: t(["Rule", "规则"]),
			value: rule,
			note: t(["Oct 18 only · Friday's close", "仅 10月18日 · 周五收盘"]),
		},
	];
	if (shown.walls)
		result.push(
			{
				id: "call",
				label: t(["Call wall", "看涨墙"]),
				value: stock(wallOf(shown.metric, "call")),
				evidence: shown.metric === "oi" ? "observed" : "modeled",
			},
			{
				id: "put",
				label: t(["Put wall", "看跌墙"]),
				value: stock(wallOf(shown.metric, "put")),
				evidence: shown.metric === "oi" ? "observed" : "modeled",
			},
		);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"ALFA's Oct 18 calls above the axis and puts below, sized by open interest or by gamma exposure, with the largest strike on each side marked as its wall",
						"ALFA 10月18日 的看涨在轴上方、看跌在下方，按未平仓量或 Gamma 敞口定大小，每侧最大的行权价标为墙",
					])}
					height={mirrorHeight}
				>
					{(width) => (
						<MirrorBars width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Wall rule", "墙的规则"])}
						value={explore.metric}
						options={[
							["oi", t(["Open interest", "未平仓量"])],
							["gex", t(["Gamma exposure", "Gamma 敞口"])],
						]}
						onChange={(metric) => setExplore({ metric, walls: true })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A 'wall' is whichever strike a stated rule picks: the most open interest, the most gamma exposure, one expiry or all of them, as of a given close. Gamma weighting favours strikes near the current price, so the put wall moves from $90 by open interest to $95 by gamma. Report the rule, the scope and the date with the level; a wall is a concentration, not a barrier.",
						"“墙”是某条规则选出的行权价：未平仓量最多、Gamma 敞口最大、一个到期日还是全部到期日、截至哪个收盘。Gamma 加权偏向靠近现价的行权价，所以看跌墙按未平仓量是 $90，按 Gamma 则移到 $95。报告位置时要一并写明规则、范围和日期；墙是一种集中，不是一道屏障。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: the payout minimum ———

type PainState = { stage: 0 | 1 | 2 };

/** What Oct 18 holders would collect at expiry, in dollars, if ALFA settled at `settle`. */
const payout = (settle: number, side?: Side) =>
	oct18OpenInterest.reduce(
		(sum, row) =>
			sum +
			(side !== "put" ? row.call * Math.max(settle - row.strike, 0) * 100 : 0) +
			(side !== "call" ? row.put * Math.max(row.strike - settle, 0) * 100 : 0),
		0,
	);
const CANDIDATES = Array.from({ length: 36 }, (_, i) => 85 + i);
const MAX_PAIN = CANDIDATES.reduce((best, settle) =>
	payout(settle) < payout(best) ? settle : best,
);
/** The model's one-standard-deviation range for ALFA at Oct 18, from its at-the-money IV. */
const ONE_SD =
	SPOT * modelVolatility("oct18", 100) * Math.sqrt(daysToExpiry("oct18") / 365);

const millions = (dollars: number) => `$${(dollars / 1_000_000).toFixed(2)}M`;

function PainView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: PainState;
	explore: PainState | null;
	setExplore: (next: PainState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const lines: PayoffLine[] = [
		{
			id: "calls",
			label: t(["paid to calls", "付给看涨"]),
			points: CANDIDATES.map(
				(settle) => [settle, payout(settle, "call") / 1_000_000] as const,
			),
			tone: "long",
		},
		{
			id: "puts",
			label: t(["paid to puts", "付给看跌"]),
			points: CANDIDATES.map(
				(settle) => [settle, payout(settle, "put") / 1_000_000] as const,
			),
			tone: "short",
		},
	];
	if (shown.stage >= 1)
		lines.push({
			id: "total",
			label: t(["total", "合计"]),
			points: CANDIDATES.map(
				(settle) => [settle, payout(settle) / 1_000_000] as const,
			),
			tone: "position",
		});
	const markers: PayoffMarker[] =
		shown.stage >= 1
			? [
					{
						id: "min",
						x: MAX_PAIN,
						y: payout(MAX_PAIN) / 1_000_000,
						label: t([
							`minimum ${stock(MAX_PAIN)}`,
							`最小值 ${stock(MAX_PAIN)}`,
						]),
					},
				]
			: [];
	const bands: PayoffBand[] =
		shown.stage >= 2
			? [
					{
						id: "range",
						from: SPOT - ONE_SD,
						to: SPOT + ONE_SD,
						label: t(["model ±1 SD at Oct 18", "模型 10月18日 ±1 标准差"]),
						tone: "neutral",
					},
				]
			: [];
	const result: ResultItem[] = [
		{
			id: "calls",
			label: t([`Paid at ${stock(SPOT + 10)}`, `${stock(SPOT + 10)} 时支付`]),
			value: millions(payout(SPOT + 10)),
			note: t(["mostly to calls", "大部分付给看涨"]),
			evidence: "calculated",
		},
	];
	if (shown.stage >= 1)
		result.push({
			id: "pain",
			label: t(["Payout minimum", "支付最小值"]),
			value: stock(MAX_PAIN),
			note: t([
				`${millions(payout(MAX_PAIN))} paid there`,
				`在那里支付 ${millions(payout(MAX_PAIN))}`,
			]),
			evidence: "calculated",
		});
	if (shown.stage >= 2)
		result.push({
			id: "range",
			label: t(["Model range at Oct 18", "模型 10月18日 的范围"]),
			value: `${stock(Math.round(SPOT - ONE_SD))}–${stock(Math.round(SPOT + ONE_SD))}`,
			note: t(["±1 standard deviation", "±1 个标准差"]),
			evidence: "modeled",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"What ALFA's Oct 18 option holders would be paid at each possible settlement price, by calls and puts and in total, with the minimum marked",
						"ALFA 10月18日 期权持有人在各个可能的结算价下会获得的支付：看涨、看跌与合计，并标出最小值",
					])}
					height={(width) => (width < 520 ? 260 : 290)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 260 : 290}
							xRange={[85, 120]}
							yRange={[0, 9]}
							xTicks={[85, 90, 95, 100, 105, 110, 115, 120]}
							yTicks={[0, 3, 6, 9]}
							lines={lines}
							markers={markers}
							bands={bands}
							formatY={(value) => (value === 0 ? "$0" : `$${value}M`)}
							xLabel={t(["ALFA settlement, Oct 18", "ALFA 10月18日 结算价"])}
							title={t([
								"Oct 18 open interest · paid to holders at expiry",
								"10月18日 未平仓量 · 到期时付给持有人",
							])}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Show", "显示"])}
						value={String(explore.stage) as "0" | "1" | "2"}
						options={[
							["0", t(["Each side", "两侧"])],
							["1", t(["+ Minimum", "+ 最小值"])],
							["2", t(["+ Range", "+ 范围"])],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as PainState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"'Max pain' is the settlement price, from a chosen set of candidates, that minimizes what option holders would collect at expiry, given today's open interest. It uses only open interest and strikes: no gamma, no flows, no information about who holds what or whether they'll hold to expiry. Here it equals today's price, which is a feature of this chain, not a pull toward $100.",
						"“最大痛点”是在一组候选价格中，使期权持有人在到期时获得的支付最少的结算价，依据的是今天的未平仓量。它只用未平仓量和行权价：没有 Gamma，没有成交流，也不知道谁持有什么、会不会持有到期。这里它恰好等于今天的价格，这是这条期权链的特征，而不是向 $100 的拉力。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: one level, three units ———

type DistanceState = { unit: "dollars" | "percent" | "atr" };

const PUT_WALL = wallOf("gex", "put");
const CALL_WALL = wallOf("gex", "call");
const distanceText = (level: number, unit: DistanceState["unit"]) => {
	const dollars = level - SPOT;
	const sign = dollars < 0 ? "−" : "+";
	if (unit === "dollars") return `${sign}$${Math.abs(dollars)}`;
	if (unit === "percent")
		return `${sign}${Math.abs((dollars / SPOT) * 100).toFixed(1)}%`;
	return `${sign}${Math.abs(dollars / ALFA_ATR_14).toFixed(1)} ATR`;
};

function DistanceRuler({
	width,
	state,
	locale,
}: {
	width: number;
	state: DistanceState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const left = 20;
	const right = width - 20;
	const from = 92;
	const to = 112;
	const x = (price: number) =>
		left + ((price - from) / (to - from)) * (right - left);
	const axisY = 110;
	const unitStep =
		state.unit === "atr" ? ALFA_ATR_14 : state.unit === "percent" ? 1 : 1;
	const ticks: number[] = [];
	for (
		let k = Math.ceil((from - SPOT) / unitStep);
		SPOT + k * unitStep <= to;
		k++
	)
		ticks.push(SPOT + k * unitStep);
	const levels = [
		{ id: "put", price: PUT_WALL, label: t(["put wall", "看跌墙"]) },
		{ id: "call", price: CALL_WALL, label: t(["call wall", "看涨墙"]) },
	];
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t(["Distance from ALFA $100", "距 ALFA $100 的距离"])}
			</Label>
			<path d={`M${left} ${axisY}H${right}`} className="wt-axis" />
			{ticks.map((tick) => (
				<m.path
					key={`${state.unit}-${tick.toFixed(2)}`}
					d={`M${x(tick)} ${axisY - 5}V${axisY + 5}`}
					className="wt-axis"
					initial={motion.enabled ? { opacity: 0 } : false}
					animate={{ opacity: 1 }}
					transition={motion.fade}
				/>
			))}
			<path
				d={`M${x(SPOT)} ${axisY - 44}V${axisY + 8}`}
				className="wt-bracket"
			/>
			<Label x={x(SPOT)} y={axisY - 50} anchor="middle" tone="accent">
				{`ALFA ${stock(SPOT)}`}
			</Label>
			{levels.map((level) => (
				<g key={level.id}>
					<path
						d={`M${x(level.price)} ${axisY - 18}V${axisY + 18}`}
						className="wt-bracket"
					/>
					<Label x={x(level.price)} y={axisY + 34} anchor="middle" tone="small">
						{`${level.label} ${stock(level.price)}`}
					</Label>
					<path
						d={`M${x(SPOT)} ${axisY - 24}H${x(level.price)}`}
						className="wt-grid"
						strokeDasharray="3 3"
					/>
					<Label
						x={(x(SPOT) + x(level.price)) / 2}
						y={axisY - 28}
						anchor="middle"
						tone="accent"
						className="wt-halo"
					>
						{distanceText(level.price, state.unit)}
					</Label>
				</g>
			))}
			<Label x={right} y={axisY + 58} anchor="end" tone="small">
				{state.unit === "atr"
					? t([
							`one tick = 1 ATR = $${ALFA_ATR_14.toFixed(2)}`,
							`每格 = 1 ATR = $${ALFA_ATR_14.toFixed(2)}`,
						])
					: state.unit === "percent"
						? t(["one tick = 1% = $1", "每格 = 1% = $1"])
						: t(["one tick = $1", "每格 = $1"])}
			</Label>
		</g>
	);
}

function DistanceView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: DistanceState;
	explore: DistanceState | null;
	setExplore: (next: DistanceState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] = [
		{
			id: "put",
			label: t([
				`To the put wall ${stock(PUT_WALL)}`,
				`到看跌墙 ${stock(PUT_WALL)}`,
			]),
			value: distanceText(PUT_WALL, shown.unit),
			evidence: "calculated",
		},
		{
			id: "call",
			label: t([
				`To the call wall ${stock(CALL_WALL)}`,
				`到看涨墙 ${stock(CALL_WALL)}`,
			]),
			value: distanceText(CALL_WALL, shown.unit),
			evidence: "calculated",
		},
	];
	if (shown.unit === "atr")
		result.push({
			id: "atr",
			label: t(["ATR, 14 sessions", "ATR，14 个交易日"]),
			value: `$${ALFA_ATR_14.toFixed(2)}`,
			note: t([
				"a typical day's range, not a direction",
				"典型一天的波幅，不是方向",
			]),
			evidence: "observed",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A price line from $92 to $112 with ALFA at $100 and the put and call walls marked, measuring each distance in dollars, percent or average true ranges",
						"一条从 $92 到 $112 的价格线，标出 ALFA $100 以及看跌墙和看涨墙，用美元、百分比或平均真实波幅测量各自的距离",
					])}
					height={184}
				>
					{(width) => (
						<DistanceRuler width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Unit", "单位"])}
						value={explore.unit}
						options={[
							["dollars", t(["Dollars", "美元"])],
							["percent", t(["Percent", "百分比"])],
							["atr", "ATR"],
						]}
						onChange={(unit) => setExplore({ unit })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"The same level can be $5, 5% or three typical days away. Dollars depend on the price scale, percent on the reference price, and ATR on a window of past ranges; ATR describes how much ALFA has tended to move in a day, not which way. Say which unit and which reference with every distance, and adjust history for splits before comparing across time.",
						"同一个位置可以是 $5、5% 或三个典型交易日的距离。美元取决于价格尺度，百分比取决于参考价格，ATR 取决于一段过去波幅的窗口；ATR 描述 ALFA 一天通常波动多少，而不是方向。每个距离都要说明单位和参考，跨时间比较之前还要按拆股等调整历史数据。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const putWallOi = wallOf("oi", "put");
const putWallGex = wallOf("gex", "put");

const scenes = [
	defineScene<WallState, WallState>({
		id: "walls",
		label: ["Choose the level rule", "选择位置规则"],
		title: ["The rule and scope choose the wall", "规则与范围决定墙的位置"],
		predict: {
			prompt: [
				"Which strike is ALFA's Oct 18 put wall?",
				"ALFA 10月18日 的看跌墙是哪个行权价？",
			],
			choices: [
				{
					id: "depends",
					label: [
						`It depends on the rule: ${stock(putWallOi)} or ${stock(putWallGex)}`,
						`取决于规则：${stock(putWallOi)} 或 ${stock(putWallGex)}`,
					],
				},
				{
					id: "oi",
					label: [
						`${stock(putWallOi)}: the most puts`,
						`${stock(putWallOi)}：看跌最多`,
					],
				},
				{
					id: "atm",
					label: [`${stock(SPOT)}: at the money`, `${stock(SPOT)}：平值`],
				},
			],
			answer: "depends",
			revealAt: 2,
			explain: [
				`By open interest it's ${stock(putWallOi)}; weighted by gamma, which is larger nearer the money, it's ${stock(putWallGex)}. The call wall is ${stock(wallOf("oi", "call"))} either way.`,
				`按未平仓量是 ${stock(putWallOi)}；按 Gamma 加权（越接近平值越大）则是 ${stock(putWallGex)}。看涨墙两种规则下都是 ${stock(wallOf("oi", "call"))}。`,
			],
		},
		beats: [
			{
				id: "oi",
				label: ["Open interest", "未平仓量"],
				caption: [
					"ALFA's Oct 18 open interest at Friday's close: calls above the line, puts below.",
					"ALFA 10月18日 周五收盘的未平仓量：看涨在线上方，看跌在下方。",
				],
				state: { metric: "oi", walls: false },
			},
			{
				id: "oi-walls",
				label: ["By open interest", "按未平仓量"],
				caption: [
					`Pick the strike with the most contracts: call wall ${stock(wallOf("oi", "call"))}, put wall ${stock(putWallOi)}.`,
					`选合约最多的行权价：看涨墙 ${stock(wallOf("oi", "call"))}，看跌墙 ${stock(putWallOi)}。`,
				],
				state: { metric: "oi", walls: true },
			},
			{
				id: "gex-walls",
				label: ["By gamma", "按 Gamma"],
				caption: [
					`Weight by gamma exposure instead and the put wall moves to ${stock(putWallGex)}: fewer contracts, but nearer the money.`,
					`改按 Gamma 敞口加权，看跌墙移到 ${stock(putWallGex)}：合约更少，但更接近平值。`,
				],
				state: { metric: "gex", walls: true },
			},
		],
		explore: {
			prompt: ["Switch the wall rule.", "切换墙的规则。"],
			start: () => ({ metric: "gex", walls: true }),
			task: {
				kind: "answer",
				prompt: [
					"Switch the rule. Which wall stays where it is?",
					"切换规则。哪个墙位保持不变？",
				],
				choices: [
					{ id: "call", label: ["The call wall", "看涨墙"] },
					{ id: "put", label: ["The put wall", "看跌墙"] },
					{ id: "neither", label: ["Neither", "都不是"] },
				],
				answer: "call",
				done: [
					`The call wall is ${stock(wallOf("oi", "call"))} by either rule; the put wall moves from ${stock(putWallOi)} by open interest to ${stock(putWallGex)} by gamma. Name the rule with every wall.`,
					`看涨墙按两种规则都在 ${stock(wallOf("oi", "call"))}；看跌墙按未平仓量在 ${stock(putWallOi)}，按 Gamma 在 ${stock(putWallGex)}。每个墙位都要说明规则。`,
				],
			},
		},
		View: WallView,
	}),
	defineScene<PainState, PainState>({
		id: "pain",
		label: ["Explore payout minima", "探索支付最小值"],
		title: [
			"A payout minimum is not a settlement forecast",
			"支付最小值不是结算预测",
		],
		predict: {
			prompt: [
				`Payouts to Oct 18 holders are smallest if ALFA settles at ${stock(MAX_PAIN)}. Where will ALFA settle?`,
				`如果 ALFA 结算在 ${stock(MAX_PAIN)}，付给 10月18日 持有人的金额最少。ALFA 会结算在哪里？`,
			],
			choices: [
				{
					id: "unknown",
					label: [
						"Unknown: it's a payout minimum, not a forecast",
						"未知：这是支付最小值，不是预测",
					],
				},
				{ id: "pain", label: [stock(MAX_PAIN), stock(MAX_PAIN)] },
				{
					id: "wall",
					label: [
						`${stock(CALL_WALL)}: the call wall`,
						`${stock(CALL_WALL)}：看涨墙`,
					],
				},
			],
			answer: "unknown",
			revealAt: 2,
			explain: [
				`The minimum only says where today's open interest would pay least. The model's one-standard-deviation range for Oct 18 runs from about ${stock(Math.round(SPOT - ONE_SD))} to ${stock(Math.round(SPOT + ONE_SD))}.`,
				`最小值只说明今天的未平仓量在哪里支付最少。模型给出的 10月18日 ±1 个标准差范围大约是 ${stock(Math.round(SPOT - ONE_SD))} 到 ${stock(Math.round(SPOT + ONE_SD))}。`,
			],
		},
		beats: [
			{
				id: "sides",
				label: ["Each side", "两侧"],
				caption: [
					"For each settlement price, what Oct 18 holders would collect: puts pay below their strikes, calls above.",
					"对每个结算价，10月18日 持有人会获得多少：看跌在行权价以下支付，看涨在以上支付。",
				],
				state: { stage: 0 },
			},
			{
				id: "minimum",
				label: ["Minimum", "最小值"],
				caption: [
					`Add them: the total is smallest at ${stock(MAX_PAIN)}, ${millions(payout(MAX_PAIN))}. That strike is 'max pain'.`,
					`把它们相加：合计在 ${stock(MAX_PAIN)} 最小，为 ${millions(payout(MAX_PAIN))}。这个行权价就是“最大痛点”。`,
				],
				state: { stage: 1 },
			},
			{
				id: "range",
				label: ["Not a forecast", "不是预测"],
				caption: [
					`It's a property of today's open interest. The model puts a one-standard-deviation range of ${stock(Math.round(SPOT - ONE_SD))} to ${stock(Math.round(SPOT + ONE_SD))} on Oct 18, and holders can close or open positions before then.`,
					`这是今天未平仓量的一个性质。模型给出 10月18日 ±1 个标准差的范围为 ${stock(Math.round(SPOT - ONE_SD))} 到 ${stock(Math.round(SPOT + ONE_SD))}，而且持有人在此之前还可以平仓或开仓。`,
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: ["Step through the payouts.", "逐步查看支付。"],
			start: () => ({ stage: 2 }),
			task: {
				kind: "answer",
				prompt: [
					"What could move the payout minimum before Oct 18?",
					"10月18日 之前，什么会改变赔付最小值的位置？",
				],
				choices: [
					{
						id: "positions",
						label: ["Positions opening or closing", "持仓的开立或平仓"],
					},
					{ id: "price", label: ["ALFA's price moving", "ALFA 价格变动"] },
					{
						id: "fixed",
						label: [
							"Nothing: it's set for the expiry",
							"什么都不会：它已为到期日固定",
						],
					},
				],
				answer: "positions",
				done: [
					"The minimum is computed from today's open interest at every settlement price, so ALFA's price doesn't move it. New or closed positions change the open interest, and with it the minimum.",
					"最小值是用今天的未平仓量在每个结算价上算出来的，所以 ALFA 的价格不会改变它。新开或平掉的持仓会改变未平仓量，最小值也随之改变。",
				],
			},
		},
		View: PainView,
	}),
	defineScene<DistanceState, DistanceState>({
		id: "distance",
		label: ["Measure the distance", "测量距离"],
		title: ["One level, three distance units", "同一位置，三种距离单位"],
		predict: {
			prompt: [
				`The ${stock(PUT_WALL)} put wall is $${SPOT - PUT_WALL} below ALFA. With a 14-session ATR of $${ALFA_ATR_14.toFixed(2)}, how far is that?`,
				`${stock(PUT_WALL)} 的看跌墙在 ALFA 下方 $${SPOT - PUT_WALL}。14 个交易日的 ATR 为 $${ALFA_ATR_14.toFixed(2)}，这相当于多远？`,
			],
			choices: [
				{
					id: "atr",
					label: [
						`About ${((SPOT - PUT_WALL) / ALFA_ATR_14).toFixed(1)} ATRs`,
						`约 ${((SPOT - PUT_WALL) / ALFA_ATR_14).toFixed(1)} 个 ATR`,
					],
				},
				{
					id: "five",
					label: [`${SPOT - PUT_WALL} ATRs`, `${SPOT - PUT_WALL} 个 ATR`],
				},
				{
					id: "percent",
					label: [
						`${SPOT - PUT_WALL}%: the same thing`,
						`${SPOT - PUT_WALL}%：是同一回事`,
					],
				},
			],
			answer: "atr",
			entry: {
				answer: Math.round(((SPOT - PUT_WALL) / ALFA_ATR_14) * 10) / 10,
				tolerance: 0.15,
				unit: [" ATRs", " 个 ATR"],
			},
			revealAt: 2,
			explain: [
				`$${SPOT - PUT_WALL} ÷ $${ALFA_ATR_14.toFixed(2)} ≈ ${((SPOT - PUT_WALL) / ALFA_ATR_14).toFixed(1)} typical daily ranges. As a percent of $${SPOT} it's ${SPOT - PUT_WALL}%; three numbers, one distance.`,
				`$${SPOT - PUT_WALL} ÷ $${ALFA_ATR_14.toFixed(2)} ≈ ${((SPOT - PUT_WALL) / ALFA_ATR_14).toFixed(1)} 个典型日波幅。按 $${SPOT} 的百分比是 ${SPOT - PUT_WALL}%；三个数字，同一个距离。`,
			],
		},
		beats: [
			{
				id: "dollars",
				label: ["Dollars", "美元"],
				caption: [
					`From ALFA's $${SPOT}: the put wall is ${distanceText(PUT_WALL, "dollars")}, the call wall ${distanceText(CALL_WALL, "dollars")}.`,
					`从 ALFA 的 $${SPOT} 算起：看跌墙 ${distanceText(PUT_WALL, "dollars")}，看涨墙 ${distanceText(CALL_WALL, "dollars")}。`,
				],
				state: { unit: "dollars" },
			},
			{
				id: "percent",
				label: ["Percent", "百分比"],
				caption: [
					`As a percent of the $${SPOT} reference: ${distanceText(PUT_WALL, "percent")} and ${distanceText(CALL_WALL, "percent")}.`,
					`按 $${SPOT} 参考价的百分比：${distanceText(PUT_WALL, "percent")} 和 ${distanceText(CALL_WALL, "percent")}。`,
				],
				state: { unit: "percent" },
			},
			{
				id: "atr",
				label: ["ATR", "ATR"],
				caption: [
					`In typical daily ranges (ATR $${ALFA_ATR_14.toFixed(2)}): ${distanceText(PUT_WALL, "atr")} and ${distanceText(CALL_WALL, "atr")}. A measure of size, not of direction.`,
					`按典型日波幅（ATR $${ALFA_ATR_14.toFixed(2)}）：${distanceText(PUT_WALL, "atr")} 和 ${distanceText(CALL_WALL, "atr")}。这是大小的度量，不是方向。`,
				],
				state: { unit: "atr" },
			},
		],
		explore: {
			prompt: ["Switch the distance unit.", "切换距离单位。"],
			start: () => ({ unit: "atr" }),
			task: {
				kind: "answer",
				prompt: [
					"In ATRs, how does the call wall's distance compare with the put wall's?",
					"以 ATR 衡量，看涨墙的距离与看跌墙相比如何？",
				],
				choices: [
					{ id: "double", label: ["About twice as far", "大约远一倍"] },
					{ id: "same", label: ["About the same", "差不多"] },
					{ id: "half", label: ["About half as far", "大约一半"] },
				],
				answer: "double",
				done: [
					`${distanceText(CALL_WALL, "atr")} against ${distanceText(PUT_WALL, "atr")}: twice the distance. ATR measures how far in typical days; it says nothing about which way ALFA will go.`,
					`${distanceText(CALL_WALL, "atr")} 对比 ${distanceText(PUT_WALL, "atr")}：距离是两倍。ATR 衡量的是隔了多少个典型交易日的波动，不说明 ALFA 会往哪个方向走。`,
				],
			},
		},
		View: DistanceView,
	}),
] as const;

export function StructuralLevelsWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="structural-levels"
			label={["Interactive lesson on walls and max pain", "墙与最大痛点互动课"]}
			scenes={scenes}
		/>
	);
}
