import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { interiorStep, nearbyPortal, PORTALS, type Rect } from "./interior";

const buffer = readFileSync(
	new URL(
		"../../../public/models/kirkland-house/interior.glb",
		import.meta.url,
	),
);
const gltf = JSON.parse(
	buffer.toString("utf8", 20, 20 + buffer.readUInt32LE(12)),
);
type Node = {
	name?: string;
	children?: number[];
	extras?: { colliders?: Rect[]; collider?: Rect };
};
function obstacles(name: string): Rect[] {
	const nodes: Node[] = gltf.nodes;
	const root = nodes.findIndex((n) => n.name === name);
	expect(root).toBeGreaterThanOrEqual(0);
	const result: Rect[] = [];
	const visit = (i: number) => {
		const n = nodes[i];
		if (n.extras?.collider) result.push(n.extras.collider);
		if (n.extras?.colliders) result.push(...n.extras.colliders);
		n.children?.forEach(visit);
	};
	visit(root);
	return result;
}
function reachable(
	colliders: Rect[],
	start: [number, number],
	targets: [number, number][],
) {
	const queue = [start];
	const seen = new Set([start.join(",")]);
	for (let i = 0; i < queue.length; i++) {
		const [x, z] = queue[i];
		for (const [dx, dz] of [
			[0.25, 0],
			[-0.25, 0],
			[0, 0.25],
			[0, -0.25],
		]) {
			const next = interiorStep(x, z, dx, dz, colliders);
			const key = `${next.x},${next.z}`;
			if (!seen.has(key)) {
				seen.add(key);
				queue.push([next.x, next.z]);
			}
		}
	}
	for (const [x, z] of targets)
		expect(
			queue.some(([px, pz]) => Math.hypot(px - x, pz - z) < 0.4),
			`reachable ${x},${z}`,
		).toBe(true);
}
describe("interior level navigation", () => {
	it("keeps spawn locations outside portal activation zones", () => {
		for (const portals of Object.values(PORTALS))
			for (const p of portals)
				expect(nearbyPortal(p.destination, ...p.spawn)).toBeUndefined();
	});
	it("provides connected paths through living, dining, kitchen, powder room and stairs", () => {
		reachable(
			obstacles("GroundFloor"),
			[0, 3.75],
			[
				[-2, 0.75],
				[1, 0.25],
				[1, -3.5],
				[2, 3.5],
				[-2.25, 3.75],
				[0, 4.5],
			],
		);
	});
	it("provides connected upstairs paths to both bedrooms, bathrooms and the stair exit", () => {
		reachable(
			obstacles("UpperFloor"),
			[0, 3.25],
			[
				[-1.5, 2],
				[1.5, 2],
				[-1.4, -3.9],
				[1.4, -3.9],
				[0, 4.5],
			],
		);
	});
	it("does not allow walking through walls or outside the interior bounds", () => {
		expect(interiorStep(0, 0, 0, 1, [[-1, 1, 0.5, 1.5]])).toEqual({
			x: 0,
			z: 0,
		});
		expect(interiorStep(4.5, 0, 0.3, 0, [])).toEqual({ x: 4.5, z: 0 });
	});
});
