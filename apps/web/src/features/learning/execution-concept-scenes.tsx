import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { Button } from "@tradely/ui/components/button";
import { FieldGroup } from "@tradely/ui/components/field";
import * as m from "motion/react-m";
import { createContext, useContext, useState } from "react";
import {
	type ExecutionConceptData,
	type ExecutionSide,
	executionRoles,
	matchDisplayedBook,
	executionMoney as money,
	type OrderInstruction,
} from "@/domain/learning/execution-concept";
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

export const ExecutionData = createContext<ExecutionConceptData | null>(null);
function useExecutionData() {
	const data = useContext(ExecutionData);
	if (!data)
		throw new Error("Execution scenes require authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const text = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
function Snapshot({
	locale,
	type = "CALL",
}: Props & { type?: "CALL" | "PUT" }) {
	const data = useExecutionData();
	const l = text(locale);
	return (
		<p className="font-mono text-muted-foreground text-xs leading-relaxed">
			{data.contractBase} {type}
			<br />
			{data.asOf}
			<br />
			{l(
				"Fictional book · USD/share · sizes in contracts",
				"虚构订单簿 · 美元/股 · 数量单位：张",
			)}
		</p>
	);
}
function IncomingSide({
	locale,
	side,
	onChange,
}: Props & { side: ExecutionSide; onChange: (side: ExecutionSide) => void }) {
	const l = text(locale);
	return (
		<ChoiceField
			label={l("Incoming order", "主动到来的订单")}
			value={side}
			options={[
				["buy", l("Buy", "买入")],
				["sell", l("Sell", "卖出")],
			]}
			onChange={onChange}
		/>
	);
}

export function CounterpartyScene({ locale }: Props) {
	const data = useExecutionData();
	const l = text(locale);
	const motion = useLessonMotion();
	const [side, setSide] = useState<ExecutionSide>("buy");
	const [type, setType] = useState<"CALL" | "PUT">("CALL");
	const playback = useFrames(3);
	const done = playback.frame === 2;
	const result = executionRoles(data, side, done);
	const stages = [
		l("Resting quote", "挂单报价"),
		l("Incoming instruction", "主动指令到达"),
		l("Confirmed match", "撮合已确认"),
	];
	const path = (x: number) => `M${x} 165v32H180v40`;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Buyer and seller participate in one shared execution",
						"买方与卖方参与同一成交",
					)}
					height={420}
				>
					<SvgText x={180} y={26} muted>
						{type} · {stages[playback.frame]}
					</SvgText>
					{["buyer", "seller"].map((role, i) => {
						const incoming = result[role as "buyer" | "seller"] === "incoming";
						const x = 89 + i * 182;
						return (
							<g key={role}>
								<rect
									x={14 + i * 182}
									y="51"
									width="150"
									height="114"
									rx="12"
									className={
										incoming ? "contract-svg-wash" : "contract-svg-paper"
									}
								/>
								<SvgText x={x} y={80} strong>
									{role === "buyer" ? l("BUYER", "买方") : l("SELLER", "卖方")}
								</SvgText>
								<SvgText x={x} y={108} muted>
									{incoming
										? l("Incoming", "主动到来")
										: l("Resting", "已挂单")}
								</SvgText>
								<SvgText x={x} y={139}>
									{done
										? money(result.price)
										: incoming
											? l("Seeks a fill", "请求撮合")
											: `${money(result.price)} ${l("quote", "报价")}`}
								</SvgText>
								<path d={path(x)} className="contract-svg-line" />
								{done || (playback.frame === 1 && incoming) ? (
									<m.path
										key={`${side}:${playback.frame}`}
										d={path(x)}
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
							</g>
						);
					})}
					<rect
						x="53"
						y="237"
						width="254"
						height="82"
						rx="12"
						className={done ? "contract-svg-wash" : "contract-svg-paper"}
					/>
					<SvgText x={180} y={264} muted>
						{done
							? `${result.location} · ${data.printedAt}`
							: l("Waiting for an execution", "等待成交")}
					</SvgText>
					<SvgText x={180} y={297} strong>
						{done ? `${data.unitTradeSize} @ ${money(result.price)}` : "—"}
					</SvgText>
					<g data-execution-prints>
						<SvgText x={95} y={368} strong>
							{result.prints}{" "}
							{l(result.prints === 1 ? "print" : "prints", "笔成交")}
						</SvgText>
					</g>
					<g data-execution-volume>
						<SvgText x={265} y={368} strong>
							{result.volume} {l("contracts", "张")}
						</SvgText>
					</g>
					<SvgText x={180} y={400} muted>
						{l("Two participants ≠ double volume", "两方参与 ≠ 双倍成交量")}
					</SvgText>
				</Diagram>
			}
		>
			<Snapshot locale={locale} type={type} />
			<FieldGroup>
				<IncomingSide
					locale={locale}
					side={side}
					onChange={(v) => {
						playback.select(playback.frame);
						setSide(v);
					}}
				/>
				<ChoiceField
					label={l("Option type", "期权类型")}
					value={type}
					options={[
						["CALL", l("Call", "看涨")],
						["PUT", l("Put", "看跌")],
					]}
					onChange={(v) => {
						playback.select(playback.frame);
						setType(v);
					}}
				/>
				<SelectField
					label={l("Match stage", "撮合阶段")}
					value={String(playback.frame)}
					options={stages.map((v, i) => [String(i), v])}
					onChange={(v) => playback.select(Number(v))}
				/>
			</FieldGroup>
			<PlaybackButton
				playing={playback.playing}
				onClick={playback.toggle}
				l={l}
			/>
			<Alert role="note">
				<AlertTitle>
					{l("Who demanded immediacy?", "谁要求立即成交？")}
				</AlertTitle>
				<AlertDescription>
					<p data-execution-aggressor>
						{side === "buy"
							? l(
									"The incoming buyer takes the ask. The resting seller sells at that same ask.",
									"主动买方接受卖价，挂单卖方也在同一卖价卖出。",
								)
							: l(
									"The incoming seller takes the bid. The resting buyer buys at that same bid.",
									"主动卖方接受买价，挂单买方也在同一买价买入。",
								)}
					</p>
				</AlertDescription>
			</Alert>
			<p className="text-muted-foreground text-xs">
				{l(
					"Call and put examples reuse one invented quote. Neither option type nor counterparty role proves intent, identity, or an opening/closing instruction. Roles here come from the supplied order history.",
					"看涨与看跌示例复用同一虚构报价。期权类型或买卖角色都不证明意图、身份或开平仓指令。此处角色来自给定订单历史。",
				)}
			</p>
		</SceneLayout>
	);
}

