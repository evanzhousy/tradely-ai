import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	env: {
		APP_URL: "http://localhost:8250",
		LIFETIME_CHECKOUT_ENABLED: true,
		NODE_ENV: "test",
		STRIPE_API_KEY: "sk_test_placeholder",
		STRIPE_COURSE_PASS_PRICE_ID: "price_course_pass",
		STRIPE_MEMBERSHIP_PRICE_ID: "price_membership",
		VERCEL_ENV: undefined as
			| "development"
			| "preview"
			| "production"
			| undefined,
		VERCEL_URL: undefined as string | undefined,
	},
	captureServerException: vi.fn(),
	getCurrentIdentity: vi.fn(),
	getCurrentUserId: vi.fn(),
	ensureAppUser: vi.fn(),
	findAppUser: vi.fn(),
	grantCoursePass: vi.fn(),
	hasActiveCoursePass: vi.fn(),
	hasManualAllAccess: vi.fn(),
	updateStripeCustomerId: vi.fn(),
	pricesRetrieve: vi.fn(),
	subscriptionsList: vi.fn(),
	customersCreate: vi.fn(),
	checkoutCreate: vi.fn(),
	checkoutRetrieve: vi.fn(),
	checkoutList: vi.fn(),
	checkoutListLineItems: vi.fn(),
	portalCreate: vi.fn(),
}));

vi.mock("@tanstack/react-start/server-only", () => ({}));

vi.mock("@tradely/env/server", () => ({
	env: mocks.env,
}));

vi.mock("stripe", () => ({
	default: class MockStripe {
		prices = { retrieve: mocks.pricesRetrieve };
		subscriptions = { list: mocks.subscriptionsList };
		customers = { create: mocks.customersCreate };
		checkout = {
			sessions: {
				create: mocks.checkoutCreate,
				retrieve: mocks.checkoutRetrieve,
				list: mocks.checkoutList,
				listLineItems: mocks.checkoutListLineItems,
			},
		};
		billingPortal = { sessions: { create: mocks.portalCreate } };
	},
}));

vi.mock("./analytics/posthog.server", () => ({
	captureServerException: mocks.captureServerException,
}));

vi.mock("./auth.server", () => ({
	getCurrentIdentity: mocks.getCurrentIdentity,
	getCurrentUserId: mocks.getCurrentUserId,
}));

vi.mock("./users.server", () => ({
	ensureAppUser: mocks.ensureAppUser,
	findAppUser: mocks.findAppUser,
	grantCoursePass: mocks.grantCoursePass,
	hasActiveCoursePass: mocks.hasActiveCoursePass,
	hasManualAllAccess: mocks.hasManualAllAccess,
	updateStripeCustomerId: mocks.updateStripeCustomerId,
}));

import {
	beginCoursePassCheckoutImpl,
	beginMembershipCheckoutImpl,
	getOffersSummaryImpl,
	getStripeBillingState,
	restoreCoursePassImpl,
	verifyCoursePassCheckoutImpl,
} from "./billing.server";

const appUser = {
	userId: "user_tradely",
	stripeCustomerId: "cus_tradely",
	stripeCoursePassCheckoutSessionId: null,
	coursePassGrantedAt: null,
	coursePassRevokedAt: null,
	accessOverrides: null,
	createdAt: new Date("2026-08-30T12:00:00Z"),
	updatedAt: new Date("2026-08-30T12:00:00Z"),
};

function paidCoursePassSession(
	change: Record<string, unknown> = {},
): Record<string, unknown> {
	return {
		id: "cs_test_course_pass",
		mode: "payment",
		status: "complete",
		payment_status: "paid",
		customer: "cus_tradely",
		client_reference_id: "user_tradely",
		metadata: {
			tradely_user_id: "user_tradely",
			tradely_entitlement: "tradingflow-foundations-lifetime",
		},
		...change,
	};
}

