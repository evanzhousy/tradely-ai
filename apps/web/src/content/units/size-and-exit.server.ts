import "@tanstack/react-start/server-only";
import {
	choose as c,
	money,
	numberQuestion as n,
	type TeachingUnit,
	t,
} from "./authoring.server";

/**
 * Size and exit: how much one trade can lose is decided before entry. Every rule in the
 * cases is given by the case ("your rule is…"), never recommended; the questions ask for the
 * arithmetic and the mechanics.
 */
const finraOptions = {
	title: "FINRA · Options",
	href: "https://www.finra.org/investors/investing/investment-products/options",
};
const finraMargin = {
	title: "FINRA · Rule 4210, Margin Requirements",
	href: "https://www.finra.org/rules-guidance/rulebooks/finra-rules/4210",
};
const cboeMargin = {
	title: "Cboe · Strategy-based margin",
	href: "https://www.cboe.com/us/options/strategy_based_margin/",
};
const oicGettingStarted = {
	title: "OIC · Getting started with options",
	href: "https://www.optionseducation.org/optionsoverview/getting-started-with-options",
};
const investorOrderTypes = {
	title: "Investor.gov · Understanding order types",
	href: "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-14",
};

const dollars = (cents: number) => (cents / 100).toFixed(2);

export const sizeAndExitUnit: TeachingUnit = {
	id: "size-and-exit",
	version: 1,
	conceptLab: {
		kind: "size-and-exit",
		intro: t(
			"Turn a loss you accept into a number of contracts, follow two accounts through the same ten losses, and write an exit plan that a gap can still jump past.",
			"把你能接受的亏损换算成张数，看两个账户走过同样的十连亏，再写一份仍可能被跳空越过的出场计划。",
		),
	},
	sources: [
		finraOptions,
		oicGettingStarted,
		finraMargin,
		cboeMargin,
		investorOrderTypes,
		{ title: "Tradely · Options risk disclosure", href: "/risk-disclosure" },
	],
	explanation: t(
		"How much a trade can lose is decided before you place it, by two things: its size and a written exit. Start with the worst case of one contract. For an option you buy, that is the premium: the price per share times 100. Then choose, for yourself, the loss you accept on one trade. Some traders set it as a small share of the account; risking 2% of a $10,000 account, $200, is one common rule of thumb, used here only as an example. Size is that amount divided by the worst case per contract, rounded down. If the answer is zero, the rule is telling you this contract is too large for it: a cheaper contract, a spread whose worst case is smaller, or no trade all fit, and the rule does not say which. Size matters more than any one call being right, because losses compound: ten losses in a row at 2% of what is left each time leave $8,171 of $10,000, and at 20% they leave $1,074. A loss also needs a larger gain to undo it: after losing 50%, it takes a 100% gain to get back. An exit plan has three parts, written before entry: a price at which you take the profit, a price at which you take the loss, and a time stop, a date to leave by if neither price is reached, often before the last weeks when time decay speeds up. A planned exit is a plan, not a guarantee. Listed stock options trade only during market hours, so after overnight news an option can open far below your loss point, and a stop order then becomes a market order that fills at the next available price. So the worst case used for sizing stays the whole premium. Last, what the account must hold: an option you buy with nine months or less to expiry must be paid for in full, in cash, under FINRA and exchange margin rules; it can't be bought with a broker's loan the way shares can. Writing options ties up collateral or margin, and writing uncovered options needs a higher level of options approval. Brokers set their own approval levels and may ask for more than the rules' minimum.",
		"一笔交易最多亏多少，在下单之前就由两件事决定：仓位大小和一份写下来的出场计划。先看一张合约的最坏情况。对买入的期权来说，就是权利金：每股价格乘以 100。然后由你自己决定，一笔交易愿意承受多大的亏损。有些交易者把它定为账户的一小部分；在 $10,000 的账户里每笔最多亏 2%，也就是 $200，是一种常见的经验规则，这里只当作例子。仓位大小等于这个金额除以每张合约的最坏情况，向下取整。如果结果是零，说明按这条规则这张合约太大了：换一张更便宜的合约、改用最坏情况更小的价差，或者不做这笔交易，都符合规则，而规则本身不会告诉你选哪个。仓位大小比任何一次判断对错都重要，因为亏损会复利累积：连续亏十次，每次亏掉余额的 2%，$10,000 还剩 $8,171；每次亏 20%，只剩 $1,074。而且亏损要靠更大的涨幅才能补回：亏掉 50% 之后，要涨 100% 才能回到原点。出场计划有三部分，都在入场前写好：止盈点，即兑现盈利的价格；止损点，即认亏离场的价格；以及时间止损，即两个价格都没到时最晚离场的日期，通常定在时间损耗加速的最后几周之前。计划中的出场只是计划，不是保证。上市股票期权只在交易时段交易，所以隔夜消息之后，期权可能直接开在远低于止损点的价格，而止损单触发后会变成市价单，按下一个可成交的价格成交。因此，计算仓位时用的最坏情况仍然是全部权利金。最后是账户里必须有什么：按照 FINRA 和交易所的保证金规则，买入距到期不超过九个月的期权必须用现金全额支付，不能像买股票那样向券商借钱。卖出期权会占用担保品或保证金，卖出未备兑期权还需要更高级别的期权权限。各券商自行设定权限级别，要求也可能高于规则的最低标准。",
	),
	example: t(
		"Your account is $10,000 and, as an example, your own rule is to lose at most 2% of it, $200, on one trade. The ALFA Oct 18 100 call is $4.20 a share, $420 a contract: $200 ÷ $420 rounds down to 0 contracts. The ALFA Nov 15 110 call is $1.80 a share, $180 a contract: 1 contract fits. You buy one, pay $180 in cash, and write the plan the same day: sell at $3.60 (+$180), sell at $0.90 (−$90), and be out by Oct 25 if neither is reached. Then ALFA reports earnings after the close and the call, which closed at $1.33, opens at $0.20. Your order to sell at the loss point fills near $0.20: −$160, not −$90. The plan was followed and the loss was still larger, which is why the size was worked out from the full $180.",
		"你的账户有 $10,000。举个例子，你给自己定的规则是每笔交易最多亏掉其中的 2%，也就是 $200。ALFA 10月18日 100 看涨每股 $4.20，每张 $420：$200 ÷ $420 向下取整是 0 张。ALFA 11月15日 110 看涨每股 $1.80，每张 $180：可以买 1 张。你买入一张，用现金付了 $180，并在当天写下计划：涨到 $3.60 卖出（+$180），跌到 $0.90 卖出（−$90），两个价格都没到的话，10月25日 之前离场。后来 ALFA 在收盘后公布财报，前一天收在 $1.33 的看涨，第二天直接开在 $0.20。你在止损点的卖单在 $0.20 附近成交：亏 $160，而不是 $90。你照计划做了，亏损还是更大，所以当初算仓位时用的是全部的 $180。",
	),
	misconception: t(
		"A loss point does not cap your loss. It is a plan to sell, and an option can open below it after overnight news. The only loss a bought option cannot exceed is the premium you paid.",
		"止损点并不能封住你的亏损。它只是卖出的计划，隔夜消息之后，期权可能直接开在它下方。买入的期权唯一不会超过的亏损，是你付出的权利金。",
	),
	case: (v) => {
		/** Account in dollars, the rule's percent, the call's price in cents per share. */
		const [account, rulePercent, price] = (
			[
				[10_000, 2, 420],
				[15_000, 2, 120],
				[20_000, 1, 180],
				[8_000, 5, 130],
			] as const
		)[v];
		const budget = (account * rulePercent) / 100;
		/** Dollars per contract: cents per share × 100 shares ÷ 100. */
		const worst = price;
		const fits = Math.floor(budget / worst);
		const [lossPercent, losses] = (
			[
				[10, 3],
				[20, 2],
				[5, 2],
				[25, 2],
			] as const
		)[v];
		const left =
			Math.round(account * (1 - lossPercent / 100) ** losses * 100) / 100;
		/** Cases 2 and 3 follow the plan into an overnight gap and ask what was actually lost. */
		const gapped = v >= 2;
		const lossPoint = price / 2;
		const planned = worst / 2;
		const gapOpen = [0, 0, 20, 25][v];
		const gapLoss = worst - gapOpen;
		const between = gapped ? gapLoss : (planned + worst) / 2;
		const fitWhy = (k: number) =>
			k > fits
				? t(
						`${k} ${k === 1 ? "contract" : "contracts"} could lose ${k} × ${money(worst, 0)} = ${money(k * worst, 0)}, more than the ${money(budget, 0)} the rule allows.`,
						`${k} 张最多可能亏 ${k} × ${money(worst, 0)} = ${money(k * worst, 0)}，超过规则允许的 ${money(budget, 0)}。`,
					)
				: t(
						`${k === 0 ? "One contract's worst case" : `${k + 1} contracts' worst case`}, ${money((k + 1) * worst, 0)}, is still within the ${money(budget, 0)} the rule allows, so more than ${k} ${k === 1 ? "fits" : "fit"}.`,
						`${k + 1} 张的最坏情况是 ${money((k + 1) * worst, 0)}，仍在规则允许的 ${money(budget, 0)} 之内，所以能买的不止 ${k} 张。`,
					);
		const fitChoice = (k: number): [string, string, string, string, string] => [
			String(k),
			k === 0 ? "None" : `${k} ${k === 1 ? "contract" : "contracts"}`,
			k === 0 ? "一张也买不了" : `${k} 张`,
			fitWhy(k).en,
			fitWhy(k).zh,
		];
		return {
			brief: t(
				`Your account holds $${account.toLocaleString("en-US")}. In this case your own rule is to lose at most ${rulePercent}% of it on any one trade. An ALFA call that expires in about a month costs $${dollars(price)} a share. You write down a loss point at $${dollars(lossPoint)}.`,
				`你的账户有 $${account.toLocaleString("en-US")}。本例中你给自己定的规则是：任何一笔交易最多亏掉其中的 ${rulePercent}%。一张约一个月后到期的 ALFA 看涨期权每股 $${dollars(price)}。你写下的止损点是 $${dollars(lossPoint)}。`,
			),
			questions: [
				n(
					"worst",
					"What is the most one contract of this call can lose, before fees?",
					"这张看涨期权一张合约最多可能亏多少（不含费用）？",
					worst,
					"USD",
					"美元",
					`A bought option can lose its whole premium: $${dollars(price)} × 100 shares = ${money(worst, 0)}.`,
					`买入的期权最多亏掉全部权利金：$${dollars(price)} × 100 股 = ${money(worst, 0)}。`,
					0.01,
				),
				c(
					"fit",
					"How many contracts fit inside your rule?",
					"按你的规则，最多能买几张？",
					[fitChoice(0), fitChoice(1), fitChoice(2), fitChoice(3)],
					String(fits),
					`The rule allows ${rulePercent}% × $${account.toLocaleString("en-US")} = ${money(budget, 0)}. ${money(budget, 0)} ÷ ${money(worst, 0)} a contract, rounded down, is ${fits}.${fits === 0 ? " Zero is an answer too: under this rule the contract is too large, whatever you think of the stock." : ""}`,
					`规则允许 ${rulePercent}% × $${account.toLocaleString("en-US")} = ${money(budget, 0)}。${money(budget, 0)} ÷ 每张 ${money(worst, 0)}，向下取整，得到 ${fits} 张。${fits === 0 ? "零也是答案：按这条规则，不管你怎么看这只股票，这张合约都太大了。" : ""}`,
				),
				n(
					"left",
					`Suppose ${losses} trades in a row each lose ${lossPercent}% of what the account holds at that moment. How much is left of the $${account.toLocaleString("en-US")}?`,
					`假设连续 ${losses} 笔交易，每笔都亏掉账户当时余额的 ${lossPercent}%。$${account.toLocaleString("en-US")} 还剩多少？`,
					left,
					"USD",
					"美元",
					`Each loss takes ${lossPercent}% of what is left, so multiply by ${(1 - lossPercent / 100).toFixed(2)} each time: $${account.toLocaleString("en-US")} × ${(1 - lossPercent / 100).toFixed(2)}${losses === 3 ? ` × ${(1 - lossPercent / 100).toFixed(2)}` : ""} × ${(1 - lossPercent / 100).toFixed(2)} = ${money(left, 0)}.`,
					`每次亏掉余额的 ${lossPercent}%，所以每次乘以 ${(1 - lossPercent / 100).toFixed(2)}：$${account.toLocaleString("en-US")} × ${(1 - lossPercent / 100).toFixed(2)}${losses === 3 ? ` × ${(1 - lossPercent / 100).toFixed(2)}` : ""} × ${(1 - lossPercent / 100).toFixed(2)} = ${money(left, 0)}。`,
					0.5,
				),
				c(
					"plan",
					gapped
						? `You buy one contract. Weeks later the call closes at $${dollars(lossPoint + 40)}, above your loss point. News comes overnight, the call opens at $${dollars(gapOpen)}, and your order to sell fills there. What did the contract lose?`
						: "When you work out the size, which loss per contract do you count as the worst case?",
					gapped
						? `你买入一张。几周后，这张看涨收在 $${dollars(lossPoint + 40)}，高于你的止损点。隔夜出了消息，它开在 $${dollars(gapOpen)}，你的卖单就在这个价格成交。这张合约亏了多少？`
						: "计算仓位大小时，你把每张合约的哪个亏损当作最坏情况？",
					[
						[
							"planned",
							gapped
								? money(planned, 0)
								: `${money(planned, 0)}, the loss at the $${dollars(lossPoint)} loss point`,
							gapped
								? money(planned, 0)
								: `${money(planned, 0)}，即在 $${dollars(lossPoint)} 止损点卖出的亏损`,
							gapped
								? `${money(planned, 0)} was the plan, but the call never traded at $${dollars(lossPoint)}: it closed above it and opened below it. The order filled at $${dollars(gapOpen)}.`
								: `${money(planned, 0)} is the plan, not the limit. After overnight news the call can open under $${dollars(lossPoint)}, and the order to sell fills at whatever price is there.`,
							gapped
								? `${money(planned, 0)} 是计划中的亏损，但这张看涨从未在 $${dollars(lossPoint)} 成交过：它收在这个价格之上，又开在它之下。卖单成交在 $${dollars(gapOpen)}。`
								: `${money(planned, 0)} 是计划，不是上限。隔夜消息之后，看涨可能直接开在 $${dollars(lossPoint)} 以下，卖单只能按当时有的价格成交。`,
						],
						[
							"between",
							gapped
								? money(between, 0)
								: `${money(between, 0)}, halfway between the planned loss and the premium`,
							gapped
								? money(between, 0)
								: `${money(between, 0)}，即计划亏损与权利金的中间值`,
							`Nothing sets a floor halfway. A call can open at any price under the loss point, down to $0, so only the whole ${money(worst, 0)} is certain to cover the loss.`,
							`没有任何东西把亏损挡在中间。看涨可能开在止损点以下的任何价格，直到 $0，所以只有全部的 ${money(worst, 0)} 才一定够覆盖亏损。`,
						],
						[
							"full",
							gapped
								? money(worst, 0)
								: `${money(worst, 0)}, the whole premium`,
							gapped ? money(worst, 0) : `${money(worst, 0)}，即全部权利金`,
							`The whole premium is the most the contract could lose, but here you sold at $${dollars(gapOpen)} and got ${money(gapOpen, 0)} back: ${money(worst, 0)} − ${money(gapOpen, 0)} = ${money(gapLoss, 0)}.`,
							`全部权利金是这张合约最多可能亏的金额，但这次你在 $${dollars(gapOpen)} 卖出，收回了 ${money(gapOpen, 0)}：${money(worst, 0)} − ${money(gapOpen, 0)} = ${money(gapLoss, 0)}。`,
						],
					],
					gapped ? "between" : "full",
					gapped
						? `($${dollars(price)} − $${dollars(gapOpen)}) × 100 = ${money(gapLoss, 0)}, more than the ${money(planned, 0)} planned. Equity options don't trade overnight, so a price can jump past a loss point; that is why sizing counts the whole ${money(worst, 0)}.`
						: `A loss point is a plan to sell, and an option can open below it after overnight news. The one loss a bought call cannot exceed is its premium, ${money(worst, 0)}, so that is the figure the size is worked out from.`,
					gapped
						? `（$${dollars(price)} − $${dollars(gapOpen)}）× 100 = ${money(gapLoss, 0)}，超过计划中的 ${money(planned, 0)}。股票期权隔夜不交易，价格可能直接跳过止损点；所以计算仓位时要按全部的 ${money(worst, 0)} 来算。`
						: `止损点是卖出的计划，隔夜消息之后，期权可能直接开在它下方。买入的看涨唯一不会超过的亏损是权利金 ${money(worst, 0)}，所以仓位大小要按这个数字来算。`,
				),
				c(
					"hold",
					"To buy one contract of this call, what must your account hold?",
					"要买入一张这样的看涨期权，你的账户里必须有什么？",
					[
						[
							"full",
							`The whole premium, ${money(worst, 0)}, in cash`,
							`全部权利金 ${money(worst, 0)}，以现金支付`,
						],
						[
							"half",
							`Half of it, ${money(worst / 2, 0)}; the broker lends the rest, as with shares`,
							`一半，即 ${money(worst / 2, 0)}；其余由券商借给你，和买股票一样`,
							"Shares can be bought partly with a broker's loan. Under FINRA and exchange margin rules, an option with nine months or less to expiry cannot: it must be paid for in full.",
							"买股票可以部分使用券商的借款。但按 FINRA 和交易所的保证金规则，距到期不超过九个月的期权不行，必须全额支付。",
						],
						[
							"strike",
							"Cash for 100 shares at the strike",
							"按行权价买入 100 股所需的现金",
							"That is what the writer of a cash-secured put sets aside, because a writer has an obligation. A buyer has a right and pays only the premium.",
							"那是现金担保看跌期权的义务方要预留的钱，因为义务方承担义务。买方拥有的是权利，只需支付权利金。",
						],
					],
					"full",
					`This call expires in about a month, so it is paid for in full: ${money(worst, 0)} in cash, which is also the most it can lose. Writing options is different: it ties up collateral or margin, writing uncovered options needs a higher approval level, and brokers set their own levels.`,
					`这张看涨约一个月后到期，所以必须全额支付：${money(worst, 0)} 现金，这也是它最多可能亏的金额。卖出期权则不同：它会占用担保品或保证金，卖出未备兑期权还需要更高的权限级别，而各券商的级别由它们自行设定。`,
				),
			],
		};
	},
};
