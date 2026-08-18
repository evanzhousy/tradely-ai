import { describe, expect, it } from "vitest";

import { manualGrantIsActive, resolveLessonAccess } from "./access";

describe("resolveLessonAccess", () => {
	it("keeps previews public", () => {
		expect(
			resolveLessonAccess({
				access: "preview",
				isSignedIn: false,
				billingState: "inactive",
			}),
		).toEqual({ allowed: true, reason: "free-preview" });
	});

	it("does not describe unavailable billing as unpaid", () => {
		expect(
			resolveLessonAccess({
				access: "paid",
				isSignedIn: true,
				billingState: "unavailable",
			}),
		).toEqual({ allowed: false, reason: "billing-unavailable" });
	});

	it("accepts a current subscription", () => {
		expect(
			resolveLessonAccess({
				access: "paid",
				isSignedIn: true,
				billingState: "active",
			}),
		).toEqual({ allowed: true, reason: "subscribed" });
	});

	it("expires a manual grant at its configured boundary", () => {
		const now = Date.parse("2026-08-18T12:00:00Z");
		expect(
			manualGrantIsActive(
				{
					features: ["learning-hub-all-access"],
					expiresAt: "2026-08-18T12:01:00Z",
				},
				now,
			),
		).toBe(true);
		expect(
			manualGrantIsActive(
				{
					features: ["learning-hub-all-access"],
					expiresAt: "2026-08-18T11:59:00Z",
				},
				now,
			),
		).toBe(false);
	});
});
