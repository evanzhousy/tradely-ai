import { FieldGroup } from "@tradely/ui/components/field";
import {
	type Contract,
	type Copy,
	contractLabel,
	count,
	optionQuote,
	percent,
	pick,
	priceOption,
	signedUsd,
	usd,
	valueAtExpiry,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import {
	PayoffChart,
	type PayoffLine,
} from "../walkthrough/instruments/payoff-chart";
import {
	ROUND_TRIP_HEIGHT,
	RoundTrip,
} from "../walkthrough/instruments/round-trip";
import { Stage } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);
const call100: Contract = { expiry: "oct18", strike: 100, right: "call" };
const PAID = optionQuote(call100).ask;
const DAYS = 32;
const FEE = 65;

// ——— Scene 1: right, still losing ———

type DecayState = { spot: number; days: number; iv: 35 | 25 };

const value = (spot: number, days: number, iv: number) =>
	priceOption({
		spot,
		strike: 100,
		days: DAYS - days,
		iv: iv / 100,
		right: "call",
	}).price;
const curve = (days: number, iv: number) =>
	Array.from({ length: 41 }, (_, i) => {
		const spot = 90 + i / 2;
		return [spot, value(spot, days, iv)] as const;
	});
const dateAfter = (days: number): Copy => {
	const date = new Date(Date.UTC(2030, 8, 16 + days));
	const month = date.getUTCMonth();
	const day = date.getUTCDate();
	return [`${["Sep", "Oct"][month - 8]} ${day}`, `${month + 1}月${day}日`];
};

/** ALFA's move since you bought: "+$2.00 (2.0%)". */
const sinceBuy = (spot: number) =>
	`${signedUsd((spot - 100) * 100)} (${percent((spot - 100) / 100)})`;
/** The call's value per share and its change on the premium: "$3.10 (−26.2%)". */
const callValue = (dollars: number) =>
	`${usd(dollars * 100)} (${percent((dollars * 100 - PAID) / PAID)})`;
/** Whole dollars per contract from cents. */
const perContract = (cents: number) => signedUsd(Math.round(cents), 0);

