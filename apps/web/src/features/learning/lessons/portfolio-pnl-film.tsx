import { type Copy, pick, yourAccount } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import type { Film, FilmContext } from "../walkthrough/film";
import {
	Backdrop,
	createDirector,
	EndCard,
	filmFrame,
	Lines,
	lineCount,
	TitleCard,
	Word,
} from "../walkthrough/film-kit";
import {
	AVERAGE_TEXT,
	afterDeposit,
	BEN,
	BEN_PRICE,
	benAtExpiry,
	benMarked,
	buyFees,
	buyingPower,
	CLOSE_SPOT,
	callsClose,
	cashAfterDeposit,
	dollars,
	HELD,
	lots,
	MARK,
	PAID,
	PNL,
	price,
	RECEIVED,
	SALE,
	SOLD,
	signed,
	split,
	stockClose,
	stockOpen,
	valueClose,
	valueOpen,
} from "./portfolio-pnl-model";

/*
 * P&L, as a film. It opens on an account that rose $6,199.60 from Monday's open to
 * Tuesday and asks how much of that was earned. The account as one bar: ALFA +$160, the
 * calls +$1,050, fees −$10.40, so +$1,199.60 earned; then a $5,000 deposit that lifts the
 * value without being profit, and buying power of $36,799.20, half of it credit. Then the
 * calls' +$1,050 as sixteen contracts in two lots: unrealized until six are sold at the
 * bid, split +$330 and +$645 first in, first out, or +$318.75 and +$656.25 at average
 * cost: +$975 either way. Last, Ben's ten short calls: $4,100 received, and no floor.
 *
 *   open      0–4      "P&L"
 *   question  4–10     $29,960 → $36,159.60: how much did you earn?
 *   account   10–22    +$160, +$1,050, −$10.40: +$1,199.60 earned; +$5,000 deposited;
 *                       cut: buying power $36,799.20, half of it credit
 *   calls     22–33.5  16 contracts, +$1,050 unrealized; sell 6: FIFO, then average;
 *                       cut: +$975 either way
 *   short     33.5–44.5 Ben: +$4,100 received, −$675 marked, −$15,900 at $120;
 *                       cut: "P&L is what your positions earned."
 *   next      44.5–47  Next: performance
 */

const END = 47;
const ACCOUNT = [29_000, 37_000] as const;
const BEN_X = [90, 140] as const;
const BEN_Y = [-40_000, 10_000] as const;
const fifo = split(SOLD, "fifo");
const average = split(SOLD, "average");
const held = split(0, "fifo");
const EARNED_FROM = valueOpen / 100;
const STOCK_TO = EARNED_FROM + (stockClose - stockOpen) / 100;
const CALLS_TO = STOCK_TO + (callsClose - PAID * 100) / 100;
const CLOSE_TO = valueClose / 100;
const TUESDAY = afterDeposit / 100;
const zeroed = (cents: number) =>
	Math.round(cents) === 0 ? "$0" : signed(cents);

function layout(width: number) {
	const frame = filmFrame(width);
	const { height, narrow, margin } = frame;
	const left = Math.max(margin, narrow ? 46 : 0);
	const right = width * 0.965;
	// The account bar.
	const barBottom = height * (narrow ? 0.7 : 0.66);
	const barTop = barBottom - height * 0.1;
	const ax = (dollars: number) =>
		left +
		((dollars - ACCOUNT[0]) / (ACCOUNT[1] - ACCOUNT[0])) * (right - left);
	// Ben's chart.
	const bTop = height * (narrow ? 0.36 : 0.28);
	const bBottom = height * 0.84;
	const bx = (spot: number) =>
		left + ((spot - BEN_X[0]) / (BEN_X[1] - BEN_X[0])) * (right - left);
	const by = (dollars: number) =>
		bBottom - ((dollars - BEN_Y[0]) / (BEN_Y[1] - BEN_Y[0])) * (bBottom - bTop);
	// The contracts.
	const perRow = narrow ? 8 : 16;
	const square = Math.min(frame.room / perRow - 4, narrow ? 34 : 46);
	const gridWidth = perRow * (square + 4) - 4;
	const gridLeft = (width - gridWidth) / 2;
	const gridTop = height * (narrow ? 0.29 : 0.32);
	const gridBottom = gridTop + Math.ceil(HELD / perRow) * (square + 4) - 4;
	return {
		...frame,
		left,
		right,
		barTop,
		barBottom,
		ax,
		bTop,
		bBottom,
		bx,
		by,
		square,
		gridLeft,
		gridWidth,
		gridBottom,
		cell: (i: number) => ({
			x: gridLeft + (i % perRow) * (square + 4),
			y: gridTop + Math.floor(i / perRow) * (square + 4),
		}),
		pair: narrow ? [0.27, 0.73] : [0.32, 0.68],
	};
}

