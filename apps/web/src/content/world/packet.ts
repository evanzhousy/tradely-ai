import { sweep } from "./book";
import { oct100CallMonday } from "./flow";
import {
	applyMessages,
	oct105BlockLegs,
	oct105CallBlock,
	oct105CallLast,
	oct105CallMessages,
	oct110CallSweep,
} from "./quotes";

/** One execution a packet row counts: contracts at a price in cents per share. */
export type PacketTrade = {
	id: string;
	/** Session time, ET. */
	time: string;
	quantity: number;
	price: number;
};

export type PacketRow = {
	id: string;
	strike: number;
	/** Null when the source had nothing for the series at the packet's cutoff. */
	trades: readonly PacketTrade[] | null;
};

/** Contracts traded, or null when the row has no data. */
export const rowContracts = (row: PacketRow) =>
	row.trades?.reduce((sum, trade) => sum + trade.quantity, 0) ?? null;

/** Premium in cents: price per share × contracts × 100 shares per contract. */
export const rowPremium = (row: PacketRow) =>
	row.trades?.reduce(
		(sum, trade) => sum + trade.price * trade.quantity * 100,
		0,
	) ?? null;

const oct105TradeTimes: Record<string, string> = {
	"T-1": oct105CallLast.time,
	"T-3": oct105CallBlock.time.slice(0, 5),
};
const oct105Trades = [...applyMessages(oct105CallMessages)].map(
	([id, trade]) => ({ id, time: oct105TradeTimes[id] ?? "", ...trade }),
);
const oct110SweepFills = sweep(
	oct110CallSweep.asks,
	oct110CallSweep.quantity,
).fills;

/**
 * Packet P1: premium traded in ALFA's Oct 18 calls, strikes 100–120, over Monday's session,
 * from the corrected tape as of Monday 16:05. The 120 call has no data yet; its Monday trades
 * arrive at Tuesday 09:00. The recap lessons chart these same rows.
 */
export const mondayPacket: readonly PacketRow[] = [
	{
		id: "R1",
		strike: 100,
		trades: oct100CallMonday.trades.map(({ id, time, quantity, price }) => ({
			id,
			time,
			quantity,
			price,
		})),
	},
	{ id: "R2", strike: 105, trades: oct105Trades },
	{
		id: "R3",
		strike: 110,
		trades: [
			{
				id: "leg",
				time: oct105CallBlock.time.slice(0, 5),
				quantity: oct105BlockLegs.sell.quantity,
				price: oct105BlockLegs.sell.price,
			},
			...oct110SweepFills.map((fill, i) => ({
				id: `sweep-${i + 1}`,
				time: oct110CallSweep.time.slice(0, 5),
				quantity: fill.size,
				price: fill.price,
			})),
		],
	},
	{ id: "R4", strike: 115, trades: [] },
	{ id: "R5", strike: 120, trades: null },
];

/** The 120 call's Monday trades, first delivered at Tuesday 09:00. */
export const oct120CallLateTrades: readonly PacketTrade[] = [
	{ id: "late", time: "13:40", quantity: 30, price: 10 },
];

/** Packet P1 rerun as of Tuesday 09:00: same method, the 120 call now covered. */
export const tuesdayPacket: readonly PacketRow[] = mondayPacket.map((row) =>
	row.trades === null ? { ...row, trades: oct120CallLateTrades } : row,
);

/** Premium in cents summed over the rows that have data. */
export const packetPremium = (rows: readonly PacketRow[]) =>
	rows.reduce((sum, row) => sum + (rowPremium(row) ?? 0), 0);

/** Contracts summed over the rows that have data. */
export const packetContracts = (rows: readonly PacketRow[]) =>
	rows.reduce((sum, row) => sum + (rowContracts(row) ?? 0), 0);
