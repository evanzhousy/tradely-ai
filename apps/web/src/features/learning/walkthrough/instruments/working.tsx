import { Label, useStage } from "../stage";
import { twoRows } from "../text-measure";

export type WorkingLine = {
	text: string;
	/** Label tone; none is the regular size, used for a result. */
	tone?: "small" | "gain" | "loss" | "accent";
};

const LINE = 20;
/** The second row of a wrapped line sits closer, so it reads as the same line. */
const WRAP = 15;
/** On a phone a line may take two rows rather than shrink to fit one. */
const wraps = (stageWidth: number) => stageWidth < 520;

/**
 * Height of room for `lines` lines of working on a stage `stageWidth` wide. On a phone each
 * line keeps room for a second row, so the stage holds one height whichever lines a step shows.
 */
export const workingHeight = (stageWidth: number, lines: number) =>
	lines * (LINE + (wraps(stageWidth) ? WRAP : 0));

/** A line's rows: one, or on a phone two, the second condensing if it still runs long. */
const rowsOf = (line: WorkingLine, width: number, stageWidth: number) => {
	if (!wraps(stageWidth)) return [line.text];
	return twoRows(line.text, width, line.tone === "small" ? 11 : 13);
};

/** Lines of working under a table or chart, from `y` down, `width` wide. */
export function Working({
	x,
	y,
	width,
	lines,
}: {
	x: number;
	y: number;
	width: number;
	lines: readonly WorkingLine[];
}) {
	const { width: stageWidth } = useStage();
	let baseline = y + 14 - LINE;
	const placed = lines.flatMap((line) =>
		rowsOf(line, width, stageWidth).map((text, row) => {
			baseline += row === 0 ? LINE : WRAP;
			return { line, text, row, y: baseline };
		}),
	);
	return (
		<g>
			{placed.map(({ line, text, row, y }) => (
				<Label
					key={`${line.text}-${row}`}
					x={x}
					y={y}
					maxWidth={width}
					tone={line.tone}
				>
					{text}
				</Label>
			))}
		</g>
	);
}
