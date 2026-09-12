import * as m from "motion/react-m";
import { createContext, type ReactNode, useContext, useState } from "react";
import {
	describeScore,
	evaluationMatches,
	knownContractSum,
	knownRecords,
	type PointTimeConceptData,
	recencyWeight,
} from "@/domain/learning/point-time-concept";
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
export const PointTimeData = createContext<PointTimeConceptData | null>(null);
function useData() {
	const data = useContext(PointTimeData);
	if (!data)
		throw new Error("Point-time scenes require authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const copy = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const number = (v: number | null) =>
	v === null
		? "—"
		: (v === 0 ? 0 : v).toLocaleString("en-US", { maximumFractionDigits: 2 });
const clock = (seconds: number) => {
	const total = 598 * 60 + seconds;
	return [Math.floor(total / 3600), Math.floor(total / 60) % 60, total % 60]
		.map((n) => String(n).padStart(2, "0"))
		.join(":");
};
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
			{copy(locale)(
				"Independent synthetic teaching examples",
				"独立模拟教学示例",
			)}
		</p>
	);
}
export function KnowledgeCutoffScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const replay = useFrames(data.cutoffFrames.length);
	const [manual, setManual] = useState<number | null>(null);
	const cutoff = manual ?? data.cutoffFrames[replay.frame];
	const [selected, setSelected] = useState("late");
	const row = data.records.find((r) => r.id === selected) ?? data.records[0];
	const active = knownRecords(data.records, cutoff);
	const ids = active.map((r) => r.id);
	const enabled = useLessonMotion();
	const x = (seconds: number) => 35 + (seconds / 300) * 290;
	const status =
		row.receivedSeconds === null
			? l("Availability not established", "可用时间未确定")
			: row.eventSeconds > cutoff || row.receivedSeconds > cutoff
				? l("Not yet available at this cutoff", "此截止时尚不可用")
				: ids.includes(row.id)
					? l("Active known revision", "当前已知有效版本")
					: l("Superseded at this cutoff", "此截止时已被后续版本替代");
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l("Event receipt and decision clocks", "事件接收与决策时钟")}
					height={475}
				>
					<SvgText x={180} y={28}>
						{l("Cutoff", "截止")}: {clock(cutoff)}
					</SvgText>
					{enabled && replay.playing ? (
						<m.line
							x1={x(cutoff)}
							x2={x(cutoff)}
							y1={55}
							y2={376}
							stroke="var(--primary)"
							strokeDasharray="5 4"
							initial={false}
							animate={{ x1: x(cutoff), x2: x(cutoff) }}
							transition={
								enabled && replay.playing ? lessonTransition : instantTransition
							}
						/>
					) : (
						<line
							x1={x(cutoff)}
							x2={x(cutoff)}
							y1={55}
							y2={376}
							stroke="var(--primary)"
							strokeDasharray="5 4"
						/>
					)}
					{data.records.map((r, i) => {
						const y = 85 + i * 76;
						return (
							<g key={r.id}>
								<line
									x1={35}
									x2={325}
									y1={y + 18}
									y2={y + 18}
									stroke="currentColor"
									opacity={0.15}
								/>
								<circle
									cx={x(r.eventSeconds)}
									cy={y + 18}
									r={5}
									fill="none"
									stroke="currentColor"
								/>
								{r.receivedSeconds !== null && (
									<circle
										cx={x(r.receivedSeconds)}
										cy={y + 18}
										r={6}
										fill={
											ids.includes(r.id) ? "var(--primary)" : "currentColor"
										}
										opacity={ids.includes(r.id) ? 1 : 0.25}
									/>
								)}
								<foreignObject x={35} y={y - 19} width={290} height={30}>
									<button
										type="button"
										className="h-full w-full text-left text-xs"
										aria-pressed={selected === r.id}
										onClick={() => setSelected(r.id)}
									>
										{r.key} v{r.version} · {number(r.contracts)}{" "}
										{r.receivedSeconds === null
											? l("· receipt ?", "· 接收 ?")
											: ""}
									</button>
								</foreignObject>
							</g>
						);
					})}
					<SvgText x={52} y={391} muted>
						09:58
					</SvgText>
					<SvgText x={308} y={391} muted>
						10:03
					</SvgText>
					<SvgText x={180} y={428}>
						{l("○ event · ● receipt", "○ 事件 · ● 接收")}
					</SvgText>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<p className="font-mono text-xs">{data.date}</p>
			<RangeControl
				label={l(
					"Decision cutoff seconds after 09:58",
					"09:58 后的决策截止秒数",
				)}
				value={cutoff}
				display={clock(cutoff)}
				min={0}
				max={300}
				step={30}
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
			<SelectField
				label={l("Inspect source revision", "检查来源版本")}
				value={selected}
				options={data.records.map((r) => [r.id, `${r.key} v${r.version}`])}
				onChange={setSelected}
			/>
			<p data-pit-record className="font-mono text-xs">
				{row.key} v{row.version} · {number(row.contracts)}
				<br />
				{l("Event", "事件")}: {clock(row.eventSeconds)}
				<br />
				{l("Received", "接收")}:{" "}
				{row.receivedSeconds === null ? "—" : clock(row.receivedSeconds)}
			</p>
			<p data-pit-status>{status}</p>
			<p data-pit-total>
				{l("Active known subtotal", "有效已知小计")}:{" "}
				{number(knownContractSum(active))}
			</p>
			<p data-pit-active>
				{l("Active revisions", "有效版本")}:{" "}
				{active.map((r) => `${r.key} v${r.version}`).join(" / ") || "—"}
			</p>
			<Note>
				{l(
					"At 10:00 the 09:59 event is still unavailable: it arrives at 10:02. At 10:03, its correction replaces 100 with 70; do not add both versions. An unknown receipt clock cannot establish earlier availability. This subtotal covers known active records, not a complete source tape.",
					"10:00 时，09:59 事件仍不可用，它到 10:02 才到达。10:03 的更正将 100 替换为 70，不要将两版本相加。未知接收时钟不能确定早先可用性。小计仅覆盖已知有效记录，不代表完整来源成交带。",
				)}
			</Note>
		</SceneLayout>
	);
}
export function RecencyDecayScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const replay = useFrames(data.decay.frames.length);
	const [manual, setManual] = useState<number | null>(null);
	const elapsed = manual ?? data.decay.frames[replay.frame];
	const [halfLife, setHalfLife] = useState<number | null>(data.decay.halfLife);
	const value = recencyWeight(data.decay.initial, elapsed, halfLife);
	const enabled = useLessonMotion();
	const x = (s: number) => 40 + (s / 180) * 280;
	const y = (v: number) => 300 - (v / data.decay.initial) * 230;
	const points =
		halfLife === null
			? ""
			: Array.from(
					{ length: 61 },
					(_, i) =>
						`${x(i * 3)},${y(recencyWeight(data.decay.initial, i * 3, halfLife) as number)}`,
				).join(" ");
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Recency weight decay with unchanged raw activity",
						"原始活动不变的近期权重衰减",
					)}
					height={440}
				>
					<SvgText x={180} y={28}>
						{l("Formula weight, not raw volume", "公式权重，不是原始成交量")}
					</SvgText>
					<line
						x1={40}
						x2={320}
						y1={300}
						y2={300}
						stroke="currentColor"
						opacity={0.25}
					/>
					{points && (
						<polyline
							points={points}
							fill="none"
							stroke="currentColor"
							strokeWidth={2}
						/>
					)}
					<SvgText x={24} y={75} muted>
						{data.decay.initial}
					</SvgText>
					<SvgText x={25} y={305} muted>
						0
					</SvgText>
					{value !== null &&
						(enabled && replay.playing ? (
							<m.circle
								cx={x(elapsed)}
								cy={y(value)}
								r={8}
								fill="var(--primary)"
								stroke="currentColor"
								initial={false}
								animate={{ cx: x(elapsed), cy: y(value) }}
								transition={
									enabled && replay.playing
										? lessonTransition
										: instantTransition
								}
							/>
						) : (
							<circle
								cx={x(elapsed)}
								cy={y(value)}
								r={8}
								fill="var(--primary)"
								stroke="currentColor"
							/>
						))}
					{[0, 60, 120, 180].map((s) => (
						<SvgText key={s} x={x(s)} y={330} muted>
							{s}s
						</SvgText>
					))}
					<g data-pit-weight>
						<SvgText x={180} y={382} strong>
							{number(value)}
						</SvgText>
					</g>
					<SvgText x={180} y={418}>
						{l("Recency weight units", "近期权重单位")}
					</SvgText>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<RangeControl
				label={l("Elapsed seconds without new events", "无新事件经过秒数")}
				value={elapsed}
				display={`${elapsed}s`}
				min={0}
				max={180}
				step={30}
				onChange={(v) => {
					replay.select(replay.frame);
					setManual(v);
				}}
			/>
			<SelectField
				label={l("Half-life", "半衰期")}
				value={halfLife === null ? "missing" : String(halfLife)}
				options={[
					["30", "30s"],
					["60", "60s"],
					["120", "120s"],
					["missing", l("Not supplied", "未提供")],
				]}
				onChange={(v) => {
					replay.select(replay.frame);
					setHalfLife(v === "missing" ? null : Number(v));
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
				{data.decay.initial} × (1/2)^({elapsed} / {number(halfLife)})
			</p>
			<p data-pit-raw>
				{l("Fixed raw records", "固定原始记录")}: {data.decay.rawEvents}{" "}
				{l("events", "事件")} · {data.decay.rawContracts} {l("contracts", "张")}
			</p>
			<Note>
				{l(
					"With a 60-second half-life, weight 80 becomes 40 after 60 seconds, 20 after 120 and 10 after 180. No raw events or contracts are removed. Changing the half-life changes the scoring method, not the original executions.",
					"半衰期 60 秒时，权重 80 在 60 秒后为 40，120 秒后为 20，180 秒后为 10。未移除任何原始事件或张数。改变半衰期改变评分方法，而非原始执行。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"This is a separate fixed-event example and an explicit decay formula, not a price forecast. A score changing without new activity does not imply new buying or selling.",
					"这是独立固定事件示例及明确衰减公式，不是价格预测。无新活动时分数变化，不意味着新增买卖。",
				)}
			</p>
		</SceneLayout>
	);
}
export function ScoreMeaningScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [id, setId] = useState(data.reports[0].id);
	const [selected, setSelected] = useState("percentile");
	const report = data.reports.find((r) => r.id === id) ?? data.reports[0];
	const result = describeScore(report);
	const items = [
		{
			id: "percentile",
			label: l("Strictly-below percentile", "严格较低百分位"),
			value: result.percentile === null ? "—" : `${number(result.percentile)}%`,
		},
		{
			id: "z",
			label: l("Standardized score (z)", "标准分 (z)"),
			value: number(result.z),
		},
		{
			id: "probability",
			label: l("Outcome probability", "结果概率"),
			value: "—",
		},
	];
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Percentile score and probability meanings",
						"百分位分数与概率含义",
					)}
					height={425}
				>
					{items.map((item, i) => (
						<g key={item.id}>
							<rect
								x={25}
								y={30 + i * 115}
								width={310}
								height={92}
								rx={13}
								fill={selected === item.id ? "var(--primary)" : "currentColor"}
								opacity={selected === item.id ? 0.18 : 0.04}
							/>
							<foreignObject x={25} y={30 + i * 115} width={310} height={92}>
								<button
									type="button"
									className="h-full w-full rounded-xl text-center text-sm"
									aria-pressed={selected === item.id}
									onClick={() => setSelected(item.id)}
								>
									<span className="block">{item.label}</span>
									<span className="block font-mono text-xl">{item.value}</span>
								</button>
							</foreignObject>
						</g>
					))}
					<SvgText x={180} y={402} muted>
						{l("No calibrated outcome model supplied", "未提供校准结果模型")}
					</SvgText>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Baseline report", "基准报告")}
				value={id}
				options={data.reports.map((r) => [
					r.id,
					r.label[locale === "zh" ? 1 : 0],
				])}
				onChange={setId}
			/>
			<p className="font-mono text-xs">
				n = {report.count} · {l("Protocol minimum", "协议下限")} ={" "}
				{report.minimumCount}
				<br />
				{l("Current / mean / deviation", "当前 / 均值 / 标准差")}:{" "}
				{report.current} / {report.mean} / {number(report.deviation)}
				<br />
				{l("Strictly below current", "严格低于当前")}: {report.below}
			</p>
			<p data-pit-percentile>
				{l("Percentile", "百分位")}:{" "}
				{result.percentile === null ? "—" : `${number(result.percentile)}%`}
			</p>
			<p data-pit-z>z: {number(result.z)}</p>
			<p data-pit-score-status>
				{result.reason === null
					? l(
							"Descriptive statistics under this supplied protocol",
							"本给定协议下的描述统计",
						)
					: result.reason === "coverage"
						? l("Required baseline coverage missing", "必需基准覆盖缺失")
						: result.reason === "baseline"
							? l("Baseline comparison is not supported", "基准比较不受支持")
							: l(
									"Below this example's declared sample minimum",
									"低于本例声明样本下限",
								)}
			</p>
			<Note>
				{selected === "percentile"
					? l(
							"In the default report, 90 of 100 baseline observations are strictly below the current value: 90th percentile under this convention. This locates the value in that distribution; it is not a 90% chance of profit.",
							"默认报告中，100 个基准观测有 90 个严格低于当前值：按此约定为第 90 百分位。这表示其在该分布的位置，不是 90% 盈利概率。",
						)
					: selected === "z"
						? l(
								"The default report’s current value 20, mean 10 and deviation 5 give z = (20−10)/5 = 2. This is standardized distance. Zero deviation makes z undefined while a supported percentile can remain available.",
								"给定当前值 20、均值 10、标准差 5，得到 z=(20−10)/5=2。这是标准化距离。标准差为零时 z 未定义，但受支持的百分位可仍可用。",
							)
						: l(
								"An outcome probability requires a defined event and horizon plus an evaluated, calibrated model. No such model is supplied here, so probability is unavailable. Percentile and z do not convert into a profit probability by relabeling.",
								"结果概率需定义事件与期限，并提供经过评价和校准的模型。此处未提供，因此概率不可用。改标签不能将百分位或 z 变成盈利概率。",
							)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"The 30-sample publication minimum is specific to this teaching protocol, not a universal statistical rule. These supplied summary reports are independent of the preceding decay example.",
					"30 个样本的发布下限仅属于本教学协议，不是通用统计规则。这些给定汇总报告独立于前面的衰减示例。",
				)}
			</p>
		</SceneLayout>
	);
}
export function HoldoutScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [threshold, setThreshold] = useState(data.evaluation.threshold);
	const [frozen, setFrozen] = useState<number | null>(null);
	const [reused, setReused] = useState(false);
	const first =
		frozen === null ? null : evaluationMatches(data.evaluation.heldout, frozen);
	const current =
		frozen === null
			? null
			: evaluationMatches(data.evaluation.heldout, threshold);
	const reveal = () => {
		if (frozen === null) setFrozen(threshold);
	};
	const change = (value: number) => {
		if (frozen !== null && value !== threshold) setReused(true);
		setThreshold(value);
	};
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l("Frozen design and held-out outcomes", "固定设计与保留结果")}
					height={460}
				>
					<SvgText x={180} y={30}>
						{l("Predict positive if score ≥", "预测为正：分数 ≥")} {threshold}
					</SvgText>
					<SvgText x={180} y={77}>
						{l("Development cases", "开发案例")}:{" "}
						{evaluationMatches(data.evaluation.development, threshold)} /{" "}
						{data.evaluation.development.length}
					</SvgText>
					{data.evaluation.heldout.map((c, i) => (
						<g key={c.id}>
							<rect
								x={25}
								y={115 + i * 90}
								width={310}
								height={70}
								rx={12}
								fill="currentColor"
								opacity={0.05}
							/>
							<SvgText x={180} y={142 + i * 90}>
								{c.id} · {l("score", "分数")} {c.score}
							</SvgText>
							<SvgText x={180} y={168 + i * 90}>
								{l("Outcome", "结果")}:{" "}
								{frozen === null
									? "?"
									: `${c.returnPercent > 0 ? "+" : ""}${c.returnPercent}%`}
							</SvgText>
						</g>
					))}
					<foreignObject x={25} y={310} width={310} height={54}>
						<button
							type="button"
							className="h-full w-full rounded-xl border text-sm"
							onClick={reveal}
							disabled={frozen !== null}
						>
							{frozen === null
								? l("Freeze rule and reveal outcomes", "固定规则并展示结果")
								: l(
										"First rule and outcome reveal recorded",
										"首个规则与结果展示已记录",
									)}
						</button>
					</foreignObject>
					<SvgText x={180} y={402}>
						{reused
							? l(
									"Development reuse; new holdout needed",
									"开发复用；需要新保留集",
								)
							: frozen === null
								? l("Outcomes remain sealed", "结果仍封存")
								: l("First frozen comparison recorded", "首个固定比较已记录")}
					</SvgText>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<RangeControl
				label={l("Toy decision threshold", "示例决策阈值")}
				value={threshold}
				display={String(threshold)}
				min={40}
				max={100}
				step={10}
				onChange={change}
			/>
			<p className="font-mono text-xs">
				{l("Development", "开发")}: {data.evaluation.developmentPeriod}
				<br />
				{l("Held out", "保留")}: {data.evaluation.heldoutPeriod}
				<br />
				{l("Outcome", "结果")}:{" "}
				{l("positive next-session return", "下一时段收益为正")}
			</p>
			<p data-pit-frozen>
				{l("First frozen threshold", "首次固定阈值")}: {number(frozen)}
			</p>
			<p data-pit-first>
				{l("First held-out matches", "首次保留匹配")}:{" "}
				{first === null ? "—" : `${first} / ${data.evaluation.heldout.length}`}
			</p>
			<p data-pit-current>
				{l("Current replay matches", "当前重放匹配")}:{" "}
				{current === null
					? "—"
					: `${current} / ${data.evaluation.heldout.length}`}
			</p>
			<p data-pit-holdout-status>
				{reused
					? l(
							"Tuned after viewing outcomes: development reuse, not a fresh held-out test",
							"看结果后调参：开发复用，不是新的保留检验",
						)
					: frozen === null
						? l(
								"Set the design before revealing outcomes",
								"展示结果前设置设计",
							)
						: l(
								"Original frozen result retained; no subsequent tuning yet",
								"保留原固定结果；尚未后续调参",
							)}
			</p>
			<Note>
				{frozen === null
					? l(
							"Use development observations to set the rule before opening held-out outcomes. The reveal action freezes the current threshold and records its first comparison. Do not select a threshold using results that belong to the test period.",
							"打开保留结果前，使用开发观测设置规则。展示操作会固定当前阈值并记录首次比较。不要用检验期结果选择阈值。",
						)
					: l(
							"The first result belongs to the frozen threshold. A better replay after outcome-informed tuning is development reuse. Returning to the original parameter cannot make seen outcomes untouched again; retain the first result and use a genuinely new test period.",
							"首次结果属于固定阈值。受结果影响调参后的更好重放属于开发复用。参数调回原值不能让已看结果重新未触碰；应保留首次结果，并使用真正的新检验期。",
						)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"These tiny synthetic counts demonstrate protocol, not predictive skill or tradable returns. Reset restores only this illustration; it cannot erase knowledge of a real holdout. Freeze population, features, metric and evaluation rules before opening a genuinely new test period.",
					"这些极小模拟计数演示协议，不证明预测能力或可交易收益。重置仅恢复此示例，不能抹去真实保留集知识。开启真正新检验期前，应固定人群、特征、指标与评价规则。",
				)}
			</p>
		</SceneLayout>
	);
}
