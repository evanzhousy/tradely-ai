import * as m from "motion/react-m";
import {
	type Copy,
	dayLabel,
	officialRecipes,
	pick,
	type RecipeKind,
	recipeKinds,
	SESSION_DATE,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import { Player } from "../walkthrough/player";
import { Label, Stage, useStage, useTeachMotion } from "../walkthrough/stage";
import { wrapText } from "../walkthrough/text-measure";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame } from "../walkthrough/walkthrough";
import { tradingflowRecipesFilm } from "./tradingflow-recipes-film";
import {
	CLOSE,
	chapters,
	dayFraction,
	days,
	moments,
	type NowId,
	OPEN,
	sessionDays,
	shortDay,
} from "./tradingflow-recipes-model";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

// ——— Scene 1: choose by the question ———

type QuestionId = "uoa" | "snapshot" | "recap" | "gamma";
type CatalogState = { question: QuestionId | null };

const questions: Record<
	QuestionId,
	{ text: Copy; short: Copy; recipe: string }
> = {
	uoa: {
		text: [
			"Which contracts traded far above their open interest on Monday?",
			"周一哪些合约的成交远超其未平仓量？",
		],
		short: ["Far above OI", "远超未平仓"],
		recipe: "unusual-options-activity",
	},
	snapshot: {
		text: [
			"Everything about ALFA's options today, on one screen",
			"在一个页面看清 ALFA 今天期权的全部概况",
		],
		short: ["One symbol", "单个标的"],
		recipe: "ticker-snapshot",
	},
	recap: {
		text: [
			"What did Monday's whole session look like, step by step?",
			"周一整个时段是什么样子，逐步看？",
		],
		short: ["Whole session", "整个时段"],
		recipe: "market-recap",
	},
	gamma: {
		text: [
			"Where is ALFA's modeled gamma concentrated?",
			"ALFA 的模型 Gamma 集中在哪里？",
		],
		short: ["Gamma levels", "Gamma 位置"],
		recipe: "gamma-levels",
	},
};

const KINDS: readonly RecipeKind[] = ["lookup", "screen", "report"];
const CARD_H = 52;
const SECTION_GAP = 30;

function catalogTop(width: number, locale: Locale, state: CatalogState) {
	const text = state.question
		? pick(questions[state.question].text, locale)
		: pick(
				["Three kinds of official recipe", "官方 Recipe 的三种类型"],
				locale,
			);
	return wrapText(text, width - 16, 12);
}

const catalogHeight = 24 + 2 * 15 + KINDS.length * (CARD_H + SECTION_GAP);

