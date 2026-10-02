import { type Copy, count, pick, usd } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import type { TapeRow } from "../walkthrough/instruments/trade-tape";
import { Stage } from "../walkthrough/stage";
import { defineScene, type Phase } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";
import { CaseSheet, type SheetLine, sheetHeight } from "./checkpoint-kit";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

// ——— Scene 1: which session a report opens on ———

type NowId = "wed-1400" | "wed-1630" | "thu-0800" | "sat-1200";
type SessionState = { stage: 0 | 1 | 2; now: NowId };

const moments: Record<
	NowId,
	{ label: Copy; short: Copy; latest: Copy; why: Copy }
> = {
	"wed-1400": {
		label: ["Wed Oct 2, 14:00", "10月2日 周三 14:00"],
		short: ["Wed 14:00", "周三 14:00"],
		latest: ["Tue Oct 1", "10月1日 周二"],
		why: ["Wednesday's session is still trading", "周三的交易时段尚未结束"],
	},
	"wed-1630": {
		label: ["Wed Oct 2, 16:30", "10月2日 周三 16:30"],
		short: ["Wed 16:30", "周三 16:30"],
		latest: ["Wed Oct 2", "10月2日 周三"],
		why: ["Wednesday closed at 16:00", "周三已于 16:00 收盘"],
	},
	"thu-0800": {
		label: ["Thu Oct 3, 8:00", "10月3日 周四 8:00"],
		short: ["Thu 8:00", "周四 8:00"],
		latest: ["Wed Oct 2", "10月2日 周三"],
		why: ["Thursday opens at 9:30", "周四 9:30 才开盘"],
	},
	"sat-1200": {
		label: ["Sat Oct 5, 12:00", "10月5日 周六 12:00"],
		short: ["Sat 12:00", "周六 12:00"],
		latest: ["Fri Oct 4", "10月4日 周五"],
		why: ["no session on the weekend", "周末没有交易时段"],
	},
};

function SessionView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SessionState;
	explore: SessionState | null;
	setExplore: (next: SessionState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const moment = moments[shown.now];
	const rows: TapeRow[] = [
		{
			key: "a",
			cells: [t(["You open the report", "你打开报告"]), t(moment.short)],
		},
		{ key: "b", cells: [t(["Trading hours", "交易时间"]), "9:30–16:00"] },
		{
			key: "c",
			cells: [
				t(["Session it shows", "展示的交易时段"]),
				shown.stage >= 1 ? t(moment.latest) : "?",
			],
		},
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1) lines.push({ text: t(moment.why) });
	if (shown.stage >= 2)
		lines.push({
			text: t([
				`header: Session · ${moment.latest[0]}`,
				`页眉：交易时段 · ${moment.latest[1]}`,
			]),
			tone: "strong",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The time you open a recipe report and the latest completed session it opens on",
						"打开 Recipe 报告的时间，以及它打开的最近一个完整交易时段",
					])}
					height={() => sheetHeight(3, 2)}
				>
					{(width) => (
						<CaseSheet
							width={width}
							title={t([
								"Daily Market Recap · opening it",
								"Daily Market Recap · 打开时",
							])}
							columns={[
								{ label: t(["Item", "项目"]), share: 0.55 },
								{ label: t(["Value", "数值"]), share: 0.45, align: "end" },
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
					id: "session",
					label: t(["Session the report shows", "报告展示的交易时段"]),
					value: shown.stage >= 1 ? t(moment.latest) : "…",
					note: t(["the latest completed session", "最近一个完整的交易时段"]),
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["You open it at", "打开时间"])}
						value={explore.now}
						options={(Object.keys(moments) as NowId[]).map(
							(id) => [id, t(moments[id].short)] as const,
						)}
						onChange={(now) => setExplore({ ...explore, now })}
					/>
				) : null
			}
		/>
	);
}

// ——— Scene 2: which contracts pass the screen ———

type Floor = { minVolume: 500 | 100 | 0; minOi: 200 | 50 | 0 };
type ScreenState = { stage: 0 | 1 | 2 } & Floor;

