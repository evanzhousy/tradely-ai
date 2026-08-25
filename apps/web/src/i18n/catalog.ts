import { type Lesson, tradingFlowCourse } from "@/content/course";

import type { Locale } from "./locale";

type LessonCopy = {
	title: string;
	summary: string;
	practice: {
		title: string;
		goal: string;
	};
};

const zhHansCourse = {
	title: "证据导向的期权研究",
	description:
		"从有边界的市场问题出发，经过 Rank、Option Trades、结构背景、Cookbooks 与 Market Recap，建立一条可审计的研究路径。",
};

const zhHansLessons: Record<string, LessonCopy> = {
	"audited-boundary": {
		title: "从经过审计的边界开始",
		summary:
			"在打开候选标的之前，先写清一个问题、数据源、时间范围、责任人与失效规则。",
		practice: {
			title: "写下一条有边界的研究问题",
			goal: "打开 TradingFlow Home，选定一个交易时段、一种数据透镜，以及你希望证据回答的一个决定。",
		},
	},
	"symbol-universe": {
		title: "选对标的宇宙",
		summary: "在让 Rank 集中注意力之前，先设定准入、时效与可比口径。",
		practice: {
			title: "先声明宇宙",
			goal: "打开 Rank Symbols，选定可比宇宙与时段，并记下哪些过期或不合格的行应排除。",
		},
	},
	"rank-symbols": {
		title: "使用 Rank Symbols，但不要把排名当成信号",
		summary: "读懂排名行背后的字段，检验反证，只把对象升格为待检视的候选。",
		practice: {
			title: "升格一个候选",
			goal: "选出一个被排名的标的，写下它值得检视的理由，以及一条可能推翻该优先级的事实。",
		},
	},
	"symbol-drawer": {
		title: "打开标的抽屉并检查时效",
		summary:
			"冻结标的身份，点名当前透镜，核对必填字段；上下文过期或缺失时停止。",
		practice: {
			title: "跑一遍抽屉时效门",
			goal: "打开所选标的抽屉，核对每一条 as-of，并把已观察到的与仍未知的分开。",
		},
	},
	"rank-contracts": {
		title: "给合约排序，但不重定义宇宙",
		summary: "从标的走到合约时，保持到期、价值状态、邻域与比较范围不变。",
		practice: {
			title: "收窄问题，不改问题",
			goal: "选出一个被排名的合约，说明到期、行权价、价值状态与邻近合约如何影响其优先级。",
		},
	},
	"validate-option-print": {
		title: "在 Option Trades 核验一笔成交",
		summary:
			"读买卖位置、权利金、规模、合约背景、重复出现与报价证据，不要发明意图。",
		practice: {
			title: "写下事实、未知、下一步检查",
			goal: "打开一笔历史成交，记录执行事实，让未决意图保持开放，并点名下一次检查。",
		},
	},
	"session-flow-vs-structure": {
		title: "把当日流量与存量结构分开",
		summary:
			"让今日成交、已报告的未平仓、delta-OI 与模型化的 GEX 各自待在自己的时钟上。",
		practice: {
			title: "写下时效行",
			goal: "把所选时段的成交与显示的 OI、结构背景对照，分别写下各自的来源日期与时间范围。",
		},
	},
	"dex-dei-gex": {
		title: "比较 DEX、DEI 与 GEX，不要折叠时间尺度",
		summary: "把有符号流量、标准化幅度与模型化结构分开——即使透镜结论不一致。",
		practice: {
			title: "允许透镜不一致",
			goal: "针对一个标的，写下 DEX、DEI、GEX 各自支持什么、无法回答什么，以及范围何处不同。",
		},
	},
	"cookbook-research-packet": {
		title: "在 Cookbooks 里做可重复的研究包",
		summary:
			"给问题定版本，附上可检查的输入，指定责任人，记录缺失，并保留一条质疑路径。",
		practice: {
			title: "跑一个有边界的 Cookbook",
			goal: "打开一份官方 Cookbook，保持问题不变，记录结果、排除项、未知与下一步检查。",
		},
	},
	"market-recap": {
		title: "把完成的研究包写成 Market Recap",
		summary: "选用有谱系的证据，让图表回答问题，并把限制条件放在每条主张旁边。",
		practice: {
			title: "审读 Daily Market Recap",
			goal: "把一条 recap 标题追溯到图表、日期、分母、来源与可见的限制条件。",
		},
	},
	"audit-market-recap": {
		title: "发布前审计 Market Recap",
		summary:
			"冻结审计合同，追溯主张谱系，让缺口可见，走完质疑路径，并以边界签字。",
		practice: {
			title: "跑发布审计",
			goal: "审计一份 recap 的时效、主张到研究包的谱系、图表上下文、缺失、可质疑性与有边界的签字。",
		},
	},
};

export function localizeLesson(lesson: Lesson, locale: Locale): Lesson {
	if (locale === "en") return lesson;
	const copy = zhHansLessons[lesson.id];
	if (!copy) return lesson;
	return {
		...lesson,
		title: copy.title,
		summary: copy.summary,
		practice: {
			...lesson.practice,
			title: copy.practice.title,
			goal: copy.practice.goal,
		},
	};
}

export function localizeCourse(locale: Locale) {
	if (locale === "en") return tradingFlowCourse;
	return {
		...tradingFlowCourse,
		title: zhHansCourse.title,
		description: zhHansCourse.description,
		lessons: tradingFlowCourse.lessons.map((lesson) =>
			localizeLesson(lesson, locale),
		),
	};
}

export function localizedLessonIds(): string[] {
	return Object.keys(zhHansLessons);
}
