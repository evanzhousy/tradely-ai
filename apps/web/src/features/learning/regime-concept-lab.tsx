import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	RegimeData,
	RegimeEvidenceScene,
	RegimeFlipScene,
	RegimeHedgeScene,
} from "./regime-concept-scenes";
import { teachingSteps } from "./visual-step";

const scenes = [
	{
		id: "hedge",
		label: ["Test the hedge response", "测试对冲响应"],
		title: ["A regime changes the conditional response", "状态改变条件性响应"],
		prompt: [
			"Move spot up or down for a stated portfolio. Compare option delta change, the offsetting hedge and gross sensitivity.",
			"让给定组合的现价上涨或下跌，比较期权 Delta 变化、抵消对冲及总敏感度。",
		],
		steps: teachingSteps(
			[
				[
					"The stated position determines the conditional hedge response, not a guaranteed market move.",
					"给定持仓决定有条件的对冲响应，并不保证市场走势。",
				],
			],
			[
				["Read stated portfolio", "读取给定组合"],
				["Move spot", "移动现价"],
				["Compute conditional hedge", "计算条件对冲"],
			],
		),
		Component: RegimeHedgeScene,
	},
	{
		id: "flip",
		label: ["Inspect a modeled flip", "检查模型转折"],
		title: [
			"Reprice across spot, not across strikes",
			"沿现价重定价，而非累加行权价",
		],
		prompt: [
			"Select a supplied spot sample. Change the assumed positions or expiry scope and inspect adjacent signs without bridging gaps.",
			"选择给定现价样本，改变假设持仓或到期范围，检查相邻符号且不跨越缺口。",
		],
		steps: teachingSteps(
			[
				[
					"Reprice the modeled positions across spot to inspect where aggregate gamma changes sign.",
					"沿现价重新定价模型持仓，查看汇总 Gamma 在哪里变号。",
				],
			],
			[
				["Select a spot sample", "选择现价样本"],
				["Reprice across spot", "沿现价重定价"],
				["Locate the sign change", "定位符号变化"],
			],
		),
		Component: RegimeFlipScene,
	},
	{
		id: "evidence",
		label: ["Open the evidence", "打开证据"],
		title: ["A hedge target is not a market outcome", "对冲目标不是市场结果"],
		prompt: [
			"Reveal the model packet, fill record and depth snapshot separately. Keep their clocks and meanings attached.",
			"分别展示模型资料、成交记录与深度快照，保留各自时点与含义。",
		],
		steps: teachingSteps(
			[
				[
					"Position assumptions, hedge demand and market outcomes need distinct supporting evidence.",
					"持仓假设、对冲需求与市场结果，需要各自的支持证据。",
				],
			],
			[
				["Read model packet", "读取模型资料"],
				["Add fill evidence", "加入成交证据"],
				["Separate market outcome", "区分市场结果"],
			],
		),
		Component: RegimeEvidenceScene,
	},
] as const satisfies readonly ConceptScene[];
export function RegimeConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "gamma-regimes")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<RegimeData value={data}>
			<ConceptLab
				locale={locale}
				id="regime"
				label={["Interactive gamma regime lesson", "Gamma 状态互动课堂"]}
				evidenceBoundary={[
					"Question: what conditional hedge response follows from the stated portfolio and model? Keep position assumptions, spot grid and expiry scope fixed. Reconsider before translating a modeled response into a market-outcome claim.",
					"问题：给定组合与模型意味着什么条件性对冲响应？固定持仓假设、现价格点与到期范围。在把模型响应解释成市场结果前必须重新审查证据。",
				]}
				scenes={scenes}
			/>
		</RegimeData>
	);
}
