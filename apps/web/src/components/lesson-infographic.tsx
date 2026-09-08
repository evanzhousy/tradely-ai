import { cn } from "@tradely/ui/lib/utils";
import { useId } from "react";
import { syllabus } from "@/content/syllabus";
import type { Locale } from "@/i18n/messages";
import { useLessonInfographicMotion } from "./lesson-infographic-motion";

const terms = {
	question: ["Question", "问题"],
	source: ["Source", "来源"],
	horizon: ["Horizon", "时间范围"],
	invalidation: ["Reconsider when…", "重新考虑的条件…"],
	universe: ["Comparable universe", "可比范围"],
	eligible: ["Eligible", "符合条件"],
	excluded: ["Outside the scope", "范围之外"],
	inspect: ["Inspect", "检视"],
	rank: ["Priority for review", "检视优先级"],
	freshness: ["Check the clock", "核对时间"],
	symbol: ["Symbol", "标的"],
	lens: ["Active lens", "当前视角"],
	asOf: ["As of", "数据时间"],
	strike: ["Strike", "行权价"],
	expiry: ["Expiry", "到期日"],
	contract: ["One contract", "一份合约"],
	bid: ["Bid", "买价"],
	ask: ["Ask", "卖价"],
	trade: ["Trade", "成交"],
	quote: ["Quote", "报价"],
	context: ["Context", "背景"],
	session: ["Session flow", "当日资金流"],
	structure: ["Standing structure", "持仓结构"],
	flow: ["Signed flow", "带符号资金流"],
	intensity: ["Magnitude", "强度"],
	model: ["Modeled structure", "模型结构"],
	evidence: ["Evidence", "证据"],
	packet: ["Research packet", "研究记录"],
	review: ["Review", "复核"],
	recap: ["Market recap", "市场复盘"],
	claim: ["Claim", "结论"],
	trace: ["Trace the source", "追溯来源"],
	challenge: ["Challenge the claim", "质疑结论"],
	publish: ["Publish", "发布"],
} as const;

type Label = (key: keyof typeof terms) => string;
type DiagramProps = { label: Label };

// The complete path stays visible underneath its temporary drawing accent.
function TracePath({
	d,
	className = "diagram-line",
	delay = 0,
	duration = 850,
}: {
	d: string;
	className?: string;
	delay?: number;
	duration?: number;
}) {
	return (
		<>
			<path d={d} className={className} />
			<path
				d={d}
				pathLength={1}
				strokeDasharray="1"
				strokeDashoffset="1"
				className={cn(
					"diagram-motion-trace",
					className === "diagram-on-accent-line" && "diagram-motion-ink",
				)}
				data-diagram-motion="trace"
				data-diagram-delay={delay}
				data-diagram-duration={duration}
			/>
		</>
	);
}

function Boundary({ label }: DiagramProps) {
	return (
		<>
			<rect
				x="42"
				y="31"
				width="276"
				height="141"
				rx="13"
				className="diagram-dashed"
			/>
			<TracePath
				d="M180 83v13m-73 0h146m-146 0v15m146-15v15"
				className="diagram-line"
				delay={100}
			/>
			<rect
				x="118"
				y="49"
				width="124"
				height="34"
				rx="17"
				className="diagram-accent"
				data-diagram-motion="pulse"
				data-diagram-duration="550"
			/>
			<text x="180" y="70" className="diagram-on-accent">
				{label("question")}
			</text>
			<rect
				x="57"
				y="111"
				width="100"
				height="32"
				rx="6"
				className="diagram-paper"
			/>
			<rect
				x="203"
				y="111"
				width="100"
				height="32"
				rx="6"
				className="diagram-paper"
			/>
			<text x="107" y="131">
				{label("source")}
			</text>
			<text x="253" y="131">
				{label("horizon")}
			</text>
			<circle
				cx="180"
				cy="172"
				r="5"
				data-diagram-motion="pulse"
				data-diagram-delay="650"
				className="diagram-ink"
			/>
			<text x="180" y="197" className="diagram-muted-text">
				{label("invalidation")}
			</text>
		</>
	);
}

