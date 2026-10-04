import * as m from "motion/react-m";
import { type Copy, pick, signedUsd, usd } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import {
	PayoffChart,
	type PayoffLine,
	type PayoffMarker,
} from "../walkthrough/instruments/payoff-chart";
import {
	type TapeRow,
	TradeTape,
	tapeHeight,
} from "../walkthrough/instruments/trade-tape";
import { Player } from "../walkthrough/player";
import { Label, Stage, useTeachMotion } from "../walkthrough/stage";
import { startAt } from "../walkthrough/text-measure";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame } from "../walkthrough/walkthrough";
import { putCallParityFilm } from "./put-call-parity-film";
import {
	AFTERNOON,
	AFTERNOON_PARITY,
	CALL_PAID,
	callLeg,
	callMid,
	GAP,
	LATE,
	LATE_PUT,
	MORNING,
	NET_DEBIT,
	PUT_RECEIVED,
	putLeg,
	putMid,
	RANGE,
	STRIKE,
	synthetic,
} from "./put-call-parity-model";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

/** Whole dollars per contract from dollars per share: "+$1,000", "−$1,000". */
const signedPerContract = (perShare: number) =>
	signedUsd(perShare * 100 * 100, 0);
/** Dollars per share, to the cent: "$5.25", "−$3.00". */
const share = (dollars: number) => usd(Math.round(dollars * 100));
const signedShare = (dollars: number) => signedUsd(Math.round(dollars * 100));

// ——— Scene 1: a call and a short put make a share ———

type SyntheticState = { stage: 0 | 1 | 2 | 3; spot: number };

/** Lines in dollars per contract, with a kink at the strike. */
const line = (f: (spot: number) => number) =>
	[RANGE[0], STRIKE, RANGE[1]].map((spot) => [spot, f(spot) * 100] as const);

