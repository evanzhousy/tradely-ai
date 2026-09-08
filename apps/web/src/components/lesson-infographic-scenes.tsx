import type { ComponentType, ReactNode } from "react";

type Props = { l: (en: string, zh: string) => string };
type Scene = { Diagram: ComponentType<Props>; description: [string, string] };

function Label({
	x,
	y,
	children,
	small = false,
	strong = false,
}: {
	x: number;
	y: number;
	children: ReactNode;
	small?: boolean;
	strong?: boolean;
}) {
	return (
		<text
			x={x}
			y={y}
			className={
				strong ? "diagram-value" : small ? "diagram-muted-text" : undefined
			}
		>
			{children}
		</text>
	);
}
function Panel({
	x,
	y,
	w = 120,
	h = 54,
	accent = false,
}: {
	x: number;
	y: number;
	w?: number;
	h?: number;
	accent?: boolean;
}) {
	return (
		<rect
			x={x}
			y={y}
			width={w}
			height={h}
			rx="8"
			className={accent ? "diagram-accent-wash" : "diagram-paper"}
		/>
	);
}
function Trace({ d, delay = 0 }: { d: string; delay?: number }) {
	return (
		<>
			<path d={d} className="diagram-line" />
			<path
				d={d}
				pathLength="1"
				strokeDasharray="1"
				strokeDashoffset="1"
				className="diagram-motion-trace"
				data-diagram-motion="trace"
				data-diagram-duration="2400"
				data-diagram-delay={delay}
			/>
		</>
	);
}
function Flow({
	x,
	y,
	dx,
	dy = 0,
	delay = 0,
}: {
	x: number;
	y: number;
	dx: number;
	dy?: number;
	delay?: number;
}) {
	return (
		<>
			<path d={`M${x} ${y}l${dx} ${dy}`} className="diagram-faint-line" />
			<circle
				cx={x}
				cy={y}
				r="4"
				className="diagram-traveler"
				data-diagram-motion="travel"
				data-diagram-dx={dx}
				data-diagram-dy={dy}
				data-diagram-delay={delay}
				data-diagram-duration="2600"
			/>
		</>
	);
}
function Bar({
	x,
	y,
	w,
	h,
	negative = false,
	delay = 0,
}: {
	x: number;
	y: number;
	w: number;
	h: number;
	negative?: boolean;
	delay?: number;
}) {
	return (
		<>
			<rect
				x={x}
				y={y}
				width={w}
				height={h}
				rx="3"
				className="diagram-faint-fill"
			/>
			<rect
				x={x}
				y={y}
				width={w}
				height={h}
				rx="3"
				className={negative ? "diagram-negative" : "diagram-accent"}
				data-diagram-motion={negative ? "grow-down" : "grow"}
				data-diagram-delay={delay}
				data-diagram-duration="2300"
			/>
		</>
	);
}
function Caption({ children }: { children: string }) {
	const limit = /[\u4e00-\u9fff]/.test(children) ? 30 : 53;
	const split =
		children.length > limit
			? Math.max(children.lastIndexOf(" ", limit), limit - 10)
			: -1;
	const lines =
		split < 0
			? [children]
			: [children.slice(0, split), children.slice(split).trim()];
	return (
		<text x="180" y={lines.length > 1 ? 195 : 202} className="diagram-caption">
			{lines.map((line, i) => (
				<tspan key={line} x="180" dy={i ? 12 : 0}>
					{line}
				</tspan>
			))}
		</text>
	);
}
function Axes({ xLabel, yLabel }: { xLabel: string; yLabel: string }) {
	return (
		<>
			<path d="M45 40v126h275" className="diagram-faint-line" />
			<Label x={300} y={184} small>
				{xLabel}
			</Label>
			<Label x={66} y={29} small>
				{yLabel}
			</Label>
		</>
	);
}

