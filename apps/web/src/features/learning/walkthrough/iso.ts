/*
 * Isometric geometry for the films: a camera, extruded solids shaded by the way each face
 * turns, and the helpers that put marks on their tops. The drawing is SVG path data only;
 * `iso-art.tsx` paints it in the stage's tones, and a film moves its parts on its timeline.
 *
 * Adapted from Anatomy's `kit/iso-kit.ts` (https://github.com/wheresryan22/anatomy, commit
 * e9488296), cut to the geometry and set in this repository's style.
 *
 * MIT License
 *
 * Copyright (c) 2026 Ryan
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/** A point on the screen. */
export type Flat = [number, number];
/** A point in the world: x and y on the floor, z up. */
export type Point3 = [number, number, number];
/** A point on the floor. */
export type Plane = [number, number];

export interface Projection {
	origin: Flat;
	scale: number;
	azimuth?: number;
	elevation?: number;
}

/** A rounded rectangle on the floor. */
export interface Plan {
	x: number;
	y: number;
	w: number;
	d: number;
	r: number;
}

/**
 * A solid's paths: its silhouette, the faces turned to the viewer in four shades, its top,
 * the edges round it and the creases where its top meets the faces in front.
 */
export interface SolidPaths {
	fill: string;
	outline: string;
	crease: string;
	top: string;
	shades: string[];
	bevel?: string;
}

export const AZIMUTH = 45;
export const ELEVATION = 30;
export const SHADES = 4;

const RADIANS = Math.PI / 180;
const UNIT = Math.sqrt(1.6);

function cameraOf({
	scale,
	azimuth = AZIMUTH,
	elevation = ELEVATION,
}: Projection) {
	const a = azimuth * RADIANS;
	const e = elevation * RADIANS;
	return {
		sinA: Math.sin(a),
		cosA: Math.cos(a),
		sinE: Math.sin(e),
		cosE: Math.cos(e),
		k: scale * UNIT,
	};
}

export function iso([x, y, z]: Point3, projection: Projection): Flat {
	const { origin } = projection;
	const { sinA, cosA, sinE, cosE, k } = cameraOf(projection);
	return [
		origin[0] + (x * sinA - y * cosA) * k,
		origin[1] + ((x * cosA + y * sinA) * sinE - z * cosE) * k,
	];
}

/** The floor direction that points at the viewer. */
export function towardViewer(projection: Projection): Plane {
	const { sinA, cosA } = cameraOf(projection);
	return [cosA, sinA];
}

const tenth = (value: number) => {
	const text = (Math.round(value * 10) / 10).toFixed(1).replace(/\.0$/, "");
	return text === "-0" ? "0" : text;
};

export function pathOf(points: Flat[], closed = false) {
	if (!points.length) return "";
	return (
		points
			.map(([x, y], at) => `${at ? "L" : "M"}${tenth(x)} ${tenth(y)}`)
			.join("") + (closed ? "Z" : "")
	);
}

export function roundedPlan({ x, y, w, d, r }: Plan, steps = 8): Plane[] {
	const radius = Math.max(0, Math.min(r, w / 2, d / 2));
	const corners: [number, number, number][] = [
		[x + w - radius, y + radius, -90],
		[x + w - radius, y + d - radius, 0],
		[x + radius, y + d - radius, 90],
		[x + radius, y + radius, 180],
	];
	const out: Plane[] = [];
	for (const [cx, cy, start] of corners) {
		const count = radius > 0 ? steps : 0;
		for (let step = 0; step <= count; step++) {
			const angle = (start + (count ? (90 * step) / count : 45)) * RADIANS;
			out.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
		}
	}
	return out;
}

const at = <T>(list: T[], index: number) =>
	list[((index % list.length) + list.length) % list.length] as T;

function signedArea(points: Plane[] | Flat[]) {
	let area = 0;
	for (let index = 0; index < points.length; index++) {
		const [ax, ay] = at(points, index);
		const [bx, by] = at(points, index + 1);
		area += ax * by - bx * ay;
	}
	return area / 2;
}

const oriented = (points: Flat[]) =>
	signedArea(points) < 0 ? [...points].reverse() : points;

