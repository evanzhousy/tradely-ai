import "@tanstack/react-start/server-only";
import type { MetricsComparison } from "@/domain/learning/metrics";
import type { LearningScenario } from "@/domain/learning/scenario";
import { copy, fact, question, step } from "./authoring.server";

function metrics(independent: boolean, alternate: boolean): MetricsComparison {
	return {
		id:
			"metric-lenses-" +
			(independent ? "transfer" : "guided") +
			(alternate ? "-b" : "-a"),
		symbol: independent ? "BETA" : "ALFA",
		sessionDate: "2026-09-03",
		modelDate: "2026-09-02",
		netDex: independent ? (alternate ? 40000 : -60000) : 50000,
		denominators: [1000000, 2000000, 0],
		modelNote: copy(
			"Authored synthetic GEX contributions, in USD of delta exposure per 1% underlying move. Signs are supplied model assumptions, not observed dealer positions. No pricing model or live repricing is implied.",
			"人工编写的模拟 GEX 贡献，单位为标的变动 1% 对应的美元 Delta 敞口。正负号为给定模型假设，并非已观察的做市商仓位；不代表定价模型或实时重估。",
		),
		distributions: [
			[-40, -80, -30, 50, 120, 80, 0, 0, 0],
			[10, 20, 10, 10, 20, 10, 0, 10, 10],
		].map((values, index) => ({
			id: `gex-${index}`,
			label: copy(
				index === 0 ? "Distribution A" : "Distribution B",
				index === 0 ? "分布 A" : "分布 B",
			),
			cells: [7, 30, 60].flatMap((days, row) =>
				[95, 100, 105].map((strike, column) => ({
					id: `gex-${strike}-${days}`,
					strike,
					days,
					value:
						independent && alternate && index === 1 && row === 2 && column === 2
							? null
							: values[row * 3 + column],
				})),
			),
		})),
	};
}

const normalization = (independent: boolean, alternate: boolean) =>
	question(
		"normalization",
		"With the observations fixed, what happens when the positive denominator doubles?",
		"观测保持不变时，正分母翻倍会怎样？",
		[
			[
				"half",
				"DEI magnitude halves; signed DEX and the dated GEX snapshot stay fixed.",
				"DEI 幅度减半；带符号 DEX 和带日期的 GEX 快照保持不变。",
			],
			["direction", "DEX reverses sign.", "DEX 符号反转。"],
			["gex", "GEX must double.", "GEX 必须翻倍。"],
		],
		"half",
		(independent
			? alternate
				? "4% becomes 2%"
				: "6% becomes 3%"
			: "5% becomes 2.5%") +
			": |net DEX| ÷ the positive effective denominator × 100. This lesson uses magnitude DEI; DEX carries direction. A missing or non-positive denominator gives unknown, not 0%.",
		(independent ? (alternate ? "4% 变为 2%" : "6% 变为 3%") : "5% 变为 2.5%") +
			"：|净 DEX| ÷ 正的有效分母 × 100。本课使用 DEI 幅度，由 DEX 保留方向。分母缺失或非正时结果为未知，不是 0%。",
	);

