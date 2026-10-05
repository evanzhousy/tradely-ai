import { mondayUniverse } from "@/content/world";

export const FLOOR = 500;
export const volumeOf = (symbol: string) =>
	mondayUniverse.find((row) => row.symbol === symbol)?.optionVolume ?? 0;

/** Each stock's typical (20-day average) daily option volume. */
export const typical: Record<string, number> = {
	CRUX: 6_000,
	ALFA: 1_200,
	DUNE: 300,
	GLYN: 150,
};
export const PEERS = ["CRUX", "ALFA", "DUNE", "GLYN"] as const;
export type Peer = (typeof PEERS)[number];

export const ratio = (value: number) => `${value.toFixed(value < 1 ? 2 : 1)}×`;
export const byDesc = <T>(rows: readonly T[], score: (row: T) => number) =>
	[...rows].sort((a, b) => score(b) - score(a));

/** Monday's change in whole-symbol open interest, published Tuesday morning. */
export const oiChange: Record<string, number> = {
	ALFA: 380,
	DUNE: 150,
	CRUX: -900,
};

/** Tuesday's option volume: ALFA is unchanged, its peers are not. */
export const tuesday: Record<string, number> = {
	CRUX: 1_900,
	ALFA: 2_400,
	DUNE: 1_100,
};
export const MOVERS = ["CRUX", "ALFA", "DUNE"];
