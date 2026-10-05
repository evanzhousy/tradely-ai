import { FieldGroup } from "@tradely/ui/components/field";
import {
	type Copy,
	count,
	dayLabel,
	expiries,
	holders,
	openInterestChange,
	type PositionEffect,
	PREVIOUS_SESSION_DATE,
	pick,
	signedCount,
	type Trade,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import {
	ExpiryStrip,
	STRIP_HEIGHT,
	type StripColumn,
} from "../walkthrough/instruments/expiry-strip";
import {
	type LedgerRow,
	ledgerHeight,
	PositionLedger,
} from "../walkthrough/instruments/position-ledger";
import { READOUT_HEIGHT, Readout } from "../walkthrough/instruments/readout";
import {
	CLOCK_HEIGHT,
	type ClockMark,
	MON_CLOSE,
	MON_OPEN,
	SessionClock,
	TUE_REPORT,
} from "../walkthrough/instruments/session-clock";
import {
	type TapeRow,
	TradeTape,
	tapeHeight,
} from "../walkthrough/instruments/trade-tape";
import { Player } from "../walkthrough/player";
import { Label, Stage } from "../walkthrough/stage";
import { textWidth } from "../walkthrough/text-measure";
import { defineScene, type ResultItem } from "../walkthrough/types";
import { SceneFrame } from "../walkthrough/walkthrough";
import { sessionFlowVsStructureFilm } from "./session-flow-vs-structure-film";
import {
	apply,
	type BucketState,
	bucketFacts,
	contract,
	day,
	earlier,
	type LedgerState,
	later,
	ledgerBeats,
	minuteOf,
	order,
	start,
} from "./session-flow-vs-structure-model";

const effectCopy = (
	side: "buys" | "sells",
	quantity: number,
	effect: PositionEffect,
): Copy => [
	`${side} ${quantity} · ${effect === "open" ? "opens" : "closes"}`,
	`${side === "buys" ? "买入" : "卖出"} ${quantity} 张 · ${effect === "open" ? "开仓" : "平仓"}`,
];

const tradeEffect = (trade: Trade): Copy => {
	const change = openInterestChange(trade);
	if (change > 0) return [`+${change} · both opened`, `+${change} · 双方开仓`];
	if (change < 0)
		return [
			`${signedCount(change)} · both closed`,
			`${signedCount(change)} · 双方平仓`,
		];
	return ["±0 · changed hands", "±0 · 换手"];
};

// ——— Scene 1: open, close, transfer ———

type LedgerExplore = {
	buyer: PositionEffect;
	seller: PositionEffect;
	quantity: number;
};

function exploreTrade({ buyer, seller, quantity }: LedgerExplore): Trade {
	return {
		id: `explore-${buyer}-${seller}-${quantity}`,
		time: "12:00",
		quantity,
		price: 410,
		buyer: buyer === "open" ? "you" : "eli",
		seller: seller === "open" ? "ben" : "cara",
		buyerEffect: buyer,
		sellerEffect: seller,
	};
}

function ledgerCopy(locale: Locale) {
	const t = (value: Copy) => pick(value, locale);
	return {
		title: t(contract),
		openInterest: t(["Open interest", "未平仓量"]),
		volume: t(["Volume today", "今日成交量"]),
		short: t(["← written (short)", "← 卖出开仓（空头）"]),
		long: t(["held (long) →", "持有（多头）→"]),
		equal: t([
			"all longs = all shorts = open interest",
			"全部多头 = 全部空头 = 未平仓量",
		]),
	};
}

function LedgerView({
	locale,
	state,
	phase,
	explore,
	setExplore,
}: {
	locale: Locale;
	state: LedgerState;
	phase: "predict" | "watch" | "explore";
	explore: LedgerExplore | null;
	setExplore: (next: LedgerExplore) => void;
}) {
	const t = (value: Copy) => pick(value, locale);
	const shown: LedgerState =
		phase === "explore" && explore
			? (() => {
					const trade = exploreTrade(explore);
					return {
						holdings: apply(start, trade),
						before: start,
						trade,
						volume: trade.quantity,
						volumeBefore: 0,
						openInterest: day.startOpenInterest + openInterestChange(trade),
						openInterestBefore: day.startOpenInterest,
					};
				})()
			: state;
	const trade = shown.trade;
	const rows: LedgerRow[] = order.map((id) => ({
		id,
		name: t(holders[id].name),
		holding: shown.holdings[id],
		before: shown.before?.[id],
		muted: id === "others",
		tag:
			trade?.buyer === id
				? t(effectCopy("buys", trade.quantity, trade.buyerEffect))
				: trade?.seller === id
					? t(effectCopy("sells", trade.quantity, trade.sellerEffect))
					: undefined,
	}));
	const result: ResultItem[] = [
		{
			id: "volume",
			label: t(["Volume today", "今日成交量"]),
			value: count(shown.volume),
			note: t(["every contract traded", "每成交一张都计入"]),
			evidence: "observed",
		},
		{
			id: "oi",
			label: t(["Open interest", "未平仓量"]),
			value: count(shown.openInterest),
			note:
				shown.openInterestBefore === undefined
					? t(["contracts outstanding", "存续合约数"])
					: t([
							`was ${count(shown.openInterestBefore)}`,
							`原为 ${count(shown.openInterestBefore)}`,
						]),
			tone:
				shown.openInterestBefore === undefined
					? undefined
					: shown.openInterest > shown.openInterestBefore
						? "gain"
						: shown.openInterest < shown.openInterestBefore
							? "loss"
							: "neutral",
		},
		{
			id: "trade",
			label: t(["This trade", "这笔成交"]),
			value: trade ? t(tradeEffect(trade)) : "—",
			note: trade
				? `${trade.quantity} @ ${usd(trade.price)}`
				: t(["no trade yet", "尚无成交"]),
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Each holder's long and short positions in one contract, with open interest and volume",
						"一份合约中每个账户的多头与空头持仓，以及未平仓量与成交量",
					])}
					height={(width) => ledgerHeight(width, rows.length)}
				>
					{(width) => (
						<PositionLedger
							width={width}
							rows={rows}
							openInterest={shown.openInterest}
							openInterestBefore={shown.openInterestBefore}
							volume={shown.volume}
							volumeBefore={shown.volumeBefore}
							scaleMax={120}
							labels={ledgerCopy(locale)}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<FieldGroup>
						<ChoiceField
							label={t(["Buyer", "买方"])}
							value={explore.buyer}
							options={[
								["open", t(["Opens (you)", "开仓（你）"])],
								["close", t(["Closes a short (Eli)", "平掉空头（Eli）"])],
							]}
							onChange={(buyer) => setExplore({ ...explore, buyer })}
						/>
						<ChoiceField
							label={t(["Seller", "卖方"])}
							value={explore.seller}
							options={[
								["open", t(["Opens (Ben)", "开仓（Ben）"])],
								["close", t(["Closes a long (Cara)", "平掉多头（Cara）"])],
							]}
							onChange={(seller) => setExplore({ ...explore, seller })}
						/>
						<RangeControl
							label={t(["Contracts", "张数"])}
							value={explore.quantity}
							display={count(explore.quantity)}
							min={1}
							max={20}
							onChange={(quantity) => setExplore({ ...explore, quantity })}
						/>
					</FieldGroup>
				) : null
			}
			details={
				<>
					<p>
						{t([
							"Public trade reports never say whether a trade opened or closed a position. This ledger shows it only because it is a teaching example, so you can see what open interest counts.",
							"公开的成交报告从不说明一笔成交是开仓还是平仓。这里的台账之所以能显示，是因为它是教学示例，让你看清未平仓量统计的是什么。",
						])}
					</p>
					<p>
						{t([
							"Exercise, assignment and expiration also remove contracts. They show up in the next day's count, together with the day's trades.",
							"行权、被指派和到期也会移除合约。它们与当天的成交一起，反映在次日的统计中。",
						])}
					</p>
				</>
			}
		/>
	);
}

