import type { Copy } from "@/content/world";
import {
	type TapeColumn,
	type TapeRow,
	TradeTape,
	tapeHeight,
} from "../walkthrough/instruments/trade-tape";
import { Label } from "../walkthrough/stage";

/** Checkpoints happen on a day the lessons never showed: two weeks on, ALFA near $104. */
export const CHECKPOINT_DATE = "2030-10-02";
export const CHECKPOINT_DAY: Copy = ["Wed Oct 2", "10月2日 周三"];
/** ALFA's mid that morning, in cents. */
export const CHECKPOINT_ALFA = 10_413;

export type SheetLine = {
	text: string;
	tone?: "gain" | "loss" | "accent" | "strong";
};

const LINE = 20;

/** Height of a sheet with `rows` table rows and `lines` lines of working under it. */
export const sheetHeight = (rows: number, lines: number) =>
	4 + tapeHeight(rows) + 12 + lines * LINE;

/**
 * A checkpoint's evidence: a table of records, then the working, one line at a time.
 * Lines without a tone are small; the result line carries one.
 */
export function CaseSheet({
	width,
	title,
	columns,
	rows,
	maxRows,
	lines,
	empty = "",
}: {
	width: number;
	title: string;
	columns: readonly TapeColumn[];
	rows: readonly TapeRow[];
	maxRows: number;
	lines: readonly SheetLine[];
	empty?: string;
}) {
	const top = 4 + tapeHeight(maxRows) + 12;
	return (
		<g>
			<TradeTape
				x={8}
				y={4}
				width={width - 16}
				title={title}
				columns={columns}
				rows={rows}
				maxRows={maxRows}
				empty={empty}
			/>
			{lines.map((line, i) => (
				<Label
					key={line.text}
					x={14}
					y={top + 14 + i * LINE}
					maxWidth={width - 28}
					tone={
						line.tone === "strong"
							? undefined
							: line.tone === undefined
								? "small"
								: line.tone
					}
				>
					{line.text}
				</Label>
			))}
		</g>
	);
}
