import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { FieldGroup } from "@tradely/ui/components/field";
import * as m from "motion/react-m";
import { createContext, useContext, useState } from "react";
import {
	type CohortMode,
	cohortMembers,
	compareCohorts,
	type OiConceptData,
	type PositionEffect,
	replayOi,
	tradeOiChange,
} from "@/domain/learning/oi-concept";
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
export const OiData = createContext<OiConceptData | null>(null);
function useOiData() {
	const data = useContext(OiData);
	if (!data) throw new Error("OI scenes require authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const text = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const number = (value: number | null) =>
	value === null ? "—" : value.toLocaleString("en-US");
const signed = (value: number | null) =>
	value === null ? "—" : `${value > 0 ? "+" : ""}${number(value)}`;
function Snapshot({ locale, cohort = false }: Props & { cohort?: boolean }) {
	const data = useOiData();
	const l = text(locale);
	return (
		<p className="font-mono text-muted-foreground text-xs leading-relaxed">
			{cohort ? data.cohortScope : data.contract}
			<br />
			{cohort ? data.reportDates.join(" → ") : data.sessionDate}
			<br />
			{l(
				"Fictional evidence · quantities in contracts",
				"虚构证据 · 数量单位：张",
			)}
		</p>
	);
}

export function PositionEffectsScene({ locale }: Props) {
	const data = useOiData();
	const l = text(locale);
	const motion = useLessonMotion();
	const playback = useFrames(data.combinations.length);
	const [quantity, setQuantity] = useState(data.defaultQuantity);
	const pair = data.combinations[playback.frame];
	const change = tradeOiChange(pair.buyer, pair.seller, quantity);
	const ending = data.initialReport.value + change;
	const choose = (buyer: PositionEffect, seller: PositionEffect) => {
		const index = data.combinations.findIndex(
			(p) => p.buyer === buyer && p.seller === seller,
		);
		if (index >= 0) playback.select(index);
	};
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Both counterparties' position effects determine the change in outstanding contracts",
						"双方持仓效果决定存续合约数量的变化",
					)}
					height={452}
				>
					<rect
						x="36"
						y="15"
						width="288"
						height="66"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={40} muted>
						{l("Start · outstanding contracts", "起点 · 存续合约")}
					</SvgText>
					<SvgText x={180} y={68} strong>
						{number(data.initialReport.value)}
					</SvgText>
					<path
						d="M180 81v20H89v20M180 101h91v20M89 211v21h91v25M271 211v21h-91"
						className="contract-svg-line"
					/>
					{[pair.buyer, pair.seller].map((effect, i) => (
						<g key={i === 0 ? "buyer" : "seller"}>
							<rect
								x={14 + i * 182}
								y="121"
								width="150"
								height="90"
								rx="12"
								className="contract-svg-paper"
							/>
							<SvgText x={89 + i * 182} y={148} muted>
								{i === 0 ? l("Buyer", "买方") : l("Seller", "卖方")}
							</SvgText>
							<SvgText x={89 + i * 182} y={182} strong>
								{effect === "open" ? l("OPEN", "开仓") : l("CLOSE", "平仓")}
							</SvgText>
						</g>
					))}
					<m.path
						key={`${pair.buyer}:${pair.seller}`}
						d="M89 211v21h91v25M271 211v21h-91"
						className="contract-svg-active-line"
						initial={{ pathLength: motion ? 0 : 1 }}
						animate={{ pathLength: 1 }}
						transition={
							motion
								? { ...lessonTransition, duration: 0.4 }
								: instantTransition
						}
					/>
					<rect
						x="36"
						y="257"
						width="288"
						height="65"
						rx="12"
						className="contract-svg-wash"
					/>
					<SvgText x={180} y={282} muted>
						{l("One execution", "一笔成交")}
					</SvgText>
					<SvgText x={180} y={310} strong>
						{quantity} {l("contracts", "张")}
					</SvgText>
					<SvgText x={89} y={360} muted>
						{l("Volume added", "新增成交量")}
					</SvgText>
					<SvgText x={271} y={360} muted>
						{l("OI change", "OI 变化")}
					</SvgText>
					<g data-trade-volume>
						<SvgText x={89} y={391} strong>
							+{quantity}
						</SvgText>
					</g>
					<g data-trade-oi-change>
						<SvgText x={271} y={391} strong>
							{signed(change)}
						</SvgText>
					</g>
					<g data-trade-ending-oi>
						<SvgText x={180} y={434}>
							{l("Calculated OI after this trade", "此成交后的计算 OI")}:{" "}
							{ending}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<Snapshot locale={locale} />
			<FieldGroup>
				<ChoiceField
					label={l("Buyer position effect", "买方持仓效果")}
					value={pair.buyer}
					options={[
						["open", l("Opens", "开仓")],
						["close", l("Closes", "平仓")],
					]}
					onChange={(buyer) => choose(buyer, pair.seller)}
				/>
				<ChoiceField
					label={l("Seller position effect", "卖方持仓效果")}
					value={pair.seller}
					options={[
						["open", l("Opens", "开仓")],
						["close", l("Closes", "平仓")],
					]}
					onChange={(seller) => choose(pair.buyer, seller)}
				/>
				<div
					onPointerDownCapture={() => playback.select(playback.frame)}
					onKeyDownCapture={() => playback.select(playback.frame)}
				>
					<RangeControl
						label={l("Executed quantity", "成交张数")}
						value={quantity}
						display={`${quantity} ${l("contracts", "张")}`}
						min={1}
						max={data.maxQuantity}
						onChange={(value) => {
							playback.select(playback.frame);
							setQuantity(value);
						}}
					/>
				</div>
			</FieldGroup>
			<PlaybackButton
				playing={playback.playing}
				onClick={playback.toggle}
				l={l}
			/>
			<Alert role="note">
				<AlertTitle>
					{change > 0
						? l("A new outstanding contract", "新增存续合约")
						: change < 0
							? l("An outstanding contract is removed", "存续合约被消除")
							: l("The contract transfers", "合约转移")}
				</AlertTitle>
				<AlertDescription>
					{change > 0
						? l(
								"Both sides open. Each matched contract adds one to OI, not two. The buyer and seller share the same execution count.",
								"双方开仓。每张撮合合约使 OI 增加一张，不是两张；买卖双方共用同一成交数量。",
							)
						: change < 0
							? l(
									"Both sides close. Outstanding contracts decrease, while the execution still adds its full quantity to session volume.",
									"双方平仓。存续合约减少，但这笔成交仍按完整张数计入时段成交量。",
								)
							: l(
									"One side opens and the other closes. OI is unchanged, but volume still increases. No OI change does not mean no trading.",
									"一方开仓、另一方平仓。OI 不变，成交量仍增加。OI 不变不代表没有交易。",
								)}
				</AlertDescription>
			</Alert>
			<p className="text-muted-foreground text-xs">
				{l(
					"Each selection starts from the same initial OI and supplies both position flags. No other activity is included. A print alone does not reveal these flags.",
					"每次选择从相同初始 OI 开始，并给定双方持仓标记，不含其他活动。仅成交记录无法揭示这些标记。",
				)}
			</p>
		</SceneLayout>
	);
}

