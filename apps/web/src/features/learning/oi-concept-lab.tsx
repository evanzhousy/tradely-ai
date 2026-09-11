import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	CohortComparisonScene,
	OiData,
	PositionEffectsScene,
	SessionOiScene,
} from "./oi-concept-scenes";

const scenes = [
	{
		id: "effects",
		label: ["Open, close, transfer", "开仓、平仓、转移"],
		title: [
			"Every trade adds volume. OI depends on both sides.",
			"每笔成交增加成交量，OI 取决于双方。",
		],
		prompt: [
			"Change the supplied buyer and seller flags. Watch which contracts are created, removed or transferred.",
			"改变给定买卖双方的开平仓标记，观察合约是新增、消除还是转移。",
		],
		Component: PositionEffectsScene,
	},
	{
		id: "session",
		label: ["Replay two ledgers", "回放两本台账"],
		title: [
			"Volume and reported OI have different clocks",
			"成交量与报告 OI 按不同时间更新",
		],
		prompt: [
			"Replay the executions and clearing activity. Keep a calculation separate from a published observation.",
			"回放成交与清算活动，区分计算结果与已发布观测。",
		],
		Component: SessionOiScene,
	},
	{
		id: "cohort",
		label: ["Compare the same set", "比较相同集合"],
		title: [
			"A familiar bucket label can hide new members",
			"相同分桶标签可能掩盖成员变化",
		],
		prompt: [
			"Move between report dates. Compare a fixed expiry set with a rolling DTE window.",
			"切换报告日期，比较固定到期集合与滚动 DTE 窗口。",
		],
		Component: CohortComparisonScene,
	},
] as const satisfies readonly ConceptScene[];
export function OiConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "session-flow-vs-structure")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<OiData value={data}>
			<ConceptLab
				locale={locale}
				id="oi"
				label={[
					"Interactive volume and open interest lesson",
					"成交量与未平仓量互动课堂",
				]}
				scenes={scenes}
			/>
		</OiData>
	);
}
