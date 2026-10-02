import { type Copy, count, pick, usd } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import { BarChart } from "../walkthrough/instruments/bar-chart";
import type { TapeRow } from "../walkthrough/instruments/trade-tape";
import { Stage } from "../walkthrough/stage";
import { defineScene, type Phase } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";
import { CHECKPOINT_DAY, type SheetLine, SheetStage } from "./checkpoint-kit";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

/** The checkpoint packet: three ALFA Oct 18 call rows, prices in cents. */
const TRADES = [
	{ key: "a", row: "R1", strike: 105, size: 40, price: 260 },
	{ key: "b", row: "R1", strike: 105, size: 25, price: 265 },
	{ key: "c", row: "R2", strike: 110, size: 30, price: 85 },
] as const;
const premiumOf = (trade: (typeof TRADES)[number]) =>
	trade.size * trade.price * 100;
const SUBTOTAL = TRADES.reduce((sum, trade) => sum + premiumOf(trade), 0);
const R1_CONTRACTS = TRADES.filter((trade) => trade.row === "R1").reduce(
	(sum, trade) => sum + trade.size,
	0,
);
const R2_CONTRACTS = 30;
const CONTRACTS = R1_CONTRACTS + R2_CONTRACTS;

// ——— Scene 1: the packet's subtotal ———

type PacketState = { stage: 0 | 1 | 2; r3: "missing" | "zero" };

function PacketView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: PacketState;
	explore: PacketState | null;
	setExplore: (next: PacketState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const rows: TapeRow[] = [
		...TRADES.map((trade) => ({
			key: trade.key,
			cells: [
				`${trade.row} · ${trade.strike}`,
				count(trade.size),
				usd(trade.price),
				shown.stage >= 1 ? usd(premiumOf(trade), 0) : "",
			],
		})),
		{
			key: "d",
			cells: [
				"R3 · 115",
				"—",
				"—",
				shown.r3 === "zero" ? "$0" : t(["no data", "无数据"]),
			],
			muted: true,
		},
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: t([
				`observed subtotal: ${usd(SUBTOTAL, 0)}, R1 and R2`,
				`已观测小计：${usd(SUBTOTAL, 0)}，R1 和 R2`,
			]),
			tone: "strong",
		});
	if (shown.stage >= 2)
		lines.push({
			text:
				shown.r3 === "zero"
					? t([
							"R3 as $0 claims an exact total: unsupported",
							"把 R3 当作 $0 就成了确切总额：没有依据",
						])
					: t([
							`chain total: at least ${usd(SUBTOTAL, 0)}; R3 unknown`,
							`全链合计：至少 ${usd(SUBTOTAL, 0)}；R3 未知`,
						]),
			tone: shown.r3 === "zero" ? "loss" : undefined,
		});
	return (
		<SceneFrame
			stage={
				<SheetStage
					label={t([
						"A research packet's trades for three ALFA Oct 18 calls, one of them missing, and the premium they add up to",
						"一个研究包中三张 ALFA 10月18日 看涨的成交（其中一张缺失），以及它们合计的权利金",
					])}
					lineSlots={2}
					title={t([
						`Packet · ALFA Oct 18 calls · ${CHECKPOINT_DAY[0]}`,
						`研究包 · ALFA 10月18日 看涨 · ${CHECKPOINT_DAY[1]}`,
					])}
					columns={[
						{ label: t(["Row · strike", "行 · 行权价"]), share: 0.3 },
						{ label: t(["Qty", "张数"]), share: 0.16, align: "end" },
						{ label: t(["Price", "价格"]), share: 0.22, align: "end" },
						{ label: t(["Premium", "权利金"]), share: 0.32, align: "end" },
					]}
					rows={rows}
					maxRows={4}
					lines={lines}
				/>
			}
			result={[
				{
					id: "subtotal",
					label: t(["Observed premium", "已观测权利金"]),
					value: shown.stage >= 1 ? usd(SUBTOTAL, 0) : "?",
					note: t(["2 of 3 rows covered", "3 行中覆盖 2 行"]),
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Treat R3 as", "把 R3 视为"])}
						value={explore.r3}
						options={[
							["missing", t(["Missing", "缺失"])],
							["zero", t(["Zero", "零"])],
						]}
						onChange={(r3) => setExplore({ ...explore, r3 })}
					/>
				) : null
			}
		/>
	);
}

