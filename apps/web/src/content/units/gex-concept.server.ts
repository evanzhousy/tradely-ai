import "@tanstack/react-start/server-only";
import type {
	GexConceptData,
	GexSnapshot,
} from "@/domain/learning/gex-concept";

const strikes = [95, 100, 105];
const expiries = ["2030-09-20", "2030-10-18"];
const grid = (values: readonly (number | null)[]) =>
	expiries.flatMap((expiry, row) =>
		strikes.map((strike, col) => ({
			id: `${expiry}:${strike}`,
			strike,
			expiry,
			value: values[row * 3 + col],
			traded: col !== 1,
		})),
	);
const snapshots: readonly [GexSnapshot, ...GexSnapshot[]] = [
	{
		id: "a",
		label: ["Distribution A", "分布 A"],
		cells: grid([-40, -80, -30, 50, 120, 80]),
	},
	{
		id: "b",
		label: ["Distribution B · same net", "分布 B · 净值相同"],
		cells: grid([20, 30, 50, 0, 0, 0]),
	},
	{
		id: "gap",
		label: ["A · one missing contribution", "A · 缺一项贡献"],
		cells: grid([-40, -80, -30, 50, null, 80]),
	},
];
export const gexConceptData: GexConceptData = {
	kind: "gamma-exposure",
	symbol: "MU",
	asOf: "2030-09-13 · fixed chain snapshot",
	model: "GEX-MU-R · synthetic assumed-position model",
	units: [
		"USD delta exposure / +1% underlying move",
		"标的 +1% 变动的美元 Delta 敞口",
	],
	contract: { gamma: 0.02, oi: 1000, multiplier: 100, spot: 100, sign: 1 },
	oiFrames: [1000, 1500, 2000, 2500],
	oiRange: [0, 3000],
	spotRange: [50, 200],
	requiredIds: snapshots[0].cells.map((c) => c.id),
	strikes,
	expiries,
	snapshots,
};
