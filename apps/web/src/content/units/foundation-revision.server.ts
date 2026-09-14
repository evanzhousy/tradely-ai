import "@tanstack/react-start/server-only";
import { archivedFoundationUnits } from "./archive/foundations-original.server";
import {
	choose as c,
	fact as f,
	numberQuestion as n,
	type TeachingCase,
	type TeachingUnit,
	t,
} from "./authoring.server";

const identityChoices: [string, string, string][] = [
	[
		"same",
		"Same contract; its observations can change.",
		"同一合约，观测值可以改变。",
	],
	[
		"different",
		"Different contracts; an identity field differs.",
		"不同合约，身份字段有差异。",
	],
	["unknown", "Insufficient identity information.", "身份信息不足。"],
];
const missingAmount = (id: string, en: string, zh: string) =>
	c(
		id,
		en,
		zh,
		[
			[
				"unknown",
				"Cannot calculate without the missing product terms.",
				"缺少产品条款，无法计算。",
			],
			[
				"standard",
				"Assume every contract represents 100 shares.",
				"假设每张都代表 100 股。",
			],
			["zero", "Treat the missing amount as zero.", "把缺失金额当成零。"],
		],
		"unknown",
		"The multiplier and deliverable must be supplied. Missing terms are neither a standard 100-share contract nor a zero amount.",
		"乘数与交付物必须给定。缺少条款不等于标准 100 股合约，也不等于金额为零。",
	);

function contractsCase(variant: number): TeachingCase {
	if (variant === 2)
		return {
			brief: t(
				"Records A and B both refer to ALFA calls, strike $105. A expires October 16, 2026; B's expiration is missing. You bought 3 of A at $2 per quoted unit, but the product multiplier and deliverable are missing. A later price quote cannot restore those terms.",
				"A、B 都参考 ALFA 看涨，行权价 $105。A 于 2026 年 10 月 16 日到期，B 到期日缺失。你按每报价单位 $2 买入 3 张 A，但产品乘数与交付物缺失。后续报价不能补全这些条款。",
			),
			questions: [
				c(
					"identity",
					"Can you establish whether these are the same contract?",
					"能否确定是同一合约？",
					identityChoices,
					"unknown",
					"B's expiration is missing. Matching ticker and strike do not establish full identity; a changed price would not establish it either.",
					"B 的到期日缺失。标的与行权价相同不足以确定完整身份，价格变化也不能确定。",
				),
				missingAmount(
					"premium",
					"Can you calculate total premium paid?",
					"能否算出总权利金？",
				),
				missingAmount(
					"deliverable",
					"Can you calculate the deliverable share count?",
					"能否算出交付股数？",
				),
			],
		};
	const different = variant === 3;
	const count = different ? 2 : 7;
	const price = different ? 3 : 1.5;
	const multiplier = different ? 100 : 10;
	return {
		brief: t(
			`The teaching product explicitly delivers ${multiplier} shares per contract, and quotes dollars per share. Record A is an ALFA 105 call expiring October 16, 2026, observed at 10:30 ET. Record B has ${different ? "the same terms except that it is a put" : "identical product terms, underlying, type, strike and expiration, observed at 10:31 ET at a different price"}. Calculate the purchase of A using the supplied execution below.`,
			`教学产品明确每张交付 ${multiplier} 股，以美元/股报价。A 是 ALFA 105 看涨，2026 年 10 月 16 日到期，10:30 ET 观测。B ${different ? "其余条款相同，但为看跌" : "产品条款、标的、类型、行权价与到期日均相同，在 10:31 ET 观测，价格不同"}。用下方给定成交计算 A 的购买金额。`,
		),
		facts: [
			f("Purchased contracts", "买入张数", String(count)),
			f("Execution price (USD per share)", "成交价（美元/股）", String(price)),
			f("Stated shares per contract", "给定每张股数", String(multiplier)),
		],
		questions: [
			c(
				"identity",
				"Are A and B the same contract?",
				"A、B 是否同一合约？",
				identityChoices,
				different ? "different" : "same",
				different
					? "Call and put specify different rights, even with the same ticker, strike and expiration."
					: "All identity fields and product terms match. The observation time and price changed, not the contract.",
				different
					? "看涨与看跌规定不同权利，即使代码、行权价和到期日相同也不是同一合约。"
					: "全部身份字段与产品条款相同。变化的是观测时间和价格，不是合约。",
			),
			n(
				"premium",
				"Total premium paid before fees?",
				"不含费用的已付总权利金？",
				price * count * multiplier,
				"USD",
				"美元",
				`$${price} × ${multiplier} shares × ${count} contracts = $${price * count * multiplier}. Use the supplied units, not an assumed multiplier.`,
				`$${price} × ${multiplier} 股 × ${count} 张 = $${price * count * multiplier}。使用给定单位，不能假定乘数。`,
			),
			n(
				"deliverable",
				"Contractual deliverable shares?",
				"合约规定交付多少股？",
				count * multiplier,
				"shares",
				"股",
				`${count} × ${multiplier} = ${count * multiplier} deliverable shares. Buying the options has not itself delivered the stock.`,
				`${count} × ${multiplier} = ${count * multiplier} 股交付数量。买入期权本身尚未交付股票。`,
			),
		],
	};
}

