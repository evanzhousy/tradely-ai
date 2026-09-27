import * as m from "motion/react-m";
import { usd } from "@/content/world";
import { Label, useTeachMotion } from "../stage";

export type ChainRow = {
	strike: number;
	call: { bid: number; ask: number };
	put: { bid: number; ask: number };
};

const HEAD = 70;
const ROW = 34;

export function chainHeight(rows: number) {
	return HEAD + rows * ROW + 12;
}

/**
 * An option chain for one expiry: calls on the left, puts on the right, strikes down the
 * middle. In-the-money cells are shaded; the selected contract is outlined.
 */
export function ChainGrid({
	width,
	expiries,
	expiry,
	rows,
	spot,
	selected,
	labels,
}: {
	width: number;
	expiries: readonly { id: string; label: string }[];
	expiry: string;
	rows: readonly ChainRow[];
	/** Dollars; cells in the money relative to it are shaded. */
	spot: number;
	selected?: { strike: number; right: "call" | "put" };
	labels: { calls: string; puts: string; strike: string };
}) {
	const motion = useTeachMotion();
	const tabWidth = Math.min(96, (width - 16) / expiries.length - 6);
	const center = width / 2;
	const strikeWidth = 70;
	const cellWidth = (width - 16 - strikeWidth) / 2 - 6;
	const callX = 8;
	const putX = center + strikeWidth / 2 + 6;
	const rowY = (i: number) => HEAD + i * ROW;
	const selectedIndex = selected
		? rows.findIndex((row) => row.strike === selected.strike)
		: -1;
	return (
		<g>
			{expiries.map((item, i) => {
				const active = item.id === expiry;
				const x = 8 + i * (tabWidth + 6);
				return (
					<g key={item.id}>
						<rect
							x={x}
							y={4}
							width={tabWidth}
							height={26}
							rx={13}
							className={active ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						<Label
							x={x + tabWidth / 2}
							y={21}
							anchor="middle"
							tone={active ? "accent" : "small"}
						>
							{item.label}
						</Label>
					</g>
				);
			})}
			<Label x={callX + cellWidth / 2} y={56} anchor="middle" tone="muted">
				{labels.calls}
			</Label>
			<Label x={center} y={56} anchor="middle" tone="muted">
				{labels.strike}
			</Label>
			<Label x={putX + cellWidth / 2} y={56} anchor="middle" tone="muted">
				{labels.puts}
			</Label>
			{rows.map((row, i) => {
				const y = rowY(i);
				const callIn = row.strike < spot;
				const putIn = row.strike > spot;
				return (
					<g key={row.strike}>
						<rect
							x={callX}
							y={y + 3}
							width={cellWidth}
							height={ROW - 6}
							rx={6}
							className={callIn ? "wt-long-soft" : "wt-panel-shape"}
							opacity={callIn ? 0.6 : 1}
						/>
						<rect
							x={putX}
							y={y + 3}
							width={cellWidth}
							height={ROW - 6}
							rx={6}
							className={putIn ? "wt-short-soft" : "wt-panel-shape"}
							opacity={putIn ? 0.6 : 1}
						/>
						<Label
							x={callX + cellWidth / 2}
							y={y + ROW / 2 + 4.5}
							anchor="middle"
						>
							{usd(row.call.bid)} / {usd(row.call.ask)}
						</Label>
						<Label
							x={center}
							y={y + ROW / 2 + 4.5}
							anchor="middle"
							tone="strong"
						>
							{row.strike}
						</Label>
						<Label
							x={putX + cellWidth / 2}
							y={y + ROW / 2 + 4.5}
							anchor="middle"
						>
							{usd(row.put.bid)} / {usd(row.put.ask)}
						</Label>
					</g>
				);
			})}
			{selected && selectedIndex >= 0 ? (
				<m.rect
					width={cellWidth + 4}
					height={ROW - 2}
					rx={8}
					className="wt-bracket"
					initial={false}
					animate={{
						x: (selected.right === "call" ? callX : putX) - 2,
						y: rowY(selectedIndex) + 1,
					}}
					transition={motion.move}
				/>
			) : null}
			<path
				d={`M${center - strikeWidth / 2 + 4} ${HEAD - 6}V${HEAD + rows.length * ROW}`}
				className="wt-grid"
			/>
			<path
				d={`M${center + strikeWidth / 2 - 4} ${HEAD - 6}V${HEAD + rows.length * ROW}`}
				className="wt-grid"
			/>
		</g>
	);
}
