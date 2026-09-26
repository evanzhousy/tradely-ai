import { performanceConceptData } from "./performance-concept.server";
import { pnlConceptData } from "./pnl-concept.server";
import { portfolioExposureData } from "./portfolio-exposure-concept.server";
import "@tanstack/react-start/server-only";
import {
	basics,
	choose as c,
	greeks,
	numberQuestion as n,
	type TeachingUnit,
	t,
} from "./authoring.server";

/** Version 2 rubric, kept so attempts saved before the drawdown question still project. */
const performanceV2: TeachingUnit = {
	id: "portfolio-performance",
	conceptLab: {
		kind: "portfolio-performance",
		data: performanceConceptData,
		intro: t(
			"Explore cash flows, payoff distributions and comparison evidence.",
			"探索资金流、盈亏分布与比较证据。",
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
		"Start $1,000, grow to $1,100, deposit $900, then finish at $2,100. First return 10%; after-deposit base $2,000 gives second return 5%; TWR = 1.10×1.05−1 = 15.5%. Balance growth 110% includes the deposit. Four $20 wins and one $100 loss produce 80% win rate but −$20 total P&L and profit factor 0.8.",
		"初值 $1,000 增至 $1,100，存入 $900，最终 $2,100。首段 10%，存款后基数 $2,000，第二段 5%，TWR=1.10×1.05−1=15.5%。余额增 110% 包含存款。四次各赚 $20、一次亏 $100，胜率 80%，但总亏 $20，盈利因子 0.8。",
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
function maxDrawdownPercent(values: readonly number[]) {
	let peak = values[0] ?? 0;
	let worst = 0;
	for (const value of values) {
		peak = Math.max(peak, value);
		worst = Math.max(worst, peak > 0 ? (peak - value) / peak : 0);
	}
	return Math.round(worst * 10000) / 100;
}

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
		`${performanceV2.misconception.en} Measure drawdown from the running peak, not from the starting balance.`,
		`${performanceV2.misconception.zh}回撤应从历史高点计算，而不是从起始余额计算。`,
	),
	case: (variant) => {
		const base = performanceV2.case(variant);
		const path = drawdownPaths[variant] ?? drawdownPaths[0];
		const usd = path.map((value) => `$${value.toLocaleString("en-US")}`);
		return {
			...base,
			questions: [
				...base.questions,
				n(
					"drawdown",
					`Month-end account values with no deposits or withdrawals: ${usd.join(", ")}. Maximum drawdown from the running peak?`,
					`无存取款的月末账户价值：${usd.join("、")}。相对历史高点的最大回撤是多少？`,
					maxDrawdownPercent(path),
					"percent",
					"百分比",
					"Largest (running peak − later value) ÷ running peak × 100. Measure from the highest value so far, not from the start.",
					"最大的（历史高点 − 其后价值）÷ 历史高点 × 100。应从截至当时的最高价值计算，而不是从起点计算。",
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
			data: pnlConceptData,
			intro: t(
				"Separate realized and unrealized results, inspect cost and fee conventions, and distinguish cash, buying power and signed marked exposure.",
				"区分已实现与未实现结果，检查成本及费用约定，并区分现金、购买力与带符号估值敞口。",
			),
		},
		sources: [basics],
		explanation: t(
			"Position quantity, average cost and mark produce a valuation, not necessarily an executable liquidation price. For a long stock position, market value is quantity × mark and unrealized P&L is quantity × (mark − cost), before fees. A closed lot creates realized P&L under a stated lot-matching convention such as FIFO. Cash is a balance; buying power can include credit or margin rules and is not interchangeable with cash or a safe risk budget. Allocation can be measured by market value but options also require notional and sensitivity context. Short positions have different signs and risk; a small received premium does not cap an uncovered option writer's potential loss. Keep missing marks, fees and source dates visible.",
			"持仓数量、平均成本与估值价得到估值，不一定是可执行清仓价。股票多头价值=数量×估值价，未实现盈亏=数量×(估值价−成本)，暂不计费用。平掉的批次按 FIFO 等明确匹配规则产生已实现盈亏。现金是余额，购买力可能包括授信或保证金，不等于现金或安全风险预算。可按市值计算配置，但期权还需名义金额和敏感度上下文。空头符号与风险不同，收到的小额权利金不限制未备兑义务方的潜在损失。缺失估值、费用与来源日期都应可见。",
		),
		example: t(
			"Buy 100 shares at $20. Sell 40 at $23: realized gain $120 before fees. The remaining 60 marked at $22 have value $1,320 and unrealized gain $120. A cash deposit increases account value without being trading profit. Option positions additionally require their stated multiplier.",
			"以 $20 买 100 股，以 $23 卖 40 股，费用前已实现收益 $120。余下 60 股按 $22 估值，市值 $1,320，未实现收益 $120。现金存入增加账户价值，但不是交易利润。期权还需乘给定乘数。",
		),
		misconception: t(
			"Do not add realized and unrealized figures without checking period, lot basis, fees and whether one already includes the other.",
			"相加已实现与未实现前，检查期间、批次成本、费用和是否存在包含关系。",
		),
		case: (v) => {
			const qty = [100, 120, 80, 150][v];
			const sold = [40, 30, 50, 60][v];
			const cost = [20, 30, 25, 40][v];
			const sell = cost + [3, -2, 4, 2][v];
			const mark = cost + [2, 3, -1, 4][v];
			return {
				brief: t(
					`One long-stock lot: ${qty} shares bought at $${cost}; ${sold} sold at $${sell}; remaining shares marked $${mark}. No fees or other lots.`,
					`一笔股票多头：${qty} 股成本 $${cost}，以 $${sell} 卖出 ${sold} 股，剩余估值 $${mark}。无费用或其他批次。`,
				),
				questions: [
					n(
						"realized",
						"Realized P&L?",
						"已实现盈亏？",
						sold * (sell - cost),
						"USD",
						"美元",
						"Sold quantity × (sale price − cost).",
						"卖出数量×(售价−成本)。",
					),
					n(
						"unrealized",
						"Remaining unrealized P&L?",
						"余下未实现盈亏？",
						(qty - sold) * (mark - cost),
						"USD",
						"美元",
						"Remaining quantity × (mark − cost).",
						"余下数量×(估值价−成本)。",
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
			data: portfolioExposureData,
			intro: t(
				"Aggregate signed sensitivities, test a local hedge, and audit missing or incompatible inputs.",
				"合并带符号敏感度，检验局部对冲，并审查缺失或不兼容输入。",
			),
		},
		sources: [greeks],
		explanation: t(
			"Portfolio exposure sums signed position contributions under consistent units and timestamps. Stock contributes one share of delta per long share and the opposite for shorts. Option contribution is model sensitivity × signed contract quantity × multiplier. Gamma, theta and vega also need their own scales; adding raw fields without converting units can be meaningless. Net delta can be near zero while gamma, volatility or time risk remains large. A hedge changes exposure, not necessarily all risk or transaction cost. Missing Greeks create incomplete coverage, not zero exposure. Disclose which holdings and valuation times were included. A journal records what you believed and why at the time; later profits do not retroactively prove the reasoning was sound.",
			"组合敞口按统一单位和时间汇总带符号持仓贡献。每股股票多头贡献一股 Delta，空头相反。期权贡献=模型敏感度×带符号张数×乘数。Gamma、Theta、Vega 各有尺度，不换单位直接相加可能无意义。净 Delta 近零时，Gamma、波动率或时间风险仍可很大。对冲改变敞口，不消除所有风险与成本。希腊值缺失意味着覆盖不完整，不是零敞口。披露包含持仓及估值时点。日志记录当时信念与理由，后来盈利不能反证当时推理正确。",
		),
		example: t(
			"100 long shares plus 2 short calls with delta 0.40 and multiplier 100 gives net delta 100−80 = +20 shares-equivalent. Selling 20 shares offsets that local delta. The short calls' gamma and assignment risk remain. If a third holding lacks Greeks, call the total a covered subtotal.",
			"100 股多头，加 2 张空头看涨、Delta 0.40、乘数 100，净 Delta=100−80=+20 股等价量。卖 20 股可抵消局部 Delta，但空头看涨的 Gamma 与被指派风险仍在。若第三项持仓缺希腊值，应称已覆盖小计。",
		),
		misconception: t(
			"Delta-neutral is not risk-free. A complete-looking net number cannot hide uncovered holdings.",
			"Delta 中性不等于无风险，完整外观的净值不能掩盖未覆盖持仓。",
		),
		case: (v) => {
			const stock = [100, 150, 90, 200][v];
			const count = [2, 3, 2, 4][v];
			const d = [0.4, 0.6, 0.3, 0.4][v];
			const net = stock - count * d * 100;
			return {
				brief: t(
					`${stock} long shares and ${count} short calls, model delta ${d}, multiplier 100. A separate holding has no Greeks supplied. Compute only the covered subtotal.`,
					`${stock} 股多头与 ${count} 张空头看涨，模型 Delta ${d}，乘数 100。另一持仓未提供希腊值，只计算已覆盖小计。`,
				),
				questions: [
					n(
						"net",
						"Covered net delta?",
						"已覆盖净 Delta？",
						net,
						"shares-equivalent",
						"股等价量",
						"Stock shares − short-call count × delta ×100.",
						"股票股数−空头看涨张数×Delta×100。",
					),
					n(
						"hedge",
						"Stock adjustment to offset that covered delta (buy +, sell −)?",
						"抵消已覆盖 Delta 的股票调整（买正、卖负）？",
						-net,
						"shares",
						"股",
						"Use the opposite sign of covered net delta.",
						"使用已覆盖净 Delta 的相反符号。",
					),
					c(
						"coverage",
						"Is the whole portfolio now proven neutral?",
						"整个组合已证明中性吗？",
						[
							["yes", "Yes, the subtotal can be offset.", "是，小计可抵消。"],
							[
								"no",
								"No, the uncovered holding and other risks remain.",
								"否，未覆盖持仓及其他风险仍在。",
							],
						],
						"no",
						"Neither the missing holding's delta nor non-delta risks were resolved.",
						"未确定缺失持仓的 Delta，也未消除非 Delta 风险。",
					),
				],
			};
		},
	},
];
