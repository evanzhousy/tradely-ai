import { RangeSlider } from "@tradely/ui/components/slider";
import * as m from "motion/react-m";
import { useId } from "react";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, Diagram, SceneLayout, SvgText } from "./concept-scene";
import {
	instantTransition,
	lessonTransition,
	useLessonMotion,
} from "./lesson-motion";
import { SceneOutcome } from "./scene-outcome";
import { useGuidedState } from "./visual-playback";

type Props = { locale: Locale };
type Right = "CALL" | "PUT";
const text = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const usd = (dollars: number) =>
	`${dollars < 0 ? "−" : ""}$${Math.abs(dollars).toLocaleString("en-US")}`;

const STRIKE = 100;
const PREMIUM = 300; // $3.00 per share × 100 shares
const rightStates: readonly { type: Right; spot: number }[] = [
	{ type: "CALL", spot: 95 },
	{ type: "CALL", spot: 110 },
	{ type: "PUT", spot: 90 },
];

export function RightScene({ locale }: Props) {
	const l = text(locale);
	const id = useId();
	const [state, setState] = useGuidedState(rightStates[0], rightStates);
	const { type, spot } = state;
	const perShare = Math.max(type === "CALL" ? spot - STRIKE : STRIKE - spot, 0);
	const value = perShare * 100;
	const worthUsing = perShare > 0;
	const x = (price: number) => 40 + ((price - 80) / 40) * 280;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Where the option is worth using at expiry",
						"到期时期权在哪些价格值得行使",
					)}
					height={276}
				>
					<SvgText x={180} y={30} strong>
						ALFA {STRIKE}{" "}
						{type === "CALL" ? l("call", "看涨") : l("put", "看跌")}
					</SvgText>
					<SvgText x={180} y={54} muted>
						{l("At expiry · $3 premium paid", "到期时 · 已付 $3 权利金")}
					</SvgText>
					<rect
						x={type === "CALL" ? x(STRIKE) : x(80)}
						y="80"
						width={type === "CALL" ? x(120) - x(STRIKE) : x(STRIKE) - x(80)}
						height="50"
						className="contract-svg-wash"
					/>
					<SvgText x={type === "CALL" ? x(110) : x(90)} y={110} muted>
						{l("Worth using", "值得行使")}
					</SvgText>
					<path d="M40 130H320" className="contract-svg-line" />
					<path d={`M${x(STRIKE)} 74V140`} className="diagram-boundary" />
					<SvgText x={x(STRIKE)} y={160}>
						{l("Strike $100", "行权价 $100")}
					</SvgText>
					<m.circle
						cx={x(spot)}
						cy={130}
						r="9"
						fill={worthUsing ? "var(--diagram-gain)" : "var(--card)"}
						stroke="var(--foreground)"
						strokeWidth="2"
						initial={false}
						animate={{ cx: x(spot) }}
						transition={lessonTransition}
					/>
					{[80, 120].map((price) => (
						<SvgText key={price} x={x(price)} y={160} muted>
							${price}
						</SvgText>
					))}
					<path d="M40 206h280" className="contract-svg-line" />
					<circle
						cx={x(spot)}
						cy="206"
						r="11"
						className="contract-svg-handle"
					/>
					<foreignObject x="20" y="166" width="320" height="80">
						<RangeSlider
							id={id}
							className="contract-range contract-svg-range"
							type="range"
							min="80"
							max="120"
							step="1"
							value={spot}
							aria-label={l("ALFA price at expiry", "到期时 ALFA 价格")}
							aria-valuetext={`$${spot}`}
							onChange={(event) =>
								setState({ type, spot: Number(event.target.value) })
							}
						/>
					</foreignObject>
					<SvgText x={180} y={262} muted>
						{l("Drag ALFA's price at expiry", "拖动到期时的 ALFA 价格")}
					</SvgText>
				</Diagram>
			}
			outcome={
				<SceneOutcome
					locale={locale}
					items={[
						{
							id: "use",
							label: l("Use the right?", "是否行使？"),
							value: worthUsing ? l("Yes", "是") : l("No", "否"),
							tone: worthUsing ? "gain" : "loss",
						},
						{
							id: "value",
							label: l("Value at expiry", "到期价值"),
							value: usd(value),
						},
						{
							id: "paid",
							label: l("You paid", "已付"),
							value: usd(PREMIUM),
						},
						{
							id: "difference",
							label: l("Value minus premium", "价值减权利金"),
							value: usd(value - PREMIUM),
							tone: value - PREMIUM < 0 ? "loss" : "gain",
						},
					]}
				/>
			}
			controls={
				<ChoiceField
					label={l("Option type", "期权类型")}
					value={type}
					options={[
						["CALL", l("Call: right to buy", "看涨：买入权")],
						["PUT", l("Put: right to sell", "看跌：卖出权")],
					]}
					onChange={(next) => setState({ type: next, spot })}
				/>
			}
			details={
				<p className="text-muted-foreground text-sm leading-7">
					{l(
						"At expiry a call is worth the amount the stock is above the strike, and a put the amount it is below, times 100 shares. Below zero it is simply worth nothing. The premium is already spent either way. ALFA is fictional; fees are ignored.",
						"到期时，看涨期权的价值等于股价高于行权价的部分，看跌期权则等于股价低于行权价的部分，再乘以 100 股。不会低于零，最多一文不值。无论结果如何，权利金都已花出。ALFA 为虚构，未计费用。",
					)}
				</p>
			}
		/>
	);
}

