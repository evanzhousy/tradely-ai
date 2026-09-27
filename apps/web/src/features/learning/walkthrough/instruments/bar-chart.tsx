import * as m from "motion/react-m";
import { Label, useStage, useTeachMotion } from "../stage";
import { textWidth } from "../text-measure";

export type Bar = {
	id: string;
	label: string;
	/** Null when the source sent nothing: drawn hatched, never as a zero. */
	value: number | null;
};

const PAD_TOP = 26;
const PAD_BOTTOM = 38;
const MISSING_HEIGHT = 34;

/**
 * One quantity by category, each bar labelled with its value. The value axis starts at
 * `min`; anything at or below it has no visible height, so a raised minimum exaggerates
 * differences while every printed value stays true.
 */
export function BarChart({
	width,
	height,
	bars,
	min = 0,
	max,
	format,
	title,
	axisTitle,
	focus,
}: {
	width: number;
	height: number;
	bars: readonly Bar[];
	min?: number;
	max: number;
	format: (value: number) => string;
	title?: string;
	axisTitle?: string;
	focus?: string;
}) {
	const motion = useTeachMotion();
	const { hatch } = useStage();
	const titleLines = !title
		? []
		: textWidth(title, 12) > width - 16
			? title.split(" · ")
			: [title];
	const top = PAD_TOP + titleLines.length * 14;
	const bottom = height - PAD_BOTTOM;
	const left =
		Math.max(textWidth(format(max), 11), textWidth(format(min), 11)) + 18;
	const right = width - 8;
	const slot = (right - left) / bars.length;
	const barWidth = Math.min(slot * 0.62, 56);
	const valueSize = width < 520 ? 11 : 13;
	const y = (value: number) =>
		bottom -
		((Math.min(Math.max(value, min), max) - min) / (max - min)) *
			(bottom - top);
	return (
		<g>
			{titleLines.map((line, i) => (
				<Label key={line} x={8} y={14 + i * 14} tone="muted">
					{line}
				</Label>
			))}
			<path d={`M${left} ${top}V${bottom}H${right}`} className="wt-axis" />
			{[min, max].map((tick) => (
				<g key={tick}>
					<path d={`M${left - 4} ${y(tick)}H${left}`} className="wt-axis" />
					<m.text
						x={left - 8}
						textAnchor="end"
						className="wt-small"
						initial={false}
						animate={{ y: y(tick) + 4 }}
						transition={motion.move}
					>
						{format(tick)}
					</m.text>
				</g>
			))}
			{bars.map((bar, i) => {
				const cx = left + slot * (i + 0.5);
				const x = cx - barWidth / 2;
				const on = bar.id === focus;
				const label = (
					<Label
						x={cx}
						y={bottom + 16}
						anchor="middle"
						tone={on ? "accent" : "small"}
					>
						{bar.label}
					</Label>
				);
				if (bar.value === null)
					return (
						<g key={bar.id}>
							<rect
								x={x}
								y={bottom - MISSING_HEIGHT}
								width={barWidth}
								height={MISSING_HEIGHT}
								rx={3}
								className="wt-ghost"
								style={{ fill: hatch }}
							/>
							<Label
								x={cx}
								y={bottom - MISSING_HEIGHT - 6}
								anchor="middle"
								tone="accent"
							>
								?
							</Label>
							{label}
						</g>
					);
				const barTop = y(bar.value);
				return (
					<g key={bar.id}>
						<m.rect
							x={x}
							width={barWidth}
							rx={3}
							className={on ? "wt-chip" : "wt-long-soft"}
							initial={false}
							animate={{ y: barTop, height: bottom - barTop }}
							transition={motion.move}
						/>
						<m.g
							initial={false}
							animate={{ y: barTop - 6 }}
							transition={motion.move}
						>
							<text
								x={cx}
								textAnchor="middle"
								className={on ? "wt-accent" : undefined}
								style={{ fontSize: valueSize }}
							>
								{format(bar.value)}
							</text>
						</m.g>
						{label}
					</g>
				);
			})}
			{axisTitle ? (
				<Label x={right} y={bottom + 32} anchor="end" tone="small">
					{axisTitle}
				</Label>
			) : null}
		</g>
	);
}
