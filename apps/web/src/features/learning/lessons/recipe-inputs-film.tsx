import {
	type Copy,
	pick,
	type ScreenContract,
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
	toneClass,
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
 *   open      0–4        "When inputs change"
 *   question  4–9.6      Min OI 200 → 1,000: what does the report show?
 *   draft     9.6–20.9   coherent last-run report; draft edit; Run: 1
 *   floors    20.9–32    defaults; floors at 0; 30 / 5 = 6.00, locked
 *   tune      32–44.5      two paired examples; cut: the claim
 *   next      44.5–47    Next: start from a research checklist
 */

const END = 47;
const FROM = screenDefaults.minOpenInterest;
const TO = 1_000;
const BASE = run({});
const AFTER = run({ minOpenInterest: TO });
const OPEN = run({ minVolume: 0, minOpenInterest: 0 });
const THIN = OPEN[0];
const MAX_RATIO = volumeToOi(THIN);
const STRICT = run({ minVolumeToOi: 2 });
/** Independent input edits: neither example inherits the preceding example's draft. */
const changeShort: Record<string, Copy> = {
	volOi: [
		`Min vol/OI ${screenDefaults.minVolumeToOi} → 2`,
		`最低成交量/OI ${screenDefaults.minVolumeToOi} → 2`,
	],
	date: ["Tuesday", "周二"],
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
	const resultY = narrow ? H * 0.735 : inputTop;
	// Two paired examples, with room for the consequence under each action.
	const cardH = H * (narrow ? 0.29 : 0.27);
	const proofSize = T.num * 1.35;
	const cell = proofSize * 0.62;
	const proofLeft = width / 2 - cell * 6.5;
	const choiceGap = 12;
	const choiceW = (room - 28 - choiceGap) / 2;
	const choiceH = cardH * 0.17;
	// The ranking.
	const rankStep = H * (narrow ? 0.082 : 0.07);
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
		resultH: narrow ? H * 0.225 : H * 0.36,
		cardY: (i: number) => H * 0.28 + i * (cardH + H * 0.055),
		cardH,
		choiceX: (i: number) => margin + 14 + i * (choiceW + choiceGap),
		choiceY: (i: number) =>
			H * 0.28 + cardH + H * 0.055 + cardH * (i === 0 ? 0.38 : 0.72),
		choiceW,
		choiceH,
		proofSize,
		proofX: (slot: number) => proofLeft + slot * cell,
		proofY: H * 0.92,
		rankTop,
		rankStep,
		rankY: (i: number) => rankTop + i * rankStep,
		barX,
		barW: (ratio: number) => (Math.min(ratio, MAX_RATIO) / MAX_RATIO) * barMax,
		rowText: narrow ? T.small * 1.1 : T.body,
	};
}

