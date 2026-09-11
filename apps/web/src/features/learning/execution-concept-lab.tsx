import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	CounterpartyScene,
	ExecutionData,
	LiquidityScene,
	OrderEvidenceScene,
} from "./execution-concept-scenes";

const scenes = [
	{
		id: "roles",
		label: ["One trade, two sides", "一笔成交，双方参与"],
		title: [
			"A buyer and a seller share one execution",
			"买方与卖方参与同一笔成交",
		],
		prompt: [
			"Switch the incoming side and play the match. Follow the roles, price and single trade count.",
			"切换主动到来的一方并播放撮合，追踪角色、价格与唯一的成交计数。",
		],
		Component: CounterpartyScene,
	},
	{
		id: "liquidity",
		label: ["Limits & liquidity", "限价与流动性"],
		title: ["A price limit cannot create liquidity", "限价不能创造流动性"],
		prompt: [
			"Move the limit and order size. See which displayed prices can fill, and what remains unfilled.",
			"移动限价与订单数量，观察哪些可见价位能够成交，以及还有多少未成交。",
		],
		Component: LiquidityScene,
	},
	{
		id: "evidence",
		label: ["What a print reveals", "成交记录揭示什么"],
		title: [
			"Same print. Different possible instructions.",
			"相同成交记录，不同可能指令。",
		],
		prompt: [
			"Make a judgment from the print, then inspect its order record. Try the other example and compare.",
			"先根据成交记录作出判断，再查看订单记录。切换另一个示例进行比较。",
		],
		Component: OrderEvidenceScene,
	},
] as const satisfies readonly ConceptScene[];

export function ExecutionConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "execution-counterparties")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<ExecutionData value={data}>
			<ConceptLab
				locale={locale}
				id="execution"
				label={[
					"Interactive execution counterparties lesson",
					"成交对手方互动课堂",
				]}
				scenes={scenes}
			/>
		</ExecutionData>
	);
}
