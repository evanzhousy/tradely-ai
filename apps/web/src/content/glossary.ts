import type { ConceptId } from "./concepts";

/**
 * Course terms a learner can tap for a short meaning where the lesson text uses them.
 *
 * `en` and `zh` list the forms matched in that language's text, longest first in matching;
 * English matches ignore case. Leave out English words that double as everyday verbs or carry
 * two senses here (call, put, bid, ask, spread, block): a wrong match teaches the wrong thing.
 * A meaning explains the word, never a question's answer or method.
 */
export type GlossaryEntry = {
	id: string;
	name: { en: string; zh: string };
	en: readonly string[];
	zh: readonly string[];
	meaning: { en: string; zh: string };
	concept?: ConceptId;
};

const entry = (
	id: string,
	name: [string, string],
	en: readonly string[],
	zh: readonly string[],
	meaning: [string, string],
	concept?: ConceptId,
): GlossaryEntry => ({
	id,
	name: { en: name[0], zh: name[1] },
	en,
	zh,
	meaning: { en: meaning[0], zh: meaning[1] },
	...(concept ? { concept } : {}),
});

export const glossary: readonly GlossaryEntry[] = [
	entry(
		"premium",
		["Premium", "权利金"],
		["premium", "premiums"],
		["权利金"],
		[
			"The price of an option. It is quoted per share; the buyer pays it to the writer.",
			"期权的价格。按每股报价，由买方付给义务方。",
		],
		"C03",
	),
	entry(
		"strike",
		["Strike", "行权价"],
		["strike price", "strike", "strikes"],
		["行权价"],
		[
			"The fixed price at which an option lets its holder buy (a call) or sell (a put) the underlying.",
			"期权允许持有人买入（看涨）或卖出（看跌）标的的固定价格。",
		],
		"C02",
	),
	entry(
		"expiry",
		["Expiry", "到期日"],
		["expiration date", "expiration", "expiry"],
		["到期日"],
		[
			"The last day an option exists. After it the contract is settled or worthless.",
			"期权存在的最后一天。过了这一天，合约要么结算，要么作废。",
		],
		"C02",
	),
	entry(
		"open-interest",
		["Open interest", "未平仓量"],
		["open interest"],
		["未平仓量"],
		[
			"The number of contracts still outstanding, counted once a day after the close.",
			"仍然存续的合约张数，每天收盘后统计一次。",
		],
		"C08",
	),
	entry(
		"volume",
		["Volume", "成交量"],
		["volume"],
		["成交量"],
		[
			"The number of contracts that traded during a session.",
			"一个交易时段内成交的合约张数。",
		],
		"C08",
	),
	entry(
		"implied-volatility",
		["Implied volatility (IV)", "隐含波动率（IV）"],
		["implied volatility", "IV"],
		["隐含波动率", "IV"],
		[
			"The volatility that makes a pricing model match an option's market price. It looks forward and is quoted per year.",
			"让定价模型与期权市场价格吻合的波动率。它面向未来，按年报价。",
		],
		"C14",
	),
	entry(
		"realized-volatility",
		["Realized volatility", "已实现波动率"],
		["realized volatility"],
		["已实现波动率"],
		[
			"How much the stock actually moved, measured from past returns over a stated window and annualized.",
			"股票实际波动了多少，用指定窗口内的历史收益计算并年化。",
		],
		"C14",
	),
	entry(
		"delta",
		["Delta", "Delta"],
		["delta"],
		["Delta"],
		[
			"In the model, about how much an option's price changes for a $1 move in the stock, with everything else held fixed.",
			"在模型中，其他条件不变时，股价变动 $1 期权价格大约变动多少。",
		],
		"C13",
	),
	entry(
		"gamma",
		["Gamma", "Gamma"],
		["gamma"],
		["Gamma"],
		[
			"How much delta itself changes for a $1 move in the stock.",
			"股价变动 $1 时，Delta 本身变化多少。",
		],
		"C13",
	),
	entry(
		"theta",
		["Theta", "Theta"],
		["theta"],
		["Theta"],
		[
			"How much an option's value changes as one day passes, with everything else held fixed.",
			"其他条件不变时，经过一天期权价值变化多少。",
		],
		"C13",
	),
	entry(
		"vega",
		["Vega", "Vega"],
		["vega"],
		["Vega"],
		[
			"How much an option's value changes for a one-point change in implied volatility.",
			"隐含波动率变动一个点时，期权价值变化多少。",
		],
		"C13",
	),
	entry(
		"in-the-money",
		["In the money", "实值"],
		["in the money", "in-the-money"],
		["实值"],
		[
			"An option with intrinsic value: a call with the stock above its strike, or a put with the stock below it.",
			"有内在价值的期权：股价高于行权价的看涨，或股价低于行权价的看跌。",
		],
		"C03",
	),
	entry(
		"out-of-the-money",
		["Out of the money", "虚值"],
		["out of the money", "out-of-the-money"],
		["虚值"],
		[
			"An option with no intrinsic value: a call with the stock below its strike, or a put with the stock above it.",
			"没有内在价值的期权：股价低于行权价的看涨，或股价高于行权价的看跌。",
		],
		"C03",
	),
	entry(
		"at-the-money",
		["At the money", "平值"],
		["at the money", "at-the-money"],
		["平值"],
		[
			"An option whose strike is at, or very near, the stock's price.",
			"行权价等于或非常接近股价的期权。",
		],
		"C03",
	),
	entry(
		"intrinsic-value",
		["Intrinsic value", "内在价值"],
		["intrinsic value"],
		["内在价值"],
		[
			"What an option would be worth if used right now: how far it is in the money, never below zero.",
			"期权此刻行权时的价值：它处于实值的幅度，最低为零。",
		],
		"C03",
	),
	entry(
		"time-value",
		["Time value", "时间价值"],
		["time value"],
		["时间价值"],
		[
			"The part of an option's price above its intrinsic value. It shrinks as expiry nears.",
			"期权价格中超出内在价值的部分。越接近到期越少。",
		],
		"C03",
	),
	entry(
		"break-even",
		["Break-even", "盈亏平衡点"],
		["break-evens", "break-even", "breakeven"],
		["盈亏平衡点"],
		[
			"The stock price at expiry where a position neither makes nor loses money, counting what was paid or received.",
			"到期时让持仓不赚不亏的股价，已计入付出或收到的金额。",
		],
		"C03",
	),
	entry(
		"exercise",
		["Exercise", "行权"],
		["exercising", "exercised", "exercises", "exercise"],
		["行权"],
		[
			"Using an option's right: buying (a call) or selling (a put) the underlying at the strike.",
			"使用期权的权利：按行权价买入（看涨）或卖出（看跌）标的。",
		],
		"C09",
	),
	entry(
		"assignment",
		["Assignment", "指派"],
		["assignment", "assigned"],
		["指派"],
		[
			"The notice telling a writer to fulfil the obligation because a holder exercised.",
			"因持有人行权而通知义务方履行义务。",
		],
		"C09",
	),
	entry(
		"writer",
		["Writer", "义务方"],
		["writers", "writer"],
		["义务方"],
		[
			"The seller of an option. The writer receives the premium and must deliver or buy if the holder exercises.",
			"期权的卖方。义务方收取权利金，并在持有人行权时必须交付或买入。",
		],
		"C09",
	),
	entry(
		"holder",
		["Holder", "持有人"],
		["holders", "holder"],
		["持有人"],
		[
			"The buyer of an option, who owns the right and decides whether to use it.",
			"期权的买方，拥有权利并决定是否使用。",
		],
		"C09",
	),
	entry(
		"multiplier",
		["Multiplier", "乘数"],
		["multiplier"],
		["乘数"],
		[
			"How many shares one contract covers, set by the contract's terms.",
			"一张合约对应多少股，由合约条款规定。",
		],
		"C02",
	),
	entry(
		"aggressor",
		["Aggressor", "主动方"],
		["aggressor"],
		["主动方"],
		[
			"The side whose incoming order traded against a resting order, asking for an immediate fill.",
			"以主动订单与挂单成交、要求立即成交的一方。",
		],
		"C05",
	),
	entry(
		"limit-order",
		["Limit order", "限价单"],
		["limit orders", "limit order"],
		["限价单"],
		[
			"An order with a price limit: it never trades at a worse price than the one you set.",
			"带价格限制的订单：绝不会以比你设定的更差的价格成交。",
		],
		"C04",
	),
	entry(
		"market-order",
		["Market order", "市价单"],
		["market orders", "market order"],
		["市价单"],
		[
			"An order to trade right away at the best price available, with no price limit.",
			"按当前可得的最优价格立即成交、没有价格限制的订单。",
		],
		"C04",
	),
	entry(
		"midpoint",
		["Midpoint", "中点"],
		["midpoint"],
		["中点"],
		[
			"The average of the bid and the ask. It is a reference price, not a price anyone has offered.",
			"买价与卖价的平均值。它是参考价格，不是有人报出的价格。",
		],
		"C04",
	),
	entry(
		"nbbo",
		["NBBO", "NBBO"],
		["NBBO"],
		["NBBO"],
		[
			"National best bid and offer: the highest bid and lowest ask across all venues at one moment.",
			"全国最优买卖报价：同一时刻所有交易场所中最高的买价和最低的卖价。",
		],
		"C04",
	),
	entry(
		"sweep",
		["Sweep", "扫单"],
		["sweeps", "sweep"],
		["扫单"],
		[
			"One order sent to several venues at once so it fills quickly.",
			"为尽快成交而同时发往多个交易场所的一张订单。",
		],
		"C11",
	),
	entry(
		"relative-volume",
		["Relative volume", "相对成交量"],
		["relative volume"],
		["相对成交量"],
		[
			"Activity measured against the contract's own normal level, rather than in raw contracts.",
			"以合约自身的正常水平衡量的活跃度，而不是原始张数。",
		],
		"C12",
	),
	entry(
		"share-equivalents",
		["Share-equivalents", "股等价"],
		["share-equivalents", "share-equivalent"],
		["股等价"],
		[
			"An option position expressed as the number of shares that would move about the same for a small stock move.",
			"把期权持仓表示为：小幅变动时价值变化大致相同的股票数量。",
		],
		"C17",
	),
	entry(
		"gex",
		["Gamma exposure (GEX)", "Gamma 敞口（GEX）"],
		["gamma exposure", "GEX"],
		["GEX"],
		[
			"A model's estimate of the hedging a stock move would require, under an assumed dealer position.",
			"在假设的做市商持仓下，模型对股价变动所需对冲量的估计。",
		],
		"C19",
	),
	entry(
		"expected-move",
		["Expected move", "预期变动"],
		["expected move"],
		["预期变动"],
		[
			"The one-standard-deviation price range that options imply to an expiry, under a pricing model.",
			"在定价模型下，期权隐含的到某个到期日的一个标准差价格区间。",
		],
		"C41",
	),
	entry(
		"skew",
		["Skew", "偏斜"],
		["skew"],
		["偏斜"],
		[
			"The difference in implied volatility between puts and calls the same distance from the money, quoted with a stated sign.",
			"与平值距离相同的看跌与看涨之间的隐含波动率之差，按约定的符号报价。",
		],
		"C15",
	),
	entry(
		"zero-dte",
		["0DTE", "0DTE"],
		["0DTE"],
		["0DTE"],
		[
			"An option on its last day: zero days to expiry.",
			"处于最后一天的期权：距到期零天。",
		],
		"C42",
	),
	entry(
		"atr",
		["ATR", "ATR"],
		["ATR", "ATRs"],
		["ATR"],
		[
			"Average true range: the stock's typical daily price range over a stated window.",
			"平均真实波幅：股票在指定窗口内的典型日波动幅度。",
		],
		"C21",
	),
	entry(
		"max-pain",
		["Max pain", "最大痛点"],
		["max pain"],
		["最大痛点"],
		[
			"The expiry price at which today's open interest would pay option holders the least in total.",
			"按今天的未平仓量，期权持有人总共获得支付最少的到期价格。",
		],
		"C21",
	),
	entry(
		"drawdown",
		["Drawdown", "回撤"],
		["drawdowns", "drawdown"],
		["回撤"],
		[
			"A fall in account value from a peak to a later low, before it recovers.",
			"账户价值从高点跌到之后低点的幅度，在回升之前。",
		],
		"C29",
	),
	entry(
		"profit-factor",
		["Profit factor", "盈利因子"],
		["profit factor"],
		["盈利因子", "盈亏比"],
		[
			"Gross gains from winning trades divided by gross losses from losing ones.",
			"盈利交易的总收益除以亏损交易的总亏损。",
		],
		"C29",
	),
	entry(
		"fifo",
		["First in, first out", "先进先出"],
		["first in, first out", "FIFO"],
		["先进先出"],
		[
			"A rule that matches a sale to the oldest shares or contracts bought first.",
			"把卖出对应到最早买入的股票或合约的规则。",
		],
		"C28",
	),
];
