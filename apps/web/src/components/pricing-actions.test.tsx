// @vitest-environment jsdom

import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	capture: vi.fn(),
	captureException: vi.fn(),
	serverFn: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("@tanstack/react-start", () => ({
	useServerFn: () => mocks.serverFn,
}));

vi.mock("@/auth/client", () => ({ authIsConfigured: true }));

vi.mock("@/analytics/context", () => ({
	useAnalytics: () => ({
		capture: mocks.capture,
		captureException: mocks.captureException,
	}),
}));

vi.mock("@/i18n/provider", () => ({
	useI18n: () => ({
		t: (key: string) =>
			(
				({
					"pricing.coursePassActive": "Lifetime access active",
					"pricing.manageBilling": "Manage billing",
					"pricing.restorePurchase": "Restore purchase",
					"pricing.restoringPurchase": "Restoring purchase…",
				}) as Record<string, string>
			)[key] ?? key,
	}),
}));

vi.mock("@/server/billing", () => ({
	beginCoursePassCheckout: vi.fn(),
	beginMembershipCheckout: vi.fn(),
	openCustomerPortal: vi.fn(),
	restoreCoursePass: vi.fn(),
}));

import {
	PricingAccountActions,
	PricingCheckoutButton,
} from "./pricing-actions";

describe("PricingAccountActions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});
	afterEach(cleanup);

	it("shows existing Course Pass ownership while new sales are disabled", () => {
		render(
			<PricingAccountActions
				canManageBilling={false}
				canRestoreCoursePass={false}
				showCoursePassStatus={true}
				onAccessChanged={() => {}}
			/>,
		);

		expect(screen.getByRole("status").textContent).toContain(
			"Lifetime access active",
		);
	});

	it("shows Restore Purchase independently of new-sale availability", () => {
		render(
			<PricingAccountActions
				canManageBilling={false}
				canRestoreCoursePass={true}
				showCoursePassStatus={false}
				onAccessChanged={() => {}}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Restore purchase" }),
		).toBeTruthy();
	});

	it("reports verified restoration even if refreshing access fails", async () => {
		mocks.serverFn.mockResolvedValue({
			courseId: "tradingflow-foundations",
			source: "restore",
		});
		const error = new Error("Refresh unavailable");
		render(
			<PricingAccountActions
				canManageBilling={false}
				canRestoreCoursePass
				showCoursePassStatus={false}
				onAccessChanged={async () => {
					throw error;
				}}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Restore purchase" }));
		await waitFor(() =>
			expect(mocks.captureException).toHaveBeenCalledWith(error, {
				source: "billing_action",
				action: "checkout",
			}),
		);
		expect(mocks.capture.mock.calls).toEqual([
			[
				"course_pass_access_verified",
				{ course_id: "tradingflow-foundations", source: "restore" },
			],
		]);
	});

	it("keeps an expected missing purchase separate from an unexpected exception", async () => {
		mocks.serverFn.mockRejectedValue(
			new Error("No verified lifetime purchase was found"),
		);
		render(
			<PricingAccountActions
				canManageBilling={false}
				canRestoreCoursePass
				showCoursePassStatus={false}
				onAccessChanged={() => {}}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Restore purchase" }));
		await waitFor(() =>
			expect(mocks.capture).toHaveBeenCalledWith("billing_action_failed", {
				action: "checkout",
				offer: "lifetime_course",
				reason: "not_found",
			}),
		);
		expect(mocks.captureException).not.toHaveBeenCalled();
	});

	it("tracks portal intent and its failure without claiming a redirect", async () => {
		mocks.serverFn.mockRejectedValue(new Error("No Stripe customer is linked"));
		render(
			<PricingAccountActions
				canManageBilling
				canRestoreCoursePass={false}
				showCoursePassStatus={false}
				onAccessChanged={() => {}}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Manage billing" }));
		await waitFor(() => expect(mocks.capture).toHaveBeenCalledTimes(2));
		expect(mocks.capture.mock.calls).toEqual([
			["billing_action_started", { action: "portal" }],
			["billing_action_failed", { action: "portal", reason: "no_customer" }],
		]);
		expect(mocks.captureException).not.toHaveBeenCalled();
	});

	it.each(["membership", "lifetime_course"] as const)(
		"tracks %s checkout intent and unexpected failures",
		async (offer) => {
			const error = new Error("Checkout unavailable");
			mocks.serverFn.mockRejectedValue(error);
			render(
				<PricingCheckoutButton
					offer={offer}
					configured
					active={false}
					isSignedIn
				/>,
			);
			fireEvent.click(screen.getByRole("button"));
			await waitFor(() =>
				expect(mocks.captureException).toHaveBeenCalledOnce(),
			);
			expect(mocks.capture.mock.calls).toEqual([
				["billing_action_started", { action: "checkout", offer }],
				[
					"billing_action_failed",
					{ action: "checkout", offer, reason: "unavailable" },
				],
			]);
		},
	);
});
