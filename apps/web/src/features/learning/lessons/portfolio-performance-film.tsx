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
	PROFIT_FACTOR,
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
 * trades won, but one loss outweighs them: −$155, a profit factor of 0.80. Two accounts
 * both made 10%, and one of them fell 25% on the way.
 *
 *   open      0–4        "Performance"
 *   question  4–9.6      +21.9% · 80% · +10%
 *   returns   9.6–20.6   the account's week and its deposit; +4.00% and +1.00%; cut: +5.04%
 *   trades    20.6–32.8  five trades, 80% won, −$155; cut: 80% against −$155, locked
 *   drawdown  32.8–44.6  A and B, both +10%; B's −25%; cut: "Each measure answers one
 *                        question."
 *   next      44.6–47.1  Next: portfolio Greeks
 */

const END = 47.1;
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
		pair: narrow ? [0.27, 0.73] : [0.32, 0.68],
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
		`Growth counts your own money; ${pct(TWR)} is what it earned.`,
		`增长算进了你自己的钱；${pct(TWR)} 才是资金赚到的。`,
	],
	tradesHead: [
		`Your last ${trades.length} trades: ${WINS.length} won.`,
		`最近 ${trades.length} 笔交易：${WINS.length} 笔赚钱。`,
	],
	totalHead: [
		`One loss outweighs them: ${signed(TOTAL)} in total.`,
		`一笔亏损超过了它们：合计 ${signed(TOTAL)}。`,
	],
	winRate: ["win rate", "胜率"],
	total: ["total", "合计"],
	tradesLine: [
		`Win rate counts trades, not dollars. Profit factor: ${dollars(GROSS_WIN)} ÷ ${dollars(GROSS_LOSS)} = ${PROFIT_FACTOR.toFixed(2)}.`,
		`胜率数的是笔数，不是金额。盈利因子：${dollars(GROSS_WIN)} ÷ ${dollars(GROSS_LOSS)} = ${PROFIT_FACTOR.toFixed(2)}。`,
	],
	ddHead: [
		`Two accounts, both ${pct(totalReturn(steady), 0)} from January to August.`,
		`两个账户，一月到八月都是 ${pct(totalReturn(steady), 0)}。`,
	],
	ddHeadShort: [
		`Two accounts, both ${pct(totalReturn(steady), 0)}.`,
		`两个账户，都是 ${pct(totalReturn(steady), 0)}。`,
	],
	fallHead: [
		`B fell ${pct(-worstB.fall, 0).replace("+", "")} on the way; A held.`,
		`B 途中跌了 ${pct(-worstB.fall, 0).replace("+", "")}；A 几乎没跌。`,
	],
	fallHeadShort: [
		`B fell ${pct(-worstB.fall, 0).replace("+", "")} on the way.`,
		`B 途中跌了 ${pct(-worstB.fall, 0).replace("+", "")}。`,
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
						<path d={`M${L.left} ${L.zero}H${L.right}`} className="wt-axis" />
						{trades.map((trade, i) => {
							const x = L.barX(i);
							const y = L.barY(trade.pnl);
							const win = trade.pnl > 0;
							return (
								<g key={trade.id}>
									<rect
										data-f={`bar-${i}`}
										className="wt-film-bar"
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
						/>
						<circle
							data-f="trough"
							cx={L.mx(worstB.troughAt)}
							cy={L.my(deep[worstB.troughAt])}
							r={6}
							className="wt-chip"
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
						["m-growth", copy.growthTag],
						["m-rate", copy.winRate],
						["m-total", copy.total],
					] as const
				).map(([name, tag]) => (
					<Word
						key={name}
						name={name}
						x={L.right}
						y={L.headY + T.head * 1.25}
						size={T.small}
						anchor="end"
						className="wt-film-tag"
					>
						{t(tag).toUpperCase()}
					</Word>
				))}
				<Word
					name="m-value"
					x={L.right}
					y={L.headY + T.head * 1.25 + T.num * 1.05}
					size={T.num}
					anchor="end"
					className="wt-film-num wt-film-accent"
				>
					{pct(0, 1)}
				</Word>
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
			{headline("o-head", copy.totalHead, copy.totalHead)}
			<Brackets name="lock-total" glow />
			<g data-f="two">
				{(
					[
						[copy.winRate, `${Math.round(WIN_RATE * 100)}%`, "wt-film-gain"],
						[copy.total, signed(TOTAL), "wt-film-loss"],
					] as const
				).map(([tag, num, tone], i) => (
					<g key={tag[0]}>
						<Word
							name={`w-tag-${i}`}
							x={W * L.pair[i]}
							y={H * 0.3}
							size={T.small}
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`w-num-${i}`}
							x={W * L.pair[i]}
							y={H * 0.3 + T.big * 0.95}
							size={T.big * 0.85}
							className={`wt-film-num ${tone}`}
						>
							{num}
						</Word>
					</g>
				))}
				<Lines
					name="w-line"
					text={t(copy.tradesLine)}
					x={W / 2}
					y={H * 0.72}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("d-head", copy.ddHead, copy.ddHeadShort)}
			<Lines
				name="f-head"
				text={t(narrow ? copy.fallHeadShort : copy.fallHead)}
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
	const meter = one<SVGTextElement>("m-value");
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
	const percent = (fraction: number) => pct(fraction, 1);
	const whole = (value: number) => `${Math.round(value)}%`;

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
		...kids("meter"),
		...flat("q"),
		...["w-head", "c-head", "t-head", "o-head", "d-head", "f-head"].map(
			(name) => one(name),
		),
		...kids("twr"),
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
	show(one("q-line"), 6.0);

	// ——— returns: a deposit is not a return ———
	tl.addLabel("returns", 9.6);
	hide(flat("q"), 9.6);
	show(one("w-head"), 9.8, "above");
	rise(9.9);
	draw(one<SVGPathElement>("value-line"), 10.3, 1.4);
	dots.forEach((dot, i) => {
		land(dot, 10.3 + [0, 0.35, 1.0, 1.4][i], 0.35);
	});
	show([one("m-growth"), meter], 10.5, "above");
	d.count(meter, GROWTH, 10.5, percent, 0, 1.4);
	tl.to(one("jump"), { opacity: 1, duration: 0.4 }, 12.0);
	show(one("jump-label"), 12.2);
	// Cut at the flow: two periods, each from its own start.
	show(one("c-head"), 13.5);
	tl.to(one("band-1"), { opacity: 1, duration: 0.5 }, 13.6);
	tl.to(one("band-2"), { opacity: 1, duration: 0.5 }, 14.1);
	// Cut: the chained return.
	hide([one("w-head"), one("c-head"), ...kids("meter")], 17.0);
	sink(17.0);
	show(one("twr-tag"), 17.3);
	show(one("twr-sum"), 17.6);
	land(one("twr-num"), 18.1);
	show(one("twr-line"), 18.6);

	// ——— trades: a rate is not a total ———
	tl.addLabel("trades", 20.6);
	hide(kids("twr"), 20.6);
	tl.set(one("week"), { opacity: 0 }, 20.7);
	tl.set(one("bars"), { opacity: 1 }, 20.7);
	show(one("t-head"), 20.95, "above");
	rise(21.0);
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
		show([one(`bar-value-${i}`), one(`bar-date-${i}`)], at + 0.2);
	});
	show([one("m-rate"), meter], 22.4, "above");
	d.count(meter, WIN_RATE * 100, 22.4, whole, 0, 0.8);
	d.swap(one("t-head"), one("o-head"), 24.5);
	tl.to(
		trades.flatMap((trade, i) => (trade.pnl > 0 ? [one(`bar-${i}`)] : [])),
		{ opacity: 0.35, duration: 0.4 },
		24.6,
	);
	// The meter's tag changes from above: from below it would cross the figure.
	hide(one("m-rate"), 24.5);
	show(one("m-total"), 24.85, "above");
	d.count(meter, TOTAL, 24.85, signed, WIN_RATE * 100, 0.01);
	// Cut: the rate against the total. The hero: one loss outweighs four wins.
	hide([one("o-head"), ...kids("meter")], 28.4);
	sink(28.4);
	show(one("w-tag-0"), 28.7);
	land(one("w-num-0"), 28.9);
	show(one("w-tag-1"), 29.2);
	land(one("w-num-1"), 29.4);
	d.lock(lockTotal, 30.0, { around: one("w-num-1"), pad: 8 });
	tl.addLabel("hero-lock", 30.0);
	show(one("w-line"), 30.3);

	// ——— drawdown: the same return, two paths ———
	tl.addLabel("drawdown", 32.8);
	hide([...flat("two"), lockTotal], 32.8);
	tl.set(one("bars"), { opacity: 0 }, 32.9);
	tl.set(one("dd"), { opacity: 1 }, 32.9);
	show(one("d-head"), 33.15, "above");
	rise(33.2);
	draw(one<SVGPathElement>("line-a"), 33.7, 1.2);
	show(one("label-a"), 34.6);
	draw(one<SVGPathElement>("line-b"), 34.9, 1.2);
	show(one("label-b"), 35.9);
	tl.to(one("fall-band"), { opacity: 1, duration: 0.5 }, 36.0);
	land(one("peak"), 36.1, 0.35);
	land(one("trough"), 36.3);
	show(one("fall-label"), 36.4);
	show(one("f-head"), 36.65);
	// Cut: the claim.
	hide([one("d-head"), one("f-head")], 40.2);
	sink(40.2);
	tl.fromTo(
		one("z-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
		40.6,
	);
	show(one("z-sub"), 41.0);

	// ——— next ———
	tl.addLabel("next", 44.6);
	hide(kids("claim"), 44.6);
	d.close(44.6);
	return tl;
}