function Universe({ label }: DiagramProps) {
	return (
		<>
			<rect
				x="97"
				y="36"
				width="166"
				height="132"
				rx="15"
				className="diagram-accent-wash"
			/>
			{Array.from({ length: 24 }, (_, index) => {
				const column = index % 6;
				const row = Math.floor(index / 6);
				const inside = column > 0 && column < 5;
				return (
					<circle
						key={`${row}-${column}`}
						cx={70 + column * 44}
						cy={55 + row * 31}
						r={inside ? 7 : 4}
						data-diagram-motion={inside ? "pulse" : undefined}
						data-diagram-delay={row * 90 + column * 35}
						data-diagram-duration="440"
						className={inside ? "diagram-ink" : "diagram-faint-fill"}
					/>
				);
			})}
			<circle
				cx="202"
				cy="86"
				r="17"
				className="diagram-highlight-ring"
				data-diagram-motion="pulse"
				data-diagram-delay="600"
			/>
			<text x="180" y="25">
				{label("universe")}
			</text>
			<path d="M110 178h140" className="diagram-line" />
			<text x="180" y="197" className="diagram-muted-text">
				{label("eligible")}
			</text>
		</>
	);
}

function Ranking({ label }: DiagramProps) {
	return (
		<>
			{[132, 103, 76, 51].map((width, index) => (
				<g key={width}>
					<text x="48" y={61 + index * 34} className="diagram-muted-text">
						0{index + 1}
					</text>
					<rect
						x="68"
						y={46 + index * 34}
						width={width}
						height="20"
						rx="4"
						className={index === 0 ? "diagram-accent" : "diagram-faint-fill"}
						data-diagram-motion={index === 0 ? "pulse" : undefined}
						data-diagram-duration="550"
					/>
				</g>
			))}
			<TracePath
				d="M215 57h40m-5-5 5 5-5 5"
				className="diagram-line"
				delay={150}
			/>
			<g data-diagram-motion="settle" data-diagram-delay="320">
				<circle cx="281" cy="57" r="20" className="diagram-paper" />
				<circle cx="279" cy="54" r="7" className="diagram-line" />
				<path d="m284 60 6 6" className="diagram-line" />
			</g>
			<text x="281" y="97">
				{label("inspect")}
			</text>
			<text x="180" y="195" className="diagram-muted-text">
				{label("rank")}
			</text>
		</>
	);
}

function Freshness({ label }: DiagramProps) {
	return (
		<>
			<rect
				x="66"
				y="26"
				width="214"
				height="155"
				rx="10"
				className="diagram-paper"
			/>
			<path d="M66 59h214" className="diagram-faint-line" />
			<circle cx="81" cy="43" r="3" className="diagram-ink" />
			<path d="M94 43h66" className="diagram-line" />
			{(["symbol", "lens", "asOf"] as const).map((term, index) => (
				<g key={term}>
					<text
						x="91"
						y={87 + index * 32}
						textAnchor="start"
						className="diagram-muted-text"
					>
						{label(term)}
					</text>
					<TracePath
						d={`M190 ${83 + index * 32}h62`}
						delay={index * 150}
						className={
							index === 2 ? "diagram-accent-line" : "diagram-faint-line"
						}
					/>
				</g>
			))}
			<circle cx="280" cy="147" r="28" className="diagram-accent" />
			<path
				data-diagram-motion="tick"
				data-diagram-delay="350"
				style={{ transformOrigin: "280px 147px" }}
				d="M280 130v17l12 7"
				className="diagram-on-accent-line"
			/>
			<text x="177" y="202" className="diagram-muted-text">
				{label("freshness")}
			</text>
		</>
	);
}

function Contracts({ label }: DiagramProps) {
	return (
		<>
			{Array.from({ length: 12 }, (_, index) => {
				const column = index % 4;
				const row = Math.floor(index / 4);
				return (
					<rect
						key={`${row}-${column}`}
						x={83 + column * 49}
						y={39 + row * 37}
						width="40"
						height="28"
						rx="5"
						className={index === 6 ? "diagram-accent" : "diagram-paper"}
						data-diagram-motion={index === 6 ? "pulse" : undefined}
						data-diagram-delay="320"
					/>
				);
			})}
			<TracePath
				d="M69 39v102m14 14h187"
				className="diagram-line"
				duration={900}
			/>
			<path d="m65 45 4-6 4 6m191 106 6 4-6 4" className="diagram-line" />
			<circle cx="201" cy="90" r="5" className="diagram-ink" />
			<TracePath d="M201 104v64" className="diagram-dashed" delay={450} />
			<text
				x="40"
				y="91"
				transform="rotate(-90 40 91)"
				className="diagram-muted-text"
			>
				{label("strike")}
			</text>
			<text x="115" y="177" className="diagram-muted-text">
				{label("expiry")}
			</text>
			<text x="233" y="193">
				{label("contract")}
			</text>
		</>
	);
}

