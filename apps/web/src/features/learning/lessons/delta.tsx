import * as m from "motion/react-m";
import {
	type Copy,
	count,
	pick,
	signedCount,
	signedUsd,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import {
	PayoffChart,
	type PayoffDrag,
	type PayoffLine,
	type PayoffMarker,
} from "../walkthrough/instruments/payoff-chart";
import { Player } from "../walkthrough/player";
import { Label, Stage, useTeachMotion } from "../walkthrough/stage";
import { wrapText } from "../walkthrough/text-measure";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame } from "../walkthrough/walkthrough";
import { deltaFilm } from "./delta-film";
import {
	CALL_DELTA,
	curve,
	DAYS,
	DEEP,
	deltaAt,
	down10,
	fixed2,
	holders,
	MISS_AT,
	MOVE,
	moveDollars,
	PUT_DELTA,
	perContract,
	positionDelta,
	price,
	type Right,
	rightName,
	SPOT,
	signedPrice,
	signedStock,
	stock,
	tangent,
	up1,
	up10,
	valueAt,
	X_RANGE,
} from "./delta-model";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

const chartHeight = (width: number) => (width < 520 ? 260 : 290);

function ValueChart({
	width,
	lines,
	markers,
	drag,
	locale,
}: {
	width: number;
	lines: PayoffLine[];
	markers: PayoffMarker[];
	drag?: PayoffDrag;
	locale: Locale;
}) {
	const t = tr(locale);
	return (
		<PayoffChart
			width={width}
			height={chartHeight(width)}
			xRange={X_RANGE}
			yRange={[-2, 16]}
			xTicks={[90, 95, 100, 105, 110]}
			yTicks={[0, 4, 8, 12, 16]}
			lines={lines}
			markers={markers}
			drag={drag}
			formatY={(value) => usd(value * 100, 0)}
			xLabel={t(["ALFA price today", "ALFA 今天的价格"])}
			title={t([
				`ALFA Oct 18 100 · model value today · ${DAYS} days left`,
				`ALFA 10月18日 100 · 今天的模型价值 · 剩 ${DAYS} 天`,
			])}
		/>
	);
}

// ——— Scene 1: delta is a local slope ———

type SlopeState = { right: Right; spot: number; slope: boolean };

