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
	analyticsConsentCookie,
	parseAnalyticsConsent,
} from "./consent";
import { AnalyticsContext, type AnalyticsContextValue } from "./context";
import type { AnalyticsEventMap, AnalyticsEventName } from "./events";
import {
	captureGoogleAnalyticsEvent,
	captureGoogleAnalyticsPageView,
	disableGoogleAnalytics,
	enableGoogleAnalytics,
} from "./google";

function persistConsentCookie(consent: Exclude<AnalyticsConsent, "unknown">) {
	try {
		// biome-ignore lint/suspicious/noDocumentCookie: The server needs a same-site mirror of the explicit browser consent state.
		document.cookie = analyticsConsentCookie(
			consent,
			window.location.protocol === "https:",
		);
	} catch {
		// Cookie persistence is best effort; server capture remains consent-gated.
	}
}

function readPersistedConsent(): AnalyticsConsent {
	try {
		return parseAnalyticsConsent(
			window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY),
		);
	} catch {
		return "unknown";
	}
}

function persistConsentStorage(consent: Exclude<AnalyticsConsent, "unknown">) {
	try {
		window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, consent);
	} catch {
		// Storage persistence is best effort; the in-memory choice still applies.
	}
}

const SEND_BEACON_EVENTS = new Set<AnalyticsEventName>([
	"analytics_consent_updated",
	"billing_action_redirected",
	"billing_checkout_returned",
	"lesson_completed",
	"lesson_video_completed",
	"tradingflow_link_opened",
]);

const MAX_PENDING_POSTHOG_EVENTS = 20;
const PENDING_POSTHOG_EVENT_MAX_AGE_MS = 30_000;

type PendingPostHogCapture =
	| {
			kind: "event";
			event: AnalyticsEventName;
			properties: Record<string, unknown>;
			queuedAt: number;
	  }
	| {
			kind: "page_view";
			properties: AnalyticsEventMap["page_viewed"];
			queuedAt: number;
	  };

function capturePostHogEvent(
	client: PostHogClient,
	event: AnalyticsEventName,
	properties: Record<string, unknown>,
): boolean {
	try {
		if (SEND_BEACON_EVENTS.has(event)) {
			client.capture(event, properties, {
				transport: "sendBeacon",
				send_instantly: true,
			});
			return true;
		}
		client.capture(event, properties);
		return true;
	} catch {
		return false;
	}
}

