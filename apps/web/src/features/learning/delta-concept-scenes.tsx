import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { FieldGroup } from "@tradely/ui/components/field";
import * as m from "motion/react-m";
import { createContext, useContext, useState } from "react";
import {
	type DeltaConceptData,
	type DeltaOption,
	illustrativeDeltaCurve,
} from "@/domain/learning/delta-concept";
import { localDeltaChange } from "@/domain/learning/local-greeks";
import type { Locale } from "@/i18n/messages";
import {
	ChoiceField,
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

export const DeltaData = createContext<DeltaConceptData | null>(null);
function useDeltaData() {
	const data = useContext(DeltaData);
	if (!data) throw new Error("Delta scenes require authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const copy = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const clean = (value: number) => (Math.abs(value) < 1e-9 ? 0 : value);
const signed = (value: number, digits = 2) =>
	`${clean(value) > 0 ? "+" : clean(value) < 0 ? "−" : ""}${Math.abs(clean(value)).toLocaleString("en-US", { maximumFractionDigits: digits })}`;
const money = (cents: number, withSign = false, digits = 2) =>
	`${clean(cents) < 0 ? "−" : withSign && clean(cents) > 0 ? "+" : ""}$${(Math.abs(clean(cents)) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: digits })}`;
function OptionField({
	locale,
	option,
	onChange,
}: Props & { option: DeltaOption; onChange: (id: string) => void }) {
	const data = useDeltaData();
	return (
		<SelectField
			label={copy(locale)("Supplied option", "给定期权")}
			value={option.id}
			options={data.options.map((o) => [
				o.id,
				o.label[locale === "zh" ? 1 : 0],
			])}
			onChange={onChange}
		/>
	);
}
function Snapshot({ locale, option }: Props & { option: DeltaOption }) {
	const data = useDeltaData();
	return (
		<p className="font-mono text-muted-foreground text-xs leading-relaxed">
			{option.contract}
			<br />
			{data.asOf}
			<br />
			{copy(locale)(
				"Fictional model snapshot · per-unit prices",
				"虚构模型快照 · 每单位价格",
			)}
		</p>
	);
}

export function DeltaSlopeScene({ locale }: Props) {
	const data = useDeltaData();
	const l = copy(locale);
	const [id, setId] = useState(data.options[0].id);
	const [move, setMove] = useState(data.defaultMoveCents);
	const option = data.options.find((o) => o.id === id) ?? data.options[0];
	const result = localDeltaChange(option.delta, move, 1, 1, "long");
	const estimate = result ? option.priceCents + result.unitChangeCents : null;
	const x = (value: number) =>
		40 +
		((value - data.localMoveRange[0]) /
			(data.localMoveRange[1] - data.localMoveRange[0])) *
			280;
	const y = (value: number) =>
		265 -
		((value - data.localPriceRange[0]) /
			(data.localPriceRange[1] - data.localPriceRange[0])) *
			210;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"A local delta-only price line",
						"局部仅用 Delta 的价格直线",
					)}
					height={455}
				>
					<SvgText x={180} y={25} muted>
						{l("Option price / unit · estimate", "每单位期权价格 · 估计")}
					</SvgText>
					<path d="M40 55V265H320" className="contract-svg-line" />
					<SvgText x={180} y={49} muted>
						{money(data.localPriceRange[1])}
					</SvgText>
					<SvgText x={180} y={285} muted>
						{money(data.localPriceRange[0])}
					</SvgText>
					<path
						d={`M40 ${y(option.priceCents + option.delta * data.localMoveRange[0])}L320 ${y(option.priceCents + option.delta * data.localMoveRange[1])}`}
						className="contract-svg-active-line"
					/>
					<circle
						cx={x(0)}
						cy={y(option.priceCents)}
						r="4"
						className="contract-svg-dot"
					/>
					{estimate !== null ? (
						<>
							<path
								d={`M${x(0)} ${y(option.priceCents)}H${x(move)}V${y(estimate)}`}
								className="contract-svg-line"
								strokeDasharray="4 4"
							/>
							<circle
								cx={x(move)}
								cy={y(estimate)}
								r="8"
								className="contract-svg-handle"
							/>
						</>
					) : null}
					<SvgText x={60} y={315} muted>
						{money(data.spotCents + data.localMoveRange[0])}
					</SvgText>
					<SvgText x={300} y={315} muted>
						{money(data.spotCents + data.localMoveRange[1])}
					</SvgText>
					<path d="M40 343H320" className="contract-svg-line" />
					<circle cx={x(move)} cy="343" r="9" className="contract-svg-handle" />
					<foreignObject x="20" y="303" width="320" height="80">
						<input
							type="range"
							className="contract-range contract-svg-range"
							aria-label={l("Drag underlying move", "拖动标的变动")}
							aria-valuetext={money(move, true)}
							min={data.localMoveRange[0]}
							max={data.localMoveRange[1]}
							step={5}
							value={move}
							onChange={(e) => setMove(Number(e.target.value))}
						/>
					</foreignObject>
					<SvgText x={180} y={393}>
						{l("Underlying", "标的")} {money(data.spotCents + move)}
					</SvgText>
					<g data-delta-estimate>
						<SvgText x={180} y={430} strong>
							{estimate === null ? "—" : money(estimate, false, 4)}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<Snapshot locale={locale} option={option} />
			<FieldGroup>
				<OptionField locale={locale} option={option} onChange={setId} />
				<RangeControl
					label={l("Underlying price change", "标的价格变动")}
					value={move}
					display={money(move, true)}
					min={data.localMoveRange[0]}
					max={data.localMoveRange[1]}
					step={5}
					onChange={setMove}
				/>
			</FieldGroup>
			<div className="grid grid-cols-2 gap-3 text-sm">
				<p>
					{l("Starting option price", "起始期权价格")}
					<br />
					<strong>{money(option.priceCents)}</strong>
				</p>
				<p data-delta-model>
					{l("Model delta", "模型 Delta")}
					<br />
					<strong>{signed(option.delta)}</strong>
				</p>
				<p data-delta-unit-change>
					{l("Estimated change / unit", "每单位估计变化")}
					<br />
					<strong>
						{result ? money(result.unitChangeCents, true, 4) : "—"}
					</strong>
				</p>
				<p>
					{l("Units", "单位")}
					<br />
					{l("$/unit per $1 underlying", "标的每 $1 的美元/单位")}
				</p>
			</div>
			<Alert role="note">
				<AlertTitle>
					{l("Slope, not a predicted next price", "斜率，而非下个价格预测")}
				</AlertTitle>
				<AlertDescription>
					{l(
						"The line holds the supplied delta constant over a small move. Its horizontal and vertical steps show underlying change and estimated option change. The put has its own negative model delta; this is the option's price sensitivity before any long/short position sign.",
						"直线在小幅变动中保持给定 Delta 不变。水平与垂直步长分别表示标的变化和期权估计变化。看跌期权有自己的负模型 Delta；这是期权价格敏感度，尚未加入持仓多空符号。",
					)}
				</AlertDescription>
			</Alert>
			<p className="text-muted-foreground text-xs">
				{l(
					"Time, volatility, rates and other inputs are held fixed. The marker is a delta-only estimate, not a live quote, fill, expiration payoff or promised profit.",
					"时间、波动率、利率及其他输入保持不变。标记是仅用 Delta 的估计，不是实时报价、成交、到期支付或利润承诺。",
				)}
			</p>
		</SceneLayout>
	);
}

