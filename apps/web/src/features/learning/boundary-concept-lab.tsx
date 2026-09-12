import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import {
	BoundaryData,
	BoundaryEvidenceScene,
	BoundaryQuestionScene,
	BoundaryRevisionScene,
} from "./boundary-concept-scenes";
import { ConceptLab, type ConceptScene } from "./concept-lab";

const scenes = [
	{
		id: "question",
		label: ["Define the question", "定义问题"],
		title: [
			"Declare what would make an answer reviewable",
			"声明可审核答案的条件",
		],
		prompt: [
			"Open the supplied fields in the SVG. Switch to a forecast design and inspect its extra requirements.",
			"在 SVG 中打开给定字段，切换预测设计并检查额外要求。",
		],
		Component: BoundaryQuestionScene,
	},
	{
		id: "evidence",
		label: ["Sort the evidence", "区分证据"],
		title: ["A source fact is different from a story", "来源事实不同于叙事"],
		prompt: [
			"Pick a statement and try an evidence category. Read why it fits, including cases with more than one role.",
			"选择陈述并尝试证据类别，阅读其适用原因，包括多种作用的情况。",
		],
		Component: BoundaryEvidenceScene,
	},
	{
		id: "revision",
		label: ["Preserve the revision", "保留修订"],
		title: [
			"New evidence can revise the same question",
			"新证据可修订同一问题",
		],
		prompt: [
			"Replay a correction, then compare population, method and coverage changes. Keep the original record visible.",
			"回放更正，再比较人群、方法与覆盖变化，保持原记录可见。",
		],
		Component: BoundaryRevisionScene,
	},
] as const satisfies readonly ConceptScene[];
export function BoundaryConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "audited-boundary")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<BoundaryData value={data}>
			<ConceptLab
				locale={locale}
				id="boundary"
				label={["Interactive audited research lesson", "可审核研究互动课堂"]}
				scenes={scenes}
			/>
		</BoundaryData>
	);
}
