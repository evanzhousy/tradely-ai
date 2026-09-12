import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import * as m from "motion/react-m";
import { createContext, useContext, useState } from "react";
import {
	type IvObservation,
	type IvRankConceptData,
	inspectIvHistory,
	ivRankStatistics,
} from "@/domain/learning/iv-rank-concept";
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

export const IvRankData = createContext<IvRankConceptData | null>(null);
function useData() {
	const data = useContext(IvRankData);
	if (!data) throw new Error("IV rank scenes require authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const copy = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const number = (value: number | null) =>
	value === null
		? "—"
		: (Math.abs(value) < 1e-9 ? 0 : value).toLocaleString("en-US", {
				maximumFractionDigits: 2,
			});
const pct = (value: number | null) =>
	value === null ? "—" : `${number(value)}%`;
function ExperimentContext({ locale }: Props) {
	const { experiment } = useData();
	return (
		<p className="font-mono text-muted-foreground text-xs leading-relaxed">
			{experiment.symbol} · {experiment.reference}
			<br />
			{copy(locale)("Current date", "当前日期")}: {experiment.currentDate}
			<br />
			{experiment.observations[0].date} →{" "}
			{experiment.observations[experiment.observations.length - 1].date}
			<br />
			{copy(locale)(
				"Synthetic supplied history · current is separate",
				"模拟给定历史 · 当前观测单列",
			)}
		</p>
	);
}
function HistoryBoxes({
	observations,
	current,
	locale,
	top,
}: Props & {
	observations: readonly IvObservation[];
	current: number | null;
	top: number;
}) {
	const l = copy(locale);
	return (
		<>
			{observations.map((o, i) => {
				const x = 40 + (i / Math.max(1, observations.length - 1)) * 280;
				const below = current !== null && o.iv !== null && o.iv < current;
				const tie = current !== null && o.iv !== null && o.iv === current;
				const label =
					current === null || o.iv === null
						? "—"
						: below
							? l("below", "低于")
							: tie
								? l("tie", "相等")
								: l("above", "高于");
				return (
					<g key={o.date}>
						<rect
							x={x - 27}
							y={top}
							width="54"
							height="76"
							rx="9"
							className={below ? "contract-svg-wash" : "contract-svg-paper"}
							strokeDasharray={tie || o.iv === null ? "3 3" : undefined}
						/>
						<SvgText x={x} y={top + 24}>
							{pct(o.iv)}
						</SvgText>
						<SvgText x={x} y={top + 47} muted>
							{label}
						</SvgText>
						<SvgText x={x} y={top + 68} muted>
							{o.date.slice(5)}
						</SvgText>
					</g>
				);
			})}
		</>
	);
}

export function RankFrequencyScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [current, setCurrent] = useState(data.experiment.current);
	const stats = ivRankStatistics(
		data.experiment.observations.map((o) => o.iv),
		current,
	);
	if (!stats)
		return (
			<p role="status">
				{l("Supplied values are unavailable", "给定数值不可用")}
			</p>
		);
	const x = stats.rank === null ? null : 40 + (stats.rank / 100) * 280;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Range position versus strictly-below frequency",
						"区间位置与严格低于频率",
					)}
					height={455}
				>
					<SvgText x={180} y={25} muted>
						{l("IV rank · historical range position", "IV Rank · 历史区间位置")}
					</SvgText>
					<SvgText x={50} y={72} muted>
						{pct(stats.minimum)}
					</SvgText>
					<SvgText x={310} y={72} muted>
						{pct(stats.maximum)}
					</SvgText>
					<rect
						x="40"
						y="95"
						width="280"
						height="20"
						rx="10"
						className="contract-svg-wash"
					/>
					<path d="M40 105H320" className="contract-svg-line" />
					{x !== null ? (
						<circle cx={x} cy="105" r="9" className="contract-svg-handle" />
					) : null}
					<foreignObject x="20" y="65" width="320" height="80">
						<input
							type="range"
							className="contract-range contract-svg-range"
							aria-label={l("Drag current IV", "拖动当前 IV")}
							aria-valuetext={pct(current)}
							min={stats.minimum}
							max={stats.maximum}
							step={1}
							value={current}
							disabled={stats.minimum === stats.maximum}
							onChange={(e) => setCurrent(Number(e.target.value))}
						/>
					</foreignObject>
					<SvgText x={180} y={159}>
						{l("Current IV", "当前 IV")}: {pct(current)}
					</SvgText>
					<g data-ivr-rank>
						<SvgText x={180} y={197} strong>
							{pct(stats.rank)}
						</SvgText>
					</g>
					<SvgText x={180} y={239} muted>
						{l("One box per historical observation", "每格一个历史观测")}
					</SvgText>
					<HistoryBoxes
						observations={data.experiment.observations}
						current={current}
						locale={locale}
						top={257}
					/>
					<SvgText x={180} y={365} muted>
						{stats.below} / {stats.count}{" "}
						{l("strictly below · ties", "严格较低 · 相等")} {stats.equal}
					</SvgText>
					<g data-ivr-percentile>
						<SvgText x={180} y={403} strong>
							{pct(stats.percentile)}
						</SvgText>
					</g>
					<SvgText x={180} y={438} muted>
						{l("Ties stay in the denominator", "相等值仍保留于分母")}
					</SvgText>
				</Diagram>
			}
		>
			<ExperimentContext locale={locale} />
			<RangeControl
				label={l("Hypothetical current IV", "假设当前 IV")}
				value={current}
				display={pct(current)}
				min={data.currentRange[0]}
				max={data.currentRange[1]}
				step={1}
				onChange={setCurrent}
			/>
			<div className="space-y-3 text-sm">
				<p>
					{l("Rank", "Rank")}: ({current} − {stats.minimum}) / ({stats.maximum}{" "}
					− {stats.minimum}) × 100
				</p>
				<p>
					{l("Strictly-below percentile", "严格低于百分位")}: {stats.below} /{" "}
					{stats.count} × 100
				</p>
				<p data-ivr-counts>
					{l("Below / equal / above", "低于 / 相等 / 高于")}: {stats.below} /{" "}
					{stats.equal} / {stats.above}
				</p>
			</div>
			<Alert role="note">
				<AlertTitle>
					{l(
						"Location and frequency answer different questions",
						"位置与频率回答不同问题",
					)}
				</AlertTitle>
				<AlertDescription>
					{l(
						"Rank measures distance within the supplied low-to-high range. Percentile counts observations strictly below the current value. Equal values are not below, but remain in the denominator. Moving the current IV changes rank continuously; the strictly-below count changes at historical IV thresholds.",
						"Rank 衡量当前值在给定最低到最高区间内的位置；百分位统计严格低于当前值的观测。相等值不算较低，但仍保留于分母。移动当前 IV 时，Rank 连续改变，严格低于计数则在历史 IV 阈值处改变。",
					)}
				</AlertDescription>
			</Alert>
			<p className="text-muted-foreground text-xs">
				{l(
					"This is a small supplied sample, not a one-year history. The current observation is not appended to the historical denominator. Neither measure predicts direction or profit.",
					"这是给定小样本，不是一年历史。当前观测不会追加进历史分母。两项指标都不预测方向或利润。",
				)}
			</p>
		</SceneLayout>
	);
}

