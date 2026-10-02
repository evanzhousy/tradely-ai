import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { count, signedCount } from "@/content/world";
import { Appear, Label, useTeachMotion } from "../stage";

export type Holding = { long: number; short: number };

export type LedgerRow = {
	id: string;
	name: string;
	/** Contracts held long and written short, both as positive counts. */
	holding: Holding;
	/** The holding before this step's trade; drawn as a dashed ghost when it differs. */
	before?: Holding;
	/** What this holder did in the step, such as "buys 10 · opens". */
	tag?: string;
	/** Aggregates such as "everyone else" are drawn quieter. */
	muted?: boolean;
};

export type LedgerLabels = {
	title: string;
	openInterest: string;
	volume: string;
	short: string;
	long: string;
	equal: string;
};

const PAD = 14;
const TOP = 118;

function geometry(width: number) {
	const narrow = width < 520;
	const nameWidth = narrow ? 0 : Math.min(156, Math.max(112, width * 0.22));
	const left = PAD + nameWidth;
	const right = width - PAD;
	return {
		narrow,
		left,
		right,
		center: (left + right) / 2,
		half: (right - left) / 2 - 40,
		rowHeight: narrow ? 50 : 48,
	};
}

export function ledgerHeight(width: number, rows: number) {
	return TOP + rows * geometry(width).rowHeight + 6;
}

/**
 * Who holds what in one contract. Each holder's written (short) contracts extend left of the
 * center line and held (long) contracts extend right; open interest equals every long, and
 * every short, added up.
 */
export function PositionLedger({
	width,
	rows,
	openInterest,
	openInterestBefore,
	volume,
	volumeBefore,
	scaleMax,
	labels,
}: {
	width: number;
	rows: readonly LedgerRow[];
	openInterest: number;
	openInterestBefore?: number;
	volume: number;
	volumeBefore?: number;
	scaleMax: number;
	labels: LedgerLabels;
}) {
	const motion = useTeachMotion();
	const g = geometry(width);
	const k = g.half / scaleMax;
	const oiDelta =
		openInterestBefore === undefined ? 0 : openInterest - openInterestBefore;
	const volumeDelta = volumeBefore === undefined ? 0 : volume - volumeBefore;
	const bottom = TOP + rows.length * g.rowHeight;
	return (
		<g>
			<Label x={PAD} y={18} tone="muted">
				{labels.openInterest}
			</Label>
			<text x={PAD} y={42}>
				<tspan className="wt-strong">{count(openInterest)}</tspan>
				{oiDelta !== 0 || openInterestBefore !== undefined ? (
					<tspan dx="8" className="wt-accent">
						{oiDelta === 0 ? "±0" : signedCount(oiDelta)}
					</tspan>
				) : null}
			</text>
			<Label x={g.right} y={18} anchor="end" tone="muted">
				{labels.volume}
			</Label>
			<text x={g.right} y={42} textAnchor="end">
				<tspan className="wt-strong">{count(volume)}</tspan>
				{volumeDelta !== 0 ? (
					<tspan dx="8" className="wt-accent">
						{signedCount(volumeDelta)}
					</tspan>
				) : null}
			</text>
			{/* Totals: all shorts on the left, all longs on the right, always equal. */}
			{openInterestBefore !== undefined && oiDelta !== 0 ? (
				<Appear>
					<rect
						x={g.center - openInterestBefore * k}
						y={56}
						width={openInterestBefore * k}
						height={14}
						className="wt-ghost"
					/>
					<rect
						x={g.center}
						y={56}
						width={openInterestBefore * k}
						height={14}
						className="wt-ghost"
					/>
				</Appear>
			) : null}
			<m.rect
				y={56}
				height={14}
				rx={3}
				className="wt-short-soft"
				initial={false}
				animate={{ x: g.center - openInterest * k, width: openInterest * k }}
				transition={motion.move}
			/>
			<m.rect
				x={g.center}
				y={56}
				height={14}
				rx={3}
				className="wt-long-soft"
				initial={false}
				animate={{ width: openInterest * k }}
				transition={motion.move}
			/>
			<Label x={g.center} y={88} anchor="middle" tone="small">
				{labels.equal}
			</Label>
			<Label x={g.center - 8} y={108} anchor="end" tone="small">
				{labels.short}
			</Label>
			<Label x={g.center + 8} y={108} tone="small">
				{labels.long}
			</Label>
			<path d={`M${g.center} ${TOP - 6}V${bottom}`} className="wt-axis" />
			{rows.map((row, i) => (
				<LedgerRowShape
					key={row.id}
					row={row}
					y={TOP + i * g.rowHeight}
					geometry={g}
					scale={k}
				/>
			))}
		</g>
	);
}

