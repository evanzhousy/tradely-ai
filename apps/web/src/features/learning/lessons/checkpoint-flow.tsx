import { type Copy, count, pick, usd } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import type { TapeRow } from "../walkthrough/instruments/trade-tape";
import { Stage } from "../walkthrough/stage";
import { defineScene, type Phase } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";
import {
	CaseSheet,
	CHECKPOINT_DAY,
	type SheetLine,
	sheetHeight,
} from "./checkpoint-kit";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);
const twoColumns = (t: (value: Copy) => string) => [
	{ label: t(["Record", "记录"]), share: 0.62 },
	{ label: t(["Value", "数值"]), share: 0.38, align: "end" as const },
];
const row = (
	key: string,
	label: string,
	value: string,
	muted = false,
): TapeRow => ({
	key,
	cells: [label, value],
	muted,
});

// ——— Scene 1: open interest from a complete record ———

type Side = "open" | "close";
type OiState = { stage: 0 | 1 | 2; buyer: Side; seller: Side; size: number };

const START_OI = 2_600;
const OPENED = 300;
const CLOSED = 120;
const TRANSFERRED = 80;
const END_OI = START_OI + OPENED - CLOSED;
const oiChange = (buyer: Side, seller: Side, size: number) =>
	buyer === "open" && seller === "open"
		? size
		: buyer === "close" && seller === "close"
			? -size
			: 0;

function OiView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: OiState;
	explore: OiState | null;
	setExplore: (next: OiState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const exploring = phase === "explore";
	const change = oiChange(shown.buyer, shown.seller, shown.size);
	const rows: TapeRow[] = exploring
		? [
				row("a", t(["Open interest before", "之前的未平仓量"]), count(END_OI)),
				row(
					"b",
					t(["Buyer", "买方"]),
					t(shown.buyer === "open" ? ["opens", "开仓"] : ["closes", "平仓"]),
				),
				row(
					"c",
					t(["Seller", "卖方"]),
					t(shown.seller === "open" ? ["opens", "开仓"] : ["closes", "平仓"]),
				),
				row("d", t(["Contracts", "张数"]), count(shown.size)),
			]
		: [
				row(
					"a",
					t(["Open interest, Tue close", "周二收盘未平仓量"]),
					count(START_OI),
				),
				row("b", t(["Both sides opened", "双方都开仓"]), count(OPENED)),
				row("c", t(["Both sides closed", "双方都平仓"]), count(CLOSED)),
				row(
					"d",
					t(["One opened, one closed", "一方开仓、一方平仓"]),
					count(TRANSFERRED),
				),
			];
	const lines: SheetLine[] = [];
	if (exploring)
		lines.push(
			{
				text: t([
					`volume +${count(shown.size)}`,
					`成交量 +${count(shown.size)}`,
				]),
			},
			{
				text: t([
					`open interest ${change > 0 ? "+" : change < 0 ? "−" : "±"}${count(Math.abs(change))} → ${count(END_OI + change)}`,
					`未平仓量 ${change > 0 ? "+" : change < 0 ? "−" : "±"}${count(Math.abs(change))} → ${count(END_OI + change)}`,
				]),
				tone: "strong",
			},
		);
	else {
		if (shown.stage >= 1)
			lines.push({
				text: t([
					`volume: ${OPENED} + ${CLOSED} + ${TRANSFERRED} = ${count(OPENED + CLOSED + TRANSFERRED)}`,
					`成交量：${OPENED} + ${CLOSED} + ${TRANSFERRED} = ${count(OPENED + CLOSED + TRANSFERRED)}`,
				]),
			});
		if (shown.stage >= 2)
			lines.push({
				text: t([
					`open interest: ${count(START_OI)} + ${OPENED} − ${CLOSED} = ${count(END_OI)}`,
					`未平仓量：${count(START_OI)} + ${OPENED} − ${CLOSED} = ${count(END_OI)}`,
				]),
				tone: "strong",
			});
	}
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A day's complete opening and closing record for one ALFA call series, and the open interest it leaves",
						"一个 ALFA 看涨系列一天完整的开平仓记录，以及它留下的未平仓量",
					])}
					height={() => sheetHeight(4, 2)}
				>
					{(width) => (
						<CaseSheet
							width={width}
							title={t([
								`Nov 15 105 call · ${CHECKPOINT_DAY[0]}`,
								`11月15日 105 看涨 · ${CHECKPOINT_DAY[1]}`,
							])}
							columns={twoColumns(t)}
							rows={rows}
							maxRows={4}
							lines={lines}
						/>
					)}
				</Stage>
			}
			result={[
				exploring
					? {
							id: "change",
							label: t(["Open interest changes", "未平仓量变化"]),
							value: `${change > 0 ? "+" : change < 0 ? "−" : ""}${count(Math.abs(change))}`,
							evidence: "calculated",
						}
					: {
							id: "end",
							label: t(["Open interest, Wed close", "周三收盘未平仓量"]),
							value: shown.stage >= 2 ? count(END_OI) : "?",
							evidence: "calculated",
						},
			]}
			controls={
				explore ? (
					<>
						<ChoiceField
							label={t(["Buyer", "买方"])}
							value={explore.buyer}
							options={[
								["open", t(["Opens", "开仓"])],
								["close", t(["Closes", "平仓"])],
							]}
							onChange={(buyer) => setExplore({ ...explore, buyer })}
						/>
						<ChoiceField
							label={t(["Seller", "卖方"])}
							value={explore.seller}
							options={[
								["open", t(["Opens", "开仓"])],
								["close", t(["Closes", "平仓"])],
							]}
							onChange={(seller) => setExplore({ ...explore, seller })}
						/>
						<RangeControl
							label={t(["Contracts", "张数"])}
							value={explore.size}
							display={String(explore.size)}
							min={10}
							max={100}
							step={10}
							onChange={(size) => setExplore({ ...explore, size })}
						/>
					</>
				) : null
			}
		/>
	);
}

