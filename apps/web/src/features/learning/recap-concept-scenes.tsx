import * as m from "motion/react-m";
import { createContext, type ReactNode, useContext, useState } from "react";
import {
	apparentBarRatio,
	type RecapConceptData,
	type RecapMetric,
	recapSeries,
} from "@/domain/learning/recap-concept";
import type { Locale } from "@/i18n/messages";
import {
	Diagram,
	PlaybackButton,
	RangeControl,
	SceneLayout,
	SelectField,
	SvgText,
	useFrames,
} from "./concept-scene";
import { lessonTransition, useLessonMotion } from "./lesson-motion";
export const RecapData = createContext<RecapConceptData | null>(null);
function useData() {
	const data = useContext(RecapData);
	if (!data) throw new Error("Recap scenes require authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const copy = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const number = (v: number | null) =>
	v === null ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: 2 });
const format = (v: number | null, metric: RecapMetric) =>
	v === null ? "—" : metric === "premium" ? `$${number(v / 100)}` : number(v);
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
				"Local sample composition · not saved",
				"本地样例编排 · 未保存",
			)}
		</p>
	);
}
function Chart({
	locale,
	metric,
	selected,
	onSelect,
	minimum = 0,
	animate = false,
}: Props & {
	metric: RecapMetric;
	selected: string;
	onSelect: (id: string) => void;
	minimum?: number;
	animate?: boolean;
}) {
	const data = useData();
	const l = copy(locale);
	const result = recapSeries(data.packet, data.series, metric);
	const maximum = Math.max(1, ...result.rows.map((r) => r.value ?? 0));
	return (
		<>
			<SvgText x={180} y={27}>
				{metric === "volume"
					? l("Observed contracts", "观测张数")
					: l("Observed premium · USD", "观测权利金 · 美元")}
			</SvgText>
			<SvgText x={180} y={55} muted>
				{l("Axis minimum", "轴下限")}: {format(minimum, metric)}
			</SvgText>
			<line
				x1={35}
				x2={325}
				y1={300}
				y2={300}
				stroke="currentColor"
				opacity={0.3}
			/>
			{result.rows.map((r, i) => {
				const x = 80 + i * 100;
				const height =
					r.value === null
						? 0
						: Math.max(0, (r.value - minimum) / (maximum - minimum)) * 210;
				return (
					<g key={r.id}>
						{r.value === null ? (
							<>
								<rect
									x={x - 26}
									y={261}
									width={52}
									height={39}
									rx={7}
									fill="none"
									stroke="currentColor"
									strokeDasharray="4 3"
								/>
								<SvgText x={x} y={287}>
									?
								</SvgText>
							</>
						) : (
							<>
								<g transform="translate(0 300) scale(1 -1)">
									{animate ? (
										<m.rect
											x={x - 30}
											y={0}
											width={60}
											height={height}
											rx={5}
											fill="var(--primary)"
											opacity={0.65}
											initial={false}
											animate={{ height }}
											transition={lessonTransition}
										/>
									) : (
										<rect
											x={x - 30}
											y={0}
											width={60}
											height={height}
											rx={5}
											fill="var(--primary)"
											opacity={0.65}
										/>
									)}
								</g>
								<SvgText x={x} y={288 - height}>
									{format(r.value, metric)}
								</SvgText>
							</>
						)}
						<foreignObject x={x - 42} y={319} width={84} height={43}>
							<button
								type="button"
								className="h-full w-full rounded-lg border text-xs"
								aria-label={`${l("Inspect chart row", "检查图表行")} ${r.id}`}
								aria-pressed={selected === r.id}
								onClick={() => onSelect(r.id)}
							>
								{r.strike} · {r.id}
							</button>
						</foreignObject>
						<SvgText x={x} y={386} muted>
							{r.value === null
								? l("Missing", "缺失")
								: l("Observed", "有观测")}
						</SvgText>
					</g>
				);
			})}
		</>
	);
}
export function RecapMetricScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [metric, setMetric] = useState<RecapMetric>("volume");
	const [claim, setClaim] = useState<RecapMetric>("volume");
	const [selected, setSelected] = useState("R2");
	const source = recapSeries(data.packet, data.series, metric);
	const claimed = recapSeries(data.packet, data.series, claim);
	const row = source.rows.find((r) => r.id === selected) ?? source.rows[0];
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l("Comparable source chart", "可比来源图表")}
					height={425}
				>
					<Chart
						locale={locale}
						metric={metric}
						selected={selected}
						onSelect={setSelected}
					/>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Chart metric", "图表指标")}
				value={metric}
				options={[
					["volume", l("Contracts traded", "成交张数")],
					["premium", l("Premium in USD", "美元权利金")],
				]}
				onChange={(v) => setMetric(v as RecapMetric)}
			/>
			<SelectField
				label={l("Claim quantity", "结论量")}
				value={claim}
				options={[
					["volume", l("Observed contract count", "观测合约张数")],
					["premium", l("Observed premium subtotal", "观测权利金小计")],
				]}
				onChange={(v) => setClaim(v as RecapMetric)}
			/>
			<p data-recap-row>
				{row.id} · {row.strike} · {format(row.value, metric)}{" "}
				{metric === "volume" ? l("contracts", "张") : "USD"}
			</p>
			<p data-recap-claim>
				{claim === "volume"
					? l(
							`${format(claimed.subtotal, claim)} contracts observed across R1/R2; R3 is missing.`,
							`R1/R2 观测 ${format(claimed.subtotal, claim)} 张；R3 缺失。`,
						)
					: l(
							`${format(claimed.subtotal, claim)} premium observed across R1/R2; R3 is missing.`,
							`R1/R2 观测权利金 ${format(claimed.subtotal, claim)}；R3 缺失。`,
						)}
			</p>
			<p data-recap-match>
				{metric === claim
					? l("Chart quantity matches the sample claim", "图表量与示例结论匹配")
					: l(
							"The packet supports the sample number, but this chart shows a different quantity",
							"研究包支持示例数值，但此图表显示另一种量",
						)}
			</p>
			<p>
				{l("Full-universe total", "完整范围总量")}:{" "}
				{format(claimed.fullTotal, claim)}
			</p>
			<Note>
				{l(
					"Volume is 10 versus 20 contracts; premium is $2,000 versus $6,000. They answer different questions and need their own units. Switching the chart does not change the source facts or turn a premium bar into evidence for a volume comparison.",
					"成交量为 10 对 20 张，权利金为 $2,000 对 $6,000。它们回答不同问题，需保留各自单位。切换图表不改变来源事实，也不会让权利金柱支持成交量比较。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{data.packet.method.universe}
				<br />
				{l(
					"Strike labels are linked explicitly to source row IDs in this teaching chart. R3 has a missing marker, never a zero-height observed bar. These are partial observations, not a full-universe superlative or forecast.",
					"此教学图明确将行权价标签关联来源行 ID。R3 使用缺失标记，不是观测为零的柱。这些是部分观测，不是完整范围最高等结论或预测。",
				)}
			</p>
		</SceneLayout>
	);
}
export function RecapAxisScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const replay = useFrames(data.axisFrames.length);
	const [manual, setManual] = useState<number | null>(null);
	const minimum = manual ?? data.axisFrames[replay.frame];
	const [selected, setSelected] = useState("R2");
	const result = recapSeries(data.packet, data.series, "volume");
	const a = result.rows[0].value as number;
	const b = result.rows[1].value as number;
	const enabled = useLessonMotion();
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Axis crop demonstration with unchanged values",
						"数值不变的轴裁切演示",
					)}
					height={465}
				>
					<Chart
						locale={locale}
						metric="volume"
						selected={selected}
						onSelect={setSelected}
						minimum={minimum}
						animate={enabled && replay.playing}
					/>
					<SvgText x={180} y={432}>
						{minimum === 0
							? l("Zero-based bars", "从零起的柱形")
							: l("Truncated-axis demonstration", "截断轴演示")}
					</SvgText>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<RangeControl
				label={l("Bar-axis minimum", "柱轴下限")}
				value={minimum}
				display={String(minimum)}
				min={0}
				max={9}
				step={1}
				onChange={(v) => {
					replay.select(replay.frame);
					setManual(v);
				}}
			/>
			<PlaybackButton
				playing={replay.playing}
				onClick={() => {
					setManual(null);
					replay.toggle();
				}}
				l={l}
			/>
			<p data-recap-actual-ratio>
				{l("Actual R2 / R1 values", "实际 R2 / R1 数值")}: {number(b / a)}×
			</p>
			<p data-recap-height-ratio>
				{l("Visible bar-height ratio", "可见柱高比")}:{" "}
				{number(apparentBarRatio(b, a, minimum))}×
			</p>
			<p data-recap-axis-total>
				{l("Observed contracts stay fixed", "观测张数保持固定")}:{" "}
				{number(result.subtotal)}
			</p>
			<Note>
				{l(
					"At a zero baseline, values 20 and 10 have both a value ratio and bar-height ratio of 2×. Starting at 9 makes the visible heights 11 and 1, or 11×, while the actual ratio stays 2×. Correct labels do not repair misleading geometry.",
					"从零起时，20 与 10 的数值比、柱高比均为 2×。从 9 起使可见高度为 11 与 1，即 11×，但实际比仍为 2×。正确标签不能修复误导几何。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"This deliberately marked crop illustrates a presentation defect. For magnitude bars, use a zero baseline or clearly explain any crop and its limits. Playback changes only presentation; it does not add or remove observations.",
					"此明确标记的裁切演示展示呈现缺陷。幅度柱形应从零起，或明确说明裁切及限制。回放仅改变呈现，不增减观测。",
				)}
			</p>
		</SceneLayout>
	);
}
export function RecapComposeScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const language = locale === "zh" ? 1 : 0;
	const [headline, setHeadline] = useState("observed");
	const [included, setIncluded] = useState(
		data.captionFields.filter((f) => f.id !== "coverage").map((f) => f.id),
	);
	const missing = data.captionFields.filter((f) => !included.includes(f.id));
	const labels = {
		observed: l(
			"30 contracts observed in covered TAU calls; R3 is missing.",
			"已覆盖 TAU 看涨观测 30 张；R3 缺失。",
		),
		full: l(
			"All TAU call activity totaled 30 contracts.",
			"全部 TAU 看涨活动共 30 张。",
		),
		positions: l(
			"30 new bullish positions were opened.",
			"新增了 30 张看涨持仓。",
		),
		forecast: l(
			"This activity means TAU will rally.",
			"此活动意味着 TAU 将上涨。",
		),
	};
	const verdict =
		headline === "observed"
			? l(
					"Supported as a bounded description of the supplied rows",
					"作为给定行的有边界描述可获支持",
				)
			: headline === "full"
				? l(
						"Overstates coverage: the complete total is unavailable",
						"夸大覆盖：完整总量不可用",
					)
				: headline === "positions"
					? l(
							"Opening positions and participant intent were not established",
							"未确定开仓与参与者意图",
						)
					: l(
							"No validated forecast is supplied by these rows",
							"这些行未提供已验证预测",
						);
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Sample headline and caption requirements",
						"示例标题与图注要求",
					)}
					height={465}
				>
					<foreignObject x={25} y={25} width={310} height={115}>
						<div className="flex h-full items-center rounded-xl border p-4 font-medium text-sm leading-relaxed">
							{labels[headline as keyof typeof labels]}
						</div>
					</foreignObject>
					{data.captionFields.map((f, i) => (
						<g key={f.id}>
							<rect
								x={25}
								y={166 + i * 65}
								width={310}
								height={54}
								rx={10}
								fill={
									included.includes(f.id) ? "var(--primary)" : "currentColor"
								}
								opacity={included.includes(f.id) ? 0.18 : 0.04}
							/>
							<foreignObject x={25} y={166 + i * 65} width={310} height={54}>
								<button
									type="button"
									className="h-full w-full rounded-lg text-center text-sm"
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
			<SelectField
				label={l("Sample headline", "示例标题")}
				value={headline}
				options={[
					["observed", l("Bounded observed claim", "有边界观测结论")],
					["full", l("Full-universe overclaim", "完整范围过度结论")],
					["positions", l("Position/intent inference", "持仓/意图推断")],
					["forecast", l("Forecast overclaim", "预测过度结论")],
				]}
				onChange={setHeadline}
			/>
			<p data-recap-verdict>{verdict}</p>
			<button
				type="button"
				className="rounded-xl border px-4 py-3 text-sm"
				onClick={() => setHeadline("observed")}
			>
				{l("Repair to the supported sample", "修复为受支持示例")}
			</button>
			<div className="rounded-2xl border p-4 text-sm leading-relaxed">
				<strong>{l("Caption preview", "图注预览")}</strong>
				<p data-recap-caption>
					{data.captionFields
						.filter((f) => included.includes(f.id))
						.map((f) => f.value[language])
						.join(" · ") || "—"}
				</p>
			</div>
			<p data-recap-caption-status>
				{missing.length
					? `${l("Caption still lacks", "图注仍缺少")}: ${missing.map((f) => f.label[language]).join(" · ")}`
					: l(
							"Caption fields present; review wording and source fidelity",
							"图注字段齐备；仍需审核措辞及来源一致性",
						)}
			</p>
			<Note>
				{l(
					"This sample caption belongs to a zero-based contract-count chart. A chart can circulate without the surrounding prose. Keep source, date, axes/units and missingness in its own caption. Repair only the unsupported claim: the valid observed count of 30 is retained. Stronger wording does not turn a descriptive packet into a position report or forecast.",
					"此示例图注对应从零起的合约张数图。图表可能脱离周围文字传播。其图注应包含来源、日期、坐标/单位与缺失。仅修复无依据结论，保留有效观测数 30。加强措辞不会让描述研究包变成持仓报告或预测。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"These checks apply only to fixed teaching templates, not arbitrary written headlines. This sample is not saved or published. The following exercise preserves your actual writing for self or human review and does not automatically certify prose quality.",
					"这些检查仅针对固定教学模板，不针对任意标题。此样例不保存或发布。后续练习保留你的实际写作供自评或人工审核，不自动认证文字质量。",
				)}
			</p>
		</SceneLayout>
	);
}
