import {
	type ContractNeighborhood,
	contractStatus,
	type NeighborhoodContract,
} from "./contracts";

type Copy = readonly [string, string];
export type NeighborhoodConceptData = {
	kind: "rank-contracts";
	source: string;
	session: string;
	optionType: "call";
	requiredIds: readonly string[];
	strikes: readonly number[];
	days: readonly number[];
	spotRange: readonly [number, number];
	snapshots: readonly {
		id: string;
		label: Copy;
		data: ContractNeighborhood;
		sessions: Record<string, string>;
	}[];
};
export function neighborhoodEvidenceStatus(
	data: ContractNeighborhood,
	row: NeighborhoodContract,
) {
	const status = contractStatus(data, row);
	if (status !== "comparable") return status;
	return row.volume !== null &&
		Number.isFinite(row.volume) &&
		Number.isInteger(row.volume) &&
		row.volume >= 0
		? "comparable"
		: "missing";
}
export function neighborhoodSummary(
	data: ContractNeighborhood,
	requiredIds: readonly string[],
) {
	const unique = new Set(requiredIds);
	const identityValid =
		unique.size > 0 &&
		unique.size === requiredIds.length &&
		new Set(data.contracts.map((c) => c.id)).size === data.contracts.length;
	const required = requiredIds.map((id) =>
		data.contracts.find((c) => c.id === id),
	);
	const known = required.filter(
		(c): c is NeighborhoodContract =>
			!!c && neighborhoodEvidenceStatus(data, c) === "comparable",
	);
	const subtotal = identityValid
		? known.reduce((s, c) => s + (c.volume as number), 0)
		: null;
	const finite = subtotal !== null && Number.isFinite(subtotal);
	const peak = known.length
		? Math.max(...known.map((c) => c.volume as number))
		: null;
	const breadth = known.filter((c) => (c.volume as number) > 0).length;
	const complete = identityValid && finite && known.length === required.length;
	return {
		complete,
		knownCount: identityValid ? known.length : 0,
		requiredCount: requiredIds.length,
		knownTotal: finite ? subtotal : null,
		knownPeak: identityValid ? peak : null,
		knownBreadth: identityValid ? breadth : null,
		total: complete ? subtotal : null,
		peak: complete ? peak : null,
		breadth: complete ? breadth : null,
	};
}
