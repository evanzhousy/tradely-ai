import * as m from "motion/react-m";
import { Label, useTeachMotion } from "../stage";

export const READOUT_HEIGHT = 70;

/** A screen-style number with its label and the time it describes. */
export function Readout({
	x,
	y,
	width,
	label,
	value,
	note,
	highlight = false,
}: {
	x: number;
	y: number;
	width: number;
	label: string;
	value: string;
	note?: string;
	highlight?: boolean;
}) {
	const motion = useTeachMotion();
	return (
		<g>
			<rect
				x={x}
				y={y}
				width={width}
				height={READOUT_HEIGHT}
				rx={10}
				className={highlight ? "wt-focus-shape" : "wt-panel-shape"}
			/>
			<Label x={x + 12} y={y + 18} tone="muted">
				{label}
			</Label>
			<m.text
				key={value}
				x={x + 12}
				y={y + 42}
				className="wt-strong"
				initial={motion.enabled ? { opacity: 0.2 } : false}
				animate={{ opacity: 1 }}
				transition={motion.fade}
			>
				{value}
			</m.text>
			{note ? (
				<Label x={x + 12} y={y + 60} tone="small">
					{note}
				</Label>
			) : null}
		</g>
	);
}
