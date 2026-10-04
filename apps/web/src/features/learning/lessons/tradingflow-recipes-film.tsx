import {
	type Copy,
	dayLabel,
	NEXT_SESSION_DATE,
	officialRecipes,
	PREVIOUS_SESSION_DATE,
	pick,
	type RecipeKind,
	recipeKinds,
	SESSION_DATE,
} from "@/content/world";
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
	CLOSE,
	chapters,
	dayFraction,
	days,
	moments,
	OPEN,
	sessionDays,
	shortDay,
} from "./tradingflow-recipes-model";

/*
 * Recipes, as a film. It opens on a question, "Which contracts traded far above their open
 * interest on Monday?", and the six official recipes in three kinds: the question lights
 * the session screen that answers it, and a one-symbol question lights a quick lookup. Then
 * the session a report shows: opened at 8:00 on Tuesday, before the open, the screener
 * shows Monday, the latest completed session; opened at 10:00 on Monday it would show
 * Friday. Last, Daily Market Recap forked into a private copy: you open your copy, and a
 * colleague still opens the official one.
 *
 *   open      0–4      "Recipes"
 *   question  4–9.5    "Which contracts traded far above their open interest?"
 *   catalog   9.5–19   three kinds; the screen; the lookup; cut: start from the question
 *   session   19–30.5  Tue 8:00 → Monday; Mon 10:00 → Friday; cut: the calendar, not the clock
 *   fork      30.5–41.5 official; your private copy; a colleague's view; cut: the claim
 *   next      41.5–44  Next: read a recipe like an auditor
 */

const END = 44;
const KINDS: readonly RecipeKind[] = ["lookup", "screen", "report"];
const SCREEN = "unusual-options-activity";
const LOOKUP = "ticker-snapshot";
/** Titles that fit half a phone's width. */
const shortTitles: Record<string, string> = {
	"ticker-snapshot": "Ticker Snapshot",
	"gamma-levels": "Gamma Levels",
	"unusual-options-activity": "UOA Screener",
	"sweeps-vs-blocks": "Sweeps vs Blocks",
	"market-recap": "Market Recap",
	"vol-surface": "Vol Surface",
};
/** The chapters' names on a phone's half-width card. */
const chaptersShort: readonly Copy[] = [
	["Market tone", "市场基调"],
	["Money flow", "资金流向"],
	["Vol pricing", "波动率定价"],
];
const TUESDAY = moments["tue-0800"];
const MONDAY = moments["mon-1000"];

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin } = frame;
	const gap = Math.max(10, width * 0.02);
	const half = (width - 2 * margin - gap) / 2;
	const colW = (width - 2 * margin) / days.length;
	const dayX = (date: string) => margin + days.indexOf(date) * colW;
	return {
		...frame,
		gap,
		half,
		cardX: (i: number) => margin + i * (half + gap),
		// The catalog: a row of two cards per kind.
		rowY: (k: number) =>
			H * (narrow ? 0.3 : 0.29) + k * H * (narrow ? 0.2 : 0.19),
		cardH: H * (narrow ? 0.11 : 0.1),
		// The calendar.
		colW,
		dayX,
		nowX: (moment: (typeof moments)[keyof typeof moments]) =>
			dayX(moment.day) + dayFraction(moment.at) * colW,
		stripTop: H * (narrow ? 0.37 : 0.34),
		stripH: H * 0.12,
		headerY: H * (narrow ? 0.62 : 0.6),
		headerH: H * (narrow ? 0.25 : 0.23),
		// The two recipe cards.
		forkTop: H * (narrow ? 0.36 : 0.32),
		/** A recipe card's type: title size, line size, and the step between lines. */
		cardType: (() => {
			const title = narrow ? frame.type.body : frame.type.head * 0.85;
			const size = narrow ? frame.type.small : frame.type.body;
			const step = size * 1.75;
			const pad = narrow ? 12 : 18;
			return { title, size, step, pad, height: pad * 2 + title + step * 5.6 };
		})(),
	};
}