function Catalog({
	width,
	state,
	locale,
}: {
	width: number;
	state: CatalogState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const titleLines = catalogTop(width, locale, state);
	const target = state.question ? questions[state.question].recipe : null;
	const cardW = (width - 8 - 10) / 2;
	const top = 24 + 2 * 15;
	return (
		<g>
			{titleLines.map((line, i) => (
				<Label
					key={line}
					x={8}
					y={16 + i * 15}
					tone="muted"
					className={state.question ? "wt-accent" : undefined}
				>
					{line}
				</Label>
			))}
			{KINDS.map((kind, k) => {
				const y = top + k * (CARD_H + SECTION_GAP);
				const recipes = officialRecipes.filter((item) => item.kind === kind);
				return (
					<g key={kind}>
						<Label x={8} y={y - 8} tone="small">
							{t(recipeKinds[kind])}
						</Label>
						{recipes.map((recipe, i) => {
							const x = 4 + i * (cardW + 10);
							const hit = recipe.id === target;
							const lines = wrapText(recipe.title, cardW - 20, 11).slice(0, 3);
							return (
								<m.g
									key={recipe.id}
									initial={false}
									animate={{ opacity: target && !hit ? 0.4 : 1 }}
									transition={motion.fade}
								>
									<rect
										x={x}
										y={y}
										width={cardW}
										height={CARD_H}
										rx={9}
										className={hit ? "wt-focus-shape" : "wt-panel-shape"}
									/>
									{lines.map((line, j) => (
										<Label
											key={line}
											x={x + 10}
											y={y + CARD_H / 2 + 4 + (j - (lines.length - 1) / 2) * 14}
											tone="small"
											className={hit ? "wt-accent" : undefined}
										>
											{line}
										</Label>
									))}
								</m.g>
							);
						})}
					</g>
				);
			})}
		</g>
	);
}

function CatalogView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: CatalogState;
	explore: CatalogState | null;
	setExplore: (next: CatalogState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const question = shown.question;
	const recipe = question
		? officialRecipes.find((item) => item.id === questions[question].recipe)
		: null;
	const result: ResultItem[] = recipe
		? [
				{
					id: "recipe",
					label: t(["Recipe for this question", "回答这个问题的 Recipe"]),
					value: recipe.title,
					note: t(recipe.question),
				},
				{
					id: "kind",
					label: t(["Kind", "类型"]),
					value: t(recipeKinds[recipe.kind]),
				},
			]
		: [
				{
					id: "kinds",
					label: t(["Official recipes", "官方 Recipe"]),
					value: t(["3 kinds", "3 种类型"]),
					note: t(["lookups, screens, reports", "查询、筛选、报告"]),
				},
			];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"TradingFlow's official recipes grouped as quick lookups, session screens and multi-step reports, with the recipe that answers the chosen question highlighted",
						"TradingFlow 官方 Recipe 按快速查询、时段筛选和多步骤报告分组，并高亮回答所选问题的 Recipe",
					])}
					height={catalogHeight}
				>
					{(width) => <Catalog width={width} state={shown} locale={locale} />}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Your question", "你的问题"])}
						value={explore.question ?? "uoa"}
						options={(Object.keys(questions) as QuestionId[]).map(
							(id) => [id, t(questions[id].short)] as const,
						)}
						onChange={(question) => setExplore({ question })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A recipe, which TradingFlow also calls a cookbook, is a report built from explanations, key figures, tables and charts, each bound to queries against TradingFlow's flow and chain data. It is the research packet from the research lessons, saved so it can run again. Quick lookups answer one focused question about one symbol, session screens filter the whole market for one session, and multi-step reports walk a session chapter by chapter. Start from the question you need answered, then pick the recipe whose card states that question.",
						"Recipe（TradingFlow 也称其为 Cookbook）是一份由说明、关键数字、表格和图表组成的报告，每一部分都绑定到对 TradingFlow 成交流与期权链数据的查询。它就是研究课里的研究资料包，被保存下来以便再次运行。快速查询回答关于单个标的的一个具体问题，时段筛选在一个时段内筛选整个市场，多步骤报告则按章节逐步讲解一个时段。先明确你要回答的问题，再选卡片上写着这个问题的 Recipe。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: read the session ———

type SessionState = { now: NowId; header: boolean };

const STRIP_TOP = 40;
const STRIP_H = 60;
const HEADER_H = 74;
const sessionHeight = STRIP_TOP + STRIP_H + 30 + HEADER_H + 8;

function SessionStrip({
	width,
	state,
	locale,
}: {
	width: number;
	state: SessionState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const { hatch } = useStage();
	const moment = moments[state.now];
	const colW = (width - 8) / days.length;
	const dayX = (date: string) => 4 + days.indexOf(date) * colW;
	const nowX = dayX(moment.day) + dayFraction(moment.at) * colW;
	const nowIndex = days.indexOf(moment.day);
	const headerY = STRIP_TOP + STRIP_H + 30;
	const narrow = width < 520;
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t([
					"The market calendar · Sep 13–17, 2030",
					"交易日历 · 2030年9月13–17日",
				])}
			</Label>
			{/* Sessions, then the "now" marker, then the words: the marker never strikes a label. */}
			{days.map((date, i) => {
				const session = sessionDays.has(date);
				if (!session) return null;
				const x = dayX(date);
				const done = i < nowIndex || (i === nowIndex && moment.at >= CLOSE);
				const live = i === nowIndex && moment.at >= OPEN && moment.at < CLOSE;
				// Before the reveal nothing is marked latest, so the strip doesn't answer the question.
				const latest = state.header && date === moment.latest;
				return (
					<m.rect
						key={date}
						x={x + dayFraction(OPEN) * colW}
						y={STRIP_TOP}
						width={(dayFraction(CLOSE) - dayFraction(OPEN)) * colW}
						height={STRIP_H}
						rx={6}
						className={latest ? "wt-focus-shape" : "wt-panel-shape"}
						style={!done && !live ? { fill: hatch } : undefined}
						initial={false}
						animate={{ opacity: done || live ? 1 : 0.55 }}
						transition={motion.fade}
					/>
				);
			})}
			<m.g initial={false} animate={{ x: nowX }} transition={motion.move}>
				<line
					x1={0}
					x2={0}
					y1={STRIP_TOP - 2}
					y2={STRIP_TOP + STRIP_H + 2}
					className="wt-axis"
					strokeWidth={2}
				/>
				<circle cx={0} cy={STRIP_TOP - 2} r={3.5} className="wt-chip" />
			</m.g>
			{days.map((date, i) => {
				const x = dayX(date);
				const session = sessionDays.has(date);
				const done =
					session && (i < nowIndex || (i === nowIndex && moment.at >= CLOSE));
				const live =
					session && i === nowIndex && moment.at >= OPEN && moment.at < CLOSE;
				const latest = state.header && date === moment.latest;
				const label = t(dayLabel(date));
				return (
					<g key={date}>
						<Label
							x={x + colW / 2}
							y={STRIP_TOP - 6}
							anchor="middle"
							tone="small"
							className="wt-halo"
						>
							{narrow ? shortDay(date, locale) : label}
						</Label>
						{session ? (
							<Label
								x={x + colW / 2}
								y={STRIP_TOP + STRIP_H + 16}
								anchor="middle"
								tone={latest ? "accent" : "small"}
							>
								{latest
									? t(["latest", "最新"])
									: live
										? t(["trading", "交易中"])
										: done
											? t(["done", "已完成"])
											: ""}
							</Label>
						) : (
							<Label
								x={x + colW / 2}
								y={STRIP_TOP + STRIP_H / 2 + 4}
								anchor="middle"
								tone="small"
								className="wt-halo"
							>
								{t(["closed", "休市"])}
							</Label>
						)}
					</g>
				);
			})}
			<g>
				<rect
					x={4}
					y={headerY}
					width={width - 8}
					height={HEADER_H}
					rx={10}
					className="wt-panel-shape"
				/>
				<Label x={16} y={headerY + 22}>
					{narrow ? "UOA Screener" : "Unusual Options Activity Screener"}
				</Label>
				<m.text
					key={state.header ? moment.latest : "unknown"}
					x={16}
					y={headerY + 44}
					className={state.header ? "wt-accent" : "wt-muted"}
					initial={motion.enabled ? { opacity: 0 } : false}
					animate={{ opacity: 1 }}
					transition={motion.fade}
				>
					{state.header
						? t([
								`Session · ${t(dayLabel(moment.latest))}`,
								`交易时段 · ${t(dayLabel(moment.latest))}`,
							])
						: t(["Session · ?", "交易时段 · ?"])}
				</m.text>
				<Label x={16} y={headerY + 62} tone="small">
					{t([`Ran · ${t(moment.label)}`, `运行于 · ${t(moment.label)}`])}
				</Label>
			</g>
		</g>
	);
}

