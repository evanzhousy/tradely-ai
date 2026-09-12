import * as m from "motion/react-m";
import { createContext, useContext, useState } from "react";
import {
	effectiveVolume,
	type FlowClass,
	type FlowImpactConceptData,
	flowImpact,
	summarizeFlow,
	tradeMagnitude,
} from "@/domain/learning/flow-impact-concept";
import type { Locale } from "@/i18n/messages";
import {
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
export const FlowImpactData = createContext<FlowImpactConceptData | null>(null);
function useData() {
	const data = useContext(FlowImpactData);
	if (!data) throw new Error("Flow impact requires authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const copy = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const number = (value: number | null) =>
	value === null
		? "—"
		: value.toLocaleString("en-US", { maximumFractionDigits: 2 });
const signed = (value: number | null) =>
	value === null ? "—" : `${value > 0 ? "+" : ""}${number(value)}`;
const percent = (value: number | null) =>
	value === null ? "—" : `${number(value)}%`;
function Context({ locale }: Props) {
	const data = useData();
	return (
		<p className="font-mono text-muted-foreground text-xs leading-relaxed">
			{data.symbol} · {data.session}
			<br />
			{data.convention[locale === "zh" ? 1 : 0]}
		</p>
	);
}
function Note({ children }: { children: React.ReactNode }) {
	return (
		<div className="rounded-2xl border p-4 text-sm leading-relaxed">
			{children}
		</div>
	);
}
export function FlowBuildScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const replay = useFrames(data.contractFrames.length);
	const [manual, setManual] = useState<number | null>(null);
	const [classification, setClassification] = useState<FlowClass>(
		data.prints[1].classification,
	);
	const contracts = manual ?? data.contractFrames[replay.frame];
	const prints = data.prints.map((p, i) =>
		i === 1
			? {
					...p,
					contracts,
					classification,
					premium:
						p.premium === null ? null : (p.premium * contracts) / p.contracts,
				}
			: p,
	);
	const result = summarizeFlow(prints);
	const enabled = useLessonMotion();
	const choose = (value: number) => {
		replay.select(replay.frame);
		setManual(value);
	};
	const labels = {
		bullish: l("Bullish", "看涨"),
		bearish: l("Bearish", "看跌"),
		neutral: l("Neutral", "中性"),
	};
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l("Signed flow and gross coverage", "带符号成交流与总覆盖")}
					height={480}
				>
					<SvgText x={180} y={30} muted>
						{l("Share equivalents · fixed scale", "股等价量 · 固定刻度")}
					</SvgText>
					<line
						x1={180}
						x2={180}
						y1={62}
						y2={290}
						stroke="currentColor"
						opacity={0.3}
					/>
					<SvgText x={45} y={55} muted>
						−80k
					</SvgText>
					<SvgText x={180} y={55} muted>
						0
					</SvgText>
					<SvgText x={315} y={55} muted>
						+80k
					</SvgText>
					{prints.map((p, i) => {
						const magnitude = tradeMagnitude(p) ?? 0;
						const sign =
							p.classification === "bearish"
								? -1
								: p.classification === "bullish"
									? 1
									: 0;
						const width = (magnitude / 80000) * 132;
						const y = 82 + i * 66;
						return (
							<g key={p.id}>
								<SvgText x={180} y={y - 8}>
									{p.id} · {labels[p.classification]} · {number(magnitude)}
								</SvgText>
								{sign === 0 ? (
									<rect
										x={180 - width / 2}
										y={y}
										width={width}
										height={21}
										rx={4}
										fill="none"
										stroke="currentColor"
										strokeDasharray="4 3"
									/>
								) : (
									<g
										transform={
											sign < 0 ? "translate(360 0) scale(-1 1)" : undefined
										}
									>
										<m.rect
											x={180}
											y={y}
											width={width}
											height={21}
											rx={4}
											fill="var(--primary)"
											opacity={sign < 0 ? 0.5 : 1}
											initial={false}
											animate={{ width }}
											transition={
												enabled && replay.playing
													? lessonTransition
													: instantTransition
											}
										/>
									</g>
								)}
							</g>
						);
					})}
					<SvgText x={180} y={300} muted>
						{l("Neutral: coverage, no direction", "中性：保留覆盖，不赋方向")}
					</SvgText>
					<rect
						x={22}
						y={320}
						width={316}
						height={70}
						rx={14}
						fill="var(--primary)"
						opacity={0.15}
					/>
					<SvgText x={180} y={344}>
						{l("Net DEX · shares-equivalent", "净 DEX · 股等价量")}
					</SvgText>
					<g data-flow-net>
						<SvgText x={180} y={373} strong>
							{signed(result.net)}
						</SvgText>
					</g>
					<SvgText x={180} y={419}>
						{l("Gross", "总幅度")}: {number(result.gross)}
					</SvgText>
					<SvgText x={180} y={448}>
						{l("Unsigned neutral", "无方向中性")}: {number(result.neutral)}
					</SvgText>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<p className="font-mono text-xs">
				A: |{data.prints[0].delta}| × {data.prints[0].contracts} ×{" "}
				{data.prints[0].multiplier}
				<br />
				B: |{data.prints[1].delta}| × {contracts} × {data.prints[1].multiplier}
				<br />
				C: |{data.prints[2].delta}| × {data.prints[2].contracts} ×{" "}
				{data.prints[2].multiplier}
			</p>
			<RangeControl
				label={l("Print B contracts", "成交 B 张数")}
				value={contracts}
				display={number(contracts)}
				min={data.contractRange[0]}
				max={data.contractRange[1]}
				step={100}
				onChange={choose}
			/>
			<SelectField
				label={l("Print B inferred flow", "成交 B 推断成交流")}
				value={classification}
				options={Object.entries(labels) as [string, string][]}
				onChange={(value) => {
					replay.select(replay.frame);
					setClassification(value as FlowClass);
				}}
			/>
			<PlaybackButton
				playing={replay.playing}
				onClick={() => {
					setManual(null);
					replay.toggle();
				}}
				l={l}
			/>
			<p data-flow-gross>
				{l("Gross represented magnitude", "已代表总幅度")}:{" "}
				{number(result.gross)} · {l("shares-equivalent", "股等价量")}
			</p>
			<p data-flow-premium>
				{l("Net classified premium", "分类净权利金")}: ${signed(result.premium)}
			</p>
			<Note>
				{l(
					"B has negative option delta, but this flow sign comes from its selected inferred classification. It is not signed position delta or dealer inventory. Neutral magnitude remains in gross coverage.",
					"B 的期权 Delta 为负，但这里的成交流符号来自所选推断分类。它不是带符号持仓 Delta 或做市商库存。中性幅度保留在总覆盖中。",
				)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"Hypothetical size changes hold premium per contract fixed. Reclassification changes both classified sums, not the observed prices. Playback is a controlled experiment, not a market replay.",
					"假设张数变化保持每张权利金固定。重新分类改变两项分类汇总，不改变观测价格。回放是控制实验，不是行情重播。",
				)}
			</p>
		</SceneLayout>
	);
}
export function FlowDenominatorScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [id, setId] = useState(data.references[0].id);
	const [volume, setVolume] = useState(data.references[0].volume as number);
	const reference =
		data.references.find((r) => r.id === id) ?? data.references[0];
	const effective = {
		...reference,
		volume: reference.id === "shares" ? volume : reference.volume,
	};
	const den = effectiveVolume(effective);
	const net = summarizeFlow(data.prints).net;
	const dei = flowImpact(net, effective);
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l("DEI volume normalization", "DEI 成交量归一化")}
					height={460}
				>
					<SvgText x={180} y={35}>
						{l("Original net DEX stays fixed", "原始净 DEX 保持固定")}
					</SvgText>
					<SvgText x={180} y={70} strong>
						{signed(net)}
					</SvgText>
					<SvgText x={180} y={96} muted>
						{l("shares-equivalent", "股等价量")}
					</SvgText>
					<path
						d="M180 115 V145 M174 139 L180 145 L186 139"
						stroke="currentColor"
						fill="none"
					/>
					<SvgText x={180} y={177}>
						{l("Effective denominator", "有效分母")}
					</SvgText>
					<g data-flow-denominator>
						<SvgText x={180} y={207} strong>
							{number(den)}
						</SvgText>
					</g>
					<rect
						x={30}
						y={235}
						width={300}
						height={24}
						rx={6}
						fill="currentColor"
						opacity={0.08}
					/>
					{den !== null && (
						<rect
							x={30}
							y={235}
							width={Math.min(300, (den / 2000000) * 300)}
							height={24}
							rx={6}
							fill="var(--primary)"
						/>
					)}
					<SvgText x={30} y={284} muted>
						0
					</SvgText>
					<SvgText x={305} y={284} muted>
						2m
					</SvgText>
					<SvgText x={180} y={330}>
						{l("|Net DEX| ÷ volume × 100", "|净 DEX| ÷ 成交量 × 100")}
					</SvgText>
					<g data-flow-dei>
						<SvgText x={180} y={371} strong>
							{percent(dei)}
						</SvgText>
					</g>
					<SvgText x={180} y={418} muted>
						{l("Direction stays in signed DEX", "方向保留在带符号 DEX")}
					</SvgText>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Volume reference", "成交量参考")}
				value={id}
				options={data.references.map((r) => [
					r.id,
					r.label[locale === "zh" ? 1 : 0],
				])}
				onChange={setId}
			/>
			{id === "shares" && (
				<RangeControl
					label={l("Typical share volume", "典型股票成交量")}
					value={volume}
					display={number(volume)}
					min={data.volumeRange[0]}
					max={data.volumeRange[1]}
					step={100000}
					onChange={setVolume}
				/>
			)}
			<p data-flow-reference className="font-mono text-xs leading-relaxed">
				{l("Raw volume", "原始成交量")}: {number(effective.volume)}
				<br />
				{l("Proxy scale", "代理比例")}: {number(reference.scale)}
				<br />
				{reference.method ?? l("No proxy method supplied", "未提供代理方法")}
			</p>
			<p role="status">
				{den === null
					? l(
							"Unavailable: a positive denominator and any required proxy scale/method must be supplied.",
							"不可用：必须提供正分母及所需代理比例与方法。",
						)
					: l(
							"Supported under this declared teaching convention.",
							"在已声明教学约定下可计算。",
						)}
			</p>
			<Note>
				{l(
					"An index has no ordinary share volume. A proxy's raw volume is not automatically comparable: this example declares 250,000 × 4 = 1,000,000 effective units. The factor is illustrative, not a universal index conversion.",
					"指数没有普通股票成交量。代理原始量不能自动比较：本例声明 250,000 × 4 = 1,000,000 有效单位。该比例仅作教学演示，不是通用指数换算。",
				)}
			</Note>
			<p data-flow-fixed-gex className="text-sm">
				{l("Separate GEX report stays fixed", "独立 GEX 报告保持固定")}:{" "}
				{signed(data.gex.value)}
				<br />
				{data.gex.unit[locale === "zh" ? 1 : 0]}
				<br />
				{data.gex.source} · {data.gex.asOf}
			</p>
		</SceneLayout>
	);
}
export function FlowLineageScene({ locale }: Props) {
	const data = useData();
	const l = copy(locale);
	const [source, setSource] = useState<"tape" | "oi" | "gex">("tape");
	const net = summarizeFlow(data.prints).net;
	const result = flowImpact(net, data.references[0], source);
	const motion = useLessonMotion();
	const rows = [
		[
			"tape",
			l("Classified tape", "分类成交"),
			l("Signed shares-equivalent", "带符号股等价量"),
		],
		[
			"oi",
			l("Reported ΔOI", "报告 ΔOI"),
			l("Absolute shares-equivalent", "绝对股等价量"),
		],
		[
			"gex",
			l("Separate GEX report", "独立 GEX 报告"),
			l("USD change / +1% spot", "美元变化 / 现价 +1%"),
		],
	] as const;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l("Select the source lineage", "选择来源链路")}
					height={470}
				>
					{rows.map(([id, label, unit], i) => (
						<g key={id}>
							<rect
								x={24}
								y={20 + i * 96}
								width={312}
								height={78}
								rx={13}
								fill={source === id ? "var(--primary)" : "currentColor"}
								opacity={source === id ? 0.2 : 0.05}
							/>
							<foreignObject x={24} y={20 + i * 96} width={312} height={78}>
								<button
									type="button"
									className="h-full w-full rounded-xl text-center text-sm"
									aria-pressed={source === id}
									onClick={() => setSource(id)}
								>
									<span className="block font-medium">{label}</span>
									<span className="block font-mono text-xs">
										{id === "tape"
											? signed(net)
											: id === "oi"
												? number(data.oi.magnitude)
												: signed(data.gex.value)}
									</span>
									<span className="block text-xs">{unit}</span>
								</button>
							</foreignObject>
						</g>
					))}
					<m.path
						key={source}
						d="M180 311 V344 M173 337 L180 344 L187 337"
						fill="none"
						stroke="currentColor"
						strokeDasharray={source === "tape" ? undefined : "4 3"}
						initial={false}
						animate={{ opacity: 1 }}
						transition={motion ? lessonTransition : instantTransition}
					/>
					<SvgText x={180} y={374}>
						{l("This lesson's tape DEI", "本课成交型 DEI")}
					</SvgText>
					<g data-flow-source-dei>
						<SvgText x={180} y={414} strong>
							{percent(result)}
						</SvgText>
					</g>
					<SvgText x={180} y={449} muted>
						{source === "tape"
							? l("Same numerator lineage", "分子来源一致")
							: l("Cannot substitute this report", "不能代入此报告")}
					</SvgText>
				</Diagram>
			}
		>
			<Context locale={locale} />
			<SelectField
				label={l("Numerator source", "分子来源")}
				value={source}
				options={rows.map(([id, label]) => [id, label])}
				onChange={(value) => setSource(value as typeof source)}
			/>
			<p data-flow-source-detail className="font-mono text-xs leading-relaxed">
				{source === "tape"
					? `${data.session} · ${data.convention[locale === "zh" ? 1 : 0]}`
					: source === "oi"
						? `${data.oi.source} · ${data.oi.asOf}`
						: `${data.gex.source} · ${data.gex.asOf} · ${data.gex.convention[locale === "zh" ? 1 : 0]}`}
			</p>
			<Note>
				{source === "tape"
					? l(
							"Eligible: signed classified flow from the stated session, divided by the positive effective volume. DEI is a magnitude. It does not reveal dealer inventory or predict a price move.",
							"可计算：声明时段的带符号分类成交流，除以正有效量。DEI 是幅度，不揭示做市商库存，也不预测价格变化。",
						)
					: source === "oi"
						? l(
								"This supplied absolute ΔOI-based magnitude describes reported position change. Today's inferred tape direction cannot give it a sign. An OI-impact measure needs its own numerator convention, clock and denominator; it cannot silently replace this flow-based DEI.",
								"给定的绝对 ΔOI 型幅度描述报告持仓变化。今天推断的成交方向不能为其赋符号。OI 型影响需自己的分子约定、时点与分母，不能悄然替换本课成交流型 DEI。",
							)
						: l(
								"This supplied GEX is a sensitivity report under an assumed inventory-sign convention. Its USD delta-notional change per +1% spot move differs from tape DEX share equivalents. It is neither a trade-flow numerator nor proof of observed dealer hedging.",
								"给定 GEX 是按假设库存符号生成的敏感度报告。其现价 +1% 对应的美元 Delta 名义变化，与成交 DEX 的股等价单位不同。它既不是成交流分子，也不是已观测做市商对冲的证据。",
							)}
			</Note>
			<p className="text-muted-foreground text-xs">
				{l(
					"All values are synthetic supplied teaching reports. GEX is displayed, not reconstructed from these three prints. Metric names alone do not establish compatible units, dates, scope or methods.",
					"所有数值均为给定模拟教学报告。GEX 仅展示，不由这三笔成交重建。指标名称本身不保证单位、日期、范围或方法兼容。",
				)}
			</p>
		</SceneLayout>
	);
}
