import * as THREE from "three";
import { afterEach, expect, it, vi } from "vitest";
import { attachBakedLighting } from "./baked-lighting";

function model() {
	const root = new THREE.Group();
	for (const name of ["room", "stations"]) {
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute("uv1", new THREE.Float32BufferAttribute([0, 0], 2));
		const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
		mesh.userData = { bake_map: name, bake_intensity: Math.PI * 4 };
		root.add(mesh);
	}
	return root;
}

afterEach(() => vi.unstubAllGlobals());

it("attaches compact lighting with independent UVs and physical ranges", async () => {
	const fetchMock = vi.fn<typeof fetch>(async () => new Response(new Blob()));
	vi.stubGlobal("fetch", fetchMock);
	vi.stubGlobal(
		"createImageBitmap",
		vi.fn(async () => ({ close: vi.fn() })),
	);
	const root = model();
	expect(await attachBakedLighting(root, "/exchange", true)).toEqual({
		count: 2,
		resolution: 2048,
	});
	expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
		"/exchange/room-lightmap-2k.webp",
		"/exchange/stations-lightmap-2k.webp",
	]);
	for (const child of root.children) {
		const material = (child as THREE.Mesh)
			.material as THREE.MeshStandardMaterial;
		expect(material.lightMap?.channel).toBe(1);
		expect(material.lightMap?.colorSpace).toBe(THREE.SRGBColorSpace);
		expect(material.lightMap?.flipY).toBe(false);
		expect(material.lightMapIntensity).toBe(Math.PI * 4);
	}
});

it("closes decoded images when the other lighting request fails", async () => {
	vi.stubGlobal(
		"fetch",
		vi.fn(
			async (url: string) =>
				new Response(new Blob(), { status: url.includes("room") ? 200 : 404 }),
		),
	);
	const close = vi.fn();
	vi.stubGlobal(
		"createImageBitmap",
		vi.fn(async () => ({ close })),
	);
	await expect(
		attachBakedLighting(model(), "/exchange", false),
	).rejects.toThrow("stations lightmap unavailable");
	expect(close).toHaveBeenCalledOnce();
});

it("drains and closes both decodes when navigation aborts during decoding", async () => {
	const controller = new AbortController();
	vi.stubGlobal(
		"fetch",
		vi.fn(async () => new Response(new Blob())),
	);
	const close = vi.fn();
	vi.stubGlobal(
		"createImageBitmap",
		vi.fn(async () => {
			controller.abort();
			return { close };
		}),
	);
	const root = model();
	await expect(
		attachBakedLighting(root, "/exchange", false, controller.signal),
	).rejects.toMatchObject({ name: "AbortError" });
	expect(close).toHaveBeenCalledTimes(2);
	expect(
		((root.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial)
			.lightMap,
	).toBeNull();
});

it("rejects missing UVs and non-finite intensity before requesting assets", async () => {
	const fetchMock = vi.fn();
	vi.stubGlobal("fetch", fetchMock);
	const root = model();
	root.children[0].userData.bake_intensity = Number.POSITIVE_INFINITY;
	await expect(attachBakedLighting(root, "/exchange", false)).rejects.toThrow(
		"lighting range",
	);
	root.children[0].userData.bake_intensity = 4;
	(root.children[0] as THREE.Mesh).geometry.deleteAttribute("uv1");
	await expect(attachBakedLighting(root, "/exchange", false)).rejects.toThrow(
		"UVs are missing",
	);
	expect(fetchMock).not.toHaveBeenCalled();
});
