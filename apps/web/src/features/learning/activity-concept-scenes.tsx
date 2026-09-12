import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { FieldGroup } from "@tradely/ui/components/field";
import * as m from "motion/react-m";
import { createContext, useContext, useState } from "react";
import {
	type ActivityConceptData,
	type ActivityMetric,
	activityDenominator,
	activityRatio,
	compareActivityWindow,
	summarizeActivity,
} from "@/domain/learning/activity-concept";
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
export const ActivityData = createContext<ActivityConceptData | null>(null);
function useActivityData() {
	const data = useContext(ActivityData);
	if (!data)
		throw new Error("Activity scenes require authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const text = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const number = (v: number | null) =>
	v === null ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: 4 });
const multiple = (v: number | null) => (v === null ? "—" : `${number(v)}×`);
function MetricField({
	locale,
	metric,
	onChange,
}: Props & {
	metric: ActivityMetric;
	onChange: (value: ActivityMetric) => void;
}) {
	const l = text(locale);
	return (
		<ChoiceField
			label={l("Ratio definition", "比率定义")}
			value={metric}
			options={[
				["relative", l("Relative volume", "相对成交量")],
				["turnover", l("Volume / OI", "成交量 / OI")],
			]}
			onChange={onChange}
		/>
	);
}

export function DenominatorScene({ locale }: Props) {
	const data = useActivityData();
	const l = text(locale);
	const [id, setId] = useState(data.samples[0].id);
	const [metric, setMetric] = useState<ActivityMetric>("relative");
	const [custom, setCustom] = useState<number | null>(null);
	const [available, setAvailable] = useState("known");
	const sample = data.samples.find((s) => s.id === id) ?? data.samples[0];
	const value = custom ?? activityDenominator(sample, metric);
	const denominator = available === "known" ? value : null;
	const ratio = activityRatio(sample.volume, denominator);
	const change = (v: number) => setCustom(v);
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"A fixed volume divided by a changing denominator",
						"固定成交量除以变化分母",
					)}
					height={430}
				>
					<rect
						x="30"
						y="15"
						width="300"
						height="74"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={42} muted>
						{l("Session volume · unchanged", "时段成交量 · 不变")}
					</SvgText>
					<g data-activity-volume>
						<SvgText x={180} y={74} strong>
							{number(sample.volume)}
						</SvgText>
					</g>
					<SvgText x={180} y={112}>
						÷
					</SvgText>
					<rect
						x="30"
						y="131"
						width="300"
						height="74"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={156} muted>
						{metric === "relative"
							? l("Typical session volume", "典型时段成交量")
							: l("Reported OI", "已报告 OI")}
					</SvgText>
					<SvgText x={180} y={187} strong>
						{number(denominator)}
					</SvgText>
					{denominator !== null ? (
						<>
							<path d="M40 250H320" className="contract-svg-line" />
							<circle
								cx={40 + (denominator / data.denominatorMax) * 280}
								cy="250"
								r="10"
								className="contract-svg-handle"
							/>
							<foreignObject x="20" y="210" width="320" height="80">
								<input
									type="range"
									className="contract-range contract-svg-range"
									aria-label={l("Drag the denominator", "拖动分母")}
									aria-valuetext={number(denominator)}
									min={0}
									max={data.denominatorMax}
									step={1}
									value={denominator}
									onChange={(e) => change(Number(e.target.value))}
								/>
							</foreignObject>
							<SvgText x={40} y={298} muted>
								0
							</SvgText>
							<SvgText x={304} y={298} muted>
								{number(data.denominatorMax)}
							</SvgText>
						</>
					) : (
						<SvgText x={180} y={270} muted>
							{l("Denominator not supplied", "未提供分母")}
						</SvgText>
					)}
					<rect
						x="14"
						y="327"
						width="332"
						height="78"
						rx="12"
						className={
							ratio === null ? "contract-svg-paper" : "contract-svg-wash"
						}
					/>
					<SvgText x={180} y={352} muted>
						{l("Ratio · times", "比率 · 倍")}
					</SvgText>
					<g data-activity-ratio>
						<SvgText x={180} y={387} strong>
							{ratio === null ? l("Unavailable", "不可确定") : multiple(ratio)}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<p className="font-mono text-muted-foreground text-xs">
				{sample.contract}
				<br />
				{data.date} · {l("Fictional record", "虚构记录")}
			</p>
			<FieldGroup>
				<SelectField
					label={l("Compare a record", "比较记录")}
					value={id}
					options={data.samples.map((s) => [
						s.id,
						`${s.id} · ${number(s.volume)} ${l("contracts", "张")}`,
					])}
					onChange={(value) => {
						setId(value);
						setCustom(null);
						setAvailable("known");
					}}
				/>
				<MetricField
					locale={locale}
					metric={metric}
					onChange={(value) => {
						setMetric(value);
						setCustom(null);
						setAvailable("known");
					}}
				/>
				<ChoiceField
					label={l("Denominator evidence", "分母证据")}
					value={available}
					options={[
						["known", l("Supplied", "已提供")],
						["missing", l("Missing", "缺失")],
					]}
					onChange={setAvailable}
				/>
				{denominator !== null ? (
					<RangeControl
						label={l("What-if denominator", "假设分母")}
						value={denominator}
						display={number(denominator)}
						min={0}
						max={data.denominatorMax}
						onChange={change}
					/>
				) : null}
			</FieldGroup>
			<Alert role="note">
				<AlertTitle>
					{ratio === null
						? l("Unavailable is not zero or infinity", "不可确定不是零或无穷")
						: l("The denominator changes the question", "分母改变所回答的问题")}
				</AlertTitle>
				<AlertDescription>
					{metric === "relative"
						? l(
								"Relative volume compares activity with its historical typical volume. A smaller baseline raises the ratio without adding any current trades.",
								"相对成交量比较当前活动与历史典型量。基准变小可使比率变高，而当前成交并未增加。",
							)
						: l(
								"Volume/OI compares executed activity with outstanding contracts. A tiny OI value can produce a high ratio even for a small print count; it is not an opening-position flag.",
								"成交量/OI 比较已成交活动与存续合约。很小的 OI 可让少量成交也产生高比率；它不是开仓标记。",
							)}
				</AlertDescription>
			</Alert>
			<p className="text-muted-foreground text-xs">
				{metric === "relative"
					? data.benchmark[locale === "zh" ? 1 : 0]
					: `${l("OI as of", "OI 截至")} ${data.oiAsOf}`}
				<br />
				{l(
					"Sliders explore hypothetical denominators. Missing or non-positive values cannot support a ratio.",
					"滑块用于探索假设分母。缺失或非正分母不能支持比率。",
				)}
			</p>
		</SceneLayout>
	);
}

