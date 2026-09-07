export const WALK_SPEED = 2.1;
// Conservative footprints in glTF coordinates (Z points toward the driveway).
const walls = [
	[-3.5, 3.5, -6.3, 0.35],
	[-4.8, 3.5, -10.6, -1.4],
	[-10.3, -4.3, -10.3, 0.3],
] as const;
const largeObjects = [
	[-5.35, -4.3, -5.8, -4.6],
	[-4.9, -3.8, -1.0, 0.1],
	[3.45, 4.1, -1.1, 8.0],
	[-9.7, -8.0, -5.4, -4.0],
] as const;
export function canWalk(x: number, z: number) {
	return (
		x >= -11.4 &&
		x <= 7.4 &&
		z >= -13.2 &&
		z <= 8.1 &&
		!walls.some(
			([left, right, back, front]) =>
				x > left && x < right && z > back && z < front,
		) &&
		!largeObjects.some(
			([left, right, back, front]) =>
				x > left && x < right && z > back && z < front,
		)
	);
}
export function walkStep(x: number, z: number, dx: number, dz: number) {
	const nextX = canWalk(x + dx, z) ? x + dx : x;
	return { x: nextX, z: canWalk(nextX, z + dz) ? z + dz : z };
}
