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
	toneClass,
	toneColor,
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
 * underlined as uncertain and glowing brackets lock on it; after the lock, the 120 call's volume
 * stays unknown. Last, the log: Tuesday's 30 contracts for the 120 call come in and revise
 * record 1 in place while keeping Monday's version; a switch to puts opens record 2.
 *
 *   open      0–4        "Research questions"
 *   question  4–8.6      "Where’s the action in ALFA?" Checkable?
 *   frame     8.6–17.6   subject, universe; measure, interval; evidence, revision
 *   answer    17.6–32.05  hero: five strikes; observed; calculated; interpretation; the
 *                        split, labelled and connected; qualified; locked; then the gap
 *   log       32.05–41.6  record 1; Tuesday's 120 call updates the total to 1,095; the
 *                        revised answer records 540 ÷ 1,095 ≈ 49% and keeps Monday's
 *                        bound; then calls → puts opens record 2 and clears the calls proof
 *   claim     41.6–45.9 a question someone else can check
 *   next      45.9–47.5 Next: comparison groups
 */

const END = 47.5;
const MAX = 560;
/** The claim cards: the interpretation, and the observed spread leg that undercuts it. */
const STORY_CARD = 2;
const SPREAD_CARD = 3;
const UNKNOWN_CARD = 4;
const LEAD = LEADER.volume ?? 0;
type Evidence = "observed" | "calculated" | "interpretation" | "unknown";
const tone: Record<Evidence, string> = {
	observed: "",
	calculated: "",
	interpretation: toneClass.caution,
	unknown: toneClass.caution,
};

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const labelW = narrow ? 44 : 60;
	const answerSize = narrow ? frame.type.body * 1.1 : frame.type.head;
	const chartSize = narrow ? frame.type.small * 1.1 : frame.type.body;
	const storySize = chartSize * 1.4;
	const claimH = H * (narrow ? 0.048 : 0.068);
	// Reserve the hero's full font extents, underline and padding before any card enters.
	const storyH = Math.max(claimH, storySize * 1.4 + 14);
	// Reserve full font extents plus 8 px between the four saved-record rows.
	const recTop = H * 0.27;
	const recTitleY = recTop + 12 + frame.type.small;
	const recQuestionY =
		recTitleY + frame.type.small * 0.3 + frame.type.body * 1.1 + 8;
	const recLateY = recQuestionY + frame.type.body * 1.4 + 8;
	const recAnswerY = recLateY + frame.type.body * 0.3 + answerSize * 1.1 + 8;
	const firstRecH = Math.max(
		H * (narrow ? 0.22 : 0.2),
		recAnswerY - recTop + answerSize * 0.3 + 12,
	);
	const secondRecH = H * (narrow ? 0.16 : 0.17);
	const secondRecY = Math.max(H * 0.54, recTop + firstRecH + 16);
	const proofSize = narrow ? frame.type.head : frame.type.num;
	const universeY = Math.max(
		H * (narrow ? 0.77 : 0.78),
		secondRecY + secondRecH + proofSize + 8,
	);
	return {
		...frame,
		fieldY: (i: number) =>
			H * (narrow ? 0.26 : 0.27) + i * H * (narrow ? 0.095 : 0.095),
		fieldH: H * (narrow ? 0.078 : 0.08),
		labelW: narrow ? room * 0.36 : room * 0.24,
		barRowY: (i: number) =>
			H * (narrow ? 0.26 : 0.3) +
			i * H * (narrow ? 0.055 : 0.06) +
			// Leave a clear connector route beneath the 110 segment and above the lower strikes.
			(i > SERIES.indexOf(LEADER) ? frame.type.body * 1.4 : 0),
		barH: H * (narrow ? 0.036 : 0.04),
		barX: margin + labelW,
		barMax: (narrow ? room : room * 0.46) - labelW - (narrow ? 50 : 60),
		claimX: narrow ? margin : margin + room * 0.5,
		claimW: narrow ? room : room * 0.5,
		claimY: (i: number) =>
			(narrow ? H * 0.58 + i * H * 0.072 : H * 0.28 + i * H * 0.095) +
			(i > STORY_CARD ? storyH - claimH : 0),
		claimH: (i: number) => (i === STORY_CARD ? storyH : claimH),
		chartSize,
		storySize,
		recX: (i: number) => margin + (width >= 900 ? i * room * 0.1 : 0),
		recW: width >= 900 ? room * 0.82 : room,
		recY: (i: number) => (i === 0 ? recTop : secondRecY),
		recH: (i: number) => (i === 0 ? firstRecH : secondRecH),
		recTitleY,
		recQuestionY,
		recLateY,
		recAnswerY,
		answerSize,
		lateY: Math.max(
			H * 0.49 + frame.type.body * 1.8,
			recTop + firstRecH + proofSize + 8,
		),
		proofSize,
		proofY: (i: number) => H * (narrow ? 0.73 : 0.78) + i * H * 0.08,
		universeY: (i: number) => universeY + i * H * 0.08,
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
			`≤${share(LEAD, COVERED)} of all; 110 leads known volume.`,
			`占全部≤${share(LEAD, COVERED)}；已覆盖成交中 110 领先。`,
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

/** Tuesday's revision fades in while a compact history keeps Monday's timestamp and bound. */
/** The saved series label stays separate from its mono digits. */
const LATE_PREFIX: Copy = ["120:", "120："];
const revised = {
	title: ["record 1 · Tue 09:00", "记录 1 · 周二 09:00"],
	history: [
		`Mon 16:05 · ≤${share(LEAD, COVERED)} · kept`,
		`周一 16:05 · ≤${share(LEAD, COVERED)} · 保留`,
	],
	shortAnswer: [
		`110 leads · ${count(LEAD)}÷${count(WITH_LATE)}≈${share(LEAD, WITH_LATE)}`,
		`110 领先 · ${count(LEAD)}÷${count(WITH_LATE)}≈${share(LEAD, WITH_LATE)}`,
	],
	tag: ["revised", "已修订"],
} as const satisfies Record<string, Copy>;

const copy = {
	title: ["Research questions", "研究问题"],
	titleSub: ["what evidence can answer", "证据能回答什么"],
	qTag: ["a research question", "一个研究问题"],
	qLine: ["Where’s ALFA most active?", "ALFA 哪里交易最活跃？"],
	qBig: ["Can anyone check the answer?", "答案有人能核对吗？"],
	lateDay: ["late · Tue 09:00", "迟到 · 周二 09:00"],
	calls: ["calls", "看涨"],
	puts: ["puts", "看跌"],
	fHead: ["Frame it so someone can check it.", "把问题框定到别人能核对。"],
	aHead: ["Then tag each claim by its evidence.", "再按证据给每个结论贴标签。"],
	a2Head: [
		"“Favor 110” is interpretation, not fact.",
		"“偏好 110”是解读，不是事实。",
	],
	missing: ["not delivered", "未送达"],
	spreadLeg: ["one spread leg", "一条价差腿"],
	observed: ["observed", "观测"],
	calculated: ["calculated", "计算"],
	interpretation: ["interpretation", "解读"],
	unknown: ["unknown", "未知"],
	gHead: ["Keep a record of every answer.", "为每个答案留一份记录。"],
	g2Head: [
		"Revise in place; new question, new record.",
		"原题修订；新题新建记录。",
	],
	claimBig: [
		"Ask a question someone else can check.",
		"提一个别人能核对的问题。",
	],
	claimSub: [
		"Define scope; tag each claim's evidence.",
		"说清范围；标明每条结论的证据。",
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
	const text = L.chartSize;
	const claimSize = (i: number) => (i === STORY_CARD ? L.storySize : text);
	const claimText = (i: number) =>
		t(
			narrow || (i === STORY_CARD && locale === "en")
				? claims[i].short
				: claims[i].text,
		);
	const id = useId().replace(/:/g, "");
	const leaderRow = SERIES.indexOf(LEADER);
	const answerSize = L.answerSize;
	const lateNumberX =
		margin +
		16 +
		textWidth(t(LATE_PREFIX), T.body * (locale === "zh" ? 0.95 : 0.86)) +
		10;
	const unknownTagX =
		L.barX +
		L.barMax * 0.3 +
		8 +
		textWidth(t(copy.missing).toUpperCase(), T.small) +
		16;
	const unknownTagY =
		L.barRowY(SERIES.length - 1) + L.barH / 2 + T.small * 0.38;
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
	// On a phone the connector clears the chart, then follows the cards' left gutter.
	// On desktop, leave the bar below its figures and follow the claim cards' gutter.
	const segBottom = L.barRowY(leaderRow) + L.barH;
	const swatchY = L.claimY(SPREAD_CARD) + L.claimH(SPREAD_CARD) / 2;
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
				className="wt-film-type"
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
						data-f={`field-${i}-value`}
						x={margin + L.labelW}
						y={L.fieldY(i) + L.fieldH / 2 + text * 0.36}
						className="wt-film-type"
						style={{ fontSize: text }}
					>
						{i === 0 ? (
							<>
								<tspan data-f="field-0-subject">ALFA</tspan>
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
								fill={`url(#hatch-${id})`}
								stroke={toneColor("caution")}
								strokeWidth={1.75}
							/>
							<text
								data-f="missing-series-state"
								x={L.barX + L.barMax * 0.3 + 8}
								y={L.barRowY(i) + L.barH / 2 + T.small * 0.38}
								className={`wt-film-tag ${toneClass.caution}`}
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
				fill="var(--tone-dim)"
				stroke="var(--tone-dim)"
				strokeWidth={1.5}
			/>
			<path
				data-f="spread-trace"
				d={spreadPath}
				fill="none"
				stroke="var(--tone-dim)"
				strokeWidth={1.5}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			{claims.map((claim, i) => (
				<g key={t(claim.text)} data-f={`claim-${i}`}>
					{/* The first two evidence lines share one panel and enter together. */}
					{i !== 1 && i !== UNKNOWN_CARD ? (
						<rect
							x={L.claimX}
							y={L.claimY(i)}
							width={L.claimW}
							height={
								i === 0 ? L.claimY(1) - L.claimY(0) + L.claimH(1) : L.claimH(i)
							}
							rx={9}
							className={i === STORY_CARD ? "wt-focus-shape" : "wt-panel-shape"}
							style={
								claim.evidence === "observed" ? { strokeWidth: 1.5 } : undefined
							}
						/>
					) : null}
					{i === SPREAD_CARD ? (
						<rect
							data-f="spread-swatch"
							x={L.claimX + 12}
							y={L.claimY(i) + L.claimH(i) / 2 - 6}
							width={12}
							height={12}
							rx={2}
							fill="var(--tone-dim)"
							stroke="var(--tone-dim)"
							strokeWidth={1.5}
						/>
					) : null}
					{i !== UNKNOWN_CARD ? (
						<text
							data-f={`claim-${i}-text`}
							x={L.claimX + 12 + (i === SPREAD_CARD ? 20 : 0)}
							y={L.claimY(i) + L.claimH(i) / 2 + claimSize(i) * 0.36}
							className={`wt-film-type ${claim.evidence === "unknown" ? "wt-film-dim" : ""}`}
							style={{ fontSize: claimSize(i) }}
						>
							{claimText(i)}
						</text>
					) : null}
					{i === STORY_CARD ? (
						<line
							data-f="story-strike"
							x1={L.claimX + 10}
							x2={
								L.claimX +
								14 +
								textWidth(
									claimText(i),
									claimSize(i) * (locale === "zh" ? 0.95 : 0.86),
								)
							}
							y1={L.claimY(i) + L.claimH(i) - 5}
							y2={L.claimY(i) + L.claimH(i) - 5}
							stroke={toneColor("caution")}
							strokeWidth={2}
							strokeDasharray="4 4"
							strokeLinecap="round"
						/>
					) : null}
					<text
						data-f={`claim-${i}-tag`}
						x={i === UNKNOWN_CARD ? unknownTagX : L.claimX + L.claimW - 12}
						y={
							i === UNKNOWN_CARD
								? unknownTagY
								: L.claimY(i) + L.claimH(i) / 2 + T.small * 0.36
						}
						textAnchor={i === UNKNOWN_CARD ? "start" : "end"}
						className={`wt-film-tag ${tone[claim.evidence]}`}
						style={{
							fontSize: T.small * 0.95,
							fill:
								claim.evidence === "observed" || claim.evidence === "calculated"
									? "var(--tone-ink)"
									: undefined,
						}}
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
						x={L.recX(i)}
						y={L.recY(i)}
						width={L.recW}
						height={L.recH(i)}
						rx={12}
						className="wt-panel-shape"
					/>
					<text
						data-f={`rec-${i}-title`}
						x={L.recX(i) + 16}
						y={i === 0 ? L.recTitleY : L.recY(i) + L.recH(i) * 0.26}
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(record.title).toUpperCase()}
					</text>
					<text
						data-f={`rec-${i}-tag`}
						x={L.recX(i) + L.recW - 16}
						y={i === 0 ? L.recTitleY : L.recY(i) + L.recH(i) * 0.26}
						textAnchor="end"
						className="wt-film-tag wt-film-accent"
						style={{ fontSize: T.small }}
					>
						{t(record.tag).toUpperCase()}
					</text>
					<text
						data-f={`rec-${i}-question`}
						x={L.recX(i) + 16}
						y={
							i === 0
								? L.recQuestionY
								: L.recY(i) + L.recH(i) * (narrow ? 0.56 : 0.44)
						}
						className="wt-film-type"
						style={{ fontSize: T.body }}
					>
						{t(record.question)}
					</text>
					<text
						data-f={`rec-${i}-answer`}
						x={L.recX(i) + 16}
						y={i === 0 ? L.recAnswerY : L.recY(i) + L.recH(i) * 0.82}
						className="wt-film-type"
						style={{ fontSize: narrow ? T.body : answerSize, fontWeight: 600 }}
					>
						{t(record.answer)}
					</text>
				</g>
			))}
			{/* Tuesday's data for the 120 call: it comes in over record 1 and lands in its answer. */}
			<g data-f="late">
				<Word
					name="late-strike"
					x={margin + 16}
					y={L.lateY}
					size={text}
					anchor="start"
					className="wt-film-num"
				>
					{SERIES.find((row) => row.volume === null)?.strike}
				</Word>
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
			{/* The late series updates the total before the saved answer is revised. */}
			<g data-f="rev-proof">
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
			</g>
			{/* Once the calls proof leaves, the lower stage explains the new universe. */}
			<g data-f="universe-change">
				<Word
					name="rec-0-universe"
					x={margin + room * 0.22}
					y={L.universeY(0)}
					size={L.proofSize}
					className={`wt-film-type ${toneClass.call}`}
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
					className={`wt-film-type ${toneClass.put}`}
				>
					{t(copy.puts)}
				</Word>
			</g>
			{/* The current revision and its preserved earlier version share the same card. */}
			<g data-f="rev">
				<text
					data-f="rev-title"
					x={margin + 16}
					y={L.recTitleY}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(revised.title).toUpperCase()}
				</text>
				<text
					data-f="rev-tag"
					x={margin + L.recW - 16}
					y={L.recTitleY}
					textAnchor="end"
					className="wt-film-tag wt-film-accent"
					style={{ fontSize: T.small }}
				>
					{t(revised.tag).toUpperCase()}
				</text>
				<text
					data-f="rev-late"
					x={margin + 16}
					y={L.recLateY}
					className="wt-film-type wt-film-accent"
					style={{ fontSize: T.body }}
				>
					{t(LATE_PREFIX)}
				</text>
				<Word
					name="rev-late-volume"
					x={lateNumberX}
					y={L.recLateY}
					size={T.body}
					anchor="start"
					className="wt-film-num wt-film-accent"
				>
					{count(LATE)}
				</Word>
				<text
					data-f="rev-history"
					x={margin + L.recW - 16}
					y={L.recLateY}
					textAnchor="end"
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(revised.history)}
				</text>
				<text
					data-f="rev-answer"
					x={margin + 16}
					y={L.recAnswerY}
					className="wt-film-type wt-film-accent"
					style={{ fontSize: answerSize, fontWeight: 600 }}
				>
					{t(revised.shortAnswer)}
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
		"rev-history",
	].map((name) => one(name));

	d.hidden([
		...flat("q"),
		one("q-subject"),
		one("field-0-subject"),
		one("field-0-detail"),
		...heads,
		...fieldRows,
		...strikes,
		...claimRows.filter((_, i) => i !== UNKNOWN_CARD),
		tags[UNKNOWN_CARD],
		// The first pair's tags arrive with their shared evidence panel.
		...tags.slice(STORY_CARD, UNKNOWN_CARD),
		one("spread-seg"),
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
	gsap.set(tags.slice(0, STORY_CARD), { opacity: 1 });
	// A dashed underline qualifies the interpretation without crossing out its words.
	const story = one<SVGTextElement>("claim-2-text").getBBox();
	gsap.set(one("story-strike"), {
		attr: {
			x1: story.x - 2,
			x2: story.x + story.width + 2,
			y1: story.y + story.height + 3,
			y2: story.y + story.height + 3,
		},
	});
	// Measure the exact ALFA glyphs in the wrapped question for a same-face proxy.
	const question = one<SVGTextElement>("q-line");
	const subjectAt = (question.textContent ?? "").indexOf("ALFA");
	const subjectStart = question.getStartPositionOfChar(subjectAt);
	gsap.set(one("q-subject"), {
		attr: { x: subjectStart.x, y: subjectStart.y },
	});
	// Keep the measured line and its wrapping; isolate only the glyphs being handed off.
	let subjectGlyphs = question.querySelector('[data-f="q-original-subject"]');
	if (!subjectGlyphs) {
		const line = [...question.querySelectorAll("tspan")].find((part) =>
			part.textContent?.includes("ALFA"),
		);
		if (line) {
			const content = line.textContent ?? "";
			const at = content.indexOf("ALFA");
			subjectGlyphs = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"tspan",
			);
			subjectGlyphs.setAttribute("data-f", "q-original-subject");
			subjectGlyphs.textContent = "ALFA";
			const prefix = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"tspan",
			);
			prefix.setAttribute("data-f", "q-prefix");
			prefix.textContent = content.slice(0, at);
			const suffix = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"tspan",
			);
			suffix.setAttribute("data-f", "q-suffix");
			suffix.textContent = content.slice(at + 4);
			line.replaceChildren(prefix, subjectGlyphs, suffix);
		}
	}
	if (subjectGlyphs)
		gsap.set(subjectGlyphs, { opacity: 1, attr: { fill: "var(--tone-ink)" } });
	const questionRemainder = [...question.querySelectorAll("tspan")].filter(
		(part) => part !== subjectGlyphs && !part.querySelector("tspan"),
	);
	gsap.set(questionRemainder, { opacity: 1 });
	// Measure the prefix and mono digits independently to reserve their 10 px gap.
	const prefixBox = one<SVGTextElement>("rev-late").getBBox();
	gsap.set(one("rev-late-volume"), {
		attr: { x: prefixBox.x + prefixBox.width + 10 },
	});
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
	hide([one("q-tag"), one("q-big")], 8.6, 0.3, 0);
	tl.to(questionRemainder, { opacity: 0, duration: 0.3 }, 8.6);
	// ALFA's original glyphs remain until their same-frame handoff, after the lane clears.
	tl.set(question, { opacity: 0 }, 8.9);
	d.carry(
		one<SVGGraphicsElement>("q-subject"),
		one<SVGGraphicsElement>("field-0-subject"),
		8.9,
		{ duration: 0.75, arc: "x" },
	);
	show(heads[0], 8.8);
	tl.fromTo(fieldRows[0], { opacity: 0 }, { opacity: 1, duration: 0.35 }, 8.95);
	tl.fromTo(
		one("field-0-detail"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		9.65,
	);
	fieldRows.forEach((row, i) => {
		if (i === 0) return;
		// Keep the preceding pair's 1.2 s quiet; only the revision enters earlier.
		const at = i === 5 ? 14.1 : 9.4 + Math.floor(i / 2) * 2.2 + (i % 2) * 0.5;
		show(row, at, "right");
	});

	// ——— answer: paired evidence, then the interpretation and its counterevidence. ———
	tl.addLabel("answer", 17.6);
	hide([heads[0], ...fieldRows], 17.6);
	show(heads[1], 17.95);
	// One coordinated chart settles at 18.9, leaving 1.3 s before the evidence card.
	show(strikes, 18.4, "right");
	// Both tagged results settle at 20.7, leaving 1.9 s before the interpretation.
	show([claimRows[0], claimRows[1]], 20.2, "right");
	// The interpretation reads the 110 bar: the bar answers.
	show(claimRows[2], 22.6, "right");
	tl.fromTo(
		strikes[SERIES.indexOf(LEADER)],
		{ x: 0 },
		{ x: 6, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" },
		22.7,
	);
	stamp(tags[2], 23.0);
	// Against it: 500 of the 540 is one spread leg. The bar splits before the story is qualified.
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
	show(claimRows[3], 25.05, "right");
	stamp(tags[3], 25.55);
	d.trace(one<SVGPathElement>("spread-trace"), 25.6, { duration: 0.5 });
	// Once the evidence has qualified the story, clear the connector before the lock.
	hide(one("spread-trace"), 26.7, 0.3, 0);
	// The uncertainty treatment follows the evidence and leaves the interpretation readable.
	tl.fromTo(
		one("story-strike"),
		{ opacity: 1, scaleX: 0, transformOrigin: "0% 50%" },
		{ scaleX: 1, duration: 0.4, ease: "power2.out" },
		26.15,
	);
	// Keep the hero fully bright. The surrounding sentences remain readable above 0.6.
	tl.to(
		[claimRows[0], claimRows[1], claimRows[SPREAD_CARD]],
		{ opacity: 0.65, duration: 0.45 },
		27.95,
	);
	d.lock(lockClaim, 27.95, { around: claimRows[2], pad: L.narrow ? 4 : 6 });
	tl.addLabel("hero-lock", 27.95);
	show(heads[2], 27.95);
	// After the lock, once it has been seen: what the data doesn't hold.
	// Both the lock and its answer settle by 28.45: leave 1.5 s exclusively for them.
	// Put the unknown evidence tag beside the hatched, undelivered 120 row.
	stamp(tags[UNKNOWN_CARD], 30.35);

	// ——— log: revise, or start anew ———
	tl.addLabel("log", 32.05);
	d.swap([heads[1], heads[2]], heads[3], 32.05);
	hide(
		[
			...strikes,
			...claimRows,
			...tags,
			one("spread-seg"),
			one("story-strike"),
			lockClaim,
		],
		32.05,
		0.3,
	);
	// The outgoing chart is fully gone before any record glyph can enter its region.
	tl.fromTo(recs[0], { opacity: 0 }, { opacity: 1, duration: 0.3 }, 32.35);
	// Keep the 120 identity in the delivery row without a rushed flight from the chart.
	tl.fromTo(kids("late"), { opacity: 0 }, { opacity: 1, duration: 0.3 }, 32.35);
	// Delivery settles at 32.65; leave one quiet second before constructing the sum.
	// Establish the operands before revealing the settled equality and result.
	show([one("rev-base"), one("rev-plus"), one("rev-add")], 33.65, "below", 0.3);
	show([one("rev-equals"), one("rev-total")], 33.95, "below", 0.3);
	// Its source stays delivered; the saved card will still receive these same digits.
	tl.to(
		one("late-day"),
		{ opacity: 0.2, duration: 0.3, ease: "power3.out" },
		33.95,
	);
	// The completed total settles at 34.25 and remains as the only free-standing calculation.
	// The record receives the revised share with its answer at 36.55.
	const reviseAt = 36.55;
	tl.set(one("rec-0-box"), { attr: { class: "wt-focus-shape" } }, reviseAt);
	// Save in place: the crowded lane needs no flight or folded timestamp.
	// The history retains Monday's version while the current fields fade to Tuesday's.
	tl.to(
		[
			one("rec-0-answer"),
			one("rec-0-title"),
			one("rec-0-tag"),
			one("late-volume"),
			one("late-day"),
			one("late-strike"),
		],
		{ opacity: 0, duration: 0.3, ease: "power3.out" },
		reviseAt,
	);
	tl.fromTo(revs, { opacity: 0 }, { opacity: 1, duration: 0.3 }, reviseAt);
	// A new question: a new record, once the revision has been read.
	// Clear the proof before record 2 becomes readable in the same region.
	// All revised fields settle at 36.85; allow 1.1 s before clearing the proof.
	tl.to(
		kids("rev-proof"),
		{ opacity: 0, duration: 0.3, ease: "power3.out" },
		37.95,
	);
	// The proof is fully gone at 38.25, before record 2 starts its entrance.
	// Opacity reaches 0.6 at 38.311 and stays above it until 41.821: a 3.51 s hold.
	tl.fromTo(
		recs[1],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3, ease: "power3.out" },
		38.25,
	);
	tl.set(one("rec-0-box"), { attr: { class: "wt-panel-shape" } }, 38.15);
	tl.set(one("rec-1-box"), { attr: { class: "wt-focus-shape" } }, 38.15);
	show(heads[4], 38.1);
	show(one("rec-0-universe"), 38.55, "right", 0.3);
	show(one("universe-arrow"), 38.75, "right", 0.3);
	show(one("rec-1-universe"), 39.0, "right", 0.3);

	// ——— claim ———
	tl.addLabel("claim", 41.6);
	hide([heads[3], heads[4]], 41.6, 0.3);
	// Every outgoing mark finishes its exit before the claim enters at 41.9.
	tl.to(
		[recs[0], ...revs],
		{ opacity: 0, duration: 0.3, ease: "power3.out" },
		41.6,
	);
	// The original exit ease keeps record 2 readable for at least 3.5 s.
	hide([recs[1], ...kids("universe-change")], 41.6, 0.3);
	word(one("z-big"), 41.9);
	show(one("z-sub"), 42.3);

	// ——— next ———
	tl.addLabel("next", 45.9);
	hide(kids("claim"), 45.9);
	// The standard stagger settles at END; the player retains this complete final card.
	d.close(45.9);
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
