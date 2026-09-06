import { describe, expect, it } from "vitest";
import { sunsetLighting } from "./sunlight";

describe("sunset lighting", () => {
	it("moves around the house at constant distance and elevation", () => {
		const front = sunsetLighting(0, 0);
		const right = sunsetLighting(90, 0);
		expect(front.position[0]).toBeCloseTo(0);
		expect(right.position[2]).toBeCloseTo(0);
		expect(right.position[0]).toBeCloseTo(front.position[2]);
		expect(Math.hypot(...right.position)).toBeCloseTo(30);
		expect(sunsetLighting(360, 0)).toEqual(front);
	});
	it("fades direct sun completely below the horizon while keeping dusk ambient light", () => {
		const dusk = sunsetLighting(38, 1);
		expect(dusk.elevation).toBe(-6);
		expect(dusk.intensity).toBe(0);
		expect(dusk.ambient).toBeGreaterThan(0);
		expect(dusk.ambient).toBeLessThan(sunsetLighting(38, 0).ambient);
		expect(sunsetLighting(38, 2)).toEqual(dusk);
	});
});
