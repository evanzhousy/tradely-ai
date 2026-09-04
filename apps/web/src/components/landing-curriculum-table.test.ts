import { describe, expect, it } from "vitest";

import { lessonAccessLabel } from "./landing-curriculum-table";

describe("lessonAccessLabel", () => {
	it("labels preview lessons as free even when paid access is closed", () => {
		expect(
			lessonAccessLabel({
				access: "preview",
				canAccessPaid: false,
				accessUnavailable: true,
				free: "Free",
				unlocked: "Unlocked",
				unavailable: "Access status unavailable",
				paid: "Paid lesson",
			}),
		).toBe("Free");
	});

	it("distinguishes unlocked, unavailable, and paid states for member lessons", () => {
		expect(
			lessonAccessLabel({
				access: "paid",
				canAccessPaid: true,
				accessUnavailable: false,
				free: "Free",
				unlocked: "Unlocked",
				unavailable: "Access status unavailable",
				paid: "Paid lesson",
			}),
		).toBe("Unlocked");
		expect(
			lessonAccessLabel({
				access: "paid",
				canAccessPaid: false,
				accessUnavailable: true,
				free: "Free",
				unlocked: "Unlocked",
				unavailable: "Access status unavailable",
				paid: "Paid lesson",
			}),
		).toBe("Access status unavailable");
		expect(
			lessonAccessLabel({
				access: "paid",
				canAccessPaid: false,
				accessUnavailable: false,
				free: "Free",
				unlocked: "Unlocked",
				unavailable: "Access status unavailable",
				paid: "Paid lesson",
			}),
		).toBe("Paid lesson");
	});
});
