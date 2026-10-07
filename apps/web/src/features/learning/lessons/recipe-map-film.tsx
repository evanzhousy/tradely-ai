import {
	type Copy,
	dayLabel,
	pick,
	type ScreenContract,
	screenContractLabel,
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
	bottomLine,
	CELLS,
	INPUTS,
	MONDAY,
	SOURCES,
	TAKEAWAYS,
	TUESDAY,
} from "./recipe-map-model";

/*
 * Reading a recipe, as a film. It opens on a sentence from the screener's Bottom line and
 * asks where it comes from. The recipe map answers: the Bottom line is fed by Live data 1,
 * which runs on the session and all five thresholds, while the Takeaways have no line in at
 * all. Run the screen for Tuesday and the Bottom line changes while the Takeaways read word
 * for word the same: live data against recipe content. Last, the table shows the top three
 * contracts by volume/OI, the key figures count five, and two passed without being loaded.
 *
 *   open        0–4        "Read a recipe like an auditor"
 *   question    4–9.6      "Mon Sep 16: 5 contracts flagged…" — where does it come from?
 *   map         9.6–19.6   inputs, live data, cells; trace the Bottom line; the Takeaways
 *   content     19.6–31.4  Monday's two text cells; Tuesday's, labelled; cut: evidence vs
 *                          method, locked
 *   population  31.4–43.7  top three; five counted, two not loaded; cut: the claim
 *   next        43.7–46.2  Next: change the inputs, keep the question
 */

const END = 46.2;
const TOP_N = 3;
const BOTTOM = CELLS.findIndex((cell) => cell.id === "bottom");
const TAKE = CELLS.findIndex((cell) => cell.id === "takeaways");
const LIVE = SOURCES.findIndex((source) => source.id === "totals");

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, type: T } = frame;
	// The map: three columns of nodes.
	const gap = narrow ? 10 : width * 0.06;
	const colW = (width - 2 * margin - 2 * gap) / 3;
	const colX = (i: number) => margin + i * (colW + gap);
	const nodeTop = H * (narrow ? 0.33 : 0.3);
	const step = H * (narrow ? 0.105 : 0.095);
	const nodeH = H * (narrow ? 0.075 : 0.065);
	const span = (INPUTS.length - 1) * step + nodeH;
	const inputY = (i: number) => nodeTop + i * step;
	const sourceY = (j: number) =>
		nodeTop + span * (j === 0 ? 0.22 : 0.62) - nodeH / 2;
	const cellY = (i: number) =>
		nodeTop + i * ((span - nodeH) / (CELLS.length - 1));
	const curve = (x1: number, y1: number, x2: number, y2: number) =>
		`M${x1} ${y1}C${(x1 + x2) / 2} ${y1},${(x1 + x2) / 2} ${y2},${x2} ${y2}`;
	// The two text cells.
	const boxText = narrow ? T.small * 1.1 : T.head * 0.75;
	const pad = narrow ? 10 : 20;
	const textWidth = frame.room - 2 * pad;
	const boxHeight = (texts: readonly Copy[], locale: Locale) =>
		pad * 2 +
		T.small * 1.6 +
		Math.max(
			...texts.map((text) => lineCount(pick(text, locale), textWidth, boxText)),
		) *
			boxText *
			1.35;
	// The screen's table.
	const kpiY = H * 0.27;
	const kpiH = H * (narrow ? 0.15 : 0.12);
	const rowH = H * (narrow ? 0.07 : 0.068);
	const tableY = kpiY + kpiH + H * (narrow ? 0.03 : 0.05);
	return {
		...frame,
		colW,
		colX,
		nodeH,
		inputY,
		sourceY,
		cellY,
		curve,
		nodeText: narrow ? T.small : T.body,
		boxText,
		pad,
		textWidth,
		boxHeight,
		boxTop: H * (narrow ? 0.27 : 0.3),
		kpiY,
		kpiH,
		rowH,
		tableY,
		rowY: (i: number) => tableY + (i + 1) * (rowH + 4),
	};
}

