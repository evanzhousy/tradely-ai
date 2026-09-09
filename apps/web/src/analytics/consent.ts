export type AnalyticsConsent = "unknown" | "granted" | "denied";

// Replay/heatmaps expand the original event-only consent scope. Old choices do
// not opt visitors into recording; both browser and server require this version.
export const ANALYTICS_CONSENT_STORAGE_KEY = "tradely.analytics-consent.v2";
export const ANALYTICS_CONSENT_COOKIE_NAME = "tradely_analytics_consent_v2";

export function analyticsConsentCookie(
	consent: Exclude<AnalyticsConsent, "unknown">,
	secure: boolean,
): string {
	return `${ANALYTICS_CONSENT_COOKIE_NAME}=${consent}; Path=/; Max-Age=31536000; SameSite=Lax${secure ? "; Secure" : ""}`;
}

export function parseAnalyticsConsent(value: string | null): AnalyticsConsent {
	if (value === "granted" || value === "denied") return value;
	return "unknown";
}
