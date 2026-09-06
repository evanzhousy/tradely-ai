import * as THREE from "three";
export function storyProgress(top: number, height: number, viewport: number) {
	return Math.max(
		0,
		Math.min(1, (64 - top) / Math.max(1, height - viewport + 64)),
	);
}
const positions = new THREE.CatmullRomCurve3([
	new THREE.Vector3(0.4, 2.65, 16),
	new THREE.Vector3(0.2, 2.35, 12),
	new THREE.Vector3(-1.25, 1.85, 10.3),
	new THREE.Vector3(0, 3.0, 3.5),
]);
const targets = new THREE.CatmullRomCurve3([
	new THREE.Vector3(0, 2.5, -6),
	new THREE.Vector3(-1.5, 1.8, 2),
	new THREE.Vector3(-4.2, 1.6, 8.6),
	new THREE.Vector3(0, 4.0, -14.8),
]);
export function updateStoryCamera(
	camera: THREE.PerspectiveCamera,
	progress: number,
	pointer: THREE.Vector2,
) {
	positions.getPoint(progress, camera.position);
	camera.position.x += pointer.x * 0.18;
	camera.position.y += pointer.y * 0.07;
	const target = targets.getPoint(progress);
	camera.lookAt(target);
}
