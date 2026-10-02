import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { Appear, Label, useTeachMotion } from "../stage";
import { textWidth } from "../text-measure";

export type TicketField = {
	id: string;
	label: string;
	value: string;
	/** The segment of the OCC-style symbol this field produces, if any. */
	segment?: string;
};

const ROW = 30;
const TOP = 48;

/** Without a symbol line the ticket is just its card. */
export function ticketHeight(fields: number, withSymbol = true) {
	return TOP + fields * ROW + (withSymbol ? 76 : 12);
}

/**
 * A contract spelled out field by field. Each field shown builds part of the standard
 * option symbol underneath; the field being discussed is highlighted.
 */
export function ContractTicket({
	width,
	title,
	fields,
	shown,
	focus,
	symbolLabel,
}: {
	width: number;
	title: string;
	fields: readonly TicketField[];
	/** How many fields are filled in, from the top. */
	shown: number;
	focus?: string;
	/** Omit to leave out the symbol line under the card. */
	symbolLabel?: string;
}) {
	const motion = useTeachMotion();
	const cardWidth = Math.min(width - 16, 420);
	const left = (width - cardWidth) / 2;
	const segments = fields.filter((field) => field.segment);
	const symbolTop = TOP + fields.length * ROW + 22;
	const focusIndex = fields.findIndex((field) => field.id === focus);
	return (
		<g>
			{/* The card grows with the fields a step adds, and the highlight travels to the field
			    being discussed. */}
			<m.rect
				x={left}
				y={8}
				width={cardWidth}
				rx={14}
				className="wt-panel-shape"
				initial={false}
				animate={{ height: TOP + fields.length * ROW - 4 }}
				transition={motion.move}
			/>
			{focusIndex >= 0 ? (
				<Appear>
					<m.rect
						x={left + 8}
						width={cardWidth - 16}
						height={ROW - 4}
						rx={8}
						className="wt-focus-shape"
						initial={false}
						animate={{ y: TOP + focusIndex * ROW - 2 }}
						transition={motion.move}
					/>
				</Appear>
			) : null}
			<Label x={left + 16} y={32} tone="muted">
				{title}
			</Label>
			{fields.map((field, i) => {
				const y = TOP + i * ROW;
				const visible = i < shown;
				const active = field.id === focus;
				// On a narrow card a long value condenses into the room its label leaves.
				const room = cardWidth - 36 - textWidth(field.label, 12) - 12;
				const natural = textWidth(field.value, 13);
				const fitted =
					natural > room ? Math.max(room, natural * 0.72) : undefined;
				return (
					<g key={field.id}>
						<Label x={left + 18} y={y + 17} tone="muted">
							{field.label}
						</Label>
						<AnimatePresence initial={false}>
							{visible ? (
								<m.text
									key={`${field.id}-${field.value}`}
									x={left + cardWidth - 18}
									y={y + 17}
									textAnchor="end"
									textLength={fitted}
									lengthAdjust={fitted ? "spacingAndGlyphs" : undefined}
									className={active ? "wt-accent" : undefined}
									initial={motion.enabled ? { opacity: 0, x: 12 } : false}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0 }}
									transition={motion.fade}
								>
									{field.value}
								</m.text>
							) : (
								<Label
									key={`${field.id}-empty`}
									x={left + cardWidth - 18}
									y={y + 17}
									anchor="end"
									tone="small"
								>
									—
								</Label>
							)}
						</AnimatePresence>
					</g>
				);
			})}
			{symbolLabel === undefined ? null : (
				<Label x={width / 2} y={symbolTop} anchor="middle" tone="small">
					{symbolLabel}
				</Label>
			)}
			{symbolLabel === undefined ? null : (
				<text
					x={width / 2}
					y={symbolTop + 30}
					textAnchor="middle"
					className="wt-strong"
				>
					{segments.map((field) => {
						const index = fields.indexOf(field);
						const visible = index < shown;
						return (
							<tspan
								key={field.id}
								// A segment not filled in yet keeps its width, so the symbol doesn't shift.
								className={
									field.id === focus
										? "wt-accent"
										: visible
											? undefined
											: "wt-pending"
								}
							>
								{visible
									? field.segment
									: "·".repeat(field.segment?.length ?? 0)}
							</tspan>
						);
					})}
				</text>
			)}
		</g>
	);
}
