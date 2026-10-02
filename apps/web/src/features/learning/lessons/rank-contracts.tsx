import * as m from "motion/react-m";
import { type Copy, count, pick } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import {
	type GridRow,
	StrikeGrid,
	strikeGridHeight,
} from "../walkthrough/instruments/strike-grid";
import { Label, Stage, useStage, useTeachMotion } from "../walkthrough/stage";
import { textWidth } from "../walkthrough/text-measure";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

const STRIKES = [95, 100, 105, 110, 115, 120] as const;
const SPOT = 100.02;
/**
 * ALFA calls, Monday option volume by expiry and strike. The Oct 18 row matches the tape
 * lessons (the 105/110 spread legs, the 120 call that only arrives on Tuesday).
 */
const volume = {
	sep20: [0, 380, 315, 0, 0, 0],
	oct18: [45, 20, 505, 540, 0, null],
	nov15: [95, 380, 95, 70, 55, 0],
} as const satisfies Record<string, readonly (number | null)[]>;
type ExpiryKey = keyof typeof volume;
const expiryLabel: Record<ExpiryKey, Copy> = {
	sep20: ["Sep 20", "9月20日"],
	oct18: ["Oct 18", "10月18日"],
	nov15: ["Nov 15", "11月15日"],
};
const MAX = 540;

const rowsFor = (locale: Locale): GridRow[] =>
	(Object.keys(volume) as ExpiryKey[]).map((key) => ({
		id: key,
		label: pick(expiryLabel[key], locale),
		values: volume[key],
	}));

const total = (key: ExpiryKey) =>
	volume[key].reduce<number>((sum, value) => sum + (value ?? 0), 0);
const peak = (key: ExpiryKey) =>
	Math.max(...volume[key].map((value) => value ?? 0));
const active = (key: ExpiryKey) =>
	volume[key].filter((value) => (value ?? 0) > 0).length;

// ——— Scene 1: a cell needs its neighbors ———

type LocateState = { spot: boolean; focus: boolean };

