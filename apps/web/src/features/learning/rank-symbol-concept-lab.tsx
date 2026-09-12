import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	RankActivityScene,
	RankHandoffScene,
	RankSignedScene,
	RankSymbolData,
} from "./rank-symbol-concept-scenes";

const scenes = [
	{
		id: "signed",
		label: ["Change the ordering", "改变排序"],
		title: ["A large negative value keeps its direction", "大的负值保留其方向"],
		prompt: [
			"Switch signed versus magnitude order, then replay peer changes while A stays fixed.",
			"切换有符号与幅度排序，再回放同组变化，保持 A 固定。",
		],
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
