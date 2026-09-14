import * as m from "motion/react-m";
import { createContext, useContext, useState } from "react";
import {
	exposureSum,
	localExposureScenario,
	type PortfolioExposureData,
	positionExposure,
} from "@/domain/learning/portfolio-exposure-concept";
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
export const PortfolioExposureContext =
	createContext<PortfolioExposureData | null>(null);
function useData() {
	const data = useContext(PortfolioExposureContext);
	if (!data) throw Error("Exposure scenes require teaching data");
	return data;
}
type Props = { locale: Locale };
const copy = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const num = (v: number | null) =>
	v === null ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: 2 });
const money = (v: number) => `${v < 0 ? "−" : ""}$${num(Math.abs(v))}`;
function Source({ locale }: Props) {
	const data = useData();
	return (
		<p className="text-muted-foreground text-xs">
			{data.source}
			<br />
			{data.underlying} · {data.at}
			<br />
			{copy(locale)(
				"Synthetic USD model sensitivities. All positions share the same underlying; no connected account or executable hedge is implied.",
				"模拟美元模型敏感度。所有持仓属于同一标的；不代表已连接账户或可执行对冲。",
			)}
		</p>
	);
}
export function ExposureCoverageScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const enabled = useLessonMotion();
	const replay = useFrames(data.hedgeFrames.length);
	const [manual, setManual] = useState<number | null>(0);
	const [coverage, setCoverage] = useState("missing");
	const hedge = manual ?? data.hedgeFrames[replay.frame];
	const call = positionExposure(data.calls, data.at).delta;
	const put =
		coverage === "known" ? positionExposure(data.put, data.at).delta : null;
	const values = [data.stock + hedge, call, put];
	const sum = exposureSum(values);
	const labels = [
		l("Stock", "股票"),
		l("Short calls", "看涨空头"),
		l("Long put", "看跌多头"),
	];
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Signed delta contributions and coverage",
						"带符号 Delta 贡献与覆盖",
					)}
					height={375}
				>
					<SvgText x={180} y={30}>
						{l("Delta · shares-equivalent", "Delta · 股等价量")}
					</SvgText>
					<line
						x1={180}
						x2={180}
						y1={65}
						y2={265}
						stroke="currentColor"
						opacity={0.3}
					/>
					{values.map((v, i) => {
						const w = Math.abs(v ?? 0) * 0.9;
						return (
							<g key={labels[i]}>
								<SvgText x={180} y={60 + i * 77}>
									{labels[i]}: {num(v)}
								</SvgText>
								{v !== null &&
									(enabled && replay.playing ? (
										<m.rect
											x={v < 0 ? 180 - w : 180}
											y={72 + i * 77}
											width={w}
											height={19}
											rx={4}
											fill={v < 0 ? "var(--chart-3)" : "var(--primary)"}
											initial={false}
											animate={{ width: w }}
											transition={lessonTransition}
										/>
									) : (
										<rect
											x={v < 0 ? 180 - w : 180}
											y={72 + i * 77}
											width={w}
											height={19}
											rx={4}
											fill={v < 0 ? "var(--chart-3)" : "var(--primary)"}
										/>
									))}
								{v === null && (
									<SvgText x={180} y={95 + i * 77} muted>
										{l("Missing ≠ zero", "缺失 ≠ 零")}
									</SvgText>
								)}
							</g>
						);
					})}
					<SvgText x={180} y={310}>
						{l("Covered subtotal", "已覆盖小计")}: {num(sum.subtotal)}
					</SvgText>
					<SvgText x={180} y={345}>
						{l("Whole declared portfolio", "声明完整组合")}: {num(sum.total)}
					</SvgText>
				</Diagram>
			}
		>
			<RangeControl
				inputScale={1}
				label={l("Hypothetical stock adjustment", "假设股票调整")}
				value={hedge}
				display={`${num(hedge)} ${l("shares", "股")}`}
				min={-100}
				max={100}
				step={10}
				onChange={(v) => {
					replay.select(replay.frame);
					setManual(v);
				}}
			/>
			<SelectField
				label={l("Third holding evidence", "第三项持仓证据")}
				value={coverage}
				options={[
					["missing", l("Put sensitivity missing", "看跌敏感度缺失")],
					["known", l("Supply put delta −0.30", "提供看跌 Delta −0.30")],
				]}
				onChange={(v) => {
					replay.select(replay.frame);
					setManual(hedge);
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
				data-exposure-coverage
				className="space-y-2 rounded-xl border p-4"
			>
				<p>
					{l("Covered delta", "已覆盖 Delta")}: {num(sum.subtotal)} ·{" "}
					{sum.known}/{sum.required}
				</p>
				<p>
					{l("Complete delta", "完整 Delta")}: {num(sum.total)}
				</p>
				<p>
					{l("Offset covered subtotal", "抵消已覆盖小计")}:{" "}
					{num(sum.subtotal === null ? null : -sum.subtotal)}{" "}
					{l("additional shares", "额外股数")}
				</p>
			</div>
			<p className="text-sm">
				{l(
					"Original: 100 shares + (−2 × 100 × 0.40) = +20. Selling 20 shares offsets only the covered delta. Reveal the put: its −30 contribution changes the total. Buy is positive; sell is negative. Model delta and assignment exposure remain distinct.",
					"原始：100 股 + (−2 × 100 × 0.40) = +20。卖 20 股只抵消已覆盖 Delta。揭示看跌期权：其 −30 贡献改变合计。买入为正，卖出为负。模型 Delta 与被指派敞口仍不同。",
				)}
			</p>
			<Source locale={locale} />
		</SceneLayout>
	);
}
export function ExposureRiskScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const enabled = useLessonMotion();
	const replay = useFrames(data.moveFrames.length);
	const [manual, setManual] = useState<number | null>(0);
	const [iv, setIv] = useState(0);
	const [days, setDays] = useState(0);
	const move = manual ?? data.moveFrames[replay.frame];
	const call = positionExposure(data.calls, data.at);
	const delta = 0;
	const gamma = call.gamma as number;
	const theta = call.theta as number;
	const vega = call.vega as number;
	const result = localExposureScenario(
		delta,
		gamma,
		theta,
		vega,
		move,
		iv,
		days,
	);
	const stop = () => {
		replay.select(replay.frame);
		setManual(move);
	};
	const curve = Array.from({ length: 41 }, (_, i) => {
		const x = -1 + i / 20;
		return `${i === 0 ? "M" : "L"}${180 + x * 125},${110 - (0.5 * gamma * x * x) * 55}`;
	}).join(" ");
	const marker = { cx: 180 + move * 125, cy: 110 - result.gammaTerm * 55 };
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Local curvature despite zero starting delta",
						"起始 Delta 为零仍有局部曲率",
					)}
					height={355}
				>
					<SvgText x={180} y={28}>
						{l("Spot-only local P&L · USD", "仅现价局部盈亏 · 美元")}
					</SvgText>
					<line
						x1={40}
						x2={320}
						y1={110}
						y2={110}
						stroke="currentColor"
						opacity={0.3}
					/>
					<path d={curve} fill="none" stroke="var(--chart-3)" strokeWidth={3} />
					{enabled && replay.playing ? (
						<m.circle
							{...marker}
							r={7}
							fill="var(--primary)"
							initial={false}
							animate={marker}
							transition={lessonTransition}
						/>
					) : (
						<circle {...marker} r={7} fill="var(--primary)" />
					)}
					<SvgText x={55} y={255}>
						−$1
					</SvgText>
					<SvgText x={180} y={255}>
						$0
					</SvgText>
					<SvgText x={305} y={255}>
						+$1
					</SvgText>
					<SvgText x={180} y={284}>
						{l("Underlying move", "标的变动")}
					</SvgText>
					<SvgText x={180} y={323}>
						{l("Local next delta", "局部新 Delta")}: {num(result.nextDelta)}
					</SvgText>
				</Diagram>
			}
		>
			<RangeControl
				inputScale={1}
				label={l("Small underlying move", "标的小幅变动")}
				value={move}
				display={money(move)}
				min={-1}
				max={1}
				step={0.25}
				onChange={(v) => {
					stop();
					setManual(v);
				}}
			/>
			<RangeControl
				inputScale={1}
				label={l("IV change in percentage points", "IV 变化百分点")}
				value={iv}
				display={`${num(iv)} pp`}
				min={-1}
				max={1}
				step={0.25}
				onChange={(v) => {
					stop();
					setIv(v);
				}}
			/>
			<RangeControl
				inputScale={1}
				label={l("Elapsed calendar days", "经过日历天数")}
				value={days}
				display={num(days)}
				min={0}
				max={1}
				step={1}
				onChange={(v) => {
					stop();
					setDays(v);
				}}
			/>
			<PlaybackButton
				l={l}
				playing={replay.playing}
				onClick={() => {
					setManual(null);
					setIv(0);
					setDays(0);
					replay.toggle();
				}}
			/>
			<div
				aria-live="polite"
				data-exposure-risk
				className="space-y-1 rounded-xl border p-4"
			>
				<p>
					Delta: {money(result.deltaTerm)} · Gamma: {money(result.gammaTerm)}
				</p>
				<p>
					Vega: {money(result.volTerm)} · Theta: {money(result.timeTerm)}
				</p>
				<p>
					{l("Combined local approximation", "合并局部近似")}:{" "}
					{money(result.total)}
				</p>
			</div>
			<p className="text-sm">
				{l(
					"Independent subset: 80 XYZ shares and 2 short calls; the third holding is excluded. Initial delta 0, gamma −4 shares/$, theta +$6/calendar day, vega −$24/IV point. P&L ≈ Δ·dS + ½Γ·dS² + V·dIV + Θ·dt. The curve shows spot terms only. Other controls change the separate combined estimate.",
					"独立子集：80 股 XYZ 与 2 张看涨空头；排除第三项持仓。起始 Delta 0，Gamma −4 股/美元，Theta +$6/日历天，Vega −$24/IV 百分点。盈亏 ≈ Δ·dS + ½Γ·dS² + V·dIV + Θ·dt。曲线只显示现价项，其余控件改变独立合并估计。",
				)}
			</p>
			<p className="text-muted-foreground text-sm">
				{l(
					"Frozen local Greeks, not repricing or a forecast. Cross effects, changing volatility surfaces, fees, funding, jumps and assignment are omitted. The same held stock hedge will not stay delta-neutral after a move.",
					"冻结局部希腊值，不是重新定价或预测。省略交叉效应、波动率曲面变化、费用、融资、跳跃和指派。现价变化后，同一股票对冲不会持续 Delta 中性。",
				)}
			</p>
			<Source locale={locale} />
		</SceneLayout>
	);
}
export function ExposureUnitsScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [scale, setScale] = useState("point");
	const [evidence, setEvidence] = useState("current");
	const raw = scale === "point" ? 0.12 : 12;
	const row = {
		...data.calls,
		at: evidence === "stale" ? "2030-09-15 14:00 UTC" : data.at,
		vegaScale: scale as "point" | "unit",
		greeks: { ...data.calls.greeks, vega: evidence === "missing" ? null : raw },
	};
	const result = positionExposure(row, data.at);
	const put = positionExposure(data.put, data.at);
	const sum = exposureSum([0, result.vega, put.vega]);
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l("Convert vega before aggregation", "合计前先换算 Vega")}
					height={360}
				>
					<SvgText x={180} y={35}>
						{l("One call quote", "单份看涨报价")}
					</SvgText>
					<SvgText x={180} y={70}>
						{evidence === "missing" ? "—" : `$${num(raw)}`} /{" "}
						{scale === "point"
							? l("IV point", "IV 百分点")
							: l("unit volatility", "单位波动率")}
					</SvgText>
					<line
						x1={180}
						x2={180}
						y1={90}
						y2={120}
						stroke="currentColor"
						opacity={0.4}
					/>
					<SvgText x={180} y={150}>
						{scale === "unit" ? "÷ 100 × (−2 × 100)" : "× (−2 × 100)"}
					</SvgText>
					<SvgText x={180} y={200}>
						{l("Current call position vega", "当前看涨持仓 Vega")}
					</SvgText>
					<SvgText x={180} y={238}>
						{result.vega === null ? "—" : money(result.vega)} /{" "}
						{l("IV point", "IV 百分点")}
					</SvgText>
					<SvgText x={180} y={295}>
						{l("Known put contribution", "已知看跌贡献")}:{" "}
						{money(put.vega as number)}
					</SvgText>
					<SvgText x={180} y={325}>
						{l("Stock vega", "股票 Vega")}: $0
					</SvgText>
				</Diagram>
			}
		>
			<SelectField
				label={l("Call vega quote scale", "看涨 Vega 报价尺度")}
				value={scale}
				options={[
					["point", l("$0.12 per 1 percentage point", "每 1 百分点 $0.12")],
					["unit", l("$12 per 1.00 volatility", "每 1.00 波动率 $12")],
				]}
				onChange={setScale}
			/>
			<SelectField
				label={l("Call snapshot evidence", "看涨快照证据")}
				value={evidence}
				options={[
					["current", l("Matching timestamp", "时间一致")],
					["stale", l("Previous-day timestamp", "前一天时间")],
					["missing", l("Vega missing", "Vega 缺失")],
				]}
				onChange={setEvidence}
			/>
			<div
				aria-live="polite"
				data-exposure-units
				className="space-y-2 rounded-xl border p-4"
			>
				<p>
					{l("Known current vega subtotal", "已知当前 Vega 小计")}:{" "}
					{num(sum.subtotal)} USD/pp
				</p>
				<p>
					{l("Complete current vega", "完整当前 Vega")}: {num(sum.total)} USD/pp
				</p>
				<p>
					{l("Current coverage", "当前覆盖")}: {sum.known}/{sum.required}
				</p>
			</div>
			<p className="text-sm">
				{l(
					"0.01 volatility = one percentage point. Both quotes describe the same sensitivity. Two short contracts × multiplier 100 reverse the sign. Stock vega is a known zero; unavailable or stale option vega is not. A −14 USD/point total requires all three holdings on the declared snapshot.",
					"0.01 波动率 = 一个百分点。两种报价描述同一敏感度。两张空头 × 乘数 100 会反转符号。股票 Vega 是已知零；不可用或陈旧的期权 Vega 不是。−14 美元/百分点合计需要三项持仓都属于声明快照。",
				)}
			</p>
			<p className="text-muted-foreground text-xs">
				{l("Call source time", "看涨来源时间")}: {row.at}
				<br />
				{l("Target snapshot", "目标快照")}: {data.at}
			</p>
			<Source locale={locale} />
		</SceneLayout>
	);
}
