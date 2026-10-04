import * as m from "motion/react-m";
import { type Copy, pick } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import { Player } from "../walkthrough/player";
import { Label, Stage, useTeachMotion } from "../walkthrough/stage";
import { textWidth, twoRows, wrapText } from "../walkthrough/text-measure";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame } from "../walkthrough/walkthrough";
import { editWithAiFilm } from "./edit-with-ai-film";
import {
	BLOCKS,
	type BlockId,
	FIRST_EDIT,
	FOCUS,
	PROMPT_IDS,
	PROMPTS,
	type PromptId,
	SECOND_EDIT,
	STATUS,
	type Status,
} from "./edit-with-ai-model";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

/** One row per block; on a phone the status drops under the title. */
const outlineRow = (width: number) =>
	width < 520 ? { h: 42, step: 48 } : { h: 30, step: 36 };
const outlineHeight = (width: number) =>
	BLOCKS.length * outlineRow(width).step - 6;

function Outline({
	y,
	width,
	statuses,
	locale,
}: {
	y: number;
	width: number;
	statuses: Record<BlockId, Status>;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const narrow = width < 520;
	const row = outlineRow(width);
	return (
		<g>
			{BLOCKS.map((block, i) => {
				const status = statuses[block.id];
				const top = y + i * row.step;
				const removed = status === "removed";
				return (
					<m.g
						key={block.id}
						initial={false}
						animate={{ opacity: removed ? 0.6 : 1 }}
						transition={motion.fade}
					>
						<rect
							x={4}
							y={top}
							width={width - 8}
							height={row.h}
							rx={8}
							className={
								FOCUS.has(status) ? "wt-focus-shape" : "wt-panel-shape"
							}
							strokeDasharray={removed ? "5 4" : undefined}
						/>
						<Label
							x={16}
							y={top + (narrow ? 17 : 20)}
							className={removed ? "wt-loss" : undefined}
						>
							{t(block.label)}
						</Label>
						<m.text
							key={`${block.id}-${status}`}
							x={narrow ? 16 : width - 16}
							y={top + (narrow ? 34 : 20)}
							textAnchor={narrow ? "start" : "end"}
							className={
								removed
									? "wt-small wt-loss"
									: FOCUS.has(status)
										? "wt-small wt-accent"
										: "wt-small"
							}
							initial={motion.enabled ? { opacity: 0 } : false}
							animate={{ opacity: 1 }}
							transition={motion.fade}
						>
							{t(STATUS[status])}
						</m.text>
					</m.g>
				);
			})}
		</g>
	);
}

const allBlocks = (status: Status) =>
	Object.fromEntries(BLOCKS.map((block) => [block.id, status])) as Record<
		BlockId,
		Status
	>;

/** A quoted prompt in a card: the label, then the text wrapped to the card. */
function PromptCard({
	y,
	width,
	label,
	lines,
	slots,
}: {
	y: number;
	width: number;
	label: string;
	lines: readonly string[];
	/** Lines to reserve, so the card keeps one height across prompts. */
	slots: number;
}) {
	const motion = useTeachMotion();
	return (
		<g>
			<rect
				x={4}
				y={y}
				width={width - 8}
				height={promptCardHeight(slots)}
				rx={10}
				className="wt-panel-shape"
			/>
			<Label x={16} y={y + 20} tone="muted">
				{label}
			</Label>
			<m.g
				key={lines.join(" ")}
				initial={motion.enabled ? { opacity: 0 } : false}
				animate={{ opacity: 1 }}
				transition={motion.fade}
			>
				{lines.map((line, i) => (
					<Label key={line} x={16} y={y + 40 + i * 17}>
						{line}
					</Label>
				))}
			</m.g>
		</g>
	);
}
const promptCardHeight = (slots: number) => 32 + slots * 17;
const promptLines = (text: string, width: number) =>
	wrapText(text, width - 32, 13);

// ——— Scene 1: a prompt sets what you must review ———

type ScopeState = { prompt: PromptId; reveal: boolean };

function scopeStatuses(state: ScopeState): Record<BlockId, Status> {
	if (!state.reveal) return allBlocks("unknown");
	if (state.prompt !== "bounded") return allBlocks("recheck");
	return { ...allBlocks("confirm"), spotlight: "review" };
}

const scopeSlots = (width: number, locale: Locale) =>
	Math.max(
		...PROMPT_IDS.map(
			(id) => promptLines(pick(PROMPTS[id], locale), width).length,
		),
	);
const scopeHeight = (width: number, locale: Locale) =>
	promptCardHeight(scopeSlots(width, locale)) + 14 + outlineHeight(width) + 4;

function ScopeView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ScopeState;
	explore: ScopeState | null;
	setExplore: (next: ScopeState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const statuses = scopeStatuses(shown);
	const review = BLOCKS.filter((block) => FOCUS.has(statuses[block.id])).length;
	const result: ResultItem[] = [
		{
			id: "review",
			label: t(["Blocks to re-check", "需要重新检查的区块"]),
			value: shown.reveal ? `${review} / ${BLOCKS.length}` : "?",
			note: !shown.reveal
				? t(["after the edit", "修改之后"])
				: shown.prompt === "bounded"
					? t(["the rest only needs confirming", "其余只需确认没有改动"])
					: t(["any block may differ", "任何区块都可能不同"]),
			tone: shown.reveal && review === BLOCKS.length ? "loss" : undefined,
		},
		{
			id: "boundary",
			label: t(["Boundary", "范围"]),
			value: !shown.reveal
				? "?"
				: shown.prompt === "bounded"
					? t(["Spotlight only", "只有 Spotlight"])
					: t(["None stated", "没有说明"]),
			note: !shown.reveal
				? t(["what may change", "允许修改的部分"])
				: shown.prompt === "subjective"
					? t(["and no finished state to check", "也没有可核对的完成标准"])
					: shown.prompt === "bounded"
						? t(["input: symbol, ALFA by default", "输入：标的，默认 ALFA"])
						: t(["the assistant decides", "由助手决定"]),
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A prompt to edit a forked Daily Market Recap above the recap's five blocks: a prompt without a boundary leaves every block to re-check, while one that names the change leaves only Spotlight to review",
						"修改分叉后 Daily Market Recap 的提示，下方是报告的五个区块：没有范围的提示让每个区块都要重新检查，而说明了修改内容的提示只需审阅 Spotlight",
					])}
					height={(width) => scopeHeight(width, locale)}
				>
					{(width) => (
						<g>
							<PromptCard
								y={4}
								width={width}
								label={t(["Your prompt", "你的提示"])}
								lines={promptLines(t(PROMPTS[shown.prompt]), width)}
								slots={scopeSlots(width, locale)}
							/>
							<Outline
								y={promptCardHeight(scopeSlots(width, locale)) + 18}
								width={width}
								statuses={statuses}
								locale={locale}
							/>
						</g>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Prompt", "提示"])}
						value={explore.prompt}
						options={[
							["vague", t(["An ALFA report", "ALFA 报告"])],
							["bounded", t(["Only Spotlight", "只改 Spotlight"])],
							["subjective", t(["Smarter", "更聪明"])],
						]}
						onChange={(prompt) => setExplore({ ...explore, prompt })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						'Edit with AI forks an official recipe into a private working draft, and New recipe starts a blank one that the assistant drafts from your description; the official template is never edited in place. The most reliable prompt names the research question, the part of the recipe that may change, the input the reader controls, the evidence to show and what must stay untouched. You don\'t need SQL or the recipe\'s internal format. "Make this an ALFA report" leaves the assistant to decide what to replace; "keep every existing chapter and change only Spotlight" defines a boundary you can review, and a subjective request like "make it smarter" gives no finished state to check against. Authoring needs a paid plan, the authoring rollout on your account and TradingFlow AI consent and credits.',
						"Edit with AI 会把官方 Recipe 分叉成一份私有工作草稿；New recipe 则从空白开始，由助手根据你的描述起草。官方模板从不被原地修改。最可靠的提示会写明研究问题、Recipe 中允许修改的部分、读者控制的输入、要展示的证据，以及必须保持不变的内容。你不需要写 SQL，也不需要了解 Recipe 的内部格式。“把它改成一份 ALFA 报告”让助手自己决定替换什么；“保留所有现有章节，只修改 Spotlight”则划定了一个你能审阅的范围；而“让它更聪明一点”这样的主观要求，根本没有可核对的完成标准。编写 Recipe 需要付费方案、你的账户开通了编写功能的灰度，以及 TradingFlow AI 授权和积分。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: review each edit, undo before the next ———

type ReviewStep = 0 | 1 | 2 | 3;
type ReviewState = { step: ReviewStep };

const STEPS: readonly Copy[] = [
	["Fork", "分叉"],
	["Edit", "修改"],
	["Undo", "撤销"],
	["Edit again", "再次修改"],
];

function reviewStatuses(step: ReviewStep): Record<BlockId, Status> {
	if (step === 1)
		return { ...allBlocks("same"), spotlight: "changed", gex: "removed" };
	if (step === 3) return { ...allBlocks("same"), spotlight: "changed" };
	return allBlocks("same");
}
function reviewPrompt(step: ReviewStep): Copy {
	if (step === 1) return FIRST_EDIT;
	if (step === 3) return SECOND_EDIT;
	if (step === 2) return ["Undo", "撤销"];
	return ["—", "—"];
}
function reviewMessage(step: ReviewStep): { text: Copy; loss?: Copy } {
	if (step === 1)
		return {
			text: [
				"AI edit applied to the preview",
				"AI edit applied to the preview",
			],
			loss: ["Index GEX is gone", "Index GEX 不见了"],
		};
	if (step === 2)
		return {
			text: ["Back to the version you reviewed", "回到你审阅过的版本"],
		};
	if (step === 3)
		return {
			text: [
				"AI edit applied to the preview",
				"AI edit applied to the preview",
			],
		};
	return {
		text: [
			"Private working draft, forked from the official recipe",
			"私有工作草稿，从官方 Recipe 分叉而来",
		],
	};
}

const PILL_Y = 4;
const MESSAGE_Y = 52;
const reviewSlots = (width: number, locale: Locale) =>
	Math.max(
		promptLines(pick(FIRST_EDIT, locale), width).length,
		promptLines(pick(SECOND_EDIT, locale), width).length,
	);
const reviewTop = (width: number, locale: Locale) =>
	MESSAGE_Y + 36 + promptCardHeight(reviewSlots(width, locale)) + 14;
const reviewHeight = (width: number, locale: Locale) =>
	reviewTop(width, locale) + outlineHeight(width) + 4;

function ReviewStage({
	width,
	state,
	locale,
}: {
	width: number;
	state: ReviewState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const message = reviewMessage(state.step);
	let pillX = 4;
	const pills = STEPS.map((step, i) => {
		const label = t(step);
		const w = textWidth(label, 12) + 20;
		const pill = { i, label, x: pillX, w };
		pillX += w + 6;
		return pill;
	});
	return (
		<g>
			{pills.map((pill) => {
				const on = pill.i === state.step;
				return (
					<g key={pill.label}>
						<rect
							x={pill.x}
							y={PILL_Y}
							width={pill.w}
							height={26}
							rx={13}
							className={on ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						<Label
							x={pill.x + pill.w / 2}
							y={PILL_Y + 17}
							anchor="middle"
							tone="muted"
							className={on ? "wt-accent" : undefined}
						>
							{pill.label}
						</Label>
					</g>
				);
			})}
			<m.g
				key={`message-${state.step}`}
				initial={motion.enabled ? { opacity: 0 } : false}
				animate={{ opacity: 1 }}
				transition={motion.fade}
			>
				{/* A message on its own may take the loss line's row on a phone. */}
				{(message.loss
					? [t(message.text)]
					: twoRows(t(message.text), width - 16, 11)
				).map((line, i) => (
					<Label
						key={line}
						x={8}
						y={MESSAGE_Y + i * 17}
						tone="small"
						maxWidth={width - 16}
					>
						{line}
					</Label>
				))}
				{message.loss ? (
					<Label x={8} y={MESSAGE_Y + 17} tone="small" className="wt-loss">
						{t(message.loss)}
					</Label>
				) : null}
			</m.g>
			<PromptCard
				y={MESSAGE_Y + 36}
				width={width}
				label={t(["Prompt", "提示"])}
				lines={promptLines(t(reviewPrompt(state.step)), width)}
				slots={reviewSlots(width, locale)}
			/>
			<Outline
				y={reviewTop(width, locale)}
				width={width}
				statuses={reviewStatuses(state.step)}
				locale={locale}
			/>
		</g>
	);
}

function ReviewView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ReviewState;
	explore: ReviewState | null;
	setExplore: (next: ReviewState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const statuses = reviewStatuses(shown.step);
	const changed = BLOCKS.filter((block) => statuses[block.id] === "changed");
	const removed = BLOCKS.filter((block) => statuses[block.id] === "removed");
	const result: ResultItem[] = [
		{
			id: "changed",
			label: t(["Changed", "已修改"]),
			value: changed.length
				? changed.map((block) => t(block.label)).join(", ")
				: t(["Nothing", "无"]),
			note:
				shown.step === 0
					? t([
							"the fork matches the official recipe",
							"分叉与官方 Recipe 一致",
						])
					: t(["compared with the previous version", "与上一个版本相比"]),
		},
		{
			id: "removed",
			label: t(["Removed", "已删除"]),
			value: removed.length
				? removed.map((block) => t(block.label)).join(", ")
				: t(["Nothing", "无"]),
			note: removed.length
				? t(["you didn't ask for this", "这不是你要求的"])
				: t(["every block is still there", "所有区块都还在"]),
			tone: removed.length ? "loss" : undefined,
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Four versions of a private recipe draft: the fork, a first AI edit that changes Spotlight but removes Index GEX, an undo back to the fork, and a second edit that keeps everything else unchanged",
						"私有 Recipe 草稿的四个版本：分叉、修改了 Spotlight 却删除了 Index GEX 的第一次 AI 修改、撤销回到分叉版本，以及保持其他一切不变的第二次修改",
					])}
					height={(width) => reviewHeight(width, locale)}
				>
					{(width) => (
						<ReviewStage width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Version", "版本"])}
						value={String(explore.step) as "0" | "1" | "2" | "3"}
						options={STEPS.map(
							(step, i) =>
								[String(i) as "0" | "1" | "2" | "3", t(step)] as const,
						)}
						onChange={(value) =>
							setExplore({ step: Number(value) as ReviewStep })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						'After each AI edit the workspace updates the unsaved preview. Before the next prompt, check that the title and description still describe the report, that every reader input has a clear label and default, that the requested block landed in the right place, and that the rest matches the previous version; if TradingFlow says blocks were removed, make sure each removal was intended. If an edit changed more than you asked, select Undo before making another AI edit, then repeat the request with "keep everything else unchanged" and name the exact section that may change. Short, observable requests, such as "sort the table by premium descending and show ten rows", are easier to verify than one large rewrite. Changing an input\'s value in the preview only sets a draft value for that run; changing its label, default or meaning is a recipe change.',
						"每次 AI 修改后，工作区都会更新未保存的预览。发下一条提示之前，先检查标题和说明是否仍然符合报告，每个读者输入是否有清楚的标签和默认值，要求的区块是否出现在正确位置，其余部分是否与上一个版本一致；如果 TradingFlow 提示有区块被删除，要确认每一处删除都是有意的。如果一次修改超出了你的要求，先选 Undo（撤销），再进行下一次 AI 修改，然后重发请求，写明“其他一切保持不变”，并点名允许修改的具体部分。简短、可观察的请求，比如“按权利金降序排列表格并显示十行”，比一次大改更容易核对。在预览中修改输入的值，只是为这次运行设定一个草稿值；修改它的标签、默认值或含义，才是对 Recipe 的修改。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: a preview isn't a save ———

type SaveAction = "preview" | "closed" | "saved";
type SaveState = { action: SaveAction };

const CARD_GAP = 12;
const HEADER_H = 82;
const MINE_H = 76;
const OFFICIAL_H = 52;
const SAVE_H = HEADER_H + CARD_GAP + MINE_H + CARD_GAP + OFFICIAL_H + 8;

function SaveStage({
	width,
	state,
	locale,
}: {
	width: number;
	state: SaveState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const closed = state.action === "closed";
	const saved = state.action === "saved";
	const mineY = HEADER_H + CARD_GAP;
	const officialY = mineY + MINE_H + CARD_GAP;
	const status = saved
		? t(["Saved", "Saved（已保存）"])
		: closed
			? t(["Tab closed: changes not kept", "标签页已关闭：修改没有保留"])
			: t(["Unsaved changes", "有未保存的修改"]);
	return (
		<g>
			<m.g
				initial={false}
				animate={{ opacity: closed ? 0.45 : 1 }}
				transition={motion.fade}
			>
				<rect
					x={4}
					y={4}
					width={width - 8}
					height={HEADER_H - 4}
					rx={10}
					className={saved ? "wt-focus-shape" : "wt-panel-shape"}
				/>
				<Label x={16} y={26} tone="muted">
					{t(["Your draft · private", "你的草稿 · 私有"])}
				</Label>
				<Label x={16} y={46}>
					Daily Market Recap · ALFA
				</Label>
			</m.g>
			<m.text
				key={`status-${state.action}`}
				x={16}
				y={66}
				className={
					saved
						? "wt-small wt-accent"
						: closed
							? "wt-small wt-loss"
							: "wt-small"
				}
				initial={motion.enabled ? { opacity: 0 } : false}
				animate={{ opacity: 1 }}
				transition={motion.fade}
			>
				{status}
			</m.text>
			<rect
				x={4}
				y={mineY}
				width={width - 8}
				height={MINE_H}
				rx={10}
				className="wt-panel-shape"
			/>
			<Label x={16} y={mineY + 22} tone="muted">
				{t(["My recipes", "My recipes（我的 Recipe）"])}
			</Label>
			<m.g
				key={`mine-${state.action}`}
				initial={motion.enabled ? { opacity: 0 } : false}
				animate={{ opacity: 1 }}
				transition={motion.fade}
			>
				{saved ? (
					<>
						<Label x={16} y={mineY + 44}>
							Daily Market Recap · ALFA
						</Label>
						<Label x={16} y={mineY + 62} tone="small" className="wt-accent">
							{t(["Private · only you can open it", "私有 · 只有你能打开"])}
						</Label>
					</>
				) : (
					<Label x={16} y={mineY + 46} tone="small">
						{closed ? t(["No recipes yet", "还没有 Recipe"]) : "—"}
					</Label>
				)}
			</m.g>
			<rect
				x={4}
				y={officialY}
				width={width - 8}
				height={OFFICIAL_H}
				rx={10}
				className="wt-panel-shape"
			/>
			<Label x={16} y={officialY + 22}>
				Daily Market Recap
			</Label>
			<Label x={16} y={officialY + 40} tone="small">
				{t(["Official · unchanged", "官方 · 未改动"])}
			</Label>
		</g>
	);
}

function SaveView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SaveState;
	explore: SaveState | null;
	setExplore: (next: SaveState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] = [
		{
			id: "draft",
			label: t(["Your edits", "你的修改"]),
			value:
				shown.action === "saved"
					? t(["Saved", "已保存"])
					: shown.action === "closed"
						? t(["Not kept", "没有保留"])
						: t(["Unsaved", "未保存"]),
			note:
				shown.action === "saved"
					? t(["validated before saving", "保存前经过校验"])
					: shown.action === "closed"
						? t(["a preview isn't a save", "预览不等于保存"])
						: t(["the preview looks right", "预览看起来没问题"]),
			tone: shown.action === "closed" ? "loss" : undefined,
		},
		{
			id: "official",
			label: t(["Official recipe", "官方 Recipe"]),
			value: t(["Unchanged", "未改动"]),
			note: t(["forks never edit it", "分叉从不修改它"]),
		},
	];
	if (shown.action !== "preview")
		result.push({
			id: "mine",
			label: t(["My recipes", "我的 Recipe"]),
			value:
				shown.action === "saved"
					? t(["1 private recipe", "1 个私有 Recipe"])
					: t(["Nothing new", "没有新内容"]),
			note:
				shown.action === "saved"
					? t(["no share link or public state", "没有分享链接或公开状态"])
					: undefined,
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A private recipe draft, the My recipes list and the official Daily Market Recap: closing the tab before saving keeps nothing, while Save puts the recipe under My recipes, visible only to you",
						"私有 Recipe 草稿、My recipes 列表和官方 Daily Market Recap：保存前关闭标签页什么都不会保留，而 Save 会把 Recipe 放进 My recipes，只有你能看到",
					])}
					height={SAVE_H}
				>
					{(width) => <SaveStage width={width} state={shown} locale={locale} />}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Then", "接着"])}
						value={explore.action === "closed" ? "closed" : "saved"}
						options={[
							["closed", t(["Close the tab", "关闭标签页"])],
							["saved", t(["Save", "保存"])],
						]}
						onChange={(action) => setExplore({ action })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A successful preview is not a save: don't leave the workspace until the header shows Saved. Save keeps the current working recipe, creating it the first time; Save as… keeps a separate private copy with its own address, so the earlier version stays as a branch. Before saving, TradingFlow validates the recipe and does a read-only dry run when the change affects parameters, data queries or anchors, and if another tab saved a newer revision first, reload it or use Save as…. Your recipes are owner-only: there is no public, organization or share-link state. Finally, open the recipe from My recipes, choose a session and its inputs, and run it as a reader would; that catches a recipe that looked right in the preview but doesn't answer the question with real inputs.",
						"预览成功不等于已保存：在页眉显示 Saved 之前，不要离开工作区。Save 保存当前的工作 Recipe，第一次保存时会创建它；Save as… 另存一份有自己地址的私有副本，让之前的版本作为分支保留下来。保存之前，TradingFlow 会校验 Recipe；如果修改涉及参数、数据查询或锚点，还会做一次只读的试运行。如果另一个标签页先保存了更新的版本，就重新加载它，或者用 Save as…。你的 Recipe 只属于你：没有公开、组织或分享链接状态。最后，从 My recipes 打开它，选择交易时段和输入，像读者一样运行一次；这样能发现那些在预览里看起来没问题、用真实输入却回答不了问题的 Recipe。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<ScopeState, ScopeState>({
		id: "scope",
		label: ["Scope", "范围"],
		title: ["A prompt sets what you must review", "提示决定了你要审阅什么"],
		predict: {
			prompt: [
				'You fork Daily Market Recap with Edit with AI and type "Make this an ALFA report." After the edit, which blocks must you re-check?',
				"你用 Edit with AI 分叉 Daily Market Recap，输入“把它改成一份 ALFA 报告。”修改之后，哪些区块必须重新检查？",
			],
			choices: [
				{
					id: "all",
					label: [
						"Every block: the prompt set no boundary",
						"所有区块：这个提示没有划定范围",
					],
				},
				{
					id: "spotlight",
					label: [
						"Only Spotlight, where a symbol appears",
						"只有 Spotlight，那里才出现标的",
					],
				},
				{
					id: "none",
					label: [
						"None: the edit confirmation covers it",
						"都不用：修改确认已经说明了",
					],
				},
			],
			answer: "all",
			revealAt: 1,
			explain: [
				'Without a boundary the assistant decides what to replace, so any block may differ, and a confirmation that an edit was applied isn\'t a review. "Keep every chapter and change only Spotlight" defines a change you can check.',
				"没有范围，助手会自己决定替换什么，所以任何区块都可能不同；“修改已应用”的确认也不等于审阅。“保留所有章节，只改 Spotlight”才定义了一个你能核对的修改。",
			],
		},
		beats: [
			{
				id: "typed",
				label: ["Ask", "提问"],
				caption: [
					"You fork Daily Market Recap into a private draft and ask for an ALFA report.",
					"你把 Daily Market Recap 分叉成私有草稿，并要求一份 ALFA 报告。",
				],
				state: { prompt: "vague", reveal: false },
			},
			{
				id: "vague",
				label: ["No boundary", "没有范围"],
				caption: [
					"The prompt set no boundary, so any block may have changed and every one needs a fresh check.",
					"这个提示没有划定范围，所以任何区块都可能被改动，每一个都需要重新检查。",
				],
				state: { prompt: "vague", reveal: true },
			},
			{
				id: "bounded",
				label: ["Bounded", "划定范围"],
				caption: [
					"Name what may change and what must stay: only Spotlight needs reviewing, and the other blocks only need confirming they're unchanged.",
					"写明允许修改什么、必须保留什么：只有 Spotlight 需要审阅，其他区块只需确认没有改动。",
				],
				state: { prompt: "bounded", reveal: true },
			},
		],
		explore: {
			prompt: ["Try a prompt.", "试一个提示。"],
			start: () => ({ prompt: "subjective", reveal: true }),
			task: {
				kind: "reach",
				prompt: [
					"Pick the prompt that leaves only one block for you to review.",
					"选出只留下一个板块需要你审阅的提示。",
				],
				reached: (e) => e.prompt === "bounded",
				done: [
					"Naming what may change and what must stay leaves one block to review and four to confirm unchanged. A vague or subjective prompt makes every block suspect.",
					"说明哪些可以改、哪些必须保留，就只剩一个板块需要审阅，另外四个只需确认未改动。含糊或主观的提示会让每个板块都可疑。",
				],
			},
		},
		View: ScopeView,
	}),
	defineScene<ReviewState, ReviewState>({
		id: "review",
		label: ["Review", "审阅"],
		title: [
			"Undo an edit before you build on it",
			"在修改之上继续之前，先撤销它",
		],
		predict: {
			prompt: [
				"Your first edit changes Spotlight as asked, but the preview shows a block you didn't mention is gone. What do you do first?",
				"第一次修改按要求改了 Spotlight，但预览显示一个你没提到的区块不见了。你首先做什么？",
			],
			choices: [
				{
					id: "undo",
					label: [
						"Undo, then repeat the request with what must stay",
						"撤销，然后重发请求并写明哪些要保留",
					],
				},
				{
					id: "repair",
					label: [
						"Ask the assistant to put the block back",
						"让助手把这个区块加回来",
					],
				},
				{
					id: "save",
					label: ["Save now and fix it later", "先保存，之后再修"],
				},
			],
			answer: "undo",
			revealAt: 2,
			explain: [
				"Undo returns the draft to the version you already reviewed. A repair request stacks a second edit on one you haven't checked, and saving keeps the loss.",
				"撤销会让草稿回到你已经审阅过的版本。要求修复是在一个你还没核查的修改上再叠一次修改，而保存会把损失保留下来。",
			],
		},
		beats: [
			{
				id: "fork",
				label: ["Fork", "分叉"],
				caption: [
					"Edit with AI forks the official recipe into a private working draft. The official version never changes.",
					"Edit with AI 把官方 Recipe 分叉成一份私有工作草稿。官方版本从不改变。",
				],
				state: { step: 0 },
			},
			{
				id: "edit",
				label: ["Edit", "修改"],
				caption: [
					"The first edit changes Spotlight as asked, and the preview shows Index GEX is gone. You never asked for that.",
					"第一次修改按要求改了 Spotlight，预览却显示 Index GEX 不见了。你从没要求过这一点。",
				],
				state: { step: 1 },
			},
			{
				id: "undo",
				label: ["Undo", "撤销"],
				caption: [
					"Undo first: the draft returns to the version you reviewed before a second edit is stacked on top.",
					"先撤销：在第二次修改叠上去之前，草稿回到你审阅过的版本。",
				],
				state: { step: 2 },
			},
			{
				id: "again",
				label: ["Again", "再改"],
				caption: [
					'Repeat the request with "keep everything else unchanged" and the one section that may change. Now only Spotlight differs.',
					"重发请求，写明“其他一切保持不变”和唯一允许修改的部分。现在只有 Spotlight 不同。",
				],
				state: { step: 3 },
			},
		],
		explore: {
			prompt: ["Step through the versions.", "逐个查看版本。"],
			start: () => ({ step: 1 }),
			task: {
				kind: "answer",
				prompt: [
					"At which version is a block missing that you never asked to remove?",
					"在哪个版本中，少了一个你从未要求删除的板块？",
				],
				choices: [
					{ id: "edit", label: ["Edit", "编辑"] },
					{ id: "undo", label: ["Undo", "撤销"] },
					{ id: "again", label: ["Edit again", "再次编辑"] },
				],
				answer: "edit",
				done: [
					"The first edit changed Spotlight as asked and dropped Index GEX. Undo returns to the reviewed draft; the repeated request names what must stay, so only Spotlight differs.",
					"第一次编辑按要求改了 Spotlight，却删掉了 Index GEX。撤销回到审阅过的草稿；重新提出的请求写明了必须保留的内容，于是只有 Spotlight 不同。",
				],
			},
		},
		View: ReviewView,
	}),
	defineScene<SaveState, SaveState>({
		id: "save",
		label: ["Save", "保存"],
		title: ["A preview isn't a save", "预览不等于保存"],
		predict: {
			prompt: [
				"The preview looks right, and you close the tab without pressing Save. What's in My recipes?",
				"预览看起来没问题，你没点 Save 就关掉了标签页。My recipes 里有什么？",
			],
			choices: [
				{
					id: "nothing",
					label: [
						"Nothing new: a preview isn't a save",
						"没有新内容：预览不等于保存",
					],
				},
				{
					id: "draft",
					label: [
						"Your edited recipe, saved automatically",
						"你修改后的 Recipe，已自动保存",
					],
				},
				{
					id: "official",
					label: ["The official recipe, now edited", "官方 Recipe，已被修改"],
				},
			],
			answer: "nothing",
			revealAt: 1,
			explain: [
				"Edits live in the unsaved preview until you save, and the header shows Saved once they're kept. The official recipe never changes either way.",
				"修改在保存之前只存在于未保存的预览里，保存后页眉会显示 Saved。无论哪种情况，官方 Recipe 都不会改变。",
			],
		},
		beats: [
			{
				id: "preview",
				label: ["Preview", "预览"],
				caption: [
					"The draft's preview looks right, and the header still says the changes are unsaved.",
					"草稿的预览看起来没问题，页眉仍然显示修改未保存。",
				],
				state: { action: "preview" },
			},
			{
				id: "closed",
				label: ["Close", "关闭"],
				caption: [
					"Close the tab now and the edits are gone: My recipes has nothing new, and the official recipe never changed.",
					"现在关掉标签页，修改就没了：My recipes 里没有新内容，官方 Recipe 也从未改变。",
				],
				state: { action: "closed" },
			},
			{
				id: "saved",
				label: ["Save", "保存"],
				caption: [
					"Save instead: TradingFlow validates the recipe, the header shows Saved, and it appears under My recipes, visible only to you. Run it there with a real input.",
					"改为保存：TradingFlow 校验 Recipe，页眉显示 Saved，它出现在 My recipes 中，只有你能看到。在那里用真实输入运行一次。",
				],
				state: { action: "saved" },
			},
		],
		explore: {
			prompt: ["Choose what happens next.", "选择接下来做什么。"],
			start: () => ({ action: "saved" }),
			task: {
				kind: "answer",
				prompt: [
					"After you save, who can open the recipe?",
					"保存之后，谁能打开这个 Recipe？",
				],
				choices: [
					{ id: "you", label: ["Only you", "只有你"] },
					{ id: "everyone", label: ["Every paid account", "所有付费账户"] },
					{
						id: "link",
						label: ["Anyone you share a link with", "任何拿到你分享链接的人"],
					},
				],
				answer: "you",
				done: [
					"Saved recipes appear under My recipes, visible only to you, with no share link or public state. The official recipe stays as it was for everyone else.",
					"保存的 Recipe 出现在“我的 Recipe”下，只有你能看到，没有分享链接，也不公开。官方 Recipe 对其他人保持原样。",
				],
			},
		},
		View: SaveView,
	}),
] as const;

export function EditWithAiWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Player
			locale={locale}
			id="edit-with-ai"
			label={[
				"Interactive lesson on editing recipes with AI",
				"用 AI 编辑 Recipe 互动课",
			]}
			film={editWithAiFilm}
			scenes={scenes}
		/>
	);
}
