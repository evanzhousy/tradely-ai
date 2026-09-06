import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("web house asset contract", () => {
	it("ships a self-contained GLB with all toggleable layers and no original scene or lights", () => {
		const buffer = readFileSync(
			new URL(
				"../../../public/models/kirkland-house/house.glb",
				import.meta.url,
			),
		);
		expect(buffer.toString("utf8", 0, 4)).toBe("glTF");
		expect(buffer.readUInt32LE(4)).toBe(2);
		expect(buffer.readUInt32LE(8)).toBe(buffer.length);
		const length = buffer.readUInt32LE(12);
		const gltf = JSON.parse(buffer.toString("utf8", 20, 20 + length));
		expect(
			gltf.nodes
				.map((node: { extras: { layer: string } }) => node.extras.layer)
				.sort(),
		).toEqual([
			"Architecture",
			"Context",
			"Landscape",
			"Roofs",
			"Trim and masonry",
			"Windows and doors",
		]);
		expect(gltf.buffers.every((buffer: { uri?: string }) => !buffer.uri)).toBe(
			true,
		);
		expect(gltf.cameras).toBeUndefined();
		expect(buffer.length).toBeLessThan(4_000_000);
	});
});