export function RankOutlierScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const motion = useLessonMotion();
	const replay = useFrames(data.outlierFrames.length);
	const [manual, setManual] = useState<number | null>(null);
	const high = manual ?? data.outlierFrames[replay.frame];
	const observations = data.experiment.observations.map((o, i) =>
		i === data.experiment.observations.length - 1 ? { ...o, iv: high } : o,
	);
	const stats = ivRankStatistics(
		observations.map((o) => o.iv),
		data.experiment.current,
	);
	const choose = (value: number) => {
		replay.select(replay.frame);
		setManual(value);
	};
	if (!stats)
		return (
			<p role="status">
				{l("Supplied values are unavailable", "给定数值不可用")}
			</p>
		);
	const rankX = stats.rank === null ? null : 40 + (stats.rank / 100) * 280;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"One outlier changes the range without changing the count",
						"一个极端值改变区间而不改变计数",
					)}
					height={480}
				>
					<SvgText x={180} y={25}>
						{l("Current fixed at", "当前固定为")} {pct(data.experiment.current)}
					</SvgText>
					<SvgText x={50} y={72} muted>
						{pct(stats.minimum)}
					</SvgText>
					<SvgText x={310} y={72} muted>
						{pct(stats.maximum)}
					</SvgText>
					<rect
						x="40"
						y="95"
						width="280"
						height="20"
						rx="10"
						className="contract-svg-wash"
					/>
					<path d="M40 105H320" className="contract-svg-line" />
					{rankX !== null ? (
						<m.circle
							initial={false}
							cx={rankX}
							cy="105"
							r="9"
							animate={{ cx: rankX }}
							transition={
								replay.playing && motion ? lessonTransition : instantTransition
							}
							className="contract-svg-handle"
						/>
					) : null}
					<g data-ivr-outlier-rank>
						<SvgText x={180} y={163} strong>
							{pct(stats.rank)}
						</SvgText>
					</g>
					<SvgText x={180} y={195} muted>
						{l("Rank · endpoints define the scale", "Rank · 端点定义比例")}
					</SvgText>
					<HistoryBoxes
						observations={observations}
						current={data.experiment.current}
						locale={locale}
						top={222}
					/>
					<SvgText x={180} y={330} muted>
						{stats.below} / {stats.count} {l("strictly below", "严格较低")}
					</SvgText>
					<g data-ivr-outlier-percentile>
						<SvgText x={180} y={368} strong>
							{pct(stats.percentile)}
						</SvgText>
					</g>
					<path d="M40 419H320" className="contract-svg-line" />
					<circle
						cx={
							40 +
							((high - data.outlierRange[0]) /
								(data.outlierRange[1] - data.outlierRange[0])) *
								280
						}
						cy="419"
						r="9"
						className="contract-svg-handle"
					/>
					<foreignObject x="20" y="379" width="320" height="80">
						<input
							type="range"
							className="contract-range contract-svg-range"
							aria-label={l("Drag historical high", "拖动历史高值")}
							aria-valuetext={pct(high)}
							min={data.outlierRange[0]}
							max={data.outlierRange[1]}
							step={1}
							value={high}
							onPointerDown={() => choose(high)}
							onKeyDown={() => choose(high)}
							onChange={(e) => choose(Number(e.target.value))}
						/>
					</foreignObject>
					<SvgText x={180} y={474}>
						{l("Hypothetical high", "假设高值")}: {pct(high)}
					</SvgText>
				</Diagram>
			}
		>
			<ExperimentContext locale={locale} />
			<RangeControl
				label={l("Highest historical observation", "历史最高观测")}
				value={high}
				display={pct(high)}
				min={data.outlierRange[0]}
				max={data.outlierRange[1]}
				step={1}
				onChange={choose}
			/>
			<PlaybackButton
				playing={replay.playing}
				onClick={() => {
					setManual(null);
					replay.toggle();
				}}
				l={l}
			/>
			<p className="text-sm">
				{l(
					"Only the highest observation changes; current IV and the other observations stay fixed.",
					"仅最高观测改变；当前 IV 与其他观测保持不变。",
				)}
			</p>
			<Alert role="note">
				<AlertTitle>
					{l(
						"A wider range can lower rank without moving the count",
						"区间变宽可降低 Rank，却不改变计数",
					)}
				</AlertTitle>
				<AlertDescription>
					{l(
						"The edited high remains above the current value, so below/tie/above membership does not change. Its magnitude changes the range denominator and therefore rank. The normalized range track changes endpoints; it is not a common absolute-IV axis. Playback visits hypothetical replacements, not an observed market sequence.",
						"修改后的高值仍高于当前值，因此低于、相等、高于的成员关系不变。其大小改变区间分母，进而改变 Rank。归一化区间轨道的端点会变化，并非共同绝对 IV 坐标轴。回放展示假设替换值，不是观测市场序列。",
					)}
				</AlertDescription>
			</Alert>
		</SceneLayout>
	);
}

