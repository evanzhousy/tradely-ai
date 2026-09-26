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
const usd = (dollars: number, digits = 0) =>
	`${dollars < 0 ? "−" : ""}$${Math.abs(dollars).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
const signed = (dollars: number, digits = 0) =>
	`${dollars > 0 ? "+" : ""}${usd(dollars, digits)}`;
const percent = (value: number) =>
	`${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toFixed(1)}%`;

const STRIKE = 100;

/** Standard normal CDF via the Abramowitz-Stegun erf approximation. */
function normal(x: number) {
	const z = Math.abs(x) / Math.SQRT2;
	const t = 1 / (1 + 0.3275911 * z);
	const erf =
		1 -
		((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
			t +
			0.254829592) *
			t *
			Math.exp(-z * z);
	return x >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}
/** European call per share, Black-Scholes with no rates or dividends. */
function callValue(spot: number, daysLeft: number, ivPercent: number) {
	if (daysLeft <= 0) return Math.max(spot - STRIKE, 0);
	const sd = (ivPercent / 100) * Math.sqrt(daysLeft / 365);
	const d1 = (Math.log(spot / STRIKE) + (sd * sd) / 2) / sd;
	return spot * normal(d1) - STRIKE * normal(d1 - sd);
}

const DAYS = 30;
const PAID = 4;
type Vol = "before" | "after";
const volPercent: Record<Vol, number> = { before: 35, after: 25 };
type DecayState = { spot: number; days: number; vol: Vol };
const decayStates: readonly DecayState[] = [
	{ spot: 100, days: 0, vol: "before" },
	{ spot: 102, days: 20, vol: "before" },
	{ spot: 102, days: 20, vol: "after" },
];

export function DecayScene({ locale }: Props) {
	const l = text(locale);
	const motion = useLessonMotion();
	const [state, setState] = useGuidedState(decayStates[0], decayStates);
	const { spot, days, vol } = state;
	const value =
		Math.round(callValue(spot, DAYS - days, volPercent[vol]) * 100) / 100;
	const result = Math.round((value - PAID) * 100);
	const x = (price: number) => 60 + ((price - 90) / 20) * 270;
	const y = (perShare: number) => 214 - (Math.min(perShare, 12) / 12) * 168;
	const curve = (daysLeft: number, iv: number) =>
		Array.from({ length: 41 }, (_, i) => {
			const price = 90 + i / 2;
			return `${i ? "L" : "M"}${x(price).toFixed(1)} ${y(callValue(price, daysLeft, iv)).toFixed(1)}`;
		}).join("");
	const transition = motion ? lessonTransition : instantTransition;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"The call's value against ALFA's price, now and on the day you bought it",
						"看涨期权价值随 ALFA 价格的变化：现在与买入当天对比",
					)}
					height={290}
				>
					<SvgText x={180} y={22} muted>
						{l("ALFA 100 call · value per share", "ALFA 100 看涨 · 每股价值")}
					</SvgText>
					<path d="M60 214H330" className="contract-svg-line" />
					<path d={`M${x(STRIKE)} 46V214`} className="diagram-boundary" />
					<path d={`M60 ${y(PAID)}H330`} className="diagram-reference" />
					<SvgText x={290} y={y(PAID) + 20} muted>
						{l("Paid $4.00", "已付 $4.00")}
					</SvgText>
					{[0, 4, 8, 12].map((tick) => (
						<SvgText key={tick} x={30} y={y(tick) + 4} muted>
							${tick}
						</SvgText>
					))}
					{[90, 100, 110].map((price) => (
						<SvgText key={price} x={x(price)} y={236} muted>
							${price}
						</SvgText>
					))}
					<path d={curve(DAYS, volPercent.before)} className="diagram-dashed" />
					<m.path
						className="contract-svg-active-line"
						initial={false}
						animate={{ d: curve(DAYS - days, volPercent[vol]) }}
						transition={transition}
					/>
					<m.circle
						r="8"
						fill={result < 0 ? "var(--diagram-loss)" : "var(--diagram-gain)"}
						stroke="var(--foreground)"
						strokeWidth="2"
						initial={false}
						animate={{ cx: x(spot), cy: y(value) }}
						transition={transition}
					/>
					<path d="M60 266h26" className="diagram-dashed" />
					<SvgText x={150} y={270} muted>
						{l("Day 0 · IV 35%", "第 0 天 · IV 35%")}
					</SvgText>
					<path d="M222 266h26" className="contract-svg-active-line" />
					<SvgText x={286} y={270} muted>
						{l("Now", "当前")}
					</SvgText>
				</Diagram>
			}
			outcome={
				<SceneOutcome
					locale={locale}
					items={[
						{
							id: "stock",
							label: l("ALFA since you bought", "买入后 ALFA 变动"),
							value: `${signed(spot - STRIKE, 2)} (${percent(spot - STRIKE)})`,
							tone: spot > STRIKE ? "gain" : spot < STRIKE ? "loss" : undefined,
						},
						{
							id: "value",
							label: l("Call value now", "看涨期权现值"),
							value: `${usd(value, 2)} (${percent(((value - PAID) / PAID) * 100)})`,
						},
						{
							id: "result",
							label: l("Your result per contract", "每张合约盈亏"),
							value: signed(result),
							tone: result > 0 ? "gain" : result < 0 ? "loss" : undefined,
						},
					]}
				/>
			}
			controls={
				<FieldGroup>
					<RangeControl
						label={l("ALFA price", "ALFA 价格")}
						value={spot}
						display={`$${spot}`}
						min={90}
						max={110}
						onChange={(next) => setState({ ...state, spot: next })}
					/>
					<RangeControl
						label={l("Days since you bought", "买入后经过的天数")}
						value={days}
						display={l(`${days} of ${DAYS}`, `${days} / ${DAYS} 天`)}
						min={0}
						max={DAYS}
						onChange={(next) => setState({ ...state, days: next })}
					/>
					<ChoiceField
						label={l("Implied volatility", "隐含波动率")}
						value={vol}
						options={[
							["before", l("35% · before earnings", "35% · 财报前")],
							["after", l("25% · after earnings", "25% · 财报后")],
						]}
						onChange={(next) => setState({ ...state, vol: next })}
					/>
				</FieldGroup>
			}
			details={
				<p className="text-muted-foreground text-sm leading-7">
					{l(
						"Before expiry, an option's price is what it would be worth if it expired now plus time value. Time value shrinks every day, faster near expiry, and falls when implied volatility, the market's estimate of how much the stock will move, drops, as it often does right after earnings. Leverage magnifies the result: a 2% rise in ALFA came with a 29% fall in the call. Values come from a standard pricing model (Black-Scholes, no interest or dividends). ALFA is fictional; fees are ignored.",
						"到期前，期权价格等于“假如现在到期能值多少”再加上时间价值。时间价值每天都在缩水，越临近到期缩得越快；隐含波动率（市场对股价波动幅度的估计）下降时它也会下跌，而财报公布后常常如此。杠杆会放大结果：ALFA 上涨 2%，看涨期权却下跌 29%。数值来自标准定价模型（Black-Scholes，不计利率与股息）。ALFA 为虚构，未计费用。",
					)}
				</p>
			}
		/>
	);
}

type Side = "buyer" | "writer";
const TAIL_PREMIUM = 3;
const tailStates: readonly { side: Side; spot: number }[] = [
	{ side: "writer", spot: 100 },
	{ side: "writer", spot: 120 },
	{ side: "buyer", spot: 90 },
];
const atExpiry = (side: Side, spot: number) => {
	const buyer = (Math.max(spot - STRIKE, 0) - TAIL_PREMIUM) * 100;
	return side === "buyer" ? buyer : -buyer;
};

export function TailScene({ locale }: Props) {
	const l = text(locale);
	const motion = useLessonMotion();
	const [state, setState] = useGuidedState(tailStates[0], tailStates);
	const { side, spot } = state;
	const result = atExpiry(side, spot);
	const x = (price: number) => 70 + ((price - 80) / 60) * 260;
	const y = (dollars: number) => 150 - (dollars / 4000) * 105;
	const line = (who: Side) =>
		[80, STRIKE, 140]
			.map(
				(price, i) =>
					`${i ? "L" : "M"}${x(price).toFixed(1)} ${y(atExpiry(who, price)).toFixed(1)}`,
			)
			.join("");
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Result at expiry for the buyer and the writer of the same call",
						"同一张看涨期权的买方与义务方在到期时的盈亏",
					)}
					height={300}
				>
					<SvgText x={180} y={20} muted>
						{l(
							"At expiry · per contract · $3 premium",
							"到期时 · 每张合约 · 权利金 $3",
						)}
					</SvgText>
					<path d="M70 150H330" className="contract-svg-line" />
					<path d={`M${x(STRIKE)} 45V255`} className="diagram-boundary" />
					{[3000, 0, -3000].map((tick) => (
						<SvgText key={tick} x={34} y={y(tick) + 4} muted>
							{signed(tick)}
						</SvgText>
					))}
					{[80, 100, 120, 140].map((price) => (
						<SvgText key={price} x={x(price)} y={276} muted>
							${price}
						</SvgText>
					))}
					{(["buyer", "writer"] as const).map((who) => (
						<path
							key={who}
							d={line(who)}
							className={
								who === side ? "contract-svg-active-line" : "diagram-dashed"
							}
						/>
					))}
					<SvgText x={262} y={56} strong={side === "buyer"}>
						{l("Buyer", "买方")}
					</SvgText>
					<SvgText x={262} y={250} strong={side === "writer"}>
						{l("Writer", "义务方")}
					</SvgText>
					<m.circle
						r="8"
						fill={result < 0 ? "var(--diagram-loss)" : "var(--diagram-gain)"}
						stroke="var(--foreground)"
						strokeWidth="2"
						initial={false}
						animate={{ cx: x(spot), cy: y(result) }}
						transition={motion ? lessonTransition : instantTransition}
					/>
				</Diagram>
			}
			outcome={
				<SceneOutcome
					locale={locale}
					items={[
						{
							id: "result",
							label: l("Result at expiry", "到期盈亏"),
							value: signed(result),
							tone: result > 0 ? "gain" : result < 0 ? "loss" : undefined,
						},
						{
							id: "premium",
							label: l("Premium", "权利金"),
							value:
								side === "buyer"
									? l("Paid $300", "支付 $300")
									: l("Collected $300", "收取 $300"),
						},
						{
							id: "worst",
							label: l("Worst case", "最坏情况"),
							value:
								side === "buyer"
									? l("−$300, the premium", "−$300，即权利金")
									: l("No fixed limit", "没有固定上限"),
							tone: "loss",
						},
					]}
				/>
			}
			controls={
				<FieldGroup>
					<ChoiceField
						label={l("Side", "角色")}
						value={side}
						options={[
							["buyer", l("Buyer (holder)", "买方（持有人）")],
							["writer", l("Writer, uncovered", "义务方（未备兑）")],
						]}
						onChange={(next) => setState({ side: next, spot })}
					/>
					<RangeControl
						label={l("ALFA at expiry", "到期时 ALFA 价格")}
						value={spot}
						display={`$${spot}`}
						min={80}
						max={140}
						onChange={(next) => setState({ side, spot: next })}
					/>
				</FieldGroup>
			}
			details={
				<p className="text-muted-foreground text-sm leading-7">
					{l(
						"The buyer's loss stops at the premium, whatever ALFA does. The uncovered writer's gain stops at the premium, while the loss grows $100 for every $1 ALFA ends above $100, and a stock price has no ceiling. That is why brokers require a higher approval level and margin to write uncovered options. Writing a put has a large but fixed worst case, because a stock cannot fall below zero. ALFA is fictional; fees are ignored.",
						"无论 ALFA 怎么走，买方的亏损都止于权利金。未备兑义务方的收益止于权利金，而 ALFA 收在 $100 以上每多 $1，亏损就多 $100，股价又没有上限。因此券商要求更高的期权权限和保证金才能卖出未备兑期权。卖出看跌期权的最坏情况虽大但固定，因为股价不会跌到零以下。ALFA 为虚构，未计费用。",
					)}
				</p>
			}
		/>
	);
}

const MID = 200;
const CONTRACTS = 5;
const FEE = 0.65;
const spreadStates: readonly number[] = [2, 20, 60];

export function SpreadScene({ locale }: Props) {
	const l = text(locale);
	const motion = useLessonMotion();
	const [width, setWidth] = useGuidedState(spreadStates[0], spreadStates);
	const bid = MID - width / 2;
	const ask = MID + width / 2;
	const fees = FEE * CONTRACTS;
	const paid = ask * CONTRACTS + fees;
	const back = bid * CONTRACTS - fees;
	const loss = paid - back;
	const split = 30 + (back / paid) * 300;
	const x = (cents: number) => 70 + ((cents - 160) / 80) * 220;
	const transition = motion ? lessonTransition : instantTransition;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"A bid-ask spread and what a round trip through it costs",
						"买卖价差及一买一卖穿越价差的成本",
					)}
					height={270}
				>
					<SvgText x={180} y={22} muted>
						{l("ALFA call quote · 5 contracts", "ALFA 看涨报价 · 5 张")}
					</SvgText>
					<path d="M40 70H320" className="contract-svg-line" />
					<m.rect
						y="58"
						height="24"
						fill="var(--diagram-loss)"
						fillOpacity={0.2}
						initial={false}
						animate={{ x: x(bid), width: x(ask) - x(bid) }}
						transition={transition}
					/>
					<path d={`M${x(MID)} 84V96`} className="contract-svg-line" />
					<SvgText x={x(MID)} y={114} muted>
						{l("Mid $2.00", "中间价 $2.00")}
					</SvgText>
					{[
						{
							id: "bid",
							cents: bid,
							anchor: "end" as const,
							dx: -14,
							label: l("Bid", "买价"),
						},
						{
							id: "ask",
							cents: ask,
							anchor: "start" as const,
							dx: 14,
							label: l("Ask", "卖价"),
						},
					].map((mark) => (
						<g key={mark.id}>
							<m.circle
								cy="70"
								r="7"
								fill="var(--card)"
								stroke="var(--foreground)"
								strokeWidth="2"
								initial={false}
								animate={{ cx: x(mark.cents) }}
								transition={transition}
							/>
							<text
								x={x(mark.cents) + mark.dx}
								y={75}
								textAnchor={mark.anchor}
								className="contract-svg-muted"
							>
								{mark.label} ${(mark.cents / 100).toFixed(2)}
							</text>
						</g>
					))}
					<SvgText x={180} y={148} muted>
						{l(
							"Buy at the ask, then sell right back",
							"按卖价买入，再立即按买价卖出",
						)}
					</SvgText>
					<rect
						x="30"
						y="160"
						width="300"
						height="32"
						rx="6"
						className="contract-svg-paper"
					/>
					<m.rect
						y="160"
						height="32"
						fill="var(--diagram-loss)"
						initial={false}
						animate={{ x: split, width: 330 - split }}
						transition={transition}
					/>
					<SvgText x={110} y={218} muted>
						{l("Back", "收回")} {usd(back, 2)}
					</SvgText>
					<SvgText x={262} y={218}>
						{l("Lost", "损失")} {usd(loss, 2)}
					</SvgText>
					<SvgText x={180} y={250} muted>
						{l(
							`${((loss / paid) * 100).toFixed(1)}% of what you paid`,
							`占所付金额的 ${((loss / paid) * 100).toFixed(1)}%`,
						)}
					</SvgText>
				</Diagram>
			}
			outcome={
				<SceneOutcome
					locale={locale}
					items={[
						{
							id: "spread",
							label: l("Lost to the spread", "价差损失"),
							value: usd(width * CONTRACTS, 2),
						},
						{
							id: "fees",
							label: l("Fees on 2 trades", "两笔交易费用"),
							value: usd(fees * 2, 2),
						},
						{
							id: "loss",
							label: l("Round-trip loss", "一买一卖亏损"),
							value: usd(-loss, 2),
							tone: "loss",
						},
					]}
				/>
			}
			controls={
				<RangeControl
					label={l("Bid-ask spread", "买卖价差")}
					value={width}
					display={`$${(width / 100).toFixed(2)}`}
					min={2}
					max={60}
					step={2}
					onChange={setWidth}
				/>
			}
			details={
				<p className="text-muted-foreground text-sm leading-7">
					{l(
						"Option spreads are often wider than stock spreads, especially for contracts that trade rarely, sit far from the stock price or expire far out. You pay the spread when you trade, before the price moves. Fees here are $0.65 per contract per trade; brokers differ. Before you can trade options, your broker must give you the Options Clearing Corporation's booklet Characteristics and Risks of Standardized Options. Read it, and Tradely's ",
						"期权的买卖价差往往比股票宽，交易稀少、行权价远离股价或到期日很远的合约尤其如此。价差在成交时就已付出，与价格之后怎么走无关。本例费用为每笔交易每张 $0.65，各券商不同。在你能交易期权之前，券商必须向你提供期权清算公司（OCC）的《标准化期权的特征与风险》手册。请认真阅读，也请阅读 Tradely 的",
					)}
					<a href="/risk-disclosure" className="underline underline-offset-4">
						{l("risk disclosure", "风险披露")}
					</a>
					{l(".", "。")}
				</p>
			}
		/>
	);
}
