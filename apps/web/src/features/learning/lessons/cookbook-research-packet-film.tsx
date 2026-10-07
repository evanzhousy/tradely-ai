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
 * four rows summed to $165,520, an observed subtotal with the 120 call missing. The hero is
 * the fields a reader reruns from: drop the formula and they get $1,655.20; drop the
 * exclusions and $171,720, where glowing brackets lock. Last, the log: Tuesday's rerun
 * saves P2, and leaving out the spread is a new method, P3, a new question.
 *
 *   open      0–4        "Research packets"
 *   question  4–8.6      will a reader get $165,520?
 *   rows      8.6–18.6   five rows; R2 traced; summed; a subtotal of 4 of 5
 *   fields    18.6–28.6  hero: every field; without the formula; without the exclusions
 *   log       28.6–35.4  P1; P2 a rerun; P3 a new question
 *   claim     35.4–39.8  work someone else can rerun
 *   next      39.8–42.3  Next: recaps
 */

const END = 42.3;
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
	pHead: [
		"One row per series, traced to trades.",
		"每个序列一行，可追溯到成交。",
	],
	p2Head: [
		"A subtotal: one series has no data.",
		"是小计：有一个序列没有数据。",
	],
	noData: ["no data yet", "尚无数据"],
	subtotal: [
		`≥ ${dollars(MONDAY)} · ${COVERED} of ${SERIES} series`,
		`≥ ${dollars(MONDAY)} · ${SERIES} 个中 ${COVERED} 个`,
	],
	fHead: ["A reader reruns it from its fields.", "读者按它的字段重跑。"],
	f2Head: ["Drop a field, and the number breaks.", "少一个字段，数字就错了。"],
	reader: ["a reader's rerun", "读者重跑"],
	lHead: ["Save each rerun as its own record.", "每次重跑另存一条记录。"],
	l2Head: ["A new method is a new question.", "新方法就是新问题。"],
	claimBig: ["Leave work someone else can rerun.", "留下别人能重跑的工作。"],
	claimSub: [
		"Write the as-of time, formula and exclusions.",
		"写明截至时间、公式和排除项。",
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
			<Brackets name="lock-rerun" glow />
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
		lockRerun,
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
	rows.forEach((row, i) => {
		show(row, 9.2 + i * 0.15, "right");
	});
	tl.set(one(`row-${r2}-box`), { attr: { class: "wt-focus-shape" } }, 10.8);
	show(one("trace"), 11.0);
	tl.set(one(`row-${r2}-box`), { attr: { class: "wt-panel-shape" } }, 12.4);
	d.count(
		one<SVGTextElement>("sum"),
		MONDAY,
		12.6,
		(v) => dollars(Math.round(v / 100) * 100),
		0,
		0.8,
	);
	tl.set(one("sum"), { opacity: 1 }, 12.6);
	tl.fromTo(
		rows[missing],
		{ x: 0 },
		{ x: 6, duration: 0.08, yoyo: true, repeat: 3 },
		14.0,
	);
	show(one("subtotal"), 14.2);
	show(heads[1], 14.6);

	// ——— fields: the hero. A reader reruns it from its fields. ———
	tl.addLabel("fields", 18.6);
	d.swap([heads[0], heads[1]], heads[2], 18.6);
	hide([...rows, one("trace"), one("sum"), one("subtotal")], 18.6);
	fieldRows.forEach((row, i) => {
		show(row, 19.4 + i * 0.15, "right");
	});
	show(one("rerun-tag"), 20.4);
	word(reruns[0], 20.6);
	drop("formula", 22.0);
	d.flip(reruns[0], reruns[1], 22.2);
	tl.set(reruns[0], { opacity: 0 }, 22.5);
	restore("formula", 23.8);
	drop("exclusions", 23.8);
	d.flip(reruns[1], reruns[2], 24.0);
	tl.set(reruns[1], { opacity: 0 }, 24.3);
	// Round the rerun and its label, so no arm runs through the label.
	d.lock(lockRerun, 25.0, { around: [one("rerun-tag"), reruns[2]], pad: 6 });
	tl.addLabel("hero-lock", 25.0);
	show(heads[3], 25.0);

	// ——— log: rerun, or a new question ———
	tl.addLabel("log", 28.6);
	d.swap([heads[2], heads[3]], heads[4], 28.6);
	hide([...fieldRows, one("rerun-tag"), reruns[2], lockRerun], 28.6);
	show(recs[0], 29.4, "right");
	show(recs[1], 30.6, "right");
	show(recs[2], 31.8, "right");
	show(heads[5], 31.8);

	// ——— claim ———
	tl.addLabel("claim", 35.4);
	hide([heads[4], heads[5], ...recs], 35.4);
	word(one("z-big"), 35.7);
	show(one("z-sub"), 36.1);

	// ——— next ———
	tl.addLabel("next", 39.8);
	hide(kids("claim"), 39.8);
	d.close(39.8);
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
