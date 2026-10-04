import * as m from "motion/react-m";
import { type Copy, pick } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import { Player } from "../walkthrough/player";
import { Label, Stage, useTeachMotion } from "../walkthrough/stage";
import { wrapText } from "../walkthrough/text-measure";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame } from "../walkthrough/walkthrough";
import { researchChecklistFilm } from "./research-checklist-film";
import {
	EDITED,
	FRIEND,
	MESSAGES,
	type Step,
	TEMPLATE,
} from "./research-checklist-model";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

const ROW_GAP = 8;
const stepLines = (text: string, width: number) =>
	wrapText(text, width - 54, 12);
const stepHeight = (step: Step, width: number, locale: Locale) =>
	stepLines(pick(step.text, locale), width).length * 16 + 30;

function StepRow({
	step,
	index,
	y,
	width,
	locale,
	tone,
	note,
}: {
	step: Step;
	index: number;
	y: number;
	width: number;
	locale: Locale;
	tone: "plain" | "focus" | "flag";
	note?: Copy;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const lines = stepLines(t(step.text), width);
	const h = lines.length * 16 + 30;
	return (
		<m.g initial={false} animate={{ y }} transition={motion.move}>
			<rect
				x={4}
				y={0}
				width={width - 8}
				height={h}
				rx={9}
				className={tone === "plain" ? "wt-panel-shape" : "wt-focus-shape"}
				strokeDasharray={tone === "flag" ? "5 4" : undefined}
			/>
			<Label x={16} y={20} tone="small">
				{String(index + 1).padStart(2, "0")}
			</Label>
			{lines.map((line, i) => (
				<Label
					key={`${i}-${line}`}
					x={42}
					y={20 + i * 16}
					tone="muted"
					className={tone === "flag" ? "wt-loss" : undefined}
				>
					{line}
				</Label>
			))}
			<Label
				x={42}
				y={h - 9}
				tone="small"
				className={tone === "flag" ? "wt-loss" : undefined}
			>
				{t(note ?? step.tool)}
			</Label>
		</m.g>
	);
}

/** Rows stacked top to bottom, each as tall as its wrapped text. */
function stack(
	steps: readonly Step[],
	width: number,
	locale: Locale,
	top: number,
) {
	let y = top;
	return steps.map((step) => {
		const at = y;
		y += stepHeight(step, width, locale) + ROW_GAP;
		return at;
	});
}
const stackHeight = (steps: readonly Step[], width: number, locale: Locale) =>
	steps.reduce(
		(sum, step) => sum + stepHeight(step, width, locale) + ROW_GAP,
		0,
	);

// ——— Scene 1: a checklist inspects; it doesn't forecast ———

type ForecastState = { stage: 0 | 1 | 2 };

function ForecastStage({
	width,
	state,
	locale,
}: {
	width: number;
	state: ForecastState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const steps = state.stage === 2 ? TEMPLATE : FRIEND;
	const ys = stack(steps, width, locale, 34);
	return (
		<g>
			<m.text
				key={state.stage === 2 ? "template" : "friend"}
				x={8}
				y={18}
				className="wt-muted"
				initial={motion.enabled ? { opacity: 0 } : false}
				animate={{ opacity: 1 }}
				transition={motion.fade}
			>
				{state.stage === 2
					? t([
							'TradingFlow Home · "Before I sell a call"',
							"TradingFlow Home ·“卖出看涨前”",
						])
					: width < 520
						? t([
								"A friend's call-selling checklist",
								"朋友列的卖出 ALFA 看涨清单",
							])
						: t([
								"A friend's checklist for selling an ALFA call",
								"朋友列的卖出 ALFA 看涨清单",
							])}
			</m.text>
			{steps.map((step, i) => (
				<StepRow
					key={step.id}
					step={step}
					index={i}
					y={ys[i]}
					width={width}
					locale={locale}
					tone={state.stage === 1 && step.id === "forecast" ? "flag" : "plain"}
					note={
						state.stage === 1 && step.id === "forecast"
							? ["a forecast, not a check", "这是预测，不是核查"]
							: undefined
					}
				/>
			))}
		</g>
	);
}

function ForecastView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ForecastState;
	explore: ForecastState | null;
	setExplore: (next: ForecastState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] =
		shown.stage === 0
			? [
					{
						id: "steps",
						label: t(["Steps", "步骤"]),
						value: "3",
					},
				]
			: shown.stage === 1
				? [
						{
							id: "flag",
							label: t(["Doesn't belong", "不应列入"]),
							value: t(["Stays below $105", "一直低于 $105"]),
							note: t([
								"no data can confirm a future price",
								"没有数据能确认未来价格",
							]),
							tone: "loss",
						},
					]
				: [
						{
							id: "template",
							label: t(["TradingFlow's template", "TradingFlow 模板"]),
							value: t(["4 inspection steps", "4 个查看步骤"]),
							note: t(["each opens a tool", "每一步打开一个工具"]),
						},
						{
							id: "note",
							label: t(["Its own note", "模板自带说明"]),
							value: t(["Not a recommendation", "不是建议"]),
							note: t([
								"to sell a covered or naked call",
								"卖出备兑或无备兑看涨",
							]),
						},
					];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A friend's three-step checklist for selling an ALFA call, with its forecast step flagged, then TradingFlow Home's four-step template for the same question",
						"朋友为卖出 ALFA 看涨列的三步清单（其中的预测步骤被标出），以及 TradingFlow Home 针对同一问题的四步模板",
					])}
					height={(width) =>
						34 +
						Math.max(
							stackHeight(FRIEND, width, locale),
							stackHeight(TEMPLATE, width, locale),
						)
					}
				>
					{(width) => (
						<ForecastStage width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Show", "显示"])}
						value={explore.stage === 2 ? "template" : "friend"}
						options={[
							["friend", t(["Friend's list", "朋友的清单"])],
							["template", t(["TradingFlow's template", "TradingFlow 模板"])],
						]}
						onChange={(value) =>
							setExplore({ stage: value === "template" ? 2 : 1 })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						'TradingFlow\'s Home starts from "What are you trying to decide?" and four common questions, such as "Before I sell a call, what should I check?". Each becomes a short, ordered checklist: every step names something to inspect and opens the tool that shows it, like Rank Symbols for volatility or Rank Contracts for a contract\'s spread and open interest. A step that asks you to confirm where the price will be is a forecast: no tool can check it, so it doesn\'t belong. TradingFlow labels its own template "a research checklist, not a recommendation".',
						"TradingFlow 的 Home 从“你想决定什么？”和四个常见问题开始，例如“卖出看涨前应该检查什么？”。每个问题会变成一份简短、有顺序的清单：每一步都写明要查看什么，并打开能显示它的工具，比如查看波动率用 Rank Symbols，查看合约价差和未平仓量用 Rank Contracts。要求你确认价格将会在哪里的步骤是预测：没有工具能核查它，所以不应列入。TradingFlow 给自己的模板标注了“这是研究清单，不是建议”。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: edits aren't saved ———

type EditState = { stage: 0 | 1 | 2 };

function EditStage({
	width,
	state,
	locale,
}: {
	width: number;
	state: EditState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const steps = state.stage === 1 ? EDITED : TEMPLATE;
	const ys = stack(steps, width, locale, 34);
	return (
		<g>
			<m.text
				key={`title-${state.stage}`}
				x={8}
				y={18}
				className={state.stage === 2 ? "wt-accent" : "wt-muted"}
				initial={motion.enabled ? { opacity: 0 } : false}
				animate={{ opacity: 1 }}
				transition={motion.fade}
			>
				{state.stage === 0
					? t(["Your checklist · from the template", "你的清单 · 来自模板"])
					: state.stage === 1
						? t(["Your checklist · edited", "你的清单 · 已编辑"])
						: t([
								"After a refresh · back to the template",
								"刷新后 · 回到模板",
							])}
			</m.text>
			{steps.map((step, i) => (
				<StepRow
					key={step.id}
					step={step}
					index={i}
					y={ys[i]}
					width={width}
					locale={locale}
					tone={
						state.stage === 1 && (step.id === "earnings" || step.id === "flow")
							? "focus"
							: "plain"
					}
				/>
			))}
		</g>
	);
}

function EditView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: EditState;
	explore: EditState | null;
	setExplore: (next: EditState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] =
		shown.stage === 1
			? [
					{
						id: "edits",
						label: t(["Your edits", "你的修改"]),
						value: t(["1 added · 1 moved up", "新增 1 步 · 上移 1 步"]),
						note: t([
							"the earnings date, then recent call flow",
							"财报日期，以及近期看涨成交流",
						]),
					},
				]
			: shown.stage === 2
				? [
						{
							id: "reset",
							label: t(["After refreshing", "刷新之后"]),
							value: t(["The template again", "又是模板"]),
							note: t([
								"Home's checklists aren't saved",
								"Home 的清单不会保存",
							]),
							tone: "loss",
						},
					]
				: [
						{
							id: "template",
							label: t(["Steps", "步骤"]),
							value: "4",
							note: t(["from Home's template", "来自 Home 的模板"]),
						},
					];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The four-step checklist, then your edited five-step version with an earnings step added and call flow moved up, then the template again after a refresh",
						"四步清单，然后是你编辑后的五步版本（新增财报步骤，看涨成交流上移），刷新后又回到模板",
					])}
					height={(width) => 34 + stackHeight(EDITED, width, locale)}
				>
					{(width) => <EditStage width={width} state={shown} locale={locale} />}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Show", "显示"])}
						value={String(explore.stage) as "0" | "1" | "2"}
						options={[
							["0", t(["Template", "模板"])],
							["1", t(["Edited", "已编辑"])],
							["2", t(["Refreshed", "已刷新"])],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as EditState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"You can reorder a checklist's steps, change what each step focuses on, add a focused step from TradingFlow's analysis tools, or remove one. Home says it plainly: the checklist resets when you refresh the page. Treat it as a working plan, and copy the steps you settle on into your own research notes before you leave, along with the question they serve.",
						"你可以调整清单步骤的顺序、改变每一步关注的重点、从 TradingFlow 的分析工具中添加一个聚焦的步骤，或删掉一步。Home 写得很清楚：刷新页面后清单会重置。把它当作临时的工作计划，离开前把你最终确定的步骤连同它们所服务的问题一起，抄进自己的研究笔记。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: Customize with AI asks first ———

type ChatState = { stage: 0 | 1 | 2 };

const BUBBLE_PAD = 12;
const bubbleW = (width: number) => Math.min(width - 8, 420);
const bubbleLines = (text: string, width: number) =>
	wrapText(text, bubbleW(width) - 2 * BUBBLE_PAD, 12);
const bubbleH = (text: string, width: number) =>
	bubbleLines(text, width).length * 16 + 34;
const chatHeight = (width: number, locale: Locale) =>
	30 +
	MESSAGES.reduce(
		(sum, msg) => sum + bubbleH(pick(msg.text, locale), width) + 10,
		0,
	);

function ChatStage({
	width,
	state,
	locale,
}: {
	width: number;
	state: ChatState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const w = bubbleW(width);
	let y = 30;
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t(["Customize with AI · sidebar", "Customize with AI · 侧边栏"])}
			</Label>
			{MESSAGES.map((msg) => {
				const text = t(msg.text);
				const h = bubbleH(text, width);
				const top = y;
				y += h + 10;
				const x = msg.from === "you" ? width - 4 - w : 4;
				return (
					<m.g
						key={msg.id}
						initial={false}
						animate={{ opacity: state.stage >= msg.at ? 1 : 0 }}
						transition={motion.fade}
					>
						<rect
							x={x}
							y={top}
							width={w}
							height={h}
							rx={12}
							className={
								msg.from === "ai" ? "wt-focus-shape" : "wt-panel-shape"
							}
						/>
						<Label x={x + BUBBLE_PAD} y={top + 18} tone="small">
							{msg.from === "ai" ? "TradingFlow AI" : t(["You", "你"])}
						</Label>
						{bubbleLines(text, width).map((line, i) => (
							<Label
								key={`${i}-${line}`}
								x={x + BUBBLE_PAD}
								y={top + 36 + i * 16}
								tone="muted"
							>
								{line}
							</Label>
						))}
					</m.g>
				);
			})}
		</g>
	);
}

function ChatView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ChatState;
	explore: ChatState | null;
	setExplore: (next: ChatState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const replies = MESSAGES.filter(
		(msg) => msg.from === "ai" && shown.stage >= msg.at,
	).length;
	const result: ResultItem[] = [
		{
			id: "replies",
			label: t(["AI replies so far", "目前的 AI 回复"]),
			value: String(replies),
			note: replies
				? t([
						`${replies} credit${replies === 1 ? "" : "s"} at 1 per reply`,
						`每条回复 1 积分，共 ${replies} 积分`,
					])
				: t(["nothing sent yet", "还没有发送"]),
		},
	];
	if (shown.stage >= 2)
		result.push({
			id: "saved",
			label: t(["Saved", "已保存"]),
			value: t(["Nothing", "没有"]),
			note: t(["a recipe only if you confirm", "只有你确认才会构建 Recipe"]),
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The Customize with AI sidebar: your request, the AI's one clarifying question, your answer, and its proposed change",
						"Customize with AI 侧边栏：你的请求、AI 的一个澄清问题、你的回答，以及它提出的修改",
					])}
					height={(width) => chatHeight(width, locale)}
				>
					{(width) => <ChatStage width={width} state={shown} locale={locale} />}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Show", "显示"])}
						value={String(explore.stage) as "0" | "1" | "2"}
						options={[
							["0", t(["Your request", "你的请求"])],
							["1", t(["Its question", "它的提问"])],
							["2", t(["Its proposal", "它的建议"])],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as ChatState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Customize with AI opens TradingFlow AI in the left sidebar. It asks one clarifying question before it proposes anything, so answer it with the decision you're actually making. Its proposal is a draft for you to review against the same rule as any step: can a tool check it? Building a recipe from the checklist appears only when your account has that feature and you confirm. AI replies use credits, one per reply, and TradingFlow AI itself depends on your plan and rollout.",
						"Customize with AI 会在左侧边栏打开 TradingFlow AI。它在提出任何建议之前先问一个澄清问题，所以要用你真正要做的决定来回答。它的建议是草稿，要用和任何步骤相同的标准审阅：有工具能核查它吗？只有当你的账户有该功能且你确认后，才会出现根据清单构建 Recipe 的选项。AI 回复消耗积分，每条回复 1 积分；TradingFlow AI 本身是否可用取决于你的方案和灰度范围。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<ForecastState, ForecastState>({
		id: "inspect",
		label: ["Steps you can check", "可核查的步骤"],
		title: [
			"A checklist inspects; it doesn't forecast",
			"清单是核查，不是预测",
		],
		predict: {
			prompt: [
				"A friend's checklist for selling an ALFA call has three steps. Which one doesn't belong in a research checklist?",
				"朋友列的卖出 ALFA 看涨清单有三步。哪一步不应列入研究清单？",
			],
			choices: [
				{
					id: "forecast",
					label: ["Confirm ALFA stays below $105", "确认 ALFA 一直低于 $105"],
				},
				{
					id: "vol",
					label: [
						"Compare IV with realized volatility",
						"比较隐含波动率与已实现波动率",
					],
				},
				{
					id: "trade",
					label: [
						"Check the call's spread and open interest",
						"检查看涨期权的价差与未平仓量",
					],
				},
			],
			answer: "forecast",
			revealAt: 1,
			explain: [
				"Every other step inspects something a tool can show you today. Where ALFA will be on Oct 18 is a forecast: nothing can check it.",
				"其他步骤查看的都是今天有工具能显示的东西。ALFA 在10月18日的位置是预测：什么都核查不了。",
			],
		},
		beats: [
			{
				id: "friend",
				label: ["Three steps", "三步"],
				caption: [
					"A friend drafts three steps for selling an ALFA Oct 18 105 call.",
					"朋友为卖出 ALFA 10月18日 105 看涨拟了三个步骤。",
				],
				state: { stage: 0 },
			},
			{
				id: "flag",
				label: ["A forecast", "预测"],
				caption: [
					"\"Confirm ALFA stays below $105\" can't be checked by any tool: it's a forecast dressed as a step.",
					"“确认 ALFA 一直低于 $105”没有任何工具能核查：这是披着步骤外衣的预测。",
				],
				state: { stage: 1 },
			},
			{
				id: "template",
				label: ["Template", "模板"],
				caption: [
					"TradingFlow's Home template for the same question has four inspection steps, each opening the tool that shows the evidence.",
					"TradingFlow Home 针对同一问题的模板有四个查看步骤，每一步都打开能显示证据的工具。",
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: ["Compare the two checklists.", "比较这两份清单。"],
			start: () => ({ stage: 2 }),
			task: {
				kind: "answer",
				prompt: [
					"Which template step looks at the contract you'd sell rather than at ALFA?",
					"模板中哪一步看的是你要卖出的合约，而不是 ALFA？",
				],
				choices: [
					{
						id: "trade",
						label: [
							"The call's spread, liquidity and open interest",
							"该看涨的价差、流动性和未平仓量",
						],
					},
					{
						id: "vol",
						label: [
							"ALFA's IV against its realized volatility",
							"ALFA 的 IV 与已实现波动率对比",
						],
					},
					{
						id: "gex",
						label: ["GEX and open-interest structure", "GEX 与未平仓量结构"],
					},
				],
				answer: "trade",
				done: [
					"Spread, liquidity and open interest decide what selling that call would cost and whether it can be closed later. Every step opens a tool that shows today's evidence; none predicts ALFA.",
					"价差、流动性和未平仓量决定了卖出这份看涨的成本，以及之后能否平仓。每一步都打开一个显示今天证据的工具；没有一步在预测 ALFA。",
				],
			},
		},
		View: ForecastView,
	}),
	defineScene<EditState, EditState>({
		id: "edits",
		label: ["Edit, then keep", "编辑，然后保存"],
		title: ["Home's checklists reset on refresh", "Home 的清单刷新即重置"],
		predict: {
			prompt: [
				"You add an earnings step and move recent call flow up, then refresh the page. What does Home show?",
				"你新增了一个财报步骤，并把近期看涨成交流上移，然后刷新页面。Home 显示什么？",
			],
			choices: [
				{ id: "template", label: ["The original template", "原来的模板"] },
				{ id: "edited", label: ["Your edited checklist", "你编辑后的清单"] },
				{ id: "empty", label: ["An empty checklist", "空白清单"] },
			],
			answer: "template",
			revealAt: 2,
			explain: [
				"Home's checklists aren't saved: a refresh brings back the template. Copy the steps you settle on into your notes first.",
				"Home 的清单不会保存：刷新后会恢复模板。先把你确定的步骤抄进笔记。",
			],
		},
		beats: [
			{
				id: "template",
				label: ["Template", "模板"],
				caption: [
					'Start from Home\'s four steps for "Before I sell a call".',
					"从 Home 针对“卖出看涨前”的四个步骤开始。",
				],
				state: { stage: 0 },
			},
			{
				id: "edit",
				label: ["Edit", "编辑"],
				caption: [
					"Add a step for ALFA's Oct 3 earnings, before the Oct 18 expiry, and move recent call flow up.",
					"为 ALFA 10月3日 的财报（在10月18日到期之前）新增一步，并把近期看涨成交流上移。",
				],
				state: { stage: 1 },
			},
			{
				id: "refresh",
				label: ["Refresh", "刷新"],
				caption: [
					"Refresh the page and the template is back. Home's checklist is a working plan, not a saved record.",
					"刷新页面后模板又回来了。Home 的清单是临时工作计划，不是保存的记录。",
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: ["Step through the checklist's states.", "查看清单的各个状态。"],
			start: () => ({ stage: 1 }),
			task: {
				kind: "answer",
				prompt: [
					"What should you do before you refresh Home?",
					"刷新 Home 之前你应该做什么？",
				],
				choices: [
					{
						id: "copy",
						label: [
							"Copy the edited steps somewhere you keep",
							"把编辑后的步骤复制到你会保留的地方",
						],
					},
					{ id: "save", label: ["Press Save", "按保存"] },
					{
						id: "nothing",
						label: [
							"Nothing: Home keeps your edits",
							"什么都不用做：Home 会保留编辑",
						],
					},
				],
				answer: "copy",
				done: [
					"Home's checklists aren't saved anywhere: a refresh brings back the template. It's a working plan, so the steps you settle on belong in your own notes.",
					"Home 的清单不会保存在任何地方：一刷新就回到模板。它只是工作计划，你确定下来的步骤应该写进自己的笔记。",
				],
			},
		},
		View: EditView,
	}),
	defineScene<ChatState, ChatState>({
		id: "customize",
		label: ["Customize with AI", "用 AI 定制"],
		title: ["The AI asks before it proposes", "AI 先提问，再建议"],
		predict: {
			prompt: [
				"You ask Customize with AI to adapt the checklist for ALFA's Oct 3 earnings. What does it do first?",
				"你让 Customize with AI 把清单改成针对 ALFA 10月3日 财报的版本。它首先做什么？",
			],
			choices: [
				{
					id: "ask",
					label: ["Asks you one clarifying question", "问你一个澄清问题"],
				},
				{
					id: "rewrite",
					label: ["Rewrites the checklist at once", "立即改写清单"],
				},
				{
					id: "recipe",
					label: ["Builds and saves a recipe", "构建并保存一个 Recipe"],
				},
			],
			answer: "ask",
			revealAt: 1,
			explain: [
				"It asks one clarifying question, then proposes a change. Nothing is saved, and a recipe is built only if your account has the feature and you confirm.",
				"它先问一个澄清问题，再提出修改。不会保存任何内容；只有你的账户有该功能并且你确认后，才会构建 Recipe。",
			],
		},
		beats: [
			{
				id: "request",
				label: ["Request", "请求"],
				caption: [
					"You open Customize with AI and ask it to adapt the checklist for ALFA's earnings.",
					"你打开 Customize with AI，请它把清单改成针对 ALFA 财报的版本。",
				],
				state: { stage: 0 },
			},
			{
				id: "clarify",
				label: ["Its question", "它的提问"],
				caption: [
					"It asks one clarifying question first: which part of the decision the checklist should serve.",
					"它先问一个澄清问题：清单应该服务于这个决定的哪一部分。",
				],
				state: { stage: 1 },
			},
			{
				id: "proposal",
				label: ["Its proposal", "它的建议"],
				caption: [
					"After your answer it proposes one step. Review it like any step, and note the two replies cost 2 credits; nothing was saved.",
					"你回答后，它提出了一个步骤。像审阅任何步骤一样审阅它；注意两条回复花了 2 积分，而且什么都没保存。",
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: ["Step through the conversation.", "逐步查看这段对话。"],
			start: () => ({ stage: 2 }),
			task: {
				kind: "answer",
				prompt: [
					"What did the conversation cost, and what was saved?",
					"这段对话花了多少，保存了什么？",
				],
				choices: [
					{
						id: "two",
						label: ["2 credits; nothing saved", "2 积分；什么都没保存"],
					},
					{
						id: "one",
						label: ["1 credit; the checklist saved", "1 积分；清单已保存"],
					},
					{
						id: "free",
						label: ["Nothing; a recipe was built", "不花钱；生成了一个 Recipe"],
					},
				],
				answer: "two",
				done: [
					"Two AI replies at 1 credit each, and nothing changed until you accept the proposal. A recipe is built only if your account has the feature and you confirm.",
					"两条 AI 回复各 1 积分，在你接受建议之前什么都没改变。只有你的账户有该功能并且你确认，才会生成 Recipe。",
				],
			},
		},
		View: ChatView,
	}),
] as const;

export function ResearchChecklistWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Player
			locale={locale}
			id="research-checklist"
			label={["Interactive lesson on research checklists", "研究清单互动课"]}
			film={researchChecklistFilm}
			scenes={scenes}
		/>
	);
}
