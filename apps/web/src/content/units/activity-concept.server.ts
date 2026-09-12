import "@tanstack/react-start/server-only";
import type {
	ActivityConceptData,
	WindowEvidence,
} from "@/domain/learning/activity-concept";

const contract = "LAMBDA 2030-08-16 $95 CALL";
const matched: WindowEvidence = {
	id: "session",
	label: ["Complete session / session baseline", "完整时段 / 时段基准"],
	volume: 200,
	baseline: 100,
	currentWindow: "session",
	baselineWindow: "session",
	currentScope: contract,
	baselineScope: contract,
	completeCoverage: true,
};
export const activityConceptData: ActivityConceptData = {
	kind: "unusual-activity",
	date: "2030-06-03",
	oiAsOf: "2030-05-31",
	benchmark: [
		"Mean of 20 prior comparable sessions, ending 2030-05-31",
		"截至 2030-05-31 的 20 个此前可比时段均值",
	],
	samples: [
		{ id: "A", contract, volume: 200, typical: 100, oi: 1000 },
		{
			id: "B",
			contract: "LAMBDA 2030-08-16 $100 CALL",
			volume: 10,
			typical: 10,
			oi: 1,
		},
	],
	denominatorMax: 1000,
	threshold: { initial: 2, min: 0.5, max: 5, step: 0.5 },
	windowLabels: {
		hour: ["09:30–10:30 ET · first hour", "09:30–10:30 ET · 首小时"],
		session: ["09:30–16:00 ET · declared session", "09:30–16:00 ET · 声明时段"],
	},
	windowMinutes: { hour: 60, session: 390 },
	windows: [
		matched,
		{
			...matched,
			id: "mismatch",
			label: ["First hour / full-session baseline", "首小时 / 完整时段基准"],
			volume: 60,
			currentWindow: "hour",
		},
		{
			...matched,
			id: "hour",
			label: ["First hour / same-hour baseline", "首小时 / 同小时基准"],
			volume: 60,
			baseline: 30,
			currentWindow: "hour",
			baselineWindow: "hour",
		},
		{
			...matched,
			id: "partial",
			label: ["Coverage incomplete", "覆盖不完整"],
			completeCoverage: false,
		},
		{
			...matched,
			id: "scope",
			label: ["Different-contract baseline", "不同合约基准"],
			baselineScope: "LAMBDA 2030-08-16 $100 CALL",
		},
		{
			...matched,
			id: "missing",
			label: ["Historical baseline missing", "历史基准缺失"],
			baseline: null,
		},
	],
};
