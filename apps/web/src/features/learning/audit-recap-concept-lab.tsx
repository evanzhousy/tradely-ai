import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import {
	AuditAmountScene,
	AuditClaimsScene,
	AuditRecapData,
	AuditSignoffScene,
} from "./audit-recap-concept-scenes";
import { ConceptLab, type ConceptScene } from "./concept-lab";

const scenes = [
	{
		id: "amount",
		label: ["Recalculate the number", "重算数值"],
		title: [
			"Repair the transformation, retain the source fact",
			"修复变换，保留来源事实",
		],
		prompt: [
			"Restore the omitted multiplier row by row. Keep R1's correctly reported price and R3's missingness intact.",
			"逐行恢复遗漏乘数，保留 R1 正确报告的价格与 R3 缺失状态。",
		],
		Component: AuditAmountScene,
	},
	{
		id: "claims",
		label: ["Find the first defect", "找首个缺陷"],
		title: [
			"One repair does not approve the whole report",
			"一项修复不代表整份报告通过",
		],
		prompt: [
			"Inspect identity, date, scope, scale, coverage and inference. Repair selected defects without discarding supported evidence.",
			"检查身份、日期、范围、尺度、覆盖与推断，修复所选缺陷而不丢弃受支持证据。",
		],
		Component: AuditClaimsScene,
	},
	{
		id: "signoff",
		label: ["Write a bounded signoff", "写有边界签核"],
		title: [
			"Say what passed and what remains open",
			"说明通过了什么、还有什么未解决",
		],
		prompt: [
			"Inspect a supplied repaired example and assemble its signoff fields. Repairs do not create missing evidence.",
			"检查给定修复示例并组装签核字段。修复不会创造缺失证据。",
		],
		Component: AuditSignoffScene,
	},
] as const satisfies readonly ConceptScene[];
export function AuditRecapConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "audit-market-recap")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<AuditRecapData value={data}>
			<ConceptLab
				locale={locale}
				id="audit-recap"
				label={[
					"Interactive market recap audit lesson",
					"市场复盘审核互动课堂",
				]}
				scenes={scenes}
			/>
		</AuditRecapData>
	);
}
