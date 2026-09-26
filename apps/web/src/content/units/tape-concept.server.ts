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
};