export function DeltaPositionScene({ locale }: Props) {
	const data = useDeltaData();
	const l = copy(locale);
	const [id, setId] = useState(data.options[0].id);
	const [side, setSide] = useState<"long" | "short">("long");
	const [quantity, setQuantity] = useState(data.defaultQuantity);
	const [multiplier, setMultiplier] = useState(data.multipliers[0]);
	const option = data.options.find((o) => o.id === id) ?? data.options[0];
	const result = localDeltaChange(
		option.delta,
		data.positionMoveCents,
		quantity,
		multiplier,
		side,
	);
	const maxExposure =
		Math.max(...data.options.map((o) => Math.abs(o.delta))) *
		data.quantityMax *
		Math.max(...data.multipliers);
	const width = result
		? (Math.abs(result.positionDelta) / maxExposure) * 140
		: 0;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Signed position delta with one multiplier",
						"带符号持仓 Delta，只乘一次乘数",
					)}
					height={470}
				>
					<SvgText x={180} y={25} muted>
						{l("Start with the option's model delta", "从期权模型 Delta 出发")}
					</SvgText>
					<rect
						x="14"
						y="43"
						width="332"
						height="63"
						rx="12"
						className="contract-svg-paper"
					/>
					<g data-delta-option-sign>
						<SvgText x={180} y={82} strong>
							{signed(option.delta)}
						</SvgText>
					</g>
					{[
						[66, l("Contracts", "张数"), quantity],
						[180, l("Multiplier", "乘数"), multiplier],
						[
							294,
							l("Position sign", "持仓符号"),
							side === "long" ? "+1" : "−1",
						],
					].map(([x, label, value]) => (
						<g key={String(label)}>
							<rect
								x={Number(x) - 52}
								y="127"
								width="104"
								height="70"
								rx="10"
								className="contract-svg-paper"
							/>
							<SvgText x={Number(x)} y={151} muted>
								{label}
							</SvgText>
							<SvgText x={Number(x)} y={181}>
								{value}
							</SvgText>
						</g>
					))}
					<SvgText x={180} y={235}>
						{signed(option.delta)} × {quantity} × {multiplier} ×{" "}
						{side === "long" ? "+1" : "−1"}
					</SvgText>
					<g data-delta-position>
						<SvgText x={180} y={277} strong>
							{result ? signed(result.positionDelta) : "—"}
						</SvgText>
					</g>
					<SvgText x={180} y={303} muted>
						{l("shares-equivalent", "股等价量")}
					</SvgText>
					<path d="M40 341H320M180 327V355" className="contract-svg-line" />
					<rect
						x={result && result.positionDelta < 0 ? 180 - width : 180}
						y="333"
						width={width}
						height="16"
						rx="4"
						className="contract-svg-wash"
					/>
					<SvgText x={47} y={372} muted>
						−
					</SvgText>
					<SvgText x={180} y={372} muted>
						0
					</SvgText>
					<SvgText x={313} y={372} muted>
						+
					</SvgText>
					<path d="M40 412H320" className="contract-svg-line" />
					<circle
						cx={40 + ((quantity - 1) / (data.quantityMax - 1)) * 280}
						cy="412"
						r="9"
						className="contract-svg-handle"
					/>
					<foreignObject x="20" y="372" width="320" height="80">
						<input
							type="range"
							className="contract-range contract-svg-range"
							aria-label={l("Drag contract quantity", "拖动合约张数")}
							min={1}
							max={data.quantityMax}
							step={1}
							value={quantity}
							onChange={(e) => setQuantity(Number(e.target.value))}
						/>
					</foreignObject>
					<SvgText x={180} y={459}>
						{quantity} {l("contracts", "张")}
					</SvgText>
				</Diagram>
			}
		>
			<Snapshot locale={locale} option={option} />
			<FieldGroup>
				<OptionField locale={locale} option={option} onChange={setId} />
				<ChoiceField
					label={l("Position side", "持仓方向")}
					value={side}
					options={[
						["long", l("Long", "多头")],
						["short", l("Short", "空头")],
					]}
					onChange={setSide}
				/>
				<SelectField
					label={l("Illustrative contract size", "示例合约规模")}
					value={String(multiplier)}
					options={data.multipliers.map((m) => [
						String(m),
						`${m} ${l("units / contract", "单位/张")}`,
					])}
					onChange={(value) => setMultiplier(Number(value))}
				/>
				<RangeControl
					label={l("Number of contracts", "合约张数")}
					value={quantity}
					display={String(quantity)}
					min={1}
					max={data.quantityMax}
					onChange={setQuantity}
				/>
			</FieldGroup>
			<div className="space-y-3 text-sm">
				<p>
					{l("Underlying move held at", "标的变动固定为")}{" "}
					{money(data.positionMoveCents, true)}
				</p>
				<p data-delta-position-change>
					{l("Estimated position value change", "持仓价值估计变化")}
					<br />
					<strong className="text-xl">
						{result ? money(result.positionChangeCents, true) : "—"}
					</strong>
				</p>
			</div>
			<Alert role="note">
				<AlertTitle>
					{l(
						"Shorting reverses the position, not the quoted delta",
						"做空反转持仓，而非报价 Delta",
					)}
				</AlertTitle>
				<AlertDescription>
					{l(
						"One option's model delta × contract count × the stated multiplier × long/short sign gives share-equivalent exposure. Multiply that exposure by the underlying move to estimate the dollar change. Do not apply the multiplier twice.",
						"单份期权模型 Delta × 张数 × 给定乘数 × 多空符号，得到股等价敞口。再乘标的变化估计金额变化，不要重复乘乘数。",
					)}
				</AlertDescription>
			</Alert>
			<p className="text-muted-foreground text-xs">
				{l(
					"The size selector compares hypothetical contract specifications; read the actual contract terms in practice. Share-equivalent sensitivity is not ownership of shares, realized P&L, or an inferred flow-sentiment sign. Time, volatility, curvature, fees and other effects are omitted.",
					"规模选择比较假设合约规格；实际需阅读合约条款。股等价敏感度不等于持有股票、已实现盈亏或推断的成交流情绪符号。此处省略时间、波动率、曲率、费用及其他影响。",
				)}
			</p>
		</SceneLayout>
	);
}

