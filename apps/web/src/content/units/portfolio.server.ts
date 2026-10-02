import "@tanstack/react-start/server-only";
import {
	basics,
	choose as c,
	greeks,
	money,
	numberQuestion as n,
	plain,
	signed,
	signedMoney,
	type TeachingUnit,
	t,
} from "./authoring.server";

/** Version 2 rubric, kept so attempts saved before the drawdown question still project. */
const performanceV2: TeachingUnit = {
	id: "portfolio-performance",
	conceptLab: {
		kind: "portfolio-performance",
		intro: t(
			"Take a $5,000 deposit out of your account's return with a time-weighted calculation, see an 80% win rate still lose money, and find the deep fall hidden inside a 10% gain.",
			"用时间加权计算把 $5,000 的存入从你账户的收益中剔除，看 80% 的胜率如何仍然亏钱，并找出隐藏在 10% 收益里的深度下跌。",
		),
	},
	sources: [
		{
			title: "Investor.gov · Assessing your performance",
			href: "https://www.investor.gov/introduction-investing/investing-basics/assessing-your-performance",
		},
	],
	explanation: t(
		"Account value can rise because of deposits, not investment returns. Time-weighted return chains subperiod returns separated at external cash flows, under a specified valuation convention. A benchmark needs comparable dates, currency, fees and price-versus-total-return treatment. Win rate counts profitable closed trades; average win/loss and profit factor measure different aspects. A high win rate can coexist with losses if losses are large. Profit factor is gross gains divided by absolute gross losses and is undefined when its loss denominator is zero under this lesson's convention. FIFO and other lot rules can change realized attribution and closing dates. Symbol attribution and monthly P&L depend on coverage; missing history must not be presented as the entire account's performance.",
		"账户价值可能因存款上升，而非投资收益。时间加权收益按外部资金流切分子期间，在给定估值约定下连乘。基准比较需匹配日期、币种、费用及价格收益/总收益处理。胜率统计盈利平仓次数，平均盈亏与盈利因子衡量其他方面。若亏损很大，高胜率仍可亏钱。本课盈利因子=总盈利/总亏损绝对值；亏损分母为零时无定义。FIFO 等批次规则会改变已实现归因与平仓日期。标的归因和月度盈亏依赖覆盖，缺失历史不能当作完整账户表现。",
	),
	example: t(
		"Your account runs from $29,960 at Monday's open to $31,159.60 at the close (+4.00%), takes a $5,000 deposit on Tuesday and ends Friday at $36,521.20 (+1.00% after the deposit). Balance growth is 21.9%, but the time-weighted return is 1.0400 × 1.0100 − 1 = 5.04%. Four winning trades of $95, $80, $120 and $330 and one $780 loss give an 80% win rate, −$155 in total and a profit factor of 0.80. Two accounts can both gain 10% while one falls 25% from its peak on the way.",
		"你的账户从周一开盘的 $29,960 到收盘的 $31,159.60（+4.00%），周二存入 $5,000，周五收于 $36,521.20（存入后 +1.00%）。余额增长 21.9%，但时间加权收益是 1.0400 × 1.0100 − 1 = 5.04%。盈利 $95、$80、$120、$330 的四笔交易和一笔 $780 的亏损，胜率 80%，合计 −$155，盈利因子 0.80。两个账户都可能上涨 10%，而其中一个途中从高点下跌了 25%。",
	),
	misconception: t(
		"Define trade, return period and cash-flow timing before computing a percentage. Do not confuse win rate with expected profitability.",
		"计算百分比前定义交易、期间和资金流时点，不能把胜率当作预期盈利能力。",
	),
	case: (v) => {
		const first = [0.1, 0.05, -0.1, 0.08][v];
		const second = [0.05, -0.02, 0.1, 0.03][v];
		const wins = [80, 150, 120, 200][v];
		const loss = [100, 50, 160, 125][v];
		return {
			brief: t(
				`Returns between correctly valued external cash flows: first ${(first * 100).toFixed(0)}%, second ${(second * 100).toFixed(0)}%. Separately, a fully covered closed-trade sample has gross gains $${wins}, gross losses $${loss}.`,
				`按正确外部资金流估值切分的收益：第一段 ${(first * 100).toFixed(0)}%，第二段 ${(second * 100).toFixed(0)}%。另有完整平仓样本总盈利 $${wins}、总亏损 $${loss}。`,
			),
			questions: [
				n(
					"twr",
					"Chained time-weighted return?",
					"连乘时间加权收益？",
					((1 + first) * (1 + second) - 1) * 100,
					"percent",
					"百分比",
					"[(1+r1)×(1+r2)−1]×100.",
					"[(1+r1)×(1+r2)−1]×100。",
					0.001,
				),
				n(
					"factor",
					"Profit factor?",
					"盈利因子？",
					wins / loss,
					"ratio",
					"比率",
					"Gross gains ÷ absolute gross losses.",
					"总盈利÷总亏损绝对值。",
				),
			],
		};
	},
};