describe("Stripe billing server", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.env.LIFETIME_CHECKOUT_ENABLED = true;
		mocks.env.VERCEL_ENV = undefined;
		mocks.env.VERCEL_URL = undefined;
		mocks.getCurrentIdentity.mockResolvedValue({
			userId: "user_tradely",
			email: "learner@example.com",
		});
		mocks.getCurrentUserId.mockResolvedValue("user_tradely");
		mocks.ensureAppUser.mockResolvedValue(appUser);
		mocks.findAppUser.mockResolvedValue(appUser);
		mocks.hasActiveCoursePass.mockReturnValue(false);
		mocks.hasManualAllAccess.mockReturnValue(false);
		mocks.subscriptionsList.mockResolvedValue({ data: [] });
		mocks.checkoutListLineItems.mockResolvedValue({
			data: [{ price: { id: "price_course_pass" } }],
		});
		mocks.grantCoursePass.mockResolvedValue(undefined);
	});

	it("paginates past old subscriptions to find a valid membership", async () => {
		mocks.subscriptionsList
			.mockResolvedValueOnce({
				data: [],
				has_more: false,
			})
			.mockResolvedValueOnce({
				data: [
					{
						id: "sub_newer_unrelated",
						status: "trialing",
						items: { data: [{ price: { id: "price_other" } }] },
					},
				],
				has_more: true,
			})
			.mockResolvedValueOnce({
				data: [
					{
						id: "sub_older_valid",
						status: "trialing",
						items: { data: [{ price: { id: "price_membership" } }] },
					},
				],
				has_more: false,
			});

		await expect(getStripeBillingState("cus_tradely")).resolves.toBe("active");
		expect(mocks.subscriptionsList).toHaveBeenNthCalledWith(1, {
			customer: "cus_tradely",
			status: "active",
			limit: 100,
		});
		expect(mocks.subscriptionsList).toHaveBeenNthCalledWith(2, {
			customer: "cus_tradely",
			status: "trialing",
			limit: 100,
		});
		expect(mocks.subscriptionsList).toHaveBeenNthCalledWith(3, {
			customer: "cus_tradely",
			status: "trialing",
			limit: 100,
			starting_after: "sub_newer_unrelated",
		});
	});

	it("keeps Course Pass recovery configured when new sales are disabled", async () => {
		mocks.env.LIFETIME_CHECKOUT_ENABLED = false;
		mocks.pricesRetrieve.mockResolvedValue({
			currency: "usd",
			unit_amount: 6900,
			recurring: { interval: "month" },
		});

		await expect(getOffersSummaryImpl()).resolves.toMatchObject({
			salesRetired: true,
			coursePassRecoveryConfigured: true,
		});
	});

	it("grants access only after exact paid-session verification", async () => {
		mocks.checkoutRetrieve.mockResolvedValue(paidCoursePassSession());

		await expect(
			verifyCoursePassCheckoutImpl("cs_test_course_pass"),
		).resolves.toMatchObject({
			verified: true,
			courseId: "tradingflow-foundations",
			source: "checkout_return",
		});
		expect(mocks.grantCoursePass).toHaveBeenCalledWith(
			"user_tradely",
			"cs_test_course_pass",
		);
	});

	it("continues verifying paid returns after new checkout is disabled", async () => {
		mocks.env.LIFETIME_CHECKOUT_ENABLED = false;
		mocks.checkoutRetrieve.mockResolvedValue(paidCoursePassSession());

		await expect(
			verifyCoursePassCheckoutImpl("cs_test_course_pass"),
		).resolves.toMatchObject({ verified: true });
		expect(mocks.grantCoursePass).toHaveBeenCalled();
	});

	it("rejects a paid session belonging to another user", async () => {
		mocks.checkoutRetrieve.mockResolvedValue(
			paidCoursePassSession({ client_reference_id: "user_other" }),
		);

		await expect(
			verifyCoursePassCheckoutImpl("cs_test_course_pass"),
		).rejects.toThrow("Course pass purchase could not be verified");
		expect(mocks.grantCoursePass).not.toHaveBeenCalled();
	});

	it("restores a verified purchase when the return callback was missed", async () => {
		mocks.checkoutList.mockResolvedValue({ data: [paidCoursePassSession()] });

		await expect(restoreCoursePassImpl()).resolves.toMatchObject({
			verified: true,
			courseId: "tradingflow-foundations",
			source: "restore",
		});
		expect(mocks.grantCoursePass).toHaveBeenCalledWith(
			"user_tradely",
			"cs_test_course_pass",
		);
	});

	it("paginates Checkout Sessions while restoring an older purchase", async () => {
		mocks.checkoutList
			.mockResolvedValueOnce({
				data: [
					paidCoursePassSession({
						id: "cs_test_newer_unpaid",
						status: "open",
						payment_status: "unpaid",
					}),
				],
				has_more: true,
			})
			.mockResolvedValueOnce({
				data: [paidCoursePassSession({ id: "cs_test_older_paid" })],
				has_more: false,
			});

		await expect(restoreCoursePassImpl()).resolves.toMatchObject({
			verified: true,
			source: "restore",
		});
		expect(mocks.checkoutList).toHaveBeenNthCalledWith(1, {
			customer: "cus_tradely",
			status: "complete",
			limit: 100,
		});
		expect(mocks.checkoutList).toHaveBeenNthCalledWith(2, {
			customer: "cus_tradely",
			status: "complete",
			limit: 100,
			starting_after: "cs_test_newer_unpaid",
		});
		expect(mocks.grantCoursePass).toHaveBeenCalledWith(
			"user_tradely",
			"cs_test_older_paid",
		);
	});
});

it("unconditionally retires both checkout entry points without writes", async () => {
	vi.clearAllMocks();
	for (const action of [
		beginMembershipCheckoutImpl,
		beginCoursePassCheckoutImpl,
	])
		expect(await action()).toEqual({ retired: true, reason: "sales_retired" });
	expect(mocks.checkoutCreate).not.toHaveBeenCalled();
});
