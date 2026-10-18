import {
	axisVector,
	cylinder,
	type Flat,
	fitProjection,
	insetPlan,
	iso,
	onTop,
	type Plan,
	type Point3,
	type Projection,
	planOutline,
	type SolidPaths,
	sideSeam,
	slabOf,
	topTicks,
} from "../walkthrough/iso";

/*
 * The settlement bench, drawn in isometric: your account tray on the left, the writer's on
 * the right, and the clearing house as a booth between two tracks that join them. Cash runs
 * on the back track and shares on the front one, so an exchange passes the booth on both at
 * once. One world unit is about a millimetre of a desk model; x runs along the bench, y
 * towards the viewer and z up.
 *
 * Drawing order is fixed and proved by the layout rather than sorted per frame: the bench
 * behind the tracks, the back track's cash, the booth (between the tracks, so in front of
 * one and behind the other), the front track's shares, then the trays' front and outer
 * walls. A tray's front wall is lower than anything that sits in it.
 */

const AZIMUTH = 60;
const BASE: Plan = { x: 0, y: 0, w: 320, d: 124, r: 8 };
const TOP = 9;
/** Where the tokens ride: the top of the tracks and of the tray floors. */
const FLOOR = TOP + 2;
const LANE = { cash: 40, shares: 84 };
const HOLDER_X = 54;
const WRITER_X = 266;
const TRAY = { w: 80, y: 16, d: 94, wall: 3, height: 9 };
/** The clearing house: a booth on the strip between the tracks, under a roof. */
const BOOTH = { x: 138, w: 44, y: 57, d: 10, top: 46, roof: 4 };
/** A bundle's height: one unit for every $500, so $9,500 stands nearly four times $2,500. */
const DOLLARS_PER_UNIT = 500;
const SHARE_BLOCK = { side: 30, height: 12, grid: 10 };

export interface Part {
	paths: SolidPaths;
	lit?: boolean;
}

export interface Token {
	parts: Part[];
	/** Lines drawn on the token: a bundle's paper band, the share block's 10 × 10 grid. */
	lines: string;
}

const trayPlan = (x: number): Plan => ({
	x: x - TRAY.w / 2,
	y: TRAY.y,
	w: TRAY.w,
	d: TRAY.d,
	r: 2,
});

function bundle(x: number, dollars: number, P: Projection): Token {
	const height = dollars / DOLLARS_PER_UNIT;
	const plan: Plan = { x: x - 17, y: LANE.cash - 10, w: 34, d: 20, r: 1.5 };
	const band = (z: number) => sideSeam(plan, z, P);
	const mid = FLOOR + height / 2;
	return {
		parts: [{ paths: slabOf(plan, FLOOR, height, P, 0.8) }],
		// A paper band round the middle, and a bill's border on top.
		lines: [
			band(mid - Math.min(2, height / 4)),
			band(mid + Math.min(2, height / 4)),
			planOutline(insetPlan(plan, 3), FLOOR + height, P),
		].join(""),
	};
}

function shareBlock(x: number, P: Projection): Token {
	const { side, height, grid } = SHARE_BLOCK;
	const plan: Plan = {
		x: x - side / 2,
		y: LANE.shares - side / 2,
		w: side,
		d: side,
		r: 1,
	};
	const top = FLOOR + height;
	const cell = side / grid;
	const lines: string[] = [];
	for (let i = 1; i < grid; i++) {
		lines.push(
			onTop(
				[
					[plan.x + i * cell, plan.y],
					[plan.x + i * cell, plan.y + side],
				],
				top,
				P,
			),
			onTop(
				[
					[plan.x, plan.y + i * cell],
					[plan.x + side, plan.y + i * cell],
				],
				top,
				P,
			),
		);
	}
	return {
		parts: [{ paths: slabOf(plan, FLOOR, height, P, 0.6) }],
		lines: lines.join(""),
	};
}

/**
 * The bench fitted into a box on the stage. `alfa` and `index` are the two cash amounts;
 * every label anchor is a screen point the film sets its type beside.
 */
