import "@tanstack/react-start/server-only";
import {
	basics,
	choose as c,
	fact as f,
	numberQuestion as n,
	type TeachingUnit,
	t,
} from "../authoring.server";

// Retained for reviewing submitted version 2 attempts with their original grading.
export const optionContractsV2: TeachingUnit = {
	id: "option-contracts",
	sources: [basics],
	explanation: t(
		"An underlying is the asset or index referenced by an option. A stock, an ETF share and a cash-settled index are not interchangeable instruments. A ticker identifies an underlying; a contract also needs call/put, strike and expiration. Its multiplier states how a quoted unit converts into a cash amount. Read the product terms rather than assuming every contract delivers 100 shares. Sector is an industry classification; market capitalization is share price times shares outstanding. Share volume counts traded shares; an earnings date identifies an event, not guaranteed news timing. These describe the underlying, not option expiry or traded contract count. A missing sector on an index is not an unknown contract identity. The source date belongs to every price or volume observation: it is not part of the permanent contract key.",
		"标的是期权参考的资产或指数。股票、ETF 份额与现金结算指数并非同一类工具。代码识别标的，合约还需看涨/看跌、行权价和到期日。乘数决定报价单位如何换算成金额，不能假定所有合约均交付 100 股。行业是产业分类，市值为股价乘流通在外股数。股票成交量按股计，财报日期标识事件，不保证具体公布时刻。这些描述标的，不是期权到期日或成交张数。指数没有行业分类，并不意味着合约身份未知。每项价格或成交量都有来源日期，但该日期不是合约固定身份的一部分。",
	),
	example: t(
		"ALFA 100 call expiring October 16 and ALFA 100 call expiring November 20 share an underlying and strike but are different contracts. With a stated 100-share multiplier, 3 contracts represent 300 shares of contractual deliverable; this is not their delta-equivalent exposure. A price of $2 per share implies $200 premium for one contract. Separately, a company with 3 million shares at $40 has $120 million market capitalization.",
		"ALFA 100 看涨、10 月 16 日到期，与 ALFA 100 看涨、11 月 20 日到期，标的和行权价相同，但合约不同。给定每张 100 股，3 张对应 300 股交付数量，不等于 Delta 等价敞口。每股报价 $2，对应每张权利金 $200。另有公司发行在外 300 万股、股价 $40，市值为 $1.2 亿。",
	),
	misconception: t(
		"Do not group contracts by ticker alone. Contract count, deliverable shares, dollars and delta equivalents have different units.",
		"不能只按标的代码合并合约。合约张数、交付股数、金额和 Delta 等价量的单位不同。",
	),
	case: (v) => {
		const count = [4, 7, 9, 6][v];
		const sharesMillions = [2, 3, 4, 5][v];
		const spot = [50, 45, 30, 22][v];
		return {
			brief: t(
				"Both records are ALFA 105 calls with a stated 100-share multiplier. Record A expires October 16; B expires November 20. Use the stated product terms.",
				"两条记录均为 ALFA 105 看涨，每张给定 100 股。A 于 10 月 16 日到期，B 于 11 月 20 日到期。使用给定条款。",
			),
			facts: [
				f("Position (contracts)", "持仓（张）", String(count)),
				f(
					"Company shares outstanding (millions)",
					"公司发行在外股数（百万股）",
					String(sharesMillions),
				),
				f("Stock price (USD)", "股价（美元）", String(spot)),
			],
			questions: [
				n(
					"market-cap",
					"Company market capitalization in millions of dollars?",
					"公司市值为多少百万美元？",
					sharesMillions * spot,
					"million USD",
					"百万美元",
					"Shares outstanding × share price; this does not depend on your option contract count.",
					"发行在外股数×股价，与所持期权张数无关。",
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
				c(
					"identity",
					"Can A and B be treated as the same contract?",
					"A 与 B 能当作同一合约吗？",
					[
						["same", "Yes, ticker and strike match.", "能，标的与行权价相同。"],
						["different", "No, the expiration differs.", "不能，到期日不同。"],
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
			],
		};
	},
};
