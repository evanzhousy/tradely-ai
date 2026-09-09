// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const analytics = vi.hoisted(() => ({
	consent: "granted",
	capture: vi.fn((_event: string, _properties: unknown) => true),
}));
vi.mock("@/analytics/context", () => ({ useAnalytics: () => analytics }));

import GexDemo from "./gex-demo";
import IvCrushDemo from "./iv-crush-demo";
import OiVolumeDemo from "./oi-volume-demo";

afterEach(cleanup);
beforeEach(() => {
	analytics.consent = "granted";
	analytics.capture.mockClear();
});

describe("public examples and consented funnel", () => {
	it("does not count a render; records first interaction and correct completion once", () => {
		render(<GexDemo />);
		expect(analytics.capture).not.toHaveBeenCalled();
		fireEvent.click(
			screen.getByRole("radio", {
				name: "Unknown; +500 is only the known subtotal",
			}),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Check understanding" }),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Check understanding" }),
		);
		expect(analytics.capture.mock.calls.map((call) => call[0])).toEqual([
			"guide_demo_started",
			"guide_demo_completed",
		]);
		expect(screen.getByRole("status").textContent).toContain("Correct.");
	});
	it("never backfills a run started before consent", () => {
		analytics.consent = "denied";
		const view = render(<GexDemo />);
		fireEvent.click(screen.getByRole("radio", { name: "+500" }));
		analytics.consent = "granted";
		view.rerender(<GexDemo />);
		fireEvent.click(
			screen.getByRole("radio", {
				name: "Unknown; +500 is only the known subtotal",
			}),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Check understanding" }),
		);
		expect(analytics.capture).not.toHaveBeenCalled();
	});
	it("treats a reset/remount as a new run, and withholds completion when consent is revoked", () => {
		const view = render(<GexDemo key="first" />);
		fireEvent.click(
			screen.getByRole("radio", {
				name: "Unknown; +500 is only the known subtotal",
			}),
		);
		analytics.consent = "denied";
		view.rerender(<GexDemo key="first" />);
		fireEvent.click(
			screen.getByRole("button", { name: "Check understanding" }),
		);
		expect(analytics.capture).toHaveBeenCalledTimes(1);
		analytics.consent = "granted";
		view.rerender(<GexDemo key="reset" />);
		fireEvent.click(
			screen.getByRole("radio", {
				name: "Unknown; +500 is only the known subtotal",
			}),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Check understanding" }),
		);
		expect(analytics.capture).toHaveBeenCalledTimes(3);
	});
	it("advances the two ledgers and keeps the final trade from being counted again", () => {
		render(<OiVolumeDemo />);
		const next = screen.getByRole("button", { name: "Record next trade" });
		for (let i = 0; i < 3; i++) fireEvent.click(next);
		expect(next.hasAttribute("disabled")).toBe(true);
		expect(screen.getByText("190")).toBeDefined();
		expect(screen.getByText("140")).toBeDefined();
	});
	it("changes the supplied IV quote scenario without claiming a model forecast", () => {
		render(<IvCrushDemo />);
		fireEvent.click(screen.getByRole("button", { name: "Smaller rise" }));
		expect(screen.getByText("-$200")).toBeDefined();
		fireEvent.click(screen.getByRole("button", { name: "Larger rise" }));
		expect(screen.getByText("$300")).toBeDefined();
	});
});
