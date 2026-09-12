import * as m from "motion/react-m";
import { createContext, type ReactNode, useContext, useState } from "react";
import {
	conditionalHedge,
	type RegimeConceptData,
	regimeTotals,
	sampledFlips,
} from "@/domain/learning/regime-concept";
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
import {
	instantTransition,
	lessonTransition,
	useLessonMotion,
} from "./lesson-motion";
export const RegimeData = createContext<RegimeConceptData | null>(null);
function useData() {
	const data = useContext(RegimeData);
	if (!data) throw new Error("Regime scenes require authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const copy = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const number = (v: number | null) =>
	v === null
		? "—"
		: (v === 0 ? 0 : v).toLocaleString("en-US", { maximumFractionDigits: 2 });
const signed = (v: number | null) =>
	v === null ? "—" : `${v > 0 ? "+" : ""}${number(v)}`;
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
			{data.symbol} · {data.asOf}
			<br />
			{copy(locale)(
				"Synthetic supplied positions and model samples",
				"模拟给定持仓与模型样本",
			)}
		</p>
	);
}
export function RegimeHedgeScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [id, setId] = useState(data.portfolios[0].id);
	const replay = useFrames(data.moves.length);
	const [manual, setManual] = useState<number | null>(null);
	const move = manual ?? data.moves[replay.frame];
	const portfolio =
		data.portfolios.find((p) => p.id === id) ?? data.portfolios[0];
	const totals = regimeTotals(portfolio.components);
	const result = conditionalHedge(totals?.net ?? null, move);
	const enabled = useLessonMotion();
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Local delta change and offsetting hedge",
						"局部 Delta 变化及抵消对冲",
					)}
					height={465}
				>
					<SvgText x={180} y={34}>
						{l("Underlying change", "标的变动")}: ${signed(move / 100)}
					</SvgText>
					<line
						x1={38}
						x2={322}
						y1={77}
						y2={77}
						stroke="currentColor"
						opacity={0.25}
					/>
					<m.circle
						cx={180 + move * 1.42}
						cy={77}
						r={7}
						fill="var(--primary)"
						stroke="currentColor"
						initial={false}
						animate={{ cx: 180 + move * 1.42 }}
						transition={
							enabled && replay.playing ? lessonTransition : instantTransition
						}
					/>
					<SvgText x={40} y={105} muted>
						−$1
					</SvgText>
					<SvgText x={180} y={105} muted>
						$0
					</SvgText>
					<SvgText x={320} y={105} muted>
						+$1
					</SvgText>
					{[
						{
							label: l("Portfolio delta change", "组合 Delta 变化"),
							value: result?.deltaChange ?? null,
							key: "delta",
						},
						{
							label: l("Neutral hedge adjustment", "中性对冲调整"),
							value: result?.hedgeChange ?? null,
							key: "hedge",
						},
					].map((row, i) => {
						const y = 160 + i * 115;
						const width =
							row.value === null ? 0 : (Math.abs(row.value) / 200) * 138;
						return (
							<g key={row.key}>
								<SvgText x={180} y={y - 20}>
									{row.label}
								</SvgText>
								<line
									x1={180}
									x2={180}
									y1={y - 6}
									y2={y + 26}
									stroke="currentColor"
								/>
								<g
									transform={
										(row.value ?? 0) < 0
											? "translate(360 0) scale(-1 1)"
											: undefined
									}
								>
									<m.rect
										x={180}
										y={y}
										width={width}
										height={20}
										rx={4}
										fill="var(--primary)"
										initial={false}
										animate={{ width }}
										transition={
											enabled && replay.playing
												? lessonTransition
												: instantTransition
										}
									/>
								</g>
								<g data-regime-result={row.key}>
									<SvgText x={180} y={y + 55} strong>
										{signed(row.value)}
									</SvgText>
								</g>
							</g>
						);
					})}
					<SvgText x={180} y={388}>
						{l("Shares · buy + / sell −", "股 · 买 + / 卖 −")}
					</SvgText>
					<SvgText x={180} y={431} muted>
						{l(
							"Conditional target, not an order fill",
							"条件性目标，不是订单成交",
						)}
					</SvgText>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Stated portfolio", "给定组合")}
				value={id}
				options={data.portfolios.map((p) => [
					p.id,
					p.label[locale === "zh" ? 1 : 0],
				])}
				onChange={(v) => {
					replay.select(replay.frame);
					setId(v);
				}}
			/>
			<RangeControl
				label={l("Underlying move in cents", "标的变动（美分）")}
				value={move}
				display={`$${signed(move / 100)}`}
				min={data.moveRange[0]}
				max={data.moveRange[1]}
				step={10}
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
			<p>{portfolio.scope[locale === "zh" ? 1 : 0]}</p>
			<p data-regime-net>
				{l("Net sensitivity", "净敏感度")}: {signed(totals?.net ?? null)}
			</p>
			<p data-regime-gross>
				{l("Gross sensitivity", "总敏感度")}: {number(totals?.gross ?? null)}
			</p>
			<p className="font-mono text-xs">
				{l("Shares of delta per $1", "每 $1 的 Delta 股数")}
				<br />
				{portfolio.components.map(number).join(" + ")}
			</p>
			<Note>
				{l(
					"To maintain a delta-neutral stock hedge: hedge change = −net sensitivity × spot change. Long gamma sells after a rise and buys after a fall; short gamma reverses that local response. Near-zero net can hide large opposing sensitivities.",
					"维持股票 Delta 中性对冲：对冲变化 = −净敏感度 × 现价变动。正 Gamma 上涨后卖、下跌后买；负 Gamma 的局部响应相反。净值近零可隐藏大量相反敏感度。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"Other inputs and the hedge objective are held fixed. These values are already position-scaled, in shares per dollar, not dollar GEX per 1%. Missing position evidence withholds the target.",
					"固定其他输入与对冲目标。这些值已按持仓缩放，单位为每美元股数，而非每 1% 变动美元 GEX。持仓证据缺失时不提供目标。",
				)}
			</p>
		</SceneLayout>
	);
}
export function RegimeFlipScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [id, setId] = useState(data.curves[0].id);
	const [index, setIndex] = useState(2);
	const curve = data.curves.find((c) => c.id === id) ?? data.curves[0];
	const point = curve.points[index];
	const flips = sampledFlips(curve.points);
	const x = (spot: number) => 40 + ((spot - 90) / 20) * 280;
	const y = (v: number) => 220 - (v / 400) * 150;
	const known = typeof point.sensitivity === "number";
	const description = flips.length
		? flips
				.map(
					(f) =>
						`${f.lower}–${f.upper} · ${l("linear estimate", "线性估计")} ${number(f.estimate)}`,
				)
				.join("; ")
		: l(
				"No supported adjacent sign crossing in the supplied samples",
				"给定样本中无受支持的相邻符号转折",
			);
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Repriced aggregate gamma across hypothetical spot",
						"沿假设现价重定价的汇总 Gamma",
					)}
					height={480}
				>
					<SvgText x={180} y={28}>
						{l(
							"Delta shares / $1 · model sensitivity",
							"Delta 股数 / $1 · 模型敏感度",
						)}
					</SvgText>
					<line
						x1={40}
						x2={320}
						y1={220}
						y2={220}
						stroke="currentColor"
						opacity={0.4}
					/>
					<SvgText x={24} y={74} muted>
						+
					</SvgText>
					<SvgText x={24} y={224} muted>
						0
					</SvgText>
					<SvgText x={24} y={369} muted>
						−
					</SvgText>
					{curve.points.slice(1).map((p, i) => {
						const a = curve.points[i];
						return a.sensitivity !== null && p.sensitivity !== null ? (
							<line
								key={p.spot}
								x1={x(a.spot)}
								y1={y(a.sensitivity)}
								x2={x(p.spot)}
								y2={y(p.sensitivity)}
								stroke="currentColor"
								opacity={0.4}
							/>
						) : null;
					})}
					{flips.map((f) => (
						<line
							key={f.estimate}
							x1={x(f.estimate)}
							x2={x(f.estimate)}
							y1={65}
							y2={374}
							stroke="var(--primary)"
							strokeDasharray="5 4"
						/>
					))}
					{curve.points.map((p, i) => (
						<g key={p.spot}>
							{p.sensitivity !== null ? (
								<circle
									cx={x(p.spot)}
									cy={y(p.sensitivity)}
									r={index === i ? 8 : 5}
									fill={index === i ? "var(--primary)" : "currentColor"}
									stroke="currentColor"
								/>
							) : (
								<SvgText x={x(p.spot)} y={220}>
									?
								</SvgText>
							)}
							<foreignObject x={x(p.spot) - 25} y={382} width={50} height={38}>
								<button
									type="button"
									className="h-full w-full rounded-lg border text-xs"
									aria-label={`${l("Spot sample", "现价样本")} ${p.spot}`}
									aria-pressed={index === i}
									onClick={() => setIndex(i)}
								>
									{p.spot}
								</button>
							</foreignObject>
						</g>
					))}
					<SvgText x={180} y={454}>
						{l(
							"X axis: hypothetical spot, not strike",
							"横轴：假设现价，而非行权价",
						)}
					</SvgText>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Model position and expiry scope", "模型持仓与到期范围")}
				value={id}
				options={data.curves.map((c) => [
					c.id,
					c.label[locale === "zh" ? 1 : 0],
				])}
				onChange={setId}
			/>
			<RangeControl
				label={l("Spot sample index", "现价样本索引")}
				value={index}
				display={`$${point.spot}`}
				min={0}
				max={curve.points.length - 1}
				step={1}
				onChange={setIndex}
			/>
			<p>{curve.scope[locale === "zh" ? 1 : 0]}</p>
			<p data-regime-sample>
				{l("Supplied sensitivity", "给定敏感度")}: {signed(point.sensitivity)}
			</p>
			<p data-regime-sign>
				{!known
					? l("Unknown at this spot", "此现价未知")
					: point.sensitivity === 0
						? l("Zero at this supplied node", "此给定节点为零")
						: (point.sensitivity as number) > 0
							? l("Positive at this supplied node", "此给定节点为正")
							: l("Negative at this supplied node", "此给定节点为负")}
			</p>
			<p data-regime-flips className="font-mono text-sm">
				{description}
			</p>
			<Note>
				{l(
					"A flip concerns the sign of the same modeled position set repriced at different spot prices. The dashed line is a linear estimate inside an adjacent sign-change bracket, not a guaranteed exact root. Changing positions or expiry scope changes the model without a new trade.",
					"转折涉及同一模型持仓集在不同现价重定价后的符号。虚线是相邻符号变化区间内的线性估计，不保证精确根。改变持仓或到期范围，无需新成交也会改变模型。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"Straight connectors only aid reading supplied samples. Missing values break the curve. No crossing found in this finite sample is not proof that no crossing exists elsewhere. A cumulative strike chart is a different calculation; none of these marks promises support or resistance.",
					"直线仅辅助阅读给定样本，缺失值断开曲线。有限样本未找到转折，不证明其他位置不存在转折。行权价累计图是另一种计算，这些标记均不保证支撑或阻力。",
				)}
			</p>
		</SceneLayout>
	);
}
export function RegimeEvidenceScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [opened, setOpened] = useState<string[]>([]);
	const has = (id: string) => opened.includes(id);
	const toggle = (id: string) =>
		setOpened((prev) =>
			prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
		);
	const result = has("model")
		? conditionalHedge(data.packet.sensitivity, data.packet.moveCents)
		: null;
	const rows = [
		{
			id: "model",
			label: l("Model packet", "模型资料"),
			value: result?.hedgeChange ?? null,
			unit: l("Target shares", "目标股数"),
		},
		{
			id: "fill",
			label: l("Fill record", "成交记录"),
			value: has("fill") ? data.packet.fillShares : null,
			unit: l("Filled shares", "成交股数"),
		},
		{
			id: "depth",
			label: l("Ask-depth snapshot", "卖盘深度快照"),
			value: has("depth") ? data.packet.askDepthShares : null,
			unit: l("Displayed ask shares", "显示卖盘股数"),
		},
	];
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Independent model fill and depth evidence",
						"独立的模型成交与深度证据",
					)}
					height={480}
				>
					{rows.map((row, i) => (
						<g key={row.id}>
							<rect
								x={25}
								y={22 + i * 112}
								width={310}
								height={94}
								rx={13}
								fill={has(row.id) ? "var(--primary)" : "currentColor"}
								opacity={has(row.id) ? 0.16 : 0.04}
							/>
							<foreignObject x={25} y={22 + i * 112} width={310} height={94}>
								<button
									type="button"
									className="h-full w-full rounded-xl text-center text-sm"
									aria-pressed={has(row.id)}
									onClick={() => toggle(row.id)}
								>
									<span className="block font-medium">{row.label}</span>
									<span className="block font-mono text-lg">
										{number(row.value)}
									</span>
									<span className="block text-xs">
										{has(row.id)
											? row.unit
											: l("Reveal supplied record", "展示给定记录")}
									</span>
								</button>
							</foreignObject>
						</g>
					))}
					<SvgText x={180} y={390}>
						{l("Price outcome", "价格结果")}
					</SvgText>
					<SvgText x={180} y={432} strong>
						?
					</SvgText>
					<SvgText x={180} y={466} muted>
						{l("These records do not forecast a squeeze", "这些记录不预测挤压")}
					</SvgText>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<p className="font-mono text-xs">{data.packet.source}</p>
			<p data-regime-target>
				{l("Conditional hedge target", "条件性对冲目标")}:{" "}
				{signed(result?.hedgeChange ?? null)}
			</p>
			<p data-regime-fill>
				{l("Supplied fill", "给定成交")}:{" "}
				{has("fill") ? signed(data.packet.fillShares) : "—"}
				{has("fill") && (
					<>
						<br />
						{data.packet.fillTime}
					</>
				)}
			</p>
			<p data-regime-depth>
				{l("Supplied displayed depth", "给定显示深度")}:{" "}
				{has("depth") ? number(data.packet.askDepthShares) : "—"}
				{has("depth") && (
					<>
						<br />
						{data.packet.depthTime}
					</>
				)}
			</p>
			{has("model") && (
				<p className="font-mono text-xs">
					{l(
						"Stated portfolio · delta-neutral objective",
						"给定组合 · Delta 中性目标",
					)}
					<br />
					−({data.packet.sensitivity}) × ${number(data.packet.moveCents / 100)}{" "}
					= {signed(result?.hedgeChange ?? null)}
				</p>
			)}
			<Note>
				{l(
					"Reveal buttons expose fixed synthetic records; they do not place orders or establish real dealer ownership. The model supplies a target, the fill supplies an execution, and the earlier depth snapshot supplies displayed liquidity at its own timestamp.",
					"展示按钮打开固定模拟记录，不下单，也不确定真实做市商归属。模型提供目标，成交记录提供执行，较早的深度快照提供其自身时点的显示流动性。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"Displayed depth can change and excludes hidden liquidity and later orders. Even with all three records, price impact and a squeeze are not established. A short-gamma label alone supplies none of this execution evidence.",
					"显示深度可变化，且不包括隐藏流动性与后续订单。即使三项记录齐全，也未确定价格冲击或挤压。单凭负 Gamma 标签不能提供这些执行证据。",
				)}
			</p>
		</SceneLayout>
	);
}
