import * as m from "motion/react-m";
import {
	type Copy,
	contractDte,
	dayLabel,
	mondayScreen,
	pick,
	runScreen,
	type ScreenContract,
	type ScreenInputs,
	SESSION_DATE,
	screenContractLabel,
	screenDefaults,
	screenMiss,
	volumeToOi,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import {
	RankBump,
	type RankItem,
	rankBumpHeight,
} from "../walkthrough/instruments/rank-bump";
import { Player } from "../walkthrough/player";
import { Label, Stage, useTeachMotion } from "../walkthrough/stage";
import { wrapText } from "../walkthrough/text-measure";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame } from "../walkthrough/walkthrough";
import { recipeInputsFilm } from "./recipe-inputs-film";
import {
	type ChangeId,
	changes,
	contracts,
	count,
	INPUT_ROWS,
	raised,
	run,
} from "./recipe-inputs-model";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

// ——— Scene 1: a draft isn't a run ———

type Action = "draft" | "run" | "discard";
type DraftState = { applied: number; draft: number; action: Action };

/** The Min OI the report last ran with, and what the input shows now. */
function resolve(state: DraftState) {
	const shown = state.action === "discard" ? state.applied : state.draft;
	const ran = state.action === "run" ? state.draft : state.applied;
	return { shown, ran, pending: state.action === "draft" && shown !== ran };
}

const INPUT_ROW = 30;
const DOCK_H = 40;
const draftLayout = (width: number) => {
	const narrow = width < 520;
	const panelW = narrow ? width - 8 : (width - 8 - 14) * 0.52;
	const resultX = narrow ? 4 : 4 + panelW + 14;
	const resultY = narrow
		? 34 + INPUT_ROWS.length * INPUT_ROW + DOCK_H + 18
		: 34;
	return {
		narrow,
		panelW,
		resultX,
		resultY,
		resultW: narrow ? width - 8 : width - 8 - panelW - 14,
		height: narrow
			? resultY + 110
			: 34 + INPUT_ROWS.length * INPUT_ROW + DOCK_H + 14,
	};
};

function DraftStage({
	width,
	state,
	locale,
}: {
	width: number;
	state: DraftState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const layout = draftLayout(width);
	const { shown, ran, pending } = resolve(state);
	const passed = run({ minOpenInterest: ran });
	const inputValue = (id: keyof ScreenInputs) =>
		id === "minOpenInterest" ? shown : screenDefaults[id];
	const dockY = 34 + INPUT_ROWS.length * INPUT_ROW + 6;
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t([
					`Screener · ${t(dayLabel(SESSION_DATE))} · inputs`,
					`筛选器 · ${t(dayLabel(SESSION_DATE))} · 输入`,
				])}
			</Label>
			{INPUT_ROWS.map((row, i) => {
				const y = 30 + i * INPUT_ROW;
				const draft = row.id === "minOpenInterest" && pending;
				return (
					<g key={row.id}>
						<Label x={12} y={y + 18} tone="small">
							{t(row.label)}
						</Label>
						<rect
							x={layout.panelW - 82}
							y={y + 4}
							width={78}
							height={22}
							rx={6}
							className={draft ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						<m.text
							key={`${row.id}-${inputValue(row.id)}`}
							x={layout.panelW - 12}
							y={y + 19}
							textAnchor="end"
							className={draft ? "wt-accent" : undefined}
							initial={motion.enabled ? { opacity: 0 } : false}
							animate={{ opacity: 1 }}
							transition={motion.fade}
						>
							{count(inputValue(row.id))}
						</m.text>
					</g>
				);
			})}
			<m.g
				initial={false}
				animate={{ opacity: pending ? 1 : 0 }}
				transition={motion.fade}
			>
				<rect
					x={4}
					y={dockY}
					width={layout.panelW}
					height={DOCK_H - 8}
					rx={8}
					className="wt-focus-shape"
				/>
				<Label x={14} y={dockY + 21} tone="small" className="wt-accent">
					{t(["Draft · Run  ·  Discard changes", "草稿 · 运行  ·  放弃更改"])}
				</Label>
			</m.g>
			<rect
				x={layout.resultX}
				y={layout.resultY}
				width={layout.resultW}
				height={96}
				rx={10}
				className="wt-panel-shape"
			/>
			<Label x={layout.resultX + 12} y={layout.resultY + 20} tone="small">
				{t([
					`Last run · Min OI ${count(ran)}`,
					`上次运行 · 最低未平仓量 ${count(ran)}`,
				])}
			</Label>
			<m.text
				key={`count-${ran}`}
				x={layout.resultX + 12}
				y={layout.resultY + 52}
				className="wt-strong"
				initial={motion.enabled ? { opacity: 0 } : false}
				animate={{ opacity: 1 }}
				transition={motion.fade}
			>
				{t([
					`${contracts(passed.length)} flagged`,
					`入选 ${passed.length} 份合约`,
				])}
			</m.text>
			<Label x={layout.resultX + 12} y={layout.resultY + 78} tone="small">
				{passed[0]
					? t([
							`top: ${t(screenContractLabel(passed[0]))}`,
							`第一：${t(screenContractLabel(passed[0]))}`,
						])
					: t(["no contract passes", "没有合约通过"])}
			</Label>
		</g>
	);
}

