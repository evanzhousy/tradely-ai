import { count, type Level, usd } from "@/content/world";
import {
	type BookFill,
	type BookIncoming,
	type BookLabels,
	type BookLevel,
	bookHeight,
	OrderBook,
} from "./order-book";
import { type TapeRow, TradeTape, tapeHeight } from "./trade-tape";

/** One execution on the tape. Price in cents; size in contracts or shares. */
export type Print = {
	time: string;
	size: number;
	price: number;
	/** A feed condition code such as ISO; adds a column when any print has one. */
	condition?: string;
};

const GAP = 12;

/** Levels after an order takes size from the front of one side; each ghost keeps the old size. */
export function afterTaking(
	levels: readonly Level[],
	fills: readonly Level[],
): BookLevel[] {
	return levels.map((level) => {
		const fill = fills.find((item) => item.price === level.price);
		return fill
			? { ...level, size: level.size - fill.size, before: level.size }
			: level;
	});
}

export function bookTapeHeight(bids: number, asks: number, tapeRows: number) {
	return bookHeight(bids, asks) + GAP + tapeHeight(tapeRows);
}

/** A book above its time and sales, so orders and the prints they make read together. */
export function BookTape({
	width,
	bids,
	asks,
	fills = [],
	prints,
	sizeMax,
	labels,
	tape,
	tapeRows = 3,
	incoming,
}: {
	width: number;
	bids: readonly BookLevel[];
	asks: readonly BookLevel[];
	fills?: readonly BookFill[];
	/** Newest first. */
	prints: readonly Print[];
	sizeMax: number;
	labels: BookLabels;
	tape: {
		title: string;
		time: string;
		size: string;
		price: string;
		empty: string;
		condition?: string;
	};
	tapeRows?: number;
	incoming?: BookIncoming;
}) {
	const withCondition = prints.some((print) => print.condition);
	const rows: TapeRow[] = prints.map((print, i) => ({
		key: `${print.time}-${print.size}-${print.price}-${prints.length - i}`,
		cells: [
			print.time,
			count(print.size),
			usd(print.price),
			...(withCondition ? [print.condition ?? "—"] : []),
		],
	}));
	return (
		<g>
			<OrderBook
				width={width}
				bids={bids}
				asks={asks}
				last={prints[0]?.price}
				fills={fills}
				sizeMax={sizeMax}
				labels={labels}
				incoming={incoming}
			/>
			<TradeTape
				x={8}
				y={bookHeight(bids.length, asks.length) + GAP}
				width={width - 16}
				title={tape.title}
				columns={
					withCondition
						? [
								{ label: tape.time, share: 0.34 },
								{ label: tape.size, share: 0.22, align: "end" },
								{ label: tape.price, share: 0.24, align: "end" },
								{ label: tape.condition ?? "", share: 0.2, align: "end" },
							]
						: [
								{ label: tape.time, share: 0.34 },
								{ label: tape.size, share: 0.33, align: "end" },
								{ label: tape.price, share: 0.33, align: "end" },
							]
				}
				rows={rows}
				maxRows={tapeRows}
				empty={tape.empty}
			/>
		</g>
	);
}
