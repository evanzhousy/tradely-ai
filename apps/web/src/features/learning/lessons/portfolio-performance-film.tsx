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
import {
	AFTER_DEPOSIT,
	CLOSE,
	deep,
	dollars,
	GROSS_LOSS,
	GROSS_WIN,
	GROWTH,
	MONTHS,
	maxDrawdown,
	OPEN,
	pct,
	R1,
	R2,
	signed,
	steady,
	TOTAL,
	TWR,
	trades,
	WEEK_END,
	WIN_RATE,
	WINS,
} from "./portfolio-performance-model";

/*
 * Performance, as a film. It opens on three good numbers: balance growth +21.9%, an 80% win
 * rate and a 10% return. Each hides something. The balance grew +21.9% because of your own
 * $5,000; cut at the deposit, the pieces chain to a time-weighted +5.04%. Four of five
 * trades won: their +$625 stacks against −$780, making −$155. Two accounts
 * both made 10%, and one of them fell 25% on the way.
 *
 *   open      0–4        "Performance"
 *   question  4–9.4      +21.9% · 80% · +10%
 *   returns   9.4–21     the account's week and its deposit; +4.00% and +1.00%; cut: +5.04%
 *   trades    21–33.95   five trades; wins stack to +$625 against −$780, making −$155
 *   drawdown  33.95–45.45 exact endpoints then +10% and B's −25%; cut: "Each measure answers one
 *                        question."
 *   next      45.45–47.45  Next: portfolio Greeks
 */

const END = 47.45;
const VALUE_Y = [28_000, 38_000] as const;
const DD_Y = [22_000, 35_000] as const;
const POINTS = [
	[0, OPEN / 100],
	[1, CLOSE / 100],
	[2, CLOSE / 100],
	[2, AFTER_DEPOSIT / 100],
	[3, WEEK_END / 100],
] as const;
const WIN_HIGH = Math.max(...trades.map((trade) => trade.pnl));
const LOSS_LOW = -Math.min(...trades.map((trade) => trade.pnl));
const worstB = maxDrawdown(deep);
const totalReturn = (values: readonly number[]) =>
	values[values.length - 1] / values[0] - 1;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height, narrow } = frame;
	const left = Math.max(frame.margin, narrow ? 46 : 0);
	const right = width * 0.965;
	const top = height * (narrow ? 0.38 : 0.3);
	const bottom = height * 0.84;
	const span = right - left;
	// The week: four moments, padded at both ends.
	const vx = (i: number) => left + ((i + 0.35) / 3.7) * span;
	const vy = (dollars: number) =>
		bottom -
		((dollars - VALUE_Y[0]) / (VALUE_Y[1] - VALUE_Y[0])) * (bottom - top);
	// The trades: wins up, the loss down, on one scale.
	const slot = span / trades.length;
	// On a phone the bars start lower, clear of the meter in the corner.
	const barTop = narrow ? height * 0.46 : top;
	const unit = (bottom - barTop - 34) / ((WIN_HIGH + LOSS_LOW) / 100);
	const zero = barTop + 18 + (WIN_HIGH / 100) * unit;
	// The two accounts by month.
	const mx = (month: number) => left + (month / (MONTHS.length - 1)) * span;
	const my = (dollars: number) =>
		bottom - ((dollars - DD_Y[0]) / (DD_Y[1] - DD_Y[0])) * (bottom - top);
	return {
		...frame,
		left,
		right,
		top,
		bottom,
		vx,
		vy,
		valuePath: POINTS.map(
			([i, v], k) => `${k ? "L" : "M"}${vx(i).toFixed(1)} ${vy(v).toFixed(1)}`,
		).join(""),
		barX: (i: number) => left + slot * (i + 0.5),
		barWidth: Math.min(slot * 0.46, 56),
		zero,
		barY: (cents: number) => zero - (cents / 100) * unit,
		mx,
		my,
		ddPath: (values: readonly number[]) =>
			values
				.map(
					(v, i) => `${i ? "L" : "M"}${mx(i).toFixed(1)} ${my(v).toFixed(1)}`,
				)
				.join(""),
		columns: [0.2, 0.5, 0.8],
		stackX: [width * 0.32, width * 0.68],
		stackBottom: height * 0.62,
		stackUnit: (height * 0.23) / GROSS_LOSS,
		stackWidth: Math.min(width * 0.12, 72),
	};
}

