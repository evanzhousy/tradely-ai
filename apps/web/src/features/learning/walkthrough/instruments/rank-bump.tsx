import * as m from "motion/react-m";
import { Label, useTeachMotion } from "../stage";

export type RankItem = {
	id: string;
	label: string;
	value: string;
	tone?: "gain" | "loss" | "accent";
	/** Left out of this ranking, with the reason shown in place of a rank. */
	excluded?: string;
};

export type RankColumn = {
	id: string;
	title: string;
	items: readonly RankItem[];
};

const TOP = 34;
const ROW = 40;

export function rankBumpHeight(rows: number) {
	return TOP + rows * ROW;
}

/**
 * The same names ranked side by side under different orders. Lines join each name across
 * columns, so a reordering shows up as crossing lines.
 */
export function RankBump({
	width,
	columns,
	focus,
}: {
	width: number;
	columns: readonly RankColumn[];
	/** The name to highlight across columns. */
	focus?: string;
}) {
	const motion = useTeachMotion();
	const gap = columns.length > 1 ? Math.max(36, width * 0.12) : 0;
	const colWidth = (width - 16 - gap * (columns.length - 1)) / columns.length;
	const colX = (j: number) => 8 + j * (colWidth + gap);
	const rowOf = (column: RankColumn, id: string) => {
		const ranked = column.items.filter((item) => !item.excluded);
		const index = ranked.findIndex((item) => item.id === id);
		if (index >= 0) return index;
		const excluded = column.items.filter((item) => item.excluded);
		const at = excluded.findIndex((item) => item.id === id);
		return at < 0 ? -1 : ranked.length + at;
	};
	const yOf = (row: number) => TOP + row * ROW;
	const ids = [
		...new Set(
			columns.flatMap((column) => column.items.map((item) => item.id)),
		),
	];
	return (
		<g>
			{columns.map((column, j) => (
				<Label key={column.id} x={colX(j) + 4} y={20} tone="muted">
					{column.title}
				</Label>
			))}
			{columns.slice(0, -1).map((column, j) => {
				const next = columns[j + 1];
				return ids.map((id) => {
					const a = rowOf(column, id);
					const b = rowOf(next, id);
					if (a < 0 || b < 0) return null;
					const x1 = colX(j) + colWidth;
					const x2 = colX(j + 1);
					const y1 = yOf(a) + ROW / 2 - 4;
					const y2 = yOf(b) + ROW / 2 - 4;
					const on = id === focus;
					return (
						<m.path
							key={`${column.id}-${id}`}
							className={on ? "wt-bracket" : "wt-axis"}
							fill="none"
							initial={false}
							animate={{
								d: `M${x1} ${y1}C${x1 + gap / 2} ${y1} ${x2 - gap / 2} ${y2} ${x2} ${y2}`,
							}}
							transition={motion.move}
						/>
					);
				});
			})}
			{columns.map((column, j) =>
				column.items.map((item) => {
					const row = rowOf(column, item.id);
					const rank = item.excluded ? "—" : String(row + 1);
					const on = item.id === focus;
					return (
						<m.g
							key={`${column.id}-${item.id}`}
							initial={false}
							animate={{ y: yOf(row), opacity: item.excluded ? 0.5 : 1 }}
							transition={motion.move}
						>
							<rect
								x={colX(j)}
								y={0}
								width={colWidth}
								height={ROW - 8}
								rx={8}
								className={on ? "wt-focus-shape" : "wt-panel-shape"}
							/>
							<Label x={colX(j) + 10} y={21} tone="small">
								{rank}
							</Label>
							<Label x={colX(j) + 28} y={21} tone={on ? "accent" : undefined}>
								{item.label}
							</Label>
							<Label
								x={colX(j) + colWidth - 10}
								y={21}
								anchor="end"
								tone={item.excluded ? "small" : item.tone}
							>
								{item.excluded ?? item.value}
							</Label>
						</m.g>
					);
				}),
			)}
		</g>
	);
}
