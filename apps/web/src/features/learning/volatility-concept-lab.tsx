import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	ImpliedVolatilityScene,
	RealizedVolatilityScene,
	VolatilityData,
	VolatilityHorizonsScene,
} from "./volatility-concept-scenes";

const scenes = [
	{
		id: "implied",
		label: ["Infer IV from price", "从价格反推 IV"],
		title: ["IV is a model input fitted to a price", "IV 是拟合价格的模型输入"],
		prompt: [
			"Try an IV, then fit the model to the selected price. Compare price sources and maturity assumptions.",
			"试算 IV，再拟合选定价格，比较价格来源与期限假设。",
		],
		Component: ImpliedVolatilityScene,
	},
	{
		id: "realized",
		label: ["Measure past returns", "测量历史收益"],
		title: [
			"Realized volatility depends on how you measure",
			"已实现波动率取决于测量方式",
		],
		prompt: [
			"Change the window, sampling interval and hypothetical final return. Keep the annualization convention visible.",
			"改变窗口、采样间隔与假设最后收益，保留年化约定。",
		],
		Component: RealizedVolatilityScene,
	},
	{
		id: "horizons",
		label: ["Compare the horizons", "比较时间范围"],
		title: [
			"Forward and backward estimates answer different questions",
			"向前与向后估计回答不同问题",
		],
		prompt: [
			"Inspect the source identities, dates and definitions before interpreting an IV–RV difference.",
			"解读 IV–RV 差值前，检查来源身份、日期与定义。",
		],
		Component: VolatilityHorizonsScene,
	},
] as const satisfies readonly ConceptScene[];
export function VolatilityConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "implied-realized-volatility")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<VolatilityData value={data}>
			<ConceptLab
				locale={locale}
				id="volatility"
				label={[
					"Interactive implied and realized volatility lesson",
					"隐含与已实现波动率互动课堂",
				]}
				scenes={scenes}
			/>
		</VolatilityData>
	);
}
