import { useEffect, useRef } from "react";
import { useAuth } from "@/auth/client";

import { consumePendingAuthSignIn } from "./auth-sign-in";
import { useAnalytics } from "./context";

export function AuthAnalyticsIdentity() {
	const { isLoaded, isSignedIn, userId } = useAuth();
	const { capture, identify, isPostHogCapturing, resetIdentity } =
		useAnalytics();
	const identifiedUserRef = useRef<string | null>(null);
	const sessionEventUserRef = useRef<string | null>(null);

	useEffect(() => {
		if (!isPostHogCapturing) {
			identifiedUserRef.current = null;
			sessionEventUserRef.current = null;
			return;
		}
		if (!isLoaded) return;
		if (isSignedIn && userId) {
			if (identifiedUserRef.current === userId) return;
			if (identifiedUserRef.current) resetIdentity();
			if (identify(userId)) {
				identifiedUserRef.current = userId;
				const signInMethod = consumePendingAuthSignIn();
				if (signInMethod) {
					capture("auth_sign_in_completed", {
						provider: "neon",
						method: signInMethod,
					});
				}
				if (sessionEventUserRef.current !== userId) {
					if (capture("auth_session_established", { provider: "neon" })) {
						sessionEventUserRef.current = userId;
					}
				}
			}
			return;
		}
		if (identifiedUserRef.current) {
			resetIdentity();
			identifiedUserRef.current = null;
			sessionEventUserRef.current = null;
		}
	}, [
		capture,
		identify,
		isPostHogCapturing,
		isLoaded,
		isSignedIn,
		resetIdentity,
		userId,
	]);

	return null;
}
