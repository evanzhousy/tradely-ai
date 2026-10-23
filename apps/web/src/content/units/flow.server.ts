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
		version: 3,
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
			const ending = 500 + opened - closed;
			/** What the feed in the third question carries: only the volume (guided), the buyer's open/close flag alone, or both sides' flags. */
			const feed = (["volume", "buyer", "both", "both"] as const)[v];
			/** The dashboard row in the last question: one fixed expiry, or a window of days to expiry whose expiries roll. */
			const rolling = v % 2 === 1;
			const [rowStart, rowEnd] = [
				[3120, 3260],
				[2480, 2610],
				[4050, 3980],
				[1940, 2150],
			][v];
			const rowChange = rowEnd - rowStart;
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
						ending,
						"contracts",
						"张",
						`500 + ${opened} − ${closed} = ${ending}. The ${transfer} transferred contracts changed owners, not the count.`,
						`500 + ${opened} − ${closed} = ${ending}。换手的 ${transfer} 张只换了持有人，没有改变数量。`,
					),
					c(
						"no-flags",
						feed === "volume"
							? "If you knew only today's volume, could you work out the ending open interest?"
							: feed === "buyer"
								? "Suppose a feed listed each of today's trades with its size and the buyer's open/close flag, but not the seller's. Could you work out the ending open interest from it?"
								: "Suppose a feed listed each of today's trades with its size and both sides' open/close flags. Could you work out the ending open interest from it?",
						feed === "volume"
							? "如果只知道今天的成交量，能算出收盘时的未平仓量吗？"
							: feed === "buyer"
								? "假设某个数据源列出今天每笔成交的张数和买方的开平仓标记，但没有卖方的。仅凭它，能算出收盘时的未平仓量吗？"
								: "假设某个数据源列出今天每笔成交的张数和双方的开平仓标记。仅凭它，能算出收盘时的未平仓量吗？",
						[
							[
								"yes",
								"Yes: add the volume to 500",
								"能：把成交量加到 500 上",
								feed === "volume"
									? "Adding volume assumes every trade opened new contracts. Trades that close remove contracts, so you'd need to know which trades opened and which closed."
									: feed === "buyer"
										? `Adding all ${volume} assumes both sides opened on every trade. A buyer's opening flag can't rule out a seller who was closing.`
										: `Adding all ${volume} assumes every trade opened on both sides. The flags would show ${closed} closed on both sides and ${transfer} only changed hands.`,
								feed === "volume"
									? "加上成交量，就是假设每笔成交都开了新合约。平仓的成交会减少合约，所以你需要知道哪些成交是开仓、哪些是平仓。"
									: feed === "buyer"
										? `加上全部 ${volume} 张，就是假设每笔成交双方都开仓。买方的开仓标记无法排除卖方是在平仓。`
										: `加上全部 ${volume} 张，就是假设每笔成交双方都开仓。标记会显示 ${closed} 张是双方平仓，${transfer} 张只是换手。`,
							],
							[
								"no",
								"No: you'd need to know which trades opened and which closed",
								"不能：需要知道哪些成交是开仓、哪些是平仓",
								`Both sides' flags tell you exactly that: 500 + ${opened} − ${closed} = ${ending}, and the ${transfer} transfers change nothing.`,
								`双方的标记正好说明了这一点：500 + ${opened} − ${closed} = ${ending}，换手的 ${transfer} 张不改变数量。`,
							],
							[
								"minus",
								"Yes: subtract the volume from 500",
								"能：用 500 减去成交量",
								feed === "volume"
									? "Subtracting volume assumes every trade closed. Some may have opened new contracts, so volume alone can't settle it."
									: feed === "buyer"
										? `Subtracting all ${volume} assumes every trade closed on both sides. The buyer's flag shows only one side of each trade.`
										: `Subtracting all ${volume} assumes every trade closed on both sides. The flags would show ${opened} opened on both sides.`,
								feed === "volume"
									? "减去成交量，就是假设每笔成交都是平仓。有些可能开了新合约，所以仅凭成交量无法确定。"
									: feed === "buyer"
										? `减去全部 ${volume} 张，就是假设每笔成交双方都平仓。买方标记只显示每笔成交的一方。`
										: `减去全部 ${volume} 张，就是假设每笔成交双方都平仓。标记会显示 ${opened} 张是双方开仓。`,
							],
							[
								"ledger",
								"Yes: count which trades added contracts and which removed them",
								"能：分别统计增加合约和减少合约的成交",
								feed === "volume"
									? `Sorting the trades needs each one's open/close flags. Knowing only the volume of ${volume}, you can't.`
									: "The buyer's flag alone can't sort them: a buyer who opens against a seller who closes is a transfer and adds nothing. You'd need the seller's flag too.",
								feed === "volume"
									? `区分这些成交需要每笔的开平仓标记。只知道 ${volume} 张的成交量，做不到。`
									: "仅凭买方标记无法区分：买方开仓、卖方平仓属于换手，不增加合约。你还需要卖方的标记。",
							],
						],
						feed === "both" ? "ledger" : "no",
						feed === "volume"
							? `A volume of ${volume} fits any ending from ${500 - volume}, if every trade closed, to ${500 + volume}, if every trade opened. Only the open and close record pins it at ${ending}.`
							: feed === "buyer"
								? `When the buyer opens, the seller may be opening too, which adds a contract, or closing, which only transfers one. Without the seller's flag, the ${volume} contracts don't pin the ending; both sides' flags put it at ${ending}.`
								: `Both sides' flags sort every trade: ${opened} opened on both sides, ${closed} closed on both sides and ${transfer} changed hands. 500 + ${opened} − ${closed} = ${ending}.`,
						feed === "volume"
							? `${volume} 的成交量对应的收盘未平仓量，可以从 ${500 - volume}（全部平仓）到 ${500 + volume}（全部开仓）。只有开平仓记录才能确定它是 ${ending}。`
							: feed === "buyer"
								? `买方开仓时，卖方可能也在开仓（增加一张），也可能在平仓（只是换手）。没有卖方标记，${volume} 张成交无法确定收盘数；双方的标记才能确定它是 ${ending}。`
								: `双方的标记能区分每笔成交：${opened} 张双方开仓，${closed} 张双方平仓，${transfer} 张换手。500 + ${opened} − ${closed} = ${ending}。`,
					),
					c(
						"series",
						`Separately, a dashboard row for ${rolling ? "ALFA calls with 14–30 days to expiry" : "ALFA calls expiring November 20"} shows open interest of ${plain(rowStart)} on September 1 and ${plain(rowEnd)} on September 2. What does the ${signed(rowChange)} change tell you?`,
						`另外，看板上“${rolling ? "距到期 14–30 天的 ALFA 看涨" : "11 月 20 日到期的 ALFA 看涨"}”这一行显示：9 月 1 日未平仓量为 ${plain(rowStart)}，9 月 2 日为 ${plain(rowEnd)}。${signed(rowChange)} 的变化说明了什么？`,
						[
							[
								"net",
								"A net change in the open interest of the same contracts",
								"同一批合约未平仓量的净变化",
								`A 14–30-day row rolls: from one day to the next, an expiry can enter or leave the window, so ${plain(rowStart)} and ${plain(rowEnd)} may not count the same contracts.`,
								`14–30 天这一行是滚动的：隔一天就可能有到期日进入或离开这个窗口，所以 ${plain(rowStart)} 和 ${plain(rowEnd)} 统计的可能不是同一批合约。`,
							],
							[
								"rolled",
								"Nothing firm: the row may count different contracts on each date",
								"说明不了什么：这一行在两个日期统计的可能是不同的合约",
								`The row is one fixed expiry, November 20, so both reports count the same contracts and ${signed(rowChange)} is their net change.`,
								`这一行是一个固定到期日（11 月 20 日），两次报告统计的是同一批合约，${signed(rowChange)} 就是它们的净变化。`,
							],
							[
								"trader",
								`That one trader ${rowChange > 0 ? "opened" : "closed"} ${plain(Math.abs(rowChange))} contracts`,
								`有一位交易者${rowChange > 0 ? "开了" : "平了"} ${plain(Math.abs(rowChange))} 张`,
								rolling
									? "Open interest is a net count across everyone, and this rolling row may not even count the same contracts on both dates."
									: `Open interest is a net count across everyone: ${signed(rowChange)} is all traders' opening minus closing, so it can't say who traded or how much any one trader did.`,
								rolling
									? "未平仓量是所有人的净计数，而这个滚动的行在两个日期统计的甚至可能不是同一批合约。"
									: `未平仓量是所有人的净计数：${signed(rowChange)} 是全体交易者开仓减平仓的结果，不能说明谁在交易，也不能说明某一个人做了多少。`,
							],
						],
						rolling ? "rolled" : "net",
						rolling
							? `A 14–30-day row holds whichever expiries fall in that window each day, so an expiry can enter or leave between reports. The ${signed(rowChange)} mixes position changes with that turnover; to measure positions, compare one fixed expiry.`
							: `A fixed expiry keeps the same contracts in the row, so ${signed(rowChange)} is their net change in open interest. It's still a net count: it doesn't say how many opened, or who traded.`,
						rolling
							? `14–30 天这一行每天包含落在窗口内的到期日，两次报告之间可能有到期日进入或离开。${signed(rowChange)} 混合了持仓变化与这种更替；要衡量持仓，应比较一个固定到期日。`
							: `固定到期日让这一行始终是同一批合约，所以 ${signed(rowChange)} 是它们未平仓量的净变化。它仍然是净值：不能说明开了多少，也不能说明是谁在交易。`,
					),
				],
			};
		},
	},
	{
		id: "trade-records",
		version: 3,
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
			/** The source's order ID on each report: none (guided), one ID on both, or a different ID on each. */
			const [first, second] = [
				[0, 0],
				[4417, 4417],
				[5120, 5188],
				[7302, 7302],
			][v];
			const link = first === 0 ? "none" : first === second ? "same" : "apart";
			return {
				brief: t(
					`Two prints in the same ALFA call: ${a} contracts at $2.00 and ${b} at $3.00. Both are unique, uncorrected reports, and one contract covers 100 shares.${link === "same" ? ` Both reports carry the source's order ID ${first}.` : link === "apart" ? ` The source tags them with different order IDs: ${first} and ${second}.` : ""}`,
					`同一个 ALFA 看涨有两笔成交：${a} 张成交在 $2.00，${b} 张成交在 $3.00。两条都是唯一且未更正的报告，一张合约对应 100 股。${link === "same" ? `两条报告都带有来源给出的订单编号 ${first}。` : link === "apart" ? `来源给它们标注了不同的订单编号：${first} 和 ${second}。` : ""}`,
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
						"Going by the records, were these two prints one order?",
						"根据这些记录，这两笔成交属于同一张订单吗？",
						[
							[
								"yes",
								"Yes: grouping them into one row shows it",
								"是：把它们合成一行就说明了这一点",
								link === "none"
									? "Grouping follows your rule, not the source's. A link needs its own evidence, such as an order ID, and these reports carry none."
									: link === "same"
										? `They were one order, but the row isn't what shows it: any two prints can be grouped. Both reports carry order ID ${first}.`
										: `Grouping follows your rule, not the source's. The reports carry different order IDs, ${first} and ${second}.`,
								link === "none"
									? "分组遵循的是你的规则，而不是来源的记录。关联需要单独的证据，比如订单编号，而这两条报告都没有。"
									: link === "same"
										? `它们确实属于同一张订单，但说明这一点的不是那一行：任何两笔成交都可以分到一组。两条报告都带有订单编号 ${first}。`
										: `分组遵循的是你的规则，而不是来源的记录。两条报告的订单编号不同：${first} 和 ${second}。`,
							],
							[
								"linked",
								"Yes: the records tie them to one order",
								"是：记录把它们连到同一张订单",
								link === "apart"
									? `The order IDs differ, ${first} and ${second}, so the source puts them in separate orders.`
									: "Nothing here ties them together: neither report carries an order ID.",
								link === "apart"
									? `订单编号不同（${first} 和 ${second}），来源把它们记为不同的订单。`
									: "这里没有任何信息把它们连在一起：两条报告都没有订单编号。",
							],
							[
								"apart",
								"No: the records put them in separate orders",
								"否：记录显示它们属于不同的订单",
								link === "same"
									? `Both reports carry order ID ${first}: the source puts them in the same order.`
									: "Nothing here separates them either: with no order ID, they could be one order or two.",
								link === "same"
									? `两条报告都带有订单编号 ${first}：来源把它们记为同一张订单。`
									: "这里也没有任何信息把它们分开：没有订单编号，它们可能是一张订单，也可能是两张。",
							],
							[
								"no",
								"Can't tell: nothing in the records links or separates them",
								"无法判断：记录里没有任何信息把它们连起来或分开",
								link === "same"
									? `The records do say: both reports carry order ID ${first}.`
									: `The records do say: the reports carry different order IDs, ${first} and ${second}.`,
								link === "same"
									? `记录给出了答案：两条报告都带有订单编号 ${first}。`
									: `记录给出了答案：两条报告的订单编号不同，分别是 ${first} 和 ${second}。`,
							],
						],
						link === "none" ? "no" : link === "same" ? "linked" : "apart",
						link === "none"
							? "Nothing here links the prints to one order or separates them into two. An aggregate row follows a grouping rule; a link needs its own evidence, such as a shared order ID."
							: link === "same"
								? `Both reports carry order ID ${first}, so the source ties them to one order. The aggregate row didn't show that; the ID did.`
								: `Different order IDs, ${first} and ${second}, mean two orders, even though one rule grouped them. Two orders can still come from one trader; the IDs don't say who.`,
						link === "none"
							? "这里没有任何信息把两笔成交连到同一张订单，也没有把它们分成两张。聚合行只是遵循分组规则；关联需要单独的证据，比如相同的订单编号。"
							: link === "same"
								? `两条报告都带有订单编号 ${first}，来源把它们连到同一张订单。说明这一点的是编号，而不是聚合行。`
								: `订单编号不同（${first} 和 ${second}），说明是两张订单，尽管同一条规则把它们分到了一组。两张订单仍可能来自同一个交易者；编号不能说明是谁。`,
					),
				],
			};
		},
	},
	{
		id: "execution-conditions",
		version: 3,
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
			/** The buyer's open/close flag on the fills: none (guided), opening or closing. */
			const flag = (["none", "opening", "none", "closing"] as const)[v];
			/** Whether the separate pair of prints in the last question is a priced package. */
			const packaged = v !== 2;
			return {
				brief: t(
					`One buy order sweeps three venues within milliseconds: ${a} ALFA calls at $2.10, ${b} at $2.11 and ${d} at $2.12. Each fill prints separately with a sweep condition, and one contract covers 100 shares.${flag === "opening" ? " Each fill also carries the buyer's opening flag." : flag === "closing" ? " Each fill also carries the buyer's closing flag." : ""}`,
					`一张买单在几毫秒内扫过三个场所：${a} 张 ALFA 看涨成交在 $2.10，${b} 张在 $2.11，${d} 张在 $2.12。每次成交都带扫单条件分别打印，一张合约对应 100 股。${flag === "opening" ? "每次成交还带有买方的开仓标记。" : flag === "closing" ? "每次成交还带有买方的平仓标记。" : ""}`,
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
							[
								"institution",
								"An institution placed it",
								"下单的是机构",
								"A sweep code says how the order was routed, not who sent it. Anyone with the right access can sweep.",
								"扫单代码说明订单是怎么路由的，而不是谁发出的。任何有相应权限的人都可以扫单。",
							],
							[
								"opening",
								"The buyer opened a new bullish position",
								"买方新开了一个看涨仓位",
								flag === "opening"
									? "The opening flag, not the sweep code, says the buyer opened, and neither shows a bullish view. The sweep code says only how the order was routed."
									: flag === "closing"
										? "The sweep code says nothing about opening, and here the closing flag says the buyer was closing calls it had sold."
										: "Routing says nothing about opening or closing, or about a view. The buyer may have been closing a short call.",
								flag === "opening"
									? "说明买方开仓的是开仓标记，而不是扫单代码，两者都不能说明看涨的看法。扫单代码只说明订单如何路由。"
									: flag === "closing"
										? "扫单代码不能说明开仓；这里的平仓标记还说明买方是在平掉之前卖出的看涨。"
										: "路由方式不能说明开仓还是平仓，也不能说明看法。买方可能是在平掉看涨空头。",
							],
						],
						"routing",
						"A sweep describes how the order was routed. Who sent it, what they knew, and whether it opened a position all need other evidence.",
						"扫单描述的是订单如何路由。谁下的单、掌握什么信息、是否开了新仓，都需要其他证据。",
					),
					c(
						"open-close",
						"Did the buyer open new positions with this order?",
						"买方用这张订单开了新仓吗？",
						[
							[
								"unknown",
								"Can't tell: nothing here says whether the buyer opened or closed",
								"无法判断：这里没有信息说明买方是开仓还是平仓",
								`Something here does: each fill carries the buyer's ${flag === "closing" ? "closing" : "opening"} flag.`,
								`这里有信息：每次成交都带有买方的${flag === "closing" ? "平仓" : "开仓"}标记。`,
							],
							[
								"opened",
								"Yes: the buyer opened new long calls",
								"是：买方新开了看涨多头",
								flag === "closing"
									? "Each fill carries the buyer's closing flag: the buyer was buying back calls it had sold."
									: "Nothing here says opening: the fills carry a sweep condition but no open/close flag.",
								flag === "closing"
									? "每次成交都带有买方的平仓标记：买方是在买回之前卖出的看涨。"
									: "这里没有信息说明开仓：这些成交带有扫单条件，但没有开平仓标记。",
							],
							[
								"closed",
								"No: the buyer bought back calls it had sold",
								"否：买方买回了之前卖出的看涨",
								flag === "opening"
									? "Each fill carries the buyer's opening flag: the buyer opened new long calls."
									: "Nothing here says closing either: with no open/close flag, both are possible.",
								flag === "opening"
									? "每次成交都带有买方的开仓标记：买方新开了看涨多头。"
									: "这里也没有信息说明平仓：没有开平仓标记，两种都有可能。",
							],
							[
								"urgent",
								"Yes: an urgent sweep means new buying",
								"是：急迫的扫单说明是新买入",
								flag === "opening"
									? "The buyer did open, but the opening flag shows it, not the sweep: an urgent order can close a position just as well."
									: flag === "closing"
										? "An urgent order can close a position as well as open one: here each fill carries the buyer's closing flag."
										: "A sweep says how the order was routed, not whether it opened. That needs an open/close flag, and these fills carry none.",
								flag === "opening"
									? "买方确实开了仓，但说明这一点的是开仓标记，而不是扫单：急迫的订单同样可以用来平仓。"
									: flag === "closing"
										? "急迫的订单既能开仓也能平仓：这里每次成交都带有买方的平仓标记。"
										: "扫单说明订单如何路由，而不是是否开仓。那需要开平仓标记，而这些成交都没有。",
							],
						],
						flag === "opening"
							? "opened"
							: flag === "closing"
								? "closed"
								: "unknown",
						flag === "opening"
							? "The buyer's opening flag says these calls opened new long positions. The sweep code alone couldn't show that, and neither says what the buyer expects."
							: flag === "closing"
								? "The buyer's closing flag says the buyer was buying back calls it had sold. An urgent buy sweep can close a position rather than start a new bet."
								: "A sweep code says how the order was routed. Whether the buyer opened or closed needs an open/close flag, and these fills carry none.",
						flag === "opening"
							? "买方的开仓标记说明这些看涨是新开的多头。仅凭扫单代码无法说明这一点，两者也都不能说明买方的预期。"
							: flag === "closing"
								? "买方的平仓标记说明买方是在买回之前卖出的看涨。急迫的扫单买入可能是在平仓，而不是新下注。"
								: "扫单代码说明订单如何路由。买方是开仓还是平仓，需要开平仓标记，而这些成交都没有。",
					),
					c(
						"package",
						packaged
							? "Separately, a spread's two legs print at $5.25 and $2.25, each above its own ask, while the spread itself trades at $3.00 net inside its $2.90–$3.30 market. How should you read it?"
							: "Separately, two ALFA calls print in the same second at $4.40 and $1.65, each above its own ask on a valid quote from that moment. Neither print carries a complex-order condition or a package ID. How should you read them?",
						packaged
							? "另外，一个价差的两条腿分别成交在 $5.25 和 $2.25，都高于各自的卖价，而价差本身以净价 $3.00 成交，位于 $2.90–$3.30 的组合市场之内。应该如何解读？"
							: "另外，两张 ALFA 看涨在同一秒分别成交在 $4.40 和 $1.65，各自都高于当时有效报价中的卖价。两笔成交都没有复杂订单条件，也没有组合单编号。应该如何解读？",
						[
							[
								"package",
								"As one package that traded inside its market; where each leg printed isn't evidence of who was aggressive",
								"作为在组合市场内成交的一个整体；各条腿成交在哪里，并不能说明谁是主动方",
								"Nothing here makes them a package: no complex-order condition, no package ID and no package price. Read each print against its own quote.",
								"这里没有任何信息说明它们是一个整体：没有复杂订单条件、没有组合单编号，也没有组合价格。应该把每笔成交与它自己的报价比较。",
							],
							[
								"buys",
								"As two aggressive buys: both printed above the ask",
								"作为两笔主动买入：两笔都高于卖价",
								"A leg's print location means little inside a package: the price that counts is the $3.00 net, which sits inside the spread's own market.",
								"在组合单里，单条腿的成交位置意义不大：要看的是 $3.00 的净价，它位于价差自身的买卖报价之内。",
							],
							[
								"sells",
								"As two aggressive sells hidden inside a spread",
								"作为藏在价差里的两笔主动卖出",
								packaged
									? "Nothing points to selling: the package traded at $3.00, inside its $2.90–$3.30 market. Read it as one package, not hidden aggression."
									: "Both printed above their asks, which points to buyers, not sellers, and nothing puts them in a spread.",
								packaged
									? "没有任何迹象表明是卖出：组合单成交在 $3.00，位于 $2.90–$3.30 的报价之内。应把它当作一个整体来读，而不是隐藏的主动方。"
									: "两笔都高于各自的卖价，指向的是买方而不是卖方；也没有任何信息说明它们属于一个价差。",
							],
						],
						packaged ? "package" : "buys",
						packaged
							? "A complex order is priced as a whole. Read leg by leg, the leg that was sold would look like an aggressive buy."
							: "With no complex-order condition or link, each print stands on its own, and a print above its ask points to an aggressive buyer. That still doesn't say who bought or why.",
						packaged
							? "复杂订单是按整体定价的。如果逐条腿去读，被卖出的那条腿会看起来像主动买入。"
							: "没有复杂订单条件或关联，每笔成交各自独立；高于卖价的成交指向主动买方。但这仍然不能说明是谁买的、为什么买。",
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
		version: 3,
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
			/** How the spread's legs show on the tape: not shown (guided: the 110 sale alone), linked as one package, or side by side with no link. */
			const tape = (["alone", "linked", "unlinked", "linked"] as const)[v];
			/** What the second account's statement shows beside its 95 put: 100 shares, nothing in ALFA, or no statement at all. */
			const holding = (["shares", "shares", "unseen", "none"] as const)[v];
			return {
				brief: t(
					`You bought an ALFA 100/110 call spread for ${money(cost)} a share net: long the 100 call and short the 110 call, same expiry.${tape === "linked" ? " On the tape, both legs printed in the same second, the same size, each with a multi-leg condition and the same package ID." : tape === "unlinked" ? " On the tape, both legs printed in the same second, the same size, with no condition code or package ID." : ""} At expiry ALFA is ${money(spot)}. One contract covers 100 shares; ignore fees.\n\nSeparately, a second account buys one ALFA 95 put. ${holding === "shares" ? "Its statement shows 100 ALFA shares." : holding === "none" ? "Its statement shows no ALFA shares and no other ALFA options." : "You see that trade, but not the account's statement."}`,
					`你以每股净价 ${money(cost)} 买入了 ALFA 100/110 看涨价差：多头 100 看涨、空头 110 看涨，到期日相同。${tape === "linked" ? "在成交记录上，两条腿在同一秒成交，数量相同，都带有多腿条件和同一个组合单编号。" : tape === "unlinked" ? "在成交记录上，两条腿在同一秒成交，数量相同，但都没有条件代码或组合单编号。" : ""}到期时 ALFA 为 ${money(spot)}。一张合约对应 100 股，不计费用。\n\n另外，第二个账户买入一张 ALFA 95 看跌。${holding === "shares" ? "它的账户报表显示持有 100 股 ALFA。" : holding === "none" ? "它的账户报表显示没有 ALFA 股票，也没有其他 ALFA 期权。" : "你只看到这笔成交，看不到该账户的报表。"}`,
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
						tape === "alone"
							? "If you saw only the 110 call being sold, could you tell it was part of this spread?"
							: "Could someone watching the tape tell your 110 call sale was part of this spread?",
						tape === "alone"
							? "如果只看到 110 看涨被卖出，你能判断它属于这组价差吗？"
							: "旁观成交记录的人，能看出你卖出的 110 看涨属于这组价差吗？",
						[
							[
								"can",
								"Yes: selling calls always means a spread",
								"能：卖出看涨总是意味着价差",
								tape === "linked"
									? "They could tell here, but not because selling calls means a spread: the multi-leg condition and shared package ID tie the two legs together."
									: tape === "unlinked"
										? "Selling calls doesn't always mean a spread: with no condition code or package ID, the sale could be a covered call, a close or an uncovered sale."
										: "Selling calls doesn't always mean a spread: it could be a covered call, a close or an uncovered sale. You'd need the other leg and a link between them.",
								tape === "linked"
									? "这里确实能看出来，但不是因为卖出看涨就意味着价差：是多腿条件和同一个组合单编号把两条腿连在一起。"
									: tape === "unlinked"
										? "卖出看涨并不总是价差：没有条件代码或组合单编号，这笔卖出可能是备兑看涨、平仓或未备兑卖出。"
										: "卖出看涨并不总是价差：它可能是备兑看涨、平仓或未备兑卖出。你需要另一条腿以及两者之间的关联。",
							],
							[
								"cannot",
								"No: you'd need the other leg and a link between them",
								"不能：需要另一条腿以及两者之间的关联",
								"The tape has both: the other leg printed beside it, and the multi-leg condition and shared package ID link them.",
								"成交记录两样都有：另一条腿就在旁边成交，多腿条件和同一个组合单编号把它们连了起来。",
							],
							[
								"linked",
								"Yes: the tape ties it to the 100 call buy",
								"能：成交记录把它和 100 看涨的买入连在一起",
								tape === "unlinked"
									? "Printing in the same second, at the same size, isn't a link: neither print carries a condition code or package ID, so they could be separate trades."
									: "With only the 110 call's print in view, there's no other leg to tie it to.",
								tape === "unlinked"
									? "同一秒、同样数量成交并不是关联：两笔都没有条件代码或组合单编号，它们可能是各自独立的交易。"
									: "只看到 110 看涨这一笔成交时，没有另一条腿可以和它连在一起。",
							],
						],
						tape === "linked" ? "linked" : "cannot",
						tape === "linked"
							? "A multi-leg condition and one package ID on two same-size prints tie the short 110 call to the long 100 call. Without them, the sale alone could be a covered call, a close or an outright short."
							: tape === "unlinked"
								? "Same second and same size suggest a link but don't prove one. With no condition code or package ID, the sale could be a separate trade; only a linked-leg record settles it."
								: "A lone short-call print could be a covered call, a spread's leg or an outright short. The structure comes from the linked legs, which a single print doesn't carry.",
						tape === "linked"
							? "两笔数量相同的成交带有多腿条件和同一个组合单编号，把 110 看涨空头和 100 看涨多头连在一起。没有这些，单看这笔卖出，可能是备兑、平仓，也可能是单纯做空。"
							: tape === "unlinked"
								? "同一秒、数量相同只是提示可能有关联，并不能证明。没有条件代码或组合单编号，这笔卖出可能是独立的交易；只有关联腿记录才能确定。"
								: "一笔单独的看涨卖出，可能是备兑、价差的一条腿，也可能是单纯做空。结构来自相互关联的各条腿，而单笔成交不包含这些信息。",
					),
					c(
						"put",
						"What is the second account's 95 put doing?",
						"第二个账户的 95 看跌起什么作用？",
						[
							[
								"protect",
								"Protecting shares: the account still gains if ALFA rises",
								"保护持股：ALFA 上涨时账户仍然获利",
								holding === "none"
									? "Its statement shows no ALFA shares, so the put has nothing to protect."
									: "You can't see the account's statement, so you can't say it holds shares to protect.",
								holding === "none"
									? "它的报表显示没有 ALFA 股票，看跌没有可以保护的持股。"
									: "你看不到该账户的报表，所以不能说它持有需要保护的股票。",
							],
							[
								"bearish",
								"Betting on a fall: the account gains only if ALFA drops",
								"押注下跌：只有 ALFA 下跌时账户才获利",
								holding === "shares"
									? "Buying a put isn't bearish by itself: with 100 shares, the account gains if ALFA rises, and the put limits the loss below $95."
									: "A lone put looks bearish, but you can't see the account: it may hold shares the put protects.",
								holding === "shares"
									? "买入看跌本身并不代表看空：持有 100 股时，ALFA 上涨账户就获利，看跌只是限制了 $95 以下的亏损。"
									: "单独一张看跌看起来是看空，但你看不到这个账户：它可能持有这张看跌所保护的股票。",
							],
							[
								"unknown",
								"Can't tell: nothing here shows what else the account holds",
								"无法判断：这里看不到账户还持有什么",
								holding === "shares"
									? "The statement shows it: 100 ALFA shares."
									: "The statement shows it: no ALFA shares and no other ALFA options.",
								holding === "shares"
									? "报表给出了答案：持有 100 股 ALFA。"
									: "报表给出了答案：没有 ALFA 股票，也没有其他 ALFA 期权。",
							],
						],
						holding === "shares"
							? "protect"
							: holding === "none"
								? "bearish"
								: "unknown",
						holding === "shares"
							? "Shares plus a long put is a protective put: the account still gains if ALFA rises, and the put caps the loss if ALFA falls below $95. The put's direction alone doesn't show the position."
							: holding === "none"
								? "With no ALFA shares or other ALFA options, the put stands alone: the account's ALFA position gains only if ALFA falls."
								: "A lone put purchase could be a bet on a fall or a hedge on shares. Without the account's holdings, you can't tell which.",
						holding === "shares"
							? "股票加看跌多头是保护性看跌：ALFA 上涨时账户仍然获利，ALFA 跌破 $95 时看跌限制亏损。仅看这张看跌的方向，看不出整个持仓。"
							: holding === "none"
								? "没有 ALFA 股票，也没有其他 ALFA 期权，这张看跌是单独的：该账户在 ALFA 上的持仓只有 ALFA 下跌时才获利。"
								: "单独一笔看跌买入，可能是押注下跌，也可能是对持股的对冲。看不到账户持仓，就无法判断。",
					),
				],
			};
		},
	},
	{
		id: "symbol-drawer",
		version: 3,
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
			/** The flow record's symbol: ALFA's, except in case 2, where another symbol's record has the right session. */
			const symbol = v === 2 ? "BETA" : "ALFA";
			const base = [1000, 1200, 1500, 1800][v];
			const change = [-70, 85, -130, 40][v];
			const later = base + change;
			return {
				brief: t(
					`You need ALFA's option flow for the September 3 session, plus open interest from an earlier report with its date. Your flow record is ${symbol}'s for September ${current ? 3 : 2}. Open-interest reports for one fixed series show ${plain(base)} on September 1 and ${plain(later)} on September 2.`,
					`你需要 ALFA 9 月 3 日交易时段的期权成交流，以及更早一次带日期的未平仓量报告。你手上的成交记录是 ${symbol} 9 月 ${current ? 3 : 2} 日的。同一固定序列的未平仓量报告显示：9 月 1 日 ${plain(base)}，9 月 2 日 ${plain(later)}。`,
				),
				questions: [
					c(
						"flow-gate",
						"Does the flow record meet the requirement?",
						"这份成交记录满足要求吗？",
						[
							[
								"yes",
								"Yes: its session matches",
								"满足：交易时段一致",
								symbol === "ALFA"
									? "The flow is from September 2, and the requirement is September 3. Its session doesn't match."
									: `The session matches, but the record is ${symbol}'s. You need ALFA's flow, and another symbol can't stand in for it.`,
								symbol === "ALFA"
									? "成交流来自 9 月 2 日，而要求是 9 月 3 日。时段并不一致。"
									: `时段一致，但记录是 ${symbol} 的。你需要的是 ALFA 的成交流，其他标的不能代替。`,
							],
							[
								"no",
								"No: it's from a different session",
								"不满足：来自另一个交易时段",
								symbol === "ALFA"
									? "The flow is from September 3, as required. Check each field against its own requirement."
									: `The session is right: September 3. What's wrong is the symbol: the record is ${symbol}'s, not ALFA's.`,
								symbol === "ALFA"
									? "成交流来自 9 月 3 日，符合要求。每个字段要对照它自己的要求。"
									: `时段没问题，是 9 月 3 日。问题在于标的：记录是 ${symbol} 的，不是 ALFA 的。`,
							],
							[
								"oi",
								"No: the open interest is from an earlier date",
								"不满足：未平仓量来自更早的日期",
								"Earlier dated open interest was allowed. The question is about the flow record, and only its own symbol and session decide it.",
								"允许使用更早、带日期的未平仓量。问题问的是成交记录，只由它自己的标的和时段决定。",
							],
							[
								"symbol",
								"No: it's for a different symbol",
								"不满足：是另一个标的的记录",
								current
									? "The record is ALFA's, the symbol you need, and its session matches."
									: "The record is ALFA's, the symbol you need. What's wrong is its session: September 2, not September 3.",
								current
									? "记录是 ALFA 的，正是你需要的标的，时段也一致。"
									: "记录是 ALFA 的，正是你需要的标的。问题在于时段：是 9 月 2 日，而不是 9 月 3 日。",
							],
						],
						symbol !== "ALFA" ? "symbol" : current ? "yes" : "no",
						symbol !== "ALFA"
							? `The record is from September 3, as required, but it's ${symbol}'s flow, not ALFA's. A matching session can't make another symbol's data stand in for ALFA.`
							: current
								? "The flow is from September 3, as required, and earlier dated open interest was allowed. Check each field against its own requirement."
								: "The flow is from September 2, not September 3, so it fails. The open interest was allowed to be earlier; that part is fine.",
						symbol !== "ALFA"
							? `记录来自 9 月 3 日，符合要求，但它是 ${symbol} 的成交流，不是 ALFA 的。时段一致，也不能让其他标的的数据代替 ALFA。`
							: current
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
		version: 3,
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
					kind: "spread" as const,
					spot: 100,
					text: t(
						"You buy an ALFA 100 call at $4.20 and sell an ALFA 105 call at $2.05, same expiry: a 100/105 call spread.",
						"你以 $4.20 买入一张 ALFA 100 看涨，并以 $2.05 卖出一张同一到期日的 ALFA 105 看涨：100/105 看涨价差。",
					),
					price: 2.15,
					top: 100,
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
			const spread = cases.kind === "spread";
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
							: `${spread ? "$4.20 − $2.05" : "$4.20 + $4.20"} = ${money(cases.price)} a share. That's also the most it can lose.`,
						condor
							? `卖出各腿的收入减去两翼的成本：每股 ${money(cases.price)}。这也是这组铁鹰最多能赚的。`
							: `${spread ? "$4.20 − $2.05" : "$4.20 + $4.20"} = 每股 ${money(cases.price)}。这也是它最多会亏的。`,
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
							: spread
								? `Above ${money(cases.top, 0)} the long call starts paying, and it must be worth the whole ${money(cases.price)} before the short 105 call costs anything: ${money(cases.top, 0)} + ${money(cases.price)} = ${money(breakEven)}.`
								: `Above ${money(cases.top, 0)} only the call pays, and it must be worth the whole ${money(cases.price)}: ${money(cases.top, 0)} + ${money(cases.price)} = ${money(breakEven)}.`,
						condor
							? `卖出的 ${cases.top} 看涨在 ${money(cases.top, 0)} 以上开始亏钱；${money(cases.price)} 的收入抵掉最开始的 ${money(cases.price)}：${money(cases.top, 0)} + ${money(cases.price)} = ${money(breakEven)}。`
							: spread
								? `在 ${money(cases.top, 0)} 以上，买入的看涨开始赚钱；在卖出的 105 看涨开始亏钱之前，它必须值满 ${money(cases.price)}：${money(cases.top, 0)} + ${money(cases.price)} = ${money(breakEven)}。`
								: `在 ${money(cases.top, 0)} 以上只有看涨赚钱，它必须值满 ${money(cases.price)}：${money(cases.top, 0)} + ${money(cases.price)} = ${money(breakEven)}。`,
						0.01,
					),
					c(
						"view",
						"What does this position need to make money?",
						"这个持仓要赚钱需要什么？",
						[
							[
								"big",
								"A big move, either way",
								"大幅变动，方向不限",
								spread
									? `A fall doesn't help: below $100 both calls expire worthless and the ${money(cases.price)} is lost. Only a rise pays.`
									: "A big move is what a long straddle or strangle needs. This short condor loses if the stock breaks out; it needs calm.",
								spread
									? `下跌没有帮助：低于 $100 时两张看涨都作废，${money(cases.price)} 全部亏掉。只有上涨才赚钱。`
									: "大幅变动是跨式或宽跨式多头需要的。这组铁鹰空头在股价突破时亏损，它需要平稳。",
							],
							[
								"up",
								"A rise",
								"上涨",
								condor
									? "A rise past the short call strike loses money for a short condor. It profits only while the stock stays between its short strikes."
									: "A rise is only half of it: the long put pays if the stock falls far enough too. Either big move works.",
								condor
									? "对铁鹰空头来说，涨过卖出的看涨行权价会亏钱。只有股价留在两个卖出行权价之间时才获利。"
									: "上涨只是一半：股价跌得足够多时，看跌多头同样赚钱。向任一方向的大幅变动都可以。",
							],
							[
								"calm",
								"The stock staying in a range",
								"股价留在一个区间内",
								spread
									? `If ALFA stays at $100, the 100 call expires worthless and the spread loses its ${money(cases.price)}. It needs a rise past ${money(breakEven)}.`
									: "A long straddle loses most if the stock stays put, because both legs lose value. It needs a move past a break-even.",
								spread
									? `如果 ALFA 停在 $100，100 看涨到期作废，价差亏掉 ${money(cases.price)}。它需要涨过 ${money(breakEven)}。`
									: "跨式多头在股价原地不动时亏得最多，因为两条腿都在贬值。它需要越过盈亏平衡点的变动。",
							],
						],
						condor ? "calm" : spread ? "up" : "big",
						condor
							? "A short iron condor keeps its credit while the stock stays between the short strikes and loses if it breaks out either way."
							: spread
								? `The long 100 call gains as ALFA rises, and the short 105 call caps that gain above $105. It makes money only above ${money(breakEven)}.`
								: "A long straddle pays only once the stock moves past one of its break-evens, up or down. Staying still is its worst case.",
						condor
							? "铁鹰空头在股价留在两个卖出行权价之间时保留收入，任一方向突破都会亏损。"
							: spread
								? `100 看涨多头随 ALFA 上涨获利，105 看涨空头把 $105 以上的收益封顶。只有 ALFA 高于 ${money(breakEven)} 时才赚钱。`
								: "跨式多头只有在股价越过某个盈亏平衡点时才赚钱，向上向下都可以。原地不动是它的最坏情况。",
					),
				],
			};
		},
	},
];
