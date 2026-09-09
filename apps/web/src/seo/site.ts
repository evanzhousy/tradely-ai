export const SITE_NAME = "Tradely";
export const SITE_ORIGIN = "https://www.tradely.ai";

/** Only internal paths belong in public SEO URLs, never auth or signed media URLs. */
export function canonicalUrl(path: string): string {
	if (!path.startsWith("/") || path.startsWith("//") || /[\\?#]/.test(path)) {
		throw new Error(
			"Canonical URLs require an internal path without query or fragment",
		);
	}
	const url = new URL(path, SITE_ORIGIN);
	return `${SITE_ORIGIN}${url.pathname.replace(/\/+$/, "") || "/"}`;
}

export function serializeJsonLd(value: unknown): string {
	return JSON.stringify(value).replace(/</g, "\\u003c");
}
