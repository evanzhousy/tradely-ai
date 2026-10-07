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
 * interpretation; then the 110 bar splits, 500 of it one spread leg, the interpretation
 * fades and glowing brackets lock on it; the 120 call's volume stays unknown. Last, the
 * log: Tuesday's data revises record 1 in place; a switch to puts opens record 2.
 *
 *   open      0–4        "Research questions"
 *   question  4–8.6      "Where’s the action in ALFA?" Checkable?
 *   frame     8.6–17.6   subject, universe; measure, interval; evidence, revision
 *   answer    17.6–30.4  hero: five strikes; observed; calculated; interpretation; the
 *                        split; locked; the gap
 *   log       30.4–39.1  record 1, revised in place; record 2 for puts
 *   claim     39.1–43.4  a question someone else can check
 *   next      43.4–45.4  Next: comparison groups
 */

const END = 45.4;
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
			narrow ? H * 0.58 + i * H * 0.068 : H * 0.28 + i * H * 0.095,
		claimH: H * (narrow ? 0.05 : 0.068),
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
		title: ["record 2 · Tue 10:00", "记录 2 · 周二 10:00"],
		question: ["Oct 18 puts: a new question", "10月18日 看跌：新问题"],
		answer: ["own universe, own answer", "独立范围，独立答案"],
		tag: ["new", "新建"],
	},
];

/** Record 1, once Tuesday's data is in: its title, answer and tag turn over in place. */
const revised = {
	title: ["record 1 · Tue 09:00", "记录 1 · 周二 09:00"],
	answer: [
		`120: ${LATE} · 110 leads, ${share(LEAD, WITH_LATE)} of ${count(WITH_LATE)}`,
		`120：${LATE} · 110 领先，占 ${count(WITH_LATE)} 的 ${share(LEAD, WITH_LATE)}`,
	],
	tag: ["revised", "已修订"],
} as const satisfies Record<string, Copy>;

const copy = {
	title: ["Research questions", "研究问题"],
	titleSub: ["what evidence can answer", "证据能回答什么"],
	qTag: ["a research question", "一个研究问题"],
	qLine: ["“Where’s the action in ALFA?”", "“ALFA 的热点在哪？”"],
	qBig: ["Can anyone check the answer?", "答案有人能核对吗？"],
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
					size={T.head}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>

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
						{t(field.value)}
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
			{/* The 110 bar's 500 that is one spread leg, laid over the bar when it splits. */}
			<rect
				data-f="spread-seg"
				x={L.barX}
				y={L.barRowY(leaderRow)}
				width={(SPREAD_LEG / MAX) * L.barMax}
				height={L.barH}
				rx={3}
				fill={`url(#hatch-${id})`}
				stroke="var(--diagram-unknown)"
				strokeWidth={1.5}
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
					<text
						data-f={`claim-${i}-text`}
						x={L.claimX + 12}
						y={L.claimY(i) + L.claimH / 2 + text * 0.36}
						className={`wt-film-type ${claim.evidence === "unknown" ? "wt-film-dim" : ""}`}
						style={{ fontSize: text }}
					>
						{t(narrow ? claim.short : claim.text)}
					</text>
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
						height={L.recH}
						rx={12}
						className="wt-panel-shape"
					/>
					<text
						data-f={`rec-${i}-title`}
						x={margin + 16}
						y={L.recY(i) + L.recH * 0.26}
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(record.title).toUpperCase()}
					</text>
					<text
						data-f={`rec-${i}-tag`}
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
						data-f={`rec-${i}-answer`}
						x={margin + 16}
						y={L.recY(i) + L.recH * 0.82}
						className="wt-film-type wt-film-dim"
						style={{ fontSize: text }}
					>
						{t(record.answer)}
					</text>
				</g>
			))}
			{/* Record 1 revised: the same card, its title, answer and tag turned over. */}
			<g data-f="rev">
				<text
					data-f="rev-title"
					x={margin + 16}
					y={L.recY(0) + L.recH * 0.26}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(revised.title).toUpperCase()}
				</text>
				<text
					data-f="rev-tag"
					x={margin + room - 16}
					y={L.recY(0) + L.recH * 0.26}
					textAnchor="end"
					className="wt-film-tag wt-film-accent"
					style={{ fontSize: T.small }}
				>
					{t(revised.tag).toUpperCase()}
				</text>
				<text
					data-f="rev-answer"
					x={margin + 16}
					y={L.recY(0) + L.recH * 0.82}
					className="wt-film-type wt-film-accent"
					style={{ fontSize: text }}
				>
					{t(revised.answer)}
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
	const revs = ["rev-title", "rev-tag", "rev-answer"].map((name) => one(name));

	d.hidden([
		...flat("q"),
		...heads,
		...fieldRows,
		...strikes,
		...claimRows,
		...tags,
		one("spread-seg"),
		lockClaim,
		...recs,
		...revs,
		...kids("claim"),
	]);
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
	hide(flat("q"), 8.6);
	show(heads[0], 8.8);
	fieldRows.forEach((row, i) => {
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
	show(claimRows[3], 24.8, "right");
	stamp(tags[3], 25.2);
	tl.to(one("claim-2-text"), { opacity: 0.5, duration: 0.5 }, 26.2);
	d.lock(lockClaim, 26.8, { around: claimRows[2], pad: L.narrow ? 4 : 6 });
	tl.addLabel("hero-lock", 26.8);
	show(heads[2], 26.8);
	// And what the data doesn't hold.
	show(claimRows[4], 26.85, "right");
	stamp(tags[4], 27.25);

	// ——— log: revise, or start anew ———
	tl.addLabel("log", 30.4);
	d.swap([heads[1], heads[2]], heads[3], 30.4);
	hide([...strikes, ...claimRows, ...tags, one("spread-seg"), lockClaim], 30.4);
	show(recs[0], 31.1, "right");
	// Tuesday's data: record 1 turns over in place.
	tl.set(one("rec-0-box"), { attr: { class: "wt-focus-shape" } }, 34.7);
	d.flip(one("rec-0-title"), revs[0], 34.7);
	tl.set(one("rec-0-title"), { opacity: 0 }, 35.0);
	d.flip(one("rec-0-tag"), revs[1], 34.7);
	tl.set(one("rec-0-tag"), { opacity: 0 }, 35.0);
	d.flip(one("rec-0-answer"), revs[2], 34.8);
	tl.set(one("rec-0-answer"), { opacity: 0 }, 35.1);
	// A new question: a new record.
	show(recs[1], 35.5, "right");
	tl.set(one("rec-0-box"), { attr: { class: "wt-panel-shape" } }, 35.5);
	tl.set(one("rec-1-box"), { attr: { class: "wt-focus-shape" } }, 35.5);
	show(heads[4], 35.5);

	// ——— claim ———
	tl.addLabel("claim", 39.1);
	hide([heads[3], heads[4], ...recs, ...revs], 39.1);
	word(one("z-big"), 39.4);
	show(one("z-sub"), 39.8);

	// ——— next ———
	tl.addLabel("next", 43.4);
	hide(kids("claim"), 43.4);
	d.close(43.4);
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
