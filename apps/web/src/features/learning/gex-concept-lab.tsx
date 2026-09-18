import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	GexCoverageScene,
	GexData,
	GexDistributionScene,
	GexFormulaScene,
} from "./gex-concept-scenes";
import { teachingSteps } from "./visual-step";

const scenes = [
	{
		id: "formula",
		label: ["Declare the inputs", "声明输入"],
		title: [
			"Scope, clock and sign come before the total",
			"范围、时点与符号先于总量",
		],
		prompt: [
			"Read the snapshot date, chain context, gamma input, OI, units and assumed position sign. Then change one input while holding the others fixed.",
			"先读取快照日期、期权链背景、Gamma 输入、OI、单位与假设持仓符号，再固定其他输入只改变一项。",
		],
		steps: teachingSteps(
			[
				[
					"Build the contribution from the stated inputs, scale and assumed position sign.",
					"用给定输入、尺度及假设持仓符号构建贡献值。",
				],
			],
			[
				["Read snapshot scope", "读取快照范围"],
				["Check model sign and units", "检查模型符号与单位"],
				["Recompute contribution", "重新计算贡献"],
			],
		),
		Component: GexFormulaScene,
	},
	{
		id: "distribution",
		label: ["Inspect the distribution", "检查分布"],
		title: [
			"The same net can hide different structure",
			"相同净值可隐藏不同结构",
		],
		prompt: [
			"Select an SVG cell, inspect its expiry slice, then switch distributions. Compare net, gross and location separately.",
			"选择 SVG 单元格，检查其到期切片，再切换分布，分别比较净值、总幅度与位置。",
		],
		steps: teachingSteps(
			[
				[
					"Different strike distributions can share the same net exposure.",
					"不同的行权价分布，可以具有相同净敞口。",
				],
			],
			[
				["Inspect a strike cell", "检查行权价单元格"],
				["Switch distribution", "切换分布"],
				["Compare net and gross", "比较净值与总量"],
			],
		),
		Component: GexDistributionScene,
	},
	{
		id: "coverage",
		label: ["Check the whole chain", "检查完整链"],
		title: ["A subtotal is not a complete total", "小计不是完整总和"],
		prompt: [
			"Remove a contribution or keep only traded contracts. Explicit zero, missing data and excluded contracts have different meanings.",
			"移除一项贡献或仅保留有成交合约。明确的零、缺失数据与被排除合约含义不同。",
		],
		steps: teachingSteps(
			[
				[
					"A visible subtotal does not establish the complete chain total.",
					"可见小计不能确定完整期权链总量。",
				],
			],
			[
				["Read visible subtotal", "读取可见小计"],
				["Remove coverage", "减少覆盖"],
				["Mark total incomplete", "标记总量不完整"],
			],
		),
		Component: GexCoverageScene,
	},
] as const satisfies readonly ConceptScene[];
export function GexConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "gamma-exposure")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<GexData value={data}>
			<ConceptLab
				locale={locale}
				id="gex"
				label={["Interactive gamma exposure lesson", "Gamma 敞口互动课堂"]}
				evidenceBoundary={[
					"Question: what does this GEX snapshot say under this declared model? Keep the chain scope, as-of time, model inputs, units and inventory-sign assumption fixed. Reconsider if any input or coverage changes.",
					"问题：在声明模型下，这个 GEX 快照说明什么？固定期权链范围、时点、模型输入、单位与库存符号假设。任何输入或覆盖变化都应重新判断。",
				]}
				scenes={scenes}
			/>
		</GexData>
	);
}
