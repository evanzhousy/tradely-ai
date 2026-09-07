import * as THREE from "three";

type MapName = "room" | "stations";
type BakedMesh = THREE.Mesh<
	THREE.BufferGeometry,
	THREE.Material | THREE.Material[]
>;

/** The model owns these textures after attachment; normal model disposal releases them. */
export async function attachBakedLighting(
	root: THREE.Object3D,
	assetPath: string,
	compact: boolean,
	signal?: AbortSignal,
) {
	const meshes: BakedMesh[] = [];
	const names = new Set<MapName>();
	root.traverse((object) => {
		if (!(object instanceof THREE.Mesh) || !object.userData.bake_map) return;
		const name = object.userData.bake_map;
		if (name !== "room" && name !== "stations")
			throw new Error("Unknown exchange lightmap");
		if (!object.geometry.getAttribute("uv1"))
			throw new Error("Exchange lightmap UVs are missing");
		const intensity = Number(object.userData.bake_intensity);
		if (!Number.isFinite(intensity) || intensity <= 0)
			throw new Error("Invalid exchange lighting range");
		names.add(name);
		meshes.push(object);
	});
	if (names.size !== 2) throw new Error("Exchange lighting is incomplete");
	const loaded = await Promise.allSettled(
		[...names].map(async (name) => {
			const response = await fetch(
				`${assetPath}/${name}-lightmap${compact ? "-2k" : ""}.webp`,
				{ signal },
			);
			if (!response.ok)
				throw new Error(`Exchange ${name} lightmap unavailable`);
			const bitmap = await createImageBitmap(await response.blob(), {
				colorSpaceConversion: "none",
			});
			const texture = new THREE.Texture(bitmap);
			texture.name = `Cycles ${name} lighting`;
			texture.colorSpace = THREE.SRGBColorSpace;
			texture.flipY = false;
			texture.channel = 1;
			texture.anisotropy = compact ? 2 : 4;
			texture.needsUpdate = true;
			return { name, texture };
		}),
	);
	const failed = loaded.find((result) => result.status === "rejected");
	if (failed || signal?.aborted) {
		for (const result of loaded) {
			if (result.status === "fulfilled") {
				result.value.texture.dispose();
				(result.value.texture.image as ImageBitmap).close();
			}
		}
		throw failed?.reason ?? new DOMException("Aborted", "AbortError");
	}
	const maps = new Map<MapName, THREE.Texture>();
	for (const result of loaded)
		if (result.status === "fulfilled")
			maps.set(result.value.name, result.value.texture);
	for (const mesh of meshes) {
		const texture = maps.get(mesh.userData.bake_map as MapName);
		for (const material of Array.isArray(mesh.material)
			? mesh.material
			: [mesh.material]) {
			if (!(material instanceof THREE.MeshStandardMaterial)) continue;
			material.lightMap = texture ?? null;
			material.lightMapIntensity = Number(mesh.userData.bake_intensity);
			material.needsUpdate = true;
		}
	}
	return { count: maps.size, resolution: compact ? 2048 : 4096 };
}
