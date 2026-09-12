type Copy = readonly [string, string];
export type PacketRow = {
	id: string;
	contracts: number | null;
	priceCents: number | null;
	multiplier: number | null;
};
export type PacketMethod = {
	cutoff: string;
	universe: string;
	source: string;
	transformation: string;
	units: string;
	missingPolicy: string;
};
export type PacketTeachingRecord = {
	id: string;
	session: string;
	method: PacketMethod;
	rows: readonly PacketRow[];
};
export type PacketConceptData = {
	kind: "cookbook-research-packet";
	source: string;
	requiredIds: readonly string[];
	original: PacketTeachingRecord;
	fields: readonly { id: string; label: Copy; value: Copy }[];
	reruns: readonly {
		id: string;
		label: Copy;
		record: PacketTeachingRecord;
		note: Copy;
	}[];
};
export function packetRowPremium(row: PacketRow) {
	if (
		[row.contracts, row.priceCents, row.multiplier].some(
			(v) => v === null || !Number.isSafeInteger(v) || v < 0,
		) ||
		row.multiplier === 0
	)
		return null;
	const cents =
		(row.contracts as number) *
		(row.priceCents as number) *
		(row.multiplier as number);
	return Number.isSafeInteger(cents) ? cents : null;
}
export function packetTotals(
	rows: readonly PacketRow[],
	requiredIds: readonly string[],
) {
	const required = new Set(requiredIds);
	const valid =
		required.size > 0 &&
		required.size === requiredIds.length &&
		new Set(rows.map((r) => r.id)).size === rows.length &&
		rows.every((r) => required.has(r.id));
	const known = rows.filter((r) => packetRowPremium(r) !== null);
	const missing = requiredIds.filter((id) => !known.some((r) => r.id === id));
	const raw = valid
		? known.reduce((s, r) => s + (packetRowPremium(r) as number), 0)
		: null;
	const subtotal = raw !== null && Number.isSafeInteger(raw) ? raw : null;
	return {
		usedIds: valid ? known.map((r) => r.id) : [],
		missingIds: valid ? missing : [...requiredIds],
		subtotal,
		fullTotal: valid && !missing.length ? subtotal : null,
	};
}
/** Session is a declared replay input; these method fields are fixed across an allowed rerun. */
export function changedPacketMethod(a: PacketMethod, b: PacketMethod) {
	const keys = [
		"cutoff",
		"universe",
		"source",
		"transformation",
		"units",
		"missingPolicy",
	] as const;
	return keys.filter((key) => a[key] !== b[key]);
}