// ——— Scene 2: when open interest updates ———

type ClockState = {
	now: number;
	printed: number;
	published: boolean;
};

const clockStops: readonly ClockState[] = [
	{ now: MON_OPEN, printed: 0, published: false },
	...day.trades.map((trade, i) => ({
		now: minuteOf(trade.time),
		printed: i + 1,
		published: false,
	})),
	{ now: MON_CLOSE, printed: day.trades.length, published: false },
	{ now: TUE_REPORT, printed: day.trades.length, published: true },
];
const stopAt = (now: number) =>
	clockStops.find((stop) => stop.now === now) ?? clockStops[0];

function clockTime(now: number, locale: Locale) {
	const tuesday = now >= 1440;
	const minutes = now % 1440;
	const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
	return pick(
		tuesday ? [`Tue ${time}`, `周二 ${time}`] : [`Mon ${time}`, `周一 ${time}`],
		locale,
	);
}

function ClockView({
	locale,
	state,
	phase,
	explore,
	setExplore,
}: {
	locale: Locale;
	state: ClockState;
	phase: "predict" | "watch" | "explore";
	explore: ClockState | null;
	setExplore: (next: ClockState) => void;
}) {
	const t = (value: Copy) => pick(value, locale);
	const shown = phase === "explore" && explore ? explore : state;
	const trades = day.trades.slice(0, shown.printed);
	const volume = trades.reduce((sum, trade) => sum + trade.quantity, 0);
	const report = day.reports[shown.published ? 1 : 0];
	const asOf = dayLabel(report.asOf);
	const rows: TapeRow[] = [...trades].reverse().map((trade) => ({
		key: trade.id,
		cells: [trade.time, count(trade.quantity), usd(trade.price)],
		muted: shown.published,
	}));
	const marks: ClockMark[] = [
		...day.trades.map((trade) => ({
			key: trade.id,
			at: minuteOf(trade.time),
			label: trade.time,
			kind: "trade" as const,
		})),
		{ key: "close", at: MON_CLOSE, label: "16:00", kind: "close" },
		{
			key: "report",
			at: TUE_REPORT,
			label: t(["07:00 count", "07:00 发布"]),
			kind: "report",
		},
	];
	const volumeLabel = shown.published
		? t(["Monday's volume", "周一成交量"])
		: t(["Volume today", "今日成交量"]);
	const oiLabel = t(["Open interest", "未平仓量"]);
	const oiNote = t([`count at ${asOf[0]} close`, `${asOf[1]} 收盘统计`]);
	const result: ResultItem[] = [
		{
			id: "volume",
			label: volumeLabel,
			value: count(volume),
			note: shown.published
				? t(["final", "最终"])
				: t(["updates with each trade", "每笔成交即更新"]),
			evidence: "observed",
		},
		{
			id: "oi",
			label: t(["Open interest on screen", "屏幕上的未平仓量"]),
			value: count(report.value),
			note: oiNote,
			evidence: "observed",
		},
		{
			id: "next",
			label: t(["Monday's count", "周一的统计"]),
			value: shown.published
				? count(day.reports[1].value)
				: t(["not yet", "尚未发布"]),
			note: t(["published Tue before the open", "周二开盘前发布"]),
			evidence: shown.published ? "observed" : "unknown",
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A session timeline with the trade tape, the volume counter and the open-interest figure",
						"交易时段时间轴，以及逐笔成交、成交量计数与未平仓量",
					])}
					height={(width) =>
						width < 560
							? CLOCK_HEIGHT + 14 + tapeHeight(3) + 12 + READOUT_HEIGHT * 2 + 10
							: // Beside the tape, the two readouts stand a little taller than it.
								CLOCK_HEIGHT +
								14 +
								Math.max(tapeHeight(3), READOUT_HEIGHT * 2 + 10) +
								2
					}
				>
					{(width) => {
						const narrow = width < 560;
						const tapeWidth = narrow ? width : Math.round(width * 0.56);
						const top = CLOCK_HEIGHT + 14;
						const readX = narrow ? 0 : tapeWidth + 12;
						const readWidth = narrow ? width : width - tapeWidth - 12;
						const readY = narrow ? top + tapeHeight(3) + 12 : top;
						return (
							<>
								<SessionClock
									x={0}
									y={0}
									width={width}
									now={shown.now}
									nowLabel={clockTime(shown.now, locale)}
									marks={marks}
									labels={{
										session: t(["Monday session", "周一交易时段"]),
										night: t(["overnight", "隔夜"]),
										morning: t(["Tue", "周二"]),
									}}
								/>
								<TradeTape
									x={0}
									y={top}
									width={tapeWidth}
									title={t([
										`Time and sales · ${contract[0]}`,
										`逐笔成交 · ${contract[1]}`,
									])}
									columns={[
										{ label: t(["Time", "时间"]), share: 0.34 },
										{ label: t(["Size", "张数"]), share: 0.3, align: "end" },
										{ label: t(["Price", "价格"]), share: 0.36, align: "end" },
									]}
									rows={rows}
									maxRows={3}
									empty={t(["No trades yet", "尚无成交"])}
								/>
								<Readout
									x={readX}
									y={readY}
									width={readWidth}
									label={volumeLabel}
									value={count(volume)}
									note={
										shown.published ? t(["final", "最终"]) : t(["live", "实时"])
									}
								/>
								<Readout
									x={readX}
									y={readY + READOUT_HEIGHT + 10}
									width={readWidth}
									label={oiLabel}
									value={count(report.value)}
									note={oiNote}
									highlight={shown.published}
								/>
							</>
						);
					}}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<RangeControl
						label={t(["Clock", "时间"])}
						value={clockStops.findIndex((stop) => stop.now === explore.now)}
						display={clockTime(explore.now, locale)}
						min={0}
						max={clockStops.length - 1}
						onChange={(index) => setExplore(clockStops[index])}
					/>
				) : null
			}
			details={
				<>
					<p>
						{t([
							"Open interest is counted once a day, after trades, exercises and assignments are processed, and published before the next open. Screens show that count all day.",
							"未平仓量每天统计一次：在成交、行权与指派处理完之后统计，并在下一个开盘前发布。屏幕全天显示的都是这个统计。",
						])}
					</p>
					<p>
						{t([
							"An intraday open-interest number is an estimate from a model, not a report. Label it as one.",
							"盘中的未平仓量数字是模型估计，不是报告，应如实标注。",
						])}
					</p>
				</>
			}
		/>
	);
}