// ——— Scene 2: where the axis starts ———

type AxisState = { stage: 0 | 1 | 2; start: number };

const drawnRatio = (start: number) =>
	(R1_CONTRACTS - start) / (R2_CONTRACTS - start);

function AxisView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: AxisState;
	explore: AxisState | null;
	setExplore: (next: AxisState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Contracts traded in the 105 and 110 calls, drawn on an axis that starts where you set it",
						"105 和 110 看涨的成交张数，画在从你设定的位置开始的坐标轴上",
					])}
					height={() => 230}
				>
					{(width) => (
						<BarChart
							width={width}
							height={230}
							bars={[
								{
									id: "r1",
									label: t(["105 call", "105 看涨"]),
									value: R1_CONTRACTS,
								},
								{
									id: "r2",
									label: t(["110 call", "110 看涨"]),
									value: R2_CONTRACTS,
								},
								{ id: "r3", label: t(["115 call", "115 看涨"]), value: null },
							]}
							min={shown.start}
							max={70}
							format={(value) => count(value)}
							title={t([
								`Contracts traded · axis starts at ${shown.start}`,
								`成交张数 · 坐标轴从 ${shown.start} 开始`,
							])}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "true",
					label: t(["True ratio", "真实比例"]),
					value: `${(R1_CONTRACTS / R2_CONTRACTS).toFixed(2)}×`,
					note: t([
						`${R1_CONTRACTS} ÷ ${R2_CONTRACTS}`,
						`${R1_CONTRACTS} ÷ ${R2_CONTRACTS}`,
					]),
				},
				{
					id: "drawn",
					label: t(["As drawn", "画出来的比例"]),
					value: `${drawnRatio(shown.start).toFixed(2)}×`,
					note: t([
						`(${R1_CONTRACTS} − ${shown.start}) ÷ (${R2_CONTRACTS} − ${shown.start})`,
						`(${R1_CONTRACTS} − ${shown.start}) ÷ (${R2_CONTRACTS} − ${shown.start})`,
					]),
					tone: shown.start === 0 ? "gain" : "loss",
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<RangeControl
						label={t(["Axis starts at", "坐标轴起点"])}
						value={explore.start}
						display={String(explore.start)}
						min={0}
						max={25}
						step={5}
						onChange={(start) => setExplore({ ...explore, start })}
					/>
				) : null
			}
		/>
	);
}

// ——— Scene 3: audit a recap ———

type AuditState = { stage: 0 | 1 | 2 };

function AuditView({
	locale,
	state,
}: {
	locale: Locale;
	phase: Phase;
	state: AuditState;
	explore: AuditState | null;
	setExplore: (next: AuditState) => void;
}) {
	const t = tr(locale);
	const shown = state;
	const claims: { key: string; text: Copy; defect: Copy; repair: Copy }[] = [
		{
			key: "a",
			text: [`Premium ${usd(SUBTOTAL / 100)}`, `权利金 ${usd(SUBTOTAL / 100)}`],
			defect: ["missing × 100", "漏了 × 100"],
			repair: [`${usd(SUBTOTAL, 0)}, R1–R2`, `${usd(SUBTOTAL, 0)}，R1–R2`],
		},
		{
			key: "b",
			text: [`${CONTRACTS} new bullish positions`, `${CONTRACTS} 个新看涨仓位`],
			defect: ["volume ≠ positions", "成交 ≠ 持仓"],
			repair: [`${CONTRACTS} contracts traded`, `成交 ${CONTRACTS} 张`],
		},
		{
			key: "c",
			text: ["115 call traded 0", "115 看涨成交 0 张"],
			defect: ["missing as zero", "缺失当作零"],
			repair: ["115 call: no data", "115 看涨：无数据"],
		},
	];
	const rows: TapeRow[] = claims.map((claim) => ({
		key: claim.key,
		cells: [
			t(shown.stage >= 2 ? claim.repair : claim.text),
			shown.stage >= 1
				? t(shown.stage >= 2 ? ["repaired", "已修复"] : claim.defect)
				: "",
		],
	}));
	return (
		<SceneFrame
			stage={
				<SheetStage
					label={t([
						"A colleague's recap of the packet, claim by claim, with each defect and its repair",
						"同事根据研究包写的复盘，逐条列出缺陷及其修复",
					])}
					lineSlots={1}
					stackOnPhone
					title={t(["A colleague's recap", "同事的复盘"])}
					columns={[
						{ label: t(["Claim", "结论"]), share: 0.58 },
						{ label: t(["Audit", "审核"]), share: 0.42, align: "end" },
					]}
					rows={rows}
					maxRows={3}
					lines={
						shown.stage >= 2
							? [
									{
										text: t([
											"keep the counts and prices; repair the rest",
											"保留张数和价格；修复其余部分",
										]),
									},
								]
							: []
					}
				/>
			}
			result={[
				{
					id: "claims",
					label: t(["Claims that hold as written", "原样成立的结论"]),
					value: shown.stage >= 1 ? "0 / 3" : "?",
					tone: "loss",
				},
			]}
		/>
	);
}

