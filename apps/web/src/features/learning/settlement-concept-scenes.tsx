import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { Badge } from "@tradely/ui/components/badge";
import { FieldGroup } from "@tradely/ui/components/field";
import * as m from "motion/react-m";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/messages";
import {
	ChoiceField,
	Diagram,
	PlaybackButton,
	RangeControl,
	SceneLayout,
	SelectField,
	SvgText,
	useFrames,
} from "./concept-scene";
import {
	instantTransition,
	lessonTransition,
	useLessonMotion,
} from "./lesson-motion";
import {
	cashSettlement,
	cashTerms,
	type ExerciseStyle,
	type ExitRoute,
	exerciseSchedule,
	exerciseWindow,
	exitOutcome,
	physicalDelivery,
	physicalTerms,
	type SettlementOptionType,
	settlementExamples,
} from "./settlement-concept-model";

type Props = { locale: Locale };
const text = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const number = (value: number) => value.toLocaleString("en-US");
const money = (value: number) =>
	`${value < 0 ? "−" : ""}$${number(Math.abs(value))}`;
function TypeField({
	locale,
	type,
	onChange,
}: Props & {
	type: SettlementOptionType;
	onChange: (value: SettlementOptionType) => void;
}) {
	const l = text(locale);
	return (
		<ChoiceField
			label={l("Option type", "期权类型")}
			value={type}
			options={[
				["CALL", l("Call", "看涨")],
				["PUT", l("Put", "看跌")],
			]}
			onChange={onChange}
		/>
	);
}

