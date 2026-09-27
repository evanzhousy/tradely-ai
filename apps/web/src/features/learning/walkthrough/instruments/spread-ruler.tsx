import * as m from "motion/react-m";
import { type SideCode, sideCode, usd } from "@/content/world";
import { Label, useStage, useTeachMotion } from "../stage";

export const SPREAD_RULER_HEIGHT = 152;

const zoneOrder: readonly SideCode[] = ["BBID", "BID", "MID", "ASK", "AASK"];

/**
 * One print against its quote: the bid and ask split the price axis into five locations,
 * and the print lands in one of them. Without a usable quote the axis is hatched.
 */
export function SpreadRuler({
	width,
	min,
	max,
	bid,
	ask,
	price,
	printLabel,
	title,
	bidLabel,
	askLabel,
	unusable,
}: {
	width: number;
	/** Cents. */
	min: number;
	max: number;
	bid: number | null;
	ask: number | null;
	price: number;
	printLabel: string;
	title?: string;
	bidLabel: string;
	askLabel: string;
	/** Why the quote can't be used, if it can't; the location is then withheld. */
	unusable?: string;
}) {
	const motion = useTeachMotion();
	const { hatch } = useStage();
	const left = 18;
	const right = width - 18;
	const x = (cents: number) =>
		left +
		((Math.min(Math.max(cents, min), max) - min) / (max - min)) *
			(right - left);
	const axis = 84;
	const code = unusable ? null : sideCode(price, bid, ask);
	const zones =
		bid !== null && ask !== null && ask > bid
			? {
					BBID: [x(min), x(bid) - 3],
					BID: [x(bid) - 3, x(bid) + 3],
					MID: [x(bid) + 3, x(ask) - 3],
					ASK: [x(ask) - 3, x(ask) + 3],
					AASK: [x(ask) + 3, x(max)],
				}
			: null;
	return (
		<g>
			{title ? (
				<Label x={left} y={16} tone="muted">
					{title}
				</Label>
			) : null}
			{zones && !unusable ? (
				zoneOrder.map((zone) => {
					const [from, to] = zones[zone];
					const active = code === zone;
					const point = zone === "BID" || zone === "ASK";
					return (
						<m.g key={zone} initial={false} animate={{ opacity: 1 }}>
							<m.rect
								y={axis - 26}
								height={26}
								rx={point ? 2 : 6}
								className={active ? "wt-focus-shape" : "wt-panel-shape"}
								initial={false}
								animate={{ x: from, width: Math.max(to - from, 2) }}
								transition={motion.move}
							/>
							{point ? (
								active ? (
									<Label
										x={(from + to) / 2}
										y={axis - 32}
										anchor="middle"
										tone="accent"
										className="wt-halo"
									>
										{zone}
									</Label>
								) : null
							) : (
								<m.text
									y={axis - 9}
									textAnchor="middle"
									className={active ? "wt-accent" : "wt-small"}
									initial={false}
									animate={{ x: (from + to) / 2 }}
									transition={motion.move}
								>
									{zone}
								</m.text>
							)}
						</m.g>
					);
				})
			) : (
				<g>
					<rect
						x={left}
						y={axis - 26}
						width={right - left}
						height={26}
						rx={6}
						className="wt-panel-shape"
						style={{ fill: hatch }}
					/>
					<Label
						x={(left + right) / 2}
						y={axis - 9}
						anchor="middle"
						tone="accent"
						className="wt-halo"
					>
						{unusable ?? "?"}
					</Label>
				</g>
			)}
			<path d={`M${left} ${axis}H${right}`} className="wt-axis" />
			{bid !== null ? (
				<m.g initial={false} animate={{ x: x(bid) }} transition={motion.move}>
					<path d={`M0 ${axis - 30}V${axis + 6}`} className="wt-line-long" />
					<Label x={0} y={axis + 22} anchor="end" tone="small">
						{bidLabel}
					</Label>
					<Label x={0} y={axis + 36} anchor="end">
						{usd(bid)}
					</Label>
				</m.g>
			) : null}
			{ask !== null ? (
				<m.g initial={false} animate={{ x: x(ask) }} transition={motion.move}>
					<path d={`M0 ${axis - 30}V${axis + 6}`} className="wt-line-short" />
					<Label x={0} y={axis + 22} tone="small">
						{askLabel}
					</Label>
					<Label x={0} y={axis + 36}>
						{usd(ask)}
					</Label>
				</m.g>
			) : null}
			<m.g initial={false} animate={{ x: x(price) }} transition={motion.move}>
				<circle
					cy={axis}
					r={7}
					className="wt-chip"
					stroke="var(--foreground)"
					strokeWidth={1.5}
				/>
				<path d={`M0 ${axis + 8}V${axis + 44}`} className="wt-bracket" />
				<Label
					x={0}
					y={axis + 58}
					anchor="middle"
					tone="accent"
					className="wt-halo"
				>
					{printLabel}
				</Label>
			</m.g>
		</g>
	);
}
