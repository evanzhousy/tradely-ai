import { describe, expect, it } from "vitest";

import {
	boundedServerTimingMs,
	shouldCaptureServerTiming,
} from "./server-timing";

describe("server timing", () => {
	it("rounds and bounds duration values", () => {
		expect(boundedServerTimingMs(1_234.6)).toBe(1_235);
		expect(boundedServerTimingMs(-10)).toBe(0);
		expect(boundedServerTimingMs(100_000)).toBe(60_000);
		expect(boundedServerTimingMs(Number.NaN)).toBe(0);
	});

	it("captures only slow loader timings", () => {
		expect(shouldCaptureServerTiming(999.9)).toBe(false);
		expect(shouldCaptureServerTiming(1_000)).toBe(true);
	});
});
