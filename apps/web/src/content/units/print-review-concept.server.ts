import "@tanstack/react-start/server-only";
import type {
	PrintReviewConceptData,
	ReviewPacket,
} from "@/domain/learning/print-review-concept";

const contract = "EPSILON 2030-10-18 $65 CALL";
const aligned: ReviewPacket = {
	label: ["Matched quote added", "已加入匹配报价"],
	multiplier: 100,
	reference: {
		id: "matched",
		label: ["Matched quote", "匹配报价"],
		contract,
		bid: 200,
		ask: 205,
		at: "10:50:00.000 ET",
		secondsBeforePrint: 0.01,
		timing: "matched",
		condition: "regular",
	},
	opening: null,
	linked: false,
};
export const printReviewConceptData: PrintReviewConceptData = {
	kind: "validate-option-print",
	print: {
		id: "P-901",
		contract,
		date: "2030-06-03",
		at: "10:50:00.010 ET",
		price: 205,
		quantity: 500,
	},
	packets: {
		original: {
			...aligned,
			label: ["Original packet · stale quote", "原始资料 · 报价过时"],
			reference: {
				...aligned.reference,
				id: "stale",
				at: "10:48:30.010 ET",
				secondsBeforePrint: 90,
				timing: "stale",
			},
		},
		aligned,
		"missing-multiplier": {
			...aligned,
			label: ["Multiplier not supplied", "未提供乘数"],
			multiplier: null,
		},
		opening: {
			...aligned,
			label: ["Matched quote + opening record", "匹配报价 + 开仓记录"],
			opening: "open",
		},
		complex: {
			...aligned,
			label: ["Matched quote + complex-leg flag", "匹配报价 + 复杂单腿标记"],
			reference: { ...aligned.reference, condition: "complex" },
		},
		linked: {
			...aligned,
			label: ["Matched quote + linked-leg record", "匹配报价 + 关联单腿记录"],
			linked: true,
		},
	},
};
