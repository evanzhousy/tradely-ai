import type { LessonAccess, TradingFlowPractice } from "@/content/course";
import type { Locale } from "@/i18n/messages";

import { redactAnalyticsPersonProperties } from "./redaction";

export type AnalyticsEnvironment = "production" | "preview" | "local";

export const ANALYTICS_EVENT_SCHEMA_VERSION = 1;

export type BillingActionFailureReason =
	| "sign_in_required"
	| "already_active"
	| "no_customer"
	| "unavailable";

export type AnalyticsRouteName =
	| "home"
	| "course"
	| "lesson"
	| "pricing"
	| "privacy"
	| "terms"
	| "risk_disclosure"
	| "cookies"
	| "not_found";

export type AnalyticsEventMap = {
	page_viewed: {
		route_name: AnalyticsRouteName;
		path: string;
		locale: Locale;
	};
	locale_changed: {
		from_locale: Locale;
		to_locale: Locale;
	};
	auth_sign_in_opened: {
		surface: "header" | "lesson_access";
	};
	auth_session_established: {
		provider: "clerk";
	};
	tradingflow_link_opened: {
		surface: "header" | "home_hero" | "lesson_practice";
		lesson_id?: string;
		tool?: TradingFlowPractice["tool"];
	};
	lesson_opened: {
		lesson_id: string;
		lesson_order: number;
		access_tier: LessonAccess;
		access_state:
			| "allowed"
			| "signed_out"
			| "payment_required"
			| "billing_unavailable";
		media_available: boolean;
		locale: Locale;
	};
	lesson_video_started: {
		lesson_id: string;
		position_seconds: number;
	};
	lesson_video_completed: {
		lesson_id: string;
		duration_seconds: number;
	};
	lesson_completed: {
		lesson_id: string;
		lesson_order: number;
	};
	lesson_progress_save_failed: {
		lesson_id: string;
		reason: "signed_out" | "access_denied" | "unavailable";
	};
	membership_cta_clicked: {
		surface: "lesson_access";
		lesson_id?: string;
	};
	billing_status_unavailable: {
		surface: "lesson_access" | "course_progress";
	};
	billing_action_started: {
		action: "checkout" | "portal";
	};
	billing_action_redirected: {
		action: "checkout" | "portal";
	};
	billing_action_failed: {
		action: "checkout" | "portal";
		reason: BillingActionFailureReason;
	};
	billing_checkout_returned: {
		status: "success" | "cancel";
		estimate: true;
	};
	server_route_timing: {
		surface: "course_progress";
		operation: "course_progress_read";
		duration_ms: number;
		status: "ok" | "unavailable";
		signed_in: boolean;
	};
	analytics_consent_updated: {
		status: "granted";
	};
};

export type AnalyticsEventName = keyof AnalyticsEventMap;

export const ANALYTICS_EVENT_NAMES = {
	page_viewed: true,
	locale_changed: true,
	auth_sign_in_opened: true,
	auth_session_established: true,
	tradingflow_link_opened: true,
	lesson_opened: true,
	lesson_video_started: true,
	lesson_video_completed: true,
	lesson_completed: true,
	lesson_progress_save_failed: true,
	membership_cta_clicked: true,
	billing_status_unavailable: true,
	billing_action_started: true,
	billing_action_redirected: true,
	billing_action_failed: true,
	billing_checkout_returned: true,
	server_route_timing: true,
	analytics_consent_updated: true,
} satisfies Record<AnalyticsEventName, true>;

export const ANALYTICS_EVENT_PROPERTY_KEYS = {
	page_viewed: ["route_name", "path", "locale"],
	locale_changed: ["from_locale", "to_locale"],
	auth_sign_in_opened: ["surface"],
	auth_session_established: ["provider"],
	tradingflow_link_opened: ["surface", "lesson_id", "tool"],
	lesson_opened: [
		"lesson_id",
		"lesson_order",
		"access_tier",
		"access_state",
		"media_available",
		"locale",
	],
	lesson_video_started: ["lesson_id", "position_seconds"],
	lesson_video_completed: ["lesson_id", "duration_seconds"],
	lesson_completed: ["lesson_id", "lesson_order"],
	lesson_progress_save_failed: ["lesson_id", "reason"],
	membership_cta_clicked: ["surface", "lesson_id"],
	billing_status_unavailable: ["surface"],
	billing_action_started: ["action"],
	billing_action_redirected: ["action"],
	billing_action_failed: ["action", "reason"],
	billing_checkout_returned: ["status", "estimate"],
	server_route_timing: [
		"surface",
		"operation",
		"duration_ms",
		"status",
		"signed_in",
	],
	analytics_consent_updated: ["status"],
} satisfies {
	[EventName in AnalyticsEventName]: readonly (keyof AnalyticsEventMap[EventName])[];
};

