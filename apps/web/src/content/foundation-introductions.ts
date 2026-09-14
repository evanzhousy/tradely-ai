import type { LearningCopy } from "@/domain/learning/types";

export type LessonIntroduction = {
	question: LearningCopy;
	outcome: LearningCopy;
	before: LearningCopy;
	explanation: LearningCopy;
	example: LearningCopy;
	terms: { name: LearningCopy; definition: LearningCopy }[];
};
const t = (en: string, zh: string): LearningCopy => ({ en, zh });

/** Public teaching copy. Assessment cases and answer keys stay server-only. */
export const foundationIntroductions: Record<string, LessonIntroduction> = {
	"option-contracts": {
		question: t(
			"What exactly am I buying, and what will it cost?",
			"我买的到底是什么，要支付多少钱？",
		),
		outcome: t(
			"Identify an option contract and calculate its premium from the supplied units.",
			"识别一份期权合约，并按给定单位计算权利金。",
		),
		before: t(
			"No options knowledge needed. You will use multiplication and read a date.",
			"无需期权基础；只需要乘法和辨认日期。",
		),
		explanation: t(
			"An option refers to a stock, ETF or index. Its type, strike, expiration and product terms tell you which contract it is. A new price or observation time can describe the same contract. Always read the stated multiplier before converting a quoted price into money.",
			"期权参考股票、ETF 或指数。类型、行权价、到期日和产品条款共同说明是哪份合约。价格或观测时间改变，仍可能是同一合约。把报价换成金额前，先读给定乘数。",
		),
		example: t(
			"A teaching contract is quoted at $2 per share and specifies 100 shares per contract. Buying 3 costs $2 × 100 × 3 = $600 before fees. That is the premium paid; it does not say what you will earn.",
			"教学合约每股报价 $2，明确每张 100 股。买入 3 张需 $2 × 100 × 3 = $600，不含费用。这是已付权利金，并不说明能赚多少。",
		),
		terms: [
			{
				name: t("Underlying", "标的"),
				definition: t(
					"The asset or index the option refers to. A stock ticker identifies the underlying, not the full contract.",
					"期权参考的资产或指数。股票代码只识别标的，不能识别完整合约。",
				),
			},
			{
				name: t("Strike and expiration", "行权价与到期日"),
				definition: t(
					"Strike is the contract's exercise price; expiration is when it ends. Two contracts can share a ticker but have different expirations.",
					"行权价是合约规定的行权价格；到期日是合约结束的日期。同一标的可以有不同到期日的合约。",
				),
			},
			{
				name: t("Multiplier and deliverable", "乘数与交付物"),
				definition: t(
					"The multiplier converts each quoted unit into money. The deliverable says what physical settlement transfers. They must come from the product terms; a cash-settled index option does not deliver index shares.",
					"乘数将每个报价单位换算为金额；交付物说明实物结算转移什么。两者都需读取产品条款，现金结算指数期权不交付指数股票。",
				),
			},
		],
	},
	"option-rights": {
		question: t(
			"Does buying or selling an option mean buying or selling the stock?",
			"买卖期权，是否就等于买卖股票？",
		),
		outcome: t(
			"Explain a holder's right, a writer's obligation, and the difference between closing and exercise.",
			"解释持有人的权利、卖方的义务，以及平仓和行权的区别。",
		),
		before: t(
			"Know how to identify the contract and read its multiplier. Lesson 1 introduces both.",
			"先认识合约和乘数，第一课介绍了这两点。",
		),
		explanation: t(
			"A call holder has a right to buy; a put holder has a right to sell under the contract's terms. An assigned writer has the corresponding obligation. Trading the option changes an option position. Exercising it uses the contract's right; these are different events.",
			"看涨持有人有权按条款买入，看跌持有人有权按条款卖出。被指派的卖方承担对应义务。买卖期权改变的是期权持仓，行权才是使用合约权利；两者不是同一事件。",
		),
		example: t(
			"One physically settled $50 put specifies 100 shares. If assigned, its writer buys 100 shares for $5,000. Selling an existing long put to close instead ends that option position; it does not invoke exercise.",
			"一张实物结算、行权价 $50 的看跌期权明确交付 100 股。被指派的卖方需用 $5,000 买入这些股票。若持有人卖出已有看跌期权平仓，则只是结束期权持仓，没有行权。",
		),
		terms: [
			{
				name: t("Holder / long", "持有人／多头"),
				definition: t(
					"The side that owns the option right. Owning a call does not itself give you the referenced shares.",
					"拥有期权权利的一方。持有看涨期权本身，不代表已拥有对应股票。",
				),
			},
			{
				name: t("Writer / short", "卖方／空头"),
				definition: t(
					"The side with the obligation if assigned. A sale can also close an existing long option, so the word 'sell' alone is insufficient.",
					"被指派时承担义务的一方。卖出也可能是在平掉已有多头，因此仅凭“卖出”不能判断。",
				),
			},
			{
				name: t("Assignment", "指派"),
				definition: t(
					"Allocation of an exercise obligation to a writer. The call or put terms determine whether that writer buys or sells the deliverable.",
					"将行权义务分配给卖方。看涨或看跌条款决定卖方买入还是卖出交付物。",
				),
			},
		],
	},
	"premium-payoff": {
		question: t(
			"Can an option finish in the money and still lose money?",
			"期权到期实值，是否仍会亏钱？",
		),
		outcome: t(
			"Calculate a buyer's premium, expiration payoff and profit separately.",
			"分别计算买方权利金、到期价值与盈亏。",
		),
		before: t(
			"Know calls and puts, the strike, and the stated multiplier from lessons 1–2.",
			"先了解第一至二课中的看涨、看跌、行权价和给定乘数。",
		),
		explanation: t(
			"At expiration, a call's value per share is the positive part of price minus strike; a put reverses that subtraction. Multiply by the supplied units and quantity. Then subtract the premium paid and fees to find the buyer's profit. A zero payoff can still leave a loss.",
			"到期时，看涨每股价值取现价减行权价的正值，看跌则反向相减。再乘给定单位和数量。计算买方盈亏时，减去已付权利金及费用。到期价值为零，仍可能亏损。",
		),
		example: t(
			"Buy 2 calls, strike $100, at $3 per share with a 100 multiplier. If the expiration price is $102, payoff is $400 and premium was $600. Profit is −$200 before fees, despite the calls being in the money.",
			"买入 2 张行权价 $100 的看涨，每股支付 $3、乘数 100。到期现价 $102 时，价值为 $400，而已付权利金为 $600。虽然实值，不含费用仍亏 $200。",
		),
		terms: [
			{
				name: t("Premium", "权利金"),
				definition: t(
					"The price paid for the option. A quote per share must be converted into the total purchase amount.",
					"购买期权支付的价格。每股报价需要换算为总购买金额。",
				),
			},
			{
				name: t("In the money", "实值"),
				definition: t(
					"A call has positive intrinsic value above its strike; a put below its strike. This says nothing about recovering the purchase cost.",
					"看涨在现价高于行权价、看跌在低于行权价时有正内在价值。这并不意味着收回购买成本。",
				),
			},
			{
				name: t("Payoff versus profit", "到期价值与盈亏"),
				definition: t(
					"Payoff is the option's value at expiration. Buyer profit subtracts premium and fees. Profit can be negative even though payoff is floored at zero.",
					"到期价值指期权到期时的价值。买方盈亏还需减权利金和费用。到期价值最低为零，但盈亏可以为负。",
				),
			},
		],
	},
	"expiration-settlement": {
		question: t(
			"When this option ends, what actually changes hands?",
			"期权结束时，到底交付什么？",
		),
		outcome: t(
			"Distinguish a closing trade from exercise, and calculate settlement using the stated reference.",
			"区分平仓交易与行权，并用指定参考值计算结算。",
		),
		before: t(
			"Know holder and writer roles, plus payoff versus profit, from lessons 2–3.",
			"先了解第二至三课中的持有人、卖方，以及到期价值和盈亏的区别。",
		),
		explanation: t(
			"Selling a long option to close is a trade. Exercise uses its right, assignment gives a writer the obligation, and settlement fulfills the terms. Physical settlement transfers the specified asset; cash settlement uses the official reference in the contract. A last displayed price may be different.",
			"卖出期权多头平仓是一笔交易。行权使用权利，指派分配卖方义务，结算则履行条款。实物结算转移指定资产；现金结算使用合约指定的官方参考值。最新展示价格可能与其不同。",
		),
		example: t(
			"A cash-settled call has strike 4,000, official settlement 4,025 and $100 per point. Its cash payoff is $2,500. A displayed price of 4,030 does not replace that reference, and no index shares are delivered.",
			"现金结算看涨行权价 4,000，官方结算值 4,025，每点 $100，现金到期价值为 $2,500。展示价格 4,030 不能替代指定参考值，也不交付指数股票。",
		),
		terms: [
			{
				name: t("Exercise style", "行权方式"),
				definition: t(
					"The schedule under which exercise is allowed. Read the product terms; American and European describe timing, not geography.",
					"允许行权的时间安排。需读取产品条款；美式与欧式描述时间，不是地理位置。",
				),
			},
			{
				name: t("Settlement reference", "结算参考值"),
				definition: t(
					"The value specified for the settlement calculation. If it is missing, an unrelated spot quote cannot fill the gap.",
					"条款规定用于结算计算的数值。若其缺失，不能用无关现价代替。",
				),
			},
		],
	},
};
