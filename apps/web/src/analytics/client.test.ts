// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	posthog: {
		captureException: vi.fn(),
		has_opted_out_capturing: vi.fn(() => false),
		init: vi.fn(),
		opt_in_capturing: vi.fn(),
		opt_out_capturing: vi.fn(),
	},
}));

vi.mock("@tradely/env/web", () => ({
	env: {
		VITE_APP_RELEASE: "client-contract-test",
		VITE_POSTHOG_HOST: " https://us.i.posthog.com/ ",
		VITE_POSTHOG_KEY: "phc_test_placeholder",
	},
}));

vi.mock("posthog-js", () => ({
	default: mocks.posthog,
}));

import {
	capturePostHogException,
	capturePostHogExceptionWhenReady,
	getPostHogClient,
} from "./client";

describe("browser PostHog initialization contract", () => {
	beforeEach(() => {
		window.localStorage.clear();
		window.localStorage.setItem("tradely.analytics-consent.v1", "granted");
		mocks.posthog.captureException.mockReset();
		mocks.posthog.init.mockReset();
		mocks.posthog.opt_in_capturing.mockReset();
		mocks.posthog.opt_out_capturing.mockReset();
		mocks.posthog.has_opted_out_capturing.mockReturnValue(false);
	});

	it("pins privacy, host, release, and capture settings", async () => {
		await getPostHogClient();

		expect(mocks.posthog.init).toHaveBeenCalledOnce();
		const [token, options] = mocks.posthog.init.mock.calls[0] as [
			string,
			{
				api_host: string;
				before_send: (event: {
					event?: string;
					properties?: Record<string, unknown>;
				}) => {
					event?: string;
					properties?: Record<string, unknown>;
				} | null;
				capture_pageview: boolean;
				disableDeviceModel: boolean;
				disable_conversations: boolean;
				disable_capture_url_hashes: boolean;
				disable_external_dependency_loading: boolean;
				disable_product_tours: boolean;
				disable_web_experiments: boolean;
				mask_all_element_attributes: boolean;
				mask_all_text: boolean;
				opt_out_capturing_by_default: boolean;
				strict_script_versioning: boolean;
			},
		];

		expect(token).toBe("phc_test_placeholder");
		expect(options).toMatchObject({
			api_host: "https://us.i.posthog.com",
			capture_pageview: false,
			disableDeviceModel: true,
			disable_capture_url_hashes: true,
			disable_conversations: true,
			disable_external_dependency_loading: true,
			disable_product_tours: true,
			disable_web_experiments: true,
			mask_all_element_attributes: true,
			mask_all_text: true,
			opt_out_capturing_by_default: true,
			strict_script_versioning: true,
		});

		const event = options.before_send({
			properties: {
				$current_url: "https://tradely.ai/lesson?token=private#fragment",
				$referrer: "https://example.com/ref?email=user@example.com",
				$last_external_referrer_url:
					"https://example.com/landing?session=private",
				$pathname: "/lesson?code=private",
			},
		});
		expect(event).not.toBeNull();
		if (!event)
			throw new Error("before_send unexpectedly dropped a system event");
		expect(event.properties).toMatchObject({
			$current_url: "https://tradely.ai/lesson",
			$referrer: "https://example.com/ref",
			$last_external_referrer_url: "https://example.com/landing",
			$pathname: "/lesson",
			app: "tradely",
			environment: "local",
			event_schema_version: 1,
			runtime: "browser",
			release: "client-contract-test",
		});

		const sanitized = options.before_send({
			event: "lesson_opened",
			properties: {
				distinct_id: "anonymous-id",
				email: "user@example.com",
				lesson_id: "lesson-1",
				token: "phc_test_placeholder",
			},
		});
		expect(sanitized?.properties).toMatchObject({
			$process_person_profile: false,
			distinct_id: "anonymous-id",
			lesson_id: "lesson-1",
			token: "phc_test_placeholder",
		});
		expect(sanitized?.properties).not.toHaveProperty("email");

		const personProperties = options.before_send({
			event: "$identify",
			properties: {
				$set: { auth_provider: "clerk", email: "user@example.com" },
			},
		});
		expect(personProperties?.properties).toMatchObject({
			$set: { auth_provider: "clerk" },
		});
		expect(personProperties?.properties?.$set).not.toHaveProperty("email");

		const identified = options.before_send({
			event: "lesson_completed",
			properties: {
				$is_identified: true,
				lesson_id: "lesson-1",
				lesson_order: 1,
			},
		});
		expect(identified?.properties).toMatchObject({
			$is_identified: true,
			$process_person_profile: true,
		});
		expect(
			options.before_send({ event: "unregistered_event", properties: {} }),
		).toBeNull();
		expect(
			options.before_send({ event: "$identify", properties: {} }),
		).not.toBeNull();
	});

	it("captures a route exception once the consented client is ready", async () => {
		await getPostHogClient();

		await expect(
			capturePostHogExceptionWhenReady(new Error("route failed"), {
				source: "route_boundary",
				route_name: "lesson",
			}),
		).resolves.toBe(true);
		expect(mocks.posthog.captureException).toHaveBeenCalledOnce();
		expect(mocks.posthog.captureException).toHaveBeenCalledWith(
			expect.any(Error),
			{ source: "route_boundary", route_name: "lesson" },
		);
	});

	it("does not capture a route exception after consent is withdrawn", async () => {
		await getPostHogClient();
		mocks.posthog.has_opted_out_capturing.mockReturnValue(true);

		await expect(
			capturePostHogExceptionWhenReady(new Error("route failed"), {
				source: "route_boundary",
			}),
		).resolves.toBe(false);
		expect(mocks.posthog.captureException).not.toHaveBeenCalled();
	});

	it("contains synchronous SDK failures while capturing exceptions", async () => {
		await getPostHogClient();
		mocks.posthog.captureException.mockImplementation(() => {
			throw new Error("PostHog unavailable");
		});

		expect(
			capturePostHogException(new Error("route failed"), {
				source: "route_boundary",
			}),
		).toBe(false);
		await expect(
			capturePostHogExceptionWhenReady(new Error("route failed"), {
				source: "route_boundary",
			}),
		).resolves.toBe(false);
	});
});
