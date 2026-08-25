export const locales = ["en", "zh-Hans"] as const;

export type Locale = (typeof locales)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "tradely_locale";

export function isLocale(value: string): value is Locale {
	return value === "en" || value === "zh-Hans";
}

export function parseLocale(value: string | null | undefined): Locale | null {
	if (!value) return null;
	const tag = value.trim();
	if (tag === "en" || tag.toLowerCase().startsWith("en-")) return "en";
	if (
		tag === "zh-Hans" ||
		tag === "zh-CN" ||
		tag === "zh" ||
		tag.toLowerCase().startsWith("zh")
	) {
		return "zh-Hans";
	}
	return null;
}

export function localeFromAcceptLanguage(
	header: string | null | undefined,
): Locale {
	if (!header) return DEFAULT_LOCALE;
	for (const part of header.split(",")) {
		const tag = part.split(";")[0]?.trim();
		const parsed = parseLocale(tag);
		if (parsed) return parsed;
	}
	return DEFAULT_LOCALE;
}

export function htmlLang(locale: Locale): string {
	return locale === "zh-Hans" ? "zh-Hans" : "en";
}