const copy = {
	// The card asks what an input change does; the lesson's full name answers as the claim.
	title: ["When inputs change", "输入改变时"],
	titleSub: ["what a re-run does and doesn't", "重跑会做什么，不会做什么"],
	qTag: ["Screener · Min OI", "筛选器 · 最低未平仓量"],
	qLine: ["Before Run: how many contracts?", "运行前：报告显示多少份合约？"],
	runHead: ["The report remembers the last run.", "报告保留上次运行结果。"],
	runHeadShort: ["The last completed run.", "上次完成的运行。"],
	draftHead: [
		"Edit first; Run applies the changes.",
		"编辑后，运行才会应用更改。",
	],
	draftHeadShort: ["Edit first; then Run.", "先编辑，再运行。"],
	ranHead: ["Run refreshes the whole report.", "运行后，报告整体刷新。"],
	ranHeadShort: ["Run refreshes the report.", "运行后，报告刷新。"],
	dock: ["Draft · Run · Discard changes", "草稿 · 运行 · 放弃更改"],
	dockShort: ["Draft · Run · Discard", "草稿 · 运行 · 放弃"],
	tuneHead: [
		"Four changes: two re-run, two ask anew.",
		"四种改动：两种重跑，两种换问题。",
	],
	tuneHeadShort: ["Re-run, or a new question?", "重跑，还是新问题？"],
	same: ["Same question · each from defaults", "同一问题 · 每例从默认出发"],
	fresh: ["new question", "新问题"],
	defaultsHead: ["Rank with the default floors.", "按默认门槛排名。"],
	defaultsHeadShort: ["Rank with default floors.", "按默认门槛排名。"],
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
	volume: ["VOLUME", "成交量"],
	oi: ["OI", "未平仓量"],
	strict: [
		`${STRICT.length} of ${BASE.length} stay`,
		`${BASE.length} 份留下 ${STRICT.length} 份`,
	],
	defaultFloors: [
		`vol ≥ ${screenDefaults.minVolume} · OI ≥ ${screenDefaults.minOpenInterest} · vol/OI ≥ ${screenDefaults.minVolumeToOi}`,
		`成交量 ≥ ${screenDefaults.minVolume} · OI ≥ ${screenDefaults.minOpenInterest} · 成交量/OI ≥ ${screenDefaults.minVolumeToOi}`,
	],
	// The premium change's effect contrasts unusual activity against OI with biggest money.
	measureQuestion: [
		"Relative to OI → most premium traded",
		"相对未平仓量 → 权利金成交额最大",
	],
	measureFrom: ["Before: volume/OI", "前：成交量/OI"],
	measureFromShort: ["Before: vol/OI", "前：成交量/OI"],
	measureTo: ["After: premium traded", "后：权利金成交额"],
	measureToShort: ["After: premium", "后：权利金成交额"],
	universe: [
		"ELIGIBLE EXPIRIES · SAME-DAY NOW INCLUDED",
		"纳入的到期日 · 现含当天到期",
	],
	universeShort: ["EXPIRIES · SAME-DAY ADDED", "到期日 · 现含当天"],
	expiryFrom: [
		`Before: 1–${screenDefaults.maxDte} DTE`,
		`前：1–${screenDefaults.maxDte} 天`,
	],
	expiryTo: [
		`After: 0–${screenDefaults.maxDte} DTE`,
		`后：0–${screenDefaults.maxDte} 天`,
	],
	claimBig: ["Change the inputs, keep the question.", "改输入，不改问题。"],
	claimSub: [
		"Run first; keep floors; fork new methods.",
		"先运行；守住门槛；新方法另起分支。",
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
	const headWidth = narrow ? room : room * 0.74;
	const W = width;
	const headline = (name: string, text: Copy, short: Copy) => (
		<Lines
			name={name}
			text={t(narrow ? short : text)}
			x={margin}
			y={L.headY}
			size={T.head}
			// The long title, as the corner tag, takes the top right on a wide frame.
			maxWidth={headWidth}
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
		L.resultY + L.resultH * [0.18, 0.5, 0.78][k];
	const lastRun = (oi: number): Copy => [
		`Last run · Min OI ${count(oi)}`,
		`上次运行 · 最低未平仓量 ${count(oi)}`,
	];
	const top = (row: ScreenContract, includeOi = false): Copy => [
		`top: ${label(row, "en")}${includeOi ? ` · OI ${count(row.openInterest)}` : ""}`,
		`第一：${label(row, "zh")}${includeOi ? ` · OI ${count(row.openInterest)}` : ""}`,
	];
	const rankRows = OPEN;
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
							const y = L.rankY(i);
							const ratio = volumeToOi(row);
							const thin = row === THIN;
							return (
								<g key={row.id} data-f={`r-${row.id}`}>
									<text
										x={margin}
										y={y + L.rankStep * 0.36}
										className={`wt-film-type ${thin ? "wt-film-accent" : ""}`}
										style={{ fontSize: L.rowText }}
									>
										{label(row, locale)}
									</text>
									<g data-f={`ratio-${row.id}`}>
										<rect
											x={L.barX}
											y={y + L.rankStep * 0.1}
											width={L.barW(ratio)}
											height={L.rankStep * 0.4}
											rx={3}
											className="wt-film-bar"
											data-tone="total"
										/>
										<text
											x={L.barX + L.barW(ratio) + 8}
											y={y + L.rankStep * 0.36}
											className={`wt-film-num ${thin ? "wt-film-accent" : ""}`}
											style={{ fontSize: L.rowText * (thin ? 1.4 : 1) }}
										>
											{ratio.toFixed(2)}
										</text>
									</g>
								</g>
							);
						})}
					</g>
				</g>
			</g>

			<g data-f="thin-proof">
				<Word
					name="proof-contract"
					x={narrow ? width - margin : L.proofX(11)}
					anchor={narrow ? "end" : "middle"}
					y={L.proofY - L.proofSize * 1.15}
					size={T.small}
					className="wt-film-type wt-film-dim"
				>
					{label(THIN, locale)}
				</Word>
				{(
					[
						["proof-volume", THIN.volume, copy.volume, 1],
						["proof-oi", THIN.openInterest, copy.oi, 5.5],
					] as const
				).map(([name, value, caption, slot]) => (
					<g key={name} data-f={name}>
						<Word
							name={`${name}-caption`}
							x={L.proofX(slot)}
							y={L.proofY - L.proofSize * 1.15}
							size={T.small}
							className="wt-film-tag"
						>
							{t(caption)}
						</Word>
						<Word
							name={`${name}-value`}
							x={L.proofX(slot)}
							y={L.proofY}
							size={L.proofSize}
							className="wt-film-num"
						>
							{count(value)}
						</Word>
					</g>
				))}
				<g data-f="proof-result">
					<Word
						name="proof-divide"
						x={L.proofX(3.5)}
						y={L.proofY}
						size={L.proofSize}
						className="wt-film-num wt-film-dim"
					>
						/
					</Word>
					<Word
						name="proof-equals"
						x={L.proofX(7.5)}
						y={L.proofY}
						size={L.proofSize}
						className="wt-film-num wt-film-dim"
					>
						=
					</Word>
					<Word
						name="proof-ratio"
						x={L.proofX(11)}
						y={L.proofY}
						size={L.proofSize}
						className="wt-film-num wt-film-accent"
					>
						{volumeToOi(THIN).toFixed(2)}
					</Word>
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
						headWidth,
						T.head,
					) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={headWidth}
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
						["report-from", FROM, BASE],
						["report-to", TO, AFTER],
					] as const
				).map(([name, oi, rows]) => (
					<g key={name} data-f={name}>
						<text
							x={L.resultX + 14}
							y={resultLine(0)}
							className="wt-film-tag"
							style={{ fontSize: T.small }}
						>
							{t(lastRun(oi)).toUpperCase()}
						</text>
						<text
							x={L.resultX + 14}
							y={resultLine(1)}
							className="wt-film-num"
							style={{ fontSize: T.num }}
						>
							{t([contracts(rows.length), `${rows.length} 份合约`])}
						</text>
						<text
							x={L.resultX + 14}
							y={resultLine(2)}
							className="wt-film-type wt-film-dim"
							style={{ fontSize: T.body }}
						>
							{t(top(rows[0], name === "report-to"))}
						</text>
					</g>
				))}
			</g>

			{/* Independent inputs, then explicit before/after method states with stationary outlines. */}
			{headline("t-head", copy.tuneHead, copy.tuneHeadShort)}
			<g data-f="changes">
				<g data-f="pair-input">
					<rect
						x={margin}
						y={L.cardY(0)}
						width={room}
						height={L.cardH}
						rx={10}
						className="wt-panel-shape"
					/>
					<Lines
						name="input-starts"
						text={t(copy.same)}
						x={margin + 14}
						y={L.cardY(0) + L.cardH * 0.16}
						size={T.body}
						maxWidth={room - 28}
						anchor="start"
						className="wt-film-type wt-film-dim"
					/>
					{changes
						.filter((change) => change.kind === "input")
						.map((change, i) => {
							const y = L.cardY(0) + L.cardH * (i === 0 ? 0.34 : 0.66);
							return (
								<g key={change.id} data-f={`example-${change.id}`}>
									<text
										x={margin + 14}
										y={y}
										className="wt-film-tag"
										style={{ fontSize: T.small }}
									>
										{t(changeShort[change.id])}
									</text>
									<Lines
										name={`effect-${change.id}`}
										text={t(
											change.id === "volOi" ? copy.strict : change.effect,
										)}
										x={margin + 14}
										y={y + T.body * 1.45}
										size={T.body}
										maxWidth={room - 28}
										anchor="start"
										className={`wt-film-type ${toneClass.focus}`}
									/>
									{change.id === "volOi" ? (
										<text
											x={margin + room - 14}
											y={y + T.body * 1.45}
											textAnchor="end"
											className="wt-film-num"
											style={{ fontSize: L.rowText }}
										>
											{STRICT.map((row) => volumeToOi(row).toFixed(2)).join(
												" · ",
											)}
										</text>
									) : (
										<Word
											name="date-default-floors"
											x={margin + 14}
											y={y + T.body * 1.45 + T.small * 1.5}
											size={T.small}
											anchor="start"
											className="wt-film-type wt-film-dim"
										>
											{t(copy.defaultFloors)}
										</Word>
									)}
								</g>
							);
						})}
				</g>
				<g data-f="pair-method">
					<rect
						x={margin}
						y={L.cardY(1)}
						width={room}
						height={L.cardH}
						rx={10}
						className="wt-focus-shape"
					/>
					<text
						x={margin + 14}
						y={L.cardY(1) + L.cardH * 0.16}
						className="wt-film-type wt-film-accent"
						style={{ fontSize: T.body }}
					>
						{t(copy.fresh)}
					</text>
					{(["measure", "universe"] as const).map((kind, i) => (
						<g
							key={kind}
							data-f={i === 0 ? "example-premium" : "example-zeroDte"}
						>
							{i === 0 ? (
								<Lines
									name="measure-question"
									text={t(copy.measureQuestion)}
									x={margin + 14}
									y={L.cardY(1) + L.cardH * 0.31}
									size={T.body}
									maxWidth={room - 28}
									anchor="start"
								/>
							) : (
								<text
									x={margin + 14}
									y={L.cardY(1) + L.cardH * 0.67}
									className="wt-film-tag"
									style={{ fontSize: T.small }}
								>
									{t(narrow ? copy.universeShort : copy.universe)}
								</text>
							)}
							{[0, 1].map((column) => (
								<rect
									key={column}
									x={L.choiceX(column)}
									y={L.choiceY(i)}
									width={L.choiceW}
									height={L.choiceH}
									rx={5}
									className="wt-panel-shape"
								/>
							))}
							<rect
								data-f={i === 0 ? "measure-selected" : "expiry-included"}
								x={L.choiceX(1)}
								y={L.choiceY(i)}
								width={L.choiceW}
								height={L.choiceH}
								rx={5}
								className="wt-focus-shape"
							/>
							{(i === 0
								? [
										narrow ? copy.measureFromShort : copy.measureFrom,
										narrow ? copy.measureToShort : copy.measureTo,
									]
								: [copy.expiryFrom, copy.expiryTo]
							).map((text, column) => (
								<Word
									key={column}
									name={`${kind}-choice-${column}`}
									x={L.choiceX(column) + L.choiceW / 2}
									y={L.choiceY(i) + L.choiceH / 2 + T.body * 0.36}
									size={T.body}
									className="wt-film-type"
								>
									{t(text)}
								</Word>
							))}
						</g>
					))}
				</g>
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
					lineCount(t(copy.zeroHead), headWidth, T.head) * T.head * 1.35
				}
				size={T.head}
				maxWidth={headWidth}
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
	const inputs = INPUT_ROWS.map((row) => one(`in-${row.id}`));
	const cards = [one("pair-input"), one("pair-method")];
	const thinRow = one(`r-${THIN.id}`);
	const thinResult = one(`ratio-${THIN.id}`);
	const baseRows = BASE.map((row) => one(`r-${row.id}`));
	const reportFrom = one("report-from");
	const reportTo = one("report-to");
	const proofOperands = [
		one("proof-volume"),
		one("proof-oi"),
		one("proof-contract"),
	];

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
		reportFrom,
		reportTo,
		...cards,
		...proofOperands,
		one("proof-result"),
		thinResult,
		one("floors-on"),
		one("floors-off"),
		thinRow,
		...baseRows,
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
	show([one("result"), reportFrom], 10.8);
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
	tl.to(reportFrom, { opacity: 0, duration: 0.35, ease: "power2.in" }, 17.1);
	tl.fromTo(reportTo, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 17.45);

	// ——— floors: a ratio's denominator ———
	tl.addLabel("floors", 20.9);
	hide([one("d-head"), one("n-head"), ...inputs, one("oi-to")], 20.9);
	hide([one("result"), reportTo], 21.05);
	show(one("f-head"), 21.25, "above");
	// The report bridges the cut without taking time from its completed proof.
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
	// Operands land first. The settled division and full-width bar then reveal together.
	tl.fromTo(proofOperands, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 25.2);
	tl.to(thinRow, { opacity: 1, duration: 0.4 }, 26.0);
	tl.fromTo(
		[one("proof-result"), thinResult],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.4 },
		26.2,
	);
	// One full second of quiet after the proof settles at 26.6.
	show(one("h-head"), 27.6);
	d.lock(lockThin, 27.6, { around: kids("thin-proof"), pad: 6 });
	tl.addLabel("hero-lock", 27.6);

	// ——— tune: same question or a new one ———
	tl.addLabel("tune", 32);
	hide([one("z-head"), one("h-head"), lockThin, one("thin-proof")], 32.0);
	sink(32.0);
	show(one("t-head"), 32.35, "above");
	show(cards[0], 32.6);
	show(cards[1], 34.6);
	// Both labelled control states remain visible: no moving selector or rushed baseline.
	// The comparison settles at 35.1 and reads undisturbed for 5 s, through the 40.1 exit.
	hide([one("t-head"), ...cards], 40.1);
	word(one("claim-big"), 40.5);
	show(one("claim-sub"), 40.9);

	// ——— next ———
	tl.addLabel("next", 44.5);
	hide(kids("claim"), 44.5);
	d.close(44.5);
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
