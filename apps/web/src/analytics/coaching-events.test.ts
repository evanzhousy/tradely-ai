import { describe, expect, it } from "vitest";
import { isRegisteredAnalyticsEvent, pruneAnalyticsEventProperties } from "./events";
import { REPLAY_BLOCK_SELECTOR } from "./replay-privacy";

describe("coaching privacy contract", () => {
	it.each(["started", "feedback_viewed", "revision_saved", "cycle_completed", "failed"] as const)("registers %s with bounded metadata only", suffix => {
		const event = `lesson_coach_${suffix}` as const;
		const properties = { lesson_id: "rank-symbols", scenario_id: "rank-symbols-practice-1", scenario_version: 2, locale: "zh", round: "initial", reason: "unavailable", explanation: "private", feedback: "private", prompt: "private", snapshot: "private", user_id: "private" };
		expect(isRegisteredAnalyticsEvent(event)).toBe(true);
		pruneAnalyticsEventProperties(event, properties);
		expect(JSON.stringify(properties)).not.toContain("private");
		expect(properties.reason).toBe("unavailable");
	});
	it("blocks both inline and exported coaching surfaces from replay", () => {
		expect(REPLAY_BLOCK_SELECTOR).toContain("#interactive-practice");
		expect(REPLAY_BLOCK_SELECTOR).toContain("[data-analytics-private]");
	});
});
