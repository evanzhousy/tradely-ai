import * as THREE from "three";

/** Hand-built stylized likeness: pink dress, gray leggings, dark hair and floral band. */
export function createChildAvatar() {
	const root = new THREE.Group();
	root.name = "Child avatar";
	const skin = new THREE.MeshStandardMaterial({
		color: 0xd9a481,
		roughness: 0.72,
	});
	const pink = new THREE.MeshStandardMaterial({
		color: 0xc36886,
		roughness: 0.9,
	});
	const hair = new THREE.MeshStandardMaterial({
		color: 0x211b19,
		roughness: 0.68,
	});
	const gray = new THREE.MeshStandardMaterial({
		color: 0x646570,
		roughness: 0.95,
	});
	const cream = new THREE.MeshStandardMaterial({
		color: 0xffebc9,
		roughness: 0.8,
	});
	const eyes = new THREE.MeshStandardMaterial({
		color: 0x241713,
		roughness: 0.35,
	});
	const blush = new THREE.MeshStandardMaterial({
		color: 0xd58480,
		roughness: 0.9,
	});
	function sphere(
		parent: THREE.Object3D,
		material: THREE.Material,
		position: number[],
		scale: number[],
	) {
		const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), material);
		mesh.position.fromArray(position);
		mesh.scale.fromArray(scale);
		parent.add(mesh);
		return mesh;
	}
	const body = new THREE.Group();
	root.add(body);
	sphere(body, pink, [0, 0.72, 0], [0.24, 0.27, 0.16]);
	const skirt = new THREE.Mesh(
		new THREE.CylinderGeometry(0.2, 0.32, 0.34, 32),
		pink,
	);
	skirt.position.y = 0.54;
	body.add(skirt);
	// Small scalloped hem and embroidered dots.
	for (let i = 0; i < 16; i++) {
		const a = (i * Math.PI) / 8;
		sphere(
			body,
			pink,
			[Math.sin(a) * 0.285, 0.38, Math.cos(a) * 0.285],
			[0.055, 0.045, 0.045],
		);
	}
	for (let i = 0; i < 9; i++)
		sphere(
			body,
			cream,
			[((i % 3) - 1) * 0.085, 0.66 + Math.floor(i / 3) * 0.075, 0.153],
			[0.009, 0.009, 0.005],
		);
	sphere(body, skin, [0, 1.12, 0.015], [0.225, 0.26, 0.21]);
	sphere(body, hair, [0, 1.24, -0.04], [0.24, 0.2, 0.21]);
	sphere(body, hair, [0, 1.01, -0.15], [0.23, 0.31, 0.1]);
	for (const side of [-1, 1]) {
		sphere(body, hair, [side * 0.205, 1.03, -0.015], [0.065, 0.28, 0.14]);
		sphere(body, skin, [side * 0.224, 1.1, 0.01], [0.042, 0.064, 0.045]);
		sphere(body, cream, [side * 0.08, 1.145, 0.202], [0.041, 0.027, 0.012]);
		sphere(body, eyes, [side * 0.08, 1.145, 0.215], [0.021, 0.023, 0.008]);
		sphere(body, cream, [side * 0.074, 1.154, 0.222], [0.006, 0.007, 0.003]);
		sphere(body, blush, [side * 0.131, 1.055, 0.177], [0.038, 0.018, 0.008]);
		sphere(body, hair, [side * 0.08, 1.193, 0.195], [0.043, 0.008, 0.01]);
	}
	sphere(body, skin, [0, 1.083, 0.223], [0.025, 0.026, 0.028]);
	sphere(body, blush, [0, 1.014, 0.197], [0.045, 0.012, 0.01]);
	const band = new THREE.Mesh(
		new THREE.TorusGeometry(0.237, 0.026, 8, 40, Math.PI),
		cream,
	);
	band.position.set(0, 1.2, 0.015);
	body.add(band);
	for (let i = 0; i < 5; i++) {
		const a = 0.2 + i * 0.66;
		const x = Math.cos(a) * 0.238;
		const y = 1.2 + Math.sin(a) * 0.238;
		for (let j = 0; j < 5; j++)
			sphere(
				body,
				pink,
				[
					x + Math.cos(j * 1.257) * 0.021,
					y + Math.sin(j * 1.257) * 0.021,
					0.038,
				],
				[0.014, 0.014, 0.012],
			);
		sphere(body, cream, [x, y, 0.047], [0.009, 0.009, 0.01]);
	}
	const legs: THREE.Group[] = [];
	const arms: THREE.Group[] = [];
	for (const side of [-1, 1]) {
		const leg = new THREE.Group();
		leg.position.set(side * 0.125, 0.42, 0);
		root.add(leg);
		legs.push(leg);
		sphere(leg, gray, [0, -0.17, 0], [0.073, 0.21, 0.08]);
		sphere(leg, pink, [0, -0.35, 0.05], [0.089, 0.065, 0.135]);
		const arm = new THREE.Group();
		arm.position.set(side * 0.25, 0.87, 0);
		body.add(arm);
		arms.push(arm);
		sphere(arm, pink, [side * 0.025, -0.12, 0], [0.082, 0.17, 0.084]);
		sphere(arm, skin, [side * 0.028, -0.28, 0.012], [0.055, 0.069, 0.052]);
	}
	// Small cream bunny bag, echoing the toy in the reference.
	sphere(body, cream, [0.2, 0.56, 0.2], [0.075, 0.095, 0.045]);
	sphere(body, cream, [0.17, 0.675, 0.2], [0.022, 0.07, 0.021]);
	sphere(body, cream, [0.225, 0.675, 0.2], [0.022, 0.07, 0.021]);
	root.traverse((o) => {
		if (o instanceof THREE.Mesh) {
			o.castShadow = true;
			o.receiveShadow = true;
		}
	});
	root.position.set(0, 0.14, 5);
	return {
		root,
		animate(phase: number, moving: boolean, reducedMotion: boolean) {
			const stride = moving && !reducedMotion ? Math.sin(phase) * 0.5 : 0;
			legs[0].rotation.x = stride;
			legs[1].rotation.x = -stride;
			arms[0].rotation.x = -stride * 0.6;
			arms[1].rotation.x = stride * 0.6;
			body.position.y =
				moving && !reducedMotion ? Math.abs(Math.sin(phase)) * 0.025 : 0;
		},
	};
}
