import * as m from "motion/react-m";
import {
	type Copy,
	dayLabel,
	mondayScreen,
	NEXT_SESSION_DATE,
	pick,
	runScreen,
	type ScreenContract,
	SESSION_DATE,
	screenContractLabel,
	screenDefaults,
	tuesdayScreen,
	volumeToOi,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import { TradeTape, tapeHeight } from "../walkthrough/instruments/trade-tape";
import { Label, Stage, useTeachMotion } from "../walkthrough/stage";
import { wrapText } from "../walkthrough/text-measure";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

/** One run of the unusual-activity screen at its default thresholds. */
function screenRun(on: string, rows: readonly ScreenContract[]) {
	const passed = runScreen(rows, screenDefaults, on);
	const ratios = passed.map(volumeToOi).sort((a, b) => a - b);
	const middle = ratios.length / 2;
	const median =
		ratios.length % 2
			? ratios[Math.floor(middle)]
			: (ratios[middle - 1] + ratios[middle]) / 2;
	return {
		on,
		passed,
		names: new Set(passed.map((row) => row.symbol)).size,
		median,
		top: passed[0],
	};
}
const MONDAY = screenRun(SESSION_DATE, mondayScreen);
const TUESDAY = screenRun(NEXT_SESSION_DATE, tuesdayScreen);

/** The Bottom line cell's sentence for a run: it changes with the session. */
function bottomLine(run: ReturnType<typeof screenRun>): Copy {
	const [day, dayZh] = dayLabel(run.on);
	const [top, topZh] = screenContractLabel(run.top);
	const ratio = volumeToOi(run.top).toFixed(2);
	return [
		`${day}: ${run.passed.length} contracts flagged across ${run.names} names; the highest volume/OI is ${ratio}, the ${top}.`,
		`${dayZh}：${run.names} 个标的共 ${run.passed.length} 份合约入选；成交量/OI 最高为 ${ratio}，是 ${topZh}。`,
	];
}
/** The Takeaways cell: written into the recipe, the same on every run. */
const TAKEAWAYS: Copy = [
	"High volume/OI can be a hedge, a spread leg or a lottery ticket; the screen can't tell which.",
	"高成交量/OI 可能是对冲、价差的一条腿，也可能是彩票式押注；筛选无法区分。",
];

// ——— Scene 1: trace a sentence ———

type CellId = "key" | "bottom" | "table" | "takeaways";
type MapState = { cell: CellId | null };

const INPUTS: readonly { id: string; label: Copy; short: Copy }[] = [
	{
		id: "session",
		label: ["Market session", "交易时段"],
		short: ["Session", "时段"],
	},
	{
		id: "volOi",
		label: ["Min volume / OI", "最低成交量/OI"],
		short: ["Min vol/OI", "成交量/OI"],
	},
	{
		id: "relVol",
		label: ["Min relative volume", "最低相对成交量"],
		short: ["Min rel vol", "相对成交量"],
	},
	{
		id: "volume",
		label: ["Min volume", "最低成交量"],
		short: ["Min volume", "最低成交量"],
	},
	{
		id: "oi",
		label: ["Min OI", "最低未平仓量"],
		short: ["Min OI", "最低未平仓"],
	},
	{
		id: "dte",
		label: ["Max DTE", "最长到期天数"],
		short: ["Max DTE", "最长到期"],
	},
];
const SOURCES: readonly { id: "totals" | "rows"; label: Copy; short: Copy }[] =
	[
		{
			id: "totals",
			label: ["Live data 1 · screen totals", "实时数据 1 · 筛选汇总"],
			short: ["Live data 1", "实时数据 1"],
		},
		{
			id: "rows",
			label: ["Live data 2 · ranked rows", "实时数据 2 · 排名行"],
			short: ["Live data 2", "实时数据 2"],
		},
	];
const CELLS: readonly {
	id: CellId;
	label: Copy;
	source: "totals" | "rows" | null;
}[] = [
	{ id: "key", label: ["Key figures", "关键数字"], source: "totals" },
	{ id: "bottom", label: ["Bottom line", "核心结论"], source: "totals" },
	{ id: "table", label: ["Ranked table", "排名表格"], source: "rows" },
	{ id: "takeaways", label: ["Takeaways", "要点"], source: null },
];

const NODE_H = 26;
const MAP_TOP = 34;
const ROW_STEP = 32;
const mapHeight = MAP_TOP + INPUTS.length * ROW_STEP + 6;

function MapStage({
	width,
	state,
	locale,
}: {
	width: number;
	state: MapState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const narrow = width < 520;
	// Narrow columns keep their gap tight so "Ranked table" fits a node without shrinking.
	const gap = narrow ? 12 : 40;
	const colW = (width - 8 - 2 * gap) / 3;
	const colX = (i: number) => 4 + i * (colW + gap);
	const inputY = (i: number) => MAP_TOP + i * ROW_STEP;
	const span = INPUTS.length * ROW_STEP - (ROW_STEP - NODE_H);
	const sourceY = (i: number) =>
		MAP_TOP + span * (i === 0 ? 0.22 : 0.62) - NODE_H / 2;
	const cellY = (i: number) =>
		MAP_TOP + i * ((span - NODE_H) / (CELLS.length - 1));
	const cell = CELLS.find((item) => item.id === state.cell) ?? null;
	const source = cell?.source ?? null;
	const lit = (on: boolean) => (state.cell === null || on ? 1 : 0.3);
	const edge = (
		x1: number,
		y1: number,
		x2: number,
		y2: number,
		on: boolean,
		key: string,
	) => (
		<m.path
			key={key}
			d={`M${x1} ${y1} C${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`}
			className={on ? "wt-axis" : "wt-grid"}
			fill="none"
			strokeWidth={on ? 1.6 : 1}
			initial={false}
			animate={{ opacity: state.cell === null ? 0.7 : on ? 1 : 0.25 }}
			transition={motion.fade}
		/>
	);
	const node = (
		x: number,
		y: number,
		label: string,
		on: boolean,
		key: string,
		focus = false,
	) => (
		<m.g
			key={key}
			initial={false}
			animate={{ opacity: lit(on) }}
			transition={motion.fade}
		>
			<rect
				x={x}
				y={y}
				width={colW}
				height={NODE_H}
				rx={7}
				className={focus ? "wt-focus-shape" : "wt-panel-shape"}
			/>
			<Label
				x={narrow ? x + colW / 2 : x + 8}
				y={y + NODE_H / 2 + 4}
				anchor={narrow ? "middle" : "start"}
				tone="small"
				className={focus ? "wt-accent" : undefined}
				maxWidth={colW - 6}
			>
				{label}
			</Label>
		</m.g>
	);
	return (
		<g>
			{[
				t(["Inputs", "输入"]),
				t(["Live data", "实时数据"]),
				t(["Cells", "单元格"]),
			].map((heading, i) => (
				<Label key={heading} x={colX(i) + 2} y={18} tone="muted">
					{heading}
				</Label>
			))}
			{INPUTS.map((input, i) =>
				SOURCES.map((item, j) =>
					edge(
						colX(0) + colW,
						inputY(i) + NODE_H / 2,
						colX(1),
						sourceY(j) + NODE_H / 2,
						source === item.id,
						`${input.id}-${item.id}`,
					),
				),
			)}
			{CELLS.map((item, i) => {
				const j = SOURCES.findIndex((s) => s.id === item.source);
				return j < 0
					? null
					: edge(
							colX(1) + colW,
							sourceY(j) + NODE_H / 2,
							colX(2),
							cellY(i) + NODE_H / 2,
							state.cell === item.id,
							`edge-${item.id}`,
						);
			})}
			{INPUTS.map((input, i) =>
				node(colX(0), inputY(i), t(input.short), source !== null, input.id),
			)}
			{SOURCES.map((item, j) =>
				node(colX(1), sourceY(j), t(item.short), source === item.id, item.id),
			)}
			{CELLS.map((item, i) =>
				node(
					colX(2),
					cellY(i),
					t(item.label),
					state.cell === item.id,
					item.id,
					state.cell === item.id,
				),
			)}
		</g>
	);
}

function MapView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: MapState;
	explore: MapState | null;
	setExplore: (next: MapState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const cell = CELLS.find((item) => item.id === shown.cell);
	const source = cell?.source
		? SOURCES.find((item) => item.id === cell.source)
		: null;
	const result: ResultItem[] = !cell
		? [
				{
					id: "cells",
					label: t(["This recipe", "这个 Recipe"]),
					value: t(["4 cells · 6 inputs", "4 个单元格 · 6 个输入"]),
					note: t(["the session and five thresholds", "交易时段与五个阈值"]),
				},
			]
		: source
			? [
					{
						id: "depends",
						label: t([`${t(cell.label)} depends on`, `${t(cell.label)}取决于`]),
						value: t(["Session + 5 thresholds", "交易时段 + 5 个阈值"]),
						note: t(["change any and it re-runs", "改动任何一个都会重新运行"]),
						evidence: "observed",
					},
					{
						id: "via",
						label: t(["Through", "经由"]),
						value: t(source.label),
					},
				]
			: [
					{
						id: "content",
						label: t([`${t(cell.label)} depends on`, `${t(cell.label)}取决于`]),
						value: t(["Nothing", "无"]),
						note: t([
							"recipe content, written in advance",
							"Recipe 内容，预先写好",
						]),
					},
				];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The recipe map: six inputs feed two live-data queries, which feed the key figures, bottom line and ranked table; the takeaways cell has no inputs",
						"Recipe 地图：六个输入流入两个实时数据查询，再流入关键数字、核心结论和排名表格；要点单元格没有任何输入",
					])}
					height={mapHeight}
				>
					{(width) => <MapStage width={width} state={shown} locale={locale} />}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Trace a cell", "追溯一个单元格"])}
						value={explore.cell ?? "bottom"}
						options={CELLS.map((item) => [item.id, t(item.label)] as const)}
						onChange={(cell) => setExplore({ cell })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Open recipe map in a report's header shows how the notebook's inputs and live data feed each visible cell. Input cells are the values a reader can change; live-data cells run queries with those inputs for the represented session; text cells marked as recipe content were written into the recipe and run no query. To audit a claim, find its cell, then the live data and inputs behind it. If a number's cell lists the session and every threshold, any of them can change it.",
						"报告页眉里的“打开 Recipe 地图”展示了笔记本的输入和实时数据如何流入每个可见单元格。输入单元格是读者可以修改的值；实时数据单元格用这些输入针对所展示的交易时段运行查询；标为 Recipe 内容的文字单元格是写进 Recipe 里的，不运行任何查询。要审核一个说法，先找到它所在的单元格，再看它背后的实时数据和输入。如果某个数字的单元格列出了交易时段和每个阈值，那么其中任何一个都能改变它。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: recipe content vs live data ———

type ContentState = { tuesday: boolean; tags: boolean };

const BLOCK_PAD = 12;
const LINE = 16;

function blockLines(text: string, width: number) {
	return wrapText(text, width - 2 * BLOCK_PAD, 12);
}

function runColumnHeight(
	width: number,
	locale: Locale,
	run: ReturnType<typeof screenRun>,
) {
	const bottom = blockLines(pick(bottomLine(run), locale), width);
	const take = blockLines(pick(TAKEAWAYS, locale), width);
	return 24 + (bottom.length * LINE + 34) + 10 + (take.length * LINE + 34);
}

function contentLayout(width: number, locale: Locale) {
	const narrow = width < 520;
	const colW = narrow ? width - 8 : (width - 8 - 14) / 2;
	const monday = runColumnHeight(colW, locale, MONDAY);
	const tuesday = runColumnHeight(colW, locale, TUESDAY);
	return {
		narrow,
		colW,
		tuesdayX: narrow ? 4 : 4 + colW + 14,
		tuesdayY: narrow ? 30 + monday + 14 : 30,
		height: narrow
			? 30 + monday + 14 + tuesday + 6
			: 30 + Math.max(monday, tuesday) + 6,
	};
}

function TextBlock({
	x,
	y,
	width,
	title,
	text,
	tag,
	changed,
	locale,
}: {
	x: number;
	y: number;
	width: number;
	title: Copy;
	text: string;
	tag: Copy | null;
	changed: boolean;
	locale: Locale;
}) {
	const t = tr(locale);
	const lines = blockLines(text, width);
	const height = lines.length * LINE + 34;
	return (
		<g>
			<rect
				x={x}
				y={y}
				width={width}
				height={height}
				rx={9}
				className={changed ? "wt-focus-shape" : "wt-panel-shape"}
			/>
			<Label x={x + BLOCK_PAD} y={y + 18} tone="small">
				{t(title)}
			</Label>
			{tag ? (
				<Label
					x={x + width - BLOCK_PAD}
					y={y + 18}
					anchor="end"
					tone="small"
					className="wt-accent"
				>
					{t(tag)}
				</Label>
			) : null}
			{lines.map((line, i) => (
				<Label
					key={`${i}-${line}`}
					x={x + BLOCK_PAD}
					y={y + 38 + i * LINE}
					tone="muted"
				>
					{line}
				</Label>
			))}
		</g>
	);
}

function RunColumn({
	x,
	y,
	width,
	run,
	state,
	changed,
	locale,
}: {
	x: number;
	y: number;
	width: number;
	run: ReturnType<typeof screenRun>;
	state: ContentState;
	changed: boolean;
	locale: Locale;
}) {
	const t = tr(locale);
	const bottom = pick(bottomLine(run), locale);
	const bottomH = blockLines(bottom, width).length * LINE + 34;
	return (
		<g>
			<Label x={x + 2} y={y + 14} tone="muted">
				{t([`Run for ${t(dayLabel(run.on))}`, `${t(dayLabel(run.on))}的运行`])}
			</Label>
			<TextBlock
				x={x}
				y={y + 24}
				width={width}
				title={["Bottom line", "核心结论"]}
				text={bottom}
				tag={state.tags ? ["Live data", "实时数据"] : null}
				changed={changed}
				locale={locale}
			/>
			<TextBlock
				x={x}
				y={y + 24 + bottomH + 10}
				width={width}
				title={["Takeaways", "要点"]}
				text={pick(TAKEAWAYS, locale)}
				tag={state.tags ? ["Recipe content", "Recipe 内容"] : null}
				changed={false}
				locale={locale}
			/>
		</g>
	);
}

function ContentStage({
	width,
	state,
	locale,
}: {
	width: number;
	state: ContentState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const layout = contentLayout(width, locale);
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t(
					layout.narrow
						? ["UOA Screener · two text cells", "UOA Screener · 两个文字单元格"]
						: [
								"Unusual Options Activity Screener · two text cells",
								"Unusual Options Activity Screener · 两个文字单元格",
							],
				)}
			</Label>
			<RunColumn
				x={4}
				y={30}
				width={layout.colW}
				run={MONDAY}
				state={state}
				changed={state.tuesday}
				locale={locale}
			/>
			<m.g
				initial={false}
				animate={{ opacity: state.tuesday ? 1 : 0 }}
				transition={motion.fade}
			>
				<RunColumn
					x={layout.tuesdayX}
					y={layout.tuesdayY}
					width={layout.colW}
					run={TUESDAY}
					state={state}
					changed
					locale={locale}
				/>
			</m.g>
		</g>
	);
}

