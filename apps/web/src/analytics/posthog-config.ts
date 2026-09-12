export const POSTHOG_INGESTION_HOST = "https://us.i.posthog.com";
export const POSTHOG_PROXY_HOST = "https://z.tradely.ai";
export const POSTHOG_CONTROL_HOST = "https://us.posthog.com";

export function normalizePostHogHost(
	value: string | null | undefined,
	fallback = POSTHOG_PROXY_HOST,
): string {
	return (value?.trim() || fallback).replace(/\/+$/, "");
}