function rightsCase(variant: number): TeachingCase {
	if (variant === 1)
		return {
			brief: t(
				"A writer is assigned on 3 physically settled ALFA calls, strike $65, with 100 shares per contract. Calculate the gross cash received for delivering the shares; ignore premium and fees.",
				"卖方的 3 张 ALFA 实物结算看涨被指派，行权价 $65，每张 100 股。计算交付股票时收到的总金额，暂不计权利金和费用。",
			),
			questions: [
				n(
					"obligation",
					"Gross exercise cash received by the writer?",
					"卖方收到的行权总金额？",
					19500,
					"USD",
					"美元",
					"$65 × 100 × 3 = $19,500 received in exchange for 300 shares. This is not the writer's profit.",
					"$65 × 100 × 3 = $19,500，对应交付 300 股。这不是卖方利润。",
				),
				c(
					"role",
					"What must the assigned call writer do?",
					"被指派的看涨卖方需做什么？",
					[
						["buy", "Buy the shares.", "买入股票。"],
						["sell", "Deliver the shares at the strike.", "按行权价交付股票。"],
						[
							"choice",
							"Decide whether to honor assignment.",
							"自行决定是否履行指派。",
						],
					],
					"sell",
					"A call holder's right to buy creates the writer's obligation to deliver. The put example had the opposite obligation.",
					"看涨持有人的买入权利对应卖方交付义务，和看跌例子的义务相反。",
				),
			],
		};
	const closeShort = variant === 3;
	return {
		brief: t(
			closeShort
				? "You are short 3 ALFA puts and buy 3 identical puts to close at $1.20 per share, multiplier 100. The trade is confirmed. No exercise or assignment occurred."
				: "You own 2 ALFA puts and sell those same 2 puts to close at $2.50 per share, multiplier 100. The trade is confirmed. No exercise or assignment occurred.",
			closeShort
				? "你持有 3 张 ALFA 看跌空头，以每股 $1.20 买入相同的 3 张平仓，乘数 100。交易已确认，没有行权或指派。"
				: "你持有 2 张 ALFA 看跌多头，以每股 $2.50 卖出相同的 2 张平仓，乘数 100。交易已确认，没有行权或指派。",
		),
		questions: [
			c(
				"role",
				"Which position action occurred?",
				"发生了哪种持仓动作？",
				[
					[
						"close-long",
						"Closed an existing long option position.",
						"平掉已有期权多头。",
					],
					[
						"close-short",
						"Closed an existing short option position.",
						"平掉已有期权空头。",
					],
					[
						"exercise",
						"Exercised the option and transferred stock.",
						"行权并转移股票。",
					],
				],
				closeShort ? "close-short" : "close-long",
				"Use both the starting position and the explicit closing instruction. A trade in an option is not exercise; the word buy or sell alone does not determine opening or closing.",
				"结合初始持仓与明确的平仓指令判断。期权交易不是行权，仅凭买入或卖出不能确定开平仓。",
			),
			n(
				"cash",
				closeShort
					? "Premium paid to close?"
					: "Premium received from closing?",
				closeShort ? "平仓支付多少权利金？" : "平仓收到多少权利金？",
				closeShort ? 360 : 500,
				"USD before fees",
				"美元，不含费用",
				closeShort
					? "$1.20 × 100 × 3 = $360 paid. The original sale price is needed to calculate profit."
					: "$2.50 × 100 × 2 = $500 received. The original purchase price is needed to calculate profit.",
				closeShort
					? "$1.20 × 100 × 3 = $360 支出，计算利润还需原卖出价格。"
					: "$2.50 × 100 × 2 = $500 收入，计算利润还需原买入价格。",
			),
		],
	};
}