export function SessionOiScene({ locale }: Props) {
	const data = useOiData();
	const l = text(locale);
	const motion = useLessonMotion();
	const playback = useFrames(data.events.length + 2);
	const [evidence, setEvidence] = useState("complete");
	const complete = evidence === "complete";
	const result = replayOi(data, playback.frame, complete);
	const current = data.events[playback.frame - 1];
	const stops = [
		l("Before session", "时段开始前"),
		...data.events.map((event, i) =>
			event.kind === "trade"
				? `${l("Execution", "成交")} ${i + 1}`
				: l("Clearing interval", "清算区间"),
		),
		l("Next report published", "下一报告发布"),
	];
	const eventTitle =
		playback.frame === 0
			? l("Starting observation", "起始观测")
			: result.published
				? l("New published observation", "新发布观测")
				: current?.kind === "exercise"
					? complete
						? l("Exercise + paired assignment", "行权 + 对应指派")
						: l("Clearing details unavailable", "清算明细不可用")
					: complete
						? `${current?.buyer.toUpperCase()} / ${current?.seller.toUpperCase()}`
						: l("Position flags unavailable", "持仓标记不可用");
	const eventDetail =
		playback.frame === 0
			? `${l("Report as of", "报告截至")} ${data.initialReport.asOf}`
			: result.published
				? `${l("Published", "发布于")} ${data.nextReport.published}`
				: current?.kind === "exercise"
					? complete
						? l(
								`${current.quantity} contracts removed once`,
								`${current.quantity} 张合约仅移除一次`,
							)
						: l("No new tape print supplied", "未提供新成交记录")
					: `${current?.quantity} ${l("contracts executed", "张成交合约")} · ${current?.time}`;
	const progress = playback.frame / (data.events.length + 1);
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Session volume and calculated OI beside dated reported OI",
						"时段成交量、计算 OI 与带日期的报告 OI 并列",
					)}
					height={510}
				>
					<rect
						x="14"
						y="15"
						width="332"
						height="82"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={42} muted>
						{eventTitle}
					</SvgText>
					<SvgText x={180} y={70}>
						{eventDetail}
					</SvgText>
					<SvgText x={89} y={135} muted>
						{l("Session volume", "时段成交量")}
					</SvgText>
					<SvgText x={271} y={135} muted>
						{l("Calculated ledger OI", "台账计算 OI")}
					</SvgText>
					<g data-session-volume>
						<SvgText x={89} y={174} strong>
							{number(result.volume)}
						</SvgText>
					</g>
					<g data-session-calculated>
						<SvgText x={271} y={174} strong>
							{number(result.calculated)}
						</SvgText>
					</g>
					<path d="M38 208H322" className="contract-svg-line" />
					<path
						d={`M38 208H${
							38 +
							(
								result.volume /
									Math.max(
										1,
										data.events.reduce(
											(sum, e) => sum + (e.kind === "trade" ? e.quantity : 0),
											0,
										),
									)
							) *
								284
						}`}
						className="contract-svg-active-line"
					/>
					<SvgText x={180} y={238} muted>
						{l("Calculation is not a new report", "计算不等于新报告")}
					</SvgText>
					<rect
						x="36"
						y="261"
						width="288"
						height="95"
						rx="12"
						className="contract-svg-wash"
					/>
					<SvgText x={180} y={286} muted>
						{l("Reported OI", "已报告 OI")}
					</SvgText>
					<g data-session-reported>
						<SvgText x={180} y={319} strong>
							{number(result.reported)}
						</SvgText>
					</g>
					<g data-session-asof>
						<SvgText x={180} y={343} muted>
							{l("As of", "截至")} {result.asOf}
						</SvgText>
					</g>
					<SvgText x={180} y={390} muted>
						{stops[playback.frame]}
					</SvgText>
					<path d="M40 438H320" className="contract-svg-line" />
					{stops.map((label, i) => (
						<circle
							key={label}
							cx={40 + (i / (stops.length - 1)) * 280}
							cy="438"
							r="4"
							className="contract-svg-dot"
						/>
					))}
					<m.circle
						initial={false}
						cx={40 + progress * 280}
						cy="438"
						r="10"
						className="contract-svg-handle"
						animate={{ cx: 40 + progress * 280 }}
						transition={
							playback.playing && motion ? lessonTransition : instantTransition
						}
					/>
					<foreignObject x="20" y="398" width="320" height="80">
						<input
							type="range"
							className="contract-range contract-svg-range"
							aria-label={l("Session ledger timeline", "时段台账时间轴")}
							aria-valuetext={stops[playback.frame]}
							min={0}
							max={stops.length - 1}
							step={1}
							value={playback.frame}
							onPointerDown={() => playback.select(playback.frame)}
							onKeyDown={() => playback.select(playback.frame)}
							onChange={(e) => playback.select(Number(e.target.value))}
						/>
					</foreignObject>
					<SvgText x={65} y={492} muted>
						{data.sessionDate.slice(5)}
					</SvgText>
					<SvgText x={288} y={492} muted>
						{data.nextReport.published.slice(5)}
					</SvgText>
				</Diagram>
			}
		>
			<Snapshot locale={locale} />
			<FieldGroup>
				<ChoiceField
					label={l("Evidence available", "可用证据")}
					value={evidence}
					options={[
						["complete", l("Complete ledger", "完整台账")],
						["prints", l("Prints only", "仅成交记录")],
					]}
					onChange={(value) => {
						playback.select(playback.frame);
						setEvidence(value);
					}}
				/>
				<SelectField
					label={l("Replay stop", "回放节点")}
					value={String(playback.frame)}
					options={stops.map((label, i) => [String(i), label])}
					onChange={(value) => playback.select(Number(value))}
				/>
			</FieldGroup>
			<PlaybackButton
				playing={playback.playing}
				onClick={playback.toggle}
				l={l}
			/>
			<Alert role="note">
				<AlertTitle>
					{result.published
						? l("A report arrives on its own clock", "报告按自身时间发布")
						: l("The prior report stays dated", "前期报告保留原日期")}
				</AlertTitle>
				<AlertDescription>
					{result.published
						? l(
								`The supplied report now states ${data.nextReport.value} as of ${data.nextReport.asOf}. Its net change does not identify the owner or purpose of any individual print.`,
								`给定新报告截至 ${data.nextReport.asOf} 的 OI 为 ${data.nextReport.value}。净变化不识别任何单笔成交的持有人或目的。`,
							)
						: l(
								"Executions move the volume counter. They do not rewrite the last reported OI. Only the supplied next report updates the reported value and its date.",
								"成交推动成交量计数器，不会改写最近报告的 OI。只有给定下一报告才更新报告值与日期。",
							)}
				</AlertDescription>
			</Alert>
			<p className="text-sm">
				{complete
					? l(
							"The complete toy ledger includes three executions and two exercised contracts with paired assignments, counted once. Those removals add no tape volume. Expiration can also remove contracts, but is not an event in this ledger.",
							"完整模拟台账含三笔成交，以及两张已行权并对应指派的合约，移除仅计一次。这些移除不增加成交量。到期也可移除合约，但本台账不含到期事件。",
						)
					: l(
							"Volume survives when position flags and clearing details are removed. Calculated ending OI does not. The later published report is still observable without reconstructing every event.",
							"移除持仓标记和清算明细后，成交量仍已知，计算期末 OI 则不可得。无需重建每个事件，仍可观察后续发布的报告。",
						)}
			</p>
		</SceneLayout>
	);
}

