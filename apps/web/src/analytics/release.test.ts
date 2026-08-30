import { describe, expect, test } from "vitest";

import {
	ANALYTICS_RELEASE_MAX_LENGTH,
	LOCAL_ANALYTICS_RELEASE,
	normalizeAnalyticsRelease,
	resolveAnalyticsRelease,
} from "./release";

describe("normalizeAnalyticsRelease", () => {
	test("falls back to local when no release is configured", () => {
		expect(normalizeAnalyticsRelease(undefined)).toBe(LOCAL_ANALYTICS_RELEASE);
		expect(normalizeAnalyticsRelease("   ")).toBe(LOCAL_ANALYTICS_RELEASE);
	});

	test("trims and bounds release metadata", () => {
		const longRelease = `  ${"r".repeat(ANALYTICS_RELEASE_MAX_LENGTH + 20)}  `;
		expect(normalizeAnalyticsRelease(longRelease)).toBe(
			"r".repeat(ANALYTICS_RELEASE_MAX_LENGTH),
		);
	});

	test("uses the explicit fallback when the primary source is blank", () => {
		expect(resolveAnalyticsRelease("", "manual-release")).toBe(
			"manual-release",
		);
		expect(resolveAnalyticsRelease("  ", "manual-release")).toBe(
			"manual-release",
		);
		expect(resolveAnalyticsRelease("commit-sha", "manual-release")).toBe(
			"commit-sha",
		);
	});
});