type Use = "protect" | "earn" | "view";
const useStates: readonly Use[] = ["protect", "earn", "view"];

export function UsesScene({ locale }: Props) {
	const l = text(locale);
	const motion = useLessonMotion();
	const [use, setUse] = useGuidedState<Use>("protect", useStates);
	const rows: Record<Use, [string, string][]> = {
		protect: [
			[l("You own", "你持有"), l("100 ALFA shares", "100 股 ALFA")],
			[
				l("You do", "你的操作"),
				l("Buy a $95 put for $2", "以 $2 买入 $95 看跌"),
			],
			[
				l("You get", "你得到"),
				l("The right to sell at $95", "以 $95 卖出的权利"),
			],
			[l("You give up", "你放弃"), l("$200 premium", "$200 权利金")],
		],
		earn: [
			[l("You own", "你持有"), l("100 ALFA shares", "100 股 ALFA")],
			[
				l("You do", "你的操作"),
				l("Sell a $110 call for $1.50", "以 $1.50 卖出 $110 看涨"),
			],
			[l("You get", "你得到"), l("$150 now", "立即获得 $150")],
			[l("You give up", "你放弃"), l("Gains above $110", "$110 以上的涨幅")],
		],
		view: [
			[l("You own", "你持有"), l("Nothing yet", "尚无持仓")],
			[
				l("You do", "你的操作"),
				l("Buy a $105 call for $2.50", "以 $2.50 买入 $105 看涨"),
			],
			[l("You get", "你得到"), l("Gains above $105", "$105 以上的涨幅")],
			[l("You give up", "你放弃"), l("At most $250", "最多 $250")],
		],
	};
	const outcome: Record<Use, { cash: number; hurts: string; purpose: string }> =
		{
			protect: {
				cash: -200,
				hurts: l(
					"A drop to $95; below that you are covered",
					"跌到 $95 的部分；再往下就受到保护",
				),
				purpose: l("Protection", "保护"),
			},
			earn: {
				cash: 150,
				hurts: l(
					"A fall in the shares; the $150 only cushions it",
					"股价下跌；$150 只能缓冲一小部分",
				),
				purpose: l("Income", "收入"),
			},
			view: {
				cash: -250,
				hurts: l("ALFA staying below $105", "ALFA 一直低于 $105"),
				purpose: l("A view with a limited cost", "成本有限的看法"),
			},
		};
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"What you own, do, get and give up for each use",
						"每种用途下你持有、操作、得到与放弃的内容",
					)}
					height={320}
				>
					{rows[use].map(([label, value], i) => (
						<m.g
							key={`${use}:${label}`}
							initial={{ opacity: motion ? 0 : 1, y: motion ? 6 : 0 }}
							animate={{ opacity: 1, y: 0 }}
							transition={
								motion
									? { ...lessonTransition, delay: i * 0.08 }
									: instantTransition
							}
						>
							<rect
								x="20"
								y={16 + i * 74}
								width="320"
								height="62"
								rx="12"
								className={i === 3 ? "contract-svg-wash" : "contract-svg-paper"}
							/>
							<SvgText x={180} y={40 + i * 74} muted>
								{label}
							</SvgText>
							<SvgText x={180} y={64 + i * 74}>
								{value}
							</SvgText>
						</m.g>
					))}
				</Diagram>
			}
			outcome={
				<SceneOutcome
					locale={locale}
					items={[
						{
							id: "purpose",
							label: l("Used for", "用途"),
							value: outcome[use].purpose,
						},
						{
							id: "cash",
							label: l("Cash now", "当下现金"),
							value: `${outcome[use].cash > 0 ? "+" : ""}${usd(outcome[use].cash)}`,
							tone: outcome[use].cash > 0 ? "gain" : "loss",
						},
						{
							id: "hurts",
							label: l("What still hurts", "仍会造成损失的情况"),
							value: outcome[use].hurts,
						},
					]}
				/>
			}
			controls={
				<ChoiceField
					label={l("Use", "用途")}
					value={use}
					options={[
						["protect", l("Protect", "保护")],
						["earn", l("Earn", "收入")],
						["view", l("Take a view", "表达看法")],
					]}
					onChange={setUse}
				/>
			}
			details={
				<p className="text-muted-foreground text-sm leading-7">
					{l(
						"Each use trades something away. Protection costs a premium, income gives up upside, and a limited-cost view can lose its whole premium. Writing options without owning the shares carries much larger risks, covered later in the course. Prices are illustrative.",
						"每种用途都要放弃一些东西：保护要付权利金，收入要放弃上涨空间，成本有限的看法可能损失全部权利金。不持有股票而卖出期权的风险要大得多，课程后面会讲。价格仅为示例。",
					)}
				</p>
			}
		/>
	);
}