export function benchOf(
	box: { x: number; y: number; w: number; h: number },
	{ alfa, index }: { alfa: number; index: number },
) {
	const reach: Point3[] = [];
	for (const x of [BASE.x, BASE.x + BASE.w])
		for (const y of [BASE.y, BASE.y + BASE.d])
			for (const z of [-6, BOOTH.top + BOOTH.roof]) reach.push([x, y, z]);
	const fitted = fitProjection(reach, box.w, box.h, { azimuth: AZIMUTH });
	const P: Projection = {
		...fitted,
		origin: [fitted.origin[0] + box.x, fitted.origin[1] + box.y],
	};
	const wall = (plan: Plan): Part => ({
		paths: slabOf(plan, FLOOR, TRAY.height, P, 0.5),
	});
	const tray = (x: number, outer: "left" | "right", lit: boolean) => {
		const plan = trayPlan(x);
		const end = outer === "left" ? plan.x : plan.x + plan.w - TRAY.wall;
		return {
			floor: { paths: slabOf(plan, TOP, 2, P), lit },
			back: { ...wall({ ...plan, d: TRAY.wall, r: 0.5 }), lit },
			front: {
				...wall({
					...plan,
					y: plan.y + plan.d - TRAY.wall,
					d: TRAY.wall,
					r: 0.5,
				}),
				lit,
			},
			end: { ...wall({ ...plan, x: end, w: TRAY.wall, r: 0.5 }), lit },
		};
	};
	const holder = tray(HOLDER_X, "left", true);
	const writer = tray(WRITER_X, "right", false);
	const booth: Part[] = [
		{
			paths: slabOf(
				{ x: BOOTH.x, y: BOOTH.y, w: BOOTH.w, d: BOOTH.d, r: 1.5 },
				TOP,
				BOOTH.top - TOP,
				P,
				0.8,
			),
		},
		{
			paths: slabOf(
				{
					x: BOOTH.x - 4,
					y: BOOTH.y - 3,
					w: BOOTH.w + 8,
					d: BOOTH.d + 6,
					r: 2,
				},
				BOOTH.top,
				BOOTH.roof,
				P,
				1,
			),
		},
	];
	// A window band round the booth, under its roof.
	const boothPlan: Plan = {
		x: BOOTH.x,
		y: BOOTH.y,
		w: BOOTH.w,
		d: BOOTH.d,
		r: 1.5,
	};
	const windows = [BOOTH.top - 12, BOOTH.top - 6]
		.map((z) => sideSeam(boothPlan, z, P))
		.join("");
	const track = (y: number): Part => ({
		paths: slabOf(
			{
				x: HOLDER_X + TRAY.w / 2,
				y: y - 12,
				w: WRITER_X - HOLDER_X - TRAY.w,
				d: 24,
				r: 2,
			},
			TOP,
			2,
			P,
		),
	});
	const feet = [
		[16, 108],
		[304, 108],
		[304, 16],
	].map(([x, y]): Part => ({ paths: cylinder(x ?? 0, y ?? 0, 7, -6, 6, P) }));
	const ruler = topTicks(
		HOLDER_X - TRAY.w / 2,
		WRITER_X + TRAY.w / 2,
		4,
		5,
		BASE.d - 9,
		TOP,
		[2.5, 5],
		P,
	);
	const screws = [
		[7, 7],
		[313, 7],
		[7, 117],
		[313, 117],
	]
		.map(([x, y]) =>
			planOutline(
				{ x: (x ?? 0) - 1.6, y: (y ?? 0) - 1.6, w: 3.2, d: 3.2, r: 1.6 },
				TOP,
				P,
			),
		)
		.join("");
	// The grooves the tokens ride in, past the booth.
	const grooves = [LANE.cash, LANE.shares]
		.map((y) =>
			onTop(
				[
					[HOLDER_X + TRAY.w / 2, y],
					[WRITER_X - TRAY.w / 2, y],
				],
				FLOOR,
				P,
			),
		)
		.join("");
	const slide = axisVector(P, [WRITER_X - HOLDER_X, 0, 0]);
	/** The highest screen point over a tray: type above it clears the tray and its token. */
	const above = (x: number): Flat => {
		const plan = trayPlan(x);
		const ys = [
			iso([plan.x, plan.y, FLOOR + TRAY.height], P)[1],
			iso([plan.x + plan.w, plan.y, FLOOR + TRAY.height], P)[1],
			iso([x - 17, LANE.cash - 10, FLOOR + alfa / DOLLARS_PER_UNIT], P)[1],
			iso([x + 17, LANE.cash - 10, FLOOR + alfa / DOLLARS_PER_UNIT], P)[1],
		];
		return [iso([x, TRAY.y + TRAY.d / 2, FLOOR], P)[0], Math.min(...ys)];
	};
	/** The lowest screen point under a tray: type below it clears the base and its feet. */
	const below = (x: number): Flat => {
		const plan = trayPlan(x);
		const ys = [plan.x, plan.x + plan.w].map(
			(edge) => iso([edge, BASE.d, -6], P)[1],
		);
		return [iso([x, BASE.d, 0], P)[0], Math.max(...ys)];
	};
	/** The top of the booth's roof, back corner included: type above it clears the booth. */
	const roof = [BOOTH.x - 4, BOOTH.x + BOOTH.w + 4].flatMap((x) =>
		[BOOTH.y - 3, BOOTH.y + BOOTH.d + 3].map((y) =>
			iso([x, y, BOOTH.top + BOOTH.roof], P),
		),
	);
	const gate: Flat = [
		iso([BOOTH.x + BOOTH.w / 2, BOOTH.y + BOOTH.d / 2, BOOTH.top], P)[0],
		Math.min(...roof.map(([, y]) => y)),
	];
	return {
		P,
		halo: slabOf(insetPlan(BASE, -4), -6, 6, P).fill,
		/** Drawn before the tokens. */
		back: [
			...feet,
			{ paths: slabOf(BASE, 0, TOP, P, 1.5) },
			track(LANE.cash),
			track(LANE.shares),
			holder.floor,
			writer.floor,
			holder.back,
			holder.end,
			writer.back,
		],
		/** Drawn between the back track's tokens and the front track's. */
		middle: booth,
		windows,
		/** Drawn after the tokens. */
		front: [holder.front, writer.front, writer.end],
		ruler,
		screws,
		grooves,
		tokens: {
			alfaCash: bundle(HOLDER_X, alfa, P),
			shares: shareBlock(WRITER_X, P),
			indexCash: bundle(WRITER_X, index, P),
		},
		/** The screen shift from the holder's tray to the writer's. */
		slide,
		anchors: {
			holderAbove: above(HOLDER_X),
			writerAbove: above(WRITER_X),
			holderBelow: below(HOLDER_X),
			writerBelow: below(WRITER_X),
			gate,
		},
	};
}

export type Bench = ReturnType<typeof benchOf>;
