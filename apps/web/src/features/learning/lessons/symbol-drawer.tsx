import * as m from "motion/react-m";
import {
	type Copy,
	count,
	modelVolatility,
	mondayActivity,
	oct100CallMonday,
	pick,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import { Label, Stage, useStage, useTeachMotion } from "../walkthrough/stage";
import { textWidth } from "../walkthrough/text-measure";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

const T1 = oct100CallMonday.trades[0];
const OI = oct100CallMonday.startOpenInterest;
const IV = modelVolatility("oct18", 100);

// ——— Scene 1: every field has its own clock ———

type ClockState = { shown: number };

const CLOCK_TOP = 30;
const CLOCK_ROW = 44;

type ClockRow = {
	id: string;
	/** Fits a phone-width stage. */
	short: Copy;
	time: Copy;
	text: Copy;
	field: Copy;
	/** The moment the drawer is being read. */
	now?: boolean;
};

const clockRows: readonly ClockRow[] = [
	{
		id: "oi-count",
		short: ["OI at the close: 100", "收盘未平仓量：100"],
		time: ["Fri 16:00", "周五 16:00"],
		text: [`OI counted at the close: ${OI}`, `收盘统计未平仓量：${OI}`],
		field: ["open interest", "未平仓量"],
	},
	{
		id: "iv",
		short: ["IV computed: 35%", "隐含波动率：35%"],
		time: ["Fri 16:00", "周五 16:00"],
		text: [
			`model IV computed: ${Math.round(IV * 100)}%`,
			`模型隐含波动率算出：${Math.round(IV * 100)}%`,
		],
		field: ["model IV", "模型 IV"],
	},
	{
		id: "oi-published",
		short: ["OI report published", "未平仓量报告发布"],
		time: ["Mon 06:30", "周一 06:30"],
		text: ["Friday's OI report published", "周五的未平仓量报告发布"],
		field: ["open interest", "未平仓量"],
	},
	{
		id: "trade",
		short: [
			`trade: ${T1.quantity} @ ${usd(T1.price)}`,
			`成交：${T1.quantity} 张 @ ${usd(T1.price)}`,
		],
		time: [`Mon ${T1.time}`, `周一 ${T1.time}`],
		text: [
			`trade: ${T1.quantity} @ ${usd(T1.price)}`,
			`成交：${T1.quantity} 张 @ ${usd(T1.price)}`,
		],
		field: ["last trade · event", "最新成交 · 事件"],
	},
	{
		id: "received",
		short: ["same trade received", "同一笔成交到达"],
		time: ["Mon 10:20", "周一 10:20"],
		text: [
			"the same trade arrives, 15 minutes late",
			"同一笔成交延迟 15 分钟到达",
		],
		field: ["last trade · receipt", "最新成交 · 接收"],
	},
	{
		id: "now",
		short: ["you read the drawer", "你查看抽屉"],
		time: ["Mon 10:30", "周一 10:30"],
		text: ["you read the ALFA drawer", "你查看 ALFA 抽屉"],
		field: ["now", "现在"],
		now: true,
	},
];

/** The order beats reveal rows in: the moment of reading first, then each field's own clock. */
const revealOrder = [
	"now",
	"iv",
	"oi-count",
	"oi-published",
	"trade",
	"received",
];

function ClockColumn({
	width,
	state,
	locale,
}: {
	width: number;
	state: ClockState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const narrow = width < 520;
	const timeWidth = narrow ? 86 : 110;
	const lineX = 8 + timeWidth;
	const visible = new Set(revealOrder.slice(0, state.shown));
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{narrow
					? t(["When each value was true", "各数值成立的时刻"])
					: t([
							"Oct 18 100 call · when each value was true",
							"10月18日 100 看涨 · 各数值成立的时刻",
						])}
			</Label>
			<path
				d={`M${lineX} ${CLOCK_TOP + 8}V${CLOCK_TOP + clockRows.length * CLOCK_ROW - 16}`}
				className="wt-axis"
			/>
			{clockRows.map((row, i) => {
				const y = CLOCK_TOP + i * CLOCK_ROW;
				const on = visible.has(row.id);
				return (
					<m.g
						key={row.id}
						initial={false}
						animate={{ opacity: on ? 1 : 0.12 }}
						transition={motion.fade}
					>
						<Label x={8} y={y + 18} tone={row.now ? "accent" : "small"}>
							{t(row.time)}
						</Label>
						<circle
							cx={lineX}
							cy={y + 14}
							r={row.now ? 7 : 5}
							className={row.now ? "wt-chip" : "wt-panel-shape"}
							stroke="var(--foreground)"
							strokeWidth={1.25}
						/>
						<Label
							x={lineX + 16}
							y={y + 18}
							tone={row.now ? "accent" : undefined}
						>
							{t(narrow ? row.short : row.text)}
						</Label>
						<Label x={lineX + 16} y={y + 34} tone="small">
							{t(row.field)}
						</Label>
					</m.g>
				);
			})}
		</g>
	);
}

function ClockView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ClockState;
	explore: ClockState | null;
	setExplore: (next: ClockState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const visible = new Set(revealOrder.slice(0, shown.shown));
	const result: ResultItem[] = [
		{
			id: "oi",
			label: t(["Open interest", "未平仓量"]),
			value: String(OI),
			note: visible.has("oi-count")
				? t(["true at Friday's close", "周五收盘时成立"])
				: t(["as of when?", "截至何时？"]),
			evidence: visible.has("oi-count") ? "observed" : "unknown",
		},
		{
			id: "iv",
			label: t(["Implied volatility", "隐含波动率"]),
			value: `${Math.round(IV * 100)}%`,
			note: visible.has("iv")
				? t(["modeled, Friday 16:00", "模型值，周五 16:00"])
				: t(["as of when?", "截至何时？"]),
			evidence: visible.has("iv") ? "modeled" : "unknown",
		},
		{
			id: "last",
			label: t(["Last trade", "最新成交"]),
			value: usd(T1.price),
			note: visible.has("received")
				? t([`happened ${T1.time}, known 10:20`, `${T1.time} 发生，10:20 获知`])
				: visible.has("trade")
					? t([`happened ${T1.time}`, `${T1.time} 发生`])
					: t(["as of when?", "截至何时？"]),
			evidence: visible.has("trade") ? "observed" : "unknown",
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A timeline of when each value in ALFA's symbol drawer was true and when it arrived",
						"ALFA 标的抽屉中各数值成立与到达时刻的时间线",
					])}
					height={CLOCK_TOP + clockRows.length * CLOCK_ROW}
				>
					{(width) => (
						<ClockColumn width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Clocks shown", "显示的时钟"])}
						value={String(explore.shown) as "1" | "2" | "4" | "6"}
						options={[
							["1", t(["Now", "现在"])],
							["2", t(["+ model", "+ 模型"])],
							["4", t(["+ OI", "+ 未平仓量"])],
							["6", t(["+ trade", "+ 成交"])],
						]}
						onChange={(value) => setExplore({ shown: Number(value) })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Every field carries its own clock. Event time says when something happened; receipt time says when your system learned of it. Open interest is counted at one close and published before the next open; a model value is as of its run. Read together at 10:30, they describe four different moments, and none of that is wrong as long as each is labelled.",
						"每个字段都有自己的时钟。事件时间说明事情何时发生，接收时间说明你的系统何时得知。未平仓量在一次收盘时统计，在下次开盘前发布；模型值以其计算时刻为准。在 10:30 一起读，它们描述的是四个不同的时刻；只要各自标明时间，这本身没有错。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: freshness depends on the question ———

type Requirement = "today" | "positions" | "compare";
/** No requirement yet: the sources are shown without verdicts. */
type AuditState = { requirement: Requirement | null };
type Verdict = "meets" | "partial" | "fails" | "context";

const sources: readonly { id: string; name: Copy; detail: Copy }[] = [
	{
		id: "friday",
		name: ["Friday's tape", "周五成交记录"],
		detail: ["18 contracts · Fri 09:30–16:00", "18 张 · 周五 09:30–16:00"],
	},
	{
		id: "delayed",
		name: ["Monday tape, delayed", "周一成交，延迟"],
		detail: ["10 contracts · Mon 09:30–10:15", "10 张 · 周一 09:30–10:15"],
	},
	{
		id: "oi",
		name: ["Open interest", "未平仓量"],
		detail: [`${OI} · counted Fri close`, `${OI} · 周五收盘统计`],
	},
];

const verdicts: Record<
	Requirement,
	Record<string, { verdict: Verdict; why: Copy }>
> = {
	today: {
		friday: { verdict: "fails", why: ["wrong session", "时段不对"] },
		delayed: {
			verdict: "partial",
			why: ["right session, only to 10:15", "时段正确，只到 10:15"],
		},
		oi: {
			verdict: "context",
			why: ["a count of positions, not flow", "是持仓数，不是成交流"],
		},
	},
	positions: {
		friday: {
			verdict: "context",
			why: ["trades, not positions", "是成交，不是持仓"],
		},
		delayed: {
			verdict: "context",
			why: ["trades, not positions", "是成交，不是持仓"],
		},
		oi: {
			verdict: "meets",
			why: ["the latest count there is", "已是最新的统计"],
		},
	},
	compare: {
		friday: { verdict: "meets", why: ["a complete session", "完整的交易时段"] },
		delayed: {
			verdict: "fails",
			why: ["Monday isn't complete yet", "周一尚未结束"],
		},
		oi: { verdict: "context", why: ["a different measure", "是不同的指标"] },
	},
};

const verdictCopy: Record<Verdict, Copy> = {
	meets: ["meets", "满足"],
	partial: ["partly", "部分"],
	fails: ["fails", "不满足"],
	context: ["context only", "仅作参考"],
};

/** Wide rows put the reason beside the detail; narrow rows give it its own line. */
const auditRow = (width: number) => (width < 520 ? 76 : 62);

const pillWidth = (word: string) => Math.max(56, textWidth(word, 11) + 18);

function AuditRows({
	width,
	state,
	locale,
}: {
	width: number;
	state: AuditState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const { hatch } = useStage();
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t(["Sources on file at 10:30 Monday", "周一 10:30 手头的数据源"])}
			</Label>
			{sources.map((source, i) => {
				const row = auditRow(width);
				const narrow = width < 520;
				const y = 28 + i * row;
				const v = state.requirement
					? verdicts[state.requirement][source.id]
					: null;
				const good = v?.verdict === "meets";
				return (
					<g key={source.id}>
						<rect
							x={8}
							y={y}
							width={width - 16}
							height={row - 8}
							rx={10}
							className={good ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						<Label x={20} y={y + 20}>
							{t(source.name)}
						</Label>
						<Label x={20} y={y + 40} tone="small">
							{t(source.detail)}
						</Label>
						{v ? (
							<m.g
								key={`${state.requirement}-${source.id}`}
								initial={motion.enabled ? { opacity: 0 } : false}
								animate={{ opacity: 1 }}
								transition={motion.fade}
							>
								{/* The pill fits its word, so it stays clear of a long source name. */}
								<rect
									x={width - 20 - pillWidth(t(verdictCopy[v.verdict]))}
									y={y + 8}
									width={pillWidth(t(verdictCopy[v.verdict]))}
									height={20}
									rx={10}
									className={
										v.verdict === "meets"
											? "wt-long"
											: v.verdict === "fails"
												? "wt-short"
												: "wt-panel-shape"
									}
									style={v.verdict === "partial" ? { fill: hatch } : undefined}
								/>
								<Label
									x={width - 20 - pillWidth(t(verdictCopy[v.verdict])) / 2}
									y={y + 22}
									anchor="middle"
									tone="small"
									className={
										v.verdict === "meets" || v.verdict === "fails"
											? "wt-on-solid"
											: "wt-on-soft wt-halo"
									}
								>
									{t(verdictCopy[v.verdict])}
								</Label>
								<Label
									x={narrow ? 20 : width - 20}
									y={narrow ? y + 60 : y + 44}
									anchor={narrow ? "start" : "end"}
									tone="small"
									className="wt-accent"
								>
									{t(v.why)}
								</Label>
							</m.g>
						) : null}
					</g>
				);
			})}
		</g>
	);
}

const requirementCopy: Record<Requirement, Copy> = {
	today: ["Today's option volume so far", "今天截至目前的期权成交量"],
	positions: ["Contracts outstanding", "存续合约数"],
	compare: ["A full day to compare with", "可对比的完整一天"],
};

function AuditView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: AuditState;
	explore: AuditState | null;
	setExplore: (next: AuditState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const table = shown.requirement ? verdicts[shown.requirement] : null;
	const usable = table
		? sources.filter(
				(source) =>
					table[source.id].verdict === "meets" ||
					table[source.id].verdict === "partial",
			)
		: [];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Three sources checked against one requirement at a time",
						"逐一对照需求检查三个数据源",
					])}
					height={(width) => 28 + sources.length * auditRow(width)}
				>
					{(width) => <AuditRows width={width} state={shown} locale={locale} />}
				</Stage>
			}
			result={[
				{
					id: "requirement",
					label: t(["The question", "问题"]),
					value: shown.requirement
						? t(requirementCopy[shown.requirement])
						: t(["not chosen yet", "尚未确定"]),
					evidence: shown.requirement ? undefined : "unknown",
				},
				{
					id: "usable",
					label: t(["Usable for it", "可用于此"]),
					value: usable.length
						? usable.map((source) => t(source.name)).join(" · ")
						: "—",
					note:
						shown.requirement === "today"
							? t([
									"partial: say 'through 10:15'",
									"部分满足：注明“截至 10:15”",
								])
							: undefined,
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["You need", "你需要"])}
						value={explore.requirement ?? "today"}
						options={[
							["today", t(["Today's flow", "今日成交流"])],
							["positions", t(["Outstanding", "存续合约"])],
							["compare", t(["A full day", "完整一天"])],
						]}
						onChange={(requirement) => setExplore({ requirement })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Freshness depends on the question. Friday's tape is perfectly good for comparing complete days and useless for today's flow. Friday's open interest is the newest count that exists, so it's the right input for positions all morning. When a source fails one requirement, set aside that comparison, not every source on the page.",
						"时效取决于问题。周五的成交记录用来比较完整交易日完全没问题，但对今天的成交流毫无用处。周五的未平仓量是现有最新的统计，所以整个上午都适合用来看持仓。某个数据源不满足一个需求时，放弃的是这项比较，而不是页面上的所有数据源。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: missing is not zero ———

type CoverState = { stage: 0 | 1 | 2 };

const coverRows: readonly {
	id: string;
	label: Copy;
	state: "observed" | "zero" | "missing";
	value: number | null;
}[] = [
	{
		id: "100",
		label: ["Oct 18 100 call", "10月18日 100 看涨"],
		state: "observed",
		value: mondayActivity[0].volume,
	},
	{
		id: "105",
		label: ["Oct 18 105 call", "10月18日 105 看涨"],
		state: "observed",
		value: mondayActivity[1].volume,
	},
	{
		id: "110",
		label: ["Oct 18 110 call", "10月18日 110 看涨"],
		state: "observed",
		value: mondayActivity[2].volume,
	},
	{
		id: "115",
		label: ["Oct 18 115 call", "10月18日 115 看涨"],
		state: "zero",
		value: 0,
	},
	{
		id: "120",
		label: ["Oct 18 120 call", "10月18日 120 看涨"],
		state: "missing",
		value: null,
	},
];

const COVER_ROW = 34;

function CoverTable({
	width,
	state,
	locale,
}: {
	width: number;
	state: CoverState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const { hatch } = useStage();
	const total = coverRows.reduce((sum, row) => sum + (row.value ?? 0), 0);
	const covered = coverRows.filter((row) => row.value !== null).length;
	const totalY = 28 + coverRows.length * COVER_ROW + 10;
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t([
					"Monday volume by series · Oct 18 calls",
					"周一各序列成交量 · 10月18日 看涨",
				])}
			</Label>
			{coverRows.map((row, i) => {
				const y = 28 + i * COVER_ROW;
				const emphasize = state.stage >= 1 && row.state !== "observed";
				return (
					<g key={row.id}>
						<rect
							x={8}
							y={y}
							width={width - 16}
							height={COVER_ROW - 6}
							rx={8}
							className={emphasize ? "wt-focus-shape" : "wt-panel-shape"}
							style={
								row.state === "missing" && state.stage >= 1
									? { fill: hatch }
									: undefined
							}
						/>
						<Label
							x={20}
							y={y + 19}
							className={row.state === "missing" ? "wt-halo" : undefined}
						>
							{t(row.label)}
						</Label>
						<Label
							x={width - 20}
							y={y + 19}
							anchor="end"
							tone={row.state === "missing" ? "accent" : undefined}
							className={row.state === "missing" ? "wt-halo" : undefined}
						>
							{row.state === "missing"
								? t(["missing", "缺失"])
								: row.state === "zero" && state.stage >= 1
									? t(["0 · measured", "0 · 实测"])
									: count(row.value ?? 0)}
						</Label>
					</g>
				);
			})}
			<m.g
				initial={false}
				animate={{ opacity: state.stage >= 2 ? 1 : 0 }}
				transition={motion.fade}
			>
				<path d={`M8 ${totalY - 6}H${width - 8}`} className="wt-grid" />
				<Label x={20} y={totalY + 16} tone="strong">
					{t(["Total", "合计"])}
				</Label>
				<Label x={width - 20} y={totalY + 16} anchor="end" tone="accent">
					{t([`at least ${count(total)}`, `至少 ${count(total)}`])}
				</Label>
				<Label x={width - 20} y={totalY + 34} anchor="end" tone="small">
					{t([
						`${covered} of ${coverRows.length} series covered`,
						`覆盖 ${coverRows.length} 个序列中的 ${covered} 个`,
					])}
				</Label>
			</m.g>
		</g>
	);
}

function CoverView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: CoverState;
	explore: CoverState | null;
	setExplore: (next: CoverState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const total = coverRows.reduce((sum, row) => sum + (row.value ?? 0), 0);
	const result: ResultItem[] =
		shown.stage === 0
			? [
					{
						id: "rows",
						label: t(["Series listed", "列出的序列"]),
						value: String(coverRows.length),
					},
				]
			: shown.stage === 1
				? [
						{
							id: "zero",
							label: t(["115 call", "115 看涨"]),
							value: "0",
							note: t(["measured: nothing traded", "实测：没有成交"]),
							evidence: "observed",
						},
						{
							id: "missing",
							label: t(["120 call", "120 看涨"]),
							value: t(["missing", "缺失"]),
							note: t(["the feed sent nothing", "数据源没有发送"]),
							evidence: "unknown",
						},
					]
				: [
						{
							id: "total",
							label: t(["Total volume", "总成交量"]),
							value: t([`≥ ${count(total)}`, `≥ ${count(total)}`]),
							note: t(["4 of 5 series covered", "覆盖 5 个序列中的 4 个"]),
							evidence: "calculated",
						},
						{
							id: "not",
							label: t(["Not", "而不是"]),
							value: count(total),
							note: t(["as if the gap were zero", "好像缺口是零一样"]),
							tone: "loss",
						},
					];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Volume by Oct 18 call series with one measured zero and one missing value, and the total they allow",
						"10月18日 各看涨序列的成交量，含一个实测零值和一个缺失值，以及由此可得的合计",
					])}
					height={28 + coverRows.length * COVER_ROW + 58}
				>
					{(width) => (
						<CoverTable width={width} state={shown} locale={locale} />
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
							["0", t(["Rows", "各行"])],
							["1", t(["States", "状态"])],
							["2", t(["Total", "合计"])],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as CoverState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Missing, zero and not applicable are three different states. Zero is a measurement; missing means the source didn't say; not applicable means the question doesn't fit, such as yesterday's open interest for a series listed today. A total built over a gap is a lower bound, and a claim about the whole chain needs the whole chain covered.",
						"缺失、零和不适用是三种不同的状态。零是一个测量值；缺失表示数据源没有提供；不适用表示问题本身不成立，比如今天才上市的序列没有昨天的未平仓量。跨越缺口算出的合计只是下限；关于整个期权链的结论，需要整个期权链都有覆盖。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<ClockState, ClockState>({
		id: "clocks",
		label: ["Separate the clocks", "区分时钟"],
		title: [
			"Every value in the drawer has its own clock",
			"抽屉里的每个数值都有自己的时钟",
		],
		predict: {
			prompt: [
				"At 10:30 Monday the drawer shows open interest of 100 for the Oct 18 100 call. When was that count true?",
				"周一 10:30，抽屉显示 10月18日 100 看涨的未平仓量为 100。这个数是何时成立的？",
			],
			choices: [
				{ id: "friday", label: ["At Friday's close", "周五收盘时"] },
				{ id: "now", label: ["Right now, at 10:30", "就是现在，10:30"] },
				{ id: "open", label: ["At Monday's open", "周一开盘时"] },
			],
			answer: "friday",
			revealAt: 2,
			explain: [
				"Open interest is counted at each close and published before the next open, so on Monday morning the newest count is Friday's. It can't include Monday's trades.",
				"未平仓量在每次收盘时统计，在下次开盘前发布，所以周一上午最新的统计是周五的，不可能包含周一的成交。",
			],
		},
		beats: [
			{
				id: "now",
				label: ["Now", "现在"],
				caption: [
					"10:30 Monday: you open ALFA's symbol drawer. It shows open interest, a model IV and the last trade side by side.",
					"周一 10:30：你打开 ALFA 的标的抽屉。它并排显示未平仓量、模型隐含波动率和最新成交。",
				],
				state: { shown: 1 },
			},
			{
				id: "model",
				label: ["The model", "模型"],
				caption: [
					"The 35% IV came from a model run at Friday's close. It's modeled, and as of Friday 16:00.",
					"35% 的隐含波动率来自周五收盘时的一次模型计算。它是模型值，时间是周五 16:00。",
				],
				state: { shown: 2 },
			},
			{
				id: "oi",
				label: ["Open interest", "未平仓量"],
				caption: [
					"Open interest of 100 was counted at Friday's close and published at 06:30 Monday. It is Friday's number, read on Monday.",
					"100 的未平仓量是周五收盘时统计、周一 06:30 发布的。它是周五的数，在周一读到。",
				],
				state: { shown: 4 },
			},
			{
				id: "trade",
				label: ["Event and receipt", "事件与接收"],
				caption: [
					"The last trade happened at 10:05, but this feed runs 15 minutes late, so the drawer learned of it at 10:20.",
					"最新成交发生在 10:05，但这个数据源延迟 15 分钟，所以抽屉在 10:20 才得知。",
				],
				state: { shown: 6 },
			},
		],
		explore: {
			prompt: ["Add the clocks one at a time.", "逐个加入各个时钟。"],
			start: () => ({ shown: 6 }),
			task: {
				kind: "answer",
				prompt: [
					"Which value reached the drawer 15 minutes after it happened?",
					"哪个数值在发生 15 分钟后才到达面板？",
				],
				choices: [
					{ id: "trade", label: ["The last trade", "最新成交"] },
					{ id: "oi", label: ["Open interest", "未平仓量"] },
					{ id: "iv", label: ["The model IV", "模型 IV"] },
				],
				answer: "trade",
				done: [
					"The trade happened at 10:05 but the delayed feed delivered it at 10:20: an event time and a receipt time. Open interest and IV are Friday's, counted and modeled long before.",
					"这笔成交发生在 10:05，但延迟数据源在 10:20 才送达：一个事件时间，一个接收时间。未平仓量和 IV 是周五的，很早就已统计和建模。",
				],
			},
		},
		View: ClockView,
	}),
	defineScene<AuditState, AuditState>({
		id: "requirement",
		label: ["Match the question", "匹配问题"],
		title: ["Fresh enough depends on the question", "够不够新，取决于问题"],
		predict: {
			prompt: [
				"You need today's ALFA option volume so far. Friday's complete tape is on file. Can you use it?",
				"你需要今天截至目前的 ALFA 期权成交量。手头有周五的完整成交记录。能用吗？",
			],
			choices: [
				{ id: "no", label: ["No: it's the wrong session", "不能：时段不对"] },
				{ id: "yes", label: ["Yes: it's complete", "能：它是完整的"] },
				{
					id: "newer",
					label: ["Yes: it's newer than the OI", "能：它比未平仓量更新"],
				},
			],
			answer: "no",
			revealAt: 1,
			explain: [
				"Friday's tape describes Friday. For today's flow only Monday's trades count, even if the Monday feed is delayed and partial.",
				"周五的成交记录描述的是周五。要看今天的成交流，只有周一的成交才算，即使周一的数据有延迟、不完整。",
			],
		},
		beats: [
			{
				id: "sources",
				label: ["On file", "手头数据"],
				caption: [
					"At 10:30 three sources are on file. Whether each is fresh enough depends on the question you ask of it.",
					"10:30 时手头有三个数据源。每个是否够新，取决于你要回答的问题。",
				],
				state: { requirement: null },
			},
			{
				id: "today",
				label: ["Today's flow", "今日成交流"],
				caption: [
					"For today's volume so far, Friday's tape fails and the delayed Monday feed only partly meets it: say 'through 10:15'.",
					"要看今天截至目前的成交量，周五的记录不满足，周一的延迟数据只部分满足：要注明“截至 10:15”。",
				],
				state: { requirement: "today" },
			},
			{
				id: "positions",
				label: ["Outstanding", "存续合约"],
				caption: [
					"For contracts outstanding, Friday's open interest is the newest count that exists. It's the right input all morning.",
					"要看存续合约数，周五的未平仓量是现有最新的统计。整个上午它都是合适的输入。",
				],
				state: { requirement: "positions" },
			},
			{
				id: "compare",
				label: ["A full day", "完整一天"],
				caption: [
					"To compare full days, Friday's complete tape meets the need and Monday's partial one doesn't yet.",
					"要比较完整的交易日，周五的完整记录满足需要，周一不完整的记录暂时不行。",
				],
				state: { requirement: "compare" },
			},
		],
		explore: {
			prompt: [
				"Pick a question and see which sources can answer it.",
				"选择一个问题，看看哪些数据源能回答它。",
			],
			start: () => ({ requirement: "today" }),
			task: {
				kind: "answer",
				prompt: [
					"For which question is Friday's open interest the right input?",
					"对于哪个问题，周五的未平仓量是正确的输入？",
				],
				choices: [
					{ id: "positions", label: ["Contracts outstanding", "存续合约数量"] },
					{
						id: "today",
						label: ["Today's flow so far", "今天到目前为止的成交流"],
					},
					{ id: "compare", label: ["Comparing full days", "比较完整的交易日"] },
				],
				answer: "positions",
				done: [
					"Open interest is counted once a day, so Friday's is the newest count that exists all Monday morning. For today's flow or a full-day comparison you need the matching session's trades.",
					"未平仓量每天只统计一次，所以整个周一上午，周五的数字就是最新的统计。要看今天的成交流或比较完整交易日，需要对应时段的成交。",
				],
			},
		},
		View: AuditView,
	}),
	defineScene<CoverState, CoverState>({
		id: "coverage",
		label: ["Missing is not zero", "缺失不是零"],
		title: [
			"Missing, zero and not applicable are different",
			"缺失、零和不适用是不同的",
		],
		predict: {
			prompt: [
				"One series' volume field is blank. What should the Oct 18 calls' total volume say?",
				"其中一个序列的成交量字段是空的。10月18日 看涨的总成交量应该怎么写？",
			],
			choices: [
				{
					id: "bound",
					label: [
						"At least 1,065, with 4 of 5 covered",
						"至少 1,065，覆盖 5 个中的 4 个",
					],
				},
				{ id: "sum", label: ["1,065", "1,065"] },
				{
					id: "zero",
					label: ["Unknown, so treat it as zero", "未知，所以当作零"],
				},
			],
			answer: "bound",
			revealAt: 2,
			explain: [
				"A blank isn't zero. The four covered series add to 1,065, so the true total is at least that, and the claim should say one series is missing.",
				"空白不是零。已覆盖的四个序列合计 1,065，所以真实合计至少是这个数，结论中应说明缺了一个序列。",
			],
		},
		beats: [
			{
				id: "rows",
				label: ["The rows", "各行"],
				caption: [
					"Monday's volume for five Oct 18 call series. Four have numbers; one field is blank.",
					"周一五个 10月18日 看涨序列的成交量。四个有数字，一个字段是空的。",
				],
				state: { stage: 0 },
			},
			{
				id: "states",
				label: ["Zero or missing", "零或缺失"],
				caption: [
					"The 115 call's 0 is a measurement: nothing traded. The 120 call's blank means the feed sent nothing, which is a different state.",
					"115 看涨的 0 是实测值：没有成交。120 看涨的空白表示数据源什么也没发送，这是另一种状态。",
				],
				state: { stage: 1 },
			},
			{
				id: "total",
				label: ["The total", "合计"],
				caption: [
					"So the total is at least 1,065, with 4 of 5 series covered. Writing plain 1,065 would treat the gap as zero.",
					"所以合计至少为 1,065，覆盖 5 个序列中的 4 个。直接写 1,065 就等于把缺口当成了零。",
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: [
				"Step through the rows, their states and the total.",
				"逐步查看各行、各自的状态以及合计。",
			],
			start: () => ({ stage: 2 }),
			task: {
				kind: "answer",
				prompt: ["Which row holds a measured zero?", "哪一行是测量出来的零？"],
				choices: [
					{ id: "c115", label: ["The Oct 18 115 call", "10月18日 115 看涨"] },
					{ id: "c120", label: ["The Oct 18 120 call", "10月18日 120 看涨"] },
					{ id: "c100", label: ["The Oct 18 100 call", "10月18日 100 看涨"] },
				],
				answer: "c115",
				done: [
					"The 115 call's 0 is a measurement: nothing traded. The 120 call's blank is missing data, which is why the total can only be a lower bound.",
					"115 看涨的 0 是测量结果：没有成交。120 看涨的空白是缺失数据，所以合计只能是一个下限。",
				],
			},
		},
		View: CoverView,
	}),
] as const;

export function SymbolDrawerWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="symbol-drawer"
			label={["Interactive lesson on data clocks", "数据时钟互动课"]}
			scenes={scenes}
		/>
	);
}
