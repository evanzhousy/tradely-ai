import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { FieldGroup } from "@tradely/ui/components/field";
import * as m from "motion/react-m";
import { createContext, useContext, useState } from "react";
import { quoteMoney as money } from "@/domain/learning/quote-concept";
import {
	classifyFlow,
	evaluateFlowEvidence,
	type FlowAggressor,
	type FlowSentiment,
	putBuyInventory,
	type SentimentConceptData,
	type SentimentOption,
} from "@/domain/learning/sentiment-concept";
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

export const SentimentData = createContext<SentimentConceptData | null>(null);
function useSentimentData() {
	const data = useContext(SentimentData);
	if (!data)
		throw new Error("Sentiment scenes require authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const text = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const labels: Record<FlowSentiment, readonly [string, string]> = {
	bullish: ["Bullish flow", "看涨成交流"],
	bearish: ["Bearish flow", "看跌成交流"],
	indeterminate: ["Direction indeterminate", "方向无法确定"],
};
const number = (n: number | null) =>
	n === null ? "—" : n.toLocaleString("en-US");
function Snapshot({
	locale,
	option = "PUT",
}: Props & { option?: SentimentOption }) {
	const data = useSentimentData();
	const l = text(locale);
	return (
		<p className="font-mono text-muted-foreground text-xs leading-relaxed">
			{data.contractBase} {option}
			<br />
			{data.date} · {data.printAt}
			<br />
			{l(
				"Fictional records · USD/share · quantity in contracts",
				"虚构记录 · 美元/股 · 数量单位：张",
			)}
		</p>
	);
}

export function DirectionMatrixScene({ locale }: Props) {
	const data = useSentimentData();
	const l = text(locale);
	const motion = useLessonMotion();
	const playback = useFrames(data.combinations.length);
	const pair = data.combinations[playback.frame];
	const sentiment = classifyFlow(pair.option, pair.aggressor);
	const language = locale === "zh" ? 1 : 0;
	const choose = (option: SentimentOption, aggressor: FlowAggressor) => {
		const i = data.combinations.findIndex(
			(p) => p.option === option && p.aggressor === aggressor,
		);
		if (i >= 0) playback.select(i);
	};
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Call and put buying and selling map to four isolated-leg directions",
						"看涨看跌期权的买卖映射四种孤立单腿方向",
					)}
					height={448}
				>
					<SvgText x={89} y={28} muted>
						{l("Likely BUY", "推断买入")}
					</SvgText>
					<SvgText x={271} y={28} muted>
						{l("Likely SELL", "推断卖出")}
					</SvgText>
					{data.combinations.map((p, i) => {
						const x = 14 + (i % 2) * 182;
						const y = 52 + Math.floor(i / 2) * 136;
						const bullish = classifyFlow(p.option, p.aggressor) === "bullish";
						return (
							<g key={`${p.option}:${p.aggressor}`}>
								<rect
									x={x}
									y={y}
									width="150"
									height="116"
									rx="12"
									className={
										i === playback.frame
											? "contract-svg-wash"
											: "contract-svg-paper"
									}
								/>
								<SvgText x={x + 75} y={y + 27} muted>
									{p.option} ·{" "}
									{p.aggressor === "buy" ? l("BUY", "买入") : l("SELL", "卖出")}
								</SvgText>
								<path
									d={
										bullish
											? `M${x + 49} ${y + 73}l52-26m-13 0h13v13`
											: `M${x + 49} ${y + 47}l52 26m-13 0h13v-13`
									}
									className="contract-svg-active-line"
								/>
								<SvgText x={x + 75} y={y + 101} strong>
									{bullish ? l("BULLISH", "看涨") : l("BEARISH", "看跌")}
								</SvgText>
							</g>
						);
					})}
					<m.g
						initial={false}
						animate={{
							x: 14 + (playback.frame % 2) * 182,
							y: 52 + Math.floor(playback.frame / 2) * 136,
						}}
						transition={motion ? lessonTransition : instantTransition}
						data-matrix-outline
					>
						<rect
							x="0"
							y="0"
							width="150"
							height="116"
							rx="12"
							className="contract-svg-active-line"
						/>
					</m.g>
					<rect
						x="36"
						y="331"
						width="288"
						height="72"
						rx="12"
						className="contract-svg-wash"
					/>
					<SvgText x={180} y={356} muted>
						{l("Likely aggressor's leg", "推断主动方的单腿")}
					</SvgText>
					<g data-matrix-sentiment>
						<SvgText x={180} y={387} strong>
							{labels[sentiment][language]}
						</SvgText>
					</g>
					<SvgText x={180} y={432} muted>
						{l("One print", "一笔成交")} · {data.quantity}{" "}
						{l("contracts", "张")}
					</SvgText>
				</Diagram>
			}
		>
			<Snapshot locale={locale} option={pair.option} />
			<FieldGroup>
				<ChoiceField
					label={l("Option type", "期权类型")}
					value={pair.option}
					options={[
						["CALL", l("Call", "看涨期权")],
						["PUT", l("Put", "看跌期权")],
					]}
					onChange={(option) => choose(option, pair.aggressor)}
				/>
				<ChoiceField
					label={l("Likely aggressor's action", "推断主动方的行为")}
					value={pair.aggressor}
					options={[
						["buy", l("Buying", "买入")],
						["sell", l("Selling", "卖出")],
					]}
					onChange={(aggressor) => choose(pair.option, aggressor)}
				/>
			</FieldGroup>
			<PlaybackButton
				playing={playback.playing}
				onClick={playback.toggle}
				l={l}
			/>
			<Alert role="note">
				<AlertTitle>{l("Name the perspective", "先明确观察视角")}</AlertTitle>
				<AlertDescription>
					{l(
						"This course labels the isolated leg from the likely aggressor's perspective. Call buying and put selling map to bullish flow; call selling and put buying map to bearish flow. These are directional conventions, not return forecasts.",
						"本课从推断主动方视角标记孤立单腿：买看涨或卖看跌映射看涨成交流，卖看涨或买看跌映射看跌成交流。这是方向约定，不是收益预测。",
					)}
				</AlertDescription>
			</Alert>
			<p className="text-sm" data-counterparty-perspective>
				{l(
					"The resting counterparty has the opposite leg. That does not create a second print or double the traded quantity.",
					"挂单对手方持相反单腿，但不会因此产生第二笔成交或双倍成交量。",
				)}
			</p>
		</SceneLayout>
	);
}

