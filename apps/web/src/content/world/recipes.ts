import {
	type Copy,
	daysToExpiry,
	type ExpiryId,
	NEXT_SESSION_DATE,
	SESSION_DATE,
} from "./calendar";
import { mondayActivity } from "./flow";

/**
 * The Level 5 world: TradingFlow recipes run against the course's market. A recipe is a saved
 * research packet that re-runs on a session; these are the rows its unusual-activity screen
 * reads for Monday and Tuesday.
 */

/** How TradingFlow groups its official recipes, by the kind of question they answer. */
export type RecipeKind = "lookup" | "screen" | "report";

export const recipeKinds: Record<RecipeKind, Copy> = {
	lookup: ["Quick lookup", "快速查询"],
	screen: ["Session screen", "时段筛选"],
	report: ["Multi-step report", "多步骤报告"],
};

/** A few of TradingFlow's official recipes, named as they appear in its Cookbooks. */
export const officialRecipes: readonly {
	id: string;
	title: string;
	kind: RecipeKind;
	question: Copy;
}[] = [
	{
		id: "ticker-snapshot",
		title: "Ticker Options Snapshot",
		kind: "lookup",
		question: [
			"Everything about one symbol's options today",
			"某个标的今天期权的全部概况",
		],
	},
	{
		id: "gamma-levels",
		title: "Gamma Levels",
		kind: "lookup",
		question: [
			"Where one symbol's modeled gamma is concentrated",
			"某个标的的模型 Gamma 集中在哪里",
		],
	},
	{
		id: "unusual-options-activity",
		title: "Unusual Options Activity Screener",
		kind: "screen",
		question: [
			"Which contracts traded far above their open interest",
			"哪些合约的成交远超其未平仓量",
		],
	},
	{
		id: "sweeps-vs-blocks",
		title: "Sweeps vs Blocks Today",
		kind: "screen",
		question: [
			"How the session's premium executed",
			"本时段的权利金是如何成交的",
		],
	},
	{
		id: "market-recap",
		title: "Daily Market Recap",
		kind: "report",
		question: [
			"What the whole session's flow looked like, step by step",
			"逐步看清整个时段的成交流",
		],
	},
	{
		id: "vol-surface",
		title: "Vol Surface",
		kind: "report",
		question: [
			"How implied volatility varies by strike and expiry",
			"隐含波动率如何随行权价与到期日变化",
		],
	},
];

/**
 * One contract in a session's unusual-activity screen: the session's volume against the open
 * interest standing before it, and against its own typical daily volume when it has history.
 */
export type ScreenContract = {
	id: string;
	symbol: string;
	right: "call" | "put";
	strike: number;
	expiry: ExpiryId;
	volume: number;
	openInterest: number;
	/** Average daily volume over prior sessions; null when there is too little history. */
	typical: number | null;
};

/** The thresholds a reader sets, with the screen's defaults. */
export type ScreenInputs = {
	minVolumeToOi: number;
	minRelativeVolume: number;
	minVolume: number;
	minOpenInterest: number;
	maxDte: number;
};

export const screenDefaults: ScreenInputs = {
	minVolumeToOi: 1,
	minRelativeVolume: 0,
	minVolume: 500,
	minOpenInterest: 200,
	maxDte: 60,
};

const alfa = (id: string) => {
	const row = mondayActivity.find((item) => item.id === id);
	if (!row) throw new Error(`Unknown ALFA contract ${id}`);
	return row;
};
const alfaCall = (
	id: string,
	expiry: ExpiryId,
	strike: number,
): ScreenContract => ({
	id: `alfa-${id}`,
	symbol: "ALFA",
	right: "call",
	strike,
	expiry,
	volume: alfa(id).volume,
	openInterest: alfa(id).openInterest,
	typical: alfa(id).typical,
});

/**
 * Monday's chain snapshot as the screen reads it. ALFA's calls are the Monday ledger's four;
 * none of them clears the default screen, while five peer contracts do. DUNE's 40 call is a
 * thin contract that only a lowered volume or open-interest floor lets in. Each name's rows
 * stay within its whole-symbol option volume in the Monday universe.
 */
