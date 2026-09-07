import * as THREE from "three";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { describe, expect, it, vi } from "vitest";
import { createHallScan, hallScanState } from "./scan";

const backdrop = {
	texture: new THREE.Texture(),
	resolution: new THREE.Vector2(1, 1),
};

describe("scroll-driven 3D scan", () => {
	it("starts solid, scans once, and holds the complete wireframe at the end", () => {
		for (const progress of [0, 0.1, 0.2]) {
			expect(hallScanState(progress, false).active).toBe(false);
		}
		for (const progress of [0.64, 0.9, 1]) {
			expect(hallScanState(progress, false)).toMatchObject({
				active: true,
				scanning: false,
				phase: 1,
			});
		}
		let sweeps = 0;
		let active = false;
		let height = Number.NEGATIVE_INFINITY;
		for (let i = 0; i <= 100; i++) {
			const state = hallScanState(i / 100, false);
			if (state.scanning && !active) sweeps++;
			active = state.scanning;
			expect(state.height).toBeGreaterThanOrEqual(height);
			height = state.height;
			expect(hallScanState(i / 100, true).active).toBe(false);
		}
		expect(sweeps).toBe(1);
		expect(hallScanState(0.21, false).height).toBeLessThan(0);
		expect(hallScanState(0.63, false).height).toBeGreaterThan(13.5);
		// The same scroll position has the same band, including reverse scrolling.
		const middle = hallScanState(0.4, false);
		hallScanState(0.6, false);
		expect(hallScanState(0.4, false)).toEqual(middle);
	});
	it("holds scanned outlines through closing and preserves shared model resources", () => {
		const scene = new THREE.Scene();
		const root = new THREE.Group();
		const geometry = new THREE.BoxGeometry();
		const material = new THREE.MeshStandardMaterial();
		material.name = "EX4_stations_Wood0";
		const originalCompile = material.onBeforeCompile;
		const originalCache = material.customProgramCacheKey;
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(3, 2, 1);
		root.add(mesh, new THREE.Mesh(geometry, material));
		scene.add(root);
		const geometryDisposed = vi.spyOn(geometry, "dispose");
		const materialDisposed = vi.spyOn(material, "dispose");
		const scan = createHallScan(root, scene, false, backdrop);
		expect(scan.update(0, false).active).toBe(false);
		expect(scene.children.filter((o) => o !== root && o.visible)).toHaveLength(
			0,
		);
		expect(scan.update(0.35, false).active).toBe(true);
		const outlines = scene.getObjectByName(
			"Exchange scan wireframe",
		) as THREE.Group;
		expect(outlines.children).toHaveLength(2);
		expect(outlines.children[0].matrix.elements).toEqual(
			mesh.matrixWorld.elements,
		);
		const line = outlines.children[0] as LineSegments2;
		expect(line).toBeInstanceOf(LineSegments2);
		expect(material.depthWrite).toBe(true);
		expect(material.transparent).toBe(false);
		const lineDisposed = vi.spyOn(line.geometry, "dispose");
		scan.update(0.8, false);
		expect(outlines.visible).toBe(true);
		scan.update(0, false);
		expect(outlines.visible).toBe(false);
		scan.update(0.35, false);
		expect(scene.children).toHaveLength(2);
		scan.dispose();
		expect(scene.children).toEqual([root]);
		expect(material.onBeforeCompile).toBe(originalCompile);
		expect(material.customProgramCacheKey).toBe(originalCache);
		expect(material.polygonOffset).toBe(false);
		expect(material.transparent).toBe(false);
		expect(material.forceSinglePass).toBe(false);
		expect(lineDisposed).toHaveBeenCalledOnce();
		expect(geometryDisposed).not.toHaveBeenCalled();
		expect(materialDisposed).not.toHaveBeenCalled();
		geometry.dispose();
		material.dispose();
	});
	it("keeps the existing material hook and updates the scan without rebuilding shaders", () => {
		const scene = new THREE.Scene();
		const material = new THREE.MeshStandardMaterial();
		material.name = "EX4_Metal";
		const originalCompile = vi.fn();
		material.onBeforeCompile = originalCompile;
		const mesh = new THREE.Mesh(new THREE.BoxGeometry(), material);
		scene.add(mesh);
		const scan = createHallScan(mesh, scene, false, backdrop);
		const shader = {
			uniforms: {},
			vertexShader: "#include <common>\n#include <begin_vertex>",
			fragmentShader: "#include <common>\n#include <opaque_fragment>",
		} as Parameters<THREE.Material["onBeforeCompile"]>[0];
		material.onBeforeCompile(shader, {} as THREE.WebGLRenderer);
		expect(originalCompile).toHaveBeenCalledOnce();
		expect(shader.uniforms.uHallScanEnabled.value).toBe(0);
		expect(shader.uniforms.uHallDataMap.value).toBe(backdrop.texture);
		scan.update(0.32, false);
		expect(shader.uniforms.uHallScanEnabled.value).toBe(1);
		expect(shader.uniforms.uHallScanHeight.value).toBeCloseTo(
			hallScanState(0.32, false).height,
		);
		scan.update(1, false);
		expect(shader.uniforms.uHallScanComplete.value).toBe(1);
		expect(shader.uniforms.uHallScanEnabled.value).toBe(1);
		scan.update(0.32, false);
		expect(shader.uniforms.uHallScanComplete.value).toBe(0);
		scan.update(0.32, true);
		expect(shader.uniforms.uHallScanEnabled.value).toBe(0);
		scan.dispose();
		mesh.geometry.dispose();
		material.dispose();
	});
	it("skips outline construction for a reduced-motion visit", () => {
		const scene = new THREE.Scene();
		const root = new THREE.Group();
		scene.add(root);
		const scan = createHallScan(root, scene, true, backdrop);
		expect(scan.update(0.35, true).active).toBe(false);
		expect(scene.children).toEqual([root]);
		scan.dispose();
	});
});