const copy = {
	title: ["Recipes", "Recipe"],
	titleSub: ["research that re-runs on fresh data", "在新数据上重跑的研究"],
	qTag: ["your question", "你的问题"],
	qBig: [
		"Which contracts traded far above their open interest on Monday?",
		"周一哪些合约的成交远超其未平仓量？",
	],
	qLine: [
		"Six official recipes. One answers it.",
		"六个官方 Recipe，只有一个回答它。",
	],
	kindsHead: [
		"Six official recipes, three kinds.",
		"六个官方 Recipe，三种类型。",
	],
	screenHead: [
		"Far above open interest, across the market: a session screen.",
		"远超未平仓量，覆盖整个市场：时段筛选。",
	],
	screenHeadShort: ["Across the market: a screen.", "覆盖整个市场：筛选。"],
	lookupHead: [
		"Everything about ALFA's options today: one symbol, a quick lookup.",
		"ALFA 今天期权的全部概况：一个标的，快速查询。",
	],
	lookupHeadShort: ["One symbol: a quick lookup.", "一个标的：快速查询。"],
	pickBig: ["Start from the question.", "从问题出发。"],
	pickSub: [
		"Lookups answer one symbol, screens filter the whole market for a session, reports walk a session chapter by chapter.",
		"查询回答一个标的，筛选在一个时段内过滤整个市场，报告逐章讲解一个时段。",
	],
	openHead: [
		"You open the screener at 8:00 on Tuesday, before the open.",
		"你在周二 8:00、开盘前打开筛选器。",
	],
	openHeadShort: ["Tuesday, 8:00, before the open.", "周二 8:00，开盘前。"],
	latestHead: [
		"It shows Monday: the latest completed session.",
		"它显示周一：最近一个完整的交易时段。",
	],
	latestHeadShort: ["It shows Monday.", "它显示周一。"],
	mondayHead: [
		"Opened at 10:00 on Monday, it would show Friday.",
		"如果周一 10:00 打开，它会显示周五。",
	],
	mondayHeadShort: ["Mon 10:00: it shows Friday.", "周一 10:00：显示周五。"],
	closed: ["closed", "休市"],
	latest: ["latest", "最新"],
	trading: ["trading", "交易中"],
	screener: [
		"Unusual Options Activity Screener",
		"Unusual Options Activity Screener",
	],
	screenerShort: ["UOA Screener", "UOA Screener"],
	sessionUnknown: ["Session · ?", "交易时段 · ?"],
	calendarBig: [
		"“Latest” follows the market calendar, not the clock.",
		"“最新”遵循交易日历，而不是钟表。",
	],
	calendarSub: [
		"Every number in a report belongs to the session in its header.",
		"报告里的每个数字都属于页眉上写的那个交易时段。",
	],
	officialHead: [
		"Daily Market Recap is official: every paid account runs the same one.",
		"Daily Market Recap 是官方 Recipe：所有付费账户运行同一个版本。",
	],
	officialHeadShort: ["An official recipe.", "一个官方 Recipe。"],
	forkHead: [
		"Edit with AI forks it into a private copy you can change.",
		"Edit with AI 把它分叉成一个你可以修改的私有副本。",
	],
	forkHeadShort: ["Fork: a private copy.", "分叉：私有副本。"],
	colleagueHead: [
		"A colleague opens it: the official recipe, unchanged.",
		"同事打开它：未改动的官方 Recipe。",
	],
	colleagueHeadShort: ["A colleague: the official one.", "同事：官方版本。"],
	official: [
		"Official · maintained by TradingFlow",
		"官方 · 由 TradingFlow 维护",
	],
	officialShort: ["Official", "官方"],
	private: ["Private · only you", "私有 · 仅你可见"],
	spotlightOfficial: ["Spotlight: the headline name", "焦点：当天的头条标的"],
	spotlightOfficialShort: ["Spotlight: headline", "焦点：头条"],
	spotlightCopy: ["Spotlight: ALFA", "焦点：ALFA"],
	you: ["you", "你"],
	colleague: ["a colleague", "同事"],
	claimBig: [
		"Pick by the question, read the session, know your version.",
		"按问题挑选，读清时段，认清版本。",
	],
	claimSub: [
		"A recipe is research saved to run again; its header says what it shows.",
		"Recipe 是保存下来可以重跑的研究；页眉说明它展示的是什么。",
	],
	nextBig: [
		"Next: read a recipe like an auditor",
		"下一课：像审计员一样读 Recipe",
	],
	nextSub: ["trace each sentence to where it comes from", "追溯每一句话的出处"],
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
			maxWidth={room}
			anchor="start"
		/>
	);
	const claim = (name: string, big: Copy, sub: Copy) => (
		<g data-f={name}>
			<Lines
				name={`${name}-big`}
				text={t(big)}
				x={W / 2}
				y={H * 0.42}
				size={T.title}
				maxWidth={room}
			/>
			<Lines
				name={`${name}-sub`}
				text={t(sub)}
				x={W / 2}
				y={
					H * 0.42 +
					T.title * 1.15 +
					(lineCount(t(big), room, T.title) - 1) * T.title * 1.35
				}
				size={T.body}
				maxWidth={room}
				className="wt-film-type wt-film-dim"
			/>
		</g>
	);
	const statusY = L.stripTop + L.stripH + T.small * 1.8;
	/** The opening question is a sentence: on a phone it takes a smaller size. */
	const qSize = narrow ? T.head * 1.2 : T.title;
	const headerLine = (i: number) =>
		L.headerY + L.headerH * (i === 0 ? 0.3 : i === 1 ? 0.62 : 0.86);
	const card = (side: "official" | "copy") => {
		const x = L.cardX(side === "official" ? 0 : 1);
		const C = L.cardType;
		const line = (i: number) => L.forkTop + C.pad + C.title + i * C.step;
		const spotlight =
			side === "copy"
				? copy.spotlightCopy
				: narrow
					? copy.spotlightOfficialShort
					: copy.spotlightOfficial;
		return (
			<g data-f={`fork-${side}`}>
				<rect
					x={x}
					y={L.forkTop}
					width={L.half}
					height={C.height}
					rx={12}
					className={side === "copy" ? "wt-focus-shape" : "wt-panel-shape"}
				/>
				<text
					x={x + C.pad}
					y={line(0)}
					className="wt-film-type"
					style={{ fontSize: C.title }}
				>
					{narrow ? "Market Recap" : "Daily Market Recap"}
				</text>
				<text
					x={x + C.pad}
					y={line(1)}
					className={`wt-film-type ${side === "copy" ? "wt-film-accent" : "wt-film-dim"}`}
					style={{ fontSize: C.size }}
				>
					{t(
						side === "copy"
							? copy.private
							: narrow
								? copy.officialShort
								: copy.official,
					)}
				</text>
				{(narrow ? chaptersShort : chapters).map((chapter, i) => (
					<text
						key={chapter[0]}
						x={x + C.pad}
						y={line(i + 2.4)}
						className="wt-film-type wt-film-dim"
						style={{ fontSize: C.size }}
					>
						{`${i + 1}. ${t(chapter)}`}
					</text>
				))}
				<text
					data-f={`spot-${side}`}
					x={x + C.pad}
					y={line(chapters.length + 2.4)}
					className={`wt-film-type ${side === "copy" ? "wt-film-accent" : "wt-film-dim"}`}
					style={{ fontSize: C.size }}
				>
					{`${chapters.length + 1}. ${t(spotlight)}`}
				</text>
			</g>
		);
	};
	return (
		<>
			<Backdrop frame={L} />

			<g data-f="depth">
				<g data-f="world">
					{/* The catalog. */}
					<g data-f="catalog">
						{KINDS.map((kind, k) => (
							<g key={kind}>
								<text
									x={margin}
									y={L.rowY(k) - 8}
									className="wt-film-tag"
									style={{ fontSize: T.small }}
								>
									{t(recipeKinds[kind]).toUpperCase()}
								</text>
								{officialRecipes
									.filter((recipe) => recipe.kind === kind)
									.map((recipe, i) => (
										<g key={recipe.id} data-f={`card-${recipe.id}`}>
											<rect
												x={L.cardX(i)}
												y={L.rowY(k)}
												width={L.half}
												height={L.cardH}
												rx={10}
												className="wt-panel-shape"
											/>
											<rect
												data-f={`focus-${recipe.id}`}
												x={L.cardX(i)}
												y={L.rowY(k)}
												width={L.half}
												height={L.cardH}
												rx={10}
												className="wt-focus-shape"
											/>
											<text
												x={L.cardX(i) + 14}
												y={L.rowY(k) + L.cardH / 2 + T.body * 0.36}
												className="wt-film-type"
												style={{ fontSize: T.body }}
											>
												{narrow ? shortTitles[recipe.id] : recipe.title}
											</text>
										</g>
									))}
							</g>
						))}
					</g>

					{/* The market calendar and the report's header. */}
					<g data-f="calendar">
						{days.map((date) => {
							const x = L.dayX(date);
							return (
								<g key={date}>
									<text
										x={x + L.colW / 2}
										y={L.stripTop - 10}
										textAnchor="middle"
										className="wt-small"
									>
										{narrow ? shortDay(date, locale) : t(dayLabel(date))}
									</text>
									{sessionDays.has(date) ? (
										<rect
											data-f={`session-${date}`}
											x={x + dayFraction(OPEN) * L.colW}
											y={L.stripTop}
											width={(dayFraction(CLOSE) - dayFraction(OPEN)) * L.colW}
											height={L.stripH}
											rx={6}
											className="wt-panel-shape"
										/>
									) : (
										<text
											x={x + L.colW / 2}
											y={L.stripTop + L.stripH / 2 + 4}
											textAnchor="middle"
											className="wt-small"
										>
											{t(copy.closed)}
										</text>
									)}
								</g>
							);
						})}
						{[SESSION_DATE, PREVIOUS_SESSION_DATE].map((date) => (
							<rect
								key={date}
								data-f={`latest-box-${date}`}
								x={L.dayX(date) + dayFraction(OPEN) * L.colW}
								y={L.stripTop}
								width={(dayFraction(CLOSE) - dayFraction(OPEN)) * L.colW}
								height={L.stripH}
								rx={6}
								className="wt-focus-shape"
							/>
						))}
						{(
							[
								["latest-mon", SESSION_DATE, copy.latest, "wt-accent"],
								["latest-fri", PREVIOUS_SESSION_DATE, copy.latest, "wt-accent"],
								["trading-mon", SESSION_DATE, copy.trading, ""],
							] as const
						).map(([name, date, label, tone]) => (
							<text
								key={name}
								data-f={name}
								x={L.dayX(date) + L.colW / 2}
								y={statusY}
								textAnchor="middle"
								className={`wt-small ${tone}`}
							>
								{t(label)}
							</text>
						))}
						<line
							data-f="now-line"
							x1={L.nowX(TUESDAY)}
							x2={L.nowX(TUESDAY)}
							y1={L.stripTop - 4}
							y2={L.stripTop + L.stripH + 4}
							className="wt-axis"
							strokeWidth={2}
						/>
						<circle
							data-f="now-dot"
							cx={L.nowX(TUESDAY)}
							cy={L.stripTop - 4}
							r={4.5}
							className="wt-chip"
						/>
						<g data-f="header">
							<rect
								x={margin}
								y={L.headerY}
								width={W - 2 * margin}
								height={L.headerH}
								rx={12}
								className="wt-panel-shape"
							/>
							<text
								x={margin + 16}
								y={headerLine(0)}
								className="wt-film-type"
								style={{ fontSize: T.body }}
							>
								{t(narrow ? copy.screenerShort : copy.screener)}
							</text>
						</g>
						{(
							[
								["sess-unknown", t(copy.sessionUnknown), "wt-film-dim"],
								[
									"sess-mon",
									t([
										`Session · ${dayLabel(SESSION_DATE)[0]}`,
										`交易时段 · ${dayLabel(SESSION_DATE)[1]}`,
									]),
									"wt-film-accent",
								],
								[
									"sess-fri",
									t([
										`Session · ${dayLabel(PREVIOUS_SESSION_DATE)[0]}`,
										`交易时段 · ${dayLabel(PREVIOUS_SESSION_DATE)[1]}`,
									]),
									"wt-film-accent",
								],
							] as const
						).map(([name, text, tone]) => (
							<text
								key={name}
								data-f={name}
								x={margin + 16}
								y={headerLine(1)}
								className={`wt-film-type ${tone}`}
								style={{ fontSize: T.head }}
							>
								{text}
							</text>
						))}
						{(
							[
								["ran-tue", TUESDAY.label],
								["ran-mon", MONDAY.label],
							] as const
						).map(([name, label]) => (
							<text
								key={name}
								data-f={name}
								x={margin + 16}
								y={headerLine(2)}
								className="wt-small"
							>
								{t([`Ran · ${label[0]}`, `运行于 · ${label[1]}`])}
							</text>
						))}
					</g>

					{/* The official recipe and your fork. */}
					<g data-f="fork">
						{card("official")}
						{card("copy")}
						<circle
							data-f="viewer"
							cx={L.cardX(1) + L.half / 2}
							cy={L.forkTop}
							r={6}
							className="wt-chip"
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
						<text
							data-f="viewer-you"
							x={L.cardX(1) + L.half / 2}
							y={L.forkTop - 14}
							textAnchor="middle"
							className="wt-film-type wt-film-accent"
							style={{ fontSize: T.body }}
						>
							{t(copy.you)}
						</text>
						<text
							data-f="viewer-colleague"
							x={L.cardX(0) + L.half / 2}
							y={L.forkTop - 14}
							textAnchor="middle"
							className="wt-film-type wt-film-accent"
							style={{ fontSize: T.body }}
						>
							{t(copy.colleague)}
						</text>
					</g>
				</g>
			</g>

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				<Word
					name="q-tag"
					x={W / 2}
					y={H * 0.3}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.qTag).toUpperCase()}
				</Word>
				<Lines
					name="q-big"
					text={t(copy.qBig)}
					x={W / 2}
					y={H * 0.3 + qSize * 1.5}
					size={qSize}
					maxWidth={room}
				/>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={
						H * 0.3 +
						qSize * 1.5 +
						(lineCount(t(copy.qBig), room, qSize) - 1) * qSize * 1.35 +
						qSize * 1.4
					}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("k-head", copy.kindsHead, copy.kindsHead)}
			{headline("s-head", copy.screenHead, copy.screenHeadShort)}
			{headline("l-head", copy.lookupHead, copy.lookupHeadShort)}
			{claim("pick", copy.pickBig, copy.pickSub)}
			{headline("o-head", copy.openHead, copy.openHeadShort)}
			{headline("t-head", copy.latestHead, copy.latestHeadShort)}
			{headline("m-head", copy.mondayHead, copy.mondayHeadShort)}
			{claim("calendar-claim", copy.calendarBig, copy.calendarSub)}
			{headline("f-head", copy.officialHead, copy.officialHeadShort)}
			{headline("p-head", copy.forkHead, copy.forkHeadShort)}
			{headline("c-head", copy.colleagueHead, copy.colleagueHeadShort)}
			{claim("claim", copy.claimBig, copy.claimSub)}
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
	const { tl, one, kids, show, hide, pop, rise, sink } = d;
	const flat = (name: string) =>
		kids(name).flatMap((el) => (el.tagName === "g" ? [...el.children] : [el]));
	const cards = officialRecipes.map((recipe) => one(`card-${recipe.id}`));
	const focus = (id: string) => one(`focus-${id}`);
	const others = (id: string) =>
		officialRecipes.filter((r) => r.id !== id).map((r) => one(`card-${r.id}`));
	const word = (target: Element, at: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
			at,
		);
	const sessions = [PREVIOUS_SESSION_DATE, SESSION_DATE, NEXT_SESSION_DATE].map(
		(date) => one(`session-${date}`),
	);

	d.hidden([
		one("calendar"),
		one("fork"),
		...cards,
		...officialRecipes.map((recipe) => focus(recipe.id)),
		...kids("catalog").flatMap((row) =>
			[...row.children].filter((el) => el.tagName === "text"),
		),
		...sessions,
		one(`latest-box-${SESSION_DATE}`),
		one(`latest-box-${PREVIOUS_SESSION_DATE}`),
		one("latest-mon"),
		one("latest-fri"),
		one("trading-mon"),
		one("now-line"),
		one("now-dot"),
		one("header"),
		one("sess-unknown"),
		one("sess-mon"),
		one("sess-fri"),
		one("ran-tue"),
		one("ran-mon"),
		one("fork-official"),
		one("fork-copy"),
		one("viewer"),
		one("viewer-you"),
		one("viewer-colleague"),
		...flat("q"),
		...[
			"k-head",
			"s-head",
			"l-head",
			"o-head",
			"t-head",
			"m-head",
			"f-head",
			"p-head",
			"c-head",
		].map((name) => one(name)),
		...kids("pick"),
		...kids("calendar-claim"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	word(one("q-big"), 4.8);
	show(one("q-line"), 6.6);

	// ——— catalog: the question picks the recipe ———
	tl.addLabel("catalog", 9.5);
	hide(flat("q"), 9.5);
	show(one("k-head"), 9.7, "above");
	rise(9.8);
	kids("catalog").forEach((row, k) => {
		const label = [...row.children].find((el) => el.tagName === "text");
		if (label) show(label, 10.2 + k * 0.4);
	});
	officialRecipes.forEach((recipe) => {
		const k = KINDS.indexOf(recipe.kind);
		const i = officialRecipes
			.filter((r) => r.kind === recipe.kind)
			.findIndex((r) => r.id === recipe.id);
		// A card is a group: it slides in rather than scaling about its corner.
		show(one(`card-${recipe.id}`), 10.3 + k * 0.4 + i * 0.12, "below", 0.4);
	});
	d.swap(one("k-head"), one("s-head"), 12.0);
	tl.to(focus(SCREEN), { opacity: 1, duration: 0.4 }, 12.4);
	tl.to(others(SCREEN), { opacity: 0.35, duration: 0.4 }, 12.4);
	d.swap(one("s-head"), one("l-head"), 14.4);
	tl.to(focus(SCREEN), { opacity: 0, duration: 0.3 }, 14.8);
	tl.to(one(`card-${SCREEN}`), { opacity: 0.35, duration: 0.3 }, 14.8);
	tl.to(one(`card-${LOOKUP}`), { opacity: 1, duration: 0.3 }, 14.8);
	tl.to(focus(LOOKUP), { opacity: 1, duration: 0.4 }, 14.9);
	// Cut: the rule.
	hide(one("l-head"), 16.6);
	sink(16.6);
	word(one("pick-big"), 17.0);
	show(one("pick-sub"), 17.5);

	// ——— session: the calendar, not the clock ———
	tl.addLabel("session", 19);
	hide(kids("pick"), 19.0);
	tl.set(one("catalog"), { opacity: 0 }, 19.1);
	tl.set(one("calendar"), { opacity: 1 }, 19.1);
	show(one("o-head"), 19.2, "above");
	rise(19.3);
	// At Tuesday 8:00 Friday and Monday are done; Tuesday hasn't opened.
	tl.to(sessions.slice(0, 2), { opacity: 1, duration: 0.4 }, 19.9);
	tl.to(sessions[2], { opacity: 0.35, duration: 0.4 }, 19.9);
	tl.to(one("now-line"), { opacity: 1, duration: 0.3 }, 20.5);
	pop(one("now-dot"), 20.5, 0.35);
	show(one("header"), 21.0);
	show([one("sess-unknown"), one("ran-tue")], 21.2);
	d.swap(one("o-head"), one("t-head"), 22.6);
	tl.to(one(`latest-box-${SESSION_DATE}`), { opacity: 1, duration: 0.4 }, 23.0);
	show(one("latest-mon"), 23.1);
	d.flip(one("sess-unknown"), one("sess-mon"), 23.2);
	// Opened on Monday morning instead.
	d.swap(one("t-head"), one("m-head"), 25.0);
	tl.to(
		[one("now-line"), one("now-dot")],
		{
			attr: {
				x1: L.nowX(MONDAY),
				x2: L.nowX(MONDAY),
				cx: L.nowX(MONDAY),
			},
			duration: 0.9,
			ease: "power2.inOut",
		},
		25.4,
	);
	tl.to(sessions[1], { opacity: 0.7, duration: 0.4 }, 25.8);
	tl.to(
		[one(`latest-box-${SESSION_DATE}`), one("latest-mon")],
		{ opacity: 0, duration: 0.3 },
		25.8,
	);
	tl.to(
		one(`latest-box-${PREVIOUS_SESSION_DATE}`),
		{ opacity: 1, duration: 0.4 },
		26.1,
	);
	show([one("latest-fri"), one("trading-mon")], 26.2);
	d.flip(one("sess-mon"), one("sess-fri"), 26.3);
	d.swap(one("ran-tue"), one("ran-mon"), 26.3);
	// Cut: the rule.
	hide(one("m-head"), 27.8);
	sink(27.8);
	word(one("calendar-claim-big"), 28.2);
	show(one("calendar-claim-sub"), 28.7);

	// ——— fork: official and yours ———
	tl.addLabel("fork", 30.5);
	hide(kids("calendar-claim"), 30.5);
	tl.set(one("calendar"), { opacity: 0 }, 30.6);
	tl.set(one("fork"), { opacity: 1 }, 30.6);
	show(one("f-head"), 30.7, "above");
	rise(30.8);
	show(one("fork-official"), 31.3);
	d.swap(one("f-head"), one("p-head"), 33.0);
	show(one("fork-copy"), 33.4, "right");
	pop(one("viewer"), 34.4);
	show(one("viewer-you"), 34.6);
	// A colleague opens the same recipe.
	d.swap(one("p-head"), one("c-head"), 36.0);
	hide(one("viewer-you"), 36.4);
	tl.to(
		one("viewer"),
		{
			attr: { cx: L.cardX(0) + L.half / 2 },
			duration: 0.8,
			ease: "power2.inOut",
		},
		36.4,
	);
	show(one("viewer-colleague"), 37.1);
	tl.to(one("fork-copy"), { opacity: 0.4, duration: 0.4 }, 37.1);
	// Cut: the claim.
	hide(one("c-head"), 38.6);
	sink(38.6);
	word(one("claim-big"), 39.0);
	show(one("claim-sub"), 39.5);

	// ——— next ———
	tl.addLabel("next", 41.5);
	hide(kids("claim"), 41.5);
	d.close(41.5);
	return tl;
}

export const tradingflowRecipesFilm: Film = {
	id: "tradingflow-recipes",
	label: [
		"Recipes, as a short film: the question of which contracts traded far above their open interest on Monday; TradingFlow's six official recipes in three kinds, the question lighting the session screen that answers it and a one-symbol question lighting a quick lookup; the market calendar, where a report opened at 8:00 on Tuesday shows Monday, the latest completed session, and one opened at 10:00 on Monday shows Friday; and Daily Market Recap forked into a private copy that only you open, while a colleague opens the official recipe, unchanged",
		"Recipe 短片：周一哪些合约的成交远超其未平仓量；TradingFlow 的六个官方 Recipe 分三种类型，这个问题点亮回答它的时段筛选，一个单标的问题点亮快速查询；交易日历上，周二 8:00 打开的报告显示周一，即最近一个完整的时段，而周一 10:00 打开则显示周五；以及 Daily Market Recap 被分叉成只有你会打开的私有副本，而同事打开的仍是未改动的官方 Recipe",
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Recipes", "Recipe"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "catalog", label: ["Three kinds", "三种类型"] },
		{ id: "session", label: ["The session", "交易时段"] },
		{ id: "fork", label: ["Official vs yours", "官方与你的"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
