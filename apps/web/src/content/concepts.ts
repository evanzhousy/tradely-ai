/**
 * The concept register: what each concept code on a lesson in `syllabus.ts` means.
 *
 * A concept is one idea the course teaches and checks. Its `evidence` lists what a learner
 * who holds it can do, in the terms the lessons use. A `hard` prerequisite must be taught by
 * the same lesson or by one of its prerequisite lessons; a `soft` one helps but is not
 * required. `pnpm check-concepts` verifies both against the syllabus.
 */

export type ConceptText = { en: string; zh: string };

export const conceptIds = [
	"C01",
	"C02",
	"C03",
	"C04",
	"C05",
	"C06",
	"C07",
	"C08",
	"C09",
	"C10",
	"C11",
	"C12",
	"C13",
	"C14",
	"C15",
	"C16",
	"C17",
	"C18",
	"C19",
	"C20",
	"C21",
	"C22",
	"C23",
	"C24",
	"C25",
	"C26",
	"C27",
	"C28",
	"C29",
	"C30",
	"C31",
	"C32",
	"C33",
	"C34",
	"C35",
	"C36",
	"C37",
	"C38",
	"C39",
	"C40",
	"C41",
	"C42",
] as const;
export type ConceptId = (typeof conceptIds)[number];

export type ConceptPrerequisite = {
	id: ConceptId;
	/** `hard`: taught by the lesson or one it builds on. `soft`: helpful, not required. */
	strength: "hard" | "soft";
	reason: ConceptText;
};

export type Concept = {
	id: ConceptId;
	name: ConceptText;
	description: ConceptText;
	/** Observable criteria: what a learner who holds the concept can do. */
	evidence: readonly ConceptText[];
	prerequisites: readonly ConceptPrerequisite[];
};

const t = (en: string, zh: string): ConceptText => ({ en, zh });
const needs = (
	id: ConceptId,
	strength: ConceptPrerequisite["strength"],
	en: string,
	zh: string,
): ConceptPrerequisite => ({ id, strength, reason: t(en, zh) });

