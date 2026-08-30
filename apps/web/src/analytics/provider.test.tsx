// @vitest-environment jsdom

import {
	act,
	cleanup,
	fireEvent,
	render,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getPostHogClient: vi.fn(),
	capturePostHogException: vi.fn(),
	enableGoogleAnalytics: vi.fn(),
	disableGoogleAnalytics: vi.fn(),
	captureGoogleAnalyticsEvent: vi.fn(),
	captureGoogleAnalyticsPageView: vi.fn(),
}));

vi.mock("@tradely/env/web", () => ({
	env: {
		VITE_GOOGLE_ANALYTICS_MEASUREMENT_ID: "G-TEST123",
		VITE_POSTHOG_KEY: "phc_test_placeholder",
	},
}));

vi.mock("./client", () => ({
	capturePostHogException: mocks.capturePostHogException,
	getPostHogClient: mocks.getPostHogClient,
}));

vi.mock("./google", () => ({
	captureGoogleAnalyticsEvent: mocks.captureGoogleAnalyticsEvent,
	captureGoogleAnalyticsPageView: mocks.captureGoogleAnalyticsPageView,
	disableGoogleAnalytics: mocks.disableGoogleAnalytics,
	enableGoogleAnalytics: mocks.enableGoogleAnalytics,
}));

import { useAnalytics } from "./context";
import { AnalyticsProvider } from "./provider";

function ConsentHarness() {
	const { consent, setConsent } = useAnalytics();
	return (
		<button
			type="button"
			aria-label="grant consent"
			onClick={() => setConsent("granted")}
		>
			{consent}
		</button>
	);
}

function CriticalEventHarness() {
	const { capture } = useAnalytics();
	return (
		<button
			type="button"
			aria-label="capture lesson completion"
			onClick={() =>
				capture("lesson_completed", { lesson_id: "lesson-1", lesson_order: 1 })
			}
		>
			capture
		</button>
	);
}

function OperationsHarness() {
	const { capturePageView, identify, resetIdentity } = useAnalytics();
	return (
		<div>
			<button
				type="button"
				aria-label="capture page view"
				onClick={() =>
					capturePageView({
						route_name: "home",
						path: "/",
						locale: "en",
					})
				}
			>
				page view
			</button>
			<button
				type="button"
				aria-label="identify user"
				onClick={() => identify("user_123")}
			>
				identify
			</button>
			<button type="button" aria-label="reset identity" onClick={resetIdentity}>
				reset
			</button>
		</div>
	);
}

function createPostHogClient() {
	return {
		capture: vi.fn(),
		has_opted_out_capturing: vi.fn(() => false),
		identify: vi.fn(),
		opt_in_capturing: vi.fn(),
		opt_out_capturing: vi.fn(),
		reset: vi.fn(),
	};
}