const copy = {
	title: ["P&L", "盈亏"],
	titleSub: ["positions, cost and cash", "持仓、成本与现金"],
	qOpen: ["Your account · Monday open", "你的账户 · 周一开盘"],
	qTue: ["Your account · Tuesday", "你的账户 · 周二"],
	qUp: [
		`up ${dollars(afterDeposit - valueOpen)}`,
		`增加 ${dollars(afterDeposit - valueOpen)}`,
	],
	qLine: ["How much of that did you earn?", "其中有多少是你赚的？"],
	mondayHead: [
		"Monday: ALFA rose, your calls rose, you paid fees.",
		"周一：ALFA 上涨，你的看涨上涨，你付了费用。",
	],
	mondayHeadShort: ["Monday: ALFA, calls, fees.", "周一：ALFA、看涨、费用。"],
	depositHead: [
		`Tuesday: you deposit ${dollars(yourAccount.deposit)}.`,
		`周二：你存入 ${dollars(yourAccount.deposit)}。`,
	],
	earnedHead: [
		`The account rose ${dollars(afterDeposit - valueOpen)}; you earned ${dollars(PNL)}.`,
		`账户增加 ${dollars(afterDeposit - valueOpen)}；你赚了 ${dollars(PNL)}。`,
	],
	earnedHeadShort: [`Earned: ${dollars(PNL)}.`, `赚到的：${dollars(PNL)}。`],
	meter: ["account", "账户"],
	earned: [`${signed(PNL)} earned`, `赚了 ${signed(PNL)}`],
	breakdown: [
		`ALFA ${signed(stockClose - stockOpen)} · calls ${signed(callsClose - PAID * 100)} · fees ${signed(-buyFees)}`,
		`ALFA ${signed(stockClose - stockOpen)} · 看涨 ${signed(callsClose - PAID * 100)} · 费用 ${signed(-buyFees)}`,
	],
	/** On a phone the headline has named the three, in this order. */
	breakdownShort: [
		`${signed(stockClose - stockOpen)} · ${signed(callsClose - PAID * 100)} · ${signed(-buyFees)}`,
		`${signed(stockClose - stockOpen)} · ${signed(callsClose - PAID * 100)} · ${signed(-buyFees)}`,
	],
	deposited: [
		`+${dollars(yourAccount.deposit)} deposited`,
		`存入 +${dollars(yourAccount.deposit)}`,
	],
	bpTag: ["buying power", "购买力"],
	bpLine: [
		`${dollars(cashAfterDeposit)} of cash, doubled by margin: half of it is credit, not money you have.`,
		`${dollars(cashAfterDeposit)} 现金，经保证金翻倍：一半是授信，不是你拥有的钱。`,
	],
	lotsHead: [
		`The calls' ${signed(held.unrealized)} is a mark at the ${price(MARK)} mid, not a sale.`,
		`看涨的 ${signed(held.unrealized)} 是按中间价 ${price(MARK)} 的估值，不是卖出。`,
	],
	lotsHeadShort: [
		`The calls' ${signed(held.unrealized)} is a mark.`,
		`看涨的 ${signed(held.unrealized)} 是估值。`,
	],
	fifoHead: [
		`Sell ${SOLD} at the ${price(SALE)} bid, first in, first out.`,
		`以买价 ${price(SALE)} 卖出 ${SOLD} 张，先进先出。`,
	],
	fifoHeadShort: [
		`Sell ${SOLD}, first in, first out.`,
		`卖出 ${SOLD} 张，先进先出。`,
	],
	averageHead: [
		"Average cost: the same sale, another split.",
		"平均成本：同一笔卖出，另一种分配。",
	],
	averageHeadShort: ["Average cost: another split.", "平均成本：另一种分配。"],
	averageLegend: [
		`every contract at the ${AVERAGE_TEXT} average`,
		`每张按平均成本 ${AVERAGE_TEXT} 计`,
	],
	realized: ["realized", "已实现"],
	unrealized: ["unrealized", "未实现"],
	totalTag: ["total, either rule", "合计，两种规则相同"],
	totalLine: [
		`Not ${signed(held.unrealized)}: selling paid the ${price(SALE)} bid, not the ${price(MARK)} mid.`,
		`不是 ${signed(held.unrealized)}：卖出拿到的是买价 ${price(SALE)}，不是中间价 ${price(MARK)}。`,
	],
	benHead: [
		`Ben wrote ${BEN} of the same calls at ${price(BEN_PRICE)}.`,
		`Ben 以 ${price(BEN_PRICE)} 卖出了 ${BEN} 张同样的看涨。`,
	],
	benHeadShort: [
		`Ben wrote ${BEN} at ${price(BEN_PRICE)}.`,
		`Ben 以 ${price(BEN_PRICE)} 卖出 ${BEN} 张。`,
	],
	expiryHead: [
		`At expiry, every dollar above $100 costs him ${dollars(BEN * 100 * 100)}.`,
		`到期时，高于 $100 的每一美元让他付出 ${dollars(BEN * 100 * 100)}。`,
	],
	expiryHeadShort: [
		`Each $1 above $100: −${dollars(BEN * 100 * 100)}.`,
		`高于 $100 每 $1：−${dollars(BEN * 100 * 100)}。`,
	],
	benAxis: [
		`Ben · short ${BEN} Oct 18 100 calls`,
		`Ben · 空头 ${BEN} 张 10月18日 100 看涨`,
	],
	priceAxis: ["ALFA price", "ALFA 价格"],
	received: [`received ${signed(RECEIVED)}`, `收到 ${signed(RECEIVED)}`],
	marked: [
		`15:59 mark ${signed(benMarked)}`,
		`15:59 估值 ${signed(benMarked)}`,
	],
	markedShort: [`15:59 ${signed(benMarked)}`, `15:59 ${signed(benMarked)}`],
	far: [
		`$120: ${signed(benAtExpiry(120))}`,
		`$120：${signed(benAtExpiry(120))}`,
	],
	claimBig: ["P&L is what your positions earned.", "盈亏是持仓赚到的。"],
	claimSub: [
		"Not a deposit, not buying power, and for a short call, not capped by the premium.",
		"不是存入，不是购买力；对卖出看涨来说，也不以权利金为上限。",
	],
	nextBig: ["Next: performance", "下一课：绩效"],
	nextSub: ["returns, win rate and drawdown", "收益、胜率与回撤"],
} as const satisfies Record<string, Copy>;

