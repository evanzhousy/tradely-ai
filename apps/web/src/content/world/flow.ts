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
