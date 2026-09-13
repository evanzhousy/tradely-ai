import { describe, expect, it } from "vitest";
import { subscriptionRetirementDecision as decide } from "./billing-retirement";

const input = {
	priceIds: ["price_tradely"],
	allowedPriceIds: ["price_tradely"],
	hasMoreItems: false,
	hasSchedule: false,
	hasPendingUpdate: false,
	metered: false,
};
describe("retirement scope", () => {
	it("selects only the exact scoped subscription", () =>
		expect(decide(input)).toBe("cancel"));
	it("does not infer ownership from a shared customer", () =>
		expect(decide({ ...input, priceIds: ["price_other"] })).toBe("unrelated"));
	it.each([
		{ priceIds: ["price_tradely", "price_other"] },
		{ hasMoreItems: true },
		{ hasSchedule: true },
		{ hasPendingUpdate: true },
		{ metered: true },
	])("requires review for %j", (extra) =>
		expect(decide({ ...input, ...extra })).toBe("review"),
	);
});
