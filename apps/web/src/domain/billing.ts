export const BILLING_CONTRACT = {
	currency: "usd",
	accountDisplayName: "Tradely.ai",
	statementDescriptor: "TRADELYAI",
	statementDescriptorPrefix: "TRADELY",
	membership: {
		productName: "Tradely Membership",
		unitAmount: 990,
		interval: "month",
		offerMetadata: "membership",
	},
	coursePass: {
		productName: "Evidence-Led Options Research — Lifetime Course Pass",
		unitAmount: 4900,
		courseId: "tradingflow-foundations",
		offerMetadata: "course_pass",
	},
	checkoutBranding: {
		display_name: "Tradely.ai",
		background_color: "#fffdf5",
		button_color: "#111111",
		border_style: "rounded",
		font_family: "inter",
	},
} as const;

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

export const COURSE_PASS_ENTITLEMENT = "tradingflow-foundations-lifetime";

export function checkoutSessionGrantsCoursePass(input: {
	mode: string | null;
	status: string | null;
	paymentStatus: string;
	customerId: string | null;
	expectedCustomerId: string;
	clientReferenceId: string | null;
	expectedClerkUserId: string;
	metadataClerkUserId: string | null;
	priceIds: string[];
	expectedPriceId: string;
	entitlement: string | null;
}): boolean {
	return (
		input.mode === "payment" &&
		input.status === "complete" &&
		input.paymentStatus === "paid" &&
		input.customerId === input.expectedCustomerId &&
		input.clientReferenceId === input.expectedClerkUserId &&
		input.metadataClerkUserId === input.expectedClerkUserId &&
		input.priceIds.length === 1 &&
		input.priceIds[0] === input.expectedPriceId &&
		input.entitlement === COURSE_PASS_ENTITLEMENT
	);
}
