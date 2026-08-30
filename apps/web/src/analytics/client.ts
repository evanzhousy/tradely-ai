import { env } from "@tradely/env/web";

import {
	ANALYTICS_CONSENT_STORAGE_KEY,
	parseAnalyticsConsent,
} from "./consent";
import type { ExceptionContext } from "./context";
import {
	ANALYTICS_EVENT_SCHEMA_VERSION,
	type AnalyticsEventName,
	analyticsEnvironment,
	isRegisteredAnalyticsEvent,
	pruneAnalyticsEventProperties,
	sanitizeAnalyticsEventUrlProperties,
} from "./events";
import { normalizePostHogHost } from "./posthog-config";
import {
	redactAnalyticsPersonProperties,
	safeAnalyticsError,
} from "./redaction";
import { normalizeAnalyticsRelease } from "./release";

export type PostHogClient = typeof import("posthog-js")["default"];

const appRelease = normalizeAnalyticsRelease(env.VITE_APP_RELEASE);

function persistedAnalyticsConsent() {
	if (typeof window === "undefined") return "unknown" as const;
	try {
		return parseAnalyticsConsent(
			window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY),
		);
	} catch {
		return "unknown" as const;
	}
}

let clientPromise: Promise<PostHogClient> | null = null;
let activeClient: PostHogClient | null = null;

export function getPostHogClient(): Promise<PostHogClient> {
	if (clientPromise) return clientPromise;
	clientPromise = import("posthog-js")
		.then(({ default: client }) => {
			client.init(env.VITE_POSTHOG_KEY as string, {
				api_host: normalizePostHogHost(env.VITE_POSTHOG_HOST),
				ui_host: "https://us.posthog.com",
				defaults: "2026-05-30",
				strict_script_versioning: true,
				disable_external_dependency_loading: true,
				disable_capture_url_hashes: true,
				disableDeviceModel: true,
				autocapture: false,
				mask_all_text: true,
				mask_all_element_attributes: true,
				capture_pageview: false,
				capture_pageleave: false,
				capture_dead_clicks: false,
				capture_heatmaps: false,
				disable_conversations: true,
				disable_product_tours: true,
				disable_web_experiments: true,
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
					if (
						typeof event?.event === "string" &&
						!isRegisteredAnalyticsEvent(event.event)
					) {
						return null;
					}
					if (!event?.properties) return event;
					redactAnalyticsPersonProperties(event.properties.$set);
					redactAnalyticsPersonProperties(event.properties.$set_once);
					const eventWithPersonSets = event as typeof event & {
						$set?: unknown;
						$set_once?: unknown;
					};
					redactAnalyticsPersonProperties(eventWithPersonSets.$set);
					redactAnalyticsPersonProperties(eventWithPersonSets.$set_once);
					if (typeof event.event === "string" && !event.event.startsWith("$")) {
						pruneAnalyticsEventProperties(
							event.event as AnalyticsEventName,
							event.properties,
						);
						event.properties.$process_person_profile =
							event.properties.$is_identified === true;
					}
					sanitizeAnalyticsEventUrlProperties(event.properties);
					event.properties.app = "tradely";
					event.properties.event_schema_version =
						ANALYTICS_EVENT_SCHEMA_VERSION;
					event.properties.environment = analyticsEnvironment(
						window.location.hostname,
					);
					event.properties.runtime = "browser";
					event.properties.release = appRelease;
					return event;
				},
			});
			if (persistedAnalyticsConsent() === "granted") {
				client.opt_in_capturing({ captureEventName: false });
			} else {
				client.opt_out_capturing();
			}
			activeClient = client;
			return client;
		})
		.catch((error) => {
			clientPromise = null;
			activeClient = null;
			throw error;
		});
	return clientPromise;
}

export function capturePostHogException(
	error: unknown,
	context: ExceptionContext,
): boolean {
	try {
		if (!activeClient || activeClient.has_opted_out_capturing()) return false;
		activeClient.captureException(safeAnalyticsError(error), context);
		return true;
	} catch {
		return false;
	}
}

export async function capturePostHogExceptionWhenReady(
	error: unknown,
	context: ExceptionContext,
): Promise<boolean> {
	try {
		if (persistedAnalyticsConsent() !== "granted") return false;
		const client = activeClient ?? (await getPostHogClient().catch(() => null));
		if (!client || client.has_opted_out_capturing()) return false;
		client.captureException(safeAnalyticsError(error), context);
		return true;
	} catch {
		return false;
	}
}
