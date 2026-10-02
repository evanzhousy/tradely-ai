import {
	type Copy,
	count,
	oct105CallBlock,
	pick,
	sideCode,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import {
	type Claim,
	ClaimLadderStage,
} from "../walkthrough/instruments/claim-ladder";
import {
	ContractTicket,
	type TicketField,
	ticketHeight,
} from "../walkthrough/instruments/contract-ticket";
import { Stage } from "../walkthrough/stage";
import {
	defineScene,
	type EvidenceKind,
	type Phase,
	type ResultItem,
} from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

const BLOCK = oct105CallBlock;
const MULTIPLIER = 100;
/** Premium in cents: price per share × contracts × shares per contract. */
const PREMIUM = BLOCK.price * BLOCK.quantity * MULTIPLIER;
const CONTRACT: Copy = ["ALFA Oct 18 105 call", "ALFA 10月18日 105 看涨"];

function evidenceLabels(locale: Locale): Record<EvidenceKind, string> {
	const t = tr(locale);
	return {
		observed: t(["observed", "观测"]),
		calculated: t(["calculated", "计算"]),
		modeled: t(["modeled", "模型"]),
		inferred: t(["inferred", "推断"]),
		unknown: t(["unknown", "未知"]),
	};
}

// ——— Scene 1: read the record ———

type ReadState = { shown: number; multiplier: boolean };

function readFields(state: ReadState, locale: Locale): TicketField[] {
	const t = tr(locale);
	return [
		{ id: "contract", label: t(["Contract", "合约"]), value: t(CONTRACT) },
		{ id: "time", label: t(["Time", "时间"]), value: `${BLOCK.time} ET` },
		{
			id: "price",
			label: t(["Price", "价格"]),
			value: t([`${usd(BLOCK.price)} per share`, `每股 ${usd(BLOCK.price)}`]),
			segment: usd(BLOCK.price),
		},
		{
			id: "quantity",
			label: t(["Quantity", "数量"]),
			value: t([`${BLOCK.quantity} contracts`, `${BLOCK.quantity} 张`]),
			segment: ` × ${BLOCK.quantity}`,
		},
		{
			id: "multiplier",
			label: t(["Multiplier", "乘数"]),
			value: state.multiplier
				? t(["100 shares", "100 股"])
				: t(["not stated", "未注明"]),
			segment: state.multiplier ? ` × ${MULTIPLIER}` : " × ?",
		},
		{
			id: "premium",
			label: t(["Premium", "权利金"]),
			value: state.multiplier ? usd(PREMIUM, 0) : t(["unknown", "未知"]),
			segment: state.multiplier ? ` = ${usd(PREMIUM, 0)}` : " = ?",
		},
	];
}

/** The field under discussion for each number of fields shown. */
const readFocus: Record<number, string> = {
	2: "time",
	3: "price",
	4: "quantity",
	6: "premium",
};

function ReadView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ReadState;
	explore: ReadState | null;
	setExplore: (next: ReadState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const fields = readFields(shown, locale);
	const done = shown.shown >= fields.length;
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"One print read field by field, building its premium",
						"逐项读取一笔成交，并算出权利金",
					])}
					height={ticketHeight(fields.length)}
				>
					{(width) => (
						<ContractTicket
							width={width}
							title={t(["Execution record", "成交记录"])}
							fields={fields}
							shown={shown.shown}
							focus={readFocus[shown.shown]}
							symbolLabel={t(["Premium", "权利金"])}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "print",
					label: t(["Print", "成交"]),
					value: `${count(BLOCK.quantity)} @ ${usd(BLOCK.price)}`,
					note: BLOCK.time,
					evidence: "observed",
				},
				{
					id: "premium",
					label: t(["Premium", "权利金"]),
					value: !done ? "—" : shown.multiplier ? usd(PREMIUM, 0) : "?",
					note: done
						? shown.multiplier
							? t(["price × contracts × 100", "价格 × 张数 × 100"])
							: t(["needs the multiplier", "缺少乘数"])
						: undefined,
					evidence: done
						? shown.multiplier
							? "calculated"
							: "unknown"
						: undefined,
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Multiplier in the record", "记录中的乘数"])}
						value={explore.multiplier ? "stated" : "missing"}
						options={[
							["stated", t(["100 shares", "100 股"])],
							["missing", t(["Not stated", "未注明"])],
						]}
						onChange={(value) =>
							setExplore({ ...explore, multiplier: value === "stated" })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Read a print in order: which contract, when, the price per share, how many contracts, and what one contract covers. Premium comes from the print itself. If a unit such as the multiplier isn't stated, the dollar amount stays unknown rather than assumed.",
						"按顺序读成交：哪张合约、什么时间、每股价格、多少张、每张代表多少股。权利金由成交本身算出。如果乘数这类单位没有注明，金额就保持未知，而不是自行假设。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: sort the evidence ———

type SortState = { reached: number; stale: boolean };

function sortClaims(state: SortState, locale: Locale): Claim[] {
	const t = tr(locale);
	const quote = state.stale ? BLOCK.staleQuote : BLOCK.quote;
	const code = sideCode(BLOCK.price, quote.bid, quote.ask);
	const located = !state.stale;
	const rows: Claim[] = [
		{
			id: "print",
			text: t([
				`${BLOCK.quantity} traded at ${usd(BLOCK.price)}`,
				`${BLOCK.quantity} 张在 ${usd(BLOCK.price)} 成交`,
			]),
			basis: t([`the print, ${BLOCK.time}`, `成交记录，${BLOCK.time}`]),
			evidence: "observed",
		},
		{
			id: "premium",
			text: t([`${usd(PREMIUM, 0)} of premium`, `权利金 ${usd(PREMIUM, 0)}`]),
			basis: t(["price × 500 × 100", "价格 × 500 × 100"]),
			evidence: "calculated",
		},
		{
			id: "location",
			text: t(["Printed at the ask", "在卖价成交"]),
			basis: located
				? t([
						`quote ${usd(quote.bid)} / ${usd(quote.ask)} at ${quote.time}`,
						`${quote.time} 报价 ${usd(quote.bid)} / ${usd(quote.ask)}`,
					])
				: t([
						`only a 90 s old quote: would read ${code}`,
						`只有 90 秒前的报价：会读成 ${code}`,
					]),
			evidence: located ? "calculated" : "unknown",
		},
		{
			id: "buyer",
			text: t(["A buyer probably started it", "可能是买方发起"]),
			basis: located
				? t(["buyers usually lift the ask", "买方通常吃卖价"])
				: t(["no usable quote to infer from", "没有可用报价可供推断"]),
			evidence: located ? "inferred" : "unknown",
		},
		{
			id: "open",
			text: t(["It opened 500 new contracts", "开立了 500 张新合约"]),
			basis: t(["the print carries no open flag", "成交记录没有开仓标记"]),
			evidence: "unknown",
		},
		{
			id: "bet",
			text: t(["A big bet that ALFA rises", "押注 ALFA 上涨的大单"]),
			basis: t([
				"it may be one leg of something else",
				"它可能只是其他策略的一条腿",
			]),
			evidence: "unknown",
		},
	];
	return rows.map((row, i) => ({
		...row,
		hidden: i > state.reached,
		focus: state.stale
			? row.id === "location" || row.id === "buyer"
			: i === state.reached,
	}));
}

const reachedAt = [0, 1, 3, 5];

function SortView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SortState;
	explore: SortState | null;
	setExplore: (next: SortState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const claims = sortClaims(shown, locale);
	const visible = claims.filter((claim) => !claim.hidden);
	const tally = (kinds: EvidenceKind[]) =>
		visible.filter((claim) => kinds.includes(claim.evidence)).length;
	return (
		<SceneFrame
			stage={
				<ClaimLadderStage
					label={t([
						"Statements about the block, each marked observed, calculated, inferred or unknown",
						"关于这笔大单的陈述，每条都标注观测、计算、推断或未知",
					])}
					title={t([
						`${BLOCK.time} · ${BLOCK.quantity} @ ${usd(BLOCK.price)} · Oct 18 105 call`,
						`${BLOCK.time} · ${BLOCK.quantity} 张 @ ${usd(BLOCK.price)} · 10月18日 105 看涨`,
					])}
					claims={claims}
					evidenceLabels={evidenceLabels(locale)}
				/>
			}
			result={[
				{
					id: "known",
					label: t(["Established", "已确定"]),
					value: String(tally(["observed", "calculated"])),
					note: t(["observed or calculated", "观测或计算"]),
				},
				{
					id: "inferred",
					label: t(["Inferred", "推断"]),
					value: String(tally(["inferred"])),
					note: t(["likely, under a convention", "按约定，可能成立"]),
				},
				{
					id: "unknown",
					label: t(["Unknown", "未知"]),
					value: String(tally(["unknown"])),
					note: t(["needs another record", "需要其他记录"]),
					evidence: "unknown",
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Quote on file", "现有报价"])}
						value={explore.stale ? "stale" : "matched"}
						options={[
							["matched", t(["Matched, 10:50:00.3", "匹配，10:50:00.3"])],
							["stale", t(["90 s old", "90 秒前"])],
						]}
						onChange={(value) =>
							setExplore({ ...explore, stale: value === "stale" })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Sort every statement before acting on it. The print is observed; premium is calculated from it; a location needs a matched quote; the aggressor is inferred from that location; opening, strategy and belief are unknown until another record shows them. A bigger premium makes none of these more certain.",
						"在行动前先给每条陈述分类。成交是观测到的；权利金由成交计算；位置需要匹配的报价；主动方是根据位置推断的；开仓、策略和观点在其他记录出现前都是未知的。权利金再大，也不会让这些更确定。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: fill a gap with the right record ———

type GapState = { stage: 0 | 1 | 2 | 3 };

function gapClaims(state: GapState, locale: Locale): Claim[] {
	const t = tr(locale);
	const leg = BLOCK.pairedLeg;
	return [
		{
			id: "open",
			text: t(["Opened new contracts?", "开立了新合约？"]),
			basis:
				state.stage >= 1
					? t([
							`Tue OI report: +${BLOCK.openInterestChange}, so mostly opening`,
							`周二未平仓量报告：+${BLOCK.openInterestChange}，大部分是开仓`,
						])
					: t([
							"needs the next open-interest report",
							"需要下一份未平仓量报告",
						]),
			evidence: state.stage >= 1 ? "inferred" : "unknown",
			focus: state.stage === 1,
		},
		{
			id: "spread",
			text: t(["One leg of a strategy?", "某个策略的一条腿？"]),
			basis:
				state.stage >= 2
					? t([
							`multi-leg: ${leg.quantity} Oct 18 ${leg.strike} calls sold at ${usd(leg.price)}`,
							`多腿：同时以 ${usd(leg.price)} 卖出 ${leg.quantity} 张 10月18日 ${leg.strike} 看涨`,
						])
					: t([
							"needs the condition code and linked prints",
							"需要成交条件代码和关联成交",
						]),
			evidence: state.stage >= 2 ? "observed" : "unknown",
			focus: state.stage === 2,
		},
		{
			id: "belief",
			text: t(["A bet that ALFA rises?", "押注 ALFA 上涨？"]),
			basis:
				state.stage >= 3
					? t(["no market record shows belief", "没有任何市场记录能显示观点"])
					: t(["what record could show this?", "什么记录能说明这一点？"]),
			evidence: "unknown",
			focus: state.stage === 3,
		},
	];
}

function GapView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: GapState;
	explore: GapState | null;
	setExplore: (next: GapState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const leg = BLOCK.pairedLeg;
	const net = BLOCK.price - leg.price;
	const result: ResultItem[] = [
		{
			id: "gaps",
			label: t(["Gaps left", "剩余缺口"]),
			value: String(3 - Math.min(shown.stage, 2)),
			evidence: "unknown",
		},
	];
	if (shown.stage >= 1)
		result.push({
			id: "oi",
			label: t(["Open interest, 105 call", "105 看涨未平仓量"]),
			value: `+${BLOCK.openInterestChange}`,
			note: t(["published Tuesday before the open", "周二开盘前公布"]),
		});
	if (shown.stage >= 2)
		result.push({
			id: "net",
			label: t(["Spread cost", "价差成本"]),
			value: t([`${usd(net)} a share`, `每股 ${usd(net)}`]),
			note: t([
				`${usd(BLOCK.price)} paid − ${usd(leg.price)} received`,
				`支付 ${usd(BLOCK.price)} − 收取 ${usd(leg.price)}`,
			]),
			evidence: "calculated",
		});
	return (
		<SceneFrame
			stage={
				<ClaimLadderStage
					label={t([
						"Each open question about the block and the record that could answer it",
						"关于这笔大单的每个未解问题，以及能回答它的记录",
					])}
					title={t([
						"Open questions · the record each needs",
						"未解问题 · 各自需要的记录",
					])}
					claims={gapClaims(shown, locale)}
					evidenceLabels={evidenceLabels(locale)}
				/>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Records gathered", "已收集的记录"])}
						value={String(explore.stage) as "0" | "1" | "2" | "3"}
						options={[
							["0", t(["None", "无"])],
							["1", t(["OI report", "未平仓量报告"])],
							["2", t(["+ condition code", "+ 条件代码"])],
							["3", t(["Anything else", "其他任何记录"])],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as GapState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Choose the next check by the gap it fills. Open interest tells you whether contracts were added overall, not who added them. Condition codes and prints at the same instant reveal multi-leg trades. Belief never appears in market data, and watching ALFA's price afterwards doesn't reveal it either.",
						"按要填补的缺口选择下一项检查。未平仓量告诉你合约总数是否增加，但不告诉你是谁。成交条件代码和同一时刻的成交会揭示多腿交易。观点从不出现在市场数据中，之后观察 ALFA 价格也无法揭示它。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<ReadState, ReadState>({
		id: "read",
		label: ["Read the record", "读取记录"],
		title: ["Build the amount from the print itself", "从成交本身算出金额"],
		predict: {
			prompt: [
				"500 Oct 18 105 calls print at $2.15. How much premium changed hands?",
				"500 张 10月18日 105 看涨以 $2.15 成交。交换了多少权利金？",
			],
			choices: [
				{ id: "right", label: ["$107,500", "$107,500"] },
				{ id: "shares", label: ["$1,075", "$1,075"] },
				{ id: "price", label: ["$215", "$215"] },
			],
			answer: "right",
			entry: { answer: 107500, prefix: "$" },
			revealAt: 3,
			explain: [
				"$2.15 a share × 100 shares × 500 contracts = $107,500. Every unit in that product comes from the record.",
				"每股 $2.15 × 每张 100 股 × 500 张 = $107,500。乘式中的每个单位都来自记录。",
			],
		},
		beats: [
			{
				id: "what",
				label: ["What and when", "什么与何时"],
				caption: [
					"Start with identity: the ALFA Oct 18 105 call, printed at 10:50:00.4. Every later check must match this contract and time.",
					"先确认身份：ALFA 10月18日 105 看涨，10:50:00.4 成交。之后的每项检查都要对上这张合约和这个时间。",
				],
				state: { shown: 2, multiplier: true },
			},
			{
				id: "price",
				label: ["Price", "价格"],
				caption: [
					"The price is $2.15, quoted per share like every option price.",
					"价格是 $2.15，和所有期权价格一样按每股报价。",
				],
				state: { shown: 3, multiplier: true },
			},
			{
				id: "quantity",
				label: ["Quantity", "数量"],
				caption: [
					"500 contracts. On its own that is a count, not dollars.",
					"500 张。单看这是一个数量，不是金额。",
				],
				state: { shown: 4, multiplier: true },
			},
			{
				id: "premium",
				label: ["Premium", "权利金"],
				caption: [
					"Each contract covers 100 shares, so the premium is $2.15 × 500 × 100 = $107,500.",
					"每张合约对应 100 股，所以权利金为 $2.15 × 500 × 100 = $107,500。",
				],
				state: { shown: 6, multiplier: true },
			},
		],
		explore: {
			prompt: [
				"Remove the multiplier from the record and see what can still be calculated.",
				"从记录中去掉乘数，看看还能算出什么。",
			],
			start: () => ({ shown: 6, multiplier: false }),
			task: {
				kind: "answer",
				prompt: [
					"With the multiplier missing from the record, what can you still state?",
					"记录中缺少乘数时，你还能确定说出什么？",
				],
				choices: [
					{
						id: "facts",
						label: [
							"500 contracts traded at $2.15 a share",
							"以每股 $2.15 成交了 500 张",
						],
					},
					{
						id: "dollars",
						label: [
							"$107,500 of premium changed hands",
							"成交了 $107,500 权利金",
						],
					},
					{
						id: "small",
						label: ["$1,075 of premium changed hands", "成交了 $1,075 权利金"],
					},
				],
				answer: "facts",
				done: [
					"Price and size are on the record; a dollar total needs the shares per contract too. Without the multiplier, leave the premium uncalculated rather than assume it.",
					"价格和数量都在记录中；美元总额还需要每张合约的股数。缺少乘数时，宁可不算权利金，也不要凭假设去算。",
				],
			},
		},
		View: ReadView,
	}),
	defineScene<SortState, SortState>({
		id: "sort",
		label: ["Sort the evidence", "区分证据"],
		title: [
			"A known amount doesn't make every claim known",
			"金额已知，不代表每个结论都已知",
		],
		predict: {
			prompt: [
				"Which of these does the block's record establish on its own?",
				"下面哪一项是这笔大单的记录本身就能确定的？",
			],
			choices: [
				{
					id: "facts",
					label: [
						"500 traded at $2.15: $107,500 of premium",
						"500 张以 $2.15 成交：权利金 $107,500",
					],
				},
				{
					id: "bet",
					label: ["A big bet that ALFA rises", "押注 ALFA 上涨的大单"],
				},
				{
					id: "open",
					label: ["500 new contracts opened", "开立了 500 张新合约"],
				},
			],
			answer: "facts",
			revealAt: 1,
			explain: [
				"The print gives the price, size and time, and premium follows from them. Opening and intent need other records.",
				"成交记录给出价格、数量和时间，权利金由此算出。开仓与意图需要其他记录。",
			],
		},
		beats: [
			{
				id: "observed",
				label: ["Observed", "观测"],
				caption: [
					"Start with what the record shows directly: 500 contracts traded at $2.15 at 10:50:00.4.",
					"从记录直接显示的内容开始：10:50:00.4 以 $2.15 成交 500 张。",
				],
				state: { reached: reachedAt[0], stale: false },
			},
			{
				id: "calculated",
				label: ["Calculated", "计算"],
				caption: [
					"From those facts, $107,500 of premium changed hands. That's arithmetic on the record, so it is just as firm.",
					"由这些事实可知交换了 $107,500 的权利金。这是基于记录的算术，同样可靠。",
				],
				state: { reached: reachedAt[1], stale: false },
			},
			{
				id: "inferred",
				label: ["Inferred", "推断"],
				caption: [
					"Against the matched 10:50:00.3 quote of $2.05 / $2.15 it printed at the ask, so a buyer probably started it: an inference.",
					"对照 10:50:00.3 的匹配报价 $2.05 / $2.15，它在卖价成交，因此可能是买方发起：这是推断。",
				],
				state: { reached: reachedAt[2], stale: false },
			},
			{
				id: "unknown",
				label: ["Unknown", "未知"],
				caption: [
					"Whether it opened new contracts, and whether it was a bet on a rise, are unknown. The size of the premium doesn't change that.",
					"它是否开立新合约、是否押注上涨，都是未知的。权利金的大小改变不了这一点。",
				],
				state: { reached: reachedAt[3], stale: false },
			},
			{
				id: "stale",
				label: ["An old quote", "旧报价"],
				caption: [
					"If the only quote on file were from 90 seconds earlier, the location and the buyer inference would drop to unknown. The amount stays known.",
					"如果手头只有 90 秒前的报价，位置和买方推断就会降为未知。金额仍然是已知的。",
				],
				state: { reached: reachedAt[3], stale: true },
			},
		],
		explore: {
			prompt: [
				"Swap the quote on file and watch which statements change.",
				"切换现有报价，观察哪些陈述随之改变。",
			],
			start: () => ({ reached: reachedAt[3], stale: false }),
			task: {
				kind: "answer",
				prompt: [
					"Switch to the 90-second-old quote. Which statement still stands?",
					"切换到 90 秒前的报价。哪条陈述仍然成立？",
				],
				choices: [
					{
						id: "amount",
						label: [
							"$107,500 of premium changed hands",
							"成交了 $107,500 权利金",
						],
					},
					{
						id: "buyer",
						label: ["A buyer probably started it", "很可能是买方发起的"],
					},
					{ id: "ask", label: ["It printed at the ask", "它成交在卖价"] },
				],
				answer: "amount",
				done: [
					"The amount comes from the print alone. Its location, and the buyer inference built on it, need the quote in force at the time, so with an old quote both drop to unknown.",
					"金额只来自成交本身。成交位置及由此推断的买方，都需要当时有效的报价；报价过旧时，这两项都退回为未知。",
				],
			},
		},
		View: SortView,
	}),
	defineScene<GapState, GapState>({
		id: "next",
		label: ["The next check", "下一项检查"],
		title: ["Ask for the record that fills the gap", "寻找能填补缺口的记录"],
		predict: {
			prompt: [
				"You want to know whether the 500 calls opened new positions. Which record helps?",
				"你想知道这 500 张看涨是否开立了新持仓。哪项记录有帮助？",
			],
			choices: [
				{
					id: "oi",
					label: ["Tomorrow's open-interest report", "明天的未平仓量报告"],
				},
				{
					id: "bigger",
					label: ["Another large print today", "今天另一笔大单"],
				},
				{
					id: "wait",
					label: ["Watching whether ALFA rises", "观察 ALFA 是否上涨"],
				},
			],
			answer: "oi",
			revealAt: 1,
			explain: [
				"Open interest counts contracts outstanding. Tuesday's report shows the 105 call up 480, so most of the block opened, though not who opened it.",
				"未平仓量统计的是存续合约。周二的报告显示 105 看涨增加 480 张，说明这笔大单大部分是开仓，但看不出是谁开的。",
			],
		},
		beats: [
			{
				id: "gaps",
				label: ["The gaps", "缺口"],
				caption: [
					"Three questions remain open. For each, name the record that could answer it before looking for more trades.",
					"还有三个问题没有答案。先为每个问题找出能回答它的记录，再去看更多成交。",
				],
				state: { stage: 0 },
			},
			{
				id: "oi",
				label: ["Open interest", "未平仓量"],
				caption: [
					"Tuesday's open-interest report shows the 105 call up 480 contracts. Most of the block opened positions, though the report doesn't say whose.",
					"周二的未平仓量报告显示 105 看涨增加 480 张。这笔大单大部分是开仓，但报告不说明是谁。",
				],
				state: { stage: 1 },
			},
			{
				id: "spread",
				label: ["Linked legs", "关联腿"],
				caption: [
					"The condition code marks it multi-leg, and 500 Oct 18 110 calls sold at $0.90 at the same instant. It was a call spread costing $1.25 a share.",
					"成交条件代码标记为多腿，同一时刻以 $0.90 卖出了 500 张 10月18日 110 看涨。这是一笔每股成本 $1.25 的看涨价差。",
				],
				state: { stage: 2 },
			},
			{
				id: "belief",
				label: ["Belief", "观点"],
				caption: [
					"Whether the trader expects ALFA to rise stays unknown. No market record shows belief, and neither does ALFA's next move.",
					"交易者是否预期 ALFA 上涨仍然未知。没有任何市场记录能显示观点，ALFA 之后的走势也不能。",
				],
				state: { stage: 3 },
			},
		],
		explore: {
			prompt: [
				"Add records one at a time and watch which gap each one closes.",
				"逐项加入记录，观察每项记录填补了哪个缺口。",
			],
			start: () => ({ stage: 0 }),
			task: {
				kind: "answer",
				prompt: [
					"Add the records. Which question does none of them answer?",
					"把记录逐一加上。哪个问题是任何记录都回答不了的？",
				],
				choices: [
					{
						id: "belief",
						label: [
							"Whether the trader expects ALFA to rise",
							"交易者是否预期 ALFA 上涨",
						],
					},
					{
						id: "opened",
						label: [
							"Whether the block opened positions",
							"这笔大宗是否开了新仓",
						],
					},
					{
						id: "spread",
						label: ["Whether it was part of a spread", "它是否是价差的一部分"],
					},
				],
				answer: "belief",
				done: [
					"The open-interest report answers the opening question and the multi-leg code the spread. What anyone believes is in no market record, and ALFA's next move won't reveal it either.",
					"未平仓量报告回答了开仓问题，多腿条件代码回答了价差问题。任何人的想法都不在市场记录里，ALFA 之后的走势也揭示不了。",
				],
			},
		},
		View: GapView,
	}),
] as const;

export function ValidateOptionPrintWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="validate-option-print"
			label={["Interactive lesson on checking one trade", "检查一笔成交互动课"]}
			scenes={scenes}
		/>
	);
}
