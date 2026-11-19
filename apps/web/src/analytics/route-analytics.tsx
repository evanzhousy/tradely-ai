import { useLocation } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import type { Locale } from "@/i18n/messages";
import { useI18n } from "@/i18n/provider";
import { useAnalytics } from "./context";
import { analyticsRouteName, canonicalAnalyticsPath } from "./events";

// Guides and the options-traders pages are English-only whatever the interface language.
function pageViewProperties(path: string, locale: Locale) {
	return {
		route_name: analyticsRouteName(path),
		path,
		locale:
			path === "/guides" ||
			path.startsWith("/guides/") ||
			path === "/options-traders" ||
			path === "/options-traders/reddit"
				? "en"
				: locale,
	} as const;
}

export function RouteAnalytics() {
	const location = useLocation();
	const { locale } = useI18n();
	const {
		capturePageView,
		countAnonymousPageView,
		consent,
		isCapturing,
		isConsentResolved,
	} = useAnalytics();
	const localeRef = useRef(locale);
	const lastCapturedPathRef = useRef<string | null>(null);
	const lastAnonymousPathRef = useRef<string | null>(null);

	useEffect(() => {
		localeRef.current = locale;
	}, [locale]);

	useEffect(() => {
		if (!isCapturing) {
			lastCapturedPathRef.current = null;
			return;
		}
		const path = canonicalAnalyticsPath(location.pathname);
		if (lastCapturedPathRef.current === path) return;
		if (capturePageView(pageViewProperties(path, localeRef.current))) {
			lastCapturedPathRef.current = path;
		}
	}, [capturePageView, isCapturing, location.pathname]);

	// Until the visitor chooses, each page is counted once, anonymously and without cookies.
	useEffect(() => {
		if (!isConsentResolved || consent !== "unknown") {
			lastAnonymousPathRef.current = null;
			return;
		}
		const path = canonicalAnalyticsPath(location.pathname);
		if (lastAnonymousPathRef.current === path) return;
		if (countAnonymousPageView(pageViewProperties(path, localeRef.current))) {
			lastAnonymousPathRef.current = path;
		}
	}, [consent, countAnonymousPageView, isConsentResolved, location.pathname]);

	return null;
}
