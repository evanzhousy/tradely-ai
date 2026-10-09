import { gsap } from "gsap";
import { useId } from "react";
import { type Copy, count, pick } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import type { Film, FilmContext } from "../walkthrough/film";
import {
	Backdrop,
	Brackets,
	createDirector,
	EndCard,
	filmFrame,
	Hatch,
	Lines,
	lineCount,
	TitleCard,
	Word,
} from "../walkthrough/film-kit";
import { textWidth } from "../walkthrough/text-measure";
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
 * it needs and a rule for revising it. The hero is its answer, claim by claim, each
 * stamped with its evidence: 540 observed, 51% calculated, and "traders favor 110", an
 * interpretation; then the 110 bar splits, 500 of it one spread leg, the interpretation is
 * struck through and glowing brackets lock on it; after the lock, the 120 call's volume
 * stays unknown. Last, the log: Tuesday's 30 contracts for the 120 call come in and revise
 * record 1 in place; a switch to puts opens record 2.
 *
 *   open      0–4        "Research questions"
 *   question  4–8.6      "Where’s the action in ALFA?" Checkable?
 *   frame     8.6–17.6   subject, universe; measure, interval; evidence, revision
 *   answer    17.6–31.2  hero: five strikes; observed; calculated; interpretation; the
 *                        split, labelled and connected; struck through; locked; then the gap
 *   log       31.2–41.0  record 1; Tuesday's 120 call builds 1,065 + 30 = 1,095, then
 *                        ≤ 51% → 540 ÷ 1,095 ≈ 49%; read the revision, then calls → puts
 *                        opens record 2 and clears the calls proof
 *   claim     41.0–45.3  a question someone else can check
 *   next      45.3–47.0  Next: comparison groups
 */

const END = 47;
const MAX = 560;
/** The claim cards: the interpretation, and the observed spread leg that undercuts it. */
const STORY_CARD = 2;
const SPREAD_CARD = 3;
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
			H * (narrow ? 0.26 : 0.3) +
			i * H * (narrow ? 0.055 : 0.06) +
			// Reserve a label line beneath the 110 segment, before the two lower strikes.
			(i > SERIES.indexOf(LEADER) ? frame.type.body * 1.4 : 0),
		barH: H * (narrow ? 0.036 : 0.04),
		barX: margin + labelW,
		barMax: (narrow ? room : room * 0.46) - labelW - (narrow ? 50 : 60),
		claimX: narrow ? margin : margin + room * 0.5,
		claimW: narrow ? room : room * 0.5,
		claimY: (i: number) =>
			narrow ? H * 0.58 + i * H * 0.072 : H * 0.28 + i * H * 0.095,
		claimH: H * (narrow ? 0.048 : 0.068),
		recY: (i: number) => H * 0.27 + i * H * (narrow ? 0.27 : 0.23),
		recH: (i: number) => H * (narrow ? (i === 0 ? 0.22 : 0.16) : 0.2),
		answerSize: narrow ? frame.type.body * 1.1 : frame.type.head * 0.85,
		lateY: H * (narrow ? 0.49 : 0.47) + frame.type.body * 1.8,
		proofSize: narrow ? frame.type.head : frame.type.num,
		proofY: (i: number) => H * (narrow ? 0.73 : 0.78) + i * H * 0.08,
		universeY: (i: number) => H * (narrow ? 0.77 : 0.78) + i * H * 0.08,
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
		value: ["gap → bound · fix → redo", "有缺口 → 给界限 · 有更正 → 重算"],
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
			`${share(LEAD, COVERED)} of the ${count(COVERED)} covered`,
			`占已覆盖 ${count(COVERED)} 张的 ${share(LEAD, COVERED)}`,
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
		text: ["120 call volume", "120 看涨的成交量"],
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
			`110 leads what's covered · ≤ ${share(LEAD, COVERED)} of all`,
			`110 在已覆盖中领先 · 占全部 ≤ ${share(LEAD, COVERED)}`,
		],
		tag: ["kept", "保留"],
	},
	{
		title: ["record 2 · Tue 10:00", "记录 2 · 周二 10:00"],
		question: ["Oct 18 puts: a new question", "10月18日 看跌：新问题"],
		answer: ["own universe, own answer", "独立范围，独立答案"],
		tag: ["new", "新建"],
	},
];