export function WindowComparisonScene({ locale }: Props) {
	const data = useActivityData();
	const l = text(locale);
	const language = locale === "zh" ? 1 : 0;
	const motion = useLessonMotion();
	const playback = useFrames(data.windows.length);
	const item = data.windows[playback.frame];
	const result = compareActivityWindow(item);
	const width = (window: "hour" | "session") =>
		(280 * data.windowMinutes[window]) / data.windowMinutes.session;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Compare current and historical observation windows",
						"比较当前与历史观测窗口",
					)}
					height={424}
				>
					<SvgText x={180} y={28} muted>
						{l("Current observation", "当前观测")}
					</SvgText>
					<SvgText x={180} y={61}>
						{data.windowLabels[item.currentWindow][language]}
					</SvgText>
					<rect
						x="40"
						y="80"
						width="280"
						height="18"
						rx="8"
						className="contract-svg-paper"
					/>
					<rect
						x="40"
						y="80"
						width={width(item.currentWindow)}
						height="18"
						rx="8"
						className="contract-svg-wash"
					/>
					<SvgText x={180} y={131} strong>
						{number(item.volume)} {l("contracts", "张")}
					</SvgText>
					<SvgText x={180} y={177} muted>
						{l("Historical comparison window", "历史比较窗口")}
					</SvgText>
					<SvgText x={180} y={208}>
						{data.windowLabels[item.baselineWindow][language]}
					</SvgText>
					<rect
						x="40"
						y="225"
						width="280"
						height="18"
						rx="8"
						className="contract-svg-paper"
					/>
					<rect
						x="40"
						y="225"
						width={width(item.baselineWindow)}
						height="18"
						rx="8"
						className="contract-svg-wash"
					/>
					<SvgText x={180} y={277} strong>
						{number(item.baseline)} {l("typical contracts", "张典型成交")}
					</SvgText>
					{result.ratio !== null ? (
						<m.path
							key={item.id}
							d="M180 291v27"
							className="contract-svg-active-line"
							initial={{ pathLength: motion ? 0 : 1 }}
							animate={{ pathLength: 1 }}
							transition={motion ? lessonTransition : instantTransition}
						/>
					) : null}
					<rect
						x="14"
						y="318"
						width="332"
						height="83"
						rx="12"
						className={
							result.ratio === null ? "contract-svg-paper" : "contract-svg-wash"
						}
					/>
					<SvgText x={180} y={345} muted>
						{l("Comparable relative volume", "可比相对成交量")}
					</SvgText>
					<g data-window-ratio>
						<SvgText x={180} y={380} strong>
							{result.ratio === null
								? l("Unavailable", "不可确定")
								: multiple(result.ratio)}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<p className="font-mono text-muted-foreground text-xs">
				{data.date}
				<br />
				{data.benchmark[language]}
			</p>
			<SelectField
				label={l("Window evidence", "窗口证据")}
				value={String(playback.frame)}
				options={data.windows.map((w, i) => [String(i), w.label[language]])}
				onChange={(value) => playback.select(Number(value))}
			/>
			<PlaybackButton
				playing={playback.playing}
				onClick={playback.toggle}
				l={l}
			/>
			<p className="text-muted-foreground text-xs">
				{l("Current scope", "当前范围")}: {item.currentScope}
				<br />
				{l("Benchmark scope", "基准范围")}: {item.baselineScope}
			</p>
			<Alert role="status">
				<AlertTitle>
					{result.issue === null
						? l("A matched comparison", "可比的匹配比较")
						: result.issue === "window"
							? l("Different observation windows", "观测窗口不同")
							: result.issue === "coverage"
								? l("Incomplete coverage", "覆盖不完整")
								: result.issue === "scope"
									? l("Different populations", "比较人群不同")
									: l("Missing usable baseline", "缺少可用基准")}
				</AlertTitle>
				<AlertDescription>
					{result.ratio !== null
						? l(
								"Both counts cover the same defined portion of comparable sessions and the same contract. The ratio describes this comparison; it does not prove informed trading.",
								"两项数量覆盖可比时段中的相同部分与相同合约。比率描述该比较，不证明知情交易。",
							)
						: l(
								"Do not compare a partial day with a full-day benchmark, substitute another contract's baseline, or treat missing coverage as zero. Obtain a comparable source window first.",
								"不要把部分交易日与全天基准比较，不要替换成另一合约基准，也不要把缺失覆盖当作零。应先获得可比来源窗口。",
							)}
				</AlertDescription>
			</Alert>
		</SceneLayout>
	);
}

