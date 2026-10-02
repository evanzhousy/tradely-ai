import * as m from "motion/react-m";
import {
	type Contract,
	type Copy,
	dayCount,
	modelValue,
	pick,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import { Label, Stage, useTeachMotion } from "../walkthrough/stage";
import { packParts, twoRows } from "../walkthrough/text-measure";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

const SPOT = 100;
const IV = 35;
const DAYS = 32;
/** One standard deviation of the price at expiry, in dollars, under the model. */
const oneSd = (iv: number, days: number) =>
	SPOT * (iv / 100) * Math.sqrt(days / 365);
const MOVE = oneSd(IV, DAYS);
const share = (dollars: number) => usd(Math.round(dollars * 100));
const plusMinus = (dollars: number) => `±${share(dollars)}`;

const CALL: Contract = { expiry: "oct18", strike: 100, right: "call" };
const PUT: Contract = { expiry: "oct18", strike: 100, right: "put" };
const STRADDLE = modelValue(CALL).price + modelValue(PUT).price;

/** A price axis with the stock at its center and up to two ranges around it. */
function RangeAxis({
	width,
	min,
	max,
	ranges,
	header,
	lines,
}: {
	width: number;
	min: number;
	max: number;
	ranges: readonly {
		id: string;
		half: number;
		label: string;
		tone: "sd" | "straddle";
		hidden?: boolean;
	}[];
	header: string;
	/** Working under the axis; the strong line is the result. */
	lines: readonly { text: string; strong?: boolean }[];
}) {
	const motion = useTeachMotion();
	const left = 24;
	const right = width - 24;
	const x = (price: number) =>
		left +
		((Math.min(Math.max(price, min), max) - min) / (max - min)) *
			(right - left);
	const axis = 118;
	const step = (max - min) / (width < 520 ? 4 : 8);
	const ticks = Array.from(
		{ length: Math.round((max - min) / step) + 1 },
		(_, i) => min + i * step,
	);
	// On a phone a long line of working takes a second row rather than shrinking.
	let baseline = axis + 76 - 18;
	const rows = lines.flatMap((line) =>
		(width < 520
			? twoRows(line.text, width - 28, line.strong ? 13 : 11)
			: [line.text]
		).map((text, row) => {
			baseline += row === 0 ? 18 : 15;
			return { line, text, row, y: baseline };
		}),
	);
	return (
		<g>
			<Label x={left - 10} y={18} tone="muted" maxWidth={width - 28}>
				{header}
			</Label>
			{ranges.map((range) => {
				const top = range.tone === "sd" ? 38 : 66;
				const height = range.tone === "sd" ? 70 : 42;
				const from = x(SPOT - range.half);
				const to = x(SPOT + range.half);
				// A narrow range would put its two price labels on top of each other: keep them
				// at least a label's width apart around the range's middle.
				const gap = Math.max(to - from, 64);
				const ends = [(from + to) / 2 - gap / 2, (from + to) / 2 + gap / 2];
				return (
					<m.g
						key={range.id}
						initial={false}
						animate={{ opacity: range.hidden ? 0 : 1 }}
						transition={motion.fade}
					>
						<m.rect
							y={top}
							height={height}
							rx={4}
							className={range.tone === "sd" ? "wt-long-soft" : "wt-short-soft"}
							initial={false}
							animate={{ x: from, width: Math.max(to - from, 1) }}
							transition={motion.move}
						/>
						<m.text
							y={top + 14}
							textAnchor="middle"
							className="wt-small"
							initial={false}
							animate={{ x: (from + to) / 2 }}
							transition={motion.move}
						>
							{range.label}
						</m.text>
						{[SPOT - range.half, SPOT + range.half].map((price, side) => (
							<m.text
								key={side}
								y={axis + (range.tone === "sd" ? 34 : 50)}
								textAnchor="middle"
								className={range.tone === "sd" ? "wt-accent" : "wt-small"}
								initial={false}
								animate={{
									x: Math.min(Math.max(ends[side], left + 22), right - 22),
								}}
								transition={motion.move}
							>
								{share(price)}
							</m.text>
						))}
					</m.g>
				);
			})}
			<path d={`M${left} ${axis}H${right}`} className="wt-axis" />
			{ticks.map((tick) => (
				<g key={tick}>
					<path d={`M${x(tick)} ${axis}v4`} className="wt-axis" />
					<Label x={x(tick)} y={axis + 16} anchor="middle" tone="small">
						{`$${Math.round(tick)}`}
					</Label>
				</g>
			))}
			<circle cx={x(SPOT)} cy={axis} r={5} className="wt-long" />
			{rows.map(({ line, text, row, y }) => (
				<Label
					key={`${line.text}-${row}`}
					x={left - 10}
					y={y}
					tone={line.strong ? undefined : "small"}
					maxWidth={width - 28}
				>
					{text}
				</Label>
			))}
		</g>
	);
}

// ——— Scene 1: from implied volatility to a range ———

type SdState = { stage: 0 | 1 | 2; iv: number; days: number };

function SdView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SdState;
	explore: SdState | null;
	setExplore: (next: SdState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const annual = SPOT * (shown.iv / 100);
	const move = shown.stage === 0 ? annual : oneSd(shown.iv, shown.days);
	const factor = Math.sqrt(shown.days / 365);
	const year = {
		text: t([
			`a year: $${SPOT} × ${shown.iv}% = ±${share(annual)}`,
			`一年：$${SPOT} × ${shown.iv}% = ±${share(annual)}`,
		]),
		strong: shown.stage === 0,
	};
	const lines =
		shown.stage === 0
			? [year]
			: [
					year,
					{
						text: t([
							`${dayCount(shown.days)}: × √(${shown.days} ÷ 365) = × ${factor.toFixed(3)}`,
							`${shown.days} 天：× √(${shown.days} ÷ 365) = × ${factor.toFixed(3)}`,
						]),
					},
					{
						text: t([
							`one SD: ${plusMinus(move)}`,
							`一个标准差：${plusMinus(move)}`,
						]),
						strong: true,
					},
					...(shown.stage >= 2
						? [
								{
									text: t([
										"about 68% of outcomes land inside, under the model",
										"按模型，约 68% 的结果落在其中",
									]),
								},
							]
						: []),
				];
	const result: ResultItem[] = [
		{
			id: "iv",
			label: t(["Implied volatility", "隐含波动率"]),
			value: `${shown.iv}%`,
			note: t(["a year, annualized", "按年计"]),
		},
		{
			id: "move",
			label:
				shown.stage === 0
					? t(["One SD over a year", "一年的一个标准差"])
					: t([
							`One SD in ${dayCount(shown.days)}`,
							`${shown.days} 天的一个标准差`,
						]),
			value: plusMinus(move),
			note: t([
				`${share(SPOT - move)} to ${share(SPOT + move)}`,
				`${share(SPOT - move)} 至 ${share(SPOT + move)}`,
			]),
			tone: "gain",
			evidence: "modeled",
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"ALFA's one-standard-deviation range implied by its option prices, first over a year, then over the days to expiry",
						"由 ALFA 期权价格隐含的一个标准差区间：先按一年，再按到期前的天数",
					])}
					height={(width) => (width < 520 ? 280 : 270)}
				>
					{(width) => (
						<RangeAxis
							width={width}
							min={60}
							max={140}
							header={t([
								`ALFA $${SPOT} · IV ${shown.iv}%${shown.stage === 0 ? " · a year" : ` · ${dayCount(shown.days)}`}`,
								`ALFA $${SPOT} · IV ${shown.iv}%${shown.stage === 0 ? " · 一年" : ` · ${shown.days} 天`}`,
							])}
							ranges={[
								{
									id: "sd",
									half: move,
									label: t(["1 SD", "1 个标准差"]),
									tone: "sd",
								},
							]}
							lines={lines}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<>
						<RangeControl
							label={t(["Implied volatility", "隐含波动率"])}
							value={explore.iv}
							display={`${explore.iv}%`}
							min={15}
							max={60}
							onChange={(iv) => setExplore({ ...explore, iv })}
						/>
						<RangeControl
							label={t(["Days to expiry", "到期天数"])}
							value={explore.days}
							display={t([dayCount(explore.days), `${explore.days} 天`])}
							min={1}
							max={60}
							onChange={(days) => setExplore({ ...explore, days })}
						/>
					</>
				) : null
			}
			details={
				<p>
					{t([
						"Implied volatility is quoted per year. To get a move over a shorter time, scale it by the square root of the fraction of a year: a quarter of the time is half the move, not a quarter of it. This course counts calendar days over 365; many desks count trading days over 252, which gives a slightly different number for the same IV, so say which you used. The result is one standard deviation of a model's distribution, not a forecast: the model assumes moves without jumps, and real stocks jump.",
						"隐含波动率按年报价。要得到更短时间内的变动，就乘以时间占一年比例的平方根：四分之一的时间对应一半的变动，而不是四分之一。本课按自然日除以 365 计算；许多交易台按交易日除以 252 计算，同样的 IV 会得出略有不同的数，所以要说明你用的是哪种。结果是模型分布的一个标准差，不是预测：模型假设价格没有跳空，而真实的股票会跳空。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: the straddle prices the average move ———

type StraddleState = { show: "sd" | "straddle" | "both" };

function StraddleView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: StraddleState;
	explore: StraddleState | null;
	setExplore: (next: StraddleState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const ratio = STRADDLE / MOVE;
	const lines = [
		shown.show !== "sd"
			? {
					text: t([
						`straddle: call ${share(modelValue(CALL).price)} + put ${share(modelValue(PUT).price)} = ${share(STRADDLE)}`,
						`跨式：看涨 ${share(modelValue(CALL).price)} + 看跌 ${share(modelValue(PUT).price)} = ${share(STRADDLE)}`,
					]),
					strong: shown.show === "straddle",
				}
			: {
					text: t([
						`one SD in ${DAYS} days: ${plusMinus(MOVE)}`,
						`${DAYS} 天的一个标准差：${plusMinus(MOVE)}`,
					]),
					strong: true,
				},
		...(shown.show === "both"
			? [
					{
						text: t([
							`${share(STRADDLE)} ÷ ${share(MOVE)} = ${ratio.toFixed(2)} of one SD`,
							`${share(STRADDLE)} ÷ ${share(MOVE)} = 一个标准差的 ${ratio.toFixed(2)}`,
						]),
						strong: true,
					},
				]
			: []),
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"ALFA's one-standard-deviation range for Oct 18 beside the range the Oct 18 100 straddle's price marks out",
						"ALFA 到 10月18日 的一个标准差区间，与 10月18日 100 跨式价格所划出的区间并列",
					])}
					height={(width) => (width < 520 ? 250 : 230)}
				>
					{(width) => (
						<RangeAxis
							width={width}
							min={80}
							max={120}
							header={t([
								`ALFA $${SPOT} · Oct 18 · IV ${IV}% · ${DAYS} days`,
								`ALFA $${SPOT} · 10月18日 · IV ${IV}% · ${DAYS} 天`,
							])}
							ranges={[
								{
									id: "sd",
									half: MOVE,
									label: t(["1 SD", "1 个标准差"]),
									tone: "sd",
									hidden: shown.show === "straddle",
								},
								{
									id: "straddle",
									half: STRADDLE,
									label: t(["straddle", "跨式"]),
									tone: "straddle",
									hidden: shown.show === "sd",
								},
							]}
							lines={lines}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "sd",
					label: t(["One SD move", "一个标准差变动"]),
					value: plusMinus(MOVE),
					evidence: "modeled",
				},
				{
					id: "straddle",
					label: t(["100 straddle, mid", "100 跨式，中间价"]),
					value: share(STRADDLE),
					note: t([
						`${ratio.toFixed(2)} of one SD`,
						`一个标准差的 ${ratio.toFixed(2)}`,
					]),
					evidence: "modeled",
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Show", "显示"])}
						value={explore.show}
						options={[
							["sd", t(["1 SD", "1 个标准差"])],
							["straddle", t(["Straddle", "跨式"])],
							["both", t(["Both", "两者"])],
						]}
						onChange={(show) => setExplore({ show })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"An at-the-money straddle pays the stock's distance from the strike at expiry, so its price is the market's average move, and under a normal distribution the average size of a move is about 0.8 of one standard deviation. That's why traders quote the straddle as a quick expected move, and why it comes out smaller than the one-SD range from the same IV. Both are model quantities priced from today's options. Neither tells you which way the stock will go.",
						"平值跨式在到期时支付股价与行权价之间的距离，所以它的价格就是市场定价的平均变动；在正态分布下，变动的平均幅度约为一个标准差的 0.8。这就是为什么交易者用跨式价格快速报出“预期变动”，也是为什么它比同一 IV 得出的一个标准差区间要小。两者都是由今天的期权价格得出的模型量，都不能说明股价会往哪个方向走。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: how often the stock lands outside ———

type OutsideState = { stage: 0 | 1 | 2; band: 1 | 2 };

/** Twelve past monthly expiries: each move at expiry as a multiple of its implied one-SD move. */
const PAST = [0.4, 1.3, 0.7, 0.2, 1.1, 0.9, 0.5, 2.2, 0.3, 0.8, 1.2, 0.6];
const MONTHS: readonly Copy[] = [
	["Oct", "10月"],
	["Nov", "11月"],
	["Dec", "12月"],
	["Jan", "1月"],
	["Feb", "2月"],
	["Mar", "3月"],
	["Apr", "4月"],
	["May", "5月"],
	["Jun", "6月"],
	["Jul", "7月"],
	["Aug", "8月"],
	["Sep", "9月"],
];
const outside = (band: number) => PAST.filter((ratio) => ratio > band).length;

function Months({
	width,
	band,
	shownBars,
	locale,
}: {
	width: number;
	band: 1 | 2;
	shownBars: boolean;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const left = 46;
	const right = width - 12;
	// The title breaks at its " · " on a phone, and the chart starts under it.
	const title = packParts(
		t([
			"12 past expiries · move ÷ implied 1 SD · illustrative",
			"过去 12 个到期日 · 变动 ÷ 隐含 1 个标准差 · 示意",
		]),
		width - 16,
		12,
	);
	const top = 34 + (title.length - 1) * 15;
	const bottom = 170;
	const y = (ratio: number) =>
		bottom - (Math.min(ratio, 2.4) / 2.4) * (bottom - top);
	const slot = (right - left) / PAST.length;
	const barWidth = Math.min(slot * 0.6, 26);
	return (
		<g>
			{title.map((line, i) => (
				<Label
					key={line}
					x={8}
					y={16 + i * 15}
					tone="muted"
					maxWidth={width - 16}
				>
					{line}
				</Label>
			))}
			<path d={`M${left} ${top}V${bottom}H${right}`} className="wt-axis" />
			{/* The tick the line sits on names it, clear of the bars. */}
			{[0, 1, 2].map((tick) => (
				<Label
					key={tick}
					x={left - 6}
					y={y(tick) + 4}
					anchor="end"
					tone={tick === band ? "accent" : "small"}
				>
					{tick === band ? t([`${band} SD`, `${band}σ`]) : `${tick}×`}
				</Label>
			))}
			{PAST.map((ratio, i) => {
				const cx = left + slot * (i + 0.5);
				const beyond = ratio > band;
				return (
					<g key={MONTHS[i][0]}>
						<m.rect
							x={cx - barWidth / 2}
							width={barWidth}
							rx={2}
							className={beyond ? "wt-short" : "wt-long-soft"}
							initial={false}
							animate={{
								y: shownBars ? y(ratio) : bottom,
								height: shownBars ? bottom - y(ratio) : 0,
							}}
							transition={motion.move}
						/>
						<Label x={cx} y={bottom + 14} anchor="middle" tone="small">
							{/* Twelve names don't fit a phone: a letter, or the month's number. */}
							{width < 520
								? locale === "zh"
									? MONTHS[i][1].replace("月", "")
									: MONTHS[i][0][0]
								: t(MONTHS[i])}
						</Label>
					</g>
				);
			})}
			<m.path
				initial={false}
				animate={{ d: `M${left} ${y(band)}H${right}` }}
				transition={motion.move}
				className="wt-line-reference"
				style={{ strokeDasharray: "5 4", fill: "none" }}
			/>
		</g>
	);
}

function OutsideView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: OutsideState;
	explore: OutsideState | null;
	setExplore: (next: OutsideState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const model = shown.band === 1 ? 31.7 : 4.6;
	const result: ResultItem[] = [
		{
			id: "model",
			label: t([
				`Outside ${shown.band} SD, model`,
				`模型：落在 ${shown.band} 个标准差之外`,
			]),
			value: `${model}%`,
			note: t(["no jumps, normal returns", "无跳空、正态收益"]),
			evidence: "modeled",
		},
	];
	if (shown.stage >= 1)
		result.push({
			id: "past",
			label: t(["Outside, 12 past expiries", "过去 12 个到期日中落在区间外"]),
			value: t([
				`${outside(shown.band)} of 12`,
				`12 个中有 ${outside(shown.band)} 个`,
			]),
			note: `${Math.round((outside(shown.band) / 12) * 100)}%`,
			tone: "loss",
			evidence: "calculated",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Twelve past monthly expiries, each move as a multiple of its implied one-standard-deviation move, against a one- or two-SD line",
						"过去 12 个月度到期日，每次变动表示为其隐含一个标准差变动的倍数，并与一个或两个标准差的线对照",
					])}
					height={() => 200}
				>
					{(width) => (
						<Months
							width={width}
							band={shown.band}
							shownBars={shown.stage >= 1}
							locale={locale}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Range", "区间"])}
						value={String(explore.band) as "1" | "2"}
						options={[
							["1", t(["1 SD", "1 个标准差"])],
							["2", t(["2 SD", "2 个标准差"])],
						]}
						onChange={(value) =>
							setExplore({ ...explore, band: Number(value) as 1 | 2 })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Under the model, a stock ends outside its one-SD range about a third of the time, half above and half below, and outside two SD about one time in twenty. Real stocks land outside two SD more often than that, mostly on earnings and other news, because prices jump. An expected-move range is a scale for how big a move the options price, not a support or resistance level and not a promise about where the stock will close.",
						"按模型，股价收在一个标准差区间之外的概率约为三分之一，一半在上方、一半在下方；收在两个标准差之外的概率约为二十分之一。真实的股票落在两个标准差之外的次数比这更多，主要是在财报和其他消息时，因为价格会跳空。预期变动区间衡量的是期权定价了多大的变动，它不是支撑位或阻力位，也不是对股价收盘位置的承诺。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<SdState, SdState>({
		id: "from-iv",
		label: ["From IV to a range", "从 IV 到区间"],
		title: [
			"Implied volatility sets a one-standard-deviation move",
			"隐含波动率给出一个标准差的变动",
		],
		predict: {
			prompt: [
				"ALFA is $100 and its Oct 18 options imply 35% volatility, with 32 days left. What is the one-standard-deviation move to Oct 18, in dollars?",
				"ALFA 为 $100，它 10月18日 的期权隐含波动率为 35%，还剩 32 天。到 10月18日 的一个标准差变动是多少美元？",
			],
			choices: [
				{ id: "scaled", label: ["About $10.36", "约 $10.36"] },
				{ id: "annual", label: ["$35: 35% of $100", "$35：$100 的 35%"] },
				{
					id: "linear",
					label: ["About $3.07: 32/365 of $35", "约 $3.07：$35 的 32/365"],
				},
			],
			answer: "scaled",
			entry: {
				answer: Math.round(MOVE * 100) / 100,
				tolerance: 0.1,
				prefix: "$",
			},
			revealAt: 1,
			explain: [
				"35% is a year's move: $35. Over 32 days scale by the square root of the time, √(32 ÷ 365) ≈ 0.296, not by 32/365: $35 × 0.296 ≈ $10.36, a range of about $89.64 to $110.36.",
				"35% 是一年的变动：$35。32 天要按时间的平方根缩放，√(32 ÷ 365) ≈ 0.296，而不是乘以 32/365：$35 × 0.296 ≈ $10.36，区间约为 $89.64 至 $110.36。",
			],
		},
		beats: [
			{
				id: "year",
				label: ["A year", "一年"],
				caption: [
					"Implied volatility is quoted per year: 35% of ALFA's $100 is a one-standard-deviation move of $35 over a year.",
					"隐含波动率按年报价：ALFA $100 的 35%，就是一年内一个标准差 $35 的变动。",
				],
				state: { stage: 0, iv: IV, days: DAYS },
			},
			{
				id: "scale",
				label: ["32 days", "32 天"],
				caption: [
					"Scale by the square root of time: √(32 ÷ 365) ≈ 0.296, so one standard deviation to Oct 18 is about $10.36.",
					"按时间的平方根缩放：√(32 ÷ 365) ≈ 0.296，所以到 10月18日 的一个标准差约为 $10.36。",
				],
				state: { stage: 1, iv: IV, days: DAYS },
			},
			{
				id: "range",
				label: ["The range", "区间"],
				caption: [
					"That's a range of about $89.64 to $110.36. Under the model, about 68% of outcomes land inside it.",
					"区间约为 $89.64 至 $110.36。按模型，约 68% 的结果会落在其中。",
				],
				state: { stage: 2, iv: IV, days: DAYS },
			},
		],
		explore: {
			prompt: [
				"Change the implied volatility and the days left, and watch the range.",
				"改变隐含波动率和剩余天数，观察区间的变化。",
			],
			start: () => ({ stage: 2, iv: IV, days: DAYS }),
			task: {
				kind: "reach",
				prompt: [
					"Keep IV at 35% and find the most days left at which one standard deviation is still under $5.",
					"保持 IV 为 35%，找出一个标准差仍低于 $5 时的最多剩余天数。",
				],
				reached: (e) => e.iv === IV && e.days === 7,
				done: [
					"At 7 days, $35 × √(7 ÷ 365) ≈ $4.85; at 8 days it's $5.18. A quarter of the time gives about half the move: 32 days to 7 cuts $10.36 to $4.85.",
					"7 天时，$35 × √(7 ÷ 365) ≈ $4.85；8 天时为 $5.18。四分之一的时间约对应一半的变动：从 32 天到 7 天，$10.36 缩到 $4.85。",
				],
			},
		},
		View: SdView,
	}),
	defineScene<StraddleState, StraddleState>({
		id: "straddle",
		label: ["The straddle", "跨式"],
		title: [
			"The straddle prices the average move, not one SD",
			"跨式定价的是平均变动，而不是一个标准差",
		],
		predict: {
			prompt: [
				"The Oct 18 100 straddle costs $8.27 at mid. How does that compare with the $10.36 one-standard-deviation move?",
				"10月18日 100 跨式的中间价为 $8.27。它和 $10.36 的一个标准差变动相比如何？",
			],
			choices: [
				{
					id: "smaller",
					label: ["Smaller: about 0.8 of it", "更小：约为它的 0.8"],
				},
				{
					id: "same",
					label: [
						"The same: both are the expected move",
						"一样：两者都是预期变动",
					],
				},
				{
					id: "bigger",
					label: ["Bigger: it adds time value", "更大：它还包含时间价值"],
				},
			],
			answer: "smaller",
			revealAt: 2,
			explain: [
				"The straddle pays ALFA's distance from $100 at expiry, so it prices the average move. Under the model the average move is about 0.8 of one standard deviation: $8.27 against $10.36.",
				"跨式在到期时支付 ALFA 与 $100 之间的距离，所以它定价的是平均变动。按模型，平均变动约为一个标准差的 0.8：$8.27 对 $10.36。",
			],
		},
		beats: [
			{
				id: "sd",
				label: ["One SD", "一个标准差"],
				caption: [
					"From the last scene: one standard deviation to Oct 18 is about ±$10.36.",
					"上一个场景得出：到 10月18日 的一个标准差约为 ±$10.36。",
				],
				state: { show: "sd" },
			},
			{
				id: "straddle",
				label: ["The straddle", "跨式"],
				caption: [
					"The Oct 18 100 call and put cost about $4.13 each at mid: $8.27 for the straddle, which breaks even at $91.73 and $108.27.",
					"10月18日 100 看涨和看跌的中间价各约 $4.13：跨式 $8.27，盈亏平衡点在 $91.73 和 $108.27。",
				],
				state: { show: "straddle" },
			},
			{
				id: "both",
				label: ["Side by side", "并列"],
				caption: [
					"Side by side the straddle's range is narrower: $8.27 ÷ $10.36 = 0.80. Traders quote the straddle as a quick expected move; it's the average move, not the one-SD range.",
					"并列来看，跨式的区间更窄：$8.27 ÷ $10.36 = 0.80。交易者用跨式价格快速报出预期变动；它是平均变动，而不是一个标准差的区间。",
				],
				state: { show: "both" },
			},
		],
		explore: {
			prompt: [
				"Show the one-SD range, the straddle's range, or both.",
				"显示一个标准差区间、跨式区间，或两者。",
			],
			start: () => ({ show: "both" }),
			task: {
				kind: "answer",
				prompt: [
					"About what fraction of the one-SD move does the straddle's price come to?",
					"跨式价格大约是一个标准差变动的几分之几？",
				],
				choices: [
					{ id: "eight", label: ["About 0.8", "约 0.8"] },
					{ id: "one", label: ["About 1.0", "约 1.0"] },
					{ id: "sixtyeight", label: ["About 0.68", "约 0.68"] },
				],
				answer: "eight",
				done: [
					"$8.27 ÷ $10.36 ≈ 0.80, close to √(2 ÷ π), the average size of a normal move in standard deviations. The 0.68 is a different number: the share of outcomes inside one SD.",
					"$8.27 ÷ $10.36 ≈ 0.80，接近 √(2 ÷ π)，即正态变动以标准差计的平均幅度。0.68 是另一个数：落在一个标准差之内的结果所占的比例。",
				],
			},
		},
		View: StraddleView,
	}),
	defineScene<OutsideState, OutsideState>({
		id: "outside",
		label: ["Outside the range", "区间之外"],
		title: [
			"About a third of the time, the stock ends outside",
			"大约三分之一的时候，股价收在区间之外",
		],
		predict: {
			prompt: [
				"Under the model, about what percent of the time does ALFA end outside its one-standard-deviation range?",
				"按模型，ALFA 收在一个标准差区间之外的时候大约占百分之几？",
			],
			choices: [
				{ id: "third", label: ["About 32%", "约 32%"] },
				{ id: "five", label: ["About 5%", "约 5%"] },
				{ id: "never", label: ["Almost never", "几乎从不"] },
			],
			answer: "third",
			entry: { answer: 32, tolerance: 2, unit: ["%", "%"] },
			revealAt: 1,
			explain: [
				"About 68% of outcomes land within one standard deviation, so about 32% land outside: roughly 16% above and 16% below. The 5% belongs to two standard deviations.",
				"约 68% 的结果落在一个标准差之内，所以约 32% 落在之外：大约上方 16%、下方 16%。5% 对应的是两个标准差。",
			],
		},
		beats: [
			{
				id: "model",
				label: ["The model", "模型"],
				caption: [
					"Under the model about 68% of outcomes land inside one SD and 32% outside, half above and half below.",
					"按模型，约 68% 的结果落在一个标准差之内，32% 落在之外，上下各一半。",
				],
				state: { stage: 0, band: 1 },
			},
			{
				id: "past",
				label: ["Twelve expiries", "12 个到期日"],
				caption: [
					"Twelve past monthly expiries, each move divided by the one-SD move implied a month before: 4 of 12 ended outside, 33%.",
					"过去 12 个月度到期日，每次变动除以一个月前隐含的一个标准差变动：12 个中有 4 个收在区间之外，33%。",
				],
				state: { stage: 1, band: 1 },
			},
			{
				id: "jumps",
				label: ["Two SD", "两个标准差"],
				caption: [
					"The model puts only 4.6% outside two SD, yet May's earnings jump went 2.2 times its implied move. Real prices jump; a range is a scale, not a wall.",
					"模型认为只有 4.6% 会落在两个标准差之外，但五月的财报跳空达到了隐含变动的 2.2 倍。真实价格会跳空；区间只是一把尺子，不是一堵墙。",
				],
				state: { stage: 1, band: 2 },
			},
		],
		explore: {
			prompt: [
				"Switch between the one- and two-SD lines and count the months beyond them.",
				"在一个和两个标准差的线之间切换，数一数超出的月份。",
			],
			start: () => ({ stage: 1, band: 1 }),
			task: {
				kind: "answer",
				prompt: [
					"How many of the 12 expiries ended outside the two-SD range?",
					"12 个到期日中，有几个收在两个标准差区间之外？",
				],
				choices: [
					{ id: "one", label: ["1: the earnings month", "1 个：财报那个月"] },
					{ id: "four", label: ["4", "4 个"] },
					{ id: "none", label: ["None", "没有"] },
				],
				answer: "one",
				done: [
					"Only May, the earnings month, at 2.2 times its implied move: 1 of 12, about 8%, against the model's 4.6%. Twelve months is a small sample, but jumps around news are why the tails come out fatter than the model.",
					"只有五月，也就是财报那个月，达到隐含变动的 2.2 倍：12 个中 1 个，约 8%，而模型是 4.6%。12 个月是很小的样本，但消息带来的跳空，正是尾部比模型更厚的原因。",
				],
			},
		},
		View: OutsideView,
	}),
] as const;

export function ExpectedMoveWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="expected-move"
			label={["Interactive lesson on the expected move", "预期变动互动课"]}
			scenes={scenes}
		/>
	);
}
