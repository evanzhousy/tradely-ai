import "@tanstack/react-start/server-only";
import type { OiConceptData } from "@/domain/learning/oi-concept";
export const oiConceptData: OiConceptData = {
	kind: "session-flow-vs-structure",
	contract: "ZETA 2030-06-21 $80 CALL",
	sessionDate: "2030-06-03",
	initialReport: { value: 100, asOf: "2030-05-31" },
	nextReport: { value: 104, asOf: "2030-06-03", published: "2030-06-04" },
	defaultQuantity: 10,
	maxQuantity: 20,
	combinations: [
		{ buyer: "open", seller: "open" },
		{ buyer: "close", seller: "close" },
		{ buyer: "open", seller: "close" },
		{ buyer: "close", seller: "open" },
	],
	events: [
		{
			kind: "trade",
			time: "09:45 ET",
			quantity: 10,
			buyer: "open",
			seller: "open",
		},
		{
			kind: "trade",
			time: "10:30 ET",
			quantity: 4,
			buyer: "close",
			seller: "close",
		},
		{
			kind: "trade",
			time: "11:15 ET",
			quantity: 6,
			buyer: "open",
			seller: "close",
		},
		{ kind: "exercise", time: "15:30 ET", quantity: 2 },
	],
	cohortScope: "ZETA $85 CALL · three expiry series",
	reportDates: ["2030-06-03", "2030-06-10"],
	dteRange: [14, 30],
	series: [
		{ id: "A", expiry: "2030-06-21", dte: [18, 11], oi: [80, 80] },
		{ id: "B", expiry: "2030-06-28", dte: [25, 18], oi: [120, 120] },
		{ id: "C", expiry: "2030-07-05", dte: [32, 25], oi: [300, 300] },
	],
};
