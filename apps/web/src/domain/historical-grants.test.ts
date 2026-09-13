import { describe, expect, it } from "vitest";

import { coursePassIsActive, manualGrantIsActive } from "./billing";

describe("historical purchase grants", () => {
	it("treats a revoked course pass as inactive", () => {
		expect(
			coursePassIsActive({
				coursePassGrantedAt: new Date("2026-08-30T12:00:00Z"),
				coursePassRevokedAt: null,
			}),
		).toBe(true);
		expect(
			coursePassIsActive({
				coursePassGrantedAt: new Date("2026-08-30T12:00:00Z"),
				coursePassRevokedAt: new Date("2026-08-31T12:00:00Z"),
			}),
		).toBe(false);
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
