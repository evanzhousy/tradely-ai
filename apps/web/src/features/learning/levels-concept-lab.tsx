import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	LevelsConcentrationScene,
	LevelsData,
	LevelsDistanceScene,
	LevelsPayoutScene,
} from "./levels-concept-scenes";
import { teachingSteps } from "./visual-step";

const scenes = [
	{
		id: "concentration",
		label: ["Choose the level rule", "选择位置规则"],
		title: [
			"The rule and scope choose the concentration",
			"规则与范围决定集中位置",
		],
		prompt: [
			"Switch between OI and supplied gamma magnitude, choose calls or puts, and change the expiry scope.",
			"切换 OI 与给定 Gamma 幅度，选择看涨或看跌，并改变到期范围。",
		],
		steps: teachingSteps([
			[
				"Changing the measure changes which strike is selected as a concentration.",
				"改变衡量指标，会改变被选为集中位置的行权价。",
			],
		]),
		Component: LevelsConcentrationScene,
	},
	{
		id: "payout",
		label: ["Explore payout minima", "探索支付最小值"],
		title: [
			"A payout minimum is not a settlement forecast",
			"支付最小值不是结算预测",
		],
		prompt: [
			"Move hypothetical settlement, separate call and put payouts, and inspect every tied minimum in the candidate set.",
			"移动假设结算价，区分看涨与看跌支付，并检查候选集合中的所有并列最小值。",
		],
		steps: teachingSteps([
			[
				"The lowest supplied payout is a model result, not a forecast of settlement.",
				"给定支付额的最低点是模型结果，不是结算价预测。",
			],
		]),
		Component: LevelsPayoutScene,
	},
	{
		id: "distance",
		label: ["Measure the distance", "测量距离"],
		title: [
			"One level, three different distance units",
			"同一位置，三种距离单位",
		],
		prompt: [
			"Change reference spot or ATR, then inspect missing ATR and corporate-action price-scale cases.",
			"改变参考现价或 ATR，再检查 ATR 缺失及公司行动价格尺度案例。",
		],
		steps: teachingSteps([
			[
				"The same reference level can be expressed in dollars, percent or ATR units.",
				"同一参考位置的距离，可用美元、百分比或 ATR 单位表达。",
			],
		]),
		Component: LevelsDistanceScene,
	},
] as const satisfies readonly ConceptScene[];
export function LevelsConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "structural-levels")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<LevelsData value={data}>
			<ConceptLab
				locale={locale}
				id="levels"
				label={["Interactive structural levels lesson", "结构位置互动课堂"]}
				scenes={scenes}
			/>
		</LevelsData>
	);
}
