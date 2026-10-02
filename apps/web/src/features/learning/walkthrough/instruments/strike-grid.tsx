import * as m from "motion/react-m";
import { count } from "@/content/world";
import { Appear, Label, useStage, useTeachMotion } from "../stage";

export type GridRow = {
	id: string;
	label: string;
	/** One value per strike; null when the source sent nothing. */
	values: readonly (number | null)[];
};

const HEAD = 40;
const CELL = 42;

export function strikeGridHeight(rows: number, withSpot: boolean) {
	return HEAD + rows * CELL + (withSpot ? 26 : 6);
}

/**
 * Activity by strike (columns) and expiry (rows). Shade darkens with the value; missing cells
 * are hatched, never drawn as zero. An optional spot line splits in- from out-of-the-money.
 */
export function StrikeGrid({
	width,
	strikes,
	rows,
	max,
	spot,
	spotLabel,
	itmSide = "left",
	focusRows = [],
	focusCell,
	marked = [],
	focusStrikes = [],
	estimated = [],
	min = 0,
	format = count,
	title,
}: {
	width: number;
	strikes: readonly number[];
	rows: readonly GridRow[];
	max: number;
	/** Underlying price in dollars, when moneyness should be shown. */
	spot?: number;
	spotLabel?: string;
	/** Calls are in the money at strikes left of spot. */
	itmSide?: "left" | "right";
	focusRows?: readonly string[];
	focusCell?: { row: string; strike: number };
	/** Further cells to outline, such as each row's peak or every strike that traded. */
	marked?: readonly { row: string; strike: number }[];
	/** Columns to outline, such as one strike read down the expiries. */
	focusStrikes?: readonly number[];
	/** Cells whose value is an interpolated estimate rather than a source value. */
	estimated?: readonly { row: string; strike: number }[];
	/** Shading starts here, so values that are all large still differ. */
	min?: number;
	format?: (value: number) => string;
	title?: string;
}) {
	const motion = useTeachMotion();
	const { hatch } = useStage();
	const labelWidth = width < 520 ? 56 : 84;
	const cellWidth = (width - 16 - labelWidth) / strikes.length;
	const colX = (j: number) => 8 + labelWidth + j * cellWidth;
	const spotX =
		spot === undefined
			? null
			: (() => {
					const j = strikes.findIndex((strike) => strike > spot);
					const index = j < 0 ? strikes.length : j;
					const before = strikes[index - 1];
					const after = strikes[index];
					const fraction =
						before === undefined || after === undefined
							? 0.5
							: (spot - before) / (after - before);
					return colX(index - 1) + cellWidth / 2 + fraction * cellWidth;
				})();
	const bottom = HEAD + rows.length * CELL;
	const band =
		spotX === null
			? null
			: itmSide === "left"
				? { x: colX(0), width: spotX - colX(0) }
				: { x: spotX, width: colX(strikes.length) - spotX };
	return (
		<g>
			{title ? (
				<Label x={8} y={14} tone="muted">
					{title}
				</Label>
			) : null}
			{band ? (
				<m.rect
					y={HEAD - 4}
					height={bottom - HEAD + 4}
					className="wt-long-soft"
					opacity={0.35}
					// The band fades in where it stands; without a starting width it has none to draw.
					initial={motion.enabled ? { opacity: 0, ...band } : false}
					animate={{ opacity: 0.35, ...band }}
					transition={motion.move}
				/>
			) : null}
			{strikes.map((strike, j) => (
				<Label
					key={strike}
					x={colX(j) + cellWidth / 2}
					y={HEAD - 10}
					anchor="middle"
					tone="small"
				>
					${strike}
				</Label>
			))}
			{rows.map((row, i) => {
				const y = HEAD + i * CELL;
				const rowFocus = focusRows.includes(row.id);
				return (
					<g key={row.id}>
						{rowFocus ? (
							<Appear>
								<rect
									x={4}
									y={y - 2}
									width={width - 8}
									height={CELL}
									rx={8}
									className="wt-focus-shape"
									opacity={0.6}
								/>
							</Appear>
						) : null}
						<Label
							x={8}
							y={y + CELL / 2 + 4}
							tone={rowFocus ? "accent" : "muted"}
						>
							{row.label}
						</Label>
						{row.values.map((value, j) => {
							const x = colX(j) + 2;
							const focus =
								(focusCell?.row === row.id &&
									focusCell.strike === strikes[j]) ||
								marked.some(
									(cell) => cell.row === row.id && cell.strike === strikes[j],
								);
							const estimate = estimated.some(
								(cell) => cell.row === row.id && cell.strike === strikes[j],
							);
							return (
								<g key={strikes[j]}>
									<rect
										x={x}
										y={y + 3}
										width={cellWidth - 4}
										height={CELL - 8}
										rx={5}
										className="wt-panel-shape"
										style={value === null ? { fill: hatch } : undefined}
									/>
									{estimate ? (
										<Appear>
											<rect
												x={x + 1}
												y={y + 4}
												width={cellWidth - 6}
												height={CELL - 10}
												rx={5}
												className="wt-ghost"
											/>
										</Appear>
									) : value !== null && value > min ? (
										<m.rect
											x={x}
											y={y + 3}
											width={cellWidth - 4}
											height={CELL - 8}
											rx={5}
											className="wt-chip"
											initial={false}
											animate={{
												opacity:
													0.12 +
													0.78 * Math.min((value - min) / (max - min), 1),
											}}
											transition={motion.fade}
										/>
									) : null}
									{focus ? (
										<Appear>
											<rect
												x={x - 2}
												y={y + 1}
												width={cellWidth}
												height={CELL - 4}
												rx={6}
												className="wt-bracket"
											/>
										</Appear>
									) : null}
									<Label
										x={x + (cellWidth - 4) / 2}
										y={y + CELL / 2 + 3}
										anchor="middle"
										tone={value === null ? "accent" : undefined}
										className="wt-halo"
									>
										{value === null
											? "?"
											: estimate
												? `≈${format(value)}`
												: format(value)}
									</Label>
								</g>
							);
						})}
					</g>
				);
			})}
			{focusStrikes.map((strike) => {
				const j = strikes.indexOf(strike);
				return j < 0 ? null : (
					<Appear key={strike}>
						<rect
							x={colX(j)}
							y={HEAD - 2}
							width={cellWidth}
							height={bottom - HEAD}
							rx={7}
							className="wt-bracket"
						/>
					</Appear>
				);
			})}
			{spotX !== null ? (
				<m.g initial={false} animate={{ x: spotX }} transition={motion.move}>
					<path d={`M0 ${HEAD - 4}V${bottom + 4}`} className="wt-bracket" />
					<Label x={0} y={bottom + 20} anchor="middle" tone="accent">
						{spotLabel}
					</Label>
				</m.g>
			) : null}
		</g>
	);
}