// ——— Checkpoint ———

const scenes = [
	defineScene<PacketState, PacketState>({
		id: "packet",
		label: ["The subtotal", "小计"],
		title: [
			"Add what was observed; keep the gap visible",
			"加总已观测的部分，让缺口保持可见",
		],
		revisit: "cookbook-research-packet",
		predict: {
			prompt: [
				`A packet's rows: R1, the 105 call, 40 at $2.60 and 25 at $2.65; R2, the 110 call, 30 at $0.85; R3, the 115 call, no data at the cutoff. What is the observed premium subtotal?`,
				"研究包各行：R1，105 看涨，40 张 $2.60、25 张 $2.65；R2，110 看涨，30 张 $0.85；R3，115 看涨，截止时无数据。已观测权利金小计是多少？",
			],
			choices: [
				{ id: "right", label: [usd(SUBTOTAL, 0), usd(SUBTOTAL, 0)] },
				{ id: "short", label: [usd(SUBTOTAL / 100), usd(SUBTOTAL / 100)] },
				{
					id: "r1",
					label: [
						usd(premiumOf(TRADES[0]) + premiumOf(TRADES[1]), 0),
						usd(premiumOf(TRADES[0]) + premiumOf(TRADES[1]), 0),
					],
				},
			],
			answer: "right",
			entry: { answer: SUBTOTAL / 100, tolerance: 1, prefix: "$" },
			revealAt: 1,
			explain: [
				`40 × $2.60 × 100 + 25 × $2.65 × 100 + 30 × $0.85 × 100 = ${usd(SUBTOTAL, 0)}. R3 stays missing, so this is an observed subtotal, not the chain's total.`,
				`40 × $2.60 × 100 + 25 × $2.65 × 100 + 30 × $0.85 × 100 = ${usd(SUBTOTAL, 0)}。R3 仍然缺失，所以这是已观测小计，不是全链合计。`,
			],
		},
		beats: [
			{
				id: "rows",
				label: ["The rows", "各行"],
				caption: [
					"Three trades across R1 and R2, and R3 with no data at the cutoff.",
					"R1 和 R2 的三笔成交，以及截止时没有数据的 R3。",
				],
				state: { stage: 0, r3: "missing" },
			},
			{
				id: "sum",
				label: ["Add", "加总"],
				caption: [
					`Each trade is price × contracts × 100. Together: ${usd(SUBTOTAL, 0)}.`,
					`每笔成交是价格 × 张数 × 100。合计：${usd(SUBTOTAL, 0)}。`,
				],
				state: { stage: 1, r3: "missing" },
			},
			{
				id: "gap",
				label: ["The gap", "缺口"],
				caption: [
					`R3 is missing, not zero: the chain's total is at least ${usd(SUBTOTAL, 0)}.`,
					`R3 是缺失而不是零：全链合计至少为 ${usd(SUBTOTAL, 0)}。`,
				],
				state: { stage: 2, r3: "missing" },
			},
		],
		explore: {
			prompt: ["Choose how to treat R3.", "选择如何处理 R3。"],
			start: () => ({ stage: 2, r3: "zero" }),
			task: {
				kind: "answer",
				prompt: [
					"What can the packet say about the chain's total premium?",
					"关于全链的权利金合计，研究包能说什么？",
				],
				choices: [
					{
						id: "least",
						label: [`At least ${usd(SUBTOTAL, 0)}`, `至少 ${usd(SUBTOTAL, 0)}`],
					},
					{
						id: "exact",
						label: [`Exactly ${usd(SUBTOTAL, 0)}`, `正好 ${usd(SUBTOTAL, 0)}`],
					},
					{ id: "nothing", label: ["Nothing at all", "什么都不能说"] },
				],
				answer: "least",
				done: [
					"Premium can't be negative, so R1 and R2 set a floor. Calling it exact would treat R3 as zero, which the packet doesn't know.",
					"权利金不可能为负，所以 R1 和 R2 构成下限。说它是确切数字，就等于把 R3 当作零，而研究包并不知道这一点。",
				],
			},
		},
		View: PacketView,
	}),
	defineScene<AxisState, AxisState>({
		id: "axis",
		label: ["The chart", "图表"],
		title: ["A raised axis turns 2× into 8×", "提高的坐标轴把 2 倍画成 8 倍"],
		revisit: "market-recap",
		predict: {
			prompt: [
				`The 105 call traded ${R1_CONTRACTS} contracts and the 110 call ${R2_CONTRACTS}. On a bar chart whose axis starts at 25, how many times taller is the 105 call's bar?`,
				`105 看涨成交 ${R1_CONTRACTS} 张，110 看涨成交 ${R2_CONTRACTS} 张。在坐标轴从 25 开始的柱状图上，105 看涨的柱子有多少倍高？`,
			],
			choices: [
				{ id: "drawn", label: ["8×", "8×"] },
				{
					id: "true",
					label: [
						`${(R1_CONTRACTS / R2_CONTRACTS).toFixed(1)}×`,
						`${(R1_CONTRACTS / R2_CONTRACTS).toFixed(1)}×`,
					],
				},
				{ id: "diff", label: ["35×", "35×"] },
			],
			answer: "drawn",
			entry: { answer: drawnRatio(25), tolerance: 0.05, unit: ["×", "×"] },
			revealAt: 2,
			explain: [
				`Each bar starts at 25: (${R1_CONTRACTS} − 25) ÷ (${R2_CONTRACTS} − 25) = 40 ÷ 5 = 8×, though it traded only ${(R1_CONTRACTS / R2_CONTRACTS).toFixed(1)} times as much.`,
				`每根柱子都从 25 开始：(${R1_CONTRACTS} − 25) ÷ (${R2_CONTRACTS} − 25) = 40 ÷ 5 = 8×，尽管它的成交量只有后者的 ${(R1_CONTRACTS / R2_CONTRACTS).toFixed(1)} 倍。`,
			],
		},
		beats: [
			{
				id: "zero",
				label: ["From zero", "从零开始"],
				caption: [
					`From zero the bars are honest: ${R1_CONTRACTS} against ${R2_CONTRACTS}, about ${(R1_CONTRACTS / R2_CONTRACTS).toFixed(1)} times as tall. The 115 call shows as missing, not as zero.`,
					`从零开始，柱子是诚实的：${R1_CONTRACTS} 对 ${R2_CONTRACTS}，约 ${(R1_CONTRACTS / R2_CONTRACTS).toFixed(1)} 倍高。115 看涨显示为缺失，而不是零。`,
				],
				state: { stage: 0, start: 0 },
			},
			{
				id: "raised",
				label: ["Raised", "提高起点"],
				caption: [
					"Start the axis at 25 and both bars lose 25 from their height.",
					"把坐标轴起点设为 25，两根柱子的高度都减去 25。",
				],
				state: { stage: 1, start: 25 },
			},
			{
				id: "ratio",
				label: ["The ratio", "比例"],
				caption: [
					"What's left is 40 against 5: the 105 call looks 8 times as busy. The printed numbers are still true; the picture isn't.",
					"剩下的是 40 对 5：105 看涨看起来活跃 8 倍。印出的数字仍然正确，图形却不对了。",
				],
				state: { stage: 2, start: 25 },
			},
		],
		explore: {
			prompt: ["Move where the axis starts.", "移动坐标轴的起点。"],
			start: () => ({ stage: 2, start: 25 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the axis start that draws the bars at their true ratio.",
					"找出能按真实比例画出柱子的坐标轴起点。",
				],
				reached: (e) => e.start === 0,
				done: [
					"Only a zero baseline keeps bar heights proportional to the values. Any raised start exaggerates the gap, more the closer it gets to the smaller bar.",
					"只有从零开始的基线，才能让柱子高度与数值成比例。任何提高的起点都会夸大差距，越接近较小的柱子，夸大得越厉害。",
				],
			},
		},
		View: AxisView,
	}),
	defineScene<AuditState, AuditState>({
		id: "audit",
		label: ["Audit the recap", "审核复盘"],
		title: [
			"Repair each claim; keep what holds",
			"修复每条结论，保留成立的部分",
		],
		revisit: "audit-market-recap",
		predict: {
			prompt: [
				`A colleague's recap of the packet says: "Premium ${usd(SUBTOTAL / 100)}. ${CONTRACTS} new bullish positions. The 115 call traded 0." What should the last claim say?`,
				`同事根据研究包写的复盘说：“权利金 ${usd(SUBTOTAL / 100)}。${CONTRACTS} 个新看涨仓位。115 看涨成交 0 张。”最后一条应该怎么写？`,
			],
			choices: [
				{
					id: "nodata",
					label: [
						"The 115 call: no data at the cutoff",
						"115 看涨：截止时无数据",
					],
				},
				{ id: "zero", label: ["Leave it: 0 contracts", "保持原样：0 张"] },
				{
					id: "drop",
					label: ["Delete the 115 call entirely", "完全删掉 115 看涨"],
				},
			],
			answer: "nodata",
			revealAt: 1,
			explain: [
				"R3 has no data at the cutoff, which isn't the same as zero trades. Say it's missing, so nobody reads a measured zero into it.",
				"R3 在截止时没有数据，这和零成交不是一回事。要写明它缺失，免得有人把它读成观测到的零。",
			],
		},
		beats: [
			{
				id: "claims",
				label: ["The claims", "结论"],
				caption: [
					"Three claims, each to check against the packet.",
					"三条结论，每条都要对照研究包核查。",
				],
				state: { stage: 0 },
			},
			{
				id: "defects",
				label: ["Defects", "缺陷"],
				caption: [
					"The premium leaves out × 100, the positions confuse volume with new positions, and the 115 call treats missing as zero.",
					"权利金漏了 × 100，持仓把成交量当成新开仓，115 看涨把缺失当成零。",
				],
				state: { stage: 1 },
			},
			{
				id: "repairs",
				label: ["Repairs", "修复"],
				caption: [
					`Repaired: ${usd(SUBTOTAL, 0)} for R1–R2, ${CONTRACTS} contracts traded, and the 115 call with no data. The counts and prices were right; keep them.`,
					`修复后：R1–R2 共 ${usd(SUBTOTAL, 0)}，成交 ${CONTRACTS} 张，115 看涨无数据。张数和价格本来就是对的，予以保留。`,
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: [
				"Step back through the audit to compare each claim with its repair.",
				"回看审核过程，比较每条结论和它的修复。",
			],
			start: (last) => last,
			task: {
				kind: "answer",
				prompt: [
					`What should "${CONTRACTS} new bullish positions" become?`,
					`“${CONTRACTS} 个新看涨仓位”应该改成什么？`,
				],
				choices: [
					{
						id: "traded",
						label: [`${CONTRACTS} contracts traded`, `成交 ${CONTRACTS} 张`],
					},
					{
						id: "bearish",
						label: [
							`${CONTRACTS} new bearish positions`,
							`${CONTRACTS} 个新看跌仓位`,
						],
					},
					{ id: "keep", label: ["Keep it as written", "保持原样"] },
				],
				answer: "traded",
				done: [
					"Trades don't say whether anyone opened a position, or why. The packet supports the count of contracts traded, nothing more.",
					"成交不能说明是否有人开仓，也不能说明原因。研究包支持的只是成交的张数，仅此而已。",
				],
			},
		},
		View: AuditView,
	}),
] as const;

export function CheckpointProductionWalkthrough({
	locale,
}: {
	locale: Locale;
}) {
	return (
		<Walkthrough
			locale={locale}
			id="checkpoint-production"
			label={[
				"Checkpoint for producing and auditing research",
				"“撰写与审核研究”检查点",
			]}
			scenes={scenes}
			review
		/>
	);
}
