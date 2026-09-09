// @vitest-environment jsdom

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@tradely/env/web", () => ({
	env: {
		VITE_APP_RELEASE: "sdk-integration-test",
		VITE_POSTHOG_HOST: "https://us.i.posthog.com",
		VITE_POSTHOG_KEY: "phc_test_placeholder",
	},
}));

import { applyBrowserCaptureConsent } from "./browser-consent";
import { getPostHogClient, type PostHogClient } from "./client";

describe("bundled PostHog browser SDK", () => {
	let client: PostHogClient;
	const captured: { event: string; properties: Record<string, unknown> }[] = [];
	const originalOnError = window.onerror;
	const originalOnRejection = window.onunhandledrejection;

	beforeAll(async () => {
		vi.useFakeTimers();
		// Exercise the real SDK and send boundary without contacting PostHog.
		vi.spyOn(XMLHttpRequest.prototype, "send").mockImplementation(() => {});
		window.localStorage.setItem("tradely.analytics-consent.v2", "denied");
		client = await getPostHogClient();
		client.on("eventCaptured", (event) => captured.push(event));
	});

	afterAll(() => {
		client?.opt_out_capturing();
		window.onerror = originalOnError;
		window.onunhandledrejection = originalOnRejection;
		window.localStorage.clear();
		vi.clearAllTimers();
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it("provides web vitals and error observers without loading CDN scripts", () => {
		const extensions = (
			window as Window & {
				__PosthogExtensions__?: {
					postHogWebVitalsCallbacks?: Record<string, unknown>;
				};
			}
		).__PosthogExtensions__;
		for (const metric of ["onFCP", "onLCP", "onCLS", "onINP"]) {
			expect(extensions?.postHogWebVitalsCallbacks?.[metric]).toBeTypeOf(
				"function",
			);
		}
		expect(window.onerror).not.toBe(originalOnError);
		expect(window.onunhandledrejection).not.toBe(originalOnRejection);
		expect(document.querySelector('script[src*="posthog"]')).toBeNull();
	});

	it("captures redacted automatic exceptions only while consented", () => {
		const error = new Error(
			"Failure for learner@example.com with Bearer private-token",
		);
		error.stack =
			"Error: failure\n    at loadLesson (https://www.tradely.ai/assets/app.js?token=private:12:3)";
		const trigger = () =>
			window.onerror?.(
				error.message,
				"https://www.tradely.ai/assets/app.js",
				12,
				3,
				error,
			);

		trigger();
		expect(captured).toHaveLength(0);
		client.opt_in_capturing({ captureEventName: false });
		trigger();
		expect(captured).toHaveLength(1);
		expect(captured[0]).toMatchObject({
			event: "$exception",
			properties: {
				app: "tradely",
				runtime: "browser",
				release: "sdk-integration-test",
			},
		});
		const payload = JSON.stringify(captured[0]);
		expect(payload).toContain("[redacted-email]");
		expect(payload).not.toContain("learner@example.com");
		expect(payload).not.toContain("private");
		client.opt_out_capturing();
		trigger();
		expect(captured).toHaveLength(1);
	});

	it("clears pending heatmap clicks and ignores interactions during withdrawal", () => {
		captured.length = 0;
		const button = document.createElement("button");
		document.body.append(button);
		const click = (x: number) =>
			button.dispatchEvent(
				new MouseEvent("click", { bubbles: true, clientX: x, clientY: 2 }),
			);
		applyBrowserCaptureConsent(client, true);
		click(11);
		applyBrowserCaptureConsent(client, false);
		click(99);
		applyBrowserCaptureConsent(client, true);
		click(22);
		vi.advanceTimersByTime(6000);
		const heatmaps = captured.filter((event) => event.event === "$$heatmap");
		expect(heatmaps).toHaveLength(1);
		const points = Object.values(
			heatmaps[0]?.properties.$heatmap_data as Record<string, { x: number }[]>,
		).flat();
		expect(points.map((point) => point.x)).toEqual([22]);
		applyBrowserCaptureConsent(client, false);
		button.remove();
	});
});
