import * as m from "motion/react-m";
import {
	ALFA,
	type Contract,
	type Copy,
	count,
	daysToExpiry,
	modelValue,
	OCT_100_CALL,
	oct100CallMonday,
	pick,
	signedCount,
	signedUsd,
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
const SEP_20: Contract = { expiry: "sep20", strike: 100, right: "call" };
const DAYS = daysToExpiry(OCT_100_CALL.expiry);
const SEP_DAYS = daysToExpiry(SEP_20.expiry);
const model = (contract: Contract, spot: number) =>
	modelValue(contract, Math.round(spot * 100));

/** Greeks are taught to two places, and the arithmetic uses the shown figures. */
const round2 = (value: number) => Math.round(value * 100) / 100;
const DELTA = round2(model(OCT_100_CALL, SPOT).delta);
const GAMMA = round2(model(OCT_100_CALL, SPOT).gamma);
const MOVE = 2;
const NEW_DELTA = round2(DELTA + GAMMA * MOVE);

const fixed2 = (value: number) =>
	value < 0 ? `−${Math.abs(value).toFixed(2)}` : value.toFixed(2);
const stock = (dollars: number) =>
	usd(Math.round(dollars * 100), Number.isInteger(dollars) ? 0 : 2);
const signedStock = (dollars: number) =>
	signedUsd(Math.round(dollars * 100), Number.isInteger(dollars) ? 0 : 2);
const signedPrice = (dollars: number) => signedUsd(Math.round(dollars * 100));

const X_RANGE = [88, 112] as const;
const series = (
	read: (spot: number) => number,
	from = X_RANGE[0],
	to = X_RANGE[1],
	step = 0.5,
) =>
	Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => {
		const spot = from + i * step;
		return [spot, read(spot)] as const;
	});
const chartHeight = (width: number) => (width < 520 ? 260 : 290);

// ——— Scene 1: gamma is how fast delta moves ———

type SlopeView = "delta" | "value";
type SlopeState = { spot: number; view: SlopeView };

/** The price change delta alone predicts, and with the gamma term added. */
const deltaOnly = (move: number) => DELTA * move;
const withGamma = (move: number) => DELTA * move + 0.5 * GAMMA * move * move;