function capturePostHogPageView(
	client: PostHogClient,
	properties: AnalyticsEventMap["page_viewed"],
): boolean {
	try {
		const currentUrl = `${window.location.origin}${properties.path}`;
		client.capture("$pageview", {
			...properties,
			$current_url: currentUrl,
			$pathname: properties.path,
		});
		client.capture("page_viewed", properties);
		return true;
	} catch {
		return false;
	}
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
	const hasPostHog = Boolean(env.VITE_POSTHOG_KEY);
	const hasGoogleAnalytics = Boolean(env.VITE_GOOGLE_ANALYTICS_MEASUREMENT_ID);
	const isConfigured = hasPostHog || hasGoogleAnalytics;
	const [consent, setConsentState] = useState<AnalyticsConsent>("unknown");
	const [isCapturing, setIsCapturing] = useState(false);
	const [isConsentResolved, setIsConsentResolved] = useState(false);
	const [preferencesOpen, setPreferencesOpen] = useState(false);
	const clientRef = useRef<PostHogClient | null>(null);
	const consentRef = useRef<AnalyticsConsent>("unknown");
	const postHogCapturingRef = useRef(false);
	const googleAnalyticsCapturingRef = useRef(false);
	const capturingRef = useRef(false);
	const pendingConsentGrantRef = useRef(false);
	const postHogConsentGrantCapturedRef = useRef(false);
	const googleConsentGrantCapturedRef = useRef(false);
	const pendingPostHogEventsRef = useRef<PendingPostHogCapture[]>([]);

	const refreshCapturing = useCallback(() => {
		capturingRef.current =
			postHogCapturingRef.current || googleAnalyticsCapturingRef.current;
		setIsCapturing(capturingRef.current);
	}, []);

	const applyPostHogConsent = useCallback(
		(client: PostHogClient, nextConsent: AnalyticsConsent) => {
			try {
				if (nextConsent === "granted") {
					client.opt_in_capturing({ captureEventName: false });
					postHogCapturingRef.current = !client.has_opted_out_capturing();
				} else {
					client.opt_out_capturing();
					postHogCapturingRef.current = false;
				}
			} catch {
				postHogCapturingRef.current = false;
			}
			refreshCapturing();
		},
		[refreshCapturing],
	);

	const applyConsent = useCallback(
		(nextConsent: AnalyticsConsent) => {
			if (hasGoogleAnalytics && nextConsent === "granted") {
				try {
					googleAnalyticsCapturingRef.current = enableGoogleAnalytics();
				} catch {
					googleAnalyticsCapturingRef.current = false;
				}
			} else {
				try {
					disableGoogleAnalytics();
				} catch {
					// Analytics shutdown is best effort and must not affect the app.
				}
				googleAnalyticsCapturingRef.current = false;
			}
			if (clientRef.current) {
				applyPostHogConsent(clientRef.current, nextConsent);
			} else {
				postHogCapturingRef.current = false;
				refreshCapturing();
			}
		},
		[applyPostHogConsent, hasGoogleAnalytics, refreshCapturing],
	);

	const flushPendingConsentGrant = useCallback(() => {
		if (!pendingConsentGrantRef.current) return;
		const client = clientRef.current;
		if (
			client &&
			postHogCapturingRef.current &&
			!postHogConsentGrantCapturedRef.current
		) {
			postHogConsentGrantCapturedRef.current = capturePostHogEvent(
				client,
				"analytics_consent_updated",
				{ status: "granted" },
			);
		}
		if (
			googleAnalyticsCapturingRef.current &&
			!googleConsentGrantCapturedRef.current
		) {
			try {
				googleConsentGrantCapturedRef.current = captureGoogleAnalyticsEvent(
					"analytics_consent_updated",
					{ status: "granted" },
				);
			} catch {
				googleConsentGrantCapturedRef.current = false;
			}
		}
		if (
			(!hasPostHog || postHogConsentGrantCapturedRef.current) &&
			(!hasGoogleAnalytics || googleConsentGrantCapturedRef.current)
		) {
			pendingConsentGrantRef.current = false;
		}
	}, [hasGoogleAnalytics, hasPostHog]);

	const flushPendingPostHogEvents = useCallback(() => {
		const client = clientRef.current;
		if (!client) return;
		if (!postHogCapturingRef.current) {
			pendingPostHogEventsRef.current = [];
			return;
		}
		const now = Date.now();
		const pending = pendingPostHogEventsRef.current.splice(0);
		for (const item of pending) {
			if (now - item.queuedAt > PENDING_POSTHOG_EVENT_MAX_AGE_MS) continue;
			if (item.kind === "page_view") {
				capturePostHogPageView(client, item.properties);
				continue;
			}
			capturePostHogEvent(client, item.event, item.properties);
		}
	}, []);

	const loadPostHogClient = useCallback(
		(isCancelled: () => boolean = () => false) => {
			void getPostHogClient()
				.then((client) => {
					if (isCancelled()) return;
					clientRef.current = client;
					applyPostHogConsent(client, consentRef.current);
					flushPendingConsentGrant();
					flushPendingPostHogEvents();
				})
				.catch(() => {
					if (isCancelled()) return;
					clientRef.current = null;
					postHogCapturingRef.current = false;
					refreshCapturing();
				});
		},
		[
			applyPostHogConsent,
			flushPendingConsentGrant,
			flushPendingPostHogEvents,
			refreshCapturing,
		],
	);

	useEffect(() => {
		const storedConsent = readPersistedConsent();
		consentRef.current = storedConsent;
		setConsentState(storedConsent);
		setIsConsentResolved(true);
		if (storedConsent !== "unknown") {
			persistConsentCookie(storedConsent);
		}
		applyConsent(storedConsent);
		let cancelled = false;
		if (!hasPostHog || storedConsent !== "granted") {
			return () => {
				cancelled = true;
			};
		}
		loadPostHogClient(() => cancelled);
		return () => {
			cancelled = true;
		};
	}, [applyConsent, hasPostHog, loadPostHogClient]);

	const capture = useCallback(
		<EventName extends AnalyticsEventName>(
			event: EventName,
			properties: AnalyticsEventMap[EventName],
		): boolean => {
			const client = clientRef.current;
			const postHogCaptured =
				postHogCapturingRef.current && client
					? capturePostHogEvent(client, event, properties)
					: false;
			if (
				!postHogCaptured &&
				consentRef.current === "granted" &&
				hasPostHog &&
				!client
			) {
				if (
					pendingPostHogEventsRef.current.length >= MAX_PENDING_POSTHOG_EVENTS
				) {
					pendingPostHogEventsRef.current.shift();
				}
				pendingPostHogEventsRef.current.push({
					kind: "event",
					event,
					properties: { ...properties },
					queuedAt: Date.now(),
				});
			}
			let googleCaptured = false;
			try {
				googleCaptured = captureGoogleAnalyticsEvent(event, properties);
			} catch {
				googleCaptured = false;
			}
			return postHogCaptured || googleCaptured;
		},
		[hasPostHog],
	);

	const capturePageView = useCallback(
		(properties: AnalyticsEventMap["page_viewed"]): boolean => {
			let postHogCaptured = false;
			if (postHogCapturingRef.current && clientRef.current) {
				postHogCaptured = capturePostHogPageView(clientRef.current, properties);
			} else if (
				consentRef.current === "granted" &&
				hasPostHog &&
				!clientRef.current
			) {
				if (
					pendingPostHogEventsRef.current.length >= MAX_PENDING_POSTHOG_EVENTS
				) {
					pendingPostHogEventsRef.current.shift();
				}
				pendingPostHogEventsRef.current.push({
					kind: "page_view",
					properties: { ...properties },
					queuedAt: Date.now(),
				});
			}
			let googleCaptured = false;
			try {
				googleCaptured = captureGoogleAnalyticsPageView(properties);
			} catch {
				googleCaptured = false;
			}
			return postHogCaptured || googleCaptured;
		},
		[hasPostHog],
	);

	const captureException = useCallback(capturePostHogException, []);

	const identify = useCallback((userId: string): boolean => {
		if (!postHogCapturingRef.current || !clientRef.current) return false;
		try {
			clientRef.current.identify(userId, { auth_provider: "clerk" });
			return true;
		} catch {
			return false;
		}
	}, []);

	const resetIdentity = useCallback(() => {
		if (!postHogCapturingRef.current || !clientRef.current) return;
		try {
			clientRef.current.reset();
			clientRef.current.opt_in_capturing({ captureEventName: false });
			postHogCapturingRef.current =
				!clientRef.current.has_opted_out_capturing();
		} catch {
			postHogCapturingRef.current = false;
		}
		refreshCapturing();
	}, [refreshCapturing]);

	const setConsent = useCallback(
		(nextConsent: Exclude<AnalyticsConsent, "unknown">) => {
			const wasCapturing = capturingRef.current;
			const wasPostHogCapturing = postHogCapturingRef.current;
			if (nextConsent === "denied") {
				pendingConsentGrantRef.current = false;
				postHogConsentGrantCapturedRef.current = false;
				googleConsentGrantCapturedRef.current = false;
				pendingPostHogEventsRef.current = [];
			}
			persistConsentStorage(nextConsent);
			persistConsentCookie(nextConsent);
			consentRef.current = nextConsent;
			setConsentState(nextConsent);
			setPreferencesOpen(false);
			const client = clientRef.current;
			if (client && nextConsent === "denied" && wasPostHogCapturing) {
				try {
					client.opt_out_capturing();
					client.reset(true);
				} catch {
					// Identity reset is best effort and must not interrupt consent changes.
				}
				postHogCapturingRef.current = false;
			}
			applyConsent(nextConsent);
			if (nextConsent === "granted") {
				pendingConsentGrantRef.current = true;
				if (hasPostHog && !clientRef.current) loadPostHogClient();
				if (wasCapturing === false) {
					postHogConsentGrantCapturedRef.current = false;
					googleConsentGrantCapturedRef.current = false;
				}
				flushPendingConsentGrant();
			}
		},
		[applyConsent, flushPendingConsentGrant, hasPostHog, loadPostHogClient],
	);

	useEffect(() => {
		const handleStorage = (event: StorageEvent) => {
			if (event.key !== ANALYTICS_CONSENT_STORAGE_KEY) return;
			const nextConsent = parseAnalyticsConsent(event.newValue);
			if (nextConsent === "unknown" || nextConsent === consentRef.current) {
				return;
			}
			setConsent(nextConsent);
		};
		window.addEventListener("storage", handleStorage);
		return () => window.removeEventListener("storage", handleStorage);
	}, [setConsent]);

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