function SyntheticView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SyntheticState;
	explore: SyntheticState | null;
	setExplore: (next: SyntheticState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const costed = shown.stage >= 3;
	const lines: PayoffLine[] = [
		{
			id: "call",
			label: t(["long 100 call", "100 看涨多头"]),
			points: line(callLeg),
			tone: shown.stage >= 2 ? "reference" : "long",
		},
	];
	if (shown.stage >= 1)
		lines.push({
			id: "put",
			label: t(["short 100 put", "100 看跌空头"]),
			points: line(putLeg),
			tone: shown.stage >= 2 ? "reference" : "short",
		});
	if (shown.stage >= 2)
		lines.push({
			id: "sum",
			label: costed
				? t(["synthetic, after premiums", "合成持仓（扣除权利金）"])
				: t(["call + short put", "看涨 + 看跌空头"]),
			shortLabel: t(["synthetic", "合成"]),
			points: line((spot) => synthetic(spot) - (costed ? NET_DEBIT : 0)),
			tone: "position",
		});
	const value = synthetic(shown.spot) - (costed ? NET_DEBIT : 0);
	const markers: PayoffMarker[] =
		shown.stage >= 2
			? [
					{
						id: "at",
						x: shown.spot,
						y: value * 100,
						label: signedPerContract(value),
						tone: value >= 0 ? "gain" : "loss",
					},
				]
			: [];
	const result: ResultItem[] = [
		{
			id: "call",
			label: t(["Long 100 call", "100 看涨多头"]),
			value: signedPerContract(callLeg(shown.spot)),
			note: t([`at ALFA $${shown.spot}`, `ALFA $${shown.spot} 时`]),
		},
	];
	if (shown.stage >= 1)
		result.push({
			id: "put",
			label: t(["Short 100 put", "100 看跌空头"]),
			value: signedPerContract(putLeg(shown.spot)),
		});
	if (shown.stage >= 2)
		result.push({
			id: "sum",
			label: costed
				? t(["Synthetic, after premiums", "合成持仓，扣除权利金"])
				: t(["Both legs", "两条腿合计"]),
			value: signedPerContract(value),
			note: costed
				? t([
						`like 100 shares bought at ${share(STRIKE + NET_DEBIT)}`,
						`相当于以 ${share(STRIKE + NET_DEBIT)} 买入 100 股`,
					])
				: t(["like 100 shares bought at $100", "相当于以 $100 买入 100 股"]),
			tone: value >= 0 ? "gain" : "loss",
			evidence: "calculated",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A long Oct 18 100 call and a short Oct 18 100 put at expiry, and their sum, which moves like 100 ALFA shares",
						"10月18日 100 看涨多头与 10月18日 100 看跌空头的到期价值，以及两者之和：它像 100 股 ALFA 一样变动",
					])}
					height={(width) => (width < 520 ? 260 : 300)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 260 : 300}
							xRange={RANGE}
							yRange={[-2200, 2200]}
							xTicks={[80, 90, 100, 110, 120]}
							yTicks={[-2000, -1000, 0, 1000, 2000]}
							lines={lines}
							markers={markers}
							drag={
								explore
									? {
											markerId: "at",
											min: RANGE[0],
											max: RANGE[1],
											step: 1,
											onChange: (spot) => setExplore({ ...explore, spot }),
										}
									: undefined
							}
							xLabel={t(["ALFA on Oct 18", "10月18日 ALFA"])}
							title={t([
								`Buy the 100 call at ${usd(CALL_PAID)} · sell the 100 put at ${usd(PUT_RECEIVED)} · per pair`,
								`以 ${usd(CALL_PAID)} 买入 100 看涨 · 以 ${usd(PUT_RECEIVED)} 卖出 100 看跌 · 每组`,
							])}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<RangeControl
						label={t(["ALFA on Oct 18", "10月18日 ALFA"])}
						value={explore.spot}
						display={`$${explore.spot}`}
						min={RANGE[0]}
						max={RANGE[1]}
						onChange={(spot) => setExplore({ ...explore, spot })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A long call and a short put at the same strike and expiry add up to a straight line: every $1 ALFA moves is $100 for the pair, just like 100 shares. That's a synthetic long stock. Reverse both legs and it's a synthetic short. The premiums set the price you effectively paid: here the $0.15 net debit makes it 100 shares at $100.15. At expiry one leg is exercised or assigned either way, so the pair really does end as shares.",
						"同一行权价和到期日的看涨多头加看跌空头，合起来是一条直线：ALFA 每变动 $1，这一组就变动 $100，和 100 股一样。这就是合成股票多头。两条腿都反过来，就是合成空头。权利金决定了你实际付出的价格：这里 $0.15 的净支出，相当于以 $100.15 买入 100 股。到期时无论如何总有一条腿被行权或被指派，所以这一组最后真的会变成股票。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: price one from the other ———

type BalanceState = { stage: 0 | 1; spot: number };

/** Two diverging bars from zero: call minus put, and ALFA minus the strike. */
function Balance({
	width,
	spot,
	stage,
	putUnknown,
	locale,
}: {
	width: number;
	spot: number;
	stage: 0 | 1;
	/** While the learner predicts the put, its bar is the question. */
	putUnknown: boolean;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const narrow = width < 520;
	const left = narrow ? 14 : 150;
	const right = width - 14;
	const zero = (left + right) / 2;
	// The widest value, about $8 either way, keeps room beside its bar for its label.
	const scale = (Math.min(right - zero, zero - left) - 62) / 8;
	const rows = [
		{
			id: "call",
			label: t(["Call", "看涨"]),
			value: callMid(spot),
			className: "wt-long-soft",
		},
		{
			id: "put",
			label: t(["Put", "看跌"]),
			value: putUnknown ? 0 : putMid(spot),
			className: "wt-short-soft",
			unknown: putUnknown,
		},
		{
			id: "diff",
			label: t(["Call − put", "看涨 − 看跌"]),
			value: callMid(spot) - putMid(spot),
			className: "wt-long",
			hidden: stage < 1,
		},
		{
			id: "stock",
			label: t(["ALFA − $100", "ALFA − $100"]),
			value: spot - STRIKE,
			className: "wt-long",
			hidden: stage < 1,
		},
	];
	const valueText = (row: (typeof rows)[number]) =>
		"unknown" in row && row.unknown ? "?" : signedShare(row.value);
	const rowHeight = narrow ? 50 : 40;
	const [what, how] = [
		t(["Oct 18 100 call and put", "10月18日 100 看涨与看跌"]),
		t([`model mids · ALFA $${spot}`, `模型中间价 · ALFA $${spot}`]),
	];
	// On a phone the title takes two lines and the bars start under the second.
	const top = narrow ? 45 : 30;
	return (
		<g>
			{(narrow ? [what, how] : [`${what} · ${how}`]).map((line, i) => (
				<Label key={line} x={14} y={16 + i * 15} tone="muted">
					{line}
				</Label>
			))}
			<path
				d={`M${zero} ${top}V${top + rows.length * rowHeight}`}
				className="wt-axis"
			/>
			{rows.map((row, i) => {
				const y = top + 4 + i * rowHeight + (narrow ? 18 : 0);
				const end = zero + row.value * scale;
				const x = Math.min(zero, end);
				const barWidth = Math.abs(end - zero);
				return (
					<m.g
						key={row.id}
						initial={false}
						animate={{ opacity: row.hidden ? 0 : 1 }}
						transition={motion.fade}
					>
						<Label x={14} y={narrow ? y - 4 : y + 16}>
							{row.label}
						</Label>
						<m.rect
							y={y + 2}
							height={20}
							rx={3}
							className={row.className}
							initial={false}
							animate={{ x, width: Math.max(barWidth, 1) }}
							transition={motion.move}
						/>
						{/* Start-anchored, so a value whose bar changes side slides across. */}
						<m.text
							y={y + 17}
							textAnchor="start"
							initial={false}
							data-tx={startAt(
								valueText(row),
								end + (row.value >= 0 ? 6 : -6),
								13,
								row.value >= 0 ? "start" : "end",
							)}
							animate={{
								x: startAt(
									valueText(row),
									end + (row.value >= 0 ? 6 : -6),
									13,
									row.value >= 0 ? "start" : "end",
								),
							}}
							transition={motion.move}
						>
							{valueText(row)}
						</m.text>
					</m.g>
				);
			})}
		</g>
	);
}

function BalanceView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: BalanceState;
	explore: BalanceState | null;
	setExplore: (next: BalanceState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const call = callMid(shown.spot);
	const put = putMid(shown.spot);
	const narrow = (width: number) => width < 520;
	const result: ResultItem[] = [
		{
			id: "call",
			label: t(["Call mid", "看涨中间价"]),
			value: share(call),
			evidence: "modeled",
		},
		{
			id: "put",
			label: t(["Put mid", "看跌中间价"]),
			value: share(put),
			evidence: "modeled",
		},
	];
	if (shown.stage >= 1)
		result.push({
			id: "parity",
			label: t(["Call − put", "看涨 − 看跌"]),
			value: signedShare(call - put),
			note: t([
				`= ALFA − $100 = ${signedShare(shown.spot - STRIKE)}`,
				`= ALFA − $100 = ${signedShare(shown.spot - STRIKE)}`,
			]),
			tone: "gain",
			evidence: "calculated",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The Oct 18 100 call and put prices, and how their difference matches ALFA minus the strike",
						"10月18日 100 看涨与看跌的价格，以及两者之差如何等于 ALFA 减行权价",
					])}
					height={(width) => (narrow(width) ? 250 : 200)}
				>
					{(width) => (
						<Balance
							width={width}
							spot={shown.spot}
							stage={shown.stage}
							putUnknown={phase === "predict"}
							locale={locale}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<RangeControl
						label={t(["ALFA today", "今天的 ALFA"])}
						value={explore.spot}
						display={`$${explore.spot}`}
						min={94}
						max={106}
						onChange={(spot) => setExplore({ ...explore, spot })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Because a call minus a put at the same strike and expiry behaves like the stock minus the strike, their prices must line up: C − P = S − K. This course's model has no interest or dividends; with them, the strike is discounted for interest and expected dividends come off the stock, so C − P = S − PV(K) − PV(dividends). American-style early exercise adds a little more slack. Listed quotes respect parity within their spreads, because traders would otherwise buy the cheap side and sell the rich one.",
						"同一行权价和到期日的看涨减看跌，表现得就像股票减行权价，所以它们的价格必须对得上：C − P = S − K。本课的模型没有利息和股息；如果有，行权价要按利息折现，预期股息要从股价中扣除，即 C − P = S − PV(K) − PV(股息)。美式期权可以提前行权，又会多出一点余地。挂牌报价会在买卖价差之内遵守平价关系，否则交易者会买入便宜的一边、卖出贵的一边。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: check a print against parity ———

type PrintState = { step: 0 | 1 | 2 };

function PrintsView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: PrintState;
	explore: PrintState | null;
	setExplore: (next: PrintState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const callRow = (late: boolean): TapeRow => ({
		key: "d-call",
		cells: [
			late ? "13:58" : "14:12",
			t(["100 call", "100 看涨"]),
			share(LATE.call),
			late ? share(LATE.spot) : share(AFTERNOON.spot),
			late ? t(["late report", "延迟报告"]) : "",
		],
	});
	const rows: TapeRow[] = [
		...(shown.step >= 1 ? [callRow(shown.step >= 2)] : []),
		{
			key: "c-put",
			cells: [
				"14:12",
				t(["100 put", "100 看跌"]),
				share(AFTERNOON.put),
				share(AFTERNOON.spot),
				"",
			],
			muted: shown.step === 0,
		},
		{
			key: "b-put",
			cells: [
				"10:30",
				t(["100 put", "100 看跌"]),
				share(MORNING.put),
				share(MORNING.spot),
				"",
			],
			muted: shown.step >= 1,
		},
		{
			key: "a-call",
			cells: [
				"10:30",
				t(["100 call", "100 看涨"]),
				share(MORNING.call),
				share(MORNING.spot),
				"",
			],
			muted: shown.step >= 1,
		},
	];
	// The working in two parts: one line on a wide stage, two on a phone.
	const check =
		shown.step === 0
			? {
					gap: MORNING.call - MORNING.put - (MORNING.spot - STRIKE),
					parts: [
						t([
							`call − put = ${share(MORNING.call - MORNING.put)}`,
							`看涨 − 看跌 = ${share(MORNING.call - MORNING.put)}`,
						]),
						`ALFA − $100 = ${share(MORNING.spot - STRIKE)}`,
					],
					join: " · ",
				}
			: shown.step === 1
				? {
						gap: GAP,
						parts: [
							t([
								`parity call = put ${share(AFTERNOON.put)} + ${share(AFTERNOON.spot - STRIKE)} = ${share(AFTERNOON_PARITY)}`,
								`平价看涨 = 看跌 ${share(AFTERNOON.put)} + ${share(AFTERNOON.spot - STRIKE)} = ${share(AFTERNOON_PARITY)}`,
							]),
							t([`print ${share(LATE.call)}`, `成交 ${share(LATE.call)}`]),
						],
						join: " · ",
					}
				: {
						gap: LATE.call - (LATE_PUT + (LATE.spot - STRIKE)),
						parts: [
							t(["at 13:58", "13:58 时"]),
							t([
								`parity call = put ${share(LATE_PUT)} + ${share(LATE.spot - STRIKE)} = ${share(LATE_PUT + LATE.spot - STRIKE)}`,
								`平价看涨 = 看跌 ${share(LATE_PUT)} + ${share(LATE.spot - STRIKE)} = ${share(LATE_PUT + LATE.spot - STRIKE)}`,
							]),
						],
						join: t([" ", ""]),
					};
	const off = Math.abs(check.gap) >= 0.1;
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Oct 18 100 call and put prints with ALFA's price at each, checked against put-call parity",
						"10月18日 100 看涨与看跌的成交及当时的 ALFA 价格，用看涨看跌平价来核对",
					])}
					height={(width) => tapeHeight(4) + (width < 520 ? 84 : 66)}
				>
					{(width) => (
						<g>
							<TradeTape
								x={8}
								y={4}
								width={width - 16}
								// Every print here is at the 100 strike: on a phone the title names it once
								// and each row keeps only call or put.
								title={
									width < 520
										? t([
												"Time and sales · ALFA Oct 18 100",
												"逐笔成交 · ALFA 10月18日 100",
											])
										: t([
												"Time and sales · ALFA Oct 18 options",
												"逐笔成交 · ALFA 10月18日 期权",
											])
								}
								columns={
									width < 520
										? [
												{ label: t(["Time", "时间"]), share: 0.34 },
												{ label: t(["Type", "类型"]), share: 0.16 },
												{
													label: t(["Price", "价格"]),
													share: 0.22,
													align: "end",
												},
												{
													label: t(["ALFA", "ALFA"]),
													share: 0.28,
													align: "end",
												},
											]
										: [
												{ label: t(["Time", "时间"]), share: 0.14 },
												{ label: t(["Contract", "合约"]), share: 0.22 },
												{
													label: t(["Price", "价格"]),
													share: 0.16,
													align: "end",
												},
												{
													label: t(["ALFA then", "当时 ALFA"]),
													share: 0.2,
													align: "end",
												},
												{
													label: t(["Condition", "条件"]),
													share: 0.28,
													align: "end",
												},
											]
								}
								rows={
									width < 520
										? rows.map((row) => ({
												...row,
												// No room for the condition column: a late report says so by its time.
												cells: [
													row.cells[4]
														? `${row.cells[0]} ${t(["late", "延迟"])}`
														: row.cells[0],
													row.cells[1].replace(/^100 /, ""),
													...row.cells.slice(2, 4),
												],
											}))
										: rows
								}
								maxRows={4}
								empty={t(["No prints", "没有成交"])}
							/>
							{(width < 520 ? check.parts : [check.parts.join(check.join)]).map(
								(part, i) => (
									<Label
										key={part}
										x={14}
										y={tapeHeight(4) + 26 + i * 15}
										maxWidth={width - 28}
										tone="small"
									>
										{part}
									</Label>
								),
							)}
							<Label
								x={14}
								y={tapeHeight(4) + (width < 520 ? 70 : 52)}
								tone={off ? "loss" : "gain"}
							>
								{off
									? t([
											`${signedShare(check.gap)} from parity: check the print`,
											`偏离平价 ${signedShare(check.gap)}：核查这笔成交`,
										])
									: t([
											`within ${share(Math.max(Math.abs(check.gap), 0.01))} of parity: in line`,
											`与平价相差不超过 ${share(Math.max(Math.abs(check.gap), 0.01))}：正常`,
										])}
							</Label>
						</g>
					)}
				</Stage>
			}
			result={[
				{
					id: "gap",
					label: t(["Gap from parity", "偏离平价"]),
					value: signedShare(check.gap),
					tone: off ? "loss" : "gain",
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Check", "核对"])}
						value={String(explore.step) as "0" | "1" | "2"}
						options={[
							["0", t(["Morning pair", "上午这一组"])],
							["1", t(["Call vs 14:12 put", "看涨对 14:12 看跌"])],
							["2", t(["Call at its own time", "看涨按自身时间"])],
						]}
						onChange={(value) =>
							setExplore({ step: Number(value) as PrintState["step"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Parity only holds between prices from the same moment. Before reading anything into a print that breaks it, check its time against ALFA's price then, its condition codes (late, out of sequence, a leg of a complex order), and whether it was corrected. A gap that survives those checks is worth a note in your research, not a conclusion about anyone's information.",
						"平价关系只在同一时刻的价格之间成立。在对一笔偏离平价的成交下任何结论之前，先核对它的时间和当时的 ALFA 价格、它的条件代码（延迟、顺序错乱、复杂订单的一条腿），以及它是否被更正过。经过这些核查仍然存在的偏差，值得在研究中记一笔，但不能据此断定谁掌握了什么信息。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<SyntheticState, SyntheticState>({
		id: "synthetic",
		label: ["Call minus put", "看涨减看跌"],
		title: [
			"A long call and a short put make 100 shares",
			"看涨多头加看跌空头，等于 100 股",
		],
		predict: {
			prompt: [
				"You buy the Oct 18 100 call and sell the Oct 18 100 put. At expiry ALFA is $90. Before premiums, what are the two legs worth together?",
				"你买入 10月18日 100 看涨，并卖出 10月18日 100 看跌。到期时 ALFA 为 $90。不计权利金，两条腿合计价值多少？",
			],
			choices: [
				{ id: "line", label: ["−$1,000", "−$1,000"] },
				{
					id: "call",
					label: ["$0: the call expires worthless", "$0：看涨到期作废"],
				},
				{ id: "put", label: ["+$1,000: the put pays", "+$1,000：看跌赚钱"] },
			],
			answer: "line",
			entry: { answer: -1000, prefix: "$" },
			revealAt: 2,
			explain: [
				"The call expires worthless, and the put you sold costs you $100 − $90 = $10 a share: −$1,000. Together the two legs move dollar for dollar with ALFA, just like 100 shares bought at $100.",
				"看涨到期作废，而你卖出的看跌每股要付 $100 − $90 = $10：−$1,000。两条腿合起来随 ALFA 一美元一美元地变动，和以 $100 买入的 100 股完全一样。",
			],
		},
		beats: [
			{
				id: "call",
				label: ["Long call", "看涨多头"],
				caption: [
					"The long Oct 18 100 call is worth ALFA minus $100 above the strike, and nothing below it: $0 at $90.",
					"10月18日 100 看涨多头在行权价以上值 ALFA 减 $100，在行权价以下一文不值：$90 时为 $0。",
				],
				state: { stage: 0, spot: 90 },
			},
			{
				id: "put",
				label: ["Short put", "看跌空头"],
				caption: [
					"The short Oct 18 100 put costs you $100 minus ALFA below the strike: −$1,000 at $90, nothing above $100.",
					"10月18日 100 看跌空头在行权价以下要付 $100 减 ALFA：$90 时为 −$1,000，$100 以上为零。",
				],
				state: { stage: 1, spot: 90 },
			},
			{
				id: "sum",
				label: ["The sum", "合计"],
				caption: [
					"Add them at every price: −$1,000 at $90, +$1,000 at $110. One straight line, exactly like 100 shares bought at $100.",
					"在每个价格上相加：$90 时 −$1,000，$110 时 +$1,000。一条直线，和以 $100 买入的 100 股完全一样。",
				],
				state: { stage: 2, spot: 90 },
			},
			{
				id: "cost",
				label: ["The premiums", "权利金"],
				caption: [
					"You paid the $4.20 ask for the call and received the $4.05 bid for the put: a $0.15 net debit, like 100 shares bought at $100.15.",
					"你按 $4.20 的卖价买入看涨，按 $4.05 的买价卖出看跌：净支出 $0.15，相当于以 $100.15 买入 100 股。",
				],
				state: { stage: 3, spot: 90 },
			},
		],
		explore: {
			prompt: [
				"Drag ALFA's expiry price and compare the two legs with their sum.",
				"拖动 ALFA 的到期价格，比较两条腿和它们的合计。",
			],
			start: () => ({ stage: 2, spot: 100 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the price where the short put costs you exactly what the long call pays at $112.",
					"找出一个价格，使看跌空头让你付出的，正好等于看涨多头在 $112 时赚到的。",
				],
				reached: (e) => e.spot === 88,
				done: [
					"At $88 the short put costs $1,200, the mirror of the call's $1,200 at $112. Each leg covers one side of the strike, which is why together they make one straight line through it.",
					"$88 时看跌空头要付 $1,200，正好是看涨在 $112 时 $1,200 的镜像。每条腿各管行权价的一侧，所以合起来是一条穿过行权价的直线。",
				],
			},
		},
		View: SyntheticView,
	}),
	defineScene<BalanceState, BalanceState>({
		id: "price-pair",
		label: ["Price one from the other", "由一个推出另一个"],
		title: [
			"Call minus put equals stock minus strike",
			"看涨减看跌，等于股价减行权价",
		],
		predict: {
			prompt: [
				"ALFA is $102 and the Oct 18 100 call's mid is $5.25. With no interest or dividends, what should the 100 put's mid be?",
				"ALFA 为 $102，10月18日 100 看涨的中间价是 $5.25。在没有利息和股息的情况下，100 看跌的中间价应该是多少？",
			],
			choices: [
				{ id: "parity", label: ["$3.25", "$3.25"] },
				{
					id: "same",
					label: ["$5.25, the same as the call", "$5.25，和看涨一样"],
				},
				{
					id: "added",
					label: ["$7.25: $5.25 + $2.00", "$7.25：$5.25 + $2.00"],
				},
			],
			answer: "parity",
			entry: { answer: 3.25, tolerance: 0.02, prefix: "$" },
			revealAt: 1,
			explain: [
				"Call minus put has to equal ALFA minus the strike: $102 − $100 = $2.00. So the put is $5.25 − $2.00 = $3.25.",
				"看涨减看跌必须等于 ALFA 减行权价：$102 − $100 = $2.00。所以看跌为 $5.25 − $2.00 = $3.25。",
			],
		},
		beats: [
			{
				id: "pair",
				label: ["The pair", "这一组"],
				caption: [
					"With ALFA at $102, the model prices the Oct 18 100 call at $5.25 and the 100 put at $3.25.",
					"ALFA 为 $102 时，模型给 10月18日 100 看涨定价 $5.25，100 看跌定价 $3.25。",
				],
				state: { stage: 0, spot: 102 },
			},
			{
				id: "gap",
				label: ["The difference", "差额"],
				caption: [
					"Call minus put is $2.00, and so is ALFA minus the strike. That's put-call parity: C − P = S − K.",
					"看涨减看跌是 $2.00，ALFA 减行权价也是。这就是看涨看跌平价：C − P = S − K。",
				],
				state: { stage: 1, spot: 102 },
			},
			{
				id: "below",
				label: ["Below the strike", "低于行权价"],
				caption: [
					"At ALFA $97 the put is the dearer one: call minus put is −$3.00, the same as $97 − $100.",
					"ALFA 为 $97 时，看跌反而更贵：看涨减看跌为 −$3.00，与 $97 − $100 相同。",
				],
				state: { stage: 1, spot: 97 },
			},
		],
		explore: {
			prompt: [
				"Move ALFA and watch the call, the put and the two differences.",
				"移动 ALFA，观察看涨、看跌以及两个差额。",
			],
			start: () => ({ stage: 1, spot: 104 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the price at which the call and the put cost the same.",
					"找出看涨和看跌价格相同的那个价格。",
				],
				reached: (e) => e.spot === 100,
				done: [
					"At $100, ALFA minus the strike is zero, so call minus put must be zero too: both are about $4.13. Above $100 the call is dearer, below it the put.",
					"在 $100 时，ALFA 减行权价为零，所以看涨减看跌也必须为零：两者都约为 $4.13。高于 $100 时看涨更贵，低于时看跌更贵。",
				],
			},
		},
		View: BalanceView,
	}),
	defineScene<PrintState, PrintState>({
		id: "check-print",
		label: ["Check a print", "核对一笔成交"],
		title: [
			"Parity holds between prices from the same moment",
			"平价关系只在同一时刻的价格之间成立",
		],
		predict: {
			prompt: [
				"At 14:12, with ALFA at $102.00, the Oct 18 100 put prints at $3.25 and the 100 call at $5.90. How far above parity is the call print?",
				"14:12，ALFA 为 $102.00，10月18日 100 看跌成交在 $3.25，100 看涨成交在 $5.90。这笔看涨成交比平价高出多少？",
			],
			choices: [
				{ id: "gap", label: ["$0.65", "$0.65"] },
				{ id: "diff", label: ["$2.65: call minus put", "$2.65：看涨减看跌"] },
				{
					id: "none",
					label: ["$0: prints can't break parity", "$0：成交不会偏离平价"],
				},
			],
			answer: "gap",
			entry: { answer: 0.65, tolerance: 0.01, prefix: "$" },
			revealAt: 1,
			explain: [
				"Parity puts the call at the put plus ALFA minus the strike: $3.25 + $2.00 = $5.25. The print is $0.65 higher, so check its time and conditions before reading anything into it.",
				"平价关系给出的看涨价格是看跌加 ALFA 减行权价：$3.25 + $2.00 = $5.25。这笔成交高出 $0.65，所以在解读之前先核查它的时间和条件。",
			],
		},
		beats: [
			{
				id: "morning",
				label: ["In line", "正常"],
				caption: [
					"At 10:30, with ALFA $100.02, the call printed $4.15 and the put $4.10: call minus put is $0.05 against $0.02. Within the spread, in line.",
					"10:30，ALFA 为 $100.02，看涨成交 $4.15，看跌成交 $4.10：看涨减看跌为 $0.05，对照 $0.02。在价差范围之内，正常。",
				],
				state: { step: 0 },
			},
			{
				id: "outlier",
				label: ["Out of line", "偏离"],
				caption: [
					"At 14:12 the put prints $3.25 with ALFA $102, so parity puts the call near $5.25. A call print at $5.90 is $0.65 off.",
					"14:12 看跌成交 $3.25，ALFA 为 $102，所以平价给出的看涨价格约为 $5.25。看涨成交在 $5.90，偏离了 $0.65。",
				],
				state: { step: 1 },
			},
			{
				id: "late",
				label: ["Its own time", "按其时间"],
				caption: [
					"The call print carries a late-report code: it executed at 13:58, with ALFA at $103.05. Against that moment, parity puts the call at $5.90. In line after all.",
					"这笔看涨成交带有延迟报告代码：它实际成交于 13:58，当时 ALFA 为 $103.05。以那个时刻为准，平价给出的看涨价格就是 $5.90。其实是正常的。",
				],
				state: { step: 2 },
			},
		],
		explore: {
			prompt: [
				"Choose which prices to check the call print against.",
				"选择用哪些价格来核对这笔看涨成交。",
			],
			start: () => ({ step: 1 }),
			task: {
				kind: "answer",
				prompt: [
					"Matched with ALFA's price at its own execution time, how far from parity is the call print?",
					"用它实际成交时的 ALFA 价格来对照，这笔看涨成交偏离平价多少？",
				],
				choices: [
					{ id: "zero", label: ["About $0: in line", "约 $0：正常"] },
					{ id: "gap", label: ["$0.65 above", "高出 $0.65"] },
					{ id: "diff", label: ["$2.65 above", "高出 $2.65"] },
				],
				answer: "zero",
				done: [
					"At 13:58 ALFA was $103.05, so parity put the call at the put's $2.85 plus $3.05: $5.90. The gap came from comparing prices from two different moments.",
					"13:58 时 ALFA 为 $103.05，所以平价给出的看涨价格是看跌的 $2.85 加 $3.05：$5.90。偏差来自拿两个不同时刻的价格做比较。",
				],
			},
		},
		View: PrintsView,
	}),
] as const;

export function PutCallParityWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Player
			locale={locale}
			id="put-call-parity"
			label={["Interactive lesson on put-call parity", "看涨看跌平价互动课"]}
			film={putCallParityFilm}
			scenes={scenes}
		/>
	);
}
