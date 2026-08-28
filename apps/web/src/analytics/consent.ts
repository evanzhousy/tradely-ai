export type AnalyticsConsent = "unknown" | "granted" | "denied";

export const ANALYTICS_CONSENT_STORAGE_KEY = "tradely.analytics-consent.v1";

export function parseAnalyticsConsent(value: string | null): AnalyticsConsent {
	if (value === "granted" || value === "denied") return value;
	return "unknown";
}