describe("AnalyticsProvider consent readiness", () => {
	afterEach(() => {
		cleanup();
	});

	beforeEach(() => {
		window.localStorage.clear();
		mocks.getPostHogClient.mockReset();
		mocks.capturePostHogException.mockReset();
		mocks.enableGoogleAnalytics.mockReset().mockReturnValue(true);
		mocks.disableGoogleAnalytics.mockReset();
		mocks.captureGoogleAnalyticsEvent.mockReset().mockReturnValue(true);
		mocks.captureGoogleAnalyticsPageView.mockReset().mockReturnValue(true);
	});

	it("defers PostHog initialization until explicit consent", () => {
		render(
			<AnalyticsProvider>
				<ConsentHarness />
			</AnalyticsProvider>,
		);

		expect(mocks.getPostHogClient).not.toHaveBeenCalled();
	});

	it("queues a fast grant until PostHog is ready and captures it once", async () => {
		const posthog = createPostHogClient();
		let resolvePostHog: (client: typeof posthog) => void = () => {};
		mocks.getPostHogClient.mockReturnValue(
			new Promise((resolve) => {
				resolvePostHog = resolve;
			}),
		);

		const { getByRole } = render(
			<AnalyticsProvider>
				<ConsentHarness />
				<CriticalEventHarness />
			</AnalyticsProvider>,
		);

		fireEvent.click(getByRole("button", { name: "grant consent" }));
		expect(posthog.capture).not.toHaveBeenCalled();
		expect(mocks.captureGoogleAnalyticsEvent).toHaveBeenCalledWith(
			"analytics_consent_updated",
			{ status: "granted" },
		);

		await act(async () => {
			resolvePostHog(posthog);
		});
		await waitFor(() => {
			expect(posthog.capture).toHaveBeenCalledOnce();
		});
		expect(posthog.opt_in_capturing).toHaveBeenCalledWith({
			captureEventName: false,
		});
		expect(posthog.capture).toHaveBeenCalledWith(
			"analytics_consent_updated",
			{ status: "granted" },
			{ send_instantly: true, transport: "sendBeacon" },
		);
		expect(mocks.captureGoogleAnalyticsEvent).toHaveBeenCalledWith(
			"analytics_consent_updated",
			{ status: "granted" },
		);
		expect(mocks.captureGoogleAnalyticsEvent).toHaveBeenCalledOnce();

		fireEvent.click(getByRole("button", { name: "grant consent" }));
		expect(posthog.capture).toHaveBeenCalledTimes(1);

		fireEvent.click(getByRole("button", { name: "capture lesson completion" }));
		expect(posthog.capture).toHaveBeenCalledWith(
			"lesson_completed",
			{ lesson_id: "lesson-1", lesson_order: 1 },
			{ send_instantly: true, transport: "sendBeacon" },
		);
	});

	it("replays consented events captured while PostHog is loading", async () => {
		const posthog = createPostHogClient();
		let resolvePostHog: (client: typeof posthog) => void = () => {};
		mocks.getPostHogClient.mockReturnValue(
			new Promise((resolve) => {
				resolvePostHog = resolve;
			}),
		);

		const { getByRole } = render(
			<AnalyticsProvider>
				<ConsentHarness />
				<CriticalEventHarness />
			</AnalyticsProvider>,
		);

		fireEvent.click(getByRole("button", { name: "grant consent" }));
		fireEvent.click(getByRole("button", { name: "capture lesson completion" }));
		expect(posthog.capture).not.toHaveBeenCalled();

		await act(async () => {
			resolvePostHog(posthog);
		});
		await waitFor(() => expect(posthog.capture).toHaveBeenCalledTimes(2));
		expect(posthog.capture).toHaveBeenNthCalledWith(
			1,
			"analytics_consent_updated",
			{ status: "granted" },
			{ send_instantly: true, transport: "sendBeacon" },
		);
		expect(posthog.capture).toHaveBeenNthCalledWith(
			2,
			"lesson_completed",
			{ lesson_id: "lesson-1", lesson_order: 1 },
			{ send_instantly: true, transport: "sendBeacon" },
		);
	});

	it("does not initialize PostHog for a denied choice", () => {
		const posthog = createPostHogClient();
		mocks.getPostHogClient.mockResolvedValue(posthog);
		window.localStorage.setItem("tradely.analytics-consent.v1", "denied");

		render(
			<AnalyticsProvider>
				<ConsentHarness />
			</AnalyticsProvider>,
		);

		expect(mocks.getPostHogClient).not.toHaveBeenCalled();
		expect(posthog.capture).not.toHaveBeenCalled();
		expect(mocks.captureGoogleAnalyticsEvent).not.toHaveBeenCalledWith(
			"analytics_consent_updated",
			{ status: "granted" },
		);
	});

	it("syncs consent withdrawal from another browser tab", async () => {
		const posthog = createPostHogClient();
		mocks.getPostHogClient.mockResolvedValue(posthog);
		window.localStorage.setItem("tradely.analytics-consent.v1", "granted");

		render(
			<AnalyticsProvider>
				<ConsentHarness />
			</AnalyticsProvider>,
		);

		await waitFor(() => expect(posthog.opt_in_capturing).toHaveBeenCalled());
		window.dispatchEvent(
			new StorageEvent("storage", {
				key: "tradely.analytics-consent.v1",
				newValue: "denied",
			}),
		);
		await waitFor(() => expect(posthog.opt_out_capturing).toHaveBeenCalled());
		expect(posthog.reset).toHaveBeenCalledWith(true);
		expect(mocks.disableGoogleAnalytics).toHaveBeenCalled();
	});

	it("swallows PostHog initialization failures without breaking consent", async () => {
		mocks.getPostHogClient.mockRejectedValue(new Error("sdk load failed"));

		const { getByRole } = render(
			<AnalyticsProvider>
				<ConsentHarness />
			</AnalyticsProvider>,
		);

		expect(mocks.getPostHogClient).not.toHaveBeenCalled();
		fireEvent.click(getByRole("button", { name: "grant consent" }));
		await waitFor(() => expect(mocks.getPostHogClient).toHaveBeenCalledOnce());
		expect(mocks.captureGoogleAnalyticsEvent).toHaveBeenCalledWith(
			"analytics_consent_updated",
			{ status: "granted" },
		);
	});

	it("contains PostHog event and identity failures without breaking UI actions", async () => {
		const posthog = createPostHogClient();
		mocks.getPostHogClient.mockResolvedValue(posthog);
		window.localStorage.setItem("tradely.analytics-consent.v1", "granted");
		posthog.capture.mockImplementation(() => {
			throw new Error("capture failed");
		});
		posthog.identify.mockImplementation(() => {
			throw new Error("identify failed");
		});
		posthog.reset.mockImplementation(() => {
			throw new Error("reset failed");
		});

		const { getByRole } = render(
			<AnalyticsProvider>
				<OperationsHarness />
			</AnalyticsProvider>,
		);

		await waitFor(() => expect(posthog.opt_in_capturing).toHaveBeenCalled());
		expect(() =>
			fireEvent.click(getByRole("button", { name: "capture page view" })),
		).not.toThrow();
		expect(() =>
			fireEvent.click(getByRole("button", { name: "identify user" })),
		).not.toThrow();
		expect(() =>
			fireEvent.click(getByRole("button", { name: "reset identity" })),
		).not.toThrow();
		expect(mocks.captureGoogleAnalyticsPageView).toHaveBeenCalledWith({
			route_name: "home",
			path: "/",
			locale: "en",
		});
	});

	it("keeps consent usable when browser storage is unavailable", async () => {
		const posthog = createPostHogClient();
		mocks.getPostHogClient.mockResolvedValue(posthog);
		const setItem = vi
			.spyOn(Storage.prototype, "setItem")
			.mockImplementation(() => {
				throw new Error("storage unavailable");
			});

		try {
			const { getByRole } = render(
				<AnalyticsProvider>
					<ConsentHarness />
				</AnalyticsProvider>,
			);

			expect(mocks.getPostHogClient).not.toHaveBeenCalled();
			expect(() =>
				fireEvent.click(getByRole("button", { name: "grant consent" })),
			).not.toThrow();
			await waitFor(() => expect(posthog.opt_in_capturing).toHaveBeenCalled());
			expect(mocks.captureGoogleAnalyticsEvent).toHaveBeenCalledWith(
				"analytics_consent_updated",
				{ status: "granted" },
			);
		} finally {
			setItem.mockRestore();
		}
	});

	it("retries PostHog after a later consent grant", async () => {
		const posthog = createPostHogClient();
		mocks.getPostHogClient
			.mockRejectedValueOnce(new Error("sdk load failed"))
			.mockResolvedValueOnce(posthog);

		const { getByRole } = render(
			<AnalyticsProvider>
				<ConsentHarness />
			</AnalyticsProvider>,
		);

		fireEvent.click(getByRole("button", { name: "grant consent" }));
		await waitFor(() => expect(mocks.getPostHogClient).toHaveBeenCalledOnce());
		fireEvent.click(getByRole("button", { name: "grant consent" }));
		await waitFor(() => expect(posthog.capture).toHaveBeenCalledOnce());
		expect(mocks.getPostHogClient).toHaveBeenCalledTimes(2);
		expect(mocks.captureGoogleAnalyticsEvent).toHaveBeenCalledWith(
			"analytics_consent_updated",
			{ status: "granted" },
		);
	});
});
