import "@tanstack/react-start/server-only";
import {
	choose as c,
	numberQuestion as n,
	type TeachingUnit,
	t,
} from "./authoring.server";

/**
 * Level 5: TradingFlow workflows. Walkthroughs use the course's fictional market; the
 * TradingFlow steps describe the live product as of September 2026, including which parts
 * need a paid plan or a separate rollout.
 */
const cookbooksGuide = {
	title: "TradingFlow · Cookbooks & Recipes",
	href: "https://tradingflow.com/docs/cookbooks/",
};

export const workflowUnits: TeachingUnit[] = [
	{
		id: "tradingflow-recipes",
		conceptLab: {
			kind: "tradingflow-recipes",
			intro: t(
				"Match questions to TradingFlow's official recipes, read which session a run shows before trusting its numbers, and see what forking a recipe changes and what it leaves alone.",
				"把问题和 TradingFlow 的官方 Recipe 对应起来，在相信数字之前先看清一次运行展示的是哪个交易时段，并理解分叉 Recipe 会改变什么、不会改变什么。",
			),
		},
		sources: [cookbooksGuide],
		explanation: t(
			"A recipe, which TradingFlow also calls a cookbook, is a report of explanations, key figures, tables and charts bound to queries against TradingFlow's flow and chain data. Nothing is written in advance about the numbers: each time you open one it runs against a real trading session. Official recipes come in three kinds: quick lookups about one symbol, session screens across the whole market, and multi-step reports. Each run's header names the session its numbers describe and when it last ran. A report opens on the latest completed U.S. session, which follows the market calendar rather than the clock; Refresh data re-runs it for that session and the date picker for an earlier one. Official recipes are maintained by TradingFlow and are the same for every paid account. Your own recipes, forked with Edit with AI or started with New recipe, are private to you, and the official recipe is never edited in place. Cookbooks need a paid plan, and creating or editing recipes is a separate, limited rollout. A recipe describes what the data did; it is not a trade signal.",
			"Recipe（TradingFlow 也称其为 Cookbook）是一份由说明、关键数字、表格和图表组成的报告，它们都绑定到对 TradingFlow 成交流与期权链数据的查询。报告不会预先写好关于数字的结论：每次打开时，它都针对一个真实的交易时段运行。官方 Recipe 分三种：关于单个标的的快速查询、覆盖整个市场的时段筛选，以及多步骤报告。每次运行的页眉都会注明其数字描述的交易时段及最近一次运行的时间。报告默认打开最近一个完整的美国交易时段，它遵循交易日历而不是钟表；“刷新数据”针对该时段重新运行，日期选择器则针对更早的时段运行。官方 Recipe 由 TradingFlow 维护，所有付费账户看到的都相同。你自己的 Recipe（用 Edit with AI 分叉或用 New recipe 新建）只有你能看到，官方 Recipe 从不被原地修改。Cookbooks 需要付费方案，创建或编辑 Recipe 是单独的、有限范围的灰度功能。Recipe 描述的是数据发生了什么，不是交易信号。",
		),
		example: t(
			"On Monday Sep 16 the Unusual Options Activity Screener, at its default thresholds (volume/OI at least 1, volume at least 500, open interest at least 200, at most 60 days to expiry), passes five contracts: the CRUX Oct 4 60 put at 2.67 times its open interest, the DUNE Sep 27 30 call at 2.17, the BRDX Oct 11 25 put at 2.00, the BRDX Oct 18 28 call at 1.25 and the CRUX Nov 15 70 call at 1.20. None of ALFA's calls passes; its busiest, the Oct 18 105 call, traded 505 contracts against 1,200 open interest, 0.42. Opened at 8:00 on Tuesday, the report still shows Monday's session. After Tuesday's close it shows Tuesday's two: the EMBR Oct 4 80 call at 2.75 and the DUNE 30 call at 1.24.",
			"9月16日周一，Unusual Options Activity Screener 在默认阈值下（成交量/OI 至少 1、成交量至少 500、未平仓量至少 200、最多 60 天到期）筛出五份合约：CRUX 10月4日 60 看跌为其未平仓量的 2.67 倍，DUNE 9月27日 30 看涨 2.17 倍，BRDX 10月11日 25 看跌 2.00 倍，BRDX 10月18日 28 看涨 1.25 倍，CRUX 11月15日 70 看涨 1.20 倍。ALFA 的看涨期权一个也没通过；其中最活跃的 10月18日 105 看涨成交 505 张，未平仓量 1,200，比值 0.42。在周二 8:00 打开时，报告仍显示周一的时段。周二收盘后，它显示周二的两份：EMBR 10月4日 80 看涨 2.75 倍和 DUNE 30 看涨 1.24 倍。",
		),
		misconception: t(
			'"Latest" isn\'t "today", and a recipe isn\'t a trade signal. Read the session in the header before any number, and remember that a fork is yours alone: it never changes the official recipe.',
			"“最新”不等于“今天”，Recipe 也不是交易信号。先看页眉里的交易时段再读任何数字；分叉的副本只属于你，不会改变官方 Recipe。",
		),
		case: (v) => {
			const questionCase = [
				{
					en: "Which contracts traded far above their open interest today?",
					zh: "今天哪些合约的成交远超其未平仓量？",
					answer: "screen",
				},
				{
					en: "Where is one symbol's modeled gamma concentrated?",
					zh: "某个标的的模型 Gamma 集中在哪里？",
					answer: "lookup",
				},
				{
					en: "What did the whole session's flow look like, chapter by chapter?",
					zh: "整个时段的成交流是什么样子，逐章来看？",
					answer: "report",
				},
				{
					en: "How did the session's premium execute: sweeps, blocks or single fills?",
					zh: "本时段的权利金是如何成交的：扫单、大宗还是单笔？",
					answer: "screen",
				},
			][v];
			const timeCase = [
				{
					en: "8:00 on Tuesday Sep 17",
					zh: "9月17日周二 8:00",
					answer: "mon",
				},
				{
					en: "10:00 on Monday Sep 16",
					zh: "9月16日周一 10:00",
					answer: "fri",
				},
				{
					en: "noon on Saturday Sep 14",
					zh: "9月14日周六中午",
					answer: "fri",
				},
				{
					en: "16:30 on Monday Sep 16",
					zh: "9月16日周一 16:30",
					answer: "mon",
				},
			][v];
			const [volume, oi] = [
				[2_400, 900],
				[780, 360],
				[620, 310],
				[1_100, 400],
			][v];
			const ratio = Math.round((volume / oi) * 100) / 100;
			return {
				brief: t(
					`You use TradingFlow's official recipes on the course's market. The question in front of you: "${questionCase.en}"`,
					`你在课程的市场上使用 TradingFlow 的官方 Recipe。眼前的问题是：“${questionCase.zh}”`,
				),
				questions: [
					c(
						"kind",
						"Which kind of official recipe answers it?",
						"哪种官方 Recipe 回答这个问题？",
						[
							[
								"lookup",
								"A quick lookup about one symbol",
								"关于单个标的的快速查询",
							],
							[
								"screen",
								"A session screen across the market",
								"覆盖整个市场的时段筛选",
							],
							["report", "A multi-step report", "多步骤报告"],
						],
						questionCase.answer,
						"Lookups answer one question about one symbol, screens filter the whole market for one session, and reports walk a session step by step.",
						"查询回答关于单个标的的一个问题，筛选在一个时段内过滤整个市场，报告则逐步讲解一个时段。",
					),
					c(
						"session",
						`You open the screener at ${timeCase.en}. Which session does it show?`,
						`你在${timeCase.zh}打开筛选器。它显示哪个交易时段？`,
						[
							["fri", "Friday Sep 13", "9月13日周五"],
							["mon", "Monday Sep 16", "9月16日周一"],
							["tue", "Tuesday Sep 17", "9月17日周二"],
						],
						timeCase.answer,
						"A report opens on the latest completed session: before the open, during the session and on weekends, that's the last session that finished trading.",
						"报告默认打开最近一个完整的交易时段：开盘前、交易时段内以及周末，都是最近一个已经结束交易的时段。",
					),
					n(
						"ratio",
						`A contract on the screen traded ${volume.toLocaleString("en-US")} contracts against ${oi.toLocaleString("en-US")} open interest. Its volume/OI, to two decimals?`,
						`筛选结果中的一份合约成交 ${volume.toLocaleString("en-US")} 张，未平仓量 ${oi.toLocaleString("en-US")}。它的成交量/OI（保留两位小数）是多少？`,
						ratio,
						"× open interest",
						"倍未平仓量",
						`${volume.toLocaleString("en-US")} ÷ ${oi.toLocaleString("en-US")} = ${ratio.toFixed(2)}. Above 1 means the session traded more than the open interest standing before it.`,
						`${volume.toLocaleString("en-US")} ÷ ${oi.toLocaleString("en-US")} = ${ratio.toFixed(2)}。大于 1 表示该时段的成交量超过了此前已有的未平仓量。`,
						0.01,
					),
					c(
						"fork",
						"You fork the recipe with Edit with AI and change a chapter. What does a colleague who opens the official recipe see?",
						"你用 Edit with AI 分叉了这个 Recipe 并修改了一个章节。同事打开官方 Recipe 时看到什么？",
						[
							[
								"official",
								"The official recipe, unchanged",
								"未改动的官方 Recipe",
							],
							["yours", "Your edited version", "你修改后的版本"],
							["prompt", "A prompt to choose a version", "选择版本的提示"],
						],
						"official",
						"Forking makes a private, owner-only copy; the official recipe is never edited in place.",
						"分叉生成的是私有、仅所有者可见的副本；官方 Recipe 从不被原地修改。",
					),
				],
			};
		},
	},
	{
		id: "recipe-map",
		conceptLab: {
			kind: "recipe-map",
			intro: t(
				"Trace a report's sentences through the recipe map, tell recipe content from live data, and keep a top-N table apart from the population it came from.",
				"通过 Recipe 地图追溯报告中的句子，分清 Recipe 内容与实时数据，并把前 N 名表格与其来源总体区分开。",
			),
		},
		sources: [cookbooksGuide],
		explanation: t(
			"Open recipe map shows how a report is built: input cells hold the values a reader can change, live-data cells run queries with those inputs for the represented session, and text cells marked as recipe content were written into the recipe once and run no query. The map's runtime context repeats the session and the last-run time. To audit a sentence, find its cell, then the live data and inputs behind it; anything fed by the session and the thresholds changes when they do. Recipe content explains the method and its limits, and reads the same on every run, so it is not a finding about the session. A screen's key figures count every contract that passed, while its table loads only the top rows by the ranking metric; the rest are not in the report. Claims about the whole screen use the count; a claim about one contract needs that contract, checked in Option Trades.",
			"“打开 Recipe 地图”会展示报告的构成：输入单元格存放读者可以修改的值；实时数据单元格用这些输入针对所展示的交易时段运行查询；标为 Recipe 内容的文字单元格是一次性写进 Recipe 的，不运行任何查询。地图的运行上下文会再次注明交易时段和最近一次运行时间。要审核一句话，先找到它的单元格，再看它背后的实时数据和输入；凡是由交易时段和阈值提供的内容，都会随它们一起变化。Recipe 内容解释方法及其局限，在每次运行中都一样，所以不是关于该交易时段的发现。筛选的关键数字统计所有通过的合约，而表格只载入按排名指标排在前面的行，其余的不在报告里。关于整个筛选结果的说法要用总数；关于某份合约的说法需要那份合约本身，并在 Option Trades 中核查。",
		),
		example: t(
			"Monday's run of the Unusual Options Activity Screener at its defaults flags 5 contracts across 3 names; their median volume/OI is 2.00 and the highest is 2.67, the CRUX Oct 4 60 put. Its table of the top 3 shows the CRUX put, the DUNE Sep 27 30 call at 2.17 and the BRDX Oct 11 25 put at 2.00; the BRDX Oct 18 and CRUX Nov 15 calls passed but aren't loaded. The Bottom line is fed by the session and all five thresholds, so Tuesday's run reads 2 contracts across 2 names; the Takeaways, recipe content, are word for word the same on both days.",
			"周一以默认阈值运行 Unusual Options Activity Screener，3 个标的共 5 份合约入选；它们的成交量/OI 中位数为 2.00，最高为 2.67，即 CRUX 10月4日 60 看跌。前 3 名表格显示 CRUX 看跌、DUNE 9月27日 30 看涨（2.17）和 BRDX 10月11日 25 看跌（2.00）；BRDX 10月18日 与 CRUX 11月15日 的看涨也通过了，但没有载入。核心结论由交易时段和全部五个阈值提供，所以周二的运行写的是 2 个标的共 2 份合约；要点属于 Recipe 内容，两天一字不差。",
		),
		misconception: t(
			"Not every sentence in a report is evidence, and a table isn't the population. Check the recipe map before citing a sentence, and the key figures before counting rows.",
			"报告里的句子并不都是证据，表格也不是总体。引用一句话前先看 Recipe 地图，数行数前先看关键数字。",
		),
		case: (v) => {
			const [total, shown] = [
				[5, 3],
				[12, 5],
				[40, 10],
				[2_509, 40],
			][v];
			const cell = [
				["bottom", "Bottom line", "核心结论"],
				["key", "Key figures", "关键数字"],
				["table", "Ranked table", "排名表格"],
				["bottom", "Bottom line", "核心结论"],
			][v];
			return {
				brief: t(
					`A screen's key figures count ${total.toLocaleString("en-US")} contracts that passed; its table shows the top ${shown}. You raise the minimum open interest and run again.`,
					`一个筛选的关键数字统计出 ${total.toLocaleString("en-US")} 份通过的合约；表格显示前 ${shown} 名。你提高最低未平仓量后重新运行。`,
				),
				questions: [
					c(
						"unchanged",
						`Which cell can't change when you run again: the ${cell[1]} or the Takeaways?`,
						`重新运行后，哪个单元格不可能变化：${cell[2]}还是要点？`,
						[
							[
								"takeaways",
								"The Takeaways: recipe content",
								"要点：Recipe 内容",
							],
							[cell[0], `The ${cell[1]}`, cell[2]],
							["both", "Both can change", "两者都可能变化"],
						],
						"takeaways",
						"Recipe content is written into the recipe and runs no query; cells fed by live data change with the session and the thresholds.",
						"Recipe 内容写在 Recipe 里，不运行任何查询；由实时数据提供的单元格会随交易时段和阈值变化。",
					),
					n(
						"unloaded",
						"Before you ran it again, how many contracts passed but weren't loaded into the table?",
						"重新运行之前，有多少份合约通过了筛选但没有载入表格？",
						total - shown,
						"contracts",
						"份合约",
						`${total.toLocaleString("en-US")} passed − ${shown} shown = ${(total - shown).toLocaleString("en-US")} not loaded.`,
						`通过 ${total.toLocaleString("en-US")} 份 − 显示 ${shown} 份 = 未载入 ${(total - shown).toLocaleString("en-US")} 份。`,
					),
					c(
						"cite",
						"You quote a Bottom line sentence in your notes. What must go with it?",
						"你在笔记里引用了一句核心结论。必须一起记下什么？",
						[
							["session", "The session and the thresholds", "交易时段和阈值"],
							["time", "The time you read it", "你阅读的时间"],
							[
								"nothing",
								"Nothing: it explains itself",
								"什么都不用：它自己说明了一切",
							],
						],
						"session",
						"The sentence is computed from the represented session and the inputs; without them, another reader can't reproduce it.",
						"这句话是根据所展示的交易时段和输入算出来的；没有它们，其他读者无法复现。",
					),
					c(
						"check",
						"Your claim is about one contract's prints. Where do you check it?",
						"你的说法关于某一份合约的成交记录。去哪里核查？",
						[
							[
								"trades",
								"Option Trades, for that contract",
								"Option Trades 中的该合约",
							],
							["takeaways", "The recipe's Takeaways", "Recipe 的要点"],
							["kpis", "The key figures", "关键数字"],
						],
						"trades",
						"A screen summarizes many contracts; the prints of one contract are on Option Trades.",
						"筛选汇总的是很多合约；单个合约的成交记录在 Option Trades 上。",
					),
				],
			};
		},
	},
	{
		id: "recipe-inputs",
		conceptLab: {
			kind: "recipe-inputs",
			intro: t(
				"Edit a recipe's inputs and see when the report actually changes, sort changes into re-runs and new questions, and see what the screen's floors protect.",
				"修改 Recipe 的输入，看报告究竟何时变化；把改动分成重新运行与新问题两类；并理解筛选门槛保护的是什么。",
			),
		},
		sources: [cookbooksGuide],
		explanation: t(
			"Inputs live inside the report. Changing one creates a draft value and shows a single Run control for the whole recipe; nothing below changes until you run it, and then every dependent cell refreshes together. Discard changes restores the last successful values, and changing an input never rewrites the recipe itself. Thresholds and the session date are inputs to the same question: a stricter floor or another day re-runs it, and the answers stay comparable. Changing what is measured, how it is ranked or which contracts are eligible asks a new question, which belongs in your own forked recipe. Floors on volume and open interest also protect ratios from tiny denominators: without them, the thinnest contracts lead a volume/OI ranking.",
			"输入位于报告内部。修改一个输入会生成草稿值，并为整个 Recipe 显示一个“运行”控件；运行之前下面什么都不变，运行后所有依赖的单元格一起刷新。“放弃更改”恢复上一次成功运行的值，修改输入也绝不会改写 Recipe 本身。阈值和交易时段日期是同一个问题的输入：更严格的门槛或换一天，都是重新运行它，答案仍可比较。改变度量对象、排名方式或哪些合约有资格入选，则是提出新问题，应放进你自己分叉的 Recipe。成交量和未平仓量的门槛还能保护比率不受极小分母影响：没有它们，成交量/OI 排名的前列就会是最冷门的合约。",
		),
		example: t(
			"Monday's screener at its defaults flags 5 contracts. Type 1,000 into Min OI and the report still shows 5 until you press Run; then only the CRUX Nov 15 70 call, with 1,500 open interest, passes. Raising Min volume/OI to 2 keeps 3 of the 5, and picking Tuesday shows Tuesday's 2: both re-run the same question. Drop the volume and open-interest floors to 0 and the DUNE Oct 11 40 call, 30 contracts against 5 open interest, leads at 6.00. ALFA's Dec 20 110 call, 12 against 3, stays out: at 95 days it is past the 60-day limit.",
			"周一的筛选器在默认设置下有 5 份合约入选。在最低未平仓量里输入 1,000，点“运行”之前报告仍显示 5 份；运行后只有未平仓量 1,500 的 CRUX 11月15日 70 看涨通过。把最低成交量/OI 提高到 2，5 份中留下 3 份；选择周二则显示周二的 2 份：两者都是重新运行同一个问题。把成交量和未平仓量门槛都降为 0，DUNE 10月11日 40 看涨（成交 30 张、未平仓量 5）以 6.00 领先。ALFA 12月20日 110 看涨（成交 12、未平仓 3）仍被排除：它离到期 95 天，超过了 60 天的限制。",
		),
		misconception: t(
			"Typing a value isn't running it, and changing the method isn't tuning: a new measure is a new question, in its own recipe.",
			"输入一个值不等于运行它，改方法也不是调参：新的度量就是新的问题，应放在它自己的 Recipe 里。",
		),
		case: (v) => {
			const change = [
				["Raise Min OI to 500", "把最低未平仓量提高到 500", "same"],
				[
					"Rank the contracts by trade count instead",
					"改为按成交笔数给合约排名",
					"new",
				],
				[
					"Pick last Friday in the date picker",
					"在日期选择器中选择上周五",
					"same",
				],
				[
					"Let same-day expiries into the screen",
					"让当天到期的合约进入筛选",
					"new",
				],
			][v];
			const [volume, oi] = [
				[30, 5],
				[12, 3],
				[45, 9],
				[80, 16],
			][v];
			return {
				brief: t(
					"You are working in TradingFlow's unusual-activity screener on Monday's session, starting from its default inputs.",
					"你正在 TradingFlow 的异常成交筛选器中处理周一的交易时段，从默认输入开始。",
				),
				questions: [
					c(
						"draft",
						"You change Min volume/OI to 3 and don't press Run. What do the key figures and table show?",
						"你把最低成交量/OI 改成 3，但没有点“运行”。关键数字和表格显示什么？",
						[
							["last", "The last run, unchanged", "上一次运行，没有变化"],
							["new", "Results at the new threshold", "新阈值下的结果"],
							["empty", "Nothing until you run", "运行前什么也不显示"],
						],
						"last",
						"An edited input is a draft; every cell keeps the last run until you press Run, then they refresh together.",
						"修改的输入只是草稿；在你点“运行”之前每个单元格都保留上一次运行，运行后再一起刷新。",
					),
					c(
						"kind",
						`"${change[0]}": does that re-run the same question or ask a new one?`,
						`“${change[1]}”：这是重新运行同一个问题，还是提出新问题？`,
						[
							["same", "Re-runs the same question", "重新运行同一个问题"],
							["new", "Asks a new question", "提出新问题"],
						],
						change[2],
						"Thresholds and the date are inputs to the same question. Changing what is measured, how it ranks, or which contracts are eligible asks a new one.",
						"阈值和日期是同一个问题的输入；改变度量、排名方式或入选资格，则是提出新问题。",
					),
					n(
						"ratio",
						`With the floors at 0, a contract that traded ${volume} against ${oi} open interest appears. Its volume/OI?`,
						`门槛降为 0 后，出现一份成交 ${volume} 张、未平仓量 ${oi} 的合约。它的成交量/OI 是多少？`,
						volume / oi,
						"× open interest",
						"倍未平仓量",
						`${volume} ÷ ${oi} = ${(volume / oi).toFixed(2)}: a big ratio from a tiny denominator.`,
						`${volume} ÷ ${oi} = ${(volume / oi).toFixed(2)}：极小的分母带来很大的比率。`,
						0.01,
					),
					c(
						"floors",
						"You lowered the floors for your own research. What should you do when you cite the top contract?",
						"你为自己的研究降低了门槛。引用排名第一的合约时应该怎么做？",
						[
							[
								"state",
								"State the floors you used and give its volume and open interest",
								"说明使用的门槛，并给出它的成交量和未平仓量",
							],
							[
								"ratio",
								"Quote the ratio alone; it's the screen's metric",
								"只引用比率，那是筛选的指标",
							],
							[
								"hide",
								"Restore the defaults first, then cite it",
								"先恢复默认值再引用",
							],
						],
						"state",
						"A ratio without its denominator hides how thin the contract is; the floors you used are part of the result.",
						"不给分母的比率会掩盖合约有多冷门；你使用的门槛本身就是结果的一部分。",
					),
				],
			};
		},
	},
	{
		id: "research-checklist",
		conceptLab: {
			kind: "research-checklist",
			intro: t(
				"Spot the forecast hiding in a checklist, see what Home keeps after a refresh, and watch Customize with AI ask before it proposes.",
				"找出藏在清单里的预测，看看刷新后 Home 保留了什么，并观察 Customize with AI 先提问、再建议。",
			),
		},
		sources: [cookbooksGuide],
		explanation: t(
			"TradingFlow's Home starts from \"What are you trying to decide?\" and four common questions: before selling a call, unusual positioning before a catalyst, whether flow preceded a stock move, and whether IV is really elevated. Each question becomes a short, ordered checklist, and every step names something to inspect and opens the tool that shows it, such as Rank Symbols for volatility or Rank Contracts for a contract's spread and open interest. A step must be checkable today: one that asks you to confirm where a price will be is a forecast, not a step. You can reorder steps, change their focus, add a focused step from the analysis tools or remove one, but the checklist resets when the page refreshes, so copy the version you settle on into your notes. Customize with AI opens TradingFlow AI in the sidebar, asks one clarifying question, then proposes changes; replies use AI credits, and a recipe is built only if your account has that feature and you confirm. TradingFlow labels its templates as research checklists, not recommendations.",
			"TradingFlow 的 Home 从“你想决定什么？”和四个常见问题开始：卖出看涨前、催化事件前是否有异常持仓、成交流是否先于股价变动，以及隐含波动率是否真的偏高。每个问题都会变成一份简短、有顺序的清单，每一步都写明要查看什么，并打开能显示它的工具，比如查看波动率用 Rank Symbols，查看合约价差和未平仓量用 Rank Contracts。每一步都必须是今天就能核查的：要求你确认价格将会在哪里的步骤是预测，不是步骤。你可以调整步骤顺序、改变关注重点、从分析工具中添加一个聚焦的步骤或删掉一步，但页面刷新后清单会重置，所以要把最终版本抄进笔记。Customize with AI 会在侧边栏打开 TradingFlow AI，先问一个澄清问题，再提出修改；回复消耗 AI 积分，而且只有你的账户有该功能并且你确认后才会构建 Recipe。TradingFlow 把自己的模板标注为研究清单，而不是建议。",
		),
		example: t(
			"Before selling an ALFA Oct 18 105 call, Home's template has four steps: compare ALFA's IV with its realized volatility, inspect GEX and open-interest structure, check the call's spread, liquidity and open interest, and review recent call flow. A friend's step, \"confirm ALFA stays below $105 until Oct 18\", is a forecast: no tool can check it. Adding a step for ALFA's Oct 3 earnings, which fall before the Oct 18 expiry, is a fair edit, but a refresh brings back the four-step template unless you copied your version first.",
			"在卖出 ALFA 10月18日 105 看涨之前，Home 的模板有四步：比较 ALFA 的隐含波动率与已实现波动率、查看 GEX 与未平仓量结构、检查该看涨期权的价差、流动性和未平仓量，以及回顾近期的看涨成交流。朋友写的“确认 ALFA 在10月18日前一直低于 $105”是预测：没有工具能核查它。为 ALFA 10月3日 的财报（在10月18日到期之前）新增一步是合理的修改，但除非你先抄下自己的版本，否则刷新后会恢复四步模板。",
		),
		misconception: t(
			"A checklist is a plan for evidence, not a decision, and Home doesn't save it. Keep only steps a tool can check, and copy your version before you refresh.",
			"清单是收集证据的计划，不是决定，而且 Home 不会保存它。只保留工具能核查的步骤，刷新前把你的版本抄下来。",
		),
		case: (v) => {
			const forecast = [
				[
					"Confirm ALFA stays below $105 until Oct 18",
					"确认 ALFA 在10月18日前一直低于 $105",
				],
				[
					"Make sure earnings won't move ALFA much",
					"确保财报不会让 ALFA 大幅波动",
				],
				[
					"Check that IV will fall after earnings",
					"确认财报后隐含波动率会下降",
				],
				["Verify the call will expire worthless", "核实该看涨期权会到期作废"],
			][v];
			return {
				brief: t(
					"You are preparing to research selling an ALFA call, starting from TradingFlow Home's checklist.",
					"你准备从 TradingFlow Home 的清单出发，研究卖出一份 ALFA 看涨期权。",
				),
				questions: [
					c(
						"forecast",
						"Which step doesn't belong in a research checklist?",
						"哪一步不应列入研究清单？",
						[
							["forecast", forecast[0], forecast[1]],
							[
								"vol",
								"Compare ALFA's IV with its realized volatility",
								"比较 ALFA 的隐含波动率与已实现波动率",
							],
							[
								"trade",
								"Check the call's spread and open interest",
								"检查看涨期权的价差与未平仓量",
							],
						],
						"forecast",
						"Every step should inspect evidence a tool can show today; a claim about the future can't be checked.",
						"每一步都应查看今天有工具能显示的证据；关于未来的说法无法核查。",
					),
					c(
						"tool",
						'"Check the call\'s spread, liquidity and open interest": which tool does that step open?',
						"“检查看涨期权的价差、流动性与未平仓量”：这一步打开哪个工具？",
						[
							["contracts", "Rank Contracts", "Rank Contracts"],
							["trades", "Option Trades", "Option Trades"],
							["symbols", "Rank Symbols", "Rank Symbols"],
						],
						"contracts",
						"Tradeability is about one contract: Rank Contracts shows its spread, liquidity and open interest. Option Trades shows its prints.",
						"可交易性关乎单个合约：Rank Contracts 显示它的价差、流动性和未平仓量；Option Trades 显示它的成交记录。",
					),
					c(
						"refresh",
						"You edit the checklist and then refresh the page. What do you see?",
						"你编辑了清单，然后刷新页面。你会看到什么？",
						[
							["template", "The template again", "又是模板"],
							["edited", "Your edited checklist", "你编辑后的清单"],
							["empty", "An empty checklist", "空白清单"],
						],
						"template",
						"Home's checklist resets on refresh; copy the steps you want to keep.",
						"Home 的清单刷新即重置；要保留的步骤需要自己抄下来。",
					),
					c(
						"ai",
						"You open Customize with AI. What happens before it proposes a change?",
						"你打开 Customize with AI。在它提出修改之前会发生什么？",
						[
							[
								"clarify",
								"It asks one clarifying question",
								"它会问一个澄清问题",
							],
							["save", "It saves a new recipe", "它会保存一个新 Recipe"],
							[
								"nothing",
								"Nothing; it rewrites at once",
								"什么都不发生，它立即改写",
							],
						],
						"clarify",
						"It asks one clarifying question first; replies cost credits, and a recipe is built only on your confirmation.",
						"它先问一个澄清问题；回复消耗积分，只有你确认后才会构建 Recipe。",
					),
				],
			};
		},
	},
	{
		id: "ai-verify",
		conceptLab: {
			kind: "ai-verify",
			intro: t(
				"Sort TradingFlow AI's statements about a report by the evidence behind them, count what a conversation costs in credits, and see which AI action changes a recipe.",
				"按背后的证据给 TradingFlow AI 关于报告的陈述分类，算清一段对话消耗的积分，并看清哪种 AI 操作会改动 Recipe。",
			),
		},
		sources: [cookbooksGuide],
		explanation: t(
			"TradingFlow AI works beside the data: it understands the page you have open, can query market data with read-only tools, and can answer with charts and tables. Its answers are drafts. Sort every sentence before relying on it: shown in the report, calculable from the rows, or beyond the data. Flow can't identify who traded, why, or whether a trade opened a position, and no session's data supports a statement about where a price will go; TradingFlow's own reports say none of these measures proves identity, intent or a future move. Each reply uses credits, 1 for a reply and 2 with a chart or deep analysis; the sidebar shows the balance and Billing lists each reply. Annotate attaches an element on the page as context. On a recipe, AI Insight explains one completed run and changes nothing, while Edit with AI opens a private draft you can change and save. Access to TradingFlow AI depends on your plan, AI consent and rollout.",
			"TradingFlow AI 在数据旁边工作：它能理解你打开的页面，可以用只读工具查询市场数据，并用图表和表格作答。它的回答是草稿。依赖每句话之前先分类：报告中有的、能从行数据算出的，还是超出数据的。成交流无法识别谁交易、为什么，或一笔交易是否开仓；任何交易时段的数据也都不支持关于价格走向的说法；TradingFlow 自己的报告也说明，这些指标都不能证明身份、意图或未来走势。每条回复消耗积分：普通回复 1 积分，含图表或深度分析 2 积分；侧边栏显示余额，“账单”列出每条回复。Annotate 把页面上的一个元素作为上下文附上。在 Recipe 上，AI Insight 解释一次已完成的运行，不改动任何内容；Edit with AI 则打开一份你可以修改并保存的私有草稿。能否使用 TradingFlow AI 取决于你的方案、AI 授权和灰度范围。",
		),
		example: t(
			'Asked about Monday\'s screener, TradingFlow AI writes five sentences. "The screen flagged 5 contracts across 3 names" is in the key figures. "The CRUX Oct 4 60 put traded 2.67 times its open interest" is 2,400 ÷ 900 from its row, and "3 of the 5 expire within 30 days" is a count of the expiry column. "Someone opened a large bearish bet on CRUX ahead of news" and "CRUX will fall before Oct 4" are not supported. Three questions with one chart cost 1 + 2 + 1 = 4 credits.',
			"问到周一的筛选器时，TradingFlow AI 写了五句话。“筛选在 3 个标的中标出了 5 份合约”在关键数字里。“CRUX 10月4日 60 看跌的成交量是其未平仓量的 2.67 倍”是从它那一行算出的 2,400 ÷ 900；“5 份中有 3 份在 30 天内到期”是对到期日那列的计数。“有人在消息公布前对 CRUX 建立了大额看空押注”和“CRUX 会在10月4日前下跌”都没有依据。三个问题中一条含图表，消耗 1 + 2 + 1 = 4 积分。",
		),
		misconception: t(
			"A fluent answer isn't a checked one. Sort each sentence by its evidence before you use it, and remember AI Insight explains a run without changing the recipe.",
			"回答流畅不等于经过核查。使用之前按证据给每句话分类；也要记住 AI Insight 只解释一次运行，不会改动 Recipe。",
		),
		case: (v) => {
			const statement = [
				[
					"A buyer was betting on a CRUX drop.",
					"有买家在押注 CRUX 下跌。",
					"unsupported",
				],
				[
					"The DUNE Sep 27 30 call traded 780 against 360 open interest.",
					"DUNE 9月27日 30 看涨成交 780 张，未平仓量 360。",
					"report",
				],
				[
					"Smart money is moving into BRDX puts.",
					"聪明钱正在流入 BRDX 看跌期权。",
					"unsupported",
				],
				[
					"Two of the flagged contracts are on CRUX.",
					"入选合约中有两份是 CRUX 的。",
					"report",
				],
			][v];
			const [text, chart] = [
				[2, 1],
				[3, 1],
				[1, 2],
				[4, 0],
			][v];
			return {
				brief: t(
					"You ask TradingFlow AI about Monday's unusual-activity screen and check its answer before using it.",
					"你向 TradingFlow AI 询问周一的异常成交筛选，并在使用前核查它的回答。",
				),
				questions: [
					c(
						"sort",
						`The AI writes: "${statement[0]}" How do you sort it?`,
						`AI 写道：“${statement[1]}”你如何给它分类？`,
						[
							[
								"report",
								"Shown in or calculable from the report",
								"报告中有或可从报告计算",
							],
							["unsupported", "Not supported by the data", "数据不支持"],
						],
						statement[2],
						"Counts and figures in the rows can be checked; claims about who traded, why, or what comes next go beyond flow data.",
						"行里的数量和数字可以核对；关于谁交易、为什么或接下来怎样的说法则超出了成交流数据。",
					),
					n(
						"credits",
						`The conversation had ${text} text replies and ${chart} with a chart. How many credits did it use?`,
						`这段对话有 ${text} 条文字回复和 ${chart} 条含图表的回复。一共消耗多少积分？`,
						text + 2 * chart,
						"credits",
						"积分",
						`${text} × 1 + ${chart} × 2 = ${text + 2 * chart} credits.`,
						`${text} × 1 + ${chart} × 2 = ${text + 2 * chart} 积分。`,
					),
					c(
						"insight",
						"You run AI Insight on the recipe. What changes?",
						"你对这个 Recipe 运行 AI Insight。会改变什么？",
						[
							["nothing", "Nothing in the recipe", "Recipe 中什么都不变"],
							["draft", "A private draft opens", "会打开一份私有草稿"],
							["inputs", "The inputs update", "输入会更新"],
						],
						"nothing",
						"AI Insight explains one completed run; only Edit with AI opens a draft that can change.",
						"AI Insight 解释一次已完成的运行；只有 Edit with AI 会打开可修改的草稿。",
					),
					c(
						"annotate",
						"Your question is about one row of the table. How do you give the AI that context?",
						"你的问题是关于表格中的某一行。如何把这个上下文交给 AI？",
						[
							[
								"annotate",
								"Use Annotate to pick the row",
								"用 Annotate 选取那一行",
							],
							[
								"vague",
								'Ask about "this" and let it guess',
								"问“这个”，让它去猜",
							],
							["chart", "Ask for a chart first", "先让它画一张图"],
						],
						"annotate",
						"Annotate attaches the element you pick, so one reply can answer the question you meant.",
						"Annotate 会附上你选取的元素，这样一条回复就能回答你真正想问的问题。",
					),
				],
			};
		},
	},
];
