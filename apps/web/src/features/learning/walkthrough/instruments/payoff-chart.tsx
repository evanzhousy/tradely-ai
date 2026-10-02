import * as m from "motion/react-m";
import { useEffect, useId, useRef } from "react";
import { signedUsd } from "@/content/world";
import { type AxisDrag, DragHandle, useAxisDrag } from "../axis-drag";
import {
	type Box,
	fitAnchor,
	lineSpanY,
	placeLabel,
	placeText,
	textBox,
} from "../label-place";
import { Appear, Label, useTeachMotion } from "../stage";
import { packParts, textWidth } from "../text-measure";

type LabelSpot = {
	x: number;
	y: number;
	anchor: "start" | "middle" | "end";
	box: Box;
	/** Which of a label's candidate spots this is, so the chart can keep it next time. */
	slot: string;
	/** The text shown: the label, or its short form when only that fits. */
	text?: string;
};

export type PayoffLine = {
	id: string;
	label: string;
	/** Shown instead when the chart is too crowded for `label` to sit clear. */
	shortLabel?: string;
	/** Price in dollars, profit or loss in dollars. */
	points: readonly (readonly [number, number])[];
	tone: "position" | "reference" | "long" | "short";
	/** Modeled curves are dashed; realized payoffs are solid. */
	dashed?: boolean;
	/** Drawn invisibly where it rests, so it can later fade in while it moves. */
	hidden?: boolean;
};

export type PayoffMarker = {
	id: string;
	x: number;
	y: number;
	label?: string;
	/** Shown instead when the chart is too crowded for `label` to sit clear. */
	shortLabel?: string;
	tone?: "gain" | "loss" | "neutral";
	/** Put the label under the point, clear of a curve that rises on both sides of it. */
	labelBelow?: boolean;
};

/** A price range to shade, such as where a call is in the money but still losing. */
export type PayoffBand = {
	id: string;
	from: number;
	to: number;
	label?: string;
	tone?: "gain" | "loss" | "neutral";
};

/** Drags one marker, named by id, along the price axis. */
export type PayoffDrag = AxisDrag & { markerId: string };

/** Offsets around a marker to try for its label once the four closest spots are taken. */
const nearby = [-14, 22, -30, 38, -46, 54]
	.flatMap((dy) =>
		[0, -24, 24, -48, 48, -72, 72].map((dx) => [dx, dy] as const),
	)
	.sort((a, b) => Math.hypot(...a) - Math.hypot(...b));

const PAD_LEFT = 58;
const PAD_RIGHT = 16;
const PAD_TOP = 24;
const PAD_BOTTOM = 34;

/**
 * Profit or loss against the stock price, usually at expiry. Lines keep their identity
 * between steps so a change of premium or position slides rather than redraws.
 */
