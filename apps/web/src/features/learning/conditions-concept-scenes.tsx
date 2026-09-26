import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { FieldGroup } from "@tradely/ui/components/field";
import * as m from "motion/react-m";
import { createContext, useContext, useState } from "react";
import {
	type ConditionClaim,
	type ConditionsConceptData,
	conditionSupports,
	locationCode,
	packageMarket,
	sweepFills,
} from "@/domain/learning/conditions-concept";
import type { Locale } from "@/i18n/messages";
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
import { SceneOutcome } from "./scene-outcome";
import { useGuidedState } from "./visual-playback";

export const ConditionsData = createContext<ConditionsConceptData | null>(null);
function useConditionsData() {
	const data = useContext(ConditionsData);
	if (!data)
		throw new Error("Condition scenes require authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const text = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const number = (v: number) => v.toLocaleString("en-US");
const price = (cents: number) =>
	`$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
const usd = (dollars: number) =>
	`$${dollars.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

const sweepSizes: readonly number[] = [20, 35, 50];

export function SweepScene({ locale }: Props) {
	const data = useConditionsData();
	const l = text(locale);
	const motion = useLessonMotion();
	const [size, setSize] = useGuidedState(20, sweepSizes);
	const result = sweepFills(data.venues, size, data.multiplier);
	const filledIds = new Set(result.fills.map((fill) => fill.id));
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"One incoming order fills against several venues and prints once per fill",
						"一张主动订单在多个场所成交，每次成交分别打印",
					)}
					height={310}
				>
					<rect
						x="90"
						y="14"
						width="180"
						height="56"
						rx="12"
						className="contract-svg-wash"
					/>
					<SvgText x={180} y={38} muted>
						{l("Incoming buy order", "主动买单")}
					</SvgText>
					<SvgText x={180} y={60} strong>
						{number(size)} {l("contracts", "张")}
					</SvgText>
					{data.venues.map((venue, i) => {
						const fill = result.fills.find((item) => item.id === venue.id);
						const y = 170;
						return (
							<g key={venue.id}>
								{fill ? (
									<m.path
										key={`${venue.id}:${size}`}
										d={`M180 70C180 95 ${64 + i * 116} 95 ${64 + i * 116} ${y}`}
										className="contract-svg-active-line"
										initial={{ pathLength: motion ? 0 : 1 }}
										animate={{ pathLength: 1 }}
										transition={
											motion
												? {
														...lessonTransition,
														duration: 0.4,
														delay: i * 0.15,
													}
												: instantTransition
										}
									/>
								) : null}
								<rect
									x={12 + i * 116}
									y={y}
									width="104"
									height="58"
									rx="10"
									className={
										filledIds.has(venue.id)
											? "contract-svg-paper"
											: "contract-svg-line"
									}
									strokeDasharray={filledIds.has(venue.id) ? undefined : "4 4"}
								/>
								<SvgText x={64 + i * 116} y={y + 24} muted>
									{l("Venue", "场所")} {venue.id}
								</SvgText>
								<SvgText x={64 + i * 116} y={y + 46}>
									{fill ? `${fill.quantity} @ ${price(venue.priceCents)}` : "—"}
								</SvgText>
							</g>
						);
					})}
					<rect
						x="40"
						y="250"
						width="280"
						height="48"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={280}>
						{l(
							`1 order · ${result.fills.length} print${result.fills.length === 1 ? "" : "s"}`,
							`1 张订单 · ${result.fills.length} 笔成交`,
						)}
					</SvgText>
				</Diagram>
			}
			outcome={
				<SceneOutcome
					locale={locale}
					items={[
						{
							id: "prints",
							label: l("Prints", "成交笔数"),
							value: String(result.fills.length),
						},
						{
							id: "filled",
							label: l("Contracts filled", "成交张数"),
							value: number(result.filled),
						},
						{
							id: "average",
							label: l("Average price", "平均价格"),
							value:
								result.averageCents === null
									? null
									: price(Math.round(result.averageCents * 100) / 100),
						},
						{
							id: "premium",
							label: l("Total premium", "总权利金"),
							value: usd(result.premium),
						},
					]}
					note={
						result.unfilled > 0
							? l(
									`${result.unfilled} contracts find no displayed offer at these venues and stay unfilled.`,
									`${result.unfilled} 张在这些场所没有可成交的展示卖单，仍未成交。`,
								)
							: undefined
					}
				/>
			}
			controls={
				<RangeControl
					label={l("Order size", "订单张数")}
					value={size}
					display={`${number(size)} ${l("contracts", "张")}`}
					min={10}
					max={65}
					step={5}
					onChange={setSize}
				/>
			}
			details={
				<>
					<p className="text-muted-foreground text-sm leading-7">
						{l(
							"A sweep routes one order to several venues at once, often as intermarket sweep orders (ISO), taking the displayed size at each price. Each fill prints separately, so one order can look like several trades, and later fills pay more than the best displayed offer.",
							"扫单把一张订单同时路由到多个场所，常以跨市场扫单指令（ISO）发出，依次吃掉每个价位的展示数量。每次成交分别打印，因此一张订单可能看起来像多笔交易，后面的成交价格也高于最优展示卖价。",
						)}
					</p>
					<p className="text-muted-foreground text-xs leading-6">
						{l(
							"The label describes how the order was executed. It does not tell you who sent it, how informed they were, or whether the trade opened a position. Venues, sizes and prices here are illustrative.",
							"该标签描述订单如何执行，不能说明谁发出订单、掌握多少信息，或是否开了新仓。本例场所、数量与价格均为示例。",
						)}
					</p>
				</>
			}
		/>
	);
}

