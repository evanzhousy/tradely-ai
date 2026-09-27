import * as m from "motion/react-m";
import {
	type Copy,
	count,
	mondayPacket,
	type PacketRow,
	packetContracts,
	pick,
	rowContracts,
	rowPremium,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import { type Bar, BarChart } from "../walkthrough/instruments/bar-chart";
import { Label, Stage, useStage, useTeachMotion } from "../walkthrough/stage";
import { wrapText } from "../walkthrough/text-measure";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);
const dollars = (cents: number) => usd(cents, 0);

type Metric = "contracts" | "premium";

const measureOf = (row: PacketRow, metric: Metric) =>
	metric === "contracts" ? rowContracts(row) : rowPremium(row);
const leaderOf = (metric: Metric) =>
	mondayPacket.reduce((best, row) =>
		(measureOf(row, metric) ?? -1) > (measureOf(best, metric) ?? -1)
			? row
			: best,
	);
const bars = (metric: Metric): Bar[] =>
	mondayPacket.map((row) => ({
		id: row.id,
		label: String(row.strike),
		value: measureOf(row, metric),
	}));

/** Premium in thousands on narrow stages so neighbouring labels don't collide. */
const formatter = (metric: Metric, width: number) =>
	metric === "contracts"
		? count
		: width < 520
			? (cents: number) =>
					cents === 0 ? "$0" : `$${Number((cents / 100_000).toFixed(1))}K`
			: dollars;

const PREMIUM_MAX = 12_000_000;
const CONTRACTS_MAX = 600;
const chartMax = (metric: Metric) =>
	metric === "contracts" ? CONTRACTS_MAX : PREMIUM_MAX;

const metricName: Record<Metric, Copy> = {
	contracts: ["contracts", "张数"],
	premium: ["premium", "权利金"],
};
const chartTitle = (metric: Metric): Copy =>
	metric === "contracts"
		? [
				"Contracts by strike · ALFA Oct 18 calls · Mon",
				"各行权价成交张数 · ALFA 10月18日 看涨 · 周一",
			]
		: [
				"Premium by strike · ALFA Oct 18 calls · Mon",
				"各行权价权利金 · ALFA 10月18日 看涨 · 周一",
			];
const strikeAxis: Copy = ["strike", "行权价"];

const leadValue = (metric: Metric) => {
	const value = measureOf(leaderOf(metric), metric) ?? 0;
	return metric === "contracts" ? count(value) : dollars(value);
};
const headline = (metric: Metric): Copy =>
	metric === "contracts"
		? [
				`Most contracts: the ${leaderOf(metric).strike} call, ${leadValue(metric)}`,
				`成交张数最多：${leaderOf(metric).strike} 看涨，${leadValue(metric)} 张`,
			]
		: [
				`Most premium: the ${leaderOf(metric).strike} call, ${leadValue(metric)}`,
				`权利金最多：${leaderOf(metric).strike} 看涨，${leadValue(metric)}`,
			];

// ——— Scene 1: the chart must show the claimed quantity ———

type MatchState = { claim: Metric; chart: Metric };

function headlineLayout(width: number, text: string) {
	const lines = wrapText(text, width - 32, 13);
	const verdictY = 42 + lines.length * 17;
	return { lines, verdictY, height: verdictY + 12 };
}
const MATCH_CHART = 230;

