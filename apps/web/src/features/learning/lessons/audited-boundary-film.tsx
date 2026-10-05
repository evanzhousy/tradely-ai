import { type Copy, count, pick } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import type { Film, FilmContext } from "../walkthrough/film";
import {
	Backdrop,
	createDirector,
	EndCard,
	filmFrame,
	Lines,
	lineCount,
	TitleCard,
	Word,
} from "../walkthrough/film-kit";
import {
	COVERED,
	LATE,
	LEADER,
	SERIES,
	SPREAD_LEG,
	share,
	WITH_LATE,
} from "./audited-boundary-model";

/*
 * Research questions, as a film. "Where's the action in ALFA?" Nobody can check an answer
 * to that. The question gets a subject, a universe, a measure, an interval, the evidence
 * it needs and a rule for revising it. Then its answer, claim by claim: 540 observed, 51%
 * calculated, "traders favor 110" an interpretation, the spread leg that cuts against it,
 * and the 120 call's missing volume that holds the leader back. Last, the log: Tuesday's
 * data revises record 1; a switch to puts opens record 2.
 *
 *   open      0–4      "Research questions"
 *   question  4–9.5    "Where's the action in ALFA?" Checkable?
 *   frame     9.5–19.5 subject, universe; measure, interval; evidence, revision
 *   answer    19.5–30  five strikes; observed; calculated; interpretation; against; gap
 *   log       30–37    record 1; revised Tuesday; record 2 for puts
 *   claim     37–39.5  a question someone else can check
 *   next      39.5–42  Next: comparison groups
 */

const END = 42;
const MAX = 560;
const LEAD = LEADER.volume ?? 0;
type Evidence = "observed" | "calculated" | "interpretation" | "unknown";
const tone: Record<Evidence, string> = {
	observed: "wt-film-gain",
	calculated: "wt-film-gain",
	interpretation: "wt-film-warn",
	unknown: "wt-film-dim",
};

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const labelW = narrow ? 44 : 60;
	return {
		...frame,
		fieldY: (i: number) =>
			H * (narrow ? 0.26 : 0.27) + i * H * (narrow ? 0.095 : 0.095),
		fieldH: H * (narrow ? 0.078 : 0.08),
		labelW: narrow ? room * 0.36 : room * 0.24,
		barRowY: (i: number) =>
			H * (narrow ? 0.26 : 0.3) + i * H * (narrow ? 0.055 : 0.06),
		barH: H * (narrow ? 0.036 : 0.04),
		barX: margin + labelW,
		barMax: (narrow ? room : room * 0.46) - labelW - (narrow ? 50 : 60),
		claimX: narrow ? margin : margin + room * 0.5,
		claimW: narrow ? room : room * 0.5,
		claimY: (i: number) =>
			narrow ? H * 0.58 + i * H * 0.062 : H * 0.3 + i * H * 0.085,
		claimH: H * (narrow ? 0.052 : 0.068),
		recY: (i: number) =>
			H * (narrow ? 0.27 : 0.27) + i * H * (narrow ? 0.19 : 0.19),
		recH: H * (narrow ? 0.16 : 0.16),
	};
}

const fields: { id: string; label: Copy; value: Copy }[] = [
	{
		id: "subject",
		label: ["subject", "对象"],
		value: ["ALFA option activity", "ALFA 期权活动"],
	},
	{
		id: "universe",
		label: ["universe", "范围"],
		value: ["Oct 18 calls, 100–120", "10月18日 看涨，100–120"],
	},
	{
		id: "measure",
		label: ["measure", "测量量"],
		value: ["contracts, corrected", "张数，按更正后"],
	},
	{
		id: "interval",
		label: ["interval", "区间"],
		value: ["Mon Sep 16, full session", "9月16日 周一，全天"],
	},
	{
		id: "evidence",
		label: ["evidence", "证据"],
		value: ["tape + all 5 series", "成交记录 + 全部 5 个序列"],
	},
	{
		id: "revision",
		label: ["revision", "修订规则"],
		value: ["gap → bound · fix → redo", "有缺口 → 给下限 · 有更正 → 重算"],
	},
];

