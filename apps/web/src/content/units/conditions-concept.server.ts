import "@tanstack/react-start/server-only";
import type { ConditionsConceptData } from "@/domain/learning/conditions-concept";

/** Synthetic teaching records. Venue names, sizes and prices are illustrative. */
export const conditionsConceptData: ConditionsConceptData = {
	kind: "execution-conditions",
	contract: "KAPPA 2030-07-19 $90 CALL",
	multiplier: 100,
	venues: [
		{ id: "X", priceCents: 210, size: 20 },
		{ id: "Y", priceCents: 211, size: 15 },
		{ id: "Z", priceCents: 212, size: 30 },
	],
	block: { size: 1000, bidCents: 200, askCents: 210 },
	spread: {
		contracts: 10,
		netCents: 300,
		lower: { strike: 100, bidCents: 500, askCents: 520, printCents: 525 },
		upper: { strike: 110, bidCents: 190, askCents: 210, printCents: 225 },
	},
	conditionQuantity: 1000,
	conditions: [
		{
			id: "routing",
			label: ["Sweep / ISO context", "Sweep / ISO 语境"],
			meaning: [
				"A routing designation under the supplied definition. Vendor sweep labels and ISO instructions require their own definitions.",
				"给定定义下的路由标记。数据商 sweep 标签与 ISO 指令各自需要对应定义。",
			],
		},
		{
			id: "matching",
			label: ["Auction / cross context", "竞价 / 交叉语境"],
			meaning: [
				"A matching mechanism. It describes how this execution was arranged, not who ultimately owned the order.",
				"撮合机制。它描述成交如何安排，不识别订单最终归属。",
			],
		},
		{
			id: "venue",
			label: ["Electronic / floor context", "电子 / 场内语境"],
			meaning: [
				"An execution venue or method designation. Electronic and floor execution do not identify the participant's investor category.",
				"执行场所或方式标记。电子或场内执行不识别参与者的投资者类别。",
			],
		},
		{
			id: "linked",
			label: ["Complex / stock-linked context", "复杂 / 股票关联语境"],
			meaning: [
				"A leg or stock relationship is indicated. The flag alone does not reconstruct every leg, the complete strategy or the portfolio.",
				"提示单腿或股票关联。仅此标记无法还原所有策略腿、完整策略或组合。",
			],
		},
		{
			id: "size",
			label: ["Block / size context", "大宗 / 数量语境"],
			meaning: [
				"A size-related classification under this source's criteria. A large row does not prove institutional ownership or inside information.",
				"该来源标准下的数量分类。大额记录不证明机构归属或内幕信息。",
			],
		},
		{
			id: "unknown",
			label: ["Unmapped source flag", "未映射的来源标记"],
			meaning: null,
		},
	],
};