function LedgerRowShape({
	row,
	y,
	geometry: g,
	scale: k,
}: {
	row: LedgerRow;
	y: number;
	geometry: ReturnType<typeof geometry>;
	scale: number;
}) {
	const motion = useTeachMotion();
	const barY = g.narrow ? y + 20 : y + 6;
	const barHeight = g.narrow ? 14 : 18;
	const { long, short } = row.holding;
	const before = row.before;
	const longChanged = before && before.long !== long;
	const shortChanged = before && before.short !== short;
	const valueY = barY + barHeight / 2 + 4.5;
	return (
		<g opacity={row.muted ? 0.72 : 1}>
			{g.narrow ? (
				// Across the centre line on a narrow stage; the halo parts it.
				<text x={PAD} y={y + 12} className="wt-halo">
					<tspan>{row.name}</tspan>
					{row.tag ? (
						<tspan dx="8" className="wt-accent">
							{row.tag}
						</tspan>
					) : null}
				</text>
			) : (
				<>
					<Label x={PAD} y={y + 20}>
						{row.name}
					</Label>
					<AnimatePresence>
						{row.tag ? (
							<m.text
								key={row.tag}
								x={PAD}
								y={y + 37}
								className="wt-accent"
								style={{ fontSize: 11 }}
								initial={motion.enabled ? { opacity: 0 } : false}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={motion.after(0.2)}
							>
								{row.tag}
							</m.text>
						) : null}
					</AnimatePresence>
				</>
			)}
			{shortChanged && before ? (
				<Appear>
					<rect
						x={g.center - before.short * k}
						y={barY}
						width={before.short * k}
						height={barHeight}
						className="wt-ghost"
					/>
				</Appear>
			) : null}
			{longChanged && before ? (
				<Appear>
					<rect
						x={g.center}
						y={barY}
						width={before.long * k}
						height={barHeight}
						className="wt-ghost"
					/>
				</Appear>
			) : null}
			<m.rect
				y={barY}
				height={barHeight}
				rx={3}
				className="wt-short"
				initial={false}
				animate={{ x: g.center - short * k, width: short * k }}
				transition={motion.move}
			/>
			<m.rect
				x={g.center}
				y={barY}
				height={barHeight}
				rx={3}
				className="wt-long"
				initial={false}
				animate={{ width: long * k }}
				transition={motion.move}
			/>
			{short > 0 || shortChanged ? (
				<Label
					x={g.center - Math.max(short, before?.short ?? 0) * k - 6}
					y={valueY}
					anchor="end"
				>
					{short > 0 ? `−${count(short)}` : "0"}
				</Label>
			) : null}
			{long > 0 || longChanged ? (
				<Label
					x={g.center + Math.max(long, before?.long ?? 0) * k + 6}
					y={valueY}
				>
					{long > 0 ? `+${count(long)}` : "0"}
				</Label>
			) : null}
			{long === 0 && short === 0 && !longChanged && !shortChanged ? (
				<Label x={g.center + 6} y={valueY} tone="small">
					0
				</Label>
			) : null}
		</g>
	);
}
