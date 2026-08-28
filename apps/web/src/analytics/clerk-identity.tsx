import { useAuth } from "@clerk/tanstack-react-start";
import { useEffect, useRef } from "react";

import { useAnalytics } from "./context";

export function ClerkAnalyticsIdentity() {
	const { isLoaded, isSignedIn, userId } = useAuth();
	const { identify, isCapturing, resetIdentity } = useAnalytics();
	const identifiedUserRef = useRef<string | null>(null);

	useEffect(() => {
		if (!isCapturing) {
			identifiedUserRef.current = null;
			return;
		}
		if (!isLoaded) return;
		if (isSignedIn && userId) {
			if (identifiedUserRef.current === userId) return;
			if (identifiedUserRef.current) resetIdentity();
			if (identify(userId)) identifiedUserRef.current = userId;
			return;
		}
		if (identifiedUserRef.current) {
			resetIdentity();
			identifiedUserRef.current = null;
		}
	}, [identify, isCapturing, isLoaded, isSignedIn, resetIdentity, userId]);

	return null;
}
