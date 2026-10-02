import type { Copy } from "@/content/world";
import {
	type TapeColumn,
	type TapeRow,
	TradeTape,
	tapeHeight,
	tapeTitle,
} from "../walkthrough/instruments/trade-tape";
import { Working, workingHeight } from "../walkthrough/instruments/working";
import { Stage } from "../walkthrough/stage";

/** Checkpoints happen on a day the lessons never showed: two weeks on, ALFA near $104. */
export const CHECKPOINT_DATE = "2030-10-02";
export const CHECKPOINT_DAY: Copy = ["Wed Oct 2", "10月2日 周三"];
/** ALFA's mid that morning, in cents. */
export const CHECKPOINT_ALFA = 10_413;

export type SheetLine = {
	text: string;
	tone?: "gain" | "loss" | "accent" | "strong";
};

/** Where the working starts under the table. */
const linesTop = (
	width: number,
	title: string,
	rows: number,
	stacked: boolean,
) => 4 + tapeHeight(rows, tapeTitle(title, width - 16).length, stacked) + 12;

/**
 * A checkpoint's evidence: a table of records, then the working, one line at a time.
 * Lines without a tone are small; the result line carries one.
 */
function CaseSheet({
	width,
	title,
	columns,
	rows,
	maxRows,
	lines,
	empty = "",
	stacked,
}: {
	width: number;
	title: string;
	columns: readonly TapeColumn[];
	rows: readonly TapeRow[];
	maxRows: number;
	lines: readonly SheetLine[];
	empty?: string;
	stacked: boolean;
}) {
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
				stacked={stacked}
			/>
			<Working
				x={14}
				y={linesTop(width, title, maxRows, stacked)}
				width={width - 28}
				lines={lines.map((line) => ({
					text: line.text,
					tone:
						line.tone === "strong"
							? undefined
							: line.tone === undefined
								? "small"
								: line.tone,
				}))}
			/>
		</g>
	);
}

type ByWidth<T> = T | ((width: number) => T);
const atWidth = <T,>(value: ByWidth<T>, width: number) =>
	typeof value === "function" ? (value as (width: number) => T)(width) : value;

/** A checkpoint's stage: the case sheet, drawn at a height that holds its fullest step. */
export function SheetStage({
	label,
	lineSlots,
	columns,
	rows,
	stackOnPhone = false,
	...sheet
}: {
	label: string;
	/** The most lines of working any step shows. */
	lineSlots: number;
	/** On a phone each record's name takes a line of its own, its values under it. */
	stackOnPhone?: boolean;
	title: string;
	columns: ByWidth<readonly TapeColumn[]>;
	rows: ByWidth<readonly TapeRow[]>;
	maxRows: number;
	lines: readonly SheetLine[];
	empty?: string;
}) {
	const stacks = (width: number) => stackOnPhone && width < 520;
	return (
		<Stage
			label={label}
			height={(width) =>
				linesTop(width, sheet.title, sheet.maxRows, stacks(width)) +
				workingHeight(width, lineSlots)
			}
		>
			{(width) => (
				<CaseSheet
					width={width}
					columns={atWidth(columns, width)}
					rows={atWidth(rows, width)}
					stacked={stacks(width)}
					{...sheet}
				/>
			)}
		</Stage>
	);
}
