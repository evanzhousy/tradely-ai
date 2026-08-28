import { env } from "@tradely/env/web";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import {
	capturePostHogException,
	getPostHogClient,
	type PostHogClient,
} from "./client";
import {
	ANALYTICS_CONSENT_STORAGE_KEY,
	type AnalyticsConsent,
	parseAnalyticsConsent,
} from "./consent";
import { AnalyticsContext, type AnalyticsContextValue } from "./context";
import type { AnalyticsEventMap, AnalyticsEventName } from "./events";

export function AnalyticsProvider({ children }: { children: ReactNode }) {
	const isConfigured = Boolean(env.VITE_POSTHOG_KEY);
	const [consent, setConsentState] = useState<AnalyticsConsent>("unknown");
	const [isCapturing, setIsCapturing] = useState(false);
	const [isConsentResolved, setIsConsentResolved] = useState(false);
	const [preferencesOpen, setPreferencesOpen] = useState(false);
	const clientRef = useRef<PostHogClient | null>(null);
	const consentRef = useRef<AnalyticsConsent>("unknown");
	const capturingRef = useRef(false);

	const applyConsent = useCallback(
		(client: PostHogClient, nextConsent: AnalyticsConsent) => {
			if (nextConsent === "granted") {
				client.opt_in_capturing();
				capturingRef.current = !client.has_opted_out_capturing();
			} else {
				client.opt_out_capturing();
				capturingRef.current = false;
			}
			setIsCapturing(capturingRef.current);
		},
		[],
	);

	useEffect(() => {
		if (!isConfigured) return;
		const storedConsent = parseAnalyticsConsent(
			window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY),
		);
		consentRef.current = storedConsent;
		setConsentState(storedConsent);
		setIsConsentResolved(true);
		let cancelled = false;
		void getPostHogClient().then((client) => {
			if (cancelled) return;
			clientRef.current = client;
			applyConsent(client, consentRef.current);
		});
		return () => {
			cancelled = true;
		};
	}, [applyConsent, isConfigured]);

	const capture = useCallback(
		<EventName extends AnalyticsEventName>(
			event: EventName,
			properties: AnalyticsEventMap[EventName],
		): boolean => {
			if (!capturingRef.current || !clientRef.current) return false;
			clientRef.current.capture(event, properties);
			return true;
		},
		[],
	);

	const capturePageView = useCallback(
		(properties: AnalyticsEventMap["page_viewed"]): boolean => {
			if (!capturingRef.current || !clientRef.current) return false;
			const currentUrl = `${window.location.origin}${properties.path}`;
			clientRef.current.capture("$pageview", {
				...properties,
				$current_url: currentUrl,
				$pathname: properties.path,
			});
			clientRef.current.capture("page_viewed", properties);
			return true;
		},
		[],
	);

	const captureException = useCallback(capturePostHogException, []);

	const identify = useCallback((userId: string): boolean => {
		if (!capturingRef.current || !clientRef.current) return false;
		clientRef.current.identify(userId, { auth_provider: "clerk" });
		return true;
	}, []);

	const resetIdentity = useCallback(() => {
		if (!capturingRef.current || !clientRef.current) return;
		clientRef.current.reset();
		clientRef.current.opt_in_capturing();
		capturingRef.current = !clientRef.current.has_opted_out_capturing();
		setIsCapturing(capturingRef.current);
	}, []);

	const setConsent = useCallback(
		(nextConsent: Exclude<AnalyticsConsent, "unknown">) => {
			const wasCapturing = capturingRef.current;
			window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, nextConsent);
			consentRef.current = nextConsent;
			setConsentState(nextConsent);
			setPreferencesOpen(false);
			const client = clientRef.current;
			if (!client) return;
			if (nextConsent === "denied" && wasCapturing) {
				client.opt_out_capturing();
				client.reset(true);
			}
			applyConsent(client, nextConsent);
			if (nextConsent === "granted" && capturingRef.current) {
				client.capture("analytics_consent_updated", { status: "granted" });
			}
		},
		[applyConsent],
	);

	const value = useMemo<AnalyticsContextValue>(
		() => ({
			consent,
			isCapturing,
			isConsentResolved,
			isConfigured,
			preferencesOpen,
			capture,
			capturePageView,
			captureException,
			identify,
			resetIdentity,
			setConsent,
			openPreferences: () => setPreferencesOpen(true),
			closePreferences: () => setPreferencesOpen(false),
		}),
		[
			capture,
			captureException,
			capturePageView,
			consent,
			identify,
			isCapturing,
			isConsentResolved,
			isConfigured,
			preferencesOpen,
			resetIdentity,
			setConsent,
		],
	);

	return (
		<AnalyticsContext.Provider value={value}>
			{children}
		</AnalyticsContext.Provider>
	);
}
