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
	createDirector,
	EndCard,
	filmFrame,
	Lines,
	lineCount,
	TitleCard,
	Word,
} from "../walkthrough/film-kit";
import {
	COVERED,
	dollars,
	fields,
	MONDAY,
	records,
	rerunText,
	rowById,
	SERIES,
	TUESDAY,
	WITHOUT_SPREAD,
} from "./cookbook-research-packet-model";

/*
 * Research packets, as a film. Someone else reruns your packet: will they get $165,520?
 * The packet's rows answer: R2 traced to its trades, 5 × $2.00 and 500 × $2.15, × 100;
 * four rows summed to $165,520, an observed subtotal with the 120 call missing. Then the
 * fields a reader reruns from: drop the formula and they get $1,655.20; drop the exclusions
 * and $218,520. Last, the log: Tuesday's rerun saves P2, and leaving out the spread is a
 * new method, P3, a new question.
 *
 *   open      0–4      "Research packets"
 *   question  4–9.5    will a reader get $165,520?
 *   rows      9.5–19.5 five rows; R2 traced; summed; a subtotal of 4 of 5
 *   fields    19.5–29  as of, rows, formula, exclusions; without the formula; without
 *                      the exclusions
 *   log       29–37    P1; P2 a rerun; P3 a new question
 *   claim     37–39.5  work someone else can rerun
 *   next      39.5–42  Next: recaps
 */

