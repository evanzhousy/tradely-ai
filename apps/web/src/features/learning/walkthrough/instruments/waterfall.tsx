import * as m from "motion/react-m";
import { Label, useTeachMotion } from "../stage";
import { textWidth } from "../text-measure";

export type WaterfallStep = {
	id: string;
	label: string;
	value: number;
	/** A step adds to the running sum; a total or model bar stands on zero. */
	kind?: "step" | "total" | "model";
	/** Not yet shown: the slot stays so bars don't shift as steps appear. */
	hidden?: boolean;
};

const PAD_TOP = 26;
const PAD_BOTTOM = 34;

/**
 * Contributions to a change, each bar starting where the last one ended, then the total
 * they add up to. A model bar beside the total shows what full repricing gives, dashed.
 */
export function Waterfall({
	width,
	height,
	steps,
	range,
	ticks,
	format,
	title,
}: {
	width: number;
	height: number;
	steps: readonly WaterfallStep[];
	range: readonly [number, number];
	ticks: readonly number[];
	format: (value: number) => string;
	title?: string;
}) {
	const motion = useTeachMotion();
	const titleLines = !title
		? []
		: textWidth(title, 12) > width - 16
			? title.split(" · ")
			: [title];
	const top = PAD_TOP + titleLines.length * 14;
	const bottom = height - PAD_BOTTOM;
	const left =
		Math.max(...ticks.map((tick) => textWidth(format(tick), 11))) + 16;
	const right = width - 8;
	const slot = (right - left) / steps.length;
	const barWidth = Math.min(slot * 0.6, 48);
	const valueSize = width < 520 ? 11 : 12;
	const y = (value: number) =>
		bottom -
		((Math.min(Math.max(value, range[0]), range[1]) - range[0]) /
			(range[1] - range[0])) *
			(bottom - top);
	let running = 0;
	const bars = steps.map((step) => {
		const from = step.kind === "total" || step.kind === "model" ? 0 : running;
		const to =
			step.kind === "total"
				? running
				: step.kind === "model"
					? step.value
					: running + step.value;
		if (!step.kind || step.kind === "step") running += step.value;
		return { step, from, to };
	});
	return (
		<g>
			{titleLines.map((line, i) => (
				<Label key={line} x={8} y={14 + i * 14} tone="muted">
					{line}
				</Label>
			))}
			{ticks.map((tick) => (
				<g key={tick}>
					<path
						d={`M${left} ${y(tick)}H${right}`}
						className={tick === 0 ? "wt-axis" : "wt-grid"}
					/>
					<Label x={left - 8} y={y(tick) + 4} anchor="end" tone="small">
						{format(tick)}
					</Label>
				</g>
			))}
			{bars.map(({ step, from, to }, i) => {
				const cx = left + slot * (i + 0.5);
				const up = to >= from;
				const barTop = y(Math.max(from, to));
				const barHeight = Math.max(Math.abs(y(from) - y(to)), 1.5);
				const className =
					step.kind === "model"
						? "wt-ghost"
						: step.kind === "total"
							? "wt-chip"
							: up
								? "wt-long-soft"
								: "wt-short-soft";
				const next = bars[i + 1];
				return (
					<m.g
						key={step.id}
						initial={false}
						animate={{ opacity: step.hidden ? 0 : 1 }}
						transition={motion.fade}
					>
						<m.rect
							x={cx - barWidth / 2}
							width={barWidth}
							rx={3}
							className={className}
							initial={false}
							animate={{ y: barTop, height: barHeight }}
							transition={motion.move}
						/>
						{next &&
						!next.step.hidden &&
						(!next.step.kind ||
							next.step.kind === "step" ||
							next.step.kind === "total") ? (
							<path
								d={`M${cx + barWidth / 2} ${y(to)}H${cx + slot - barWidth / 2}`}
								className="wt-grid"
								strokeDasharray="3 3"
							/>
						) : null}
						<m.g
							initial={false}
							animate={{
								y: up ? barTop - 6 : barTop + barHeight + valueSize + 2,
							}}
							transition={motion.move}
						>
							<text
								x={cx}
								textAnchor="middle"
								className={
									step.kind === "total"
										? "wt-accent"
										: step.kind === "model"
											? "wt-small"
											: up
												? "wt-gain"
												: "wt-loss"
								}
								style={{ fontSize: valueSize }}
							>
								{format(step.kind === "step" || !step.kind ? step.value : to)}
							</text>
						</m.g>
						<Label x={cx} y={bottom + 18} anchor="middle" tone="small">
							{step.label}
						</Label>
					</m.g>
				);
			})}
		</g>
	);
}