function SlopeView({
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
	const value = valueAt(shown.right, shown.spot);
	const delta = deltaAt(shown.right, shown.spot);
	const lines: PayoffLine[] = [
		{
			id: "value",
			label: t([
				`${pick(rightName(shown.right), "en")} value, model`,
				`${pick(rightName(shown.right), "zh")}价值（模型）`,
			]),
			points: curve(shown.right),
			tone: "position",
			dashed: true,
		},
	];
	if (shown.slope)
		lines.push({
			id: "slope",
			label: t([`slope ${fixed2(delta)}`, `斜率 ${fixed2(delta)}`]),
			points: tangent(shown.right, shown.spot),
			tone: "reference",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The model value of ALFA's Oct 18 100 option against ALFA's price, with the straight line that touches the curve at today's price",
						"ALFA 10月18日 100 期权的模型价值随 ALFA 价格变化的曲线，以及在今天价格处与曲线相切的直线",
					])}
					height={chartHeight}
				>
					{(width) => (
						<ValueChart
							width={width}
							locale={locale}
							lines={lines}
							markers={[
								{
									id: "now",
									x: shown.spot,
									y: value,
									label: price(value),
								},
							]}
							drag={
								explore
									? {
											markerId: "now",
											min: 90,
											max: 110,
											step: 1,
											onChange: (spot) => setExplore({ ...explore, spot }),
										}
									: undefined
							}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "value",
					label: t([
						`${pick(rightName(shown.right), "en")} at ALFA ${stock(shown.spot)}`,
						`ALFA ${stock(shown.spot)} 时的${pick(rightName(shown.right), "zh")}`,
					]),
					value: price(value),
					tween: { to: value, format: price },
					note: t(["per share, model", "每股，模型"]),
					evidence: "modeled",
				},
				{
					id: "delta",
					label: t(["Delta", "Delta"]),
					value: shown.slope ? fixed2(delta) : "—",
					tween: shown.slope ? { to: delta, format: fixed2 } : undefined,
					note: shown.slope
						? t([
								`${signedPrice(delta)} per +$1 in ALFA`,
								`ALFA 每 +$1 变动 ${signedPrice(delta)}`,
							])
						: t(["the slope at this price", "这个价格处的斜率"]),
					evidence: "modeled",
				},
			]}
			controls={
				explore ? (
					<>
						<ChoiceField
							label={t(["Option", "期权"])}
							value={explore.right}
							options={[
								["call", t(["Call", "看涨"])],
								["put", t(["Put", "看跌"])],
							]}
							onChange={(right) => setExplore({ ...explore, right })}
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
						"Delta is the slope of the option's value against the stock price at one point, holding time and volatility fixed: about how much the option moves per share for a small $1 move. Calls have positive delta and puts negative. The slope changes along the curve, so a delta belongs to a price, a date and a volatility. It is a model sensitivity, not a forecast or a probability.",
						"Delta 是在时间和波动率不变时，期权价值对股价曲线在某一点的斜率：股价小幅变动 $1 时，期权每股大约变动多少。看涨的 Delta 为正，看跌为负。斜率沿曲线变化，所以一个 Delta 属于某个价格、某个日期和某个波动率。它是模型敏感度，不是预测，也不是概率。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: sign and multiplier make a position ———

type ExposureState = { rows: 1 | 2 | 3 | 4 };

const exposureRows: readonly {
	label: Copy;
	cell: (contracts: number) => string;
}[] = [
	{
		label: ["Delta, per share", "Delta，每股"],
		cell: () => fixed2(CALL_DELTA),
	},
	{
		label: ["× 100 shares per contract", "× 每张 100 股"],
		cell: () => String(perContract),
	},
	{
		label: ["× contracts held, signed", "× 持有张数（带符号）"],
		cell: (contracts) => signedCount(positionDelta(contracts)),
	},
	{
		label: [
			`If ALFA rises $${MOVE.toFixed(2)}`,
			`若 ALFA 上涨 $${MOVE.toFixed(2)}`,
		],
		cell: (contracts) => `≈ ${signedUsd(moveDollars(contracts), 0)}`,
	},
];

function exposureLayout(width: number, locale: Locale) {
	const labelWidth = width < 520 ? 130 : 200;
	let y = 44;
	const rows = exposureRows.map((row) => {
		const lines = wrapText(pick(row.label, locale), labelWidth - 12, 11);
		const height = Math.max(34, lines.length * 14 + 16);
		const block = { row, lines, y, height };
		y += height + 6;
		return block;
	});
	return { labelWidth, rows, height: y };
}

function ExposureTable({
	width,
	state,
	locale,
}: {
	width: number;
	state: ExposureState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const layout = exposureLayout(width, locale);
	const column = (width - 8 - layout.labelWidth) / holders.length;
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t(["Oct 18 100 call · end of Monday", "10月18日 100 看涨 · 周一收盘"])}
			</Label>
			{holders.map((holder, j) => (
				<Label
					key={holder.id}
					x={layout.labelWidth + column * (j + 0.5)}
					y={36}
					anchor="middle"
					tone="small"
				>
					{`${t(holder.name)} · ${signedCount(holder.contracts)}`}
				</Label>
			))}
			{layout.rows.map((block, i) => {
				const visible = i < state.rows;
				const current = i === state.rows - 1;
				return (
					<m.g
						key={pick(block.row.label, "en")}
						initial={false}
						animate={{ opacity: visible ? 1 : 0.25 }}
						transition={motion.fade}
					>
						<rect
							x={4}
							y={block.y}
							width={width - 8}
							height={block.height}
							rx={8}
							className={current ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						{block.lines.map((line, k) => (
							<Label
								key={line}
								x={14}
								y={
									block.y +
									block.height / 2 +
									4 +
									(k - (block.lines.length - 1) / 2) * 14
								}
								tone="small"
							>
								{line}
							</Label>
						))}
						{holders.map((holder, j) => {
							const text = visible ? block.row.cell(holder.contracts) : "—";
							const negative = holder.contracts < 0 && i >= 2;
							return (
								<Label
									key={holder.id}
									x={layout.labelWidth + column * (j + 0.5)}
									y={block.y + block.height / 2 + 5}
									anchor="middle"
									tone={
										visible && i >= 2 ? (negative ? "loss" : "gain") : undefined
									}
								>
									{text}
								</Label>
							);
						})}
					</m.g>
				);
			})}
		</g>
	);
}

function ExposureView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ExposureState;
	explore: ExposureState | null;
	setExplore: (next: ExposureState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const [you, ben] = holders;
	const result: ResultItem[] = [
		{
			id: "per",
			label: t(["Per contract", "每张"]),
			value:
				shown.rows >= 2
					? t([`${perContract} shares`, `${perContract} 股`])
					: "—",
			note: t([
				`delta ${fixed2(CALL_DELTA)} × 100`,
				`Delta ${fixed2(CALL_DELTA)} × 100`,
			]),
			evidence: "modeled",
		},
	];
	if (shown.rows >= 3)
		result.push(
			{
				id: "you",
				label: t([
					`You, long ${you.contracts}`,
					`你，多头 ${you.contracts} 张`,
				]),
				value: t([
					`${signedCount(positionDelta(you.contracts))} shares`,
					`${signedCount(positionDelta(you.contracts))} 股`,
				]),
				note:
					shown.rows >= 4
						? t([
								`≈ ${signedUsd(moveDollars(you.contracts), 0)} if ALFA +$${MOVE.toFixed(2)}`,
								`ALFA +$${MOVE.toFixed(2)} 时约 ${signedUsd(moveDollars(you.contracts), 0)}`,
							])
						: t(["share-equivalent", "股票等价"]),
				tone: "gain",
				evidence: "modeled",
			},
			{
				id: "ben",
				label: t([
					`Ben, short ${Math.abs(ben.contracts)}`,
					`Ben，空头 ${Math.abs(ben.contracts)} 张`,
				]),
				value: t([
					`${signedCount(positionDelta(ben.contracts))} shares`,
					`${signedCount(positionDelta(ben.contracts))} 股`,
				]),
				note:
					shown.rows >= 4
						? t([
								`≈ ${signedUsd(moveDollars(ben.contracts), 0)} if ALFA +$${MOVE.toFixed(2)}`,
								`ALFA +$${MOVE.toFixed(2)} 时约 ${signedUsd(moveDollars(ben.contracts), 0)}`,
							])
						: t(["same option, opposite sign", "同一期权，符号相反"]),
				tone: "loss",
				evidence: "modeled",
			},
		);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The call's delta carried through the contract multiplier and each holder's signed position into share-equivalent exposure and an estimated dollar change",
						"看涨期权的 Delta 经过合约乘数和每位持有人带符号的持仓，变成股票等价敞口和估计的金额变化",
					])}
					height={(width) => exposureLayout(width, locale).height}
				>
					{(width) => (
						<ExposureTable width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Steps", "步骤"])}
						value={String(explore.rows) as "1" | "2" | "3" | "4"}
						options={[
							["1", "1"],
							["2", "2"],
							["3", "3"],
							["4", "4"],
						]}
						onChange={(value) =>
							setExplore({ rows: Number(value) as ExposureState["rows"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Delta is quoted per share. Multiply once by the 100 shares per contract and once by the signed number of contracts to get position delta, in shares of ALFA the position moves like. Long calls are positive; shorting the same calls flips the sign. Multiply by a small price move for an estimated dollar change, before gamma, time, volatility and fees. Flow tables that weight trades by delta may use their own sign conventions; read how they're built.",
						"Delta 按每股报价。乘一次每张 100 股，再乘一次带符号的合约张数，得到持仓 Delta，即这个持仓的波动相当于多少股 ALFA。看涨多头为正；做空同样的看涨，符号就翻转。再乘以一个小的价格变动，得到估计的金额变化，此时还没算 Gamma、时间、波动率和费用。按 Delta 加权的成交流表格可能有自己的符号约定，要先看清它是怎么构建的。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: one slope can't describe every move ———

type LimitState = { move: number };

function LimitView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: LimitState;
	explore: LimitState | null;
	setExplore: (next: LimitState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const base = valueAt("call", SPOT);
	const at = SPOT + shown.move;
	const estimate = base + CALL_DELTA * shown.move;
	const repriced = valueAt("call", at);
	const gap = repriced - estimate;
	const lines: PayoffLine[] = [
		// Unlabelled here: scene 1 named both lines, and the moving markers carry the reading.
		{
			id: "value",
			label: "",
			points: curve("call"),
			tone: "position",
			dashed: true,
		},
		{
			id: "slope",
			label: "",
			points: tangent("call", SPOT),
			tone: "reference",
		},
	];
	const markers: PayoffMarker[] = [
		{ id: "estimate", x: at, y: estimate },
		{
			id: "repriced",
			x: at,
			y: repriced,
			label: signedPrice(repriced - base),
			tone: repriced >= base ? "gain" : "loss",
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The call's model value curve and its tangent at $100, with the delta-only estimate and the repriced value after a move",
						"看涨期权的模型价值曲线及其在 $100 处的切线，并标出变动后仅用 Delta 的估计与重新定价的价值",
					])}
					height={chartHeight}
				>
					{(width) => (
						<ValueChart
							width={width}
							locale={locale}
							lines={lines}
							markers={markers}
							drag={
								explore
									? {
											markerId: "repriced",
											min: SPOT - 12,
											max: SPOT + 12,
											step: 1,
											onChange: (x) => setExplore({ move: x - SPOT }),
										}
									: undefined
							}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "estimate",
					label: t(["Delta-only estimate", "仅用 Delta 的估计"]),
					value: signedPrice(CALL_DELTA * shown.move),
					tween: { to: CALL_DELTA * shown.move, format: signedPrice },
					note: t([
						`${fixed2(CALL_DELTA)} × ${signedStock(shown.move)}`,
						`${fixed2(CALL_DELTA)} × ${signedStock(shown.move)}`,
					]),
					evidence: "calculated",
				},
				{
					id: "repriced",
					label: t(["Model repriced", "模型重新定价"]),
					value: signedPrice(repriced - base),
					tween: { to: repriced - base, format: signedPrice },
					note: t([`at ALFA ${stock(at)}`, `ALFA ${stock(at)} 时`]),
					evidence: "modeled",
				},
				{
					id: "gap",
					label: t(["Missed by delta", "Delta 漏掉的"]),
					value: signedPrice(gap),
					tween: { to: gap, format: signedPrice },
					note:
						Math.abs(gap) < 0.05
							? t(["small for a small move", "小变动时很小"])
							: t(["the curve bends away", "曲线弯离了直线"]),
					tone: Math.abs(gap) < 0.05 ? undefined : "loss",
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<RangeControl
						label={t(["ALFA moves", "ALFA 变动"])}
						value={explore.move}
						display={signedStock(explore.move)}
						min={-12}
						max={12}
						step={1}
						onChange={(move) => setExplore({ move })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Delta is the slope at today's price. As ALFA rises the call's delta climbs toward 1, and as it falls delta shrinks toward 0, so the value curve bends above its tangent on both sides. A delta-only estimate is fine for small moves, too low after a big rise and too harsh after a big fall. The bend is gamma, the next lesson. Time and volatility move the value too.",
						"Delta 是今天价格处的斜率。ALFA 上涨时看涨的 Delta 向 1 攀升，下跌时向 0 缩小，所以价值曲线在两侧都向切线上方弯。仅用 Delta 的估计对小变动没问题，大涨后偏低，大跌后又偏悲观。这种弯曲就是下一课的 Gamma。时间和波动率同样会改变价值。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const [you, ben] = holders;

const scenes = [
	defineScene<SlopeState, SlopeState>({
		id: "slope",
		label: ["Move the underlying", "移动标的"],
		title: ["Delta is a local price slope", "Delta 是局部价格斜率"],
		predict: {
			prompt: [
				`ALFA is at ${stock(SPOT)}. If it rises $1, about how much does the Oct 18 100 call's model value rise?`,
				`ALFA 现价 ${stock(SPOT)}。如果它上涨 $1，10月18日 100 看涨的模型价值大约上涨多少？`,
			],
			choices: [
				{
					id: "delta",
					label: [`About ${price(CALL_DELTA)}`, `约 ${price(CALL_DELTA)}`],
				},
				{ id: "full", label: ["$1.00, like the stock", "$1.00，和股票一样"] },
				{
					id: "none",
					label: ["Nothing until it's in the money", "在价内之前不会变"],
				},
			],
			answer: "delta",
			entry: {
				answer: Math.round(CALL_DELTA * 100) / 100,
				tolerance: 0.03,
				prefix: "$",
			},
			explain: [
				`The slope at ${stock(SPOT)} is ${fixed2(CALL_DELTA)}, so +$1 in ALFA adds about ${price(CALL_DELTA)}. The model gives ${price(up1)}.`,
				`${stock(SPOT)} 处的斜率是 ${fixed2(CALL_DELTA)}，所以 ALFA 涨 $1 约增加 ${price(CALL_DELTA)}。模型结果是 ${price(up1)}。`,
			],
		},
		beats: [
			{
				id: "curve",
				label: ["The curve", "曲线"],
				caption: [
					`With ALFA at ${stock(SPOT)} and ${DAYS} days left, the model values the Oct 18 100 call at ${price(valueAt("call", SPOT))} a share.`,
					`ALFA 为 ${stock(SPOT)}、还剩 ${DAYS} 天时，模型给 10月18日 100 看涨的价值是每股 ${price(valueAt("call", SPOT))}。`,
				],
				state: { right: "call", spot: SPOT, slope: false },
			},
			{
				id: "slope",
				label: ["The slope", "斜率"],
				caption: [
					`The line touching the curve at ${stock(SPOT)} has slope ${fixed2(CALL_DELTA)}: about ${price(CALL_DELTA)} per share for each $1 ALFA moves. That slope is delta.`,
					`在 ${stock(SPOT)} 处与曲线相切的直线斜率是 ${fixed2(CALL_DELTA)}：ALFA 每变动 $1，每股约变动 ${price(CALL_DELTA)}。这个斜率就是 Delta。`,
				],
				state: { right: "call", spot: SPOT, slope: true },
			},
			{
				id: "put",
				label: ["The put", "看跌"],
				caption: [
					`The Oct 18 100 put slopes the other way: delta ${fixed2(PUT_DELTA)}. A $1 rise takes about ${price(Math.abs(PUT_DELTA))} off it.`,
					`10月18日 100 看跌的斜率方向相反：Delta ${fixed2(PUT_DELTA)}。ALFA 涨 $1，它约减少 ${price(Math.abs(PUT_DELTA))}。`,
				],
				state: { right: "put", spot: SPOT, slope: true },
			},
		],
		explore: {
			prompt: [
				"Drag across the chart to move ALFA and watch the slope change along the curve.",
				"在图上左右拖动来移动 ALFA，观察斜率如何沿曲线变化。",
			],
			start: () => ({ right: "call", spot: 106, slope: true }),
			task: {
				kind: "reach",
				prompt: [
					"Find the lowest price at which the call's delta passes 0.80.",
					"找出看涨期权 Delta 超过 0.80 的最低价格。",
				],
				reached: (e) => e.right === "call" && e.spot === DEEP,
				done: [
					`At ${stock(DEEP)} the call is deep enough in the money to move more than $0.80 for each $1 in ALFA. The deeper it goes, the more it moves like the stock itself.`,
					`在 ${stock(DEEP)} 时，看涨期权已足够深度实值，ALFA 每动 $1，它就动 $0.80 以上。越深度实值，它越像股票本身。`,
				],
			},
		},
		View: SlopeView,
	}),
	defineScene<ExposureState, ExposureState>({
		id: "exposure",
		label: ["Build position exposure", "计算持仓敞口"],
		title: ["Keep the sign and multiplier attached", "保留符号与乘数"],
		predict: {
			prompt: [
				`You hold ${you.contracts} of these calls, delta ${fixed2(CALL_DELTA)}. Your position moves like how many ALFA shares?`,
				`你持有 ${you.contracts} 张这种看涨，Delta ${fixed2(CALL_DELTA)}。你的持仓相当于多少股 ALFA？`,
			],
			choices: [
				{
					id: "right",
					label: [
						`About ${count(positionDelta(you.contracts))}`,
						`约 ${count(positionDelta(you.contracts))} 股`,
					],
				},
				{
					id: "no-multiplier",
					label: [
						`About ${Math.round(you.contracts * CALL_DELTA)}`,
						`约 ${Math.round(you.contracts * CALL_DELTA)} 股`,
					],
				},
				{
					id: "contracts",
					label: [`${you.contracts}`, `${you.contracts} 股`],
				},
			],
			answer: "right",
			entry: {
				answer: positionDelta(you.contracts),
				tolerance: 10,
				unit: [" shares", " 股"],
			},
			revealAt: 2,
			explain: [
				`${fixed2(CALL_DELTA)} per share × 100 shares × ${you.contracts} contracts = ${signedCount(positionDelta(you.contracts))} shares. Ben, short ${Math.abs(ben.contracts)}, is ${signedCount(positionDelta(ben.contracts))}.`,
				`每股 ${fixed2(CALL_DELTA)} × 100 股 × ${you.contracts} 张 = ${signedCount(positionDelta(you.contracts))} 股。Ben 空头 ${Math.abs(ben.contracts)} 张，是 ${signedCount(positionDelta(ben.contracts))} 股。`,
			],
		},
		beats: [
			{
				id: "per-share",
				label: ["Per share", "每股"],
				caption: [
					`Delta is quoted per share: ${fixed2(CALL_DELTA)} for the Oct 18 100 call. After Monday you hold ${you.contracts} contracts; Ben is short ${Math.abs(ben.contracts)}.`,
					`Delta 按每股报价：10月18日 100 看涨为 ${fixed2(CALL_DELTA)}。周一之后你持有 ${you.contracts} 张，Ben 空头 ${Math.abs(ben.contracts)} 张。`,
				],
				state: { rows: 1 },
			},
			{
				id: "per-contract",
				label: ["Per contract", "每张"],
				caption: [
					`Each contract covers 100 shares: ${perContract} share-equivalents per contract. Multiply by 100 once.`,
					`每张合约对应 100 股：每张相当于 ${perContract} 股。只乘一次 100。`,
				],
				state: { rows: 2 },
			},
			{
				id: "position",
				label: ["Position", "持仓"],
				caption: [
					`Then by signed contracts: your ${signedCount(you.contracts)} gives ${signedCount(positionDelta(you.contracts))} shares; Ben's ${signedCount(ben.contracts)} gives ${signedCount(positionDelta(ben.contracts))}. Same option, opposite signs.`,
					`再乘带符号的张数：你的 ${signedCount(you.contracts)} 张得到 ${signedCount(positionDelta(you.contracts))} 股；Ben 的 ${signedCount(ben.contracts)} 张得到 ${signedCount(positionDelta(ben.contracts))} 股。同一期权，符号相反。`,
				],
				state: { rows: 3 },
			},
			{
				id: "dollars",
				label: ["Dollars", "金额"],
				caption: [
					`A $${MOVE.toFixed(2)} rise in ALFA is then about ${signedUsd(moveDollars(you.contracts), 0)} for you and ${signedUsd(moveDollars(ben.contracts), 0)} for Ben, before anything else moves.`,
					`ALFA 上涨 $${MOVE.toFixed(2)}，你约 ${signedUsd(moveDollars(you.contracts), 0)}，Ben 约 ${signedUsd(moveDollars(ben.contracts), 0)}，前提是其他因素不变。`,
				],
				state: { rows: 4 },
			},
		],
		explore: {
			prompt: ["Step through the chain.", "逐步查看这条计算链。"],
			start: () => ({ rows: 4 }),
			task: {
				kind: "answer",
				prompt: [
					"Ben is short 10 of these calls. If ALFA rises $0.40, about how much does his position change?",
					"Ben 卖空了 10 张这种看涨期权。如果 ALFA 上涨 $0.40，他的持仓大约变化多少？",
				],
				choices: [
					{
						id: "ben",
						label: [
							signedUsd(moveDollars(ben.contracts), 0),
							signedUsd(moveDollars(ben.contracts), 0),
						],
					},
					{
						id: "flip",
						label: [
							signedUsd(-moveDollars(ben.contracts), 0),
							signedUsd(-moveDollars(ben.contracts), 0),
						],
					},
					{
						id: "share",
						label: [
							signedUsd(moveDollars(ben.contracts) / 10, 2),
							signedUsd(moveDollars(ben.contracts) / 10, 2),
						],
					},
				],
				answer: "ben",
				done: [
					`Short 10 is ${signedCount(positionDelta(ben.contracts))} share-equivalents, so a $0.40 rise costs about ${signedUsd(moveDollars(ben.contracts), 0)}. Same option, opposite sign: the position decides it.`,
					`空头 10 张是 ${signedCount(positionDelta(ben.contracts))} 股等价，所以上涨 $0.40 约亏 ${signedUsd(moveDollars(ben.contracts), 0)}。同一期权，符号相反：由持仓决定。`,
				],
			},
		},
		View: ExposureView,
	}),
	defineScene<LimitState, LimitState>({
		id: "limits",
		label: ["Test the limits", "检验局限"],
		title: ["One slope can't describe every move", "一个斜率不能描述所有变动"],
		predict: {
			prompt: [
				`ALFA jumps $10. Delta alone says the call gains ${price(CALL_DELTA * 10)} a share. What does the model say?`,
				`ALFA 大涨 $10。仅用 Delta 估计，看涨每股涨 ${price(CALL_DELTA * 10)}。模型怎么说？`,
			],
			choices: [
				{
					id: "more",
					label: [`More: about ${price(up10)}`, `更多：约 ${price(up10)}`],
				},
				{
					id: "same",
					label: [
						`Exactly ${price(CALL_DELTA * 10)}`,
						`正好 ${price(CALL_DELTA * 10)}`,
					],
				},
				{ id: "less", label: ["Less", "更少"] },
			],
			answer: "more",
			revealAt: 1,
			explain: [
				`As ALFA rises the slope steepens, so the curve pulls above the straight line: ${signedPrice(up10)} against ${signedPrice(CALL_DELTA * 10)}.`,
				`ALFA 上涨时斜率变陡，曲线升到直线上方：${signedPrice(up10)}，而直线给出 ${signedPrice(CALL_DELTA * 10)}。`,
			],
		},
		beats: [
			{
				id: "small",
				label: ["+$1", "+$1"],
				caption: [
					`For a $1 move the line and the curve agree: ${signedPrice(CALL_DELTA)} estimated, ${signedPrice(up1)} repriced.`,
					`变动 $1 时，直线和曲线几乎一致：估计 ${signedPrice(CALL_DELTA)}，重新定价 ${signedPrice(up1)}。`,
				],
				state: { move: 1 },
			},
			{
				id: "up",
				label: ["+$10", "+$10"],
				caption: [
					`After +$10 the curve has pulled above the line: ${signedPrice(up10)} repriced against ${signedPrice(CALL_DELTA * 10)} from delta alone.`,
					`上涨 $10 后，曲线已升到直线上方：重新定价 ${signedPrice(up10)}，而仅用 Delta 是 ${signedPrice(CALL_DELTA * 10)}。`,
				],
				state: { move: 10 },
			},
			{
				id: "down",
				label: ["−$10", "−$10"],
				caption: [
					`After −$10 the line even goes below zero, which no option can. The model loses ${price(Math.abs(down10))}, not ${price(CALL_DELTA * 10)}.`,
					`下跌 $10 后，直线甚至跌到零以下，而期权不可能为负。模型亏损 ${price(Math.abs(down10))}，而不是 ${price(CALL_DELTA * 10)}。`,
				],
				state: { move: -10 },
			},
		],
		explore: {
			prompt: [
				"Drag across the chart to move ALFA and compare the line with the curve.",
				"在图上左右拖动来移动 ALFA，比较直线与曲线。",
			],
			start: () => ({ move: 5 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the smallest rise at which delta alone misses the model's price change by more than $1.",
					"找出仅用 Delta 的估计与模型价格变化相差超过 $1 的最小涨幅。",
				],
				reached: (e) => e.move === MISS_AT,
				done: [
					`Up to about $${MISS_AT - 1} the straight line stays within $1 of the curve; at +$${MISS_AT} the curve has pulled away by more. Delta describes small moves; for big ones, reprice.`,
					`涨幅在约 $${MISS_AT - 1} 以内，直线与曲线相差不到 $1；到 +$${MISS_AT} 时差距超过 $1。Delta 描述的是小幅变动；大幅变动要重新定价。`,
				],
			},
		},
		View: LimitView,
	}),
] as const;

export function DeltaWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Player
			locale={locale}
			id="delta"
			label={["Interactive lesson on delta", "Delta 互动课"]}
			film={deltaFilm}
			scenes={scenes}
		/>
	);
}
