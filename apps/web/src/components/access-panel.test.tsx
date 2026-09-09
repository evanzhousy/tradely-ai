// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	capturing: false,
	delivered: vi.fn(),
	capture: vi.fn(),
}));
vi.mock("@/analytics/context", () => ({
	useAnalytics: () => ({
		capture: mocks.capture,
		isCapturing: mocks.capturing,
	}),
}));
vi.mock("@/auth/client", () => ({ authIsConfigured: false }));
vi.mock("@/i18n/provider", () => ({
	useI18n: () => ({ t: (key: string) => key }),
}));

import { AccessPanel } from "./access-panel";

describe("visible billing availability tracking", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.capturing = false;
		mocks.capture.mockImplementation((...args: unknown[]) => {
			if (!mocks.capturing) return false;
			mocks.delivered(...args);
			return true;
		});
	});
	afterEach(cleanup);

	it("captures an existing unavailable state when consent becomes ready", () => {
		const panel = (
			<AccessPanel access={{ allowed: false, reason: "billing-unavailable" }} />
		);
		const page = render(panel);
		expect(mocks.delivered).not.toHaveBeenCalled();
		mocks.capturing = true;
		page.rerender(
			<AccessPanel
				access={{ allowed: false, reason: "billing-unavailable" }}
			/>,
		);
		expect(mocks.delivered).toHaveBeenCalledWith("billing_status_unavailable", {
			surface: "lesson_access",
		});
		page.rerender(
			<AccessPanel
				access={{ allowed: false, reason: "billing-unavailable" }}
			/>,
		);
		expect(mocks.delivered).toHaveBeenCalledOnce();
	});

	it("counts a new unavailable episode after recovery or renewed consent", () => {
		mocks.capturing = true;
		const page = render(
			<AccessPanel
				access={{ allowed: false, reason: "billing-unavailable" }}
			/>,
		);
		page.rerender(
			<AccessPanel access={{ allowed: false, reason: "signed-out" }} />,
		);
		page.rerender(
			<AccessPanel
				access={{ allowed: false, reason: "billing-unavailable" }}
			/>,
		);
		expect(mocks.delivered).toHaveBeenCalledTimes(2);
		mocks.capturing = false;
		page.rerender(
			<AccessPanel
				access={{ allowed: false, reason: "billing-unavailable" }}
			/>,
		);
		mocks.capturing = true;
		page.rerender(
			<AccessPanel
				access={{ allowed: false, reason: "billing-unavailable" }}
			/>,
		);
		expect(mocks.delivered).toHaveBeenCalledTimes(3);
	});
});
