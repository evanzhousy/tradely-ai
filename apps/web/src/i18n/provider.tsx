import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

import { rememberLocale } from "./locale";
import {
	DEFAULT_LOCALE,
	LOCALE_STORAGE_KEY,
	type Locale,
	type MessageKey,
	normalizeLocale,
	translate,
} from "./messages";

type I18nContextValue = {
	locale: Locale;
	setLocale: (locale: Locale) => void;
	t: (key: MessageKey, variables?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function LocaleProvider({
	children,
	initialLocale = DEFAULT_LOCALE,
}: {
	children: ReactNode;
	/** The language the server rendered in, so hydration starts from the same text. */
	initialLocale?: Locale;
}) {
	const [locale, setLocaleState] = useState<Locale>(initialLocale);

	useEffect(() => {
		// A choice saved before the cookie existed is only in this browser: apply it and
		// give the server a copy. Without one, the server's Accept-Language pick stands.
		const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
		if (!saved) return;
		const chosen = normalizeLocale(saved);
		setLocaleState(chosen);
		rememberLocale(chosen);
	}, []);

	useEffect(() => {
		document.documentElement.lang = locale;
	}, [locale]);

	const setLocale = useCallback((nextLocale: Locale) => {
		setLocaleState(nextLocale);
		window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
		rememberLocale(nextLocale);
		document.documentElement.lang = nextLocale;
	}, []);

	const value = useMemo<I18nContextValue>(
		() => ({
			locale,
			setLocale,
			t: (key, variables) => translate(locale, key, variables),
		}),
		[locale, setLocale],
	);

	return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
	const context = useContext(I18nContext);
	if (!context) throw new Error("useI18n must be used within LocaleProvider");
	return context;
}

const fallback: I18nContextValue = {
	locale: DEFAULT_LOCALE,
	setLocale: () => {},
	t: (key, variables) => translate(DEFAULT_LOCALE, key, variables),
};

/** For screens that can render outside the provider, such as the root error page. */
export function useI18nOrDefault() {
	return useContext(I18nContext) ?? fallback;
}
