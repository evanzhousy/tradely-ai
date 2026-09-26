import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	DrawdownScene,
	FlowReturnScene,
	PerformanceData,
	PerformanceEvidenceScene,
	TradePayoffScene,
} from "./performance-concept-scenes";
import { teachingSteps } from "./visual-step";

const scenes = [
	{
		id: "flows",
		label: ["Separate flows and returns", "区分资金流与收益"],
		title: [
			"Balance growth is not time-weighted return",
			"余额增长不是时间加权收益",
		],
		prompt: [
			"Hold the valuation checkpoints fixed and change the hypothetical external flow. Inspect both sides of the flow boundary.",
			"固定估值检查点，改变假设外部资金流，检查资金流边界两侧。",
		],
		steps: teachingSteps(
			[
				[
					"Separate the external cash flow before chaining the subperiod returns.",
					"先分离外部资金流，再连乘各子期间收益率。",
				],
			],
			[
				["Read valuation checkpoints", "读取估值检查点"],
				["Insert external flow", "加入外部资金流"],
				["Chain subperiod returns", "连乘子期间收益"],
			],
		),
		Component: FlowReturnScene,
	},
	{
		id: "payoffs",
		label: ["Inspect the payoff distribution", "检查盈亏分布"],
		title: ["Many wins can still lose money", "多次盈利仍可能亏钱"],
		prompt: [
			"Keep four $20 wins and vary the fifth close. Compare win rate, average outcomes, total P&L and profit factor.",
			"保留四次各 $20 盈利，改变第五次平仓，比较胜率、平均盈亏、总盈亏与盈利因子。",
		],
		steps: teachingSteps(
			[
				[
					"The number of wins and the size of losses describe different parts of performance.",
					"盈利次数与亏损大小，描述绩效的不同方面。",
				],
			],
			[
				["Read four wins", "读取四次盈利"],
				["Change the loss", "改变亏损幅度"],
				["Compare total performance", "比较整体表现"],
			],
		),
		Component: TradePayoffScene,
	},
	{
		id: "evidence",
		label: ["Check comparison evidence", "检查比较证据"],
		title: [
			"A comparison needs compatible methods and coverage",
			"比较需要兼容方法与覆盖",
		],
		prompt: [
			"Inspect benchmark assumptions and a separate realized-P&L attribution. Keep mismatched and missing evidence visible.",
			"检查基准假设与独立已实现盈亏归因，保留不匹配及缺失证据。",
		],
		steps: teachingSteps(
			[
				[
					"Compatible dates, methods and coverage are needed before comparing performance.",
					"比较表现前，需要相容的日期、方法与覆盖范围。",
				],
			],
			[
				["Inspect benchmark method", "检查基准方法"],
				["Check coverage match", "检查覆盖匹配"],
				["Bound the comparison", "限定比较范围"],
			],
		),
		Component: PerformanceEvidenceScene,
	},
	{
		id: "drawdown",
		label: ["Measure the worst fall", "衡量最大跌幅"],
		title: ["The same return can hide a deep fall", "相同收益可能掩盖深度下跌"],
		prompt: [
			"Keep the start and end fixed, then move the lowest month-end value. Compare the total return with the largest fall from the running peak.",
			"保持起点与终点不变，移动最低月末价值。比较总收益与相对历史高点的最大跌幅。",
		],
		steps: teachingSteps(
			[
				[
					"The account ends 10% higher. Along the way it fell from $12,000 to $10,800: a 10% drawdown from its peak.",
					"账户最终上涨 10%。途中从 $12,000 跌到 $10,800：相对高点回撤 10%。",
				],
				[
					"Same start and finish, deeper fall: $12,000 to $9,000 is a 25% maximum drawdown. The 10% total return did not change.",
					"起点和终点相同，跌幅更深：从 $12,000 跌到 $9,000，最大回撤为 25%。10% 的总收益没有变化。",
				],
				[
					"Measure from the running peak, not the start. A 30% fall needs a 43% gain just to get back to $12,000.",
					"回撤从历史高点计算，而不是从起点。下跌 30% 后需要上涨约 43% 才能回到 $12,000。",
				],
			],
			[
				["Read the path", "读取路径"],
				["Deepen the fall", "加深跌幅"],
				["Measure from the peak", "从高点计算"],
			],
		),
		Component: DrawdownScene,
	},
] as const satisfies readonly ConceptScene[];
export function PerformanceConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "portfolio-performance")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<PerformanceData value={data}>
			<ConceptLab
				locale={locale}
				id="performance"
				label={["Interactive portfolio performance lesson", "组合绩效互动课堂"]}
				scenes={scenes}
			/>
		</PerformanceData>
	);
}
