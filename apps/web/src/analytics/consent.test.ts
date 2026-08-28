import { describe, expect, it } from "vitest";

import { parseAnalyticsConsent } from "./consent";

describe("analytics consent", () => {
	it("accepts only the persisted consent states", () => {
		expect(parseAnalyticsConsent("granted")).toBe("granted");
		expect(parseAnalyticsConsent("denied")).toBe("denied");
		expect(parseAnalyticsConsent("yes")).toBe("unknown");
		expect(parseAnalyticsConsent(null)).toBe("unknown");
	});
});
