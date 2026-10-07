import { gsap } from "gsap";
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
	Brackets,
	createDirector,
	EndCard,
	filmFrame,
	Lines,
	lineCount,
	TitleCard,
	Word,
} from "../walkthrough/film-kit";
import { textWidth } from "../walkthrough/text-measure";
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
 * the session screen that answers it. Then the session a report shows: opened at 8:00 on
 * Tuesday, before the open, the screener shows Monday, the latest completed session; opened
 * at 10:00 on Monday, mid-session, "latest" slides back over the weekend and it shows
 * Friday. Last, Edit with AI copies Daily Market Recap into a private copy that slides out
 * and changes: you open your copy, and a colleague still opens the official one.
 *
 *   open      0–4        "Recipes"
 *   question  4–9.6      "Which contracts traded far above their open interest?"
 *   catalog   9.6–15.8   three kinds; the screen
 *   session   15.8–28.5  Tue 8:00 → Monday; Mon 10:00, mid-session → Friday, locked
 *   fork      28.5–40    Edit with AI; your private copy; a colleague's view; cut: the claim
 *   next      40–42      Next: read a recipe like an auditor
 */

const END = 42;
const KINDS: readonly RecipeKind[] = ["lookup", "screen", "report"];
const SCREEN = "unusual-options-activity";
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
		headerY: H * (narrow ? 0.6 : 0.58),
		headerH: H * (narrow ? 0.28 : 0.27),
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
		"The whole market, one session: a screen.",
		"整个市场的一个时段：筛选。",
	],
	screenHeadShort: ["Across the market: a screen.", "覆盖整个市场：筛选。"],
	openHead: [
		"You open it Tuesday, 8:00, before the open.",
		"你在周二 8:00、开盘前打开它。",
	],
	openHeadShort: ["Tuesday, 8:00, before the open.", "周二 8:00，开盘前。"],
	latestHead: [
		"It shows Monday: the latest completed session.",
		"它显示周一：最近一个完整的交易时段。",
	],
	latestHeadShort: ["It shows Monday.", "它显示周一。"],
	closed: ["closed", "休市"],
	latest: ["latest", "最新"],
	trading: ["trading", "交易中"],
	screener: [
		"Unusual Options Activity Screener",
		"Unusual Options Activity Screener",
	],
	screenerShort: ["UOA Screener", "UOA Screener"],
	sessionUnknown: ["Session · ?", "交易时段 · ?"],
	mondayHead: [
		"Open it Monday, 10:00, mid-session.",
		"周一 10:00、盘中打开它。",
	],
	mondayHeadShort: ["Monday, 10:00, mid-session.", "周一 10:00，盘中。"],
	fridayHead: ["It shows Friday.", "它显示周五。"],
	editChip: ["Edit with AI", "Edit with AI"],
	forkHead: [
		"Edit with AI forks a private copy.",
		"Edit with AI 分叉出一个私有副本。",
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
		"Pick by the question; read the session.",
		"按问题挑选，读清时段。",
	],
	claimSub: [
		"Lookups: one symbol. Screens: the market. Reports: a session.",
		"查询：一个标的。筛选：整个市场。报告：一个时段。",
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
	const claim = (big: Copy, sub: Copy) => (
		<g data-f="claim">
			<Lines
				name="z-big"
				text={t(big)}
				x={W / 2}
				y={H * 0.42}
				size={T.title}
				maxWidth={room}
			/>
			<Lines
				name="z-sub"
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
	const chipW = textWidth(t(copy.editChip), T.small) + 18;
	/** The opening question is a sentence: on a phone it takes a smaller size. */
	const qSize = narrow ? T.head * 1.2 : T.title;
	const headerLine = (i: number) =>
		L.headerY + L.headerH * (i === 0 ? 0.25 : i === 1 ? 0.6 : 0.88);
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
										y={L.stripTop - (narrow ? 14 : 10)}
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
						<rect
							data-f="latest-box"
							x={L.dayX(SESSION_DATE) + dayFraction(OPEN) * L.colW}
							y={L.stripTop}
							width={(dayFraction(CLOSE) - dayFraction(OPEN)) * L.colW}
							height={L.stripH}
							rx={6}
							className="wt-focus-shape"
						/>
						{(
							[
								["latest-mon", SESSION_DATE, copy.latest, "wt-accent"],
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
							cy={L.stripTop - (narrow ? 2 : 4)}
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
								style={{ fontSize: T.head * 1.3 }}
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
						{/* What Edit with AI copies: the card's frame, sliding out of the official one. */}
						<rect
							data-f="copy-frame"
							x={L.cardX(1)}
							y={L.forkTop}
							width={L.half}
							height={L.cardType.height}
							rx={12}
							className="wt-focus-shape"
							// An outline only: the official card's text shows through as it leaves.
							style={{ fill: "none" }}
						/>
						<g data-f="edit-chip">
							<rect
								x={L.cardX(0)}
								y={L.forkTop + L.cardType.height + 12}
								width={chipW}
								height={T.small + 12}
								rx={7}
								className="wt-chip"
							/>
							<text
								x={L.cardX(0) + chipW / 2}
								y={L.forkTop + L.cardType.height + 12 + T.small + 3}
								textAnchor="middle"
								className="wt-chip-text"
								style={{ fontSize: T.small }}
							>
								{t(copy.editChip)}
							</text>
						</g>
						<circle
							data-f="viewer-colleague-dot"
							cx={L.cardX(0) + L.half / 2}
							cy={L.forkTop}
							r={6}
							className="wt-chip"
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
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
			<Lines
				name="s-head"
				text={t(narrow ? copy.screenHeadShort : copy.screenHead)}
				x={L.margin}
				y={
					L.headY +
					lineCount(t(narrow ? copy.kindsHead : copy.kindsHead), room, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
			{headline("o-head", copy.openHead, copy.openHeadShort)}
			<Lines
				name="t-head"
				text={t(narrow ? copy.latestHeadShort : copy.latestHead)}
				x={L.margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.openHeadShort : copy.openHead),
						room,
						T.head,
					) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
			{headline("m-head", copy.mondayHead, copy.mondayHeadShort)}
			<Lines
				name="m2-head"
				text={t(copy.fridayHead)}
				x={L.margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.mondayHeadShort : copy.mondayHead),
						room,
						T.head,
					) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
			<Brackets name="lock-session" glow />
			{headline("f-head", copy.forkHead, copy.forkHeadShort)}
			<Lines
				name="c-head"
				text={t(narrow ? copy.colleagueHeadShort : copy.colleagueHead)}
				x={L.margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.forkHeadShort : copy.forkHead),
						room,
						T.head,
					) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
			{claim(copy.claimBig, copy.claimSub)}
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
	const { tl, one, kids, show, hide, rise, sink } = d;
	/** A mark lands slightly large and settles, without overshoot. */
	const land = (target: Element, time: number, duration = 0.55) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.12, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration, ease: "power3.out" },
			time,
		);
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
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			at,
		);
	const sessions = [PREVIOUS_SESSION_DATE, SESSION_DATE, NEXT_SESSION_DATE].map(
		(date) => one(`session-${date}`),
	);

	const lockSession = one<SVGGraphicsElement>("lock-session");

	d.hidden([
		one("calendar"),
		one("fork"),
		...cards,
		...officialRecipes.map((recipe) => focus(recipe.id)),
		...kids("catalog").flatMap((row) =>
			[...row.children].filter((el) => el.tagName === "text"),
		),
		...sessions,
		one("latest-box"),
		one("latest-mon"),
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
		one("copy-frame"),
		one("edit-chip"),
		one("viewer"),
		one("viewer-you"),
		one("viewer-colleague"),
		one("viewer-colleague-dot"),
		...flat("q"),
		...[
			"k-head",
			"s-head",
			"o-head",
			"t-head",
			"m-head",
			"m2-head",
			"f-head",
			"c-head",
		].map((name) => one(name)),
		lockSession,
		...kids("claim"),
	]);
	// The copy's frame starts on the official card.
	gsap.set(one("copy-frame"), { x: -(L.half + L.gap) });

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	word(one("q-big"), 4.8);
	show(one("q-line"), 6.0);

	// ——— catalog: the question picks the recipe ———
	tl.addLabel("catalog", 9.6);
	hide(flat("q"), 9.6);
	show(one("k-head"), 9.8, "above");
	rise(9.9);
	kids("catalog").forEach((row, k) => {
		const label = [...row.children].find((el) => el.tagName === "text");
		if (label) show(label, 10.3 + k * 0.4);
	});
	officialRecipes.forEach((recipe) => {
		const k = KINDS.indexOf(recipe.kind);
		const i = officialRecipes
			.filter((r) => r.kind === recipe.kind)
			.findIndex((r) => r.id === recipe.id);
		// A card is a group: it slides in rather than scaling about its corner.
		show(one(`card-${recipe.id}`), 10.4 + k * 0.4 + i * 0.12, "below", 0.4);
	});
	// The question's answer: the session screen.
	show(one("s-head"), 12.2);
	tl.to(focus(SCREEN), { opacity: 1, duration: 0.4 }, 12.4);
	tl.to(others(SCREEN), { opacity: 0.35, duration: 0.4 }, 12.4);

	// ——— session: the calendar, not the clock ———
	tl.addLabel("session", 15.8);
	hide([one("k-head"), one("s-head")], 15.8);
	sink(15.8);
	tl.set(one("catalog"), { opacity: 0 }, 16.2);
	tl.set(one("calendar"), { opacity: 1 }, 16.2);
	show(one("o-head"), 16.15, "above");
	rise(16.3);
	// At Tuesday 8:00 Friday and Monday are done; Tuesday hasn't opened.
	tl.to(sessions.slice(0, 2), { opacity: 1, duration: 0.4 }, 16.8);
	tl.to(sessions[2], { opacity: 0.35, duration: 0.4 }, 16.8);
	tl.to(one("now-line"), { opacity: 1, duration: 0.3 }, 17.3);
	land(one("now-dot"), 17.3, 0.35);
	show(one("header"), 17.7);
	show([one("sess-unknown"), one("ran-tue")], 17.9);
	show(one("t-head"), 18.8);
	tl.to(one("latest-box"), { opacity: 1, duration: 0.4 }, 18.8);
	show(one("latest-mon"), 18.9);
	d.flip(one("sess-unknown"), one("sess-mon"), 19.0);
	// Opened on Monday morning instead: Monday is trading, so "latest" goes back over the
	// weekend to Friday.
	d.swap([one("o-head"), one("t-head")], one("m-head"), 22.4);
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
		22.75,
	);
	tl.to(sessions[1], { opacity: 0.7, duration: 0.4 }, 23.2);
	const back = L.dayX(PREVIOUS_SESSION_DATE) - L.dayX(SESSION_DATE);
	tl.to(
		one("latest-box"),
		{
			attr: { x: L.dayX(PREVIOUS_SESSION_DATE) + dayFraction(OPEN) * L.colW },
			duration: 0.8,
			ease: "power2.inOut",
		},
		23.3,
	);
	tl.to(
		one("latest-mon"),
		{
			attr: { x: L.dayX(SESSION_DATE) + L.colW / 2 + back },
			duration: 0.8,
			ease: "power2.inOut",
		},
		23.3,
	);
	show(one("trading-mon"), 24.0);
	d.flip(one("sess-mon"), one("sess-fri"), 24.1);
	d.swap(one("ran-tue"), one("ran-mon"), 24.1);
	// The hero: Monday morning's report shows Friday.
	d.lock(lockSession, 24.9, { around: one("sess-fri"), pad: 10 });
	tl.addLabel("hero-lock", 24.9);
	show(one("m2-head"), 24.9);
	tl.to(one("ran-mon"), { opacity: 0.4, duration: 0.4 }, 25.3);

	// ——— fork: official and yours ———
	tl.addLabel("fork", 28.5);
	hide([one("m-head"), one("m2-head"), lockSession], 28.5);
	sink(28.5);
	tl.set(one("calendar"), { opacity: 0 }, 28.9);
	tl.set(one("fork"), { opacity: 1 }, 28.9);
	rise(28.95);
	show(one("fork-official"), 29.0);
	land(one("edit-chip"), 29.5);
	// Edit with AI: the card's frame slides out of the official one and becomes your copy,
	// its own label and its changed spotlight in the accent.
	tl.set(one("copy-frame"), { opacity: 1 }, 30.0);
	tl.to(one("copy-frame"), { x: 0, duration: 0.7, ease: "power2.inOut" }, 30.0);
	show(one("f-head"), 30.0, "above");
	tl.to(one("fork-copy"), { opacity: 1, duration: 0.4 }, 30.7);
	tl.set(one("copy-frame"), { opacity: 0 }, 31.1);
	land(one("viewer"), 31.5);
	show(one("viewer-you"), 31.7);
	// A colleague opens the same recipe: the official one.
	show(one("c-head"), 32.1);
	land(one("viewer-colleague-dot"), 32.1);
	show(one("viewer-colleague"), 32.3);
	// Cut: the claim.
	hide([one("f-head"), one("c-head")], 35.6);
	sink(35.6);
	word(one("z-big"), 36.0);
	show(one("z-sub"), 36.4);

	// ——— next ———
	tl.addLabel("next", 40.0);
	hide(kids("claim"), 40.0);
	d.close(40.0);
	return tl;
}

export const tradingflowRecipesFilm: Film = {
	id: "tradingflow-recipes",
	label: [
		"Recipes, as a short film: the question of which contracts traded far above their open interest on Monday; TradingFlow's six official recipes in three kinds, the question lighting the session screen that answers it; the market calendar, where a report opened at 8:00 on Tuesday shows Monday, the latest completed session, and one opened at 10:00 on Monday, mid-session, shows Friday; and Edit with AI copying Daily Market Recap into a private copy that only you open, while a colleague opens the official recipe, unchanged",
		"Recipe 短片：周一哪些合约的成交远超其未平仓量；TradingFlow 的六个官方 Recipe 分三种类型，这个问题点亮回答它的时段筛选；交易日历上，周二 8:00 打开的报告显示周一，即最近一个完整的时段，而周一 10:00、盘中打开则显示周五；以及 Edit with AI 把 Daily Market Recap 复制成只有你会打开的私有副本，而同事打开的仍是未改动的官方 Recipe",
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
