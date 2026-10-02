import "@tanstack/react-start/server-only";
import {
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
			const iv = [28, 35, 22, 31][v];
			const rv = [20, 28, 26, 25][v];
			return {
				brief: t(
					`ALFA's 30-day implied volatility, IV30, is ${iv}%. Its realized volatility over the last 20 sessions, RV20, is ${rv}%. Both are annualized, but IV30 is priced from options and looks forward, while RV20 is measured from past closes.`,
					`ALFA 的 30 天隐含波动率 IV30 为 ${iv}%，最近 20 个交易日的已实现波动率 RV20 为 ${rv}%。两者都已年化，但 IV30 来自期权价格、向前看，RV20 则由过去的收盘价测得。`,
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
								"mispricing",
								"The options are mispriced by that much",
								"期权被错误定价了这么多",
							],
							[
								"context",
								"Options price a different amount of movement ahead than ALFA showed lately; it isn't a forecast of direction",
								"期权对未来波动的定价与 ALFA 近期的表现不同；这不是方向预测",
							],
							[
								"return",
								"How far ALFA will move next",
								"ALFA 接下来会涨跌多少",
							],
						],
						"context",
						"IV30 looks forward from option prices and RV20 back over 20 closes. A gap is a reason to ask why, an event such as earnings, for example, not a measure of mispricing or a direction.",
						"IV30 从期权价格向前看，RV20 回看 20 个收盘价。差值提示你去问原因（例如财报之类的事件），既不衡量错误定价，也不说明方向。",
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
];
