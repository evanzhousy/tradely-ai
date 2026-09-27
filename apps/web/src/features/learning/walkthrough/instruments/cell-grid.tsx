import * as m from "motion/react-m";
import { Label, useTeachMotion } from "../stage";

export type GridLine = {
	text: string;
	tone?: "strong" | "muted" | "small" | "gain" | "loss" | "accent";
};

const CELL = 92;
const GAP = 10;
const TOP = 32;

export function cellGridLayout(width: number, rows: number) {
	const narrow = width < 520;
	const labelWidth = narrow ? 0 : 64;
	const rowLabel = narrow ? 22 : 0;
	const cellWidth = (width - 16 - labelWidth - GAP) / 2;
	return {
		narrow,
		cellWidth,
		colX: (j: number) => 8 + labelWidth + j * (cellWidth + GAP),
		rowY: (i: number) => TOP + i * (rowLabel + CELL + GAP) + rowLabel,
		height: TOP + rows * (rowLabel + CELL + GAP) - GAP + 4,
	};
}

/**
 * A two-column grid of cases, such as call or put against buying or selling. The active
 * cell is outlined and the rest dim, so one combination is read at a time.
 */
export function CellGrid({
	width,
	columns,
	rows,
	cells,
	active,
}: {
	width: number;
	columns: readonly [string, string];
	/** Row labels; on narrow screens they sit above each row. */
	rows: readonly { short: string; long: string }[];
	/** cells[row][column]; lines are drawn top to bottom. */
	cells: readonly (readonly [readonly GridLine[], readonly GridLine[]])[];
	active: readonly [number, number] | null;
}) {
	const motion = useTeachMotion();
	const layout = cellGridLayout(width, rows.length);
	return (
		<g>
			{columns.map((column, j) => (
				<Label
					key={column}
					x={layout.colX(j) + layout.cellWidth / 2}
					y={18}
					anchor="middle"
					tone="muted"
				>
					{column}
				</Label>
			))}
			{rows.map((row, i) => (
				<Label
					key={row.long}
					x={8}
					y={layout.narrow ? layout.rowY(i) - 8 : layout.rowY(i) + CELL / 2 + 5}
					tone={layout.narrow ? "small" : "muted"}
				>
					{layout.narrow ? row.long : row.short}
				</Label>
			))}
			{cells.map((pair, i) =>
				pair.map((lines, j) => {
					const x = layout.colX(j);
					const y = layout.rowY(i);
					const on = active !== null && active[0] === i && active[1] === j;
					return (
						<m.g
							key={`${rows[i].long}-${columns[j]}`}
							initial={false}
							animate={{ opacity: active === null || on ? 1 : 0.5 }}
							transition={motion.fade}
						>
							<rect
								x={x}
								y={y}
								width={layout.cellWidth}
								height={CELL}
								rx={12}
								className={on ? "wt-focus-shape" : "wt-panel-shape"}
							/>
							{lines.map((line, k) => (
								<Label
									key={line.text}
									x={x + 14}
									y={y + 28 + k * 22}
									tone={line.tone}
								>
									{line.text}
								</Label>
							))}
						</m.g>
					);
				}),
			)}
		</g>
	);
}
