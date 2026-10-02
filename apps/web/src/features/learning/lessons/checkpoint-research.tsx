import { type Copy, count, pick } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import type { TapeRow } from "../walkthrough/instruments/trade-tape";
import { defineScene, type Phase } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";
import { CHECKPOINT_DAY, type SheetLine, SheetStage } from "./checkpoint-kit";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

// ——— Scene 1: who belongs in the comparison ———

type UniverseState = { stage: 0 | 1 | 2; floor: number };

type Name = {
	symbol: string;
	kind: "stock" | "etf";
	volume: number | null;
	typical: number;
};
const NAMES: readonly Name[] = [
	{ symbol: "ALFA", kind: "stock", volume: 2_400, typical: 3_000 },
	{ symbol: "BRDX", kind: "etf", volume: 5_100, typical: 4_800 },
	{ symbol: "CRUX", kind: "stock", volume: 1_900, typical: 950 },
	{ symbol: "DUNE", kind: "stock", volume: 650, typical: 200 },
	{ symbol: "FJOR", kind: "stock", volume: null, typical: 700 },
];
const FLOOR = 800;
const qualifies = (name: Name, floor: number) =>
	name.kind === "stock" && name.volume !== null && name.volume >= floor;
/** Why a name is in or out; a phone gets the short form, its volume cell showing the rest. */
const reason = (name: Name, floor: number, narrow = false): Copy =>
	name.kind !== "stock"
		? ["out: an ETF", "排除：ETF"]
		: name.volume === null
			? [narrow ? "unknown" : "unknown: no data", "未知：无数据"]
			: name.volume < floor
				? narrow
					? [`out: < ${count(floor)}`, `排除：< ${count(floor)}`]
					: [`out: under ${count(floor)}`, `排除：低于 ${count(floor)}`]
				: ["in", "纳入"];
const QUALIFIED = NAMES.filter((name) => qualifies(name, FLOOR)).length;

