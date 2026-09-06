import { readFileSync } from "node:fs";
import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { INSPECTION_TARGET, storyProgress, updateStoryCamera } from "./camera";

const file = readFileSync(
	new URL(
		"../../../public/models/trading-hall/night-v3/exchange.glb",
		import.meta.url,
	),
);
const gltf = JSON.parse(
	file.subarray(20, 20 + file.readUInt32LE(12)).toString("utf8"),
);
it("ships the night Blender model with all market screens and usable PBR maps", () => {
	expect(file.readUInt32LE(0)).toBe(0x46546c67);
	expect(gltf.asset.generator).toContain("Blender");
	expect(gltf.extensionsRequired).toContain("KHR_draco_mesh_compression");
	const node = gltf.nodes.find(
		(n: { name: string }) => n.name === "EX3_Markets",
	);
	expect(node).toBeDefined();
	const primitive = gltf.meshes[node.mesh].primitives[0];
	expect(primitive.attributes.TEXCOORD_0).toBeDefined();
	expect(gltf.accessors[primitive.indices].count).toBe(380 * 6);
	for (const [name, tint] of [
		["EX3_FasciaPBR", [0.3, 0.19, 0.1, 1]],
	] as const) {
		const material = gltf.materials.find(
			(m: { name: string }) => m.name === name,
		);
		expect(material.pbrMetallicRoughness.baseColorTexture).toBeDefined();
		expect(material.pbrMetallicRoughness.baseColorFactor).toEqual(tint);
		expect(
			material.pbrMetallicRoughness.metallicRoughnessTexture,
		).toBeDefined();
		expect(material.normalTexture).toBeDefined();
	}
	const carpet = gltf.materials.find(
		(m: { name: string }) => m.name === "EX3_CharcoalCarpetPBR",
	);
	expect(carpet.pbrMetallicRoughness.baseColorTexture).toBeDefined();
	expect(carpet.pbrMetallicRoughness.metallicFactor).toBe(0);
	expect(carpet.pbrMetallicRoughness.roughnessFactor ?? 1).toBe(1);
	expect(carpet.pbrMetallicRoughness.metallicRoughnessTexture).toBeDefined();
	expect(carpet.normalTexture).toBeDefined();
	expect(
		gltf.nodes.some((n: { name: string }) =>
			/OakPBR|plank joints/.test(n.name),
		),
	).toBe(false);
	expect(gltf.meshes).toHaveLength(16);
	expect(file.byteLength).toBeLessThan(4_000_000);
});
describe("human viewpoint choreography", () => {
	it("clamps scroll progress to the story endpoints", () => {
		expect(storyProgress(500, 2400, 900)).toBe(0);
		expect(storyProgress(64, 2400, 900)).toBe(0);
		expect(storyProgress(-3000, 2400, 900)).toBe(1);
		expect(storyProgress(-700, 2400, 900)).toBeGreaterThan(0);
		expect(storyProgress(-700, 2400, 900)).toBeLessThan(1);
	});
	it("keeps the entire camera path at human height and outside the seven trading posts", () => {
		const camera = new THREE.PerspectiveCamera(49, 1.6, 0.08, 120);
		const posts = [
			[-6.2, 6.2, 4],
			[5.8, 6.6, 4.2],
			[0, -3, 3.7],
			[-8, -5.2, 3.25],
			[8, -5.6, 3.25],
			[-5.4, -13, 3.1],
			[4.9, -13.2, 3.1],
		];
		for (let step = 0; step <= 200; step++) {
			for (const offset of [-0.5, 0, 0.5]) {
				updateStoryCamera(
					camera,
					step / 200,
					new THREE.Vector2(offset, offset),
				);
				expect(camera.position.y).toBeGreaterThanOrEqual(1.67);
				expect(camera.position.y).toBeLessThanOrEqual(1.73);
				for (const [x, z, radius] of posts) {
					expect(
						Math.hypot(camera.position.x - x, camera.position.z - z),
					).toBeGreaterThan(radius + 0.3);
				}
			}
		}
	});
	it("frames the real foreground terminal during the inspection beat", () => {
		const camera = new THREE.PerspectiveCamera(49, 1440 / 900, 0.08, 120);
		updateStoryCamera(camera, 0.5, new THREE.Vector2());
		camera.updateMatrixWorld(true);
		const target = INSPECTION_TARGET.clone().project(camera);
		expect(Math.abs(target.x)).toBeLessThan(0.1);
		expect(Math.abs(target.y)).toBeLessThan(0.1);
	});
});
