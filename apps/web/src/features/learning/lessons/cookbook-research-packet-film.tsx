import { useId } from "react";
import {
	type Copy,
	count,
	mondayPacket,
	pick,
	rowContracts,
	rowPremium,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import type { Film, FilmContext } from "../walkthrough/film";
import {
	Backdrop,
	Brackets,
	createDirector,
	filmFrame,
	Hatch,
	Lines,
	lineCount,
	TitleCard,
	toneClass,
	Word,
} from "../walkthrough/film-kit";
import { textWidth } from "../walkthrough/text-measure";
import {
	COVERED,
	dollars,
	fields,
	MONDAY,
	records,
	reruns,
	rerunText,
	rowById,
	SERIES,
	spreadLegs,
	TUESDAY,
	WITHOUT_SPREAD,
} from "./cookbook-research-packet-model";

/*
 * Research packets, as a film. Someone else reruns your packet: will they get $165,520?
 * The packet's rows answer: R2 traced to its trades, 5 × $2.00 and 500 × $2.15, × 100,
 * = $108,500; the rows summed one by one to $165,520, which becomes "≥ $165,520" when R5,
 * the 120 call, has no data. The hero is the fields a reader reruns from, against P1's
 * figure: drop the formula and they get $1,655.20, ÷ 100; drop the exclusions and
 * $171,720, +$6,200, where glowing brackets lock. Last, the log: Tuesday's rerun saves
 * P2, and leaving out the spread is a new method, P3, a new question.
 *
 *   open      0–4        "Research packets"
 *   question  4–8.6      will a reader get $165,520?
 *   rows      8.6–18.6   five rows; R2 traced; summed; a subtotal of 4 of 5
 *   fields    18.6–31.55 hero: without the formula; without the exclusions,
 *                        held; then the field goes back and the figure is P1's again
 *   log       31.55–41.4 P1; add R5 to make P2; remove the two spread portions for P3
 *   claim     41.4–45.8  work someone else can rerun
 *   next      45.8–47.5  Next: recaps, with the standard close
 */

const END = 47.5;
const R2 = rowById("R2");
const R3 = rowById("R3");
const R2_TRADES = R2?.trades ?? [];
const tradePremium = (row: typeof R2, tradeId: string) => {
	const trade = row?.trades?.find((item) => item.id === tradeId);
	return trade ? trade.price * trade.quantity * 100 : 0;
};
const spreadProof: readonly [Copy, Copy] = [
	[
		`R2 ${dollars(tradePremium(R2, "T-3"))} + R3 ${dollars(tradePremium(R3, "leg"))}`,
		`R2 ${dollars(tradePremium(R2, "T-3"))} + R3 ${dollars(tradePremium(R3, "leg"))}`,
	],
	[`= ${dollars(spreadLegs)}`, `= ${dollars(spreadLegs)}`],
];

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, room } = frame;
	return {
		...frame,
		rowY: (i: number) =>
			H * (narrow ? 0.27 : 0.27) + i * H * (narrow ? 0.075 : 0.075),
		rowH: H * (narrow ? 0.06 : 0.06),
		traceY: H * (narrow ? 0.68 : 0.7),
		fieldY: (i: number) =>
			H * (narrow ? 0.26 : 0.27) + i * H * (narrow ? 0.095 : 0.095),
		fieldH: H * (narrow ? 0.078 : 0.078),
		/** Wide enough for the widest label, which the mono tag sets with some tracking. */
		labelW: Math.max(
			narrow ? room * 0.32 : room * 0.2,
			...fields.map(
				(field) =>
					textWidth(field.label[0].toUpperCase(), frame.type.small) * 1.15 + 28,
			),
		),
		rerunY: H * (narrow ? 0.7 : 0.72),
		recY: (i: number) =>
			H * (narrow ? 0.27 : 0.27) + i * H * (narrow ? 0.19 : 0.19),
		recH: H * 0.16,
		spreadRecH: H * 0.25,
	};
}

