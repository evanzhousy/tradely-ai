import "@tanstack/react-start/server-only";

import { getCookie } from "@tanstack/react-start/server";
import { env } from "@tradely/env/server";
import { PostHog } from "posthog-node";

import { ANALYTICS_CONSENT_COOKIE_NAME } from "@/analytics/consent";
import { ANALYTICS_EVENT_SCHEMA_VERSION } from "@/analytics/events";
import {
	safeAnalyticsError,
	serverAnalyticsEnvironment,
} from "@/analytics/redaction";

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
		host: env.POSTHOG_HOST,
		flushAt: 1,
		flushInterval: 0,
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

export async function captureServerException(
	error: unknown,
	context: ServerExceptionContext,
): Promise<boolean> {
	if (!hasAnalyticsConsent()) return false;
	const client = getServerClient();
	if (!client) return false;
	try {
		await client.captureExceptionImmediate(
			safeAnalyticsError(error),
			context.userId ?? "tradely-server",
			{
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
				...(process.env.VERCEL_GIT_COMMIT_SHA
					? { release: process.env.VERCEL_GIT_COMMIT_SHA }
					: {}),
			},
		);
		return true;
	} catch {
		return false;
	}
}
