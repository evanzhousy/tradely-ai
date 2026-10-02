import * as m from "motion/react-m";
import {
	type Copy,
	contractDte,
	mondayScreen,
	pick,
	runScreen,
	SESSION_DATE,
	screenDefaults,
	volumeToOi,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import {
	type Claim,
	ClaimLadderStage,
} from "../walkthrough/instruments/claim-ladder";
import { Label, Stage, useTeachMotion } from "../walkthrough/stage";
import { wrapText } from "../walkthrough/text-measure";
import {
	defineScene,
	type EvidenceKind,
	type Phase,
	type ResultItem,
} from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

const PASSED = runScreen(mondayScreen, screenDefaults, SESSION_DATE);
const NAMES = new Set(PASSED.map((row) => row.symbol)).size;
const CRUX = PASSED[0];
const NEAR = PASSED.filter(
	(row) => contractDte(row, SESSION_DATE) <= 30,
).length;

function evidenceLabels(locale: Locale): Record<EvidenceKind, string> {
	const t = tr(locale);
	return {
		observed: t(["in the report", "报告中有"]),
		calculated: t(["calculated", "可计算"]),
		modeled: t(["modeled", "模型"]),
		inferred: t(["an inference", "推断"]),
		unknown: t(["not supported", "无依据"]),
	};
}

// ——— Scene 1: sort what the AI said ———

type SortState = { stage: 0 | 1 | 2 };

const STATEMENTS: readonly {
	id: string;
	text: Copy;
	basis: Copy;
	evidence: EvidenceKind;
	at: 0 | 1 | 2;
}[] = [
	{
		id: "count",
		text: [
			`The screen flagged ${PASSED.length} contracts across ${NAMES} names on Monday.`,
			`周一的筛选在 ${NAMES} 个标的中标出了 ${PASSED.length} 份合约。`,
		],
		basis: ["the key figures, for Mon Sep 16", "关键数字，9月16日周一"],
		evidence: "observed",
		at: 0,
	},
	{
		id: "ratio",
		text: [
			`The CRUX Oct 4 60 put traded ${volumeToOi(CRUX).toFixed(2)} times its open interest.`,
			`CRUX 10月4日 60 看跌的成交量是其未平仓量的 ${volumeToOi(CRUX).toFixed(2)} 倍。`,
		],
		basis: [
			`${CRUX.volume.toLocaleString("en-US")} ÷ ${CRUX.openInterest.toLocaleString("en-US")} from its row`,
			`其所在行：${CRUX.volume.toLocaleString("en-US")} ÷ ${CRUX.openInterest.toLocaleString("en-US")}`,
		],
		evidence: "calculated",
		at: 0,
	},
	{
		id: "bet",
		text: [
			"Someone opened a large bearish bet on CRUX ahead of news.",
			"有人在消息公布前对 CRUX 建立了大额看空押注。",
		],
		basis: [
			"the screen can't show who traded, why, or opening vs closing",
			"筛选无法显示谁交易、为什么，或是开仓还是平仓",
		],
		evidence: "unknown",
		at: 1,
	},
	{
		id: "near",
		text: [
			`${NEAR} of the ${PASSED.length} flagged contracts expire within 30 days.`,
			`${PASSED.length} 份入选合约中有 ${NEAR} 份在 30 天内到期。`,
		],
		basis: ["count the expiry column", "数一数到期日那一列"],
		evidence: "calculated",
		at: 2,
	},
	{
		id: "fall",
		text: ["CRUX will fall before Oct 4.", "CRUX 会在10月4日前下跌。"],
		basis: [
			"a forecast; no session's data supports it",
			"这是预测；任何交易时段的数据都不能支持它",
		],
		evidence: "unknown",
		at: 2,
	},
];

function SortView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SortState;
	explore: SortState | null;
	setExplore: (next: SortState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const claims: Claim[] = STATEMENTS.map((item) => ({
		id: item.id,
		text: t(item.text),
		basis: t(item.basis),
		evidence: item.evidence,
		hidden: item.at > shown.stage,
		focus: item.at === shown.stage && shown.stage > 0,
	}));
	const visible = STATEMENTS.filter((item) => item.at <= shown.stage);
	const unsupported = visible.filter(
		(item) => item.evidence === "unknown",
	).length;
	const result: ResultItem[] = [
		{
			id: "checked",
			label: t(["Statements checked", "已核查的陈述"]),
			value: `${visible.length} / ${STATEMENTS.length}`,
		},
		{
			id: "unsupported",
			label: t(["Not supported by the data", "数据不支持"]),
			value: String(unsupported),
			note: unsupported
				? t(["leave them out or label them", "删掉或加以标注"])
				: t(["so far", "目前为止"]),
			tone: unsupported ? "loss" : undefined,
		},
	];
	return (
		<SceneFrame
			stage={
				<ClaimLadderStage
					label={t([
						"Statements from TradingFlow AI about Monday's unusual-activity screen, each marked by the evidence behind it",
						"TradingFlow AI 关于周一异常成交筛选的陈述，每条都标注其背后的证据",
					])}
					title={t([
						"TradingFlow AI · about Monday's screen",
						"TradingFlow AI · 关于周一的筛选",
					])}
					claims={claims}
					evidenceLabels={evidenceLabels(locale)}
				/>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Show", "显示"])}
						value={String(explore.stage) as "0" | "1" | "2"}
						options={[
							["0", t(["First two", "前两条"])],
							["1", t(["Three", "三条"])],
							["2", t(["All five", "全部五条"])],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as SortState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"TradingFlow AI understands the page you have open and can query market data, but what it writes is a draft. Sort every sentence before you rely on it: is it shown in the report, can you calculate it from the rows, or does it go beyond the data? Flow data can't identify who traded, why, or whether a trade opened a position, and no session's data supports a statement about where a price will go. TradingFlow's own reports say none of these measures proves identity, intent or a future move, and the assistant runs read-only queries; it can't check its reasoning for you.",
						"TradingFlow AI 能理解你打开的页面，也能查询市场数据，但它写出来的只是草稿。依赖每句话之前先分类：它是报告里有的、能从行数据算出来的，还是超出了数据？成交流数据无法识别谁在交易、为什么交易，或一笔交易是不是开仓；任何交易时段的数据也都不支持关于价格走向的说法。TradingFlow 自己的报告也说明，这些指标都不能证明身份、意图或未来走势；而这个助手运行的是只读查询，它没法替你检查它的推理。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: credits and context ———

type CreditState = { text: number; chart: number; costs: boolean };

const COST = { text: 1, chart: 2 } as const;
const LEDGER_ROW = 34;

function creditRows(state: CreditState) {
	return [
		...Array.from({ length: state.text }, (_, i) => ({
			id: `text-${i}`,
			kind: "text" as const,
		})),
		...Array.from({ length: state.chart }, (_, i) => ({
			id: `chart-${i}`,
			kind: "chart" as const,
		})),
	];
}
/** Room for five replies and the total. */
const CREDIT_HEIGHT = 30 + 5 * LEDGER_ROW + 50;

function CreditStage({
	width,
	state,
	locale,
}: {
	width: number;
	state: CreditState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const rows = creditRows(state);
	const total = state.text * COST.text + state.chart * COST.chart;
	const footY = 30 + 5 * LEDGER_ROW + 10;
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t(["Billing · AI usage history", "账单 · AI 使用记录"])}
			</Label>
			{rows.map((row, i) => (
				<m.g
					key={row.id}
					initial={false}
					animate={{ y: 30 + i * LEDGER_ROW }}
					transition={motion.move}
				>
					<rect
						x={4}
						y={0}
						width={width - 8}
						height={LEDGER_ROW - 6}
						rx={7}
						className="wt-panel-shape"
					/>
					<Label x={14} y={18} tone="small">
						{row.kind === "chart"
							? t([`Reply ${i + 1} · with a chart`, `回复 ${i + 1} · 含图表`])
							: t([`Reply ${i + 1} · text`, `回复 ${i + 1} · 文字`])}
					</Label>
					<m.text
						x={width - 14}
						y={18}
						textAnchor="end"
						initial={false}
						animate={{ opacity: state.costs ? 1 : 0 }}
						transition={motion.fade}
					>
						{t([
							`${COST[row.kind]} credit${COST[row.kind] === 1 ? "" : "s"}`,
							`${COST[row.kind]} 积分`,
						])}
					</m.text>
				</m.g>
			))}
			<m.g
				initial={false}
				animate={{ opacity: state.costs ? 1 : 0 }}
				transition={motion.fade}
			>
				<rect
					x={4}
					y={footY}
					width={width - 8}
					height={34}
					rx={8}
					className="wt-focus-shape"
				/>
				<Label x={14} y={footY + 22} className="wt-accent">
					{t(["Total", "合计"])}
				</Label>
				<Label x={width - 14} y={footY + 22} anchor="end" tone="strong">
					{t([`${total} credits`, `${total} 积分`])}
				</Label>
			</m.g>
		</g>
	);
}

function CreditView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: CreditState;
	explore: CreditState | null;
	setExplore: (next: CreditState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const total = shown.text * COST.text + shown.chart * COST.chart;
	const result: ResultItem[] = shown.costs
		? [
				{
					id: "total",
					label: t(["Credits used", "消耗的积分"]),
					value: String(total),
					note: t([
						`${shown.text} × 1 + ${shown.chart} × 2`,
						`${shown.text} × 1 + ${shown.chart} × 2`,
					]),
					evidence: "calculated",
				},
				{
					id: "context",
					label: t(["Annotate", "Annotate"]),
					value: t(["Adds context", "添加上下文"]),
					note: t(["pick an element on the page", "选取页面上的一个元素"]),
				},
			]
		: [
				{
					id: "replies",
					label: t(["Replies", "回复"]),
					value: String(shown.text + shown.chart),
					note: t([
						`${shown.chart} with a chart`,
						`其中 ${shown.chart} 条含图表`,
					]),
				},
			];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The AI usage history for a short conversation: each reply and the credits it used, with the total",
						"一段简短对话的 AI 使用记录：每条回复及其消耗的积分，以及合计",
					])}
					height={CREDIT_HEIGHT}
				>
					{(width) => (
						<CreditStage width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<>
						<ChoiceField
							label={t(["Text replies", "文字回复"])}
							value={String(explore.text) as "1" | "2" | "3"}
							options={[
								["1", "1"],
								["2", "2"],
								["3", "3"],
							]}
							onChange={(value) =>
								setExplore({ ...explore, text: Number(value) })
							}
						/>
						<ChoiceField
							label={t(["Replies with a chart", "含图表的回复"])}
							value={String(explore.chart) as "0" | "1" | "2"}
							options={[
								["0", "0"],
								["1", "1"],
								["2", "2"],
							]}
							onChange={(value) =>
								setExplore({ ...explore, chart: Number(value) })
							}
						/>
					</>
				) : null
			}
			details={
				<p>
					{t([
						'Every TradingFlow AI reply uses credits: 1 for a reply, 2 when it includes a chart or deep analysis. The sidebar shows your balance, and Billing lists the credits each completed reply used. Annotate lets you pick an element on the page, such as a table or a row, so the question carries that context instead of a vague "this". The assistant runs read-only queries and can\'t change your data, and access to it depends on your plan, AI consent and rollout.',
						"TradingFlow AI 的每条回复都会消耗积分：普通回复 1 积分，包含图表或深度分析的回复 2 积分。侧边栏显示你的余额，“账单”里列出每条完成的回复消耗了多少积分。Annotate 让你选取页面上的一个元素，比如一个表格或一行，这样问题就带着这个上下文，而不是含糊的“这个”。这个助手运行只读查询，不能修改你的数据；能否使用它取决于你的方案、AI 授权和灰度范围。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: AI Insight explains; it doesn't edit ———

type InsightState = { stage: 0 | 1 | 2 };

const INSIGHT_BODY: Copy = [
	"Explains this run: why five contracts passed, and what volume/OI can't tell you. The recipe is untouched.",
	"解释这次运行：为什么有五份合约通过，以及成交量/OI 不能告诉你什么。Recipe 不受影响。",
];
const EDIT_BODY: Copy = [
	"Opens a private working draft you can change, review, undo and save. The official recipe stays as it is.",
	"打开一份可修改、审阅、撤销和保存的私有工作草稿。官方 Recipe 保持原样。",
];

const panelLines = (text: string, width: number) =>
	wrapText(text, width - 24, 12);
/** Both panels take the height of the longer body, so neither cuts its text. */
const insightLayout = (width: number, locale: Locale) => {
	const t = tr(locale);
	const narrow = width < 520;
	const w = narrow ? width - 8 : (width - 8 - 16) / 2;
	const lines = Math.max(
		panelLines(t(INSIGHT_BODY), w).length,
		panelLines(t(EDIT_BODY), w).length,
	);
	const panelH = 50 + lines * 16;
	return {
		w,
		panelH,
		left: { x: 4, y: 74 },
		right: narrow ? { x: 4, y: 74 + panelH + 14 } : { x: 4 + w + 16, y: 74 },
		height: narrow ? 74 + 2 * panelH + 14 + 8 : 74 + panelH + 8,
	};
};

function InsightStage({
	width,
	state,
	locale,
}: {
	width: number;
	state: InsightState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const layout = insightLayout(width, locale);
	const panel = (
		at: { x: number; y: number },
		title: Copy,
		body: Copy,
		show: boolean,
		changed: boolean,
		key: string,
	) => (
		<m.g
			key={key}
			initial={false}
			animate={{ opacity: show ? 1 : 0.25 }}
			transition={motion.fade}
		>
			<rect
				x={at.x}
				y={at.y}
				width={layout.w}
				height={layout.panelH}
				rx={10}
				className={changed ? "wt-focus-shape" : "wt-panel-shape"}
			/>
			<Label
				x={at.x + 12}
				y={at.y + 22}
				className={changed ? "wt-accent" : undefined}
			>
				{t(title)}
			</Label>
			{panelLines(t(body), layout.w).map((line, i) => (
				<Label
					key={`${i}-${line}`}
					x={at.x + 12}
					y={at.y + 44 + i * 16}
					tone="muted"
				>
					{line}
				</Label>
			))}
		</m.g>
	);
	return (
		<g>
			<rect
				x={4}
				y={8}
				width={width - 8}
				height={52}
				rx={10}
				className="wt-panel-shape"
			/>
			<Label x={16} y={30}>
				Unusual Options Activity Screener
			</Label>
			<m.text
				key={`recipe-${state.stage}`}
				x={16}
				y={48}
				className={state.stage === 2 ? "wt-small wt-accent" : "wt-small"}
				initial={motion.enabled ? { opacity: 0 } : false}
				animate={{ opacity: 1 }}
				transition={motion.fade}
			>
				{state.stage === 2
					? t([
							"Official recipe · unchanged · your private draft opened",
							"官方 Recipe · 未改动 · 已打开你的私有草稿",
						])
					: t(["Official recipe · unchanged", "官方 Recipe · 未改动"])}
			</m.text>
			{panel(
				layout.left,
				["AI Insight", "AI Insight"],
				INSIGHT_BODY,
				state.stage >= 1,
				false,
				"insight",
			)}
			{panel(
				layout.right,
				["Edit with AI", "Edit with AI"],
				EDIT_BODY,
				state.stage >= 2,
				state.stage >= 2,
				"edit",
			)}
		</g>
	);
}

function InsightView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: InsightState;
	explore: InsightState | null;
	setExplore: (next: InsightState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] =
		shown.stage === 0
			? [
					{
						id: "recipe",
						label: t(["The recipe", "Recipe"]),
						value: t(["Official", "官方"]),
						note: t(["two AI actions available", "提供两种 AI 操作"]),
					},
				]
			: [
					{
						id: "recipe",
						label: t(["The recipe", "Recipe"]),
						value: t(["Unchanged", "未改动"]),
						note: t([
							"AI Insight only explains a run",
							"AI Insight 只解释一次运行",
						]),
					},
				];
	if (shown.stage >= 2)
		result.push({
			id: "draft",
			label: t(["Edit with AI", "Edit with AI"]),
			value: t(["A private draft", "私有草稿"]),
			note: t(["changes only after you save", "保存后才算修改"]),
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The screener recipe with two AI actions: AI Insight explains a run and leaves the recipe unchanged; Edit with AI opens a private draft",
						"筛选器 Recipe 的两种 AI 操作：AI Insight 解释一次运行且不改动 Recipe；Edit with AI 打开一份私有草稿",
					])}
					height={(width) => insightLayout(width, locale).height}
				>
					{(width) => (
						<InsightStage width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Use", "使用"])}
						value={String(explore.stage) as "1" | "2"}
						options={[
							["1", "AI Insight"],
							["2", "Edit with AI"],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as InsightState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A recipe page offers two AI actions with different jobs. AI Insight explains the data in one completed run and changes nothing in the recipe; its answer is not a trade signal. Edit with AI opens a private working draft where AI changes the recipe's inputs and blocks, which you review, undo or save. If you ask the assistant to change a recipe while you are only viewing it, it should send you to Edit with AI.",
						"Recipe 页面提供两种用途不同的 AI 操作。AI Insight 解释一次已完成运行中的数据，不改动 Recipe 的任何内容；它的回答也不是交易信号。Edit with AI 打开一份私有工作草稿，AI 在其中修改 Recipe 的输入和区块，由你审阅、撤销或保存。如果你只是在查看 Recipe 时让助手修改它，它应该引导你去用 Edit with AI。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<SortState, SortState>({
		id: "sort",
		label: ["Sort the answer", "给回答分类"],
		title: [
			"An AI answer is a draft until you sort it",
			"分类之前，AI 的回答都只是草稿",
		],
		predict: {
			prompt: [
				'TradingFlow AI says: "Someone opened a large bearish bet on CRUX ahead of news." What does Monday\'s screen support?',
				"TradingFlow AI 说：“有人在消息公布前对 CRUX 建立了大额看空押注。”周一的筛选支持其中哪部分？",
			],
			choices: [
				{
					id: "none",
					label: [
						"None of it: the screen can't show who, why, or opening",
						"都不支持：筛选无法显示是谁、为什么，或是否开仓",
					],
				},
				{
					id: "all",
					label: [
						"All of it: 2.67× open interest is a big bet",
						"全部支持：2.67 倍未平仓量就是大额押注",
					],
				},
				{
					id: "size",
					label: ["Only that the trade was large", "只支持“交易规模大”这一点"],
				},
			],
			answer: "none",
			revealAt: 1,
			explain: [
				"Volume against open interest says how big the session was next to the existing book. It can't name a trader, a motive or whether a position was opened.",
				"成交量对比未平仓量，说明的是本时段相对于已有持仓有多大。它无法指认交易者、动机，也无法说明是否开了仓。",
			],
		},
		beats: [
			{
				id: "supported",
				label: ["Supported", "有依据"],
				caption: [
					"The first two statements check out: one is in the key figures, the other is a calculation from a row.",
					"前两条陈述站得住：一条在关键数字里，另一条可以从某一行算出来。",
				],
				state: { stage: 0 },
			},
			{
				id: "bet",
				label: ["The bet", "押注"],
				caption: [
					'"Someone opened a large bearish bet" goes beyond the data: the screen can\'t show who traded, why, or whether it opened a position.',
					"“有人建立了大额看空押注”超出了数据：筛选无法显示谁交易、为什么，或是否开了仓。",
				],
				state: { stage: 1 },
			},
			{
				id: "rest",
				label: ["The rest", "其余"],
				caption: [
					'Of the last two, one is a count you can check in the expiry column; "CRUX will fall" is a forecast no session\'s data supports.',
					"最后两条里，一条是可以在到期日那列核对的计数；“CRUX 会下跌”是任何交易时段的数据都不支持的预测。",
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: ["Step through the statements.", "逐条查看陈述。"],
			start: () => ({ stage: 2 }),
			task: {
				kind: "answer",
				prompt: [
					"Which statement can you check by counting a column?",
					"哪条陈述可以靠数一列来核实？",
				],
				choices: [
					{
						id: "expiry",
						label: [
							"3 of the 5 flagged contracts expire within 30 days",
							"5 份入选合约中有 3 份在 30 天内到期",
						],
					},
					{
						id: "bet",
						label: [
							"Someone opened a large bearish bet on CRUX",
							"有人在 CRUX 上开了一笔大额看跌押注",
						],
					},
					{
						id: "fall",
						label: ["CRUX will fall before Oct 4", "CRUX 会在 10月4日 前下跌"],
					},
				],
				answer: "expiry",
				done: [
					"Count the expiry column and you can confirm it. A bet's author and motive aren't in any screen, and a forecast isn't something one session's data can support.",
					"数一数到期日那一列就能核实。押注的人和动机不在任何屏幕上，而预测也不是一个时段的数据能支持的。",
				],
			},
		},
		View: SortView,
	}),
	defineScene<CreditState, CreditState>({
		id: "credits",
		label: ["Credits", "积分"],
		title: ["Every reply costs credits", "每条回复都消耗积分"],
		predict: {
			prompt: [
				"You ask TradingFlow AI three questions, and one reply includes a chart. How many credits do the replies use?",
				"你向 TradingFlow AI 问了三个问题，其中一条回复含图表。这些回复一共消耗多少积分？",
			],
			choices: [
				{ id: "four", label: ["4", "4"] },
				{ id: "three", label: ["3", "3"] },
				{ id: "six", label: ["6", "6"] },
			],
			answer: "four",
			entry: { answer: 4, unit: [" credits", " 积分"] },
			revealAt: 1,
			explain: [
				"Two plain replies at 1 credit each, and one with a chart at 2: 4 credits.",
				"两条普通回复各 1 积分，一条含图表的回复 2 积分：共 4 积分。",
			],
		},
		beats: [
			{
				id: "replies",
				label: ["Replies", "回复"],
				caption: [
					"Three questions to TradingFlow AI; the last reply includes a chart.",
					"向 TradingFlow AI 问了三个问题；最后一条回复含图表。",
				],
				state: { text: 2, chart: 1, costs: false },
			},
			{
				id: "costs",
				label: ["Costs", "费用"],
				caption: [
					"Billing's usage history lists each reply: 1 credit for text, 2 with a chart, 4 in all.",
					"账单的使用记录列出每条回复：文字 1 积分，含图表 2 积分，共 4 积分。",
				],
				state: { text: 2, chart: 1, costs: true },
			},
			{
				id: "context",
				label: ["Context", "上下文"],
				caption: [
					'Use Annotate to point a question at one table or row, so a single reply answers it, rather than paying for follow-ups that clarify "this".',
					"用 Annotate 把问题指向某个表格或某一行，一条回复就能回答清楚，而不是为澄清“这个”而付费追问。",
				],
				state: { text: 2, chart: 1, costs: true },
			},
		],
		explore: {
			prompt: ["Change the conversation.", "改变这段对话。"],
			start: () => ({ text: 3, chart: 2, costs: true }),
			task: {
				kind: "reach",
				prompt: [
					"Set up a conversation that costs exactly 5 credits.",
					"设定一段正好花费 5 积分的对话。",
				],
				reached: (e) => e.text * COST.text + e.chart * COST.chart === 5,
				done: [
					"Text replies cost 1 credit and replies with a chart 2: three text and one chart, or one text and two charts, make 5. Pointing a question at one table with Annotate saves the follow-ups.",
					"文字回复 1 积分，含图表的回复 2 积分：三条文字加一条图表，或一条文字加两条图表，都是 5 积分。用 Annotate 把问题指向某个表格，可以省掉追问。",
				],
			},
		},
		View: CreditView,
	}),
	defineScene<InsightState, InsightState>({
		id: "insight",
		label: ["Insight vs edit", "解释与编辑"],
		title: [
			"AI Insight explains; Edit with AI changes a draft",
			"AI Insight 只解释；Edit with AI 修改草稿",
		],
		predict: {
			prompt: [
				"You run AI Insight on Monday's screener. What changes in the recipe?",
				"你对周一的筛选器运行 AI Insight。Recipe 会发生什么变化？",
			],
			choices: [
				{
					id: "nothing",
					label: [
						"Nothing: it explains one run",
						"什么都不变：它只解释一次运行",
					],
				},
				{
					id: "inputs",
					label: [
						"Its inputs, to match the explanation",
						"它的输入，以符合解释",
					],
				},
				{
					id: "copy",
					label: ["A private copy is created", "会创建一份私有副本"],
				},
			],
			answer: "nothing",
			revealAt: 1,
			explain: [
				"AI Insight explains the data in one completed run and leaves the recipe as it is. Only Edit with AI opens a draft you can change.",
				"AI Insight 解释一次已完成运行中的数据，Recipe 保持原样。只有 Edit with AI 才会打开一份你可以修改的草稿。",
			],
		},
		beats: [
			{
				id: "recipe",
				label: ["The recipe", "Recipe"],
				caption: [
					"Monday's screener, as an official recipe, offers two AI actions.",
					"周一的筛选器作为官方 Recipe，提供两种 AI 操作。",
				],
				state: { stage: 0 },
			},
			{
				id: "insight",
				label: ["AI Insight", "AI Insight"],
				caption: [
					"AI Insight explains this run, and the recipe is untouched. Sort its sentences like any AI answer.",
					"AI Insight 解释这次运行，Recipe 不受影响。像对待任何 AI 回答一样给它的句子分类。",
				],
				state: { stage: 1 },
			},
			{
				id: "edit",
				label: ["Edit with AI", "Edit with AI"],
				caption: [
					"Edit with AI opens a private draft where changes happen, for you to review, undo or save. The official recipe still doesn't change.",
					"Edit with AI 打开一份私有草稿，修改在其中进行，由你审阅、撤销或保存。官方 Recipe 依然不变。",
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: ["Choose an AI action.", "选择一种 AI 操作。"],
			start: () => ({ stage: 1 }),
			task: {
				kind: "answer",
				prompt: [
					"Which AI action can change a recipe?",
					"哪种 AI 操作可以改变 Recipe？",
				],
				choices: [
					{
						id: "edit",
						label: [
							"Edit with AI, in a private draft",
							"Edit with AI，在私有草稿中",
						],
					},
					{ id: "insight", label: ["AI Insight", "AI Insight"] },
					{ id: "neither", label: ["Neither", "都不能"] },
				],
				answer: "edit",
				done: [
					"AI Insight explains one completed run and leaves the recipe alone. Edit with AI forks a private draft that changes only when you review and save it; the official recipe never does.",
					"AI Insight 解释一次已完成的运行，不改动 Recipe。Edit with AI 会分叉出一份私有草稿，只有你审阅并保存时才会改变；官方 Recipe 永远不变。",
				],
			},
		},
		View: InsightView,
	}),
] as const;

export function AiVerifyWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="ai-verify"
			label={[
				"Interactive lesson on checking AI answers",
				"核查 AI 回答互动课",
			]}
			scenes={scenes}
		/>
	);
}
