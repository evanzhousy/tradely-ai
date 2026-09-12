import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	PacketData,
	PacketFieldsScene,
	PacketRerunScene,
	PacketTraceScene,
} from "./packet-concept-scenes";

const scenes = [
	{
		id: "trace",
		label: ["Trace the calculation", "追溯计算"],
		title: ["Follow real row IDs into the subtotal", "沿实际行 ID 追溯小计"],
		prompt: [
			"Inspect each supplied row, then replay the transformation and coverage check. Missing R3 stays in the record.",
			"检查每条给定行，再回放变换与覆盖检查。缺失 R3 保留在记录中。",
		],
		Component: PacketTraceScene,
	},
	{
		id: "fields",
		label: ["Make the packet readable", "使研究包可读"],
		title: [
			"A number needs enough context to reproduce it",
			"数值需要足够上下文才能复现",
		],
		prompt: [
			"Inspect the actual recorded fields. Remove a field to see what another reader would be missing.",
			"检查实际记录字段，移除字段以查看其他读者会缺少什么。",
		],
		Component: PacketFieldsScene,
	},
	{
		id: "rerun",
		label: ["Preserve each rerun", "保留每次重跑"],
		title: [
			"A permitted input change still needs a new record",
			"允许的输入变化也需新记录",
		],
		prompt: [
			"Compare a dated rerun with a changed universe, source or formula. Keep the original packet visible.",
			"比较日期重跑与范围、来源或公式变化，保持原研究包可见。",
		],
		Component: PacketRerunScene,
	},
] as const satisfies readonly ConceptScene[];
export function PacketConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "cookbook-research-packet")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<PacketData value={data}>
			<ConceptLab
				locale={locale}
				id="packet"
				label={[
					"Interactive reproducible research packet lesson",
					"可复现研究包互动课堂",
				]}
				scenes={scenes}
			/>
		</PacketData>
	);
}
