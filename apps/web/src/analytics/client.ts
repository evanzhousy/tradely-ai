import { env } from "@tradely/env/web";

import { applyBrowserCaptureConsent } from "./browser-consent";

import {
	ANALYTICS_CONSENT_STORAGE_KEY,
	parseAnalyticsConsent,
} from "./consent";
import type { ExceptionContext } from "./context";
import {
	ANALYTICS_EVENT_SCHEMA_VERSION,
	type AnalyticsEventMap,
	type AnalyticsEventName,
	analyticsEnvironment,
	isRegisteredAnalyticsEvent,
	pruneAnalyticsEventProperties,
	sanitizeAnalyticsEventUrlProperties,
} from "./events";
import { redactPostHogExceptions } from "./exception-payload";
import { normalizePostHogHost } from "./posthog-config";
import {
	redactAnalyticsPersonProperties,
	safeAnalyticsError,
} from "./redaction";
import { normalizeAnalyticsRelease } from "./release";
import { replayPrivacyOptions, sanitizeHeatmapUrls } from "./replay-privacy";

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
	// These extensions normally load from PostHog's CDN. Bundle only the
	// permitted features, inside the same consent-gated lazy load as the client.
	clientPromise = Promise.all([
		import("posthog-js"),
		import("posthog-js/dist/exception-autocapture"),
		import("posthog-js/dist/web-vitals"),
		import("posthog-js/dist/posthog-recorder"),
	])
		.then(([{ default: client }]) => {
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
				session_recording: replayPrivacyOptions,
				disable_surveys: true,
				enable_recording_console_log: false,
				// Replay needs the project's JSON remote configuration. Optional
				// scripts and feature-flag evaluation remain disabled.
				advanced_disable_flags: false,
				advanced_disable_feature_flags: true,
				advanced_disable_feature_flags_on_first_load: true,
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
					if (event.event === "$exception") {
						redactPostHogExceptions(event.properties);
					}
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
					sanitizeHeatmapUrls(event.properties);
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
			applyBrowserCaptureConsent(
				client,
				persistedAnalyticsConsent() === "granted",
			);
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

const ANONYMOUS_VISITS_INSTANCE = "tradely_anonymous_visits";
type AnonymousVisitClient =
	typeof import("posthog-js/dist/module.slim")["default"];
let anonymousClientPromise: Promise<AnonymousVisitClient> | null = null;

function whenBrowserIdle(): Promise<void> {
	return new Promise((resolve) => {
		const idle = (
			window as Window & {
				requestIdleCallback?: (
					callback: () => void,
					options?: { timeout: number },
				) => number;
			}
		).requestIdleCallback;
		if (idle) idle(() => resolve(), { timeout: 4000 });
		else window.setTimeout(resolve, 1500);
	});
}

/**
 * A second PostHog instance that only counts page views while a visitor has not yet chosen
 * Allow analytics or Use necessary only. Cookieless mode writes no cookies or browser storage;
 * PostHog tells visitors apart for one day with a server-side hash. It loads the slim SDK build,
 * after the page is idle, and sends nothing but `$pageview`.
 */
function getAnonymousVisitClient(): Promise<AnonymousVisitClient> {
	if (anonymousClientPromise) return anonymousClientPromise;
	anonymousClientPromise = whenBrowserIdle()
		// The slim build has capture without the bundled extensions: about half the core's size.
		.then(() => import("posthog-js/dist/module.slim"))
		.then(({ default: posthog }) =>
			posthog.init(
				env.VITE_POSTHOG_KEY as string,
				{
					api_host: normalizePostHogHost(env.VITE_POSTHOG_HOST),
					ui_host: "https://us.posthog.com",
					defaults: "2026-05-30",
					strict_script_versioning: true,
					disable_external_dependency_loading: true,
					disable_capture_url_hashes: true,
					disableDeviceModel: true,
					cookieless_mode: "always",
					persistence: "memory",
					persistence_name: ANONYMOUS_VISITS_INSTANCE,
					autocapture: false,
					rageclick: false,
					capture_pageview: false,
					capture_pageleave: false,
					capture_dead_clicks: false,
					capture_heatmaps: false,
					capture_exceptions: false,
					capture_performance: false,
					disable_session_recording: true,
					disable_surveys: true,
					disable_conversations: true,
					disable_product_tours: true,
					disable_web_experiments: true,
					advanced_disable_flags: true,
					advanced_disable_feature_flags: true,
					advanced_disable_feature_flags_on_first_load: true,
					person_profiles: "never",
					respect_dnt: true,
					before_send: (event) => {
						if (event?.event !== "$pageview" || !event.properties) return null;
						sanitizeAnalyticsEventUrlProperties(event.properties);
						event.properties.app = "tradely";
						event.properties.event_schema_version =
							ANALYTICS_EVENT_SCHEMA_VERSION;
						event.properties.environment = analyticsEnvironment(
							window.location.hostname,
						);
						event.properties.runtime = "browser";
						event.properties.release = appRelease;
						event.properties.visit_count = "anonymous";
						return event;
					},
				},
				ANONYMOUS_VISITS_INSTANCE,
			),
		)
		.catch((error) => {
			anonymousClientPromise = null;
			throw error;
		});
	return anonymousClientPromise;
}

/** Counts one anonymous page view; `stillAllowed` is re-checked once the SDK has loaded. */
export function captureAnonymousPageView(
	properties: AnalyticsEventMap["page_viewed"],
	stillAllowed: () => boolean,
): void {
	void getAnonymousVisitClient()
		.then((client) => {
			if (!stillAllowed()) return;
			client.capture("$pageview", {
				...properties,
				$current_url: `${window.location.origin}${properties.path}`,
				$pathname: properties.path,
			});
		})
		.catch(() => {
			// Counting is best effort and must never affect the page.
		});
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

/** Operational reads use the same initialized, consent-gated client as exceptions. */
export function captureLearningReadOutcome(
	properties: AnalyticsEventMap["learning_read_finished"],
) {
	try {
		if (!activeClient || activeClient.has_opted_out_capturing()) return false;
		return Boolean(activeClient.capture("learning_read_finished", properties));
	} catch {
		return false;
	}
}
