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
	getCurrentClerkIdentity: vi.fn(),
	getCurrentClerkUserId: vi.fn(),
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
	getCurrentClerkIdentity: mocks.getCurrentClerkIdentity,
	getCurrentClerkUserId: mocks.getCurrentClerkUserId,
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
	restoreCoursePassImpl,
	verifyCoursePassCheckoutImpl,
} from "./billing.server";

const appUser = {
	clerkUserId: "user_tradely",
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
			tradely_clerk_user_id: "user_tradely",
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
		mocks.getCurrentClerkIdentity.mockResolvedValue({
			userId: "user_tradely",
			email: "learner@example.com",
		});
		mocks.getCurrentClerkUserId.mockResolvedValue("user_tradely");
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

	it("creates a subscription Checkout Session for the exact membership Price", async () => {
		mocks.checkoutCreate.mockResolvedValue({
			url: "https://checkout.test/member",
		});

		await expect(beginMembershipCheckoutImpl()).resolves.toEqual({
			url: "https://checkout.test/member",
		});
		const [params] = mocks.checkoutCreate.mock.calls[0];
		expect(params).toMatchObject({
			mode: "subscription",
			branding_settings: {
				display_name: "Tradely.ai",
				background_color: "#fffdf5",
				button_color: "#111111",
				border_style: "rounded",
				font_family: "inter",
			},
			customer: "cus_tradely",
			client_reference_id: "user_tradely",
			line_items: [{ price: "price_membership", quantity: 1 }],
			success_url: "http://localhost:8250/pricing?checkout=membership-success",
			cancel_url: "http://localhost:8250/pricing?checkout=membership-cancel",
		});
		expect(params.integration_identifier).toMatch(
			/^tradely_membership_[a-z]{8}$/,
		);
		expect(params).not.toHaveProperty("payment_method_types");
	});

	it("uses the trusted Vercel deployment origin for Preview callbacks", async () => {
		mocks.env.VERCEL_ENV = "preview";
		mocks.env.VERCEL_URL = "tradely-preview-abc.vercel.app";
		mocks.checkoutCreate.mockResolvedValue({
			url: "https://checkout.test/course-pass",
		});

		await beginCoursePassCheckoutImpl();

		const [params] = mocks.checkoutCreate.mock.calls[0];
		expect(params).toMatchObject({
			success_url:
				"https://tradely-preview-abc.vercel.app/pricing?checkout=lifetime-success&session_id={CHECKOUT_SESSION_ID}",
			cancel_url:
				"https://tradely-preview-abc.vercel.app/pricing?checkout=lifetime-cancel",
		});
	});

	it("rejects an untrusted Preview callback host", async () => {
		mocks.env.VERCEL_ENV = "preview";
		mocks.env.VERCEL_URL = "tradely-preview.example.com";

		await expect(beginCoursePassCheckoutImpl()).rejects.toThrow(
			"Vercel Preview URL is not configured for billing",
		);
		expect(mocks.checkoutCreate).not.toHaveBeenCalled();
	});

	it("creates a one-time Checkout Session with bounded entitlement metadata", async () => {
		mocks.checkoutCreate.mockResolvedValue({
			url: "https://checkout.test/course-pass",
		});

		await expect(beginCoursePassCheckoutImpl()).resolves.toEqual({
			url: "https://checkout.test/course-pass",
		});
		const [params] = mocks.checkoutCreate.mock.calls[0];
		expect(params).toMatchObject({
			mode: "payment",
			branding_settings: {
				display_name: "Tradely.ai",
				background_color: "#fffdf5",
				button_color: "#111111",
				border_style: "rounded",
				font_family: "inter",
			},
			customer: "cus_tradely",
			client_reference_id: "user_tradely",
			line_items: [{ price: "price_course_pass", quantity: 1 }],
			metadata: {
				tradely_clerk_user_id: "user_tradely",
				tradely_entitlement: "tradingflow-foundations-lifetime",
			},
			payment_intent_data: {
				metadata: {
					tradely_clerk_user_id: "user_tradely",
					tradely_entitlement: "tradingflow-foundations-lifetime",
				},
			},
			success_url:
				"http://localhost:8250/pricing?checkout=lifetime-success&session_id={CHECKOUT_SESSION_ID}",
			cancel_url: "http://localhost:8250/pricing?checkout=lifetime-cancel",
		});
		expect(params.integration_identifier).toMatch(
			/^tradely_course_pass_[a-z]{8}$/,
		);
		expect(params).not.toHaveProperty("payment_method_types");
	});

	it("keeps integration and idempotency identifiers stable for retries", async () => {
		mocks.checkoutCreate.mockResolvedValue({
			url: "https://checkout.test/course-pass",
		});

		await beginCoursePassCheckoutImpl();
		await beginCoursePassCheckoutImpl();
		const [firstParams, firstOptions] = mocks.checkoutCreate.mock.calls[0];
		const [secondParams, secondOptions] = mocks.checkoutCreate.mock.calls[1];
		expect(secondParams.integration_identifier).toBe(
			firstParams.integration_identifier,
		);
		expect(secondOptions.idempotencyKey).toBe(firstOptions.idempotencyKey);
	});

	it("blocks new Course Pass sessions when checkout is disabled", async () => {
		mocks.env.LIFETIME_CHECKOUT_ENABLED = false;

		await expect(beginCoursePassCheckoutImpl()).rejects.toThrow(
			"Lifetime course checkout is unavailable",
		);
		expect(mocks.checkoutCreate).not.toHaveBeenCalled();
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

	it("rejects a paid session belonging to another Clerk user", async () => {
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
});
