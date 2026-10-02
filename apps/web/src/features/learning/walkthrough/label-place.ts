import { textWidth } from "./text-measure";

export type Box = { x0: number; y0: number; x1: number; y1: number };
export type Point = readonly [number, number];

/** A text's box from its anchor point and baseline, padded so a halo clears neighbours. */
export function textBox(
	text: string,
	x: number,
	baseline: number,
	size: number,
	anchor: "start" | "middle" | "end",
): Box {
	const width = textWidth(text, size);
	const x0 =
		anchor === "start" ? x : anchor === "middle" ? x - width / 2 : x - width;
	return {
		x0: x0 - 2,
		x1: x0 + width + 2,
		y0: baseline - size * 0.8 - 2,
		y1: baseline + size * 0.25 + 2,
	};
}

/**
 * Centres a label on `x` unless that runs it past `from` or `to`; then it aligns to that
 * edge instead, so an axis's end labels stay on the stage.
 */
export function fitAnchor(
	text: string,
	x: number,
	size: number,
	from: number,
	to: number,
): { x: number; anchor: "start" | "middle" | "end" } {
	const half = textWidth(text, size) / 2;
	if (x + half > to) return { x: to, anchor: "end" };
	if (x - half < from) return { x: from, anchor: "start" };
	return { x, anchor: "middle" };
}

export const overlaps = (a: Box, b: Box) =>
	a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/** Liang–Barsky: whether the segment from a to b passes through the box. */
function segmentHits([ax, ay]: Point, [bx, by]: Point, box: Box) {
	let t0 = 0;
	let t1 = 1;
	const dx = bx - ax;
	const dy = by - ay;
	const edges: [number, number][] = [
		[-dx, ax - box.x0],
		[dx, box.x1 - ax],
		[-dy, ay - box.y0],
		[dy, box.y1 - ay],
	];
	for (const [p, q] of edges) {
		if (p === 0) {
			if (q < 0) return false;
		} else {
			const t = q / p;
			if (p < 0) t0 = Math.max(t0, t);
			else t1 = Math.min(t1, t);
			if (t0 > t1) return false;
		}
	}
	return true;
}

function lineHits(line: readonly Point[], box: Box) {
	for (let i = 1; i < line.length; i++)
		if (segmentHits(line[i - 1], line[i], box)) return true;
	return false;
}

/** Height of a polyline at x, or null outside it. */
export function lineYAt(line: readonly Point[], x: number) {
	for (let i = 1; i < line.length; i++) {
		const [ax, ay] = line[i - 1];
		const [bx, by] = line[i];
		if ((x >= ax && x <= bx) || (x >= bx && x <= ax))
			return bx === ax ? ay : ay + ((x - ax) / (bx - ax)) * (by - ay);
	}
	return null;
}

/** Highest and lowest points of a polyline between two x positions, or null if it misses them. */
export function lineSpanY(line: readonly Point[], x0: number, x1: number) {
	const ys = [
		lineYAt(line, x0),
		lineYAt(line, x1),
		...line.filter(([x]) => x >= x0 && x <= x1).map(([, y]) => y),
	].filter((y): y is number => y !== null);
	return ys.length ? { min: Math.min(...ys), max: Math.max(...ys) } : null;
}

/** Vertical distance from a box to a polyline across the box's width; Infinity if it misses. */
function gapTo(line: readonly Point[], box: Box) {
	const span = lineSpanY(line, box.x0, box.x1);
	if (!span) return Number.POSITIVE_INFINITY;
	return Math.max(0, span.min - box.y1, box.y0 - span.max);
}

type PlaceContext = {
	lines: readonly (readonly Point[])[];
	taken: Box[];
	bounds: Box;
	/** The line this label names, if any. */
	own?: readonly Point[];
};

/**
 * The first candidate that stays inside `bounds` and clears every line and every box
 * already taken, with its cost; with no clear spot, the cheapest. With `own`, a spot
 * nearer another line than its own counts against it: it would label the wrong line.
 */
export function bestSpot<C extends { box: Box }>(
	candidates: readonly C[],
	{ lines, taken, bounds, own }: PlaceContext,
): { spot: C; cost: number } {
	let spot = candidates[0];
	let best = Number.POSITIVE_INFINITY;
	for (const candidate of candidates) {
		const { box } = candidate;
		const outside =
			box.x0 < bounds.x0 ||
			box.x1 > bounds.x1 ||
			box.y0 < bounds.y0 ||
			box.y1 > bounds.y1;
		const misleading =
			own !== undefined &&
			lines.some(
				(line) => line !== own && gapTo(line, box) < gapTo(own, box) - 2,
			);
		// Text over text is unreadable; a line through a haloed label is only untidy.
		const cost =
			(outside ? 6 : 0) +
			(misleading ? 1 : 0) +
			lines.filter((line) => lineHits(line, box)).length * 2 +
			taken.filter((other) => overlaps(other, box)).length * 5;
		if (cost < best) {
			spot = candidate;
			best = cost;
			if (cost === 0) break;
		}
	}
	return { spot, cost: best };
}

/** Places a label at its best spot and takes that room. */
export function placeLabel<C extends { box: Box }>(
	candidates: readonly C[],
	context: PlaceContext,
): C {
	const { spot } = bestSpot(candidates, context);
	context.taken.push(spot.box);
	return spot;
}

/**
 * Places a label, falling back to its short form when the full one can't find a clear
 * spot and the short one does better. Returns the spot with the text it should show.
 */
export function placeText<C extends { box: Box }>(
	text: string,
	short: string | undefined,
	candidatesFor: (text: string) => readonly C[],
	context: PlaceContext,
): C & { text: string } {
	const full = bestSpot(candidatesFor(text), context);
	let chosen = { ...full.spot, text };
	if (full.cost > 0 && short) {
		const brief = bestSpot(candidatesFor(short), context);
		if (brief.cost < full.cost) chosen = { ...brief.spot, text: short };
	}
	context.taken.push(chosen.box);
	return chosen;
}
