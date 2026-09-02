import { describe, expect, it } from "vitest";

import { parsePricingSearch } from "./pricing-search";

describe("pricing search boundary", () => {
	it("keeps a valid lifetime Checkout return", () => {
		expect(
			parsePricingSearch({
				checkout: "lifetime-success",
				session_id: "cs_test_valid",
			}),
		).toEqual({
			checkout: "lifetime-success",
			session_id: "cs_test_valid",
		});
	});

	it("drops malformed and oversized Session IDs without throwing", () => {
		expect(
			parsePricingSearch({
				checkout: "lifetime-success",
				session_id: "not-a-checkout-session",
			}),
		).toEqual({ checkout: "lifetime-success", session_id: undefined });
		expect(
			parsePricingSearch({
				checkout: "lifetime-success",
				session_id: `cs_test_${"x".repeat(201)}`,
			}),
		).toEqual({ checkout: "lifetime-success", session_id: undefined });
	});

	it("drops unknown checkout results", () => {
		expect(parsePricingSearch({ checkout: "forged" })).toEqual({
			checkout: undefined,
			session_id: undefined,
		});
	});
});
