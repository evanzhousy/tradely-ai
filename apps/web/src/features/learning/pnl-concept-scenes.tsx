import * as m from "motion/react-m";
import { createContext, type ReactNode, useContext, useState } from "react";
import {
	markedAccount,
	optionValuation,
	type PnlConceptData,
	stockAccounting,
} from "@/domain/learning/pnl-concept";
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
import { lessonTransition, useLessonMotion } from "./lesson-motion";
export const PnlData = createContext<PnlConceptData | null>(null);
function useData() {
	const data = useContext(PnlData);
	if (!data) throw new Error("P&L scenes require authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const copy = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const number = (v: number | null) =>
	v === null ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: 2 });
const money = (v: number | null, sign = false) =>
	v === null
		? "—"
		: `${v < 0 ? "−" : sign && v > 0 ? "+" : ""}$${number(Math.abs(v) / 100)}`;
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
				"USD valuation examples, not a connected brokerage account",
				"美元估值示例，不是已连接券商账户",
			)}
		</p>
	);
}
export function StockAccountingScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [id, setId] = useState(data.stockCases[0].id);
	const [method, setMethod] = useState<"fifo" | "average">("fifo");
	const [fees, setFees] = useState("exclude");
	const [knownMark, setKnownMark] = useState(true);
	const [customMark, setCustomMark] = useState<number | null>(null);
	const replay = useFrames(3);
	const [manual, setManual] = useState<number | null>(2);
	const phase = manual ?? replay.frame;
	const source = data.stockCases.find((c) => c.id === id) ?? data.stockCases[0];
	const mark = knownMark
		? (customMark ??
			[source.initialMark, source.closeMark, source.finalMark][phase])
		: null;
	const lots = source.lots.map((l) => ({
		...l,
		feeCents: fees === "missing" ? null : l.feeCents,
	}));
	const close = {
		...source.close,
		quantity: phase === 0 ? 0 : source.close.quantity,
		feeCents: fees === "missing" ? null : source.close.feeCents,
	};
	const result = stockAccounting(lots, close, mark, method, fees !== "exclude");
	const enabled = useLessonMotion();
	const stop = () => {
		replay.select(phase);
		setManual(phase);
	};
	const stages = [
		l("After buys", "买入后"),
		l("Close filled", "平仓成交"),
		l("End mark", "期末估值"),
	];
	if (!result)
		return (
			<p role="status">
				{l("Source inputs are unavailable", "来源输入不可用")}
			</p>
		);
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Lots and realized unrealized results",
						"批次及已实现未实现结果",
					)}
					height={525}
				>
					<line
						x1={50}
						x2={310}
						y1={25}
						y2={25}
						stroke="currentColor"
						opacity={0.2}
					/>
					{enabled && replay.playing ? (
						<m.circle
							cx={50 + phase * 130}
							cy={25}
							r={6}
							fill="var(--primary)"
							initial={false}
							animate={{ cx: 50 + phase * 130 }}
							transition={lessonTransition}
						/>
					) : (
						<circle cx={50 + phase * 130} cy={25} r={6} fill="var(--primary)" />
					)}
					{stages.map((label, i) => (
						<foreignObject
							key={label}
							x={10 + i * 130}
							y={42}
							width={80}
							height={42}
						>
							<button
								type="button"
								className="h-full w-full rounded-lg border text-xs"
								onClick={() => {
									replay.select(i);
									setManual(i);
									setCustomMark(null);
								}}
							>
								{label}
							</button>
						</foreignObject>
					))}
					{result.matched.map((lot, i) => (
						<g key={lot.id}>
							<SvgText x={180} y={115 + i * 90}>
								{lot.id}: {lot.quantity} × {money(lot.priceCents)}
							</SvgText>
							<rect
								x={35}
								y={131 + i * 90}
								width={290}
								height={18}
								rx={5}
								fill="currentColor"
								opacity={0.08}
							/>
							<rect
								x={35}
								y={131 + i * 90}
								width={(290 * lot.closed) / lot.quantity}
								height={18}
								rx={5}
								fill="var(--primary)"
							/>
							<SvgText x={180} y={172 + i * 90} muted>
								{l("Closed-cost allocation", "平仓成本分配")}:{" "}
								{number(lot.closed)} / {lot.quantity}
							</SvgText>
						</g>
					))}
					<SvgText x={180} y={301}>
						{l("Realized P&L", "已实现盈亏")}
					</SvgText>
					<g data-pnl-realized>
						<SvgText x={180} y={335} strong>
							{money(result.realized, true)}
						</SvgText>
					</g>
					<SvgText x={180} y={382}>
						{l("Unrealized P&L", "未实现盈亏")}
					</SvgText>
					<g data-pnl-unrealized>
						<SvgText x={180} y={416} strong>
							{money(result.unrealized, true)}
						</SvgText>
					</g>
					<SvgText x={180} y={473}>
						{l("Remaining shares", "剩余股数")}: {result.remaining}
					</SvgText>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Supplied stock lots", "给定股票批次")}
				value={id}
				options={data.stockCases.map((c) => [
					c.id,
					c.label[locale === "zh" ? 1 : 0],
				])}
				onChange={(v) => {
					setId(v);
					replay.select(2);
					setManual(2);
					setCustomMark(null);
				}}
			/>
			<SelectField
				label={l("Cost attribution", "成本归因")}
				value={method}
				options={[
					["fifo", "FIFO"],
					["average", l("Pooled average illustration", "合并平均成本示例")],
				]}
				onChange={(v) => {
					stop();
					setMethod(v as typeof method);
				}}
			/>
			<SelectField
				label={l("Fee treatment", "费用处理")}
				value={fees}
				options={[
					["exclude", l("Before fees", "费用前")],
					["include", l("Include supplied fees", "纳入给定费用")],
					["missing", l("Fees unavailable", "费用不可用")],
				]}
				onChange={(v) => {
					stop();
					setFees(v);
				}}
			/>
			<SelectField
				label={l("Mark evidence", "估值证据")}
				value={knownMark ? "known" : "missing"}
				options={[
					["known", l("Mark supplied", "已提供估值")],
					["missing", l("Mark missing", "估值缺失")],
				]}
				onChange={(v) => {
					stop();
					setKnownMark(v === "known");
				}}
			/>
			{knownMark && (
				<RangeControl
					label={l("Hypothetical stock mark", "假设股票估值价")}
					value={mark ?? source.finalMark}
					display={money(mark)}
					min={1500}
					max={4000}
					step={100}
					onChange={(v) => {
						replay.select(2);
						setManual(2);
						setCustomMark(v);
					}}
				/>
			)}
			<PlaybackButton
				playing={replay.playing}
				onClick={() => {
					setManual(null);
					setCustomMark(null);
					replay.toggle();
				}}
				l={l}
			/>
			<p data-pnl-value>
				{l("Remaining marked value", "剩余估值")}: {money(result.value)}
			</p>
			<p data-pnl-basis>
				{l("Matched / remaining cost basis", "匹配 / 剩余成本基础")}:{" "}
				{money(result.closedCost)} / {money(result.openCost)}
				<br />
				{l("Remaining average basis per share", "剩余每股平均成本")}:{" "}
				{money(
					result.remaining > 0 && result.openCost !== null
						? result.openCost / result.remaining
						: null,
				)}
			</p>
			<p data-pnl-total>
				{l("Same-lot total P&L", "同批次总盈亏")}: {money(result.total, true)}
			</p>
			<p className="font-mono text-xs">
				{l("Gross realized / unrealized", "费用前已实现 / 未实现")}:{" "}
				{money(result.grossRealized, true)} /{" "}
				{money(result.grossUnrealized, true)}
				<br />
				{lots
					.map(
						(lot) => `${lot.id} ${lot.openedAt} · fee ${money(lot.feeCents)}`,
					)
					.join("; ")}
				<br />
				{l("Close", "平仓")}: {close.quantity} × {money(close.priceCents)} ·{" "}
				{source.close.at} · fee {money(close.feeCents)}
				<br />
				{l("Final source mark time", "期末来源估值时点")}: {source.markAt}
			</p>
			<Note>
				{l(
					"FIFO follows the supplied lot timestamps. Pooled average is a cost-attribution comparison; its bars show allocated cost fractions, not identified physical shares sold. Purchase fees are capitalized and allocated proportionally; the close fee is charged to realized P&L. Missing fees withhold affected net results. Use the same lots, period and fee basis before adding realized and unrealized results.",
					"FIFO 按给定批次时间排序。合并平均是成本归因比较，柱形表示分配成本比例，不识别实际卖出的物理股票。买入费用资本化并按比例分配，平仓费计入已实现盈亏。费用缺失时，受影响净结果不可用。相加前需保持批次、期间及费用口径一致。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"Marks are supplied checkpoint valuations; the slider is hypothetical. Neither is a guaranteed executable liquidation price.",
					"估值价来自给定检查点，滑块为假设值。两者均不保证可执行清仓价格。",
				)}
			</p>
		</SceneLayout>
	);
}
export function AccountCashScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [deposit, setDeposit] = useState(0);
	const [missing, setMissing] = useState("none");
	const [selected, setSelected] = useState("cash");
	const a = data.account;
	const result = markedAccount(
		a,
		deposit,
		missing === "stock" ? null : a.stockMark,
		missing === "option" ? null : a.optionMark,
	);
	if (!result) return null;
	const rows = [
		{ id: "cash", label: l("Cash", "现金"), value: result.cash },
		{
			id: "stock",
			label: l("Stock marked value", "股票估值"),
			value: result.stock,
		},
		{
			id: "option",
			label: l("Option marked value", "期权估值"),
			value: result.option,
		},
	];
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Marked account allocation and cash flows",
						"账户估值配置与现金流",
					)}
					height={455}
				>
					<SvgText x={180} y={30}>
						{l("Market-value allocation", "按估值的配置")}
					</SvgText>
					{rows.map((row, i) => (
						<g key={row.id}>
							<rect
								x={25}
								y={57 + i * 97}
								width={310}
								height={77}
								rx={12}
								fill={selected === row.id ? "var(--primary)" : "currentColor"}
								opacity={selected === row.id ? 0.18 : 0.04}
							/>
							<foreignObject x={25} y={57 + i * 97} width={310} height={77}>
								<button
									type="button"
									className="h-full w-full rounded-xl text-center text-sm"
									aria-pressed={selected === row.id}
									onClick={() => setSelected(row.id)}
								>
									<span className="block">
										{row.label}: {money(row.value)}
									</span>
									<span className="block text-xs">
										{result.equity !== null &&
										result.equity > 0 &&
										row.value !== null
											? `${number((row.value / result.equity) * 100)}%`
											: l("Allocation unavailable", "配置比例不可用")}
									</span>
								</button>
							</foreignObject>
						</g>
					))}
					<SvgText x={180} y={384}>
						{l("Marked equity", "估值净资产")}
					</SvgText>
					<g data-pnl-equity>
						<SvgText x={180} y={424} strong>
							{money(result.equity)}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<p className="font-mono text-xs">
				{a.asOf}
				<br />
				{l("Given snapshot · fees excluded", "给定快照 · 未计费用")}
			</p>
			<RangeControl
				label={l("Hypothetical cash deposit", "假设现金存款")}
				value={deposit}
				display={money(deposit)}
				min={0}
				max={100000}
				step={10000}
				onChange={setDeposit}
			/>
			<SelectField
				label={l("Missing mark scenario", "估值缺失情形")}
				value={missing}
				options={[
					["none", l("Both marks supplied", "两个估值已提供")],
					["stock", l("Stock mark unavailable", "股票估值不可用")],
					["option", l("Option mark unavailable", "期权估值不可用")],
				]}
				onChange={setMissing}
			/>
			<p data-pnl-cash>
				{l("Cash balance", "现金余额")}: {money(result.cash)}
			</p>
			<p data-pnl-account-profit>
				{l("Trading P&L in supplied scope", "给定范围交易盈亏")}:{" "}
				{money(result.totalPnl, true)}
			</p>
			<p>
				{l("Known realized P&L", "已知已实现盈亏")}:{" "}
				{money(a.realizedCents, true)}
			</p>
			<p data-pnl-buying-power>
				{l("Original reported buying power", "原报告购买力")}:{" "}
				{money(a.reportedBuyingPowerCents)}
				<br />
				{l("Not recomputed for hypothetical changes", "未按假设变化重算")}
			</p>
			<Note>
				{selected === "cash"
					? l(
							"A deposit increases cash and marked equity without creating trading profit. The source's buying-power figure can incorporate credit or margin rules. It is not cash or a safe risk budget, and this example does not calculate a new broker limit.",
							"存款增加现金与估值净资产，不创造交易利润。来源购买力可能含授信或保证金规则，不是现金或安全风险预算，本例不计算新的券商限额。",
						)
					: selected === "stock"
						? l(
								"In the original fully marked snapshot, stock value is 60 shares × $22 = $1,320. Allocation percentages use complete marked equity as their denominator. When a required mark is missing, do not normalize only the known subset and call it the whole account.",
								"在原始估值齐备快照中，股票估值为 60 股×$22=$1,320。配置比例以完整估值净资产为分母。必需估值缺失时，不应只对已知子集归一化并称为整个账户。",
							)
						: l(
								"In the original fully marked snapshot, option value is 2 ×100 ×$2.50 = $500, but underlying notional magnitude is 2 ×100 ×$100 = $20,000. Market-value allocation alone does not describe option risk; sensitivity and scenario context are also required.",
								"在原始估值齐备快照中，期权估值为 2×100×$2.50=$500，但标的名义幅度为 2×100×$100=$20,000。仅市值配置不能描述期权风险，还需敏感度及情景上下文。",
							)}
			</Note>
		</SceneLayout>
	);
}
export function OptionValueScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const o = data.option;
	const [side, setSide] = useState<"long" | "short">("long");
	const [quantity, setQuantity] = useState(o.quantity);
	const [mark, setMark] = useState(o.markCents);
	const [known, setKnown] = useState(true);
	const result = optionValuation(
		quantity,
		o.multiplier,
		side,
		o.entryCents,
		known ? mark : null,
		o.underlyingCents,
	);
	if (!result) return null;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Signed option value cash and P&L",
						"带符号期权价值现金与盈亏",
					)}
					height={460}
				>
					{(["long", "short"] as const).map((value, i) => (
						<foreignObject
							key={value}
							x={25 + i * 160}
							y={25}
							width={150}
							height={60}
						>
							<button
								type="button"
								className={`h-full w-full rounded-xl border text-sm ${side === value ? "bg-primary/20" : ""}`}
								aria-pressed={side === value}
								onClick={() => setSide(value)}
							>
								{value === "long"
									? l("Long call", "看涨多头")
									: l("Uncovered short call", "未覆盖看涨空头")}
							</button>
						</foreignObject>
					))}
					<SvgText x={180} y={123}>
						{result.units} {l("signed contract units", "带符号合约单位")}
					</SvgText>
					<SvgText x={180} y={170}>
						{l("Opening cash flow", "开仓现金流")}
					</SvgText>
					<g data-pnl-option-cash>
						<SvgText x={180} y={207} strong>
							{money(result.openingCash, true)}
						</SvgText>
					</g>
					<SvgText x={180} y={259}>
						{l("Signed marked value", "带符号估值")}
					</SvgText>
					<g data-pnl-option-value>
						<SvgText x={180} y={296} strong>
							{money(result.value, true)}
						</SvgText>
					</g>
					<SvgText x={180} y={349}>
						{l("Unrealized P&L", "未实现盈亏")}
					</SvgText>
					<g data-pnl-option-profit>
						<SvgText x={180} y={388} strong>
							{money(result.unrealized, true)}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<p className="font-mono text-xs">
				{o.asOf}
				<br />
				{l("Entry price/share", "入场每股价格")}: {money(o.entryCents)} · ×
				{o.multiplier}
			</p>
			<RangeControl
				label={l("Option contracts", "期权张数")}
				value={quantity}
				display={String(quantity)}
				min={0}
				max={5}
				step={1}
				onChange={setQuantity}
			/>
			<RangeControl
				label={l("Hypothetical option mark", "假设期权估值价")}
				value={mark}
				display={money(mark)}
				min={0}
				max={1000}
				step={100}
				onChange={setMark}
			/>
			<SelectField
				label={l("Option mark evidence", "期权估值证据")}
				value={known ? "known" : "missing"}
				options={[
					["known", l("Mark supplied", "已提供估值")],
					["missing", l("Mark unavailable", "估值不可用")],
				]}
				onChange={(v) => setKnown(v === "known")}
			/>
			<p data-pnl-notional>
				{l("Underlying notional magnitude", "标的名义幅度")}:{" "}
				{money(result.notional)}
			</p>
			<Note>
				{l(
					"Shorting reverses signed value and opening cash flow. An opening credit is not realized profit: it accompanies a short liability. At two contracts, $400 received can coexist with a $2,000 marked liability and −$1,600 unrealized P&L when the hypothetical mark is $10. This bounded slider is not a loss cap for an uncovered short call.",
					"空头反转带符号价值与开仓现金流。开仓收入不是已实现利润，它伴随空头负债。两张合约收取 $400 时，假设估值 $10 可对应 $2,000 负债和 −$1,600 未实现盈亏。有限滑块范围不是未覆盖看涨空头的亏损上限。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"Underlying notional is not delta-adjusted exposure. Current Greeks are not supplied here and cannot be inferred from premium alone. Marks are valuations, not promised fills; fees, assignment, margin and execution are outside this isolated example.",
					"标的名义量不是 Delta 调整敞口。此处未提供当前希腊值，不能仅从权利金推断。估值不是保证成交；费用、指派、保证金与执行不在此独立示例内。",
				)}
			</p>
		</SceneLayout>
	);
}
