import {
	type Copy,
	contractLabel,
	OCT_100_CALL,
	oct100CallMonday,
	oct100CallQuoteAtTrade,
	type Trade,
} from "@/content/world";

export type TradeId = "t1" | "t2" | "t3";
export const TRADES = oct100CallMonday.trades;
export const tradeById = (id: TradeId): Trade =>
	TRADES.find((trade) => trade.id === id) as Trade;
export const quoteAt = (id: TradeId) => oct100CallQuoteAtTrade[id];
export const LABEL = contractLabel(OCT_100_CALL, false);
/** The ruler's price range, in cents. */
export const RULER: readonly [number, number] = [395, 430];
/** A test price outside the 11:42 quote, in cents. */
export const OUTSIDE = 425;

/** The 11:42 print, measured against one reference quote or another. */
export const PRINT_TIME = "11:42:00.4";
export type RefId = "matched" | "stale" | "later" | "put" | "missing";
export const references: Record<
	RefId,
	{
		time: string | null;
		bid: number | null;
		ask: number | null;
		contract: Copy;
		problem: Copy | null;
	}
> = {
	matched: {
		time: oct100CallQuoteAtTrade.t2.time,
		bid: oct100CallQuoteAtTrade.t2.bid,
		ask: oct100CallQuoteAtTrade.t2.ask,
		contract: LABEL,
		problem: null,
	},
	stale: {
		time: "11:40:30.4",
		bid: 400,
		ask: 410,
		contract: LABEL,
		problem: ["90 seconds too old", "早了 90 秒"],
	},
	later: {
		time: "11:42:02.1",
		bid: 415,
		ask: 425,
		contract: LABEL,
		problem: ["arrived after the print", "晚于这笔成交"],
	},
	put: {
		time: oct100CallQuoteAtTrade.t2.time,
		bid: 405,
		ask: 420,
		contract: ["Oct 18 100 put", "10月18日 100 看跌"],
		problem: ["quote for another contract", "另一张合约的报价"],
	},
	missing: {
		time: null,
		bid: null,
		ask: null,
		contract: LABEL,
		problem: ["no quote recorded", "没有记录报价"],
	},
};
