import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	SourceClocksScene,
	SourceCohortScene,
	SourceData,
	SourceRequirementScene,
} from "./source-concept-scenes";

const scenes = [
	{
		id: "clocks",
		label: ["Separate the clocks", "区分时钟"],
		title: ["An event can happen before you know it", "事件可先发生，后被获知"],
		prompt: [
			"Replay event and receipt time while dated OI and model context keep their own clocks.",
			"回放事件与接收时间，带日期 OI 和模型上下文保留各自时钟。",
		],
		Component: SourceClocksScene,
	},
	{
		id: "requirement",
		label: ["Match the requirement", "匹配要求"],
		title: ["Freshness depends on the question", "时效取决于问题"],
		prompt: [
			"Choose the requested session, then audit the source's identity, time, unit, value and coverage.",
			"选择请求时段，再审计来源的身份、时间、单位、数值与覆盖。",
		],
		Component: SourceRequirementScene,
	},
	{
		id: "cohort",
		label: ["Track the same series", "追踪相同序列"],
		title: [
			"A rolling label can hide changing members",
			"滚动标签可隐藏成员变化",
		],
		prompt: [
			"Replay two reports. Compare fixed series with a rolling DTE window, then withhold a later value.",
			"回放两份报告，比较固定序列与滚动 DTE 窗口，再隐藏一个后期数值。",
		],
		Component: SourceCohortScene,
	},
] as const satisfies readonly ConceptScene[];
export function SourceConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "symbol-drawer")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<SourceData value={data}>
			<ConceptLab
				locale={locale}
				id="source"
				label={["Interactive source audit lesson", "来源审计互动课堂"]}
				scenes={scenes}
			/>
		</SourceData>
	);
}
