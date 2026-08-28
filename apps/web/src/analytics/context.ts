import { createContext, useContext } from "react";

import type { AnalyticsConsent } from "./consent";
import type {
	AnalyticsEventMap,
	AnalyticsRouteName,
	CaptureAnalyticsEvent,
} from "./events";

export type ExceptionContext = {
	source:
		| "route_boundary"
		| "lesson_completion"
		| "billing_action"
		| "client_unhandled";
	route_name?: AnalyticsRouteName;
	lesson_id?: string;
	action?: "checkout" | "portal";
};

export type AnalyticsContextValue = {
	consent: AnalyticsConsent;
	isCapturing: boolean;
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
