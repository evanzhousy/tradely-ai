import * as THREE from "three";

export const INSPECTION_TARGET = new THREE.Vector3(1.395, 2.18, 6.6);
export function storyProgress(top: number, height: number, viewport: number) {
	return THREE.MathUtils.clamp(
		(64 - top) / Math.max(1, height - viewport + 64),
		0,
		1,
	);
}
// Three held compositions connected by two forward moves. The last move is
// a small push toward the same terminal, without another turn through the hall.
const openingPosition = new THREE.Vector3(0, 1.7, 15.8);
const observePosition = new THREE.Vector3(0, 1.7, 10.8);
const closingPosition = new THREE.Vector3(0.35, 1.7, 8.85);
const openingTarget = new THREE.Vector3(0, 2.65, -3);
const target = new THREE.Vector3();
export function updateStoryCamera(
	camera: THREE.PerspectiveCamera,
	progress: number,
	pointer: THREE.Vector2,
) {
	const p = THREE.MathUtils.clamp(progress, 0, 1);
	const approach = THREE.MathUtils.smootherstep(p, 0.16, 0.42);
	const settle = THREE.MathUtils.smootherstep(p, 0.66, 0.86);
	camera.position
		.copy(openingPosition)
		.lerp(observePosition, approach)
		.lerp(closingPosition, settle);
	camera.position.x += pointer.x * 0.16;
	camera.position.y += pointer.y * 0.04;
	target.copy(openingTarget).lerp(INSPECTION_TARGET, approach);
	camera.lookAt(target);
}
