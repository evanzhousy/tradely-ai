import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { Label, useTeachMotion } from "../stage";

export type TimelineEvent = {
	id: string;
	/** Minutes on the timeline's own clock. */
	at: number;
	label: string;
	sub?: string;
	/** Highlighted events are drawn in the accent colour. */
	active?: boolean;
};

export const TIMELINE_HEIGHT = 140;

/** Events on one clock: each observation belongs to a time, marked on a single axis. */
export function Timeline({
	width,
	start,
	end,
	ticks,
	events,
	cursor,
}: {
	width: number;
	start: number;
	end: number;
	ticks: readonly { at: number; label: string }[];
	events: readonly TimelineEvent[];
	cursor?: { at: number; label: string };
}) {
	const motion = useTeachMotion();
	const left = 24;
	const right = width - 24;
	const x = (at: number) =>
		left + ((at - start) / (end - start)) * (right - left);
	const axis = 92;
	return (
		<g>
			<path
				d={`M${left} ${axis}H${right}`}
				className="wt-axis"
				strokeWidth={2}
			/>
			{ticks.map((tick) => (
				<g key={tick.at}>
					<path
						d={`M${x(tick.at)} ${axis - 4}V${axis + 4}`}
						className="wt-axis"
					/>
					<Label x={x(tick.at)} y={axis + 22} anchor="middle" tone="small">
						{tick.label}
					</Label>
				</g>
			))}
			<AnimatePresence initial={false}>
				{events.map((event) => {
					const ex = Math.min(Math.max(x(event.at), left + 50), right - 50);
					return (
						<m.g
							key={event.id}
							initial={motion.enabled ? { opacity: 0, y: -6 } : false}
							animate={{ opacity: event.active === false ? 0.45 : 1, y: 0 }}
							exit={{ opacity: 0 }}
							transition={motion.fade}
						>
							<circle
								cx={x(event.at)}
								cy={axis}
								r={7}
								className={event.active ? "wt-chip" : "wt-panel-shape"}
								stroke="var(--foreground)"
								strokeWidth={1.5}
							/>
							<Label
								x={ex}
								y={42}
								anchor="middle"
								tone={event.active ? "accent" : undefined}
							>
								{event.label}
							</Label>
							{event.sub ? (
								<Label x={ex} y={62} anchor="middle" tone="small">
									{event.sub}
								</Label>
							) : null}
						</m.g>
					);
				})}
			</AnimatePresence>
			{cursor ? (
				<m.g
					initial={false}
					animate={{ x: x(cursor.at) }}
					transition={motion.move}
				>
					<path d={`M0 ${axis - 16}V${axis + 16}`} className="wt-bracket" />
					<Label x={0} y={axis + 40} anchor="middle" tone="accent">
						{cursor.label}
					</Label>
				</m.g>
			) : null}
		</g>
	);
}
