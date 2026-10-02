import * as m from "motion/react-m";
import {
	type Copy,
	count,
	mondayActivity,
	oct105CallBlock,
	oct105CallLast,
	pick,
	typicalVolumeProfile,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import {
	type PayoffBand,
	PayoffChart,
	type PayoffLine,
	type PayoffMarker,
} from "../walkthrough/instruments/payoff-chart";
import { Appear, Label, Stage, useTeachMotion } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

type ActivityId = (typeof mondayActivity)[number]["id"];
const byId = (id: ActivityId) =>
	mondayActivity.find(
		(row) => row.id === id,
	) as (typeof mondayActivity)[number];

/** "4.2×", or "0.42×" below one so small ratios keep two digits. */
const ratio = (value: number) => `${value.toFixed(value < 1 ? 2 : 1)}×`;

// ——— Scene 1: the denominator decides ———

type Base = "typical" | "oi";
type DenominatorState = { base: Base; rows: readonly ActivityId[] };

const ROW = 66;
/** The rows the beats reveal first come first, so nothing opens with an empty gap. */
const DISPLAY_ORDER: readonly ActivityId[] = [
	"oct18-105",
	"dec20-110",
	"oct18-100",
	"oct18-110",
];

function RatioRows({
	width,
	state,
	locale,
}: {
	width: number;
	state: DenominatorState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const all = DISPLAY_ORDER;
	const shown = all.filter((id) => state.rows.includes(id));
	const denominator = (id: ActivityId) =>
		state.base === "typical" ? byId(id).typical : byId(id).openInterest;
	const max = Math.max(
		...shown.flatMap((id) => [byId(id).volume, denominator(id)]),
	);
	const span = width - 14 - 96;
	const k = span / max;
	return (
		<g>
			<Label x={14} y={16} tone="muted">
				{state.base === "typical"
					? t([
							"Monday volume ÷ typical daily volume",
							"周一成交量 ÷ 典型日成交量",
						])
					: t([
							"Monday volume ÷ Friday's open interest",
							"周一成交量 ÷ 周五收盘未平仓量",
						])}
			</Label>
			{all.map((id, i) => {
				const row = byId(id);
				const visible = state.rows.includes(id);
				const y = 30 + i * ROW;
				const bottom = denominator(id);
				return (
					<m.g
						key={id}
						initial={false}
						animate={{ opacity: visible ? 1 : 0 }}
						transition={motion.fade}
					>
						<Label x={14} y={y + 14}>
							{t(row.label)}
						</Label>
						<Label
							x={width - 14}
							y={y + 16}
							anchor="end"
							tone="strong"
							className="wt-accent"
						>
							{ratio(row.volume / bottom)}
						</Label>
						<m.rect
							x={14}
							y={y + 24}
							height={11}
							rx={3}
							className="wt-chip"
							initial={false}
							animate={{ width: Math.max(row.volume * k, 2) }}
							transition={motion.move}
						/>
						<m.text
							y={y + 34}
							className="wt-small"
							initial={false}
							animate={{ x: 14 + Math.max(row.volume * k, 2) + 6 }}
							transition={motion.move}
						>
							{t([`${count(row.volume)} traded`, `成交 ${count(row.volume)}`])}
						</m.text>
						<m.rect
							x={14}
							y={y + 40}
							height={11}
							rx={3}
							className="wt-panel-shape"
							initial={false}
							animate={{ width: Math.max(bottom * k, 2) }}
							transition={motion.move}
						/>
						<m.text
							y={y + 50}
							className="wt-small"
							initial={false}
							animate={{ x: 14 + Math.max(bottom * k, 2) + 6 }}
							transition={motion.move}
						>
							{state.base === "typical"
								? t([`${count(bottom)} typical`, `典型 ${count(bottom)}`])
								: t([`${count(bottom)} open`, `未平仓 ${count(bottom)}`])}
						</m.text>
					</m.g>
				);
			})}
		</g>
	);
}

function DenominatorView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: DenominatorState;
	explore: DenominatorState | null;
	setExplore: (next: DenominatorState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] = DISPLAY_ORDER.filter((id) =>
		shown.rows.includes(id),
	).map((id) => {
		const row = byId(id);
		const bottom = shown.base === "typical" ? row.typical : row.openInterest;
		return {
			id,
			label: t(row.label),
			value: ratio(row.volume / bottom),
			note: `${count(row.volume)} ÷ ${count(bottom)}`,
			evidence: "calculated",
		};
	});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Monday volume for ALFA calls set against a baseline, with the ratio each gives",
						"ALFA 看涨期权周一成交量与基准对比，以及各自的比率",
					])}
					height={30 + mondayActivity.length * ROW}
				>
					{(width) => <RatioRows width={width} state={shown} locale={locale} />}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Compare volume with", "成交量对比"])}
						value={explore.base}
						options={[
							["typical", t(["Typical volume", "典型成交量"])],
							["oi", t(["Open interest", "未平仓量"])],
						]}
						onChange={(base) => setExplore({ ...explore, base })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Relative volume asks whether today is busier than usual; volume over open interest asks how much trading there was against the contracts already outstanding. Each answers its own question, and a tiny denominator makes any ratio look dramatic. When a denominator is missing or zero, the ratio is unavailable, not zero or infinite.",
						"相对成交量问的是今天是否比平常更活跃；成交量除以未平仓量问的是交易量相对已存续合约有多大。它们各自回答不同的问题，而很小的分母会让任何比率看起来都很惊人。分母缺失或为零时，比率不可用，而不是零或无穷大。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: compare the same window ———

type WindowState = { minute: number | null };

const CALL_105 = byId("oct18-105");
const minutesAfterOpen = (time: string) => {
	const [hour, minute] = time.split(":").map(Number);
	return hour * 60 + minute - 570;
};
const T1_MINUTE = minutesAfterOpen(oct105CallLast.time);
const BLOCK_MINUTE = minutesAfterOpen(oct105CallBlock.time.slice(0, 5));

function typicalBy(minute: number) {
	const points = typicalVolumeProfile;
	for (let i = 1; i < points.length; i++) {
		const [x0, y0] = points[i - 1];
		const [x1, y1] = points[i];
		if (minute <= x1)
			return CALL_105.typical * (y0 + ((minute - x0) / (x1 - x0)) * (y1 - y0));
	}
	return CALL_105.typical;
}

function todayBy(minute: number) {
	if (minute >= BLOCK_MINUTE) return CALL_105.volume;
	if (minute >= T1_MINUTE) return oct105CallLast.size;
	return 0;
}

const clock = (minute: number) => {
	const total = 570 + minute;
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

function WindowView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: WindowState;
	explore: WindowState | null;
	setExplore: (next: WindowState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const lines: PayoffLine[] = [
		{
			id: "typical",
			label: t(["typical day", "典型日"]),
			points: typicalVolumeProfile.map(
				([minute, share]) => [minute, share * CALL_105.typical] as const,
			),
			tone: "reference",
		},
		{
			id: "today",
			label: t(["Monday", "周一"]),
			points: [
				[0, 0],
				[T1_MINUTE, 0],
				[T1_MINUTE, oct105CallLast.size],
				[BLOCK_MINUTE, oct105CallLast.size],
				[BLOCK_MINUTE, CALL_105.volume],
				[390, CALL_105.volume],
			],
			tone: "position",
		},
	];
	const minute = shown.minute;
	const today = minute === null ? 0 : todayBy(minute);
	const typical = minute === null ? 0 : typicalBy(minute);
	const markers: PayoffMarker[] =
		minute === null
			? []
			: [
					{
						id: "today",
						x: minute,
						y: today,
						label: count(today),
						tone: "neutral",
					},
					{
						id: "typical",
						x: minute,
						y: typical,
						label: count(Math.round(typical)),
					},
				];
	const bands: PayoffBand[] =
		minute === null
			? []
			: [
					{
						id: "window",
						from: 0,
						to: minute,
						label: t([`9:30–${clock(minute)}`, `9:30–${clock(minute)}`]),
						tone: "neutral",
					},
				];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The Oct 18 105 call's cumulative Monday volume against a typical day's, through the session",
						"10月18日 105 看涨周一累计成交量与典型日的对比，贯穿整个交易时段",
					])}
					height={(width) => (width < 520 ? 250 : 280)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 250 : 280}
							xRange={[0, 390]}
							yRange={[0, 600]}
							xTicks={[0, 90, 210, 390]}
							yTicks={[0, 200, 400, 600]}
							lines={lines}
							markers={markers}
							bands={bands}
							drag={
								explore
									? {
											markerId: "today",
											min: 15,
											max: 390,
											step: 15,
											onChange: (value) => setExplore({ minute: value }),
										}
									: undefined
							}
							formatX={clock}
							formatY={(value) => count(value)}
							xLabel={t(["Monday, ET", "周一，美东时间"])}
							title={t([
								"Oct 18 105 call · contracts traded so far",
								"10月18日 105 看涨 · 截至当时的成交张数",
							])}
						/>
					)}
				</Stage>
			}
			result={
				minute === null
					? [
							{
								id: "day",
								label: t(["Monday total", "周一合计"]),
								value: count(CALL_105.volume),
								note: t([
									`typical day ${CALL_105.typical}`,
									`典型日 ${CALL_105.typical}`,
								]),
							},
						]
					: [
							{
								id: "today",
								label: t([
									`Traded by ${clock(minute)}`,
									`截至 ${clock(minute)} 成交`,
								]),
								value: count(today),
							},
							{
								id: "typical",
								label: t([
									`Typical by ${clock(minute)}`,
									`截至 ${clock(minute)} 典型量`,
								]),
								value: count(Math.round(typical)),
							},
							{
								id: "ratio",
								label: t(["Relative volume", "相对成交量"]),
								value:
									typical > 0
										? ratio(today / typical)
										: t(["unavailable", "不可用"]),
								note: t(["same window, both sides", "分子分母同一窗口"]),
								evidence: typical > 0 ? "calculated" : "unknown",
							},
						]
			}
			controls={
				explore ? (
					<RangeControl
						label={t(["Compare up to", "比较截至"])}
						value={explore.minute ?? 90}
						display={clock(explore.minute ?? 90)}
						min={15}
						max={390}
						step={15}
						onChange={(value) => setExplore({ minute: value })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Intraday, compare today's volume so far with what a typical day has done by the same time, not with a whole day. Trading bunches up at the open and close, so a morning is not a fixed fraction of a day. Complete sessions compare cleanly with complete sessions.",
						"盘中比较时，应把今天截至目前的成交量，与典型日截至同一时刻的量相比，而不是与整天相比。交易集中在开盘和收盘，所以上午并不是一天中固定的一部分。完整交易日之间可以直接比较。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: a screen picks a population ———

type ScreenState = { threshold: number | null; reveal: boolean };

const SCREEN_ROW = 50;
const SCREEN_MAX = 5;

function ScreenBars({
	width,
	state,
	locale,
}: {
	width: number;
	state: ScreenState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const narrow = width < 520;
	const labelWidth = narrow ? 0 : 150;
	const left = 14 + labelWidth;
	const right = width - 54;
	const x = (value: number) =>
		left + (Math.min(value, SCREEN_MAX) / SCREEN_MAX) * (right - left);
	const top = 28;
	return (
		<g>
			<Label x={14} y={16} tone="muted">
				{t(["Relative volume, Monday", "周一相对成交量"])}
			</Label>
			{/* Highlights first, then the threshold line, then the rows: the line runs under the
			    labels' halos instead of striking through them. */}
			{mondayActivity.map((row, i) => {
				const value = row.volume / row.typical;
				const pass = state.threshold !== null && value >= state.threshold;
				return pass ? (
					<Appear key={row.id}>
						<rect
							x={8}
							y={top + i * SCREEN_ROW - 2}
							width={width - 16}
							height={SCREEN_ROW - 6}
							rx={10}
							className="wt-focus-shape"
						/>
					</Appear>
				) : null;
			})}
			{state.threshold !== null ? (
				<Appear>
					<m.g
						initial={false}
						animate={{ x: x(state.threshold) }}
						transition={motion.move}
					>
						<path
							d={`M0 ${top - 6}V${top + mondayActivity.length * SCREEN_ROW - 4}`}
							className="wt-bracket"
						/>
						<Label
							x={0}
							y={top + mondayActivity.length * SCREEN_ROW + 12}
							anchor="middle"
							tone="accent"
						>
							{t([
								`screen ${ratio(state.threshold)}`,
								`筛选 ${ratio(state.threshold)}`,
							])}
						</Label>
					</m.g>
				</Appear>
			) : null}
			{mondayActivity.map((row, i) => {
				const value = row.volume / row.typical;
				const pass = state.threshold !== null && value >= state.threshold;
				const y = top + i * SCREEN_ROW;
				const barY = narrow ? y + 20 : y + 6;
				return (
					<g key={row.id}>
						<Label
							x={14}
							y={narrow ? y + 14 : y + 20}
							tone={pass ? "accent" : undefined}
							className="wt-halo"
						>
							{t(row.label)}
						</Label>
						<m.rect
							x={left}
							y={barY}
							height={16}
							rx={3}
							className={pass ? "wt-chip" : "wt-long-soft"}
							initial={false}
							animate={{ width: x(value) - left }}
							transition={motion.move}
						/>
						<Label x={x(value) + 6} y={barY + 13} className="wt-halo">
							{ratio(value)}
						</Label>
					</g>
				);
			})}
		</g>
	);
}

function ScreenView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ScreenState;
	explore: ScreenState | null;
	setExplore: (next: ScreenState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const flagged = mondayActivity.filter(
		(row) =>
			shown.threshold !== null && row.volume / row.typical >= shown.threshold,
	);
	const context: Partial<Record<ActivityId, Copy>> = {
		"oct18-105": ["one 500-lot, a spread leg", "一笔 500 张，价差的一条腿"],
		"dec20-110": ["12 contracts in a thin series", "冷门合约中的 12 张"],
		"oct18-110": ["a spread leg and a sweep", "价差腿与一笔扫单"],
		"oct18-100": ["three ordinary trades", "三笔普通成交"],
	};
	const result: ResultItem[] =
		shown.threshold === null
			? [
					{
						id: "screened",
						label: t(["Calls screened", "筛选的看涨期权"]),
						value: String(mondayActivity.length),
					},
				]
			: [
					{
						id: "flagged",
						label: t(["Flagged", "被标记"]),
						value: String(flagged.length),
						note: flagged.map((row) => t(row.label)).join(" · "),
					},
					...(shown.reveal
						? flagged.map((row) => ({
								id: row.id,
								label: t(row.label),
								value: t(context[row.id] ?? ["", ""]),
								evidence: "observed" as const,
							}))
						: []),
				];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Relative volume for four ALFA calls with a screening threshold",
						"四个 ALFA 看涨期权的相对成交量及筛选阈值",
					])}
					height={28 + mondayActivity.length * SCREEN_ROW + 24}
				>
					{(width) => (
						<ScreenBars width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<RangeControl
						label={t(["Screen threshold", "筛选阈值"])}
						value={explore.threshold ?? 2}
						display={ratio(explore.threshold ?? 2)}
						min={0.5}
						max={5}
						step={0.5}
						onChange={(value) => setExplore({ ...explore, threshold: value })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A threshold such as 2× is a choice that decides which contracts you look at. Moving it changes the population, not the market. Flags are research prompts: check what actually traded, how liquid the series is, and whether an event explains it before drawing conclusions. Averaging ratios across rows also differs from dividing total volume by total baseline.",
						"像 2× 这样的阈值是一种选择，决定你看哪些合约。移动阈值改变的是样本，而不是市场。标记只是研究线索：在下结论之前，先查看实际成交了什么、该合约流动性如何、是否有事件可以解释。对各行比率求平均，也不同于用总成交量除以总基准。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const ALL: readonly ActivityId[] = mondayActivity.map((row) => row.id);

const scenes = [
	defineScene<DenominatorState, DenominatorState>({
		id: "denominator",
		label: ["Change the denominator", "改变分母"],
		title: ["Unusual compared with what?", "异常，是和什么比？"],
		predict: {
			prompt: [
				"The Oct 18 105 call traded 505 contracts with 1,200 outstanding: a volume-to-OI ratio of 0.42×. The Dec 20 110 call traded 12 with 3 outstanding. What is its ratio?",
				"10月18日 105 看涨成交 505 张、未平仓 1,200 张：成交量/未平仓量比率为 0.42×。12月20日 110 看涨成交 12 张、未平仓 3 张。它的比率是多少？",
			],
			choices: [
				{ id: "thin", label: ["4×", "4×"] },
				{ id: "inverted", label: ["0.25×", "0.25×"] },
				{
					id: "busy",
					label: [
						"Below 0.42×: it traded far less",
						"低于 0.42×：它成交少得多",
					],
				},
			],
			answer: "thin",
			entry: { answer: 4, tolerance: 0.05, unit: ["×", "×"] },
			revealAt: 2,
			explain: [
				"12 ÷ 3 = 4×, nearly ten times the 105 call's 0.42×. The tiny denominator does the work; the thin series isn't ten times more important.",
				"12 ÷ 3 = 4×，接近 105 看涨 0.42× 的十倍。起作用的是极小的分母；这个冷门合约并不因此重要十倍。",
			],
		},
		beats: [
			{
				id: "relative",
				label: ["Against typical", "对比典型量"],
				caption: [
					"The Oct 18 105 call traded 505 contracts on Monday against a typical 120: 4.2× its usual volume.",
					"10月18日 105 看涨周一成交 505 张，典型量为 120：是平常的 4.2 倍。",
				],
				state: { base: "typical", rows: ["oct18-105"] },
			},
			{
				id: "oi",
				label: ["Against open interest", "对比未平仓量"],
				caption: [
					"Against open interest the same 505 is 0.42× of the 1,200 contracts outstanding. A different denominator asks a different question.",
					"对比未平仓量，同样的 505 张只是 1,200 张存续合约的 0.42 倍。换一个分母，就是问另一个问题。",
				],
				state: { base: "oi", rows: ["oct18-105"] },
			},
			{
				id: "tiny",
				label: ["A tiny denominator", "极小的分母"],
				caption: [
					"The Dec 20 110 call traded just 12, but only 3 were outstanding: volume/OI of 4×, ten times the 105 call's ratio.",
					"12月20日 110 看涨只成交 12 张，但只有 3 张存续：成交量/未平仓量为 4×，是 105 看涨的十倍。",
				],
				state: { base: "oi", rows: ["oct18-105", "dec20-110"] },
			},
			{
				id: "all",
				label: ["Four calls", "四个看涨"],
				caption: [
					"Against typical volume, four ALFA calls range from 0.8× to 4.2×. Every ratio needs its denominator named.",
					"对比典型成交量，四个 ALFA 看涨期权从 0.8× 到 4.2× 不等。每个比率都要说明分母是什么。",
				],
				state: { base: "typical", rows: ALL },
			},
		],
		explore: {
			prompt: [
				"Switch the denominator for all four calls.",
				"为四个看涨期权切换分母。",
			],
			start: () => ({ base: "oi", rows: ALL }),
			task: {
				kind: "answer",
				prompt: [
					"Compare volume with open interest. Which call looks most unusual?",
					"拿成交量与未平仓量比较。哪份看涨看起来最异常？",
				],
				choices: [
					{ id: "thin", label: ["The Dec 20 110 call", "12月20日 110 看涨"] },
					{ id: "busy", label: ["The Oct 18 105 call", "10月18日 105 看涨"] },
					{ id: "atm", label: ["The Oct 18 100 call", "10月18日 100 看涨"] },
				],
				answer: "thin",
				done: [
					"12 contracts against 3 outstanding is 4×, the highest ratio, on the fewest contracts. The tiny denominator does the work; name it with every ratio.",
					"12 张对 3 张存续合约是 4 倍，比值最高，但张数最少。是极小的分母造成了这个结果；每个比值都要说明分母。",
				],
			},
		},
		View: DenominatorView,
	}),
	defineScene<WindowState, WindowState>({
		id: "window",
		label: ["Match the window", "对齐窗口"],
		title: ["Compare the same part of the session", "比较交易时段中的同一部分"],
		predict: {
			prompt: [
				"By 11:00 the 105 call had traded 505. A typical day does 120 in total and 36 by 11:00. What is its relative volume at 11:00?",
				"截至 11:00，105 看涨已成交 505 张。典型日全天 120 张，截至 11:00 为 36 张。11:00 时它的相对成交量是多少？",
			],
			choices: [
				{
					id: "morning",
					label: ["14×, against a typical morning", "14×，对比典型的上午"],
				},
				{ id: "day", label: ["4.2×, against a full day", "4.2×，对比整天"] },
				{ id: "either", label: ["Either works", "两者都可以"] },
			],
			answer: "morning",
			entry: { answer: 14, unit: ["×", "×"], tolerance: 0.5 },
			revealAt: 1,
			explain: [
				"Numerator and denominator must cover the same window. By 11:00 a typical day has done 36, so 505 is 14× a normal morning.",
				"分子和分母必须覆盖同一窗口。典型日截至 11:00 成交 36 张，所以 505 张是正常上午的 14 倍。",
			],
		},
		beats: [
			{
				id: "curves",
				label: ["Two curves", "两条曲线"],
				caption: [
					"Monday's cumulative volume in the 105 call (solid) against a typical day's (dashed): 5 at 10:12, then the 500-lot at 10:50.",
					"105 看涨周一的累计成交量（实线）与典型日（虚线）：10:12 成交 5 张，10:50 成交 500 张大单。",
				],
				state: { minute: null },
			},
			{
				id: "morning",
				label: ["By 11:00", "截至 11:00"],
				caption: [
					"At 11:00, 505 have traded against 36 by that time on a typical day: 14×.",
					"11:00 时已成交 505 张，典型日同一时刻为 36 张：14 倍。",
				],
				state: { minute: 90 },
			},
			{
				id: "close",
				label: ["At the close", "收盘时"],
				caption: [
					"At the close, full day against full day: 505 against 120 is 4.2×. Same trades, a different window, so always say which window.",
					"收盘时，整天对整天：505 对 120，为 4.2 倍。成交相同，窗口不同，所以一定要说明用的是哪个窗口。",
				],
				state: { minute: 390 },
			},
		],
		explore: {
			prompt: [
				"Move the comparison time and watch the ratio change.",
				"移动比较时刻，观察比率如何变化。",
			],
			start: () => ({ minute: 60 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the earliest comparison time at which the 105 call is running at more than 10× a typical day's pace.",
					"找出 105 看涨的成交节奏首次超过典型交易日 10 倍的最早比较时刻。",
				],
				reached: (e) => e.minute === 90,
				done: [
					"By 11:00 the 500-lot has printed and a typical day has done only 36: about 14×. A quarter-hour earlier the block hadn't happened. The window decides the ratio.",
					"到 11:00，500 张的大单已成交，而典型交易日此时只成交 36 张：约 14 倍。早一刻钟，这笔大单还没发生。比较窗口决定了比值。",
				],
			},
		},
		View: WindowView,
	}),
	defineScene<ScreenState, ScreenState>({
		id: "screen",
		label: ["Inspect the screen", "检查筛选"],
		title: ["A threshold picks who you look at", "阈值决定你观察哪些合约"],
		predict: {
			prompt: [
				"A screen flags calls trading at 2× their usual volume. What does a flag tell you?",
				"一个筛选器标记成交量达到平常 2 倍的看涨期权。一个标记能告诉你什么？",
			],
			choices: [
				{
					id: "look",
					label: [
						"Where to look next, nothing more",
						"下一步该看哪里，仅此而已",
					],
				},
				{
					id: "inside",
					label: ["Someone has inside information", "有人掌握内幕信息"],
				},
				{ id: "open", label: ["New positions were opened", "开立了新持仓"] },
			],
			answer: "look",
			revealAt: 2,
			explain: [
				"The two flags turn out to be one spread leg and 12 contracts in a thin series. A flag says where to dig, not what happened.",
				"两个标记原来是一条价差腿和冷门合约里的 12 张。标记告诉你该往哪里查，而不是发生了什么。",
			],
		},
		beats: [
			{
				id: "bars",
				label: ["Four calls", "四个看涨"],
				caption: [
					"Monday's relative volume for four ALFA calls, from 0.8× in the Oct 18 100 call to 4.2× in the Oct 18 105 call.",
					"四个 ALFA 看涨期权周一的相对成交量，从 10月18日 100 看涨的 0.8× 到 10月18日 105 看涨的 4.2×。",
				],
				state: { threshold: null, reveal: false },
			},
			{
				id: "screen",
				label: ["A 2× screen", "2× 筛选"],
				caption: [
					"A 2× screen flags two: the Oct 18 105 call at 4.2× and the Dec 20 110 call at 3.0×.",
					"2× 的筛选标记出两个：4.2× 的 10月18日 105 看涨和 3.0× 的 12月20日 110 看涨。",
				],
				state: { threshold: 2, reveal: false },
			},
			{
				id: "look",
				label: ["Look closer", "细看"],
				caption: [
					"One flag is a single 500-lot spread leg; the other is 12 contracts in a thin series. The screen chose where to look, not what happened.",
					"一个标记是一笔 500 张的价差腿；另一个是冷门合约里的 12 张。筛选决定了看哪里，而不是发生了什么。",
				],
				state: { threshold: 2, reveal: true },
			},
		],
		explore: {
			prompt: [
				"Move the threshold and watch which calls it picks.",
				"移动阈值，观察它选中哪些看涨期权。",
			],
			start: () => ({ threshold: 1.5, reveal: true }),
			task: {
				kind: "reach",
				prompt: [
					"Set the threshold so the screen flags exactly one call.",
					"设定阈值，让筛选只标出一份看涨。",
				],
				reached: (e) =>
					mondayActivity.filter(
						(row) =>
							e.threshold !== null && row.volume / row.typical >= e.threshold,
					).length === 1,
				done: [
					"Above 3.0× only the 105 call's 4.2× clears it, and that flag is one 500-contract spread leg. A stricter screen narrows where you look; it doesn't explain what happened.",
					"高于 3.0 倍时只有 105 看涨的 4.2 倍能通过，而这个标记只是一笔 500 张价差交易的一条腿。更严格的筛选只缩小查看范围，并不能解释发生了什么。",
				],
			},
		},
		View: ScreenView,
	}),
] as const;

export function UnusualActivityWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="unusual-activity"
			label={["Interactive lesson on unusual activity", "异常活动互动课"]}
			scenes={scenes}
		/>
	);
}
