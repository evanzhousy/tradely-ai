/** Scope checks shared by dry-run planning and fresh retrieval before retirement. */
export function subscriptionRetirementDecision(input: {
	priceIds: string[];
	allowedPriceIds: string[];
	hasMoreItems: boolean;
	hasSchedule: boolean;
	hasPendingUpdate: boolean;
	metered: boolean;
}) {
	const allowed = new Set(input.allowedPriceIds);
	if (!input.priceIds.some((id) => allowed.has(id)))
		return "unrelated" as const;
	if (
		input.hasMoreItems ||
		input.hasSchedule ||
		input.hasPendingUpdate ||
		input.metered ||
		input.priceIds.some((id) => !allowed.has(id))
	)
		return "review" as const;
	return "cancel" as const;
}
