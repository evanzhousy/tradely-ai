import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { count, usd } from "@/content/world";
import { Label, useTeachMotion } from "../stage";

export type BookLevel = {
	/** Cents. */
	price: number;
	size: number;
	/** Size before this step, when it changed; drawn as a dashed ghost. */
	before?: number;
	venue?: string;
	/** A resting order that belongs to the learner. */
	mine?: boolean;
};

export type BookFill = { price: number; size: number };

export type BookLabels = {
	bid: string;
	ask: string;
	price: string;
	spread: string;
	last: string;
	filled: (size: number) => string;
};

const HEAD = 44;
const ROW = 30;
const GAP = 30;

export function bookHeight(bids: number, asks: number) {
	return HEAD + (bids + asks) * ROW + GAP + 8;
}

/**
 * A price ladder: asks above, bids below, the spread between them. Size bars grow away from
 * the price column: bids to the left, asks to the right. Fills from an incoming order are
 * marked on the level they took.
 */
export function OrderBook({
	width,
	bids,
	asks,
	last,
	fills = [],
	sizeMax,
	labels,
}: {
	width: number;
	/** Highest first. */
	bids: readonly BookLevel[];
	/** Lowest first. */
	asks: readonly BookLevel[];
	last?: number;
	fills?: readonly BookFill[];
	sizeMax: number;
	labels: BookLabels;
}) {
	const motion = useTeachMotion();
	const center = width / 2;
	const priceWidth = 84;
	const barSpace = center - priceWidth / 2 - 56;
	const k = barSpace / sizeMax;
	// Asks are drawn highest price at the top, down to the best ask above the spread.
	const askRows = [...asks].reverse();
	const askTop = HEAD;
	const spreadTop = HEAD + askRows.length * ROW;
	const bidTop = spreadTop + GAP;
	const bestBid = bids[0]?.price;
	const bestAsk = asks[0]?.price;
	const fillAt = (price: number) =>
		fills.find((fill) => fill.price === price)?.size;
	const row = (
		level: BookLevel,
		y: number,
		side: "bid" | "ask",
		index: number,
	) => {
		const bar = level.size * k;
		const ghost = level.before !== undefined ? level.before * k : undefined;
		const filled = fillAt(level.price);
		const isBest = index === 0;
		const x =
			side === "bid"
				? center - priceWidth / 2 - 8
				: center + priceWidth / 2 + 8;
		return (
			<g key={`${side}-${level.price}-${level.venue ?? ""}`}>
				{isBest ? (
					<rect
						x={8}
						y={y + 2}
						width={width - 16}
						height={ROW - 4}
						rx={6}
						className="wt-focus-shape"
						opacity={0.55}
					/>
				) : null}
				{ghost !== undefined && ghost !== bar ? (
					<rect
						x={side === "bid" ? x - ghost : x}
						y={y + 7}
						width={ghost}
						height={ROW - 14}
						className="wt-ghost"
					/>
				) : null}
				<m.rect
					y={y + 7}
					height={ROW - 14}
					rx={3}
					className={
						level.mine ? "wt-chip" : side === "bid" ? "wt-long" : "wt-short"
					}
					initial={false}
					animate={
						side === "bid" ? { x: x - bar, width: bar } : { x, width: bar }
					}
					transition={motion.move}
				/>
				<Label
					x={
						side === "bid"
							? x - Math.max(bar, ghost ?? 0) - 6
							: x + Math.max(bar, ghost ?? 0) + 6
					}
					y={y + ROW / 2 + 4.5}
					anchor={side === "bid" ? "end" : "start"}
				>
					{count(level.size)}
				</Label>
				<Label
					x={center}
					y={y + ROW / 2 + 4.5}
					anchor="middle"
					tone={isBest ? "accent" : undefined}
				>
					{usd(level.price)}
				</Label>
				{level.venue ? (
					<Label
						x={side === "bid" ? 16 : width - 16}
						y={y + ROW / 2 + 4}
						anchor={side === "bid" ? "start" : "end"}
						tone="small"
					>
						{level.venue}
					</Label>
				) : null}
				<AnimatePresence>
					{filled ? (
						<m.text
							key={`fill-${level.price}-${filled}`}
							x={
								side === "bid"
									? center + priceWidth / 2 + 8
									: center - priceWidth / 2 - 8
							}
							y={y + ROW / 2 + 4}
							textAnchor={side === "bid" ? "start" : "end"}
							className="wt-accent"
							initial={motion.enabled ? { opacity: 0 } : false}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={motion.after(0.25)}
						>
							{labels.filled(filled)}
						</m.text>
					) : null}
				</AnimatePresence>
			</g>
		);
	};
	return (
		<g>
			<Label x={center - priceWidth / 2 - 8} y={20} anchor="end" tone="muted">
				{labels.bid}
			</Label>
			<Label x={center} y={20} anchor="middle" tone="muted">
				{labels.price}
			</Label>
			<Label x={center + priceWidth / 2 + 8} y={20} tone="muted">
				{labels.ask}
			</Label>
			<path d={`M8 ${HEAD - 8}H${width - 8}`} className="wt-grid" />
			{askRows.map((level, i) =>
				row(level, askTop + i * ROW, "ask", askRows.length - 1 - i),
			)}
			{bestBid !== undefined && bestAsk !== undefined ? (
				<g>
					<path
						d={`M${center - priceWidth / 2} ${spreadTop + GAP / 2}H${center + priceWidth / 2}`}
						className="wt-axis"
						strokeDasharray="3 3"
					/>
					<Label
						x={center + priceWidth / 2 + 8}
						y={spreadTop + GAP / 2 + 4}
						tone="small"
					>
						{labels.spread} {usd(bestAsk - bestBid)}
					</Label>
					{last !== undefined ? (
						<Label
							x={center - priceWidth / 2 - 8}
							y={spreadTop + GAP / 2 + 4}
							anchor="end"
							tone="small"
						>
							{labels.last} {usd(last)}
						</Label>
					) : null}
				</g>
			) : null}
			{bids.map((level, i) => row(level, bidTop + i * ROW, "bid", i))}
		</g>
	);
}
