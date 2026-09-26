import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { Badge } from "@tradely/ui/components/badge";
import { Button } from "@tradely/ui/components/button";
import { FieldGroup } from "@tradely/ui/components/field";
import { RangeSlider } from "@tradely/ui/components/slider";
import { Toolbar } from "@tradely/ui/components/toolbar";
import * as m from "motion/react-m";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/messages";
import { BeforeAfterComparison } from "./before-after-comparison";
import { CalculationTrace } from "./calculation-trace";
import {
	ChoiceField,
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
import {
	expirationOutcome,
	moneyness,
	type PayoffType,
	payoffChart,
	payoffPath,
	payoffTerms,
	premiumAmounts,
	premiumExamples,
	valueParts,
	writerChart,
	writerOutcome,
	writerPath,
} from "./payoff-concept-model";
import { SceneOutcome } from "./scene-outcome";
import { ValueBreakdown } from "./value-breakdown";
import { useGuidedState } from "./visual-playback";

type Props = { locale: Locale };
const text = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
function money(
	cents: number,
	locale: Locale,
	digits = cents % 100 === 0 ? 0 : 2,
) {
	return `${cents < 0 ? "−" : ""}$${(Math.abs(cents) / 100).toLocaleString(locale === "zh" ? "zh-CN" : "en-US", { minimumFractionDigits: digits, maximumFractionDigits: 2 })}`;
}

function TypeField({
	locale,
	type,
	onChange,
}: Props & { type: PayoffType; onChange: (type: PayoffType) => void }) {
	const l = text(locale);
	return (
		<ChoiceField
			label={l("Option type", "期权类型")}
			value={type}
			onChange={onChange}
			options={[
				["CALL", l("Call", "看涨")],
				["PUT", l("Put", "看跌")],
			]}
		/>
	);
}

export function PremiumUnitsScene({ locale }: Props) {
	const l = text(locale);
	const motion = useLessonMotion();
	const [paid, setPaid] = useGuidedState(300, [300, 300, 450]);
	const [count, setCount] = useGuidedState(2, [1, 2, 2]);
	const amounts = premiumAmounts(paid, count);
	const rows = [
		{
			label: l("Option price / share", "期权价格 / 股"),
			value: money(paid, locale, 2),
		},
		{
			label: l("Premium / contract", "权利金 / 张"),
			value: money(amounts.perContract, locale),
		},
		{
			label: l("Total premium", "总权利金"),
			value: money(amounts.total, locale),
		},
	];
	return (
		<SceneLayout
			comparison={
				<BeforeAfterComparison
					locale={locale}
					comparisonKey="ALFA-premium-v1"
					values={[
						{
							id: "premium",
							label: l("Premium", "权利金"),
							before: 30000,
							current: amounts.total,
							unit: "USD",
							format: (n) => money(n, locale),
						},
						{
							id: "notional",
							label: l("Notional", "名义金额"),
							before: 1000000,
							current: amounts.notional,
							unit: "USD",
							format: (n) => money(n, locale),
						},
					]}
					note={l(
						"Starting example: one contract at $3/share, multiplier 100, underlying $100. Notional is not purchase cost.",
						"起始示例：一张，每股 $3、乘数 100、标的 $100。名义金额不是购买成本。",
					)}
				/>
			}
			diagram={
				<Diagram
					label={l(
						"Price becomes premium through explicit units",
						"通过明确单位，将价格换算为权利金",
					)}
					height={420}
				>
					<SvgText x={180} y={26} muted>
						{l("ALFA · stated multiplier 100", "ALFA · 给定乘数 100")}
					</SvgText>
					{rows.map((row, i) => (
						<g key={row.label}>
							<rect
								x="35"
								y={48 + i * 95}
								width="290"
								height="72"
								rx="12"
								className={i === 2 ? "contract-svg-wash" : "contract-svg-paper"}
							/>
							<SvgText x={180} y={72 + i * 95} muted>
								{row.label}
							</SvgText>
							<SvgText x={180} y={104 + i * 95} strong>
								{row.value}
							</SvgText>
							{i < 2 ? (
								<>
									<path
										d={`M180 ${120 + i * 95}v23`}
										className="contract-svg-line"
									/>
									<SvgText x={267} y={138 + i * 95} muted>
										× {i === 0 ? 100 : count}
									</SvgText>
								</>
							) : null}
						</g>
					))}
					<m.path
						key={`${paid}:${count}`}
						d="M180 120v23M180 215v23"
						className="contract-svg-active-line"
						initial={{ pathLength: motion ? 0 : 1 }}
						animate={{ pathLength: 1 }}
						transition={motion ? lessonTransition : instantTransition}
					/>
					<SvgText x={180} y={354} muted>
						{l("Referenced underlying notional", "参考标的名义金额")}
					</SvgText>
					<SvgText x={180} y={386} strong>
						{money(amounts.notional, locale)}
					</SvgText>
					<SvgText x={180} y={410} muted>
						{l("Entry stock price $100", "入场时股价 $100")}
					</SvgText>
				</Diagram>
			}
			outcome={
				<SceneOutcome
					locale={locale}
					items={[
						{
							id: "result-1",
							label: <>{l("Total premium", "总权利金")}</>,
							value: <>{money(amounts.total, locale)}</>,
						},
						{
							id: "result-2",
							label: <>{l("Per contract", "每张合约")}</>,
							value: <>{money(amounts.perContract, locale)}</>,
						},
						{
							id: "result-3",
							label: <>{l("Referenced notional", "参考名义金额")}</>,
							value: <>{money(amounts.notional, locale)}</>,
						},
					]}
				/>
			}
			controls={
				<FieldGroup>
					<RangeControl
						inputScale={100}
						label={l("Option price per share", "每股期权价格")}
						value={paid}
						display={money(paid, locale, 2)}
						min={100}
						max={600}
						step={25}
						onChange={setPaid}
					/>
					<RangeControl
						inputScale={1}
						label={l("Contract quantity", "合约张数")}
						value={count}
						display={String(count)}
						min={1}
						max={3}
						onChange={setCount}
					/>
				</FieldGroup>
			}
			details={
				<>
					<div aria-live="polite" className="flex flex-col gap-3">
						<p className="font-mono text-3xl" data-total-premium>
							{money(amounts.total, locale)}
						</p>
						<p className="text-muted-foreground text-sm leading-7">
							{l(
								"Total premium at this option price, before fees. Changing the option price changes the premium, but leaves the entry stock price and referenced notional unchanged.",
								"按该期权价格计算的总权利金，不含费用。改变期权价格会改变权利金，但入场股价与参考名义金额保持不变。",
							)}
						</p>
						<p className="text-sm" data-entry-notional>
							{l("Referenced notional", "参考名义金额")}:{" "}
							{money(amounts.notional, locale)}
						</p>
					</div>
					<CalculationTrace
						locale={locale}
						terms={[
							{
								id: "price",
								label: l("Price / share", "价格 / 股"),
								value: money(paid, locale, 2),
							},
							{
								id: "multiplier",
								label: l("Multiplier", "乘数"),
								value: "100",
							},
							{
								id: "count",
								label: l("Contracts", "张数"),
								value: String(count),
							},
							{
								id: "premium",
								label: l("Premium", "权利金"),
								value: money(amounts.total, locale),
							},
						]}
					/>
					<Alert>
						<AlertTitle>
							{l(
								"These amounts describe different things",
								"这些金额描述不同的东西",
							)}
						</AlertTitle>
						<AlertDescription>
							{l(
								"Notional uses the entry stock price ($100 × 100 × contracts). It is not the option purchase cost, profit, or delta-equivalent exposure. The multiplier is a stated term of this teaching example.",
								"名义金额使用入场股价（$100 × 100 × 张数），不是期权购买成本、利润或 Delta 等价敞口。乘数是本教学示例明确给定的条款。",
							)}
						</AlertDescription>
					</Alert>
				</>
			}
		/>
	);
}

export function ValuePartsScene({ locale }: Props) {
	const l = text(locale);
	const motion = useLessonMotion();
	const [type, setType] = useState<PayoffType>("CALL");
	const [index, setIndex] = useGuidedState(2, [0, 2, 2]);
	const [timing, setTiming] = useGuidedState("before", [
		"before",
		"before",
		"expiry",
	]);
	const example = premiumExamples[index];
	const parts = valueParts(type, example, timing === "expiry");
	const width = (cents: number) => (cents / 600) * 280;
	return (
		<SceneLayout
			companion={
				<ValueBreakdown
					title={l("Option value explained", "期权价值拆解")}
					parts={[
						{
							id: "intrinsic",
							label: l("Intrinsic", "内在价值"),
							value: parts.intrinsic,
						},
						{
							id: "extrinsic",
							label: l("Extrinsic", "外在价值"),
							value: parts.extrinsic,
						},
					]}
					total={parts.value}
					unit={l("USD per share", "美元/股")}
					format={(n) => money(n, locale, 2)}
					note={l(
						"These components add to the supplied option value.",
						"两部分相加等于给定期权价值。",
					)}
				/>
			}
			diagram={
				<Diagram
					label={l(
						"Intrinsic and extrinsic portions of the option's value",
						"期权价值中的内在价值与外在价值",
					)}
					height={338}
				>
					<SvgText x={180} y={28} strong>
						{type} · {l("Strike $100", "行权价 $100")}
					</SvgText>
					<SvgText x={180} y={57} muted>
						{l("Stock price", "股价")} {money(example.spotCents, locale)}
					</SvgText>
					<SvgText x={180} y={102}>
						{timing === "before"
							? l("Authored premium / share", "示例权利金 / 股")
							: l("Expiration value / share", "到期价值 / 股")}
					</SvgText>
					<rect
						x="40"
						y="125"
						width="280"
						height="42"
						rx="5"
						className="contract-svg-paper"
					/>
					<m.rect
						y="125"
						height="42"
						fill="var(--ring)"
						width={width(parts.intrinsic)}
						initial={false}
						animate={{ x: 40, width: width(parts.intrinsic) }}
						transition={motion ? lessonTransition : instantTransition}
					/>
					<m.rect
						y="125"
						height="42"
						fill="var(--foreground)"
						opacity="0.65"
						width={width(parts.extrinsic)}
						initial={false}
						animate={{
							x: 40 + width(parts.intrinsic),
							width: width(parts.extrinsic),
						}}
						transition={motion ? lessonTransition : instantTransition}
					/>
					<SvgText x={40} y={192} muted>
						$0
					</SvgText>
					<SvgText x={320} y={192} muted>
						$6
					</SvgText>
					<SvgText x={180} y={230} strong>
						{money(parts.value, locale, 2)}
					</SvgText>
					<rect x="47" y="254" width="10" height="10" fill="var(--ring)" />
					<text x="65" y="264">
						{l("Intrinsic", "内在价值")}: {money(parts.intrinsic, locale, 2)}
					</text>
					<rect
						x="47"
						y="284"
						width="10"
						height="10"
						fill="var(--foreground)"
						opacity="0.65"
					/>
					<text x="65" y="294">
						{l("Extrinsic", "外在价值")}: {money(parts.extrinsic, locale, 2)}
					</text>
					<SvgText x={180} y={329} muted>
						{l("Fixed scale · USD per share", "固定刻度 · 美元 / 股")}
					</SvgText>
				</Diagram>
			}
			outcome={
				<SceneOutcome
					locale={locale}
					items={[
						{
							id: "result-1",
							label: <>{l("Intrinsic value", "内在价值")}</>,
							value: <>{money(parts.intrinsic, locale, 2)}</>,
						},
						{
							id: "result-2",
							label: <>{l("Extrinsic value", "外在价值")}</>,
							value: <>{money(parts.extrinsic, locale, 2)}</>,
						},
						{
							id: "result-3",
							label: <>{l("Option value", "期权价值")}</>,
							value: <>{money(parts.value, locale, 2)}</>,
						},
					]}
				/>
			}
			controls={
				<FieldGroup>
					<TypeField locale={locale} type={type} onChange={setType} />
					<SelectField
						label={l("Supplied stock-price example", "给定股价示例")}
						value={String(index)}
						options={premiumExamples.map(
							(item, i) => [String(i), money(item.spotCents, locale)] as const,
						)}
						onChange={(value) => setIndex(Number(value))}
					/>
					<ChoiceField
						label={l("Value comparison", "价值比较")}
						value={timing}
						options={[
							["before", l("Before expiry", "到期前")],
							["expiry", l("At expiry", "到期时")],
						]}
						onChange={setTiming}
					/>
				</FieldGroup>
			}
			details={
				<>
					<div aria-live="polite" className="flex flex-col gap-3">
						<Badge className="self-start" variant="secondary">
							{moneyness(type, example.spotCents)}
						</Badge>
						<p className="font-mono text-lg" data-value-parts>
							{money(parts.intrinsic, locale, 2)} +{" "}
							{money(parts.extrinsic, locale, 2)} ={" "}
							{money(parts.value, locale, 2)}
						</p>
						<p className="text-muted-foreground text-sm leading-7">
							{timing === "before"
								? l(
										"The supplied premium includes intrinsic value plus extrinsic value. OTM options can have a positive premium even when their intrinsic value is zero.",
										"给定权利金由内在价值与外在价值组成。虚值期权的内在价值为零，但权利金仍可能为正。",
									)
								: l(
										"At expiration, this model's option value is its intrinsic value. Extrinsic value is zero. This comparison holds the stock price fixed; it is not a simulated market path or a promise of how a quote will decay.",
										"到期时，本模型的期权价值等于内在价值，外在价值为零。这里固定股价做比较，不是模拟市场路径，也不保证报价会按某条路径衰减。",
									)}
						</p>
					</div>
					<p className="text-muted-foreground text-xs leading-6">
						{l(
							"American-style equity option teaching examples; quoted premiums are authored, not pricing-model outputs. ATM means exactly at the $100 strike here. No fees; physical-settlement terms are stated in the course.",
							"美式股票期权教学示例；报价为编写数据，并非定价模型输出。本例 ATM 指股价恰好等于 $100 行权价。不计费用，实物结算条款已在课程中说明。",
						)}
					</p>
				</>
			}
		/>
	);
}

export function ExpirationProfitScene({ locale }: Props) {
	const l = text(locale);
	const id = useId();
	const [type, setType] = useState<PayoffType>("CALL");
	const [spot, setSpot] = useGuidedState(10200, [10000, 10200, 10300, 10800]);
	const [paid, setPaid] = useState(300);
	const [count, setCount] = useState(2);
	const result = expirationOutcome(type, spot, paid, count);
	const x = payoffChart.x;
	const y = payoffChart.y;
	const bandX = Math.min(x(payoffTerms.strikeCents), x(result.breakEven));
	const bandWidth = Math.abs(x(result.breakEven) - x(payoffTerms.strikeCents));
	const resultLabel =
		result.profit < 0
			? l("Loss", "亏损")
			: result.profit > 0
				? l("Profit", "盈利")
				: l("Break-even", "盈亏平衡");
	return (
		<SceneLayout
			comparison={
				<BeforeAfterComparison
					locale={locale}
					comparisonKey={`${type}:${paid}:${count}`}
					values={[
						{
							id: "spot",
							label: l("Stock price", "股价"),
							before: 10000,
							current: spot,
							unit: "USD/share",
							format: (n) => money(n, locale, 2),
						},
						{
							id: "pnl",
							label: l("Profit / loss", "盈亏"),
							before: -result.premium,
							current: result.profit,
							unit: "USD",
							format: (n) => money(n, locale),
						},
					]}
					note={l(
						"Compare with spot at the $100 strike, holding type, premium and quantity fixed.",
						"与股价处于 $100 行权价时比较，类型、权利金与数量固定。",
					)}
				/>
			}
			companion={
				<ValueBreakdown
					title={l("From payoff to profit", "从支付价值到盈亏")}
					parts={[
						{
							id: "payoff",
							label: l("Expiration payoff", "到期支付价值"),
							value: result.payoff,
						},
						{
							id: "cost",
							label: l("Premium paid", "已付权利金"),
							value: -result.premium,
						},
					]}
					total={result.profit}
					unit={l("USD · whole position", "美元 · 整份持仓")}
					format={(n) => money(n, locale)}
					note={l(
						"Payoff minus premium. Fees excluded.",
						"支付价值减去权利金，不含费用。",
					)}
				/>
			}
			diagram={
				<Diagram
					label={l(
						"Long option expiration payoff and profit, USD per share",
						"期权多头到期支付价值与盈亏，美元 / 股",
					)}
					height={390}
				>
					<SvgText x={180} y={26} strong>
						{l("Long", "多头")} {type}
					</SvgText>
					<SvgText x={180} y={49} muted>
						{l("At expiration · USD / share", "到期时 · 美元 / 股")}
					</SvgText>
					<rect
						x={bandX}
						y="65"
						width={bandWidth}
						height="190"
						fill="var(--diagram-unknown)"
						opacity="0.12"
					/>
					{[-600, 0, 600, 1200, 1500].map((value) => (
						<g key={value}>
							<path d={`M40 ${y(value)}H320`} className="contract-svg-line" />
							<text
								x="33"
								y={y(value) + 4}
								textAnchor="end"
								className="contract-svg-muted"
							>
								{value / 100}
							</text>
						</g>
					))}
					<path
						d={`M${x(10000)} 65V255`}
						className="contract-svg-line"
						strokeDasharray="3 4"
					/>
					<path
						d={`M${x(result.breakEven)} 65V255`}
						className="diagram-boundary"
					/>
					<path
						d={payoffPath(type, 0)}
						data-payoff-curve="payoff"
						className="diagram-reference"
					/>
					<defs>
						<clipPath id={`${id}-gain`}>
							<rect x="35" y="60" width="290" height={y(0) - 60} />
						</clipPath>
						<clipPath id={`${id}-loss`}>
							<rect x="35" y={y(0)} width="290" height={260 - y(0)} />
						</clipPath>
					</defs>
					<path
						d={payoffPath(type, paid)}
						data-payoff-curve="profit"
						className="diagram-profit"
						clipPath={`url(#${id}-gain)`}
					/>
					<path
						d={payoffPath(type, paid)}
						className="diagram-loss"
						clipPath={`url(#${id}-loss)`}
					/>
					<path
						d={`M${x(spot)} 65V255`}
						stroke="var(--muted-foreground)"
						strokeWidth="1"
						fill="none"
					/>
					<circle
						cx={x(spot)}
						cy={y(result.intrinsic)}
						r="5"
						fill="var(--card)"
						stroke="var(--foreground)"
						strokeWidth="2"
					/>
					<circle
						cx={x(spot)}
						cy={y(result.intrinsic - paid)}
						r="5"
						fill={
							result.profit < 0
								? "var(--diagram-loss)"
								: result.profit > 0
									? "var(--diagram-gain)"
									: "var(--diagram-unknown)"
						}
					/>
					{[8500, 10000, 11500].map((value) => (
						<SvgText key={value} x={x(value)} y={279} muted>
							${value / 100}
						</SvgText>
					))}
					<path d="M40 326h280" className="contract-svg-line" />
					<circle
						cx={x(spot)}
						cy="326"
						r="11"
						className="contract-svg-handle"
					/>
					<foreignObject x="20" y="286" width="320" height="80">
						<RangeSlider
							id={id}
							className="contract-range contract-svg-range"
							type="range"
							min="8500"
							max="11500"
							step="25"
							value={spot}
							aria-label={l("Expiration stock price", "到期股价")}
							aria-valuetext={money(spot, locale, 2)}
							onChange={(event) => setSpot(Number(event.target.value))}
						/>
					</foreignObject>
					<SvgText x={180} y={373} muted>
						{l("Drag the stock-price handle", "拖动股价滑块")}
					</SvgText>
				</Diagram>
			}
			outcome={
				<SceneOutcome
					locale={locale}
					items={[
						{
							id: "result-1",
							label: <>{l("Payoff", "支付价值")}</>,
							value: <>{money(result.payoff, locale)}</>,
						},
						{
							id: "result-2",
							label: <>{l("Premium paid", "已付权利金")}</>,
							value: <>{money(result.premium, locale)}</>,
						},
						{
							id: "result-3",
							label: <>{resultLabel}</>,
							value: <>{money(result.profit, locale)}</>,
							tone: result.profit < 0 ? "loss" : "gain",
						},
					]}
				/>
			}
			controls={
				<FieldGroup>
					<TypeField locale={locale} type={type} onChange={setType} />
					<RangeControl
						inputScale={100}
						label={l("Premium paid per share", "每股已付权利金")}
						value={paid}
						display={money(paid, locale, 2)}
						min={100}
						max={600}
						step={25}
						onChange={setPaid}
					/>
					<RangeControl
						inputScale={1}
						label={l("Contract quantity", "合约张数")}
						value={count}
						display={String(count)}
						min={1}
						max={3}
						onChange={setCount}
					/>
				</FieldGroup>
			}
			details={
				<>
					<div className="flex flex-wrap gap-4 text-xs">
						<span className="inline-flex items-center gap-2">
							<span
								className="w-6 border-foreground border-t-2 border-dashed"
								aria-hidden="true"
							/>
							{l("Payoff", "支付价值")}
						</span>
						<span className="inline-flex items-center gap-2">
							<span className="w-6 border-ring border-t-2" aria-hidden="true" />
							{l("Profit after premium", "扣除权利金后的盈亏")}
						</span>
					</div>
					<div aria-live="polite" className="flex flex-col gap-3">
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="outline">{result.moneyness}</Badge>
							<Badge variant="secondary" data-profit-status>
								{resultLabel}
							</Badge>
							<span className="font-mono text-sm" data-expiration-spot>
								{l("Stock", "股价")} {money(spot, locale, 2)}
							</span>
						</div>
						<p className="text-muted-foreground text-xs">
							{count}{" "}
							{l(
								"contracts × 100 · position totals · no fees",
								"张 × 100 · 持仓总额 · 不含费用",
							)}
						</p>
						<dl className="grid grid-cols-3 gap-2">
							<div>
								<dt className="text-muted-foreground text-xs">
									{l("Payoff", "支付价值")}
								</dt>
								<dd
									className="mt-1 break-words font-mono text-sm"
									data-expiration-payoff
								>
									{money(result.payoff, locale)}
								</dd>
							</div>
							<div>
								<dt className="text-muted-foreground text-xs">
									{l("Paid premium", "已付权利金")}
								</dt>
								<dd
									className="mt-1 break-words font-mono text-sm"
									data-expiration-premium
								>
									{money(result.premium, locale)}
								</dd>
							</div>
							<div>
								<dt className="text-muted-foreground text-xs">
									{l("Profit / loss", "盈亏")}
								</dt>
								<dd
									className="mt-1 break-words font-mono text-lg"
									data-expiration-profit
								>
									{money(result.profit, locale)}
								</dd>
							</div>
						</dl>
						<p className="font-mono text-sm" data-break-even>
							{l("Break-even stock price", "盈亏平衡股价")}:{" "}
							{money(result.breakEven, locale, 2)}
						</p>
					</div>
					<Toolbar
						aria-label={l("Payoff example controls", "盈亏示例控制")}
						className="flex flex-wrap gap-2"
					>
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setPaid(300);
								setCount(2);
								setSpot(type === "CALL" ? 10200 : 9800);
							}}
						>
							{l("Show an ITM loss", "查看实值亏损")}
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setSpot(result.breakEven)}
						>
							{l("Find break-even", "找到盈亏平衡点")}
						</Button>
					</Toolbar>
					<p className="text-muted-foreground text-sm leading-7">
						{result.moneyness === "ITM" && result.profit < 0
							? l(
									"The option has intrinsic value, but its payoff has not recovered the premium paid. The shaded band marks this ITM-loss region, ending at break-even.",
									"期权已有内在价值，但支付价值尚未收回已付权利金。阴影带标出这段实值亏损区间，并止于盈亏平衡点。",
								)
							: l(
									"Profit = payoff − paid premium. Payoff stops at zero; profit can be negative. The shaded band lies between strike and break-even.",
									"盈亏 = 支付价值 − 已付权利金。支付价值最低为零，盈亏则可以为负。阴影带位于行权价与盈亏平衡点之间。",
								)}
					</p>
					<p className="text-muted-foreground text-xs leading-6">
						{l(
							"Hypothetical expiration prices, not current option quotes. Strike $100; long options only; before fees. Lines use a fixed per-share scale: quantity scales position totals, not break-even. At expiry, ATM here means stock exactly at strike.",
							"假设到期价格，不是当前期权报价。行权价 $100，仅展示期权多头，不计费用。曲线使用固定每股刻度：数量影响持仓总额，不改变盈亏平衡点。本例到期 ATM 指股价恰等于行权价。",
						)}
					</p>
				</>
			}
		/>
	);
}

