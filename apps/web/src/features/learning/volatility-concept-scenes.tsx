import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { Button } from "@tradely/ui/components/button";
import { FieldGroup } from "@tradely/ui/components/field";
import * as m from "motion/react-m";
import { createContext, useContext, useState } from "react";
import {
	compareVolatility,
	inferAtmIv,
	priceAtmCall,
	realizedVolatility,
	type VolatilityConceptData,
} from "@/domain/learning/volatility-concept";
import type { Locale } from "@/i18n/messages";
import {
	Diagram,
	RangeControl,
	SceneLayout,
	SelectField,
	SvgText,
} from "./concept-scene";
import {
	instantTransition,
	lessonTransition,
	useLessonMotion,
} from "./lesson-motion";

export const VolatilityData = createContext<VolatilityConceptData | null>(null);
function useData() {
	const data = useContext(VolatilityData);
	if (!data)
		throw new Error("Volatility scenes require authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const copy = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const tidy = (value: number) => (Math.abs(value) < 1e-9 ? 0 : value);
const number = (value: number | null, digits = 4) =>
	value === null
		? "—"
		: tidy(value).toLocaleString("en-US", { maximumFractionDigits: digits });
const signed = (value: number | null) =>
	value === null
		? "—"
		: `${tidy(value) > 0 ? "+" : tidy(value) < 0 ? "−" : ""}${number(Math.abs(value))}`;
const pct = (value: number | null, digits = 4) =>
	value === null ? "—" : `${number(value, digits)}%`;
const money = (cents: number | null) =>
	cents === null ? "—" : `$${(cents / 100).toFixed(2)}`;

export function ImpliedVolatilityScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const motion = useLessonMotion();
	const model = data.model;
	const [source, setSource] = useState(model.prices[0].id);
	const [days, setDays] = useState(model.defaultDays);
	const [iv, setIv] = useState(model.initialIv);
	const [fitting, setFitting] = useState(false);
	const quote = model.prices.find((p) => p.id === source) ?? model.prices[0];
	const price = priceAtmCall(model.spotCents, days, iv);
	const fit = inferAtmIv(model.spotCents, days, quote.cents, model.ivRange);
	const matched =
		price !== null &&
		quote.cents !== null &&
		Math.abs(price - quote.cents) < 0.5;
	const x = (v: number) =>
		40 + ((v - model.ivRange[0]) / (model.ivRange[1] - model.ivRange[0])) * 280;
	const y = (v: number) => 265 - (v / model.priceCeilingCents) * 210;
	const points = Array.from(
		{ length: 41 },
		(_, i) =>
			model.ivRange[0] + ((model.ivRange[1] - model.ivRange[0]) * i) / 40,
	).map((v) => ({ iv: v, price: priceAtmCall(model.spotCents, days, v) }));
	const changeIv = (value: number) => {
		setFitting(false);
		setIv(value);
	};
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Infer volatility by matching a model to a supplied price",
						"匹配模型与给定价格来反推波动率",
					)}
					height={455}
				>
					<SvgText x={180} y={25} muted>
						{l("Model price per option unit", "每单位期权模型价格")}
					</SvgText>
					<path d="M40 55V265H320" className="contract-svg-line" />
					<SvgText x={180} y={48} muted>
						{money(model.priceCeilingCents)}
					</SvgText>
					<SvgText x={180} y={287} muted>
						{money(0)}
					</SvgText>
					{points.every((p) => p.price !== null) ? (
						<path
							d={points
								.map(
									(p, i) =>
										`${i ? "L" : "M"}${x(p.iv)} ${y(p.price as number)}`,
								)
								.join(" ")}
							className="contract-svg-active-line"
						/>
					) : null}
					{quote.cents !== null ? (
						<path
							d={`M40 ${y(quote.cents)}H320`}
							className="contract-svg-line"
							strokeDasharray="5 4"
						/>
					) : null}
					{price !== null ? (
						<m.circle
							initial={false}
							cx={x(iv)}
							cy={y(price)}
							r="9"
							animate={{ cx: x(iv), cy: y(price) }}
							transition={
								fitting && motion ? lessonTransition : instantTransition
							}
							className="contract-svg-handle"
						/>
					) : null}
					<SvgText x={50} y={316} muted>
						{pct(model.ivRange[0])}
					</SvgText>
					<SvgText x={310} y={316} muted>
						{pct(model.ivRange[1])}
					</SvgText>
					<path d="M40 344H320" className="contract-svg-line" />
					<circle cx={x(iv)} cy="344" r="9" className="contract-svg-handle" />
					<foreignObject x="20" y="304" width="320" height="80">
						<input
							type="range"
							className="contract-range contract-svg-range"
							aria-label={l("Drag trial IV", "拖动试算 IV")}
							aria-valuetext={pct(iv, 2)}
							min={model.ivRange[0]}
							max={model.ivRange[1]}
							step={0.01}
							value={iv}
							onChange={(e) => changeIv(Number(e.target.value))}
						/>
					</foreignObject>
					<g data-vol-trial>
						<SvgText x={180} y={394}>
							{l("Trial IV", "试算 IV")}: {pct(iv, 2)}
						</SvgText>
					</g>
					<SvgText x={180} y={431} muted>
						{l("Dashed line: selected price", "虚线：选定价格")}
					</SvgText>
				</Diagram>
			}
		>
			<p className="font-mono text-muted-foreground text-xs leading-relaxed">
				{model.label}
				<br />
				{data.asOf}
				<br />S = K = {money(model.spotCents)}
				<br />
				{l(
					"Rate = dividend yield = 0 · ACT/365",
					"利率 = 股息率 = 0 · ACT/365",
				)}
			</p>
			<FieldGroup>
				<SelectField
					label={l("Price input", "价格输入")}
					value={source}
					options={model.prices.map((p) => [
						p.id,
						p.label[locale === "zh" ? 1 : 0],
					])}
					onChange={(value) => {
						setFitting(false);
						setSource(value);
					}}
				/>
				<SelectField
					label={l("Assumed calendar days to expiry", "假设到期自然日数")}
					value={String(days)}
					options={model.days.map((d) => [
						String(d),
						`${d} ${l("calendar days", "自然日")}`,
					])}
					onChange={(value) => {
						setFitting(false);
						setDays(Number(value));
					}}
				/>
				<RangeControl
					label={l("Trial annualized IV", "试算年化 IV")}
					value={iv}
					display={pct(iv, 2)}
					min={model.ivRange[0]}
					max={model.ivRange[1]}
					step={0.01}
					onChange={changeIv}
				/>
			</FieldGroup>
			<Button
				disabled={fit === null}
				onClick={() => {
					if (fit !== null) {
						setFitting(true);
						setIv(Math.round(fit * 100) / 100);
					}
				}}
			>
				{l("Fit IV to this price", "拟合此价格的 IV")}
			</Button>
			<div className="grid grid-cols-2 gap-3 text-sm">
				<p data-vol-quote>
					{l("Supplied price", "给定价格")}
					<br />
					<strong>{money(quote.cents)}</strong>
				</p>
				<p data-vol-model-price>
					{l("Model price", "模型价格")}
					<br />
					<strong>{money(price)}</strong>
				</p>
			</div>
			<p data-vol-fit-status className="text-sm">
				{quote.cents === null
					? l(
							"Price unavailable: IV cannot be inferred",
							"价格不可用：无法反推 IV",
						)
					: fit === null
						? l("No fit within the declared IV range", "声明 IV 范围内无解")
						: matched
							? l(
									"Matches to the supplied cent precision",
									"匹配给定的美分精度",
								)
							: l("Adjust IV or fit the model", "调整 IV 或拟合模型")}
			</p>
			<Alert role="note">
				<AlertTitle>
					{l("IV is inferred through a model", "IV 通过模型反推")}
				</AlertTitle>
				<AlertDescription>
					{l(
						"The observed input here is a supplied price; IV is the model input that reproduces it. Bid, ask and last can imply different IVs. Changing the hypothetical maturity changes the fit. These are what-if assumptions for a European ATM call with zero rates and dividends, not editable terms of a real contract or observed future volatility.",
						"此处给定观测输入是价格；IV 是令模型复现该价格的输入。买价、卖价与最新成交价可对应不同 IV。改变假设期限会改变拟合。这是零利率、零股息欧式平值看涨的假设，不是可任意修改的真实合约条款，也不是已观测未来波动率。",
					)}
				</AlertDescription>
			</Alert>
		</SceneLayout>
	);
}