export function ClosingExerciseScene({ locale }: Props) {
	const l = text(locale);
	const motion = useLessonMotion();
	const playback = useFrames(3);
	const [type, setType] = useState<SettlementOptionType>("CALL");
	const [route, setRoute] = useState<ExitRoute>("close");
	const outcome = exitOutcome(type, route);
	const done = playback.frame === 2;
	const side = route === "close" ? 87 : 273;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"A closing trade and a valid exercise follow different paths",
						"平仓交易与有效行权沿不同路径进行",
					)}
					height={390}
				>
					<rect
						x="75"
						y="15"
						width="210"
						height="62"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={42} strong>
						ALFA {money(physicalTerms.strike)} {type}
					</SvgText>
					<SvgText x={180} y={65} muted>
						{l("Hold one long option", "持有一张期权多头")}
					</SvgText>
					<path
						d="M180 77v25H87v22M180 102h93v22M87 197v26h93v27M273 197v26h-93"
						className="contract-svg-line"
					/>
					{playback.frame > 0 ? (
						<m.path
							key={`${route}:${playback.frame}`}
							d={`M180 77v25H${side}v22${done ? "m0 73v26H180v27" : ""}`}
							className="contract-svg-active-line"
							initial={{ pathLength: motion ? 0 : 1 }}
							animate={{ pathLength: 1 }}
							transition={
								motion
									? { ...lessonTransition, duration: 0.45 }
									: instantTransition
							}
						/>
					) : null}
					{["close", "exercise"].map((choice, i) => (
						<g key={choice}>
							<rect
								x={14 + i * 186}
								y="124"
								width="146"
								height="73"
								rx="10"
								className={
									route === choice ? "contract-svg-wash" : "contract-svg-paper"
								}
							/>
							<SvgText x={87 + i * 186} y={153}>
								{i === 0
									? l("Sell to close", "卖出平仓")
									: l("Exercise", "行权")}
							</SvgText>
							<SvgText x={87 + i * 186} y={177} muted>
								{i === 0
									? l("Exchange trade", "交易所交易")
									: l("Use the right", "使用权利")}
							</SvgText>
						</g>
					))}
					<rect
						x="34"
						y="250"
						width="292"
						height="107"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={278} strong>
						{done
							? l("0 options remain", "期权剩余 0 张")
							: playback.frame === 1
								? l("Follow the selected route", "跟随所选路径")
								: l("Choose a route", "选择一条路径")}
					</SvgText>
					{done ? (
						<>
							<SvgText x={180} y={309}>
								{route === "close"
									? l("Sale proceeds: $250", "出售所得：$250")
									: l(
											`Holder cash: ${money(outcome.cashToHolder)}`,
											`持有人现金：${money(outcome.cashToHolder)}`,
										)}
							</SvgText>
							<SvgText x={180} y={338} muted>
								{route === "close"
									? l("No exercise delivery", "没有行权交付")
									: l(
											`${outcome.sharesToHolder > 0 ? "Receive" : "Deliver"} 100 shares`,
											`${outcome.sharesToHolder > 0 ? "接收" : "交付"} 100 股`,
										)}
							</SvgText>
						</>
					) : (
						<SvgText x={180} y={323} muted>
							{l(
								"Route selection is not an execution",
								"选择路径不等于实际执行",
							)}
						</SvgText>
					)}
					<SvgText x={180} y={382} muted>
						{l(
							"Supplied teaching outcomes · no fees",
							"给定教学结果 · 不含费用",
						)}
					</SvgText>
				</Diagram>
			}
		>
			<FieldGroup>
				<TypeField
					locale={locale}
					type={type}
					onChange={(value) => {
						setType(value);
						playback.select(playback.frame);
					}}
				/>
				<ChoiceField
					label={l("Route to compare", "要比较的路径")}
					value={route}
					options={[
						["close", l("Sell to close", "卖出平仓")],
						["exercise", l("Exercise", "行权")],
					]}
					onChange={(value) => {
						setRoute(value);
						playback.select(playback.frame);
					}}
				/>
				<ChoiceField
					label={l("Example stage", "示例阶段")}
					value={String(playback.frame)}
					options={[
						["0", l("1. Hold", "1. 持有")],
						["1", l("2. Route", "2. 路径")],
						["2", l("3. Outcome", "3. 结果")],
					]}
					onChange={(value) => playback.select(Number(value))}
				/>
			</FieldGroup>
			<div>
				<PlaybackButton
					playing={playback.playing}
					onClick={playback.toggle}
					l={l}
				/>
			</div>
			<div aria-live="polite" className="flex flex-col gap-3">
				<Badge className="self-start" variant="secondary">
					{route === "close"
						? l("Trade", "交易")
						: l("Exercise → assignment → delivery", "行权 → 指派 → 交付")}
				</Badge>
				<p className="font-semibold text-lg" data-exit-status>
					{done
						? route === "close"
							? l(
									"The long option was sold, not exercised.",
									"期权多头已卖出，没有行权。",
								)
							: l(
									"The right was exercised; an assigned writer fulfills the obligation.",
									"权利已被行使，被指派的卖方履行义务。",
								)
						: l(
								"Step through the example to reveal its supplied outcome.",
								"逐步查看示例，显示给定的结果。",
							)}
				</p>
				<p className="text-muted-foreground text-sm leading-7">
					{route === "close"
						? l(
								"This example supplies a completed closing sale at $2.50/share × 100 = $250 received. An unfilled order would not establish a closed position. Sale proceeds alone do not establish profit.",
								"本例给定一笔已完成的平仓出售：$2.50/股 × 100 = 收到 $250。未成交订单不能证明已平仓，仅凭出售所得也不能确定利润。",
							)
						: l(
								"Valid exercise and delivery are assumed here: strike $50 × 100 shares = $5,000 gross exercise cash. Calls receive shares; puts deliver shares. This amount is separate from purchase premium and profit.",
								"本例假定行权与交付有效：行权价 $50 × 100 股 = $5,000 行权总金额。看涨接收股票，看跌交付股票。该金额与购买权利金及盈亏不同。",
							)}
				</p>
			</div>
			<p className="text-muted-foreground text-xs leading-6">
				{l(
					"An option can also expire without exercise. Automatic-exercise rules and broker instructions are product-specific. The next scene separates the relevant time windows.",
					"期权也可能未行权就到期。自动行权规则与券商指令取决于产品。下一场景将区分相关时间窗口。",
				)}
			</p>
		</SceneLayout>
	);
}

