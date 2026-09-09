import type { LessonAccess, TradingFlowPractice } from "@/content/course";
import type { CoachingFailure } from "@/domain/coaching/types";
import type { LearningFailure } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { redactAnalyticsPersonProperties } from "./redaction";

type CoachingEventProperties = {
	lesson_id: string;
	scenario_id: string;
	scenario_version: number;
	locale: Locale;
	round?: "initial" | "revision";
	reason?: CoachingFailure;
};
const coachingPropertyKeys = [
	"lesson_id",
	"scenario_id",
	"scenario_version",
	"locale",
	"round",
	"reason",
] as const;

export type AnalyticsEnvironment = "production" | "preview" | "local";

export const ANALYTICS_EVENT_SCHEMA_VERSION = 1;

export type BillingActionFailureReason =
	| "sign_in_required"
	| "already_active"
	| "no_customer"
	| "not_found"
	| "unavailable";

export type BillingOffer = "membership" | "lifetime_course";

export type AnalyticsRouteName =
	| "guides"
	| "guide"
	| "home"
	| "course"
	| "lesson"
	| "pricing"
	| "auth_sign_in"
	| "privacy"
	| "terms"
	| "risk_disclosure"
	| "cookies"
	| "not_found";

export type AnalyticsEventMap = {
	lesson_coach_started: CoachingEventProperties;
	lesson_coach_feedback_viewed: CoachingEventProperties;
	lesson_coach_revision_saved: CoachingEventProperties;
	lesson_coach_cycle_completed: CoachingEventProperties;
	lesson_coach_failed: CoachingEventProperties;
	guide_demo_started: { guide_id: string; demo_id: string; locale: Locale };
	guide_demo_completed: { guide_id: string; demo_id: string; locale: Locale };
	guide_next_step_clicked: {
		guide_id: string;
		destination_kind: "free_lesson" | "related_lesson" | "course";
		lesson_id?: string;
	};
	preview_exercise_started: {
		lesson_id: string;
		scenario_id: string;
		scenario_version: number;
	};
	preview_exercise_submitted: {
		lesson_id: string;
		scenario_id: string;
		scenario_version: number;
		result: "practiced" | "demonstrated";
	};
	lesson_renderer_changed: {
		lesson_id: string;
		scenario_id: string;
		scenario_version: number;
		renderer: "2d" | "3d";
		reason: "selected" | "unavailable";
	};
	lesson_exercise_started: {
		lesson_id: string;
		scenario_id: string;
		scenario_version: number;
	};
	lesson_exercise_submitted: {
		lesson_id: string;
		scenario_id: string;
		scenario_version: number;
		criteria_met: number;
		criteria_total: number;
		result: "practiced" | "demonstrated";
	};
	lesson_hint_opened: {
		lesson_id: string;
		scenario_id: string;
		scenario_version: number;
		stage: "prediction" | "guided" | "independent";
	};
	lesson_exercise_save_failed: { lesson_id: string; reason: LearningFailure };
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
		surface: "header" | "lesson_access" | "pricing";
	};
	auth_session_established: {
		provider: "neon";
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
		offer?: BillingOffer;
	};
	billing_action_redirected: {
		action: "checkout" | "portal";
		offer?: BillingOffer;
	};
	billing_action_failed: {
		action: "checkout" | "portal";
		offer?: BillingOffer;
		reason: BillingActionFailureReason;
	};
	billing_checkout_returned: {
		status: "success" | "cancel";
		estimate: true;
		offer: BillingOffer;
	};
	course_pass_access_verified: {
		course_id: "tradingflow-foundations";
		source: "checkout_return" | "restore" | "existing";
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
	lesson_coach_started: true,
	lesson_coach_feedback_viewed: true,
	lesson_coach_revision_saved: true,
	lesson_coach_cycle_completed: true,
	lesson_coach_failed: true,
	guide_demo_started: true,
	guide_demo_completed: true,
	guide_next_step_clicked: true,
	preview_exercise_started: true,
	preview_exercise_submitted: true,
	lesson_renderer_changed: true,
	lesson_exercise_started: true,
	lesson_exercise_submitted: true,
	lesson_hint_opened: true,
	lesson_exercise_save_failed: true,
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
	course_pass_access_verified: true,
	server_route_timing: true,
	analytics_consent_updated: true,
} satisfies Record<AnalyticsEventName, true>;

export const ANALYTICS_EVENT_PROPERTY_KEYS = {
	lesson_coach_started: coachingPropertyKeys,
	lesson_coach_feedback_viewed: coachingPropertyKeys,
	lesson_coach_revision_saved: coachingPropertyKeys,
	lesson_coach_cycle_completed: coachingPropertyKeys,
	lesson_coach_failed: coachingPropertyKeys,
	guide_demo_started: ["guide_id", "demo_id", "locale"],
	guide_demo_completed: ["guide_id", "demo_id", "locale"],
	guide_next_step_clicked: ["guide_id", "destination_kind", "lesson_id"],
	preview_exercise_started: ["lesson_id", "scenario_id", "scenario_version"],
	preview_exercise_submitted: [
		"lesson_id",
		"scenario_id",
		"scenario_version",
		"result",
	],
	lesson_renderer_changed: [
		"lesson_id",
		"scenario_id",
		"scenario_version",
		"renderer",
		"reason",
	],
	lesson_exercise_started: ["lesson_id", "scenario_id", "scenario_version"],
	lesson_exercise_submitted: [
		"lesson_id",
		"scenario_id",
		"scenario_version",
		"criteria_met",
		"criteria_total",
		"result",
	],
	lesson_hint_opened: ["lesson_id", "scenario_id", "scenario_version", "stage"],
	lesson_exercise_save_failed: ["lesson_id", "reason"],
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
	billing_action_started: ["action", "offer"],
	billing_action_redirected: ["action", "offer"],
	billing_action_failed: ["action", "offer", "reason"],
	billing_checkout_returned: ["status", "estimate", "offer"],
	course_pass_access_verified: ["course_id", "source"],
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
	if (pathname === "/guides" || pathname === "/guides/") return "guides";
	if (pathname.startsWith("/guides/")) return "guide";
	if (pathname === "/") return "home";
	if (pathname === "/courses/tradingflow-foundations") return "course";
	if (pathname.startsWith("/learn/")) return "lesson";
	if (pathname === "/pricing") return "pricing";
	if (pathname === "/auth/sign-in") return "auth_sign_in";
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
	if (message.includes("no verified lifetime purchase")) return "not_found";
	return "unavailable";
}
