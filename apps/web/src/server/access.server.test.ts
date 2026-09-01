import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	captureServerException: vi.fn(),
	getCurrentClerkUserId: vi.fn(),
	getStripeBillingState: vi.fn(),
	findAppUser: vi.fn(),
	hasActiveCoursePass: vi.fn(),
	hasManualAllAccess: vi.fn(),
}));

vi.mock("@tanstack/react-start/server-only", () => ({}));

vi.mock("./analytics/posthog.server", () => ({
	captureServerException: mocks.captureServerException,
}));

vi.mock("./auth.server", () => ({
	getCurrentClerkUserId: mocks.getCurrentClerkUserId,
}));

vi.mock("./billing.server", () => ({
	getStripeBillingState: mocks.getStripeBillingState,
}));

vi.mock("./users.server", () => ({
	findAppUser: mocks.findAppUser,
	hasActiveCoursePass: mocks.hasActiveCoursePass,
	hasManualAllAccess: mocks.hasManualAllAccess,
}));

import { getCurrentCourseAccess } from "./access.server";

describe("course access server", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.getCurrentClerkUserId.mockResolvedValue("user_tradely");
		mocks.findAppUser.mockResolvedValue({
			clerkUserId: "user_tradely",
			stripeCustomerId: "cus_tradely",
		});
		mocks.hasManualAllAccess.mockReturnValue(false);
		mocks.getStripeBillingState.mockResolvedValue("unavailable");
	});

	it("short-circuits Stripe lookup for an active Course Pass", async () => {
		mocks.hasActiveCoursePass.mockReturnValue(true);

		await expect(getCurrentCourseAccess()).resolves.toMatchObject({
			isSignedIn: true,
			hasCoursePass: true,
			canAccessPaid: true,
		});
		expect(mocks.getStripeBillingState).not.toHaveBeenCalled();
	});

	it("preserves unavailable billing when no durable grant exists", async () => {
		mocks.hasActiveCoursePass.mockReturnValue(false);

		await expect(getCurrentCourseAccess()).resolves.toMatchObject({
			billingState: "unavailable",
			hasCoursePass: false,
			canAccessPaid: false,
		});
		expect(mocks.getStripeBillingState).toHaveBeenCalledWith("cus_tradely");
	});
});
