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
			"On Monday Sep 16 the Unusual Options Activity Screener, at its default thresholds (volume/OI at least 1, volume at least 500, open interest at least 200, at most 60 days to expiry), passes five contracts: the CRUX Oct 4 60 put at 2.67 times its open interest, the DUNE Sep 27 30 call at 2.17, the BRDX Oct 11 25 put at 2.00, the GLYN Oct 18 45 call at 1.25 and the CRUX Nov 15 70 call at 1.20. None of ALFA's calls passes; its busiest, the Oct 18 105 call, traded 505 contracts against 1,200 open interest, 0.42. Opened at 8:00 on Tuesday, the report still shows Monday's session. After Tuesday's close it shows Tuesday's two: the EMBR Oct 4 80 call at 2.75 and the DUNE 30 call at 1.24.",
			"9月16日周一，Unusual Options Activity Screener 在默认阈值下（成交量/OI 至少 1、成交量至少 500、未平仓量至少 200、最多 60 天到期）筛出五份合约：CRUX 10月4日 60 看跌为其未平仓量的 2.67 倍，DUNE 9月27日 30 看涨 2.17 倍，BRDX 10月11日 25 看跌 2.00 倍，GLYN 10月18日 45 看涨 1.25 倍，CRUX 11月15日 70 看涨 1.20 倍。ALFA 的看涨期权一个也没通过；其中最活跃的 10月18日 105 看涨成交 505 张，未平仓量 1,200，比值 0.42。在周二 8:00 打开时，报告仍显示周一的时段。周二收盘后，它显示周二的两份：EMBR 10月4日 80 看涨 2.75 倍和 DUNE 30 看涨 1.24 倍。",
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
				[1_300, 600],
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
];