// ——— Scene 2: a sweep's average price ———

type SweepState = { stage: 0 | 1 | 2; third: number };

const FILLS = [
	{ size: 15, price: 430 },
	{ size: 10, price: 435 },
] as const;
const THIRD_PRICE = 440;
const average = (third: number) =>
	(FILLS[0].size * FILLS[0].price +
		FILLS[1].size * FILLS[1].price +
		third * THIRD_PRICE) /
	(FILLS[0].size + FILLS[1].size + third) /
	100;
const AVG_TARGET = 4.35;

function SweepView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SweepState;
	explore: SweepState | null;
	setExplore: (next: SweepState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const sizes = [FILLS[0].size, FILLS[1].size, shown.third];
	const prices = [FILLS[0].price, FILLS[1].price, THIRD_PRICE];
	const total = sizes.reduce((a, b) => a + b, 0);
	const premium = sizes.reduce(
		(sum, size, i) => sum + size * prices[i] * 100,
		0,
	);
	const rows: TapeRow[] = sizes.map((size, i) => ({
		key: String.fromCharCode(97 + i),
		cells: [
			`10:52:0${i + 1}`,
			t([`venue ${"ABC"[i]}`, `场所 ${"ABC"[i]}`]),
			count(size),
			usd(prices[i]),
		],
	}));
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: t([
				`premium, all fills: ${usd(premium, 0)}`,
				`权利金，全部成交：${usd(premium, 0)}`,
			]),
		});
	if (shown.stage >= 2)
		lines.push({
			text: t([
				`average: ${usd(premium, 0)} ÷ (100 × ${total}) = $${average(shown.third).toFixed(4)}`,
				`均价：${usd(premium, 0)} ÷ (100 × ${total}) = $${average(shown.third).toFixed(4)}`,
			]),
			tone: "strong",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"One buy order sweeping three venues in the Nov 15 105 call, and its quantity-weighted price",
						"一张买单扫过三个场所买入 11月15日 105 看涨，以及它的按数量加权价格",
					])}
					height={() => sheetHeight(3, 2)}
				>
					{(width) => (
						<CaseSheet
							width={width}
							title={t([
								"Sweep · Nov 15 105 call · one order",
								"扫单 · 11月15日 105 看涨 · 一张订单",
							])}
							columns={[
								{ label: t(["Time", "时间"]), share: 0.3 },
								{ label: t(["Venue", "场所"]), share: 0.26 },
								{ label: t(["Qty", "张数"]), share: 0.16, align: "end" },
								{ label: t(["Price", "价格"]), share: 0.28, align: "end" },
							]}
							rows={rows}
							maxRows={3}
							lines={lines}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "avg",
					label: t(["Average price", "均价"]),
					value: `$${average(shown.third).toFixed(4)}`,
					note: t([`${total} contracts, one order`, `${total} 张，一张订单`]),
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<RangeControl
						label={t(["Third fill, at $4.40", "第三笔，$4.40"])}
						value={explore.third}
						display={String(explore.third)}
						min={5}
						max={30}
						step={5}
						onChange={(third) => setExplore({ ...explore, third })}
					/>
				) : null
			}
		/>
	);
}