function payoffCase(variant: number): TeachingCase {
	const put = variant !== 2;
	const strike = variant === 1 ? 50 : variant === 2 ? 100 : 60;
	const paid = variant === 1 ? 4 : variant === 2 ? 2.5 : 3;
	const spot = variant === 1 ? 48 : variant === 2 ? 95 : 50;
	const count = variant === 1 ? 3 : variant === 2 ? 4 : 2;
	const multiplier = variant === 3 ? 10 : 100;
	const fees = variant === 1 ? 12 : 0;
	const premium = paid * count * multiplier;
	const intrinsic = Math.max(put ? strike - spot : spot - strike, 0);
	const payoff = intrinsic * count * multiplier;
	const profit = payoff - premium - fees;
	const profitAmount = `${profit < 0 ? "−" : ""}$${Math.abs(profit)}`;
	return {
		brief: t(
			`You bought ${count} ALFA ${strike} ${put ? "puts" : "calls"} at $${paid} per share. Stated multiplier: ${multiplier}. Expiration price: $${spot}. Total fees for the whole position: $${fees}. Use expiration intrinsic value; there is no remaining time value.`,
			`你买入 ${count} 张 ALFA ${strike} ${put ? "看跌" : "看涨"}，每股支付 $${paid}，给定乘数 ${multiplier}。到期现价 $${spot}，整个持仓总费用 $${fees}。使用到期内在价值，不再有时间价值。`,
		),
		questions: [
			n(
				"premium",
				"Total premium paid, excluding fees?",
				"不含费用的总权利金？",
				premium,
				"USD",
				"美元",
				`$${paid} × ${multiplier} × ${count} = $${premium}.`,
				`$${paid} × ${multiplier} × ${count} = $${premium}。`,
			),
			n(
				"payoff",
				"Total expiration payoff, before subtracting costs?",
				"减成本前的到期总价值？",
				payoff,
				"USD",
				"美元",
				`max(${put ? `${strike} − ${spot}` : `${spot} − ${strike}`}, 0) × ${multiplier} × ${count} = $${payoff}. Floor the option value at zero before subtracting costs.`,
				`max(${put ? `${strike} − ${spot}` : `${spot} − ${strike}`}, 0) × ${multiplier} × ${count} = $${payoff}。先将期权价值取零下限，再减成本。`,
			),
			n(
				"profit",
				"Buyer profit after premium and total fees?",
				"减去权利金及总费用后的买方盈亏？",
				profit,
				"USD; negative for a loss",
				"美元，亏损填负数",
				`$${payoff} − $${premium} − $${fees} = ${profitAmount}. A positive payoff need not cover the purchase cost.`,
				`$${payoff} − $${premium} − $${fees} = ${profitAmount}。正到期价值不一定覆盖购买成本。`,
			),
			c(
				"moneyness",
				"Is the option in the money at expiration?",
				"期权到期是否实值？",
				[
					["itm", "Yes; intrinsic value is positive.", "是，内在价值为正。"],
					["otm", "No; intrinsic value is zero.", "否，内在价值为零。"],
				],
				intrinsic > 0 ? "itm" : "otm",
				"Moneyness compares strike with the underlying price; profitability also depends on what you paid and fees.",
				"实值状态比较行权价与标的价格，盈利还取决于已付成本和费用。",
			),
		],
	};
}

