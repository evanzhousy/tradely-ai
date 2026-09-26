import { FieldGroup } from "@tradely/ui/components/field";
import * as m from "motion/react-m";
import type { Locale } from "@/i18n/messages";
import {
	ChoiceField,
	Diagram,
	RangeControl,
	SceneLayout,
	SvgText,
} from "./concept-scene";
import { lessonTransition } from "./lesson-motion";
import { SceneOutcome } from "./scene-outcome";
import { useGuidedState } from "./visual-playback";

type Props = { locale: Locale };
type Side = "CALL" | "PUT";
type Expiry = "oct" | "nov";
const text = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const price = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const usd = (dollars: number) =>
	`${dollars < 0 ? "−" : ""}$${Math.abs(dollars).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Fictional chain with ALFA at $101; call − put ≈ spot − strike at each strike. */
const strikes = [95, 100, 105] as const;
type Strike = (typeof strikes)[number];
const chain: Record<
	Expiry,
	Record<Side, Record<Strike, readonly [bid: number, ask: number]>>
> = {
	oct: {
		CALL: { 95: [710, 730], 100: [360, 375], 105: [140, 150] },
		PUT: { 95: [95, 105], 100: [245, 260], 105: [520, 540] },
	},
	nov: {
		CALL: { 95: [840, 860], 100: [510, 530], 105: [280, 295] },
		PUT: { 95: [210, 225], 100: [395, 415], 105: [660, 685] },
	},
};
const chainStates: readonly { expiry: Expiry; strike: Strike; side: Side }[] = [
	{ expiry: "oct", strike: 100, side: "CALL" },
	{ expiry: "nov", strike: 105, side: "CALL" },
	{ expiry: "nov", strike: 95, side: "PUT" },
];

export function ChainScene({ locale }: Props) {
	const l = text(locale);
	const [state, setState] = useGuidedState(chainStates[0], chainStates);
	const { expiry, strike, side } = state;
	const [bid, ask] = chain[expiry][side][strike];
	const expiryLabel =
		expiry === "oct"
			? l("Oct 16 · 30 days", "10 月 16 日 · 30 天")
			: l("Nov 20 · 65 days", "11 月 20 日 · 65 天");
	const row = (s: Strike) => 110 + strikes.indexOf(s) * 44;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"An option chain: calls and puts by strike for one expiry",
						"期权链：同一到期日下按行权价排列的看涨与看跌",
					)}
					height={270}
				>
					<SvgText x={180} y={28} strong>
						ALFA $101.00
					</SvgText>
					<SvgText x={180} y={52} muted>
						{expiryLabel}
					</SvgText>
					<SvgText x={80} y={84} muted>
						{l("Calls bid / ask", "看涨 买/卖")}
					</SvgText>
					<SvgText x={180} y={84} muted>
						{l("Strike", "行权价")}
					</SvgText>
					<SvgText x={280} y={84} muted>
						{l("Puts bid / ask", "看跌 买/卖")}
					</SvgText>
					<m.rect
						initial={false}
						animate={{
							x: side === "CALL" ? 20 : 220,
							y: row(strike) - 24,
						}}
						transition={lessonTransition}
						width="120"
						height="36"
						rx="10"
						className="contract-svg-wash"
					/>
					{strikes.map((s) => (
						<g key={s}>
							<SvgText x={80} y={row(s)}>
								{`${(chain[expiry].CALL[s][0] / 100).toFixed(2)} / ${(chain[expiry].CALL[s][1] / 100).toFixed(2)}`}
							</SvgText>
							<SvgText x={180} y={row(s)} strong={s === strike}>
								{s}
							</SvgText>
							<SvgText x={280} y={row(s)}>
								{`${(chain[expiry].PUT[s][0] / 100).toFixed(2)} / ${(chain[expiry].PUT[s][1] / 100).toFixed(2)}`}
							</SvgText>
						</g>
					))}
					<SvgText x={180} y={256} muted>
						{l("Prices per share · fictional", "每股价格 · 虚构")}
					</SvgText>
				</Diagram>
			}
			outcome={
				<SceneOutcome
					locale={locale}
					items={[
						{
							id: "contract",
							label: l("Contract", "合约"),
							value: `ALFA ${expiry === "oct" ? l("Oct 16", "10/16") : l("Nov 20", "11/20")} ${strike} ${side === "CALL" ? l("call", "看涨") : l("put", "看跌")}`,
						},
						{
							id: "quote",
							label: l("Bid / ask", "买价 / 卖价"),
							value: `${price(bid)} / ${price(ask)}`,
						},
						{
							id: "cost",
							label: l("Cost to buy 1 at the ask", "按卖价买 1 张的成本"),
							value: usd(ask),
						},
					]}
				/>
			}
			controls={
				<FieldGroup>
					<ChoiceField
						label={l("Expiration", "到期日")}
						value={expiry}
						options={[
							["oct", l("Oct 16", "10 月 16 日")],
							["nov", l("Nov 20", "11 月 20 日")],
						]}
						onChange={(next) => setState({ ...state, expiry: next })}
					/>
					<ChoiceField
						label={l("Strike", "行权价")}
						value={String(strike) as `${Strike}`}
						options={strikes.map(
							(s) => [String(s) as `${Strike}`, `$${s}`] as const,
						)}
						onChange={(next) =>
							setState({ ...state, strike: Number(next) as Strike })
						}
					/>
					<ChoiceField
						label={l("Type", "类型")}
						value={side}
						options={[
							["CALL", l("Call", "看涨")],
							["PUT", l("Put", "看跌")],
						]}
						onChange={(next) => setState({ ...state, side: next })}
					/>
				</FieldGroup>
			}
			details={
				<p className="text-muted-foreground text-sm leading-7">
					{l(
						"A chain lists every contract for one underlying: pick the expiration, then the strike, then call or put. Each contract has its own bid and ask, quoted per share, so one contract costs 100 times the quote.",
						"期权链列出同一标的的全部合约：先选到期日，再选行权价，最后选看涨或看跌。每份合约都有自己的买价和卖价，按每股报价，所以一张合约的成本是报价的 100 倍。",
					)}
				</p>
			}
		/>
	);
}

type OrderType = "market" | "limit";
const orderQuote = { bid: 180, ask: 220 } as const;
const orderStates: readonly { type: OrderType; limit: number }[] = [
	{ type: "market", limit: 200 },
	{ type: "limit", limit: 200 },
	{ type: "limit", limit: 220 },
];
const CONTRACTS = 2;

export function OrderScene({ locale }: Props) {
	const l = text(locale);
	const [state, setState] = useGuidedState(orderStates[0], orderStates);
	const fills = state.type === "market" || state.limit >= orderQuote.ask;
	const fillPrice = fills ? orderQuote.ask : null;
	const cost = fillPrice === null ? null : (fillPrice * 100 * CONTRACTS) / 100;
	const mid = (orderQuote.bid + orderQuote.ask) / 2;
	const x = (cents: number) => 40 + ((cents - 170) / 70) * 280;
	const yourPrice = state.type === "market" ? orderQuote.ask : state.limit;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Where your order sits against the bid and ask",
						"你的订单相对买价与卖价的位置",
					)}
					height={250}
				>
					<SvgText x={180} y={28} strong>
						{l("ALFA Dec 18 110 call", "ALFA 12/18 110 看涨")}
					</SvgText>
					<SvgText x={180} y={52} muted>
						{l("A thinly traded contract", "一份交投清淡的合约")}
					</SvgText>
					<rect
						x={x(orderQuote.bid)}
						y="96"
						width={x(orderQuote.ask) - x(orderQuote.bid)}
						height="48"
						className="contract-svg-wash"
					/>
					<path d="M40 120H320" className="contract-svg-line" />
					{[
						{ id: "bid", cents: orderQuote.bid, label: l("Bid", "买价") },
						{ id: "mid", cents: mid, label: l("Mid", "中间价") },
						{ id: "ask", cents: orderQuote.ask, label: l("Ask", "卖价") },
					].map((mark) => (
						<g key={mark.id}>
							<path
								d={`M${x(mark.cents)} 108V132`}
								className="contract-svg-line"
							/>
							<SvgText x={x(mark.cents)} y={164} muted>
								{mark.label}
							</SvgText>
							<SvgText x={x(mark.cents)} y={184}>
								{price(mark.cents)}
							</SvgText>
						</g>
					))}
					<m.circle
						cx={x(yourPrice)}
						cy={120}
						r="10"
						fill={fills ? "var(--diagram-gain)" : "var(--card)"}
						stroke="var(--foreground)"
						strokeWidth="2"
						strokeDasharray={fills ? undefined : "3 3"}
						initial={false}
						animate={{ cx: x(yourPrice) }}
						transition={lessonTransition}
					/>
					<SvgText x={180} y={226}>
						{state.type === "market"
							? l("Market buy: takes the ask", "市价买单：直接吃卖价")
							: fills
								? l(
										`Limit ${price(state.limit)}: fills at the ask`,
										`限价 ${price(state.limit)}：按卖价成交`,
									)
								: l(
										`Limit ${price(state.limit)}: waits for a seller`,
										`限价 ${price(state.limit)}：等待卖方`,
									)}
					</SvgText>
				</Diagram>
			}
			outcome={
				<SceneOutcome
					locale={locale}
					items={[
						{
							id: "fills",
							label: l("Fills now?", "能否立即成交？"),
							value: fills
								? l("Yes", "是")
								: l("Not yet; it may never fill", "暂不成交，也可能一直不成交"),
							tone: fills ? "gain" : "unknown",
						},
						{
							id: "price",
							label: l("Price per share", "每股价格"),
							value: fillPrice === null ? null : price(fillPrice),
						},
						{
							id: "cost",
							label: l("Cost for 2 contracts", "2 张合约的成本"),
							value: cost === null ? null : usd(cost),
						},
						{
							id: "mid",
							label: l("Versus the midpoint", "相对中间价"),
							value:
								fillPrice === null
									? null
									: `+${usd(((fillPrice - mid) * 100 * CONTRACTS) / 100)}`,
							tone: "loss",
						},
					]}
				/>
			}
			controls={
				<FieldGroup>
					<ChoiceField
						label={l("Order type", "订单类型")}
						value={state.type}
						options={[
							["market", l("Market", "市价单")],
							["limit", l("Limit", "限价单")],
						]}
						onChange={(type) => setState({ ...state, type })}
					/>
					<RangeControl
						label={l("Your limit price", "你的限价")}
						value={state.limit}
						display={price(state.limit)}
						min={180}
						max={230}
						step={5}
						onChange={(limit) => setState({ type: "limit", limit })}
					/>
				</FieldGroup>
			}
			details={
				<p className="text-muted-foreground text-sm leading-7">
					{l(
						"A market order accepts the best available offer right now, however far it is from fair value. A limit order never pays more than your limit: at or above the ask it fills at the ask, and below the ask it waits and may not fill. Wide spreads are common in thinly traded options, so limit orders are the usual choice.",
						"市价单会立即接受当时最优的卖价，不管它离合理价格多远。限价单绝不会付出高于限价的价格：等于或高于卖价时按卖价成交，低于卖价时等待，也可能不成交。交投清淡的期权价差常常很宽，因此通常使用限价单。",
					)}
				</p>
			}
		/>
	);
}

type Ending = "close" | "expire" | "exercise";
const endingStates: readonly Ending[] = ["close", "expire", "exercise"];
const FEE = 0.65;
const COST = 150 + FEE; // bought 1 call at $1.50 per share

export function LifecycleScene({ locale }: Props) {
	const l = text(locale);
	const [ending, setEnding] = useGuidedState<Ending>("close", endingStates);
	const endings: Record<
		Ending,
		{ label: string; detail: string; cashIn: number; holds: string }
	> = {
		close: {
			label: l("Sell to close at $2.30", "以 $2.30 卖出平仓"),
			detail: l("ALFA at $106 before expiry", "到期前 ALFA 为 $106"),
			cashIn: 230 - FEE,
			holds: l("Nothing", "无持仓"),
		},
		expire: {
			label: l("Expires worthless", "到期作废"),
			detail: l("ALFA ends at $103, below 105", "ALFA 到期为 $103，低于 105"),
			cashIn: 0,
			holds: l("Nothing", "无持仓"),
		},
		exercise: {
			label: l("Exercise: pay $10,500", "行权：支付 $10,500"),
			detail: l("ALFA ends at $108", "ALFA 到期为 $108"),
			cashIn: 10800 - 10500,
			holds: l("100 ALFA shares", "100 股 ALFA"),
		},
	};
	const end = endings[ending];
	const result = end.cashIn - COST;
	const nodes = [
		{
			x: 60,
			title: l("Open", "开仓"),
			line: l("Buy at $1.50", "以 $1.50 买入"),
		},
		{ x: 180, title: l("Hold", "持有"), line: l("Value changes", "价值变化") },
		{ x: 300, title: l("End", "结束"), line: end.label },
	];
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"The life of one option position from purchase to its end",
						"一笔期权持仓从买入到结束的过程",
					)}
					height={250}
				>
					<SvgText x={180} y={28} strong>
						{l("1 ALFA Oct 16 105 call", "1 张 ALFA 10/16 105 看涨")}
					</SvgText>
					<path d="M60 110H300" className="contract-svg-line" />
					{nodes.map((node, i) => (
						<g key={node.x}>
							<circle
								cx={node.x}
								cy={110}
								r="9"
								fill={i === 2 ? "var(--diagram-accent)" : "var(--card)"}
								stroke="var(--foreground)"
								strokeWidth="2"
							/>
							<SvgText x={node.x} y={80}>
								{node.title}
							</SvgText>
							<SvgText x={node.x} y={146} muted>
								{i === 2 ? "" : node.line}
							</SvgText>
						</g>
					))}
					<m.g
						key={ending}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={lessonTransition}
					>
						<rect
							x="40"
							y="168"
							width="280"
							height="64"
							rx="12"
							className="contract-svg-paper"
						/>
						<SvgText x={180} y={194}>
							{end.label}
						</SvgText>
						<SvgText x={180} y={218} muted>
							{end.detail}
						</SvgText>
					</m.g>
				</Diagram>
			}
			outcome={
				<SceneOutcome
					locale={locale}
					items={[
						{
							id: "cost",
							label: l("Paid to open", "开仓支出"),
							value: usd(-COST),
						},
						{
							id: "end",
							label:
								ending === "exercise"
									? l(
											"Shares' value over the $10,500 paid",
											"股票价值超出 $10,500 的部分",
										)
									: l("Cash back at the end", "结束时收回"),
							value: usd(end.cashIn),
						},
						{
							id: "result",
							label: l("Result", "结果"),
							value: usd(result),
							tone: result < 0 ? "loss" : "gain",
						},
						{
							id: "holds",
							label: l("You hold afterwards", "之后持有"),
							value: end.holds,
						},
					]}
				/>
			}
			controls={
				<ChoiceField
					label={l("How it ends", "如何结束")}
					value={ending}
					options={[
						["close", l("Sell to close", "卖出平仓")],
						["expire", l("Expire", "到期作废")],
						["exercise", l("Exercise", "行权")],
					]}
					onChange={setEnding}
				/>
			}
			details={
				<p className="text-muted-foreground text-sm leading-7">
					{l(
						"Most positions end with a closing trade. Exercising a call means paying the strike for 100 shares, so you need the cash (here $10,500) and you then own the stock. Before expiry, selling usually beats exercising because the option's price still includes time value. Fees are illustrative at $0.65 per contract; brokers differ.",
						"多数持仓以平仓交易结束。行使看涨期权意味着按行权价买入 100 股，所以你需要这笔现金（本例 $10,500），之后你就持有股票。到期前卖出通常优于行权，因为期权价格里还包含时间价值。费用按每张 $0.65 举例，各券商不同。",
					)}
				</p>
			}
		/>
	);
}
