import * as m from "motion/react-m";
import { type Copy, count, mondayActivity, pick } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import {
	type Claim,
	ClaimLadderStage,
} from "../walkthrough/instruments/claim-ladder";
import {
	ContractTicket,
	type TicketField,
	ticketHeight,
} from "../walkthrough/instruments/contract-ticket";
import { Label, Stage, useTeachMotion } from "../walkthrough/stage";
import {
	defineScene,
	type EvidenceKind,
	type Phase,
	type ResultItem,
} from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

function evidenceLabels(locale: Locale): Record<EvidenceKind, string> {
	const t = tr(locale);
	return {
		observed: t(["observed", "观测"]),
		calculated: t(["calculated", "计算"]),
		modeled: t(["modeled", "模型"]),
		inferred: t(["interpretation", "解读"]),
		unknown: t(["unknown", "未知"]),
	};
}

/** Monday volume by Oct 18 call series; the 120 call's arrives only on Tuesday. */
const SERIES = [
	{ strike: 100, volume: mondayActivity[0].volume },
	{ strike: 105, volume: mondayActivity[1].volume },
	{ strike: 110, volume: mondayActivity[2].volume },
	{ strike: 115, volume: 0 },
	{ strike: 120, volume: null as number | null, late: 30 },
];
const COVERED = SERIES.reduce((sum, row) => sum + (row.volume ?? 0), 0);
const WITH_LATE = COVERED + 30;
const LEADER = SERIES[2];
const share = (part: number, whole: number) =>
	`${Math.round((part / whole) * 100)}%`;

// ——— Scene 1: a question someone else can check ———

type QuestionState = { filled: number; forecast: boolean };

function questionFields(state: QuestionState, locale: Locale): TicketField[] {
	const t = tr(locale);
	const fields: TicketField[] = [
		{
			id: "subject",
			label: t(["Subject", "对象"]),
			value: t(["ALFA option activity", "ALFA 期权活动"]),
		},
		{
			id: "universe",
			label: t(["Universe", "范围"]),
			value: t(["Oct 18 calls, 100–120", "10月18日 看涨，100–120"]),
		},
		{
			id: "measure",
			label: t(["Measure", "测量量"]),
			value: t(["contracts, corrected", "张数，按更正后"]),
		},
		{
			id: "interval",
			label: t(["Interval", "区间"]),
			value: t(["Mon Sep 16, full session", "9月16日 周一，全天"]),
			short: t(["Sep 16, full session", "9月16日 周一，全天"]),
		},
		{
			id: "evidence",
			label: t(["Evidence", "证据"]),
			value: t(["tape + all 5 series", "成交记录 + 全部 5 个序列"]),
		},
		{
			id: "revision",
			label: t(["Revision rule", "修订规则"]),
			value: t(["gap→bound, fix→redo", "有缺口→给下限；有更正→重算"]),
		},
	];
	if (state.forecast)
		fields.push(
			{
				id: "outcome",
				label: t(["Outcome", "结果"]),
				value: t(["ALFA up next session?", "ALFA 下一交易日上涨？"]),
			},
			{
				id: "horizon",
				label: t(["Horizon", "期限"]),
				value: t(["one session", "一个交易日"]),
			},
			{
				id: "test",
				label: t(["Held-out test", "样本外检验"]),
				value: t(["unseen later dates", "未使用过的后续日期"]),
			},
		);
	return fields;
}

const focusAt: Record<number, string> = {
	2: "universe",
	4: "interval",
	6: "revision",
	9: "test",
};

