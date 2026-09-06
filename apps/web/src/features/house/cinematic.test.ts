import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { QUALITY } from "./cinematic";

describe("cinematic quality budgets", () => {
	it("reduces costly passes, pixel density and particle budgets on low quality", () => {
		expect(QUALITY.low.ao).toBe(false);
		expect(QUALITY.low.bloom).toBe(false);
		expect(QUALITY.low.shafts).toBe(false);
		expect(QUALITY.low.particles).toBeLessThan(QUALITY.medium.particles);
		expect(QUALITY.medium.pixelRatio).toBeLessThan(QUALITY.high.pixelRatio);
	});
	it("ships both baked lightmaps with the atlas resolution", () => {
		for (const level of ["groundfloor", "upperfloor"]) {
			const bytes = readFileSync(
				new URL(
					`../../../public/models/kirkland-house/${level}-indirect.png`,
					import.meta.url,
				),
			);
			expect(bytes.subarray(1, 4).toString()).toBe("PNG");
			expect(bytes.readUInt32BE(16)).toBe(1024);
			expect(bytes.readUInt32BE(20)).toBe(1024);
		}
	});
});
