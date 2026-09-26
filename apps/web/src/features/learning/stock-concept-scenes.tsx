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
import {
	instantTransition,
	lessonTransition,
	useLessonMotion,
} from "./lesson-motion";
import { SceneOutcome } from "./scene-outcome";
import { useGuidedState } from "./visual-playback";

type Props = { locale: Locale };
const text = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const usd = (cents: number) =>
	`${cents < 0 ? "−" : ""}$${(Math.abs(cents) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Fictional company used throughout Level 0. */
const ALFA_PRICE = 4000;
const ALFA_SHARES = 50_000_000;
const shareCounts: readonly number[] = [10, 100, 500];

export function SharesScene({ locale }: Props) {
	const l = text(locale);
	const [shares, setShares] = useGuidedState(10, shareCounts);
	const value = shares * ALFA_PRICE;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Your shares are a small slice of one company",
						"你的股票是公司的一小部分",
					)}
					height={290}
				>
					<rect
						x="30"
						y="18"
						width="300"
						height="112"
						rx="14"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={50} strong>
						ALFA
					</SvgText>
					<SvgText x={180} y={76} muted>
						{l("Alfa Robotics · fictional company", "Alfa Robotics · 虚构公司")}
					</SvgText>
					<SvgText x={180} y={106}>
						{l("50,000,000 shares · $40.00 each", "5,000 万股 · 每股 $40.00")}
					</SvgText>
					<path d="M180 130v44" className="contract-svg-active-line" />
					<rect
						x="60"
						y="174"
						width="240"
						height="92"
						rx="14"
						className="contract-svg-wash"
					/>
					<SvgText x={180} y={204} muted>
						{l(`You own ${shares} shares`, `你持有 ${shares} 股`)}
					</SvgText>
					<SvgText x={180} y={240} strong>
						{usd(value)}
					</SvgText>
				</Diagram>
			}
			outcome={
				<SceneOutcome
					locale={locale}
					items={[
						{
							id: "value",
							label: l("Your position value", "持股价值"),
							value: usd(value),
						},
						{
							id: "move",
							label: l("If ALFA moves $1", "ALFA 每变动 $1"),
							value: `±${usd(shares * 100)}`,
						},
						{
							id: "company",
							label: l("Whole company value", "公司总价值"),
							value: usd(ALFA_SHARES * ALFA_PRICE),
						},
					]}
				/>
			}
			controls={
				<RangeControl
					label={l("Shares you own", "你持有的股数")}
					value={shares}
					display={shares.toLocaleString("en-US")}
					min={10}
					max={1000}
					step={10}
					onChange={setShares}
				/>
			}
			details={
				<p className="text-muted-foreground text-sm leading-7">
					{l(
						"Position value = shares × price. The company's total value, its market capitalization, is all shares × price. Your slice is tiny, but its value moves with the same price as everyone else's.",
						"持股价值 = 股数 × 价格。公司的总价值（市值）= 全部股数 × 价格。你持有的部分很小，但它的价值和其他人的持股一样随同一价格变动。",
					)}
				</p>
			}
		/>
	);
}

type QuoteSide = "buy" | "sell";
const quote = { bid: 4000, ask: 4005, last: 4002 } as const;
const quoteStates: readonly { side: QuoteSide; qty: number }[] = [
	{ side: "buy", qty: 10 },
	{ side: "sell", qty: 10 },
	{ side: "buy", qty: 100 },
];

export function QuoteScene({ locale }: Props) {
	const l = text(locale);
	const motion = useLessonMotion();
	const [state, setState] = useGuidedState(quoteStates[0], quoteStates);
	const buy = state.side === "buy";
	const price = buy ? quote.ask : quote.bid;
	const total = price * state.qty;
	const versusLast = (price - quote.last) * state.qty;
	const x = (cents: number) => 40 + ((cents - 3996) / 12) * 280;
	const marks = [
		{ id: "bid", cents: quote.bid, label: l("Bid", "买价") },
		{ id: "last", cents: quote.last, label: l("Last", "最新价") },
		{ id: "ask", cents: quote.ask, label: l("Ask", "卖价") },
	];
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Bid, last and ask on one price line",
						"同一价格轴上的买价、最新价与卖价",
					)}
					height={250}
				>
					<SvgText x={180} y={34} strong>
						ALFA
					</SvgText>
					<path d="M40 130H320" className="contract-svg-line" />
					{marks.map((mark) => {
						const active = mark.id === (buy ? "ask" : "bid");
						return (
							<g key={mark.id}>
								<circle
									cx={x(mark.cents)}
									cy={130}
									r={active ? 10 : 6}
									fill={
										active
											? buy
												? "var(--diagram-loss)"
												: "var(--diagram-gain)"
											: "var(--card)"
									}
									stroke="var(--foreground)"
									strokeWidth="2"
								/>
								<SvgText x={x(mark.cents)} y={mark.id === "last" ? 100 : 170}>
									{mark.label}
								</SvgText>
								<SvgText
									x={x(mark.cents)}
									y={mark.id === "last" ? 80 : 192}
									muted
								>
									{usd(mark.cents)}
								</SvgText>
							</g>
						);
					})}
					<m.g
						key={state.side}
						initial={{ opacity: motion ? 0 : 1 }}
						animate={{ opacity: 1 }}
						transition={motion ? lessonTransition : instantTransition}
					>
						<SvgText x={180} y={232}>
							{buy
								? l("Buy now: you pay the ask", "立即买入：按卖价付款")
								: l("Sell now: you receive the bid", "立即卖出：按买价收款")}
						</SvgText>
					</m.g>
				</Diagram>
			}
			outcome={
				<SceneOutcome
					locale={locale}
					items={[
						{
							id: "price",
							label: l("Price per share", "每股价格"),
							value: usd(price),
						},
						{
							id: "total",
							label: buy
								? l("Total cost", "总成本")
								: l("Total received", "总收入"),
							value: usd(total),
						},
						{
							id: "last",
							label: l("Versus the last price", "相对最新价"),
							value: `${versusLast > 0 ? "+" : ""}${usd(versusLast)}`,
							tone: "loss",
						},
					]}
				/>
			}
			controls={
				<FieldGroup>
					<ChoiceField
						label={l("Trade right now", "立即交易")}
						value={state.side}
						options={[
							["buy", l("Buy", "买入")],
							["sell", l("Sell", "卖出")],
						]}
						onChange={(side) => setState({ side, qty: state.qty })}
					/>
					<RangeControl
						label={l("Shares", "股数")}
						value={state.qty}
						display={String(state.qty)}
						min={10}
						max={200}
						step={10}
						onChange={(qty) => setState({ side: state.side, qty })}
					/>
				</FieldGroup>
			}
			details={
				<p className="text-muted-foreground text-sm leading-7">
					{l(
						"The bid is the best price a buyer is offering right now; the ask is the best price a seller is offering. The last price is the most recent trade and can be out of date. Before fees, an immediate round trip (buy at the ask, sell at the bid) loses the spread: $0.05 per share here.",
						"买价是此刻买方愿意支付的最高价格；卖价是此刻卖方愿意接受的最低价格。最新价是最近一笔成交，可能已经过时。不计费用时，立即买入再立即卖出（按卖价买、按买价卖）会损失价差：本例每股 $0.05。",
					)}
				</p>
			}
		/>
	);
}

type Instrument = "stock" | "etf" | "index";
const instrumentStates: readonly Instrument[] = ["stock", "etf", "index"];

export function InstrumentScene({ locale }: Props) {
	const l = text(locale);
	const [selected, setSelected] = useGuidedState<Instrument>(
		"stock",
		instrumentStates,
	);
	const cards: Record<
		Instrument,
		{ name: string; kind: string; holds: string }
	> = {
		stock: {
			name: "ALFA",
			kind: l("Stock", "股票"),
			holds: l("1 company", "1 家公司"),
		},
		etf: { name: "BRDX", kind: "ETF", holds: l("500 stocks", "500 只股票") },
		index: {
			name: "IDX 500",
			kind: l("Index", "指数"),
			holds: l("A number", "一个数值"),
		},
	};
	const facts: Record<
		Instrument,
		{ buy: string; own: string; settle: string }
	> = {
		stock: {
			buy: l("Yes", "可以"),
			own: l("Part of one company", "一家公司的一部分"),
			settle: l("Shares", "股票"),
		},
		etf: {
			buy: l("Yes", "可以"),
			own: l("Part of a fund", "一只基金的一部分"),
			settle: l("Shares", "基金份额"),
		},
		index: {
			buy: l("No", "不可以"),
			own: l("Nothing: it's a measurement", "什么也没有：它只是一个测量值"),
			settle: l("Cash", "现金"),
		},
	};
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"A stock, an ETF and an index side by side",
						"股票、ETF 与指数并列比较",
					)}
					height={210}
				>
					{instrumentStates.map((id, i) => {
						const card = cards[id];
						const active = id === selected;
						return (
							<g key={id}>
								<rect
									x={14 + i * 116}
									y="30"
									width="104"
									height="150"
									rx="14"
									className={
										active ? "contract-svg-wash" : "contract-svg-paper"
									}
								/>
								<SvgText x={66 + i * 116} y={72} strong={active}>
									{card.name}
								</SvgText>
								<SvgText x={66 + i * 116} y={110}>
									{card.kind}
								</SvgText>
								<SvgText x={66 + i * 116} y={146} muted>
									{card.holds}
								</SvgText>
							</g>
						);
					})}
				</Diagram>
			}
			outcome={
				<SceneOutcome
					locale={locale}
					items={[
						{
							id: "buy",
							label: l("Can you buy it directly?", "能否直接买入？"),
							value: facts[selected].buy,
							tone: selected === "index" ? "loss" : "gain",
						},
						{
							id: "own",
							label: l("What you would own", "你将持有什么"),
							value: facts[selected].own,
						},
						{
							id: "settle",
							label: l("Its options settle in", "其期权结算方式"),
							value: facts[selected].settle,
						},
					]}
				/>
			}
			controls={
				<ChoiceField
					label={l("Inspect", "查看")}
					value={selected}
					options={[
						["stock", l("Stock", "股票")],
						["etf", "ETF"],
						["index", l("Index", "指数")],
					]}
					onChange={setSelected}
				/>
			}
			details={
				<p className="text-muted-foreground text-sm leading-7">
					{l(
						"All three can have options, but they are different instruments. Always check which one an option refers to: stock and ETF options usually deliver shares, while index options pay cash. ALFA, BRDX and IDX 500 are fictional.",
						"三者都可以有期权，但它们是不同的工具。务必确认期权指向哪一个：股票和 ETF 期权通常交付股票或份额，指数期权则支付现金。ALFA、BRDX 与 IDX 500 均为虚构。",
					)}
				</p>
			}
		/>
	);
}
