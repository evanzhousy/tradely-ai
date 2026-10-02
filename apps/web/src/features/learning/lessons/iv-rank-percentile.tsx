import * as m from "motion/react-m";
import type { ReactNode } from "react";
import {
	ALFA_IV30_TODAY,
	alfaIv30Weekly,
	type Copy,
	pick,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import {
	Appear,
	Label,
	Stage,
	useStage,
	useTeachMotion,
} from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

const WEEKS = alfaIv30Weekly.length;
const SHOCK = alfaIv30Weekly.indexOf(Math.max(...alfaIv30Weekly));
/** A vendor outage that lost eight weeks of history, shock included. */
const GAP = { from: 20, to: 27 } as const;
const RECENT = 13;

type Mark = "none" | "rank" | "percentile" | "both";
type View = {
	mark: Mark;
	today: number;
	dropShock: boolean;
	recent: boolean;
	gaps: boolean;
};

/** The weeks a view counts, by index. */
function counted(view: View) {
	return alfaIv30Weekly
		.map((value, i) => ({ value, i }))
		.filter(
			({ i }) =>
				(!view.recent || i >= WEEKS - RECENT) &&
				!(view.dropShock && i === SHOCK) &&
				!(view.gaps && i >= GAP.from && i <= GAP.to),
		);
}

function stats(view: View) {
	const weeks = counted(view);
	const values = weeks.map((week) => week.value);
	const low = Math.min(...values);
	const high = Math.max(...values);
	const below = values.filter((value) => value < view.today).length;
	return {
		n: values.length,
		low,
		high,
		below,
		rank: (view.today - low) / (high - low),
		percentile: below / values.length,
	};
}

const pct = (fraction: number) => `${Math.round(fraction * 100)}%`;
const rankText = (rank: number, locale: Locale) =>
	rank > 1
		? pick(["above the high", "高于最高值"], locale)
		: rank < 0
			? pick(["below the low", "低于最低值"], locale)
			: pct(rank);

const CHART_TOP = 34;
const CHART_BOTTOM = 196;
const chartHeight = CHART_BOTTOM + 26;
const Y_MAX = 72;

function IvHistory({
	width,
	view,
	locale,
}: {
	width: number;
	view: View;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const { hatch } = useStage();
	const s = stats(view);
	const left = 34;
	const right =
		width - (view.mark === "rank" || view.mark === "both" ? 58 : 10);
	const slot = (right - left) / WEEKS;
	const y = (value: number) =>
		CHART_BOTTOM - (value / Y_MAX) * (CHART_BOTTOM - CHART_TOP);
	const counts = new Set(counted(view).map((week) => week.i));
	const showBelow = view.mark === "percentile" || view.mark === "both";
	const showRank = view.mark === "rank" || view.mark === "both";
	const bracketX = right + 18;
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{width < 520
					? t([
							"ALFA IV30 · weekly · year to Sep 13",
							"ALFA IV30 · 每周 · 截至 9月13日 的一年",
						])
					: t([
							"ALFA IV30 · weekly closes · the year to Sep 13",
							"ALFA IV30 · 每周收盘 · 截至 9月13日 的一年",
						])}
			</Label>
			{/* When the rank bracket takes room on the right, the year narrows rather than jumps. */}
			{[0, 20, 40, 60].map((tick) => (
				<g key={tick}>
					<m.path
						className={tick === 0 ? "wt-axis" : "wt-grid"}
						initial={false}
						animate={{ d: `M${left} ${y(tick)}H${right}` }}
						transition={motion.move}
					/>
					<Label x={left - 6} y={y(tick) + 4} anchor="end" tone="small">
						{`${tick}%`}
					</Label>
				</g>
			))}
			{alfaIv30Weekly.map((value, i) => {
				const x = left + i * slot + slot * 0.15;
				const w = Math.max(slot * 0.7, 1.5);
				const missing = view.gaps && i >= GAP.from && i <= GAP.to;
				const dropped = view.dropShock && i === SHOCK;
				const inWindow = counts.has(i);
				if (missing)
					return (
						<Appear key={`gap-${i}`}>
							<m.rect
								y={y(8)}
								height={y(0) - y(8)}
								style={{ fill: hatch }}
								className="wt-panel-shape"
								initial={false}
								animate={{ x, width: w }}
								transition={motion.move}
							/>
						</Appear>
					);
				return (
					<m.rect
						key={i}
						y={y(value)}
						height={y(0) - y(value)}
						rx={1}
						className={
							dropped
								? "wt-ghost"
								: showBelow && inWindow && value < view.today
									? "wt-chip"
									: "wt-panel-shape"
						}
						initial={false}
						animate={{ x, width: w, opacity: inWindow || dropped ? 1 : 0.25 }}
						transition={motion.move}
					/>
				);
			})}
			<m.g
				initial={false}
				animate={{ y: y(view.today) }}
				transition={motion.move}
			>
				<m.path
					className="wt-bracket"
					strokeDasharray="5 4"
					initial={false}
					animate={{ d: `M${left} 0H${right}` }}
					transition={motion.move}
				/>
				<Label x={left + 4} y={-5} tone="accent" className="wt-halo">
					{t([`today ${view.today}%`, `今天 ${view.today}%`])}
				</Label>
			</m.g>
			{showRank ? (
				<Appear delay={0.3}>
					<path
						d={`M${bracketX - 5} ${y(s.low)}H${bracketX}V${y(s.high)}H${bracketX - 5}`}
						className="wt-axis"
					/>
					<Label x={bracketX + 4} y={y(s.high) + 4} tone="small">
						{`${s.high}%`}
					</Label>
					<Label x={bracketX + 4} y={y(s.low) + 4} tone="small">
						{`${s.low}%`}
					</Label>
					<m.circle
						cx={bracketX}
						r={4}
						className="wt-chip"
						initial={false}
						animate={{ cy: y(Math.min(Math.max(view.today, s.low), s.high)) }}
						transition={motion.move}
					/>
				</Appear>
			) : null}
			<Label x={left} y={CHART_BOTTOM + 18} tone="small">
				{t(["Sep 2029", "2029年9月"])}
			</Label>
			<Label x={right} y={CHART_BOTTOM + 18} anchor="end" tone="small">
				{t(["Sep 13", "9月13日"])}
			</Label>
		</g>
	);
}

function readings(view: View, locale: Locale): ResultItem[] {
	const t = tr(locale);
	const s = stats(view);
	const items: ResultItem[] = [];
	if (view.mark === "rank" || view.mark === "both")
		items.push({
			id: "rank",
			label: t(["IV rank", "IV Rank"]),
			value: rankText(s.rank, locale),
			note: t([
				`(${view.today} − ${s.low}) ÷ (${s.high} − ${s.low})`,
				`(${view.today} − ${s.low}) ÷ (${s.high} − ${s.low})`,
			]),
			evidence: "calculated",
		});
	if (view.mark === "percentile" || view.mark === "both")
		items.push({
			id: "percentile",
			label: t(["IV percentile", "IV 百分位"]),
			value: pct(s.percentile),
			note: t([
				`${s.below} of ${s.n} weeks lower`,
				`${s.n} 周中有 ${s.below} 周更低`,
			]),
			evidence: "calculated",
		});
	return items;
}

function HistoryView({
	locale,
	phase,
	state,
	explore,
	controls,
	extra,
	details,
}: {
	locale: Locale;
	phase: Phase;
	state: View;
	explore: View | null;
	setExplore: (next: View) => void;
	controls: (explore: View) => ReactNode;
	extra?: (view: View) => ResultItem[];
	details: Copy;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] = [
		...(extra ? extra(shown) : []),
		...readings(shown, locale),
	];
	if (!result.length)
		result.push({
			id: "today",
			label: t(["IV30 today", "今天的 IV30"]),
			value: `${shown.today}%`,
			note: t([`against ${WEEKS} weekly closes`, `对照 ${WEEKS} 个每周收盘`]),
			evidence: "observed",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A year of ALFA's weekly IV30 as bars with today's level as a line, marked for range position or for the weeks below today",
						"ALFA 一年的每周 IV30 柱状图，今天的水平为一条线，并标出区间位置或低于今天的周数",
					])}
					height={chartHeight}
				>
					{(width) => <IvHistory width={width} view={shown} locale={locale} />}
				</Stage>
			}
			result={result}
			controls={explore ? controls(explore) : null}
			details={<p>{t(details)}</p>}
		/>
	);
}

