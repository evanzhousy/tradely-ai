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
export function contractLabel({ expiry, strike, right }: Contract): Copy {
	const date = expiries[expiry].label;
	return [
		`${ALFA.symbol} ${date[0]} ${strike} ${right}`,
		`${ALFA.symbol} ${date[1]} ${strike} ${right === "call" ? "看涨" : "看跌"}`,
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
