import { describe, expect, it } from "vitest";

import {
	normalizePostHogHost,
	POSTHOG_CONTROL_HOST,
	POSTHOG_INGESTION_HOST,
} from "./posthog-config";

describe("PostHog host boundaries", () => {
	it("uses the Tradely ingestion host by default", () => {
		expect(normalizePostHogHost(undefined)).toBe(POSTHOG_INGESTION_HOST);
	});

	it("trims trailing slashes without changing the host", () => {
		expect(normalizePostHogHost("  https://us.i.posthog.com///  ")).toBe(
			POSTHOG_INGESTION_HOST,
		);
	});

	it("supports an explicit control-plane fallback", () => {
		expect(normalizePostHogHost(undefined, POSTHOG_CONTROL_HOST)).toBe(
			POSTHOG_CONTROL_HOST,
		);
	});
});
