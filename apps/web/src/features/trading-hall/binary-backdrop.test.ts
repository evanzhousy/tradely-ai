import * as THREE from "three";
import { afterEach, expect, it, vi } from "vitest";
import { createBinaryBackdrop } from "./binary-backdrop";

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

it("reveals one reusable binary layer with the scan and releases its resources", () => {
	const drawing = { fillText: vi.fn() };
	const canvas = { width: 0, height: 0, getContext: () => drawing };
	vi.stubGlobal("document", { createElement: vi.fn(() => canvas) });
	const scene = new THREE.Scene();
	const backdrop = createBinaryBackdrop(scene, false);
	const texture = backdrop.texture;
	const disposeTexture = vi.spyOn(THREE.Texture.prototype, "dispose");
	const disposeGeometry = vi.spyOn(backdrop.mesh.geometry, "dispose");
	const disposeMaterial = vi.spyOn(THREE.Material.prototype, "dispose");
	expect(drawing.fillText.mock.calls.map((call) => call[0])).toEqual([
		"0",
		"1",
	]);
	expect(backdrop.update(0, 0, false)).toBe(0);
	expect(backdrop.update(2, 0.4, false)).toBe(1);
	expect(backdrop.update(3, 1, false)).toBe(1);
	expect(backdrop.texture).toBe(texture);
	expect(drawing.fillText).toHaveBeenCalledTimes(2);
	expect(backdrop.update(4, 1, true)).toBe(0);
	expect(backdrop.update(4, 0, false)).toBe(0);
	backdrop.resize(390, 844, 2);
	expect(backdrop.resolution.toArray()).toEqual([780, 1688]);
	const disposeTarget = vi.spyOn(THREE.WebGLRenderTarget.prototype, "dispose");
	backdrop.dispose();
	expect(scene.children).toHaveLength(0);
	expect(disposeTexture).toHaveBeenCalledOnce();
	expect(disposeGeometry).toHaveBeenCalledOnce();
	expect(disposeMaterial).toHaveBeenCalledTimes(2);
	expect(disposeTarget).toHaveBeenCalledOnce();
});

it("restores the renderer target and clearing state if drawing the data layer fails", () => {
	vi.stubGlobal("document", {
		createElement: () => ({ getContext: () => ({ fillText() {} }) }),
	});
	const backdrop = createBinaryBackdrop(new THREE.Scene(), false);
	const previousTarget = new THREE.WebGLRenderTarget();
	const renderer = {
		autoClear: false,
		getRenderTarget: () => previousTarget,
		setRenderTarget: vi.fn(),
		render: () => {
			throw new Error("context unavailable");
		},
	};
	expect(() =>
		backdrop.render(renderer as unknown as THREE.WebGLRenderer),
	).toThrow("context unavailable");
	expect(renderer.setRenderTarget).toHaveBeenLastCalledWith(previousTarget);
	expect(renderer.autoClear).toBe(false);
	backdrop.dispose();
	previousTarget.dispose();
});