export function LiquidityScene({ locale }: Props) {
	const data = useExecutionData();
	const l = text(locale);
	const [side, setSide] = useState<ExecutionSide>("buy");
	const [instruction, setInstruction] = useState<OrderInstruction>("limit");
	const [quantity, setQuantity] = useState(data.defaultQuantity);
	const [limit, setLimit] = useState(data.asks[0].price);
	const levels = side === "buy" ? data.asks : data.bids;
	const range = side === "buy" ? data.buyLimitRange : data.sellLimitRange;
	const result = matchDisplayedBook(
		levels,
		side,
		quantity,
		instruction === "limit" ? limit : null,
	);
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"An incoming order matches eligible displayed price levels",
						"主动订单与符合限价的可见价位撮合",
					)}
					height={466}
				>
					<rect
						x="40"
						y="14"
						width="280"
						height="65"
						rx="12"
						className="contract-svg-wash"
					/>
					<SvgText x={180} y={42} strong>
						{side === "buy" ? l("BUY", "买入") : l("SELL", "卖出")} {quantity}
					</SvgText>
					<SvgText x={180} y={65} muted>
						{instruction === "market"
							? l("Market · no price limit", "市价 · 无限价")
							: `${side === "buy" ? "≤" : "≥"} ${money(limit)}`}
					</SvgText>
					<SvgText x={70} y={111} muted>
						{side === "buy" ? l("Ask", "卖价") : l("Bid", "买价")}
					</SvgText>
					<SvgText x={180} y={111} muted>
						{l("Available", "可见数量")}
					</SvgText>
					<SvgText x={290} y={111} muted>
						{l("Matched", "撮合数量")}
					</SvgText>
					{result.rows.map((row, i) => {
						const y = 125 + i * 76;
						return (
							<g
								key={row.price}
								data-depth-price={row.price}
								data-depth-filled={row.filled}
								data-depth-eligible={row.eligible}
							>
								<rect
									x="14"
									y={y}
									width="332"
									height="64"
									rx="10"
									className={
										row.filled ? "contract-svg-wash" : "contract-svg-paper"
									}
								/>
								<SvgText x={70} y={y + 28}>
									{money(row.price)}
								</SvgText>
								<SvgText x={180} y={y + 28}>
									{row.size}
								</SvgText>
								<SvgText x={290} y={y + 28} strong>
									{row.eligible ? row.filled : "—"}
								</SvgText>
								<rect
									x="28"
									y={y + 45}
									width="304"
									height="7"
									rx="3.5"
									className="contract-svg-wash"
								/>
								<rect
									x="28"
									y={y + 45}
									width={row.size ? (304 * row.filled) / row.size : 0}
									height="7"
									rx="3.5"
									className="contract-svg-dot"
								/>
							</g>
						);
					})}
					<SvgText x={180} y={368} muted>
						{l("— = price outside the limit", "— = 价格超出限价")}
					</SvgText>
					<rect
						x="14"
						y="386"
						width="332"
						height="64"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={95} y={408} muted>
						{l("Matched here", "此处已撮合")}
					</SvgText>
					<SvgText x={265} y={408} muted>
						{l("Unfilled here", "此处未成交")}
					</SvgText>
					<g data-depth-total>
						<SvgText x={95} y={435} strong>
							{result.filled}
						</SvgText>
					</g>
					<g data-depth-unfilled>
						<SvgText x={265} y={435} strong>
							{result.unfilled}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<Snapshot locale={locale} />
			<FieldGroup>
				<IncomingSide
					locale={locale}
					side={side}
					onChange={(v) => {
						setSide(v);
						setLimit(v === "buy" ? data.asks[0].price : data.bids[0].price);
					}}
				/>
				<ChoiceField
					label={l("Order instruction", "订单指令")}
					value={instruction}
					options={[
						["limit", l("Limit", "限价")],
						["market", l("Market", "市价")],
					]}
					onChange={setInstruction}
				/>
				<RangeControl
					label={l("Requested quantity", "请求数量")}
					value={quantity}
					display={`${quantity} ${l("contracts", "张")}`}
					min={1}
					max={data.maxQuantity}
					onChange={setQuantity}
				/>
				{instruction === "limit" ? (
					<RangeControl
						label={l("Limit price", "限价价格")}
						value={limit}
						display={money(limit)}
						min={range[0]}
						max={range[1]}
						onChange={setLimit}
					/>
				) : null}
			</FieldGroup>
			<p className="text-sm" data-depth-average>
				{l("Average matched price (rounded)", "撮合均价（已四舍五入）")}:{" "}
				<strong>{result.average === null ? "—" : money(result.average)}</strong>
			</p>
			<Alert role="note">
				<AlertTitle>
					{instruction === "limit"
						? l("Price protection, not a fill promise", "限制价格，不保证成交")
						: l("Available prices can differ", "可用价格可能不同")}
				</AlertTitle>
				<AlertDescription>
					{instruction === "limit"
						? l(
								"A buy limit accepts its limit or lower; a sell limit accepts its limit or higher. Unfilled quantity may rest or cancel according to the order's time-in-force; it is not an execution.",
								"买入限价接受限价或更低价格，卖出限价接受限价或更高价格。未成交部分可能依有效期设置挂单或取消，不属于成交。",
							)
						: l(
								"This market order can reach every displayed level. Its average changes as it consumes depth. There is no limit-price protection; fills beyond the displayed book are unknown here.",
								"此市价单可触及所有展示价位。消耗深度会改变均价，且没有限价保护。本例无法确定展示订单簿以外的成交。",
							)}
				</AlertDescription>
			</Alert>
			<p className="text-muted-foreground text-xs">
				{l(
					"What-if match: each row is eligible displayed liquidity in price order. No earlier orders, replenishment, cancellations, hidden liquidity, routing or fees. Real fills depend on those conditions.",
					"假设撮合：每行是按价格排序的合格可见流动性，无排在前面的订单、补单、撤单、隐藏流动性、路由或费用。真实成交取决于这些条件。",
				)}
			</p>
		</SceneLayout>
	);
}

