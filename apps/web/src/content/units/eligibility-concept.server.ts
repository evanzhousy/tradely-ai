import "@tanstack/react-start/server-only";
import type {
	EligibilityConceptData,
	EligibilityRow,
} from "@/domain/learning/eligibility-concept";

const session = "2030-09-13";
const rows: readonly EligibilityRow[] = [
	{
		symbol: "A",
		kind: "stock",
		session,
		coverage: "complete",
		volume: 800,
		badge: "ready",
	},
	{
		symbol: "B",
		kind: "etf",
		session,
		coverage: "complete",
		volume: 2000,
		badge: "ready",
	},
	{
		symbol: "C",
		kind: "stock",
		session: "2030-09-12",
		coverage: "complete",
		volume: 3000,
		badge: "ready",
	},
	{
		symbol: "D",
		kind: "stock",
		session,
		coverage: "missing",
		volume: null,
		badge: "ready",
	},
	{
		symbol: "E",
		kind: "stock",
		session,
		coverage: "complete",
		volume: 500,
		badge: "ready",
	},
	{
		symbol: "F",
		kind: "stock",
		session,
		coverage: "complete",
		volume: 200,
		badge: "ready",
	},
];
export const eligibilityConceptData: EligibilityConceptData = {
	kind: "symbol-universe",
	source: "UNIVERSE-R · synthetic source facts",
	session,
	rows,
	correctedRows: rows.map((r) =>
		r.symbol === "D" ? { ...r, coverage: "complete", volume: 1500 } : r,
	),
	minimumRange: [0, 1000],
	baselines: [
		{
			id: "typical",
			label: ["Typical option volume: 500", "典型期权成交量：500"],
			value: 500,
		},
		{
			id: "small",
			label: ["Typical option volume: 250", "典型期权成交量：250"],
			value: 250,
		},
		{
			id: "large",
			label: ["Typical option volume: 1,000", "典型期权成交量：1,000"],
			value: 1000,
		},
		{
			id: "missing",
			label: ["Baseline unavailable", "基准不可用"],
			value: null,
		},
		{ id: "zero", label: ["Baseline is zero", "基准为零"], value: 0 },
	],
	history: {
		date: session,
		currentDate: "2030-12-13",
		members: [
			{
				symbol: "A",
				historicalMember: true,
				currentMember: true,
				volume: 800,
				note: ["Member on both dates", "两个日期均为成员"],
			},
			{
				symbol: "E",
				historicalMember: true,
				currentMember: true,
				volume: 500,
				note: ["Member on both dates", "两个日期均为成员"],
			},
			{
				symbol: "OLD",
				historicalMember: true,
				currentMember: false,
				volume: 1200,
				note: ["Historical member; later removed", "历史成员；后来移除"],
			},
			{
				symbol: "NEW",
				historicalMember: false,
				currentMember: true,
				volume: null,
				note: [
					"Joined later; no supplied historical observation",
					"后来加入；无给定历史观测",
				],
			},
		],
	},
};
