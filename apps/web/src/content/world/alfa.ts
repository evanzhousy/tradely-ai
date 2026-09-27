import {
	type Copy,
	daysToExpiry,
	type ExpiryId,
	expiries,
	SESSION_DATE,
} from "./calendar";
import { priceOption, type Right } from "./model";

/** ALFA is the course's one fictional stock. Prices are in cents. */
export const ALFA = {
	symbol: "ALFA",
	name: ["Alfa Robotics (fictional)", "Alfa Robotics（虚构）"] as Copy,
	/** Opening price on the teaching session. */
	open: 10_000,
	multiplier: 100,
} as const;

export type Contract = {
	expiry: ExpiryId;
	strike: number;
	right: Right;
};

/** "ALFA Oct 18 100 call" / "ALFA 10月18日 100 看涨". */
/** "ALFA Oct 18 100 call"; without the symbol where space is tight. */
export function contractLabel(
	{ expiry, strike, right }: Contract,
	withSymbol = true,
): Copy {
	const date = expiries[expiry].label;
	const symbol = withSymbol ? `${ALFA.symbol} ` : "";
	return [
		`${symbol}${date[0]} ${strike} ${right}`,
		`${symbol}${date[1]} ${strike} ${right === "call" ? "看涨" : "看跌"}`,
	];
}

/**
 * Model implied volatility for ALFA: a term structure with earnings before the October
 * expiry, plus a mild skew that makes lower strikes richer. Fractions, not percent.
 */
const atmVolatility: Record<ExpiryId, number> = {
	sep20: 0.33,
	sep27: 0.34,
	oct4: 0.35,
	oct11: 0.35,
	oct18: 0.35,
	nov15: 0.33,
	dec20: 0.31,
};
export function modelVolatility(expiry: ExpiryId, strike: number) {
	return atmVolatility[expiry] + 0.002 * (100 - strike);
}

/** Model value per share, in dollars, for a contract on a date and stock price. */
export function modelValue(
	contract: Contract,
	spotCents: number = ALFA.open,
	on: string = SESSION_DATE,
) {
	return priceOption({
		spot: spotCents / 100,
		strike: contract.strike,
		days: daysToExpiry(contract.expiry, on),
		iv: modelVolatility(contract.expiry, contract.strike),
		right: contract.right,
	});
}

/** The contract most walkthroughs follow. */
export const OCT_100_CALL: Contract = {
	expiry: "oct18",
	strike: 100,
	right: "call",
};

export const ALFA_SHARES_OUTSTANDING = 50_000_000;

/** ALFA's stock quote at 10:30 on the teaching Monday; sizes in shares. */
export const alfaStockBook = {
	time: "10:30",
	last: 10_002,
	bids: [
		{ price: 10_000, size: 400 },
		{ price: 9_998, size: 600 },
		{ price: 9_995, size: 1_000 },
	],
	asks: [
		{ price: 10_005, size: 300 },
		{ price: 10_006, size: 500 },
		{ price: 10_008, size: 800 },
	],
} as const;

/** The other instruments Level 0 compares with a single stock. */
export const instruments = {
	etf: {
		symbol: "BRDX",
		holds: 500,
		price: 5_000,
	},
	index: {
		symbol: "IDX 500",
		level: 5_000,
	},
} as const;

/** Quotes on the teaching Monday, in cents per share, around the model values. */
const optionQuotes: Record<string, { bid: number; ask: number }> = {
	"oct18-100-call": { bid: 405, ask: 420 },
	"oct18-100-put": { bid: 405, ask: 420 },
	"oct18-95-put": { bid: 205, ask: 215 },
	"oct18-105-call": { bid: 205, ask: 215 },
	"oct18-110-call": { bid: 85, ask: 93 },
	/** Thinly traded: few contracts rest on either side. */
	"dec20-110-call": { bid: 220, ask: 265 },
};

/**
 * The quote for any listed contract: an authored quote where lessons need exact numbers,
 * otherwise the model value with a spread of about 2% (at least 5 cents) on a 5-cent tick.
 */
export function optionQuote(contract: Contract) {
	const authored =
		optionQuotes[`${contract.expiry}-${contract.strike}-${contract.right}`];
	if (authored) return authored;
	const mid = modelValue(contract).price * 100;
	const half = Math.max(5, mid * 0.02);
	return {
		bid: Math.max(0, Math.floor((mid - half) / 5) * 5),
		ask: Math.max(5, Math.ceil((mid + half) / 5) * 5),
	};
}

/** Value at expiry per share, in cents, for a price at expiry in cents. */
export function valueAtExpiry(contract: Contract, spotCents: number) {
	const strike = contract.strike * 100;
	return Math.max(
		contract.right === "call" ? spotCents - strike : strike - spotCents,
		0,
	);
}
