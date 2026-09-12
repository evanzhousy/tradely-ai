import * as m from "motion/react-m";
import { createContext, type ReactNode, useContext, useState } from "react";
import {
	type CharmVannaConceptData,
	crossDeltaTerms,
	crossPositionChange,
} from "@/domain/learning/charm-vanna-concept";
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
export const CrossDeltaData = createContext<CharmVannaConceptData | null>(null);
function useData() {
	const data = useContext(CrossDeltaData);
	if (!data)
		throw new Error("Cross-delta scenes require authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const copy = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const number = (v: number | null) =>
	v === null
		? "—"
		: (v === 0 ? 0 : v).toLocaleString("en-US", { maximumFractionDigits: 4 });
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
		<p className="font-mono text-muted-foreground text-xs leading-relaxed">
			{data.reference}
			<br />
			{data.asOf}
			<br />
			{copy(locale)(
				"Spot and other model inputs held fixed",
				"现价与其他模型输入固定",
			)}
		</p>
	);
}
export function CrossDeltaEffectsScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const replay = useFrames(data.frames.length);
	const [manual, setManual] = useState<{
		days: number;
		ivPoints: number;
	} | null>(null);
	const event = manual ?? data.frames[replay.frame];
	const terms = crossDeltaTerms(
		data.conventions[0],
		event.days,
		event.ivPoints,
	);
	const enabled = useLessonMotion();
	const choose = (next: typeof event) => {
		replay.select(replay.frame);
		setManual(next);
	};
	const rows = [
		{
			key: "time",
			label: l("Charm contribution", "Charm 贡献"),
			value: terms.charm,
		},
		{
			key: "vol",
			label: l("Vanna contribution", "Vanna 贡献"),
			value: terms.vanna,
		},
		{
			key: "total",
			label: l("Combined option delta change", "合计期权 Delta 变化"),
			value: terms.total,
		},
	];
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Time volatility and combined delta effects",
						"时间波动率及合计 Delta 影响",
					)}
					height={460}
				>
					<SvgText x={180} y={30}>
						{l(
							"Delta change · fixed ±0.1 scale",
							"Delta 变化 · 固定 ±0.1 刻度",
						)}
					</SvgText>
					{rows.map((row, i) => {
						const y = 85 + i * 115;
						const width = (Math.abs(row.value ?? 0) / 0.1) * 140;
						return (
							<g key={row.key}>
								<SvgText x={180} y={y - 20}>
									{row.label}
								</SvgText>
								<line
									x1={180}
									x2={180}
									y1={y - 5}
									y2={y + 26}
									stroke="currentColor"
									opacity={0.5}
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
								<g data-cross-effect={row.key}>
									<SvgText x={180} y={y + 55} strong>
										{signed(row.value)}
									</SvgText>
								</g>
							</g>
						);
					})}
					<SvgText x={180} y={427} muted>
						{l(
							"Multiply first; then add delta changes",
							"先相乘，再加 Delta 变化",
						)}
					</SvgText>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<RangeControl
				label={l("Elapsed calendar days", "已过自然日")}
				value={event.days}
				display={number(event.days)}
				min={data.dayRange[0]}
				max={data.dayRange[1]}
				step={0.5}
				onChange={(days) => choose({ ...event, days })}
			/>
			<RangeControl
				label={l("IV percentage-point change", "IV 百分点变化")}
				value={event.ivPoints}
				display={signed(event.ivPoints)}
				min={data.ivRange[0]}
				max={data.ivRange[1]}
				step={0.5}
				onChange={(ivPoints) => choose({ ...event, ivPoints })}
			/>
			<PlaybackButton
				playing={replay.playing}
				onClick={() => {
					setManual(null);
					replay.toggle();
				}}
				l={l}
			/>
			<p className="font-mono text-xs">
				Charm: −0.01 × {event.days} = {signed(terms.charm)}
				<br />
				Vanna: +0.02 × {event.ivPoints} = {signed(terms.vanna)}
			</p>
			<p data-cross-next>
				{l("Initial option delta", "初始期权 Delta")}:{" "}
				{number(data.initialDelta)}
				<br />
				{l("Local next option delta", "局部新期权 Delta")}:{" "}
				{number(terms.total === null ? null : data.initialDelta + terms.total)}
			</p>
			<Note>
				{l(
					"Charm is supplied per elapsed calendar day; vanna is supplied per one IV percentage point. One day and IV +2 points give −0.01 + 0.04 = +0.03. Opposing contributions can cancel without either sensitivity being zero.",
					"Charm 按每经过自然日给定，Vanna 按每 IV 百分点给定。一天与 IV +2 点得到 −0.01 + 0.04 = +0.03。相反贡献可抵消，而两项敏感度均不必为零。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"This first-order local estimate holds derivatives fixed and omits higher-order interactions. It is not a full repricing or an observed trade. Playback visits controlled teaching states, not market observations.",
					"此一阶局部估计固定导数并省略高阶交互，不是完整重定价或观测成交。回放展示控制教学状态，而非市场观测。",
				)}
			</p>
		</SceneLayout>
	);
}
export function CrossDeltaUnitsScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [id, setId] = useState(data.conventions[0].id);
	const [selected, setSelected] = useState("time");
	const convention =
		data.conventions.find((c) => c.id === id) ?? data.conventions[0];
	const terms = crossDeltaTerms(convention, 1, 2);
	const timeLabel =
		convention.timeBasis === null
			? l("Unknown time basis", "时间基准未知")
			: convention.timeBasis === "elapsed-day"
				? l("Per elapsed day", "每已过日")
				: l("Per remaining day", "每剩余日");
	const volLabel =
		convention.volBasis === null
			? l("Unknown IV scale", "IV 尺度未知")
			: convention.volBasis === "iv-point"
				? l("Per IV point", "每 IV 点")
				: l("Per decimal volatility", "每小数波动率");
	const rows = [
		{
			id: "time",
			label: timeLabel,
			formula: `${signed(convention.charm)} × ${signed(terms.timeChange)}`,
			value: terms.charm,
		},
		{
			id: "vol",
			label: volLabel,
			formula: `${signed(convention.vanna)} × ${signed(terms.volChange)}`,
			value: terms.vanna,
		},
	];
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Derivative units and matching input changes",
						"导数单位与匹配输入变化",
					)}
					height={440}
				>
					<SvgText x={180} y={30}>
						{l("Same event: +1 day, IV +2 points", "相同事件：+1 天，IV +2 点")}
					</SvgText>
					{rows.map((row, i) => (
						<g key={row.id}>
							<rect
								x={25}
								y={60 + i * 125}
								width={310}
								height={105}
								rx={14}
								fill={selected === row.id ? "var(--primary)" : "currentColor"}
								opacity={selected === row.id ? 0.16 : 0.05}
							/>
							<foreignObject x={25} y={60 + i * 125} width={310} height={105}>
								<button
									type="button"
									className="h-full w-full rounded-xl text-center text-sm"
									aria-label={
										row.id === "time"
											? l("Inspect time units", "检查时间单位")
											: l("Inspect volatility units", "检查波动率单位")
									}
									aria-pressed={selected === row.id}
									onClick={() => setSelected(row.id)}
								>
									<span className="block">{row.label}</span>
									<span className="block font-mono">{row.formula}</span>
									<span className="block font-mono font-semibold">
										{signed(row.value)}
									</span>
								</button>
							</foreignObject>
						</g>
					))}
					<SvgText x={180} y={343}>
						{l("Combined delta change", "合计 Delta 变化")}
					</SvgText>
					<g data-cross-unit-total>
						<SvgText x={180} y={381} strong>
							{signed(terms.total)}
						</SvgText>
					</g>
					<SvgText x={180} y={420} muted>
						{l("An unknown convention is not zero", "未知约定不是零")}
					</SvgText>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Derivative convention", "导数约定")}
				value={id}
				options={data.conventions.map((c) => [
					c.id,
					c.label[locale === "zh" ? 1 : 0],
				])}
				onChange={setId}
			/>
			<p data-cross-unit-time>Charm: {signed(terms.charm)}</p>
			<p data-cross-unit-vol>Vanna: {signed(terms.vanna)}</p>
			<Note>
				{selected === "time"
					? l(
							"One day passing means elapsed time +1 day but remaining maturity −1 day. The equivalent derivatives here are −0.01 per elapsed day and +0.01 per remaining day. Both give delta change −0.01 when paired with the correct time change.",
							"经过一天意味着已过时间 +1 天、剩余期限 −1 天。本例等价导数为每已过日 −0.01 与每剩余日 +0.01。匹配正确时间变化后，Delta 变化均为 −0.01。",
						)
					: l(
							"IV moving from 20% to 22% is +2 percentage points, or +0.02 in decimal volatility. Vanna +0.02 per IV point is equivalent here to +2 per decimal unit. Multiply by 2 or 0.02 respectively to get the same +0.04 delta change.",
							"IV 从 20% 变为 22% 是 +2 个百分点，或小数波动率 +0.02。本例每 IV 点 +0.02 的 Vanna 等价于每小数单位 +2。分别乘 2 或 0.02，均得到 +0.04 Delta 变化。",
						)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"Only the supplied representations change, not the event. These are equivalent local teaching derivatives, not claims about every vendor's definition. Missing time basis or volatility scale leaves the affected term and combined result unavailable while retaining the other term.",
					"仅改变给定表示方式，不改变事件。这些是等价局部教学导数，并非所有供应商定义。时间基准或波动率尺度缺失时，对应项与合计不可用，另一项仍保留。",
				)}
			</p>
		</SceneLayout>
	);
}
export function CrossDeltaPositionScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [id, setId] = useState(data.events[0].id);
	const [side, setSide] = useState<"long" | "short">("long");
	const [quantity, setQuantity] = useState(data.quantity);
	const [known, setKnown] = useState(true);
	const event = data.events.find((e) => e.id === id) ?? data.events[0];
	const terms = crossDeltaTerms(
		data.conventions[0],
		event.days,
		event.ivPoints,
	);
	const change = crossPositionChange(
		terms.total,
		quantity,
		data.multiplier,
		side,
		known,
	);
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Option and signed position delta changes",
						"期权与带符号持仓 Delta 变化",
					)}
					height={430}
				>
					<SvgText x={180} y={32}>
						{l("Option delta change", "期权 Delta 变化")}
					</SvgText>
					<g data-cross-option>
						<SvgText x={180} y={73} strong>
							{signed(terms.total)}
						</SvgText>
					</g>
					<SvgText x={180} y={113}>
						{l("Multiply by signed contract units", "乘带符号合约单位")}
					</SvgText>
					{(["long", "short"] as const).map((value, i) => (
						<g key={value}>
							<rect
								x={30 + i * 160}
								y={142}
								width={140}
								height={65}
								rx={13}
								fill={side === value ? "var(--primary)" : "currentColor"}
								opacity={side === value ? 0.2 : 0.05}
							/>
							<foreignObject x={30 + i * 160} y={142} width={140} height={65}>
								<button
									type="button"
									className="h-full w-full rounded-xl text-center text-sm"
									aria-pressed={side === value}
									onClick={() => setSide(value)}
								>
									{value === "long"
										? l("Long (+)", "多头 (+)")
										: l("Short (−)", "空头 (−)")}
								</button>
							</foreignObject>
						</g>
					))}
					<SvgText x={180} y={245}>
						{known
							? `${side === "long" ? "+" : "−"}${quantity} × ${data.multiplier}`
							: l("Position evidence missing", "持仓证据缺失")}
					</SvgText>
					<SvgText x={180} y={297}>
						{l("Position delta change", "持仓 Delta 变化")}
					</SvgText>
					<g data-cross-position>
						<SvgText x={180} y={339} strong>
							{signed(change)}
						</SvgText>
					</g>
					<SvgText x={180} y={378}>
						{l("shares-equivalent", "股等价量")}
					</SvgText>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Input event", "输入事件")}
				value={id}
				options={data.events.map((e) => [
					e.id,
					e.label[locale === "zh" ? 1 : 0],
				])}
				onChange={setId}
			/>
			<RangeControl
				label={l("Position contracts", "持仓张数")}
				value={quantity}
				display={number(quantity)}
				min={0}
				max={10}
				step={1}
				onChange={setQuantity}
			/>
			<SelectField
				label={l("Position evidence", "持仓证据")}
				value={known ? "known" : "missing"}
				options={[
					["known", l("Quantity and side supplied", "张数与方向已提供")],
					["missing", l("Position not established", "持仓未确定")],
				]}
				onChange={(v) => setKnown(v === "known")}
			/>
			<p data-cross-position-next>
				{l("Initial option delta", "初始期权 Delta")}:{" "}
				{number(data.initialDelta)}
				<br />
				{l("Local next option delta", "局部新期权 Delta")}:{" "}
				{number(terms.total === null ? null : data.initialDelta + terms.total)}
			</p>
			<Note>
				{l(
					"For the +0.03 example, the option delta change becomes +6 shares-equivalent for two long contracts ×100, or −6 for two short contracts. The option's own next delta stays 0.48. Position side changes exposure, not the option's model delta.",
					"在 +0.03 示例中，期权 Delta 变化对于两张多头×100 是 +6 股等价量；两张空头则为 −6。期权自身新 Delta 仍为 0.48。持仓方向改变敞口，不改变期权模型 Delta。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"This is a local modeled exposure change, not observed flow or an identified dealer hedge. Charm concentrations or pins remain approximate summaries of model assumptions. No position target can be established from option sensitivities alone.",
					"这是局部模型敞口变化，不是观测成交流或已识别做市商对冲。Charm 集中或钉住仍是模型假设的近似汇总，仅凭期权敏感度不能确定持仓目标。",
				)}
			</p>
		</SceneLayout>
	);
}
