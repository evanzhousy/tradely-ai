import * as m from "motion/react-m";
import { createContext, type ReactNode, useContext, useState } from "react";
import {
	type ContractNeighborhood,
	callMoneyness,
} from "@/domain/learning/contracts";
import {
	type NeighborhoodConceptData,
	neighborhoodEvidenceStatus,
	neighborhoodSummary,
} from "@/domain/learning/neighborhood-concept";
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
export const NeighborhoodData = createContext<NeighborhoodConceptData | null>(
	null,
);
function useData() {
	const data = useContext(NeighborhoodData);
	if (!data)
		throw new Error("Neighborhood scenes require authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const copy = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const number = (v: number | null) =>
	v === null ? "—" : v.toLocaleString("en-US");
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
			{data.source}
			<br />
			{data.snapshots[0].data.symbol} · {copy(locale)("calls only", "仅看涨")} ·{" "}
			{data.session}
			<br />
			{copy(locale)(
				"Fixed scope: strikes 95–105, 14–60 days",
				"固定范围：行权价 95–105，14–60 天",
			)}
		</p>
	);
}
function statusLabel(status: string, locale: Locale) {
	const l = copy(locale);
	return status === "comparable"
		? l("Eligible current observation", "合格当前观测")
		: status === "out_of_scope"
			? l("Outside declared scope", "声明范围外")
			: status === "stale"
				? l("Prior-session observation", "前日观测")
				: l("Missing required observation", "必需观测缺失");
}
function Grid({
	locale,
	neighborhood,
	selected,
	onSelect,
	focus = null,
}: Props & {
	neighborhood: ContractNeighborhood;
	selected: string;
	onSelect: (id: string) => void;
	focus?: number | null;
}) {
	const data = useData();
	const l = copy(locale);
	return (
		<>
			{data.strikes.map((strike, i) => (
				<SvgText key={strike} x={80 + i * 100} y={28}>
					{strike}
				</SvgText>
			))}
			{data.days.map((days, row) => (
				<g key={days} opacity={focus === null || focus === days ? 1 : 0.3}>
					<SvgText x={180} y={55 + row * 100} muted>
						{days} {l("days to expiry", "天到期")}
					</SvgText>
					{data.strikes.map((strike, col) => {
						const c = neighborhood.contracts.find(
							(c) => c.strike === strike && c.days === days,
						);
						const status = c
							? neighborhoodEvidenceStatus(neighborhood, c)
							: "missing";
						const current = status === "comparable";
						const x = 35 + col * 100;
						const y = 66 + row * 100;
						const label = current
							? c?.volume === 0
								? l("Observed zero", "观测为零")
								: l("Current", "当前")
							: status === "stale"
								? l("Prior session", "前日")
								: l("Missing", "缺失");
						return (
							<g key={strike}>
								<rect
									x={x}
									y={y}
									width={90}
									height={75}
									rx={10}
									fill={
										current && (c?.volume ?? 0) > 0
											? "var(--primary)"
											: "currentColor"
									}
									opacity={
										current && (c?.volume ?? 0) > 0
											? 0.1 + ((c?.volume ?? 0) / 3000) * 0.55
											: 0.035
									}
									stroke="currentColor"
									strokeDasharray={current ? undefined : "4 3"}
								/>
								<foreignObject x={x} y={y} width={90} height={75}>
									<button
										type="button"
										className="h-full w-full rounded-lg text-center text-sm"
										style={{
											border:
												selected === c?.id
													? "2px solid currentColor"
													: "2px solid transparent",
										}}
										aria-label={`${days}d · ${strike}`}
										aria-pressed={selected === c?.id}
										onClick={() => c && onSelect(c.id)}
									>
										<span className="block font-mono font-semibold">
											{number(c?.volume ?? null)}
										</span>
										<span className="block text-[10px]">{label}</span>
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
export function NeighborhoodExploreScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const snapshot = data.snapshots[0];
	const [selected, setSelected] = useState("30:100");
	const [focus, setFocus] = useState<number | null>(null);
	const [spot, setSpot] = useState(snapshot.data.spot as number);
	const row =
		snapshot.data.contracts.find((c) => c.id === selected) ??
		snapshot.data.contracts[0];
	const all = neighborhoodSummary(snapshot.data, data.requiredIds);
	const sliceIds = data.requiredIds.filter(
		(id) => focus === null || id.startsWith(`${focus}:`),
	);
	const slice = neighborhoodSummary(snapshot.data, sliceIds);
	const choose = (id: string) => {
		setSelected(id);
		if (focus !== null)
			setFocus(snapshot.data.contracts.find((c) => c.id === id)?.days ?? focus);
	};
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Contract strike and expiry neighborhood",
						"合约行权价与到期邻域",
					)}
					height={415}
				>
					<Grid
						locale={locale}
						neighborhood={snapshot.data}
						selected={selected}
						onSelect={choose}
						focus={focus}
					/>
					<SvgText x={180} y={375}>
						{l("Volume in contracts", "成交张数")}
					</SvgText>
					<SvgText x={180} y={400} muted>
						{l("Fixed 3,000 color scale", "固定 3,000 色阶")}
					</SvgText>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Expiry focus", "到期聚焦")}
				value={focus === null ? "all" : String(focus)}
				options={[
					["all", l("All expiries", "全部到期日")],
					...data.days.map(
						(d) => [String(d), `${d} ${l("days", "天")}`] as const,
					),
				]}
				onChange={(value) => {
					const next = value === "all" ? null : Number(value);
					setFocus(next);
					if (next !== null)
						setSelected(
							snapshot.data.contracts.find((c) => c.days === next)?.id ??
								selected,
						);
				}}
			/>
			<SelectField
				label={l("Selected contract", "所选合约")}
				value={selected}
				options={snapshot.data.contracts.map((c) => [
					c.id,
					`${c.days}d · ${c.strike} call`,
				])}
				onChange={choose}
			/>
			<RangeControl
				label={l("Hypothetical reference spot", "假设参考现价")}
				value={spot}
				display={`$${spot}`}
				min={data.spotRange[0]}
				max={data.spotRange[1]}
				step={1}
				onChange={setSpot}
			/>
			<p data-neighbor-selected>
				{row.days}d · {row.strike} call · {number(row.volume)}{" "}
				{l("contracts", "张")}
			</p>
			<p data-neighbor-money>
				{l("Call moneyness", "看涨价内外")}:{" "}
				{callMoneyness(row.strike, spot).toUpperCase()}
			</p>
			<p data-neighbor-slice>
				{l("Focused expiry subtotal", "聚焦到期小计")}: {number(slice.total)}
			</p>
			<p data-neighbor-full>
				{l("Full declared scope total", "完整声明范围总量")}:{" "}
				{number(all.total)}
			</p>
			<Note>
				{l(
					"Focus dims other expiries; it does not remove contracts from the declared universe or recompute full totals. Spot changes only moneyness here: at 103, a 100 call is ITM and a 105 call is OTM. It does not alter the observed volume or tell you which contract to buy.",
					"聚焦使其他到期日变淡，不将合约移出声明范围，也不改写完整总量。此处现价只改变价内外：103 时，100 看涨为实值、105 看涨为虚值，不改变观测量，也不告诉你买哪张。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"Carry the selected identity, source date, nearby activity and coverage into the next inspection. A cluster does not establish a spread, shared owner, accumulation or forecast.",
					"下一项检查应携带所选身份、来源日期、邻近活动与覆盖。聚集不证明价差策略、共同持有、积累或预测。",
				)}
			</p>
		</SceneLayout>
	);
}
export function NeighborhoodBreadthScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const replay = useFrames(3);
	const [manual, setManual] = useState<number | null>(0);
	const index = manual ?? (replay.frame === 1 ? 1 : 0);
	const snapshot = data.snapshots[index];
	const [selected, setSelected] = useState("30:100");
	const stats = neighborhoodSummary(snapshot.data, data.requiredIds);
	const enabled = useLessonMotion();
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Equal total and peak different breadth",
						"总量峰值相同但广度不同",
					)}
					height={455}
				>
					<Grid
						locale={locale}
						neighborhood={snapshot.data}
						selected={selected}
						onSelect={setSelected}
					/>
					<SvgText x={180} y={377}>
						{l("Observed nonzero cells", "已观测非零格")}: {stats.breadth} / 9
					</SvgText>
					<rect
						x={35}
						y={402}
						width={290}
						height={15}
						rx={5}
						fill="currentColor"
						opacity={0.06}
					/>
					<m.rect
						x={35}
						y={402}
						width={((stats.breadth ?? 0) / 9) * 290}
						height={15}
						rx={5}
						fill="var(--primary)"
						initial={false}
						animate={{ width: ((stats.breadth ?? 0) / 9) * 290 }}
						transition={
							enabled && replay.playing ? lessonTransition : instantTransition
						}
					/>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Supplied layout", "给定布局")}
				value={String(index)}
				options={data.snapshots
					.slice(0, 2)
					.map((s, i) => [String(i), s.label[locale === "zh" ? 1 : 0]])}
				onChange={(v) => {
					replay.select(replay.frame);
					setManual(Number(v));
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
			<p data-neighbor-total>
				{l("Complete total", "完整总量")}: {number(stats.total)}
			</p>
			<p data-neighbor-peak>
				{l("Complete peak", "完整峰值")}: {number(stats.peak)}
			</p>
			<p data-neighbor-breadth>
				{l("Complete nonzero count", "完整非零数")}: {stats.breadth}
			</p>
			<Note>
				{l(
					"Both layouts total 8,000 contracts and peak at 3,000. The compact layout has three nonzero cells; the broad layout has nine. Peak and total alone do not describe distribution. Explicit zero observations count toward coverage but not nonzero breadth.",
					"两种布局总量均为 8,000 张、峰值均为 3,000。集中布局有三个非零格，广泛布局有九个。仅峰值与总量不能描述分布。明确零观测计入覆盖，但不计非零广度。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"Playback compares fixed illustrative layouts, not a live session or reconstructed trade path. Every cell keeps the same declared units and axes.",
					"回放比较固定示意布局，不是实时时段或重建成交路径。每格保持相同声明单位与坐标。",
				)}
			</p>
		</SceneLayout>
	);
}
export function NeighborhoodQualityScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [id, setId] = useState("broad");
	const [selected, setSelected] = useState("14:95");
	const snapshot = data.snapshots.find((s) => s.id === id) ?? data.snapshots[1];
	const row =
		snapshot.data.contracts.find((c) => c.id === selected) ??
		snapshot.data.contracts[0];
	const stats = neighborhoodSummary(snapshot.data, data.requiredIds);
	const outside = snapshot.data.contracts.find(
		(c) => neighborhoodEvidenceStatus(snapshot.data, c) === "out_of_scope",
	);
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l("Contract evidence eligibility", "合约证据资格")}
					height={490}
				>
					<Grid
						locale={locale}
						neighborhood={snapshot.data}
						selected={row.id}
						onSelect={setSelected}
					/>
					{outside ? (
						<foreignObject x={25} y={356} width={310} height={54}>
							<button
								type="button"
								className="h-full w-full rounded-xl border text-sm"
								onClick={() => setSelected(outside.id)}
							>
								{l("Inspect outside-scope row", "检查范围外行")}:{" "}
								{outside.strike} · {number(outside.volume)}
							</button>
						</foreignObject>
					) : (
						<SvgText x={180} y={386}>
							{l("All displayed axes remain fixed", "所有显示坐标保持固定")}
						</SvgText>
					)}
					<SvgText x={180} y={445}>
						{l("Eligible known cells", "合格已知格")}: {stats.knownCount} /{" "}
						{stats.requiredCount}
					</SvgText>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Evidence snapshot", "证据快照")}
				value={id}
				options={data.snapshots
					.slice(1)
					.map((s) => [s.id, s.label[locale === "zh" ? 1 : 0]])}
				onChange={(v) => {
					setId(v);
					setSelected("14:95");
				}}
			/>
			<SelectField
				label={l("Inspect evidence row", "检查证据行")}
				value={row.id}
				options={snapshot.data.contracts.map((c) => [
					c.id,
					`${c.days}d · ${c.strike} call`,
				])}
				onChange={setSelected}
			/>
			<p data-neighbor-quality-detail>
				{row.days}d · {row.strike} call · {number(row.volume)}
				<br />
				{l("Source session", "来源时段")}: {snapshot.sessions[row.id]}
			</p>
			<p data-neighbor-status>
				{statusLabel(neighborhoodEvidenceStatus(snapshot.data, row), locale)}
			</p>
			<p data-neighbor-known>
				{l("Known eligible subtotal", "已知合格小计")}:{" "}
				{number(stats.knownTotal)}
			</p>
			<p data-neighbor-complete>
				{l("Complete scope total", "完整范围总量")}: {number(stats.total)}
			</p>
			<p data-neighbor-known-peak>
				{l("Known eligible peak", "已知合格峰值")}: {number(stats.knownPeak)}
			</p>
			<p data-neighbor-complete-peak>
				{l("Complete scope peak", "完整范围峰值")}: {number(stats.peak)}
			</p>
			<Note>
				{l(
					"A missing required cell or a prior-session value leaves current coverage incomplete. A known subtotal or peak does not certify the complete total or maximum. The 20,000-contract row at strike 115 is outside the fixed scope, so it cannot win this comparison even though it is visible for audit.",
					"必需格缺失或仅有前日值时，当前覆盖不完整。已知小计或峰值不能认证完整总和或最大值。行权价 115 的 20,000 张行位于固定范围外，即使显示以供审计，也不能赢得本比较。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"Keep excluded and unknown evidence in the record. Do not replace either with zero, silently widen the scope or infer a position from the shape.",
					"记录中保留排除与未知证据，不将其补零，不悄然扩大范围，也不从形状推断持仓。",
				)}
			</p>
		</SceneLayout>
	);
}