function Print({ label }: DiagramProps) {
	return (
		<>
			<TracePath d="M60 91h240M60 82v18m240-18v18" className="diagram-line" />
			<rect
				x="107"
				y="79"
				width="149"
				height="24"
				rx="12"
				className="diagram-accent-wash"
			/>
			<circle
				cx="233"
				cy="91"
				r="9"
				data-diagram-motion="pulse"
				data-diagram-delay="450"
				className="diagram-accent"
			/>
			<TracePath d="M233 43v34" className="diagram-dashed" delay={200} />
			<text x="233" y="33">
				{label("trade")}
			</text>
			<text x="61" y="123" className="diagram-muted-text">
				{label("bid")}
			</text>
			<text x="299" y="123" className="diagram-muted-text">
				{label("ask")}
			</text>
			{(["quote", "trade", "context"] as const).map((term, index) => (
				<g key={term}>
					<rect
						x={46 + index * 94}
						y="153"
						width="80"
						height="30"
						rx="6"
						className="diagram-paper"
						data-diagram-motion="focus"
						data-diagram-delay={350 + index * 150}
					/>
					<text x={86 + index * 94} y="173">
						{label(term)}
					</text>
				</g>
			))}
		</>
	);
}

function TwoClocks({ label }: DiagramProps) {
	return (
		<>
			<text x="41" y="31" textAnchor="start">
				{label("session")}
			</text>
			<path d="M42 89h268" className="diagram-faint-line" />
			<TracePath
				d="M43 80h23l8-22 11 37 10-51 12 37h26l8-12 11 18 10-39 12 32h28l10-22 11 31 10-44 12 35h30"
				className="diagram-accent-line"
				duration={780}
			/>
			<text x="41" y="132" textAnchor="start">
				{label("structure")}
			</text>
			<path d="M42 180h268" className="diagram-faint-line" />
			<TracePath
				d="M44 172h47v-19h65v8h53v-24h55v14h44"
				className="diagram-line"
				delay={240}
				duration={1100}
			/>
			<circle cx="308" cy="54" r="13" className="diagram-paper" />
			<path
				data-diagram-motion="tick"
				style={{ transformOrigin: "308px 54px" }}
				d="M308 45v9l6 4"
				className="diagram-line"
			/>
			<circle cx="308" cy="151" r="13" className="diagram-paper" />
			<path
				data-diagram-motion="tick"
				data-diagram-delay="360"
				data-diagram-duration="900"
				style={{ transformOrigin: "308px 151px" }}
				d="M308 142v9h7"
				className="diagram-line"
			/>
		</>
	);
}

function Lenses({ label }: DiagramProps) {
	return (
		<>
			{[28, 137, 246].map((x, index) => (
				<rect
					key={x}
					x={x}
					y="27"
					width="88"
					height="153"
					rx="8"
					className="diagram-paper"
					data-diagram-motion="focus"
					data-diagram-delay={index * 260}
				/>
			))}
			<text x="72" y="53">
				DEX
			</text>
			<text x="181" y="53">
				DEI
			</text>
			<text x="290" y="53">
				GEX
			</text>
			<path d="M40 113h64m45 22h64m45-22h64" className="diagram-faint-line" />
			<path
				d="M52 113v-20m14 20v21m14-21V77m14 36v11"
				className="diagram-bar"
			/>
			<TracePath
				d="M151 120c9 0 10-23 20-23s12-21 19-21 10 12 21 12"
				className="diagram-accent-line"
				delay={260}
			/>
			<circle cx="190" cy="76" r="5" className="diagram-accent" />
			<TracePath
				d="M258 134c22 0 22-65 37-65s10 44 28 44"
				className="diagram-line"
				delay={520}
			/>
			<path d="M294 65v82" className="diagram-dashed" />
			<text x="72" y="164" className="diagram-small-text">
				{label("flow")}
			</text>
			<text x="181" y="164" className="diagram-small-text">
				{label("intensity")}
			</text>
			<text x="290" y="164" className="diagram-small-text">
				{label("model")}
			</text>
		</>
	);
}