function SlopeScene({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SlopeState;
	explore: SlopeState | null;
	setExplore: (next: SlopeState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const move = shown.spot - SPOT;
	const base = model(OCT_100_CALL, SPOT).price;
	const repriced = model(OCT_100_CALL, shown.spot).price;
	const estimatedDelta = DELTA + GAMMA * move;
	const deltaLines: PayoffLine[] = [
		{
			id: "delta",
			label: t(["delta, model", "Delta（模型）"]),
			points: series((spot) => model(OCT_100_CALL, spot).delta),
			tone: "position",
			dashed: true,
		},
		{
			id: "gamma",
			label: t([`slope ${fixed2(GAMMA)} per $1`, `斜率每 $1 ${fixed2(GAMMA)}`]),
			points: X_RANGE.map(
				(spot) => [spot, DELTA + GAMMA * (spot - SPOT)] as const,
			),
			tone: "reference",
		},
	];
	const valueLines: PayoffLine[] = [
		{
			id: "value",
			label: t(["value, model", "价值（模型）"]),
			points: series((spot) => model(OCT_100_CALL, spot).price),
			tone: "position",
			dashed: true,
		},
		{
			id: "delta-only",
			label: t(["delta only", "仅 Delta"]),
			points: X_RANGE.map(
				(spot) => [spot, base + deltaOnly(spot - SPOT)] as const,
			),
			tone: "reference",
		},
		{
			id: "with-gamma",
			label: t(["delta + gamma", "Delta + Gamma"]),
			points: series((spot) => base + withGamma(spot - SPOT)),
			tone: "long",
		},
	];
	const markers: PayoffMarker[] =
		shown.view === "delta"
			? [
					{ id: "from", x: SPOT, y: DELTA },
					...(move !== 0
						? [
								{
									id: "to",
									x: shown.spot,
									y: model(OCT_100_CALL, shown.spot).delta,
									label: fixed2(model(OCT_100_CALL, shown.spot).delta),
								},
							]
						: []),
				]
			: [
					{
						id: "to",
						x: shown.spot,
						y: repriced,
						label: signedPrice(repriced - base),
					},
				];
	const result: ResultItem[] =
		shown.view === "delta"
			? [
					{
						id: "gamma",
						label: t(["Gamma", "Gamma"]),
						value: fixed2(GAMMA),
						note: t(["delta change per $1", "每 $1 的 Delta 变化"]),
						evidence: "modeled",
					},
					{
						id: "delta",
						label: t([
							`Delta at ${stock(shown.spot)}`,
							`${stock(shown.spot)} 时的 Delta`,
						]),
						value: fixed2(round2(estimatedDelta)),
						note:
							move === 0
								? t(["today", "今天"])
								: t([
										`${fixed2(DELTA)} + ${fixed2(GAMMA)} × ${signedStock(move)}`,
										`${fixed2(DELTA)} + ${fixed2(GAMMA)} × ${signedStock(move)}`,
									]),
						evidence: "calculated",
					},
				]
			: [
					{
						id: "delta-only",
						label: t(["Delta only", "仅 Delta"]),
						value: signedPrice(deltaOnly(move)),
						note: t([
							`${fixed2(DELTA)} × ${signedStock(move)}`,
							`${fixed2(DELTA)} × ${signedStock(move)}`,
						]),
						evidence: "calculated",
					},
					{
						id: "with-gamma",
						label: t(["Delta + ½ gamma × move²", "Delta + ½ Gamma × 变动²"]),
						value: signedPrice(withGamma(move)),
						note: t([
							`model: ${signedPrice(repriced - base)}`,
							`模型：${signedPrice(repriced - base)}`,
						]),
						evidence: "calculated",
					},
				];
	return (
		<SceneFrame
			stage={
				<Stage
					label={
						shown.view === "delta"
							? t([
									"The Oct 18 100 call's model delta against ALFA's price, rising from near 0 to near 1, with its slope at $100",
									"10月18日 100 看涨的模型 Delta 随 ALFA 价格从接近 0 升到接近 1，并标出 $100 处的斜率",
								])
							: t([
									"The call's model value with a delta-only line and a delta-plus-gamma curve that follows it more closely",
									"看涨的模型价值，以及仅用 Delta 的直线和更贴近它的 Delta 加 Gamma 曲线",
								])
					}
					height={chartHeight}
				>
					{(width) =>
						shown.view === "delta" ? (
							<PayoffChart
								width={width}
								height={chartHeight(width)}
								xRange={X_RANGE}
								yRange={[0, 1.15]}
								xTicks={[90, 95, 100, 105, 110]}
								yTicks={[0, 0.5, 1]}
								lines={deltaLines}
								markers={markers}
								formatY={(value) => value.toFixed(1)}
								xLabel={t(["ALFA price today", "ALFA 今天的价格"])}
								title={t([
									`ALFA Oct 18 100 call · delta · ${DAYS} days left`,
									`ALFA 10月18日 100 看涨 · Delta · 剩 ${DAYS} 天`,
								])}
							/>
						) : (
							<PayoffChart
								width={width}
								height={chartHeight(width)}
								xRange={X_RANGE}
								yRange={[-2, 16]}
								xTicks={[90, 95, 100, 105, 110]}
								yTicks={[0, 4, 8, 12, 16]}
								lines={valueLines}
								markers={markers}
								formatY={(value) => usd(value * 100, 0)}
								xLabel={t(["ALFA price today", "ALFA 今天的价格"])}
								title={t([
									`ALFA Oct 18 100 call · value · ${DAYS} days left`,
									`ALFA 10月18日 100 看涨 · 价值 · 剩 ${DAYS} 天`,
								])}
							/>
						)
					}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<>
						<ChoiceField
							label={t(["Chart", "图表"])}
							value={explore.view}
							options={[
								["delta", t(["Delta", "Delta"])],
								["value", t(["Value", "价值"])],
							]}
							onChange={(view) => setExplore({ ...explore, view })}
						/>
						<RangeControl
							label={t(["ALFA price", "ALFA 价格"])}
							value={explore.spot}
							display={stock(explore.spot)}
							min={90}
							max={110}
							step={1}
							onChange={(spot) => setExplore({ ...explore, spot })}
						/>
					</>
				) : null
			}
			details={
				<p>
					{t([
						"Delta is the slope of value; gamma is the slope of delta. For a small move, new delta ≈ delta + gamma × move. The price estimate is a different calculation: delta × move + ½ × gamma × move², which bends with the curve where delta alone runs straight. Long options have positive gamma, short options negative. Both are local and model-based.",
						"Delta 是价值的斜率，Gamma 是 Delta 的斜率。小幅变动时，新 Delta ≈ Delta + Gamma × 变动。价格估计是另一种计算：Delta × 变动 + ½ × Gamma × 变动²，它会跟着曲线弯曲，而仅用 Delta 是一条直线。期权多头 Gamma 为正，空头为负。两者都是局部的、基于模型的。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: gamma moves the hedge ———

type HedgeState = { holder: "you" | "ben"; stage: 0 | 1 | 2 };

const endPosition = (holder: "you" | "ben") =>
	oct100CallMonday.trades.reduce(
		(sum, trade) =>
			sum +
			(trade.buyer === holder ? trade.quantity : 0) -
			(trade.seller === holder ? trade.quantity : 0),
		oct100CallMonday.startPositions[holder],
	);
const contracts = { you: endPosition("you"), ben: endPosition("ben") };
const optionDelta = (holder: "you" | "ben", delta: number) =>
	Math.round(contracts[holder] * delta * ALFA.multiplier);

function hedgeColumns(holder: "you" | "ben") {
	const before = optionDelta(holder, DELTA);
	const after = optionDelta(holder, NEW_DELTA);
	return [
		{ id: "before", options: before, shares: -before },
		{ id: "after", options: after, shares: -before },
		{ id: "rehedged", options: after, shares: -after },
	] as const;
}

const HEDGE_ROW = 40;

function HedgeTable({
	width,
	state,
	locale,
}: {
	width: number;
	state: HedgeState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const labelWidth = width < 520 ? 96 : 150;
	const column = (width - 8 - labelWidth) / 3;
	const columns = hedgeColumns(state.holder);
	const prefix = width < 520 ? "" : "ALFA ";
	const headers: Copy[] = [
		[`${prefix}${stock(SPOT)}`, `${prefix}${stock(SPOT)}`],
		[`${prefix}${stock(SPOT + MOVE)}`, `${prefix}${stock(SPOT + MOVE)}`],
		["rehedged", "重新对冲"],
	];
	const rows: {
		label: Copy;
		value: (c: (typeof columns)[number]) => number;
	}[] = [
		{ label: ["Calls, delta", "看涨 Delta"], value: (c) => c.options },
		{ label: ["ALFA shares", "ALFA 股票"], value: (c) => c.shares },
		{ label: ["Net", "净额"], value: (c) => c.options + c.shares },
	];
	const name =
		state.holder === "you"
			? t([
					`You · long ${contracts.you} calls`,
					`你 · 多头 ${contracts.you} 张看涨`,
				])
			: t([
					`Ben · short ${Math.abs(contracts.ben)} calls`,
					`Ben · 空头 ${Math.abs(contracts.ben)} 张看涨`,
				]);
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{name}
			</Label>
			{headers.map((header, j) => (
				<Label
					key={pick(header, "en")}
					x={labelWidth + column * (j + 0.5)}
					y={40}
					anchor="middle"
					tone={j === state.stage ? "accent" : "small"}
				>
					{t(header)}
				</Label>
			))}
			{rows.map((row, i) => {
				const y = 50 + i * (HEDGE_ROW + 6);
				const net = i === rows.length - 1;
				return (
					<g key={pick(row.label, "en")}>
						<rect
							x={4}
							y={y}
							width={width - 8}
							height={HEDGE_ROW}
							rx={8}
							className={net ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						<Label
							x={14}
							y={y + HEDGE_ROW / 2 + 4}
							tone={net ? "accent" : "small"}
						>
							{t(row.label)}
						</Label>
						{columns.map((column_, j) => {
							const visible = j <= state.stage;
							const value = row.value(column_);
							return (
								<m.g
									key={column_.id}
									initial={false}
									animate={{ opacity: visible ? 1 : 0 }}
									transition={motion.fade}
								>
									<Label
										x={labelWidth + column * (j + 0.5)}
										y={y + HEDGE_ROW / 2 + 5}
										anchor="middle"
										tone={
											net && value !== 0 ? "loss" : net ? "gain" : undefined
										}
									>
										{value === 0 ? "0" : signedCount(value)}
									</Label>
								</m.g>
							);
						})}
					</g>
				);
			})}
		</g>
	);
}

function HedgeScene({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: HedgeState;
	explore: HedgeState | null;
	setExplore: (next: HedgeState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const [, after, rehedged] = hedgeColumns(shown.holder);
	const drift = after.options + after.shares;
	const trade = rehedged.shares - after.shares;
	const result: ResultItem[] = [
		{
			id: "gamma",
			label: t(["Position gamma", "持仓 Gamma"]),
			value: t([
				`${signedCount(Math.round(contracts[shown.holder] * GAMMA * ALFA.multiplier))} per $1`,
				`${signedCount(Math.round(contracts[shown.holder] * GAMMA * ALFA.multiplier))} 股/每 $1`,
			]),
			note: t([
				`${signedCount(contracts[shown.holder])} × ${fixed2(GAMMA)} × 100`,
				`${signedCount(contracts[shown.holder])} × ${fixed2(GAMMA)} × 100`,
			]),
			evidence: "modeled",
		},
	];
	if (shown.stage >= 1)
		result.push({
			id: "drift",
			label: t(["Net after the move", "变动后的净额"]),
			value: t([`${signedCount(drift)} shares`, `${signedCount(drift)} 股`]),
			note: t([
				`delta ${fixed2(DELTA)} → ${fixed2(NEW_DELTA)}`,
				`Delta ${fixed2(DELTA)} → ${fixed2(NEW_DELTA)}`,
			]),
			tone: "loss",
			evidence: "calculated",
		});
	if (shown.stage >= 2)
		result.push({
			id: "trade",
			label: t(["To rehedge", "重新对冲"]),
			value:
				trade < 0
					? t([`sell ${count(-trade)}`, `卖出 ${count(-trade)} 股`])
					: t([`buy ${count(trade)}`, `买入 ${count(trade)} 股`]),
			note:
				trade < 0
					? t(["into the rise", "在上涨中卖出"])
					: t(["into the rise", "在上涨中买入"]),
			evidence: "calculated",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A delta hedge before and after ALFA rises $2: the calls' delta, the shares held against it and the net, then the trade that flattens it",
						"ALFA 上涨 $2 前后的 Delta 对冲：看涨的 Delta、对冲持有的股票和净额，以及让它归零的交易",
					])}
					height={50 + 3 * (HEDGE_ROW + 6)}
				>
					{(width) => (
						<HedgeTable width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<>
						<ChoiceField
							label={t(["Holder", "持有人"])}
							value={explore.holder}
							options={[
								["you", t(["You", "你"])],
								["ben", "Ben"],
							]}
							onChange={(holder) => setExplore({ ...explore, holder })}
						/>
						<ChoiceField
							label={t(["Step", "步骤"])}
							value={String(explore.stage) as "0" | "1" | "2"}
							options={[
								["0", t(["Hedged", "已对冲"])],
								["1", `+$${MOVE}`],
								["2", t(["Rehedged", "重新对冲"])],
							]}
							onChange={(value) =>
								setExplore({
									...explore,
									stage: Number(value) as HedgeState["stage"],
								})
							}
						/>
					</>
				) : null
			}
			details={
				<p>
					{t([
						"A delta hedge offsets a stated position's delta with shares. Gamma moves that delta as the stock moves, so the hedge drifts: long gamma ends up long after a rise and sells to rebalance, short gamma ends up short and buys. The trades follow from the position and the model; a single print doesn't reveal anyone's whole book.",
						"Delta 对冲用股票抵消某个给定持仓的 Delta。股价变动时 Gamma 会改变这个 Delta，于是对冲会偏离：正 Gamma 在上涨后变成净多头，需要卖出再平衡；负 Gamma 变成净空头，需要买入。这些交易来自持仓和模型；单笔成交并不能揭示任何人的全部持仓。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: near expiry, gamma gathers at the strike ———

type ExpiryState = { spot: number; near: boolean };

const gammaOf = (contract: Contract, spot: number) =>
	model(contract, spot).gamma;

function ExpiryScene({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ExpiryState;
	explore: ExpiryState | null;
	setExplore: (next: ExpiryState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const oct = gammaOf(OCT_100_CALL, shown.spot);
	const sep = gammaOf(SEP_20, shown.spot);
	const lines: PayoffLine[] = [
		{
			id: "oct",
			label: t([`Oct 18 · ${DAYS} days`, `10月18日 · ${DAYS} 天`]),
			points: series(
				(spot) => gammaOf(OCT_100_CALL, spot),
				X_RANGE[0],
				X_RANGE[1],
				0.25,
			),
			tone: "position",
			dashed: true,
		},
	];
	if (shown.near)
		lines.push({
			id: "sep",
			label: t([`Sep 20 · ${SEP_DAYS} days`, `9月20日 · ${SEP_DAYS} 天`]),
			points: series(
				(spot) => gammaOf(SEP_20, spot),
				X_RANGE[0],
				X_RANGE[1],
				0.25,
			),
			tone: "long",
			dashed: true,
		});
	const markers: PayoffMarker[] = [
		{ id: "oct", x: shown.spot, y: oct },
		...(shown.near
			? [{ id: "sep", x: shown.spot, y: sep, tone: "gain" as const }]
			: []),
	];
	const result: ResultItem[] = [
		{
			id: "oct",
			label: t([
				`Oct 18 100 at ${stock(shown.spot)}`,
				`${stock(shown.spot)} 时 10月18日 100`,
			]),
			value: fixed2(round2(oct)),
			note: t(["gamma per $1", "每 $1 的 Gamma"]),
			evidence: "modeled",
		},
	];
	if (shown.near)
		result.push({
			id: "sep",
			label: t([
				`Sep 20 100 at ${stock(shown.spot)}`,
				`${stock(shown.spot)} 时 9月20日 100`,
			]),
			value: fixed2(round2(sep)),
			note:
				sep > oct
					? t([
							`${(sep / oct).toFixed(1)}× the Oct 18`,
							`是 10月18日 的 ${(sep / oct).toFixed(1)} 倍`,
						])
					: t(["less than the Oct 18", "小于 10月18日"]),
			tone: sep > oct ? "loss" : undefined,
			evidence: "modeled",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Gamma against ALFA's price for the Oct 18 100 call and the Sep 20 100 call, which peaks higher and narrower at the strike",
						"10月18日 100 看涨与 9月20日 100 看涨的 Gamma 随 ALFA 价格变化，后者在行权价处的峰更高也更窄",
					])}
					height={chartHeight}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={chartHeight(width)}
							xRange={X_RANGE}
							yRange={[0, 0.13]}
							xTicks={[90, 95, 100, 105, 110]}
							yTicks={[0, 0.05, 0.1]}
							lines={lines}
							markers={markers}
							formatY={(value) => value.toFixed(2)}
							xLabel={t(["ALFA price today", "ALFA 今天的价格"])}
							title={t([
								"ALFA 100 calls · gamma per $1",
								"ALFA 100 看涨 · 每 $1 的 Gamma",
							])}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<RangeControl
						label={t(["ALFA price", "ALFA 价格"])}
						value={explore.spot}
						display={stock(explore.spot)}
						min={90}
						max={110}
						step={1}
						onChange={(spot) => setExplore({ ...explore, spot })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"As expiry nears, an at-the-money option's delta has to settle at 0 or 1 in less time, so its gamma piles up at the strike and thins out elsewhere. A short-dated option isn't sensitive everywhere: a few dollars from the strike its delta hardly moves. And no gamma estimate can push a call's delta past 1, however large the move.",
						"临近到期时，平值期权的 Delta 要在更短的时间里归于 0 或 1，所以它的 Gamma 堆积在行权价附近，别处则变薄。短期期权并不是处处敏感：离行权价几美元，它的 Delta 就几乎不动。而且不论变动多大，任何 Gamma 估计都不能把看涨的 Delta 推过 1。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const [hedgeBefore, hedgeAfter, hedgeFixed] = hedgeColumns("you");
const youDrift = hedgeAfter.options + hedgeAfter.shares;
const youTrade = hedgeFixed.shares - hedgeAfter.shares;
const benColumns = hedgeColumns("ben");
const benTrade = benColumns[2].shares - benColumns[1].shares;
const base = model(OCT_100_CALL, SPOT).price;
const repricedUp = model(OCT_100_CALL, SPOT + MOVE).price - base;
const sepAtStrike = gammaOf(SEP_20, SPOT);
const octAtStrike = gammaOf(OCT_100_CALL, SPOT);
const FAR = 92;

const scenes = [
	defineScene<SlopeState, SlopeState>({
		id: "slope",
		label: ["Separate the calculations", "区分计算"],
		title: ["Gamma is how fast delta moves", "Gamma 是 Delta 变化的速度"],
		predict: {
			prompt: [
				`At ALFA ${stock(SPOT)} the Oct 18 100 call has delta ${fixed2(DELTA)} and gamma ${fixed2(GAMMA)} per $1. After a $${MOVE} rise, delta is about…`,
				`ALFA ${stock(SPOT)} 时，10月18日 100 看涨的 Delta 为 ${fixed2(DELTA)}，Gamma 为每 $1 ${fixed2(GAMMA)}。上涨 $${MOVE} 后，Delta 约为……`,
			],
			choices: [
				{ id: "right", label: [fixed2(NEW_DELTA), fixed2(NEW_DELTA)] },
				{
					id: "added",
					label: [fixed2(DELTA + MOVE), fixed2(DELTA + MOVE)],
				},
				{
					id: "fixed",
					label: [
						`${fixed2(DELTA)}: delta is fixed`,
						`${fixed2(DELTA)}：Delta 不变`,
					],
				},
			],
			answer: "right",
			explain: [
				`${fixed2(DELTA)} + ${fixed2(GAMMA)} × ${MOVE} = ${fixed2(NEW_DELTA)}. The model's delta at ${stock(SPOT + MOVE)} is ${fixed2(round2(model(OCT_100_CALL, SPOT + MOVE).delta))}.`,
				`${fixed2(DELTA)} + ${fixed2(GAMMA)} × ${MOVE} = ${fixed2(NEW_DELTA)}。模型在 ${stock(SPOT + MOVE)} 的 Delta 是 ${fixed2(round2(model(OCT_100_CALL, SPOT + MOVE).delta))}。`,
			],
		},
		beats: [
			{
				id: "delta",
				label: ["Delta moves", "Delta 在动"],
				caption: [
					`Plot the call's delta against ALFA's price: near 0 far below the strike, near 1 far above, ${fixed2(DELTA)} at ${stock(SPOT)}.`,
					`把看涨的 Delta 对 ALFA 价格作图：远低于行权价时接近 0，远高于时接近 1，${stock(SPOT)} 时为 ${fixed2(DELTA)}。`,
				],
				state: { spot: SPOT, view: "delta" },
			},
			{
				id: "gamma",
				label: [`+$${MOVE}`, `+$${MOVE}`],
				caption: [
					`Gamma is that curve's slope: ${fixed2(GAMMA)} per $1. A $${MOVE} rise lifts delta to about ${fixed2(NEW_DELTA)}.`,
					`Gamma 就是这条曲线的斜率：每 $1 ${fixed2(GAMMA)}。上涨 $${MOVE} 把 Delta 抬到约 ${fixed2(NEW_DELTA)}。`,
				],
				state: { spot: SPOT + MOVE, view: "delta" },
			},
			{
				id: "price",
				label: ["The price", "价格"],
				caption: [
					`The price change is a different sum: ${fixed2(DELTA)} × ${MOVE} + ½ × ${fixed2(GAMMA)} × ${MOVE}² = ${signedPrice(withGamma(MOVE))}. The model gives ${signedPrice(repricedUp)}; delta alone says ${signedPrice(deltaOnly(MOVE))}.`,
					`价格变化是另一种算法：${fixed2(DELTA)} × ${MOVE} + ½ × ${fixed2(GAMMA)} × ${MOVE}² = ${signedPrice(withGamma(MOVE))}。模型给出 ${signedPrice(repricedUp)}；仅用 Delta 则是 ${signedPrice(deltaOnly(MOVE))}。`,
				],
				state: { spot: SPOT + MOVE, view: "value" },
			},
		],
		explore: {
			prompt: ["Move ALFA on either chart.", "在任一图表上移动 ALFA。"],
			start: () => ({ spot: 106, view: "value" }),
		},
		View: SlopeScene,
	}),
	defineScene<HedgeState, HedgeState>({
		id: "hedge",
		label: ["Replay a hedge", "回放对冲"],
		title: [
			"Gamma changes the hedge for a stated position",
			"Gamma 改变给定持仓的对冲",
		],
		predict: {
			prompt: [
				`After a $${MOVE} rise your calls' delta is ${signedCount(hedgeAfter.options)} against ${count(-hedgeAfter.shares)} shares short. To be flat again you…`,
				`上涨 $${MOVE} 后，你的看涨 Delta 为 ${signedCount(hedgeAfter.options)}，而你空头 ${count(-hedgeAfter.shares)} 股。要重新归零，你需要……`,
			],
			choices: [
				{
					id: "sell",
					label: [
						`Sell ${count(-youTrade)} more shares`,
						`再卖出 ${count(-youTrade)} 股`,
					],
				},
				{
					id: "buy",
					label: [
						`Buy ${count(-youTrade)} shares`,
						`买入 ${count(-youTrade)} 股`,
					],
				},
				{
					id: "none",
					label: ["Nothing: the hedge was set", "什么都不做：对冲已经设好"],
				},
			],
			answer: "sell",
			revealAt: 2,
			explain: [
				`Net is ${signedCount(youDrift)}: the calls gained delta. Selling ${count(-youTrade)} shares brings it back to 0. Long gamma sells into a rise.`,
				`净额为 ${signedCount(youDrift)}：看涨的 Delta 增加了。卖出 ${count(-youTrade)} 股让它回到 0。正 Gamma 在上涨中卖出。`,
			],
		},
		beats: [
			{
				id: "hedged",
				label: ["Hedged", "已对冲"],
				caption: [
					`Your ${contracts.you} calls carry ${signedCount(hedgeBefore.options)} of delta. Short ${count(-hedgeBefore.shares)} ALFA shares against them and the net is 0.`,
					`你的 ${contracts.you} 张看涨带有 ${signedCount(hedgeBefore.options)} 的 Delta。做空 ${count(-hedgeBefore.shares)} 股 ALFA 与之对冲，净额为 0。`,
				],
				state: { holder: "you", stage: 0 },
			},
			{
				id: "move",
				label: [`+$${MOVE}`, `+$${MOVE}`],
				caption: [
					`ALFA rises $${MOVE}. Delta climbs to ${fixed2(NEW_DELTA)}, the calls now carry ${signedCount(hedgeAfter.options)}, and the hedge hasn't changed: net ${signedCount(youDrift)}.`,
					`ALFA 上涨 $${MOVE}。Delta 升到 ${fixed2(NEW_DELTA)}，看涨现在带有 ${signedCount(hedgeAfter.options)}，而对冲没变：净额 ${signedCount(youDrift)}。`,
				],
				state: { holder: "you", stage: 1 },
			},
			{
				id: "rehedge",
				label: ["Rehedge", "重新对冲"],
				caption: [
					`Selling ${count(-youTrade)} more shares flattens it. Ben, short ${Math.abs(contracts.ben)} calls, has negative gamma and would buy ${count(benTrade)} instead.`,
					`再卖出 ${count(-youTrade)} 股就归零了。Ben 空头 ${Math.abs(contracts.ben)} 张看涨，Gamma 为负，他则需要买入 ${count(benTrade)} 股。`,
				],
				state: { holder: "you", stage: 2 },
			},
		],
		explore: {
			prompt: [
				"Switch holders and step through the hedge.",
				"切换持有人，逐步查看对冲。",
			],
			start: () => ({ holder: "ben", stage: 2 }),
		},
		View: HedgeScene,
	}),
	defineScene<ExpiryState, ExpiryState>({
		id: "expiry",
		label: ["Inspect sensitivity", "检查敏感度"],
		title: [
			"Near expiry, gamma gathers at the strike",
			"临近到期，Gamma 聚集在行权价",
		],
		predict: {
			prompt: [
				`At ALFA ${stock(SPOT)}, whose delta moves faster: the Sep 20 100 call (${SEP_DAYS} days) or the Oct 18 100 call (${DAYS} days)?`,
				`ALFA ${stock(SPOT)} 时，谁的 Delta 变得更快：9月20日 100 看涨（${SEP_DAYS} 天）还是 10月18日 100 看涨（${DAYS} 天）？`,
			],
			choices: [
				{
					id: "near",
					label: [
						`Sep 20: about ${Math.round(sepAtStrike / octAtStrike)} times the gamma`,
						`9月20日：Gamma 约为 ${Math.round(sepAtStrike / octAtStrike)} 倍`,
					],
				},
				{
					id: "far",
					label: [
						"Oct 18: more time, more sensitivity",
						"10月18日：时间越多越敏感",
					],
				},
				{ id: "same", label: ["The same: same strike", "一样：行权价相同"] },
			],
			answer: "near",
			revealAt: 1,
			explain: [
				`At the strike the Sep 20 call's gamma is ${fixed2(round2(sepAtStrike))} against ${fixed2(round2(octAtStrike))}. With ${SEP_DAYS} days left, its delta has to settle at 0 or 1 soon.`,
				`在行权价处，9月20日 看涨的 Gamma 是 ${fixed2(round2(sepAtStrike))}，而 10月18日 是 ${fixed2(round2(octAtStrike))}。只剩 ${SEP_DAYS} 天，它的 Delta 很快就要归于 0 或 1。`,
			],
		},
		beats: [
			{
				id: "oct",
				label: ["Oct 18", "10月18日"],
				caption: [
					`The Oct 18 100 call's gamma is a low, wide hill: about ${fixed2(round2(octAtStrike))} at the strike, still ${fixed2(round2(gammaOf(OCT_100_CALL, FAR)))} at ${stock(FAR)}.`,
					`10月18日 100 看涨的 Gamma 是一座又低又宽的山：行权价处约 ${fixed2(round2(octAtStrike))}，到 ${stock(FAR)} 仍有 ${fixed2(round2(gammaOf(OCT_100_CALL, FAR)))}。`,
				],
				state: { spot: SPOT, near: false },
			},
			{
				id: "sep",
				label: ["Sep 20", "9月20日"],
				caption: [
					`The Sep 20 100 call, ${SEP_DAYS} days out, peaks at ${fixed2(round2(sepAtStrike))} right at the strike, about ${Math.round(sepAtStrike / octAtStrike)} times as high.`,
					`还剩 ${SEP_DAYS} 天的 9月20日 100 看涨，在行权价处达到 ${fixed2(round2(sepAtStrike))}，约高 ${Math.round(sepAtStrike / octAtStrike)} 倍。`,
				],
				state: { spot: SPOT, near: true },
			},
			{
				id: "far",
				label: [stock(FAR), stock(FAR)],
				caption: [
					`At ${stock(FAR)} the order flips: the Sep 20 call's gamma is ${fixed2(round2(gammaOf(SEP_20, FAR)))}, below the Oct 18's ${fixed2(round2(gammaOf(OCT_100_CALL, FAR)))}. Short-dated sensitivity sits at the strike, not everywhere.`,
					`到 ${stock(FAR)} 顺序反过来：9月20日 看涨的 Gamma 为 ${fixed2(round2(gammaOf(SEP_20, FAR)))}，低于 10月18日 的 ${fixed2(round2(gammaOf(OCT_100_CALL, FAR)))}。短期期权的敏感度集中在行权价，而不是处处都高。`,
				],
				state: { spot: FAR, near: true },
			},
		],
		explore: {
			prompt: [
				"Move ALFA and compare the two gammas.",
				"移动 ALFA，比较两个 Gamma。",
			],
			start: () => ({ spot: 104, near: true }),
		},
		View: ExpiryScene,
	}),
] as const;

export function GammaWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="gamma"
			label={["Interactive lesson on gamma", "Gamma 互动课"]}
			scenes={scenes}
		/>
	);
}
