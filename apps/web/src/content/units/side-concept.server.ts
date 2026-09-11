import "@tanstack/react-start/server-only";
import type {
	SideConceptData,
	SideReference,
} from "@/domain/learning/side-concept";

const contract = "GAMMA 2030-08-16 $75 CALL";
const aligned: SideReference = {
	id: "matched",
	label: ["Matched quote", "匹配报价"],
	contract,
	bid: 400,
	ask: 420,
	at: "10:40:00.000 ET",
	secondsBeforePrint: 0.01,
	timing: "matched",
	condition: "regular",
};
export const sideConceptData: SideConceptData = {
	kind: "execution-side",
	contract,
	date: "2030-06-03",
	printAt: "10:40:00.010 ET",
	quantity: 20,
	bid: 400,
	ask: 420,
	defaultPrice: 407,
	priceRange: [390, 430],
	examples: [
		{ price: 395, code: "BBID" },
		{ price: 400, code: "BID" },
		{ price: 407, code: "MID" },
		{ price: 420, code: "ASK" },
		{ price: 425, code: "AASK" },
	],
	references: [
		aligned,
		{
			...aligned,
			id: "stale",
			label: ["Quote is 90 seconds older", "报价早了 90 秒"],
			at: "10:38:30.010 ET",
			secondsBeforePrint: 90,
			timing: "stale",
		},
		{
			...aligned,
			id: "missing",
			label: ["Quote missing", "报价缺失"],
			bid: null,
			ask: null,
			at: null,
			secondsBeforePrint: null,
		},
		{
			...aligned,
			id: "locked",
			label: ["Locked quote · bid = ask", "锁定报价 · 买价 = 卖价"],
			bid: 410,
			ask: 410,
		},
		{
			...aligned,
			id: "crossed",
			label: ["Crossed quote · bid > ask", "交叉报价 · 买价 > 卖价"],
			bid: 425,
			ask: 415,
		},
		{
			...aligned,
			id: "complex",
			label: ["Complex-order leg · review required", "复杂订单单腿 · 需审查"],
			condition: "complex",
		},
		{
			...aligned,
			id: "mismatch",
			label: ["Quote belongs to another contract", "报价属于另一张合约"],
			contract: "GAMMA 2030-08-16 $75 PUT",
		},
		{
			...aligned,
			id: "later",
			label: ["Quote arrives after this print", "报价晚于此笔成交"],
			at: "10:40:02.010 ET",
			secondsBeforePrint: -2,
			timing: "later",
		},
	],
};
