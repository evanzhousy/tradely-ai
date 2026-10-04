import {
	ALFA,
	alfaStockBook,
	type Copy,
	count,
	instruments,
	type Level,
	sweep,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";

/** The book, trades and instruments the stocks lesson teaches with, shared by its film and its playground. */

/** "$5.00 billion" / "50.0 亿美元". */
export function companyValue(cents: number, locale: Locale) {
	const dollars = cents / 100;
	return locale === "zh"
		? `${(dollars / 1e8).toFixed(1)} 亿美元`
		: `$${(dollars / 1e9).toFixed(2)} billion`;
}

/** A market order of `quantity` against ALFA's book: the levels after it and what it filled. */
export function tradeAgainst(side: "buy" | "sell" | null, quantity: number) {
	const asks: Level[] = alfaStockBook.asks.map((level) => ({ ...level }));
	const bids: Level[] = alfaStockBook.bids.map((level) => ({ ...level }));
	if (!side)
		return { asks, bids, fills: [] as Level[], filled: 0, notional: 0 };
	const result = sweep(side === "buy" ? asks : bids, quantity);
	const after = (levels: Level[]) =>
		levels.map((level) => {
			const left = result.remaining.find((item) => item.price === level.price);
			return { ...level, size: left?.size ?? 0 };
		});
	return {
		asks: side === "buy" ? after(asks) : asks,
		bids: side === "sell" ? after(bids) : bids,
		fills: result.fills,
		filled: result.filled,
		notional: result.notional,
	};
}

export type Kind = "stock" | "etf" | "index";

export const kinds: Record<
	Kind,
	{
		name: string;
		kind: Copy;
		holds: Copy;
		buy: Copy;
		own: Copy;
		settle: Copy;
		quote: string;
	}
> = {
	stock: {
		name: ALFA.symbol,
		kind: ["Stock", "股票"],
		holds: ["1 company", "1 家公司"],
		buy: ["Yes", "可以"],
		own: ["Part of one company", "一家公司的一部分"],
		settle: ["Shares", "股票"],
		quote: usd(alfaStockBook.last),
	},
	etf: {
		name: instruments.etf.symbol,
		kind: ["ETF", "ETF"],
		holds: [
			`${instruments.etf.holds} stocks`,
			`${instruments.etf.holds} 只股票`,
		],
		buy: ["Yes", "可以"],
		own: ["Part of a fund", "一只基金的一部分"],
		settle: ["Fund shares", "基金份额"],
		quote: usd(instruments.etf.price),
	},
	index: {
		name: instruments.index.symbol,
		kind: ["Index", "指数"],
		holds: ["Nothing: a number", "无：只是一个数"],
		buy: ["No", "不可以"],
		own: ["Nothing: it is a measurement", "什么都没有：它是一个测量值"],
		settle: ["Cash", "现金"],
		quote: count(instruments.index.level),
	},
};
export const kindOrder: readonly Kind[] = ["stock", "etf", "index"];
