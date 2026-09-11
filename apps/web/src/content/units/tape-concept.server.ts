import "@tanstack/react-start/server-only";
import type {
	TapeConceptData,
	TapePrint,
} from "@/domain/learning/tape-concept";

const contract = "KAPPA 2030-07-19 $90 CALL";
const a: TapePrint = {
	id: "T-1101",
	contract,
	option: "CALL",
	unit: "USD/share",
	price: 200,
	quantity: 10,
	multiplier: 100,
	executionAt: "10:01:00.200 ET",
};
const b: TapePrint = {
	...a,
	id: "T-1102",
	price: 300,
	quantity: 30,
	executionAt: "10:01:00.100 ET",
};
export const tapeConceptData: TapeConceptData = {
	kind: "trade-records",
	date: "2030-06-03",
	window: "10:01:00–10:01:01 ET",
	contract,
	records: {
		A: a,
		B: b,
		C: {
			...a,
			id: "T-1103",
			contract: "KAPPA 2030-07-19 $90 PUT",
			option: "PUT",
			price: 250,
			quantity: 20,
		},
		U: { ...b, id: "U-1102", unit: "USD/point" },
	},
	groups: [
		{
			id: "both",
			label: ["A + B · compatible prints", "A + B · 可合并成交"],
			ids: ["A", "B"],
		},
		{ id: "a", label: ["A only", "仅 A"], ids: ["A"] },
		{ id: "b", label: ["B only", "仅 B"], ids: ["B"] },
		{
			id: "contract",
			label: ["A + C · different contract", "A + C · 合约不同"],
			ids: ["A", "C"],
		},
		{
			id: "unit",
			label: ["A + U · unit-mismatch example", "A + U · 单位不匹配示例"],
			ids: ["A", "U"],
		},
	],
	messages: [
		{
			id: "M1",
			kind: "new",
			print: a,
			executionAt: a.executionAt,
			receivedAt: "10:01:00.240 ET",
		},
		{
			id: "M2",
			kind: "new",
			print: b,
			executionAt: b.executionAt,
			receivedAt: "10:01:00.300 ET",
		},
		{
			id: "M3",
			kind: "duplicate",
			targetId: b.id,
			executionAt: b.executionAt,
			receivedAt: "10:01:00.330 ET",
		},
		{
			id: "M4",
			kind: "correct",
			targetId: b.id,
			replacement: { ...b, price: 280, quantity: 20 },
			executionAt: b.executionAt,
			receivedAt: "10:01:00.480 ET",
		},
		{
			id: "M5",
			kind: "cancel",
			targetId: a.id,
			executionAt: a.executionAt,
			receivedAt: "10:01:00.640 ET",
		},
	],
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
