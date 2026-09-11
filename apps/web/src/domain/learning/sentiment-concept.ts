import { assessSideReference, type SideReference } from "./side-concept";
export type SentimentOption = "CALL" | "PUT";
export type FlowAggressor = "buy" | "sell";
export type FlowSentiment = "bullish" | "bearish" | "indeterminate";
export type SentimentEvidence = {
	id: string;
	label: readonly [string, string];
	price: number;
	reference: SideReference;
};
export type PositionContext = {
	id: string;
	label: readonly [string, string];
	/** Signed inventory, not a price view or an estimated Greek. Null means unavailable. */
	beforeShares: number | null;
	beforePuts: number | null;
	meaning: "unknown" | "protection" | "close";
};
export type SentimentConceptData = {
	kind: "flow-sentiment";
	contractBase: string;
	date: string;
	printAt: string;
	quantity: number;
	multiplier: number;
	price: number;
	combinations: readonly [
		{ option: SentimentOption; aggressor: FlowAggressor },
		...{ option: SentimentOption; aggressor: FlowAggressor }[],
	];
	evidence: readonly [SentimentEvidence, ...SentimentEvidence[]];
	contexts: readonly [PositionContext, ...PositionContext[]];
};
/** Course convention: isolated-leg directional effect from the likely aggressor's perspective. */
export function classifyFlow(
	option: SentimentOption,
	aggressor: FlowAggressor | null,
): FlowSentiment {
	if (aggressor === null) return "indeterminate";
	return (option === "CALL") === (aggressor === "buy") ? "bullish" : "bearish";
}
export function evaluateFlowEvidence(
	contract: string,
	option: SentimentOption,
	evidence: SentimentEvidence,
) {
	const reference = assessSideReference(
		contract,
		evidence.price,
		evidence.reference,
	);
	const aggressor: FlowAggressor | null =
		reference.code === "ASK" ? "buy" : reference.code === "BID" ? "sell" : null;
	return {
		...reference,
		aggressor,
		sentiment: classifyFlow(option, aggressor),
	};
}
export function putBuyInventory(
	context: PositionContext,
	quantity: number,
	completed: boolean,
) {
	return {
		shares: context.beforeShares,
		puts:
			context.beforePuts === null
				? null
				: context.beforePuts + (completed ? quantity : 0),
	};
}