function Packet({ label }: DiagramProps) {
	return (
		<>
			<rect
				x="129"
				y="37"
				width="126"
				height="132"
				rx="8"
				className="diagram-faint-fill"
				transform="rotate(8 192 103)"
			/>
			<rect
				x="115"
				y="35"
				width="126"
				height="132"
				rx="8"
				className="diagram-paper"
			/>
			<TracePath
				d="M137 59h44m-44 18h81m-81 13h58"
				className="diagram-line"
				delay={180}
			/>
			<rect
				x="136"
				y="108"
				width="82"
				height="39"
				rx="4"
				className="diagram-accent-wash"
			/>
			<TracePath
				d="m145 135 16-9 15 4 17-13 17 5"
				className="diagram-line"
				delay={320}
			/>
			<TracePath d="M40 83h64m-6-5 6 5-6 5" />
			<TracePath d="M251 113h65m-6-5 6 5-6 5" delay={640} duration={650} />
			<text x="65" y="67" className="diagram-muted-text">
				{label("evidence")}
			</text>
			<text x="285" y="96" className="diagram-muted-text">
				{label("review")}
			</text>
			<text x="180" y="195">
				{label("packet")}
			</text>
		</>
	);
}

function Recap({ label }: DiagramProps) {
	return (
		<>
			<rect
				x="73"
				y="25"
				width="214"
				height="157"
				rx="8"
				className="diagram-paper"
			/>
			<text x="95" y="49" textAnchor="start">
				{label("recap")}
			</text>
			<path d="M94 64h172" className="diagram-line" />
			<rect
				x="94"
				y="79"
				width="86"
				height="62"
				rx="4"
				className="diagram-accent-wash"
			/>
			<TracePath d="m104 124 15-16 13 6 17-20 20 7" className="diagram-line" />
			<TracePath
				d="M194 87h71m-71 13h61m-61 13h69m-69 13h44M94 157h99"
				className="diagram-faint-line"
				delay={280}
			/>
			<circle
				cx="251"
				cy="157"
				r="15"
				data-diagram-motion="pulse"
				data-diagram-delay="550"
				className="diagram-accent"
			/>
			<TracePath
				d="m244 157 5 5 10-11"
				className="diagram-on-accent-line"
				delay={600}
				duration={600}
			/>
			<text x="180" y="203" className="diagram-muted-text">
				{label("evidence")} → {label("claim")}
			</text>
		</>
	);
}

function Audit({ label }: DiagramProps) {
	return (
		<>
			{(["trace", "challenge", "review"] as const).map((term, index) => (
				<g key={term}>
					<rect
						x="42"
						y={34 + index * 46}
						width="24"
						height="24"
						rx="5"
						className={index < 2 ? "diagram-accent" : "diagram-paper"}
					/>
					{index < 2 ? (
						<TracePath
							delay={index * 200}
							d={`m49 ${46 + index * 46} 4 4 7-8`}
							className="diagram-on-accent-line"
						/>
					) : (
						<circle
							cx="54"
							cy="138"
							r="3"
							data-diagram-motion="pulse"
							data-diagram-delay="450"
							className="diagram-ink"
						/>
					)}
					<text x="80" y={50 + index * 46} textAnchor="start">
						{label(term)}
					</text>
				</g>
			))}
			<TracePath
				d="M227 46h17v92h-17m17-46h35"
				className="diagram-line"
				delay={400}
			/>
			<path
				data-diagram-motion="pulse"
				data-diagram-delay="680"
				d="m292 66 26 26-26 26-26-26Z"
				className="diagram-accent"
			/>
			<TracePath
				d="M286 92h12m-5-5 5 5-5 5"
				className="diagram-on-accent-line"
				delay={660}
				duration={600}
			/>
			<text x="292" y="147">
				{label("publish")}
			</text>
			<path d="M53 180h254" className="diagram-dashed" />
		</>
	);
}

