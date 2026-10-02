import * as m from "motion/react-m";
import { type AxisDrag, DragHandle, useAxisDrag } from "../axis-drag";
import { fitAnchor } from "../label-place";
import { Appear, Label, useTeachMotion } from "../stage";
import { textWidth } from "../text-measure";

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
	drag,
	tickLabel = (tick: number) => `$${tick}`,
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
	/** Lets the reader drag the marker along the axis. */
	drag?: AxisDrag;
	tickLabel?: (tick: number) => string;
}) {
	const motion = useTeachMotion();
	const left = 18;
	const right = width - 18;
	const { dragging, area } = useAxisDrag(
		drag,
		(px) => min + ((px - left) / (right - left)) * (max - min),
	);
	// While dragging, the marker tracks the pointer instead of taking the teaching pace.
	const move = dragging ? motion.follow : motion.move;
	const x = (value: number) =>
		left +
		((Math.min(Math.max(value, min), max) - min) / (max - min)) *
			(right - left);
	const axis = 92;
	const markerX = x(marker.value);
	// Labels follow the marker but stay inside the line; a note too wide for its size steps down.
	const clampTo = (half: number) =>
		Math.min(Math.max(markerX, left + half), right - half);
	const labelX = clampTo(
		Math.min(textWidth(marker.label, 13) / 2 + 2, (right - left) / 2),
	);
	const noteSize = note && textWidth(note, 17) > right - left ? 13 : 17;
	const noteX = note
		? clampTo(Math.min(textWidth(note, noteSize) / 2 + 2, (right - left) / 2))
		: labelX;
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
				// A tick gives way to the strike's own label wherever the two would touch.
				.filter(
					(tick) =>
						!strike ||
						Math.abs(x(tick) - x(strike.value)) >
							textWidth(strike.label, 13) / 2 +
								textWidth(tickLabel(tick), 11) / 2 +
								6,
				)
				.map((tick) => {
					const at = fitAnchor(tickLabel(tick), x(tick), 11, 2, width - 2);
					return (
						<Label
							key={tick}
							x={at.x}
							y={axis + 24}
							anchor={at.anchor}
							tone="small"
						>
							{tickLabel(tick)}
						</Label>
					);
				})}
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
				<Appear>
					<circle cx={x(marker.before)} cy={axis} r={7} className="wt-ghost" />
				</Appear>
			) : null}
			{drag ? (
				<DragHandle
					cx={markerX}
					cy={axis}
					r={15}
					dragging={dragging}
					transition={move}
				/>
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
				transition={move}
			/>
			<m.text
				y={40}
				textAnchor="middle"
				className="wt-accent"
				initial={false}
				animate={{ x: labelX }}
				transition={move}
			>
				{marker.label}
			</m.text>
			{note ? (
				<m.text
					y={axis + 48}
					textAnchor="middle"
					className="wt-strong"
					style={noteSize === 17 ? undefined : { fontSize: noteSize }}
					initial={false}
					animate={{ x: noteX }}
					transition={move}
				>
					{note}
				</m.text>
			) : null}
			{drag ? (
				// Over the axis and the label above it, so a press near the line moves the marker.
				<rect x={left} y={30} width={right - left} height={axis} {...area} />
			) : null}
		</g>
	);
}