const drawdownPaths = [
	[10000, 12000, 9000, 11000],
	[20000, 25000, 21000, 26000, 23400],
	[8000, 10000, 7000, 9000],
	[15000, 18000, 16200, 19000, 15200],
];
/** The largest fall from a running peak: the percent, and the peak and low it ran between. */
function maxDrawdown(values: readonly number[]) {
	let peak = values[0] ?? 0;
	let worst = { percent: 0, peak, low: peak };
	for (const value of values) {
		peak = Math.max(peak, value);
		const percent = peak > 0 ? (peak - value) / peak : 0;
		if (percent > worst.percent) worst = { percent, peak, low: value };
	}
	return { ...worst, percent: Math.round(worst.percent * 10000) / 100 };
}
const percent = (rate: number) => `${signed(rate * 100)}%`;

const performanceUnit: TeachingUnit = {
	...performanceV2,
	version: 3,
	conceptLab: performanceV2.conceptLab && {
		...performanceV2.conceptLab,
		intro: t(
			"Explore cash flows, payoff distributions, comparison evidence and the largest fall from a peak.",
			"探索资金流、盈亏分布、比较证据，以及相对高点的最大跌幅。",
		),
	},
	explanation: t(
		`${performanceV2.explanation.en} Maximum drawdown is the largest fall from a running peak in account value, as a percent of that peak. It shows the worst loss a holder would have sat through, which total return and win rate can hide; a 25% fall needs a 33% gain to recover.`,
		`${performanceV2.explanation.zh}最大回撤是账户价值相对历史高点的最大跌幅，以该高点的百分比表示。它反映持有人曾经承受的最大损失，而总收益与胜率可能掩盖这一点；下跌 25% 需要上涨约 33% 才能回本。`,
	),
	example: t(
		`${performanceV2.example.en} An account that goes $10,000 → $12,000 → $9,000 → $11,000 returns 10% overall but has a 25% maximum drawdown ($3,000 from the $12,000 peak).`,
		`${performanceV2.example.zh}账户从 $10,000 → $12,000 → $9,000 → $11,000，总收益 10%，但最大回撤为 25%（从 $12,000 高点下跌 $3,000）。`,
	),
	misconception: t(
		"Before computing a percentage, pin down what counts as a trade, the period, and when cash moved. A high win rate isn't the same as making money. Measure drawdown from the running peak, not from the starting balance.",
		"计算百分比之前，先确定什么算一笔交易、计算期间，以及资金何时进出。胜率高不等于赚钱。回撤要从历史高点算起，而不是从起始余额算起。",
	),
	case: (variant) => {
		const v =
			Number.isInteger(variant) && variant >= 0 && variant <= 3 ? variant : 0;
		const first = [0.1, 0.05, -0.1, 0.08][v];
		const second = [0.05, -0.02, 0.1, 0.03][v];
		const wins = [80, 150, 120, 200][v];
		const loss = [100, 50, 160, 125][v];
		const twr = ((1 + first) * (1 + second) - 1) * 100;
		const path = drawdownPaths[v];
		const values = path.map((value) => money(value, 0));
		const fall = maxDrawdown(path);
		return {
			brief: t(
				`Your account returned ${percent(first)} before a deposit and ${percent(second)} after it, each measured between cash flows at correct values. Separately, a complete record of your closed trades shows ${money(wins, 0)} of gross gains and ${money(loss, 0)} of gross losses.`,
				`你的账户在一次存入之前收益 ${percent(first)}，之后收益 ${percent(second)}，两段都按正确估值、在资金流之间测量。另外，你已平仓交易的完整记录显示总盈利 ${money(wins, 0)}、总亏损 ${money(loss, 0)}。`,
			),
			questions: [
				n(
					"twr",
					"What is the time-weighted return across both periods, in percent?",
					"两段合起来的时间加权收益是多少（百分比）？",
					twr,
					"percent",
					"%",
					`${(1 + first).toFixed(2)} × ${(1 + second).toFixed(2)} − 1 = ${percent(twr / 100)}. The deposit itself isn't a return, so it sits between the periods.`,
					`${(1 + first).toFixed(2)} × ${(1 + second).toFixed(2)} − 1 = ${percent(twr / 100)}。存入本身不是收益，所以它把两段隔开。`,
					0.001,
				),
				n(
					"factor",
					"What is the profit factor: gross gains divided by gross losses?",
					"盈利因子是多少：总盈利除以总亏损？",
					wins / loss,
					"ratio",
					"比率",
					`${money(wins, 0)} ÷ ${money(loss, 0)} = ${plain(wins / loss)}. ${wins < loss ? "Below 1: the trades lost money overall." : "Above 1: gains outweighed losses."}`,
					`${money(wins, 0)} ÷ ${money(loss, 0)} = ${plain(wins / loss)}。${wins < loss ? "小于 1：这些交易整体亏钱。" : "大于 1：盈利超过亏损。"}`,
				),
				n(
					"drawdown",
					`Month-end values, with no deposits or withdrawals, ran ${values.join(", ")}. What was the largest fall from a running peak, in percent?`,
					`没有存取款时，月末价值依次为 ${values.join("、")}。相对历史高点的最大跌幅是多少（百分比）？`,
					fall.percent,
					"percent",
					"%",
					`From the ${money(fall.peak, 0)} peak to ${money(fall.low, 0)}: (${plain(fall.peak)} − ${plain(fall.low)}) ÷ ${plain(fall.peak)} × 100 = ${plain(fall.percent)}%. Measure from the highest value so far, not from the start.`,
					`从 ${money(fall.peak, 0)} 的高点到 ${money(fall.low, 0)}：(${plain(fall.peak)} − ${plain(fall.low)}) ÷ ${plain(fall.peak)} × 100 = ${plain(fall.percent)}%。要从截至当时的最高值算起，而不是从起点算起。`,
					0.01,
				),
			],
		};
	},
};

