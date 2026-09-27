import {
	type Copy,
	type ExpiryId,
	NEXT_SESSION_DATE,
	PREVIOUS_SESSION_DATE,
	SESSION_DATE,
} from "./calendar";

/** Account holders who appear across walkthroughs. "You" is the learner. */
export type HolderId = "you" | "ben" | "cara" | "eli" | "others";
export const holders: Record<HolderId, { name: Copy }> = {
	you: { name: ["You", "你"] },
	ben: { name: ["Ben", "Ben"] },
	cara: { name: ["Cara", "Cara"] },
	eli: { name: ["Eli", "Eli"] },
	others: { name: ["Everyone else", "其他账户"] },
};

export type PositionEffect = "open" | "close";

export type Trade = {
	id: string;
	/** Session time, ET. */
	time: string;
	quantity: number;
	/** Cents per share. */
	price: number;
	buyer: HolderId;
	seller: HolderId;
	/** Known here only because this is a teaching ledger; public trade data never shows them. */
	buyerEffect: PositionEffect;
	sellerEffect: PositionEffect;
};

/**
 * The ALFA Oct 18 100 call on the teaching Monday. It opens the day with 100 contracts
 * outstanding and trades three times: one open/open, one transfer, one close/close.
 */
export const oct100CallMonday = {
	/** Signed positions before the open: long positive, short negative. */
	startPositions: {
		you: 0,
		ben: 0,
		cara: 20,
		eli: -30,
		others: 10,
	} satisfies Record<HolderId, number>,
	/** "Everyone else" holds 80 long and 70 short; shown gross so longs and shorts both total 100. */
	othersGross: { long: 80, short: 70 },
	startOpenInterest: 100,
	trades: [
		{
			id: "t1",
			time: "10:05",
			quantity: 10,
			price: 410,
			buyer: "you",
			seller: "ben",
			buyerEffect: "open",
			sellerEffect: "open",
		},
		{
			id: "t2",
			time: "11:42",
			quantity: 6,
			price: 415,
			buyer: "you",
			seller: "cara",
			buyerEffect: "open",
			sellerEffect: "close",
		},
		{
			id: "t3",
			time: "14:18",
			quantity: 4,
			price: 405,
			buyer: "eli",
			seller: "cara",
			buyerEffect: "close",
			sellerEffect: "close",
		},
	] satisfies Trade[],
	/** Reports are counts at a close, published before the next open. */
	reports: [
		{ asOf: PREVIOUS_SESSION_DATE, publishedOn: SESSION_DATE, value: 100 },
		{ asOf: SESSION_DATE, publishedOn: NEXT_SESSION_DATE, value: 106 },
	],
} as const;

/**
 * The Oct 18 100 call's consolidated book at 10:05, just before t1: Ben's 10 contracts rest at
 * the $4.10 ask, and your order to buy 10 arrives and takes them. Cents per share.
 */
export const oct100CallBookBeforeT1 = {
	time: "10:05",
	bids: [
		{ price: 400, size: 15 },
		{ price: 395, size: 20 },
		{ price: 390, size: 25 },
	],
	asks: [
		{ price: 410, size: 10, owner: "ben" as HolderId },
		{ price: 415, size: 12 },
		{ price: 420, size: 20 },
	],
} as const;

/** The consolidated quote in force just before each Monday trade. Cents per share. */
export const oct100CallQuoteAtTrade: Record<
	"t1" | "t2" | "t3",
	{ time: string; bid: number; ask: number }
> = {
	t1: { time: "10:05:00.0", bid: 400, ask: 410 },
	t2: { time: "11:42:00.3", bid: 410, ask: 420 },
	t3: { time: "14:18:00.1", bid: 405, ask: 415 },
};

/** Where a print sits against its quote, in the convention these lessons use. */
export type SideCode = "BBID" | "BID" | "MID" | "ASK" | "AASK";

/** Null when the quote has no usable spread: missing, locked (bid = ask) or crossed. */
export function sideCode(
	price: number,
	bid: number | null,
	ask: number | null,
): SideCode | null {
	if (bid === null || ask === null || ask <= bid) return null;
	if (price < bid) return "BBID";
	if (price === bid) return "BID";
	if (price < ask) return "MID";
	if (price === ask) return "ASK";
	return "AASK";
}

/** How one trade changes open interest: both open adds, both close removes, mixed transfers. */
export function openInterestChange(
	trade: Pick<Trade, "quantity" | "buyerEffect" | "sellerEffect">,
) {
	if (trade.buyerEffect === "open" && trade.sellerEffect === "open")
		return trade.quantity;
	if (trade.buyerEffect === "close" && trade.sellerEffect === "close")
		return -trade.quantity;
	return 0;
}

/**
 * Open interest of ALFA 100 calls by expiry, counted at the close on two Mondays a week
 * apart. The Oct 18 series matches the Monday ledger above (106 at the Sep 16 close).
 */
export const weeklyCallOpenInterest: {
	date: string;
	values: Partial<Record<ExpiryId, number>>;
}[] = [
	{
		date: "2030-09-09",
		values: { sep20: 900, sep27: 300, oct4: 120, oct11: 500, oct18: 96 },
	},
	{
		date: SESSION_DATE,
		values: { sep20: 940, sep27: 310, oct4: 130, oct11: 520, oct18: 106 },
	},
];

/**
 * Monday's activity in four ALFA calls against two baselines: a typical (20-day average)
 * full-day volume and open interest at Friday's close. The Oct 18 100 call matches the
 * Monday ledger; the 105 and 110 calls carry the block, its spread leg and the sweep.
 */
export const mondayActivity = [
	{
		id: "oct18-100",
		label: ["Oct 18 100 call", "10月18日 100 看涨"] as Copy,
		volume: 20,
		typical: 25,
		openInterest: 100,
	},
	{
		id: "oct18-105",
		label: ["Oct 18 105 call", "10月18日 105 看涨"] as Copy,
		volume: 505,
		typical: 120,
		openInterest: 1200,
	},
	{
		id: "oct18-110",
		label: ["Oct 18 110 call", "10月18日 110 看涨"] as Copy,
		volume: 540,
		typical: 300,
		openInterest: 2500,
	},
	{
		id: "dec20-110",
		label: ["Dec 20 110 call", "12月20日 110 看涨"] as Copy,
		volume: 12,
		typical: 4,
		openInterest: 3,
	},
] as const;

/**
 * Share of a typical day's volume done by each time, in minutes after the 9:30 open.
 * Mornings and closes are busiest, so the curve is steepest at both ends.
 */
export const typicalVolumeProfile: readonly (readonly [number, number])[] = [
	[0, 0],
	[30, 0.12],
	[60, 0.2],
	[90, 0.3],
	[150, 0.45],
	[210, 0.55],
	[270, 0.65],
	[330, 0.78],
	[390, 1],
];