/** Authored teaching states for the writer walkthrough; direct input overrides them. */
const writerExamples: readonly { type: PayoffType; spot: number }[] = [
	{ type: "PUT", spot: 10000 },
	{ type: "PUT", spot: 9500 },
	{ type: "PUT", spot: 8500 },
	{ type: "CALL", spot: 11500 },
];

export function WriterProfitScene({ locale }: Props) {
	const l = text(locale);
	const id = useId();
	const [example, setExample] = useGuidedState(
		writerExamples[0],
		writerExamples,
	);
	const { type, spot } = example;
	const [received, setReceived] = useState(300);
	const [count, setCount] = useState(1);
	const result = writerOutcome(type, spot, received, count);
	const x = writerChart.x;
	const y = writerChart.y;
	const resultLabel =
		result.profit < 0
			? l("Writer loss", "义务方亏损")
			: result.profit > 0
				? l("Writer profit", "义务方盈利")
				: l("Break-even", "盈亏平衡");
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Short option profit at expiration, USD per share",
						"期权空头到期盈亏，美元 / 股",
					)}
					height={390}
				>
					<SvgText x={180} y={26} strong>
						{l("Short", "空头")} {type}
					</SvgText>
					<SvgText x={180} y={49} muted>
						{l(
							"Writer at expiration · USD / share",
							"义务方到期时 · 美元 / 股",
						)}
					</SvgText>
					{[-1200, -600, 0, 600].map((value) => (
						<g key={value}>
							<path d={`M40 ${y(value)}H320`} className="contract-svg-line" />
							<text
								x="33"
								y={y(value) + 4}
								textAnchor="end"
								className="contract-svg-muted"
							>
								{value / 100}
							</text>
						</g>
					))}
					<path
						d={`M${x(payoffTerms.strikeCents)} 65V255`}
						className="contract-svg-line"
						strokeDasharray="3 4"
					/>
					<path
						d={`M${x(result.breakEven)} 65V255`}
						className="diagram-boundary"
					/>
					<defs>
						<clipPath id={`${id}-gain`}>
							<rect x="35" y="60" width="290" height={y(0) - 60} />
						</clipPath>
						<clipPath id={`${id}-loss`}>
							<rect x="35" y={y(0)} width="290" height={260 - y(0)} />
						</clipPath>
					</defs>
					<path
						d={writerPath(type, received)}
						data-payoff-curve="writer"
						className="diagram-profit"
						clipPath={`url(#${id}-gain)`}
					/>
					<path
						d={writerPath(type, received)}
						className="diagram-loss"
						clipPath={`url(#${id}-loss)`}
					/>
					{type === "CALL" ? (
						<SvgText x={262} y={100} muted>
							{l("No floor →", "没有下限 →")}
						</SvgText>
					) : (
						<SvgText x={104} y={100} muted>
							{l("← down to $0 stock", "← 直到股价为 $0")}
						</SvgText>
					)}
					<path
						d={`M${x(spot)} 65V255`}
						stroke="var(--muted-foreground)"
						strokeWidth="1"
						fill="none"
					/>
					<circle
						cx={x(spot)}
						cy={y(received - result.intrinsic)}
						r="5"
						fill={
							result.profit < 0
								? "var(--diagram-loss)"
								: result.profit > 0
									? "var(--diagram-gain)"
									: "var(--diagram-unknown)"
						}
					/>
					{[8500, 10000, 11500].map((value) => (
						<SvgText key={value} x={x(value)} y={279} muted>
							${value / 100}
						</SvgText>
					))}
					<path d="M40 326h280" className="contract-svg-line" />
					<circle
						cx={x(spot)}
						cy="326"
						r="11"
						className="contract-svg-handle"
					/>
					<foreignObject x="20" y="286" width="320" height="80">
						<RangeSlider
							id={id}
							className="contract-range contract-svg-range"
							type="range"
							min="8500"
							max="11500"
							step="25"
							value={spot}
							aria-label={l("Expiration stock price", "到期股价")}
							aria-valuetext={money(spot, locale, 2)}
							onChange={(event) =>
								setExample({ type, spot: Number(event.target.value) })
							}
						/>
					</foreignObject>
					<SvgText x={180} y={373} muted>
						{l("Drag the stock-price handle", "拖动股价滑块")}
					</SvgText>
				</Diagram>
			}
			outcome={
				<SceneOutcome
					locale={locale}
					items={[
						{
							id: "received",
							label: l("Premium received", "收到的权利金"),
							value: money(result.premium, locale),
							tone: "gain",
						},
						{
							id: "owed",
							label: l("Owed to the holder", "需付给持有人"),
							value: money(-result.owed, locale),
							tone: result.owed > 0 ? "loss" : "observed",
						},
						{
							id: "result",
							label: resultLabel,
							value: money(result.profit, locale),
							tone: result.profit < 0 ? "loss" : "gain",
						},
						{
							id: "worst",
							label: l("Worst case", "最坏情况"),
							value:
								result.worstCase === null
									? l("No fixed limit", "没有固定上限")
									: money(result.worstCase, locale),
							tone: "loss",
						},
					]}
				/>
			}
			controls={
				<FieldGroup>
					<TypeField
						locale={locale}
						type={type}
						onChange={(next) => setExample({ type: next, spot })}
					/>
					<RangeControl
						inputScale={100}
						label={l("Premium received per share", "每股收到的权利金")}
						value={received}
						display={money(received, locale, 2)}
						min={100}
						max={600}
						step={25}
						onChange={setReceived}
					/>
					<RangeControl
						inputScale={1}
						label={l("Contracts written", "卖出开仓张数")}
						value={count}
						display={String(count)}
						min={1}
						max={3}
						onChange={setCount}
					/>
				</FieldGroup>
			}
			details={
				<>
					<p className="font-mono text-sm" data-writer-break-even>
						{l("Break-even stock price", "盈亏平衡股价")}:{" "}
						{money(result.breakEven, locale, 2)}
					</p>
					<p className="text-muted-foreground text-sm leading-7">
						{l(
							"Writer P&L = premium received − payoff owed. Before fees, the writer's result mirrors the holder's: one side's gain is the other side's loss.",
							"义务方盈亏 = 收到的权利金 − 需支付的到期价值。不计费用时，义务方与持有人的结果互为镜像：一方的收益就是另一方的损失。",
						)}
					</p>
					<p className="text-muted-foreground text-sm leading-7">
						{result.worstCase === null
							? l(
									"An uncovered short call has no fixed maximum loss: each $1 rise in the stock adds $100 per contract to the loss. Owning the shares (a covered call) offsets that risk, although the stock itself can still fall.",
									"未备兑空头看涨没有固定的最大亏损：股价每涨 $1，每张合约亏损增加 $100。持有对应股票（备兑看涨）可以抵消这项风险，但股票本身仍可能下跌。",
								)
							: l(
									`A short put's worst case is the stock falling to $0: (strike − premium) × 100 × contracts = ${money(result.worstCase, locale)} here.`,
									`空头看跌的最坏情况是股价跌到 $0：（行权价 − 权利金）× 100 × 张数，本例为 ${money(result.worstCase, locale)}。`,
								)}
					</p>
					<p className="text-muted-foreground text-xs leading-6">
						{l(
							"Hypothetical expiration prices. Strike $100; before fees. Early assignment and margin requirements are not shown; the next lesson and your broker's terms cover them.",
							"假设到期价格。行权价 $100，不计费用。图中未包含提前指派与保证金要求，下一课和券商条款会说明。",
						)}
					</p>
				</>
			}
		/>
	);
}
