import "@tanstack/react-start/server-only";
import {
	choose as c,
	fact,
	money,
	numberQuestion as n,
	oi,
	plain,
	quotes,
	type TeachingUnit,
	t,
	write,
} from "./authoring.server";

export const researchUnits: TeachingUnit[] = [
	{
		id: "audited-boundary",
		version: 3,
		conceptLab: {
			kind: "audited-boundary",
			intro: t(
				"Turn 'where's the action in ALFA?' into a question someone else can check, sort the evidence behind its answer, and keep the record when new data or a new question arrives.",
				"把“ALFA 哪里最活跃？”变成别人可以核查的问题，区分答案背后的证据，并在新数据或新问题出现时保留记录。",
			),
		},
		sources: [oi, quotes],
		explanation: t(
			"Start with a question whose subject, quantity, universe, time interval and evidence requirements are explicit. A descriptive question asks what happened; a forecasting question additionally needs a measurable future outcome, horizon and out-of-sample evaluation. 'What will rally?' is underspecified, not inherently untestable. This course does not validate a trading forecast from a single print. Separate observed facts, calculations, interpretations, contradictions and unknowns. An invalidation rule says which failure of evidence or tested hypothesis would require reconsideration. New evidence may test the same question. Changing the population, instrument or method creates a different question; preserve the original record instead of retrofitting it to the interesting result.",
			"先明确问题的对象、测量量、范围、时间区间与证据要求。描述性问题问发生了什么，预测性问题还需可测未来结果、期限与样本外评价。“什么会上涨”是不够明确，不是本质上不可检验。本课不会从单笔成交验证交易预测。区分观测、计算、解读、反证与未知。失效规则说明哪类证据或假设失败需要重新考虑。新证据可检验同一问题，但更换人群、工具或方法会形成新问题；应保留原记录，避免事后迎合突出结果。",
		),
		example: t(
			"Question: among ALFA's Oct 18 calls, strikes 100 to 120, where did Monday September 16 session volume concentrate? Record the consolidated tape, the complete-session cutoff and the missing 120 call. Tuesday's delivery of the 120 call tests this question. Replacing calls with puts after seeing the leader changes it. One person can own the note and its revision history.",
			"问题：在 ALFA 10月18日 看涨（行权价 100 至 120）中，9 月 16 日周一的成交集中在哪里？记录综合成交记录、完整时段截止及缺失的 120 看涨。周二送达的 120 看涨数据可检验该问题；看完领先者后改为看跌，则改变问题。一个人即可负责笔记与修订历史。",
		),
		misconception: t(
			"A good question can be answered with evidence and says what would revise the answer. Caution alone isn't an answer: write the actual scope and what you measure.",
			"好的问题可以用证据回答，并说明什么情况会让答案需要修订。光表示谨慎不算答案：要写出实际范围和测量的内容。",
		),
		case: (v) => {
			const day = [3, 4, 8, 9][v];
			const strikes = [100, 105, 110, 115, 120];
			// The call whose volume hasn't arrived at the cutoff, if any, and the leader among calls with data.
			const missing = [110, 120, null, 115][v];
			const lead = [105, 110, 100, 105][v];
			return {
				brief: t(
					`Your research record asks about BETA calls expiring October 16, from tape-B, for the September ${day} session. A colleague proposes a rerun that ${v % 2 ? "switches to puts after seeing which call had the most volume" : "adds one corrected call trade from the same session and keeps the method"}.`,
					`你的研究记录问的是 10 月 16 日到期的 BETA 看涨，来源 tape-B，9 月 ${day} 日交易时段。一位同事建议重跑：${v % 2 ? "在看到哪张看涨成交最多之后，改为研究看跌" : "加入同一时段的一笔更正后的看涨成交，方法不变"}。`,
				),
				facts: [
					fact("Calls in the question", "问题中的看涨", strikes.join(", ")),
					fact(
						"Calls with volume at the cutoff",
						"截止时有成交量的看涨",
						strikes.filter((strike) => strike !== missing).join(", "),
					),
					fact(
						"Most volume among calls with data",
						"有数据的看涨中成交量最多",
						String(lead),
					),
				],
				questions: [
					c(
						"change",
						"Does the proposal change your research question?",
						"这个建议会改变你的研究问题吗？",
						[
							[
								"new",
								"Yes: write it as a new question and keep the original record",
								"会：把它写成新问题，并保留原来的记录",
								"A corrected trade from the same session and population is new evidence for the same question. Rerun it under the existing record.",
								"同一时段、同一范围内的一笔更正成交，是同一问题的新证据。在原记录下重跑即可。",
							],
							[
								"same",
								"No: corrected evidence tests the same question",
								"不会：更正后的证据检验的是同一个问题",
								"Switching to puts after seeing the call results changes what's studied. That's a new question, and the original record stays as it was.",
								"看到看涨结果后改研究看跌，改变了研究对象。这是新问题，原记录保持不变。",
							],
						],
						v % 2 ? "new" : "same",
						v % 2
							? "Switching to puts after seeing the results changes what's being studied, so it's a new question. The original record stays as it was."
							: "A corrected trade from the same session and population is new evidence for the same question, so rerun it under the existing record.",
						v % 2
							? "看到结果后改研究看跌，改变了研究对象，所以这是一个新问题。原来的记录保持不变。"
							: "同一时段、同一范围内的一笔更正成交，是同一问题的新证据，所以在原记录下重跑即可。",
					),
					write(
						"question",
						"Write the question you're actually answering: what you measure, the source, the cutoff, and one thing that would make you revise the answer.",
						"写出你实际要回答的问题：测量什么、来源、截止时间，以及一件会让你修订答案的事。",
						`For example: "Among BETA calls expiring October 16, which strike had the most volume in the September ${day} session, from tape-B with a complete-session cutoff? Revise if a required strike's data is still missing at the cutoff." Check that your wording has each of those parts; it isn't graded by a machine.`,
						`例如：“在 10 月 16 日到期的 BETA 看涨中，哪个行权价在 9 月 ${day} 日交易时段成交最多？来源 tape-B，以完整交易时段为截止。如果截止时仍缺少必要行权价的数据，则修订。”检查你的写法是否包含这些部分；这一题不由机器评分。`,
						40,
					),
					c(
						"leader",
						`At the cutoff, can the record name the ${lead} call the leader of all the calls in the question?`,
						`截止时，记录能把 ${lead} 看涨称为问题中所有看涨的领先者吗？`,
						[
							[
								"yes",
								"Yes: it has the most, and every call in the question has data",
								"能：它最多，而且问题中的每个看涨都有数据",
								`The ${missing} call has no volume at the cutoff, and it could be larger. Record the ${lead} call as the leader of the calls with data, and say the ${missing} call is missing.`,
								`${missing} 看涨在截止时没有成交量数据，它可能更大。把 ${lead} 看涨记为有数据看涨中的领先者，并注明 ${missing} 看涨缺失。`,
							],
							[
								"not-yet",
								"Not yet: it leads only the calls with data",
								"暂时不能：它只在有数据的看涨中领先",
								`All five calls from 100 to 120 have volume at the cutoff, so nothing is missing: the ${lead} call leads every call in the question.`,
								`100 到 120 的五个看涨在截止时都有成交量数据，没有缺失：${lead} 看涨在问题中的所有看涨里领先。`,
							],
						],
						missing === null ? "yes" : "not-yet",
						missing === null
							? `Every call in the question has volume at the cutoff, so the comparison covers the whole question and the ${lead} call leads it.`
							: `The ${missing} call's volume hadn't arrived by the cutoff, so the leader of the whole question has to wait. Record the ${lead} call as the leader of the calls with data, and revise when the ${missing} call arrives.`,
						missing === null
							? `问题中的每个看涨在截止时都有成交量数据，所以比较覆盖了整个问题，${lead} 看涨领先。`
							: `${missing} 看涨的成交量在截止时还没到，所以整个问题的领先者要等一等。把 ${lead} 看涨记为有数据看涨中的领先者，等 ${missing} 看涨的数据到了再修订。`,
					),
				],
			};
		},
	},
	{
		id: "symbol-universe",
		version: 3,
		conceptLab: {
			kind: "symbol-universe",
			intro: t(
				"Check eight symbols against a declared rule, keep an unobserved stock apart from the ones you measured, and use the list of names that existed on the date you compare.",
				"按声明的规则检查八个标的，把未观测的股票与已测量的分开，并使用比较日期当时存在的名单。",
			),
		},
		sources: [oi],
		explanation: t(
			"A comparison universe is a declared set of eligible observations. Derive eligibility from source facts rather than trusting a green badge: instrument identity, selected session, required coverage and liquidity threshold. Keep the intended population separate from the subset actually observed. Excluding a missing high-volume candidate may be necessary for a measured comparison, but it does not prove the remaining leader is largest in the unseen full universe. Sector is an industry classification, market capitalization is share price times shares outstanding, and an earnings date marks a scheduled event rather than guaranteed news timing. These can define the question together with underlying type, but they are not interchangeable filters; an index without a sector is not an unknown instrument. Historical membership must be point-in-time to avoid survivorship bias. A reference denominator can mean peer count or a numeric normalization baseline; say which one you are using.",
			"比较范围是声明的合格观测集合。资格应由来源事实决定，不是只信绿色标签：工具身份、时段、必需覆盖与流动性阈值。区分目标人群与实际观测子集。缺失大成交候选可能需从测量比较中排除，但剩余领先者不因此成为未知完整范围的最大值。行业是产业分类，市值为股价乘流通在外股数，财报日期标识计划事件，不保证消息公布时刻。它们可与标的类型一起定义问题，但不能互换使用；指数没有行业分类，并不代表工具未知。历史成员应按当时确定，避免幸存者偏差。分母可能指同组数量，也可能指归一化基准，需明确。",
		),
		example: t(
			"Rule: stock options, Monday September 16, data present, at least 500 contracts. DUNE: stock/Monday/900; BRDX: ETF/Monday/4,200; EMBR: stock/Friday/3,100; FJOR: stock/Monday/missing. Only DUNE is a valid observed comparison among these. FJOR is unknown, not zero, and limits full-universe claims.",
			"规则：股票期权、9 月 16 日周一、有数据、至少 500 张。DUNE：股票/周一/900；BRDX：ETF/周一/4,200；EMBR：股票/周五/3,100；FJOR：股票/周一/缺失。其中只有 DUNE 可作有效观测比较。FJOR 是未知而不是零，限制完整范围结论。",
		),
		misconception: t(
			"Settle who qualifies before you rank. Changing the exclusions after seeing the winner changes the question.",
			"先确定谁有资格，再排名。看到领先者之后再改排除规则，就改变了问题。",
		),
		case: (v) => {
			const a = [800, 900, 650, 750][v];
			const b = [400, 700, 450, 950][v];
			// IOTA's volume when its observation is complete; null when it's missing.
			const iota = [null, 300, 520, null][v];
			const names: [string, number | null][] = [
				["ALFA", a],
				["BETA", b],
				["IOTA", iota],
			];
			const admitted = names.flatMap(([symbol, volume]) =>
				volume !== null && volume >= 500 ? [{ symbol, volume }] : [],
			);
			const below = names.flatMap(([symbol, volume]) =>
				volume !== null && volume < 500 ? [{ symbol, volume }] : [],
			);
			const total = admitted.reduce((sum, row) => sum + row.volume, 0);
			const top = admitted.reduce((best, row) =>
				row.volume > best.volume ? row : best,
			);
			/** Why a name doesn't lead the comparison, in both languages. */
			const notLeader = (
				symbol: string,
				volume: number | null,
			): [string, string] =>
				volume === null
					? [
							`${symbol}'s volume is missing, so it can't be ranked. Missing isn't zero, and it isn't a lead either.`,
							`${symbol} 的成交量缺失，无法参与排名。缺失不是零，也不是领先。`,
						]
					: volume < 500
						? [
								`${symbol}'s ${plain(volume)} is below the 500-contract floor, so it isn't in the comparison.`,
								`${symbol} 的 ${plain(volume)} 低于 500 张的门槛，不在比较范围内。`,
							]
						: [
								`${symbol} qualifies, but its ${plain(volume)} is less than ${top.symbol}'s ${plain(top.volume)}.`,
								`${symbol} 合格，但它的 ${plain(volume)} 少于 ${top.symbol} 的 ${plain(top.volume)}。`,
							];
			const outside = below
				.map((row) => `${row.symbol}'s ${plain(row.volume)}`)
				.join(" and ");
			const outsideZh = below
				.map((row) => `${row.symbol} 的 ${plain(row.volume)}`)
				.join("和");
			return {
				brief: t(
					"Your comparison covers stock options on ALFA, BETA and IOTA in one stated session. A name counts only if its observation is complete and its volume is at least 500 contracts. No other names belong.",
					"你的比较范围是 ALFA、BETA 和 IOTA 在同一给定时段的股票期权。只有观测完整、成交量至少 500 张的标的才计入。没有其他标的属于这个范围。",
				),
				worksheet: {
					columns: [
						t("Row", "行"),
						t("Volume", "成交量"),
						t("Coverage", "覆盖"),
					],
					rows: [
						["ALFA", String(a), "complete / 完整"],
						["BETA", String(b), "complete / 完整"],
						iota === null
							? ["IOTA", "—", "missing / 缺失"]
							: ["IOTA", String(iota), "complete / 完整"],
					],
					caption: t(
						"Synthetic fixed-session source · volume in contracts; dash is missing",
						"模拟固定时段来源 · 成交量单位为张；横线为缺失",
					),
				},
				questions: [
					n(
						"admitted",
						"How many names qualify for the comparison of observed volume?",
						"有多少个标的有资格进入已观测成交量的比较？",
						admitted.length,
						"names",
						"个",
						`ALFA's ${plain(a)} qualifies, and BETA's ${plain(b)} ${b >= 500 ? "clears 500 too" : "falls short of 500"}. ${iota === null ? "IOTA's volume is missing, so it can't be measured" : `IOTA's ${plain(iota)} ${iota >= 500 ? "qualifies as well" : "was observed but falls short of 500"}`}: ${admitted.length} ${admitted.length === 1 ? "name" : "names"}.`,
						`ALFA 的 ${plain(a)} 合格，BETA 的 ${plain(b)} ${b >= 500 ? "也超过 500" : "不足 500"}。${iota === null ? "IOTA 的成交量缺失，无法测量" : `IOTA 的 ${plain(iota)} ${iota >= 500 ? "同样合格" : "有观测，但不足 500"}`}：共 ${admitted.length} 个。`,
					),
					n(
						"eligible-volume",
						"What volume do the qualifying names add up to?",
						"有资格的标的成交量合计多少？",
						total,
						"contracts",
						"张",
						`${admitted.length > 1 ? `${admitted.map((row) => plain(row.volume)).join(" + ")} = ${plain(total)}` : `ALFA alone: ${plain(a)}`} contracts. ${iota === null ? "That's the observed subtotal, not the total for all three names: IOTA is missing." : `All three names were observed; ${outside} stays out only because it's below 500.`}`,
						`${admitted.length > 1 ? `${admitted.map((row) => plain(row.volume)).join(" + ")} = ${plain(total)}` : `只有 ALFA：${plain(a)}`} 张。${iota === null ? "这是已观测的小计，而不是三个标的的总量：IOTA 缺失。" : `三个标的都有观测；${outsideZh} 不计入，只是因为不足 500。`}`,
					),
					c(
						"leader",
						"Which name leads the comparison of observed volume?",
						"哪个标的在已观测成交量的比较中领先？",
						[
							["ALFA", "ALFA", "ALFA", ...notLeader("ALFA", a)],
							["BETA", "BETA", "BETA", ...notLeader("BETA", b)],
							["IOTA", "IOTA", "IOTA", ...notLeader("IOTA", iota)],
						],
						top.symbol,
						`Of the names that qualify, ${top.symbol} has the most: ${plain(top.volume)} contracts.${iota === null ? " IOTA's volume is missing, so this ranks only the names you observed." : ""}`,
						`在合格的标的中，${top.symbol} 最多：${plain(top.volume)} 张。${iota === null ? "IOTA 的成交量缺失，所以这只是已观测标的的排名。" : ""}`,
					),
					c(
						"claim",
						"Can you call the observed leader the most active of all three names?",
						"你能把已观测的领先者称为三个标的中最活跃的吗？",
						[
							[
								"full",
								"Yes: count the missing name as zero",
								"能：把缺失的标的当作零",
								iota === null
									? "A missing name isn't zero. Counting IOTA as zero would let the observed leader claim a title it may not hold."
									: `No name is missing here: IOTA's ${plain(iota)} contracts were observed. The claim holds because all three were measured, not because anything counts as zero.`,
								iota === null
									? "缺失的名字不是零。把 IOTA 算作零，会让观测到的领先者拿到它未必配得上的头衔。"
									: `这里没有缺失的标的：IOTA 的 ${plain(iota)} 张有观测。结论成立是因为三个标的都测量到了，而不是因为把什么当作零。`,
							],
							[
								"limited",
								"No: say it leads the names you observed, and that IOTA is missing",
								"不能：要说它在已观测的标的中领先，并注明 IOTA 缺失",
								`IOTA isn't missing here: its ${plain(iota ?? 0)} contracts were observed, fewer than ${top.symbol}'s ${plain(top.volume)}. With all three measured, the claim can cover all three.`,
								`这里 IOTA 并没有缺失：它的 ${plain(iota ?? 0)} 张有观测，少于 ${top.symbol} 的 ${plain(top.volume)}。三个标的都测量到了，结论可以涵盖全部三个。`,
							],
							[
								"measured",
								"Yes: all three names were observed, and it has the most",
								"能：三个标的都有观测，而且它最多",
								`IOTA shows a dash, not a volume: it wasn't observed. Its unknown volume could be larger than ${top.symbol}'s ${plain(top.volume)}.`,
								`IOTA 一栏是横线，不是成交量：它没有被观测到。它未知的成交量可能比 ${top.symbol} 的 ${plain(top.volume)} 还大。`,
							],
						],
						iota === null ? "limited" : "measured",
						iota === null
							? "IOTA's volume is unknown and could be larger than either. Report the leader among the names you observed."
							: `All three names were observed, and none has more than ${top.symbol}'s ${plain(top.volume)}, so it's the most active of all three. A name below the 500 floor is still measured; it just isn't ranked.`,
						iota === null
							? "IOTA 的成交量未知，可能比两者都大。只能报告已观测标的中的领先者。"
							: `三个标的都有观测，没有一个超过 ${top.symbol} 的 ${plain(top.volume)}，所以它是三者中最活跃的。低于 500 门槛的标的仍然有观测，只是不参与排名。`,
					),
				],
			};
		},
	},
	{
		id: "rank-symbols",
		version: 3,
		conceptLab: {
			kind: "rank-symbols",
			intro: t(
				"Rank ALFA's peers by raw and relative activity, keep the sign on a ranked change, and pass a candidate on with the context its rank depends on.",
				"按原始与相对活跃度给 ALFA 的同组股票排名，在按幅度排序时保留符号，并附上排名所依赖的背景交接候选。",
			),
		},
		sources: [oi],
		explanation: t(
			"Ranking sorts observations under a metric and scope. It can prioritize attention without proving future performance. A signed metric sorted by absolute magnitude differs from sorting its signed value: −100 can rank above +60 by magnitude while retaining a negative direction. Peer changes can move an unchanged observation's rank. Raw size and baseline-normalized activity answer different questions, so choose the metric from the research objective, not from the most dramatic result. Liquidity floors and coverage exclusions can protect a comparison from tiny-denominator extremes but must be disclosed. A candidate handoff should include the observed value, comparison set, why it merits inspection and what could lower its priority.",
			"排名按指标与范围排序，可安排关注顺序，但不证明未来表现。有符号指标按绝对幅度排序不同于按数值排序：−100 可按幅度排在 +60 前，同时方向仍为负。同组变化可改变自身观测未变的排名。原始规模与基准归一化活跃度回答不同问题，应按研究目标选指标，不追逐最突出结果。流动性门槛及覆盖排除可避免小分母极值，但必须披露。候选交接应含观测值、比较集合、检查理由及降级条件。",
		),
		example: t(
			"ALFA stays at 2,400 contracts on Monday and Tuesday. CRUX falls from 5,600 to 1,900; ALFA moves from second to first without new activity of its own. Separately, CRUX's 5,600 against a normal 6,000 is 0.93×, while DUNE's 900 against a normal 300 is 3×. A raw-volume question and an unusual-relative-activity question need different leaders.",
			"ALFA 周一、周二都成交 2,400 张。CRUX 从 5,600 降到 1,900，ALFA 从第二升到第一，自身并无新增活动。另看基准：CRUX 5,600/平常 6,000=0.93×，DUNE 900/平常 300=3×。原始量与相对异常活动问题需要不同领先者。",
		),
		misconception: t(
			"A rank can rise because peers fell or were excluded. A change in rank alone isn't a change in the name's own activity, or a signal of direction.",
			"排名上升，可能是因为同组的其他标的下降或被排除。单凭排名变化，不能说明这个标的自身活跃度变了，也不是方向信号。",
		),
		case: (v) => {
			const rawA = [1200, 900, 1600, 1400][v];
			const normalA = [2400, 300, 2000, 700][v];
			const rawB = [900, 1200, 1800, 2100][v];
			const normalB = [300, 1200, 500, 2100][v];
			const relativeLeader = rawA / normalA > rawB / normalB ? "ALFA" : "BETA";
			const rawLeader = rawA > rawB ? "ALFA" : "BETA";
			const agree = relativeLeader === rawLeader;
			const rawHigh = plain(Math.max(rawA, rawB));
			const rawLow = plain(Math.min(rawA, rawB));
			return {
				brief: t(
					"Two fully covered names are eligible. Your question: which one is more active relative to its own usual full-session volume?",
					"两个数据完整的标的都有资格。你的问题是：相对于各自平常的完整交易日成交量，哪一个更活跃？",
				),
				universe: {
					id: `peer-lab-${v}`,
					note: t(
						"Independent questions use ORIGINAL worksheet values. This separate comparison changes BETA while holding ALFA fixed; it demonstrates relative rank, not a new market observation.",
						"独立题目使用原始表格数值。本对比仅改变 BETA、固定 ALFA，演示相对排名，并非新增市场观测。",
					),
					rows: [
						{
							symbol: "ALFA",
							volume: rawA,
							peerVolume: rawA,
							fresh: true,
							eligible: true,
						},
						{
							symbol: "BETA",
							volume: rawB,
							peerVolume: rawB > rawA ? rawA - 300 : rawA + 300,
							fresh: true,
							eligible: true,
						},
					],
				},
				worksheet: {
					columns: [
						t("Symbol", "标的"),
						t("Volume", "量"),
						t("Typical volume", "典型量"),
					],
					rows: [
						["ALFA", String(rawA), String(normalA)],
						["BETA", String(rawB), String(normalB)],
					],
					caption: t(
						"Synthetic complete sessions · contracts",
						"模拟完整时段 · 张",
					),
				},
				questions: [
					n(
						"ratio-a",
						"What is ALFA's relative volume: today's volume against its typical session?",
						"ALFA 的相对成交量是多少：今天的成交量对比它的典型交易日？",
						rawA / normalA,
						"times",
						"倍",
						`${plain(rawA)} ÷ ${plain(normalA)} = ${plain(rawA / normalA)}×.`,
						`${plain(rawA)} ÷ ${plain(normalA)} = ${plain(rawA / normalA)}×。`,
					),
					c(
						"leader",
						"Which name answers your question?",
						"哪个标的回答了你的问题？",
						[
							[
								"a",
								"ALFA",
								"ALFA",
								`ALFA ${rawA > rawB ? "trades more contracts, but sits" : "sits"} at ${plain(rawA / normalA)}× its typical session, below BETA's ${plain(rawB / normalB)}×. The question compares each name with its own normal.`,
								`ALFA ${rawA > rawB ? "成交的张数更多，但" : ""}只有其典型交易日的 ${plain(rawA / normalA)}×，低于 BETA 的 ${plain(rawB / normalB)}×。问题比较的是各自与平常水平的对比。`,
							],
							[
								"b",
								"BETA",
								"BETA",
								`BETA ${rawB > rawA ? "trades more contracts, but sits" : "sits"} at ${plain(rawB / normalB)}× its typical session, below ALFA's ${plain(rawA / normalA)}×. The question compares each name with its own normal.`,
								`BETA ${rawB > rawA ? "成交的张数更多，但" : ""}只有其典型交易日的 ${plain(rawB / normalB)}×，低于 ALFA 的 ${plain(rawA / normalA)}×。问题比较的是各自与平常水平的对比。`,
							],
						],
						rawA / normalA > rawB / normalB ? "a" : "b",
						`ALFA: ${plain(rawA / normalA)}×. BETA: ${plain(rawB)} ÷ ${plain(normalB)} = ${plain(rawB / normalB)}×. ${rawA / normalA > rawB / normalB ? "ALFA" : "BETA"} is further above its own normal${(rawA > rawB) !== rawA / normalA > rawB / normalB ? `, even though ${rawA > rawB ? "ALFA" : "BETA"} traded more contracts` : ""}.`,
						`ALFA：${plain(rawA / normalA)}×。BETA：${plain(rawB)} ÷ ${plain(normalB)} = ${plain(rawB / normalB)}×。${rawA / normalA > rawB / normalB ? "ALFA" : "BETA"} 超出自身平常水平更多${(rawA > rawB) !== rawA / normalA > rawB / normalB ? `，尽管 ${rawA > rawB ? "ALFA" : "BETA"} 成交的张数更多` : ""}。`,
					),
					c(
						"raw-leader",
						"If the question asked for raw contracts instead, would the same name lead?",
						"如果问题改问原始成交张数，领先的还会是同一个标的吗？",
						[
							[
								"same",
								"Yes: the same name leads on both measures",
								"会：两种指标下领先的是同一个标的",
								`On raw contracts ${rawLeader} leads, ${rawHigh} to ${rawLow}, while ${relativeLeader} is further above its own normal. The two measures pick different names.`,
								`按原始张数是 ${rawLeader} 领先（${rawHigh} 对 ${rawLow}），而相对自身平常水平是 ${relativeLeader} 领先。两种指标选出了不同的标的。`,
							],
							[
								"other",
								"No: the other name traded more contracts",
								"不会：另一个标的成交的张数更多",
								`${relativeLeader} also traded more contracts, ${rawHigh} to ${rawLow}. Here the two measures agree, though they don't have to.`,
								`${relativeLeader} 成交的张数也更多（${rawHigh} 对 ${rawLow}）。这里两种指标恰好一致，但并不总是如此。`,
							],
						],
						agree ? "same" : "other",
						agree
							? `${relativeLeader} leads both ways: ${rawHigh} contracts to ${rawLow}, and further above its own normal. Check each measure anyway; they often disagree.`
							: `${rawLeader} traded more contracts, ${rawHigh} to ${rawLow}, but ${relativeLeader} is further above its own normal. Raw size and relative activity answer different questions.`,
						agree
							? `${relativeLeader} 两种指标都领先：成交 ${rawHigh} 张对 ${rawLow} 张，相对自身平常水平也更高。即便如此，每种指标都要单独核对；它们常常不一致。`
							: `${rawLeader} 成交的张数更多（${rawHigh} 对 ${rawLow}），但 ${relativeLeader} 超出自身平常水平更多。原始规模与相对活跃度回答的是不同的问题。`,
					),
				],
			};
		},
	},
	{
		id: "rank-contracts",
		version: 3,
		conceptLab: {
			kind: "rank-contracts",
			intro: t(
				"Read ALFA's Monday call volume across strikes and expiries, compare two expiries with the same total but different breadth, and audit a screen's top values before picking a candidate.",
				"按行权价与到期日阅读 ALFA 周一看涨成交量，比较两个合计相同但广度不同的到期日，并在选出候选前审计筛选器的最高值。",
			),
		},
		sources: [oi],
		explanation: t(
			"A contract neighborhood locates activity across strikes and expiries while retaining a fixed underlying, option type, session and quality rule. Spot lets you classify moneyness, but moneyness alone does not tell you which contract to buy. An expiry slice changes visible rows; it does not silently admit outside-scope contracts. Compare total activity and concentration separately. Equal peaks can hide different breadth; equal totals can also be distributed differently. Missing observations are not zeros, and prior-session values cannot win a current-session comparison. A selected contract earns a reasoned next inspection with nearby context. Neither a shape nor a cluster establishes a spread, common owner, accumulation or a forecast.",
			"合约邻域按行权价与到期日定位活动，同时固定标的、期权类型、时段及质量规则。现价可判断价内外状态，但该状态不告诉你该买哪张。到期切片改变可见行，不会自动纳入范围外合约。总活动与集中度需分开看：相同峰值可能广度不同，相同总量也可能分布不同。缺失不是零，前日值不能赢得当日比较。候选需要带邻近上下文进入下一项检查，形状或聚集不能证明价差策略、共同持有、积累或预测。",
		),
		example: t(
			"ALFA's Sep 20 and Nov 15 calls both total 695 contracts and peak at 380. Sep 20 traded in two strikes (380 and 315); Nov 15 in five (380, two 95s, 70 and 55). Nov 15 is broader despite identical peak and total. With ALFA at $100.02, a 105 call is out of the money and a 100 call in the money. Both can be research candidates under a stated question.",
			"ALFA 9月20日 与 11月15日 看涨合计均 695 张、峰值均 380。9月20日 只在两个行权价成交（380 与 315），11月15日 在五个（380、两个 95、70 与 55）。峰值和总量相同，11月15日 仍更广。ALFA 为 $100.02 时，105 看涨为虚值、100 看涨为实值；在明确问题下两者都可成为研究候选。",
		),
		misconception: t(
			"Count only cells that were observed with volume; a missing cell isn't a zero. Display controls change what you see, not the data or what qualifies.",
			"只计有观测且有成交的格子；缺失的格子不等于零。显示控件改变的是你看到什么，而不是数据本身或资格。",
		),
		case: (v) => {
			const spot = [100, 105, 108, 107][v];
			const strikes = [100, 105, 110];
			const a = [0, 0, 0, 0, 3000, 2500, 0, 2500, 0];
			const b = [500, 750, 500, 750, 3000, 750, 500, 750, 500];
			const grids = v % 2 ? [b, a] : [a, b];
			return {
				brief: t(
					`At the 16:00 close, two ALFA call neighborhoods each total 8,000 contracts, with a 3,000 peak in one cell. ALFA is at ${money(spot, 0)}. Every zero in the grids was actually observed, not missing; the replay between checkpoints is only an illustration.`,
					`16:00 收盘时，两个 ALFA 看涨邻域的总量都是 8,000 张，其中一格峰值为 3,000。ALFA 现价 ${money(spot, 0)}。网格中的每个零都是实际观测到的，不是缺失；检查点之间的回放只是示意。`,
				),
				neighborhoodPair: {
					id: `breadth-v2-${v}`,
					cases: grids.map((values, i) => ({
						label: t(
							i === 0 ? "Case A" : "Case B",
							i === 0 ? "案例 A" : "案例 B",
						),
						data: {
							id: `breadth-v2-${v}-${i}`,
							symbol: "ALFA",
							spot,
							asOf: t("Fixed synthetic close", "固定模拟收盘"),
							scope: {
								minStrike: 100,
								maxStrike: 110,
								minDays: 14,
								maxDays: 60,
							},
							contracts: [14, 30, 60].flatMap((days, row) =>
								strikes.map((strike, col) => ({
									id: `c-${strike}-${days}`,
									strike,
									days,
									volume: values[row * 3 + col],
									fresh: true,
								})),
							),
							replay: {
								durationMs: 14000,
								openMinute: 570,
								closeMinute: 960,
								frames: [0, 0.2, 0.45, 0.75, 1].map((position, frame) => ({
									position,
									volumes: Object.fromEntries(
										[14, 30, 60].flatMap((days, row) =>
											strikes.map((strike, col) => [
												`c-${strike}-${days}`,
												Math.round(
													values[row * 3 + col] * [0, 0.15, 0.4, 0.8, 1][frame],
												),
											]),
										),
									),
								})),
							},
						},
					})),
				},
				questions: [
					n(
						"breadth-a",
						"At the close, how many of Case A's cells have any volume?",
						"收盘时，案例 A 中有多少格有成交？",
						v % 2 ? 9 : 3,
						"cells",
						"格",
						v % 2
							? "All 9 cells traded: Case A spreads its 8,000 contracts widely. Count the whole grid, whatever slice the display shows."
							: "Only 3 cells traded, 3,000, 2,500 and 2,500: the same total and peak as Case B, packed into far fewer cells. Count the whole grid, whatever slice the display shows.",
						v % 2
							? "9 格全部有成交：案例 A 的 8,000 张分布得很广。要数整个网格，不管显示的是哪个切片。"
							: "只有 3 格有成交，分别是 3,000、2,500 和 2,500：总量和峰值与案例 B 相同，却集中在少得多的合约上。要数整个网格，不管显示的是哪个切片。",
					),
					c(
						"moneyness",
						`With ALFA at ${money(spot, 0)}, the 105 call is…`,
						`ALFA 为 ${money(spot, 0)} 时，105 看涨属于……`,
						[
							[
								"itm",
								"In the money: the strike is below ALFA's price",
								"实值：行权价低于 ALFA 的价格",
								`A call is in the money only when its strike is below the stock. $105 is ${105 > spot ? "above" : "equal to"} ${money(spot, 0)}.`,
								`看涨只有在行权价低于股价时才是实值。$105 ${105 > spot ? "高于" : "等于"} ${money(spot, 0)}。`,
							],
							[
								"otm",
								"Out of the money: the strike is above ALFA's price",
								"虚值：行权价高于 ALFA 的价格",
								`A call is out of the money only when its strike is above the stock. $105 is ${105 < spot ? "below" : "equal to"} ${money(spot, 0)}.`,
								`看涨只有在行权价高于股价时才是虚值。$105 ${105 < spot ? "低于" : "等于"} ${money(spot, 0)}。`,
							],
							[
								"atm",
								"At the money: the strike equals ALFA's price",
								"平值：行权价等于 ALFA 的价格",
								`At the money means the strike equals the stock's price. $105 is ${105 < spot ? "below" : "above"} ${money(spot, 0)}.`,
								`平值表示行权价等于股价。$105 ${105 < spot ? "低于" : "高于"} ${money(spot, 0)}。`,
							],
						],
						105 < spot ? "itm" : 105 > spot ? "otm" : "atm",
						`${105 === spot ? "A call is at the money when its strike equals the stock's price" : "A call is in the money when its strike is below the stock"}. $105 is ${105 < spot ? "below" : 105 > spot ? "above" : "equal to"} ${money(spot, 0)}, so it's ${105 < spot ? "in" : 105 > spot ? "out of" : "at"} the money. That says nothing about where ALFA goes next.`,
						`${105 === spot ? "看涨在行权价等于股价时为平值" : "看涨在行权价低于股价时为实值"}。$105 ${105 < spot ? "低于" : 105 > spot ? "高于" : "等于"} ${money(spot, 0)}，所以是${105 < spot ? "实值" : 105 > spot ? "虚值" : "平值"}。这不能说明 ALFA 接下来会怎么走。`,
					),
				],
			};
		},
	},
	{
		id: "point-in-time-research",
		version: 3,
		conceptLab: {
			kind: "point-in-time-research",
			intro: t(
				"Replay Monday's 105 call facts by when they arrived, watch the block's weight fade with no new trade, read a 97th percentile as a rank, and see a searched-for winner shrink on sealed data.",
				"按到达时间重放周一 105 看涨的事实，观察没有新成交时大单权重如何淡出，把第 97 百分位读作排名，并看到搜索出的胜者在封存数据上缩水。",
			),
		},
		sources: [oi, quotes],
		explanation: t(
			"A historical test must use information available at the decision time. Event time and knowledge/receipt time can differ: a correction received later was not usable earlier. Freeze the question, eligible population, measure and evaluation rule before inspecting outcomes. Hold out a separate period or case; tuning a threshold after seeing that outcome turns it into development data. Recency-weighted activity may decay with a half-life while raw trade count does not; a score can change without a new trade. Percentiles, standardized scores and calibrated probabilities are different quantities. Require a comparable baseline, sufficient samples and source coverage. An unusual score or a pre-move association does not establish causation, ownership or repeatable out-of-sample returns.",
			"历史检验必须使用决策时已可用的信息。事件时间与获知/接收时间可能不同，后来收到的更正在早先不可用。看结果前固定问题、合格人群、测量与评价规则。保留独立时段或案例；看完结果再调阈值，就把评估集变成开发数据。近期加权活动可按半衰期衰减，而原始笔数不变，因此无新成交时分数也可变化。百分位、标准分与校准概率不同，需可比基准、足够样本与来源覆盖。异常分数或上涨前关联，不证明因果、归属或可重复样本外收益。",
		),
		example: t(
			"ALFA's 500-lot in the Oct 18 105 call happened at 10:50:00.4 and was first reported at $2.51; the $2.15 correction arrived at 10:50:02.8. A 10:50:01 replay must use $2.51. Separately, with a 30-minute half-life and no new trades, the block's weight of 500 falls to 250 by 11:20 and 125 by 11:50, while its 500 contracts stay unchanged. Calling the call's 97th-percentile volume a 97% chance of a rise would change its meaning.",
			"ALFA 10月18日 105 看涨的 500 张大单发生在 10:50:00.4，首报价格为 $2.51；$2.15 的更正在 10:50:02.8 才到。10:50:01 的重放必须使用 $2.51。另外，半衰期 30 分钟且没有新成交时，大单的权重 500 到 11:20 降为 250、11:50 降为 125，而它的 500 张不变。把该合约成交量的第 97 百分位称为 97% 的上涨概率，会改变含义。",
		),
		misconception: t(
			"Freeze when you could have known something, not just when it happened. And every look at held-out data uses up some of its independence.",
			"要固定你当时能知道什么的时间点，而不只是事件发生的时间。每看一次保留数据，都会消耗它的一部分独立性。",
		),
		case: (v) => {
			const initial = [80, 120, 160, 96][v];
			const halves = [2, 3, 1, 4][v];
			const trade = ["09:59", "09:52", "09:45", "09:41"][v];
			const arrival = ["10:02", "09:57", "10:04", "09:55"][v];
			const known = arrival < "10:00";
			// Whether the rule was edited after its July–August result was seen.
			const tuned = v !== 2;
			const first = [40, 50, 60, 45][v];
			const edited = [60, 35, 60, 70][v];
			return {
				brief: t(
					`A recency-weighted score starts at ${initial} and halves every 60 seconds, and nothing new happens for ${halves * 60} seconds. Separately, a correction to a ${trade} trade arrives at ${arrival}, and your decision is made at 10:00.\n\nYou also froze an alert rule, "score above ${first}", on January to June data and ran it on July and August data, which stayed sealed until then. ${tuned ? `After seeing that result, you changed the rule to "score above ${edited}" and ran July and August again.` : "The rule hasn't changed since that one run."}`,
					`一个按近期加权的分数从 ${initial} 开始，每 60 秒减半，之后 ${halves * 60} 秒内没有任何新事件。另外，一笔 ${trade} 成交的更正在 ${arrival} 到达，而你的决策是在 10:00 做出的。\n\n你还在 1–6 月数据上冻结了一条提醒规则“分数高于 ${first}”，并在此前一直封存的 7–8 月数据上运行了它。${tuned ? `看到结果之后，你把规则改成“分数高于 ${edited}”，又在 7–8 月上运行了一次。` : "那次运行之后，规则没有改过。"}`,
				),
				questions: [
					n(
						"weight",
						"What is the score now?",
						"现在这个分数是多少？",
						initial / 2 ** halves,
						"weight units",
						"权重单位",
						`${halves * 60} seconds is ${halves} half-li${halves === 1 ? "fe" : "ves"}: ${initial} × (½)^${halves} = ${plain(initial / 2 ** halves)}. The trades behind it haven't changed; only their weight has faded.`,
						`${halves * 60} 秒是 ${halves} 个半衰期：${initial} × (½)^${halves} = ${plain(initial / 2 ** halves)}。背后的成交没有变，只是它们的权重衰减了。`,
					),
					c(
						"cutoff",
						"Can the 10:00 decision use that correction?",
						"10:00 的决策能使用这笔更正吗？",
						[
							[
								"yes",
								"Yes: the trade happened before 10:00",
								"能：这笔成交发生在 10:00 之前",
								known
									? `The trade's time isn't the test: a trade from before 10:00 can be corrected after it. This correction is usable because it arrived at ${arrival}, before the decision.`
									: `What matters is when you could know the trade, not when it happened. The correction arrived at ${arrival}, after the 10:00 decision.`,
								known
									? `成交时间不是判断标准：10:00 之前的成交，也可能在 10:00 之后才被更正。这笔更正能用，是因为它在 ${arrival} 就到了，早于决策。`
									: `要看的不是成交何时发生，而是你何时能知道它。更正在 ${arrival} 才到，晚于 10:00 的决策。`,
							],
							[
								"arrived",
								"Yes: the correction itself arrived before 10:00",
								"能：更正本身在 10:00 之前就到了",
								`The correction arrived at ${arrival}, after the 10:00 decision. At 10:00 only the first report of the trade was known.`,
								`更正在 ${arrival} 才到，晚于 10:00 的决策。10:00 时只知道这笔成交最初的报告。`,
							],
							[
								"no",
								"No: the correction arrived after 10:00",
								"不能：更正在 10:00 之后才到",
								`The correction arrived at ${arrival}, before the 10:00 decision, so it was already known when you decided.`,
								`更正在 ${arrival} 就到了，早于 10:00 的决策，所以决策时已经知道它。`,
							],
						],
						known ? "arrived" : "no",
						known
							? `What matters is when you could have known it. The correction arrived at ${arrival}, before your 10:00 decision, so the decision can use it.`
							: `What matters is when you could have known it. The trade happened at ${trade}, but its correction arrived after your decision, so using it would be hindsight.`,
						known
							? `关键是你什么时候能知道。更正在 ${arrival} 就到了，早于你 10:00 的决策，所以决策可以使用它。`
							: `关键是你什么时候能知道。成交发生在 ${trade}，但更正在你决策之后才到，用它就是后见之明。`,
					),
					c(
						"holdout",
						"Is the July and August data still a holdout test of the rule as it stands now?",
						"对现在这条规则来说，7–8 月还算是保留集检验吗？",
						[
							[
								"holdout",
								"Yes: it still tests the rule on data it hasn't seen",
								"是：它仍在用规则没见过的数据检验它",
								`You changed the rule from above ${first} to above ${edited} after seeing July and August, so those months helped choose it. They're search data now; the new rule needs a period that's still sealed.`,
								`你是在看过 7–8 月的结果之后，才把规则从高于 ${first} 改成高于 ${edited} 的，所以这两个月参与了选规则。它们现在是搜索数据；新规则需要一段仍然封存的数据来检验。`,
							],
							[
								"search",
								"No: it has become search data",
								"不是：它已经变成了搜索数据",
								"The rule was frozen on January to June and run once on July and August, unchanged since. That single run is the holdout test.",
								"规则是在 1–6 月上冻结的，只在 7–8 月上运行了一次，之后没有改过。那一次运行就是保留集检验。",
							],
						],
						tuned ? "search" : "holdout",
						tuned
							? `Editing a rule after seeing the holdout turns the holdout into more search data. The above-${edited} rule needs a period it hasn't seen.`
							: "Freeze first, then open the holdout once: that's what happened here, so the July and August result tests the rule. Editing the rule now would use that test up.",
						tuned
							? `看过保留集之后再修改规则，就把保留集变成了更多的搜索数据。高于 ${edited} 的规则需要一段它没见过的数据。`
							: "先冻结，再只打开一次保留集：这里正是这样做的，所以 7–8 月的结果检验了这条规则。现在再改规则，就会把这次检验用掉。",
					),
				],
			};
		},
	},
];
