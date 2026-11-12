import "@tanstack/react-start/server-only";

import {
	ACCOUNT,
	BREAK_EVEN,
	DEBIT,
	ENDS,
	LONG,
	MAX_GAIN,
	MAX_LOSS,
	PAID,
	PLAN_SPREADS,
	RECEIVED,
	SHARES,
	SHORT,
	sharesCash,
	worstCase,
} from "@/features/learning/lessons/first-spread-trade-model";
import {
	choose as c,
	money,
	numberQuestion as n,
	signedMoney,
	type TeachingUnit,
	t,
} from "./authoring.server";

const oicBullCallSpread = {
	title: "OIC · Bull call spread (debit call spread)",
	href: "https://www.optionseducation.org/strategies/all-strategies/bull-call-spread-debit-call-spread",
};
const oicExercise = {
	title: "OIC · Options exercise",
	href: "https://www.optionseducation.org/referencelibrary/faq/options-exercise",
};
const oicAssignment = {
	title: "OIC · Options assignment",
	href: "https://www.optionseducation.org/referencelibrary/faq/options-assignment",
};
const finraOptions = {
	title: "FINRA · Options",
	href: "https://www.finra.org/investors/investing/investment-products/options",
};

/**
 * The practice cases. Each changes a condition the idea depends on: how the order was sent
 * (one two-leg order, or the bought call first), and how the spread ends (between the
 * strikes, above both, below both, or sold before the close).
 */
const cases = [
	{ long: 100, short: 105, call: 4.0, debit: 2.0, spreads: 2, close: 103 },
	{ long: 100, short: 110, call: 5.1, debit: 3.5, spreads: 3, close: 112 },
	{ long: 105, short: 110, call: 2.2, debit: 1.25, spreads: 4, close: 104 },
	{ long: 100, short: 105, call: 4.3, debit: 2.4, spreads: 1, close: 102 },
] as const;
/** The first and third cases go in as one two-leg order; the others send the bought call first. */
const legged = [false, true, false, true] as const;
/** Only the last case is sold before the close, at this net price per share. */
const soldFor = [null, null, null, 1.7] as const;

