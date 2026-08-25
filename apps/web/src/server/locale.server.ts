import "@tanstack/react-start/server-only";

import {
	getCookie,
	getRequestHeader,
	setCookie,
} from "@tanstack/react-start/server";

import {
	DEFAULT_LOCALE,
	LOCALE_COOKIE,
	type Locale,
	localeFromAcceptLanguage,
	parseLocale,
} from "@/i18n/locale";

export function readLocale(): Locale {
	return (
		parseLocale(getCookie(LOCALE_COOKIE)) ??
		localeFromAcceptLanguage(getRequestHeader("accept-language")) ??
		DEFAULT_LOCALE
	);
}

export function writeLocale(locale: Locale) {
	setCookie(LOCALE_COOKIE, locale, {
		path: "/",
		maxAge: 60 * 60 * 24 * 365,
		sameSite: "lax",
		httpOnly: false,
	});
}