export function RealizedVolatilityScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const source = data.returns;
	const [windowSize, setWindow] = useState(source.windows[0]);
	const [sampling, setSampling] = useState<1 | 2>(1);
	const [last, setLast] = useState(
		source.values[source.values.length - 1].percent,
	);
	const [coverage, setCoverage] = useState("complete");
	const selected = source.values.slice(-windowSize);
	const inputs = selected.map((r, i) =>
		i === selected.length - 1
			? coverage === "missing"
				? null
				: last
			: r.percent,
	);
	const result = realizedVolatility(inputs, sampling, source.sessionsPerYear);
	const samples = result?.sampled ?? [];
	const x = (i: number) => 40 + (i / Math.max(1, samples.length - 1)) * 280;
	const y = (value: number) => 165 - (value / source.chartLimit) * 105;
	const lastX =
		40 +
		(((last ?? 0) - source.changeRange[0]) /
			(source.changeRange[1] - source.changeRange[0])) *
			280;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Realized volatility from sampled historical returns",
						"根据历史收益采样计算已实现波动率",
					)}
					height={465}
				>
					<SvgText x={180} y={25} muted>
						{l("Return per sampled observation", "每个采样观测的收益")}
					</SvgText>
					<SvgText x={180} y={49} muted>
						±{source.chartLimit}%
					</SvgText>
					<path d="M40 165H320" className="contract-svg-line" />
					{samples.map((value, i) => (
						<g
							key={
								selected[Math.min(selected.length - 1, (i + 1) * sampling - 1)]
									.date
							}
						>
							{value === null ? (
								<SvgText x={x(i)} y={155} muted>
									—
								</SvgText>
							) : (
								<>
									<rect
										x={x(i) - 10}
										y={Math.min(165, y(value))}
										width="20"
										height={Math.abs(y(value) - 165)}
										className="contract-svg-wash"
									/>
									<circle
										cx={x(i)}
										cy={y(value)}
										r="3"
										className="contract-svg-dot"
									/>
									<SvgText
										x={x(i)}
										y={value >= 0 ? y(value) - 10 : y(value) + 20}
										muted
									>
										{pct(value)}
									</SvgText>
								</>
							)}
							<SvgText x={x(i)} y={297} muted>
								{i + 1}
							</SvgText>
						</g>
					))}
					<path d="M40 340H320" className="contract-svg-line" />
					{coverage !== "missing" && last !== null ? (
						<circle cx={lastX} cy="340" r="9" className="contract-svg-handle" />
					) : null}
					<foreignObject x="20" y="300" width="320" height="80">
						<input
							type="range"
							className="contract-range contract-svg-range"
							aria-label={l("Drag final daily return", "拖动最后日收益")}
							aria-valuetext={pct(last)}
							min={source.changeRange[0]}
							max={source.changeRange[1]}
							step={0.25}
							value={last ?? 0}
							disabled={coverage === "missing" || last === null}
							onChange={(e) => setLast(Number(e.target.value))}
						/>
					</foreignObject>
					<SvgText x={180} y={390}>
						{l("Hypothetical final daily return", "假设最后日收益")}:{" "}
						{coverage === "missing" || last === null ? "—" : pct(last)}
					</SvgText>
					<g data-vol-rv>
						<SvgText x={180} y={439} strong>
							{pct(result?.annualized ?? null)}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<p className="font-mono text-muted-foreground text-xs leading-relaxed">
				{source.symbol}
				<br />
				{selected[0].date} → {selected[selected.length - 1].date}
				<br />
				{l(
					"Simple close-to-close percentage returns",
					"简单收盘到收盘百分比收益",
				)}
			</p>
			<FieldGroup>
				<SelectField
					label={l("Lookback window", "回看窗口")}
					value={String(windowSize)}
					options={source.windows.map((n) => [
						String(n),
						`${n} ${l("trading sessions", "交易时段")}`,
					])}
					onChange={(value) => setWindow(Number(value))}
				/>
				<SelectField
					label={l("Sampling interval", "采样间隔")}
					value={String(sampling)}
					options={[
						["1", l("Every trading session", "每个交易时段")],
						["2", l("Every two trading sessions", "每两个交易时段")],
					]}
					onChange={(value) => setSampling(Number(value) as 1 | 2)}
				/>
				<SelectField
					label={l("Return coverage", "收益覆盖")}
					value={coverage}
					options={[
						[
							"complete",
							l("All selected returns supplied", "选定收益均已提供"),
						],
						["missing", l("Final return withheld", "最后收益被隐藏")],
					]}
					onChange={setCoverage}
				/>
			</FieldGroup>
			<div className="grid grid-cols-2 gap-3 text-sm">
				<p>
					{l("Sampled observations", "采样观测数")}
					<br />
					{samples.length}
				</p>
				<p>
					{l("Periods per year", "每年观测期数")}
					<br />
					{number(result?.periodsPerYear ?? null)}
				</p>
				<p data-vol-sd>
					{l("Sample standard deviation", "样本标准差")}
					<br />
					<strong>{pct(result?.standardDeviation ?? null)}</strong>
				</p>
				<p>
					{l("Mean return per observation", "每观测平均收益")}
					<br />
					{pct(result?.mean ?? null)}
				</p>
			</div>
			<p className="text-sm">
				{l(
					"Annualized RV = sample SD × √periods per year",
					"年化 RV = 样本标准差 × √每年观测期数",
				)}
			</p>
			<Alert role="note">
				<AlertTitle>
					{l(
						"Window, sampling and annualization all matter",
						"窗口、采样与年化均重要",
					)}
				</AlertTitle>
				<AlertDescription>
					{l(
						"The sample standard deviation uses n−1. Two-session returns compound adjacent daily returns, and use half as many annual periods. Coarser sampling can hide intermediate moves. The last-return control is a hypothetical edit; missing observations are not dropped or filled with zero. These short synthetic samples teach the calculation, not a reliable forecast.",
						"样本标准差使用 n−1。双时段收益复合相邻日收益，并使用一半的年度观测期数。较粗采样可能掩盖中间变动。最后收益控制为假设修改；缺失观测既不删除，也不填零。这些短模拟样本用于教学计算，不是可靠预测。",
					)}
				</AlertDescription>
			</Alert>
		</SceneLayout>
	);
}

