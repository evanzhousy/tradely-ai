import { type Copy, count, pick, signedCount } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import {
	RankBump,
	type RankColumn,
	type RankItem,
	rankBumpHeight,
} from "../walkthrough/instruments/rank-bump";
import { Player } from "../walkthrough/player";
import { Stage } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame } from "../walkthrough/walkthrough";
import { rankSymbolsFilm } from "./rank-symbols-film";
import {
	byDesc,
	FLOOR,
	MOVERS,
	oiChange,
	PEERS,
	type Peer,
	ratio,
	tuesday,
	typical,
	volumeOf,
} from "./rank-symbols-model";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

// ——— Scene 1: raw size or relative activity ———

type MetricState = { columns: "raw" | "both"; floor: boolean };

function metricColumns(state: MetricState, locale: Locale): RankColumn[] {
	const t = tr(locale);
	const eligible = PEERS.filter((peer) => volumeOf(peer) >= FLOOR);
	const rawRows: Peer[] = state.floor ? eligible : [...PEERS];
	const raw: RankItem[] = byDesc(rawRows, volumeOf).map((peer) => ({
		id: peer,
		label: peer,
		value: count(volumeOf(peer)),
	}));
	if (state.floor)
		raw.push({
			id: "GLYN",
			label: "GLYN",
			value: "",
			excluded: t(["< floor", "< 门槛"]),
		});
	const relativeRows: Peer[] = state.floor ? eligible : [...PEERS];
	const relative: RankItem[] = byDesc(
		relativeRows,
		(peer) => volumeOf(peer) / typical[peer],
	).map((peer) => ({
		id: peer,
		label: peer,
		value: ratio(volumeOf(peer) / typical[peer]),
		tone: "accent" as const,
	}));
	if (state.floor)
		relative.push({
			id: "GLYN",
			label: "GLYN",
			value: "",
			excluded: t(["< floor", "< 门槛"]),
		});
	const columns: RankColumn[] = [
		{ id: "raw", title: t(["Contracts", "张数"]), items: raw },
	];
	if (state.columns === "both")
		columns.push({
			id: "relative",
			title: t(["vs normal", "相对平常"]),
			items: relative,
		});
	return columns;
}