function UniverseView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: UniverseState;
	explore: UniverseState | null;
	setExplore: (next: UniverseState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const inCount = NAMES.filter((name) => qualifies(name, shown.floor)).length;
	const rows = (narrow: boolean): TapeRow[] =>
		NAMES.map((name, i) => ({
			key: String.fromCharCode(97 + i),
			cells: [
				name.symbol,
				t(name.kind === "stock" ? ["stock", "股票"] : ["ETF", "ETF"]),
				name.volume === null ? "—" : count(name.volume),
				shown.stage >= 1 ? t(reason(name, shown.floor, narrow)) : "",
			],
			muted: shown.stage >= 1 && !qualifies(name, shown.floor),
		}));
	const lines: SheetLine[] = [];
	if (shown.stage >= 2)
		lines.push({
			text: t([
				`${inCount} qualify; FJOR is unknown, not zero`,
				`${inCount} 个合格；FJOR 未知，不是零`,
			]),
			tone: "strong",
		});
	return (
		<SceneFrame
			stage={
				<SheetStage
					label={t([
						"Five candidate names checked against a stated comparison rule",
						"按给定的比较规则检查五个候选标的",
					])}
					lineSlots={1}
					title={t([
						`Rule: stocks · complete data · ≥ ${count(shown.floor)}`,
						`规则：股票 · 数据完整 · ≥ ${count(shown.floor)}`,
					])}
					columns={(width) => [
						{ label: t(["Name", "标的"]), share: width < 520 ? 0.16 : 0.18 },
						{ label: t(["Type", "类型"]), share: width < 520 ? 0.2 : 0.18 },
						{
							label: t(["Volume", "成交量"]),
							share: width < 520 ? 0.2 : 0.22,
							align: "end",
						},
						{
							label: t(["Status", "状态"]),
							share: width < 520 ? 0.44 : 0.42,
							align: "end",
						},
					]}
					rows={(width) => rows(width < 520)}
					maxRows={5}
					lines={lines}
				/>
			}
			result={[
				{
					id: "in",
					label: t(["Qualify", "合格"]),
					value: shown.stage >= 1 ? String(inCount) : "?",
					note: t(["names in the comparison", "进入比较的标的"]),
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<RangeControl
						label={t(["Volume floor", "成交量门槛"])}
						value={explore.floor}
						display={count(explore.floor)}
						min={400}
						max={1_200}
						step={50}
						onChange={(floor) => setExplore({ ...explore, floor })}
					/>
				) : null
			}
		/>
	);
}

// ——— Scene 2: ranked by what? ———

type RankState = { stage: 0 | 1 | 2; metric: "raw" | "relative" };

const RANKED = NAMES.filter((name) => qualifies(name, FLOOR));
const relative = (name: Name) => (name.volume ?? 0) / name.typical;

function RankView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: RankState;
	explore: RankState | null;
	setExplore: (next: RankState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const order = [...RANKED].sort((a, b) =>
		shown.metric === "raw"
			? (b.volume ?? 0) - (a.volume ?? 0)
			: relative(b) - relative(a),
	);
	const rows: TapeRow[] = order.map((name) => ({
		key: name.symbol,
		cells: [
			name.symbol,
			count(name.volume ?? 0),
			count(name.typical),
			shown.stage >= 1 ? `${relative(name).toFixed(1)}×` : "",
		],
	}));
	const crux = RANKED.find((name) => name.symbol === "CRUX");
	const lines: SheetLine[] = [];
	if (shown.stage >= 1 && crux)
		lines.push({
			text: t([
				`CRUX: ${count(crux.volume ?? 0)} ÷ ${count(crux.typical)} = ${relative(crux).toFixed(1)}× its normal`,
				`CRUX：${count(crux.volume ?? 0)} ÷ ${count(crux.typical)} = 平常的 ${relative(crux).toFixed(1)}×`,
			]),
		});
	if (shown.stage >= 2)
		lines.push({
			text: t([
				`ranked by ${shown.metric === "raw" ? "raw volume" : "relative volume"}: ${order[0].symbol} leads`,
				`按${shown.metric === "raw" ? "原始成交量" : "相对成交量"}排名：${order[0].symbol} 领先`,
			]),
			tone: "strong",
		});
	return (
		<SceneFrame
			stage={
				<SheetStage
					label={t([
						"The qualifying names ranked by raw volume or by volume against their own normal",
						"合格的标的按原始成交量或相对自身平常水平的成交量排名",
					])}
					lineSlots={2}
					title={t([
						`Qualifying names · ${CHECKPOINT_DAY[0]}`,
						`合格标的 · ${CHECKPOINT_DAY[1]}`,
					])}
					columns={[
						{ label: t(["Name", "标的"]), share: 0.22 },
						{ label: t(["Volume", "成交量"]), share: 0.26, align: "end" },
						{ label: t(["Typical", "典型量"]), share: 0.26, align: "end" },
						{ label: t(["Relative", "相对"]), share: 0.26, align: "end" },
					]}
					rows={rows}
					maxRows={2}
					lines={lines}
				/>
			}
			result={[
				{
					id: "leader",
					label: t([
						shown.metric === "raw"
							? "Leader, raw volume"
							: "Leader, relative volume",
						shown.metric === "raw"
							? "领先者（原始成交量）"
							: "领先者（相对成交量）",
					]),
					value: shown.stage >= 2 ? order[0].symbol : "?",
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Rank by", "排名依据"])}
						value={explore.metric}
						options={[
							["relative", t(["Relative volume", "相对成交量"])],
							["raw", t(["Raw volume", "原始成交量"])],
						]}
						onChange={(metric) => setExplore({ ...explore, metric })}
					/>
				) : null
			}
		/>
	);
}

// ——— Scene 3: what was known when ———

type DecayState = { stage: 0 | 1 | 2; minutes: number };

const START_SCORE = 120;
const HALF_LIFE = 30;
const score = (minutes: number) => START_SCORE / 2 ** (minutes / HALF_LIFE);
const FIRST_UNDER_10 =
	Array.from({ length: 6 }, (_, i) => i * 30).find(
		(minutes) => score(minutes) < 10,
	) ?? 150;

function DecayView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: DecayState;
	explore: DecayState | null;
	setExplore: (next: DecayState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const halves = shown.minutes / HALF_LIFE;
	const rows: TapeRow[] = [
		{
			key: "a",
			cells: [t(["Score at 11:00", "11:00 的分数"]), String(START_SCORE)],
		},
		{
			key: "b",
			cells: [
				t(["Half-life", "半衰期"]),
				t([`${HALF_LIFE} minutes`, `${HALF_LIFE} 分钟`]),
			],
		},
		{
			key: "c",
			cells: [t(["New trades since", "此后的新成交"]), t(["none", "无"])],
		},
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: t([
				`${shown.minutes} minutes is ${halves} half-li${halves === 1 ? "fe" : "ves"}: ${START_SCORE} × (½)^${halves}`,
				`${shown.minutes} 分钟是 ${halves} 个半衰期：${START_SCORE} × (½)^${halves}`,
			]),
		});
	if (shown.stage >= 2)
		lines.push({
			text: t([
				`= ${Number(score(shown.minutes).toFixed(2))}; the trades behind it are unchanged`,
				`= ${Number(score(shown.minutes).toFixed(2))}；背后的成交没有变`,
			]),
			tone: "strong",
		});
	return (
		<SceneFrame
			stage={
				<SheetStage
					label={t([
						"A recency-weighted activity score fading with no new trades",
						"一个按近期加权的活跃度分数，在没有新成交时逐渐衰减",
					])}
					lineSlots={2}
					title={t([
						`Recency score · ALFA Oct 18 105 call · ${CHECKPOINT_DAY[0]}`,
						`近期分数 · ALFA 10月18日 105 看涨 · ${CHECKPOINT_DAY[1]}`,
					])}
					columns={[
						{ label: t(["Input", "输入"]), share: 0.6 },
						{ label: t(["Value", "数值"]), share: 0.4, align: "end" },
					]}
					rows={rows}
					maxRows={3}
					lines={lines}
				/>
			}
			result={[
				{
					id: "score",
					label: t([
						`After ${shown.minutes} minutes`,
						`${shown.minutes} 分钟后`,
					]),
					value:
						shown.stage >= 2 || phase === "explore"
							? String(Number(score(shown.minutes).toFixed(2)))
							: "?",
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<RangeControl
						label={t(["Minutes since 11:00", "11:00 之后的分钟数"])}
						value={explore.minutes}
						display={String(explore.minutes)}
						min={0}
						max={150}
						step={30}
						onChange={(minutes) => setExplore({ ...explore, minutes })}
					/>
				) : null
			}
		/>
	);
}

// ——— Checkpoint ———

const scenes = [
	defineScene<UniverseState, UniverseState>({
		id: "universe",
		label: ["Who qualifies", "谁有资格"],
		title: ["Apply the rule before you rank", "排名之前先应用规则"],
		revisit: "symbol-universe",
		predict: {
			prompt: [
				`Rule: stock options, ${CHECKPOINT_DAY[0]}'s session, complete data, at least ${count(FLOOR)} contracts. Candidates: ALFA (stock, 2,400), BRDX (ETF, 5,100), CRUX (stock, 1,900), DUNE (stock, 650), FJOR (stock, data missing). How many qualify?`,
				`规则：股票期权、${CHECKPOINT_DAY[1]}时段、数据完整、至少 ${count(FLOOR)} 张。候选：ALFA（股票，2,400）、BRDX（ETF，5,100）、CRUX（股票，1,900）、DUNE（股票，650）、FJOR（股票，数据缺失）。有几个合格？`,
			],
			choices: [
				{ id: "two", label: ["2", "2"] },
				{ id: "three", label: ["3: BRDX traded the most", "3：BRDX 成交最多"] },
				{ id: "four", label: ["4: count FJOR as zero", "4：把 FJOR 算作零"] },
			],
			answer: "two",
			entry: { answer: QUALIFIED, unit: [" names", " 个"] },
			revealAt: 1,
			explain: [
				"ALFA and CRUX. BRDX is an ETF, DUNE is under the floor, and FJOR's volume is unknown: it can't be ranked, and it isn't zero.",
				"ALFA 和 CRUX。BRDX 是 ETF，DUNE 低于门槛，FJOR 的成交量未知：既不能排名，也不等于零。",
			],
		},
		beats: [
			{
				id: "names",
				label: ["Candidates", "候选"],
				caption: [
					"Five candidates and a stated rule: stocks only, complete data, at least 800 contracts.",
					"五个候选和一条给定规则：只要股票、数据完整、至少 800 张。",
				],
				state: { stage: 0, floor: FLOOR },
			},
			{
				id: "rule",
				label: ["Apply it", "应用规则"],
				caption: [
					"BRDX is out as an ETF, DUNE is under 800, and FJOR has no data. ALFA and CRUX remain.",
					"BRDX 是 ETF，排除；DUNE 低于 800；FJOR 没有数据。剩下 ALFA 和 CRUX。",
				],
				state: { stage: 1, floor: FLOOR },
			},
			{
				id: "limit",
				label: ["The limit", "局限"],
				caption: [
					'Two qualify. With FJOR unknown, any "most active stock" claim covers only the names you observed.',
					"两个合格。由于 FJOR 未知，任何“最活跃股票”的说法都只适用于已观测的标的。",
				],
				state: { stage: 2, floor: FLOOR },
			},
		],
		explore: {
			prompt: ["Move the volume floor.", "移动成交量门槛。"],
			start: () => ({ stage: 2, floor: FLOOR }),
			task: {
				kind: "reach",
				prompt: [
					"Find the highest floor that lets DUNE in.",
					"找出能让 DUNE 进入的最高门槛。",
				],
				reached: (e) => e.floor === 650,
				done: [
					"At 650 DUNE's 650 clears the floor and three names qualify. Changing the floor after seeing who leads would change the question, so set it before you rank.",
					"门槛为 650 时，DUNE 的 650 达标，三个标的合格。看到谁领先之后再改门槛就改变了问题，所以要在排名之前定好。",
				],
			},
		},
		View: UniverseView,
	}),
	defineScene<RankState, RankState>({
		id: "rank",
		label: ["Ranked by what?", "按什么排名？"],
		title: ["The metric decides the leader", "指标决定领先者"],
		revisit: "rank-symbols",
		predict: {
			prompt: [
				"ALFA traded 2,400 against a typical 3,000; CRUX traded 1,900 against a typical 950. What is CRUX's relative volume?",
				"ALFA 成交 2,400 张，典型量为 3,000；CRUX 成交 1,900 张，典型量为 950。CRUX 的相对成交量是多少？",
			],
			choices: [
				{ id: "two", label: ["2×", "2×"] },
				{ id: "eight", label: ["0.8×", "0.8×"] },
				{ id: "half", label: ["0.5×", "0.5×"] },
			],
			answer: "two",
			entry: { answer: 2, tolerance: 0.05, unit: ["×", "×"] },
			revealAt: 1,
			explain: [
				"1,900 ÷ 950 = 2×, while ALFA is 2,400 ÷ 3,000 = 0.8×. ALFA traded more contracts, but CRUX is further above its own normal.",
				"1,900 ÷ 950 = 2×，而 ALFA 是 2,400 ÷ 3,000 = 0.8×。ALFA 成交的张数更多，但 CRUX 超出自身平常水平更多。",
			],
		},
		beats: [
			{
				id: "names",
				label: ["The two", "两个标的"],
				caption: [
					"The two qualifying names, with today's volume and their typical volume.",
					"两个合格的标的，以及它们今天的成交量和典型成交量。",
				],
				state: { stage: 0, metric: "relative" },
			},
			{
				id: "ratios",
				label: ["Ratios", "比率"],
				caption: [
					"Against their own normal: CRUX 2.0×, ALFA 0.8×.",
					"对照各自的平常水平：CRUX 2.0×，ALFA 0.8×。",
				],
				state: { stage: 1, metric: "relative" },
			},
			{
				id: "leader",
				label: ["Leader", "领先者"],
				caption: [
					'For "most unusual today", CRUX leads. For "most contracts", ALFA would. Pick the metric from the question.',
					"对“今天最异常”来说，CRUX 领先；对“成交张数最多”来说，ALFA 领先。要根据问题选指标。",
				],
				state: { stage: 2, metric: "relative" },
			},
		],
		explore: {
			prompt: ["Switch the ranking metric.", "切换排名指标。"],
			start: () => ({ stage: 2, metric: "relative" }),
			task: {
				kind: "answer",
				prompt: [
					"Ranked by raw volume, who leads?",
					"按原始成交量排名，谁领先？",
				],
				choices: [
					{ id: "alfa", label: ["ALFA", "ALFA"] },
					{ id: "crux", label: ["CRUX", "CRUX"] },
					{ id: "tie", label: ["A tie", "并列"] },
				],
				answer: "alfa",
				done: [
					"By raw volume ALFA leads with 2,400 against 1,900. Same data, different question, different leader.",
					"按原始成交量，ALFA 以 2,400 对 1,900 领先。同样的数据，不同的问题，不同的领先者。",
				],
			},
		},
		View: RankView,
	}),
	defineScene<DecayState, DecayState>({
		id: "decay",
		label: ["A fading score", "衰减的分数"],
		title: ["A score can fall with no new trade", "没有新成交，分数也会下降"],
		revisit: "point-in-time-research",
		predict: {
			prompt: [
				`A recency-weighted score for the Oct 18 105 call is ${START_SCORE} at 11:00 and halves every ${HALF_LIFE} minutes. With no new trades, what is it at 12:30?`,
				`10月18日 105 看涨的近期加权分数在 11:00 为 ${START_SCORE}，每 ${HALF_LIFE} 分钟减半。没有新成交时，12:30 是多少？`,
			],
			choices: [
				{ id: "right", label: [String(score(90)), String(score(90))] },
				{
					id: "linear",
					label: [
						"30: a quarter gone each half hour",
						"30：每半小时少四分之一",
					],
				},
				{
					id: "same",
					label: [`${START_SCORE}: nothing traded`, `${START_SCORE}：没有成交`],
				},
			],
			answer: "right",
			entry: { answer: score(90), tolerance: 0.01 },
			revealAt: 2,
			explain: [
				`90 minutes is three half-lives: ${START_SCORE} → 60 → 30 → ${score(90)}. Nothing traded; only the weight on the old trades faded.`,
				`90 分钟是三个半衰期：${START_SCORE} → 60 → 30 → ${score(90)}。没有成交；只是旧成交的权重衰减了。`,
			],
		},
		beats: [
			{
				id: "inputs",
				label: ["Inputs", "输入"],
				caption: [
					`Score ${START_SCORE} at 11:00, a ${HALF_LIFE}-minute half-life, and no new trades.`,
					`11:00 分数 ${START_SCORE}，半衰期 ${HALF_LIFE} 分钟，没有新成交。`,
				],
				state: { stage: 0, minutes: 90 },
			},
			{
				id: "halves",
				label: ["Half-lives", "半衰期"],
				caption: [
					"From 11:00 to 12:30 is 90 minutes: three half-lives.",
					"从 11:00 到 12:30 是 90 分钟：三个半衰期。",
				],
				state: { stage: 1, minutes: 90 },
			},
			{
				id: "score",
				label: ["Score", "分数"],
				caption: [
					`${START_SCORE} × (½)³ = ${score(90)}. A score can move without a single new trade.`,
					`${START_SCORE} × (½)³ = ${score(90)}。没有一笔新成交，分数也会变。`,
				],
				state: { stage: 2, minutes: 90 },
			},
		],
		explore: {
			prompt: ["Move the clock on in half-hours.", "以半小时为单位推进时间。"],
			start: () => ({ stage: 2, minutes: 0 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the first half-hour at which the score falls below 10.",
					"找出分数第一次低于 10 的半小时整点。",
				],
				reached: (e) => e.minutes === FIRST_UNDER_10,
				done: [
					`After ${FIRST_UNDER_10} minutes, four half-lives, it's ${score(FIRST_UNDER_10)}. A screen sorted by this score would drop the contract without anything new happening.`,
					`${FIRST_UNDER_10} 分钟后，也就是四个半衰期，分数为 ${score(FIRST_UNDER_10)}。按这个分数排序的筛选器，会在什么都没发生的情况下把这张合约排下去。`,
				],
			},
		},
		View: DecayView,
	}),
] as const;

export function CheckpointResearchWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="checkpoint-research"
			label={[
				"Checkpoint for comparison and investigation",
				"“比较与研究”检查点",
			]}
			scenes={scenes}
			review
		/>
	);
}
