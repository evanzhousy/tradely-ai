import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { FieldGroup } from "@tradely/ui/components/field";
import * as m from "motion/react-m";
import { createContext, useContext, useState } from "react";
import {
	type GammaConceptData,
	type GammaSnapshot,
	gammaApproximation,
	gammaHedge,
} from "@/domain/learning/gamma-concept";
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

export const GammaData = createContext<GammaConceptData | null>(null);
function useGammaData() {
	const data = useContext(GammaData);
	if (!data) throw new Error("Gamma scenes require authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const copy = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const tidy = (value: number) => (Math.abs(value) < 1e-9 ? 0 : value);
const number = (value: number | null) =>
	value === null
		? "—"
		: tidy(value).toLocaleString("en-US", { maximumFractionDigits: 4 });
const signed = (value: number | null) =>
	value === null
		? "—"
		: `${tidy(value) > 0 ? "+" : tidy(value) < 0 ? "−" : ""}${Math.abs(tidy(value)).toLocaleString("en-US", { maximumFractionDigits: 4 })}`;
const money = (cents: number | null, sign = true) =>
	cents === null
		? "—"
		: `${tidy(cents) < 0 ? "−" : sign && tidy(cents) > 0 ? "+" : ""}$${(Math.abs(tidy(cents)) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
function Snapshot({ locale, snapshot }: Props & { snapshot: GammaSnapshot }) {
	const data = useGammaData();
	const l = copy(locale);
	return (
		<p className="break-words font-mono text-muted-foreground text-xs leading-relaxed">
			{snapshot.contract}
			<br />
			{data.asOf}
			<br />
			{l("Underlying", "标的")} {money(data.spotCents, false)} · {snapshot.dte}{" "}
			DTE
			<br />Δ {signed(snapshot.delta)} · Γ {number(snapshot.gamma)} / $1
			<br />
			{l("Illustrative model snapshot", "示例模型快照")}
		</p>
	);
}
function OptionField({
	locale,
	id,
	onChange,
}: Props & { id: string; onChange: (id: string) => void }) {
	const data = useGammaData();
	return (
		<SelectField
			label={copy(locale)("Supplied option", "给定期权")}
			value={id}
			options={data.options.map((s) => [
				s.id,
				s.label[locale === "zh" ? 1 : 0],
			])}
			onChange={onChange}
		/>
	);
}

export function GammaTermsScene({ locale }: Props) {
	const data = useGammaData();
	const l = copy(locale);
	const [id, setId] = useState(data.options[0].id);
	const [move, setMove] = useState(data.defaultMoveCents);
	const [measure, setMeasure] = useState("delta");
	const snapshot = data.options.find((s) => s.id === id) ?? data.options[0];
	const estimate = gammaApproximation(snapshot, move);
	const terms = estimate.ok ? estimate.terms : null;
	const deltaView = measure === "delta";
	const range = deltaView ? [-1, 1] : [0, 40];
	const x = (value: number) =>
		40 +
		((value - data.moveRange[0]) / (data.moveRange[1] - data.moveRange[0])) *
			280;
	const y = (value: number) =>
		265 - ((value - range[0]) / (range[1] - range[0])) * 210;
	const points = Array.from(
		{ length: 41 },
		(_, i) =>
			data.moveRange[0] + ((data.moveRange[1] - data.moveRange[0]) * i) / 40,
	).map((value) => {
		const point = gammaApproximation(snapshot, value);
		return point.ok
			? {
					move: value,
					value: deltaView
						? point.terms.nextDelta
						: point.terms.gammaPriceCents,
				}
			: null;
	});
	const focal = terms
		? deltaView
			? terms.nextDelta
			: terms.gammaPriceCents
		: null;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Delta change and the gamma price term use different formulas",
						"Delta 变化与 Gamma 价格项使用不同公式",
					)}
					height={455}
				>
					<SvgText x={180} y={25} muted>
						{deltaView
							? l("Next option delta · approximation", "期权新 Delta · 近似")
							: l("Gamma price term / unit", "Gamma 价格项 / 单位")}
					</SvgText>
					<path d="M40 55V265H320" className="contract-svg-line" />
					<path
						d={`M40 ${y(0)}H320`}
						className="contract-svg-line"
						strokeDasharray="3 4"
					/>
					<SvgText x={22} y={y(0) + 4} muted>
						0
					</SvgText>
					<SvgText x={180} y={48} muted>
						{deltaView ? "+1" : money(range[1], false)}
					</SvgText>
					<SvgText x={180} y={286} muted>
						{deltaView ? "−1" : money(0, false)}
					</SvgText>
					{points.every((p) => p !== null) ? (
						<path
							d={points
								.map((p, i) => `${i ? "L" : "M"}${x(p.move)} ${y(p.value)}`)
								.join(" ")}
							className="contract-svg-active-line"
						/>
					) : null}
					{focal !== null ? (
						<circle
							cx={x(move)}
							cy={y(focal)}
							r="8"
							className="contract-svg-handle"
						/>
					) : null}
					<SvgText x={58} y={317} muted>
						{money(data.moveRange[0])}
					</SvgText>
					<SvgText x={302} y={317} muted>
						{money(data.moveRange[1])}
					</SvgText>
					<path d="M40 344H320" className="contract-svg-line" />
					<circle cx={x(move)} cy="344" r="9" className="contract-svg-handle" />
					<foreignObject x="20" y="304" width="320" height="80">
						<input
							type="range"
							className="contract-range contract-svg-range"
							aria-label={l("Drag gamma stock move", "拖动 Gamma 标的变动")}
							aria-valuetext={money(move)}
							min={data.moveRange[0]}
							max={data.moveRange[1]}
							step={25}
							value={move}
							onChange={(e) => setMove(Number(e.target.value))}
						/>
					</foreignObject>
					<SvgText x={180} y={395}>
						{l("Underlying move", "标的变动")} {money(move)}
					</SvgText>
					<g data-gamma-focal>
						<SvgText x={180} y={431} strong>
							{deltaView ? signed(focal) : money(focal)}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<Snapshot locale={locale} snapshot={snapshot} />
			<FieldGroup>
				<OptionField locale={locale} id={id} onChange={setId} />
				<ChoiceField
					label={l("Chart quantity", "图表量")}
					value={measure}
					options={[
						["delta", l("Next delta", "新 Delta")],
						["price", l("Gamma price term", "Gamma 价格项")],
					]}
					onChange={setMeasure}
				/>
				<RangeControl
					label={l("Underlying price change", "标的价格变动")}
					value={move}
					display={money(move)}
					min={data.moveRange[0]}
					max={data.moveRange[1]}
					step={25}
					onChange={setMove}
				/>
			</FieldGroup>
			<div className="grid grid-cols-2 gap-3 text-sm">
				<p data-gamma-delta-change>
					{l("Change in delta: Γ × move", "Delta 变化：Γ × 变动")}
					<br />
					<strong>{signed(terms?.deltaChange ?? null)}</strong>
				</p>
				<p data-gamma-next>
					{l("Next delta: old Δ + change", "新 Delta：原 Δ + 变化")}
					<br />
					<strong>{signed(terms?.nextDelta ?? null)}</strong>
				</p>
				<p data-gamma-linear>
					{l("Delta price term / unit", "Delta 价格项/单位")}
					<br />
					<strong>{money(terms?.deltaPriceCents ?? null)}</strong>
				</p>
				<p data-gamma-quadratic>
					{l("Gamma price term / unit", "Gamma 价格项/单位")}
					<br />
					<strong>{money(terms?.gammaPriceCents ?? null)}</strong>
				</p>
			</div>
			<p className="text-sm" data-gamma-total>
				{l("Combined price change / unit", "合并价格变化/单位")}:{" "}
				<strong>{money(terms?.totalPriceCents ?? null)}</strong>
			</p>
			<Alert role="note">
				<AlertTitle>
					{l(
						"Delta change is not the price correction",
						"Delta 变化不等于价格修正",
					)}
				</AlertTitle>
				<AlertDescription>
					{l(
						"New delta uses Δ + Γ × move. The second-order price estimate uses Δ × move + ½ × Γ × move², in dollar units. With positive option gamma, its price term is positive for either move direction; the first-order delta term can still make the total negative.",
						"新 Delta 使用 Δ + Γ × 变动。二阶价格估计使用 Δ × 变动 + ½ × Γ × 变动平方，以美元为单位。期权 Gamma 为正时，无论标的向哪边变动，该价格项均为正；一阶 Delta 项仍可能令合计为负。",
					)}
				</AlertDescription>
			</Alert>
			<p className="text-muted-foreground text-xs">
				{l(
					"These are local, constant-Greek approximations with time, volatility and other inputs fixed. The option's quoted gamma is distinct from the signed gamma of a long or short position.",
					"这些是时间、波动率等输入固定时的局部常数希腊值近似。期权报价 Gamma 与多空持仓带符号 Gamma 不同。",
				)}
			</p>
		</SceneLayout>
	);
}

export function GammaHedgeScene({ locale }: Props) {
	const data = useGammaData();
	const l = copy(locale);
	const motion = useLessonMotion();
	const [id, setId] = useState(data.options[0].id);
	const [side, setSide] = useState<"long" | "short">("long");
	const [move, setMove] = useState(data.hedgeMoves[0]);
	const [scope, setScope] = useState("known");
	const playback = useFrames(3);
	const snapshot = data.options.find((s) => s.id === id) ?? data.options[0];
	const known = scope === "known";
	const state = gammaHedge(
		snapshot,
		move,
		data.quantity,
		data.multiplier,
		side,
		known,
		playback.frame,
	);
	const phases = [
		l("Initial delta hedge", "初始 Delta 对冲"),
		l("After the stock move", "标的变动后"),
		l("After the assumed hedge fill", "假设对冲成交后"),
	];
	const trade = state
		? `${state.trade > 0 ? l("Buy", "买入") : state.trade < 0 ? l("Sell", "卖出") : l("No change", "不变")} ${number(Math.abs(state.trade))} ${l("shares", "股")}`
		: l("Not established", "无法确定");
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Option delta, stock hedge and residual exposure",
						"期权 Delta、股票对冲与剩余敞口",
					)}
					height={490}
				>
					<SvgText x={180} y={25} muted>
						{phases[playback.frame]}
					</SvgText>
					{[
						[
							"option",
							l("Option position delta", "期权持仓 Delta"),
							state?.optionDelta ?? null,
						],
						[
							"stock",
							l("Stock hedge · shares", "股票对冲 · 股"),
							state?.stock ?? null,
						],
						[
							"net",
							l("Net delta · shares-equivalent", "净 Delta · 股等价量"),
							state?.netDelta ?? null,
						],
					].map(([key, label, value], i) => (
						<g key={String(key)}>
							<rect
								x="14"
								y={47 + i * 105}
								width="332"
								height="78"
								rx="12"
								className={
									key === "net" && state
										? "contract-svg-wash"
										: "contract-svg-paper"
								}
							/>
							<SvgText x={180} y={73 + i * 105} muted>
								{label}
							</SvgText>
							<g data-gamma-hedge={key}>
								<SvgText x={180} y={110 + i * 105} strong>
									{signed(value as number | null)}
								</SvgText>
							</g>
							{i < 2 ? (
								<m.path
									key={`${playback.frame}-${i}`}
									d={`M180 ${125 + i * 105}v27`}
									className="contract-svg-active-line"
									initial={{ pathLength: motion ? 0 : 1 }}
									animate={{ pathLength: 1 }}
									transition={motion ? lessonTransition : instantTransition}
								/>
							) : null}
						</g>
					))}
					<SvgText x={180} y={376}>
						{l("Underlying scenario", "标的情景")} {money(move)}
					</SvgText>
					<path d="M40 424H320" className="contract-svg-line" />
					<m.circle
						initial={false}
						cx={40 + playback.frame * 140}
						cy="424"
						r="10"
						animate={{ cx: 40 + playback.frame * 140 }}
						transition={
							playback.playing && motion ? lessonTransition : instantTransition
						}
						className="contract-svg-handle"
					/>
					<foreignObject x="20" y="384" width="320" height="80">
						<input
							type="range"
							className="contract-range contract-svg-range"
							aria-label={l("Hedge replay timeline", "对冲回放时间轴")}
							aria-valuetext={phases[playback.frame]}
							min={0}
							max={2}
							step={1}
							value={playback.frame}
							onPointerDown={() => playback.select(playback.frame)}
							onKeyDown={() => playback.select(playback.frame)}
							onChange={(e) => playback.select(Number(e.target.value))}
						/>
					</foreignObject>
					<SvgText x={180} y={481} muted>
						{l("A hedge for this stated position only", "仅针对给定持仓的对冲")}
					</SvgText>
				</Diagram>
			}
		>
			<Snapshot locale={locale} snapshot={snapshot} />
			<FieldGroup>
				<OptionField
					locale={locale}
					id={id}
					onChange={(value) => {
						playback.select(0);
						setId(value);
					}}
				/>
				<ChoiceField
					label={l("Position evidence", "持仓证据")}
					value={scope}
					options={[
						["known", l("Known position", "已知持仓")],
						["unknown", l("Greeks only", "仅希腊值")],
					]}
					onChange={(value) => {
						playback.select(0);
						setScope(value);
					}}
				/>
				{known ? (
					<ChoiceField
						label={l("Position side", "持仓方向")}
						value={side}
						options={[
							["long", l("Long", "多头")],
							["short", l("Short", "空头")],
						]}
						onChange={(value) => {
							playback.select(0);
							setSide(value);
						}}
					/>
				) : null}
				<SelectField
					label={l("Underlying scenario", "标的情景")}
					value={String(move)}
					options={data.hedgeMoves.map((value) => [
						String(value),
						money(value),
					])}
					onChange={(value) => {
						playback.select(0);
						setMove(Number(value));
					}}
				/>
				<SelectField
					label={l("Hedge step", "对冲步骤")}
					value={String(playback.frame)}
					options={phases.map((label, i) => [String(i), label])}
					onChange={(value) => playback.select(Number(value))}
				/>
			</FieldGroup>
			<PlaybackButton
				playing={playback.playing}
				onClick={playback.toggle}
				l={l}
			/>
			{known ? (
				<p className="font-mono text-muted-foreground text-xs">
					{data.quantity} {l("contracts", "张")} × {data.multiplier}{" "}
					{l("units each", "单位/张")}
				</p>
			) : null}
			<div className="space-y-2 text-sm">
				<p data-gamma-position-gamma>
					{l("Position gamma", "持仓 Gamma")}:{" "}
					<strong>{signed(state?.positionGamma ?? null)}</strong>{" "}
					{l("shares-equivalent / $1", "股等价量 / $1")}
				</p>
				<p data-gamma-trade>
					{l("Required stock adjustment", "所需股票调整")}:{" "}
					<strong>{trade}</strong>
				</p>
				<p>
					{l("New hedge target", "新对冲目标")}:{" "}
					{signed(state?.targetHedge ?? null)} {l("shares", "股")}
				</p>
			</div>
			<Alert role="note">
				<AlertTitle>
					{!state
						? l("Cannot establish the hedge", "无法确定对冲")
						: Math.abs(state.netDelta) > 1e-9
							? l("The old hedge leaves residual delta", "旧对冲留下剩余 Delta")
							: l("Delta-neutral at this snapshot", "此快照 Delta 中性")}
				</AlertTitle>
				<AlertDescription>
					{known
						? l(
								"The stock hedge starts opposite the stated position delta. After the stock move, gamma changes that delta; the final step assumes the required adjustment fills. In this local example, a long-gamma position sells after a rise and buys after a fall. Shorting reverses those adjustments. Gamma, volatility, time, execution and cost risks remain.",
								"股票对冲最初与给定持仓 Delta 相反。标的变化后，Gamma 改变 Delta；最后一步假设所需调整已成交。在此局部示例中，正 Gamma 持仓上涨后卖股、下跌后买股。做空反转这些调整。Gamma、波动率、时间、执行与成本风险仍存在。",
							)
						: l(
								"This view supplies only the option's model Greeks. Position size, long/short side and existing holdings are absent, so exposure and a hedge order are unavailable. A trade print alone also does not establish a dealer's portfolio.",
								"此视角仅提供期权模型希腊值。未给持仓规模、多空方向及现有持仓，因此无法确定敞口与对冲指令。孤立成交也不能确定做市商组合。",
							)}
				</AlertDescription>
			</Alert>
		</SceneLayout>
	);
}

export function GammaSensitivityScene({ locale }: Props) {
	const data = useGammaData();
	const l = copy(locale);
	const [id, setId] = useState(
		data.sensitivity[1]?.id ?? data.sensitivity[0].id,
	);
	const [move, setMove] = useState(50);
	const snapshot =
		data.sensitivity.find((s) => s.id === id) ?? data.sensitivity[0];
	const estimate = gammaApproximation(snapshot, move);
	const x = (value: number) =>
		40 +
		((value - data.moveRange[0]) / (data.moveRange[1] - data.moveRange[0])) *
			280;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Compare supplied gamma snapshots before extrapolating",
						"外推前比较给定 Gamma 快照",
					)}
					height={505}
				>
					<SvgText x={180} y={25} muted>
						{l("Supplied option gamma / $1", "给定期权 Gamma / $1")}
					</SvgText>
					<SvgText x={180} y={50} muted>
						{number(data.maximumShownGamma)}
					</SvgText>
					<path d="M20 240H340" className="contract-svg-line" />
					{data.sensitivity.map((s, i) => {
						const barX = 40 + i * 70;
						const height =
							s.gamma === null ? 0 : (s.gamma / data.maximumShownGamma) * 175;
						return (
							<g key={s.id}>
								{s.gamma === null ? (
									<SvgText x={barX} y={214} muted>
										—
									</SvgText>
								) : (
									<rect
										x={barX - 20}
										y={240 - height}
										width="40"
										height={height}
										rx="4"
										className={
											s.id === id ? "contract-svg-wash" : "contract-svg-dot"
										}
										opacity={s.id === id ? 1 : 0.5}
									/>
								)}
								<SvgText x={barX} y={263} muted>
									{number(s.gamma)}
								</SvgText>
								<foreignObject x={barX - 24} y="278" width="48" height="44">
									<button
										type="button"
										className="h-full w-full rounded-lg border border-border bg-background font-mono text-sm"
										aria-label={`${l("Inspect", "查看")} ${s.label[locale === "zh" ? 1 : 0]}`}
										aria-pressed={s.id === id}
										onClick={() => setId(s.id)}
									>
										{s.id}
									</button>
								</foreignObject>
							</g>
						);
					})}
					<path d="M40 367H320" className="contract-svg-line" />
					<circle cx={x(move)} cy="367" r="9" className="contract-svg-handle" />
					<foreignObject x="20" y="327" width="320" height="80">
						<input
							type="range"
							className="contract-range contract-svg-range"
							aria-label={l("Drag sensitivity move", "拖动敏感度变动")}
							aria-valuetext={money(move)}
							min={data.moveRange[0]}
							max={data.moveRange[1]}
							step={25}
							value={move}
							onChange={(e) => setMove(Number(e.target.value))}
						/>
					</foreignObject>
					<SvgText x={180} y={418}>
						{l("Underlying move", "标的变动")} {money(move)}
					</SvgText>
					<SvgText x={180} y={450} muted>
						{l("Raw Δ + Γ × move", "原始 Δ + Γ × 变动")}
					</SvgText>
					<g data-gamma-raw>
						<SvgText x={180} y={486} strong>
							{signed(estimate.terms?.nextDelta ?? null)}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<SelectField
				label={l("Sensitivity snapshot", "敏感度快照")}
				value={id}
				options={data.sensitivity.map((s) => [
					s.id,
					s.label[locale === "zh" ? 1 : 0],
				])}
				onChange={setId}
			/>
			<Snapshot locale={locale} snapshot={snapshot} />
			<RangeControl
				label={l("Exploratory underlying move", "探索标的变动")}
				value={move}
				display={money(move)}
				min={data.moveRange[0]}
				max={data.moveRange[1]}
				step={25}
				onChange={setMove}
			/>
			<div className="space-y-2 text-sm">
				<p data-gamma-sensitivity-next>
					{l("Approximate next delta", "近似新 Delta")}:{" "}
					<strong>
						{estimate.ok ? signed(estimate.terms.nextDelta) : "—"}
					</strong>
				</p>
				<p data-gamma-validity>
					{estimate.ok
						? l(
								"Within delta bounds; still only local",
								"在 Delta 边界内，仍仅为局部近似",
							)
						: estimate.issue === "delta-bounds"
							? l(
									"Outside delta bounds: reprice instead",
									"超出 Delta 边界：需重新定价",
								)
							: l("Missing or invalid Greeks", "希腊值缺失或无效")}
				</p>
			</div>
			<Alert role="note">
				<AlertTitle>
					{l(
						"Near expiry does not make every contract alike",
						"临近到期不使所有合约相同",
					)}
				</AlertTitle>
				<AlertDescription>
					{l(
						"The supplied 0-DTE ATM example has more gamma than the longer-dated ATM and the 0-DTE ITM/OTM examples. These are illustrative snapshots, not a calibrated universal curve. A large move can make constant gamma imply call delta above 1 or below 0. The raw extrapolation is shown as a diagnostic; the usable estimate is withheld, never clamped to a boundary.",
						"给定 0-DTE 平值示例的 Gamma 高于较长期平值及 0-DTE 实值/虚值示例。这些是示例快照，并非校准后的通用曲线。大幅变动可能使常数 Gamma 推出看涨 Delta 超过 1 或低于 0。原始外推仅作诊断展示，可用估计会被保留为空，而非强制截到边界。",
					)}
				</AlertDescription>
			</Alert>
			<p className="text-muted-foreground text-xs">
				{l(
					"A result inside the bounds is not proof that the approximation is accurate. Spot, volatility and time can change gamma itself. A missing gamma is not zero, and none of these snapshots establishes dealer positions or predicts a market move.",
					"结果在边界内不证明近似准确。现价、波动率与时间会改变 Gamma 本身。Gamma 缺失不等于零，这些快照均不能确定做市商持仓或预测市场变动。",
				)}
			</p>
		</SceneLayout>
	);
}