function Contract({ l }: Props) {
	return (
		<>
			<Panel x={29} y={40} w={170} h={124} />
			<Label x={114} y={64} strong>
				ALFA · CALL
			</Label>
			<path d="M43 79h142" className="diagram-faint-line" />
			<Label x={76} y={101} small>
				{l("Strike", "行权价")}
			</Label>
			<Label x={155} y={101} small>
				{l("Expiry", "到期日")}
			</Label>
			<Label x={76} y={124} strong>
				$100
			</Label>
			<Label x={155} y={124} strong>
				30d
			</Label>
			<Label x={114} y={151} small>
				{l("Stated multiplier ×100", "给定乘数 ×100")}
			</Label>
			<Flow x={199} y={99} dx={32} />
			{Array.from({ length: 100 }, (_, i) => (
				<circle
					key={i}
					cx={238 + (i % 10) * 8}
					cy={51 + Math.floor(i / 10) * 9}
					r="2.4"
					className="diagram-ink"
				/>
			))}
			<Label x={274} y={154}>
				{l("100 shares", "100 股")}
			</Label>
			<Caption>
				{l(
					"One contract has an explicit deliverable",
					"一张合约，有明确的交付单位",
				)}
			</Caption>
		</>
	);
}
function Rights({ l }: Props) {
	return (
		<>
			<Panel x={26} y={42} w={128} h={117} accent />
			<Panel x={206} y={42} w={128} h={117} />
			<Label x={90} y={70} strong>
				{l("HOLDER", "持有人")}
			</Label>
			<Label x={270} y={70} strong>
				{l("WRITER", "卖方")}
			</Label>
			<Label x={90} y={96}>
				{l("May exercise", "可选择行权")}
			</Label>
			<Label x={270} y={96}>
				{l("If assigned", "若被指派")}
			</Label>
			<Label x={90} y={140}>
				{l("Right", "拥有权利")}
			</Label>
			<Label x={270} y={140}>
				{l("Obligation", "承担义务")}
			</Label>
			<Flow x={154} y={112} dx={52} />
			<Label x={180} y={33} small>
				{l("Premium →", "权利金 →")}
			</Label>
			<Caption>
				{l(
					"Long and short carry different responsibilities",
					"多头与空头，权利和义务不同",
				)}
			</Caption>
		</>
	);
}
function Payoff({ l }: Props) {
	return (
		<>
			<Axes
				xLabel={l("Spot", "现价")}
				yLabel={l("Profit / share", "每股盈亏")}
			/>
			<path d="M45 124h266M200 47v119" className="diagram-dashed" />
			<Trace d="M46 148H170L290 52" />
			<Label x={75} y={142}>
				−$2
			</Label>
			<Label x={200} y={184}>
				$102
			</Label>
			<Label x={248} y={35}>
				{l("Long call", "看涨多头")}
			</Label>
			<circle
				cx={200}
				cy={124}
				r="5"
				className="diagram-accent"
				data-diagram-motion="pulse"
				data-diagram-delay="1100"
			/>
			<Label x={270} y={111} small>
				{l("Break-even", "盈亏平衡")}
			</Label>
			<Caption>
				{l(
					"Strike $100 · premium $2 · at expiration",
					"行权价 $100 · 权利金 $2 · 到期时",
				)}
			</Caption>
		</>
	);
}
function Settlement({ l }: Props) {
	return (
		<>
			<Label x={180} y={32}>
				{l("Cash-settled example", "现金结算示例")}
			</Label>
			<Flow x={54} y={75} dx={246} />
			{[54, 177, 300].map((x, i) => (
				<circle
					key={x}
					cx={x}
					cy={75}
					r="8"
					className={i === 2 ? "diagram-accent" : "diagram-ink"}
				/>
			))}
			<Label x={54} y={105} small>
				{l("Hold", "持有")}
			</Label>
			<Label x={177} y={105} small>
				{l("Expiry", "到期")}
			</Label>
			<Label x={300} y={105} small>
				{l("Settle", "结算")}
			</Label>
			<Panel x={55} y={125} w={250} h={47} accent />
			<Label x={180} y={154} strong>
				(104 − 100) × 100 = $400
			</Label>
			<Caption>
				{l(
					"Product rules determine the settlement method",
					"结算方式由具体产品规则决定",
				)}
			</Caption>
		</>
	);
}
function QuoteTrade({ l }: Props) {
	return (
		<>
			<Panel x={30} y={33} w={128} h={69} />
			<Panel x={202} y={33} w={128} h={69} accent />
			<Label x={94} y={55}>
				{l("Bid / 40", "买价 / 40 张")}
			</Label>
			<Label x={266} y={55}>
				{l("Ask / 30", "卖价 / 30 张")}
			</Label>
			<Label x={94} y={82} strong>
				$2.00
			</Label>
			<Label x={266} y={82} strong>
				$2.10
			</Label>
			<Flow x={266} y={105} dx={-86} dy={27} />
			<Panel x={85} y={132} w={190} h={40} />
			<Label x={180} y={158}>
				10 × $2.10
			</Label>
			<Label x={62} y={126} small>
				{l("Quote", "报价")}
			</Label>
			<Label x={305} y={158} small>
				{l("Print", "成交")}
			</Label>
			<Caption>
				{l(
					"A resting quote becomes a trade only on execution",
					"挂单报价，成交后才产生交易记录",
				)}
			</Caption>
		</>
	);
}
function Counterparties({ l }: Props) {
	return (
		<>
			<Panel x={24} y={40} w={112} h={85} />
			<Panel x={224} y={40} w={112} h={85} />
			<Label x={80} y={67}>
				{l("Incoming", "新买方")}
			</Label>
			<Label x={80} y={95} strong>
				{l("BUY", "买入")}
			</Label>
			<Label x={280} y={67}>
				{l("Resting", "挂单卖方")}
			</Label>
			<Label x={280} y={95} strong>
				{l("SELL", "卖出")}
			</Label>
			<Flow x={136} y={86} dx={44} />
			<Flow x={224} y={86} dx={-44} delay={400} />
			<circle cx={180} cy={86} r="14" className="diagram-accent" />
			<Label x={180} y={151} strong>
				{l("1 print · 2 parties", "1 笔成交 · 2 个对手方")}
			</Label>
			<Caption>
				{l("Both trade at the same ask: $2.10", "双方在同一卖价 $2.10 成交")}
			</Caption>
		</>
	);
}
function Side({ l }: Props) {
	return (
		<>
			<Label x={180} y={35}>
				{l("Price against the matched quote", "成交价对照同期报价")}
			</Label>
			<rect
				x="103"
				y="64"
				width="154"
				height="79"
				rx="8"
				className="diagram-accent-wash"
			/>
			<Flow x={42} y={103} dx={276} />
			{["BBID", "BID", "MID", "ASK", "AASK"].map((v, i) => (
				<g key={v}>
					<circle cx={42 + i * 69} cy={103} r="6" className="diagram-ink" />
					<Label x={42 + i * 69} y={78}>
						{v}
					</Label>
					<Label x={42 + i * 69} y={132} small>
						{["1.95", "2.00", "2.05", "2.10", "2.15"][i]}
					</Label>
				</g>
			))}
			<Label x={180} y={169}>
				{l("Bid $2.00 / ask $2.10", "买价 $2.00 / 卖价 $2.10")}
			</Label>
			<Caption>
				{l(
					"Inside-spread classification can remain uncertain",
					"价差内成交，主动方向可能仍不确定",
				)}
			</Caption>
		</>
	);
}
function Sentiment({ l }: Props) {
	return (
		<>
			<Label x={74} y={36}>
				{l("Isolated leg", "仅看单腿")}
			</Label>
			<Label x={178} y={36}>
				{l("Buy", "买入")}
			</Label>
			<Label x={286} y={36}>
				{l("Sell", "卖出")}
			</Label>
			{["CALL", "PUT"].map((kind, row) => (
				<g key={kind}>
					<Label x={58} y={83 + row * 66}>
						{kind}
					</Label>
					{[0, 1].map((col) => {
						const positive = row === col;
						return (
							<g key={col}>
								<Panel
									x={126 + col * 108}
									y={55 + row * 66}
									w={94}
									h={48}
									accent={positive}
								/>
								<rect
									x={126 + col * 108}
									y={55 + row * 66}
									width="94"
									height="48"
									rx="8"
									className="diagram-faint-line"
									data-diagram-motion="focus"
									data-diagram-delay={(row * 2 + col) * 700}
									data-diagram-duration="1100"
								/>
								<Label x={173 + col * 108} y={84 + row * 66}>
									{positive
										? l("+ Bullish", "+ 看涨")
										: l("− Bearish", "− 看跌")}
								</Label>
							</g>
						);
					})}
				</g>
			))}
			<Caption>
				{l(
					"Inferred flow direction ≠ full portfolio outlook",
					"推断成交流方向 ≠ 完整组合观点",
				)}
			</Caption>
		</>
	);
}
function PrintMath({ l }: Props) {
	return (
		<>
			{["$2.05", "× 100", "× 500"].map((v, i) => (
				<g key={v}>
					<Panel x={25 + i * 111} y={47} w={88} h={64} />
					<Label x={69 + i * 111} y={77} strong>
						{v}
					</Label>
					<Label x={69 + i * 111} y={99} small>
						{
							[
								l("per share", "每股"),
								l("multiplier", "乘数"),
								l("contracts", "张数"),
							][i]
						}
					</Label>
				</g>
			))}
			<Trace d="M69 116v17h222v-17M180 133v14" />
			<Label x={180} y={177} strong>
				$102,500
			</Label>
			<Caption>
				{l("Total premium has dollars as its unit", "总权利金，单位为美元")}
			</Caption>
		</>
	);
}
function VolumeOi({ l }: Props) {
	return (
		<>
			<Label x={88} y={32}>
				{l("Session volume", "当日成交量")}
			</Label>
			<Label x={272} y={32}>
				{l("Prior OI report", "前期 OI 报告")}
			</Label>
			{[25, 75].map((h, i) => (
				<Bar key={h} x={45 + i * 60} y={150 - h} w={30} h={h} delay={i * 300} />
			))}
			<path d="M190 75h138" className="diagram-line" />
			<Flow x={196} y={75} dx={123} />
			<Label x={258} y={62} strong>
				500
			</Label>
			<Label x={120} y={69}>
				30
			</Label>
			<Label x={89} y={173} small>
				{l("10 + 20 prints", "10 + 20 张成交")}
			</Label>
			<Label x={261} y={173} small>
				{l("Dated, not live", "带日期，非实时")}
			</Label>
			<Caption>
				{l(
					"New volume does not reveal today's ending OI",
					"新成交量不能直接给出今日最终 OI",
				)}
			</Caption>
		</>
	);
}
function Tape({ l }: Props) {
	return (
		<>
			{["10 @ $2.00", "20 @ $3.00"].map((v, i) => (
				<g key={v}>
					<Panel x={28} y={44 + i * 61} w={130} h={43} />
					<Label x={93} y={71 + i * 61}>
						{v}
					</Label>
					<Flow
						x={162}
						y={65 + i * 61}
						dx={45}
						dy={i ? -30 : 30}
						delay={i * 450}
					/>
				</g>
			))}
			<Panel x={218} y={62} w={112} h={91} accent />
			<Label x={274} y={86}>
				{l("30 contracts", "30 张")}
			</Label>
			<Label x={274} y={113} strong>
				$8,000
			</Label>
			<Label x={274} y={138} small>
				{l("2 original prints", "2 笔原始成交")}
			</Label>
			<Caption>
				{l(
					"Aggregation sums records; it does not identify a strategy",
					"聚合累加记录，不代表识别了策略",
				)}
			</Caption>
		</>
	);
}
function Unusual({ l }: Props) {
	return (
		<>
			<Label x={180} y={31}>
				{l("Volume ÷ typical session", "成交量 ÷ 典型时段量")}
			</Label>
			<Label x={46} y={74}>
				A
			</Label>
			<Label x={46} y={129}>
				B
			</Label>
			<rect
				x="68"
				y="54"
				width="150"
				height="28"
				rx="4"
				className="diagram-accent"
				data-diagram-motion="grow-x"
			/>
			<rect
				x="68"
				y="109"
				width="25"
				height="28"
				rx="4"
				className="diagram-ink"
				data-diagram-motion="grow-x"
				data-diagram-delay="350"
			/>
			<Label x={278} y={74} strong>
				3.0×
			</Label>
			<Label x={278} y={129} strong>
				0.5×
			</Label>
			<Label x={180} y={166} small>
				A: 600 / 200 · B: 1,000 / 2,000
			</Label>
			<Caption>
				{l(
					"Bigger raw volume need not be more unusual",
					"原始成交量更大，不一定更异常",
				)}
			</Caption>
		</>
	);
}
function Strategies({ l }: Props) {
	return (
		<>
			<Axes xLabel={l("Spot", "现价")} yLabel={l("Net payoff", "净到期价值")} />
			<path d="M145 48v118M246 48v118" className="diagram-dashed" />
			<Trace d="M46 156H145L246 65H316" />
			<Label x={145} y={181}>
				100
			</Label>
			<Label x={246} y={181}>
				110
			</Label>
			<Label x={279} y={52}>
				$1,000
			</Label>
			<Label x={94} y={55}>
				+ CALL
			</Label>
			<Label x={258} y={29}>
				− CALL
			</Label>
			<Caption>
				{l(
					"A 100/110 call spread has a capped payoff",
					"100/110 看涨价差，到期价值有上限",
				)}
			</Caption>
		</>
	);
}
function Clocks({ l }: Props) {
	return (
		<>
			{[l("Flow", "成交"), "OI", l("Model", "模型")].map((v, i) => (
				<g key={v}>
					<Panel x={35} y={37 + i * 48} w={290} h={37} />
					<Label x={86} y={61 + i * 48}>
						{v}
					</Label>
					<Label x={241} y={61 + i * 48}>
						{["09/03 10:00", "09/02 close", "09/02 16:00"][i]}
					</Label>
				</g>
			))}
			<path
				d="M158 42v123"
				className="diagram-accent-line"
				data-diagram-motion="scan"
				data-diagram-dx="135"
			/>
			<Caption>
				{l(
					"Each source keeps its own timestamp and coverage",
					"每个来源都有自己的时间与覆盖范围",
				)}
			</Caption>
		</>
	);
}
function Delta({ l }: Props) {
	return (
		<>
			<Axes
				xLabel={l("Spot change", "现价变动")}
				yLabel={l("Option change", "期权变动")}
			/>
			<Trace d="M50 157L285 56" />
			<path d="M140 119h95V78" className="diagram-dashed" />
			<Flow x={140} y={119} dx={95} />
			<Flow x={235} y={119} dx={0} dy={-41} delay={500} />
			<Label x={180} y={145}>
				+$1
			</Label>
			<Label x={275} y={109}>
				+$0.40
			</Label>
			<Label x={125} y={44} strong>
				Δ = 0.40
			</Label>
			<Caption>
				{l(
					"Local approximation · other inputs held fixed",
					"局部近似 · 其他输入保持不变",
				)}
			</Caption>
		</>
	);
}
function Gamma({ l }: Props) {
	return (
		<>
			<Label x={180} y={30} strong>
				Γ = 0.05 / $1
			</Label>
			<Trace d="M60 150L300 50" />
			{[
				[60, 150, "0.40"],
				[180, 100, "0.45"],
				[300, 50, "0.50"],
			].map(([x, y, v]) => (
				<g key={v}>
					<circle cx={x} cy={y} r="5" className="diagram-accent" />
					<Label x={Number(x)} y={Number(y) - 17}>
						{v}
					</Label>
				</g>
			))}
			<Label x={61} y={179}>
				$100
			</Label>
			<Label x={179} y={179}>
				$101
			</Label>
			<Label x={300} y={179}>
				$102
			</Label>
			<Caption>
				{l(
					"Delta changes as spot moves · illustrative model",
					"现价变动时 Delta 也变化 · 模型示例",
				)}
			</Caption>
		</>
	);
}
function OtherGreeks({ l }: Props) {
	return (
		<>
			{[
				{ s: "θ", v: "−$0.03", a: l("+1 day", "+1 天") },
				{ s: "ν", v: "+$0.12", a: l("+1 IV point", "IV +1 点") },
				{ s: "ρ", v: "+$0.04", a: l("+1 rate pp", "利率 +1 点") },
			].map((v, i) => (
				<g key={v.s}>
					<Panel x={27 + i * 112} y={35} w={82} h={132} accent={i === 1} />
					<Label x={68 + i * 112} y={64} strong>
						{v.s}
					</Label>
					<Label x={68 + i * 112} y={87} small>
						{v.a}
					</Label>
					<Flow x={68 + i * 112} y={98} dx={0} dy={28} delay={i * 300} />
					<Label x={68 + i * 112} y={151}>
						{v.v}
					</Label>
				</g>
			))}
			<Caption>
				{l(
					"Illustrative price effects · one input at a time",
					"价格影响示例 · 每次只改变一个输入",
				)}
			</Caption>
		</>
	);
}
function IvRv({ l }: Props) {
	return (
		<>
			<Label x={85} y={35}>
				{l("Realized RV", "已实现 RV")}
			</Label>
			<Label x={275} y={35}>
				{l("Implied IV", "隐含 IV")}
			</Label>
			<Trace d="M30 110l18-21 18 31 18-45 18 21 18-18 18 25" />
			<path d="M180 45v111" className="diagram-dashed" />
			<Trace d="M209 109Q247 47 330 63" delay={500} />
			<Label x={84} y={155} strong>
				24%
			</Label>
			<Label x={275} y={155} strong>
				32%
			</Label>
			<Label x={180} y={175} small>
				{l("Now", "现在")}
			</Label>
			<Caption>
				{l(
					"Measured history and price-implied estimates differ",
					"历史收益测量与价格隐含估计，是不同信息",
				)}
			</Caption>
		</>
	);
}
function Surface({ l }: Props) {
	return (
		<>
			<Axes xLabel={l("Strike", "行权价")} yLabel="IV" />
			<Trace d="M52 63Q174 171 310 68" />
			<Trace d="M52 43Q174 131 310 47" delay={500} />
			<path
				d="M60 58l0-17M170 119v-23M299 77V53"
				className="diagram-faint-line"
			/>
			<Label x={280} y={39}>
				60d
			</Label>
			<Label x={276} y={104}>
				30d
			</Label>
			<Label x={175} y={155} small>
				ATM
			</Label>
			<Caption>
				{l(
					"Strike slices and expiry slices form a surface",
					"行权价切片与到期日切片，组成曲面",
				)}
			</Caption>
		</>
	);
}
function IvRank({ l }: Props) {
	return (
		<>
			<Label x={180} y={31}>
				{l("Current IV 30% · history 10–100%", "当前 IV 30% · 历史 10–100%")}
			</Label>
			<path d="M43 69h274" className="diagram-line" />
			<circle
				cx={104}
				cy={69}
				r="7"
				className="diagram-accent"
				data-diagram-motion="pulse"
			/>
			<Label x={43} y={90} small>
				10
			</Label>
			<Label x={317} y={90} small>
				100
			</Label>
			<Label x={208} y={60}>
				Rank 22.2%
			</Label>
			{[10, 20, 20, 30, 100].map((v, i) => (
				<g key={`${v}-${i}`}>
					<circle
						cx={66 + i * 57}
						cy={129}
						r="14"
						className={i < 3 ? "diagram-accent" : "diagram-faint-fill"}
						data-diagram-motion={i < 3 ? "pulse" : undefined}
						data-diagram-delay={i * 250}
					/>
					<Label x={66 + i * 57} y={158} small>
						{v}
					</Label>
				</g>
			))}
			<Caption>
				{l(
					"Strictly below: 3 of 5 · percentile 60%",
					"严格低于当前：3 / 5 · 百分位 60%",
				)}
			</Caption>
		</>
	);
}
function Dex({ l }: Props) {
	return (
		<>
			<Label x={91} y={30}>
				{l("Signed DEX", "带符号 DEX")}
			</Label>
			<Label x={275} y={30}>
				DEI
			</Label>
			<Bar x={42} y={63} w={40} h={64} />
			<Bar x={112} y={127} w={40} h={16} negative />
			<path d="M29 127h139" className="diagram-line" />
			<Label x={64} y={54}>
				+4k
			</Label>
			<Label x={134} y={169}>
				−1k
			</Label>
			<Flow x={174} y={100} dx={35} />
			<Panel x={217} y={56} w={112} h={96} accent />
			<Label x={273} y={83}>
				|3,000|
			</Label>
			<path d="M236 96h74" className="diagram-line" />
			<Label x={273} y={117}>
				30,000
			</Label>
			<Label x={273} y={144} strong>
				10%
			</Label>
			<Caption>
				{l(
					"Share equivalents ÷ stated effective share volume",
					"股等价量 ÷ 给定有效股票成交量",
				)}
			</Caption>
		</>
	);
}
function Gex({ l }: Props) {
	return (
		<>
			<path d="M32 113h295" className="diagram-line" />
			<Bar x={59} y={41} w={43} h={72} />
			<Bar x={157} y={113} w={43} h={45} negative delay={250} />
			<Bar x={255} y={95} w={43} h={18} delay={500} />
			<Label x={80} y={34}>
				+80
			</Label>
			<Label x={178} y={175}>
				−50
			</Label>
			<Label x={276} y={84}>
				+20
			</Label>
			<Label x={180} y={53} small>
				{l("Net +50", "净值 +50")}
			</Label>
			<Label x={180} y={73} small>
				{l("Gross 150", "总幅度 150")}
			</Label>
			<Caption>
				{l(
					"Model contributions · $ delta per 1% move",
					"模型贡献 · 每变动 1% 的美元 Delta 敞口",
				)}
			</Caption>
		</>
	);
}
function Regimes({ l }: Props) {
	return (
		<>
			<Panel x={28} y={34} w={139} h={139} />
			<Panel x={193} y={34} w={139} h={139} accent />
			<Label x={97} y={57}>
				Γ &gt; 0
			</Label>
			<Label x={262} y={57}>
				Γ &lt; 0
			</Label>
			<Trace d="M64 126l29-40 0 12m0-12-12 3" />
			<Trace d="M114 86l27 40-12-3m12 3 0-12" delay={400} />
			<Trace d="M223 126l29-40 0 12m0-12-12 3" />
			<Trace d="M276 126l29-40 0 12m0-12-12 3" delay={400} />
			<Label x={97} y={157} small>
				{l("Against the move", "逆向调整")}
			</Label>
			<Label x={262} y={157} small>
				{l("With the move", "同向调整")}
			</Label>
			<Caption>
				{l(
					"Conditional hedging under assumed dealer exposure",
					"在假设的做市商敞口下，推演条件性对冲",
				)}
			</Caption>
		</>
	);
}
function Levels({ l }: Props) {
	return (
		<>
			<Label x={100} y={31}>
				{l("OI payout model", "OI 支付模型")}
			</Label>
			<Label x={272} y={31}>
				{l("Gamma concentration", "Gamma 集中")}
			</Label>
			<Trace d="M31 57l69 85 69-85" />
			<Trace d="M201 145l26-17 35-77 31 67 35 25" delay={450} />
			<path d="M100 142v30M262 53v119" className="diagram-dashed" />
			<Label x={100} y={187}>
				100
			</Label>
			<Label x={262} y={187}>
				105
			</Label>
			<Label x={100} y={58} small>
				{l("Max pain", "最大痛点")}
			</Label>
			<Label x={309} y={77} small>
				{l("Wall", "墙位")}
			</Label>
			<Caption>
				{l(
					"Different inputs produce different reference levels",
					"不同输入，生成不同参考价位",
				)}
			</Caption>
		</>
	);
}
function CharmVanna({ l }: Props) {
	return (
		<>
			<Panel x={25} y={39} w={121} h={48} />
			<Panel x={25} y={119} w={121} h={48} />
			<Label x={85} y={68}>
				{l("Time → charm", "时间 → Charm")}
			</Label>
			<Label x={85} y={148}>
				{l("IV → vanna", "IV → Vanna")}
			</Label>
			<Flow x={150} y={63} dx={64} dy={40} />
			<Flow x={150} y={143} dx={64} dy={-40} delay={500} />
			<circle cx={270} cy={104} r="43" className="diagram-accent-wash" />
			<Label x={270} y={100} strong>
				Δ
			</Label>
			<Label x={270} y={122}>
				{l("can change", "可以变化")}
			</Label>
			<Caption>
				{l(
					"Exposure can change without a new execution",
					"没有新增成交，敞口也可能改变",
				)}
			</Caption>
		</>
	);
}
function Boundary({ l }: Props) {
	return (
		<>
			<rect
				x="35"
				y="28"
				width="290"
				height="144"
				rx="10"
				className="diagram-dashed"
			/>
			<Panel x={99} y={45} w={162} h={42} accent />
			<Label x={180} y={72}>
				{l("One observable question", "一个可观察的问题")}
			</Label>
			<Trace d="M180 90v20M93 110h174M93 110v16M267 110v16" />
			<Label x={91} y={145}>
				{l("Scope + time", "范围 + 时间")}
			</Label>
			<Label x={268} y={145}>
				{l("Source + rule", "来源 + 规则")}
			</Label>
			<Caption>
				{l(
					"Define the boundary before inspecting the result",
					"先声明边界，再检视结果",
				)}
			</Caption>
		</>
	);
}
function Universe({ l }: Props) {
	return (
		<>
			<rect
				x="92"
				y="40"
				width="165"
				height="114"
				rx="14"
				className="diagram-accent-wash"
			/>
			{Array.from({ length: 12 }, (_, i) => {
				const inside = i % 4 === 1 || i % 4 === 2;
				return (
					<circle
						key={i}
						cx={55 + (i % 4) * 82}
						cy={57 + Math.floor(i / 4) * 41}
						r={inside ? 10 : 6}
						className={inside ? "diagram-ink" : "diagram-faint-fill"}
						data-diagram-motion={inside ? "pulse" : undefined}
						data-diagram-delay={i * 100}
					/>
				);
			})}
			<Label x={175} y={177}>
				{l("6 eligible observations", "6 项合格观测")}
			</Label>
			<Caption>
				{l(
					"Eligibility comes from a declared rule",
					"资格来自事先声明的筛选规则",
				)}
			</Caption>
		</>
	);
}
function Rank({ l }: Props) {
	return (
		<>
			<Label x={180} y={31}>
				{l("ALFA stays at 1,000", "ALFA 始终为 1,000")}
			</Label>
			{[
				{ s: "ALFA", a: 80, b: 80 },
				{ s: "BETA", a: 128, b: 40 },
				{ s: "GAMMA", a: 104, b: 48 },
			].map((row, i) => (
				<g key={row.s}>
					<Label x={47} y={67 + i * 39} small>
						{row.s}
					</Label>
					<rect
						x="79"
						y={52 + i * 39}
						width={row.a}
						height="15"
						rx="3"
						className={i === 0 ? "diagram-accent" : "diagram-faint-fill"}
					/>
					<rect
						x="235"
						y={52 + i * 39}
						width={row.b}
						height="15"
						rx="3"
						className={i === 0 ? "diagram-accent" : "diagram-ink"}
						data-diagram-motion={i === 0 ? "focus" : "grow-x"}
						data-diagram-delay={i * 250}
					/>
				</g>
			))}
			<Flow x={212} y={96} dx={17} />
			<Label x={147} y={174} small>
				{l("Rank 3", "第 3 名")}
			</Label>
			<Label x={277} y={174} small>
				{l("Rank 1", "第 1 名")}
			</Label>
			<Caption>
				{l(
					"Peers can move a rank while the focal value stays fixed",
					"自身数值不变，同组变化也会改变排名",
				)}
			</Caption>
		</>
	);
}
function Neighborhood({ l }: Props) {
	return (
		<>
			<Label x={190} y={27}>
				{l("Expiry →", "到期日 →")}
			</Label>
			{[7, 30, 60].map((d, i) => (
				<Label key={d} x={105 + i * 88} y={49} small>
					{d}d
				</Label>
			))}
			{[95, 100, 105].map((s, row) => (
				<g key={s}>
					<Label x={38} y={81 + row * 43}>
						{s}
					</Label>
					{[0, 1, 2].map((col) => (
						<g key={col}>
							<rect
								x={72 + col * 88}
								y={58 + row * 43}
								width="68"
								height="36"
								rx="5"
								className="diagram-paper"
							/>
							<circle
								cx={106 + col * 88}
								cy={76 + row * 43}
								r={
									[
										[4, 8, 5],
										[11, 15, 7],
										[5, 10, 4],
									][row][col]
								}
								className={row === 1 ? "diagram-accent" : "diagram-faint-fill"}
								data-diagram-motion="pulse"
								data-diagram-delay={(row + col) * 170}
							/>
						</g>
					))}
				</g>
			))}
			<Caption>
				{l(
					"Strike × expiry · size represents activity",
					"行权价 × 到期日 · 圆的大小代表活动量",
				)}
			</Caption>
		</>
	);
}
function PointInTime({ l }: Props) {
	return (
		<>
			<rect
				x="28"
				y="38"
				width="154"
				height="125"
				rx="9"
				className="diagram-accent-wash"
			/>
			<path d="M190 32v143" className="diagram-dashed" />
			<Flow x={40} y={99} dx={134} />
			<Trace d="M204 99h117" delay={750} />
			{[54, 94, 134].map((x) => (
				<circle key={x} cx={x} cy={99} r="6" className="diagram-ink" />
			))}
			{[235, 269, 303].map((x) => (
				<circle key={x} cx={x} cy={99} r="6" className="diagram-dashed" />
			))}
			<Label x={100} y={63}>
				{l("Known inputs", "当时已知")}
			</Label>
			<Label x={268} y={63}>
				{l("Later test", "后续检验")}
			</Label>
			<Label x={190} y={186}>
				t₀
			</Label>
			<Caption>
				{l(
					"Freeze the rule before seeing future outcomes",
					"在看到未来结果前，固定研究规则",
				)}
			</Caption>
		</>
	);
}
function Packet({ l }: Props) {
	return (
		<>
			{["R1", "R2", "R3"].map((r, i) => (
				<g key={r}>
					<Panel x={28} y={37 + i * 43} w={67} h={32} />
					<Label x={61} y={58 + i * 43}>
						{r}
					</Label>
					<Flow
						x={99}
						y={53 + i * 43}
						dx={71}
						dy={43 - i * 43}
						delay={i * 280}
					/>
				</g>
			))}
			<Panel x={181} y={33} w={147} h={136} />
			<Label x={253} y={58} strong>
				{l("Research packet", "研究资料包")}
			</Label>
			{[
				l("Scope", "范围"),
				l("Formula + units", "公式 + 单位"),
				l("Missing + next check", "缺失 + 下一项检查"),
			].map((t, i) => (
				<g key={t}>
					<path d={`M198 ${80 + i * 30}h9`} className="diagram-accent-line" />
					<Label x={270} y={84 + i * 30} small>
						{t}
					</Label>
				</g>
			))}
			<Caption>
				{l(
					"Keep a rerunnable method beside the source rows",
					"来源记录旁，保留可复现的研究方法",
				)}
			</Caption>
		</>
	);
}
function Recap({ l }: Props) {
	return (
		<>
			<Label x={99} y={30}>
				{l("Observed volume", "已观测成交量")}
			</Label>
			<path d="M33 149h134" className="diagram-line" />
			<Bar x={47} y={60} w={28} h={89} />
			<Bar x={94} y={90} w={28} h={59} delay={350} />
			<Label x={61} y={51}>
				300
			</Label>
			<Label x={108} y={82}>
				200
			</Label>
			<Label x={62} y={170}>
				A
			</Label>
			<Label x={108} y={170}>
				B
			</Label>
			<Label x={151} y={143}>
				—
			</Label>
			<Label x={151} y={170}>
				C
			</Label>
			<Panel x={206} y={45} w={123} h={113} />
			<Label x={267} y={70}>
				{l("Evidence → claim", "证据 → 结论")}
			</Label>
			<Trace d="M221 90h89m-89 20h72m-72 20h55" delay={600} />
			<Flow x={169} y={111} dx={30} />
			<Caption>
				{l(
					"Keep the missing row visible in the recap",
					"复盘中，也要明确保留缺失行",
				)}
			</Caption>
		</>
	);
}
function Audit({ l }: Props) {
	return (
		<>
			<Panel x={35} y={38} w={290} h={126} />
			<Label x={180} y={68}>
				{l("Check the calculation", "核对计算")}
			</Label>
			<Label x={180} y={101} strong>
				300 + 200 = 700
			</Label>
			<path
				d="M69 96h223"
				className="diagram-correction"
				data-diagram-motion="grow-x"
			/>
			<Flow x={179} y={108} dx={0} dy={17} />
			<Label x={180} y={149} strong>
				300 + 200 = 500
			</Label>
			<Caption>
				{l(
					"Repair the claim and retain the supporting evidence",
					"修正结论，同时保留有效证据",
				)}
			</Caption>
		</>
	);
}
function Pnl({ l }: Props) {
	return (
		<>
			<Panel x={26} y={41} w={118} h={103} />
			<Label x={85} y={67}>
				{l("20 shares", "20 股")}
			</Label>
			<Label x={85} y={98} strong>
				$50 → $55
			</Label>
			<Label x={85} y={125} small>
				{l("Cost → mark", "成本 → 估值")}
			</Label>
			<Flow x={149} y={94} dx={51} />
			<Panel x={213} y={41} w={119} h={103} accent />
			<Label x={273} y={69}>
				{l("Unrealized", "未实现盈亏")}
			</Label>
			<Label x={273} y={103} strong>
				+$100
			</Label>
			<Label x={273} y={129} small>
				(55 − 50) × 20
			</Label>
			<Caption>
				{l(
					"Position profit is separate from account cash",
					"持仓盈亏与账户现金分开计算",
				)}
			</Caption>
		</>
	);
}
function Performance({ l }: Props) {
	return (
		<>
			<Label x={180} y={30}>
				{l("Deposit first, then earn a return", "先入金，再产生收益")}
			</Label>
			{[
				{ x: 49, h: 70, t: "100" },
				{ x: 142, h: 84, t: "120" },
				{ x: 235, h: 93, t: "132" },
			].map((b, i) => (
				<g key={b.t}>
					<Bar x={b.x} y={145 - b.h} w={47} h={b.h} delay={i * 350} />
					<Label x={b.x + 24} y={135 - b.h}>
						{b.t}
					</Label>
				</g>
			))}
			<Label x={120} y={168} small>
				{l("+$20 deposit", "入金 +$20")}
			</Label>
			<Label x={270} y={168} small>
				{l("+$12 profit", "盈利 +$12")}
			</Label>
			<Caption>
				{l(
					"Return = 12 / 120 = 10%, not balance growth 32%",
					"收益率 = 12 / 120 = 10%，不是余额增长 32%",
				)}
			</Caption>
		</>
	);
}
function PortfolioExposure({ l }: Props) {
	return (
		<>
			<Label x={73} y={36}>
				{l("Shares", "股票")}
			</Label>
			<Label x={188} y={36}>
				{l("Short calls", "空头看涨")}
			</Label>
			<Label x={298} y={36}>
				{l("Other", "其他")}
			</Label>
			<Bar x={49} y={59} w={48} h={60} />
			<Bar x={164} y={119} w={48} h={48} negative delay={350} />
			<path d="M27 119h304" className="diagram-line" />
			<Label x={73} y={51}>
				+100 Δ
			</Label>
			<Label x={188} y={185}>
				−80 Δ
			</Label>
			<circle cx={298} cy={90} r="19" className="diagram-dashed" />
			<Label x={298} y={95}>
				?
			</Label>
			<Caption>
				{l(
					"Covered net +20 Δ · missing risk stays unknown",
					"已覆盖净值 +20 Δ · 缺失风险仍未知",
				)}
			</Caption>
		</>
	);
}

