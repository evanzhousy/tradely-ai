import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

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

export function LocaleProvider({ children }: { children: ReactNode }) {
	const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

	useEffect(() => {
		const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
		setLocaleState(
			savedLocale
				? normalizeLocale(savedLocale)
				: normalizeLocale(window.navigator.language),
		);
	}, []);

	useEffect(() => {
		document.documentElement.lang = locale;
	}, [locale]);

	const setLocale = useCallback((nextLocale: Locale) => {
		setLocaleState(nextLocale);
		window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
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
