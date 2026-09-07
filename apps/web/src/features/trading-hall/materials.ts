import * as THREE from "three";

/** Preserve authored PBR values and keep baked diffuse light separate from reflections. */
export function enhanceHallMaterials(root: THREE.Object3D, anisotropy: number) {
	const handled = new Set<THREE.Material>();
	root.traverse((object) => {
		if (!(object instanceof THREE.Mesh)) return;
		object.castShadow = false;
		object.receiveShadow = false;
		const materials: THREE.Material[] = Array.isArray(object.material)
			? object.material
			: [object.material];
		for (const material of materials) {
			if (
				!(material instanceof THREE.MeshStandardMaterial) ||
				handled.has(material)
			)
				continue;
			handled.add(material);
			material.envMapIntensity = /Metal|Brass|Lettering/.test(material.name)
				? 0.65
				: /Wood/.test(material.name)
					? 0.22
					: 0.15;
			if (/Carpet/.test(material.name)) material.envMapIntensity = 0.025;
			for (const texture of [
				material.map,
				material.normalMap,
				material.roughnessMap,
			]) {
				if (texture) texture.anisotropy = anisotropy;
			}
			if (material.lightMap) {
				const original = material.onBeforeCompile;
				const key = material.customProgramCacheKey();
				material.onBeforeCompile = (shader, renderer) => {
					original.call(material, shader, renderer);
					shader.fragmentShader = shader.fragmentShader.replace(
						"#include <lights_fragment_maps>",
						"#include <lights_fragment_maps>\n#if defined(RE_IndirectDiffuse)\niblIrradiance=vec3(0.0);\n#endif",
					);
				};
				material.customProgramCacheKey = () => `${key}-cycles-diffuse-v4`;
			}
			if (/Glass/.test(material.name)) {
				if (material instanceof THREE.MeshPhysicalMaterial)
					material.transmission = 0;
				material.transparent = true;
				material.opacity = 0.17;
				material.depthWrite = false;
				material.side = THREE.DoubleSide;
				material.envMapIntensity = 0.4;
			}
		}
	});
}

/** Dynamic feeds inherit the exported display's physical color and emission values. */
export function createDisplayMaterial(
	map: THREE.Texture,
	source: THREE.MeshStandardMaterial,
) {
	const material = source.clone();
	material.map = map;
	material.emissiveMap = map;
	return material;
}
