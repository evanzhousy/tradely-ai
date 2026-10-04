import {
	alfaCloses,
	CONTRACT_FEE,
	oct100CallCloseQuote,
	oct100CallMonday,
	signedUsd,
	usd,
	yourAccount,
} from "@/content/world";

/** The numbers the P&L lesson teaches with, shared by its film and its playground. */

/** Your two Monday buys of the Oct 18 100 call, oldest first, in cents per share. */
export const lots = oct100CallMonday.trades
	.filter((trade) => trade.buyer === "you")
	.map((trade) => ({
		id: trade.id,
		time: trade.time,
		quantity: trade.quantity,
		price: trade.price,
	}));
export const HELD = lots.reduce((sum, lot) => sum + lot.quantity, 0);
export const PAID = lots.reduce(
	(sum, lot) => sum + lot.quantity * lot.price,
	0,
);
export const AVERAGE = PAID / HELD;
export const SOLD = 6;
export const SALE = oct100CallCloseQuote.bid;
export const MARK = (oct100CallCloseQuote.bid + oct100CallCloseQuote.ask) / 2;
/** Whole dollars when there are no cents: "$5,000", "+$318.75". */
export const places = (cents: number) =>
	Math.round(cents) % 100 === 0 ? 0 : 2;
export const dollars = (cents: number) => usd(Math.round(cents), places(cents));
export const signed = (cents: number) =>
	signedUsd(Math.round(cents), places(cents));
/** Per-share prices keep their cents; a mid can fall on a half cent. */
export const price = (cents: number) =>
	cents % 1 === 0 ? usd(cents) : `$${(cents / 100).toFixed(3)}`;
/** Average cost to three places: "$4.119". */
export const AVERAGE_TEXT = `$${(AVERAGE / 100).toFixed(3)}`;

export type Method = "fifo" | "average";

/** Realized and unrealized P&L in cents after selling `sold` contracts at `SALE`, marked at `MARK`. */
export function split(sold: number, method: Method) {
	if (method === "average") {
		return {
			realized: sold * (SALE - AVERAGE) * 100,
			unrealized: (HELD - sold) * (MARK - AVERAGE) * 100,
		};
	}
	let toSell = sold;
	let realized = 0;
	let unrealized = 0;
	for (const lot of lots) {
		const out = Math.min(toSell, lot.quantity);
		toSell -= out;
		realized += out * (SALE - lot.price) * 100;
		unrealized += (lot.quantity - out) * (MARK - lot.price) * 100;
	}
	return { realized, unrealized };
}

export const FRIDAY = Math.round(alfaCloses[alfaCloses.length - 1].close * 100);
export const CLOSE_SPOT = oct100CallCloseQuote.spot;
export const buyFees = HELD * CONTRACT_FEE;
export const cashAfterBuys = yourAccount.cashAtOpen - PAID * 100 - buyFees;
export const stockOpen = yourAccount.shares * FRIDAY;
export const stockClose = yourAccount.shares * CLOSE_SPOT;
export const callsClose = HELD * MARK * 100;
export const valueOpen = yourAccount.cashAtOpen + stockOpen;
export const valueClose = cashAfterBuys + stockClose + callsClose;
export const PNL = valueClose - valueOpen;
export const afterDeposit = valueClose + yourAccount.deposit;
export const cashAfterDeposit = cashAfterBuys + yourAccount.deposit;
export const buyingPower = cashAfterDeposit * yourAccount.marginMultiple;

export const benLot = oct100CallMonday.trades.find(
	(trade) => trade.seller === "ben",
);
export const BEN = benLot?.quantity ?? 0;
export const BEN_PRICE = benLot?.price ?? 0;
export const RECEIVED = BEN * BEN_PRICE * 100;
export const benAtExpiry = (spot: number) =>
	RECEIVED - BEN * Math.max(spot - 100, 0) * 100 * 100;
export const benMarked = RECEIVED - BEN * MARK * 100;
