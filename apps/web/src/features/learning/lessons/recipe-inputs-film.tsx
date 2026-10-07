import {
	type Copy,
	contractDte,
	mondayScreen,
	pick,
	type ScreenContract,
	SESSION_DATE,
	screenContractLabel,
	screenDefaults,
	volumeToOi,
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
import {
	changes,
	contracts,
	count,
	INPUT_ROWS,
	raised,
	run,
} from "./recipe-inputs-model";

/*
 * Recipe inputs, as a film. It opens on an edit, Min OI from 200 to 1,000, and asks what
 * the report shows before Run. A draft: the input reads 1,000, the report still counts the
 * last run's 5 contracts; Run refreshes every cell together, and 1 contract clears the new
 * floor. Then the floors: drop volume and open interest to 0 and a contract with 30 against
 * 5 open interest leads the volume/OI ranking at 6.00. Last, four changes to the screener:
 * a stricter threshold and another session re-run the same question, ranking by premium
 * and admitting same-day expiries ask a new one.
 *
 *   open      0–4        "Change the inputs, keep the question"
 *   question  4–9.6      Min OI 200 → 1,000: what does the report show?
 *   draft     9.6–20.9   5 flagged; a draft still shows 5; Run: 1
 *   floors    20.9–31    defaults; floors at 0; 6.00, locked
 *   tune      31–40.5    four changes: same question, new question; cut: the claim
 *   next      40.5–43    Next: start from a research checklist
 */

const END = 43;
const FROM = screenDefaults.minOpenInterest;
const TO = 1_000;
const BASE = run({});
const AFTER = run({ minOpenInterest: TO });
const OPEN = run({ minVolume: 0, minOpenInterest: 0 });
const THIN = OPEN[0];
const FAR = mondayScreen.find((row) => row.id === "alfa-dec20-110");
const MAX_RATIO = 6;
/** The four changes as a phone's card can hold them beside their tag. */
const changeShort: Record<string, Copy> = {
	volOi: ["Min vol/OI to 2", "最低成交量/OI 设为 2"],
	date: ["Pick Tuesday", "选择周二"],
	premium: ["Rank by premium", "按权利金排名"],
	zeroDte: ["Include same-day expiries", "纳入当天到期合约"],
};

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room, type: T } = frame;
	// The input panel and the result card.
	const panelW = narrow ? room : room * 0.5;
	const inputTop = H * (narrow ? 0.27 : 0.28);
	const inputStep = H * (narrow ? 0.075 : 0.085);
	const fieldW = narrow ? 64 : 110;
	const fieldH = inputStep * 0.74;
	const dockY = inputTop + INPUT_ROWS.length * inputStep + H * 0.005;
	const resultX = narrow ? margin : margin + room * 0.56;
	const resultY = narrow ? H * 0.76 : inputTop;
	// The four changes.
	const cardH = H * (narrow ? 0.13 : 0.11);
	// The ranking.
	const rankStep = H * (narrow ? 0.088 : 0.08);
	const rankTop = H * (narrow ? 0.34 : 0.32);
	const labelW = narrow ? width * 0.42 : width * 0.28;
	const barX = margin + labelW;
	const barMax = room - labelW - (narrow ? 44 : 70);
	return {
		...frame,
		panelW,
		inputY: (i: number) => inputTop + i * inputStep,
		inputStep,
		fieldX: margin + panelW - fieldW,
		fieldW,
		fieldH,
		dockY,
		dockH: H * (narrow ? 0.065 : 0.075),
		resultX,
		resultY,
		resultW: narrow ? room : room * 0.44,
		resultH: narrow ? H * 0.2 : H * 0.36,
		cardY: (i: number) => H * 0.28 + i * (cardH + H * (narrow ? 0.02 : 0.025)),
		cardH,
		rankTop,
		rankStep,
		rankY: (i: number) => rankTop + i * rankStep,
		barX,
		barW: (ratio: number) => (Math.min(ratio, MAX_RATIO) / MAX_RATIO) * barMax,
		rowText: narrow ? T.small * 1.1 : T.body,
	};
}