const END = 42;
const R2 = rowById("R2");
const R2_TRADES = R2?.trades ?? [];

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
		labelW: narrow ? room * 0.32 : room * 0.2,
		rerunY: H * (narrow ? 0.7 : 0.72),
		recY: (i: number) =>
			H * (narrow ? 0.27 : 0.27) + i * H * (narrow ? 0.19 : 0.19),
		recH: H * (narrow ? 0.16 : 0.16),
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
		`It says premium traded: ${dollars(MONDAY)}.`,
		`它说成交的权利金是 ${dollars(MONDAY)}。`,
	],
	qBig: ["Would someone else get the same?", "别人重跑会得到同样的数吗？"],
	p0: [
		"One row per Oct 18 call from 100 to 120, from the corrected tape as of Monday 16:05.",
		"10月18日 100 到 120 的看涨，每个一行，来自截至周一 16:05 的更正后成交记录。",
	],
	p0Short: ["One row per series.", "每个序列一行。"],
	p1: [
		`Trace R2 to its trades: anyone can redo the ${dollars(rowPremium(R2 ?? mondayPacket[0]) ?? 0)}.`,
		`把 R2 追溯到它的成交：谁都能重算出 ${dollars(rowPremium(R2 ?? mondayPacket[0]) ?? 0)}。`,
	],
	p1Short: ["Trace a row.", "追溯一行。"],
	p2: [
		`R5 has no data yet, so ${dollars(MONDAY)} covers ${COVERED} of ${SERIES} series: a subtotal, not the total.`,
		`R5 还没有数据，所以 ${dollars(MONDAY)} 只覆盖 ${SERIES} 个中的 ${COVERED} 个：是小计，不是合计。`,
	],
	p2Short: [
		`${COVERED} of ${SERIES}: a subtotal.`,
		`${SERIES} 中 ${COVERED} 个：小计。`,
	],
	noData: ["no data yet", "尚无数据"],
	subtotal: [
		`≥ ${dollars(MONDAY)} · ${COVERED} of ${SERIES} series`,
		`≥ ${dollars(MONDAY)} · ${SERIES} 个中 ${COVERED} 个`,
	],
	f0: [
		"A reader reruns P1 from its fields. With every field, they match.",
		"读者按研究包的字段重跑。字段齐全时，结果一致。",
	],
	f0Short: ["Every field: a match.", "字段齐全：一致。"],
	f1: [
		`Without the formula they multiply price by contracts and miss × 100: ${rerunText("formula")}.`,
		`没有公式，读者用价格乘张数，漏了 × 100：${rerunText("formula")}。`,
	],
	f1Short: [
		`No formula: ${rerunText("formula")}.`,
		`没有公式：${rerunText("formula")}。`,
	],
	f2: [
		`Without the exclusions they count the cancelled T-2 and the repeated M2: ${rerunText("exclusions")}.`,
		`没有排除项，读者会计入已取消的 T-2 和重复的 M2：${rerunText("exclusions")}。`,
	],
	f2Short: [
		`No exclusions: ${rerunText("exclusions")}.`,
		`没有排除项：${rerunText("exclusions")}。`,
	],
	reader: ["a reader's rerun", "读者重跑"],
	l0: [
		`P1 is saved with its as-of time and method: ${dollars(MONDAY)}.`,
		`P1 连同截至时间和方法一起保存：${dollars(MONDAY)}。`,
	],
	l0Short: ["P1 saved.", "保存 P1。"],
	l1: [
		`Tuesday the 120 call's trades arrive: the same method gives P2, ${dollars(TUESDAY)}. P1 stays.`,
		`周二 120 看涨的成交到了：同一方法得到 P2，${dollars(TUESDAY)}。P1 保持不变。`,
	],
	l1Short: ["Same method: P2.", "同一方法：P2。"],
	l2: [
		`Leaving out the spread's legs changes the method: ${dollars(WITHOUT_SPREAD)} answers a new question, P3.`,
		`去掉价差的两条腿就改变了方法：${dollars(WITHOUT_SPREAD)} 回答的是新问题，P3。`,
	],
	l2Short: ["New method: P3.", "新方法：P3。"],
	claimBig: ["Leave work someone else can rerun.", "留下别人能重跑的工作。"],
	claimSub: [
		"Write the as-of time, the formula and the exclusions; keep each rerun as a new record, and a new method as a new question.",
		"写明截至时间、公式和排除项；每次重跑另存一条记录，新方法就是新问题。",
	],
	nextBig: ["Next: recaps", "下一课：复盘"],
	nextSub: ["claims your evidence supports", "证据支持的结论"],
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
			maxWidth={narrow ? room : room * 0.74}
			anchor="start"
		/>
	);
	const text = narrow ? T.small * 1.1 : T.body;
	const trace = R2_TRADES.map(
		(trade) => `${count(trade.quantity)} × ${usd(trade.price)} × 100`,
	).join(" + ");
	return (
		<>
			<Backdrop frame={L} />

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
			{headline("p0", copy.p0, copy.p0Short)}
			{headline("p1", copy.p1, copy.p1Short)}
			{headline("p2", copy.p2, copy.p2Short)}
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
							style={premium === null ? { strokeDasharray: "4 3" } : undefined}
						/>
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
							{rowContracts(row) === null ? "" : count(rowContracts(row) ?? 0)}
						</text>
						<text
							x={margin + room - 12}
							y={L.rowY(i) + L.rowH / 2 + text * 0.36}
							textAnchor="end"
							className={`wt-film-num ${premium === null ? "wt-film-warn" : ""}`}
							style={{ fontSize: text }}
						>
							{premium === null ? t(copy.noData) : dollars(premium)}
						</text>
					</g>
				);
			})}
			<Lines
				name="trace"
				text={`R2 = ${trace}`}
				x={margin}
				y={L.traceY}
				size={narrow ? T.small * 1.05 : T.body}
				maxWidth={room}
				anchor="start"
				className="wt-film-num wt-film-accent"
			/>
			<text
				data-f="sum"
				x={margin + room - 12}
				y={L.traceY + (narrow ? T.small * 2 + T.head * 1.2 : T.small)}
				textAnchor="end"
				className="wt-film-num wt-film-accent"
				style={{ fontSize: narrow ? T.head : T.num }}
			>
				{dollars(MONDAY)}
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
				className="wt-film-type wt-film-warn"
				style={{ fontSize: text }}
			>
				{t(copy.subtotal)}
			</text>

			{/* The fields a reader reruns from. */}
			{headline("f0", copy.f0, copy.f0Short)}
			{headline("f1", copy.f1, copy.f1Short)}
			{headline("f2", copy.f2, copy.f2Short)}
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
					["rerun-none", null],
					["rerun-formula", "formula"],
					["rerun-exclusions", "exclusions"],
				] as const
			).map(([name, removed]) => (
				<text
					key={name}
					data-f={name}
					x={margin}
					y={L.rerunY + T.num * 1.3}
					className={`wt-film-num ${removed ? "wt-film-loss" : "wt-film-gain"}`}
					style={{ fontSize: T.num }}
				>
					{rerunText(removed)}
				</text>
			))}

			{/* The log. */}
			{headline("l0", copy.l0, copy.l0Short)}
			{headline("l1", copy.l1, copy.l1Short)}
			{headline("l2", copy.l2, copy.l2Short)}
			{records.map((record, i) => (
				<g key={record.id} data-f={`rec-${i}`}>
					<rect
						data-f={`rec-${i}-box`}
						x={margin}
						y={L.recY(i)}
						width={room}
						height={L.recH}
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
					<text
						x={margin + 16}
						y={L.recY(i) + L.recH * 0.6}
						className="wt-film-num"
						style={{ fontSize: narrow ? T.head : T.head * 1.1 }}
					>
						{dollars(record.cents)}
					</text>
					<text
						x={margin + 16}
						y={L.recY(i) + L.recH * 0.85}
						className="wt-film-type wt-film-dim"
						style={{ fontSize: T.small * 1.05 }}
					>
						{t(record.note)}
					</text>
					<text
						x={margin + room - 16}
						y={L.recY(i) + L.recH * 0.6}
						textAnchor="end"
						className={`wt-film-tag ${record.method === 2 ? "wt-film-warn" : "wt-film-accent"}`}
						style={{ fontSize: T.small }}
					>
						{t(record.tag).toUpperCase()}
					</text>
				</g>
			))}

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
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
			time,
		);
	const heads = ["p0", "p1", "p2", "f0", "f1", "f2", "l0", "l1", "l2"].map(
		(name) => one(name),
	);
	const rows = mondayPacket.map((_, i) => one(`row-${i}`));
	const r2 = mondayPacket.findIndex((row) => row.id === "R2");
	const missing = mondayPacket.findIndex((row) => row.trades === null);
	const fieldRows = fields.map((field) => one(`field-${field.id}`));
	const reruns = ["rerun-none", "rerun-formula", "rerun-exclusions"].map(
		(name) => one(name),
	);
	const recs = records.map((_, i) => one(`rec-${i}`));
	/** A field goes missing: its card fades and dashes. */
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
		one("trace"),
		one("sum"),
		one("subtotal"),
		...fieldRows,
		one("rerun-tag"),
		...reruns,
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
	show(one("q-line"), 5.1);
	word(one("q-big"), 6.6);

	// ——— rows: traced and summed ———
	tl.addLabel("rows", 9.5);
	hide(flat("q"), 9.5);
	show(heads[0], 9.7, "above");
	rows.forEach((row, i) => {
		show(row, 10.0 + i * 0.15, "right");
	});
	d.swap(heads[0], heads[1], 12.0);
	tl.set(one(`row-${r2}-box`), { attr: { class: "wt-focus-shape" } }, 12.4);
	show(one("trace"), 12.6);
	d.swap(heads[1], heads[2], 15.0);
	tl.set(one(`row-${r2}-box`), { attr: { class: "wt-panel-shape" } }, 15.0);
	d.count(
		one<SVGTextElement>("sum"),
		MONDAY,
		15.4,
		(v) => dollars(Math.round(v / 100) * 100),
		0,
		0.8,
	);
	tl.set(one("sum"), { opacity: 1 }, 15.4);
	tl.fromTo(
		rows[missing],
		{ x: 0 },
		{ x: 6, duration: 0.08, yoyo: true, repeat: 3 },
		16.4,
	);
	show(one("subtotal"), 16.6);

	// ——— fields: what a reader reruns ———
	tl.addLabel("fields", 19.5);
	hide([heads[2], ...rows, one("trace"), one("sum"), one("subtotal")], 19.5);
	show(heads[3], 19.7, "above");
	fieldRows.forEach((row, i) => {
		show(row, 20.0 + i * 0.15, "right");
	});
	show(one("rerun-tag"), 20.8);
	d.slam(reruns[0], 21.0);
	d.swap(heads[3], heads[4], 22.6);
	drop("formula", 23.0);
	d.flip(reruns[0], reruns[1], 23.2);
	tl.set(reruns[0], { opacity: 0 }, 23.5);
	d.swap(heads[4], heads[5], 25.6);
	restore("formula", 26.0);
	drop("exclusions", 26.0);
	d.flip(reruns[1], reruns[2], 26.2);
	tl.set(reruns[1], { opacity: 0 }, 26.5);

	// ——— log: rerun, or a new question ———
	tl.addLabel("log", 29);
	hide([heads[5], ...fieldRows, one("rerun-tag"), reruns[2]], 29.0);
	show(heads[6], 29.2, "above");
	show(recs[0], 29.5, "right");
	d.swap(heads[6], heads[7], 31.2);
	show(recs[1], 31.6, "right");
	d.swap(heads[7], heads[8], 33.6);
	show(recs[2], 34.0, "right");

	// ——— claim ———
	tl.addLabel("claim", 37);
	hide([heads[8], ...recs], 37.0);
	word(one("z-big"), 37.3);
	show(one("z-sub"), 37.7);

	// ——— next ———
	tl.addLabel("next", 39.5);
	hide(kids("claim"), 39.5);
	d.close(39.5);
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
