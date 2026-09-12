import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import {
	CrossDeltaData,
	CrossDeltaEffectsScene,
	CrossDeltaPositionScene,
	CrossDeltaUnitsScene,
} from "./charm-vanna-concept-scenes";
import { ConceptLab, type ConceptScene } from "./concept-lab";

const scenes = [
	{
		id: "effects",
		label: ["Separate the effects", "区分影响"],
		title: [
			"Delta can change without a new trade",
			"没有新成交，Delta 也会变化",
		],
		prompt: [
			"Change elapsed time and IV independently, then compare their contributions before adding them.",
			"独立改变已过时间与 IV，先比较各自贡献，再相加。",
		],
		Component: CrossDeltaEffectsScene,
	},
	{
		id: "units",
		label: ["Read the convention", "读取约定"],
		title: [
			"Different units can describe the same event",
			"不同单位可描述同一事件",
		],
		prompt: [
			"Keep one day passing and a two-point IV rise fixed. Change the derivative convention and inspect the matching input change.",
			"固定经过一天与 IV 上升两点，改变导数约定并检查匹配的输入变化。",
		],
		Component: CrossDeltaUnitsScene,
	},
	{
		id: "position",
		label: ["Scale the position", "缩放持仓"],
		title: [
			"An option change needs a signed position",
			"期权变化需要带符号持仓",
		],
		prompt: [
			"Select an event, then change quantity or long/short side. Separate the option's delta from position delta and observed flow.",
			"选择事件，再改变张数或多空方向。区分期权 Delta、持仓 Delta 与观测成交流。",
		],
		Component: CrossDeltaPositionScene,
	},
] as const satisfies readonly ConceptScene[];
export function CharmVannaConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "charm-vanna")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<CrossDeltaData value={data}>
			<ConceptLab
				locale={locale}
				id="cross-delta"
				label={[
					"Interactive charm and vanna lesson",
					"Charm 与 Vanna 互动课堂",
				]}
				scenes={scenes}
			/>
		</CrossDeltaData>
	);
}