export function VolatilityHorizonsScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [id, setId] = useState(data.pairs[0].id);
	const pair = data.pairs.find((p) => p.id === id) ?? data.pairs[0];
	const result = compareVolatility(pair);
	const issues = {
		identity: l("Underlying identities differ", "标的身份不同"),
		date: l("As-of dates differ", "截至日期不同"),
		definition: l(
			"Required horizon, sampling or annualization is missing or mismatched",
			"所需范围、采样或年化定义缺失或不匹配",
		),
		missing: l("A required value is missing or invalid", "所需数值缺失或无效"),
	};
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Forward implied and backward realized horizons",
						"向前隐含与向后已实现范围",
					)}
					height={475}
				>
					<SvgText x={180} y={24} muted>
						{l("Horizon schematic · not to scale", "范围示意 · 非比例尺")}
					</SvgText>
					<path
						d="M180 64V175M180 74H320M180 147H40"
						className="contract-svg-line"
					/>
					<path
						d="M310 68l10 6-10 6M50 141l-10 6 10 6"
						className="contract-svg-active-line"
					/>
					<SvgText x={180} y={58}>
						{l("Each source's as-of date", "各来源截至日期")}
					</SvgText>
					<SvgText x={247} y={103} muted>
						{pair.iv.days ?? "?"} {l("calendar days →", "自然日 →")}
					</SvgText>
					<SvgText x={100} y={132} muted>
						← {pair.rv.sessions ?? "?"} {l("sessions", "时段")}
					</SvgText>
					{[
						[
							`IV${pair.iv.days ?? "?"}`,
							pair.iv.annualized ? pair.iv.value : null,
						],
						[
							pair.rv.sessions === null || pair.rv.method === null
								? l("Historical vol", "历史波动率")
								: `RV${pair.rv.sessions}`,
							pair.rv.annualized ? pair.rv.value : null,
						],
					].map(([label, value], i) => (
						<g key={String(label)}>
							<SvgText x={180} y={215 + i * 75}>
								{label} · {pct(value as number | null)}
							</SvgText>
							<path
								d={`M40 ${243 + i * 75}H320`}
								className="contract-svg-line"
							/>
							{value !== null ? (
								<rect
									x="40"
									y={234 + i * 75}
									width={(Number(value) / 60) * 280}
									height="18"
									rx="4"
									className="contract-svg-wash"
								/>
							) : null}
						</g>
					))}
					<SvgText x={180} y={350} muted>
						{l("Common annualized scale: 0–60%", "共同年化尺度：0–60%")}
					</SvgText>
					<rect
						x="14"
						y="378"
						width="332"
						height="77"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={404} muted>
						{l("IV30 − RV20 · volatility points", "IV30 − RV20 · 波动率点")}
					</SvgText>
					<g data-vol-spread>
						<SvgText x={180} y={438} strong>
							{signed(result.points)}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<SelectField
				label={l("Reference comparison", "参考比较")}
				value={id}
				options={data.pairs.map((p) => [
					p.id,
					p.label[locale === "zh" ? 1 : 0],
				])}
				onChange={setId}
			/>
			<div className="space-y-3 font-mono text-xs">
				<p>
					IV{pair.iv.days ?? "?"} · {pair.iv.symbol} · {pair.iv.asOf}
					<br />
					{pair.iv.annualized
						? l("Supplied annualized implied reference", "给定年化隐含参考")
						: l("Annualization unspecified", "年化未说明")}
				</p>
				<p>
					{pair.rv.sessions === null || pair.rv.method === null
						? l("Historical volatility", "历史波动率")
						: `RV${pair.rv.sessions}`}{" "}
					· {pair.rv.symbol} · {pair.rv.asOf}
					<br />
					{pair.rv.annualized
						? l("Supplied annualized historical reference", "给定年化历史参考")
						: l("Annualization unspecified", "年化未说明")}
				</p>
			</div>
			<p className="text-muted-foreground text-xs">
				{pair.rv.method === "daily-sample"
					? l(
							"Simple daily close-to-close returns · sample SD (n−1)",
							"简单日收盘到收盘收益 · 样本标准差（n−1）",
						)
					: l("Sampling and estimator not supplied", "未提供采样与估计方法")}
				<br />
				{l("RV annualization periods", "RV 年化观测期数")}:{" "}
				{number(pair.rv.periodsPerYear)}
			</p>
			<p data-vol-relative className="text-sm">
				{l("Relative to RV (%)", "相对 RV（%）")}:{" "}
				{signed(result.relativePercent)}
			</p>
			<p data-vol-comparison-status className="text-sm">
				{result.issue
					? issues[result.issue]
					: l(
							"Defined comparison; different horizons remain",
							"比较定义完整，但时间范围仍不同",
						)}
			</p>
			<Alert role="note">
				<AlertTitle>
					{l(
						"A volatility spread is context, not a return",
						"波动率差是上下文，并非收益",
					)}
				</AlertTitle>
				<AlertDescription>
					{l(
						"IV30 is a standardized forward 30-calendar-day reference; RV20 looks back over 20 trading sessions. This question requires the same underlying and as-of date, plus a defined 30-day implied reference and a daily close-to-close RV20 using sample SD and 252 annual periods. A vendor's unspecified historical-volatility number cannot silently become RV20. The difference is volatility points, not a stock-return forecast or certain mispricing.",
						"IV30 是标准化向前 30 自然日参考；RV20 回看 20 个交易时段。本问题要求相同标的、截至日期、定义明确的 30 天隐含参考及使用样本标准差与 252 年度观测期的日收盘到收盘 RV20。供应商未说明定义的历史波动率不能自动变成 RV20。差值是波动率点，不是股票收益预测或确定错误定价。",
					)}
				</AlertDescription>
			</Alert>
			<p className="text-muted-foreground text-xs">
				{l(
					"These are independent supplied reference examples. RV20 is not calculated from the earlier 4/8-session exercise, and IV30 is not necessarily the IV of one listed option. A valid comparison does not make forward-implied and backward-realized estimates the same quantity.",
					"这些是独立给定参考示例。RV20 并非来自前面的 4/8 时段练习，IV30 也不一定是单一挂牌期权的 IV。比较有效不代表向前隐含与向后已实现估计成为同一种量。",
				)}
			</p>
		</SceneLayout>
	);
}