const copy = {
	title: ["Research packets", "研究包"],
	titleSub: ["work someone else can rerun", "他人可以重跑的工作"],
	qTag: [
		"packet P1 · Oct 18 calls · Monday",
		"研究包 P1 · 10月18日 看涨 · 周一",
	],
	qLine: [
		`P1 reports at least ${dollars(MONDAY)}.`,
		`P1 报告至少 ${dollars(MONDAY)}。`,
	],
	qBig: ["Would someone else get the same?", "别人重跑会得到同样的数吗？"],
	pHead: [
		"One row per series, traced to trades.",
		"每个序列一行，可追溯到成交。",
	],
	p2Head: [
		"A subtotal: one series has no data.",
		"是小计：有一个序列没有数据。",
	],
	coverage: [
		`${COVERED} of ${SERIES} series`,
		`${SERIES} 个序列中的 ${COVERED} 个`,
	],
	savedCoverage: [
		`Subtotal · ${COVERED} of ${SERIES} series`,
		`观测小计 · ${COVERED}/${SERIES} 个序列`,
	],
	p1Says: [`P1: ${dollars(MONDAY)}`, `P1：${dollars(MONDAY)}`],
	whyFormula: [reruns.formula.why[0], reruns.formula.why[1]],
	whyExclusions: [
		`+${dollars(reruns.exclusions.cents - MONDAY)} · ${reruns.exclusions.why[0]}`,
		`+${dollars(reruns.exclusions.cents - MONDAY)} · ${reruns.exclusions.why[1]}`,
	],
	noData: ["no data yet", "尚无数据"],
	coveredZero: ["covered, zero", "已覆盖，零"],
	r5Cause: [
		`+${dollars(TUESDAY - MONDAY)} · R5: late Monday data`,
		`+${dollars(TUESDAY - MONDAY)} · R5：周一数据延迟`,
	],
	fHead: ["A reader reruns it from its fields.", "读者按它的字段重跑。"],
	f2Head: ["Drop a field, and the number breaks.", "少一个字段，数字就错了。"],
	reader: ["a reader's rerun", "读者重跑"],
	lHead: ["Save each rerun as its own record.", "每次重跑另存一条记录。"],
	l2Head: ["A new method is a new question.", "新方法就是新问题。"],
	claimBig: [
		"Leave work that someone else can rerun.",
		"留下别人能重跑的工作。",
	],
	claimSub: [
		"Write the as-of time, formula and exclusions.",
		"写明截至时间、公式和排除项。",
	],
	nextBig: ["Next: recaps", "下一课：复盘"],
	nextSub: ["claims with evidence", "证据支持的结论"],
	nextCta: ["Try it ↓", "亲自试试 ↓"],
} as const satisfies Record<string, Copy>;

