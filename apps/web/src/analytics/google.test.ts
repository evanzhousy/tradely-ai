// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { AnalyticsEventMap } from "./events";
import {
	captureGoogleAnalyticsEvent,
	disableGoogleAnalytics,
	doNotTrackEnabled,
	enableGoogleAnalytics,
} from "./google";

function setDoNotTrack(value: string | undefined) {
	Object.defineProperty(window.navigator, "doNotTrack", {
		configurable: true,
		value,
	});
}

describe("Google Analytics privacy boundary", () => {
	beforeEach(() => {
		disableGoogleAnalytics();
		delete window.gtag;
		delete window.dataLayer;
		document.getElementById("tradely-google-analytics-tag")?.remove();
		setDoNotTrack(undefined);
	});

	afterEach(() => {
		disableGoogleAnalytics();
	});

	it("detects browser Do Not Track values", () => {
		setDoNotTrack("1");
		expect(doNotTrackEnabled()).toBe(true);
		setDoNotTrack("yes");
		expect(doNotTrackEnabled()).toBe(true);
		setDoNotTrack("0");
		expect(doNotTrackEnabled()).toBe(false);
	});

	it("does not initialize or capture while Do Not Track is enabled", () => {
		setDoNotTrack("1");
		expect(enableGoogleAnalytics()).toBe(false);
		expect(window.gtag).toBeUndefined();
	});

	it("starts in denied consent mode before an explicit grant", () => {
		expect(enableGoogleAnalytics()).toBe(true);
		const defaultConsent = [...(window.dataLayer ?? [])].find(
			(entry) =>
				Array.isArray(entry) &&
				entry[0] === "consent" &&
				entry[1] === "default",
		) as unknown[] | undefined;
		expect(defaultConsent?.[2]).toMatchObject({
			ad_personalization: "denied",
			ad_storage: "denied",
			ad_user_data: "denied",
			analytics_storage: "denied",
		});
	});

	it("stops an active stream when Do Not Track changes", () => {
		expect(enableGoogleAnalytics()).toBe(true);
		expect(
			captureGoogleAnalyticsEvent("auth_sign_in_opened", { surface: "header" }),
		).toBe(true);
		setDoNotTrack("1");
		expect(
			captureGoogleAnalyticsEvent("auth_sign_in_opened", { surface: "header" }),
		).toBe(false);
	});

	it("forwards only allowlisted custom properties", () => {
		expect(enableGoogleAnalytics()).toBe(true);
		const properties = {
			access_state: "allowed",
			email: "user@example.com",
			lesson_id: "lesson-1",
		} as unknown as AnalyticsEventMap["lesson_opened"];
		expect(captureGoogleAnalyticsEvent("lesson_opened", properties)).toBe(true);

		const eventEntry = [...(window.dataLayer ?? [])]
			.reverse()
			.find(
				(entry) =>
					Array.isArray(entry) &&
					entry[0] === "event" &&
					entry[1] === "lesson_opened",
			) as unknown[] | undefined;
		const payload = eventEntry?.[2] as Record<string, unknown> | undefined;
		expect(payload).toMatchObject({
			access_state: "allowed",
			lesson_id: "lesson-1",
		});
		expect(payload).not.toHaveProperty("email");
	});
});
