import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	GexCoverageScene,
	GexData,
	GexDistributionScene,
	GexFormulaScene,
} from "./gex-concept-scenes";

const scenes = [
	{
		id: "formula",
		label: ["Scale a contribution", "缩放一项贡献"],
		title: [
			"A sign assumption belongs in the formula",
			"符号假设属于公式的一部分",
		],
		prompt: [
			"Change OI, spot or the assumed position sign. Hold the other inputs fixed and inspect the stated units.",
			"改变 OI、现价或假设持仓符号，固定其他输入并检查声明单位。",
		],
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
				scenes={scenes}
			/>
		</GexData>
	);
}
