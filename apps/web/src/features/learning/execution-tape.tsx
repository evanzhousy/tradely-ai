import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@tradely/ui/components/table";
import { executionMoney as money } from "@/domain/learning/execution-concept";
import type { Locale } from "@/i18n/messages";

export type TapeRow = {
	id: string;
	price: number;
	quantity: number;
	at: string;
	unit?: "USD/share" | "USD/point";
	contract?: string;
};
export function ExecutionTape({
	locale,
	rows,
	simulated = false,
	event,
	note,
}: {
	locale: Locale;
	rows: readonly TapeRow[];
	simulated?: boolean;
	event?: string;
	note?: string;
}) {
	const l = (en: string, zh: string) => (locale === "zh" ? zh : en);
	return (
		<section
			className="market-panel"
			aria-label={
				simulated
					? l("Simulated fills", "模拟成交")
					: l("Execution tape", "成交记录")
			}
		>
			<header>
				<h3>
					{simulated
						? l("Simulated fills", "模拟成交")
						: l("Execution tape", "成交记录")}
				</h3>
				<span>{l("Teaching example", "教学示例")}</span>
			</header>
			{event ? <p className="market-event">{event}</p> : null}
			{rows.length ? (
				<Table className="book-table">
					<TableCaption className="sr-only">
						{l(
							"Execution records · price in stated units · size in contracts",
							"成交记录 · 价格采用给定单位 · 数量：张",
						)}
					</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead>{l("Record", "记录")}</TableHead>
							<TableHead>{l("Price", "价格")}</TableHead>
							<TableHead>{l("Size", "数量")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((row) => (
							<TableRow key={row.id} data-tape-id={row.id}>
								<TableHead scope="row">
									{row.id}
									{row.contract ? (
										<small className="block font-normal">{row.contract}</small>
									) : null}
									<small className="block font-normal">{row.at}</small>
								</TableHead>
								<TableCell>
									{money(row.price)}
									<small className="block">{row.unit ?? "USD/share"}</small>
								</TableCell>
								<TableCell>{row.quantity}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			) : (
				<p className="market-context">
					{l("No confirmed executions at this step.", "此步骤尚无已确认成交。")}
				</p>
			)}
			{note ? <p className="market-context">{note}</p> : null}
		</section>
	);
}
