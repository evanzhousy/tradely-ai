import * as m from "motion/react-m";
import {
	type Copy,
	count,
	pick,
	signedCount,
	signedUsd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import { BarChart } from "../walkthrough/instruments/bar-chart";
import { Player } from "../walkthrough/player";
import {
	Appear,
	Label,
	Stage,
	useStage,
	useTeachMotion,
} from "../walkthrough/stage";
import { startAt, textWidth, wrapText } from "../walkthrough/text-measure";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame } from "../walkthrough/walkthrough";
import { dexDeiGexFilm } from "./dex-dei-gex-film";
import {
	d20,
	dei,
	denominators,
	flowRows,
	flowTotals,
	leanName,
	NET,
	netPremium,
	netted,
	noon,
	POSITIONING,
	printwise,
	signOf,
} from "./dex-dei-gex-model";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

// ——— Scene 1: build the flow ———

type FlowState = { signed: boolean; spreadAsOne: boolean };

const ROW = 30;
const FLOW_TOP = 44;
const flowHeight = (rows: number) => FLOW_TOP + rows * ROW + 8;

function FlowRows({
	width,
	state,
	locale,
}: {
	width: number;
	state: FlowState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const { hatch } = useStage();
	const rows = flowRows(state.spreadAsOne);
	const labelWidth = width < 520 ? 118 : 170;
	const center = labelWidth + (width - labelWidth) / 2;
	const half = (width - labelWidth) / 2 - 12;
	const max = Math.max(...flowRows(false).map((row) => row.value));
	const length = (value: number) => Math.max((value / max) * half, 2);
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t([
					"Oct 18 calls · Monday · share-equivalents",
					"10月18日 看涨 · 周一 · 股票等价",
				])}
			</Label>
			<m.path
				className="wt-axis"
				initial={false}
				animate={{
					d: `M${center} ${FLOW_TOP - 4}V${FLOW_TOP + rows.length * ROW}`,
				}}
				transition={motion.move}
			/>
			{state.signed ? (
				<>
					<Label x={center - 6} y={FLOW_TOP - 8} anchor="end" tone="small">
						{t(["← bearish", "← 看跌"])}
					</Label>
					<Label x={center + 6} y={FLOW_TOP - 8} tone="small">
						{t(["bullish →", "看涨 →"])}
					</Label>
				</>
			) : null}
			{rows.map((row, i) => {
				// Each row draws at the top and slides to its place: when the spread's two legs
				// merge into one row, the rows below move up instead of jumping.
				const y = FLOW_TOP;
				const sign = state.signed ? signOf(row.lean) : 1;
				const excluded = state.signed && sign === 0;
				const w = length(row.value);
				const x = sign < 0 ? center - w : center;
				const text = !state.signed
					? count(row.value)
					: excluded
						? width < 520
							? count(row.value)
							: `${count(row.value)} · ${t(leanName[row.lean])}`
						: signedCount(sign * row.value);
				// Long bars carry their number inside so it never runs off the stage.
				const inside =
					sign >= 0 &&
					center + w + 6 + textWidth(text, 13) > width - 2 &&
					w - 8 >= textWidth(text, 13);
				return (
					<m.g
						key={row.id}
						initial={false}
						animate={{ y: i * ROW }}
						transition={motion.move}
					>
						<Appear>
							<Label x={8} y={y + 18} tone="small">
								{t(row.label)}
							</Label>
							<m.rect
								y={y + 6}
								height={ROW - 12}
								rx={3}
								className={
									excluded
										? "wt-ghost"
										: !state.signed
											? "wt-panel-shape"
											: sign > 0
												? "wt-long-soft"
												: "wt-short-soft"
								}
								style={excluded ? { fill: hatch } : undefined}
								initial={false}
								animate={{ x, width: w }}
								transition={motion.move}
							/>
							{/* Start-anchored, so a value that moves inside its bar slides there. */}
							<Label
								x={startAt(
									text,
									inside
										? center + w - 6
										: sign < 0
											? center - w - 6
											: center + w + 6,
									!inside && excluded ? 11 : 13,
									inside || sign < 0 ? "end" : "start",
								)}
								y={y + 19}
								tone={
									inside
										? undefined
										: excluded
											? "small"
											: sign > 0 && state.signed
												? "gain"
												: sign < 0
													? "loss"
													: undefined
								}
								className={inside ? "wt-halo" : undefined}
							>
								{text}
							</Label>
						</Appear>
					</m.g>
				);
			})}
		</g>
	);
}