const illustrations = {
	"audited-boundary": {
		Diagram: Boundary,
		description: [
			"One research question connects to its source, time horizon, and a reason to reconsider.",
			"一个研究问题连接到资料来源、时间范围和重新考虑的条件。",
		],
	},
	"symbol-universe": {
		Diagram: Universe,
		description: [
			"A boundary selects a comparable group of symbols from a larger universe.",
			"从更大的标的集合中，划定符合条件且可比较的范围。",
		],
	},
	"rank-symbols": {
		Diagram: Ranking,
		description: [
			"The leading ranked row becomes a candidate for closer inspection.",
			"排名领先的标的成为进一步检视的候选对象。",
		],
	},
	"symbol-drawer": {
		Diagram: Freshness,
		description: [
			"A symbol detail sheet connects identity, the active lens, and data timestamps.",
			"标的详情页连接身份、当前视角和数据时间。",
		],
	},
	"rank-contracts": {
		Diagram: Contracts,
		description: [
			"One option contract is located among neighboring strikes and expiries.",
			"在相邻行权价与到期日构成的范围中定位一份期权合约。",
		],
	},
	"validate-option-print": {
		Diagram: Print,
		description: [
			"A trade is located relative to bid and ask, alongside its quote and context.",
			"结合报价和背景，查看一笔成交在买卖价之间的位置。",
		],
	},
	"session-flow-vs-structure": {
		Diagram: TwoClocks,
		description: [
			"Session flow and standing structure are shown on separate timelines.",
			"当日资金流与持仓结构使用各自独立的时间线。",
		],
	},
	"dex-dei-gex": {
		Diagram: Lenses,
		description: [
			"Three separate panels distinguish signed flow, magnitude, and modeled structure.",
			"三个独立视图分别展示带符号资金流、强度与模型结构。",
		],
	},
	"cookbook-research-packet": {
		Diagram: Packet,
		description: [
			"Evidence enters a research packet with a path to review.",
			"证据汇入研究记录，并保留复核路径。",
		],
	},
	"market-recap": {
		Diagram: Recap,
		description: [
			"A recap pairs a chart with written claims and their supporting evidence.",
			"复盘将图表、文字结论和支持证据放在一起。",
		],
	},
	"audit-market-recap": {
		Diagram: Audit,
		description: [
			"Source tracing, challenge, and review form a gate before publication.",
			"发布前依次检查来源、反向质疑与复核。",
		],
	},
} as const;

