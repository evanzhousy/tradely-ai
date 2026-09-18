import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	RankActivityScene,
	RankHandoffScene,
	RankSignedScene,
	RankSymbolData,
} from "./rank-symbol-concept-scenes";
import { teachingSteps } from "./visual-step";

const scenes = [
	{
		id: "signed",
		label: ["Change the ordering", "改变排序"],
		title: ["A large negative value keeps its direction", "大的负值保留其方向"],
		prompt: [
			"Switch signed versus magnitude order, then replay peer changes while A stays fixed.",
			"切换有符号与幅度排序，再回放同组变化，保持 A 固定。",
		],
		steps: teachingSteps(
			[
				[
					"Sorting by magnitude keeps a negative value negative, even when it rises to first place.",
					"按幅度排序时，负值即使排到第一，也仍然为负。",
				],
			],
			[
				["Read signed values", "读取带符号数值"],
				["Switch sort rule", "切换排序规则"],
				["Keep direction attached", "保留方向信息"],
			],
		),
		Component: RankSignedScene,
	},
	{
		id: "activity",
		label: ["Choose the activity metric", "选择活动指标"],
		title: [
			"Raw size and relative activity choose different leaders",
			"原始规模与相对活动选出不同领先者",
		],
		prompt: [
			"Change the metric and volume floor. Inspect excluded rows before interpreting the observed ranking.",
			"改变指标与成交量门槛，在解读观测排名前检查排除行。",
		],
		steps: teachingSteps(
			[
				[
					"Raw size and relative activity can select different leaders from the same rows.",
					"同一组数据按原始大小与相对活动排序，可能选出不同第一名。",
				],
			],
			[
				["Read raw activity", "读取原始活动"],
				["Switch metric or floor", "切换指标或门槛"],
				["Compare leaders", "比较领先者"],
			],
		),
		Component: RankActivityScene,
	},
	{
		id: "handoff",
		label: ["Carry the candidate forward", "交接候选"],
		title: [
			"A rank needs context and a revision trigger",
			"排名需要上下文与修订条件",
		],
		prompt: [
			"Keep B as the inspected candidate. Compare peer, baseline and coverage revisions before deciding the next inspection.",
			"保持 B 为检查候选，在决定下一项检查前比较同组、基准与覆盖修订。",
		],
		steps: teachingSteps(
			[
				[
					"A useful candidate includes its metric, peers, coverage and reason to reconsider.",
					"有用的候选项需包含指标、同组对象、覆盖范围及重新考虑条件。",
				],
			],
			[
				["Inspect candidate B", "检查候选 B"],
				["Review revision triggers", "检查修订触发条件"],
				["Choose next inspection", "选择下一项检查"],
			],
		),
		Component: RankHandoffScene,
	},
] as const satisfies readonly ConceptScene[];
export function RankSymbolConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "rank-symbols")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<RankSymbolData value={data}>
			<ConceptLab
				locale={locale}
				id="rank-symbol"
				label={["Interactive symbol ranking lesson", "标的排名互动课堂"]}
				scenes={scenes}
			/>
		</RankSymbolData>
	);
}
