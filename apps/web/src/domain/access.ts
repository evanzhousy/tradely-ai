import type { LessonAccess } from "@/content/course";

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

export type LessonAccessDecision =
	| { allowed: true; reason: "free-preview" | "subscribed" | "manual-grant" }
	| {
			allowed: false;
			reason: "signed-out" | "payment-required" | "billing-unavailable";
	  };

export function resolveLessonAccess(input: {
	access: LessonAccess;
	isSignedIn: boolean;
	billingState: BillingState;
	hasManualGrant?: boolean;
}): LessonAccessDecision {
	if (input.access === "preview") {
		return { allowed: true, reason: "free-preview" };
	}
	if (!input.isSignedIn) {
		return { allowed: false, reason: "signed-out" };
	}
	if (input.hasManualGrant) {
		return { allowed: true, reason: "manual-grant" };
	}
	if (input.billingState === "unavailable") {
		return { allowed: false, reason: "billing-unavailable" };
	}
	if (input.billingState === "active") {
		return { allowed: true, reason: "subscribed" };
	}
	return { allowed: false, reason: "payment-required" };
}
