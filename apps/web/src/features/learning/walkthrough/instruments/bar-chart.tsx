import * as m from "motion/react-m";
import { Appear, Label, useStage, useTeachMotion } from "../stage";
import { textWidth } from "../text-measure";

export type Bar = {
	id: string;
	label: string;
	/** Null when the source sent nothing: drawn hatched, never as a zero. */
	value: number | null;
	/** Not shown yet: the slot and its label stay so bars don't shift. */
	hidden?: boolean;
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
				// A category name wider than its slot condenses rather than run into its neighbour.
				const natural = textWidth(bar.label, on ? 13 : 11);
				const fitted =
					natural > slot - 6 ? Math.max(slot - 6, natural * 0.72) : undefined;
				const label = (
					<text
						x={cx}
						y={bottom + 16}
						textAnchor="middle"
						textLength={fitted}
						lengthAdjust={fitted ? "spacingAndGlyphs" : undefined}
						className={on ? "wt-accent" : "wt-small"}
					>
						{bar.label}
					</text>
				);
				if (bar.value === null && !bar.hidden)
					return (
						<g key={bar.id}>
							<Appear>
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
							</Appear>
							{label}
						</g>
					);
				// A bar not shown yet waits flat on the axis, so it grows up when it arrives.
				const shown = !bar.hidden && bar.value !== null;
				const barTop = shown && bar.value !== null ? y(bar.value) : bottom;
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
							animate={{ y: barTop - 6, opacity: shown ? 1 : 0 }}
							transition={motion.move}
						>
							<text
								x={cx}
								textAnchor="middle"
								className={on ? "wt-accent" : undefined}
								style={{ fontSize: valueSize }}
							>
								{bar.value === null ? "" : format(bar.value)}
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
