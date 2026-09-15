import * as m from "motion/react-m";
import { createContext, useContext, useState } from "react";
import {
	attributionTotal,
	benchmarkDifferences,
	closedTradeStats,
	flowReturns,
	type PerformanceConceptData,
} from "@/domain/learning/performance-concept";
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
import { useGuidedState } from "./visual-playback";
export const PerformanceData = createContext<PerformanceConceptData | null>(
	null,
);
function useData() {
	const data = useContext(PerformanceData);
	if (!data) throw new Error("Performance scenes require teaching data");
	return data;
}
type Props = { locale: Locale };
const copy = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const n = (v: number) =>
	v.toLocaleString("en-US", { maximumFractionDigits: 2 });
const money = (v: number | null) =>
	v === null ? "—" : `${v < 0 ? "−" : ""}$${n(Math.abs(v) / 100)}`;
const pct = (v: number | null) => (v === null ? "—" : `${n(v * 100)}%`);
export function FlowReturnScene({ locale }: Props) {
	const data = useData();
	const f = data.flow;
	const l = copy(locale);
	const motion = useLessonMotion();
	const replay = useFrames(f.frames.length);
	const [manual, setManual] = useGuidedState<number | null>(f.defaultFlow, [
		null,
		null,
		null,
	]);
	const [known, setKnown] = useState("known");
	const flow = manual ?? f.frames[replay.frame];
	const r = flowReturns(
		f.startCents,
		known === "known" ? f.beforeCents : null,
		flow,
		f.endCents,
	);
	const values = [
		f.startCents,
		known === "known" ? f.beforeCents : null,
		r.after,
		f.endCents,
	];
	const labels = [
		l("Start", "期初"),
		l("Before", "资金流前"),
		l("After", "资金流后"),
		l("End", "期末"),
	];
	const stop = () => {
		replay.select(replay.frame);
		setManual(flow);
	};
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Valuations around external cash flow",
						"外部资金流前后的估值",
					)}
					height={365}
				>
					<line
						x1={38}
						x2={322}
						y1={270}
						y2={270}
						stroke="currentColor"
						opacity={0.2}
					/>
					{values.map((v, i) => {
						const x = 45 + i * 90;
						const y = 270 - ((v ?? 0) / 300000) * 200;
						return (
							<g key={labels[i]}>
								<SvgText x={x} y={305}>
									{labels[i]}
								</SvgText>
								<SvgText x={x} y={330}>
									{money(v)}
								</SvgText>
								{v !== null &&
									(motion && replay.playing ? (
										<m.circle
											cx={x}
											cy={y}
											r={8}
											fill="var(--primary)"
											initial={false}
											animate={{ cy: y }}
											transition={lessonTransition}
										/>
									) : (
										<circle cx={x} cy={y} r={8} fill="var(--primary)" />
									))}
								{i > 0 && v !== null && values[i - 1] !== null && (
									<line
										x1={x - 90}
										x2={x}
										y1={270 - ((values[i - 1] as number) / 300000) * 200}
										y2={y}
										stroke={i === 2 ? "var(--chart-3)" : "var(--primary)"}
										strokeWidth={2}
										strokeDasharray={i === 2 ? "5 5" : undefined}
									/>
								)}
							</g>
						);
					})}
					<SvgText x={180} y={30}>
						{l("Dashed jump = external cash flow", "虚线跳变 = 外部资金流")}
					</SvgText>
				</Diagram>
			}
			outcome={
				<>
					<div className="scene-outcome-card">
						<p className="scene-outcome-label">{l("TWR", "时间加权收益")}</p>
						<p className="scene-outcome-value">{pct(r.twr)}</p>
					</div>
					<div className="scene-outcome-card">
						<p className="scene-outcome-label">
							{l("Raw balance growth", "原始余额增长")}
						</p>
						<p className="scene-outcome-value">{pct(r.growth)}</p>
					</div>
					<div className="scene-outcome-card">
						<p className="scene-outcome-label">{l("Cash flow", "资金流")}</p>
						<p className="scene-outcome-value">{money(flow)}</p>
					</div>
				</>
			}
		>
			<RangeControl
				inputScale={100}
				label={l("Hypothetical external flow", "假设外部资金流")}
				value={flow}
				display={money(flow)}
				min={-110000}
				max={150000}
				step={10000}
				onChange={(v) => {
					stop();
					setManual(v);
				}}
			/>
			<SelectField
				label={l("Boundary valuation evidence", "边界估值证据")}
				value={known}
				options={[
					["known", l("Before-flow value supplied", "提供资金流前估值")],
					["missing", l("Before-flow value missing", "缺少资金流前估值")],
				]}
				onChange={(v) => {
					stop();
					setKnown(v);
				}}
			/>
			<PlaybackButton
				playing={replay.playing}
				l={l}
				onClick={() => {
					setManual(null);
					replay.toggle();
				}}
			/>
			<div aria-live="polite" className="space-y-2 rounded-xl border p-4">
				<p>
					{l("First period", "第一期")}: {pct(r.first)} ·{" "}
					{l("Second period", "第二期")}: {pct(r.second)}
				</p>
				<p data-performance-twr>TWR: {pct(r.twr)}</p>
				<p>
					{l("Raw balance growth", "原始余额增长")}: {pct(r.growth)}
				</p>
			</div>
			<p className="text-sm">
				{l(
					"TWR = (1 + first return) × (1 + second return) − 1. A deposit is positive; a withdrawal is negative. The cash-flow jump is excluded from return. Missing boundaries or a nonpositive return denominator withhold TWR.",
					"TWR = (1 + 第一期收益) × (1 + 第二期收益) − 1。存入为正，取出为负。资金流跳变不计收益。边界缺失或收益分母非正时不提供 TWR。",
				)}
			</p>
			<p className="text-muted-foreground text-xs">
				{data.source}
				<br />
				{f.spec.start} → {f.spec.end} · USD
				<br />
				{f.flowAt}
				<br />
				{l(
					"Fixed hypothetical checkpoints; net of declared costs, income included. Changing flow changes the implied return, not the end value.",
					"固定假设检查点；扣除声明成本，包含收入。改变资金流会改变隐含收益，不改变期末估值。",
				)}
			</p>
		</SceneLayout>
	);
}
export function TradePayoffScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const motion = useLessonMotion();
	const replay = useFrames(data.lossFrames.length);
	const [manual, setManual] = useGuidedState<number | null>(10000, [
		null,
		null,
		null,
	]);
	const [coverage, setCoverage] = useState("all");
	const loss = manual ?? data.lossFrames[replay.frame];
	const trades = data.trades.map((t, i) => ({
		...t,
		pnlCents: i === 4 ? (coverage === "all" ? -loss : null) : t.pnlCents,
	}));
	const r = closedTradeStats(trades);
	const stop = () => {
		replay.select(replay.frame);
		setManual(loss);
	};
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l("Closed lot profit and loss bars", "已平仓批次盈亏柱形图")}
					height={385}
				>
					<SvgText x={180} y={28}>
						{l(
							"Each bar = one closed lot · USD",
							"每柱 = 一个已平仓批次 · 美元",
						)}
					</SvgText>
					<line
						x1={20}
						x2={340}
						y1={135}
						y2={135}
						stroke="currentColor"
						opacity={0.4}
					/>
					{trades.map((t, i) => {
						const h = (Math.abs(t.pnlCents ?? 0) / 20000) * 160;
						const y = i === 4 ? 135 : 135 - h;
						return (
							<g key={t.id}>
								{t.pnlCents !== null &&
									(motion && replay.playing ? (
										<m.rect
											x={35 + i * 63}
											y={y}
											width={36}
											height={h}
											fill={i === 4 ? "var(--chart-3)" : "var(--primary)"}
											initial={false}
											animate={{ height: h }}
											transition={lessonTransition}
										/>
									) : (
										<rect
											x={35 + i * 63}
											y={y}
											width={36}
											height={h}
											fill={i === 4 ? "var(--chart-3)" : "var(--primary)"}
										/>
									))}
								<SvgText x={53 + i * 63} y={325}>
									{t.id}
								</SvgText>
								<SvgText x={53 + i * 63} y={351}>
									{money(t.pnlCents)}
								</SvgText>
							</g>
						);
					})}
				</Diagram>
			}
		>
			<RangeControl
				inputScale={100}
				label={l("Fifth lot loss", "第五批次亏损")}
				value={loss}
				display={money(loss)}
				min={0}
				max={20000}
				step={1000}
				onChange={(v) => {
					stop();
					setManual(v);
				}}
			/>
			<SelectField
				label={l("Closed-lot coverage", "已平仓批次覆盖")}
				value={coverage}
				options={[
					["all", l("All five outcomes known", "五次结果均已知")],
					["missing", l("Fifth outcome missing", "第五次结果缺失")],
				]}
				onChange={(v) => {
					stop();
					setCoverage(v);
				}}
			/>
			<PlaybackButton
				l={l}
				playing={replay.playing}
				onClick={() => {
					setManual(null);
					replay.toggle();
				}}
			/>
			<div
				aria-live="polite"
				className="space-y-2 rounded-xl border p-4"
				data-performance-trades
			>
				<p>
					{l("Win rate", "胜率")}: {pct(r.winRate)}
				</p>
				<p>
					{l("Total P&L", "总盈亏")}: {money(r.total)}
				</p>
				<p>
					{l("Average win / loss magnitude", "平均盈利 / 亏损绝对值")}:{" "}
					{money(r.averageWin)} / {money(r.averageLoss)}
				</p>
				<p>
					{l("Profit factor", "盈利因子")}:{" "}
					{r.profitFactor === null ? "—" : n(r.profitFactor)}
				</p>
				<p>
					{l("Known subtotal", "已知小计")}: {money(r.subtotal)} ·{" "}
					{r.knownCount}/{r.requiredCount}
				</p>
			</div>
			<p className="text-sm">
				{l(
					"Profit factor = gross gains ÷ absolute gross losses. Zero losses leave that ratio undefined. A breakeven lot stays in the win-rate denominator. Missing outcomes withhold complete-sample metrics.",
					"盈利因子 = 盈利总额 ÷ 亏损总额绝对值。亏损为零时该比率未定义。保本批次保留在胜率分母中。缺失结果时不提供完整样本指标。",
				)}
			</p>
			<p className="text-muted-foreground text-xs">
				{l(
					"Synthetic five-lot sample, FIFO, net of declared costs. Four A lots and one B lot; not the full account or a forecast.",
					"模拟五批次样本，FIFO，扣除声明成本。四个 A 批次与一个 B 批次；不是完整账户或预测。",
				)}
			</p>
		</SceneLayout>
	);
}
export function PerformanceEvidenceScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [id, setId] = useState("matched");
	const [coverage, setCoverage] = useGuidedState("partial", [
		"partial",
		"complete",
		"partial",
	]);
	const b = data.benchmarks.find((b) => b.id === id) ?? data.benchmarks[0];
	const differences = benchmarkDifferences(data.flow.spec, b.spec);
	const f = data.flow;
	const twr = flowReturns(
		f.startCents,
		f.beforeCents,
		f.defaultFlow,
		f.endCents,
	).twr;
	const comparable =
		differences.length === 0 && b.returnRate !== null && twr !== null;
	const rows =
		coverage === "partial" ? data.attribution : data.completeAttribution;
	const r = attributionTotal(rows);
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Benchmark compatibility and separate dollar attribution",
						"基准兼容性及独立美元归因",
					)}
					height={390}
				>
					<SvgText x={180} y={35}>
						{l("Original TWR", "原始 TWR")}: {pct(twr)}
					</SvgText>
					<SvgText x={180} y={70}>
						{l("Reported benchmark", "报告基准")}: {pct(b.returnRate)}
					</SvgText>
					<line
						x1={55}
						x2={305}
						y1={105}
						y2={105}
						stroke={comparable ? "var(--primary)" : "var(--chart-3)"}
						strokeWidth={4}
						strokeDasharray={comparable ? undefined : "6 6"}
					/>
					<SvgText x={180} y={140}>
						{comparable
							? l("Compatible supplied methods", "提供的方法兼容")
							: l("Comparison evidence incomplete", "比较证据不完整")}
					</SvgText>
					<SvgText x={180} y={200}>
						{l("Separate realized P&L · USD", "独立已实现盈亏 · 美元")}
					</SvgText>
					{rows.map((row, i) => (
						<g key={row.symbol}>
							<rect
								x={20 + i * 110}
								y={225}
								width={100}
								height={95}
								rx={12}
								fill="currentColor"
								opacity={0.06}
							/>
							<SvgText x={70 + i * 110} y={255}>
								{row.symbol}
							</SvgText>
							<SvgText x={70 + i * 110} y={290}>
								{money(row.pnlCents)}
							</SvgText>
						</g>
					))}
					<SvgText x={180} y={355}>
						{r.knownCount}/{r.requiredCount}{" "}
						{l("symbol outcomes supplied", "标的结果已提供")}
					</SvgText>
				</Diagram>
			}
		>
			<SelectField
				label={l("Benchmark record", "基准记录")}
				value={id}
				options={data.benchmarks.map((b) => [
					b.id,
					b.label[locale === "zh" ? 1 : 0],
				])}
				onChange={setId}
			/>
			<div
				aria-live="polite"
				data-performance-comparison
				className="rounded-xl border p-4"
			>
				<p>
					{l("Like-for-like difference", "同口径差异")}:{" "}
					{comparable
						? n(((twr as number) - (b.returnRate as number)) * 100) +
							l(" percentage points", " 个百分点")
						: "—"}
				</p>
				<p className="text-sm">
					{differences.length
						? l("Reconcile mismatched fields: ", "需协调不匹配字段：") +
							differences.join(", ")
						: b.returnRate === null
							? l("Benchmark return missing", "基准收益缺失")
							: l(
									"Dates, currency, costs and income basis match.",
									"日期、币种、成本及收入口径一致。",
								)}
				</p>
			</div>
			<p className="text-muted-foreground text-xs">
				{b.spec.start} → {b.spec.end} · {b.spec.currency}
				<br />
				{b.spec.fees} · {b.spec.basis}
			</p>
			<SelectField
				label={l("Symbol attribution coverage", "标的归因覆盖")}
				value={coverage}
				options={[
					["partial", l("C result missing", "C 结果缺失")],
					["complete", l("Supply C aggregate +$50", "提供 C 汇总 +$50")],
				]}
				onChange={setCoverage}
			/>
			<div aria-live="polite" data-performance-attribution>
				<p>
					{l("Known realized subtotal", "已知已实现小计")}: {money(r.subtotal)}
				</p>
				<p>
					{l("Complete declared-symbol total", "声明标的完整合计")}:{" "}
					{money(r.total)}
				</p>
			</div>
			<p className="text-sm">
				{l(
					"Uses the original 15.5% return and original A/B closed sample, independent of earlier what-if controls. Realized dollars are not TWR. The C aggregate provides no trade count, so the five-lot win rate cannot represent the full account. Unreconciled comparisons need adjustment or explicit qualification.",
					"使用原始 15.5% 收益及原始 A/B 平仓样本，独立于前面的假设控件。已实现美元盈亏不是 TWR。C 汇总不提供交易次数，因此五批次胜率不能代表完整账户。未协调比较需要调整或明确限定。",
				)}
			</p>
		</SceneLayout>
	);
}
