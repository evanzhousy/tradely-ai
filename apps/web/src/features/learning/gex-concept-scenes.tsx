import * as m from "motion/react-m";
import { createContext, type ReactNode, useContext, useState } from "react";
import {
	contractGex,
	type GexCell,
	type GexConceptData,
	summarizeGex,
} from "@/domain/learning/gex-concept";
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
export const GexData = createContext<GexConceptData | null>(null);
function useData() {
	const data = useContext(GexData);
	if (!data) throw new Error("GEX scenes require authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const copy = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const number = (v: number | null) =>
	v === null ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: 2 });
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
			{data.model}
			<br />
			{data.units[locale === "zh" ? 1 : 0]}
		</p>
	);
}
export function GexFormulaScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const replay = useFrames(data.oiFrames.length);
	const [manual, setManual] = useState<number | null>(null);
	const [spot, setSpot] = useState(data.contract.spot);
	const [sign, setSign] = useState(data.contract.sign);
	const oi = manual ?? data.oiFrames[replay.frame];
	const input = { ...data.contract, oi, spot, sign };
	const value = contractGex(input);
	const enabled = useLessonMotion();
	const maximum = contractGex({
		...data.contract,
		oi: data.oiRange[1],
		spot: data.spotRange[1],
		sign: 1,
	}) as number;
	const width = value === null ? 0 : (Math.abs(value) / maximum) * 142;
	const stop = () => replay.select(replay.frame);
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"GEX contribution under declared assumptions",
						"声明假设下的 GEX 贡献",
					)}
					height={450}
				>
					<SvgText x={180} y={36}>
						{l("Frozen-input teaching formula", "固定输入教学公式")}
					</SvgText>
					<SvgText x={180} y={80}>
						γ × OI × multiplier × S²
					</SvgText>
					<SvgText x={180} y={110}>
						× 0.01 × {l("assumed sign", "假设符号")}
					</SvgText>
					<SvgText x={180} y={157}>
						{data.contract.gamma} × {number(oi)} × {data.contract.multiplier}
					</SvgText>
					<SvgText x={180} y={187}>
						× {spot}² × 0.01 × {sign === null ? "?" : signed(sign)}
					</SvgText>
					<line
						x1={24}
						x2={336}
						y1={245}
						y2={245}
						stroke="currentColor"
						opacity={0.25}
					/>
					<line x1={180} x2={180} y1={222} y2={283} stroke="currentColor" />
					{value !== null && (
						<g
							transform={value < 0 ? "translate(360 0) scale(-1 1)" : undefined}
						>
							<m.rect
								x={180}
								y={234}
								width={width}
								height={22}
								rx={5}
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
					)}
					<SvgText x={50} y={286} muted>
						−{number(maximum / 1000000)}m
					</SvgText>
					<SvgText x={310} y={286} muted>
						+{number(maximum / 1000000)}m
					</SvgText>
					<g data-gex-formula>
						<SvgText x={180} y={343} strong>
							{signed(value)}
						</SvgText>
					</g>
					<SvgText x={180} y={378}>
						{l("USD delta exposure / +1%", "美元 Delta 敞口 / +1%")}
					</SvgText>
					<SvgText x={180} y={414} muted>
						{l(
							"Sign assumed, not observed ownership",
							"符号是假设，不是观测归属",
						)}
					</SvgText>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<RangeControl
				label={l("Open interest contracts", "未平仓合约张数")}
				value={oi}
				display={number(oi)}
				min={data.oiRange[0]}
				max={data.oiRange[1]}
				step={100}
				onChange={(v) => {
					stop();
					setManual(v);
				}}
			/>
			<RangeControl
				label={l("Hypothetical spot", "假设现价")}
				value={spot}
				display={`$${number(spot)}`}
				min={data.spotRange[0]}
				max={data.spotRange[1]}
				step={10}
				onChange={(v) => {
					stop();
					setSpot(v);
				}}
			/>
			<SelectField
				label={l("Assumed position sign", "假设持仓符号")}
				value={sign === null ? "unknown" : String(sign)}
				options={[
					["1", l("Positive assumption", "正符号假设")],
					["-1", l("Negative assumption", "负符号假设")],
					["unknown", l("No sign supplied", "未提供符号")],
				]}
				onChange={(v) => {
					stop();
					setSign(v === "unknown" ? null : v === "1" ? 1 : -1);
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
			<Note>
				{l(
					"OI counts outstanding contracts; it does not identify dealer ownership. Reversing the assumed position sign reverses this contribution. Without that assumption the signed result is unavailable.",
					"OI 统计未平仓张数，不识别做市商归属。反转假设持仓符号会反转此项贡献。没有该假设时，带符号结果不可用。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"Gamma is held fixed to isolate the arithmetic. Doubling spot quadruples this frozen-input expression; it is not a forecast of repriced gamma or actual hedging. The next scenes use already-scaled supplied outputs, not these contract inputs.",
					"固定 Gamma 以隔离算术影响。现价翻倍使此固定输入表达式变为四倍，并非重新定价 Gamma 或实际对冲的预测。后续场景使用已缩放的给定输出，而非这些合约输入。",
				)}
			</p>
		</SceneLayout>
	);
}
function Grid({
	locale,
	cells,
	selected,
	onSelect,
}: {
	locale: Locale;
	cells: readonly GexCell[];
	selected: string;
	onSelect: (id: string) => void;
}) {
	const data = useData();
	const l = copy(locale);
	return (
		<>
			{data.strikes.map((strike, col) => (
				<SvgText key={strike} x={86 + col * 100} y={35}>
					{strike}
				</SvgText>
			))}
			{data.expiries.map((expiry, row) => (
				<g key={expiry}>
					<SvgText x={180} y={61 + row * 125} muted>
						{expiry}
					</SvgText>
					{data.strikes.map((strike, col) => {
						const id = `${expiry}:${strike}`;
						const cell = cells.find((c) => c.id === id);
						const value = cell?.value;
						const known = typeof value === "number" && Number.isFinite(value);
						const x = 40 + col * 100;
						const y = 74 + row * 125;
						return (
							<g key={id}>
								<rect
									x={x}
									y={y}
									width={92}
									height={88}
									rx={10}
									fill={known && value > 0 ? "var(--primary)" : "currentColor"}
									opacity={known ? (value === 0 ? 0.04 : 0.18) : 0.03}
									stroke="currentColor"
									strokeDasharray={known ? undefined : "4 3"}
								/>
								<foreignObject x={x} y={y} width={92} height={88}>
									<button
										type="button"
										className="h-full w-full rounded-lg text-center text-sm outline-offset-2 focus-visible:outline-2"
										aria-pressed={selected === id}
										aria-label={`${expiry} · ${strike}`}
										onClick={() => onSelect(id)}
										style={{
											border:
												selected === id
													? "2px solid currentColor"
													: "2px solid transparent",
										}}
									>
										<span className="block font-mono font-semibold">
											{known ? signed(value) : "—"}
										</span>
										<span className="block text-[10px]">
											{!cell
												? l("Excluded", "已排除")
												: !known
													? l("Missing", "缺失")
													: cell.traded
														? l("Traded", "有成交")
														: l("Zero trades", "零成交")}
										</span>
									</button>
								</foreignObject>
							</g>
						);
					})}
				</g>
			))}
		</>
	);
}
export function GexDistributionScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [id, setId] = useState(data.snapshots[0].id);
	const [selected, setSelected] = useState(data.requiredIds[0]);
	const snapshot = data.snapshots.find((s) => s.id === id) ?? data.snapshots[0];
	const cell =
		snapshot.cells.find((c) => c.id === selected) ?? snapshot.cells[0];
	const all = summarizeGex(snapshot.cells, data.requiredIds);
	const slice = snapshot.cells.filter((c) => c.expiry === cell.expiry);
	const sliceSum = summarizeGex(
		slice,
		data.requiredIds.filter((key) => key.startsWith(`${cell.expiry}:`)),
	);
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l("GEX by strike and expiry", "按行权价与到期日的 GEX")}
					height={460}
				>
					<Grid
						locale={locale}
						cells={snapshot.cells}
						selected={selected}
						onSelect={setSelected}
					/>
					<SvgText x={180} y={333}>
						{l("Selected expiry net", "所选到期日净值")}
					</SvgText>
					<g data-gex-slice>
						<SvgText x={180} y={367} strong>
							{signed(sliceSum.net)}
						</SvgText>
					</g>
					<SvgText x={180} y={414} muted>
						{l(
							"Full net does not describe every cell",
							"完整净值不描述每个位置",
						)}
					</SvgText>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Distribution", "分布")}
				value={id}
				options={data.snapshots
					.slice(0, 2)
					.map((s) => [s.id, s.label[locale === "zh" ? 1 : 0]])}
				onChange={setId}
			/>
			<SelectField
				label={l("Inspect cell", "检查单元格")}
				value={selected}
				options={snapshot.cells.map((c) => [c.id, `${c.expiry} · ${c.strike}`])}
				onChange={setSelected}
			/>
			<p data-gex-cell>
				{l("Selected contribution", "所选贡献")}: {signed(cell.value)}
				<br />
				{cell.expiry} · {cell.strike}
			</p>
			<p data-gex-net>
				{l("Complete net", "完整净值")}: {signed(all.net)}
			</p>
			<p data-gex-gross>
				{l("Complete gross", "完整总幅度")}: {number(all.gross)}
			</p>
			<Note>
				{l(
					"A and B both net +100. A has gross 400 and a near-expiry net of −150; B has gross 100 and a near-expiry net of +100. Selecting an expiry changes the inspected slice, not the complete total.",
					"A 与 B 净值均为 +100。A 总幅度为 400、近到期净值为 −150；B 总幅度为 100、近到期净值为 +100。选择到期日只改变检查切片，不改变完整总和。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"Cells are supplied synthetic model outputs in the stated units. Do not multiply them by OI or spot again. Signed contributions reflect the model's assumptions, not observed dealer positions.",
					"单元格为声明单位的给定模拟模型输出，不要再次乘以 OI 或现价。带符号贡献反映模型假设，而非已观测做市商持仓。",
				)}
			</p>
		</SceneLayout>
	);
}
export function GexCoverageScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [mode, setMode] = useState("full");
	const [selected, setSelected] = useState(data.requiredIds[0]);
	const base =
		mode === "gap"
			? data.snapshots[2]
			: mode === "zeros"
				? data.snapshots[1]
				: data.snapshots[0];
	const cells =
		mode === "traded" ? base.cells.filter((c) => c.traded) : base.cells;
	const stats = summarizeGex(cells, data.requiredIds);
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Complete chain coverage and known subtotal",
						"完整链覆盖与已知小计",
					)}
					height={500}
				>
					<Grid
						locale={locale}
						cells={cells}
						selected={selected}
						onSelect={setSelected}
					/>
					<SvgText x={180} y={329}>
						{stats.knownCount} / {stats.requiredCount}{" "}
						{l("required values known", "所需数值已知")}
					</SvgText>
					<SvgText x={180} y={366}>
						{l("Known subtotal", "已知小计")}
					</SvgText>
					<g data-gex-known>
						<SvgText x={180} y={395} strong>
							{signed(stats.knownNet)}
						</SvgText>
					</g>
					<SvgText x={180} y={439}>
						{l("Complete net", "完整净值")}
					</SvgText>
					<g data-gex-complete>
						<SvgText x={180} y={471} strong>
							{signed(stats.net)}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Coverage view", "覆盖视图")}
				value={mode}
				options={[
					["full", l("A · full chain", "A · 完整链")],
					["traded", l("A · traded contracts only", "A · 仅有成交合约")],
					["gap", l("A · one missing value", "A · 缺一个数值")],
					["zeros", l("B · explicit zero observations", "B · 明确零观测")],
				]}
				onChange={setMode}
			/>
			<SelectField
				label={l("Inspect required cell", "检查所需单元格")}
				value={selected}
				options={data.snapshots[0].cells.map((c) => [
					c.id,
					`${c.expiry} · ${c.strike}`,
				])}
				onChange={setSelected}
			/>
			<p data-gex-coverage-cell>
				{(() => {
					const c = cells.find((c) => c.id === selected);
					return `${selected} · ${!c ? l("Excluded from sample", "被排除于样本") : c.value === null ? l("Required contribution missing", "所需贡献缺失") : `${signed(c.value)} · ${c.traded ? l("Traded", "有成交") : l("No trades; still required", "零成交；仍需纳入")}`}`;
				})()}
			</p>
			<p data-gex-coverage-status role="status">
				{stats.complete
					? l(
							"Complete for the declared six-cell teaching scope",
							"对声明的六格教学范围完整",
						)
					: l(
							"Incomplete: only a known subtotal is supported",
							"不完整：仅支持已知小计",
						)}
			</p>
			<p data-gex-complete-gross>
				{l("Complete gross", "完整总幅度")}: {number(stats.gross)}
			</p>
			<Note>
				{l(
					"The required scope stays all six cells. The traded-only view excludes −80 and +120 even though their contracts remain outstanding in this example. A missing contribution is not zero. Explicit zeros in B count as known observations.",
					"所需范围始终为全部六格。仅成交视图排除了 −80 与 +120，尽管本例这些合约仍未平仓。缺失贡献不是零。B 中明确的零计为已知观测。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"Completeness is relative to the declared synthetic scope, not a claim about a live full option chain. A gap can hide either sign; a subtotal cannot establish the complete sign or magnitude.",
					"完整性仅针对已声明模拟范围，不代表真实完整期权链。缺口可能隐藏任一符号，小计不能确定完整符号或幅度。",
				)}
			</p>
		</SceneLayout>
	);
}
