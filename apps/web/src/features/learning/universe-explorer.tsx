import { Button } from "@tradely/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@tradely/ui/components/table";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@tradely/ui/components/toggle-group";
import { useState } from "react";
import {
	rankUniverse,
	type UniverseComparison,
} from "@/domain/learning/universe";
import type { Locale } from "@/i18n/messages";

export function UniverseExplorer({
	data,
	locale,
}: {
	data: UniverseComparison;
	locale: Locale;
}) {
	const [admitted, setAdmitted] = useState(data.rows.map((row) => row.symbol));
	const [changed, setChanged] = useState(false);
	const text = (en: string, zh: string) => (locale === "zh" ? zh : en);
	const ranked = rankUniverse(data, admitted, changed);
	return (
		<section
			className="flex min-w-0 flex-col gap-4"
			aria-label={text("Universe comparison", "范围比较")}
		>
			<p className="text-muted-foreground text-sm">{data.note[locale]}</p>
			<ToggleGroup
				multiple
				value={admitted}
				onValueChange={setAdmitted}
				aria-label={text("Admitted symbols", "纳入的标的")}
			>
				{data.rows.map((row) => (
					<ToggleGroupItem key={row.symbol} value={row.symbol}>
						{row.symbol}
					</ToggleGroupItem>
				))}
			</ToggleGroup>
			<Button variant="outline" onClick={() => setChanged(!changed)}>
				{changed
					? text("Restore original peers", "恢复原始同组值")
					: text(
							"Change peers; hold focal symbol fixed",
							"改变同组值，固定目标标的",
						)}
			</Button>
			<p role="status" className="text-sm">
				{text("Comparison denominator: ", "比较对象数：")}
				{ranked.length}{" "}
				{text(
					"symbols. Filters are exploratory; the assessment uses the declared rules.",
					"个标的。筛选用于探索，评估仍使用声明的规则。",
				)}
			</p>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{text("Rank", "排名")}</TableHead>
						<TableHead>{text("Symbol", "标的")}</TableHead>
						<TableHead>{text("Volume (contracts)", "成交量（张）")}</TableHead>
						<TableHead>{text("Quality", "质量")}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{ranked.map((row, index) => (
						<TableRow key={row.symbol}>
							<TableCell>{row.value === null ? "—" : index + 1}</TableCell>
							<TableCell>{row.symbol}</TableCell>
							<TableCell>{row.value?.toLocaleString(locale) ?? "—"}</TableCell>
							<TableCell>
								{!row.eligible
									? text("Outside scope", "范围外")
									: !row.fresh
										? text("Stale", "过时")
										: row.value === null
											? text("Missing", "缺失")
											: text("Comparable", "可比")}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			{!ranked.length ? (
				<p>
					{text(
						"No symbols admitted. A rank cannot be calculated.",
						"未纳入标的，无法计算排名。",
					)}
				</p>
			) : null}
		</section>
	);
}
