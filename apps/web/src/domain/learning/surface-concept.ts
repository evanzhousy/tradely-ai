type Copy = readonly [string, string];
export type WingReference = {
	iv: number | null;
	expiry: string;
	convention: string;
	source: string;
};
export type WingExample = {
	id: string;
	label: Copy;
	put: WingReference;
	call: WingReference;
	atm: WingReference;
};
export type SurfaceAnchor = { days: number; iv: number | null };
export type SurfaceConceptData = {
	kind: "volatility-surface";
	symbol: string;
	modelLabel: Copy;
	asOf: string;
	spot: number;
	strikes: readonly [number, number, number];
	expiries: readonly [
		{ date: string; days: number },
		{ date: string; days: number },
		{ date: string; days: number },
	];
	datasets: readonly [
		{
			id: string;
			label: Copy;
			values: readonly (readonly (number | null)[])[];
		},
		...{
			id: string;
			label: Copy;
			values: readonly (readonly (number | null)[])[];
		}[],
	];
	ivCeiling: number;
	wings: readonly [WingExample, ...WingExample[]];
	anchors: readonly [SurfaceAnchor, SurfaceAnchor];
	targetRange: readonly [number, number];
	defaultTarget: number;
};
const validIv = (value: number | null | undefined): value is number =>
	typeof value === "number" && Number.isFinite(value) && value >= 0;
export function surfaceCell(
	data: SurfaceConceptData,
	dataset: string,
	row: number,
	column: number,
) {
	const value = data.datasets.find((d) => d.id === dataset)?.values[row]?.[
		column
	];
	return validIv(value) ? value : null;
}
function compatible(references: readonly WingReference[]) {
	const first = references[0];
	return (
		!!first?.expiry &&
		!!first.convention &&
		!!first.source &&
		references.every(
			(r) =>
				validIv(r.iv) &&
				r.expiry === first.expiry &&
				r.convention === first.convention &&
				r.source === first.source,
		)
	);
}
export function wingComparison(
	example: WingExample,
	order: "put-call" | "call-put",
) {
	const skewReady = compatible([example.put, example.call]);
	const butterflyReady = compatible([example.put, example.call, example.atm]);
	return {
		skew: skewReady
			? ((example.put.iv as number) - (example.call.iv as number)) *
				(order === "put-call" ? 1 : -1)
			: null,
		butterfly: butterflyReady
			? (example.put.iv as number) / 2 +
				(example.call.iv as number) / 2 -
				(example.atm.iv as number)
			: null,
	};
}
export type InterpolationMethod = "none" | "iv" | "variance";
export function interpolateIv(
	anchors: readonly SurfaceAnchor[],
	days: number,
	method: InterpolationMethod,
): {
	iv: number | null;
	provenance: "supplied" | "estimated" | "unavailable";
	reason: "missing" | "outside" | "off" | "invalid" | null;
} {
	if (
		!Number.isFinite(days) ||
		days <= 0 ||
		anchors.length !== 2 ||
		anchors.some((a) => !Number.isFinite(a.days) || a.days <= 0) ||
		anchors[0].days >= anchors[1].days
	)
		return { iv: null, provenance: "unavailable", reason: "invalid" };
	const exact = anchors.find((a) => a.days === days);
	if (exact)
		return validIv(exact.iv)
			? { iv: exact.iv, provenance: "supplied", reason: null }
			: { iv: null, provenance: "unavailable", reason: "missing" };
	if (days < anchors[0].days || days > anchors[1].days)
		return { iv: null, provenance: "unavailable", reason: "outside" };
	if (method === "none")
		return { iv: null, provenance: "unavailable", reason: "off" };
	if (!anchors.every((a) => validIv(a.iv)))
		return { iv: null, provenance: "unavailable", reason: "missing" };
	const [a, b] = anchors;
	const weight = (days - a.days) / (b.days - a.days);
	const iv =
		method === "iv"
			? (a.iv as number) * (1 - weight) + (b.iv as number) * weight
			: (Math.sqrt(
					((((a.iv as number) / 100) ** 2 * a.days) / 365) * (1 - weight) +
						((((b.iv as number) / 100) ** 2 * b.days) / 365) * weight,
				) /
					Math.sqrt(days / 365)) *
				100;
	return Number.isFinite(iv)
		? { iv, provenance: "estimated", reason: null }
		: { iv: null, provenance: "unavailable", reason: "invalid" };
}
