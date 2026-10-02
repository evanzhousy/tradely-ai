import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { Label, useTeachMotion } from "../stage";

export type TapeColumn = {
	label: string;
	share: number;
	align?: "start" | "end";
};
export type TapeRow = {
	key: string;
	cells: readonly string[];
	muted?: boolean;
};

const ROW = 26;
const HEAD = 44;

export function tapeHeight(maxRows: number) {
	return HEAD + maxRows * ROW + 10;
}

/** Time and sales: newest print on top. Rows slide in; nothing is inferred from them here. */
export function TradeTape({
	x,
	y,
	width,
	title,
	columns,
	rows,
	maxRows = 4,
	empty,
}: {
	x: number;
	y: number;
	width: number;
	title: string;
	columns: readonly TapeColumn[];
	rows: readonly TapeRow[];
	maxRows?: number;
	empty: string;
}) {
	const motion = useTeachMotion();
	const inner = width - 24;
	const starts = columns.reduce<number[]>((all, _column, i) => {
		all.push(i === 0 ? 0 : all[i - 1] + columns[i - 1].share * inner);
		return all;
	}, []);
	const cellX = (i: number) =>
		x +
		12 +
		(columns[i].align === "end"
			? starts[i] + columns[i].share * inner
			: starts[i]);
	const visible = rows.slice(0, maxRows);
	// Rows render in a fixed key order and take their place from `index`: a row that React
	// moves in the DOM never starts its motion, so a reordered row would stay where it was.
	const placed = visible
		.map((row, index) => ({ row, index }))
		.sort((a, b) =>
			a.row.key < b.row.key ? -1 : a.row.key > b.row.key ? 1 : 0,
		);
	return (
		<g>
			<rect
				x={x}
				y={y}
				width={width}
				height={tapeHeight(maxRows)}
				rx={10}
				className="wt-panel-shape"
			/>
			<Label x={x + 12} y={y + 18} tone="muted">
				{title}
			</Label>
			{columns.map((column, i) => (
				<Label
					key={column.label}
					x={cellX(i)}
					y={y + 36}
					anchor={column.align === "end" ? "end" : "start"}
					tone="small"
				>
					{column.label}
				</Label>
			))}
			<path
				d={`M${x + 10} ${y + HEAD - 2}H${x + width - 10}`}
				className="wt-grid"
			/>
			{visible.length === 0 ? (
				<Label x={x + 12} y={y + HEAD + 18} tone="small">
					{empty}
				</Label>
			) : null}
			<AnimatePresence initial={false}>
				{placed.map(({ row, index }) => (
					<m.g
						key={row.key}
						initial={motion.enabled ? { opacity: 0, y: -10 } : false}
						animate={{ opacity: row.muted ? 0.55 : 1, y: index * ROW }}
						exit={{ opacity: 0 }}
						transition={motion.move}
					>
						{row.cells.map((cell, i) => (
							<Label
								key={columns[i].label}
								x={cellX(i)}
								y={y + HEAD + 18}
								anchor={columns[i].align === "end" ? "end" : "start"}
							>
								{cell}
							</Label>
						))}
					</m.g>
				))}
			</AnimatePresence>
		</g>
	);
}
