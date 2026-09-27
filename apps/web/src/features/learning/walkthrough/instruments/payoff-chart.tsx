import * as m from "motion/react-m";
import { type PointerEvent, useEffect, useId, useRef, useState } from "react";
import { signedUsd } from "@/content/world";
import { Label, useTeachMotion } from "../stage";
import { textWidth } from "../text-measure";

export type PayoffLine = {
	id: string;
	label: string;
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

/**
 * Lets the reader drag one marker along the price axis by pressing anywhere on the plot.
 * The lesson owns the value, and a range control stays the keyboard path to it.
 */
export type PayoffDrag = {
	markerId: string;
	min: number;
	max: number;
	step: number;
	onChange: (x: number) => void;
};

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
	// Lines already on screen; one that joins later wipes in from the left, its label last.
	const drawn = useRef<ReadonlySet<string> | null>(null);
	useEffect(() => {
		drawn.current = new Set(lines.map((line) => line.id));
	});
	const joins = (id: string) =>
		motion.enabled && drawn.current !== null && !drawn.current.has(id);
	const [dragging, setDragging] = useState(false);
	const reported = useRef<number | null>(null);
	// While dragging, everything tracks the pointer instead of taking the teaching pace.
	const move = dragging ? motion.follow : motion.move;
	const left = PAD_LEFT;
	const right = width - PAD_RIGHT;
	// A title too wide for the stage breaks at its " · " separators, one part per line.
	const titleLines =
		title && textWidth(title, 12) > width - 16
			? title.split(" · ")
			: title
				? [title]
				: [];
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
	// Band labels sit in a row at the top of the plot.
	const bandLabels = bands.flatMap((band) =>
		band.label
			? [
					{
						x: (x(band.from) + x(band.to)) / 2,
						half: textWidth(band.label, 11) / 2,
					},
				]
			: [],
	);
	/** Above its point, or below when asked or when it would run into a band label. */
	const markerLabelAt = (marker: PayoffMarker) => {
		const at = Math.min(Math.max(x(marker.x), left + 50), right - 50);
		// A draggable marker's label clears its ring.
		const lift = marker.id === drag?.markerId ? 1.4 : 1;
		const above = y(marker.y) - 14 * lift;
		const half = textWidth(marker.label ?? "", 13) / 2;
		const blocked =
			above - 12 < top + 18 &&
			bandLabels.some((band) => Math.abs(band.x - at) < band.half + half + 6);
		return {
			x: at,
			y: marker.labelBelow || blocked ? y(marker.y) + 22 * lift : above,
		};
	};
	const report = (event: PointerEvent<SVGRectElement>) => {
		const ctm = event.currentTarget.getScreenCTM();
		if (!drag || !ctm) return;
		const px = new DOMPoint(event.clientX, event.clientY).matrixTransform(
			ctm.inverse(),
		).x;
		const raw =
			xRange[0] + ((px - left) / (right - left)) * (xRange[1] - xRange[0]);
		const snapped =
			drag.min + Math.round((raw - drag.min) / drag.step) * drag.step;
		const next = Number(
			Math.min(drag.max, Math.max(drag.min, snapped)).toFixed(6),
		);
		if (next === reported.current) return;
		reported.current = next;
		drag.onChange(next);
	};
	const release = () => {
		reported.current = null;
		setDragging(false);
	};
	const className = (tone: PayoffLine["tone"]) =>
		tone === "position"
			? "wt-line-position"
			: tone === "long"
				? "wt-line-long"
				: tone === "short"
					? "wt-line-short"
					: "wt-line-reference";
	// Line labels sit above each line's right end, pushed apart so none overlap.
	const labelY = new Map<string, number>();
	const ends = lines
		.filter((line) => line.label)
		.map((line) => ({
			id: line.id,
			y: y(line.points[line.points.length - 1][1]) - 8,
		}))
		.sort((a, b) => a.y - b.y);
	for (let i = 0; i < ends.length; i++) {
		const previous = ends[i - 1];
		if (previous && ends[i].y - previous.y < 14) ends[i].y = previous.y + 14;
		labelY.set(ends[i].id, ends[i].y);
	}
	// A hidden label rests at its line's end, so one that appears later doesn't fly in from the top.
	for (const line of lines)
		if (!labelY.has(line.id))
			labelY.set(line.id, y(line.points[line.points.length - 1][1]) - 8);
	return (
		<g>
			{titleLines.map((line, i) => (
				<Label key={line} x={8} y={14 + i * 14} tone="muted">
					{line}
				</Label>
			))}
			{bands.map((band) => (
				<m.g
					key={band.id}
					initial={motion.enabled ? { opacity: 0 } : false}
					animate={{ opacity: 1 }}
					transition={motion.fade}
				>
					<rect
						x={x(band.from)}
						y={top}
						width={x(band.to) - x(band.from)}
						height={bottom - top}
						className={`wt-band-${band.tone ?? "neutral"}`}
					/>
					{band.label ? (
						<Label
							x={(x(band.from) + x(band.to)) / 2}
							y={top + 14}
							anchor="middle"
							tone="small"
							className="wt-halo"
						>
							{band.label}
						</Label>
					) : null}
				</m.g>
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
			{xTicks.map((tick) => (
				<Label
					key={tick}
					x={x(tick)}
					y={bottom + 18}
					anchor="middle"
					tone="small"
				>
					{formatX(tick)}
				</Label>
			))}
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
							x={right - 4}
							textAnchor="end"
							className="wt-small wt-halo"
							initial={false}
							animate={{ y: labelY.get(line.id) }}
							transition={move}
						>
							{line.label}
						</m.text>
					</g>
				);
			})}
			{markers.map((marker) => (
				<g key={marker.id}>
					{marker.id === drag?.markerId ? (
						<>
							<m.circle
								r={13}
								className="wt-drag-ring"
								data-dragging={dragging || undefined}
								initial={false}
								animate={{ cx: x(marker.x), cy: y(marker.y) }}
								transition={move}
							/>
							<m.path
								className="wt-drag-chevron"
								initial={false}
								animate={{
									d: `M${x(marker.x) - 17} ${y(marker.y) - 4}l-4 4 4 4M${x(marker.x) + 17} ${y(marker.y) - 4}l4 4-4 4`,
								}}
								transition={move}
							/>
						</>
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
							textAnchor="middle"
							className={`wt-halo ${
								marker.tone === "gain"
									? "wt-gain wt-marker-label"
									: marker.tone === "loss"
										? "wt-loss wt-marker-label"
										: "wt-accent"
							}`}
							initial={false}
							animate={markerLabelAt(marker)}
							transition={move}
						>
							{marker.label}
						</m.text>
					) : null}
				</g>
			))}
			{drag ? (
				// Over the whole plot so a press anywhere moves the marker; vertical swipes still scroll.
				<rect
					x={left}
					y={top}
					width={right - left}
					height={bottom - top}
					className="wt-drag-area"
					data-dragging={dragging || undefined}
					onPointerDown={(event) => {
						if (event.button !== 0) return;
						event.currentTarget.setPointerCapture(event.pointerId);
						setDragging(true);
						// A touch waits to move, so a tap on the way to scrolling leaves the marker.
						if (event.pointerType !== "touch") report(event);
					}}
					onPointerMove={(event) => {
						if (event.currentTarget.hasPointerCapture(event.pointerId))
							report(event);
					}}
					onPointerUp={release}
					onPointerCancel={release}
					onLostPointerCapture={release}
				/>
			) : null}
		</g>
	);
}
