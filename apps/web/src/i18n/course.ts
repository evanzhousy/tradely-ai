import type { Lesson, TradingFlowPractice } from "@/content/course";
import { type Course, tradingFlowCourse } from "@/content/course";
import { courseModules } from "@/content/syllabus";
import type { Locale } from "./messages";

/** Chinese copy for TradingFlow practice tasks; lesson titles and summaries live in the syllabus. */
const chinesePracticeCopy: Record<
	string,
	Pick<TradingFlowPractice, "title" | "goal">
> = {
	"audited-boundary": {
		title: "写下一个边界明确的研究问题",
		goal: "打开 TradingFlow Home，选择一个交易时段、一种来源视角，以及你希望证据帮助回答的一个决策。",
	},
	"symbol-universe": {
		title: "先声明研究范围",
		goal: "打开 Rank Symbols，选择可比的标的范围和时段，并记录哪些过时或不符合资格的行应被排除。",
	},
	"rank-symbols": {
		title: "推进一个候选标的",
		goal: "选择一个排名靠前的标的，记录它为何值得检查，并写下一个可能改变优先级的事实。",
	},
	"symbol-drawer": {
		title: "运行抽屉时效检查",
		goal: "打开选中标的的抽屉，检查每一条 as-of 信息，并区分已观察事实与仍未知的部分。",
	},
	"rank-contracts": {
		title: "缩小范围，但不要改变问题",
		goal: "选择一个排名合约，说明到期日、行权价、价内外程度和邻近合约如何影响优先级。",
	},
	"validate-option-print": {
		title: "写下事实、未知和下一项检查",
		goal: "打开一笔历史成交，记录执行事实，把未解决的意图保留为未知，并写下下一项检查。",
	},
	"session-flow-vs-structure": {
		title: "写下数据时效说明",
		goal: "对比选定时段的成交、展示的 OI 和结构上下文，写明每个来源的日期和时间范围。",
	},
	"dex-dei-gex": {
		title: "区分方向与幅度",
		goal: "针对一个标的写下净 DEX 与 DEI 各自支持的内容、无法回答的内容，以及 DEI 读数使用的成交量分母。",
	},
	"cookbook-research-packet": {
		title: "运行一个边界明确的 Cookbook",
		goal: "打开一个官方 Cookbook，保持问题不变，并记录结果、排除项、未知项和下一步检查。",
	},
	"market-recap": {
		title: "复核 Daily Market Recap",
		goal: "把一条 recap 标题追溯到图表、日期、分母、来源和可见的限制说明。",
	},
	"audit-market-recap": {
		title: "运行发布审计",
		goal: "审计一份 recap 的时效、结论到研究包的链路、图表上下文、缺失、可质疑性和有边界的签核。",
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
			"理解合约、报价、成交、成交流、希腊值、市场结构与投资组合，用证据建立并审核研究。",
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
	const practice = chinesePracticeCopy[lesson.slug];
	return {
		...lesson,
		title: lesson.titleZh ?? lesson.title,
		summary: lesson.summaryZh ?? lesson.summary,
		category:
			courseModules.find((module) => module.id === lesson.moduleId)?.zh ??
			lesson.category,
		practice:
			lesson.practice && practice
				? { ...lesson.practice, ...practice }
				: lesson.practice,
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
