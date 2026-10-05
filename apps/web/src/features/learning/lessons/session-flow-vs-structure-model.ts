import {
	contractLabel,
	daysBetween,
	type ExpiryId,
	expiries,
	type HolderId,
	OCT_100_CALL,
	oct100CallMonday,
	openInterestChange,
	type Trade,
	weeklyCallOpenInterest,
} from "@/content/world";
import type { Holding } from "../walkthrough/instruments/position-ledger";

export type Holdings = Record<HolderId, Holding>;
export const order: readonly HolderId[] = [
	"you",
	"ben",
	"cara",
	"eli",
	"others",
];
export const day = oct100CallMonday;
export const contract = contractLabel(OCT_100_CALL);

export const start: Holdings = {
	you: { long: 0, short: 0 },
	ben: { long: 0, short: 0 },
	cara: { long: 20, short: 0 },
	eli: { long: 0, short: 30 },
	others: { long: day.othersGross.long, short: day.othersGross.short },
};

/** Buyers who open add a long; buyers who close retire a short. Sellers mirror them. */
export function apply(holdings: Holdings, trade: Trade): Holdings {
	const next = { ...holdings };
	const buyer = { ...next[trade.buyer] };
	const seller = { ...next[trade.seller] };
	if (trade.buyerEffect === "open") buyer.long += trade.quantity;
	else buyer.short -= trade.quantity;
	if (trade.sellerEffect === "open") seller.short += trade.quantity;
	else seller.long -= trade.quantity;
	next[trade.buyer] = buyer;
	next[trade.seller] = seller;
	return next;
}

export type LedgerState = {
	holdings: Holdings;
	before?: Holdings;
	trade?: Trade;
	volume: number;
	volumeBefore?: number;
	openInterest: number;
	openInterestBefore?: number;
};

export const ledgerBeats = (() => {
	const beats: LedgerState[] = [
		{ holdings: start, volume: 0, openInterest: day.startOpenInterest },
	];
	for (const trade of day.trades) {
		const previous = beats[beats.length - 1];
		beats.push({
			holdings: apply(previous.holdings, trade),
			before: previous.holdings,
			trade,
			volume: previous.volume + trade.quantity,
			volumeBefore: previous.volume,
			openInterest: previous.openInterest + openInterestChange(trade),
			openInterestBefore: previous.openInterest,
		});
	}
	return beats;
})();

export const minuteOf = (time: string) => {
	const [hours, minutes] = time.split(":").map(Number);
	return hours * 60 + minutes;
};

export const stripExpiries: readonly ExpiryId[] = [
	"sep27",
	"oct4",
	"oct11",
	"oct18",
];
export const [earlier, later] = weeklyCallOpenInterest;
export const inBucket = (days: number) => days >= 14 && days <= 30;

export type BucketState = { later: boolean; compare: boolean };

export function bucketFacts(state: BucketState) {
	const snapshot = state.later ? later : earlier;
	const columns = stripExpiries.map((id) => {
		const days = daysBetween(snapshot.date, expiries[id].date);
		const value = snapshot.values[id] ?? 0;
		return {
			id,
			days,
			value,
			member: inBucket(days),
			change:
				state.later && state.compare
					? value - (earlier.values[id] ?? 0)
					: undefined,
		};
	});
	const members = columns.filter((column) => column.member);
	return {
		date: snapshot.date,
		columns,
		members,
		total: members.reduce((sum, column) => sum + column.value, 0),
	};
}
