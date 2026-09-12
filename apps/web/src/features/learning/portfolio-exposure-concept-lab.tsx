import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	ExposureCoverageScene,
	ExposureRiskScene,
	ExposureUnitsScene,
	PortfolioExposureContext,
} from "./portfolio-exposure-concept-scenes";

const scenes = [
	{
		id: "coverage",
		label: ["Build a covered subtotal", "构建已覆盖小计"],
		title: ["A hedge cannot fill a missing holding", "对冲不能补齐缺失持仓"],
		prompt: [
			"Combine same-underlying stock and signed option delta. Adjust stock, then reveal the missing put's supplied sensitivity.",
			"合并同一标的股票与带符号期权 Delta。调整股票，再查看缺失看跌期权的已提供敏感度。",
		],
		Component: ExposureCoverageScene,
	},
	{
		id: "risks",
		label: ["Stress local neutrality", "检验局部中性"],
		title: [
			"Zero delta leaves other sensitivities",
			"Delta 为零仍有其他敏感度",
		],
		prompt: [
			"Use only the declared stock-and-call subset. Change one small local assumption at a time and inspect each Taylor term.",
			"仅使用声明的股票与看涨期权子集。逐一改变小幅局部假设，检查各泰勒项。",
		],
		Component: ExposureRiskScene,
	},
	{
		id: "units",
		label: ["Align units and timestamps", "对齐单位与时间"],
		title: ["Comparable inputs come before totals", "先有可比较输入，再有合计"],
		prompt: [
			"Convert the same vega quote between scales. A stale timestamp or missing sensitivity cannot become a current zero.",
			"换算同一 Vega 报价的不同尺度。陈旧时间或缺失敏感度不能变成当前零值。",
		],
		Component: ExposureUnitsScene,
	},
] as const satisfies readonly ConceptScene[];
export function PortfolioExposureConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "portfolio-exposure")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<PortfolioExposureContext value={data}>
			<ConceptLab
				locale={locale}
				id="portfolio-exposure"
				label={["Interactive portfolio exposure lesson", "组合敞口互动课堂"]}
				scenes={scenes}
			/>
		</PortfolioExposureContext>
	);
}