const SCREEN = [
	{
		id: "crux",
		symbol: "CRUX",
		label: ["CRUX Oct 11 60 put", "CRUX 10月11日 60 看跌"] as Copy,
		volume: 1_900,
		oi: 800,
		dte: 9,
	},
	{
		id: "alfa",
		symbol: "ALFA",
		label: ["ALFA Oct 18 110 call", "ALFA 10月18日 110 看涨"] as Copy,
		volume: 3_200,
		oi: 2_100,
		dte: 16,
	},
	{
		id: "dune",
		symbol: "DUNE",
		label: ["DUNE Oct 4 30 call", "DUNE 10月4日 30 看涨"] as Copy,
		volume: 640,
		oi: 520,
		dte: 2,
	},
	{
		id: "brdx",
		symbol: "BRDX",
		label: ["BRDX Oct 18 28 call", "BRDX 10月18日 28 看涨"] as Copy,
		volume: 900,
		oi: 1_500,
		dte: 16,
	},
	{
		id: "embr",
		symbol: "EMBR",
		label: ["EMBR Oct 11 45 call", "EMBR 10月11日 45 看涨"] as Copy,
		volume: 60,
		oi: 12,
		dte: 9,
	},
	{
		id: "dec",
		symbol: "ALFA Dec",
		label: ["ALFA Dec 20 110 call", "ALFA 12月20日 110 看涨"] as Copy,
		volume: 700,
		oi: 300,
		dte: 79,
	},
];
type ScreenRow = (typeof SCREEN)[number];
const ratio = (row: ScreenRow) => row.volume / row.oi;
/** Why a row fails the screen, or null when it passes. */
const miss = (row: ScreenRow, floor: Floor): Copy | null =>
	row.dte > 60
		? ["DTE", "到期天数"]
		: ratio(row) < 1
			? ["ratio", "比率"]
			: row.volume < floor.minVolume || row.oi < floor.minOi
				? ["floors", "门槛"]
				: null;
const passing = (floor: Floor) =>
	SCREEN.filter((row) => miss(row, floor) === null).sort(
		(a, b) => ratio(b) - ratio(a),
	);
const DEFAULTS: Floor = { minVolume: 500, minOi: 200 };
const PASS = passing(DEFAULTS).length;

