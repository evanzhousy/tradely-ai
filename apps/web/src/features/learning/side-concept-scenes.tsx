import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { FieldGroup } from "@tradely/ui/components/field";
import * as m from "motion/react-m";
import { createContext, useContext, useState } from "react";
import { quoteMoney as money } from "@/domain/learning/quote-concept";
import {
	assessSideReference,
	type LocationCode,
	locateExecution,
	type ReferenceIssue,
	type SideClaim,
	type SideConceptData,
	sideClaimLevel,
} from "@/domain/learning/side-concept";
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

export const SideData = createContext<SideConceptData | null>(null);
function useSideData() {
	const data = useContext(SideData);
	if (!data)
		throw new Error("Execution-side scenes require authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const text = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const locationCopy: Record<LocationCode, readonly [string, string]> = {
	BBID: ["Below the bid", "低于买价"],
	BID: ["At the bid", "等于买价"],
	MID: ["Inside the spread", "价差之内"],
	ASK: ["At the ask", "等于卖价"],
	AASK: ["Above the ask", "高于卖价"],
};
const issueCopy: Record<ReferenceIssue, readonly [string, string]> = {
	missing: ["Reference missing", "参考缺失"],
	mismatch: ["Different contract", "合约不同"],
	stale: ["Stale reference", "参考已过时"],
	later: ["Quote is later", "报价晚于成交"],
	locked: ["Bid equals ask", "买价等于卖价"],
	crossed: ["Bid exceeds ask", "买价高于卖价"],
	complex: ["Review conditions", "需审查成交条件"],
	invalid: ["Invalid price data", "价格数据无效"],
};
function Snapshot({ locale }: Props) {
	const data = useSideData();
	const l = text(locale);
	return (
		<p className="font-mono text-muted-foreground text-xs leading-relaxed">
			{data.contract}
			<br />
			{data.date} · {data.printAt}
			<br />
			{l(
				"Fictional examples · prices in USD/share",
				"虚构示例 · 价格单位：美元/股",
			)}
		</p>
	);
}

export function LocationMapScene({ locale }: Props) {
	const data = useSideData();
	const l = text(locale);
	const motion = useLessonMotion();
	const playback = useFrames(data.examples.length);
	const [customPrice, setCustomPrice] = useState<number | null>(
		data.defaultPrice,
	);
	const price = customPrice ?? data.examples[playback.frame].price;
	const code = locateExecution(price, data.bid, data.ask);
	const midpoint = (data.bid + data.ask) / 2;
	const x = (p: number) =>
		40 +
		((p - data.priceRange[0]) / (data.priceRange[1] - data.priceRange[0])) *
			280;
	const pause = () => playback.select(playback.frame);
	const changePrice = (value: number) => {
		pause();
		setCustomPrice(value);
	};
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Move the print across bid, spread and ask regions",
						"移动成交价穿越买价、价差与卖价区域",
					)}
					height={410}
				>
					<rect
						x="14"
						y="15"
						width="150"
						height="70"
						rx="12"
						className="contract-svg-paper"
					/>
					<rect
						x="196"
						y="15"
						width="150"
						height="70"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={89} y={40} muted>
						{l("BID", "买价")}
					</SvgText>
					<SvgText x={89} y={69} strong>
						{money(data.bid)}
					</SvgText>
					<SvgText x={271} y={40} muted>
						{l("ASK", "卖价")}
					</SvgText>
					<SvgText x={271} y={69} strong>
						{money(data.ask)}
					</SvgText>
					<SvgText x={180} y={125} strong>
						{l("Print", "成交价")} {money(price)}
					</SvgText>
					<rect
						x={x(data.bid)}
						y="160"
						width={x(data.ask) - x(data.bid)}
						height="40"
						rx="10"
						className="contract-svg-wash"
					/>
					<path d="M40 180H320" className="contract-svg-line" />
					<path
						d={`M${x(data.bid)} 155v54M${x(data.ask)} 155v54`}
						className="contract-svg-active-line"
					/>
					<path
						d={`M${x(midpoint)} 153v62`}
						className="contract-svg-line"
						strokeDasharray="4 4"
					/>
					<m.circle
						initial={false}
						cx={x(price)}
						cy="180"
						r="10"
						className="contract-svg-handle"
						animate={{ cx: x(price) }}
						transition={
							playback.playing && motion ? lessonTransition : instantTransition
						}
					/>
					<foreignObject x="20" y="140" width="320" height="80">
						<input
							className="contract-range contract-svg-range"
							type="range"
							aria-label={l("Drag execution marker", "拖动成交标记")}
							aria-valuetext={`${money(price)} · ${code}`}
							min={data.priceRange[0]}
							max={data.priceRange[1]}
							step={1}
							value={price}
							onPointerDown={pause}
							onKeyDown={pause}
							onChange={(e) => changePrice(Number(e.target.value))}
						/>
					</foreignObject>
					<SvgText x={60} y={240} muted>
						BBID
					</SvgText>
					<SvgText x={x(data.bid)} y={263} muted>
						BID
					</SvgText>
					<SvgText x={180} y={240} muted>
						MID
					</SvgText>
					<SvgText x={x(data.ask)} y={263} muted>
						ASK
					</SvgText>
					<SvgText x={300} y={240} muted>
						AASK
					</SvgText>
					<rect
						x="50"
						y="287"
						width="260"
						height="75"
						rx="12"
						className="contract-svg-wash"
					/>
					<g data-side-code>
						<SvgText x={180} y={319} strong>
							{code ?? "—"}
						</SvgText>
					</g>
					<SvgText x={180} y={344} muted>
						{code ? locationCopy[code][locale === "zh" ? 1 : 0] : "—"}
					</SvgText>
					<SvgText x={180} y={394} muted>
						{l("Arithmetic midpoint", "算术中点")} {money(midpoint)}
					</SvgText>
				</Diagram>
			}
		>
			<Snapshot locale={locale} />
			<FieldGroup>
				<div onPointerDownCapture={pause} onKeyDownCapture={pause}>
					<RangeControl
						label={l("Execution price", "成交价格")}
						value={price}
						display={money(price)}
						min={data.priceRange[0]}
						max={data.priceRange[1]}
						onChange={changePrice}
					/>
				</div>
				<ChoiceField
					label={l("Explore a region", "探索位置区间")}
					value={
						customPrice === null ? data.examples[playback.frame].code : "custom"
					}
					options={data.examples.map((e) => [e.code, e.code])}
					onChange={(value) => {
						const index = data.examples.findIndex((e) => e.code === value);
						if (index >= 0) {
							playback.select(index);
							setCustomPrice(null);
						}
					}}
				/>
			</FieldGroup>
			<PlaybackButton
				playing={playback.playing}
				onClick={() => {
					setCustomPrice(null);
					playback.toggle();
				}}
				l={l}
			/>
			<Alert role="note">
				<AlertTitle>
					{l("MID does not mean exactly halfway", "MID 不等于恰好一半")}
				</AlertTitle>
				<AlertDescription>
					<p data-side-midpoint>
						{price === midpoint
							? l(
									"This print happens to equal the arithmetic midpoint. Other prices strictly between bid and ask are also MID.",
									"此成交价恰好等于算术中点，但严格位于买卖价之间的其他价格也属于 MID。",
								)
							: l(
									`The midpoint is ${money(midpoint)}. This print is ${money(price)}. Any price strictly between bid and ask is MID under this lesson's convention.`,
									`算术中点为 ${money(midpoint)}，此成交价为 ${money(price)}。本课约定：严格位于买卖价之间的任何价格均属于 MID。`,
								)}
					</p>
				</AlertDescription>
			</Alert>
			<p className="text-muted-foreground text-xs">
				{l(
					"A matched, valid quote is supplied here. Dragging is a what-if comparison, not a new trade. Location codes follow this lesson's stated convention; feeds can differ.",
					"此处提供匹配有效报价。拖动仅作假设比较，不产生新成交。位置代码遵循本课声明的约定，不同数据源可能不同。",
				)}
			</p>
		</SceneLayout>
	);
}

