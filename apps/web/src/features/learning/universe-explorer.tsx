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
import * as m from "motion/react-m";
import { useState } from "react";
import {
	ChangeHighlight,
	instantTransition,
	lessonTransition,
	useLessonMotion,
} from "./lesson-motion";

// Keep layout measurement enabled; transitions implement the live motion policy.
const AnimatedTableRow = m.create(TableRow);

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
	const motionEnabled = useLessonMotion();
	const focal = data.rows[0];
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
			{focal ? (
				<div
					className="rounded-xl bg-muted/50 px-3 py-2 text-sm"
					data-focal-observation
				>
					<span className="text-muted-foreground">
						{text("Focal observation", "目标观测")}:{" "}
					</span>
					<strong>{focal.symbol}</strong> ·{" "}
					<span className="font-mono" data-focal-volume>
						{(changed ? focal.peerVolume : focal.volume)?.toLocaleString(
							locale,
						) ?? "—"}
					</span>{" "}
					{text(
						"contracts · same observation while peers change",
						"张 · 同组变化时，该观测保持不变",
					)}
				</div>
			) : null}
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
						<AnimatedTableRow
							key={row.symbol}
							data-rank-symbol={row.symbol}
							layout="position"
							layoutDependency={String(changed) + admitted.join("|")}
							initial={false}
							transition={motionEnabled ? lessonTransition : instantTransition}
						>
							<TableCell>{row.value === null ? "—" : index + 1}</TableCell>
							<TableCell>{row.symbol}</TableCell>
							<TableCell>
								<ChangeHighlight value={row.value ?? "missing"}>
									{row.value?.toLocaleString(locale) ?? "—"}
								</ChangeHighlight>
							</TableCell>
							<TableCell>
								{!row.eligible
									? text("Outside scope", "范围外")
									: !row.fresh
										? text("Stale", "过时")
										: row.value === null
											? text("Missing", "缺失")
											: text("Comparable", "可比")}
							</TableCell>
						</AnimatedTableRow>
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
