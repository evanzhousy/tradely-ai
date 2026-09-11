/** Public teaching fixtures only. No authored assessment cases or answer keys. */
export const contractFields = [
	"underlying",
	"type",
	"strike",
	"expiry",
] as const;
export type ContractField = (typeof contractFields)[number];
export type ContractIdentity = Record<ContractField, string>;

export const teachingContract: ContractIdentity = {
	underlying: "ALFA",
	type: "CALL",
	strike: "$100",
	expiry: "2026-10-16",
};

export const teachingSnapshots = [
	{ time: "10:30 ET", price: "2.00" },
	{ time: "10:31 ET", price: "2.10" },
	{ time: "10:32 ET", price: "1.90" },
] as const;

export function contractDifferences(a: ContractIdentity, b: ContractIdentity) {
	return contractFields.filter((field) => a[field] !== b[field]);
}

// Premium conversion and physical deliverable are separate product terms.
export type TeachingTerms = {
	multiplier: number | null;
	deliverableShares: number | null;
	settlement: "physical" | "cash";
};
export const teachingProducts = {
	stock: {
		symbol: "ALFA",
		multiplier: 100,
		deliverableShares: 100,
		settlement: "physical",
	},
	etf: {
		symbol: "BASK",
		multiplier: 100,
		deliverableShares: 100,
		settlement: "physical",
	},
	index: {
		symbol: "IDX",
		multiplier: 100,
		deliverableShares: null,
		settlement: "cash",
	},
} as const;
export type TeachingProduct = keyof typeof teachingProducts;

export function contractAmounts(
	count: number,
	priceCents: number,
	terms: TeachingTerms,
) {
	return {
		premium:
			terms.multiplier === null
				? null
				: (count * priceCents * terms.multiplier) / 100,
		shares:
			terms.settlement === "cash" || terms.deliverableShares === null
				? null
				: count * terms.deliverableShares,
	};
}