/** Record 1, once Tuesday's data is in: its title, answer and tag turn over in place. */
/** The saved series label stays separate from its continuously carried mono digits. */
const LATE_PREFIX: Copy = ["120:", "120："];
const revised = {
	title: ["record 1 · Tue 09:00", "记录 1 · 周二 09:00"],
	shortAnswer: [
		`110 leads · ${share(LEAD, WITH_LATE)} of ${count(WITH_LATE)}`,
		`110 领先 · 占 ${count(WITH_LATE)} 的 ${share(LEAD, WITH_LATE)}`,
	],
	answer: [
		` · 110 leads, ${share(LEAD, WITH_LATE)} of ${count(WITH_LATE)}`,
		` · 110 领先，占 ${count(WITH_LATE)} 的 ${share(LEAD, WITH_LATE)}`,
	],
	tag: ["revised", "已修订"],
} as const satisfies Record<string, Copy>;

const copy = {
	title: ["Research questions", "研究问题"],
	titleSub: ["what evidence can answer", "证据能回答什么"],
	qTag: ["a research question", "一个研究问题"],
	qLine: ["“Where’s the action in ALFA?”", "「ALFA 的热点在哪?」"],
	qBig: ["Can anyone check the answer?", "答案有人能核对吗？"],
	lateDay: ["late · Tue 09:00", "迟到 · 周二 09:00"],
	proofScope: ["record 1 · Oct 18 calls", "记录 1 · 10月18日 看涨"],
	calls: ["calls", "看涨"],
	puts: ["puts", "看跌"],
	keptRecord: ["record 1 · kept", "记录 1 · 保留"],
	newRecord: ["record 2 · new", "记录 2 · 新建"],
	spreadLabel: [
		`${count(SPREAD_LEG)} · one spread leg`,
		`${count(SPREAD_LEG)} · 一条价差腿`,
	],
	fHead: ["Frame it so someone can check it.", "把问题框定到别人能核对。"],
	aHead: ["Then tag each claim by its evidence.", "再按证据给每个结论贴标签。"],
	a2Head: [
		"“Favor 110” is a story, not a fact.",
		"“偏好 110”是叙事，不是事实。",
	],
	missing: ["not delivered", "未送达"],
	spreadLeg: ["one spread leg", "一条价差腿"],
	observed: ["observed", "观测"],
	calculated: ["calculated", "计算"],
	interpretation: ["interpretation", "解读"],
	unknown: ["unknown", "未知"],
	gHead: ["Keep a record of every answer.", "为每个答案留一份记录。"],
	g2Head: [
		"Same question: revise. New one: new record.",
		"同一问题：修订；新问题：新记录。",
	],
	claimBig: [
		"Ask a question someone else can check.",
		"提一个别人能核对的问题。",
	],
	claimSub: [
		"Name what counts; tag each claim's evidence.",
		"说清什么算数；标明每个结论的证据。",
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
	const headline = (name: string, text: Copy) => (
		<Lines
			name={name}
			text={t(text)}
			x={margin}
			y={L.headY}
			size={T.head}
			maxWidth={narrow ? room : room * 0.74}
			anchor="start"
		/>
	);
	const text = narrow ? T.small * 1.1 : T.body;
	const id = useId().replace(/:/g, "");
	const leaderRow = SERIES.indexOf(LEADER);
	const answerSize = L.answerSize;
	const lateNumberX =
		margin +
		16 +
		textWidth(t(LATE_PREFIX), answerSize * (locale === "zh" ? 0.95 : 0.86)) +
		answerSize * 0.22;
	const proofX = margin + 16;
	const proofParts = [count(COVERED), "+", count(LATE), "=", count(WITH_LATE)];
	const proofNames = [
		"rev-base",
		"rev-plus",
		"rev-add",
		"rev-equals",
		"rev-total",
	];
	const proofAt = (i: number) =>
		proofX +
		proofParts
			.slice(0, i)
			.reduce(
				(x, part) => x + textWidth(part, L.proofSize) + L.proofSize * 0.5,
				0,
			);
	const shareParts = [
		`≤ ${share(LEAD, COVERED)}`,
		"→",
		count(LEAD),
		"÷",
		count(WITH_LATE),
		"≈",
		share(LEAD, WITH_LATE),
	];
	const shareNames = [
		"rev-bound",
		"rev-share-arrow",
		"rev-numerator",
		"rev-divide",
		"rev-denominator",
		"rev-approx",
		"rev-share",
	];
	// Fit the complete bound-to-division line without reducing the phone's type.
	const shareGap = L.proofSize * (narrow ? 0.35 : 0.5);
	const shareAt = (i: number) =>
		proofX +
		shareParts
			.slice(0, i)
			.reduce((x, part) => x + textWidth(part, L.proofSize) + shareGap, 0);
	// On a phone the connector clears the chart, then follows the cards' left gutter.
	// On desktop, leave the bar below its figures and follow the claim cards' gutter.
	const segBottom = L.barRowY(leaderRow) + L.barH;
	const swatchY = L.claimY(SPREAD_CARD) + L.claimH / 2;
	const spreadPath = narrow
		? `M${L.barX + 4} ${segBottom} L${L.barX - 8} ${segBottom + 6} V${L.barRowY(SERIES.length - 1) + L.barH + 8} H${margin - 10} V${swatchY} H${L.claimX + 12}`
		: `M${L.barX + (SPREAD_LEG / MAX) * L.barMax * 0.7} ${segBottom} V${segBottom + 2} H${L.claimX - 8} V${swatchY} H${L.claimX + 12}`;
	return (
		<>
			<Backdrop frame={L} />
			<defs>
				<Hatch id={`hatch-${id}`} />
			</defs>

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
					size={T.head * 1.2}
					maxWidth={room}
					className="wt-film-type"
				/>
			</g>

			{/* A root-level, same-face proxy carries ALFA out of the wrapped question. */}
			<Word
				name="q-subject"
				x={W / 2}
				y={H * 0.44}
				size={T.title * 0.9}
				anchor="start"
				className="wt-film-type wt-film-accent"
			>
				ALFA
			</Word>

			{/* The question, field by field. */}
			{headline("f-head", copy.fHead)}
			{fields.map((field, i) => (
				<g key={field.id} data-f={`field-${i}`}>
					<rect
						x={margin}
						y={L.fieldY(i)}
						width={room}
						height={L.fieldH}
						rx={10}
						className="wt-panel-shape"
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
						{i === 0 ? (
							<>
								<tspan data-f="field-0-subject" className="wt-film-accent">
									ALFA
								</tspan>
								<tspan data-f="field-0-detail">{t(field.value).slice(4)}</tspan>
							</>
						) : (
							t(field.value)
						)}
					</text>
				</g>
			))}

			{/* The answer, claim by claim. */}
			{headline("a-head", copy.aHead)}
			{/* The hero's answer, as the brackets lock on the interpretation. */}
			<Lines
				name="a2-head"
				text={t(copy.a2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.aHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			<Brackets name="lock-claim" glow />
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
								data-f="missing-series-ghost"
								x={L.barX}
								y={L.barRowY(i)}
								width={L.barMax * 0.3}
								height={L.barH}
								rx={3}
								className="wt-film-ghost"
							/>
							<text
								data-f="missing-series-state"
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
			{/* The 110 bar's 500 that is one spread leg, laid over the bar when it splits. */}
			<rect
				data-f="spread-seg"
				x={L.barX}
				y={L.barRowY(leaderRow)}
				width={(SPREAD_LEG / MAX) * L.barMax}
				height={L.barH}
				rx={3}
				fill={`url(#hatch-${id})`}
				stroke="var(--diagram-gain)"
				strokeWidth={1.5}
			/>
			<Word
				name="spread-label"
				x={L.barX}
				y={segBottom + T.body + 6}
				size={T.body}
				anchor="start"
				className="wt-film-type wt-film-gain"
			>
				{t(copy.spreadLabel)}
			</Word>
			<path
				data-f="spread-trace"
				d={spreadPath}
				fill="none"
				stroke="var(--diagram-gain)"
				strokeWidth={1.5}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
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
					{i === SPREAD_CARD ? (
						<rect
							data-f="spread-swatch"
							x={L.claimX + 12}
							y={L.claimY(i) + L.claimH / 2 - 6}
							width={12}
							height={12}
							rx={2}
							fill={`url(#hatch-${id})`}
							stroke="var(--diagram-gain)"
							strokeWidth={1.5}
						/>
					) : null}
					<text
						data-f={`claim-${i}-text`}
						x={L.claimX + 12 + (i === SPREAD_CARD ? 20 : 0)}
						y={L.claimY(i) + L.claimH / 2 + text * 0.36}
						className={`wt-film-type ${claim.evidence === "unknown" ? "wt-film-dim" : ""}`}
						style={{ fontSize: text }}
					>
						{t(narrow ? claim.short : claim.text)}
					</text>
					{i === STORY_CARD ? (
						<line
							data-f="story-strike"
							x1={L.claimX + 10}
							x2={
								L.claimX +
								14 +
								textWidth(
									t(narrow ? claim.short : claim.text),
									text * (locale === "zh" ? 0.95 : 0.86),
								)
							}
							y1={L.claimY(i) + L.claimH / 2}
							y2={L.claimY(i) + L.claimH / 2}
							stroke="var(--diagram-unknown)"
							strokeWidth={2}
							strokeLinecap="round"
						/>
					) : null}
					<text
						data-f={`claim-${i}-tag`}
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
			{headline("g-head", copy.gHead)}
			{/* The rule, as the second record opens. */}
			<Lines
				name="g2-head"
				text={t(copy.g2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.gHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			{records.map((record, i) => (
				<g key={t(record.title)} data-f={`rec-${i}`}>
					<rect
						data-f={`rec-${i}-box`}
						x={margin}
						y={L.recY(i)}
						width={room}
						height={L.recH(i)}
						rx={12}
						className="wt-panel-shape"
					/>
					<text
						data-f={`rec-${i}-title`}
						x={margin + 16}
						y={L.recY(i) + L.recH(i) * 0.26}
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(record.title).toUpperCase()}
					</text>
					<text
						data-f={`rec-${i}-tag`}
						x={margin + room - 16}
						y={L.recY(i) + L.recH(i) * 0.26}
						textAnchor="end"
						className="wt-film-tag wt-film-accent"
						style={{ fontSize: T.small }}
					>
						{t(record.tag).toUpperCase()}
					</text>
					<text
						data-f={`rec-${i}-question`}
						x={margin + 16}
						y={
							L.recY(i) +
							L.recH(i) * (narrow && i === 0 ? 0.43 : narrow ? 0.56 : 0.48)
						}
						className="wt-film-type"
						style={{ fontSize: T.body }}
					>
						{t(record.question)}
					</text>
					<text
						data-f={`rec-${i}-answer`}
						x={margin + 16}
						y={L.recY(i) + L.recH(i) * (narrow && i === 0 ? 0.65 : 0.82)}
						className="wt-film-type"
						style={{ fontSize: narrow ? T.body : answerSize }}
					>
						{t(record.answer)}
					</text>
				</g>
			))}
			{/* Tuesday's data for the 120 call: it comes in over record 1 and lands in its answer. */}
			<g data-f="late">
				<Word
					name="late-volume"
					x={L.barX + 16}
					y={L.lateY}
					size={L.proofSize}
					anchor="start"
					className="wt-film-num wt-film-accent"
				>
					{count(LATE)}
				</Word>
				<text
					data-f="late-day"
					x={L.barX + L.barMax * 0.3 + 24}
					y={L.lateY}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.lateDay).toUpperCase()}
				</text>
			</g>
			{/* The late series changes the denominator first, then resolves the bound. */}
			<g data-f="rev-proof">
				<Word
					name="rev-scope"
					x={proofX}
					y={L.proofY(0) - H * 0.065}
					size={T.small}
					anchor="start"
					className="wt-film-tag"
				>
					{t(copy.proofScope).toUpperCase()}
				</Word>
				{proofParts.map((part, i) => (
					<Word
						key={proofNames[i]}
						name={proofNames[i]}
						x={proofAt(i)}
						y={L.proofY(0)}
						size={L.proofSize}
						anchor="start"
						className={`wt-film-num ${i === 2 || i === 4 ? "wt-film-accent" : ""}`}
					>
						{part}
					</Word>
				))}
				{shareParts.map((part, i) => (
					<Word
						key={shareNames[i]}
						name={shareNames[i]}
						x={shareAt(i)}
						y={L.proofY(1)}
						size={L.proofSize}
						anchor="start"
						className={`wt-film-num ${i === 4 || i === 6 ? "wt-film-accent" : ""}`}
					>
						{part}
					</Word>
				))}
			</g>
			{/* Once the calls proof leaves, the lower stage explains the new universe. */}
			<g data-f="universe-change">
				<Word
					name="rec-0-universe"
					x={margin + room * 0.22}
					y={L.universeY(0)}
					size={L.proofSize}
				>
					{t(copy.calls)}
				</Word>
				<Word
					name="universe-arrow"
					x={margin + room * 0.48}
					y={L.universeY(0)}
					size={L.proofSize}
					className="wt-film-num"
				>
					→
				</Word>
				<Word
					name="rec-1-universe"
					x={margin + room * 0.74}
					y={L.universeY(0)}
					size={L.proofSize}
					className="wt-film-type wt-film-accent"
				>
					{t(copy.puts)}
				</Word>
				<Word
					name="universe-kept"
					x={margin + room * 0.22}
					y={L.universeY(1)}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.keptRecord).toUpperCase()}
				</Word>
				<Word
					name="universe-new"
					x={margin + room * 0.74}
					y={L.universeY(1)}
					size={T.small}
					className="wt-film-tag wt-film-accent"
				>
					{t(copy.newRecord).toUpperCase()}
				</Word>
			</g>
			{/* Record 1 revised: the same card, its title, answer and tag turned over. */}
			<g data-f="rev">
				<text
					data-f="rev-title"
					x={margin + 16}
					y={L.recY(0) + L.recH(0) * 0.26}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(revised.title).toUpperCase()}
				</text>
				<text
					data-f="rev-tag"
					x={margin + room - 16}
					y={L.recY(0) + L.recH(0) * 0.26}
					textAnchor="end"
					className="wt-film-tag wt-film-accent"
					style={{ fontSize: T.small }}
				>
					{t(revised.tag).toUpperCase()}
				</text>
				<text
					data-f="rev-late"
					x={margin + 16}
					y={L.recY(0) + L.recH(0) * (narrow ? 0.65 : 0.82)}
					className="wt-film-type wt-film-accent"
					style={{ fontSize: answerSize }}
				>
					{t(LATE_PREFIX)}
				</text>
				<Word
					name="rev-late-volume"
					x={lateNumberX}
					y={L.recY(0) + L.recH(0) * (narrow ? 0.65 : 0.82)}
					size={answerSize}
					anchor="start"
					className="wt-film-num wt-film-accent"
				>
					{count(LATE)}
				</Word>
				<text
					data-f="rev-answer"
					x={
						narrow
							? margin + 16
							: lateNumberX +
								textWidth(count(LATE), answerSize) +
								answerSize * 0.3
					}
					y={L.recY(0) + L.recH(0) * (narrow ? 0.87 : 0.82)}
					className={`wt-film-type ${narrow ? "" : "wt-film-accent"}`}
					style={{ fontSize: answerSize, fontWeight: narrow ? 600 : undefined }}
				>
					{t(narrow ? revised.shortAnswer : revised.answer)}
				</text>
			</g>

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
	/** A line lands slightly large and settles, without overshoot. */
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const heads = ["f-head", "a-head", "a2-head", "g-head", "g2-head"].map(
		(name) => one(name),
	);
	const fieldRows = fields.map((_, i) => one(`field-${i}`));
	const strikes = SERIES.map((_, i) => one(`strike-${i}`));
	const claimRows = claims.map((_, i) => one(`claim-${i}`));
	const recs = records.map((_, i) => one(`rec-${i}`));
	const lockClaim = one<SVGGraphicsElement>("lock-claim");
	const tags = claims.map((_, i) => one(`claim-${i}-tag`));
	const revs = [
		"rev-title",
		"rev-tag",
		"rev-late",
		"rev-late-volume",
		"rev-answer",
	].map((name) => one(name));

	d.hidden([
		...flat("q"),
		one("q-subject"),
		one("field-0-subject"),
		one("field-0-detail"),
		...heads,
		...fieldRows,
		...strikes,
		...claimRows,
		...tags,
		one("spread-seg"),
		one("spread-label"),
		one("spread-trace"),
		one("story-strike"),
		lockClaim,
		...recs,
		...revs,
		...kids("late"),
		...kids("rev-proof"),
		...kids("universe-change"),
		...kids("claim"),
	]);
	// The strike runs the story's own length, measured as set.
	const story = one<SVGTextElement>("claim-2-text").getBBox();
	gsap.set(one("story-strike"), {
		attr: { x1: story.x - 2, x2: story.x + story.width + 2 },
	});
	// Measure the exact ALFA glyphs in the wrapped question for a same-face proxy.
	const question = one<SVGTextElement>("q-line");
	const subjectAt = (question.textContent ?? "").indexOf("ALFA");
	const subjectStart = question.getStartPositionOfChar(subjectAt);
	gsap.set(one("q-subject"), {
		attr: { x: subjectStart.x, y: subjectStart.y },
	});
	// Measure the prefix and mono digits independently; carries land in the source's face.
	const prefixBox = one<SVGTextElement>("rev-late").getBBox();
	gsap.set(one("rev-late-volume"), {
		attr: { x: prefixBox.x + prefixBox.width + L.answerSize * 0.22 },
	});
	// Only the wide answer remains inline; the phone saves two separate body-sized lines.
	if (!L.narrow) {
		const answerBox = one<SVGTextElement>("rev-late-volume").getBBox();
		gsap.set(one("rev-answer"), {
			attr: { x: answerBox.x + answerBox.width + L.answerSize * 0.3 },
		});
	}
	/** An evidence tag is stamped on its card: in slightly large, settling. */
	const stamp = (target: Element, at: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.25, transformOrigin: "100% 50%" },
			{ opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" },
			at,
		);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: a vague one ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	word(one("q-line"), 4.8);
	show(one("q-big"), 5.1);

	// ——— frame: field by field, in pairs ———
	tl.addLabel("frame", 8.6);
	tl.set(flat("q"), { opacity: 0 }, 8.6);
	d.carry(
		one<SVGGraphicsElement>("q-subject"),
		one<SVGGraphicsElement>("field-0-subject"),
		8.6,
		{ duration: 0.75, arc: "x" },
	);
	show(heads[0], 8.8);
	tl.fromTo(fieldRows[0], { opacity: 0 }, { opacity: 1, duration: 0.35 }, 8.95);
	tl.fromTo(
		one("field-0-detail"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.25 },
		9.35,
	);
	fieldRows.forEach((row, i) => {
		if (i === 0) return;
		show(row, 9.4 + Math.floor(i / 2) * 2.2 + (i % 2) * 0.5, "right");
	});

	// ——— answer: the hero. Claim by claim, each stamped with its evidence. ———
	tl.addLabel("answer", 17.6);
	hide([heads[0], ...fieldRows], 17.6);
	show(heads[1], 17.95);
	strikes.forEach((row, i) => {
		show(row, 18.4 + i * 0.15, "right");
	});
	show(claimRows[0], 20.2, "right");
	stamp(tags[0], 20.6);
	show(claimRows[1], 21.4, "right");
	stamp(tags[1], 21.8);
	// The interpretation reads the 110 bar: the bar answers.
	show(claimRows[2], 22.6, "right");
	tl.fromTo(
		strikes[SERIES.indexOf(LEADER)],
		{ x: 0 },
		{ x: 6, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" },
		22.7,
	);
	stamp(tags[2], 23.0);
	// Against it: 500 of the 540 is one spread leg. The bar splits; the story fades.
	tl.fromTo(
		one("spread-seg"),
		{ opacity: 0, attr: { width: 0 } },
		{
			opacity: 1,
			attr: { width: (SPREAD_LEG / MAX) * L.barMax },
			duration: 0.6,
			ease: "power2.out",
		},
		24.4,
	);
	show(one("spread-label"), 24.6, "right");
	show(claimRows[3], 25.05, "right");
	stamp(tags[3], 25.55);
	d.trace(one<SVGPathElement>("spread-trace"), 25.6, { duration: 0.5 });
	// Once the evidence has struck the story, clear the connector before the lock.
	hide(one("spread-trace"), 26.7, 0.25, 0);
	// The story is struck through, right after the evidence against it, not erased.
	tl.fromTo(
		one("story-strike"),
		{ opacity: 1, scaleX: 0, transformOrigin: "0% 50%" },
		{ scaleX: 1, duration: 0.4, ease: "power2.out" },
		26.15,
	);
	tl.to(one("claim-2-text"), { opacity: 0.75, duration: 0.4 }, 26.15);
	d.lock(lockClaim, 27.7, { around: claimRows[2], pad: L.narrow ? 4 : 6 });
	tl.addLabel("hero-lock", 27.7);
	show(heads[2], 27.7);
	// After the lock, once it has been seen: what the data doesn't hold.
	show(claimRows[4], 29.1, "right");
	stamp(tags[4], 29.5);

	// ——— log: revise, or start anew ———
	tl.addLabel("log", 31.2);
	d.swap([heads[1], heads[2]], heads[3], 31.2);
	hide(
		[
			...strikes.filter((_, i) => SERIES[i].volume !== null),
			...claimRows,
			...tags,
			one("spread-seg"),
			one("spread-label"),
			one("story-strike"),
			lockClaim,
		],
		31.2,
	);
	show(recs[0], 31.45, "right");
	// Preserve the named, missing 120 row while the rest of the hero leaves.
	const missingIndex = SERIES.findIndex((row) => row.volume === null);
	const rowBaseline =
		L.barRowY(missingIndex) +
		L.barH / 2 +
		(L.narrow ? L.type.small * 1.1 : L.type.body) * 0.36;
	tl.to(
		strikes[missingIndex],
		{ x: 16, y: L.lateY - rowBaseline, duration: 0.65, ease: "power3.inOut" },
		31.55,
	);
	// The ghost becomes Tuesday's delivered series at the same baseline and state label.
	hide(
		[one("missing-series-ghost"), one("missing-series-state")],
		32.5,
		0.1,
		0,
	);
	tl.fromTo(
		one("late-volume"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.25 },
		32.5,
	);
	tl.fromTo(
		one("late-day"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.25 },
		32.6,
	);
	// The delivered series adds to coverage; only the settled sum is shown after "=".
	show(one("rev-scope"), 33.65, "right", 0.25);
	show(one("rev-base"), 33.1, "right", 0.25);
	show(one("rev-bound"), 33.1, "right", 0.25);
	show(one("rev-plus"), 33.4, "right", 0.25);
	d.carry(
		one<SVGGraphicsElement>("late-volume"),
		one<SVGGraphicsElement>("rev-add"),
		33.35,
		{ duration: 0.3, arc: "x", keep: true },
	);
	show([one("rev-equals"), one("rev-total")], 33.8, "right", 0.25);
	show(
		[
			one("rev-share-arrow"),
			one("rev-numerator"),
			one("rev-divide"),
			one("rev-denominator"),
		],
		34.1,
		"below",
		0.25,
	);
	show([one("rev-approx"), one("rev-share")], 34.4, "below", 0.25);
	// …and rises into its answer: record 1 turns over in place, caused, and keeps the stage.
	tl.set(one("rec-0-box"), { attr: { class: "wt-focus-shape" } }, 34.4);
	// Preserve the original answer's 3.5 s hold before it changes.
	tl.to(one("rec-0-answer"), { opacity: 0, duration: 0.05 }, 35);
	d.carry(
		one<SVGGraphicsElement>("late-volume"),
		one<SVGGraphicsElement>("rev-late-volume"),
		35.05,
		{ duration: 0.4 },
	);
	// Reveal the prefix on landing, so the flying digits never pass its settled glyphs.
	hide(strikes[missingIndex], 35.05, 0.25, 0);
	tl.set(one("rev-late"), { opacity: 1 }, 35.45);
	hide(one("late-day"), 35.05);
	d.flip(one("rec-0-title"), revs[0], 34.8);
	tl.set(one("rec-0-title"), { opacity: 0 }, 35.1);
	d.flip(one("rec-0-tag"), revs[1], 34.8);
	tl.set(one("rec-0-tag"), { opacity: 0 }, 35.1);
	// The answer writes the result only after the denominator and share have settled.
	tl.set(one("rev-answer"), { opacity: 1 }, 35.45);
	// A new question: a new record, once the revision has been read.
	// Clear record 1's proof before record 2 can compete with its scope.
	hide(kids("rev-proof"), 37.2, 0.25, 0);
	show(recs[1], 37.5, "right");
	tl.set(one("rec-0-box"), { attr: { class: "wt-panel-shape" } }, 37.5);
	tl.set(one("rec-1-box"), { attr: { class: "wt-focus-shape" } }, 37.5);
	show(heads[4], 37.5);
	show([one("rec-0-universe"), one("universe-kept")], 37.9, "right", 0.3);
	show(one("universe-arrow"), 38.1, "right", 0.3);
	show([one("rec-1-universe"), one("universe-new")], 38.35, "right", 0.3);

	// ——— claim ———
	tl.addLabel("claim", 41);
	hide([heads[3], heads[4], ...recs, ...revs, ...kids("universe-change")], 41);
	word(one("z-big"), 41.3);
	show(one("z-sub"), 41.7);

	// ——— next ———
	tl.addLabel("next", 45.3);
	hide(kids("claim"), 45.3);
	d.close(45.3);
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