const conceptConnections: Record<string, [string, string][]> = {
	"option-contracts": [["Underlying", "标的"], ["Contract", "合约"], ["Multiplier", "乘数"]],
	"option-rights": [["Holder", "持有人"], ["Right", "权利"], ["Writer", "卖方"]],
	"premium-payoff": [["Payoff", "到期价值"], ["− premium", "−权利金"], ["Profit", "盈亏"]],
	"expiration-settlement": [["Contract", "合约"], ["Exercise", "行权"], ["Settlement", "结算"]],
	"quotes-orders-trades": [["Order", "订单"], ["Quote", "报价"], ["Execution", "成交"]],
	"execution-counterparties": [["Incoming", "主动订单"], ["Match", "撮合"], ["Resting", "挂单对手"]],
	"execution-side": [["Bid", "买价"], ["Print price", "成交价"], ["Ask", "卖价"]],
	"flow-sentiment": [["Option type", "期权类型"], ["Initiator", "主动方"], ["Inferred label", "推断标签"]],
	"trade-records": [["Prints", "原始成交"], ["Group rule", "分组规则"], ["Totals", "总量"]],
	"unusual-activity": [["Activity", "活动量"], ["÷ baseline", "÷基准"], ["Relative size", "相对幅度"]],
	"option-strategies": [["One leg", "一条腿"], ["Other legs", "其他腿"], ["Portfolio", "组合"]],
	"delta": [["Spot move", "现价变动"], ["× delta", "×Delta"], ["Price change", "价格变化"]],
	"gamma": [["Spot move", "现价变动"], ["× gamma", "×Gamma"], ["Delta change", "Delta 变化"]],
	"theta-vega-rho": [["Time", "时间"], ["Volatility", "波动率"], ["Rates", "利率"]],
	"implied-realized-volatility": [["Option price", "期权价格"], ["Implied IV", "隐含 IV"], ["Past RV", "历史 RV"]],
	"volatility-surface": [["Strike", "行权价"], ["IV slice", "IV 切片"], ["Expiry", "到期日"]],
	"iv-rank-percentile": [["IV history", "IV 历史"], ["Range", "区间"], ["Frequency", "频率"]],
	"dex-dei-gex": [["Δ equivalents", "Delta 等价量"], ["Net DEX", "净 DEX"], ["DEI", "DEI"]],
	"gamma-exposure": [["Chain + signs", "链与符号"], ["Gross", "总幅度"], ["Net", "净值"]],
	"gamma-regimes": [["Assumed risk", "假设风险"], ["Spot move", "现价变动"], ["Hedge change", "对冲变化"]],
	"structural-levels": [["OI / gamma", "OI / Gamma"], ["Scope", "范围"], ["Reference", "参考位置"]],
	"charm-vanna": [["Time / IV", "时间 / IV"], ["Sensitivity", "敏感度"], ["Delta change", "Delta 变化"]],
	"point-in-time-research": [["Known when?", "何时可知？"], ["Fixed rule", "固定规则"], ["Unseen case", "未见案例"]],
	"portfolio-pnl": [["Cost", "成本"], ["Valuation", "估值"], ["P&L", "盈亏"]],
	"portfolio-performance": [["Cash flows", "资金流"], ["Returns", "收益"], ["Benchmark", "基准"]],
	"portfolio-exposure": [["Positions", "持仓"], ["Signed Greeks", "带符号希腊值"], ["Coverage", "覆盖"]],
};
export const lessonInfographicSubjects = [...new Set([...Object.keys(illustrations), ...Object.keys(conceptConnections)])];

export function LessonInfographic({
	subject,
	locale,
	motionEnabled = true,
}: {
	subject: string;
	locale: Locale;
	motionEnabled?: boolean;
}) {
	const id = useId();
	const ref = useLessonInfographicMotion(subject, motionEnabled);
	const illustration = illustrations[subject as keyof typeof illustrations];
	const connections = conceptConnections[subject];
	if (connections) return <svg ref={ref} className="lesson-infographic" viewBox="0 0 360 216" textAnchor="middle" role="img" aria-labelledby={id}><title id={id}>{syllabus.find(lesson => lesson.id === subject)?.[locale === "zh" ? "titleZh" : "title"]}: {connections.map(item => item[locale === "zh" ? 1 : 0]).join(" → ")}</title><path d="M24 48h312M24 108h312M24 168h312" className="diagram-grid"/>{connections.map((item,index)=><g key={item[0]}><rect x={24+index*112} y="74" width="88" height="68" rx="12" className={index===1 ? "diagram-accent" : "diagram-paper"}/><text x={68+index*112} y="111" className={index===1 ? "diagram-on-accent-text" : undefined}>{item[locale==="zh" ? 1 : 0]}</text>{index<2 ? <TracePath d={`M${114+index*112} 108h18m-5-5 5 5-5 5`} delay={index*250}/> : null}</g>)}<text x="180" y="185" className="diagram-muted-text">{locale === "zh" ? "定义 → 比较 → 解释" : "Define · compare · explain"}</text></svg>;
	if (!illustration) return null;
	const { Diagram, description } = illustration;
	const languageIndex = locale === "zh" ? 1 : 0;
	return (
		<svg
			ref={ref}
			className="lesson-infographic"
			viewBox="0 0 360 216"
			textAnchor="middle"
			role="img"
			aria-labelledby={id}
		>
			<title id={id}>{description[languageIndex]}</title>
			<path
				d="M24 24h312M24 72h312M24 120h312M24 168h312M60 16v184M108 16v184M156 16v184M204 16v184M252 16v184M300 16v184"
				className="diagram-grid"
			/>
			<Diagram label={(key) => terms[key][languageIndex]} />
		</svg>
	);
}