const todayControl = (
	explore: View,
	setExplore: (next: View) => void,
	locale: Locale,
) => (
	<RangeControl
		label={pick(["IV30 today", "今天的 IV30"], locale)}
		value={explore.today}
		display={`${explore.today}%`}
		min={20}
		max={70}
		step={1}
		onChange={(today) => setExplore({ ...explore, today })}
	/>
);

// ——— Scenes ———

const base: View = {
	mark: "none",
	today: ALFA_IV30_TODAY,
	dropShock: false,
	recent: false,
	gaps: false,
};
const year = stats({ ...base, mark: "both" });
const noShock = stats({ ...base, mark: "both", dropShock: true });
const recent = stats({ ...base, mark: "both", recent: true });
const gapped = stats({ ...base, mark: "both", gaps: true });

function CompareView(props: {
	locale: Locale;
	phase: Phase;
	state: View;
	explore: View | null;
	setExplore: (next: View) => void;
}) {
	return (
		<HistoryView
			{...props}
			controls={(explore) =>
				todayControl(explore, props.setExplore, props.locale)
			}
			details={[
				"IV rank places today in the history's range: (today − low) ÷ (high − low). IV percentile counts the share of the history below today; say whether ties count. Both need the same IV reference, here IV30, a standardized 30-day level rather than one contract's IV, and the same window. They answer different questions, so a number labelled only 'IV rank' or 'IVR' should say which it is.",
				"IV Rank 把今天放进历史区间：(今天 − 最低) ÷ (最高 − 最低)。IV 百分位统计历史中低于今天的比例，并要说明相等值是否计入。两者都需要同一个 IV 参考（这里是 IV30，一个标准化的 30 天水平，而不是某一张合约的 IV）和同一个窗口。它们回答不同的问题，所以只标着“IV Rank”或“IVR”的数字应当说明它是哪一种。",
			]}
		/>
	);
}

