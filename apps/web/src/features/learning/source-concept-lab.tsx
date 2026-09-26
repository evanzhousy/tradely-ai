import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	SourceClocksScene,
	SourceData,
	SourceRequirementScene,
} from "./source-concept-scenes";
import { teachingSteps } from "./visual-step";

const scenes = [
	{
		id: "clocks",
		label: ["Separate the clocks", "区分时钟"],
		title: ["An event can happen before you know it", "事件可先发生，后被获知"],
		prompt: [
			"Replay event and receipt time while dated OI and model context keep their own clocks.",
			"回放事件与接收时间，带日期 OI 和模型上下文保留各自时钟。",
		],
		steps: teachingSteps(
			[
				[
					"An event may happen before it becomes available to the researcher.",
					"事件发生时间，可以早于研究者得知它的时间。",
				],
			],
			[
				["Read event time", "读取事件时间"],
				["Add receipt time", "加入接收时间"],
				["Keep source clocks separate", "区分来源时钟"],
			],
		),
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
		steps: teachingSteps(
			[
				[
					"The same record can satisfy one time requirement and fail another.",
					"同一记录可满足一种时间要求，却不满足另一种。",
				],
			],
			[
				["Choose time requirement", "选择时间要求"],
				["Audit source fields", "审计来源字段"],
				["Decide freshness", "判断时效性"],
			],
		),
		Component: SourceRequirementScene,
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
