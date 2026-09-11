import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	EvidenceBucketsScene,
	FollowUpScene,
	PrintInspectorScene,
	PrintReviewData,
} from "./print-review-concept-scenes";

const scenes = [
	{
		id: "inspect",
		label: ["Inspect the print", "检查成交"],
		title: ["Build the amount from the execution", "从成交本身计算金额"],
		prompt: [
			"Follow the contract, timestamp, price, count and multiplier. Notice what changes when a required unit is missing.",
			"依次检查合约、时间、价格、数量与乘数，观察必要单位缺失时会发生什么。",
		],
		Component: PrintInspectorScene,
	},
	{
		id: "separate",
		label: ["Sort the evidence", "区分证据"],
		title: [
			"Known dollars do not make every claim known",
			"金额已知，不代表所有结论已知",
		],
		prompt: [
			"Inspect a statement and place it in an evidence category. Then add a new record and reconsider.",
			"检查一项陈述并选择证据类别，再加入新记录，重新判断。",
		],
		Component: EvidenceBucketsScene,
	},
	{
		id: "next",
		label: ["Choose the next check", "选择下一项检查"],
		title: ["Ask for the evidence that fills the gap", "寻找能填补缺口的证据"],
		prompt: [
			"Choose one missing fact, request a follow-up record, and see exactly what it resolves.",
			"选择一个缺失事实，检查一项后续记录，观察它究竟解决了什么。",
		],
		Component: FollowUpScene,
	},
] as const satisfies readonly ConceptScene[];
export function PrintReviewConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "validate-option-print")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<PrintReviewData value={data}>
			<ConceptLab
				locale={locale}
				id="print-review"
				label={["Interactive execution review lesson", "成交审查互动课堂"]}
				scenes={scenes}
			/>
		</PrintReviewData>
	);
}