function SessionView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SessionState;
	explore: SessionState | null;
	setExplore: (next: SessionState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const moment = moments[shown.now];
	const result: ResultItem[] = shown.header
		? [
				{
					id: "session",
					label: t(["Session the report shows", "报告展示的交易时段"]),
					value: t(dayLabel(moment.latest)),
					note: t(["the latest completed session", "最近一个完整的交易时段"]),
					evidence: "observed",
				},
				{
					id: "why",
					label: t(["Why", "原因"]),
					value: t(moment.label),
					note: t(moment.why),
				},
			]
		: [
				{
					id: "now",
					label: t(["Now", "现在"]),
					value: t(moment.label),
					note: t(moment.why),
				},
			];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Five days from Friday Sep 13 to Tuesday Sep 17 with their trading sessions, a marker for the current time, and the report header naming the session it shows",
						"从9月13日周五到9月17日周二的五天及其交易时段，一个表示当前时间的标记，以及注明所展示交易时段的报告页眉",
					])}
					height={sessionHeight}
				>
					{(width) => (
						<SessionStrip width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Open the report at", "打开报告的时间"])}
						value={explore.now}
						options={(Object.keys(moments) as NowId[]).map(
							(id) => [id, t(moments[id].label)] as const,
						)}
						onChange={(now) => setExplore({ now, header: true })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						'Every run of a recipe names the trading session its numbers describe and when it last ran. By default a report opens on the latest completed U.S. session, which follows the market calendar, not the clock: before the open, during the session, and on weekends or holidays, "latest" is the most recently completed session. Refresh data re-runs the recipe for the session shown; the date picker re-runs it for any earlier session. Keep the session attached to every number you copy out of a report.',
						"Recipe 的每次运行都会注明其数字描述的交易时段以及最近一次运行的时间。报告默认打开最近一个完整的美国交易时段，它遵循交易日历而不是钟表：开盘前、交易时段内、周末或假日，“最新”都是最近一个已完成的时段。“刷新数据”会针对所显示的时段重新运行 Recipe；日期选择器可以针对任何更早的时段重新运行。从报告中摘出的每个数字都要带上它的交易时段。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: official vs yours ———

type ForkState = { forked: boolean; viewer: "you" | "colleague" };

const FORK_CARD_H = 126;

function RecipeCard({
	x,
	y,
	width,
	title,
	badge,
	spotlight,
	focus,
	locale,
}: {
	x: number;
	y: number;
	width: number;
	title: string;
	badge: Copy;
	spotlight: Copy;
	focus: boolean;
	locale: Locale;
}) {
	const t = tr(locale);
	return (
		<g>
			<rect
				x={x}
				y={y}
				width={width}
				height={FORK_CARD_H}
				rx={10}
				className={focus ? "wt-focus-shape" : "wt-panel-shape"}
			/>
			<Label x={x + 12} y={y + 22} maxWidth={width - 24}>
				{title}
			</Label>
			<Label
				x={x + 12}
				y={y + 40}
				tone={focus ? "accent" : "small"}
				maxWidth={width - 24}
			>
				{t(badge)}
			</Label>
			{chapters.map((chapter, i) => (
				<Label
					key={chapter[0]}
					x={x + 12}
					y={y + 62 + i * 15}
					tone="small"
					maxWidth={width - 24}
				>
					{`${i + 1}. ${t(chapter)}`}
				</Label>
			))}
			<Label
				x={x + 12}
				y={y + 62 + chapters.length * 15}
				tone={focus ? "accent" : "small"}
				maxWidth={width - 24}
			>
				{`${chapters.length + 1}. ${t(spotlight)}`}
			</Label>
		</g>
	);
}

/** The two recipe cards sit side by side only when each keeps room for its longest line. */
const FORK_SIDE_BY_SIDE = 640;

function forkLayout(width: number) {
	const narrow = width < FORK_SIDE_BY_SIDE;
	const cardW = narrow ? width - 8 : (width - 8 - 16) / 2;
	return {
		narrow,
		cardW,
		official: { x: 4, y: 64 },
		copy: narrow
			? { x: 4, y: 64 + FORK_CARD_H + 16 }
			: { x: 4 + cardW + 16, y: 64 },
	};
}
const forkHeight = (width: number) =>
	width < FORK_SIDE_BY_SIDE
		? 64 + 2 * FORK_CARD_H + 16 + 8
		: 64 + FORK_CARD_H + 8;

function ForkStage({
	width,
	state,
	locale,
}: {
	width: number;
	state: ForkState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const layout = forkLayout(width);
	const youSeeCopy = state.forked && state.viewer === "you";
	const target = youSeeCopy ? layout.copy : layout.official;
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t([
					"Cookbooks · who sees which version",
					"Cookbooks · 谁看到哪个版本",
				])}
			</Label>
			<Label x={8} y={40}>
				{state.viewer === "you"
					? t(["You open Daily Market Recap", "你打开 Daily Market Recap"])
					: t([
							"A colleague opens Daily Market Recap",
							"同事打开 Daily Market Recap",
						])}
			</Label>
			<RecipeCard
				x={layout.official.x}
				y={layout.official.y}
				width={layout.cardW}
				title="Daily Market Recap"
				badge={[
					"Official · maintained by TradingFlow",
					"官方 · 由 TradingFlow 维护",
				]}
				spotlight={["Spotlight: the headline name", "焦点：当天的头条标的"]}
				focus={!youSeeCopy}
				locale={locale}
			/>
			<m.g
				initial={false}
				animate={{ opacity: state.forked ? 1 : 0 }}
				transition={motion.fade}
			>
				<RecipeCard
					x={layout.copy.x}
					y={layout.copy.y}
					width={layout.cardW}
					title={
						layout.narrow ? t(["Your copy", "你的副本"]) : "Daily Market Recap"
					}
					badge={["Private · only you", "私有 · 仅你可见"]}
					spotlight={[
						"Spotlight: choose a symbol (ALFA)",
						"焦点：选择标的（ALFA）",
					]}
					focus={youSeeCopy}
					locale={locale}
				/>
			</m.g>
			<m.circle
				r={5}
				className="wt-chip"
				initial={false}
				animate={{ cx: target.x + layout.cardW - 16, cy: target.y + 18 }}
				transition={motion.move}
			/>
		</g>
	);
}

function ForkView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ForkState;
	explore: ForkState | null;
	setExplore: (next: ForkState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const sees =
		shown.forked && shown.viewer === "you"
			? t(["Your private copy", "你的私有副本"])
			: t(["The official recipe", "官方 Recipe"]);
	const result: ResultItem[] = [
		{
			id: "sees",
			label:
				shown.viewer === "you"
					? t(["You see", "你看到"])
					: t(["Your colleague sees", "同事看到"]),
			value: sees,
			note: shown.forked
				? t(["the official one is never edited", "官方版本从不被修改"])
				: t([
						"every paid account runs this version",
						"所有付费账户运行同一版本",
					]),
		},
	];
	if (shown.forked)
		result.push({
			id: "share",
			label: t(["Sharing", "共享"]),
			value: t(["None", "无"]),
			note: t(["your recipes are owner-only", "你的 Recipe 仅所有者可见"]),
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The official Daily Market Recap and, after forking, your private copy with a changed Spotlight chapter; a marker shows which version the current viewer opens",
						"官方的 Daily Market Recap 与分叉后你的私有副本（焦点章节已修改）；标记显示当前查看者打开的是哪个版本",
					])}
					height={forkHeight}
				>
					{(width) => <ForkStage width={width} state={shown} locale={locale} />}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Who opens it", "谁打开"])}
						value={explore.viewer}
						options={[
							["you", t(["You", "你"])],
							["colleague", t(["A colleague", "同事"])],
						]}
						onChange={(viewer) => setExplore({ forked: true, viewer })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Official recipes are built and maintained by TradingFlow's team, and every paid account runs the same version. To make your own, Edit with AI copies an official recipe into a private working copy, or New recipe starts from a blank one. The official recipe is never edited in place, and your recipes are owner-only: there is no public, team or share-link state. Running official recipes needs a paid TradingFlow plan; creating and editing your own is a separate, limited rollout, so a paid account may have the library without the editing controls.",
						"官方 Recipe 由 TradingFlow 团队构建和维护，所有付费账户运行的是同一版本。要做自己的版本，可以用 Edit with AI 把官方 Recipe 复制成私有工作副本，或用 New recipe 从空白开始。官方 Recipe 从不会被原地修改，你的 Recipe 只有你自己可见：没有公开、团队或分享链接状态。运行官方 Recipe 需要 TradingFlow 付费方案；创建和编辑自己的 Recipe 是单独的、有限范围的灰度功能，所以付费账户可能有 Recipe 库，却没有编辑控件。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<CatalogState, CatalogState>({
		id: "choose",
		label: ["Choose by the question", "按问题选择"],
		title: [
			"A recipe answers one kind of question",
			"一个 Recipe 回答一类问题",
		],
		predict: {
			prompt: [
				"You want the contracts in ALFA's market that traded far above their open interest on Monday. Which official recipe answers that?",
				"你想找出 ALFA 所在市场中周一成交远超未平仓量的合约。哪个官方 Recipe 回答这个问题？",
			],
			choices: [
				{
					id: "uoa",
					label: [
						"Unusual Options Activity Screener",
						"Unusual Options Activity Screener",
					],
				},
				{
					id: "snapshot",
					label: ["Ticker Options Snapshot", "Ticker Options Snapshot"],
				},
				{ id: "recap", label: ["Daily Market Recap", "Daily Market Recap"] },
			],
			answer: "uoa",
			revealAt: 1,
			explain: [
				"It's one filter across the whole market for one session: a session screen. A snapshot looks at one symbol, and the recap walks the whole session.",
				"这是在一个时段内对整个市场做的一次筛选：时段筛选。快照只看一个标的，市场回顾则讲解整个时段。",
			],
		},
		beats: [
			{
				id: "kinds",
				label: ["Three kinds", "三种类型"],
				caption: [
					"Official recipes come in three kinds: quick lookups about one symbol, session screens across the whole market, and multi-step reports that walk through a session.",
					"官方 Recipe 有三种：关于单个标的的快速查询、覆盖整个市场的时段筛选，以及逐步讲解一个时段的多步骤报告。",
				],
				state: { question: null },
			},
			{
				id: "screen",
				label: ["A screen", "筛选"],
				caption: [
					'"Which contracts traded far above their open interest?" filters the whole market for one session: a session screen. The Unusual Options Activity Screener answers it.',
					"“哪些合约的成交远超其未平仓量？”是在一个时段内筛选整个市场：时段筛选。Unusual Options Activity Screener 回答这个问题。",
				],
				state: { question: "uoa" },
			},
			{
				id: "lookup",
				label: ["A lookup", "查询"],
				caption: [
					'"Everything about ALFA\'s options today" is about one symbol: a quick lookup, the Ticker Options Snapshot. Pick the recipe by your question, not by the biggest report.',
					"“ALFA 今天期权的全部概况”只关于一个标的：快速查询 Ticker Options Snapshot。按你的问题选 Recipe，而不是选最大的报告。",
				],
				state: { question: "snapshot" },
			},
		],
		explore: {
			prompt: [
				"Pick a question and find its recipe.",
				"选择一个问题，找到对应的 Recipe。",
			],
			start: () => ({ question: "recap" }),
			task: {
				kind: "answer",
				prompt: [
					'Which recipe answers "Where are ALFA\'s gamma levels today?"',
					"哪个 Recipe 回答“ALFA 今天的 Gamma 位置在哪里？”",
				],
				choices: [
					{ id: "levels", label: ["Gamma Levels", "Gamma Levels"] },
					{ id: "recap", label: ["Daily Market Recap", "Daily Market Recap"] },
					{
						id: "uoa",
						label: [
							"Unusual Options Activity Screener",
							"Unusual Options Activity Screener",
						],
					},
				],
				answer: "levels",
				done: [
					"One symbol, one structural question: a quick lookup. The recap walks a whole session and the screener filters the whole market; neither is built for it.",
					"一个标的、一个结构问题：这是快速查询。复盘覆盖整个交易时段，筛选器过滤整个市场；两者都不是为此设计的。",
				],
			},
		},
		View: CatalogView,
	}),
	defineScene<SessionState, SessionState>({
		id: "session",
		label: ["Read the session", "看清交易时段"],
		title: [
			'"Latest" follows the market calendar, not the clock',
			"“最新”遵循交易日历，而不是钟表",
		],
		predict: {
			prompt: [
				"You open the screener at 8:00 on Tuesday Sep 17, before the market opens. Which session does it show?",
				"你在 9月17日周二 8:00、开盘前打开这个筛选器。它显示哪个交易时段？",
			],
			choices: [
				{ id: "monday", label: ["Monday Sep 16", "9月16日周一"] },
				{
					id: "tuesday",
					label: ["Tuesday Sep 17: today", "9月17日周二：今天"],
				},
				{ id: "none", label: ["Nothing until 9:30", "9:30 之前什么也没有"] },
			],
			answer: "monday",
			revealAt: 1,
			explain: [
				"A report opens on the latest completed session. At 8:00 on Tuesday that's Monday; Tuesday hasn't traded yet.",
				"报告默认打开最近一个完整的交易时段。周二 8:00 时那是周一；周二还没有开始交易。",
			],
		},
		beats: [
			{
				id: "now",
				label: ["Tue 8:00", "周二 8:00"],
				caption: [
					"It's 8:00 on Tuesday Sep 17. Tuesday's session opens at 9:30.",
					"现在是9月17日周二 8:00，周二的交易时段 9:30 开始。",
				],
				state: { now: "tue-0800", header: false },
			},
			{
				id: "latest",
				label: ["Latest", "最新"],
				caption: [
					"The report shows Monday Sep 16, the latest completed session. Its header names that session and when the report ran.",
					"报告显示9月16日周一，即最近一个完整的交易时段。页眉注明了这个时段以及报告的运行时间。",
				],
				state: { now: "tue-0800", header: true },
			},
			{
				id: "monday",
				label: ["Mon 10:00", "周一 10:00"],
				caption: [
					"Open it at 10:00 on Monday instead and it shows Friday Sep 13: Monday's session isn't complete yet. The date picker re-runs it for any earlier session.",
					"如果在周一 10:00 打开，它显示的是9月13日周五：周一的时段还没结束。日期选择器可以针对任何更早的时段重新运行。",
				],
				state: { now: "mon-1000", header: true },
			},
		],
		explore: {
			prompt: ["Open the report at different times.", "在不同时间打开报告。"],
			start: () => ({ now: "sat-1200", header: true }),
			task: {
				kind: "reach",
				prompt: [
					"Find a time at which the report opens on Monday's session.",
					"找出一个打开报告时显示周一交易时段的时间。",
				],
				reached: (e) => moments[e.now].latest === SESSION_DATE,
				done: [
					"From Monday's close until Tuesday's session finishes, the latest completed session is Monday's. The header names the session, so check it before you read a single number.",
					"从周一收盘到周二交易时段结束，最新完成的时段都是周一。标题会写明时段，读任何数字之前先看它。",
				],
			},
		},
		View: SessionView,
	}),
	defineScene<ForkState, ForkState>({
		id: "fork",
		label: ["Official vs yours", "官方与你的版本"],
		title: [
			"The official recipe never changes under you",
			"官方 Recipe 不会在你脚下改变",
		],
		predict: {
			prompt: [
				"You fork Daily Market Recap with Edit with AI and change its Spotlight chapter. What does a colleague see when they open Daily Market Recap?",
				"你用 Edit with AI 分叉了 Daily Market Recap，并修改了它的焦点章节。同事打开 Daily Market Recap 时看到什么？",
			],
			choices: [
				{
					id: "official",
					label: ["The official recipe, unchanged", "未改动的官方 Recipe"],
				},
				{ id: "yours", label: ["Your edited version", "你修改后的版本"] },
				{ id: "both", label: ["Both, side by side", "两个版本并排"] },
			],
			answer: "official",
			revealAt: 2,
			explain: [
				"Forking makes a private copy; the official recipe is never edited, and your copy is visible only to you.",
				"分叉会生成私有副本；官方 Recipe 从不被修改，你的副本只有你能看到。",
			],
		},
		beats: [
			{
				id: "official",
				label: ["Official", "官方"],
				caption: [
					"Daily Market Recap is an official recipe: TradingFlow's team maintains it, and every paid account runs the same version.",
					"Daily Market Recap 是官方 Recipe：由 TradingFlow 团队维护，所有付费账户运行同一个版本。",
				],
				state: { forked: false, viewer: "you" },
			},
			{
				id: "fork",
				label: ["Fork", "分叉"],
				caption: [
					"Edit with AI copies it into a private working copy, where you change the Spotlight chapter. The official recipe itself isn't touched.",
					"Edit with AI 把它复制成私有工作副本，你在副本里修改焦点章节。官方 Recipe 本身不受影响。",
				],
				state: { forked: true, viewer: "you" },
			},
			{
				id: "colleague",
				label: ["Colleague", "同事"],
				caption: [
					"Your copy is owner-only, with no public, team or share-link state. A colleague still opens the official recipe, unchanged.",
					"你的副本只有你可见，没有公开、团队或分享链接状态。同事打开的仍是未改动的官方 Recipe。",
				],
				state: { forked: true, viewer: "colleague" },
			},
		],
		explore: {
			prompt: ["Switch who opens the recipe.", "切换打开 Recipe 的人。"],
			start: () => ({ forked: true, viewer: "you" }),
			task: {
				kind: "answer",
				prompt: ["Who can open your forked copy?", "谁能打开你分叉出的副本？"],
				choices: [
					{ id: "you", label: ["Only you", "只有你"] },
					{ id: "team", label: ["Your team", "你的团队"] },
					{ id: "link", label: ["Anyone with the link", "任何拿到链接的人"] },
				],
				answer: "you",
				done: [
					"Your recipes are owner-only, with no public, team or share-link state. A colleague who opens Daily Market Recap gets the official version, unchanged.",
					"你的 Recipe 只有你自己能看，没有公开、团队或分享链接状态。同事打开 Daily Market Recap 时看到的是官方版本，未被改动。",
				],
			},
		},
		View: ForkView,
	}),
] as const;

export function TradingflowRecipesWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Player
			locale={locale}
			id="tradingflow-recipes"
			label={[
				"Interactive lesson on TradingFlow recipes",
				"TradingFlow Recipe 互动课",
			]}
			film={tradingflowRecipesFilm}
			scenes={scenes}
		/>
	);
}
