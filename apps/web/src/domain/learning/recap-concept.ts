import { type PacketTeachingRecord, packetRowPremium } from "./packet-concept";

type Copy = readonly [string, string];
export type RecapMetric = "volume" | "premium";
export type RecapConceptData = {
	kind: "market-recap";
	source: string;
	packet: PacketTeachingRecord;
	series: readonly { id: string; strike: number }[];
	axisFrames: readonly [number, ...number[]];
	captionFields: readonly { id: string; label: Copy; value: Copy }[];
};
/** Premium values stay in integer cents; charts format them as USD. */
export function recapSeries(
	packet: PacketTeachingRecord,
	series: readonly { id: string; strike: number }[],
	metric: RecapMetric,
) {
	const valid =
		new Set(series.map((s) => s.id)).size === series.length &&
		series.length > 0 &&
		new Set(packet.rows.map((r) => r.id)).size === packet.rows.length &&
		packet.rows.every((r) => series.some((s) => s.id === r.id));
	const rows = series.map((s) => {
		const row = packet.rows.find((r) => r.id === s.id);
		const value = !row
			? null
			: metric === "premium"
				? packetRowPremium(row)
				: row.contracts !== null &&
						Number.isSafeInteger(row.contracts) &&
						row.contracts >= 0
					? row.contracts
					: null;
		return { ...s, value };
	});
	const known = rows.filter((r) => r.value !== null);
	const raw = valid ? known.reduce((s, r) => s + (r.value as number), 0) : null;
	const subtotal = raw !== null && Number.isSafeInteger(raw) ? raw : null;
	return {
		rows,
		subtotal,
		missing: rows.filter((r) => r.value === null).map((r) => r.id),
		fullTotal: valid && known.length === rows.length ? subtotal : null,
	};
}
export function apparentBarRatio(
	larger: number,
	smaller: number,
	axisMinimum: number,
) {
	if (
		![larger, smaller, axisMinimum].every(Number.isFinite) ||
		axisMinimum < 0 ||
		larger <= axisMinimum ||
		smaller <= axisMinimum
	)
		return null;
	return (larger - axisMinimum) / (smaller - axisMinimum);
}