const copy = {
	title: ["Change the inputs, keep the question", "改输入，不改问题"],
	titleSub: [
		"what a re-run does, and what it doesn't",
		"重跑会做什么，不会做什么",
	],
	qTag: ["Screener · Min OI", "筛选器 · 最低未平仓量"],
	qLine: [
		"You haven't pressed Run. How many contracts does the report show?",
		"你还没点“运行”。报告显示多少份合约？",
	],
	runHead: [
		`Monday's run at the default floors: ${BASE.length}.`,
		`周一按默认门槛运行：${BASE.length} 份。`,
	],
	runHeadShort: [
		`The last run: ${BASE.length}.`,
		`上次运行：${BASE.length} 份。`,
	],
	draftHead: [
		`A draft isn't a run: still ${BASE.length}.`,
		`草稿不是运行：仍是 ${BASE.length} 份。`,
	],
	draftHeadShort: [
		`A draft: still ${BASE.length}.`,
		`草稿：仍是 ${BASE.length} 份。`,
	],
	ranHead: [
		`Run: every cell refreshes, and ${raised} clears.`,
		`运行：所有单元格一起刷新，${raised} 份过线。`,
	],
	ranHeadShort: [`Run: ${raised} contract.`, `运行：${raised} 份。`],
	dock: ["Draft · Run · Discard changes", "草稿 · 运行 · 放弃更改"],
	dockShort: ["Draft · Run · Discard", "草稿 · 运行 · 放弃"],
	tuneHead: [
		"Four changes: two re-run, two ask anew.",
		"四种改动：两种重跑，两种换问题。",
	],
	tuneHeadShort: ["Re-run, or a new question?", "重跑，还是新问题？"],
	same: ["same question", "同一个问题"],
	fresh: ["new question", "新问题"],
	defaultsHead: [
		`At the default floors, ${volumeToOi(BASE[0]).toFixed(2)} leads.`,
		`默认门槛下，${volumeToOi(BASE[0]).toFixed(2)} 领先。`,
	],
	defaultsHeadShort: [
		`Defaults: ${volumeToOi(BASE[0]).toFixed(2)} leads.`,
		`默认：${volumeToOi(BASE[0]).toFixed(2)} 领先。`,
	],
	zeroHead: ["Drop both floors to 0.", "把两个门槛都降为 0。"],
	thinHead: [
		`A thin contract leads at ${volumeToOi(THIN).toFixed(2)}.`,
		`一份冷门合约以 ${volumeToOi(THIN).toFixed(2)} 领先。`,
	],
	thinHeadShort: [
		`Thin, and first: ${volumeToOi(THIN).toFixed(2)}.`,
		`冷门却第一：${volumeToOi(THIN).toFixed(2)}。`,
	],
	rankTitle: ["Monday · ranked by volume/OI", "周一 · 按成交量/OI 排名"],
	rankTitleShort: ["by volume/OI", "按成交量/OI"],
	floorsOn: [
		`volume ≥ ${screenDefaults.minVolume} · OI ≥ ${screenDefaults.minOpenInterest}`,
		`成交量 ≥ ${screenDefaults.minVolume} · 未平仓 ≥ ${screenDefaults.minOpenInterest}`,
	],
	floorsOff: ["volume ≥ 0 · OI ≥ 0", "成交量 ≥ 0 · 未平仓 ≥ 0"],
	far: [
		`${FAR ? contractDte(FAR, SESSION_DATE) : 0} days: past the 60-day limit`,
		`${FAR ? contractDte(FAR, SESSION_DATE) : 0} 天：超出 60 天上限`,
	],
	farShort: [
		`${FAR ? contractDte(FAR, SESSION_DATE) : 0} days`,
		`${FAR ? contractDte(FAR, SESSION_DATE) : 0} 天`,
	],
	claimBig: ["Change the inputs, keep the question.", "改输入，不改问题。"],
	claimSub: [
		"Run first; keep the floors; fork new methods.",
		"先运行再读；守住门槛；新方法就分叉。",
	],
	nextBig: ["Next: start from a research checklist", "下一课：从研究清单开始"],
	nextSub: ["steps a tool can check", "工具能核查的步骤"],
} as const satisfies Record<string, Copy>;

