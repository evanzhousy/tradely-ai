import "@tanstack/react-start/server-only";
import {
	choose as c,
	greeks,
	money,
	numberQuestion as n,
	oi,
	plain,
	signed,
	signedMoney,
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
			"Net adds the cells with their signs, so opposite cells cancel; gross adds their sizes. A positive net doesn't mean every cell is positive, and neither number tells you what dealers actually hold.",
			"净值按符号把各格相加，相反的格子会抵消；总幅度把各格的大小相加。净值为正不代表每一格都为正，两个数也都不能说明做市商实际持有什么。",
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
			const nonzero = vals.filter((value) => value !== 0);
			const sum = nonzero
				.map((value, i) =>
					i === 0
						? plain(value)
						: value < 0
							? `− ${plain(-value)}`
							: `+ ${plain(value)}`,
				)
				.join(" ");
			return {
				brief: t(
					"Two model snapshots of ALFA's option chain at one moment. Each cell is one strike and expiry's GEX, in dollars of delta per 1% move in ALFA, signed by an assumed dealer position rather than observed holdings. Snapshot A has every cell; Snapshot B may have a gap. A 0 is a real reading of zero, while a blank is missing. Count every expiry, whatever the chart filters show.",
					"ALFA 期权链同一时刻的两个模型快照。每一格是一个行权价与到期日的 GEX，单位是 ALFA 每变动 1% 对应的美元 Delta，符号来自假设的做市商持仓，而不是观测到的持仓。快照 A 每一格都有数据；快照 B 可能有缺口。0 是真实读到的零，空白才是缺失。无论图表筛选显示什么，都要计入每个到期日。",
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
						"What is Snapshot A's net GEX: every cell added with its sign?",
						"快照 A 的净 GEX 是多少：每一格按符号相加？",
						net,
						"dollars per 1% move",
						"美元/每 1% 变动",
						`${sum} = ${signed(net)}. The zero cells add nothing.`,
						`${sum} = ${signed(net)}。为零的格子不增加任何数值。`,
					),
					n(
						"gross",
						"What is Snapshot A's gross GEX: every cell's size added, ignoring signs?",
						"快照 A 的总幅度 GEX 是多少：忽略符号，把每一格的大小相加？",
						gross,
						"dollars per 1% move",
						"美元/每 1% 变动",
						`${nonzero.map((value) => plain(Math.abs(value))).join(" + ")} = ${plain(gross)}, much more than the net's ${plain(Math.abs(net))}: opposite cells cancel in the net but not here.`,
						`${nonzero.map((value) => plain(Math.abs(value))).join(" + ")} = ${plain(gross)}，远大于净值的 ${plain(Math.abs(net))}：相反的格子在净值里抵消，在这里不会。`,
					),
					c(
						"compare",
						"Compare the complete net totals of Snapshots A and B.",
						"比较快照 A 与快照 B 的完整净总和。",
						[
							[
								"equal",
								"They're equal, though the near-expiry cells differ in sign",
								"相等，但近月的格子符号不同",
							],
							["different", "They're different", "不同"],
							[
								"unknown",
								"B has a missing cell, so its complete total isn't known",
								"B 有一格缺失，所以它的完整总和未知",
							],
						],
						v === 2 ? "unknown" : "equal",
						v === 2
							? "One of B's cells is blank, and a blank isn't zero. B's known cells give a subtotal, but they can't confirm a complete total."
							: "Both complete totals match, yet A's 7-day row is negative and B's is positive. A net total hides where the exposure sits.",
						v === 2
							? "B 有一格是空白，而空白不等于零。B 已知的格子能给出小计，但无法确认完整总和。"
							: "两个完整总和相同，但 A 的 7 天那一行为负，B 的为正。净总和会掩盖敞口所在的位置。",
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
			"A modeled flip isn't a promised support or resistance line. Change the assumed positions and the model changes, without a single new trade.",
			"模型的转折点不是保证的支撑或阻力。改变假设的持仓，模型就会变，哪怕没有一笔新成交。",
		),
		case: (v) => {
			const sensitivity = [150, -240, 180, -120][v];
			const move = [0.4, 0.5, -0.5, -0.75][v];
			const drift = sensitivity * move;
			return {
				brief: t(
					`A model says a book's delta changes by ${signed(sensitivity)} shares for each $1 ALFA moves, so the book is ${sensitivity > 0 ? "long" : "short"} gamma. Its owner keeps it delta-neutral with ALFA stock. ALFA ${move > 0 ? "rises" : "falls"} ${money(Math.abs(move))} and nothing else changes.`,
					`一个模型显示，ALFA 每变动 $1，某账户的 Delta 变化 ${signed(sensitivity)} 股，所以这个账户是${sensitivity > 0 ? "正" : "负"} Gamma。账户持有人用 ALFA 股票保持 Delta 中性。ALFA ${move > 0 ? "上涨" : "下跌"} ${money(Math.abs(move))}，其他条件不变。`,
				),
				questions: [
					n(
						"hedge",
						"How many shares must the hedge trade? Enter a purchase as positive and a sale as negative.",
						"对冲需要交易多少股？买入填正数，卖出填负数。",
						-drift,
						"shares",
						"股",
						`The book's delta changes by ${signed(sensitivity)} × ${signedMoney(move)} = ${signed(drift)} shares, so the hedge ${drift > 0 ? "sells" : "buys"} ${plain(Math.abs(drift))}: ${signed(-drift)}. ${sensitivity > 0 ? "Long gamma trades against the move." : "Short gamma trades with the move."}`,
						`账户的 Delta 变化 ${signed(sensitivity)} × ${signedMoney(move)} = ${signed(drift)} 股，所以对冲要${drift > 0 ? "卖出" : "买入"} ${plain(Math.abs(drift))} 股：${signed(-drift)}。${sensitivity > 0 ? "正 Gamma 逆着变动方向交易。" : "负 Gamma 顺着变动方向交易。"}`,
					),
					c(
						"certainty",
						"Does this show that ALFA will keep moving that way?",
						"这能说明 ALFA 会继续朝那个方向变动吗？",
						[
							[
								"yes",
								"Yes: the model's hedge demand is real buying or selling",
								"能：模型的对冲需求就是真实的买卖",
							],
							[
								"no",
								"No: the real positions, trades and liquidity aren't known",
								"不能：真实的持仓、成交和流动性都未知",
							],
						],
						"no",
						"The calculation holds for the book and hedge rule you were given. Whether anyone holds that book, actually trades the hedge, or moves the price with it are separate questions the model can't answer.",
						"这个计算只对给定的账户和对冲规则成立。是否真有人持有这样的账户、是否真的执行了对冲、是否因此推动了价格，都是模型回答不了的问题。",
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
			"Max pain uses only open interest: it needs no gamma and says nothing about who owns the contracts. No model level is guaranteed support or resistance.",
			"最大痛点只用未平仓量：它不需要 Gamma，也说明不了谁持有这些合约。没有哪个模型位置是保证的支撑或阻力。",
		),
		case: (v) => {
			const spot = [102, 108, 97, 106][v];
			const level = 100;
			const atr = [2, 4, 1.5, 3][v];
			const call = [10, 15, 20, 12][v];
			const distance = (level - spot) / atr;
			return {
				brief: t(
					`ALFA trades at ${money(spot)}. A level you're watching sits at $100, and ALFA's average true range over the last 14 sessions is ${money(atr)}. Separately, picture ${call} ALFA 100 calls settling with ALFA at $105 at expiry, with no other contracts involved.`,
					`ALFA 现价 ${money(spot)}。你关注的一个位置在 $100，ALFA 最近 14 个交易日的平均真实波幅（ATR）为 ${money(atr)}。另外，设想 ${call} 张 ALFA 100 看涨在 ALFA 为 $105 时到期结算，不涉及其他合约。`,
				),
				questions: [
					n(
						"distance",
						"How far is the $100 level from ALFA, in ATRs? Use a minus sign if the level is below ALFA.",
						"$100 的位置距离 ALFA 有多少个 ATR？如果位置低于 ALFA，请用负号。",
						distance,
						"ATRs",
						"个 ATR",
						`($100 − ${money(spot)}) ÷ ${money(atr)} = ${signedMoney(level - spot)} ÷ ${money(atr)} = ${signed(distance)} ATR${Math.abs(distance) === 1 ? "" : "s"}. Use the same session's price and ATR.`,
						`($100 − ${money(spot)}) ÷ ${money(atr)} = ${signedMoney(level - spot)} ÷ ${money(atr)} = ${signed(distance)} 个 ATR。价格和 ATR 要用同一时点的。`,
					),
					n(
						"payout",
						"What do those calls pay out in total at expiry?",
						"这些看涨到期时一共支付多少？",
						5 * call * 100,
						"dollars",
						"美元",
						`Each call is worth $105 − $100 = $5 a share, so $5 × 100 × ${call} = ${money(5 * call * 100, 0)}. A payout total is arithmetic, not a forecast of where ALFA will settle.`,
						`每张看涨每股值 $105 − $100 = $5，所以 $5 × 100 × ${call} = ${money(5 * call * 100, 0)}。支付总额只是算术，不是对 ALFA 结算价的预测。`,
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
			"A per-day number and a per-vol-point number can't be added as they stand. Multiply each by its own change first, then add.",
			"每天的数和每个波动率点的数不能直接相加。先各自乘以对应的变化，再相加。",
		),
		case: (v) => {
			const days = [2, 3, 1, 4][v];
			const iv = [1, -2, 3, -1][v];
			const count = [2, 4, 3, 5][v];
			const change = -0.01 * days + 0.02 * iv;
			return {
				brief: t(
					`You hold ${count} ALFA calls. The model gives each a charm of −0.01 delta for every day that passes and a vanna of +0.02 delta per IV point. Over the next ${days === 1 ? "day" : `${days} days`}, IV ${iv > 0 ? "rises" : "falls"} ${plain(Math.abs(iv))} point${Math.abs(iv) === 1 ? "" : "s"} while ALFA stays where it is, and nobody trades your calls.`,
					`你持有 ${count} 张 ALFA 看涨。模型给出每张的 Charm 为每过一天 −0.01 Delta，Vanna 为每个 IV 点 +0.02 Delta。接下来 ${days} 天，IV ${iv > 0 ? "上升" : "下降"} ${plain(Math.abs(iv))} 个点，ALFA 不动，你的看涨也没有任何成交。`,
				),
				questions: [
					n(
						"delta-change",
						"About how much does each call's delta change? Use a minus sign for a fall.",
						"每张看涨的 Delta 大约变化多少？下降请用负号。",
						change,
						"delta",
						"Delta",
						`Charm: −0.01 × ${days} = ${signed(-0.01 * days)}. Vanna: +0.02 × ${signed(iv)} = ${signed(0.02 * iv)}. Together: ${signed(change)}.`,
						`Charm：−0.01 × ${days} = ${signed(-0.01 * days)}。Vanna：+0.02 × ${signed(iv)} = ${signed(0.02 * iv)}。合计：${signed(change)}。`,
					),
					n(
						"position-change",
						"About how much does your position's delta change, in share-equivalents? Use a minus sign for a fall.",
						"你持仓的 Delta 大约变化多少股等价？下降请用负号。",
						change * count * 100,
						"share-equivalents",
						"股等价",
						`${signed(change)} × ${count} contracts × 100 shares = ${signed(change * count * 100)} share-equivalents, without a single trade.`,
						`${signed(change)} × ${count} 张 × 100 股 = ${signed(change * count * 100)} 股等价，没有任何一笔成交。`,
					),
				],
			};
		},
	},
];