export function QuoteReferenceScene({ locale }: Props) {
	const data = useSideData();
	const l = text(locale);
	const motion = useLessonMotion();
	const [id, setId] = useState(data.references[0].id);
	const reference =
		data.references.find((r) => r.id === id) ?? data.references[0];
	const result = assessSideReference(data.contract, data.ask, reference);
	const language = locale === "zh" ? 1 : 0;
	const age = reference.secondsBeforePrint;
	const plot = (secondsBefore: number) =>
		38 + ((90 - secondsBefore) / 92) * 284;
	const printX = plot(0);
	const quoteX = age === null ? null : plot(age);
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Compare quote timing while preserving the recorded execution",
						"比较报价时间，保留原始成交",
					)}
					height={425}
				>
					<SvgText x={180} y={29} muted>
						{l("Quote", "报价")} · {reference.at ?? l("missing", "缺失")}
					</SvgText>
					<path d="M38 85H322M38 151H322" className="contract-svg-line" />
					{quoteX === null ? null : (
						<>
							<circle cx={quoteX} cy="85" r="7" className="contract-svg-dot" />
							<path
								d={`M${quoteX} 85V105H${printX}V151`}
								className="contract-svg-line"
								strokeDasharray="5 5"
							/>
							{result.code ? (
								<m.path
									key={id}
									d={`M${quoteX} 85V105H${printX}V151`}
									className="contract-svg-active-line"
									initial={{ pathLength: motion ? 0 : 1 }}
									animate={{ pathLength: 1 }}
									transition={motion ? lessonTransition : instantTransition}
								/>
							) : null}
						</>
					)}
					<SvgText x={180} y={125} muted>
						{l("Print", "成交")} · {data.printAt}
					</SvgText>
					<circle cx={printX} cy="151" r="9" className="contract-svg-handle" />
					<SvgText x={180} y={190} muted>
						{age === null
							? l("Quote time unavailable", "报价时间不可用")
							: age >= 0
								? l(`${age}s before the print`, `早于成交 ${age} 秒`)
								: l(
										`${Math.abs(age)}s after the print`,
										`晚于成交 ${Math.abs(age)} 秒`,
									)}
					</SvgText>
					<rect
						x="30"
						y="216"
						width="300"
						height="108"
						rx="12"
						className={result.code ? "contract-svg-wash" : "contract-svg-paper"}
					/>
					<SvgText x={180} y={244} muted>
						{reference.bid === null ? "—" : money(reference.bid)} /{" "}
						{reference.ask === null ? "—" : money(reference.ask)}
					</SvgText>
					<g data-reference-code>
						<SvgText x={180} y={277} strong>
							{result.code ?? l("Withheld", "暂不分类")}
						</SvgText>
					</g>
					<SvgText x={180} y={306} muted>
						{result.issue
							? issueCopy[result.issue][language]
							: l("Matched, valid reference", "匹配有效参考")}
					</SvgText>
					<rect
						x="14"
						y="345"
						width="332"
						height="64"
						rx="12"
						className="contract-svg-wash"
					/>
					<SvgText x={180} y={368} muted>
						{l("Recorded print · retained", "原始成交 · 保留")}
					</SvgText>
					<g data-reference-print>
						<SvgText x={180} y={396} strong>
							{data.quantity} @ {money(data.ask)}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<Snapshot locale={locale} />
			<SelectField
				label={l("Reference evidence", "参考证据")}
				value={id}
				options={data.references.map((r) => [r.id, r.label[language]])}
				onChange={setId}
			/>
			<p
				className="font-mono text-muted-foreground text-xs"
				data-reference-contract
			>
				{l("Quote contract", "报价合约")}:<br />
				{reference.contract}
			</p>
			<Alert role="status">
				<AlertTitle>
					{result.issue
						? issueCopy[result.issue][language]
						: l("This comparison is supported", "此比较得到支持")}
				</AlertTitle>
				<AlertDescription>
					{result.issue === "missing"
						? l(
								"Without both quote boundaries and timing, a reliable location cannot be assigned. Missing is not zero.",
								"缺少买卖价边界或时间，无法可靠确定位置。缺失不等于零。",
							)
						: result.issue === "mismatch"
							? l(
									"A quote for another contract is not this print's reference, even if its numbers look plausible.",
									"即使价格看似合理，另一张合约的报价也不能作为此成交的参考。",
								)
							: result.issue === "stale" || result.issue === "later"
								? l(
										"The supplied reference is not aligned to this execution. Keep the price; withhold reliable quote-side interpretation. This does not reverse buyer into seller.",
										"给定参考未与此成交对齐。保留成交价，暂不作可靠的报价侧解释；这不会把买方反转为卖方。",
									)
								: result.issue === "locked" || result.issue === "crossed"
									? l(
											"This five-region map needs bid strictly below ask. A locked or crossed quote breaks that assumption; do not force a label.",
											"五区域地图要求买价严格低于卖价。锁定或交叉报价破坏该前提，不能强行贴标签。",
										)
									: result.issue === "complex"
										? l(
												"This leg is flagged for complex-order condition review. A simple comparison is withheld until those conditions are understood.",
												"此单腿已标记为需审查复杂订单条件。在理解这些条件之前，暂不使用简单比较。",
											)
										: result.issue === "invalid"
											? l(
													"Invalid price or timing data cannot support a reliable comparison.",
													"无效价格或时间数据无法支持可靠比较。",
												)
											: l(
													"The supplied quote is for the same contract, aligned to the print, with bid below ask and no special-condition flag.",
													"给定报价属于同一合约、与成交对齐、买价低于卖价，且无特殊条件标记。",
												)}
				</AlertDescription>
			</Alert>
			<p className="text-muted-foreground text-xs">
				{l(
					"Alignment status is supplied for these examples. A timestamp alone is not proof of comparability; this lesson sets no universal age cutoff.",
					"这些示例给定了时间对齐状态。单有时间戳不能证明可比，本课不设通用的报价时效阈值。",
				)}
			</p>
		</SceneLayout>
	);
}