export const mondayScreen: readonly ScreenContract[] = [
	{
		id: "crux-oct4-60p",
		symbol: "CRUX",
		right: "put",
		strike: 60,
		expiry: "oct4",
		volume: 2_400,
		openInterest: 900,
		typical: 400,
	},
	{
		id: "dune-sep27-30c",
		symbol: "DUNE",
		right: "call",
		strike: 30,
		expiry: "sep27",
		volume: 780,
		openInterest: 360,
		typical: 150,
	},
	{
		id: "brdx-oct11-25p",
		symbol: "BRDX",
		right: "put",
		strike: 25,
		expiry: "oct11",
		volume: 620,
		openInterest: 310,
		typical: 200,
	},
	{
		id: "brdx-oct18-28c",
		symbol: "BRDX",
		right: "call",
		strike: 28,
		expiry: "oct18",
		volume: 900,
		openInterest: 720,
		typical: null,
	},
	{
		id: "crux-nov15-70c",
		symbol: "CRUX",
		right: "call",
		strike: 70,
		expiry: "nov15",
		volume: 1_800,
		openInterest: 1_500,
		typical: 900,
	},
	{
		id: "dune-oct11-40c",
		symbol: "DUNE",
		right: "call",
		strike: 40,
		expiry: "oct11",
		volume: 30,
		openInterest: 5,
		typical: 2,
	},
	alfaCall("oct18-105", "oct18", 105),
	alfaCall("oct18-110", "oct18", 110),
	alfaCall("oct18-100", "oct18", 100),
	alfaCall("dec20-110", "dec20", 110),
];

/**
 * Tuesday's snapshot. Open interest has absorbed Monday's opening trades, so most of Monday's
 * contracts fall back below the screen; EMBR, absent on Monday, now passes.
 */
export const tuesdayScreen: readonly ScreenContract[] = [
	{
		id: "crux-oct4-60p",
		symbol: "CRUX",
		right: "put",
		strike: 60,
		expiry: "oct4",
		volume: 700,
		openInterest: 3_100,
		typical: 600,
	},
	{
		id: "dune-sep27-30c",
		symbol: "DUNE",
		right: "call",
		strike: 30,
		expiry: "sep27",
		volume: 1_300,
		openInterest: 1_050,
		typical: 250,
	},
	{
		id: "brdx-oct11-25p",
		symbol: "BRDX",
		right: "put",
		strike: 25,
		expiry: "oct11",
		volume: 150,
		openInterest: 650,
		typical: 210,
	},
	{
		id: "embr-oct4-80c",
		symbol: "EMBR",
		right: "call",
		strike: 80,
		expiry: "oct4",
		volume: 1_100,
		openInterest: 400,
		typical: 180,
	},
];

export const screenSessions = {
	monday: { date: SESSION_DATE, rows: mondayScreen },
	tuesday: { date: NEXT_SESSION_DATE, rows: tuesdayScreen },
} as const;

export const volumeToOi = (row: ScreenContract) =>
	row.volume / row.openInterest;
export const relativeVolume = (row: ScreenContract) =>
	row.typical ? row.volume / row.typical : null;
export const contractDte = (row: ScreenContract, on: string) =>
	daysToExpiry(row.expiry, on);

/** Why a contract misses the screen, or null when it passes. Same-day expiries never pass. */
export function screenMiss(
	row: ScreenContract,
	inputs: ScreenInputs,
	on: string,
): keyof ScreenInputs | null {
	const dte = contractDte(row, on);
	if (row.volume < inputs.minVolume) return "minVolume";
	if (row.openInterest < inputs.minOpenInterest) return "minOpenInterest";
	if (dte < 1 || dte > inputs.maxDte) return "maxDte";
	if (volumeToOi(row) < inputs.minVolumeToOi) return "minVolumeToOi";
	const relative = relativeVolume(row);
	// A contract without history keeps its place: rel vol can't be judged, not zero.
	if (relative !== null && relative < inputs.minRelativeVolume)
		return "minRelativeVolume";
	return null;
}

/** The contracts that pass, highest volume/OI first. */
export function runScreen(
	rows: readonly ScreenContract[],
	inputs: ScreenInputs,
	on: string,
) {
	return rows
		.filter((row) => screenMiss(row, inputs, on) === null)
		.sort((a, b) => volumeToOi(b) - volumeToOi(a));
}

/** "CRUX Oct 4 60 put", "CRUX 10月4日 60 看跌". */
export function screenContractLabel(row: ScreenContract): Copy {
	const [month, day] = expiryParts(row.expiry);
	return [
		`${row.symbol} ${month[0]} ${day} ${row.strike} ${row.right}`,
		`${row.symbol} ${month[1]}${day}日 ${row.strike} ${row.right === "call" ? "看涨" : "看跌"}`,
	];
}

const months: Record<string, Copy> = {
	sep: ["Sep", "9月"],
	oct: ["Oct", "10月"],
	nov: ["Nov", "11月"],
	dec: ["Dec", "12月"],
};
function expiryParts(expiry: ExpiryId): [Copy, string] {
	const match = /^([a-z]+)(\d+)$/.exec(expiry);
	if (!match) throw new Error(`Bad expiry ${expiry}`);
	return [months[match[1]], match[2]];
}
