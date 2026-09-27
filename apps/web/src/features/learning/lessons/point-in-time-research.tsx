import * as m from "motion/react-m";
import {
	type Copy,
	count,
	oct105CallBlock,
	oct105CallMessages,
	pick,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import {
	PayoffChart,
	type PayoffLine,
	type PayoffMarker,
} from "../walkthrough/instruments/payoff-chart";
import { Label, Stage, useStage, useTeachMotion } from "../walkthrough/stage";
import { textWidth } from "../walkthrough/text-measure";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

// ——— Scene 1: only what was known then ———

type Cutoff = 0 | 1 | 2;
type CutoffState = { cutoff: Cutoff | null };
type CutoffExplore = { cutoff: Cutoff };

const report = oct105CallMessages.find((message) => message.id === "M5");
const correction = oct105CallMessages.find((message) => message.id === "M6");
const REPORTED = report?.price ?? 0;
const CORRECTED = correction?.price ?? 0;
const CORRECTED_AT = correction?.received ?? "";

/** Monday's facts in the order they reached the system, each with the time it happened. */
const arrivals: readonly {
	id: string;
	arrived: Copy;
	fact: Copy;
	event: Copy;
}[] = [
	{
		id: "t1",
		arrived: ["Mon 10:12:05.1", "周一 10:12:05.1"],
		fact: ["T-1: 5 @ $2.00", "T-1：5 张 @ $2.00"],
		event: ["event 10:12:05.0", "事件 10:12:05.0"],
	},
	{
		id: "t3",
		arrived: [
			`Mon ${report?.received ?? ""}`,
			`周一 ${report?.received ?? ""}`,
		],
		fact: [`T-3: 500 @ ${usd(REPORTED)}`, `T-3：500 张 @ ${usd(REPORTED)}`],
		event: [`event ${oct105CallBlock.time}`, `事件 ${oct105CallBlock.time}`],
	},
	{
		id: "fix",
		arrived: [`Mon ${CORRECTED_AT}`, `周一 ${CORRECTED_AT}`],
		fact: [
			`T-3 corrected to ${usd(CORRECTED)}`,
			`T-3 更正为 ${usd(CORRECTED)}`,
		],
		event: [`event ${oct105CallBlock.time}`, `事件 ${oct105CallBlock.time}`],
	},
	{
		id: "late",
		arrived: ["Tue 09:00", "周二 09:00"],
		fact: ["Oct 18 120 call: 30", "10月18日 120 看涨：30"],
		event: ["event: Monday's session", "事件：周一交易时段"],
	},
];

/** Each decision time and the first arrival it can't see yet. */
const cutoffs: readonly { time: Copy; before: number }[] = [
	{ time: ["Mon 10:50:01", "周一 10:50:01"], before: 2 },
	{ time: ["Mon 10:51", "周一 10:51"], before: 3 },
	{ time: ["Mon 16:05", "周一 16:05"], before: 3 },
];

const ARRIVAL_TOP = 28;
const ARRIVAL_ROW = 64;
const arrivalsHeight = ARRIVAL_TOP + arrivals.length * ARRIVAL_ROW - 16;

function ArrivalList({
	width,
	state,
	locale,
}: {
	width: number;
	state: CutoffState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const timeWidth = width < 520 ? 112 : 136;
	const cutoff = state.cutoff === null ? null : cutoffs[state.cutoff];
	const lineY = ARRIVAL_TOP + (cutoff?.before ?? 2) * ARRIVAL_ROW - 12;
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t(["When each fact arrived", "各事实到达的时间"])}
			</Label>
			{arrivals.map((row, i) => {
				const y = ARRIVAL_TOP + i * ARRIVAL_ROW;
				const known = cutoff === null || i < cutoff.before;
				const focus = state.cutoff === 2 && row.id === "late";
				return (
					<g key={row.id}>
						{focus ? (
							<rect
								x={4}
								y={y}
								width={width - 8}
								height={40}
								rx={8}
								className="wt-focus-shape"
							/>
						) : null}
						<m.g
							initial={false}
							animate={{ opacity: known ? 1 : 0.35 }}
							transition={motion.fade}
						>
							<Label x={12} y={y + 17} tone="small">
								{t(row.arrived)}
							</Label>
							<Label
								x={8 + timeWidth}
								y={y + 17}
								tone={focus ? "accent" : undefined}
							>
								{t(row.fact)}
							</Label>
							<Label x={8 + timeWidth} y={y + 32} tone="small">
								{t(row.event)}
							</Label>
						</m.g>
					</g>
				);
			})}
			<m.g
				initial={false}
				animate={{ y: lineY, opacity: cutoff ? 1 : 0 }}
				transition={motion.move}
			>
				<path
					d={`M8 0H${width - 8}`}
					className="wt-bracket"
					strokeDasharray="6 4"
				/>
				<Label x={width - 8} y={-4} anchor="end" tone="accent">
					{cutoff
						? t([
								`decision · ${pick(cutoff.time, "en")}`,
								`决策 · ${pick(cutoff.time, "zh")}`,
							])
						: ""}
				</Label>
			</m.g>
		</g>
	);
}

