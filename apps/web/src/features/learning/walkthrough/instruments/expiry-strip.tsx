import * as m from "motion/react-m";
import { count, signedCount } from "@/content/world";
import { Label, useTeachMotion } from "../stage";

export type StripColumn = {
	key: string;
	label: string;
	days: number;
	value: number;
	member: boolean;
	/** Change in the same series since the previous date, when compared. */
	change?: number;
};

export const STRIP_HEIGHT = 250;

/**
 * Expiries left to right, each with its open interest. A bracket marks the expiries inside a
 * days-to-expiry bucket; as dates pass, the bracket keeps its days but covers new expiries.
 */
export function ExpiryStrip({
	x,
	y,
	width,
	columns,
	maxValue,
	bucketLabel,
	daysLabel,
}: {
	x: number;
	y: number;
	width: number;
	columns: readonly StripColumn[];
	maxValue: number;
	bucketLabel: string;
	daysLabel: (days: number) => string;
}) {
	const motion = useTeachMotion();
	const step = width / columns.length;
	const barWidth = Math.min(46, step * 0.5);
	const base = y + 190;
	const tall = 120;
	const centerOf = (i: number) => x + step * i + step / 2;
	const members = columns
		.map((column, i) => (column.member ? i : -1))
		.filter((i) => i >= 0);
	const first = members.length ? centerOf(members[0]) - step / 2 + 6 : x;
	const last = members.length
		? centerOf(members[members.length - 1]) + step / 2 - 6
		: x;
	return (
		<g>
			{members.length ? (
				<g>
					<m.path
						initial={false}
						animate={{
							d: `M${first} ${y + 30}V${y + 22}H${last}V${y + 30}`,
						}}
						transition={motion.move}
						className="wt-bracket"
					/>
					<m.text
						initial={false}
						animate={{ x: (first + last) / 2 }}
						transition={motion.move}
						y={y + 14}
						textAnchor="middle"
						className="wt-accent"
					>
						{bucketLabel}
					</m.text>
				</g>
			) : null}
			<path d={`M${x} ${base}H${x + width}`} className="wt-axis" />
			{columns.map((column, i) => {
				const height = (column.value / maxValue) * tall;
				const cx = centerOf(i);
				return (
					<g key={column.key}>
						<Label x={cx} y={y + 50} anchor="middle" tone="muted">
							{column.label}
						</Label>
						<m.rect
							x={cx - barWidth / 2}
							width={barWidth}
							rx={4}
							className={column.member ? "wt-focus-shape" : "wt-panel-shape"}
							initial={false}
							animate={{ y: base - height, height }}
							transition={motion.move}
						/>
						<m.text
							x={cx}
							textAnchor="middle"
							initial={false}
							animate={{ y: base - height - 8 }}
							transition={motion.move}
						>
							{count(column.value)}
						</m.text>
						{column.change !== undefined ? (
							<Label x={cx} y={y + 68} anchor="middle" tone="accent">
								{signedCount(column.change)}
							</Label>
						) : null}
						<Label
							x={cx}
							y={base + 20}
							anchor="middle"
							tone={column.member ? "accent" : "small"}
						>
							{daysLabel(column.days)}
						</Label>
					</g>
				);
			})}
		</g>
	);
}