// ——— Scene 3: relative to what? ———

type RatioState = { stage: 0 | 1 | 2; base: "typical" | "oi" };

const VOLUME = 1_800;
const TYPICAL = 600;
const OPEN_INTEREST = 9_000;

function RatioView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: RatioState;
	explore: RatioState | null;
	setExplore: (next: RatioState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const denominator = shown.base === "typical" ? TYPICAL : OPEN_INTEREST;
	const rows: TapeRow[] = [
		row("a", t(["Volume, full session", "成交量，完整交易日"]), count(VOLUME)),
		row(
			"b",
			t(["Typical full-session volume", "典型完整交易日成交量"]),
			count(TYPICAL),
			shown.base !== "typical",
		),
		row(
			"c",
			t(["Open interest, last report", "最近一次报告的未平仓量"]),
			count(OPEN_INTEREST),
			shown.base !== "oi",
		),
	];
	const lines: SheetLine[] =
		shown.stage >= 1
			? [
					{
						text: t([
							`${count(VOLUME)} ÷ ${count(denominator)} = ${(VOLUME / denominator).toFixed(denominator === TYPICAL ? 0 : 1)}×`,
							`${count(VOLUME)} ÷ ${count(denominator)} = ${(VOLUME / denominator).toFixed(denominator === TYPICAL ? 0 : 1)}×`,
						]),
						tone: "strong",
					},
					...(shown.stage >= 2
						? [
								{
									text: t([
										"same volume, different yardstick: name the denominator",
										"同样的成交量，不同的量尺：要写明分母",
									]),
								},
							]
						: []),
				]
			: [];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"One contract's session volume against its typical volume and its open interest",
						"一张合约的交易日成交量，分别对照典型成交量和未平仓量",
					])}
					height={() => sheetHeight(3, 2)}
				>
					{(width) => (
						<CaseSheet
							width={width}
							title={t([
								`DUNE Oct 18 40 call · ${CHECKPOINT_DAY[0]}`,
								`DUNE 10月18日 40 看涨 · ${CHECKPOINT_DAY[1]}`,
							])}
							columns={twoColumns(t)}
							rows={rows}
							maxRows={3}
							lines={lines}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "ratio",
					label:
						shown.base === "typical"
							? t(["Relative volume", "相对成交量"])
							: t(["Volume / OI", "成交量 / 未平仓量"]),
					value: `${(VOLUME / denominator).toFixed(denominator === TYPICAL ? 0 : 1)}×`,
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Compare with", "对照"])}
						value={explore.base}
						options={[
							["typical", t(["Typical volume", "典型成交量"])],
							["oi", t(["Open interest", "未平仓量"])],
						]}
						onChange={(base) => setExplore({ ...explore, base })}
					/>
				) : null
			}
		/>
	);
}

// ——— Scene 4: when each field was true ———

type ClockState = { stage: 0 | 1 | 2; flow: "tue" | "wed" };

