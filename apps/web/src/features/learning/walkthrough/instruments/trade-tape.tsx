import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { Label, useTeachMotion } from "../stage";
import { textWidth, twoRows } from "../text-measure";

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
/** A stacked row: its first cell on one line, the rest on a second line under it. */
const STACKED_ROW = 41;
const STACKED_LINE = 15;
const HEAD = 44;
const TITLE_LINE = 15;
const TITLE_SIZE = 12;
const CELL_SIZE = 13;

/**
 * The title's lines in a tape `width` wide: one when it fits, else two, broken at a " · "
 * where it has one, so each part stays whole.
 */
export function tapeTitle(title: string, width: number): string[] {
	const room = width - 24;
	if (textWidth(title, TITLE_SIZE) <= room) return [title];
	const parts = title.split(" · ");
	for (let i = parts.length - 1; i > 0; i--) {
		const head = parts.slice(0, i).join(" · ");
		if (textWidth(head, TITLE_SIZE) <= room)
			return [head, parts.slice(i).join(" · ")];
	}
	return twoRows(title, room, TITLE_SIZE);
}

/** Height of a tape of `maxRows` rows whose title takes `titleLines` lines. */
export function tapeHeight(maxRows: number, titleLines = 1, stacked = false) {
	return (
		HEAD +
		(titleLines - 1) * TITLE_LINE +
		maxRows * (stacked ? STACKED_ROW : ROW) +
		10
	);
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
	stacked = false,
}: {
	x: number;
	y: number;
	width: number;
	title: string;
	columns: readonly TapeColumn[];
	rows: readonly TapeRow[];
	maxRows?: number;
	empty: string;
	/** Each row's first cell takes a line of its own, for long names on a phone. */
	stacked?: boolean;
}) {
	const motion = useTeachMotion();
	const inner = width - 24;
	const titleLines = tapeTitle(title, width);
	const head = HEAD + (titleLines.length - 1) * TITLE_LINE;
	const rowHeight = stacked ? STACKED_ROW : ROW;
	// Columns share a line's width: all of them, or when stacked the first alone and the
	// rest on the line under it.
	const lineOf = (i: number) => (stacked && i > 0 ? 1 : 0);
	const sameLine = (i: number) =>
		columns.flatMap((_column, j) => (lineOf(j) === lineOf(i) ? [j] : []));
	const shareOf = (i: number) =>
		columns[i].share /
		sameLine(i).reduce((sum, j) => sum + columns[j].share, 0);
	const startOf = (i: number) =>
		sameLine(i)
			.filter((j) => j < i)
			.reduce((sum, j) => sum + shareOf(j) * inner, 0);
	const cellX = (i: number) =>
		x +
		12 +
		(columns[i].align === "end" ? startOf(i) + shareOf(i) * inner : startOf(i));
	// A cell may run into its neighbour's column where the neighbour's text, aligned to the
	// far side, leaves it empty: a long name beside a short value keeps its full size.
	const room = (cells: readonly string[], i: number) => {
		const own = shareOf(i) * inner - 8;
		const end = columns[i].align === "end";
		const n = end ? i - 1 : i + 1;
		const next = columns[n];
		if (!next || lineOf(n) !== lineOf(i) || (next.align === "end") === end)
			return own;
		const spare = shareOf(n) * inner - textWidth(cells[n] ?? "", CELL_SIZE) - 8;
		return own + Math.max(0, spare);
	};
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
				height={tapeHeight(maxRows, titleLines.length, stacked)}
				rx={10}
				className="wt-panel-shape"
			/>
			{titleLines.map((line, i) => (
				<Label key={line} x={x + 12} y={y + 18 + i * TITLE_LINE} tone="muted">
					{line}
				</Label>
			))}
			{columns.map((column, i) => (
				<Label
					key={column.label}
					x={cellX(i)}
					y={y + head - 8}
					anchor={column.align === "end" ? "end" : "start"}
					tone="small"
				>
					{column.label}
				</Label>
			))}
			<path
				d={`M${x + 10} ${y + head - 2}H${x + width - 10}`}
				className="wt-grid"
			/>
			{visible.length === 0 ? (
				<Label x={x + 12} y={y + head + 18} tone="small">
					{empty}
				</Label>
			) : null}
			<AnimatePresence initial={false}>
				{placed.map(({ row, index }) => (
					<m.g
						key={row.key}
						initial={motion.enabled ? { opacity: 0, y: -10 } : false}
						animate={{ opacity: row.muted ? 0.55 : 1, y: index * rowHeight }}
						exit={{ opacity: 0 }}
						transition={motion.move}
					>
						{row.cells.map((cell, i) => (
							<Label
								key={columns[i].label}
								x={cellX(i)}
								y={y + head + 18 + lineOf(i) * STACKED_LINE}
								anchor={columns[i].align === "end" ? "end" : "start"}
								maxWidth={room(row.cells, i)}
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