export function CohortComparisonScene({ locale }: Props) {
	const data = useOiData();
	const l = text(locale);
	const motion = useLessonMotion();
	const playback = useFrames(2);
	const report = playback.frame as 0 | 1;
	const [mode, setMode] = useState<CohortMode>("rolling");
	const comparison = compareCohorts(data.series, data.dteRange, mode);
	const members = cohortMembers(data.series, data.dteRange, mode, report);
	const total = report === 0 ? comparison.first : comparison.second;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Compare expiry membership across two open-interest reports",
						"比较两份未平仓量报告的到期成员",
					)}
					height={475}
				>
					<SvgText x={180} y={25} muted>
						{data.reportDates[report]}
					</SvgText>
					{data.series.map((series, i) => {
						const y = 44 + i * 85;
						const included = members.some((member) => member.id === series.id);
						return (
							<g
								key={series.id}
								data-cohort-series={series.id}
								data-cohort-included={included}
							>
								<rect
									x="24"
									y={y}
									width="312"
									height="72"
									rx="12"
									className={
										included ? "contract-svg-wash" : "contract-svg-paper"
									}
								/>
								<SvgText x={126} y={y + 26} muted>
									{series.id} · {series.expiry}
								</SvgText>
								<SvgText x={277} y={y + 26} muted>
									{series.dte[report]} DTE
								</SvgText>
								<SvgText x={97} y={y + 56} strong>
									OI {number(series.oi[report])}
								</SvgText>
								<SvgText x={260} y={y + 56} muted>
									{included ? l("Included", "纳入") : l("Excluded", "排除")}
								</SvgText>
								{included ? (
									<m.path
										key={`${mode}:${report}`}
										d={`M24 ${y + 37}H10V340H180v24`}
										className="contract-svg-active-line"
										initial={{ pathLength: motion ? 0 : 1 }}
										animate={{ pathLength: 1 }}
										transition={
											motion
												? { ...lessonTransition, duration: 0.4 }
												: instantTransition
										}
									/>
								) : null}
							</g>
						);
					})}
					<SvgText x={180} y={320} muted>
						{mode === "fixed"
							? l("Fixed first-report members", "固定首份报告成员")
							: `${l("Rolling", "滚动")} ${data.dteRange.join("–")} DTE`}
					</SvgText>
					<rect
						x="24"
						y="364"
						width="312"
						height="67"
						rx="12"
						className="contract-svg-wash"
					/>
					<SvgText x={180} y={389} muted>
						{l("Selected cohort OI", "选定集合 OI")}
					</SvgText>
					<g data-cohort-total>
						<SvgText x={180} y={418} strong>
							{number(total)}
						</SvgText>
					</g>
					<SvgText x={180} y={462} muted>
						{l(
							"Calendar DTE · same strike and option type",
							"日历 DTE · 相同行权价与期权类型",
						)}
					</SvgText>
				</Diagram>
			}
		>
			<Snapshot locale={locale} cohort />
			<FieldGroup>
				<ChoiceField
					label={l("Comparison scope", "比较范围")}
					value={mode}
					options={[
						["rolling", l("Rolling DTE", "滚动 DTE")],
						["fixed", l("Fixed members", "固定成员")],
					]}
					onChange={(value) => {
						playback.select(playback.frame);
						setMode(value);
					}}
				/>
				<RangeControl
					label={l("Report date", "报告日期")}
					value={report}
					display={data.reportDates[report]}
					min={0}
					max={1}
					onChange={playback.select}
				/>
			</FieldGroup>
			<PlaybackButton
				playing={playback.playing}
				onClick={playback.toggle}
				l={l}
			/>
			<p className="text-sm" data-cohort-delta>
				{l("Difference across selected reports", "选定报告差值")}:{" "}
				<strong>{signed(comparison.delta)}</strong>
			</p>
			<Alert role="note">
				<AlertTitle>
					{mode === "rolling"
						? l("Membership changes the total", "成员变化改变总数")
						: l("Follow the same expiries", "追踪相同到期日")}
				</AlertTitle>
				<AlertDescription>
					{mode === "rolling"
						? l(
								`Entries add ${number(comparison.entryOi)} OI; exits remove ${number(comparison.exitOi)} from this bucket. Retained-series change is ${signed(comparison.retainedChange)}. The net difference is not an identified count of opening trades.`,
								`进入成员带入 ${number(comparison.entryOi)} OI，退出成员从桶内移出 ${number(comparison.exitOi)}。留存序列变化为 ${signed(comparison.retainedChange)}。净差值不是已识别的开仓成交数。`,
							)
						: l(
								"This comparison keeps the first report's expiry members, even when one ages outside the DTE window. A stable OI total still does not prove that no trades occurred.",
								"此比较保留首份报告的到期成员，即使某成员已老化至 DTE 窗口之外。OI 总数不变仍不证明没有交易。",
							)}
				</AlertDescription>
			</Alert>
			<p className="text-muted-foreground text-xs">
				{l(
					"Rows outside the chosen set remain visible for comparison. Individual series reports are unchanged in this example; gross trading activity and ownership are not supplied.",
					"选定集合之外的行保留用于比较。本例单独合约序列的报告值不变，未提供全部成交活动与持有人信息。",
				)}
			</p>
		</SceneLayout>
	);
}
