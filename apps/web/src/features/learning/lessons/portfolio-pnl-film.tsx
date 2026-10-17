import { type Copy, pick, yourAccount } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import type { Film, FilmContext } from "../walkthrough/film";
import {
	Backdrop,
	Brackets,
	createDirector,
	EndCard,
	filmFrame,
	Lines,
	lineCount,
	signTone,
	TitleCard,
	toneClass,
	toneColor,
	Word,
} from "../walkthrough/film-kit";
import { textWidth } from "../walkthrough/text-measure";
import {
	afterDeposit,
	BEN,
	benAtExpiry,
	benMarked,
	buyFees,
	CLOSE_SPOT,
	callsClose,
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
 * calls +$1,050, fees −$10.40, so +$1,199.60 earned, bracketed as the answer; then a
 * $5,000 deposit that lifts the value without being profit, and buying power, larger
 * still. Then the calls' +$1,050 as sixteen contracts in two lots, and a question: sold
 * at the bid, is it still +$1,050? Six sold oldest first leave +$330 realized and +$645
 * unrealized, and the two become +$975: the bid, not the mid. Last, Ben's ten short
 * calls: $4,100 received, and no floor.
 *
 *   open      0–4        "P&L"
 *   question  4–10.4     $29,960 → $36,159.60: how much did you earn?
 *   account   10.4–19.0  +$160, +$1,050, −$10.40: +$1,199.60 earned; +$5,000 deposited;
 *                        buying power at 2 × cash, including 50% credit
 *   calls     19.0–33.7  16 contracts, +$1,050 unrealized; sell 6, oldest first; +$330
 *                        and +$645 become +$975, locked; then the $75, drawn: bid to mid
 *   short     33.7–45.8  Ben: +$4,100 received, −$675 marked, −$15,900 at $120;
 *                        cut: "P&L is what your positions earned."
 *   next      45.8–47.4  Next: performance
 */

const END = 47.4;
const ACCOUNT = [29_000, 37_000] as const;
const BEN_X = [90, 140] as const;
const BEN_Y = [-20_000, 6_000] as const;
/** Where the expiry line leaves the chart's floor: past it, the loss goes on. */
const OFF_FLOOR = 100 + (RECEIVED / 100 - BEN_Y[0]) / (BEN * 100);
const fifo = split(SOLD, "fifo");
/** What selling at the bid, not the mid, takes off: six contracts × $0.125 × 100. */
const GAP = SOLD * (MARK - SALE) * 100;
const FIFO_EQ = `${SOLD} × (${price(SALE)} − ${price(lots[0].price)}) × 100 =`;
const held = split(0, "fifo");
const GAP_PROOF = `${signed(held.unrealized)} − ${dollars(GAP)} = ${signed(fifo.realized + fifo.unrealized)}`;
/** The surviving cells and their marked P&L, using the same FIFO lots as the model. */
const remainingLots = lots
	.map((lot, i) => {
		const first = lots
			.slice(0, i)
			.reduce((sum, prior) => sum + prior.quantity, 0);
		const sold = Math.max(0, Math.min(lot.quantity, SOLD - first));
		const quantity = lot.quantity - sold;
		return {
			first: first + sold,
			quantity,
			price: lot.price,
			pnl: quantity * (MARK - lot.price) * 100,
			tone: i === 0 ? "total" : "neutral",
		};
	})
	.filter((lot) => lot.quantity > 0);
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
	// On a phone the Ben chart's "−$30k" needs room left of the axis.
	const left = Math.max(margin, narrow ? 60 : 0);
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
	qOpen: [
		`Monday open ${dollars(valueOpen)} → Tuesday`,
		`周一开盘 ${dollars(valueOpen)} → 周二`,
	],
	qUp: [
		`up ${signed(afterDeposit - valueOpen)}`,
		`增加 ${signed(afterDeposit - valueOpen)}`,
	],
	qLine: ["How much of that did you earn?", "其中有多少是你赚的？"],
	mondayHead: [
		"Monday: ALFA up, calls up, fees paid.",
		"周一：ALFA 上涨，看涨上涨，付了费用。",
	],
	mondayHeadShort: ["Monday: ALFA, calls, fees.", "周一：ALFA、看涨、费用。"],
	earnedHead: ["A deposit isn't earned.", "存入不是赚到的。"],
	meter: ["account", "账户"],
	earned: ["earned", "赚到"],
	deposited: [
		`+${dollars(yourAccount.deposit)} deposited`,
		`存入 +${dollars(yourAccount.deposit)}`,
	],
	bpTag: ["buying power", "购买力"],
	lotsHead: [
		`Sell ${SOLD} at the bid: still ${signed(held.unrealized)}?`,
		`以买价卖出 ${SOLD} 张：还是 ${signed(held.unrealized)} 吗？`,
	],
	lotsHeadShort: [
		`Sell ${SOLD} at the bid: ${signed(held.unrealized)}?`,
		`按买价卖 ${SOLD} 张：${signed(held.unrealized)}？`,
	],
	realized: ["realized", "已实现"],
	unrealized: ["unrealized", "未实现"],
	totalTag: ["realized + unrealized", "已实现 + 未实现"],
	totalHead: [
		`No: calls’ price P&L ${signed(fifo.realized + fifo.unrealized)} before fees.`,
		`不：看涨价格盈亏 ${signed(fifo.realized + fifo.unrealized)}，未扣费。`,
	],
	/** Where the $75 comes from: six sold at the bid, not the mid. */
	fifo: ["FIFO: sell the oldest 6", "先进先出：卖出最早的 6 张"],
	saleInput: [`sale: bid ${price(SALE)}`, `卖出：买价 ${price(SALE)}`],
	markInput: [`mark: mid ${price(MARK)}`, `估值：中间价 ${price(MARK)}`],
	heldFormula: [
		"P&L = contracts × (mid − cost per share) × 100 shares",
		"盈亏 = 张数 × (中间价 − 每股成本) × 100 股",
	],
	bid: ["bid", "买价"],
	mid: ["mid", "中间价"],
	bpNote: ["includes 50% credit", "含 50% 授信"],
	benHead: [
		`Ben wrote ${BEN} of these calls.`,
		`Ben 卖出了 ${BEN} 张同样的看涨。`,
	],
	benHeadShort: [`Ben wrote ${BEN} calls.`, `Ben 卖出 ${BEN} 张。`],
	expiryHead: [
		"At expiry, his loss has no floor.",
		"到期时，他的亏损没有下限。",
	],
	expiryHeadShort: ["At expiry: no floor.", "到期：亏损无下限。"],
	benAxis: [
		`Ben · short ${BEN} Oct 18 100 calls`,
		`Ben · 空头 ${BEN} 张 10月18日 100 看涨`,
	],
	priceAxis: ["ALFA price", "ALFA 价格"],
	received: [`received ${signed(RECEIVED)}`, `收到 ${signed(RECEIVED)}`],
	benMark: [
		`15:59 mark ${signed(benMarked)}`,
		`15:59 估值 ${signed(benMarked)}`,
	],
	far: [
		`$120: ${signed(benAtExpiry(120))}`,
		`$120：${signed(benAtExpiry(120))}`,
	],
	claimBig: ["P&L is what your positions earned.", "盈亏是持仓赚到的。"],
	claimSub: ["Deposits and buying power excluded.", "不计存入和购买力。"],
	nextBig: ["Next: performance", "下一课：绩效"],
	nextSub: ["returns, win rate and drawdown", "收益、胜率与回撤"],
} as const satisfies Record<string, Copy>;