function ScreenView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ScreenState;
	explore: ScreenState | null;
	setExplore: (next: ScreenState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const passed = passing(shown);
	const top = passed[0];
	const rows: TapeRow[] = SCREEN.map((row) => ({
		key: row.id,
		cells: [t(row.label), count(row.volume), count(row.oi), String(row.dte)],
		muted: shown.stage >= 1 && miss(row, shown) !== null,
	}));
	const out = SCREEN.flatMap((row) => {
		const reason = miss(row, shown);
		return reason ? [`${row.symbol} ${t(reason)}`] : [];
	});
	const lines: SheetLine[] = [
		{
			text: t([
				"Min vol/OI 1 · Max DTE 60",
				"最低成交量/OI 1 · 最长到期 60 天",
			]),
		},
		{
			text: t([
				`Min volume ${count(shown.minVolume)} · Min OI ${count(shown.minOi)}`,
				`最低成交量 ${count(shown.minVolume)} · 最低未平仓量 ${count(shown.minOi)}`,
			]),
		},
	];
	if (shown.stage >= 1 && top)
		lines.push({
			text: t([
				`${passed.length} pass; top: ${top.symbol} ${ratio(top).toFixed(1)}×`,
				`${passed.length} 份通过；第一：${top.symbol} ${ratio(top).toFixed(1)}×`,
			]),
			tone: "strong",
		});
	if (shown.stage >= 2)
		lines.push({
			text: t([`out: ${out.join(", ")}`, `未通过：${out.join("、")}`]),
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Six contracts from Wednesday's session checked against the screen's ratio, volume, open-interest and expiry rules",
						"用筛选的比率、成交量、未平仓量和到期规则检查周三交易时段的六份合约",
					])}
					height={() => sheetHeight(6, 4)}
				>
					{(width) => (
						<CaseSheet
							width={width}
							title={t([
								"Unusual Options Activity · Wed Oct 2",
								"异常期权活动 · 10月2日 周三",
							])}
							columns={[
								{ label: t(["Contract", "合约"]), share: 0.47 },
								{ label: t(["Vol", "成交量"]), share: 0.19, align: "end" },
								{ label: "OI", share: 0.19, align: "end" },
								{ label: "DTE", share: 0.15, align: "end" },
							]}
							rows={rows}
							maxRows={6}
							lines={lines}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "pass",
					label: t(["Contracts that pass", "通过的合约"]),
					value: shown.stage >= 1 ? String(passed.length) : "…",
					evidence: "calculated",
				},
				{
					id: "top",
					label: t(["Top by volume/OI", "成交量/OI 第一"]),
					value:
						shown.stage >= 1 && top
							? `${top.symbol} ${ratio(top).toFixed(1)}×`
							: "…",
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<>
						<ChoiceField
							label={t(["Min volume", "最低成交量"])}
							value={String(explore.minVolume) as "500" | "100" | "0"}
							options={[
								["500", "500"],
								["100", "100"],
								["0", "0"],
							]}
							onChange={(value) =>
								setExplore({
									...explore,
									minVolume: Number(value) as Floor["minVolume"],
								})
							}
						/>
						<ChoiceField
							label={t(["Min OI", "最低未平仓量"])}
							value={String(explore.minOi) as "200" | "50" | "0"}
							options={[
								["200", "200"],
								["50", "50"],
								["0", "0"],
							]}
							onChange={(value) =>
								setExplore({
									...explore,
									minOi: Number(value) as Floor["minOi"],
								})
							}
						/>
					</>
				) : null
			}
		/>
	);
}

// ——— Scene 3: check the AI, and count its cost ———

type AiState = { stage: 0 | 1 | 2; plain: number; charts: number };

const PUT = SCREEN[0];
const credits = (state: Pick<AiState, "plain" | "charts">) =>
	state.plain + 2 * state.charts;

function AiView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: AiState;
	explore: AiState | null;
	setExplore: (next: AiState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const rows: TapeRow[] = [
		{
			key: "a",
			cells: [
				t([
					`Put traded ${ratio(PUT).toFixed(1)}× its OI`,
					`看跌成交为 OI 的 ${ratio(PUT).toFixed(1)} 倍`,
				]),
				shown.stage >= 1 ? `${count(PUT.volume)} ÷ ${PUT.oi} ✓` : "?",
			],
		},
		{
			key: "b",
			cells: [
				t(["Funds hedging earnings", "基金在为财报对冲"]),
				shown.stage >= 2 ? t(["not in the data", "数据里没有"]) : "?",
			],
			muted: shown.stage >= 2,
		},
		{
			key: "c",
			cells: [
				t(["So CRUX will drop", "所以 CRUX 会下跌"]),
				shown.stage >= 2 ? t(["a forecast", "预测"]) : "?",
			],
			muted: shown.stage >= 2,
		},
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: t([
				`${shown.plain} plain × 1 + ${shown.charts} with a chart × 2`,
				`${shown.plain} 条普通 × 1 + ${shown.charts} 条带图表 × 2`,
			]),
		});
	if (shown.stage >= 1)
		lines.push({
			text: t([`= ${credits(shown)} credits`, `= ${credits(shown)} 积分`]),
			tone: "strong",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A TradingFlow AI reply about CRUX split into statements, each checked against the screen, and the credits the conversation used",
						"一条关于 CRUX 的 TradingFlow AI 回复被拆成几句陈述，逐一对照筛选核对，以及这段对话消耗的积分",
					])}
					height={() => sheetHeight(3, 2)}
				>
					{(width) => (
						<CaseSheet
							width={width}
							title={t([
								"TradingFlow AI reply · Wed Oct 2",
								"TradingFlow AI 回复 · 10月2日 周三",
							])}
							columns={[
								{ label: t(["Statement", "陈述"]), share: 0.58 },
								{ label: t(["Check", "核对"]), share: 0.42, align: "end" },
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
					id: "supported",
					label: t(["Supported by the screen", "筛选支持的"]),
					value: shown.stage >= 2 ? t(["1 of 3", "3 句中 1 句"]) : "…",
					evidence: "calculated",
				},
				{
					id: "credits",
					label: t(["Credits used", "消耗积分"]),
					value: shown.stage >= 1 ? String(credits(shown)) : "…",
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<>
						<RangeControl
							label={t(["Plain replies", "普通回复"])}
							value={explore.plain}
							display={String(explore.plain)}
							min={0}
							max={4}
							onChange={(plain) => setExplore({ ...explore, plain })}
						/>
						<RangeControl
							label={t(["Replies with a chart", "带图表的回复"])}
							value={explore.charts}
							display={String(explore.charts)}
							min={0}
							max={4}
							onChange={(charts) => setExplore({ ...explore, charts })}
						/>
					</>
				) : null
			}
		/>
	);
}

