import { useAuth } from "@clerk/tanstack-react-start";
import { useEffect, useRef } from "react";

import { useAnalytics } from "./context";

export function ClerkAnalyticsIdentity() {
	const { isLoaded, isSignedIn, userId } = useAuth();
	const { capture, identify, isCapturing, resetIdentity } = useAnalytics();
	const identifiedUserRef = useRef<string | null>(null);
	const sessionEventUserRef = useRef<string | null>(null);

	useEffect(() => {
		if (!isCapturing) {
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
				if (sessionEventUserRef.current !== userId) {
					if (capture("auth_session_established", { provider: "clerk" })) {
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
		isCapturing,
		isLoaded,
		isSignedIn,
		resetIdentity,
		userId,
	]);

	return null;
}
