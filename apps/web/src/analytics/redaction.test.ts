import { describe, expect, it } from "vitest";

import {
	isExpectedBillingError,
	redactAnalyticsPersonProperties,
	redactAnalyticsText,
	safeAnalyticsError,
	serverAnalyticsEnvironment,
} from "./redaction";

describe("analytics error redaction", () => {
	it("removes personal, credential, and provider identifiers", () => {
		const safe = redactAnalyticsText(
			"user@example.com token?token=secret-value cus_123 user_abc Bearer abc.def",
			500,
		);
		expect(safe).not.toContain("user@example.com");
		expect(safe).not.toContain("secret-value");
		expect(safe).not.toContain("cus_123");
		expect(safe).not.toContain("user_abc");
		expect(safe).not.toContain("abc.def");
	});

	it("copies bounded safe errors without mutating the source", () => {
		const source = new TypeError("Failed for price_123 at a@example.com");
		source.stack = `${source.name}: ${source.message}\n at fn (?code=private)`;
		const safe = safeAnalyticsError(source);
		expect(safe).not.toBe(source);
		expect(safe.name).toBe("TypeError");
		expect(safe.message).toContain("[redacted-provider-id]");
		expect(safe.stack).toContain("?code=[redacted]");
	});

	it("keeps expected customer states out of server exception paging", () => {
		expect(isExpectedBillingError(new Error("Sign in to manage billing"))).toBe(
			true,
		);
		expect(isExpectedBillingError(new Error("Stripe request failed"))).toBe(
			false,
		);
	});

	it("redacts sensitive nested person properties without touching safe fields", () => {
		const properties = {
			auth_provider: "clerk",
			email: "user@example.com",
			nested: { phone: "555-0100", locale: "en" },
		};
		redactAnalyticsPersonProperties(properties);
		expect(properties).toEqual({
			auth_provider: "clerk",
			nested: { locale: "en" },
		});
	});

	it("labels Vercel production, previews, and local execution", () => {
		expect(
			serverAnalyticsEnvironment({
				nodeEnv: "production",
				vercelEnv: "preview",
			}),
		).toBe("preview");
		expect(
			serverAnalyticsEnvironment({
				nodeEnv: "production",
				vercelEnv: "production",
			}),
		).toBe("production");
		expect(
			serverAnalyticsEnvironment({
				nodeEnv: "development",
				vercelEnv: undefined,
			}),
		).toBe("local");
	});
});