function MatchStage({
	width,
	state,
	locale,
}: {
	width: number;
	state: MatchState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const text = t(headline(state.claim));
	const layout = headlineLayout(width, text);
	const backed = state.claim === state.chart;
	return (
		<g>
			<rect
				x={4}
				y={4}
				width={width - 8}
				height={layout.height - 4}
				rx={10}
				className={backed ? "wt-panel-shape" : "wt-focus-shape"}
			/>
			<Label x={16} y={22} tone="small">
				{t(["Recap headline", "复盘标题"])}
			</Label>
			<m.g
				key={text}
				initial={motion.enabled ? { opacity: 0 } : false}
				animate={{ opacity: 1 }}
				transition={motion.fade}
			>
				{layout.lines.map((line, i) => (
					<Label key={line} x={16} y={42 + i * 17}>
						{line}
					</Label>
				))}
			</m.g>
			<Label x={16} y={layout.verdictY} tone={backed ? "gain" : "loss"}>
				{backed
					? t(["the chart below shows this", "下方图表显示了这一点"])
					: t([
							`the chart below shows ${pick(metricName[state.chart], "en")}, not ${pick(metricName[state.claim], "en")}`,
							`下方图表显示的是${pick(metricName[state.chart], "zh")}，不是${pick(metricName[state.claim], "zh")}`,
						])}
			</Label>
			<g transform={`translate(0 ${layout.height + 8})`}>
				<BarChart
					width={width}
					height={MATCH_CHART}
					bars={bars(state.chart)}
					max={chartMax(state.chart)}
					format={formatter(state.chart, width)}
					title={t(chartTitle(state.chart))}
					axisTitle={t(strikeAxis)}
					focus={leaderOf(state.chart).id}
				/>
			</g>
		</g>
	);
}

function MatchView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: MatchState;
	explore: MatchState | null;
	setExplore: (next: MatchState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const backed = shown.claim === shown.chart;
	const chartLeader = leaderOf(shown.chart);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A recap headline above a bar chart by strike, with a note on whether the chart shows the quantity the headline claims",
						"复盘标题与下方按行权价的柱状图，并注明图表是否显示了标题所说的量",
					])}
					height={(width) =>
						headlineLayout(width, t(headline(shown.claim))).height +
						8 +
						MATCH_CHART
					}
				>
					{(width) => (
						<MatchStage width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={[
				{
					id: "claim",
					label: t(["Headline measures", "标题衡量的是"]),
					value: t(metricName[shown.claim]),
					note: t([
						`leader: ${leaderOf(shown.claim).strike} call`,
						`最多：${leaderOf(shown.claim).strike} 看涨`,
					]),
				},
				{
					id: "chart",
					label: t(["Chart shows", "图表显示的是"]),
					value: t(metricName[shown.chart]),
					note: t([
						`tallest: ${chartLeader.strike} call`,
						`最高：${chartLeader.strike} 看涨`,
					]),
				},
				{
					id: "backed",
					label: t(["Chart backs the headline", "图表支持标题"]),
					value: backed ? t(["yes", "是"]) : t(["no", "否"]),
					tone: backed ? "gain" : "loss",
				},
			]}
			controls={
				explore ? (
					<>
						<ChoiceField
							label={t(["Headline", "标题"])}
							value={explore.claim}
							options={[
								["contracts", t(["Contracts", "张数"])],
								["premium", t(["Premium", "权利金"])],
							]}
							onChange={(claim) => setExplore({ ...explore, claim })}
						/>
						<ChoiceField
							label={t(["Chart", "图表"])}
							value={explore.chart}
							options={[
								["contracts", t(["Contracts", "张数"])],
								["premium", t(["Premium", "权利金"])],
							]}
							onChange={(chart) => setExplore({ ...explore, chart })}
						/>
					</>
				) : null
			}
			details={
				<p>
					{t([
						"Contracts and premium rank the same strikes differently: the 110 call traded the most contracts, the 105 call the most premium, because its contracts cost more than twice as much. A chart can only back a headline about the quantity it plots. Different measures need their own charts or panels, each with honest units.",
						"张数和权利金会给同样的行权价排出不同的顺序：110 看涨成交张数最多，105 看涨权利金最多，因为它每张的价格是 110 的两倍多。图表只能支持关于它所画的那个量的标题。不同的量需要各自的图表或面板，并标明真实的单位。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: true labels on misleading bars ———

type AxisState = { min: number };

const r2 = mondayPacket.find((row) => row.strike === 105);
const r3 = mondayPacket.find((row) => row.strike === 110);
const C105 = (r2 && rowContracts(r2)) ?? 0;
const C110 = (r3 && rowContracts(r3)) ?? 0;
const AXIS_CHART = 250;

function AxisView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: AxisState;
	explore: AxisState | null;
	setExplore: (next: AxisState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const drawn = (value: number) => Math.max(value - shown.min, 0);
	const visual = drawn(C105) > 0 ? drawn(C110) / drawn(C105) : null;
	const hidden = mondayPacket.filter((row) => {
		const value = rowContracts(row);
		return shown.min > 0 && value !== null && value <= shown.min;
	});
	const result: ResultItem[] = [
		{
			id: "true",
			label: t(["110 call vs 105 call", "110 看涨对比 105 看涨"]),
			value: `${(C110 / C105).toFixed(2)}×`,
			note: t([`${C110} ÷ ${C105} contracts`, `${C110} ÷ ${C105} 张`]),
			evidence: "calculated",
		},
		{
			id: "visual",
			label: t(["Bar heights", "柱高之比"]),
			value: visual === null ? "—" : `${visual.toFixed(visual < 2 ? 2 : 1)}×`,
			note: t([
				`axis starts at ${count(shown.min)}`,
				`轴从 ${count(shown.min)} 开始`,
			]),
			tone: visual !== null && visual > 1.2 ? "loss" : undefined,
		},
	];
	if (hidden.length)
		result.push({
			id: "hidden",
			label: t(["No visible bar", "没有可见柱"]),
			value: hidden.map((row) => row.strike).join(", "),
			note: t([
				`${hidden.map((row) => count(rowContracts(row) ?? 0)).join(" and ")} contracts look the same`,
				`${hidden.map((row) => count(rowContracts(row) ?? 0)).join(" 张与 ")} 张看起来一样`,
			]),
			tone: "loss",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Contracts by strike with an adjustable starting point for the value axis; the printed values stay the same while bar heights change",
						"按行权价的成交张数，数值轴起点可调；柱高变化而标出的数值不变",
					])}
					height={AXIS_CHART}
				>
					{(width) => (
						<BarChart
							width={width}
							height={AXIS_CHART}
							bars={bars("contracts")}
							min={shown.min}
							max={CONTRACTS_MAX}
							format={count}
							title={t(chartTitle("contracts"))}
							axisTitle={t(strikeAxis)}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<RangeControl
						label={t(["Axis starts at", "轴的起点"])}
						value={explore.min}
						display={count(explore.min)}
						min={0}
						max={500}
						step={10}
						onChange={(min) => setExplore({ min })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Bar length is read as the quantity. Start the value axis above zero and a small difference becomes a tall one, while every printed number stays correct. Bars that fall below the axis vanish, so 20 contracts and none look alike. Start bar charts at zero, or use a chart where the baseline doesn't carry meaning and say so.",
						"人们会把柱的长度读作数量。把数值轴的起点提高到零以上，小差异就会变成大差异，而每个标出的数字都仍然正确。低于轴起点的柱会消失，于是 20 张和 0 张看起来一样。柱状图应从零开始；如果换用基线不承载含义的图，也要说明。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: a headline and caption the packet supports ———

type ComposeState = { step: 0 | 1 | 2 };

const leader = leaderOf("contracts");
const drafts: Record<"over" | "bounded", Copy> = {
	over: [
		`Call buyers piled into ALFA's ${leader.strike} strike, Monday's busiest call`,
		`看涨买家涌入 ALFA ${leader.strike} 行权价，周一最活跃的看涨`,
	],
	bounded: [
		`${count(rowContracts(leader) ?? 0)} contracts traded in ALFA's Oct 18 ${leader.strike} call on Monday, the most of the four strikes with data`,
		`周一 ALFA 10月18日 ${leader.strike} 看涨成交 ${count(rowContracts(leader) ?? 0)} 张，在有数据的四个行权价中最多`,
	],
};
const caption: Copy = [
	"Contracts by strike, axis from 0. ALFA Oct 18 calls, Mon Sep 16, corrected tape as of 16:05 (packet P1). 120 call: no data yet.",
	"按行权价的成交张数，轴从 0 开始。ALFA 10月18日 看涨，9月16日周一，截至 16:05 的更正后成交记录（研究包 P1）。120 看涨：尚无数据。",
];
const CARD_CHART = 160;

function composeLayout(width: number, locale: Locale, step: number) {
	const head = wrapText(
		pick(step >= 1 ? drafts.bounded : drafts.over, locale),
		width - 32,
		13,
	);
	const note = wrapText(pick(caption, locale), width - 32, 11);
	const chartY = 38 + head.length * 17 + 4;
	const captionY = chartY + CARD_CHART + 6;
	return {
		head,
		note,
		chartY,
		captionY,
		height: captionY + note.length * 15 + 14,
	};
}

/** Tallest layout across steps, so the stage doesn't jump as the headline changes. */
const composeHeight = (width: number, locale: Locale) =>
	Math.max(
		composeLayout(width, locale, 0).height,
		composeLayout(width, locale, 1).height,
	);

function RecapCard({
	width,
	state,
	locale,
}: {
	width: number;
	state: ComposeState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const { hatch } = useStage();
	const layout = composeLayout(width, locale, state.step);
	const height = composeHeight(width, locale);
	return (
		<g>
			<rect
				x={4}
				y={4}
				width={width - 8}
				height={height - 8}
				rx={12}
				className="wt-panel-shape"
			/>
			<Label x={16} y={24} tone="small">
				{state.step >= 1
					? t(["Recap draft · revised", "复盘草稿 · 已修改"])
					: t(["Recap draft", "复盘草稿"])}
			</Label>
			<m.g
				key={state.step >= 1 ? "bounded" : "over"}
				initial={motion.enabled ? { opacity: 0 } : false}
				animate={{ opacity: 1 }}
				transition={motion.fade}
			>
				{layout.head.map((line, i) => (
					<Label
						key={line}
						x={16}
						y={44 + i * 17}
						tone={state.step >= 1 ? undefined : "loss"}
					>
						{line}
					</Label>
				))}
			</m.g>
			<g transform={`translate(8 ${layout.chartY})`}>
				<BarChart
					width={width - 16}
					height={CARD_CHART}
					bars={bars("contracts")}
					max={CONTRACTS_MAX}
					format={count}
					focus={leader.id}
				/>
			</g>
			{state.step >= 2 ? (
				<m.g
					initial={motion.enabled ? { opacity: 0 } : false}
					animate={{ opacity: 1 }}
					transition={motion.fade}
				>
					{layout.note.map((line, i) => (
						<Label
							key={line}
							x={16}
							y={layout.captionY + 12 + i * 15}
							tone="small"
						>
							{line}
						</Label>
					))}
				</m.g>
			) : (
				<g>
					<rect
						x={16}
						y={layout.captionY}
						width={width - 32}
						height={Math.max(layout.note.length * 15, 18)}
						rx={5}
						className="wt-ghost"
						style={{ fill: hatch }}
					/>
					<Label
						x={width / 2}
						y={layout.captionY + Math.max(layout.note.length * 15, 18) / 2 + 4}
						anchor="middle"
						tone="accent"
						className="wt-halo"
					>
						{t(["no caption yet", "尚无图注"])}
					</Label>
				</g>
			)}
		</g>
	);
}

function ComposeView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ComposeState;
	explore: ComposeState | null;
	setExplore: (next: ComposeState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const covered = packetContracts(mondayPacket);
	const result: ResultItem[] =
		shown.step === 0
			? [
					{
						id: "side",
						label: t(['"Call buyers"', "“看涨买家”"]),
						value: t(["not in the packet", "研究包里没有"]),
						note: t([
							"the 10:50 block sold 500 of the 540",
							"10:50 的大单卖出了 540 张中的 500 张",
						]),
						tone: "loss",
						evidence: "unknown",
					},
					{
						id: "busiest",
						label: t(['"Busiest call"', "“最活跃的看涨”"]),
						value: t(["4 of 5 strikes", "5 个行权价中的 4 个"]),
						note: t([
							"only Oct 18 calls; the 120 had no data",
							"只含 10月18日 看涨；120 尚无数据",
						]),
						tone: "loss",
					},
				]
			: [
					{
						id: "headline",
						label: t(["Headline", "标题"]),
						value: t(["supported", "有依据"]),
						note: t([
							`packet P1, R3: ${count(rowContracts(leader) ?? 0)} of ${count(covered)}`,
							`研究包 P1，R3：${count(covered)} 张中的 ${count(rowContracts(leader) ?? 0)} 张`,
						]),
						tone: "gain",
						evidence: "observed",
					},
					{
						id: "caption",
						label: t(["Caption", "图注"]),
						value:
							shown.step >= 2
								? t(["attached", "已附上"])
								: t(["missing", "缺失"]),
						note:
							shown.step >= 2
								? t([
										"units, axis, source, date, gap",
										"单位、坐标轴、来源、日期、缺口",
									])
								: t(["the chart can't travel alone", "图表不能单独流传"]),
						tone: shown.step >= 2 ? "gain" : "loss",
					},
				];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A recap draft with a headline, a contracts-by-strike chart and a caption that states units, source, date and the missing row",
						"复盘草稿：标题、按行权价的成交张数图，以及注明单位、来源、日期和缺失行的图注",
					])}
					height={(width) => composeHeight(width, locale)}
				>
					{(width) => <RecapCard width={width} state={shown} locale={locale} />}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Draft", "草稿"])}
						value={String(explore.step) as "0" | "1" | "2"}
						options={[
							["0", t(["First draft", "初稿"])],
							["1", t(["Bounded", "有边界"])],
							["2", t(["+ Caption", "+ 图注"])],
						]}
						onChange={(value) =>
							setExplore({ step: Number(value) as ComposeState["step"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Write the headline from the packet, not toward a story: the count, the contract, the day and the coverage. Who bought or sold, and whether it will continue, are other questions that need other evidence. The caption travels with the chart, so it carries the units, axis, source, date and any missing rows.",
						"标题要从研究包出发，而不是朝一个故事去写：张数、合约、日期和覆盖范围。谁买谁卖、会不会持续，是需要其他证据的其他问题。图注会随图表一起流传，所以要写明单位、坐标轴、来源、日期以及任何缺失的行。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const premiumLeader = leaderOf("premium");

const scenes = [
	defineScene<MatchState, MatchState>({
		id: "match",
		label: ["Match chart and claim", "匹配图表与结论"],
		title: [
			"The chart must show the claimed quantity",
			"图表必须显示所声明的量",
		],
		predict: {
			prompt: [
				`A recap says the ${premiumLeader.strike} call drew the most premium, over a chart of contracts. Does the chart back it?`,
				`一篇复盘说 ${premiumLeader.strike} 看涨的权利金最多，下面配的却是张数图。图表支持这个说法吗？`,
			],
			choices: [
				{
					id: "no",
					label: [
						`No: it plots contracts, where the ${leader.strike} call leads`,
						`不支持：它画的是张数，${leader.strike} 看涨最多`,
					],
				},
				{
					id: "tall",
					label: [
						`Yes: the ${premiumLeader.strike} bar is nearly as tall`,
						`支持：${premiumLeader.strike} 的柱几乎一样高`,
					],
				},
				{
					id: "follows",
					label: ["Yes: premium follows contracts", "支持：权利金跟着张数走"],
				},
			],
			answer: "no",
			explain: [
				`The contracts chart puts the ${leader.strike} call on top. Premium ranks the ${premiumLeader.strike} call first, ${leadValue("premium")}, because each of its contracts costs more. Only a premium chart can back a premium claim.`,
				`张数图里 ${leader.strike} 看涨最高。按权利金排序则是 ${premiumLeader.strike} 看涨第一，${leadValue("premium")}，因为它每张更贵。只有权利金图才能支持关于权利金的说法。`,
			],
		},
		beats: [
			{
				id: "contracts",
				label: ["Contracts", "张数"],
				caption: [
					`A contracts headline over a contracts chart: the ${leader.strike} call leads with ${leadValue("contracts")}. The chart backs it.`,
					`张数标题配张数图：${leader.strike} 看涨以 ${leadValue("contracts")} 张领先。图表支持它。`,
				],
				state: { claim: "contracts", chart: "contracts" },
			},
			{
				id: "mismatch",
				label: ["Mismatch", "错配"],
				caption: [
					`Now the headline claims premium, but the chart still plots contracts. Its tallest bar is the ${leader.strike} call, so it can't back a claim about the ${premiumLeader.strike}.`,
					`现在标题说的是权利金，图表却仍然画张数。最高的柱是 ${leader.strike} 看涨，所以它无法支持关于 ${premiumLeader.strike} 的说法。`,
				],
				state: { claim: "premium", chart: "contracts" },
			},
			{
				id: "premium",
				label: ["Premium", "权利金"],
				caption: [
					`Plot premium and the ${premiumLeader.strike} call leads, ${leadValue("premium")}. Headline and chart now measure the same thing.`,
					`改画权利金，${premiumLeader.strike} 看涨以 ${leadValue("premium")} 领先。标题和图表现在衡量同一个量。`,
				],
				state: { claim: "premium", chart: "premium" },
			},
		],
		explore: {
			prompt: [
				"Change the headline's measure and the chart's, and see when they agree.",
				"分别改变标题和图表所衡量的量，看看何时一致。",
			],
			start: () => ({ claim: "contracts", chart: "premium" }),
		},
		View: MatchView,
	}),
	defineScene<AxisState, AxisState>({
		id: "axis",
		label: ["Inspect the scale", "检查尺度"],
		title: [
			"True labels can sit on misleading bars",
			"真实的标签也可能配着误导的柱",
		],
		predict: {
			prompt: [
				`Start the axis at 500 and the ${leader.strike} call's bar looks 8 times the 105's. How much more did it trade?`,
				`把轴的起点设为 500，${leader.strike} 看涨的柱看起来是 105 的 8 倍。它实际多成交了多少？`,
			],
			choices: [
				{
					id: "seven",
					label: [
						`About 7% more: ${C110} vs ${C105}`,
						`约多 7%：${C110} 对 ${C105}`,
					],
				},
				{ id: "eight", label: ["8 times as much", "8 倍"] },
				{ id: "double", label: ["About twice as much", "约 2 倍"] },
			],
			answer: "seven",
			revealAt: 2,
			explain: [
				`${C110} ÷ ${C105} = ${(C110 / C105).toFixed(2)}. From an axis at 500 the bars are ${C110 - 500} and ${C105 - 500} tall, which draws 8 to 1.`,
				`${C110} ÷ ${C105} = ${(C110 / C105).toFixed(2)}。轴从 500 开始时，两根柱的高度是 ${C110 - 500} 和 ${C105 - 500}，于是画成了 8 比 1。`,
			],
		},
		beats: [
			{
				id: "zero",
				label: ["From 0", "从 0 开始"],
				caption: [
					`From zero, the ${leader.strike} and 105 calls look nearly equal, as they are: ${C110} and ${C105}.`,
					`从 0 开始，${leader.strike} 和 105 看涨看起来几乎一样高，事实也是如此：${C110} 和 ${C105}。`,
				],
				state: { min: 0 },
			},
			{
				id: "raised",
				label: ["From 480", "从 480 开始"],
				caption: [
					"Start the axis at 480 and the gap widens to 2.4 to 1, though no number changed. The 100 call's 20 contracts vanish.",
					"把轴的起点设为 480，差距扩大到 2.4 比 1，而没有任何数字改变。100 看涨的 20 张消失了。",
				],
				state: { min: 480 },
			},
			{
				id: "cropped",
				label: ["From 500", "从 500 开始"],
				caption: [
					`At 500 the bars read 8 to 1, while their labels still say ${C110} and ${C105}.`,
					`从 500 开始，柱高成了 8 比 1，而标签仍然写着 ${C110} 和 ${C105}。`,
				],
				state: { min: 500 },
			},
		],
		explore: {
			prompt: [
				"Move the axis start and compare the bar heights with the labels.",
				"移动轴的起点，比较柱高与标签。",
			],
			start: () => ({ min: 250 }),
		},
		View: AxisView,
	}),
	defineScene<ComposeState, ComposeState>({
		id: "compose",
		label: ["Build a bounded recap", "构建有边界的复盘"],
		title: ["Keep the limitation beside the claim", "把限制放在结论旁边"],
		predict: {
			prompt: [
				"Which headline does packet P1 support?",
				"研究包 P1 支持哪个标题？",
			],
			choices: [
				{
					id: "bounded",
					label: [
						`${count(rowContracts(leader) ?? 0)} contracts in the ${leader.strike} call, the most of the four strikes with data`,
						`${leader.strike} 看涨成交 ${count(rowContracts(leader) ?? 0)} 张，在有数据的四个行权价中最多`,
					],
				},
				{
					id: "buyers",
					label: [
						`Call buyers piled into the ${leader.strike} strike`,
						`看涨买家涌入 ${leader.strike} 行权价`,
					],
				},
				{
					id: "busiest",
					label: [
						`The ${leader.strike} call was Monday's busiest ALFA option`,
						`${leader.strike} 看涨是周一 ALFA 最活跃的期权`,
					],
				},
			],
			answer: "bounded",
			explain: [
				"The packet counts contracts by strike; it doesn't say who bought or sold, and 500 of the 540 were the sold leg of the 10:50 spread. It covers only Oct 18 calls, with the 120 call missing, so 'busiest ALFA option' reaches past it.",
				"研究包按行权价统计张数，并不说明谁买谁卖；540 张中的 500 张是 10:50 价差卖出的那条腿。它只覆盖 10月18日 看涨，且 120 看涨缺失，所以“ALFA 最活跃的期权”超出了它的范围。",
			],
		},
		beats: [
			{
				id: "draft",
				label: ["First draft", "初稿"],
				caption: [
					"The first draft names buyers the packet can't see and a 'busiest call' it didn't fully cover, and it has no caption.",
					"初稿提到了研究包看不到的买家，以及它没有完整覆盖的“最活跃看涨”，而且没有图注。",
				],
				state: { step: 0 },
			},
			{
				id: "bounded",
				label: ["Bounded", "有边界"],
				caption: [
					"The revised headline says only what packet P1 shows: the count, the contract, the day and the coverage.",
					"修改后的标题只说研究包 P1 显示的内容：张数、合约、日期和覆盖范围。",
				],
				state: { step: 1 },
			},
			{
				id: "caption",
				label: ["Caption", "图注"],
				caption: [
					"The caption travels with the chart: units, axis, source and date, and the 120 call's gap.",
					"图注随图表一起流传：单位、坐标轴、来源和日期，以及 120 看涨的缺口。",
				],
				state: { step: 2 },
			},
		],
		explore: {
			prompt: ["Step through the drafts.", "逐步查看各版草稿。"],
			start: () => ({ step: 2 }),
		},
		View: ComposeView,
	}),
] as const;

export function MarketRecapWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="market-recap"
			label={[
				"Interactive lesson on recaps your evidence supports",
				"有依据的复盘互动课",
			]}
			scenes={scenes}
		/>
	);
}