// ——— Scene 4: a per-trade column with a floor ———

type FormulaState = { stage: 0 | 1 | 2; floor: number };

const NAMES = [
	{ symbol: "ALFA", premium: 1_240_000, trades: 310 },
	{ symbol: "CRUX", premium: 860_000, trades: 172 },
	{ symbol: "GLYN", premium: 96_000, trades: 4 },
	{ symbol: "DUNE", premium: 450_000, trades: 50 },
	{ symbol: "BRDX", premium: 210_000, trades: 35 },
];
const FLOOR = 20;
const perTrade = (name: (typeof NAMES)[number], floor: number) =>
	name.trades >= floor ? name.premium / name.trades : null;
const leader = (floor: number) =>
	NAMES.reduce<(typeof NAMES)[number] | null>((best, name) => {
		const value = perTrade(name, floor);
		if (value === null) return best;
		return best === null || value > (perTrade(best, floor) ?? 0) ? name : best;
	}, null);
const LEADER = leader(FLOOR);
const LEAD_VALUE = LEADER ? (perTrade(LEADER, FLOOR) ?? 0) : 0;
/** The lowest floor, in steps of 5, at which CRUX leads. */
const CRUX_FLOOR = Array.from({ length: 41 }, (_, i) => i * 5).find(
	(floor) => leader(floor)?.symbol === "CRUX",
);
/** "$1.24M", "$860k". */
const premium = (dollars: number) =>
	dollars >= 1_000_000
		? `$${(dollars / 1_000_000).toFixed(2)}M`
		: `$${Math.round(dollars / 1_000)}k`;

