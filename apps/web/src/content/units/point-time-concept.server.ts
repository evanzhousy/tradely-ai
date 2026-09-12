import "@tanstack/react-start/server-only";
import type {
	PointTimeConceptData,
	ScoreReport,
} from "@/domain/learning/point-time-concept";

const report: ScoreReport = {
	id: "complete",
	label: ["Comparable, covered baseline", "可比且覆盖完整的基准"],
	current: 20,
	mean: 10,
	deviation: 5,
	count: 100,
	below: 90,
	minimumCount: 30,
	comparable: true,
	complete: true,
};
export const pointTimeConceptData: PointTimeConceptData = {
	kind: "point-in-time-research",
	source: "KNOWLEDGE-R · synthetic time-aware research",
	date: "2030-09-13 · clocks start at 09:58:00 America/New_York",
	records: [
		{
			id: "early",
			key: "E0",
			version: 1,
			eventSeconds: 20,
			receivedSeconds: 30,
			contracts: 40,
		},
		{
			id: "late",
			key: "E1",
			version: 1,
			eventSeconds: 60,
			receivedSeconds: 240,
			contracts: 100,
		},
		{
			id: "correction",
			key: "E1",
			version: 2,
			eventSeconds: 60,
			receivedSeconds: 300,
			contracts: 70,
		},
		{
			id: "unknown",
			key: "E2",
			version: 1,
			eventSeconds: 90,
			receivedSeconds: null,
			contracts: 500,
		},
	],
	cutoffFrames: [120, 240, 300],
	decay: {
		initial: 80,
		halfLife: 60,
		rawContracts: 200,
		rawEvents: 4,
		frames: [0, 60, 120, 180],
	},
	reports: [
		report,
		{
			...report,
			id: "incomparable",
			label: ["Baseline not comparable", "基准不可比"],
			comparable: false,
		},
		{
			...report,
			id: "coverage",
			label: ["Required coverage missing", "必需覆盖缺失"],
			complete: false,
		},
		{
			...report,
			id: "small",
			label: ["Below this protocol's sample minimum", "低于本协议样本下限"],
			count: 5,
			below: 4,
		},
		{
			...report,
			id: "flat",
			label: ["Zero baseline deviation", "基准标准差为零"],
			deviation: 0,
			below: 100,
		},
	],
	evaluation: {
		threshold: 80,
		developmentPeriod: "2030-08-01 → 2030-08-31",
		heldoutPeriod: "2030-09-01 → 2030-09-10",
		development: [
			{ id: "D1", score: 40, returnPercent: -1 },
			{ id: "D2", score: 60, returnPercent: -1 },
			{ id: "D3", score: 80, returnPercent: 1 },
			{ id: "D4", score: 90, returnPercent: 2 },
		],
		heldout: [
			{ id: "H1", score: 70, returnPercent: 1 },
			{ id: "H2", score: 85, returnPercent: 2 },
		],
	},
};
