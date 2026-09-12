import "@tanstack/react-start/server-only";
import type { ContractNeighborhood } from "@/domain/learning/contracts";
import type { NeighborhoodConceptData } from "@/domain/learning/neighborhood-concept";

const session = "2030-09-13";
const strikes = [95, 100, 105];
const days = [14, 30, 60];
function grid(
	id: string,
	values: readonly (number | null)[],
	prior = false,
	extra = false,
): ContractNeighborhood {
	return {
		id,
		symbol: "PI",
		spot: 103,
		asOf: { en: `${session} · synthetic close`, zh: `${session} · 模拟收盘` },
		scope: { minStrike: 95, maxStrike: 105, minDays: 14, maxDays: 60 },
		contracts: [
			...days.flatMap((days, row) =>
				strikes.map((strike, col) => ({
					id: `${days}:${strike}`,
					strike,
					days,
					volume: values[row * 3 + col],
					fresh: !(prior && row === 0 && col === 0),
				})),
			),
			...(extra
				? [{ id: "30:115", strike: 115, days: 30, volume: 20000, fresh: true }]
				: []),
		],
	};
}
const compact = [0, 0, 0, 0, 3000, 2500, 0, 2500, 0];
const broad = [500, 750, 500, 750, 3000, 750, 500, 750, 500];
const shapes = [
	{
		id: "compact",
		label: ["Compact layout", "集中布局"] as const,
		data: grid("compact", compact),
	},
	{
		id: "broad",
		label: ["Broad layout", "广泛布局"] as const,
		data: grid("broad", broad),
	},
	{
		id: "missing",
		label: ["Broad · one missing cell", "广泛 · 缺一格"] as const,
		data: grid("missing", [500, 750, 500, 750, 3000, 750, 500, 750, null]),
	},
	{
		id: "prior",
		label: ["Broad · prior-session large print", "广泛 · 前日大成交"] as const,
		data: grid("prior", [12000, 750, 500, 750, 3000, 750, 500, 750, 500], true),
	},
	{
		id: "outside",
		label: ["Broad · large outside-scope row", "广泛 · 范围外大值"] as const,
		data: grid("outside", broad, false, true),
	},
];
export const neighborhoodConceptData: NeighborhoodConceptData = {
	kind: "rank-contracts",
	source: "NEIGHBORHOOD-PI-R · synthetic fixed call scope",
	session,
	optionType: "call",
	requiredIds: shapes[0].data.contracts.map((c) => c.id),
	strikes,
	days,
	spotRange: [90, 110],
	snapshots: shapes.map((s) => ({
		...s,
		sessions: Object.fromEntries(
			s.data.contracts.map((c) => [c.id, c.fresh ? session : "2030-09-12"]),
		),
	})),
};
