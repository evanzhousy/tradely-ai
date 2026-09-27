/**
 * The teaching pricing model: Black-Scholes with no interest or dividends, prices per share.
 * Walkthroughs label anything computed here as modeled, never as an observed market price.
 */

/** Standard normal CDF (Abramowitz-Stegun erf approximation, error below 1.5e-7). */
export function normalCdf(x: number) {
	const z = Math.abs(x) / Math.SQRT2;
	const t = 1 / (1 + 0.3275911 * z);
	const erf =
		1 -
		((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
			t +
			0.254829592) *
			t *
			Math.exp(-z * z);
	return x >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

/** Standard normal density. */
export function normalPdf(x: number) {
	return Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI);
}

export type Right = "call" | "put";

export type ModelInput = {
	spot: number;
	strike: number;
	days: number;
	/** Annualized implied volatility as a fraction, 0.3 for 30%. */
	iv: number;
	right: Right;
};

export type ModelOutput = {
	/** Dollars per share. */
	price: number;
	intrinsic: number;
	delta: number;
	/** Delta change per $1 move in the stock. */
	gamma: number;
	/** Price change per calendar day, dollars per share. */
	theta: number;
	/** Price change per 1 percentage point of IV, dollars per share. */
	vega: number;
};

export function priceOption({
	spot,
	strike,
	days,
	iv,
	right,
}: ModelInput): ModelOutput {
	const intrinsic = Math.max(
		right === "call" ? spot - strike : strike - spot,
		0,
	);
	if (days <= 0 || iv <= 0)
		return {
			price: intrinsic,
			intrinsic,
			delta:
				right === "call" ? (spot > strike ? 1 : 0) : spot < strike ? -1 : 0,
			gamma: 0,
			theta: 0,
			vega: 0,
		};
	const years = days / 365;
	const sd = iv * Math.sqrt(years);
	const d1 = (Math.log(spot / strike) + (sd * sd) / 2) / sd;
	const d2 = d1 - sd;
	const call = spot * normalCdf(d1) - strike * normalCdf(d2);
	const price = right === "call" ? call : call - spot + strike;
	const density = normalPdf(d1);
	return {
		price,
		intrinsic,
		delta: right === "call" ? normalCdf(d1) : normalCdf(d1) - 1,
		gamma: density / (spot * sd),
		theta: -(spot * density * iv) / (2 * Math.sqrt(years)) / 365,
		vega: (spot * density * Math.sqrt(years)) / 100,
	};
}
