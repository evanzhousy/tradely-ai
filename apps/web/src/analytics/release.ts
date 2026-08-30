export const ANALYTICS_RELEASE_MAX_LENGTH = 120;
export const LOCAL_ANALYTICS_RELEASE = "local";

export function normalizeAnalyticsRelease(
	value: string | null | undefined,
): string {
	const normalized = value?.trim().slice(0, ANALYTICS_RELEASE_MAX_LENGTH);
	return normalized || LOCAL_ANALYTICS_RELEASE;
}

export function resolveAnalyticsRelease(
	primary: string | null | undefined,
	fallback: string | null | undefined,
): string {
	return normalizeAnalyticsRelease(primary?.trim() || fallback);
}
