import { assessSideReference, type SideReference } from "./side-concept";
export type ReviewPacketId =
	| "original"
	| "aligned"
	| "missing-multiplier"
	| "opening"
	| "linked"
	| "complex";
export type ReviewPacket = {
	label: readonly [string, string];
	multiplier: number | null;
	reference: SideReference;
	opening: "open" | "close" | null;
	linked: boolean;
};
export type ReviewPrint = {
	id: string;
	contract: string;
	date: string;
	at: string;
	price: number;
	quantity: number;
};
export type PrintReviewConceptData = {
	kind: "validate-option-print";
	print: ReviewPrint;
	packets: Record<ReviewPacketId, ReviewPacket>;
};
export type EvidenceBucket = "observed" | "calculated" | "inferred" | "unknown";
export type ReviewStatement =
	| "contract"
	| "premium"
	| "aggressor"
	| "opening"
	| "strategy";
export type ReviewGap = "timing" | "multiplier" | "opening" | "linkage";
export type EvidenceRequest =
	| "quote"
	| "terms"
	| "position"
	| "linkage"
	| "larger"
	| "wait";
/** Price is cents per quoted unit. Missing evidence never silently defaults to a multiplier of 100. */
export function executionPremium(
	price: number,
	quantity: number,
	multiplier: number | null,
): number | null {
	if (
		multiplier === null ||
		!Number.isFinite(multiplier) ||
		multiplier <= 0 ||
		!Number.isFinite(price) ||
		price < 0 ||
		!Number.isInteger(quantity) ||
		quantity < 0
	)
		return null;
	return (price * quantity * multiplier) / 100;
}
export function assessPrint(print: ReviewPrint, packet: ReviewPacket) {
	const reference = assessSideReference(
		print.contract,
		print.price,
		packet.reference,
	);
	return {
		premium: executionPremium(print.price, print.quantity, packet.multiplier),
		reference,
		aggressor:
			reference.code === "ASK"
				? ("buyer" as const)
				: reference.code === "BID"
					? ("seller" as const)
					: null,
		opening: packet.opening,
		linked: packet.linked,
	};
}
export function statementBucket(
	statement: ReviewStatement,
	print: ReviewPrint,
	packet: ReviewPacket,
): EvidenceBucket {
	const result = assessPrint(print, packet);
	switch (statement) {
		case "contract":
			return "observed";
		case "premium":
			return result.premium === null ? "unknown" : "calculated";
		case "aggressor":
			return result.aggressor === null ? "unknown" : "inferred";
		case "opening":
			return result.opening === null ? "unknown" : "observed";
		case "strategy":
			return "unknown";
	}
}
/** Generic evidence dependencies. These are teaching rules, not assessment answer keys. */
export const reviewGaps: Record<
	ReviewGap,
	{ before: ReviewPacketId; after: ReviewPacketId; request: EvidenceRequest }
> = {
	timing: { before: "original", after: "aligned", request: "quote" },
	multiplier: {
		before: "missing-multiplier",
		after: "aligned",
		request: "terms",
	},
	opening: { before: "aligned", after: "opening", request: "position" },
	linkage: { before: "aligned", after: "linked", request: "linkage" },
};
export function followUpPacket(
	gap: ReviewGap,
	request: EvidenceRequest | null,
): ReviewPacketId {
	const dependency = reviewGaps[gap];
	return request === dependency.request ? dependency.after : dependency.before;
}
