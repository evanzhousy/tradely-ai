/** Public teaching math. All cash arithmetic uses integer cents, not assessment data. */
export type PayoffType = "CALL" | "PUT";
export const payoffTerms = {
	strikeCents: 10000,
	entrySpotCents: 10000,
	multiplier: 100,
} as const;

export function intrinsicCents(type: PayoffType, spotCents: number) {
	return Math.max(
		type === "CALL"
			? spotCents - payoffTerms.strikeCents
			: payoffTerms.strikeCents - spotCents,
		0,
	);
}

export function moneyness(type: PayoffType, spotCents: number) {
	if (spotCents === payoffTerms.strikeCents) return "ATM";
	return intrinsicCents(type, spotCents) > 0 ? "ITM" : "OTM";
}

export function premiumAmounts(paidCents: number, contracts: number) {
	return {
		perContract: paidCents * payoffTerms.multiplier,
		total: paidCents * payoffTerms.multiplier * contracts,
		notional: payoffTerms.entrySpotCents * payoffTerms.multiplier * contracts,
	};
}

export function expirationOutcome(
	type: PayoffType,
	spotCents: number,
	paidCents: number,
	contracts: number,
) {
	const intrinsic = intrinsicCents(type, spotCents);
	const payoff = intrinsic * payoffTerms.multiplier * contracts;
	const premium = premiumAmounts(paidCents, contracts).total;
	return {
		intrinsic,
		payoff,
		premium,
		profit: payoff - premium,
		breakEven:
			payoffTerms.strikeCents + (type === "CALL" ? paidCents : -paidCents),
		moneyness: moneyness(type, spotCents),
	};
}

/** Separate authored examples, not a quote model or a price path over time. */
export const premiumExamples = [
	{ spotCents: 9800, CALL: 150, PUT: 350 },
	{ spotCents: 10000, CALL: 300, PUT: 300 },
	{ spotCents: 10400, CALL: 550, PUT: 150 },
] as const;

export function valueParts(
	type: PayoffType,
	example: (typeof premiumExamples)[number],
	atExpiry: boolean,
) {
	const intrinsic = intrinsicCents(type, example.spotCents);
	const value = atExpiry ? intrinsic : example[type];
	return { intrinsic, extrinsic: value - intrinsic, value };
}

export const payoffChart = {
	x: (spotCents: number) => 40 + ((spotCents - 8500) / 3000) * 280,
	y: (centsPerShare: number) => 65 + ((1500 - centsPerShare) / 2100) * 190,
};
export function payoffPath(type: PayoffType, paidCents: number) {
	return [8500, payoffTerms.strikeCents, 11500]
		.map(
			(spot, i) =>
				`${i === 0 ? "M" : "L"}${payoffChart.x(spot).toFixed(2)} ${payoffChart.y(intrinsicCents(type, spot) - paidCents).toFixed(2)}`,
		)
		.join(" ");
}
