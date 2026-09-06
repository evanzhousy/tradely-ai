export type Area = "exterior" | "ground" | "upper";
export type Rect = readonly [number, number, number, number];
export interface Portal {
	id: string;
	x: number;
	z: number;
	destination: Area;
	label: string;
	spawn: readonly [number, number];
}
export const AREA_LABELS: Record<Area, string> = {
	exterior: "庭院 · Courtyard",
	ground: "一层 · Living spaces",
	upper: "楼上 · Bedrooms",
};
export const PORTALS: Record<Area, readonly Portal[]> = {
	exterior: [
		{
			id: "front-door",
			x: -4,
			z: -0.6,
			destination: "ground",
			label: "进入房屋 · Enter house",
			spawn: [0, 3.7],
		},
	],
	ground: [
		{
			id: "exit",
			x: 0,
			z: 4.7,
			destination: "exterior",
			label: "返回庭院 · Return outside",
			spawn: [-4, 0.7],
		},
		{
			id: "stairs-up",
			x: -2.4,
			z: 3.8,
			destination: "upper",
			label: "上楼 · Upstairs",
			spawn: [0, 3.2],
		},
	],
	upper: [
		{
			id: "stairs-down",
			x: 0,
			z: 4.5,
			destination: "ground",
			label: "下楼 · Downstairs",
			spawn: [-1.4, 3.8],
		},
	],
};
export function nearbyPortal(
	area: Area,
	x: number,
	z: number,
): Portal | undefined {
	return PORTALS[area].find((p) => Math.hypot(p.x - x, p.z - z) < 0.85);
}
export function interiorStep(
	x: number,
	z: number,
	dx: number,
	dz: number,
	colliders: readonly Rect[],
) {
	const clear = (px: number, pz: number) =>
		px > -4.7 &&
		px < 4.7 &&
		pz > -4.7 &&
		pz < 4.9 &&
		!colliders.some(([l, r, b, f]) => px > l && px < r && pz > b && pz < f);
	const nx = clear(x + dx, z) ? x + dx : x;
	return { x: nx, z: clear(nx, z + dz) ? z + dz : z };
}
export interface NavigationState {
	area: Area;
	phase: "idle" | "out" | "loading" | "in";
	portal: string | null;
	error: string | null;
}
