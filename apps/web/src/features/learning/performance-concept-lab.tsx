import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	FlowReturnScene,
	PerformanceData,
	PerformanceEvidenceScene,
	TradePayoffScene,
} from "./performance-concept-scenes";

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
		demonstration: [
			[
				"Separate the external cash flow before chaining the subperiod returns.",
				"先分离外部资金流，再连乘各子期间收益率。",
			],
		],
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
		demonstration: [
			[
				"The number of wins and the size of losses describe different parts of performance.",
				"盈利次数与亏损大小，描述绩效的不同方面。",
			],
		],
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
		demonstration: [
			[
				"Compatible dates, methods and coverage are needed before comparing performance.",
				"比较表现前，需要相容的日期、方法与覆盖范围。",
			],
		],
		Component: PerformanceEvidenceScene,
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