type BlockPrint = "auction" | "ask" | "above";
const blockPrints: readonly BlockPrint[] = ["auction", "ask", "above"];

export function BlockScene({ locale }: Props) {
	const data = useConditionsData();
	const l = text(locale);
	const [mode, setMode] = useGuidedState<BlockPrint>("auction", blockPrints);
	const { bidCents, askCents, size } = data.block;
	const printCents =
		mode === "auction"
			? (bidCents + askCents) / 2
			: mode === "ask"
				? askCents
				: askCents + 5;
	const code = locationCode(printCents, bidCents, askCents);
	const x = (cents: number) => 60 + ((cents - (bidCents - 10)) / 30) * 240;
	const evidence =
		mode === "auction"
			? l(
					"Weak: the price was arranged in an auction",
					"较弱：价格在竞价中安排形成",
				)
			: mode === "ask"
				? l(
						"Suggests buyer-initiated, if the quote is current",
						"若报价为当时报价，可提示买方主动",
					)
				: l(
						"Check timing and the condition code first",
						"先检查时间与条件代码",
					);
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Where a large print sits against the displayed quote",
						"大额成交相对展示报价的位置",
					)}
					height={300}
				>
					<SvgText x={180} y={32} strong>
						{l("Block", "大宗")} · {number(size)} {l("contracts", "张")}
					</SvgText>
					<SvgText x={180} y={56} muted>
						{data.contract}
					</SvgText>
					<path d="M40 160H320" className="contract-svg-line" />
					<rect
						x={x(bidCents)}
						y="140"
						width={x(askCents) - x(bidCents)}
						height="40"
						className="contract-svg-wash"
					/>
					<SvgText x={x(bidCents)} y={205} muted>
						{l("Bid", "买价")} {price(bidCents)}
					</SvgText>
					<SvgText x={x(askCents)} y={205} muted>
						{l("Ask", "卖价")} {price(askCents)}
					</SvgText>
					<m.circle
						cx={x(printCents)}
						cy={160}
						r="9"
						fill="var(--diagram-unknown)"
						stroke="var(--foreground)"
						strokeWidth="2"
						initial={false}
						animate={{ cx: x(printCents) }}
						transition={lessonTransition}
					/>
					<SvgText x={x(printCents)} y={124}>
						{price(printCents)} · {code}
					</SvgText>
					<rect
						x="40"
						y="236"
						width="280"
						height="46"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={264}>
						{l("Size adds no direction", "数量本身不提供方向")}
					</SvgText>
				</Diagram>
			}
			outcome={
				<SceneOutcome
					locale={locale}
					items={[
						{ id: "code", label: l("Location code", "位置代码"), value: code },
						{
							id: "premium",
							label: l("Premium", "权利金"),
							value: usd((printCents * size * data.multiplier) / 100),
						},
						{
							id: "evidence",
							label: l("Aggressor evidence", "主动方证据"),
							value: evidence,
							tone: mode === "ask" ? "observed" : "unknown",
						},
					]}
				/>
			}
			controls={
				<ChoiceField
					label={l("How it printed", "打印方式")}
					value={mode}
					options={[
						["auction", l("Auction · $2.05", "竞价 · $2.05")],
						["ask", l("At the ask", "卖价")],
						["above", l("Above the ask", "高于卖价")],
					]}
					onChange={setMode}
				/>
			}
			details={
				<>
					<p className="text-muted-foreground text-sm leading-7">
						{l(
							"Block, auction and cross conditions describe how a large trade was matched. A negotiated price can sit inside, at or even outside the displayed quote, so its bid/ask location is weaker evidence of who initiated it.",
							"大宗、竞价与交叉条件描述大额交易如何撮合。协商价格可能在展示报价之内、等于报价，甚至超出报价，因此买卖价位置作为主动方证据较弱。",
						)}
					</p>
					<p className="text-muted-foreground text-xs leading-6">
						{l(
							"Neither the size nor the mechanism identifies an institution, informed trading or an opening position.",
							"数量与撮合机制都不能识别机构、知情交易或开仓。",
						)}
					</p>
				</>
			}
		/>
	);
}

