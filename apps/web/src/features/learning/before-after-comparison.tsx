import { Button } from "@tradely/ui/components/button";
import { useState } from "react";
import type { Locale } from "@/i18n/messages";
export type ComparisonValue = {
	id: string;
	label: string;
	before: number | null;
	current: number | null;
	unit: string;
	format: (value: number) => string;
};
/** Callers define the comparable instrument, scope, units and method through comparisonKey. */
export function BeforeAfterComparison({
	locale,
	comparisonKey,
	values,
	note,
}: {
	locale: Locale;
	comparisonKey: string;
	values: readonly ComparisonValue[];
	note: string;
}) {
	const [pin, setPin] = useState<{
		key: string;
		values: Record<string, number | null>;
	} | null>(null);
	const pinned = pin?.key === comparisonKey;
	const l = (en: string, zh: string) => (locale === "zh" ? zh : en);
	return (
		<section
			className="comparison-panel"
			aria-label={l("Before and after", "原始与当前对照")}
		>
			<header>
				<h3>
					{pinned
						? l("Pinned comparison", "固定状态对照")
						: l("From the starting example", "与起始示例对照")}
				</h3>
				<Button
					size="sm"
					variant="ghost"
					onClick={() =>
						setPin(
							pinned
								? null
								: {
										key: comparisonKey,
										values: Object.fromEntries(
											values.map((v) => [v.id, v.current]),
										),
									},
						)
					}
				>
					{pinned
						? l("Use starting example", "使用起始示例")
						: l("Pin current values", "固定当前值")}
				</Button>
			</header>
			<table>
				<thead>
					<tr>
						<th>{l("Measure", "指标")}</th>
						<th>{l("Before", "原始")}</th>
						<th>{l("Current", "当前")}</th>
						<th>{l("Change", "变化")}</th>
					</tr>
				</thead>
				<tbody>
					{values.map((v) => {
						const before = pinned ? pin.values[v.id] : v.before;
						const valid =
							before !== null &&
							before !== undefined &&
							Number.isFinite(before) &&
							v.current !== null &&
							Number.isFinite(v.current);
						return (
							<tr key={v.id}>
								<th scope="row">
									{v.label}
									<small>{v.unit}</small>
								</th>
								<td>
									{before === null ||
									before === undefined ||
									!Number.isFinite(before)
										? "—"
										: v.format(before)}
								</td>
								<td>
									{v.current === null || !Number.isFinite(v.current)
										? "—"
										: v.format(v.current)}
								</td>
								<td data-comparison-delta={v.id}>
									{valid
										? v.format((v.current as number) - before)
										: l("Unavailable", "不可比较")}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
			<p className="outcome-note">{note}</p>
		</section>
	);
}
