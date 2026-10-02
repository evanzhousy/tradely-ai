import * as m from "motion/react-m";
import {
	applyMessages,
	type Copy,
	count,
	type FeedMessage,
	oct105CallBlock,
	oct105CallLast,
	oct105CallMessages,
	pick,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import {
	type TapeRow,
	TradeTape,
	tapeHeight,
} from "../walkthrough/instruments/trade-tape";
import { Label, Stage, useTeachMotion } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

// ——— Scene 1: build one row from its prints ———

type SourceId = "t1" | "t3" | "leg";
const BLOCK_TIME = oct105CallBlock.time.slice(0, 5);
type AggregateState = { include: readonly SourceId[]; step: number };

const sources: Record<
	SourceId,
	{
		trade: string;
		time: string;
		contract: Copy;
		strike: number;
		quantity: number;
		price: number;
	}
> = {
	t1: {
		trade: "T-1",
		time: oct105CallLast.time,
		contract: ["105 call", "105 看涨"],
		strike: 105,
		quantity: oct105CallLast.size,
		price: oct105CallLast.price,
	},
	t3: {
		trade: "T-3",
		time: BLOCK_TIME,
		contract: ["105 call", "105 看涨"],
		strike: 105,
		quantity: oct105CallBlock.quantity,
		price: oct105CallBlock.price,
	},
	leg: {
		trade: "T-4",
		time: BLOCK_TIME,
		contract: ["110 call", "110 看涨"],
		strike: oct105CallBlock.pairedLeg.strike,
		quantity: oct105CallBlock.pairedLeg.quantity,
		price: oct105CallBlock.pairedLeg.price,
	},
};

function aggregate(include: readonly SourceId[]) {
	const rows = include.map((id) => sources[id]);
	const strikes = new Set(rows.map((row) => row.strike));
	const contracts = rows.reduce((sum, row) => sum + row.quantity, 0);
	/** Cents: price per share × contracts × 100. */
	const premium = rows.reduce(
		(sum, row) => sum + row.price * row.quantity * 100,
		0,
	);
	const weighted = contracts ? premium / (contracts * 100) : 0;
	const simple = rows.length
		? rows.reduce((sum, row) => sum + row.price, 0) / rows.length
		: 0;
	return {
		valid: strikes.size <= 1,
		trades: rows.length,
		contracts,
		premium,
		weighted,
		simple,
	};
}

/** "$2.1485" style: up to four decimals, as a weighted price needs. */
const price4 = (cents: number) =>
	`$${(cents / 100).toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 4,
	})}`;

const CARD_ROWS = 5;
const CARD_ROW = 26;

function AggregateCard({
	width,
	y,
	state,
	locale,
}: {
	width: number;
	y: number;
	state: AggregateState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const result = aggregate(state.include);
	const cardWidth = Math.min(width - 16, 440);
	const x = (width - cardWidth) / 2;
	const rows: {
		id: string;
		label: string;
		value: string;
		tone?: "loss" | "accent" | "small";
		from: number;
	}[] = result.valid
		? [
				{
					id: "contracts",
					label: t(["Contracts", "张数"]),
					value: count(result.contracts),
					from: 1,
				},
				{
					id: "trades",
					label: t(["Trades", "成交笔数"]),
					value: String(result.trades),
					from: 1,
				},
				{
					id: "premium",
					label: t(["Premium", "权利金"]),
					value: usd(result.premium, 0),
					from: 2,
				},
				{
					id: "weighted",
					label: t(["Weighted price", "加权价格"]),
					value: price4(result.weighted),
					tone: "accent",
					from: 3,
				},
				{
					id: "simple",
					label: t(["Simple average ✗", "简单平均 ✗"]),
					value: price4(result.simple),
					tone: "loss",
					from: 3,
				},
			]
		: [];
	return (
		<g>
			<rect
				x={x}
				y={y}
				width={cardWidth}
				height={CARD_ROWS * CARD_ROW + 40}
				rx={14}
				className={result.valid ? "wt-panel-shape" : "wt-focus-shape"}
			/>
			<Label x={x + 16} y={y + 24} tone="muted">
				{t(["Aggregate row", "聚合行"])}
			</Label>
			{result.valid ? (
				rows.map((row, i) => (
					<m.g
						key={row.id}
						initial={false}
						animate={{ opacity: state.step >= row.from ? 1 : 0 }}
						transition={motion.fade}
					>
						<Label
							x={x + 16}
							y={y + 50 + i * CARD_ROW}
							tone={row.id === "simple" ? "small" : undefined}
						>
							{row.label}
						</Label>
						<Label
							x={x + cardWidth - 16}
							y={y + 50 + i * CARD_ROW}
							anchor="end"
							tone={row.tone}
						>
							{row.value}
						</Label>
					</m.g>
				))
			) : (
				<g>
					<Label x={x + 16} y={y + 56} tone="accent">
						{t(["Refused: different contracts", "拒绝：合约不同"])}
					</Label>
					<Label x={x + 16} y={y + 80} tone="small">
						{t([
							"a 105 call and a 110 call can't share",
							"105 看涨与 110 看涨不能合并",
						])}
					</Label>
					<Label x={x + 16} y={y + 98} tone="small">
						{t(["one row, price or premium", "为同一行、价格或权利金"])}
					</Label>
				</g>
			)}
		</g>
	);
}

function AggregateView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: AggregateState;
	explore: AggregateState | null;
	setExplore: (next: AggregateState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result = aggregate(shown.include);
	const rows: TapeRow[] = (["t1", "t3", "leg"] as const).map((id) => {
		const source = sources[id];
		return {
			key: id,
			cells: [
				source.trade,
				source.time,
				t(source.contract),
				count(source.quantity),
				usd(source.price),
			],
			muted: !shown.include.includes(id),
		};
	});
	const tapeTop = 0;
	const cardTop = tapeHeight(3) + 12;
	const outcome: ResultItem[] = !result.valid
		? [
				{
					id: "refused",
					label: t(["Aggregate", "聚合"]),
					value: t(["refused", "拒绝"]),
					note: t(["mixes two contracts", "混合了两张合约"]),
					tone: "loss",
				},
			]
		: [
				{
					id: "contracts",
					label: t(["Contracts", "张数"]),
					value: count(result.contracts),
					note: t([`${result.trades} trades`, `${result.trades} 笔成交`]),
					evidence: "calculated",
				},
				{
					id: "premium",
					label: t(["Premium", "权利金"]),
					value: shown.step >= 2 ? usd(result.premium, 0) : "—",
					note:
						shown.step >= 2
							? t(["sum of each print's premium", "逐笔权利金之和"])
							: undefined,
					evidence: shown.step >= 2 ? "calculated" : undefined,
				},
				{
					id: "weighted",
					label: t(["Average paid", "平均成交价"]),
					value: shown.step >= 3 ? price4(result.weighted) : "—",
					note:
						shown.step >= 3
							? t(["premium ÷ (contracts × 100)", "权利金 ÷（张数 × 100）"])
							: undefined,
					evidence: shown.step >= 3 ? "calculated" : undefined,
				},
			];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Source prints of the Oct 18 105 call and the aggregate row built from them",
						"10月18日 105 看涨的原始成交，以及由它们建立的聚合行",
					])}
					height={cardTop + CARD_ROWS * CARD_ROW + 44}
				>
					{(width) => (
						<g>
							<TradeTape
								x={8}
								y={tapeTop}
								width={width - 16}
								title={t([
									"Source prints · Oct 18 calls",
									"原始成交 · 10月18日 看涨",
								])}
								columns={[
									{ label: t(["Trade", "成交"]), share: 0.16 },
									{ label: t(["Time", "时间"]), share: 0.18 },
									{ label: t(["Contract", "合约"]), share: 0.24 },
									{ label: t(["Qty", "张数"]), share: 0.18, align: "end" },
									{ label: t(["Price", "价格"]), share: 0.24, align: "end" },
								]}
								rows={rows}
								maxRows={3}
								empty=""
							/>
							<AggregateCard
								width={width}
								y={cardTop}
								state={shown}
								locale={locale}
							/>
						</g>
					)}
				</Stage>
			}
			result={outcome}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Prints in the row", "聚合的成交"])}
						value={shown.include.join("+")}
						options={[
							["t1", "T-1"],
							["t3", "T-3"],
							["t1+t3", "T-1 + T-3"],
							["t1+t3+leg", "T-1 + T-3 + T-4"],
						]}
						onChange={(value) =>
							setExplore({ include: value.split("+") as SourceId[], step: 3 })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"An aggregate row combines prints under a stated rule, here the same contract on the same day. Contracts and premium add up; the trade count says how many prints it represents. The price paid is weighted by size: 500 contracts at $2.15 matter a hundred times more than 5 at $2.00. A row never shows whether its prints came from one order or one trader.",
						"聚合行按明确规则合并成交，这里是同一合约、同一天。张数和权利金相加；成交笔数说明它代表多少笔成交。成交均价要按数量加权：500 张 $2.15 的分量是 5 张 $2.00 的一百倍。聚合行从不显示这些成交是否来自同一订单或同一交易者。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: messages are not trades ———

type ReplayState = { received: number };

const kindCopy: Record<FeedMessage["kind"], Copy> = {
	new: ["new", "新增"],
	duplicate: ["duplicate", "重复"],
	cancel: ["cancel", "撤销"],
	correct: ["correction", "更正"],
};

function ReplayView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ReplayState;
	explore: ReplayState | null;
	setExplore: (next: ReplayState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const received = oct105CallMessages.slice(0, shown.received);
	const view = applyMessages(received);
	const volume = [...view.values()].reduce(
		(sum, trade) => sum + trade.quantity,
		0,
	);
	const messageRows: TapeRow[] = [...received].reverse().map((message) => ({
		key: message.id,
		cells: [
			message.received,
			t(kindCopy[message.kind]),
			message.trade,
			message.price !== undefined ? usd(message.price) : "—",
		],
	}));
	const viewRows: TapeRow[] = [...view.entries()].map(([trade, value]) => ({
		key: `${trade}-${value.price}`,
		cells: [trade, count(value.quantity), usd(value.price)],
	}));
	const messagesTop = 0;
	const viewTop = tapeHeight(6) + 12;
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Feed messages as they arrive, and the trades they leave in the current view",
						"依次到达的数据消息，以及它们在当前视图中留下的成交",
					])}
					height={viewTop + tapeHeight(3)}
				>
					{(width) => (
						<g>
							<TradeTape
								x={8}
								y={messagesTop}
								width={width - 16}
								title={t([
									"Messages received · Oct 18 105 call",
									"收到的消息 · 10月18日 105 看涨",
								])}
								// A phone sizes each column to its longest entry, "10:12:05.1" and "correction".
								columns={[
									{
										label: t(["Received", "接收时间"]),
										share: width < 520 ? 0.345 : 0.34,
									},
									{
										label: t(["Type", "类型"]),
										share: width < 520 ? 0.345 : 0.28,
									},
									{
										label: t(["Trade", "成交"]),
										share: width < 520 ? 0.12 : 0.16,
									},
									{
										label: t(["Price", "价格"]),
										share: width < 520 ? 0.19 : 0.22,
										align: "end",
									},
								]}
								rows={messageRows}
								maxRows={6}
								empty={t(["Nothing yet", "尚无消息"])}
							/>
							<TradeTape
								x={8}
								y={viewTop}
								width={width - 16}
								title={t(["Current view", "当前视图"])}
								columns={[
									{ label: t(["Trade", "成交"]), share: 0.3 },
									{
										label: t(["Contracts", "张数"]),
										share: 0.35,
										align: "end",
									},
									{ label: t(["Price", "价格"]), share: 0.35, align: "end" },
								]}
								rows={viewRows}
								maxRows={3}
								empty={t(["No trades", "没有成交"])}
							/>
						</g>
					)}
				</Stage>
			}
			result={[
				{
					id: "messages",
					label: t(["Messages", "消息"]),
					value: String(received.length),
				},
				{
					id: "trades",
					label: t(["Trades in view", "视图中的成交"]),
					value: String(view.size),
					evidence: "calculated",
				},
				{
					id: "volume",
					label: t(["Volume", "成交量"]),
					value: t([`${count(volume)} contracts`, `${count(volume)} 张`]),
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Messages received", "已收到的消息"])}
						value={
							String(explore.received) as "1" | "2" | "3" | "4" | "5" | "6"
						}
						options={oct105CallMessages.map((message, i) => [
							String(i + 1) as "1" | "2" | "3" | "4" | "5" | "6",
							message.id,
						])}
						onChange={(value) => setExplore({ received: Number(value) })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Feeds send messages, not trades. A duplicate repeats a report with the same trade ID; a cancel removes an execution that was busted; a correction replaces a report's details. Rebuild the current view by trade ID before counting anything. Receipt times can also lag the execution time on the report.",
						"数据源发送的是消息，不是成交。重复消息以相同成交编号重复一条报告；撤销会移除被取消的成交；更正会替换报告内容。在统计任何数量之前，先按成交编号重建当前视图。接收时间也可能晚于报告上的成交时间。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<AggregateState, AggregateState>({
		id: "aggregate",
		label: ["Build the row", "建立聚合行"],
		title: ["One row can stand for several prints", "一行可以代表多笔成交"],
		predict: {
			prompt: [
				"The Oct 18 105 call printed 5 contracts at $2.00 and 500 at $2.15. What was the average price paid per contract?",
				"10月18日 105 看涨成交了 5 张 $2.00 和 500 张 $2.15。每张合约的平均成交价是多少？",
			],
			choices: [
				{
					id: "weighted",
					label: [
						"About $2.15 (weighted: $2.1485)",
						"约 $2.15（加权：$2.1485）",
					],
				},
				{
					id: "simple",
					label: ["$2.075, halfway between", "$2.075，两者中间"],
				},
				{ id: "last", label: ["$2.00", "$2.00"] },
			],
			answer: "weighted",
			entry: { answer: 2.1485, prefix: "$", tolerance: 0.005 },
			revealAt: 3,
			explain: [
				"Weight each price by its size: $108,500 of premium over 505 contracts is $2.1485. The simple average treats 5 contracts as if they counted as much as 500.",
				"按数量给价格加权：$108,500 权利金除以 505 张，为 $2.1485。简单平均把 5 张和 500 张看得一样重。",
			],
		},
		beats: [
			{
				id: "sources",
				label: ["Source prints", "原始成交"],
				caption: [
					"Monday's two 105 call prints: T-1, 5 contracts at $2.00, and T-3, the 500-lot at $2.15. Same contract, same price unit.",
					"周一两笔 105 看涨成交：T-1 以 $2.00 成交 5 张，T-3 是 $2.15 的 500 张大单。同一合约，同一价格单位。",
				],
				state: { include: ["t1", "t3"], step: 0 },
			},
			{
				id: "counts",
				label: ["Counts", "数量"],
				caption: [
					"Contracts add up to 505 and the row represents 2 trades. Those are two different counts; keep both.",
					"张数合计 505，这一行代表 2 笔成交。这是两个不同的数，两个都要保留。",
				],
				state: { include: ["t1", "t3"], step: 1 },
			},
			{
				id: "premium",
				label: ["Premium", "权利金"],
				caption: [
					"Premium adds print by print: $1,000 plus $107,500 is $108,500.",
					"权利金逐笔相加：$1,000 加 $107,500，共 $108,500。",
				],
				state: { include: ["t1", "t3"], step: 2 },
			},
			{
				id: "weighted",
				label: ["Average paid", "平均成交价"],
				caption: [
					"The average paid is premium over shares: $108,500 ÷ 50,500 = $2.1485. The simple $2.075 average ignores size and is wrong.",
					"平均成交价是权利金除以股数：$108,500 ÷ 50,500 = $2.1485。简单平均 $2.075 忽略了数量，是错的。",
				],
				state: { include: ["t1", "t3"], step: 3 },
			},
			{
				id: "unlike",
				label: ["Unlike contracts", "不同合约"],
				caption: [
					"The block's other leg, 500 of the 110 call at $0.90, is a different contract. Folding it in would give a meaningless row.",
					"大单的另一条腿是 500 张 $0.90 的 110 看涨，属于不同合约。把它并进来只会得到毫无意义的一行。",
				],
				state: { include: ["t1", "t3", "leg"], step: 3 },
			},
		],
		explore: {
			prompt: [
				"Choose which prints go into the row.",
				"选择哪些成交并入这一行。",
			],
			start: () => ({ include: ["t1", "t3"], step: 3 }),
			task: {
				kind: "answer",
				prompt: [
					"Which set of prints makes a row that means something?",
					"哪一组成交合成的行是有意义的？",
				],
				choices: [
					{ id: "both", label: ["T-1 + T-3", "T-1 + T-3"] },
					{ id: "leg", label: ["T-1 + T-3 + T-4", "T-1 + T-3 + T-4"] },
					{
						id: "one",
						label: [
							"None: rows must be single prints",
							"都不是：一行只能是单笔成交",
						],
					},
				],
				answer: "both",
				done: [
					"T-1 and T-3 are the same contract, so their contracts and premium add. T-4 is the 110 call: folding it in mixes two contracts and two prices into one meaningless row.",
					"T-1 和 T-3 是同一合约，张数和权利金可以相加。T-4 是 110 看涨：把它并进来，就把两份合约、两种价格混成了一行没有意义的数据。",
				],
			},
		},
		View: AggregateView,
	}),
	defineScene<ReplayState, ReplayState>({
		id: "messages",
		label: ["Replay the feed", "回放数据"],
		title: ["More messages don't mean more trades", "消息更多，不代表成交更多"],
		predict: {
			prompt: [
				"The feed sends T-1's report twice, with the same trade ID. How many contracts has the 105 call traded?",
				"数据源把 T-1 的报告以相同成交编号发送了两次。105 看涨成交了多少张？",
			],
			choices: [
				{
					id: "five",
					label: ["5: the repeat is a duplicate", "5 张：重复的是同一条"],
				},
				{ id: "ten", label: ["10: two reports", "10 张：两条报告"] },
				{ id: "zero", label: ["0 until it's confirmed", "确认前为 0"] },
			],
			answer: "five",
			entry: { answer: 5, unit: [" contracts", " 张"] },
			revealAt: 1,
			explain: [
				"Both messages carry trade ID T-1, so they describe one execution. Count trades by ID, not by message.",
				"两条消息都带成交编号 T-1，描述的是同一笔成交。统计成交要按编号，而不是按消息。",
			],
		},
		beats: [
			{
				id: "m1",
				label: ["New", "新增"],
				caption: [
					"10:12: a new print arrives, T-1: 5 contracts at $2.00. One message, one trade.",
					"10:12：一条新成交到达，T-1：5 张，$2.00。一条消息，一笔成交。",
				],
				state: { received: 1 },
			},
			{
				id: "m2",
				label: ["Duplicate", "重复"],
				caption: [
					"The same report arrives again with the same trade ID. Two messages, still one trade and 5 contracts.",
					"同一条报告以相同成交编号再次到达。两条消息，仍是一笔成交、5 张。",
				],
				state: { received: 2 },
			},
			{
				id: "m3",
				label: ["A bad print", "错误成交"],
				caption: [
					"10:40: T-2 reports 20 contracts at $2.60, far above the quote.",
					"10:40：T-2 报告 20 张 $2.60 的成交，远高于报价。",
				],
				state: { received: 3 },
			},
			{
				id: "m4",
				label: ["Cancel", "撤销"],
				caption: [
					"The venue busts T-2 and a cancel removes it. Four messages, one trade.",
					"交易场所取消了 T-2，撤销消息把它移除。四条消息，一笔成交。",
				],
				state: { received: 4 },
			},
			{
				id: "m5",
				label: ["Mistyped", "录入错误"],
				caption: [
					"10:50: the block arrives as T-3, 500 contracts, but with a mistyped price of $2.51.",
					"10:50：大单以 T-3 到达，500 张，但价格误录为 $2.51。",
				],
				state: { received: 5 },
			},
			{
				id: "m6",
				label: ["Correction", "更正"],
				caption: [
					"A correction replaces T-3's price with $2.15. Six messages in all, yet only two trades and 505 contracts.",
					"更正消息把 T-3 的价格替换为 $2.15。共六条消息，但只有两笔成交、505 张。",
				],
				state: { received: 6 },
			},
		],
		explore: {
			prompt: [
				"Choose how many messages have arrived and rebuild the view.",
				"选择已到达的消息数量，重建当前视图。",
			],
			start: () => ({ received: 6 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the moment the current view counts a trade that later disappears.",
					"找出当前视图计入了一笔后来消失的成交的那一刻。",
				],
				reached: (e) => e.received === 3,
				done: [
					"After message 3 the view counts T-2's 20 contracts at $2.60; the cancel in message 4 removes them. A view is only as final as the messages received so far.",
					"收到第 3 条消息后，视图计入了 T-2 的 20 张（$2.60）；第 4 条撤销消息把它们移除。视图只代表截至目前收到的消息。",
				],
			},
		},
		View: ReplayView,
	}),
] as const;

export function TradeRecordsWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="trade-records"
			label={[
				"Interactive lesson on what one tape row represents",
				"一行成交记录代表什么互动课",
			]}
			scenes={scenes}
		/>
	);
}
