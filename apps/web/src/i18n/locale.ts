import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie, getRequestHeader } from "@tanstack/react-start/server";
import {
	LOCALE_COOKIE,
	LOCALE_STORAGE_KEY,
	type Locale,
	normalizeLocale,
} from "./messages";

/**
 * The reader's language: the one they chose, else the one their browser asks for. The
 * server reads the cookie and Accept-Language so the first render is already in it.
 */
export const resolveLocale = createIsomorphicFn()
	.server((): Locale => {
		const chosen = getCookie(LOCALE_COOKIE);
		return normalizeLocale(chosen ?? getRequestHeader("accept-language"));
	})
	.client((): Locale => {
		let chosen: string | null = null;
		try {
			chosen = window.localStorage.getItem(LOCALE_STORAGE_KEY);
		} catch {
			// Storage can be blocked; the browser's language still applies.
		}
		return normalizeLocale(chosen ?? window.navigator.language);
	});

/** Keeps the server's copy of the reader's choice. */
export function rememberLocale(locale: Locale) {
	const secure = window.location.protocol === "https:" ? "; Secure" : "";
	// biome-ignore lint/suspicious/noDocumentCookie: The server needs a same-site mirror of the reader's language choice.
	document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}
