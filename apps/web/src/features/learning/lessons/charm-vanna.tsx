import * as m from "motion/react-m";
import {
	ALFA,
	type Copy,
	count,
	daysToExpiry,
	modelVolatility,
	oct105BlockLegs,
	pick,
	priceOption,
	signedCount,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import {
	PayoffChart,
	type PayoffLine,
	type PayoffMarker,
} from "../walkthrough/instruments/payoff-chart";
import { Label, Stage, useTeachMotion } from "../walkthrough/stage";
import { wrapText } from "../walkthrough/text-measure";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

const SPOT = ALFA.open / 100;
const DAYS = daysToExpiry("oct18");
const WEEK = 7;
const VOL_DROP = 3;
/** Model delta of an Oct 18 call, to three places: the small changes here need them. */
const delta = (strike: number, elapsed = 0, volPoints = 0) =>
	Math.round(
		priceOption({
			spot: SPOT,
			strike,
			days: DAYS - elapsed,
			iv: modelVolatility("oct18", strike) + volPoints / 100,
			right: "call",
		}).delta * 1000,
	) / 1000;
const fixed3 = (value: number) =>
	`${value < 0 ? "−" : value > 0 ? "+" : ""}${Math.abs(value).toFixed(3)}`;
const plain3 = (value: number) => value.toFixed(3);

const STRIKE = 110;
const TODAY = delta(STRIKE);
const AFTER_WEEK = delta(STRIKE, WEEK);
const AFTER_BOTH = delta(STRIKE, WEEK, -VOL_DROP);
const CHARM_DAY = delta(STRIKE, 1) - TODAY;
const VANNA_POINT = Math.round((delta(STRIKE, 0, 1) - TODAY) * 10_000) / 10_000;

// ——— Scene 1: delta moves with no trade ———

type DriftState = { elapsed: number; volDrop: boolean };

function DriftView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: DriftState;
	explore: DriftState | null;
	setExplore: (next: DriftState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const now = delta(STRIKE, shown.elapsed, shown.volDrop ? -VOL_DROP : 0);
	const path = (volPoints: number) =>
		Array.from(
			{ length: 29 },
			(_, day) => [day, delta(STRIKE, day, volPoints)] as const,
		);
	const lines: PayoffLine[] = [
		{
			id: "same",
			label: "",
			points: path(0),
			tone: "position",
			dashed: true,
		},
	];
	if (shown.volDrop)
		lines.push({
			id: "drop",
			label: "",
			points: path(-VOL_DROP),
			tone: "short",
			dashed: true,
		});
	const markers: PayoffMarker[] = [
		{
			id: "today",
			x: 0,
			y: TODAY,
			label: shown.elapsed === 0 ? plain3(TODAY) : undefined,
		},
		...(shown.elapsed > 0
			? [
					{
						id: "now",
						x: shown.elapsed,
						y: now,
						label: plain3(now),
						tone: "loss" as const,
					},
				]
			: []),
	];
	const result: ResultItem[] = [
		{
			id: "today",
			label: t([
				`Oct 18 ${STRIKE} call, today`,
				`10月18日 ${STRIKE} 看涨，今天`,
			]),
			value: plain3(TODAY),
			note: t([`delta · ALFA $${SPOT}`, `Delta · ALFA $${SPOT}`]),
			evidence: "modeled",
		},
	];
	if (shown.elapsed > 0)
		result.push({
			id: "now",
			label: t([`After ${shown.elapsed} days`, `${shown.elapsed} 天后`]),
			value: plain3(now),
			note: t([
				`${fixed3(now - TODAY)} with no trade${shown.volDrop ? ` · IV −${VOL_DROP}` : ""}`,
				`${fixed3(now - TODAY)}，没有成交${shown.volDrop ? ` · IV −${VOL_DROP}` : ""}`,
			]),
			tone: "loss",
			evidence: "modeled",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The Oct 18 110 call's model delta as days pass with ALFA held at $100, with and without a three-point fall in implied volatility",
						"ALFA 保持 $100 时，10月18日 110 看涨的模型 Delta 随天数的变化，分别在隐含波动率不变和下降三个点的情况下",
					])}
					height={(width) => (width < 520 ? 250 : 280)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 250 : 280}
							xRange={[0, 28]}
							yRange={[0, 0.2]}
							xTicks={[0, 7, 14, 21, 28]}
							yTicks={[0, 0.1, 0.2]}
							lines={lines}
							markers={markers}
							formatX={(day) =>
								day === 0
									? t(["Sep 16", "9月16日"])
									: t([`+${day}d`, `+${day}天`])
							}
							formatY={(value) => value.toFixed(2)}
							xLabel={t([
								`days passed · ALFA held at $${SPOT}`,
								`经过天数 · ALFA 保持 $${SPOT}`,
							])}
							title={t([
								`ALFA Oct 18 ${STRIKE} call · delta`,
								`ALFA 10月18日 ${STRIKE} 看涨 · Delta`,
							])}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["IV", "IV"])}
						value={explore.volDrop ? "drop" : "same"}
						options={[
							["same", t(["Unchanged", "不变"])],
							["drop", t([`−${VOL_DROP} points`, `−${VOL_DROP} 点`])],
						]}
						onChange={(value) =>
							setExplore({ ...explore, volDrop: value === "drop" })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Charm is how delta changes as time passes, with price and volatility held still; vanna is how it changes with implied volatility. For an out-of-the-money call both push the same way here: less time and less volatility make $110 less reachable, so delta falls. Nothing traded, yet anyone hedging this call's delta would have to adjust.",
						"Charm 是价格和波动率不变时，Delta 随时间流逝的变化；Vanna 是 Delta 随隐含波动率的变化。对价外看涨来说，这里两者方向相同：时间更少、波动率更低，$110 更难到达，所以 Delta 下降。没有任何成交，但对这张看涨做 Delta 对冲的人都必须调整。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: read the convention ———

type UnitState = { shown: 1 | 2 | 3 };

const unitRows: readonly { label: Copy; value: string; note: Copy }[] = [
	{
		label: ["Charm, per day passed", "Charm，每经过一天"],
		value: fixed3(CHARM_DAY),
		note: [
			"delta per calendar day that elapses",
			"每经过一个自然日的 Delta 变化",
		],
	},
	{
		label: ["Charm, per year of time left", "Charm，每一年剩余期限"],
		value: `${-CHARM_DAY * 365 > 0 ? "+" : "−"}${Math.abs(CHARM_DAY * 365).toFixed(2)}`,
		note: [
			"the same event: time left shrinks as days pass, so the sign flips",
			"同一件事：日子过去，剩余期限变短，所以符号相反",
		],
	},
	{
		label: ["Vanna, per vol point", "Vanna，每个波动率点"],
		value: fixed3(VANNA_POINT),
		note: [
			`or ${fixed3(VANNA_POINT * 100).replace(/0$/, "")} per 1.00 of volatility`,
			`或每 1.00 的波动率 ${fixed3(VANNA_POINT * 100).replace(/0$/, "")}`,
		],
	},
];

function unitLayout(width: number, locale: Locale) {
	let y = 30;
	const rows = unitRows.map((row) => {
		const note = wrapText(pick(row.note, locale), width - 40, 11);
		const height = 46 + note.length * 14;
		const block = { row, note, y, height };
		y += height + 6;
		return block;
	});
	return { rows, height: y };
}

function UnitTable({
	width,
	state,
	asking,
	locale,
}: {
	width: number;
	state: UnitState;
	/** While the learner predicts, the per-year quote is given and the per-day change is the question. */
	asking: boolean;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const layout = unitLayout(width, locale);
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t([
					`Oct 18 ${STRIKE} call · one sensitivity, several quotes`,
					`10月18日 ${STRIKE} 看涨 · 同一敏感度，多种报法`,
				])}
			</Label>
			{layout.rows.map((block, i) => (
				<m.g
					key={pick(block.row.label, "en")}
					initial={false}
					animate={{ opacity: (asking ? i <= 1 : i < state.shown) ? 1 : 0.2 }}
					transition={motion.fade}
				>
					<rect
						x={4}
						y={block.y}
						width={width - 8}
						height={block.height}
						rx={9}
						className={
							i === state.shown - 1 ? "wt-focus-shape" : "wt-panel-shape"
						}
					/>
					<Label x={16} y={block.y + 20} tone="small">
						{t(block.row.label)}
					</Label>
					<Label x={width - 16} y={block.y + 21} anchor="end" tone="strong">
						{asking
							? i === 0
								? "?"
								: i === 1
									? block.row.value
									: "—"
							: i < state.shown
								? block.row.value
								: "—"}
					</Label>
					{block.note.map((line, k) => (
						<Label key={line} x={16} y={block.y + 40 + k * 14} tone="small">
							{line}
						</Label>
					))}
				</m.g>
			))}
		</g>
	);
}

