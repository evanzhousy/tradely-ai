import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	CounterpartyScene,
	ExecutionData,
	LiquidityScene,
	OrderEvidenceScene,
} from "./execution-concept-scenes";
import { teachingSteps } from "./visual-step";

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
		steps: teachingSteps(
			[
				[
					"Start with the supplied resting buyers and sellers.",
					"从给定的挂单买方与卖方开始。",
				],
				[
					"The incoming order meets the opposite side of the book.",
					"主动订单与订单簿的对手方撮合。",
				],
				[
					"One execution reduces displayed size and adds the same quantity to the tape.",
					"一笔成交减少可见数量，同时增加相同数量的成交记录。",
				],
			],
			[
				["Resting book", "初始订单簿"],
				["Order arrives", "订单到达"],
				["Confirmed execution", "成交确认"],
			],
		),
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
		steps: teachingSteps(
			[
				[
					"The book shows the supplied quantities at each price.",
					"订单簿显示每个价位给定的数量。",
				],
				[
					"The incoming order specifies a quantity and a price limit, or accepts the displayed market prices.",
					"主动订单指定数量与限价，或接受可见市价。",
				],
				[
					"Match the best opposite-side price when it is eligible.",
					"在符合条件时，先匹配对手方最优价。",
				],
				[
					"Only reach the second level if the order still needs quantity and the price is permitted.",
					"只有还有剩余需求且价格允许，才继续到第二档。",
				],
				[
					"The last supplied level is the boundary of this displayed book.",
					"最后给定档位就是本例可见订单簿的边界。",
				],
				[
					"Filled plus unfilled equals requested quantity. Each fill is listed beside the book.",
					"已成交加未成交等于请求数量，每笔模拟成交都列在订单簿旁。",
				],
			],
			[
				["Resting book", "初始订单簿"],
				["Order arrives", "订单到达"],
				["First level", "第一档"],
				["Second level", "第二档"],
				["Third level", "第三档"],
				["Result", "结果"],
			],
		),
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
		steps: teachingSteps(
			[
				[
					"The print supplies execution price and size; its original instruction is unresolved.",
					"成交记录给出价格与数量，原始指令尚未确定。",
				],
				[
					"The first supplied order record identifies a limit order.",
					"第一份给定订单记录确认是限价单。",
				],
				[
					"The other supplied history produces the same print from a market order.",
					"另一份给定历史用市价单产生相同成交。",
				],
			],
			[
				["Print only", "仅成交"],
				["Order record A", "订单记录 A"],
				["Order record B", "订单记录 B"],
			],
		),
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
