import "@tanstack/react-start/server-only";
import type {
	ActivityRankRow,
	RankSymbolConceptData,
} from "@/domain/learning/rank-symbol-concept";

const activity: readonly ActivityRankRow[] = [
	{
		symbol: "A",
		volume: 1000,
		baseline: 2000,
		coverage: true,
		baselineComparable: true,
	},
	{
		symbol: "B",
		volume: 600,
		baseline: 200,
		coverage: true,
		baselineComparable: true,
	},
	{
		symbol: "C",
		volume: 50,
		baseline: 1,
		coverage: true,
		baselineComparable: true,
	},
	{
		symbol: "D",
		volume: 900,
		baseline: null,
		coverage: true,
		baselineComparable: false,
	},
	{
		symbol: "E",
		volume: null,
		baseline: 200,
		coverage: false,
		baselineComparable: true,
	},
	{
		symbol: "F",
		volume: 800,
		baseline: 100,
		coverage: true,
		baselineComparable: false,
	},
];
export const rankSymbolConceptData: RankSymbolConceptData = {
	kind: "rank-symbols",
	source: "RANK-SYMBOL-R · synthetic comparison snapshots",
	session: "2030-09-13 · comparable-session option volume",
	signedFrames: [
		[
			{ symbol: "A", value: 60 },
			{ symbol: "B", value: -100 },
			{ symbol: "C", value: 20 },
		],
		[
			{ symbol: "A", value: 60 },
			{ symbol: "B", value: -100 },
			{ symbol: "C", value: 80 },
		],
		[
			{ symbol: "A", value: 60 },
			{ symbol: "B", value: -100 },
			{ symbol: "C", value: 40 },
		],
	],
	activity,
	floorRange: [0, 1000],
	handoffs: [
		{
			id: "original",
			label: ["Original comparison", "原比较"],
			note: [
				"B is 3× its own comparable baseline; rank is descriptive.",
				"B 为自身可比基准的 3×，排名为描述量。",
			],
			rows: activity,
		},
		{
			id: "peer",
			label: ["Peer C corrected upward", "同组 C 更正上调"],
			note: [
				"C is corrected to 1,200 contracts with baseline 100; B's own inputs remain fixed.",
				"C 更正为 1,200 张、基准 100；B 自身输入不变。",
			],
			rows: activity.map((r) =>
				r.symbol === "C" ? { ...r, volume: 1200, baseline: 100 } : r,
			),
		},
		{
			id: "baseline",
			label: ["B baseline corrected", "B 基准更正"],
			note: [
				"B's comparable baseline is corrected from 200 to 2,000; raw B volume stays 600.",
				"B 可比基准从 200 更正为 2,000；B 原始量仍为 600。",
			],
			rows: activity.map((r) =>
				r.symbol === "B" ? { ...r, baseline: 2000 } : r,
			),
		},
		{
			id: "coverage",
			label: ["B coverage withdrawn", "B 覆盖撤回"],
			note: [
				"B's source coverage is incomplete; the old reported count does not certify its session total.",
				"B 来源覆盖不完整，旧报告张数不能认证其时段总量。",
			],
			rows: activity.map((r) =>
				r.symbol === "B" ? { ...r, coverage: false } : r,
			),
		},
	],
};
