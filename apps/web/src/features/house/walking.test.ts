import { describe, expect, it } from "vitest";
import { canWalk, walkStep } from "./walking";

describe("avatar movement boundaries", () => {
	it("allows driveway and routes around both sides and rear", () => {
		for (const [x, z] of [
			[0, 5],
			[5, -5],
			[-11, -5],
			[0, -12],
		])
			expect(canWalk(x, z)).toBe(true);
	});
	it("blocks house volumes and the edge of the site", () => {
		for (const [x, z] of [
			[0, -2],
			[-7, -5],
			[0, -8],
			[8, 0],
			[0, 9],
		])
			expect(canWalk(x, z)).toBe(false);
	});
	it("slides along a wall without moving inside it", () => {
		expect(walkStep(0, 0.4, 0.08, -0.1)).toEqual({ x: 0.08, z: 0.4 });
	});
});