const sideStates: readonly Right[] = ["CALL", "PUT", "PUT"];

export function SidesScene({ locale }: Props) {
	const l = text(locale);
	const motion = useLessonMotion();
	const [type, setType] = useGuidedState<Right>("CALL", sideStates);
	const holder =
		type === "CALL"
			? l("May buy 100 at $100", "可按 $100 买入 100 股")
			: l("May sell 100 at $100", "可按 $100 卖出 100 股");
	const writer =
		type === "CALL"
			? l("Must sell 100 at $100", "须按 $100 卖出 100 股")
			: l("Must buy 100 at $100", "须按 $100 买入 100 股");
	const holderAction =
		type === "CALL" ? l("May buy", "可买入") : l("May sell", "可卖出");
	const writerAction =
		type === "CALL" ? l("Must sell", "须卖出") : l("Must buy", "须买入");
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"The holder pays the premium for a right; the writer receives it for an obligation",
						"持有人为权利付出权利金；义务方为承担义务收取权利金",
					)}
					height={260}
				>
					{[
						{
							x: 14,
							title: l("Holder", "持有人"),
							sub: l("Long", "多头"),
							line: holder,
						},
						{
							x: 196,
							title: l("Writer", "义务方"),
							sub: l("Short", "空头"),
							line: writer,
						},
					].map((box, i) => (
						<g key={box.title}>
							<rect
								x={box.x}
								y="70"
								width="150"
								height="120"
								rx="14"
								className={i === 0 ? "contract-svg-wash" : "contract-svg-paper"}
							/>
							<SvgText x={box.x + 75} y={102} strong>
								{box.title}
							</SvgText>
							<SvgText x={box.x + 75} y={126} muted>
								{box.sub}
							</SvgText>
						</g>
					))}
					<m.path
						key={`premium:${type}`}
						d="M164 90H196"
						className="contract-svg-active-line"
						initial={{ pathLength: motion ? 0 : 1 }}
						animate={{ pathLength: 1 }}
						transition={motion ? lessonTransition : instantTransition}
					/>
					<SvgText x={180} y={40}>
						{l("Premium $300 →", "权利金 $300 →")}
					</SvgText>
					{[
						{ x: 89, action: holderAction },
						{ x: 271, action: writerAction },
					].map((line) => (
						<g key={line.x}>
							<SvgText x={line.x} y={156}>
								{line.action}
							</SvgText>
							<SvgText x={line.x} y={178} muted>
								{l("100 at $100", "100 股 @ $100")}
							</SvgText>
						</g>
					))}
					<SvgText x={180} y={232} muted>
						{type === "CALL"
							? l("Call · strike $100", "看涨 · 行权价 $100")
							: l("Put · strike $100", "看跌 · 行权价 $100")}
					</SvgText>
				</Diagram>
			}
			outcome={
				<SceneOutcome
					locale={locale}
					items={[
						{ id: "holder", label: l("Holder", "持有人"), value: holder },
						{ id: "writer", label: l("Writer", "义务方"), value: writer },
						{
							id: "decides",
							label: l("Who decides", "由谁决定"),
							value: l("The holder", "持有人"),
						},
					]}
				/>
			}
			controls={
				<ChoiceField
					label={l("Option type", "期权类型")}
					value={type}
					options={[
						["CALL", l("Call", "看涨")],
						["PUT", l("Put", "看跌")],
					]}
					onChange={setType}
				/>
			}
			details={
				<p className="text-muted-foreground text-sm leading-7">
					{l(
						"The most a holder can lose is the premium. The writer keeps the premium but, once assigned, has no choice about the trade, and can lose far more. The later lessons on payoff and expiration show how much.",
						"持有人最多损失权利金。义务方保留权利金，但一旦被指派就别无选择，而且可能损失得多得多。后面关于到期价值与到期的课程会展示具体会亏多少。",
					)}
				</p>
			}
		/>
	);
}
