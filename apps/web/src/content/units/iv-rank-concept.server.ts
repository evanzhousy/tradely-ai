import "@tanstack/react-start/server-only";
import type {
	IvHistorySample,
	IvRankConceptData,
} from "@/domain/learning/iv-rank-concept";

const observations = [
	{ date: "2030-09-06", iv: 10 },
	{ date: "2030-09-09", iv: 20 },
	{ date: "2030-09-10", iv: 20 },
	{ date: "2030-09-11", iv: 30 },
	{ date: "2030-09-12", iv: 100 },
];
const current = {
	symbol: "KAPPA",
	reference: "ATM30 · midquote · model A",
	date: "2030-09-13",
	iv: 30,
};
const history = {
	symbol: current.symbol,
	reference: current.reference,
	start: observations[0].date,
	end: observations[4].date,
	expectedCount: 5,
	observations,
};
const complete: IvHistorySample = {
	id: "complete",
	label: ["Five complete observations", "五个完整观测"],
	current,
	history,
};
export const ivRankConceptData: IvRankConceptData = {
	kind: "iv-rank-percentile",
	experiment: {
		symbol: current.symbol,
		reference: current.reference,
		currentDate: current.date,
		current: current.iv,
		observations,
	},
	currentRange: [10, 100],
	outlierRange: [40, 120],
	outlierFrames: [40, 60, 80, 100, 120],
	samples: [
		complete,
		{
			...complete,
			id: "short",
			label: ["Latest three observations", "最近三个观测"],
			history: {
				...history,
				start: observations[2].date,
				expectedCount: 3,
				observations: observations.slice(-3),
			},
		},
		{
			...complete,
			id: "flat",
			label: ["Flat history · current above it", "历史不变 · 当前高于历史"],
			history: {
				...history,
				observations: observations.map((o) => ({ ...o, iv: 20 })),
			},
		},
		{
			...complete,
			id: "flat-tie",
			label: ["Flat history · current ties", "历史不变 · 当前相等"],
			current: { ...current, iv: 20 },
			history: {
				...history,
				observations: observations.map((o) => ({ ...o, iv: 20 })),
			},
		},
		{
			...complete,
			id: "missing",
			label: ["One observation missing", "一个观测缺失"],
			history: {
				...history,
				observations: observations.map((o, i) =>
					i === 2 ? { ...o, iv: null } : o,
				),
			},
		},
		{
			...complete,
			id: "reference",
			label: ["History uses a different IV reference", "历史使用不同 IV 参考"],
			history: { ...history, reference: "ATM60 · midquote · model A" },
		},
		{
			...complete,
			id: "coverage",
			label: ["Required coverage not declared", "未声明所需覆盖"],
			history: { ...history, expectedCount: null },
		},
		{
			...complete,
			id: "current-in-history",
			label: ["Current date mixed into history", "当前日期混入历史"],
			history: {
				...history,
				end: current.date,
				observations: observations.map((o, i) =>
					i === 4 ? { date: current.date, iv: current.iv } : o,
				),
			},
		},
	],
};
