import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	EligibilityData,
	EligibilityDenominatorScene,
	EligibilityHistoryScene,
	EligibilityRulesScene,
} from "./eligibility-concept-scenes";

const scenes = [
	{
		id: "rules",
		label: ["Apply the rule", "应用规则"],
		title: ["Eligibility comes before ranking", "先判资格，再排名"],
		prompt: [
			"Inspect source rows, then replay the instrument, session, coverage and volume checks. A ready badge is not evidence.",
			"检查来源行，再回放工具、时段、覆盖与成交量检查。就绪标签不是证据。",
		],
		Component: EligibilityRulesScene,
	},
	{
		id: "denominator",
		label: ["Name the denominator", "说明分母"],
		title: [
			"Peer count and numeric baseline are different",
			"同组数量与数值基准不同",
		],
		prompt: [
			"Compare the observed peer count with a typical-volume ratio. Reveal a corrected missing candidate without changing the rule.",
			"比较已观测同组数量与典型成交量比率。在规则不变时展示缺失候选的更正数据。",
		],
		Component: EligibilityDenominatorScene,
	},
	{
		id: "history",
		label: ["Keep historical membership", "保留历史成员"],
		title: [
			"Today's survivors are not yesterday's universe",
			"今天留存者不是昨天的范围",
		],
		prompt: [
			"Switch the membership date while keeping the historical observations fixed. Inspect excluded and newly added members.",
			"保持历史观测固定，切换成员日期，检查被排除与新增成员。",
		],
		Component: EligibilityHistoryScene,
	},
] as const satisfies readonly ConceptScene[];
export function EligibilityConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "symbol-universe")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<EligibilityData value={data}>
			<ConceptLab
				locale={locale}
				id="eligibility"
				label={["Interactive symbol universe lesson", "标的范围互动课堂"]}
				scenes={scenes}
			/>
		</EligibilityData>
	);
}