function MetricView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: MetricState;
	explore: MetricState | null;
	setExplore: (next: MetricState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const columns = metricColumns(shown, locale);
	const rows = Math.max(...columns.map((column) => column.items.length));
	const result: ResultItem[] = [
		{
			id: "raw",
			label: t(["Most contracts", "张数最多"]),
			value: `CRUX · ${count(volumeOf("CRUX"))}`,
			evidence: "observed",
		},
	];
	if (shown.columns === "both")
		result.push({
			id: "relative",
			label: t(["Most unusual for itself", "相对自身最异常"]),
			value: `DUNE · ${ratio(volumeOf("DUNE") / typical.DUNE)}`,
			note: t([
				`${count(volumeOf("DUNE"))} vs a normal ${typical.DUNE}`,
				`${count(volumeOf("DUNE"))} 对比平常 ${typical.DUNE}`,
			]),
			evidence: "calculated",
		});
	if (shown.floor)
		result.push({
			id: "floor",
			label: t(["Left out, disclosed", "已排除并披露"]),
			value: "GLYN",
			note: t([
				`${volumeOf("GLYN")} contracts, under the ${FLOOR} floor`,
				`${volumeOf("GLYN")} 张，低于 ${FLOOR} 张门槛`,
			]),
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"ALFA's peers ranked by contracts traded and by activity relative to their own normal",
						"ALFA 的同组股票按成交张数、以及相对自身平常的活跃度排序",
					])}
					height={rankBumpHeight(rows)}
				>
					{(width) => <RankBump width={width} columns={columns} focus="DUNE" />}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Liquidity floor", "流动性门槛"])}
						value={explore.floor ? "on" : "off"}
						options={[
							["on", t([`${FLOOR} contracts`, `${FLOOR} 张`])],
							["off", t(["None", "无"])],
						]}
						onChange={(value) =>
							setExplore({ columns: "both", floor: value === "on" })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A ranking orders names under one metric and one scope; it points attention, it doesn't predict. Raw contracts answer 'where is the most trading?'; volume against each name's own normal answers 'what is unusual for this name today?'. Pick the metric from the question, not from whichever makes the most dramatic leader, and disclose any floor that keeps tiny names out.",
						"排名在一个指标、一个范围下给名字排序；它指引关注，不做预测。原始张数回答“哪里交易最多？”；相对各自平常的成交量回答“今天什么对这个名字来说不寻常？”。按问题选择指标，而不是选能产生最戏剧化领先者的那个，并披露把小名字挡在外面的门槛。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: signed order or size of change ———

/** `signs`: show which way each change went; `both`: add the signed order beside it. */
type SignedState = { signs: boolean; both: boolean };

function signedColumns(state: SignedState, locale: Locale): RankColumn[] {
	const t = tr(locale);
	const symbols = Object.keys(oiChange);
	const item = (symbol: string): RankItem =>
		state.signs
			? {
					id: symbol,
					label: symbol,
					value: `${oiChange[symbol] >= 0 ? "↑" : "↓"} ${signedCount(oiChange[symbol])}`,
					tone: oiChange[symbol] >= 0 ? "gain" : "loss",
				}
			: { id: symbol, label: symbol, value: count(Math.abs(oiChange[symbol])) };
	const columns: RankColumn[] = [
		{
			id: "size",
			title: t(["By size of change", "按变化幅度"]),
			items: byDesc(symbols, (symbol) => Math.abs(oiChange[symbol])).map(item),
		},
	];
	if (state.both)
		columns.push({
			id: "signed",
			title: t(["By change", "按变化"]),
			items: byDesc(symbols, (symbol) => oiChange[symbol]).map(item),
		});
	return columns;
}

function SignedView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SignedState;
	explore: SignedState | null;
	setExplore: (next: SignedState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const columns = signedColumns(shown, locale);
	const result: ResultItem[] = [
		{
			id: "top",
			label: t(["First by size", "按幅度第一"]),
			value: t(["CRUX · 900 contracts", "CRUX · 900 张"]),
		},
	];
	if (shown.signs)
		result.push({
			id: "crux",
			label: t(["CRUX's open interest", "CRUX 的未平仓量"]),
			value: signedCount(oiChange.CRUX),
			note: t(["fell, whatever its rank", "无论排名如何，都是下降"]),
			tone: "loss",
			evidence: "calculated",
		});
	if (shown.both)
		result.push({
			id: "signed",
			label: t(["First by change", "按变化第一"]),
			value: `ALFA · ${signedCount(oiChange.ALFA)}`,
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Monday's open-interest change ranked by size and by signed value",
						"周一未平仓量变化按幅度与按带符号数值排序",
					])}
					height={rankBumpHeight(3)}
				>
					{(width) => <RankBump width={width} columns={columns} focus="CRUX" />}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Show", "显示"])}
						value={explore.both ? "both" : explore.signs ? "signs" : "size"}
						options={[
							["size", t(["Size only", "仅幅度"])],
							["signs", t(["+ Direction", "+ 方向"])],
							["both", t(["+ Signed order", "+ 带符号排序"])],
						]}
						onChange={(value) =>
							setExplore({ signs: value !== "size", both: value === "both" })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A signed metric can be ranked by its value or by its size. Ranked by size, a fall of 900 comes before a rise of 380, but it is still a fall. Keep the sign next to the rank so a big decline isn't read as a big increase.",
						"带符号的指标可以按数值排序，也可以按幅度排序。按幅度，下降 900 排在上升 380 前面，但它仍然是下降。把符号放在排名旁边，免得把大幅下降读成大幅上升。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: a rank can move without you ———

type MoveState = { stage: 0 | 1 | 2 };

function moveColumns(state: MoveState, locale: Locale): RankColumn[] {
	const t = tr(locale);
	const monday: RankColumn = {
		id: "mon",
		title: t(["Monday", "周一"]),
		items: byDesc(MOVERS, volumeOf).map((symbol) => ({
			id: symbol,
			label: symbol,
			value: count(volumeOf(symbol)),
		})),
	};
	if (state.stage === 0) return [monday];
	return [
		monday,
		{
			id: "tue",
			title: t(["Tuesday", "周二"]),
			items: byDesc(MOVERS, (symbol) => tuesday[symbol]).map((symbol) => ({
				id: symbol,
				label: symbol,
				value: count(tuesday[symbol]),
			})),
		},
	];
}

function MoveView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: MoveState;
	explore: MoveState | null;
	setExplore: (next: MoveState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const columns = moveColumns(shown, locale);
	const result: ResultItem[] = [
		{
			id: "alfa",
			label: t(["ALFA's volume", "ALFA 的成交量"]),
			value:
				shown.stage === 0
					? count(volumeOf("ALFA"))
					: t(["2,400 both days", "两天都是 2,400"]),
			evidence: "observed",
		},
		{
			id: "rank",
			label: t(["ALFA's rank", "ALFA 的排名"]),
			value: shown.stage === 0 ? "2" : t(["2 → 1", "2 → 1"]),
			note:
				shown.stage === 0
					? undefined
					: t(["CRUX fell from 5,600 to 1,900", "CRUX 从 5,600 降到 1,900"]),
		},
	];
	if (shown.stage >= 2)
		result.push({
			id: "handoff",
			label: t(["Handoff note", "交接说明"]),
			value: t([
				"ALFA #1 of 3 · Tuesday · contracts",
				"ALFA 3 只中第 1 · 周二 · 张数",
			]),
			note: t([
				"rose because a peer fell · FJOR missing · revisit if FJOR arrives",
				"因同组下降而上升 · 缺 FJOR · FJOR 到达后复核",
			]),
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Three stocks ranked by option volume on Monday and on Tuesday",
						"三只股票周一与周二按期权成交量的排名",
					])}
					height={rankBumpHeight(3)}
				>
					{(width) => <RankBump width={width} columns={columns} focus="ALFA" />}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Show", "显示"])}
						value={String(explore.stage) as "0" | "1" | "2"}
						options={[
							["0", t(["Monday", "周一"])],
							["1", t(["+ Tuesday", "+ 周二"])],
							["2", t(["+ Handoff", "+ 交接"])],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as MoveState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A rank depends on everyone else in the set. A name can climb because its peers fell or were excluded, with nothing new of its own. When you pass a candidate on, include its value, the comparison set, why it's worth a look and what would lower its priority.",
						"排名取决于集合里的其他所有名字。一个名字可能因为同组下降或被排除而上升，自身却没有任何新变化。把候选交给别人时，要写明它的数值、比较集合、为何值得一看，以及什么会降低它的优先级。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<MetricState, MetricState>({
		id: "metric",
		label: ["Choose the metric", "选择指标"],
		title: [
			"Raw size and relative activity pick different leaders",
			"原始规模与相对活跃度选出不同的领先者",
		],
		predict: {
			prompt: [
				"Which of ALFA's peers is most unusual today compared with its own normal volume?",
				"与各自平常的成交量相比，ALFA 的哪个同组股票今天最不寻常？",
			],
			choices: [
				{ id: "dune", label: ["DUNE: 3× its normal", "DUNE：平常的 3 倍"] },
				{ id: "crux", label: ["CRUX: the most contracts", "CRUX：张数最多"] },
				{ id: "alfa", label: ["ALFA", "ALFA"] },
			],
			answer: "dune",
			revealAt: 1,
			explain: [
				"DUNE's 900 contracts are 3× its normal 300. CRUX trades the most, but 5,600 is a little below its usual 6,000.",
				"DUNE 的 900 张是它平常 300 张的 3 倍。CRUX 成交最多，但 5,600 略低于它平常的 6,000。",
			],
		},
		beats: [
			{
				id: "raw",
				label: ["Raw size", "原始规模"],
				caption: [
					"By contracts traded Monday, CRUX leads with 5,600, then ALFA with 2,400 and DUNE with 900. GLYN's 300 is under a 500 floor.",
					"按周一成交张数，CRUX 以 5,600 领先，其次是 ALFA 2,400、DUNE 900。GLYN 的 300 张低于 500 张门槛。",
				],
				state: { columns: "raw", floor: true },
			},
			{
				id: "relative",
				label: ["Relative", "相对"],
				caption: [
					"Against each stock's own normal, the order flips: DUNE is 3× its usual, ALFA and GLYN 2×, and CRUX slightly below normal.",
					"与各自平常相比，顺序反转：DUNE 是平常的 3 倍，ALFA 和 GLYN 2 倍，CRUX 略低于平常。",
				],
				state: { columns: "both", floor: false },
			},
			{
				id: "floor",
				label: ["The floor", "门槛"],
				caption: [
					"But GLYN's 2× rests on just 300 contracts, under the 500 floor. Leaving it out is fine, as long as you say so.",
					"但 GLYN 的 2 倍只基于 300 张，低于 500 张门槛。排除它没问题，只要说明即可。",
				],
				state: { columns: "both", floor: true },
			},
		],
		explore: {
			prompt: [
				"Remove the liquidity floor and watch the relative ranking.",
				"去掉流动性门槛，观察相对排名。",
			],
			start: () => ({ columns: "both", floor: false }),
			task: {
				kind: "answer",
				prompt: [
					"The most active name by contracts: where does it rank against its own normal?",
					"按张数最活跃的标的，相对它自己的常态排第几？",
				],
				choices: [
					{ id: "last", label: ["CRUX, last", "CRUX，最后"] },
					{ id: "first", label: ["CRUX, first again", "CRUX，同样第一"] },
					{ id: "dune", label: ["DUNE, first", "DUNE，第一"] },
				],
				answer: "last",
				done: [
					"CRUX trades the most, 5,600 contracts, yet that is 0.93× its usual 6,000: last by relative activity. Raw size and relative activity answer different questions.",
					"CRUX 成交最多，5,600 张，但这只是它平常 6,000 张的 0.93 倍：按相对活跃度排最后。原始规模和相对活跃度回答的是不同的问题。",
				],
			},
		},
		View: MetricView,
	}),
	defineScene<SignedState, SignedState>({
		id: "signed",
		label: ["Sign and size", "符号与幅度"],
		title: ["A big negative stays negative", "大的负值仍然是负的"],
		predict: {
			prompt: [
				"Ranked by the size of Monday's open-interest change, CRUX comes first. Did CRUX's open interest grow?",
				"按周一未平仓量变化的幅度排序，CRUX 排第一。CRUX 的未平仓量增加了吗？",
			],
			choices: [
				{ id: "fell", label: ["No: it fell by 900", "没有：它减少了 900"] },
				{ id: "grew", label: ["Yes: it's ranked first", "是的：它排第一"] },
				{
					id: "unknown",
					label: ["Can't tell from a ranking", "从排名看不出来"],
				},
			],
			answer: "fell",
			revealAt: 1,
			explain: [
				"Ranking by size ignores the sign, so the biggest move comes first whichever way it went. CRUX lost 900 contracts of open interest.",
				"按幅度排序会忽略符号，所以变动最大的排在最前，不管方向如何。CRUX 的未平仓量减少了 900 张。",
			],
		},
		beats: [
			{
				id: "size",
				label: ["By size", "按幅度"],
				caption: [
					"A screen ranks Monday's open-interest change by size: CRUX 900, ALFA 380, DUNE 150. CRUX comes first.",
					"一个筛选器按幅度给周一的未平仓量变化排序：CRUX 900、ALFA 380、DUNE 150。CRUX 排第一。",
				],
				state: { signs: false, both: false },
			},
			{
				id: "direction",
				label: ["Direction", "方向"],
				caption: [
					"Put the direction back: CRUX's 900 was a fall. Ranking by size puts the biggest move first, whichever way it went.",
					"把方向加回来：CRUX 的 900 是下降。按幅度排序会把最大的变动排在最前，不管方向如何。",
				],
				state: { signs: true, both: false },
			},
			{
				id: "signed",
				label: ["By change", "按变化"],
				caption: [
					"Ranked by the change itself, ALFA's +380 comes first and CRUX's −900 last. Same data, opposite ends.",
					"按变化本身排序，ALFA 的 +380 第一，CRUX 的 −900 最后。同样的数据，截然相反的两端。",
				],
				state: { signs: true, both: true },
			},
		],
		explore: {
			prompt: ["Switch what the ranking shows.", "切换排名所显示的内容。"],
			start: (last) => last,
			task: {
				kind: "answer",
				prompt: [
					"Which name's open interest grew the most on Monday?",
					"周一哪个标的的未平仓量增加最多？",
				],
				choices: [
					{ id: "alfa", label: ["ALFA", "ALFA"] },
					{ id: "crux", label: ["CRUX", "CRUX"] },
					{ id: "dune", label: ["DUNE", "DUNE"] },
				],
				answer: "alfa",
				done: [
					"ALFA's +380 is the largest increase. CRUX's 900 was the biggest move, but a fall; ranked by size it came first, ranked by change it comes last.",
					"ALFA 的 +380 是最大的增加。CRUX 的 900 是最大的变动，但它是减少；按幅度排它第一，按变化排它最后。",
				],
			},
		},
		View: SignedView,
	}),
	defineScene<MoveState, MoveState>({
		id: "move",
		label: ["Carry it forward", "交接候选"],
		title: [
			"A rank can change while the name stands still",
			"名字没变，排名也可能变",
		],
		predict: {
			prompt: [
				"ALFA traded 2,400 contracts on both Monday and Tuesday, but its rank went from 2nd to 1st. What changed?",
				"ALFA 周一和周二都成交 2,400 张，但排名从第 2 升到第 1。什么变了？",
			],
			choices: [
				{ id: "peers", label: ["A peer traded less", "同组有股票成交减少"] },
				{ id: "alfa", label: ["ALFA became more active", "ALFA 变得更活跃"] },
				{ id: "broken", label: ["The ranking is broken", "排名出错了"] },
			],
			answer: "peers",
			revealAt: 1,
			explain: [
				"CRUX fell from 5,600 to 1,900, so ALFA moved up without doing anything new. The rank change isn't news about ALFA.",
				"CRUX 从 5,600 降到 1,900，所以 ALFA 没做任何新事就上升了。排名变化并不是关于 ALFA 的新闻。",
			],
		},
		beats: [
			{
				id: "monday",
				label: ["Monday", "周一"],
				caption: [
					"Monday by contracts: CRUX 5,600, ALFA 2,400, DUNE 900. ALFA is second.",
					"周一按张数：CRUX 5,600，ALFA 2,400，DUNE 900。ALFA 第二。",
				],
				state: { stage: 0 },
			},
			{
				id: "tuesday",
				label: ["Tuesday", "周二"],
				caption: [
					"Tuesday ALFA trades the same 2,400, but CRUX falls to 1,900. ALFA is now first without doing anything new.",
					"周二 ALFA 同样成交 2,400，但 CRUX 降到 1,900。ALFA 现在第一，却没有任何新变化。",
				],
				state: { stage: 1 },
			},
			{
				id: "handoff",
				label: ["Handoff", "交接"],
				caption: [
					"Pass it on with its context: #1 of three by contracts, risen because a peer fell, FJOR missing, revisit if FJOR arrives.",
					"交接时附上背景：按张数在三只中第一，因同组下降而上升，缺 FJOR，FJOR 到达后复核。",
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: [
				"Step between Monday, Tuesday and the handoff note.",
				"在周一、周二和交接说明之间切换。",
			],
			start: () => ({ stage: 2 }),
			task: {
				kind: "answer",
				prompt: [
					"What does ALFA's new #1 depend on?",
					"ALFA 新的第一名取决于什么？",
				],
				choices: [
					{
						id: "peers",
						label: [
							"A peer falling, with FJOR still missing",
							"同组标的下降，以及 FJOR 仍然缺失",
						],
					},
					{
						id: "alfa",
						label: ["ALFA trading more on Tuesday", "ALFA 周二成交更多"],
					},
					{
						id: "nothing",
						label: ["Nothing: #1 is #1", "什么都不取决：第一就是第一"],
					},
				],
				answer: "peers",
				done: [
					"ALFA traded the same 2,400 both days; CRUX fell from 5,600 to 1,900. The rank is about the peers, and FJOR's missing figure could still change it, which is why the handoff says so.",
					"ALFA 两天都成交 2,400 张；CRUX 从 5,600 降到 1,900。排名变化来自同组标的，而且 FJOR 缺失的数据仍可能改变它，所以交接说明要写清楚。",
				],
			},
		},
		View: MoveView,
	}),
] as const;

export function RankSymbolsWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Player
			locale={locale}
			id="rank-symbols"
			label={["Interactive lesson on rankings", "排名互动课"]}
			film={rankSymbolsFilm}
			scenes={scenes}
		/>
	);
}
