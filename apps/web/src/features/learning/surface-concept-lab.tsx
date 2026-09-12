import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	SurfaceData,
	SurfaceInterpolationScene,
	SurfaceSlicesScene,
	SurfaceWingsScene,
} from "./surface-concept-scenes";

const scenes = [
	{
		id: "slices",
		label: ["Slice the grid", "切片网格"],
		title: ["A surface has more than one direction", "曲面不止一个方向"],
		prompt: [
			"Pick a cell in the SVG and compare its strike row or expiry column. Change the source to reveal coverage differences.",
			"在 SVG 中选择单元格，比较其行权价行或到期日列，再改变来源查看覆盖差异。",
		],
		Component: SurfaceSlicesScene,
	},
	{
		id: "wings",
		label: ["Compare the wings", "比较两翼"],
		title: [
			"State the wing convention before calculating",
			"计算前说明两翼约定",
		],
		prompt: [
			"Inspect the put, ATM and call references. Reverse the skew convention or remove an input and watch what remains calculable.",
			"检查看跌、ATM 与看涨参考，反转偏斜约定或移除输入，观察哪些量仍可计算。",
		],
		Component: SurfaceWingsScene,
	},
	{
		id: "interpolation",
		label: ["Inspect estimates", "检查估计"],
		title: [
			"Do not smooth away the missing evidence",
			"不要用平滑掩盖缺失证据",
		],
		prompt: [
			"Choose an interpolation rule explicitly, then move the target tenor. Compare supplied, estimated and unsupported values.",
			"明确选择插值规则，再移动目标期限，比较给定、估计与无支持数值。",
		],
		Component: SurfaceInterpolationScene,
	},
] as const satisfies readonly ConceptScene[];
export function SurfaceConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "volatility-surface")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<SurfaceData value={data}>
			<ConceptLab
				locale={locale}
				id="surface"
				label={["Interactive volatility surface lesson", "波动率曲面互动课堂"]}
				scenes={scenes}
			/>
		</SurfaceData>
	);
}
