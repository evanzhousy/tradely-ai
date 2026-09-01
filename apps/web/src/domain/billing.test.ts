import { describe, expect, it } from "vitest";

import {
	COURSE_PASS_ENTITLEMENT,
	checkoutSessionGrantsCoursePass,
	subscriptionGrantsCourse,
} from "./billing";

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

describe("checkoutSessionGrantsCoursePass", () => {
	const valid = {
		mode: "payment",
		status: "complete",
		paymentStatus: "paid",
		customerId: "cus_tradely",
		expectedCustomerId: "cus_tradely",
		clientReferenceId: "user_tradely",
		expectedClerkUserId: "user_tradely",
		metadataClerkUserId: "user_tradely",
		priceIds: ["price_course_pass"],
		expectedPriceId: "price_course_pass",
		entitlement: COURSE_PASS_ENTITLEMENT,
	};

	it("accepts a paid course-pass session for the exact user and price", () => {
		expect(checkoutSessionGrantsCoursePass(valid)).toBe(true);
	});

	it.each([
		["unpaid", { paymentStatus: "unpaid" }],
		["wrong user", { clientReferenceId: "user_other" }],
		["wrong metadata user", { metadataClerkUserId: "user_other" }],
		["wrong customer", { customerId: "cus_other" }],
		["wrong price", { priceIds: ["price_other"] }],
		["additional price", { priceIds: ["price_course_pass", "price_other"] }],
		["wrong entitlement", { entitlement: "other" }],
	])("rejects %s sessions", (_label, change) => {
		expect(checkoutSessionGrantsCoursePass({ ...valid, ...change })).toBe(
			false,
		);
	});
});