function OutlierView(props: {
	locale: Locale;
	phase: Phase;
	state: View;
	explore: View | null;
	setExplore: (next: View) => void;
}) {
	const t = tr(props.locale);
	return (
		<HistoryView
			{...props}
			controls={(explore) => (
				<>
					<ChoiceField
						label={t(["The 68% week", "68% 的那一周"])}
						value={explore.dropShock ? "drop" : "keep"}
						options={[
							["keep", t(["Keep", "保留"])],
							["drop", t(["Drop", "去掉"])],
						]}
						onChange={(value) =>
							props.setExplore({ ...explore, dropShock: value === "drop" })
						}
					/>
					{todayControl(explore, props.setExplore, props.locale)}
				</>
			)}
			details={[
				"Rank depends only on the two extremes, so one unusual week can move it a lot; percentile counts every week and hardly notices one. Neither is wrong: rank says where today sits between the extremes, percentile how often IV has been lower. Check which extreme is setting the range before reading a low rank as calm.",
				"Rank 只取决于两个极端值，所以一个不寻常的周就能让它大幅变化；百分位统计每一周，几乎注意不到一个极端值。两者都没有错：Rank 说明今天在两个极端之间的位置，百分位说明 IV 有多常更低。在把低 Rank 读作平静之前，先看看是哪个极端值在决定区间。",
			]}
		/>
	);
}

function SampleView(props: {
	locale: Locale;
	phase: Phase;
	state: View;
	explore: View | null;
	setExplore: (next: View) => void;
}) {
	const t = tr(props.locale);
	return (
		<HistoryView
			{...props}
			extra={(view) => [
				{
					id: "sample",
					label: t(["Weeks counted", "计入的周数"]),
					value: `${stats(view).n}`,
					note: view.recent
						? t(["last 13 weeks only", "只看最近 13 周"])
						: view.gaps
							? t([
									`${GAP.to - GAP.from + 1} weeks missing, shock included`,
									`缺失 ${GAP.to - GAP.from + 1} 周，含冲击那一周`,
								])
							: t(["the full year", "全年"]),
					evidence: view.gaps ? "unknown" : "observed",
				},
			]}
			controls={(explore) => (
				<ChoiceField
					label={t(["History", "历史"])}
					value={explore.recent ? "recent" : explore.gaps ? "gaps" : "year"}
					options={[
						["year", t(["Year", "一年"])],
						["recent", t(["13 weeks", "13 周"])],
						["gaps", t(["With gaps", "有缺口"])],
					]}
					onChange={(value) =>
						props.setExplore({
							...explore,
							recent: value === "recent",
							gaps: value === "gaps",
						})
					}
				/>
			)}
			details={[
				"A rank or percentile is only as good as its history: the window, the IV reference and the coverage. A short or incomplete window can make an ordinary level look extreme. If today is outside the window's range, the rank formula gives more than 100%, which tools usually cap; say so rather than printing a confident 100%.",
				"Rank 或百分位的好坏取决于它的历史：窗口、IV 参考和覆盖范围。太短或不完整的窗口会让一个普通的水平看起来很极端。如果今天超出窗口的区间，Rank 公式会给出超过 100% 的值，工具通常会把它截到 100%；要说明这一点，而不是印出一个信心满满的 100%。",
			]}
		/>
	);
}

