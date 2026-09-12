import * as m from "motion/react-m";
import { createContext, type ReactNode, useContext, useState } from "react";
import {
	changedPacketMethod,
	type PacketConceptData,
	packetRowPremium,
	packetTotals,
} from "@/domain/learning/packet-concept";
import type { Locale } from "@/i18n/messages";
import {
	Diagram,
	PlaybackButton,
	SceneLayout,
	SelectField,
	SvgText,
	useFrames,
} from "./concept-scene";
import { lessonTransition, useLessonMotion } from "./lesson-motion";
export const PacketData = createContext<PacketConceptData | null>(null);
function useData() {
	const data = useContext(PacketData);
	if (!data) throw new Error("Packet scenes require authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const copy = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const number = (v: number | null) =>
	v === null ? "—" : v.toLocaleString("en-US");
const money = (cents: number | null) =>
	cents === null
		? "—"
		: `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
function Note({ children }: { children: ReactNode }) {
	return (
		<div className="rounded-2xl border p-4 text-sm leading-relaxed">
			{children}
		</div>
	);
}
function Context({ locale }: Props) {
	const data = useData();
	return (
		<p className="font-mono text-muted-foreground text-xs">
			{data.source}
			<br />
			{copy(locale)(
				"Local sample preview · no real packet is saved",
				"本地样例预览 · 不保存真实研究包",
			)}
		</p>
	);
}
function Stages({
	labels,
	step,
	choose,
	animate,
}: {
	labels: readonly string[];
	step: number;
	choose: (value: number) => void;
	animate: boolean;
}) {
	const x = (i: number) => 45 + (i * 270) / Math.max(1, labels.length - 1);
	return (
		<>
			<line
				x1={45}
				x2={315}
				y1={19}
				y2={19}
				stroke="currentColor"
				opacity={0.2}
			/>
			{animate ? (
				<m.circle
					cx={x(step)}
					cy={19}
					r={6}
					fill="var(--primary)"
					stroke="currentColor"
					initial={false}
					animate={{ cx: x(step) }}
					transition={lessonTransition}
				/>
			) : (
				<circle
					cx={x(step)}
					cy={19}
					r={6}
					fill="var(--primary)"
					stroke="currentColor"
				/>
			)}
			{labels.map((label, i) => (
				<foreignObject key={label} x={x(i) - 40} y={36} width={80} height={40}>
					<button
						type="button"
						className="h-full w-full rounded-lg border text-xs"
						aria-pressed={step === i}
						onClick={() => choose(i)}
					>
						{label}
					</button>
				</foreignObject>
			))}
		</>
	);
}
export function PacketTraceScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const record = data.original;
	const [selected, setSelected] = useState("R1");
	const replay = useFrames(4);
	const [manual, setManual] = useState<number | null>(3);
	const step = manual ?? replay.frame;
	const stats = packetTotals(record.rows, data.requiredIds);
	const row = record.rows.find((r) => r.id === selected) ?? record.rows[0];
	const enabled = useLessonMotion();
	const choose = (value: number) => {
		replay.select(value);
		setManual(value);
	};
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Source rows formula subtotal and coverage",
						"来源行公式小计与覆盖",
					)}
					height={510}
				>
					<Stages
						labels={[
							l("Rows", "来源行"),
							l("Calculate", "计算"),
							l("Subtotal", "小计"),
							l("Coverage", "覆盖"),
						]}
						step={step}
						choose={choose}
						animate={enabled && replay.playing}
					/>
					{record.rows.map((r, i) => (
						<g key={r.id}>
							<rect
								x={25}
								y={96 + i * 74}
								width={310}
								height={64}
								rx={12}
								fill={selected === r.id ? "var(--primary)" : "currentColor"}
								opacity={selected === r.id ? 0.18 : 0.04}
								stroke="currentColor"
								strokeDasharray={
									packetRowPremium(r) === null ? "4 3" : undefined
								}
							/>
							<foreignObject x={25} y={96 + i * 74} width={310} height={64}>
								<button
									type="button"
									className="h-full w-full rounded-xl text-center text-sm"
									aria-label={`${l("Inspect row", "检查行")} ${r.id}`}
									aria-pressed={selected === r.id}
									onClick={() => setSelected(r.id)}
								>
									<span className="block font-mono">
										{r.id}: {number(r.contracts)} × {money(r.priceCents)} ×{" "}
										{number(r.multiplier)}
									</span>
									<span className="block">
										{step >= 1
											? money(packetRowPremium(r))
											: l("Source inputs", "来源输入")}
									</span>
								</button>
							</foreignObject>
						</g>
					))}
					<SvgText x={180} y={349}>
						{l("Observed premium subtotal", "观测权利金小计")}
					</SvgText>
					<g data-packet-subtotal>
						<SvgText x={180} y={386} strong>
							{step >= 2 ? money(stats.subtotal) : "—"}
						</SvgText>
					</g>
					<SvgText x={180} y={428}>
						{l("Complete required total", "完整必需总量")}:{" "}
						{step >= 3 ? money(stats.fullTotal) : "—"}
					</SvgText>
					<SvgText x={180} y={469} muted>
						{step >= 3
							? `${l("Missing", "缺失")}: ${stats.missingIds.join(" / ")}`
							: l("Coverage check still pending", "覆盖检查尚未完成")}
					</SvgText>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<p className="font-mono text-xs">
				{record.id} · {record.method.source}
				<br />
				{record.session} · {record.method.cutoff}
				<br />
				{record.method.universe}
			</p>
			<PlaybackButton
				playing={replay.playing}
				onClick={() => {
					setManual(null);
					replay.toggle();
				}}
				l={l}
			/>
			<SelectField
				label={l("Source row", "来源行")}
				value={selected}
				options={record.rows.map((r) => [r.id, r.id])}
				onChange={setSelected}
			/>
			<p data-packet-row>
				{row.id} · {l("premium", "权利金")}: {money(packetRowPremium(row))}
			</p>
			<p className="font-mono text-xs">
				{l("Contracts × USD/share × multiplier", "张数 × 美元/股 × 乘数")}
				<br />
				{number(row.contracts)} × {money(row.priceCents)} ×{" "}
				{number(row.multiplier)}
			</p>
			<p data-packet-used>
				{l("Calculation row IDs", "计算行 ID")}: {stats.usedIds.join(" / ")}
			</p>
			<p data-packet-full>
				{l("Full required total", "完整必需总量")}: {money(stats.fullTotal)}
			</p>
			<Note>
				{l(
					"R1 contributes $2,000 and R2 $6,000. The $8,000 sum is observed premium, not profit or a full-universe total. R3 stays required and missing. Record both the used row IDs and the omitted unknown row; a source link alone cannot reproduce the arithmetic.",
					"R1 贡献 $2,000、R2 $6,000。$8,000 是观测权利金，不是利润或完整范围总量。R3 仍为必需且缺失。需记录使用行 ID 及未计入的未知行；单有来源链接不能复现算术。",
				)}
			</Note>
		</SceneLayout>
	);
}
export function PacketFieldsScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const language = locale === "zh" ? 1 : 0;
	const [present, setPresent] = useState(
		data.fields.filter((f) => f.id !== "missing").map((f) => f.id),
	);
	const [focus, setFocus] = useState("missing");
	const field = data.fields.find((f) => f.id === focus) ?? data.fields[0];
	const missing = data.fields.filter((f) => !present.includes(f.id));
	const toggle = (id: string) => {
		setPresent((prev) =>
			prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
		);
		setFocus(id);
	};
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l("Recorded packet fields", "研究包记录字段")}
					height={475}
				>
					<SvgText x={180} y={28}>
						{l("Record preview", "记录预览")}: {present.length} /{" "}
						{data.fields.length}
					</SvgText>
					{data.fields.map((f, i) => (
						<g key={f.id}>
							<rect
								x={25}
								y={53 + i * 62}
								width={310}
								height={52}
								rx={10}
								fill={
									present.includes(f.id) ? "var(--primary)" : "currentColor"
								}
								opacity={present.includes(f.id) ? 0.18 : 0.04}
							/>
							<foreignObject x={25} y={53 + i * 62} width={310} height={52}>
								<button
									type="button"
									className="h-full w-full rounded-lg text-center text-sm"
									aria-pressed={present.includes(f.id)}
									onClick={() => toggle(f.id)}
								>
									<span className="block">{f.label[language]}</span>
									<span className="block text-xs">
										{present.includes(f.id)
											? l("Recorded", "已记录")
											: l("Omitted", "已省略")}
									</span>
								</button>
							</foreignObject>
						</g>
					))}
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Inspect packet field", "检查研究包字段")}
				value={focus}
				options={data.fields.map((f) => [f.id, f.label[language]])}
				onChange={setFocus}
			/>
			<div className="rounded-2xl border p-4 text-sm">
				<strong>{field.label[language]}</strong>
				<p data-packet-field-value>
					{present.includes(field.id)
						? field.value[language]
						: l("Not recorded in this packet preview", "未记录于此研究包预览")}
				</p>
			</div>
			<p data-packet-field-status>
				{missing.length
					? `${l("Missing record fields", "缺少记录字段")}: ${missing.map((f) => f.label[language]).join(" · ")}`
					: l(
							"Fields present; still requires self or human review",
							"字段齐备；仍需自评或人工审核",
						)}
			</p>
			<p>
				{l("Source calculation for comparison", "用于对照的来源计算")}:{" "}
				{money(packetTotals(data.original.rows, data.requiredIds).subtotal)}
			</p>
			<Note>
				{l(
					"Each recorded field contains concrete values, not just a checked label. Remove source IDs, units or transformation and a reader cannot reliably reconstruct this source calculation from the packet. Omit missingness and the subtotal's claim boundary disappears.",
					"每个记录字段包含具体值，而非仅勾选标签。移除来源 ID、单位或变换，读者就不能可靠地从研究包还原此来源计算。省略缺失信息，会丢失小计的结论边界。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"All supplied fields can be present while a source row is still missing. Metadata completeness does not create missing observations or certify prose quality. This is a local sample; the following writing exercise retains the platform's existing saving and self-review behavior.",
					"给定字段可全部齐备，而来源行仍缺失。元数据完整不会创造缺失观测，也不认证文字质量。这是本地样例；后续写作练习保留平台已有保存与自评行为。",
				)}
			</p>
		</SceneLayout>
	);
}
export function PacketRerunScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const language = locale === "zh" ? 1 : 0;
	const [id, setId] = useState(data.reruns[0].id);
	const replay = useFrames(3);
	const proposal = data.reruns.find((p) => p.id === id) ?? data.reruns[0];
	const changes = changedPacketMethod(
		data.original.method,
		proposal.record.method,
	);
	const allowed = changes.length === 0;
	const original = packetTotals(data.original.rows, data.requiredIds);
	const next = packetTotals(proposal.record.rows, data.requiredIds);
	const enabled = useLessonMotion();
	const names = {
		cutoff: l("Session cutoff", "时段截止"),
		universe: l("Universe rule", "范围规则"),
		source: l("Source", "来源"),
		transformation: l("Transformation", "变换"),
		units: l("Units", "单位"),
		missingPolicy: l("Missingness rule", "缺失规则"),
	};
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Original packet and independently recorded rerun",
						"原研究包与独立记录重跑",
					)}
					height={510}
				>
					<Stages
						labels={[
							l("Original", "原件"),
							l("Proposal", "建议"),
							l("Review", "审核"),
						]}
						step={replay.frame}
						choose={replay.select}
						animate={enabled && replay.playing}
					/>
					<foreignObject x={25} y={101} width={310} height={143}>
						<div className="h-full rounded-xl border p-4 text-sm leading-relaxed">
							<strong>
								{data.original.id} · {l("retained", "保留")}
							</strong>
							<p>{data.original.session}</p>
							<p>
								{l("Observed subtotal", "观测小计")}: {money(original.subtotal)}
							</p>
							<p>
								{l("Missing", "缺失")}: {original.missingIds.join(" / ")}
							</p>
						</div>
					</foreignObject>
					<SvgText x={180} y={280}>
						{l("Never overwrite the first record", "不覆盖首份记录")}
					</SvgText>
					{replay.frame === 2 ? (
						<foreignObject x={25} y={314} width={310} height={155}>
							<div className="h-full rounded-xl border bg-primary/10 p-4 text-sm leading-relaxed">
								<strong>
									{allowed
										? proposal.record.id
										: l("Method revision required", "需要方法修订")}
								</strong>
								<p>
									{allowed
										? proposal.record.session
										: l("No new result created", "未创建新结果")}
								</p>
								<p>
									{allowed
										? `${l("Observed subtotal", "观测小计")}: ${money(next.subtotal)}`
										: l(
												"Declare the changed method and supply its evidence first",
												"先声明变化方法并提供证据",
											)}
								</p>
								{allowed && (
									<p>
										{l("Missing", "缺失")}: {next.missingIds.join(" / ")}
									</p>
								)}
							</div>
						</foreignObject>
					) : (
						<SvgText x={180} y={375} muted>
							{l("Rerun review pending", "重跑审核待完成")}
						</SvgText>
					)}
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Rerun proposal", "重跑建议")}
				value={id}
				options={data.reruns.map((p) => [p.id, p.label[language]])}
				onChange={(v) => {
					setId(v);
					replay.select(0);
				}}
			/>
			<PlaybackButton playing={replay.playing} onClick={replay.toggle} l={l} />
			<p>{proposal.note[language]}</p>
			<p className="font-mono text-xs">
				{l("Permitted replay input", "允许回放输入")}:{" "}
				{l("session date", "时段日期")}
				<br />
				{proposal.record.method.universe}
				<br />
				{proposal.record.method.source}
				<br />
				{l("Fixed cutoff", "固定截止")}: {data.original.method.cutoff}
				<br />
				{l("Proposed cutoff", "建议截止")}: {proposal.record.method.cutoff}
			</p>
			{allowed && (
				<p data-packet-rerun-rows className="font-mono text-xs">
					{proposal.record.id} · {proposal.record.session}
					<br />
					{proposal.record.rows
						.map(
							(r) =>
								`${r.id}: ${number(r.contracts)} × ${money(r.priceCents)} × ${number(r.multiplier)} = ${money(packetRowPremium(r))}`,
						)
						.join("; ")}
				</p>
			)}
			<p data-packet-rerun-status>
				{replay.frame < 2
					? l("Review pending", "审核待完成")
					: allowed
						? l(
								"Allowed dated rerun; original record retained",
								"允许日期重跑；原记录保留",
							)
						: l(
								"Fixed method changed; explicit revision required",
								"固定方法改变；需明确修订",
							)}
			</p>
			<p data-packet-rerun-total>
				{l("New observed subtotal", "新观测小计")}:{" "}
				{replay.frame === 2 && allowed ? money(next.subtotal) : "—"}
			</p>
			<p data-packet-original>
				{l("Original observed subtotal", "原观测小计")}:{" "}
				{money(original.subtotal)}
			</p>
			<p>
				{l("Changed method fields", "改变的方法字段")}:{" "}
				{changes.length
					? changes.map((c) => names[c]).join(" · ")
					: l("None", "无")}
			</p>
			<Note>
				{l(
					"The template permits a session-date change, which creates a new dated question instance and evidence record under the same method. Changing the cutoff, switching calls to puts, replacing the source or excluding an inconvenient row is not that permitted input change. Preserve the original and declare a method revision before producing a new result.",
					"模板允许改变时段日期，在同一方法下创建新日期问题实例与证据记录。改变截止、看涨改看跌、更换来源或排除不方便的行，不是该允许输入变化。产生新结果前，应保留原件并声明方法修订。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"This walkthrough previews version separation; it does not write a real packet or certify the revised research. A reviewer still needs the new row IDs, inputs, formula, units and missingness.",
					"此演示预览版本分离，不写入真实研究包，也不认证修订研究。审核者仍需新的行 ID、输入、公式、单位与缺失信息。",
				)}
			</p>
		</SceneLayout>
	);
}
