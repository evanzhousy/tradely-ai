/** Accept only an application path, including when it comes from a query string. */
export function safeReturnTo(value: unknown): string {
	if (
		typeof value !== "string" ||
		!value.startsWith("/") ||
		value.startsWith("//") ||
		value.includes("\\") ||
		[...value].some(
			(character) =>
				character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
		)
	)
		return "/";
	try {
		const url = new URL(value, "https://tradely.invalid");
		if (
			url.origin !== "https://tradely.invalid" ||
			/^\/(?:auth|api)(?:\/|$)/.test(url.pathname)
		)
			return "/";
		return `${url.pathname}${url.search}${url.hash}`;
	} catch {
		return "/";
	}
}
