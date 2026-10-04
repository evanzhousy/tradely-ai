import {
	type Contract,
	contractLabel,
	OCT_100_CALL,
	oct100CallMonday,
	oct100CallQuoteAtTrade,
	optionQuote,
	type SideCode,
	sideCode,
	type Trade,
	valueAtExpiry,
} from "@/content/world";

export type Right = "call" | "put";
export type Action = "buy" | "sell";
export type Flow = "bullish" | "bearish" | "neutral";

/** The feed convention: buying calls or selling puts reads bullish; the reverse, bearish. */
export const flowLabel = (right: Right, action: Action): Flow =>
	(right === "call") === (action === "buy") ? "bullish" : "bearish";

export type TradeId = "t1" | "t2" | "t3";
export const TRADES = oct100CallMonday.trades as readonly Trade[];
export const LABEL = contractLabel(OCT_100_CALL, false);

export function printFlow(trade: Trade): { side: SideCode | null; flow: Flow } {
	const quote = oct100CallQuoteAtTrade[trade.id as TradeId];
	const side = sideCode(trade.price, quote.bid, quote.ask);
	const flow: Flow =
		side === "ASK" || side === "AASK"
			? flowLabel("call", "buy")
			: side === "BID" || side === "BBID"
				? flowLabel("call", "sell")
				: "neutral";
	return { side, flow };
}

export type Context = "alone" | "stock" | "close";

export const PUT_95: Contract = { expiry: "oct18", strike: 95, right: "put" };
/** Cents per share, which equals dollars per contract. */
export const PUT_ASK = optionQuote(PUT_95).ask;
export const PUT_BID = optionQuote(PUT_95).bid;
export const STOCK_COST = 100;
export const RANGE = [80, 120] as const;

export const putValue = (spot: number) =>
	valueAtExpiry(PUT_95, Math.round(spot * 100));
export const stock = (spot: number) => (spot - STOCK_COST) * 100;
/** Shares bought at $100 plus the put: the most they can lose at expiry, in dollars. */
export const FLOOR = (PUT_95.strike - STOCK_COST) * 100 - PUT_ASK;
