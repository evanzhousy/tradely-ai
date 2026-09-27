import { FieldGroup } from "@tradely/ui/components/field";
import {
	ALFA,
	type Contract,
	type Copy,
	contractLabel,
	optionQuote,
	pick,
	signedUsd,
	usd,
	valueAtExpiry,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import {
	type PayoffBand,
	PayoffChart,
	type PayoffLine,
} from "../walkthrough/instruments/payoff-chart";
import {
	type StackRow,
	stackHeight,
	ValueStack,
} from "../walkthrough/instruments/value-stack";
import { Label, Stage } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

type Right = "call" | "put";
const oct18 = (strike: number, right: Right): Contract => ({
	expiry: "oct18",
	strike,
	right,
});
const rightName = (right: Right): Copy =>
	right === "call" ? ["call", "看涨"] : ["put", "看跌"];
/** "$102" or "$104.20". */
const dollars = (value: number) =>
	usd(Math.round(value * 100), Number.isInteger(value) ? 0 : 2);

/**
 * Value at expiry in cents per share for a price in dollars. Cents per share equal dollars
 * per 100-share contract, which is how the charts below are drawn.
 */
const payoffAt = (contract: Contract, spot: number) =>
	valueAtExpiry(contract, Math.round(spot * 100));

// ——— Scene 1: what the premium pays for ———

const STRIKES = [90, 95, 100, 105, 110] as const;
type Moment = "now" | "expiry";
type PartsState = {
	right: Right;
	focus: number;
	moment: Moment;
	shown: readonly number[];
};

/** Cents per share with ALFA at $100: the Sep 16 ask, or what is left at expiry. */
function priceParts(strike: number, right: Right, moment: Moment) {
	const contract = oct18(strike, right);
	const intrinsic = valueAtExpiry(contract, ALFA.open);
	const price = moment === "now" ? optionQuote(contract).ask : intrinsic;
	return { price, intrinsic, time: price - intrinsic };
}

const PARTS_TOP = 30;

function PartsView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: PartsState;
	explore: PartsState | null;
	setExplore: (next: PartsState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const now = shown.moment === "now";
	const call = shown.right === "call";
	const name = t(rightName(shown.right));
	const rows: StackRow[] = STRIKES.map((strike) => {
		const parts = priceParts(strike, shown.right, shown.moment);
		return {
			id: String(strike),
			label: `${strike} ${name}`,
			parts: [
				{
					id: "intrinsic",
					label: usd(parts.intrinsic),
					value: parts.intrinsic,
					kind: "intrinsic",
				},
				{
					id: "time",
					label: usd(parts.time),
					value: parts.time,
					kind: "time",
				},
			],
			hidden: !shown.shown.includes(strike),
		};
	});
	const focus = priceParts(shown.focus, shown.right, shown.moment);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Each Oct 18 option's price split into intrinsic value and time value",
						"每个 10月18日 期权的价格拆分为内在价值与时间价值",
					])}
					height={PARTS_TOP + stackHeight(STRIKES.length)}
				>
					{(width) => (
						<g>
							<Label x={14} y={18} tone="muted">
								{now
									? t([
											`Oct 18 ${name}s: Sep 16 ask, ALFA at $100`,
											`10月18日 ${name}：9月16日 卖价，ALFA $100`,
										])
									: t([
											`Oct 18 ${name}s at expiry, ALFA at $100`,
											`10月18日 ${name}到期时，ALFA $100`,
										])}
							</Label>
							<rect x={14} y={32} width={14} height={10} className="wt-long" />
							<Label x={34} y={41} tone="small">
								{t(["intrinsic value", "内在价值"])}
							</Label>
							<rect
								x={150}
								y={32}
								width={14}
								height={10}
								className="wt-long-soft ev-modeled wt-stack-time"
							/>
							<Label x={170} y={41} tone="small">
								{t(["time value", "时间价值"])}
							</Label>
							<g transform={`translate(0 ${PARTS_TOP})`}>
								<ValueStack
									width={width}
									rows={rows}
									max={1200}
									focus={String(shown.focus)}
								/>
							</g>
						</g>
					)}
				</Stage>
			}
			result={[
				{
					id: "price",
					label: now
						? t([
								`${shown.focus} ${name} · Sep 16 ask`,
								`${shown.focus} ${name} · 9月16日 卖价`,
							])
						: t([
								`${shown.focus} ${name} · at expiry`,
								`${shown.focus} ${name} · 到期时`,
							]),
					value: usd(focus.price),
				},
				{
					id: "intrinsic",
					label: t(["Intrinsic value", "内在价值"]),
					value: usd(focus.intrinsic),
					note: call
						? `max($100 − $${shown.focus}, $0)`
						: `max($${shown.focus} − $100, $0)`,
					evidence: "calculated",
				},
				{
					id: "time",
					label: t(["Time value", "时间价值"]),
					value: usd(focus.time),
					note: now
						? t(["price − intrinsic", "价格 − 内在价值"])
						: t(["none left at expiry", "到期时归零"]),
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<FieldGroup>
						<ChoiceField
							label={t(["Type", "类型"])}
							value={explore.right}
							options={[
								["call", t(["Call", "看涨"])],
								["put", t(["Put", "看跌"])],
							]}
							onChange={(right) => setExplore({ ...explore, right })}
						/>
						<ChoiceField
							label={t(["Strike", "行权价"])}
							value={String(explore.focus)}
							options={STRIKES.map((strike) => [String(strike), `$${strike}`])}
							onChange={(focus) =>
								setExplore({ ...explore, focus: Number(focus) })
							}
						/>
						<ChoiceField
							label={t(["Date", "日期"])}
							value={explore.moment}
							options={[
								["now", t(["Sep 16", "9月16日"])],
								["expiry", t(["Oct 18 (expiry)", "10月18日（到期）"])],
							]}
							onChange={(moment) => setExplore({ ...explore, moment })}
						/>
					</FieldGroup>
				) : null
			}
			details={
				<p>
					{t([
						"Intrinsic value is what exercising right now would be worth: how far ALFA is above a call's strike, or below a put's. The rest of the price is time value, the market's price for what could still happen before expiry. It shrinks as expiry nears and is gone at expiry. Prices are Sep 16 asks.",
						"内在价值是立即行权的价值：ALFA 高于看涨行权价、或低于看跌行权价的差额。价格的其余部分是时间价值，即市场为到期前仍可能发生的变化所定的价。它随到期临近而缩小，到期时归零。价格为 9月16日 的卖价。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: payoff and profit for the buyer ———

type BuyId = "c100" | "c105" | "p95";
const buys: Record<BuyId, Contract> = {
	c100: oct18(100, "call"),
	c105: oct18(105, "call"),
	p95: oct18(95, "put"),
};
type ProfitState = {
	id: BuyId;
	spot: number;
	profit: boolean;
	band: boolean;
};

const BUY_RANGE = [85, 115] as const;

/** Price at which a bought option's value at expiry repays its premium, in dollars. */
const breakEven = (contract: Contract, paid: number) =>
	contract.right === "call"
		? contract.strike + paid / 100
		: contract.strike - paid / 100;

function ProfitView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ProfitState;
	explore: ProfitState | null;
	setExplore: (next: ProfitState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const contract = buys[shown.id];
	const call = contract.right === "call";
	/** Cents per share, or dollars per contract. */
	const paid = optionQuote(contract).ask;
	const be = breakEven(contract, paid);
	const value = payoffAt(contract, shown.spot);
	const result = value - paid;
	const kinks = (shift: number) =>
		[BUY_RANGE[0], contract.strike, BUY_RANGE[1]].map(
			(spot) => [spot, payoffAt(contract, spot) - shift] as const,
		);
	// The profit line starts under the value line and drops by the premium when it is paid.
	const lines: PayoffLine[] = [
		{
			id: "profit",
			label: shown.profit ? t(["profit", "盈亏"]) : "",
			points: kinks(shown.profit ? paid : 0),
			tone: "position",
		},
		{
			id: "value",
			label: t(["value at expiry", "到期价值"]),
			points: kinks(0),
			tone: shown.profit ? "reference" : "long",
		},
	];
	const bands: PayoffBand[] = shown.band
		? [
				{
					id: "itm-loss",
					from: call ? contract.strike : be,
					to: call ? be : contract.strike,
					label: t(["in the money, still losing", "实值但仍亏损"]),
					tone: "loss",
				},
			]
		: [];
	const atBreakEven = shown.profit && Math.abs(result) < 0.5;
	const tone = result > 0 ? "gain" : result < 0 ? "loss" : "neutral";
	const result3: ResultItem[] = shown.profit
		? [
				{
					id: "profit",
					label: t(["Profit", "盈亏"]),
					value: atBreakEven ? "$0" : signedUsd(result * 100, 0),
					note: t([`break-even ${dollars(be)}`, `盈亏平衡 ${dollars(be)}`]),
					tone,
				},
			]
		: [];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Value at expiry and profit after the premium against ALFA's price on Oct 18",
						"到期价值与扣除权利金后的盈亏，随 10月18日 ALFA 价格变化",
					])}
					height={(width) => (width < 520 ? 260 : 300)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 260 : 300}
							xRange={BUY_RANGE}
							yRange={[-600, 1600]}
							xTicks={[85, 90, 95, 100, 105, 110, 115]}
							yTicks={[-500, 0, 500, 1000, 1500]}
							lines={lines}
							bands={bands}
							markers={[
								{
									id: "you",
									x: shown.spot,
									y: shown.profit ? result : value,
									label: atBreakEven
										? t([
												`break-even ${dollars(be)}`,
												`盈亏平衡 ${dollars(be)}`,
											])
										: shown.profit
											? signedUsd(result * 100, 0)
											: usd(value * 100, 0),
									tone: shown.profit ? tone : "neutral",
								},
							]}
							xLabel={t(["ALFA on Oct 18", "10月18日 ALFA"])}
							title={t([
								`Long 1 ${contractLabel(contract, false)[0]} · per contract`,
								`多头 1 张 ${contractLabel(contract, false)[1]} · 每张合约`,
							])}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "value",
					label: t(["Value at expiry", "到期价值"]),
					value: usd(value * 100, 0),
					note:
						value > 0
							? call
								? `(${dollars(shown.spot)} − $${contract.strike}) × 100`
								: `($${contract.strike} − ${dollars(shown.spot)}) × 100`
							: t(["out of the money", "虚值，价值为零"]),
					evidence: "calculated",
				},
				{
					id: "paid",
					label: t(["Premium paid", "已付权利金"]),
					value: usd(paid * 100, 0),
					note: `${usd(paid)} × 100`,
				},
				...result3,
			]}
			controls={
				explore ? (
					<FieldGroup>
						<ChoiceField
							label={t(["You bought", "你买入"])}
							value={explore.id}
							options={(Object.keys(buys) as BuyId[]).map((id) => [
								id,
								`${buys[id].strike} ${t(rightName(buys[id].right))} · ${usd(optionQuote(buys[id]).ask)}`,
							])}
							onChange={(id) => setExplore({ ...explore, id })}
						/>
						<RangeControl
							label={t(["ALFA on Oct 18", "10月18日 ALFA"])}
							value={explore.spot}
							display={dollars(explore.spot)}
							min={BUY_RANGE[0]}
							max={BUY_RANGE[1]}
							step={0.5}
							onChange={(spot) => setExplore({ ...explore, spot })}
						/>
					</FieldGroup>
				) : null
			}
			details={
				<p>
					{t([
						"Payoff is the option's value at expiry and never falls below zero. Profit subtracts what you paid, so it can. A call breaks even at strike plus premium, a put at strike minus premium. Figures are per contract and before commissions and fees.",
						"到期价值是期权到期时的价值，不会低于零；盈亏要减去已付权利金，因此可以为负。看涨的盈亏平衡点是行权价加权利金，看跌是行权价减权利金。数字按每张合约计算，未含佣金和费用。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: the writer's side ———

type WriteId = "p95" | "c105";
const writes: Record<WriteId, Contract> = {
	p95: oct18(95, "put"),
	c105: oct18(105, "call"),
};
type WriteState = { id: WriteId; spot: number };

const WRITE_RANGE = [80, 120] as const;

function WriterView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: WriteState;
	explore: WriteState | null;
	setExplore: (next: WriteState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const contract = writes[shown.id];
	const put = contract.right === "put";
	/** A writer sells at the bid. Cents per share, or dollars per contract. */
	const received = optionQuote(contract).bid;
	const owed = payoffAt(contract, shown.spot);
	const result = received - owed;
	const be = put
		? contract.strike - received / 100
		: contract.strike + received / 100;
	const tone = result > 0 ? "gain" : result < 0 ? "loss" : "neutral";
	const lines: PayoffLine[] = [
		{
			id: "writer",
			label: t(["your profit", "你的盈亏"]),
			points: [WRITE_RANGE[0], contract.strike, WRITE_RANGE[1]].map(
				(spot) => [spot, received - payoffAt(contract, spot)] as const,
			),
			tone: "position",
		},
	];
	const bands: PayoffBand[] = [
		{
			id: "keep",
			from: put ? contract.strike : WRITE_RANGE[0],
			to: put ? WRITE_RANGE[1] : contract.strike,
			label: t([
				`keep all ${usd(received * 100, 0)}`,
				`全部保留 ${usd(received * 100, 0)}`,
			]),
			tone: "gain",
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The writer's profit at expiry: the premium kept, less what is owed to the holder",
						"义务方到期盈亏：保留的权利金减去需支付给持有人的金额",
					])}
					height={(width) => (width < 520 ? 260 : 300)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 260 : 300}
							xRange={WRITE_RANGE}
							yRange={[-1400, 500]}
							xTicks={[80, 90, 100, 110, 120]}
							yTicks={[-1000, -500, 0, 500]}
							lines={lines}
							bands={bands}
							markers={[
								{
									id: "you",
									x: shown.spot,
									y: result,
									label: signedUsd(result * 100, 0),
									tone,
								},
							]}
							xLabel={t(["ALFA on Oct 18", "10月18日 ALFA"])}
							title={t([
								`Short 1 ${contractLabel(contract, false)[0]} · per contract`,
								`空头 1 张 ${contractLabel(contract, false)[1]} · 每张合约`,
							])}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "received",
					label: t(["Premium received", "收取权利金"]),
					value: signedUsd(received * 100, 0),
					note: t([
						`${usd(received)} bid × 100`,
						`买价 ${usd(received)} × 100`,
					]),
				},
				{
					id: "owed",
					label: t(["Owed at expiry", "到期需支付"]),
					value: owed > 0 ? signedUsd(-owed * 100, 0) : "$0",
					note:
						owed > 0
							? put
								? `($${contract.strike} − ${dollars(shown.spot)}) × 100`
								: `(${dollars(shown.spot)} − $${contract.strike}) × 100`
							: t(["expires worthless", "到期作废"]),
					evidence: "calculated",
				},
				{
					id: "profit",
					label: t(["Profit", "盈亏"]),
					value: result === 0 ? "$0" : signedUsd(result * 100, 0),
					note: t([`break-even ${dollars(be)}`, `盈亏平衡 ${dollars(be)}`]),
					tone,
				},
				{
					id: "worst",
					label: t(["Worst case", "最坏情况"]),
					value: put
						? signedUsd(-(contract.strike * 100 - received) * 100, 0)
						: t(["no limit", "无上限"]),
					note: put
						? t(["if ALFA goes to $0", "若 ALFA 跌至 $0"])
						: t(["grows as ALFA rises", "随 ALFA 上涨而扩大"]),
					tone: "loss",
				},
			]}
			controls={
				explore ? (
					<FieldGroup>
						<ChoiceField
							label={t(["You wrote", "你卖出"])}
							value={explore.id}
							options={(Object.keys(writes) as WriteId[]).map((id) => [
								id,
								`${writes[id].strike} ${t(rightName(writes[id].right))} · ${usd(optionQuote(writes[id]).bid)}`,
							])}
							onChange={(id) => setExplore({ ...explore, id })}
						/>
						<RangeControl
							label={t(["ALFA on Oct 18", "10月18日 ALFA"])}
							value={explore.spot}
							display={dollars(explore.spot)}
							min={WRITE_RANGE[0]}
							max={WRITE_RANGE[1]}
							step={0.5}
							onChange={(spot) => setExplore({ ...explore, spot })}
						/>
					</FieldGroup>
				) : null
			}
			details={
				<p>
					{t([
						"A writer's best case is the premium. The worst case depends on how far ALFA can move: a short put's loss stops when ALFA reaches zero, an uncovered short call's never stops. That is why brokers hold margin against short options.",
						"义务方的最好结果就是权利金。最坏结果取决于 ALFA 能走多远：看跌空头的亏损在 ALFA 跌到零时停止，无备兑的看涨空头亏损没有上限。这就是券商要求为期权空头缴纳保证金的原因。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const ALL = STRIKES;

const scenes = [
	defineScene<PartsState, PartsState>({
		id: "value",
		label: ["What you pay for", "买到了什么"],
		title: [
			"The price is intrinsic value plus time value",
			"价格 = 内在价值 + 时间价值",
		],
		predict: {
			prompt: [
				"With ALFA at $100, the Oct 18 95 call costs $7.30. If ALFA is still $100 on Oct 18, what is the call worth then?",
				"ALFA 为 $100 时，10月18日 95 看涨售价 $7.30。如果 10月18日 ALFA 仍是 $100，这张看涨届时值多少？",
			],
			choices: [
				{ id: "five", label: ["$5.00", "$5.00"] },
				{ id: "same", label: ["$7.30, the same", "$7.30，不变"] },
				{ id: "zero", label: ["$0", "$0"] },
			],
			answer: "five",
			revealAt: 3,
			explain: [
				"At expiry only intrinsic value is left: the right to buy at $95 a stock worth $100 is worth $5.00 a share. The other $2.30 was time value, and time has run out.",
				"到期时只剩内在价值：以 $95 买入价值 $100 的股票，每股值 $5.00。另外 $2.30 是时间价值，而时间已经用完。",
			],
		},
		beats: [
			{
				id: "at-the-money",
				label: ["At the money", "平值"],
				caption: [
					"With ALFA at $100, the Oct 18 100 call costs $4.20. Exercising now gains nothing, so all $4.20 is time value.",
					"ALFA 为 $100 时，10月18日 100 看涨售价 $4.20。现在行权毫无收益，所以 $4.20 全是时间价值。",
				],
				state: { right: "call", focus: 100, moment: "now", shown: [100] },
			},
			{
				id: "in-the-money",
				label: ["In the money", "实值"],
				caption: [
					"The 95 call is $5 in the money, so $5.00 of its $7.30 is intrinsic value. The other $2.30 is time value.",
					"95 看涨实值 $5，所以 $7.30 中有 $5.00 是内在价值，另外 $2.30 是时间价值。",
				],
				state: {
					right: "call",
					focus: 95,
					moment: "now",
					shown: [90, 95, 100],
				},
			},
			{
				id: "out-of-the-money",
				label: ["Out of the money", "虚值"],
				caption: [
					"Calls above $100 have no intrinsic value: the 105 call's $2.15 is all time value. Time value is largest at the money.",
					"行权价高于 $100 的看涨没有内在价值：105 看涨的 $2.15 全是时间价值。时间价值在平值处最大。",
				],
				state: { right: "call", focus: 105, moment: "now", shown: ALL },
			},
			{
				id: "expiry",
				label: ["At expiry", "到期时"],
				caption: [
					"If ALFA is still $100 on Oct 18, all time value is gone. The 95 call is worth its $5.00; the 100 and 105 calls, nothing.",
					"如果 10月18日 ALFA 仍是 $100，时间价值全部消失。95 看涨值 $5.00，100 和 105 看涨一文不值。",
				],
				state: { right: "call", focus: 95, moment: "expiry", shown: ALL },
			},
		],
		explore: {
			prompt: [
				"Switch to puts, pick a strike, and compare Sep 16 with expiry.",
				"切换到看跌，选择行权价，比较 9月16日 与到期时。",
			],
			start: () => ({ right: "call", focus: 95, moment: "now", shown: ALL }),
		},
		View: PartsView,
	}),
	defineScene<ProfitState, ProfitState>({
		id: "profit",
		label: ["Payoff and profit", "到期价值与盈亏"],
		title: ["In the money is not the same as profitable", "实值不等于盈利"],
		predict: {
			prompt: [
				"You paid $4.20 for the Oct 18 100 call. ALFA closes at $102 on expiry day. What is your profit?",
				"你以 $4.20 买入 10月18日 100 看涨。到期日 ALFA 收于 $102。你的盈亏是多少？",
			],
			choices: [
				{ id: "loss", label: ["−$220: a loss", "−$220：亏损"] },
				{ id: "gain", label: ["+$200: it's in the money", "+$200：它是实值"] },
				{ id: "zero", label: ["$0: about even", "$0：大致持平"] },
			],
			answer: "loss",
			revealAt: 1,
			explain: [
				"The call is worth $200 at $102, but it cost $420. Being in the money only means the value is above zero; to profit you need ALFA above $104.20.",
				"$102 时这张看涨值 $200，但成本是 $420。实值只说明价值大于零；要盈利，ALFA 需高于 $104.20。",
			],
		},
		beats: [
			{
				id: "payoff",
				label: ["Value at expiry", "到期价值"],
				caption: [
					"On Oct 18 the call is worth ALFA minus $100 a share, or nothing. At $102 that is $2 × 100 = $200.",
					"10月18日，这张看涨每股值 ALFA 减 $100，否则为零。$102 时为 $2 × 100 = $200。",
				],
				state: { id: "c100", spot: 102, profit: false, band: false },
			},
			{
				id: "premium",
				label: ["Less the premium", "减去权利金"],
				caption: [
					"You paid $4.20 × 100 = $420. Profit is value minus premium: at $102 you are down $220, though the call is in the money.",
					"你支付了 $4.20 × 100 = $420。盈亏 = 价值 − 权利金：$102 时你亏 $220，尽管看涨已是实值。",
				],
				state: { id: "c100", spot: 102, profit: true, band: false },
			},
			{
				id: "break-even",
				label: ["Break-even", "盈亏平衡"],
				caption: [
					"You break even at $104.20, the strike plus the premium. From $100 to $104.20 the call is in the money and still loses.",
					"盈亏平衡点是 $104.20，即行权价加权利金。从 $100 到 $104.20，看涨是实值但仍亏损。",
				],
				state: { id: "c100", spot: 104.2, profit: true, band: true },
			},
			{
				id: "above",
				label: ["Above break-even", "高于盈亏平衡"],
				caption: [
					"Above $104.20 each $1 adds $100. At $110 the call is worth $1,000 and you keep $580 after the premium.",
					"高于 $104.20 后，每涨 $1 多赚 $100。$110 时看涨值 $1,000，扣除权利金后你赚 $580。",
				],
				state: { id: "c100", spot: 110, profit: true, band: true },
			},
		],
		explore: {
			prompt: [
				"Pick an option and move ALFA's closing price. Where does each one break even?",
				"选择一张期权并移动 ALFA 收盘价。每张期权的盈亏平衡点在哪里？",
			],
			start: (last) => last,
		},
		View: ProfitView,
	}),
	defineScene<WriteState, WriteState>({
		id: "writer",
		label: ["The writer's side", "义务方一侧"],
		title: [
			"The writer keeps the premium and carries the loss",
			"义务方收下权利金，也承担亏损",
		],
		predict: {
			prompt: [
				"You sold the Oct 18 95 put for $2.05. ALFA closes at $90 on expiry day. What is your result?",
				"你以 $2.05 卖出 10月18日 95 看跌。到期日 ALFA 收于 $90。你的结果是多少？",
			],
			choices: [
				{ id: "loss", label: ["−$295", "−$295"] },
				{
					id: "keep",
					label: ["+$205: I keep the premium", "+$205：权利金归我"],
				},
				{ id: "owe", label: ["−$500", "−$500"] },
			],
			answer: "loss",
			revealAt: 1,
			explain: [
				"You owe the holder $5 a share, $500, but you kept the $205 premium: −$295. The premium cushions the loss; it does not cancel it.",
				"你需向持有人支付每股 $5，共 $500，但保留了 $205 权利金：结果 −$295。权利金能缓冲亏损，但不能抵消它。",
			],
		},
		beats: [
			{
				id: "collect",
				label: ["Collect", "收取"],
				caption: [
					"Sell the Oct 18 95 put at its $2.05 bid and $205 is yours now. If ALFA ends above $95, the put expires and you keep it all.",
					"以 $2.05 的买价卖出 10月18日 95 看跌，$205 立刻到账。如果 ALFA 收在 $95 以上，看跌作废，你全部保留。",
				],
				state: { id: "p95", spot: 100 },
			},
			{
				id: "below",
				label: ["Below the strike", "低于行权价"],
				caption: [
					"Below $95 you owe the difference. You break even at $92.95, the strike minus the premium; at $90 you are down $295.",
					"低于 $95 时你要支付差额。盈亏平衡点是 $92.95，即行权价减权利金；$90 时你亏 $295。",
				],
				state: { id: "p95", spot: 90 },
			},
			{
				id: "further",
				label: ["Further down", "继续下跌"],
				caption: [
					"Each $1 lower costs another $100: −$795 at $85, and −$9,295 if ALFA went to zero. The most you can make is $205.",
					"每再跌 $1 就多亏 $100：$85 时 −$795，ALFA 跌到零时 −$9,295。而你最多只能赚 $205。",
				],
				state: { id: "p95", spot: 85 },
			},
			{
				id: "short-call",
				label: ["A short call", "看涨空头"],
				caption: [
					"Write the Oct 18 105 call instead and the loss has no floor: −$795 at $115, and each $1 higher costs another $100.",
					"改为卖出 10月18日 105 看涨，亏损就没有下限：$115 时 −$795，之后每涨 $1 再亏 $100。",
				],
				state: { id: "c105", spot: 115 },
			},
		],
		explore: {
			prompt: [
				"Pick the option you wrote and move ALFA's closing price.",
				"选择你卖出的期权，移动 ALFA 收盘价。",
			],
			start: (last) => last,
		},
		View: WriterView,
	}),
] as const;

export function PremiumPayoffWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="premium-payoff"
			label={[
				"Interactive lesson on premium, payoff and profit",
				"权利金、到期价值与盈亏互动课",
			]}
			scenes={scenes}
		/>
	);
}
