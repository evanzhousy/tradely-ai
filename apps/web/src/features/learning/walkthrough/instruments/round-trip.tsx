import * as m from "motion/react-m";
import { count, usd } from "@/content/world";
import { Label, useTeachMotion } from "../stage";
import { textWidth } from "../text-measure";

export const ROUND_TRIP_HEIGHT = 250;

/**
 * Buying at the ask and selling straight back at the bid: the spread and fees are lost
 * before the price moves. Cents per share for prices; the fee is per contract per trade.
 */
export function RoundTrip({
	width,
	bid,
	ask,
	contracts,
	fee,
	labels,
}: {
	width: number;
	bid: number;
	ask: number;
	contracts: number;
	fee: number;
	labels: {
		title: string;
		bid: string;
		ask: string;
		spread: string;
		action: string;
		back: string;
		lost: string;
		share: (percent: string) => string;
	};
}) {
	const motion = useTeachMotion();
	const shares = contracts * 100;
	const fees = fee * contracts;
	const paid = ask * shares + fees;
	const back = bid * shares - fees;
	const lost = paid - back;
	const low = Math.min(bid, 180) - 20;
	const high = Math.max(ask, 440) + 20;
	const x = (cents: number) =>
		20 + ((cents - low) / (high - low)) * (width - 40);
	const barLeft = 16;
	const barWidth = width - 32;
	const split = barLeft + (back / paid) * barWidth;
	return (
		<g>
			<Label x={16} y={20} tone="muted">
				{labels.title}
			</Label>
			<path d={`M16 64H${width - 16}`} className="wt-axis" />
			<m.rect
				y={52}
				height={24}
				rx={4}
				className="wt-short-soft"
				initial={false}
				animate={{ x: x(bid), width: x(ask) - x(bid) }}
				transition={motion.move}
			/>
			{[
				{
					id: "bid",
					cents: bid,
					label: labels.bid,
					anchor: "end" as const,
					dx: -12,
				},
				{
					id: "ask",
					cents: ask,
					label: labels.ask,
					anchor: "start" as const,
					dx: 12,
				},
			].map((mark) => {
				const text = `${mark.label} ${usd(mark.cents)}`;
				const beside = x(mark.cents) + mark.dx;
				const room = mark.anchor === "end" ? beside - 4 : width - 4 - beside;
				// Above the axis, never on it: beside its dot, outward, or against the stage's edge
				// when the dot is too close to it. Bid and ask then never meet in the middle.
				const place =
					textWidth(text, 12) <= room
						? { x: beside, y: 44, anchor: mark.anchor }
						: mark.anchor === "end"
							? { x: 4, y: 44, anchor: "start" as const }
							: { x: width - 4, y: 44, anchor: "end" as const };
				return (
					<g key={mark.id}>
						<m.circle
							cy={64}
							r={7}
							className="wt-panel-shape"
							stroke="var(--foreground)"
							strokeWidth={2}
							initial={false}
							animate={{ cx: x(mark.cents) }}
							transition={motion.move}
						/>
						<m.text
							textAnchor={place.anchor}
							className="wt-muted"
							initial={false}
							animate={{ x: place.x, y: place.y }}
							transition={motion.move}
						>
							{text}
						</m.text>
					</g>
				);
			})}
			<m.text
				y={100}
				textAnchor="middle"
				className="wt-small"
				initial={false}
				animate={{ x: (x(bid) + x(ask)) / 2 }}
				transition={motion.move}
			>
				{labels.spread} {usd(ask - bid)}
			</m.text>
			<Label x={width / 2} y={138} anchor="middle" tone="muted">
				{labels.action} · {count(contracts)}
			</Label>
			<rect
				x={barLeft}
				y={150}
				width={barWidth}
				height={32}
				rx={6}
				className="wt-panel-shape"
			/>
			<m.rect
				y={150}
				height={32}
				className="wt-short"
				initial={false}
				animate={{ x: split, width: barLeft + barWidth - split }}
				transition={motion.move}
			/>
			<Label x={barLeft} y={206}>
				{labels.back} {usd(back)}
			</Label>
			<Label x={barLeft + barWidth} y={206} anchor="end" tone="strong">
				{labels.lost} {usd(lost)}
			</Label>
			<Label x={width / 2} y={236} anchor="middle" tone="muted">
				{labels.share(`${((lost / (ask * shares)) * 100).toFixed(1)}%`)}
			</Label>
		</g>
	);
}
