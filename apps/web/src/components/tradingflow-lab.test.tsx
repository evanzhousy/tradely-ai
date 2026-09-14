// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LOCALE_STORAGE_KEY } from "@/i18n/messages";
import { LocaleProvider } from "@/i18n/provider";

const analytics = vi.hoisted(() => ({
	consent: "denied",
	capture: vi.fn((_event: string, _properties?: unknown) => true),
}));
vi.mock("@/analytics/context", () => ({
	useAnalytics: () => ({
		...analytics,
		isCapturing: analytics.consent === "granted",
	}),
}));

import { TradingFlowLab } from "./tradingflow-lab";

afterEach(cleanup);
beforeEach(() => {
	analytics.capture.mockClear();
	analytics.consent = "denied";
	localStorage.setItem(LOCALE_STORAGE_KEY, "en");
});
describe("guided partner lab", () => {
	it("allows a guest to read the example and open the exact Recipe without registration or tracking", () => {
		render(
			<LocaleProvider>
				<TradingFlowLab lessonId="unusual-activity" />
			</LocaleProvider>,
		);
		const link = screen.getByRole("link", { name: "Run this lesson’s Recipe" });
		expect(link.getAttribute("target")).toBe("_blank");
		expect(link.getAttribute("rel")).toBe("noopener noreferrer");
		expect(link.getAttribute("href")).toContain(
			"/app/cookbooks/unusual-options-activity?",
		);
		expect(link.getAttribute("href")).not.toContain("utm_");
		expect(screen.queryByRole("button", { name: /sign|register/i })).toBeNull();
		fireEvent.click(screen.getByText("Review the free worked example"));
		expect(screen.getByText(/Illustrative contract A/)).toBeTruthy();
	});
	it("adds bounded attribution only with consent and never reports a successful run on click", () => {
		analytics.consent = "granted";
		render(
			<LocaleProvider>
				<TradingFlowLab lessonId="market-recap" />
			</LocaleProvider>,
		);
		const link = screen.getByRole("link", { name: "Run this lesson’s Recipe" });
		expect(link.getAttribute("href")).toContain("tf_lab=market-recap");
		fireEvent.click(link);
		expect(analytics.capture).toHaveBeenCalledWith(
			"tradingflow_link_opened",
			expect.objectContaining({
				lab_id: "market-recap",
				surface: "lesson_lab",
			}),
		);
		expect(
			analytics.capture.mock.calls.every(
				([event]) => !String(event).includes("completed"),
			),
		).toBe(true);
	});
	it("renders the lab and cost boundary in Chinese", () => {
		localStorage.setItem(LOCALE_STORAGE_KEY, "zh");
		render(
			<LocaleProvider>
				<TradingFlowLab lessonId="gamma-exposure" />
			</LocaleProvider>,
		);
		expect(screen.getByRole("link", { name: "运行本课 Recipe" })).toBeTruthy();
		expect(screen.getByText(/课程和示例练习免费/)).toBeTruthy();
	});
});
