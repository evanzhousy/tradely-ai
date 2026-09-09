import { describe, expect, it, vi } from "vitest";
import { applyBrowserCaptureConsent } from "./browser-consent";
import type { PostHogClient } from "./client";
import {
	maskReplayAttribute,
	replayPrivacyOptions,
	sanitizeHeatmapUrls,
} from "./replay-privacy";

describe("replay and heatmap privacy", () => {
	it("keeps useful layout but masks user and media attributes", () => {
		expect(maskReplayAttribute("class", "rounded-xl bg-card")).toBe(
			"rounded-xl bg-card",
		);
		for (const attribute of [
			"value",
			"title",
			"aria-label",
			"data-answer",
			"href",
			"src",
			"srcset",
		]) {
			expect(maskReplayAttribute(attribute, "private-content")).toBe(
				"[masked]",
			);
		}
		expect(
			maskReplayAttribute(
				"style",
				"background-image:url(https://private.test/media?token=secret)",
			),
		).not.toContain("secret");
	});

	it("sanitizes replay page locations and drops request headers and bodies", () => {
		const mask = replayPrivacyOptions.maskCapturedNetworkRequestFn;
		if (!mask) throw new Error("Missing replay URL boundary");
		const request = {
			name: "https://tradely.ai/pricing?session_id=secret#fragment",
			entryType: "resource",
			startTime: 1,
			duration: 2,
		};
		expect(
			mask({
				...request,
				method: "POST",
				requestBody: "private",
				responseBody: "private",
			}),
		).toBeNull();
		expect(
			mask({
				...request,
				isInitial: true,
				requestHeaders: { authorization: "private" },
			}),
		).toEqual({
			name: "https://tradely.ai/pricing",
			entryType: "navigation",
			startTime: 0,
			duration: 0,
		});
		// The SDK supplies only `name` when masking rrweb metadata/navigation URLs.
		expect(mask({ name: request.name } as typeof request)?.name).toBe(
			"https://tradely.ai/pricing",
		);
	});

	it("merges heatmap URL buckets without retaining query strings or fragments", () => {
		const properties = {
			$heatmap_data: {
				"https://tradely.ai/pricing?token=one": [{ x: 1, y: 2, type: "click" }],
				"https://tradely.ai/pricing?token=two#private": [
					{ x: 3, y: 4, type: "mousemove" },
				],
			},
		};
		sanitizeHeatmapUrls(properties);
		expect(properties.$heatmap_data).toEqual({
			"https://tradely.ai/pricing": [
				{ x: 1, y: 2, type: "click" },
				{ x: 3, y: 4, type: "mousemove" },
			],
		});
	});

	it("disables visual capture as well as event delivery when consent is withdrawn", () => {
		const client = {
			opt_in_capturing: vi.fn(),
			opt_out_capturing: vi.fn(),
			has_opted_out_capturing: vi.fn(() => false),
			set_config: vi.fn(),
		};
		expect(
			applyBrowserCaptureConsent(client as unknown as PostHogClient, true),
		).toBe(true);
		expect(client.set_config).toHaveBeenLastCalledWith({
			capture_heatmaps: true,
			capture_pageleave: true,
			disable_session_recording: false,
		});
		expect(
			applyBrowserCaptureConsent(client as unknown as PostHogClient, false),
		).toBe(false);
		expect(client.set_config).toHaveBeenLastCalledWith({
			capture_heatmaps: false,
			capture_pageleave: false,
			disable_session_recording: true,
		});
		client.has_opted_out_capturing.mockReturnValue(true);
		expect(
			applyBrowserCaptureConsent(client as unknown as PostHogClient, true),
		).toBe(false);
		expect(client.set_config).toHaveBeenLastCalledWith({
			capture_heatmaps: false,
			capture_pageleave: false,
			disable_session_recording: true,
		});
	});
});
