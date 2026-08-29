import { describe, expect, it } from "vitest";

import {
	ANALYTICS_EVENT_NAMES,
	ANALYTICS_EVENT_SCHEMA_VERSION,
	analyticsEnvironment,
	analyticsRouteName,
	billingActionFailureReason,
	canonicalAnalyticsPath,
	sanitizeAnalyticsUrl,
} from "./events";

describe("analytics event boundaries", () => {
	it("keeps a versioned exhaustive runtime event registry", () => {
		expect(ANALYTICS_EVENT_SCHEMA_VERSION).toBe(1);
		expect(Object.keys(ANALYTICS_EVENT_NAMES)).toContain("lesson_completed");
		expect(Object.keys(ANALYTICS_EVENT_NAMES)).toContain(
			"billing_action_failed",
		);
	});

	it("maps concrete URLs to bounded route names", () => {
		expect(analyticsRouteName("/")).toBe("home");
		expect(analyticsRouteName("/learn/audited-boundary")).toBe("lesson");
		expect(analyticsRouteName("/risk-disclosure")).toBe("risk_disclosure");
		expect(analyticsRouteName("/unknown")).toBe("not_found");
	});

	it("removes query strings and fragments from captured URLs", () => {
		expect(
			sanitizeAnalyticsUrl(
				"https://tradely.ai/pricing?checkout=success&code=secret#details",
			),
		).toBe("https://tradely.ai/pricing");
		expect(canonicalAnalyticsPath("/privacy/")).toBe("/privacy");
	});

	it("marks production, preview, and local traffic explicitly", () => {
		expect(analyticsEnvironment("tradely.ai")).toBe("production");
		expect(analyticsEnvironment("tradely-ai-web.vercel.app")).toBe("preview");
		expect(analyticsEnvironment("localhost")).toBe("local");
	});

	it("keeps expected billing states out of exception tracking", () => {
		expect(
			billingActionFailureReason(new Error("Sign in to manage billing")),
		).toBe("sign_in_required");
		expect(
			billingActionFailureReason(
				new Error(
					"This membership is already active. Use Manage billing instead.",
				),
			),
		).toBe("already_active");
		expect(
			billingActionFailureReason(
				new Error("No Stripe customer is linked to this account"),
			),
		).toBe("no_customer");
		expect(billingActionFailureReason(new Error("Network failed"))).toBe(
			"unavailable",
		);
	});
});
