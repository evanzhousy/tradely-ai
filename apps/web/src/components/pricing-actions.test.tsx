// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	capture: vi.fn(),
	captureException: vi.fn(),
	serverFn: vi.fn(),
}));

vi.mock("@tanstack/react-start", () => ({
	useServerFn: () => mocks.serverFn,
}));

vi.mock("@clerk/tanstack-react-start", () => ({
	SignInButton: ({ children }: { children: unknown }) => children,
}));

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

import { PricingAccountActions } from "./pricing-actions";

describe("PricingAccountActions", () => {
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
});
