import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	CohortComparisonScene,
	OiData,
	PositionEffectsScene,
	SessionOiScene,
} from "./oi-concept-scenes";
import { teachingSteps } from "./visual-step";

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
		steps: teachingSteps(
			[
				[
					"Both sides open: OI rises while the execution adds volume.",
					"双方开仓：OI 增加，成交也计入成交量。",
				],
				[
					"Both sides close: OI falls while the execution still adds volume.",
					"双方平仓：OI 减少，本笔成交仍增加成交量。",
				],
				[
					"The buyer opens and the seller closes: a position transfers, leaving OI unchanged.",
					"买方开仓、卖方平仓：持仓转移，OI 不变。",
				],
				[
					"The buyer closes and the seller opens: OI is unchanged, but volume still increases.",
					"买方平仓、卖方开仓：OI 不变，成交量仍增加。",
				],
			],
			[
				["Both sides open", "双方开仓"],
				["Both sides close", "双方平仓"],
				["Position transfers", "持仓转移"],
				["Volume still rises", "成交量仍增加"],
			],
		),
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
		steps: teachingSteps(
			[
				[
					"Start with the reported opening balance. It is a dated position count.",
					"从已报告的起始余额开始，它是带日期的持仓数量。",
				],
				[
					"Executions accumulate during the session. Position effects determine the separate OI ledger.",
					"日内成交持续累积，持仓效果决定另一份 OI 台账。",
				],
				[
					"Compare the final reported OI with session volume using their own dates and coverage.",
					"按各自日期与覆盖范围，比较期末报告 OI 和日内成交量。",
				],
			],
			[
				["Read opening OI", "读取开盘 OI"],
				["Replay session trades", "回放日内成交"],
				["Compare closing OI and volume", "比较收盘 OI 与成交量"],
			],
		),
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
		steps: teachingSteps(
			[
				[
					"A rolling label can contain different contracts on different days.",
					"同一个滚动标签，在不同日期可能包含不同合约。",
				],
				[
					"Separate membership changes from changes in the same contracts.",
					"把成员变化与同一合约的数据变化区分开。",
				],
				[
					"Compare a fixed cohort before interpreting the difference as position change.",
					"先比较固定合约集合，再解读其差值。",
				],
			],
			[
				["Read rolling bucket", "读取滚动分桶"],
				["Track membership changes", "追踪成员变化"],
				["Compare fixed cohort", "比较固定集合"],
			],
		),
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