/** With the shock week back in, the IV30 that earns the rank today has without it. */
const SAME_RANK_AT =
	Array.from({ length: 51 }, (_, i) => 20 + i).find(
		(today) => stats({ ...base, mark: "both", today }).rank >= noShock.rank,
	) ?? 70;

const scenes = [
	defineScene<View, View>({
		id: "compare",
		label: ["Compare two measures", "比较两项指标"],
		title: ["A range position is not a frequency", "区间位置不是频率"],
		predict: {
			prompt: [
				`ALFA's IV30 is ${ALFA_IV30_TODAY}% today. Over the past year it ran from ${year.low}% to ${year.high}%. What's its IV rank?`,
				`ALFA 今天的 IV30 为 ${ALFA_IV30_TODAY}%。过去一年它在 ${year.low}% 到 ${year.high}% 之间。它的 IV Rank 是多少？`,
			],
			choices: [
				{
					id: "rank",
					label: [`About ${pct(year.rank)}`, `约 ${pct(year.rank)}`],
				},
				{
					id: "level",
					label: [
						`${ALFA_IV30_TODAY}%: the IV itself`,
						`${ALFA_IV30_TODAY}%：就是 IV 本身`,
					],
				},
				{
					id: "percentile",
					label: [pct(year.percentile), pct(year.percentile)],
				},
			],
			answer: "rank",
			entry: {
				answer: Math.round(year.rank * 100),
				tolerance: 2,
				unit: ["%", "%"],
			},
			revealAt: 1,
			explain: [
				`(${ALFA_IV30_TODAY} − ${year.low}) ÷ (${year.high} − ${year.low}) = ${pct(year.rank)}: today sits low in the range because one week reached ${year.high}%. Yet ${year.below} of ${year.n} weeks were lower, a percentile of ${pct(year.percentile)}.`,
				`(${ALFA_IV30_TODAY} − ${year.low}) ÷ (${year.high} − ${year.low}) = ${pct(year.rank)}：因为有一周达到 ${year.high}%，今天在区间里位置偏低。可 ${year.n} 周中有 ${year.below} 周更低，百分位是 ${pct(year.percentile)}。`,
			],
		},
		beats: [
			{
				id: "history",
				label: ["The year", "这一年"],
				caption: [
					`A year of ALFA's IV30 at weekly closes, mostly in the mid-20s, and today's ${ALFA_IV30_TODAY}%.`,
					`ALFA 一年来每周收盘的 IV30，大多在 25% 上下，以及今天的 ${ALFA_IV30_TODAY}%。`,
				],
				state: base,
			},
			{
				id: "rank",
				label: ["Rank", "Rank"],
				caption: [
					`IV rank places today in the year's range: ${year.low}% to ${year.high}%, so ${pct(year.rank)} of the way up.`,
					`IV Rank 把今天放进这一年的区间：${year.low}% 到 ${year.high}%，处在 ${pct(year.rank)} 的位置。`,
				],
				state: { ...base, mark: "rank" },
			},
			{
				id: "percentile",
				label: ["Percentile", "百分位"],
				caption: [
					`IV percentile counts the weeks below today: ${year.below} of ${year.n}, ${pct(year.percentile)}. Same day, same data: "low" by range, "high" by frequency.`,
					`IV 百分位数的是低于今天的周数：${year.n} 周中的 ${year.below} 周，${pct(year.percentile)}。同一天、同一份数据：按区间看“低”，按频率看“高”。`,
				],
				state: { ...base, mark: "percentile" },
			},
		],
		explore: {
			prompt: [
				"Move today's IV30 and watch the two measures move differently.",
				"移动今天的 IV30，观察两项指标如何不同地变化。",
			],
			start: () => ({ ...base, mark: "both", today: 30 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the lowest IV30 at which IV rank passes 50%.",
					"找出 IV Rank 超过 50% 的最低 IV30。",
				],
				reached: (e) =>
					stats(e).rank >= 0.5 &&
					stats({ ...e, today: e.today - 1 }).rank < 0.5,
				done: [
					"Rank reaches the middle of the year's range only near the top of where IV usually sits, because one spike stretched the range. By then almost every week was lower: the percentile is near 100%.",
					"Rank 要到 IV 平时所处区间的上端附近，才达到全年区间的中点，因为一次尖峰拉宽了区间。此时几乎每一周都更低：百分位接近 100%。",
				],
			},
		},
		View: CompareView,
	}),
	defineScene<View, View>({
		id: "outlier",
		label: ["Change one extreme", "改变一个极端值"],
		title: [
			"One outlier moves rank far more than percentile",
			"一个极端值对 Rank 的影响远大于百分位",
		],
		predict: {
			prompt: [
				`Drop the single ${year.high}% week from the year. What happens to IV rank?`,
				`把那唯一一周的 ${year.high}% 从这一年里去掉。IV Rank 会怎样？`,
			],
			choices: [
				{
					id: "jump",
					label: [
						`It roughly doubles, to ${pct(noShock.rank)}`,
						`大约翻倍，到 ${pct(noShock.rank)}`,
					],
				},
				{ id: "same", label: ["It barely moves", "几乎不变"] },
				{ id: "down", label: ["It falls", "下降"] },
			],
			answer: "jump",
			revealAt: 1,
			explain: [
				`Without it the high is ${noShock.high}%, so rank becomes (${ALFA_IV30_TODAY} − ${noShock.low}) ÷ (${noShock.high} − ${noShock.low}) = ${pct(noShock.rank)}. The percentile only moves from ${pct(year.percentile)} to ${pct(noShock.percentile)}: one week out of ${year.n}.`,
				`去掉之后最高值是 ${noShock.high}%，Rank 变成 (${ALFA_IV30_TODAY} − ${noShock.low}) ÷ (${noShock.high} − ${noShock.low}) = ${pct(noShock.rank)}。百分位只从 ${pct(year.percentile)} 变到 ${pct(noShock.percentile)}：${year.n} 周中的一周而已。`,
			],
		},
		beats: [
			{
				id: "with",
				label: ["With the shock", "含冲击"],
				caption: [
					`With February's ${year.high}% week in the history: rank ${pct(year.rank)}, percentile ${pct(year.percentile)}.`,
					`历史中含二月那一周的 ${year.high}%：Rank ${pct(year.rank)}，百分位 ${pct(year.percentile)}。`,
				],
				state: { ...base, mark: "both" },
			},
			{
				id: "without",
				label: ["Without it", "去掉之后"],
				caption: [
					`Drop that one week: the range top falls to ${noShock.high}% and rank jumps to ${pct(noShock.rank)}. The percentile barely moves: ${pct(noShock.percentile)}.`,
					`去掉那一周：区间顶端降到 ${noShock.high}%，Rank 跳到 ${pct(noShock.rank)}。百分位几乎不动：${pct(noShock.percentile)}。`,
				],
				state: { ...base, mark: "both", dropShock: true },
			},
		],
		explore: {
			prompt: [
				"Keep or drop the shock week and move today's IV30.",
				"保留或去掉冲击那一周，并移动今天的 IV30。",
			],
			start: (last) => last,
			task: {
				kind: "reach",
				prompt: [
					"Put the shock week back, then find the lowest IV30 that earns the rank today has without it.",
					"把冲击周放回去，再找出能得到与去掉它时相同 Rank 的最低 IV30。",
				],
				reached: (e) => !e.dropShock && e.today === SAME_RANK_AT,
				done: [
					`With the shock week in the range, IV30 has to reach ${SAME_RANK_AT}% for the ${pct(noShock.rank)} rank that ${ALFA_IV30_TODAY}% earns without it. One week moved the yardstick by ${SAME_RANK_AT - ALFA_IV30_TODAY} points.`,
					`冲击周在区间内时，IV30 要到 ${SAME_RANK_AT}%，才能得到去掉它时 ${ALFA_IV30_TODAY}% 就有的 ${pct(noShock.rank)} Rank。一周的数据把标尺移动了 ${SAME_RANK_AT - ALFA_IV30_TODAY} 个点。`,
				],
			},
		},
		View: OutlierView,
	}),
	defineScene<View, View>({
		id: "sample",
		label: ["Audit the sample", "审计样本"],
		title: ["A percentage needs a defined history", "百分比需要定义明确的历史"],
		predict: {
			prompt: [
				`Measure over only the last ${RECENT} weeks instead of the year. What's today's IV percentile?`,
				`只用最近 ${RECENT} 周而不是一整年来衡量。今天的 IV 百分位是多少？`,
			],
			choices: [
				{
					id: "all",
					label: ["100%: every week was lower", "100%：每一周都更低"],
				},
				{
					id: "same",
					label: [
						`${pct(year.percentile)}: same as the year`,
						`${pct(year.percentile)}：和全年一样`,
					],
				},
				{ id: "rank", label: [pct(year.rank), pct(year.rank)] },
			],
			answer: "all",
			entry: { answer: 100, unit: ["%", "%"] },
			revealAt: 1,
			explain: [
				`The last ${RECENT} weeks ran ${recent.low}% to ${recent.high}%, all below ${ALFA_IV30_TODAY}%. Percentile is 100% and today is above the range's high, so rank has nowhere to put it.`,
				`最近 ${RECENT} 周在 ${recent.low}% 到 ${recent.high}% 之间，全都低于 ${ALFA_IV30_TODAY}%。百分位为 100%，今天高于区间最高值，Rank 没有位置可放。`,
			],
		},
		beats: [
			{
				id: "year",
				label: ["A year", "一年"],
				caption: [
					`Over the full year: ${year.n} weeks, rank ${pct(year.rank)}, percentile ${pct(year.percentile)}.`,
					`全年来看：${year.n} 周，Rank ${pct(year.rank)}，百分位 ${pct(year.percentile)}。`,
				],
				state: { ...base, mark: "both" },
			},
			{
				id: "recent",
				label: [`${RECENT} weeks`, `${RECENT} 周`],
				caption: [
					`Over the calm last ${RECENT} weeks, today is above everything: percentile ${pct(recent.percentile)}, and rank off the top of the range.`,
					`在平静的最近 ${RECENT} 周里，今天高于所有值：百分位 ${pct(recent.percentile)}，Rank 超出区间顶端。`,
				],
				state: { ...base, mark: "both", recent: true },
			},
			{
				id: "gaps",
				label: ["Gaps", "缺口"],
				caption: [
					`Lose ${GAP.to - GAP.from + 1} weeks of history, February's shock among them, and the year says the same as the calm quarter: percentile ${pct(gapped.percentile)} of ${gapped.n} weeks. Say the window and the coverage with every number.`,
					`如果丢了 ${GAP.to - GAP.from + 1} 周的历史（二月的冲击也在其中），这一年给出的结论就和平静的那个季度一样：${gapped.n} 周中百分位 ${pct(gapped.percentile)}。每个数字都要说明窗口和覆盖范围。`,
				],
				state: { ...base, mark: "both", gaps: true },
			},
		],
		explore: {
			prompt: [
				"Switch the history and compare the readings.",
				"切换历史，比较读数。",
			],
			start: (last) => last,
			task: {
				kind: "answer",
				prompt: [
					"Why does the year with gaps read like the calm quarter?",
					"为什么有缺口的一年读数看起来像平静的那个季度？",
				],
				choices: [
					{
						id: "shock",
						label: [
							"Its missing weeks include February's shock",
							"缺失的几周正好包括二月的冲击",
						],
					},
					{ id: "more", label: ["It counts more weeks", "它统计了更多周"] },
					{
						id: "today",
						label: ["Today's IV30 is different", "今天的 IV30 不同"],
					},
				],
				answer: "shock",
				done: [
					"Lose those 8 weeks and the year's high drops below today, so every remaining week is lower: percentile 100%, rank off the top. Say the window and the coverage with every reading.",
					"去掉那 8 周后，全年的最高值低于今天，剩下的每一周都更低：百分位 100%，Rank 超出上限。每个读数都要说明窗口和覆盖范围。",
				],
			},
		},
		View: SampleView,
	}),
] as const;

export function IvRankPercentileWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="iv-rank-percentile"
			label={[
				"Interactive lesson on IV rank and IV percentile",
				"IV Rank 与 IV 百分位互动课",
			]}
			scenes={scenes}
		/>
	);
}
