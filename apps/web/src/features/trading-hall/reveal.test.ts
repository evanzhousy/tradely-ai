import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import {
	createHallReveal,
	HALL_REVEAL_DURATION,
	hallRevealProgress,
} from "./reveal";

describe("wireframe-to-solid reveal", () => {
	it("holds a readable wireframe, transitions monotonically, and finishes completely", () => {
		expect(hallRevealProgress(0, false)).toBe(0);
		expect(hallRevealProgress(0.5, false)).toBe(0);
		let previous = 0;
		for (let t = 0; t < 4; t += 0.05) {
			const progress = hallRevealProgress(t, false);
			expect(progress).toBeGreaterThanOrEqual(previous);
			expect(progress).toBeLessThanOrEqual(1);
			previous = progress;
		}
		expect(hallRevealProgress(1.425, false)).toBeCloseTo(0.5);
		expect(hallRevealProgress(HALL_REVEAL_DURATION, false)).toBe(1);
		expect(hallRevealProgress(0, true)).toBe(1);
	});
	it("hides transient meshes after completion and preserves shared model resources on cleanup", () => {
		const scene = new THREE.Scene();
		const root = new THREE.Group();
		const geometry = new THREE.BoxGeometry();
		const material = new THREE.MeshStandardMaterial();
		material.name = "EX3_FasciaPBR";
		const originalCompile = material.onBeforeCompile;
		const originalCache = material.customProgramCacheKey;
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(3, 2, 1);
		root.add(mesh, new THREE.Mesh(geometry, material));
		scene.add(root);
		const geometryDisposed = vi.spyOn(geometry, "dispose");
		const materialDisposed = vi.spyOn(material, "dispose");
		const reveal = createHallReveal(root, scene, false);
		expect(reveal.update(0, false)).toBe(0);
		expect(scene.children.filter((o) => o !== root && o.visible)).toHaveLength(
			2,
		);
		reveal.update(HALL_REVEAL_DURATION, false);
		expect(scene.children.filter((o) => o !== root && o.visible)).toHaveLength(
			0,
		);
		reveal.update(0, false);
		expect(scene.children).toHaveLength(3);
		reveal.dispose();
		expect(scene.children).toEqual([root]);
		expect(material.onBeforeCompile).toBe(originalCompile);
		expect(material.customProgramCacheKey).toBe(originalCache);
		expect(geometryDisposed).not.toHaveBeenCalled();
		expect(materialDisposed).not.toHaveBeenCalled();
		geometry.dispose();
		material.dispose();
	});
	it("skips wireframe construction entirely for an initial reduced-motion visit", () => {
		const scene = new THREE.Scene();
		const root = new THREE.Group();
		scene.add(root);
		const reveal = createHallReveal(root, scene, true);
		expect(reveal.update(0, true)).toBe(1);
		expect(scene.children).toEqual([root]);
		reveal.dispose();
	});
});
