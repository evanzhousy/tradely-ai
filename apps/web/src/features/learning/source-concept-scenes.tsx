import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { FieldGroup } from "@tradely/ui/components/field";
import { RangeSlider } from "@tradely/ui/components/slider";
import * as m from "motion/react-m";
import { createContext, useContext, useState } from "react";
import {
	auditSource,
	observeSourceClock,
	type SourceConceptData,
} from "@/domain/learning/source-concept";
import type { Locale } from "@/i18n/messages";
import {
	Diagram,
	PlaybackButton,
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
import { useGuidedState } from "./visual-playback";

export const SourceData = createContext<SourceConceptData | null>(null);
function useSourceData() {
	const data = useContext(SourceData);
	if (!data) throw new Error("Source scenes require authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const copy = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const number = (value: number | null) =>
	value === null ? "—" : value.toLocaleString("en-US");
const time = (minute: number) =>
	`${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

export function SourceClocksScene({ locale }: Props) {
	const { clock } = useSourceData();
	const l = copy(locale);
	const motion = useLessonMotion();
	const playback = useFrames(clock.frames.length);
	const minute = clock.frames[playback.frame];
	const state = observeSourceClock(clock, minute);
	const x = (value: number) =>
		40 +
		((value - clock.frames[0]) /
			(clock.frames[clock.frames.length - 1] - clock.frames[0])) *
			280;
	const phase = state.received
		? l("Received", "已接收")
		: state.occurred
			? l("Occurred, not received", "已发生，未接收")
			: l("Not yet occurred", "尚未发生");
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Event, receipt and observation clocks",
						"事件、接收与观察时钟",
					)}
					height={505}
				>
					<SvgText x={180} y={24} muted>
						{clock.date} · ET
					</SvgText>
					<SvgText x={95} y={57} muted>
						{l("Event", "事件")} {time(clock.eventMinute)}
					</SvgText>
					<SvgText x={245} y={81} muted>
						{l("Receipt", "接收")} {time(clock.receiptMinute)}
					</SvgText>
					<path d="M40 105H320" className="contract-svg-line" />
					<path
						d={`M${x(clock.eventMinute)} 65V105M${x(clock.receiptMinute)} 86V105`}
						className="contract-svg-line"
						strokeDasharray="3 3"
					/>
					<m.circle
						initial={false}
						cx={x(minute)}
						cy="105"
						r="10"
						animate={{ cx: x(minute) }}
						transition={
							playback.playing && motion ? lessonTransition : instantTransition
						}
						className="contract-svg-handle"
					/>
					<foreignObject x="20" y="65" width="320" height="80">
						<RangeSlider
							type="range"
							className="contract-range contract-svg-range"
							aria-label={l("Source replay time", "来源回放时间")}
							aria-valuetext={`${time(minute)} ET`}
							min={0}
							max={clock.frames.length - 1}
							step={1}
							value={playback.frame}
							onPointerDown={() => playback.select(playback.frame)}
							onKeyDown={() => playback.select(playback.frame)}
							onChange={(e) => playback.select(Number(e.target.value))}
						/>
					</foreignObject>
					<SvgText x={180} y={159}>
						{l("Observed at", "观察时刻")} {time(minute)} ET
					</SvgText>
					<rect
						x="14"
						y="182"
						width="332"
						height="89"
						rx="12"
						className={
							state.received ? "contract-svg-wash" : "contract-svg-paper"
						}
					/>
					<SvgText x={180} y={206} muted>
						{l("One trade · session flow", "一笔成交 · 时段成交流")}
					</SvgText>
					<g data-source-phase>
						<SvgText x={180} y={234}>
							{phase}
						</SvgText>
					</g>
					<g data-source-visible>
						<SvgText x={180} y={259} strong>
							{state.visibleQuantity === null
								? "—"
								: `${state.visibleQuantity} ${l("contracts", "张")}`}
						</SvgText>
					</g>
					<rect
						x="14"
						y="292"
						width="332"
						height="87"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={317} muted>
						{l("Prior-cleared OI", "前期清算 OI")} · {clock.oi.asOf}
					</SvgText>
					<g data-source-oi>
						<SvgText x={180} y={346} strong>
							{number(clock.oi.value)} {l("contracts", "张")}
						</SvgText>
					</g>
					<SvgText x={180} y={369} muted>
						{l("Dated context remains available", "带日期上下文仍可用")}
					</SvgText>
					<rect
						x="14"
						y="400"
						width="332"
						height="85"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={425} muted>
						{l("Model snapshot as of", "模型快照截至")}
					</SvgText>
					<SvgText x={180} y={452}>
						{clock.model.asOf}
					</SvgText>
					<SvgText x={180} y={475} muted>
						{l("Available does not mean current", "可用不代表当前")}
					</SvgText>
				</Diagram>
			}
			controls={
				<>
					<SelectField
						label={l("Observation time", "观察时间")}
						value={String(playback.frame)}
						options={clock.frames.map((value, i) => [
							String(i),
							`${time(value)} ET`,
						])}
						onChange={(value) => playback.select(Number(value))}
					/>
					<PlaybackButton
						playing={playback.playing}
						onClick={playback.toggle}
						l={l}
					/>
				</>
			}
			details={
				<>
					<p className="font-mono text-muted-foreground text-xs leading-relaxed">
						{clock.contract}
						<br />
						{l(
							"Illustrative sources · independent clocks",
							"示例来源 · 独立时钟",
						)}
					</p>
					<Alert role="note">
						<AlertTitle>{phase}</AlertTitle>
						<AlertDescription>
							{state.received
								? l(
										`The trade is now available. Its event time is still ${time(clock.eventMinute)}; receipt at ${time(clock.receiptMinute)} does not move it into a later event window.`,
										`该成交现在可用。事件时间仍是 ${time(clock.eventMinute)}；${time(clock.receiptMinute)} 接收不把它移到更晚的事件窗口。`,
									)
								: l(
										"The replay shows the supplied event schedule, but the observer cannot use the trade before receipt. A blank available quantity is not observed zero volume.",
										"回放展示给定事件安排，但观察者在接收前不能使用该成交。可用数量空白不等于观测成交量为零。",
									)}
						</AlertDescription>
					</Alert>
					<div className="space-y-2 text-sm">
						<p>
							{l("OI received", "OI 接收")}: {clock.oi.receivedAt}
						</p>
						<p>
							{l("Model received", "模型接收")}: {clock.model.receivedAt}
						</p>
					</div>
					<p className="text-muted-foreground text-xs">
						{l(
							"This requirement permits current-session flow with explicitly dated prior OI. These sources are not contemporaneous, and the model's dated snapshot does not establish today's state. Times and delivery delays are illustrative, not a service latency promise.",
							"本例允许当前时段成交流与明确标注日期的前期 OI 并用。来源并非同时发生，带日期模型快照不能确定今日状态。时间与延迟仅作示例，不代表服务时效承诺。",
						)}
					</p>
				</>
			}
		/>
	);
}

export function SourceRequirementScene({ locale }: Props) {
	const { audit } = useSourceData();
	const l = copy(locale);
	const language = locale === "zh" ? 1 : 0;
	const [requirementId, setRequirement] = useGuidedState(
		audit.requirements[0].id,
		audit.requirements.map((item) => item.id),
	);
	const [recordId, setRecord] = useState(audit.records[0].id);
	const requirement =
		audit.requirements.find((r) => r.id === requirementId) ??
		audit.requirements[0];
	const record =
		audit.records.find((r) => r.id === recordId) ?? audit.records[0];
	const result = auditSource(record, requirement, audit.asOf);
	const value =
		record.measurement.state === "observed"
			? number(record.measurement.value)
			: record.measurement.state === "missing"
				? l("Missing", "缺失")
				: l("Not applicable", "不适用");
	const labels: Record<keyof typeof result.checks, string> = {
		identity: l("Identity", "身份"),
		session: l("Session date", "时段日期"),
		window: l("Event window", "事件窗口"),
		unit: l("Unit", "单位"),
		received: l("Received by observation", "观察时已接收"),
		value: l("Observed value", "观测数值"),
		coverage: l("Full required coverage", "所需范围完整覆盖"),
	};
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Compare the chosen source with a declared requirement",
						"将选定来源与声明要求比较",
					)}
					height={455}
				>
					<SvgText x={180} y={25} muted>
						{l("Required flow observation", "所需成交流观测")}
					</SvgText>
					<rect
						x="14"
						y="42"
						width="332"
						height="90"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={68}>
						{requirement.symbol} · {requirement.session}
					</SvgText>
					<SvgText x={180} y={95} muted>
						{requirement.window}
					</SvgText>
					<SvgText x={180} y={119} muted>
						{l("All", "全部")} {requirement.seriesCount}{" "}
						{l("series · contracts", "序列 · 张")}
					</SvgText>
					<path d="M180 132V159" className="contract-svg-line" />
					<rect
						x="14"
						y="159"
						width="332"
						height="137"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={186}>
						{record.symbol} · {record.session}
					</SvgText>
					<SvgText x={180} y={213} muted>
						{record.window}
					</SvgText>
					<g data-source-measurement>
						<SvgText x={180} y={245} strong>
							{value}
						</SvgText>
					</g>
					<SvgText x={180} y={278} muted>
						{record.unit === "contracts"
							? l("contracts", "张")
							: l("shares", "股")}
					</SvgText>
					<SvgText x={180} y={327} muted>
						{l("Reported coverage", "报告覆盖")}: {record.coverage.covered}/
						{record.coverage.expected}
					</SvgText>
					{Array.from({ length: requirement.seriesCount }, (_, i) => (
						<circle
							key={`coverage-${i}`}
							cx={150 + i * 30}
							cy="352"
							r="8"
							className={
								i < record.coverage.covered
									? "contract-svg-handle"
									: "contract-svg-dot"
							}
						/>
					))}
					<rect
						x="14"
						y="384"
						width="332"
						height="52"
						rx="12"
						className={
							result.accepted ? "contract-svg-wash" : "contract-svg-paper"
						}
					/>
					<g data-source-verdict>
						<SvgText x={180} y={416}>
							{result.accepted
								? l("Meets this requirement", "满足此要求")
								: l("Does not meet this requirement", "不满足此要求")}
						</SvgText>
					</g>
				</Diagram>
			}
			controls={
				<FieldGroup>
					<SelectField
						label={l("Requested session", "请求时段")}
						value={requirementId}
						options={audit.requirements.map((r) => [r.id, r.label[language]])}
						onChange={setRequirement}
					/>
					<SelectField
						label={l("Source snapshot", "来源快照")}
						value={recordId}
						options={audit.records.map((r) => [r.id, r.label[language]])}
						onChange={setRecord}
					/>
				</FieldGroup>
			}
			details={
				<>
					<p className="text-muted-foreground text-xs">
						{l("Viewing at", "查看时刻")}{" "}
						{audit.asOf.replace("T", " ").replace("-04:00", " ET")}.{" "}
						{l(
							"Alternative source snapshots, not simultaneous reports.",
							"以下为备选来源快照，并非同时发生的报告。",
						)}
					</p>
					<p className="break-words font-mono text-muted-foreground text-xs">
						{record.source}
						<br />
						{l("Received", "接收")}:{" "}
						{record.receivedAt.replace("T", " ").replace("-04:00", " ET")}
					</p>
					<ul
						className="grid grid-cols-2 gap-3 text-sm"
						aria-label={l("Requirement checks", "要求检查")}
					>
						{Object.entries(result.checks).map(([key, passed]) => (
							<li key={key} data-source-check={key}>
								{passed ? "✓" : "×"} {labels[key as keyof typeof labels]}
								<span className="sr-only">
									{" "}
									·{" "}
									{passed
										? l("matches", "匹配")
										: l("does not match", "不匹配")}
								</span>
							</li>
						))}
					</ul>
					<Alert role="note">
						<AlertTitle>
							{result.accepted
								? l("Valid for this stated question", "对此声明问题有效")
								: l(
										"Repair only the affected requirement",
										"仅修复受影响的要求",
									)}
						</AlertTitle>
						<AlertDescription>
							{l(
								"A newer receipt cannot repair the wrong symbol, session, unit or incomplete universe. Zero is an observed number; missing and not applicable have different meanings and neither can be summed as zero. A partial count can describe its stated subset, but cannot satisfy this full-universe question.",
								"更新的接收时间不能修复错误标的、时段、单位或不完整范围。零是观测数值；缺失与不适用含义不同，均不能当零求和。部分计数可描述已声明子集，但不满足本例完整范围问题。",
							)}
						</AlertDescription>
					</Alert>
					<p className="text-muted-foreground text-xs">
						{l(
							"The selected historical date stays selected even when a newer completed session exists. This is a retrospective source audit at the displayed viewing time, not a claim that later receipts were available historically.",
							"即使存在更新已完成时段，选定历史日期也不会改变。这是在所示查看时刻进行的回顾来源审计，不声称之后接收的数据在历史当时已可用。",
						)}
					</p>
				</>
			}
		/>
	);
}