function UnitView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: UnitState;
	explore: UnitState | null;
	setExplore: (next: UnitState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] = [
		{
			id: "day",
			label: t(["One day passes", "经过一天"]),
			value: fixed3(CHARM_DAY),
			note: t(["delta change", "Delta 变化"]),
			evidence: "modeled",
		},
	];
	if (shown.shown >= 2)
		result.push({
			id: "year",
			label: t(["Quoted per year left", "按每年剩余期限报价"]),
			value: unitRows[1].value,
			note: t(["× −1/365 gives the same day", "× −1/365 得到同一天的变化"]),
			evidence: "calculated",
		});
	if (shown.shown >= 3)
		result.push({
			id: "vanna",
			label: t([`IV −${VOL_DROP} points`, `IV −${VOL_DROP} 点`]),
			value: fixed3(VANNA_POINT * -VOL_DROP),
			note: t([
				`vanna ${fixed3(VANNA_POINT)} × −${VOL_DROP}`,
				`Vanna ${fixed3(VANNA_POINT)} × −${VOL_DROP}`,
			]),
			evidence: "calculated",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The same charm quoted per day passed and per year of time left, with opposite signs, and vanna quoted per vol point",
						"同一个 Charm 按每经过一天和每一年剩余期限报价，符号相反；以及按每个波动率点报价的 Vanna",
					])}
					height={(width) => unitLayout(width, locale).height}
				>
					{(width) => (
						<UnitTable
							width={width}
							state={shown}
							asking={phase === "predict"}
							locale={locale}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Show", "显示"])}
						value={String(explore.shown) as "1" | "2" | "3"}
						options={[
							["1", t(["Per day", "每天"])],
							["2", t(["+ Per year", "+ 每年"])],
							["3", t(["+ Vanna", "+ Vanna"])],
						]}
						onChange={(value) =>
							setExplore({ shown: Number(value) as UnitState["shown"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Before using a vendor's charm or vanna, read its units. Time can be counted as days that pass or as time remaining, which runs the other way, and scaled per day or per year. Volatility can be a percentage point or a whole unit of volatility. Multiply each sensitivity by a change in the matching unit, or the same event comes out with the wrong size or sign.",
						"使用供应商的 Charm 或 Vanna 之前，先看清单位。时间可以按经过的天数计，也可以按剩余期限计（方向相反），还可以按天或按年缩放。波动率可以按百分点，也可以按一个完整的波动率单位。每个敏感度都要乘以相同单位的变化，否则同一件事会算出错误的大小或符号。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: scale a signed position ———

type SpreadState = { stage: 0 | 1 | 2 };

const LONG = oct105BlockLegs.buy;
const SHORT = oct105BlockLegs.sell;
const positionDelta = (elapsed: number, volPoints: number) => {
	const long = Math.round(
		LONG.quantity * 100 * delta(LONG.strike, elapsed, volPoints),
	);
	const short = -Math.round(
		SHORT.quantity * 100 * delta(SHORT.strike, elapsed, volPoints),
	);
	return { long, short, net: long + short };
};
const spreadAt = (stage: SpreadState["stage"]) =>
	stage === 0
		? positionDelta(0, 0)
		: stage === 1
			? positionDelta(WEEK, 0)
			: positionDelta(WEEK, -VOL_DROP);

const SPREAD_ROW = 44;

function SpreadTable({
	width,
	state,
	locale,
}: {
	width: number;
	state: SpreadState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const today = spreadAt(0);
	const now = spreadAt(state.stage);
	const rows: { id: string; label: Copy; before: number; after: number }[] = [
		{
			id: "long",
			label: [
				`+${LONG.quantity} × ${LONG.strike} call`,
				`+${LONG.quantity} × ${LONG.strike} 看涨`,
			],
			before: today.long,
			after: now.long,
		},
		{
			id: "short",
			label: [
				`−${SHORT.quantity} × ${SHORT.strike} call`,
				`−${SHORT.quantity} × ${SHORT.strike} 看涨`,
			],
			before: today.short,
			after: now.short,
		},
		{
			id: "net",
			label: ["Spread, net", "价差，净额"],
			before: today.net,
			after: now.net,
		},
	];
	const labelWidth = width < 520 ? 124 : 210;
	const column = (width - 8 - labelWidth) / 3;
	const heads: Copy[] = [
		["today", "今天"],
		state.stage === 0
			? ["—", "—"]
			: state.stage === 1
				? [`+${WEEK} days`, `+${WEEK} 天`]
				: [`+${WEEK}d, IV −${VOL_DROP}`, `+${WEEK} 天，IV −${VOL_DROP}`],
		["change", "变化"],
	];
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t([
					"The 10:50 call spread · position delta, shares",
					"10:50 看涨价差 · 持仓 Delta（股）",
				])}
			</Label>
			{heads.map((head, j) => (
				<Label
					key={pick(head, "en") + j}
					x={labelWidth + column * (j + 0.5)}
					y={40}
					anchor="middle"
					tone="small"
				>
					{t(head)}
				</Label>
			))}
			{rows.map((row, i) => {
				const y = 48 + i * (SPREAD_ROW + 6);
				const change = row.after - row.before;
				const net = row.id === "net";
				return (
					<g key={row.id}>
						<rect
							x={4}
							y={y}
							width={width - 8}
							height={SPREAD_ROW}
							rx={8}
							className={net ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						<Label
							x={14}
							y={y + SPREAD_ROW / 2 + 4}
							tone={net ? "accent" : "small"}
						>
							{t(row.label)}
						</Label>
						<Label
							x={labelWidth + column * 0.5}
							y={y + SPREAD_ROW / 2 + 5}
							anchor="middle"
						>
							{signedCount(row.before)}
						</Label>
						<m.g
							initial={false}
							animate={{ opacity: state.stage === 0 ? 0 : 1 }}
							transition={motion.fade}
						>
							<Label
								x={labelWidth + column * 1.5}
								y={y + SPREAD_ROW / 2 + 5}
								anchor="middle"
							>
								{signedCount(row.after)}
							</Label>
							<Label
								x={labelWidth + column * 2.5}
								y={y + SPREAD_ROW / 2 + 5}
								anchor="middle"
								tone={change > 0 ? "gain" : change < 0 ? "loss" : undefined}
							>
								{signedCount(change)}
							</Label>
						</m.g>
					</g>
				);
			})}
		</g>
	);
}

function SpreadView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SpreadState;
	explore: SpreadState | null;
	setExplore: (next: SpreadState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const today = spreadAt(0);
	const now = spreadAt(shown.stage);
	const result: ResultItem[] = [
		{
			id: "today",
			label: t(["Spread delta today", "今天的价差 Delta"]),
			value: t([
				`${signedCount(today.net)} shares`,
				`${signedCount(today.net)} 股`,
			]),
			note: t([
				`${LONG.quantity} × 100 × (${plain3(delta(LONG.strike))} − ${plain3(delta(SHORT.strike))})`,
				`${LONG.quantity} × 100 × (${plain3(delta(LONG.strike))} − ${plain3(delta(SHORT.strike))})`,
			]),
			evidence: "modeled",
		},
	];
	if (shown.stage >= 1)
		result.push({
			id: "change",
			label: t(["Change, no trade", "变化，无成交"]),
			value: t([
				`${signedCount(now.net - today.net)} shares`,
				`${signedCount(now.net - today.net)} 股`,
			]),
			note:
				shown.stage === 1
					? t(["a week of charm", "一周的 Charm"])
					: t([`a week, and IV −${VOL_DROP}`, `一周，加上 IV −${VOL_DROP}`]),
			tone: "gain",
			evidence: "modeled",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Position delta of the 10:50 call spread, long 500 105 calls and short 500 110 calls, today and after a week with and without a fall in implied volatility",
						"10:50 看涨价差（多头 500 张 105 看涨、空头 500 张 110 看涨）的持仓 Delta：今天，以及一周后隐含波动率下降与否的情况",
					])}
					height={48 + 3 * (SPREAD_ROW + 6)}
				>
					{(width) => (
						<SpreadTable width={width} state={shown} locale={locale} />
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
							["0", t(["Today", "今天"])],
							["1", t(["+ A week", "+ 一周"])],
							["2", t(["+ IV drop", "+ IV 下降"])],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as SpreadState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Scale each leg's delta change by its signed quantity and 100 shares, then add. The short 110 leg's delta decays faster than the long 105 leg's, and being short turns that decay into a gain in delta, so the spread gets longer while nothing trades. None of this is observed flow; it is the model applied to a stated position.",
						"把每条腿的 Delta 变化乘以带符号的数量和 100 股，再相加。空头 110 那条腿的 Delta 比多头 105 那条腿衰减得更快，而做空把这种衰减变成了 Delta 的增加，所以在没有任何成交的情况下，价差的多头敞口变大了。这些都不是观测到的成交流，而是把模型应用到一个给定的持仓上。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const week = spreadAt(1);
const today = spreadAt(0);

const scenes = [
	defineScene<DriftState, DriftState>({
		id: "drift",
		label: ["Separate the effects", "区分影响"],
		title: [
			"Delta can change without a new trade",
			"没有新成交，Delta 也会变化",
		],
		predict: {
			prompt: [
				`ALFA stays at $${SPOT} for a week and IV doesn't change. What happens to the Oct 18 ${STRIKE} call's delta of ${plain3(TODAY)}?`,
				`ALFA 一周都停在 $${SPOT}，IV 也不变。10月18日 ${STRIKE} 看涨 ${plain3(TODAY)} 的 Delta 会怎样？`,
			],
			choices: [
				{
					id: "falls",
					label: [
						`It falls, to about ${plain3(AFTER_WEEK)}`,
						`下降，到约 ${plain3(AFTER_WEEK)}`,
					],
				},
				{ id: "same", label: ["Unchanged: nothing traded", "不变：没有成交"] },
				{ id: "rises", label: ["It rises", "上升"] },
			],
			answer: "falls",
			revealAt: 1,
			explain: [
				`With a week less to get to $${STRIKE}, the model gives ${plain3(AFTER_WEEK)}: about ${fixed3(CHARM_DAY)} a day. That's charm.`,
				`距离到达 $${STRIKE} 少了一周，模型给出 ${plain3(AFTER_WEEK)}：大约每天 ${fixed3(CHARM_DAY)}。这就是 Charm。`,
			],
		},
		beats: [
			{
				id: "today",
				label: ["Today", "今天"],
				caption: [
					`The Oct 18 ${STRIKE} call, $${STRIKE - SPOT} out of the money, has a model delta of ${plain3(TODAY)}.`,
					`10月18日 ${STRIKE} 看涨价外 $${STRIKE - SPOT}，模型 Delta 为 ${plain3(TODAY)}。`,
				],
				state: { elapsed: 0, volDrop: false },
			},
			{
				id: "week",
				label: ["A week", "一周"],
				caption: [
					`A week passes, ALFA and IV unchanged: delta ${plain3(AFTER_WEEK)}, ${fixed3(AFTER_WEEK - TODAY)} from time alone.`,
					`一周过去，ALFA 和 IV 都不变：Delta ${plain3(AFTER_WEEK)}，仅时间就带来 ${fixed3(AFTER_WEEK - TODAY)}。`,
				],
				state: { elapsed: WEEK, volDrop: false },
			},
			{
				id: "vol",
				label: [`IV −${VOL_DROP}`, `IV −${VOL_DROP}`],
				caption: [
					`If IV also falls ${VOL_DROP} points, delta is ${plain3(AFTER_BOTH)}: vanna adds another ${fixed3(AFTER_BOTH - AFTER_WEEK)}.`,
					`如果 IV 同时下降 ${VOL_DROP} 点，Delta 为 ${plain3(AFTER_BOTH)}：Vanna 又带来 ${fixed3(AFTER_BOTH - AFTER_WEEK)}。`,
				],
				state: { elapsed: WEEK, volDrop: true },
			},
		],
		explore: {
			prompt: ["Toggle the IV drop.", "切换 IV 下降。"],
			start: () => ({ elapsed: 14, volDrop: true }),
			task: {
				kind: "answer",
				prompt: [
					"Toggle the IV drop. What does falling IV do to this out-of-the-money call's delta?",
					"切换 IV 下降。IV 下降对这份虚值看涨的 Delta 有什么影响？",
				],
				choices: [
					{ id: "lower", label: ["Lowers it further", "让它进一步降低"] },
					{ id: "raise", label: ["Raises it", "让它升高"] },
					{
						id: "none",
						label: ["Nothing: no one traded", "没有影响：没人交易"],
					},
				],
				answer: "lower",
				done: [
					`With ${VOL_DROP} points less IV, the out-of-the-money call's delta falls further on top of what time took: that's vanna. Neither change needed a trade.`,
					`IV 少 ${VOL_DROP} 个点，虚值看涨的 Delta 在时间造成的下降之外进一步降低：这就是 Vanna。两种变化都不需要任何交易。`,
				],
			},
		},
		View: DriftView,
	}),
	defineScene<UnitState, UnitState>({
		id: "units",
		label: ["Read the convention", "读取约定"],
		title: ["Different units describe the same event", "不同单位描述同一件事"],
		predict: {
			prompt: [
				`A vendor lists the ${STRIKE} call's charm as ${unitRows[1].value}, per year of remaining time. Over one day that passes, delta…`,
				`某供应商把 ${STRIKE} 看涨的 Charm 列为 ${unitRows[1].value}（按每一年剩余期限）。经过一天，Delta……`,
			],
			choices: [
				{
					id: "falls",
					label: [
						`Falls by about ${Math.abs(CHARM_DAY).toFixed(3)}`,
						`下降约 ${Math.abs(CHARM_DAY).toFixed(3)}`,
					],
				},
				{
					id: "big",
					label: [
						`Rises by ${unitRows[1].value.slice(1)}`,
						`上升 ${unitRows[1].value.slice(1)}`,
					],
				},
				{
					id: "rises",
					label: [
						`Rises by about ${Math.abs(CHARM_DAY).toFixed(3)}`,
						`上升约 ${Math.abs(CHARM_DAY).toFixed(3)}`,
					],
				},
			],
			answer: "falls",
			revealAt: 1,
			explain: [
				`A day passing takes 1/365 of a year off the time left, so the change is ${unitRows[1].value} × −1/365 = ${fixed3(CHARM_DAY)}.`,
				`经过一天，剩余期限减少 1/365 年，所以变化为 ${unitRows[1].value} × −1/365 = ${fixed3(CHARM_DAY)}。`,
			],
		},
		beats: [
			{
				id: "day",
				label: ["Per day", "每天"],
				caption: [
					`Quoted per day that passes, the ${STRIKE} call's charm is ${fixed3(CHARM_DAY)}.`,
					`按每经过一天报价，${STRIKE} 看涨的 Charm 是 ${fixed3(CHARM_DAY)}。`,
				],
				state: { shown: 1 },
			},
			{
				id: "year",
				label: ["Per year left", "每年剩余"],
				caption: [
					`Quoted per year of time remaining, the same thing reads ${unitRows[1].value}: time left runs the other way, and a year is 365 days.`,
					`按每一年剩余期限报价，同一件事读作 ${unitRows[1].value}：剩余时间方向相反，而一年是 365 天。`,
				],
				state: { shown: 2 },
			},
			{
				id: "vanna",
				label: ["Vanna", "Vanna"],
				caption: [
					`Vanna per vol point is ${fixed3(VANNA_POINT)}; a ${VOL_DROP}-point fall moves delta ${fixed3(VANNA_POINT * -VOL_DROP)}. Match each sensitivity to its unit.`,
					`Vanna 按每个波动率点是 ${fixed3(VANNA_POINT)}；下降 ${VOL_DROP} 点使 Delta 变动 ${fixed3(VANNA_POINT * -VOL_DROP)}。每个敏感度都要配上对应的单位。`,
				],
				state: { shown: 3 },
			},
		],
		explore: {
			prompt: ["Step through the quotes.", "逐步查看这些报法。"],
			start: () => ({ shown: 3 }),
			task: {
				kind: "answer",
				prompt: [
					"If IV rose 3 points instead, about how would this call's delta change?",
					"如果 IV 反而上升 3 个点，这份看涨的 Delta 大约怎样变化？",
				],
				choices: [
					{
						id: "up",
						label: [fixed3(VANNA_POINT * 3), fixed3(VANNA_POINT * 3)],
					},
					{
						id: "down",
						label: [fixed3(-VANNA_POINT * 3), fixed3(-VANNA_POINT * 3)],
					},
					{ id: "one", label: [fixed3(VANNA_POINT), fixed3(VANNA_POINT)] },
				],
				answer: "up",
				done: [
					`Vanna per vol point is ${fixed3(VANNA_POINT)}, so +3 points moves delta by about ${fixed3(VANNA_POINT * 3)}. Match each sensitivity to its unit before you scale it.`,
					`每个波动率点的 Vanna 是 ${fixed3(VANNA_POINT)}，所以上升 3 点让 Delta 变化约 ${fixed3(VANNA_POINT * 3)}。先把每个敏感度对应到它的单位，再去放大。`,
				],
			},
		},
		View: UnitView,
	}),
	defineScene<SpreadState, SpreadState>({
		id: "spread",
		label: ["Scale the position", "缩放持仓"],
		title: [
			"An option change needs a signed position",
			"期权的变化需要带符号的持仓",
		],
		predict: {
			prompt: [
				`The 10:50 spread is long ${LONG.quantity} 105 calls and short ${SHORT.quantity} 110 calls. A week passes with ALFA at $${SPOT} and IV unchanged. Its position delta…`,
				`10:50 的价差是多头 ${LONG.quantity} 张 105 看涨、空头 ${SHORT.quantity} 张 110 看涨。一周过去，ALFA 停在 $${SPOT}，IV 不变。它的持仓 Delta……`,
			],
			choices: [
				{
					id: "rises",
					label: [
						`Rises, about ${signedCount(week.net - today.net)} shares`,
						`上升，约 ${signedCount(week.net - today.net)} 股`,
					],
				},
				{
					id: "falls",
					label: ["Falls: both deltas decay", "下降：两个 Delta 都在衰减"],
				},
				{ id: "same", label: ["Unchanged: no trades", "不变：没有成交"] },
			],
			answer: "rises",
			revealAt: 1,
			explain: [
				`The long 105 leg loses ${count(Math.abs(week.long - today.long))} shares of delta, but the short 110 leg's delta shrinks faster, which adds ${count(week.short - today.short)} for a short position: net ${signedCount(week.net - today.net)}.`,
				`多头 105 那条腿失去 ${count(Math.abs(week.long - today.long))} 股 Delta，但空头 110 那条腿的 Delta 缩小得更快，对空头而言增加了 ${count(week.short - today.short)}：净额 ${signedCount(week.net - today.net)}。`,
			],
		},
		beats: [
			{
				id: "today",
				label: ["Today", "今天"],
				caption: [
					`Today the spread's legs are ${signedCount(today.long)} and ${signedCount(today.short)} shares of delta: net ${signedCount(today.net)}.`,
					`今天价差两条腿的 Delta 分别是 ${signedCount(today.long)} 股和 ${signedCount(today.short)} 股：净额 ${signedCount(today.net)}。`,
				],
				state: { stage: 0 },
			},
			{
				id: "week",
				label: ["A week", "一周"],
				caption: [
					`A week later, with no trade: the long leg is ${signedCount(week.long - today.long)}, the short leg ${signedCount(week.short - today.short)}. Net ${signedCount(week.net - today.net)}: the spread got longer on its own.`,
					`一周后，没有任何成交：多头那条腿 ${signedCount(week.long - today.long)}，空头那条腿 ${signedCount(week.short - today.short)}。净额 ${signedCount(week.net - today.net)}：价差自己变得更多头了。`,
				],
				state: { stage: 1 },
			},
			{
				id: "vol",
				label: [`IV −${VOL_DROP}`, `IV −${VOL_DROP}`],
				caption: [
					`With IV also ${VOL_DROP} points lower the net change is ${signedCount(spreadAt(2).net - today.net)}. Signs come from the position, not from the option.`,
					`如果 IV 同时低 ${VOL_DROP} 点，净变化为 ${signedCount(spreadAt(2).net - today.net)}。符号来自持仓，而不是期权本身。`,
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: ["Step through the scenarios.", "逐步查看这些情景。"],
			start: () => ({ stage: 2 }),
			task: {
				kind: "answer",
				prompt: [
					"Over the week, which leg's delta changes more?",
					"这一周里，哪条腿的 Delta 变化更大？",
				],
				choices: [
					{ id: "short", label: ["The short 110 call", "110 看涨空头"] },
					{ id: "long", label: ["The long 105 call", "105 看涨多头"] },
					{ id: "same", label: ["Both by the same amount", "两者相同"] },
				],
				answer: "short",
				done: [
					"The 110 call is further out of the money, so its delta decays faster. Short that leg, the decay adds delta, more than the long 105 leg loses: the spread's delta rises without a trade.",
					"110 看涨更加虚值，所以它的 Delta 衰减更快。对这条空头腿来说，衰减会增加 Delta，增加的比 105 多头腿减少的还多：没有交易，价差的 Delta 也上升了。",
				],
			},
		},
		View: SpreadView,
	}),
] as const;

export function CharmVannaWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="charm-vanna"
			label={["Interactive lesson on charm and vanna", "Charm 与 Vanna 互动课"]}
			scenes={scenes}
		/>
	);
}