type PackageView = "legs" | "package";
// Three frames so each authored caption gets its own stop.
const packageViews: readonly PackageView[] = ["legs", "package", "package"];

export function PackageScene({ locale }: Props) {
	const data = useConditionsData();
	const l = text(locale);
	const [view, setView] = useGuidedState<PackageView>("legs", packageViews);
	const { lower, upper, netCents, contracts } = data.spread;
	const market = packageMarket(lower, upper);
	const legs = [
		{ leg: lower, action: l("bought", "买入") },
		{ leg: upper, action: l("sold", "卖出") },
	];
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Two leg prints of one spread order, read leg by leg or as a package",
						"同一价差订单的两条腿成交，分腿解读或作为整体解读",
					)}
					height={330}
				>
					<SvgText x={180} y={30} strong>
						{lower.strike}/{upper.strike} {l("call spread", "看涨价差")} ×{" "}
						{contracts}
					</SvgText>
					{legs.map(({ leg, action }, i) => {
						const code = locationCode(
							leg.printCents,
							leg.bidCents,
							leg.askCents,
						);
						const y = 58 + i * 92;
						return (
							<g key={leg.strike}>
								<rect
									x="20"
									y={y}
									width="320"
									height="78"
									rx="12"
									className={
										view === "legs" ? "contract-svg-paper" : "contract-svg-line"
									}
								/>
								<SvgText x={180} y={y + 26} muted>
									{leg.strike} {l("call", "看涨")} · {price(leg.bidCents)} ×{" "}
									{price(leg.askCents)}
								</SvgText>
								<SvgText x={180} y={y + 56}>
									{view === "legs"
										? `${l("Print", "成交")} ${price(leg.printCents)} → ${code}`
										: `${action} ${price(leg.printCents)}`}
								</SvgText>
							</g>
						);
					})}
					<rect
						x="20"
						y="244"
						width="320"
						height="74"
						rx="12"
						className={
							view === "package" ? "contract-svg-wash" : "contract-svg-paper"
						}
					/>
					<SvgText x={180} y={270} muted>
						{l("Package market", "组合市场")} {price(market.bidCents)} ×{" "}
						{price(market.askCents)}
					</SvgText>
					<SvgText x={180} y={300}>
						{view === "package"
							? `${l("Net", "净价")} ${price(netCents)} → ${locationCode(netCents, market.bidCents, market.askCents)}`
							: l("Read the legs together?", "是否应合并解读？")}
					</SvgText>
				</Diagram>
			}
			outcome={
				<SceneOutcome
					locale={locale}
					items={
						view === "legs"
							? [
									{
										id: "lower",
										label: l(
											`${lower.strike} call leg`,
											`${lower.strike} 看涨腿`,
										),
										value: locationCode(
											lower.printCents,
											lower.bidCents,
											lower.askCents,
										),
									},
									{
										id: "upper",
										label: l(
											`${upper.strike} call leg`,
											`${upper.strike} 看涨腿`,
										),
										value: locationCode(
											upper.printCents,
											upper.bidCents,
											upper.askCents,
										),
									},
									{
										id: "reading",
										label: l("Leg-by-leg reading", "分腿解读"),
										value: l(
											"Misleading: the 110 call was sold",
											"有误导：110 看涨其实是卖出",
										),
										tone: "loss",
									},
								]
							: [
									{
										id: "net",
										label: l("Net debit", "净支付"),
										value: price(netCents),
									},
									{
										id: "market",
										label: l("Package market", "组合市场"),
										value: `${price(market.bidCents)}–${price(market.askCents)}`,
									},
									{
										id: "premium",
										label: l("Total premium", "总权利金"),
										value: usd((netCents * contracts * data.multiplier) / 100),
									},
								]
					}
				/>
			}
			controls={
				<ChoiceField
					label={l("Read the prints as", "解读方式")}
					value={view}
					options={[
						["legs", l("Two separate legs", "两条独立的腿")],
						["package", l("One package", "一个整体")],
					]}
					onChange={setView}
				/>
			}
			details={
				<>
					<p className="text-muted-foreground text-sm leading-7">
						{l(
							"Multi-leg and stock-tied orders are priced as a whole. Individual leg prices can fall outside their own quotes while the package trades inside its market, so classifying each leg alone can reverse its direction.",
							"多腿及股票关联订单按整体定价。单腿价格可能超出各自报价，而整体仍在组合市场内成交，因此单独分类每条腿可能把方向弄反。",
						)}
					</p>
					<p className="text-muted-foreground text-xs leading-6">
						{l(
							"A complex-order condition tells you to look for the linked legs. Without that flag and the other legs, a feed can misread the trade.",
							"复杂订单条件提示你寻找关联腿。缺少该标记与其他腿时，数据源可能误读这笔交易。",
						)}
					</p>
				</>
			}
		/>
	);
}

