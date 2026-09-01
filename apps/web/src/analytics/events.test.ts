import { describe, expect, it } from "vitest";

import {
	ANALYTICS_EVENT_NAMES,
	ANALYTICS_EVENT_PROPERTY_KEYS,
	ANALYTICS_EVENT_SCHEMA_VERSION,
	analyticsEnvironment,
	analyticsRouteName,
	billingActionFailureReason,
	canonicalAnalyticsPath,
	isRegisteredAnalyticsEvent,
	pruneAnalyticsEventProperties,
	sanitizeAnalyticsEventUrlProperties,
	sanitizeAnalyticsUrl,
} from "./events";

describe("analytics event boundaries", () => {
	it("keeps a versioned exhaustive runtime event registry", () => {
		expect(ANALYTICS_EVENT_SCHEMA_VERSION).toBe(1);
		expect(Object.keys(ANALYTICS_EVENT_NAMES)).toContain("lesson_completed");
		expect(Object.keys(ANALYTICS_EVENT_NAMES)).toContain(
			"auth_session_established",
		);
		expect(Object.keys(ANALYTICS_EVENT_NAMES)).toContain(
			"billing_action_failed",
		);
		expect(Object.keys(ANALYTICS_EVENT_NAMES)).toContain(
			"course_pass_access_verified",
		);
	});

	it("allows registered product events and PostHog system events only", () => {
		expect(isRegisteredAnalyticsEvent("lesson_opened")).toBe(true);
		expect(isRegisteredAnalyticsEvent("$web_vitals")).toBe(true);
		expect(isRegisteredAnalyticsEvent("unregistered_event")).toBe(false);
		expect(isRegisteredAnalyticsEvent(null)).toBe(false);
	});

	it("keeps the runtime property registry exhaustive", () => {
		expect(Object.keys(ANALYTICS_EVENT_PROPERTY_KEYS).sort()).toEqual(
			Object.keys(ANALYTICS_EVENT_NAMES).sort(),
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

	it("sanitizes URL-like PostHog system properties beyond the core fields", () => {
		const properties: Record<string, unknown> = {
			$current_url: "https://tradely.ai/lesson?token=private#fragment",
			$last_external_referrer_url:
				"https://example.com/?email=user@example.com",
			$pathname: "/pricing?checkout=success",
			$browser: "Chrome",
		};
		sanitizeAnalyticsEventUrlProperties(properties);
		expect(properties).toMatchObject({
			$current_url: "https://tradely.ai/lesson",
			$last_external_referrer_url: "https://example.com/",
			$pathname: "/pricing",
			$browser: "Chrome",
		});
	});

	it("preserves runtime attribution while pruning custom properties", () => {
		const properties: Record<string, unknown> = {
			runtime: "browser",
			lesson_id: "lesson-1",
			unexpected: "remove-me",
		};
		pruneAnalyticsEventProperties("lesson_completed", properties);
		expect(properties).toMatchObject({
			runtime: "browser",
			lesson_id: "lesson-1",
		});
		expect(properties).not.toHaveProperty("unexpected");
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
		expect(
			billingActionFailureReason(
				new Error("No verified lifetime purchase was found"),
			),
		).toBe("not_found");
		expect(billingActionFailureReason(new Error("Network failed"))).toBe(
			"unavailable",
		);
	});
});
