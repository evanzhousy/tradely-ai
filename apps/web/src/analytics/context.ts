import { createContext, useContext } from "react";

import type { AnalyticsConsent } from "./consent";
import type {
	AnalyticsEventMap,
	AnalyticsRouteName,
	BillingAction,
	CaptureAnalyticsEvent,
} from "./events";

export type ExceptionContext = {
	source:
		| "route_boundary"
		| "lesson_completion"
		| "billing_action"
		| "client_unhandled"
		| "learning_read"
		| "lesson_surface";
	route_name?: AnalyticsRouteName;
	lesson_id?: string;
	operation?:
		| "lesson_page_read"
		| "course_progress_read"
		| "lesson_progress_start"
		| "lesson_progress_save"
		| "visual_lesson_import"
		| "visual_lesson_render"
		| "lesson_notes_import"
		| "lesson_notes_render"
		| "lesson_recap_import"
		| "lesson_recap_render";
	failure_category?: "network" | "offline" | "timeout" | "http" | "unexpected";
	attempt?: number;
	duration_ms?: number;
	http_status?: number;
	action?: BillingAction;
};

export type AnalyticsContextValue = {
	consent: AnalyticsConsent;
	isCapturing: boolean;
	isPostHogCapturing: boolean;
	isConsentResolved: boolean;
	isConfigured: boolean;
	preferencesOpen: boolean;
	capture: CaptureAnalyticsEvent;
	capturePageView: (properties: AnalyticsEventMap["page_viewed"]) => boolean;
	captureException: (error: unknown, context: ExceptionContext) => boolean;
	identify: (userId: string) => boolean;
	resetIdentity: () => void;
	setConsent: (consent: Exclude<AnalyticsConsent, "unknown">) => void;
	openPreferences: () => void;
	closePreferences: () => void;
};

export const AnalyticsContext = createContext<AnalyticsContextValue | null>(
	null,
);

export function useAnalytics() {
	const context = useContext(AnalyticsContext);
	if (!context) {
		throw new Error("useAnalytics must be used within AnalyticsProvider");
	}
	return context;
}
