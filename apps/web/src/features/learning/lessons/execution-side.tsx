import * as m from "motion/react-m";
import {
	type Copy,
	contractLabel,
	count,
	holders,
	OCT_100_CALL,
	oct100CallMonday,
	oct100CallQuoteAtTrade,
	pick,
	type SideCode,
	sideCode,
	type Trade,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import {
	type Claim,
	ClaimLadderStage,
} from "../walkthrough/instruments/claim-ladder";
import {
	SPREAD_RULER_HEIGHT,
	SpreadRuler,
} from "../walkthrough/instruments/spread-ruler";
import {
	type TapeRow,
	TradeTape,
	tapeHeight,
} from "../walkthrough/instruments/trade-tape";
import { Label, Stage, useTeachMotion } from "../walkthrough/stage";
import {
	defineScene,
	type EvidenceKind,
	type Phase,
	type ResultItem,
} from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

type TradeId = "t1" | "t2" | "t3";
const TRADES = oct100CallMonday.trades;
const tradeById = (id: TradeId): Trade =>
	TRADES.find((trade) => trade.id === id) as Trade;
const LABEL = contractLabel(OCT_100_CALL, false);
/** The ruler's price range, in cents. */
const RULER: readonly [number, number] = [395, 430];

/** What a location suggests about who started the trade, and how firmly. */
function sideReading(code: SideCode | null): Copy {
	switch (code) {
		case "ASK":
			return [
				"at the ask: a buyer probably started it",
				"在卖价：可能是买方发起",
			];
		case "BID":
			return [
				"at the bid: a seller probably started it",
				"在买价：可能是卖方发起",
			];
		case "MID":
			return [
				"inside the spread: can't tell who started it",
				"价差之内：无法判断谁发起",
			];
		case "AASK":
			return [
				"above the ask: check timing and conditions first",
				"高于卖价：先检查时间与条件",
			];
		case "BBID":
			return [
				"below the bid: check timing and conditions first",
				"低于买价：先检查时间与条件",
			];
		default:
			return ["no usable quote: location withheld", "没有可用报价：不判断位置"];
	}
}

const rulerLabels = (locale: Locale) => ({
	bidLabel: pick(["bid", "买价"], locale),
	askLabel: pick(["ask", "卖价"], locale),
});

// ——— Scene 1: where each print landed ———

type PlaceState = {
	/** The last Monday print placed so far. */
	trade: TradeId;
	/** A price to test against that print's quote instead of the real one, in cents. */
	test: number | null;
};

function PlaceView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: PlaceState;
	explore: PlaceState | null;
	setExplore: (next: PlaceState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const trade = tradeById(shown.trade);
	const quote = oct100CallQuoteAtTrade[shown.trade];
	const price = shown.test ?? trade.price;
	const code = sideCode(price, quote.bid, quote.ask);
	const placed = TRADES.slice(
		0,
		TRADES.findIndex((print) => print.id === trade.id) + 1,
	);
	const rows: TapeRow[] = [...placed].reverse().map((print) => {
		const at = oct100CallQuoteAtTrade[print.id as TradeId];
		return {
			key: print.id,
			cells: [
				print.time,
				count(print.quantity),
				usd(print.price),
				sideCode(print.price, at.bid, at.ask) ?? "—",
			],
		};
	});
	const tapeTop = SPREAD_RULER_HEIGHT + 8;
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Each Monday print placed against the quote in force when it traded, with its side on the tape",
						"每笔周一成交按成交时的报价定位，并在逐笔成交中标注位置",
					])}
					height={tapeTop + tapeHeight(3)}
				>
					{(width) => (
						<g>
							<SpreadRuler
								width={width}
								min={RULER[0]}
								max={RULER[1]}
								bid={quote.bid}
								ask={quote.ask}
								price={price}
								title={t([
									`Quote at ${quote.time} · ${LABEL[0]}`,
									`${quote.time} 报价 · ${LABEL[1]}`,
								])}
								printLabel={
									shown.test === null
										? `${trade.quantity} @ ${usd(price)}`
										: t([`test ${usd(price)}`, `测试 ${usd(price)}`])
								}
								{...rulerLabels(locale)}
							/>
							<TradeTape
								x={8}
								y={tapeTop}
								width={width - 16}
								title={t([
									`Time and sales · ${LABEL[0]}`,
									`逐笔成交 · ${LABEL[1]}`,
								])}
								columns={[
									{ label: t(["Time", "时间"]), share: 0.25 },
									{
										label: t(["Contracts", "张数"]),
										share: 0.27,
										align: "end",
									},
									{ label: t(["Price", "价格"]), share: 0.25, align: "end" },
									{ label: t(["Side", "位置"]), share: 0.23, align: "end" },
								]}
								rows={rows}
								maxRows={3}
								empty={t(["No trades yet", "尚无成交"])}
							/>
						</g>
					)}
				</Stage>
			}
			result={[
				{
					id: "print",
					label:
						shown.test === null
							? t(["Print", "成交"])
							: t(["Test price", "测试价格"]),
					value:
						shown.test === null
							? `${trade.quantity} @ ${usd(price)}`
							: usd(price),
					note:
						shown.test === null
							? trade.time
							: t(["not a real print", "不是真实成交"]),
				},
				{
					id: "quote",
					label: t(["Quote", "报价"]),
					value: `${usd(quote.bid)} / ${usd(quote.ask)}`,
					note: quote.time,
				},
				{
					id: "side",
					label: t(["Side", "位置"]),
					value: code ?? "—",
					note: t(sideReading(code)),
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<RangeControl
						label={t([
							`Test a price against the ${quote.time.slice(0, 5)} quote`,
							`用 ${quote.time.slice(0, 5)} 的报价测试价格`,
						])}
						value={explore.test ?? trade.price}
						display={usd(explore.test ?? trade.price)}
						min={RULER[0]}
						max={RULER[1]}
						onChange={(test) => setExplore({ ...explore, test })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"This lesson uses five locations: below the bid (BBID), at the bid (BID), anywhere inside the spread (MID), at the ask (ASK) and above the ask (AASK). MID is a region, not only the exact midpoint. Data feeds name these differently, so check each feed's convention.",
						"本课使用五个位置：低于买价（BBID）、等于买价（BID）、价差之内任意位置（MID）、等于卖价（ASK）、高于卖价（AASK）。MID 是一个区间，不只是精确的中点。不同数据源的命名不同，请查看各自的约定。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: is the quote usable? ———

type RefId = "matched" | "stale" | "later" | "put" | "missing";
type RefState = { ref: RefId };

const PRINT_TIME = "11:42:00.4";
const references: Record<
	RefId,
	{
		time: string | null;
		bid: number | null;
		ask: number | null;
		contract: Copy;
		problem: Copy | null;
	}
> = {
	matched: {
		time: oct100CallQuoteAtTrade.t2.time,
		bid: oct100CallQuoteAtTrade.t2.bid,
		ask: oct100CallQuoteAtTrade.t2.ask,
		contract: LABEL,
		problem: null,
	},
	stale: {
		time: "11:40:30.4",
		bid: 400,
		ask: 410,
		contract: LABEL,
		problem: ["90 seconds too old", "早了 90 秒"],
	},
	later: {
		time: "11:42:02.1",
		bid: 415,
		ask: 425,
		contract: LABEL,
		problem: ["arrived after the print", "晚于这笔成交"],
	},
	put: {
		time: oct100CallQuoteAtTrade.t2.time,
		bid: 405,
		ask: 420,
		contract: ["Oct 18 100 put", "10月18日 100 看跌"],
		problem: ["quote for another contract", "另一张合约的报价"],
	},
	missing: {
		time: null,
		bid: null,
		ask: null,
		contract: LABEL,
		problem: ["no quote recorded", "没有记录报价"],
	},
};

function RefView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: RefState;
	explore: RefState | null;
	setExplore: (next: RefState) => void;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const shown = phase === "explore" && explore ? explore : state;
	const trade = tradeById("t2");
	const ref = references[shown.ref];
	const wouldSay = sideCode(trade.price, ref.bid, ref.ask);
	const usable = ref.problem === null;
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The 11:42 print against a chosen reference quote, and whether that quote can be used",
						"11:42 成交对照所选参考报价，以及该报价能否使用",
					])}
					height={SPREAD_RULER_HEIGHT + 100}
				>
					{(width) => (
						<g>
							<SpreadRuler
								width={width}
								min={RULER[0]}
								max={RULER[1]}
								bid={ref.bid}
								ask={ref.ask}
								price={trade.price}
								title={t([
									`Print ${PRINT_TIME} · ${trade.quantity} @ ${usd(trade.price)}`,
									`成交 ${PRINT_TIME} · ${trade.quantity} 张 @ ${usd(trade.price)}`,
								])}
								printLabel={usd(trade.price)}
								unusable={ref.problem ? t(ref.problem) : undefined}
								{...rulerLabels(locale)}
							/>
							<rect
								x={8}
								y={SPREAD_RULER_HEIGHT + 6}
								width={width - 16}
								height={86}
								rx={12}
								className={usable ? "wt-focus-shape" : "wt-panel-shape"}
							/>
							<Label x={22} y={SPREAD_RULER_HEIGHT + 28} tone="muted">
								{t(["Reference quote", "参考报价"])}
							</Label>
							<m.g
								key={shown.ref}
								initial={motion.enabled ? { opacity: 0 } : false}
								animate={{ opacity: 1 }}
								transition={motion.fade}
							>
								<Label x={22} y={SPREAD_RULER_HEIGHT + 50}>
									{ref.time === null
										? t(["none on record", "没有记录"])
										: `${t(ref.contract)} · ${ref.time}`}
								</Label>
								{ref.bid !== null && ref.ask !== null ? (
									<Label
										x={22}
										y={SPREAD_RULER_HEIGHT + 72}
										tone={usable ? "accent" : undefined}
									>
										{`${usd(ref.bid)} / ${usd(ref.ask)}`}
									</Label>
								) : null}
							</m.g>
						</g>
					)}
				</Stage>
			}
			result={[
				{
					id: "print",
					label: t(["Print", "成交"]),
					value: `${trade.quantity} @ ${usd(trade.price)}`,
					note: PRINT_TIME,
				},
				{
					id: "reference",
					label: t(["Reference", "参考报价"]),
					value: usable ? t(["usable", "可用"]) : t(ref.problem ?? ["", ""]),
					note: ref.time ? ref.time : undefined,
					tone: usable ? "gain" : "loss",
				},
				usable
					? {
							id: "side",
							label: t(["Side", "位置"]),
							value: wouldSay ?? "—",
							note: t(sideReading(wouldSay)),
							evidence: "calculated",
						}
					: {
							id: "side",
							label: t(["Side", "位置"]),
							value: t(["withheld", "不作判断"]),
							note: wouldSay
								? t([
										`this quote would say ${wouldSay}`,
										`按此报价会得出 ${wouldSay}`,
									])
								: undefined,
							evidence: "unknown",
						},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Reference quote", "参考报价"])}
						value={explore.ref}
						options={[
							["matched", t(["Matched", "匹配"])],
							["stale", t(["Older", "过早"])],
							["later", t(["Later", "过晚"])],
							["put", t(["Other contract", "其他合约"])],
							["missing", t(["Missing", "缺失"])],
						]}
						onChange={(ref) => setExplore({ ref })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A location is only as good as its reference: the quote must be for the same contract and in force at the print's timestamp. An older or later quote, another contract's quote, a missing quote, or a locked or crossed one gives no usable spread. Complex-order legs and special trade conditions need their own review.",
						"位置判断取决于参考报价：必须是同一合约、在成交时刻有效的报价。过早或过晚的报价、其他合约的报价、缺失的报价，或锁定、交叉的报价，都无法提供可用价差。复杂订单的单腿成交和特殊成交条件需要单独审查。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: location is not intent ———

type ClaimState = { trade: TradeId; reached: number; ledger: boolean };

function claimsFor(tradeId: TradeId, locale: Locale): Claim[] {
	const t = tr(locale);
	const trade = tradeById(tradeId);
	const quote = oct100CallQuoteAtTrade[tradeId];
	const code = sideCode(trade.price, quote.bid, quote.ask);
	const location: Copy =
		code === "ASK"
			? ["Printed at the ask", "在卖价成交"]
			: code === "BID"
				? ["Printed at the bid", "在买价成交"]
				: ["Printed inside the spread", "在价差之内成交"];
	const initiator: { text: Copy; evidence: EvidenceKind; basis: Copy } =
		code === "ASK"
			? {
					text: ["A buyer probably started it", "可能是买方发起"],
					evidence: "inferred",
					basis: [
						"buyers usually lift offers; not certain",
						"买方通常吃卖单，但不确定",
					],
				}
			: code === "BID"
				? {
						text: ["A seller probably started it", "可能是卖方发起"],
						evidence: "inferred",
						basis: [
							"sellers usually hit bids; not certain",
							"卖方通常砸买单，但不确定",
						],
					}
				: {
						text: ["Who started it", "谁发起了成交"],
						evidence: "unknown",
						basis: [
							"inside the spread, either side could",
							"价差之内，双方都有可能",
						],
					};
	return [
		{
			id: "location",
			text: t(location),
			evidence: "calculated",
			basis: t([
				`${usd(trade.price)} vs ${usd(quote.bid)} / ${usd(quote.ask)}`,
				`${usd(trade.price)} 对照 ${usd(quote.bid)} / ${usd(quote.ask)}`,
			]),
		},
		{
			id: "initiator",
			text: t(initiator.text),
			evidence: initiator.evidence,
			basis: t(initiator.basis),
		},
		{
			id: "open",
			text: t(["It opened a new position", "它开立了新持仓"]),
			evidence: "unknown",
			basis: t([
				"the tape has no open or close flag",
				"逐笔成交没有开平仓标记",
			]),
		},
		{
			id: "view",
			text:
				code === "BID"
					? t(["Someone is bearish on ALFA", "有人看空 ALFA"])
					: t(["Someone is bullish on ALFA", "有人看多 ALFA"]),
			evidence: "unknown",
			basis: t([
				"it could close, hedge or roll a position",
				"可能是平仓、对冲或移仓",
			]),
		},
	];
}

function ledgerLine(tradeId: TradeId, locale: Locale) {
	const trade = tradeById(tradeId);
	const t = tr(locale);
	const verb = (effect: "open" | "close", buy: boolean): Copy =>
		buy
			? effect === "open"
				? ["bought to open", "买入开仓"]
				: ["bought to close", "买入平仓"]
			: effect === "open"
				? ["sold to open", "卖出开仓"]
				: ["sold to close", "卖出平仓"];
	return `${t(holders[trade.buyer].name)} ${t(verb(trade.buyerEffect, true))} · ${t(holders[trade.seller].name)} ${t(verb(trade.sellerEffect, false))}`;
}

function ClaimView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ClaimState;
	explore: ClaimState | null;
	setExplore: (next: ClaimState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const trade = tradeById(shown.trade);
	const claims = claimsFor(shown.trade, locale).map((claim, i) => ({
		...claim,
		hidden: i > shown.reached,
		focus: i === shown.reached && !shown.ledger,
	}));
	const evidenceLabels: Record<EvidenceKind, string> = {
		observed: t(["observed", "观测"]),
		calculated: t(["calculated", "计算"]),
		modeled: t(["modeled", "模型"]),
		inferred: t(["inferred", "推断"]),
		unknown: t(["unknown", "未知"]),
	};
	const result: ResultItem[] = [
		{
			id: "print",
			label: t(["Print", "成交"]),
			value: `${trade.quantity} @ ${usd(trade.price)}`,
			note: trade.time,
		},
		{
			id: "supported",
			label: t(["Supported by the data", "数据能支持"]),
			value:
				sideCode(
					trade.price,
					oct100CallQuoteAtTrade[shown.trade].bid,
					oct100CallQuoteAtTrade[shown.trade].ask,
				) === "MID"
					? t(["location only", "仅位置"])
					: t(["location, a likely starter", "位置与可能的发起方"]),
		},
	];
	if (shown.ledger)
		result.push({
			id: "ledger",
			label: t(["Behind the scenes", "幕后实情"]),
			value: ledgerLine(shown.trade, locale),
			note: t([
				"only this teaching ledger shows it",
				"只有本课的教学账本能看到",
			]),
		});
	return (
		<SceneFrame
			stage={
				<ClaimLadderStage
					label={t([
						"Claims about one print, from what it shows directly to what it cannot show",
						"关于一笔成交的推断，从直接可见到无法得知",
					])}
					title={t([
						`${trade.time} · ${trade.quantity} @ ${usd(trade.price)} · ${LABEL[0]}`,
						`${trade.time} · ${trade.quantity} 张 @ ${usd(trade.price)} · ${LABEL[1]}`,
					])}
					claims={claims}
					evidenceLabels={evidenceLabels}
				/>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Monday print", "周一成交"])}
						value={explore.trade}
						options={TRADES.map((print) => [
							print.id as TradeId,
							`${print.time} · ${usd(print.price)}`,
						])}
						onChange={(trade) => setExplore({ ...explore, trade })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Location compares a print with its quote, so it is calculated. Who started a trade is an inference from location. Whether a trade opened or closed positions, and what anyone believed, are not in trade data at all: a sale at the bid can close a long, cover a hedge or roll to another expiry.",
						"位置是把成交与报价比较得出的，属于计算结果。谁发起成交是基于位置的推断。成交是开仓还是平仓、参与者怎么想，根本不在成交数据中：在买价卖出可能是平掉多头、调整对冲或移到另一个到期日。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<PlaceState, PlaceState>({
		id: "place",
		label: ["Place the print", "定位成交"],
		title: [
			"A print's side is its place against the quote",
			"成交位置就是它相对报价的位置",
		],
		predict: {
			prompt: [
				"At 11:42 the quote is $4.10 bid, $4.20 ask, and 6 contracts print at $4.15. Where is that print?",
				"11:42 报价为买价 $4.10、卖价 $4.20，6 张在 $4.15 成交。这笔成交在哪个位置？",
			],
			choices: [
				{ id: "mid", label: ["MID: inside the spread", "MID：价差之内"] },
				{ id: "ask", label: ["ASK: a buyer paid up", "ASK：买方加价"] },
				{ id: "bid", label: ["BID", "BID"] },
			],
			answer: "mid",
			revealAt: 1,
			explain: [
				"$4.15 is above the $4.10 bid and below the $4.20 ask, so it sits inside the spread: MID. From there, either side could have started it.",
				"$4.15 高于 $4.10 买价、低于 $4.20 卖价，位于价差之内：MID。在这里，任何一方都可能发起成交。",
			],
		},
		beats: [
			{
				id: "t1",
				label: ["10:05 at the ask", "10:05 在卖价"],
				caption: [
					"10:05: your 10 contracts printed at $4.10, exactly the ask in the quote at that moment. Side: ASK.",
					"10:05：你的 10 张以 $4.10 成交，正好等于当时报价中的卖价。位置：ASK。",
				],
				state: { trade: "t1", test: null },
			},
			{
				id: "t2",
				label: ["11:42 inside", "11:42 在价差内"],
				caption: [
					"11:42: 6 contracts at $4.15 against a $4.10 / $4.20 quote. Inside the spread: MID.",
					"11:42：6 张以 $4.15 成交，报价为 $4.10 / $4.20。位于价差之内：MID。",
				],
				state: { trade: "t2", test: null },
			},
			{
				id: "t3",
				label: ["14:18 at the bid", "14:18 在买价"],
				caption: [
					"14:18: 4 contracts at $4.05, the bid in the $4.05 / $4.15 quote. Side: BID. Each print is judged against its own quote.",
					"14:18：4 张以 $4.05 成交，正是 $4.05 / $4.15 报价中的买价。位置：BID。每笔成交都要对照自己时刻的报价。",
				],
				state: { trade: "t3", test: null },
			},
			{
				id: "outside",
				label: ["Outside the spread", "价差之外"],
				caption: [
					"A price outside the quote, such as $4.25 against $4.10 / $4.20, is AASK. Check timing and trade conditions before reading anything into it.",
					"报价之外的价格，比如对照 $4.10 / $4.20 的 $4.25，属于 AASK。在解读之前，先检查时间和成交条件。",
				],
				state: { trade: "t2", test: 425 },
			},
		],
		explore: {
			prompt: [
				"Slide a test price across the 11:42 quote and watch the location change.",
				"在 11:42 报价上滑动测试价格，观察位置如何变化。",
			],
			start: () => ({ trade: "t2", test: 412 }),
			task: {
				kind: "reach",
				prompt: [
					"Find a test price the feed would label AASK.",
					"找出一个会被数据源标记为 AASK 的测试价格。",
				],
				reached: (e) => (e.test ?? 0) > 420,
				done: [
					"Above the $4.20 ask is AASK. A print outside the quote is worth a check of its timing and conditions before you read anything into it.",
					"高于 $4.20 卖价就是 AASK。成交价落在报价之外时，先核查它的时间和条件，再下任何结论。",
				],
			},
		},
		View: PlaceView,
	}),
	defineScene<RefState, RefState>({
		id: "reference",
		label: ["Check the quote", "检查报价"],
		title: ["Keep the print; question the quote", "保留成交，审查报价"],
		predict: {
			prompt: [
				"Your only quote for the 11:42:00.4 print is from 11:40:30: $4.00 / $4.10. The print is $4.15. What side is it?",
				"对于 11:42:00.4 的成交，你只有 11:40:30 的报价：$4.00 / $4.10。成交价 $4.15。它在哪个位置？",
			],
			choices: [
				{
					id: "withheld",
					label: ["Can't say: the quote is too old", "无法判断：报价太旧"],
				},
				{ id: "aask", label: ["AASK: above the ask", "AASK：高于卖价"] },
				{ id: "mid", label: ["MID", "MID"] },
			],
			answer: "withheld",
			revealAt: 1,
			explain: [
				"A quote from 90 seconds earlier describes a different market. Measured against it the print looks like AASK, but the quote in force at 11:42 made it MID.",
				"90 秒前的报价描述的是另一个市场。用它来衡量，这笔成交看似 AASK，但 11:42 有效的报价显示它是 MID。",
			],
		},
		beats: [
			{
				id: "matched",
				label: ["Matched quote", "匹配报价"],
				caption: [
					"The quote in force a tenth of a second before the 11:42 print, for the same contract, puts $4.15 inside the spread: MID.",
					"成交前 0.1 秒、同一合约的有效报价，显示 $4.15 位于价差之内：MID。",
				],
				state: { ref: "matched" },
			},
			{
				id: "stale",
				label: ["Too old", "太旧"],
				caption: [
					"Swap in a quote from 90 seconds earlier and the same print would read AASK. The print hasn't changed; the reference is simply out of date.",
					"换成 90 秒前的报价，同一笔成交会被读成 AASK。成交没变，只是参考报价过时了。",
				],
				state: { ref: "stale" },
			},
			{
				id: "later",
				label: ["Too late", "太晚"],
				caption: [
					"A quote from two seconds after the print would read BID. A quote that arrived later can't describe the market the trade met.",
					"成交两秒后的报价会读成 BID。晚到的报价无法描述这笔成交当时面对的市场。",
				],
				state: { ref: "later" },
			},
			{
				id: "missing",
				label: ["Missing", "缺失"],
				caption: [
					"With no quote on record, keep the print's price and time, and leave its side unknown rather than guess.",
					"没有记录报价时，保留成交的价格和时间，把位置标为未知，而不是去猜。",
				],
				state: { ref: "missing" },
			},
		],
		explore: {
			prompt: [
				"Try each reference quote against the same print.",
				"用同一笔成交逐一试验各个参考报价。",
			],
			start: () => ({ ref: "put" }),
			task: {
				kind: "answer",
				prompt: [
					"Which reference quote lets you name this print's side?",
					"用哪个参考报价才能判断这笔成交的位置？",
				],
				choices: [
					{ id: "matched", label: ["The matched quote", "匹配的报价"] },
					{ id: "stale", label: ["The older quote", "较早的报价"] },
					{ id: "later", label: ["The later quote", "较晚的报价"] },
				],
				answer: "matched",
				done: [
					"Only the quote in force just before the print describes the market it met. An older, later or other contract's quote describes a different market; with none, the side stays unknown.",
					"只有成交前一刻有效的报价，才描述它所面对的市场。较早、较晚或其他合约的报价描述的是另一个市场；没有报价时，位置只能是未知。",
				],
			},
		},
		View: RefView,
	}),
	defineScene<ClaimState, ClaimState>({
		id: "claims",
		label: ["Location ≠ intent", "位置 ≠ 意图"],
		title: [
			"How far a print's location can take you",
			"成交位置能支持到哪一步",
		],
		predict: {
			prompt: [
				"4 contracts print at $4.05, the bid, at 14:18. What can you conclude?",
				"14:18 有 4 张在买价 $4.05 成交。你能得出什么结论？",
			],
			choices: [
				{
					id: "seller",
					label: [
						"A seller probably started it; nothing more",
						"可能是卖方发起，仅此而已",
					],
				},
				{
					id: "bearish",
					label: ["Someone is betting ALFA falls", "有人押注 ALFA 下跌"],
				},
				{
					id: "short",
					label: ["A new short position opened", "开立了新的空头"],
				},
			],
			answer: "seller",
			revealAt: 3,
			explain: [
				"The print and its quote support a location and a likely starter. Opening, closing and belief are not in trade data, and here both sides were in fact closing.",
				"成交与报价能支持位置和可能的发起方。开仓、平仓和观点都不在成交数据中，而这里双方其实都在平仓。",
			],
		},
		beats: [
			{
				id: "location",
				label: ["Location", "位置"],
				caption: [
					"Start with what the data shows: $4.05 equals the bid in the 14:18 quote. That is calculated, not guessed.",
					"从数据能显示的开始：$4.05 等于 14:18 报价中的买价。这是计算出来的，不是猜的。",
				],
				state: { trade: "t3", reached: 0, ledger: false },
			},
			{
				id: "initiator",
				label: ["Who started it", "谁发起"],
				caption: [
					"A trade at the bid was probably started by a seller hitting it. That is an inference: likely, not certain.",
					"在买价成交，可能是卖方主动砸盘。这是推断：可能，但不确定。",
				],
				state: { trade: "t3", reached: 1, ledger: false },
			},
			{
				id: "open",
				label: ["Open or close", "开仓或平仓"],
				caption: [
					"Did it open a new short? The tape carries no open or close flag, so from public data this is unknown.",
					"它开立了新的空头吗？逐笔成交没有开平仓标记，所以根据公开数据，这是未知的。",
				],
				state: { trade: "t3", reached: 2, ledger: false },
			},
			{
				id: "view",
				label: ["Belief", "观点"],
				caption: [
					"Is someone bearish? A sale at the bid can close a long, adjust a hedge or roll to another expiry. Unknown as well.",
					"有人看空吗？在买价卖出可能是平掉多头、调整对冲或移仓到其他到期日。同样未知。",
				],
				state: { trade: "t3", reached: 3, ledger: false },
			},
			{
				id: "ledger",
				label: ["Behind the scenes", "幕后实情"],
				caption: [
					"The teaching ledger shows what really happened: Cara sold to close her long and Eli bought to close his short. No new bet at all.",
					"教学账本显示了真实情况：Cara 卖出平掉多头，Eli 买入平掉空头。根本没有新的押注。",
				],
				state: { trade: "t3", reached: 3, ledger: true },
			},
		],
		explore: {
			prompt: [
				"Pick another Monday print and read how far its evidence goes.",
				"选择另一笔周一成交，看看它的证据能走多远。",
			],
			start: () => ({ trade: "t1", reached: 3, ledger: true }),
			task: {
				kind: "answer",
				prompt: [
					"Check each Monday print against the ledger. Which one opened positions on both sides?",
					"对照台账逐一查看周一的成交。哪一笔让买卖双方都开了仓？",
				],
				choices: [
					{ id: "t1", label: ["10:05 · $4.10", "10:05 · $4.10"] },
					{ id: "t2", label: ["11:42 · $4.15", "11:42 · $4.15"] },
					{ id: "t3", label: ["14:18 · $4.05", "14:18 · $4.05"] },
				],
				answer: "t1",
				done: [
					"At 10:05 you and Ben both opened. At 11:42 you opened while Cara closed, and at 14:18 both sides closed. The tape gives no hint of any of it.",
					"10:05 你和 Ben 都是开仓。11:42 你开仓而 Cara 平仓，14:18 双方都是平仓。成交记录对此毫无提示。",
				],
			},
		},
		View: ClaimView,
	}),
] as const;

export function ExecutionSideWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="execution-side"
			label={["Interactive lesson on where a trade printed", "成交位置互动课"]}
			scenes={scenes}
		/>
	);
}
