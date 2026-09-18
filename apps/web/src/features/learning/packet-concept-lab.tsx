import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	PacketData,
	PacketFieldsScene,
	PacketRerunScene,
	PacketTraceScene,
} from "./packet-concept-scenes";
import { teachingSteps } from "./visual-step";

const scenes = [
	{
		id: "trace",
		label: ["Trace the calculation", "追溯计算"],
		title: ["Follow real row IDs into the subtotal", "沿实际行 ID 追溯小计"],
		prompt: [
			"Inspect each supplied row, then replay the transformation and coverage check. Missing R3 stays in the record.",
			"检查每条给定行，再回放变换与覆盖检查。缺失 R3 保留在记录中。",
		],
		steps: teachingSteps(
			[
				[
					"Trace the actual row IDs through the formula to the observed subtotal.",
					"沿真实行 ID，经过公式，追踪到已观测小计。",
				],
			],
			[
				["Source rows", "来源行"],
				["Calculate", "计算"],
				["Subtotal", "小计"],
				["Coverage", "覆盖"],
			],
		),
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
		steps: teachingSteps(
			[
				[
					"Build a complete example with source, method, units and missingness beside the result.",
					"在结果旁补齐来源、方法、单位与缺失信息，构建完整示例。",
				],
			],
			[
				["Inspect packet fields", "检查研究包字段"],
				["Remove one field", "移除一个字段"],
				["Check reproducibility", "检查可复现性"],
			],
		),
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
		steps: teachingSteps(
			[
				[
					"A permitted rerun gets its own record while preserving the original result.",
					"允许的重跑建立独立记录，同时保留原结果。",
				],
			],
			[
				["Read original packet", "读取原研究包"],
				["Change one permitted input", "改变一个允许输入"],
				["Save a new record", "保存新记录"],
			],
		),
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
