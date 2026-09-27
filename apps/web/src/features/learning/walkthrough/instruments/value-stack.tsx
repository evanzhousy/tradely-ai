import * as m from "motion/react-m";
import { usd } from "@/content/world";
import { Label, useTeachMotion } from "../stage";

export type StackPart = {
	id: string;
	label: string;
	/** Cents. */
	value: number;
	kind: "intrinsic" | "time" | "cost" | "gain" | "loss" | "neutral";
};

export type StackRow = {
	id: string;
	label: string;
	parts: readonly StackPart[];
	/** Optional marker, such as the price paid, in cents. */
	marker?: { value: number; label: string };
};

const ROW = 64;

export function stackHeight(rows: number) {
	return 30 + rows * ROW + 16;
}

const kindClass: Record<StackPart["kind"], string> = {
	intrinsic: "wt-long",
	time: "wt-long-soft ev-modeled wt-stack-time",
	cost: "wt-short",
	gain: "wt-long",
	loss: "wt-short",
	neutral: "wt-panel-shape",
};

/**
 * Amounts that add up, as horizontal stacked bars: an option's price as intrinsic value
 * plus time value, or a payoff less a premium. Parts keep their identity between steps.
 */
export function ValueStack({
	width,
	rows,
	max,
	title,
}: {
	width: number;
	rows: readonly StackRow[];
	/** Cents represented by the full bar width. */
	max: number;
	title?: string;
}) {
	const motion = useTeachMotion();
	const labelWidth = width < 520 ? 0 : 128;
	const left = 14 + labelWidth;
	const span = width - left - 90;
	const k = span / max;
	return (
		<g>
			{title ? (
				<Label x={14} y={18} tone="muted">
					{title}
				</Label>
			) : null}
			{rows.map((row, i) => {
				const y = 30 + i * ROW;
				const barY = labelWidth ? y + 8 : y + 22;
				let offset = 0;
				const total = row.parts.reduce((sum, part) => sum + part.value, 0);
				return (
					<g key={row.id}>
						<Label x={14} y={labelWidth ? y + 24 : y + 14}>
							{row.label}
						</Label>
						{row.parts.map((part) => {
							const x = left + offset * k;
							const w = Math.max(part.value, 0) * k;
							offset += Math.max(part.value, 0);
							return (
								<g key={part.id}>
									<m.rect
										y={barY}
										height={24}
										rx={4}
										className={kindClass[part.kind]}
										initial={false}
										animate={{ x, width: w }}
										transition={motion.move}
									/>
									{w > 64 ? (
										<m.text
											y={barY + 16}
											textAnchor="middle"
											className="wt-small wt-on-bar"
											initial={false}
											animate={{ x: x + w / 2 }}
											transition={motion.move}
										>
											{part.label}
										</m.text>
									) : null}
								</g>
							);
						})}
						<Label x={left + offset * k + 8} y={barY + 17}>
							{usd(total)}
						</Label>
						{row.marker ? (
							<g>
								<path
									d={`M${left + row.marker.value * k} ${barY - 6}V${barY + 30}`}
									className="wt-bracket"
								/>
								<Label
									x={left + row.marker.value * k}
									y={barY + 44}
									anchor="middle"
									tone="accent"
								>
									{row.marker.label}
								</Label>
							</g>
						) : null}
					</g>
				);
			})}
		</g>
	);
}
