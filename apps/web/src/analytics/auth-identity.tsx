import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/auth/client";
import { clearPendingAuthSignIn, readPendingAuthSignIn } from "./auth-sign-in";
import { useAnalytics } from "./context";

export function AuthAnalyticsIdentity() {
	const { isLoaded, isSignedIn, userId } = useAuth();
	const { capture, consent, identify, isPostHogCapturing, resetIdentity } =
		useAnalytics();
	const identifiedUserRef = useRef<string | null>(null);
	const sessionEventUserRef = useRef<string | null>(null);
	const [captureRevision, retryCapture] = useState(0);

	useEffect(() => {
		if (!isPostHogCapturing) {
			identifiedUserRef.current = null;
			sessionEventUserRef.current = null;
			if (captureRevision !== 0) retryCapture(0);
			if (consent === "denied") clearPendingAuthSignIn();
			return;
		}
		if (!isLoaded) return;
		if (isSignedIn && userId) {
			if (identifiedUserRef.current !== userId) {
				if (identifiedUserRef.current) resetIdentity();
				if (!identify(userId)) return;
				identifiedUserRef.current = userId;
				if (captureRevision !== 0) retryCapture(0);
			}
			let pending = false;
			const method = readPendingAuthSignIn();
			if (method) {
				if (capture("auth_sign_in_completed", { provider: "neon", method })) {
					clearPendingAuthSignIn();
				} else pending = true;
			}
			if (sessionEventUserRef.current !== userId) {
				if (capture("auth_session_established", { provider: "neon" })) {
					sessionEventUserRef.current = userId;
				} else pending = true;
			}
			// Retry local acceptance briefly; authentication never waits for telemetry.
			if (pending && captureRevision < 3) {
				const timer = window.setTimeout(() => retryCapture((n) => n + 1), 250);
				return () => window.clearTimeout(timer);
			}
			return;
		}
		if (identifiedUserRef.current) {
			resetIdentity();
			identifiedUserRef.current = null;
			sessionEventUserRef.current = null;
			if (captureRevision !== 0) retryCapture(0);
		}
	}, [
		capture,
		captureRevision,
		consent,
		identify,
		isPostHogCapturing,
		isLoaded,
		isSignedIn,
		resetIdentity,
		userId,
	]);
	return null;
}
