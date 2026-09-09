// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	location: {
		pathname: "/pricing",
		searchStr: "?checkout=success&session_id=private",
	},
	locale: "en",
	capturing: false,
	pageview: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({
	useLocation: () => mocks.location,
}));
vi.mock("@/i18n/provider", () => ({
	useI18n: () => ({ locale: mocks.locale }),
}));
vi.mock("./context", () => ({
	useAnalytics: () => ({
		isCapturing: mocks.capturing,
		capturePageView: mocks.pageview,
	}),
}));

import { RouteAnalytics } from "./route-analytics";

describe("consented route view scenarios", () => {
	beforeEach(() => {
		mocks.location = {
			pathname: "/pricing",
			searchStr: "?checkout=success&session_id=private",
		};
		mocks.locale = "en";
		mocks.capturing = false;
		mocks.pageview.mockReset().mockReturnValue(true);
	});
	afterEach(cleanup);

	it("captures the current page when consent becomes ready without copying query parameters", () => {
		const page = render(<RouteAnalytics />);
		expect(mocks.pageview).not.toHaveBeenCalled();
		mocks.capturing = true;
		page.rerender(<RouteAnalytics />);
		expect(mocks.pageview.mock.calls).toEqual([
			[{ route_name: "pricing", path: "/pricing", locale: "en" }],
		]);
		mocks.location = { ...mocks.location, searchStr: "?checkout=cancel" };
		page.rerender(<RouteAnalytics />);
		expect(mocks.pageview).toHaveBeenCalledOnce();
	});

	it("classifies auth navigation and uses the latest locale on the next route", () => {
		mocks.capturing = true;
		const page = render(<RouteAnalytics />);
		mocks.locale = "zh";
		page.rerender(<RouteAnalytics />);
		expect(mocks.pageview).toHaveBeenCalledOnce();
		mocks.location = {
			pathname: "/auth/sign-in/",
			searchStr: "?returnTo=private",
		};
		page.rerender(<RouteAnalytics />);
		expect(mocks.pageview).toHaveBeenLastCalledWith({
			route_name: "auth_sign_in",
			path: "/auth/sign-in",
			locale: "zh",
		});
	});

	it("stops navigation capture after withdrawal and resumes on the current page", () => {
		mocks.capturing = true;
		const page = render(<RouteAnalytics />);
		mocks.capturing = false;
		page.rerender(<RouteAnalytics />);
		mocks.location = { pathname: "/", searchStr: "" };
		page.rerender(<RouteAnalytics />);
		expect(mocks.pageview).toHaveBeenCalledOnce();
		mocks.capturing = true;
		page.rerender(<RouteAnalytics />);
		expect(mocks.pageview).toHaveBeenCalledTimes(2);
		expect(mocks.pageview).toHaveBeenLastCalledWith({
			route_name: "home",
			path: "/",
			locale: "en",
		});
	});
});
