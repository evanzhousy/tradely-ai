import "@tanstack/react-start/server-only";
import {
	choose as c,
	greeks,
	numberQuestion as n,
	type TeachingUnit,
	t,
} from "./authoring.server";
import { deltaConceptData } from "./delta-concept.server";
import { gammaConceptData } from "./gamma-concept.server";
import { timeVolRateConceptData } from "./time-vol-rate-concept.server";

export const exposureUnits: TeachingUnit[] = [
	{
		id: "delta",
		conceptLab: {
			kind: "delta",
			data: deltaConceptData,
			intro: t(
				"Explore a local option-price slope, carry its sign and units into position exposure, and test when the delta-only estimate is incomplete.",
				"探索局部期权价格斜率，将符号与单位带入持仓敞口，并检验何时仅用 Delta 的估计不完整。",
			),
		},
		sources: [greeks],
		explanation: t(
			"Delta approximates an option's price change for a small one-unit move in its underlying, holding other inputs fixed. A quoted delta of 0.50 means about $0.50 per option-share for a $1 underlying move in this example. Multiply by contract count and the stated multiplier for dollar change or share-equivalent position exposure. A long call commonly has positive delta; a long put negative. Shorting the same option reverses the position sign. Delta is local, may change with spot, time and volatility, and is not a promise about the next price or a universally valid probability. Distinguish the option's model delta from a flow convention that first takes absolute exposure and adds a sentiment sign later.",
			"Delta 近似表示其他输入不变时，标的小幅每单位变动引起的期权价格变化。本例 Delta 0.50 表示标的涨 $1，每股期权价格约涨 $0.50。乘以张数和给定乘数可得到金额变化或持仓股等价敞口。多头看涨通常 Delta 为正，多头看跌为负；做空同一期权反转持仓符号。Delta 是局部值，会随现价、时间和波动率变化，不保证下个价格，也不是普遍成立的概率。期权模型 Delta 不同于先取绝对敞口再添加情绪符号的成交流约定。",
		),
		example: t(
			"Long 2 calls, delta 0.50, multiplier 100: position delta +100 shares-equivalent. A $0.40 underlying rise gives about +$40 using delta alone. Shorting those calls gives −100 and about −$40. Neither estimate includes gamma, time, volatility or fees.",
			"多头 2 张看涨，Delta 0.50、乘数 100：持仓 Delta 为 +100 股等价量。标的涨 $0.40，单用 Delta 估计约赚 $40。做空则为 −100，约亏 $40。两者都未包含 Gamma、时间、波动率与费用。",
		),
		misconception: t(
			"Do not multiply by 100 twice. A model price sensitivity is not an inferred tape-sentiment sign.",
			"不要重复乘 100。模型价格敏感度不是成交记录推断的情绪符号。",
		),
		case: (v) => {
			const delta = [0.4, -0.35, 0.6, -0.25][v];
			const count = [3, 4, 2, 6][v];
			const short = v === 2;
			const move = [0.5, 0.8, -0.5, 1.2][v];
			const position = delta * count * 100 * (short ? -1 : 1);
			return {
				brief: t(
					`${short ? "Short" : "Long"} ${count} options. Model delta ${delta}; multiplier 100. Underlying move $${move}. Other inputs fixed; delta-only approximation.`,
					`${short ? "空头" : "多头"} ${count} 张期权，模型 Delta ${delta}、乘数 100。标的变动 $${move}。其他输入固定，仅用 Delta 近似。`,
				),
				questions: [
					n(
						"position-delta",
						"Signed position delta?",
						"带符号持仓 Delta？",
						position,
						"shares-equivalent",
						"股等价量",
						"Model delta × contracts × multiplier × long/short sign.",
						"模型 Delta×张数×乘数×多空符号。",
					),
					n(
						"change",
						"Approximate position value change?",
						"持仓价值近似变化？",
						position * move,
						"USD",
						"美元",
						"Position delta × underlying price change.",
						"持仓 Delta×标的价格变化。",
					),
				],
			};
		},
	},
	{
		id: "gamma",
		conceptLab: {
			kind: "gamma",
			data: gammaConceptData,
			intro: t(
				"Separate gamma's change in delta from its price term, replay a hedge for a supplied position, and compare near-expiry sensitivity without extrapolating past valid delta bounds.",
				"区分 Gamma 引起的 Delta 变化与价格项，回放给定持仓对冲，并比较临近到期敏感度而不越过有效 Delta 边界外推。",
			),
		},
		sources: [greeks],
		explanation: t(
			"Gamma measures how model delta changes with the underlying. Delta is the slope; gamma describes its change. For a small move, new delta is approximately old delta plus gamma times the move. An option-price approximation can include delta × move + one-half × gamma × move squared. Those are different calculations. Long vanilla options generally have positive gamma; the same short position has negative gamma. A hedge offsets a stated position's delta, not an unknown dealer portfolio inferred from a print. Near expiration, at-the-money sensitivities can change sharply; this does not make every 0DTE contract equally sensitive or the local approximation valid for an arbitrarily large move.",
			"Gamma 衡量模型 Delta 随标的的变化。Delta 是斜率，Gamma 描述斜率变化。小幅变动后 Delta≈原 Delta+Gamma×变动。期权价格近似可包含 Delta×变动+半个 Gamma×变动平方，两种计算不同。普通期权多头通常正 Gamma，空头相反。对冲针对给定持仓 Delta，不是凭成交推断未知做市商组合。临近到期的平值敏感度可急剧变化，但不意味着所有 0DTE 同样敏感，也不能把局部近似用于任意大幅变动。",
		),
		example: t(
			"Long call delta 0.50, gamma 0.04 per $1. A $2 rise implies delta about 0.58. Two contracts with multiplier 100 change from +100 to +116 shares-equivalent. A delta-neutral hedge would change from −100 to −116 shares: sell 16 more shares under these assumptions.",
			"多头看涨 Delta 0.50、每 $1 Gamma 0.04。上涨 $2 后 Delta 约 0.58。2 张、乘数 100，股等价量由 +100 到 +116。中性对冲由 −100 股变为 −116 股，在这些假设下需再卖 16 股。",
		),
		misconception: t(
			"For the supplied long-gamma position, selling into a rise maintains the hedge. This conditional example does not prove how dealers are positioned.",
			"给定正 Gamma 持仓中，上涨时卖出是维持对冲；该条件案例不证明做市商实际持仓。",
		),
		case: (v) => {
			const d = [0.45, 0.5, 0.35, 0.6][v];
			const g = [0.03, 0.02, 0.04, 0.01][v];
			const move = [1, 2, -1, 3][v];
			const count = [2, 3, 4, 5][v];
			return {
				brief: t(
					`Long calls: delta ${d}, gamma ${g}/$1, ${count} contracts, multiplier 100. Underlying move $${move}; other inputs fixed.`,
					`多头看涨 Delta ${d}、每 $1 Gamma ${g}，${count} 张、乘数 100。标的变动 $${move}，其他输入固定。`,
				),
				questions: [
					n(
						"next-delta",
						"Approximate new option delta?",
						"期权新 Delta 近似值？",
						d + g * move,
						"delta per option-share",
						"每股期权 Delta",
						"Old delta + gamma × move.",
						"原 Delta+Gamma×变动。",
					),
					n(
						"hedge-change",
						"Additional stock shares to hold for a delta-neutral hedge (buy +, sell −)?",
						"为维持 Delta 中性需增持多少股票（买入为正，卖出为负）？",
						-g * move * count * 100,
						"shares",
						"股",
						"Hedge change is the negative of the position delta change.",
						"对冲变化是持仓 Delta 变化的相反数。",
					),
				],
			};
		},
	},
	{
		id: "theta-vega-rho",
		conceptLab: {
			kind: "theta-vega-rho",
			data: timeVolRateConceptData,
			intro: t(
				"Read calendar days and percentage-point conventions, scale each signed sensitivity, and build up a local estimate from spot, time, volatility and rate contributions.",
				"读取自然日与百分点约定，缩放各项带符号敏感度，并从现价、时间、波动率与利率贡献累加局部估计。",
			),
		},
		sources: [greeks],
		explanation: t(
			"Theta, vega and rho describe local sensitivities to time, implied volatility and interest rates. Read the quoted convention: this lesson uses theta in dollars per option-share per calendar day, vega per one percentage-point IV change, and rho per one percentage-point rate change. A move from 20% to 23% IV is three vol points, not a 3% relative increase. Signs belong to the stated position and model; shorting an option reverses that option's sensitivities. Other inputs held fixed is a condition of the estimate. A favorable underlying move can be outweighed by time decay or an IV decrease. Rates, dividends, exercise style and model assumptions matter; do not memorize one sign as a universal rule for every product.",
			"Theta、Vega、Rho 分别描述时间、隐含波动率和利率的局部敏感度。先读约定：本课 Theta 为每股期权每自然日美元变化，Vega 为 IV 每变动一个百分点的变化，Rho 为利率每变动一个百分点的变化。IV 从 20% 到 23% 是 3 个波动率点，不是相对增长 3%。符号属于给定持仓与模型，做空反转敏感度。其他输入固定是近似成立的条件。即便标的方向有利，时间损耗或 IV 下跌仍可能造成亏损。利率、股息、行权方式与模型假设都需要说明，不能把一种符号当作所有产品的定律。",
		),
		example: t(
			"Given theta −$0.04/day and vega $0.10/vol point: after 2 days and a 3-point IV fall, the per-share estimate is −$0.08−$0.30 = −$0.38. For 2 contracts ×100, that is −$76. This approximation excludes spot changes and interactions.",
			"给定 Theta −$0.04/天、Vega $0.10/波动率点：2 天后 IV 降 3 点，每股估计 −$0.08−$0.30=−$0.38。2 张×100，合计 −$76，暂不计现价变化和交互效应。",
		),
		misconception: t(
			"Use percentage-point changes for the supplied vega/rho convention. State omitted inputs rather than calling an approximation realized P&L.",
			"按给定 Vega/Rho 约定使用百分点变化，说明遗漏输入，不能把近似称为实际盈亏。",
		),
		case: (v) => {
			const days = [2, 3, 1, 4][v];
			const iv = [-2, 3, -4, 2][v];
			const rate = [0, 0.5, -0.5, 1][v];
			return {
				brief: t(
					`One long option, multiplier 100. Theta −$0.05/day, vega $0.12/IV point, rho $0.08/rate point. ${days} days pass, IV changes ${iv} points and rates ${rate} points. Spot fixed.`,
					`一张多头期权、乘数 100。Theta −$0.05/天，Vega $0.12/IV 点，Rho $0.08/利率点。经过 ${days} 天，IV 变动 ${iv} 点，利率变动 ${rate} 点，现价固定。`,
				),
				questions: [
					n(
						"vega-effect",
						"IV-only per-share price effect?",
						"仅 IV 引起的每股价格变化？",
						iv * 0.12,
						"USD/share",
						"美元/股",
						"Vega × IV point change.",
						"Vega×IV 点数变化。",
					),
					n(
						"combined",
						"Combined approximate position change?",
						"合并后的持仓近似变化？",
						(-0.05 * days + 0.12 * iv + 0.08 * rate) * 100,
						"USD",
						"美元",
						"(Theta×days + vega×IV points + rho×rate points) × multiplier.",
						"（Theta×天数+Vega×IV 点数+Rho×利率点数）×乘数。",
					),
				],
			};
		},
	},
	{
		id: "implied-realized-volatility",
		sources: [greeks],
		explanation: t(
			"Implied volatility is an input inferred from an option price through a stated pricing model. It is not directly observed future volatility. Realized volatility is computed from historical returns with a defined window, sampling and annualization. A vendor's unspecified historical-volatility field is not automatically your chosen realized estimate. IV30 is a standardized forward-looking 30-day implied reference; RV20 may be a trailing 20-session estimate. Their horizons differ. Subtracting them gives volatility points, not a return forecast or proof of mispricing. IV can fall after an anticipated event, reducing option value even when the underlying moved favorably. Quotes, trade prices and model assumptions can produce different IV observations.",
			"隐含波动率是把期权价格代入指定定价模型后反推的输入，不是直接观测到的未来波动。已实现波动率由历史收益按明确窗口、采样与年化规则计算。供应商未说明窗口的历史波动字段，不能自动替代你的已实现估计。IV30 是标准化向前 30 天参考，RV20 可为向后 20 个交易日估计，时间范围不同。相减得到波动率点，不是收益预测或错误定价的证明。事件结束后 IV 可能下跌，使期权在标的方向有利时仍贬值。报价、成交价与模型假设也可产生不同 IV。",
		),
		example: t(
			"IV30 30%, trailing RV20 24%: spread +6 vol points. Relative to RV, the difference is 25%, a different quantity. Neither says the underlying will rise 6%. A daily return standard deviation of 1% annualizes to about 15.87% using sqrt(252), only under that sampling convention.",
			"IV30 30%、历史 RV20 24%，差为 +6 个波动率点；相对于 RV 的差为 25%，是另一种量。两者都不是标的将上涨 6%。日收益标准差 1% 按 √252 年化约 15.87%，仅在该采样约定下成立。",
		),
		misconception: t(
			"Keep units and horizons. A spread between forward-implied and backward-realized estimates is context, not automatic expected profit.",
			"保留单位与时间范围。向前隐含与向后已实现估计之差是上下文，不是自动预期利润。",
		),
		case: (v) => {
			const iv = [28, 35, 22, 31][v];
			const rv = [20, 28, 26, 25][v];
			return {
				brief: t(
					`IV30 = ${iv}%; trailing RV20 = ${rv}%. Both are annualized, but one looks forward and the other backward.`,
					`IV30=${iv}%，历史 RV20=${rv}%。两者均年化，但一个向前、一个向后。`,
				),
				questions: [
					n(
						"spread",
						"IV30 − RV20?",
						"IV30−RV20？",
						iv - rv,
						"volatility points",
						"波动率点",
						"Subtract percentages as point values; preserve the sign.",
						"百分点数值相减并保留符号。",
					),
					c(
						"interpretation",
						"What does this difference establish?",
						"该差异能确定什么？",
						[
							[
								"mispricing",
								"Certain option mispricing of the same amount.",
								"相同数额的确定期权错误定价。",
							],
							[
								"context",
								"A difference between two specified volatility measures, not a directional forecast.",
								"两项给定波动指标的差，不是方向预测。",
							],
							["return", "The next stock return.", "下个股票收益。"],
						],
						"context",
						"The estimation windows and information sets differ.",
						"估计窗口与信息集不同。",
					),
				],
			};
		},
	},
	{
		id: "volatility-surface",
		sources: [greeks],
		explanation: t(
			"A volatility smile is a strike or moneyness slice at one expiry; term structure compares expiries using a comparable reference. A surface joins those dimensions. Delta coordinates such as 25-delta wings depend on model and quote conventions. State whether skew is put IV minus call IV or the reverse. Here 25-delta skew/risk reversal means put minus call; butterfly means the average wing IV minus ATM IV. Values are in volatility points. ATM30 is a standardized reference, not necessarily one quoted listed contract. Interpolation is a modeled estimate between supported observations, not a quote. Leave unsupported cells blank. A traded-only smile has different coverage from a fully quoted chain, and a change of side or expiry can change the comparison.",
			"波动率微笑是在同一到期日按行权价或价内外程度切片，期限结构按可比参考比较到期日，曲面组合两维。25 Delta 等坐标依赖模型与报价约定，应说明偏斜是看跌 IV 减看涨，还是相反。本课 25 Delta 偏斜/风险逆转为看跌减看涨，蝶式指标为两翼平均 IV 减 ATM IV，单位为波动率点。ATM30 是标准化参考，不一定对应单一挂牌合约。插值是有观测支持区间内的模型估计，不是报价；无支持单元格应留空。仅成交的微笑与完整报价链覆盖不同，切换类型或到期日会改变比较。",
		),
		example: t(
			"Same expiry: 25Δ put IV 32%, call IV 26%, ATM IV 27%. Put-minus-call skew is 6 points; butterfly is (32+26)/2−27 = 2 points. If the call wing is absent, neither complete comparison can be recovered by assuming its IV is zero.",
			"同到期：25Δ 看跌 IV 32%、看涨 26%、ATM 27%。看跌减看涨偏斜为 6 点，蝶式为 (32+26)/2−27=2 点。若看涨翼缺失，不能假定其 IV 为零来恢复完整比较。",
		),
		misconception: t(
			"A smooth surface can hide missingness. Identify which cells were measured and which were fitted before using their precision.",
			"平滑曲面可能掩盖缺失。使用数值精度前，先区分测量与拟合。",
		),
		case: (v) => {
			const put = [34, 38, 29, 40][v];
			const call = [28, 30, 31, 28][v];
			const atm = [29, 31, 28, 32][v];
			return {
				brief: t(
					`Same tenor, stated 25Δ convention. Put IV ${put}%, call IV ${call}%, ATM IV ${atm}%. All three are supplied observations.`,
					`同一期限、明确 25Δ 约定，看跌 IV ${put}%、看涨 ${call}%、ATM ${atm}%，三项均有观测。`,
				),
				worksheet: {
					columns: [t("Reference", "参考"), t("IV (%)", "IV（%）")],
					rows: [
						["25Δ put", String(put)],
						["ATM", String(atm)],
						["25Δ call", String(call)],
					],
					caption: t(
						"Synthetic same-expiry observations · percent IV",
						"模拟同到期观测 · IV 百分比",
					),
				},
				questions: [
					n(
						"skew",
						"Put-minus-call skew?",
						"看跌减看涨偏斜？",
						put - call,
						"vol points",
						"波动率点",
						"Put IV − call IV in the stated convention.",
						"按约定，用看跌 IV 减看涨 IV。",
					),
					n(
						"butterfly",
						"Butterfly: average wing IV minus ATM?",
						"蝶式：两翼平均 IV 减 ATM？",
						(put + call) / 2 - atm,
						"vol points",
						"波动率点",
						"(Put IV + call IV)/2 − ATM IV.",
						"（看跌 IV+看涨 IV）/2−ATM IV。",
					),
				],
			};
		},
	},
	{
		id: "iv-rank-percentile",
		sources: [greeks],
		explanation: t(
			"IV rank positions today's standardized IV within a historical low-to-high range: (current−minimum)/(maximum−minimum)×100. IV percentile counts the share of historical observations below the current value; a tie rule must be stated. They need the same IV reference, a defined history window and adequate coverage. One extreme high can lower rank without changing how many ordinary days sit below today. This lesson uses strictly-below percentile and an explicitly supplied sample, not a claim that a short sample is a valid one-year estimate. If the range is zero, rank is undefined under this formula. If history is missing, disclose it rather than presenting a confident percentage.",
			"IV Rank 表示当前标准化 IV 在历史最低到最高区间的位置：(当前−最低)/(最高−最低)×100。IV 百分位统计历史观测低于当前值的比例，必须说明相等值处理规则。两者需要同一 IV 参考、明确窗口及足够覆盖。单个极高值可降低 Rank，却不改变普通日期低于当前值的数量。本课使用严格低于的百分位和明确给定样本，不把短样本当作可靠一年估计。区间为零时该公式无定义，历史缺失应披露。",
		),
		example: t(
			"History 10, 20, 20, 30, 100; current 30. Rank is (30−10)/(100−10) = 22.22%. Strictly-below percentile is 3/5 = 60%. The 100 outlier affects the range much more than the count. A tie at 30 is not counted under this rule.",
			"历史为 10、20、20、30、100，当前 30。Rank=(30−10)/(100−10)=22.22%；严格低于百分位=3/5=60%。100 的异常高值对区间影响较大，对数量影响较小；按此规则，相等的 30 不计入。",
		),
		misconception: t(
			"Rank is a range location; percentile is a frequency. A high value of either is not a direction or profit forecast.",
			"Rank 是区间位置，百分位是频率；任一高值都不是方向或盈利预测。",
		),
		case: (v) => {
			const history = [
				[10, 20, 30, 40, 90],
				[12, 20, 24, 24, 60],
				[10, 15, 20, 25, 50],
				[15, 25, 35, 45, 75],
			][v];
			const current = [30, 28, 25, 35][v];
			return {
				brief: t(
					`Comparable IV history (%): ${history.join(", ")}. Current ${current}%. Percentile counts strictly below today; ties excluded.`,
					`可比 IV 历史（%）：${history.join("、")}，当前 ${current}%。百分位严格统计低于当前值，相等值不计。`,
				),
				questions: [
					n(
						"rank",
						"IV rank, to two decimals?",
						"IV Rank，保留两位小数？",
						((current - Math.min(...history)) /
							(Math.max(...history) - Math.min(...history))) *
							100,
						"percent",
						"百分比",
						"(Current − min)/(max − min) × 100.",
						"（当前−最低）/（最高−最低）×100。",
						0.01,
					),
					n(
						"percentile",
						"Strictly-below percentile?",
						"严格低于百分位？",
						(history.filter((x) => x < current).length / history.length) * 100,
						"percent",
						"百分比",
						"Count strictly lower observations ÷ full supplied sample × 100.",
						"严格较低观测数÷给定完整样本数×100。",
					),
				],
			};
		},
	},
	{
		id: "dex-dei-gex",
		sources: [greeks],
		explanation: t(
			"A trade's delta-equivalent magnitude can be |delta|×contracts×multiplier. This lesson signs that magnitude by a stated inferred-flow convention: bullish positive, bearish negative, neutral excluded from directional net but retained in coverage. Net DEX is classified flow, not the dealer's inventory or the buyer's entire portfolio. Net classified premium instead subtracts bearish dollars from bullish dollars; it has money units, not share equivalents. Opposite signed contributions can cancel while gross activity remains large. DEI here is |net DEX| divided by a positive effective typical share-volume denominator ×100. Direction stays in Net DEX. Index proxies need an explicit scale and methodology because an index itself has no ordinary share volume. ΔOI-based impact changes the numerator's lineage to reported position change; it does not inherit today's tape direction. Missing denominators remain unavailable.",
			"单笔 Delta 等价幅度可用 |Delta|×张数×乘数。本课按推断成交流约定赋符号：看涨正、看跌负，中性不计方向净值，但保留覆盖信息。净 DEX 是分类成交流，不是做市商库存或买方完整组合。分类净权利金则用看涨金额减看跌金额，单位是美元，不是股等价量。相反贡献可抵消，即使总活动很大。本课 DEI=|净 DEX|÷正的有效典型股票成交量×100，方向保留在 DEX。指数本身没有普通股票成交量，代理分母需明确比例与方法。ΔOI 型影响的分子来自报告持仓变化，不能继承今天成交方向。缺失分母应保持不可用。",
		),
		example: t(
			"Bullish delta equivalents 60,000, bearish 20,000, neutral 10,000. Net DEX +40,000; gross represented magnitude 90,000. Effective volume 1,000,000 shares yields DEI 4%. Doubling only that denominator gives 2%, while signed DEX and any separate GEX report stay fixed.",
			"看涨股等价量 60,000、看跌 20,000、中性 10,000。净 DEX +40,000，已代表总幅度 90,000。有效量 1,000,000 股得到 DEI 4%。仅将分母翻倍得 2%，带符号 DEX 及独立 GEX 报告保持不变。",
		),
		misconception: t(
			"Always name whether a number is trade magnitude, signed position delta, or signed aggregate flow. DEI conventions and aggregation methods are not universal across vendors.",
			"明确数字是单笔幅度、带符号持仓 Delta，还是带符号汇总成交流。DEI 约定和聚合方法并非所有供应商统一。",
		),
		case: (v) => {
			const bull = [60000, 35000, 80000, 24000][v];
			const bear = [20000, 65000, 20000, 44000][v];
			const den = [1000000, 1500000, 2000000, 800000][v];
			const bp = [120000, 80000, 150000, 50000][v];
			const sp = [80000, 100000, 90000, 80000][v];
			return {
				brief: t(
					`Classified delta equivalents: bullish ${bull}, bearish ${bear}, neutral 10,000. Effective typical volume ${den} shares. Bullish premium $${bp}; bearish premium $${sp}. Use magnitude DEI and keep direction in net DEX.`,
					`分类股等价量：看涨 ${bull}，看跌 ${bear}，中性 10,000。有效典型量 ${den} 股。看涨权利金 $${bp}，看跌权利金 $${sp}。使用幅度 DEI，方向保留于净 DEX。`,
				),
				questions: [
					n(
						"net-premium",
						"Net classified premium?",
						"分类净权利金？",
						bp - sp,
						"USD",
						"美元",
						"Bullish premium − bearish premium; neutral is not assigned a directional sign.",
						"看涨权利金−看跌权利金，不给中性赋方向符号。",
					),
					n(
						"net",
						"Signed net DEX?",
						"带符号净 DEX？",
						bull - bear,
						"shares-equivalent",
						"股等价量",
						"Bullish − bearish; neutral is not assigned a direction.",
						"看涨−看跌，中性不赋方向。",
					),
					n(
						"dei",
						"DEI magnitude?",
						"DEI 幅度？",
						(Math.abs(bull - bear) / den) * 100,
						"percent",
						"百分比",
						"Absolute net DEX ÷ positive effective volume ×100.",
						"净 DEX 绝对值÷正有效量×100。",
					),
				],
			};
		},
	},
];
