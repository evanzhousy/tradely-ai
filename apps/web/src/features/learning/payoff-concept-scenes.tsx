import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { Badge } from "@tradely/ui/components/badge";
import { Button } from "@tradely/ui/components/button";
import { FieldGroup } from "@tradely/ui/components/field";
import * as m from "motion/react-m";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/messages";
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
} from "./payoff-concept-model";

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
	const [paid, setPaid] = useState(300);
	const [count, setCount] = useState(2);
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
		>
			<FieldGroup>
				<RangeControl
					label={l("Option price per share", "每股期权价格")}
					value={paid}
					display={money(paid, locale, 2)}
					min={100}
					max={600}
					step={25}
					onChange={setPaid}
				/>
				<RangeControl
					label={l("Contract quantity", "合约张数")}
					value={count}
					display={String(count)}
					min={1}
					max={3}
					onChange={setCount}
				/>
			</FieldGroup>
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
					{ id: "multiplier", label: l("Multiplier", "乘数"), value: "100" },
					{ id: "count", label: l("Contracts", "张数"), value: String(count) },
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
		</SceneLayout>
	);
}

export function ValuePartsScene({ locale }: Props) {
	const l = text(locale);
	const motion = useLessonMotion();
	const [type, setType] = useState<PayoffType>("CALL");
	const [index, setIndex] = useState(2);
	const [timing, setTiming] = useState("before");
	const example = premiumExamples[index];
	const parts = valueParts(type, example, timing === "expiry");
	const width = (cents: number) => (cents / 600) * 280;
	return (
		<SceneLayout
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
						animate={{ x: 40, width: width(parts.intrinsic) }}
						transition={motion ? lessonTransition : instantTransition}
					/>
					<m.rect
						y="125"
						height="42"
						fill="var(--foreground)"
						opacity="0.65"
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
		>
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
			<div aria-live="polite" className="flex flex-col gap-3">
				<Badge className="self-start" variant="secondary">
					{moneyness(type, example.spotCents)}
				</Badge>
				<p className="font-mono text-lg" data-value-parts>
					{money(parts.intrinsic, locale, 2)} +{" "}
					{money(parts.extrinsic, locale, 2)} = {money(parts.value, locale, 2)}
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
		</SceneLayout>
	);
}

export function ExpirationProfitScene({ locale }: Props) {
	const l = text(locale);
	const id = useId();
	const [type, setType] = useState<PayoffType>("CALL");
	const [spot, setSpot] = useState(10200);
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
						className="contract-svg-wash"
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
						stroke="var(--ring)"
						strokeWidth="1.5"
						strokeDasharray="3 4"
						fill="none"
					/>
					<path
						d={payoffPath(type, 0)}
						data-payoff-curve="payoff"
						fill="none"
						stroke="var(--foreground)"
						strokeWidth="2"
						strokeDasharray="5 4"
					/>
					<path
						d={payoffPath(type, paid)}
						data-payoff-curve="profit"
						className="contract-svg-active-line"
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
						className="contract-svg-handle"
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
						<input
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
		>
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
			<FieldGroup>
				<TypeField locale={locale} type={type} onChange={setType} />
				<RangeControl
					label={l("Premium paid per share", "每股已付权利金")}
					value={paid}
					display={money(paid, locale, 2)}
					min={100}
					max={600}
					step={25}
					onChange={setPaid}
				/>
				<RangeControl
					label={l("Contract quantity", "合约张数")}
					value={count}
					display={String(count)}
					min={1}
					max={3}
					onChange={setCount}
				/>
			</FieldGroup>
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
			<div className="flex flex-wrap gap-2">
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
			</div>
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
		</SceneLayout>
	);
}