export function SideClaimScene({ locale }: Props) {
	const data = useSideData();
	const l = text(locale);
	const motion = useLessonMotion();
	const [price, setPrice] = useState(data.ask);
	const [claim, setClaim] = useState<SideClaim>("location");
	const code = locateExecution(price, data.bid, data.ask);
	const level = sideClaimLevel(code, claim);
	const language = locale === "zh" ? 1 : 0;
	const options: readonly (readonly [SideClaim, string])[] = [
		["location", l("Location", "位置")],
		["initiation", l("Initiator", "主动方")],
		["order", l("Order type", "订单类型")],
		["belief", l("Trader belief", "交易者观点")],
		["position", l("Open / close", "开仓 / 平仓")],
	];
	const levels = ["observed", "inference", "unknown"] as const;
	const y = 238 + levels.indexOf(level) * 66;
	const possible =
		code === "ASK"
			? l("Possible buyer initiation", "可能由买方主动发起")
			: code === "BID"
				? l("Possible seller initiation", "可能由卖方主动发起")
				: l("Initiation unresolved", "主动方未确定");
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"A location observation, qualified inference and unknown intent",
						"位置观察、有限推断与未知意图",
					)}
					height={432}
				>
					<rect
						x="32"
						y="15"
						width="296"
						height="74"
						rx="12"
						className="contract-svg-wash"
					/>
					<SvgText x={180} y={45} strong>
						{money(price)} · {code ?? "—"}
					</SvgText>
					<SvgText x={180} y={72} muted>
						{l("Matched quote", "匹配报价")} {money(data.bid)} /{" "}
						{money(data.ask)}
					</SvgText>
					<path d="M180 89v24" className="contract-svg-line" />
					<rect
						x="52"
						y="113"
						width="256"
						height="62"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={137} muted>
						{l("Inspecting the claim", "正在检查结论")}
					</SvgText>
					<SvgText x={180} y={161}>
						{options.find(([id]) => id === claim)?.[1]}
					</SvgText>
					<m.path
						key={`${claim}:${code}`}
						d={`M180 175v19H7V${y}h7`}
						className={
							level === "unknown"
								? "contract-svg-line"
								: "contract-svg-active-line"
						}
						strokeDasharray={level === "observed" ? undefined : "5 5"}
						initial={{ pathLength: motion ? 0 : 1 }}
						animate={{ pathLength: 1 }}
						transition={
							motion
								? { ...lessonTransition, duration: 0.4 }
								: instantTransition
						}
					/>
					{levels.map((item, i) => (
						<g key={item}>
							<rect
								x="14"
								y={210 + i * 66}
								width="332"
								height="56"
								rx="10"
								className={
									level === item ? "contract-svg-wash" : "contract-svg-paper"
								}
							/>
							<SvgText x={180} y={232 + i * 66} muted>
								{i === 0
									? l("OBSERVATION", "观察事实")
									: i === 1
										? l("INFERENCE · not proof", "推断 · 不是证明")
										: l("NOT ESTABLISHED", "证据不足")}
							</SvgText>
							<SvgText x={180} y={254 + i * 66}>
								{i === 0
									? `${code} · ${code ? locationCopy[code][language] : "—"}`
									: i === 1
										? possible
										: level === "unknown"
											? `${options.find(([id]) => id === claim)?.[1]} · ${l("unknown", "未知")}`
											: l(
													"Order · belief · open/close",
													"订单 · 观点 · 开平仓",
												)}
							</SvgText>
						</g>
					))}
					<SvgText x={180} y={422} muted>
						{l(
							"One code cannot describe a whole strategy",
							"一个代码无法描述完整策略",
						)}
					</SvgText>
				</Diagram>
			}
		>
			<Snapshot locale={locale} />
			<FieldGroup>
				<SelectField
					label={l("Execution example", "成交示例")}
					value={String(price)}
					options={data.examples.map((e) => [
						String(e.price),
						`${e.code} · ${money(e.price)}`,
					])}
					onChange={(v) => setPrice(Number(v))}
				/>
				<ChoiceField
					label={l("Inspect a claim", "检查结论")}
					value={claim}
					options={options}
					onChange={setClaim}
				/>
			</FieldGroup>
			<Alert role="status">
				<AlertTitle data-side-claim-level>
					{level === "observed"
						? l("Supported location", "有依据的位置")
						: level === "inference"
							? l("Possible inference, not proof", "可能的推断，不是证明")
							: l("Not established by this evidence", "当前证据无法确定")}
				</AlertTitle>
				<AlertDescription>
					{claim === "location"
						? l(
								"The code describes where this price lies relative to the supplied valid quote. It is a price comparison, not an investor profile.",
								"该代码描述此价格相对于给定有效报价的位置。它是价格比较，不是投资者画像。",
							)
						: claim === "initiation"
							? code === "ASK" || code === "BID"
								? l(
										"At-ask or at-bid location may support an aggressor inference. To establish who initiated, inspect suitable order and execution evidence.",
										"等于卖价或买价的位置可支持主动方推断。要确定谁主动发起，还需适当的订单与执行证据。",
									)
								: l(
										"An inside- or outside-spread price alone does not establish the aggressor here. Review timing, conditions and order evidence before interpreting it.",
										"此处仅凭价差内或价差外价格无法确定主动方。解释前应审查时间、成交条件与订单证据。",
									)
							: claim === "order"
								? l(
										"An ASK print can come from a market order or a marketable limit. The location label does not specify the original order type.",
										"ASK 成交可能来自市价单或可成交限价单，位置标签不说明原始订单类型。",
									)
								: claim === "belief"
									? l(
											"The label does not prove bullishness, conviction or desperation. Even an above-ask print may reflect timing or special conditions.",
											"标签不证明看涨观点、确信或恐慌。即使高于卖价成交，也可能涉及时间差或特殊条件。",
										)
									: l(
											"Buying and selling do not specify opening or closing. Position history or explicit instructions are needed; a location code supplies neither.",
											"买卖行为不说明开仓还是平仓。需要持仓历史或明确指令，位置代码不提供这些信息。",
										)}
				</AlertDescription>
			</Alert>
			<p className="text-muted-foreground text-xs">
				{l(
					"Changing the claim changes what is supported, not the recorded price or its location. Every example remains one execution.",
					"切换结论改变的是证据支持范围，不改变成交价或位置。每个示例仍是一笔成交。",
				)}
			</p>
		</SceneLayout>
	);
}
