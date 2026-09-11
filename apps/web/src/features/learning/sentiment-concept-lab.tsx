import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	DirectionMatrixScene,
	FlowEvidenceScene,
	PositionScopeScene,
	SentimentData,
} from "./sentiment-concept-scenes";

const scenes = [
	{
		id: "matrix",
		label: ["Four combinations", "四种组合"],
		title: ["Option type is only half the label", "期权类型只是标签的一半"],
		prompt: [
			"Choose the likely aggressor's action and option type. Follow the isolated leg's directional effect.",
			"选择推断主动方的买卖行为与期权类型，追踪孤立单腿的方向影响。",
		],
		Component: DirectionMatrixScene,
	},
	{
		id: "evidence",
		label: ["When direction is unknown", "方向未知时"],
		title: ["A label needs usable evidence", "标签需要可用证据"],
		prompt: [
			"Change the reference evidence for a put execution. See when the mapping can proceed and when it must stop.",
			"切换一笔看跌成交的参考证据，观察何时可以映射方向、何时必须停止。",
		],
		Component: FlowEvidenceScene,
	},
	{
		id: "scope",
		label: ["Leg versus portfolio", "单腿与组合"],
		title: [
			"One put purchase, different position stories",
			"同一看跌买入，不同持仓含义",
		],
		prompt: [
			"Replay the same completed put purchase with different supplied position records. The flow label stays the same.",
			"结合不同给定持仓记录，回放同一已完成的看跌买入。成交流标签保持不变。",
		],
		Component: PositionScopeScene,
	},
] as const satisfies readonly ConceptScene[];
export function SentimentConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "flow-sentiment")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<SentimentData value={data}>
			<ConceptLab
				locale={locale}
				id="sentiment"
				label={["Interactive flow sentiment lesson", "成交流情绪互动课堂"]}
				scenes={scenes}
			/>
		</SentimentData>
	);
}
