import { mondayActivity } from "./flow";

const fridayCallOpenInterest = (strike: number) =>
	mondayActivity.find((row) => row.id === `oct18-${strike}`)?.openInterest;

/**
 * Open interest in ALFA's Oct 18 options at Friday's close, published before Monday's open.
 * The 100, 105 and 110 calls are the Monday activity figures; puts crowd the lower strikes.
 */
export const oct18OpenInterest: readonly {
	strike: number;
	call: number;
	put: number;
}[] = [
	{ strike: 90, call: 300, put: 3_200 },
	{ strike: 95, call: 800, put: 2_600 },
	{ strike: 100, call: fridayCallOpenInterest(100) ?? 0, put: 1_500 },
	{ strike: 105, call: fridayCallOpenInterest(105) ?? 0, put: 400 },
	{ strike: 110, call: fridayCallOpenInterest(110) ?? 0, put: 150 },
	{ strike: 115, call: 1_800, put: 50 },
	{ strike: 120, call: 900, put: 20 },
];

/**
 * Gamma exposure in dollars of delta per 1% move in the stock:
 * gamma × open interest × 100 shares × spot² × 1%, signed by an assumed dealer position.
 */
export function gammaExposure(
	gamma: number,
	openInterest: number,
	spotDollars: number,
	sign: 1 | -1,
) {
	return gamma * openInterest * 100 * spotDollars * spotDollars * 0.01 * sign;
}
