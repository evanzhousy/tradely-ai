import type { PostHogClient } from "./client";
import { sanitizeAnalyticsUrl } from "./events";
import { redactAnalyticsText } from "./redaction";

type ReplayOptions = NonNullable<PostHogClient["config"]["session_recording"]>;

export const REPLAY_BLOCK_SELECTOR =
	"img, video, audio, canvas, iframe, object, embed, script, noscript, #interactive-practice, .lesson-prose, [data-analytics-private]";

// Preserve layout, not application data, in DOM attributes. Text and inputs are
// independently masked by rrweb before snapshots are serialized/compressed.
export function maskReplayAttribute(name: string, value: string): string {
	if (
		!/^(class|id|style|_cssText|role|type|dir|lang|width|height|hidden|disabled|checked|selected|open|tabindex|aria-(hidden|expanded|checked|pressed|selected)|data-(state|side|align|orientation))$/i.test(
			name,
		)
	) {
		return "[masked]";
	}
	return redactAnalyticsText(
		value.replace(/url\([^)]*\)/gi, 'url("")'),
		value.length,
	);
}

export const replayPrivacyOptions: ReplayOptions = {
	maskAllInputs: true,
	maskAllElementAttributes: false,
	maskTextSelector: "*",
	blockSelector: REPLAY_BLOCK_SELECTOR,
	maskAttributeFn: maskReplayAttribute,
	recordCrossOriginIframes: false,
	captureCanvas: { recordCanvas: false },
	captureJsonLd: false,
	recordHeaders: false,
	recordBody: false,
	collectFonts: false,
	slimDOMOptions: true,
	maskCapturedNetworkRequestFn: (request) => {
		// The recorder also uses this callback for replay page URLs. Keep only
		// their sanitized location; discard real request/response diagnostics.
		if (Object.keys(request).length !== 1 && !request.isInitial) return null;
		return {
			name: sanitizeAnalyticsUrl(request.name) as string,
			entryType: "navigation",
			startTime: 0,
			duration: 0,
		};
	},
};

export function sanitizeHeatmapUrls(properties: Record<string, unknown>) {
	const data = properties.$heatmap_data;
	if (!data || typeof data !== "object" || Array.isArray(data)) return;
	const sanitized: Record<string, unknown[]> = Object.create(null);
	for (const [url, points] of Object.entries(data)) {
		if (!Array.isArray(points)) continue;
		const path = sanitizeAnalyticsUrl(url) as string;
		sanitized[path] ??= [];
		sanitized[path].push(...points);
	}
	properties.$heatmap_data = sanitized;
}
