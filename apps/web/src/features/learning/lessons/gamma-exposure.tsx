import * as m from "motion/react-m";
import {
	ALFA,
	type Copy,
	count,
	gammaExposure,
	modelValue,
	oct18OpenInterest,
	pick,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import { Label, Stage, useStage, useTeachMotion } from "../walkthrough/stage";
import { wrapText } from "../walkthrough/text-measure";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

const SPOT = ALFA.open / 100;
/** Gamma to four places, the figure the arithmetic below uses. */
const gammaAt = (strike: number) =>
	Math.round(
		modelValue({ expiry: "oct18", strike, right: "call" }).gamma * 10_000,
	) / 10_000;

/** "+$665k", "−$2.31M". */
const money = (dollars: number, signed = true) => {
	const sign = dollars < 0 ? "−" : signed && dollars > 0 ? "+" : "";
	const size = Math.abs(dollars);
	return size >= 1_000_000
		? `${sign}$${(size / 1_000_000).toFixed(2)}M`
		: `${sign}$${Math.round(size / 1_000)}k`;
};

type Side = "call" | "put";
/** Dealers assumed long calls and short puts: a common convention, not an observation. */
const assumedSign = (side: Side): 1 | -1 => (side === "call" ? 1 : -1);
const contribution = (strike: number, side: Side, sign = assumedSign(side)) => {
	const row = oct18OpenInterest.find((entry) => entry.strike === strike);
	return row ? gammaExposure(gammaAt(strike), row[side], SPOT, sign) : 0;
};
const STRIKES = oct18OpenInterest.map((row) => row.strike);
const sum = (values: number[]) =>
	values.reduce((total, value) => total + value, 0);
const CALLS = sum(STRIKES.map((strike) => contribution(strike, "call")));
const PUTS = sum(STRIKES.map((strike) => contribution(strike, "put")));
const NET = CALLS + PUTS;
const GROSS = CALLS - PUTS;

// ——— Scene 1: one contribution, every input declared ———

type ChainState = { rows: 3 | 4 | 5; sign: 1 | -1 };

const FOCUS_STRIKE = 110;
const focusRow = oct18OpenInterest.find((row) => row.strike === FOCUS_STRIKE);
const FOCUS_OI = focusRow?.call ?? 0;
const FOCUS_GAMMA = gammaAt(FOCUS_STRIKE);
const SHARES = Math.round(FOCUS_GAMMA * FOCUS_OI * 100);

const chainRows = (sign: 1 | -1): readonly { label: Copy; value: Copy }[] => [
	{
		label: ["Gamma, model", "Gamma（模型）"],
		value: [`${FOCUS_GAMMA} per $1`, `每 $1 ${FOCUS_GAMMA}`],
	},
	{
		label: ["× open interest, Fri close", "× 未平仓量（周五收盘）"],
		value: [`× ${count(FOCUS_OI)}`, `× ${count(FOCUS_OI)}`],
	},
	{
		label: ["× 100 shares", "× 100 股"],
		value: [`${count(SHARES)} shares per $1`, `每 $1 ${count(SHARES)} 股`],
	},
	{
		label: [`× $${SPOT} spot × 1%`, `× 现价 $${SPOT} × 1%`],
		value: [
			`${money(gammaExposure(FOCUS_GAMMA, FOCUS_OI, SPOT, 1), false)} per 1%`,
			`每 1% ${money(gammaExposure(FOCUS_GAMMA, FOCUS_OI, SPOT, 1), false)}`,
		],
	},
	{
		label:
			sign > 0
				? ["× sign: dealers assumed long", "× 符号：假设做市商做多"]
				: ["× sign: dealers assumed short", "× 符号：假设做市商做空"],
		value: [
			money(gammaExposure(FOCUS_GAMMA, FOCUS_OI, SPOT, sign)),
			money(gammaExposure(FOCUS_GAMMA, FOCUS_OI, SPOT, sign)),
		],
	},
];

function chainLayout(width: number, locale: Locale) {
	const labelWidth = width < 520 ? 150 : 250;
	let y = 30;
	const rows = chainRows(1).map((row, i) => {
		const lines = wrapText(pick(row.label, locale), labelWidth - 16, 11);
		const height = Math.max(34, lines.length * 14 + 16);
		const block = { i, lines, y, height };
		y += height + 6;
		return block;
	});
	return { labelWidth, rows, height: y };
}

function ChainTable({
	width,
	state,
	locale,
}: {
	width: number;
	state: ChainState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const layout = chainLayout(width, locale);
	const rows = chainRows(state.sign);
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t([
					`ALFA Oct 18 ${FOCUS_STRIKE} call · one GEX contribution`,
					`ALFA 10月18日 ${FOCUS_STRIKE} 看涨 · 一项 GEX 贡献`,
				])}
			</Label>
			{layout.rows.map((block) => {
				const row = rows[block.i];
				const visible = block.i < state.rows;
				const current = block.i === state.rows - 1;
				const labelLines =
					block.i === 4
						? wrapText(t(row.label), layout.labelWidth - 16, 11)
						: block.lines;
				return (
					<m.g
						key={block.i}
						initial={false}
						animate={{ opacity: visible ? 1 : 0.25 }}
						transition={motion.fade}
					>
						<rect
							x={4}
							y={block.y}
							width={width - 8}
							height={block.height}
							rx={8}
							className={current ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						{labelLines.map((line, k) => (
							<Label
								key={line}
								x={14}
								y={
									block.y +
									block.height / 2 +
									4 +
									(k - (labelLines.length - 1) / 2) * 14
								}
								tone="small"
							>
								{line}
							</Label>
						))}
						<Label
							x={width - 14}
							y={block.y + block.height / 2 + 5}
							anchor="end"
							tone={
								block.i === 4 && visible
									? state.sign > 0
										? "gain"
										: "loss"
									: undefined
							}
						>
							{visible ? t(row.value) : "—"}
						</Label>
					</m.g>
				);
			})}
		</g>
	);
}

function ChainView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ChainState;
	explore: ChainState | null;
	setExplore: (next: ChainState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] = [
		{
			id: "inputs",
			label: t(["Inputs", "输入"]),
			value: t([
				`OI ${count(FOCUS_OI)} · $${SPOT}`,
				`未平仓 ${count(FOCUS_OI)} · $${SPOT}`,
			]),
			note: t(["Friday's close, Monday's open", "周五收盘，周一开盘"]),
			evidence: "observed",
		},
	];
	if (shown.rows >= 4)
		result.push({
			id: "size",
			label: t(["Size per 1% move", "每 1% 变动的大小"]),
			value: money(gammaExposure(FOCUS_GAMMA, FOCUS_OI, SPOT, 1), false),
			note: t(["of delta, in dollars", "Delta 的美元值"]),
			evidence: "modeled",
		});
	if (shown.rows >= 5)
		result.push({
			id: "signed",
			label: t(["Contribution", "贡献"]),
			value: money(gammaExposure(FOCUS_GAMMA, FOCUS_OI, SPOT, shown.sign)),
			note:
				shown.sign > 0
					? t(["if dealers are long these calls", "假设做市商做多这些看涨"])
					: t(["if dealers are short these calls", "假设做市商做空这些看涨"]),
			tone: shown.sign > 0 ? "gain" : "loss",
			evidence: "modeled",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"One gamma exposure contribution built step by step: model gamma, open interest, contract size, spot and a 1% move, then an assumed sign",
						"一步步构建一项 Gamma 敞口贡献：模型 Gamma、未平仓量、合约规模、现价与 1% 变动，最后乘以假设的符号",
					])}
					height={(width) => chainLayout(width, locale).height}
				>
					{(width) => (
						<ChainTable width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Assumed dealer position", "假设的做市商持仓"])}
						value={explore.sign > 0 ? "long" : "short"}
						options={[
							["long", t(["Long calls", "做多看涨"])],
							["short", t(["Short calls", "做空看涨"])],
						]}
						onChange={(value) =>
							setExplore({ rows: 5, sign: value === "long" ? 1 : -1 })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A GEX number is gamma × open interest × 100 × spot² × 1%, the dollars of delta that change for a 1% move, times a sign. Every input needs a clock: open interest is Friday's close, spot is Monday's open, gamma comes from a model. The sign is the biggest assumption. Open interest says how many contracts exist, not who holds them; the convention here assumes dealers are long calls and short puts, and another platform may assume the opposite.",
						"GEX 数字是 Gamma × 未平仓量 × 100 × 现价² × 1%，即变动 1% 时改变的 Delta 美元值，再乘一个符号。每个输入都需要时点：未平仓量是周五收盘，现价是周一开盘，Gamma 来自模型。符号是最大的假设。未平仓量只说明有多少合约，不说明谁持有；这里的约定假设做市商做多看涨、做空看跌，而另一个平台可能假设相反。",
					])}
				</p>
			}
		/>
	);
}