const copy = {
	title: ["Performance", "绩效"],
	titleSub: ["returns, win rate and drawdown", "收益、胜率与回撤"],
	qGrowth: ["balance growth", "余额增长"],
	qGrowthShort: ["growth", "增长"],
	qWin: ["win rate", "胜率"],
	qReturn: ["return, Jan–Aug", "收益，1–8月"],
	qReturnShort: ["return", "收益"],
	qLine: [
		"Three good numbers. Each one hides something.",
		"三个好看的数字，每个都藏着一些东西。",
	],
	weekHead: [
		"Your week, with your own deposit in it.",
		"你的这一周，含你自己的存入。",
	],
	weekHeadShort: ["Your week, deposit included.", "这一周，含存入。"],
	cutHead: [
		"Cut at the deposit; measure each piece.",
		"在存入处切开，每段从起点算起。",
	],
	cutHeadShort: ["Cut at the deposit.", "在存入处切开。"],
	growthTag: ["balance growth", "余额增长"],
	days: [
		["Mon open", "周一开盘"],
		["Mon close", "周一收盘"],
		["Tue deposit", "周二存入"],
		["Fri close", "周五收盘"],
	],
	daysShort: [
		["open", "开盘"],
		["close", "收盘"],
		["deposit", "存入"],
		["Fri", "周五"],
	],
	deposit: [
		`+${dollars(yourAccount.deposit)} deposit`,
		`存入 +${dollars(yourAccount.deposit)}`,
	],
	twrTag: ["time-weighted return", "时间加权收益"],
	twrLine: [
		"Deposits removed. Only the return remains.",
		"剔除存入，只衡量资金的收益。",
	],
	tradesHead: [
		`Your last ${trades.length} trades.`,
		`最近 ${trades.length} 笔交易。`,
	],
	tradesAnswer: [
		`${WINS.length} of ${trades.length} won.`,
		`${trades.length} 笔中有 ${WINS.length} 笔赚钱。`,
	],
	grossWin: [`${WINS.length} wins`, `${WINS.length} 笔盈利`],
	grossLoss: ["one loss", "一笔亏损"],
	winRate: ["win rate", "胜率"],
	total: ["total", "合计"],
	ddHead: ["Two accounts, January to August.", "两个账户，一月到八月。"],
	ddHeadShort: ["Two accounts, eight months.", "两个账户，八个月。"],
	fallHead: [
		`Both ${pct(totalReturn(steady), 0)}; B fell ${pct(-worstB.fall, 0).replace("+", "")}, A barely dipped.`,
		`均涨 ${pct(totalReturn(steady), 0)}；B 跌 ${pct(-worstB.fall, 0).replace("+", "")}，A 小幅回撤。`,
	],
	ddAxis: ["month-end values", "月末价值"],
	accountA: ["account A", "账户 A"],
	accountB: ["account B", "账户 B"],
	claimBig: ["Each measure answers one question.", "每个度量只回答一个问题。"],
	claimSub: [
		"Remove deposits, weigh trades by size, watch the path.",
		"剔除存入，按金额衡量交易，看路径。",
	],
	nextBig: ["Next: portfolio Greeks", "下一课：组合希腊值"],
	nextSub: ["adding up exposure", "汇总敞口"],
} as const;

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
	const days = narrow ? copy.daysShort : copy.days;
	const question = [
		[narrow ? copy.qGrowthShort : copy.qGrowth, pct(GROWTH, 1), "wt-film-gain"],
		[copy.qWin, `${Math.round(WIN_RATE * 100)}%`, "wt-film-gain"],
		[
			narrow ? copy.qReturnShort : copy.qReturn,
			pct(totalReturn(deep), 0),
			"wt-film-gain",
		],
	] as const;
	const jumpX = L.vx(2);
	return (
		<>
			<Backdrop frame={L} />

			<g data-f="depth">
				<g data-f="world">
					{/* The week. */}
					<g data-f="week">
						{[30_000, 34_000, 38_000].map((tick) => (
							<g key={tick}>
								<path
									d={`M${L.left} ${L.vy(tick)}H${L.right}`}
									className="wt-grid"
								/>
								<text
									x={L.left - 8}
									y={L.vy(tick) + 4}
									textAnchor="end"
									className="wt-small"
								>
									{`$${tick / 1000}k`}
								</text>
							</g>
						))}
						<path d={`M${L.left} ${L.bottom}H${L.right}`} className="wt-axis" />
						{days.map((day, i) => (
							<text
								key={day[0]}
								x={L.vx(i)}
								y={L.bottom + 16}
								textAnchor="middle"
								className="wt-small"
							>
								{t(day)}
							</text>
						))}
						{(
							[
								["band-1", 0, 1, pct(R1)],
								["band-2", 2, 3, pct(R2)],
							] as const
						).map(([name, from, to, label]) => (
							<g key={name} data-f={name}>
								<rect
									x={L.vx(from)}
									y={L.top}
									width={L.vx(to) - L.vx(from)}
									height={L.bottom - L.top}
									className="wt-band-gain"
								/>
								<text
									x={(L.vx(from) + L.vx(to)) / 2}
									y={L.top + 18}
									textAnchor="middle"
									className="wt-halo wt-gain wt-marker-label"
								>
									{label}
								</text>
							</g>
						))}
						<path
							data-f="value-line"
							d={L.valuePath}
							className="wt-line-position"
						/>
						<rect
							data-f="jump"
							x={jumpX - 7}
							y={L.vy(AFTER_DEPOSIT / 100) - 4}
							width={14}
							height={L.vy(CLOSE / 100) - L.vy(AFTER_DEPOSIT / 100) + 8}
							rx={7}
							className="wt-film-ghost"
						/>
						<text
							data-f="jump-label"
							x={jumpX - 14}
							y={(L.vy(CLOSE / 100) + L.vy(AFTER_DEPOSIT / 100)) / 2 + 4}
							textAnchor="end"
							className="wt-halo wt-marker-label"
						>
							{t(copy.deposit)}
						</text>
						{POINTS.filter((_, k) => k !== 2).map(([i, v]) => (
							<circle
								key={`${i}-${v}`}
								data-f={`dot-${i}-${v > CLOSE / 100 ? "high" : "low"}`}
								cx={L.vx(i)}
								cy={L.vy(v)}
								r={5}
								className="wt-chip"
							/>
						))}
					</g>

					{/* Five trades. */}
					<g data-f="bars">
						<path
							data-f="bar-axis"
							d={`M${L.left} ${L.zero}H${L.right}`}
							className="wt-axis"
						/>
						{trades.map((trade, i) => {
							const x = L.barX(i);
							const y = L.barY(trade.pnl);
							const win = trade.pnl > 0;
							return (
								<g key={trade.id}>
									<rect
										data-f={`bar-${i}`}
										className="wt-film-bar"
										stroke="var(--background)"
										strokeWidth={1.5}
										data-tone={win ? "gain" : "loss"}
										x={x - L.barWidth / 2}
										y={Math.min(y, L.zero)}
										width={L.barWidth}
										height={Math.abs(y - L.zero)}
										rx={2}
									/>
									<text
										data-f={`bar-value-${i}`}
										x={win ? x : x + L.barWidth / 2 + 6}
										y={win ? y - 7 : y - 2}
										textAnchor={win ? "middle" : "start"}
										className={`wt-halo wt-marker-label ${win ? "wt-gain" : "wt-loss"}`}
									>
										{signed(trade.pnl)}
									</text>
									<text
										data-f={`bar-date-${i}`}
										x={x}
										y={win ? L.zero + 16 : L.zero - 8}
										textAnchor="middle"
										className="wt-small"
									>
										{t(trade.label)}
									</text>
								</g>
							);
						})}
					</g>

					{/* Two accounts by month. */}
					<g data-f="dd">
						<text x={L.left} y={L.top - 12} className="wt-small">
							{t(copy.ddAxis)}
						</text>
						{[24_000, 28_000, 32_000].map((tick) => (
							<g key={tick}>
								<path
									d={`M${L.left} ${L.my(tick)}H${L.right}`}
									className="wt-grid"
								/>
								<text
									x={L.left - 8}
									y={L.my(tick) + 4}
									textAnchor="end"
									className="wt-small"
								>
									{`$${tick / 1000}k`}
								</text>
							</g>
						))}
						{MONTHS.map((month, i) => (
							<text
								key={month[0]}
								x={L.mx(i)}
								y={L.bottom + 16}
								textAnchor={
									i === 0 ? "start" : i === MONTHS.length - 1 ? "end" : "middle"
								}
								className="wt-small"
							>
								{t(month)}
							</text>
						))}
						<text
							data-f="dd-start"
							x={L.mx(0)}
							y={L.my(steady[0]) + 24}
							textAnchor="start"
							className="wt-small wt-halo"
						>
							{dollars(steady[0] * 100)}
						</text>
						<text
							data-f="dd-end"
							x={L.mx(MONTHS.length - 1)}
							y={L.my(steady[steady.length - 1]) - 14}
							textAnchor="end"
							className="wt-small wt-halo"
						>
							{dollars(steady[steady.length - 1] * 100)}
						</text>
						<rect
							data-f="fall-band"
							x={L.mx(worstB.peakAt)}
							y={L.top}
							width={L.mx(worstB.troughAt) - L.mx(worstB.peakAt)}
							height={L.bottom - L.top}
							className="wt-band-loss"
						/>
						<path
							data-f="line-a"
							d={L.ddPath(steady)}
							className="wt-line-position"
						/>
						<path
							data-f="line-b"
							d={L.ddPath(deep)}
							className="wt-line-short"
						/>
						<text
							data-f="label-a"
							x={L.mx(5)}
							y={L.my(steady[5]) - 12}
							textAnchor="middle"
							className="wt-small wt-halo wt-accent"
						>
							{t(copy.accountA)}
						</text>
						<text
							data-f="label-b"
							x={L.mx(5) + 8}
							y={L.my(deep[5]) + 18}
							className="wt-small wt-halo"
							style={{ fill: "var(--wt-short)" }}
						>
							{t(copy.accountB)}
						</text>
						<circle
							data-f="peak"
							cx={L.mx(worstB.peakAt)}
							cy={L.my(deep[worstB.peakAt])}
							r={5}
							className="wt-chip"
							style={{ fill: "var(--wt-short)" }}
						/>
						<circle
							data-f="trough"
							cx={L.mx(worstB.troughAt)}
							cy={L.my(deep[worstB.troughAt])}
							r={6}
							className="wt-chip"
							style={{ fill: "var(--wt-short)" }}
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
						<text
							data-f="fall-label"
							x={L.mx(worstB.troughAt)}
							y={L.my(deep[worstB.troughAt]) + 22}
							textAnchor="middle"
							className="wt-halo wt-loss wt-marker-label"
						>
							{pct(worstB.fall, 0)}
						</text>
					</g>
				</g>
			</g>
			<g data-f="meter">
				{(
					[
						["growth", copy.growthTag, pct(GROWTH, 1), "wt-film-accent"],
						[
							"rate",
							copy.winRate,
							`${Math.round(WIN_RATE * 100)}%`,
							"wt-film-gain",
						],
					] as const
				).map(([name, tag, value, tone]) => (
					<g key={name}>
						<Word
							name={`m-${name}`}
							x={L.right}
							y={L.headY + T.head * 1.25}
							size={T.small}
							anchor="end"
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`m-${name}-value`}
							x={L.right}
							y={L.headY + T.head * 1.25 + T.num * 1.05}
							size={T.num}
							anchor="end"
							className={`wt-film-num ${tone}`}
						>
							{value}
						</Word>
					</g>
				))}
			</g>

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				{question.map(([tag, value, tone], i) => (
					<g key={tag[0]}>
						<Word
							name={`q-tag-${i}`}
							x={W * L.columns[i]}
							y={H * 0.36}
							size={T.small}
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`q-num-${i}`}
							x={W * L.columns[i]}
							y={H * 0.36 + T.title * 1.5}
							size={Math.min(
								T.title * 1.25,
								(W * 0.27) / (value.length * 0.62),
							)}
							className={`wt-film-num ${tone}`}
						>
							{value}
						</Word>
					</g>
				))}
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.76}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("w-head", copy.weekHead, copy.weekHeadShort)}
			<Lines
				name="c-head"
				text={t(narrow ? copy.cutHeadShort : copy.cutHead)}
				x={L.margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.weekHeadShort : copy.weekHead),
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
			<g data-f="twr">
				<Word
					name="twr-tag"
					x={W / 2}
					y={H * 0.28}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.twrTag).toUpperCase()}
				</Word>
				<Word
					name="twr-sum"
					x={W / 2}
					y={H * 0.28 + T.head * 1.8}
					size={T.head}
					className="wt-film-num wt-film-dim"
				>
					{`${(1 + R1).toFixed(4)} × ${(1 + R2).toFixed(4)} − 1`}
				</Word>
				<Word
					name="twr-num"
					x={W / 2}
					y={H * 0.28 + T.head * 1.8 + T.big * 1.1}
					size={T.big}
					className="wt-film-num wt-film-gain"
				>
					{pct(TWR)}
				</Word>
				<Lines
					name="twr-line"
					text={t(copy.twrLine)}
					x={W / 2}
					y={H * 0.8}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("t-head", copy.tradesHead, copy.tradesHead)}
			<Lines
				name="t-answer"
				text={t(copy.tradesAnswer)}
				x={L.margin}
				y={
					L.headY + lineCount(t(copy.tradesHead), room, T.head) * T.head * 1.35
				}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
			<Brackets name="lock-total" glow />
			<g data-f="two">
				{(
					[
						[copy.grossWin, signed(GROSS_WIN), "wt-film-gain"],
						[copy.grossLoss, signed(-GROSS_LOSS), "wt-film-loss"],
					] as const
				).map(([tag, value, tone], i) => (
					<g key={i}>
						<Word
							name={`gross-tag-${i}`}
							x={L.stackX[i]}
							y={H * 0.28 - (narrow ? 0 : 12)}
							size={T.small}
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`gross-num-${i}`}
							x={L.stackX[i]}
							y={H * 0.35}
							size={T.num}
							className={`wt-film-num ${tone}`}
						>
							{value}
						</Word>
					</g>
				))}
				<Word
					name="w-tag-1"
					x={W * 0.55}
					y={H * 0.72}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.total).toUpperCase()}
				</Word>
				<Word
					name="w-num-1"
					x={W * 0.55}
					y={H * 0.88}
					size={T.big}
					className="wt-film-num wt-film-loss"
				>
					{signed(TOTAL)}
				</Word>
			</g>

			{headline("d-head", copy.ddHead, copy.ddHeadShort)}
			<Lines
				name="f-head"
				text={t(copy.fallHead)}
				x={L.margin}
				y={
					L.headY +
					lineCount(t(narrow ? copy.ddHeadShort : copy.ddHead), room, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
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
	const dots = [
		one("dot-0-low"),
		one("dot-1-low"),
		one("dot-2-high"),
		one("dot-3-high"),
	];
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
		one("bars"),
		one("dd"),
		one("band-1"),
		one("band-2"),
		one("value-line"),
		one("jump"),
		one("jump-label"),
		...dots,
		...trades.flatMap((_, i) => [
			one(`bar-${i}`),
			one(`bar-value-${i}`),
			one(`bar-date-${i}`),
		]),
		one("fall-band"),
		one("line-a"),
		one("line-b"),
		one("label-a"),
		one("label-b"),
		one("peak"),
		one("trough"),
		one("fall-label"),
		...flat("meter"),
		...flat("q"),
		...["w-head", "c-head", "t-head", "t-answer", "d-head", "f-head"].map(
			(name) => one(name),
		),
		...kids("twr"),
		one("dd-start"),
		one("dd-end"),
		...flat("two"),
		lockTotal,
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: three good numbers ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	[0, 1, 2].forEach((i) => {
		show(one(`q-tag-${i}`), 4.6 + i * 0.5);
		land(one(`q-num-${i}`), 4.8 + i * 0.5);
	});
	show(one("q-line"), 5.9);

	// ——— returns: a deposit is not a return ———
	tl.addLabel("returns", 9.4);
	hide(flat("q"), 9.4);
	show(one("w-head"), 9.6, "above");
	rise(9.7);
	draw(one<SVGPathElement>("value-line"), 10.1, 1.4);
	// Endpoints arrive only once the complete trace supports them.
	land(dots[0], 10.1, 0.35);
	dots.slice(1).forEach((dot) => {
		land(dot, 11.5, 0.35);
	});
	// A full second after the final dot, reveal growth already settled.
	show([one("m-growth"), one("m-growth-value")], 12.85, "above");
	tl.to(one("jump"), { opacity: 1, duration: 0.4 }, 12.85);
	show(one("jump-label"), 13.05);
	// Cut at the flow: two periods, each from its own start.
	show(one("c-head"), 12.9);
	tl.to(one("band-1"), { opacity: 1, duration: 0.5 }, 13.0);
	tl.to(one("band-2"), { opacity: 1, duration: 0.5 }, 13.5);
	// Cut: the chained return.
	hide([one("w-head"), one("c-head"), ...flat("meter")], 16.4);
	sink(16.4);
	show(one("twr-tag"), 16.7);
	show(one("twr-sum"), 16.9);
	land(one("twr-num"), 17.2);
	show(one("twr-line"), 16.7);

	// ——— trades: a rate is not a total ———
	tl.addLabel("trades", 21);
	hide(kids("twr"), 21);
	tl.set(one("week"), { opacity: 0 }, 21.1);
	tl.set(one("bars"), { opacity: 1 }, 21.1);
	show(one("t-head"), 21.35, "above");
	rise(21.4);
	trades.forEach((trade, i) => {
		const at = 21.5 + i * 0.3;
		const y = L.barY(trade.pnl);
		tl.fromTo(
			one(`bar-${i}`),
			{ opacity: 1, attr: { y: L.zero, height: 0 } },
			{
				attr: { y: Math.min(y, L.zero), height: Math.abs(y - L.zero) },
				duration: 0.45,
				ease: "power3.out",
			},
			at,
		);
		// Fade in place: a date must not travel through the zero axis.
		tl.fromTo(
			[one(`bar-value-${i}`), one(`bar-date-${i}`)],
			{ opacity: 0 },
			{ opacity: 1, duration: 0.3 },
			at + 0.45,
		);
	});
	// Fifth bar and its labels are settled before the answer appears.
	show([one("m-rate"), one("m-rate-value")], 24.45, "above", 0.35);
	show(one("t-answer"), 24.45, "above", 0.35);
	// Preserve the actual bars: the wins stack on one common scale beside the loss.
	// Labels step aside first so no carried shape crosses settled type.
	hide(
		[
			one("bar-axis"),
			...trades.flatMap((_, i) => [
				one(`bar-value-${i}`),
				one(`bar-date-${i}`),
			]),
		],
		25.8,
		0.35,
		0,
	);
	let accumulated = 0;
	let winIndex = 0;
	trades.forEach((trade, i) => {
		const win = trade.pnl > 0;
		const height = Math.abs(trade.pnl) * L.stackUnit;
		const y = win
			? L.stackBottom - (accumulated + trade.pnl) * L.stackUnit
			: L.stackBottom - height;
		const at = win ? 26.15 + winIndex * 0.15 : 26.15;
		if (win) {
			accumulated += trade.pnl;
			winIndex++;
		}
		tl.to(
			one(`bar-${i}`),
			{
				attr: {
					x: L.stackX[win ? 0 : 1] - L.stackWidth / 2,
					y,
					width: L.stackWidth,
					height,
					rx: 0,
				},
				duration: 0.65,
				ease: "power2.inOut",
			},
			at,
		);
	});
	// Stack finishes at 27.25; no running total can contradict its four parts.
	show([one("gross-tag-0"), one("gross-tag-1")], 27.25, "above", 0.4);
	show([one("gross-num-0"), one("gross-num-1")], 27.25, "above", 0.4);
	hide(
		[one("t-head"), one("t-answer"), one("m-rate"), one("m-rate-value")],
		28.65,
	);
	// One second after the operands settle, their fixed difference lands.
	show(one("w-tag-1"), 28.65, "above");
	land(one("w-num-1"), 28.65);
	d.lock(lockTotal, 30.35, { around: one("w-num-1"), pad: 8 });
	tl.addLabel("hero-lock", 30.35);

	// ——— drawdown: the same return, two paths ———
	tl.addLabel("drawdown", 33.95);
	hide([...flat("two"), lockTotal], 33.95);
	sink(33.95);
	tl.set(one("bars"), { opacity: 0 }, 34.35);
	tl.set(one("dd"), { opacity: 1 }, 34.35);
	show(one("d-head"), 34.3, "above");
	rise(34.35);
	// Both histories draw together; exact endpoints and B's fall finish the proof.
	draw(one<SVGPathElement>("line-a"), 34.4, 1.0);
	draw(one<SVGPathElement>("line-b"), 34.5, 1.0);
	show(one("dd-start"), 34.4);
	show(one("label-a"), 35.2);
	show([one("label-b"), one("dd-end")], 35.5, "above");
	tl.to(one("fall-band"), { opacity: 1, duration: 0.5 }, 35.5);
	land(one("peak"), 35.5, 0.35);
	land(one("trough"), 35.5);
	show(one("fall-label"), 35.5);
	// All proof marks settle at 36.05, followed by one second of quiet.
	show(one("f-head"), 37.05, "above");
	// Cut: the claim.
	hide([one("d-head"), one("f-head")], 41.05);
	sink(41.05);
	tl.fromTo(
		one("z-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
		41.45,
	);
	show(one("z-sub"), 41.85);

	// ——— next ———
	tl.addLabel("next", 45.45);
	hide(kids("claim"), 45.45);
	d.close(45.45);
	return tl;
}

export const portfolioPerformanceFilm: Film = {
	id: "portfolio-performance",
	label: [
		`Performance, as a short film: three good numbers, balance growth ${pct(GROWTH, 1)}, an ${Math.round(WIN_RATE * 100)}% win rate and a ${pct(totalReturn(deep), 0)} return; your account from ${dollars(OPEN)} to ${dollars(WEEK_END)} with a ${dollars(yourAccount.deposit)} deposit, cut at the deposit into ${pct(R1)} and ${pct(R2)} for a time-weighted ${pct(TWR)}; five trades, four wins and one loss, ${signed(TOTAL)} in total from ${signed(GROSS_WIN)} against ${signed(-GROSS_LOSS)}; and two accounts both up ${pct(totalReturn(steady), 0)}, one of which fell ${pct(-worstB.fall, 0).replace("+", "")} on the way`,
		`绩效短片：三个好看的数字，余额增长 ${pct(GROWTH, 1)}、胜率 ${Math.round(WIN_RATE * 100)}%、收益 ${pct(totalReturn(deep), 0)}；你的账户从 ${dollars(OPEN)} 到 ${dollars(WEEK_END)}，中间存入 ${dollars(yourAccount.deposit)}，在存入处切开得到 ${pct(R1)} 和 ${pct(R2)}，时间加权 ${pct(TWR)}；五笔交易，四赚一亏，合计 ${signed(TOTAL)}，由 ${signed(GROSS_WIN)} 与 ${signed(-GROSS_LOSS)} 相加得到；以及两个都上涨 ${pct(totalReturn(steady), 0)} 的账户，其中一个途中跌了 ${pct(-worstB.fall, 0).replace("+", "")}`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Performance", "绩效"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "returns", label: ["Returns", "收益"] },
		{ id: "trades", label: ["Win rate", "胜率"] },
		{ id: "drawdown", label: ["Drawdown", "回撤"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
