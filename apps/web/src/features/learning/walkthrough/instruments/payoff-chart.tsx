import * as m from "motion/react-m";
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
	xLabel: string;
	title?: string;
	/** Axis labels for y values; defaults to signed whole dollars. */
	formatY?: (value: number) => string;
	/** Axis labels for x values; defaults to whole dollars. */
	formatX?: (value: number) => string;
}) {
	const motion = useTeachMotion();
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
				return (
					<g key={line.id}>
						<m.path
							className={className(line.tone)}
							strokeDasharray={line.dashed ? "6 5" : undefined}
							initial={false}
							animate={{ d: path(line.points), opacity: line.hidden ? 0 : 1 }}
							transition={motion.move}
						/>
						<m.text
							x={right - 4}
							textAnchor="end"
							className="wt-small wt-halo"
							initial={false}
							animate={{ y: labelY.get(line.id) }}
							transition={motion.move}
						>
							{line.label}
						</m.text>
					</g>
				);
			})}
			{markers.map((marker) => (
				<g key={marker.id}>
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
						transition={motion.move}
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
							animate={{
								x: Math.min(Math.max(x(marker.x), left + 50), right - 50),
								y: marker.labelBelow ? y(marker.y) + 22 : y(marker.y) - 14,
							}}
							transition={motion.move}
						>
							{marker.label}
						</m.text>
					) : null}
				</g>
			))}
		</g>
	);
}
