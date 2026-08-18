import { describe, expect, it } from "vitest";

import { subscriptionGrantsCourse } from "./billing";

describe("subscriptionGrantsCourse", () => {
	it("accepts the configured active price", () => {
		expect(
			subscriptionGrantsCourse({
				status: "active",
				priceIds: ["price_course"],
				expectedPriceId: "price_course",
			}),
		).toBe(true);
	});

	it("rejects an unrelated active product", () => {
		expect(
			subscriptionGrantsCourse({
				status: "active",
				priceIds: ["price_other"],
				expectedPriceId: "price_course",
			}),
		).toBe(false);
	});

	it("rejects a canceled course subscription", () => {
		expect(
			subscriptionGrantsCourse({
				status: "canceled",
				priceIds: ["price_course"],
				expectedPriceId: "price_course",
			}),
		).toBe(false);
	});
});