/** The account bar's pieces, left to right, in dollars. */
const segments = [
	{ name: "seg-base", from: ACCOUNT[0], to: EARNED_FROM, tone: "neutral" },
	{ name: "seg-stock", from: EARNED_FROM, to: STOCK_TO, tone: "gain" },
	{ name: "seg-calls", from: STOCK_TO, to: CALLS_TO, tone: "gain" },
	{ name: "seg-fees", from: CLOSE_TO, to: CALLS_TO, tone: "loss" },
	{ name: "seg-deposit", from: CLOSE_TO, to: TUESDAY, tone: "neutral" },
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
	const breakdownRows = [
		`ALFA ${signed(stockClose - stockOpen)}`,
		`${t(["calls", "看涨"])} ${signed(callsClose - PAID * 100)}`,
		`${t(["fees", "费用"])} ${signed(-buyFees)}`,
	];
	// A tight outline per grid row links each surviving lot without crossing adjacent cells.
	const remainingBraces = remainingLots.flatMap((lot, lotIndex) => {
		const rows = new Map<number, { left: number; right: number }>();
		for (let i = lot.first; i < lot.first + lot.quantity; i++) {
			const cell = L.cell(i);
			const row = rows.get(cell.y);
			rows.set(cell.y, {
				left: row?.left ?? cell.x,
				right: cell.x + L.square,
			});
		}
		return [...rows].map(([y, row], rowIndex) => ({
			name: `held-brace-${lotIndex}-${rowIndex}`,
			d: `M${row.left - 1} ${y - 1}H${row.right + 1}V${y + L.square + 1}H${row.left - 1}Z`,
			tone: lot.tone,
		}));
	});
	// The two calculations use the same footer sequentially, never as an overlay.
	const fifoY = H * 0.9;
	const fifoWidth = textWidth(FIFO_EQ, T.body);
	const fifoX =
		W / 2 - (fifoWidth + 8 + textWidth(signed(fifo.realized), T.body)) / 2;
	// The drawn gap, under the mid line.
	const gapText = T.body;
	const gapHalf = narrow
		? Math.min(
				room * 0.14,
				W / 2 -
					22 -
					Math.max(
						textWidth(`${t(copy.bid)} ${price(SALE)}`, gapText),
						textWidth(`${t(copy.mid)} ${price(MARK)}`, gapText),
					),
			)
		: room * 0.08;
	// The operand row stays through the lock; leave room for the drawn gap below it.
	const operandY = H * 0.3 + T.big * 1.05 + T.num * 1.8 + T.body * 0.6;
	const gapY = narrow ? H * 0.66 : operandY + T.body * 4.4;
	const eqX = W / 2 - textWidth(GAP_PROOF, gapText) / 2;
	/** Separate operands use the second amount's sign for addition. */
	const operandGap = T.num * 0.85;
	/** Buying power has its own slot, below the account's settled value. */
	const bpY = H * 0.4;
	const x1 = L.ax(CLOSE_TO);
	const bracketY = L.barTop - 10;
	const markX = L.bx(CLOSE_SPOT / 100);
	const markY = L.by(benMarked / 100);
	const farX = L.bx(120);
	const farY = L.by(benAtExpiry(120) / 100);
	const offX = L.bx(OFF_FLOOR);
	const offY = L.by(BEN_Y[0]);
	const arrow = (() => {
		const dx = offX - L.bx(100);
		const dy = offY - L.by(benAtExpiry(100) / 100);
		const length = Math.hypot(dx, dy);
		return { dx: dx / length, dy: dy / length };
	})();
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
								y={name === "seg-fees" ? L.barTop - 6 : L.barTop}
								width={name === "seg-fees" ? 3 : L.ax(to) - L.ax(from)}
								height={L.barBottom - L.barTop + (name === "seg-fees" ? 6 : 0)}
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
								data-f="earned-num"
								x={x0}
								y={bracketY - 8}
								className="wt-halo wt-gain wt-marker-label"
							>
								{signed(PNL)}
							</text>
						</g>
						{breakdownRows.map((row, i) => (
							<text
								key={row}
								data-f={`breakdown-${["stock", "calls", "fees"][i]}`}
								x={
									narrow
										? L.margin
										: x0 +
											textWidth(breakdownRows.slice(0, i).join(" · "), T.body) +
											(i === 0 ? 0 : textWidth(" · ", T.body))
								}
								y={L.barBottom + 18 + T.body * (1.6 + (narrow ? i * 1.5 : 0))}
								className="wt-film-num wt-halo wt-film-dim"
								style={{ fontSize: T.body }}
							>
								{row.slice(0, row.lastIndexOf(" ") + 1)}
								<tspan
									data-f={`breakdown-${["stock", "calls", "fees"][i]}-value`}
									className={i === 2 ? toneClass.down : toneClass.up}
								>
									{row.slice(row.lastIndexOf(" ") + 1)}
								</tspan>
							</text>
						))}
						<text
							data-f="deposited"
							x={(x1 + L.ax(TUESDAY)) / 2}
							y={(L.barTop + L.barBottom) / 2 + 4}
							textAnchor="middle"
							className={`wt-marker-label wt-halo wt-film-dim ${toneClass.up}`}
						>
							{t(copy.deposited)}
						</text>
					</g>
				</g>
			</g>
			{/* Ben's chart scaffold appears before its line and point data. */}
			<g data-f="ben-scaffold">
				<text x={L.left} y={L.bTop - 12} className="wt-small">
					{t(copy.benAxis)}
				</text>
				{[0, -10_000, -20_000].map((tick) => (
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
			</g>
			{/* Ben's short-call data. */}
			<g data-f="ben">
				<path
					data-f="premium"
					d={`M${L.bx(90)} ${L.by(RECEIVED / 100)}H${L.bx(140)}`}
					className="wt-line-reference"
					style={{ stroke: toneColor("up"), strokeDasharray: "none" }}
				/>
				<text
					data-f="premium-label"
					x={L.bx(140) - 4}
					y={L.by(RECEIVED / 100) - 8}
					textAnchor="end"
					className={`wt-small wt-halo ${toneClass.up}`}
				>
					{t(copy.received)}
				</text>
				<path
					data-f="expiry"
					strokeDasharray="5 4"
					d={`M${L.bx(90)} ${L.by(benAtExpiry(90) / 100)}L${L.bx(100)} ${L.by(benAtExpiry(100) / 100)}L${offX} ${offY}`}
					className="wt-line-position"
					style={{ stroke: "var(--tone-ink)", strokeWidth: 2.5 }}
				/>
				<path
					data-f="expiry-arrow"
					d={`M${offX - arrow.dx * 9 - arrow.dy * 6} ${offY - arrow.dy * 9 + arrow.dx * 6}L${offX} ${offY}L${offX - arrow.dx * 9 + arrow.dy * 6} ${offY - arrow.dy * 9 - arrow.dx * 6}`}
					className="wt-line-position"
					style={{ stroke: "var(--tone-ink)", strokeWidth: 2.5 }}
				/>
				<circle
					data-f="mark-dot"
					cx={markX}
					cy={markY}
					r={6}
					className="wt-chip"
					style={{ fill: "var(--diagram-loss)" }}
					stroke="var(--foreground)"
					strokeWidth={1.5}
				/>
				<text
					data-f="mark-label"
					x={narrow ? Math.max(markX + 24, L.bx(110) + 12) : markX - 10}
					y={markY + 20}
					textAnchor={narrow ? "start" : "end"}
					className="wt-halo wt-loss wt-marker-label"
				>
					{t(copy.benMark)}
				</text>
				<circle
					data-f="far-dot"
					cx={farX}
					cy={farY}
					r={6}
					className="wt-chip"
					style={{ fill: toneColor("down") }}
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
			<g data-f="bp">
				<Word
					name="m-tag-bp"
					x={L.right}
					y={bpY}
					size={T.small}
					anchor="end"
					className="wt-film-tag"
				>
					{t(copy.bpTag).toUpperCase()}
				</Word>
				<Word
					name="m-bp"
					x={L.right}
					y={bpY + T.num * 1.05}
					size={T.num}
					anchor="end"
					className="wt-film-num wt-film-accent"
				>
					{t(["2 × cash", "现金 × 2"])}
				</Word>
				<Word
					name="m-bp-note"
					x={L.right}
					y={bpY + T.num * 1.05 + T.body * 1.9}
					size={T.body}
					anchor="end"
					className="wt-film-num"
				>
					{t(copy.bpNote)}
				</Word>
			</g>
			<g data-f="answer">
				<Word
					name="earned-tag"
					x={L.margin}
					y={L.headY + T.head * 1.25}
					size={T.small}
					anchor="start"
					className="wt-film-tag"
				>
					{t(copy.earned).toUpperCase()}
				</Word>
				<Word
					name="earned-big"
					x={L.margin}
					y={L.headY + T.head * 1.25 + T.num * 1.3 * 1.05}
					size={T.num * 1.3}
					anchor="start"
					className="wt-film-num wt-film-gain"
				>
					{signed(PNL)}
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
					size={T.head}
					maxWidth={room}
					className="wt-film-type"
				/>
			</g>
			{headline("a-head", copy.mondayHead, copy.mondayHeadShort)}
			{headline("e-head", copy.earnedHead, copy.earnedHead)}
			{/* Sixteen contracts in two lots. */}
			<g data-f="lots">
				<Word
					name="fifo-eq"
					x={fifoX}
					y={fifoY}
					size={T.body}
					anchor="start"
					className="wt-film-num"
				>
					{FIFO_EQ}
				</Word>
				<Word
					name="fifo-result"
					x={fifoX + fifoWidth + 8}
					y={fifoY}
					size={T.body}
					anchor="start"
					className="wt-film-num wt-film-gain"
				>
					{signed(fifo.realized)}
				</Word>
				{remainingBraces.map((brace) => (
					<path
						key={brace.name}
						data-f={brace.name}
						d={brace.d}
						className="wt-film-link"
						style={{
							strokeDasharray: "none",
							stroke:
								brace.tone === "total"
									? "var(--diagram-accent)"
									: "color-mix(in oklab, var(--muted-foreground) 55%, transparent)",
						}}
					/>
				))}
				<g data-f="held-proof">
					{/* The formula is the phone's: on the wide frame the rows say it themselves, and
					    the line would sit where the realized and unrealized totals land. */}
					<g
						data-f="held-formula-wrap"
						style={narrow ? undefined : { display: "none" }}
					>
						<Lines
							name="held-formula"
							text={t(copy.heldFormula)}
							x={W / 2}
							y={H * 0.7}
							size={T.body}
							maxWidth={room}
							className="wt-film-num"
						/>
					</g>
					{remainingLots.map((lot, i) => {
						// One shared formula explains these compact quantity, cost and result rows.
						const lotLabel = t([
							`${lot.quantity} contracts · ${price(lot.price)}/share`,
							`${lot.quantity} 张看涨 · 每股 ${price(lot.price)}`,
						]);
						const contribution = signed(lot.pnl);
						const labelWidth = textWidth(lotLabel, T.body);
						const rowWidth =
							20 + labelWidth + 8 + textWidth(contribution, T.body);
						const x = (W - rowWidth) / 2;
						const y = fifoY + (i - 1) * T.body * 1.5;
						return (
							<g key={lot.first} data-f={`held-row-${i}`}>
								<rect
									x={x}
									y={y - 10}
									width={10}
									height={10}
									rx={2}
									className="wt-film-bar"
									data-tone={lot.tone}
								/>
								<Word
									name={`held-lot-${i}`}
									x={x + 20}
									y={y}
									size={T.body}
									anchor="start"
									className="wt-film-num"
								>
									{lotLabel}
								</Word>
								<Word
									name={`held-contribution-${i}`}
									x={x + 20 + labelWidth + 8}
									y={y}
									size={T.body}
									anchor="start"
									className="wt-film-num wt-film-gain"
								>
									{contribution}
								</Word>
							</g>
						);
					})}
					<Word
						name="held-sum"
						x={W / 2}
						y={fifoY + T.body * 1.5}
						size={T.body}
						className="wt-film-num"
					>
						{`${remainingLots.map((lot) => dollars(lot.pnl)).join(" + ")} = `}
						<tspan className={toneClass.up}>{signed(fifo.unrealized)}</tspan>
					</Word>
				</g>
				{Array.from({ length: HELD }, (_, i) => {
					const { x, y } = L.cell(i);
					return (
						<rect
							key={`sq-${x}-${y}`}
							data-f={`sq-${i}`}
							className="wt-film-bar"
							data-tone={i < lots[0].quantity ? "total" : "neutral"}
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
									data-tone={l === 0 ? "total" : "neutral"}
								/>
								<text x={x + 18} y={y} className="wt-small">
									{`${narrow ? "" : `${lot.time} · `}${lot.quantity} @ ${price(lot.price)}`}
								</text>
							</g>
						);
					})}
				</g>
				{/* Read the rule before the oldest contracts leave. */}
				<text
					data-f="fifo-tag"
					x={L.gridLeft}
					y={L.gridBottom + T.body * 2 + T.small * 2.4}
					className="wt-film-type wt-film-accent"
					style={{ fontSize: T.body }}
				>
					{t(copy.fifo)}
				</text>
				{([copy.saleInput, copy.markInput] as const).map((input, i) => (
					<Lines
						key={i === 0 ? "sale-input" : "mark-input"}
						name={i === 0 ? "sale-input" : "mark-input"}
						text={t(input)}
						x={L.gridLeft + i * L.gridWidth}
						y={L.gridBottom + T.body * 4.2 + T.small * 2.4}
						size={T.body}
						maxWidth={L.gridWidth / 2 - 12}
						anchor={i === 0 ? "start" : "end"}
						className="wt-film-type wt-film-dim"
					/>
				))}
				{(
					[
						["r", copy.realized, signed(fifo.realized)],
						["u", copy.unrealized, signed(fifo.unrealized)],
					] as const
				).map(([key, tag, settled], i) => (
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
							className="wt-film-num wt-film-gain"
						>
							{settled}
						</Word>
					</g>
				))}
				<Word
					name="initial-unrealized"
					x={W * L.pair[1]}
					y={H * (narrow ? 0.76 : 0.68) + T.num * 1.15}
					size={T.num}
					className="wt-film-num wt-film-gain"
				>
					{signed(held.unrealized)}
				</Word>
			</g>
			{headline("l-head", copy.lotsHead, copy.lotsHeadShort)}
			<Lines
				name="t-head"
				text={t(copy.totalHead)}
				x={L.margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.lotsHeadShort : copy.lotsHead),
						room,
						T.head,
					) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
			<Brackets name="lock-total" glow />
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
					name="t-subtotal"
					x={W / 2 - operandGap}
					y={operandY}
					size={T.num}
					anchor="end"
					className="wt-film-num wt-film-gain"
				>
					{signed(fifo.realized)}
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
				<Word
					name="t-part"
					x={W / 2 + operandGap}
					y={operandY}
					size={T.num}
					anchor="start"
					className="wt-film-num wt-film-gain"
				>
					{signed(fifo.unrealized)}
				</Word>
			</g>
			{/* The $75, drawn: the bid and the mid as the two ends of a gap, then what six
			    contracts of it come to. */}
			<g data-f="gapdraw">
				<path
					data-f="gap-rule"
					d={`M${W / 2 - gapHalf} ${gapY - 6}V${gapY + 6}M${W / 2 - gapHalf} ${gapY}H${W / 2 + gapHalf}M${W / 2 + gapHalf} ${gapY - 6}V${gapY + 6}`}
					className="wt-film-gap"
				/>
				<text
					data-f="gap-bid"
					x={W / 2 - gapHalf - 10}
					y={gapY + gapText * 0.36}
					textAnchor="end"
					className="wt-film-num wt-film-dim"
					style={{ fontSize: gapText }}
				>
					{`${t(copy.bid)} ${price(SALE)}`}
				</text>
				<text
					data-f="gap-mid"
					x={W / 2 + gapHalf + 10}
					y={gapY + gapText * 0.36}
					className="wt-film-num wt-film-dim"
					style={{ fontSize: gapText }}
				>
					{`${t(copy.mid)} ${price(MARK)}`}
				</text>
				<text
					data-f="gap-eq"
					x={eqX}
					y={gapY + gapText * 2.6}
					className="wt-film-num"
					style={{ fontSize: gapText }}
				>
					{`${signed(held.unrealized)} − ${dollars(GAP)} = `}
					<tspan className={toneClass.up}>
						{signed(fifo.realized + fifo.unrealized)}
					</tspan>
				</text>
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
	const { tl, one, kids, show, hide, rise, sink } = d;
	/** A figure lands slightly large and settles, without overshoot: it is data. */
	const land = (target: Element, time: number, duration = 0.55) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.12, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration, ease: "power3.out" },
			time,
		);
	const flat = (name: string) =>
		kids(name).flatMap((el) => (el.tagName === "g" ? [...el.children] : [el]));
	const meter = one<SVGTextElement>("m-value");
	const realized = one<SVGTextElement>("r-val");
	const unrealized = one<SVGTextElement>("u-val");
	const initialUnrealized = one<SVGTextElement>("initial-unrealized");
	const squares = Array.from({ length: HELD }, (_, i) => one(`sq-${i}`));
	const heldBraces = kids("lots").filter((el) =>
		el.getAttribute("data-f")?.startsWith("held-brace-"),
	);
	const accountProgress = { stock: 0, calls: 0, fees: 0, deposit: 0 };
	const stockSegment = one("seg-stock");
	const callsSegment = one("seg-calls");
	const feesSegment = one("seg-fees");
	const depositSegment = one("seg-deposit");
	const stockCaption = one<SVGTSpanElement>("breakdown-stock-value");
	const callsCaption = one<SVGTSpanElement>("breakdown-calls-value");
	const feesCaption = one<SVGTSpanElement>("breakdown-fees-value");
	const depositCaption = one<SVGTextElement>("deposited");
	// Round each contribution once: captions, boundaries and the account sum all use those cents.
	const renderAccount = () => {
		const stock = Math.round((stockClose - stockOpen) * accountProgress.stock);
		const calls = Math.round((callsClose - PAID * 100) * accountProgress.calls);
		const fees = Math.round(buyFees * accountProgress.fees);
		const deposit = Math.round(yourAccount.deposit * accountProgress.deposit);
		stockSegment.setAttribute(
			"width",
			String(L.ax(EARNED_FROM + stock / 100) - L.ax(EARNED_FROM)),
		);
		callsSegment.setAttribute(
			"width",
			String(L.ax(STOCK_TO + (calls - fees) / 100) - L.ax(STOCK_TO)),
		);
		// Fees retract the green boundary; the red hairline makes the small deduction visible.
		feesSegment.setAttribute(
			"x",
			String(L.ax(STOCK_TO + (calls - fees) / 100) - 3),
		);
		feesSegment.style.opacity = String(accountProgress.fees);
		depositSegment.setAttribute(
			"width",
			String(L.ax(CLOSE_TO + deposit / 100) - L.ax(CLOSE_TO)),
		);
		meter.textContent = dollars(valueOpen + stock + calls - fees + deposit);
		stockCaption.textContent = zeroed(stock);
		callsCaption.textContent = zeroed(calls);
		feesCaption.textContent = zeroed(-fees);
		depositCaption.textContent = d.t([
			`${zeroed(deposit)} deposited`,
			`存入 ${zeroed(deposit)}`,
		]);
		for (const [caption, amount] of [
			[stockCaption, stock],
			[callsCaption, calls],
			[feesCaption, -fees],
			[depositCaption, deposit],
		] as const) {
			caption.classList.remove(toneClass.up, toneClass.down);
			const tone = signTone(amount);
			if (tone) caption.classList.add(toneClass[tone]);
		}
	};
	renderAccount();
	// Exact contribution cuts preserve the former settlement times and every quiet interval.
	// Each cut updates the segment, its caption and the account sum together, in either seek direction.
	const settleContribution = (
		part: keyof typeof accountProgress,
		at: number,
	) => {
		if (part === "fees") {
			// Fees change a boundary already grown by the calls tween. Track its settled
			// pre-fee attributes too, so seeking back across this step restores them.
			tl.set(
				callsSegment,
				{ attr: { width: L.ax(CALLS_TO) - L.ax(STOCK_TO) } },
				at,
			);
			tl.set(feesSegment, { opacity: 0, attr: { x: L.ax(CALLS_TO) - 3 } }, at);
		} else {
			tl.set(one(`seg-${part}`), { opacity: 1, attr: { width: 0 } }, at);
		}
		tl.fromTo(
			accountProgress,
			{ [part]: 0 },
			{
				[part]: 1,
				duration: 0,
				ease: "power2.out",
				immediateRender: false,
				onUpdate: renderAccount,
			},
			at,
		);
	};
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

	const lockTotal = one<SVGGraphicsElement>("lock-total");

	d.hidden([
		one("ben"),
		one("ben-scaffold"),
		...segments.map(({ name }) => one(name)),
		one("earned"),
		...["stock", "calls", "fees"].map((part) => one(`breakdown-${part}`)),
		one("deposited"),
		one("premium"),
		one("premium-label"),
		one("expiry"),
		one("expiry-arrow"),
		one("bp"),
		one("mark-dot"),
		one("mark-label"),
		one("far-dot"),
		one("far-label"),
		...kids("meter"),
		...flat("q"),
		...["a-head", "e-head", "l-head", "t-head", "b-head", "x-head"].map(
			(name) => one(name),
		),
		...kids("answer"),
		...squares,
		one("legend-lots"),
		one("fifo-tag"),
		one("sale-input"),
		one("mark-input"),
		one("r-tag"),
		one("u-tag"),
		initialUnrealized,
		one("fifo-eq"),
		one("fifo-result"),
		...kids("held-proof"),
		...heldBraces,
		realized,
		unrealized,
		...flat("total"),
		...kids("gapdraw").filter((el) => el.tagName === "text"),
		lockTotal,
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: the account rose; how much was earned? ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-open"), 4.6);
	land(one("q-num"), 4.8);
	d.count(
		one<SVGTextElement>("q-num"),
		afterDeposit,
		5.6,
		dollars,
		valueOpen,
		1.0,
	);
	show(one("q-up"), 6.7);
	show(one("q-line"), 6.8);

	// ——— account: what moved it ———
	tl.addLabel("account", 10.4);
	hide(flat("q"), 10.4);
	show(one("a-head"), 10.6, "above");
	// The axis and ticks settle before the first account segment enters at 10.5.
	rise(8.7);
	show([one("m-tag"), meter], 11.2, "above");
	grow("seg-base", 10.5);
	// Each caption starts at zero, then follows the same rounded contribution as the bar and meter.
	show(one("breakdown-stock"), 10.7, "below", 0.3);
	settleContribution("stock", 11.4);
	show(one("breakdown-calls"), 11.4, "below", 0.3);
	settleContribution("calls", 12.2);
	show(one("breakdown-fees"), 12.2, "below", 0.3);
	settleContribution("fees", 12.8);
	// The completed rows and net account read alone for a second (12.8–13.8).
	// Merge the bracket and enlarged answer into one reveal, rather than another transport step.
	// All three settle at 14.3 and read untouched for a full second before the deposit beat.
	tl.fromTo(
		[one("earned"), ...kids("answer")],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5, ease: "power2.out" },
		13.8,
	);
	// After the earned answer's quiet second, fade Monday out before the deposit headline.
	// Both lines fade in place, clear of the EARNED tag; the new line holds 15.6–19.1.
	hide(one("a-head"), 15.3, 0.3, 0);
	tl.fromTo(
		one("e-head"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5, ease: "power2.out" },
		15.6,
	);
	settleContribution("deposit", 16.0);
	show(one("deposited"), 15.5);
	// The deposit headline settles at 16.1; read the whole beat for a quiet second.
	show(one("bp"), 17.1, "below", 0.3);

	// ——— calls: realized and unrealized ———
	tl.addLabel("calls", 19.0);
	hide(one("e-head"), 19.1);
	// The account leaves before the calls arrive: its readouts and chart are gone at 19.0,
	// where the unrealized +$1,050 comes in (a partial cut fades out, then in).
	hide([...kids("meter"), one("bp"), ...kids("answer")], 18.65);
	sink(18.65);
	show([one("u-tag"), initialUnrealized], 19.0, "below", 0.3);
	// The repeated cells arrive as one lot diagram; omit the decorative sixteen-cell ripple.
	for (const square of squares) land(square, 21.0, 0.4);
	show(one("r-tag"), 19.4);
	show(one("legend-lots"), 19.4);
	show(one("mark-input"), 19.4, "below", 0.3);
	show(one("sale-input"), 19.4, "below", 0.3);
	show(one("l-head"), 19.5, "above");
	// The question and lot scaffold settle by 20.0, then stay still for a second before the cells enter at 21.0.
	show(one("fifo-tag"), 19.7, "below", 0.3);
	show(one("fifo-eq"), 19.7, "above", 0.3);
	tl.to(
		initialUnrealized,
		{ opacity: 0.3, duration: 0.3, ease: "power2.out" },
		21.4,
	);
	tl.to(squares.slice(0, SOLD), { opacity: 0.2, duration: 0.4 }, 21.4);
	show([realized, one("fifo-result")], 21.8, "below", 0.3);
	// Preserve the realized proof's full second of quiet before its footer leaves.
	hide([one("fifo-eq"), one("fifo-result")], 23.1, 0.3, 0);
	// The shared formula precedes the compact contribution rows; the accepted row times stay fixed.
	tl.fromTo(
		one("held-formula-wrap"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3, ease: "power2.out" },
		23.1,
	);
	// Each outlined lot gets its own row and a second to read before the next contribution.
	remainingLots.forEach((_, i) => {
		const at = 23.4 + i * 1.3;
		for (const brace of heldBraces.filter((el) =>
			el.getAttribute("data-f")?.startsWith(`held-brace-${i}-`),
		)) {
			d.trace(brace as SVGPathElement, at, { duration: 0.3 });
		}
		// Fade in place: moving the footer would cross the phone's result row.
		tl.fromTo(
			one(`held-row-${i}`),
			{ opacity: 0 },
			{ opacity: 1, duration: 0.3 },
			at,
		);
	});
	// Replace the dim initial total in place once the surviving contribution rows have settled.
	tl.to(
		initialUnrealized,
		{ scaleY: 0, duration: 0.3, ease: "power2.in", transformOrigin: "50% 50%" },
		25.2,
	);
	tl.set(initialUnrealized, { opacity: 0 }, 25.5);
	tl.fromTo(
		unrealized,
		{ opacity: 0, scaleY: 0.92, transformOrigin: "50% 50%" },
		{
			opacity: 1,
			scaleY: 1,
			duration: 0.3,
			ease: "power2.out",
			immediateRender: false,
		},
		25.5,
	);
	// Reveal the settled sum after both surviving contribution rows are on the stage.
	tl.fromTo(
		one("held-sum"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		26.0,
	);
	// Preserve the FIXED complete diagram hold: all cells, inputs and results, 26.3–28.1.
	hide(
		[
			...squares,
			one("legend-lots"),
			one("fifo-tag"),
			one("sale-input"),
			one("mark-input"),
			one("r-tag"),
			one("u-tag"),
			initialUnrealized,
			...kids("held-proof"),
			...heldBraces,
		],
		28.1,
		0.35,
		0,
	);
	show(one("t-tag"), 28.45, "above", 0.3);
	// Each part lands in its own lane; neither travels across the other's glyphs.
	const subtotal = one<SVGTextElement>("t-subtotal");
	const total = one<SVGTextElement>("t-num");
	d.carry(realized, subtotal, 28.45, { duration: 0.45, arc: "y" });
	d.carry(unrealized, one<SVGGraphicsElement>("t-part"), 28.65, {
		duration: 0.45,
		arc: "y",
	});
	tl.fromTo(
		total,
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3, ease: "power2.out", immediateRender: false },
		29.1,
	);
	d.lock(lockTotal, 29.4, {
		around: [one("t-tag"), total],
		pad: 8,
	});
	tl.addLabel("hero-lock", 29.4);
	show(one("t-head"), 29.4);
	// The brackets settle at 29.85, the headline at 29.9; both read alone until 31.4.
	// Merge the gap into one construction, including its settled result after '='.
	d.trace(one<SVGPathElement>("gap-rule"), 31.4, { duration: 0.4 });
	show([one("gap-bid"), one("gap-mid")], 31.4, "below", 0.4);
	tl.fromTo(
		one("gap-eq"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3, ease: "power2.out" },
		31.5,
	);
	// The completed gap reads alone 31.8–33.7 (1.9 s); the hero's 3.85 s stand is unchanged.

	// ——— short: the other side of the same calls ———
	tl.addLabel("short", 33.7);
	tl.set(
		[
			...flat("total"),
			...kids("gapdraw"),
			lockTotal,
			one("l-head"),
			one("t-head"),
		],
		{ opacity: 0 },
		33.7,
	);
	tl.set(one("acct"), { opacity: 0 }, 33.7);
	tl.set(one("ben"), { opacity: 1 }, 33.7);
	// Ben's scaffold comes in at the cut itself (the gap is gone at once, so nothing crosses
	// it and the stage is never empty) and stands a second before his premium.
	show(one("ben-scaffold"), 33.7, "below", 0.3);
	show(one("b-head"), 33.75, "above");
	tl.to(one("premium"), { opacity: 1, duration: 0.5 }, 35.3);
	show(one("premium-label"), 35.3);
	land(one("mark-dot"), 35.6);
	show(one("mark-label"), 35.8);
	d.swap(one("b-head"), one("x-head"), 37.6);
	d.trace(one<SVGPathElement>("expiry"), 37.7, {
		duration: 1.4,
		ease: "power2.inOut",
	});
	tl.fromTo(
		one("expiry-arrow"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		39.1,
	);
	land(one("far-dot"), 38.9);
	show(one("far-label"), 39.1);
	// Cut: the claim.
	hide(one("x-head"), 41.45);
	hide([one("ben-scaffold"), one("ben")], 41.45, 0.4, 0);
	sink(41.45);
	tl.fromTo(
		one("z-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
		41.8,
	);
	show(one("z-sub"), 42.2);

	// ——— next ———
	tl.addLabel("next", 45.8);
	hide(kids("claim"), 45.8);
	d.close(45.8);
	return tl;
}

export const portfolioPnlFilm: Film = {
	id: "portfolio-pnl",
	label: [
		`P&L, as a short film: your account rising from ${dollars(valueOpen)} at Monday's open to ${dollars(afterDeposit)} on Tuesday; ALFA ${signed(stockClose - stockOpen)}, the calls ${signed(callsClose - PAID * 100)} and fees ${signed(-buyFees)} making ${signed(PNL)} earned, and a ${dollars(yourAccount.deposit)} deposit that is not profit; buying power at 2 × cash, including 50% credit; ${HELD} calls in two lots, ${signed(held.unrealized)} unrealized until ${SOLD} are sold at the bid, split ${signed(fifo.realized)} realized and ${signed(fifo.unrealized)} unrealized first in, first out, ${signed(fifo.realized + fifo.unrealized)} in all; and Ben's ${BEN} short calls, ${dollars(RECEIVED)} received and ${signed(benAtExpiry(120))} if ALFA settles at $120`,
		`盈亏短片：你的账户从周一开盘的 ${dollars(valueOpen)} 升到周二的 ${dollars(afterDeposit)}；ALFA ${signed(stockClose - stockOpen)}、看涨 ${signed(callsClose - PAID * 100)}、费用 ${signed(-buyFees)}，合计赚了 ${signed(PNL)}，而 ${dollars(yourAccount.deposit)} 的存入不是利润；购买力为现金的 2 倍，含 50% 授信；${HELD} 张看涨分两批，卖出 ${SOLD} 张之前都是未实现的 ${signed(held.unrealized)}，按买价卖出后先进先出分为已实现 ${signed(fifo.realized)} 和未实现 ${signed(fifo.unrealized)}，合计 ${signed(fifo.realized + fifo.unrealized)}；以及 Ben 的 ${BEN} 张看涨空头：收到 ${dollars(RECEIVED)}，若 ALFA 结算于 $120 则为 ${signed(benAtExpiry(120))}`,
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