export function RankCoverageScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [id, setId] = useState(data.samples[0].id);
	const sample = data.samples.find((s) => s.id === id) ?? data.samples[0];
	const result = inspectIvHistory(sample);
	const stats = result.statistics;
	const issues = {
		reference: l(
			"Underlying or IV reference does not match",
			"标的或 IV 参考不匹配",
		),
		window: l(
			"The declared earlier window is not satisfied",
			"不满足声明的先前窗口",
		),
		coverage: l(
			"Required unique observation coverage is not established",
			"所需独立观测覆盖未确定",
		),
		values: l(
			"Current IV or a required history value is missing or invalid",
			"当前 IV 或所需历史值缺失或无效",
		),
	};
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Audit the declared sample before publishing a percentage",
						"发布百分比前审计声明样本",
					)}
					height={430}
				>
					<SvgText x={180} y={25}>
						{l("Current IV", "当前 IV")}: {pct(sample.current.iv)}
					</SvgText>
					<HistoryBoxes
						observations={sample.history.observations}
						current={stats ? sample.current.iv : null}
						locale={locale}
						top={60}
					/>
					<SvgText x={180} y={171} muted>
						{result.knownCount} / {sample.history.expectedCount ?? "?"}{" "}
						{l("required values supplied", "所需值已提供")}
					</SvgText>
					<rect
						x="14"
						y="199"
						width="332"
						height="78"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={224} muted>
						{l("IV rank", "IV Rank")}
					</SvgText>
					<g data-ivr-sample-rank>
						<SvgText x={180} y={259} strong>
							{pct(stats?.rank ?? null)}
						</SvgText>
					</g>
					<rect
						x="14"
						y="298"
						width="332"
						height="78"
						rx="12"
						className="contract-svg-wash"
					/>
					<SvgText x={180} y={323} muted>
						{l("Strictly-below percentile", "严格低于百分位")}
					</SvgText>
					<g data-ivr-sample-percentile>
						<SvgText x={180} y={358} strong>
							{pct(stats?.percentile ?? null)}
						</SvgText>
					</g>
					<SvgText x={180} y={413} muted>
						{l("Only the declared sample is assessed", "仅评估声明样本")}
					</SvgText>
				</Diagram>
			}
		>
			<SelectField
				label={l("History sample", "历史样本")}
				value={id}
				options={data.samples.map((s) => [
					s.id,
					s.label[locale === "zh" ? 1 : 0],
				])}
				onChange={setId}
			/>
			<div className="space-y-3 break-words font-mono text-muted-foreground text-xs">
				<p>
					{l("Current", "当前")}: {sample.current.symbol} ·{" "}
					{sample.current.reference}
					<br />
					{sample.current.date} · {pct(sample.current.iv)}
				</p>
				<p>
					{l("History", "历史")}: {sample.history.symbol} ·{" "}
					{sample.history.reference}
					<br />
					{sample.history.start} → {sample.history.end}
				</p>
			</div>
			<p data-ivr-sample-status className="text-sm">
				{result.issue
					? issues[result.issue]
					: stats?.minimum === stats?.maximum
						? l(
								"Zero historical range: rank undefined; percentile remains defined",
								"历史区间为零：Rank 无定义，百分位仍有定义",
							)
						: l(
								"Statistics for this complete declared sample",
								"此完整声明样本的统计量",
							)}
			</p>
			<Alert role="note">
				<AlertTitle>
					{l(
						"Check the reference, window and denominator",
						"检查参考、窗口与分母",
					)}
				</AlertTitle>
				<AlertDescription>
					{l(
						"The current and historical IV reference must match. This lab uses distinct historical dates before the current date and a declared required count. Missing values are neither dropped nor filled with zero. A zero high-to-low range blocks rank, but does not prevent counting below the current value. Ties remain in the denominator.",
						"当前与历史 IV 参考必须匹配。本课堂使用当前日期之前的独立历史日期，并声明所需数量。缺失值既不删除，也不填零。最高到最低区间为零时 Rank 无定义，但仍可统计低于当前值的数量。相等值保留于分母。",
					)}
				</AlertDescription>
			</Alert>
			<p className="text-muted-foreground text-xs">
				{l(
					"Changing the window changes the sample. These short supplied examples are not one-year estimates. Provider inclusion and tie conventions can differ and must be stated; neither a high rank nor a high percentile guarantees direction or profit.",
					"改变窗口就改变样本。这些给定短样本不是一年估计。供应商的纳入及相等值约定可能不同，必须说明；高 Rank 或高百分位都不保证方向或利润。",
				)}
			</p>
		</SceneLayout>
	);
}
