import * as m from "motion/react-m";
import { createContext, type ReactNode, useContext, useState } from "react";
import {
	concentration,
	expirationPayout,
	type LevelsConceptData,
	levelDistances,
	payoutMinima,
} from "@/domain/learning/levels-concept";
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
export const LevelsData = createContext<LevelsConceptData | null>(null);
function useData() {
	const data = useContext(LevelsData);
	if (!data) throw new Error("Levels scenes require authorized teaching data");
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
		<p className="font-mono text-muted-foreground text-xs leading-relaxed">
			{data.symbol} · {data.asOf}
			<br />
			{copy(locale)(
				"Synthetic supplied scope and reference values",
				"模拟给定范围与参考数值",
			)}
		</p>
	);
}
export function LevelsConcentrationScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [measure, setMeasure] = useState<"gamma" | "oi">("gamma");
	const [side, setSide] = useState<"call" | "put">("call");
	const [scope, setScope] = useState("near");
	const [selected, setSelected] = useState(100);
	const expiries = scope === "near" ? data.expiries.slice(0, 1) : data.expiries;
	const rows = data.rows.filter((r) => expiries.includes(r.expiry));
	const result = concentration(rows, measure, side, data.strikes, expiries);
	const max = Math.max(1, ...result.values.map((v) => v.value ?? 0));
	const current = result.values.find((v) => v.strike === selected);
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Concentration by strike under the selected rule",
						"所选规则下按行权价的集中度",
					)}
					height={430}
				>
					<SvgText x={180} y={32}>
						{measure === "gamma"
							? l("Supplied gamma magnitude", "给定 Gamma 幅度")
							: l("Open interest contracts", "未平仓合约张数")}
					</SvgText>
					{result.values.map((v, i) => {
						const x = 50 + i * 100;
						const height = ((v.value ?? 0) / max) * 200;
						return (
							<g key={v.strike}>
								<rect
									x={x}
									y={268 - height}
									width={60}
									height={height}
									rx={6}
									fill={
										result.winners.includes(v.strike)
											? "var(--primary)"
											: "currentColor"
									}
									opacity={result.winners.includes(v.strike) ? 1 : 0.25}
								/>
								<SvgText x={x + 30} y={250 - height}>
									{number(v.value)}
								</SvgText>
								<foreignObject x={x} y={283} width={60} height={44}>
									<button
										type="button"
										className="h-full w-full rounded-lg border text-sm"
										aria-label={`${l("Strike", "行权价")} ${v.strike}`}
										aria-pressed={selected === v.strike}
										onClick={() => setSelected(v.strike)}
									>
										{v.strike}
									</button>
								</foreignObject>
							</g>
						);
					})}
					<SvgText x={180} y={368}>
						{l("Maximum under selected rule", "所选规则下的最大值位置")}
					</SvgText>
					<g data-level-winner>
						<SvgText x={180} y={406} strong>
							{result.winners.join(" / ") || "—"}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Concentration rule", "集中度规则")}
				value={measure}
				options={[
					[
						"gamma",
						l("Gamma magnitude · model output", "Gamma 幅度 · 模型输出"),
					],
					[
						"oi",
						l("OI count · no gamma weighting", "OI 张数 · 不按 Gamma 加权"),
					],
				]}
				onChange={(v) => setMeasure(v as typeof measure)}
			/>
			<SelectField
				label={l("Option type", "期权类型")}
				value={side}
				options={[
					["call", l("Calls", "看涨")],
					["put", l("Puts", "看跌")],
				]}
				onChange={(v) => setSide(v as typeof side)}
			/>
			<SelectField
				label={l("Expiry scope", "到期范围")}
				value={scope}
				options={[
					["near", l("Near expiry only", "仅近到期")],
					["all", l("Both supplied expiries", "两个给定到期日")],
				]}
				onChange={setScope}
			/>
			<p data-level-selected>
				{l("Inspected strike", "检查行权价")}: {selected} ·{" "}
				{number(current?.value ?? null)}
			</p>
			<p className="font-mono text-xs">
				{expiries.join(" · ")}
				<br />
				{measure === "gamma"
					? `${data.model} · ${l("USD delta exposure / +1% move · magnitude", "每 +1% 变动美元 Delta 敞口 · 幅度")}`
					: l("OI units: contracts", "OI 单位：张")}
			</p>
			<Note>
				{l(
					"A gamma-weighted wall and an OI maximum use different inputs. Changing expiry scope can change the selected strike. These are magnitude concentrations under a declared rule, not observed dealer positions or guaranteed support/resistance.",
					"Gamma 加权墙位与 OI 最大值使用不同输入。改变到期范围可改变所选行权价。这些是声明规则下的幅度集中，不是观测做市商持仓或保证支撑阻力。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"Bars rescale to the largest value in each selected view. Read the values and units before comparing views. Tied positive maxima are retained; a zero-only set has no positive concentration.",
					"柱形按各视图最大值重新缩放。跨视图比较前需读取数值与单位。正最大值并列时全部保留；全零集合无正集中度。",
				)}
			</p>
		</SceneLayout>
	);
}
export function LevelsPayoutScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [id, setId] = useState(data.payoutSets[0].id);
	const replay = useFrames(data.candidates.length);
	const [manual, setManual] = useState<number | null>(100);
	const settlement = manual ?? data.candidates[replay.frame];
	const set = data.payoutSets.find((s) => s.id === id) ?? data.payoutSets[0];
	const result = expirationPayout(set.rows, settlement);
	const minima = payoutMinima(set.rows, data.candidates);
	const points = data.candidates.map((price) => ({
		price,
		payout: expirationPayout(set.rows, price),
	}));
	const maximum = Math.max(1, ...points.map((p) => p.payout?.total ?? 0));
	const x = (v: number) => 40 + ((v - 90) / 20) * 280;
	const y = (v: number) => 285 - (v / maximum) * 205;
	const enabled = useLessonMotion();
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l("Hypothetical expiration payout", "假设到期支付")}
					height={440}
				>
					<SvgText x={180} y={30}>
						{l("Total intrinsic payout · USD", "总内在支付 · 美元")}
					</SvgText>
					{points.slice(1).map((p, i) => {
						const a = points[i];
						return a.payout && p.payout ? (
							<line
								key={p.price}
								x1={x(a.price)}
								y1={y(a.payout.total)}
								x2={x(p.price)}
								y2={y(p.payout.total)}
								stroke="currentColor"
								opacity={0.3}
							/>
						) : null;
					})}
					{points.map((p) => (
						<g key={p.price}>
							{p.payout ? (
								<>
									<circle
										cx={x(p.price)}
										cy={y(p.payout.total)}
										r={5}
										fill={
											minima.includes(p.price)
												? "var(--primary)"
												: "currentColor"
										}
									/>
									<SvgText x={x(p.price)} y={y(p.payout.total) - 17}>
										{number(p.payout.total / 1000)}k
									</SvgText>
								</>
							) : null}
							<foreignObject x={x(p.price) - 24} y={303} width={48} height={40}>
								<button
									type="button"
									className="h-full w-full rounded-lg border text-xs"
									aria-label={`${l("Settlement candidate", "结算候选")} ${p.price}`}
									onClick={() => {
										replay.select(replay.frame);
										setManual(p.price);
									}}
								>
									{p.price}
								</button>
							</foreignObject>
						</g>
					))}
					{result && (
						<m.circle
							cx={x(settlement)}
							cy={y(result.total)}
							r={9}
							fill="var(--primary)"
							stroke="currentColor"
							initial={false}
							animate={{ cx: x(settlement), cy: y(result.total) }}
							transition={
								enabled && replay.playing ? lessonTransition : instantTransition
							}
						/>
					)}
					<SvgText x={180} y={380}>
						{l("Minimum among supplied candidates", "给定候选中的最小值位置")}
					</SvgText>
					<g data-level-minima>
						<SvgText x={180} y={415} strong>
							{minima.join(" / ") || "—"}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Payout set", "支付集合")}
				value={id}
				options={data.payoutSets.map((s) => [
					s.id,
					s.label[locale === "zh" ? 1 : 0],
				])}
				onChange={(v) => {
					replay.select(replay.frame);
					setId(v);
				}}
			/>
			<RangeControl
				label={l("Hypothetical settlement", "假设结算价")}
				value={settlement}
				display={`$${number(settlement)}`}
				min={90}
				max={110}
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
			<p className="font-mono text-xs">
				{l("Same supplied expiry: 2030-09-20", "同一给定到期日：2030-09-20")}
				<br />
				{set.rows
					.map(
						(r) =>
							`${r.strike}: C ${number(r.calls)} / P ${number(r.puts)} × ${r.multiplier}`,
					)
					.join("; ")}
			</p>
			<p data-level-call-payout>
				{l("Calls payout", "看涨支付")}: ${number(result?.calls ?? null)}
			</p>
			<p data-level-put-payout>
				{l("Puts payout", "看跌支付")}: ${number(result?.puts ?? null)}
			</p>
			<p data-level-total-payout>
				{l("Total payout", "总支付")}: ${number(result?.total ?? null)}
			</p>
			<Note>
				{l(
					"Calls pay max(settlement − strike, 0); puts pay max(strike − settlement, 0), multiplied by OI and contract multiplier. This OI-only calculation uses no gamma or ownership assumption. It excludes premiums, so it is not trader profit.",
					"看涨支付 max(结算价−行权价,0)，看跌支付 max(行权价−结算价,0)，再乘 OI 与合约乘数。这项仅 OI 计算不使用 Gamma 或归属假设。未计权利金，因此不是交易者利润。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"All tied minima in the finite candidate set are shown. Missing OI withholds the total and minimum. Neither the minimum nor the animated settlement path predicts where prices settle.",
					"显示有限候选集合中的全部并列最小值。OI 缺失时不提供总支付与最小值。最小值及结算动画路径均不预测价格结算位置。",
				)}
			</p>
		</SceneLayout>
	);
}
export function LevelsDistanceScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [spot, setSpot] = useState(data.spot);
	const [atr, setAtr] = useState(data.atr);
	const [mode, setMode] = useState("current");
	const split = mode === "adjusted";
	const reference = split ? 51 : mode === "unadjusted" ? 51 : spot;
	const level = split ? 50 : data.level;
	const volatility =
		mode === "missing" ? null : mode === "zero" ? 0 : split ? 1 : atr;
	const compatible = mode !== "unadjusted";
	const distance = levelDistances(level, reference, volatility, compatible);
	const x = (v: number) =>
		40 + ((v - (split ? 45 : 90)) / (split ? 10 : 20)) * 280;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Level distance in dollars percent and ATR",
						"位置的美元百分比与 ATR 距离",
					)}
					height={420}
				>
					<SvgText x={180} y={35}>
						{l("Reference level and spot", "参考位置与现价")}
					</SvgText>
					{compatible ? (
						<>
							<line
								x1={40}
								x2={320}
								y1={108}
								y2={108}
								stroke="currentColor"
								opacity={0.3}
							/>
							<circle
								cx={x(level)}
								cy={108}
								r={7}
								fill="none"
								stroke="currentColor"
							/>
							<circle
								cx={x(reference)}
								cy={108}
								r={7}
								fill="var(--primary)"
								stroke="currentColor"
							/>
							<SvgText x={180} y={73}>
								{l("Level", "位置")}: {level} · {l("Spot", "现价")}: {reference}
							</SvgText>
						</>
					) : (
						<SvgText x={180} y={103}>
							{l("Incompatible price scales", "价格尺度不兼容")}
						</SvgText>
					)}
					{[
						{
							key: "dollars",
							label: l("Signed dollars", "带符号美元"),
							value: distance.dollars,
							suffix: "",
						},
						{
							key: "percent",
							label: l("Percent of reference spot", "参考现价百分比"),
							value: distance.percent,
							suffix: "%",
						},
						{
							key: "atr",
							label: l("ATR units", "ATR 单位"),
							value: distance.atr,
							suffix: "",
						},
					].map((r, i) => (
						<g key={r.key}>
							<SvgText x={180} y={173 + i * 88}>
								{r.label}
							</SvgText>
							<g data-level-distance={r.key}>
								<SvgText x={180} y={207 + i * 88} strong>
									{r.value === null ? "—" : signed(r.value) + r.suffix}
								</SvgText>
							</g>
						</g>
					))}
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Reference compatibility", "参考兼容性")}
				value={mode}
				options={[
					["current", l("Compatible current references", "兼容当前参考")],
					["missing", l("ATR unavailable", "ATR 不可用")],
					["zero", l("ATR is zero", "ATR 为零")],
					[
						"unadjusted",
						l("2-for-1 split · unadjusted level", "一拆二 · 位置未调整"),
					],
					[
						"adjusted",
						l("2-for-1 split · adjusted references", "一拆二 · 已调整参考"),
					],
				]}
				onChange={setMode}
			/>
			{!split && mode !== "unadjusted" && (
				<>
					<RangeControl
						label={l("Reference spot", "参考现价")}
						value={spot}
						display={`$${spot}`}
						min={data.spotRange[0]}
						max={data.spotRange[1]}
						step={1}
						onChange={setSpot}
					/>
					{mode === "current" && (
						<RangeControl
							label={l("Supplied ATR", "给定 ATR")}
							value={atr}
							display={`$${atr}`}
							min={1}
							max={5}
							step={0.5}
							onChange={setAtr}
						/>
					)}
				</>
			)}
			<p className="font-mono text-xs">
				{data.atrWindow}
				<br />
				{l("Level − spot", "位置 − 现价")}: {level} − {reference}
				<br />
				ATR: {number(volatility)}
			</p>
			<Note>
				{!compatible
					? l(
							"The historical level 100 is on the pre-split scale; spot 51 is post-split. Do not publish a distance until the price scales are reconciled. The adjusted case supplies level 50 and ATR 1 on the same post-split scale.",
							"历史位置 100 为拆股前尺度，现价 51 为拆股后尺度。价格尺度一致前不发布距离。调整案例提供同一拆股后尺度的位置 50 与 ATR 1。",
						)
					: l(
							"Dollar distance is level minus reference spot. Percent divides by that spot; ATR distance divides by a positive ATR. Missing or zero ATR blocks only the ATR calculation. ATR summarizes historical ranges under its stated window, not expected directional return.",
							"美元距离为位置减参考现价。百分比除以该现价，ATR 距离除以正 ATR。ATR 缺失或为零只阻止 ATR 计算。ATR 按声明窗口概括历史波幅，不是预期方向收益。",
						)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"These are distances to a supplied reference, not probabilities of reaching it. A wall, magnet or pin label does not guarantee attraction, support or resistance.",
					"这些是距给定参考的距离，不是到达概率。墙位、磁点或钉住标签不保证吸引、支撑或阻力。",
				)}
			</p>
		</SceneLayout>
	);
}
