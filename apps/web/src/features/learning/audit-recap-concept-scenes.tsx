import * as m from "motion/react-m";
import { createContext, type ReactNode, useContext, useState } from "react";
import {
	type AuditRecapConceptData,
	unresolvedAuditChecks,
	workingAuditPremium,
} from "@/domain/learning/audit-recap-concept";
import {
	packetRowPremium,
	packetTotals,
} from "@/domain/learning/packet-concept";
import { apparentBarRatio } from "@/domain/learning/recap-concept";
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
export const AuditRecapData = createContext<AuditRecapConceptData | null>(null);
function useData() {
	const data = useContext(AuditRecapData);
	if (!data) throw new Error("Recap audit requires authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const copy = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const money = (v: number | null) =>
	v === null
		? "—"
		: `$${(v / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
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
			{data.packet.id} · {data.packet.method.source}
			<br />
			{data.packet.session} · {data.packet.method.cutoff}
			<br />
			{copy(locale)(
				"Local fixed examples · audit notes are not saved here",
				"本地固定示例 · 此处不保存审核笔记",
			)}
		</p>
	);
}
export function AuditAmountScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const source = packetTotals(data.packet.rows, data.requiredIds);
	const ids = source.usedIds;
	const replay = useFrames(ids.length + 1);
	const [manual, setManual] = useState<string[] | null>([]);
	const repaired = manual ?? ids.slice(0, replay.frame);
	const working = workingAuditPremium(
		data.packet,
		data.requiredIds,
		repaired,
		data.reportedMultiplier,
	);
	const complete = ids.every((id) => repaired.includes(id));
	const enabled = useLessonMotion();
	const width = source.subtotal
		? (280 * (working.subtotal ?? 0)) / source.subtotal
		: 0;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Source multipliers and working report amount",
						"来源乘数与报告工作金额",
					)}
					height={470}
				>
					<SvgText x={180} y={27}>
						{l("Repair each reported multiplier", "修复每个报告乘数")}
					</SvgText>
					{data.packet.rows.map((row, i) => {
						const known = packetRowPremium(row) !== null;
						const factor = repaired.includes(row.id)
							? row.multiplier
							: data.reportedMultiplier;
						const value = known
							? packetRowPremium({ ...row, multiplier: factor })
							: null;
						return (
							<g key={row.id}>
								<rect
									x={25}
									y={50 + i * 88}
									width={310}
									height={70}
									rx={11}
									fill={
										repaired.includes(row.id)
											? "var(--primary)"
											: "currentColor"
									}
									opacity={repaired.includes(row.id) ? 0.2 : 0.04}
								/>
								<foreignObject x={25} y={50 + i * 88} width={310} height={70}>
									<button
										type="button"
										disabled={!known}
										className="h-full w-full rounded-xl text-center text-sm disabled:opacity-70"
										aria-label={`${l("Toggle multiplier repair", "切换乘数修复")} ${row.id}`}
										aria-pressed={repaired.includes(row.id)}
										onClick={() => {
											replay.select(replay.frame);
											setManual(
												repaired.includes(row.id)
													? repaired.filter((id) => id !== row.id)
													: [...repaired, row.id],
											);
										}}
									>
										<span className="block">
											{row.id}:{" "}
											{known
												? `${l("reported factor", "报告乘数")} ${factor} / ${l("source", "来源")} ${row.multiplier}`
												: l("Missing inputs stay missing", "缺失输入保持缺失")}
										</span>
										<span className="block font-mono">{money(value)}</span>
									</button>
								</foreignObject>
							</g>
						);
					})}
					<SvgText x={180} y={334}>
						{l("Working report subtotal", "报告工作小计")}
					</SvgText>
					<g data-audit-working>
						<SvgText x={180} y={369} strong>
							{money(working.subtotal)}
						</SvgText>
					</g>
					<rect
						x={40}
						y={390}
						width={280}
						height={12}
						rx={4}
						fill="currentColor"
						opacity={0.05}
					/>
					{enabled && replay.playing ? (
						<m.rect
							x={40}
							y={390}
							width={width}
							height={12}
							rx={4}
							fill="var(--primary)"
							initial={false}
							animate={{ width }}
							transition={lessonTransition}
						/>
					) : (
						<rect
							x={40}
							y={390}
							width={width}
							height={12}
							rx={4}
							fill="var(--primary)"
						/>
					)}
					<SvgText x={180} y={442}>
						{l("Source subtotal", "来源小计")}: {money(source.subtotal)}
					</SvgText>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<PlaybackButton
				playing={replay.playing}
				onClick={() => {
					setManual(null);
					replay.toggle();
				}}
				l={l}
			/>
			<p data-audit-amount-status>
				{complete
					? l(
							"Source multipliers restored; other report claims still need review",
							"来源乘数已恢复；报告其他结论仍需审核",
						)
					: l(
							"The reported calculation omits required multiplier scaling",
							"报告计算遗漏必需乘数缩放",
						)}
			</p>
			<p data-audit-retained>
				{l("Retain valid R1 price/share", "保留有效 R1 每股价格")}:{" "}
				{money(data.packet.rows[0].priceCents)}
			</p>
			<p>
				{l("Used source rows", "使用来源行")}: {source.usedIds.join(" / ")}
				<br />
				{l("Missing required rows", "必需缺失行")}:{" "}
				{source.missingIds.join(" / ")}
				<br />
				{l("Complete total", "完整总量")}: {money(source.fullTotal)}
			</p>
			<Note>
				{l(
					"The flawed factors give $20+$60=$80. Restoring R1 alone gives $2,060; restoring both gives $8,000 observed premium. R1's correctly reported $2 per-share price stays valid throughout. Correcting the dollars does not establish opening intent, complete coverage or a forecast.",
					"错误乘数得到 $20+$60=$80。仅恢复 R1 得 $2,060，两行均恢复后为 $8,000 观测权利金。R1 正确报告的每股 $2 始终有效。修正金额不确定开仓意图、完整覆盖或预测。",
				)}
			</Note>
		</SceneLayout>
	);
}
export function AuditClaimsScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const language = locale === "zh" ? 1 : 0;
	const [selected, setSelected] = useState("time");
	const [repaired, setRepaired] = useState<string[]>([]);
	const check = data.checks.find((c) => c.id === selected) ?? data.checks[0];
	const pending = unresolvedAuditChecks(data.checks, repaired);
	const fixed = repaired.includes(check.id);
	const supported = check.initiallySupported || fixed;
	const minimum = repaired.includes("scale") ? 0 : 9;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l("Fixed report audit checks", "固定报告审核检查")}
					height={490}
				>
					<SvgText x={180} y={28}>
						{l("Inspect before polishing", "先检查，再润色")}
					</SvgText>
					{data.checks.map((c, i) => {
						const repairedHere = repaired.includes(c.id);
						const ok = c.initiallySupported || repairedHere;
						return (
							<g key={c.id}>
								<rect
									x={25}
									y={52 + i * 62}
									width={310}
									height={52}
									rx={10}
									fill={selected === c.id ? "var(--primary)" : "currentColor"}
									opacity={selected === c.id ? 0.18 : 0.04}
								/>
								<foreignObject x={25} y={52 + i * 62} width={310} height={52}>
									<button
										type="button"
										className="h-full w-full rounded-lg text-center text-sm"
										aria-label={`${l("Inspect audit check", "检查审核项")} ${c.label[language]}`}
										aria-pressed={selected === c.id}
										onClick={() => setSelected(c.id)}
									>
										<span className="block">{c.label[language]}</span>
										<span className="block text-xs">
											{c.initiallySupported
												? l("Supported · retain", "支持 · 保留")
												: ok
													? l("Repaired in example", "示例已修复")
													: l("Needs repair", "需要修复")}
										</span>
									</button>
								</foreignObject>
							</g>
						);
					})}
					<SvgText x={180} y={455}>
						{l("Unresolved scripted defects", "未解决示例缺陷")}:{" "}
						{pending.length}
					</SvgText>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Audit check", "审核项")}
				value={selected}
				options={data.checks.map((c) => [c.id, c.label[language]])}
				onChange={setSelected}
			/>
			<div className="rounded-2xl border p-4 text-sm leading-relaxed">
				<strong>{l("Report excerpt", "报告摘录")}</strong>
				<p data-audit-report>
					{fixed ? check.repair[language] : check.reported[language]}
				</p>
				<strong>{l("Source evidence", "来源证据")}</strong>
				<p>{check.source[language]}</p>
			</div>
			{selected === "scale" && (
				<div data-audit-chart>
					<Diagram
						label={l("Actual report bar scale", "报告实际柱轴尺度")}
						height={220}
					>
						<SvgText x={180} y={25}>
							{l("Contracts · axis minimum", "张数 · 轴下限")}: {minimum}
						</SvgText>
						{[10, 20].map((value, i) => {
							const height = ((value - minimum) / (20 - minimum)) * 110;
							const x = 80 + i * 190;
							return (
								<g key={value}>
									<rect
										x={x - 30}
										y={165 - height}
										width={60}
										height={height}
										rx={4}
										fill="var(--primary)"
										opacity={0.65}
									/>
									<SvgText x={x} y={153 - height}>
										{value}
									</SvgText>
									<SvgText x={x} y={187}>
										R{i + 1}
									</SvgText>
								</g>
							);
						})}
						<SvgText x={180} y={214}>
							{l("Height ratio", "柱高比")}: {apparentBarRatio(20, 10, minimum)}
							× · {l("values", "数值")}: 2×
						</SvgText>
					</Diagram>
				</div>
			)}
			<button
				type="button"
				className="rounded-xl border px-4 py-3 text-sm disabled:opacity-60"
				disabled={supported}
				onClick={() => setRepaired((prev) => [...prev, check.id])}
			>
				{supported
					? l("Supported or repaired · retain", "支持或已修复 · 保留")
					: l("Repair selected issue", "修复所选问题")}
			</button>
			<p data-audit-first>
				{pending.length
					? `${l("First unresolved check", "首个未解决检查")}: ${pending[0].label[language]}`
					: l(
							"Scripted defects repaired; unknown evidence still remains",
							"示例缺陷已修复；未知证据仍存在",
						)}
			</p>
			<Note>
				{l(
					"Check order helps locate the first unsupported step. Repairing a later inference does not fix an earlier date mismatch. Inspect the actual axis, not just the labels. These are fixed examples with supplied repairs, not automatic analysis of arbitrary reports.",
					"检查顺序有助定位首个无依据步骤。修复后续推断不会修复先前日期不符。应检查实际轴，而非仅看标签。这些是带给定修复的固定示例，不是对任意报告的自动分析。",
				)}
			</Note>
		</SceneLayout>
	);
}
export function AuditSignoffScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const language = locale === "zh" ? 1 : 0;
	const [included, setIncluded] = useState(["supported", "repaired"]);
	const missing = data.signoff.filter((f) => !included.includes(f.id));
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l("Bounded signoff fields", "有边界签核字段")}
					height={425}
				>
					<SvgText x={180} y={30}>
						{l("Supplied repaired example", "给定修复示例")}
					</SvgText>
					{data.signoff.map((f, i) => (
						<g key={f.id}>
							<rect
								x={25}
								y={65 + i * 78}
								width={310}
								height={64}
								rx={12}
								fill={
									included.includes(f.id) ? "var(--primary)" : "currentColor"
								}
								opacity={included.includes(f.id) ? 0.18 : 0.04}
							/>
							<foreignObject x={25} y={65 + i * 78} width={310} height={64}>
								<button
									type="button"
									className="h-full w-full rounded-xl text-center text-sm"
									aria-pressed={included.includes(f.id)}
									onClick={() =>
										setIncluded((prev) =>
											prev.includes(f.id)
												? prev.filter((id) => id !== f.id)
												: [...prev, f.id],
										)
									}
								>
									{included.includes(f.id) ? "●" : "○"} {f.label[language]}
								</button>
							</foreignObject>
						</g>
					))}
				</Diagram>
			}
		>
			<Context locale={locale} />
			<div className="rounded-2xl border p-4 text-sm leading-relaxed">
				<strong>{l("Signoff preview", "签核预览")}</strong>
				<div data-audit-signoff>
					{data.signoff
						.filter((f) => included.includes(f.id))
						.map((f) => (
							<p key={f.id}>
								<strong>{f.label[language]}: </strong>
								{f.text[language]}
							</p>
						))}
				</div>
			</div>
			<p data-audit-signoff-status>
				{missing.length
					? `${l("Signoff is missing", "签核缺少")}: ${missing.map((f) => f.label[language]).join(" · ")}`
					: l(
							"Ready for human review; unknowns and reopening conditions remain explicit",
							"可供人工审核；未知项与重审条件仍明确",
						)}
			</p>
			<Note>
				{l(
					"This signoff starts from a supplied repaired example, not an assumption that every earlier control was completed. It retains the valid R1 fact, names repairs, states unresolved evidence and identifies what would reopen review. Saying only 'uncertain' or discarding the whole packet would fail to do that.",
					"此签核从给定修复示例出发，不假定此前每个控件都已完成。它保留有效 R1 事实、说明修复、列出未解决证据及重审条件。仅说“不确定”或丢弃整份研究包，都不能做到这些。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"The local preview does not save an audit or certify prose. In the following exercise, your actual audit and signoff writing remain available for self or human review; numerical checks are graded separately.",
					"本地预览不保存审核或认证文字。后续练习中，你的实际审核与签核写作仍供自评或人工审核，数值检查单独评分。",
				)}
			</p>
		</SceneLayout>
	);
}
