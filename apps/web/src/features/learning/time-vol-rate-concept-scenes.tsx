import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { FieldGroup } from "@tradely/ui/components/field";
import * as m from "motion/react-m";
import { createContext, useContext, useState } from "react";
import { signedPositionUnits } from "@/domain/learning/local-greeks";
import {
	combineGreekShock,
	greekContribution,
	inputDifference,
	type OtherGreek,
	type TimeVolRateConceptData,
	type TimeVolRateSnapshot,
} from "@/domain/learning/time-vol-rate-concept";
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

export const TimeVolRateData = createContext<TimeVolRateConceptData | null>(
	null,
);
function useData() {
	const data = useContext(TimeVolRateData);
	if (!data)
		throw new Error("Time/volatility/rate scenes require authorized data");
	return data;
}
type Props = { locale: Locale };
const copy = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const tidy = (value: number) => (Math.abs(value) < 1e-9 ? 0 : value);
const number = (value: number) =>
	tidy(value).toLocaleString("en-US", { maximumFractionDigits: 4 });
const signed = (value: number | null) =>
	value === null
		? "—"
		: `${tidy(value) > 0 ? "+" : tidy(value) < 0 ? "−" : ""}${number(Math.abs(value))}`;
const money = (cents: number | null) =>
	cents === null
		? "—"
		: `${tidy(cents) > 0 ? "+" : tidy(cents) < 0 ? "−" : ""}$${(Math.abs(tidy(cents)) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
const greekName = (id: OtherGreek) =>
	id === "theta" ? "Theta" : id === "vega" ? "Vega" : "Rho";
function Snapshot({
	locale,
	snapshot,
}: Props & { snapshot: TimeVolRateSnapshot }) {
	const data = useData();
	const l = copy(locale);
	return (
		<p className="font-mono text-muted-foreground text-xs leading-relaxed">
			{snapshot.contract}
			<br />
			{data.asOf}
			<br />
			{l(
				"Fictional model Greeks per option unit",
				"每单位期权的虚构模型希腊值",
			)}
		</p>
	);
}

export function GreekUnitsScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const language = locale === "zh" ? 1 : 0;
	const [id, setId] = useState<OtherGreek>("theta");
	const [after, setAfter] = useState(data.factors[0].after);
	const factor = data.factors.find((f) => f.id === id) ?? data.factors[0];
	const snapshot = data.options[0];
	const difference = inputDifference(factor.before, after);
	const effect = difference
		? greekContribution(snapshot.greeks[id], difference.change)
		: null;
	const inputLabel = (value: number) =>
		factor.pointBased
			? `${number(value)}%`
			: `${number(value)} ${l(value === 1 ? "day" : "days", "天")}`;
	const x = (value: number) =>
		40 +
		((value - factor.range[0]) / (factor.range[1] - factor.range[0])) * 280;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Read input units before applying a Greek",
						"应用希腊值前读取输入单位",
					)}
					height={435}
				>
					<SvgText x={180} y={25}>
						{factor.label[language]}
					</SvgText>
					{[
						[92, l("Before", "之前"), factor.before],
						[268, l("After", "之后"), after],
					].map(([cx, label, value]) => (
						<g key={String(label)}>
							<rect
								x={Number(cx) - 76}
								y="49"
								width="152"
								height="80"
								rx="12"
								className="contract-svg-paper"
							/>
							<SvgText x={Number(cx)} y={76} muted>
								{label}
							</SvgText>
							<SvgText x={Number(cx)} y={111} strong>
								{inputLabel(Number(value))}
							</SvgText>
						</g>
					))}
					<path
						d={`M${x(factor.before)} 164H${x(after)}`}
						className="contract-svg-active-line"
					/>
					<circle
						cx={x(factor.before)}
						cy="164"
						r="4"
						className="contract-svg-dot"
					/>
					<circle
						cx={x(after)}
						cy="164"
						r="9"
						className="contract-svg-handle"
					/>
					<foreignObject x="20" y="124" width="320" height="80">
						<input
							type="range"
							className="contract-range contract-svg-range"
							aria-label={l("Drag Greek input", "拖动希腊值输入")}
							aria-valuetext={inputLabel(after)}
							min={factor.range[0]}
							max={factor.range[1]}
							step={factor.step}
							value={after}
							onChange={(e) => setAfter(Number(e.target.value))}
						/>
					</foreignObject>
					<SvgText x={180} y={229} muted>
						{l("Change in the quoted input unit", "按报价输入单位计算变化")}
					</SvgText>
					<g data-tvr-input-change>
						<SvgText x={180} y={263} strong>
							{signed(difference?.change ?? null)} {factor.unit[language]}
							{language === 0 && Math.abs(difference?.change ?? 0) !== 1
								? "s"
								: ""}
						</SvgText>
					</g>
					<SvgText x={180} y={305} muted>
						{factor.pointBased
							? `${l("Relative change", "相对变化")}: ${signed(difference?.relativePercent ?? null)}%`
							: l(
									"Calendar days, not trading sessions",
									"自然日，而非交易时段",
								)}
					</SvgText>
					<rect
						x="14"
						y="335"
						width="332"
						height="80"
						rx="12"
						className="contract-svg-wash"
					/>
					<SvgText x={180} y={361} muted>
						{l("Estimated price change / unit", "每单位价格估计变化")}
					</SvgText>
					<g data-tvr-unit-effect>
						<SvgText x={180} y={396} strong>
							{money(effect)}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<Snapshot locale={locale} snapshot={snapshot} />
			<FieldGroup>
				<SelectField
					label={l("Sensitivity to inspect", "查看的敏感度")}
					value={id}
					options={data.factors.map((f) => [f.id, f.label[language]])}
					onChange={(value) => {
						const next = data.factors.find((f) => f.id === value);
						if (next) {
							setId(next.id);
							setAfter(next.after);
						}
					}}
				/>
				<RangeControl
					label={l("Input after change", "变化后的输入")}
					value={after}
					display={inputLabel(after)}
					min={factor.range[0]}
					max={factor.range[1]}
					step={factor.step}
					onChange={setAfter}
				/>
			</FieldGroup>
			<p className="text-sm">
				{greekName(id)}:{" "}
				<strong>
					{money(snapshot.greeks[id])} / {factor.unit[language]}
				</strong>
				<br />
				{l(
					"per option unit, with other inputs fixed",
					"每单位期权，其他输入固定",
				)}
			</p>
			<p className="font-mono text-sm">
				{money(snapshot.greeks[id])} × {signed(difference?.change ?? null)} ={" "}
				{money(effect)}
			</p>
			<Alert role="note">
				<AlertTitle>
					{factor.pointBased
						? l(
								"Percentage points are not relative percentages",
								"百分点不等于相对百分比",
							)
						: l("Use the stated day convention", "使用声明的天数约定")}
				</AlertTitle>
				<AlertDescription>
					{factor.pointBased
						? l(
								"From 20% to 23% is +3 percentage points and +15% relative growth. The supplied vega/rho convention multiplies the point change, not the relative percentage and not 0.03. These are local estimates. Larger moves or changing inputs can make a constant-Greek estimate inaccurate.",
								"从 20% 到 23% 是 +3 个百分点、相对增长 +15%。给定 Vega/Rho 约定乘百分点变化，不乘相对百分比，也不乘 0.03。这是局部估计；变动较大或其他输入变化时，常数希腊值估计可能不准确。",
							)
						: l(
								"This lesson quotes theta per calendar day. Two days means two calendar days, including weekends. Theta itself can change with time and other inputs, so a straight multiplication is a local estimate, not a promised daily decay schedule.",
								"本课 Theta 按自然日报价。两天指两个自然日，包括周末。Theta 本身会随时间及其他输入变化，直接相乘是局部估计，不是每日固定损耗承诺。",
							)}
				</AlertDescription>
			</Alert>
		</SceneLayout>
	);
}

export function GreekSignsScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const language = locale === "zh" ? 1 : 0;
	const [id, setId] = useState(data.options[0].id);
	const [side, setSide] = useState<"long" | "short">("long");
	const [quantity, setQuantity] = useState(data.quantity);
	const snapshot = data.options.find((s) => s.id === id) ?? data.options[0];
	const units = signedPositionUnits(quantity, data.multiplier, side);
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Scale each Greek while retaining its own units",
						"缩放各希腊值并保留各自单位",
					)}
					height={455}
				>
					<SvgText x={180} y={25}>
						{quantity} × {data.multiplier} × {side === "long" ? "+1" : "−1"}
					</SvgText>
					{data.factors.map((f, i) => (
						<g key={f.id}>
							<rect
								x="14"
								y={48 + i * 100}
								width="332"
								height="84"
								rx="12"
								className="contract-svg-paper"
							/>
							<SvgText x={180} y={74 + i * 100} muted>
								{greekName(f.id)} · {money(snapshot.greeks[f.id])}{" "}
								{l("per unit", "每单位")}
							</SvgText>
							<g data-tvr-sensitivity={f.id}>
								<SvgText x={180} y={108 + i * 100} strong>
									{money(
										units === null
											? null
											: greekContribution(snapshot.greeks[f.id], 1, units),
									)}
								</SvgText>
							</g>
							<SvgText x={180} y={126 + i * 100} muted>
								/ {f.unit[language]}
							</SvgText>
						</g>
					))}
					<path d="M40 385H320" className="contract-svg-line" />
					<circle
						cx={40 + ((quantity - 1) / (data.quantityMax - 1)) * 280}
						cy="385"
						r="9"
						className="contract-svg-handle"
					/>
					<foreignObject x="20" y="345" width="320" height="80">
						<input
							type="range"
							className="contract-range contract-svg-range"
							aria-label={l("Drag position size", "拖动持仓规模")}
							min={1}
							max={data.quantityMax}
							step={1}
							value={quantity}
							onChange={(e) => setQuantity(Number(e.target.value))}
						/>
					</foreignObject>
					<SvgText x={180} y={441}>
						{quantity} {l("contracts", "张")}
					</SvgText>
				</Diagram>
			}
		>
			<Snapshot locale={locale} snapshot={snapshot} />
			<FieldGroup>
				<SelectField
					label={l("Supplied option", "给定期权")}
					value={id}
					options={data.options.map((s) => [s.id, s.label[language]])}
					onChange={setId}
				/>
				<ChoiceField
					label={l("Position side", "持仓方向")}
					value={side}
					options={[
						["long", l("Long", "多头")],
						["short", l("Short", "空头")],
					]}
					onChange={setSide}
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
			<p className="text-sm">
				{l("Stated multiplier", "给定乘数")}: {data.multiplier}{" "}
				{l("units per contract", "单位/张")}
			</p>
			<Alert role="note">
				<AlertTitle>
					{l("Reverse the position sign once", "只反转一次持仓符号")}
				</AlertTitle>
				<AlertDescription>
					{l(
						"Shorting the same option reverses its position sensitivities without changing the option's quoted Greeks. Apply contracts and the stated multiplier once. The supplied call and put differ in rho; signs belong to the model and contract, not a universal rule for every product.",
						"做空同一期权会反转持仓敏感度，不改变期权报价希腊值。张数与给定乘数只应用一次。给定看涨与看跌的 Rho 不同；符号属于该模型与合约，并非所有产品通用规则。",
					)}
				</AlertDescription>
			</Alert>
			<p className="text-muted-foreground text-xs">
				{l(
					"Do not add these sensitivities directly: days, IV points and rate points are different input units. First apply a declared change to each, then add their estimated dollar contributions. Rates, dividends, exercise style and pricing assumptions matter.",
					"不要直接相加这些敏感度：天、IV 点与利率点是不同输入单位。先分别应用声明变动，再相加估计美元贡献。利率、股息、行权方式与定价假设都重要。",
				)}
			</p>
		</SceneLayout>
	);
}

export function GreekAttributionScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const motion = useLessonMotion();
	const language = locale === "zh" ? 1 : 0;
	const playback = useFrames(data.shocks.length);
	const [side, setSide] = useState<"long" | "short">("long");
	const [visibility, setVisibility] = useState("all");
	const original = data.options[0];
	const snapshot = {
		...original,
		delta: visibility === "delta" ? null : original.delta,
		greeks: {
			...original.greeks,
			...(visibility === "theta" ||
			visibility === "vega" ||
			visibility === "rho"
				? { [visibility]: null }
				: {}),
		},
	};
	const shock = data.shocks[playback.frame];
	const result = combineGreekShock(
		snapshot,
		shock,
		data.quantity,
		data.multiplier,
		side,
	);
	const rows = ["spot", "theta", "vega", "rho"] as const;
	const label = (id: (typeof rows)[number]) =>
		id === "spot" ? l("Spot / delta", "现价 / Delta") : greekName(id);
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Signed dollar contributions on one common scale",
						"在共同尺度上比较带符号美元贡献",
					)}
					height={510}
				>
					<SvgText x={180} y={25} muted>
						{l("Estimated position change · USD", "持仓估计变化 · 美元")}
					</SvgText>
					<SvgText x={180} y={48} muted>
						± {money(data.contributionLimitCents).replace("+", "")}
					</SvgText>
					{rows.map((id, i) => {
						const value = result?.contributions[id] ?? null;
						const width =
							value === null
								? 0
								: (Math.abs(value) / data.contributionLimitCents) * 140;
						return (
							<g key={id}>
								<SvgText x={180} y={78 + i * 65} muted>
									{label(id)} ·{" "}
									<tspan data-tvr-contribution={id}>{money(value)}</tspan>
								</SvgText>
								<path
									d={`M40 ${101 + i * 65}H320M180 ${91 + i * 65}v20`}
									className="contract-svg-line"
								/>
								{value !== null ? (
									<rect
										x={value < 0 ? 180 - width : 180}
										y={94 + i * 65}
										width={width}
										height="14"
										rx="4"
										className="contract-svg-wash"
									/>
								) : null}
							</g>
						);
					})}
					<rect
						x="14"
						y="335"
						width="332"
						height="68"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={359} muted>
						{l("Net declared estimate", "声明项目净估计")}
					</SvgText>
					<g data-tvr-net>
						<SvgText x={180} y={390} strong>
							{money(result?.totalCents ?? null)}
						</SvgText>
					</g>
					<path d="M40 446H320" className="contract-svg-line" />
					<m.circle
						initial={false}
						cx={40 + (playback.frame / (data.shocks.length - 1)) * 280}
						cy="446"
						r="10"
						animate={{
							cx: 40 + (playback.frame / (data.shocks.length - 1)) * 280,
						}}
						transition={
							playback.playing && motion ? lessonTransition : instantTransition
						}
						className="contract-svg-handle"
					/>
					<foreignObject x="20" y="406" width="320" height="80">
						<input
							type="range"
							className="contract-range contract-svg-range"
							aria-label={l("Contribution build-up timeline", "贡献累加时间轴")}
							aria-valuetext={shock.label[language]}
							min={0}
							max={data.shocks.length - 1}
							step={1}
							value={playback.frame}
							onPointerDown={() => playback.select(playback.frame)}
							onKeyDown={() => playback.select(playback.frame)}
							onChange={(e) => playback.select(Number(e.target.value))}
						/>
					</foreignObject>
					<SvgText x={180} y={500} muted>
						{l(
							"Build-up, not an observed price path",
							"贡献累加，并非观测价格路径",
						)}
					</SvgText>
				</Diagram>
			}
		>
			<Snapshot locale={locale} snapshot={snapshot} />
			<p className="font-mono text-muted-foreground text-xs">
				{data.quantity} × {data.multiplier} · Δ {signed(snapshot.delta)}
				<br />
				{data.factors
					.map(
						(f) =>
							`${greekName(f.id)} ${money(snapshot.greeks[f.id])} / ${f.unit[language]}`,
					)
					.join(" · ")}
			</p>
			<FieldGroup>
				<SelectField
					label={l("Build-up step", "累加步骤")}
					value={String(playback.frame)}
					options={data.shocks.map((s, i) => [String(i), s.label[language]])}
					onChange={(value) => playback.select(Number(value))}
				/>
				<ChoiceField
					label={l("Position side", "持仓方向")}
					value={side}
					options={[
						["long", l("Long", "多头")],
						["short", l("Short", "空头")],
					]}
					onChange={(value) => {
						playback.select(playback.frame);
						setSide(value);
					}}
				/>
				<SelectField
					label={l("Visible inputs", "可见输入")}
					value={visibility}
					options={[
						["all", l("All supplied Greeks", "全部给定希腊值")],
						["delta", l("Withhold delta", "隐藏 Delta")],
						...data.factors.map(
							(f) =>
								[
									f.id,
									l(`Withhold ${greekName(f.id)}`, `隐藏 ${greekName(f.id)}`),
								] as const,
						),
					]}
					onChange={(value) => {
						playback.select(playback.frame);
						setVisibility(value);
					}}
				/>
			</FieldGroup>
			<PlaybackButton
				playing={playback.playing}
				onClick={playback.toggle}
				l={l}
			/>
			<div className="grid grid-cols-2 gap-3 text-sm">
				<p>
					{l("Stock move", "标的变动")}
					<br />
					{money(shock.spotCents)}
				</p>
				{data.factors.map((f) => (
					<p key={f.id}>
						{greekName(f.id)} {l("input change", "输入变化")}
						<br />
						{signed(shock.changes[f.id])} {f.unit[language]}
						{language === 0 && Math.abs(shock.changes[f.id]) !== 1 ? "s" : ""}
					</p>
				))}
			</div>
			<p data-tvr-coverage className="text-sm">
				{result?.totalCents === null || !result
					? l("Incomplete inputs: total unavailable", "输入不完整：合计不可用")
					: l("All declared contributions available", "所有声明贡献均可用")}
			</p>
			<Alert role="note">
				<AlertTitle>
					{l(
						"An attribution estimate, not realized P&L",
						"归因估计，而非已实现盈亏",
					)}
				</AlertTitle>
				<AlertDescription>{data.attributionNote[language]}</AlertDescription>
			</Alert>
			<p className="text-muted-foreground text-xs">
				{l(
					"Greeks are held constant for this local sum. Gamma, changing sensitivities, cross-effects, dividends, exercise/assignment, financing, taxes and fees are omitted. Hide one Greek to inspect input coverage; missing is not zero. A favorable stock move alone does not determine option profit.",
					"局部求和中希腊值保持不变。省略 Gamma、敏感度变化、交互影响、股息、行权/指派、融资、税费与费用。隐藏一个希腊值可检查输入覆盖，缺失不等于零。仅标的方向有利不能确定期权利润。",
				)}
			</p>
		</SceneLayout>
	);
}
