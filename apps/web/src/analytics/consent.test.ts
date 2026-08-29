import { describe, expect, it } from "vitest";

import { analyticsConsentCookie, parseAnalyticsConsent } from "./consent";

describe("analytics consent", () => {
	it("accepts only the persisted consent states", () => {
		expect(parseAnalyticsConsent("granted")).toBe("granted");
		expect(parseAnalyticsConsent("denied")).toBe("denied");
		expect(parseAnalyticsConsent("yes")).toBe("unknown");
		expect(parseAnalyticsConsent(null)).toBe("unknown");
	});

	it("creates a bounded same-site consent cookie for server observability", () => {
		expect(analyticsConsentCookie("granted", true)).toBe(
			"tradely_analytics_consent=granted; Path=/; Max-Age=31536000; SameSite=Lax; Secure",
		);
		expect(analyticsConsentCookie("denied", false)).not.toContain("Secure");
	});
});
