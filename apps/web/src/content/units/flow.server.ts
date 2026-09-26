import "@tanstack/react-start/server-only";

import { activityConceptData } from "./activity-concept.server";
import {
	basics,
	choose as c,
	numberQuestion as n,
	oi,
	orders,
	quotes,
	type TeachingUnit,
	t,
} from "./authoring.server";
import { conditionsConceptData } from "./conditions-concept.server";
import { oiConceptData } from "./oi-concept.server";
import { sourceConceptData } from "./source-concept.server";
import { strategyConceptData } from "./strategy-concept.server";
import { tapeConceptData } from "./tape-concept.server";

export const flowUnits: TeachingUnit[] = [
	{
		id: "session-flow-vs-structure",
		conceptLab: {
			kind: "session-flow-vs-structure",
			data: oiConceptData,
			intro: t(
				"Follow opening, closing and transferred contracts, replay the session beside its OI reports, and compare the same expiry set across dates. Explore these fictional ledgers before building your own calculation.",
				"追踪开仓、平仓与转移合约，对照 OI 报告回放交易时段，再跨日期比较相同到期集合。先探索这些虚构台账，再完成自己的计算。",
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
			"A change in a rolling expiry bucket can include membership changes. A matched report delta is net change, not an identified number of one investor's opening trades.",
			"滚动到期桶的变化可能包含成员变化。匹配报告差值是净变化，不是已识别的某投资者开仓数量。",
		),
		case: (v) => {
			const opened = [12, 24, 15, 31][v];
			const closed = [5, 9, 19, 11][v];
			const transfer = [8, 7, 6, 9][v];
			return {
				brief: t(
					`A fixed contract series starts with OI 500. Complete toy ledger: ${opened} open/open contracts, ${closed} close/close, ${transfer} open/close transfers. No exercise, expiration or other changes.`,
					`固定合约序列初始 OI 500。完整模拟台账：${opened} 张双方开仓、${closed} 张双方平仓、${transfer} 张开平转移。无行权、到期或其他变化。`,
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
						"Session volume?",
						"时段成交量？",
						opened + closed + transfer,
						"contracts",
						"张",
						"Add all executed contract counts, including transfers.",
						"累加全部成交张数，包含转移。",
					),
					n(
						"ending-oi",
						"Ending OI under these complete stated facts?",
						"根据完整给定事实，期末 OI 是多少？",
						500 + opened - closed,
						"contracts",
						"张",
						"500 + open/open − close/close; transfers do not change OI.",
						"500 + 双方开仓 − 双方平仓，转移不改变 OI。",
					),
					c(
						"no-flags",
						"If only volume were known, would that establish ending OI?",
						"若仅知道成交量，能确定期末 OI 吗？",
						[
							[
								"yes",
								"Yes, add all volume to initial OI.",
								"能，将成交量全部加到初始 OI。",
							],
							[
								"no",
								"No, position effects would be unresolved.",
								"不能，持仓效果仍未知。",
							],
							["minus", "Yes, subtract all volume.", "能，将成交量全部扣除。"],
						],
						"no",
						"The opening/closing information enabled the calculation; volume alone does not contain it.",
						"计算依赖开平仓信息，成交量本身不包含该信息。",
					),
				],
			};
		},
	},
	{
		id: "trade-records",
		conceptLab: {
			kind: "trade-records",
			data: tapeConceptData,
			intro: t(
				"Build an aggregate from its source prints and replay duplicate and revised messages. Explore these fictional records before reconstructing your own tape row.",
				"从原始成交建立聚合，并回放重复与修订消息。先探索这些虚构记录，再还原自己的成交行。",
			),
		},
		sources: [quotes, oi],
		explanation: t(
			"A raw print represents one reported execution. An aggregate can combine several prints according to a stated grouping rule. Its contract count and premium are sums; its trade count records the represented prints. A quantity-weighted execution price differs from an unweighted average. Do not aggregate unlike contracts or mix price units. Duplicate messages and corrections can change a feed without new economic activity; exchange time and receipt time can differ. Execution conditions such as sweeps, blocks and complex orders come in the next lesson; a cluster of rows still does not prove common ownership.",
			"原始成交是一条执行报告，聚合记录可按明确规则合并多笔。张数与权利金应求和，成交笔数记录所代表原始笔数。按数量加权价格不同于简单平均。不能合并不同合约或不同价格单位。重复消息与更正可能改变数据，却没有新增经济成交；交易所时间与接收时间也可不同。扫单、大宗与复杂订单等成交条件在下一课讲解；多行聚集仍不证明共同持有。",
		),
		example: t(
			"Two same-contract prints: 10 at $2 and 30 at $3, multiplier 100. Total size 40, premium $11,000, trade count 2, weighted price $2.75. The simple $2.50 average is wrong for those quantities. The grouping rule says nothing about whether the orders belonged to one strategy.",
			"同合约两笔：10 张 $2、30 张 $3，乘数 100。总量 40、权利金 $11,000、笔数 2、加权价格 $2.75。数量不等时简单平均 $2.50 不正确，分组规则也不能证明同一策略。",
		),
		misconception: t(
			"One aggregate row need not be one order. Repetition is a reason to investigate linkage, not a linkage identifier.",
			"一条聚合记录不一定是一张订单。重复性提示继续检查关联，并非关联标识。",
		),
		case: (v) => {
			const a = [10, 20, 15, 25][v];
			const b = [30, 10, 45, 15][v];
			return {
				brief: t(
					`Same-contract prints: ${a} contracts at $2 and ${b} at $3. Multiplier 100. Two unique, uncorrected reports.`,
					`同合约成交：${a} 张 $2、${b} 张 $3，乘数 100。两条唯一且未更正的报告。`,
				),
				questions: [
					n(
						"premium",
						"Aggregated premium?",
						"聚合权利金？",
						(a * 2 + b * 3) * 100,
						"USD",
						"美元",
						"Sum price × size × multiplier for each original print.",
						"逐笔计算价格×数量×乘数后求和。",
					),
					n(
						"weighted",
						"Quantity-weighted price, to four decimals?",
						"数量加权价格，保留四位小数？",
						(a * 2 + b * 3) / (a + b),
						"USD/share",
						"美元/股",
						"(2×first size + 3×second size) ÷ total size.",
						"（2×第一笔数量+3×第二笔数量）÷总量。",
						0.0001,
					),
					c(
						"link",
						"Does aggregation identify a multi-leg strategy?",
						"聚合能识别多腿策略吗？",
						[
							[
								"yes",
								"Yes, matching timestamps establish ownership.",
								"能，相同时间戳证明归属。",
							],
							[
								"no",
								"No, a grouping rule does not establish order or strategy linkage.",
								"不能，分组规则不证明订单或策略关联。",
							],
						],
						"no",
						"No strategy identifier or linked-leg evidence was supplied.",
						"未给定策略标识或关联腿证据。",
					),
				],
			};
		},
	},
	{
		id: "execution-conditions",
		conceptLab: {
			kind: "execution-conditions",
			data: conditionsConceptData,
			intro: t(
				"Follow one order across several venues, place a block against its quote, and read two leg prints as one package. Then test what a condition code can and cannot establish.",
				"追踪一张订单跨多个场所成交，把大宗交易放到报价旁比较，并把两条腿的成交作为整体解读。最后检验条件代码能确定什么、不能确定什么。",
			),
		},
		sources: [orders, quotes],
		explanation: t(
			"Execution conditions describe how a trade was executed. A sweep routes one order across several venues at once, often as intermarket sweep orders (ISO); each fill prints separately, and later fills can pay more than the best displayed price. A block is a large trade, often arranged away from the screen and printed through an auction or cross, so its price can sit inside, at or outside the displayed quote. Complex orders price several legs, or options and stock, as one package; individual leg prices can fall outside their own quotes while the package trades inside its market. Each code needs the source's own definition. None of these labels identifies who traded, how informed they were, or whether a position opened.",
			"成交条件描述一笔交易如何执行。扫单把一张订单同时路由到多个场所，常以跨市场扫单指令（ISO）发出；每次成交分别打印，后面的成交可能高于最优展示价格。大宗交易通常先在屏幕外撮合，再通过竞价或交叉成交打印，因此价格可能在展示报价之内、等于报价或超出报价。复杂订单把多条腿、或期权与股票作为一个整体定价；单腿价格可能超出各自报价，而整体仍在组合市场之内成交。每个代码都需要来源自己的定义。这些标签都不能说明谁在交易、掌握多少信息，或是否开了新仓。",
		),
		example: t(
			"A 50-contract buy sweeps three venues: 20 at $2.10, 15 at $2.11 and 15 at $2.12. That is one order and three prints: 50 contracts, $10,545 premium and a $2.109 average price. Separately, a call spread bought for $3.00 net can print its legs at $5.25 and $2.25, each above its own ask, while the package traded inside its $2.90–$3.30 market.",
			"一张 50 张的买单扫过三个场所：$2.10 成交 20 张、$2.11 成交 15 张、$2.12 成交 15 张。这是一张订单、三笔成交：共 50 张、权利金 $10,545、均价 $2.109。另外，以净价 $3.00 买入的看涨价差，两条腿可能分别打印在 $5.25 和 $2.25，都高于各自卖价，而整体仍在 $2.90–$3.30 的组合市场内成交。",
		),
		misconception: t(
			"Urgent routing is not proof of conviction, and a large block is not proof of an institution or inside information. Read the leg prints of a complex order as one package.",
			"急迫的路由不证明确信，大宗交易也不证明机构身份或内幕信息。复杂订单的各腿成交应作为整体解读。",
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
					`One buy order sweeps three venues within milliseconds: ${a} contracts at $2.10, ${b} at $2.11 and ${d} at $2.12. Multiplier 100. Each fill printed separately with a sweep condition.`,
					`一张买单在几毫秒内扫过三个场所：$2.10 成交 ${a} 张、$2.11 成交 ${b} 张、$2.12 成交 ${d} 张，乘数 100。每次成交都带扫单条件分别打印。`,
				),
				questions: [
					n(
						"premium",
						"Total premium across the three prints?",
						"三笔成交的总权利金？",
						premium,
						"USD",
						"美元",
						"Sum price × contracts × 100 for each fill. The three prints belong to one order.",
						"逐笔计算价格 × 张数 × 100 后求和。三笔成交来自同一张订单。",
					),
					n(
						"average",
						"Quantity-weighted average price, to four decimals?",
						"数量加权平均价格，保留四位小数？",
						Math.round(average * 10000) / 10000,
						"USD/share",
						"美元/股",
						"Total premium ÷ (100 × total contracts). Later fills paid more than the best displayed offer.",
						"总权利金 ÷（100 × 总张数）。后面的成交价格高于最优展示卖价。",
						0.0001,
					),
					c(
						"sweep-meaning",
						"What does the sweep condition establish?",
						"扫单条件能确定什么？",
						[
							[
								"routing",
								"The order was routed across venues to fill quickly.",
								"订单被路由到多个场所以尽快成交。",
							],
							[
								"institution",
								"An institution placed the order.",
								"订单由机构发出。",
							],
							[
								"opening",
								"The buyer opened a new bullish position.",
								"买方开了新的看涨仓位。",
							],
						],
						"routing",
						"A sweep describes execution routing. Identity, information and opening status need other evidence.",
						"扫单描述执行路由。身份、信息与开仓状态需要其他证据。",
					),
					c(
						"package",
						"Separately, a spread's two legs print at $5.25 and $2.25, each above its own ask. The package's market is $2.90–$3.30 and it traded at $3.00 net. How should you read it?",
						"另外，一个价差的两条腿分别成交在 $5.25 和 $2.25，都高于各自卖价。该组合市场为 $2.90–$3.30，净价 $3.00 成交。应如何解读？",
						[
							[
								"package",
								"As one package traded inside its market; the leg locations are not aggressor evidence.",
								"作为在组合市场内成交的整体；单腿位置不是主动方证据。",
							],
							[
								"buys",
								"As two aggressive buys, because both legs printed above the ask.",
								"作为两笔主动买入，因为两条腿都高于卖价。",
							],
							[
								"sells",
								"As two aggressive sells hidden inside a spread.",
								"作为隐藏在价差中的两笔主动卖出。",
							],
						],
						"package",
						"Complex orders are priced as a whole. Leg-by-leg classification would call the sold leg an aggressive buy.",
						"复杂订单按整体定价。逐腿分类会把卖出的那条腿误判为主动买入。",
					),
				],
			};
		},
	},
	{
		id: "unusual-activity",
		conceptLab: {
			kind: "unusual-activity",
			data: activityConceptData,
			intro: t(
				"Change the denominator, align the comparison window, and test how a screen changes the population. Explore why a high ratio is a research prompt rather than proof of informed trading.",
				"改变分母、对齐比较窗口，再检验筛选如何改变人群。探索为何高比率只是研究线索，而非知情交易的证明。",
			),
		},
		sources: [oi],
		explanation: t(
			"Unusual is relative to a baseline, not synonymous with large. Relative volume compares current activity with a stated historical typical volume; volume/OI compares activity with outstanding contracts. Their denominators answer different questions. Compare complete sessions with complete sessions, or use an explicitly comparable intraday window. A near-zero denominator can make an ordinary numerator look extreme. A missing or non-positive required denominator gives an unavailable ratio, not zero or infinity. Averaging ratios across rows differs from dividing the summed numerators by summed denominators. A threshold such as 2× is a declared screen, not a universal discovery of informed trading. Review liquidity, coverage, event context and the population selected by the screen.",
			"异常是相对于基准，不等于绝对金额大。相对成交量比较当前活动与历史典型量，成交量/OI 比较活动与未平仓合约，分母回答不同问题。完整时段应与完整时段比较，盘中则需明确可比窗口。接近零的分母可让普通分子显得极端。必需分母缺失或非正时结果不可用，不是零或无穷。平均各行比率不同于总分子除总分母。2× 等阈值是声明的筛选规则，不是普遍有效的知情交易证明，还需检查流动性、覆盖、事件与所选人群。",
		),
		example: t(
			"Volume 200, typical volume 100, OI 1,000: relative volume 2× and volume/OI 0.2×. Another contract with volume 10 and OI 1 has volume/OI 10× despite much less activity. This is a denominator effect, not proof that the second contract matters more.",
			"成交量 200、典型量 100、OI 1,000：相对量 2×，量/OI 为 0.2×。另一合约成交仅 10、OI 为 1，量/OI 却达 10×。这是分母效应，不证明后者更重要。",
		),
		misconception: t(
			"A high ratio is not an opening-position flag. A historical benchmark needs its population, time window and coverage stated.",
			"高比率不是开仓标记，历史基准需明确人群、时间窗口与覆盖。",
		),
		case: (v) => {
			const vol = [600, 900, 1200, 750][v];
			const typ = [200, 225, 800, 150][v];
			const open = [1200, 1800, 600, 1500][v];
			return {
				brief: t(
					`Complete comparable session: volume ${vol}; typical session volume ${typ}; reported OI ${open}.`,
					`完整可比时段：成交量 ${vol}，典型时段量 ${typ}，报告 OI ${open}。`,
				),
				questions: [
					n(
						"relative",
						"Relative volume?",
						"相对成交量？",
						vol / typ,
						"times",
						"倍",
						"Current session volume ÷ typical comparable session volume.",
						"当前时段量÷典型可比时段量。",
					),
					n(
						"turnover",
						"Volume/OI?",
						"成交量/OI？",
						vol / open,
						"times",
						"倍",
						"Volume ÷ outstanding contracts; this is not relative volume.",
						"成交量÷未平仓合约，与相对成交量不同。",
					),
				],
			};
		},
	},
	{
		id: "option-strategies",
		conceptLab: {
			kind: "option-strategies",
			data: strategyConceptData,
			intro: t(
				"Connect the supplied stock and option legs, explore expiration value and profit, and replay a linked roll. Compare the evidence for a complete structure with what one isolated position can reveal.",
				"连接给定股票与期权腿，探索到期价值与盈亏，再回放关联移仓。比较完整结构证据与单一持仓能够揭示的信息。",
			),
		},
		sources: [basics],
		explanation: t(
			"A leg is one position; a strategy combines legs and sometimes underlying shares. A protective put combines stock with a long put. A covered call combines stock with a short call; an uncovered short call lacks that stock and has very different upside risk. A vertical spread combines same-expiry options at different strikes. A straddle combines a call and put at one strike; a collar combines stock, a put and a short call. A roll closes one contract and opens another. These structures can make an isolated print's sentiment misleading about the complete portfolio. Opening/closing and linked-leg records are required to distinguish them. Expiration payoff, entry premium, fees, early assignment and path-dependent management must remain separate.",
			"一条腿是一项持仓，策略可组合多腿及股票。保护性看跌是股票加多头看跌；备兑看涨是股票加空头看涨，未备兑空头缺少股票，其上涨风险很不同。垂直价差结合同到期不同执行价；跨式结合同执行价看涨与看跌；领口结合股票、看跌与空头看涨。移仓包含平旧合约和开新合约。单笔情绪因此可能误导完整组合解读，识别结构需开平仓和关联腿记录。到期价值、入场权利金、费用、提前指派及持仓管理过程应分别看待。",
		),
		example: t(
			"A 100/110 long call spread costs $4 net per share, multiplier 100. At expiration spot $115, the long call pays $15 and the short call costs $5: net payoff $1,000 and profit $600. Reading only the short-call print would miss the capped bullish spread.",
			"100/110 多头看涨价差每股净成本 $4，乘数 100。到期现价 $115，多头价值 $15、空头需付 $5：净价值 $1,000，利润 $600。只看空头看涨成交会漏掉整体有上限的看涨价差。",
		),
		misconception: t(
			"A bullish investor can buy a protective put. The put leg's negative directional exposure does not identify the investor's full outlook.",
			"看涨投资者也可以买保护性看跌，其负向敞口不等于完整观点。",
		),
		case: (v) => {
			const spot = [108, 114, 103, 111][v];
			const cost = [3, 4, 2, 6][v];
			return {
				brief: t(
					`One 100/110 long call spread at expiration. Spot $${spot}, paid net $${cost}/share, multiplier 100, no fees.`,
					`一组 100/110 多头看涨价差到期，现价 $${spot}，每股净支付 $${cost}，乘数 100，无费用。`,
				),
				questions: [
					n(
						"spread-profit",
						"Net expiration profit?",
						"净到期盈亏？",
						(Math.max(spot - 100, 0) - Math.max(spot - 110, 0) - cost) * 100,
						"USD",
						"美元",
						"Long payoff − short payoff − net premium, all multiplied by 100.",
						"多头价值−空头支付−净权利金，再乘 100。",
					),
					c(
						"isolated",
						"Can the short-call print alone identify this complete strategy?",
						"单独空头看涨成交能识别完整策略吗？",
						[
							[
								"can",
								"Yes, call selling always means a vertical spread.",
								"能，卖看涨总是垂直价差。",
							],
							[
								"cannot",
								"No; the linkage and other leg were additional evidence.",
								"不能，关联和另一条腿是额外证据。",
							],
						],
						"cannot",
						"The supplied spread structure is information absent from an isolated print.",
						"给定价差结构是孤立成交中没有的信息。",
					),
				],
			};
		},
	},
	{
		id: "symbol-drawer",
		conceptLab: {
			kind: "symbol-drawer",
			data: sourceConceptData,
			intro: t(
				"Replay event and receipt clocks, then audit each source against a stated requirement. The volume and open-interest lesson already showed how a rolling expiry bucket can change members.",
				"回放事件与接收时钟，再对照声明要求审计各来源。成交量与未平仓量一课已展示滚动到期桶如何改变成员。",
			),
		},
		sources: [oi, quotes],
		explanation: t(
			"Give each field its own identity, source, timestamp, unit and coverage requirement. Event time says when something happened; receipt time says when a system learned of it. A selected historical session is not the same as the most recent completed session. Delayed flow, prior-cleared OI and a dated model may coexist without being contemporaneous. A previous OI report can be legitimate context while yesterday's tape fails today's flow requirement. Null is missing, zero is a measured value, and not applicable is a different state. A full-universe claim needs full coverage. Use exact expiry-series membership when comparing position changes; the same rolling DTE label can conceal entering or exiting contracts.",
			"每个字段都应有自己的身份、来源、时间、单位及覆盖要求。事件时间说明何时发生，接收时间说明系统何时获知。选定历史时段与最新已完成时段不同。延迟成交、前期清算 OI 和带日期模型可共存，但不是同时发生。前期 OI 可作合法上下文，昨日成交却可能不满足今日要求。缺失、观测为零和不适用是三种状态。完整范围结论需要完整覆盖；比较持仓变化需固定实际到期序列，相同滚动 DTE 标签可能掩盖合约进出。",
		),
		example: t(
			"At 10:00 on September 3, a September 3 trade at 09:59 and a September 2 cleared OI report can meet a contract requiring current-session flow plus dated prior OI. A September 2 trade does not meet that flow requirement. A value for BETA cannot silently substitute for ALFA even if its timestamp is newer.",
			"9 月 3 日 10:00，9 月 3 日 09:59 成交及 9 月 2 日清算 OI，可满足当前时段成交加带日期前期 OI 的要求。9 月 2 日成交不满足当前时段要求。即使 BETA 数据更新，也不能代替 ALFA。",
		),
		misconception: t(
			"Freshness is task-relative. Reject the affected comparison, not every valid source on the page.",
			"时效取决于任务。拒绝受影响的比较，不必否定所有有效来源。",
		),
		case: (v) => {
			const current = v % 2 === 0;
			const base = [1000, 1200, 1500, 1800][v];
			const change = [-70, 85, -130, 40][v];
			const later = base + change;
			return {
				brief: t(
					`Requirement: ALFA September 3 session flow plus dated prior OI. Flow record: ALFA, September ${current ? 3 : 2}. OI: same fixed series, September 1 ${base}, September 2 ${later}.`,
					`要求：ALFA 9 月 3 日成交流及带日期的前期 OI。成交记录为 ALFA 9 月 ${current ? 3 : 2} 日。OI 是同一固定序列：9 月 1 日 ${base}，9 月 2 日 ${later}。`,
				),
				questions: [
					c(
						"flow-gate",
						"Does the flow record meet this requirement?",
						"成交记录满足要求吗？",
						[
							["yes", "Yes, its session matches.", "满足，时段匹配。"],
							["no", "No, its session differs.", "不满足，时段不同。"],
							[
								"oi",
								"No, because OI is from a prior date.",
								"不满足，因为 OI 来自前日。",
							],
						],
						current ? "yes" : "no",
						"Compare each field to its own requirement; dated prior OI was explicitly allowed.",
						"逐字段对应要求，前期带日期 OI 明确允许。",
					),
					n(
						"report-delta",
						"What is the valid September 1→2 OI change?",
						"有效的 9 月 1→2 日 OI 变化是多少？",
						change,
						"contracts",
						"张",
						`${later} − ${base} = ${change}; this does not describe September 3 intraday positions.`,
						`${later}−${base}=${change}，不描述 9 月 3 日盘中持仓。`,
					),
				],
			};
		},
	},
];
