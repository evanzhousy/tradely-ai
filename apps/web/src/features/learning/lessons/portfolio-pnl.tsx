import * as m from "motion/react-m";
import {
	alfaCloses,
	CONTRACT_FEE,
	type Copy,
	oct100CallCloseQuote,
	oct100CallMonday,
	pick,
	signedUsd,
	usd,
	yourAccount,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import {
	PayoffChart,
	type PayoffLine,
	type PayoffMarker,
} from "../walkthrough/instruments/payoff-chart";
import { Label, Stage, useTeachMotion } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

/** Your two Monday buys of the Oct 18 100 call, oldest first, in cents per share. */
const lots = oct100CallMonday.trades
	.filter((trade) => trade.buyer === "you")
	.map((trade) => ({
		id: trade.id,
		time: trade.time,
		quantity: trade.quantity,
		price: trade.price,
	}));
const HELD = lots.reduce((sum, lot) => sum + lot.quantity, 0);
const PAID = lots.reduce((sum, lot) => sum + lot.quantity * lot.price, 0);
const AVERAGE = PAID / HELD;
const SOLD = 6;
const SALE = oct100CallCloseQuote.bid;
const MARK = (oct100CallCloseQuote.bid + oct100CallCloseQuote.ask) / 2;
/** Whole dollars when there are no cents: "$5,000", "+$318.75". */
const places = (cents: number) => (Math.round(cents) % 100 === 0 ? 0 : 2);
const dollars = (cents: number) => usd(Math.round(cents), places(cents));
const signed = (cents: number) => signedUsd(Math.round(cents), places(cents));
/** Per-share prices keep their cents; a mid can fall on a half cent. */
const price = (cents: number) =>
	cents % 1 === 0 ? usd(cents) : `$${(cents / 100).toFixed(3)}`;
/** Average cost to three places: "$4.119". */
const AVERAGE_TEXT = `$${(AVERAGE / 100).toFixed(3)}`;

type Method = "fifo" | "average";

/** Realized and unrealized P&L in cents after selling `sold` contracts at `SALE`, marked at `MARK`. */
function split(sold: number, method: Method) {
	if (method === "average") {
		return {
			realized: sold * (SALE - AVERAGE) * 100,
			unrealized: (HELD - sold) * (MARK - AVERAGE) * 100,
		};
	}
	let toSell = sold;
	let realized = 0;
	let unrealized = 0;
	for (const lot of lots) {
		const out = Math.min(toSell, lot.quantity);
		toSell -= out;
		realized += out * (SALE - lot.price) * 100;
		unrealized += (lot.quantity - out) * (MARK - lot.price) * 100;
	}
	return { realized, unrealized };
}

// ——— Scene 1: realized and unrealized ———

type LotState = { sold: boolean; method: Method };

const SQUARE = 30;
const GAP = 4;
/** Sixteen across when they fit, else two rows of eight. */
const squaresPerRow = (width: number) =>
	width >= 16 * (SQUARE + GAP) + 16 ? 16 : 8;

function LotSquares({
	width,
	state,
	locale,
}: {
	width: number;
	state: LotState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const perRow = squaresPerRow(width);
	const rows = Math.ceil(HELD / perRow);
	const left = (width - perRow * (SQUARE + GAP) + GAP) / 2;
	const top = 40;
	const squares = lots.flatMap((lot, l) =>
		Array.from({ length: lot.quantity }, (_, k) => ({
			lot: l,
			key: `${lot.id}-${k}`,
		})),
	);
	const legendY = top + rows * (SQUARE + GAP) + 22;
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t([
					"Your Oct 18 100 calls · one square per contract",
					"你的 10月18日 100 看涨 · 每格一张合约",
				])}
			</Label>
			{squares.map((square, i) => {
				const sold = state.sold && i < SOLD;
				const x = left + (i % perRow) * (SQUARE + GAP);
				const y = top + Math.floor(i / perRow) * (SQUARE + GAP);
				const className =
					state.method === "average"
						? "wt-focus-shape"
						: square.lot === 0
							? "wt-chip"
							: "wt-long-soft";
				return (
					<m.rect
						key={square.key}
						x={x}
						y={y}
						width={SQUARE}
						height={SQUARE}
						rx={5}
						className={sold ? "wt-ghost" : className}
						initial={false}
						animate={{ opacity: sold ? 0.6 : 1 }}
						transition={motion.fade}
					/>
				);
			})}
			{state.method === "average" ? (
				<Label x={left} y={legendY} tone="small">
					{t([
						`every contract at the ${AVERAGE_TEXT} average`,
						`每张按平均成本 ${AVERAGE_TEXT} 计`,
					])}
				</Label>
			) : (
				lots.map((lot, l) => (
					<g key={lot.id}>
						<rect
							x={left + l * 150}
							y={legendY - 10}
							width={12}
							height={12}
							rx={3}
							className={l === 0 ? "wt-chip" : "wt-long-soft"}
						/>
						<Label x={left + l * 150 + 18} y={legendY} tone="small">
							{`${lot.time} · ${lot.quantity} @ ${price(lot.price)}`}
						</Label>
					</g>
				))
			)}
			{state.sold ? (
				<Label x={left} y={legendY + 20} tone="small">
					{t([
						`dashed: ${SOLD} sold at the ${price(SALE)} bid, 15:59`,
						`虚线：15:59 以买价 ${price(SALE)} 卖出 ${SOLD} 张`,
					])}
				</Label>
			) : null}
		</g>
	);
}

