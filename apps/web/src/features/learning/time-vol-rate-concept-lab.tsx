import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	GreekAttributionScene,
	GreekSignsScene,
	GreekUnitsScene,
	TimeVolRateData,
} from "./time-vol-rate-concept-scenes";
import { teachingSteps } from "./visual-step";

const scenes = [
	{
		id: "units",
		label: ["Read the units", "读取单位"],
		title: [
			"Days and percentage points are different inputs",
			"天数与百分点是不同输入",
		],
		prompt: [
			"Change one input and compare its stated unit with a relative percentage. Apply the supplied sensitivity once.",
			"改变一个输入，比较声明单位与相对百分比，只应用一次给定敏感度。",
		],
		steps: teachingSteps(
			[
				[
					"Each sensitivity pairs with its own input and unit before contributions can be compared.",
					"先让每项敏感度匹配自身输入与单位，再比较贡献。",
				],
			],
			[
				["Choose one sensitivity", "选择一项敏感度"],
				["Match input units", "匹配输入单位"],
				["Compute one contribution", "计算单项贡献"],
			],
		),
		Component: GreekUnitsScene,
	},
	{
		id: "signs",
		label: ["Scale the position", "缩放持仓"],
		title: ["Keep each sensitivity's sign and unit", "保留各敏感度符号与单位"],
		prompt: [
			"Compare the supplied call and put, reverse the position, and change quantity without adding unlike units.",
			"比较给定看涨与看跌期权，反转持仓并改变张数，不把不同单位直接相加。",
		],
		steps: teachingSteps(
			[
				[
					"Reversing the position reverses its signed sensitivity contribution.",
					"反转持仓方向，会反转其敏感度贡献的符号。",
				],
			],
			[
				["Read call and put sensitivities", "读取看涨看跌敏感度"],
				["Reverse position", "反转持仓方向"],
				["Scale signed exposure", "缩放带符号敞口"],
			],
		),
		Component: GreekSignsScene,
	},
	{
		id: "combined",
		label: ["Build the contributions", "累加贡献"],
		title: [
			"Separate contributions before reading the total",
			"读取合计前区分各项贡献",
		],
		prompt: [
			"Build the supplied shock set and inspect the signed dollar effects. A stock move alone is only one contribution.",
			"累加给定冲击，检查带符号美元影响。标的变动只是一项贡献。",
		],
		steps: teachingSteps(
			[
				[
					"Build the total from separate time, volatility and rate contributions.",
					"从时间、波动率与利率的独立贡献，构建总变化。",
				],
			],
			[
				["Starting value", "起始值"],
				["Spot / delta", "标的 / Delta"],
				["Add theta", "加入 Theta"],
				["Add vega", "加入 Vega"],
				["Add rho", "加入 Rho"],
			],
		),
		Component: GreekAttributionScene,
	},
] as const satisfies readonly ConceptScene[];
export function TimeVolRateConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "theta-vega-rho")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<TimeVolRateData value={data}>
			<ConceptLab
				locale={locale}
				id="time-vol-rate"
				label={[
					"Interactive time volatility and rates lesson",
					"时间波动率与利率互动课堂",
				]}
				scenes={scenes}
			/>
		</TimeVolRateData>
	);
}
