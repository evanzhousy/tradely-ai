import { describe, expect, it } from "vitest";
import { MARKET_SCREEN_COUNT, quoteAt, simulatedCandle } from "./market";

describe("fictional market display data", () => {
	it("updates every screen deterministically without invalid OHLC bars", () => {
		for (let screen = 0; screen < MARKET_SCREEN_COUNT; screen++) {
			expect(quoteAt(screen, 0)).not.toBe(quoteAt(screen, 5));
			expect(quoteAt(screen, 5)).toBe(quoteAt(screen, 5));
			for (let bar = 0; bar < 64; bar++) {
				const c = simulatedCandle(screen, bar, 5);
				expect(c.low).toBeLessThanOrEqual(Math.min(c.open, c.close));
				expect(c.high).toBeGreaterThanOrEqual(Math.max(c.open, c.close));
				expect(c.low).toBeGreaterThan(0);
			}
		}
	});
	it("keeps historical bars stable while the current bar updates", () => {
		expect(simulatedCandle(4, 12, 0)).toEqual(simulatedCandle(4, 12, 40));
		expect(simulatedCandle(4, 63, 0)).not.toEqual(simulatedCandle(4, 63, 40));
	});
});
