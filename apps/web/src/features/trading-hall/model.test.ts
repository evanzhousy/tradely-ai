import { readFileSync } from "node:fs";
import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { storyProgress, updateStoryCamera } from "./camera";

const file = readFileSync(
	new URL(
		"../../../public/models/trading-hall/trading-hall.glb",
		import.meta.url,
	),
);
const gltf = JSON.parse(
	file.subarray(20, 20 + file.readUInt32LE(12)).toString("utf8"),
);
it("exports the Blender market atlas as an actual textured mesh", () => {
	expect(file.readUInt32LE(0)).toBe(0x46546c67);
	expect(gltf.asset.generator).toContain("Blender");
	const node = gltf.nodes.find((n: { name: string }) =>
		n.name.startsWith("TH_MarketScreens"),
	);
	expect(node).toBeDefined();
	const primitive = gltf.meshes[node.mesh].primitives[0];
	expect(primitive.attributes.TEXCOORD_0).toBeDefined();
	const indices = gltf.accessors[primitive.indices];
	expect(indices.count).toBe(60 * 6);
	expect(
		gltf.nodes.find((n: { name: string }) =>
			n.name.startsWith("TH_TickerScreens"),
		),
	).toBeDefined();
	for (const name of [
		"TH_Walnut_PBR",
		"TH_WallStone_PBR",
		"TH_StoneFloor_PBR",
	]) {
		const material = gltf.materials.find(
			(m: { name: string }) => m.name === name,
		);
		expect(material.pbrMetallicRoughness.baseColorTexture).toBeDefined();
		expect(
			material.pbrMetallicRoughness.metallicRoughnessTexture,
		).toBeDefined();
		expect(material.normalTexture).toBeDefined();
	}
	expect(file.byteLength).toBeLessThan(8_000_000);
});
describe("scroll camera progress", () => {
	it("clamps to the stage endpoints", () => {
		expect(storyProgress(500, 2400, 900)).toBe(0);
		expect(storyProgress(64, 2400, 900)).toBe(0);
		expect(storyProgress(-3000, 2400, 900)).toBe(1);
		expect(storyProgress(-700, 2400, 900)).toBeGreaterThan(0);
		expect(storyProgress(-700, 2400, 900)).toBeLessThan(1);
	});
});

it("keeps the workstation inspection target in frame at the close-up beat", () => {
	const camera = new THREE.PerspectiveCamera(56, 1440 / 900, 0.1, 110);
	updateStoryCamera(camera, 2 / 3, new THREE.Vector2());
	camera.updateMatrixWorld(true);
	const target = new THREE.Vector3(-3.85, 1.94, 8.6).project(camera);
	expect(Math.abs(target.x)).toBeLessThan(0.5);
	expect(Math.abs(target.y)).toBeLessThan(0.6);
	expect(Math.abs(camera.position.x)).toBeLessThan(2.7);
});
