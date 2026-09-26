import "@tanstack/react-start/server-only";
import {
	basics,
	choose as c,
	fact as f,
	numberQuestion as n,
	type TeachingUnit,
	t,
} from "../authoring.server";

/** Original rubrics for previously saved foundation attempts. */
export const archivedFoundationUnits: TeachingUnit[] = [
	{
		id: "option-contracts",
		version: 3,
		conceptLab: {
			kind: "option-contracts",
			intro: t(
				"Take a contract apart, change one field, and follow its units. Explore these four scenes at your own pace before practicing with new evidence.",
				"拆解一张合约，改变一个字段，再追踪它的单位。按自己的节奏探索四个场景，然后用新证据练习。",
			),
		},
		sources: [basics],
		explanation: t(
			"An underlying is the asset or index referenced by an option. A stock, an ETF share and a cash-settled index are not interchangeable instruments. A ticker identifies an underlying; a contract also needs call/put, strike and expiration. Its multiplier states how a quoted unit converts into a cash amount. Read the product terms rather than assuming every contract delivers 100 shares. The source date belongs to every price or volume observation: it is not part of the permanent contract key.",
			"标的是期权参考的资产或指数。股票、ETF 份额与现金结算指数并非同一类工具。代码识别标的，合约还需看涨/看跌、行权价和到期日。乘数决定报价单位如何换算成金额，不能假定所有合约均交付 100 股。每项价格或成交量都有来源日期，但该日期不是合约固定身份的一部分。",
		),
		example: t(
			"ALFA 100 call expiring October 16 and ALFA 100 call expiring November 20 share an underlying and strike but are different contracts. With a stated 100-share multiplier, 3 contracts represent 300 shares of contractual deliverable. A price of $2 per share implies $200 premium for one contract.",
			"ALFA 100 看涨、10 月 16 日到期，与 ALFA 100 看涨、11 月 20 日到期，标的和行权价相同，但合约不同。给定每张 100 股，3 张对应 300 股交付数量。每股报价 $2，对应每张权利金 $200。",
		),
		misconception: t(
			"Do not group contracts by ticker alone. Contract count, deliverable shares and dollars have different units.",
			"不能只按标的代码合并合约。合约张数、交付股数和金额的单位不同。",
		),
		case: (v) => {
			const count = [4, 7, 9, 6][v];
			const price = [2, 1.5, 2.4, 3][v];
			return {
				brief: t(
					"Both records are ALFA 105 calls with a stated 100-share multiplier. Record A expires October 16; B expires November 20. The supplied execution price and quantity describe a purchase of record A. Calculate the premium paid before fees.",
					"两条记录均为 ALFA 105 看涨，每张给定 100 股。A 于 10 月 16 日到期，B 于 11 月 20 日到期。给定成交价与数量对应买入 A，计算不含费用的已付权利金。",
				),
				facts: [
					f("Purchased contracts", "买入合约（张）", String(count)),
					f(
						"Execution price (USD per share)",
						"成交价（美元/股）",
						String(price),
					),
				],
				questions: [
					c(
						"identity",
						"Can A and B be treated as the same contract?",
						"A 与 B 能当作同一合约吗？",
						[
							[
								"same",
								"Yes, ticker and strike match.",
								"能，标的与行权价相同。",
							],
							[
								"different",
								"No, the expiration differs.",
								"不能，到期日不同。",
							],
							[
								"unknown",
								"Only the next price can establish identity.",
								"只有下一个价格才能确定身份。",
							],
						],
						"different",
						"Expiration is part of identity; market price is an observation.",
						"到期日属于身份，市场价格是观测。",
					),
					n(
						"premium",
						"What total premium was paid for these contracts, before fees?",
						"买入这些合约共支付多少权利金（不含费用）？",
						price * count * 100,
						"USD",
						"美元",
						`$${price} per share × 100 shares per contract × ${count} contracts = $${price * count * 100}. This is premium paid, not profit.`,
						`每股 $${price} × 每张 100 股 × ${count} 张 = $${price * count * 100}。这是已付权利金，不是利润。`,
					),
					n(
						"deliverable",
						"How many deliverable shares do these contracts represent?",
						"这些合约对应多少交付股数？",
						count * 100,
						"shares",
						"股",
						`${count} × 100 = ${count * 100} shares. No delta was supplied.`,
						`${count} × 100 = ${count * 100} 股，未给定 Delta。`,
					),
				],
			};
		},
	},
	{
		id: "option-rights",
		conceptLab: {
			kind: "option-rights",
			intro: t(
				"Switch between holder and writer, track how trades change a position, and follow exercise into assignment. Explore the diagrams before applying the ideas to a new case.",
				"切换持有人与义务方，追踪交易如何改变持仓，再跟随行权进入指派流程。先探索图示，再将概念用于新案例。",
			),
		},
		sources: [
			basics,
			{
				title: "OIC · Exercising options",
				href: "https://www.optionseducation.org/optionsoverview/exercising-options",
			},
		],
		explanation: t(
			"Long means holding an option; short means having written it. A call holder has a right to buy the underlying on the stated terms; a put holder has a right to sell. The assigned writer has the corresponding obligation. Selling an option can open a short position or close a long one. Buying can open a long position or close a short one. These four position actions are different from buying or selling the underlying itself. Directional exposure also differs: a long put is not a short put, and owning a call does not mean owning the referenced shares. Exercise style and settlement specify when and how rights are used.",
			"多头表示持有期权，空头表示卖出开立期权。看涨持有人在给定条款下有权买入标的，看跌持有人有权卖出；被指派的义务方承担对应义务。卖出可以开空仓，也可以平多仓；买入可以开多仓，也可以平空仓。这四种动作与直接买卖标的不同。买入看跌不等于卖出看跌，持有看涨也不等于持有股票。行权方式与结算条款决定权利何时、如何使用。",
		),
		example: t(
			"A writer short one physically settled put at strike $50 may be assigned to buy 100 shares for $5,000 under a stated 100-share contract. The put holder has the right to sell those shares. This gross exercise amount is separate from premium received and from profit or loss.",
			"一张行权价 $50、每张 100 股的实物结算看跌期权空头，可能被指派以 $5,000 买入 100 股。持有人有权卖出这些股票。行权总额不同于已收权利金及盈亏。",
		),
		misconception: t(
			"Call/put tells you the right. Long/short tells you which side of that right or obligation you hold. Opening/closing cannot be inferred from a print's buy/sell label alone.",
			"看涨/看跌说明权利，多头/空头说明你持有权利还是承担义务。单笔买卖标签不能确定开仓或平仓。",
		),
		case: (v) => {
			const strike = [40, 65, 80, 55][v];
			const count = [2, 3, 2, 4][v];
			return {
				brief: t(
					`A writer is assigned on ${count} physically settled puts at strike $${strike}. Multiplier: 100 shares. Ignore premiums and fees for this gross exercise amount.`,
					`义务方的 ${count} 张实物结算看跌期权被指派，行权价 $${strike}，每张 100 股。计算行权总额时暂不计权利金与费用。`,
				),
				questions: [
					n(
						"obligation",
						"What gross cash amount must the writer pay?",
						"义务方应支付多少行权总额？",
						strike * count * 100,
						"USD",
						"美元",
						`Strike × contracts × multiplier = $${strike * count * 100}.`,
						`行权价 × 张数 × 乘数 = $${strike * count * 100}。`,
					),
					c(
						"role",
						"What does the assigned put writer do?",
						"被指派的看跌义务方做什么？",
						[
							[
								"buy",
								"Buy the deliverable at the strike.",
								"按行权价买入交付标的。",
							],
							[
								"sell",
								"Sell the deliverable at the strike.",
								"按行权价卖出交付标的。",
							],
							[
								"choice",
								"Choose whether to honor the obligation.",
								"自行选择是否履行义务。",
							],
						],
						"buy",
						"The put holder's right to sell creates the writer's purchase obligation.",
						"看跌持有人的卖出权利，对应义务方的买入义务。",
					),
				],
			};
		},
	},
	{
		id: "premium-payoff",
		conceptLab: {
			kind: "premium-payoff",
			intro: t(
				"Follow the units from price to premium, separate intrinsic and extrinsic value, then drag the expiration price through a payoff chart. Find where an in-the-money option still produces a loss.",
				"从价格单位追踪到权利金，分清内在价值与外在价值，再拖动到期价格，探索支付价值曲线。找出期权已实值、买方却仍亏损的位置。",
			),
		},
		sources: [
			basics,
			{
				title: "OIC · Options pricing",
				href: "https://www.optionseducation.org/optionsoverview/options-pricing",
			},
			{
				title: "OIC · Long call",
				href: "https://www.optionseducation.org/strategies/all-strategies/long-call",
			},
			{
				title: "OIC · Long put",
				href: "https://www.optionseducation.org/strategies/all-strategies/long-put",
			},
		],
		explanation: t(
			"Distinguish a quote per share, premium per contract, and total execution premium. Multiply the quote by the stated multiplier, then by contract count. Underlying notional uses the underlying price instead of the option premium. Intrinsic value at expiration is max(spot − strike, 0) for a call and max(strike − spot, 0) for a put. Before expiry, premium may also contain extrinsic value. A call is ITM above its strike; a put is ITM below it. ATM is a stated near-spot convention. ITM does not mean profitable: a buyer must recover premium and fees. Long-call expiration break-even is strike plus paid premium per share; long-put break-even is strike minus that premium, before fees.",
			"区分每股报价、每张权利金和成交总权利金。报价乘以给定乘数，再乘张数。标的名义金额使用标的价格，而非期权报价。到期看涨内在价值为 max(现价−行权价,0)，看跌为 max(行权价−现价,0)。到期前还可能有外在价值。看涨在现价高于行权价时实值，看跌相反；平值是明确的近现价约定。实值不代表盈利，买方还需收回权利金与费用。不计费用，多头看涨到期盈亏平衡价为行权价加每股权利金，多头看跌则相减。",
		),
		example: t(
			"Buy 2 calls at $3, strike $100, multiplier 100. Premium is $600. Expiration spot $102 gives $400 payoff, so profit is −$200 before fees. The calls are ITM but the buyer lost money. At purchase spot $100, referenced underlying notional was $20,000, not $600.",
			"以 $3 买入 2 张行权价 $100 的看涨，每张 100 股。权利金 $600。到期现价 $102，支付价值 $400，费用前亏损 $200。合约实值但买方亏钱。买入时现价 $100，对应标的名义金额 $20,000，不是 $600。",
		),
		misconception: t(
			"Calculate payoff and premium separately before subtracting. Preserve a negative profit; do not clamp it to zero just because option payoff is nonnegative.",
			"先分别计算到期价值与权利金，再相减。盈亏可以为负，不能因为期权到期价值非负就把亏损变为零。",
		),
		case: (v) => {
			const count = [2, 3, 4, 5][v];
			const paid = [3, 4, 2.5, 3.5][v];
			const spot = [102, 106, 101, 105][v];
			return {
				brief: t(
					`Long ${count} ALFA 100 calls, paid $${paid}/share, multiplier 100. Expiration spot $${spot}; no fees.`,
					`持有 ${count} 张 ALFA 100 看涨，每股支付 $${paid}，乘数 100。到期现价 $${spot}，不计费用。`,
				),
				questions: [
					n(
						"premium",
						"Total premium paid?",
						"支付的总权利金？",
						count * paid * 100,
						"USD",
						"美元",
						"Price per share × contracts × stated multiplier.",
						"每股价格 × 张数 × 给定乘数。",
					),
					n(
						"profit",
						"Profit at expiration, including premium?",
						"包含权利金后的到期盈亏？",
						(spot - 100 - paid) * count * 100,
						"USD; use − for a loss",
						"美元；亏损用负数",
						"(Expiration intrinsic value − paid premium/share) × 100 × count.",
						"（到期内在价值−每股支付权利金）× 100 × 张数。",
					),
				],
			};
		},
	},
	{
		id: "expiration-settlement",
		conceptLab: {
			kind: "expiration-settlement",
			intro: t(
				"Follow two different ways a long option can end, move through an exercise schedule, and compare physical delivery with cash settlement. Keep product terms and the official reference in view.",
				"追踪期权多头结束的两种不同路径，沿时间轴查看行权安排，再比较实物交付与现金结算。始终保留产品条款与官方参考值。",
			),
		},
		sources: [
			basics,
			{
				title: "OIC · Exercising options",
				href: "https://www.optionseducation.org/optionsoverview/exercising-options",
			},
			{
				title: "OIC · Equity vs. index options",
				href: "https://www.optionseducation.org/advancedconcepts/equity-vs-index-options",
			},
		],
		explanation: t(
			"An exchange trade that closes a position and an exercise are different events. A holder can sell a long option to close it without exercising. Exercise invokes the contract; assignment allocates the writer's obligation. American-style generally permits exercise before expiry under product rules; European-style restricts it to the specified expiry exercise time. The names describe timing, not geography. Physical settlement transfers the stated deliverable; cash settlement pays an amount based on the contract's settlement value. Check the actual product's last trading time, settlement reference and exercise terms. DTE counts time remaining under a stated calendar convention. 0DTE means expiry today, not no risk: prices and sensitivities can change rapidly, and a quoted spot may differ from a product's final settlement value.",
			"交易平仓与行权不是同一事件。持有人可卖出期权平仓，无需行权；行权使用合约权利，指派则把义务分配给义务方。美式通常允许按产品规则在到期前行权，欧式限制为指定到期行权时点；名称描述时间，不是地理位置。实物结算交付条款中的标的，现金结算按结算参考值支付金额。应检查产品的最后交易时间、结算参考及行权条款。DTE 按声明的日历约定计数；0DTE 表示今天到期，不代表没有风险。价格和敏感度仍会快速变化，现价也可能不同于最终结算值。",
		),
		example: t(
			"A cash-settled call has strike 4,000, official settlement 4,025 and $100 per index-point multiplier. Cash payoff is (4,025−4,000)×100 = $2,500. No shares are delivered. A last displayed spot of 4,030 would not replace the specified settlement reference.",
			"现金结算看涨行权价 4,000，官方结算值 4,025，每指数点 $100。现金支付 (4,025−4,000)×100=$2,500，不交付股票。最后展示现价 4,030 不能替代给定结算参考。",
		),
		misconception: t(
			"Use the settlement reference named in the product terms, not an unrelated last trade. A purchase of an option is not itself exercise.",
			"使用条款指定的结算参考，不能使用无关最新成交。买入期权本身也不是行权。",
		),
		case: (v) => {
			const k = 4000;
			const settle = [4012, 4035, 3990, 4022][v];
			return {
				brief: t(
					`One cash-settled call: strike ${k}; official settlement ${settle}; multiplier $100/point. Ignore purchase premium.`,
					`一张现金结算看涨：行权价 ${k}，官方结算值 ${settle}，每点 $100。暂不计买入权利金。`,
				),
				questions: [
					n(
						"settlement-difference",
						"Official settlement minus strike, before clamping payoff?",
						"截断到期支付前，官方结算值减行权价是多少？",
						settle - k,
						"index points; retain a negative difference",
						"指数点；保留负差值",
						"Settlement minus strike may be negative; option payoff is then floored at zero.",
						"结算值减行权价可以为负，此时期权支付才取零下限。",
					),
					n(
						"cash",
						"What is the cash payoff?",
						"现金支付额是多少？",
						Math.max(settle - k, 0) * 100,
						"USD",
						"美元",
						"max(settlement − strike, 0) × $100/point.",
						"max(结算值−行权价,0) × 每点 $100。",
					),
					c(
						"delivery",
						"What is delivered under these terms?",
						"按这些条款交付什么？",
						[
							["shares", "100 index shares.", "100 股指数股票。"],
							["cash", "The cash amount; no shares.", "现金金额，不交付股票。"],
							[
								"premium",
								"The original purchase premium is refunded.",
								"退还原买入权利金。",
							],
						],
						"cash",
						"This product explicitly specifies cash settlement.",
						"本产品明确采用现金结算。",
					),
				],
			};
		},
	},
];