export const courseCardScenes: Record<string, Scene> = {
	"option-contracts": {
		Diagram: Contract,
		description: [
			"An option contract states its underlying, strike, expiry and multiplier.",
			"期权合约明确标的、行权价、到期日与乘数。",
		],
	},
	"option-rights": {
		Diagram: Rights,
		description: [
			"The option holder has a right; the writer has an obligation if assigned.",
			"持有人拥有权利，卖方在指派时承担义务。",
		],
	},
	"premium-payoff": {
		Diagram: Payoff,
		description: [
			"A long call at strike 100 bought for 2 per share breaks even at 102 at expiration.",
			"以每股 2 元买入行权价 100 的看涨期权，到期盈亏平衡价为 102。",
		],
	},
	"expiration-settlement": {
		Diagram: Settlement,
		description: [
			"A cash-settlement example follows the contract to expiration and payment.",
			"现金结算示例展示合约到期和支付过程。",
		],
	},
	"quotes-orders-trades": {
		Diagram: QuoteTrade,
		description: [
			"Quotes show resting prices and size; only an execution creates a trade print.",
			"报价显示挂单价量，成交后才形成交易记录。",
		],
	},
	"execution-counterparties": {
		Diagram: Counterparties,
		description: [
			"An incoming buyer and resting seller trade at one ask price in one print.",
			"主动买方与挂单卖方在同一卖价成交，形成一笔记录。",
		],
	},
	"execution-side": {
		Diagram: Side,
		description: [
			"Five execution-side labels locate a print relative to its matched bid and ask.",
			"五种成交侧标签，对照同期买卖价定位成交。",
		],
	},
	"flow-sentiment": {
		Diagram: Sentiment,
		description: [
			"Call buying and put selling are bullish isolated-leg flow; the other two combinations are bearish.",
			"单腿成交流约定中，买看涨和卖看跌偏多，另两种组合偏空。",
		],
	},
	"validate-option-print": {
		Diagram: PrintMath,
		description: [
			"2.05 dollars per share times 100 shares per contract times 500 contracts equals 102500 dollars.",
			"每股 2.05 美元，乘每张 100 股，再乘 500 张，合计 102500 美元。",
		],
	},
	"session-flow-vs-structure": {
		Diagram: VolumeOi,
		description: [
			"Session trade volume builds while a prior dated OI report remains unchanged.",
			"当日成交量累加，前期带日期 OI 报告保持原值。",
		],
	},
	"trade-records": {
		Diagram: Tape,
		description: [
			"Two prints combine into 30 contracts and 8000 dollars, retaining their original count.",
			"两笔成交聚合为 30 张和 8000 美元，保留原始笔数。",
		],
	},
	"unusual-activity": {
		Diagram: Unusual,
		description: [
			"Relative volume compares each observation to its own typical volume.",
			"相对成交量，将每项观测与自身典型量比较。",
		],
	},
	"option-strategies": {
		Diagram: Strategies,
		description: [
			"A long 100/110 call spread combines two legs into a capped expiration payoff.",
			"100/110 多头看涨价差，将两腿合成为有上限的到期价值。",
		],
	},
	"symbol-drawer": {
		Diagram: Clocks,
		description: [
			"Flow, OI and modeled data each retain their own source clock.",
			"成交、OI 与模型数据，各自保留来源时间。",
		],
	},
	delta: {
		Diagram: Delta,
		description: [
			"With delta 0.40, a one-dollar spot rise implies approximately 40 cents of option price change locally.",
			"Delta 为 0.40 时，现价上涨 1 美元，期权价格局部近似上涨 0.40 美元。",
		],
	},
	gamma: {
		Diagram: Gamma,
		description: [
			"Gamma describes how delta changes with each move in the underlying.",
			"Gamma 描述标的变化时 Delta 如何改变。",
		],
	},
	"theta-vega-rho": {
		Diagram: OtherGreeks,
		description: [
			"Theta, vega and rho isolate time, volatility and interest-rate sensitivity.",
			"Theta、Vega 与 Rho 分别刻画时间、波动率与利率敏感度。",
		],
	},
	"implied-realized-volatility": {
		Diagram: IvRv,
		description: [
			"Realized volatility measures past returns; implied volatility comes from option prices.",
			"已实现波动率测量历史收益，隐含波动率来自期权价格。",
		],
	},
	"volatility-surface": {
		Diagram: Surface,
		description: [
			"Strike smiles across expiries form a volatility surface.",
			"不同到期日的行权价微笑曲线，构成波动率曲面。",
		],
	},
	"iv-rank-percentile": {
		Diagram: IvRank,
		description: [
			"Current IV 30 in a 10–100 range has rank 22.2 percent; three of five sample observations are lower, giving percentile 60.",
			"当前 IV 30，在 10–100 区间中 Rank 为 22.2%；样本五项中三项更低，百分位为 60%。",
		],
	},
	"dex-dei-gex": {
		Diagram: Dex,
		description: [
			"Signed delta equivalents net to 3000; dividing magnitude by 30000 effective shares gives DEI 10 percent under the stated convention.",
			"带符号 Delta 等价量净值为 3000，除以 30000 有效股票量，按给定约定 DEI 为 10%。",
		],
	},
	"gamma-exposure": {
		Diagram: Gex,
		description: [
			"Modeled contributions +80, −50 and +20 have net +50 and gross magnitude 150.",
			"模型贡献 +80、−50、+20，净值 +50，总幅度 150。",
		],
	},
	"gamma-regimes": {
		Diagram: Regimes,
		description: [
			"Under a dealer-position model, positive and negative gamma imply different conditional hedge adjustments.",
			"在做市商持仓模型下，正负 Gamma 对应不同的条件性对冲调整。",
		],
	},
	"structural-levels": {
		Diagram: Levels,
		description: [
			"An OI payout minimum and a gamma concentration peak represent different model references.",
			"OI 支付最小值与 Gamma 集中峰值，代表不同的模型参考。",
		],
	},
	"charm-vanna": {
		Diagram: CharmVanna,
		description: [
			"Changes in time and implied volatility can change delta without a new trade.",
			"时间和隐含波动率变化，可在没有新成交时改变 Delta。",
		],
	},
	"audited-boundary": {
		Diagram: Boundary,
		description: [
			"An observable research question connects declared scope, time, source and method.",
			"可观察的研究问题，连接明确范围、时间、来源与方法。",
		],
	},
	"symbol-universe": {
		Diagram: Universe,
		description: [
			"A declared eligibility boundary separates comparable observations from excluded ones.",
			"明确的资格边界，将可比观测与排除项分开。",
		],
	},
	"rank-symbols": {
		Diagram: Rank,
		description: [
			"An unchanged focal volume can rise from rank three to one when peers decline.",
			"自身量不变，同组下降可让排名从第三升至第一。",
		],
	},
	"rank-contracts": {
		Diagram: Neighborhood,
		description: [
			"A strike-by-expiry map locates contract activity and nearby observations.",
			"行权价与到期日构成的网格，展示合约及邻近活动。",
		],
	},
	"point-in-time-research": {
		Diagram: PointInTime,
		description: [
			"Use only information known at the decision cutoff, then test on later unseen outcomes.",
			"仅使用决策截止时已知信息，再用后续未见结果检验。",
		],
	},
	"cookbook-research-packet": {
		Diagram: Packet,
		description: [
			"A reproducible research packet preserves source rows, scope, formula, units and missing data.",
			"可复现的研究资料包，保留来源行、范围、公式、单位与缺失数据。",
		],
	},
	"market-recap": {
		Diagram: Recap,
		description: [
			"A recap connects observed chart values to claims and keeps missing observations visible.",
			"复盘将已观测图表与结论关联，同时保留缺失项。",
		],
	},
	"audit-market-recap": {
		Diagram: Audit,
		description: [
			"An audit corrects 300 plus 200 from an erroneous 700 to 500 while preserving the inputs.",
			"审查将 300 加 200 的错误结果 700 改为 500，并保留原始输入。",
		],
	},
	"portfolio-pnl": {
		Diagram: Pnl,
		description: [
			"Twenty shares marked at 55 with cost 50 produce 100 dollars of unrealized profit.",
			"20 股成本 50、估值 55，产生 100 美元未实现盈利。",
		],
	},
	"portfolio-performance": {
		Diagram: Performance,
		description: [
			"A 20-dollar deposit before a period and 12-dollar profit on 120 capital yield 10 percent return, not 32 percent balance growth.",
			"期初入金 20 后本金为 120，盈利 12 的收益率为 10%，不是余额增长的 32%。",
		],
	},
	"portfolio-exposure": {
		Diagram: PortfolioExposure,
		description: [
			"Stock delta +100 and short-call delta −80 net to +20 in covered positions, while an unmeasured holding remains unknown.",
			"股票 Delta +100 与空头看涨 −80，使已覆盖净值为 +20；未测量持仓仍为未知。",
		],
	},
};
