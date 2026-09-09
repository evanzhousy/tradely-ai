import type { PostHogClient } from "./client";

export function applyBrowserCaptureConsent(
	client: PostHogClient,
	granted: boolean,
): boolean {
	if (granted) client.opt_in_capturing({ captureEventName: false });
	else client.opt_out_capturing();
	const capturing = granted && !client.has_opted_out_capturing();
	// Disabling heatmaps removes listeners and clears their in-memory buffer;
	// opting out of event delivery alone does not prevent pre-consent buffering.
	client.set_config({
		capture_heatmaps: capturing,
		capture_pageleave: capturing,
		disable_session_recording: !capturing,
	});
	return capturing;
}