export const firstSpreadTradeUnit: TeachingUnit = {
	id: "first-spread-trade",
	version: 1,
	conceptLab: {
		kind: "first-spread-trade",
		intro: t(
			"Build one call spread from a view, send it as one order at a net price, size it against a $10,000 account, write its exits down, and follow three ways it can end on Oct 18.",
			"从一个看法出发搭出一组看涨价差，用一张订单按净价下达，对照 $10,000 的账户决定数量，写下出场点，再看它在 10月18日 的三种结局。",
		),
	},
	sources: [oicBullCallSpread, oicExercise, oicAssignment, finraOptions],
	explanation: t(
		"A call debit spread buys one call and sells another at a higher strike in the same expiry. It goes in as one order with two legs at a net limit price, the net debit, and the legs fill together at that price or better. The debit times 100 is the most one spread can lose; the distance between the strikes minus the debit is the most it can make; it breaks even at the lower strike plus the debit. Size follows from the worst case: the debit times 100 times the number of spreads, set against the account. At expiry there are three ends. Below both strikes, both calls expire worthless. Above both, the bought call is exercised and the sold call is assigned, and the distance between the strikes arrives in cash. Between the strikes, the sold call expires worthless but the bought call is exercised: an equity option that is $0.01 or more in the money at expiry is exercised unless its holder instructs otherwise (a broker may set its own threshold), and 100 shares per spread must be paid for at the strike. The sold call can also be assigned on any trading day before expiry, most often just before an ex-dividend date. That is why many traders close a spread before expiry instead of letting it settle. Brokers usually require a higher options approval level for spreads than for buying a single call or put, and the levels and their names differ by broker. None of this says a spread is a good trade; it says which numbers are known before the order is sent.",
		"看涨借方价差是在同一到期日买入一张看涨，同时卖出一张行权价更高的看涨。它作为一张两条腿的订单下达，带一个净限价，也就是净支出；两条腿一起按这个价格或更优的价格成交。净支出乘以 100 是一组价差最多能亏的金额；两个行权价之差减去净支出是最多能赚的金额；盈亏平衡点是较低的行权价加上净支出。数量由最坏情况决定：净支出乘以 100 再乘以组数，对照账户的大小。到期时有三种结局。低于两个行权价，两张看涨都作废。高于两个行权价，买入的看涨被行权、卖出的看涨被指派，两个行权价之差以现金入账。落在两个行权价之间，卖出的看涨作废，但买入的看涨会被行权：股票期权到期时实值 $0.01 或以上就会被行权，除非持有人另行指示（券商可以另设自己的门槛），每组价差要按行权价付钱买入 100 股。卖出的看涨在到期前的任何交易日也可能被指派，最常见于除息日前。因此很多交易者会在到期前平掉价差，而不是等它结算。券商对价差要求的期权权限级别，通常高于买入单张看涨或看跌，级别的划分和名称因券商而异。以上都不是说价差是一笔好交易，而是说明哪些数字在下单之前就已知道。",
	),
	example: t(
		`ALFA is $100 on Sep 16. Buying the Oct 18 ${LONG.strike} call at ${money(PAID / 100)} and selling the ${SHORT.strike} call at ${money(RECEIVED / 100)} costs a net ${money(DEBIT / 100)} a share: ${money(MAX_LOSS, 0)} a spread at worst, ${money(MAX_GAIN, 0)} at best, break-even ${money(BREAK_EVEN)}. ${PLAN_SPREADS} spreads risk ${money(worstCase(PLAN_SPREADS), 0)} of a ${money(ACCOUNT, 0)} account. If ALFA closes at ${money(ENDS.between, 0)} on Oct 18 and nothing is closed, each ${LONG.strike} call is exercised into ${SHARES} shares for ${money(sharesCash(LONG), 0)}.`,
		`9月16日 ALFA 为 $100。以 ${money(PAID / 100)} 买入 10月18日 ${LONG.strike} 看涨，并以 ${money(RECEIVED / 100)} 卖出 ${SHORT.strike} 看涨，净支出每股 ${money(DEBIT / 100)}：每组最坏亏 ${money(MAX_LOSS, 0)}，最好赚 ${money(MAX_GAIN, 0)}，盈亏平衡点 ${money(BREAK_EVEN)}。${PLAN_SPREADS} 组价差在 ${money(ACCOUNT, 0)} 的账户里最多亏 ${money(worstCase(PLAN_SPREADS), 0)}。如果 10月18日 ALFA 收于 ${money(ENDS.between, 0)} 且没有平仓，每张 ${LONG.strike} 看涨都会被行权，要用 ${money(sharesCash(LONG), 0)} 买入 ${SHARES} 股。`,
	),
	misconception: t(
		"Defined risk describes the spread, not what it can turn into. Left open between its strikes at expiry, each spread becomes 100 shares to pay for, a position far larger than the debit.",
		"“风险有限”说的是价差本身，而不是它可能变成的东西。到期时若停在两个行权价之间又没有平仓，每组价差都会变成要付钱买入的 100 股，远大于当初的净支出。",
	),
	case: (v) => {
		const { long, short, call, debit, spreads, close } = cases[v];
		const sold = Math.round((call - debit) * 100) / 100;
		const sentApart = legged[v];
		const exit = soldFor[v];
		const worst = Math.round(debit * 100) * spreads;
		const alone = Math.round(call * 100) * spreads;
		const breakEven = Math.round((long + debit) * 100) / 100;
		const shares = 100 * spreads;
		const sharesBill = long * shares;
		const best = (short - long) * 100 * spreads - worst;
		/** How the spread ends: sold first, or left to expire below, between or above its strikes. */
		const end =
			exit !== null
				? "closed"
				: close <= long
					? "below"
					: close <= short
						? "between"
						: "above";
		const count =
			spreads === 1 ? "one ALFA call spread" : `${spreads} ALFA call spreads`;
		return {
			brief: t(
				`In a ${money(ACCOUNT, 0)} account you plan to buy ${count}: ${spreads === 1 ? "" : "for each, "}buy the ${long} call at ${money(call)} and sell the ${short} call at ${money(sold)}, same expiry. ${
					sentApart
						? `You send the purchase of the ${long} ${spreads === 1 ? "call" : "calls"} first, as its own order, and it fills at ${money(call)}. A minute later your separate order to sell the ${short} ${spreads === 1 ? "call" : "calls"} fills at ${money(sold)}, completing the spread for a net ${money(debit)}.`
						: `You send it as one two-leg order with a net debit limit of ${money(debit)}, and it fills at ${money(debit)}.`
				} ${
					exit !== null
						? `On the morning of expiry day you sell the spread for a net ${money(exit)}. ALFA closes that day at ${money(close, 0)}.`
						: `On expiry day ALFA closes at ${money(close, 0)}. You sold nothing before the close and gave your broker no instructions.`
				} One contract covers 100 shares; ignore fees.`,
				`在一个 ${money(ACCOUNT, 0)} 的账户里，你计划做 ${spreads} 组 ALFA 看涨价差：以 ${money(call)} 买入 ${long} 看涨，以 ${money(sold)} 卖出 ${short} 看涨，到期日相同。${
					sentApart
						? `你先单独下一张订单买入 ${long} 看涨，以 ${money(call)} 成交。一分钟后，你另一张卖出 ${short} 看涨的订单以 ${money(sold)} 成交，价差就此完成，净支出 ${money(debit)}。`
						: `你用一张两条腿的订单下达，净支出限价 ${money(debit)}，并以 ${money(debit)} 成交。`
				}${
					exit !== null
						? `到期日上午，你以净价 ${money(exit)} 卖出了价差。当天 ALFA 收于 ${money(close, 0)}。`
						: `到期日 ALFA 收于 ${money(close, 0)}。收盘前你什么都没卖，也没有给券商任何指示。`
				}一张合约对应 100 股，不计费用。`,
			),
			questions: [
				n(
					"worst-case",
					"Once both legs have filled, what is the most the whole position can lose, in dollars?",
					"两条腿都成交之后，整个持仓最多亏多少美元？",
					worst,
					"dollars",
					"美元",
					`${money(debit)} × 100 × ${spreads} = ${money(worst, 0)}. The net debit is the most a call debit spread can lose, and it is known before the order is sent.`,
					`${money(debit)} × 100 × ${spreads} = ${money(worst, 0)}。净支出就是看涨借方价差最多能亏的金额，下单之前就已知道。`,
				),
				n(
					"break-even",
					"At what ALFA price at expiry does the spread break even?",
					"到期时 ALFA 在什么价格，价差刚好盈亏平衡？",
					breakEven,
					"dollars",
					"美元",
					`The lower strike plus the debit: ${money(long, 0)} + ${money(debit)} = ${money(breakEven)}.`,
					`较低的行权价加上净支出：${money(long, 0)} + ${money(debit)} = ${money(breakEven)}。`,
				),
				c(
					"first-fill",
					"Right after your first fill, what was the most you could lose on what you held?",
					"第一次成交之后，你手里的持仓最多会亏多少？",
					[
						[
							"debit",
							`${money(worst, 0)}: the net debit, because both legs filled together`,
							`${money(worst, 0)}：就是净支出，因为两条腿一起成交`,
							`The legs did not fill together. For a minute you held only the ${long} ${spreads === 1 ? "call" : "calls"}, bought at ${money(call)} a share: ${money(alone, 0)} at risk.`,
							`两条腿并不是一起成交的。有一分钟你手里只有以每股 ${money(call)} 买入的 ${long} 看涨：风险是 ${money(alone, 0)}。`,
						],
						[
							"premium",
							`${money(alone, 0)}: the full price of the bought ${spreads === 1 ? "call" : "calls"}, held alone`,
							`${money(alone, 0)}：单独持有的买入看涨的全部价格`,
							`The two-leg order filled both legs at once at its net price of ${money(debit)}, so you never held the bought ${spreads === 1 ? "call" : "calls"} alone.`,
							`两腿订单按 ${money(debit)} 的净价让两条腿同时成交，所以你从没有单独持有过买入的看涨。`,
						],
						[
							"unlimited",
							"No limit: a call had been sold",
							"没有上限：因为卖出了看涨",
							sentApart
								? `The order that filled first was the purchase. A loss with no limit would need the ${short} call to be sold first, with nothing covering it.`
								: `The ${short} call was sold in the same fill as the ${long} call that covers it. There was never a sold call on its own.`,
							sentApart
								? `先成交的是买入的那张订单。只有先卖出 ${short} 看涨、又没有东西覆盖它，亏损才会没有上限。`
								: `${short} 看涨和覆盖它的 ${long} 看涨是在同一次成交里完成的，从来没有单独卖出的看涨。`,
						],
					],
					sentApart ? "premium" : "debit",
					sentApart
						? `Sent as separate orders, the legs fill one at a time. Until the ${short} ${spreads === 1 ? "call was" : "calls were"} sold you held ${spreads === 1 ? "a single call" : "single calls"} that cost ${money(call)} × 100 × ${spreads} = ${money(alone, 0)}, more than the ${money(worst, 0)} the plan was sized on.`
						: `One order with a net limit fills the pair together or not at all, so from the first fill the worst case was the ${money(worst, 0)} debit the plan was sized on.`,
					sentApart
						? `分开下单时，两条腿是一条一条成交的。在卖出 ${short} 看涨之前，你持有的是单独的看涨，成本为 ${money(call)} × 100 × ${spreads} = ${money(alone, 0)}，高于计划所依据的 ${money(worst, 0)}。`
						: `带净限价的一张订单要么成对成交，要么不成交，所以从第一次成交起，最坏情况就是计划所依据的 ${money(worst, 0)} 净支出。`,
				),
				c(
					"monday",
					"What is in the account on the Monday after expiry?",
					"到期后的周一，账户里有什么？",
					[
						[
							"shares",
							`${shares} ALFA shares, bought at ${money(long, 0)}`,
							`${shares} 股 ALFA，以 ${money(long, 0)} 买入`,
							end === "closed"
								? "You sold the spread on the morning of expiry day, so no call was left in the account to be exercised at the close."
								: end === "above"
									? `ALFA closed above ${money(short, 0)} too, so the ${short} ${spreads === 1 ? "call" : "calls"} you sold ${spreads === 1 ? "was" : "were"} assigned and the shares were sold at ${money(short, 0)}. None stay.`
									: `ALFA closed at ${money(close, 0)}, below the ${long} strike. The bought ${spreads === 1 ? "call was" : "calls were"} out of the money and ${spreads === 1 ? "was" : "were"} not exercised.`,
							end === "closed"
								? "你在到期日上午就卖出了价差，收盘时账户里已经没有可以被行权的看涨。"
								: end === "above"
									? `ALFA 的收盘价也高于 ${money(short, 0)}，所以你卖出的 ${short} 看涨被指派，股票以 ${money(short, 0)} 卖出，一股也没留下。`
									: `ALFA 收于 ${money(close, 0)}，低于行权价 ${long}。买入的看涨是虚值，没有被行权。`,
						],
						[
							"cash",
							`No shares: bought at ${money(long, 0)} and sold at ${money(short, 0)}, the maximum gain`,
							`没有股票：以 ${money(long, 0)} 买入、${money(short, 0)} 卖出，赚到最大盈利`,
							end === "closed"
								? `You sold the spread for ${money(exit ?? 0)} before the close. The result was fixed then, and it was not the maximum.`
								: end === "between"
									? `ALFA closed below ${money(short, 0)}, so the ${short} ${spreads === 1 ? "call" : "calls"} you sold expired worthless and nothing sold the shares.`
									: `At ${money(close, 0)} both calls were out of the money. Neither was exercised, and the debit was lost.`,
							end === "closed"
								? `你在收盘前以 ${money(exit ?? 0)} 卖出了价差。结果在那时就已确定，而且不是最大盈利。`
								: end === "between"
									? `ALFA 收在 ${money(short, 0)} 以下，所以你卖出的 ${short} 看涨到期作废，没有人来买走这些股票。`
									: `收于 ${money(close, 0)} 时，两张看涨都是虚值，都没有被行权，净支出亏掉了。`,
						],
						[
							"nothing",
							"No position: both calls expired worthless",
							"没有持仓：两张看涨都到期作废",
							end === "closed"
								? `The calls did not expire in your account: you sold the spread that morning for a net ${money(exit ?? 0)}.`
								: end === "between"
									? `Only the ${short} ${spreads === 1 ? "call" : "calls"} expired worthless. The ${long} ${spreads === 1 ? "call was" : "calls were"} ${money(close - long)} in the money, and a call $0.01 or more in the money is exercised unless you instruct otherwise.`
									: `At ${money(close, 0)} both calls were in the money: yours ${spreads === 1 ? "was" : "were"} exercised and the ${spreads === 1 ? "one" : "ones"} you sold ${spreads === 1 ? "was" : "were"} assigned.`,
							end === "closed"
								? `这些看涨并不是在你的账户里到期的：你当天上午就以净价 ${money(exit ?? 0)} 卖出了价差。`
								: end === "between"
									? `只有 ${short} 看涨到期作废。${long} 看涨有 ${money(close - long)} 的实值，而实值 $0.01 或以上的看涨会被行权，除非你另行指示。`
									: `收于 ${money(close, 0)} 时，两张看涨都是实值：你的被行权，你卖出的被指派。`,
						],
						[
							"closed",
							"No position: the spread was sold before the close",
							"没有持仓：价差在收盘前已经卖出",
							"Nothing was sold before the close: you gave your broker no instructions, so both calls went to expiry.",
							"收盘前什么都没卖：你没有给券商任何指示，所以两张看涨都留到了到期。",
						],
					],
					end === "closed"
						? "closed"
						: end === "between"
							? "shares"
							: end === "above"
								? "cash"
								: "nothing",
					end === "closed"
						? `Selling the spread for ${money(exit ?? 0)} fixed the result at ${money(exit ?? 0)} − ${money(debit)} = ${signedMoney((exit ?? 0) - debit)} a share, ${signedMoney(((exit ?? 0) - debit) * 100 * spreads, 0)} in all. With ALFA closing at ${money(close, 0)}, between the strikes, leaving it open would have meant buying ${shares} shares for ${money(sharesBill, 0)}.`
						: end === "between"
							? `Between the strikes the ${short} ${spreads === 1 ? "call expires" : "calls expire"} worthless, but the ${long} ${spreads === 1 ? "call is" : "calls are"} in the money and ${spreads === 1 ? "is" : "are"} exercised: ${shares} shares for ${money(sharesBill, 0)}, against a ${money(ACCOUNT, 0)} account. A broker may close such a position on expiry day or issue a margin call; the practice differs by broker. Closing the spread before the close avoids it.`
							: end === "above"
								? `Above both strikes your ${spreads === 1 ? "call is" : "calls are"} exercised and the ${spreads === 1 ? "one" : "ones"} you sold ${spreads === 1 ? "is" : "are"} assigned: shares bought at ${money(long, 0)} are sold at ${money(short, 0)}, and no shares stay. The result is the maximum, ${signedMoney(best, 0)} in all.`
								: `Below both strikes neither call is worth exercising. Both expire, the ${money(worst, 0)} debit is lost, and nothing else happens.`,
					end === "closed"
						? `以 ${money(exit ?? 0)} 卖出价差，结果就确定为每股 ${money(exit ?? 0)} − ${money(debit)} = ${signedMoney((exit ?? 0) - debit)}，合计 ${signedMoney(((exit ?? 0) - debit) * 100 * spreads, 0)}。ALFA 收于 ${money(close, 0)}，在两个行权价之间；如果没有平仓，就要用 ${money(sharesBill, 0)} 买入 ${shares} 股。`
						: end === "between"
							? `在两个行权价之间，${short} 看涨到期作废，但 ${long} 看涨是实值，会被行权：要用 ${money(sharesBill, 0)} 买入 ${shares} 股，而账户只有 ${money(ACCOUNT, 0)}。券商可能在到期日替你平掉这样的持仓，或发出追加保证金通知；各家券商做法不同。在收盘前平掉价差就能避免。`
							: end === "above"
								? `高于两个行权价时，你的看涨被行权，你卖出的看涨被指派：以 ${money(long, 0)} 买入的股票以 ${money(short, 0)} 卖出，账户里不留股票。结果是最大盈利，合计 ${signedMoney(best, 0)}。`
								: `低于两个行权价时，两张看涨都不值得行权。它们都到期作废，亏掉 ${money(worst, 0)} 的净支出，此外什么都不会发生。`,
				),
			],
		};
	},
};
