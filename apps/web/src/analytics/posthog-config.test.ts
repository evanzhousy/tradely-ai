import { describe, expect, it } from "vitest";

import {
	normalizePostHogHost,
	POSTHOG_CONTROL_HOST,
	POSTHOG_PROXY_HOST,
} from "./posthog-config";

describe("PostHog host boundaries", () => {
	it("uses the Tradely proxy host by default", () => {
		expect(normalizePostHogHost(undefined)).toBe(POSTHOG_PROXY_HOST);
	});

	it("trims trailing slashes without changing the host", () => {
		expect(normalizePostHogHost("  https://z.tradely.ai///  ")).toBe(
			POSTHOG_PROXY_HOST,
		);
	});

	it("supports an explicit control-plane fallback", () => {
		expect(normalizePostHogHost(undefined, POSTHOG_CONTROL_HOST)).toBe(
			POSTHOG_CONTROL_HOST,
		);
	});
});
