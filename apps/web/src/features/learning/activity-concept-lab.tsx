import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import {
	ActivityData,
	DenominatorScene,
	ScreeningScene,
	WindowComparisonScene,
} from "./activity-concept-scenes";
import { ConceptLab, type ConceptScene } from "./concept-lab";

const scenes = [
	{
		id: "denominator",
		label: ["Change the denominator", "改变分母"],
		title: [
			"A small denominator can make a large ratio",
			"小分母也能产生大比率",
		],
		prompt: [
			"Hold volume fixed and explore a hypothetical comparison value. Relative volume and volume/OI answer different questions.",
			"保持成交量不变，探索假设比较值。相对成交量与成交量/OI 回答不同问题。",
		],
		Component: DenominatorScene,
	},
	{
		id: "windows",
		label: ["Match the window", "对齐窗口"],
		title: ["Compare the same part of the session", "比较时段中的相同部分"],
		prompt: [
			"Inspect the current window, historical window and coverage before accepting a ratio.",
			"接受比率前，检查当前窗口、历史窗口与覆盖情况。",
		],
		Component: WindowComparisonScene,
	},
	{
		id: "screen",
		label: ["Inspect the screen", "检查筛选"],
		title: [
			"A threshold changes who you are looking at",
			"阈值改变你正在观察的人群",
		],
		prompt: [
			"Move the threshold and switch the metric. Compare an equal-row average with a pooled ratio on the selected population.",
			"移动阈值并切换指标，在选定人群内比较等权行均值与汇总比率。",
		],
		Component: ScreeningScene,
	},
] as const satisfies readonly ConceptScene[];
export function ActivityConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "unusual-activity")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<ActivityData value={data}>
			<ConceptLab
				locale={locale}
				id="activity"
				label={["Interactive unusual activity lesson", "异常活动互动课堂"]}
				scenes={scenes}
			/>
		</ActivityData>
	);
}
