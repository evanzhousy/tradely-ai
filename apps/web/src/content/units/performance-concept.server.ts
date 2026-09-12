import "@tanstack/react-start/server-only";
import type {
	PerformanceConceptData,
	ReturnSpec,
} from "@/domain/learning/performance-concept";

const spec: ReturnSpec = {
	start: "2030-09-03",
	end: "2030-09-30",
	currency: "USD",
	fees: "net of declared costs",
	basis: "total return, income included",
};
export const performanceConceptData: PerformanceConceptData = {
	kind: "portfolio-performance",
	source: "PERFORMANCE-R · synthetic scoped performance record",
	flow: {
		startCents: 100000,
		beforeCents: 110000,
		endCents: 210000,
		defaultFlow: 90000,
		frames: [90000, 0, 150000, 90000],
		spec,
		flowAt: "2030-09-16 14:00 UTC · before/after external flow",
	},
	trades: [
		{ id: "T1", symbol: "A", pnlCents: 2000 },
		{ id: "T2", symbol: "A", pnlCents: 2000 },
		{ id: "T3", symbol: "A", pnlCents: 2000 },
		{ id: "T4", symbol: "A", pnlCents: 2000 },
		{ id: "T5", symbol: "B", pnlCents: -10000 },
	],
	lossFrames: [10000, 5000, 20000, 0],
	benchmarks: [
		{
			id: "matched",
			label: ["Matched synthetic benchmark", "匹配模拟基准"],
			spec,
			returnRate: 0.1,
		},
		{
			id: "dates",
			label: ["Different return dates", "收益日期不同"],
			spec: { ...spec, start: "2030-09-02" },
			returnRate: 0.1,
		},
		{
			id: "currency",
			label: ["EUR benchmark without conversion", "欧元基准，未换算"],
			spec: { ...spec, currency: "EUR" },
			returnRate: 0.1,
		},
		{
			id: "fees",
			label: ["Gross benchmark vs net portfolio", "毛基准对净组合"],
			spec: { ...spec, fees: "gross, costs excluded" },
			returnRate: 0.1,
		},
		{
			id: "price",
			label: ["Price-only benchmark", "仅价格收益基准"],
			spec: { ...spec, basis: "price return, income excluded" },
			returnRate: 0.1,
		},
		{
			id: "missing",
			label: ["Benchmark return unavailable", "基准收益不可用"],
			spec,
			returnRate: null,
		},
	],
	attribution: [
		{ symbol: "A", pnlCents: 8000 },
		{ symbol: "B", pnlCents: -10000 },
		{ symbol: "C", pnlCents: null },
	],
	completeAttribution: [
		{ symbol: "A", pnlCents: 8000 },
		{ symbol: "B", pnlCents: -10000 },
		{ symbol: "C", pnlCents: 5000 },
	],
};
