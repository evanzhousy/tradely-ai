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
	toneClass,
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
const growthFactor = (rate: number) => (1 + rate).toFixed(2);

function layout(width: number) {
	const frame = filmFrame(width);
	const { height, narrow } = frame;
	const left = Math.max(frame.margin, narrow ? 46 : 0);
	const right = width * 0.965;
	const top = height * (narrow ? 0.38 : 0.3);
	const bottom = height * 0.84;
	const span = right - left;
	const periodTop = narrow
		? Math.max(
				height * 0.22,
				frame.headY + frame.type.head * 1.35 + frame.type.small * 1.8,
			)
		: height * 0.18;
	const periodStep = Math.max(height * 0.09, frame.type.small * 3.5);
	// At the minimum phone width, reserve room for the two balance/rate pairs.
	const weekTop = narrow
		? Math.max(height * 0.44, periodTop + periodStep + frame.type.small * 2.7)
		: height * 0.34;
	// The week: four moments, padded at both ends.
	const vx = (i: number) => left + ((i + 0.35) / 3.7) * span;
	const vy = (dollars: number) =>
		bottom -
		((dollars - VALUE_Y[0]) / (VALUE_Y[1] - VALUE_Y[0])) * (bottom - weekTop);
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
		weekTop,
		periodTop,
		periodStep,
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
	qLine: ["Each number has blind spots.", "每个数字都有盲点。"],
	weekHead: [
		"Your week, with your own deposit in it.",
		"你的这一周，含你自己的存入。",
	],
	weekHeadShort: ["Your week, deposit included.", "这一周，含存入。"],
	cutHead: ["Cut at the deposit.", "在存入处切开。"],
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
		"Multiply period growth, excluding deposits.",
		"各段增长相乘，剔除存入。",
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
	ddAxis: ["month-end values", "月末价值"],
	accountA: ["account A", "账户 A"],
	accountB: ["account B", "账户 B"],
	claimBig: ["Each measure answers one question.", "每个度量只回答一个问题。"],
	claimSub: [
		"Exclude deposits; compare trade amounts; inspect paths.",
		"剔除存入，比金额，看路径。",
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
		[copy.qWin, `${Math.round(WIN_RATE * 100)}%`, toneClass.focus],
		[
			narrow ? copy.qReturnShort : copy.qReturn,
			pct(totalReturn(deep), 0),
			"wt-film-gain",
		],
	] as const;
	const jumpX = L.vx(2);
	const twrFactors = [growthFactor(R1), growthFactor(R2)] as const;
	const periodRates = [R1, R2] as const;
	const periodIndices = [
		[0, 1],
		[2, 3],
	] as const;
	const twrTagY = narrow ? H * 0.28 : H * 0.22;
	const twrSumY = narrow ? H * 0.39 : H * 0.29;
	const twrFactorWaypointY = L.weekTop - (T.head * 0.6 + 6);
	const twrSumCharWidth = T.head * 0.62;
	const twrSumLength =
		twrFactors[0].length + " × ".length + twrFactors[1].length + " − 1".length;
	const twrFactorTargetX = (i: 0 | 1) => {
		const prefix = i === 0 ? 0 : twrFactors[0].length + " × ".length;
		return (
			W / 2 -
			(twrSumLength * twrSumCharWidth) / 2 +
			(prefix + twrFactors[i].length / 2) * twrSumCharWidth
		);
	};
	const twrFactorSourceX = (i: 0 | 1) => {
		const rate = periodRates[i];
		const [from, to] = periodIndices[i];
		const x = narrow ? W / 2 : (L.vx(from) + L.vx(to)) / 2;
		const equation = `1 + (${pct(rate)}) ≈`;
		const factor = twrFactors[i];
		const charWidth = T.small * 0.62;
		const equationX =
			x - ((equation.length + 1 + factor.length) * charWidth) / 2;
		return equationX + (equation.length + 1 + factor.length / 2) * charWidth;
	};
	const twrWaypointX = (i: 0 | 1) =>
		(twrFactorSourceX(i) + twrFactorTargetX(i)) / 2;
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
								["band-1", 0, 1],
								["band-2", 2, 3],
							] as const
						).map(([name, from, to]) => (
							<g key={name} data-f={name}>
								<rect
									x={L.vx(from)}
									y={L.weekTop}
									width={L.vx(to) - L.vx(from)}
									height={L.bottom - L.weekTop}
									className="wt-band-gain"
								/>
							</g>
						))}
						{/* End/start uses each period's own opening balance.
						    The rate and its growth factor stay paired before they multiply. */}
						{[
							{ start: OPEN, end: CLOSE, rate: R1, from: 0, to: 1 },
							{ start: AFTER_DEPOSIT, end: WEEK_END, rate: R2, from: 2, to: 3 },
						].map(({ start, end, rate, from, to }, i) => {
							const x = narrow ? W / 2 : (L.vx(from) + L.vx(to)) / 2;
							const y = L.periodTop + (narrow ? i * L.periodStep : 0);
							const equation = `1 + (${pct(rate)}) ≈`;
							const factor = growthFactor(rate);
							const charWidth = T.small * 0.62;
							const equationX =
								x - ((equation.length + 1 + factor.length) * charWidth) / 2;
							return (
								<g key={from} data-f={`period-${i + 1}`}>
									<Word
										name={`period-balances-${i + 1}`}
										x={x}
										y={y}
										size={T.small}
										className="wt-film-num"
									>
										{`${dollars(end)} ÷ ${dollars(start)} − 1`}
									</Word>
									<Word
										name={`period-rate-${i + 1}`}
										x={equationX}
										y={y + T.small * 1.85}
										size={T.small}
										anchor="start"
										className="wt-film-num"
									>
										{equation}
									</Word>
									<Word
										name={`period-factor-${i + 1}`}
										x={equationX + (equation.length + 1) * charWidth}
										y={y + T.small * 1.85}
										size={T.small}
										anchor="start"
										className="wt-film-num"
									>
										{factor}
									</Word>
								</g>
							);
						})}
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
							y={L.my(steady[steady.length - 1]) - 28}
							textAnchor="end"
							className="wt-small wt-halo"
						>
							{dollars(steady[steady.length - 1] * 100)}
							<tspan className="wt-gain">{` · ${pct(totalReturn(steady), 0)}`}</tspan>
						</text>
						<path
							data-f="line-a"
							d={L.ddPath(steady)}
							className="wt-line-position"
							style={{ stroke: "var(--tone-dim)", strokeWidth: 2.5 }}
						/>
						<path
							data-f="line-b"
							d={L.ddPath(deep)}
							className="wt-line-position"
							style={{ strokeWidth: 2.5 }}
						/>
						<text
							data-f="label-a"
							x={L.mx(5)}
							y={L.my(steady[5]) - 12}
							textAnchor="middle"
							className="wt-small wt-halo wt-marker-label"
							style={{ fill: "var(--tone-dim)" }}
						>
							{t(copy.accountA)}
						</text>
						<text
							data-f="label-b"
							x={L.mx(5) + 8}
							y={L.my(deep[5]) + 18}
							className={`wt-small wt-halo ${toneClass.focus}`}
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
						["growth", copy.growthTag, pct(GROWTH, 1), toneClass.up],
						[
							"rate",
							copy.winRate,
							`${Math.round(WIN_RATE * 100)}%`,
							toneClass.focus,
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
					y={twrTagY}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.twrTag).toUpperCase()}
				</Word>
				<Word
					name="twr-sum"
					x={W / 2}
					y={twrSumY}
					size={T.head}
					className="wt-film-num"
				>
					<tspan>{growthFactor(R1)}</tspan>
					<tspan> × </tspan>
					<tspan>{growthFactor(R2)}</tspan>
					<tspan> − 1</tspan>
				</Word>
				<Word
					name="twr-num"
					x={W / 2}
					y={twrSumY + T.big * 1.1}
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
			<g data-f="twr-waypoints">
				{twrFactors.map((factor, i) => (
					<Word
						key={factor}
						name={`twr-factor-waypoint-${i + 1}`}
						x={twrWaypointX(i as 0 | 1)}
						y={twrFactorWaypointY}
						size={T.head}
						className="wt-film-num"
					>
						{factor}
					</Word>
				))}
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
	const { narrow } = L;
	const d = createDirector(context, L, END);
	const { tl, one, kids, show, hide } = d;
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
	// These are comparisons of completed histories, not walks through elapsed time.
	// Fade scaffolds at their final scale, then reveal the complete data together.
	const chartIn = (at: number) =>
		tl.to(one("depth"), { opacity: 1, duration: 0.3 }, at);
	const chartOut = (at: number) =>
		tl.to(one("depth"), { opacity: 0, duration: 0.4, ease: "power2.in" }, at);
	const reveal = (targets: Element[], at: number, duration: number) =>
		tl.to(targets, { opacity: 1, duration }, at);
	tl.set(one("depth"), { scale: 1 }, 0);

	const lockTotal = one<SVGGraphicsElement>("lock-total");

	d.hidden([
		one("bars"),
		one("dd"),
		one("band-1"),
		one("band-2"),
		one("period-1"),
		one("period-2"),
		one("period-factor-1"),
		one("period-factor-2"),
		one("value-line"),
		one("jump"),
		one("jump-label"),
		...dots,
		...trades.flatMap((_, i) => [
			one(`bar-${i}`),
			one(`bar-value-${i}`),
			one(`bar-date-${i}`),
		]),
		one("line-a"),
		one("line-b"),
		one("label-a"),
		one("label-b"),
		one("peak"),
		one("trough"),
		one("fall-label"),
		...flat("meter"),
		...flat("q"),
		...["w-head", "c-head", "t-head", "t-answer", "d-head"].map((name) =>
			one(name),
		),
		...kids("twr"),
		...kids("twr-waypoints"),
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
	chartIn(9.7);
	// Scaffold settled at 10.0; headline at 10.1. Preserve the 11.85 proof finish.
	reveal([one("value-line"), ...dots], 11.3, 0.55);
	// A full second after the final dot, focus on the deposit without repeating growth.
	tl.to(one("jump"), { opacity: 1, duration: 0.4 }, 12.85);
	show(one("jump-label"), 13.05);
	// Cut at the flow: two periods, each from its own start.
	show(one("c-head"), 12.9);
	reveal([one("band-1"), one("period-1")], 13.0, 0.5);
	reveal([one("band-2"), one("period-2")], 13.5, 0.5);
	// The factors finish their in-place reveal before the carry begins, leaving a
	// clear 1× reading interval at full contrast.
	tl.to(one("period-factor-1"), { opacity: 1, duration: 0.3 }, 14.0);
	tl.to(one("period-factor-2"), { opacity: 1, duration: 0.3 }, 14.25);
	// The two growth factors travel together into the product; balances and inputs
	// remain complete until the chart and its headline leave at the handover.
	const factorLegDurations = narrow ? [0.3, 0.3] : [0.4, 0.35];
	const factorCarryDuration = factorLegDurations[0] + factorLegDurations[1];
	const factorCarryGap = 0.25;
	const firstFactorCarryAt = 16.4 - factorCarryDuration - factorCarryGap;
	[R1, R2].forEach((rate, i) => {
		const at = firstFactorCarryAt + i * factorCarryGap;
		const factor = growthFactor(rate);
		const waypoint = one<SVGTextElement>(`twr-factor-waypoint-${i + 1}`);
		const firstLegEnd = at + factorLegDurations[0];
		d.carry(one<SVGTextElement>(`period-factor-${i + 1}`), waypoint, at, {
			arc: "y",
			duration: factorLegDurations[0],
			keep: true,
			match: factor,
		});
		d.carry(waypoint, one<SVGTextElement>("twr-sum"), firstLegEnd, {
			arc: "y",
			duration: factorLegDurations[1],
			match: factor,
			reveal: i === 1,
		});
	});
	// Cut: the chained return.
	hide([one("w-head"), one("c-head"), ...flat("meter")], 16.4);
	chartOut(16.4);
	show(one("twr-tag"), 16.7);
	land(one("twr-num"), 17.2);
	show(one("twr-line"), 16.7);

	// ——— trades: a rate is not a total ———
	tl.addLabel("trades", 21);
	hide(kids("twr"), 21);
	tl.set(one("week"), { opacity: 0 }, 21.1);
	tl.set(one("bars"), { opacity: 1 }, 21.1);
	show(one("t-head"), 21.35, "above");
	chartIn(21.4);
	reveal(
		trades.map((_, i) => one(`bar-date-${i}`)),
		21.4,
		0.3,
	);
	// Axes/dates settle at 21.7, headline at 21.85; no serial histogram stagger.
	// All five comparisons settle at the original 23.45, preserving the quiet second.
	reveal(
		trades.flatMap((_, i) => [one(`bar-${i}`), one(`bar-value-${i}`)]),
		22.9,
		0.55,
	);
	// The complete histogram rests for a second before the answer appears.
	show([one("m-rate"), one("m-rate-value")], 24.45, "above", 0.35);
	show(one("t-answer"), 24.45, "above", 0.35);
	// Preserve the actual bars: the wins stack on one common scale beside the loss.
	// Labels step aside first so no carried shape crosses settled type.
	hide(
		[
			one("bar-axis"),
			...trades.flatMap((_, i) => [
				...(i === 2 ? [] : [one(`bar-value-${i}`)]),
				one(`bar-date-${i}`),
			]),
		],
		25.8,
		0.35,
		0,
	);
	// The loss fades in place while wins travel across its column.
	hide(one("bar-2"), 25.8, 0.35, 0);
	// Keep its signed amount in the clear lower lane through the regrouping, then hand it
	// to the gross-loss amount as that number enters the settled stack.
	hide(one("bar-value-2"), 26.9, 0.35, 0);
	let accumulated = 0;
	let winIndex = 0;
	trades.forEach((trade, i) => {
		const win = trade.pnl > 0;
		const height = Math.abs(trade.pnl) * L.stackUnit;
		const y = win
			? L.stackBottom - (accumulated + trade.pnl) * L.stackUnit
			: L.stackBottom - height;
		const x = L.stackX[win ? 0 : 1] - L.stackWidth / 2;
		if (win) {
			accumulated += trade.pnl;
			// Settle every win into its own vertical interval before any slides sideways.
			tl.to(
				one(`bar-${i}`),
				{
					attr: { y, width: L.stackWidth, height, rx: 0 },
					duration: 0.35,
					ease: "power2.inOut",
				},
				26.15,
			);
			tl.to(
				one(`bar-${i}`),
				{ attr: { x }, duration: 0.3, ease: "power2.inOut" },
				26.5 + winIndex * 0.15,
			);
			winIndex++;
		} else {
			// Relocate only while invisible; return after all horizontal paths are clear.
			tl.set(
				one(`bar-${i}`),
				{ attr: { x, y, width: L.stackWidth, height, rx: 0 } },
				26.15,
			);
			tl.fromTo(
				one(`bar-${i}`),
				{ opacity: 0 },
				{ opacity: 1, duration: 0.4 },
				27.25,
			);
		}
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
	chartOut(33.95);
	tl.set(one("bars"), { opacity: 0 }, 34.35);
	tl.set(one("dd"), { opacity: 1 }, 34.35);
	show(one("d-head"), 34.0, "above");
	chartIn(34.35);
	// Paths, account labels and exact endpoints establish the comparison first.
	reveal(
		[
			one("line-a"),
			one("line-b"),
			one("dd-start"),
			one("dd-end"),
			one("label-a"),
			one("label-b"),
		],
		35.65,
		0.4,
	);
	// After one quiet second, mark the peak, trough and signed drawdown together.
	reveal([one("peak"), one("trough"), one("fall-label")], 37.05, 0.4);
	// Cut: the claim.
	hide(one("d-head"), 41.05);
	chartOut(41.05);
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