function Scene({
	width,
	locale,
}: {
	width: number;
	height: number;
	locale: Locale;
}) {
	const unknownHatch = `cookbook-r5-${useId().replace(/:/g, "")}`;
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
	/** The rerun's figure: on a phone, larger than the type scale's floor. */
	const rerunSize = narrow ? T.num * 1.4 : T.num;
	const spreadProofSize = T.body;
	const spreadProofY = L.recY(2) + L.recH * 0.6 + spreadProofSize * 1.65;
	return (
		<>
			<Backdrop frame={L} />
			<defs>
				<Hatch id={unknownHatch} />
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
					y={H * 0.43}
					size={T.head}
					maxWidth={room}
					className="wt-film-type wt-film-accent"
				/>
				<Lines
					name="q-big"
					text={t(copy.qBig)}
					x={W / 2}
					y={H * 0.6}
					size={T.title}
					maxWidth={room}
				/>
			</g>

			{/* The rows. */}
			{headline("p-head", copy.pHead)}
			{/* Each answer, a line under its headline, as the stage makes it. */}
			<Lines
				name="p2-head"
				text={t(copy.p2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.pHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			{mondayPacket.map((row, i) => {
				const premium = rowPremium(row);
				return (
					<g key={row.id} data-f={`row-${i}`}>
						<rect
							data-f={`row-${i}-box`}
							x={margin}
							y={L.rowY(i)}
							width={room}
							height={L.rowH}
							rx={9}
							className="wt-panel-shape"
						/>
						{premium === null && (
							<rect
								x={margin}
								y={L.rowY(i)}
								width={room}
								height={L.rowH}
								rx={9}
								fill={`url(#${unknownHatch})`}
							/>
						)}
						<text
							x={margin + 12}
							y={L.rowY(i) + L.rowH / 2 + text * 0.36}
							className="wt-film-num wt-film-dim"
							style={{ fontSize: text }}
						>
							{row.id}
						</text>
						<text
							x={margin + (narrow ? 44 : 70)}
							y={L.rowY(i) + L.rowH / 2 + text * 0.36}
							className="wt-film-type"
							style={{ fontSize: text }}
						>
							{t([`${row.strike} call`, `${row.strike} 看涨`])}
						</text>
						<text
							x={margin + room * (narrow ? 0.62 : 0.6)}
							y={L.rowY(i) + L.rowH / 2 + text * 0.36}
							textAnchor="end"
							className="wt-film-num wt-film-dim"
							style={{ fontSize: text }}
						>
							{rowContracts(row) === null
								? ""
								: premium === 0
									? t(copy.coveredZero)
									: count(rowContracts(row) ?? 0)}
						</text>
						<text
							data-f={`row-${i}-premium`}
							x={margin + room - 12}
							y={L.rowY(i) + L.rowH / 2 + text * 0.36}
							textAnchor="end"
							className={`wt-film-num ${premium === null ? toneClass.caution : premium === 0 ? "wt-film-dim" : ""}`}
							style={{ fontSize: text }}
						>
							{premium === null ? t(copy.noData) : dollars(premium)}
						</text>
					</g>
				);
			})}
			<text
				data-f="contracts-head"
				x={margin + room * (narrow ? 0.62 : 0.6) - text * 0.6}
				y={L.rowY(0) - T.small * 0.65}
				textAnchor="middle"
				className="wt-film-tag"
				style={{ fontSize: T.small }}
			>
				{t(["CONTRACTS", "张数"])}
			</text>
			<g data-f="trace">
				{R2_TRADES.map((trade, i) => (
					<text
						key={trade.id}
						x={margin}
						y={L.traceY + i * T.body * 1.4}
						className="wt-film-num"
						style={{ fontSize: T.body }}
					>
						{`${i === 0 ? "R2 =" : "+"} ${count(trade.quantity)} × ${usd(trade.price)} × 100`}
					</text>
				))}
			</g>
			<text
				data-f="trace-result"
				x={margin}
				y={L.traceY + R2_TRADES.length * T.body * 1.4}
				className="wt-film-num wt-film-accent"
				style={{ fontSize: T.body }}
			>
				{`= ${dollars(rowPremium(R2 ?? mondayPacket[0]) ?? 0)}`}
			</text>
			<text
				data-f="sum-ge"
				x={margin + room - 12}
				y={L.traceY + (narrow ? T.small * 2 + T.head * 1.2 : T.small)}
				textAnchor="end"
				className="wt-film-num wt-film-warn"
				style={{ fontSize: narrow ? T.head : T.num }}
			>
				{`≥ ${dollars(MONDAY)}`}
			</text>
			<text
				data-f="subtotal"
				x={margin + room - 12}
				y={
					L.traceY +
					(narrow ? T.small * 2 + T.head * 1.2 : T.small) +
					T.body * 1.8
				}
				textAnchor="end"
				className="wt-film-type wt-film-dim"
				style={{ fontSize: text }}
			>
				{t(copy.coverage)}
			</text>

			{/* The fields a reader reruns from. */}
			{headline("f-head", copy.fHead)}
			<Lines
				name="f2-head"
				text={t(copy.f2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.fHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			<Brackets name="lock-rerun" tone="caution" glow />
			{fields.map((field, i) => (
				<g key={field.id} data-f={`field-${field.id}`}>
					<rect
						data-f={`field-${field.id}-box`}
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
			<text
				data-f="rerun-tag"
				x={margin}
				y={L.rerunY}
				className="wt-film-tag"
				style={{ fontSize: T.small }}
			>
				{t(copy.reader).toUpperCase()}
			</text>
			{(
				[
					["rerun-formula", "formula"],
					["rerun-exclusions", "exclusions"],
					["rerun-back", null],
				] as const
			).map(([name, removed]) => (
				<text
					key={name}
					data-f={name}
					x={margin}
					y={L.rerunY + rerunSize * 1.3}
					className={`wt-film-num ${removed ? toneClass.caution : toneClass.focus}`}
					style={{ fontSize: rerunSize }}
				>
					{rerunText(removed)}
				</text>
			))}
			<text
				data-f="p1-says"
				x={margin + textWidth(rerunText("formula"), rerunSize) + 24}
				y={L.rerunY + rerunSize * 1.3}
				className="wt-film-num wt-film-dim"
				style={{ fontSize: text }}
			>
				{t(copy.p1Says)}
			</text>
			{(
				[
					["why-formula", copy.whyFormula],
					["why-exclusions", copy.whyExclusions],
				] as const
			).map(([name, why]) => (
				<text
					key={name}
					data-f={name}
					x={margin}
					y={L.rerunY + rerunSize * 1.3 + text * 1.9}
					className={`wt-film-type ${name === "why-exclusions" ? toneClass.up : toneClass.caution}`}
					style={{ fontSize: text }}
				>
					{t(why)}
				</text>
			))}

			{/* The log. */}
			{headline("l-head", copy.lHead)}
			<Lines
				name="l2-head"
				text={t(copy.l2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.lHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			<text
				data-f="log-r5-cause"
				x={margin + 16}
				y={L.recY(1) - H * 0.009}
				className={`wt-film-num ${toneClass.up}`}
				style={{ fontSize: T.small }}
			>
				{t(copy.r5Cause)}
			</text>
			{records.map((record, i) => (
				<g key={record.id} data-f={`rec-${i}`}>
					<rect
						data-f={`rec-${i}-box`}
						x={margin}
						y={L.recY(i)}
						width={room}
						height={i === 2 ? L.spreadRecH : L.recH}
						rx={12}
						className="wt-panel-shape"
						style={record.method === 2 ? { strokeDasharray: "5 4" } : undefined}
					/>
					<text
						x={margin + 16}
						y={L.recY(i) + L.recH * 0.28}
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(record.head).toUpperCase()}
					</text>
					{i === 0 && (
						<text
							data-f={`rec-${i}-n`}
							x={margin + 16}
							y={L.recY(i) + L.recH * 0.6}
							className="wt-film-num"
							style={{ fontSize: narrow ? T.head : T.head * 1.1 }}
						>
							{dollars(record.cents)}
						</text>
					)}
					{i < 2 && (
						<text
							data-f={`rec-${i}-note`}
							x={margin + 16}
							y={L.recY(i) + L.recH * 0.85}
							className="wt-film-type wt-film-dim"
							style={{ fontSize: T.small * 1.05 }}
						>
							{t(i === 0 ? copy.savedCoverage : record.note)}
						</text>
					)}
					{i === 0 && (
						<text
							data-f={`rec-${i}-tag`}
							x={margin + room - 16}
							y={L.recY(i) + L.recH * 0.6}
							textAnchor="end"
							className="wt-film-tag"
							style={{ fontSize: T.small }}
						>
							{t(record.tag).toUpperCase()}
						</text>
					)}
				</g>
			))}

			{/* A compact two-leg proof shows the combined spread removed from P3. */}
			<g data-f="log-spread-proof">
				<text
					x={margin + 16}
					y={spreadProofY}
					className="wt-film-num"
					style={{ fontSize: spreadProofSize }}
				>
					{t(spreadProof[0])}
				</text>
				<text
					x={margin + room - 16}
					y={spreadProofY + spreadProofSize * 1.25}
					textAnchor="end"
					className="wt-film-num"
					style={{ fontSize: spreadProofSize }}
				>
					{t(spreadProof[1])}
				</text>
			</g>

			{/* P2's delta and P3's subtraction share a baseline inside their records. */}
			{(
				[
					[1, "+ ", TUESDAY],
					[2, `${dollars(TUESDAY)} − `, WITHOUT_SPREAD],
				] as const
			).map(([i, expression, result]) => {
				const contribution = i === 1 ? TUESDAY - MONDAY : spreadLegs;
				const suffix = `${dollars(contribution)} = `;
				const resultSize = narrow ? T.head : T.head * 1.1;
				const equationSize = narrow
					? Math.min(
							T.head,
							((room - 32) * 0.98 - textWidth(dollars(result), resultSize)) /
								textWidth(expression + suffix, 1),
						)
					: T.body;
				const operandX = margin + 16 + textWidth(expression, equationSize);
				const equationY = L.recY(i) + L.recH * 0.6;
				return (
					<g key={`log-equation-${i}`}>
						<text
							data-f={`log-${i}-expression`}
							x={margin + 16}
							y={equationY}
							className="wt-film-num"
							style={{ fontSize: equationSize }}
						>
							{expression}
						</text>
						<text
							data-f={`log-${i}-operand`}
							x={operandX}
							y={equationY}
							className="wt-film-num"
							style={{ fontSize: equationSize }}
						>
							{dollars(contribution)}
						</text>
						<text
							data-f={`log-${i}-equals`}
							x={
								operandX + textWidth(`${dollars(contribution)} `, equationSize)
							}
							y={equationY}
							className="wt-film-num"
							style={{ fontSize: equationSize }}
						>
							{i === 1 ? "→" : "="}
						</text>
						<text
							data-f={`log-${i}-result`}
							x={
								narrow
									? margin + room - 16
									: margin +
										16 +
										textWidth(expression + suffix, equationSize) +
										textWidth(dollars(result), resultSize)
							}
							textAnchor="end"
							y={equationY}
							className="wt-film-num"
							style={{ fontSize: resultSize }}
						>
							{dollars(result)}
						</text>
					</g>
				);
			})}

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
			<g data-f="end">
				{(
					[
						["end-next", copy.nextBig, H * 0.46, T.title, "wt-film-type"],
						[
							"end-why",
							copy.nextSub,
							H * 0.46 + T.title,
							T.body,
							"wt-film-type wt-film-dim",
						],
						[
							"end-cta",
							copy.nextCta,
							H * 0.46 + T.title + T.body * 2.6,
							T.body,
							"wt-film-type wt-film-accent",
						],
					] as const
				).map(([name, value, y, size, className]) => (
					<Lines
						key={name}
						name={name}
						text={t(value)}
						x={W / 2}
						y={y}
						size={size}
						maxWidth={room}
						className={className}
					/>
				))}
			</g>
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
	/** A figure lands slightly large and settles, without overshoot: it is data. */
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const heads = [
		"p-head",
		"p2-head",
		"f-head",
		"f2-head",
		"l-head",
		"l2-head",
	].map((name) => one(name));
	const lockRerun = one<SVGGraphicsElement>("lock-rerun");
	const rows = mondayPacket.map((_, i) => one(`row-${i}`));
	const r2 = mondayPacket.findIndex((row) => row.id === "R2");
	const fieldRows = fields.map((field) => one(`field-${field.id}`));
	const rerunMarks = ["rerun-formula", "rerun-exclusions"].map((name) =>
		one(name),
	);
	const recs = records.map((_, i) => one(`rec-${i}`));
	/** A field goes missing: its card fades. */
	const drop = (id: string, time: number) => {
		tl.to(one(`field-${id}`), { opacity: 0.25, duration: 0.3 }, time);
	};
	const restore = (id: string, time: number) => {
		tl.to(one(`field-${id}`), { opacity: 1, duration: 0.3 }, time);
	};

	d.hidden([
		...flat("q"),
		...heads,
		...rows,
		one("contracts-head"),
		one("trace"),
		one("trace-result"),
		one("sum-ge"),
		one("subtotal"),
		...fieldRows,
		one("rerun-tag"),
		...rerunMarks,
		one("rerun-back"),
		one("rec-0-n"),
		one("rec-0-note"),
		one("log-spread-proof"),
		...[1, 2].flatMap((i) => [
			one(`log-${i}-expression`),
			one(`log-${i}-operand`),
			one(`log-${i}-equals`),
			one(`log-${i}-result`),
		]),
		one("p1-says"),
		one("why-formula"),
		one("why-exclusions"),
		lockRerun,
		one("log-r5-cause"),
		...recs,
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	show(one("q-line"), 4.8);
	word(one("q-big"), 5.1);

	// ——— rows: traced and summed ———
	tl.addLabel("rows", 8.6);
	hide(flat("q"), 8.6);
	show(heads[0], 8.8);
	show(one("contracts-head"), 9.2);
	rows.forEach((row, i) => {
		show(row, 10.7 + i * 0.1, "right", 0.35);
	});
	tl.set(one(`row-${r2}-box`), { attr: { class: "wt-focus-shape" } }, 11.5);
	show(one("trace"), 11.5, "below", 0.3);
	// The trace comes to R2's figure, which lights with it.
	// The terms and result settle before the final subtotal appears at 14.5.
	show(one("trace-result"), 11.8, "below", 0.3);
	tl.set(
		one(`row-${r2}-premium`),
		{ attr: { class: `wt-film-num ${toneClass.focus}` } },
		11.9,
	);
	tl.set(one(`row-${r2}-box`), { attr: { class: "wt-panel-shape" } }, 14.1);
	tl.set(one(`row-${r2}-premium`), { attr: { class: "wt-film-num" } }, 14.1);
	// The final lower bound appears after the row amounts are established together.
	show(one("sum-ge"), 14.5, "below", 0.3);
	show(one("subtotal"), 14.5);
	show(heads[1], 14.5);
	// "4 of 5": the four rows the floor counts light together; R5 stays out.
	mondayPacket.forEach((row, i) => {
		if (rowPremium(row) === null) return;
		const box = one(`row-${i}-box`);
		tl.set(box, { attr: { class: "wt-focus-shape" } }, 16.5);
		tl.set(box, { attr: { class: "wt-panel-shape" } }, 17.7);
	});

	// ——— fields: the hero. A reader reruns it from its fields. ———
	tl.addLabel("fields", 18.6);
	d.swap([heads[0], heads[1]], heads[2], 18.6);
	hide(
		[
			...rows,
			one("trace"),
			one("trace-result"),
			one("sum-ge"),
			one("subtotal"),
			one("contracts-head"),
		],
		18.6,
	);
	// The intact fields stand for a full second before the first one is removed.
	fieldRows.forEach((row, i) => {
		show(row, 18.95 + i * 0.05, "right", 0.35);
	});
	show(one("rerun-tag"), 19.55, "below", 0.3);
	// Establish P1's comparison once. The restored match supplies the correct rerun;
	// an earlier duplicate match and duplicate division line are unnecessary.
	drop("formula", 20.45);
	word(rerunMarks[0], 20.45);
	show(one("p1-says"), 20.45, "below", 0.3);
	show(one("why-formula"), 20.45, "below", 0.3);
	show(heads[3], 20.45);
	// The shortened reason clears at the unchanged handoff time.
	// Change fields only in the gap between the outgoing and incoming figures.
	const fold = (target: Element, at: number) => {
		tl.to(
			target,
			{
				scaleY: 0,
				transformOrigin: "50% 50%",
				duration: 0.3,
				ease: "power2.in",
			},
			at,
		);
		tl.set(target, { opacity: 0 }, at + 0.3);
	};
	const unfold = (target: Element, at: number) =>
		tl.fromTo(
			target,
			{ opacity: 1, scaleY: 0, transformOrigin: "50% 50%" },
			{ scaleY: 1, duration: 0.35, ease: "power2.out" },
			at,
		);
	fold(rerunMarks[0], 23.75);
	fold(one("why-formula"), 23.75);
	restore("formula", 24.05);
	drop("exclusions", 24.05);
	unfold(rerunMarks[1], 24.35);
	unfold(one("why-exclusions"), 24.35);
	// The compact signed difference has more than 1 s before the lock.
	d.lock(lockRerun, 27.95, {
		around: [
			one("rerun-tag"),
			rerunMarks[1],
			one("p1-says"),
			one("why-exclusions"),
		],
		pad: 10,
	});
	tl.addLabel("hero-lock", 27.95);
	// Brackets settle at 28.4; nothing exits until 29.9 (a full 1.5 s).
	hide([one("why-exclusions")], 29.9);
	hide(lockRerun, 29.95, 0.3);
	fold(rerunMarks[1], 29.9);
	restore("exclusions", 30.2);
	unfold(one("rerun-back"), 30.2);
	// The field, comparison and focus figure are intact and quiet for 30.55–31.55.

	// ——— log: rerun, or a new question ———
	tl.addLabel("log", 31.55);
	d.swap([heads[2], heads[3]], heads[4], 31.55);
	hide([one("rerun-tag"), one("p1-says"), ...fieldRows], 31.55, 0.3, 0);
	show(recs[0], 31.85, "right", 0.3);
	tl.set(one("rerun-back"), { attr: { class: "wt-film-num" } }, 32.15);
	d.carry(
		one<SVGGraphicsElement>("rerun-back"),
		one<SVGGraphicsElement>("rec-0-n"),
		32.15,
		{ duration: 0.4 },
	);
	// Qualify the saved number only after its carry lands; this note never flies.
	tl.fromTo(
		one("rec-0-note"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		32.55,
	);
	// Save P2 in place: its equation clears while the result stays as the readout.
	const saveResult = (clearAt: number) => {
		const operands = [
			one("log-1-expression"),
			one("log-1-operand"),
			one("log-1-equals"),
		];
		hide(operands, clearAt, 0.3, 0);
	};
	// P1 reads alone for 32.85–33.85. The complete P2 equation and R5's late
	// Monday data note arrive together, then stay settled through 35.95.
	show(
		[
			recs[1],
			one("log-r5-cause"),
			one("log-1-expression"),
			one("log-1-operand"),
			one("log-1-equals"),
			one("log-1-result"),
		],
		33.85,
		"below",
		0.3,
	);
	// The complete P2 equation reads quietly until its operands clear at 35.95.
	saveResult(35.95);
	show(heads[5], 37.25, "below", 0.3);
	show(
		[
			recs[2],
			one("log-spread-proof"),
			one("log-2-expression"),
			one("log-2-operand"),
			one("log-2-equals"),
			one("log-2-result"),
		],
		37.25,
		"below",
		0.3,
	);
	tl.to(
		[recs[0], recs[1], one("log-1-result"), one("log-r5-cause")],
		{ opacity: 0.45, duration: 0.3 },
		37.25,
	);
	// P3's two-leg proof and subtraction hold through the claim handoff.

	// ——— claim ———
	tl.addLabel("claim", 41.4);
	hide(
		[
			heads[4],
			heads[5],
			...recs,
			one("log-1-result"),
			one("log-2-expression"),
			one("log-2-operand"),
			one("log-2-equals"),
			one("log-2-result"),
			one("log-r5-cause"),
			one("log-spread-proof"),
		],
		41.4,
	);
	word(one("z-big"), 41.7);
	show(one("z-sub"), 42.1);

	// ——— next ———
	tl.addLabel("next", 45.8);
	hide(kids("claim"), 45.8);
	// The standard close owns the staggered card and the title-card time shift.
	d.close(45.8);
	return tl;
}

export const researchPacketFilm: Film = {
	id: "cookbook-research-packet",
	label: [
		`Research packets, as a short film: packet P1, one row per Oct 18 call from 100 to 120, with R2 traced to its trades and four rows summed to ${dollars(MONDAY)}, an observed subtotal over ${COVERED} of ${SERIES} series; a reader's rerun from the packet's fields, which matches with every field, gives ${rerunText("formula")} without the formula and ${rerunText("exclusions")} without the exclusions; and a log where Tuesday's rerun saves P2 at ${dollars(TUESDAY)} and a method without the spread's legs saves P3, ${dollars(WITHOUT_SPREAD)}, as a new question`,
		`研究包短片：研究包 P1，10月18日 100 到 120 的看涨每个一行，R2 追溯到它的成交，四行合计 ${dollars(MONDAY)}，是覆盖 ${SERIES} 个中 ${COVERED} 个序列的观测小计；读者按研究包的字段重跑，字段齐全时一致，没有公式得到 ${rerunText("formula")}，没有排除项得到 ${rerunText("exclusions")}；以及一份日志：周二的重跑保存为 P2，${dollars(TUESDAY)}，去掉价差两条腿的新方法保存为 P3，${dollars(WITHOUT_SPREAD)}，是一个新问题`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Research packets", "研究包"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "rows", label: ["The rows", "行"] },
		{ id: "fields", label: ["The fields", "字段"] },
		{ id: "log", label: ["The log", "日志"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
