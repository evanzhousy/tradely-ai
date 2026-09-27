import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { Label, useTeachMotion } from "../stage";

export type FlowParty = {
	id: string;
	name: string;
	role: string;
	/** What the party holds after this step, one line each. */
	holdings: readonly string[];
};

export type FlowTransfer = {
	id: string;
	from: string;
	to: string;
	label: string;
	kind: "cash" | "shares" | "contract";
};

const CARD_HEIGHT = 132;
const ROW = 34;

export function transferFlowHeight(width: number, transfers: number) {
	return width < 520
		? CARD_HEIGHT * 2 + Math.max(transfers, 1) * ROW + 36
		: CARD_HEIGHT + 24;
}

/**
 * Two accounts and what moves between them: premium, shares or cash. Each transfer is an
 * arrow with its label; new transfers slide in along their arrow.
 */
export function TransferFlow({
	width,
	parties,
	transfers,
}: {
	width: number;
	parties: readonly [FlowParty, FlowParty];
	transfers: readonly FlowTransfer[];
}) {
	const motion = useTeachMotion();
	const narrow = width < 520;
	const cardWidth = narrow ? width - 16 : Math.min(210, width * 0.33);
	const positions = narrow
		? [
				{ x: 8, y: 8 },
				{ x: 8, y: CARD_HEIGHT + 20 + Math.max(transfers.length, 1) * ROW },
			]
		: [
				{ x: 8, y: 12 },
				{ x: width - cardWidth - 8, y: 12 },
			];
	const index = (id: string) => (parties[0].id === id ? 0 : 1);
	return (
		<g>
			{parties.map((party, i) => {
				const { x, y } = positions[i];
				return (
					<g key={party.id}>
						<rect
							x={x}
							y={y}
							width={cardWidth}
							height={CARD_HEIGHT}
							rx={12}
							className={i === 0 ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						<Label x={x + 14} y={y + 28} tone="strong">
							{party.name}
						</Label>
						<Label x={x + 14} y={y + 48} tone="muted">
							{party.role}
						</Label>
						{party.holdings.map((line, row) => (
							<m.text
								key={`${party.id}-${line}`}
								x={x + 14}
								y={y + 76 + row * 22}
								initial={motion.enabled ? { opacity: 0 } : false}
								animate={{ opacity: 1 }}
								transition={motion.after(0.3)}
							>
								{line}
							</m.text>
						))}
					</g>
				);
			})}
			<AnimatePresence initial={false}>
				{transfers.map((transfer, row) => {
					const fromLeft = index(transfer.from) === 0;
					if (narrow) {
						const top = CARD_HEIGHT + 14 + row * ROW;
						const cx = width / 2;
						return (
							<m.g
								key={transfer.id}
								initial={
									motion.enabled ? { opacity: 0, y: fromLeft ? -8 : 8 } : false
								}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0 }}
								transition={motion.move}
							>
								<path
									d={
										fromLeft
											? `M${cx - 90} ${top + 6}v18l-5 -6m5 6l5 -6`
											: `M${cx - 90} ${top + 24}v-18l-5 6m5 -6l5 6`
									}
									className={`wt-arrow wt-arrow-${transfer.kind}`}
								/>
								<Label x={cx - 72} y={top + 20}>
									{transfer.label}
								</Label>
							</m.g>
						);
					}
					const y = 40 + row * ROW;
					const from = fromLeft ? 8 + cardWidth + 10 : width - cardWidth - 18;
					const to = fromLeft ? width - cardWidth - 18 : 8 + cardWidth + 10;
					const head = fromLeft ? -7 : 7;
					return (
						<m.g
							key={transfer.id}
							initial={
								motion.enabled ? { opacity: 0, x: fromLeft ? -24 : 24 } : false
							}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0 }}
							transition={motion.move}
						>
							<path
								d={`M${from} ${y}H${to}l${head} -5m${-head} 5l${head} 5`}
								className={`wt-arrow wt-arrow-${transfer.kind}`}
							/>
							<Label x={(from + to) / 2} y={y - 8} anchor="middle">
								{transfer.label}
							</Label>
						</m.g>
					);
				})}
			</AnimatePresence>
		</g>
	);
}
