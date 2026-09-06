import * as THREE from "three";

export function enhanceHallMaterials(root: THREE.Object3D, anisotropy: number) {
	const handled = new Set<THREE.Material>();
	root.traverse((object) => {
		if (!(object instanceof THREE.Mesh)) return;
		object.castShadow = !/Markets|Flag|NYSE|Fixture|Glass/.test(object.name);
		object.receiveShadow = true;
		for (const material of Array.isArray(object.material)
			? object.material
			: [object.material]) {
			if (
				!(material instanceof THREE.MeshStandardMaterial) ||
				handled.has(material)
			)
				continue;
			handled.add(material);
			material.envMapIntensity = 0.7;
			if (/FasciaPBR/.test(material.name)) {
				material.envMapIntensity = 0.25;
				material.roughness = 1;
				material.onBeforeCompile = (shader) => {
					shader.fragmentShader = shader.fragmentShader.replace(
						"#include <roughnessmap_fragment>",
						"#include <roughnessmap_fragment>\nroughnessFactor=max(roughnessFactor,.5);",
					);
				};
				material.customProgramCacheKey = () => "exchange-satin-wood-v3";
			}
			if (material.name === "EX3_CharcoalCarpetPBR") {
				material.envMapIntensity = 0.04;
				material.roughness = 1;
				material.metalness = 0;
			}
			for (const texture of [
				material.map,
				material.roughnessMap,
				material.normalMap,
			]) {
				if (texture) texture.anisotropy = anisotropy;
			}
			if (
				/Glass/.test(material.name) &&
				material instanceof THREE.MeshPhysicalMaterial
			) {
				material.transmission = 0;
				material.color.setHex(0x10151c);
				material.metalness = 0.65;
				material.roughness = 0.12;
			}
			if (/Fixture/.test(material.name)) material.emissiveIntensity = 3;
			if (/Flag|NYSE/.test(material.name)) material.emissiveIntensity = 0.8;
		}
	});
}
/** A brief screen scan on entry/replay; ordinary updates remain steady. */
export function createDisplayMaterial(
	map: THREE.Texture,
	entrance: THREE.IUniform<number>,
) {
	const material = new THREE.MeshStandardMaterial({
		map,
		emissiveMap: map,
		emissive: 0xffffff,
		emissiveIntensity: 0.9,
		roughness: 0.38,
		metalness: 0,
		side: THREE.DoubleSide,
	});
	material.onBeforeCompile = (shader) => {
		shader.uniforms.uEntrance = entrance;
		shader.fragmentShader = shader.fragmentShader
			.replace(
				"#include <common>",
				"#include <common>\nuniform float uEntrance;",
			)
			.replace(
				"#include <emissivemap_fragment>",
				`#include <emissivemap_fragment>
float scan=exp(-abs(fract(vEmissiveMapUv.y*4.)-uEntrance)*55.);
totalEmissiveRadiance*=.92+.08*uEntrance;
totalEmissiveRadiance+=vec3(.045,.065,.07)*scan*(1.-step(.99,uEntrance));`,
			);
	};
	material.customProgramCacheKey = () => "exchange-night-display-v3";
	return material;
}
