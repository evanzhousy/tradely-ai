import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { FieldGroup } from "@tradely/ui/components/field";
import * as m from "motion/react-m";
import { createContext, useContext, useState } from "react";
import {
	type InterpolationMethod,
	interpolateIv,
	type SurfaceConceptData,
	surfaceCell,
	wingComparison,
} from "@/domain/learning/surface-concept";
import type { Locale } from "@/i18n/messages";
import {
	ChoiceField,
	Diagram,
	RangeControl,
	SceneLayout,
	SelectField,
	SvgText,
} from "./concept-scene";
import {
	instantTransition,
	lessonTransition,
	useLessonMotion,
} from "./lesson-motion";

export const SurfaceData = createContext<SurfaceConceptData | null>(null);
function useData() {
	const data = useContext(SurfaceData);
	if (!data) throw new Error("Surface scenes require authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const copy = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const num = (value: number | null) =>
	value === null
		? "—"
		: (Math.abs(value) < 1e-9 ? 0 : value).toLocaleString("en-US", {
				maximumFractionDigits: 4,
			});
const pct = (value: number | null) => (value === null ? "—" : `${num(value)}%`);
const signed = (value: number | null) =>
	value === null
		? "—"
		: `${value > 0 ? "+" : value < 0 ? "−" : ""}${num(Math.abs(value))}`;
function Snapshot({ locale }: Props) {
	const data = useData();
	return (
		<p className="font-mono text-muted-foreground text-xs leading-relaxed">
			{data.symbol}
			<br />
			{data.asOf}
			<br />
			{data.modelLabel[locale === "zh" ? 1 : 0]}
			<br />
			{copy(locale)("Spot", "现价")} ${data.spot} ·{" "}
			{copy(locale)("supplied annualized IV (%)", "给定年化 IV（%）")}
		</p>
	);
}

export function SurfaceSlicesScene({ locale }: Props) {
	const motion = useLessonMotion();
	const data = useData();
	const l = copy(locale);
	const [dataset, setDataset] = useState(data.datasets[0].id);
	const [row, setRow] = useState(1);
	const [column, setColumn] = useState(1);
	const [axis, setAxis] = useState("strike");
	const selected = surfaceCell(data, dataset, row, column);
	const coordinates =
		axis === "strike" ? data.strikes : data.expiries.map((e) => e.days);
	const plotX = (i: number) =>
		65 +
		((coordinates[i] - coordinates[0]) /
			(coordinates[coordinates.length - 1] - coordinates[0])) *
			230;
	const plotY = (value: number) => 411 - (value / data.ivCeiling) * 116;
	const points =
		axis === "strike"
			? data.strikes.map((strike, c) => ({
					label: `$${strike}`,
					value: surfaceCell(data, dataset, row, c),
					focal: c === column,
				}))
			: data.expiries.map((expiry, r) => ({
					label: `${expiry.days}D`,
					value: surfaceCell(data, dataset, r, column),
					focal: r === row,
				}));
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Pick a supplied cell and inspect its row or column",
						"选择给定单元格并检查其行或列",
					)}
					height={505}
				>
					<SvgText x={180} y={22} muted>
						{l("Fixed strikes across expiries", "跨到期日的固定行权价")}
					</SvgText>
					{data.strikes.map((strike, c) => (
						<SvgText key={strike} x={102 + c * 92} y={49} muted>
							${strike}
						</SvgText>
					))}
					{data.expiries.map((expiry, r) => (
						<g key={expiry.date}>
							<SvgText x={29} y={88 + r * 53} muted>
								{expiry.days}D
							</SvgText>
							{data.strikes.map((strike, c) => (
								<foreignObject
									key={strike}
									x={60 + c * 92}
									y={61 + r * 53}
									width="84"
									height="44"
								>
									<button
										type="button"
										className={`h-full w-full rounded-lg border border-border font-mono text-sm ${row === r && column === c ? "bg-primary/25" : "bg-background"}`}
										aria-label={`${l("Inspect", "查看")} ${expiry.date} $${strike}`}
										aria-pressed={row === r && column === c}
										onClick={() => {
											setRow(r);
											setColumn(c);
										}}
									>
										{pct(surfaceCell(data, dataset, r, c))}
									</button>
								</foreignObject>
							))}
						</g>
					))}
					<SvgText x={180} y={251} muted>
						{axis === "strike"
							? `${l("Strike slice", "行权价切片")} · ${data.expiries[row].date}`
							: `${l("Term slice at", "期限切片于")} K $${data.strikes[column]}`}
					</SvgText>
					<path d="M40 295V411H320" className="contract-svg-line" />
					<SvgText x={20} y={299} muted>
						{data.ivCeiling}%
					</SvgText>
					{points.map((p, i) => (
						<g key={p.label}>
							{p.value === null ? (
								<SvgText x={plotX(i)} y={372} muted>
									—
								</SvgText>
							) : (
								<>
									<m.circle
										initial={false}
										data-surface-point={p.label}
										animate={{ cy: plotY(p.value) }}
										transition={motion ? lessonTransition : instantTransition}
										cx={plotX(i)}
										cy={plotY(p.value)}
										r={p.focal ? 8 : 5}
										className={
											p.focal ? "contract-svg-handle" : "contract-svg-dot"
										}
									/>
									<SvgText x={plotX(i)} y={plotY(p.value) - 15} muted>
										{pct(p.value)}
									</SvgText>
								</>
							)}
							<SvgText x={plotX(i)} y={437} muted>
								{p.label}
							</SvgText>
						</g>
					))}
					<g data-surface-cell>
						<SvgText x={180} y={480} strong>
							{pct(selected)}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<Snapshot locale={locale} />
			<FieldGroup>
				<SelectField
					label={l("IV input coverage", "IV 输入覆盖")}
					value={dataset}
					options={data.datasets.map((d) => [
						d.id,
						d.label[locale === "zh" ? 1 : 0],
					])}
					onChange={setDataset}
				/>
				<ChoiceField
					label={l("Slice to inspect", "检查的切片")}
					value={axis}
					options={[
						["strike", l("Strike slice", "行权价切片")],
						["term", l("Term slice", "期限切片")],
					]}
					onChange={setAxis}
				/>
				<SelectField
					label={l("Selected expiry", "选定到期日")}
					value={String(row)}
					options={data.expiries.map((e, i) => [
						String(i),
						`${e.date} · ${e.days}D`,
					])}
					onChange={(value) => setRow(Number(value))}
				/>
				<SelectField
					label={l("Selected strike", "选定行权价")}
					value={String(column)}
					options={data.strikes.map((strike, i) => [String(i), `$${strike}`])}
					onChange={(value) => setColumn(Number(value))}
				/>
			</FieldGroup>
			<p data-surface-availability className="text-sm">
				{selected === null
					? l(
							"This source does not supply the selected cell",
							"此来源未提供选定单元格",
						)
					: l(
							"Supplied IV node; no interpolation applied",
							"给定 IV 节点；未应用插值",
						)}
			</p>
			<Alert role="note">
				<AlertTitle>
					{l("A slice keeps one coordinate fixed", "切片固定一个坐标")}
				</AlertTitle>
				<AlertDescription>
					{l(
						"A strike slice compares strikes at one expiry. This term slice keeps the strike fixed while expiry changes. These fixed-strike nodes are not 25-delta wings. Quote-derived and traded-only inputs have different coverage and may produce different IVs. Missing cells remain empty; no line is drawn through an absent observation.",
						"行权价切片在一个到期日比较行权价；此期限切片固定行权价、改变到期日。这些固定行权价节点不是 25 Delta 翼。报价推导与仅成交输入覆盖不同，也可能产生不同 IV。缺失单元格保持空白，不连线穿过缺失观测。",
					)}
				</AlertDescription>
			</Alert>
		</SceneLayout>
	);
}

