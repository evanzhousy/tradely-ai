import { useEffect, useRef } from "react";

import { useAnalytics } from "./context";
import type { AnalyticsEventMap } from "./events";

type BillingStatusSurface =
	AnalyticsEventMap["billing_status_unavailable"]["surface"];

// A visible unavailable episode belongs to the current consent window. All
// access/progress surfaces use the same readiness and deduplication boundary.
export function useBillingStatusAnalytics(
	unavailable: boolean,
	surface: BillingStatusSurface,
) {
	const { capture, isCapturing } = useAnalytics();
	const capturedSurface = useRef<BillingStatusSurface | null>(null);

	useEffect(() => {
		if (!unavailable || !isCapturing) {
			capturedSurface.current = null;
			return;
		}
		if (capturedSurface.current === surface) return;
		if (capture("billing_status_unavailable", { surface })) {
			capturedSurface.current = surface;
		}
	}, [capture, isCapturing, surface, unavailable]);
}
