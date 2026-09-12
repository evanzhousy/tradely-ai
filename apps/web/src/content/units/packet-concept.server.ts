import "@tanstack/react-start/server-only";
import type {
	PacketConceptData,
	PacketTeachingRecord,
} from "@/domain/learning/packet-concept";
export const packetTeachingSource: PacketTeachingRecord = {
	id: "TEACH-P1",
	session: "2030-09-13",
	method: {
		cutoff: "16:00 America/New_York",
		universe: "TAU calls · 2030-10-18 expiry · strikes 100/105/110",
		source: "TAPE-PACKET-R",
		transformation:
			"sum every observed required row: contracts × price/share × multiplier",
		units: "USD premium; source prices are cents per share",
		missingPolicy: "retain missing required rows; withhold complete total",
	},
	rows: [
		{ id: "R1", contracts: 10, priceCents: 200, multiplier: 100 },
		{ id: "R2", contracts: 20, priceCents: 300, multiplier: 100 },
		{ id: "R3", contracts: null, priceCents: null, multiplier: 100 },
	],
};
export const packetConceptData: PacketConceptData = {
	kind: "cookbook-research-packet",
	source: "PACKET-TRACE-R · synthetic reproducibility example",
	requiredIds: ["R1", "R2", "R3"],
	original: packetTeachingSource,
	fields: [
		{
			id: "question",
			label: ["Question and universe", "问题与范围"],
			value: [
				"How much premium was observed in TAU October 18 calls at strikes 100/105/110?",
				"TAU 10 月 18 日到期、行权价 100/105/110 看涨观测到多少权利金？",
			],
		},
		{
			id: "time",
			label: ["Session and cutoff", "时段与截止"],
			value: [
				"2030-09-13 · through 16:00 America/New_York",
				"2030-09-13 · 至纽约时间 16:00",
			],
		},
		{
			id: "source",
			label: ["Source and row IDs", "来源与行 ID"],
			value: [
				"TEACH-P1 · TAPE-PACKET-R · used R1, R2; required R1, R2, R3",
				"TEACH-P1 · TAPE-PACKET-R · 使用 R1、R2；必需 R1、R2、R3",
			],
		},
		{
			id: "units",
			label: ["Units and multiplier", "单位与乘数"],
			value: [
				"Price/share in USD; contract counts; multiplier 100; output USD premium",
				"每股价格（美元）；合约张数；乘数 100；输出美元权利金",
			],
		},
		{
			id: "method",
			label: ["Transformation", "变换"],
			value: [
				"R1: 10×$2×100=$2,000; R2: 20×$3×100=$6,000; sum=$8,000",
				"R1：10×$2×100=$2,000；R2：20×$3×100=$6,000；和=$8,000",
			],
		},
		{
			id: "missing",
			label: ["Coverage and claim limit", "覆盖与结论限制"],
			value: [
				"R3 is missing. $8,000 is the observed subtotal; full-universe total is unavailable.",
				"R3 缺失。$8,000 是观测小计；完整范围总量不可用。",
			],
		},
	],
	reruns: [
		{
			id: "date",
			label: ["Allowed session-date rerun", "允许的日期重跑"],
			record: {
				...packetTeachingSource,
				id: "TEACH-P2",
				session: "2030-09-16",
				rows: [
					{ id: "R1", contracts: 12, priceCents: 200, multiplier: 100 },
					{ id: "R2", contracts: 15, priceCents: 300, multiplier: 100 },
					{ id: "R3", contracts: null, priceCents: null, multiplier: 100 },
				],
			},
			note: [
				"A new dated question instance under the same predefined method. Preserve P1 and its source rows.",
				"同一预定义方法下的新日期问题实例。保留 P1 及其来源行。",
			],
		},
		{
			id: "cutoff",
			label: ["Change the session cutoff", "改变时段截止"],
			record: {
				...packetTeachingSource,
				id: "PROPOSED",
				rows: [],
				method: {
					...packetTeachingSource.method,
					cutoff: "12:00 America/New_York",
				},
			},
			note: [
				"The closing-session method does not permit an intraday cutoff without an explicit revision and new evidence.",
				"收盘时段方法不允许未经明确修订与新证据就改为盘中截止。",
			],
		},
		{
			id: "puts",
			label: ["Replace calls with puts", "看涨改为看跌"],
			record: {
				...packetTeachingSource,
				id: "PROPOSED",
				rows: [],
				method: {
					...packetTeachingSource.method,
					universe: "TAU puts · 2030-10-18 expiry · strikes 100/105/110",
				},
			},
			note: [
				"The instrument-selection rule changed. The call rows cannot substantiate a put result.",
				"工具选择规则改变，看涨行不能支持看跌结果。",
			],
		},
		{
			id: "source",
			label: ["Replace the data source", "更换数据来源"],
			record: {
				...packetTeachingSource,
				id: "PROPOSED",
				rows: [],
				method: { ...packetTeachingSource.method, source: "TAPE-OTHER" },
			},
			note: [
				"A source change needs an explicit revised method and supporting records.",
				"更换来源需明确修订方法及支持记录。",
			],
		},
		{
			id: "exclude",
			label: ["Drop R2 after seeing it", "看完后丢弃 R2"],
			record: {
				...packetTeachingSource,
				id: "PROPOSED",
				rows: [],
				method: {
					...packetTeachingSource.method,
					transformation: "sum R1 only; exclude R2 after inspection",
				},
			},
			note: [
				"The summation rule changed after inspection. Do not overwrite the original calculation.",
				"检查后改变求和规则，不要覆盖原计算。",
			],
		},
	],
};