export function SurfaceWingsScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [id, setId] = useState(data.wings[0].id);
	const [order, setOrder] = useState<"put-call" | "call-put">("put-call");
	const example = data.wings.find((w) => w.id === id) ?? data.wings[0];
	const result = wingComparison(example, order);
	const refs = [
		["25Δ put", example.put],
		["ATM", example.atm],
		["25Δ call", example.call],
	] as const;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Wing and ATM references under a stated convention",
						"声明约定下的两翼与 ATM 参考",
					)}
					height={450}
				>
					<SvgText x={180} y={25} muted>
						{l("Supplied annualized IV references", "给定年化 IV 参考")}
					</SvgText>
					<SvgText x={180} y={50} muted>
						{data.ivCeiling}%
					</SvgText>
					<path d="M40 230H320" className="contract-svg-line" />
					{refs.map(([label, ref], i) => (
						<g key={label}>
							{ref.iv === null ? (
								<SvgText x={65 + i * 115} y={200} muted>
									—
								</SvgText>
							) : (
								<rect
									x={42 + i * 115}
									y={230 - (ref.iv / data.ivCeiling) * 160}
									width="46"
									height={(ref.iv / data.ivCeiling) * 160}
									rx="5"
									className="contract-svg-wash"
								/>
							)}
							<SvgText x={65 + i * 115} y={254}>
								{label}
							</SvgText>
							<SvgText x={65 + i * 115} y={279} muted>
								{pct(ref.iv)}
							</SvgText>
						</g>
					))}
					<rect
						x="14"
						y="306"
						width="332"
						height="60"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={327} muted>
						{order === "put-call"
							? l("Put − call · volatility points", "看跌 − 看涨 · 波动率点")
							: l("Call − put · volatility points", "看涨 − 看跌 · 波动率点")}
					</SvgText>
					<g data-surface-skew>
						<SvgText x={180} y={353} strong>
							{signed(result.skew)}
						</SvgText>
					</g>
					<SvgText x={180} y={398} muted>
						{l("Average wings − ATM · vol points", "两翼平均 − ATM · 波动率点")}
					</SvgText>
					<g data-surface-butterfly>
						<SvgText x={180} y={433} strong>
							{signed(result.butterfly)}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<Snapshot locale={locale} />
			<FieldGroup>
				<SelectField
					label={l("Wing reference case", "两翼参考案例")}
					value={id}
					options={data.wings.map((w) => [
						w.id,
						w.label[locale === "zh" ? 1 : 0],
					])}
					onChange={setId}
				/>
				<ChoiceField
					label={l("Skew sign convention", "偏斜符号约定")}
					value={order}
					options={[
						["put-call", l("Put minus call", "看跌减看涨")],
						["call-put", l("Call minus put", "看涨减看跌")],
					]}
					onChange={setOrder}
				/>
			</FieldGroup>
			<div className="space-y-3 break-words font-mono text-muted-foreground text-xs">
				{refs.map(([label, ref]) => (
					<p key={label}>
						{label}: {pct(ref.iv)} · {ref.expiry}
						<br />
						{ref.convention}
						<br />
						{ref.source}
					</p>
				))}
			</div>
			<Alert role="note">
				<AlertTitle>
					{l("Check compatibility before subtracting", "相减前检查兼容性")}
				</AlertTitle>
				<AlertDescription>
					{l(
						"Skew needs compatible put/call references. Butterfly also needs a matching ATM value: (put IV + call IV)/2 − ATM IV. A missing ATM can leave skew available while withholding butterfly. A missing wing affects both. This lab requires the same expiry, coordinate convention and price-source convention; equal-looking numbers do not repair a mismatch.",
						"偏斜需要兼容的看跌/看涨参考；蝶式还需匹配 ATM 值：（看跌 IV + 看涨 IV）/2 − ATM IV。ATM 缺失时偏斜仍可用，而蝶式不可用；任一翼缺失会影响两者。本课堂要求相同到期日、坐标约定与价格来源约定，数值看似相等不能修复不匹配。",
					)}
				</AlertDescription>
			</Alert>
			<p className="text-muted-foreground text-xs">
				{l(
					"Delta coordinates depend on the model and premium convention and can correspond to different strikes at different expiries. These are supplied delta/ATM references, separate from the sparse fixed-strike grid. The butterfly here is an IV-shape statistic, not a trading-strategy price.",
					"Delta 坐标依赖模型和权利金约定，不同到期日可对应不同行权价。这些是给定 Delta/ATM 参考，与稀疏固定行权价网格分开。此处蝶式是 IV 形状统计量，不是交易策略价格。",
				)}
			</p>
		</SceneLayout>
	);
}