export const portfolioPerformanceFilm: Film = {
	id: "portfolio-performance",
	label: [
		`Performance, as a short film: three good numbers, balance growth ${pct(GROWTH, 1)}, an ${Math.round(WIN_RATE * 100)}% win rate and a ${pct(totalReturn(deep), 0)} return; your account from ${dollars(OPEN)} to ${dollars(WEEK_END)} with a ${dollars(yourAccount.deposit)} deposit, cut at the deposit into ${pct(R1)} and ${pct(R2)} for a time-weighted ${pct(TWR)}; five trades, four wins and one loss, ${signed(TOTAL)} in total and a profit factor of ${PROFIT_FACTOR.toFixed(2)}; and two accounts both up ${pct(totalReturn(steady), 0)}, one of which fell ${pct(-worstB.fall, 0).replace("+", "")} on the way`,
		`绩效短片：三个好看的数字，余额增长 ${pct(GROWTH, 1)}、胜率 ${Math.round(WIN_RATE * 100)}%、收益 ${pct(totalReturn(deep), 0)}；你的账户从 ${dollars(OPEN)} 到 ${dollars(WEEK_END)}，中间存入 ${dollars(yourAccount.deposit)}，在存入处切开得到 ${pct(R1)} 和 ${pct(R2)}，时间加权 ${pct(TWR)}；五笔交易，四赚一亏，合计 ${signed(TOTAL)}，盈利因子 ${PROFIT_FACTOR.toFixed(2)}；以及两个都上涨 ${pct(totalReturn(steady), 0)} 的账户，其中一个途中跌了 ${pct(-worstB.fall, 0).replace("+", "")}`,
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
