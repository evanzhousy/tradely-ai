import * as THREE from "three";

export const INSPECTION_TARGET = new THREE.Vector3(1.64, 2.18, 6.6);
export function storyProgress(top: number, height: number, viewport: number) {
	return THREE.MathUtils.clamp(
		(64 - top) / Math.max(1, height - viewport + 64),
		0,
		1,
	);
}
// A walk through the shared Blender geometry, in glTF's Y-up coordinates.
// Eye height remains fixed; the path stays outside the trading posts.
const positions = new THREE.CatmullRomCurve3([
	new THREE.Vector3(0, 1.7, 15.8),
	new THREE.Vector3(0.1, 1.7, 12),
	new THREE.Vector3(0, 1.7, 9),
	new THREE.Vector3(0, 1.7, 3.8),
	new THREE.Vector3(2.7, 1.7, 2.9),
]);
const targets = new THREE.CatmullRomCurve3([
	new THREE.Vector3(0, 2.15, -3),
	new THREE.Vector3(1, 2, 5),
	INSPECTION_TARGET,
	new THREE.Vector3(0, 2.15, -3),
	new THREE.Vector3(4, 2.35, -11),
]);
const target = new THREE.Vector3();
export function updateStoryCamera(
	camera: THREE.PerspectiveCamera,
	progress: number,
	pointer: THREE.Vector2,
	entrance = 1,
) {
	const p = THREE.MathUtils.clamp(progress, 0, 1);
	positions.getPoint(p, camera.position);
	camera.position.x += pointer.x * 0.16;
	camera.position.y += pointer.y * 0.04;
	camera.position.z +=
		(1 - entrance) * 0.45 * (1 - THREE.MathUtils.smoothstep(p, 0, 0.2));
	targets.getPoint(p, target);
	camera.lookAt(target);
}