export function PayoffChart({
	width,
	height,
	xRange,
	yRange,
	xTicks,
	yTicks,
	lines,
	markers = [],
	bands = [],
	drag,
	xLabel,
	title,
	formatY = (value: number) => (value === 0 ? "$0" : signedUsd(value * 100, 0)),
	formatX = (value: number) => `$${value}`,
}: {
	width: number;
	height: number;
	xRange: readonly [number, number];
	yRange: readonly [number, number];
	xTicks: readonly number[];
	yTicks: readonly number[];
	lines: readonly PayoffLine[];
	markers?: readonly PayoffMarker[];
	bands?: readonly PayoffBand[];
	drag?: PayoffDrag;
	xLabel: string;
	title?: string;
	/** Axis labels for y values; defaults to signed whole dollars. */
	formatY?: (value: number) => string;
	/** Axis labels for x values; defaults to whole dollars. */
	formatX?: (value: number) => string;
}) {
	const motion = useTeachMotion();
	const clipId = useId().replace(/:/g, "");
	// Each label's last spot. While it stays clear the label keeps it, so labels don't hop from
	// spot to spot as a marker is dragged or a value changes under them.
	const slots = useRef(new Map<string, string>());
	const keepSlot =
		<C extends { slot: string }>(
			id: string,
			candidatesFor: (text: string) => C[],
		) =>
		(text: string) => {
			const list = candidatesFor(text);
			const kept = list.find(
				(candidate) => candidate.slot === slots.current.get(id),
			);
			return kept ? [kept, ...list] : list;
		};
	// Lines already on screen; one that joins later wipes in from the left, its label last.
	const drawn = useRef<ReadonlySet<string> | null>(null);
	useEffect(() => {
		drawn.current = new Set(lines.map((line) => line.id));
	});
	const joins = (id: string) =>
		motion.enabled && drawn.current !== null && !drawn.current.has(id);
	// The axis makes room for its widest value label, such as "−$30,000".
	const left = Math.max(
		PAD_LEFT,
		...yTicks.map((tick) => textWidth(formatY(tick), 11) + 14),
	);
	const right = width - PAD_RIGHT;
	const { dragging, area } = useAxisDrag(
		drag,
		(px) =>
			xRange[0] + ((px - left) / (right - left)) * (xRange[1] - xRange[0]),
	);
	// While dragging, everything tracks the pointer instead of taking the teaching pace.
	const move = dragging ? motion.follow : motion.move;
	// A title too wide for the stage breaks at its " · " separators.
	const titleLines = title ? packParts(title, width - 16, 12) : [];
	const top = PAD_TOP + Math.max(titleLines.length - 1, 0) * 14;
	const bottom = height - PAD_BOTTOM;
	const x = (value: number) =>
		left + ((value - xRange[0]) / (xRange[1] - xRange[0])) * (right - left);
	const y = (value: number) =>
		bottom -
		((Math.min(Math.max(value, yRange[0]), yRange[1]) - yRange[0]) /
			(yRange[1] - yRange[0])) *
			(bottom - top);
	const path = (points: PayoffLine["points"]) =>
		points
			.map(
				([px, py], i) =>
					`${i ? "L" : "M"}${x(px).toFixed(1)} ${y(py).toFixed(1)}`,
			)
			.join("");
	// Labels never sit on a line or on each other. Band labels hold a row at the top of the
	// plot; then each marker label and each line label takes the first clear spot it has.
	const screen = new Map(
		lines.map((line) => [
			line.id,
			line.points.map(([px, py]) => [x(px), y(py)] as const),
		]),
	);
	const paths = lines.flatMap((line) => {
		const points = screen.get(line.id);
		return line.hidden || !points ? [] : [points];
	});
	// The zero axis is an obstacle too: a label lying on it reads as struck through.
	const obstacles =
		yRange[0] < 0 && yRange[1] > 0
			? [
					...paths,
					[
						[left, y(0)],
						[right, y(0)],
					] as const,
				]
			: paths;
	const bounds = { x0: left, y0: top, x1: right + 2, y1: bottom - 2 };
	const taken: Box[] = [];
	// A band's label sits at the band's top, or its foot when a line runs across the top.
	const bandLabelY = new Map<string, number>();
	const bandLabelX = new Map<string, number>();
	for (const band of bands) {
		if (!band.label) continue;
		const label = band.label;
		// Centred on the band, but kept inside the plot so it never runs over the axis labels.
		const half = textWidth(label, 11) / 2 + 2;
		const at = Math.min(
			Math.max((x(band.from) + x(band.to)) / 2, left + half),
			right - half,
		);
		bandLabelX.set(band.id, at);
		const row = (baseline: number) => ({
			y: baseline,
			box: textBox(label, at, baseline, 11, "middle"),
		});
		bandLabelY.set(
			band.id,
			placeLabel([row(top + 14), row(bottom - 8), row(top + 30)], {
				lines: obstacles,
				taken,
				bounds,
			}).y,
		);
	}
	for (const marker of markers) {
		// A draggable marker's ring and chevrons are part of the marker.
		const r = marker.id === drag?.markerId ? 20 : 7;
		const [cx, cy] = [x(marker.x), y(marker.y)];
		taken.push({ x0: cx - r, x1: cx + r, y0: cy - r, y1: cy + r });
	}
	const markerLabels = new Map<string, LabelSpot>();
	for (const marker of markers) {
		if (!marker.label) continue;
		const lift = marker.id === drag?.markerId ? 1.4 : 1;
		const [cx, cy] = [x(marker.x), y(marker.y)];
		const middle = Math.min(Math.max(cx, left + 50), right - 50);
		const around = (text: string) => {
			const spot = (dx: number, dy: number, anchor: LabelSpot["anchor"]) => {
				const at = anchor === "middle" ? middle : cx + dx * lift;
				const baseline = cy + dy * lift;
				return {
					x: at,
					y: baseline,
					anchor,
					box: textBox(text, at, baseline, 13, anchor),
					slot: `${dx},${dy},${anchor}`,
				};
			};
			const above = spot(0, -14, "middle");
			const below = spot(0, 22, "middle");
			return [
				...(marker.labelBelow ? [below, above] : [above, below]),
				spot(-12, -8, "end"),
				spot(12, -8, "start"),
				spot(-12, 18, "end"),
				spot(12, 18, "start"),
				// Then any nearby spot, nearest first, so a crowded marker still finds room.
				...nearby.map(([dx, dy]) =>
					spot(dx, dy, dx < 0 ? "end" : dx > 0 ? "start" : "middle"),
				),
			];
		};
		const placed = placeText(
			marker.label,
			marker.shortLabel,
			keepSlot(`marker:${marker.id}`, around),
			{ lines: obstacles, taken, bounds },
		);
		slots.current.set(`marker:${marker.id}`, placed.slot);
		markerLabels.set(marker.id, placed);
	}
	const className = (tone: PayoffLine["tone"]) =>
		tone === "position"
			? "wt-line-position"
			: tone === "long"
				? "wt-line-long"
				: tone === "short"
					? "wt-line-short"
					: "wt-line-reference";
	// Line labels prefer the line's right end, above or below it, then a point further left.
	const lineLabels = new Map<string, LabelSpot>();
	const endY = (line: PayoffLine) => y(line.points[line.points.length - 1][1]);
	for (const line of [...lines].sort((a, b) => endY(a) - endY(b))) {
		const own = screen.get(line.id) ?? [];
		const along = (label: string) => {
			const half = textWidth(label, 11) / 2;
			const spot = (
				at: number,
				anchor: LabelSpot["anchor"],
				baseline: number,
				slot: string,
			) => ({
				x: at,
				y: baseline,
				anchor,
				box: textBox(label, at, baseline, 11, anchor),
				slot,
			});
			// Baselines that clear the line under the whole label, however steep it is there.
			const clear = (from: number, to: number) => {
				const span = lineSpanY(own, from, to) ?? {
					min: endY(line),
					max: endY(line),
				};
				return { above: span.min - 6, below: span.max + 14 };
			};
			const end = clear(right - 4 - half * 2, right - 4);
			return [
				spot(right - 4, "end", end.above, "end-above"),
				spot(right - 4, "end", end.below, "end-below"),
				spot(right - 4, "end", end.above - 14, "end-above-2"),
				spot(right - 4, "end", end.below + 14, "end-below-2"),
				...[0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1].flatMap((fraction) => {
					const at = left + (right - left) * fraction;
					const there = clear(at - half, at + half);
					return [
						spot(at, "middle", there.above, `${fraction}-above`),
						spot(at, "middle", there.below, `${fraction}-below`),
						spot(at, "middle", there.above - 14, `${fraction}-above-2`),
						spot(at, "middle", there.below + 14, `${fraction}-below-2`),
					];
				}),
			];
		};
		// A hidden line's label rests at its line's end, so one that appears later doesn't fly in.
		if (line.hidden || !line.label) {
			lineLabels.set(line.id, along(line.label)[0]);
			continue;
		}
		const placed = placeText(
			line.label,
			line.shortLabel,
			keepSlot(`line:${line.id}`, along),
			{ lines: obstacles, taken, bounds, own },
		);
		slots.current.set(`line:${line.id}`, placed.slot);
		lineLabels.set(line.id, placed);
	}
	return (
		<g>
			{titleLines.map((line, i) => (
				<Label key={line} x={8} y={14 + i * 14} tone="muted">
					{line}
				</Label>
			))}
			{bands.map((band) => (
				<Appear key={band.id}>
					{/* A band that changes range slides with its edges, at the drag's pace if dragged. */}
					<m.rect
						y={top}
						height={bottom - top}
						className={`wt-band-${band.tone ?? "neutral"}`}
						initial={false}
						animate={{ x: x(band.from), width: x(band.to) - x(band.from) }}
						transition={move}
					/>
					{band.label ? (
						<Label
							x={bandLabelX.get(band.id) ?? (x(band.from) + x(band.to)) / 2}
							y={bandLabelY.get(band.id) ?? top + 14}
							anchor="middle"
							tone="small"
							className="wt-halo"
							transition={move}
						>
							{band.label}
						</Label>
					) : null}
				</Appear>
			))}
			{yTicks.map((tick) => (
				<g key={tick}>
					<path
						d={`M${left} ${y(tick)}H${right}`}
						className={tick === 0 ? "wt-axis" : "wt-grid"}
					/>
					<Label x={left - 8} y={y(tick) + 4} anchor="end" tone="small">
						{formatY(tick)}
					</Label>
				</g>
			))}
			{xTicks.map((tick) => {
				const at = fitAnchor(formatX(tick), x(tick), 11, 2, width - 2);
				return (
					<Label
						key={tick}
						x={at.x}
						y={bottom + 18}
						anchor={at.anchor}
						tone="small"
					>
						{formatX(tick)}
					</Label>
				);
			})}
			<Label x={right} y={bottom + 32} anchor="end" tone="small">
				{xLabel}
			</Label>
			{lines.map((line) => {
				const clip = `${clipId}-${line.id.replace(/[^\w-]/g, "_")}`;
				return (
					<g key={line.id} clipPath={`url(#${clip})`}>
						<clipPath id={clip}>
							<m.rect
								x={left - 4}
								y={0}
								height={height}
								initial={joins(line.id) ? { width: 0 } : false}
								animate={{ width: right - left + 8 }}
								transition={motion.move}
							/>
						</clipPath>
						<m.path
							className={className(line.tone)}
							strokeDasharray={line.dashed ? "6 5" : undefined}
							initial={false}
							animate={{ d: path(line.points), opacity: line.hidden ? 0 : 1 }}
							transition={move}
						/>
						<m.text
							textAnchor={lineLabels.get(line.id)?.anchor}
							className={`wt-small wt-halo wt-label-${line.tone}`}
							initial={false}
							animate={{
								x: lineLabels.get(line.id)?.x,
								y: lineLabels.get(line.id)?.y,
								opacity: line.hidden ? 0 : 1,
							}}
							transition={move}
						>
							{lineLabels.get(line.id)?.text ?? line.label}
						</m.text>
					</g>
				);
			})}
			{markers.map((marker) => (
				// A marker that joins a step fades in where it lands.
				<Appear key={marker.id}>
					{marker.id === drag?.markerId ? (
						<DragHandle
							cx={x(marker.x)}
							cy={y(marker.y)}
							r={13}
							dragging={dragging}
							transition={move}
						/>
					) : null}
					<m.circle
						r={6}
						className={
							marker.tone === "gain"
								? "wt-long"
								: marker.tone === "loss"
									? "wt-short"
									: "wt-chip"
						}
						stroke="var(--foreground)"
						strokeWidth={1.5}
						initial={false}
						animate={{ cx: x(marker.x), cy: y(marker.y) }}
						transition={move}
					/>
					{marker.label ? (
						<m.text
							textAnchor={markerLabels.get(marker.id)?.anchor}
							className={`wt-halo ${
								marker.tone === "gain"
									? "wt-gain wt-marker-label"
									: marker.tone === "loss"
										? "wt-loss wt-marker-label"
										: "wt-accent"
							}`}
							initial={false}
							animate={{
								x: markerLabels.get(marker.id)?.x,
								y: markerLabels.get(marker.id)?.y,
							}}
							transition={move}
						>
							{markerLabels.get(marker.id)?.text ?? marker.label}
						</m.text>
					) : null}
				</Appear>
			))}
			{drag ? (
				// Over the whole plot so a press anywhere moves the marker; vertical swipes still scroll.
				<rect
					x={left}
					y={top}
					width={right - left}
					height={bottom - top}
					{...area}
				/>
			) : null}
		</g>
	);
}