function ClockView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ClockState;
	explore: ClockState | null;
	setExplore: (next: ClockState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const fits = shown.flow === "wed";
	const rows: TapeRow[] = [
		row(
			"a",
			t(["Need: flow", "需要：成交流"]),
			t(["Wed Oct 2", "10月2日 周三"]),
		),
		row(
			"b",
			t(["Need: open interest", "需要：未平仓量"]),
			t(["earlier, dated", "更早、带日期"]),
		),
		row(
			"c",
			t(["Your flow record", "你的成交记录"]),
			t(fits ? ["Wed Oct 2", "10月2日 周三"] : ["Tue Oct 1", "10月1日 周二"]),
			shown.stage === 0,
		),
		row(
			"d",
			t(["Your OI report", "你的未平仓量报告"]),
			t(["Tue Oct 1 close", "10月1日 周二收盘"]),
			shown.stage === 0,
		),
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: t([
				"OI: earlier and dated is allowed, so it fits",
				"未平仓量：允许更早、带日期，所以符合",
			]),
		});
	if (shown.stage >= 2)
		lines.push({
			text: fits
				? t([
						"flow: Wednesday's session, as required",
						"成交流：周三时段，符合要求",
					])
				: t([
						"flow: Tuesday's, not Wednesday's, so it fails",
						"成交流：周二而不是周三，所以不符合",
					]),
			tone: fits ? "gain" : "loss",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"What a comparison needs from each source, and when each record you have was true",
						"一项比较对每个来源的要求，以及你手上每条记录成立的时间",
					])}
					height={() => sheetHeight(4, 2)}
				>
					{(width) => (
						<CaseSheet
							width={width}
							title={t(["Data clocks · ALFA options", "数据时钟 · ALFA 期权"])}
							columns={twoColumns(t)}
							rows={rows}
							maxRows={4}
							lines={lines}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "fits",
					label: t(["Flow record meets the need", "成交记录符合要求"]),
					value: t(fits ? ["Yes", "是"] : ["No", "否"]),
					tone: fits ? "gain" : "loss",
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Flow record from", "成交记录来自"])}
						value={explore.flow}
						options={[
							["tue", t(["Tue Oct 1", "10月1日 周二"])],
							["wed", t(["Wed Oct 2", "10月2日 周三"])],
						]}
						onChange={(flow) => setExplore({ ...explore, flow })}
					/>
				) : null
			}
		/>
	);
}

// ——— Checkpoint ———

