import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	GammaData,
	GammaHedgeScene,
	GammaSensitivityScene,
	GammaTermsScene,
} from "./gamma-concept-scenes";
import { teachingSteps } from "./visual-step";

const scenes = [
	{
		id: "terms",
		label: ["Separate the calculations", "区分计算"],
		title: [
			"Changing delta and changing price are different",
			"Delta 变化与价格变化不同",
		],
		prompt: [
			"Move the underlying, then switch between next delta and the gamma price term. Keep each formula's units visible.",
			"移动标的，再切换新 Delta 与 Gamma 价格项，保留各公式单位。",
		],
		steps: teachingSteps(
			[
				[
					"Gamma changes delta and contributes a separate curvature term to the price approximation.",
					"Gamma 改变 Delta，并为价格近似提供独立的曲率项。",
				],
			],
			[
				["Read delta and gamma", "读取 Delta 与 Gamma"],
				["Move the underlying", "移动标的价格"],
				["Separate curvature term", "区分曲率项"],
			],
		),
		Component: GammaTermsScene,
	},
	{
		id: "hedge",
		label: ["Replay a hedge", "回放对冲"],
		title: [
			"Gamma changes the hedge for a stated position",
			"Gamma 改变给定持仓的对冲",
		],
		prompt: [
			"Replay the stock move and an assumed hedge fill. Compare long and short positions, or remove the position evidence.",
			"回放标的变动与假设对冲成交，比较多空持仓，或移除持仓证据。",
		],
		steps: teachingSteps(
			[
				[
					"Follow the hedge adjustment for the stated position as its delta changes.",
					"随着 Delta 变化，跟随给定持仓的对冲调整。",
				],
			],
			[
				["Read stated position", "读取给定持仓"],
				["Replay stock move", "回放股价变化"],
				["Compute hedge adjustment", "计算对冲调整"],
			],
		),
		Component: GammaHedgeScene,
	},
	{
		id: "sensitivity",
		label: ["Inspect sensitivity", "检查敏感度"],
		title: ["Check the contract before extrapolating", "外推前检查合约"],
		prompt: [
			"Select a supplied snapshot in the SVG. Compare expiry and moneyness, then test a larger move without capping the result.",
			"在 SVG 中选择给定快照，比较到期与价内外程度，再测试较大变动且不强制截断结果。",
		],
		steps: teachingSteps(
			[
				[
					"Contract and expiry context change sensitivity. A local estimate has a limited range.",
					"合约与到期背景改变敏感度，局部估计有适用范围。",
				],
			],
			[
				["Inspect contract context", "检查合约背景"],
				["Test a larger move", "测试更大变动"],
				["Check estimate limits", "检查估计边界"],
			],
		),
		Component: GammaSensitivityScene,
	},
] as const satisfies readonly ConceptScene[];
export function GammaConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "gamma")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<GammaData value={data}>
			<ConceptLab
				locale={locale}
				id="gamma"
				label={["Interactive gamma lesson", "Gamma 互动课堂"]}
				scenes={scenes}
			/>
		</GammaData>
	);
}