const label = (row: ScreenContract, locale: Locale) =>
	pick(screenContractLabel(row), locale);

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
			// The long title, as the corner tag, takes the top right on a wide frame.
			maxWidth={narrow ? room : room * 0.74}
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
	const minOi = INPUT_ROWS.findIndex((row) => row.id === "minOpenInterest");
	const fieldText = (i: number) =>
		L.inputY(i) + L.fieldH / 2 + L.rowText * 0.36;
	const resultLine = (k: number) =>
		L.resultY + L.resultH * (narrow ? [0.36, 0.78][k] : [0.18, 0.5, 0.78][k]);
	const lastRun = (oi: number): Copy => [
		`Last run · Min OI ${count(oi)}`,
		`上次运行 · 最低未平仓量 ${count(oi)}`,
	];
	const top = (row: ScreenContract): Copy => [
		`top: ${label(row, "en")}`,
		`第一：${label(row, "zh")}`,
	];
	const rankRows = [...OPEN, ...(FAR ? [FAR] : [])];
	return (
		<>
			<Backdrop frame={L} />

			<g data-f="depth">
				<g data-f="world">
					{/* The ranking, with its floors. */}
					<g data-f="rank">
						<text
							x={margin}
							y={L.rankTop - L.rankStep * 0.55}
							className="wt-film-tag"
							style={{ fontSize: T.small }}
						>
							{t(narrow ? copy.rankTitleShort : copy.rankTitle).toUpperCase()}
						</text>
						{(
							[
								["floors-on", copy.floorsOn],
								["floors-off", copy.floorsOff],
							] as const
						).map(([name, text]) => (
							<text
								key={name}
								data-f={name}
								x={margin + room}
								y={L.rankTop - L.rankStep * 0.55}
								textAnchor="end"
								className="wt-film-type wt-film-accent"
								style={{ fontSize: T.small * 1.1 }}
							>
								{t(text)}
							</text>
						))}
						{rankRows.map((row, i) => {
							const far = row === FAR;
							const y = L.rankY(i);
							const ratio = volumeToOi(row);
							const thin = row === THIN;
							return (
								<g key={row.id} data-f={`r-${row.id}`}>
									<text
										x={margin}
										y={y + L.rankStep * 0.36}
										className={`wt-film-type ${far ? "wt-film-dim" : thin ? "wt-film-accent" : ""}`}
										style={{ fontSize: L.rowText }}
									>
										{label(row, locale)}
									</text>
									{far ? (
										<text
											x={L.barX}
											y={y + L.rankStep * 0.36}
											className="wt-film-type wt-film-dim"
											style={{ fontSize: L.rowText }}
										>
											{t(narrow ? copy.farShort : copy.far)}
										</text>
									) : (
										<>
											<rect
												data-f={`bar-${row.id}`}
												x={L.barX}
												y={y + L.rankStep * 0.1}
												width={L.barW(ratio)}
												height={L.rankStep * 0.4}
												rx={3}
												className="wt-film-bar"
												data-tone={thin ? "loss" : "total"}
											/>
											<text
												x={L.barX + L.barW(ratio) + 8}
												y={y + L.rankStep * 0.36}
												className={`wt-film-num ${thin ? "wt-film-loss" : ""}`}
												style={{ fontSize: L.rowText }}
											>
												{ratio.toFixed(2)}
											</text>
										</>
									)}
								</g>
							);
						})}
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
				<Word
					name="q-big"
					x={W / 2}
					y={H * 0.3 + T.big * 1.05}
					size={T.big}
					className="wt-film-num wt-film-accent"
				>
					{`${count(FROM)} → ${count(TO)}`}
				</Word>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.74}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("a-head", copy.runHead, copy.runHeadShort)}
			{headline("d-head", copy.draftHead, copy.draftHeadShort)}
			<Lines
				name="n-head"
				text={t(narrow ? copy.ranHeadShort : copy.ranHead)}
				x={L.margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.draftHeadShort : copy.draftHead),
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

			{/* The inputs and the last run. */}
			<g data-f="draft">
				{INPUT_ROWS.map((row, i) => (
					<g key={row.id} data-f={`in-${row.id}`}>
						<text
							x={margin}
							y={fieldText(i)}
							className="wt-film-type wt-film-dim"
							style={{ fontSize: L.rowText }}
						>
							{t(row.label)}
						</text>
						<rect
							x={L.fieldX}
							y={L.inputY(i)}
							width={L.fieldW}
							height={L.fieldH}
							rx={6}
							className="wt-panel-shape"
						/>
						{i === minOi ? null : (
							<text
								x={L.fieldX + L.fieldW - 10}
								y={fieldText(i)}
								textAnchor="end"
								className="wt-film-num"
								style={{ fontSize: L.rowText }}
							>
								{count(screenDefaults[row.id])}
							</text>
						)}
					</g>
				))}
				<rect
					data-f="field-focus"
					x={L.fieldX}
					y={L.inputY(minOi)}
					width={L.fieldW}
					height={L.fieldH}
					rx={6}
					className="wt-focus-shape"
				/>
				{(
					[
						["oi-from", FROM, ""],
						["oi-to", TO, "wt-film-accent"],
					] as const
				).map(([name, value, tone]) => (
					<text
						key={name}
						data-f={name}
						x={L.fieldX + L.fieldW - 10}
						y={fieldText(minOi)}
						textAnchor="end"
						className={`wt-film-num ${tone}`}
						style={{ fontSize: L.rowText }}
					>
						{count(value)}
					</text>
				))}
				<g data-f="dock">
					<rect
						x={margin}
						y={L.dockY}
						width={L.panelW}
						height={L.dockH}
						rx={8}
						className="wt-focus-shape"
					/>
					<text
						x={margin + 12}
						y={L.dockY + L.dockH / 2 + L.rowText * 0.36}
						className="wt-film-type wt-film-accent"
						style={{ fontSize: L.rowText }}
					>
						{t(narrow ? copy.dockShort : copy.dock)}
					</text>
				</g>
				<rect
					data-f="result"
					x={L.resultX}
					y={L.resultY}
					width={L.resultW}
					height={L.resultH}
					rx={12}
					className="wt-panel-shape"
				/>
				{(
					[
						["last-from", lastRun(FROM)],
						["last-to", lastRun(TO)],
					] as const
				).map(([name, text]) => (
					<text
						key={name}
						data-f={name}
						x={L.resultX + 14}
						y={resultLine(0)}
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(text).toUpperCase()}
					</text>
				))}
				<text
					data-f="flagged"
					x={L.resultX + 14}
					y={resultLine(1)}
					className="wt-film-num"
					style={{ fontSize: narrow ? T.head : T.num }}
				>
					{t([`${contracts(BASE.length)}`, `${BASE.length} 份合约`])}
				</text>
				{narrow
					? null
					: (
							[
								["top-from", top(BASE[0])],
								["top-to", top(AFTER[0])],
							] as const
						).map(([name, text]) => (
							<text
								key={name}
								data-f={name}
								x={L.resultX + 14}
								y={resultLine(2)}
								className="wt-film-type wt-film-dim"
								style={{ fontSize: T.body }}
							>
								{t(text)}
							</text>
						))}
			</g>

			{/* Four changes. */}
			{headline("t-head", copy.tuneHead, copy.tuneHeadShort)}
			<g data-f="changes">
				{changes.map((change, i) => (
					<g key={change.id} data-f={`ch-${change.id}`}>
						<rect
							x={margin}
							y={L.cardY(i)}
							width={room}
							height={L.cardH}
							rx={10}
							className="wt-panel-shape"
						/>
						<rect
							data-f={`chf-${change.id}`}
							x={margin}
							y={L.cardY(i)}
							width={room}
							height={L.cardH}
							rx={10}
							className="wt-focus-shape"
						/>
						<text
							x={margin + 14}
							y={L.cardY(i) + L.cardH / 2 + L.rowText * 0.36}
							className="wt-film-type"
							style={{ fontSize: L.rowText }}
						>
							{t(narrow ? changeShort[change.id] : change.text)}
						</text>
						<text
							data-f={`cht-${change.id}`}
							x={margin + room - 14}
							y={L.cardY(i) + L.cardH / 2 + L.rowText * 0.36}
							textAnchor="end"
							className={`wt-film-type ${change.kind === "method" ? "wt-film-accent" : "wt-film-dim"}`}
							style={{ fontSize: L.rowText }}
						>
							{t(change.kind === "input" ? copy.same : copy.fresh)}
						</text>
					</g>
				))}
			</g>

			{/* The floors. */}
			{headline("f-head", copy.defaultsHead, copy.defaultsHeadShort)}
			{headline("z-head", copy.zeroHead, copy.zeroHead)}
			<Lines
				name="h-head"
				text={t(narrow ? copy.thinHeadShort : copy.thinHead)}
				x={L.margin}
				y={
					L.headY +
					lineCount(t(narrow ? copy.zeroHead : copy.zeroHead), room, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
			<Brackets name="lock-thin" glow />
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
	const { tl, one, kids, show, hide, rise, sink } = d;
	const flat = (name: string) =>
		kids(name).flatMap((el) =>
			el.tagName === "g" && !el.hasAttribute("data-f")
				? [...el.children]
				: [el],
		);
	const word = (target: Element, at: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			at,
		);
	const flagged = one<SVGTextElement>("flagged");
	const inputs = INPUT_ROWS.map((row) => one(`in-${row.id}`));
	const cards = changes.map((change) => one(`ch-${change.id}`));
	const focusOf = (id: string) => one(`chf-${id}`);
	const tagOf = (id: string) => one(`cht-${id}`);
	const thinRow = one(`r-${THIN.id}`);
	const baseRows = BASE.map((row) => one(`r-${row.id}`));
	const farRow = FAR ? one(`r-${FAR.id}`) : null;
	const shown = (value: number) =>
		Math.round(value) === 1 ? "contract" : "contracts";
	const flaggedText = (value: number) =>
		context.locale === "zh"
			? `${Math.round(value)} 份合约`
			: `${Math.round(value)} ${shown(value)}`;

	const lockThin = one<SVGGraphicsElement>("lock-thin");

	d.hidden([
		...flat("q"),
		...[
			"a-head",
			"d-head",
			"n-head",
			"f-head",
			"z-head",
			"h-head",
			"t-head",
		].map((name) => one(name)),
		...inputs,
		one("field-focus"),
		one("oi-from"),
		one("oi-to"),
		one("dock"),
		one("result"),
		one("last-from"),
		one("last-to"),
		flagged,
		...(["top-from", "top-to"]
			.map((name) => one(name))
			.filter(Boolean) as Element[]),
		...cards,
		...changes.flatMap((change) => [focusOf(change.id), tagOf(change.id)]),
		one("floors-on"),
		one("floors-off"),
		thinRow,
		...baseRows,
		...(farRow ? [farRow] : []),
		lockThin,
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: an edit before Run ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	word(one("q-big"), 4.8);
	show(one("q-line"), 6.0);

	// ——— draft: the report keeps the last run until Run ———
	tl.addLabel("draft", 9.6);
	hide(flat("q"), 9.6);
	show(one("a-head"), 9.8, "above");
	inputs.forEach((input, i) => {
		show(input, 10.1 + i * 0.1);
	});
	show(one("oi-from"), 10.5);
	show([one("result"), one("last-from")], 10.8);
	show(flagged, 11.0);
	const topFrom = one("top-from");
	if (topFrom) show(topFrom, 11.2);
	// Type 1,000: a draft.
	d.swap(one("a-head"), one("d-head"), 13.4);
	tl.to(one("field-focus"), { opacity: 1, duration: 0.3 }, 13.8);
	d.flip(one("oi-from"), one("oi-to"), 14.0);
	tl.set(one("oi-from"), { opacity: 0 }, 14.3);
	show(one("dock"), 14.5, "above");
	// Run: everything together.
	show(one("n-head"), 16.9);
	tl.to(one("dock"), { opacity: 0, duration: 0.3 }, 16.9);
	tl.to(one("field-focus"), { opacity: 0, duration: 0.3 }, 16.9);
	d.flip(one("last-from"), one("last-to"), 17.1);
	tl.set(one("last-from"), { opacity: 0 }, 17.4);
	d.count(flagged, AFTER.length, 17.2, flaggedText, BASE.length, 0.5);
	if (topFrom) {
		d.flip(topFrom, one("top-to"), 17.2);
		tl.set(topFrom, { opacity: 0 }, 17.5);
	}

	// ——— floors: a ratio's denominator ———
	tl.addLabel("floors", 20.9);
	hide(
		[
			one("d-head"),
			one("n-head"),
			...inputs,
			one("oi-to"),
			one("result"),
			one("last-to"),
			flagged,
			...(["top-to"].map((name) => one(name)).filter(Boolean) as Element[]),
		],
		20.9,
	);
	show(one("f-head"), 21.25, "above");
	rise(21.3);
	show(one("floors-on"), 21.7);
	// At the defaults the rows sit one place higher: the thin contract isn't there yet.
	tl.set(baseRows, { y: -L.rankStep }, 0);
	baseRows.forEach((row, i) => {
		// Slide in sideways only: show() would reset the one-place lift.
		tl.fromTo(
			row,
			{ opacity: 0, x: 18 },
			{ opacity: 1, x: 0, duration: 0.5 },
			21.9 + i * 0.12,
		);
	});
	d.swap(one("f-head"), one("z-head"), 24.8);
	d.flip(one("floors-on"), one("floors-off"), 25.2);
	tl.set(one("floors-on"), { opacity: 0 }, 25.5);
	tl.to(baseRows, { y: 0, duration: 0.6, ease: "power2.inOut" }, 25.6);
	tl.to(thinRow, { opacity: 1, duration: 0.4 }, 26.0);
	const thinBar = one(`bar-${THIN.id}`);
	tl.fromTo(
		thinBar,
		{ attr: { width: 0 } },
		{
			attr: { width: L.barW(volumeToOi(THIN)) },
			duration: 0.8,
			ease: "power2.out",
		},
		26.0,
	);
	show(one("h-head"), 27.0);
	if (farRow) show(farRow, 27.2);
	// The hero: the thinnest contract, first.
	d.lock(lockThin, 27.6, { around: thinRow, pad: 6 });
	tl.addLabel("hero-lock", 27.6);

	// ——— tune: same question or a new one ———
	tl.addLabel("tune", 31);
	hide([one("z-head"), one("h-head"), lockThin], 31.0);
	sink(31.0);
	show(one("t-head"), 31.35, "above");
	cards.forEach((card, i) => {
		show(card, 31.6 + i * 0.15);
	});
	changes.forEach((change, i) => {
		if (change.kind !== "input") return;
		tl.to(focusOf(change.id), { opacity: 1, duration: 0.3 }, 32.6 + i * 0.2);
		show(tagOf(change.id), 32.7 + i * 0.2, "right");
	});
	changes.forEach((change, i) => {
		if (change.kind === "input")
			tl.to(focusOf(change.id), { opacity: 0, duration: 0.3 }, 34.0);
		else {
			tl.to(
				focusOf(change.id),
				{ opacity: 1, duration: 0.3 },
				34.0 + (i - 2) * 0.2,
			);
			show(tagOf(change.id), 34.1 + (i - 2) * 0.2, "right");
		}
	});
	// Cut: the claim.
	hide([one("t-head"), ...cards], 36.1);
	word(one("claim-big"), 36.5);
	show(one("claim-sub"), 36.9);

	// ——— next ———
	tl.addLabel("next", 40.5);
	hide(kids("claim"), 40.5);
	d.close(40.5);
	return tl;
}

export const recipeInputsFilm: Film = {
	id: "recipe-inputs",
	label: [
		`Recipe inputs, as a short film: Min OI edited from ${count(FROM)} to ${count(TO)} before Run, the input showing a draft while the report still counts the last run's ${BASE.length} contracts, then Run refreshing every cell together to ${raised}; the volume and open-interest floors dropped to 0, where a contract with ${THIN.volume} against ${THIN.openInterest} open interest leads the volume/OI ranking at ${volumeToOi(THIN).toFixed(2)}; and four changes to the screener, a stricter threshold and another session re-running the same question while ranking by premium and admitting same-day expiries ask a new one`,
		`Recipe 输入短片：点“运行”之前把最低未平仓量从 ${count(FROM)} 改成 ${count(TO)}，输入框显示草稿，报告仍统计上一次运行的 ${BASE.length} 份合约，点“运行”后所有单元格一起刷新为 ${raised} 份；把成交量和未平仓量门槛降为 0 后，一份成交 ${THIN.volume}、未平仓量 ${THIN.openInterest} 的合约以 ${volumeToOi(THIN).toFixed(2)} 领跑成交量/OI 排名；以及对筛选器的四种改动，更严格的阈值和另一个时段是重跑同一个问题，按权利金排名和纳入当天到期合约则是新问题`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Inputs", "输入"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "draft", label: ["Draft, then run", "先草稿，再运行"] },
		{ id: "floors", label: ["Floors", "门槛"] },
		{ id: "tune", label: ["Tune or re-ask", "调参还是换问题"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
