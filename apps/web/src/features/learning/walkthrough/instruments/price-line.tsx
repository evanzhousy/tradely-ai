import * as m from "motion/react-m";
import { Label, useTeachMotion } from "../stage";

export const PRICE_LINE_HEIGHT = 150;

/**
 * One price axis, such as the stock at expiry, with a strike, a shaded region where an
 * option is worth using, and a marker for the price being discussed.
 */
export function PriceLine({
	width,
	min,
	max,
	ticks,
	header,
	strike,
	zone,
	marker,
	note,
}: {
	width: number;
	/** Dollars. */
	min: number;
	max: number;
	ticks: readonly number[];
	header?: string;
	strike?: { value: number; label: string };
	zone?: { from: number; to: number; label: string };
	marker: {
		value: number;
		label: string;
		tone?: "gain" | "loss" | "neutral";
		before?: number;
	};
	note?: string;
}) {
	const motion = useTeachMotion();
	const left = 18;
	const right = width - 18;
	const x = (value: number) =>
		left +
		((Math.min(Math.max(value, min), max) - min) / (max - min)) *
			(right - left);
	const axis = 92;
	const markerX = x(marker.value);
	const labelX = Math.min(Math.max(markerX, left + 60), right - 60);
	return (
		<g>
			{header ? (
				<Label x={left} y={18} tone="muted">
					{header}
				</Label>
			) : null}
			{zone ? (
				<m.rect
					y={52}
					height={axis - 52}
					className="wt-focus-shape"
					initial={false}
					animate={{ x: x(zone.from), width: x(zone.to) - x(zone.from) }}
					transition={motion.move}
				/>
			) : null}
			{zone ? (
				<m.text
					y={76}
					textAnchor="middle"
					className="wt-accent"
					initial={false}
					animate={{ x: (x(zone.from) + x(zone.to)) / 2 }}
					transition={motion.move}
				>
					{zone.label}
				</m.text>
			) : null}
			<path
				d={`M${left} ${axis}H${right}`}
				className="wt-axis"
				strokeWidth={2}
			/>
			{ticks
				.filter((tick) => !strike || Math.abs(x(tick) - x(strike.value)) > 34)
				.map((tick) => (
					<Label
						key={tick}
						x={x(tick)}
						y={axis + 24}
						anchor="middle"
						tone="small"
					>
						${tick}
					</Label>
				))}
			{strike ? (
				<g>
					<path
						d={`M${x(strike.value)} 46V${axis + 8}`}
						className="wt-axis"
						strokeDasharray="4 4"
					/>
					<Label x={x(strike.value)} y={axis + 24} anchor="middle">
						{strike.label}
					</Label>
				</g>
			) : null}
			{marker.before !== undefined && marker.before !== marker.value ? (
				<circle cx={x(marker.before)} cy={axis} r={7} className="wt-ghost" />
			) : null}
			<m.circle
				cy={axis}
				r={9}
				className={
					marker.tone === "gain"
						? "wt-long"
						: marker.tone === "loss"
							? "wt-short"
							: "wt-chip"
				}
				stroke="var(--foreground)"
				strokeWidth={2}
				initial={false}
				animate={{ cx: markerX }}
				transition={motion.move}
			/>
			<m.text
				y={40}
				textAnchor="middle"
				className="wt-accent"
				initial={false}
				animate={{ x: labelX }}
				transition={motion.move}
			>
				{marker.label}
			</m.text>
			{note ? (
				<m.text
					y={axis + 48}
					textAnchor="middle"
					className="wt-strong"
					initial={false}
					animate={{ x: labelX }}
					transition={motion.move}
				>
					{note}
				</m.text>
			) : null}
		</g>
	);
}
