import { useLocation } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { useI18n } from "@/i18n/provider";
import { useAnalytics } from "./context";
import { analyticsRouteName, canonicalAnalyticsPath } from "./events";

export function RouteAnalytics() {
	const location = useLocation();
	const { locale } = useI18n();
	const { capturePageView, isCapturing } = useAnalytics();
	const localeRef = useRef(locale);
	const lastCapturedPathRef = useRef<string | null>(null);

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
		if (
			capturePageView({
				route_name: analyticsRouteName(path),
				path,
				locale: localeRef.current,
			})
		) {
			lastCapturedPathRef.current = path;
		}
	}, [capturePageView, isCapturing, location.pathname]);

	return null;
}