const copy = {
	title: ["Read a recipe like an auditor", "像审计员一样读 Recipe"],
	titleSub: ["trace it, label it, count it", "追溯、标注、计数"],
	qTag: ["Bottom line · Monday's run", "核心结论 · 周一的运行"],
	qLine: ["Where does this sentence come from?", "这句话从哪里来？"],
	mapHead: [
		"The recipe map: inputs, live data, cells.",
		"Recipe 地图：输入、实时数据、单元格。",
	],
	mapHeadShort: ["The recipe map.", "Recipe 地图。"],
	traceHead: [
		"Trace the Bottom line back to its inputs.",
		"把核心结论追溯到它的输入。",
	],
	traceHeadShort: ["Trace the Bottom line.", "追溯核心结论。"],
	takeHead: ["The Takeaways have no line in.", "要点没有任何输入线。"],
	takeHeadShort: ["Takeaways: no line in.", "要点：没有输入线。"],
	inputs: ["Inputs", "输入"],
	live: ["Live data", "实时数据"],
	cells: ["Cells", "单元格"],
	runHead: [
		"Two text cells from Monday's run.",
		"周一运行中的两个文字单元格。",
	],
	runHeadShort: ["Monday's run.", "周一的运行。"],
	tuesdayHead: [
		"Tuesday's run: one cell changes, one doesn't.",
		"周二的运行：一个单元格变了，一个没变。",
	],
	tuesdayHeadShort: ["Tuesday: one cell changes.", "周二：一个单元格变了。"],
	bottomTitle: ["Bottom line", "核心结论"],
	takeTitle: ["Takeaways", "要点"],
	liveTag: ["live data", "实时数据"],
	contentTag: ["recipe content", "Recipe 内容"],
	evidenceBig: [
		"Live data is evidence; recipe text is method.",
		"实时数据可作证据；Recipe 内容要当方法来读。",
	],
	evidenceSub: [
		"Only the first describes the session.",
		"只有前者描述了这个交易时段。",
	],
	tableHead: [
		`The table: the top ${TOP_N} by volume/OI.`,
		`表格：成交量/OI 前 ${TOP_N} 名。`,
	],
	tableHeadShort: [`The table: top ${TOP_N}.`, `表格：前 ${TOP_N} 名。`],
	restHead: [
		`${MONDAY.passed.length - TOP_N} more passed but aren't loaded.`,
		`另外 ${MONDAY.passed.length - TOP_N} 份也通过了，只是没有载入。`,
	],
	restHeadShort: [
		`${MONDAY.passed.length - TOP_N} passed, not loaded.`,
		`${MONDAY.passed.length - TOP_N} 份通过，未载入。`,
	],
	contract: ["Contract", "合约"],
	volume: ["Volume", "成交量"],
	oi: ["OI", "未平仓量"],
	volOi: ["Vol/OI", "成交量/OI"],
	notLoaded: ["passed, not loaded", "已入选，未载入"],
	flagged: ["contracts flagged", "入选合约"],
	flaggedShort: ["flagged", "入选"],
	symbols: ["symbols", "标的"],
	median: ["median vol/OI", "成交量/OI 中位数"],
	highest: ["highest vol/OI", "成交量/OI 最高"],
	claimBig: ["Trace it, label it, count it.", "追溯、标注、计数。"],
	claimSub: [
		"Trace inputs, label what's written, count key figures.",
		"追溯输入，标注写好的内容，按关键数字计数。",
	],
	nextBig: [
		"Next: change the inputs, keep the question",
		"下一课：改输入，不改问题",
	],
	nextSub: [
		"what a re-run does, and what it doesn't",
		"重跑会做什么，不会做什么",
	],
} as const satisfies Record<string, Copy>;

