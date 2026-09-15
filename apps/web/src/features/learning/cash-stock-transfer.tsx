import type { Locale } from "@/i18n/messages";
/** Signed quantities are from the holder's viewpoint and use the supplied settlement model. */
export function CashStockTransfer({
	locale,
	cash,
	shares,
	formatCash,
	phase,
	note,
}: {
	locale: Locale;
	cash: number | null;
	shares: number | null;
	formatCash: (n: number) => string;
	phase: string;
	note: string;
}) {
	const l = (en: string, zh: string) => (locale === "zh" ? zh : en);
	return (
		<section
			className="transfer-panel"
			aria-label={l("Cash and stock transfer", "现金与股票交付")}
		>
			<h3>{l("Follow what changes hands", "看清交付什么")}</h3>
			<p className="outcome-note">{phase}</p>
			<div className="transfer-parties">
				<span>{l("Holder", "持有人")}</span>
				<span>{l("Settlement counterparty", "结算对手方")}</span>
			</div>
			{[
				{
					id: "cash",
					label: l("Cash", "现金"),
					value: cash,
					format: formatCash,
				},
				{
					id: "shares",
					label: l("Shares", "股票"),
					value: shares,
					format: (n: number) => `${n} ${l("shares", "股")}`,
				},
			].map((row) => (
				<div className="transfer-row" key={row.id} data-transfer={row.id}>
					<strong>{row.label}</strong>
					<span className="transfer-arrow" aria-hidden="true">
						{row.value === null
							? "?"
							: row.value === 0
								? "—"
								: row.value > 0
									? "←"
									: "→"}
					</span>
					<span>
						{row.value === null
							? l("Unknown", "未知")
							: row.value === 0
								? l("No transfer", "无交付")
								: `${row.value > 0 ? l("Receives", "接收") : l("Delivers", "交付")} ${row.format(Math.abs(row.value))}`}
					</span>
				</div>
			))}
			<p className="outcome-note">{note}</p>
		</section>
	);
}