export const concepts: Record<ConceptId, Concept> = {
	C01: {
		id: "C01",
		name: t("Instruments and tickers", "标的与代码"),
		description: t(
			"A ticker names one instrument, and a stock, an ETF and an index are different kinds of instrument: shares you can own, a fund that trades like a share, and a number that is not traded directly. An option's underlying, and every row in a comparison, must be identified before its numbers mean anything.",
			"一个代码只指向一个标的；股票、ETF 与指数是三种不同的东西：可以持有的股份、像股票一样交易的基金，以及本身不能直接交易的一个数字。期权的标的和比较中的每一行，都必须先确认身份，数字才有意义。",
		),
		evidence: [
			t(
				"Tell a stock from an ETF and from an index, and say which of them can be owned or traded directly",
				"分清股票、ETF 与指数，并说出哪些可以直接持有或交易",
			),
			t(
				"Name the instrument a quote, a contract or a ranked row refers to before using its numbers",
				"在使用报价、合约或排名行的数字之前，先说出它所指的标的",
			),
			t(
				"Work out the value of a share position from shares held and the current price",
				"由持有的股数与当前价格算出股票持仓的价值",
			),
		],
		prerequisites: [],
	},
	C02: {
		id: "C02",
		name: t("Option contract terms", "期权合约要素"),
		description: t(
			"An option contract is identified by its underlying, its type (call or put), its strike and its expiry, with a stated multiplier, usually 100 shares. A call is the right to buy and a put the right to sell at the strike until expiry; the contract's terms, not anyone's view, decide what happens at exercise, assignment and settlement.",
			"一份期权合约由标的、类型（看涨或看跌）、行权价与到期日确定，并带有约定的乘数，通常为 100 股。看涨是在到期前按行权价买入的权利，看跌是按行权价卖出的权利；行权、指派与结算的结果由合约条款决定，而不是由任何人的看法决定。",
		),
		evidence: [
			t(
				"Identify a contract from its underlying, type, strike and expiry, and state its multiplier",
				"从标的、类型、行权价与到期日识别一份合约，并说出它的乘数",
			),
			t(
				"State what a call and a put each give the holder the right to do",
				"说出看涨与看跌分别赋予持有人什么权利",
			),
			t(
				"Follow a contract through expiry under its stated settlement rule, physical or cash",
				"按合约规定的交割方式（实物或现金）跟随它走到到期",
			),
		],
		prerequisites: [
			needs(
				"C01",
				"hard",
				"A contract is named by its underlying before anything else about it.",
				"合约首先由其标的来命名。",
			),
		],
	},
	C03: {
		id: "C03",
		name: t("Premium, payoff and profit", "权利金、到期价值与盈亏"),
		description: t(
			"Premium is quoted per share and paid per contract, so a $3 quote costs $300 at a 100 multiplier. Moneyness compares the strike with the underlying's price; payoff at expiry is what the contract is worth then, and profit subtracts what was paid or adds what was received, so an in-the-money option can still lose and a writer's result mirrors the holder's.",
			"权利金按每股报价、按每张合约支付：乘数 100 时，报价 $3 的成本是 $300。实值、平值、虚值比较的是行权价与标的价格；到期价值是合约在到期时值多少，盈亏则再减去付出的或加上收到的权利金，所以实值期权仍可能亏损，义务方的结果是持有人的镜像。",
		),
		evidence: [
			t(
				"Compute a contract's premium in dollars from its quoted price and multiplier",
				"由报价与乘数算出一张合约的权利金金额",
			),
			t(
				"Classify a call or put as in, at or out of the money against the underlying's price",
				"对照标的价格判断看涨或看跌处于实值、平值还是虚值",
			),
			t(
				"Compute payoff, profit and break-even at expiry for the holder and for the writer",
				"分别为持有人与义务方算出到期价值、盈亏与盈亏平衡点",
			),
		],
		prerequisites: [
			needs(
				"C02",
				"hard",
				"Payoff and moneyness are computed from the strike, the right and the multiplier.",
				"到期价值与实值程度由行权价、权利类型与乘数算出。",
			),
		],
	},
	C04: {
		id: "C04",
		name: t("Quotes, orders and trades", "报价、订单与成交"),
		description: t(
			"A quote advertises the best bid and ask with their displayed sizes; an order is an instruction; a trade is a completed execution at one price and time. Spread is ask minus bid and the midpoint their average, the last price can be older than the quote, and a market order takes the available price while a limit order sets a price and may rest unfilled.",
			"报价展示最优买价与卖价及其可见数量；订单是一条指令；成交是在某一价格和时刻完成的执行。价差等于卖价减买价，中点是两者的平均，最新价可能早于当前报价；市价单接受可得的价格，限价单设定价格，可能挂着不成交。",
		),
		evidence: [
			t(
				"Read bid, ask, sizes, spread, midpoint and last from a quote, and say why you buy at the ask and sell at the bid",
				"从报价读出买价、卖价、数量、价差、中点与最新价，并解释为何按卖价买入、按买价卖出",
			),
			t(
				"Tell a quote update or a cancellation from a trade",
				"区分报价变动或撤单与一笔成交",
			),
			t(
				"Choose between a market order and a limit order for a stated goal, and say what each guarantees",
				"为给定目标在市价单与限价单之间选择，并说出各自保证什么",
			),
		],
		prerequisites: [
			needs(
				"C01",
				"soft",
				"A quote belongs to one identified instrument.",
				"一份报价属于一个已确认身份的标的。",
			),
		],
	},
	C05: {
		id: "C05",
		name: t("Counterparties and matching", "交易对手与撮合"),
		description: t(
			"Every trade has a buyer and a seller, and one of them, the aggressor, demanded immediate execution against the other's resting order. An incoming buyer who takes the offer buys at the ask while the resting seller sells there: one trade, counted once. A limit order can rest or execute if marketable, and a large order may fill only partly.",
			"每笔成交都有买方和卖方，其中主动方要求立即与对方的挂单成交。主动买方接受卖价时买在卖价，挂单卖方也在同一价格卖出：一笔成交，只计一次。限价单可以挂着，也可以在价格可成交时立即执行；大单可能只部分成交。",
		),
		evidence: [
			t(
				"Identify the aggressor and the resting party in a trade from the order that arrived and the quote it met",
				"由到达的订单与它遇到的报价，指出一笔成交中的主动方与挂单方",
			),
			t(
				"Follow a limit order through a partial fill and say what rests on the book afterwards",
				"跟随一张限价单部分成交，并说出之后簿上还挂着什么",
			),
			t(
				"Explain why one print is not a separate buy event and sell event",
				"解释为何一笔成交不是一个买入事件加一个卖出事件",
			),
		],
		prerequisites: [
			needs(
				"C04",
				"hard",
				"An aggressor executes against the bid or the ask of a resting quote.",
				"主动方是与挂单报价的买价或卖价成交的。",
			),
		],
	},
	C06: {
		id: "C06",
		name: t("Execution side", "成交位置"),
		description: t(
			"Execution side locates a print against the quote that was valid at the same moment: above the ask, at the ask, inside the spread, at the bid or below the bid. It can suggest the likely aggressor; it cannot show who traded, why, or whether they opened or closed. If the quote is stale, missing, locked or crossed, keep the price and withhold the side.",
			"成交位置是成交价相对同一时刻有效报价的位置：高于卖价、等于卖价、价差内、等于买价或低于买价。它可以提示可能的主动方，却不能说明谁交易、为何交易、是开仓还是平仓。报价过时、缺失、锁定或交叉时，保留成交价，不判断位置。",
		),
		evidence: [
			t(
				"Classify prints as AASK, ASK, MID, BID or BBID against a time-matched quote",
				"对照时间匹配的报价，把成交分类为 AASK、ASK、MID、BID 或 BBID",
			),
			t(
				"Decide when a quote is too old or invalid to classify a print, and say what is still known",
				"判断报价何时过旧或无效、不能用于分类，并说出此时仍然已知的信息",
			),
			t(
				"State what a side label does and does not tell you about the trader",
				"说出成交位置标签能和不能说明交易者的什么",
			),
		],
		prerequisites: [
			needs(
				"C04",
				"hard",
				"A print is located against the bid and the ask.",
				"成交位置是相对买价与卖价确定的。",
			),
			needs(
				"C05",
				"soft",
				"The side can suggest which party was the aggressor.",
				"成交位置可以提示哪一方是主动方。",
			),
			needs(
				"C24",
				"soft",
				"The reference quote must be from the same moment as the print.",
				"参考报价必须来自与成交同一时刻。",
			),
		],
	},
	C07: {
		id: "C07",
		name: t("Sentiment classification", "情绪分类"),
		description: t(
			"A flow feed labels a trade bullish or bearish by a stated rule on its isolated leg: under this course's convention, call buying and put selling are bullish, call selling and put buying bearish, and an unknown side is neutral. The label describes the leg's directional effect, not the trader's belief, their whole position or a forecast.",
			"成交流数据按既定规则给一笔成交的单条腿贴上看涨或看跌标签：按本课程约定，买入看涨与卖出看跌为看涨，卖出看涨与买入看跌为看跌，方向未知则为中性。标签描述的是这条腿的方向性效果，不是交易者的看法、完整持仓或预测。",
		),
		evidence: [
			t(
				"Apply the four call/put, buy/sell classifications and the neutral case to prints with a known side",
				"对方向已知的成交应用看涨/看跌、买/卖的四种分类及中性情况",
			),
			t(
				"Net several trades' labels into one signed figure and say what that net does not show",
				"把多笔成交的标签合成一个带符号的净额，并说出它不能显示什么",
			),
			t(
				"Give a position in which a bullish-labelled trade is not a bullish bet",
				"举出一个持仓例子，其中被标为看涨的成交并不是看涨押注",
			),
		],
		prerequisites: [
			needs(
				"C06",
				"hard",
				"The label follows from where the leg printed against the quote.",
				"标签取决于这条腿相对报价的成交位置。",
			),
			needs(
				"C02",
				"hard",
				"The rule maps calls and puts differently.",
				"规则对看涨与看跌的映射不同。",
			),
		],
	},
	C08: {
		id: "C08",
		name: t("Volume and open interest", "成交量与未平仓量"),
		description: t(
			"Volume counts contracts traded in a session; open interest counts contracts still outstanding at a report time. A trade where both sides open raises open interest, both closing lowers it, and one opening while the other closes transfers the contract and leaves it unchanged, yet every trade adds to volume. Exercise, assignment and expiry also remove contracts, and open interest is reported with a lag.",
			"成交量统计一个交易时段内成交的合约张数；未平仓量统计在报告时刻仍然存在的合约。双方都开仓则未平仓量上升，双方都平仓则下降，一方开仓一方平仓则是转移、未平仓量不变，但每笔成交都计入成交量。行权、指派与到期也会减少合约，而未平仓量的报告有滞后。",
		),
		evidence: [
			t(
				"Work out the next report's open interest from a day's opening, closing and transferred trades",
				"由一天中的开仓、平仓与转移成交，算出下一次报告的未平仓量",
			),
			t(
				"Explain why a high-volume day can leave open interest unchanged",
				"解释为何成交量很大的一天未平仓量可能不变",
			),
			t(
				"Say which report date an open-interest figure belongs to before comparing it with volume",
				"在把未平仓量与成交量比较之前，说出该数字属于哪一个报告日期",
			),
		],
		prerequisites: [
			needs(
				"C02",
				"hard",
				"Both counts are in contracts of one identified series.",
				"两个数字都以同一合约系列的张数计。",
			),
			needs(
				"C09",
				"soft",
				"Opening and closing are what move open interest.",
				"开仓与平仓是改变未平仓量的原因。",
			),
			needs(
				"C24",
				"soft",
				"Open interest is true as of its report time, not the session's.",
				"未平仓量在其报告时刻成立，而不是在交易时段内。",
			),
		],
	},
	C09: {
		id: "C09",
		name: t("Positions and strategies", "持仓与策略"),
		description: t(
			"The holder of an option owns a right and the writer carries the matching obligation; buying or selling to open or to close changes a position, while exercising uses the right. A strategy combines legs, sometimes with shares: a covered call, a protective put, a spread, a collar or a roll each change what one option leg means, so a single print cannot reveal the position behind it.",
			"期权持有人拥有权利，义务方承担对应的义务；买入或卖出开仓、平仓改变持仓，行权则是使用权利。策略把多条腿组合起来，有时还包括股票：备兑看涨、保护性看跌、价差、领口与移仓都会改变单条期权腿的含义，所以单笔成交无法揭示背后的持仓。",
		),
		evidence: [
			t(
				"For a long or short call or put, say who holds the right and who carries the obligation",
				"对多头或空头的看涨或看跌，说出谁拥有权利、谁承担义务",
			),
			t(
				"Tell closing a position from exercising it, and buying to open from buying to close",
				"区分平仓与行权，以及买入开仓与买入平仓",
			),
			t(
				"Name two strategies in which the same short call leg carries different risk",
				"举出两种策略，其中同一条卖出看涨腿承担不同的风险",
			),
		],
		prerequisites: [
			needs(
				"C02",
				"hard",
				"A position is a long or short holding of one contract's rights or obligations.",
				"持仓是对一份合约的权利或义务的多头或空头。",
			),
		],
	},
	C10: {
		id: "C10",
		name: t("Trade records", "成交记录"),
		description: t(
			"A raw print is one reported execution; an aggregate row combines several prints under a stated grouping rule, so its size and premium are sums and its trade count records the prints behind it. A quantity-weighted price differs from a plain average, unlike contracts must not be pooled, and duplicate or corrected messages can change a feed without any new trade.",
			"一条原始成交是一次被报告的执行；汇总行按既定规则合并多条成交，其数量与权利金是求和，笔数记录背后的成交条数。按数量加权的价格不同于简单平均，不同合约不能混合汇总，重复与更正消息也会在没有新成交的情况下改变数据。",
		),
		evidence: [
			t(
				"Rebuild an aggregate row's size, premium and trade count from its source prints",
				"由原始成交还原汇总行的数量、权利金与笔数",
			),
			t(
				"Compute a quantity-weighted average price and say when it differs from the plain average",
				"计算按数量加权的均价，并说出它何时与简单平均不同",
			),
			t(
				"Follow a duplicate and a correction through a feed without counting new activity",
				"追踪一条重复消息和一条更正消息，不把它们算作新的成交",
			),
		],
		prerequisites: [
			needs(
				"C04",
				"hard",
				"A print is one completed trade at a price and time.",
				"一条成交记录是一笔在某个价格和时刻完成的交易。",
			),
			needs(
				"C03",
				"soft",
				"Premium sums use the per-share price and the multiplier.",
				"权利金的求和用到每股价格与乘数。",
			),
		],
	},
	C11: {
		id: "C11",
		name: t("Execution conditions", "成交条件"),
		description: t(
			"Execution conditions describe how a trade executed, not who traded or why. A sweep routes one order across several venues, printing each fill separately; a block is a large trade, often arranged away from the screen; a complex order prints several legs as one package. Each condition changes how price, size and side should be read, and leaves intent unknown.",
			"成交条件描述一笔成交是如何执行的，而不是谁在交易或为何交易。扫单把一张订单同时送到多个交易场所，每笔成交单独打印；大宗是一笔大额成交，常在屏幕之外协商；复杂订单把多条腿作为一个整体打印。每种条件都会改变价格、数量与方向的解读方式，而意图仍然未知。",
		),
		evidence: [
			t(
				"Tell a sweep, a block and a multi-leg package from their prints and conditions",
				"由成交及其条件区分扫单、大宗与多腿整体",
			),
			t(
				"Compute a sweep's average price across its fills",
				"由扫单的各笔成交算出它的平均价格",
			),
			t(
				"Say what a condition code leaves unknown about the order behind it",
				"说出一个条件代码对背后订单仍未说明的部分",
			),
		],
		prerequisites: [
			needs(
				"C10",
				"hard",
				"Conditions are attached to trade records and change how they are read.",
				"成交条件附在成交记录上，并改变读法。",
			),
			needs(
				"C04",
				"soft",
				"A sweep's later fills are read against the displayed quote.",
				"扫单后面的成交要对照显示的报价来读。",
			),
		],
	},
	C12: {
		id: "C12",
		name: t("Relative activity and baselines", "相对活跃度与基准"),
		description: t(
			"Unusual means relative to a baseline, not large. Relative volume compares today with a typical past session and volume over open interest compares activity with outstanding contracts; their denominators answer different questions. A tiny denominator or a partial session can turn an ordinary number into a fake spike, and the metric should be chosen for the question before anything is ranked.",
			"异常是相对于基准而言，不等于数量大。相对成交量把今天与历史典型时段比较，成交量/未平仓量把活跃度与存量合约比较，两者的分母回答不同的问题。极小的分母或不完整的交易时段会把普通数字变成假异常；在排名之前，应先按问题选择指标。",
		),
		evidence: [
			t(
				"Compute relative volume and volume over open interest for a contract, and say what each compares",
				"为一张合约计算相对成交量与成交量/未平仓量，并说出各自比较的是什么",
			),
			t(
				"Show how a near-zero denominator or a partial session fakes a spike",
				"演示接近零的分母或不完整的时段如何制造假异常",
			),
			t(
				"Choose between raw size and baseline-normalised activity for a stated question",
				"为给定问题在原始规模与按基准标准化的活跃度之间做出选择",
			),
		],
		prerequisites: [
			needs(
				"C08",
				"hard",
				"Volume and open interest are the numerators and denominators.",
				"成交量与未平仓量是其中的分子与分母。",
			),
			needs(
				"C25",
				"soft",
				"A baseline is a comparable past period.",
				"基准是一段可比的历史时段。",
			),
		],
	},
	C13: {
		id: "C13",
		name: t("Option Greeks", "期权希腊值"),
		description: t(
			"Delta, gamma, theta, vega and rho are model sensitivities to one input at a time, each in its own units and with a sign that belongs to the position. Delta approximates the price change for a small move, gamma how delta itself changes, theta the daily cost of time, vega the change per volatility point and rho per rate point; together they explain how an option can lose while the stock moves the right way.",
			"Delta、Gamma、Theta、Vega 与 Rho 是模型对单一输入的敏感度，各有自己的单位，符号归属于持仓。Delta 近似小幅变动时的价格变化，Gamma 是 Delta 自身的变化，Theta 是每天的时间成本，Vega 是每个波动率点的变化，Rho 是每个利率点的变化；它们合起来解释了为何股价朝有利方向变动时期权仍可能亏钱。",
		),
		evidence: [
			t(
				"Estimate an option's price change for a small stock move from its delta, with the right sign for the position",
				"由 Delta 估算标的小幅变动时期权的价格变化，并给出持仓的正确符号",
			),
			t(
				"Update delta after a move using gamma, and say what that means for a hedge",
				"用 Gamma 更新变动后的 Delta，并说出这对对冲意味着什么",
			),
			t(
				"Read theta, vega and rho in their stated units and show how they can outweigh a favourable move",
				"按规定单位读取 Theta、Vega 与 Rho，并演示它们如何抵消有利的价格变动",
			),
		],
		prerequisites: [
			needs(
				"C03",
				"hard",
				"A Greek is a sensitivity of the premium.",
				"希腊值是权利金的敏感度。",
			),
		],
	},
	C14: {
		id: "C14",
		name: t("Implied and realized volatility", "隐含与已实现波动率"),
		description: t(
			"Implied volatility is inferred from an option's price through a pricing model and looks forward; realized volatility is computed from past returns over a stated window and looks back. Neither is observed future volatility. Comparing them needs matching windows and annualisation, and a change of three vol points is not a 3 % relative change.",
			"隐含波动率由期权价格通过定价模型反推，面向未来；已实现波动率由指定窗口内的历史收益算出，面向过去。两者都不是已观测到的未来波动率。比较它们需要匹配的窗口与年化方式；三个波动率点的变化不是 3% 的相对变化。",
		),
		evidence: [
			t(
				"Tell the volatility priced into options from the volatility the stock showed, and name which is a model input",
				"区分期权价格中隐含的波动率与股票实际表现出的波动率，并指出哪一个是模型输入",
			),
			t(
				"State the window and annualisation behind an IV30 or RV20 figure before comparing them",
				"在比较 IV30 与 RV20 之前，说出各自背后的窗口与年化方式",
			),
			t(
				"Read a change in vol points without mistaking it for a percentage change",
				"读取以波动率点计的变化，不把它误当作百分比变化",
			),
		],
		prerequisites: [
			needs(
				"C13",
				"hard",
				"Vega and the pricing model give implied volatility its meaning.",
				"Vega 与定价模型赋予隐含波动率意义。",
			),
		],
	},
	C15: {
		id: "C15",
		name: t("Volatility surface", "波动率曲面"),
		description: t(
			"A smile is implied volatility across strikes at one expiry, term structure is implied volatility across expiries at a comparable point, and the surface joins them. Skew and risk reversal are differences between wings with a sign convention that must be stated, and some cells are measured from quotes while others are fitted or empty.",
			"微笑是同一到期日上不同行权价的隐含波动率，期限结构是可比位置上不同到期日的隐含波动率，曲面把两者连在一起。偏斜与风险逆转是两翼之差，其符号约定必须说明；曲面上有的点来自实际报价，有的是拟合或空缺。",
		),
		evidence: [
			t(
				"Read implied volatility across strikes and across expiries from a surface",
				"从曲面上按行权价与到期日读取隐含波动率",
			),
			t(
				"Compute a 25-delta skew under a stated sign convention and say how a risk reversal relates to it",
				"按给定符号约定计算 25-delta 偏斜，并说出风险逆转与它的关系",
			),
			t(
				"Tell a measured point from a fitted or missing one before using it",
				"在使用之前区分实际观测点与拟合或缺失的点",
			),
		],
		prerequisites: [
			needs(
				"C14",
				"hard",
				"The surface is implied volatility laid out by strike and expiry.",
				"曲面是按行权价与到期日排开的隐含波动率。",
			),
		],
	},
	C16: {
		id: "C16",
		name: t("IV rank and percentile", "IV Rank 与百分位"),
		description: t(
			"IV rank places today's implied volatility within its historical low-to-high range; IV percentile counts the share of past observations below today. Both need the same IV reference, a stated history window and a tie rule, and a single extreme day can lower the rank without changing the percentile.",
			"IV Rank 把今天的隐含波动率放在历史最低到最高的区间中定位；IV 百分位统计历史观测中低于今天的比例。两者需要相同的 IV 参考、明确的历史窗口与并列规则；一个极端值可以压低 Rank，却不改变百分位。",
		),
		evidence: [
			t(
				"Compute IV rank and IV percentile on the same short history",
				"在同一段简短历史上计算 IV Rank 与 IV 百分位",
			),
			t(
				"Explain, with one outlier, why the two can disagree",
				"用一个极端值解释两者为何会分歧",
			),
			t(
				"State the history window and tie rule a published figure depends on",
				"说出一个公布数字所依赖的历史窗口与并列规则",
			),
		],
		prerequisites: [
			needs(
				"C14",
				"hard",
				"Both statistics are computed on an implied volatility history.",
				"两个统计量都在隐含波动率的历史上计算。",
			),
			needs(
				"C25",
				"soft",
				"The history window is a baseline choice.",
				"历史窗口是一种基准选择。",
			),
		],
	},
	C17: {
		id: "C17",
		name: t("Delta-equivalent flow", "Delta 等价成交流"),
		description: t(
			"A trade's delta-equivalent magnitude is its delta times contracts times the multiplier, in share-equivalents. Signing each trade by its sentiment label and summing gives net DEX: classified flow in a common unit, not the dealer's inventory or anyone's whole portfolio, and neutral trades stay in coverage while leaving the directional net.",
			"一笔成交的 Delta 等价量等于 Delta × 张数 × 乘数，以股等价计。按情绪标签给每笔成交加上符号再求和，就得到净 DEX：以统一单位衡量的已分类成交流，不是做市商的库存，也不是任何人的完整持仓；中性成交保留在覆盖范围内，但不计入方向净额。",
		),
		evidence: [
			t(
				"Convert a trade into share-equivalents from its delta, contract count and multiplier",
				"由 Delta、张数与乘数把一笔成交换算成股等价量",
			),
			t(
				"Sign and sum several trades into net DEX, keeping neutral trades out of the net",
				"给多笔成交加符号并求和得到净 DEX，中性成交不计入净额",
			),
			t(
				"Say what net DEX measures and what it does not",
				"说出净 DEX 衡量什么、不衡量什么",
			),
		],
		prerequisites: [
			needs(
				"C13",
				"hard",
				"Share-equivalents come from each trade's delta.",
				"股等价量来自每笔成交的 Delta。",
			),
			needs(
				"C07",
				"hard",
				"Each trade is signed by its sentiment label.",
				"每笔成交由其情绪标签决定符号。",
			),
		],
	},
	C18: {
		id: "C18",
		name: t("Normalised exposure (DEI)", "标准化敞口（DEI）"),
		description: t(
			"Share-equivalent flow is only comparable across stocks of different sizes once it is normalised. DEI is the size of net DEX divided by a typical share volume for the name, times 100; direction stays in net DEX. Index proxies need an explicit scale, a change in open interest can serve as the numerator instead of the tape, and a missing denominator leaves the figure unavailable rather than zero.",
			"股等价成交流只有在标准化之后才能在规模不同的股票之间比较。DEI 等于净 DEX 的绝对值除以该标的的典型股票成交量再乘以 100；方向留在净 DEX 中。指数替代物需要明确的尺度，未平仓量的变化可以取代成交记录成为分子，分母缺失时数字不可用，而不是零。",
		),
		evidence: [
			t(
				"Compute DEI from net DEX and a stated typical share volume",
				"由净 DEX 与给定的典型股票成交量算出 DEI",
			),
			t(
				"Compare flow across two stocks of different sizes and say why the raw share-equivalents mislead",
				"比较两只规模不同股票的成交流，并说出为何原始股等价量会误导",
			),
			t(
				"Tell a tape-based numerator from an open-interest-change numerator, and report a missing denominator as unavailable",
				"区分基于成交记录的分子与基于未平仓量变化的分子，并把缺失的分母报告为不可用",
			),
		],
		prerequisites: [
			needs(
				"C17",
				"hard",
				"DEI normalises net DEX.",
				"DEI 是对净 DEX 的标准化。",
			),
			needs(
				"C08",
				"hard",
				"A change in open interest can replace the tape as the numerator.",
				"未平仓量的变化可以替代成交记录成为分子。",
			),
			needs(
				"C12",
				"soft",
				"Normalising by a typical volume is the same idea as relative volume.",
				"按典型成交量标准化与相对成交量是同一思路。",
			),
		],
	},
	C19: {
		id: "C19",
		name: t("Gamma exposure snapshot (GEX)", "Gamma 敞口快照（GEX）"),
		description: t(
			"A GEX snapshot combines each contract's gamma with its open interest, the multiplier, spot and an assumed position sign to estimate how much hedging a 1 % move would require. Open interest counts contracts, not dealer ownership, so the sign convention and scaling are assumptions that travel with the result, and net, gross and per-strike totals answer different questions.",
			"GEX 快照把每张合约的 Gamma 与未平仓量、乘数、标的价格以及假定的持仓符号结合起来，估算标的变动 1% 需要多少对冲。未平仓量统计的是合约张数而非做市商的持仓，所以符号约定与缩放方式是随结果一同携带的假设；净值、总幅度与单个行权价的合计回答不同的问题。",
		),
		evidence: [
			t(
				"Build one strike's GEX from gamma, open interest, multiplier, spot and a stated sign convention",
				"由 Gamma、未平仓量、乘数、标的价格与给定符号约定算出单个行权价的 GEX",
			),
			t(
				"Compare net, gross and local exposure and say what each hides",
				"比较净敞口、总敞口与局部敞口，并说出各自掩盖了什么",
			),
			t(
				"Name the assumptions and the chain coverage a snapshot depends on",
				"说出一份快照所依赖的假设与期权链覆盖范围",
			),
		],
		prerequisites: [
			needs(
				"C13",
				"hard",
				"Gamma per contract is the input.",
				"每张合约的 Gamma 是输入。",
			),
			needs(
				"C08",
				"hard",
				"Open interest supplies the contract counts.",
				"未平仓量提供合约张数。",
			),
			needs(
				"C24",
				"soft",
				"A snapshot is true as of its chain and open-interest dates.",
				"快照在其期权链与未平仓量的日期上成立。",
			),
		],
	},
	C20: {
		id: "C20",
		name: t("Gamma regimes and hedging", "Gamma 状态与对冲"),
		description: t(
			"Under continuous hedging, a long-gamma position sells after a rise and buys after a fall, while a short-gamma position does the opposite, so the sign of modelled gamma around spot describes the direction of hedging flow. The zero-gamma level is where that sign flips. All of it is conditional on the assumed positions and hedge objective; it is not a forecast or a record of actual trades.",
			"在持续对冲下，多 Gamma 持仓在上涨后卖出、下跌后买入，空 Gamma 持仓则相反，所以标的价格附近模型 Gamma 的符号描述了对冲流的方向。零 Gamma 位置是符号翻转的地方。这一切都以假定的持仓与对冲目标为条件，不是预测，也不是实际成交记录。",
		),
		evidence: [
			t(
				"State the direction of the hedge after a rise and after a fall on each side of the zero-gamma level",
				"说出在零 Gamma 位置两侧，上涨后与下跌后的对冲方向",
			),
			t(
				"Explain a flip of the regime as a repricing of the same positions, not a forecast",
				"把 Gamma 状态的翻转解释为同一持仓的重新定价，而不是预测",
			),
			t(
				"List the assumptions a regime statement depends on",
				"列出一个 Gamma 状态结论所依赖的假设",
			),
		],
		prerequisites: [
			needs(
				"C19",
				"hard",
				"A regime is the sign of modelled gamma around spot.",
				"Gamma 状态是标的价格附近模型 Gamma 的符号。",
			),
		],
	},
	C21: {
		id: "C21",
		name: t("Structural levels", "结构位置"),
		description: t(
			"A gamma wall is the strike where a stated exposure rule concentrates; max pain is the expiry price that minimises an open-interest-only payout calculation. They are reference levels computed from a chosen expiry scope and spot, not targets or guaranteed pins, and distance to them should be measured in dollars, percent and ATR together.",
			"Gamma 墙位是按既定敞口规则最集中的行权价；最大痛点是让仅按未平仓量计算的到期支付最小的价格。它们是在选定的到期范围与标的价格下算出的参考位置，不是目标，也不保证钉住；到它们的距离应同时用美元、百分比与 ATR 衡量。",
		),
		evidence: [
			t(
				"Tell a gamma-weighted wall from OI-only max pain and say which inputs each uses",
				"区分 Gamma 加权的墙位与仅按未平仓量的最大痛点，并说出各自使用的输入",
			),
			t(
				"Measure the distance from spot to a level in dollars, percent and ATR",
				"用美元、百分比与 ATR 衡量标的到某个位置的距离",
			),
			t(
				"Keep the expiry scope and spot date attached when quoting a level",
				"引用一个位置时保留其到期范围与标的价格日期",
			),
		],
		prerequisites: [
			needs(
				"C19",
				"hard",
				"Walls are strikes where modelled exposure concentrates.",
				"墙位是模型敞口集中的行权价。",
			),
			needs(
				"C08",
				"soft",
				"Max pain is computed from open interest alone.",
				"最大痛点仅由未平仓量算出。",
			),
		],
	},
	C22: {
		id: "C22",
		name: t("Charm and vanna", "Charm 与 Vanna"),
		description: t(
			"Delta changes without any trade: charm is delta's sensitivity to the passage of time and vanna its sensitivity to implied volatility. Vendors quote them with different signs and scales, so read whether time means elapsed or remaining, then multiply per-unit changes by position size to see how a hedge drifts overnight or after a volatility move.",
			"即使没有任何成交，Delta 也会变化：Charm 是 Delta 对时间流逝的敏感度，Vanna 是它对隐含波动率的敏感度。供应商给出的符号与尺度不同，所以要先看清时间指的是已经过去的还是剩余的，再把单位变化乘以持仓规模，看对冲如何在隔夜或波动率变动后漂移。",
		),
		evidence: [
			t(
				"Separate the delta change due to time from the change due to volatility for a stated position",
				"对给定持仓区分由时间引起与由波动率引起的 Delta 变化",
			),
			t(
				"Scale per-day and per-vol-point changes to a position and state the sign convention used",
				"把每天与每个波动率点的变化换算到持仓规模，并说明所用的符号约定",
			),
			t(
				"Explain why a hedged book needs adjusting after a quiet night",
				"解释为何已对冲的账簿在平静的一夜之后仍需调整",
			),
		],
		prerequisites: [
			needs(
				"C13",
				"hard",
				"Charm and vanna are sensitivities of delta.",
				"Charm 与 Vanna 是 Delta 的敏感度。",
			),
		],
	},
	C23: {
		id: "C23",
		name: t("Comparison scope", "比较范围"),
		description: t(
			"A comparison universe is a declared set of eligible observations, derived from source facts such as instrument identity, selected session, coverage and a liquidity floor, with the intended population kept apart from what was actually observed. Ranking sorts that scope under one metric to prioritise attention, not to predict; a contract neighbourhood applies the same discipline across strikes and expiries, keeping total activity and concentration separate.",
			"比较范围是一组声明过的合格观测，依据标的身份、所选时段、覆盖与流动性门槛等原始事实得出，并把预期的总体与实际观测到的子集分开。排名在该范围内按一个指标排序，用来分配注意力而不是预测；合约邻域把同样的纪律应用到行权价与到期日上，并把总成交与集中度分开来看。",
		),
		evidence: [
			t(
				"Decide from raw facts which names belong in a comparison and record the exclusions, keeping missing ones visible",
				"依据原始事实决定哪些标的进入比较并记录排除项，让缺失项保持可见",
			),
			t(
				"Choose a ranking metric and scope for a question, and explain how peers can move a rank without new activity",
				"为问题选择排名指标与范围，并解释同组变化如何在没有新成交时改变排名",
			),
			t(
				"Compare total activity with concentration across strikes and expiries before promoting a contract",
				"在推选一张合约之前，比较不同行权价与到期日的总成交与集中度",
			),
		],
		prerequisites: [
			needs(
				"C26",
				"hard",
				"The question decides who belongs in the comparison.",
				"问题决定谁属于比较范围。",
			),
			needs(
				"C24",
				"soft",
				"Eligibility includes coverage and session.",
				"合格条件包括覆盖与交易时段。",
			),
		],
	},
	C24: {
		id: "C24",
		name: t("Data clocks and coverage", "数据时钟与覆盖"),
		description: t(
			"Every field has a source, a time at which it was true, a unit and a coverage requirement. Event time differs from receipt time, a selected session from the latest one, and a missing value from zero; a quote, a trade, an open-interest report and a model may each sit on a different clock. Combine values only when their clocks and coverage make them comparable, and say so when they do not.",
			"每个字段都有来源、成立的时刻、单位与覆盖要求。事件时间不同于接收时间，所选时段不同于最新时段，缺失不同于零；报价、成交、未平仓量报告与模型可能各在不同的时钟上。只有在时钟与覆盖可比时才把数值合并，不可比时要明说。",
		),
		evidence: [
			t(
				"Give each field its source, timestamp, unit and coverage before combining it with another",
				"在把一个字段与另一个合并之前，说出它的来源、时间戳、单位与覆盖",
			),
			t(
				"Tell missing from zero, event time from receipt time, and a stale value from a current one",
				"区分缺失与零、事件时间与接收时间、过时值与当前值",
			),
			t(
				"Decide whether two values are contemporaneous enough to compare, and what to withhold when they are not",
				"判断两个数值在时间上是否足以比较，以及不可比时应保留哪些判断",
			),
		],
		prerequisites: [
			needs(
				"C01",
				"soft",
				"Each field is about one identified instrument.",
				"每个字段都关于一个已确认身份的标的。",
			),
		],
	},
	C25: {
		id: "C25",
		name: t("Baselines and comparable periods", "基准与可比时段"),
		description: t(
			"A baseline is built from complete, comparable periods using only what was known at the time, and the choice of window, calibration and recency weighting is part of the result. Compare whole sessions with whole sessions or a stated intraday window; freeze the rule before looking at outcomes, and keep a held-out period, because a threshold tuned after seeing a result is development, not evidence.",
			"基准由完整、可比的时段构成，只使用当时已知的信息；窗口、校准与近期加权的选择都是结果的一部分。要用完整时段比完整时段，或明确说明日内窗口；在查看结果之前冻结规则，并保留一段未看过的时期，因为看到结果之后再调的门槛是开发，不是证据。",
		),
		evidence: [
			t(
				"Build a baseline from comparable past sessions and say which window and weighting it uses",
				"由可比的历史时段建立基准，并说出它使用的窗口与加权方式",
			),
			t(
				"Spot a comparison that mixes a partial session with complete ones",
				"识别把不完整时段与完整时段混在一起的比较",
			),
			t(
				"Test a rule on a period not used to set it, and explain why tuning after the fact invalidates the test",
				"在未用于设定规则的时期上检验规则，并解释为何事后调参会使检验失效",
			),
		],
		prerequisites: [
			needs(
				"C24",
				"hard",
				"A comparable period is defined by its clock and coverage.",
				"可比时段由其时钟与覆盖定义。",
			),
		],
	},
	C26: {
		id: "C26",
		name: t("Research questions and evidence", "研究问题与证据"),
		description: t(
			"A research question names its subject, quantity, universe, time window and the evidence that would answer it, together with a reason to reconsider it. Observed facts, inferences and unknowns are kept apart at every step, so a reader can see which claims the evidence supports, which are drawn from it and which remain open.",
			"研究问题要写明对象、测量量、范围、时间窗口与能回答它的证据，并说明何时需要重新审视。每一步都把观测到的事实、推断与未知分开，让读者看清哪些结论有证据支持、哪些是由证据推出的、哪些仍然悬而未决。",
		),
		evidence: [
			t(
				"Write a question with an explicit subject, measure, universe and window, and the evidence that would answer it",
				"写出对象、测量量、范围与窗口都明确的问题，并指出能回答它的证据",
			),
			t(
				"Sort the statements in an analysis into fact, inference and unknown",
				"把一段分析中的陈述分为事实、推断与未知",
			),
			t(
				"State what would make you reconsider a finding, and find the first unsupported step in someone else's",
				"说出什么会让你重新审视一个结论，并在他人的分析中找出第一个没有证据支持的步骤",
			),
		],
		prerequisites: [
			needs(
				"C24",
				"hard",
				"Evidence has a time and a coverage before it can answer anything.",
				"证据要有时间与覆盖，才能回答问题。",
			),
		],
	},
	C27: {
		id: "C27",
		name: t(
			"Reproducible research and supported claims",
			"可重跑的研究与有据的结论",
		),
		description: t(
			"A research packet records the question, instruments, session cutoff, sources, units, transformations, exclusions and the rows actually used, so another person can rerun it and get the same result. A recap communicates only what the packet supports, with a traceable number behind every claim and an honest chart; an audit checks identity, units, time, coverage and inference, repairs the affected claims and keeps the ones that hold.",
			"研究包记录问题、标的、时段截止、来源、单位、变换、排除项与实际使用的数据行，让他人能够重跑并得到相同结果。复盘只陈述研究包能支持的内容，每个结论背后都有可追溯的数字和诚实的图表；审核检查身份、单位、时间、覆盖与推断，修复受影响的结论，保留成立的部分。",
		),
		evidence: [
			t(
				"Assemble a packet whose inputs, calculations and exclusions let someone else rerun the result",
				"组装一个输入、计算与排除项都足以让他人重跑的研究包",
			),
			t(
				"Write a headline, chart and caption that claim no more than the evidence supports",
				"撰写不超出证据支持范围的标题、图表与图注",
			),
			t(
				"Audit a recap claim by claim, fix the numerical and reasoning errors, and keep what holds up",
				"逐条审核一份复盘，修复数值与推理错误，并保留成立的部分",
			),
		],
		prerequisites: [
			needs(
				"C26",
				"hard",
				"A packet records the question and the evidence behind each claim.",
				"研究包记录问题以及每个结论背后的证据。",
			),
			needs(
				"C23",
				"hard",
				"The universe and exclusions are part of what is recorded.",
				"比较范围与排除项是记录内容的一部分。",
			),
			needs(
				"C25",
				"soft",
				"Baseline choices are recorded as method parameters.",
				"基准选择作为方法参数被记录。",
			),
		],
	},
	C28: {
		id: "C28",
		name: t("Positions, cost and P&L", "持仓、成本与盈亏"),
		description: t(
			"A position's market value is quantity times mark, unrealised P&L is quantity times mark minus cost, and realised P&L arises when a lot is closed under a stated matching rule such as FIFO, all before fees. A mark is a valuation, not a guaranteed exit price, and cash is a balance while buying power includes margin rules, so the two are not interchangeable.",
			"持仓的市值等于数量乘以估值价，未实现盈亏等于数量乘以估值价减成本，已实现盈亏在按既定匹配规则（如先进先出）平掉一批仓位时产生，以上都在扣除费用之前。估值价是一种估值，不是保证能成交的退出价；现金是余额，购买力包含保证金规则，两者不能互换。",
		),
		evidence: [
			t(
				"Compute position value and unrealised P&L from quantity, cost and mark",
				"由数量、成本与估值价算出持仓价值与未实现盈亏",
			),
			t(
				"Compute realised P&L for a closed lot under a stated matching rule, before and after fees",
				"按既定匹配规则算出一批平仓的已实现盈亏，费用前与费用后",
			),
			t(
				"Tell cash from buying power and a mark from an executable price",
				"区分现金与购买力，以及估值价与可成交价格",
			),
		],
		prerequisites: [
			needs(
				"C03",
				"hard",
				"Position value and P&L use premium, mark and the multiplier.",
				"持仓价值与盈亏用到权利金、估值价与乘数。",
			),
			needs(
				"C09",
				"hard",
				"P&L is kept per position and per lot.",
				"盈亏按持仓与批次记录。",
			),
		],
	},
	C29: {
		id: "C29",
		name: t("Performance measurement", "绩效衡量"),
		description: t(
			"Balance growth is not return: deposits and withdrawals must be separated from performance, which time-weighted return does. Win rate counts profitable closed trades and says nothing about size, so average win against average loss, profit factor (gross gains over gross losses) and drawdown are read together, and attribution shows which positions produced the result within the history actually covered.",
			"账户余额增长不等于收益：必须把存取款与绩效分开，时间加权收益率正是为此。胜率统计的是盈利的已平仓交易，不说明金额大小，所以要把平均盈利与平均亏损、盈利因子（总盈利除以总亏损）和回撤放在一起读，归因则在实际覆盖的历史范围内显示哪些持仓产生了结果。",
		),
		evidence: [
			t(
				"Take a deposit out of a period's return and compute the time-weighted return",
				"从一段时期的收益中剔除存款，并算出时间加权收益率",
			),
			t(
				"Compute the profit factor from gross gains and gross losses, and show how a high win rate can still lose money",
				"由总盈利与总亏损算出盈利因子，并演示高胜率为何仍可能亏钱",
			),
			t(
				"Read a drawdown from an equity path and say what it does and does not measure",
				"从净值曲线读出回撤，并说出它衡量什么、不衡量什么",
			),
		],
		prerequisites: [
			needs(
				"C28",
				"hard",
				"Performance is measured on realised and unrealised P&L.",
				"绩效在已实现与未实现盈亏上衡量。",
			),
		],
	},
	C30: {
		id: "C30",
		name: t("Portfolio exposure", "组合敞口"),
		description: t(
			"Portfolio exposure sums signed position contributions in consistent units at one time: a share contributes one delta, an option contributes its model sensitivity times signed contracts times the multiplier, and gamma, theta and vega each need their own scale. Net delta near zero can hide large gamma or volatility exposure, and positions without a model, or on another clock, must be shown as missing rather than as zero.",
			"组合敞口是在同一时刻、以一致单位对带符号的各持仓贡献求和：一股贡献一个 Delta，一张期权贡献模型敏感度乘以带符号的张数再乘以乘数，Gamma、Theta 与 Vega 各需自己的尺度。净 Delta 接近零可能掩盖很大的 Gamma 或波动率敞口；没有模型或处于另一时钟上的持仓必须标为缺失，而不是零。",
		),
		evidence: [
			t(
				"Add up a mixed portfolio's delta with the right signs and units",
				"用正确的符号与单位汇总一个混合组合的 Delta",
			),
			t(
				"Show how a delta-neutral book can still carry gamma, theta or vega exposure",
				"演示 Delta 中性的账簿为何仍可能带有 Gamma、Theta 或 Vega 敞口",
			),
			t(
				"Mark positions the aggregate cannot cover as missing, and evaluate a proposed hedge",
				"把汇总无法覆盖的持仓标为缺失，并评估一个拟议的对冲",
			),
		],
		prerequisites: [
			needs(
				"C28",
				"hard",
				"Exposure is summed over the same positions as P&L.",
				"敞口在与盈亏相同的持仓上求和。",
			),
			needs(
				"C13",
				"hard",
				"Each position contributes its Greeks.",
				"每个持仓贡献自己的希腊值。",
			),
		],
	},
	C31: {
		id: "C31",
		name: t("Recipes and sessions", "Recipe 与交易时段"),
		description: t(
			"A TradingFlow recipe is a report whose figures, tables and charts are bound to queries, so each run computes them for one trading session rather than storing numbers. A report opens on the latest completed U.S. session and can be rerun for an earlier one; its header names that session and the last-run time. Official recipes are fixed templates maintained by TradingFlow, the same for every paid account.",
			"TradingFlow 的 Recipe 是一份报告，其数字、表格与图表都绑定在查询上，所以每次运行都是针对一个交易时段计算，而不是存储数字。报告默认打开最近一个已完成的美股交易时段，也可以对更早的时段重跑；页眉写明该时段与上次运行时间。官方 Recipe 是由 TradingFlow 维护的固定模板，对每个付费账户都相同。",
		),
		evidence: [
			t(
				"Pick a recipe by the question it answers",
				"按要回答的问题选择 Recipe",
			),
			t(
				"Read which session and last-run time a report represents before quoting a figure from it",
				"在引用报告中的数字之前，读出它代表的交易时段与上次运行时间",
			),
			t(
				"Explain why an official recipe does not change under you while its numbers do",
				"解释为何官方 Recipe 不会在你脚下改变，而它的数字会",
			),
		],
		prerequisites: [
			needs(
				"C27",
				"hard",
				"A recipe is a research packet that reruns.",
				"Recipe 是可以重跑的研究包。",
			),
			needs(
				"C24",
				"hard",
				"A run represents one session's clock.",
				"一次运行代表一个交易时段的时钟。",
			),
		],
	},
	C32: {
		id: "C32",
		name: t("Report provenance", "报告来源追溯"),
		description: t(
			"A recipe map shows how a report is built: input cells hold values a reader can change, live-data cells run queries with those inputs for the session, and recipe-text cells were written once and run no query. Tracing a sentence to its cell, its inputs and its data separates what was computed for this session from what was authored, and a screen's top-N table from the full count behind it.",
			"Recipe 地图展示一份报告是如何构建的：输入单元格保存读者可以修改的值，实时数据单元格用这些输入针对该时段运行查询，标记为 Recipe 内容的文字单元格只写过一次、不运行查询。把一句话追溯到它的单元格、输入与数据，就能分清哪些是为这个时段算出的、哪些是事先写好的，以及筛选的前 N 名表格与它背后的完整计数。",
		),
		evidence: [
			t(
				"Trace a report sentence to the cell, inputs and live data behind it",
				"把报告中的一句话追溯到背后的单元格、输入与实时数据",
			),
			t(
				"Tell text written into the recipe from text computed for the session",
				"分清写进 Recipe 的文字与针对该时段算出的文字",
			),
			t(
				"Keep a top-N table apart from the full screen it was cut from",
				"把前 N 名表格与它所来自的完整筛选结果区分开",
			),
		],
		prerequisites: [
			needs(
				"C31",
				"hard",
				"The map shows how a recipe's run is built.",
				"地图展示一次 Recipe 运行是如何构建的。",
			),
		],
	},
	C33: {
		id: "C33",
		name: t("Thresholds and floors", "门槛与下限"),
		description: t(
			"A threshold, floor or session date is an input to the question, not a change of question: a stricter floor or another day reruns the same report and the answers stay comparable. An edited input does nothing until the recipe runs, after which every dependent cell refreshes together, and dropping a volume or open-interest floor lets the thinnest contracts take over a ratio ranking.",
			"门槛、下限或时段日期是问题的输入，而不是换了问题：更严的下限或另一天只是重跑同一份报告，答案仍然可比。修改过的输入在运行 Recipe 之前不起作用，运行后所有依赖它的单元格一起刷新；取消成交量或未平仓量的下限，会让最冷门的合约占据比率排名的榜首。",
		),
		evidence: [
			t(
				"Tell a rerun of the same question with new inputs from a new question",
				"分清用新输入重跑同一个问题与提出一个新问题",
			),
			t(
				"Explain why an edited input changes nothing until the recipe runs",
				"解释为何修改过的输入在 Recipe 运行前不改变任何东西",
			),
			t(
				"Predict which thin rows take over when a floor is lowered, and set a floor that keeps them out",
				"预测下限降低后哪些单薄的行会占据榜首，并设置能把它们挡在外面的下限",
			),
		],
		prerequisites: [
			needs(
				"C31",
				"hard",
				"Inputs and floors live inside a recipe.",
				"输入与下限存在于 Recipe 之中。",
			),
			needs(
				"C23",
				"hard",
				"A floor is an eligibility rule for the comparison.",
				"下限是比较的合格规则。",
			),
			needs(
				"C12",
				"soft",
				"Floors protect ratios from tiny denominators.",
				"下限保护比率不受极小分母影响。",
			),
		],
	},
	C34: {
		id: "C34",
		name: t("AI assistants in the workflow", "工作流中的 AI 助手"),
		description: t(
			"TradingFlow's AI features each do one thing: Customize with AI asks one clarifying question and then proposes changes to a research checklist, AI Insight explains one completed run beside the open report and changes nothing, and Edit with AI opens a private draft of a recipe. All of them produce drafts that spend credits; none alters an official template or certifies a conclusion.",
			"TradingFlow 的各项 AI 功能各司其职：Customize with AI 先问一个澄清问题，再对研究清单提出修改建议；AI Insight 在打开的报告旁解释一次已完成的运行，不改变任何东西；Edit with AI 打开一份 Recipe 的私有草稿。它们产生的都是消耗积分的草稿；没有一项会修改官方模板或为结论背书。",
		),
		evidence: [
			t(
				"Turn a decision into steps a tool can check today, and say what Customize with AI does before it proposes anything",
				"把一个决定变成工具今天就能核查的步骤，并说出 Customize with AI 在提出建议前会做什么",
			),
			t(
				"Tell AI Insight from Edit with AI by what each reads and what each can change",
				"按各自读取什么、能改变什么来区分 AI Insight 与 Edit with AI",
			),
			t("Count the credits a conversation uses", "算出一段对话消耗的积分"),
		],
		prerequisites: [
			needs(
				"C31",
				"hard",
				"The assistants work on recipes and their runs.",
				"这些助手作用于 Recipe 及其运行。",
			),
			needs(
				"C33",
				"soft",
				"A checklist step names a threshold to inspect.",
				"清单步骤指明要检查的门槛。",
			),
		],
	},
	C35: {
		id: "C35",
		name: t("Verifiable calculations", "可核查的计算"),
		description: t(
			"Every figure in an answer is either shown in the report, calculable from its rows, or beyond the data, and the last kind is not evidence. A calculation is only sound when its units agree: a formula column on Rank Symbols reads named fields with units, refuses to add dollars to a count, and needs a floor so that rows with a handful of trades do not lead it.",
			"回答中的每个数字要么报告中有、要么能由数据行算出、要么超出了数据，而第三类不是证据。只有单位一致的计算才站得住：Rank Symbols 上的公式列读取带单位的命名字段，拒绝把美元加到笔数上，并且需要一个下限，才不会让只有几笔成交的行领跑。",
		),
		evidence: [
			t(
				"Sort an AI answer's sentences into shown, calculable and beyond the data",
				"把 AI 回答中的句子分为报告中有的、能算出来的和超出数据的",
			),
			t(
				"Write a formula column whose units make sense and say why a dollars-plus-count formula is refused",
				"写一个单位合理的公式列，并说出为何美元加笔数的公式会被拒绝",
			),
			t(
				"Verify a computed claim against the rows it came from",
				"对照来源数据行核查一个计算得出的结论",
			),
		],
		prerequisites: [
			needs(
				"C26",
				"hard",
				"Shown, calculable and beyond the data are fact, inference and unknown.",
				"报告中有的、能算出的与超出数据的，对应事实、推断与未知。",
			),
			needs(
				"C03",
				"soft",
				"Units such as dollars and contracts come from the contract's terms.",
				"美元与张数等单位来自合约条款。",
			),
		],
	},
	C36: {
		id: "C36",
		name: t("Saving and forking work", "保存与分叉"),
		description: t(
			"Saved work has a defined scope: a Rank View saves its columns, filters and formula definitions, not the values, which recompute for the session you open; a private recipe is a fork of an official one or a new draft, and the official template is never edited in place. Knowing what a save contains, and what it leaves out, decides whether the work can be reopened and rerun as intended.",
			"保存下来的工作有明确的范围：Rank View 保存列、筛选与公式定义，而不是数值，数值会针对你打开的时段重新计算；私有 Recipe 是官方 Recipe 的分叉或新草稿，官方模板永远不会被就地修改。清楚一次保存包含什么、不包含什么，决定了这项工作能否按预期重新打开并重跑。",
		),
		evidence: [
			t(
				"State what a Rank View saves and what it does not",
				"说出 Rank View 保存了什么、没有保存什么",
			),
			t(
				"Fork an official recipe into a private draft and explain why the template is unchanged",
				"把官方 Recipe 分叉为私有草稿，并解释为何模板不变",
			),
			t(
				"Save a private recipe on purpose, knowing where it lives and who can see it",
				"有意识地保存私有 Recipe，并知道它存在何处、谁能看到",
			),
		],
		prerequisites: [
			needs(
				"C31",
				"hard",
				"A private recipe is a fork of an official one.",
				"私有 Recipe 是官方 Recipe 的分叉。",
			),
			needs(
				"C23",
				"soft",
				"A saved view keeps a comparison's columns and filters.",
				"保存的视图保留一个比较的列与筛选。",
			),
		],
	},
	C37: {
		id: "C37",
		name: t("Scope and permissions of AI tools", "AI 工具的范围与权限"),
		description: t(
			"An AI edit or an agent connection should be bounded before it acts: name the part of a recipe that may change so the change can be reviewed, undo anything that was not asked for, and know what a credential allows. TradingFlow's data tools are read-only, recipe editing is a per-key permission that is off by default, and a revoked key stops at once; nothing an agent reaches can place an order or alter an official recipe.",
			"AI 修改或智能体连接在行动之前就应划定范围：指明 Recipe 中允许改动的部分以便审阅，撤销任何未要求的改动，并清楚一项凭据允许做什么。TradingFlow 的数据工具是只读的，Recipe 编辑是默认关闭的按密钥权限，被撤销的密钥会立即失效；智能体能触及的任何东西都不能下单，也不能修改官方 Recipe。",
		),
		evidence: [
			t(
				"Scope an AI edit to one named part of a recipe so the change can be reviewed",
				"把 AI 修改限定在 Recipe 的某个指定部分，以便审阅",
			),
			t("Undo a change you did not ask for", "撤销一处你没有要求的改动"),
			t(
				"State what an agent key can and cannot do, and how to revoke it",
				"说出一把智能体密钥能做什么、不能做什么，以及如何撤销它",
			),
		],
		prerequisites: [
			needs(
				"C34",
				"hard",
				"Scoping an edit needs knowing what each assistant can change.",
				"划定修改范围需要知道每个助手能改什么。",
			),
			needs(
				"C36",
				"soft",
				"A fork is what keeps an edit away from the template.",
				"分叉是让修改不触及模板的方式。",
			),
		],
	},
	C38: {
		id: "C38",
		name: t("Agent connections", "智能体连接"),
		description: t(
			"TradingFlow exposes its read-only tools as a remote MCP server at one HTTP endpoint, so there is nothing to install. Claude signs in with the TradingFlow account; other agents connect with an API key created on the Connect an AI agent page, and hosted chat sites cannot connect yet. An agent can report success while nothing is registered, so the connection is proven with the client's own check or a tools list fetched with the key.",
			"TradingFlow 把只读工具作为远程 MCP 服务器通过一个 HTTP 端点开放，无需安装任何东西。Claude 用 TradingFlow 账户登录；其他智能体用在“Connect an AI agent”页面创建的 API 密钥连接，托管的聊天网站暂时不能连接。智能体可能在什么都没注册的情况下报告成功，所以要用客户端自己的检查或用密钥获取的工具列表来证明连接。",
		),
		evidence: [
			t(
				"Connect an agent to TradingFlow's tools by sign-in or by key, as the agent requires",
				"按智能体的要求，用登录或密钥把它连接到 TradingFlow 的工具",
			),
			t(
				"Prove the connection with the client's own check or a tools list, not the agent's claim",
				"用客户端自己的检查或工具列表证明连接成功，而不是相信智能体的说法",
			),
			t(
				"Tell which agents can connect and which cannot yet",
				"说出哪些智能体可以连接、哪些暂时不能",
			),
		],
		prerequisites: [
			needs(
				"C37",
				"hard",
				"A connection is bounded by what its credential allows.",
				"连接的范围由其凭据允许的内容限定。",
			),
		],
	},
	C39: {
		id: "C39",
		name: t("Put-call parity", "看涨看跌平价"),
		description: t(
			"A long call and a short put at the same strike and expiry together behave like owning the stock and owing the strike, so with no interest or dividends C − P = S − K, with the strike discounted and dividends taken off when they matter. Parity prices one option from the other and tests a print: a trade that seems to break it is a reason to check its time and conditions, not evidence that someone knows something.",
			"同一行权价与到期日的一张多头看涨加一张空头看跌，合起来相当于持有股票并欠下行权价，所以在没有利息和股息时 C − P = S − K；有利息时行权价要折现，有股息时要扣除。平价可以由一个期权推出另一个的价格，也可以用来检验一笔成交：看似违反平价的成交是去核查它的时间与条件的理由，而不是有人掌握内情的证据。",
		),
		evidence: [
			t(
				"Build the equivalent of 100 shares from a call and a put, and say what happens at expiry either way",
				"用一张看涨和一张看跌组合出 100 股的等价物，并说出到期时两种情况下会发生什么",
			),
			t(
				"Price a put from its call, the stock and the strike",
				"由看涨、股价与行权价推出看跌的价格",
			),
			t(
				"Check a print against parity at its own time before reading anything into it",
				"在解读一笔成交之前，先在它自己的时刻用平价关系核对它",
			),
		],
		prerequisites: [
			needs(
				"C02",
				"hard",
				"Parity holds for one strike and one expiry.",
				"平价关系针对同一行权价与到期日成立。",
			),
			needs(
				"C03",
				"hard",
				"It relates the two options' prices to the stock and the strike.",
				"它把两个期权的价格与股价、行权价联系起来。",
			),
		],
	},
	C40: {
		id: "C40",
		name: t("Multi-leg structures", "多腿结构"),
		description: t(
			"A straddle buys a call and a put at one strike and pays on a large move either way, with break-evens the total premium above and below the strike; a strangle uses different strikes; an iron condor sells a put spread and a call spread and keeps the credit if the stock stays between the short strikes, with a worst case of one spread's width minus the credit. Legs that print in the same second are one package to be read together, not several opinions.",
			"跨式在同一行权价买入看涨与看跌，股价大幅变动时无论方向都能获利，盈亏平衡点在行权价上下各一个总权利金处；宽跨式用不同的行权价；铁鹰卖出一个看跌价差和一个看涨价差，股价停在两个卖出行权价之间就保住权利金，最坏情况是一个价差的宽度减去所收权利金。同一秒内打印的多条腿是一个整体，要一起读，而不是几个观点。",
		),
		evidence: [
			t(
				"Find a straddle's break-evens from its strike and total premium",
				"由行权价与总权利金找出跨式的盈亏平衡点",
			),
			t(
				"Work out an iron condor's worst case and where it keeps its credit",
				"算出铁鹰的最坏情况以及它在哪个区间保住权利金",
			),
			t(
				"Read several prints in one second as one package and say what a per-leg sentiment label misses",
				"把同一秒内的几笔成交作为一个整体来读，并说出逐腿情绪标签遗漏了什么",
			),
		],
		prerequisites: [
			needs(
				"C09",
				"hard",
				"A structure is several legs held as one position.",
				"结构是作为一个持仓持有的多条腿。",
			),
			needs(
				"C03",
				"hard",
				"Break-evens and worst cases are payoff arithmetic.",
				"盈亏平衡点与最坏情况是到期价值的算术。",
			),
		],
	},
	C41: {
		id: "C41",
		name: t("Expected move", "预期变动"),
		description: t(
			"Implied volatility is an annual standard deviation under the pricing model; the expected move to expiry is spot times IV times the square root of the fraction of a year left, with the day-count convention stated. About 68 % of model outcomes fall within one such move, the at-the-money straddle prices the average move, about 0.8 of it, and real prices jump around news more often than the model allows. Both describe a size the options price, not a direction.",
			"隐含波动率是定价模型下的年化标准差；到期前的预期变动等于标的价格乘以 IV 再乘以剩余年份比例的平方根，并要说明天数约定。模型下约 68% 的结果落在一个这样的变动之内，平值跨式定价的是平均变动，约为它的 0.8，而真实价格在新闻前后跳动的频率高于模型所允许的。两者描述的都是期权定价的幅度，而不是方向。",
		),
		evidence: [
			t(
				"Turn an implied volatility and days to expiry into a one-standard-deviation dollar move, stating the day count used",
				"把隐含波动率与到期天数换算成一个标准差的美元变动，并说明所用的天数约定",
			),
			t(
				"Explain why the straddle prices about 0.8 of the expected move",
				"解释为何跨式的价格约为预期变动的 0.8",
			),
			t(
				"Say how often a stock is expected to end outside the range, and what the model leaves out",
				"说出股价预计多久会收在区间之外，以及模型遗漏了什么",
			),
		],
		prerequisites: [
			needs(
				"C14",
				"hard",
				"The move is scaled from implied volatility.",
				"变动幅度由隐含波动率换算而来。",
			),
			needs(
				"C40",
				"soft",
				"The straddle's price is compared with the move.",
				"跨式的价格要与变动幅度比较。",
			),
		],
	},
	C42: {
		id: "C42",
		name: t("Same-day expiry (0DTE)", "当日到期（0DTE）"),
		description: t(
			"A 0DTE option expires the day it trades. Its time value shrinks with the square root of the time left, so it drains faster each hour and an at-the-money option the stock never moves from is worth nothing at the close; gamma piles up at the strike, so delta can swing from near 0 to near 1 within cents. Its volume never reaches open interest, because every contract is settled before the next report.",
			"0DTE 期权在交易当天到期。它的时间价值随剩余时间的平方根缩减，所以每小时流失得更快，股价始终没有离开的平值期权在收盘时一文不值；Gamma 堆积在行权价附近，Delta 可以在几美分之内从接近 0 摆到接近 1。它的成交量永远不会进入未平仓量，因为每张合约都在下一次报告之前完成了结算。",
		),
		evidence: [
			t(
				"Value a same-day option at several points in the day and at the close",
				"为当天到期的期权在一天中的几个时点与收盘时估值",
			),
			t(
				"Show how its delta swings on a few cents near the strike with an hour left",
				"演示在只剩一小时时，它的 Delta 如何在行权价附近随几美分摆动",
			),
			t(
				"Explain why a 0DTE contract's volume never appears in open interest",
				"解释为何 0DTE 合约的成交量永远不会出现在未平仓量中",
			),
		],
		prerequisites: [
			needs(
				"C13",
				"hard",
				"The last day is theta and gamma at their extreme.",
				"最后一天是 Theta 与 Gamma 的极端情形。",
			),
			needs(
				"C08",
				"hard",
				"Its volume never reaches open interest.",
				"它的成交量永远到不了未平仓量。",
			),
			needs("C02", "hard", "It is defined by its expiry.", "它由到期日定义。"),
		],
	},
};