const scenes = [
	defineScene<OiState, OiState>({
		id: "open-interest",
		label: ["Open interest", "未平仓量"],
		title: [
			"Opens add, closes remove, transfers leave it",
			"开仓增加，平仓减少，换手不变",
		],
		revisit: "session-flow-vs-structure",
		predict: {
			prompt: [
				`The Nov 15 105 call closed Tuesday with open interest of ${count(START_OI)}. Wednesday's complete record: ${OPENED} contracts where both sides opened, ${CLOSED} where both closed, and ${TRANSFERRED} where one opened and one closed. What is open interest at Wednesday's close?`,
				`11月15日 105 看涨周二收盘的未平仓量为 ${count(START_OI)}。周三完整的记录：${OPENED} 张双方都开仓，${CLOSED} 张双方都平仓，${TRANSFERRED} 张一方开仓、一方平仓。周三收盘时未平仓量是多少？`,
			],
			choices: [
				{ id: "right", label: [count(END_OI), count(END_OI)] },
				{
					id: "volume",
					label: [
						count(START_OI + OPENED + CLOSED + TRANSFERRED),
						count(START_OI + OPENED + CLOSED + TRANSFERRED),
					],
				},
				{
					id: "transfer",
					label: [count(END_OI + TRANSFERRED), count(END_OI + TRANSFERRED)],
				},
			],
			answer: "right",
			entry: { answer: END_OI, unit: [" contracts", " 张"] },
			revealAt: 2,
			explain: [
				`${count(START_OI)} + ${OPENED} − ${CLOSED} = ${count(END_OI)}. The ${TRANSFERRED} transferred contracts changed hands without changing the count.`,
				`${count(START_OI)} + ${OPENED} − ${CLOSED} = ${count(END_OI)}。换手的 ${TRANSFERRED} 张只换了持有人，没有改变数量。`,
			],
		},
		beats: [
			{
				id: "record",
				label: ["The record", "记录"],
				caption: [
					"Tuesday's close and Wednesday's complete opening and closing record for the Nov 15 105 call.",
					"11月15日 105 看涨周二收盘的数据，以及周三完整的开平仓记录。",
				],
				state: { stage: 0, buyer: "open", seller: "close", size: 50 },
			},
			{
				id: "volume",
				label: ["Volume", "成交量"],
				caption: [
					`Every trade counts in volume: ${count(OPENED + CLOSED + TRANSFERRED)}.`,
					`每笔成交都计入成交量：${count(OPENED + CLOSED + TRANSFERRED)}。`,
				],
				state: { stage: 1, buyer: "open", seller: "close", size: 50 },
			},
			{
				id: "oi",
				label: ["Open interest", "未平仓量"],
				caption: [
					`Opens add ${OPENED}, closes remove ${CLOSED}, transfers change nothing: ${count(END_OI)}.`,
					`开仓增加 ${OPENED}，平仓减少 ${CLOSED}，换手不变：${count(END_OI)}。`,
				],
				state: { stage: 2, buyer: "open", seller: "close", size: 50 },
			},
		],
		explore: {
			prompt: [
				"Make one more trade: choose each side's action and the size.",
				"再做一笔成交：选择双方的动作和数量。",
			],
			start: () => ({ stage: 2, buyer: "open", seller: "open", size: 30 }),
			task: {
				kind: "reach",
				prompt: [
					"Make a 50-contract trade that leaves open interest unchanged.",
					"做一笔 50 张、不改变未平仓量的成交。",
				],
				reached: (e) => e.size === 50 && e.buyer !== e.seller,
				done: [
					"When one side opens and the other closes, the contracts change hands: volume rises by 50 and open interest doesn't move.",
					"一方开仓、另一方平仓时，合约只是换手：成交量增加 50，未平仓量不变。",
				],
			},
		},
		View: OiView,
	}),
	defineScene<SweepState, SweepState>({
		id: "sweep",
		label: ["A sweep", "扫单"],
		title: [
			"One order, three prints, one weighted price",
			"一张订单，三笔成交，一个加权价格",
		],
		revisit: "execution-conditions",
		predict: {
			prompt: [
				"One buy order sweeps three venues: 15 Nov 15 105 calls at $4.30, 10 at $4.35 and 5 at $4.40. What average price did it pay per share, weighted by contracts?",
				"一张买单扫过三个场所：15 张 11月15日 105 看涨成交在 $4.30，10 张在 $4.35，5 张在 $4.40。按张数加权，它平均每股付了多少？",
			],
			choices: [
				{
					id: "weighted",
					label: [`$${average(5).toFixed(2)}`, `$${average(5).toFixed(2)}`],
				},
				{ id: "simple", label: ["$4.35", "$4.35"] },
				{ id: "first", label: ["$4.30", "$4.30"] },
			],
			answer: "weighted",
			entry: { answer: average(5), tolerance: 0.005, prefix: "$" },
			revealAt: 2,
			explain: [
				`(15 × $4.30 + 10 × $4.35 + 5 × $4.40) ÷ 30 = $${average(5).toFixed(4)}. The simple average, $4.35, ignores that most contracts filled at $4.30.`,
				`(15 × $4.30 + 10 × $4.35 + 5 × $4.40) ÷ 30 = $${average(5).toFixed(4)}。简单平均 $4.35 忽略了大部分合约成交在 $4.30。`,
			],
		},
		beats: [
			{
				id: "fills",
				label: ["Three fills", "三笔成交"],
				caption: [
					"One order, three venues, three prints within a second, each flagged as a sweep.",
					"一张订单、三个场所、一秒之内的三笔成交，每笔都带扫单标记。",
				],
				state: { stage: 0, third: 5 },
			},
			{
				id: "premium",
				label: ["Premium", "权利金"],
				caption: [
					"Add each fill's price × contracts × 100: $13,000 in all.",
					"把每笔的价格 × 张数 × 100 加起来：共 $13,000。",
				],
				state: { stage: 1, third: 5 },
			},
			{
				id: "average",
				label: ["Average", "均价"],
				caption: [
					`Divide by 100 × 30 contracts: $${average(5).toFixed(4)} a share.`,
					`除以 100 × 30 张：每股 $${average(5).toFixed(4)}。`,
				],
				state: { stage: 2, third: 5 },
			},
		],
		explore: {
			prompt: ["Change the size of the third fill.", "改变第三笔的数量。"],
			start: () => ({ stage: 2, third: 5 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the size of the $4.40 fill that makes the average exactly $4.35.",
					"找出让均价正好为 $4.35 的 $4.40 那笔的数量。",
				],
				reached: (e) => Math.abs(average(e.third) - AVG_TARGET) < 1e-9,
				done: [
					"With 15 at $4.40, it balances the 15 at $4.30 around the 10 at $4.35: exactly $4.35. Weighting by size is what moves the average.",
					"$4.40 的 15 张与 $4.30 的 15 张围绕 $4.35 的 10 张相互抵消：正好 $4.35。是数量的权重在移动均价。",
				],
			},
		},
		View: SweepView,
	}),
	defineScene<RatioState, RatioState>({
		id: "unusual",
		label: ["Unusual?", "异常？"],
		title: ["Unusual compared with what?", "异常，是和什么比？"],
		revisit: "unusual-activity",
		predict: {
			prompt: [
				`The DUNE Oct 18 40 call traded ${count(VOLUME)} contracts over the full session. It typically trades ${count(TYPICAL)}, and ${count(OPEN_INTEREST)} are open. What is its relative volume?`,
				`DUNE 10月18日 40 看涨整个交易日成交了 ${count(VOLUME)} 张。它通常成交 ${count(TYPICAL)} 张，未平仓量为 ${count(OPEN_INTEREST)} 张。它的相对成交量是多少？`,
			],
			choices: [
				{ id: "relative", label: ["3×", "3×"] },
				{ id: "oi", label: ["0.2×", "0.2×"] },
				{ id: "raw", label: ["1,800", "1,800"] },
			],
			answer: "relative",
			entry: { answer: VOLUME / TYPICAL, tolerance: 0.05, unit: ["×", "×"] },
			revealAt: 1,
			explain: [
				`${count(VOLUME)} ÷ ${count(TYPICAL)} = 3×. Against open interest the same volume is 0.2×: a different denominator answers a different question.`,
				`${count(VOLUME)} ÷ ${count(TYPICAL)} = 3×。对照未平仓量，同样的成交量是 0.2×：不同的分母回答不同的问题。`,
			],
		},
		beats: [
			{
				id: "numbers",
				label: ["The numbers", "数据"],
				caption: [
					"One full session's volume, beside two possible yardsticks.",
					"一个完整交易日的成交量，以及两个可能的量尺。",
				],
				state: { stage: 0, base: "typical" },
			},
			{
				id: "relative",
				label: ["Relative", "相对"],
				caption: [
					`Against a typical session: ${count(VOLUME)} ÷ ${count(TYPICAL)} = 3×.`,
					`对照典型交易日：${count(VOLUME)} ÷ ${count(TYPICAL)} = 3×。`,
				],
				state: { stage: 1, base: "typical" },
			},
			{
				id: "oi",
				label: ["Against OI", "对照未平仓量"],
				caption: [
					`Against open interest: ${count(VOLUME)} ÷ ${count(OPEN_INTEREST)} = 0.2×. Say which one you mean.`,
					`对照未平仓量：${count(VOLUME)} ÷ ${count(OPEN_INTEREST)} = 0.2×。要说明你用的是哪一个。`,
				],
				state: { stage: 2, base: "oi" },
			},
		],
		explore: {
			prompt: ["Switch the denominator.", "切换分母。"],
			start: () => ({ stage: 2, base: "typical" }),
			task: {
				kind: "answer",
				prompt: [
					"Which ratio says how today compares with a normal day for this contract?",
					"哪个比率说明了今天与这张合约平常的一天相比如何？",
				],
				choices: [
					{
						id: "typical",
						label: ["3×, against typical volume", "3×，对照典型成交量"],
					},
					{
						id: "oi",
						label: ["0.2×, against open interest", "0.2×，对照未平仓量"],
					},
					{
						id: "either",
						label: ["Either: they mean the same", "都可以：意思一样"],
					},
				],
				answer: "typical",
				done: [
					'Relative volume compares today with a normal day; volume/OI compares it with the contracts outstanding. Only the first answers "unusual for this contract?"',
					"相对成交量把今天和平常的一天比较；成交量/未平仓量把它和存续的合约比较。只有前者回答“对这张合约来说是否异常”。",
				],
			},
		},
		View: RatioView,
	}),
	defineScene<ClockState, ClockState>({
		id: "clocks",
		label: ["Data clocks", "数据时钟"],
		title: [
			"Check each field against its own requirement",
			"每个字段对照它自己的要求",
		],
		revisit: "symbol-drawer",
		predict: {
			prompt: [
				"You need Wednesday's ALFA option flow plus open interest from an earlier dated report. Your flow record is stamped Tue Oct 1; your OI report is Tuesday's close. Does the flow record meet the need?",
				"你需要 ALFA 周三的期权成交流，以及更早、带日期报告中的未平仓量。你的成交记录日期为 10月1日 周二；未平仓量报告是周二收盘。这份成交记录符合要求吗？",
			],
			choices: [
				{
					id: "no",
					label: ["No: it's Tuesday's session", "不符合：它是周二时段"],
				},
				{
					id: "yes",
					label: ["Yes: it matches the OI's date", "符合：与未平仓量日期一致"],
				},
				{ id: "oi", label: ["No: the OI is too old", "不符合：未平仓量太旧"] },
			],
			answer: "no",
			revealAt: 2,
			explain: [
				"Each field has its own requirement. Earlier dated open interest was allowed, so the OI fits; the flow had to be Wednesday's, and Tuesday's isn't.",
				"每个字段都有自己的要求。允许使用更早、带日期的未平仓量，所以它符合；成交流必须是周三的，周二的不符合。",
			],
		},
		beats: [
			{
				id: "need",
				label: ["The need", "要求"],
				caption: [
					"The comparison needs Wednesday's flow and an earlier dated open-interest report.",
					"这项比较需要周三的成交流，以及更早、带日期的未平仓量报告。",
				],
				state: { stage: 0, flow: "tue" },
			},
			{
				id: "oi",
				label: ["The OI", "未平仓量"],
				caption: [
					"Tuesday's close is an earlier dated report: that field fits.",
					"周二收盘是更早、带日期的报告：这个字段符合。",
				],
				state: { stage: 1, flow: "tue" },
			},
			{
				id: "flow",
				label: ["The flow", "成交流"],
				caption: [
					"The flow is Tuesday's, not Wednesday's: that field fails, and the comparison waits for Wednesday's tape.",
					"成交流是周二的而不是周三的：这个字段不符合，比较要等周三的成交记录。",
				],
				state: { stage: 2, flow: "tue" },
			},
		],
		explore: {
			prompt: ["Swap the flow record.", "更换成交记录。"],
			start: () => ({ stage: 2, flow: "tue" }),
			task: {
				kind: "reach",
				prompt: [
					"Pick the flow record that lets the comparison go ahead.",
					"选出能让比较进行的成交记录。",
				],
				reached: (e) => e.flow === "wed",
				done: [
					"With Wednesday's flow and Tuesday's dated open interest, each field meets its own requirement, even though they come from different days.",
					"有了周三的成交流和周二带日期的未平仓量，每个字段都符合各自的要求，尽管它们来自不同的日子。",
				],
			},
		},
		View: ClockView,
	}),
] as const;

export function CheckpointFlowWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="checkpoint-flow"
			label={[
				"Checkpoint for flow, positions and data quality",
				"“成交流、持仓与数据质量”检查点",
			]}
			scenes={scenes}
			review
		/>
	);
}
