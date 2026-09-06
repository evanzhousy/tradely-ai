import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";

/** Practical night lighting, grouped into a bounded set of real-time sources. */
export function createNightLighting(scene: THREE.Scene, compact: boolean) {
	RectAreaLightUniformsLib.init();
	const rig = new THREE.Group();
	rig.name = "Exchange night practical lights";
	scene.add(rig);
	rig.add(new THREE.HemisphereLight(0xc6c9cf, 0x171b20, 0.14));
	for (const x of [-8, 0, 8]) {
		for (const z of compact ? [10, -8] : [12, 2, -10]) {
			const light = new THREE.RectAreaLight(0xffe8cc, 28, 5.8, 0.7);
			light.position.set(x, 8.78, z);
			light.lookAt(x, 0, z);
			rig.add(light);
		}
	}
	const shadowLights: THREE.SpotLight[] = [];
	for (const x of compact ? [0] : [-6, 6]) {
		const light = new THREE.SpotLight(0xffedda, 230, 40, 1.05, 0.65, 2);
		light.position.set(x, 8.77, 5);
		light.target.position.set(x * 0.65, 0, 5);
		light.castShadow = true;
		light.shadow.mapSize.setScalar(compact ? 1024 : 2048);
		light.shadow.bias = -0.00015;
		light.shadow.normalBias = 0.025;
		rig.add(light, light.target);
		shadowLights.push(light);
	}
	for (const [x, z] of [
		[-6.2, 6.2],
		[5.8, 6.6],
		[0, -3],
	]) {
		const light = new THREE.PointLight(0x9ac6df, 5, 5, 2);
		light.position.set(x, 2.3, z);
		rig.add(light);
	}
	return {
		dispose() {
			for (const light of shadowLights) light.shadow.dispose();
			rig.removeFromParent();
		},
	};
}
