import "@tanstack/react-start/server-only";

import {
	ACCOUNT,
	CALL,
	CALL_BID,
	CASH,
	COVERED_BEST,
	COVERED_EVEN,
	COVERED_WORST,
	NET_PRICE,
	PUT,
	PUT_BID,
	SECURED_BEST,
	SECURED_WORST,
	SHARES,
	STOCK_COST,
} from "@/features/learning/lessons/selling-covered-options-model";
import {
	choose as c,
	money,
	numberQuestion as n,
	type TeachingUnit,
	t,
} from "./authoring.server";

const oicCoveredCall = {
	title: "OIC · Covered call (buy/write)",
	href: "https://www.optionseducation.org/strategies/all-strategies/covered-call-buy-write",
};
const oicCashSecuredPut = {
	title: "OIC · Cash-secured put",
	href: "https://www.optionseducation.org/strategies/all-strategies/cash-secured-put",
};
const oicAssignment = {
	title: "OIC · Options assignment",
	href: "https://www.optionseducation.org/referencelibrary/faq/options-assignment",
};
const oicGettingStarted = {
	title: "OIC · Getting started with options",
	href: "https://www.optionseducation.org/optionsoverview/getting-started-with-options",
};
const finraOptions = {
	title: "FINRA · Options",
	href: "https://www.finra.org/investors/investing/investment-products/options",
};
/** Lists covered call writing, uncovered writing and spreads as separate approvals. */
const finraApproval = {
	title: "FINRA · Regulatory Notice 21-15 (options account approval)",
	href: "https://www.finra.org/rules-guidance/notices/21-15",
};

/** Dollars from the model's cents. */
const d = (cents: number, places = 2) => money(cents / 100, places);

/**
 * The practice cases. Each changes a condition the idea depends on: which obligation was sold
 * (a call against shares, or a put against cash), and how it ends (assigned at expiry, expired
 * worthless, or bought back before the close). Prices are dollars a share.
 */
type Case = {
	kind: "call" | "put";
	contracts: number;
	/** What the shares cost, for a covered call. */
	cost: number;
	strike: number;
	premium: number;
	/** ALFA's close on expiry day. */
	close: number;
	/** Bought back on the morning of expiry day at this price a share, or not. */
	boughtBack: number | null;
};
const cases: readonly Case[] = [
	{
		kind: "call",
		contracts: 1,
		cost: 96.5,
		strike: 105,
		premium: 1.4,
		close: 107.2,
		boughtBack: null,
	},
	{
		kind: "put",
		contracts: 1,
		cost: 0,
		strike: 95,
		premium: 1.8,
		close: 97.4,
		boughtBack: null,
	},
	{
		kind: "put",
		contracts: 1,
		cost: 0,
		strike: 100,
		premium: 3.1,
		close: 96.3,
		boughtBack: null,
	},
	{
		kind: "call",
		contracts: 2,
		cost: 98,
		strike: 105,
		premium: 2.4,
		close: 108,
		boughtBack: 3.6,
	},
];

/** Cents from dollars, exact to the cent. */
const toCents = (dollars: number) => Math.round(dollars * 100);

