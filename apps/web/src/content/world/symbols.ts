import { NEXT_SESSION_DATE, SESSION_DATE } from "./calendar";

/**
 * One name's row in Rank Symbols for a session, with the fields a formula column can read:
 * option premium in whole dollars and the number of trades behind it.
 */
export type SymbolFlowRow = {
	symbol: string;
	totalPremium: number;
	callPremium: number;
	putPremium: number;
	trades: number;
};

/**
 * Five names' Monday rows. Each stays within its whole-symbol option volume in the Monday
 * universe: GLYN's 300 contracts went through in 3 trades, all calls, and ALFA's calls include
 * the Oct 18 packet's $165,520 over 9 trades, the 500-contract block among them.
 */
export const mondaySymbolFlow: readonly SymbolFlowRow[] = [
	{
		symbol: "CRUX",
		totalPremium: 1_180_000,
		callPremium: 560_000,
		putPremium: 620_000,
		trades: 412,
	},
	{
		symbol: "ALFA",
		totalPremium: 310_000,
		callPremium: 237_000,
		putPremium: 73_000,
		trades: 48,
	},
	{
		symbol: "BRDX",
		totalPremium: 248_000,
		callPremium: 121_000,
		putPremium: 127_000,
		trades: 236,
	},
	{
		symbol: "GLYN",
		totalPremium: 96_000,
		callPremium: 96_000,
		putPremium: 0,
		trades: 3,
	},
	{
		symbol: "DUNE",
		totalPremium: 74_000,
		callPremium: 71_000,
		putPremium: 3_000,
		trades: 64,
	},
];

/** The same names on Tuesday: GLYN trades twice, and DUNE's Sep 27 30 call keeps it busy. */
export const tuesdaySymbolFlow: readonly SymbolFlowRow[] = [
	{
		symbol: "CRUX",
		totalPremium: 640_000,
		callPremium: 300_000,
		putPremium: 340_000,
		trades: 310,
	},
	{
		symbol: "ALFA",
		totalPremium: 92_000,
		callPremium: 70_000,
		putPremium: 22_000,
		trades: 41,
	},
	{
		symbol: "BRDX",
		totalPremium: 150_000,
		callPremium: 60_000,
		putPremium: 90_000,
		trades: 180,
	},
	{
		symbol: "GLYN",
		totalPremium: 12_000,
		callPremium: 12_000,
		putPremium: 0,
		trades: 2,
	},
	{
		symbol: "DUNE",
		totalPremium: 160_000,
		callPremium: 150_000,
		putPremium: 10_000,
		trades: 60,
	},
];

export const symbolFlowSessions = {
	monday: { date: SESSION_DATE, rows: mondaySymbolFlow },
	tuesday: { date: NEXT_SESSION_DATE, rows: tuesdaySymbolFlow },
} as const;
