import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@tradely/ui/components/table";
import type { DepthLevel } from "@/domain/learning/execution-concept";
import { executionMoney as money } from "@/domain/learning/execution-concept";
import type { Locale } from "@/i18n/messages";

export type BookRow = {
	price: number;
	size: number | null;
	filled?: number;
	eligible?: boolean;
};
type Props = {
	locale: Locale;
	contract: string;
	at: string | null;
	bids: readonly BookRow[];
	asks: readonly BookRow[];
	depth?: boolean;
	scale?: number;
	note?: string;
	event?: string;
	activeQuote?: { side: "bid" | "ask"; price: number };
	print?: { price: number; quantity?: number; at: string };
};

/** Read-only supplied quotes/depth. Unknown sizes stay unknown; drawing never creates fills. */
export function OrderBookPanel({
	locale,
	contract,
	at,
	bids,
	asks,
	depth = false,
	scale,
	note,
	event,
	activeQuote,
	print,
}: Props) {
	const l = (en: string, zh: string) => (locale === "zh" ? zh : en);
	const maximum =
		scale ?? Math.max(1, ...[...bids, ...asks].map((row) => row.size ?? 0));
	const availableBids = bids.filter((row) => row.size === null || row.size > 0);
	const availableAsks = asks.filter((row) => row.size === null || row.size > 0);
	const bestBid = availableBids.length
		? Math.max(...availableBids.map((row) => row.price))
		: null;
	const bestAsk = availableAsks.length
		? Math.min(...availableAsks.map((row) => row.price))
		: null;
	const row = (level: BookRow, side: "bid" | "ask") => (
		<TableRow
			key={`${side}:${level.price}`}
			data-book-side={side}
			data-book-active={
				activeQuote?.side === side && activeQuote.price === level.price
			}
			data-book-price={level.price}
			data-book-size={level.size ?? "unknown"}
			data-book-filled={level.filled ?? 0}
			data-eligible={level.eligible}
			data-print-match={print?.price === level.price}
		>
			<TableHead scope="row">
				{side === "ask" ? l("Ask", "卖价") : l("Bid", "买价")}
			</TableHead>
			<TableCell className="book-price">{money(level.price)}</TableCell>
			<TableCell className="book-size">
				<span
					className="book-size-bar"
					aria-hidden="true"
					style={{
						width: `${Math.min(100, ((level.size ?? 0) / maximum) * 100)}%`,
					}}
				/>
				<span>{level.size ?? "—"}</span>
			</TableCell>
			{depth ? (
				<TableCell>
					{level.filled ? (
						<strong className="book-fill">−{level.filled}</strong>
					) : level.eligible === false ? (
						l("Outside limit", "超出限价")
					) : (
						"—"
					)}
				</TableCell>
			) : null}
		</TableRow>
	);
	return (
		<section
			className="market-panel"
			aria-label={
				depth
					? l("Teaching order book", "教学订单簿")
					: l("Reference quote", "参考报价")
			}
		>
			<header>
				<h3>
					{depth ? l("Order book", "订单簿") : l("Reference quote", "参考报价")}
				</h3>
				<span>{l("Teaching example", "教学示例")}</span>
			</header>
			<p className="market-context">
				{contract}
				<br />
				{at ?? l("Quote time unavailable", "报价时间未知")}
				<br />
				{l("USD/share · size in contracts", "美元/股 · 数量：张")}
			</p>
			{event ? (
				<p className="market-event" data-book-event>
					{event}
				</p>
			) : null}
			<Table className="book-table">
				<TableCaption className="sr-only">
					{l("Price and displayed quantity", "价格与可见数量")}
				</TableCaption>
				<TableHeader>
					<TableRow>
						<TableHead>{l("Side", "方向")}</TableHead>
						<TableHead>{l("Price", "价格")}</TableHead>
						<TableHead>{l("Size", "数量")}</TableHead>
						{depth ? <TableHead>{l("Filled", "已成交")}</TableHead> : null}
					</TableRow>
				</TableHeader>
				<TableBody>
					{[...asks]
						.sort((a, b) => b.price - a.price)
						.map((level) => row(level, "ask"))}
					<TableRow className="book-spread">
						<TableCell colSpan={depth ? 4 : 3}>
							{bestAsk !== null && bestBid !== null
								? `${l("Spread", "价差")} ${money(bestAsk - bestBid)}`
								: l("Reference unavailable", "参考不可用")}
						</TableCell>
					</TableRow>
					{[...bids]
						.sort((a, b) => b.price - a.price)
						.map((level) => row(level, "bid"))}
				</TableBody>
			</Table>
			{print ? (
				<p className="market-print" data-book-print>
					<strong>
						{l("Print", "成交")}:{" "}
						{print.quantity === undefined ? "" : `${print.quantity} @ `}
						{money(print.price)}
					</strong>
					<br />
					{print.at}
				</p>
			) : null}
			<p className="market-context">
				{note ??
					(depth
						? l(
								"Supplied displayed liquidity only. Depleted levels stay visible for comparison.",
								"仅展示给定可见流动性，已消耗价位保留供比较。",
							)
						: l(
								"Best quote only. Deeper liquidity is not supplied.",
								"仅提供最优报价，没有给定更深档位。",
							))}
			</p>
		</section>
	);
}

export function remainingBook(
	levels: readonly DepthLevel[],
	fills: readonly { price: number; filled: number; eligible: boolean }[],
): BookRow[] {
	return levels.map((level) => {
		const match = fills.find((row) => row.price === level.price);
		return {
			...level,
			size: level.size - (match?.filled ?? 0),
			filled: match?.filled ?? 0,
			eligible: match?.eligible,
		};
	});
}