const PRESERVED_POSTHOG_PROPERTY_KEYS = new Set([
	"app",
	"environment",
	"event_schema_version",
	"release",
	"runtime",
	"token",
	"distinct_id",
	"groups",
]);

export function pruneAnalyticsEventProperties(
	eventName: AnalyticsEventName,
	properties: Record<string, unknown>,
): void {
	redactAnalyticsPersonProperties(properties.$set);
	redactAnalyticsPersonProperties(properties.$set_once);
	const allowedKeys = new Set([
		...ANALYTICS_EVENT_PROPERTY_KEYS[eventName],
		...PRESERVED_POSTHOG_PROPERTY_KEYS,
	]);
	for (const key of Object.keys(properties)) {
		if (key.startsWith("$") || allowedKeys.has(key)) continue;
		delete properties[key];
	}
}

export function isRegisteredAnalyticsEvent(eventName: unknown): boolean {
	if (typeof eventName !== "string") return false;
	return (
		eventName.startsWith("$") || Object.hasOwn(ANALYTICS_EVENT_NAMES, eventName)
	);
}

export type CaptureAnalyticsEvent = <EventName extends AnalyticsEventName>(
	event: EventName,
	properties: AnalyticsEventMap[EventName],
) => boolean;

export function analyticsEnvironment(hostname: string): AnalyticsEnvironment {
	if (hostname === "tradely.ai" || hostname === "www.tradely.ai") {
		return "production";
	}
	if (hostname === "localhost" || hostname === "127.0.0.1") return "local";
	return "preview";
}

export function analyticsRouteName(pathname: string): AnalyticsRouteName {
	if (pathname === "/") return "home";
	if (pathname === "/courses/tradingflow-foundations") return "course";
	if (pathname.startsWith("/learn/")) return "lesson";
	if (pathname === "/pricing") return "pricing";
	if (pathname === "/privacy") return "privacy";
	if (pathname === "/terms") return "terms";
	if (pathname === "/risk-disclosure") return "risk_disclosure";
	if (pathname === "/cookies") return "cookies";
	return "not_found";
}

export function canonicalAnalyticsPath(pathname: string): string {
	if (pathname === "/") return pathname;
	return pathname.replace(/\/+$/, "") || "/";
}

export function sanitizeAnalyticsUrl(value: unknown): unknown {
	if (typeof value !== "string") return value;
	try {
		const url = new URL(value);
		return `${url.origin}${canonicalAnalyticsPath(url.pathname)}`;
	} catch {
		return canonicalAnalyticsPath(value.split(/[?#]/, 1)[0] ?? "/");
	}
}

const URL_LIKE_SYSTEM_PROPERTY_PATTERN = /(?:url|referrer)$/i;

export function sanitizeAnalyticsEventUrlProperties(
	properties: Record<string, unknown>,
): void {
	for (const [key, value] of Object.entries(properties)) {
		if (
			key.startsWith("$") &&
			(URL_LIKE_SYSTEM_PROPERTY_PATTERN.test(key) ||
				key === "$pathname" ||
				key === "$initial_pathname")
		) {
			properties[key] = sanitizeAnalyticsUrl(value);
		}
	}
}

export function billingActionFailureReason(
	error: unknown,
): BillingActionFailureReason {
	if (!(error instanceof Error)) return "unavailable";
	const message = error.message.toLowerCase();
	if (message.includes("sign in")) return "sign_in_required";
	if (message.includes("already active")) return "already_active";
	if (message.includes("no stripe customer")) return "no_customer";
	return "unavailable";
}
