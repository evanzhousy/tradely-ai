const EMAIL_PATTERN = /[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi;
const SECRET_QUERY_PATTERN =
	/([?&](?:token|key|secret|session|code|password|authorization)=)[^&#\s)]+/gi;
const BEARER_PATTERN = /\bbearer\s+[a-z0-9._~+/-]+=*/gi;
const PROVIDER_ID_PATTERN =
	/\b(?:cus|sub|cs|price|pi|pm|in|sess|user)_[a-z0-9_-]+\b/gi;
const PERSON_PROPERTY_SENSITIVE_KEY_PATTERN =
	/(?:email|phone|name|token|secret|password|authorization|cookie|address|customer|clerk|stripe|user[_-]?id|url|href)/i;

export function redactAnalyticsText(value: string, limit: number): string {
	return value
		.replace(EMAIL_PATTERN, "[redacted-email]")
		.replace(SECRET_QUERY_PATTERN, "$1[redacted]")
		.replace(BEARER_PATTERN, "Bearer [redacted]")
		.replace(PROVIDER_ID_PATTERN, "[redacted-provider-id]")
		.slice(0, limit);
}

export function safeAnalyticsError(error: unknown): Error {
	const source =
		error instanceof Error ? error : new Error("Unknown application error");
	const safe = new Error(redactAnalyticsText(source.message, 500));
	safe.name = redactAnalyticsText(source.name, 120);
	if (source.stack) safe.stack = redactAnalyticsText(source.stack, 12_000);
	return safe;
}

export function redactAnalyticsPersonProperties(value: unknown): void {
	if (Array.isArray(value)) {
		for (const item of value) redactAnalyticsPersonProperties(item);
		return;
	}
	if (!value || typeof value !== "object") return;
	const properties = value as Record<string, unknown>;
	for (const key of Object.keys(properties)) {
		if (PERSON_PROPERTY_SENSITIVE_KEY_PATTERN.test(key)) {
			delete properties[key];
			continue;
		}
		redactAnalyticsPersonProperties(properties[key]);
	}
}

export function isExpectedBillingError(error: unknown): boolean {
	if (!(error instanceof Error)) return false;
	return [
		"Sign in before starting checkout",
		"This membership is already active",
		"Billing status could not be confirmed",
		"Sign in to manage billing",
		"Sign in to verify lifetime access",
		"No Stripe customer is linked",
		"Lifetime course checkout is unavailable",
		"Lifetime course access is already active",
		"Course pass purchase could not be verified",
		"This course pass purchase has been revoked",
		"No verified lifetime purchase was found",
	].some((prefix) => error.message.startsWith(prefix));
}

export function serverAnalyticsEnvironment(input: {
	nodeEnv: string | undefined;
	vercelEnv: string | undefined;
}): "production" | "preview" | "local" {
	if (input.vercelEnv === "production") return "production";
	if (input.vercelEnv === "preview") return "preview";
	return input.nodeEnv === "production" ? "production" : "local";
}
