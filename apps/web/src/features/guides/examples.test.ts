import { describe, expect, it } from "vitest";
import { reportedOiChange } from "@/domain/learning/flow-structure";
import {
	gexContributions,
	ivQuotes,
	oiLedger,
	quotePnl,
	summarizeGex,
} from "./examples";

describe("public teaching calculations", () => {
	it("distinguishes cancellation, missing values and explicit zeros", () => {
		expect(summarizeGex(gexContributions)).toEqual({
			net: 1000,
			gross: 4000,
			knownSubtotal: 1000,
		});
		expect(summarizeGex([2000, -1500, null])).toEqual({
			net: null,
			gross: null,
			knownSubtotal: 500,
		});
		expect(summarizeGex([2000, -1500, 0])).toEqual({
			net: 500,
			gross: 3500,
			knownSubtotal: 500,
		});
		expect(summarizeGex([20, -20])).toEqual({
			net: 0,
			gross: 40,
			knownSubtotal: 0,
		});
	});
	it("counts volume once per traded contract, including closing and transfer trades", () => {
		expect([0, 1, 2, 3].map(oiLedger)).toEqual([
			{ volume: 0, oi: 100 },
			{ volume: 80, oi: 180 },
			{ volume: 120, oi: 140 },
			{ volume: 190, oi: 140 },
		]);
		const previousOi = { value: 100, scope: "same-series", asOf: "2026-09-02" };
		const reportedOi = { value: 140, scope: "same-series", asOf: "2026-09-03" };
		expect(reportedOiChange({ previousOi, reportedOi })).toBe(40);
		for (const invalid of [
			{ ...reportedOi, scope: "different-series" },
			{ ...reportedOi, value: null },
			{ ...reportedOi, asOf: "2026-09-01" },
		])
			expect(reportedOiChange({ previousOi, reportedOi: invalid })).toBeNull();
	});
	it("calculates only changes in supplied quotes with a single multiplier", () => {
		expect(ivQuotes.map((quote) => quotePnl(quote.premium))).toEqual([
			0, -200, 300,
		]);
		for (const quote of ivQuotes) {
			expect(quote.premium).toBeGreaterThanOrEqual(
				Math.max(0, quote.spot - 105),
			);
			expect(quote.premium).toBeLessThan(quote.spot);
		}
	});
});
