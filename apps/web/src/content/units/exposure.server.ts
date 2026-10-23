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

export const exposureUnits: TeachingUnit[] = [
	{
		id: "delta",
		conceptLab: {
			kind: "delta",
			intro: t(
				"Read delta as the slope of the Oct 18 100 call's model value at ALFA $100, carry it through the multiplier into your 16 contracts and Ben's short 10, and see where one slope stops describing a move.",
				"把 Delta 读作 ALFA $100 时 10月18日 100 看涨模型价值的斜率，经过乘数算到你的 16 张和 Ben 的空头 10 张上，并看到一个斜率在哪里不再能描述变动。",
			),
		},
		sources: [greeks],
		explanation: t(
			"Delta approximates an option's price change for a small one-unit move in its underlying, holding other inputs fixed. A quoted delta of 0.50 means about $0.50 per option-share for a $1 underlying move in this example. Multiply by contract count and the stated multiplier for dollar change or share-equivalent position exposure. A long call commonly has positive delta; a long put negative. Shorting the same option reverses the position sign. Delta is local, may change with spot, time and volatility, and is not a promise about the next price or a universally valid probability. Distinguish the option's model delta from a flow convention that first takes absolute exposure and adds a sentiment sign later.",
			"Delta 近似表示其他输入不变时，标的小幅每单位变动引起的期权价格变化。本例 Delta 0.50 表示标的涨 $1，每股期权价格约涨 $0.50。乘以张数和给定乘数可得到金额变化或持仓股等价敞口。多头看涨通常 Delta 为正，多头看跌为负；做空同一期权反转持仓符号。Delta 是局部值，会随现价、时间和波动率变化，不保证下个价格，也不是普遍成立的概率。期权模型 Delta 不同于先取绝对敞口再添加情绪符号的成交流约定。",
		),
		example: t(
			"With ALFA at $100 and 32 days left, the Oct 18 100 call has a model delta of 0.52. Your 16 contracts are 0.52 × 100 × 16 = +832 share-equivalents, so a $0.40 rise is about +$333; Ben, short 10, is −520 and about −$208. After a $10 jump the model reprices the call up $6.92 a share, not the $5.20 delta alone suggests. None of this includes gamma, time, volatility or fees.",
			"ALFA 为 $100、还剩 32 天时，10月18日 100 看涨的模型 Delta 为 0.52。你的 16 张是 0.52 × 100 × 16 = +832 股等价，所以上涨 $0.40 约赚 $333；Ben 空头 10 张，是 −520，约亏 $208。大涨 $10 后，模型把看涨每股重新定价上涨 $6.92，而不是仅用 Delta 给出的 $5.20。这些都没有包含 Gamma、时间、波动率和费用。",
		),
		misconception: t(
			"Multiply by 100 once, for the shares in a contract, and flip the sign for a short position. Delta is the model's price slope; it says nothing about whether a trade was bullish.",
			"只乘一次 100（一张合约的股数），空头要把符号反过来。Delta 是模型的价格斜率，与一笔成交是否看涨无关。",
		),
		case: (v) => {
			const delta = [0.4, -0.35, 0.6, -0.25][v];
			const count = [3, 4, 2, 6][v];
			const short = v === 2;
			const move = [0.5, 0.8, -0.5, 1.2][v];
			const position = delta * count * 100 * (short ? -1 : 1);
			const kind = delta > 0 ? t("calls", "看涨") : t("puts", "看跌");
			return {
				brief: t(
					`You ${short ? "are short" : "hold"} ${count} ALFA ${kind.en}, each with a model delta of ${plain(delta, 2)}. One contract covers 100 shares. ALFA ${move > 0 ? "rises" : "falls"} ${money(Math.abs(move))} and nothing else changes. Estimate with delta alone.`,
					`你${short ? "做空" : "持有"} ${count} 张 ALFA ${kind.zh}，每张模型 Delta 为 ${plain(delta, 2)}。一张合约对应 100 股。ALFA ${move > 0 ? "上涨" : "下跌"} ${money(Math.abs(move))}，其他条件不变。只用 Delta 估算。`,
				),
				questions: [
					n(
						"position-delta",
						"What is your position's delta, in share-equivalents? Use a minus sign if the position gains when ALFA falls.",
						"你的持仓 Delta 是多少股等价？如果 ALFA 下跌时持仓赚钱，请用负号。",
						position,
						"share-equivalents",
						"股等价",
						`${plain(delta, 2)} × ${count} contracts × 100 shares${short ? " × −1 for the short side" : ""} = ${signed(position)} share-equivalents.`,
						`${plain(delta, 2)} × ${count} 张 × 100 股${short ? " × −1（空头）" : ""} = ${signed(position)} 股等价。`,
					),
					n(
						"change",
						"About how much does the position gain or lose? Use a minus sign for a loss.",
						"持仓大约赚或亏多少？亏损请用负号。",
						position * move,
						"dollars",
						"美元",
						`${signed(position)} share-equivalents × ${signedMoney(move)} = ${signedMoney(position * move)}. Delta alone leaves out gamma, time and volatility, so treat it as an estimate.`,
						`${signed(position)} 股等价 × ${signedMoney(move)} = ${signedMoney(position * move)}。仅用 Delta 忽略了 Gamma、时间和波动率，只能算估计。`,
					),
				],
			};
		},
	},
	{
		id: "gamma",
		conceptLab: {
			kind: "gamma",
			intro: t(
				"Watch the Oct 18 100 call's delta climb from 0.52 to 0.60 on a $2 rise, rehedge your 16 calls and Ben's short 10, and see why the 4-day Sep 20 call's gamma gathers at the strike.",
				"看 10月18日 100 看涨的 Delta 在上涨 $2 时从 0.52 升到 0.60，为你的 16 张和 Ben 的空头 10 张重新对冲，并理解为什么只剩 4 天的 9月20日 看涨的 Gamma 聚集在行权价。",
			),
		},
		sources: [greeks],
		explanation: t(
			"Gamma measures how model delta changes with the underlying. Delta is the slope; gamma describes its change. For a small move, new delta is approximately old delta plus gamma times the move. An option-price approximation can include delta × move + one-half × gamma × move squared. Those are different calculations. Long vanilla options generally have positive gamma; the same short position has negative gamma. A hedge offsets a stated position's delta, not an unknown dealer portfolio inferred from a print. Near expiration, at-the-money sensitivities can change sharply; this does not make every 0DTE contract equally sensitive or the local approximation valid for an arbitrarily large move.",
			"Gamma 衡量模型 Delta 随标的的变化。Delta 是斜率，Gamma 描述斜率变化。小幅变动后 Delta≈原 Delta+Gamma×变动。期权价格近似可包含 Delta×变动+半个 Gamma×变动平方，两种计算不同。普通期权多头通常正 Gamma，空头相反。对冲针对给定持仓 Delta，不是凭成交推断未知做市商组合。临近到期的平值敏感度可急剧变化，但不意味着所有 0DTE 同样敏感，也不能把局部近似用于任意大幅变动。",
		),
		example: t(
			"The Oct 18 100 call at ALFA $100 has delta 0.52 and gamma 0.04 per $1. A $2 rise implies delta about 0.60. Your 16 contracts go from +832 to +960 share-equivalents, so a hedge short 832 shares must sell 128 more; Ben, short 10 calls, goes from −520 to −600 and must buy 80. The price estimate is a different sum: 0.52 × 2 + ½ × 0.04 × 2² = $1.12 a share.",
			"ALFA $100 时，10月18日 100 看涨的 Delta 为 0.52，Gamma 为每 $1 0.04。上涨 $2 后 Delta 约为 0.60。你的 16 张从 +832 股等价变为 +960，做空 832 股的对冲需要再卖出 128 股；Ben 空头 10 张看涨，从 −520 变为 −600，需要买入 80 股。价格估计是另一种算法：0.52 × 2 + ½ × 0.04 × 2² = 每股 $1.12。",
		),
		misconception: t(
			"If you are long calls, keeping the hedge flat means selling shares as the stock rises and buying as it falls. That is true of the position you are given; it doesn't tell you how dealers are positioned.",
			"持有多头看涨时，要让对冲保持归零，就得在上涨时卖出股票、下跌时买入。这对给定的持仓成立，但不能说明做市商的实际持仓。",
		),
		case: (v) => {
			const d = [0.45, 0.5, 0.35, 0.6][v];
			const g = [0.03, 0.02, 0.04, 0.01][v];
			const move = [1, 2, -1, 3][v];
			const count = [2, 3, 4, 5][v];
			const change = g * move * count * 100;
			return {
				brief: t(
					`You hold ${count} ALFA calls, each with delta ${plain(d, 2)} and gamma ${plain(g, 2)} per $1, and you're short enough stock that the position starts delta-neutral. One contract covers 100 shares. ALFA ${move > 0 ? "rises" : "falls"} ${money(Math.abs(move))} and nothing else changes.`,
					`你持有 ${count} 张 ALFA 看涨，每张 Delta 为 ${plain(d, 2)}、每 $1 的 Gamma 为 ${plain(g, 2)}，并做空了足够的股票，让持仓一开始 Delta 中性。一张合约对应 100 股。ALFA ${move > 0 ? "上涨" : "下跌"} ${money(Math.abs(move))}，其他条件不变。`,
				),
				questions: [
					n(
						"next-delta",
						"About what is each call's delta after the move?",
						"变动后每张看涨的 Delta 大约是多少？",
						d + g * move,
						"delta",
						"Delta",
						`${plain(d, 2)} + ${plain(g, 2)} × ${signed(move)} = ${plain(d + g * move, 2)}.`,
						`${plain(d, 2)} + ${plain(g, 2)} × ${signed(move)} = ${plain(d + g * move, 2)}。`,
					),
					n(
						"hedge-change",
						"How many shares must you trade to be delta-neutral again? Enter a purchase as positive and a sale as negative.",
						"要重新回到 Delta 中性，需要交易多少股？买入填正数，卖出填负数。",
						-change,
						"shares",
						"股",
						`Your calls' delta changed by ${plain(g, 2)} × ${signed(move)} × ${count} × 100 = ${signed(change)} shares, so the hedge must ${change > 0 ? "sell" : "buy"} ${plain(Math.abs(change))}: ${signed(-change)}.`,
						`看涨的 Delta 变化了 ${plain(g, 2)} × ${signed(move)} × ${count} × 100 = ${signed(change)} 股，所以对冲要${change > 0 ? "卖出" : "买入"} ${plain(Math.abs(change))} 股：${signed(-change)}。`,
					),
				],
			};
		},
	},
	{
		id: "theta-vega-rho",
		conceptLab: {
			kind: "theta-vega-rho",
			intro: t(
				"Watch the Oct 18 100 call lose value day by day, read 35% to 38% as three vol points, and add up delta, gamma, theta and vega for a day when ALFA rises but the call still loses.",
				"看 10月18日 100 看涨一天天损失价值，把 35% 到 38% 读作三个波动率点，并把 Delta、Gamma、Theta 和 Vega 加起来，看 ALFA 上涨时看涨为何仍然亏损。",
			),
		},
		sources: [greeks],
		explanation: t(
			"Theta, vega and rho describe local sensitivities to time, implied volatility and interest rates. Read the quoted convention: this lesson uses theta in dollars per option-share per calendar day, vega per one percentage-point IV change, and rho per one percentage-point rate change. A move from 20% to 23% IV is three vol points, not a 3% relative increase. Signs belong to the stated position and model; shorting an option reverses that option's sensitivities. Other inputs held fixed is a condition of the estimate. A favorable underlying move can be outweighed by time decay or an IV decrease. Rates, dividends, exercise style and model assumptions matter; do not memorize one sign as a universal rule for every product.",
			"Theta、Vega、Rho 分别描述时间、隐含波动率和利率的局部敏感度。先读约定：本课 Theta 为每股期权每自然日美元变化，Vega 为 IV 每变动一个百分点的变化，Rho 为利率每变动一个百分点的变化。IV 从 20% 到 23% 是 3 个波动率点，不是相对增长 3%。符号属于给定持仓与模型，做空反转敏感度。其他输入固定是近似成立的条件。即便标的方向有利，时间损耗或 IV 下跌仍可能造成亏损。利率、股息、行权方式与模型假设都需要说明，不能把一种符号当作所有产品的定律。",
		),
		example: t(
			"The Oct 18 100 call at ALFA $100, 35% IV and 32 days has theta −$0.065 a day and vega $0.118 per vol point. Six days later with ALFA up $1 and IV down 3 points: +$0.52 from delta, +$0.02 from gamma, −$0.39 from theta and −$0.35 from vega sum to −$0.20 a share; the model reprices it at −$0.19. Your 16 contracts lose about $320, and Ben, short 10, gains about $200.",
			"ALFA $100、IV 35%、还剩 32 天时，10月18日 100 看涨的 Theta 为每天 −$0.065，Vega 为每个波动率点 $0.118。六天后 ALFA 上涨 $1、IV 下降 3 点：Delta 带来 +$0.52，Gamma +$0.02，Theta −$0.39，Vega −$0.35，合计每股 −$0.20；模型重新定价为 −$0.19。你的 16 张约亏 $320，Ben 空头 10 张约赚 $200。",
		),
		misconception: t(
			"Vega and rho here are per percentage point, so IV going from 30% to 33% is +3, not +10%. The sum is an estimate that leaves out anything not listed; don't report it as realized P&L.",
			"这里的 Vega 和 Rho 都按每个百分点计，所以 IV 从 30% 到 33% 是 +3，而不是 +10%。合计只是估计，没有包含未列出的因素，不要把它当作实际盈亏。",
		),
		case: (v) => {
			const days = [2, 3, 1, 4][v];
			const iv = [-2, 3, -4, 2][v];
			const rate = [0, 0.5, -0.5, 1][v];
			const perShare = -0.05 * days + 0.12 * iv + 0.08 * rate;
			const ivMove = (
				en: string,
				zh: string,
				points: number,
				[still, up, down]: [string, string, string],
			) =>
				t(
					points === 0
						? `${en} ${still}`
						: `${en} ${points > 0 ? up : down} ${plain(Math.abs(points))} point${Math.abs(points) === 1 ? "" : "s"}`,
					points === 0
						? `${zh}不变`
						: `${zh}${points > 0 ? "上升" : "下降"} ${plain(Math.abs(points))} 个点`,
				);
			const ivText = ivMove("IV", "IV ", iv, [
				"doesn't change",
				"rises",
				"falls",
			]);
			const rateText = ivMove("rates", "利率", rate, [
				"don't change",
				"rise",
				"fall",
			]);
			return {
				brief: t(
					`You hold one ALFA call. Per share, its theta is −$0.05 a day, its vega $0.12 per IV point and its rho $0.08 per rate point. Over the next ${days === 1 ? "day" : `${days} days`}, ${ivText.en} and ${rateText.en}, while ALFA itself doesn't move.`,
					`你持有一张 ALFA 看涨。按每股计，它的 Theta 为每天 −$0.05，Vega 为每个 IV 点 $0.12，Rho 为每个利率点 $0.08。接下来 ${days} 天，${ivText.zh}，${rateText.zh}，ALFA 本身不动。`,
				),
				questions: [
					n(
						"vega-effect",
						"How much does the IV change alone move the call's price, per share? Use a minus sign for a fall.",
						"仅 IV 的变化让看涨每股价格变动多少？下跌请用负号。",
						iv * 0.12,
						"dollars a share",
						"美元/股",
						`$0.12 × ${signed(iv)} points = ${signedMoney(iv * 0.12)} a share.`,
						`$0.12 × ${signed(iv)} 点 = 每股 ${signedMoney(iv * 0.12)}。`,
					),
					n(
						"combined",
						"Adding time, IV and rates, about how much does the whole contract gain or lose? Use a minus sign for a loss.",
						"把时间、IV 和利率加起来，整张合约大约赚或亏多少？亏损请用负号。",
						perShare * 100,
						"dollars",
						"美元",
						`Per share: −$0.05 × ${days} + $0.12 × ${signed(iv)} + $0.08 × ${signed(rate)} = ${signedMoney(perShare)}. Times 100 shares: ${signedMoney(perShare * 100)}.`,
						`每股：−$0.05 × ${days} + $0.12 × ${signed(iv)} + $0.08 × ${signed(rate)} = ${signedMoney(perShare)}。乘以 100 股：${signedMoney(perShare * 100)}。`,
					),
				],
			};
		},
	},
	{
		id: "implied-realized-volatility",
		version: 3,
		conceptLab: {
			kind: "implied-realized-volatility",
			intro: t(
				"Fit the Oct 18 100 call's bid, mid and ask to three implied volatilities, measure ALFA's realized volatility from 20 daily closes, and read the gap between a backward and a forward window.",
				"把 10月18日 100 看涨的买价、中间价和卖价拟合成三个隐含波动率，用 20 个每日收盘价测量 ALFA 的已实现波动率，并读懂向后与向前两个窗口之间的差距。",
			),
		},
		sources: [greeks],
		explanation: t(
			"Implied volatility is an input inferred from an option price through a stated pricing model. It is not directly observed future volatility. Realized volatility is computed from historical returns with a defined window, sampling and annualization. A vendor's unspecified historical-volatility field is not automatically your chosen realized estimate. IV30 is a standardized forward-looking 30-day implied reference; RV20 may be a trailing 20-session estimate. Their horizons differ. Subtracting them gives volatility points, not a return forecast or proof of mispricing. IV can fall after an anticipated event, reducing option value even when the underlying moved favorably. Quotes, trade prices and model assumptions can produce different IV observations.",
			"隐含波动率是把期权价格代入指定定价模型后反推的输入，不是直接观测到的未来波动。已实现波动率由历史收益按明确窗口、采样与年化规则计算。供应商未说明窗口的历史波动字段，不能自动替代你的已实现估计。IV30 是标准化向前 30 天参考，RV20 可为向后 20 个交易日估计，时间范围不同。相减得到波动率点，不是收益预测或错误定价的证明。事件结束后 IV 可能下跌，使期权在标的方向有利时仍贬值。报价、成交价与模型假设也可产生不同 IV。",
		),
		example: t(
			"The Oct 18 100 call's $4.13 mid fits a 34.9% implied volatility; its bid and ask fit 34.3% and 35.6%. ALFA's last 20 daily returns have a standard deviation of 1.52%, so RV20 is about 24% using √252 (29% using √365, 15% over the last 10 sessions). IV 35% against RV20 24% is +11 vol points: options price more movement ahead, earnings included, not an 11% rise or a 46% overpricing.",
			"10月18日 100 看涨的中间价 $4.13 拟合出 34.9% 的隐含波动率；买价和卖价分别拟合出 34.3% 和 35.6%。ALFA 最近 20 个每日收益的标准差为 1.52%，按 √252 计 RV20 约 24%（按 √365 计为 29%，只看最近 10 个交易日为 15%）。IV 35% 对 RV20 24% 相差 +11 个波动率点：期权定价的未来波动更大（包括财报），而不是上涨 11% 或高估 46%。",
		),
		misconception: t(
			"Read the gap in volatility points and keep both windows in view: one is priced forward from options, the other measured backward from closes. A gap is a reason to look closer, not a profit waiting to be taken.",
			"按波动率点读差值，并记住两个窗口：一个是期权向前定价的，一个是从收盘价向后测量的。差值是值得细看的理由，而不是现成的利润。",
		),
		case: (v) => {
			const iv = [28, 24, 31, 26][v];
			const rv = [20, 33, 25, 30][v];
			// ALFA's nearest earnings report: days ahead when positive, sessions ago when negative.
			const report = [12, -6, -26, 18][v];
			const ago = -report;
			const ahead = report > 0;
			const window = ahead ? "iv30" : ago <= 20 ? "rv20" : "neither";
			const more = iv > rv;
			return {
				brief: t(
					`ALFA's 30-day implied volatility, IV30, is ${iv}%. Its realized volatility over the last 20 sessions, RV20, is ${rv}%. Both are annualized, but IV30 is priced from options and looks forward, while RV20 is measured from past closes. ${ahead ? `ALFA reports earnings in ${report} days; its last report was more than 20 sessions ago.` : `ALFA reported earnings ${ago} sessions ago; its next report is more than 30 days away.`}`,
					`ALFA 的 30 天隐含波动率 IV30 为 ${iv}%，最近 20 个交易日的已实现波动率 RV20 为 ${rv}%。两者都已年化，但 IV30 来自期权价格、向前看，RV20 则由过去的收盘价测得。${ahead ? `ALFA 将在 ${report} 天后发布财报，上一次财报在 20 多个交易日之前。` : `ALFA 在 ${ago} 个交易日前发布了财报，下一次财报在 30 天以后。`}`,
				),
				questions: [
					n(
						"spread",
						"How many volatility points is IV30 above RV20? Use a minus sign if it's below.",
						"IV30 比 RV20 高多少个波动率点？如果更低，请用负号。",
						iv - rv,
						"volatility points",
						"波动率点",
						`${iv}% − ${rv}% = ${signed(iv - rv)} points. Two percentages subtract to points, not to a percent change.`,
						`${iv}% − ${rv}% = ${signed(iv - rv)} 个点。两个百分比相减得到的是点数，而不是百分比变化。`,
					),
					c(
						"interpretation",
						"What does that gap tell you?",
						"这个差值说明了什么？",
						[
							[
								"more",
								"Options price more movement over the next 30 days than ALFA showed over the last 20 sessions",
								"期权为未来 30 天定价的波动，比 ALFA 最近 20 个交易日表现出的更大",
								`IV30 is ${iv}%, below RV20's ${rv}%: options price less movement ahead than ALFA just showed, not more.`,
								`IV30 为 ${iv}%，低于 RV20 的 ${rv}%：期权为未来定价的波动比 ALFA 刚刚表现出的更小，而不是更大。`,
							],
							[
								"less",
								"Options price less movement over the next 30 days than ALFA showed over the last 20 sessions",
								"期权为未来 30 天定价的波动，比 ALFA 最近 20 个交易日表现出的更小",
								`IV30 is ${iv}%, above RV20's ${rv}%: options price more movement ahead than ALFA just showed, not less.`,
								`IV30 为 ${iv}%，高于 RV20 的 ${rv}%：期权为未来定价的波动比 ALFA 刚刚表现出的更大，而不是更小。`,
							],
							[
								"mispricing",
								"The options are mispriced by that much",
								"期权被错误定价了这么多",
								"IV and RV measure different windows, one forward and one back. A gap is a reason to ask why, such as an earnings date, not a measure of mispricing.",
								"IV 和 RV 衡量的是不同的窗口，一个向前、一个向后。差值提示你去问原因（例如财报日期），而不是衡量错误定价。",
							],
							[
								"return",
								"How far ALFA will move next",
								"ALFA 接下来会涨跌多少",
								"Volatility measures the size of movement, not where ALFA goes next. The gap compares two windows; it isn't a forecast.",
								"波动率衡量的是变动幅度，而不是 ALFA 接下来去哪。差值是在比较两个窗口，不是预测。",
							],
						],
						more ? "more" : "less",
						`IV30 at ${iv}% is ${more ? "above" : "below"} RV20 at ${rv}%: options price ${more ? "more" : "less"} movement ahead than ALFA showed lately. A gap is a reason to ask why, not a measure of mispricing or a direction.`,
						`IV30 为 ${iv}%，${more ? "高于" : "低于"} RV20 的 ${rv}%：期权为未来定价的波动比 ALFA 近期表现出的${more ? "更大" : "更小"}。差值提示你去问原因，既不衡量错误定价，也不说明方向。`,
					),
					c(
						"window",
						"Which window covers an ALFA earnings report?",
						"哪个窗口包含了 ALFA 的一次财报？",
						[
							[
								"iv30",
								"IV30's: the next 30 days",
								"IV30 的窗口：未来 30 天",
								`The report came out ${ago} sessions ago, and the next is more than 30 days away. IV30 prices only the 30 days ahead, so it holds neither.`,
								`财报在 ${ago} 个交易日前已经发布，下一次在 30 天以后。IV30 只为未来 30 天定价，所以两次都不包含。`,
							],
							[
								"rv20",
								"RV20's: the last 20 sessions",
								"RV20 的窗口：过去 20 个交易日",
								ahead
									? `The report is ${report} days ahead. RV20 is measured from past closes, so it can't hold a report that hasn't happened.`
									: `The report came out ${ago} sessions ago, before RV20's last 20 sessions begin.`,
								ahead
									? `财报还在 ${report} 天之后。RV20 由过去的收盘价测得，不可能包含尚未发生的财报。`
									: `财报在 ${ago} 个交易日前发布，早于 RV20 的最近 20 个交易日。`,
							],
							[
								"neither",
								"Neither window",
								"两个窗口都不包含",
								ahead
									? `The report is ${report} days ahead, inside the 30 days IV30 prices.`
									: `The report came out ${ago} sessions ago, inside RV20's last 20 sessions.`,
								ahead
									? `财报在 ${report} 天之后，落在 IV30 定价的未来 30 天之内。`
									: `财报在 ${ago} 个交易日前发布，落在 RV20 的最近 20 个交易日之内。`,
							],
						],
						window,
						window === "iv30"
							? `The report is ${report} days ahead: inside the 30 days IV30 prices, and in none of the past closes RV20 uses. ${more ? "That's one reason options can price more movement than ALFA just showed." : "Even so, IV30 sits below RV20 here: the last 20 sessions moved more than options price for the month ahead, report included."}`
							: window === "rv20"
								? `The report came out ${ago} sessions ago: inside RV20's last 20 sessions, and already behind the 30 days IV30 prices. A report-day move counts in RV20's closes, but options no longer price it.`
								: `The report came out ${ago} sessions ago, before RV20's 20 sessions, and the next is more than 30 days away, beyond IV30's. Neither window holds a report, so the gap needs another explanation.`,
						window === "iv30"
							? `财报在 ${report} 天之后：落在 IV30 定价的未来 30 天之内，而 RV20 用到的过去收盘价都不包含它。${more ? "这是期权定价的波动可能高于 ALFA 近期表现的一个原因。" : "即便如此，这里 IV30 仍低于 RV20：最近 20 个交易日的波动，超过了期权为未来一个月（含财报）定价的波动。"}`
							: window === "rv20"
								? `财报在 ${ago} 个交易日前发布：落在 RV20 的最近 20 个交易日之内，而且已经在 IV30 定价的未来 30 天之外。财报日的变动计入 RV20 的收盘价，但期权已不再为它定价。`
								: `财报在 ${ago} 个交易日前发布，早于 RV20 的 20 个交易日；下一次在 30 天以后，超出 IV30 的窗口。两个窗口都没有财报，所以差值需要别的解释。`,
					),
				],
			};
		},
	},
	{
		id: "volatility-surface",
		conceptLab: {
			kind: "volatility-surface",
			intro: t(
				"Slice ALFA's implied volatility grid into a smile and a term structure, pick the Oct 18 wings by delta and state the sign of their difference, and mark interpolated cells while leaving unsupported ones blank.",
				"把 ALFA 的隐含波动率网格切成微笑和期限结构，按 Delta 选出 10月18日 的两翼并说明其差值的符号，标明插值的格子，同时让没有支持的格子留空。",
			),
		},
		sources: [greeks],
		explanation: t(
			"A volatility smile is a strike or moneyness slice at one expiry; term structure compares expiries using a comparable reference. A surface joins those dimensions. Delta coordinates such as 25-delta wings depend on model and quote conventions. State the sign convention. Here 25-delta skew means put IV minus call IV. A risk reversal is usually quoted the other way, call IV minus put IV, so it equals minus this skew and is typically negative for equity indices. Butterfly means the average wing IV minus ATM IV. Values are in volatility points. ATM30 is a standardized reference, not necessarily one quoted listed contract. Interpolation is a modeled estimate between supported observations, not a quote. Leave unsupported cells blank. A traded-only smile has different coverage from a fully quoted chain, and a change of side or expiry can change the comparison.",
			"波动率微笑是在同一到期日按行权价或价内外程度切片，期限结构按可比参考比较到期日，曲面组合两维。25 Delta 等坐标依赖模型与报价约定，应说明符号约定。本课 25 Delta 偏斜为看跌 IV 减看涨 IV。风险逆转通常反过来报价，即看涨 IV 减看跌 IV，因此等于该偏斜的相反数，股指通常为负。蝶式指标为两翼平均 IV 减 ATM IV，单位为波动率点。ATM30 是标准化参考，不一定对应单一挂牌合约。插值是有观测支持区间内的模型估计，不是报价；无支持单元格应留空。仅成交的微笑与完整报价链覆盖不同，切换类型或到期日会改变比较。",
		),
		example: t(
			"ALFA's Oct 18 smile runs from 37% at the $90 strike to 33% at $110, and at $100 the term structure rises from 33% (Sep 20) to 35% for the October expiries that span earnings, then falls to 31% (Dec 20). The 25Δ put ($93.55) is at 36.3% and the 25Δ call ($107.45) at 33.5%: skew, put minus call, is +2.8 points and the call-minus-put risk reversal −2.8. Dec 20 $105 has no quote, so ≈30% is an interpolation; the 4-day $90 and $110 wings stay blank.",
			"ALFA 10月18日 的微笑从 $90 行权价的 37% 到 $110 的 33%；在 $100 处，期限结构从 33%（9月20日）升到跨越财报的十月到期日的 35%，再降到 31%（12月20日）。25Δ 看跌（$93.55）为 36.3%，25Δ 看涨（$107.45）为 33.5%：偏斜（看跌减看涨）为 +2.8 点，看涨减看跌的风险逆转为 −2.8 点。12月20日 $105 没有报价，所以 ≈30% 是插值；只剩 4 天的 $90 和 $110 两翼留空。",
		),
		misconception: t(
			"A smooth surface can hide gaps. Before trusting a cell's decimals, check whether it was quoted or filled in by the model.",
			"平滑的曲面可能掩盖缺口。相信某个格子的小数之前，先确认它是实际报价还是模型填出来的。",
		),
		case: (v) => {
			const put = [34, 38, 29, 40][v];
			const call = [28, 30, 31, 28][v];
			const atm = [29, 31, 28, 32][v];
			const wings = (put + call) / 2;
			return {
				brief: t(
					`For one ALFA expiry, the 25-delta put is quoted at ${put}% implied volatility, the at-the-money option at ${atm}% and the 25-delta call at ${call}%. All three are quotes, not interpolations. In this course, skew means put IV minus call IV.`,
					`在 ALFA 的同一个到期日上，25 Delta 看跌的隐含波动率报价为 ${put}%，平值期权为 ${atm}%，25 Delta 看涨为 ${call}%。三者都是报价，不是插值。本课中，偏斜指看跌 IV 减看涨 IV。`,
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
						"What is the 25-delta skew, in volatility points? Use a minus sign if the call's IV is higher.",
						"25 Delta 偏斜是多少个波动率点？如果看涨的 IV 更高，请用负号。",
						put - call,
						"volatility points",
						"波动率点",
						`${put}% − ${call}% = ${signed(put - call)} points.${put < call ? " Here the call wing is the richer one." : ""}`,
						`${put}% − ${call}% = ${signed(put - call)} 个点。${put < call ? "这里看涨一翼更贵。" : ""}`,
					),
					n(
						"butterfly",
						"What is the butterfly: the average of the two wings' IV minus the at-the-money IV?",
						"蝶式值是多少：两翼 IV 的平均值减去平值 IV？",
						wings - atm,
						"volatility points",
						"波动率点",
						`(${put}% + ${call}%) ÷ 2 = ${plain(wings)}%, and ${plain(wings)}% − ${atm}% = ${signed(wings - atm)} points.`,
						`(${put}% + ${call}%) ÷ 2 = ${plain(wings)}%，${plain(wings)}% − ${atm}% = ${signed(wings - atm)} 个点。`,
					),
				],
			};
		},
	},
	{
		id: "iv-rank-percentile",
		conceptLab: {
			kind: "iv-rank-percentile",
			intro: t(
				"Read ALFA's 35% IV30 against a year of weekly closes as a 28% rank and a 92% percentile, drop one 68% week to see which measure moves, and check the window and coverage behind each number.",
				"把 ALFA 35% 的 IV30 放到一年的每周收盘中，读出 28% 的 Rank 和 92% 的百分位；去掉一个 68% 的周，看哪个指标会变；并检查每个数字背后的窗口与覆盖。",
			),
		},
		sources: [greeks],
		explanation: t(
			"IV rank positions today's standardized IV within a historical low-to-high range: (current−minimum)/(maximum−minimum)×100. IV percentile counts the share of historical observations below the current value; a tie rule must be stated. They need the same IV reference, a defined history window and adequate coverage. One extreme high can lower rank without changing how many ordinary days sit below today. This lesson uses strictly-below percentile and an explicitly supplied sample, not a claim that a short sample is a valid one-year estimate. If the range is zero, rank is undefined under this formula. If history is missing, disclose it rather than presenting a confident percentage.",
			"IV Rank 表示当前标准化 IV 在历史最低到最高区间的位置：(当前−最低)/(最高−最低)×100。IV 百分位统计历史观测低于当前值的比例，必须说明相等值处理规则。两者需要同一 IV 参考、明确窗口及足够覆盖。单个极高值可降低 Rank，却不改变普通日期低于当前值的数量。本课使用严格低于的百分位和明确给定样本，不把短样本当作可靠一年估计。区间为零时该公式无定义，历史缺失应披露。",
		),
		example: t(
			"ALFA's IV30 is 35% today; over the past year's weekly closes it ranged from 22% to 68%. IV rank is (35 − 22) ÷ (68 − 22) = 28%, but 48 of 52 weeks were lower, an IV percentile of 92%. Drop the single 68% week and rank jumps to 59% while percentile moves only to 94%. Over just the last 13 weeks, today is above every close.",
			"ALFA 今天的 IV30 为 35%；过去一年的每周收盘在 22% 到 68% 之间。IV Rank 为 (35 − 22) ÷ (68 − 22) = 28%，但 52 周中有 48 周更低，IV 百分位为 92%。去掉唯一一周的 68%，Rank 跳到 59%，百分位只变到 94%。只看最近 13 周，今天高于每一个收盘值。",
		),
		misconception: t(
			"Rank says where today sits between the lowest and highest reading; percentile says how often past readings were lower. A high number on either is not a forecast of direction or profit.",
			"Rank 说明今天位于最低与最高读数之间的什么位置；百分位说明过去的读数有多常低于今天。两者数值高，都不是方向或盈利的预测。",
		),
		case: (v) => {
			const history = [
				[10, 20, 30, 40, 90],
				[12, 20, 24, 24, 60],
				[10, 15, 20, 25, 50],
				[15, 25, 35, 45, 75],
			][v];
			const current = [30, 28, 25, 35][v];
			const low = Math.min(...history);
			const high = Math.max(...history);
			const rank = ((current - low) / (high - low)) * 100;
			const below = history.filter((x) => x < current).length;
			return {
				brief: t(
					`ALFA's IV30 had these five past readings: ${history.join("%, ")}%. Today it is ${current}%. A short sample like this is for practice; a real one would cover about a year. For the percentile, count only readings strictly below today.`,
					`ALFA 的 IV30 过去五次读数为：${history.join("%、")}%。今天是 ${current}%。这么短的样本只用于练习，实际应覆盖约一年。计算百分位时，只计严格低于今天的读数。`,
				),
				questions: [
					n(
						"rank",
						"What is today's IV rank, to two decimals?",
						"今天的 IV Rank 是多少？保留两位小数。",
						rank,
						"percent",
						"%",
						`(${current} − ${low}) ÷ (${high} − ${low}) × 100 = ${plain(rank, 2)}.`,
						`(${current} − ${low}) ÷ (${high} − ${low}) × 100 = ${plain(rank, 2)}。`,
						0.01,
					),
					n(
						"percentile",
						"What is today's IV percentile: the share of past readings strictly below today?",
						"今天的 IV 百分位是多少：过去读数中严格低于今天的比例？",
						(below / history.length) * 100,
						"percent",
						"%",
						`${below} of the ${history.length} readings are below ${current}%: ${below} ÷ ${history.length} × 100 = ${plain((below / history.length) * 100)}.${history.includes(current) ? ` The reading equal to ${current}% doesn't count.` : ""}`,
						`${history.length} 个读数中有 ${below} 个低于 ${current}%：${below} ÷ ${history.length} × 100 = ${plain((below / history.length) * 100)}。${history.includes(current) ? `等于 ${current}% 的读数不计入。` : ""}`,
					),
				],
			};
		},
	},
	{
		id: "dex-dei-gex",
		conceptLab: {
			kind: "dex-dei-gex",
			intro: t(
				"Weight Monday's Oct 18 call prints by delta and sign them by side for a net flow DEX of +17,532 shares, see DEI change with its denominator, and tell this DEX from an open-interest DEX on another platform.",
				"用 Delta 给周一 10月18日 看涨的成交加权并按方向赋号，得到 +17,532 股的净成交流 DEX；看 DEI 如何随分母变化；并把这个 DEX 与另一平台基于未平仓量的 DEX 区分开。",
			),
		},
		sources: [greeks],
		explanation: t(
			"A trade's delta-equivalent magnitude can be |delta|×contracts×multiplier. This lesson signs that magnitude by a stated inferred-flow convention: bullish positive, bearish negative, neutral excluded from directional net but retained in coverage. Net DEX is classified flow, not the dealer's inventory or the buyer's entire portfolio. Net classified premium instead subtracts bearish dollars from bullish dollars; it has money units, not share equivalents. Opposite signed contributions can cancel while gross activity remains large. DEI here is |net DEX| divided by a positive effective typical share-volume denominator ×100. Direction stays in Net DEX. Index proxies need an explicit scale and methodology because an index itself has no ordinary share volume. ΔOI-based impact changes the numerator's lineage to reported position change; it does not inherit today's tape direction. Missing denominators remain unavailable. A naming caution: on many other platforms, DEX means delta exposure computed from open interest under assumed dealer positions, a positioning model like the GEX in the next lesson. Check which definition a source uses before comparing numbers.",
			"单笔 Delta 等价幅度可用 |Delta|×张数×乘数。本课按推断成交流约定赋符号：看涨正、看跌负，中性不计方向净值，但保留覆盖信息。净 DEX 是分类成交流，不是做市商库存或买方完整组合。分类净权利金则用看涨金额减看跌金额，单位是美元，不是股等价量。相反贡献可抵消，即使总活动很大。本课 DEI=|净 DEX|÷正的有效典型股票成交量×100，方向保留在 DEX。指数本身没有普通股票成交量，代理分母需明确比例与方法。ΔOI 型影响的分子来自报告持仓变化，不能继承今天成交方向。缺失分母应保持不可用。命名提示：在许多其他平台上，DEX 指基于未平仓量、按假设做市商持仓计算的 Delta 敞口，是与下一课 GEX 类似的持仓模型。比较数字前，先确认来源使用哪种定义。",
		),
		example: t(
			"Monday's Oct 18 call prints come to 27,425 delta share-equivalents: 17,740 bought at the ask, 208 sold at the bid and 9,477 at mid or without a quote. Net flow DEX is +17,532; counting the 10:50 105/110 spread as one trade makes it +8,532. Against a 1,200,000-share 20-day average that is a DEI of 1.46%, or 2.92% against 600,000 shares by noon. Another platform's open-interest “DEX” of −89,800 is a different measure.",
			"周一 10月18日 看涨的成交合计 27,425 个 Delta 股票等价：17,740 按卖价买入，208 按买价卖出，9,477 以中间价或无报价成交。净成交流 DEX 为 +17,532；把 10:50 的 105/110 价差算作一笔交易则为 +8,532。对照 1,200,000 股的 20 日均量，DEI 为 1.46%；对照截至中午的 600,000 股则为 2.92%。另一平台基于未平仓量的“DEX”为 −89,800，是另一种度量。",
		),
		misconception: t(
			"Say which number you mean: one trade's size, a position's signed delta, or a day's signed flow. DEI conventions and how flow is added up differ between vendors, so name yours.",
			"说清你指的是哪个数：单笔成交的幅度、持仓的带符号 Delta，还是一天带符号的成交流。不同供应商的 DEI 约定和汇总方法不同，要写明你用的是哪种。",
		),
		case: (v) => {
			const bull = [60000, 35000, 80000, 24000][v];
			const bear = [20000, 65000, 20000, 44000][v];
			const den = [1000000, 1500000, 2000000, 800000][v];
			const bp = [120000, 80000, 150000, 50000][v];
			const sp = [80000, 100000, 90000, 80000][v];
			const net = bull - bear;
			const dei = (Math.abs(net) / den) * 100;
			return {
				brief: t(
					`Classifying Monday's ALFA option prints gives ${plain(bull)} bullish delta share-equivalents, ${plain(bear)} bearish and 10,000 neutral. The bullish prints paid ${money(bp, 0)} of premium and the bearish ones ${money(sp, 0)}. ALFA usually trades ${plain(den)} shares a day. Neutral prints carry no direction.`,
					`对周一 ALFA 期权成交分类后，看涨为 ${plain(bull)} 个 Delta 股等价，看跌为 ${plain(bear)}，中性为 10,000。看涨成交支付了 ${money(bp, 0)} 权利金，看跌成交支付了 ${money(sp, 0)}。ALFA 平常每天成交 ${plain(den)} 股。中性成交不带方向。`,
				),
				questions: [
					n(
						"net-premium",
						"What is the net classified premium, bullish minus bearish? Use a minus sign if bearish is larger.",
						"分类净权利金是多少（看涨减看跌）？如果看跌更多，请用负号。",
						bp - sp,
						"dollars",
						"美元",
						`${money(bp, 0)} − ${money(sp, 0)} = ${signedMoney(bp - sp, 0)}. Neutral premium gets no sign.`,
						`${money(bp, 0)} − ${money(sp, 0)} = ${signedMoney(bp - sp, 0)}。中性权利金不带符号。`,
					),
					n(
						"net",
						"What is the net DEX, in share-equivalents? Use a minus sign if bearish is larger.",
						"净 DEX 是多少股等价？如果看跌更多，请用负号。",
						net,
						"share-equivalents",
						"股等价",
						`${plain(bull)} − ${plain(bear)} = ${signed(net)}. The 10,000 neutral share-equivalents don't count toward direction.`,
						`${plain(bull)} − ${plain(bear)} = ${signed(net)}。10,000 个中性股等价不计入方向。`,
					),
					n(
						"dei",
						"What is the DEI: net DEX as a percentage of ALFA's usual daily volume? Leave the sign out.",
						"DEI 是多少：净 DEX 占 ALFA 平常日成交量的百分比？不带符号。",
						dei,
						"percent",
						"%",
						`${plain(Math.abs(net))} ÷ ${plain(den)} × 100 = ${plain(dei)}%. The direction stays with net DEX.`,
						`${plain(Math.abs(net))} ÷ ${plain(den)} × 100 = ${plain(dei)}%。方向保留在净 DEX 中。`,
					),
				],
			};
		},
	},
	{
		id: "expected-move",
		version: 3,
		conceptLab: {
			kind: "expected-move",
			intro: t(
				"Turn ALFA's 35% implied volatility into a ±$10.36 move to Oct 18, set the $8.27 straddle beside it at about 0.8 of that move, and count how often twelve past expiries ended outside one and two standard deviations.",
				"把 ALFA 35% 的隐含波动率换算成到 10月18日 ±$10.36 的变动，把 $8.27 的跨式放在旁边看它约为这个变动的 0.8，再数一数过去 12 个到期日有多少收在一个和两个标准差之外。",
			),
		},
		sources: [greeks],
		explanation: t(
			"Implied volatility is an annual standard deviation of returns under a pricing model. To turn it into a dollar move to expiry, multiply the stock price by the IV and by the square root of the fraction of a year left: S × IV × √(days ÷ 365). This course uses calendar days; desks that use trading days divide by 252, so state your convention. Under the model about 68% of outcomes land within one standard deviation and about 95% within two. An at-the-money straddle prices the average move, which under a normal distribution is about 0.8 of one standard deviation, so traders often quote it as a quick expected move. Both describe the size the options price, not a direction, and real prices jump around news more often than the model allows.",
			"隐含波动率是定价模型下收益率的年化标准差。要把它换算成到期前的美元变动，就用股价乘以 IV，再乘以剩余时间占一年比例的平方根：S × IV × √(天数 ÷ 365)。本课使用自然日；使用交易日的交易台除以 252，所以要说明你的约定。按模型，约 68% 的结果落在一个标准差之内，约 95% 落在两个标准差之内。平值跨式定价的是平均变动，在正态分布下约为一个标准差的 0.8，所以交易者常用它快速报出预期变动。两者描述的都是期权定价的变动幅度，而不是方向；真实价格在消息前后跳空的次数比模型允许的更多。",
		),
		example: t(
			"ALFA at $100 with a 35% IV and 32 days to Oct 18: $100 × 0.35 × √(32 ÷ 365) ≈ $10.36, a range of about $89.64 to $110.36. The Oct 18 100 straddle costs about $8.27 at mid, 0.80 of that move. Over twelve past monthly expiries, 4 ended outside one standard deviation, close to the model's 32%, and the earnings month went 2.2 times its implied move, past two standard deviations.",
			"ALFA 为 $100、IV 35%、距 10月18日 还有 32 天：$100 × 0.35 × √(32 ÷ 365) ≈ $10.36，区间约为 $89.64 至 $110.36。10月18日 100 跨式的中间价约为 $8.27，是这个变动的 0.80。在过去 12 个月度到期日中，有 4 个收在一个标准差之外，接近模型的 32%；财报那个月达到了隐含变动的 2.2 倍，超出了两个标准差。",
		),
		misconception: t(
			"Scale volatility by the square root of time, not by the time itself. An expected-move range is a measure of size, not a forecast, a target or a support level.",
			"波动率要按时间的平方根缩放，而不是按时间本身。预期变动区间衡量的是幅度，不是预测、目标价或支撑位。",
		),
		case: (v) => {
			const spot = [100, 50, 200, 80][v];
			const iv = [35, 40, 25, 60][v];
			const days = [32, 30, 14, 45][v];
			const close = [91, 57.5, 176, 88.5][v];
			const factor = Math.sqrt(days / 365);
			const move = spot * (iv / 100) * factor;
			const straddle = move * 0.8;
			const distance = Math.abs(close - spot);
			const band =
				distance < straddle
					? "inside"
					: distance < move
						? "straddle"
						: distance < 2 * move
							? "one"
							: "two";
			const from = `${money(close)} is ${money(distance)} from ${money(spot, 0)}`;
			const fromZh = `${money(close)} 距 ${money(spot, 0)} 有 ${money(distance)}`;
			return {
				brief: t(
					`A stock trades at ${money(spot, 0)}. Its options expiring in ${days} days imply ${iv}% volatility. Use calendar days over 365 and the course's model.`,
					`一只股票现价 ${money(spot, 0)}。${days} 天后到期的期权隐含波动率为 ${iv}%。按自然日除以 365，并使用本课的模型。`,
				),
				questions: [
					n(
						"move",
						"What is the one-standard-deviation move to expiry, in dollars?",
						"到期前一个标准差的变动是多少美元？",
						move,
						"dollars",
						"美元",
						`${money(spot, 0)} × ${iv}% = ${money(spot * (iv / 100))} a year, × √(${days} ÷ 365) = × ${factor.toFixed(3)}, so about ${money(move)}.`,
						`${money(spot, 0)} × ${iv}% = 一年 ${money(spot * (iv / 100))}，× √(${days} ÷ 365) = × ${factor.toFixed(3)}，约为 ${money(move)}。`,
						0.05,
					),
					n(
						"low",
						"What price marks the lower edge of that one-standard-deviation range?",
						"这个一个标准差区间的下沿是什么价格？",
						spot - move,
						"dollars",
						"美元",
						`${money(spot, 0)} − ${money(move)} = ${money(spot - move)}. Under the model about 16% of outcomes end below it, and 16% above the upper edge, ${money(spot + move)}.`,
						`${money(spot, 0)} − ${money(move)} = ${money(spot - move)}。按模型，约 16% 的结果收在它下方，另有 16% 收在上沿 ${money(spot + move)} 之上。`,
						0.05,
					),
					c(
						"straddle",
						"About what should the at-the-money straddle for that expiry cost?",
						"同一到期日的平值跨式大约应该值多少？",
						[
							[
								"eight",
								`About ${money(move * 0.8)}: 0.8 of the move`,
								`约 ${money(move * 0.8)}：变动的 0.8`,
							],
							[
								"one",
								`About ${money(move)}: the whole move`,
								`约 ${money(move)}：整个变动`,
								`The straddle pays ALFA's distance from the strike, so it prices the average move, about 0.8 of one standard deviation: ${money(move * 0.8)}, not ${money(move)}.`,
								`跨式支付的是 ALFA 与行权价之间的距离，所以定价的是平均变动，约为一个标准差的 0.8：${money(move * 0.8)}，而不是 ${money(move)}。`,
							],
							[
								"sixtyeight",
								`About ${money(move * 0.68)}: 68% of the move`,
								`约 ${money(move * 0.68)}：变动的 68%`,
								"68% is the share of outcomes inside one standard deviation, not a fraction of the move to price. The average move is about 0.8 of it.",
								"68% 是落在一个标准差之内的结果所占比例，而不是用来定价的变动比例。平均变动约为它的 0.8。",
							],
						],
						"eight",
						`A straddle prices the average move, about 0.8 of one standard deviation under the model: roughly ${money(move * 0.8)}. The 68% is the share of outcomes inside one SD, a different number.`,
						`跨式定价的是平均变动，按模型约为一个标准差的 0.8：大约 ${money(move * 0.8)}。68% 是落在一个标准差之内的结果所占比例，是另一个数。`,
					),
					c(
						"close",
						`Suppose the stock ends at ${money(close)} at expiry. Where does that close sit against the move the options price?`,
						`假设股票到期时收在 ${money(close)}。相对于期权定价的变动，这个收盘价落在哪里？`,
						[
							[
								"inside",
								"Within the straddle's expected move, so within one standard deviation too",
								"在跨式的预期变动之内，因此也在一个标准差之内",
								`${from}, more than the straddle's ${money(straddle)}.`,
								`${fromZh}，超过了跨式的 ${money(straddle)}。`,
							],
							[
								"straddle",
								"Beyond the straddle's expected move, but within one standard deviation",
								"超出跨式的预期变动，但仍在一个标准差之内",
								distance < straddle
									? `${from}, less than the straddle's ${money(straddle)}, so the close is still inside it.`
									: `${from}, more than one standard deviation, ${money(move)}, so the close is past one SD as well.`,
								distance < straddle
									? `${fromZh}，小于跨式的 ${money(straddle)}，所以收盘仍在它之内。`
									: `${fromZh}，超过一个标准差 ${money(move)}，所以收盘也已超出一个标准差。`,
							],
							[
								"one",
								"Beyond one standard deviation, but within two",
								"超出一个标准差，但在两个标准差之内",
								distance < move
									? `${from}, less than one standard deviation, ${money(move)}.`
									: `${from}, more than two standard deviations, ${money(2 * move)}.`,
								distance < move
									? `${fromZh}，小于一个标准差 ${money(move)}。`
									: `${fromZh}，超过两个标准差 ${money(2 * move)}。`,
							],
							[
								"two",
								"Beyond two standard deviations",
								"超出两个标准差",
								`${from}, less than two standard deviations, ${money(2 * move)}.`,
								`${fromZh}，小于两个标准差 ${money(2 * move)}。`,
							],
						],
						band,
						band === "inside"
							? `${from}, less than both the straddle's ${money(straddle)} and one standard deviation, ${money(move)}. A close this near is well within the size the options price.`
							: band === "straddle"
								? `${from}: past the straddle's ${money(straddle)} but inside one standard deviation, ${money(move)}. The straddle prices the average move, about 0.8 of one SD, so a close can beat it and still sit where about 68% of outcomes land.`
								: band === "one"
									? `${from}: past one standard deviation, ${money(move)}, but inside two, ${money(2 * move)}. Under the model about 32% of outcomes end beyond one SD and about 5% beyond two.`
									: `${from}: past two standard deviations, ${money(2 * move)}. The model gives that only about 5% of the time, both sides together; real prices jump that far around news more often than the model allows.`,
						band === "inside"
							? `${fromZh}，既小于跨式的 ${money(straddle)}，也小于一个标准差 ${money(move)}。这么近的收盘完全在期权定价的幅度之内。`
							: band === "straddle"
								? `${fromZh}：超出跨式的 ${money(straddle)}，但仍在一个标准差 ${money(move)} 之内。跨式定价的是平均变动，约为一个标准差的 0.8，所以收盘可以超出它，却仍落在约 68% 结果所在的范围里。`
								: band === "one"
									? `${fromZh}：超出一个标准差 ${money(move)}，但在两个标准差 ${money(2 * move)} 之内。按模型，约 32% 的结果收在一个标准差之外，约 5% 收在两个标准差之外。`
									: `${fromZh}：超出两个标准差 ${money(2 * move)}。按模型，这种情况只有约 5%（两侧合计）；真实价格在消息前后跳到这么远的次数，比模型允许的更多。`,
					),
				],
			};
		},
	},
	{
		id: "zero-dte",
		version: 3,
		conceptLab: {
			kind: "zero-dte",
			intro: t(
				"Watch the Sep 20 100 call fall from $0.36 at the open to nothing at the close with ALFA unchanged, see its delta jump from 0.29 to 0.72 on 40 cents with an hour left, and follow 12,000 same-day contracts that never reach open interest.",
				"看 9月20日 100 看涨在 ALFA 不变时，从开盘的 $0.36 跌到收盘一文不值；看还剩一小时时它的 Delta 如何随 40 美分从 0.29 跳到 0.72；再追踪当天成交、永远进不了未平仓量的 12,000 张合约。",
			),
		},
		sources: [greeks, oi],
		explanation: t(
			"A 0DTE option expires the same day it trades. Its time value shrinks with the square root of the time left, so it drains faster each hour, and an at-the-money option that the stock never moves away from is worth nothing at the close. Gamma piles up at the strike as expiry nears: with an hour left, delta can swing from near 0 to near 1 within cents, so hedging a large position near the strike takes a lot of stock on small moves. Open interest is counted overnight, so contracts opened and closed on the same day never appear in it, and an expiring series has no next-day count at all: whatever is open at the close is exercised, assigned or expires. Volume for a 0DTE contract describes the day's trading, not lasting positions.",
			"0DTE 期权在交易当天到期。它的时间价值随剩余时间的平方根收缩，所以每小时流失得更快；股价始终没有离开行权价的平值期权，收盘时一文不值。随着到期临近，Gamma 在行权价附近堆积：还剩一小时时，Delta 可能在几美分之内从接近 0 摆到接近 1，所以在行权价附近对冲大笔持仓，需要在小幅变动中交易大量股票。未平仓量在夜间统计，所以同一天开仓又平仓的合约永远不会出现在其中；到期的系列根本没有第二天的统计：收盘时仍未平仓的合约，要么被行权、被指派，要么作废。0DTE 合约的成交量描述的是当天的交易，而不是持续的持仓。",
		),
		example: t(
			"On Fri Sep 20, the Sep 20 100 call is worth $0.36 at 9:30 with ALFA at $100, $0.26 at 12:30, $0.14 at 3:00 pm and nothing at the close if ALFA stays put. At 3:00 pm its delta goes from 0.29 to 0.72 as ALFA moves from $99.80 to $100.20, against 0.51 to 0.53 for the Oct 18 100 call. 12,000 of these calls trade on Friday, and Monday's open interest shows none of them: the series has expired.",
			"9月20日 周五，ALFA 为 $100 时，9月20日 100 看涨 9:30 值 $0.36，12:30 值 $0.26，下午 3:00 值 $0.14，如果 ALFA 不动，收盘时一文不值。下午 3:00 时，ALFA 从 $99.80 涨到 $100.20，它的 Delta 从 0.29 变到 0.72；而 10月18日 100 看涨只从 0.51 变到 0.53。周五这种看涨成交了 12,000 张，周一的未平仓量里一张都没有：这个系列已经到期了。",
		),
		misconception: t(
			"A 0DTE option isn't a cheap version of a longer one: with hours left, small moves decide almost everything. Its volume says nothing about open interest, because it can't survive the night.",
			"0DTE 期权不是更长期期权的便宜版本：只剩几个小时，小幅变动几乎决定一切。它的成交量与未平仓量无关，因为它熬不过这一夜。",
		),
		case: (v) => {
			const strike = [100, 50, 200, 76][v];
			const close = [100.6, 48.1, 205.4, 72.6][v];
			// The stock an hour before the close.
			const hour = [100, 47.8, 206.5, 73][v];
			const right = v === 3 ? "put" : "call";
			const held = [10, 5, 20, 8][v];
			const volume = [12000, 8000, 30000, 5000][v];
			const worth = Math.max(
				right === "call" ? close - strike : strike - close,
				0,
			);
			const kind = right === "call" ? t("call", "看涨") : t("put", "看跌");
			const one = right === "call" ? "1" : "−1";
			const away = Math.abs(hour - strike);
			const where =
				hour === strike
					? "gamma"
					: (right === "call") === hour > strike
						? "in"
						: "out";
			const atStrike = t(
				`At ${money(hour)} the stock sits right at the strike: a few cents decide whether the options finish in the money, so their delta swings.`,
				`股价 ${money(hour)} 正好在行权价上：几美分就决定这些期权最后是否实值，所以它们的 Delta 会来回摆动。`,
			);
			return {
				brief: t(
					`A stock's ${strike} ${kind.en}s expire today. You bought ${held} of them at 10:00 and hold them through the 4:00 pm close, when the stock is at ${money(close)}. Over the day, ${plain(volume)} of these contracts traded, all opened today. One contract covers 100 shares.`,
					`某股票行权价 ${strike} 的${kind.zh}今天到期。你在 10:00 买入 ${held} 张并持有到下午 4:00 收盘，收盘时股价为 ${money(close)}。这一天里这种合约成交了 ${plain(volume)} 张，全部是当天开的仓。一张合约对应 100 股。`,
				),
				questions: [
					n(
						"close-value",
						"What is each option worth at the close, per share?",
						"收盘时每张期权每股值多少？",
						worth,
						"dollars a share",
						"美元/股",
						worth > 0
							? `It finishes ${money(worth)} in the money: ${right === "call" ? `${money(close)} − ${money(strike, 0)}` : `${money(strike, 0)} − ${money(close)}`} = ${money(worth)}. No time value is left.`
							: `It finishes out of the money, so it's worth nothing: no time value is left at the close.`,
						worth > 0
							? `它收盘时实值 ${money(worth)}：${right === "call" ? `${money(close)} − ${money(strike, 0)}` : `${money(strike, 0)} − ${money(close)}`} = ${money(worth)}。没有任何时间价值了。`
							: "它收盘时是虚值，所以一文不值：收盘时已经没有时间价值。",
						0.01,
					),
					n(
						"shares",
						`How many shares change hands for you when your ${held} options settle?`,
						`你的 ${held} 张期权结算时，你要交收多少股？`,
						worth > 0 ? held * 100 : 0,
						"shares",
						"股",
						worth > 0
							? `In the money by $0.01 or more, they're exercised automatically: ${held} × 100 = ${plain(held * 100)} shares ${right === "call" ? "bought" : "sold"} at ${money(strike, 0)}.`
							: "Out of the money, they expire unexercised: no shares change hands.",
						worth > 0
							? `实值 $0.01 或以上会被自动行权：${held} × 100 = ${plain(held * 100)} 股，以 ${money(strike, 0)} ${right === "call" ? "买入" : "卖出"}。`
							: "虚值的期权到期不会被行权：不交收任何股票。",
					),
					n(
						"monday-oi",
						"How many contracts does this series show in open interest on the next trading day?",
						"下一个交易日，这个系列的未平仓量显示多少张？",
						0,
						"contracts",
						"张",
						`None: the series expired at today's close. The ${plain(volume)} contracts traded today appear in today's volume and never in open interest.`,
						`一张也没有：这个系列在今天收盘时就到期了。今天成交的 ${plain(volume)} 张只出现在今天的成交量里，永远不会出现在未平仓量中。`,
					),
					c(
						"gamma",
						`An hour before the close the stock is at ${money(hour)}. As it moves a few cents, how much does a hedge of these options have to change?`,
						`收盘前一小时，股价为 ${money(hour)}。股价变动几美分时，这些期权的对冲需要调整多少？`,
						[
							[
								"gamma",
								`A lot: their delta swings between near 0 and near ${one} within cents`,
								`很多：它们的 Delta 会在几美分之内在接近 0 和接近 ${one} 之间摆动`,
								`At ${money(hour)} the stock is ${money(away)} from the ${strike} strike. With an hour left, a few cents can't change how these options finish, so their delta stays near ${where === "in" ? one : "0"} instead of swinging.`,
								`股价 ${money(hour)}，距行权价 ${strike} 有 ${money(away)}。只剩一小时，几美分改变不了这些期权的结局，所以它们的 Delta 停在接近 ${where === "in" ? one : "0"} 的位置，不会来回摆动。`,
							],
							[
								"out",
								"Very little: out of the money, their delta stays near 0",
								"很少：它们处于虚值，Delta 停在接近 0",
								where === "gamma"
									? atStrike.en
									: `At ${money(hour)} the ${kind.en}s are ${money(away)} in the money, not out of it, so their delta stays near ${one}, not 0.`,
								where === "gamma"
									? atStrike.zh
									: `股价 ${money(hour)} 时，这些${kind.zh}实值 ${money(away)}，而不是虚值，所以 Delta 停在接近 ${one}，而不是 0。`,
							],
							[
								"in",
								`Very little: in the money, their delta stays near ${one}`,
								`很少：它们处于实值，Delta 停在接近 ${one}`,
								where === "gamma"
									? atStrike.en
									: `At ${money(hour)} the ${kind.en}s are ${money(away)} out of the money, not in it, so their delta stays near 0, not ${one}.`,
								where === "gamma"
									? atStrike.zh
									: `股价 ${money(hour)} 时，这些${kind.zh}虚值 ${money(away)}，而不是实值，所以 Delta 停在接近 0，而不是 ${one}。`,
							],
							[
								"theta",
								"A lot: their time value is still large",
								"很多：它们的时间价值还很大",
								where === "gamma"
									? `With an hour left, little time value remains, and a hedge follows delta, not time value. What takes stock is delta swinging between near 0 and near ${one} within cents.`
									: `With an hour left, little time value remains, and a hedge follows delta, not time value. Here delta stays near ${where === "in" ? one : "0"}, so the hedge barely changes.`,
								where === "gamma"
									? `还剩一小时时，时间价值所剩无几，而且对冲跟随的是 Delta，不是时间价值。需要大量股票的原因是 Delta 在几美分之内在接近 0 和接近 ${one} 之间摆动。`
									: `还剩一小时时，时间价值所剩无几，而且对冲跟随的是 Delta，不是时间价值。这里 Delta 停在接近 ${where === "in" ? one : "0"}，所以对冲几乎不用调整。`,
							],
						],
						where,
						where === "gamma"
							? "Near expiry, gamma piles up at the strike: a few cents decide whether the option ends worth something, so its delta swings, and a hedge has to follow it."
							: `Near expiry, gamma piles up at the strike and fades away from it. ${money(away)} ${where === "in" ? "in" : "out of"} the money with an hour left, a few cents won't decide how these options finish, so their delta stays near ${where === "in" ? one : "0"} and the hedge barely changes${where === "in" ? `: it stays about ${plain(held * 100)} shares` : ""}.`,
						where === "gamma"
							? "临近到期时，Gamma 在行权价附近堆积：几美分就决定期权最后是否有价值，所以它的 Delta 来回摆动，对冲也得跟着调整。"
							: `临近到期时，Gamma 堆积在行权价附近，离开行权价就迅速消退。只剩一小时、${where === "in" ? "实值" : "虚值"} ${money(away)}，几美分决定不了这些期权的结局，所以 Delta 停在接近 ${where === "in" ? one : "0"}，对冲几乎不用调整${where === "in" ? `：始终约为 ${plain(held * 100)} 股` : ""}。`,
					),
				],
			};
		},
	},
];
