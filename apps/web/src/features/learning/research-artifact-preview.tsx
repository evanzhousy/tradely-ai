import { Button } from "@tradely/ui/components/button";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@tradely/ui/components/table";
import { useState } from "react";
import {
	type PacketTeachingRecord,
	packetRowPremium,
} from "@/domain/learning/packet-concept";
import type { Locale } from "@/i18n/messages";

/** Public authored rows only. The same record is shared by packet, recap and audit lessons. */
export function ResearchArtifactPreview({
	record,
	locale,
	metric = "premium",
	headline,
	caption,
	supported = true,
	selectedId,
	onSelect,
	revealed = true,
}: {
	record: PacketTeachingRecord;
	locale: Locale;
	metric?: "premium" | "volume";
	headline?: string;
	caption?: string;
	supported?: boolean;
	selectedId?: string;
	onSelect?: (id: string) => void;
	revealed?: boolean;
}) {
	const [localSelection, setSelection] = useState<string | null>(null);
	const selected = selectedId ?? localSelection;
	const l = (en: string, zh: string) => (locale === "zh" ? zh : en);
	const rows = record.rows.map((row) => ({
		...row,
		value: metric === "premium" ? packetRowPremium(row) : row.contracts,
	}));
	const subtotal = rows.reduce((sum, row) => sum + (row.value ?? 0), 0);
	const missing = rows.filter((row) => row.value === null);
	const format = (value: number | null) =>
		value === null
			? "—"
			: metric === "premium"
				? `$${(value / 100).toLocaleString("en-US")}`
				: String(value);
	const current = rows.find((row) => row.id === selected);
	const max = Math.max(1, ...rows.map((r) => r.value ?? 0));
	const select = (id: string) => {
		setSelection(id);
		onSelect?.(id);
	};
	return (
		<article
			className="research-artifact"
			aria-label={l("Worked research report", "研究报告示例")}
		>
			<header>
				<span className="outcome-note">
					{l("TAU research example · v1", "TAU 研究示例 · v1")} · {record.id}
				</span>
				<h3>
					{headline ?? l("A reproducible observation", "可重现的观测结果")}
				</h3>
				<p className="outcome-note">
					{record.session} · {record.method.cutoff}
					<br />
					{record.method.universe}
				</p>
			</header>
			{!supported ? (
				<p className="artifact-caution">
					{l(
						"Check this claim against the displayed metric and source coverage. Only the observed subtotal is available.",
						"请对照图表指标与来源覆盖检查此结论。目前仅有观测小计。",
					)}
				</p>
			) : null}
			{revealed ? (
				<>
					<figure
						className="artifact-bars"
						aria-label={l("Source chart", "来源图表")}
					>
						{rows.map((row) => (
							<Button
								key={row.id}
								variant="ghost"
								onClick={() => select(row.id)}
								aria-pressed={selected === row.id}
								className="artifact-bar-row"
							>
								<span>{row.id}</span>
								<span className="artifact-bar-track">
									<span
										style={{
											width:
												row.value === null
													? "100%"
													: `${(row.value / max) * 100}%`,
										}}
										data-missing={row.value === null}
									/>
								</span>
								<strong>{format(row.value)}</strong>
							</Button>
						))}
					</figure>
					<p className="outcome-note">
						{metric === "premium"
							? l(
									"Observed premium · USD · zero baseline",
									"观测权利金 · 美元 · 从零起",
								)
							: l("Observed contracts · zero baseline", "观测张数 · 从零起")}
					</p>
					<p className="artifact-total">
						{l("Observed subtotal", "观测小计")}: {format(subtotal)}
					</p>
					{missing.length ? (
						<p className="artifact-caution">
							{missing.map((r) => r.id).join(", ")} ·{" "}
							{l("missing; complete total unavailable", "缺失，完整总量不可用")}
						</p>
					) : null}
					<Table className="artifact-source-table">
						<TableCaption>
							{l("Select a value to follow its source", "选择数值，追踪来源")}
						</TableCaption>
						<TableHeader>
							<TableRow>
								<TableHead>{l("Row", "行")}</TableHead>
								<TableHead>{l("Contracts", "张数")}</TableHead>
								<TableHead>{l("Price/share", "每股价格")}</TableHead>
								<TableHead>{l("Multiplier", "乘数")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((row) => (
								<TableRow key={row.id} data-selected={selected === row.id}>
									<TableHead scope="row">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => select(row.id)}
											aria-pressed={selected === row.id}
										>
											{row.id}
										</Button>
									</TableHead>
									<TableCell>{row.contracts ?? "—"}</TableCell>
									<TableCell>
										{row.priceCents === null ? "—" : `$${row.priceCents / 100}`}
									</TableCell>
									<TableCell>{row.multiplier ?? "—"}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
					<p className="artifact-calculation" data-source-calculation>
						{current
							? current.value === null
								? l(
										`${current.id}: the missing inputs prevent this calculation.`,
										`${current.id}：缺失输入，无法计算。`,
									)
								: metric === "premium"
									? `${current.id}: ${current.contracts} × $${(current.priceCents ?? 0) / 100} × ${current.multiplier} = ${format(current.value)}`
									: `${current.id}: ${current.contracts} ${l("observed contracts", "观测张数")}`
							: l(
									"The chart, subtotal and selected source row use the same authored record.",
									"图表、小计与选中来源行使用同一份教学记录。",
								)}
					</p>
				</>
			) : (
				<p className="outcome-note">
					{l(
						"The next step adds the supplied source rows.",
						"下一步加入给定来源行。",
					)}
				</p>
			)}
			{caption ? <p className="artifact-caption">{caption}</p> : null}
			<footer className="outcome-note">
				{l("Source", "来源")}: {record.method.source}
				<br />
				{l(
					"Same source case: Research packet → Recap → Audit. Teaching data; no report is published.",
					"同一来源案例：研究包 → 复盘 → 审核。教学数据，不发布报告。",
				)}
			</footer>
		</article>
	);
}
