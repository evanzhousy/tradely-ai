import "@tanstack/react-start/server-only";

import {
	basics,
	choose as c,
	money,
	numberQuestion as n,
	oi,
	orders,
	plain,
	quotes,
	signed,
	signedMoney,
	type TeachingUnit,
	t,
} from "./authoring.server";

export const flowUnits: TeachingUnit[] = [
	{
		id: "session-flow-vs-structure",
		conceptLab: {
			kind: "session-flow-vs-structure",
			intro: t(
				"Watch trades open, transfer and close contracts, see when the daily open-interest count arrives, and compare one fixed series with a rolling expiry bucket.",
				"观察成交如何开仓、换手与平仓，看每日未平仓量统计何时发布，并比较固定序列与滚动到期桶。",
			),
		},
		sources: [oi],
		explanation: t(
			"Volume counts contracts executed during a session. Open interest counts contracts still outstanding at a report time. If both parties open, OI increases; if both close, it decreases; if one opens while the other closes, the contract transfers and OI stays unchanged. Each execution still contributes its contract count to volume. Exercise, assignment and expiration can also remove contracts. A later OI report sums all relevant activity, so it cannot identify the owner or purpose of one print. Compare the same contract series and report interval. Two rolling '14–30 DTE' buckets can contain different expiries on different dates even when the labels match.",
			"成交量统计时段内执行的合约数量，未平仓量统计报告时点仍存续的合约。双方开仓使 OI 增加，双方平仓使其减少，一方开仓另一方平仓则转移合约，OI 不变；每笔仍按张数计入成交量。行权、被指派和到期也可能移除合约。后续 OI 汇总全部相关活动，不能识别某笔的持有人或目的。比较需保持同一合约序列和报告区间。不同日期的滚动 14–30 DTE 桶，即使标签相同也可能包含不同到期日。",
		),
		example: t(
			"Start with OI 100. Ten open/open contracts add 10, four close/close remove 4, and six transferred contracts change no OI. Volume is 20; ending OI is 106. Remove the open/close flags and the same volume no longer determines ending OI. Yesterday's reported 100 does not update merely because today's volume counter moves.",
			"初始 OI 为 100。10 张双方开仓增加 10，4 张双方平仓减少 4，6 张转移不改变 OI。成交量为 20，期末 OI 为 106。删除开平仓标记后，同样成交量便不能确定期末 OI。昨日报告的 100 不会随今日成交计数器自动更新。",
		),
		misconception: t(
			"A rolling expiry bucket can change because different expiries moved into it. A change in reported open interest is a net figure, not a count of one trader's new positions.",
			"滚动到期桶的变化，可能只是因为换了一批到期日。报告的未平仓量变化是净值，不是某个交易者新开仓的数量。",
		),
		case: (v) => {
			const opened = [12, 24, 15, 31][v];
			const closed = [5, 9, 19, 11][v];
			const transfer = [8, 7, 6, 9][v];
			const volume = opened + closed + transfer;
			return {
				brief: t(
					`One ALFA call series starts the day with open interest of 500. Today's complete trade record shows ${opened} contracts where both sides opened, ${closed} where both sides closed, and ${transfer} where one side opened and the other closed. Nothing was exercised or expired.`,
					`一个 ALFA 看涨序列开盘时未平仓量为 500。今天完整的成交记录显示：${opened} 张是双方都开仓，${closed} 张是双方都平仓，${transfer} 张是一方开仓、另一方平仓。没有行权，也没有到期。`,
				),
				flowStructure: {
					id: `oi-ledger-${v}`,
					scope: "ALFA calls · fixed October 16 series",
					sessionDate: "2026-09-03",
					reportedOi: {
						value: 500,
						asOf: "2026-09-02",
						scope: "ALFA calls · fixed October 16 series",
					},
					previousOi: null,
					gex: null,
					note: t(
						"Illustrative September 3 volume replay. The displayed OI is the prior report, fixed at 500. Only the complete supplied opening/closing ledger lets you calculate a hypothetical ending OI; the replay does not relabel it as reported.",
						"9 月 3 日成交量示意回放，显示 OI 为前期报告 500。只有完整给定的开平仓台账才能算出假设期末 OI，回放不会将其冒称已报告。",
					),
					replay: {
						durationMs: 14000,
						openMinute: 570,
						closeMinute: 960,
						frames: [0, 0.25, 0.5, 0.75, 1].map((position) => ({
							position,
							volume: Math.round((opened + closed + transfer) * position),
						})),
					},
				},
				questions: [
					n(
						"volume",
						"How many contracts traded today?",
						"今天成交了多少张？",
						volume,
						"contracts",
						"张",
						`${opened} + ${closed} + ${transfer} = ${volume}. Every trade counts in volume, transfers included.`,
						`${opened} + ${closed} + ${transfer} = ${volume}。每笔成交都计入成交量，包括换手。`,
					),
					n(
						"ending-oi",
						"What is open interest at the end of the day?",
						"收盘时未平仓量是多少？",
						500 + opened - closed,
						"contracts",
						"张",
						`500 + ${opened} − ${closed} = ${500 + opened - closed}. The ${transfer} transferred contracts changed owners, not the count.`,
						`500 + ${opened} − ${closed} = ${500 + opened - closed}。换手的 ${transfer} 张只换了持有人，没有改变数量。`,
					),
					c(
						"no-flags",
						"If you knew only today's volume, could you work out the ending open interest?",
						"如果只知道今天的成交量，能算出收盘时的未平仓量吗？",
						[
							["yes", "Yes: add the volume to 500", "能：把成交量加到 500 上"],
							[
								"no",
								"No: you'd need to know which trades opened and which closed",
								"不能：需要知道哪些成交是开仓、哪些是平仓",
							],
							[
								"minus",
								"Yes: subtract the volume from 500",
								"能：用 500 减去成交量",
							],
						],
						"no",
						`A volume of ${volume} fits any ending from ${500 - volume}, if every trade closed, to ${500 + volume}, if every trade opened. Only the open and close record pins it at ${500 + opened - closed}.`,
						`${volume} 的成交量对应的收盘未平仓量，可以从 ${500 - volume}（全部平仓）到 ${500 + volume}（全部开仓）。只有开平仓记录才能确定它是 ${500 + opened - closed}。`,
					),
				],
			};
		},
	},
	{
		id: "trade-records",
		conceptLab: {
			kind: "trade-records",
			intro: t(
				"Build one row from the 105 call's prints, see why the weighted price is the one paid, and replay a feed full of duplicates, cancels and corrections.",
				"用 105 看涨的成交建立一行聚合，理解为何加权价格才是实际成交价，再回放充满重复、撤销与更正的数据。",
			),
		},
		sources: [quotes, oi],
		explanation: t(
			"A raw print represents one reported execution. An aggregate can combine several prints according to a stated grouping rule. Its contract count and premium are sums; its trade count records the represented prints. A quantity-weighted execution price differs from an unweighted average. Do not aggregate unlike contracts or mix price units. Duplicate messages and corrections can change a feed without new economic activity; exchange time and receipt time can differ. Execution conditions such as sweeps, blocks and complex orders come in the next lesson; a cluster of rows still does not prove common ownership.",
			"原始成交是一条执行报告，聚合记录可按明确规则合并多笔。张数与权利金应求和，成交笔数记录所代表原始笔数。按数量加权价格不同于简单平均。不能合并不同合约或不同价格单位。重复消息与更正可能改变数据，却没有新增经济成交；交易所时间与接收时间也可不同。扫单、大宗与复杂订单等成交条件在下一课讲解；多行聚集仍不证明共同持有。",
		),
		example: t(
			"Two same-contract prints: 5 at $2.00 and 500 at $2.15, multiplier 100. Total size 505, premium $108,500, trade count 2, weighted price $2.1485. The simple $2.075 average is wrong for those quantities. The grouping rule says nothing about whether the orders belonged to one strategy.",
			"同合约两笔：5 张 $2.00、500 张 $2.15，乘数 100。总量 505、权利金 $108,500、笔数 2、加权价格 $2.1485。数量不等时简单平均 $2.075 不正确，分组规则也不能证明同一策略。",
		),
		misconception: t(
			"One aggregate row isn't necessarily one order. Prints that repeat are a reason to look for a link, not proof of one.",
			"一行聚合记录不一定是一张订单。重复出现的成交提示你去找关联，但本身不是关联的证据。",
		),
		case: (v) => {
			const a = [10, 20, 15, 25][v];
			const b = [30, 10, 45, 15][v];
			const premium = (a * 2 + b * 3) * 100;
			const weighted = (a * 2 + b * 3) / (a + b);
			return {
				brief: t(
					`Two prints in the same ALFA call: ${a} contracts at $2.00 and ${b} at $3.00. Both are unique, uncorrected reports, and one contract covers 100 shares.`,
					`同一个 ALFA 看涨有两笔成交：${a} 张成交在 $2.00，${b} 张成交在 $3.00。两条都是唯一且未更正的报告，一张合约对应 100 股。`,
				),
				questions: [
					n(
						"premium",
						"What premium do the two prints add up to?",
						"两笔成交的权利金合计多少？",
						premium,
						"dollars",
						"美元",
						`$2.00 × ${a} × 100 = ${money(a * 200, 0)}, and $3.00 × ${b} × 100 = ${money(b * 300, 0)}: ${money(premium, 0)} together.`,
						`$2.00 × ${a} × 100 = ${money(a * 200, 0)}，$3.00 × ${b} × 100 = ${money(b * 300, 0)}：合计 ${money(premium, 0)}。`,
					),
					n(
						"weighted",
						"What is the average price per share, weighted by contracts, to four decimals?",
						"按张数加权的每股平均价格是多少？保留四位小数。",
						weighted,
						"dollars a share",
						"美元/股",
						`($2.00 × ${a} + $3.00 × ${b}) ÷ ${a + b} = ${money(weighted, 4)}. The simple average, $2.50, ignores that ${a > b ? "more traded at $2.00" : "more traded at $3.00"}.`,
						`($2.00 × ${a} + $3.00 × ${b}) ÷ ${a + b} = ${money(weighted, 4)}。简单平均 $2.50 忽略了${a > b ? "更多张数成交在 $2.00" : "更多张数成交在 $3.00"}。`,
						0.0001,
					),
					c(
						"link",
						"Does adding these prints into one row show they were one strategy?",
						"把这两笔成交合成一行，能说明它们属于同一个策略吗？",
						[
							[
								"yes",
								"Yes: matching times show one owner",
								"能：时间一致说明属于同一个人",
							],
							[
								"no",
								"No: grouping prints doesn't show they were linked",
								"不能：把成交分组不能说明它们有关联",
							],
						],
						"no",
						"Nothing here links the prints to one order or strategy. An aggregate row follows a grouping rule; a link needs its own evidence, such as a multi-leg condition code.",
						"这里没有任何信息把两笔成交连到同一张订单或同一个策略。聚合行只是遵循分组规则；关联需要单独的证据，比如多腿条件代码。",
					),
				],
			};
		},
	},
	{
		id: "execution-conditions",
		conceptLab: {
			kind: "execution-conditions",
			intro: t(
				"Follow one order sweeping three venues, set a 500-contract block against the size that was displayed, and read its two legs as one spread.",
				"追踪一张扫过三个场所的订单，把 500 张大单与展示数量对比，再把它的两条腿作为一笔价差来解读。",
			),
		},
		sources: [orders, quotes],
		explanation: t(
			"Execution conditions describe how a trade was executed. A sweep routes one order across several venues at once, often as intermarket sweep orders (ISO); each fill prints separately, and later fills can pay more than the best displayed price. A block is a large trade, often arranged away from the screen and printed through an auction or cross, so its price can sit inside, at or outside the displayed quote. Complex orders price several legs, or options and stock, as one package; individual leg prices can fall outside their own quotes while the package trades inside its market. Each code needs the source's own definition. None of these labels identifies who traded, how informed they were, or whether a position opened.",
			"成交条件描述一笔交易如何执行。扫单把一张订单同时路由到多个场所，常以跨市场扫单指令（ISO）发出；每次成交分别打印，后面的成交可能高于最优展示价格。大宗交易通常先在屏幕外撮合，再通过竞价或交叉成交打印，因此价格可能在展示报价之内、等于报价或超出报价。复杂订单把多条腿、或期权与股票作为一个整体定价；单腿价格可能超出各自报价，而整体仍在组合市场之内成交。每个代码都需要来源自己的定义。这些标签都不能说明谁在交易、掌握多少信息，或是否开了新仓。",
		),
		example: t(
			"A 40-contract buy sweeps three venues: 10 at $0.93, 20 at $0.95 and 10 at $0.98. That is one order and three prints: 40 contracts, $3,810 premium and a $0.9525 average price. Separately, a 105/110 call spread bought for $1.25 net printed its legs at $2.15 and $0.90 while the package traded inside its $1.12–$1.30 market; legs can even print outside their own quotes.",
			"一张 40 张的买单扫过三个场所：$0.93 成交 10 张、$0.95 成交 20 张、$0.98 成交 10 张。这是一张订单、三笔成交：共 40 张、权利金 $3,810、均价 $0.9525。另外，以净价 $1.25 买入的 105/110 看涨价差，两条腿分别打印在 $2.15 和 $0.90，而整体在 $1.12–$1.30 的组合市场内成交；单腿甚至可以超出各自报价成交。",
		),
		misconception: t(
			"Urgent routing isn't proof of conviction, and a big block isn't proof of an institution or inside information. Read a complex order's legs as one package.",
			"急迫的路由不能证明信心，大宗交易也不能证明是机构或有内幕信息。复杂订单的各条腿要作为一个整体来读。",
		),
		case: (v) => {
			const [a, b, d] = [
				[20, 15, 15],
				[20, 15, 5],
				[10, 15, 20],
				[25, 10, 15],
			][v];
			const premium = 210 * a + 211 * b + 212 * d;
			const average = premium / (100 * (a + b + d));
			return {
				brief: t(
					`One buy order sweeps three venues within milliseconds: ${a} ALFA calls at $2.10, ${b} at $2.11 and ${d} at $2.12. Each fill prints separately with a sweep condition, and one contract covers 100 shares.`,
					`一张买单在几毫秒内扫过三个场所：${a} 张 ALFA 看涨成交在 $2.10，${b} 张在 $2.11，${d} 张在 $2.12。每次成交都带扫单条件分别打印，一张合约对应 100 股。`,
				),
				questions: [
					n(
						"premium",
						"What premium did the order pay across its three prints?",
						"这张订单在三笔成交中一共支付了多少权利金？",
						premium,
						"dollars",
						"美元",
						`$2.10 × ${a} × 100 + $2.11 × ${b} × 100 + $2.12 × ${d} × 100 = ${money(premium, 0)}. Three prints, one order.`,
						`$2.10 × ${a} × 100 + $2.11 × ${b} × 100 + $2.12 × ${d} × 100 = ${money(premium, 0)}。三笔成交，一张订单。`,
					),
					n(
						"average",
						"What average price per share did it pay, weighted by contracts, to four decimals?",
						"按张数加权，它平均每股付了多少？保留四位小数。",
						Math.round(average * 10000) / 10000,
						"dollars a share",
						"美元/股",
						`${money(premium, 0)} ÷ (100 × ${a + b + d}) = ${money(average, 4)}. The later fills paid more than the best price shown when the order arrived.`,
						`${money(premium, 0)} ÷ (100 × ${a + b + d}) = ${money(average, 4)}。后面的成交付出的价格，高于订单到达时展示的最优价格。`,
						0.0001,
					),
					c(
						"sweep-meaning",
						"What does the sweep condition tell you?",
						"扫单条件能告诉你什么？",
						[
							[
								"routing",
								"The order was split across venues to fill fast",
								"订单被拆到多个场所以便快速成交",
							],
							["institution", "An institution placed it", "下单的是机构"],
							[
								"opening",
								"The buyer opened a new bullish position",
								"买方新开了一个看涨仓位",
							],
						],
						"routing",
						"A sweep describes how the order was routed. Who sent it, what they knew, and whether it opened a position all need other evidence.",
						"扫单描述的是订单如何路由。谁下的单、掌握什么信息、是否开了新仓，都需要其他证据。",
					),
					c(
						"package",
						"Separately, a spread's two legs print at $5.25 and $2.25, each above its own ask, while the spread itself trades at $3.00 net inside its $2.90–$3.30 market. How should you read it?",
						"另外，一个价差的两条腿分别成交在 $5.25 和 $2.25，都高于各自的卖价，而价差本身以净价 $3.00 成交，位于 $2.90–$3.30 的组合市场之内。应该如何解读？",
						[
							[
								"package",
								"As one package that traded inside its market; where each leg printed isn't evidence of who was aggressive",
								"作为在组合市场内成交的一个整体；各条腿成交在哪里，并不能说明谁是主动方",
							],
							[
								"buys",
								"As two aggressive buys: both legs printed above the ask",
								"作为两笔主动买入：两条腿都高于卖价",
							],
							[
								"sells",
								"As two aggressive sells hidden inside a spread",
								"作为藏在价差里的两笔主动卖出",
							],
						],
						"package",
						"A complex order is priced as a whole. Read leg by leg, the leg that was sold would look like an aggressive buy.",
						"复杂订单是按整体定价的。如果逐条腿去读，被卖出的那条腿会看起来像主动买入。",
					),
				],
			};
		},
	},
	{
		id: "unusual-activity",
		conceptLab: {
			kind: "unusual-activity",
			intro: t(
				"Measure Monday's ALFA call volume against two different baselines, line up the time window, and see which contracts a 2× screen picks.",
				"用两种不同的基准衡量周一 ALFA 看涨期权的成交量，对齐时间窗口，再看 2× 筛选会选中哪些合约。",
			),
		},
		sources: [oi],
		explanation: t(
			"Unusual is relative to a baseline, not synonymous with large. Relative volume compares current activity with a stated historical typical volume; volume/OI compares activity with outstanding contracts. Their denominators answer different questions. Compare complete sessions with complete sessions, or use an explicitly comparable intraday window. A near-zero denominator can make an ordinary numerator look extreme. A missing or non-positive required denominator gives an unavailable ratio, not zero or infinity. Averaging ratios across rows differs from dividing the summed numerators by summed denominators. A threshold such as 2× is a declared screen, not a universal discovery of informed trading. Review liquidity, coverage, event context and the population selected by the screen.",
			"异常是相对于基准，不等于绝对金额大。相对成交量比较当前活动与历史典型量，成交量/OI 比较活动与未平仓合约，分母回答不同问题。完整时段应与完整时段比较，盘中则需明确可比窗口。接近零的分母可让普通分子显得极端。必需分母缺失或非正时结果不可用，不是零或无穷。平均各行比率不同于总分子除总分母。2× 等阈值是声明的筛选规则，不是普遍有效的知情交易证明，还需检查流动性、覆盖、事件与所选人群。",
		),
		example: t(
			"The Oct 18 105 call traded 505 against a typical 120 and open interest of 1,200: relative volume 4.2× and volume/OI 0.42×. The Dec 20 110 call traded 12 with open interest of 3: volume/OI 4× despite far less activity. This is a denominator effect, not proof that the second contract matters more.",
			"10月18日 105 看涨成交 505、典型量 120、OI 1,200：相对量 4.2×，量/OI 为 0.42×。12月20日 110 看涨仅成交 12、OI 为 3，量/OI 却达 4×。这是分母效应，不证明后者更重要。",
		),
		misconception: t(
			"A high ratio doesn't flag new positions. Any historical baseline needs its population, time window and coverage stated.",
			"比率高并不代表有新开仓。任何历史基准都要说明对象范围、时间窗口和覆盖情况。",
		),
		case: (v) => {
			const vol = [600, 900, 1200, 750][v];
			const typ = [200, 225, 800, 150][v];
			const open = [1200, 1800, 600, 1500][v];
			return {
				brief: t(
					`Over one complete session, an ALFA call traded ${plain(vol)} contracts. On a typical full session it trades ${plain(typ)}, and ${plain(open)} contracts were open at the last report.`,
					`在一个完整交易日里，某个 ALFA 看涨成交了 ${plain(vol)} 张。它在典型的完整交易日成交 ${plain(typ)} 张，最近一次报告的未平仓量为 ${plain(open)} 张。`,
				),
				questions: [
					n(
						"relative",
						"What is its relative volume: today's volume against a typical session?",
						"它的相对成交量是多少：今天的成交量对比典型交易日？",
						vol / typ,
						"times",
						"倍",
						`${plain(vol)} ÷ ${plain(typ)} = ${plain(vol / typ)}×.`,
						`${plain(vol)} ÷ ${plain(typ)} = ${plain(vol / typ)}×。`,
					),
					n(
						"turnover",
						"What is its volume-to-open-interest ratio?",
						"它的成交量与未平仓量之比是多少？",
						vol / open,
						"times",
						"倍",
						`${plain(vol)} ÷ ${plain(open)} = ${plain(vol / open)}×. Same volume, different yardstick: relative volume compares with a normal day, volume/OI with the contracts outstanding.`,
						`${plain(vol)} ÷ ${plain(open)} = ${plain(vol / open)}×。同样的成交量，不同的量尺：相对成交量对比平常的一天，成交量/未平仓量对比存续的合约。`,
					),
				],
			};
		},
	},
	{
		id: "option-strategies",
		conceptLab: {
			kind: "option-strategies",
			intro: t(
				"Place one short call inside three different positions, add a spread's signed legs into its payoff, and watch a roll print as two opposite-looking trades.",
				"把同一张看涨空头放进三种不同持仓，把价差带符号的各腿相加成到期价值，再看一次移仓如何打印成两笔看似相反的成交。",
			),
		},
		sources: [basics],
		explanation: t(
			"A leg is one position; a strategy combines legs and sometimes underlying shares. A protective put combines stock with a long put. A covered call combines stock with a short call; an uncovered short call lacks that stock and has very different upside risk. A vertical spread combines same-expiry options at different strikes. A straddle combines a call and put at one strike; a collar combines stock, a put and a short call. A roll closes one contract and opens another. These structures can make an isolated print's sentiment misleading about the complete portfolio. Opening/closing and linked-leg records are required to distinguish them. Expiration payoff, entry premium, fees, early assignment and path-dependent management must remain separate.",
			"一条腿是一项持仓，策略可组合多腿及股票。保护性看跌是股票加多头看跌；备兑看涨是股票加空头看涨，未备兑空头缺少股票，其上涨风险很不同。垂直价差结合同到期不同执行价；跨式结合同执行价看涨与看跌；领口结合股票、看跌与空头看涨。移仓包含平旧合约和开新合约。单笔情绪因此可能误导完整组合解读，识别结构需开平仓和关联腿记录。到期价值、入场权利金、费用、提前指派及持仓管理过程应分别看待。",
		),
		example: t(
			"The 105/110 call spread bought for $1.25 net per share, multiplier 100: at expiration spot $115, the long call pays $10 and the short call costs $5, so net payoff is $500 and profit $375. Reading only the short-call print would miss the capped bullish spread.",
			"105/110 看涨价差每股净成本 $1.25，乘数 100。到期现价 $115，多头价值 $10、空头需付 $5：净价值 $500，利润 $375。只看空头看涨成交会漏掉整体有上限的看涨价差。",
		),
		misconception: t(
			"Someone bullish on ALFA can still buy a put to protect shares. One leg's direction doesn't reveal the whole position.",
			"看好 ALFA 的人也可能买看跌来保护持股。单条腿的方向说明不了整个持仓。",
		),
		case: (v) => {
			const spot = [108, 114, 103, 111][v];
			const cost = [3, 4, 2, 6][v];
			const long = Math.max(spot - 100, 0);
			const short = Math.max(spot - 110, 0);
			const perShare = long - short - cost;
			return {
				brief: t(
					`You bought an ALFA 100/110 call spread for ${money(cost)} a share net: long the 100 call and short the 110 call, same expiry. At expiry ALFA is ${money(spot)}. One contract covers 100 shares; ignore fees.`,
					`你以每股净价 ${money(cost)} 买入了 ALFA 100/110 看涨价差：多头 100 看涨、空头 110 看涨，到期日相同。到期时 ALFA 为 ${money(spot)}。一张合约对应 100 股，不计费用。`,
				),
				questions: [
					n(
						"spread-profit",
						"What is your profit or loss on one spread at expiry? Use a minus sign for a loss.",
						"到期时一组价差盈亏多少？亏损请用负号。",
						perShare * 100,
						"dollars",
						"美元",
						`The 100 call is worth ${money(long)} and the short 110 call costs ${money(short)}; minus the ${money(cost)} paid, that's ${signedMoney(perShare)} a share, or ${signedMoney(perShare * 100, 0)} for the spread.`,
						`100 看涨价值 ${money(long)}，空头 110 看涨要付 ${money(short)}；再减去支付的 ${money(cost)}，每股 ${signedMoney(perShare)}，整组价差 ${signedMoney(perShare * 100, 0)}。`,
					),
					c(
						"isolated",
						"If you saw only the 110 call being sold, could you tell it was part of this spread?",
						"如果只看到 110 看涨被卖出，你能判断它属于这组价差吗？",
						[
							[
								"can",
								"Yes: selling calls always means a spread",
								"能：卖出看涨总是意味着价差",
							],
							[
								"cannot",
								"No: you'd need the other leg and a link between them",
								"不能：需要另一条腿以及两者之间的关联",
							],
						],
						"cannot",
						"A lone short-call print could be a covered call, a spread's leg or an outright short. The structure comes from the linked legs, which a single print doesn't carry.",
						"一笔单独的看涨卖出，可能是备兑、价差的一条腿，也可能是单纯做空。结构来自相互关联的各条腿，而单笔成交不包含这些信息。",
					),
				],
			};
		},
	},
	{
		id: "symbol-drawer",
		conceptLab: {
			kind: "symbol-drawer",
			intro: t(
				"Trace when each value in ALFA's symbol drawer was true, judge three sources against three questions, and keep a missing value apart from a measured zero.",
				"追溯 ALFA 标的抽屉中每个数值成立的时刻，用三个问题检验三个数据源，并把缺失值与实测的零区分开。",
			),
		},
		sources: [oi, quotes],
		explanation: t(
			"Give each field its own identity, source, timestamp, unit and coverage requirement. Event time says when something happened; receipt time says when a system learned of it. A selected historical session is not the same as the most recent completed session. Delayed flow, prior-cleared OI and a dated model may coexist without being contemporaneous. A previous OI report can be legitimate context while yesterday's tape fails today's flow requirement. Null is missing, zero is a measured value, and not applicable is a different state. A full-universe claim needs full coverage. Use exact expiry-series membership when comparing position changes; the same rolling DTE label can conceal entering or exiting contracts.",
			"每个字段都应有自己的身份、来源、时间、单位及覆盖要求。事件时间说明何时发生，接收时间说明系统何时获知。选定历史时段与最新已完成时段不同。延迟成交、前期清算 OI 和带日期模型可共存，但不是同时发生。前期 OI 可作合法上下文，昨日成交却可能不满足今日要求。缺失、观测为零和不适用是三种状态。完整范围结论需要完整覆盖；比较持仓变化需固定实际到期序列，相同滚动 DTE 标签可能掩盖合约进出。",
		),
		example: t(
			"At 10:30 on Monday September 16, a Monday trade at 10:05 and Friday's cleared open-interest report can meet a requirement for current-session flow plus dated prior OI. A Friday trade does not meet that flow requirement. A value for another symbol cannot silently substitute for ALFA even if its timestamp is newer.",
			"9 月 16 日周一 10:30，周一 10:05 的成交及周五清算的未平仓量报告，可满足当前时段成交加带日期前期 OI 的要求。周五的成交不满足当前时段要求。即使其他标的的数据更新，也不能代替 ALFA。",
		),
		misconception: t(
			"Whether data is fresh enough depends on the question. Reject the comparison a stale field breaks, not every source on the page.",
			"数据是否足够新，取决于你要回答的问题。只否定被过时字段影响的比较，而不是页面上的所有来源。",
		),
		case: (v) => {
			const current = v % 2 === 0;
			const base = [1000, 1200, 1500, 1800][v];
			const change = [-70, 85, -130, 40][v];
			const later = base + change;
			return {
				brief: t(
					`You need ALFA's option flow for the September 3 session, plus open interest from an earlier report with its date. Your flow record is ALFA's for September ${current ? 3 : 2}. Open-interest reports for one fixed series show ${plain(base)} on September 1 and ${plain(later)} on September 2.`,
					`你需要 ALFA 9 月 3 日交易时段的期权成交流，以及更早一次带日期的未平仓量报告。你手上的成交记录是 ALFA 9 月 ${current ? 3 : 2} 日的。同一固定序列的未平仓量报告显示：9 月 1 日 ${plain(base)}，9 月 2 日 ${plain(later)}。`,
				),
				questions: [
					c(
						"flow-gate",
						"Does the flow record meet the requirement?",
						"这份成交记录满足要求吗？",
						[
							["yes", "Yes: its session matches", "满足：交易时段一致"],
							[
								"no",
								"No: it's from a different session",
								"不满足：来自另一个交易时段",
							],
							[
								"oi",
								"No: the open interest is from an earlier date",
								"不满足：未平仓量来自更早的日期",
							],
						],
						current ? "yes" : "no",
						current
							? "The flow is from September 3, as required, and earlier dated open interest was allowed. Check each field against its own requirement."
							: "The flow is from September 2, not September 3, so it fails. The open interest was allowed to be earlier; that part is fine.",
						current
							? "成交流来自 9 月 3 日，符合要求；更早且带日期的未平仓量也是允许的。每个字段要对照它自己的要求。"
							: "成交流来自 9 月 2 日而不是 9 月 3 日，所以不满足。未平仓量本来就允许更早，这部分没有问题。",
					),
					n(
						"report-delta",
						"By how much did open interest change from September 1 to September 2? Use a minus sign for a fall.",
						"从 9 月 1 日到 9 月 2 日，未平仓量变化了多少？下降请用负号。",
						change,
						"contracts",
						"张",
						`${plain(later)} − ${plain(base)} = ${signed(change)}. That's the change between two reports; it says nothing about positions during September 3.`,
						`${plain(later)} − ${plain(base)} = ${signed(change)}。这是两次报告之间的变化，不能说明 9 月 3 日盘中的持仓。`,
					),
				],
			};
		},
	},
	{
		id: "multi-leg-structures",
		conceptLab: {
			kind: "multi-leg-structures",
			intro: t(
				"Build the Oct 18 100 straddle from its call and put and find where it breaks even, sell a 90/95/105/110 iron condor and find its worst case, and read its four prints as one package instead of two bullish and two bearish legs.",
				"用看涨和看跌组合出 10月18日 100 跨式并找出它的盈亏平衡点，卖出 90/95/105/110 铁鹰并找出它的最坏情况，再把它的四笔成交作为一个整体来读，而不是两条看涨腿和两条看跌腿。",
			),
		},
		sources: [basics],
		explanation: t(
			"A long straddle buys a call and a put at one strike: it pays on a big move either way, and its break-evens sit the total premium above and below the strike. A strangle buys them at different strikes, which is cheaper but needs a bigger move. An iron condor sells a put spread below the stock and a call spread above it: it keeps the credit if the stock stays between the short strikes, and because at most one side can finish in the money, its worst case is one spread's width minus the credit. Each of these is one decision priced as a package, but the tape prints every leg separately, and a feed that labels legs one at a time can call the same trade bullish, bearish or neutral. Same-second prints with a multi-leg condition and matching sizes suggest a package; linked-leg records confirm it.",
			"跨式多头在同一行权价买入一张看涨和一张看跌：任一方向的大幅变动都能赚钱，盈亏平衡点在行权价上下各相差总权利金。宽跨式在不同行权价买入两者，更便宜，但需要更大的变动。铁鹰在股价下方卖出一个看跌价差、上方卖出一个看涨价差：股价留在两个卖出行权价之间就能保留收入；由于到期时最多只有一侧是实值，最坏情况是一个价差的宽度减去收入。每一种都是作为整体定价的一个决定，但逐笔成交会把每条腿分开打印，逐腿贴标签的数据可能把同一笔交易标为看涨、看跌或中性。同一秒、带多腿条件、数量一致的成交提示这是一个整体；关联腿记录才能证实。",
		),
		example: t(
			'Buying the Oct 18 100 call and put at $4.20 each costs $8.40 a share, so ALFA must end above $108.40 or below $91.60 to make money. Selling the 95 put and 105 call at $2.05 and buying the 90 put at $1.00 and the 110 call at $0.93 collects $2.17; the worst case is $5.00 − $2.17 = $2.83 a share. Two hundred of those condors print as four legs that a leg-by-leg feed tallies to −$1,400 of "bearish" premium, though the trade is a $43,400 bet that ALFA stays between $95 and $105.',
			"以每张 $4.20 买入 10月18日 100 看涨和看跌，每股成本 $8.40，所以 ALFA 要收在 $108.40 以上或 $91.60 以下才赚钱。以 $2.05 卖出 95 看跌和 105 看涨、以 $1.00 买入 90 看跌、以 $0.93 买入 110 看涨，收入 $2.17；最坏情况是每股 $5.00 − $2.17 = $2.83。两百组这样的铁鹰打印为四条腿，逐腿贴标签的数据会把它们加总为 −$1,400 的“看跌”权利金，而这笔交易其实是押注 ALFA 留在 $95 到 $105 之间、收入 $43,400 的交易。",
		),
		misconception: t(
			"A multi-leg trade's legs point in different directions on purpose. Read the package's payoff, not each leg's label, and don't add premium across legs as if each were a separate opinion.",
			"多腿交易的各条腿本来就指向不同方向。要读整体的到期盈亏，而不是每条腿的标签；也不要把各腿的权利金当作各自独立的观点相加。",
		),
		case: (v) => {
			const cases = [
				{
					kind: "straddle" as const,
					spot: 100,
					text: t(
						"You buy an ALFA 100 call at $4.20 and an ALFA 100 put at $4.20, same expiry: a long straddle.",
						"你以 $4.20 买入一张 ALFA 100 看涨，并以 $4.20 买入一张同一到期日的 ALFA 100 看跌：跨式多头。",
					),
					price: 8.4,
					top: 100,
				},
				{
					kind: "condor" as const,
					spot: 100,
					text: t(
						"You sell an ALFA iron condor: sell the 95 put at $2.05 and buy the 90 put at $1.00, sell the 105 call at $2.05 and buy the 110 call at $0.93, all one expiry.",
						"你卖出一组 ALFA 铁鹰：以 $2.05 卖出 95 看跌、以 $1.00 买入 90 看跌，以 $2.05 卖出 105 看涨、以 $0.93 买入 110 看涨，到期日相同。",
					),
					price: 2.17,
					top: 105,
				},
				{
					kind: "strangle" as const,
					spot: 100,
					text: t(
						"You buy an ALFA 105 call at $2.15 and an ALFA 95 put at $2.15, same expiry: a long strangle.",
						"你以 $2.15 买入一张 ALFA 105 看涨，并以 $2.15 买入一张同一到期日的 ALFA 95 看跌：宽跨式多头。",
					),
					price: 4.3,
					top: 105,
				},
				{
					kind: "condor" as const,
					spot: 50,
					text: t(
						"With a stock at $50 you sell an iron condor: sell the 45 put at $1.10 and buy the 40 put at $0.40, sell the 55 call at $1.00 and buy the 60 call at $0.35, all one expiry.",
						"一只股票为 $50 时，你卖出一组铁鹰：以 $1.10 卖出 45 看跌、以 $0.40 买入 40 看跌，以 $1.00 卖出 55 看涨、以 $0.35 买入 60 看涨，到期日相同。",
					),
					price: 1.35,
					top: 55,
				},
			][v];
			const condor = cases.kind === "condor";
			const breakEven = cases.top + cases.price;
			return {
				brief: t(
					`${cases.text.en} One contract covers 100 shares; work at expiry and ignore fees.`,
					`${cases.text.zh}一张合约对应 100 股；按到期时计算，不计费用。`,
				),
				questions: [
					n(
						"cost",
						condor
							? "What credit does the condor collect, per share?"
							: "What does the position cost, per share?",
						condor ? "这组铁鹰每股收入多少？" : "这个持仓每股成本多少？",
						cases.price,
						"dollars a share",
						"美元/股",
						condor
							? `Credits from the short legs minus the cost of the wings: ${money(cases.price)} a share. That's also the most the condor can make.`
							: `${cases.kind === "straddle" ? "$4.20 + $4.20" : "$2.15 + $2.15"} = ${money(cases.price)} a share. That's also the most it can lose.`,
						condor
							? `卖出各腿的收入减去两翼的成本：每股 ${money(cases.price)}。这也是这组铁鹰最多能赚的。`
							: `${cases.kind === "straddle" ? "$4.20 + $4.20" : "$2.15 + $2.15"} = 每股 ${money(cases.price)}。这也是它最多会亏的。`,
						0.01,
					),
					n(
						"breakeven",
						"Above the stock's price, where does the position break even at expiry?",
						"在股价上方，这个持仓到期的盈亏平衡点在哪里？",
						breakEven,
						"dollars",
						"美元",
						condor
							? `The short ${cases.top} call starts costing above ${money(cases.top, 0)}; the ${money(cases.price)} credit covers the first ${money(cases.price)} of that: ${money(cases.top, 0)} + ${money(cases.price)} = ${money(breakEven)}.`
							: `Above ${money(cases.top, 0)} only the call pays, and it must be worth the whole ${money(cases.price)}: ${money(cases.top, 0)} + ${money(cases.price)} = ${money(breakEven)}.`,
						condor
							? `卖出的 ${cases.top} 看涨在 ${money(cases.top, 0)} 以上开始亏钱；${money(cases.price)} 的收入抵掉最开始的 ${money(cases.price)}：${money(cases.top, 0)} + ${money(cases.price)} = ${money(breakEven)}。`
							: `在 ${money(cases.top, 0)} 以上只有看涨赚钱，它必须值满 ${money(cases.price)}：${money(cases.top, 0)} + ${money(cases.price)} = ${money(breakEven)}。`,
						0.01,
					),
					c(
						"view",
						"What does this position need to make money?",
						"这个持仓要赚钱需要什么？",
						[
							["big", "A big move, either way", "大幅变动，方向不限"],
							["up", "A rise", "上涨"],
							["calm", "The stock staying in a range", "股价留在一个区间内"],
						],
						condor ? "calm" : "big",
						condor
							? "A short iron condor keeps its credit while the stock stays between the short strikes and loses if it breaks out either way."
							: `A long ${cases.kind} pays only once the stock moves past one of its break-evens, up or down. Staying still is its worst case.`,
						condor
							? "铁鹰空头在股价留在两个卖出行权价之间时保留收入，任一方向突破都会亏损。"
							: `${cases.kind === "straddle" ? "跨式" : "宽跨式"}多头只有在股价越过某个盈亏平衡点时才赚钱，向上向下都可以。原地不动是它的最坏情况。`,
					),
				],
			};
		},
	},
];