const runTag = (on: string): Copy => [
	`Run · ${dayLabel(on)[0]}`,
	`运行 · ${dayLabel(on)[1]}`,
];

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
	const node = (name: string, x: number, y: number, label: string) => (
		<g key={name}>
			<rect
				data-f={`n-${name}`}
				x={x}
				y={y}
				width={L.colW}
				height={L.nodeH}
				rx={7}
				className="wt-panel-shape"
			/>
			<rect
				data-f={`f-${name}`}
				x={x}
				y={y}
				width={L.colW}
				height={L.nodeH}
				rx={7}
				className="wt-focus-shape"
			/>
			<text
				data-f={`l-${name}`}
				x={x + L.colW / 2}
				y={y + L.nodeH / 2 + L.nodeText * 0.36}
				textAnchor="middle"
				className="wt-film-type"
				style={{ fontSize: L.nodeText }}
			>
				{label}
			</text>
		</g>
	);
	const inX = L.colX(0) + L.colW;
	const srcIn = L.colX(1);
	const srcOut = L.colX(1) + L.colW;
	const cellIn = L.colX(2);
	const mid = (y: number) => y + L.nodeH / 2;
	// The two text cells.
	const bottomH = L.boxHeight(
		[bottomLine(MONDAY), bottomLine(TUESDAY)],
		locale,
	);
	const takeH = L.boxHeight([TAKEAWAYS], locale);
	const boxGap = H * (narrow ? 0.025 : 0.035);
	const takeTop = L.boxTop + bottomH + boxGap;
	const box = (
		name: string,
		y: number,
		h: number,
		title: Copy,
		tag: Copy,
		tagTone: string,
	) => (
		<g>
			<rect
				data-f={`${name}-box`}
				x={margin}
				y={y}
				width={room}
				height={h}
				rx={12}
				className="wt-panel-shape"
			/>
			<rect
				data-f={`${name}-focus`}
				x={margin}
				y={y}
				width={room}
				height={h}
				rx={12}
				className="wt-focus-shape"
			/>
			<Word
				name={`${name}-title`}
				x={margin + L.pad}
				y={y + L.pad + T.small}
				size={T.small}
				anchor="start"
				className="wt-film-tag"
			>
				{t(title).toUpperCase()}
			</Word>
			<Word
				name={`${name}-tag`}
				x={margin + room - L.pad}
				y={y + L.pad + T.small}
				size={narrow ? T.small : T.body}
				anchor="end"
				className={`wt-film-type ${tagTone}`}
			>
				{t(tag)}
			</Word>
		</g>
	);
	const textY = (y: number) => y + L.pad + T.small * 1.6 + L.boxText;
	// The table.
	const kpis = (
		narrow
			? [
					[copy.flaggedShort, String(MONDAY.passed.length)],
					[copy.symbols, String(MONDAY.names)],
				]
			: [
					[copy.flagged, String(MONDAY.passed.length)],
					[copy.symbols, String(MONDAY.names)],
					[copy.median, MONDAY.median.toFixed(2)],
					[copy.highest, volumeToOi(MONDAY.passed[0]).toFixed(2)],
				]
	) as readonly (readonly [Copy, string])[];
	const kpiGap = 12;
	const kpiW = (room - (kpis.length - 1) * kpiGap) / kpis.length;
	const columns = narrow
		? ([[copy.volOi, W - margin - L.pad]] as const)
		: ([
				[copy.volume, W * 0.6],
				[copy.oi, W * 0.74],
				[copy.volOi, W - margin - L.pad],
			] as const);
	const cells = (row: ScreenContract) =>
		narrow
			? [volumeToOi(row).toFixed(2)]
			: [
					row.volume.toLocaleString("en-US"),
					row.openInterest.toLocaleString("en-US"),
					volumeToOi(row).toFixed(2),
				];
	const rowText = (i: number) => L.rowY(i) + L.rowH / 2 + L.nodeText * 0.36;
	return (
		<>
			<Backdrop frame={L} />

			<g data-f="depth">
				<g data-f="world">
					{/* The recipe map. */}
					<g data-f="map">
						{[copy.inputs, copy.live, copy.cells].map((head, i) => (
							<text
								key={head[0]}
								data-f={`col-${i}`}
								x={L.colX(i)}
								y={L.inputY(0) - 12}
								className="wt-film-tag"
								style={{ fontSize: T.small }}
							>
								{t(head).toUpperCase()}
							</text>
						))}
						<g data-f="edges">
							{INPUTS.flatMap((input, i) =>
								SOURCES.map((source, j) => (
									<path
										key={`${input.id}-${source.id}`}
										d={L.curve(inX, mid(L.inputY(i)), srcIn, mid(L.sourceY(j)))}
										className="wt-grid"
										fill="none"
									/>
								)),
							)}
							{CELLS.map((cell, i) => {
								const j = SOURCES.findIndex((s) => s.id === cell.source);
								return j < 0 ? null : (
									<path
										key={cell.id}
										d={L.curve(
											srcOut,
											mid(L.sourceY(j)),
											cellIn,
											mid(L.cellY(i)),
										)}
										className="wt-grid"
										fill="none"
									/>
								);
							})}
						</g>
						{/* The trace, drawn from the cell back to its inputs. */}
						<path
							data-f="trace-cell"
							d={L.curve(
								cellIn,
								mid(L.cellY(BOTTOM)),
								srcOut,
								mid(L.sourceY(LIVE)),
							)}
							className="wt-film-riser"
						/>
						{INPUTS.map((input, i) => (
							<path
								key={input.id}
								data-f={`trace-in-${i}`}
								d={L.curve(srcIn, mid(L.sourceY(LIVE)), inX, mid(L.inputY(i)))}
								className="wt-film-riser"
							/>
						))}
						{INPUTS.map((input, i) =>
							node(input.id, L.colX(0), L.inputY(i), t(input.short)),
						)}
						{SOURCES.map((source, j) =>
							node(source.id, L.colX(1), L.sourceY(j), t(source.short)),
						)}
						{CELLS.map((cell, i) =>
							node(cell.id, L.colX(2), L.cellY(i), t(cell.label)),
						)}
					</g>

					{/* The screen: key figures, the loaded rows, and the rest. */}
					<g data-f="screen">
						{kpis.map(([label, value], i) => (
							<g key={label[0]} data-f={`kpi-${i}`}>
								<rect
									x={margin + i * (kpiW + kpiGap)}
									y={L.kpiY}
									width={kpiW}
									height={L.kpiH}
									rx={10}
									className={i === 0 ? "wt-focus-shape" : "wt-panel-shape"}
								/>
								<text
									x={margin + i * (kpiW + kpiGap) + 12}
									y={L.kpiY + L.kpiH * 0.34}
									className="wt-film-tag"
									style={{ fontSize: T.small }}
								>
									{t(label).toUpperCase()}
								</text>
								<text
									x={margin + i * (kpiW + kpiGap) + 12}
									y={L.kpiY + L.kpiH * 0.84}
									className={`wt-film-num ${i === 0 ? "wt-film-accent" : ""}`}
									style={{ fontSize: T.num * 0.8 }}
								>
									{value}
								</text>
							</g>
						))}
						<g data-f="table-head">
							<text
								x={margin + L.pad}
								y={L.tableY + L.rowH * 0.6}
								className="wt-film-tag"
								style={{ fontSize: T.small }}
							>
								{t(copy.contract).toUpperCase()}
							</text>
							{columns.map(([label, x]) => (
								<text
									key={label[0]}
									x={x}
									y={L.tableY + L.rowH * 0.6}
									textAnchor="end"
									className="wt-film-tag"
									style={{ fontSize: T.small }}
								>
									{t(label).toUpperCase()}
								</text>
							))}
						</g>
						{MONDAY.passed.map((row, i) => {
							const loaded = i < TOP_N;
							return (
								<g key={row.id} data-f={`row-${i}`}>
									<rect
										x={margin}
										y={L.rowY(i)}
										width={room}
										height={L.rowH}
										rx={7}
										className={loaded ? "wt-panel-shape" : "wt-film-ghost"}
									/>
									<text
										x={margin + L.pad}
										y={rowText(i)}
										className={`wt-film-type ${loaded ? "" : "wt-film-dim"}`}
										style={{ fontSize: L.nodeText }}
									>
										{loaded
											? t(screenContractLabel(row))
											: `${t(screenContractLabel(row))} · ${t(copy.notLoaded)}`}
									</text>
									{loaded
										? cells(row).map((value, k) => (
												<text
													key={columns[k][0][0]}
													x={columns[k][1]}
													y={rowText(i)}
													textAnchor="end"
													className="wt-film-num"
													style={{ fontSize: L.nodeText }}
												>
													{value}
												</text>
											))
										: null}
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
				<Lines
					name="q-big"
					text={t(bottomLine(MONDAY))}
					x={W / 2}
					y={H * 0.3 + T.head * 2}
					size={T.head * 1.15}
					maxWidth={room}
				/>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={
						H * 0.3 +
						T.head * 2 +
						lineCount(t(bottomLine(MONDAY)), room, T.head * 1.15) *
							T.head *
							1.15 *
							1.35 +
						T.head
					}
					size={T.head}
					maxWidth={room}
					className="wt-film-type wt-film-accent"
				/>
			</g>
			{headline("m-head", copy.mapHead, copy.mapHeadShort)}
			{headline("b-head", copy.traceHead, copy.traceHeadShort)}
			<Lines
				name="t-head"
				text={t(narrow ? copy.takeHeadShort : copy.takeHead)}
				x={L.margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.traceHeadShort : copy.traceHead),
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

			{/* Two text cells, run for two sessions. */}
			<g data-f="cells">
				{/* On a phone the headlines name the day; the run label would sit on them. */}
				<g visibility={narrow ? "hidden" : undefined}>
					<Word
						name="run-mon"
						x={margin}
						y={L.boxTop - T.small * 1.4}
						size={T.small}
						anchor="start"
						className="wt-film-tag"
					>
						{t(runTag(MONDAY.on)).toUpperCase()}
					</Word>
					<Word
						name="run-tue"
						x={margin}
						y={L.boxTop - T.small * 1.4}
						size={T.small}
						anchor="start"
						className="wt-film-tag wt-film-accent"
					>
						{t(runTag(TUESDAY.on)).toUpperCase()}
					</Word>
				</g>
				{box(
					"bl",
					L.boxTop,
					bottomH,
					copy.bottomTitle,
					copy.liveTag,
					"wt-film-accent",
				)}
				{box(
					"tk",
					takeTop,
					takeH,
					copy.takeTitle,
					copy.contentTag,
					"wt-film-dim",
				)}
				{(
					[
						["bl-mon", bottomLine(MONDAY), L.boxTop],
						["bl-tue", bottomLine(TUESDAY), L.boxTop],
						["tk-text", TAKEAWAYS, takeTop],
					] as const
				).map(([name, text, y]) => (
					<Lines
						key={name}
						name={name}
						text={t(text)}
						x={margin + L.pad}
						y={textY(y)}
						size={L.boxText}
						maxWidth={L.textWidth}
						anchor="start"
					/>
				))}
			</g>
			{headline("r-head", copy.runHead, copy.runHeadShort)}
			<Lines
				name="u-head"
				text={t(narrow ? copy.tuesdayHeadShort : copy.tuesdayHead)}
				x={L.margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.runHeadShort : copy.runHead),
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
			<Brackets name="lock-evidence" glow />
			{claim("evidence", copy.evidenceBig, copy.evidenceSub)}
			{headline("p-head", copy.tableHead, copy.tableHeadShort)}
			{headline("x-head", copy.restHead, copy.restHeadShort)}
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
	const ids = [
		...INPUTS.map((input) => input.id),
		...SOURCES.map((source) => source.id),
		...CELLS.map((cell) => cell.id),
	];
	const nodes = (name: string) => [one(`n-${name}`), one(`l-${name}`)];
	const draw = (path: SVGPathElement, at: number, duration = 0.5) => {
		const length = path.getTotalLength();
		tl.fromTo(
			path,
			{ opacity: 0, strokeDasharray: length, strokeDashoffset: length },
			{ opacity: 1, strokeDashoffset: 0, duration, ease: "power2.inOut" },
			at,
		);
	};
	const word = (target: Element, at: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			at,
		);
	const traceIns = INPUTS.map((_, i) => one<SVGPathElement>(`trace-in-${i}`));
	const rows = MONDAY.passed.map((_, i) => one(`row-${i}`));

	const lockEvidence = one<SVGGraphicsElement>("lock-evidence");

	d.hidden([
		one("screen"),
		...[0, 1, 2].map((i) => one(`col-${i}`)),
		one("edges"),
		one("trace-cell"),
		...traceIns,
		...ids.flatMap((id) => [...nodes(id), one(`f-${id}`)]),
		...kids("screen").filter((el) => el.getAttribute("data-f")),
		...flat("q"),
		...flat("cells"),
		one("bl-box"),
		one("tk-box"),
		one("bl-focus"),
		one("tk-focus"),
		one("bl-title"),
		one("tk-title"),
		one("bl-tag"),
		one("tk-tag"),
		...[
			"m-head",
			"b-head",
			"t-head",
			"r-head",
			"u-head",
			"p-head",
			"x-head",
		].map((name) => one(name)),
		...kids("evidence"),
		lockEvidence,
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: a sentence from the report ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	word(one("q-big"), 4.8);
	show(one("q-line"), 6.0);

	// ——— map: trace a sentence back ———
	tl.addLabel("map", 9.6);
	hide(flat("q"), 9.6);
	show(one("m-head"), 9.8, "above");
	rise(9.9);
	[0, 1, 2].forEach((i) => {
		show(one(`col-${i}`), 10.3 + i * 0.25);
	});
	INPUTS.forEach((input, i) => {
		show(nodes(input.id), 10.5 + i * 0.08, "right");
	});
	SOURCES.forEach((source, j) => {
		show(nodes(source.id), 11.0 + j * 0.12, "right");
	});
	CELLS.forEach((cell, i) => {
		show(nodes(cell.id), 11.3 + i * 0.1, "right");
	});
	tl.to(one("edges"), { opacity: 1, duration: 0.6 }, 11.7);
	// The Bottom line, back to its inputs.
	d.swap(one("m-head"), one("b-head"), 13.4);
	const dim = [
		...SOURCES.filter((_, j) => j !== LIVE).flatMap((s) => nodes(s.id)),
		...CELLS.filter((_, i) => i !== BOTTOM).flatMap((c) => nodes(c.id)),
	];
	tl.to(dim, { opacity: 0.3, duration: 0.4 }, 13.8);
	tl.to(one("edges"), { opacity: 0.35, duration: 0.4 }, 13.8);
	tl.to(one(`f-${CELLS[BOTTOM].id}`), { opacity: 1, duration: 0.3 }, 13.8);
	draw(one<SVGPathElement>("trace-cell"), 14.1);
	tl.to(one(`f-${SOURCES[LIVE].id}`), { opacity: 1, duration: 0.3 }, 14.6);
	traceIns.forEach((path) => {
		draw(path, 14.8, 0.6);
	});
	tl.to(
		INPUTS.map((input) => one(`f-${input.id}`)),
		{ opacity: 1, duration: 0.3 },
		15.4,
	);
	// The Takeaways: nothing in.
	show(one("t-head"), 16.0);
	tl.to(
		[one("trace-cell"), ...traceIns, ...ids.map((id) => one(`f-${id}`))],
		{ opacity: 0, duration: 0.4 },
		16.0,
	);
	tl.to(
		ids.filter((id) => id !== CELLS[TAKE].id).flatMap((id) => nodes(id)),
		{ opacity: 0.3, duration: 0.4 },
		16.0,
	);
	tl.to(nodes(CELLS[TAKE].id), { opacity: 1, duration: 0.3 }, 16.0);
	tl.to(one(`f-${CELLS[TAKE].id}`), { opacity: 1, duration: 0.4 }, 16.3);

	// ——— content: computed and written ———
	tl.addLabel("content", 19.6);
	hide([one("b-head"), one("t-head")], 19.6);
	sink(19.6);
	show(one("r-head"), 19.95, "above");
	show(one("run-mon"), 20.2);
	show([one("bl-box"), one("bl-title")], 20.4);
	show(one("bl-mon"), 20.6);
	show([one("tk-box"), one("tk-title")], 20.9);
	show(one("tk-text"), 21.1);
	// Tuesday's run: the Bottom line flips, the Takeaways hold still. The map's labels.
	show(one("u-head"), 23.7);
	d.flip(one("run-mon"), one("run-tue"), 23.9);
	tl.set(one("run-mon"), { opacity: 0 }, 24.2);
	d.flip(one("bl-mon"), one("bl-tue"), 24.1);
	tl.set(one("bl-mon"), { opacity: 0 }, 24.4);
	tl.to(one("bl-focus"), { opacity: 1, duration: 0.4 }, 24.3);
	show(one("bl-tag"), 24.7, "right");
	show(one("tk-tag"), 25.1, "right");
	// Cut: evidence against method. The hero.
	hide(
		[
			one("r-head"),
			one("u-head"),
			...flat("cells"),
			one("bl-box"),
			one("tk-box"),
			one("bl-focus"),
			one("bl-title"),
			one("tk-title"),
			one("bl-tag"),
			one("tk-tag"),
		],
		27.3,
	);
	word(one("evidence-big"), 27.7);
	show(one("evidence-sub"), 27.9);
	d.lock(lockEvidence, 28.3, { around: one("evidence-big"), pad: 10 });
	tl.addLabel("hero-lock", 28.3);

	// ——— population: the table and the count ———
	tl.addLabel("population", 31.4);
	hide([...kids("evidence"), lockEvidence], 31.4);
	tl.set(one("map"), { opacity: 0 }, 31.5);
	tl.set(one("screen"), { opacity: 1 }, 31.5);
	show(one("p-head"), 31.75, "above");
	rise(31.8);
	show(one("table-head"), 32.3);
	rows.slice(0, TOP_N).forEach((row, i) => {
		show(row, 32.5 + i * 0.25);
	});
	// The key figures count every contract that passed; two never reached the table.
	d.swap(one("p-head"), one("x-head"), 35.3);
	rows.slice(TOP_N).forEach((row, i) => {
		show(row, 35.35 + i * 0.2);
	});
	kids("screen")
		.filter((el) => el.getAttribute("data-f")?.startsWith("kpi-"))
		.forEach((kpi, i) => {
			show(kpi, 35.7 + i * 0.2, "above");
		});
	// Cut: the claim.
	hide(one("x-head"), 39.2);
	sink(39.2);
	word(one("claim-big"), 39.6);
	show(one("claim-sub"), 40);

	// ——— next ———
	tl.addLabel("next", 43.7);
	hide(kids("claim"), 43.7);
	d.close(43.7);
	return tl;
}

export const recipeMapFilm: Film = {
	id: "recipe-map",
	label: [
		`Reading a recipe like an auditor, as a short film: a sentence from the screener's Bottom line and the question of where it comes from; the recipe map tracing the Bottom line to Live data 1 and from there to the session and five thresholds, while the Takeaways have no line in; Monday's and Tuesday's runs, where the Bottom line changes and the Takeaways read word for word the same; and the screen's table of the top ${TOP_N} by volume/OI against key figures that count ${MONDAY.passed.length} contracts, ${MONDAY.passed.length - TOP_N} of them passed but not loaded`,
		`像审计员一样读 Recipe 短片：筛选器核心结论里的一句话，以及它从哪里来；Recipe 地图把核心结论追溯到实时数据 1，再到交易时段和五个阈值，而要点没有任何输入线；周一和周二两次运行，核心结论变了，要点一字不差；以及筛选的成交量/OI 前 ${TOP_N} 名表格，对照关键数字统计的 ${MONDAY.passed.length} 份合约，其中 ${MONDAY.passed.length - TOP_N} 份通过但未载入`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Read a recipe", "读 Recipe"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "map", label: ["The map", "地图"] },
		{ id: "content", label: ["Written vs computed", "写好的与算出的"] },
		{ id: "population", label: ["Shown vs passed", "展示的与通过的"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
