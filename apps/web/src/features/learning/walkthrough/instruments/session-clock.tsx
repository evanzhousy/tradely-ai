import * as m from "motion/react-m";
import { Label, useTeachMotion } from "../stage";

/** Minutes since Monday 00:00 ET. Tuesday times are 1440 + minutes. */
export type ClockMark = {
	key: string;
	at: number;
	label: string;
	kind: "trade" | "close" | "report";
};

export const MON_OPEN = 570;
export const MON_CLOSE = 960;
export const TUE_REPORT = 1440 + 420;
export const TUE_OPEN = 1440 + 570;

/** Monday's session takes most of the axis; the night is compressed. */
function position(minute: number, left: number, width: number) {
	const session = 0.62 * width;
	const night = 0.16 * width;
	const morning = width - session - night;
	if (minute <= MON_CLOSE)
		return (
			left +
			(Math.max(minute, MON_OPEN) - MON_OPEN) *
				(session / (MON_CLOSE - MON_OPEN))
		);
	if (minute <= TUE_REPORT)
		return (
			left + session + (minute - MON_CLOSE) * (night / (TUE_REPORT - MON_CLOSE))
		);
	return (
		left +
		session +
		night +
		(Math.min(minute, TUE_OPEN) - TUE_REPORT) *
			(morning / (TUE_OPEN - TUE_REPORT))
	);
}

export const CLOCK_HEIGHT = 96;

/**
 * One trading day and the morning after on a single axis, with a "now" cursor. Counts that
 * are published later, like open interest, sit on the axis where they appear.
 */
export function SessionClock({
	x,
	y,
	width,
	now,
	nowLabel,
	marks,
	labels,
}: {
	x: number;
	y: number;
	width: number;
	now: number;
	nowLabel: string;
	marks: readonly ClockMark[];
	labels: { session: string; night: string; morning: string };
}) {
	const motion = useTeachMotion();
	const left = x + 8;
	const span = width - 16;
	const axis = y + 58;
	const at = (minute: number) => position(minute, left, span);
	const cursor = at(now);
	return (
		<g>
			<path
				d={`M${left} ${axis}H${at(MON_CLOSE)}`}
				className="wt-axis"
				strokeWidth={2}
			/>
			<path
				d={`M${at(MON_CLOSE)} ${axis}H${at(TUE_REPORT)}`}
				className="wt-axis"
				strokeDasharray="3 4"
			/>
			<path
				d={`M${at(TUE_REPORT)} ${axis}H${left + span}`}
				className="wt-axis"
				strokeWidth={2}
			/>
			<Label x={left} y={axis + 30} tone="small">
				{labels.session}
			</Label>
			<Label
				x={(at(MON_CLOSE) + at(TUE_REPORT)) / 2}
				y={axis + 30}
				anchor="middle"
				tone="small"
			>
				{labels.night}
			</Label>
			<Label x={left + span} y={axis + 30} anchor="end" tone="small">
				{labels.morning}
			</Label>
			{marks.map((mark) => {
				const markX = at(mark.at);
				const reached = now >= mark.at;
				return (
					<g key={mark.key} opacity={reached ? 1 : 0.45}>
						{mark.kind === "report" ? (
							<path
								d={`M${markX} ${axis - 8}l8 8-8 8-8-8z`}
								className={reached ? "wt-chip" : "wt-ghost"}
							/>
						) : (
							<path
								d={`M${markX} ${axis - (mark.kind === "close" ? 12 : 8)}V${axis + 8}`}
								className="wt-axis"
								strokeWidth={mark.kind === "close" ? 2 : 1.5}
							/>
						)}
						<Label x={markX} y={axis + 18} anchor="middle" tone="small">
							{mark.label}
						</Label>
					</g>
				);
			})}
			<m.g initial={false} animate={{ x: cursor }} transition={motion.move}>
				<path d={`M0 ${y + 18}V${axis}`} className="wt-bracket" />
				<path d={`M-6 ${y + 12}h12l-6 7z`} className="wt-chip" />
				<Label x={0} y={y + 8} anchor="middle" tone="accent">
					{nowLabel}
				</Label>
			</m.g>
		</g>
	);
}