function FormulaView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: FormulaState;
	explore: FormulaState | null;
	setExplore: (next: FormulaState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const lead = leader(shown.floor);
	const rows: TapeRow[] = NAMES.map((name) => {
		const value = perTrade(name, shown.floor);
		return {
			key: name.symbol,
			cells: [
				name.symbol,
				premium(name.premium),
				count(name.trades),
				shown.stage >= 1 ? (value === null ? "N/A" : usd(value * 100, 0)) : "?",
			],
			muted: shown.stage >= 1 && value === null,
		};
	});
	const lines: SheetLine[] = [
		{
			text: t([
				`per trade if ${shown.floor}+ trades, else N/A`,
				`交易 ${shown.floor} 笔及以上算每笔，否则 N/A`,
			]),
		},
	];
	if (shown.stage >= 2 && lead)
		lines.push({
			text: t([
				`leads: ${lead.symbol}, ${usd((perTrade(lead, shown.floor) ?? 0) * 100, 0)} a trade`,
				`第一：${lead.symbol}，每笔 ${usd((perTrade(lead, shown.floor) ?? 0) * 100, 0)}`,
			]),
			tone: "strong",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Five names' premium and trade counts on Wednesday, with a per-trade column that leaves names under a trade floor blank",
						"五个标的周三的权利金和交易笔数，以及一个对低于笔数门槛的标的留空的每笔列",
					])}
					height={() => sheetHeight(5, 2)}
				>
					{(width) => (
						<CaseSheet
							width={width}
							title={t([
								"Rank Symbols · your view · Wed Oct 2",
								"Rank Symbols · 你的视图 · 10月2日 周三",
							])}
							columns={[
								{ label: t(["Name", "标的"]), share: 0.2 },
								{ label: t(["Premium", "权利金"]), share: 0.28, align: "end" },
								{ label: t(["Trades", "笔数"]), share: 0.22, align: "end" },
								{ label: t(["Per trade", "每笔"]), share: 0.3, align: "end" },
							]}
							rows={rows}
							maxRows={5}
							lines={lines}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "lead",
					label: t(["Leads the column", "列中第一"]),
					value: shown.stage >= 2 && lead ? lead.symbol : "…",
					evidence: "calculated",
				},
				{
					id: "floor",
					label: t(["Trade floor", "笔数门槛"]),
					value: String(shown.floor),
				},
			]}
			controls={
				explore ? (
					<RangeControl
						label={t(["Trade floor", "笔数门槛"])}
						value={explore.floor}
						display={String(explore.floor)}
						min={0}
						max={200}
						step={5}
						onChange={(floor) => setExplore({ ...explore, floor })}
					/>
				) : null
			}
		/>
	);
}

// ——— Checkpoint ———

