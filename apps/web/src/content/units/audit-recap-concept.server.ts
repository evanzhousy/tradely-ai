import "@tanstack/react-start/server-only";
import type { AuditRecapConceptData } from "@/domain/learning/audit-recap-concept";
import { packetTeachingSource } from "./packet-concept.server";
export const auditRecapConceptData: AuditRecapConceptData = {
	kind: "audit-market-recap",
	source: "AUDIT-TAU-R · fixed flawed-report exercise",
	packet: packetTeachingSource,
	requiredIds: ["R1", "R2", "R3"],
	reportedMultiplier: 1,
	checks: [
		{
			id: "identity",
			label: ["Identity", "身份"],
			reported: ["TAU call activity", "TAU 看涨活动"],
			source: ["TEACH-P1 identifies TAU calls", "TEACH-P1 标识为 TAU 看涨"],
			repair: ["Retain the TAU call identity", "保留 TAU 看涨身份"],
			initiallySupported: true,
		},
		{
			id: "time",
			label: ["Source date", "来源日期"],
			reported: ["The chart describes September 12", "图表描述 9 月 12 日"],
			source: [
				"TEACH-P1 is September 13 through 16:00 America/New_York",
				"TEACH-P1 为 9 月 13 日至纽约时间 16:00",
			],
			repair: [
				"Date the chart September 13 with the supplied cutoff",
				"将图表标为 9 月 13 日及给定截止",
			],
			initiallySupported: false,
		},
		{
			id: "scope",
			label: ["Expiry scope", "到期范围"],
			reported: [
				"All TAU call expiries are represented",
				"覆盖 TAU 所有看涨到期日",
			],
			source: [
				"Only October 18 expiry, strikes 100/105/110, is declared",
				"仅声明 10 月 18 日到期、行权价 100/105/110",
			],
			repair: [
				"Limit the claim to the declared October 18 set",
				"将结论限制在声明的 10 月 18 日集合",
			],
			initiallySupported: false,
		},
		{
			id: "scale",
			label: ["Chart scale", "图表尺度"],
			reported: [
				"R2 volume is 11× R1, based on cropped bar heights",
				"按截断柱高，R2 成交量为 R1 的 11×",
			],
			source: [
				"R1=10 and R2=20; the bar axis starts at 9",
				"R1=10、R2=20；柱轴从 9 起",
			],
			repair: [
				"Use a zero-based chart; the actual value ratio is 2×",
				"使用从零起的图表；实际数值比为 2×",
			],
			initiallySupported: false,
		},
		{
			id: "coverage",
			label: ["Coverage", "覆盖"],
			reported: [
				"R3 had zero activity; 30 is the full total",
				"R3 零活动；30 是完整总量",
			],
			source: [
				"R3 is missing; R1/R2 provide 30 observed contracts",
				"R3 缺失；R1/R2 提供 30 张观测成交",
			],
			repair: [
				"Show R3 as missing and 30 as an observed subtotal",
				"标明 R3 缺失、30 为观测小计",
			],
			initiallySupported: false,
		},
		{
			id: "inference",
			label: ["Position inference", "持仓推断"],
			reported: [
				"All 30 contracts opened new bullish positions",
				"全部 30 张均开立新增看涨持仓",
			],
			source: [
				"No opening/closing or participant/strategy linkage is supplied",
				"未提供开平仓或参与者/策略关联",
			],
			repair: [
				"Report observed executions; opening intent remains unknown",
				"报告观测执行；开仓意图仍未知",
			],
			initiallySupported: false,
		},
	],
	signoff: [
		{
			id: "supported",
			label: ["Supported and retained", "支持并保留"],
			text: [
				"R1 price/share is $2. R1/R2 support $8,000 observed premium in TEACH-P1.",
				"R1 每股价格为 $2。TEACH-P1 中 R1/R2 支持 $8,000 观测权利金。",
			],
		},
		{
			id: "repaired",
			label: ["Repairs applied", "已作修复"],
			text: [
				"Restore multiplier 100, correct date and expiry scope, use a zero-based chart, and replace position/zero-coverage claims.",
				"恢复乘数 100，修正日期与到期范围，使用零起点图表，并替换持仓及零覆盖结论。",
			],
		},
		{
			id: "unknown",
			label: ["Still unknown", "仍未知"],
			text: [
				"Full-universe totals, opening intent and common ownership remain unknown; R3 is still missing.",
				"完整范围总量、开仓意图及共同归属仍未知；R3 仍缺失。",
			],
		},
		{
			id: "reopen",
			label: ["Reopen conditions", "重审条件"],
			text: [
				"Recheck affected claims if R3 arrives, source values/dates/scope are corrected, or position/strategy evidence is supplied.",
				"R3 到达、来源数值/日期/范围更正或持仓/策略证据提供时，重查受影响结论。",
			],
		},
	],
};
