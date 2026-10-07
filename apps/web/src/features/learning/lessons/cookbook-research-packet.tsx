import * as m from "motion/react-m";
import {
	type Copy,
	count,
	mondayPacket,
	type PacketRow,
	packetContracts,
	pick,
	rowPremium,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import { Player } from "../walkthrough/player";
import { Label, Stage, useStage, useTeachMotion } from "../walkthrough/stage";
import { textWidth, wrapText } from "../walkthrough/text-measure";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame } from "../walkthrough/walkthrough";
import { researchPacketFilm } from "./cookbook-research-packet-film";
import {
	COVERED,
	dollars,
	fields,
	MONDAY,
	type Removed,
	records,
	reruns,
	rerunText,
	rowById,
	SERIES,
	series,
	TUESDAY,
	WITHOUT_SPREAD,
} from "./cookbook-research-packet-model";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

/** A small hatched cell for a value the source never sent. */
function Unknown({ x, y, width }: { x: number; y: number; width: number }) {
	const { hatch } = useStage();
	return (
		<g>
			<rect
				x={x}
				y={y}
				width={width}
				height={20}
				rx={5}
				className="wt-panel-shape"
				style={{ fill: hatch }}
			/>
			<Label
				x={x + width / 2}
				y={y + 14}
				anchor="middle"
				tone="accent"
				className="wt-halo"
			>
				?
			</Label>
		</g>
	);
}

// ——— Scene 1: trace the rows into the subtotal ———

type Work = "formula" | "trace" | "sum" | "coverage";
type TraceState = { reveal: 0 | 1 | 2 | 3; work: Work; row: string | null };
type TraceExplore = { row: string };

/** `lead` is a trade time, drawn in its own column. */
type WorkLine = { text: string; lead?: string; tone?: "accent" | "small" };

const TABLE_TOP = 48;
const TABLE_ROW = 30;
const TABLE_BOTTOM = TABLE_TOP + mondayPacket.length * TABLE_ROW;
const WORK_TOP = TABLE_BOTTOM + 38;
const WORK_LINE = 18;
/** Room for the busiest trace: a heading, four trades and the row total. */
const WORK_LINES = 6;
const traceHeight = WORK_TOP + 20 + WORK_LINES * WORK_LINE;

function traceLines(row: PacketRow, locale: Locale): WorkLine[] {
	const t = tr(locale);
	const head: WorkLine = {
		text: `${row.id} · ${t(series(row))}`,
		tone: "accent",
	};
	if (row.trades === null)
		return [
			head,
			{ text: t(["no data at the cutoff", "截止时没有数据"]) },
			{
				text: t([
					"its Monday trades arrive Tue 09:00",
					"它的周一成交在周二 09:00 才到",
				]),
				tone: "small",
			},
		];
	if (row.trades.length === 0)
		return [
			head,
			{ text: t(["no trades: 0 contracts, $0", "无成交：0 张，$0"]) },
			{
				text: t(["an observed zero, not a gap", "这是观测到的零，不是缺口"]),
				tone: "small",
			},
		];
	return [
		head,
		...row.trades.map((trade) => ({
			lead: trade.time,
			text: `${trade.quantity} × ${usd(trade.price)} × 100 = ${dollars(
				trade.price * trade.quantity * 100,
			)}`,
		})),
		{ text: `= ${dollars(rowPremium(row) ?? 0)}`, tone: "accent" },
	];
}