function LocateView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: LocateState;
	explore: LocateState | null;
	setExplore: (next: LocateState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] = [
		{
			id: "busiest",
			label: t(["Busiest cells", "最活跃的格子"]),
			value: t([
				"Oct 18 110 · 540, Oct 18 105 · 505",
				"10月18日 110 · 540，10月18日 105 · 505",
			]),
			evidence: "observed",
		},
	];
	if (shown.spot)
		result.push({
			id: "moneyness",
			label: t(["With ALFA at $100.02", "ALFA 为 $100.02 时"]),
			value: t(["95, 100 in the money", "95、100 为实值"]),
			note: t(["105 and up out of the money", "105 及以上为虚值"]),
		});
	if (shown.focus)
		result.push({
			id: "context",
			label: t(["Neighbors say", "邻近格子显示"]),
			value: t(["one spread, two legs", "一笔价差，两条腿"]),
			note: t([
				"500 of each came from the 10:50 block",
				"各有 500 张来自 10:50 的大单",
			]),
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"ALFA call volume on Monday by expiry and strike, with ALFA's price marked",
						"ALFA 看涨期权周一按到期日与行权价的成交量，并标出 ALFA 价格",
					])}
					height={strikeGridHeight(3, true)}
				>
					{(width) => (
						<StrikeGrid
							width={width}
							strikes={STRIKES}
							rows={rowsFor(locale)}
							max={MAX}
							spot={shown.spot ? SPOT : undefined}
							spotLabel={t(["ALFA $100.02", "ALFA $100.02"])}
							focusCell={
								shown.focus ? { row: "oct18", strike: 110 } : undefined
							}
							focusRows={shown.focus ? ["oct18"] : []}
							title={t([
								"ALFA calls · Monday contracts",
								"ALFA 看涨 · 周一成交张数",
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
						value={shown.focus ? "focus" : shown.spot ? "spot" : "grid"}
						options={[
							["grid", t(["Grid", "网格"])],
							["spot", t(["+ Spot", "+ 现价"])],
							["focus", t(["+ Context", "+ 背景"])],
						]}
						onChange={(value) =>
							setExplore({ spot: value !== "grid", focus: value === "focus" })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A neighborhood fixes the underlying, the option type, the session and the quality rule, then lays activity out across strikes and expiries. Spot tells you which strikes are in or out of the money; it doesn't tell you which contract to buy. Read a busy cell with its row and column before calling it a crowd.",
						"邻域先固定标的、期权类型、时段和质量规则，再把活动按行权价和到期日展开。现价告诉你哪些行权价是实值或虚值，并不告诉你该买哪张合约。在把一个活跃格子称为一群人之前，先连同它所在的行与列一起看。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: same total and peak, different breadth ———

type ShapeState = { stage: 0 | 1 | 2 };

function ShapeView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ShapeState;
	explore: ShapeState | null;
	setExplore: (next: ShapeState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const compare = (key: ExpiryKey): ResultItem => ({
		id: key,
		label: t(expiryLabel[key]),
		value:
			shown.stage === 0
				? t([`${count(total(key))} total`, `合计 ${count(total(key))}`])
				: shown.stage === 1
					? t([`peak ${count(peak(key))}`, `峰值 ${count(peak(key))}`])
					: t([
							`${active(key)} strikes traded`,
							`${active(key)} 个行权价有成交`,
						]),
		note:
			shown.stage === 2
				? t([
						`${count(total(key))} total · peak ${count(peak(key))}`,
						`合计 ${count(total(key))} · 峰值 ${count(peak(key))}`,
					])
				: undefined,
		evidence: "calculated",
	});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Two ALFA call expiries with the same total and peak but different spread across strikes",
						"两个 ALFA 看涨到期日合计与峰值相同，但在行权价上的分布不同",
					])}
					height={strikeGridHeight(3, false)}
				>
					{(width) => (
						<StrikeGrid
							width={width}
							strikes={STRIKES}
							rows={rowsFor(locale)}
							max={MAX}
							focusRows={["sep20", "nov15"]}
							title={t([
								"ALFA calls · Monday contracts",
								"ALFA 看涨 · 周一成交张数",
							])}
						/>
					)}
				</Stage>
			}
			result={[compare("sep20"), compare("nov15")]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Compare", "比较"])}
						value={String(explore.stage) as "0" | "1" | "2"}
						options={[
							["0", t(["Totals", "合计"])],
							["1", t(["Peaks", "峰值"])],
							["2", t(["Breadth", "广度"])],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as ShapeState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Total activity and concentration are separate measures. Two expiries can share a total and a peak while one crowds into two strikes and the other spreads across five. Count the strikes that actually traded, and don't turn a missing value into a zero while you count.",
						"总活动量与集中度是两个不同的指标。两个到期日可以合计与峰值相同，但一个挤在两个行权价上，另一个分散在五个行权价上。统计实际有成交的行权价，并且计数时不要把缺失值当成零。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: audit the candidates ———

type AuditState = { applied: number };

type Candidate = {
	id: string;
	label: Copy;
	value: number | null;
	source: Copy;
	/** The first audit that removes it, if any. */
	fails?: "stale" | "scope";
};

const candidates: readonly Candidate[] = [
	{
		id: "nov115",
		label: ["Nov 15 115 call", "11月15日 115 看涨"],
		value: 1_400,
		source: ["Friday's session", "周五时段"],
		fails: "stale",
	},
	{
		id: "put110",
		label: ["Oct 18 110 put", "10月18日 110 看跌"],
		value: 900,
		source: ["Monday · a put", "周一 · 看跌"],
		fails: "scope",
	},
	{
		id: "oct110",
		label: ["Oct 18 110 call", "10月18日 110 看涨"],
		value: 540,
		source: ["Monday", "周一"],
	},
	{
		id: "oct105",
		label: ["Oct 18 105 call", "10月18日 105 看涨"],
		value: 505,
		source: ["Monday", "周一"],
	},
	{
		id: "oct120",
		label: ["Oct 18 120 call", "10月18日 120 看涨"],
		value: null,
		source: ["Monday · not delivered", "周一 · 未送达"],
	},
];

const AUDIT_ROW = 44;

function CandidateRows({
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
	const removed = (candidate: Candidate) =>
		(candidate.fails === "stale" && state.applied >= 1) ||
		(candidate.fails === "scope" && state.applied >= 2);
	const winner = state.applied >= 3 ? "oct110" : null;
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t([
					"A screen's top values · ALFA calls, Monday",
					"筛选器的最高值 · ALFA 看涨，周一",
				])}
			</Label>
			{candidates.map((candidate, i) => {
				const y = 28 + i * AUDIT_ROW;
				const out = removed(candidate);
				const missing = candidate.value === null;
				const win = candidate.id === winner;
				return (
					<m.g
						key={candidate.id}
						initial={false}
						animate={{ opacity: out ? 0.35 : 1 }}
						transition={motion.fade}
					>
						<rect
							x={8}
							y={y}
							width={width - 16}
							height={AUDIT_ROW - 6}
							rx={8}
							className={win ? "wt-focus-shape" : "wt-panel-shape"}
							style={
								missing && state.applied >= 3 ? { fill: hatch } : undefined
							}
						/>
						<Label
							x={18}
							y={y + 17}
							tone={win ? "accent" : undefined}
							className="wt-halo"
						>
							{t(candidate.label)}
						</Label>
						<Label x={18} y={y + 32} tone="small" className="wt-halo">
							{t(candidate.source)}
						</Label>
						<Label x={width - 18} y={y + 17} anchor="end" className="wt-halo">
							{candidate.value === null ? "?" : count(candidate.value)}
						</Label>
						{out ? (
							<Label x={width - 18} y={y + 32} anchor="end" tone="loss">
								{candidate.fails === "stale"
									? t(["wrong session", "时段不对"])
									: t(["not a call", "不是看涨"])}
							</Label>
						) : missing && state.applied >= 3 ? (
							<Label
								x={width - 18}
								y={y + 32}
								anchor="end"
								tone="accent"
								className="wt-halo"
								maxWidth={width - 48 - textWidth(t(candidate.source), 11)}
							>
								{t(["unknown, not zero", "未知，不是零"])}
							</Label>
						) : null}
					</m.g>
				);
			})}
		</g>
	);
}

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
	const top = candidates.find(
		(candidate) =>
			!(
				(candidate.fails === "stale" && shown.applied >= 1) ||
				(candidate.fails === "scope" && shown.applied >= 2)
			),
	);
	const result: ResultItem[] = [
		{
			id: "top",
			label:
				shown.applied >= 3
					? t(["Candidate", "候选"])
					: t(["Top of the screen", "筛选器最高"]),
			value: top
				? `${t(top.label)} · ${top.value === null ? "?" : count(top.value)}`
				: "—",
			note:
				shown.applied >= 3
					? t([
							"read next with its neighbors · Oct 18 120 still missing",
							"接下来连同邻近格子一起看 · 10月18日 120 仍缺失",
						])
					: undefined,
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The largest values on a screen, checked for session, scope and missing data",
						"筛选器上最大的数值，逐项检查时段、范围与缺失数据",
					])}
					height={28 + candidates.length * AUDIT_ROW}
				>
					{(width) => (
						<CandidateRows width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Checks applied", "已应用的检查"])}
						value={String(explore.applied) as "0" | "1" | "2" | "3"}
						options={[
							["0", t(["None", "无"])],
							["1", t(["Session", "时段"])],
							["2", t(["+ Scope", "+ 范围"])],
							["3", t(["+ Missing", "+ 缺失"])],
						]}
						onChange={(value) => setExplore({ applied: Number(value) })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Before a value can lead, it must belong: the right session, inside the declared scope, and actually observed. A stale figure can't win today's comparison, a put can't lead a calls neighborhood, and a missing cell stays unknown. The survivor earns a closer look with its neighbors, not a conclusion about a spread, an owner or a forecast.",
						"一个数值要能领先，先得合格：时段正确、在声明范围内、并且确实被观测到。过时的数字不能赢得今天的比较，看跌不能领跑看涨邻域，缺失的格子保持未知。留下来的候选值得连同邻近格子再仔细看看，而不是据此得出价差、持有人或预测的结论。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<LocateState, LocateState>({
		id: "locate",
		label: ["Explore the neighborhood", "探索邻域"],
		title: ["A contract needs its neighbors", "一张合约需要看它的邻居"],
		predict: {
			prompt: [
				"The Oct 18 105 and 110 calls both traded over 500 contracts on Monday. Two crowds betting on a rise?",
				"周一 10月18日 105 与 110 看涨都成交了 500 张以上。是两群人在押注上涨吗？",
			],
			choices: [
				{
					id: "one",
					label: [
						"Maybe one trade: check the tape",
						"可能是同一笔交易：查成交记录",
					],
				},
				{ id: "two", label: ["Yes: two bullish crowds", "是的：两群看涨的人"] },
				{
					id: "more",
					label: ["Yes, and more will follow", "是的，而且还会有更多"],
				},
			],
			answer: "one",
			revealAt: 2,
			explain: [
				"500 of each came from the 10:50 block: buy the 105, sell the 110. Two busy neighbors can be one spread.",
				"两者各有 500 张来自 10:50 的大单：买入 105、卖出 110。两个相邻的活跃格子可能是同一笔价差。",
			],
		},
		beats: [
			{
				id: "grid",
				label: ["The grid", "网格"],
				caption: [
					"Monday's ALFA call volume, laid out by expiry and strike. The Oct 18 105 and 110 cells stand out.",
					"周一 ALFA 看涨成交量按到期日与行权价展开。10月18日 105 与 110 两格格外显眼。",
				],
				state: { spot: false, focus: false },
			},
			{
				id: "spot",
				label: ["Moneyness", "价内外"],
				caption: [
					"With ALFA at $100.02, the 95 and 100 calls are in the money and 105 and up are out. That's where they sit, not advice.",
					"ALFA 为 $100.02 时，95 与 100 看涨是实值，105 及以上是虚值。这只是位置，不是建议。",
				],
				state: { spot: true, focus: false },
			},
			{
				id: "context",
				label: ["Context", "背景"],
				caption: [
					"Read the 110's 540 beside its neighbor: 505 in the 105. 500 of each came from one spread, bought and sold together at 10:50.",
					"把 110 的 540 与它的邻居 105 的 505 一起看：两者各有 500 张来自同一笔价差，在 10:50 同时买卖。",
				],
				state: { spot: true, focus: true },
			},
		],
		explore: {
			prompt: [
				"Add the spot line and the context one at a time.",
				"逐步加入现价线和背景。",
			],
			start: (last) => last,
			task: {
				kind: "answer",
				prompt: [
					"Add the spot line. Which call strikes are in the money with ALFA at $100.02?",
					"加上现价线。ALFA 为 $100.02 时，哪些看涨行权价是实值？",
				],
				choices: [
					{ id: "itm", label: ["$95 and $100", "$95 和 $100"] },
					{ id: "otm", label: ["$105 and above", "$105 及以上"] },
					{ id: "atm", label: ["Only $100", "只有 $100"] },
				],
				answer: "itm",
				done: [
					"A call is in the money when the stock is above its strike: $95 and $100 here. That places a contract; it isn't advice about it.",
					"股价高于行权价时看涨期权是实值：这里是 $95 和 $100。这只是在定位合约，不是关于它的建议。",
				],
			},
		},
		View: LocateView,
	}),
	defineScene<ShapeState, ShapeState>({
		id: "shape",
		label: ["Compare the shapes", "比较形状"],
		title: [
			"Equal totals and peaks can hide different breadth",
			"相同的合计与峰值可能隐藏不同的广度",
		],
		predict: {
			prompt: [
				"ALFA's Sep 20 and Nov 15 calls both total 695 contracts with a 380 peak. Is the activity spread the same way?",
				"ALFA 的 9月20日 与 11月15日 看涨合计都是 695 张，峰值都是 380。成交分布一样吗？",
			],
			choices: [
				{
					id: "no",
					label: ["No: 2 strikes vs 5 strikes", "不一样：2 个行权价对 5 个"],
				},
				{
					id: "yes",
					label: ["Yes: same total and peak", "一样：合计与峰值相同"],
				},
				{
					id: "cant",
					label: ["Can't compare different expiries", "不同到期日无法比较"],
				},
			],
			answer: "no",
			revealAt: 2,
			explain: [
				"Sep 20 traded in only the 100 and 105 strikes; Nov 15 traded in five. Same total, same peak, different breadth.",
				"9月20日 只在 100 与 105 两个行权价有成交；11月15日 在五个行权价有成交。合计相同，峰值相同，广度不同。",
			],
		},
		beats: [
			{
				id: "total",
				label: ["Totals", "合计"],
				caption: [
					"The Sep 20 and Nov 15 rows each total 695 contracts.",
					"9月20日 与 11月15日 两行合计都是 695 张。",
				],
				state: { stage: 0 },
			},
			{
				id: "peak",
				label: ["Peaks", "峰值"],
				caption: [
					"Each also peaks at 380, in the 100 strike.",
					"两行的峰值也都是 380，都在 100 行权价。",
				],
				state: { stage: 1 },
			},
			{
				id: "breadth",
				label: ["Breadth", "广度"],
				caption: [
					"But Sep 20 traded in just two strikes and Nov 15 in five. Report concentration separately from the total.",
					"但 9月20日 只有两个行权价有成交，11月15日 有五个。集中度要与合计分开报告。",
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: [
				"Switch between totals, peaks and breadth.",
				"在合计、峰值与广度之间切换。",
			],
			start: (last) => last,
			task: {
				kind: "answer",
				prompt: [
					"Which expiry concentrated its 695 contracts in just two strikes?",
					"哪个到期日把 695 张集中在两个行权价上？",
				],
				choices: [
					{ id: "sep", label: ["Sep 20", "9月20日"] },
					{ id: "nov", label: ["Nov 15", "11月15日"] },
					{
						id: "both",
						label: [
							"Both: same total, same peak",
							"两者都是：合计相同，峰值相同",
						],
					},
				],
				answer: "sep",
				done: [
					"Sep 20 traded only in the 100 and 105 strikes; Nov 15 spread the same 695 over five. Same total, same 380 peak, different breadth, so report concentration separately.",
					"9月20日 只在 100 和 105 行权价成交；11月15日 把同样的 695 张分散在五个行权价上。合计相同、峰值都是 380，但广度不同，所以集中度要单独报告。",
				],
			},
		},
		View: ShapeView,
	}),
	defineScene<AuditState, AuditState>({
		id: "audit",
		label: ["Audit the candidates", "审计候选"],
		title: [
			"The biggest value on screen may not be eligible",
			"屏幕上最大的数值可能不合格",
		],
		predict: {
			prompt: [
				"A screen's top value is 1,400 contracts in the Nov 15 115 call, but that figure is from Friday. Can it lead Monday's comparison?",
				"筛选器最高值是 11月15日 115 看涨的 1,400 张，但这个数字来自周五。它能领先周一的比较吗？",
			],
			choices: [
				{ id: "no", label: ["No: it's the wrong session", "不能：时段不对"] },
				{ id: "yes", label: ["Yes: it's the biggest", "能：它最大"] },
				{
					id: "average",
					label: ["Only if averaged with Monday", "与周一平均后才行"],
				},
			],
			answer: "no",
			revealAt: 1,
			explain: [
				"A stale figure can't win a current-session comparison. Monday's figure for that contract is 55.",
				"过时的数字不能赢得当日的比较。那张合约周一的数字是 55。",
			],
		},
		beats: [
			{
				id: "screen",
				label: ["The screen", "筛选器"],
				caption: [
					"A screen lists the biggest values it has for ALFA calls: 1,400, 900, 540, 505 and one blank.",
					"筛选器列出它所有的 ALFA 看涨最大值：1,400、900、540、505，还有一个空白。",
				],
				state: { applied: 0 },
			},
			{
				id: "session",
				label: ["Session", "时段"],
				caption: [
					"The 1,400 is Friday's figure for the Nov 15 115 call; Monday's is 55. A stale value can't lead today's comparison.",
					"1,400 是 11月15日 115 看涨周五的数字；周一是 55。过时的数值不能领先今天的比较。",
				],
				state: { applied: 1 },
			},
			{
				id: "scope",
				label: ["Scope", "范围"],
				caption: [
					"The 900 is a put. It may be real, but it's outside a calls neighborhood.",
					"900 是看跌。它可能是真实的，但不在看涨邻域之内。",
				],
				state: { applied: 2 },
			},
			{
				id: "missing",
				label: ["Missing", "缺失"],
				caption: [
					"That leaves the Oct 18 110 call at 540 as the candidate, with the 120 call still missing, not zero.",
					"剩下 540 张的 10月18日 110 看涨成为候选，而 120 看涨仍然缺失，不是零。",
				],
				state: { applied: 3 },
			},
		],
		explore: {
			prompt: ["Apply the checks one at a time.", "逐项应用检查。"],
			start: () => ({ applied: 3 }),
			task: {
				kind: "answer",
				prompt: [
					"Which check removed the screen's biggest figure, 1,400?",
					"哪项检查去掉了屏幕上最大的数字 1,400？",
				],
				choices: [
					{
						id: "session",
						label: ["Session: it's Friday's", "时段：那是周五的"],
					},
					{ id: "scope", label: ["Scope: it's a put", "范围：那是看跌"] },
					{ id: "missing", label: ["Missing data", "数据缺失"] },
				],
				answer: "session",
				done: [
					"The 1,400 is Friday's figure for the Nov 15 115 call; Monday's is 55. A stale value can't lead today's comparison, however big it is.",
					"1,400 是 11月15日 115 看涨的周五数字；周一的是 55。过期的数值再大，也不能在今天的比较中领先。",
				],
			},
		},
		View: AuditView,
	}),
] as const;

export function RankContractsWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="rank-contracts"
			label={["Interactive lesson on contract neighborhoods", "合约邻域互动课"]}
			scenes={scenes}
		/>
	);
}