export const metricLensScenarios: LearningScenario[] = [false, true].map(
	(alternate) => ({
		id: alternate ? "metric-lenses-b" : "metric-lenses-a",
		lessonId: "dex-dei-gex",
		version: 1,
		steps: [
			step({
				id: "lenses-first",
				kind: "prediction",
				title: copy(
					"Three quantities, separate questions",
					"三个量，分别回答问题",
				),
				brief: copy(
					"ALFA has positive session DEX and a prior-close GEX model. Decide what can be compared before opening the lab.",
					"ALFA 的时段 DEX 为正，GEX 模型来自前收盘。打开实验前，先决定可以比较什么。",
				),
				facts: [
					fact(
						"Session DEX",
						"时段 DEX",
						"+50,000 share equivalents · 2026-09-03",
						"+50,000 股等价量 · 2026-09-03",
					),
					fact(
						"GEX model",
						"GEX 模型",
						"2026-09-02 · 7/30/60 days",
						"2026-09-02 · 7/30/60 天",
					),
				],
				questions: [
					question(
						"combined-claim",
						"Which statement respects both sources?",
						"哪句话尊重两个来源？",
						[
							[
								"separate",
								"Keep session flow and the model date separate; inspect each scope.",
								"区分时段成交与模型日期，分别检查范围。",
							],
							[
								"live",
								"Both are live observations of the same position.",
								"两者都是同一仓位的实时观测。",
							],
							[
								"forecast",
								"Positive DEX guarantees tomorrow's direction.",
								"正 DEX 保证明天的方向。",
							],
						],
						"separate",
						"The clocks differ. Agreement or disagreement cannot turn a modeled snapshot into live positions or a forecast.",
						"时间不同。指标一致或分歧都不能让模型快照变成实时仓位或预测。",
					),
				],
			}),
			step({
				id: "lenses-guided",
				kind: "guided",
				title: copy("Change one input at a time", "每次只改变一个输入"),
				brief: copy(
					"Double the denominator, try the unavailable denominator, then compare both GEX distributions and their 7-day slices. Their complete totals are both +100, but their local signs differ.",
					"将分母翻倍，尝试不可用分母，再比较两份 GEX 分布及其 7 天切片。完整总和均为 +100，但局部符号不同。",
				),
				metrics: metrics(false, false),
				questions: [normalization(false, false)],
			}),
			step({
				id: "lenses-independent",
				kind: "independent",
				title: copy("Explain a new combination", "解释新的组合"),
				brief: copy(
					"Inspect BETA's fixed session and model. Use the controls to test comparisons, then answer from the stated evidence.",
					"检查 BETA 固定的时段与模型。用控件检验比较，再依据给定证据回答。",
				),
				metrics: metrics(true, alternate),
				questions: [
					normalization(true, alternate),
					question(
						"aggregate",
						"What can you conclude about the two complete GEX totals?",
						"关于两份完整 GEX 总和，可以得出什么结论？",
						[
							[
								"equal",
								"They both total +100, but their expiry distributions differ.",
								"均为 +100，但到期分布不同。",
							],
							[
								"unknown",
								"Distribution B has a missing contribution; a complete-total comparison is unavailable.",
								"分布 B 缺少一项贡献，无法比较完整总和。",
							],
							[
								"identical",
								"Their positions and all local contributions are identical.",
								"其仓位和所有局部贡献完全相同。",
							],
						],
						alternate ? "unknown" : "equal",
						alternate
							? "Missing is not zero. A subtotal of known cells cannot certify equality of complete totals."
							: "Aggregation hides location and offsetting signs. The 7-day slice is negative in A and positive in B despite equal full totals.",
						alternate
							? "缺失不等于零。已知单元格的小计不能证明完整总和相等。"
							: "汇总会隐藏位置和正负抵消。虽然完整总和相等，A 的 7 天切片为负，B 为正。",
					),
					question(
						"horizon",
						"Does moving a view control update the GEX model date?",
						"调整显示控件会更新 GEX 模型日期吗？",
						[
							[
								"no",
								"No. It remains a September 2 model; September 3 flow has its own clock.",
								"不会。模型仍来自 9 月 2 日，9 月 3 日成交有自己的时间。",
							],
							[
								"yes",
								"Yes. An interactive chart is live positioning.",
								"会。交互图表代表实时仓位。",
							],
							[
								"trade",
								"The larger DEI tells us which trade to place.",
								"更大的 DEI 告诉我们该如何下单。",
							],
						],
						"no",
						"Changing a display or normalization input adds no new source evidence. Keep units, scope, and timestamps attached to every claim.",
						"改变显示或归一化输入不会增加来源证据。每条结论都应附带单位、范围和时间。",
					),
				],
			}),
		],
	}),
);