// ——— Scene 3: compare like with like ———

function BucketView({
	locale,
	state,
	phase,
	explore,
	setExplore,
}: {
	locale: Locale;
	state: BucketState;
	phase: "predict" | "watch" | "explore";
	explore: BucketState | null;
	setExplore: (next: BucketState) => void;
}) {
	const t = (value: Copy) => pick(value, locale);
	const shown = phase === "explore" && explore ? explore : state;
	const facts = bucketFacts(shown);
	const first = bucketFacts({ later: false, compare: false });
	const date = dayLabel(facts.date);
	const members = facts.members
		.map((column) => t(expiries[column.id].label))
		.join(" + ");
	const columns: StripColumn[] = facts.columns.map((column) => ({
		key: column.id,
		label: t(expiries[column.id].label),
		days: column.days,
		value: column.value,
		member: column.member,
		change: column.change,
	}));
	const oct4 = facts.columns.find((column) => column.id === "oct4");
	const title = t([
		`ALFA 100 calls · counts at the ${date[0]} close`,
		`ALFA 100 看涨 · ${date[1]} 收盘统计`,
	]);
	const titleLines = (width: number) =>
		textWidth(title, 12) > width - 16 ? title.split(" · ") : [title];
	const result: ResultItem[] = [
		{
			id: "bucket",
			label: t(["14–30 day bucket", "14–30 天到期桶"]),
			value: count(facts.total),
			note: members,
			evidence: "calculated",
		},
		{
			id: "change",
			label: t(["Bucket change", "到期桶变化"]),
			value: shown.later ? signedCount(facts.total - first.total) : "—",
			note: shown.later
				? t(["includes new members", "包含成员变化"])
				: t(["first date", "起始日期"]),
		},
		{
			id: "series",
			label: t(["Oct 4 series", "10月4日 序列"]),
			value: count(oct4?.value ?? 0),
			note: shown.later
				? t([
						`${signedCount((oct4?.value ?? 0) - (earlier.values.oct4 ?? 0))} same contracts`,
						`同一合约 ${signedCount((oct4?.value ?? 0) - (earlier.values.oct4 ?? 0))}`,
					])
				: t(["same contract both dates", "两个日期同一合约"]),
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Open interest by expiry with a bracket over the expiries inside the 14–30 day bucket",
						"按到期日的未平仓量，括号标出 14–30 天到期桶内的到期日",
					])}
					height={(width) =>
						STRIP_HEIGHT + 20 + (titleLines(width).length - 1) * 14
					}
				>
					{(width) => (
						<>
							{/* On a narrow stage the title breaks at its separator rather than shrink. */}
							{titleLines(width).map((line, i) => (
								<Label key={line} x={8} y={16 + i * 14} tone="muted">
									{line}
								</Label>
							))}
							<ExpiryStrip
								x={0}
								y={24 + (titleLines(width).length - 1) * 14}
								width={width}
								columns={columns}
								maxValue={560}
								bucketLabel={t(["14–30 days", "14–30 天"])}
								daysLabel={(days) => t([`${days} days`, `${days} 天`])}
							/>
						</>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<FieldGroup>
						<ChoiceField
							label={t(["Count date", "统计日期"])}
							value={explore.later ? "later" : "earlier"}
							options={[
								["earlier", t(dayLabel(earlier.date))],
								["later", t(dayLabel(later.date))],
							]}
							onChange={(value) =>
								setExplore({ ...explore, later: value === "later" })
							}
						/>
						<ChoiceField
							label={t(["Same-series change", "同一序列变化"])}
							value={explore.compare ? "on" : "off"}
							options={[
								["off", t(["Hide", "隐藏"])],
								["on", t(["Show", "显示"])],
							]}
							onChange={(value) =>
								setExplore({ ...explore, compare: value === "on" })
							}
						/>
					</FieldGroup>
				) : null
			}
			details={
				<p>
					{t([
						"A days-to-expiry bucket is defined by days, not dates, so its members change as time passes. To measure new positions, compare one series (the same expiry, strike and type) across two counts.",
						"到期天数桶按天数而非日期定义，所以成员会随时间变化。要衡量新持仓，应在两次统计之间比较同一序列（相同到期日、行权价与类型）。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const previous = dayLabel(PREVIOUS_SESSION_DATE);
const scenes = [
	defineScene<LedgerState, LedgerExplore>({
		id: "ledger",
		label: ["Open, close, transfer", "开仓、平仓与换手"],
		title: [
			"Volume counts trades; open interest counts contracts",
			"成交量统计成交，未平仓量统计合约",
		],
		predict: {
			prompt: [
				"100 contracts are open. You buy 10 calls to open, and Ben sells them to open. By how many contracts does open interest change?",
				"目前有 100 张合约未平仓。你买入 10 张看涨开仓，Ben 卖出开仓。未平仓量变化多少张？",
			],
			choices: [
				{ id: "ten", label: ["+10", "+10"] },
				{ id: "twenty", label: ["+20: one per side", "+20：每方各算一次"] },
				{ id: "same", label: ["0: it stays at 100", "0：保持 100"] },
			],
			answer: "ten",
			entry: { answer: 10, unit: [" contracts", " 张"] },
			explain: [
				"Both sides opened, so 10 new contracts exist. Open interest counts contracts, not sides: +10, not +20. Volume also rises by 10.",
				"双方都是开仓，所以新增 10 张合约。未平仓量按合约计，而不是按双方计：+10，而不是 +20。成交量也增加 10。",
			],
		},
		beats: [
			{
				id: "start",
				label: ["Before trading", "交易前"],
				caption: [
					"100 contracts are open. Each has a holder who is long and a writer who is short, so longs and shorts both total 100.",
					"目前有 100 张合约未平仓。每张都有一个持有多头的持有人和一个持有空头的义务方，所以多头与空头合计都是 100。",
				],
				state: ledgerBeats[0],
			},
			{
				id: "open",
				label: ["Both open", "双方开仓"],
				caption: [
					"You buy 10 to open; Ben sells 10 to open. Ten new contracts now exist: volume 10, open interest 110.",
					"你买入 10 张开仓，Ben 卖出 10 张开仓。新增 10 张合约：成交量 10，未平仓量 110。",
				],
				state: ledgerBeats[1],
			},
			{
				id: "transfer",
				label: ["Transfer", "换手"],
				caption: [
					"You buy 6 more to open, but Cara sells 6 to close. The contracts only change hands: volume 16, open interest stays 110.",
					"你再买入 6 张开仓，但 Cara 卖出 6 张平仓。合约只是换手：成交量 16，未平仓量仍为 110。",
				],
				state: ledgerBeats[2],
			},
			{
				id: "close",
				label: ["Both close", "双方平仓"],
				caption: [
					"Eli buys 4 to close his short; Cara sells 4 to close her long. Four contracts disappear: volume 20, open interest 106.",
					"Eli 买入 4 张平掉空头，Cara 卖出 4 张平掉多头。4 张合约消失：成交量 20，未平仓量 106。",
				],
				state: ledgerBeats[3],
			},
		],
		explore: {
			prompt: [
				"Choose whether each side opens or closes, and set the size. Volume always rises by the size; open interest depends on both sides.",
				"选择双方各自是开仓还是平仓，并设定张数。成交量总是增加该张数；未平仓量取决于双方。",
			],
			start: () => ({ buyer: "open", seller: "close", quantity: 6 }),
			task: {
				kind: "reach",
				prompt: [
					"Make an 8-contract trade that lowers open interest.",
					"做一笔 8 张的交易，让未平仓量下降。",
				],
				reached: (e) =>
					e.buyer === "close" && e.seller === "close" && e.quantity === 8,
				done: [
					"When both sides close, 8 contracts stop existing: volume rises by 8 and open interest falls by 8. Volume alone can't tell you which way open interest moved.",
					"双方都平仓时，8 张合约就不再存在：成交量增加 8，未平仓量减少 8。仅凭成交量无法判断未平仓量往哪个方向变。",
				],
			},
		},
		View: LedgerView,
	}),
	defineScene<ClockState, ClockState>({
		id: "clock",
		label: ["When it updates", "何时更新"],
		title: [
			"Volume moves all day; open interest waits for the count",
			"成交量全天变动，未平仓量等待统计",
		],
		predict: {
			prompt: [
				"At 14:30 on Monday, 20 contracts have traded. What will the open-interest figure on your screen show?",
				"周一 14:30，已成交 20 张。屏幕上的未平仓量会显示什么？",
			],
			choices: [
				{ id: "friday", label: ["100, Friday's count", "100，周五的统计"] },
				{ id: "net", label: ["106", "106"] },
				{ id: "sum", label: ["120", "120"] },
			],
			answer: "friday",
			entry: { answer: 100, unit: [" contracts", " 张"] },
			revealAt: 2,
			explain: [
				"Open interest is counted once a day, after the close. All Monday your screen keeps Friday's 100; Monday's 106 arrives Tuesday morning.",
				"未平仓量每天收盘后统计一次。整个周一屏幕都显示周五的 100；周一的 106 在周二早晨才出现。",
			],
		},
		beats: [
			{
				id: "open",
				label: ["Monday open", "周一开盘"],
				caption: [
					`Monday 09:30. Your screen shows open interest 100: the count at the ${previous[0]} close, published before today's open.`,
					`周一 09:30。屏幕上的未平仓量 100 是 ${previous[1]} 收盘时的统计，在今天开盘前发布。`,
				],
				state: stopAt(MON_OPEN),
			},
			{
				id: "first",
				label: ["First trade", "第一笔成交"],
				caption: [
					"10:05. Ten contracts trade. The volume counter moves at once; the open-interest figure stays at Friday's 100.",
					"10:05，成交 10 张。成交量计数器立即变化；未平仓量仍停留在周五的 100。",
				],
				state: stopAt(minuteOf(day.trades[0].time)),
			},
			{
				id: "afternoon",
				label: ["Afternoon", "午后"],
				caption: [
					"By 14:18, 20 contracts have traded, but open interest still reads 100. It is a daily count, not a live one.",
					"到 14:18 已成交 20 张，但未平仓量仍显示 100。它是每日统计，不是实时数据。",
				],
				state: stopAt(minuteOf(day.trades[2].time)),
			},
			{
				id: "report",
				label: ["Next morning", "次日早晨"],
				caption: [
					"Before Tuesday's open, Monday's count is published: 106. It nets every trade and any exercise, but not who traded.",
					"周二开盘前，周一的统计发布：106。它汇总了所有成交与行权的净结果，但不说明是谁交易的。",
				],
				state: stopAt(TUE_REPORT),
			},
		],
		explore: {
			prompt: [
				"Move the clock and watch which numbers change and which wait for the next count.",
				"拖动时间，观察哪些数字会变化、哪些要等下一次统计。",
			],
			start: (last) => last,
			task: {
				kind: "reach",
				prompt: [
					"Move the clock to the last moment the open-interest figure still shows Friday's count.",
					"把时钟移到未平仓量仍显示周五数字的最后时刻。",
				],
				reached: (e) => e.now === MON_CLOSE,
				done: [
					"At Monday's close all 20 contracts have traded, yet the figure is still Friday's 100. Monday's count arrives with the report before Tuesday's open.",
					"周一收盘时 20 张已全部成交，但这个数字仍是周五的 100。周一的统计要到周二开盘前的报告才会公布。",
				],
			},
		},
		View: ClockView,
	}),
	defineScene<BucketState, BucketState>({
		id: "bucket",
		label: ["Like with like", "同类比较"],
		title: [
			"Compare the same contracts, not the same label",
			"比较相同的合约，而不是相同的标签",
		],
		predict: {
			prompt: [
				"A week later, the 14–30 day bucket shows open interest 650, up from 420. Did traders open 230 new contracts?",
				"一周后，14–30 天到期桶的未平仓量从 420 升到 650。交易者新开了 230 张合约吗？",
			],
			choices: [
				{ id: "yes", label: ["Yes, 230 new contracts", "是，新开 230 张"] },
				{
					id: "members",
					label: [
						"Not necessarily: the bucket now holds different expiries",
						"不一定：桶里现在是不同的到期日",
					],
				},
				{
					id: "fell",
					label: ["No, open interest fell", "没有，未平仓量下降了"],
				},
			],
			answer: "members",
			revealAt: 1,
			explain: [
				"The bucket is defined by days, not dates. As a week passes one expiry leaves and another joins, so its total mixes new positions with a change of members.",
				"到期桶按天数而非日期定义。一周过去，一个到期日离开、另一个加入，所以总数混合了新持仓与成员变化。",
			],
		},
		beats: [
			{
				id: "earlier",
				label: ["Sep 9", "9月9日"],
				caption: [
					"Monday Sep 9. The 14–30 day bucket holds the Sep 27 and Oct 4 calls: open interest 300 + 120 = 420.",
					"9月9日周一。14–30 天到期桶包含 9月27日 与 10月4日 看涨：未平仓量 300 + 120 = 420。",
				],
				state: { later: false, compare: false },
			},
			{
				id: "later",
				label: ["A week later", "一周后"],
				caption: [
					"Sep 16. Every expiry is 7 days closer, so Sep 27 leaves the bucket and Oct 11 joins: 130 + 520 = 650.",
					"9月16日。每个到期日都近了 7 天，9月27日 移出，10月11日 加入：130 + 520 = 650。",
				],
				state: { later: true, compare: false },
			},
			{
				id: "series",
				label: ["Same series", "同一序列"],
				caption: [
					"Compare each series with itself: +10, +10, +20. The bucket's +230 is mostly Sep 27 swapped for Oct 11.",
					"每个序列与自身比较：+10、+10、+20。到期桶的 +230 主要来自 9月27日 被 10月11日 替换。",
				],
				state: { later: true, compare: true },
			},
		],
		explore: {
			prompt: [
				"Switch the count date and the same-series view to see which expiries the bucket adds up.",
				"切换统计日期与同一序列视图，看看到期桶加总了哪些到期日。",
			],
			start: (last) => last,
			task: {
				kind: "answer",
				prompt: [
					"Turn on the same-series view. How did open interest in the Oct 4 calls change over the week?",
					"打开同一序列视图。10月4日 看涨的未平仓量在这一周变化了多少？",
				],
				choices: [
					{ id: "ten", label: ["+10", "+10"] },
					{
						id: "bucket",
						label: ["+230, like the bucket", "+230，与分组相同"],
					},
					{ id: "all", label: ["+130", "+130"] },
				],
				answer: "ten",
				done: [
					"The Oct 4 calls went from 120 to 130: +10. The bucket's +230 is mostly Sep 27 leaving and Oct 11 joining, not new positions.",
					"10月4日 看涨从 120 变为 130：+10。分组的 +230 主要是 9月27日 移出、10月11日 加入，并不是新的持仓。",
				],
			},
		},
		View: BucketView,
	}),
] as const;

export function VolumeOpenInterestWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Player
			locale={locale}
			id="session-flow-vs-structure"
			label={[
				"Interactive lesson on volume and open interest",
				"成交量与未平仓量互动课",
			]}
			film={sessionFlowVsStructureFilm}
			scenes={scenes}
		/>
	);
}
