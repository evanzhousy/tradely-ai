export type BillingState = "active" | "inactive" | "unavailable";

export function manualGrantIsActive(
	overrides:
		| { features?: string[]; expiresAt?: string | null }
		| null
		| undefined,
	now = Date.now(),
): boolean {
	if (!overrides?.features?.includes("learning-hub-all-access")) return false;
	if (!overrides.expiresAt) return true;
	const expiresAt = Date.parse(overrides.expiresAt);
	return Number.isFinite(expiresAt) && expiresAt > now;
}

export function coursePassIsActive(
	grant:
		| { coursePassGrantedAt?: Date | null; coursePassRevokedAt?: Date | null }
		| null
		| undefined,
): boolean {
	return Boolean(grant?.coursePassGrantedAt && !grant.coursePassRevokedAt);
}

export const BILLING_CONTRACT = {
	salesRetired: true,
	currency: "usd",
	accountDisplayName: "Tradely.ai",
	statementDescriptor: "TRADELYAI",
	statementDescriptorPrefix: "TRADELY",
	membership: {
		productName: "Tradely Membership",
		unitAmount: 6900,
		interval: "month",
		offerMetadata: "membership",
		partnerBenefitMetadata: "tradingflow_membership_1_month",
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
	expectedUserId: string;
	metadataUserId: string | null;
	priceIds: string[];
	expectedPriceId: string;
	entitlement: string | null;
}): boolean {
	return (
		input.mode === "payment" &&
		input.status === "complete" &&
		input.paymentStatus === "paid" &&
		input.customerId === input.expectedCustomerId &&
		input.clientReferenceId === input.expectedUserId &&
		input.metadataUserId === input.expectedUserId &&
		input.priceIds.length === 1 &&
		input.priceIds[0] === input.expectedPriceId &&
		input.entitlement === COURSE_PASS_ENTITLEMENT
	);
}
