import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	AggregateScene,
	ConditionScene,
	MessageReplayScene,
	TapeData,
} from "./tape-concept-scenes";

const scenes = [
	{
		id: "aggregate",
		label: ["Build the row", "建立聚合行"],
		title: ["One row can represent several executions", "一行可代表多笔成交"],
		prompt: [
			"Choose source prints. Check identity and units, then compare weighted price with a simple average.",
			"选择原始成交。先检查合约与单位，再比较数量加权价格和简单均价。",
		],
		demonstration: [
			[
				"Expand a row into its executions. Quantity-weighted price and total premium use different calculations.",
				"把汇总行展开为成交，数量加权价格与总权利金采用不同计算。",
			],
		],
		Component: AggregateScene,
	},
	{
		id: "messages",
		label: ["Replay the messages", "回放消息"],
		title: [
			"More messages do not always mean more trades",
			"更多消息不一定意味着更多成交",
		],
		prompt: [
			"Follow explicit execution IDs through a duplicate, correction and cancellation. Watch the current view change.",
			"根据明确成交标识追踪重复、更正和撤销，观察当前记录视图如何变化。",
		],
		demonstration: [
			[
				"A correction replaces its linked report; it is not another execution to add.",
				"更正替代关联的原报告，不是额外增加的一笔成交。",
			],
		],
		Component: MessageReplayScene,
	},
	{
		id: "conditions",
		label: ["Read the condition", "解读成交条件"],
		title: [
			"An execution label is not an investor identity",
			"执行标签不等于投资者身份",
		],
		prompt: [
			"Inspect a supplied condition definition, then test what it can establish about this large illustrative row.",
			"检查给定成交条件定义，再判断它能确定这条大额示例记录的哪些信息。",
		],
		demonstration: [
			[
				"An execution condition describes the record under its source convention, not the investor's identity.",
				"成交条件按来源约定描述记录，不揭示投资者身份。",
			],
		],
		Component: ConditionScene,
	},
] as const satisfies readonly ConceptScene[];
export function TapeConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "trade-records")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<TapeData value={data}>
			<ConceptLab
				locale={locale}
				id="tape"
				label={["Interactive tape record lesson", "成交记录互动课堂"]}
				scenes={[
					scenes[0],
					{
						...scenes[1],
						playbackStops: [
							["Before messages", "收到消息前"] as const,
							...data.messages.map(
								(message) =>
									[
										`${message.id} · ${message.kind}`,
										`${message.id} · ${message.kind === "new" ? "新增" : message.kind === "correct" ? "更正" : message.kind === "cancel" ? "撤销" : "重复"}`,
									] as const,
							),
						],
					},
					scenes[2],
				]}
			/>
		</TapeData>
	);
}
