import type { Lesson, TradingFlowPractice } from "@/content/course";
import { type Course, tradingFlowCourse } from "@/content/course";
import type { Locale } from "./messages";

type LessonCopy = Partial<Pick<Lesson, "title" | "summary" | "category">> & {
	practice?: Partial<Pick<TradingFlowPractice, "title" | "goal">>;
};

const chineseLessonCopy: Record<string, LessonCopy> = {
	"audited-boundary": {
		title: "从可审计的边界开始",
		summary: "在打开候选标的前，先定义问题、来源、时间范围、负责人和失效规则。",
		category: "方法",
		practice: {
			title: "写下一个边界明确的研究问题",
			goal: "打开 TradingFlow Home，选择一个交易时段、一种来源视角，以及你希望证据帮助回答的一个决策。",
		},
	},
	"symbol-universe": {
		title: "选择正确的标的范围",
		summary: "先确定资格、时效和可比规则，再让 Rank 帮你集中注意力。",
		category: "发现",
		practice: {
			title: "先声明研究范围",
			goal: "打开 Rank Symbols，选择可比的标的范围和时段，并记录哪些过时或不符合资格的行应被排除。",
		},
	},
	"rank-symbols": {
		title: "使用 Rank Symbols，但不要把排名当成信号",
		summary:
			"阅读排名行背后的字段，寻找反向证据，只把候选标的推进到下一步检查。",
		category: "发现",
		practice: {
			title: "推进一个候选标的",
			goal: "选择一个排名靠前的标的，记录它为何值得检查，并写下一个可能改变优先级的事实。",
		},
	},
	"symbol-drawer": {
		title: "打开标的抽屉并检查数据时效",
		summary:
			"固定标的身份，说明当前视角，检查必需字段，并在上下文过时或缺失时停止。",
		category: "检查",
		practice: {
			title: "运行抽屉时效检查",
			goal: "打开选中标的的抽屉，检查每一条 as-of 信息，并区分已观察事实与仍未知的部分。",
		},
	},
	"rank-contracts": {
		title: "排名合约，但不要重新定义范围",
		summary:
			"从标的进入合约时，保持到期日、价内外程度、邻近合约和比较范围不变。",
		category: "检查",
		practice: {
			title: "缩小范围，但不要改变问题",
			goal: "选择一个排名合约，说明到期日、行权价、价内外程度和邻近合约如何影响优先级。",
		},
	},
	"validate-option-print": {
		title: "在 Option Trades 中验证一笔成交",
		summary:
			"阅读买卖价位置、权利金、数量、合约上下文、重复性和报价证据，不臆测交易意图。",
		category: "验证",
		practice: {
			title: "写下事实、未知和下一项检查",
			goal: "打开一笔历史成交，记录执行事实，把未解决的意图保留为未知，并写下下一项检查。",
		},
	},
	"session-flow-vs-structure": {
		title: "区分时段成交流与长期结构",
		summary:
			"把今日成交、已报告的未平仓量、Delta-OI 和模型 GEX 放在各自的时间尺度上。",
		category: "结构",
		practice: {
			title: "写下数据时效说明",
			goal: "对比选定时段的成交、展示的 OI 和结构上下文，写明每个来源的日期和时间范围。",
		},
	},
	"dex-dei-gex": {
		title: "比较 DEX、DEI 和 GEX，不混淆时间范围",
		summary:
			"保持有符号流、归一化幅度和模型结构各自独立，即使不同视角产生分歧。",
		category: "结构",
		practice: {
			title: "允许不同视角出现分歧",
			goal: "针对一个标的写下 DEX、DEI 和 GEX 各自支持的内容、无法回答的内容，以及它们范围的差异。",
		},
	},
	"cookbook-research-packet": {
		title: "在 Cookbooks 中建立可重复的研究包",
		summary:
			"版本化问题，附上可检查输入，明确负责人，记录缺失，并保留质疑路径。",
		category: "研究产出",
		practice: {
			title: "运行一个边界明确的 Cookbook",
			goal: "打开一个官方 Cookbook，保持问题不变，并记录结果、排除项、未知项和下一步检查。",
		},
	},
	"market-recap": {
		title: "把完成的研究包整理成 Market Recap",
		summary:
			"选择带有来源链路的证据，用能回答问题的图表，并把限制条件放在每项结论旁边。",
		category: "研究产出",
		practice: {
			title: "复核 Daily Market Recap",
			goal: "把一条 recap 标题追溯到图表、日期、分母、来源和可见的限制说明。",
		},
	},
	"audit-market-recap": {
		title: "发布前审计 Market Recap",
		summary:
			"固定审计契约，追踪结论来源，让缺口保持可见，运行质疑路径，并在边界内签字确认。",
		category: "研究产出",
		practice: {
			title: "运行发布审计",
			goal: "审计一份 recap 的时效、结论到研究包的链路、图表上下文、缺失、可质疑性和有边界的签核。",
		},
	},
};

const courseCopy = {
	en: {
		title: tradingFlowCourse.title,
		description: tradingFlowCourse.description,
	},
	zh: {
		title: "证据驱动的期权研究",
		description:
			"从一个边界明确的市场问题出发，经过 Rank、Option Trades、结构上下文、Cookbooks 和 Market Recap，建立可审计的研究路径。",
	},
} as const;

export type LocalizedCourse = Omit<
	Course,
	"title" | "description" | "lessons"
> & {
	title: string;
	description: string;
	lessons: readonly Lesson[];
};

export function getLocalizedLesson(lesson: Lesson, locale: Locale): Lesson {
	if (locale === "en") return lesson;
	const copy = chineseLessonCopy[lesson.slug];
	if (!copy) return lesson;
	return {
		...lesson,
		title: copy.title ?? lesson.title,
		summary: copy.summary ?? lesson.summary,
		category: copy.category ?? lesson.category,
		practice: {
			...lesson.practice,
			title: copy.practice?.title ?? lesson.practice.title,
			goal: copy.practice?.goal ?? lesson.practice.goal,
		},
	};
}

export function getLocalizedCourse(locale: Locale): LocalizedCourse {
	const copy = courseCopy[locale];
	return {
		...tradingFlowCourse,
		title: copy.title,
		description: copy.description,
		lessons: tradingFlowCourse.lessons.map((lesson) =>
			getLocalizedLesson(lesson, locale),
		),
	};
}
