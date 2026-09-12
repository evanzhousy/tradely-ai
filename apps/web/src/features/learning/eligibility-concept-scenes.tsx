import * as m from "motion/react-m";
import { createContext, type ReactNode, useContext, useState } from "react";
import {
	activityRatio,
	type CandidateDecision,
	type EligibilityConceptData,
	summarizeEligibility,
} from "@/domain/learning/eligibility-concept";
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
export const EligibilityData = createContext<EligibilityConceptData | null>(
	null,
);
function useData() {
	const data = useContext(EligibilityData);
	if (!data)
		throw new Error("Eligibility scenes require authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const copy = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const number = (v: number | null) =>
	v === null ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: 2 });
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
			{copy(locale)("Observation session", "观测时段")}: {data.session}
		</p>
	);
}
function reasonCopy(reason: CandidateDecision["reason"], locale: Locale) {
	const l = copy(locale);
	return {
		kind: l("Wrong instrument", "工具不符"),
		session: l("Wrong session", "时段不符"),
		coverage: l("Unknown coverage/value", "覆盖或数值未知"),
		minimum: l("Below threshold", "低于门槛"),
		qualified: l("Eligible observed row", "合格已观测行"),
	}[reason];
}
export function EligibilityRulesScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [kind, setKind] = useState<"stock" | "etf" | "both">("stock");
	const [minimum, setMinimum] = useState(500);
	const [selected, setSelected] = useState("D");
	const replay = useFrames(5);
	const [manual, setManual] = useState<number | null>(4);
	const step = manual ?? replay.frame;
	const result = summarizeEligibility(data.rows, {
		kind,
		minimum,
		session: data.session,
	});
	const active =
		result.decisions.find((d) => d.row.symbol === selected) ??
		result.decisions[0];
	const enabled = useLessonMotion();
	const stages = [
		l("Start", "开始"),
		l("Instrument", "工具"),
		l("Session", "时段"),
		l("Coverage", "覆盖"),
		l("Threshold", "门槛"),
	];
	const finish = () => {
		replay.select(4);
		setManual(4);
	};
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Source facts through eligibility checks",
						"来源事实经过资格检查",
					)}
					height={540}
				>
					<SvgText x={180} y={30}>
						{stages[step]}
					</SvgText>
					<line
						x1={30}
						x2={330}
						y1={55}
						y2={55}
						stroke="currentColor"
						opacity={0.3}
					/>
					<m.circle
						cx={30 + step * 75}
						cy={55}
						r={6}
						fill="var(--primary)"
						stroke="currentColor"
						initial={false}
						animate={{ cx: 30 + step * 75 }}
						transition={
							enabled && replay.playing ? lessonTransition : instantTransition
						}
					/>
					{result.decisions.map((d, i) => {
						const known = step >= d.stage;
						const eligible = known && d.status === "eligible";
						const unknown = known && d.status === "unknown";
						return (
							<g key={d.row.symbol}>
								<rect
									x={24}
									y={80 + i * 62}
									width={312}
									height={54}
									rx={10}
									fill={eligible ? "var(--primary)" : "currentColor"}
									opacity={eligible ? 0.18 : 0.04}
									stroke="currentColor"
									strokeDasharray={unknown ? "4 3" : undefined}
								/>
								<foreignObject x={24} y={80 + i * 62} width={312} height={54}>
									<button
										type="button"
										className="h-full w-full rounded-lg px-3 text-left text-sm"
										aria-label={`${l("Inspect source", "检查来源")} ${d.row.symbol}`}
										aria-pressed={selected === d.row.symbol}
										onClick={() => setSelected(d.row.symbol)}
									>
										<span className="block font-mono">
											{d.row.symbol} · {d.row.kind} · {number(d.row.volume)}
										</span>
										<span className="block text-xs">
											{known
												? reasonCopy(d.reason, locale)
												: l("Checks pending", "检查未完成")}
										</span>
									</button>
								</foreignObject>
							</g>
						);
					})}
					<SvgText x={180} y={488}>
						{l("Observed eligible rows", "已观测合格行")}
					</SvgText>
					<g data-universe-admitted>
						<SvgText x={180} y={524} strong>
							{step === 4 ? result.eligible.length : "—"}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Underlying type rule", "标的类型规则")}
				value={kind}
				options={[
					["stock", l("Stock options", "股票期权")],
					["etf", l("ETF options", "ETF 期权")],
					["both", l("Stocks and ETFs", "股票及 ETF")],
				]}
				onChange={(v) => {
					setKind(v as typeof kind);
					finish();
				}}
			/>
			<RangeControl
				label={l("Minimum contract volume", "最低成交张数")}
				value={minimum}
				display={number(minimum)}
				min={data.minimumRange[0]}
				max={data.minimumRange[1]}
				step={100}
				onChange={(v) => {
					setMinimum(v);
					finish();
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
			<p data-universe-source className="font-mono text-xs">
				{active.row.symbol} · {active.row.kind}
				<br />
				{active.row.session} · {active.row.coverage}
				<br />
				{l("Source badge", "来源标签")}: {active.row.badge}
				<br />
				{l("Volume", "成交量")}: {number(active.row.volume)}
			</p>
			<p data-universe-reason>{reasonCopy(active.reason, locale)}</p>
			<Note>
				{l(
					"The fixed source contains six candidate records. Type and session define the intended scope; coverage and the volume floor determine which observations can be compared. D's ready badge does not supply its missing volume. F's known 200 is below the default floor, not missing.",
					"固定来源包含六条候选记录。类型与时段定义目标范围，覆盖与成交量门槛决定哪些观测可比较。D 的就绪标签不能提供缺失量。F 已知为 200，低于默认门槛，并非缺失。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"Changing type or threshold changes the declared comparison. Choose those rules before inspecting the leader. Sector, size, underlying type and event dates are different scope decisions, not interchangeable filters.",
					"改变类型或门槛会改变声明比较。应在检查领先者之前确定规则。行业、规模、标的类型与事件日期是不同范围决定，不是可互换筛选。",
				)}
			</p>
		</SceneLayout>
	);
}
export function EligibilityDenominatorScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [corrected, setCorrected] = useState(false);
	const [baselineId, setBaselineId] = useState(data.baselines[0].id);
	const baseline =
		data.baselines.find((b) => b.id === baselineId) ?? data.baselines[0];
	const result = summarizeEligibility(
		corrected ? data.correctedRows : data.rows,
		{ kind: "stock", session: data.session, minimum: 500 },
	);
	const ratio = activityRatio(data.rows[0].volume, baseline.value);
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Peer coverage and numeric activity baseline",
						"同组覆盖与数值活动基准",
					)}
					height={470}
				>
					<SvgText x={180} y={33}>
						{l("Observed qualifying peers", "已观测合格同组")}
					</SvgText>
					{result.eligible.map((d, i) => (
						<g key={d.row.symbol}>
							<rect
								x={40 + i * 98}
								y={55}
								width={84}
								height={62}
								rx={12}
								fill="var(--primary)"
								opacity={0.2}
							/>
							<SvgText x={82 + i * 98} y={80}>
								{d.row.symbol}
							</SvgText>
							<SvgText x={82 + i * 98} y={104}>
								{number(d.row.volume)}
							</SvgText>
						</g>
					))}
					<SvgText x={180} y={153}>
						{l("Unknown in intended scope", "目标范围内未知")}:{" "}
						{result.unknown.map((d) => d.row.symbol).join(" / ") ||
							l("None", "无")}
					</SvgText>
					<SvgText x={180} y={194}>
						{l("Observed peer count", "已观测同组数")}: {result.eligible.length}
					</SvgText>
					<SvgText x={180} y={228}>
						{l("Observed leader", "观测领先者")}:{" "}
						{result.leaders.join(" / ") || "—"}
					</SvgText>
					<line
						x1={30}
						x2={330}
						y1={251}
						y2={251}
						stroke="currentColor"
						opacity={0.2}
					/>
					<SvgText x={180} y={288}>
						{l(
							"A's option volume / typical baseline",
							"A 期权成交量 / 典型基准",
						)}
					</SvgText>
					<SvgText x={180} y={325}>
						800 / {number(baseline.value)}
					</SvgText>
					<g data-universe-ratio>
						<SvgText x={180} y={368} strong>
							{ratio === null ? "—" : `${number(ratio)}×`}
						</SvgText>
					</g>
					<SvgText x={180} y={416} muted>
						{l("Count is not this numeric baseline", "数量不是这个数值基准")}
					</SvgText>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Coverage snapshot", "覆盖快照")}
				value={corrected ? "corrected" : "original"}
				options={[
					["original", l("Original · D unknown", "原快照 · D 未知")],
					[
						"corrected",
						l("Corrected same-session D = 1,500", "同日更正 D = 1,500"),
					],
				]}
				onChange={(v) => setCorrected(v === "corrected")}
			/>
			<SelectField
				label={l("Typical option-volume baseline", "典型期权成交量基准")}
				value={baselineId}
				options={data.baselines.map((b) => [
					b.id,
					b.label[locale === "zh" ? 1 : 0],
				])}
				onChange={setBaselineId}
			/>
			<p data-universe-peer-count>
				{l("Observed eligible count", "已观测合格数量")}:{" "}
				{result.eligible.length}
			</p>
			<p data-universe-subtotal>
				{l("Qualifying observed subtotal", "合格已观测小计")}:{" "}
				{number(result.subtotal)}
			</p>
			<p data-universe-complete>
				{l("Complete qualifying total", "完整合格总量")}:{" "}
				{number(result.completeTotal)}
			</p>
			<p data-universe-claim>
				{result.unknown.length
					? l(
							"Full-universe leader is unsupported while D is unknown",
							"D 未知时，完整范围领先者不受支持",
						)
					: l(
							"Complete for this declared synthetic population: D leads",
							"对本声明模拟人群完整：D 领先",
						)}
			</p>
			<Note>
				{l(
					"The stock/same-session/≥500 rule stays fixed. Unknown D might exceed the floor and the observed leader. Revealing the supplied correction changes observed peers from two to three and their subtotal from 1,300 to 2,800. It does not retroactively make the earlier sample complete.",
					"股票/同一时段/≥500 规则保持固定。未知 D 可能超过门槛与观测领先者。展示给定更正后，观测同组从两项变三项，小计从 1,300 变 2,800；这不会让先前样本追溯性地变完整。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"A's 800 contracts divided by a typical option-volume baseline of 500 contracts is 1.6×, independent of peer count. Both quantities share contract units. Missing or nonpositive baselines remain unavailable; the ratio is descriptive, not a forecast.",
					"A 的 800 张除以典型期权量基准 500 张为 1.6×，与同组数量独立。两者单位均为张。基准缺失或非正时不可用；比率是描述量，不是预测。",
				)}
			</p>
		</SceneLayout>
	);
}
export function EligibilityHistoryScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [current, setCurrent] = useState(false);
	const [selected, setSelected] = useState("OLD");
	const members = data.history.members.filter((m) =>
		current ? m.currentMember : m.historicalMember,
	);
	const observed = members.filter((m) => m.volume !== null);
	const maximum = observed.length
		? Math.max(...observed.map((m) => m.volume as number))
		: null;
	const leaders = observed
		.filter((m) => m.volume === maximum)
		.map((m) => m.symbol);
	const row =
		data.history.members.find((m) => m.symbol === selected) ??
		data.history.members[0];
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Membership dates and fixed historical observations",
						"成员日期与固定历史观测",
					)}
					height={455}
				>
					<SvgText x={180} y={32}>
						{l("Membership", "成员日期")}:{" "}
						{current ? data.history.currentDate : data.history.date}
					</SvgText>
					{data.history.members.map((m, i) => {
						const included = current ? m.currentMember : m.historicalMember;
						return (
							<g key={m.symbol}>
								<rect
									x={25}
									y={60 + i * 77}
									width={310}
									height={65}
									rx={12}
									fill={included ? "var(--primary)" : "currentColor"}
									opacity={included ? 0.18 : 0.04}
									stroke="currentColor"
									strokeDasharray={!included ? "4 3" : undefined}
								/>
								<foreignObject x={25} y={60 + i * 77} width={310} height={65}>
									<button
										type="button"
										className="h-full w-full rounded-xl text-center text-sm"
										aria-label={`${l("Inspect member", "检查成员")} ${m.symbol}`}
										aria-pressed={selected === m.symbol}
										onClick={() => setSelected(m.symbol)}
									>
										<span className="block font-mono">
											{m.symbol} · {number(m.volume)}
										</span>
										<span className="block text-xs">
											{included
												? l("Included", "纳入")
												: l(
														"Excluded by this membership date",
														"按此成员日期排除",
													)}
										</span>
									</button>
								</foreignObject>
							</g>
						);
					})}
					<SvgText x={180} y={407}>
						{l("Observed historical leader", "已观测历史领先者")}
					</SvgText>
					<g data-universe-history-leader>
						<SvgText x={180} y={440} strong>
							{leaders.join(" / ") || "—"}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Membership date", "成员日期")}
				value={current ? "current" : "historical"}
				options={[
					["historical", l("Membership at observation date", "观测当时成员")],
					[
						"current",
						l("Later membership applied backward", "将后续成员倒用于历史"),
					],
				]}
				onChange={(v) => setCurrent(v === "current")}
			/>
			<p>
				{l("Observations stay at", "观测仍固定于")}: {data.history.date}
			</p>
			<p data-universe-history-detail>
				{row.symbol} · {row.note[locale === "zh" ? 1 : 0]}
				<br />
				{l("Historical volume", "历史成交量")}: {number(row.volume)}
			</p>
			<p data-universe-history-claim>
				{current
					? l(
							"Changed population: OLD is omitted and NEW has no supplied history",
							"人群已改变：OLD 被遗漏，NEW 无给定历史",
						)
					: l("Original historical population retained", "已保留原历史人群")}
			</p>
			<Note>
				{l(
					"OLD belonged to the original population and led with 1,200 contracts. Removing it because it is absent later changes the historical question. NEW joined later; its missing history cannot be backfilled as zero. The remaining observed leader A is not evidence of the original full-universe leader.",
					"OLD 属于原人群，以 1,200 张领先。因其后来不在成员中而移除，会改变历史问题。NEW 后来加入，缺失历史不能补零。剩余观测领先者 A 不能证明原完整范围领先者。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"Membership here is supplied at two dates, not inferred from present-day availability. This is a universe-construction example, not a performance backtest or a prediction about these symbols.",
					"此处成员按两个日期给定，不从今天可见性推断。这是范围构建示例，不是绩效回测或对这些标的的预测。",
				)}
			</p>
		</SceneLayout>
	);
}
