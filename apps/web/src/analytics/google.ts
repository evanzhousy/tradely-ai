import { env } from "@tradely/env/web";

import {
	ANALYTICS_EVENT_PROPERTY_KEYS,
	ANALYTICS_EVENT_SCHEMA_VERSION,
	type AnalyticsEventMap,
	type AnalyticsEventName,
	analyticsEnvironment,
	isRegisteredAnalyticsEvent,
} from "./events";

const GOOGLE_TAG_SCRIPT_ID = "tradely-google-analytics-tag";

type GoogleTag = (...args: unknown[]) => void;

declare global {
	interface Window {
		dataLayer?: unknown[];
		doNotTrack?: string | null;
		gtag?: GoogleTag;
	}
}

type NavigatorWithDoNotTrack = Navigator & {
	msDoNotTrack?: string | null;
};

function isDoNotTrackValue(value: unknown): boolean {
	return (
		value === true ||
		value === 1 ||
		(typeof value === "string" && ["1", "true", "yes"].includes(value))
	);
}

export function doNotTrackEnabled(): boolean {
	if (typeof window === "undefined") return false;
	const browserNavigator = window.navigator as NavigatorWithDoNotTrack;
	return [
		browserNavigator.doNotTrack,
		browserNavigator.msDoNotTrack,
		window.doNotTrack,
	].some(isDoNotTrackValue);
}

let initializedMeasurementId: string | null = null;
let isCapturing = false;

function measurementId() {
	const value = env.VITE_GOOGLE_ANALYTICS_MEASUREMENT_ID?.trim();
	return value || null;
}

function ensureGoogleTag(id: string): GoogleTag {
	if (window.gtag && initializedMeasurementId === id) return window.gtag;

	window.dataLayer = window.dataLayer ?? [];
	const gtag: GoogleTag = (...args) => {
		window.dataLayer?.push(args);
	};
	window.gtag = gtag;
	gtag("consent", "default", {
		ad_personalization: "denied",
		ad_storage: "denied",
		ad_user_data: "denied",
		analytics_storage: "denied",
		wait_for_update: 500,
	});
	gtag("js", new Date());
	gtag("config", id, {
		allow_ad_personalization_signals: false,
		allow_google_signals: false,
		send_page_view: false,
	});

	if (!document.getElementById(GOOGLE_TAG_SCRIPT_ID)) {
		const script = document.createElement("script");
		script.id = GOOGLE_TAG_SCRIPT_ID;
		script.async = true;
		script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
		document.head.appendChild(script);
	}

	initializedMeasurementId = id;
	return gtag;
}

export function enableGoogleAnalytics(): boolean {
	if (typeof window === "undefined") return false;
	if (doNotTrackEnabled()) {
		isCapturing = false;
		return false;
	}
	const id = measurementId();
	if (!id) return false;
	const gtag = ensureGoogleTag(id);
	gtag("consent", "update", {
		analytics_storage: "granted",
	});
	isCapturing = true;
	return true;
}

export function disableGoogleAnalytics() {
	isCapturing = false;
	if (typeof window === "undefined" || !window.gtag) return;
	window.gtag("consent", "update", {
		analytics_storage: "denied",
	});
}

function googleEventProperties<EventName extends AnalyticsEventName>(
	event: EventName,
	properties: AnalyticsEventMap[EventName],
) {
	const allowedKeys = new Set<string>(ANALYTICS_EVENT_PROPERTY_KEYS[event]);
	return Object.fromEntries(
		Object.entries(properties).filter(
			([key, value]) => allowedKeys.has(key) && value !== undefined,
		),
	);
}

function googleContextProperties() {
	return {
		app: "tradely",
		environment: analyticsEnvironment(window.location.hostname),
		event_schema_version: ANALYTICS_EVENT_SCHEMA_VERSION,
	};
}

export function captureGoogleAnalyticsEvent<
	EventName extends AnalyticsEventName,
>(event: EventName, properties: AnalyticsEventMap[EventName]): boolean {
	if (!isRegisteredAnalyticsEvent(event)) return false;
	if (!isCapturing || typeof window === "undefined" || !window.gtag) {
		return false;
	}
	if (doNotTrackEnabled()) {
		disableGoogleAnalytics();
		return false;
	}
	window.gtag("event", event, {
		...googleContextProperties(),
		...googleEventProperties(event, properties),
	});
	return true;
}

export function captureGoogleAnalyticsPageView(
	properties: AnalyticsEventMap["page_viewed"],
): boolean {
	if (!isCapturing || typeof window === "undefined" || !window.gtag) {
		return false;
	}
	if (doNotTrackEnabled()) {
		disableGoogleAnalytics();
		return false;
	}
	window.gtag("event", "page_view", {
		...googleContextProperties(),
		page_location: `${window.location.origin}${properties.path}`,
		page_path: properties.path,
		page_title: document.title,
		route_name: properties.route_name,
		locale: properties.locale,
	});
	return true;
}
