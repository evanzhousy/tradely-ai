import { Alert, AlertDescription } from "@tradely/ui/components/alert";
import { Button } from "@tradely/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@tradely/ui/components/field";
import {
	NativeSelect,
	NativeSelectOption,
} from "@tradely/ui/components/native-select";
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
import { useCallback, useId, useMemo, useState } from "react";
import {
	deiMagnitude,
	gexScale,
	gexTotal,
	type MetricsComparison,
} from "@/domain/learning/metrics";
import type { Locale } from "@/i18n/messages";
import { CalculationTrace } from "./calculation-trace";
import type { RendererChange } from "./contract-explorer";
import { ChangeHighlight } from "./lesson-motion";
import { ThreeGexView } from "./three-gex-view";

export function MetricsExplorer({
	data,
	locale,
	allowThree = true,
	onRendererChange,
}: {
	data: MetricsComparison;
	locale: Locale;
	allowThree?: boolean;
	onRendererChange?: RendererChange;
}) {
	const [snapshot] = useState(data);
	const [denominator, setDenominator] = useState(snapshot.denominators[0]);
	const [distribution, setDistribution] = useState(0);
	const [days, setDays] = useState<number | null>(null);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [three, setThree] = useState(false);
	const [failed, setFailed] = useState(false);
	const id = useId();
	const text = (en: string, zh: string) => (locale === "zh" ? zh : en);
	const signed = (value: number | null) =>
		value === null
			? text("Unknown", "未知")
			: (value > 0 ? "+" : "") + value.toLocaleString(locale);
	const magnitude = deiMagnitude(snapshot.netDex, denominator);
	const current = snapshot.distributions[distribution];
	const cells = current.cells.filter(
		(cell) => days === null || cell.days === days,
	);
	const selected = cells.find((cell) => cell.id === selectedId);
	const maximum = gexScale(snapshot);
	const state = useMemo(
		() => ({ distribution, days, selectedId }),
		[distribution, days, selectedId],
	);
	const unavailable = useCallback(() => {
		setThree(false);
		setFailed(true);
		onRendererChange?.("2d", "unavailable");
	}, [onRendererChange]);
	return (
		<section
			className="flex min-w-0 flex-col gap-5"
			aria-label={text("Metric lenses lab", "指标实验")}
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<div>
					<p className="text-muted-foreground text-sm">
						{text(
							"Signed session DEX · share equivalents",
							"带符号时段 DEX · 股等价量",
						)}
					</p>
					<p className="font-mono text-3xl" data-net-dex>
						{signed(snapshot.netDex)}
					</p>
					<p className="text-xs">
						{snapshot.symbol} · {snapshot.sessionDate}
					</p>
				</div>
				<div>
					<p className="text-muted-foreground text-sm">
						{text("DEI magnitude · percent", "DEI 幅度 · 百分比")}
					</p>
					<p className="font-mono text-3xl" data-dei>
						<ChangeHighlight value={magnitude ?? "unknown"}>
							{magnitude === null
								? text("Unknown", "未知")
								: `${magnitude.toLocaleString(locale)}%`}
						</ChangeHighlight>
					</p>
					<p className="text-xs">
						{text(
							"|net DEX| ÷ positive effective denominator × 100",
							"|净 DEX| ÷ 正的有效分母 × 100",
						)}
					</p>
				</div>
			</div>
			<Field>
				<FieldLabel htmlFor={`${id}-denominator`}>
					{text("Effective denominator (shares)", "有效分母（股）")}
				</FieldLabel>
				<NativeSelect
					id={`${id}-denominator`}
					value={denominator}
					onChange={(event) => setDenominator(Number(event.target.value))}
				>
					{snapshot.denominators.map((value) => (
						<NativeSelectOption key={value} value={value}>
							{value > 0
								? value.toLocaleString(locale)
								: text("Unavailable / non-positive", "不可用 / 非正")}
						</NativeSelectOption>
					))}
				</NativeSelect>
			</Field>
			<CalculationTrace
				locale={locale}
				terms={[
					{
						id: "dex",
						label: text("|Net DEX|", "|净 DEX|"),
						value: Math.abs(snapshot.netDex).toLocaleString(locale),
					},
					{
						id: "denominator",
						label: text("Divide by shares", "除以股数"),
						value:
							denominator > 0
								? denominator.toLocaleString(locale)
								: text("Unknown", "未知"),
					},
					{ id: "scale", label: text("Multiply by", "乘以"), value: "100" },
					{
						id: "dei",
						label: text("DEI magnitude", "DEI 幅度"),
						value:
							magnitude === null
								? text("Unknown", "未知")
								: `${magnitude.toLocaleString(locale)}%`,
					},
				]}
			/>
			<p className="text-muted-foreground text-sm">
				{text(
					"Only normalization changes. The session observations and model snapshot stay fixed. This lesson uses non-negative DEI magnitude; signed DEX retains direction.",
					"只有归一化结果改变，时段观测与模型快照保持不变。本课使用非负 DEI 幅度，由带符号 DEX 保留方向。",
				)}
			</p>
			<h4 className="font-medium">
				{text("GEX distribution · model date ", "GEX 分布 · 模型日期 ")}
				{snapshot.modelDate}
			</h4>
			<p className="text-muted-foreground text-xs">
				{snapshot.modelNote[locale]}
			</p>
			<FieldGroup className="sm:flex-row">
				<Field>
					<FieldLabel>{text("Distribution", "分布")}</FieldLabel>
					<ToggleGroup
						value={[String(distribution)]}
						onValueChange={(values) => {
							if (values[0]) setDistribution(Number(values[0]));
						}}
						aria-label={text("GEX distribution", "GEX 分布")}
					>
						{snapshot.distributions.map((item, index) => (
							<ToggleGroupItem key={item.id} value={String(index)}>
								{item.label[locale]}
							</ToggleGroupItem>
						))}
					</ToggleGroup>
				</Field>
				<Field>
					<FieldLabel htmlFor={`${id}-expiry`}>
						{text("Expiry slice", "到期切片")}
					</FieldLabel>
					<NativeSelect
						id={`${id}-expiry`}
						value={days ?? "all"}
						onChange={(event) => {
							setDays(
								event.target.value === "all"
									? null
									: Number(event.target.value),
							);
							setSelectedId(null);
						}}
					>
						<NativeSelectOption value="all">
							{text("All expiries", "全部到期日")}
						</NativeSelectOption>
						{[...new Set(current.cells.map((cell) => cell.days))].map((day) => (
							<NativeSelectOption key={day} value={day}>
								{day} {text("days", "天")}
							</NativeSelectOption>
						))}
					</NativeSelect>
				</Field>
			</FieldGroup>
			<p role="status" className="text-sm">
				{text("Full-scope total: ", "完整范围总和：")}
				{signed(gexTotal(current.cells))} ·{" "}
				{text("Visible slice subtotal: ", "可见切片小计：")}
				{signed(gexTotal(cells))} {text("USD / 1% move", "美元 / 1% 变动")}
			</p>
			{allowThree ? (
				<ToggleGroup
					value={[three ? "3d" : "2d"]}
					aria-label={text("GEX view", "GEX 视图")}
					onValueChange={(values) => {
						if (!values[0]) return;
						const next = values[0] === "3d";
						setThree(next);
						setFailed(false);
						onRendererChange?.(next ? "3d" : "2d", "selected");
					}}
				>
					<ToggleGroupItem value="2d">
						{text("2D comparison", "二维比较")}
					</ToggleGroupItem>
					<ToggleGroupItem value="3d">
						{text("3D + comparison", "三维 + 比较")}
					</ToggleGroupItem>
				</ToggleGroup>
			) : null}
			{failed ? (
				<Alert>
					<AlertDescription>
						{text(
							"3D is unavailable. Your selection and the same signed observations remain in the table.",
							"三维视图不可用。选择状态和相同的带符号观测仍保留在表格中。",
						)}
					</AlertDescription>
				</Alert>
			) : null}
			{allowThree && three ? (
				<ThreeGexView
					data={snapshot}
					state={state}
					locale={locale}
					onSelect={setSelectedId}
					onUnavailable={unavailable}
				/>
			) : null}
			<p className="text-muted-foreground text-xs">
				{text(
					"Positive contributions extend above zero; negative contributions below. Missing is a ring in 3D and a dash in the table. Scale stays fixed across both distributions and all slices.",
					"正贡献位于零上方，负贡献位于零下方。缺失在三维中用圆环、表格中用横线表示。两种分布和所有切片使用固定比例尺。",
				)}
			</p>
			<Table aria-label={text("Signed GEX contributions", "带符号 GEX 贡献")}>
				<TableHeader>
					<TableRow>
						<TableHead>{text("Contract slice", "合约切片")}</TableHead>
						<TableHead>
							{text("GEX (USD / 1% move)", "GEX（美元 / 1% 变动）")}
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{cells.map((cell) => (
						<TableRow
							key={cell.id}
							data-state={selectedId === cell.id ? "selected" : undefined}
						>
							<TableCell>
								<Button
									variant={selectedId === cell.id ? "secondary" : "ghost"}
									aria-pressed={selectedId === cell.id}
									onClick={() => setSelectedId(cell.id)}
								>
									{"$"}
									{cell.strike} · {cell.days} {text("days", "天")}
								</Button>
							</TableCell>
							<TableCell>
								<ChangeHighlight value={cell.value ?? "missing"}>
									{cell.value === null ? "—" : signed(cell.value)}
								</ChangeHighlight>
								<div className="relative h-3 w-full" aria-hidden="true">
									<span className="absolute left-1/2 h-full border-foreground/40 border-l" />
									{cell.value !== null ? (
										<span
											className="absolute top-1 h-1 bg-chart-1"
											style={{
												left:
													cell.value < 0
														? `${50 - (Math.abs(cell.value) / maximum) * 50}%`
														: "50%",
												width: `${(Math.abs(cell.value) / maximum) * 50}%`,
											}}
										/>
									) : null}
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			{selected ? (
				<p role="status" className="text-sm">
					{text("Selected: ", "已选择：")}
					{"$"}
					{selected.strike} · {selected.days} {text("days", "天")} ·{" "}
					{signed(selected.value)} · {snapshot.modelDate}
				</p>
			) : null}
		</section>
	);
}