export function ExerciseTimingScene({ locale }: Props) {
	const l = text(locale);
	const motion = useLessonMotion();
	const id = useId();
	const playback = useFrames(4);
	const [style, setStyle] = useState<ExerciseStyle>("american");
	const moment = exerciseWindow(style, playback.frame);
	const x = (index: number) => 40 + (index * 280) / 3;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Trading and exercise windows on an illustrative expiry schedule",
						"示例到期安排中的交易与行权窗口",
					)}
					height={374}
				>
					<SvgText x={180} y={29} strong>
						{style === "american"
							? l("American style", "美式行权")
							: l("European style", "欧式行权")}
					</SvgText>
					<SvgText x={180} y={56} muted>
						{l(
							"A sample schedule, not market hours",
							"示例安排，不是真实市场时间",
						)}
					</SvgText>
					<SvgText x={180} y={91}>
						{l("Trading window", "交易窗口")}
					</SvgText>
					{exerciseSchedule.map((stop, i) => (
						<g key={stop.en}>
							<rect
								x={x(i) - 37}
								y="108"
								width="74"
								height="38"
								rx="6"
								className={
									stop.tradingOpen ? "contract-svg-wash" : "contract-svg-paper"
								}
							/>
							<SvgText x={x(i)} y={133} muted>
								{stop.tradingOpen ? l("Open", "开放") : l("Closed", "关闭")}
							</SvgText>
						</g>
					))}
					<SvgText x={180} y={179}>
						{l("Exercise window", "行权窗口")}
					</SvgText>
					{exerciseSchedule.map((stop, i) => (
						<g key={stop.en}>
							<rect
								x={x(i) - 37}
								y="196"
								width="74"
								height="38"
								rx="6"
								className="contract-svg-paper"
							/>
							<m.rect
								x={x(i) - 37}
								y="196"
								width="74"
								height="38"
								rx="6"
								className="contract-svg-wash"
								animate={{
									opacity: exerciseWindow(style, i).exerciseOpen ? 1 : 0,
								}}
								transition={motion ? lessonTransition : instantTransition}
							/>
							<SvgText x={x(i)} y={221} muted>
								{exerciseWindow(style, i).exerciseOpen
									? l("Allowed", "允许")
									: l("Outside", "不在时段")}
							</SvgText>
						</g>
					))}
					{[106, 194].map((y) => (
						<rect
							key={y}
							x={x(playback.frame) - 39}
							y={y}
							width="78"
							height="42"
							rx="8"
							stroke="var(--ring)"
							strokeWidth="2"
							fill="none"
						/>
					))}
					<path d="M40 284h280" className="contract-svg-line" />
					{exerciseSchedule.map((stop, i) => (
						<circle
							key={stop.en}
							cx={x(i)}
							cy="284"
							r="4"
							className="contract-svg-dot"
						/>
					))}
					<circle
						cx={x(playback.frame)}
						cy="284"
						r="11"
						className="contract-svg-handle"
					/>
					<foreignObject x="20" y="244" width="320" height="80">
						<input
							id={id}
							className="contract-range contract-svg-range"
							type="range"
							min="0"
							max="3"
							step="1"
							value={playback.frame}
							aria-label={l("Expiry timeline", "到期时间轴")}
							aria-valuetext={`${locale === "zh" ? moment.zh : moment.en}; ${moment.dte} DTE`}
							onPointerDown={() => playback.select(playback.frame)}
							onChange={(event) => playback.select(Number(event.target.value))}
						/>
					</foreignObject>
					<SvgText x={40} y={334} muted>
						{l("Earlier", "提前")}
					</SvgText>
					<text x="337" y="334" textAnchor="end" className="contract-svg-muted">
						{l("After cutoff", "截止后")}
					</text>
					<SvgText x={180} y={365} muted>
						{l("Drag through the supplied stops", "拖动查看给定节点")}
					</SvgText>
				</Diagram>
			}
		>
			<FieldGroup>
				<ChoiceField
					label={l("Exercise style", "行权方式")}
					value={style}
					options={[
						["american", l("American", "美式")],
						["european", l("European", "欧式")],
					]}
					onChange={(value) => {
						setStyle(value);
						playback.select(playback.frame);
					}}
				/>
				<SelectField
					label={l("Schedule stop", "时间节点")}
					value={String(playback.frame)}
					options={exerciseSchedule.map(
						(stop, i) =>
							[String(i), locale === "zh" ? stop.zh : stop.en] as const,
					)}
					onChange={(value) => playback.select(Number(value))}
				/>
			</FieldGroup>
			<div>
				<PlaybackButton
					playing={playback.playing}
					onClick={playback.toggle}
					l={l}
				/>
			</div>
			<div aria-live="polite" className="flex flex-col gap-3">
				<Badge className="self-start" variant="secondary" data-calendar-dte>
					{moment.dte} DTE
				</Badge>
				<h5 className="font-semibold text-lg">
					{locale === "zh" ? moment.zh : moment.en}
				</h5>
				<p className="text-sm" data-trading-window>
					{l("Trading window", "交易窗口")}:{" "}
					{moment.tradingOpen ? l("open", "开放") : l("closed", "关闭")}
				</p>
				<p className="font-medium text-sm" data-exercise-window>
					{moment.exerciseOpen
						? l(
								"Within this contract's exercise window.",
								"处于本合约的行权时段内。",
							)
						: l(
								"Outside this contract's exercise window.",
								"不在本合约的行权时段内。",
							)}
				</p>
			</div>
			<Alert>
				<AlertTitle>
					{moment.dte === 0
						? l(
								"0DTE means today, not no risk",
								"0DTE 表示今天到期，不代表没有风险",
							)
						: l(
								"Style describes timing, not geography",
								"行权方式描述时间，不是地理位置",
							)}
				</AlertTitle>
				<AlertDescription>
					{l(
						"The example counts calendar days; its final three stops all occur on the expiry date. Trading, exercise instructions, assignment and settlement have different clocks. Processing and obligations can continue after an exercise deadline.",
						"本例按日历日期计数，最后三个节点都在到期日。交易、行权指令、指派与结算各有不同的时间安排；行权截止后，处理流程与义务仍可能继续。",
					)}
				</AlertDescription>
			</Alert>
			<p className="text-muted-foreground text-xs leading-6">
				{l(
					"This fictional schedule puts the last trading time before the final exercise window. Actual product rules and broker deadlines control the real sequence. An open trading window does not guarantee a fill; exercise eligibility is not an automatic-exercise prediction.",
					"此虚构安排将最后交易时间设在最终行权时段之前。真实顺序由产品规则与券商截止时间决定。交易窗口开放不保证成交，具备行权时间条件也不代表预测会自动行权。",
				)}
			</p>
		</SceneLayout>
	);
}