const claimCopy: Record<ConditionClaim, readonly [string, string]> = {
	meaning: ["Condition meaning", "条件含义"],
	owner: ["Common owner", "共同归属"],
	institution: ["Institutional identity", "机构身份"],
	inside: ["Inside information", "内幕信息"],
	strategy: ["Complete strategy", "完整策略"],
};
export function ConditionScene({ locale }: Props) {
	const data = useConditionsData();
	const l = text(locale);
	const language = locale === "zh" ? 1 : 0;
	const motion = useLessonMotion();
	const [id, setId] = useGuidedState(
		data.conditions[0].id,
		data.conditions.map((item) => item.id),
	);
	const [definition, setDefinition] = useState("supplied");
	const [claim, setClaim] = useState<ConditionClaim>("meaning");
	const condition =
		data.conditions.find((c) => c.id === id) ?? data.conditions[0];
	const supported = conditionSupports(
		condition,
		definition === "supplied",
		claim,
	);
	const meaning = definition === "supplied" ? condition.meaning : null;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"A documented condition defines an execution attribute, not investor identity",
						"有定义的成交条件解释执行属性，不识别投资者身份",
					)}
					height={445}
				>
					<rect
						x="28"
						y="15"
						width="304"
						height="77"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={42} muted>
						{l("Separate illustrative large row", "独立大额示例记录")}
					</SvgText>
					<SvgText x={180} y={74} strong>
						{number(data.conditionQuantity)} {l("contracts", "张")}
					</SvgText>
					<path
						d="M180 92v29M180 191v28M180 280v31"
						className="contract-svg-line"
					/>
					<rect
						x="14"
						y="121"
						width="332"
						height="70"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={147} muted>
						{l("Condition family", "成交条件类别")}
					</SvgText>
					<SvgText x={180} y={176}>
						{condition.label[language]}
					</SvgText>
					<rect
						x="28"
						y="219"
						width="304"
						height="61"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={244} muted>
						{l("Inspect the claim", "检查结论")}
					</SvgText>
					<SvgText x={180} y={268}>
						{claimCopy[claim][language]}
					</SvgText>
					<m.path
						key={`${id}:${definition}:${claim}`}
						d="M180 92v29m0 70v28m0 61v31"
						className={
							supported ? "contract-svg-active-line" : "contract-svg-line"
						}
						strokeDasharray={supported ? undefined : "5 5"}
						initial={{ pathLength: motion ? 0 : 1 }}
						animate={{ pathLength: 1 }}
						transition={
							motion
								? { ...lessonTransition, duration: 0.4 }
								: instantTransition
						}
					/>
					<rect
						x="14"
						y="311"
						width="332"
						height="77"
						rx="12"
						className={supported ? "contract-svg-wash" : "contract-svg-paper"}
					/>
					<SvgText x={180} y={337} muted>
						{l("Supported by this evidence?", "当前证据支持吗？")}
					</SvgText>
					<g data-tape-condition-support>
						<SvgText x={180} y={368} strong>
							{supported
								? l("Definition only", "仅条件定义")
								: l("Not established", "不能确定")}
						</SvgText>
					</g>
					<SvgText x={180} y={427} muted>
						{l("Size is not an identity credential", "数量不是身份凭证")}
					</SvgText>
				</Diagram>
			}
			controls={
				<FieldGroup>
					<SelectField
						label={l("Condition example", "成交条件示例")}
						value={id}
						options={data.conditions.map((c) => [c.id, c.label[language]])}
						onChange={setId}
					/>
					<ChoiceField
						label={l("Source codebook", "来源代码手册")}
						value={definition}
						options={[
							["supplied", l("Supplied", "已提供")],
							["missing", l("Unavailable", "不可用")],
						]}
						onChange={setDefinition}
					/>
					<SelectField
						label={l("Test a claim", "检验结论")}
						value={claim}
						options={Object.entries(claimCopy).map(([key, copy]) => [
							key,
							copy[language],
						])}
						onChange={(value) => {
							if (Object.hasOwn(claimCopy, value))
								setClaim(value as ConditionClaim);
						}}
					/>
				</FieldGroup>
			}
			details={
				<>
					<p className="font-mono text-muted-foreground text-xs">
						{l(
							"Illustrative condition families · source definitions matter",
							"示例成交条件类别 · 需核对来源定义",
						)}
					</p>
					<Alert role="status">
						<AlertTitle>
							{meaning
								? l("Read the supplied definition", "阅读给定定义")
								: l("Meaning remains unmapped", "含义仍未映射")}
						</AlertTitle>
						<AlertDescription>
							{meaning
								? meaning[language]
								: l(
										"Without a documented mapping for this source, do not guess what the condition means. The large quantity does not repair the missing definition.",
										"没有对应来源的文档映射，就不应猜测条件含义。数量大无法补齐缺失定义。",
									)}
						</AlertDescription>
					</Alert>
					<p className="text-sm">
						{l(
							"A condition can describe routing, matching, execution method, linkage or size. None of these labels alone proves common ownership, institutional identity, inside information or a complete strategy.",
							"成交条件可描述路由、撮合、执行方式、关联或数量。这些标签本身不证明共同归属、机构身份、内幕信息或完整策略。",
						)}
					</p>
					<p className="text-muted-foreground text-xs">
						{l(
							"These are teaching categories, not a universal exchange-code table. Actual flags require the originating venue or feed's codebook.",
							"这些是教学类别，不是通用交易所代码表。真实标记需要依据原始场所或数据源的代码手册。",
						)}
					</p>
				</>
			}
		/>
	);
}
