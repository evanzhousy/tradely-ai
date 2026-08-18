export function subscriptionGrantsCourse(input: {
	status: string;
	priceIds: string[];
	expectedPriceId: string;
}): boolean {
	return (
		(input.status === "active" || input.status === "trialing") &&
		input.priceIds.includes(input.expectedPriceId)
	);
}
