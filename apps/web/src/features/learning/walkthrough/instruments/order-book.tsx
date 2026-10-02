import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { count, usd } from "@/content/world";
import { Appear, Label, useTeachMotion } from "../stage";

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

/** A fill marked on the level it took; `side` keeps it off a same-priced level opposite. */
export type BookFill = { price: number; size: number; side?: "bid" | "ask" };

/** An order arriving to trade against the book, drawn beside the level it will meet first. */
export type BookIncoming = { side: "buy" | "sell"; label: string };

export type BookLabels = {
	bid: string;
	ask: string;
	price: string;
	spread: string;
	last: string;
	filled: (size: number) => string;
	/** Tag for the learner's own resting order. */
	mine?: string;
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
	incoming,
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
	incoming?: BookIncoming;
}) {
	const motion = useTeachMotion();
	const center = width / 2;
	const priceWidth = 84;
	const barSpace = center - priceWidth / 2 - 56;
	// A level larger than the lesson's usual maximum, such as a big order the learner adds,
	// rescales the bars so the longest one still leaves room for its size label.
	const largest = Math.max(
		sizeMax,
		...[...bids, ...asks].map((level) =>
			Math.max(level.size, level.before ?? 0),
		),
	);
	const k = barSpace / largest;
	// Asks are drawn highest price at the top, down to the best ask above the spread.
	const askRows = [...asks].reverse();
	const askTop = HEAD;
	const spreadTop = HEAD + askRows.length * ROW;
	const bidTop = spreadTop + GAP;
	// The best level is the first one that still shows size; emptied levels stay drawn as ghosts.
	const bestBidIndex = bids.findIndex((level) => level.size > 0);
	const bestAskIndex = asks.findIndex((level) => level.size > 0);
	const bestBid = bids[bestBidIndex]?.price;
	const bestAsk = asks[bestAskIndex]?.price;
	const fillAt = (price: number, side: "bid" | "ask") =>
		fills.find(
			(fill) => fill.price === price && (!fill.side || fill.side === side),
		)?.size;
	// Each row draws at its own origin and slides to its place, so a level that joins the
	// book moves the levels below it instead of making them jump.
	const row = (
		level: BookLevel,
		rowY: number,
		side: "bid" | "ask",
		index: number,
	) => {
		const bar = level.size * k;
		const ghost = level.before !== undefined ? level.before * k : undefined;
		const filled = fillAt(level.price, side);
		const isBest = index === (side === "bid" ? bestBidIndex : bestAskIndex);
		const x =
			side === "bid"
				? center - priceWidth / 2 - 8
				: center + priceWidth / 2 + 8;
		return (
			<m.g
				key={`${side}-${level.price}-${level.venue ?? ""}`}
				initial={false}
				animate={{ y: rowY }}
				transition={motion.move}
			>
				<Appear>
					{isBest ? (
						<Appear>
							<rect
								x={8}
								y={2}
								width={width - 16}
								height={ROW - 4}
								rx={6}
								className="wt-focus-shape"
								opacity={0.55}
							/>
						</Appear>
					) : null}
					{ghost !== undefined && ghost !== bar ? (
						<Appear>
							<rect
								x={side === "bid" ? x - ghost : x}
								y={7}
								width={ghost}
								height={ROW - 14}
								className="wt-ghost"
							/>
						</Appear>
					) : null}
					<m.rect
						y={7}
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
						y={ROW / 2 + 4.5}
						anchor={side === "bid" ? "end" : "start"}
					>
						{count(level.size)}
					</Label>
					<Label
						x={center}
						y={ROW / 2 + 4.5}
						anchor="middle"
						tone={isBest ? "accent" : undefined}
					>
						{usd(level.price)}
					</Label>
					{level.venue ? (
						<Label
							x={side === "bid" ? 16 : width - 16}
							y={ROW / 2 + 4}
							anchor={side === "bid" ? "start" : "end"}
							tone="small"
						>
							{level.venue}
						</Label>
					) : null}
					{level.mine && !filled && labels.mine ? (
						<Label
							x={
								side === "bid"
									? center + priceWidth / 2 + 8
									: center - priceWidth / 2 - 8
							}
							y={ROW / 2 + 4}
							anchor={side === "bid" ? "start" : "end"}
							tone="accent"
						>
							{labels.mine}
						</Label>
					) : null}
					<AnimatePresence>
						{incoming &&
						!filled &&
						isBest &&
						side === (incoming.side === "buy" ? "ask" : "bid") ? (
							<m.g
								key={`incoming-${incoming.label}`}
								initial={
									motion.enabled
										? { opacity: 0, x: side === "ask" ? -18 : 18 }
										: false
								}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0 }}
								transition={motion.move}
							>
								<Label
									x={
										side === "ask"
											? center - priceWidth / 2 - 26
											: center + priceWidth / 2 + 26
									}
									y={ROW / 2 + 4}
									anchor={side === "ask" ? "end" : "start"}
									tone="accent"
								>
									{incoming.label}
								</Label>
								<path
									d={
										side === "ask"
											? `M${center - priceWidth / 2 - 22} ${ROW / 2}h14l-5 -4m5 4l-5 4`
											: `M${center + priceWidth / 2 + 22} ${ROW / 2}h-14l5 -4m-5 4l5 4`
									}
									className="wt-arrow wt-arrow-contract"
								/>
							</m.g>
						) : null}
						{filled ? (
							<m.text
								key={`fill-${level.price}-${filled}`}
								x={
									side === "bid"
										? center + priceWidth / 2 + 8
										: center - priceWidth / 2 - 8
								}
								y={ROW / 2 + 4}
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
				</Appear>
			</m.g>
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