function DraftView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: DraftState;
	explore: DraftState | null;
	setExplore: (next: DraftState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const { shown: input, ran, pending } = resolve(shown);
	const passed = run({ minOpenInterest: ran });
	const result: ResultItem[] = [
		{
			id: "input",
			label: t(["Min OI input shows", "最低未平仓量输入框显示"]),
			value: count(input),
			note: pending
				? t(["a draft value", "草稿值"])
				: t(["what last ran", "上次运行的值"]),
		},
		{
			id: "flagged",
			label: t(["Report shows", "报告显示"]),
			value: t([contracts(passed.length), `${passed.length} 份合约`]),
			note: t([
				`from the run at Min OI ${count(ran)}`,
				`来自最低未平仓量 ${count(ran)} 的运行`,
			]),
			evidence: "observed",
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The screener's five inputs with the minimum open interest edited, the draft dock that appears, and the count from the last run",
						"筛选器的五个输入（最低未平仓量已修改）、出现的草稿操作栏，以及上次运行的结果数量",
					])}
					height={(width) => draftLayout(width).height}
				>
					{(width) => (
						<DraftStage width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<>
						<ChoiceField
							label={t(["Set Min OI to", "把最低未平仓量设为"])}
							value={String(explore.draft) as "200" | "500" | "1000"}
							options={[
								["200", "200"],
								["500", "500"],
								["1000", "1,000"],
							]}
							onChange={(value) =>
								setExplore({
									...explore,
									draft: Number(value),
									action: "draft",
								})
							}
						/>
						<ChoiceField
							label={t(["Then", "然后"])}
							value={explore.action}
							options={[
								["draft", t(["Leave it", "先不动"])],
								["run", t(["Run", "运行"])],
								["discard", t(["Discard", "放弃"])],
							]}
							onChange={(action) =>
								setExplore(
									action === "run"
										? { applied: explore.draft, draft: explore.draft, action }
										: action === "discard"
											? {
													applied: explore.applied,
													draft: explore.applied,
													action,
												}
											: { ...explore, action },
								)
							}
						/>
					</>
				) : null
			}
			details={
				<p>
					{t([
						"Changing an input inside a report creates a draft value and shows one Run control for the whole recipe. Nothing below changes until you run it: every dependent cell then refreshes together, so the key figures, the text and the tables always describe the same inputs. Discard changes puts back the values of the last successful run. Changing an input only changes that run; it doesn't rewrite the recipe.",
						"在报告里修改一个输入，会生成草稿值，并为整个 Recipe 显示一个“运行”控件。运行之前，下面什么都不会变：运行后所有依赖它的单元格一起刷新，所以关键数字、文字和表格描述的始终是同一组输入。“放弃更改”会恢复上一次成功运行的值。修改输入只改变那次运行，不会改写 Recipe 本身。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: tune or re-ask ———

type ChangeState = { reveal: 0 | 1 | 2; focus: ChangeId | null };

const CHANGE_H = 46;
/** Each change's text wraps beside its tag. */
const changeLines = (text: string, width: number) =>
	wrapText(text, width - (width < 520 ? 130 : 150), 12);
const changeHeight = (width: number, locale: Locale) =>
	30 +
	changes.reduce(
		(sum, item) =>
			sum +
			Math.max(
				CHANGE_H,
				changeLines(pick(item.text, locale), width).length * 16 + 22,
			) +
			8,
		0,
	);

function ChangeStage({
	width,
	state,
	locale,
}: {
	width: number;
	state: ChangeState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	let y = 30;
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t(["Four changes to the screener", "对筛选器的四种改动"])}
			</Label>
			{changes.map((item) => {
				const shown =
					(item.kind === "input" && state.reveal >= 1) ||
					(item.kind === "method" && state.reveal >= 2);
				const lines = changeLines(t(item.text), width);
				const h = Math.max(CHANGE_H, lines.length * 16 + 22);
				const top = y;
				y += h + 8;
				const focus = state.focus === item.id;
				return (
					<g key={item.id}>
						<rect
							x={4}
							y={top}
							width={width - 8}
							height={h}
							rx={9}
							className={focus ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						{lines.map((line, i) => (
							<Label key={line} x={14} y={top + 20 + i * 16} tone="muted">
								{line}
							</Label>
						))}
						<m.g
							initial={false}
							animate={{ opacity: shown ? 1 : 0 }}
							transition={motion.fade}
						>
							<Label
								x={width - 14}
								y={top + h / 2 + 4}
								anchor="end"
								tone="small"
								className={item.kind === "method" ? "wt-accent" : undefined}
							>
								{item.kind === "input"
									? t(["same question", "同一个问题"])
									: t(["new question", "新问题"])}
							</Label>
						</m.g>
					</g>
				);
			})}
		</g>
	);
}

function ChangeView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ChangeState;
	explore: ChangeState | null;
	setExplore: (next: ChangeState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const focus = changes.find((item) => item.id === shown.focus);
	const result: ResultItem[] = focus
		? [
				{
					id: "kind",
					label: t(focus.text),
					value:
						focus.kind === "input"
							? t(["Same question", "同一个问题"])
							: t(["New question", "新问题"]),
					note:
						focus.kind === "input"
							? t([
									"an input or the date: re-run it",
									"输入或日期：重新运行即可",
								])
							: t([
									"the method: fork and edit the recipe",
									"方法：分叉并编辑 Recipe",
								]),
				},
				{
					id: "effect",
					label: t(["Effect", "效果"]),
					value: t(focus.effect),
				},
			]
		: [
				{
					id: "count",
					label: t(["Changes to sort", "待分类的改动"]),
					value: "4",
				},
			];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Four changes to the screener, each tagged as re-running the same question or asking a new one",
						"对筛选器的四种改动，每种都标注为重新运行同一个问题或提出新问题",
					])}
					height={(width) => changeHeight(width, locale)}
				>
					{(width) => (
						<ChangeStage width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Look at", "查看"])}
						value={explore.focus ?? "volOi"}
						options={[
							["volOi", t(["Vol/OI 2", "成交量/OI 2"])],
							["date", t(["Tuesday", "周二"])],
							["premium", t(["Premium", "权利金"])],
							["zeroDte", "0DTE"],
						]}
						onChange={(focus) => setExplore({ reveal: 2, focus })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"An input or the session date is part of the recipe's question: changing it re-runs the same question on stricter terms or another day, and the results stay comparable. Changing what is measured, how it's ranked, or which contracts are eligible asks a different question. That is a change to the recipe itself, made in a private fork with Edit with AI and saved under its own name, so it isn't mistaken for the official screen.",
						"输入或交易时段日期是 Recipe 问题的一部分：修改它们是以更严格的条件或在另一天重新运行同一个问题，结果仍可比较。改变度量对象、排名方式或哪些合约有资格入选，则是在问一个不同的问题。那是对 Recipe 本身的修改，要在用 Edit with AI 生成的私有分叉里进行，并以自己的名字保存，以免被误认为官方筛选。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: floors protect the ranking ———

type FloorState = { minVolume: number; minOpenInterest: number };

const shortLabel = (row: ScreenContract, locale: Locale) =>
	pick(screenContractLabel(row), locale);

function rankItems(state: FloorState, locale: Locale): RankItem[] {
	const inputs = { ...screenDefaults, ...state };
	const passed = runScreen(mondayScreen, inputs, SESSION_DATE);
	const thin = mondayScreen.find((row) => row.id === "dune-oct11-40c");
	const longDated = mondayScreen.find((row) => row.id === "alfa-dec20-110");
	const items: RankItem[] = passed.map((row) => ({
		id: row.id,
		label: shortLabel(row, locale),
		value: volumeToOi(row).toFixed(2),
		tone: row.id === "dune-oct11-40c" ? "accent" : undefined,
	}));
	for (const row of [thin, longDated]) {
		if (!row || passed.includes(row)) continue;
		const miss = screenMiss(row, inputs, SESSION_DATE);
		items.push({
			id: row.id,
			label: shortLabel(row, locale),
			value: volumeToOi(row).toFixed(2),
			excluded:
				miss === "maxDte"
					? pick(
							[
								`${contractDte(row, SESSION_DATE)} days`,
								`${contractDte(row, SESSION_DATE)} 天`,
							],
							locale,
						)
					: miss === "minVolume"
						? pick([`volume ${row.volume}`, `成交量 ${row.volume}`], locale)
						: pick(
								[`OI ${row.openInterest}`, `未平仓 ${row.openInterest}`],
								locale,
							),
		});
	}
	return items;
}

const FLOOR_ROWS = 8;

function FloorView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: FloorState;
	explore: FloorState | null;
	setExplore: (next: FloorState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const items = rankItems(shown, locale);
	const passed = runScreen(
		mondayScreen,
		{ ...screenDefaults, ...shown },
		SESSION_DATE,
	);
	const top = passed[0];
	const result: ResultItem[] = [
		{
			id: "top",
			label: t(["Top by volume/OI", "成交量/OI 第一"]),
			value: top ? shortLabel(top, locale) : "—",
			note: top
				? t([
						`${count(top.volume)} contracts against ${count(top.openInterest)} open interest`,
						`成交 ${count(top.volume)} 张，未平仓量 ${count(top.openInterest)}`,
					])
				: undefined,
			tone: top?.id === "dune-oct11-40c" ? "loss" : undefined,
			evidence: "calculated",
		},
		{
			id: "floors",
			label: t(["Floors", "门槛"]),
			value: t([
				`volume ≥ ${count(shown.minVolume)} · OI ≥ ${count(shown.minOpenInterest)}`,
				`成交量 ≥ ${count(shown.minVolume)} · 未平仓 ≥ ${count(shown.minOpenInterest)}`,
			]),
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Monday's contracts ranked by volume divided by open interest; when the volume and open-interest floors drop to zero, a thin contract with 30 contracts against 5 open interest jumps to the top",
						"周一的合约按成交量除以未平仓量排名；当成交量和未平仓量门槛降为零时，一份成交 30 张、未平仓量 5 的冷门合约跳到第一",
					])}
					height={rankBumpHeight(FLOOR_ROWS)}
				>
					{(width) => (
						<RankBump
							width={width}
							columns={[
								{
									id: "rank",
									title: t([
										"Monday · ranked by volume/OI",
										"周一 · 按成交量/OI 排名",
									]),
									items,
								},
							]}
							focus="dune-oct11-40c"
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<>
						<ChoiceField
							label={t(["Min volume", "最低成交量"])}
							value={String(explore.minVolume) as "0" | "100" | "500"}
							options={[
								["0", "0"],
								["100", "100"],
								["500", "500"],
							]}
							onChange={(value) =>
								setExplore({ ...explore, minVolume: Number(value) })
							}
						/>
						<ChoiceField
							label={t(["Min OI", "最低未平仓量"])}
							value={String(explore.minOpenInterest) as "0" | "50" | "200"}
							options={[
								["0", "0"],
								["50", "50"],
								["200", "200"],
							]}
							onChange={(value) =>
								setExplore({ ...explore, minOpenInterest: Number(value) })
							}
						/>
					</>
				) : null
			}
			details={
				<p>
					{t([
						'A ratio is only as steady as its denominator. A contract with 5 open interest reaches 6 times its open interest on 30 contracts, more "unusual" than a contract trading thousands. The screener\'s volume and open-interest floors keep such thin contracts from leading the ranking; lowering them is a fair choice, but say so, and expect the top of the list to be the contracts with the least behind them. The 60-day limit still keeps the far-dated ALFA Dec 20 call out, however thin it is.',
						"比率的稳定程度取决于它的分母。一份未平仓量只有 5 的合约，成交 30 张就达到未平仓量的 6 倍，比成交几千张的合约还“异常”。筛选器的成交量与未平仓量门槛就是为了不让这种冷门合约领跑排名；降低门槛可以，但要说明，并预期排在最前面的是背后最单薄的合约。无论多冷门，60 天的期限仍会把远月的 ALFA 12月20日 看涨挡在外面。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<DraftState, DraftState>({
		id: "draft",
		label: ["Draft, then run", "先草稿，再运行"],
		title: ["A draft input isn't a run", "草稿输入不是一次运行"],
		predict: {
			prompt: [
				"You change Min OI from 200 to 1,000 and haven't pressed Run yet. How many contracts does the report show?",
				"你把最低未平仓量从 200 改成 1,000，还没有点“运行”。报告显示多少份合约？",
			],
			choices: [
				{
					id: "five",
					label: [
						`Still ${run({}).length}: a draft doesn't run`,
						`仍是 ${run({}).length} 份：草稿不会运行`,
					],
				},
				{
					id: "one",
					label: [
						`${raised}: the new floor applies at once`,
						`${raised} 份：新门槛立刻生效`,
					],
				},
				{ id: "zero", label: ["None: the table clears", "0 份：表格会清空"] },
			],
			answer: "five",
			entry: { answer: 5, unit: [" contracts", " 张"] },
			revealAt: 1,
			explain: [
				"An edited input is a draft. The report keeps the last run until you press Run, so every cell always matches one set of inputs.",
				"修改后的输入只是草稿。在你点“运行”之前，报告保留上一次运行的结果，所以每个单元格始终对应同一组输入。",
			],
		},
		beats: [
			{
				id: "run",
				label: ["Last run", "上次运行"],
				caption: [
					`Monday's run at the default floors flags ${run({}).length} contracts.`,
					`周一按默认门槛运行，${run({}).length} 份合约入选。`,
				],
				state: { applied: 200, draft: 200, action: "draft" },
			},
			{
				id: "draft",
				label: ["Draft", "草稿"],
				caption: [
					"Type 1,000 into Min OI: the input shows a draft and a Run dock appears, but the report still shows the last run.",
					"在最低未平仓量里输入 1,000：输入框显示草稿值，并出现运行操作栏，但报告显示的仍是上一次运行。",
				],
				state: { applied: 200, draft: 1_000, action: "draft" },
			},
			{
				id: "ran",
				label: ["Run", "运行"],
				caption: [
					`Press Run and every cell refreshes together: ${raised} contract clears a floor of 1,000. Discard changes would have put 200 back.`,
					`点“运行”后所有单元格一起刷新：只有 ${raised} 份合约过了 1,000 的门槛。如果点“放弃更改”，会恢复为 200。`,
				],
				state: { applied: 1_000, draft: 1_000, action: "run" },
			},
		],
		explore: {
			prompt: [
				"Edit Min OI, then run or discard.",
				"修改最低未平仓量，然后运行或放弃。",
			],
			start: () => ({ applied: 200, draft: 500, action: "draft" }),
			task: {
				kind: "reach",
				prompt: [
					"Get the report to show what a Min OI of 1,000 finds.",
					"让报告显示最低未平仓量设为 1,000 时的结果。",
				],
				reached: (e) => e.applied === 1_000,
				done: [
					"Typing 1,000 only makes a draft; pressing Run applies it and every cell refreshes together. Until then the report keeps showing the last run.",
					"输入 1,000 只是草稿；按下运行才会生效，所有单元格一起刷新。在此之前，报告一直显示上一次运行的结果。",
				],
			},
		},
		View: DraftView,
	}),
	defineScene<ChangeState, ChangeState>({
		id: "tune",
		label: ["Tune or re-ask", "调参还是换问题"],
		title: [
			"Inputs re-run a question; methods ask a new one",
			"输入是重跑问题，方法是提新问题",
		],
		predict: {
			prompt: [
				"Which of these changes asks a new question instead of re-running the same one?",
				"下列哪种改动是在提出新问题，而不是重新运行同一个问题？",
			],
			choices: [
				{
					id: "premium",
					label: [
						"Ranking by premium instead of volume/OI",
						"改为按权利金而非成交量/OI 排名",
					],
				},
				{
					id: "volOi",
					label: ["Raising Min volume/OI to 2", "把最低成交量/OI 提高到 2"],
				},
				{
					id: "date",
					label: [
						"Picking Tuesday in the date picker",
						"在日期选择器中选择周二",
					],
				},
			],
			answer: "premium",
			revealAt: 1,
			explain: [
				'Thresholds and the date are inputs to the same question. Ranking by premium measures something else: "biggest money" isn\'t "unusual against open interest".',
				"阈值和日期是同一个问题的输入。按权利金排名衡量的是另一回事：“金额最大”不等于“相对未平仓量异常”。",
			],
		},
		beats: [
			{
				id: "list",
				label: ["Four changes", "四种改动"],
				caption: [
					"Four things you might change about the unusual-activity screener.",
					"对异常成交筛选器，你可能会做的四种改动。",
				],
				state: { reveal: 0, focus: null },
			},
			{
				id: "inputs",
				label: ["Inputs", "输入"],
				caption: [
					"A stricter threshold or another session re-runs the same question: the answers stay comparable.",
					"更严格的阈值或换一个交易时段，都是重新运行同一个问题：答案仍可比较。",
				],
				state: { reveal: 1, focus: "volOi" },
			},
			{
				id: "methods",
				label: ["Methods", "方法"],
				caption: [
					"Ranking by premium, or letting same-day expiries in, changes what the screen measures. That's a new question: fork the recipe and save it under its own name.",
					"按权利金排名或纳入当天到期合约，会改变筛选的度量对象。这是新问题：分叉 Recipe，并以自己的名字保存。",
				],
				state: { reveal: 2, focus: "premium" },
			},
		],
		explore: {
			prompt: ["Look at each change.", "逐个查看每种改动。"],
			start: () => ({ reveal: 2, focus: "zeroDte" }),
			task: {
				kind: "answer",
				prompt: [
					"Which change keeps you asking the same question?",
					"哪项改动让你仍然在问同一个问题？",
				],
				choices: [
					{ id: "date", label: ["Picking Tuesday", "选择周二"] },
					{ id: "premium", label: ["Ranking by premium", "按权利金排名"] },
					{
						id: "zeroDte",
						label: ["Letting same-day expiries in", "纳入当日到期合约"],
					},
				],
				answer: "date",
				done: [
					"Another session is an input to the same screen, so the answers stay comparable. Ranking by premium or admitting 0DTE changes what the screen measures: a new question that deserves its own recipe.",
					"换一个时段只是同一筛选的输入，答案仍可比较。按权利金排名或纳入 0DTE 会改变筛选衡量的内容：这是一个新问题，应该有自己的 Recipe。",
				],
			},
		},
		View: ChangeView,
	}),
	defineScene<FloorState, FloorState>({
		id: "floors",
		label: ["Floors", "门槛"],
		title: ["Floors keep thin contracts from leading", "门槛防止冷门合约领跑"],
		predict: {
			prompt: [
				"You set Min volume and Min OI to 0 and run. Which contract tops the volume/OI ranking?",
				"你把最低成交量和最低未平仓量都设为 0 后运行。哪份合约排在成交量/OI 第一？",
			],
			choices: [
				{
					id: "dune",
					label: [
						"DUNE Oct 11 40 call: 30 against 5 OI",
						"DUNE 10月11日 40 看涨：成交 30，未平仓 5",
					],
				},
				{
					id: "crux",
					label: [
						"CRUX Oct 4 60 put, as before",
						"CRUX 10月4日 60 看跌，和之前一样",
					],
				},
				{
					id: "alfa",
					label: [
						"ALFA Dec 20 110 call: 12 against 3 OI",
						"ALFA 12月20日 110 看涨：成交 12，未平仓 3",
					],
				},
			],
			answer: "dune",
			revealAt: 1,
			explain: [
				"30 ÷ 5 = 6.00, more than double CRUX's 2.67. ALFA's Dec 20 call is thinner still, but at 95 days it's outside the 60-day limit.",
				"30 ÷ 5 = 6.00，是 CRUX 2.67 的两倍多。ALFA 12月20日 看涨更冷门，但 95 天的期限超出了 60 天的限制。",
			],
		},
		beats: [
			{
				id: "defaults",
				label: ["Defaults", "默认"],
				caption: [
					"At the default floors (volume at least 500, open interest at least 200) the CRUX Oct 4 60 put leads at 2.67.",
					"在默认门槛下（成交量至少 500、未平仓量至少 200），CRUX 10月4日 60 看跌以 2.67 领先。",
				],
				state: { minVolume: 500, minOpenInterest: 200 },
			},
			{
				id: "zero",
				label: ["Floors at 0", "门槛为 0"],
				caption: [
					"Drop both floors to 0 and the DUNE Oct 11 40 call jumps to the top at 6.00: 30 contracts against 5 open interest.",
					"把两个门槛都降为 0，DUNE 10月11日 40 看涨以 6.00 跳到第一：成交 30 张，未平仓量 5。",
				],
				state: { minVolume: 0, minOpenInterest: 0 },
			},
			{
				id: "why",
				label: ["Why floors", "为何要门槛"],
				caption: [
					"A tiny denominator makes a big ratio. Lower the floors if you must, say so, and expect the top rows to be the thinnest contracts.",
					"分母极小，比率就会很大。如果一定要降低门槛，就要说明，并预期排在前面的是最冷门的合约。",
				],
				state: { minVolume: 0, minOpenInterest: 0 },
			},
		],
		explore: {
			prompt: ["Raise or lower the floors.", "提高或降低门槛。"],
			start: () => ({ minVolume: 100, minOpenInterest: 0 }),
			task: {
				kind: "reach",
				prompt: [
					"Set floors at which a contract with only 5 open interest tops the ranking.",
					"设定门槛，让一份未平仓量只有 5 张的合约排在榜首。",
				],
				reached: (e) => e.minVolume === 0 && e.minOpenInterest === 0,
				done: [
					"With both floors at 0, the DUNE Oct 11 40 call's 30 contracts against 5 open interest give 6.00, double anything real. A tiny denominator makes a big ratio; floors keep it out.",
					"两个门槛都设为 0 时，DUNE 10月11日 40 看涨以 30 张对 5 张未平仓量得出 6.00，是真实活跃合约的两倍。极小的分母会制造很大的比值；门槛就是用来把它挡在外面的。",
				],
			},
		},
		View: FloorView,
	}),
] as const;

export function RecipeInputsWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Player
			locale={locale}
			id="recipe-inputs"
			label={["Interactive lesson on recipe inputs", "Recipe 输入互动课"]}
			film={recipeInputsFilm}
			scenes={scenes}
		/>
	);
}
