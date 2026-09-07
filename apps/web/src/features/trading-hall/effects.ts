import * as THREE from "three";

/** Restrained dust caught by practical lights; the night room stays clear. */
export function createHallEffects(scene: THREE.Scene, compact: boolean) {
	const count = compact ? 90 : 260;
	const seed = new Float32Array(count * 3);
	for (let i = 0; i < seed.length; i++) {
		const n = Math.sin(i * 127.1 + 38.2) * 43758.5453;
		seed[i] = n - Math.floor(n);
	}
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute(
		"position",
		new THREE.BufferAttribute(new Float32Array(count * 3), 3),
	);
	geometry.setAttribute("seed", new THREE.BufferAttribute(seed, 3));
	const material = new THREE.ShaderMaterial({
		transparent: true,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
		uniforms: { time: { value: 0 }, amount: { value: 1 } },
		vertexShader: `attribute vec3 seed;uniform float time;varying float glow;
void main(){vec3 p=vec3(-10.+seed.x*20.,1.2+seed.y*6.8,-16.+seed.z*32.);p.x+=sin(time*.09+seed.z*30.)*.16;p.y+=sin(time*.12+seed.x*16.)*.1;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(17./max(3.,-mv.z),.7,2.4);glow=.035+seed.y*.07;}`,
		fragmentShader:
			"uniform float amount;varying float glow;void main(){float a=1.-smoothstep(.03,.5,length(gl_PointCoord-.5));gl_FragColor=vec4(.91,.87,.77,a*glow*amount);}",
	});
	const dust = new THREE.Points(geometry, material);
	dust.frustumCulled = false;
	scene.add(dust);
	return {
		update(time: number, digital = 0) {
			material.uniforms.time.value = time;
			material.uniforms.amount.value = 1 - digital;
		},
		dispose() {
			geometry.dispose();
			material.dispose();
			dust.removeFromParent();
		},
	};
}
