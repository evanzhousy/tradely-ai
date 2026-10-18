import { useId } from "react";
import {
	type Copy,
	dayLabel,
	mondayScreen,
	NEXT_SESSION_DATE,
	officialRecipes,
	PREVIOUS_SESSION_DATE,
	pick,
	type RecipeKind,
	recipeKinds,
	runScreen,
	SESSION_DATE,
	screenDefaults,
} from "@/content/world";
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
 * Recipes, as a film. It opens on a question, "Which contracts trade well above open
 * interest Monday?", and the six official recipes in three kinds: the question lights
 * the session screen that answers it. Then the session a report shows: opened at 8:00 on
 * Tuesday, before the open, the screener shows Monday, the latest completed session; opened
 * at 10:00 on Monday, with most of Monday's session still to trade, the "latest" marker jumps
 * back to Friday. The Friday session stays latest until Monday's close at 16:30. After the
 * lock releases, Monday finishes and becomes the latest session. Last, Edit with AI copies
 * Daily Market Recap into a private copy linked to its action chip
 * and changes: you open your copy, and a colleague still opens the official one.
 *
 *   open      0–4        "Recipes"
 *   question  4–9.6      "Which contracts trade well above open interest Monday?"
 *   catalog   9.6–16.8   three kinds; the screen
 *   session   16.8–32.7  Tue 8:00 → Monday; Mon 10:00 → Friday; Mon 16:30 → Monday
 *   fork      32.7–41.4  official + colleague; linked inherited copy; your edit
 *   claim     41.4–45.4 Pick by the question; read the session
 *   next      45.4–47.4  Next: read a recipe like an auditor
 */

const END = 47.4;
const KINDS: readonly RecipeKind[] = ["lookup", "screen", "report"];
const SCREEN = "unusual-options-activity";
/** Concise catalog names on both frames, fitting half a phone's width. */
const shortTitles: Record<string, string> = {
	"ticker-snapshot": "Ticker Snapshot",
	"gamma-levels": "Gamma Levels",
	"unusual-options-activity": "UOA Screener",
	"sweeps-vs-blocks": "Sweeps vs Blocks",
	"market-recap": "Market Recap",
	"vol-surface": "Vol Surface",
};
const TUESDAY = moments["tue-0800"];
const MONDAY = moments["mon-1000"];
const AFTER_CLOSE = moments["mon-1630"];
const AFTER_CLOSE_TIME = `${Math.floor(AFTER_CLOSE.at * 24)}:${Math.round(
	(AFTER_CLOSE.at * 24 * 60) % 60,
)
	.toString()
	.padStart(2, "0")}`;
const MINUTES_TRADED = Math.round((MONDAY.at - OPEN) * 24 * 60);
const SCREEN_EXAMPLE = runScreen(mondayScreen, screenDefaults, SESSION_DATE)[0];

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin } = frame;
	const gap = Math.max(10, width * 0.02);
	const half = (width - 2 * margin - gap) / 2;
	const colW = (width - 2 * margin) / days.length;
	const dayX = (date: string) => margin + days.indexOf(date) * colW;
	const cardH = H * (narrow ? 0.11 : 0.1);
	const screenCardH = H * (narrow ? 0.225 : 0.22);
	// Reserve the label's full type height above its baseline, plus 10 px of
	// clearance from UOA. Keep the report cards 12 px inside the frame too.
	const reportY = Math.max(
		H * (narrow ? 0.86 : 0.85),
		H * 0.6 + screenCardH + 10 + frame.type.small + 8,
	);
	const reportCardH = Math.min(cardH, H - 12 - reportY);
	return {
		...frame,
		gap,
		half,
		cardX: (i: number) => margin + i * (half + gap),
		// A clear gap keeps the question visible while the catalog settles, then lets
		// its phrase land above UOA without crossing a card title or a kind label.
		rowY: (k: number) =>
			k === 0 ? H * (narrow ? 0.3 : 0.27) : k === 1 ? H * 0.6 : reportY,
		cardH,
		screenCardH,
		screenProof: {
			width: width - 2 * margin,
			size: narrow ? frame.type.num : frame.type.body,
			barW: Math.min(120, (width - 2 * margin) * 0.33),
			volumeY: H * 0.6 + frame.type.body * 2.4 + 10 + frame.type.num * 1.35,
		},
		reportCardH,
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
			const size = frame.type.body * (narrow ? 1.2 : 1);
			const step = size * 1.75;
			const pad = narrow ? 12 : 18;
			return {
				title,
				size,
				step,
				pad,
				height: pad * 2 + title + step * (narrow ? 5.4 : 5.6),
			};
		})(),
	};
}

