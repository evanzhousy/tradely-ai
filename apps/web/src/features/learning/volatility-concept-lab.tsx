import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import { teachingSteps } from "./visual-step";
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
		steps: teachingSteps(
			[
				[
					"Changing the model's IV changes its option value. A fitted IV matches a supplied price under stated assumptions.",
					"改变模型 IV 会改变期权价值；拟合 IV 在给定假设下匹配给定价格。",
				],
			],
			[
				["Read model inputs", "读取模型输入"],
				["Try an IV", "试算 IV"],
				["Fit IV to price", "拟合 IV 到价格"],
			],
		),
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
		steps: teachingSteps(
			[
				[
					"Changing the measurement window changes the historical sample behind realized volatility.",
					"改变测量窗口，会改变已实现波动率背后的历史样本。",
				],
			],
			[
				["Read return sample", "读取收益样本"],
				["Change window or interval", "改变窗口或间隔"],
				["Recompute realized vol", "重算已实现波动率"],
			],
		),
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
		steps: teachingSteps(
			[
				[
					"Forward-implied and backward-realized measures retain their separate horizons.",
					"向前隐含与向后已实现指标，各自保留独立时间范围。",
				],
			],
			[
				["Read implied measure", "读取隐含指标"],
				["Read realized measure", "读取已实现指标"],
				["Compare matching definitions", "比较匹配定义"],
			],
		),
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