function settlementCase(variant: number): TeachingCase {
	if (variant === 1)
		return {
			brief: t(
				"You exercise 2 physically settled ALFA calls, strike $50, each delivering 100 shares. This is an exercise, not a sale of the options. Ignore premium and fees when calculating the exercise exchange.",
				"你行使 2 张 ALFA 实物结算看涨，每张交付 100 股，行权价 $50。这是行权，并非卖出期权。计算行权交换时暂不计权利金和费用。",
			),
			questions: [
				n(
					"shares",
					"Shares received by the holder?",
					"持有人收到多少股？",
					200,
					"shares",
					"股",
					"2 × 100 = 200 actual shares on physical settlement.",
					"实物结算收到 2 × 100 = 200 股实际股票。",
				),
				n(
					"cash",
					"Exercise cash paid by the holder?",
					"持有人支付多少行权金额？",
					10000,
					"USD",
					"美元",
					"$50 × 200 = $10,000 paid for the shares. It is not the cash-settled intrinsic payoff.",
					"$50 × 200 = $10,000，用于购买股票；不同于现金结算的内在价值支付。",
				),
				c(
					"delivery",
					"What distinguishes this from selling the calls to close?",
					"这与卖出看涨平仓有何区别？",
					[
						[
							"exercise",
							"Exercise invokes the right and transfers the deliverable.",
							"行权使用权利并转移交付物。",
						],
						["same", "They are the same event.", "两者是同一事件。"],
					],
					"exercise",
					"Closing sells the option. This exercise buys the shares under the contract terms.",
					"平仓卖出的是期权，而本次行权按条款买入股票。",
				),
			],
		};
	if (variant === 3)
		return {
			brief: t(
				"You bought 2 cash-settled IDX calls at a premium of 3 points per contract, strike 4,000, and $100 per point. The official settlement value required by the terms has not been published. A last displayed index price is 4,030. The contract is not eligible for physical delivery. Ignore fees.",
				"你按每张 3 点权利金买入 2 张 IDX 现金结算看涨，行权价 4,000，每点 $100。条款要求的官方结算值尚未公布，最新展示指数价格为 4,030。本合约不进行实物交付，不计费用。",
			),
			questions: [
				c(
					"cash",
					"Can you calculate the final cash payoff yet?",
					"现在能算最终现金到期价值吗？",
					[
						[
							"unknown",
							"No; wait for the specified official settlement value.",
							"不能，需等待指定官方结算值。",
						],
						[
							"spot",
							"Yes; substitute the last displayed price.",
							"能，使用最新展示价格代替。",
						],
						[
							"zero",
							"Use zero because the reference is missing.",
							"参考值缺失，取零。",
						],
					],
					"unknown",
					"The displayed quote is not the settlement reference. Missing reference data prevents a final amount; it does not imply a zero payoff.",
					"展示报价不是结算参考值。参考数据缺失会阻止计算最终金额，但不代表到期价值为零。",
				),
				c(
					"delivery",
					"Would the missing reference change cash settlement into share delivery?",
					"参考值缺失会让现金结算变成股票交付吗？",
					[
						[
							"no",
							"No; settlement type is fixed by product terms.",
							"不会，结算方式由产品条款规定。",
						],
						[
							"yes",
							"Yes; deliver 100 shares instead.",
							"会，改为交付 100 股。",
						],
					],
					"no",
					"A missing observation does not rewrite the product's settlement terms.",
					"观测值缺失不会改变产品结算条款。",
				),
				n(
					"premium",
					"What premium was paid before fees, even though final payoff is unknown?",
					"最终到期价值未知，但已付权利金是多少（不计费用）？",
					600,
					"USD",
					"美元",
					"3 points × $100 per point × 2 contracts = $600. The known purchase cost remains calculable even while the final settlement value is missing.",
					"3 点 × 每点 $100 × 2 张 = $600。即使最终结算值缺失，已知购买成本仍可计算。",
				),
			],
		};
	return {
		brief: t(
			"Two cash-settled IDX puts: strike 4,000, official settlement 3,990, multiplier $50 per point per contract. Last displayed index price: 3,980. Ignore premium and fees.",
			"两张 IDX 现金结算看跌：行权价 4,000，官方结算值 3,990，每张每点 $50。最新展示指数价格 3,980，暂不计权利金与费用。",
		),
		questions: [
			c(
				"reference",
				"Which value belongs in the settlement calculation?",
				"结算计算应使用哪个值？",
				[
					["official", "Official settlement: 3,990.", "官方结算值 3,990。"],
					["last", "Last displayed price: 3,980.", "最新展示价格 3,980。"],
				],
				"official",
				"The terms name the official settlement. A more recent-looking quote cannot replace it.",
				"条款指定官方结算值，看似更新的报价也不能替代。",
			),
			n(
				"cash",
				"Total cash payoff for both puts?",
				"两张看跌的总现金到期价值？",
				1000,
				"USD",
				"美元",
				"max(4,000 − 3,990, 0) × $50 × 2 = $1,000. Puts reverse the call subtraction.",
				"max(4,000 − 3,990, 0) × $50 × 2 = $1,000。看跌与看涨的相减方向相反。",
			),
			c(
				"delivery",
				"What is delivered?",
				"交付什么？",
				[
					["cash", "Cash; no index shares.", "现金，不交付指数股票。"],
					["shares", "100 shares for each contract.", "每张交付 100 股。"],
				],
				"cash",
				"The $50 multiplier converts index points to dollars; it does not specify a share deliverable.",
				"$50 乘数把指数点换成美元，不表示股票交付数量。",
			),
		],
	};
}

const revisions: Record<string, (variant: number) => TeachingCase> = {
	"option-contracts": contractsCase,
	"option-rights": rightsCase,
	"premium-payoff": payoffCase,
	"expiration-settlement": settlementCase,
};

export const revisedFoundationUnits: TeachingUnit[] =
	archivedFoundationUnits.map((unit) => ({
		...unit,
		version: 4,
		case: (variant) => {
			if (!Number.isInteger(variant) || variant < 0 || variant > 3)
				throw new Error("Unknown foundation variant");
			return variant === 0 ? unit.case(0) : revisions[unit.id](variant);
		},
	}));
