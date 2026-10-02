import * as m from "motion/react-m";
import {
	type Copy,
	count,
	dayLabel,
	pick,
	type SymbolFlowRow,
	symbolFlowSessions,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import {
	RankBump,
	type RankColumn,
	type RankItem,
	rankBumpHeight,
} from "../walkthrough/instruments/rank-bump";
import {
	type TapeRow,
	TradeTape,
	tapeHeight,
} from "../walkthrough/instruments/trade-tape";
import { Label, Stage, useTeachMotion } from "../walkthrough/stage";
import { textWidth, wrapText } from "../walkthrough/text-measure";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

const MONDAY = symbolFlowSessions.monday.rows;
const rowOf = (rows: readonly SymbolFlowRow[], symbol: string) => {
	const row = rows.find((item) => item.symbol === symbol);
	if (!row) throw new Error(`Unknown symbol ${symbol}`);
	return row;
};
const ALFA = rowOf(MONDAY, "ALFA");
const GLYN = rowOf(MONDAY, "GLYN");

/** Whole dollars: "$6,458". */
const dollars = (value: number) => usd(Math.round(value * 100), 0);
/** "$1.18M", "$310K". */
const compact = (value: number) =>
	value >= 1_000_000
		? `$${(value / 1_000_000).toFixed(2)}M`
		: `$${Math.round(value / 1_000)}K`;
/** "1 trade", "3 trades". */
const trades = (value: number) =>
	`${count(value)} ${value === 1 ? "trade" : "trades"}`;
const perTrade = (row: SymbolFlowRow) => row.totalPremium / row.trades;
const byDesc = <T,>(rows: readonly T[], score: (row: T) => number) =>
	[...rows].sort((a, b) => score(b) - score(a));

// ——— Scene 1: units decide what a formula can say ———

type FormulaId = "sum" | "perTrade" | "share";
type FormatId = "number" | "percent" | "currency";
type Unit = "usd" | "count" | "ratio";
type UnitState = { formula: FormulaId; format: FormatId; reveal: boolean };

const FORMULAS: Record<
	FormulaId,
	{
		name: Copy;
		tokens: readonly { text: string; unit?: Unit }[];
		/** The output unit the live preview names, or null when the editor refuses the formula. */
		output: Unit | null;
		value: (row: SymbolFlowRow) => number;
	}
> = {
	sum: {
		name: ["Premium plus trades", "权利金加笔数"],
		tokens: [
			{ text: "[Total Premium]", unit: "usd" },
			{ text: " + " },
			{ text: "[Trades]", unit: "count" },
		],
		output: null,
		value: (row) => row.totalPremium + row.trades,
	},
	perTrade: {
		name: ["Premium per trade", "每笔权利金"],
		tokens: [
			{ text: "[Total Premium]", unit: "usd" },
			{ text: " / " },
			{ text: "[Trades]", unit: "count" },
		],
		output: "usd",
		value: perTrade,
	},
	share: {
		name: ["Call share", "看涨占比"],
		tokens: [
			{ text: "[Call Premium]", unit: "usd" },
			{ text: " / " },
			{ text: "[Total Premium]", unit: "usd" },
		],
		output: "ratio",
		value: (row) => row.callPremium / row.totalPremium,
	},
};

const FORMATS: Record<FormatId, Copy> = {
	number: ["Number", "数字"],
	percent: ["Percent", "百分比"],
	currency: ["Currency", "货币"],
};
const FORMAT_IDS = Object.keys(FORMATS) as FormatId[];

/** The value as the live preview prints it: Percent scales a ratio and only appends % to dollars. */
function previewValue(value: number, unit: Unit, format: FormatId) {
	const plain = (v: number) =>
		v.toLocaleString("en-US", { maximumFractionDigits: 4 });
	if (format === "currency") return usd(Math.round(value * 100));
	if (format === "percent")
		return `${plain(unit === "ratio" ? value * 100 : value)}%`;
	return plain(value);
}

const REFUSED = "Cannot add usd and count.";
const CURRENCY_WARNING = "Currency format requires a USD or price formula.";

const PAD = 16;
/** The editor sits flush in the stage so the longest formula fits a phone-width box. */
const EDITOR_PAD = 14;
const UNIT_H = 290;

function UnitStage({
	width,
	state,
	locale,
}: {
	width: number;
	state: UnitState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const def = FORMULAS[state.formula];
	const inner = width - 2 * EDITOR_PAD;
	const nameLabel = t(["Column name", "列名"]);
	const textX = EDITOR_PAD + 4;
	const tokens = def.tokens.map((token, i) => {
		const before = def.tokens
			.slice(0, i)
			.map((item) => item.text)
			.join("");
		return {
			...token,
			start: textX + textWidth(before, 13),
			w: textWidth(token.text, 13),
		};
	});
	const output = def.output;
	const warning =
		state.reveal && output === "ratio" && state.format === "currency"
			? wrapText(CURRENCY_WARNING, inner, 11)
			: [];
	const preview = !state.reveal
		? ["ALFA: …"]
		: output === null
			? [REFUSED]
			: wrapText(
					`ALFA: ${previewValue(def.value(ALFA), output, state.format)} · output unit ${output}`,
					inner,
					13,
				);
	let chipX = EDITOR_PAD;
	const chips = FORMAT_IDS.map((id) => {
		const label = t(FORMATS[id]);
		const w = textWidth(label, 12) + 20;
		const chip = { id, label, x: chipX, w };
		chipX += w + 8;
		return chip;
	});
	return (
		<g>
			<rect
				x={2}
				y={4}
				width={width - 4}
				height={UNIT_H - 8}
				rx={12}
				className="wt-panel-shape"
			/>
			<Label x={EDITOR_PAD} y={30} tone="muted">
				{nameLabel}
			</Label>
			<Label x={EDITOR_PAD + textWidth(nameLabel, 12) + 12} y={30}>
				{t(def.name)}
			</Label>
			<Label x={EDITOR_PAD} y={56} tone="muted">
				{t(["Formula", "公式"])}
			</Label>
			<rect
				x={EDITOR_PAD - 4}
				y={64}
				width={inner + 8}
				height={34}
				rx={8}
				className="wt-panel-shape"
			/>
			<m.g
				key={state.formula}
				initial={motion.enabled ? { opacity: 0 } : false}
				animate={{ opacity: 1 }}
				transition={motion.fade}
			>
				<Label x={textX} y={86} className="wt-code">
					{def.tokens.map((token) => token.text).join("")}
				</Label>
				<m.g
					initial={false}
					animate={{ opacity: state.reveal ? 1 : 0 }}
					transition={motion.fade}
				>
					{tokens.map((token) =>
						token.unit ? (
							<g key={`${token.text}-${token.start}`}>
								<path
									d={`M${token.start + 2} 106H${token.start + token.w - 2}`}
									className="wt-axis"
								/>
								<Label
									x={token.start + token.w / 2}
									y={121}
									anchor="middle"
									tone="small"
								>
									{token.unit}
								</Label>
							</g>
						) : null,
					)}
				</m.g>
			</m.g>
			<Label x={EDITOR_PAD} y={146} tone="muted">
				{t(["Value format", "数值格式"])}
			</Label>
			{chips.map((chip) => {
				const on = chip.id === state.format;
				return (
					<g key={chip.id}>
						<rect
							x={chip.x}
							y={154}
							width={chip.w}
							height={26}
							rx={13}
							className={on ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						<Label
							x={chip.x + chip.w / 2}
							y={171}
							anchor="middle"
							tone="muted"
							className={on ? "wt-accent" : undefined}
						>
							{chip.label}
						</Label>
					</g>
				);
			})}
			{warning.map((line, i) => (
				<Label
					key={line}
					x={EDITOR_PAD}
					y={200 + i * 15}
					tone="small"
					className="wt-loss"
				>
					{line}
				</Label>
			))}
			<Label x={EDITOR_PAD} y={242} tone="muted">
				{t(["Σ Live preview", "Σ 实时预览"])}
			</Label>
			<m.g
				key={`${state.formula}-${state.format}-${state.reveal}`}
				initial={motion.enabled ? { opacity: 0 } : false}
				animate={{ opacity: 1 }}
				transition={motion.fade}
			>
				{preview.map((line, i) => (
					<Label
						key={line}
						x={EDITOR_PAD}
						y={262 + i * 17}
						tone={state.reveal ? undefined : "muted"}
						className={state.reveal && output === null ? "wt-loss" : undefined}
					>
						{line}
					</Label>
				))}
			</m.g>
		</g>
	);
}

function formatNote(
	state: UnitState,
	locale: Locale,
): { text: string; loss?: boolean } {
	const t = tr(locale);
	const output = FORMULAS[state.formula].output;
	if (!state.reveal || output === null)
		return { text: t(["nothing to format yet", "还没有可格式化的值"]) };
	if (output === "usd") {
		if (state.format === "currency")
			return { text: t(["matches usd", "与 usd 相符"]) };
		if (state.format === "percent")
			return {
				text: t(["not checked: dollars with a %", "不检查：美元带上 % 号"]),
				loss: true,
			};
		return { text: t(["a plain number", "普通数字"]) };
	}
	if (state.format === "currency")
		return {
			text: t(["refused for a ratio", "比率不能用货币格式"]),
			loss: true,
		};
	if (state.format === "percent")
		return { text: t(["the ratio × 100", "比率 × 100"]) };
	return { text: t(["a plain ratio", "普通比率"]) };
}

function UnitView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: UnitState;
	explore: UnitState | null;
	setExplore: (next: UnitState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const output = FORMULAS[shown.formula].output;
	const note = formatNote(shown, locale);
	const result: ResultItem[] = [
		{
			id: "unit",
			label: t(["Output unit", "输出单位"]),
			value: !shown.reveal ? "?" : (output ?? t(["Refused", "被拒绝"])),
			note: !shown.reveal
				? t(["not checked yet", "尚未检查"])
				: output === null
					? t(["usd and count can't be added", "usd 与 count 不能相加"])
					: output === "usd"
						? t(["dollars per trade", "每笔交易的美元数"])
						: t(["dollars over dollars", "美元除以美元"]),
			tone: shown.reveal && output === null ? "loss" : undefined,
		},
		{
			id: "format",
			label: t(["Value format", "数值格式"]),
			value: t(FORMATS[shown.format]),
			note: note.text,
			tone: note.loss ? "loss" : undefined,
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A formula column editor on Rank Symbols: each field in the formula carries a unit, the editor refuses to add dollars to a count, and the live preview names the output unit for ALFA's row",
						"Rank Symbols 的公式列编辑器：公式里每个字段都带单位，编辑器拒绝把美元与计数相加，实时预览会写出 ALFA 这一行的输出单位",
					])}
					height={UNIT_H}
				>
					{(width) => <UnitStage width={width} state={shown} locale={locale} />}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<>
						<ChoiceField
							label={t(["Formula", "公式"])}
							value={explore.formula}
							options={[
								["sum", "Premium + Trades"],
								["perTrade", "Premium / Trades"],
								["share", "Call / Total"],
							]}
							onChange={(formula) => setExplore({ ...explore, formula })}
						/>
						<ChoiceField
							label={t(["Value format", "数值格式"])}
							value={explore.format}
							options={FORMAT_IDS.map((id) => [id, t(FORMATS[id])] as const)}
							onChange={(format) => setExplore({ ...explore, format })}
						/>
					</>
				) : null
			}
			details={
				<p>
					{t([
						"Rank Symbols can add up to five formula columns to a Rank View. A formula reads named fields from each symbol's row, such as [Total Premium] or [Trades], with arithmetic, comparisons and nine functions: ABS, IF, AND, ROUND, MIN, MAX, LOG10, SQRT and NA. Every field carries a unit, and the editor checks units as you type: it refuses to add dollars to a count, and the live preview names the output unit of what you wrote. Choose the value format to match that unit. Currency is refused for a ratio, but nothing stops Percent from printing dollars with a % sign, so that match is yours to check.",
						"Rank Symbols 可以给一个 Rank View 添加最多五个公式列。公式读取每个标的那一行里的命名字段，比如 [Total Premium] 或 [Trades]，配合算术、比较和九个函数：ABS、IF、AND、ROUND、MIN、MAX、LOG10、SQRT 和 NA。每个字段都带单位，编辑器在你输入时就检查单位：它拒绝把美元与计数相加，实时预览也会写出你所写公式的输出单位。数值格式要与这个单位相符。比率不能用货币格式，但没有什么会阻止百分比格式给美元加上 % 号，这一点要你自己核对。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: a thin row can lead a ratio ———

type GuardState = { perTrade: boolean; floor: 0 | 20 | 100 };

const guardFormula = (floor: number) =>
	floor > 0
		? `IF([Trades] >= ${floor}, [Total Premium] / [Trades], NA())`
		: "[Total Premium] / [Trades]";
/** Room above the ranking for the longest formula, so the stage keeps one height. */
const guardTop = (width: number) =>
	14 + wrapText(guardFormula(100), width - 16, 12).length * 16;

/** "$1.2M", "$32K", "$6.5K": short enough for two ranking columns on a phone. */
const short = (value: number) =>
	value >= 1_000_000
		? `$${(value / 1_000_000).toFixed(1)}M`
		: value >= 10_000
			? `$${Math.round(value / 1_000)}K`
			: `$${(value / 1_000).toFixed(1)}K`;

function guardColumns(
	state: GuardState,
	locale: Locale,
	narrow: boolean,
): RankColumn[] {
	const t = tr(locale);
	const total: RankItem[] = byDesc(MONDAY, (row) => row.totalPremium).map(
		(row) => ({
			id: row.symbol,
			label: row.symbol,
			value: narrow ? short(row.totalPremium) : compact(row.totalPremium),
		}),
	);
	const columns: RankColumn[] = [
		{ id: "total", title: t(["Total Premium", "总权利金"]), items: total },
	];
	if (!state.perTrade) return columns;
	const kept = MONDAY.filter((row) => row.trades >= state.floor);
	const items: RankItem[] = byDesc(kept, perTrade).map((row) => ({
		id: row.symbol,
		label: row.symbol,
		value: narrow ? short(perTrade(row)) : dollars(perTrade(row)),
		tone: row.symbol === "GLYN" ? "loss" : undefined,
	}));
	for (const row of MONDAY)
		if (row.trades < state.floor)
			items.push({
				id: row.symbol,
				label: row.symbol,
				value: "",
				excluded: "N/A",
			});
	columns.push({
		id: "perTrade",
		title:
			state.floor > 0
				? t([`Per trade, ≥ ${state.floor}`, `每笔，≥ ${state.floor} 笔`])
				: t(["Per trade", "每笔"]),
		items,
	});
	return columns;
}

function GuardView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: GuardState;
	explore: GuardState | null;
	setExplore: (next: GuardState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const kept = MONDAY.filter((row) => row.trades >= shown.floor);
	const leader = shown.perTrade
		? byDesc(kept, perTrade)[0]
		: byDesc(MONDAY, (row) => row.totalPremium)[0];
	const blank = MONDAY.length - kept.length;
	const formula = shown.perTrade
		? guardFormula(shown.floor)
		: "[Total Premium]";
	const result: ResultItem[] = [
		{
			id: "leader",
			label: t(["Leader", "第一名"]),
			value: leader.symbol,
			note: shown.perTrade
				? t([
						`${dollars(perTrade(leader))} a trade · ${trades(leader.trades)}`,
						`每笔 ${dollars(perTrade(leader))} · ${count(leader.trades)} 笔`,
					])
				: t([
						`${compact(leader.totalPremium)} total premium`,
						`总权利金 ${compact(leader.totalPremium)}`,
					]),
			tone: shown.perTrade && leader.symbol === "GLYN" ? "loss" : undefined,
			evidence: "calculated",
		},
		{
			id: "blank",
			label: t(["N/A rows", "N/A 行"]),
			value: String(blank),
			note:
				shown.floor > 0
					? t([
							`fewer than ${shown.floor} trades`,
							`少于 ${shown.floor} 笔交易`,
						])
					: t(["no floor", "无门槛"]),
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Monday's five names ranked by total premium and by premium per trade: GLYN, with three trades, jumps to the top per trade until a 20-trade floor leaves it N/A",
						"周一的五个标的按总权利金和每笔权利金排名：只有三笔交易的 GLYN 在每笔排名中跳到第一，直到 20 笔的门槛让它显示为 N/A",
					])}
					height={(width) => guardTop(width) + rankBumpHeight(MONDAY.length)}
				>
					{(width) => (
						<g>
							{wrapText(formula, width - 16, 12).map((line, i) => (
								<Label
									key={line}
									x={8}
									y={18 + i * 16}
									tone="muted"
									className="wt-code"
								>
									{line}
								</Label>
							))}
							<g transform={`translate(0 ${guardTop(width)})`}>
								<RankBump
									width={width}
									columns={guardColumns(shown, locale, width < 520)}
									focus={shown.perTrade ? "GLYN" : undefined}
								/>
							</g>
						</g>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Trade floor", "交易笔数门槛"])}
						value={String(explore.floor) as "0" | "20" | "100"}
						options={[
							["0", t(["None", "无"])],
							["20", "20"],
							["100", "100"],
						]}
						onChange={(value) =>
							setExplore({
								...explore,
								floor: Number(value) as GuardState["floor"],
							})
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A per-trade average is a ratio, and a ratio is only as steady as its denominator: GLYN's three prints make it Monday's biggest name per trade. IF([Trades] >= 20, [Total Premium] / [Trades], NA()) leaves the column empty where there are too few trades to average, and N/A is a blank, not a zero. The editor also leaves missing inputs and invalid math N/A, such as a call-to-put premium ratio for a name with no put trades. The floor is your choice, and a higher one keeps fewer names. It fixes a small count, not a lopsided one: about a third of ALFA's premium is a single 500-contract block, so look at the trades behind an average before you rank on it.",
						"每笔平均值是一个比率，而比率的稳定程度取决于它的分母：GLYN 的三笔成交让它成了周一每笔金额最大的标的。IF([Trades] >= 20, [Total Premium] / [Trades], NA()) 会在交易笔数太少、不足以求平均的地方留空；N/A 是空白，不是零。缺失的输入和无效的运算，编辑器同样显示为 N/A，比如对没有看跌交易的标的计算看涨/看跌权利金比。门槛由你决定，门槛越高，留下的标的越少。它解决的是笔数太少，而不是分布失衡：ALFA 约三分之一的权利金来自一笔 500 张的大宗交易，所以按平均值排名之前，先看看它背后的交易。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: the view keeps the formula, not the numbers ———

type Session = keyof typeof symbolFlowSessions;
type SaveState = { session: Session; notice: boolean };

const SAVED_FLOOR = 20;
const NOTICE: Copy = [
	"A custom result is descriptive and user-defined, not a canonical TradingFlow metric or forecast.",
	"自定义结果是描述性的、由用户定义的，不是 TradingFlow 的标准指标或预测。",
];

function saveLayout(width: number, locale: Locale) {
	const formula = wrapText(guardFormula(SAVED_FLOOR), width - 40, 12);
	const cardH = 62 + formula.length * 16 + 22;
	const tapeY = cardH + 14;
	const noticeY = tapeY + tapeHeight(MONDAY.length) + 12;
	const notice = wrapText(pick(NOTICE, locale), width - 40, 12);
	return {
		formula,
		cardH,
		tapeY,
		noticeY,
		notice,
		height: noticeY + 30 + notice.length * 16 + 8,
	};
}

function sessionRows(session: Session): TapeRow[] {
	const rows = symbolFlowSessions[session].rows;
	const kept = byDesc(
		rows.filter((row) => row.trades >= SAVED_FLOOR),
		perTrade,
	);
	const blank = rows.filter((row) => row.trades < SAVED_FLOOR);
	return [
		...kept.map((row) => ({
			key: row.symbol,
			cells: [row.symbol, count(row.trades), dollars(perTrade(row))],
		})),
		...blank.map((row) => ({
			key: row.symbol,
			cells: [row.symbol, count(row.trades), "N/A"],
			muted: true,
		})),
	];
}

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
	const layout = saveLayout(width, locale);
	const date = symbolFlowSessions[state.session].date;
	return (
		<g>
			<rect
				x={4}
				y={4}
				width={width - 8}
				height={layout.cardH}
				rx={12}
				className="wt-panel-shape"
			/>
			<Label x={PAD} y={26} tone="muted">
				{t(["Custom columns · 1 of 5 used", "自定义列 · 已用 1/5"])}
			</Label>
			<Label x={PAD} y={48}>
				{t(FORMULAS.perTrade.name)}
			</Label>
			{layout.formula.map((line, i) => (
				<Label
					key={line}
					x={PAD}
					y={68 + i * 16}
					tone="muted"
					className="wt-code"
				>
					{line}
				</Label>
			))}
			<Label
				x={PAD}
				y={68 + layout.formula.length * 16 + 4}
				tone="small"
				className="wt-accent"
			>
				{t([
					"Currency · Value · saved with the view",
					"货币 · 数值 · 随视图保存",
				])}
			</Label>
			<TradeTape
				x={4}
				y={layout.tapeY}
				width={width - 8}
				title={`${t(FORMULAS.perTrade.name)} · ${t(dayLabel(date))}`}
				columns={[
					{ label: t(["Symbol", "标的"]), share: 0.3 },
					{ label: t(["Trades", "笔数"]), share: 0.3, align: "end" },
					{ label: t(["Per trade", "每笔"]), share: 0.4, align: "end" },
				]}
				rows={sessionRows(state.session)}
				maxRows={MONDAY.length}
				empty={t(["No rows", "没有行"])}
			/>
			<m.g
				initial={false}
				animate={{ opacity: state.notice ? 1 : 0 }}
				transition={motion.fade}
			>
				<rect
					x={4}
					y={layout.noticeY}
					width={width - 8}
					height={layout.height - layout.noticeY - 4}
					rx={12}
					className="wt-focus-shape"
				/>
				<Label x={PAD} y={layout.noticeY + 22} tone="small">
					{t(["The editor's notice", "编辑器的提示"])}
				</Label>
				{layout.notice.map((line, i) => (
					<Label
						key={line}
						x={PAD}
						y={layout.noticeY + 42 + i * 16}
						tone="muted"
					>
						{line}
					</Label>
				))}
			</m.g>
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
	const { date, rows } = symbolFlowSessions[shown.session];
	const leader = byDesc(
		rows.filter((row) => row.trades >= SAVED_FLOOR),
		perTrade,
	)[0];
	// What the view keeps is the prediction's answer, so it shows once Tuesday arrives.
	const saved: ResultItem[] =
		shown.session === "tuesday" || phase === "explore"
			? [
					{
						id: "saved",
						label: t(["Saved with the view", "随视图保存"]),
						value: t(["The definition", "定义"]),
						note: t([
							"name, formula, format, display",
							"名称、公式、格式、显示方式",
						]),
					},
				]
			: [];
	const result: ResultItem[] = [
		...saved,
		{
			id: "values",
			label: t(["Values", "值"]),
			value: t(dayLabel(date)),
			note:
				shown.session === "monday"
					? t(["calculated for this session", "按本时段计算"])
					: t(["recomputed by the same formula", "由同一公式重新计算"]),
		},
		{
			id: "leader",
			label: t(["Leader", "第一名"]),
			value: leader.symbol,
			note: t([
				`${dollars(perTrade(leader))} a trade`,
				`每笔 ${dollars(perTrade(leader))}`,
			]),
			evidence: "calculated",
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A Rank View's saved custom column, one of five slots, above its values for the selected session: the definition stays the same while Monday's and Tuesday's values differ",
						"Rank View 中保存的自定义列（五个名额之一）及其在所选交易时段的值：定义保持不变，周一和周二的值各不相同",
					])}
					height={(width) => saveLayout(width, locale).height}
				>
					{(width) => <SaveStage width={width} state={shown} locale={locale} />}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Session", "交易时段"])}
						value={explore.session}
						options={[
							["monday", t(dayLabel(symbolFlowSessions.monday.date))],
							["tuesday", t(dayLabel(symbolFlowSessions.tuesday.date))],
						]}
						onChange={(session) => setExplore({ ...explore, session })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Custom columns belong to the active Rank View, and Saved Views need a paid plan. The view saves each column's definition, the name, formula, value format and display, while the values recompute from the full-chain snapshot of whichever session you open, so a column built on Monday reads Tuesday's data on Tuesday. A view holds up to five custom columns. Ask AI sits next to the formula box; whatever it suggests, read it field by field and check the live preview before you create the column. Whatever the formula, the result is descriptive and defined by you, not a canonical TradingFlow metric or a forecast, so name the column for what it computes.",
						"自定义列属于当前的 Rank View，而保存视图需要付费方案。视图保存每一列的定义，即名称、公式、数值格式和显示方式；值则基于你打开的那个交易时段的全链快照重新计算，所以周一建好的列，到了周二读的是周二的数据。一个视图最多容纳五个自定义列。公式框旁边有 Ask AI；无论它给出什么建议，创建列之前都要逐个字段读一遍，并检查实时预览。不管公式是什么，结果都是描述性的、由你定义的，不是 TradingFlow 的标准指标，也不是预测，所以要按它实际计算的内容给列命名。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<UnitState, UnitState>({
		id: "units",
		label: ["Units", "单位"],
		title: ["Every field carries a unit", "每个字段都带着单位"],
		predict: {
			prompt: [
				"You type [Total Premium] + [Trades] as a new column's formula. What does the editor show for ALFA?",
				"你把 [Total Premium] + [Trades] 输入为新列的公式。编辑器对 ALFA 显示什么？",
			],
			choices: [
				{
					id: "refused",
					label: [
						"An error: it can't add usd and count",
						"报错：不能把 usd 和 count 相加",
					],
				},
				{
					id: "sum",
					label: [
						`${dollars(ALFA.totalPremium + ALFA.trades)}: the two added`,
						`${dollars(ALFA.totalPremium + ALFA.trades)}：两者相加`,
					],
				},
				{
					id: "na",
					label: ["N/A, like any invalid math", "N/A，和任何无效运算一样"],
				},
			],
			answer: "refused",
			revealAt: 1,
			explain: [
				"Total Premium is in dollars and Trades is a count. The editor checks units before it calculates any row, so the sum never gets a value, not even N/A.",
				"Total Premium 的单位是美元，Trades 是计数。编辑器在计算任何一行之前就检查单位，所以这个和根本得不到值，连 N/A 都不是。",
			],
		},
		beats: [
			{
				id: "typed",
				label: ["Typed", "输入"],
				caption: [
					"You start a column on Rank Symbols and type a formula that adds ALFA's total premium to its trade count.",
					"你在 Rank Symbols 上新建一列，输入一个把总权利金与交易笔数相加的公式。",
				],
				state: { formula: "sum", format: "number", reveal: false },
			},
			{
				id: "refused",
				label: ["Refused", "拒绝"],
				caption: [
					'The editor refuses it before calculating anything: "Cannot add usd and count."',
					"编辑器在计算之前就拒绝了它：“Cannot add usd and count.”（不能把 usd 和 count 相加）",
				],
				state: { formula: "sum", format: "number", reveal: true },
			},
			{
				id: "divide",
				label: ["Divide", "相除"],
				caption: [
					`Dividing works: dollars per trade, output unit usd. Currency prints ALFA's row as ${usd(Math.round(perTrade(ALFA) * 100))}.`,
					`相除是可以的：每笔交易的美元数，输出单位 usd。货币格式把 ALFA 这一行显示为 ${usd(Math.round(perTrade(ALFA) * 100))}。`,
				],
				state: { formula: "perTrade", format: "currency", reveal: true },
			},
		],
		explore: {
			prompt: [
				"Pick a formula and a value format.",
				"选择一个公式和一种数值格式。",
			],
			start: () => ({ formula: "share", format: "currency", reveal: true }),
			task: {
				kind: "reach",
				prompt: [
					"Find a formula and a value format the editor accepts as Currency.",
					"找出编辑器接受为“货币”格式的公式和数值格式。",
				],
				reached: (e) => e.formula === "perTrade" && e.format === "currency",
				done: [
					"Premium divided by trades is dollars per trade, unit usd, so Currency fits. A call-to-total share is a ratio, and premium plus trades has no unit at all.",
					"权利金除以笔数是每笔多少美元，单位 usd，所以适合货币格式。看涨占总额的比例是比值，权利金加笔数则根本没有单位。",
				],
			},
		},
		View: UnitView,
	}),
	defineScene<GuardState, GuardState>({
		id: "guard",
		label: ["Thin rows", "单薄的行"],
		title: ["A few trades can lead a ratio", "几笔交易就能领跑一个比率"],
		predict: {
			prompt: [
				"Rank Monday's five names by [Total Premium] / [Trades]. Which one leads?",
				"按 [Total Premium] / [Trades] 给周一的五个标的排名。哪个排第一？",
			],
			choices: [
				{
					id: "glyn",
					label: ["GLYN, the smallest of the five", "GLYN，五个中最小的"],
				},
				{
					id: "crux",
					label: ["CRUX, with the most premium", "CRUX，权利金最多"],
				},
				{
					id: "alfa",
					label: [
						"ALFA, with Monday's 500-contract block",
						"ALFA，周一有一笔 500 张的大宗交易",
					],
				},
			],
			answer: "glyn",
			revealAt: 1,
			explain: [
				`GLYN's ${dollars(GLYN.totalPremium)} went through in ${trades(GLYN.trades)}, ${dollars(perTrade(GLYN))} each. An average over three trades describes those three prints more than the name.`,
				`GLYN 的 ${dollars(GLYN.totalPremium)} 只分 ${GLYN.trades} 笔成交，每笔 ${dollars(perTrade(GLYN))}。三笔交易的平均值，描述的更多是这三笔成交，而不是这个标的。`,
			],
		},
		beats: [
			{
				id: "total",
				label: ["Total premium", "总权利金"],
				caption: [
					"Ranked by total premium, CRUX leads by a wide margin.",
					"按总权利金排名，CRUX 遥遥领先。",
				],
				state: { perTrade: false, floor: 0 },
			},
			{
				id: "per-trade",
				label: ["Per trade", "每笔"],
				caption: [
					`Divide by trades and the order flips: GLYN leads at ${dollars(perTrade(GLYN))} a trade, on just ${trades(GLYN.trades)}.`,
					`除以交易笔数后顺序翻转：GLYN 以每笔 ${dollars(perTrade(GLYN))} 领先，但只有 ${GLYN.trades} 笔交易。`,
				],
				state: { perTrade: true, floor: 0 },
			},
			{
				id: "floor",
				label: ["Floor", "门槛"],
				caption: [
					"IF([Trades] >= 20, …, NA()) leaves GLYN N/A. ALFA leads now, and about a third of its premium is one 500-contract block.",
					"IF([Trades] >= 20, …, NA()) 让 GLYN 显示为 N/A。现在 ALFA 领先，而它约三分之一的权利金来自一笔 500 张的大宗交易。",
				],
				state: { perTrade: true, floor: 20 },
			},
		],
		explore: {
			prompt: ["Set the trade floor.", "设置交易笔数门槛。"],
			start: () => ({ perTrade: true, floor: 100 }),
			task: {
				kind: "reach",
				prompt: [
					"Set the trade floor at which ALFA leads the per-trade column.",
					"设定让 ALFA 在“每笔”列中领先的交易笔数门槛。",
				],
				reached: (e) => e.floor === 20,
				done: [
					"At 20 trades GLYN's three prints are N/A and ALFA leads; at 100 ALFA is out too and CRUX leads. The floor is your choice, so say what it is, and look at the trades behind the leader.",
					"门槛为 20 笔时，GLYN 的三笔成交显示 N/A，ALFA 领先；门槛为 100 时 ALFA 也被排除，CRUX 领先。门槛由你决定，所以要说明它，并查看领先者背后的成交。",
				],
			},
		},
		View: GuardView,
	}),
	defineScene<SaveState, SaveState>({
		id: "save",
		label: ["Save", "保存"],
		title: [
			"The view keeps the formula, not the numbers",
			"视图保存公式，而不是数字",
		],
		predict: {
			prompt: [
				"You create the column with its 20-trade floor in your Rank View on Monday. On Tuesday you open the same view. What's in the column?",
				"周一你在自己的 Rank View 中创建了这个带 20 笔门槛的列。周二你打开同一个视图。这一列里是什么？",
			],
			choices: [
				{
					id: "recompute",
					label: [
						"Tuesday's values, from the saved formula",
						"周二的值，由保存的公式算出",
					],
				},
				{
					id: "monday",
					label: [
						"Monday's values, saved with the view",
						"周一的值，随视图保存",
					],
				},
				{
					id: "empty",
					label: ["Nothing until you rebuild it", "什么都没有，直到你重建它"],
				},
			],
			answer: "recompute",
			revealAt: 1,
			explain: [
				"The view saves the column's definition, not its values. Each session the formula recomputes from that session's full-chain snapshot.",
				"视图保存的是列的定义，而不是它的值。每个交易时段，公式都会基于该时段的全链快照重新计算。",
			],
		},
		beats: [
			{
				id: "monday",
				label: ["Monday", "周一"],
				caption: [
					"On Monday you create the column. The view stores its definition: name, formula, format and display. One of five custom-column slots is used.",
					"周一你创建了这一列。视图存下它的定义：名称、公式、格式和显示方式。五个自定义列名额用掉一个。",
				],
				state: { session: "monday", notice: false },
			},
			{
				id: "tuesday",
				label: ["Tuesday", "周二"],
				caption: [
					"On Tuesday the same definition recomputes from Tuesday's snapshot. DUNE leads now, and none of Monday's values were kept.",
					"周二，同一个定义基于周二的快照重新计算。现在 DUNE 领先，周一的值一个也没有保留。",
				],
				state: { session: "tuesday", notice: false },
			},
			{
				id: "notice",
				label: ["What it is", "它是什么"],
				caption: [
					"The editor's notice says what the column is: descriptive and defined by you, not a TradingFlow metric or a forecast.",
					"编辑器的提示说明了这一列是什么：描述性的、由你定义的，不是 TradingFlow 的指标，也不是预测。",
				],
				state: { session: "tuesday", notice: true },
			},
		],
		explore: {
			prompt: ["Switch the session.", "切换交易时段。"],
			start: () => ({ session: "monday", notice: true }),
			task: {
				kind: "answer",
				prompt: [
					"On Tuesday, which name leads the saved column?",
					"周二时，保存的列中哪个标的领先？",
				],
				choices: [
					{ id: "dune", label: ["DUNE", "DUNE"] },
					{ id: "alfa", label: ["ALFA, as on Monday", "ALFA，与周一相同"] },
					{ id: "crux", label: ["CRUX", "CRUX"] },
				],
				answer: "dune",
				done: [
					"The view saved the formula, not Monday's numbers, so Tuesday's snapshot is recomputed and DUNE leads. The column describes each session; it isn't a TradingFlow metric or a forecast.",
					"视图保存的是公式，而不是周一的数字，所以会用周二的快照重新计算，DUNE 领先。这一列描述的是每个时段，不是 TradingFlow 的指标，也不是预测。",
				],
			},
		},
		View: SaveView,
	}),
] as const;

export function CustomFormulasWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="custom-formulas"
			label={["Interactive lesson on formula columns", "公式列互动课"]}
			scenes={scenes}
		/>
	);
}