export function SurfaceInterpolationScene({ locale }: Props) {
	const motion = useLessonMotion();
	const data = useData();
	const l = copy(locale);
	const [days, setDays] = useState(data.defaultTarget);
	const [method, setMethod] = useState<InterpolationMethod>("none");
	const [coverage, setCoverage] = useState("complete");
	const anchors = data.anchors.map((a, i) =>
		i === 1 && coverage === "missing" ? { ...a, iv: null } : a,
	);
	const result = interpolateIv(anchors, days, method);
	const x = (value: number) =>
		40 +
		((value - data.targetRange[0]) /
			(data.targetRange[1] - data.targetRange[0])) *
			280;
	const y = (value: number) => 265 - (value / data.ivCeiling) * 190;
	const curve = Array.from(
		{ length: anchors[1].days - anchors[0].days + 1 },
		(_, i) => {
			const day = anchors[0].days + i;
			return { day, value: interpolateIv(anchors, day, method).iv };
		},
	);
	const reason =
		result.provenance === "supplied"
			? l("Supplied reference node", "给定参考节点")
			: result.provenance === "estimated"
				? l("Interpolated estimate · not a quote", "插值估计 · 不是报价")
				: result.reason === "off"
					? l(
							"No supplied node; interpolation is off",
							"没有给定节点；插值已关闭",
						)
					: result.reason === "outside"
						? l("Outside anchors · no extrapolation", "超出锚点 · 不作外推")
						: l("Compatible anchors are unavailable", "兼容锚点不可用");
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Keep supplied nodes separate from modeled tenor estimates",
						"区分给定节点与模型期限估计",
					)}
					height={455}
				>
					<SvgText x={180} y={25} muted>
						{l("Midquote-derived ATM references", "中间报价推导 ATM 参考")}
					</SvgText>
					<SvgText x={180} y={53} muted>
						{data.ivCeiling}%
					</SvgText>
					<path d="M40 75V265H320" className="contract-svg-line" />
					{method !== "none" && curve.every((p) => p.value !== null) ? (
						<m.path
							key={method}
							initial={{ opacity: motion ? 0 : 1 }}
							animate={{ opacity: 1 }}
							transition={motion ? lessonTransition : instantTransition}
							d={curve
								.map(
									(p, i) =>
										`${i ? "L" : "M"}${x(p.day)} ${y(p.value as number)}`,
								)
								.join(" ")}
							className="contract-svg-active-line"
							strokeDasharray="5 4"
						/>
					) : null}
					{anchors.map((a) => (
						<g key={a.days}>
							{a.iv !== null ? (
								<circle
									cx={x(a.days)}
									cy={y(a.iv)}
									r="6"
									className="contract-svg-dot"
								/>
							) : null}
							<SvgText
								x={x(a.days)}
								y={a.iv === null ? 200 : y(a.iv) - 15}
								muted
							>
								{pct(a.iv)}
							</SvgText>
							<SvgText x={x(a.days)} y={288} muted>
								{a.days}D
							</SvgText>
						</g>
					))}
					{result.iv !== null ? (
						<circle
							cx={x(days)}
							cy={y(result.iv)}
							r="10"
							fill={
								result.provenance === "estimated" ? "none" : "var(--primary)"
							}
							stroke="var(--foreground)"
							strokeWidth="2"
						/>
					) : null}
					<path d="M40 335H320" className="contract-svg-line" />
					<circle cx={x(days)} cy="335" r="9" className="contract-svg-handle" />
					<foreignObject x="20" y="295" width="320" height="80">
						<input
							type="range"
							className="contract-range contract-svg-range"
							aria-label={l("Drag target tenor", "拖动目标期限")}
							aria-valuetext={`${days} ${l("calendar days", "自然日")}`}
							min={data.targetRange[0]}
							max={data.targetRange[1]}
							step={1}
							value={days}
							onChange={(e) => setDays(Number(e.target.value))}
						/>
					</foreignObject>
					<SvgText x={180} y={391}>
						{days} {l("calendar days", "自然日")}
					</SvgText>
					<g data-surface-interpolated>
						<SvgText x={180} y={430} strong>
							{pct(result.iv)}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<Snapshot locale={locale} />
			<FieldGroup>
				<SelectField
					label={l("Interpolation method", "插值方法")}
					value={method}
					options={[
						["none", l("Supplied nodes only", "仅给定节点")],
						["iv", l("Linear IV", "线性 IV")],
						["variance", l("Linear total variance", "线性总方差")],
					]}
					onChange={(value) => setMethod(value as InterpolationMethod)}
				/>
				<SelectField
					label={l("Anchor coverage", "锚点覆盖")}
					value={coverage}
					options={[
						["complete", l("Both references supplied", "两个参考均已提供")],
						["missing", l("Later reference withheld", "后期参考被隐藏")],
					]}
					onChange={setCoverage}
				/>
				<RangeControl
					label={l("Target calendar days", "目标自然日数")}
					value={days}
					display={String(days)}
					min={data.targetRange[0]}
					max={data.targetRange[1]}
					onChange={setDays}
				/>
			</FieldGroup>
			<p data-surface-provenance className="text-sm">
				{reason}
			</p>
			<Alert role="note">
				<AlertTitle>
					{l("Keep estimates visibly labeled", "明确标注估计值")}
				</AlertTitle>
				<AlertDescription>
					{l(
						"Interpolation is opt-in and only supported between two supplied anchors. Exact anchor tenors keep their supplied values. Linear IV blends percentages; linear total variance blends (IV/100)² × years and then converts back to IV, using ACT/365 here. The rules can produce different answers. Missing anchors and outside-range targets do not receive invented values.",
						"插值需主动选择，且仅在两个给定锚点之间受支持。精确锚点期限保留给定值。线性 IV 混合百分比；线性总方差混合（IV/100）平方 × 年数，再转换回 IV，此处使用 ACT/365。不同规则可能产生不同结果。缺失锚点与超范围目标不会获得编造值。",
					)}
				</AlertDescription>
			</Alert>
			<p className="text-muted-foreground text-xs">
				{l(
					"Filled nodes are supplied references; an outlined node and dashed curve identify estimates. An ATM30 reference need not be a listed 30-day contract. This illustration is not a complete arbitrage-free surface, a quote guarantee or a forecast.",
					"实心节点是给定参考，空心节点与虚线表示估计。ATM30 参考不必对应挂牌 30 天合约。本示例不是完整无套利曲面、报价保证或预测。",
				)}
			</p>
		</SceneLayout>
	);
}