function DeliveryArrow({
	toHolder,
	y,
	label,
	id,
}: {
	toHolder: boolean;
	y: number;
	label: string;
	id: string;
}) {
	const motion = useLessonMotion();
	const from = toHolder ? 300 : 60;
	const to = 360 - from;
	return (
		<g>
			<SvgText x={180} y={y - 18}>
				{label}
			</SvgText>
			<path
				d={`M${from} ${y}H${to}m${to > from ? -8 : 8} -5l${to > from ? 8 : -8} 5l${to > from ? -8 : 8} 5`}
				className="contract-svg-active-line"
			/>
			<m.circle
				key={id}
				cy={y}
				r="5"
				fill="var(--ring)"
				initial={{ cx: motion ? from : to }}
				animate={{ cx: to }}
				transition={
					motion ? { ...lessonTransition, duration: 0.6 } : instantTransition
				}
			/>
		</g>
	);
}

export function SettlementComparisonScene({ locale }: Props) {
	const l = text(locale);
	const [kind, setKind] = useState("cash");
	const [type, setType] = useState<SettlementOptionType>("CALL");
	const [count, setCount] = useState(1);
	const [example, setExample] = useState(0);
	const [inspect, setInspect] = useState("official");
	const official = settlementExamples[example];
	const cash = cashSettlement(type, official, count);
	const physical = physicalDelivery(type, count);
	const isCash = kind === "cash";
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={
						isCash
							? l(
									"Official reference determines cash settlement",
									"官方参考值决定现金结算",
								)
							: l(
									"Physical exercise exchanges shares and strike cash",
									"实物行权交换股票与行权现金",
								)
					}
					height={394}
				>
					<SvgText x={180} y={28} strong>
						{isCash ? "IDX" : "ALFA"} · {type}
					</SvgText>
					<SvgText x={180} y={54} muted>
						{isCash
							? l("Strike 4,000 · $100 / point", "行权价 4,000 · $100 / 点")
							: l(
									"Strike $50 · 100 shares / contract",
									"行权价 $50 · 每张 100 股",
								)}
					</SvgText>
					{isCash ? (
						<>
							<rect
								x="13"
								y="80"
								width="151"
								height="74"
								rx="10"
								className="contract-svg-wash"
							/>
							<SvgText x={88} y={106} muted>
								{l("Official reference", "官方参考值")}
							</SvgText>
							<SvgText x={88} y={137} strong>
								{official === null ? "—" : number(official)}
							</SvgText>
							<rect
								x="196"
								y="80"
								width="151"
								height="74"
								rx="10"
								className="contract-svg-paper"
							/>
							<SvgText x={271} y={106} muted>
								{l("Last display", "最后显示值")}
							</SvgText>
							<SvgText x={271} y={137} strong>
								{number(cashTerms.lastDisplay)}
							</SvgText>
							<path d="M88 154v35h92v20" className="contract-svg-active-line" />
							<rect
								x="35"
								y="209"
								width="290"
								height="78"
								rx="12"
								className="contract-svg-paper"
							/>
							<SvgText x={180} y={235} muted>
								{l("Cash payoff to holder", "持有人收到的现金支付")}
							</SvgText>
							<SvgText x={180} y={266} strong>
								{cash.cash === null
									? l("Reference needed", "需要参考值")
									: money(cash.cash)}
							</SvgText>
							<SvgText x={180} y={325}>
								{l("No shares delivered", "不交付股票")}
							</SvgText>
							<SvgText x={180} y={354} muted>
								{l("Last display is context only", "最后显示值仅作背景参考")}
							</SvgText>
						</>
					) : (
						<>
							{[0, 1].map((i) => (
								<g key={i}>
									<rect
										x={15 + i * 190}
										y="82"
										width="140"
										height="66"
										rx="10"
										className="contract-svg-paper"
									/>
									<SvgText x={85 + i * 190} y={111} strong>
										{i === 0 ? l("HOLDER", "持有人") : l("WRITER", "卖方")}
									</SvgText>
									<SvgText x={85 + i * 190} y={136} muted>
										{i === 0 ? l("Exercises", "行权") : l("Assigned", "被指派")}
									</SvgText>
								</g>
							))}
							<DeliveryArrow
								toHolder={physical.cashToHolder > 0}
								y={218}
								label={l(
									`Exercise cash ${money(Math.abs(physical.cashToHolder))}`,
									`行权金额 ${money(Math.abs(physical.cashToHolder))}`,
								)}
								id={`cash-${type}-${count}`}
							/>
							<DeliveryArrow
								toHolder={physical.sharesToHolder > 0}
								y={295}
								label={l(
									`${Math.abs(physical.sharesToHolder)} shares`,
									`${Math.abs(physical.sharesToHolder)} 股`,
								)}
								id={`shares-${type}-${count}`}
							/>
							<SvgText x={180} y={348} muted>
								{l("Valid exercise and delivery assumed", "假定行权与交付有效")}
							</SvgText>
						</>
					)}
					<SvgText x={180} y={382} muted>
						{count} {l("contract(s) · premium excluded", "张 · 不计购买权利金")}
					</SvgText>
				</Diagram>
			}
		>
			<FieldGroup>
				<ChoiceField
					label={l("Settlement product", "结算产品")}
					value={kind}
					options={[
						["cash", l("Cash · index example", "现金 · 指数示例")],
						["physical", l("Physical · stock example", "实物 · 股票示例")],
					]}
					onChange={setKind}
				/>
				<TypeField locale={locale} type={type} onChange={setType} />
				<RangeControl
					label={l("Contract quantity", "合约张数")}
					value={count}
					display={String(count)}
					min={1}
					max={3}
					onChange={setCount}
				/>
				{isCash ? (
					<>
						<SelectField
							label={l("Official-reference example", "官方参考值示例")}
							value={String(example)}
							options={[
								["0", l("Above strike · 4,025", "高于行权价 · 4,025")],
								["1", l("Below strike · 3,990", "低于行权价 · 3,990")],
								["2", l("Official reference missing", "官方参考值缺失")],
							]}
							onChange={(value) => setExample(Number(value))}
						/>
						<ChoiceField
							label={l("Inspect a reference", "检查参考值")}
							value={inspect}
							options={[
								["official", l("Official", "官方")],
								["last", l("Last display", "最后显示值")],
							]}
							onChange={setInspect}
						/>
					</>
				) : null}
			</FieldGroup>
			<div className="flex flex-col gap-3" aria-live="polite">
				<p className="text-muted-foreground text-sm">
					{isCash
						? l("Cash payoff to holder", "持有人收到的现金支付")
						: l("Holder cash movement", "持有人现金变动")}
				</p>
				<p className="font-mono text-3xl" data-settlement-cash>
					{isCash
						? cash.cash === null
							? "—"
							: money(cash.cash)
						: money(physical.cashToHolder)}
				</p>
				{isCash ? (
					<>
						<p className="font-mono text-sm" data-settlement-difference>
							{l("Settlement − strike", "结算参考值 − 行权价")}:{" "}
							{cash.difference === null ? "—" : cash.difference}{" "}
							{l("points", "点")}
						</p>
						<p className="text-sm" data-inspected-reference>
							{inspect === "official"
								? l("Official reference", "官方参考值")
								: l(
										"Last display (not used in payoff)",
										"最后显示值（不用于支付计算）",
									)}
							:{" "}
							{inspect === "last"
								? number(cashTerms.lastDisplay)
								: official === null
									? l("Missing", "缺失")
									: number(official)}
						</p>
						<p className="text-muted-foreground text-sm leading-7">
							{cash.cash === null
								? l(
										"The last display is available, but the official reference is missing. The cash payoff remains unknown; it is not zero and cannot be filled from the last display.",
										"最后显示值可用，但官方参考值缺失。现金支付仍未知，不能当作零，也不能用最后显示值补齐。",
									)
								: type === "CALL"
									? l(
											"Call: max(official settlement − strike, 0) × $100/point × contracts. Keep a negative raw difference visible before flooring the payoff at zero.",
											"看涨：max(官方结算值 − 行权价, 0) × $100/点 × 张数。先保留原始负差值，再将支付下限设为零。",
										)
									: l(
											"Put: max(strike − official settlement, 0) × $100/point × contracts. The raw settlement-minus-strike difference is shown separately.",
											"看跌：max(行权价 − 官方结算值, 0) × $100/点 × 张数。另行显示结算参考值减行权价的原始差值。",
										)}
						</p>
					</>
				) : (
					<p className="text-sm leading-7" data-physical-delivery>
						{physical.sharesToHolder > 0
							? l(
									`The holder receives ${physical.sharesToHolder} shares and pays ${money(-physical.cashToHolder)}.`,
									`持有人接收 ${physical.sharesToHolder} 股，支付 ${money(-physical.cashToHolder)}。`,
								)
							: l(
									`The holder delivers ${-physical.sharesToHolder} shares and receives ${money(physical.cashToHolder)}.`,
									`持有人交付 ${-physical.sharesToHolder} 股，收到 ${money(physical.cashToHolder)}。`,
								)}
					</p>
				)}
			</div>
			<p className="text-muted-foreground text-xs leading-6">
				{l(
					"These are different, explicitly specified teaching products. Exercise style does not determine settlement method. Cash payoff and gross physical exercise cash are different quantities; neither is profit. Actual products specify their own settlement reference and delivery terms.",
					"这些是条款明确但不同的教学产品。行权方式不能决定结算方式。现金支付与实物行权总金额是不同量，都不是利润；真实产品各自规定结算参考值与交付条款。",
				)}
			</p>
		</SceneLayout>
	);
}