function QuestionView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: QuestionState;
	explore: QuestionState | null;
	setExplore: (next: QuestionState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const fields = questionFields(shown, locale);
	const complete = shown.filled >= fields.length;
	const question: Copy =
		shown.filled === 0
			? ["Where's the action in ALFA?", "ALFA 哪里最活跃？"]
			: shown.filled < 4
				? [
						"What happened among ALFA's Oct 18 calls?",
						"ALFA 10月18日 看涨发生了什么？",
					]
				: shown.forecast
					? [
							"Does concentrated Oct 18 call volume precede a rise in ALFA the next session?",
							"10月18日 看涨成交集中后，ALFA 下一交易日会上涨吗？",
						]
					: [
							"Among ALFA's Oct 18 calls, where did Monday's volume concentrate?",
							"在 ALFA 10月18日 看涨中，周一的成交量集中在哪里？",
						];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A research question built field by field until someone else could check it",
						"逐项补全研究问题，直到别人可以核查",
					])}
					// Room for a forecast's three extra fields, so switching kinds doesn't resize.
					height={ticketHeight(
						questionFields({ ...shown, forecast: true }, locale).length,
						false,
					)}
				>
					{(width) => (
						<ContractTicket
							width={width}
							title={t(["Research question", "研究问题"])}
							fields={fields}
							shown={shown.filled}
							focus={focusAt[shown.filled]}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "question",
					label: t(["The question", "问题"]),
					value: t(question),
				},
				{
					id: "checkable",
					label: t(["Could someone check the answer?", "别人能核查答案吗？"]),
					value: complete ? t(["yes", "能"]) : t(["not yet", "还不能"]),
					note: complete
						? shown.forecast
							? t(["a forecast: needs held-out dates", "预测：需要样本外日期"])
							: t(["a description of what happened", "描述已发生的事"])
						: t([
								`${fields.length - shown.filled} fields missing`,
								`缺少 ${fields.length - shown.filled} 项`,
							]),
					tone: complete ? "gain" : undefined,
					evidence: complete ? undefined : "unknown",
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Kind of question", "问题类型"])}
						value={explore.forecast ? "forecast" : "describe"}
						options={[
							["describe", t(["What happened", "发生了什么"])],
							["forecast", t(["What will happen", "将会发生什么"])],
						]}
						onChange={(value) =>
							setExplore({
								forecast: value === "forecast",
								filled: value === "forecast" ? 9 : 6,
							})
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A reviewable question names its subject, universe, measure, time interval, the evidence it needs and what would make you revise the answer. A forecasting question also needs a measurable outcome, a horizon and a test on data you haven't looked at. 'Where's the action?' isn't wrong, just unanswerable until those are filled in.",
						"可审核的问题要写明对象、范围、测量量、时间区间、所需证据，以及什么情况会让你修订答案。预测性问题还需要可测量的结果、期限，以及在没看过的数据上检验。“哪里最活跃？”并没有错，只是在补全这些之前无法回答。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: sort what the answer rests on ———

type SortState = { reached: number };

function answerClaims(state: SortState, locale: Locale): Claim[] {
	const t = tr(locale);
	const rows: Claim[] = [
		{
			id: "observed",
			text: t([
				`${count(LEADER.volume ?? 0)} traded in the 110 call`,
				`110 看涨成交 ${count(LEADER.volume ?? 0)} 张`,
			]),
			basis: t(["consolidated tape, Monday", "综合成交记录，周一"]),
			evidence: "observed",
		},
		{
			id: "share",
			text: t([
				`${share(LEADER.volume ?? 0, COVERED)} of covered volume`,
				`占已覆盖成交量的 ${share(LEADER.volume ?? 0, COVERED)}`,
			]),
			basis: t([`540 ÷ ${count(COVERED)}`, `540 ÷ ${count(COVERED)}`]),
			evidence: "calculated",
		},
		{
			id: "reading",
			text: t(["Traders favor the 110 strike", "交易者偏好 110 行权价"]),
			basis: t(["a story laid over the numbers", "叠加在数字上的叙事"]),
			evidence: "inferred",
		},
		{
			id: "against",
			text: t([
				"500 of the 540 is one spread leg",
				"540 张中有 500 张是一条价差腿",
			]),
			basis: t([
				"condition code: multi-leg · cuts against it",
				"条件代码：多腿 · 与解读相矛盾",
			]),
			evidence: "observed",
		},
		{
			id: "gap",
			text: t(["The 120 call's volume", "120 看涨的成交量"]),
			basis: t(["not delivered: leader withheld", "未送达：暂不发布领先者"]),
			evidence: "unknown",
		},
	];
	return rows.map((row, i) => ({
		...row,
		hidden: i > state.reached,
		focus: i === state.reached,
	}));
}

function SortView({ locale, state }: { locale: Locale; state: SortState }) {
	const t = tr(locale);
	const claims = answerClaims(state, locale);
	const result: ResultItem[] = [
		{
			id: "answer",
			label: t(["Answer so far", "当前答案"]),
			value:
				state.reached >= 4
					? t([
							"110 call leads the covered series",
							"110 看涨在已覆盖序列中领先",
						])
					: t(["110 call leads", "110 看涨领先"]),
			note:
				state.reached >= 4
					? t([
							"4 of 5 series · full-chain leader withheld",
							"覆盖 5 个中的 4 个 · 暂不发布全链领先者",
						])
					: undefined,
			evidence: state.reached >= 4 ? "unknown" : "calculated",
		},
	];
	return (
		<SceneFrame
			stage={
				<ClaimLadderStage
					label={t([
						"Statements in the answer, each marked by the kind of evidence behind it",
						"答案中的陈述，每条都标注其证据类型",
					])}
					title={t([
						"Answer · Oct 18 calls · Monday volume",
						"答案 · 10月18日 看涨 · 周一成交量",
					])}
					claims={claims}
					evidenceLabels={evidenceLabels(locale)}
				/>
			}
			result={result}
			details={
				<p>
					{t([
						"Keep the layers apart: what the source says, what you calculated from it, how you read it, what cuts against that reading, and what you still don't know. A contradiction isn't a failure of the note; recording it is what makes the note reviewable.",
						"把各层分开：来源说了什么、你据此算出了什么、你如何解读、什么与解读相矛盾、还有什么不知道。矛盾不是笔记的失败；把它记下来，笔记才可审核。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: keep the record, revise or branch ———

type RecordState = { version: 1 | 2 | 3 };

const RECORD_ROW = 88;

function RecordStack({
	width,
	state,
	locale,
}: {
	width: number;
	state: RecordState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const records = [
		{
			id: "v1",
			title: t(["Record 1 · Mon 16:05", "记录 1 · 周一 16:05"]),
			question: t([
				"Oct 18 calls: volume by strike",
				"10月18日 看涨：各行权价成交量",
			]),
			answer: t([
				"110 leads what's covered · 120 missing",
				"110 在已覆盖中领先 · 缺 120",
			]),
			tag: t(["kept", "保留"]),
		},
		{
			id: "v2",
			title: t(["Record 1 · revised Tue 09:00", "记录 1 · 周二 09:00 修订"]),
			question: t(["same question, new evidence", "同一问题，新证据"]),
			answer: t([
				`120: 30 · 110 leads, ${share(540, WITH_LATE)} of ${count(WITH_LATE)}`,
				`120：30 · 110 领先，占 ${count(WITH_LATE)} 的 ${share(540, WITH_LATE)}`,
			]),
			tag: t(["revises 1", "修订 1"]),
		},
		{
			id: "v3",
			title: t(["Record 2 · Tue 10:00", "记录 2 · 周二 10:00"]),
			question: t(["Oct 18 puts: a new question", "10月18日 看跌：新问题"]),
			answer: t(["own universe, own answer", "独立范围，独立答案"]),
			tag: t(["new", "新建"]),
		},
	];
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t(["Research log", "研究日志"])}
			</Label>
			{records.map((record, i) => {
				const y = 26 + i * RECORD_ROW;
				const on = i < state.version;
				const current = i === state.version - 1;
				return (
					<m.g
						key={record.id}
						initial={false}
						animate={{ opacity: on ? 1 : 0 }}
						transition={motion.fade}
					>
						<rect
							x={8}
							y={y}
							width={width - 16}
							height={RECORD_ROW - 12}
							rx={12}
							className={current ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						<Label x={20} y={y + 22} tone={current ? "accent" : "muted"}>
							{record.title}
						</Label>
						{width < 520 ? null : (
							<Label x={width - 20} y={y + 22} anchor="end" tone="small">
								{record.tag}
							</Label>
						)}
						<Label x={20} y={y + 44}>
							{record.question}
						</Label>
						<Label x={20} y={y + 64} tone="small">
							{record.answer}
						</Label>
					</m.g>
				);
			})}
		</g>
	);
}

function RecordView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: RecordState;
	explore: RecordState | null;
	setExplore: (next: RecordState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] = [
		{
			id: "records",
			label: t(["Questions on file", "在册问题"]),
			value: shown.version >= 3 ? "2" : "1",
		},
		{
			id: "versions",
			label: t(["Versions of record 1", "记录 1 的版本"]),
			value: shown.version >= 2 ? "2" : "1",
			note: shown.version >= 2 ? t(["both kept", "两个都保留"]) : undefined,
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A research log where new evidence revises a record and a new population starts another",
						"研究日志：新证据修订原记录，新的范围另起一条记录",
					])}
					height={26 + 3 * RECORD_ROW}
				>
					{(width) => (
						<RecordStack width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Log through", "日志截至"])}
						value={String(explore.version) as "1" | "2" | "3"}
						options={[
							["1", t(["Mon", "周一"])],
							["2", t(["Tue 09:00", "周二 09:00"])],
							["3", t(["Tue 10:00", "周二 10:00"])],
						]}
						onChange={(value) =>
							setExplore({ version: Number(value) as RecordState["version"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"New evidence about the same population tests the same question: recompute and log a revision, keeping the earlier version. Changing the population, instrument or method after seeing a result creates a new question with its own record. Rewriting the old one to fit the interesting result erases the evidence of what you first asked.",
						"关于同一范围的新证据是在检验同一个问题：重新计算并记录一次修订，同时保留早先的版本。看到结果之后再改变范围、工具或方法，就是一个新问题，要有自己的记录。为了迎合有意思的结果而改写旧记录，会抹掉你最初所问的证据。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<QuestionState, QuestionState>({
		id: "question",
		label: ["Define the question", "定义问题"],
		title: ["A question someone else can check", "一个别人可以核查的问题"],
		predict: {
			prompt: [
				"Which of these can someone else check against the data?",
				"下面哪个问题别人可以对照数据核查？",
			],
			choices: [
				{
					id: "specific",
					label: [
						"Where did Monday's volume concentrate among ALFA's Oct 18 calls?",
						"周一 ALFA 10月18日 看涨的成交量集中在哪里？",
					],
				},
				{
					id: "vague",
					label: ["Where's the action in ALFA?", "ALFA 哪里最活跃？"],
				},
				{
					id: "forecast",
					label: ["Which ALFA option will rally?", "哪个 ALFA 期权会大涨？"],
				},
			],
			answer: "specific",
			revealAt: 3,
			explain: [
				"It names the subject, universe, measure and session, so anyone with the tape can reproduce the answer. The rally question could be tested too, but only with an outcome, a horizon and held-out dates.",
				"它写明了对象、范围、测量量和时段，任何拿到成交记录的人都能复现答案。大涨问题也能检验，但需要结果、期限和样本外日期。",
			],
		},
		beats: [
			{
				id: "vague",
				label: ["Vague", "模糊"],
				caption: [
					"'Where's the action in ALFA?' No one can check an answer to that: which options, what measure, when?",
					"“ALFA 哪里最活跃？”没有人能核查这个问题的答案：哪些期权、什么测量量、什么时候？",
				],
				state: { filled: 0, forecast: false },
			},
			{
				id: "scope",
				label: ["Subject and universe", "对象与范围"],
				caption: [
					"Name the subject and the universe: ALFA's Oct 18 calls, strikes 100 to 120. Now we know which rows count.",
					"写明对象与范围：ALFA 10月18日 看涨，行权价 100 到 120。现在知道哪些行要算进来。",
				],
				state: { filled: 2, forecast: false },
			},
			{
				id: "measure",
				label: ["Measure and time", "测量量与时间"],
				caption: [
					"Name the measure and the interval: corrected contract volume over Monday's full session.",
					"写明测量量与区间：周一全天按更正后统计的成交张数。",
				],
				state: { filled: 4, forecast: false },
			},
			{
				id: "rules",
				label: ["Evidence and revision", "证据与修订"],
				caption: [
					"Say what evidence it needs and when you'd revise: all five series covered; a gap gives a bound, a correction a recompute.",
					"说明需要什么证据、何时修订：全部五个序列都要覆盖；有缺口就给下限，有更正就重算。",
				],
				state: { filled: 6, forecast: false },
			},
		],
		explore: {
			prompt: [
				"Switch to a forecasting question and see what it adds.",
				"切换为预测性问题，看看需要补充什么。",
			],
			start: () => ({ filled: 9, forecast: true }),
			task: {
				kind: "answer",
				prompt: [
					"What does the forecasting version need that the descriptive one doesn't?",
					"预测型问题需要哪些描述型问题不需要的东西？",
				],
				choices: [
					{
						id: "test",
						label: [
							"An outcome, a horizon and unseen dates to test on",
							"结果、时间跨度和未看过的检验日期",
						],
					},
					{ id: "rows", label: ["More rows of data", "更多数据行"] },
					{
						id: "names",
						label: ["A wider universe of names", "更大的标的范围"],
					},
				],
				answer: "test",
				done: [
					"A forecast can be checked only against what happened next: name the outcome, the horizon, and dates you haven't looked at. Without them, nobody can tell it was right or wrong.",
					"预测只能拿之后发生的事来检验：要说明结果、时间跨度，以及你没看过的日期。缺少这些，就没人能判断它是对是错。",
				],
			},
		},
		View: QuestionView,
	}),
	defineScene<SortState, SortState>({
		id: "sort",
		label: ["Sort the evidence", "区分证据"],
		title: ["A source fact is different from a story", "来源事实不同于叙事"],
		predict: {
			prompt: [
				"The 110 call traded 540 of the 1,065 covered contracts, and the 120 call's figure hasn't arrived. Can you name the 110 the chain's leader?",
				"110 看涨成交 540 张，占已覆盖 1,065 张中的一大部分，而 120 看涨的数据还没到。能说 110 是整条链的领先者吗？",
			],
			choices: [
				{
					id: "not-yet",
					label: ["Not for the full chain yet", "暂时不能说是全链"],
				},
				{ id: "yes", label: ["Yes: it has the most", "能：它最多"] },
				{
					id: "favor",
					label: ["Yes, and traders favor it", "能，而且交易者偏好它"],
				},
			],
			answer: "not-yet",
			revealAt: 4,
			explain: [
				"It leads the covered series, but the revision rule says a missing series withholds the full-chain leader. And 500 of its 540 is one spread leg, which weakens any 'traders favor it' story.",
				"它在已覆盖序列中领先，但修订规则规定：缺一个序列就暂不发布全链领先者。而且 540 张中有 500 张是一条价差腿，这削弱了“交易者偏好它”的说法。",
			],
		},
		beats: [
			{
				id: "observed",
				label: ["Observation", "观测"],
				caption: [
					"The tape shows 540 contracts in the Oct 18 110 call on Monday. That's an observation.",
					"成交记录显示周一 10月18日 110 看涨成交 540 张。这是观测。",
				],
				state: { reached: 0 },
			},
			{
				id: "calculated",
				label: ["Calculation", "计算"],
				caption: [
					"Divided by the 1,065 covered contracts, it's 51% of the volume. That's a calculation you can redo.",
					"除以已覆盖的 1,065 张，它占成交量的 51%。这是可以复算的计算。",
				],
				state: { reached: 1 },
			},
			{
				id: "reading",
				label: ["Interpretation", "解读"],
				caption: [
					"'Traders favor the 110 strike' is an interpretation laid over those numbers, not something the tape says.",
					"“交易者偏好 110 行权价”是叠加在数字之上的解读，而不是成交记录本身说的。",
				],
				state: { reached: 2 },
			},
			{
				id: "against",
				label: ["Contradiction", "反证"],
				caption: [
					"Against it: 500 of the 540 was one leg of a single spread. Record what cuts against your reading, too.",
					"与之相矛盾的是：540 张中有 500 张是同一笔价差的一条腿。与解读相矛盾的内容也要记录。",
				],
				state: { reached: 3 },
			},
			{
				id: "gap",
				label: ["Unknown", "未知"],
				caption: [
					"And the 120 call's volume hasn't arrived. By the revision rule, the full-chain leader waits.",
					"而且 120 看涨的成交量还没到。按修订规则，全链领先者暂不发布。",
				],
				state: { reached: 4 },
			},
		],
		explore: {
			prompt: ["Read the sorted evidence once more.", "再读一遍分好类的证据。"],
			start: (last) => last,
			task: {
				kind: "answer",
				prompt: [
					"Which of these is an interpretation, not an observation or a calculation?",
					"以下哪一项是解读，而不是观测或计算？",
				],
				choices: [
					{
						id: "story",
						label: ["Traders favor the 110 strike", "交易者青睐 110 行权价"],
					},
					{
						id: "seen",
						label: ["540 traded in the 110 call", "110 看涨成交了 540 张"],
					},
					{
						id: "share",
						label: ["51% of covered volume", "占已覆盖成交量的 51%"],
					},
				],
				answer: "story",
				done: [
					"540 is on the tape and 51% is arithmetic anyone can redo. 'Traders favor it' is a story laid over them, and 500 of the 540 being one spread leg cuts against it.",
					"540 张在成交记录里，51% 是任何人都能重算的。“交易者青睐”是叠加在数字上的说法，而 540 张中有 500 张是同一价差的一条腿，这正好与之相悖。",
				],
			},
		},
		View: SortView,
	}),
	defineScene<RecordState, RecordState>({
		id: "record",
		label: ["Keep the record", "保留记录"],
		title: [
			"Revise the same question; start a new one on purpose",
			"同一问题就修订，新问题就另起",
		],
		predict: {
			prompt: [
				"After seeing the call results, you want to study puts instead. What happens to the call record?",
				"看到看涨的结果之后，你想改研究看跌。看涨的记录怎么处理？",
			],
			choices: [
				{
					id: "keep",
					label: ["Keep it; puts get a new record", "保留它；看跌另建记录"],
				},
				{ id: "edit", label: ["Edit it to cover puts", "改写它来涵盖看跌"] },
				{ id: "delete", label: ["Delete it", "删除它"] },
			],
			answer: "keep",
			revealAt: 2,
			explain: [
				"Switching from calls to puts changes the population, so it's a new question. The call record, and its revision, stay as they were.",
				"从看涨换成看跌改变了范围，所以是一个新问题。看涨记录及其修订都保持原样。",
			],
		},
		beats: [
			{
				id: "v1",
				label: ["The record", "记录"],
				caption: [
					"Monday 16:05: the note records the question, the covered answer and the missing 120 call.",
					"周一 16:05：笔记记下问题、基于已覆盖数据的答案，以及缺失的 120 看涨。",
				],
				state: { version: 1 },
			},
			{
				id: "v2",
				label: ["A revision", "修订"],
				caption: [
					"Tuesday 09:00 the 120 call's 30 contracts arrive. Same question, new evidence: recompute and log a revision, keeping the first version.",
					"周二 09:00，120 看涨的 30 张数据到达。同一问题，新证据：重算并记录一次修订，保留第一版。",
				],
				state: { version: 2 },
			},
			{
				id: "v3",
				label: ["A new question", "新问题"],
				caption: [
					"Studying puts next is a different population, so it opens record 2. Record 1 stays exactly as it was.",
					"接着研究看跌是不同的范围，所以另开记录 2。记录 1 保持原样。",
				],
				state: { version: 3 },
			},
		],
		explore: {
			prompt: ["Step through the log.", "逐步查看研究日志。"],
			start: () => ({ version: 3 }),
			task: {
				kind: "answer",
				prompt: [
					"Which change opened a new record instead of revising the first?",
					"哪项变化开了一条新记录，而不是修订第一条？",
				],
				choices: [
					{ id: "puts", label: ["Studying the puts", "改为研究看跌期权"] },
					{
						id: "late",
						label: ["The 120 call's late data", "120 看涨迟到的数据"],
					},
					{ id: "leader", label: ["Recomputing the leader", "重新计算领先者"] },
				],
				answer: "puts",
				done: [
					"New evidence for the same question is a revision: recompute and keep both versions. Puts are a different population, so they get record 2 and record 1 stays as it was.",
					"同一问题有了新证据就是修订：重算，并保留两个版本。看跌期权是不同的总体，所以是第 2 条记录，第 1 条保持原样。",
				],
			},
		},
		View: RecordView,
	}),
] as const;

export function AuditedBoundaryWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="audited-boundary"
			label={["Interactive lesson on research questions", "研究问题互动课"]}
			scenes={scenes}
		/>
	);
}