// ——— Shared: GEX by strike ———

type BarsView = {
	calls: boolean;
	puts: boolean;
	net: boolean;
	/** Only these contracts count; the rest are drawn faint. */
	only?: readonly string[];
	/** Contracts whose open interest never arrived. */
	missing?: readonly string[];
};

const key = (strike: number, side: Side) =>
	`${strike}${side === "call" ? "C" : "P"}`;
const counts = (view: BarsView, strike: number, side: Side) =>
	(side === "call" ? view.calls : view.puts) &&
	(!view.only || view.only.includes(key(strike, side))) &&
	!view.missing?.includes(key(strike, side));

function totalOf(view: BarsView) {
	return sum(
		STRIKES.flatMap((strike) =>
			(["call", "put"] as const).map((side) =>
				counts(view, strike, side) ? contribution(strike, side) : 0,
			),
		),
	);
}

const BARS_TOP = 52;
const BARS_BOTTOM = 232;
const barsHeight = BARS_BOTTOM + 24;
const RANGE = 900_000;

function StrikeBars({
	width,
	view,
	locale,
}: {
	width: number;
	view: BarsView;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const { hatch } = useStage();
	const left = 50;
	const right = width - 8;
	const slot = (right - left) / STRIKES.length;
	const barWidth = Math.min(slot * 0.5, 26);
	const zero = (BARS_TOP + BARS_BOTTOM) / 2;
	const y = (value: number) => zero - (value / RANGE) * (zero - BARS_TOP);
	const spotX = left + slot * (STRIKES.indexOf(SPOT) + 0.5);
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t([
					"ALFA Oct 18 · GEX by strike · $ per 1% move",
					"ALFA 10月18日 · 各行权价 GEX · 每 1% 变动美元",
				])}
			</Label>
			{[500_000, 0, -500_000].map((tick) => (
				<g key={tick}>
					<path
						d={`M${left} ${y(tick)}H${right}`}
						className={tick === 0 ? "wt-axis" : "wt-grid"}
					/>
					<Label x={left - 6} y={y(tick) + 4} anchor="end" tone="small">
						{tick === 0 ? "0" : money(tick)}
					</Label>
				</g>
			))}
			<path
				d={`M${spotX} ${BARS_TOP - 6}V${BARS_BOTTOM}`}
				className="wt-bracket"
				strokeDasharray="4 4"
			/>
			<Label x={spotX} y={BARS_TOP - 10} anchor="middle" tone="accent">
				{t([`ALFA $${SPOT}`, `ALFA $${SPOT}`])}
			</Label>
			{STRIKES.map((strike, i) => {
				const cx = left + slot * (i + 0.5);
				const net =
					(counts(view, strike, "call") ? contribution(strike, "call") : 0) +
					(counts(view, strike, "put") ? contribution(strike, "put") : 0);
				return (
					<g key={strike}>
						{(["call", "put"] as const).map((side) => {
							const shown = side === "call" ? view.calls : view.puts;
							const value = contribution(strike, side);
							const missing = view.missing?.includes(key(strike, side));
							const top = Math.min(y(value), zero);
							const height = Math.abs(y(value) - zero);
							if (missing)
								return (
									<rect
										key={side}
										x={cx - barWidth / 2}
										y={side === "call" ? zero - 30 : zero}
										width={barWidth}
										height={30}
										rx={3}
										className="wt-ghost"
										style={{ fill: hatch }}
									/>
								);
							return (
								<m.rect
									key={side}
									x={cx - barWidth / 2}
									width={barWidth}
									rx={3}
									className={side === "call" ? "wt-long-soft" : "wt-short-soft"}
									initial={false}
									animate={{
										y: shown ? top : zero,
										height: shown ? Math.max(height, 1) : 0,
										opacity: counts(view, strike, side) ? 1 : shown ? 0.25 : 0,
									}}
									transition={motion.move}
								/>
							);
						})}
						{view.net ? (
							<m.rect
								x={cx - barWidth / 2 - 4}
								width={barWidth + 8}
								height={3}
								rx={1.5}
								className="wt-chip"
								initial={false}
								animate={{ y: y(net) - 1.5 }}
								transition={motion.move}
							/>
						) : null}
						<Label x={cx} y={BARS_BOTTOM + 16} anchor="middle" tone="small">
							{strike}
						</Label>
					</g>
				);
			})}
		</g>
	);
}