function ContentView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ContentState;
	explore: ContentState | null;
	setExplore: (next: ContentState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] = shown.tuesday
		? [
				{
					id: "bottom",
					label: t(["Bottom line", "核心结论"]),
					value: t(["Changed", "变了"]),
					note: t([
						`${MONDAY.passed.length} contracts on Monday, ${TUESDAY.passed.length} on Tuesday`,
						`周一 ${MONDAY.passed.length} 份，周二 ${TUESDAY.passed.length} 份`,
					]),
					evidence: "observed",
				},
				{
					id: "takeaways",
					label: t(["Takeaways", "要点"]),
					value: t(["Word for word the same", "一字不差"]),
					note: t(["written into the recipe", "写在 Recipe 里"]),
				},
			]
		: [
				{
					id: "monday",
					label: t(["Monday's run", "周一的运行"]),
					value: t([
						`${MONDAY.passed.length} contracts flagged`,
						`入选 ${MONDAY.passed.length} 份合约`,
					]),
					note: t([
						`across ${MONDAY.names} names`,
						`分布在 ${MONDAY.names} 个标的`,
					]),
					evidence: "observed",
				},
			];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The screener's Bottom line and Takeaways cells for Monday's run and Tuesday's run: the Bottom line changes with the session while the Takeaways read the same",
						"筛选器周一和周二两次运行的核心结论与要点单元格：核心结论随交易时段变化，要点则一字不变",
					])}
					height={(width) => contentLayout(width, locale).height}
				>
					{(width) => (
						<ContentStage width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Show", "显示"])}
						value={explore.tuesday ? "both" : "monday"}
						options={[
							["monday", t(["Monday", "周一"])],
							["both", t(["Monday and Tuesday", "周一与周二"])],
						]}
						onChange={(value) =>
							setExplore({ tuesday: value === "both", tags: true })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A report mixes two kinds of text. Live-data text is computed for the represented session and changes when the session or an input changes. Recipe content was written into the recipe once, to explain the method and its limits; it reads the same on every run and is not a finding about any session. Both are useful, but only the first is evidence about the data. The recipe map labels each text cell, so you don't have to guess.",
						"一份报告混有两类文字。实时数据文字是针对所展示的交易时段计算出来的，交易时段或输入一变，它就会变。Recipe 内容则是一次性写进 Recipe 的，用来解释方法及其局限；它在每次运行中都一样，不是关于任何交易时段的发现。两者都有用，但只有前者是关于数据的证据。Recipe 地图会标注每个文字单元格，不必猜测。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: shown rows vs the population ———

type PopulationState = { kpis: boolean; unloaded: boolean; rows: number };

const KPI_H = 52;
const kpiRows = (width: number) => (width < 520 ? 2 : 1);

function populationLayout(width: number, rows: number) {
	const top = 30;
	const kpiBlock = kpiRows(width) * (KPI_H + 8);
	const tableY = top + kpiBlock + 6;
	const tableH = tapeHeight(rows);
	const ghostY = tableY + tableH + 8;
	// Every contract the table doesn't load gets its own ghost row below it.
	const ghosts = Math.max(0, MONDAY.passed.length - rows);
	return { top, tableY, tableH, ghostY, height: ghostY + ghosts * 30 + 26 };
}

function PopulationStage({
	width,
	state,
	locale,
}: {
	width: number;
	state: PopulationState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const narrow = width < 520;
	const layout = populationLayout(width, state.rows);
	const kpis: { id: string; label: Copy; value: string }[] = [
		{
			id: "flagged",
			label: ["Contracts flagged", "入选合约"],
			value: String(MONDAY.passed.length),
		},
		{ id: "names", label: ["Symbols", "标的"], value: String(MONDAY.names) },
		{
			id: "median",
			label: ["Median vol/OI", "成交量/OI 中位数"],
			value: MONDAY.median.toFixed(2),
		},
		{
			id: "highest",
			label: ["Highest vol/OI", "成交量/OI 最高"],
			value: volumeToOi(MONDAY.top).toFixed(2),
		},
	];
	const perRow = narrow ? 2 : 4;
	const kpiW = (width - 8 - (perRow - 1) * 8) / perRow;
	const shownRows = MONDAY.passed.slice(0, state.rows);
	const unloaded = MONDAY.passed.slice(state.rows);
	const columns = narrow
		? [
				{ label: t(["Contract", "合约"]), share: 0.72 },
				{
					label: t(["Vol/OI", "成交量/OI"]),
					share: 0.28,
					align: "end" as const,
				},
			]
		: [
				{ label: t(["Contract", "合约"]), share: 0.46 },
				{ label: t(["Volume", "成交量"]), share: 0.18, align: "end" as const },
				{ label: t(["OI", "未平仓量"]), share: 0.18, align: "end" as const },
				{
					label: t(["Vol/OI", "成交量/OI"]),
					share: 0.18,
					align: "end" as const,
				},
			];
	const cells = (row: ScreenContract) =>
		narrow
			? [t(screenContractLabel(row)), volumeToOi(row).toFixed(2)]
			: [
					t(screenContractLabel(row)),
					row.volume.toLocaleString("en-US"),
					row.openInterest.toLocaleString("en-US"),
					volumeToOi(row).toFixed(2),
				];
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t([
					`Screener · ${t(dayLabel(SESSION_DATE))} · defaults`,
					`筛选器 · ${t(dayLabel(SESSION_DATE))} · 默认阈值`,
				])}
			</Label>
			<m.g
				initial={false}
				animate={{ opacity: state.kpis ? 1 : 0 }}
				transition={motion.fade}
			>
				{kpis.map((kpi, i) => {
					const x = 4 + (i % perRow) * (kpiW + 8);
					const y = layout.top + Math.floor(i / perRow) * (KPI_H + 8);
					return (
						<g key={kpi.id}>
							<rect
								x={x}
								y={y}
								width={kpiW}
								height={KPI_H}
								rx={9}
								className={
									kpi.id === "flagged" ? "wt-focus-shape" : "wt-panel-shape"
								}
							/>
							<Label x={x + 10} y={y + 18} tone="small">
								{t(kpi.label)}
							</Label>
							<Label x={x + 10} y={y + 40} tone="strong">
								{kpi.value}
							</Label>
						</g>
					);
				})}
			</m.g>
			<TradeTape
				x={4}
				y={layout.tableY}
				width={width - 8}
				title={t([
					`Top ${state.rows} by volume/OI`,
					`成交量/OI 前 ${state.rows} 名`,
				])}
				columns={columns}
				rows={shownRows.map((row) => ({ key: row.id, cells: cells(row) }))}
				maxRows={state.rows}
				empty=""
			/>
			<m.g
				initial={false}
				animate={{ opacity: state.unloaded ? 1 : 0 }}
				transition={motion.fade}
			>
				{unloaded.map((row, i) => (
					<g key={row.id}>
						<rect
							x={4}
							y={layout.ghostY + i * 30}
							width={width - 8}
							height={24}
							rx={6}
							className="wt-panel-shape"
							strokeDasharray="4 3"
						/>
						<Label x={16} y={layout.ghostY + i * 30 + 16} tone="small">
							{t([
								`${t(screenContractLabel(row))} · passed, not loaded`,
								`${t(screenContractLabel(row))} · 已入选，未载入`,
							])}
						</Label>
					</g>
				))}
			</m.g>
		</g>
	);
}

function PopulationView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: PopulationState;
	explore: PopulationState | null;
	setExplore: (next: PopulationState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] = [
		{
			id: "shown",
			label: t(["Rows in the table", "表格中的行"]),
			value: String(shown.rows),
			evidence: "observed",
		},
	];
	if (shown.kpis)
		result.push({
			id: "population",
			label: t(["Passed the screen", "通过筛选"]),
			value: String(MONDAY.passed.length),
			note: t(["the key figures count every match", "关键数字统计了全部匹配"]),
			evidence: "observed",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The screener's key figures, its top-N table, and the matching contracts that passed but are not loaded into the table",
						"筛选器的关键数字、前 N 名表格，以及已入选但未载入表格的合约",
					])}
					// The tallest of the row counts on offer, so choosing one doesn't resize.
					height={(width) =>
						Math.max(
							...[1, 3, 5].map((rows) => populationLayout(width, rows).height),
						)
					}
				>
					{(width) => (
						<PopulationStage width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Rows the table shows", "表格显示的行数"])}
						value={String(explore.rows) as "1" | "3" | "5"}
						options={[
							["1", "1"],
							["3", "3"],
							["5", "5"],
						]}
						onChange={(value) =>
							setExplore({ kpis: true, unloaded: true, rows: Number(value) })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A screen's key figures count every contract that passed, while its table loads only the top rows by the ranking metric. TradingFlow's unusual-activity screener says so in its own words: the table shows the highest matches out of all that passed, and the rest are not loaded into the report. A claim about \"the unusual contracts\" has to use the count; a claim about one row needs that row. To narrow the population, raise the thresholds and run again; to check one contract's prints, open it in Option Trades.",
						"筛选的关键数字统计所有通过的合约，而表格只载入按排名指标排在前面的行。TradingFlow 的异常成交筛选器自己就是这么说的：表格展示的是所有通过者中最高的那些，其余的没有载入报告。关于“异常合约”的说法必须用总数；关于某一行的说法则需要那一行。要缩小总体，就提高阈值后重新运行；要核查某份合约的成交记录，就去 Option Trades 打开它。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<MapState, MapState>({
		id: "trace",
		label: ["Trace a sentence", "追溯一句话"],
		title: [
			"Every live sentence traces back to inputs and data",
			"每句实时文字都能追溯到输入和数据",
		],
		predict: {
			prompt: [
				`The Bottom line reads: "${pick(bottomLine(MONDAY), "en")}" What does that sentence depend on?`,
				`核心结论写着：“${pick(bottomLine(MONDAY), "zh")}”这句话取决于什么？`,
			],
			choices: [
				{
					id: "inputs",
					label: [
						"The session and all five thresholds",
						"交易时段和全部五个阈值",
					],
				},
				{
					id: "nothing",
					label: ["Nothing: it's written text", "什么也不取决：它是写好的文字"],
				},
				{ id: "table", label: ["Only the table's rows", "只取决于表格中的行"] },
			],
			answer: "inputs",
			revealAt: 1,
			explain: [
				"The recipe map shows the Bottom line fed by Live data 1, which runs with the session and every threshold. Change any of them and the sentence changes.",
				"Recipe 地图显示核心结论由实时数据 1 提供，而实时数据 1 用交易时段和每个阈值运行。改动其中任何一个，这句话就会变。",
			],
		},
		beats: [
			{
				id: "map",
				label: ["The map", "地图"],
				caption: [
					"The recipe map lays the report out as inputs on the left, live-data queries in the middle, and the visible cells on the right.",
					"Recipe 地图把报告摊开：左边是输入，中间是实时数据查询，右边是可见的单元格。",
				],
				state: { cell: null },
			},
			{
				id: "bottom",
				label: ["Bottom line", "核心结论"],
				caption: [
					"Trace the Bottom line: it comes from Live data 1, which runs on the represented session with all five thresholds.",
					"追溯核心结论：它来自实时数据 1，而实时数据 1 用所展示的交易时段和全部五个阈值运行。",
				],
				state: { cell: "bottom" },
			},
			{
				id: "takeaways",
				label: ["Takeaways", "要点"],
				caption: [
					"The Takeaways cell has no line in at all: it's recipe content, written once and run by no query.",
					"要点单元格没有任何连线：它是 Recipe 内容，只写一次，不运行任何查询。",
				],
				state: { cell: "takeaways" },
			},
		],
		explore: {
			prompt: ["Trace any cell.", "追溯任意一个单元格。"],
			start: () => ({ cell: "table" }),
			task: {
				kind: "reach",
				prompt: [
					"Find the cell that no live query feeds.",
					"找出没有任何实时查询为其提供数据的单元格。",
				],
				reached: (e) => e.cell === "takeaways",
				done: [
					"The Takeaways have no line in: they're recipe content, written once and the same every session. Read them as method, not as findings about the data.",
					"要点没有任何输入线：它是 Recipe 内容，写一次，每个时段都一样。要把它当作方法来读，而不是关于数据的发现。",
				],
			},
		},
		View: MapView,
	}),
	defineScene<ContentState, ContentState>({
		id: "content",
		label: ["Written vs computed", "写好的与算出的"],
		title: [
			"Recipe content reads the same every session",
			"Recipe 内容在每个交易时段都一样",
		],
		predict: {
			prompt: [
				`Monday's Takeaways say: "${pick(TAKEAWAYS, "en")}" Is that a finding about Monday's data?`,
				`周一的要点写着：“${pick(TAKEAWAYS, "zh")}”这是关于周一数据的发现吗？`,
			],
			choices: [
				{
					id: "content",
					label: [
						"No: it's written into the recipe",
						"不是：它是写在 Recipe 里的",
					],
				},
				{
					id: "ai",
					label: ["Yes: written from Monday's rows", "是：根据周一的行写出的"],
				},
				{
					id: "top",
					label: ["Yes: it describes the top row", "是：它描述的是第一行"],
				},
			],
			answer: "content",
			revealAt: 1,
			explain: [
				"Put Tuesday's run beside Monday's: the Bottom line changes with the session, and the Takeaways don't change by a word.",
				"把周二的运行放在周一旁边：核心结论随交易时段变化，要点则一个字都没变。",
			],
		},
		beats: [
			{
				id: "monday",
				label: ["Monday", "周一"],
				caption: [
					"Monday's run has two text cells: a Bottom line and the Takeaways.",
					"周一的运行有两个文字单元格：核心结论和要点。",
				],
				state: { tuesday: false, tags: false },
			},
			{
				id: "tuesday",
				label: ["Tuesday", "周二"],
				caption: [
					`Run it for Tuesday: the Bottom line now counts ${TUESDAY.passed.length} contracts, and the Takeaways are word for word the same.`,
					`针对周二运行：核心结论现在统计的是 ${TUESDAY.passed.length} 份合约，要点则一字不差。`,
				],
				state: { tuesday: true, tags: false },
			},
			{
				id: "tags",
				label: ["Labels", "标注"],
				caption: [
					"The recipe map says which is which: the Bottom line is live data, the Takeaways are recipe content. Cite the first as evidence; read the second as method.",
					"Recipe 地图会标明谁是谁：核心结论是实时数据，要点是 Recipe 内容。前者可以当证据引用，后者要当方法来读。",
				],
				state: { tuesday: true, tags: true },
			},
		],
		explore: {
			prompt: ["Compare the two runs.", "比较两次运行。"],
			start: () => ({ tuesday: true, tags: true }),
			task: {
				kind: "answer",
				prompt: [
					"Which text is evidence about Tuesday's session?",
					"哪段文字是关于周二交易时段的证据？",
				],
				choices: [
					{ id: "bottom", label: ["Tuesday's Bottom line", "周二的核心结论"] },
					{ id: "takeaways", label: ["Tuesday's Takeaways", "周二的要点"] },
					{ id: "both", label: ["Both", "两者都是"] },
				],
				answer: "bottom",
				done: [
					"The Bottom line is computed from Tuesday's rows and changed with the session. The Takeaways read word for word the same on both days: they're written into the recipe.",
					"核心结论根据周二的数据计算，随时段而变。要点在两天里一字不差：它们是写进 Recipe 里的。",
				],
			},
		},
		View: ContentView,
	}),
	defineScene<PopulationState, PopulationState>({
		id: "population",
		label: ["Shown vs passed", "展示的与通过的"],
		title: [
			"A top-N table isn't the whole screen",
			"前 N 名表格不是整个筛选结果",
		],
		predict: {
			prompt: [
				"The screener's table shows three contracts. How many passed the screen?",
				"筛选器的表格显示了三份合约。有多少份通过了筛选？",
			],
			choices: [
				{
					id: "five",
					label: [
						"Five: the key figures count them",
						"五份：关键数字统计了它们",
					],
				},
				{
					id: "three",
					label: ["Three: the table shows them all", "三份：表格显示了全部"],
				},
				{ id: "unknown", label: ["The report can't say", "报告无法说明"] },
			],
			answer: "five",
			entry: { answer: 5, unit: [" contracts", " 张"] },
			revealAt: 1,
			explain: [
				"The key figures count every match: five contracts across three names. The table loads only the top three by volume/OI.",
				"关键数字统计了所有匹配：三个标的共五份合约。表格只载入了成交量/OI 前三名。",
			],
		},
		beats: [
			{
				id: "table",
				label: ["Table", "表格"],
				caption: [
					"The screener's table lists the top three contracts by volume/OI for Monday.",
					"筛选器的表格列出了周一成交量/OI 前三名的合约。",
				],
				state: { kpis: false, unloaded: false, rows: 3 },
			},
			{
				id: "count",
				label: ["Key figures", "关键数字"],
				caption: [
					`The key figures count ${MONDAY.passed.length} contracts flagged across ${MONDAY.names} names. The table is a subset of them.`,
					`关键数字统计了 ${MONDAY.names} 个标的共 ${MONDAY.passed.length} 份入选合约。表格只是其中的一部分。`,
				],
				state: { kpis: true, unloaded: false, rows: 3 },
			},
			{
				id: "rest",
				label: ["The rest", "其余"],
				caption: [
					"The other two passed but aren't loaded into the report. Raise the thresholds to narrow the screen, and open a contract in Option Trades before claiming anything about its prints.",
					"另外两份也通过了，只是没有载入报告。要缩小筛选范围就提高阈值；在对某份合约的成交下结论之前，先到 Option Trades 打开它。",
				],
				state: { kpis: true, unloaded: true, rows: 3 },
			},
		],
		explore: {
			prompt: ["Change how many rows the table loads.", "改变表格载入的行数。"],
			start: () => ({ kpis: true, unloaded: true, rows: 1 }),
			task: {
				kind: "reach",
				prompt: [
					"Make the table show every contract that passed the screen.",
					"让表格显示所有通过筛选的合约。",
				],
				reached: (e) => e.rows === MONDAY.passed.length,
				done: [
					"Now the table holds all five matches the key figures count. With fewer rows it's a top-N subset; check the key figures before saying how many passed.",
					"现在表格包含关键数字统计的全部五个结果。行数更少时它只是前 N 名子集；在说有多少通过之前先看关键数字。",
				],
			},
		},
		View: PopulationView,
	}),
] as const;

export function RecipeMapWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="recipe-map"
			label={["Interactive lesson on reading a recipe", "解读 Recipe 互动课"]}
			scenes={scenes}
		/>
	);
}