function DecayView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: DecayState;
	explore: DecayState | null;
	setExplore: (next: DecayState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const now = Math.round(value(shown.spot, shown.days, shown.iv) * 100) / 100;
	const result = Math.round((now * 100 - PAID) * 100);
	const lines: PayoffLine[] = [
		{
			id: "start",
			label: t(["Sep 16", "9月16日"]),
			points: curve(0, 35),
			tone: "reference",
		},
		{
			id: "paid",
			label: t([`paid ${usd(PAID)}`, `已付 ${usd(PAID)}`]),
			points: [
				[90, PAID / 100],
				[110, PAID / 100],
			],
			tone: "short",
			dashed: true,
		},
		{
			id: "now",
			label: t(dateAfter(shown.days)),
			points: curve(shown.days, shown.iv),
			tone: "position",
			dashed: true,
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The call's modeled value against ALFA's price, on the day you bought it and now",
						"看涨期权的模型价值与 ALFA 价格的关系：买入当天与现在",
					])}
					height={(width) => (width < 520 ? 250 : 290)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 250 : 290}
							xRange={[90, 110]}
							yRange={[0, 12]}
							xTicks={[90, 95, 100, 105, 110]}
							yTicks={[0, 4, 8, 12]}
							lines={lines}
							markers={[
								{
									id: "you",
									x: shown.spot,
									y: now,
									label: usd(now * 100),
									tone: result < 0 ? "loss" : "gain",
								},
							]}
							drag={
								explore
									? {
											markerId: "you",
											min: 90,
											max: 110,
											step: 1,
											onChange: (spot) => setExplore({ ...explore, spot }),
										}
									: undefined
							}
							xLabel={t(["ALFA price", "ALFA 价格"])}
							title={t([
								`${contractLabel(call100)[0]} · model value per share`,
								`${contractLabel(call100)[1]} · 每股模型价值`,
							])}
							formatY={(v) => `$${v}`}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "stock",
					label: t(["ALFA since Sep 16", "9月16日 以来 ALFA"]),
					value: sinceBuy(shown.spot),
					tween: { to: shown.spot, format: sinceBuy },
					tone:
						shown.spot > 100 ? "gain" : shown.spot < 100 ? "loss" : undefined,
				},
				{
					id: "value",
					label: t(["Call value", "看涨期权价值"]),
					value: callValue(now),
					tween: { to: now, format: callValue },
					evidence: "modeled",
				},
				{
					id: "result",
					label: t(["Result per contract", "每张合约盈亏"]),
					value: perContract(result),
					tween: { to: result, format: perContract },
					tone: result > 0 ? "gain" : result < 0 ? "loss" : undefined,
					note: t([`paid ${usd(PAID)}`, `已付 ${usd(PAID)}`]),
				},
			]}
			controls={
				explore ? (
					<FieldGroup>
						<RangeControl
							label={t(["ALFA price", "ALFA 价格"])}
							value={explore.spot}
							display={usd(explore.spot * 100, 0)}
							min={90}
							max={110}
							onChange={(spot) => setExplore({ ...explore, spot })}
						/>
						<RangeControl
							label={t(["Days since Sep 16", "9月16日 以来天数"])}
							value={explore.days}
							display={t([
								`${explore.days} of ${DAYS}`,
								`${explore.days} / ${DAYS} 天`,
							])}
							min={0}
							max={DAYS}
							onChange={(days) => setExplore({ ...explore, days })}
						/>
						<ChoiceField
							label={t(["Implied volatility", "隐含波动率"])}
							value={String(explore.iv) as "35" | "25"}
							options={[
								["35", t(["35% · before earnings", "35% · 财报前"])],
								["25", t(["25% · after earnings", "25% · 财报后"])],
							]}
							onChange={(iv) =>
								setExplore({ ...explore, iv: iv === "35" ? 35 : 25 })
							}
						/>
					</FieldGroup>
				) : null
			}
			details={
				<p>
					{t([
						"Before expiry an option's price is what it would be worth now plus time value. Time value shrinks every day, faster near expiry, and falls when implied volatility drops, as it often does after earnings. The dashed curves are model values (Black-Scholes, no interest or dividends), not quotes.",
						"到期前，期权价格等于“假如现在到期能值多少”再加上时间价值。时间价值每天缩水，越临近到期缩得越快；隐含波动率下降时（财报后常见）也会下跌。虚线是模型价值（Black-Scholes，不计利率与股息），不是报价。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: buyer vs writer ———

type Side = "buyer" | "writer";
type TailState = { side: Side; spot: number };
const atExpiry = (side: Side, spot: number) => {
	const buyer = valueAtExpiry(call100, spot * 100) - PAID;
	return side === "buyer" ? buyer : -buyer;
};
const tailPoints = (side: Side) =>
	[80, 100, 140].map((spot) => [spot, atExpiry(side, spot)] as const);

function TailView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: TailState;
	explore: TailState | null;
	setExplore: (next: TailState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result = atExpiry(shown.side, shown.spot);
	const lines: PayoffLine[] = (["buyer", "writer"] as const).map((side) => ({
		id: side,
		label: side === "buyer" ? t(["buyer", "买方"]) : t(["writer", "义务方"]),
		points: tailPoints(side),
		tone: side === shown.side ? "position" : "reference",
	}));
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Profit or loss at expiry for the buyer and the writer of the same call",
						"同一张看涨期权的买方与义务方在到期时的盈亏",
					])}
					height={(width) => (width < 520 ? 260 : 300)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 260 : 300}
							xRange={[80, 140]}
							yRange={[-4_000, 4_000]}
							xTicks={[80, 100, 120, 140]}
							yTicks={[-3_000, 0, 3_000]}
							lines={lines}
							markers={[
								{
									id: "result",
									x: shown.spot,
									y: result,
									label: signedUsd(result * 100, 0),
									tone: result < 0 ? "loss" : "gain",
								},
							]}
							drag={
								explore
									? {
											markerId: "result",
											min: 80,
											max: 140,
											step: 1,
											onChange: (spot) => setExplore({ ...explore, spot }),
										}
									: undefined
							}
							xLabel={t(["ALFA on Oct 18", "10月18日 ALFA"])}
							title={t([
								`${contractLabel(call100)[0]} · per contract at expiry`,
								`${contractLabel(call100)[1]} · 每张合约到期盈亏`,
							])}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "result",
					label: t(["Result at expiry", "到期盈亏"]),
					value: signedUsd(result * 100, 0),
					tween: { to: result, format: (v) => signedUsd(v * 100, 0) },
					tone: result > 0 ? "gain" : result < 0 ? "loss" : undefined,
				},
				{
					id: "premium",
					label: t(["Premium", "权利金"]),
					value:
						shown.side === "buyer"
							? t([`paid ${usd(PAID * 100, 0)}`, `支付 ${usd(PAID * 100, 0)}`])
							: t([
									`collected ${usd(PAID * 100, 0)}`,
									`收取 ${usd(PAID * 100, 0)}`,
								]),
				},
				{
					id: "worst",
					label: t(["Worst case", "最坏情况"]),
					value:
						shown.side === "buyer"
							? t([
									`${signedUsd(-PAID * 100, 0)}, the premium`,
									`${signedUsd(-PAID * 100, 0)}，即权利金`,
								])
							: t(["No fixed limit", "没有固定上限"]),
					tone: "loss",
				},
			]}
			controls={
				explore ? (
					<FieldGroup>
						<ChoiceField
							label={t(["Side", "角色"])}
							value={explore.side}
							options={[
								["buyer", t(["Buyer (holder)", "买方（持有人）"])],
								["writer", t(["Writer, uncovered", "义务方（未备兑）"])],
							]}
							onChange={(side) => setExplore({ ...explore, side })}
						/>
						<RangeControl
							label={t(["ALFA on Oct 18", "10月18日 ALFA"])}
							value={explore.spot}
							display={usd(explore.spot * 100, 0)}
							min={80}
							max={140}
							onChange={(spot) => setExplore({ ...explore, spot })}
						/>
					</FieldGroup>
				) : null
			}
			details={
				<p>
					{t([
						"The buyer's loss stops at the premium. The uncovered writer's gain stops at the premium, while the loss grows $100 for every $1 ALFA ends above $100, and a stock price has no ceiling. That is why brokers require a higher approval level and margin to write uncovered options.",
						"买方的亏损止于权利金。未备兑义务方的收益止于权利金，而 ALFA 收在 $100 以上每多 $1，亏损就多 $100，股价又没有上限。因此券商要求更高的期权权限和保证金才能卖出未备兑期权。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: trading costs ———

type Kind = "active" | "thin";
type CostState = { kind: Kind; contracts: number; breakeven: boolean };
const costContracts: Record<Kind, Contract> = {
	active: call100,
	thin: { expiry: "dec20", strike: 110, right: "call" },
};

function costFacts(state: CostState) {
	const quote = optionQuote(costContracts[state.kind]);
	const shares = state.contracts * 100;
	const spread = (quote.ask - quote.bid) * shares;
	const fees = FEE * state.contracts * 2;
	const paid = quote.ask * shares;
	// The bid has to reach the price paid plus both fees before selling breaks even.
	const breakeven = quote.ask + fees / shares;
	return { quote, spread, fees, loss: spread + fees, paid, breakeven };
}

function CostView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: CostState;
	explore: CostState | null;
	setExplore: (next: CostState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const facts = costFacts(shown);
	const contract = costContracts[shown.kind];
	const result: ResultItem[] = [
		{
			id: "spread",
			label: t(["Lost to the spread", "价差损失"]),
			value: usd(facts.spread),
		},
		{
			id: "fees",
			label: t(["Fees on 2 trades", "两笔交易费用"]),
			value: usd(facts.fees),
		},
		shown.breakeven
			? {
					id: "breakeven",
					label: t(["Break-even bid", "盈亏平衡买价"]),
					value: usd(Math.ceil(facts.breakeven)),
					note: t([
						`${percent(facts.breakeven / facts.quote.bid - 1)} above ${usd(facts.quote.bid)}`,
						`比 ${usd(facts.quote.bid)} 高 ${percent(facts.breakeven / facts.quote.bid - 1)}`,
					]),
				}
			: {
					id: "loss",
					label: t(["Round-trip loss", "一买一卖亏损"]),
					value: usd(-facts.loss),
					tone: "loss",
					note: t([
						`${percent(facts.loss / facts.paid)} of ${usd(facts.paid, 0)} paid`,
						`占所付 ${usd(facts.paid, 0)} 的 ${percent(facts.loss / facts.paid)}`,
					]),
				},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A quote's spread, and what buying at the ask and selling straight back at the bid costs",
						"报价的价差，以及按卖价买入再立即按买价卖出的成本",
					])}
					height={ROUND_TRIP_HEIGHT}
				>
					{(width) => (
						<RoundTrip
							width={width}
							bid={facts.quote.bid}
							ask={facts.quote.ask}
							contracts={shown.contracts}
							fee={FEE}
							labels={{
								title: t(contractLabel(contract)),
								bid: t(["Bid", "买价"]),
								ask: t(["Ask", "卖价"]),
								spread: t(["spread", "价差"]),
								action: t([
									"Buy at the ask, sell straight back",
									"按卖价买入，再立即卖出",
								]),
								back: t(["Back", "收回"]),
								lost: t(["Lost", "损失"]),
								share: (value) =>
									t([`${value} of what you paid`, `占所付金额的 ${value}`]),
							}}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<FieldGroup>
						<ChoiceField
							label={t(["Contract", "合约"])}
							value={explore.kind}
							options={[
								[
									"active",
									t(["Active: Oct 18 100 call", "活跃：10月18日 100 看涨"]),
								],
								[
									"thin",
									t(["Thin: Dec 20 110 call", "清淡：12月20日 110 看涨"]),
								],
							]}
							onChange={(kind) => setExplore({ ...explore, kind })}
						/>
						<RangeControl
							label={t(["Contracts", "张数"])}
							value={explore.contracts}
							display={count(explore.contracts)}
							min={1}
							max={20}
							onChange={(contracts) => setExplore({ ...explore, contracts })}
						/>
					</FieldGroup>
				) : null
			}
			details={
				<p>
					{t([
						"Option spreads are often wider than stock spreads, especially for contracts that trade rarely or expire far out. You pay the spread when you trade, before the price moves. Fees here are $0.65 per contract per trade; brokers differ. Before you can trade options, your broker must give you the booklet Characteristics and Risks of Standardized Options. Read it, and Tradely's ",
						"期权的买卖价差往往比股票宽，交易稀少或到期日很远的合约尤其如此。价差在成交时就已付出，与价格之后怎么走无关。本例费用为每笔交易每张 $0.65，各券商不同。在你能交易期权之前，券商必须向你提供《标准化期权的特征与风险》手册。请认真阅读，也请阅读 Tradely 的",
					])}
					<a href="/risk-disclosure" className="underline underline-offset-4">
						{t(["risk disclosure", "风险披露"])}
					</a>
					{t([".", "。"])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<DecayState, DecayState>({
		id: "decay",
		label: ["Right, still losing", "方向对了仍亏钱"],
		title: [
			"A call can lose value while the stock rises",
			"股价上涨，看涨期权仍可能贬值",
		],
		predict: {
			prompt: [
				"20 days after you buy at $4.20, ALFA has risen from $100 to $102. Is your call worth more or less than you paid?",
				"你以 $4.20 买入 20 天后，ALFA 从 $100 涨到 $102。你的看涨期权比买入价更值钱还是更不值钱？",
			],
			choices: [
				{
					id: "less",
					label: ["Less: time value has drained", "更少：时间价值流失了"],
				},
				{ id: "more", label: ["More: ALFA went up", "更多：ALFA 涨了"] },
				{ id: "same", label: ["Exactly $4.20", "正好 $4.20"] },
			],
			answer: "less",
			explain: [
				"Twenty of the 32 days have passed. The call lost more time value than the $2 rise added, so it is worth less than you paid even though ALFA went up.",
				"32 天中已过去 20 天。看涨期权流失的时间价值多于 $2 上涨带来的价值，所以即使 ALFA 上涨，它也比你的买入价更低。",
			],
		},
		beats: [
			{
				id: "buy",
				label: ["Buy at $4.20", "以 $4.20 买入"],
				caption: [
					"Sep 16: you buy the Oct 18 100 call at the $4.20 ask, 32 days before expiry, with implied volatility at 35%.",
					"9月16日：你以卖价 $4.20 买入 10月18日 100 看涨，距到期 32 天，隐含波动率 35%。",
				],
				state: { spot: 100, days: 0, iv: 35 },
			},
			{
				id: "later",
				label: ["20 days later", "20 天后"],
				caption: [
					"Oct 6, 20 days later: ALFA is up $2 at $102, but the call is worth only $3.68. Lost time value outweighs the rise: −$52.",
					"10月6日，20 天后：ALFA 涨了 $2 到 $102，但看涨期权只值 $3.68。流失的时间价值超过涨幅：−$52。",
				],
				state: { spot: 102, days: 20, iv: 35 },
			},
			{
				id: "crush",
				label: ["Volatility falls", "波动率下降"],
				caption: [
					"ALFA's earnings are out and implied volatility drops to 25%. The same call is worth $3.00: −$120, although ALFA rose.",
					"ALFA 财报公布后，隐含波动率降到 25%。同一张看涨只值 $3.00：虽然 ALFA 上涨，仍亏 $120。",
				],
				state: { spot: 102, days: 20, iv: 25 },
			},
		],
		explore: {
			prompt: [
				"Drag across the chart to move ALFA's price, then set the days that have passed and implied volatility. Compare the call's value with the $4.20 you paid.",
				"在图上左右拖动来调整 ALFA 价格，再调整已过天数和隐含波动率，把看涨期权的价值与你支付的 $4.20 比较。",
			],
			start: (last) => last,
		},
		View: DecayView,
	}),
	defineScene<TailState, TailState>({
		id: "tail",
		label: ["Buyer vs writer", "买方与义务方"],
		title: [
			"A writer can lose far more than the premium",
			"义务方的亏损可能远超权利金",
		],
		predict: {
			prompt: [
				"Ben collected $420 for writing the call without owning ALFA. ALFA ends at $120. What is his result?",
				"Ben 在不持有 ALFA 的情况下卖出看涨，收取 $420。ALFA 收在 $120。他的结果是多少？",
			],
			choices: [
				{ id: "loss", label: ["−$1,580", "−$1,580"] },
				{ id: "keep", label: ["+$420", "+$420"] },
				{ id: "premium", label: ["−$420", "−$420"] },
			],
			answer: "loss",
			explain: [
				"He must deliver shares worth $120 for $100: −$2,000, softened only by the $420 he collected. Every further $1 rise costs him another $100.",
				"他必须以 $100 交付价值 $120 的股票：−$2,000，只被他收取的 $420 抵消一部分。股价每再涨 $1，他就再亏 $100。",
			],
		},
		beats: [
			{
				id: "keep",
				label: ["Writer keeps $420", "义务方保留 $420"],
				caption: [
					"Ben writes the Oct 18 100 call without owning ALFA and collects $420. If ALFA ends at or below $100, he keeps it all.",
					"Ben 在不持有 ALFA 的情况下卖出 10月18日 100 看涨，收取 $420。若 ALFA 收在 $100 或以下，他全部保留。",
				],
				state: { side: "writer", spot: 100 },
			},
			{
				id: "jump",
				label: ["ALFA jumps to $120", "ALFA 涨到 $120"],
				caption: [
					"If ALFA ends at $120, he must deliver $120 shares for $100: −$1,580. Every further $1 rise costs another $100.",
					"若 ALFA 收在 $120，他必须以 $100 交付价值 $120 的股票：−$1,580。股价每再涨 $1，再亏 $100。",
				],
				state: { side: "writer", spot: 120 },
			},
			{
				id: "buyer",
				label: ["Buyer's fixed worst case", "买方固定的最坏情况"],
				caption: [
					"The buyer's worst case is fixed: at $90, or anywhere at or below $100, the call expires and the loss stops at $420.",
					"买方的最坏情况是固定的：在 $90，或任何不高于 $100 的价格，看涨期权作废，亏损止于 $420。",
				],
				state: { side: "buyer", spot: 90 },
			},
		],
		explore: {
			prompt: [
				"Switch sides and drag across the chart to move ALFA's price on Oct 18. Compare each side's best and worst case.",
				"切换买卖双方，并在图上左右拖动来移动 10月18日 的 ALFA 价格，比较双方的最好与最坏情况。",
			],
			start: () => ({ side: "writer", spot: 110 }),
		},
		View: TailView,
	}),
	defineScene<CostState, CostState>({
		id: "costs",
		label: ["Trading costs", "交易成本"],
		title: [
			"A wide spread costs you before the price moves",
			"宽价差在价格变动前就让你付出成本",
		],
		predict: {
			prompt: [
				"You buy 5 of the thin Dec 20 110 calls at $2.65 and sell them straight back at $2.20, paying $0.65 per contract per trade. What do you lose?",
				"你以 $2.65 买入 5 张交易清淡的 12月20日 110 看涨，再立即以 $2.20 卖出，每笔每张付 $0.65。你亏多少？",
			],
			choices: [
				{ id: "full", label: ["$231.50", "$231.50"] },
				{ id: "spread", label: ["$45", "$45"] },
				{ id: "fees", label: ["$6.50", "$6.50"] },
			],
			answer: "full",
			revealAt: 1,
			explain: [
				"The $0.45 spread on 500 shares is $225, plus $6.50 in fees for two trades of 5 contracts: $231.50 gone before ALFA moves.",
				"$0.45 的价差乘以 500 股是 $225，再加上两笔 5 张交易的 $6.50 费用：ALFA 还没动，$231.50 就没了。",
			],
		},
		beats: [
			{
				id: "active",
				label: ["Active contract", "活跃合约"],
				caption: [
					"The busy Oct 18 100 call is $4.05 bid, $4.20 ask. Buying 5 and selling straight back loses $75 in spread plus $6.50 in fees.",
					"交易活跃的 10月18日 100 看涨为买价 $4.05、卖价 $4.20。买入 5 张再立即卖出，价差损失 $75，另加 $6.50 费用。",
				],
				state: { kind: "active", contracts: 5, breakeven: false },
			},
			{
				id: "thin",
				label: ["Thin contract", "清淡合约"],
				caption: [
					"The thin Dec 20 110 call is $2.20 bid, $2.65 ask. The same round trip loses $231.50: 17.5% of what you paid.",
					"交易清淡的 12月20日 110 看涨为买价 $2.20、卖价 $2.65。同样一买一卖亏损 $231.50：占所付金额的 17.5%。",
				],
				state: { kind: "thin", contracts: 5, breakeven: false },
			},
			{
				id: "breakeven",
				label: ["Break-even", "盈亏平衡"],
				caption: [
					"To sell those 5 calls without a loss, their bid must climb from $2.20 to about $2.67, a 21% rise, before ALFA moves at all.",
					"要卖出这 5 张而不亏，它们的买价必须从 $2.20 升到约 $2.67，涨 21%，而 ALFA 还一点没动。",
				],
				state: { kind: "thin", contracts: 5, breakeven: true },
			},
		],
		explore: {
			prompt: [
				"Choose a contract and the number of contracts. Compare what a round trip costs.",
				"选择合约与张数，比较一买一卖的成本。",
			],
			start: () => ({ kind: "active", contracts: 10, breakeven: false }),
		},
		View: CostView,
	}),
] as const;

export function OptionsRisksWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="options-risks"
			label={[
				"Interactive lesson on how options lose money",
				"期权如何亏钱互动课",
			]}
			scenes={scenes}
		/>
	);
}