export function ScreeningScene({ locale }: Props) {
	const data = useActivityData();
	const l = text(locale);
	const [metric, setMetric] = useState<ActivityMetric>("relative");
	const [threshold, setThreshold] = useState(data.threshold.initial);
	const [scope, setScope] = useState("all");
	const summary = summarizeActivity(
		data.samples,
		metric,
		threshold,
		scope === "screened",
	);
	const scale = Math.max(
		data.threshold.max,
		...summary.rows.map((row) => row.ratio ?? 0),
	);
	const x = (value: number) => 40 + (value / scale) * 280;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"A declared screen selects rows before ratio summaries are compared",
						"声明筛选选择记录，再比较比率汇总",
					)}
					height={462}
				>
					<SvgText x={180} y={26} muted>
						{metric === "relative"
							? l("Volume / typical volume", "成交量 / 典型量")
							: l("Volume / reported OI", "成交量 / 报告 OI")}
					</SvgText>
					{summary.rows.map((row, i) => {
						const y = 45 + i * 119;
						return (
							<g
								key={row.sample.id}
								data-screen-row={row.sample.id}
								data-screen-included={row.included}
							>
								<rect
									x="14"
									y={y}
									width="332"
									height="104"
									rx="12"
									className={
										row.passes ? "contract-svg-wash" : "contract-svg-paper"
									}
								/>
								<SvgText x={120} y={y + 27}>
									{row.sample.id} · {number(row.sample.volume)} /{" "}
									{number(activityDenominator(row.sample, metric))}
								</SvgText>
								<SvgText x={270} y={y + 27} strong>
									{multiple(row.ratio)}
								</SvgText>
								<path d={`M40 ${y + 58}H320`} className="contract-svg-line" />
								{row.ratio === null ? null : (
									<path
										d={`M40 ${y + 58}H${x(row.ratio)}`}
										className="contract-svg-active-line"
									/>
								)}
								<path
									d={`M${x(threshold)} ${y + 47}v22`}
									className="contract-svg-active-line"
								/>
								<SvgText x={180} y={y + 91} muted>
									{row.passes === null
										? l("Ratio unavailable", "比率不可用")
										: row.passes
											? l("Passes declared screen", "通过声明筛选")
											: l("Below declared threshold", "低于声明阈值")}
								</SvgText>
							</g>
						);
					})}
					<SvgText x={180} y={302} muted>
						{l("Gold tick: at least", "金色刻度：至少")} {multiple(threshold)}
					</SvgText>
					<SvgText x={180} y={330} muted>
						{l(
							"Same population, different summaries",
							"相同人群，不同汇总方式",
						)}
					</SvgText>
					<rect
						x="14"
						y="350"
						width="150"
						height="73"
						rx="12"
						className="contract-svg-paper"
					/>
					<rect
						x="196"
						y="350"
						width="150"
						height="73"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={89} y={376} muted>
						{l("Equal-row mean", "行等权均值")}
					</SvgText>
					<SvgText x={271} y={376} muted>
						{l("Pooled ratio", "汇总比率")}
					</SvgText>
					<g data-screen-mean>
						<SvgText x={89} y={409} strong>
							{multiple(summary.mean)}
						</SvgText>
					</g>
					<g data-screen-pooled>
						<SvgText x={271} y={409} strong>
							{multiple(summary.pooled)}
						</SvgText>
					</g>
					<SvgText x={180} y={451} muted>
						{summary.selectedCount} / {data.samples.length}{" "}
						{l("rows in the summary", "行纳入汇总")}
					</SvgText>
				</Diagram>
			}
		>
			<p className="font-mono text-muted-foreground text-xs">
				{data.date} · {l("Two-contract population", "双合约人群")}
				<br />
				{data.samples.map((s) => `${s.id}: ${s.contract}`).join("\n")}
			</p>
			<FieldGroup>
				<MetricField locale={locale} metric={metric} onChange={setMetric} />
				<RangeControl
					label={l("Declared screening threshold", "声明筛选阈值")}
					value={threshold}
					display={multiple(threshold)}
					min={data.threshold.min}
					max={data.threshold.max}
					step={data.threshold.step}
					onChange={setThreshold}
				/>
				<ChoiceField
					label={l("Summary population", "汇总人群")}
					value={scope}
					options={[
						["all", l("All rows", "全部记录")],
						["screened", l("Screened only", "仅筛选结果")],
					]}
					onChange={setScope}
				/>
			</FieldGroup>
			<Alert role="note">
				<AlertTitle>
					{l("Declare the weighting and selection", "明确权重与选择规则")}
				</AlertTitle>
				<AlertDescription>
					{l(
						"The row mean weights each ratio equally. The pooled ratio divides summed volumes by summed denominators. They answer different questions; filtering changes the population again. A threshold is a declared screen, not evidence of informed trading.",
						"行均值对每个比率等权；汇总比率用总成交量除以总分母。两者回答不同问题，筛选又改变了人群。阈值是声明的筛选规则，不是知情交易证据。",
					)}
				</AlertDescription>
			</Alert>
			<p className="text-muted-foreground text-xs">
				{l(
					"This is a stated population-level ratio comparison, not a merged same-contract tape row. Missing ratios cannot pass the screen; an empty or incomplete selected population has no summary ratio. Review liquidity, coverage and event context next.",
					"这是声明的人群比率比较，不是合并为同合约成交行。缺失比率不能通过筛选；选定人群为空或不完整时，汇总比率不可得。还应检查流动性、覆盖和事件背景。",
				)}
			</p>
		</SceneLayout>
	);
}