function workLines(state: TraceState, locale: Locale): WorkLine[] {
	const t = tr(locale);
	const focus = state.row ? rowById(state.row) : undefined;
	if (state.work === "trace" && focus) return traceLines(focus, locale);
	if (state.work === "sum")
		return [
			{ text: "R1 + R2 + R3 + R4", tone: "accent" },
			{
				text: `= ${mondayPacket
					.filter((row) => row.trades !== null)
					.map((row) => dollars(rowPremium(row) ?? 0))
					.join(" + ")}`,
			},
			{ text: `= ${dollars(MONDAY)}`, tone: "accent" },
		];
	if (state.work === "coverage")
		return [
			{
				text: t(["R5 · 120 call: no data yet", "R5 · 120 看涨：尚无数据"]),
				tone: "accent",
			},
			{
				text: t([
					`${dollars(MONDAY)} covers ${COVERED} of ${SERIES} series`,
					`${dollars(MONDAY)} 覆盖 ${SERIES} 个序列中的 ${COVERED} 个`,
				]),
			},
			{
				text: t([
					`chain total: at least ${dollars(MONDAY)}`,
					`全链合计：至少 ${dollars(MONDAY)}`,
				]),
			},
		];
	return [
		{
			text: t([
				"premium = price × contracts × 100",
				"权利金 = 价格 × 张数 × 100",
			]),
			tone: "accent",
		},
		{
			text: t([
				"price per share; 100 shares per contract",
				"价格按每股计；每张合约 100 股",
			]),
			tone: "small",
		},
		{
			text: t([
				"source: corrected tape as of Mon 16:05",
				"来源：截至周一 16:05 的更正后成交记录",
			]),
			tone: "small",
		},
	];
}

function PacketTable({
	width,
	state,
	locale,
}: {
	width: number;
	state: TraceState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const contractsX = width < 520 ? 190 : width - 160;
	const premiumX = width - 12;
	const lines = workLines(state, locale);
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t([
					"Packet P1 · ALFA Oct 18 calls · Monday",
					"研究包 P1 · ALFA 10月18日 看涨 · 周一",
				])}
			</Label>
			<Label x={12} y={40} tone="small">
				{t(["row", "行"])}
			</Label>
			<Label x={48} y={40} tone="small">
				{t(["series", "序列"])}
			</Label>
			<Label x={contractsX} y={40} anchor="end" tone="small">
				{t(["contracts", "张数"])}
			</Label>
			<Label x={premiumX} y={40} anchor="end" tone="small">
				{t(["premium", "权利金"])}
			</Label>
			{mondayPacket.map((row, i) => {
				const y = TABLE_TOP + i * TABLE_ROW;
				const focus = row.id === state.row;
				const premium = rowPremium(row);
				return (
					<g key={row.id}>
						<rect
							x={4}
							y={y}
							width={width - 8}
							height={TABLE_ROW - 4}
							rx={7}
							className={focus ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						<Label x={12} y={y + 18} tone={focus ? "accent" : "muted"}>
							{row.id}
						</Label>
						<Label x={48} y={y + 18}>
							{t(series(row))}
						</Label>
						{row.trades === null ? (
							<Unknown x={contractsX - 40} y={y + 3} width={40} />
						) : (
							<Label x={contractsX} y={y + 18} anchor="end">
								{count(
									row.trades.reduce((sum, trade) => sum + trade.quantity, 0),
								)}
							</Label>
						)}
						{state.reveal < 1 ? (
							<Label x={premiumX} y={y + 18} anchor="end" tone="small">
								—
							</Label>
						) : premium === null ? (
							<Unknown x={premiumX - 64} y={y + 3} width={64} />
						) : (
							<m.text
								x={premiumX}
								y={y + 18}
								textAnchor="end"
								initial={motion.enabled ? { opacity: 0 } : false}
								animate={{ opacity: 1 }}
								transition={motion.after(0.05 * i)}
							>
								{dollars(premium)}
							</m.text>
						)}
					</g>
				);
			})}
			<m.g
				initial={false}
				animate={{ opacity: state.reveal >= 2 ? 1 : 0 }}
				transition={motion.fade}
			>
				<path d={`M12 ${TABLE_BOTTOM + 2}H${width - 12}`} className="wt-axis" />
				<Label
					x={12}
					y={TABLE_BOTTOM + 24}
					tone={state.reveal >= 3 ? "accent" : "muted"}
				>
					{state.reveal >= 3
						? t([
								// A phone leaves room beside the total for the short form only.
								width < 520
									? `subtotal, ${COVERED} of ${SERIES}`
									: `subtotal · ${COVERED} of ${SERIES} series`,
								`小计 · ${SERIES} 个序列中的 ${COVERED} 个`,
							])
						: t(["sum of R1–R4", "R1–R4 合计"])}
				</Label>
				<Label x={premiumX} y={TABLE_BOTTOM + 25} anchor="end" tone="strong">
					{dollars(MONDAY)}
				</Label>
			</m.g>
			<rect
				x={4}
				y={WORK_TOP}
				width={width - 8}
				height={traceHeight - WORK_TOP - 4}
				rx={10}
				className="wt-panel-shape"
			/>
			<m.g
				key={`${state.work}-${state.row}`}
				initial={motion.enabled ? { opacity: 0 } : false}
				animate={{ opacity: 1 }}
				transition={motion.fade}
			>
				{lines.map((line, i) => (
					<g key={line.text}>
						{line.lead ? (
							<Label x={16} y={WORK_TOP + 22 + i * WORK_LINE} tone="small">
								{line.lead}
							</Label>
						) : null}
						<Label
							x={line.lead ? 64 : 16}
							y={WORK_TOP + 22 + i * WORK_LINE}
							tone={line.tone}
						>
							{line.text}
						</Label>
					</g>
				))}
			</m.g>
		</g>
	);
}