const scenes = [
	defineScene<SessionState, SessionState>({
		id: "session",
		label: ["Session", "交易时段"],
		title: [
			"A report opens on the latest completed session",
			"报告打开的是最近一个完整交易时段",
		],
		revisit: "tradingflow-recipes",
		predict: {
			prompt: [
				"You open Daily Market Recap at 14:00 on Wednesday Oct 2. Which session does it show?",
				"你在 10月2日 周三 14:00 打开 Daily Market Recap。它展示的是哪个交易时段？",
			],
			choices: [
				{ id: "tue", label: ["Tuesday Oct 1", "10月1日 周二"] },
				{
					id: "wed",
					label: ["Wednesday Oct 2, so far", "10月2日 周三，截至目前"],
				},
				{ id: "mon", label: ["Monday Sep 30", "9月30日 周一"] },
			],
			answer: "tue",
			revealAt: 1,
			explain: [
				"A report opens on the latest completed session. At 14:00 Wednesday is still trading, so that's Tuesday Oct 1. The header names the session; check it before you copy a number.",
				"报告打开的是最近一个完整的交易时段。14:00 周三还在交易，所以是 10月1日 周二。页眉写明了交易时段；摘出任何数字之前先核对它。",
			],
		},
		beats: [
			{
				id: "now",
				label: ["Now", "现在"],
				caption: [
					"It's 14:00 on Wednesday, in the middle of Wednesday's session.",
					"现在是周三 14:00，周三的交易时段正在进行。",
				],
				state: { stage: 0, now: "wed-1400" },
			},
			{
				id: "latest",
				label: ["Latest completed", "最近完整时段"],
				caption: [
					"Wednesday hasn't finished, so the latest completed session is Tuesday Oct 1.",
					"周三还没结束，所以最近一个完整的交易时段是 10月1日 周二。",
				],
				state: { stage: 1, now: "wed-1400" },
			},
			{
				id: "header",
				label: ["Header", "页眉"],
				caption: [
					"The report's header names that session. Keep it attached to every number you copy.",
					"报告页眉写明了这个交易时段。摘出的每个数字都要带上它。",
				],
				state: { stage: 2, now: "wed-1400" },
			},
		],
		explore: {
			prompt: ["Change when you open the report.", "改变打开报告的时间。"],
			start: () => ({ stage: 2, now: "wed-1400" }),
			task: {
				kind: "reach",
				prompt: [
					"Find a time at which the report opens on Wednesday's session.",
					"找出报告会打开周三交易时段的时间。",
				],
				reached: (e) => e.now === "wed-1630" || e.now === "thu-0800",
				done: [
					"From Wednesday's 16:00 close until Thursday's session finishes, the latest completed session is Wednesday's. On Saturday it's Friday's: the market calendar decides, not the clock.",
					"从周三 16:00 收盘到周四交易时段结束，最近一个完整的交易时段都是周三。周六则是周五：由交易日历决定，而不是钟表。",
				],
			},
		},
		View: SessionView,
	}),
	defineScene<ScreenState, ScreenState>({
		id: "screen",
		label: ["Screen", "筛选"],
		title: [
			"Every rule must pass, then rank by volume/OI",
			"每条规则都要通过，再按成交量/OI 排名",
		],
		revisit: "recipe-inputs",
		predict: {
			prompt: [
				"Wednesday's Unusual Options Activity screen keeps contracts whose volume is at least their open interest, with volume of 500+, open interest of 200+ and 60 days or less to expiry. Of these six contracts, how many pass?",
				"周三的异常期权活动筛选保留成交量不低于未平仓量、成交量 500 以上、未平仓量 200 以上且距到期 60 天以内的合约。这六份合约中有几份通过？",
			],
			choices: [
				{ id: "right", label: [String(PASS), String(PASS)] },
				{ id: "dte", label: [String(PASS + 1), String(PASS + 1)] },
				{ id: "ratio", label: [String(PASS + 2), String(PASS + 2)] },
			],
			answer: "right",
			entry: { answer: PASS, unit: [" contracts", " 份"] },
			revealAt: 1,
			explain: [
				`${PASS}: CRUX, ALFA Oct 18 and DUNE. BRDX traded less than its open interest, EMBR is under both floors, and ALFA's Dec 20 call is 79 days out, past the 60-day limit.`,
				`${PASS} 份：CRUX、ALFA 10月18日 和 DUNE。BRDX 成交量低于未平仓量，EMBR 两个门槛都没过，ALFA 12月20日 看涨还有 79 天到期，超过 60 天的上限。`,
			],
		},
		beats: [
			{
				id: "rows",
				label: ["The rows", "数据行"],
				caption: [
					"Six contracts from Wednesday's session and the screen's default rules.",
					"周三交易时段的六份合约，以及筛选的默认规则。",
				],
				state: { stage: 0, ...DEFAULTS },
			},
			{
				id: "pass",
				label: ["Pass", "通过"],
				caption: [
					`${PASS} pass every rule. Ranked by volume/OI, CRUX leads at ${ratio(SCREEN[0]).toFixed(1)}×.`,
					`${PASS} 份通过所有规则。按成交量/OI 排名，CRUX 以 ${ratio(SCREEN[0]).toFixed(1)}× 居首。`,
				],
				state: { stage: 1, ...DEFAULTS },
			},
			{
				id: "out",
				label: ["Out", "未通过"],
				caption: [
					"Each of the others fails one rule: the ratio, the floors, or the expiry limit.",
					"其余每份都没过某条规则：比率、门槛或到期上限。",
				],
				state: { stage: 2, ...DEFAULTS },
			},
		],
		explore: {
			prompt: [
				"Change the volume and open-interest floors.",
				"改变成交量和未平仓量门槛。",
			],
			start: () => ({ stage: 2, ...DEFAULTS }),
			task: {
				kind: "reach",
				prompt: [
					"Set floors at which EMBR, with only 12 open interest, tops the ranking.",
					"设置门槛，让未平仓量只有 12 的 EMBR 排名第一。",
				],
				reached: (e) => passing(e)[0]?.id === "embr",
				done: [
					"With both floors at 0, EMBR's 60 contracts on 12 open interest rank first at 5.0×, ahead of contracts that traded thousands. Lowering floors is a fair choice if you say so; the 60-day limit still keeps ALFA's Dec 20 call out.",
					"两个门槛都设为 0 时，EMBR 在 12 的未平仓量上成交 60 张，以 5.0× 排第一，压过成交几千张的合约。降低门槛可以，但要说明；60 天的上限仍把 ALFA 12月20日 看涨挡在外面。",
				],
			},
		},
		View: ScreenView,
	}),
	defineScene<AiState, AiState>({
		id: "ai",
		label: ["Check the AI", "核对 AI"],
		title: [
			"Sort every sentence before you rely on it",
			"依赖每句话之前先分类",
		],
		revisit: "ai-verify",
		predict: {
			prompt: [
				`TradingFlow AI says: "CRUX's Oct 11 60 put traded ${ratio(PUT).toFixed(1)} times its open interest. Funds are hedging ahead of earnings, so CRUX will drop." What does Wednesday's screen support?`,
				`TradingFlow AI 说：“CRUX 10月11日 60 看跌的成交量是未平仓量的 ${ratio(PUT).toFixed(1)} 倍。基金在财报前对冲，所以 CRUX 会下跌。”周三的筛选支持其中哪部分？`,
			],
			choices: [
				{
					id: "ratio",
					label: [
						`Only the ${ratio(PUT).toFixed(1)}× figure`,
						`只有 ${ratio(PUT).toFixed(1)} 倍这个数字`,
					],
				},
				{ id: "all", label: ["All of it", "全部"] },
				{ id: "none", label: ["None of it", "都不支持"] },
			],
			answer: "ratio",
			revealAt: 2,
			explain: [
				`${count(PUT.volume)} traded on ${PUT.oi} open interest is ${ratio(PUT).toFixed(1)}×, which you can check from the row. Who traded and why isn't in flow data, and no session's data supports a forecast.`,
				`在 ${PUT.oi} 的未平仓量上成交 ${count(PUT.volume)} 张，是 ${ratio(PUT).toFixed(1)} 倍，可以从那一行核对。谁在交易、为什么交易不在成交流数据里，任何交易时段的数据也都不支持预测。`,
			],
		},
		beats: [
			{
				id: "split",
				label: ["Split", "拆分"],
				caption: [
					"Split the reply into statements and check each one on its own.",
					"把回复拆成几句陈述，逐句核对。",
				],
				state: { stage: 0, plain: 0, charts: 1 },
			},
			{
				id: "check",
				label: ["Calculate", "计算"],
				caption: [
					`The ratio checks out: ${count(PUT.volume)} ÷ ${PUT.oi} ≈ ${ratio(PUT).toFixed(1)}. This reply came with a chart, so it used 2 credits.`,
					`比率站得住：${count(PUT.volume)} ÷ ${PUT.oi} ≈ ${ratio(PUT).toFixed(1)}。这条回复带图表，所以用了 2 积分。`,
				],
				state: { stage: 1, plain: 0, charts: 1 },
			},
			{
				id: "beyond",
				label: ["Beyond the data", "超出数据"],
				caption: [
					"Who traded, why, and where CRUX goes next are beyond the data, however confident the reply sounds.",
					"谁在交易、为什么，以及 CRUX 接下来怎么走，都超出了数据，不管回复听起来多肯定。",
				],
				state: { stage: 2, plain: 0, charts: 1 },
			},
		],
		explore: {
			prompt: ["Change the replies in the conversation.", "改变对话中的回复。"],
			start: () => ({ stage: 2, plain: 0, charts: 1 }),
			task: {
				kind: "reach",
				prompt: [
					"Set up a conversation of four replies that costs 6 credits.",
					"设置一段共四条回复、消耗 6 积分的对话。",
				],
				reached: (e) => e.plain + e.charts === 4 && credits(e) === 6,
				done: [
					"Two plain replies at 1 credit and two with charts at 2: 6 credits. Billing lists what each completed reply used.",
					"两条普通回复各 1 积分，两条带图表的各 2 积分：共 6 积分。“账单”里列出每条完成的回复用了多少。",
				],
			},
		},
		View: AiView,
	}),
	defineScene<FormulaState, FormulaState>({
		id: "formula",
		label: ["Formula column", "公式列"],
		title: ["A floor keeps thin rows from leading", "门槛不让单薄的行领跑"],
		revisit: "custom-formulas",
		predict: {
			prompt: [
				`Your Rank View has a column IF([Trades] >= ${FLOOR}, [Total Premium] / [Trades], NA()). You open it on Wednesday. Which name leads the column, and with what value? Enter the value in dollars.`,
				`你的 Rank View 有一列 IF([Trades] >= ${FLOOR}, [Total Premium] / [Trades], NA())。你在周三打开它。哪个标的在这一列排第一，数值是多少？以美元填写数值。`,
			],
			choices: [
				{
					id: "right",
					label: [
						`${LEADER?.symbol}, ${usd(LEAD_VALUE * 100, 0)}`,
						`${LEADER?.symbol}，${usd(LEAD_VALUE * 100, 0)}`,
					],
				},
				{ id: "thin", label: ["GLYN, $24,000", "GLYN，$24,000"] },
				{ id: "total", label: ["ALFA, $4,000", "ALFA，$4,000"] },
			],
			answer: "right",
			entry: { answer: LEAD_VALUE, prefix: "$" },
			revealAt: 2,
			explain: [
				`GLYN's 4 trades are under the floor, so its cell is N/A: a blank, not a zero. DUNE leads at $450,000 ÷ 50 = ${usd(LEAD_VALUE * 100, 0)} a trade. The view saved the formula; the values are Wednesday's.`,
				`GLYN 只有 4 笔，低于门槛，所以它的单元格是 N/A：空白，不是零。DUNE 以 $450,000 ÷ 50 = 每笔 ${usd(LEAD_VALUE * 100, 0)} 居首。视图保存的是公式，数值是周三的。`,
			],
		},
		beats: [
			{
				id: "rows",
				label: ["Rows", "数据行"],
				caption: [
					"Wednesday's premium and trade counts for the five names in your view.",
					"你视图里五个标的周三的权利金和交易笔数。",
				],
				state: { stage: 0, floor: FLOOR },
			},
			{
				id: "floor",
				label: ["Floor", "门槛"],
				caption: [
					`Names with fewer than ${FLOOR} trades get N/A. GLYN's $24,000 a trade rests on 4 prints.`,
					`交易少于 ${FLOOR} 笔的标的为 N/A。GLYN 每笔 $24,000 只靠 4 笔成交。`,
				],
				state: { stage: 1, floor: FLOOR },
			},
			{
				id: "lead",
				label: ["Leader", "第一"],
				caption: [
					`Of the names that clear the floor, DUNE leads at ${usd(LEAD_VALUE * 100, 0)} a trade.`,
					`在过了门槛的标的里，DUNE 以每笔 ${usd(LEAD_VALUE * 100, 0)} 居首。`,
				],
				state: { stage: 2, floor: FLOOR },
			},
		],
		explore: {
			prompt: ["Change the trade floor.", "改变笔数门槛。"],
			start: () => ({ stage: 2, floor: FLOOR }),
			task: {
				kind: "reach",
				prompt: [
					"Find the lowest floor at which CRUX leads.",
					"找出 CRUX 排第一的最低门槛。",
				],
				reached: (e) => e.floor === CRUX_FLOOR,
				done: [
					`At ${CRUX_FLOOR} trades DUNE drops out and CRUX leads at $5,000 a trade. The floor decides who is eligible, so name it with the column.`,
					`门槛为 ${CRUX_FLOOR} 笔时 DUNE 出局，CRUX 以每笔 $5,000 居首。门槛决定谁有资格入选，所以要和列一起写明。`,
				],
			},
		},
		View: FormulaView,
	}),
] as const;

export function CheckpointWorkflowsWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="checkpoint-workflows"
			label={[
				"Checkpoint for workflows in TradingFlow",
				"“在 TradingFlow 中构建工作流”检查点",
			]}
			scenes={scenes}
			review
		/>
	);
}
