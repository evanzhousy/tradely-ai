import { env } from "@tradely/env/web";

import type { ExceptionContext } from "./context";
import { analyticsEnvironment, sanitizeAnalyticsUrl } from "./events";

export type PostHogClient = typeof import("posthog-js")["default"];

let clientPromise: Promise<PostHogClient> | null = null;
let activeClient: PostHogClient | null = null;

function safeError(error: unknown): Error {
	const source =
		error instanceof Error ? error : new Error("Unknown client error");
	const safe = new Error(
		source.message
			.replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[redacted-email]")
			.replace(
				/([?&](?:token|key|secret|session|code)=)[^&#\s]+/gi,
				"$1[redacted]",
			)
			.slice(0, 500),
	);
	safe.name = source.name.slice(0, 120);
	if (source.stack) {
		safe.stack = source.stack
			.replace(
				/([?&](?:token|key|secret|session|code)=)[^&#\s)]+/gi,
				"$1[redacted]",
			)
			.slice(0, 12_000);
	}
	return safe;
}

export function getPostHogClient(): Promise<PostHogClient> {
	if (clientPromise) return clientPromise;
	clientPromise = import("posthog-js").then(({ default: client }) => {
		client.init(env.VITE_POSTHOG_KEY as string, {
			api_host: env.VITE_POSTHOG_HOST ?? "https://us.i.posthog.com",
			ui_host: "https://us.posthog.com",
			defaults: "2026-05-30",
			autocapture: false,
			capture_pageview: false,
			capture_pageleave: false,
			capture_dead_clicks: false,
			capture_heatmaps: false,
			capture_exceptions: {
				capture_unhandled_errors: true,
				capture_unhandled_rejections: true,
				capture_console_errors: false,
			},
			capture_performance: {
				network_timing: false,
				web_vitals: true,
				web_vitals_allowed_metrics: ["LCP", "CLS", "FCP", "INP"],
				web_vitals_attribution: false,
			},
			disable_session_recording: true,
			disable_surveys: true,
			enable_recording_console_log: false,
			advanced_disable_flags: true,
			person_profiles: "identified_only",
			persistence: "localStorage+cookie",
			cross_subdomain_cookie: false,
			secure_cookie: window.location.protocol === "https:",
			respect_dnt: true,
			opt_out_capturing_by_default: true,
			opt_out_persistence_by_default: true,
			opt_out_capturing_persistence_type: "localStorage",
			consent_persistence_name: "tradely_posthog_consent",
			property_denylist: [
				"$element_text",
				"$elements_chain",
				"$exception_personURL",
			],
			before_send: (event) => {
				if (!event?.properties) return event;
				for (const key of [
					"$current_url",
					"$initial_current_url",
					"$referrer",
					"$initial_referrer",
				] as const) {
					event.properties[key] = sanitizeAnalyticsUrl(event.properties[key]);
				}
				event.properties.app = "tradely";
				event.properties.environment = analyticsEnvironment(
					window.location.hostname,
				);
				return event;
			},
		});
		activeClient = client;
		return client;
	});
	return clientPromise;
}

export function capturePostHogException(
	error: unknown,
	context: ExceptionContext,
): boolean {
	if (!activeClient || activeClient.has_opted_out_capturing()) return false;
	activeClient.captureException(safeError(error), context);
	return true;
}