const copy = {
	title: ["Recipes", "Recipe"],
	titleSub: ["research re-run on fresh data", "在新数据上重跑的研究"],
	qTag: ["your question", "你的问题"],
	qBig: ["Which contracts trade", "周一哪些合约"],
	qSignal: ["well above open interest", "成交超未平仓量？"],
	qTail: ["Monday?", ""],
	qLine: ["One official recipe answers it.", "唯一的官方 Recipe 回答。"],
	kindsHead: [
		"Six official recipes, three kinds.",
		"六个官方 Recipe，三种类型。",
	],
	screenHead: ["A screen compares the whole market.", "筛选比较整个市场。"],
	screenHeadShort: ["Across the market: a screen.", "覆盖整个市场：筛选。"],
	openHead: [
		"You open it Tuesday, 8:00, before the open.",
		"你在周二 8:00、开盘前打开它。",
	],
	openHeadShort: ["Tuesday, 8:00, before the open.", "周二 8:00，开盘前。"],
	latestHead: [
		"It shows Monday’s completed session.",
		"它显示周一已完成的时段。",
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
	mondayHead: [
		"Open it Monday at 10:00: still trading.",
		"周一 10:00 打开：仍在交易。",
	],
	mondayHeadShort: [
		"Monday at 10:00: still trading.",
		"周一 10:00：仍在交易。",
	],
	fridayHead: [
		"Friday remains latest until Monday closes.",
		"周一收盘前，最近时段仍是周五。",
	],
	fridayHeadShort: ["Friday until close.", "周一收盘前仍是周五。"],
	closeLine: ["Latest session: Monday", "最新时段：周一"],
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
	privateShort: ["Private, only you", "私有，仅你可见"],
	spotlightOfficialShort: ["Spotlight: headline", "焦点：头条"],
	spotlightCopy: ["Spotlight: ALFA", "焦点：ALFA"],
	claimBig: [
		"Pick by the question; read the session.",
		"按问题挑选，读清时段。",
	],
	claimSub: ["Edit your copy; the official stays.", "只改私有副本，官方不变。"],
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
	const id = useId().replace(/:/g, "");
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
	const chipX = L.cardX(0) + L.half - chipW;
	const chipY = L.forkTop + L.cardType.height + 12;
	const chipH = T.small + 12;
	const linkX = L.cardX(0) + L.half + L.gap / 2;
	const linkY = L.forkTop + L.cardType.height * 0.6;
	/** The opening question is a sentence: on a phone it takes a smaller size. */
	const qSize = narrow ? T.head * 1.2 : T.title * 0.85;
	const qRows = locale === "zh" ? 2 : 3;
	const qTop = H * 0.48 - ((qRows - 1) * qSize * 1.35) / 2;
	const headerLine = (i: number) =>
		L.headerY + L.headerH * (i === 0 ? 0.2 : i === 1 ? 0.6 : 0.88);
	const card = (side: "official" | "copy") => {
		const privateCard = side !== "official";
		const x = L.cardX(side === "official" ? 0 : 1);
		const C = L.cardType;
		const line = (i: number) => L.forkTop + C.pad + C.title + i * C.step;
		const spotlight =
			side === "copy" ? copy.spotlightCopy : copy.spotlightOfficialShort;
		const owner = t(
			privateCard
				? narrow
					? copy.privateShort
					: copy.private
				: narrow
					? copy.officialShort
					: copy.official,
		);
		const ownerClass = `wt-film-type ${privateCard ? "wt-film-accent" : "wt-film-dim"}`;
		return (
			<g data-f={`fork-${side}`}>
				<rect
					x={x}
					y={L.forkTop}
					width={L.half}
					height={C.height}
					rx={12}
					className={privateCard ? "wt-focus-shape" : "wt-panel-shape"}
				/>
				<text
					x={x + C.pad}
					y={line(0)}
					className="wt-film-type"
					style={{ fontSize: C.title }}
				>
					{narrow ? "Market Recap" : "Daily Market Recap"}
				</text>
				{narrow ? (
					<text
						data-f={`owner-${side}`}
						x={x + C.pad}
						y={line(1)}
						className={ownerClass}
						style={{ fontSize: T.body * 1.1 }}
					>
						{/* Keep the longer English ownership label on one line inside
						    the existing card gutters, without shrinking its type height. */}
						<tspan
							textLength={
								privateCard &&
								locale === "en" &&
								textWidth(owner, T.body * 1.1) * 0.86 > L.half - 2 * C.pad
									? L.half - 2 * C.pad
									: undefined
							}
							lengthAdjust="spacingAndGlyphs"
						>
							{owner}
						</tspan>
					</text>
				) : (
					<Lines
						name={`owner-${side}`}
						text={owner}
						x={x + C.pad}
						y={line(1)}
						anchor="start"
						maxWidth={L.half - 2 * C.pad}
						size={C.size}
						className={ownerClass}
					/>
				)}
				{!narrow
					? chapters.map((chapter, i) => (
							<text
								key={chapter[0]}
								x={x + C.pad}
								y={line(i + 2.4)}
								className="wt-film-type wt-film-dim"
								style={{ fontSize: C.size }}
							>
								{`${i + 1}. ${t(chapter)}`}
							</text>
						))
					: null}
				{side === "copy" ? (
					<Lines
						name="spot-copy-was"
						x={x + C.pad}
						y={line(narrow ? 3.8 : chapters.length + 2.4)}
						text={`${narrow ? "" : `${chapters.length + 1}. `}${t(copy.spotlightOfficialShort)}`}
						anchor="start"
						maxWidth={L.half - 2 * C.pad}
						className="wt-film-type wt-film-dim"
						size={C.size}
					/>
				) : null}
				<Lines
					name={`spot-${side}`}
					x={x + C.pad}
					y={line(narrow ? 3.8 : chapters.length + 2.4)}
					text={`${narrow ? "" : `${chapters.length + 1}. `}${t(spotlight)}`}
					anchor="start"
					maxWidth={L.half - 2 * C.pad}
					className={`wt-film-type ${side === "copy" ? "wt-film-accent" : "wt-film-dim"}`}
					size={C.size}
				/>
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
									data-f={`kind-${kind}`}
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
												data-f={`panel-${recipe.id}`}
												x={L.cardX(i)}
												y={L.rowY(k)}
												width={L.half}
												height={
													recipe.id === SCREEN
														? L.screenCardH
														: kind === "report"
															? L.reportCardH
															: L.cardH
												}
												rx={10}
												className="wt-panel-shape"
											/>
											<rect
												data-f={`focus-${recipe.id}`}
												x={L.cardX(i)}
												y={L.rowY(k)}
												width={L.half}
												height={
													recipe.id === SCREEN
														? L.screenCardH
														: kind === "report"
															? L.reportCardH
															: L.cardH
												}
												rx={10}
												className="wt-focus-shape"
											/>
											<text
												x={L.cardX(i) + 14}
												y={
													L.rowY(k) +
													(recipe.id === SCREEN
														? T.body + 10
														: (kind === "report" ? L.reportCardH : L.cardH) /
																2 +
															T.body * 0.36)
												}
												className="wt-film-type"
												style={{ fontSize: T.body }}
											>
												{shortTitles[recipe.id]}
											</text>
											{recipe.id === SCREEN ? (
												<g data-f="uoa-proof">
													<Word
														name="uoa-contract"
														x={L.cardX(i) + 14}
														y={L.rowY(k) + T.body * 2.4 + 10}
														size={T.body}
														anchor="start"
														className="wt-film-type wt-film-dim"
													>
														{`${SCREEN_EXAMPLE.symbol} · ${SCREEN_EXAMPLE.strike}${SCREEN_EXAMPLE.right === "put" ? "P" : "C"}`}
													</Word>
													{(
														[
															[
																"volume",
																t(["Vol", "成交"]),
																SCREEN_EXAMPLE.volume,
															],
															[
																"oi",
																t(["OI", "未平仓"]),
																SCREEN_EXAMPLE.openInterest,
															],
														] as const
													).map(([name, label, value], j) => {
														const y = L.rowY(k) + T.body * (3.8 + j * 1.4) + 10;
														const barW = Math.min(100, L.half * 0.26);
														return (
															<g key={name} data-f={`uoa-${name}`}>
																<Word
																	name={`uoa-${name}-value`}
																	x={L.cardX(i) + 14}
																	y={y}
																	size={T.body}
																	anchor="start"
																	className="wt-film-type"
																>
																	{`${label} ${value.toLocaleString("en-US")}`}
																</Word>
																<rect
																	data-f={`uoa-${name}-bar`}
																	x={L.cardX(i) + L.half - 14 - barW}
																	y={y - T.body * 0.65}
																	width={(value / SCREEN_EXAMPLE.volume) * barW}
																	height={T.body * 0.55}
																	rx={1}
																	fill={
																		name === "volume"
																			? "var(--tone-ink)"
																			: "var(--muted-foreground)"
																	}
																/>
															</g>
														);
													})}
												</g>
											) : null}
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
										data-f={`day-${date}`}
										x={x + L.colW / 2}
										y={L.stripTop - 14}
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
											data-f={`closed-${date}`}
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
						<Lines
							name="close-line"
							text={t(copy.closeLine)}
							x={margin}
							y={L.headY}
							size={T.body}
							maxWidth={room}
							anchor="start"
							className="wt-film-type"
						/>
						{/* Monday at 10:00: the part that has traded, and the rest still to come. */}
						<defs>
							<Hatch id={`hatch-${id}`} />
						</defs>
						<rect
							data-f="mon-done"
							x={L.dayX(SESSION_DATE) + dayFraction(OPEN) * L.colW}
							y={L.stripTop}
							width={(dayFraction(MONDAY.at) - dayFraction(OPEN)) * L.colW}
							height={L.stripH}
							rx={3}
							className="wt-panel-shape"
							style={{
								fill: "var(--tone-ink)",
							}}
						/>
						<rect
							data-f="mon-rest"
							x={L.nowX(MONDAY)}
							y={L.stripTop}
							width={(dayFraction(CLOSE) - dayFraction(MONDAY.at)) * L.colW}
							height={L.stripH}
							rx={3}
							fill={`url(#hatch-${id})`}
						/>
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
						<Word
							name="mon-elapsed"
							x={L.dayX(SESSION_DATE) + L.colW / 2}
							y={statusY + T.small * 1.4}
							size={T.small}
							className="wt-film-type"
						>
							<tspan>
								{t([
									`${MINUTES_TRADED} min traded`,
									`已交易${MINUTES_TRADED}分钟`,
								])}
							</tspan>
						</Word>
						<Word
							name="completion-clock"
							x={L.nowX(MONDAY)}
							y={statusY + T.small * 1.4}
							size={T.body}
							className="wt-film-num wt-film-accent"
						>
							{AFTER_CLOSE_TIME}
						</Word>
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
							cy={L.stripTop - 2}
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
						{/* The report's session follows the run: Monday at 8:00 shows Monday; Monday at 10:00 shows Friday. */}
						{(
							[
								["sess-mon", t(dayLabel(SESSION_DATE)), "wt-film-accent"],
								[
									"sess-close",
									t(dayLabel(AFTER_CLOSE.latest)),
									"wt-film-accent",
								],
							] as const
						).map(([name, date, tone]) => (
							<text
								key={name}
								data-f={name}
								x={margin + 16}
								y={headerLine(1)}
								className={`wt-film-type ${tone}`}
								style={{ fontSize: T.head * 1.3 }}
							>
								{t(["Session · ", "交易时段 · "])}
								<tspan data-f={`${name}-date`}>{date}</tspan>
							</text>
						))}
						<text
							data-f="sess-fri"
							x={margin + 16}
							y={headerLine(1)}
							className="wt-film-type wt-film-accent"
							style={{ fontSize: T.head * 1.3 }}
						>
							{t(["Session · ", "交易时段 · "])}
							<tspan data-f="sess-fri-date">
								{t(dayLabel(PREVIOUS_SESSION_DATE))}
							</tspan>
						</text>
						{(
							[
								["ran-tue", TUESDAY.label],
								["ran-mon", MONDAY.label],
								["ran-close", AFTER_CLOSE.label],
							] as const
						).map(([name, label]) => (
							<text
								key={name}
								data-f={name}
								x={margin + 16}
								y={headerLine(2)}
								className="wt-film-type"
								style={{ fontSize: T.body }}
							>
								{t([`Ran · ${label[0]}`, `运行于 · ${label[1]}`])}
							</text>
						))}
					</g>

					{/* The official recipe and your fork. */}
					<g data-f="fork">
						{card("official")}
						{card("copy")}
						{/* The action-to-copy link stays outside both cards' text lanes. */}
						<path
							data-f="fork-link"
							d={`M ${chipX + chipW} ${chipY + chipH / 2} H ${linkX} V ${linkY} H ${L.cardX(1)}`}
							fill="none"
							stroke="var(--diagram-accent)"
							strokeWidth={2}
							strokeLinejoin="round"
						/>
						<g data-f="edit-chip">
							<rect
								x={chipX}
								y={chipY}
								width={chipW}
								height={chipH}
								rx={7}
								className="wt-chip"
							/>
							<rect
								data-f="edit-active"
								x={chipX}
								y={chipY}
								width={chipW}
								height={chipH}
								rx={7}
								fill="none"
								stroke="var(--foreground)"
								strokeWidth={2}
							/>
							<text
								x={chipX + chipW / 2}
								y={chipY + T.small + 3}
								textAnchor="middle"
								className="wt-chip-text"
								style={{ fontSize: T.small }}
							>
								{t(copy.editChip)}
							</text>
						</g>
					</g>
				</g>
			</g>

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				<Word
					name="q-tag"
					x={W / 2}
					y={qTop - qSize * 1.5}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.qTag).toUpperCase()}
				</Word>
				<Word name="q-big" x={W / 2} y={qTop} size={qSize}>
					{t(copy.qBig)}
				</Word>
				<Word
					name="q-signal"
					x={W / 2}
					y={qTop + qSize * 1.35}
					size={qSize}
					className="wt-film-type wt-film-accent"
				>
					{t(copy.qSignal)}
				</Word>
				<Word name="q-tail" x={W / 2} y={qTop + qSize * 2.7} size={qSize}>
					{t(copy.qTail)}
				</Word>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={qTop + (qRows - 1) * qSize * 1.35 + qSize * 1.65}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			<Word
				name="screen-signal"
				x={margin}
				y={L.rowY(1) - T.small * 2.6}
				size={T.body}
				anchor="start"
				className="wt-film-type wt-film-accent"
			>
				{t(copy.qSignal)}
			</Word>
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
				text={t(narrow ? copy.fridayHeadShort : copy.fridayHead)}
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
		...kids("uoa-proof"),
		...officialRecipes.map((recipe) => focus(recipe.id)),
		...kids("catalog").flatMap((row) =>
			[...row.children].filter((el) => el.tagName === "text"),
		),
		...sessions,
		one("mon-done"),
		one("mon-rest"),
		one("mon-elapsed"),
		one("completion-clock"),
		one("latest-box"),
		one("latest-mon"),
		one("trading-mon"),
		one("now-line"),
		one("now-dot"),
		one("header"),
		one("sess-mon"),
		one("sess-fri"),
		one("sess-close"),
		one("ran-tue"),
		one("ran-mon"),
		one("ran-close"),
		one("fork-official"),
		one("fork-copy"),
		one("spot-copy"),
		one("edit-chip"),
		one("edit-active"),
		one("fork-link"),
		...flat("q"),
		one("screen-signal"),
		...[
			"k-head",
			"s-head",
			"o-head",
			"t-head",
			"m-head",
			"m2-head",
			"close-line",
			"f-head",
			"c-head",
		].map((name) => one(name)),
		lockSession,
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
	word(one("q-signal"), 4.8);
	word(one("q-tail"), 4.8);
	show(one("q-line"), 6.0);

	// ——— catalog: the question picks the recipe ———
	tl.addLabel("catalog", 9.6);
	hide(
		flat("q").filter((el) => el !== one("q-signal")),
		9.6,
	);
	// All six cards settle at 10.75; the full classification stays readable for 2 s.
	// The phrase waits in the gap above UOA, clear of the catalog, and both
	// marks stay untransformed. Its 0.7 s flight settles at 13.45.
	d.carry(
		one<SVGGraphicsElement>("q-signal"),
		one<SVGGraphicsElement>("screen-signal"),
		12.75,
		{ duration: 0.7, arc: "y" },
	);
	show(one("k-head"), 9.8, "above");
	rise(9.9);
	kids("catalog").forEach((row, k) => {
		const label = [...row.children].find((el) => el.tagName === "text");
		if (label) show(label, 10.0 + k * 0.2, "below", 0.35);
	});
	officialRecipes.forEach((recipe) => {
		const k = KINDS.indexOf(recipe.kind);
		const i = officialRecipes
			.filter((r) => r.kind === recipe.kind)
			.findIndex((r) => r.id === recipe.id);
		// A card is a group: it slides in rather than scaling about its corner.
		show(
			one(`card-${recipe.id}`),
			9.9 + k * 0.2 + i * 0.1,
			L.narrow && recipe.kind === "report" ? "above" : "below",
			0.35,
		);
	});
	// The question's answer: the session screen.
	// Settled model values and bars enter together: no counted value can contradict
	// its comparison. The shorter OI bar shares the volume bar's scale.
	tl.fromTo(
		one("uoa-contract"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		12.75,
	);
	["uoa-volume", "uoa-oi"].forEach((name, i) => {
		tl.fromTo(
			one(name),
			{ opacity: 0 },
			{ opacity: 1, duration: 0.3 },
			12.9 + i * 0.1,
		);
	});
	show(one("s-head"), 13.2);
	tl.to(focus(SCREEN), { opacity: 1, duration: 0.4 }, 13.05);
	if (L.narrow) {
		// Step the neighbour below 0.25 before the selected panel widens. Both rows use one
		// scale and settle at 13.3, preserving the full 3.5 s comparison hold.
		const neighbour = one("card-sweeps-vs-blocks");
		tl.to(
			others(SCREEN).filter((card) => card !== neighbour),
			{ opacity: 0.2, duration: 0.3 },
			12.75,
		);
		tl.to(neighbour, { opacity: 0, duration: 0.3 }, 12.75);
		tl.to(
			KINDS.map((kind) => one(`kind-${kind}`)),
			{ opacity: 0.25, duration: 0.3 },
			12.75,
		);
		tl.fromTo(
			[one(`panel-${SCREEN}`), focus(SCREEN)],
			{ attr: { width: L.half } },
			{
				attr: { width: L.screenProof.width },
				duration: 0.35,
				ease: "power2.out",
			},
			12.95,
		);
		["volume", "oi"].forEach((name, i) => {
			const y = L.screenProof.volumeY + i * L.screenProof.size * 1.25;
			const oldY = L.rowY(1) + L.type.body * (3.8 + i * 1.4) + 10;
			const oldBarW = Math.min(100, L.half * 0.26);
			const value =
				name === "volume" ? SCREEN_EXAMPLE.volume : SCREEN_EXAMPLE.openInterest;
			const ratio = value / SCREEN_EXAMPLE.volume;
			tl.fromTo(
				one(`uoa-${name}-value`),
				{ fontSize: L.type.body, attr: { y: oldY } },
				{
					fontSize: L.screenProof.size,
					attr: { y },
					duration: 0.35,
					ease: "power2.out",
				},
				12.95,
			);
			tl.fromTo(
				one(`uoa-${name}-bar`),
				{
					attr: {
						x: L.cardX(0) + L.half - 14 - oldBarW,
						y: oldY - L.type.body * 0.65,
						width: ratio * oldBarW,
						height: L.type.body * 0.55,
					},
				},
				{
					attr: {
						x: L.cardX(0) + L.screenProof.width - 14 - L.screenProof.barW,
						y: y - L.screenProof.size * 0.65,
						width: ratio * L.screenProof.barW,
						height: L.screenProof.size * 0.55,
					},
					duration: 0.35,
					ease: "power2.out",
				},
				12.95,
			);
		});
	} else {
		tl.to(others(SCREEN), { opacity: 0.35, duration: 0.4 }, 13.4);
	}

	// ——— session: the calendar, not the clock ———
	tl.addLabel("session", 16.8);
	hide([one("k-head"), one("s-head")], 16.8);
	// Preserve the phrase's 3.75 s landed hold after delaying its carry.
	// Its proof sinks with it; Tuesday arrives only after both have left.
	hide(one("screen-signal"), 17.2, 0.35, 0);
	sink(17.2);
	tl.set(one("catalog"), { opacity: 0 }, 17.6);
	tl.set(one("calendar"), { opacity: 1 }, 17.6);
	show(one("o-head"), 17.6, "above");
	rise(17.6);
	// At Tuesday 8:00 Friday and Monday are done; Tuesday hasn't opened.
	tl.to(sessions.slice(0, 2), { opacity: 1, duration: 0.4 }, 17.8);
	tl.to(sessions[2], { opacity: 0.35, duration: 0.4 }, 17.8);
	tl.to(one("now-line"), { opacity: 1, duration: 0.3 }, 18.3);
	land(one("now-dot"), 18.3, 0.35);
	show(one("header"), 18.7);
	show(one("ran-tue"), 18.9);
	show(one("t-head"), 19.8);
	tl.to(one("latest-box"), { opacity: 1, duration: 0.4 }, 19.8);
	show(one("latest-mon"), 19.9);
	// Reveal the settled session with its evidence, without an unknown or a flip.
	show(one("sess-mon"), 20.0);
	// Opened on Monday morning instead: Monday is trading, so "latest" goes back over the
	// weekend to Friday.
	d.swap([one("o-head"), one("t-head")], one("m-head"), 23.4);
	// Cut the dependent marks together at the new run: no clock movement can
	// disagree with its run label, session date, elapsed time, or latest day.
	const mondayX = L.nowX(MONDAY);
	const mondayDoneWidth = (dayFraction(MONDAY.at) - dayFraction(OPEN)) * L.colW;
	const fridayBoxX = L.dayX(PREVIOUS_SESSION_DATE) + dayFraction(OPEN) * L.colW;
	const friday = one(`day-${PREVIOUS_SESSION_DATE}`);
	tl.set(one("now-line"), { attr: { x1: mondayX, x2: mondayX } }, 24.35);
	tl.set(one("now-dot"), { attr: { cx: mondayX } }, 24.35);
	// The old run's marks leave over the motion floor, gone at the cut; the new run's
	// come on over the same 0.3 s after it, so nothing pops.
	hide(one("ran-tue"), 24.05, 0.3, 0);
	hide(one("sess-mon"), 24.05, 0.3, 0);
	tl.set(one("mon-done"), { attr: { width: mondayDoneWidth } }, 24.35);
	tl.fromTo(
		[
			one("ran-mon"),
			one("trading-mon"),
			one("mon-rest"),
			one("mon-elapsed"),
			one("mon-done"),
		],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3, ease: "power3.out", immediateRender: false },
		24.35,
	);
	tl.fromTo(
		one("sess-fri"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3, ease: "power3.out", immediateRender: false },
		24.35,
	);
	tl.set(one("latest-box"), { attr: { x: fridayBoxX } }, 24.35);
	tl.set(
		one("latest-mon"),
		{ attr: { x: L.dayX(PREVIOUS_SESSION_DATE) + L.colW / 2 } },
		24.35,
	);
	tl.set(friday, { attr: { class: "wt-small wt-accent" } }, 24.35);
	// The prior latest cue steps aside before the new report snapshot appears.
	hide(one("latest-mon"), 23.75, 0.3, 0);
	// Friday is already known when the Monday 10:00 run and calendar state change together.
	show(one("latest-mon"), 24.65);
	// The hero: Monday morning's report shows Friday.
	d.lock(lockSession, 29.0, { around: one("sess-fri"), pad: 10 });
	// The lock settles at 29.3; the 10:00 calendar stands for 1.5 s before
	// its crossfade into the close snapshot starts at 31.1.
	for (const tween of tl.getTweensOf(lockSession)) {
		if (tween.startTime() === 29.0 && tween.duration() > 0) tween.duration(0.3);
	}
	tl.addLabel("hero-lock", 29.0);
	show(one("m2-head"), 24.65);
	tl.to(one("ran-mon"), { opacity: 0.85, duration: 0.4 }, 27.5);

	// ——— session continuation: Monday closes ———
	// The bracket settles at 29.3 and stands through 30.8. Release its first headline,
	// then fade the Friday line out before the 16:30 close snapshot arrives.
	hide(lockSession, 30.8, 0.3, 0);
	hide(one("m-head"), 30.8);
	const afterCloseAt = 31.4;
	// The Friday sentence remains true through its fade, then the concise close
	// result enters with the Monday 16:30 snapshot.
	hide(one("m2-head"), afterCloseAt - 0.3, 0.3, 0);
	const afterCloseX = L.nowX(AFTER_CLOSE);
	// The 10:00 marks leave over the motion floor, gone as the calendar cuts to
	// 16:30; the 16:30 marks come on over the same 0.3 s after it.
	hide(
		[
			one("mon-elapsed"),
			one("mon-rest"),
			one("trading-mon"),
			one("sess-fri"),
			one("ran-mon"),
		],
		afterCloseAt - 0.3,
		0.3,
		0,
	);
	tl.set(
		one("mon-done"),
		{ attr: { width: (dayFraction(CLOSE) - dayFraction(OPEN)) * L.colW } },
		afterCloseAt,
	);
	tl.set(
		one("now-line"),
		{ attr: { x1: afterCloseX, x2: afterCloseX } },
		afterCloseAt,
	);
	tl.set(one("now-dot"), { attr: { cx: afterCloseX } }, afterCloseAt);
	tl.set(one("completion-clock"), { attr: { x: afterCloseX } }, afterCloseAt);
	tl.fromTo(
		[
			one("completion-clock"),
			one("ran-close"),
			one("sess-close"),
			one("close-line"),
		],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3, ease: "power3.out", immediateRender: false },
		afterCloseAt,
	);
	tl.set(
		one("latest-box"),
		{ attr: { x: L.dayX(AFTER_CLOSE.latest) + dayFraction(OPEN) * L.colW } },
		afterCloseAt,
	);
	tl.set(
		one("latest-mon"),
		{
			opacity: 1,
			x: 0,
			y: 0,
			attr: { x: L.dayX(AFTER_CLOSE.latest) + L.colW / 2 },
		},
		afterCloseAt,
	);
	tl.set(friday, { attr: { class: "wt-small" } }, afterCloseAt);
	tl.set(
		one(`day-${AFTER_CLOSE.latest}`),
		{ attr: { class: "wt-small wt-accent" } },
		afterCloseAt,
	);
	// The synchronized 16:30 snapshot settles at 31.7 and remains for 2.25 s
	// (1.5 s at the default rate) before the cut to the official baseline.

	// ——— fork: official and yours ———
	tl.addLabel("fork", 33.95);
	// One deliberate beat cut replaces the session calendar with the whole
	// official baseline after the 16:30 proof's 2.25 s settled interval. The
	// official card gets 1.45 s before the colleague caption and action chip
	// fade in. Both settle at 35.7, then read quietly for a full second before
	// the action activates and provenance draws through the empty gutter.
	tl.set(one("calendar"), { opacity: 0 }, 33.95);
	tl.set(one("fork"), { opacity: 1 }, 33.95);
	tl.set(one("fork-official"), { opacity: 1 }, 33.95);
	tl.to(
		[one("edit-chip"), one("c-head")],
		{ opacity: 1, duration: 0.3, ease: "power3.out" },
		35.4,
	);
	tl.to(one("edit-active"), { opacity: 1, duration: 0.3 }, 36.7);
	const forkLink = one<SVGPathElement>("fork-link");
	const linkLength = forkLink.getTotalLength();
	tl.fromTo(
		forkLink,
		{
			opacity: 0,
			strokeDasharray: `${linkLength} ${linkLength}`,
			strokeDashoffset: linkLength,
		},
		{ opacity: 1, strokeDashoffset: 0, duration: 0.45, ease: "none" },
		36.7,
	);
	tl.fromTo(
		one("fork-copy"),
		{ opacity: 0, x: 0, y: 0 },
		{ opacity: 1, duration: 0.45, ease: "power2.inOut" },
		36.7,
	);
	// Ownership is part of the populated copy's existing fade, rather than
	// another construction step after it. The caption lands with the copy.
	show(one("f-head"), 36.85, "above", 0.3);
	// All inherited-copy marks settle at 37.15; keep Spotlight legible for
	// 2.25 s before it flips. ALFA settles at 40.05, then holds for 1.35 s.
	d.flip(one("spot-copy-was"), one("spot-copy"), 39.4);
	tl.set(one("spot-copy-was"), { opacity: 0 }, 39.7);
	// Replace the whole proof with the settled claim in one deliberate beat cut.
	// Removing its scale entrance preserves four fully settled reading seconds
	// without borrowing from ALFA's payoff or the supporting sentence's hold.
	tl.addLabel("claim", 41.4);
	tl.set([one("fork"), one("f-head"), one("c-head")], { opacity: 0 }, 41.4);
	tl.set(one("z-big"), { opacity: 1 }, 41.4);
	// The supporting sentence settles at 41.9, leaving 3.5 reading seconds.
	show(one("z-sub"), 41.6, "below", 0.3);

	// ——— next ———
	tl.addLabel("next", 45.4);
	hide(kids("claim"), 45.4);
	d.close(45.4);
	return tl;
}

