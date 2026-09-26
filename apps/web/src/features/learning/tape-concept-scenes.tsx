import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { RangeSlider } from "@tradely/ui/components/slider";
import * as m from "motion/react-m";
import { createContext, useContext } from "react";
import {
	aggregateTape,
	replayTape,
	type TapeConceptData,
	type TapeGroupIssue,
} from "@/domain/learning/tape-concept";
import type { Locale } from "@/i18n/messages";
import {
	Diagram,
	PlaybackButton,
	SceneLayout,
	SelectField,
	SvgText,
	useFrames,
} from "./concept-scene";
import { ExecutionTape } from "./execution-tape";
import {
	instantTransition,
	lessonTransition,
	useLessonMotion,
} from "./lesson-motion";
import { useGuidedState } from "./visual-playback";
export const TapeData = createContext<TapeConceptData | null>(null);
function useTapeData() {
	const data = useContext(TapeData);
	if (!data) throw new Error("Tape scenes require authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const text = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const number = (v: number) => v.toLocaleString("en-US");
const price = (cents: number) =>
	`$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
const money = (value: number | null) =>
	value === null
		? "—"
		: `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
function Snapshot({ locale }: Props) {
	const data = useTapeData();
	const l = text(locale);
	return (
		<p className="font-mono text-muted-foreground text-xs leading-relaxed">
			{data.contract}
			<br />
			{data.date} · {data.window}
			<br />
			{l("Fictional records · selected IDs only", "虚构记录 · 仅选定标识")}
		</p>
	);
}
const groupIssues: Record<TapeGroupIssue, readonly [string, string]> = {
	empty: ["No source prints", "无原始成交"],
	duplicate: ["Duplicate execution ID", "成交标识重复"],
	contract: ["Different contracts", "合约不同"],
	unit: ["Quote units differ", "报价单位不同"],
	multiplier: ["Multipliers conflict", "乘数冲突"],
	invalid: ["Invalid source values", "原始值无效"],
};

export function AggregateScene({ locale }: Props) {
	const data = useTapeData();
	const l = text(locale);
	const language = locale === "zh" ? 1 : 0;
	const motion = useLessonMotion();
	const [id, setId] = useGuidedState(
		data.groups[0].id,
		data.groups.map((item) => item.id),
	);
	const group = data.groups.find((g) => g.id === id) ?? data.groups[0];
	const prints = group.ids.map((key) => data.records[key]);
	const result = aggregateTape(prints);
	return (
		<SceneLayout
			companion={
				<ExecutionTape
					locale={locale}
					rows={[...new Map(prints.map((p) => [p.id, p])).values()].map(
						(p) => ({
							id: p.id,
							price: p.price,
							quantity: p.quantity,
							at: p.executionAt,
							unit: p.unit,
							contract: p.contract,
						}),
					)}
					note={l(
						"Supplied execution records. Trades alone cannot reconstruct displayed liquidity.",
						"给定成交记录。仅凭成交无法还原可见流动性。",
					)}
				/>
			}
			diagram={
				<Diagram
					label={l(
						"Selected source executions feed one compatible aggregate",
						"选定原始成交形成一条兼容聚合",
					)}
					height={480}
				>
					<SvgText x={180} y={26} muted>
						{l("Initial uncorrected examples", "初始未更正示例")}
					</SvgText>
					{[0, 1].map((i) => {
						const row = prints[i];
						const x = 14 + i * 182;
						return (
							<g key={i === 0 ? "left" : "right"}>
								<rect
									x={x}
									y="48"
									width="150"
									height="128"
									rx="12"
									className="contract-svg-paper"
								/>
								<SvgText x={x + 75} y={75} muted>
									{row
										? `${group.ids[i]} · ${row.option}`
										: l("No selection", "未选择")}
								</SvgText>
								<SvgText x={x + 75} y={107} strong>
									{row ? `${row.quantity} @ ${price(row.price)}` : "—"}
								</SvgText>
								<SvgText x={x + 75} y={133} muted>
									{row?.unit ?? "—"}
								</SvgText>
								<SvgText x={x + 75} y={159} muted>
									{row
										? `${l("Multiplier", "乘数")} ${row.multiplier ?? "—"}`
										: "—"}
								</SvgText>
								{row ? (
									<path
										d={`M${x + 75} 176v25H180v26`}
										className="contract-svg-line"
									/>
								) : null}
							</g>
						);
					})}
					{result.ok ? (
						<m.path
							key={id}
							d={`M89 176v25H180v26${prints.length > 1 ? "M271 176v25H180" : ""}`}
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
					<rect
						x="14"
						y="227"
						width="332"
						height="72"
						rx="12"
						className={result.ok ? "contract-svg-wash" : "contract-svg-paper"}
					/>
					<SvgText x={180} y={252} muted>
						{l("Aggregate eligibility", "聚合资格")}
					</SvgText>
					<g data-tape-eligibility>
						<SvgText x={180} y={283} strong>
							{result.ok
								? l("Same contract + units", "相同合约 + 单位")
								: groupIssues[result.issue][language]}
						</SvgText>
					</g>
					<SvgText x={89} y={335} muted>
						{l("Contracts", "合约张数")}
					</SvgText>
					<SvgText x={271} y={335} muted>
						{l("Executions", "成交笔数")}
					</SvgText>
					<g data-tape-quantity>
						<SvgText x={89} y={365} strong>
							{result.ok ? number(result.quantity) : "—"}
						</SvgText>
					</g>
					<g data-tape-count>
						<SvgText x={271} y={365} strong>
							{result.ok ? result.count : "—"}
						</SvgText>
					</g>
					<rect
						x="14"
						y="389"
						width="332"
						height="74"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={414} muted>
						{l(
							"Quantity-weighted price · rounded",
							"数量加权价格 · 已四舍五入",
						)}
					</SvgText>
					<g data-tape-weighted>
						<SvgText x={180} y={445} strong>
							{result.ok ? price(result.weightedPrice) : "—"}
						</SvgText>
					</g>
				</Diagram>
			}
			controls={
				<SelectField
					label={l("Grouping candidate", "候选分组")}
					value={id}
					options={data.groups.map((g) => [g.id, g.label[language]])}
					onChange={setId}
				/>
			}
			details={
				<>
					<Snapshot locale={locale} />
					<p className="text-sm" data-tape-premium>
						{l("Summed execution premium", "成交权利金之和")}:{" "}
						<strong>{result.ok ? money(result.premium) : "—"}</strong>
					</p>
					<p className="text-sm" data-tape-mean>
						{l("Simple mean of prices", "价格简单均值")}:{" "}
						{result.ok ? price(result.meanPrice) : "—"}
					</p>
					<Alert role="note">
						<AlertTitle>
							{result.ok
								? l("Count quantity, not just rows", "用数量加权，不只数行")
								: l("Fix the grouping boundary first", "先修正分组边界")}
						</AlertTitle>
						<AlertDescription>
							{result.ok
								? result.weightedPrice === result.meanPrice
									? l(
											"The weighted and simple averages coincide for this selection. With different executed quantities they need not match. Premium sums each execution's price × quantity × stated multiplier.",
											"本次选择的加权与简单均值恰好相同。不同成交数量下，它们不一定相同。权利金逐笔累加价格 × 数量 × 给定乘数。",
										)
									: l(
											"Each price gets its executed quantity as its weight. A simple average treats unequal prints as equally sized. The premium and execution count are separate sums.",
											"每个价格按其成交数量加权。简单均值把不同数量成交当作等量处理。权利金与成交笔数分别统计。",
										)
								: l(
										"These records cannot form the proposed aggregate. Check full contract identity, quote units, multiplier evidence and unique execution IDs before doing arithmetic. Do not silently drop the incompatible row.",
										"这些记录不能组成拟议聚合。计算前检查完整合约、报价单位、乘数证据与唯一成交标识，不应悄悄丢弃不兼容行。",
									)}
						</AlertDescription>
					</Alert>
					<p className="text-muted-foreground text-xs">
						{l(
							"Grouping rule: only the selected compatible execution IDs in this supplied window. This is not total session volume, one identified order or proof of a shared strategy. U is a deliberately incompatible unit example.",
							"分组规则：仅统计给定窗口内选定且兼容的成交标识。这不是整个时段成交量、已识别的一张订单或共同策略的证明。U 是故意设置的单位不兼容示例。",
						)}
					</p>
				</>
			}
		/>
	);
}

export function MessageReplayScene({ locale }: Props) {
	const data = useTapeData();
	const l = text(locale);
	const motion = useLessonMotion();
	const playback = useFrames(data.messages.length + 1);
	const state = replayTape(data.messages, playback.frame);
	const aggregate = aggregateTape(state.active);
	const current = data.messages[playback.frame - 1];
	const stops = [
		l("Before messages", "收到消息前"),
		...data.messages.map((message) => message.id),
	];
	const event =
		current?.kind === "new"
			? l("New execution report", "新成交报告")
			: current?.kind === "duplicate"
				? l("Duplicate message", "重复消息")
				: current?.kind === "correct"
					? l("Correction replaces a report", "更正替换原报告")
					: current?.kind === "cancel"
						? l("Cancellation removes a report", "撤销移除原报告")
						: l("No messages received", "尚未收到消息");
	return (
		<SceneLayout
			companion={
				<ExecutionTape
					locale={locale}
					rows={state.active.map((p) => ({
						id: p.id,
						price: p.price,
						quantity: p.quantity,
						at: p.executionAt,
						unit: p.unit,
						contract: p.contract,
					}))}
					event={current ? `${current.receivedAt} · ${event}` : event}
					note={l(
						"Current unique reports after corrections and cancellations. Canceling a trade report does not replenish an order book.",
						"更正与撤销后的唯一有效记录。撤销成交报告不会自动补回订单簿。",
					)}
				/>
			}
			diagram={
				<Diagram
					label={l(
						"Received messages and the current unique execution view",
						"已收到消息与当前唯一成交视图",
					)}
					height={555}
				>
					<SvgText x={180} y={27} muted>
						{current?.id ?? "—"} · {event}
					</SvgText>
					<rect
						x="14"
						y="49"
						width="332"
						height="92"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={73} muted>
						{l("Linked execution time", "关联成交时间")}:{" "}
						{current?.executionAt ?? "—"}
					</SvgText>
					<SvgText x={180} y={102} muted>
						{l("Receipt time", "接收时间")}: {current?.receivedAt ?? "—"}
					</SvgText>
					<SvgText x={180} y={129} muted>
						{l(
							"These clocks need not give the same order",
							"两种时间不一定给出相同顺序",
						)}
					</SvgText>
					<SvgText x={89} y={183} muted>
						{l("Messages received", "已接收消息")}
					</SvgText>
					<SvgText x={271} y={183} muted>
						{l("Active executions", "有效成交记录")}
					</SvgText>
					<g data-tape-messages>
						<SvgText x={89} y={215} strong>
							{state.messages}
						</SvgText>
					</g>
					<g data-tape-active>
						<SvgText x={271} y={215} strong>
							{state.active.length}
						</SvgText>
					</g>
					<rect
						x="14"
						y="242"
						width="332"
						height="79"
						rx="12"
						className="contract-svg-wash"
					/>
					<SvgText x={180} y={268} muted>
						{l("Current counted quantity", "当前计入张数")}
					</SvgText>
					<g data-tape-current-quantity>
						<SvgText x={180} y={299} strong>
							{aggregate.ok
								? number(aggregate.quantity)
								: state.active.length === 0
									? "0"
									: "—"}
						</SvgText>
					</g>
					<SvgText x={180} y={357} muted>
						{l("Current premium", "当前权利金")}
					</SvgText>
					<g data-tape-current-premium>
						<SvgText x={180} y={390} strong>
							{aggregate.ok
								? money(aggregate.premium)
								: state.active.length === 0
									? "$0"
									: "—"}
						</SvgText>
					</g>
					<SvgText x={180} y={425} muted>
						{l("Weighted price", "加权价格")}:{" "}
						{aggregate.ok ? price(aggregate.weightedPrice) : "—"}
					</SvgText>
					<path d="M40 486H320" className="contract-svg-line" />
					{stops.map((label, i) => (
						<circle
							key={label}
							cx={40 + (i / (stops.length - 1)) * 280}
							cy="486"
							r="4"
							className="contract-svg-dot"
						/>
					))}
					<m.circle
						initial={false}
						cx={40 + (playback.frame / (stops.length - 1)) * 280}
						cy="486"
						r="10"
						className="contract-svg-handle"
						animate={{ cx: 40 + (playback.frame / (stops.length - 1)) * 280 }}
						transition={
							playback.playing && motion ? lessonTransition : instantTransition
						}
					/>
					<foreignObject x="20" y="446" width="320" height="80">
						<RangeSlider
							type="range"
							className="contract-range contract-svg-range"
							aria-label={l("Message replay timeline", "消息回放时间轴")}
							aria-valuetext={`${stops[playback.frame]} · ${event}`}
							min={0}
							max={stops.length - 1}
							step={1}
							value={playback.frame}
							onPointerDown={() => playback.select(playback.frame)}
							onKeyDown={() => playback.select(playback.frame)}
							onChange={(e) => playback.select(Number(e.target.value))}
						/>
					</foreignObject>
					<SvgText x={180} y={544} muted>
						{l("Revisions are not additional fills", "修订不是额外成交")}
					</SvgText>
				</Diagram>
			}
			controls={
				<>
					<SelectField
						label={l("Received message", "已接收消息")}
						value={String(playback.frame)}
						options={stops.map((label, i) => [String(i), label])}
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
					<Snapshot locale={locale} />
					<div className="flex flex-col gap-2 text-sm" data-tape-active-records>
						<strong>{l("Current execution records", "当前成交记录")}</strong>
						{state.active.length ? (
							state.active.map((record) => (
								<p key={record.id} className="font-mono text-xs">
									{record.id}: {record.quantity} @ {price(record.price)}
								</p>
							))
						) : (
							<p>{l("No active records yet", "暂无有效记录")}</p>
						)}
					</div>
					<Alert role="note">
						<AlertTitle>{event}</AlertTitle>
						<AlertDescription>
							{current?.kind === "duplicate"
								? l(
										"The supplied execution ID was already seen. This repeated message adds no new execution, quantity or premium. Similar price and time alone would not prove a duplicate.",
										"给定成交标识已出现。重复消息不新增成交、张数或权利金。仅凭相近价格与时间不能证明重复。",
									)
								: current?.kind === "correct"
									? l(
											"The correction explicitly targets the prior execution. Its revised price and quantity replace that report; they are not appended as another fill.",
											"更正明确指向原成交。修订后的价格与数量替换原报告，不追加为另一笔成交。",
										)
									: current?.kind === "cancel"
										? l(
												"The cancellation explicitly removes the linked execution from the current counted view. It is not an opposite-side trade. A later replay of the old ID must not resurrect it.",
												"撤销明确把关联成交从当前统计视图移除，不是一笔反向交易。之后重放旧标识也不应令其复活。",
											)
										: l(
												"The second received report has an earlier execution time than the first. Keep execution time and receipt time distinct, and use explicit identities for reconciliation.",
												"第二条收到的报告，其成交时间早于第一条。应区分成交时间与接收时间，并使用明确标识核对。",
											)}
						</AlertDescription>
					</Alert>
					<p className="text-muted-foreground text-xs">
						{l(
							"This teaching replay supplies normalized execution IDs and explicit revision links. Real feed namespaces and correction chains require the source specification. The view covers only these messages.",
							"此教学回放给定规范化成交标识与明确修订关联。真实数据的标识范围和更正链需按来源规范处理，当前视图仅覆盖这些消息。",
						)}
					</p>
					{state.unresolved ? (
						<p role="status">
							{l("Unresolved message references", "消息关联未解析")}:{" "}
							{state.unresolved}
						</p>
					) : null}
				</>
			}
		/>
	);
}
