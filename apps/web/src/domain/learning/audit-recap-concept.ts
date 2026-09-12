import { type PacketTeachingRecord, packetTotals } from "./packet-concept";

type Copy = readonly [string, string];
export type AuditCheck = {
	id: string;
	label: Copy;
	reported: Copy;
	source: Copy;
	repair: Copy;
	initiallySupported: boolean;
};
export type AuditRecapConceptData = {
	kind: "audit-market-recap";
	source: string;
	packet: PacketTeachingRecord;
	requiredIds: readonly string[];
	reportedMultiplier: number;
	checks: readonly AuditCheck[];
	signoff: readonly { id: string; label: Copy; text: Copy }[];
};
/** Reproduce the stated flawed factors separately; never mutate the source record. */
export function workingAuditPremium(
	packet: PacketTeachingRecord,
	requiredIds: readonly string[],
	repaired: readonly string[],
	reportedMultiplier: number,
) {
	return packetTotals(
		packet.rows.map((row) =>
			repaired.includes(row.id)
				? row
				: { ...row, multiplier: reportedMultiplier },
		),
		requiredIds,
	);
}
export function unresolvedAuditChecks(
	checks: readonly AuditCheck[],
	repaired: readonly string[],
) {
	return checks.filter(
		(check) => !check.initiallySupported && !repaired.includes(check.id),
	);
}
