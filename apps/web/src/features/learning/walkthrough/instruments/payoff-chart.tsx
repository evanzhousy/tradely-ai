import * as m from "motion/react-m";
import { signedUsd } from "@/content/world";
import { Label, useTeachMotion } from "../stage";

export type PayoffLine = {
	id: string;
	label: string;
	/** Price in dollars, profit or loss in dollars. */
	points: readonly (readonly [number, number])[];
	tone: "position" | "reference" | "long" | "short";
	/** Modeled curves are dashed; realized payoffs are solid. */
	dashed?: boolean;
};

export type PayoffMarker = {
	id: string;
	x: number;
	y: number;
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
	xLabel,
	title,
	formatY = (value: number) => (value === 0 ? "$0" : signedUsd(value * 100, 0)),
}: {
	width: number;
	height: number;
	xRange: readonly [number, number];
	yRange: readonly [number, number];
	xTicks: readonly number[];
	yTicks: readonly number[];
	lines: readonly PayoffLine[];
	markers?: readonly PayoffMarker[];
	xLabel: string;
	title?: string;
	/** Axis labels for y values; defaults to signed whole dollars. */
	formatY?: (value: number) => string;
}) {
	const motion = useTeachMotion();
	const left = PAD_LEFT;
	const right = width - PAD_RIGHT;
	const top = PAD_TOP;
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
	return (
		<g>
			{title ? (
				<Label x={left} y={14} tone="muted">
					{title}
				</Label>
			) : null}
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
					${tick}
				</Label>
			))}
			<Label x={right} y={bottom + 32} anchor="end" tone="small">
				{xLabel}
			</Label>
			{lines.map((line) => {
				const end = line.points[line.points.length - 1];
				return (
					<g key={line.id}>
						<m.path
							className={className(line.tone)}
							strokeDasharray={line.dashed ? "6 5" : undefined}
							initial={false}
							animate={{ d: path(line.points) }}
							transition={motion.move}
						/>
						<m.text
							x={right - 4}
							textAnchor="end"
							className="wt-small"
							initial={false}
							animate={{ y: y(end[1]) - 8 }}
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
							className="wt-accent"
							initial={false}
							animate={{
								x: Math.min(Math.max(x(marker.x), left + 50), right - 50),
								y: y(marker.y) - 14,
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
