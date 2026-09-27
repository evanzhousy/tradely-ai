import * as m from "motion/react-m";
import { Label, useStage, useTeachMotion } from "../stage";
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

const ROW = 62;
const TOP = 30;

export function claimLadderHeight(rows: number) {
	return TOP + rows * ROW;
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
}: {
	width: number;
	title?: string;
	claims: readonly Claim[];
	evidenceLabels: Record<EvidenceKind, string>;
}) {
	const motion = useTeachMotion();
	return (
		<g>
			{title ? (
				<Label x={8} y={18} tone="muted">
					{title}
				</Label>
			) : null}
			{claims.map((claim, i) => {
				const y = TOP + i * ROW;
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
							height={ROW - 8}
							rx={10}
							className={claim.focus ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						<EvidenceMark x={20} y={y + 17} evidence={claim.evidence} />
						<Label x={52} y={y + 22} tone={claim.focus ? "accent" : undefined}>
							{claim.text}
						</Label>
						<m.text
							key={`${claim.id}-${claim.evidence}-${claim.basis}`}
							x={52}
							y={y + 41}
							className="wt-small"
							initial={motion.enabled ? { opacity: 0 } : false}
							animate={{ opacity: 1 }}
							transition={motion.fade}
						>
							{`${evidenceLabels[claim.evidence]} · ${claim.basis}`}
						</m.text>
					</m.g>
				);
			})}
		</g>
	);
}