/** Earlier portfolio rubrics that saved attempts may still reference. */
export const archivedPortfolioUnits: TeachingUnit[] = [performanceV2];

export const portfolioUnits: TeachingUnit[] = [
	{
		id: "portfolio-pnl",
		conceptLab: {
			kind: "portfolio-pnl",
			intro: t(
				"Split your Oct 18 100 calls' P&L into realized and unrealized under two lot rules, keep a deposit out of trading P&L, and value Ben's short calls with their sign and no premium cap.",
				"在两种批次规则下把你的 10月18日 100 看涨盈亏分成已实现与未实现，把存入排除在交易盈亏之外，并带着符号估值 Ben 的看涨空头，明白权利金不是亏损上限。",
			),
		},
		sources: [basics],
		explanation: t(
			"Position quantity, average cost and mark produce a valuation, not necessarily an executable liquidation price. For a long stock position, market value is quantity × mark and unrealized P&L is quantity × (mark − cost), before fees. A closed lot creates realized P&L under a stated lot-matching convention such as FIFO. Cash is a balance; buying power can include credit or margin rules and is not interchangeable with cash or a safe risk budget. Allocation can be measured by market value but options also require notional and sensitivity context. Short positions have different signs and risk; a small received premium does not cap an uncovered option writer's potential loss. Keep missing marks, fees and source dates visible.",
			"持仓数量、平均成本与估值价得到估值，不一定是可执行清仓价。股票多头价值=数量×估值价，未实现盈亏=数量×(估值价−成本)，暂不计费用。平掉的批次按 FIFO 等明确匹配规则产生已实现盈亏。现金是余额，购买力可能包括授信或保证金，不等于现金或安全风险预算。可按市值计算配置，但期权还需名义金额和敏感度上下文。空头符号与风险不同，收到的小额权利金不限制未备兑义务方的潜在损失。缺失估值、费用与来源日期都应可见。",
		),
		example: t(
			"You bought 10 Oct 18 100 calls at $4.10 and 6 at $4.15. Sell 6 at the $4.65 bid at 15:59: first in, first out, realized P&L is +$330 and the 10 still open are +$645 at the $4.775 mid; at average cost the split is +$318.75 and +$656.25, the same $975 in total. Your account's trading P&L for Monday is +$1,199.60 after $10.40 of fees; Tuesday's $5,000 deposit raises account value, not P&L. Ben, short 10 calls for $4,100, is down $675 at the mark and $15,900 if ALFA settles at $120.",
			"你以 $4.10 买入 10 张、以 $4.15 买入 6 张 10月18日 100 看涨。15:59 以买价 $4.65 卖出 6 张：按先进先出，已实现盈亏 +$330，仍持有的 10 张按中间价 $4.775 计为 +$645；按平均成本则为 +$318.75 和 +$656.25，合计同样是 $975。扣除 $10.40 费用后，你账户周一的交易盈亏为 +$1,199.60；周二存入的 $5,000 提高账户价值，但不是盈亏。Ben 以 $4,100 卖出 10 张看涨，按估值亏 $675，若 ALFA 结算于 $120 则亏 $15,900。",
		),
		misconception: t(
			"Before adding realized and unrealized P&L, check that they cover the same period, use the same lot rule and fees, and that one doesn't already include the other.",
			"把已实现与未实现盈亏相加之前，先确认它们覆盖同一期间、使用相同的批次规则和费用，而且一方没有已经包含另一方。",
		),
		case: (v) => {
			const qty = [100, 120, 80, 150][v];
			const sold = [40, 30, 50, 60][v];
			const cost = [20, 30, 25, 40][v];
			const sell = cost + [3, -2, 4, 2][v];
			const mark = cost + [2, 3, -1, 4][v];
			return {
				brief: t(
					`You bought ${qty} shares at ${money(cost)}. Later you sold ${sold} of them at ${money(sell)}, and the remaining ${qty - sold} are marked at ${money(mark)}. There are no fees and no other lots.`,
					`你以 ${money(cost)} 买入 ${qty} 股。之后以 ${money(sell)} 卖出其中 ${sold} 股，剩下的 ${qty - sold} 股估值为 ${money(mark)}。没有费用，也没有其他批次。`,
				),
				questions: [
					n(
						"realized",
						"What is your realized P&L on the shares you sold? Use a minus sign for a loss.",
						"卖出部分的已实现盈亏是多少？亏损请用负号。",
						sold * (sell - cost),
						"dollars",
						"美元",
						`${sold} × (${money(sell)} − ${money(cost)}) = ${signedMoney(sold * (sell - cost), 0)}.`,
						`${sold} × (${money(sell)} − ${money(cost)}) = ${signedMoney(sold * (sell - cost), 0)}。`,
					),
					n(
						"unrealized",
						"What is the unrealized P&L on the shares you still hold? Use a minus sign for a loss.",
						"仍持有部分的未实现盈亏是多少？亏损请用负号。",
						(qty - sold) * (mark - cost),
						"dollars",
						"美元",
						`${qty - sold} × (${money(mark)} − ${money(cost)}) = ${signedMoney((qty - sold) * (mark - cost), 0)}. It becomes realized only when you sell.`,
						`${qty - sold} × (${money(mark)} − ${money(cost)}) = ${signedMoney((qty - sold) * (mark - cost), 0)}。只有卖出时才会变成已实现。`,
					),
				],
			};
		},
	},
	performanceUnit,
	{
		id: "portfolio-exposure",
		conceptLab: {
			kind: "portfolio-exposure",
			intro: t(
				"Add up delta across your two accounts while one holding's Greeks are missing, hedge it to zero and watch a quiet week cost $964, then align two brokers' units and timestamps before totaling.",
				"在一项持仓的希腊值缺失时汇总你两个账户的 Delta，把它对冲到零后看平静的一周如何损失 $964，再在合计前对齐两家券商的单位和时间戳。",
			),
		},
		sources: [greeks],
		explanation: t(
			"Portfolio exposure sums signed position contributions under consistent units and timestamps. Stock contributes one share of delta per long share and the opposite for shorts. Option contribution is model sensitivity × signed contract quantity × multiplier. Gamma, theta and vega also need their own scales; adding raw fields without converting units can be meaningless. Net delta can be near zero while gamma, volatility or time risk remains large. A hedge changes exposure, not necessarily all risk or transaction cost. Missing Greeks create incomplete coverage, not zero exposure. Disclose which holdings and valuation times were included. A journal records what you believed and why at the time; later profits do not retroactively prove the reasoning was sound.",
			"组合敞口按统一单位和时间汇总带符号持仓贡献。每股股票多头贡献一股 Delta，空头相反。期权贡献=模型敏感度×带符号张数×乘数。Gamma、Theta、Vega 各有尺度，不换单位直接相加可能无意义。净 Delta 近零时，Gamma、波动率或时间风险仍可很大。对冲改变敞口，不消除所有风险与成本。希腊值缺失意味着覆盖不完整，不是零敞口。披露包含持仓及估值时点。日志记录当时信念与理由，后来盈利不能反证当时推理正确。",
		),
		example: t(
			"At Monday's close (ALFA $101.20), your 100 shares give +100 shares of delta and your 16 Oct 18 100 calls 16 × 100 × 0.566 ≈ +906: a covered subtotal of +1,006 while the 5 Oct 18 95 puts in your second account haven't reported. Their −0.259 delta adds −130, for +876 in all. Short 876 shares and delta is zero, yet gamma is +75 shares per $1, theta −$130 a day and vega +$237 per vol point: a week with ALFA unchanged costs $964. The second broker quotes put vega as 9.70 per 1.00 of volatility, 0.097 per point, and stamps its put delta at Friday's close.",
			"周一收盘（ALFA $101.20），你的 100 股带来 +100 股 Delta，16 张 10月18日 100 看涨带来 16 × 100 × 0.566 ≈ +906：在第二个账户的 5 张 10月18日 95 看跌尚未报送时，这是 +1,006 的已覆盖小计。看跌的 −0.259 Delta 计入 −130，总计 +876。做空 876 股后 Delta 为零，但 Gamma 为每 $1 +75 股、Theta 每天 −$130、Vega 每个波动率点 +$237：ALFA 不变的一周要损失 $964。第二券商按每 1.00 波动率报看跌 Vega 9.70，即每点 0.097，看跌 Delta 的时间戳还是周五收盘。",
		),
		misconception: t(
			"Delta-neutral isn't risk-free, and a tidy net number can't make an unreported holding disappear.",
			"Delta 中性不等于没有风险，一个整齐的净值也不能让未报送的持仓消失。",
		),
		case: (v) => {
			const stock = [100, 150, 90, 200][v];
			const count = [2, 3, 2, 4][v];
			const d = [0.4, 0.6, 0.3, 0.4][v];
			const net = stock - count * d * 100;
			return {
				brief: t(
					`In one account you hold ${stock} ALFA shares and are short ${count} ALFA calls with a model delta of ${plain(d, 2)} each; one contract covers 100 shares. A holding in your second account hasn't reported its Greeks, so work out only what's covered.`,
					`在一个账户里，你持有 ${stock} 股 ALFA，并做空 ${count} 张 ALFA 看涨，每张模型 Delta 为 ${plain(d, 2)}；一张合约对应 100 股。你第二个账户里的一项持仓还没有报送希腊值，所以只计算已覆盖的部分。`,
				),
				questions: [
					n(
						"net",
						"What is the covered net delta, in share-equivalents?",
						"已覆盖部分的净 Delta 是多少股等价？",
						net,
						"share-equivalents",
						"股等价",
						`+${stock} from the shares, and −${count} × ${plain(d, 2)} × 100 = −${plain(count * d * 100)} from the short calls: ${signed(net)}.`,
						`股票贡献 +${stock}，空头看涨贡献 −${count} × ${plain(d, 2)} × 100 = −${plain(count * d * 100)}：合计 ${signed(net)}。`,
					),
					n(
						"hedge",
						"How many shares would offset that covered delta? Enter a purchase as positive and a sale as negative.",
						"需要交易多少股才能抵消已覆盖的 Delta？买入填正数，卖出填负数。",
						-net,
						"shares",
						"股",
						`To cancel ${signed(net)}, trade ${signed(-net)} shares.`,
						`要抵消 ${signed(net)}，需要交易 ${signed(-net)} 股。`,
					),
					c(
						"coverage",
						"Does that make the whole portfolio neutral?",
						"这样整个组合就中性了吗？",
						[
							["yes", "Yes: the subtotal is offset", "是：小计已被抵消"],
							[
								"no",
								"No: the unreported holding and other risks remain",
								"否：未报送的持仓和其他风险仍在",
							],
						],
						"no",
						"The second account's holding is still unknown, and a zero delta leaves gamma, time and volatility risk in place.",
						"第二个账户的持仓仍然未知；而且 Delta 为零，并不能消除 Gamma、时间和波动率风险。",
					),
				],
			};
		},
	},
];