const claims: { text: Copy; short: Copy; evidence: Evidence }[] = [
	{
		text: [
			`${count(LEAD)} traded in the 110 call`,
			`110 看涨成交 ${count(LEAD)} 张`,
		],
		short: [`110: ${count(LEAD)} traded`, `110：成交 ${count(LEAD)} 张`],
		evidence: "observed",
	},
	{
		text: [
			`${share(LEAD, COVERED)} of covered volume`,
			`占已覆盖成交量的 ${share(LEAD, COVERED)}`,
		],
		short: [
			`${share(LEAD, COVERED)} of ${count(COVERED)}`,
			`${count(COVERED)} 的 ${share(LEAD, COVERED)}`,
		],
		evidence: "calculated",
	},
	{
		text: ["Traders favor the 110 strike", "交易者偏好 110 行权价"],
		short: ["Traders favor 110", "交易者偏好 110"],
		evidence: "interpretation",
	},
	{
		text: [
			`${count(SPREAD_LEG)} of the ${count(LEAD)} is one spread leg`,
			`${count(LEAD)} 张中有 ${count(SPREAD_LEG)} 张是一条价差腿`,
		],
		short: [
			`${count(SPREAD_LEG)} is one spread leg`,
			`${count(SPREAD_LEG)} 张是价差腿`,
		],
		evidence: "observed",
	},
	{
		text: ["The 120 call's volume", "120 看涨的成交量"],
		short: ["120 call's volume", "120 看涨成交量"],
		evidence: "unknown",
	},
];

const records: { title: Copy; question: Copy; answer: Copy; tag: Copy }[] = [
	{
		title: ["record 1 · Mon 16:05", "记录 1 · 周一 16:05"],
		question: [
			"Oct 18 calls: volume by strike",
			"10月18日 看涨：各行权价成交量",
		],
		answer: [
			"110 leads what's covered · 120 missing",
			"110 在已覆盖中领先 · 缺 120",
		],
		tag: ["kept", "保留"],
	},
	{
		title: ["record 1 · Tue 09:00", "记录 1 · 周二 09:00 修订"],
		question: ["same question, new evidence", "同一问题，新证据"],
		answer: [
			`120: ${LATE} · 110 leads, ${share(LEAD, WITH_LATE)} of ${count(WITH_LATE)}`,
			`120：${LATE} · 110 领先，占 ${count(WITH_LATE)} 的 ${share(LEAD, WITH_LATE)}`,
		],
		tag: ["revises 1", "修订 1"],
	},
	{
		title: ["record 2 · Tue 10:00", "记录 2 · 周二 10:00"],
		question: ["Oct 18 puts: a new question", "10月18日 看跌：新问题"],
		answer: ["own universe, own answer", "独立范围，独立答案"],
		tag: ["new", "新建"],
	},
];

