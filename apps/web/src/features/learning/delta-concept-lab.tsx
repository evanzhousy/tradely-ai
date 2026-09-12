import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	DeltaData,
	DeltaLimitsScene,
	DeltaPositionScene,
	DeltaSlopeScene,
} from "./delta-concept-scenes";

const scenes = [
	{
		id: "slope",
		label: ["Move the underlying", "移动标的"],
		title: ["Delta is a local price slope", "Delta 是局部价格斜率"],
		prompt: [
			"Move the stock price a little. Compare the supplied call and put without changing other inputs.",
			"小幅移动股票价格，在其他输入不变时比较给定看涨与看跌期权。",
		],
		Component: DeltaSlopeScene,
	},
	{
		id: "position",
		label: ["Build position exposure", "计算持仓敞口"],
		title: ["Keep the sign and multiplier attached", "保留符号与乘数"],
		prompt: [
			"Change long versus short, quantity and contract size. Follow the option's delta into position exposure and estimated dollar change.",
			"改变多空、张数与合约规模，追踪期权 Delta 如何形成持仓敞口与金额估计变化。",
		],
		Component: DeltaPositionScene,
	},
	{
		id: "limits",
		label: ["Test the limits", "检验局限"],
		title: ["One slope cannot describe every move", "一个斜率不能描述所有变动"],
		prompt: [
			"Replay a wider move on a declared teaching curve. Then change the assumptions to see which estimates are no longer supported.",
			"在声明的教学曲线上回放较大变动，再改变假设，观察哪些估计不再受支持。",
		],
		Component: DeltaLimitsScene,
	},
] as const satisfies readonly ConceptScene[];
export function DeltaConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "delta")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<DeltaData value={data}>
			<ConceptLab
				locale={locale}
				id="delta"
				label={["Interactive delta lesson", "Delta 互动课堂"]}
				scenes={scenes}
			/>
		</DeltaData>
	);
}
