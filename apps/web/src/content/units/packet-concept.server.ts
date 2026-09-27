import "@tanstack/react-start/server-only";
import type { PacketTeachingRecord } from "@/domain/learning/packet-concept";
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
