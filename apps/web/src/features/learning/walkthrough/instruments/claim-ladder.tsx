import * as m from "motion/react-m";
import { Label, Stage, useStage, useTeachMotion } from "../stage";
import { textWidth, wrapText } from "../text-measure";
import type { EvidenceKind } from "../types";

export type Claim = {
	id: string;
	text: string;
	/** What the claim rests on, or what it would need. */
	basis: string;
	evidence: EvidenceKind;
	/** Rows not reached yet keep their place so later rows don't move. */
	hidden?: boolean;
	focus?: boolean;
};

const TEXT_X = 52;
const TEXT_LINE = 17;
const LINE = 15;
const GAP = 8;

/**
 * Row positions for a width: each claim and note wraps to fit, so rows grow on narrow
 * screens. The title breaks at its " · " separators when it doesn't fit on one line.
 */
export function claimLadderLayout(
	width: number,
	title: string | undefined,
	claims: readonly Claim[],
	evidenceLabels: Record<EvidenceKind, string>,
	/** Other states of the same claims; each row keeps room for its tallest. */
	variants: readonly (readonly Claim[])[] = [],
) {
	const titleLines =
		title && textWidth(title, 12) > width - 16
			? title.split(" · ")
			: title
				? [title]
				: [];
	const wrap = (claim: Claim) => {
		const lines = wrapText(claim.text, width - TEXT_X - 18, 13);
		const notes = wrapText(
			`${evidenceLabels[claim.evidence]} · ${claim.basis}`,
			width - TEXT_X - 18,
			11,
		);
		return {
			lines,
			notes,
			height: 46 + (lines.length - 1) * TEXT_LINE + (notes.length - 1) * LINE,
		};
	};
	let y = titleLines.length ? 14 + titleLines.length * 14 : 4;
	const rows = claims.map((claim) => {
		const { lines, notes, height: own } = wrap(claim);
		const height = Math.max(
			own,
			...variants.flatMap((variant) =>
				variant
					.filter((other) => other.id === claim.id)
					.map((other) => wrap(other).height),
			),
		);
		const row = { y, height, lines, notes };
		y += height + GAP;
		return row;
	});
	return { titleLines, rows, height: y };
}

/** The evidence code: observed solid, calculated with "=", modeled dashed, inferred outlined, unknown hatched. */
function EvidenceMark({
	x,
	y,
	evidence,
}: {
	x: number;
	y: number;
	evidence: EvidenceKind;
}) {
	const { hatch } = useStage();
	const size = 20;
	if (evidence === "unknown")
		return (
			<g>
				<rect
					x={x}
					y={y}
					width={size}
					height={size}
					rx={4}
					className="wt-panel-shape"
					style={{ fill: hatch }}
				/>
				<Label
					x={x + size / 2}
					y={y + 15}
					anchor="middle"
					tone="accent"
					className="wt-halo"
				>
					?
				</Label>
			</g>
		);
	return (
		<g>
			<rect
				x={x}
				y={y}
				width={size}
				height={size}
				rx={4}
				className={`wt-ev-${evidence}`}
			/>
			{evidence === "calculated" ? (
				<Label
					x={x + size / 2}
					y={y + 15}
					anchor="middle"
					className="wt-on-solid"
				>
					=
				</Label>
			) : null}
		</g>
	);
}

/**
 * Claims about one piece of market data, ordered from what it shows directly to what it
 * can't show at all. Each row carries its evidence kind, so the reader sees how far it goes.
 */
export function ClaimLadder({
	width,
	title,
	claims,
	evidenceLabels,
	variants,
}: {
	width: number;
	title?: string;
	claims: readonly Claim[];
	evidenceLabels: Record<EvidenceKind, string>;
	variants?: readonly (readonly Claim[])[];
}) {
	const motion = useTeachMotion();
	const layout = claimLadderLayout(
		width,
		title,
		claims,
		evidenceLabels,
		variants,
	);
	return (
		<g>
			{layout.titleLines.map((line, i) => (
				<Label key={line} x={8} y={18 + i * 14} tone="muted">
					{line}
				</Label>
			))}
			{claims.map((claim, i) => {
				const { y, height, lines, notes } = layout.rows[i];
				const notesY = y + 38 + (lines.length - 1) * TEXT_LINE;
				return (
					<m.g
						key={claim.id}
						initial={false}
						animate={{ opacity: claim.hidden ? 0 : 1 }}
						transition={motion.fade}
					>
						<rect
							x={8}
							y={y}
							width={width - 16}
							height={height}
							rx={10}
							className={claim.focus ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						<EvidenceMark x={20} y={y + 13} evidence={claim.evidence} />
						{lines.map((line, k) => (
							<Label
								key={line}
								x={TEXT_X}
								y={y + 20 + k * TEXT_LINE}
								tone={claim.focus ? "accent" : undefined}
							>
								{line}
							</Label>
						))}
						<m.g
							key={`${claim.id}-${claim.evidence}-${claim.basis}`}
							initial={motion.enabled ? { opacity: 0 } : false}
							animate={{ opacity: 1 }}
							transition={motion.fade}
						>
							{notes.map((note, k) => (
								<Label key={note} x={TEXT_X} y={notesY + k * LINE} tone="small">
									{note}
								</Label>
							))}
						</m.g>
					</m.g>
				);
			})}
		</g>
	);
}

/**
 * A stage sized to the ladder at whatever width it gets. Pass the scene's other states as
 * `variants` and the ladder keeps one size as claims gain or lose wording.
 */
export function ClaimLadderStage({
	label,
	title,
	claims,
	evidenceLabels,
	variants,
}: {
	label: string;
	title?: string;
	claims: readonly Claim[];
	evidenceLabels: Record<EvidenceKind, string>;
	variants?: readonly (readonly Claim[])[];
}) {
	return (
		<Stage
			label={label}
			height={(width) =>
				claimLadderLayout(width, title, claims, evidenceLabels, variants).height
			}
		>
			{(width) => (
				<ClaimLadder
					width={width}
					title={title}
					claims={claims}
					evidenceLabels={evidenceLabels}
					variants={variants}
				/>
			)}
		</Stage>
	);
}