function convexHull(points: Flat[]): Flat[] {
	const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
	if (sorted.length < 3) return sorted;
	const cross = (o: Flat, a: Flat, b: Flat) =>
		(a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
	const half = (list: Flat[]) => {
		const out: Flat[] = [];
		for (const point of list) {
			while (out.length >= 2 && cross(at(out, -2), at(out, -1), point) <= 0)
				out.pop();
			out.push(point);
		}
		return out;
	};
	const lower = half(sorted);
	const upper = half([...sorted].reverse());
	return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** The runs of consecutive edges whose flag is `want`, as lists of vertex indices. */
function runsOf(flags: boolean[], want: boolean) {
	const count = flags.length;
	const start = flags.findIndex((flag, index) => flag !== at(flags, index - 1));
	if (start < 0)
		return flags[0] === want
			? [Array.from({ length: count + 1 }, (_, index) => index % count)]
			: [];
	const runs: number[][] = [];
	let run: number[] | null = null;
	for (let step = 0; step < count; step++) {
		const index = (start + step) % count;
		if (flags[index] === want) {
			if (!run) run = [index];
			run.push((index + 1) % count);
		} else if (run) {
			runs.push(run);
			run = null;
		}
	}
	if (run) runs.push(run);
	return runs;
}

/** A floor outline raised from `z` by `height`: a convex solid with its shaded faces. */
export function extrude(
	ring: Plane[],
	z: number,
	height: number,
	projection: Projection,
	bevel = 0,
): SolidPaths {
	const count = ring.length;
	const counter = signedArea(ring) > 0;
	const [vx, vy] = towardViewer(projection);
	const { sinA, cosA } = cameraOf(projection);
	const normals = ring.map(([ax, ay], index): Plane => {
		const [bx, by] = at(ring, index + 1);
		const dx = bx - ax;
		const dy = by - ay;
		const length = Math.hypot(dx, dy) || 1;
		return counter ? [dy / length, -dx / length] : [-dy / length, dx / length];
	});
	const facing = normals.map(([nx, ny]) => nx * vx + ny * vy > 1e-9);
	const top = ring.map(([x, y]) => iso([x, y, z + height], projection));
	const bottom = ring.map(([x, y]) => iso([x, y, z], projection));
	const outline: string[] = [];
	const crease: string[] = [];
	for (const run of runsOf(facing, false))
		outline.push(pathOf(run.map((index) => at(top, index))));
	for (const run of runsOf(facing, true)) {
		crease.push(pathOf(run.map((index) => at(top, index))));
		if (height > 0) outline.push(pathOf(run.map((index) => at(bottom, index))));
	}
	if (height > 0)
		for (let index = 0; index < count; index++)
			if (at(facing, index - 1) !== at(facing, index))
				outline.push(pathOf([at(top, index), at(bottom, index)]));
	// Faces lit from the back left: the light turns with the camera, as the reader's does.
	const buckets: string[][] = Array.from({ length: SHADES }, () => []);
	if (height > 0) {
		const [lx, ly] = [-sinA, cosA];
		for (let index = 0; index < count; index++) {
			if (!at(facing, index)) continue;
			const [nx, ny] = at(normals, index);
			const lit = (nx * lx + ny * ly + 1) / 2;
			const shade = Math.min(SHADES - 1, Math.max(0, Math.floor(lit * SHADES)));
			at(buckets, shade).push(
				pathOf(
					oriented([
						at(top, index),
						at(top, index + 1),
						at(bottom, index + 1),
						at(bottom, index),
					]),
					true,
				),
			);
		}
	}
	let bevelPath: string | undefined;
	if (bevel > 0) {
		const inset = ring.map(([x, y], index): Plane => {
			const [ax, ay] = at(normals, index - 1);
			const [bx, by] = at(normals, index);
			const mx = ax + bx;
			const my = ay + by;
			const length = Math.hypot(mx, my) || 1;
			return [x - (mx / length) * bevel, y - (my / length) * bevel];
		});
		const insetTop = inset.map(([x, y]) => iso([x, y, z + height], projection));
		bevelPath = runsOf(facing, true)
			.map((run) =>
				pathOf([
					at(top, run[0] ?? 0),
					...run.slice(1, -1).map((index) => at(insetTop, index)),
					at(top, run[run.length - 1] ?? 0),
				]),
			)
			.join("");
	}
	return {
		fill: pathOf(convexHull([...top, ...bottom]), true),
		outline: outline.join(""),
		crease: crease.join(""),
		top: pathOf(oriented(top), true),
		shades: buckets.map((paths) => paths.join("")),
		bevel: bevelPath,
	};
}

export const ringOf = (plan: Plan, steps = 8): Plane[] =>
	roundedPlan(plan, steps);

export const slabOf = (
	plan: Plan,
	z: number,
	height: number,
	projection: Projection,
	bevel = 0,
) => extrude(ringOf(plan), z, height, projection, bevel);

export function circleRing(
	cx: number,
	cy: number,
	radius: number,
	steps = 32,
): Plane[] {
	return Array.from({ length: steps }, (_, step) => {
		const angle = (step / steps) * Math.PI * 2;
		return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
	});
}

export const cylinder = (
	cx: number,
	cy: number,
	radius: number,
	z: number,
	height: number,
	projection: Projection,
) => extrude(circleRing(cx, cy, radius), z, height, projection);

export const insetPlan = ({ x, y, w, d, r }: Plan, by: number): Plan => ({
	x: x + by,
	y: y + by,
	w: w - by * 2,
	d: d - by * 2,
	r: Math.max(0, r - by),
});

/** A line or outline lying on a top at height `z`. */
export const onTop = (
	points: Plane[],
	z: number,
	projection: Projection,
	closed = false,
) =>
	pathOf(
		points.map(([x, y]) => iso([x, y, z], projection)),
		closed,
	);

export const planOutline = (plan: Plan, z: number, projection: Projection) =>
	onTop(ringOf(plan), z, projection, true);

/** A band round a solid's visible faces at height `z`: a seam, a strap, a paper band. */
export function sideSeam(plan: Plan, z: number, projection: Projection) {
	const ring = ringOf(plan);
	const counter = signedArea(ring) > 0;
	const [vx, vy] = towardViewer(projection);
	const facing = ring.map(([ax, ay], index) => {
		const [bx, by] = at(ring, index + 1);
		const [nx, ny] = counter ? [by - ay, -(bx - ax)] : [-(by - ay), bx - ax];
		return nx * vx + ny * vy > 1e-9;
	});
	return runsOf(facing, true)
		.map((run) =>
			pathOf(
				run.map((index) => {
					const [x, y] = at(ring, index);
					return iso([x, y, z], projection);
				}),
			),
		)
		.join("");
}

/** Ruler ticks along a top edge: every `step`, a longer one every `every`th. */
export function topTicks(
	from: number,
	to: number,
	step: number,
	every: number,
	edge: number,
	z: number,
	[short, long]: [number, number],
	projection: Projection,
) {
	const minor: string[] = [];
	const major: string[] = [];
	const first = Math.ceil(from / step) * step;
	for (
		let x = first, index = Math.round(first / step);
		x <= to + 1e-9;
		x += step, index++
	) {
		const big = index % every === 0;
		(big ? major : minor).push(
			onTop(
				[
					[x, edge],
					[x, edge + (big ? long : short)],
				],
				z,
				projection,
			),
		);
	}
	return { minor: minor.join(""), major: major.join("") };
}

/** How far a move through the world shifts a part on the screen. */
export function axisVector(projection: Projection, by: Point3): Flat {
	const [ox, oy] = iso([0, 0, 0], projection);
	const [mx, my] = iso(by, projection);
	return [mx - ox, my - oy];
}

/** The projection that fits `points` inside a box `width` by `height`, centred. */
export function fitProjection(
	points: Point3[],
	width: number,
	height: number,
	{
		pad = 0,
		azimuth = AZIMUTH,
		elevation = ELEVATION,
	}: { pad?: number; azimuth?: number; elevation?: number } = {},
): Projection {
	const unit: Projection = { origin: [0, 0], scale: 1, azimuth, elevation };
	const flat = points.map((point) => iso(point, unit));
	const xs = flat.map(([x]) => x);
	const ys = flat.map(([, y]) => y);
	const left = Math.min(...xs);
	const right = Math.max(...xs);
	const up = Math.min(...ys);
	const down = Math.max(...ys);
	const scale = Math.min(
		(width - pad * 2) / (right - left),
		(height - pad * 2) / (down - up),
	);
	return {
		origin: [
			width / 2 - ((left + right) / 2) * scale,
			height / 2 - ((up + down) / 2) * scale,
		],
		scale,
		azimuth,
		elevation,
	};
}
