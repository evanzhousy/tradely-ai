import type { LessonAccess, TradingFlowPractice } from "@/content/course";
import type { Locale } from "@/i18n/messages";

export type AnalyticsEnvironment = "production" | "preview" | "local";

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
	analytics_consent_updated: {
		status: "granted";
	};
};

export type AnalyticsEventName = keyof AnalyticsEventMap;

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