export function FlowEvidenceScene({ locale }: Props) {
	const data = useSentimentData();
	const l = text(locale);
	const language = locale === "zh" ? 1 : 0;
	const motion = useLessonMotion();
	const [id, setId] = useState(data.evidence[0].id);
	const [answer, setAnswer] = useState("unanswered");
	const record = data.evidence.find((e) => e.id === id) ?? data.evidence[0];
	const result = evaluateFlowEvidence(
		`${data.contractBase} PUT`,
		"PUT",
		record,
	);
	const supported = result.aggressor !== null;
	const reason =
		result.issue === "stale"
			? l("Stale reference", "参考已过时")
			: result.issue === "missing"
				? l("Reference missing", "参考缺失")
				: result.issue === "complex"
					? l("Review complex leg", "审查复杂单腿")
					: result.issue
						? l("Reference not usable", "参考不可用")
						: result.code === "MID"
							? l("Initiator unresolved", "主动方未确定")
							: l("Matched simple quote", "匹配简单报价");
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Execution evidence supports or stops a flow-label inference",
						"执行证据支持或阻止成交流标签推断",
					)}
					height={440}
				>
					<rect
						x="36"
						y="15"
						width="288"
						height="77"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={42} muted>
						{l("Recorded PUT print", "看跌期权成交记录")}
					</SvgText>
					<g data-flow-print>
						<SvgText x={180} y={74} strong>
							{data.quantity} @ {money(record.price)}
						</SvgText>
					</g>
					<path
						d="M180 92v28M180 188v30M180 282v29"
						className="contract-svg-line"
					/>
					<rect
						x="36"
						y="120"
						width="288"
						height="68"
						rx="12"
						className={
							result.issue ? "contract-svg-paper" : "contract-svg-wash"
						}
					/>
					<SvgText x={180} y={146} muted>
						{reason}
					</SvgText>
					<SvgText x={180} y={174}>
						{record.reference.bid === null ? "—" : money(record.reference.bid)}{" "}
						/{" "}
						{record.reference.ask === null ? "—" : money(record.reference.ask)}
					</SvgText>
					<rect
						x="36"
						y="218"
						width="288"
						height="64"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={242} muted>
						{l("Likely aggressor", "推断主动方")}
					</SvgText>
					<g data-flow-aggressor>
						<SvgText x={180} y={267} strong>
							{result.aggressor === "buy"
								? l("Buyer", "买方")
								: result.aggressor === "sell"
									? l("Seller", "卖方")
									: l("Unknown", "未知")}
						</SvgText>
					</g>
					{supported ? (
						<m.path
							key={id}
							d="M180 92v28m0 68v30m0 64v29"
							className="contract-svg-active-line"
							initial={{ pathLength: motion ? 0 : 1 }}
							animate={{ pathLength: 1 }}
							transition={
								motion
									? { ...lessonTransition, duration: 0.45 }
									: instantTransition
							}
						/>
					) : (
						<path d="M168 201h24" className="contract-svg-line" />
					)}
					<rect
						x="14"
						y="311"
						width="332"
						height="77"
						rx="12"
						className={supported ? "contract-svg-wash" : "contract-svg-paper"}
					/>
					<SvgText x={180} y={337} muted>
						{l("Flow label under this convention", "本约定下的成交流标签")}
					</SvgText>
					<g data-flow-sentiment>
						<SvgText x={180} y={369} strong>
							{supported
								? labels[result.sentiment][language]
								: l("Indeterminate", "方向无法确定")}
						</SvgText>
					</g>
					<SvgText x={180} y={422} muted>
						{l("One print stays one print", "一笔成交仍是一笔成交")}
					</SvgText>
				</Diagram>
			}
		>
			<Snapshot locale={locale} />
			<FieldGroup>
				<SelectField
					label={l("Execution evidence", "执行证据")}
					value={id}
					options={data.evidence.map((e) => [e.id, e.label[language]])}
					onChange={(value) => {
						setId(value);
						setAnswer("unanswered");
					}}
				/>
				{!supported ? (
					<ChoiceField
						label={l("What does neutral mean here?", "此处中性表示什么？")}
						value={answer}
						options={[
							["unknown", l("Unknown direction", "方向未知")],
							["flat", l("Expects a flat market", "预期横盘")],
							["hedged", l("Neutral portfolio", "组合中性")],
						]}
						onChange={setAnswer}
					/>
				) : null}
			</FieldGroup>
			<p className="font-mono text-muted-foreground text-xs">
				{l("Quote time", "报价时间")}: {record.reference.at ?? "—"}
			</p>
			<Alert role={answer === "unanswered" ? "note" : "status"}>
				<AlertTitle>
					{supported
						? l("A conditional flow inference", "有条件的成交流推断")
						: answer === "unanswered"
							? l("Neutral means indeterminate", "中性表示无法确定")
							: answer === "unknown"
								? l("Supported by the evidence", "得到证据支持")
								: l("The evidence does not say that", "证据不支持该结论")}
				</AlertTitle>
				<AlertDescription>
					{supported
						? l(
								"The usable simple quote supports a likely buying or selling inference here. The put mapping follows from that inference, not from the word PUT alone. Participant intent and the full portfolio remain unknown.",
								"此处可用的简单报价支持推断买入或卖出，再据此映射看跌期权方向，而不是只看 PUT 一词。参与者意图与完整组合仍未知。",
							)
						: l(
								"The evidence does not establish a reliable direction. Neutral is an uncertainty label here; it does not mean the investor expects a flat market or owns a delta-neutral portfolio. Keep the recorded price and quantity.",
								"证据不能确定可靠方向。此处中性标记不确定性，不表示投资者预期横盘，也不表示组合 Delta 中性。保留成交价与数量。",
							)}
				</AlertDescription>
			</Alert>
		</SceneLayout>
	);
}