function CutoffView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: CutoffState;
	explore: CutoffExplore | null;
	setExplore: (next: CutoffExplore) => void;
}) {
	const t = tr(locale);
	const shown: CutoffState = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] =
		shown.cutoff === null
			? [
					{
						id: "event",
						label: t(["T-3 happened", "T-3 发生于"]),
						value: oct105CallBlock.time,
						note: t(["the 500-lot in the 105 call", "105 看涨的 500 张大单"]),
						evidence: "observed",
					},
					{
						id: "reports",
						label: t(["Reports about it", "关于它的报告"]),
						value: "2",
						note: t([
							"a first report, then a correction",
							"一条首报，一条更正",
						]),
						evidence: "observed",
					},
				]
			: [
					{
						id: "price",
						label: t(["Block price the test may use", "检验可用的大单价格"]),
						value: usd(shown.cutoff === 0 ? REPORTED : CORRECTED),
						note:
							shown.cutoff === 0
								? t([
										`the correction arrives at ${CORRECTED_AT}`,
										`更正在 ${CORRECTED_AT} 才到`,
									])
								: t([
										`corrected at ${CORRECTED_AT}`,
										`已于 ${CORRECTED_AT} 更正`,
									]),
						tone: shown.cutoff === 0 ? "loss" : undefined,
					},
					{
						id: "late",
						label: t(["Oct 18 120 call volume", "10月18日 120 看涨成交量"]),
						value: t(["not yet known", "尚未获知"]),
						note: t(["arrives Tue 09:00", "周二 09:00 才到"]),
						evidence: "unknown",
					},
				];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Monday's facts about the 105 call listed by when they arrived, with a decision-time line separating what was known from what was not yet known",
						"周一关于 105 看涨的事实按到达时间排列，决策时刻线把已知与尚未获知的信息分开",
					])}
					height={arrivalsHeight}
				>
					{(width) => (
						<ArrivalList width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Decision time", "决策时刻"])}
						value={String(explore.cutoff) as "0" | "1" | "2"}
						options={[
							["0", "10:50:01"],
							["1", "10:51"],
							["2", "16:05"],
						]}
						onChange={(value) =>
							setExplore({ cutoff: Number(value) as Cutoff })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Every fact has two times: when it happened and when it became known. A replay may only use what had arrived by each decision time. Filtering by event time would let the $2.15 correction into a 10:50:01 decision, and would let Tuesday's late volume into Monday. Fix the knowledge cutoff, not just the date.",
						"每个事实都有两个时间：何时发生，何时被获知。重放在每个决策时刻只能使用当时已经到达的信息。按事件时间筛选，会让 $2.15 的更正进入 10:50:01 的决策，也会让周二才到的成交量进入周一。要固定获知截止时间，而不只是日期。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: a score can fall without a trade ———

type HalfLife = 15 | 30 | 60;
type DecayState = { minute: number; halfLife: HalfLife };

const BLOCK = oct105CallBlock.quantity;
const weightAt = (minute: number, halfLife: number) =>
	BLOCK * 0.5 ** (minute / halfLife);
/** Minutes after the 10:50 block as a clock time. */
const clock = (minute: number) => {
	const total = 10 * 60 + 50 + minute;
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

function DecayView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: DecayState;
	explore: DecayState | null;
	setExplore: (next: DecayState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const weight = weightAt(shown.minute, shown.halfLife);
	const lines: PayoffLine[] = [
		{
			id: "contracts",
			label: t(["contracts in the block", "大单张数"]),
			points: [
				[0, BLOCK],
				[120, BLOCK],
			],
			tone: "reference",
		},
		{
			id: "weight",
			label: t([
				`weight, ${shown.halfLife}-min half-life`,
				`权重，半衰期 ${shown.halfLife} 分钟`,
			]),
			points: Array.from({ length: 25 }, (_, i) => {
				const minute = i * 5;
				return [minute, weightAt(minute, shown.halfLife)] as const;
			}),
			tone: "position",
		},
	];
	const markers: PayoffMarker[] = [
		{
			id: "now",
			x: shown.minute,
			y: weight,
			label: count(Math.round(weight)),
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The 10:50 block's weight in the 105 call's activity score halving every half-life while its contract count stays flat",
						"10:50 大单在 105 看涨活跃度分数中的权重每过一个半衰期减半，而它的张数保持不变",
					])}
					height={(width) => (width < 520 ? 250 : 280)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 250 : 280}
							xRange={[0, 120]}
							yRange={[0, 600]}
							xTicks={[0, 30, 60, 90, 120]}
							yTicks={[0, 250, 500]}
							lines={lines}
							markers={markers}
							formatX={clock}
							formatY={(value) => count(value)}
							xLabel={t([
								"Monday · no trades after 10:50",
								"周一 · 10:50 后无成交",
							])}
							title={t([
								"Oct 18 105 call · the block's weight",
								"10月18日 105 看涨 · 大单的权重",
							])}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "weight",
					label: t([
						`Block's weight at ${clock(shown.minute)}`,
						`${clock(shown.minute)} 大单的权重`,
					]),
					value: count(Math.round(weight)),
					note: t([
						`halves every ${shown.halfLife} minutes`,
						`每 ${shown.halfLife} 分钟减半`,
					]),
					evidence: "calculated",
				},
				{
					id: "contracts",
					label: t(["Contracts in the block", "大单张数"]),
					value: count(BLOCK),
					note: t(["unchanged: no new trades", "不变：没有新成交"]),
					evidence: "observed",
				},
			]}
			controls={
				explore ? (
					<>
						<RangeControl
							label={t(["Time", "时间"])}
							value={explore.minute}
							display={clock(explore.minute)}
							min={0}
							max={120}
							step={5}
							onChange={(minute) => setExplore({ ...explore, minute })}
						/>
						<ChoiceField
							label={t(["Half-life", "半衰期"])}
							value={String(explore.halfLife) as "15" | "30" | "60"}
							options={[
								["15", t(["15 min", "15 分钟"])],
								["30", t(["30 min", "30 分钟"])],
								["60", t(["60 min", "60 分钟"])],
							]}
							onChange={(value) =>
								setExplore({ ...explore, halfLife: Number(value) as HalfLife })
							}
						/>
					</>
				) : null
			}
			details={
				<p>
					{t([
						"A recency-weighted score lets old activity fade: each event's weight halves every half-life. So a score can fall with no new trade at all, while the count of contracts and trades never changes. Say which one you mean, and which half-life you chose before looking at results.",
						"按时间加权的分数会让旧的活动逐渐淡出：每个事件的权重每过一个半衰期就减半。所以即使完全没有新成交，分数也会下降，而合约张数和成交笔数从不改变。要说明你指的是哪一个，以及在看结果之前选定的半衰期。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: a percentile is not a probability ———

type Reading = 0 | 1 | 2;
type PercentileState = { reading: Reading };

/** The 105 call's volume against its typical level on each of the last 60 sessions. */
const history: readonly { from: number; days: number }[] = [
	{ from: 0, days: 9 },
	{ from: 0.5, days: 21 },
	{ from: 1, days: 16 },
	{ from: 1.5, days: 7 },
	{ from: 2, days: 3 },
	{ from: 2.5, days: 2 },
	{ from: 3, days: 0 },
	{ from: 3.5, days: 0 },
	{ from: 4, days: 0 },
	{ from: 4.5, days: 2 },
];
const BUCKET = 0.5;
/** Monday: 505 contracts against a typical 120. */
const TODAY = 4.2;
const SESSIONS = history.reduce((sum, bucket) => sum + bucket.days, 0);
const LOWER = history
	.filter((bucket) => bucket.from + BUCKET <= TODAY)
	.reduce((sum, bucket) => sum + bucket.days, 0);
const PERCENTILE = Math.round((LOWER / SESSIONS) * 100);

const HIST_TOP = 48;
const HIST_BOTTOM = 170;
const histogramTitle: Copy = [
	"105 call volume vs typical · last 60 sessions",
	"105 看涨成交量与典型水平之比 · 近 60 个交易日",
];
/** The title breaks at its separator when the stage is too narrow for one line. */
const histogramTitleLines = (width: number, locale: Locale) => {
	const title = pick(histogramTitle, locale);
	return textWidth(title, 12) > width - 16 ? title.split(" · ") : [title];
};

function Histogram({
	width,
	state,
	locale,
}: {
	width: number;
	state: PercentileState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const left = 14;
	const right = width - 14;
	const x = (value: number) => left + (value / 5) * (right - left);
	const most = Math.max(...history.map((bucket) => bucket.days));
	const todayLabel = t([`today ${TODAY}×`, `今天 ${TODAY}×`]);
	const titleLines = histogramTitleLines(width, locale);
	return (
		<g>
			{titleLines.map((line, i) => (
				<Label key={line} x={8} y={16 + i * 14} tone="muted">
					{line}
				</Label>
			))}
			<g transform={`translate(0 ${(titleLines.length - 1) * 14})`}>
				{history.map((bucket) => {
					if (!bucket.days) return null;
					const h = (bucket.days / most) * (HIST_BOTTOM - HIST_TOP);
					const lower = state.reading >= 1 && bucket.from + BUCKET <= TODAY;
					return (
						<g key={bucket.from}>
							<rect
								x={x(bucket.from) + 2}
								y={HIST_BOTTOM - h}
								width={x(bucket.from + BUCKET) - x(bucket.from) - 4}
								height={h}
								rx={3}
								className={lower ? "wt-focus-shape" : "wt-panel-shape"}
							/>
							<Label
								x={x(bucket.from + BUCKET / 2)}
								y={HIST_BOTTOM - h - 5}
								anchor="middle"
								tone="small"
							>
								{bucket.days}
							</Label>
						</g>
					);
				})}
				<path d={`M${left} ${HIST_BOTTOM}H${right}`} className="wt-axis" />
				{[0, 1, 2, 3, 4, 5].map((tick) => (
					<Label
						key={tick}
						x={x(tick)}
						y={HIST_BOTTOM + 16}
						anchor="middle"
						tone="small"
					>
						{`${tick}×`}
					</Label>
				))}
				<path
					d={`M${x(TODAY)} ${HIST_TOP - 6}V${HIST_BOTTOM + 4}`}
					className="wt-bracket"
				/>
				<Label
					x={Math.min(x(TODAY), width - 8 - (todayLabel.length * 7.8) / 2)}
					y={HIST_TOP - 12}
					anchor="middle"
					tone="accent"
				>
					{todayLabel}
				</Label>
				<m.g
					initial={false}
					animate={{ opacity: state.reading >= 1 ? 1 : 0 }}
					transition={motion.fade}
				>
					<path
						d={`M${x(0)} ${HIST_BOTTOM + 24}v6H${x(TODAY)}v-6`}
						className="wt-bracket"
					/>
					<Label
						x={(x(0) + x(TODAY)) / 2}
						y={HIST_BOTTOM + 46}
						anchor="middle"
						tone="accent"
					>
						{t([
							`${LOWER} of ${SESSIONS} sessions were lower`,
							`${SESSIONS} 个交易日中有 ${LOWER} 个更低`,
						])}
					</Label>
				</m.g>
			</g>
		</g>
	);
}

function PercentileView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: PercentileState;
	explore: PercentileState | null;
	setExplore: (next: PercentileState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] = [
		{
			id: "today",
			label: t(["Today's volume vs typical", "今天成交量与典型之比"]),
			value: `${TODAY}×`,
			note: t(["505 contracts vs a typical 120", "505 张对比典型的 120 张"]),
			evidence: "calculated",
		},
	];
	if (shown.reading >= 1)
		result.push({
			id: "percentile",
			label: t(["Percentile", "百分位"]),
			value: t([`${PERCENTILE}th`, `第 ${PERCENTILE}`]),
			note: t([
				`${LOWER} of the last ${SESSIONS} sessions were lower`,
				`近 ${SESSIONS} 个交易日中有 ${LOWER} 个更低`,
			]),
			evidence: "calculated",
		});
	if (shown.reading >= 2)
		result.push({
			id: "chance",
			label: t(["Chance ALFA rises", "ALFA 上涨的概率"]),
			value: t(["not measured", "未测量"]),
			note: t(["needs a test on what followed", "需要检验之后实际发生了什么"]),
			evidence: "unknown",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A histogram of the 105 call's volume against its typical level over the last 60 sessions, with today's value marked",
						"105 看涨近 60 个交易日成交量与典型水平之比的直方图，标出今天的数值",
					])}
					height={(width) =>
						HIST_BOTTOM +
						54 +
						(histogramTitleLines(width, locale).length - 1) * 14
					}
				>
					{(width) => <Histogram width={width} state={shown} locale={locale} />}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Show", "显示"])}
						value={String(explore.reading) as "0" | "1" | "2"}
						options={[
							["0", t(["Today", "今天"])],
							["1", t(["+ Percentile", "+ 百分位"])],
							["2", t(["+ Probability", "+ 概率"])],
						]}
						onChange={(value) =>
							setExplore({ reading: Number(value) as Reading })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A percentile ranks today among past sessions. A standardized score counts standard deviations from their average. A probability says how often an outcome followed, and only a test on outcomes can give one. None follows from the others, and each needs a comparable baseline and enough history.",
						"百分位是把今天放进过去的交易日中排名；标准分是距平均值几个标准差；概率说明某个结果之后多常出现，只有基于结果的检验才能给出。三者不能相互推出，而且每一个都需要可比的基准和足够的历史。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 4: freeze the rule, open the holdout once ———

type Search = 0 | 1 | 2;
type HoldoutState = { search: Search };

/** How often ALFA rose the next day after its call volume topped each threshold, Jan–Jun. */
const tried: readonly { threshold: number; rose: number }[] = [
	{ threshold: 1.5, rose: 51 },
	{ threshold: 2, rose: 53 },
	{ threshold: 2.5, rose: 49 },
	{ threshold: 3, rose: 56 },
	{ threshold: 3.5, rose: 54 },
	{ threshold: 4, rose: 70 },
	{ threshold: 4.5, rose: 58 },
	{ threshold: 5, rose: 50 },
	{ threshold: 5.5, rose: 47 },
	{ threshold: 6, rose: 55 },
];
const best = tried.reduce((a, b) => (b.rose > a.rose ? b : a));
/** The frozen rule, run once on July and August. */
const HOLDOUT = 52;

const SEARCH_TOP = 40;
const SEARCH_BOTTOM = 170;

function SearchBars({
	width,
	state,
	locale,
}: {
	width: number;
	state: HoldoutState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const { hatch } = useStage();
	const boxWidth = width < 520 ? 64 : 96;
	const hx = width - 8 - boxWidth;
	const left = 40;
	const right = hx - 16;
	const slot = (right - left) / tried.length;
	const y = (rose: number) =>
		SEARCH_BOTTOM - (rose / 80) * (SEARCH_BOTTOM - SEARCH_TOP);
	const opened = state.search >= 2;
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t(["How often ALFA rose the next day", "ALFA 次日上涨的比例"])}
			</Label>
			<path d={`M${left} ${y(50)}H${right}`} className="wt-grid" />
			<Label x={left - 6} y={y(50) + 4} anchor="end" tone="small">
				50%
			</Label>
			<path d={`M${left} ${SEARCH_BOTTOM}H${right}`} className="wt-axis" />
			{tried.map((trial, i) => {
				const chosen = state.search >= 1 && trial === best;
				const cx = left + i * slot + slot / 2;
				return (
					<g key={trial.threshold}>
						<rect
							x={left + i * slot + 2}
							y={y(trial.rose)}
							width={slot - 4}
							height={SEARCH_BOTTOM - y(trial.rose)}
							rx={2}
							className={chosen ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						{chosen ? (
							<Label x={cx} y={y(trial.rose) - 6} anchor="middle" tone="accent">
								{`${trial.threshold}× · ${trial.rose}%`}
							</Label>
						) : null}
					</g>
				);
			})}
			<Label
				x={(left + right) / 2}
				y={SEARCH_BOTTOM + 18}
				anchor="middle"
				tone="small"
			>
				{t(["Jan–Jun · 10 thresholds", "1–6 月 · 10 个阈值"])}
			</Label>
			<rect
				x={hx}
				y={SEARCH_TOP}
				width={boxWidth}
				height={SEARCH_BOTTOM - SEARCH_TOP}
				rx={8}
				className="wt-panel-shape"
				style={opened ? undefined : { fill: hatch }}
			/>
			{opened ? (
				<m.rect
					x={hx + boxWidth / 4}
					width={boxWidth / 2}
					rx={2}
					className="wt-focus-shape"
					initial={motion.enabled ? { y: SEARCH_BOTTOM, height: 0 } : false}
					animate={{ y: y(HOLDOUT), height: SEARCH_BOTTOM - y(HOLDOUT) }}
					transition={motion.move}
				/>
			) : null}
			<Label
				x={hx + boxWidth / 2}
				y={opened ? y(HOLDOUT) - 6 : (SEARCH_TOP + SEARCH_BOTTOM) / 2 + 4}
				anchor="middle"
				tone="accent"
				className="wt-halo"
			>
				{opened ? `${HOLDOUT}%` : t(["sealed", "封存"])}
			</Label>
			<Label
				x={hx + boxWidth / 2}
				y={SEARCH_BOTTOM + 18}
				anchor="middle"
				tone="small"
			>
				{t(["Jul–Aug", "7–8 月"])}
			</Label>
		</g>
	);
}

function HoldoutView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: HoldoutState;
	explore: HoldoutState | null;
	setExplore: (next: HoldoutState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] = [
		{
			id: "tried",
			label: t(["Rules tried", "尝试的规则"]),
			value: String(tried.length),
			note: t(["all on the same Jan–Jun data", "都用同一段 1–6 月数据"]),
		},
	];
	if (shown.search >= 1)
		result.push({
			id: "best",
			label: t(["Best on Jan–Jun", "1–6 月最佳"]),
			value: `${best.rose}%`,
			note: t([
				`above ${best.threshold}×, picked after looking`,
				`高于 ${best.threshold}×，看过结果后挑选`,
			]),
			evidence: "calculated",
		});
	if (shown.search >= 2)
		result.push({
			id: "holdout",
			label: t(["Same rule on Jul–Aug", "同一规则用于 7–8 月"]),
			value: `${HOLDOUT}%`,
			note: t(["frozen first, run once", "先冻结，只运行一次"]),
			tone: "loss",
			evidence: "calculated",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Ten thresholds tried on January to June, the best one picked, and the same rule run once on sealed July and August data",
						"在 1–6 月数据上尝试十个阈值、挑出最佳，再把同一规则在封存的 7–8 月数据上运行一次",
					])}
					height={SEARCH_BOTTOM + 26}
				>
					{(width) => (
						<SearchBars width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Show", "显示"])}
						value={String(explore.search) as "0" | "1" | "2"}
						options={[
							["0", t(["Search", "搜索"])],
							["1", t(["+ Winner", "+ 胜者"])],
							["2", t(["+ Holdout", "+ 保留集"])],
						]}
						onChange={(value) =>
							setExplore({ search: Number(value) as Search })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Trying many specifications on the same data and keeping the best makes the winner look better than it is. Before looking at outcomes, freeze the question, the population, the measure and the rule, keep a later period sealed, and run the frozen rule on it once. Editing the rule after seeing the holdout turns it into more search data.",
						"在同一份数据上尝试很多种设定并保留最好的那个，会让胜者看起来比实际更好。在看结果之前，固定问题、人群、测量量和规则，封存后面的一段时间，并把冻结的规则在上面只运行一次。看过保留集之后再修改规则，就把它变成了更多的搜索数据。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<CutoffState, CutoffExplore>({
		id: "cutoff",
		label: ["Respect the cutoff", "遵守截止"],
		title: [
			"Use only what was known at the decision time",
			"只用决策时已知的信息",
		],
		predict: {
			prompt: [
				"A backtest replays a decision at 10:50:01 on Monday. Which price may it use for the 500-lot block?",
				"回测重放周一 10:50:01 的一个决策。它能对 500 张大单使用哪个价格？",
			],
			choices: [
				{
					id: "first",
					label: [
						`${usd(REPORTED)}: the first report`,
						`${usd(REPORTED)}：首报价格`,
					],
				},
				{
					id: "fixed",
					label: [
						`${usd(CORRECTED)}: the corrected price`,
						`${usd(CORRECTED)}：更正后的价格`,
					],
				},
				{
					id: "none",
					label: ["Neither: the block is too new", "都不能：大单太新"],
				},
			],
			answer: "first",
			explain: [
				`At 10:50:01 only the first report, ${usd(REPORTED)}, had arrived. The correction came at ${CORRECTED_AT}, so an honest replay uses ${usd(REPORTED)} there, even though we now know it was wrong.`,
				`10:50:01 时只有首报的 ${usd(REPORTED)} 已经到达。更正在 ${CORRECTED_AT} 才到，所以诚实的重放在那一刻使用 ${usd(REPORTED)}，即使我们现在知道它是错的。`,
			],
		},
		beats: [
			{
				id: "arrivals",
				label: ["Two times", "两个时间"],
				caption: [
					"Monday's facts about the 105 call, listed by when they arrived. Each also has an event time: when it happened.",
					"周一关于 105 看涨的事实，按到达时间排列。每条还有一个事件时间：它何时发生。",
				],
				state: { cutoff: null },
			},
			{
				id: "early",
				label: ["10:50:01", "10:50:01"],
				caption: [
					`Replay a decision at 10:50:01. The block's first report has arrived at ${usd(REPORTED)}; its correction hasn't. The test must use ${usd(REPORTED)}.`,
					`重放 10:50:01 的决策。大单的首报已经以 ${usd(REPORTED)} 到达，更正还没到。检验必须使用 ${usd(REPORTED)}。`,
				],
				state: { cutoff: 0 },
			},
			{
				id: "later",
				label: ["10:51", "10:51"],
				caption: [
					`By 10:51 the correction has arrived and the test may use ${usd(CORRECTED)}. What changed is what was known, not what happened.`,
					`到 10:51，更正已到，检验可以使用 ${usd(CORRECTED)}。变化的是已知的信息，而不是发生的事。`,
				],
				state: { cutoff: 1 },
			},
			{
				id: "close",
				label: ["16:05", "16:05"],
				caption: [
					"Even after Monday's close, the Oct 18 120 call's volume isn't known: it arrives Tuesday at 09:00. No Monday decision may use it.",
					"即使周一收盘之后，10月18日 120 看涨的成交量仍未获知：它周二 09:00 才到。周一的任何决策都不能使用它。",
				],
				state: { cutoff: 2 },
			},
		],
		explore: {
			prompt: [
				"Move the decision time and watch what the test may use.",
				"移动决策时刻，观察检验可以使用什么。",
			],
			start: (last) => ({ cutoff: last.cutoff ?? 0 }),
		},
		View: CutoffView,
	}),
	defineScene<DecayState, DecayState>({
		id: "decay",
		label: ["Let weight decay", "权重衰减"],
		title: ["A score can fall without a new trade", "没有新成交，分数也会下降"],
		predict: {
			prompt: [
				"No trades follow the 500-lot at 10:50. With a 30-minute half-life, what is the block's weight in the 105 call's activity score at 11:50?",
				"10:50 的 500 张大单之后再无成交。半衰期为 30 分钟时，11:50 这笔大单在 105 看涨活跃度分数中的权重是多少？",
			],
			choices: [
				{ id: "twice", label: ["125: halved twice", "125：减半两次"] },
				{ id: "once", label: ["250: halved once", "250：减半一次"] },
				{ id: "same", label: ["500: nothing traded", "500：没有成交"] },
			],
			answer: "twice",
			revealAt: 2,
			explain: [
				"An hour is two half-lives: 500 → 250 → 125. The block still has 500 contracts; only their weight in the score has faded.",
				"一小时是两个半衰期：500 → 250 → 125。大单仍然是 500 张，淡出的只是它们在分数中的权重。",
			],
		},
		beats: [
			{
				id: "start",
				label: ["10:50", "10:50"],
				caption: [
					"At 10:50 the block enters the 105 call's activity score with a weight of 500, one per contract.",
					"10:50，大单以 500 的权重进入 105 看涨的活跃度分数，每张合约计 1。",
				],
				state: { minute: 0, halfLife: 30 },
			},
			{
				id: "half",
				label: ["11:20", "11:20"],
				caption: [
					"Thirty minutes later, with no new trades, its weight has halved to 250. The contract count hasn't moved.",
					"三十分钟后，没有新成交，它的权重减半到 250。合约张数没有变化。",
				],
				state: { minute: 30, halfLife: 30 },
			},
			{
				id: "quarter",
				label: ["11:50", "11:50"],
				caption: [
					"After an hour it's 125. A falling score here means time passed, not that anyone sold.",
					"一小时后是 125。这里分数下降意味着时间过去了，而不是有人卖出。",
				],
				state: { minute: 60, halfLife: 30 },
			},
		],
		explore: {
			prompt: [
				"Change the half-life and move through time.",
				"改变半衰期，并在时间上移动。",
			],
			start: () => ({ minute: 60, halfLife: 60 }),
		},
		View: DecayView,
	}),
	defineScene<PercentileState, PercentileState>({
		id: "percentile",
		label: ["Read the score", "读取分数"],
		title: ["A percentile is not a probability", "百分位不是概率"],
		predict: {
			prompt: [
				`Today the 105 call's volume is at the ${PERCENTILE}th percentile of its last ${SESSIONS} sessions. What does that say?`,
				`今天 105 看涨的成交量处于近 ${SESSIONS} 个交易日的第 ${PERCENTILE} 百分位。这说明了什么？`,
			],
			choices: [
				{
					id: "rank",
					label: [
						`It beat about ${PERCENTILE}% of those sessions`,
						`它高于其中约 ${PERCENTILE}% 的交易日`,
					],
				},
				{
					id: "chance",
					label: [
						`A ${PERCENTILE}% chance ALFA rises`,
						`ALFA 有 ${PERCENTILE}% 的概率上涨`,
					],
				},
				{
					id: "traders",
					label: [
						`${PERCENTILE}% of traders are bullish`,
						`${PERCENTILE}% 的交易者看涨`,
					],
				},
			],
			answer: "rank",
			explain: [
				`${LOWER} of the last ${SESSIONS} sessions had lower volume. That ranks today; it says nothing about what ALFA does next.`,
				`近 ${SESSIONS} 个交易日中有 ${LOWER} 个成交量更低。这是在给今天排名，并没有说明 ALFA 接下来会怎样。`,
			],
		},
		beats: [
			{
				id: "today",
				label: ["Today", "今天"],
				caption: [
					`Today's ${TODAY}× sits at the far right of the 105 call's last ${SESSIONS} sessions.`,
					`今天的 ${TODAY}× 位于 105 看涨近 ${SESSIONS} 个交易日的最右侧。`,
				],
				state: { reading: 0 },
			},
			{
				id: "percentile",
				label: ["Percentile", "百分位"],
				caption: [
					`${LOWER} of those ${SESSIONS} sessions were lower: the ${PERCENTILE}th percentile. It ranks today among past sessions.`,
					`这 ${SESSIONS} 个交易日中有 ${LOWER} 个更低：第 ${PERCENTILE} 百分位。它在过去的交易日中给今天排名。`,
				],
				state: { reading: 1 },
			},
			{
				id: "probability",
				label: ["Not a probability", "不是概率"],
				caption: [
					`It is not a ${PERCENTILE}% chance of a rise. A probability would need a test on what actually followed sessions like this one.`,
					`它不是 ${PERCENTILE}% 的上涨概率。概率需要检验类似交易日之后实际发生了什么。`,
				],
				state: { reading: 2 },
			},
		],
		explore: {
			prompt: ["Step through the reading.", "逐步查看这个解读。"],
			start: () => ({ reading: 2 }),
		},
		View: PercentileView,
	}),
	defineScene<HoldoutState, HoldoutState>({
		id: "holdout",
		label: ["Protect the holdout", "保护保留集"],
		title: [
			"Trying many rules changes what the winner means",
			"尝试很多规则，会改变胜者的含义",
		],
		predict: {
			prompt: [
				`You tried ${tried.length} call-volume thresholds on Jan–Jun. After the best one, ALFA rose the next day ${best.rose}% of the time. What should you expect on sealed Jul–Aug data?`,
				`你在 1–6 月数据上试了 ${tried.length} 个看涨成交量阈值。最好的那个之后，ALFA 次日上涨的比例是 ${best.rose}%。在封存的 7–8 月数据上应当预期什么？`,
			],
			choices: [
				{
					id: "lower",
					label: [
						`Lower: ${best.rose}% was picked after looking`,
						`更低：${best.rose}% 是看过结果后挑的`,
					],
				},
				{ id: "same", label: [`About ${best.rose}%`, `大约 ${best.rose}%`] },
				{ id: "higher", label: ["Higher", "更高"] },
			],
			answer: "lower",
			revealAt: 2,
			explain: [
				`The best of ${tried.length} tries is partly luck. Run once on sealed Jul–Aug data, the same rule gave ${HOLDOUT}%, close to a coin flip.`,
				`${tried.length} 次尝试中的最好结果部分来自运气。在封存的 7–8 月数据上只运行一次，同一规则得到 ${HOLDOUT}%，接近抛硬币。`,
			],
		},
		beats: [
			{
				id: "search",
				label: ["The search", "搜索"],
				caption: [
					`${tried.length} thresholds for "ALFA call volume above X× typical" are tried on the same Jan–Jun data.`,
					`在同一段 1–6 月数据上，尝试“ALFA 看涨成交量高于典型的 X 倍”的 ${tried.length} 个阈值。`,
				],
				state: { search: 0 },
			},
			{
				id: "winner",
				label: ["The winner", "胜者"],
				caption: [
					`"Above ${best.threshold}×" was followed by a rise ${best.rose}% of the time, the best of the ${tried.length}. It was picked after seeing every result.`,
					`“高于 ${best.threshold}×”之后上涨的比例为 ${best.rose}%，是 ${tried.length} 个中最好的。它是在看过所有结果之后才被挑出来的。`,
				],
				state: { search: 1 },
			},
			{
				id: "holdout",
				label: ["The holdout", "保留集"],
				caption: [
					`Frozen, then run once on Jul–Aug, which stayed sealed until now, the same rule gives ${HOLDOUT}%. Freeze first; open the holdout once.`,
					`先冻结，再在一直封存的 7–8 月数据上运行一次，同一规则得到 ${HOLDOUT}%。先冻结，保留集只打开一次。`,
				],
				state: { search: 2 },
			},
		],
		explore: {
			prompt: [
				"Step through the search, the winner and the holdout.",
				"逐步查看搜索、胜者与保留集。",
			],
			start: () => ({ search: 2 }),
		},
		View: HoldoutView,
	}),
] as const;

export function PointInTimeResearchWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="point-in-time-research"
			label={[
				"Interactive lesson on testing without hindsight",
				"无后见之明的检验互动课",
			]}
			scenes={scenes}
		/>
	);
}