/** The account bar's pieces, left to right, in dollars. */
const segments = [
	{ name: "seg-base", from: ACCOUNT[0], to: EARNED_FROM, tone: "neutral" },
	{ name: "seg-stock", from: EARNED_FROM, to: STOCK_TO, tone: "gain" },
	{ name: "seg-calls", from: STOCK_TO, to: CALLS_TO, tone: "gain" },
	{ name: "seg-fees", from: CLOSE_TO, to: CALLS_TO, tone: "loss" },
	{ name: "seg-deposit", from: CLOSE_TO, to: TUESDAY, tone: "model" },
] as const;

function Scene({
	width,
	locale,
}: {
	width: number;
	height: number;
	locale: Locale;
}) {
	const t = (value: Copy) => pick(value, locale);
	const L = layout(width);
	const { height: H, type: T, room, narrow } = L;
	const W = width;
	const headline = (name: string, text: Copy, short: Copy) => (
		<Lines
			name={name}
			text={t(narrow ? short : text)}
			x={L.margin}
			y={L.headY}
			size={T.head}
			maxWidth={room}
			anchor="start"
		/>
	);
	/** A big figure that fits the frame, however many digits it has. */
	const fit = (text: string, share = 0.84) =>
		Math.min(T.big, (W * share) / (text.length * 0.62));
	const x0 = L.ax(EARNED_FROM);
	const x1 = L.ax(CLOSE_TO);
	const bracketY = L.barTop - 10;
	const markX = L.bx(CLOSE_SPOT / 100);
	const markY = L.by(benMarked / 100);
	const farX = L.bx(120);
	const farY = L.by(benAtExpiry(120) / 100);
	return (
		<>
			<Backdrop frame={L} />

			<g data-f="depth">
				<g data-f="world">
					{/* The account as one bar, from Monday's open to Tuesday. */}
					<g data-f="acct">
						{segments.map(({ name, from, to, tone }) => (
							<rect
								key={name}
								data-f={name}
								className="wt-film-bar"
								data-tone={tone}
								x={L.ax(from)}
								y={L.barTop}
								width={Math.max(L.ax(to) - L.ax(from), 1.5)}
								height={L.barBottom - L.barTop}
							/>
						))}
						<path
							d={`M${L.left} ${L.barBottom}H${L.right}`}
							className="wt-axis"
						/>
						{[30_000, 32_000, 34_000, 36_000].map((tick) => (
							<g key={tick}>
								<path
									d={`M${L.ax(tick)} ${L.barBottom}V${L.barBottom + 5}`}
									className="wt-axis"
								/>
								<text
									x={L.ax(tick)}
									y={L.barBottom + 18}
									textAnchor="middle"
									className="wt-small"
								>
									{`$${tick / 1000}k`}
								</text>
							</g>
						))}
						<g data-f="earned">
							<path
								d={`M${x0} ${bracketY + 6}V${bracketY}H${x1}V${bracketY + 6}`}
								className="wt-film-link"
								style={{
									strokeDasharray: "none",
									stroke: "var(--diagram-gain)",
								}}
							/>
							<text
								x={x0}
								y={bracketY - 8}
								className="wt-halo wt-gain wt-marker-label"
							>
								{t(copy.earned)}
							</text>
						</g>
						<text
							data-f="breakdown"
							x={narrow ? L.left : x0}
							y={bracketY - 8 - T.body * 1.6}
							className="wt-small wt-halo"
						>
							{t(narrow ? copy.breakdownShort : copy.breakdown)}
						</text>
						<text
							data-f="deposited"
							x={(x1 + L.ax(TUESDAY)) / 2}
							y={(L.barTop + L.barBottom) / 2 + 4}
							textAnchor="middle"
							className="wt-marker-label wt-halo"
						>
							{t(copy.deposited)}
						</text>
					</g>

					{/* Ben's short calls. */}
					<g data-f="ben">
						<text x={L.left} y={L.bTop - 12} className="wt-small">
							{t(copy.benAxis)}
						</text>
						{[0, -15_000, -30_000].map((tick) => (
							<g key={tick}>
								<path
									d={`M${L.left} ${L.by(tick)}H${L.right}`}
									className={tick === 0 ? "wt-axis" : "wt-grid"}
								/>
								<text
									x={L.left - 8}
									y={L.by(tick) + 4}
									textAnchor="end"
									className="wt-small"
								>
									{tick === 0 ? "$0" : `−$${-tick / 1000}k`}
								</text>
							</g>
						))}
						{[90, 100, 110, 120, 130, 140].map((tick) => (
							<text
								key={tick}
								x={L.bx(tick)}
								y={L.bBottom + 16}
								textAnchor={tick === 140 ? "end" : "middle"}
								className="wt-small"
							>
								{`$${tick}`}
							</text>
						))}
						<path
							data-f="premium"
							d={`M${L.bx(90)} ${L.by(RECEIVED / 100)}H${L.bx(140)}`}
							className="wt-line-reference"
						/>
						<text
							data-f="premium-label"
							x={L.bx(140) - 4}
							y={L.by(RECEIVED / 100) - 8}
							textAnchor="end"
							className="wt-small wt-halo"
						>
							{t(copy.received)}
						</text>
						<path
							data-f="expiry"
							d={`M${L.bx(90)} ${L.by(benAtExpiry(90) / 100)}L${L.bx(100)} ${L.by(benAtExpiry(100) / 100)}L${L.bx(140)} ${L.by(benAtExpiry(140) / 100)}`}
							className="wt-line-short"
						/>
						<circle
							data-f="mark-dot"
							cx={markX}
							cy={markY}
							r={6}
							className="wt-chip"
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
						<text
							data-f="mark-label"
							x={narrow ? L.left + 4 : markX - 10}
							y={markY + 20}
							textAnchor={narrow ? "start" : "end"}
							className="wt-halo wt-loss wt-marker-label"
						>
							{t(narrow ? copy.markedShort : copy.marked)}
						</text>
						<circle
							data-f="far-dot"
							cx={farX}
							cy={farY}
							r={6}
							className="wt-chip"
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
						<text
							data-f="far-label"
							x={narrow ? farX - 10 : farX + 10}
							y={narrow ? farY + 20 : farY - 8}
							textAnchor={narrow ? "end" : "start"}
							className="wt-halo wt-loss wt-marker-label"
						>
							{t(copy.far)}
						</text>
					</g>
				</g>
			</g>
			<g data-f="meter">
				<Word
					name="m-tag"
					x={L.right}
					y={L.headY + T.head * 1.25}
					size={T.small}
					anchor="end"
					className="wt-film-tag"
				>
					{t(copy.meter).toUpperCase()}
				</Word>
				<Word
					name="m-value"
					x={L.right}
					y={L.headY + T.head * 1.25 + T.num * 1.05}
					size={T.num}
					anchor="end"
					className="wt-film-num wt-film-accent"
				>
					{dollars(valueOpen)}
				</Word>
			</g>

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				<Word
					name="q-open"
					x={W / 2}
					y={H * 0.3}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.qOpen).toUpperCase()}
				</Word>
				<Word
					name="q-tue"
					x={W / 2}
					y={H * 0.3}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.qTue).toUpperCase()}
				</Word>
				<Word
					name="q-num"
					x={W / 2}
					y={H * 0.3 + fit(dollars(afterDeposit)) * 1.05}
					size={fit(dollars(afterDeposit))}
					className="wt-film-num"
				>
					{dollars(valueOpen)}
				</Word>
				<Word
					name="q-up"
					x={W / 2}
					y={H * 0.3 + fit(dollars(afterDeposit)) * 1.05 + T.head * 1.6}
					size={T.head}
					className="wt-film-num wt-film-gain"
				>
					{t(copy.qUp)}
				</Word>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.8}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("a-head", copy.mondayHead, copy.mondayHeadShort)}
			{headline("d-head", copy.depositHead, copy.depositHead)}
			{headline("e-head", copy.earnedHead, copy.earnedHeadShort)}
			<g data-f="bp">
				<Word
					name="bp-tag"
					x={W / 2}
					y={H * 0.3}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.bpTag).toUpperCase()}
				</Word>
				<Word
					name="bp-num"
					x={W / 2}
					y={H * 0.3 + fit(dollars(buyingPower)) * 1.05}
					size={fit(dollars(buyingPower))}
					className="wt-film-num"
				>
					{dollars(buyingPower)}
				</Word>
				<Lines
					name="bp-line"
					text={t(copy.bpLine)}
					x={W / 2}
					y={H * 0.72}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>

			{/* Sixteen contracts in two lots. */}
			<g data-f="lots">
				{Array.from({ length: HELD }, (_, i) => {
					const { x, y } = L.cell(i);
					return (
						<rect
							key={`sq-${x}-${y}`}
							data-f={`sq-${i}`}
							className="wt-film-bar"
							data-tone={i < lots[0].quantity ? "total" : "model"}
							x={x}
							y={y}
							width={L.square}
							height={L.square}
							rx={4}
						/>
					);
				})}
				{Array.from({ length: HELD }, (_, i) => {
					const { x, y } = L.cell(i);
					return (
						<rect
							key={`av-${x}-${y}`}
							data-f={`av-${i}`}
							className="wt-film-bar"
							data-tone="neutral"
							x={x}
							y={y}
							width={L.square}
							height={L.square}
							rx={4}
						/>
					);
				})}
				<g data-f="legend-lots">
					{lots.map((lot, l) => {
						const x = L.gridLeft + (l * L.gridWidth) / 2;
						const y = L.gridBottom + T.body * 2;
						return (
							<g key={lot.id}>
								<rect
									x={x}
									y={y - 10}
									width={12}
									height={12}
									rx={3}
									className="wt-film-bar"
									data-tone={l === 0 ? "total" : "model"}
								/>
								<text x={x + 18} y={y} className="wt-small">
									{`${narrow ? "" : `${lot.time} · `}${lot.quantity} @ ${price(lot.price)}`}
								</text>
							</g>
						);
					})}
				</g>
				<text
					data-f="legend-avg"
					x={L.gridLeft}
					y={L.gridBottom + T.body * 2}
					className="wt-small"
				>
					{t(copy.averageLegend)}
				</text>
				{(
					[
						["r", copy.realized, zeroed(0)],
						["u", copy.unrealized, signed(held.unrealized)],
					] as const
				).map(([key, tag, value], i) => (
					<g key={key}>
						<Word
							name={`${key}-tag`}
							x={W * L.pair[i]}
							y={H * (narrow ? 0.76 : 0.68)}
							size={T.small}
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`${key}-val`}
							x={W * L.pair[i]}
							y={H * (narrow ? 0.76 : 0.68) + T.num * 1.15}
							size={T.num}
							className="wt-film-num wt-film-accent"
						>
							{value}
						</Word>
					</g>
				))}
			</g>
			{headline("l-head", copy.lotsHead, copy.lotsHeadShort)}
			{headline("f-head", copy.fifoHead, copy.fifoHeadShort)}
			{headline("v-head", copy.averageHead, copy.averageHeadShort)}
			<g data-f="total">
				<Word
					name="t-tag"
					x={W / 2}
					y={H * 0.3}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.totalTag).toUpperCase()}
				</Word>
				<Word
					name="t-num"
					x={W / 2}
					y={H * 0.3 + T.big * 1.05}
					size={T.big}
					className="wt-film-num wt-film-gain"
				>
					{signed(fifo.realized + fifo.unrealized)}
				</Word>
				<Lines
					name="t-line"
					text={t(copy.totalLine)}
					x={W / 2}
					y={H * 0.72}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("b-head", copy.benHead, copy.benHeadShort)}
			{headline("x-head", copy.expiryHead, copy.expiryHeadShort)}
			<g data-f="claim">
				<Lines
					name="z-big"
					text={t(copy.claimBig)}
					x={W / 2}
					y={H * 0.44}
					size={T.title}
					maxWidth={room}
				/>
				<Lines
					name="z-sub"
					text={t(copy.claimSub)}
					x={W / 2}
					y={
						H * 0.44 +
						T.title * 1.15 +
						(lineCount(t(copy.claimBig), room, T.title) - 1) * T.title * 1.35
					}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			<EndCard
				frame={L}
				locale={locale}
				next={t(copy.nextBig)}
				why={t(copy.nextSub)}
			/>
		</>
	);
}