export function PositionScopeScene({ locale }: Props) {
	const data = useSentimentData();
	const l = text(locale);
	const language = locale === "zh" ? 1 : 0;
	const motion = useLessonMotion();
	const playback = useFrames(3);
	const [id, setId] = useState(data.contexts[0].id);
	const context = data.contexts.find((c) => c.id === id) ?? data.contexts[0];
	const done = playback.frame === 2;
	const after = putBuyInventory(context, data.quantity, true);
	const stages = [
		l("Before execution", "成交前"),
		l("Recorded buy", "买入成交记录"),
		l("After execution", "成交后"),
	];
	const known = context.meaning !== "unknown";
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"The same put buy enters different supplied position contexts",
						"同一看跌买入对应不同给定持仓背景",
					)}
					height={530}
				>
					<SvgText x={180} y={23} muted>
						{l("Before · supplied inventory", "之前 · 给定持仓")}
					</SvgText>
					<rect
						x="14"
						y="40"
						width="332"
						height="78"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={95} y={65} muted>
						{l("Shares", "股票")}
					</SvgText>
					<SvgText x={265} y={65} muted>
						{l("Put contracts", "看跌合约")}
					</SvgText>
					<SvgText x={95} y={100} strong>
						{number(context.beforeShares)}
					</SvgText>
					<SvgText x={265} y={100} strong>
						{number(context.beforePuts)}
					</SvgText>
					<path d="M180 118v38M180 242v47" className="contract-svg-line" />
					{playback.frame > 0 ? (
						<m.path
							key={`${id}:${playback.frame}`}
							d={`M180 118v38${done ? "m0 86v47" : ""}`}
							className="contract-svg-active-line"
							initial={{ pathLength: motion ? 0 : 1 }}
							animate={{ pathLength: 1 }}
							transition={
								motion
									? { ...lessonTransition, duration: 0.45 }
									: instantTransition
							}
						/>
					) : null}
					<rect
						x="36"
						y="156"
						width="288"
						height="86"
						rx="12"
						className="contract-svg-wash"
					/>
					<SvgText x={180} y={182} muted>
						{l("Same completed PUT buy", "同一已完成看跌买入")}
					</SvgText>
					<SvgText x={180} y={213} strong>
						{data.quantity} @ {money(data.price)}
					</SvgText>
					<g data-scope-flow>
						<SvgText x={180} y={235} muted>
							{labels.bearish[language]} · {l("leg only", "仅单腿")}
						</SvgText>
					</g>
					<rect
						x="14"
						y="289"
						width="332"
						height="86"
						rx="12"
						className={
							done && known ? "contract-svg-wash" : "contract-svg-paper"
						}
					/>
					<SvgText x={180} y={313} muted>
						{done
							? l("After · linked inventory", "之后 · 关联持仓")
							: l("After · advance the replay", "之后 · 继续回放")}
					</SvgText>
					<g data-scope-shares>
						<SvgText x={95} y={347} strong>
							{done ? number(after.shares) : "—"}
						</SvgText>
					</g>
					<g data-scope-puts>
						<SvgText x={265} y={347} strong>
							{done ? number(after.puts) : "—"}
						</SvgText>
					</g>
					<SvgText x={95} y={367} muted>
						{l("shares", "股")}
					</SvgText>
					<SvgText x={265} y={367} muted>
						{l("put contracts", "张看跌期权")}
					</SvgText>
					<SvgText x={180} y={410} muted>
						{l("− short · + long · — unknown", "− 空头 · + 多头 · — 未知")}
					</SvgText>
					<path d="M40 456H320" className="contract-svg-line" />
					{[40, 180, 320].map((x) => (
						<circle
							key={x}
							cx={x}
							cy="456"
							r="5"
							className="contract-svg-dot"
						/>
					))}
					<m.circle
						initial={false}
						cx={40 + playback.frame * 140}
						cy="456"
						r="10"
						className="contract-svg-handle"
						animate={{ cx: 40 + playback.frame * 140 }}
						transition={
							playback.playing && motion ? lessonTransition : instantTransition
						}
					/>
					<foreignObject x="20" y="416" width="320" height="80">
						<input
							type="range"
							className="contract-range contract-svg-range"
							aria-label={l("Position replay timeline", "持仓回放时间轴")}
							aria-valuetext={stages[playback.frame]}
							min={0}
							max={2}
							step={1}
							value={playback.frame}
							onPointerDown={() => playback.select(playback.frame)}
							onKeyDown={() => playback.select(playback.frame)}
							onChange={(e) => playback.select(Number(e.target.value))}
						/>
					</foreignObject>
					<SvgText x={45} y={510} muted>
						{l("Before", "之前")}
					</SvgText>
					<SvgText x={180} y={510} muted>
						{l("Buy", "买入")}
					</SvgText>
					<SvgText x={315} y={510} muted>
						{l("After", "之后")}
					</SvgText>
				</Diagram>
			}
		>
			<Snapshot locale={locale} />
			<FieldGroup>
				<SelectField
					label={l("Position context", "持仓背景")}
					value={id}
					options={data.contexts.map((c) => [c.id, c.label[language]])}
					onChange={(value) => {
						playback.select(playback.frame);
						setId(value);
					}}
				/>
				<div
					onPointerDownCapture={() => playback.select(playback.frame)}
					onKeyDownCapture={() => playback.select(playback.frame)}
				>
					<RangeControl
						label={l("Replay step", "回放阶段")}
						value={playback.frame}
						display={stages[playback.frame]}
						min={0}
						max={2}
						onChange={playback.select}
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
					{context.meaning === "protection"
						? l("A put can protect stock", "看跌期权可以保护股票")
						: context.meaning === "close"
							? l("A purchase can close a short", "买入也可以平掉空头")
							: l(
									"No linkage means no portfolio conclusion",
									"没有关联，就无法判断组合",
								)}
				</AlertTitle>
				<AlertDescription>
					{context.meaning === "protection"
						? l(
								`The supplied record links ${data.quantity} puts to ${number(context.beforeShares)} shares (${data.multiplier} shares per contract). This is stock protection, not proof of an overall bearish portfolio. Premium cost and the rest of the portfolio are not shown.`,
								`给定记录将 ${data.quantity} 张看跌期权关联到 ${number(context.beforeShares)} 股股票（每张对应 ${data.multiplier} 股）。这是股票保护，不证明整体组合看跌。未展示权利金成本与组合其他部分。`,
							)
						: context.meaning === "close"
							? l(
									"The linked buy-to-close removes the existing short puts. Zero remaining puts is not a new bearish put position, and says nothing about unspecified holdings.",
									"关联买入平仓移除了原有空头看跌。剩余零张不是新建看跌多头，也不说明未给出的其他持仓。",
								)
							: l(
									"The print establishes a purchase in this supplied history. Without opening/closing or holding linkage, the before and after positions remain unknown. Unknown shares are not zero shares.",
									"在给定历史中，此成交确定了买入行为。没有开平仓或持仓关联，成交前后的持仓仍未知。股票持仓未知不等于零股。",
								)}
				</AlertDescription>
			</Alert>
			<p className="text-sm" data-scope-boundary>
				{l(
					"The same bearish flow label survives every context. Full-portfolio exposure, investor belief and future returns require more evidence.",
					"相同看跌成交流标签适用于每种背景。完整组合敞口、投资者观点与未来收益需要更多证据。",
				)}
			</p>
		</SceneLayout>
	);
}
