import { describe, expect, it } from "vitest";
import { type StrategyLeg, valueStrategy } from "./strategy-concept";

const stock: StrategyLeg = {
	kind: "stock",
	id: "stock",
	shares: 100,
	entryPrice: 10000,
};
const call: StrategyLeg = {
	kind: "option",
	id: "call",
	option: "CALL",
	side: "long",
	strike: 10000,
	expiry: "2030-09-20",
	contracts: 1,
	multiplier: 100,
	premium: 600,
};
const put: StrategyLeg = { ...call, id: "put", option: "PUT", premium: 400 };
describe("signed strategy valuation", () => {
	it("keeps expiry payoff, signed entry premium and fees separate for a vertical", () => {
		expect(
			valueStrategy(
				[
					call,
					{
						...call,
						id: "short-call",
						side: "short",
						strike: 11000,
						premium: 200,
					},
				],
				11500,
				2500,
			),
		).toMatchObject({
			ok: true,
			terminalValue: 100000,
			entryCost: 40000,
			fees: 2500,
			profit: 57500,
		});
	});
	it("distinguishes covered and uncovered short-call upside exposure", () => {
		const short: StrategyLeg = {
			...call,
			id: "short",
			side: "short",
			strike: 10500,
			premium: 300,
		};
		expect(valueStrategy([stock, short], 11500)).toMatchObject({
			ok: true,
			terminalValue: 1050000,
			entryCost: 970000,
			profit: 80000,
		});
		expect(valueStrategy([short], 11500)).toMatchObject({
			ok: true,
			profit: -70000,
		});
		expect(valueStrategy([stock, short], 14000)).toMatchObject({
			ok: true,
			profit: 80000,
		});
		expect(valueStrategy([short], 14000)).toMatchObject({
			ok: true,
			profit: -320000,
		});
	});
	it("combines protective puts, straddles and collars from the actual supplied legs", () => {
		expect(valueStrategy([stock, put], 9000)).toMatchObject({
			ok: true,
			profit: -40000,
		});
		expect(valueStrategy([call, put], 9000)).toMatchObject({
			ok: true,
			profit: 0,
		});
		expect(valueStrategy([call, put], 10000)).toMatchObject({
			ok: true,
			profit: -100000,
		});
		const collar = [
			stock,
			{ ...put, strike: 9500, premium: 300 },
			{
				...call,
				id: "short",
				side: "short" as const,
				strike: 11000,
				premium: 200,
			},
		];
		expect(valueStrategy(collar, 9000)).toMatchObject({
			ok: true,
			profit: -60000,
		});
		expect(valueStrategy(collar, 12000)).toMatchObject({
			ok: true,
			profit: 90000,
		});
	});
	it("rejects incomplete, invalid or mixed-expiry baskets instead of fabricating one payoff", () => {
		expect(valueStrategy([], 10000)).toEqual({ ok: false, issue: "empty" });
		expect(
			valueStrategy([call, { ...put, expiry: "2030-10-18" }], 10000),
		).toEqual({ ok: false, issue: "mixed-expiry" });
		expect(valueStrategy([call, call], 10000)).toEqual({
			ok: false,
			issue: "invalid",
		});
		expect(valueStrategy([call], Number.NaN)).toEqual({
			ok: false,
			issue: "invalid",
		});
		expect(valueStrategy([{ ...call, multiplier: 0 }], 10000)).toEqual({
			ok: false,
			issue: "invalid",
		});
	});
});