function build(context: FilmContext) {
	const { width: W } = context;
	const L = layout(W);
	const d = createDirector(context, L, END);
	const { tl, one, kids, show, hide, pop, slam, rise, sink } = d;
	const flat = (name: string) =>
		kids(name).flatMap((el) => (el.tagName === "g" ? [...el.children] : [el]));
	const meter = one<SVGTextElement>("m-value");
	const realized = one<SVGTextElement>("r-val");
	const unrealized = one<SVGTextElement>("u-val");
	const squares = Array.from({ length: HELD }, (_, i) => one(`sq-${i}`));
	const averaged = Array.from({ length: HELD }, (_, i) => one(`av-${i}`));
	/** A segment of the account bar grows rightward from where it starts. */
	const grow = (name: string, at: number, duration = 0.5) => {
		const el = one(name);
		const width = Number(el.getAttribute("width"));
		tl.fromTo(
			el,
			{ opacity: 1, attr: { width: 0 } },
			{ attr: { width }, duration, ease: "power2.out" },
			at,
		);
	};
	const draw = (path: SVGPathElement, at: number, duration: number) => {
		const length = path.getTotalLength();
		tl.fromTo(
			path,
			{ opacity: 0, strokeDasharray: length, strokeDashoffset: length },
			{ opacity: 1, strokeDashoffset: 0, duration, ease: "power2.inOut" },
			at,
		);
	};

	d.hidden([
		one("ben"),
		...segments.map(({ name }) => one(name)),
		one("earned"),
		one("breakdown"),
		one("deposited"),
		one("premium"),
		one("premium-label"),
		one("expiry"),
		one("mark-dot"),
		one("mark-label"),
		one("far-dot"),
		one("far-label"),
		...kids("meter"),
		...flat("q"),
		...[
			"a-head",
			"d-head",
			"e-head",
			"l-head",
			"f-head",
			"v-head",
			"b-head",
			"x-head",
		].map((name) => one(name)),
		...flat("bp"),
		...squares,
		...averaged,
		one("legend-lots"),
		one("legend-avg"),
		one("r-tag"),
		one("u-tag"),
		realized,
		unrealized,
		...flat("total"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: the account rose; how much was earned? ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-open"), 4.6);
	slam(one("q-num"), 4.8);
	d.swap(one("q-open"), one("q-tue"), 5.9);
	d.count(
		one<SVGTextElement>("q-num"),
		afterDeposit,
		6.0,
		dollars,
		valueOpen,
		1.0,
	);
	show(one("q-up"), 7.1);
	show(one("q-line"), 7.7);

	// ——— account: what moved it ———
	tl.addLabel("account", 10);
	hide(flat("q"), 10.0);
	show(one("a-head"), 10.2, "above");
	rise(10.3);
	show(kids("meter"), 10.8, "above");
	d.count(meter, valueOpen, 10.8, dollars, valueOpen, 0.01);
	grow("seg-base", 10.8);
	grow("seg-stock", 11.5, 0.4);
	grow("seg-calls", 11.9, 0.5);
	tl.to(one("seg-fees"), { opacity: 1, duration: 0.3 }, 12.4);
	d.count(meter, valueClose, 11.5, dollars, valueOpen, 1.2);
	show(one("earned"), 13.0);
	show(one("breakdown"), 13.3);
	// Tuesday: money in, not money made.
	d.swap(one("a-head"), one("d-head"), 14.6);
	grow("seg-deposit", 15.0, 1.0);
	d.count(meter, afterDeposit, 15.0, dollars, valueClose, 1.0);
	show(one("deposited"), 15.8);
	d.swap(one("d-head"), one("e-head"), 16.6);
	// Cut: buying power.
	hide([one("e-head"), ...kids("meter")], 18.4);
	sink(18.4);
	show(one("bp-tag"), 18.8);
	slam(one("bp-num"), 19.0);
	show(one("bp-line"), 19.8);

	// ——— calls: realized and unrealized ———
	tl.addLabel("calls", 22);
	hide(flat("bp"), 22.0);
	show(one("l-head"), 22.2, "above");
	squares.forEach((square, i) => {
		pop(square, 22.6 + i * 0.04, 0.4);
	});
	show(one("legend-lots"), 23.4);
	show([one("r-tag"), one("u-tag")], 23.8);
	show([realized, unrealized], 24.0);
	// Sell six, oldest first.
	d.swap(one("l-head"), one("f-head"), 25.2);
	tl.to(squares.slice(0, SOLD), { opacity: 0.2, duration: 0.4 }, 25.6);
	d.count(realized, fifo.realized, 25.8, zeroed, 0, 0.8);
	d.count(unrealized, fifo.unrealized, 25.8, signed, held.unrealized, 0.8);
	// The same sale at average cost.
	d.swap(one("f-head"), one("v-head"), 27.6);
	tl.to(averaged.slice(0, SOLD), { opacity: 0.2, duration: 0.4 }, 28.0);
	tl.to(averaged.slice(SOLD), { opacity: 1, duration: 0.4 }, 28.0);
	d.swap(one("legend-lots"), one("legend-avg"), 28.0);
	d.count(realized, average.realized, 28.2, signed, fifo.realized, 0.8);
	d.count(unrealized, average.unrealized, 28.2, signed, fifo.unrealized, 0.8);
	// Cut: the total.
	hide(
		[
			one("v-head"),
			...squares,
			...averaged,
			one("legend-avg"),
			one("r-tag"),
			one("u-tag"),
			realized,
			unrealized,
		],
		29.8,
	);
	show(one("t-tag"), 30.2);
	slam(one("t-num"), 30.4);
	show(one("t-line"), 31.2);

	// ——— short: the other side of the same calls ———
	tl.addLabel("short", 33.5);
	hide(flat("total"), 33.5);
	tl.set(one("acct"), { opacity: 0 }, 33.6);
	tl.set(one("ben"), { opacity: 1 }, 33.6);
	show(one("b-head"), 33.7, "above");
	rise(33.8);
	tl.to(one("premium"), { opacity: 1, duration: 0.5 }, 34.4);
	show(one("premium-label"), 34.8);
	pop(one("mark-dot"), 35.8);
	show(one("mark-label"), 36.0);
	d.swap(one("b-head"), one("x-head"), 37.2);
	draw(one<SVGPathElement>("expiry"), 37.6, 1.4);
	pop(one("far-dot"), 39.2);
	show(one("far-label"), 39.4);
	// Cut: the claim.
	hide(one("x-head"), 40.8);
	sink(40.8);
	tl.fromTo(
		one("z-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
		41.2,
	);
	show(one("z-sub"), 41.7);

	// ——— next ———
	tl.addLabel("next", 44.5);
	hide(kids("claim"), 44.5);
	d.close(44.5);
	return tl;
}

export const portfolioPnlFilm: Film = {
	id: "portfolio-pnl",
	label: [
		`P&L, as a short film: your account rising from ${dollars(valueOpen)} at Monday's open to ${dollars(afterDeposit)} on Tuesday; ALFA ${signed(stockClose - stockOpen)}, the calls ${signed(callsClose - PAID * 100)} and fees ${signed(-buyFees)} making ${signed(PNL)} earned, and a ${dollars(yourAccount.deposit)} deposit that is not profit; buying power of ${dollars(buyingPower)}, half of it credit; ${HELD} calls in two lots, ${signed(held.unrealized)} unrealized until ${SOLD} are sold at the bid, split ${signed(fifo.realized)} and ${signed(fifo.unrealized)} first in, first out or ${signed(average.realized)} and ${signed(average.unrealized)} at average cost, ${signed(fifo.realized + fifo.unrealized)} either way; and Ben's ${BEN} short calls, ${dollars(RECEIVED)} received and ${signed(benAtExpiry(120))} if ALFA settles at $120`,
		`盈亏短片：你的账户从周一开盘的 ${dollars(valueOpen)} 升到周二的 ${dollars(afterDeposit)}；ALFA ${signed(stockClose - stockOpen)}、看涨 ${signed(callsClose - PAID * 100)}、费用 ${signed(-buyFees)}，合计赚了 ${signed(PNL)}，而 ${dollars(yourAccount.deposit)} 的存入不是利润；购买力 ${dollars(buyingPower)}，一半是授信；${HELD} 张看涨分两批，卖出 ${SOLD} 张之前都是未实现的 ${signed(held.unrealized)}，按买价卖出后先进先出分为 ${signed(fifo.realized)} 和 ${signed(fifo.unrealized)}，平均成本分为 ${signed(average.realized)} 和 ${signed(average.unrealized)}，合计都是 ${signed(fifo.realized + fifo.unrealized)}；以及 Ben 的 ${BEN} 张看涨空头：收到 ${dollars(RECEIVED)}，若 ALFA 结算于 $120 则为 ${signed(benAtExpiry(120))}`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["P&L", "盈亏"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "account", label: ["The account", "账户"] },
		{ id: "calls", label: ["Realized", "已实现"] },
		{ id: "short", label: ["A short call", "卖出看涨"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