function LotView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: LotState;
	explore: LotState | null;
	setExplore: (next: LotState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const now = split(shown.sold ? SOLD : 0, shown.method);
	const result: ResultItem[] = [];
	if (shown.sold)
		result.push({
			id: "realized",
			label: t(["Realized", "已实现"]),
			value: signed(now.realized),
			note:
				shown.method === "fifo"
					? t([
							`first in, first out: the ${lots[0].time} lot`,
							`先进先出：${lots[0].time} 那批`,
						])
					: t([
							`against the ${AVERAGE_TEXT} average`,
							`按平均成本 ${AVERAGE_TEXT}`,
						]),
			evidence: "calculated",
		});
	result.push(
		{
			id: "unrealized",
			label: t(["Unrealized", "未实现"]),
			value: signed(now.unrealized),
			note: t([
				`${HELD - (shown.sold ? SOLD : 0)} marked at the ${price(MARK)} mid`,
				`${HELD - (shown.sold ? SOLD : 0)} 张按中间价 ${price(MARK)} 估值`,
			]),
			evidence: "calculated",
		},
		{
			id: "total",
			label: t(["Total, before fees", "合计（费用前）"]),
			value: signed(now.realized + now.unrealized),
			note: t([
				`fees ${dollars((HELD + (shown.sold ? SOLD : 0)) * CONTRACT_FEE)}`,
				`费用 ${dollars((HELD + (shown.sold ? SOLD : 0)) * CONTRACT_FEE)}`,
			]),
			evidence: "calculated",
		},
	);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Your 16 Oct 18 100 calls as squares colored by the lot they were bought in, with six sold at the close",
						"你的 16 张 10月18日 100 看涨，按买入批次着色的方格，其中 6 张在收盘时卖出",
					])}
					height={(width) =>
						40 + Math.ceil(HELD / squaresPerRow(width)) * (SQUARE + GAP) + 52
					}
				>
					{(width) => (
						<LotSquares width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Lot method", "批次方法"])}
						value={explore.method}
						options={[
							["fifo", t(["First in, first out", "先进先出"])],
							["average", t(["Average cost", "平均成本"])],
						]}
						onChange={(method) => setExplore({ sold: true, method })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Unrealized P&L is what an open position is worth at a mark minus what it cost; realized P&L is fixed when you close. Which cost a sale is matched against depends on a lot rule: first in, first out picks the oldest purchase, average cost uses the blend. The rule moves money between realized and unrealized, not the total. A mark at the mid is a valuation, not a price you could sell at: here selling paid the bid.",
						"未实现盈亏是未平仓持仓按估值价计的价值减去成本；已实现盈亏在平仓时确定。一笔卖出对应哪个成本，取决于批次规则：先进先出取最早的买入，平均成本用加权平均。规则改变的是已实现与未实现之间的分配，而不是合计。按中间价估值是一种估值，而不是你能卖出的价格：这里卖出时拿到的是买价。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: cash is not profit ———

type AccountState = { stage: 0 | 1 | 2 };

const FRIDAY = Math.round(alfaCloses[alfaCloses.length - 1].close * 100);
const CLOSE_SPOT = oct100CallCloseQuote.spot;
const buyFees = HELD * CONTRACT_FEE;
const cashAfterBuys = yourAccount.cashAtOpen - PAID * 100 - buyFees;
const stockOpen = yourAccount.shares * FRIDAY;
const stockClose = yourAccount.shares * CLOSE_SPOT;
const callsClose = HELD * MARK * 100;
const valueOpen = yourAccount.cashAtOpen + stockOpen;
const valueClose = cashAfterBuys + stockClose + callsClose;
const PNL = valueClose - valueOpen;
const afterDeposit = valueClose + yourAccount.deposit;
const cashAfterDeposit = cashAfterBuys + yourAccount.deposit;
const buyingPower = cashAfterDeposit * yourAccount.marginMultiple;

const accountColumns = [
	{
		id: "open",
		head: ["Mon open", "周一开盘"] as Copy,
		cash: yourAccount.cashAtOpen,
		stock: stockOpen,
		calls: 0,
		value: valueOpen,
		pnl: 0,
	},
	{
		id: "close",
		head: ["Mon close", "周一收盘"] as Copy,
		cash: cashAfterBuys,
		stock: stockClose,
		calls: callsClose,
		value: valueClose,
		pnl: PNL,
	},
	{
		id: "deposit",
		head: ["+ deposit", "+ 存入"] as Copy,
		cash: cashAfterDeposit,
		stock: stockClose,
		calls: callsClose,
		value: afterDeposit,
		pnl: PNL,
	},
] as const;

const ACCOUNT_ROW = 34;

function AccountTable({
	width,
	state,
	locale,
}: {
	width: number;
	state: AccountState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const narrow = width < 520;
	const labelWidth = narrow ? 56 : 150;
	const column = (width - 8 - labelWidth) / 3;
	const rows: {
		id: "cash" | "stock" | "calls" | "value" | "pnl";
		label: Copy;
	}[] = [
		{ id: "cash", label: ["Cash", "现金"] },
		{
			id: "stock",
			label: narrow
				? ["ALFA", "ALFA"]
				: [`${yourAccount.shares} ALFA`, `${yourAccount.shares} 股 ALFA`],
		},
		{
			id: "calls",
			label: narrow ? ["Calls", "看涨"] : [`${HELD} calls`, `${HELD} 张看涨`],
		},
		{ id: "value", label: ["Account", "账户"] },
		{
			id: "pnl",
			label: narrow ? ["P&L", "盈亏"] : ["Trading P&L", "交易盈亏"],
		},
	];
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t([
					"Your account · marked at each time",
					"你的账户 · 各列按其时点估值",
				])}
			</Label>
			{accountColumns.map((col, j) => (
				<Label
					key={col.id}
					x={labelWidth + column * (j + 0.5)}
					y={40}
					anchor="middle"
					tone={j === state.stage ? "accent" : "small"}
				>
					{t(col.head)}
				</Label>
			))}
			{rows.map((row, i) => {
				const y = 48 + i * (ACCOUNT_ROW + 4) + (i >= 3 ? 6 : 0);
				const total = row.id === "value" || row.id === "pnl";
				return (
					<g key={row.id}>
						<rect
							x={4}
							y={y}
							width={width - 8}
							height={ACCOUNT_ROW}
							rx={7}
							className={total ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						<Label
							x={12}
							y={y + ACCOUNT_ROW / 2 + 4}
							tone={total ? "accent" : "small"}
						>
							{t(row.label)}
						</Label>
						{accountColumns.map((col, j) => (
							<m.g
								key={col.id}
								initial={false}
								animate={{ opacity: j <= state.stage ? 1 : 0 }}
								transition={motion.fade}
							>
								<text
									x={labelWidth + column * (j + 0.5)}
									y={y + ACCOUNT_ROW / 2 + 5}
									textAnchor="middle"
									style={{ fontSize: width < 520 ? 11 : 13 }}
									className={
										row.id === "pnl" && col.pnl !== 0 ? "wt-gain" : undefined
									}
								>
									{row.id === "pnl" ? signed(col.pnl) : dollars(col[row.id])}
								</text>
							</m.g>
						))}
					</g>
				);
			})}
		</g>
	);
}

function AccountView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: AccountState;
	explore: AccountState | null;
	setExplore: (next: AccountState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] = [
		{
			id: "pnl",
			label: t(["Trading P&L", "交易盈亏"]),
			value: signed(shown.stage === 0 ? 0 : PNL),
			note:
				shown.stage === 0
					? t(["before Monday's trades", "周一交易之前"])
					: t([
							`ALFA ${signed(stockClose - stockOpen)} · calls ${signed(callsClose - PAID * 100)} · fees ${signed(-buyFees)}`,
							`ALFA ${signed(stockClose - stockOpen)} · 看涨 ${signed(callsClose - PAID * 100)} · 费用 ${signed(-buyFees)}`,
						]),
			evidence: "calculated",
		},
	];
	if (shown.stage >= 2)
		result.push(
			{
				id: "value",
				label: t(["Account value", "账户价值"]),
				value: dollars(afterDeposit),
				note: t([
					`+${dollars(yourAccount.deposit)} deposit, not profit`,
					`+${dollars(yourAccount.deposit)} 存入，不是利润`,
				]),
				evidence: "calculated",
			},
			{
				id: "power",
				label: t(["Buying power", "购买力"]),
				value: dollars(buyingPower),
				note: t([
					`cash ${dollars(cashAfterDeposit)}; the rest is credit`,
					`现金 ${dollars(cashAfterDeposit)}；其余是授信`,
				]),
				evidence: "observed",
			},
		);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Your account at Monday's open, Monday's close and after Tuesday's deposit: cash, stock, calls, total value and trading P&L",
						"你的账户在周一开盘、周一收盘和周二存入之后的情况：现金、股票、看涨、总价值与交易盈亏",
					])}
					height={48 + 5 * (ACCOUNT_ROW + 4) + 8}
				>
					{(width) => (
						<AccountTable width={width} state={shown} locale={locale} />
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
							["0", t(["Open", "开盘"])],
							["1", t(["+ Close", "+ 收盘"])],
							["2", t(["+ Deposit", "+ 存入"])],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as AccountState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Account value counts everything: cash plus positions at their marks. Trading P&L counts only what positions earned: the change in their value plus realized gains, minus fees. A deposit or withdrawal changes the account without being profit. Buying power adds whatever credit the account allows; it is borrowed capacity, not money you have and not a safe amount to risk.",
						"账户价值计算全部：现金加上按估值价计的持仓。交易盈亏只计算持仓赚了多少：价值变化加已实现收益，再减费用。存入或取出会改变账户，但不是利润。购买力加上了账户允许的授信；它是借来的额度，不是你拥有的钱，也不是可以放心冒险的金额。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: a short option's loss has no premium cap ———

type ShortState = { stage: 0 | 1 | 2 };

const benLot = oct100CallMonday.trades.find((trade) => trade.seller === "ben");
const BEN = benLot?.quantity ?? 0;
const BEN_PRICE = benLot?.price ?? 0;
const RECEIVED = BEN * BEN_PRICE * 100;
const benAtExpiry = (spot: number) =>
	RECEIVED - BEN * Math.max(spot - 100, 0) * 100 * 100;
const benMarked = RECEIVED - BEN * MARK * 100;

function ShortView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ShortState;
	explore: ShortState | null;
	setExplore: (next: ShortState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const lines: PayoffLine[] = [
		{
			id: "received",
			label: t(["premium received", "收到的权利金"]),
			points: [
				[90, RECEIVED / 100],
				[140, RECEIVED / 100],
			],
			tone: "reference",
			dashed: true,
		},
	];
	if (shown.stage >= 2)
		lines.push({
			id: "expiry",
			label: t(["Ben at expiry", "Ben 到期时"]),
			points: [
				[90, benAtExpiry(90) / 100],
				[100, benAtExpiry(100) / 100],
				[140, benAtExpiry(140) / 100],
			],
			tone: "short",
		});
	const markers: PayoffMarker[] = [];
	if (shown.stage >= 1)
		markers.push({
			id: "mark",
			x: CLOSE_SPOT / 100,
			y: benMarked / 100,
			label: signed(benMarked),
			tone: "loss",
		});
	if (shown.stage >= 2)
		markers.push({
			id: "far",
			x: 120,
			y: benAtExpiry(120) / 100,
			label: signed(benAtExpiry(120)),
			tone: "loss",
		});
	const result: ResultItem[] = [
		{
			id: "received",
			label: t(["Ben received", "Ben 收到"]),
			value: dollars(RECEIVED),
			note: t([
				`${BEN} calls written at ${price(BEN_PRICE)}`,
				`以 ${price(BEN_PRICE)} 卖出 ${BEN} 张看涨`,
			]),
			evidence: "observed",
		},
	];
	if (shown.stage >= 1)
		result.push({
			id: "mark",
			label: t(["Marked at 15:59", "15:59 估值"]),
			value: signed(benMarked),
			note: t([
				`a ${dollars(BEN * MARK * 100)} liability at the mid`,
				`按中间价计为 ${dollars(BEN * MARK * 100)} 的负债`,
			]),
			tone: "loss",
			evidence: "calculated",
		});
	if (shown.stage >= 2)
		result.push({
			id: "far",
			label: t(["If ALFA settles at $120", "若 ALFA 结算于 $120"]),
			value: signed(benAtExpiry(120)),
			note: t(["and more the higher it goes", "越高亏得越多"]),
			tone: "loss",
			evidence: "calculated",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Ben's short position in 10 Oct 18 100 calls: the premium he received, his marked loss at the close, and his result at expiry falling without limit as ALFA rises",
						"Ben 空头 10 张 10月18日 100 看涨：他收到的权利金、收盘估值的亏损，以及到期结果随 ALFA 上涨无限下降",
					])}
					height={(width) => (width < 520 ? 260 : 290)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 260 : 290}
							xRange={[90, 140]}
							yRange={[-40_000, 10_000]}
							xTicks={[90, 100, 110, 120, 130, 140]}
							yTicks={[-30_000, -15_000, 0]}
							lines={lines}
							markers={markers}
							formatY={(value) =>
								value === 0 ? "$0" : signedUsd(value * 100, 0)
							}
							xLabel={t(["ALFA price", "ALFA 价格"])}
							title={t([
								`Ben · short ${BEN} Oct 18 100 calls · $`,
								`Ben · 空头 ${BEN} 张 10月18日 100 看涨 · 美元`,
							])}
						/>
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
							["0", t(["Premium", "权利金"])],
							["1", t(["+ Mark", "+ 估值"])],
							["2", t(["+ Expiry", "+ 到期"])],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as ShortState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A short option carries the opposite sign: its value is a liability, so a rising mark is a loss. The premium received is the most a call writer can make, not the most they can lose. An uncovered short call's loss grows with every dollar ALFA rises above the strike, without a cap; margin rules and a stated multiplier belong in any valuation of it.",
						"期权空头的符号相反：它的价值是一项负债，所以估值上升就是亏损。收到的权利金是看涨卖方最多能赚的，而不是最多会亏的。无备兑的看涨空头，ALFA 每高于行权价一美元，亏损就增加一分，没有上限；对它的任何估值都要写明保证金规则和乘数。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const fifo = split(SOLD, "fifo");
const average = split(SOLD, "average");
const held = split(0, "fifo");

const scenes = [
	defineScene<LotState, LotState>({
		id: "lots",
		label: ["Separate P&L components", "区分盈亏组成"],
		title: [
			"A closed lot and an open mark answer different questions",
			"平仓批次与持仓估值回答不同问题",
		],
		predict: {
			prompt: [
				`At 15:59 you sell ${SOLD} of your ${HELD} calls at the ${price(SALE)} bid. First in, first out, what's your realized P&L?`,
				`15:59 你以买价 ${price(SALE)} 卖出 ${HELD} 张看涨中的 ${SOLD} 张。按先进先出，已实现盈亏是多少？`,
			],
			choices: [
				{
					id: "fifo",
					label: [
						`${signed(fifo.realized)}: the ${lots[0].time} lot at ${price(lots[0].price)}`,
						`${signed(fifo.realized)}：${lots[0].time} 那批，${price(lots[0].price)}`,
					],
				},
				{
					id: "average",
					label: [
						`${signed(average.realized)}: at your average cost`,
						`${signed(average.realized)}：按平均成本`,
					],
				},
				{
					id: "all",
					label: [
						`${signed(fifo.realized + fifo.unrealized)}: everything`,
						`${signed(fifo.realized + fifo.unrealized)}：全部`,
					],
				},
			],
			answer: "fifo",
			entry: { answer: fifo.realized / 100, tolerance: 0.5, prefix: "$" },
			revealAt: 1,
			explain: [
				`First in, first out matches the sale to the oldest lot: ${SOLD} × (${price(SALE)} − ${price(lots[0].price)}) × 100 = ${signed(fifo.realized)}. The other ${HELD - SOLD} stay open at ${signed(fifo.unrealized)}.`,
				`先进先出把卖出对应到最早的一批：${SOLD} × (${price(SALE)} − ${price(lots[0].price)}) × 100 = ${signed(fifo.realized)}。其余 ${HELD - SOLD} 张仍未平仓，为 ${signed(fifo.unrealized)}。`,
			],
		},
		beats: [
			{
				id: "open",
				label: ["Open", "持仓"],
				caption: [
					`Your ${HELD} calls came in two lots. Marked at the ${price(MARK)} mid at 15:59, they're up ${signed(held.unrealized)}, all unrealized.`,
					`你的 ${HELD} 张看涨分两批买入。按 15:59 的中间价 ${price(MARK)} 估值，浮盈 ${signed(held.unrealized)}，全部未实现。`,
				],
				state: { sold: false, method: "fifo" },
			},
			{
				id: "fifo",
				label: ["Sell, FIFO", "卖出，先进先出"],
				caption: [
					`Sell ${SOLD} at the ${price(SALE)} bid. First in, first out: realized ${signed(fifo.realized)}, and ${signed(fifo.unrealized)} still open.`,
					`以买价 ${price(SALE)} 卖出 ${SOLD} 张。先进先出：已实现 ${signed(fifo.realized)}，未平仓 ${signed(fifo.unrealized)}。`,
				],
				state: { sold: true, method: "fifo" },
			},
			{
				id: "average",
				label: ["Average cost", "平均成本"],
				caption: [
					`At average cost the split is ${signed(average.realized)} and ${signed(average.unrealized)}. The total is ${signed(fifo.realized + fifo.unrealized)} either way.`,
					`按平均成本，分配为 ${signed(average.realized)} 和 ${signed(average.unrealized)}。两种方法合计都是 ${signed(fifo.realized + fifo.unrealized)}。`,
				],
				state: { sold: true, method: "average" },
			},
		],
		explore: {
			prompt: ["Switch the lot method.", "切换批次方法。"],
			start: (last) => last,
			task: {
				kind: "answer",
				prompt: [
					"Switch the lot method. Which figure stays the same?",
					"切换批次方法。哪个数字保持不变？",
				],
				choices: [
					{ id: "total", label: ["Total P&L", "总盈亏"] },
					{ id: "realized", label: ["Realized P&L", "已实现盈亏"] },
					{ id: "unrealized", label: ["Unrealized P&L", "未实现盈亏"] },
				],
				answer: "total",
				done: [
					`The method only decides which cost the sale is matched against, so realized and unrealized split differently; together they are ${signed(fifo.realized + fifo.unrealized)} either way.`,
					`批次方法只决定卖出对应哪笔成本，所以已实现和未实现的划分不同；两者合计无论哪种方法都是 ${signed(fifo.realized + fifo.unrealized)}。`,
				],
			},
		},
		View: LotView,
	}),
	defineScene<AccountState, AccountState>({
		id: "account",
		label: ["Separate cash and profit", "区分现金与利润"],
		title: [
			"A deposit changes value without creating trading profit",
			"存入改变价值，不创造交易利润",
		],
		predict: {
			prompt: [
				`Tuesday you deposit ${dollars(yourAccount.deposit)} and your account value jumps by that much. What's your trading P&L now?`,
				`周二你存入 ${dollars(yourAccount.deposit)}，账户价值随之增加。你现在的交易盈亏是多少？`,
			],
			choices: [
				{ id: "same", label: [`Still ${signed(PNL)}`, `仍是 ${signed(PNL)}`] },
				{
					id: "plus",
					label: [
						signed(PNL + yourAccount.deposit),
						signed(PNL + yourAccount.deposit),
					],
				},
				{ id: "zero", label: ["$0", "$0"] },
			],
			answer: "same",
			entry: { answer: PNL / 100, tolerance: 0.5, prefix: "$" },
			revealAt: 2,
			explain: [
				`The deposit is your money moving in, not something your positions earned. P&L stays ${signed(PNL)}; account value becomes ${dollars(afterDeposit)}.`,
				`存入是你自己的钱转进来，而不是持仓赚的。盈亏仍为 ${signed(PNL)}；账户价值变为 ${dollars(afterDeposit)}。`,
			],
		},
		beats: [
			{
				id: "open",
				label: ["Monday open", "周一开盘"],
				caption: [
					`Monday's open: ${dollars(yourAccount.cashAtOpen)} cash and ${yourAccount.shares} ALFA at Friday's $${(FRIDAY / 100).toFixed(2)} close.`,
					`周一开盘：现金 ${dollars(yourAccount.cashAtOpen)}，以及按周五收盘价 $${(FRIDAY / 100).toFixed(2)} 计的 ${yourAccount.shares} 股 ALFA。`,
				],
				state: { stage: 0 },
			},
			{
				id: "close",
				label: ["Monday close", "周一收盘"],
				caption: [
					`By the close cash paid for the calls and fees; ALFA is $${(CLOSE_SPOT / 100).toFixed(2)} and the calls mark at ${price(MARK)}. Trading P&L: ${signed(PNL)}.`,
					`到收盘，现金用于买看涨和付费用；ALFA 为 $${(CLOSE_SPOT / 100).toFixed(2)}，看涨估值 ${price(MARK)}。交易盈亏：${signed(PNL)}。`,
				],
				state: { stage: 1 },
			},
			{
				id: "deposit",
				label: ["Deposit", "存入"],
				caption: [
					`Tuesday's ${dollars(yourAccount.deposit)} deposit lifts the account to ${dollars(afterDeposit)}; P&L doesn't move. Buying power reads ${dollars(buyingPower)}, but only ${dollars(cashAfterDeposit)} of that is cash.`,
					`周二存入 ${dollars(yourAccount.deposit)}，账户升到 ${dollars(afterDeposit)}；盈亏不变。购买力显示 ${dollars(buyingPower)}，但其中只有 ${dollars(cashAfterDeposit)} 是现金。`,
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: ["Step through the account.", "逐步查看账户。"],
			start: () => ({ stage: 2 }),
			task: {
				kind: "answer",
				prompt: [
					`Buying power reads ${dollars(buyingPower)}. How much of that is cash?`,
					`购买力显示 ${dollars(buyingPower)}。其中有多少是现金？`,
				],
				choices: [
					{
						id: "cash",
						label: [dollars(cashAfterDeposit), dollars(cashAfterDeposit)],
					},
					{ id: "power", label: [dollars(buyingPower), dollars(buyingPower)] },
					{
						id: "value",
						label: [dollars(afterDeposit), dollars(afterDeposit)],
					},
				],
				answer: "cash",
				done: [
					`Only ${dollars(cashAfterDeposit)} is cash; the rest of the buying power is credit your broker would lend against it. Spending credit isn't spending profit.`,
					`只有 ${dollars(cashAfterDeposit)} 是现金；购买力的其余部分是券商以此为抵押愿意借给你的信用额度。动用信用不等于花掉盈利。`,
				],
			},
		},
		View: AccountView,
	}),
	defineScene<ShortState, ShortState>({
		id: "short",
		label: ["Value a signed option position", "估值带符号的期权持仓"],
		title: [
			"Received premium is not a short call's loss limit",
			"收到的权利金不是卖出看涨的亏损上限",
		],
		predict: {
			prompt: [
				`Ben received ${dollars(RECEIVED)} for writing ${BEN} calls. What's the most he can lose?`,
				`Ben 卖出 ${BEN} 张看涨收到 ${dollars(RECEIVED)}。他最多会亏多少？`,
			],
			choices: [
				{
					id: "unlimited",
					label: [
						"No fixed limit: it grows as ALFA rises",
						"没有固定上限：随 ALFA 上涨而增加",
					],
				},
				{ id: "premium", label: [dollars(RECEIVED), dollars(RECEIVED)] },
				{ id: "none", label: ["Nothing: he was paid", "不会亏：他已收钱"] },
			],
			answer: "unlimited",
			revealAt: 2,
			explain: [
				`Each dollar ALFA ends above $100 costs Ben ${dollars(BEN * 100 * 100)}. At $120 he's ${signed(benAtExpiry(120))}; at $140, ${signed(benAtExpiry(140))}. The premium only offsets the first part.`,
				`ALFA 到期时每高于 $100 一美元，Ben 就要付出 ${dollars(BEN * 100 * 100)}。在 $120 他是 ${signed(benAtExpiry(120))}；在 $140 是 ${signed(benAtExpiry(140))}。权利金只抵消了最开始的一部分。`,
			],
		},
		beats: [
			{
				id: "premium",
				label: ["Premium", "权利金"],
				caption: [
					`Ben wrote ${BEN} Oct 18 100 calls at ${price(BEN_PRICE)} and received ${dollars(RECEIVED)}.`,
					`Ben 以 ${price(BEN_PRICE)} 卖出 ${BEN} 张 10月18日 100 看涨，收到 ${dollars(RECEIVED)}。`,
				],
				state: { stage: 0 },
			},
			{
				id: "mark",
				label: ["Mark", "估值"],
				caption: [
					`At 15:59 the calls mark at ${price(MARK)}, so his position is a ${dollars(BEN * MARK * 100)} liability: ${signed(benMarked)} on the day.`,
					`15:59 看涨估值 ${price(MARK)}，所以他的持仓是一项 ${dollars(BEN * MARK * 100)} 的负债：当天 ${signed(benMarked)}。`,
				],
				state: { stage: 1 },
			},
			{
				id: "expiry",
				label: ["Expiry", "到期"],
				caption: [
					`At expiry the line keeps falling: ${signed(benAtExpiry(120))} if ALFA settles at $120, with no floor. The ${dollars(RECEIVED)} is the most he can make.`,
					`到期时这条线持续下降：若 ALFA 结算于 $120 为 ${signed(benAtExpiry(120))}，没有底。${dollars(RECEIVED)} 是他最多能赚的。`,
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: ["Step through Ben's position.", "逐步查看 Ben 的持仓。"],
			start: () => ({ stage: 2 }),
			task: {
				kind: "answer",
				prompt: [
					"If ALFA settles at $140, what is Ben's result?",
					"如果 ALFA 结算在 $140，Ben 的结果是多少？",
				],
				choices: [
					{
						id: "far",
						label: [signed(benAtExpiry(140)), signed(benAtExpiry(140))],
					},
					{
						id: "mid",
						label: [signed(benAtExpiry(120)), signed(benAtExpiry(120))],
					},
					{ id: "premium", label: [signed(-RECEIVED), signed(-RECEIVED)] },
				],
				answer: "far",
				done: [
					`Each dollar above $100 costs Ben ${dollars(BEN * 100 * 100)} across his ${BEN} calls: ${signed(benAtExpiry(140))} at $140. The ${dollars(RECEIVED)} he received only offsets the first part.`,
					`ALFA 每高于 $100 一美元，Ben 的 ${BEN} 张看涨就要多付 ${dollars(BEN * 100 * 100)}：在 $140 时是 ${signed(benAtExpiry(140))}。他收到的 ${dollars(RECEIVED)} 只抵消了开头的一部分。`,
				],
			},
		},
		View: ShortView,
	}),
] as const;

export function PortfolioPnlWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="portfolio-pnl"
			label={["Interactive lesson on P&L", "盈亏互动课"]}
			scenes={scenes}
		/>
	);
}