export const sellingCoveredOptionsUnit: TeachingUnit = {
	id: "selling-covered-options",
	version: 1,
	conceptLab: {
		kind: "selling-covered-options",
		intro: t(
			"Sell one call against 100 shares you own and one put against cash set aside, read what each keeps, what each can lose and where each breaks even, and follow assignment as one of the ways each can end.",
			"对着自己持有的 100 股卖出一张看涨，再对着预留的现金卖出一张看跌；读出每一笔能留下多少、最多会亏多少、在哪里盈亏平衡，并把指派当作它们可能的结局之一来跟踪。",
		),
	},
	sources: [
		oicCoveredCall,
		oicCashSecuredPut,
		oicAssignment,
		oicGettingStarted,
		finraOptions,
		finraApproval,
	],
	explanation: t(
		"Selling an option takes on an obligation in exchange for the premium: a call's writer may have to sell 100 shares at the strike, a put's writer may have to buy 100 shares at the strike. Two ways of selling one have the obligation covered from the start. A covered call sells one call against 100 shares you own: if it is assigned, the shares are delivered. Its best case is the strike less what the shares cost, plus the premium, times 100; its worst case is what the shares cost less the premium, times 100, if the stock falls to zero; it breaks even at the shares' cost less the premium. In exchange it gives up any gain above the strike plus the premium. A cash-secured put sells one put and sets aside the strike times 100 in cash, enough to buy the shares if assigned. Its best case is the premium; its worst case is the strike less the premium, times 100; if it is assigned, the shares cost the strike less the premium, which is also its break-even, and they can keep falling after you own them. The cash stays tied up while the put is open. ALFA options are American-style: the holder may exercise on any trading day, so the writer can be assigned on any trading day, not only at expiry, and cannot tell when. It becomes likelier when the option is in the money with little time value left, and for a call just before the stock goes ex-dividend. At expiry, an equity option $0.01 or more in the money is exercised unless its holder instructs otherwise, and a broker may set its own threshold. The only sure way to avoid assignment is to buy the option back, closing the position. Brokers grant options approval in levels and decide which level covers covered calls, cash-secured puts, spreads and uncovered writing; the levels and their names differ by broker, so check yours before you sell. None of this says which option to sell or that either is safe; it shows what each obligation can cost.",
		"卖出期权就是用义务换取权利金：看涨的义务方可能要按行权价卖出 100 股，看跌的义务方可能要按行权价买入 100 股。有两种卖法，从一开始义务就有保障。备兑看涨是对着自己持有的 100 股卖出一张看涨：如果被指派，就交出这些股票。它的最好情况是行权价减去股票成本，再加上权利金，乘以 100；最坏情况是股价跌到零时，股票成本减去权利金，乘以 100；盈亏平衡点是股票成本减去权利金。作为交换，它放弃了行权价加权利金以上的全部涨幅。现金担保看跌是卖出一张看跌，并预留行权价乘以 100 的现金，足够在被指派时买下股票。它的最好情况就是权利金；最坏情况是行权价减去权利金，乘以 100；如果被指派，股票的净成本是行权价减去权利金，这也是它的盈亏平衡点，而买到手之后股价还可能继续下跌。只要这张看跌还在，这笔现金就一直被占用。ALFA 期权是美式期权：持有人可以在任一交易日行权，所以义务方在任一交易日都可能被指派，而不只是在到期时，而且无法预知是哪一天。期权处于实值且时间价值所剩无几时，被指派的可能性更大；对看涨来说，在股票除息日前夕也是如此。到期时，实值 $0.01 或以上的股票期权会被行权，除非持有人另行指示，券商也可以另设自己的门槛。唯一能确保不被指派的办法，是把期权买回来平仓。券商按级别开通期权权限，并自行决定备兑看涨、现金担保看跌、价差和卖出未备兑期权各属哪一级；级别的划分和名称因券商而异，卖出之前先向你的券商确认。以上都不是在说该卖哪一种期权，也不是说哪一种安全，而是说明每一项义务可能的代价。",
	),
	example: t(
		`ALFA is $100 on Sep 16. You own 100 shares bought at ${d(STOCK_COST, 0)} and sell the Oct 18 ${CALL.strike} call at its ${d(CALL_BID)} bid: you keep ${d(CALL_BID * SHARES, 0)}, the best case is +${d(COVERED_BEST, 0)} at $${CALL.strike} or above, break-even is ${d(COVERED_EVEN)}, and the worst case, if ALFA fell to $0, is ${d(COVERED_WORST, 0)}. Or you sell the Oct 18 ${PUT.strike} put at its ${d(PUT_BID)} bid and set aside $${PUT.strike} × 100 = ${d(CASH, 0)}, ${Math.round((CASH / ACCOUNT) * 100)}% of a ${d(ACCOUNT, 0)} account: the best case is +${d(SECURED_BEST, 0)}, if assigned the shares cost ${d(NET_PRICE)} each net, and the worst case is ${d(SECURED_WORST, 0)}.`,
		`9月16日 ALFA 为 $100。你持有以 ${d(STOCK_COST, 0)} 买入的 100 股，并按买价 ${d(CALL_BID)} 卖出 10月18日 ${CALL.strike} 看涨：留下 ${d(CALL_BID * SHARES, 0)}；最好情况是在 $${CALL.strike} 及以上时 +${d(COVERED_BEST, 0)}，盈亏平衡点 ${d(COVERED_EVEN)}，最坏情况（ALFA 跌到 $0）是 ${d(COVERED_WORST, 0)}。或者，你按买价 ${d(PUT_BID)} 卖出 10月18日 ${PUT.strike} 看跌，并预留 $${PUT.strike} × 100 = ${d(CASH, 0)}，占 ${d(ACCOUNT, 0)} 账户的 ${Math.round((CASH / ACCOUNT) * 100)}%：最好情况是 +${d(SECURED_BEST, 0)}；如果被指派，每股净成本 ${d(NET_PRICE)}；最坏情况是 ${d(SECURED_WORST, 0)}。`,
	),
	misconception: t(
		"Covered does not mean the position can't lose much. It means the obligation can be met: the shares can be delivered, or the cash can pay for them. The shares behind a covered call, or the shares a cash-secured put buys, can still fall toward zero, and assignment can come on any trading day until the option is bought back.",
		"“有保障”不等于这笔持仓亏不了多少。它的意思是义务能够履行：股票可以交出，或者现金可以付款。备兑看涨背后的股票、现金担保看跌买进的股票，都仍可能跌向零；而且在期权被买回之前，任何一个交易日都可能被指派。",
	),
	case: (v) => {
		const { kind, contracts, cost, strike, premium, close, boughtBack } =
			cases[v];
		const call = kind === "call";
		const shares = SHARES * contracts;
		const one = contracts === 1;
		const option = call ? (one ? "call" : "calls") : one ? "put" : "puts";
		const optionZh = call ? "看涨" : "看跌";
		/** Dollars, whole positions. */
		const worst =
			(toCents(call ? cost - premium : strike - premium) * shares) / 100;
		const breakEven = toCents(call ? cost - premium : strike - premium) / 100;
		const cash = strike * shares;
		const delivery = strike * shares;
		/** How it ends: bought back first, or left to expiry and assigned or not. */
		const end =
			boughtBack !== null
				? "closed"
				: (call ? close > strike : close < strike)
					? "assigned"
					: "expired";
		const inBy = Math.abs(toCents(close - strike)) / 100;
		const backResult =
			boughtBack === null ? 0 : (toCents(premium - boughtBack) * shares) / 100;
		const setup = call
			? t(
					`You own ${shares} ALFA shares bought at ${money(cost)} and sell ${contracts} ALFA ${strike} ${option} against them at ${money(premium)} a share, expiring in about a month.`,
					`你持有以 ${money(cost)} 买入的 ${shares} 股 ALFA，并对着它们以每股 ${money(premium)} 卖出 ${contracts} 张 ALFA ${strike} 看涨，约一个月后到期。`,
				)
			: t(
					`Your account holds ${money(ACCOUNT / 100, 0)} in cash and no ALFA shares. You sell ${contracts} ALFA ${strike} ${option} at ${money(premium)} a share, expiring in about a month, and set aside the cash ${one ? "it needs" : "they need"}.`,
					`你的账户有 ${money(ACCOUNT / 100, 0)} 现金，没有 ALFA 股票。你以每股 ${money(premium)} 卖出 ${contracts} 张 ALFA ${strike} 看跌，约一个月后到期，并预留所需的现金。`,
				);
		const ending =
			boughtBack !== null
				? t(
						`On the morning of expiry day ALFA is ${money(close)} and you buy the ${option} back to close at ${money(boughtBack)} a share. ALFA closes that day at ${money(close)}.`,
						`到期日上午 ALFA 为 ${money(close)}，你以每股 ${money(boughtBack)} 把这些${optionZh}买回平仓。当天 ALFA 收于 ${money(close)}。`,
					)
				: t(
						`On expiry day ALFA closes at ${money(close)}. You bought nothing back and gave your broker no instructions.`,
						`到期日 ALFA 收于 ${money(close)}。你没有买回，也没有给券商任何指示。`,
					);
		return {
			brief: t(
				`${setup.en} ${ending.en} One contract covers 100 shares; ignore fees.`,
				`${setup.zh}${ending.zh}一张合约对应 100 股，不计费用。`,
			),
			questions: [
				n(
					"worst-case",
					"When you open it, what is the most the whole position could lose by expiry, in dollars, if ALFA fell to $0?",
					"开仓时，如果 ALFA 跌到 $0，整个持仓到期时最多会亏多少美元？",
					worst,
					"dollars",
					"美元",
					call
						? `(${money(cost)} − ${money(premium)}) × ${shares} = ${money(worst, 0)}. The shares can fall to zero; the premium kept is all that offsets it.`
						: `(${money(strike, 0)} − ${money(premium)}) × ${shares} = ${money(worst, 0)}. Assigned, you pay ${money(strike, 0)} a share for shares that could be worth nothing; the premium kept is all that offsets it.`,
					call
						? `(${money(cost)} − ${money(premium)}) × ${shares} = ${money(worst, 0)}。股票可能跌到零，能抵消的只有留下的权利金。`
						: `(${money(strike, 0)} − ${money(premium)}) × ${shares} = ${money(worst, 0)}。被指派时，你要按每股 ${money(strike, 0)} 买入可能一文不值的股票，能抵消的只有留下的权利金。`,
				),
				n(
					"break-even",
					"At what ALFA price at expiry does the position break even?",
					"到期时 ALFA 在什么价格，这笔持仓刚好盈亏平衡？",
					breakEven,
					"dollars",
					"美元",
					call
						? `What the shares cost less the premium: ${money(cost)} − ${money(premium)} = ${money(breakEven)}.`
						: `The strike less the premium: ${money(strike, 0)} − ${money(premium)} = ${money(breakEven)}. It is also the net price a share if the put is assigned.`,
					call
						? `股票成本减去权利金：${money(cost)} − ${money(premium)} = ${money(breakEven)}。`
						: `行权价减去权利金：${money(strike, 0)} − ${money(premium)} = ${money(breakEven)}。这也是看跌被指派时每股的净成本。`,
				),
				c(
					"cover",
					"While the position is open, what covers its obligation?",
					"持仓存续期间，它的义务由什么来保障？",
					[
						[
							"shares",
							`The ${shares} ALFA shares in the account`,
							`账户里的 ${shares} 股 ALFA`,
							call
								? "That is what covers this call: if it is assigned, the shares are delivered at the strike."
								: `You own no ALFA shares here. A sold put obliges you to buy shares, so it is covered by cash for the strike × 100: ${money(cash, 0)}.`,
							call
								? "这正是这张看涨的保障：如果被指派，就按行权价交出这些股票。"
								: `这里你没有 ALFA 股票。卖出看跌的义务是买入股票，所以它由行权价 × 100 的现金来保障：${money(cash, 0)}。`,
						],
						[
							"cash",
							`${money(cash, 0)} in cash, set aside`,
							`预留的 ${money(cash, 0)} 现金`,
							call
								? `A sold call obliges you to sell ${shares} shares at ${money(strike, 0)}, and the shares you own can be delivered. Cash for the strike covers a sold put, which obliges you to buy.`
								: "That is what covers this put: if it is assigned, the cash pays for the shares at the strike.",
							call
								? `卖出看涨的义务是按 ${money(strike, 0)} 卖出 ${shares} 股，而你持有的股票可以交出。按行权价预留现金保障的是卖出看跌，它的义务是买入。`
								: "这正是这张看跌的保障：如果被指派，就用这笔现金按行权价买下股票。",
						],
						[
							"premium",
							`The ${money(premium * shares, 0)} premium received`,
							`收到的 ${money(premium * shares, 0)} 权利金`,
							`The premium is far smaller than the obligation: ${call ? `delivering ${shares} shares` : `paying ${money(cash, 0)} for ${shares} shares`}. It is what you are paid for taking the obligation on, not what meets it.`,
							`权利金远小于这项义务：${call ? `交出 ${shares} 股` : `为 ${shares} 股支付 ${money(cash, 0)}`}。它是承担义务的报酬，而不是履行义务的保障。`,
						],
						[
							"nothing",
							"Nothing: a sold option needs no cover",
							"什么都不需要：卖出的期权不用保障",
							`Here it is covered, by ${call ? "the shares you own" : "the cash set aside"}. Writing an option with nothing behind it is uncovered writing: it ties up margin and needs a higher options approval level, and an uncovered call's loss has no limit.`,
							`这里是有保障的：${call ? "靠你持有的股票" : "靠预留的现金"}。没有任何东西作保障地卖出期权就是卖出未备兑期权：它会占用保证金，需要更高的期权权限级别，而未备兑的看涨亏损没有上限。`,
						],
					],
					call ? "shares" : "cash",
					call
						? `A covered call is covered by the shares: assigned, you deliver the ${shares} shares at ${money(strike, 0)} and receive ${money(delivery, 0)}.`
						: `A cash-secured put is covered by the cash: ${money(strike, 0)} × ${shares} = ${money(cash, 0)} is set aside${one ? `, ${Math.round(((strike * shares * 100) / ACCOUNT) * 100)}% of the account,` : ""} and stays tied up while the put is open.`,
					call
						? `备兑看涨由股票来保障：被指派时，你按 ${money(strike, 0)} 交出 ${shares} 股，收到 ${money(delivery, 0)}。`
						: `现金担保看跌由现金来保障：${money(strike, 0)} × ${shares} = ${money(cash, 0)} 被预留${one ? `，占账户的 ${Math.round(((strike * shares * 100) / ACCOUNT) * 100)}%，` : ""}在这张看跌存续期间一直被占用。`,
				),
				c(
					"monday",
					"What has changed in the account by the Monday after expiry?",
					"到期后的周一，账户里发生了什么变化？",
					[
						[
							"sold",
							`${shares} ALFA shares sold at ${money(strike, 0)}`,
							`${shares} 股 ALFA 以 ${money(strike, 0)} 卖出`,
							end === "closed"
								? `You bought the ${option} back that morning, so none was left to be exercised at the close: the shares stay.`
								: call
									? `ALFA closed at ${money(close)}, below the ${money(strike, 0)} strike: the call was out of the money and expired, so the shares stay.`
									: "A put's writer who is assigned buys shares; a call's writer is the one who sells them.",
							end === "closed"
								? "当天上午你已把期权买回，收盘时没有可以被行权的期权：股票还在。"
								: call
									? `ALFA 收于 ${money(close)}，低于行权价 ${money(strike, 0)}：看涨是虚值，到期作废，股票还在。`
									: "看跌的义务方被指派时是买入股票；卖出股票的是看涨的义务方。",
						],
						[
							"bought",
							`${shares} ALFA shares bought at ${money(strike, 0)}`,
							`以 ${money(strike, 0)} 买入 ${shares} 股 ALFA`,
							call
								? "A call's writer who is assigned sells shares; it is a put's writer who buys them."
								: `ALFA closed at ${money(close)}, above the ${money(strike, 0)} strike: the put was out of the money and expired, so nothing was bought.`,
							call
								? "看涨的义务方被指派时是卖出股票；买入股票的是看跌的义务方。"
								: `ALFA 收于 ${money(close)}，高于行权价 ${money(strike, 0)}：看跌是虚值，到期作废，什么都没有买入。`,
						],
						[
							"expired",
							`Nothing but the premium: the ${option} expired worthless`,
							`只多了权利金：${optionZh}到期作废`,
							end === "closed"
								? `The ${option} did not expire in the account: you bought ${one ? "it" : "them"} back that morning at ${money(boughtBack ?? 0)}.`
								: `ALFA closed at ${money(close)}, ${call ? "above" : "below"} the ${money(strike, 0)} strike: the ${option} ${one ? "was" : "were"} ${money(inBy)} in the money, and an option $0.01 or more in the money at expiry is exercised unless its holder instructs otherwise. You were assigned.`,
							end === "closed"
								? `这些${optionZh}并不是在账户里到期的：当天上午你已以 ${money(boughtBack ?? 0)} 把它们买回。`
								: `ALFA 收于 ${money(close)}，${call ? "高于" : "低于"}行权价 ${money(strike, 0)}：${optionZh}有 ${money(inBy)} 的实值，而到期时实值 $0.01 或以上的期权会被行权，除非持有人另行指示。你被指派了。`,
						],
						[
							"closed",
							`Nothing: the ${option} ${one ? "was" : "were"} bought back before the close`,
							`没有变化：${optionZh}在收盘前已买回`,
							"Nothing was bought back: you gave your broker no instructions, so the option went to expiry.",
							"没有买回任何东西：你没有给券商任何指示，所以期权一直留到了到期。",
						],
					],
					end === "closed"
						? "closed"
						: end === "expired"
							? "expired"
							: call
								? "sold"
								: "bought",
					end === "closed"
						? `Buying the ${option} back to close ended the obligation: nothing was left to assign. On the ${option} the result was (${money(premium)} − ${money(boughtBack ?? 0)}) × ${shares} = ${backResult < 0 ? "−" : "+"}${money(Math.abs(backResult), 0)}, and the ${shares} shares stay in the account. Left open at ${money(close)}, above the strike, they would have been sold at ${money(strike, 0)}.`
						: end === "expired"
							? `${call ? "Below" : "Above"} the strike the ${option} expired worthless: the ${money(premium * shares, 0)} premium is kept${call ? " and the shares stay" : ", and the cash set aside is free again"}.`
							: call
								? `Above the strike the call was exercised and you were assigned: the ${shares} shares were delivered at ${money(strike, 0)} and ${money(delivery, 0)} came in. Assignment is one of the ways a covered call ends.`
								: `Below the strike the put was exercised and you were assigned: the ${money(cash, 0)} set aside paid for ${shares} shares, ${money(breakEven)} a share net of the premium, now worth ${money(close)} each. Assignment is one of the ways a cash-secured put ends.`,
					end === "closed"
						? `把${optionZh}买回平仓就结束了义务：没有东西可以被指派了。这笔平仓在${optionZh}上的结果是 (${money(premium)} − ${money(boughtBack ?? 0)}) × ${shares} = ${backResult < 0 ? "−" : "+"}${money(Math.abs(backResult), 0)}，${shares} 股仍留在账户里。如果不平仓，收在 ${money(close)}、高于行权价，这些股票就会以 ${money(strike, 0)} 卖出。`
						: end === "expired"
							? `${call ? "低于" : "高于"}行权价时，${optionZh}到期作废：${money(premium * shares, 0)} 权利金留下${call ? "，股票也还在" : "，预留的现金也重新可用"}。`
							: call
								? `高于行权价时，看涨被行权，你被指派：${shares} 股以 ${money(strike, 0)} 交出，收到 ${money(delivery, 0)}。被指派是备兑看涨的结局之一。`
								: `低于行权价时，看跌被行权，你被指派：预留的 ${money(cash, 0)} 用来买入 ${shares} 股，扣除权利金后每股 ${money(breakEven)}，而现在每股只值 ${money(close)}。被指派是现金担保看跌的结局之一。`,
				),
			],
		};
	},
};
