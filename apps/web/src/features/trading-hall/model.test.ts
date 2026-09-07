import { readFileSync } from "node:fs";
import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { INSPECTION_TARGET, storyProgress, updateStoryCamera } from "./camera";

const file = readFileSync(
	new URL(
		"../../../public/models/trading-hall/modern-v4/exchange.glb",
		import.meta.url,
	),
);
const gltf = JSON.parse(
	file.subarray(20, 20 + file.readUInt32LE(12)).toString("utf8"),
);
it("ships the modern Blender asset with the complete screen set and generated PBR surfaces", () => {
	expect(file.readUInt32LE(0)).toBe(0x46546c67);
	expect(gltf.asset.generator).toContain("Blender");
	expect(gltf.extensionsRequired).toContain("KHR_draco_mesh_compression");
	const panels = gltf.nodes.filter((n: { name: string }) =>
		/^EX4_live_Markets/.test(n.name),
	);
	const indices = panels.reduce((total: number, node: { mesh: number }) => {
		const primitive = gltf.meshes[node.mesh].primitives[0];
		expect(primitive.attributes.TEXCOORD_0).toBeDefined();
		return total + gltf.accessors[primitive.indices].count;
	}, 0);
	expect(indices).toBe(380 * 6);
	for (const name of [
		"EX4_room_Stone0",
		"EX4_stations_Wood0",
		"EX4_stations_Metal0",
		"EX4_room_Carpet0",
	]) {
		const material = gltf.materials.find(
			(m: { name: string }) => m.name === name,
		);
		expect(material.pbrMetallicRoughness.baseColorTexture).toBeDefined();
		expect(
			material.pbrMetallicRoughness.metallicRoughnessTexture,
		).toBeDefined();
		expect(material.normalTexture).toBeDefined();
		expect(material.pbrMetallicRoughness.baseColorFactor).toEqual([
			0.88, 0.88, 0.88, 1,
		]);
	}
	expect(gltf.meshes.length).toBeLessThanOrEqual(40);
	// 20-bit positions preserve narrow trim and lettering in the subpixel wireframe.
	expect(file.byteLength).toBeLessThan(7_000_000);
});
it("exports an independent second UV set and physical lighting range for every baked batch", () => {
	const groups = new Set<string>();
	let count = 0;
	for (const node of gltf.nodes) {
		if (!node.extras?.bake_map) continue;
		groups.add(node.extras.bake_map);
		expect(node.extras.bake_intensity).toBeGreaterThan(0);
		for (const primitive of gltf.meshes[node.mesh].primitives) {
			expect(primitive.attributes.TEXCOORD_0).toBeDefined();
			expect(primitive.attributes.TEXCOORD_1).toBeDefined();
			expect(primitive.attributes.TEXCOORD_0).not.toBe(
				primitive.attributes.TEXCOORD_1,
			);
		}
		count++;
	}
	expect(groups).toEqual(new Set(["room", "stations"]));
	expect(count).toBeGreaterThan(20);
});
describe("human viewpoint choreography", () => {
	it("uses only two forward transitions with stable reading holds and no reverse pan", () => {
		const camera = new THREE.PerspectiveCamera();
		const pointer = new THREE.Vector2();
		const previous = new THREE.Vector3();
		const direction = new THREE.Vector3();
		let transitions = 0;
		let moving = false;
		let previousHeading = 0;
		updateStoryCamera(camera, 0, pointer);
		previous.copy(camera.position);
		for (let step = 1; step <= 1000; step++) {
			updateStoryCamera(camera, step / 1000, pointer);
			const nextMoving = camera.position.distanceTo(previous) > 0.000001;
			if (nextMoving && !moving) transitions++;
			moving = nextMoving;
			expect(camera.position.z).toBeLessThanOrEqual(previous.z);
			camera.getWorldDirection(direction);
			const heading = Math.atan2(direction.x, -direction.z);
			expect(heading).toBeGreaterThanOrEqual(previousHeading - 0.000001);
			previousHeading = heading;
			previous.copy(camera.position);
		}
		expect(transitions).toBe(2);
		for (const [start, end] of [
			[0, 0.15],
			[0.43, 0.65],
			[0.87, 1],
		]) {
			updateStoryCamera(camera, start, pointer);
			const position = camera.position.clone();
			const rotation = camera.quaternion.clone();
			updateStoryCamera(camera, end, pointer);
			expect(camera.position.equals(position)).toBe(true);
			expect(camera.quaternion.equals(rotation)).toBe(true);
		}
	});
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
