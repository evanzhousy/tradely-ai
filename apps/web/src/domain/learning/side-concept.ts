export type LocationCode = "BBID" | "BID" | "MID" | "ASK" | "AASK";
export type ReferenceIssue =
	| "missing"
	| "mismatch"
	| "stale"
	| "later"
	| "locked"
	| "crossed"
	| "complex"
	| "invalid";
export type SideReference = {
	id: string;
	label: readonly [string, string];
	contract: string;
	bid: number | null;
	ask: number | null;
	at: string | null;
	secondsBeforePrint: number | null;
	/** Supplied quote-alignment evidence, not a universal age threshold. */
	timing: "matched" | "stale" | "later";
	condition: "regular" | "complex";
};
export type SideConceptData = {
	kind: "execution-side";
	contract: string;
	date: string;
	printAt: string;
	quantity: number;
	bid: number;
	ask: number;
	defaultPrice: number;
	priceRange: readonly [number, number];
	examples: readonly [
		{ price: number; code: LocationCode },
		...{ price: number; code: LocationCode }[],
	];
	references: readonly [SideReference, ...SideReference[]];
};

/** This lesson's declared convention. Prices are cents per share. MID is the entire open spread. */
export function locateExecution(
	price: number,
	bid: number | null,
	ask: number | null,
): LocationCode | null {
	if (
		bid === null ||
		ask === null ||
		!Number.isFinite(price) ||
		!Number.isFinite(bid) ||
		!Number.isFinite(ask) ||
		bid >= ask
	)
		return null;
	if (price < bid) return "BBID";
	if (price === bid) return "BID";
	if (price < ask) return "MID";
	if (price === ask) return "ASK";
	return "AASK";
}
export function assessSideReference(
	contract: string,
	price: number,
	reference: SideReference,
): { code: LocationCode | null; issue: ReferenceIssue | null } {
	const { bid, ask } = reference;
	const issue: ReferenceIssue | null =
		bid === null ||
		ask === null ||
		reference.at === null ||
		reference.secondsBeforePrint === null
			? "missing"
			: reference.contract !== contract
				? "mismatch"
				: reference.secondsBeforePrint < 0 || reference.timing === "later"
					? "later"
					: reference.timing === "stale"
						? "stale"
						: !Number.isFinite(bid) ||
								!Number.isFinite(ask) ||
								!Number.isFinite(price) ||
								!Number.isFinite(reference.secondsBeforePrint)
							? "invalid"
							: bid === ask
								? "locked"
								: bid > ask
									? "crossed"
									: reference.condition === "complex"
										? "complex"
										: null;
	return { code: issue ? null : locateExecution(price, bid, ask), issue };
}
export type SideClaim =
	| "location"
	| "initiation"
	| "order"
	| "belief"
	| "position";
export function sideClaimLevel(
	code: LocationCode | null,
	claim: SideClaim,
): "observed" | "inference" | "unknown" {
	if (code === null) return "unknown";
	if (claim === "location") return "observed";
	if (claim === "initiation" && (code === "ASK" || code === "BID"))
		return "inference";
	return "unknown";
}