export function DeltaLimitsScene({ locale }: Props) {
	const { curve } = useDeltaData();
	const l = copy(locale);
	const motion = useLessonMotion();
	const playback = useFrames(curve.frames.length);
	const [manual, setManual] = useState<number | null>(null);
	const [condition, setCondition] = useState("fixed");
	const move = manual ?? curve.frames[playback.frame];
	const chooseMove = (value: number) => {
		playback.select(playback.frame);
		setManual(value);
	};
	const fixed = condition === "fixed";
	const known = condition !== "missing";
	const values = illustrativeDeltaCurve(curve, move);
	const x = (value: number) =>
		40 +
		((value - curve.moveRange[0]) / (curve.moveRange[1] - curve.moveRange[0])) *
			280;
	const y = (value: number) =>
		265 -
		((value - curve.priceRange[0]) /
			(curve.priceRange[1] - curve.priceRange[0])) *
			210;
	const points = Array.from(
		{ length: 81 },
		(_, i) =>
			curve.moveRange[0] + ((curve.moveRange[1] - curve.moveRange[0]) * i) / 80,
	);
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"A fixed slope versus a declared curved teaching response",
						"固定斜率与声明的弯曲教学响应",
					)}
					height={465}
				>
					<SvgText x={180} y={25} muted>
						{l("Illustrative price / unit", "示例每单位价格")}
					</SvgText>
					<path d="M40 55V265H320" className="contract-svg-line" />
					<SvgText x={180} y={48} muted>
						{money(curve.priceRange[1])}
					</SvgText>
					<SvgText x={180} y={288} muted>
						{money(curve.priceRange[0])}
					</SvgText>
					{fixed ? (
						<>
							<path
								d={`M40 ${y(illustrativeDeltaCurve(curve, curve.moveRange[0]).linearPriceCents)}L320 ${y(illustrativeDeltaCurve(curve, curve.moveRange[1]).linearPriceCents)}`}
								className="contract-svg-line"
								strokeDasharray="5 4"
							/>
							<path
								d={points
									.map(
										(value, i) =>
											`${i ? "L" : "M"}${x(value)} ${y(illustrativeDeltaCurve(curve, value).curvedPriceCents)}`,
									)
									.join(" ")}
								className="contract-svg-active-line"
							/>
							<path
								d={`M${x(move)} ${y(values.linearPriceCents)}V${y(values.curvedPriceCents)}`}
								className="contract-svg-line"
							/>
							<circle
								cx={x(move)}
								cy={y(values.linearPriceCents)}
								r="5"
								className="contract-svg-dot"
							/>
							<m.circle
								initial={false}
								cx={x(move)}
								cy={y(values.curvedPriceCents)}
								r="8"
								animate={{ cx: x(move), cy: y(values.curvedPriceCents) }}
								transition={
									playback.playing && motion
										? lessonTransition
										: instantTransition
								}
								className="contract-svg-handle"
							/>
						</>
					) : (
						<>
							<SvgText x={180} y={147}>
								{l("Total change unavailable", "总变化不可用")}
							</SvgText>
							<SvgText x={180} y={181} muted>
								{l("Updated inputs are not supplied", "未提供更新后的输入")}
							</SvgText>
						</>
					)}
					<SvgText x={60} y={320} muted>
						{money(curve.moveRange[0], true)}
					</SvgText>
					<SvgText x={300} y={320} muted>
						{money(curve.moveRange[1], true)}
					</SvgText>
					<path d="M40 348H320" className="contract-svg-line" />
					<circle cx={x(move)} cy="348" r="9" className="contract-svg-handle" />
					<foreignObject x="20" y="308" width="320" height="80">
						<input
							type="range"
							className="contract-range contract-svg-range"
							aria-label={l("Drag stress move", "拖动压力变动")}
							aria-valuetext={money(move, true)}
							min={curve.moveRange[0]}
							max={curve.moveRange[1]}
							step={5}
							value={move}
							onPointerDown={() => chooseMove(move)}
							onKeyDown={() => chooseMove(move)}
							onChange={(e) => chooseMove(Number(e.target.value))}
						/>
					</foreignObject>
					<SvgText x={180} y={398}>
						{l("Underlying change", "标的变化")} {money(move, true)}
					</SvgText>
					<SvgText x={180} y={431} muted>
						{l(
							"Dashed: fixed delta · Solid: curve",
							"虚线：固定 Delta · 实线：曲线",
						)}
					</SvgText>
					<SvgText x={180} y={455} muted>
						{l("Teaching curve, not a market price", "教学曲线，并非市场价格")}
					</SvgText>
				</Diagram>
			}
		>
			<p className="font-mono text-muted-foreground text-xs">
				{l("Separate mathematical illustration", "独立数学示例")}
				<br />
				{l("Anchor price", "锚点价格")} {money(curve.priceCents)} · Δ{" "}
				{known ? curve.delta : "—"}
				<br />
				{l("Declared curvature", "给定曲率")} {curve.gammaPerDollar} / $1
			</p>
			<FieldGroup>
				<SelectField
					label={l("Estimate conditions", "估计条件")}
					value={condition}
					options={[
						["fixed", l("Other inputs held fixed", "其他输入固定")],
						["volatility", l("Volatility also changed", "波动率也已变化")],
						["time", l("Time also passed", "时间也已流逝")],
						["missing", l("Model delta missing", "模型 Delta 缺失")],
					]}
					onChange={(value) => {
						playback.select(playback.frame);
						setCondition(value);
					}}
				/>
				<RangeControl
					label={l("Stress-test underlying move", "压力测试标的变动")}
					value={move}
					display={money(move, true)}
					min={curve.moveRange[0]}
					max={curve.moveRange[1]}
					step={5}
					onChange={chooseMove}
				/>
			</FieldGroup>
			<PlaybackButton
				playing={playback.playing}
				onClick={() => {
					setManual(null);
					playback.toggle();
				}}
				l={l}
			/>
			<div className="grid grid-cols-2 gap-3 text-sm">
				<p data-delta-spot-only>
					{l("Old-delta spot calculation / unit", "旧 Delta 现价计算/单位")}
					<br />
					<strong>{known ? money(curve.delta * move, true, 4) : "—"}</strong>
				</p>
				<p data-delta-reference>
					{l("Curve price / unit", "曲线价格/单位")}
					<br />
					<strong>
						{fixed ? money(values.curvedPriceCents, false, 4) : "—"}
					</strong>
				</p>
				<p data-delta-gap>
					{l("Curve minus line / unit", "曲线减直线/单位")}
					<br />
					<strong>
						{fixed
							? money(
									values.curvedPriceCents - values.linearPriceCents,
									true,
									4,
								)
							: "—"}
					</strong>
				</p>
				<p data-delta-local-slope>
					{l("Curve's local delta", "曲线局部 Delta")}
					<br />
					<strong>{fixed ? signed(values.localDelta, 4) : "—"}</strong>
				</p>
			</div>
			<Alert role="note">
				<AlertTitle>
					{fixed
						? l("The slope can change as spot moves", "斜率可随现价变动")
						: l(
								"The old delta cannot supply the total",
								"旧 Delta 不能给出总变化",
							)}
				</AlertTitle>
				<AlertDescription>
					{fixed
						? l(
								`This declared quadratic curve adds ½ × ${curve.gammaPerDollar} × move² to the ${curve.delta} × move response (dollar units). Near the anchor the line and curve are close; farther away their gap grows. It illustrates curvature, not a validated option-pricing model or a universal safe-move threshold.`,
								`给定二次曲线在 ${curve.delta} × 变动响应上加入 ½ × ${curve.gammaPerDollar} × 变动平方（美元单位）。锚点附近直线与曲线接近，远离后差距扩大。这展示曲率，不是经过验证的期权定价模型或通用安全变动阈值。`,
							)
						: l(
								"A mechanical old-delta calculation for spot alone cannot estimate the total when other inputs change. Their effects and updated sensitivities are not supplied. If delta itself is missing, even that calculation is unavailable.",
								"当其他输入变化时，仅针对现价机械套用旧 Delta 不能估计总变化。此处未提供其他影响与更新后的敏感度。若 Delta 本身缺失，连该计算也不可用。",
							)}
				</AlertDescription>
			</Alert>
			<p className="text-muted-foreground text-xs">
				{l(
					"Delta is a model price sensitivity. Probability interpretations require additional assumptions; a delta of 0.50 is not a guaranteed 50% chance of a profitable trade. Model delta and a signed flow convention are different quantities.",
					"Delta 是模型价格敏感度。概率解读需要额外假设；Delta 0.50 不保证交易有 50% 盈利概率。模型 Delta 与带符号成交流约定是不同量。",
				)}
			</p>
		</SceneLayout>
	);
}
