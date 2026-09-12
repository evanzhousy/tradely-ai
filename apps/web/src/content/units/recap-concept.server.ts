import "@tanstack/react-start/server-only";
import type { RecapConceptData } from "@/domain/learning/recap-concept";
import { packetTeachingSource } from "./packet-concept.server";
export const recapConceptData: RecapConceptData = {
	kind: "market-recap",
	source: "RECAP-TAU-R · synthetic source-linked composition",
	packet: packetTeachingSource,
	series: [
		{ id: "R1", strike: 100 },
		{ id: "R2", strike: 105 },
		{ id: "R3", strike: 110 },
	],
	axisFrames: [0, 5, 9, 0],
	captionFields: [
		{
			id: "source",
			label: ["Source and rows", "来源与行"],
			value: [
				"TEACH-P1 / TAPE-PACKET-R; R1 and R2 observed",
				"TEACH-P1 / TAPE-PACKET-R；R1 与 R2 有观测",
			],
		},
		{
			id: "date",
			label: ["Date and universe", "日期与范围"],
			value: [
				"2030-09-13 through 16:00 New York; TAU October 18 calls, strikes 100/105/110",
				"2030-09-13 至纽约 16:00；TAU 10 月 18 日看涨，行权价 100/105/110",
			],
		},
		{
			id: "units",
			label: ["Axes and units", "坐标与单位"],
			value: [
				"X: strike with source row ID; Y: observed contracts, zero baseline",
				"横轴：行权价及来源行 ID；纵轴：观测张数，从零起",
			],
		},
		{
			id: "coverage",
			label: ["Missingness boundary", "缺失边界"],
			value: [
				"R3 is missing, not zero; 30 is an observed subtotal, not the full-universe total",
				"R3 缺失，不是零；30 是观测小计，不是完整范围总量",
			],
		},
	],
};
