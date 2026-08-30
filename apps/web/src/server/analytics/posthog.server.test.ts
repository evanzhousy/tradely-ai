import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getCookie: vi.fn(),
	captureExceptionImmediate: vi.fn(),
	captureImmediate: vi.fn(),
	posthogConstructor: vi.fn(),
}));

vi.mock("@tanstack/react-start/server", () => ({
	getCookie: mocks.getCookie,
}));

vi.mock("@tanstack/react-start/server-only", () => ({}));

vi.mock("@tradely/env/server", () => ({
	env: {
		NODE_ENV: "test",
		POSTHOG_HOST: "https://us.i.posthog.com",
		POSTHOG_PROJECT_TOKEN: "phc_test_placeholder",
	},
}));

vi.mock("posthog-node", () => ({
	PostHog: class MockPostHog {
		constructor(_token: string, options: unknown) {
			mocks.posthogConstructor(options);
		}

		captureExceptionImmediate = mocks.captureExceptionImmediate;
		captureImmediate = mocks.captureImmediate;
	},
}));

import {
	captureServerException,
	captureServerRouteTiming,
} from "./posthog.server";

describe("server PostHog telemetry boundary", () => {
	beforeEach(() => {
		mocks.getCookie.mockReturnValue("granted");
		mocks.captureExceptionImmediate.mockReset().mockResolvedValue(undefined);
		mocks.captureImmediate.mockReset().mockResolvedValue(undefined);
		mocks.posthogConstructor.mockReset();
		delete process.env.VERCEL_GIT_COMMIT_SHA;
		delete process.env.VITE_APP_RELEASE;
	});

	it("contains SDK construction failures without rejecting the request", async () => {
		mocks.posthogConstructor.mockImplementation(() => {
			throw new Error("PostHog unavailable");
		});

		await expect(
			captureServerRouteTiming({
				surface: "course_progress",
				operation: "course_progress_read",
				duration_ms: 2_000,
				status: "ok",
				signed_in: false,
			}),
		).resolves.toBe(false);
		await expect(
			captureServerException(new Error("unexpected"), {
				source: "progress",
				operation: "course_progress_read",
			}),
		).resolves.toBe(false);
		expect(mocks.captureImmediate).not.toHaveBeenCalled();
		expect(mocks.captureExceptionImmediate).not.toHaveBeenCalled();
	});

	it("keeps server exceptions consented and release-correlated", async () => {
		process.env.VERCEL_GIT_COMMIT_SHA = `  ${"a".repeat(140)}  `;

		await expect(
			captureServerException(new Error("Stripe request failed"), {
				source: "billing",
				operation: "stripe_checkout",
				userId: "user_123",
			}),
		).resolves.toBe(true);

		expect(mocks.captureExceptionImmediate).toHaveBeenCalledOnce();
		expect(mocks.posthogConstructor).toHaveBeenCalledWith(
			expect.objectContaining({
				host: "https://us.i.posthog.com",
				personProfiles: "identified_only",
				before_send: expect.any(Function),
				fetchRetryCount: 1,
				fetchRetryDelay: 250,
				requestTimeout: 1_500,
			}),
		);
		const [error, distinctId, properties] =
			mocks.captureExceptionImmediate.mock.calls[0];
		expect(error).toBeInstanceOf(Error);
		expect(distinctId).toBe("user_123");
		expect(properties).toMatchObject({
			$process_person_profile: true,
			app: "tradely",
			environment: "local",
			release: "a".repeat(120),
			source: "billing",
		});
		const constructorOptions = mocks.posthogConstructor.mock.calls[0]?.[0] as {
			before_send: (event: unknown) => unknown;
		};
		const beforeSend = constructorOptions.before_send;
		const sanitized = (beforeSend as (event: unknown) => unknown)({
			event: "server_route_timing",
			properties: {
				distinct_id: "tradely-server",
				email: "user@example.com",
				$last_external_referrer_url:
					"https://example.com/landing?token=private",
				operation: "course_progress_read",
				token: "phc_test_placeholder",
				runtime: "node",
			},
		});
		expect(sanitized).toMatchObject({
			properties: {
				distinct_id: "tradely-server",
				operation: "course_progress_read",
				token: "phc_test_placeholder",
				$last_external_referrer_url: "https://example.com/landing",
				runtime: "node",
			},
		});
		expect(sanitized).not.toHaveProperty("properties.email");
		const personProperties = beforeSend({
			event: "$identify",
			properties: {
				$set: { auth_provider: "clerk", email: "user@example.com" },
			},
		});
		expect(personProperties).toMatchObject({
			properties: { $set: { auth_provider: "clerk" } },
		});
		expect(personProperties).not.toHaveProperty("properties.$set.email");
	});

	it("emits slow route timing with local release fallback", async () => {
		await expect(
			captureServerRouteTiming({
				surface: "course_progress",
				operation: "course_progress_read",
				duration_ms: 1_234.6,
				status: "ok",
				signed_in: false,
			}),
		).resolves.toBe(true);

		expect(mocks.captureImmediate).toHaveBeenCalledWith({
			distinctId: "tradely-server",
			event: "server_route_timing",
			properties: expect.objectContaining({
				$process_person_profile: false,
				duration_ms: 1_235,
				release: "local",
				status: "ok",
				signed_in: false,
			}),
		});
	});

	it("does not construct or call the transport without consent", async () => {
		mocks.getCookie.mockReturnValue("denied");

		await expect(
			captureServerRouteTiming({
				surface: "course_progress",
				operation: "course_progress_read",
				duration_ms: 2_000,
				status: "unavailable",
				signed_in: true,
			}),
		).resolves.toBe(false);
		await expect(
			captureServerException(new Error("unexpected"), {
				source: "progress",
				operation: "course_progress_read",
			}),
		).resolves.toBe(false);

		expect(mocks.captureImmediate).not.toHaveBeenCalled();
		expect(mocks.captureExceptionImmediate).not.toHaveBeenCalled();
	});
});
