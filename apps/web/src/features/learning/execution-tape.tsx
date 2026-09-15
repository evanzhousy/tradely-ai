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
				<table className="book-table">
					<caption className="sr-only">
						{l(
							"Execution records · price in stated units · size in contracts",
							"成交记录 · 价格采用给定单位 · 数量：张",
						)}
					</caption>
					<thead>
						<tr>
							<th>{l("Record", "记录")}</th>
							<th>{l("Price", "价格")}</th>
							<th>{l("Size", "数量")}</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={row.id} data-tape-id={row.id}>
								<th scope="row">
									{row.id}
									{row.contract ? (
										<small className="block font-normal">{row.contract}</small>
									) : null}
									<small className="block font-normal">{row.at}</small>
								</th>
								<td>
									{money(row.price)}
									<small className="block">{row.unit ?? "USD/share"}</small>
								</td>
								<td>{row.quantity}</td>
							</tr>
						))}
					</tbody>
				</table>
			) : (
				<p className="market-context">
					{l("No confirmed executions at this step.", "此步骤尚无已确认成交。")}
				</p>
			)}
			{note ? <p className="market-context">{note}</p> : null}
		</section>
	);
}
