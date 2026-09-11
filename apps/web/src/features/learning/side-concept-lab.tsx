import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	LocationMapScene,
	QuoteReferenceScene,
	SideClaimScene,
	SideData,
} from "./side-concept-scenes";

const scenes = [
	{
		id: "map",
		label: ["Map the print", "成交位置"],
		title: ["MID is a region, not one price", "MID 是区间，不是单一价格"],
		prompt: [
			"Drag the execution marker across both quote boundaries. Watch the location code change.",
			"拖动成交标记穿越买卖价边界，观察位置代码如何变化。",
		],
		Component: LocationMapScene,
	},
	{
		id: "reference",
		label: ["Check the reference", "检查参考"],
		title: ["Keep the print. Question the quote.", "保留成交，审查报价。"],
		prompt: [
			"Use the same recorded price with different reference evidence. Decide when a reliable location is unavailable.",
			"为同一成交价切换参考证据，判断何时无法可靠确定位置。",
		],
		Component: QuoteReferenceScene,
	},
	{
		id: "claims",
		label: ["Location ≠ intent", "位置 ≠ 意图"],
		title: ["How far does this evidence take you?", "这些证据能支持到哪一步？"],
		prompt: [
			"Inspect a location, a possible initiator, or a claim about the order. Each needs different evidence.",
			"检查位置、可能的主动方或订单相关结论；它们需要不同证据。",
		],
		Component: SideClaimScene,
	},
] as const satisfies readonly ConceptScene[];
export function SideConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "execution-side")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<SideData value={data}>
			<ConceptLab
				locale={locale}
				id="side"
				label={["Interactive execution-side lesson", "成交位置互动课堂"]}
				scenes={scenes}
			/>
		</SideData>
	);
}
