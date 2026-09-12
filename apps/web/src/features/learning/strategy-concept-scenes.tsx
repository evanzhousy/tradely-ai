import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { FieldGroup } from "@tradely/ui/components/field";
import * as m from "motion/react-m";
import { createContext, useContext, useState } from "react";
import {
	rollState,
	type StrategyConceptData,
	type StrategyExample,
	type StrategyLeg,
	strategyPoints,
	valueStrategy,
} from "@/domain/learning/strategy-concept";
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
export const StrategyData = createContext<StrategyConceptData | null>(null);
function useStrategyData() {
	const data = useContext(StrategyData);
	if (!data)
		throw new Error("Strategy scenes require authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const text = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const money = (cents: number) =>
	`${cents < 0 ? "−" : ""}$${(Math.abs(cents) / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const legName = (leg: StrategyLeg, l: (en: string, zh: string) => string) =>
	leg.kind === "stock"
		? `${leg.shares} ${l("shares", "股股票")}`
		: `${leg.side === "long" ? l("Long", "多头") : l("Short", "空头")} ${leg.option} · K ${money(leg.strike)}`;
function ExampleField({
	locale,
	example,
	onChange,
}: Props & { example: StrategyExample; onChange: (id: string) => void }) {
	const data = useStrategyData();
	const l = text(locale);
	return (
		<SelectField
			label={l("Strategy example", "策略示例")}
			value={example.id}
			options={data.examples.map((e) => [
				e.id,
				e.label[locale === "zh" ? 1 : 0],
			])}
			onChange={onChange}
		/>
	);
}
function Snapshot({ locale }: Props) {
	const data = useStrategyData();
	const l = text(locale);
	return (
		<p className="font-mono text-muted-foreground text-xs leading-relaxed">
			{data.underlying}
			<br />
			{l("Entry example", "入场示例")}: {data.asOf}
			<br />
			{l("Common expiry", "共同到期日")}: {data.expiry}
			<br />
			{l(
				"Fictional positions · prices per share/unit",
				"虚构持仓 · 每股/单位价格",
			)}
		</p>
	);
}

export function CompositionScene({ locale }: Props) {
	const data = useStrategyData();
	const l = text(locale);
	const language = locale === "zh" ? 1 : 0;
	const motion = useLessonMotion();
	const [id, setId] = useState(data.examples[0].id);
	const [scope, setScope] = useState("linked");
	const [focus, setFocus] = useState<string | null>(null);
	const example = data.examples.find((e) => e.id === id) ?? data.examples[0];
	const selected =
		example.legs.find((leg) => leg.id === (focus ?? example.focusLegId)) ??
		example.legs[0];
	const full = scope === "linked";
	const legs = full ? example.legs : [selected];
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Compose supplied positions or inspect only one position",
						"组合给定持仓或仅检查单一持仓",
					)}
					height={430}
				>
					<SvgText x={180} y={24} muted>
						{full
							? l("Supplied linked positions", "给定关联持仓")
							: l("Only this position is shown", "仅展示此持仓")}
					</SvgText>
					{legs.map((leg, i) => (
						<g key={leg.id}>
							<rect
								x="14"
								y={42 + i * 88}
								width="332"
								height="72"
								rx="12"
								className="contract-svg-paper"
							/>
							<SvgText x={180} y={68 + i * 88}>
								{legName(leg, l)}
							</SvgText>
							<SvgText x={180} y={97 + i * 88} muted>
								{leg.kind === "stock"
									? `${l("Entry", "入场")} ${money(leg.entryPrice)} / ${l("share", "股")}`
									: `${leg.contracts} × ${leg.multiplier} · ${l("Premium", "权利金")} ${money(leg.premium)} / ${l("unit", "单位")}`}
							</SvgText>
							{i < legs.length - 1 ? (
								<SvgText x={180} y={127 + i * 88}>
									+
								</SvgText>
							) : null}
						</g>
					))}
					{!full ? (
						<>
							<rect
								x="30"
								y="144"
								width="300"
								height="80"
								rx="12"
								className="contract-svg-paper"
							/>
							<SvgText x={180} y={175} muted>
								{l("Other holdings / linkage", "其他持仓 / 关联")}
							</SvgText>
							<SvgText x={180} y={203}>
								{l("Not supplied in this view", "此视角未提供")}
							</SvgText>
						</>
					) : (
						<m.path
							key={id}
							d={`M180 ${42 + (legs.length - 1) * 88 + 72}V333`}
							className="contract-svg-active-line"
							initial={{ pathLength: motion ? 0 : 1 }}
							animate={{ pathLength: 1 }}
							transition={motion ? lessonTransition : instantTransition}
						/>
					)}
					<rect
						x="14"
						y="333"
						width="332"
						height="78"
						rx="12"
						className={full ? "contract-svg-wash" : "contract-svg-paper"}
					/>
					<SvgText x={180} y={359} muted>
						{l("Structure supported by this view", "此视角支持的结构")}
					</SvgText>
					<g data-strategy-identity>
						<SvgText x={180} y={391} strong>
							{full
								? example.label[language]
								: l("Not established", "无法确定")}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<Snapshot locale={locale} />
			<FieldGroup>
				<ExampleField
					locale={locale}
					example={example}
					onChange={(value) => {
						setId(value);
						setFocus(null);
					}}
				/>
				<ChoiceField
					label={l("Evidence view", "证据视角")}
					value={scope}
					options={[
						["linked", l("Linked structure", "关联结构")],
						["single", l("One position only", "仅一个持仓")],
					]}
					onChange={setScope}
				/>
				<SelectField
					label={l("Selected position", "选定持仓")}
					value={selected.id}
					options={example.legs.map((leg) => [leg.id, legName(leg, l)])}
					onChange={setFocus}
				/>
			</FieldGroup>
			<Alert role="note">
				<AlertTitle>
					{full
						? example.label[language]
						: l(
								"An isolated leg is incomplete evidence",
								"孤立单腿的证据不完整",
							)}
				</AlertTitle>
				<AlertDescription>
					{full
						? example.note[language]
						: l(
								"The selected position could stand alone or link to other options or shares. One position does not identify the complete structure, portfolio or investor outlook.",
								"选定持仓可能独立存在，也可能关联其他期权或股票。单一持仓不能识别完整结构、组合或投资者观点。",
							)}
				</AlertDescription>
			</Alert>
			<p className="text-muted-foreground text-xs">
				{l(
					"This compares evidence views for a known teaching example. Signed positions are supplied here; an isolated trade print provides still less information and does not itself establish opening/closing status.",
					"这是对已知教学示例的证据视角比较。此处给定了持仓方向；孤立成交提供的信息更少，本身不确定开平仓状态。",
				)}
			</p>
		</SceneLayout>
	);
}

export function ExpirationStrategyScene({ locale }: Props) {
	const data = useStrategyData();
	const l = text(locale);
	const language = locale === "zh" ? 1 : 0;
	const [id, setId] = useState(data.examples[0].id);
	const [spot, setSpot] = useState(data.defaultSpot);
	const [fees, setFees] = useState(0);
	const [measure, setMeasure] = useState<"profit" | "terminal">("profit");
	const [scaleMode, setScaleMode] = useState("fit");
	const example = data.examples.find((e) => e.id === id) ?? data.examples[0];
	const result = valueStrategy(example.legs, spot, fees);
	const points = strategyPoints(example.legs, data.spotRange, fees, measure);
	const extents = [0, data.feeMax]
		.flatMap(
			(f) => strategyPoints(example.legs, data.spotRange, f, measure) ?? [],
		)
		.map((p) => p.value);
	const lower = Math.min(0, ...extents);
	const upper = Math.max(0, ...extents);
	const padding = Math.max(10000, (upper - lower) * 0.1);
	const fitRange = [
		Math.floor((lower - padding) / 10000) * 10000,
		Math.ceil((upper + padding) / 10000) * 10000,
	];
	const range =
		scaleMode === "shared"
			? measure === "profit"
				? data.profitRange
				: data.terminalRange
			: fitRange;
	const x = (s: number) =>
		40 +
		((s - data.spotRange[0]) / (data.spotRange[1] - data.spotRange[0])) * 280;
	const y = (v: number) => 270 - ((v - range[0]) / (range[1] - range[0])) * 220;
	const path = points
		?.map((p, i) => `${i ? "L" : "M"}${x(p.spot)} ${y(p.value)}`)
		.join(" ");
	const value = result.ok
		? measure === "profit"
			? result.profit
			: result.terminalValue
		: null;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Expiry value and profit from the complete supplied strategy",
						"完整给定策略的到期价值与盈亏",
					)}
					height={455}
				>
					<SvgText x={180} y={25} muted>
						{measure === "profit"
							? l(
									"Profit after entry cost and fees",
									"扣除入场成本和费用后的盈亏",
								)
							: l("Signed terminal value / payoff", "带符号的到期价值 / 支付")}
					</SvgText>
					<path d="M40 50V270H320" className="contract-svg-line" />
					<path
						d={`M40 ${y(0)}H320`}
						className="contract-svg-line"
						strokeDasharray="4 4"
					/>
					<SvgText x={20} y={y(0) + 4} muted>
						0
					</SvgText>
					<SvgText x={180} y={46} muted>
						{money(range[1])}
					</SvgText>
					<SvgText x={180} y={295} muted>
						{money(range[0])}
					</SvgText>
					{path ? <path d={path} className="contract-svg-active-line" /> : null}
					{value !== null ? (
						<>
							<path
								d={`M${x(spot)} 50V270`}
								className="contract-svg-line"
								strokeDasharray="4 4"
							/>
							<circle
								cx={x(spot)}
								cy={y(value)}
								r="8"
								className="contract-svg-handle"
							/>
						</>
					) : null}
					<SvgText x={55} y={322} muted>
						{money(data.spotRange[0])}
					</SvgText>
					<SvgText x={305} y={322} muted>
						{money(data.spotRange[1])}
					</SvgText>
					<path d="M40 348H320" className="contract-svg-line" />
					<circle cx={x(spot)} cy="348" r="9" className="contract-svg-handle" />
					<foreignObject x="20" y="308" width="320" height="80">
						<input
							type="range"
							className="contract-range contract-svg-range"
							aria-label={l("Drag expiry stock price", "拖动到期股价")}
							aria-valuetext={money(spot)}
							min={data.spotRange[0]}
							max={data.spotRange[1]}
							step={100}
							value={spot}
							onChange={(e) => setSpot(Number(e.target.value))}
						/>
					</foreignObject>
					<SvgText x={180} y={397} muted>
						{l("Underlying at expiry", "到期标的价格")} {money(spot)}
					</SvgText>
					<g data-strategy-chart-value>
						<SvgText x={180} y={432} strong>
							{value === null ? "—" : money(value)}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<Snapshot locale={locale} />
			<FieldGroup>
				<ExampleField locale={locale} example={example} onChange={setId} />
				<ChoiceField
					label={l("Chart measure", "图表指标")}
					value={measure}
					options={[
						["profit", l("Profit", "盈亏")],
						["terminal", l("Terminal value", "到期价值")],
					]}
					onChange={setMeasure}
				/>
				<ChoiceField
					label={l("Chart scale", "图表比例")}
					value={scaleMode}
					options={[
						["fit", l("Fit strategy", "适配策略")],
						["shared", l("Shared range", "共同范围")],
					]}
					onChange={setScaleMode}
				/>
				<RangeControl
					label={l("Expiry stock price", "到期股价")}
					value={spot}
					display={money(spot)}
					min={data.spotRange[0]}
					max={data.spotRange[1]}
					step={100}
					onChange={setSpot}
				/>
				<RangeControl
					label={l("Total fees in this example", "本例总费用")}
					value={fees}
					display={money(fees)}
					min={0}
					max={data.feeMax}
					step={500}
					onChange={setFees}
				/>
			</FieldGroup>
			{result.ok ? (
				<div className="grid grid-cols-2 gap-3 text-sm">
					<p data-strategy-terminal>
						{l("Terminal value", "到期价值")}
						<br />
						<strong>{money(result.terminalValue)}</strong>
					</p>
					<p data-strategy-entry>
						{l("Net entry cost", "净入场成本")}
						<br />
						<strong>{money(result.entryCost)}</strong>
					</p>
					<p>
						{l("Fees", "费用")}
						<br />
						<strong>{money(result.fees)}</strong>
					</p>
					<p data-strategy-profit>
						{l("Profit", "盈亏")}
						<br />
						<strong>{money(result.profit)}</strong>
					</p>
				</div>
			) : (
				<p role="status">
					{l(
						"Terms cannot support this expiry calculation.",
						"这些条款不能支持此到期计算。",
					)}
				</p>
			)}
			<Alert role="note">
				<AlertTitle>{example.label[language]}</AlertTitle>
				<AlertDescription>{example.note[language]}</AlertDescription>
			</Alert>
			<p className="text-muted-foreground text-xs">
				{l(
					"Use Shared range to compare magnitudes across examples; Fit strategy uses a separate scale. The finite spot window does not establish risk limits. Terminal value minus signed entry cost and fees gives expiry profit; a negative entry cost is a credit. Early exercise/assignment, dividends, financing and taxes are omitted.",
					"使用共同范围比较各示例的绝对量，适配策略模式使用各自比例。有限股价窗口不确定风险极限。到期价值减带符号入场成本及费用得到到期盈亏；负入场成本表示净收款。不含提前行权/指派、股息、融资和税费。",
				)}
			</p>
		</SceneLayout>
	);
}

export function RollScene({ locale }: Props) {
	const data = useStrategyData();
	const l = text(locale);
	const motion = useLessonMotion();
	const playback = useFrames(3);
	const state = rollState(data.roll, playback.frame);
	const steps = [
		l("Hold the old contract", "持有旧合约"),
		l("Sell to close filled", "卖出平仓已成交"),
		l("Buy to open filled", "买入开仓已成交"),
	];
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Two supplied roll fills change contract identity and inventory",
						"两笔给定移仓成交改变合约身份与持仓",
					)}
					height={500}
				>
					<SvgText x={180} y={25} muted>
						{data.roll.date} · {l("Separate roll example", "独立移仓示例")}
					</SvgText>
					<rect
						x="14"
						y="47"
						width="332"
						height="86"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={71} muted>
						{data.roll.oldContract}
					</SvgText>
					<SvgText x={180} y={98}>
						{l("Sell to close", "卖出平仓")} @ {money(data.roll.closingPrice)}
					</SvgText>
					<g data-roll-old>
						<SvgText x={180} y={122} muted>
							{l("Remaining old contracts", "剩余旧合约")}: {state.oldQuantity}
						</SvgText>
					</g>
					<path d="M180 133v35" className="contract-svg-line" />
					{playback.frame > 0 ? (
						<m.path
							key={playback.frame}
							d="M180 133v35"
							className="contract-svg-active-line"
							initial={{ pathLength: motion ? 0 : 1 }}
							animate={{ pathLength: 1 }}
							transition={motion ? lessonTransition : instantTransition}
						/>
					) : null}
					<rect
						x="14"
						y="168"
						width="332"
						height="86"
						rx="12"
						className={
							playback.frame === 2 ? "contract-svg-wash" : "contract-svg-paper"
						}
					/>
					<SvgText x={180} y={192} muted>
						{data.roll.newContract}
					</SvgText>
					<SvgText x={180} y={219}>
						{l("Buy to open", "买入开仓")} @ {money(data.roll.openingPrice)}
					</SvgText>
					<g data-roll-new>
						<SvgText x={180} y={243} muted>
							{l("New contracts held", "持有新合约")}: {state.newQuantity}
						</SvgText>
					</g>
					<rect
						x="30"
						y="282"
						width="300"
						height="76"
						rx="12"
						className="contract-svg-wash"
					/>
					<SvgText x={180} y={308} muted>
						{l("Cash from these fills · no fees", "这些成交的现金流 · 无费用")}
					</SvgText>
					<g data-roll-cash>
						<SvgText x={180} y={341} strong>
							{money(state.cashFlow)}
						</SvgText>
					</g>
					<SvgText x={180} y={393} muted>
						{steps[playback.frame]}
					</SvgText>
					<path d="M40 435H320" className="contract-svg-line" />
					{[40, 180, 320].map((x) => (
						<circle
							key={x}
							cx={x}
							cy="435"
							r="4"
							className="contract-svg-dot"
						/>
					))}
					<m.circle
						initial={false}
						cx={40 + playback.frame * 140}
						cy="435"
						r="10"
						className="contract-svg-handle"
						animate={{ cx: 40 + playback.frame * 140 }}
						transition={
							playback.playing && motion ? lessonTransition : instantTransition
						}
					/>
					<foreignObject x="20" y="395" width="320" height="80">
						<input
							type="range"
							className="contract-range contract-svg-range"
							aria-label={l("Roll replay timeline", "移仓回放时间轴")}
							aria-valuetext={steps[playback.frame]}
							min={0}
							max={2}
							step={1}
							value={playback.frame}
							onPointerDown={() => playback.select(playback.frame)}
							onKeyDown={() => playback.select(playback.frame)}
							onChange={(e) => playback.select(Number(e.target.value))}
						/>
					</foreignObject>
					<SvgText x={180} y={491} muted>
						{l(
							"A roll is not one expiry payoff basket",
							"移仓不是同到期支付组合",
						)}
					</SvgText>
				</Diagram>
			}
		>
			<p className="font-mono text-muted-foreground text-xs">
				{l("Supplied linked closing/opening records", "给定关联平仓/开仓记录")}
				<br />
				{data.roll.quantity} {l("contract each", "张各一笔")} ·{" "}
				{l("multiplier", "乘数")} {data.roll.multiplier}
			</p>
			<SelectField
				label={l("Roll step", "移仓步骤")}
				value={String(playback.frame)}
				options={steps.map((label, i) => [String(i), label])}
				onChange={(value) => playback.select(Number(value))}
			/>
			<PlaybackButton
				playing={playback.playing}
				onClick={playback.toggle}
				l={l}
			/>
			<Alert role="note">
				<AlertTitle>
					{l("Cash flow is not realized profit", "现金流不等于已实现利润")}
				</AlertTitle>
				<AlertDescription>
					{l(
						"The old fill receives cash; the new fill spends cash. Their net debit or credit does not reveal profit on the old position without its original cost basis. Two linked fills, their opening/closing instructions and different expiries establish this supplied roll.",
						"旧成交收款，新成交付款。没有旧持仓原始成本，净支出或收入不揭示旧持仓盈亏。两笔关联成交、开平仓指令与不同到期日共同确定此给定移仓。",
					)}
				</AlertDescription>
			</Alert>
			<p className="text-sm">
				{l(
					"The old quantity is closed before the new one is held in this replay. Combining both expiries into one terminal-price curve would describe a different model and is intentionally unsupported.",
					"本回放先平掉旧数量，再持有新合约。将两个到期日混入一条终值价格曲线属于另一种模型，此处不作该计算。",
				)}
			</p>
		</SceneLayout>
	);
}