export function OrderEvidenceScene({ locale }: Props) {
	const data = useExecutionData();
	const l = text(locale);
	const motion = useLessonMotion();
	const [example, setExample] = useState(data.records[0]?.id ?? "");
	const [revealed, setRevealed] = useState(false);
	const [guess, setGuess] = useState("unanswered");
	const record = data.records.find((r) => r.id === example);
	const instruction = revealed ? record?.instruction : null;
	const choices = [
		["market", l("Market", "市价")],
		["limit", l("Limit", "限价")],
		["unknown", l("Cannot tell", "无法确定")],
	] as const;
	const correct = guess === (instruction ?? "unknown");
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Two possible order instructions can produce the same trade print",
						"两种可能订单指令可以产生相同成交记录",
					)}
					height={400}
				>
					<SvgText x={180} y={28} muted>
						{l("Possible incoming buy orders", "可能的主动买入订单")}
					</SvgText>
					{(["market", "limit"] as const).map((kind, i) => {
						const x = 89 + i * 182;
						const selected = instruction === kind;
						return (
							<g key={kind}>
								<rect
									x={14 + i * 182}
									y="52"
									width="150"
									height="90"
									rx="12"
									className={
										selected ? "contract-svg-wash" : "contract-svg-paper"
									}
								/>
								<SvgText x={x} y={80}>
									{kind === "market"
										? l("Market buy", "市价买入")
										: l("Buy limit", "限价买入")}
								</SvgText>
								<SvgText x={x} y={107} strong>
									{kind === "market"
										? l("No limit", "不限价格")
										: money(data.asks[0].price)}
								</SvgText>
								<SvgText x={x} y={130} muted>
									{data.unitTradeSize} {l("contracts", "张")}
								</SvgText>
								<path
									d={`M${x} 142v32H180v34`}
									className="contract-svg-line"
									strokeDasharray={revealed ? undefined : "5 5"}
								/>
								{selected ? (
									<m.path
										key={example}
										d={`M${x} 142v32H180v34`}
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
							</g>
						);
					})}
					<rect
						x="36"
						y="208"
						width="288"
						height="84"
						rx="12"
						className="contract-svg-wash"
					/>
					<SvgText x={180} y={234} muted>
						{l("Recorded print", "成交记录")} · {data.printId}
					</SvgText>
					<g data-evidence-print>
						<SvgText x={180} y={264} strong>
							{data.unitTradeSize} @ {money(data.asks[0].price)}
						</SvgText>
					</g>
					<SvgText x={180} y={284} muted>
						{data.printedAt}
					</SvgText>
					<SvgText x={180} y={330} muted>
						{l("Original instruction", "原始指令")}
					</SvgText>
					<g data-evidence-instruction>
						<SvgText x={180} y={362} strong>
							{instruction === "market"
								? l("Market buy", "市价买入")
								: instruction === "limit"
									? l("Buy limit", "限价买入")
									: l("Unknown from print", "仅成交记录无法确定")}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<Snapshot locale={locale} />
			<FieldGroup>
				<ChoiceField
					label={l("Compare possible histories", "比较可能历史")}
					value={example}
					options={data.records.map((r) => [
						r.id,
						`${l("Example", "示例")} ${r.id}`,
					])}
					onChange={(v) => {
						setExample(v);
						setRevealed(false);
						setGuess("unanswered");
					}}
				/>
				<ChoiceField
					label={l(
						"What instruction does this evidence establish?",
						"这些证据能确定哪种指令？",
					)}
					value={guess}
					options={choices}
					onChange={setGuess}
				/>
			</FieldGroup>
			{guess !== "unanswered" ? (
				<Alert role="status">
					<AlertTitle>
						{correct
							? l("Supported by this evidence", "得到当前证据支持")
							: l("Look at the evidence boundary", "注意证据边界")}
					</AlertTitle>
					<AlertDescription>
						{revealed
							? l(
									"The supplied order record establishes the instruction in this example. The print alone did not.",
									"给定订单记录确定了本例的指令类型，单凭成交记录无法做到。",
								)
							: l(
									"Both illustrated instructions can produce this same price and size. A print alone does not identify market versus limit, aggressor, identity, or strategy.",
									"两种示例指令都可产生相同价格和数量。单凭成交记录不能确定市价或限价、主动方、身份或策略。",
								)}
					</AlertDescription>
				</Alert>
			) : null}
			<Button
				variant="outline"
				onClick={() => {
					setRevealed(!revealed);
					setGuess("unanswered");
				}}
			>
				{revealed
					? l("Hide order record", "隐藏订单记录")
					: l("Reveal order record", "查看订单记录")}
			</Button>
			<Alert role="note">
				<AlertTitle>
					{revealed
						? `${l("Order record", "订单记录")} ${example}`
						: l("Available evidence: print only", "可用证据：仅成交记录")}
				</AlertTitle>
				<AlertDescription>
					<p data-evidence-record>
						{revealed
							? `${l("Incoming buyer", "主动买方")} · ${record?.instruction === "limit" && record.limit !== null ? `${l("buy limit", "买入限价")} ${money(record.limit)}` : l("market buy", "市价买入")} · ${data.unitTradeSize} ${l("contracts", "张")}. ${l("Matched with a resting seller.", "与挂单卖方撮合。")}`
							: l(
									"The two paths are possible histories, not two trades. Reveal the extra record to identify this example's instruction.",
									"两条路径代表可能的历史，而非两笔成交。查看额外记录以识别本例指令。",
								)}
					</p>
				</AlertDescription>
			</Alert>
		</SceneLayout>
	);
}
