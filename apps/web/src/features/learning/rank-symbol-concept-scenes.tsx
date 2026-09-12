import * as m from "motion/react-m";
import { createContext, type ReactNode, useContext, useState } from "react";
import {
	type RankSymbolConceptData,
	rankActivity,
	rankSigned,
} from "@/domain/learning/rank-symbol-concept";
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
export const RankSymbolData = createContext<RankSymbolConceptData | null>(null);
function useData() {
	const data = useContext(RankSymbolData);
	if (!data) throw new Error("Ranking scenes require authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const copy = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const number = (v: number | null) =>
	v === null ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: 2 });
const signed = (v: number) => `${v > 0 ? "+" : ""}${number(v === 0 ? 0 : v)}`;
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
			{data.session}
			<br />
			{copy(locale)(
				"Local comparison controls do not save a research record",
				"本地比较控件不保存研究记录",
			)}
		</p>
	);
}
export function RankSignedScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [magnitude, setMagnitude] = useState(false);
	const [selected, setSelected] = useState("A");
	const replay = useFrames(data.signedFrames.length);
	const ranked = rankSigned(data.signedFrames[replay.frame], magnitude);
	const focal = ranked.find((r) => r.symbol === "A");
	const active = ranked.find((r) => r.symbol === selected);
	const enabled = useLessonMotion();
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l("Signed metric rankings", "有符号指标排名")}
					height={435}
				>
					<SvgText x={180} y={30}>
						{magnitude
							? l("Descending absolute magnitude", "按绝对幅度降序")
							: l("Descending signed value", "按有符号值降序")}
					</SvgText>
					<foreignObject x={25} y={58} width={310} height={280}>
						<div className="flex h-full flex-col gap-[19px]">
							{ranked.map((row) => (
								<m.button
									key={row.symbol}
									type="button"
									layout={enabled ? "position" : false}
									layoutDependency={`${magnitude}:${replay.frame}`}
									initial={false}
									transition={enabled ? lessonTransition : instantTransition}
									className={`h-[78px] w-full shrink-0 rounded-xl text-center text-sm ${selected === row.symbol ? "bg-primary/20" : "bg-foreground/5"}`}
									aria-label={`${l("Inspect symbol", "检查标的")} ${row.symbol}`}
									aria-pressed={selected === row.symbol}
									onClick={() => setSelected(row.symbol)}
								>
									<span className="block font-mono">
										#{row.rank} · {row.symbol} · {signed(row.value)}
									</span>
									<span className="block text-xs">
										{l("Ordering key", "排序值")}: {number(row.score)}
									</span>
								</m.button>
							))}
						</div>
					</foreignObject>
					<SvgText x={180} y={374}>
						{l("A stays at +60", "A 保持 +60")}
					</SvgText>
					<g data-rank-focal>
						<SvgText x={180} y={410} strong>
							{l("Rank", "名次")}: {focal?.rank ?? "—"}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Signed metric ordering", "有符号指标排序")}
				value={magnitude ? "magnitude" : "signed"}
				options={[
					["signed", l("Signed value", "有符号值")],
					[
						"magnitude",
						l("Absolute magnitude; keep sign", "绝对幅度；保留符号"),
					],
				]}
				onChange={(v) => setMagnitude(v === "magnitude")}
			/>
			<SelectField
				label={l("Peer snapshot", "同组快照")}
				value={String(replay.frame)}
				options={data.signedFrames.map((rows, i) => [
					String(i),
					`C = ${signed(rows.find((r) => r.symbol === "C")?.value ?? 0)} · A = +60`,
				])}
				onChange={(v) => replay.select(Number(v))}
			/>
			<PlaybackButton playing={replay.playing} onClick={replay.toggle} l={l} />
			<p data-rank-selected>
				{selected}: {active ? signed(active.value) : "—"} · {l("rank", "名次")}{" "}
				{active?.rank ?? "—"}
			</p>
			<p className="text-muted-foreground text-xs">
				{l(
					"These three values use illustrative signed units. They are a separate example from the option-volume rows in the next scene.",
					"这三个数值使用示例有符号单位，与下一场景的期权成交量行是独立示例。",
				)}
			</p>
			<Note>
				{l(
					"By signed value, +60 ranks above −100. By magnitude, −100 ranks first while staying negative. When only C changes from +20 to +80, A can lose rank despite staying +60. Rank describes the chosen comparison, not a new own-symbol observation or a directional forecast.",
					"按有符号值，+60 排在 −100 前；按幅度，−100 排第一，但方向仍为负。当仅 C 从 +20 变为 +80，A 即使保持 +60 也可降名次。排名描述所选比较，不是新增自身观测或方向预测。",
				)}
			</Note>
		</SceneLayout>
	);
}
function exclusion(reason: string, locale: Locale) {
	return reason === "coverage"
		? copy(locale)("Incomplete session observation", "时段观测不完整")
		: reason === "floor"
			? copy(locale)("Below declared volume floor", "低于声明成交量门槛")
			: copy(locale)("Missing or incomparable baseline", "基准缺失或不可比");
}
export function RankActivityScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [relative, setRelative] = useState(true);
	const [floor, setFloor] = useState(100);
	const [selected, setSelected] = useState("B");
	const result = rankActivity(data.activity, relative, floor);
	const row =
		data.activity.find((r) => r.symbol === selected) ?? data.activity[0];
	const active = result.ranked.find((r) => r.symbol === selected);
	const excluded = result.excluded.find((d) => d.row.symbol === selected);
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Observed activity ranking and exclusions",
						"观测活动排名与排除",
					)}
					height={475}
				>
					<SvgText x={180} y={30}>
						{relative
							? l("Current / comparable typical volume", "当前量 / 可比典型量")
							: l("Raw option contract volume", "原始期权成交张数")}
					</SvgText>
					{result.ranked.map((r, i) => (
						<g key={r.symbol}>
							<rect
								x={25}
								y={53 + i * 68}
								width={310}
								height={58}
								rx={10}
								fill={selected === r.symbol ? "var(--primary)" : "currentColor"}
								opacity={selected === r.symbol ? 0.18 : 0.05}
							/>
							<foreignObject x={25} y={53 + i * 68} width={310} height={58}>
								<button
									type="button"
									className="h-full w-full rounded-lg text-center text-sm"
									aria-label={`${l("Inspect ranked row", "检查排名行")} ${r.symbol}`}
									onClick={() => setSelected(r.symbol)}
								>
									<span className="block font-mono">
										#{r.rank} · {r.symbol} · {number(r.value)}
										{relative ? "×" : ""}
									</span>
									<span className="block text-xs">
										{number(r.row.volume)} / {number(r.row.baseline)}
									</span>
								</button>
							</foreignObject>
						</g>
					))}
					<SvgText x={180} y={426}>
						{l("Excluded rows", "排除行")}: {result.excluded.length}
					</SvgText>
					<SvgText x={180} y={461} muted>
						{l(
							"Rank only the eligible observed subset",
							"仅对合格已观测子集排名",
						)}
					</SvgText>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Activity metric", "活动指标")}
				value={relative ? "relative" : "raw"}
				options={[
					["relative", l("Relative volume", "相对成交量")],
					["raw", l("Raw volume", "原始成交量")],
				]}
				onChange={(v) => setRelative(v === "relative")}
			/>
			<RangeControl
				label={l("Declared volume floor", "声明成交量门槛")}
				value={floor}
				display={number(floor)}
				min={data.floorRange[0]}
				max={data.floorRange[1]}
				step={100}
				onChange={setFloor}
			/>
			<SelectField
				label={l("Inspect source row", "检查来源行")}
				value={selected}
				options={data.activity.map((r) => [r.symbol, r.symbol])}
				onChange={setSelected}
			/>
			<p data-rank-activity-leader>
				{l("Observed leader", "观测领先者")}:{" "}
				{result.ranked
					.filter((r) => r.rank === 1)
					.map((r) => r.symbol)
					.join(" / ") || "—"}
			</p>
			<p data-rank-activity-detail>
				{selected} · {l("volume", "量")} {number(row.volume)} ·{" "}
				{l("baseline", "基准")} {number(row.baseline)}
				<br />
				{active
					? `${l("Observed rank", "观测名次")}: ${active.rank} · ${number(active.value)}${relative ? "×" : ""}`
					: exclusion(excluded?.reason ?? "coverage", locale)}
			</p>
			<div data-rank-exclusions className="text-sm">
				{result.excluded.map((d) => (
					<p key={d.row.symbol}>
						{d.row.symbol}: {exclusion(d.reason ?? "coverage", locale)}
					</p>
				))}
			</div>
			<Note>
				{l(
					"A leads raw volume, while B leads comparable relative activity at the default floor. C's 50 contracts over a baseline of 1 is 50×, but it falls below the declared 100-contract floor. Removing that floor changes the comparison; it does not establish a better signal.",
					"默认门槛下，A 原始量领先，B 可比相对活动领先。C 的 50 张除以基准 1 是 50×，但低于声明的 100 张门槛。移除门槛改变比较，不证明信号更好。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"D lacks a baseline, F's baseline is not comparable, and E lacks complete session volume. Those exclusions remain visible. They limit full-universe claims; do not treat an excluded value as zero or choose a metric solely because its result is dramatic.",
					"D 缺少基准，F 基准不可比，E 缺少完整时段量。这些排除持续可见，限制完整范围结论。不要将排除值当零，也不要仅因结果突出而选指标。",
				)}
			</p>
		</SceneLayout>
	);
}
export function RankHandoffScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [id, setId] = useState(data.handoffs[0].id);
	const [field, setField] = useState("observation");
	const snapshot = data.handoffs.find((s) => s.id === id) ?? data.handoffs[0];
	const result = rankActivity(snapshot.rows, true, 100);
	const b = snapshot.rows.find((r) => r.symbol === "B");
	const candidate = result.ranked.find((r) => r.symbol === "B");
	const items = [
		{
			id: "observation",
			label: l("Observation", "观测"),
			value: `B · ${number(b?.volume ?? null)} / ${number(b?.baseline ?? null)}`,
		},
		{
			id: "comparison",
			label: l("Comparison set", "比较集合"),
			value: result.ranked.map((r) => r.symbol).join(" / "),
		},
		{
			id: "next",
			label: l("Next inspection", "下一项检查"),
			value: candidate
				? l("Check baseline and contract context", "检查基准与合约上下文")
				: l("Restore required coverage first", "先恢复必需覆盖"),
		},
		{
			id: "revision",
			label: l("Revision trigger", "修订触发"),
			value: l("Peer, baseline or coverage change", "同组、基准或覆盖变化"),
		},
	];
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l("Candidate B research handoff", "候选 B 研究交接")}
					height={450}
				>
					<SvgText x={180} y={30}>
						{l("Candidate B · descriptive priority", "候选 B · 描述性优先级")}
					</SvgText>
					{items.map((item, i) => (
						<g key={item.id}>
							<rect
								x={25}
								y={53 + i * 78}
								width={310}
								height={66}
								rx={11}
								fill={field === item.id ? "var(--primary)" : "currentColor"}
								opacity={field === item.id ? 0.18 : 0.05}
							/>
							<foreignObject x={25} y={53 + i * 78} width={310} height={66}>
								<button
									type="button"
									className="h-full w-full rounded-xl text-center text-sm"
									aria-pressed={field === item.id}
									onClick={() => setField(item.id)}
								>
									<span className="block font-medium">{item.label}</span>
									<span className="block text-xs">{item.value}</span>
								</button>
							</foreignObject>
						</g>
					))}
					<SvgText x={180} y={404}>
						{l("B observed rank", "B 观测名次")}
					</SvgText>
					<g data-rank-handoff-rank>
						<SvgText x={180} y={438} strong>
							{candidate?.rank ?? "—"}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Handoff evidence snapshot", "交接证据快照")}
				value={id}
				options={data.handoffs.map((s) => [
					s.id,
					s.label[locale === "zh" ? 1 : 0],
				])}
				onChange={setId}
			/>
			<p>{snapshot.note[locale === "zh" ? 1 : 0]}</p>
			<p data-rank-handoff-value>
				{l("B relative activity", "B 相对活动")}:{" "}
				{candidate ? `${number(candidate.value)}×` : "—"}
			</p>
			<p data-rank-handoff-peers>
				{l("Observed peers", "观测同组")}:{" "}
				{result.ranked.map((r) => r.symbol).join(" / ")}
			</p>
			<p data-rank-handoff-exclusions className="text-muted-foreground text-xs">
				{l("Excluded", "排除")}:{" "}
				{result.excluded
					.map(
						(d) =>
							`${d.row.symbol}: ${exclusion(d.reason ?? "coverage", locale)}`,
					)
					.join("; ")}
			</p>
			<Note>
				{field === "observation"
					? l(
							"Keep the raw count, baseline, observation session and coverage status with the candidate. An old count remains visible after coverage is withdrawn, but its comparison value is withheld.",
							"候选需保留原始张数、基准、观测时段与覆盖状态。覆盖撤回后旧张数仍可见，但不提供比较值。",
						)
					: field === "comparison"
						? l(
								"B can lose rank when corrected C becomes 12×, even though B stays 600 / 200 = 3×. Name admitted peers and exclusions instead of reporting an isolated rank.",
								"C 更正为 12× 时，B 即使仍为 600/200=3× 也可降名次。应说明纳入同组及排除项，而非孤立排名。",
							)
						: field === "next"
							? l(
									"Relative activity can justify inspecting the source, baseline comparability, constituent contracts and execution context. It does not justify a buy/sell decision or establish future performance.",
									"相对活动可支持进一步检查来源、基准可比性、组成合约与执行上下文，不足以支持买卖决定或证明未来表现。",
								)
							: l(
									"Revisit priority if peers change, the baseline is corrected, liquidity falls below the declared floor or required coverage is withdrawn. Keep the original snapshot when recording that revision.",
									"同组变化、基准更正、流动性低于声明门槛或必需覆盖撤回时，应重新审视优先级。记录修订时保留原快照。",
								)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"This local handoff is a teaching example, not a saved watchlist or a validated forecast. The comparison stays relative volume with a 100-contract floor across the supplied six-symbol population.",
					"本地交接为教学示例，不是已保存观察列表或已验证预测。比较始终在给定六标的人群中使用相对成交量与 100 张门槛。",
				)}
			</p>
		</SceneLayout>
	);
}
