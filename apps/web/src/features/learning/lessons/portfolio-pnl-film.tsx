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
	TitleCard,
	Word,
} from "../walkthrough/film-kit";
import { textWidth } from "../walkthrough/text-measure";
import {
	afterDeposit,
	BEN,
	benAtExpiry,
	benMarked,
	buyFees,
	buyingPower,
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
 * calls +$1,050, fees −$10.40, so +$1,199.60 earned, lifted out as the answer; then a
 * $5,000 deposit that lifts the value without being profit, and buying power, larger
 * still. Then the calls' +$1,050 as sixteen contracts in two lots, and a question: sold
 * at the bid, is it still +$1,050? Six sold oldest first leave +$330 realized and +$645
 * unrealized, and the two become +$975: the bid, not the mid. Last, Ben's ten short
 * calls: $4,100 received, and no floor.
 *
 *   open      0–4        "P&L"
 *   question  4–10.4     $29,960 → $36,159.60: how much did you earn?
 *   account   10.4–19.7  +$160, +$1,050, −$10.40: +$1,199.60 earned; +$5,000 deposited;
 *                        buying power $36,799.20
 *   calls     19.7–31.7  16 contracts, +$1,050 unrealized; sell 6, oldest first; +$330
 *                        and +$645 become +$975, locked; then the $75, drawn: bid to mid
 *   short     31.7–43.8  Ben: +$4,100 received, −$675 marked, −$15,900 at $120;
 *                        cut: "P&L is what your positions earned."
 *   next      43.8–46.3  Next: performance
 */

const END = 46.3;
const ACCOUNT = [29_000, 37_000] as const;
const BEN_X = [90, 140] as const;
const BEN_Y = [-20_000, 6_000] as const;
/** Where the expiry line leaves the chart's floor: past it, the loss goes on. */
const OFF_FLOOR = 100 + (RECEIVED / 100 - BEN_Y[0]) / (BEN * 100);
const fifo = split(SOLD, "fifo");
/** What selling at the bid, not the mid, takes off: six contracts × $0.125 × 100. */
const GAP = SOLD * (MARK - SALE) * 100;
const GAP_EQ = `${price(MARK - SALE)} × ${SOLD} × 100 =`;
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
	qOpen: ["Your account · Monday open", "你的账户 · 周一开盘"],
	qTue: ["Your account · Tuesday", "你的账户 · 周二"],
	qUp: [
		`up ${dollars(afterDeposit - valueOpen)}`,
		`增加 ${dollars(afterDeposit - valueOpen)}`,
	],
	qLine: ["How much of that did you earn?", "其中有多少是你赚的？"],
	mondayHead: [
		"Monday: ALFA up, calls up, fees paid.",
		"周一：ALFA 上涨，看涨上涨，付了费用。",
	],
	mondayHeadShort: ["Monday: ALFA, calls, fees.", "周一：ALFA、看涨、费用。"],
	earnedHead: [
		`Tuesday's ${dollars(yourAccount.deposit)} deposit is not earned.`,
		`周二存入的 ${dollars(yourAccount.deposit)} 不是赚到的。`,
	],
	earnedHeadShort: ["A deposit isn't earned.", "存入不是赚到的。"],
	meter: ["account", "账户"],
	earned: ["earned", "赚到"],
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
		`The bid, not the mid: ${dollars(held.unrealized - fifo.realized - fifo.unrealized)} less.`,
		`按买价，不是中间价：少 ${dollars(held.unrealized - fifo.realized - fifo.unrealized)}。`,
	],
	marked: [
		`at the mid: ${signed(held.unrealized)} − ${dollars(held.unrealized - fifo.realized - fifo.unrealized)}`,
		`按中间价：${signed(held.unrealized)} − ${dollars(held.unrealized - fifo.realized - fifo.unrealized)}`,
	],
	/** Where the $75 comes from: six sold at the bid, not the mid. */
	bid: ["bid", "买价"],
	mid: ["mid", "中间价"],
	bpNote: [
		`2 × cash ${dollars(buyingPower / 2)}`,
		`现金 ${dollars(buyingPower / 2)} × 2`,
	],
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
	benMarkShort: [`mark ${signed(benMarked)}`, `估值 ${signed(benMarked)}`],
	far: [
		`$120: ${signed(benAtExpiry(120))}`,
		`$120：${signed(benAtExpiry(120))}`,
	],
	claimBig: ["P&L is what your positions earned.", "盈亏是持仓赚到的。"],
	claimSub: [
		"Not deposits, not buying power; short-call losses are uncapped.",
		"不是存入或购买力；卖出看涨的亏损没有上限。",
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
	/** Where the total's second part lands: right of the first, past a "+". */
	// The drawn gap, under the mid line.
	const gapText = narrow ? T.small * 1.15 : T.body;
	const gapHalf = room * (narrow ? 0.14 : 0.08);
	const gapY = H * 0.3 + T.big * 1.05 + T.body * 6.2;
	const eqX =
		W / 2 -
		(textWidth(GAP_EQ, gapText) + 8 + textWidth(dollars(GAP), gapText * 1.3)) /
			2;
	const partX =
		W / 2 + textWidth(signed(fifo.realized), T.big) / 2 + T.num * 1.4;
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
								width={
									name === "seg-fees"
										? 3
										: Math.max(
												L.ax(to) - L.ax(from) - (name === "seg-stock" ? 2 : 0),
												1.5,
											)
								}
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
						<text
							data-f="breakdown"
							x={narrow ? L.left : x0}
							y={L.barBottom + 18 + T.body * 1.6}
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
							d={`M${L.bx(90)} ${L.by(benAtExpiry(90) / 100)}L${L.bx(100)} ${L.by(benAtExpiry(100) / 100)}L${offX} ${offY}`}
							className="wt-line-short"
						/>
						<path
							data-f="expiry-arrow"
							d={`M${offX - arrow.dx * 9 - arrow.dy * 6} ${offY - arrow.dy * 9 + arrow.dx * 6}L${offX} ${offY}L${offX - arrow.dx * 9 + arrow.dy * 6} ${offY - arrow.dy * 9 - arrow.dx * 6}`}
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
							{t(narrow ? copy.benMarkShort : copy.benMark)}
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
				<Word
					name="m-tag-bp"
					x={L.right}
					y={L.headY + T.head * 1.25}
					size={T.small}
					anchor="end"
					className="wt-film-tag"
				>
					{t(copy.bpTag).toUpperCase()}
				</Word>
				<Word
					name="m-bp"
					x={L.right}
					y={L.headY + T.head * 1.25 + T.num * 1.05}
					size={T.num}
					anchor="end"
					className="wt-film-num wt-film-accent"
				>
					{dollars(buyingPower)}
				</Word>
			</g>
			<Word
				name="m-bp-note"
				x={L.right}
				y={L.headY + T.head * 1.25 + T.num * 1.05 + T.small * 1.9}
				size={T.small}
				anchor="end"
				className="wt-film-tag"
			>
				{t(copy.bpNote).toUpperCase()}
			</Word>
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
					size={T.head}
					maxWidth={room}
					className="wt-film-type"
				/>
			</g>
			{headline("a-head", copy.mondayHead, copy.mondayHeadShort)}
			{headline("e-head", copy.earnedHead, copy.earnedHeadShort)}
			{/* Sixteen contracts in two lots. */}
			<g data-f="lots">
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
							className="wt-film-num wt-film-gain"
						>
							{value}
						</Word>
					</g>
				))}
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
					name="t-num"
					x={W / 2}
					y={H * 0.3 + T.big * 1.05}
					size={T.big}
					className="wt-film-num wt-film-gain"
				>
					{signed(fifo.realized)}
				</Word>
				<Word
					name="t-part"
					x={partX}
					y={H * 0.3 + T.big * 1.05}
					size={T.num}
					anchor="start"
					className="wt-film-num wt-film-gain"
				>
					{signed(fifo.unrealized)}
				</Word>
				<Word
					name="t-was"
					x={W / 2}
					y={H * 0.3 + T.big * 1.05 + T.body * 3.9}
					size={T.body}
					className="wt-film-type wt-film-dim"
				>
					{t(copy.marked)}
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
					className="wt-film-num wt-film-dim"
					style={{ fontSize: gapText }}
				>
					{GAP_EQ}
				</text>
				<text
					data-f="gap-n"
					x={eqX + textWidth(GAP_EQ, gapText) + 8}
					y={gapY + gapText * 2.6}
					className="wt-film-num wt-film-loss"
					style={{ fontSize: gapText * 1.3 }}
				>
					{dollars(GAP)}
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
	const squares = Array.from({ length: HELD }, (_, i) => one(`sq-${i}`));
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

	const lockTotal = one<SVGGraphicsElement>("lock-total");

	d.hidden([
		one("ben"),
		...segments.map(({ name }) => one(name)),
		one("earned"),
		one("breakdown"),
		one("deposited"),
		one("premium"),
		one("premium-label"),
		one("expiry"),
		one("expiry-arrow"),
		one("m-bp-note"),
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
		one("r-tag"),
		one("u-tag"),
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
	d.swap(one("q-open"), one("q-tue"), 5.5);
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
	rise(10.7);
	show(kids("meter"), 11.2, "above");
	d.count(meter, valueOpen, 11.2, dollars, valueOpen, 0.01);
	grow("seg-base", 11.2);
	grow("seg-stock", 11.9, 0.4);
	grow("seg-calls", 12.3, 0.5);
	tl.to(one("seg-fees"), { opacity: 1, duration: 0.3 }, 12.8);
	d.count(meter, valueClose, 11.9, dollars, valueOpen, 1.2);
	show(one("earned"), 13.4);
	show(one("breakdown"), 13.7);
	// The answer: what was earned lifts out of the bar, and stays while the deposit lands.
	d.carry(one("earned-num"), one<SVGGraphicsElement>("earned-big"), 14.2, {
		duration: 0.8,
		keep: true,
	});
	show(one("earned-tag"), 14.7);
	// Tuesday: money in, not money made.
	d.swap(one("a-head"), one("e-head"), 15.4);
	grow("seg-deposit", 15.4, 1.0);
	d.count(meter, afterDeposit, 15.4, dollars, valueClose, 1.0);
	show(one("deposited"), 15.7);
	// And buying power, larger still: margin, not money made either.
	d.flip(one("m-tag"), one("m-tag-bp"), 17.6);
	tl.set(one("m-tag"), { opacity: 0 }, 17.9);
	d.flip(meter, one("m-bp"), 17.6);
	tl.set(meter, { opacity: 0 }, 17.9);
	show(one("m-bp-note"), 17.9);

	// ——— calls: realized and unrealized ———
	tl.addLabel("calls", 19.7);
	hide(
		[one("e-head"), ...kids("meter"), one("m-bp-note"), ...kids("answer")],
		19.7,
	);
	sink(19.7);
	squares.forEach((square, i) => {
		land(square, 20.1 + i * 0.04, 0.4);
	});
	show([one("r-tag"), one("u-tag")], 20.4);
	show([realized, unrealized], 20.6);
	show(one("legend-lots"), 20.7);
	show(one("l-head"), 20.9, "above");
	// Sell six, oldest first.
	tl.to(squares.slice(0, SOLD), { opacity: 0.2, duration: 0.4 }, 23.0);
	d.count(realized, fifo.realized, 23.2, zeroed, 0, 0.8);
	d.count(unrealized, fifo.unrealized, 23.2, signed, held.unrealized, 0.8);
	// The hero: the two parts become one figure, less than the mark said.
	hide([...squares, one("legend-lots"), one("r-tag"), one("u-tag")], 24.7);
	show(one("t-tag"), 25.0);
	// One part lands, then the other lands on it, and the two count as one.
	const total = one<SVGTextElement>("t-num");
	d.carry(realized, total, 24.9, { duration: 0.8 });
	d.carry(unrealized, one<SVGGraphicsElement>("t-part"), 25.7, {
		duration: 0.8,
	});
	// The two are added: the part goes where it stands, then the total counts it in. No frame
	// shows a total beside a part it already holds.
	tl.to(one("t-part"), { opacity: 0, duration: 0.25 }, 26.6);
	d.count(
		total,
		fifo.realized + fifo.unrealized,
		26.85,
		(v) => signed(Math.round(v / 100) * 100),
		fifo.realized,
		0.6,
	);
	show(one("t-was"), 27.2);
	d.lock(lockTotal, 27.5, {
		around: [one("t-tag"), total],
		pad: 8,
	});
	tl.addLabel("hero-lock", 27.5);
	show(one("t-head"), 27.5);
	// After the lock: the $75, drawn. The bid and the mid are the ends of a gap; six
	// contracts of it come to $75.
	d.trace(one<SVGPathElement>("gap-rule"), 28.0, { duration: 0.45 });
	show(one("gap-bid"), 28.0);
	show(one("gap-mid"), 28.3);
	show(one("gap-eq"), 28.75);
	tl.set(one("gap-n"), { opacity: 1 }, 28.95);
	d.count(
		one<SVGTextElement>("gap-n"),
		GAP,
		28.95,
		(v) => dollars(Math.round(v / 100) * 100),
		0,
		0.5,
	);

	// ——— short: the other side of the same calls ———
	tl.addLabel("short", 31.7);
	hide(
		[
			...flat("total"),
			...kids("gapdraw"),
			lockTotal,
			one("l-head"),
			one("t-head"),
		],
		31.7,
	);
	tl.set(one("acct"), { opacity: 0 }, 31.8);
	tl.set(one("ben"), { opacity: 1 }, 31.8);
	show(one("b-head"), 32.05, "above");
	rise(32.1);
	tl.to(one("premium"), { opacity: 1, duration: 0.5 }, 32.6);
	show(one("premium-label"), 32.9);
	land(one("mark-dot"), 33.3);
	show(one("mark-label"), 33.5);
	d.swap(one("b-head"), one("x-head"), 35.6);
	draw(one<SVGPathElement>("expiry"), 35.7, 1.4);
	tl.fromTo(
		one("expiry-arrow"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.2 },
		37.1,
	);
	land(one("far-dot"), 36.9);
	show(one("far-label"), 37.1);
	// Cut: the claim.
	hide(one("x-head"), 39.45);
	sink(39.45);
	tl.fromTo(
		one("z-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
		39.8,
	);
	show(one("z-sub"), 40.2);

	// ——— next ———
	tl.addLabel("next", 43.8);
	hide(kids("claim"), 43.8);
	d.close(43.8);
	return tl;
}

export const portfolioPnlFilm: Film = {
	id: "portfolio-pnl",
	label: [
		`P&L, as a short film: your account rising from ${dollars(valueOpen)} at Monday's open to ${dollars(afterDeposit)} on Tuesday; ALFA ${signed(stockClose - stockOpen)}, the calls ${signed(callsClose - PAID * 100)} and fees ${signed(-buyFees)} making ${signed(PNL)} earned, and a ${dollars(yourAccount.deposit)} deposit that is not profit; buying power of ${dollars(buyingPower)}, half of it credit; ${HELD} calls in two lots, ${signed(held.unrealized)} unrealized until ${SOLD} are sold at the bid, split ${signed(fifo.realized)} realized and ${signed(fifo.unrealized)} unrealized first in, first out, ${signed(fifo.realized + fifo.unrealized)} in all; and Ben's ${BEN} short calls, ${dollars(RECEIVED)} received and ${signed(benAtExpiry(120))} if ALFA settles at $120`,
		`盈亏短片：你的账户从周一开盘的 ${dollars(valueOpen)} 升到周二的 ${dollars(afterDeposit)}；ALFA ${signed(stockClose - stockOpen)}、看涨 ${signed(callsClose - PAID * 100)}、费用 ${signed(-buyFees)}，合计赚了 ${signed(PNL)}，而 ${dollars(yourAccount.deposit)} 的存入不是利润；购买力 ${dollars(buyingPower)}，一半是授信；${HELD} 张看涨分两批，卖出 ${SOLD} 张之前都是未实现的 ${signed(held.unrealized)}，按买价卖出后先进先出分为已实现 ${signed(fifo.realized)} 和未实现 ${signed(fifo.unrealized)}，合计 ${signed(fifo.realized + fifo.unrealized)}；以及 Ben 的 ${BEN} 张看涨空头：收到 ${dollars(RECEIVED)}，若 ALFA 结算于 $120 则为 ${signed(benAtExpiry(120))}`,
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
