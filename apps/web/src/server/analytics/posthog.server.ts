import "@tanstack/react-start/server-only";

import { getCookie } from "@tanstack/react-start/server";
import { env } from "@tradely/env/server";
import { type EventMessage, PostHog } from "posthog-node";

import { ANALYTICS_CONSENT_COOKIE_NAME } from "@/analytics/consent";
import type { AnalyticsEventName } from "@/analytics/events";
import {
	ANALYTICS_EVENT_SCHEMA_VERSION,
	isRegisteredAnalyticsEvent,
	pruneAnalyticsEventProperties,
	sanitizeAnalyticsEventUrlProperties,
} from "@/analytics/events";
import { normalizePostHogHost } from "@/analytics/posthog-config";
import {
	redactAnalyticsPersonProperties,
	safeAnalyticsError,
	serverAnalyticsEnvironment,
} from "@/analytics/redaction";
import { resolveAnalyticsRelease } from "@/analytics/release";
import {
	boundedServerTimingMs,
	type ServerRouteTimingContext,
} from "@/analytics/server-timing";

export type ServerExceptionContext = {
	source: "access" | "billing" | "lesson" | "media" | "progress";
	operation: string;
	userId?: string | null;
	lessonId?: string;
	action?: "checkout" | "portal";
};

let serverClient: PostHog | null = null;

function projectToken(): string | undefined {
	return env.POSTHOG_PROJECT_TOKEN ?? process.env.VITE_POSTHOG_KEY;
}

function getServerClient(): PostHog | null {
	const token = projectToken();
	if (!token) return null;
	serverClient ??= new PostHog(token, {
		host: normalizePostHogHost(env.POSTHOG_HOST),
		personProfiles: "identified_only",
		before_send: enforceServerEventContract,
		flushAt: 1,
		flushInterval: 0,
		fetchRetryCount: 1,
		fetchRetryDelay: 250,
		requestTimeout: 1_500,
		disableGeoip: true,
		enableExceptionAutocapture: false,
	});
	return serverClient;
}

function hasAnalyticsConsent(): boolean {
	try {
		return getCookie(ANALYTICS_CONSENT_COOKIE_NAME) === "granted";
	} catch {
		return false;
	}
}

function serverAnalyticsRelease(): string {
	return resolveAnalyticsRelease(
		process.env.VERCEL_GIT_COMMIT_SHA,
		process.env.VITE_APP_RELEASE,
	);
}

function enforceServerEventContract(
	event: EventMessage | null,
): EventMessage | null {
	if (!event) return null;
	redactAnalyticsPersonProperties(event.properties?.$set);
	redactAnalyticsPersonProperties(event.properties?.$set_once);
	const eventWithPersonSets = event as EventMessage & {
		$set?: unknown;
		$set_once?: unknown;
	};
	redactAnalyticsPersonProperties(eventWithPersonSets.$set);
	redactAnalyticsPersonProperties(eventWithPersonSets.$set_once);
	if (event.properties) {
		sanitizeAnalyticsEventUrlProperties(event.properties);
	}
	if (
		typeof event.event === "string" &&
		!isRegisteredAnalyticsEvent(event.event)
	) {
		return null;
	}
	if (
		typeof event.event === "string" &&
		!event.event.startsWith("$") &&
		event.properties
	) {
		pruneAnalyticsEventProperties(
			event.event as AnalyticsEventName,
			event.properties,
		);
	}
	return event;
}

export async function captureServerException(
	error: unknown,
	context: ServerExceptionContext,
): Promise<boolean> {
	if (!hasAnalyticsConsent()) return false;
	try {
		const client = getServerClient();
		if (!client) return false;
		await client.captureExceptionImmediate(
			safeAnalyticsError(error),
			context.userId ?? "tradely-server",
			{
				$process_person_profile: Boolean(context.userId),
				app: "tradely",
				event_schema_version: ANALYTICS_EVENT_SCHEMA_VERSION,
				environment: serverAnalyticsEnvironment({
					nodeEnv: env.NODE_ENV,
					vercelEnv: process.env.VERCEL_ENV,
				}),
				runtime: process.env.VERCEL ? "vercel_function" : "node",
				source: context.source,
				operation: context.operation.slice(0, 120),
				...(context.lessonId
					? { lesson_id: context.lessonId.slice(0, 120) }
					: {}),
				...(context.action ? { action: context.action } : {}),
				release: serverAnalyticsRelease(),
			},
		);
		return true;
	} catch {
		return false;
	}
}

export async function captureServerRouteTiming(
	context: ServerRouteTimingContext,
): Promise<boolean> {
	if (!hasAnalyticsConsent()) return false;
	try {
		const client = getServerClient();
		if (!client) return false;
		await client.captureImmediate({
			distinctId: "tradely-server",
			event: "server_route_timing",
			properties: {
				$process_person_profile: false,
				app: "tradely",
				event_schema_version: ANALYTICS_EVENT_SCHEMA_VERSION,
				environment: serverAnalyticsEnvironment({
					nodeEnv: env.NODE_ENV,
					vercelEnv: process.env.VERCEL_ENV,
				}),
				runtime: process.env.VERCEL ? "vercel_function" : "node",
				surface: context.surface,
				operation: context.operation.slice(0, 120),
				duration_ms: boundedServerTimingMs(context.duration_ms),
				status: context.status,
				signed_in: context.signed_in,
				release: serverAnalyticsRelease(),
			},
		});
		return true;
	} catch {
		return false;
	}
}