function FlowView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: FlowState;
	explore: FlowState | null;
	setExplore: (next: FlowState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const totals = flowTotals(shown.spreadAsOne);
	const result: ResultItem[] = [
		{
			id: "gross",
			label: t(["Gross traded", "总成交"]),
			value: t([`${count(totals.gross)} shares`, `${count(totals.gross)} 股`]),
			note: t(["|delta| × contracts × 100", "|Delta| × 张数 × 100"]),
			evidence: "calculated",
		},
	];
	if (shown.signed)
		result.push(
			{
				id: "sides",
				label: t(["Bullish − bearish", "看涨 − 看跌"]),
				value: `${count(totals.bullish)} − ${count(totals.bearish)}`,
				note: t([
					`${count(totals.neutral)} left out: mid or no quote`,
					`${count(totals.neutral)} 不计：中间价或无报价`,
				]),
				evidence: "inferred",
			},
			{
				id: "net",
				label: t(["Net flow DEX", "净成交流 DEX"]),
				value: t([
					`${signedCount(totals.net)} shares`,
					`${signedCount(totals.net)} 股`,
				]),
				note: shown.spreadAsOne
					? t(["the spread as one trade", "价差按一笔交易计"])
					: t(["print by print", "逐笔计算"]),
				tone: "gain",
				evidence: "inferred",
			},
		);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Monday's Oct 18 call prints as bars of delta share-equivalents, pointed right when bought at the ask and left when sold at the bid, with mid-priced prints left out",
						"周一 10月18日 看涨的各笔成交，以 Delta 股票等价的柱表示：按卖价买入向右，按买价卖出向左，中间价成交不计",
					])}
					// Room for every print as its own row, so merging the spread doesn't resize.
					height={flowHeight(flowRows(false).length)}
				>
					{(width) => <FlowRows width={width} state={shown} locale={locale} />}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["The 10:50 spread", "10:50 的价差"])}
						value={explore.spreadAsOne ? "one" : "legs"}
						options={[
							["legs", t(["Two prints", "两笔成交"])],
							["one", t(["One trade", "一笔交易"])],
						]}
						onChange={(value) =>
							setExplore({
								...explore,
								signed: true,
								spreadAsOne: value === "one",
							})
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A flow DEX weights each print by delta so contracts at different strikes add up in shares, then signs it by an inferred side: a call bought at the ask counts bullish, one sold at the bid bearish, and mid-priced or unquoted prints are left out of the net but stay in the gross. The sign is a convention about the tape, not anyone's position. Classifying print by print also splits strategies: the 110 leg sold at mid was half of a bullish spread.",
						"成交流 DEX 用 Delta 给每笔成交加权，让不同行权价的合约能以股数相加，再按推断的方向赋予符号：按卖价买入的看涨计为看涨，按买价卖出的计为看跌，中间价或无报价的成交不计入净值，但保留在总量中。这个符号是关于成交记录的约定，而不是任何人的持仓。逐笔分类还会拆散策略：以中间价卖出的 110 那条腿，是一个看涨价差的一半。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: DEI needs a stated denominator ———

type DeiState = { shown: 1 | 2 | 3 };

function DeiView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: DeiState;
	explore: DeiState | null;
	setExplore: (next: DeiState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const current = denominators[shown.shown - 1];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"DEI for the same net flow under three share-volume denominators",
						"同一净成交流在三种股票成交量分母下的 DEI",
					])}
					height={230}
				>
					{(width) => (
						<BarChart
							width={width}
							height={230}
							bars={denominators.map((denominator, i) => ({
								id: denominator.id,
								label: t(denominator.label),
								value: Math.round(dei(denominator.shares) * 100) / 100,
								hidden: i >= shown.shown,
							}))}
							max={3.5}
							format={(value) => `${value.toFixed(2)}%`}
							focus={current.id}
							title={t([
								`DEI = |${signedCount(NET)}| ÷ share volume`,
								`DEI = |${signedCount(NET)}| ÷ 股票成交量`,
							])}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "net",
					label: t(["Net flow DEX", "净成交流 DEX"]),
					value: t([`${signedCount(NET)} shares`, `${signedCount(NET)} 股`]),
					note: t(["unchanged", "不变"]),
					evidence: "inferred",
				},
				{
					id: "dei",
					label: t([
						`DEI · ${pick(current.label, "en")}`,
						`DEI · ${pick(current.label, "zh")}`,
					]),
					value: `${dei(current.shares).toFixed(2)}%`,
					note: t([
						`÷ ${count(current.shares)} shares`,
						`÷ ${count(current.shares)} 股`,
					]),
					evidence: "calculated",
				},
				{
					id: "premium",
					label: t(["Net classified premium", "分类净权利金"]),
					value: signedUsd(netPremium, 0),
					note: t(["dollars, not shares", "美元，不是股数"]),
					evidence: "inferred",
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Denominator", "分母"])}
						value={String(explore.shown) as "1" | "2" | "3"}
						options={[
							["1", t(["20-day", "20 日"])],
							["2", t(["60-day", "60 日"])],
							["3", t(["By noon", "截至中午"])],
						]}
						onChange={(value) =>
							setExplore({ shown: Number(value) as DeiState["shown"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"DEI here is the size of net flow DEX as a percentage of a typical day's share volume. The numerator keeps its sign in DEX; the percentage depends entirely on the denominator you choose, so state it: a 20-day average, a 60-day average and a partial day give three different percentages for the same trades. Net classified premium is another measure again, in dollars; don't mix it with share-equivalents.",
						"这里的 DEI 是净成交流 DEX 的大小占典型一天股票成交量的百分比。方向保留在 DEX 里；百分比完全取决于你选的分母，所以要说明：20 日均量、60 日均量和不完整的一天，会对同样的成交给出三个不同的百分比。分类净权利金又是另一种度量，单位是美元；不要把它和股票等价混在一起。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: same label, different numerator ———

type SourceState = { stage: 0 | 1 | 2 };

const sourceCards: readonly {
	id: string;
	title: Copy;
	value: number;
	lines: readonly { label: Copy; text: Copy }[];
}[] = [
	{
		id: "flow",
		title: ["Flow DEX · this lesson", "成交流 DEX · 本课"],
		value: NET,
		lines: [
			{
				label: ["from", "来源"],
				text: ["Monday's classified prints", "周一分类后的成交"],
			},
			{
				label: ["sign", "符号"],
				text: ["the side each print traded on", "每笔成交的方向"],
			},
			{
				label: ["means", "含义"],
				text: ["which way the tape leaned", "成交记录偏向哪边"],
			},
		],
	},
	{
		id: "positioning",
		title: ["“DEX” · another platform", "“DEX” · 另一个平台"],
		value: POSITIONING,
		lines: [
			{
				label: ["from", "来源"],
				text: ["Friday's open interest × delta", "周五的未平仓量 × Delta"],
			},
			{
				label: ["sign", "符号"],
				text: ["dealers assumed short calls", "假设做市商做空看涨"],
			},
			{
				label: ["means", "含义"],
				text: ["a modeled hedge position", "模型化的对冲持仓"],
			},
		],
	},
];

function cardLayout(width: number, locale: Locale) {
	const columns = width < 520 ? 1 : 2;
	const cardWidth = (width - 8 - (columns - 1) * 8) / columns;
	const lineWidth = cardWidth - 24 - 56;
	const cards = sourceCards.map((card) => ({
		card,
		lines: card.lines.map((line) =>
			wrapText(pick(line.text, locale), lineWidth, 12),
		),
	}));
	const cardHeight =
		64 +
		Math.max(
			...cards.map(({ lines }) =>
				lines.reduce((sum, wrapped) => sum + wrapped.length * 15 + 6, 0),
			),
		);
	return {
		columns,
		cardWidth,
		cards,
		cardHeight,
		height: 26 + (columns === 1 ? 2 : 1) * (cardHeight + 8),
	};
}

function SourceCards({
	width,
	state,
	locale,
}: {
	width: number;
	state: SourceState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const layout = cardLayout(width, locale);
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t(["Two numbers called DEX", "两个都叫 DEX 的数字"])}
			</Label>
			{layout.cards.map(({ card, lines }, i) => {
				const x = 4 + (layout.columns === 2 ? i * (layout.cardWidth + 8) : 0);
				const y = 26 + (layout.columns === 1 ? i * (layout.cardHeight + 8) : 0);
				const visible = i === 0 || state.stage >= 1;
				let lineY = y + 62;
				return (
					<m.g
						key={card.id}
						initial={false}
						animate={{ opacity: visible ? 1 : 0 }}
						transition={motion.fade}
					>
						<rect
							x={x}
							y={y}
							width={layout.cardWidth}
							height={layout.cardHeight}
							rx={10}
							className={state.stage >= 2 ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						<Label x={x + 12} y={y + 20} tone="small">
							{t(card.title)}
						</Label>
						<Label x={x + 12} y={y + 44} tone="strong">
							{signedCount(card.value)}
						</Label>
						{card.lines.map((line, j) => {
							const wrapped = lines[j];
							const top = lineY;
							lineY += wrapped.length * 15 + 6;
							return (
								<g key={pick(line.label, "en")}>
									<Label x={x + 12} y={top} tone="small">
										{t(line.label)}
									</Label>
									{wrapped.map((text, k) => (
										<text
											key={text}
											x={x + 68}
											y={top + k * 15}
											style={{ fontSize: 12 }}
										>
											{text}
										</text>
									))}
								</g>
							);
						})}
					</m.g>
				);
			})}
		</g>
	);
}

function SourceView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SourceState;
	explore: SourceState | null;
	setExplore: (next: SourceState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] = [
		{
			id: "flow",
			label: t(["Flow DEX", "成交流 DEX"]),
			value: signedCount(NET),
			note: t(["tape, Monday", "成交记录，周一"]),
			evidence: "inferred",
		},
	];
	if (shown.stage >= 1)
		result.push({
			id: "positioning",
			label: t(["Platform “DEX”", "平台“DEX”"]),
			value: signedCount(POSITIONING),
			note: t(["open interest, Friday", "未平仓量，周五"]),
			evidence: "modeled",
		});
	if (shown.stage >= 2)
		result.push({
			id: "verdict",
			label: t(["Comparable?", "可比吗？"]),
			value: t(["no", "否"]),
			note: t(["same name, different numerator", "名字相同，分子不同"]),
			tone: "loss",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Two source cards for numbers both labelled DEX, one built from classified trades and one from open interest under an assumed dealer position",
						"两张来源卡片，都标着 DEX：一个由分类后的成交构建，一个由未平仓量在假设的做市商持仓下构建",
					])}
					height={(width) => cardLayout(width, locale).height}
				>
					{(width) => (
						<SourceCards width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Show", "显示"])}
						value={String(explore.stage) as "0" | "1" | "2"}
						options={[
							["0", t(["Flow", "成交流"])],
							["1", t(["+ Platform", "+ 平台"])],
							["2", t(["Compare", "比较"])],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as SourceState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"On many platforms DEX means delta exposure from open interest under an assumed dealer position, a positioning model like the GEX in the next lesson. That number starts from a different numerator, carries a sign from an assumption rather than from trades, and answers a different question. Before comparing two DEX figures, read what each counts, when and with what sign.",
						"在许多平台上，DEX 指在假设的做市商持仓下由未平仓量计算的 Delta 敞口，是像下一课 GEX 那样的持仓模型。那个数字来自不同的分子，符号来自假设而不是成交，回答的也是另一个问题。比较两个 DEX 数字之前，先看清每个数字统计了什么、何时统计、用什么符号。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<FlowState, FlowState>({
		id: "flow",
		label: ["Build the flow", "构建成交流"],
		title: [
			"Net flow can be far smaller than what traded",
			"净成交流可能远小于成交总量",
		],
		predict: {
			prompt: [
				`Monday's Oct 18 call prints add up to ${count(printwise.gross)} share-equivalents. What is net flow DEX?`,
				`周一 10月18日 看涨的成交合计 ${count(printwise.gross)} 股等价。净成交流 DEX 是多少？`,
			],
			choices: [
				{
					id: "net",
					label: [
						`${signedCount(printwise.net)}: bullish minus bearish`,
						`${signedCount(printwise.net)}：看涨减看跌`,
					],
				},
				{
					id: "gross",
					label: [
						`${signedCount(printwise.gross)}: everything traded`,
						`${signedCount(printwise.gross)}：全部成交`,
					],
				},
				{
					id: "zero",
					label: [
						"0: every trade has a buyer and a seller",
						"0：每笔成交都有买方和卖方",
					],
				},
			],
			answer: "net",
			revealAt: 1,
			explain: [
				`Signed by side: ${count(printwise.bullish)} bullish minus ${count(printwise.bearish)} bearish = ${signedCount(printwise.net)}. The ${count(printwise.neutral)} traded at mid or without a quote stay out of the net. Buyers and sellers always match; the sign comes from a convention about who crossed the spread.`,
				`按方向赋号：看涨 ${count(printwise.bullish)} 减看跌 ${count(printwise.bearish)} = ${signedCount(printwise.net)}。以中间价或无报价成交的 ${count(printwise.neutral)} 不计入净值。买方和卖方总是相等；符号来自“谁跨过了价差”的约定。`,
			],
		},
		beats: [
			{
				id: "gross",
				label: ["Gross", "总量"],
				caption: [
					`Weight each print by delta: ${count(printwise.gross)} share-equivalents traded in Monday's Oct 18 calls, most of it in the 10:50 block.`,
					`用 Delta 给每笔成交加权：周一 10月18日 看涨共成交 ${count(printwise.gross)} 股等价，大部分来自 10:50 的大单。`,
				],
				state: { signed: false, spreadAsOne: false },
			},
			{
				id: "signed",
				label: ["Signed", "赋号"],
				caption: [
					`Sign by side: prints at the ask point right, at the bid left, mid-priced ones drop out. Net: ${signedCount(printwise.net)}.`,
					`按方向赋号：按卖价成交的向右，按买价成交的向左，中间价成交不计。净额：${signedCount(printwise.net)}。`,
				],
				state: { signed: true, spreadAsOne: false },
			},
			{
				id: "spread",
				label: ["The spread", "价差"],
				caption: [
					`The 10:50 block bought 105s and sold 110s as one spread. Net it as one trade and flow DEX is ${signedCount(netted.net)}, not ${signedCount(printwise.net)}: the convention changes the answer.`,
					`10:50 的大单是一个价差：买入 105、卖出 110。按一笔交易净额计算，成交流 DEX 是 ${signedCount(netted.net)}，而不是 ${signedCount(printwise.net)}：约定改变了答案。`,
				],
				state: { signed: true, spreadAsOne: true },
			},
		],
		explore: {
			prompt: [
				"Count the 10:50 spread as two prints or one trade.",
				"把 10:50 的价差按两笔成交或一笔交易计算。",
			],
			start: (last) => last,
			task: {
				kind: "answer",
				prompt: [
					"Counting the 10:50 spread as one trade, what is net flow DEX?",
					"把 10:50 的价差算作一笔交易时，净成交流 DEX 是多少？",
				],
				choices: [
					{
						id: "netted",
						label: [signedCount(netted.net), signedCount(netted.net)],
					},
					{
						id: "printwise",
						label: [signedCount(printwise.net), signedCount(printwise.net)],
					},
					{
						id: "gross",
						label: [signedCount(printwise.gross), signedCount(printwise.gross)],
					},
				],
				answer: "netted",
				done: [
					`As one trade the spread's legs offset, so net flow DEX is ${signedCount(netted.net)}, not ${signedCount(printwise.net)}. The convention changes the answer; report which one you used.`,
					`作为一笔交易时，价差的两条腿相互抵消，所以净成交流 DEX 是 ${signedCount(netted.net)}，而不是 ${signedCount(printwise.net)}。约定改变了答案；要说明你用的是哪一种。`,
				],
			},
		},
		View: FlowView,
	}),
	defineScene<DeiState, DeiState>({
		id: "dei",
		label: ["Declare the DEI convention", "声明 DEI 约定"],
		title: [
			"A DEI percentage exists only under a stated denominator",
			"DEI 百分比只在声明的分母下成立",
		],
		predict: {
			prompt: [
				`Net flow of ${signedCount(NET)} shares against ALFA's 20-day average of ${count(d20.shares)} is a DEI of ${dei(d20.shares).toFixed(2)}%. What is the DEI against today's volume by noon, ${count(noon.shares)} shares?`,
				`${signedCount(NET)} 股的净成交流，对照 ALFA 的 20 日均量 ${count(d20.shares)} 股，DEI 为 ${dei(d20.shares).toFixed(2)}%。对照今天截至中午的成交量 ${count(noon.shares)} 股，DEI 是多少？`,
			],
			choices: [
				{
					id: "double",
					label: [
						`${dei(noon.shares).toFixed(2)}%`,
						`${dei(noon.shares).toFixed(2)}%`,
					],
				},
				{
					id: "same",
					label: [
						`${dei(d20.shares).toFixed(2)}%: the flow didn't change`,
						`${dei(d20.shares).toFixed(2)}%：成交流没有变`,
					],
				},
				{
					id: "half",
					label: [
						`${(dei(d20.shares) / 2).toFixed(2)}%: a smaller day`,
						`${(dei(d20.shares) / 2).toFixed(2)}%：成交更少的一天`,
					],
				},
			],
			answer: "double",
			entry: {
				answer: Math.round(dei(noon.shares) * 100) / 100,
				tolerance: 0.02,
				unit: ["%", "%"],
			},
			revealAt: 2,
			explain: [
				`Same numerator, half the denominator: ${count(Math.abs(NET))} ÷ ${count(noon.shares)} = ${dei(noon.shares).toFixed(2)}%. The trades are identical; only the yardstick changed.`,
				`分子相同，分母减半：${count(Math.abs(NET))} ÷ ${count(noon.shares)} = ${dei(noon.shares).toFixed(2)}%。成交完全一样，变的只是量尺。`,
			],
		},
		beats: [
			{
				id: "d20",
				label: ["20-day", "20 日"],
				caption: [
					`Against ALFA's 20-day average of ${count(d20.shares)} shares, net flow of ${signedCount(NET)} is a DEI of ${dei(d20.shares).toFixed(2)}%.`,
					`对照 ALFA 的 20 日均量 ${count(d20.shares)} 股，${signedCount(NET)} 的净成交流对应 DEI ${dei(d20.shares).toFixed(2)}%。`,
				],
				state: { shown: 1 },
			},
			{
				id: "d60",
				label: ["60-day", "60 日"],
				caption: [
					`Use the 60-day average instead and it's ${dei(denominators[1].shares).toFixed(2)}%.`,
					`改用 60 日均量，就是 ${dei(denominators[1].shares).toFixed(2)}%。`,
				],
				state: { shown: 2 },
			},
			{
				id: "noon",
				label: ["By noon", "截至中午"],
				caption: [
					`Divide by today's volume so far and it's ${dei(noon.shares).toFixed(2)}%. Three percentages, one set of trades: state the denominator.`,
					`除以今天到目前的成交量，就是 ${dei(noon.shares).toFixed(2)}%。同一组成交，三个百分比：要说明分母。`,
				],
				state: { shown: 3 },
			},
		],
		explore: {
			prompt: ["Pick a denominator.", "选择一个分母。"],
			start: () => ({ shown: 1 }),
			task: {
				kind: "reach",
				prompt: [
					"Pick the denominator that makes the same flow look smallest.",
					"选一个让同样的成交流看起来最小的分母。",
				],
				reached: (e) => e.shown === 2,
				done: [
					"The 60-day average is the biggest yardstick here, so the same net flow is the smallest percentage. Nothing traded differently; state the denominator with every DEI.",
					"这里 60 日平均是最大的标尺，所以同样的净成交流得出的百分比最小。成交本身没有任何不同；每个 DEI 都要说明分母。",
				],
			},
		},
		View: DeiView,
	}),
	defineScene<SourceState, SourceState>({
		id: "source",
		label: ["Trace the source", "追溯来源"],
		title: ["Similar labels don't share a numerator", "相似标签不代表相同分子"],
		predict: {
			prompt: [
				`Another site shows ALFA "DEX" at ${signedCount(POSITIONING)}. Your flow DEX is ${signedCount(NET)}. Which is wrong?`,
				`另一个网站显示 ALFA 的“DEX”为 ${signedCount(POSITIONING)}。你的成交流 DEX 是 ${signedCount(NET)}。哪个错了？`,
			],
			choices: [
				{
					id: "neither",
					label: [
						"Neither: they measure different things",
						"都没错：它们衡量不同的东西",
					],
				},
				{ id: "mine", label: ["Mine: theirs is bigger", "我的：他们的更大"] },
				{
					id: "theirs",
					label: ["Theirs: the sign is wrong", "他们的：符号错了"],
				},
			],
			answer: "neither",
			revealAt: 2,
			explain: [
				`Theirs is Friday's open interest × delta × 100 with dealers assumed short every call: a modeled position. Yours is Monday's trades signed by side. Same name, different numerator, sign and question.`,
				"他们的是周五未平仓量 × Delta × 100，并假设做市商做空每一张看涨：一个模型化的持仓。你的是按方向赋号的周一成交。名字相同，分子、符号和问题都不同。",
			],
		},
		beats: [
			{
				id: "flow",
				label: ["Flow DEX", "成交流 DEX"],
				caption: [
					`This lesson's DEX: Monday's prints, weighted by delta and signed by side: ${signedCount(NET)}.`,
					`本课的 DEX：周一的成交，用 Delta 加权并按方向赋号：${signedCount(NET)}。`,
				],
				state: { stage: 0 },
			},
			{
				id: "platform",
				label: ["Platform DEX", "平台 DEX"],
				caption: [
					`Another platform's "DEX": Friday's open interest in the same calls × delta × 100, negative because it assumes dealers are short them: ${signedCount(POSITIONING)}.`,
					`另一个平台的“DEX”：同样这些看涨在周五的未平仓量 × Delta × 100，因为假设做市商做空它们而为负：${signedCount(POSITIONING)}。`,
				],
				state: { stage: 1 },
			},
			{
				id: "compare",
				label: ["Compare", "比较"],
				caption: [
					"Line them up: different source, different sign rule, different meaning. Neither number checks the other.",
					"把它们并排：来源不同，符号规则不同，含义不同。两个数字谁也验证不了谁。",
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: ["Step through the two sources.", "逐步查看两个来源。"],
			start: () => ({ stage: 2 }),
			task: {
				kind: "answer",
				prompt: [
					"What does the other platform's 'DEX' assume that yours doesn't?",
					"另一个平台的“DEX”做了哪个你的 DEX 没有做的假设？",
				],
				choices: [
					{
						id: "dealers",
						label: [
							"That dealers are short every call",
							"做市商卖空了所有看涨",
						],
					},
					{
						id: "side",
						label: ["That trades are signed by side", "成交按位置标记符号"],
					},
					{
						id: "monday",
						label: ["That Monday's prints count", "计入周一的成交"],
					},
				],
				answer: "dealers",
				done: [
					"Theirs multiplies Friday's open interest by delta and assumes dealers are short the calls: a modeled position. Yours signs Monday's trades by side. Same name, different numerator, sign and question.",
					"他们的用周五未平仓量乘以 Delta，并假设做市商卖空看涨：这是模型化的持仓。你的按位置给周一的成交标记符号。名字相同，分子、符号和问题都不同。",
				],
			},
		},
		View: SourceView,
	}),
] as const;

export function DexDeiWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Player
			locale={locale}
			id="dex-dei-gex"
			label={["Interactive lesson on DEX and DEI", "DEX 与 DEI 互动课"]}
			film={dexDeiGexFilm}
			scenes={scenes}
		/>
	);
}
