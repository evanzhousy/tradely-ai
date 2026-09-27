import "@tanstack/react-start/server-only";
import {
	choose as c,
	greeks,
	numberQuestion as n,
	oi,
	type TeachingUnit,
	t,
} from "./authoring.server";

export const structureUnits: TeachingUnit[] = [
	{
		id: "gamma-exposure",
		conceptLab: {
			kind: "gamma-exposure",
			intro: t(
				"Build the Oct 18 110 call's GEX from gamma, open interest, spot and an assumed dealer sign, read ALFA's Oct 18 profile by strike, and tell the full chain from a traded-only or incomplete subtotal.",
				"用 Gamma、未平仓量、现价和假设的做市商符号构建 10月18日 110 看涨的 GEX，按行权价读 ALFA 10月18日 的分布，并把完整期权链与仅成交或不完整的小计区分开。",
			),
		},
		sources: [greeks, oi],
		explanation: t(
			"A GEX snapshot combines option gamma with quantities and an explicit position-sign convention. Open interest supplies outstanding contract counts, not observed dealer ownership. Many models assume signs by option type; those assumptions must remain attached to the result. One common dollar-per-1%-move convention is gamma × OI × multiplier × spot squared × 0.01 × assumed sign. Other conventions use different scaling. This course's supplied contribution grid already uses USD of delta exposure per 1% underlying move. Net sums signed contributions; gross sums their absolute values. Opposite signs can cancel. Full-chain structure includes zero-trade contracts; a traded-only sample cannot establish complete GEX. A missing cell prevents a complete total even when a known subtotal is available.",
			"GEX 快照把 Gamma、数量与明确持仓符号约定结合。OI 提供未平仓张数，不提供可观测做市商归属。许多模型按期权类型假设符号，该假设必须与结果同时保留。一种常见的每 1% 变动美元约定为 Gamma×OI×乘数×现价平方×0.01×假设符号；其他约定尺度可不同。本课贡献网格已使用标的变动 1% 的美元 Delta 敞口。净值求有符号和，总幅度求绝对值和；相反符号可抵消。完整链包括零成交合约，仅成交样本不能建立完整 GEX。缺一格时可有已知小计，但不能得到完整总和。",
		),
		example: t(
			"The Oct 18 110 call: gamma 0.0266 × 2,500 open at Friday's close × 100 shares × $100² × 1% = $665k of delta per 1% move, +$665k if dealers are assumed long the calls and −$665k if short. Across ALFA's Oct 18 chain, calls add +$1.79M and puts −$2.31M for a net of −$512k against a gross of $4.10M. Monday's traded 100, 105 and 110 calls alone give +$1.14M, and with the 95 put's open interest missing the known subtotal is +$330k, not a complete total.",
			"10月18日 110 看涨：Gamma 0.0266 × 周五收盘未平仓 2,500 × 100 股 × $100² × 1% = 每 1% 变动 $665k 的 Delta；假设做市商做多看涨为 +$665k，做空则为 −$665k。在 ALFA 10月18日 整条期权链上，看涨贡献 +$1.79M，看跌 −$2.31M，净值 −$512k，总幅度 $4.10M。只看周一有成交的 100、105、110 看涨得 +$1.14M；95 看跌的未平仓量缺失时，已知小计为 +$330k，而不是完整总量。",
		),
		misconception: t(
			"Net and gross are different. A positive net does not imply positive contributions everywhere or certainty about dealer positions.",
			"净值与总幅度不同，净值为正不代表所有位置均为正或做市商持仓已知。",
		),
		case: (v) => {
			const vals = [
				[-20, -30, 0, 40, 70, 0, 0, 0, 0],
				[-40, -60, 0, 30, 50, 0, 0, 0, 0],
				[-10, -30, 0, 70, 90, 0, 0, 0, 0],
				[-35, -15, 0, 60, 40, 0, 0, 0, 0],
			][v];
			const net = vals.reduce((a, b) => a + b, 0);
			const gross = vals.reduce((a, b) => a + Math.abs(b), 0);
			return {
				brief: t(
					"All grid contributions are supplied synthetic model outputs for one fixed chain snapshot, in USD delta exposure per 1% underlying move. Calculate across every expiry, regardless of display filters.",
					"网格全部为同一固定期权链快照的给定模拟模型贡献，单位是标的变动 1% 的美元 Delta 敞口。请按所有到期日计算，不受显示筛选影响。",
				),
				metrics: {
					id: `teaching-gex-${v}`,
					gexOnly: true,
					symbol: "ALFA",
					sessionDate: "2026-09-03",
					modelDate: "2026-09-02",
					netDex: 0,
					denominators: [1000000],
					modelNote: t(
						"Supplied synthetic signs, not observed dealer positions. Snapshot A is complete. Snapshot B may have a gap. Explicit zeros are observations.",
						"给定模拟符号，不是观测到的做市商持仓。快照 A 完整，B 可能有缺口，明确的零是观测。",
					),
					distributions: [
						vals,
						[20, 10, 0, net - 30, 0, 0, 0, 0, v === 2 ? null : 0],
					].map((values, index) => ({
						id: index === 0 ? "a" : "b",
						label: t(
							index === 0 ? "Snapshot A" : "Snapshot B",
							index === 0 ? "快照 A" : "快照 B",
						),
						cells: [7, 30, 60].flatMap((days, row) =>
							[95, 100, 105].map((strike, col) => ({
								id: `g-${strike}-${days}`,
								strike,
								days,
								value: values[row * 3 + col],
							})),
						),
					})),
				},
				questions: [
					n(
						"net",
						"Snapshot A: complete net GEX?",
						"快照 A：完整净 GEX？",
						net,
						"USD delta exposure per 1% move",
						"每 1% 变动美元 Delta 敞口",
						"Sum all signed contributions.",
						"求全部有符号贡献之和。",
					),
					n(
						"gross",
						"Snapshot A: complete gross magnitude?",
						"快照 A：完整总幅度？",
						gross,
						"same units",
						"相同单位",
						"Sum absolute contributions, not the absolute net.",
						"求各项绝对值之和，而非净值的绝对值。",
					),
					c(
						"compare",
						"Compare the COMPLETE net totals of A and B.",
						"比较 A 与 B 的完整净总和。",
						[
							[
								"equal",
								"Equal net totals; the near-expiry signs can still differ.",
								"净总和相等，近到期符号仍可不同。",
							],
							[
								"different",
								"Different complete net totals.",
								"完整净总和不同。",
							],
							[
								"unknown",
								"B has missing coverage; its complete total is unavailable.",
								"B 有缺失覆盖，完整总和不可用。",
							],
						],
						v === 2 ? "unknown" : "equal",
						v === 2
							? "The missing cell is not zero. A known subtotal cannot certify the complete total."
							: "Both complete totals match, but A's 7-day slice is negative and B's is positive. Net aggregation hides location.",
						v === 2
							? "缺失格不是零，已知小计不能确认完整总和。"
							: "完整总和相等，但 A 的 7 天切片为负、B 为正，净汇总会隐藏位置差异。",
					),
				],
			};
		},
	},
	{
		id: "gamma-regimes",
		conceptLab: {
			kind: "gamma-regimes",
			intro: t(
				"Follow the modeled Oct 18 book's hedge as ALFA moves either side of its flip, find the flip by repricing across spot rather than summing strikes, and keep a hedge target apart from the tape and the order book.",
				"跟随模型化的 10月18日 账户在 ALFA 于转折点两侧变动时的对冲，用沿现价重新定价而不是累加行权价来找到转折点，并把对冲目标与成交记录和挂单簿区分开。",
			),
		},
		sources: [greeks],
		explanation: t(
			"A gamma regime summarizes a specified modeled position set, date and expiry scope. Under continuous delta hedging, a long-gamma position tends to require selling underlying after a rise and buying after a fall; a short-gamma position has the opposite local hedge response. This is conditional on the assumed portfolio, hedge objective and other inputs. It does not establish actual dealer inventory, transactions or market impact. A zero-gamma flip is a modeled spot at which repriced aggregate gamma changes sign; it is not simply a cumulative sum crossing on a strike chart. A near-zero net can hide substantial gross exposure. Gamma-squeeze narratives additionally require positions, hedging demand and market liquidity; the label alone does not forecast a squeeze.",
			"Gamma 状态概括指定模型持仓、日期和到期范围。在连续 Delta 对冲假设下，正 Gamma 持仓通常需上涨后卖标的、下跌后买标的；负 Gamma 的局部响应相反。这依赖假设组合、对冲目标和其他输入，不确定实际做市商库存、交易或市场冲击。零 Gamma 转折是重定价汇总 Gamma 改变符号的模型现价，并非行权价图累计和穿零。接近零的净值可掩盖大量总敞口。Gamma 挤压还需持仓、对冲需求和流动性等条件，单凭标签不能预测。",
		),
		example: t(
			"With dealers assumed long ALFA's Oct 18 calls and short its puts, the book's share-gamma at $100 is −5,121 shares per $1: a $1 rise calls for buying about 5,121 shares to stay hedged, with the move. Repriced at each spot, the book turns long gamma near $102.3; a running sum of per-strike values crosses zero near $94 instead. None of this shows that anyone traded, or how 1,600 offered shares would absorb such an order.",
			"假设做市商做多 ALFA 10月18日 的看涨、做空看跌，账户在 $100 的股票 Gamma 为每 $1 −5,121 股：上涨 $1 需要买入约 5,121 股来保持对冲，顺着变动方向。在每个现价重新定价后，账户在约 $102.3 转为正 Gamma；按行权价累加的数值却在约 $94 穿零。这些都不能说明有人交易了，也不能说明 1,600 股的卖方挂单能如何消化这样一笔订单。",
		),
		misconception: t(
			"A modeled flip is not a promised support/resistance line. Change the assumed positions and the model can change without a new print.",
			"模型转折不是保证的支撑阻力。改变假设持仓，即使没有新成交，模型也会变化。",
		),
		case: (v) => {
			const sensitivity = [150, -240, 180, -120][v];
			const move = [0.4, 0.5, -0.5, -0.75][v];
			return {
				brief: t(
					`A supplied portfolio's local delta sensitivity is ${sensitivity} shares per $1 underlying change. Spot changes $${move}. Other inputs fixed; maintain a delta-neutral stock hedge.`,
					`给定组合局部 Delta 敏感度为每 $1 标的变化对应 ${sensitivity} 股。现价变动 $${move}，其他输入固定，维持股票 Delta 中性对冲。`,
				),
				questions: [
					n(
						"hedge",
						"Hedge-share change (buy +, sell −)?",
						"对冲股数变化（买正、卖负）？",
						-sensitivity * move,
						"shares",
						"股",
						"Hedge offsets the modeled delta change: −sensitivity × spot move.",
						"对冲抵消模型 Delta 变化：−敏感度×现价变动。",
					),
					c(
						"certainty",
						"Does this prove the market will move in that direction?",
						"这能证明市场会向该方向变动吗？",
						[
							[
								"yes",
								"Yes, modeled demand is observed buying/selling.",
								"能，模型需求就是实际买卖。",
							],
							[
								"no",
								"No; actual positions, execution and liquidity were not established.",
								"不能，实际持仓、执行与流动性未确定。",
							],
						],
						"no",
						"The calculation is conditional on the supplied portfolio and hedge rule.",
						"计算以给定组合与对冲规则为条件。",
					),
				],
			};
		},
	},
	{
		id: "structural-levels",
		conceptLab: {
			kind: "structural-levels",
			intro: t(
				"Pick ALFA's Oct 18 walls by open interest and by gamma and watch the put wall move, find the payout minimum without reading it as a forecast, and measure one level in dollars, percent and ATR.",
				"分别按未平仓量和 Gamma 选出 ALFA 10月18日 的墙，看看跌墙如何移动；找到支付最小值，但不把它当成预测；并用美元、百分比和 ATR 测量同一个位置。",
			),
		},
		sources: [oi, greeks],
		explanation: t(
			"A wall or concentration label points to a strike selected by a stated exposure or OI rule. Gamma-weighted call/put walls differ from OI-only max pain, which minimizes an expiration payout calculation over a chosen candidate set. A gamma magnet or charm pin is a model-based concentration reference, not guaranteed attraction or pinning. Expiry-scope shares describe how much modeled magnitude lies in a horizon. Always keep the scope, source date and reference spot. Distance in dollars, percent of spot or units of average true range are different measurements. ATR summarizes historical trading ranges with a stated window; it is not expected directional return. Corporate actions and changed price scales can make an unadjusted historical comparison invalid.",
			"墙位或集中度标签按指定敞口/OI 规则选取行权价。Gamma 加权看涨/看跌墙不同于仅基于 OI 的最大痛点，后者在候选价格集合中最小化到期支付。Gamma 磁点或 Charm 钉住也是模型集中参考，不保证吸引或钉价。到期范围占比说明多少模型幅度位于某期限，需保留范围、来源日期和参考现价。美元距离、现价百分比距离和 ATR 单位距离是不同测量。ATR 按窗口汇总历史真实波幅，不是方向收益预测；公司行动与价格尺度变化会令未调整比较失效。",
		),
		example: t(
			"By open interest ALFA's Oct 18 put wall is $90 (3,200 contracts); weighted by gamma it is $95, nearer the money. Paying out Friday's open interest at expiry costs least, $1.17M, if ALFA settles at $100, yet the model's one-standard-deviation range for Oct 18 runs from about $90 to $110. From $100 the $95 put wall is −$5, −5.0% or −3.1 ATR at a 14-session ATR of $1.60.",
			"按未平仓量，ALFA 10月18日 的看跌墙是 $90（3,200 张）；按 Gamma 加权则是更接近平值的 $95。以周五的未平仓量计算，如果 ALFA 结算在 $100，到期支付最少，为 $1.17M；但模型给出的 10月18日 ±1 个标准差范围大约是 $90 到 $110。从 $100 算起，$95 的看跌墙距离为 −$5、−5.0%，或在 14 日 ATR 为 $1.60 时为 −3.1 个 ATR。",
		),
		misconception: t(
			"An OI-only payout minimum does not require gamma and does not identify who owns the contracts. Never turn a model label into guaranteed support or resistance.",
			"仅 OI 支付最小值不需要 Gamma，也不识别持有人。不能把模型标签变成保证支撑阻力。",
		),
		case: (v) => {
			const spot = [102, 108, 97, 106][v];
			const level = 100;
			const atr = [2, 4, 1.5, 3][v];
			const call = [10, 15, 20, 12][v];
			return {
				brief: t(
					`Reference spot ${spot}, level ${level}, ATR ${atr}. Separately, ${call} calls at strike 100, multiplier 100, hypothetical expiration settlement 105. No other contracts in this payout example.`,
					`参考现价 ${spot}，位置 ${level}，ATR ${atr}。另有 ${call} 张行权价 100 看涨、乘数 100，假设到期结算 105。支付示例没有其他合约。`,
				),
				questions: [
					n(
						"distance",
						"Signed level distance in ATR units: (level − spot)/ATR?",
						"带符号 ATR 距离：（位置−现价）/ATR？",
						(level - spot) / atr,
						"ATR units",
						"ATR 单位",
						"Keep the reference spot and ATR window consistent.",
						"保持参考现价与 ATR 窗口一致。",
					),
					n(
						"payout",
						"Total call expiration payout in the supplied example?",
						"给定示例看涨到期总支付？",
						5 * call * 100,
						"USD",
						"美元",
						"max(105−100,0) × call count ×100. This is not a target price.",
						"max(105−100,0)×看涨数量×100，不是目标价。",
					),
				],
			};
		},
	},
	{
		id: "charm-vanna",
		conceptLab: {
			kind: "charm-vanna",
			intro: t(
				"Watch the Oct 18 110 call's delta fall over a week with no trade and no price move, read the same charm quoted per day and per year of time left, and scale the change into the 10:50 spread's position.",
				"看 10月18日 110 看涨的 Delta 在没有成交、价格不动的一周里如何下降，读懂按每天和按每年剩余期限报价的同一个 Charm，并把变化放大到 10:50 价差的持仓上。",
			),
		},
		sources: [greeks],
		explanation: t(
			"Delta can change without a new execution. Charm describes delta's time sensitivity; vanna describes its volatility sensitivity, equivalently a cross-sensitivity of vega to spot under the model. Vendors may quote time derivatives with different signs or scales, so read whether time means elapsed time or remaining maturity. This lesson supplies changes per elapsed calendar day and per one IV percentage point. Multiply the stated sensitivity by its matching input change, then by signed position quantity and multiplier. A charm concentration or pin is an approximate model summary. These derivatives depend on a pricing model, spot, volatility, rates, dividends and time. They are not observed flows or identified dealer hedges.",
			"没有新成交，Delta 也会变化。Charm 描述 Delta 对时间的敏感度，Vanna 描述对波动率的敏感度，在模型下也等价于 Vega 对现价的交叉敏感度。供应商时间导数的符号与尺度可能不同，需区分已过时间与剩余期限。本课给出每经过自然日和每 IV 百分点变化的敏感度。用匹配的输入变化相乘，再乘带符号数量与乘数。Charm 集中或钉住是近似模型汇总，依赖定价模型、现价、波动率、利率、股息与时间，不是观测成交流或已识别对冲。",
		),
		example: t(
			"With ALFA held at $100, the Oct 18 110 call's model delta slides from 0.177 to about 0.144 over a week (charm, roughly −0.004 a day) and to about 0.120 if IV also falls 3 points (vanna, about +0.008 per point). A vendor quoting charm per year of time remaining would show about +1.5 for the same thing. The 10:50 spread, long 500 105 calls and short 500 110 calls, gains a few hundred shares of delta over that week without a trade.",
			"ALFA 保持 $100 时，10月18日 110 看涨的模型 Delta 在一周内从 0.177 降到约 0.144（Charm，约每天 −0.004），如果 IV 同时下降 3 点则降到约 0.120（Vanna，约每点 +0.008）。按每一年剩余期限报价的供应商，会把同一件事显示为约 +1.5。10:50 的价差（多头 500 张 105 看涨、空头 500 张 110 看涨）在这一周里不经任何成交就增加了几百股 Delta。",
		),
		misconception: t(
			"Do not add a per-day number to a per-vol-point number until each has been multiplied by its own input change.",
			"每日量与每波动率点量，应先各自乘相应输入变化后才能相加。",
		),
		case: (v) => {
			const days = [2, 3, 1, 4][v];
			const iv = [1, -2, 3, -1][v];
			const count = [2, 4, 3, 5][v];
			return {
				brief: t(
					`Supplied charm −0.01 delta per elapsed day; vanna +0.02 delta per IV point. ${days} days pass, IV changes ${iv} points. ${count} long contracts, multiplier 100; spot and other inputs fixed.`,
					`给定 Charm 每经过一天 −0.01 Delta，Vanna 每 IV 点 +0.02 Delta。经过 ${days} 天，IV 变动 ${iv} 点。${count} 张多头、乘数 100，现价及其他输入固定。`,
				),
				questions: [
					n(
						"delta-change",
						"Approximate option delta change?",
						"期权 Delta 近似变化？",
						-0.01 * days + 0.02 * iv,
						"delta",
						"Delta",
						"Charm × elapsed days + vanna × IV-point change.",
						"Charm×经过天数+Vanna×IV 点变化。",
					),
					n(
						"position-change",
						"Approximate position delta change?",
						"持仓 Delta 近似变化？",
						(-0.01 * days + 0.02 * iv) * count * 100,
						"shares-equivalent",
						"股等价量",
						"Option delta change × long contracts × multiplier.",
						"期权 Delta 变化×多头张数×乘数。",
					),
				],
			};
		},
	},
];