// ——— Scene 2: the distribution ———

type DistributionState = { stage: 0 | 1 | 2 };

function DistributionView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: DistributionState;
	explore: DistributionState | null;
	setExplore: (next: DistributionState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const view: BarsView = {
		calls: true,
		puts: shown.stage >= 1,
		net: shown.stage >= 2,
	};
	const result: ResultItem[] = [
		{
			id: "calls",
			label: t(["Calls", "看涨"]),
			value: money(CALLS),
			note: t(["assumed dealer long", "假设做市商做多"]),
			tone: "gain",
			evidence: "modeled",
		},
	];
	if (shown.stage >= 1)
		result.push({
			id: "puts",
			label: t(["Puts", "看跌"]),
			value: money(PUTS),
			note: t(["assumed dealer short", "假设做市商做空"]),
			tone: "loss",
			evidence: "modeled",
		});
	if (shown.stage >= 2)
		result.push(
			{
				id: "net",
				label: t(["Net", "净值"]),
				value: money(NET),
				evidence: "calculated",
			},
			{
				id: "gross",
				label: t(["Gross", "总幅度"]),
				value: money(GROSS, false),
				note: t(["what the net hides", "净值掩盖的部分"]),
				evidence: "calculated",
			},
		);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Gamma exposure by strike for ALFA's Oct 18 options: calls above zero, puts below, and the net at each strike",
						"ALFA 10月18日 期权各行权价的 Gamma 敞口：看涨在零上方，看跌在零下方，并标出每个行权价的净值",
					])}
					height={barsHeight}
				>
					{(width) => <StrikeBars width={width} view={view} locale={locale} />}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Show", "显示"])}
						value={String(explore.stage) as "0" | "1" | "2"}
						options={[
							["0", t(["Calls", "看涨"])],
							["1", t(["+ Puts", "+ 看跌"])],
							["2", t(["+ Net", "+ 净值"])],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as DistributionState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Net GEX adds signed contributions, gross adds their sizes. Under this convention ALFA's puts, crowded below $100, outweigh its calls, which sit above. A small net can hide large exposure on both sides, and two chains with the same net can be built very differently: read the profile by strike and expiry before the total.",
						"净 GEX 把带符号的贡献相加，总幅度把它们的大小相加。在这个约定下，ALFA 集中在 $100 下方的看跌超过了位于上方的看涨。一个小的净值可能掩盖两侧都很大的敞口，两条净值相同的期权链也可能结构迥异：先按行权价和到期日读分布，再看总量。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: a subtotal is not a total ———

type CoverageState = { stage: 0 | 1 | 2 };

const TRADED = ["100C", "105C", "110C"];
const MISSING = ["95P"];
const tradedOnly = totalOf({
	calls: true,
	puts: true,
	net: true,
	only: TRADED,
});
const withGap = totalOf({
	calls: true,
	puts: true,
	net: true,
	missing: MISSING,
});

function CoverageView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: CoverageState;
	explore: CoverageState | null;
	setExplore: (next: CoverageState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const view: BarsView = {
		calls: true,
		puts: true,
		net: true,
		only: shown.stage === 1 ? TRADED : undefined,
		missing: shown.stage === 2 ? MISSING : undefined,
	};
	const result: ResultItem[] = [
		{
			id: "chain",
			label: t(["Full chain", "完整期权链"]),
			value: money(NET),
			note: t([
				`${STRIKES.length * 2} contracts, every open interest`,
				`${STRIKES.length * 2} 个合约，全部未平仓量`,
			]),
			evidence: "modeled",
		},
	];
	if (shown.stage === 1)
		result.push({
			id: "traded",
			label: t(["Traded-only sample", "仅成交样本"]),
			value: money(tradedOnly),
			note: t(["Monday's 100, 105, 110 calls", "周一的 100、105、110 看涨"]),
			tone: "loss",
			evidence: "modeled",
		});
	if (shown.stage === 2)
		result.push(
			{
				id: "known",
				label: t(["Known subtotal", "已知小计"]),
				value: money(withGap),
				note: t(["95 put open interest missing", "95 看跌的未平仓量缺失"]),
				evidence: "modeled",
			},
			{
				id: "total",
				label: t(["Complete total", "完整总量"]),
				value: t(["unavailable", "不可得"]),
				note: t(["not zero, not the subtotal", "不是零，也不是小计"]),
				evidence: "unknown",
			},
		);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The GEX-by-strike chart with only traded contracts counted, or with one contract's open interest missing",
						"各行权价 GEX 图：只计入有成交的合约，或其中一个合约的未平仓量缺失",
					])}
					height={barsHeight}
				>
					{(width) => <StrikeBars width={width} view={view} locale={locale} />}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Coverage", "覆盖"])}
						value={String(explore.stage) as "0" | "1" | "2"}
						options={[
							["0", t(["Full chain", "完整"])],
							["1", t(["Traded only", "仅成交"])],
							["2", t(["One missing", "缺一项"])],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as CoverageState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"GEX is built from open interest across the whole chain, including contracts that didn't trade today. A traded-only sample leaves out most of the exposure, here every put. A contract whose open interest never arrived is missing, not zero: report the known subtotal and say the complete total is unavailable until it arrives.",
						"GEX 由整条期权链的未平仓量构建，包括今天没有成交的合约。仅成交样本会漏掉大部分敞口，这里是全部看跌。未平仓量没有送达的合约是缺失，不是零：报告已知小计，并说明在数据到达之前完整总量不可得。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const LONG = gammaExposure(FOCUS_GAMMA, FOCUS_OI, SPOT, 1);

const scenes = [
	defineScene<ChainState, ChainState>({
		id: "inputs",
		label: ["Declare the inputs", "声明输入"],
		title: [
			"Scope, clock and sign come before the total",
			"范围、时点与符号先于总量",
		],
		predict: {
			prompt: [
				`Another model assumes dealers are short the ${FOCUS_STRIKE} calls, not long. Their contribution becomes…`,
				`另一个模型假设做市商做空而不是做多 ${FOCUS_STRIKE} 看涨。它们的贡献变成……`,
			],
			choices: [
				{
					id: "flip",
					label: [
						`${money(-LONG)}: only the sign flips`,
						`${money(-LONG)}：只有符号翻转`,
					],
				},
				{ id: "zero", label: ["$0", "$0"] },
				{
					id: "same",
					label: [
						`${money(LONG)}: open interest didn't change`,
						`${money(LONG)}：未平仓量没变`,
					],
				},
			],
			answer: "flip",
			revealAt: 3,
			explain: [
				`Gamma, open interest, spot and size are the same; only the assumed sign changes: ${money(LONG)} becomes ${money(-LONG)}. The sign is a model choice, not something the open interest reports.`,
				`Gamma、未平仓量、现价和规模都一样，只有假设的符号变了：${money(LONG)} 变成 ${money(-LONG)}。符号是模型的选择，而不是未平仓量报告的内容。`,
			],
		},
		beats: [
			{
				id: "shares",
				label: ["Shares", "股数"],
				caption: [
					`Start with one contract line: the Oct 18 ${FOCUS_STRIKE} call. Model gamma ${FOCUS_GAMMA} × ${count(FOCUS_OI)} open at Friday's close × 100 shares = ${count(SHARES)} shares of delta per $1.`,
					`从一个合约开始：10月18日 ${FOCUS_STRIKE} 看涨。模型 Gamma ${FOCUS_GAMMA} × 周五收盘未平仓 ${count(FOCUS_OI)} × 100 股 = 每 $1 ${count(SHARES)} 股 Delta。`,
				],
				state: { rows: 3, sign: 1 },
			},
			{
				id: "dollars",
				label: ["Dollars", "金额"],
				caption: [
					`Scale to a 1% move at Monday's $${SPOT} open: ${money(LONG, false)} of delta shifts for each 1% ALFA moves.`,
					`按周一开盘价 $${SPOT} 的 1% 变动换算：ALFA 每变动 1%，就有 ${money(LONG, false)} 的 Delta 随之变化。`,
				],
				state: { rows: 4, sign: 1 },
			},
			{
				id: "sign",
				label: ["Sign", "符号"],
				caption: [
					`Now the assumption: this convention takes dealers to be long calls, so ${money(LONG)}.`,
					`现在加入假设：这个约定认为做市商做多看涨，所以是 ${money(LONG)}。`,
				],
				state: { rows: 5, sign: 1 },
			},
			{
				id: "flip",
				label: ["Other sign", "另一符号"],
				caption: [
					`Assume dealers are short them instead and the same inputs give ${money(-LONG)}. Keep the assumption attached to the number.`,
					`如果改为假设做市商做空，同样的输入就得到 ${money(-LONG)}。要让假设始终跟着数字。`,
				],
				state: { rows: 5, sign: -1 },
			},
		],
		explore: {
			prompt: ["Switch the assumed dealer position.", "切换假设的做市商持仓。"],
			start: () => ({ rows: 5, sign: 1 }),
		},
		View: ChainView,
	}),
	defineScene<DistributionState, DistributionState>({
		id: "distribution",
		label: ["Inspect the distribution", "检查分布"],
		title: [
			"The same net can hide very different structure",
			"相同的净值可能掩盖迥异的结构",
		],
		predict: {
			prompt: [
				`Calls add ${money(CALLS)} and puts ${money(PUTS)}, for a net of ${money(NET)}. Is that a small exposure?`,
				`看涨贡献 ${money(CALLS)}，看跌 ${money(PUTS)}，净值 ${money(NET)}。这是一个小的敞口吗？`,
			],
			choices: [
				{
					id: "no",
					label: [
						`No: ${money(GROSS, false)} is netting against itself`,
						`不是：${money(GROSS, false)} 在相互抵消`,
					],
				},
				{ id: "yes", label: ["Yes: the net is small", "是：净值很小"] },
				{ id: "positive", label: ["It's positive", "它是正的"] },
			],
			answer: "no",
			revealAt: 2,
			explain: [
				`Gross is ${money(GROSS, false)}: puts below $${SPOT}, calls above. The net of ${money(NET)} is the small difference between two large, differently placed sides.`,
				`总幅度是 ${money(GROSS, false)}：看跌在 $${SPOT} 下方，看涨在上方。${money(NET)} 的净值只是两个很大、位置不同的部分之间的小差额。`,
			],
		},
		beats: [
			{
				id: "calls",
				label: ["Calls", "看涨"],
				caption: [
					`Every Oct 18 call, as dealers-long contributions: ${money(CALLS)}, most of it at $105 to $115.`,
					`每一张 10月18日 看涨，按做市商做多计入：${money(CALLS)}，大部分在 $105 到 $115。`,
				],
				state: { stage: 0 },
			},
			{
				id: "puts",
				label: ["Puts", "看跌"],
				caption: [
					`Add the puts, as dealers-short: ${money(PUTS)}, crowded at $90 to $100.`,
					`加入看跌，按做市商做空计入：${money(PUTS)}，集中在 $90 到 $100。`,
				],
				state: { stage: 1 },
			},
			{
				id: "net",
				label: ["Net", "净值"],
				caption: [
					`Net ${money(NET)} from gross ${money(GROSS, false)}: negative through $100, positive from $105. The profile says more than the total.`,
					`总幅度 ${money(GROSS, false)} 得出净值 ${money(NET)}：到 $100 为止为负，从 $105 起为正。分布比总量说明得更多。`,
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: ["Step through the sides.", "逐步查看两侧。"],
			start: () => ({ stage: 2 }),
		},
		View: DistributionView,
	}),
	defineScene<CoverageState, CoverageState>({
		id: "coverage",
		label: ["Check the whole chain", "检查完整链"],
		title: ["A subtotal is not a complete total", "小计不是完整总和"],
		predict: {
			prompt: [
				"Monday's trades touched only the 100, 105 and 110 calls. Does their GEX stand in for ALFA's?",
				"周一的成交只涉及 100、105 和 110 看涨。它们的 GEX 能代表 ALFA 的 GEX 吗？",
			],
			choices: [
				{
					id: "no",
					label: [
						"No: it's a subtotal with none of the puts",
						"不能：这是一个不含任何看跌的小计",
					],
				},
				{
					id: "yes",
					label: ["Yes: those are the active contracts", "能：它们是活跃合约"],
				},
				{
					id: "scaled",
					label: ["Yes, scaled up by volume", "能，按成交量放大即可"],
				},
			],
			answer: "no",
			revealAt: 1,
			explain: [
				`Those three calls give ${money(tradedOnly)}; the full chain is ${money(NET)}. Open interest doesn't need a trade today to be exposure.`,
				`这三个看涨给出 ${money(tradedOnly)}；完整期权链是 ${money(NET)}。未平仓量不需要今天有成交才算敞口。`,
			],
		},
		beats: [
			{
				id: "full",
				label: ["Full chain", "完整"],
				caption: [
					`With every Oct 18 contract's open interest: ${money(NET)}.`,
					`计入每一个 10月18日 合约的未平仓量：${money(NET)}。`,
				],
				state: { stage: 0 },
			},
			{
				id: "traded",
				label: ["Traded only", "仅成交"],
				caption: [
					`Count only Monday's traded contracts and the answer flips to ${money(tradedOnly)}: no puts at all.`,
					`只计入周一有成交的合约，答案翻转为 ${money(tradedOnly)}：完全没有看跌。`,
				],
				state: { stage: 1 },
			},
			{
				id: "missing",
				label: ["One missing", "缺一项"],
				caption: [
					`If the 95 put's open interest never arrives, the known subtotal is ${money(withGap)}. The complete total is unavailable, not ${money(withGap)} and not zero.`,
					`如果 95 看跌的未平仓量一直没到，已知小计是 ${money(withGap)}。完整总量不可得，既不是 ${money(withGap)}，也不是零。`,
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: ["Change the coverage.", "改变覆盖范围。"],
			start: () => ({ stage: 1 }),
		},
		View: CoverageView,
	}),
] as const;

export function GammaExposureWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="gamma-exposure"
			label={[
				"Interactive lesson on building a GEX snapshot",
				"构建 GEX 快照互动课",
			]}
			scenes={scenes}
		/>
	);
}
