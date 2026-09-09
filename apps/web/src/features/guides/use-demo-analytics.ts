import { useRef } from "react";
import { useAnalytics } from "@/analytics/context";
import type { GuideSlug } from "@/content/guides";

/** A run starts on interaction. Consent changes never replay prior actions. */
export function useDemoAnalytics(guideId: GuideSlug) {
	const { capture, consent } = useAnalytics();
	const started = useRef(false);
	const trackedStart = useRef(false);
	const completed = useRef(false);
	function start() {
		if (started.current) return;
		started.current = true;
		if (consent === "granted")
			trackedStart.current = capture("guide_demo_started", {
				guide_id: guideId,
				demo_id: guideId,
				locale: "en",
			});
	}
	function complete() {
		start();
		if (completed.current) return;
		completed.current = true;
		if (consent === "granted" && trackedStart.current)
			capture("guide_demo_completed", {
				guide_id: guideId,
				demo_id: guideId,
				locale: "en",
			});
	}
	return { start, complete };
}