const copy = {
	title: ["Research questions", "研究问题"],
	titleSub: ["what evidence can answer", "证据能回答什么"],
	qTag: ["a research question", "一个研究问题"],
	qLine: ["“Where's the action in ALFA?”", "“ALFA 的热点在哪？”"],
	qBig: ["Can anyone check the answer?", "答案有人能核对吗？"],
	f0: [
		"Name the subject and the universe: which rows count.",
		"说清对象和范围：哪些行算数。",
	],
	f0Short: ["Subject, universe.", "对象、范围。"],
	f1: [
		"Name the measure and the interval: what is counted, and over when.",
		"说清测量量和区间：数什么、在哪段时间。",
	],
	f1Short: ["Measure, interval.", "测量量、区间。"],
	f2: [
		"Say what evidence it needs, and when you'd revise the answer.",
		"说清需要什么证据，以及何时修订答案。",
	],
	f2Short: ["Evidence, revision.", "证据、修订。"],
	a0: [
		`Monday's Oct 18 calls: four strikes covered, one not yet delivered.`,
		"周一的 10月18日 看涨：四个行权价已覆盖，一个尚未送达。",
	],
	a0Short: ["Four covered, one missing.", "覆盖四个，缺一个。"],
	a1: [
		`The tape shows ${count(LEAD)}; divided by ${count(COVERED)}, that's ${share(LEAD, COVERED)}.`,
		`成交记录显示 ${count(LEAD)}；除以 ${count(COVERED)}，为 ${share(LEAD, COVERED)}。`,
	],
	a1Short: ["Observed, calculated.", "观测、计算。"],
	a2: [
		"“Traders favor 110” is a story laid over those numbers.",
		"“交易者偏好 110”是叠加在数字上的叙事。",
	],
	a2Short: ["A story, not a fact.", "叙事，不是事实。"],
	a3: [
		`Against it: ${count(SPREAD_LEG)} is one spread leg. And with 120 missing, the leader waits.`,
		`与之相反：${count(LEAD)} 张中有 ${count(SPREAD_LEG)} 张是一条价差腿。120 也还缺着，所以领先者要等。`,
	],
	a3Short: ["Against it; and a gap.", "反证；还有缺口。"],
	missing: ["not delivered", "未送达"],
	observed: ["observed", "观测"],
	calculated: ["calculated", "计算"],
	interpretation: ["interpretation", "解读"],
	unknown: ["unknown", "未知"],
	g0: [
		"Monday 16:05: the record keeps the question, the covered answer and the gap.",
		"周一 16:05：记录保存问题、已覆盖的答案和缺口。",
	],
	g0Short: ["Record 1.", "记录 1。"],
	g1: [
		`Tuesday the 120 call's ${LATE} arrive: same question, a revision. The first version stays.`,
		`周二 120 看涨的 ${LATE} 张到了：同一问题，一次修订。第一版保留。`,
	],
	g1Short: ["Same question: revise.", "同一问题：修订。"],
	g2: [
		"Puts next is a different population: record 2. Record 1 stays as it was.",
		"接下来研究看跌是不同的总体：记录 2。记录 1 保持原样。",
	],
	g2Short: ["New question: new record.", "新问题：新记录。"],
	claimBig: [
		"Ask a question someone else can check.",
		"提一个别人能核对的问题。",
	],
	claimSub: [
		"Name what counts, label each claim by its evidence, keep the gaps, and revise in the open.",
		"说清什么算数，按证据给每个结论贴标签，保留缺口，公开修订。",
	],
	nextBig: ["Next: comparison groups", "下一课：比较范围"],
	nextSub: ["who belongs and who is missing", "谁该纳入，谁缺失"],
} as const satisfies Record<string, Copy>;

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
	const { height: H, type: T, room, narrow, margin } = L;
	const W = width;
	const headline = (name: string, text: Copy, short: Copy) => (
		<Lines
			name={name}
			text={t(narrow ? short : text)}
			x={margin}
			y={L.headY}
			size={T.head}
			maxWidth={narrow ? room : room * 0.74}
			anchor="start"
		/>
	);
	const text = narrow ? T.small * 1.1 : T.body;
	return (
		<>
			<Backdrop frame={L} />

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				<Word
					name="q-tag"
					x={W / 2}
					y={H * 0.32}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.qTag).toUpperCase()}
				</Word>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.44}
					size={T.title * 0.9}
					maxWidth={room}
					className="wt-film-type wt-film-accent"
				/>
				<Lines
					name="q-big"
					text={t(copy.qBig)}
					x={W / 2}
					y={H * 0.64}
					size={T.head}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>

			{/* The question, field by field. */}
			{headline("f0", copy.f0, copy.f0Short)}
			{headline("f1", copy.f1, copy.f1Short)}
			{headline("f2", copy.f2, copy.f2Short)}
			{fields.map((field, i) => (
				<g key={field.id} data-f={`field-${i}`}>
					<rect
						x={margin}
						y={L.fieldY(i)}
						width={room}
						height={L.fieldH}
						rx={10}
						className="wt-focus-shape"
					/>
					<text
						x={margin + 14}
						y={L.fieldY(i) + L.fieldH / 2 + T.small * 0.38}
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(field.label).toUpperCase()}
					</text>
					<text
						x={margin + L.labelW}
						y={L.fieldY(i) + L.fieldH / 2 + text * 0.36}
						className="wt-film-type"
						style={{ fontSize: text }}
					>
						{t(field.value)}
					</text>
				</g>
			))}

			{/* The answer, claim by claim. */}
			{headline("a0", copy.a0, copy.a0Short)}
			{headline("a1", copy.a1, copy.a1Short)}
			{headline("a2", copy.a2, copy.a2Short)}
			{headline("a3", copy.a3, copy.a3Short)}
			{SERIES.map((row, i) => (
				<g key={row.strike} data-f={`strike-${i}`}>
					<text
						x={margin}
						y={L.barRowY(i) + L.barH / 2 + text * 0.36}
						className="wt-film-num"
						style={{ fontSize: text }}
					>
						{row.strike}
					</text>
					{row.volume === null ? (
						<>
							<rect
								x={L.barX}
								y={L.barRowY(i)}
								width={L.barMax * 0.3}
								height={L.barH}
								rx={3}
								className="wt-film-ghost"
							/>
							<text
								x={L.barX + L.barMax * 0.3 + 8}
								y={L.barRowY(i) + L.barH / 2 + T.small * 0.38}
								className="wt-film-tag wt-film-loss"
								style={{ fontSize: T.small }}
							>
								{t(copy.missing).toUpperCase()}
							</text>
						</>
					) : (
						<>
							<rect
								x={L.barX}
								y={L.barRowY(i)}
								width={Math.max(2, (row.volume / MAX) * L.barMax)}
								height={L.barH}
								rx={3}
								className="wt-film-bar"
								data-tone={row === LEADER ? "total" : "neutral"}
							/>
							<text
								x={L.barX + Math.max(2, (row.volume / MAX) * L.barMax) + 8}
								y={L.barRowY(i) + L.barH / 2 + text * 0.36}
								className="wt-film-num"
								style={{ fontSize: text }}
							>
								{count(row.volume)}
							</text>
						</>
					)}
				</g>
			))}
			{claims.map((claim, i) => (
				<g key={t(claim.text)} data-f={`claim-${i}`}>
					<rect
						x={L.claimX}
						y={L.claimY(i)}
						width={L.claimW}
						height={L.claimH}
						rx={9}
						className={
							claim.evidence === "unknown" ? "wt-panel-shape" : "wt-focus-shape"
						}
					/>
					<text
						x={L.claimX + 12}
						y={L.claimY(i) + L.claimH / 2 + text * 0.36}
						className={`wt-film-type ${claim.evidence === "unknown" ? "wt-film-dim" : ""}`}
						style={{ fontSize: text }}
					>
						{t(narrow ? claim.short : claim.text)}
					</text>
					<text
						x={L.claimX + L.claimW - 12}
						y={L.claimY(i) + L.claimH / 2 + T.small * 0.36}
						textAnchor="end"
						className={`wt-film-tag ${tone[claim.evidence]}`}
						style={{ fontSize: T.small * 0.95 }}
					>
						{t(copy[claim.evidence]).toUpperCase()}
					</text>
				</g>
			))}

			{/* The log. */}
			{headline("g0", copy.g0, copy.g0Short)}
			{headline("g1", copy.g1, copy.g1Short)}
			{headline("g2", copy.g2, copy.g2Short)}
			{records.map((record, i) => (
				<g key={t(record.title)} data-f={`rec-${i}`}>
					<rect
						data-f={`rec-${i}-box`}
						x={margin}
						y={L.recY(i)}
						width={room}
						height={L.recH}
						rx={12}
						className="wt-panel-shape"
					/>
					<text
						x={margin + 16}
						y={L.recY(i) + L.recH * 0.26}
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(record.title).toUpperCase()}
					</text>
					<text
						x={margin + room - 16}
						y={L.recY(i) + L.recH * 0.26}
						textAnchor="end"
						className="wt-film-tag wt-film-accent"
						style={{ fontSize: T.small }}
					>
						{t(record.tag).toUpperCase()}
					</text>
					<text
						x={margin + 16}
						y={L.recY(i) + L.recH * 0.56}
						className="wt-film-type"
						style={{ fontSize: narrow ? T.body : T.head * 0.9 }}
					>
						{t(record.question)}
					</text>
					<text
						x={margin + 16}
						y={L.recY(i) + L.recH * 0.82}
						className="wt-film-num wt-film-dim"
						style={{ fontSize: T.small * 1.05 }}
					>
						{t(record.answer)}
					</text>
				</g>
			))}

			<g data-f="claim">
				<Lines
					name="z-big"
					text={t(copy.claimBig)}
					x={W / 2}
					y={H * 0.42}
					size={T.title}
					maxWidth={room}
				/>
				<Lines
					name="z-sub"
					text={t(copy.claimSub)}
					x={W / 2}
					y={
						H * 0.42 +
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
	const d = createDirector(context, L, END);
	const { tl, one, kids, show, hide } = d;
	const flat = (name: string) =>
		kids(name).flatMap((el) =>
			el.tagName === "g" && !el.hasAttribute("data-f")
				? [...el.children]
				: [el],
		);
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
			time,
		);
	const heads = [
		"f0",
		"f1",
		"f2",
		"a0",
		"a1",
		"a2",
		"a3",
		"g0",
		"g1",
		"g2",
	].map((name) => one(name));
	const fieldRows = fields.map((_, i) => one(`field-${i}`));
	const strikes = SERIES.map((_, i) => one(`strike-${i}`));
	const claimRows = claims.map((_, i) => one(`claim-${i}`));
	const recs = records.map((_, i) => one(`rec-${i}`));

	d.hidden([
		...flat("q"),
		...heads,
		...fieldRows,
		...strikes,
		...claimRows,
		...recs,
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: a vague one ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	word(one("q-line"), 5.1);
	show(one("q-big"), 6.6);

	// ——— frame: field by field ———
	tl.addLabel("frame", 9.5);
	hide(flat("q"), 9.5);
	show(heads[0], 9.7, "above");
	show(fieldRows[0], 10.0, "right");
	show(fieldRows[1], 10.4, "right");
	d.swap(heads[0], heads[1], 12.6);
	show(fieldRows[2], 13.0, "right");
	show(fieldRows[3], 13.4, "right");
	d.swap(heads[1], heads[2], 15.6);
	show(fieldRows[4], 16.0, "right");
	show(fieldRows[5], 16.4, "right");

	// ——— answer: claim by claim ———
	tl.addLabel("answer", 19.5);
	hide([heads[2], ...fieldRows], 19.5);
	show(heads[3], 19.7, "above");
	strikes.forEach((row, i) => {
		show(row, 20.0 + i * 0.15, "right");
	});
	d.swap(heads[3], heads[4], 21.8);
	show(claimRows[0], 22.2, "right");
	show(claimRows[1], 22.8, "right");
	d.swap(heads[4], heads[5], 24.6);
	show(claimRows[2], 25.0, "right");
	d.swap(heads[5], heads[6], 26.8);
	show(claimRows[3], 27.2, "right");
	show(claimRows[4], 27.8, "right");

	// ——— log: revise, or start anew ———
	tl.addLabel("log", 30);
	hide([heads[6], ...strikes, ...claimRows], 30.0);
	show(heads[7], 30.2, "above");
	show(recs[0], 30.5, "right");
	d.swap(heads[7], heads[8], 32.2);
	show(recs[1], 32.6, "right");
	tl.set(one("rec-1-box"), { attr: { class: "wt-focus-shape" } }, 32.6);
	d.swap(heads[8], heads[9], 34.4);
	show(recs[2], 34.8, "right");
	tl.set(one("rec-1-box"), { attr: { class: "wt-panel-shape" } }, 34.8);
	tl.set(one("rec-2-box"), { attr: { class: "wt-focus-shape" } }, 34.8);

	// ——— claim ———
	tl.addLabel("claim", 37);
	hide([heads[9], ...recs], 37.0);
	word(one("z-big"), 37.3);
	show(one("z-sub"), 37.7);

	// ——— next ———
	tl.addLabel("next", 39.5);
	hide(kids("claim"), 39.5);
	d.close(39.5);
	return tl;
}

export const auditedBoundaryFilm: Film = {
	id: "audited-boundary",
	label: [
		`Research questions, as a short film: "Where's the action in ALFA?" turned into a question someone else can check, with a subject, a universe of Oct 18 calls from 100 to 120, corrected contract volume over Monday's session, the evidence it needs and a revision rule; its answer labelled claim by claim, ${count(LEAD)} observed in the 110 call, ${share(LEAD, COVERED)} of ${count(COVERED)} calculated, "traders favor 110" an interpretation, ${count(SPREAD_LEG)} of it one spread leg, and the 120 call's volume unknown; and a research log where Tuesday's ${LATE} contracts revise record 1 and a switch to puts opens record 2`,
		`研究问题短片：把“ALFA 的热点在哪？”变成别人能核对的问题：对象、10月18日 100 到 120 的看涨范围、周一全天按更正后的张数、所需证据和修订规则；它的答案逐条贴上证据标签：110 看涨观测到 ${count(LEAD)} 张，占 ${count(COVERED)} 的 ${share(LEAD, COVERED)} 是计算，“交易者偏好 110”是解读，其中 ${count(SPREAD_LEG)} 张是一条价差腿，120 看涨的成交量未知；以及一份研究日志：周二到达的 ${LATE} 张修订记录 1，改研究看跌则新建记录 2`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Research questions", "研究问题"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "frame", label: ["Frame it", "定义问题"] },
		{ id: "answer", label: ["The answer", "答案"] },
		{ id: "log", label: ["The log", "日志"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
