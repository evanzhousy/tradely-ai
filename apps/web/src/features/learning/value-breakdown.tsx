import { useId } from "react";
import type { Locale } from "@/i18n/messages";

export type ValuePart = { id: string; label: string; value: number | null };
export function ValueBreakdown({
	title,
	parts,
	total,
	format,
	unit,
	note,
}: {
	title: string;
	parts: readonly ValuePart[];
	total: number | null;
	format: (value: number) => string;
	unit: string;
	note: string;
}) {
	const max = Math.max(1, ...parts.map((p) => Math.abs(p.value ?? 0)));
	return (
		<section className="breakdown-panel" aria-label={title}>
			<h3>{title}</h3>
			<p className="outcome-note">{unit}</p>
			<dl>
				{parts.map((p) => (
					<div
						className="breakdown-row"
						key={p.id}
						data-tone={
							p.value === null ? "unknown" : p.value < 0 ? "loss" : "gain"
						}
					>
						<dt>{p.label}</dt>
						<dd>{p.value === null ? "—" : format(p.value)}</dd>
						<span
							className="breakdown-bar"
							aria-hidden="true"
							style={{ width: `${(Math.abs(p.value ?? 0) / max) * 100}%` }}
						/>
					</div>
				))}
			</dl>
			<p className="breakdown-total">{total === null ? "—" : format(total)}</p>
			<p className="outcome-note">{note}</p>
		</section>
	);
}

export function ContributionWaterfall({
	locale,
	parts,
	total,
	format,
	unit,
	note,
}: {
	locale: Locale;
	parts: readonly ValuePart[];
	total: number | null;
	format: (n: number) => string;
	unit: string;
	note: string;
}) {
	const id = useId();
	const complete = parts.every((p) => p.value !== null);
	let sum = 0;
	const rows = parts.map((p) => {
		const start = complete ? sum : 0;
		sum += p.value ?? 0;
		return { ...p, start, end: complete ? sum : (p.value ?? 0) };
	});
	const min = Math.min(0, ...rows.flatMap((r) => [r.start, r.end]));
	const max = Math.max(1, ...rows.flatMap((r) => [r.start, r.end]));
	const x = (n: number) => 30 + ((n - min) / (max - min)) * 300;
	return (
		<section
			className="breakdown-panel"
			aria-label={
				locale === "zh" ? "变化贡献分解" : "Contributions to the change"
			}
		>
			<h3>{locale === "zh" ? "变化从哪里来" : "What drives the change"}</h3>
			<p className="outcome-note">
				{unit} ·{" "}
				{complete
					? locale === "zh"
						? "累计贡献"
						: "Cumulative contributions"
					: locale === "zh"
						? "仅显示已知贡献"
						: "Known contributions only"}
			</p>
			<svg
				viewBox={`0 0 360 ${rows.length * 70 + 30}`}
				role="img"
				aria-labelledby={id}
			>
				<title id={id}>
					{parts
						.map(
							(p) => `${p.label}: ${p.value === null ? "—" : format(p.value)}`,
						)
						.join("; ")}
				</title>
				<path
					d={`M${x(0)} 20V${rows.length * 70}`}
					stroke="var(--muted-foreground)"
					strokeDasharray="3 4"
				/>
				{rows.map((r, i) => (
					<g key={r.id}>
						<text x="30" y={i * 70 + 20}>
							{r.label}
						</text>
						<text x="330" y={i * 70 + 20} textAnchor="end">
							{r.value === null ? "—" : format(r.value)}
						</text>
						{r.value === null ? (
							<path d={`M30 ${i * 70 + 38}h300`} className="diagram-boundary" />
						) : (
							<rect
								x={Math.min(x(r.start), x(r.end))}
								y={i * 70 + 32}
								width={Math.max(1, Math.abs(x(r.end) - x(r.start)))}
								height="20"
								rx="3"
								fill={
									r.value < 0 ? "var(--diagram-loss)" : "var(--diagram-gain)"
								}
							/>
						)}
					</g>
				))}
			</svg>
			<p className="breakdown-total">
				{total === null
					? locale === "zh"
						? "合计不可用"
						: "Total unavailable"
					: format(total)}
			</p>
			<p className="outcome-note">{note}</p>
		</section>
	);
}