function TraceView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: TraceState;
	explore: TraceExplore | null;
	setExplore: (next: TraceExplore) => void;
}) {
	const t = tr(locale);
	const shown: TraceState =
		phase === "explore" && explore
			? { reveal: 3, work: "trace", row: explore.row }
			: state;
	const focus = shown.row ? rowById(shown.row) : undefined;
	const result: ResultItem[] = [];
	if (shown.work === "trace" && focus) {
		const premium = rowPremium(focus);
		result.push({
			id: "row",
			label: t([`${focus.id} premium`, `${focus.id} 权利金`]),
			value: premium === null ? "?" : dollars(premium),
			note: t(series(focus)),
			evidence: premium === null ? "unknown" : "calculated",
		});
	} else
		result.push({
			id: "contracts",
			label: t(["Contracts in R1–R4", "R1–R4 张数"]),
			value: count(packetContracts(mondayPacket)),
			note: t(["R5 has no data yet", "R5 尚无数据"]),
			evidence: "observed",
		});
	if (shown.reveal >= 2)
		result.push({
			id: "sum",
			label:
				shown.reveal >= 3
					? t(["Observed subtotal", "观测小计"])
					: t(["Sum of R1–R4", "R1–R4 合计"]),
			value: dollars(MONDAY),
			note:
				shown.reveal >= 3
					? t([
							`${COVERED} of ${SERIES} series`,
							`${SERIES} 个序列中的 ${COVERED} 个`,
						])
					: t(["the rows with data", "有数据的行"]),
			evidence: "calculated",
		});
	if (shown.reveal >= 3)
		result.push({
			id: "total",
			label: t(["Chain total", "全链合计"]),
			value: t(["unknown", "未知"]),
			note: t([`at least ${dollars(MONDAY)}`, `至少 ${dollars(MONDAY)}`]),
			evidence: "unknown",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Packet P1's five rows with contracts and premium, the working that traces one row to its trades, and the subtotal",
						"研究包 P1 的五行张数与权利金、把一行追溯到成交的计算过程，以及小计",
					])}
					height={traceHeight}
				>
					{(width) => (
						<PacketTable width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Trace row", "追溯行"])}
						value={explore.row}
						options={mondayPacket.map((row) => [row.id, row.id] as const)}
						onChange={(row) => setExplore({ row })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"List the actual executions behind each row, with the formula and units, so another reader can redo every line. A row with no data stays in the packet as missing: it is not a zero, and the sum of the other rows is a subtotal with its coverage stated.",
						"列出每一行背后的实际成交，并写明公式与单位，让另一位读者能重算每一行。没有数据的行要作为缺失保留在研究包中：它不是零，其余各行之和是一个注明覆盖范围的小计。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: a reader reruns from the fields ———

type FieldsState = { removed: Removed | null };

const FIELD_H = 46;
const FIELD_GAP = 6;
const STRIP_H = 58;

function fieldsLayout(width: number, locale: Locale) {
	const title = wrapText(
		pick(
			[
				"Packet P1 · premium traded, ALFA Oct 18 calls 100–120, Monday",
				"研究包 P1 · 周一 ALFA 10月18日 看涨（100–120）成交权利金",
			],
			locale,
		),
		width - 16,
		12,
	);
	const widest = Math.max(
		...fields.map((field) => textWidth(pick(field.value, locale), 13)),
	);
	const columns = (width - 16) / 2 - 24 >= widest ? 2 : 1;
	const top = 8 + title.length * 15;
	const rows = Math.ceil(fields.length / columns);
	const fieldsBottom = top + rows * (FIELD_H + FIELD_GAP);
	return {
		title,
		columns,
		top,
		fieldsBottom,
		height: fieldsBottom + 8 + STRIP_H + 2,
	};
}

function PacketFields({
	width,
	state,
	locale,
}: {
	width: number;
	state: FieldsState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const { hatch } = useStage();
	const layout = fieldsLayout(width, locale);
	const cellWidth = (width - 8 - (layout.columns - 1) * 8) / layout.columns;
	const rerun = reruns[state.removed ?? "none"];
	const matches = rerun.cents === MONDAY;
	const stripY = layout.fieldsBottom + 8;
	const half = (width - 8) / 2;
	return (
		<g>
			{layout.title.map((line, i) => (
				<Label key={line} x={8} y={16 + i * 15} tone="muted">
					{line}
				</Label>
			))}
			{fields.map((field, i) => {
				const x = 4 + (i % layout.columns) * (cellWidth + 8);
				const y =
					layout.top + Math.floor(i / layout.columns) * (FIELD_H + FIELD_GAP);
				const removed = field.id === state.removed;
				return (
					<g key={field.id}>
						<rect
							x={x}
							y={y}
							width={cellWidth}
							height={FIELD_H}
							rx={9}
							className={removed ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						<Label x={x + 12} y={y + 17} tone={removed ? "accent" : "small"}>
							{t(field.label)}
						</Label>
						{removed ? (
							<g>
								<rect
									x={x + 12}
									y={y + 24}
									width={56}
									height={16}
									rx={4}
									style={{ fill: hatch }}
								/>
								<Label x={x + 78} y={y + 36} tone="accent">
									{t(["removed", "已移除"])}
								</Label>
							</g>
						) : (
							<Label x={x + 12} y={y + 36}>
								{t(field.value)}
							</Label>
						)}
					</g>
				);
			})}
			<rect
				x={4}
				y={stripY}
				width={width - 8}
				height={STRIP_H}
				rx={10}
				className="wt-panel-shape"
			/>
			<Label x={16} y={stripY + 20} tone="small">
				{t(["Packet P1 says", "研究包 P1 的结果"])}
			</Label>
			<Label x={16} y={stripY + 44} tone="strong">
				{dollars(MONDAY)}
			</Label>
			<Label x={4 + half + 8} y={stripY + 20} tone="small">
				{t(["A reader's rerun", "读者重跑"])}
			</Label>
			<m.text
				key={rerun.cents}
				x={4 + half + 8}
				y={stripY + 44}
				className={`wt-strong ${matches ? "wt-gain" : "wt-loss"}`}
				initial={motion.enabled ? { opacity: 0, y: 4 } : false}
				animate={{ opacity: 1, y: 0 }}
				transition={motion.fade}
			>
				{rerunText(state.removed)}
			</m.text>
		</g>
	);
}

function FieldsView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: FieldsState;
	explore: FieldsState | null;
	setExplore: (next: FieldsState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const rerun = reruns[shown.removed ?? "none"];
	const matches = rerun.cents === MONDAY;
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Packet P1's fields with one removed, and the number a reader gets when rerunning from what is left",
						"研究包 P1 的字段（其中一个被移除），以及读者根据剩余字段重跑得到的数字",
					])}
					height={(width) => fieldsLayout(width, locale).height}
				>
					{(width) => (
						<PacketFields width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={[
				{
					id: "packet",
					label: t(["Packet P1", "研究包 P1"]),
					value: dollars(MONDAY),
					note: t(["observed subtotal", "观测小计"]),
					evidence: "calculated",
				},
				{
					id: "rerun",
					label: t(["A reader's rerun", "读者重跑"]),
					value: rerunText(shown.removed),
					note: matches
						? t(["matches", "一致"])
						: t([
								`differs: ${pick(rerun.why, "en")}`,
								`不一致：${pick(rerun.why, "zh")}`,
							]),
					tone: matches ? "gain" : "loss",
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Remove a field", "移除一个字段"])}
						value={explore.removed ?? "none"}
						options={[
							["none", t(["None", "不移除"])],
							["formula", t(["Formula", "公式"])],
							["exclusions", t(["Exclusions", "排除"])],
							["asof", t(["As of", "截至"])],
						]}
						onChange={(value) =>
							setExplore({ removed: value === "none" ? null : value })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A packet is complete when a reader can reproduce its result from the fields alone. Without the formula a reader may drop the 100-share multiplier; without the exclusions they count a cancelled trade and a repeated message; without the as-of time a Tuesday rerun picks up the 120 call. Each gives a different, confidently computed number.",
						"只凭字段就能让读者复现结果，研究包才算完整。没有公式，读者可能漏掉每张 100 股的乘数；没有排除项，会把已取消的成交和重复消息算进去；没有截至时间，周二重跑会把 120 看涨也算进来。每一种都会得到一个算得很认真、却不同的数字。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: rerun into a new record ———

type RecordsState = { shown: 1 | 2 | 3 };

const RECORD_H = 70;
const RECORD_GAP = 10;
const recordsHeight = 26 + records.length * (RECORD_H + RECORD_GAP);

function RecordLog({
	width,
	state,
	locale,
}: {
	width: number;
	state: RecordsState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t(["Saved records", "已保存的记录"])}
			</Label>
			{records.map((record, i) => {
				const y = 26 + i * (RECORD_H + RECORD_GAP);
				const visible = i < state.shown;
				return (
					<m.g
						key={record.id}
						initial={false}
						animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
						transition={motion.move}
					>
						<rect
							x={4}
							y={y}
							width={width - 8}
							height={RECORD_H}
							rx={10}
							className="wt-panel-shape"
						/>
						<rect
							x={4}
							y={y}
							width={5}
							height={RECORD_H}
							rx={2}
							className={record.method === 1 ? "wt-chip" : "wt-short"}
						/>
						<Label x={20} y={y + 20} tone="small">
							{t(record.head)}
						</Label>
						<Label x={20} y={y + 43} tone="strong">
							{dollars(record.cents)}
						</Label>
						<Label
							x={width - 16}
							y={y + 42}
							anchor="end"
							tone={record.method === 1 ? (i ? "accent" : "muted") : "loss"}
						>
							{t(record.tag)}
						</Label>
						<Label x={20} y={y + 61} tone="small">
							{t(record.note)}
						</Label>
					</m.g>
				);
			})}
		</g>
	);
}

function RecordsView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: RecordsState;
	explore: RecordsState | null;
	setExplore: (next: RecordsState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] = [
		{
			id: "P1",
			label: "P1",
			value: dollars(MONDAY),
			note:
				shown.shown >= 2
					? t(["kept as it was", "保持原样"])
					: t([
							`${COVERED} of ${SERIES} series`,
							`${SERIES} 个序列中的 ${COVERED} 个`,
						]),
			evidence: "calculated",
		},
	];
	if (shown.shown >= 2)
		result.push({
			id: "P2",
			label: "P2",
			value: dollars(TUESDAY),
			note: t(["rerun: same method, later data", "重跑：同一方法，更晚的数据"]),
			evidence: "calculated",
		});
	if (shown.shown >= 3)
		result.push({
			id: "P3",
			label: "P3",
			value: dollars(WITHOUT_SPREAD),
			note: t(["method v2: a different question", "方法 v2：另一个问题"]),
			tone: "loss",
			evidence: "calculated",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A log of saved packet records: the original, a rerun with later data, and a record with a changed method",
						"已保存研究包记录的日志：原始记录、使用更晚数据的重跑，以及方法已改变的记录",
					])}
					height={recordsHeight}
				>
					{(width) => <RecordLog width={width} state={shown} locale={locale} />}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Show", "显示"])}
						value={String(explore.shown) as "1" | "2" | "3"}
						options={[
							["1", "P1"],
							["2", "+ P2"],
							["3", "+ P3"],
						]}
						onChange={(value) =>
							setExplore({ shown: Number(value) as RecordsState["shown"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Fix the method (universe, formula, exclusion rules) and name the inputs a rerun may change, such as the as-of time or the session date. A rerun is saved as its own dated record and the earlier one stays. Changing the method answers a different question, so it gets a new record with its reason, not an overwrite.",
						"固定方法（范围、公式、排除规则），并写明重跑可以改变的输入，例如截至时间或交易日期。重跑要保存为一条带日期的新记录，旧记录保留。改变方法就是在回答另一个问题，所以要新建一条写明理由的记录，而不是覆盖原记录。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<TraceState, TraceExplore>({
		id: "trace",
		label: ["Trace the rows", "追溯各行"],
		title: ["Every number traces back to trades", "每个数字都能追溯到成交"],
		predict: {
			prompt: [
				`R1–R4 add up to ${dollars(MONDAY)}. R5, the 120 call, has no data at the cutoff. What should the packet call ${dollars(MONDAY)}?`,
				`R1–R4 合计 ${dollars(MONDAY)}。R5，即 120 看涨，在截止时没有数据。研究包应当怎样称呼 ${dollars(MONDAY)}？`,
			],
			choices: [
				{
					id: "subtotal",
					label: [
						`An observed subtotal: ${COVERED} of ${SERIES} series`,
						`观测小计：${SERIES} 个序列中的 ${COVERED} 个`,
					],
				},
				{
					id: "total",
					label: ["The chain's total premium", "全链的权利金总额"],
				},
				{
					id: "zero",
					label: ["The total, with R5 as $0", "总额，把 R5 记为 $0"],
				},
			],
			answer: "subtotal",
			revealAt: 3,
			explain: [
				`R5 is missing, not zero. ${dollars(MONDAY)} covers ${COVERED} of ${SERIES} series, so the chain's total is unknown: at least ${dollars(MONDAY)}.`,
				`R5 是缺失，不是零。${dollars(MONDAY)} 覆盖 ${SERIES} 个序列中的 ${COVERED} 个，所以全链合计未知：至少 ${dollars(MONDAY)}。`,
			],
		},
		beats: [
			{
				id: "rows",
				label: ["Rows", "行"],
				caption: [
					"Packet P1 has one row per Oct 18 call from 100 to 120, built from the corrected tape as of Monday 16:05.",
					"研究包 P1 为 10月18日 100 到 120 的每个看涨各设一行，数据来自截至周一 16:05 的更正后成交记录。",
				],
				state: { reveal: 0, work: "formula", row: null },
			},
			{
				id: "trace",
				label: ["Trace R2", "追溯 R2"],
				caption: [
					"Trace R2 to its trades: 5 at $2.00 and 500 at $2.15, each times 100 shares. Anyone can redo the $108,500.",
					"把 R2 追溯到它的成交：5 张 $2.00 和 500 张 $2.15，各乘 100 股。任何人都能重算出 $108,500。",
				],
				state: { reveal: 1, work: "trace", row: "R2" },
			},
			{
				id: "sum",
				label: ["Sum", "求和"],
				caption: [
					`Add the rows that have data: ${dollars(MONDAY)}.`,
					`把有数据的行相加：${dollars(MONDAY)}。`,
				],
				state: { reveal: 2, work: "sum", row: null },
			},
			{
				id: "coverage",
				label: ["Coverage", "覆盖"],
				caption: [
					`R5 has no data yet, so ${dollars(MONDAY)} covers ${COVERED} of ${SERIES} series: an observed subtotal. The chain total is at least that, not equal to it.`,
					`R5 尚无数据，所以 ${dollars(MONDAY)} 只覆盖 ${SERIES} 个序列中的 ${COVERED} 个：这是观测小计。全链合计至少是这个数，而不是等于它。`,
				],
				state: { reveal: 3, work: "coverage", row: "R5" },
			},
		],
		explore: {
			prompt: [
				"Pick a row and trace it to its trades.",
				"选择一行，把它追溯到成交。",
			],
			start: () => ({ row: "R3" }),
			task: {
				kind: "reach",
				prompt: [
					"Find the row that can't be traced to any trade yet.",
					"找出目前还无法追溯到任何成交的那一行。",
				],
				reached: (e) => e.row === "R5",
				done: [
					"R5, the 120 call, has no trades at the cutoff: missing, not zero. That is why the packet's $165,520 is an observed subtotal over 4 of 5 series.",
					"R5（120 看涨）在截止时间没有成交：是缺失，不是零。所以资料包里的 $165,520 只是 5 个序列中 4 个的已观测小计。",
				],
			},
		},
		View: TraceView,
	}),
	defineScene<FieldsState, FieldsState>({
		id: "fields",
		label: ["Make it rerunnable", "让它可重跑"],
		title: [
			"A reader should get the same number from your fields",
			"读者应能从你的字段得到同一个数字",
		],
		predict: {
			prompt: [
				"A reader reruns P1 from its fields, but the exclusions line is missing. What do they get?",
				"一位读者根据字段重跑 P1，但排除项这一行缺失了。他们会得到什么？",
			],
			choices: [
				{
					id: "more",
					label: [
						"More: a cancelled trade and a repeat get counted",
						"更多：已取消的成交和重复消息被算进去",
					],
				},
				{
					id: "same",
					label: [`The same ${dollars(MONDAY)}`, `同样的 ${dollars(MONDAY)}`],
				},
				{ id: "less", label: ["Less", "更少"] },
			],
			answer: "more",
			revealAt: 2,
			explain: [
				`Without the exclusions they count T-2 (20 at $2.60) and M2's repeat of T-1 (5 at $2.00): ${rerunText("exclusions")}.`,
				`没有排除项，他们会算进 T-2（20 张 $2.60）和 M2 对 T-1 的重复（5 张 $2.00）：${rerunText("exclusions")}。`,
			],
		},
		beats: [
			{
				id: "complete",
				label: ["Complete", "完整"],
				caption: [
					`With every field present, a reader's rerun matches: ${dollars(MONDAY)}.`,
					`所有字段齐全时，读者重跑的结果一致：${dollars(MONDAY)}。`,
				],
				state: { removed: null },
			},
			{
				id: "formula",
				label: ["No formula", "没有公式"],
				caption: [
					`Remove the formula and a reader multiplies price by contracts, missing the 100 shares per contract: ${rerunText("formula")}.`,
					`移除公式，读者只把价格乘以张数，漏掉每张 100 股：${rerunText("formula")}。`,
				],
				state: { removed: "formula" },
			},
			{
				id: "exclusions",
				label: ["No exclusions", "没有排除项"],
				caption: [
					`Remove the exclusions and the cancelled T-2 and the repeated M2 get counted: ${rerunText("exclusions")}.`,
					`移除排除项，已取消的 T-2 和重复的 M2 都被算进去：${rerunText("exclusions")}。`,
				],
				state: { removed: "exclusions" },
			},
		],
		explore: {
			prompt: [
				"Remove a field and see what a careful reader would get.",
				"移除一个字段，看看认真的读者会得到什么。",
			],
			start: () => ({ removed: "asof" }),
			task: {
				kind: "answer",
				prompt: [
					"Which missing field sends a careful reader's rerun furthest from $165,520?",
					"缺少哪个字段，会让认真的读者重算的结果离 $165,520 最远？",
				],
				choices: [
					{ id: "formula", label: ["The formula", "公式"] },
					{ id: "exclusions", label: ["The exclusions", "排除项"] },
					{ id: "asof", label: ["The as-of time", "截至时间"] },
				],
				answer: "formula",
				done: [
					"Without the formula a reader multiplies price by contracts and misses × 100: a hundredth of the true figure. Missing exclusions or as-of times shift it by a few hundred dollars.",
					"没有公式，读者会用价格乘张数而漏掉 × 100：只得到真实数字的百分之一。缺少排除项或截至时间，只会让结果相差几百美元。",
				],
			},
		},
		View: FieldsView,
	}),
	defineScene<RecordsState, RecordsState>({
		id: "records",
		label: ["Preserve each rerun", "保留每次重跑"],
		title: [
			"A rerun adds a record; a new method asks a new question",
			"重跑新增记录；新方法是在问新问题",
		],
		predict: {
			prompt: [
				`After Tuesday's data arrives, someone also leaves out the 10:50 spread's two legs and gets ${dollars(WITHOUT_SPREAD)}. What is that record?`,
				`周二的数据到达后，有人还去掉了 10:50 价差的两条腿，得到 ${dollars(WITHOUT_SPREAD)}。这条记录是什么？`,
			],
			choices: [
				{
					id: "new",
					label: ["A new question: the method changed", "新问题：方法变了"],
				},
				{
					id: "replace",
					label: ["A rerun that replaces P2", "替换 P2 的重跑"],
				},
				{ id: "fix", label: ["A correction of P2", "对 P2 的更正"] },
			],
			answer: "new",
			revealAt: 2,
			explain: [
				"A rerun may change only the inputs the packet allows, like the as-of time. Leaving out trades changes the method, so the result answers a different question and needs its own record and reason.",
				"重跑只能改变研究包允许的输入，比如截至时间。去掉成交改变了方法，所以结果回答的是另一个问题，需要单独的记录和理由。",
			],
		},
		beats: [
			{
				id: "p1",
				label: ["P1", "P1"],
				caption: [
					`P1 is saved with its as-of time and method: ${dollars(MONDAY)} over ${COVERED} of ${SERIES} series.`,
					`P1 连同截至时间和方法一起保存：${dollars(MONDAY)}，覆盖 ${SERIES} 个序列中的 ${COVERED} 个。`,
				],
				state: { shown: 1 },
			},
			{
				id: "p2",
				label: ["Rerun", "重跑"],
				caption: [
					`Tuesday 09:00 the 120 call's trades arrive: 30 at $0.10. The same method as of Tuesday gives P2, ${dollars(TUESDAY)} over all ${SERIES} series. P1 stays as it was.`,
					`周二 09:00，120 看涨的成交到达：30 张 $0.10。同一方法截至周二得到 P2：${dollars(TUESDAY)}，覆盖全部 ${SERIES} 个序列。P1 保持原样。`,
				],
				state: { shown: 2 },
			},
			{
				id: "p3",
				label: ["New method", "新方法"],
				caption: [
					`Leaving out the 10:50 spread's two legs changes the method, not the data: ${dollars(WITHOUT_SPREAD)} answers a new question. Save it as P3 with its reason; P2 stands.`,
					`去掉 10:50 价差的两条腿改变的是方法，而不是数据：${dollars(WITHOUT_SPREAD)} 回答的是一个新问题。把它连同理由存为 P3；P2 保持不变。`,
				],
				state: { shown: 3 },
			},
		],
		explore: {
			prompt: ["Step through the record log.", "逐步查看记录日志。"],
			start: () => ({ shown: 3 }),
			task: {
				kind: "answer",
				prompt: [
					"Which saved record answers a different question from P1?",
					"哪条保存的记录回答的是与 P1 不同的问题？",
				],
				choices: [
					{ id: "p3", label: ["P3", "P3"] },
					{ id: "p2", label: ["P2", "P2"] },
					{ id: "both", label: ["Both P2 and P3", "P2 和 P3 都是"] },
				],
				answer: "p3",
				done: [
					"P2 reruns P1's method with Tuesday's data: same question, later evidence. P3 leaves trades out, a new method, so it answers a new question and needs its own reason.",
					"P2 用周二的数据重跑 P1 的方法：同一问题，更晚的证据。P3 去掉了部分成交，是新方法，所以回答的是新问题，需要单独说明理由。",
				],
			},
		},
		View: RecordsView,
	}),
] as const;

export function ResearchPacketWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Player
			locale={locale}
			id="cookbook-research-packet"
			label={[
				"Interactive lesson on reproducible research packets",
				"可复现研究包互动课",
			]}
			film={researchPacketFilm}
			scenes={scenes}
		/>
	);
}