export const tradingflowRecipesFilm: Film = {
	id: "tradingflow-recipes",
	label: [
		"Recipes, as a short film: the question of which contracts trade well above open interest Monday; TradingFlow's six official recipes in three kinds, the question lighting the session screen that answers it; the market calendar, where a report opened at 8:00 on Tuesday shows Monday, the latest completed session, and one opened at 10:00 on Monday, while Monday is still trading, shows Friday, then Monday after its close at 16:30; and Edit with AI copying Daily Market Recap into a private copy that only you open, while a colleague opens the official recipe, unchanged",
		"Recipe 短片：周一哪些合约的成交远超其未平仓量；TradingFlow 的六个官方 Recipe 分三种类型，这个问题点亮回答它的时段筛选；交易日历上，周二 8:00 打开的报告显示周一，即最近一个完整的时段，而周一 10:00、盘中打开则显示周五，收盘后 16:30 则显示周一；以及 Edit with AI 把 Daily Market Recap 复制成只有你会打开的私有副本，而同事打开的仍是未改动的官方 Recipe",
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Recipes", "Recipe"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "catalog", label: ["Three kinds", "三种类型"] },
		{ id: "session", label: ["The session", "交易时段"] },
		{ id: "fork", label: ["Official vs yours", "官方与你的"] },
		{ id: "claim", label: ["The takeaway", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
