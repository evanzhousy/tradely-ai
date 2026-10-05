import { type Copy, count, pick, usd } from "@/content/world";
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
	coverRows,
	IV,
	OI,
	type Requirement,
	sources,
	T1,
	type Verdict,
	verdictCopy,
	verdicts,
} from "./symbol-drawer-model";

/*
 * Data clocks, as a film. At 10:30 on Monday the ALFA drawer shows open interest of 100:
 * when was that true? A timeline answers, field by field: the model IV and the open
 * interest were Friday's close, the count published at 06:30; the last trade happened at
 * 10:05 and arrived at 10:20. Then three sources judged against three questions, and a
 * total with one blank series, which is at least 1,065, not 1,065.
 *
 *   open      0–4      "Data clocks"
 *   question  4–9.5    10:30 Monday, open interest 100: true when?
 *   clocks    9.5–20.5 the drawer; IV at Fri 16:00; OI counted then, published 06:30;
 *                      a trade at 10:05, received 10:20
 *   sources   20.5–30  today's volume; contracts outstanding; full days
 *   cover     30–37    observed, zero, missing; at least 1,065
 *   claim     37–39.5  every value has its own clock
 *   next      39.5–42  Next: the module checkpoint
 */

const END = 42;
const IV_PCT = Math.round(IV * 100);
const REQUIREMENTS: Requirement[] = ["today", "positions", "compare"];
const COVERED = coverRows.filter((row) => row.value !== null);
const TOTAL = COVERED.reduce((sum, row) => sum + (row.value ?? 0), 0);
/** The timeline is not to scale: a weekend and a night fold into short gaps. */
const STOPS = [
	{ id: "fri", at: 0.04, label: ["Fri 16:00", "周五 16:00"] as Copy },
	{ id: "pub", at: 0.36, label: ["Mon 06:30", "周一 06:30"] as Copy },
	{
		id: "trade",
		at: 0.62,
		label: [`Mon ${T1.time}`, `周一 ${T1.time}`] as Copy,
	},
	{ id: "recv", at: 0.8, label: ["10:20", "10:20"] as Copy },
	{ id: "now", at: 0.96, label: ["10:30", "10:30"] as Copy },
];
const verdictTone: Record<Verdict, string> = {
	meets: "wt-film-gain",
	partial: "wt-film-warn",
	fails: "wt-film-loss",
	context: "wt-film-dim",
};

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const fieldW = (room - (narrow ? 12 : 24)) / 3;
	return {
		...frame,
		cardY: H * (narrow ? 0.27 : 0.27),
		cardH: H * (narrow ? 0.17 : 0.2),
		fieldX: (i: number) => margin + i * (fieldW + (narrow ? 6 : 12)),
		fieldW,
		lineY: H * (narrow ? 0.66 : 0.68),
		stopX: (at: number) => margin + at * room,
		noteY: H * (narrow ? 0.84 : 0.86),
		reqY: H * (narrow ? 0.25 : 0.28),
		srcY: (i: number) =>
			H * (narrow ? 0.36 : 0.4) + i * H * (narrow ? 0.17 : 0.17),
		srcH: H * (narrow ? 0.14 : 0.14),
		rowY: (i: number) =>
			H * (narrow ? 0.26 : 0.27) + i * H * (narrow ? 0.085 : 0.085),
		rowH: H * (narrow ? 0.065 : 0.068),
		totalY: H * (narrow ? 0.76 : 0.78),
	};
}

const copy = {
	title: ["Data clocks", "数据时钟"],
	titleSub: ["when each source was true", "每个来源在何时成立"],
	qTag: ["ALFA drawer · Mon 10:30", "ALFA 抽屉 · 周一 10:30"],
	qLine: [
		`Oct 18 100 call: open interest ${OI}.`,
		`10月18日 100 看涨：未平仓量 ${OI}。`,
	],
	qBig: ["True as of when?", "这是何时的数？"],
	c0: [
		"10:30 Monday: three values side by side in the drawer.",
		"周一 10:30：抽屉里并排显示三个值。",
	],
	c0Short: ["Three values, 10:30.", "三个值，10:30。"],
	c1: [
		`The ${IV_PCT}% IV came from a model run at Friday's close: modeled, as of Fri 16:00.`,
		`${IV_PCT}% 的隐含波动率来自周五收盘的模型：是模型值，截至周五 16:00。`,
	],
	c1Short: ["IV: Friday's model.", "IV：周五的模型。"],
	c2: [
		`Open interest ${OI} was counted at Friday's close and published at 06:30 Monday.`,
		`未平仓量 ${OI} 是周五收盘统计、周一 06:30 发布的。`,
	],
	c2Short: ["OI: Friday's count.", "未平仓量：周五的统计。"],
	c3: [
		`The last trade happened at ${T1.time}; a 15-minute delay brought it here at 10:20.`,
		`最新成交发生在 ${T1.time}；延迟 15 分钟，10:20 才到这里。`,
	],
	c3Short: ["Trade: 10:05, seen 10:20.", "成交：10:05，10:20 才看到。"],
	oi: ["open interest", "未平仓量"],
	iv: ["model IV", "模型 IV"],
	last: ["last trade", "最新成交"],
	modeled: ["modeled", "模型"],
	counted: ["counted", "统计"],
	published: ["published", "发布"],
	happened: ["happened", "发生"],
	receivedLate: ["received +15 min", "到达 +15 分钟"],
	oiShort: ["OI", "未平仓"],
	ivShort: ["IV", "IV"],
	lastShort: ["last", "最新"],
	now: ["now", "现在"],
	weekend: ["weekend", "周末"],
	s0: [
		"Three sources on file. Fresh enough depends on the question.",
		"手头有三个来源。够不够新，取决于你问什么。",
	],
	s0Short: ["Three sources.", "三个来源。"],
	req: {
		today: ["Today's volume so far?", "今天到目前的成交量？"],
		positions: ["Contracts outstanding?", "存续合约有多少？"],
		compare: ["Compare full days?", "比较完整的交易日？"],
	} as Record<Requirement, Copy>,
	v0: [
		"Today's volume: Friday's tape fails; Monday's delayed feed covers only to 10:15.",
		"今天的成交量：周五的记录不满足；周一的延迟数据部分满足，截至 10:15。",
	],
	v0Short: ["Today: partly, to 10:15.", "今天：部分，到 10:15。"],
	v1: [
		"Contracts outstanding: Friday's open interest is the newest count there is.",
		"存续合约：周五的未平仓量已是最新的统计。",
	],
	v1Short: ["Outstanding: Friday's OI.", "存续：周五未平仓量。"],
	v2: [
		"Full days: Friday's complete tape meets it; Monday isn't finished.",
		"完整交易日：周五的完整记录满足；周一还没结束。",
	],
	v2Short: ["Full days: Friday.", "完整日：周五。"],
	k0: [
		"Monday's volume, five Oct 18 call series: four numbers and a blank.",
		"周一五个 10月18日 看涨序列的成交量：四个数字，一个空白。",
	],
	k0Short: ["Four numbers, a blank.", "四个数字，一个空白。"],
	k1: [
		"A 0 is measured: nothing traded. A blank means the feed sent nothing.",
		"0 是测得的：没有成交。空白表示数据源什么都没发。",
	],
	k1Short: ["0 ≠ blank.", "0 ≠ 空白。"],
	k2: [
		`So the total is at least ${count(TOTAL)}, with ${COVERED.length} of ${coverRows.length} covered.`,
		`所以合计至少 ${count(TOTAL)}，覆盖 ${coverRows.length} 个中的 ${COVERED.length} 个。`,
	],
	k2Short: [`At least ${count(TOTAL)}.`, `至少 ${count(TOTAL)}。`],
	observed: ["observed", "观测"],
	zero: ["zero", "零"],
	missing: ["missing", "缺失"],
	total: [
		`≥ ${count(TOTAL)} · ${COVERED.length} of ${coverRows.length} series`,
		`≥ ${count(TOTAL)} · ${coverRows.length} 个中 ${COVERED.length} 个`,
	],
	plain: [count(TOTAL), count(TOTAL)],
	claimBig: ["Every value has its own clock.", "每个值都有自己的时钟。"],
	claimSub: [
		"Say when each was true and when it arrived, match it to the question, and keep a blank apart from a zero.",
		"说明每个值何时成立、何时到达，让它对上要回答的问题，并把空白和零分开。",
	],
	nextBig: ["Next: the module checkpoint", "下一步：模块检查点"],
	nextSub: [
		"flow, positions and data quality, on a new day",
		"在新的一天里运用成交流、持仓与数据质量",
	],
} as const;

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
	/** Each field's colour carries onto its marks on the timeline. */
	const fields: [string, Copy, Copy, string, string][] = [
		["f-oi", copy.oi, copy.oiShort, count(OI), "wt-film-accent"],
		["f-iv", copy.iv, copy.ivShort, `${IV_PCT}%`, "wt-film-warn"],
		[
			"f-last",
			copy.last,
			copy.lastShort,
			`${T1.quantity} @ ${usd(T1.price)}`,
			"wt-film-gain",
		],
	];
	/** Each mark on the timeline: where it sits, what happened there, and in which field. */
	const marks: [string, number, Copy, string, number][] = [
		["m-iv", 0, copy.modeled, "wt-film-warn", 2],
		["m-oi", 0, copy.counted, "wt-film-accent", 1],
		["m-pub", 1, copy.published, "wt-film-accent", 1],
		["m-trade", 2, copy.happened, "wt-film-gain", 1],
		["m-recv", 3, copy.receivedLate, "wt-film-gain", 2],
	];
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

			{/* The drawer and the clocks behind it. */}
			{headline("c0", copy.c0, copy.c0Short)}
			{headline("c1", copy.c1, copy.c1Short)}
			{headline("c2", copy.c2, copy.c2Short)}
			{headline("c3", copy.c3, copy.c3Short)}
			{fields.map(([name, label, short, value, tone], i) => (
				<g key={name} data-f={name}>
					<rect
						data-f={`${name}-box`}
						x={L.fieldX(i)}
						y={L.cardY}
						width={L.fieldW}
						height={L.cardH}
						rx={12}
						className="wt-panel-shape"
					/>
					<text
						x={L.fieldX(i) + L.fieldW / 2}
						y={L.cardY + L.cardH * 0.32}
						textAnchor="middle"
						className={`wt-film-tag ${tone}`}
						style={{ fontSize: T.small }}
					>
						{t(narrow ? short : label).toUpperCase()}
					</text>
					<text
						x={L.fieldX(i) + L.fieldW / 2}
						y={L.cardY + L.cardH * 0.72}
						textAnchor="middle"
						className="wt-film-num"
						style={{ fontSize: narrow ? T.body : T.head * 1.1 }}
					>
						{value}
					</text>
				</g>
			))}
			<g data-f="timeline">
				<path
					d={`M${L.stopX(STOPS[0].at)} ${L.lineY}H${L.stopX(0.2)}`}
					className="wt-axis"
					strokeWidth={2}
				/>
				<path
					d={`M${L.stopX(0.2)} ${L.lineY}H${L.stopX(0.3)}`}
					className="wt-film-link"
				/>
				<path
					d={`M${L.stopX(0.3)} ${L.lineY}H${L.stopX(STOPS[4].at)}`}
					className="wt-axis"
					strokeWidth={2}
				/>
				{narrow ? null : (
					<text
						x={L.stopX(0.25)}
						y={L.lineY + T.small * 2.2}
						textAnchor="middle"
						className="wt-film-tag"
						style={{ fontSize: T.small * 0.9 }}
					>
						{t(copy.weekend).toUpperCase()}
					</text>
				)}
				{STOPS.map((stop, i) => (
					<g key={stop.id}>
						<path
							d={`M${L.stopX(stop.at)} ${L.lineY - 6}V${L.lineY + 6}`}
							className="wt-axis"
						/>
						<text
							x={L.stopX(stop.at)}
							y={
								L.lineY +
								T.small * 2.2 +
								(narrow && (i === 3 || i === 1) ? T.small * 1.4 : 0)
							}
							textAnchor={
								i === 0 ? "start" : i === STOPS.length - 1 ? "end" : "middle"
							}
							className="wt-film-num wt-film-dim"
							style={{ fontSize: T.small }}
						>
							{t(stop.label)}
						</text>
					</g>
				))}
			</g>
			<g data-f="now">
				<path
					d={`M${L.stopX(STOPS[4].at)} ${L.lineY - 14 - T.small * 2.6}V${L.lineY + 8}`}
					style={{ stroke: "var(--diagram-accent)", strokeWidth: 2 }}
				/>
				<text
					x={L.stopX(STOPS[4].at)}
					y={L.lineY - 14 - T.small * 3.2}
					textAnchor="end"
					className="wt-film-tag wt-film-accent"
					style={{ fontSize: T.small }}
				>
					{t(copy.now).toUpperCase()}
				</text>
			</g>
			{marks.map(([name, stop, label, tone, tier]) => {
				const x = L.stopX(STOPS[stop].at);
				/** Marks that share a moment, or sit close, take two tiers. */
				const lift = tier;
				return (
					<g key={name} data-f={name}>
						<circle cx={x} cy={L.lineY} r={6} className="wt-chip" />
						<text
							x={x}
							y={L.lineY - 14 - (lift - 1) * T.small * 1.5}
							textAnchor={stop === 0 ? "start" : "middle"}
							className={`wt-film-type wt-halo ${tone}`}
							style={{ fontSize: T.small * 1.05 }}
						>
							{t(label)}
						</text>
					</g>
				);
			})}

			{/* Three sources, three questions. */}
			{headline("s0", copy.s0, copy.s0Short)}
			{headline("v0", copy.v0, copy.v0Short)}
			{headline("v1", copy.v1, copy.v1Short)}
			{headline("v2", copy.v2, copy.v2Short)}
			{REQUIREMENTS.map((req) => (
				<g key={req} data-f={`req-${req}`}>
					<text
						x={margin}
						y={L.reqY + T.small}
						className="wt-film-type wt-film-accent"
						style={{ fontSize: narrow ? T.body : T.head }}
					>
						{t(copy.req[req])}
					</text>
				</g>
			))}
			{sources.map((source, i) => (
				<g key={source.id} data-f={`src-${i}`}>
					<rect
						x={margin}
						y={L.srcY(i)}
						width={room}
						height={L.srcH}
						rx={12}
						className="wt-panel-shape"
					/>
					<text
						x={margin + 16}
						y={L.srcY(i) + L.srcH * 0.4}
						className="wt-film-type"
						style={{ fontSize: narrow ? T.body : T.head * 0.9 }}
					>
						{t(source.name)}
					</text>
					<text
						x={margin + 16}
						y={L.srcY(i) + L.srcH * 0.74}
						className="wt-film-num wt-film-dim"
						style={{ fontSize: T.small * 1.05 }}
					>
						{t(source.detail)}
					</text>
				</g>
			))}
			{REQUIREMENTS.flatMap((req) =>
				sources.map((source, i) => {
					const v = verdicts[req][source.id];
					return (
						<g key={`${req}-${source.id}`} data-f={`v-${req}-${i}`}>
							<text
								x={margin + room - 16}
								y={L.srcY(i) + L.srcH * 0.4}
								textAnchor="end"
								className={`wt-film-tag ${verdictTone[v.verdict]}`}
								style={{ fontSize: T.small * 1.05 }}
							>
								{t(verdictCopy[v.verdict]).toUpperCase()}
							</text>
							{narrow ? null : (
								<text
									x={margin + room - 16}
									y={L.srcY(i) + L.srcH * 0.74}
									textAnchor="end"
									className="wt-film-type wt-film-dim"
									style={{ fontSize: T.small * 1.05 }}
								>
									{t(v.why)}
								</text>
							)}
						</g>
					);
				}),
			)}

			{/* Missing, zero and observed. */}
			{headline("k0", copy.k0, copy.k0Short)}
			{headline("k1", copy.k1, copy.k1Short)}
			{headline("k2", copy.k2, copy.k2Short)}
			{coverRows.map((row, i) => (
				<g key={row.id} data-f={`cov-${i}`}>
					<rect
						x={margin}
						y={L.rowY(i)}
						width={room}
						height={L.rowH}
						rx={9}
						className="wt-panel-shape"
						style={
							row.state === "missing"
								? { strokeDasharray: "4 3", fillOpacity: 0.3 }
								: undefined
						}
					/>
					<text
						x={margin + 14}
						y={L.rowY(i) + L.rowH / 2 + text * 0.36}
						className="wt-film-type"
						style={{ fontSize: text }}
					>
						{t(row.label)}
					</text>
					<text
						x={margin + room * (narrow ? 0.62 : 0.6)}
						y={L.rowY(i) + L.rowH / 2 + text * 0.36}
						textAnchor="end"
						className={`wt-film-num ${row.value === null ? "wt-film-dim" : ""}`}
						style={{ fontSize: text }}
					>
						{row.value === null ? "—" : count(row.value)}
					</text>
					<text
						data-f={`cov-${i}-state`}
						x={margin + room - 14}
						y={L.rowY(i) + L.rowH / 2 + T.small * 0.36}
						textAnchor="end"
						className={`wt-film-tag ${row.state === "missing" ? "wt-film-loss" : row.state === "zero" ? "wt-film-warn" : "wt-film-gain"}`}
						style={{ fontSize: T.small }}
					>
						{t(copy[row.state]).toUpperCase()}
					</text>
				</g>
			))}
			<text
				data-f="plain"
				x={margin}
				y={L.totalY}
				className="wt-film-num wt-film-loss"
				style={{ fontSize: T.num, textDecoration: "line-through" }}
			>
				{count(TOTAL)}
			</text>
			<text
				data-f="total"
				x={margin}
				y={L.totalY}
				className="wt-film-num wt-film-accent"
				style={{ fontSize: narrow ? T.head : T.num }}
			>
				{t(copy.total)}
			</text>

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
	/** One field lights up while its clock is told. */
	const focus = (name: string | null, time: number) => {
		for (const field of ["f-oi", "f-iv", "f-last"]) {
			tl.set(
				one(`${field}-box`),
				{
					attr: { class: field === name ? "wt-focus-shape" : "wt-panel-shape" },
				},
				time,
			);
		}
	};
	const heads = [
		"c0",
		"c1",
		"c2",
		"c3",
		"s0",
		"v0",
		"v1",
		"v2",
		"k0",
		"k1",
		"k2",
	].map((name) => one(name));
	const fields = ["f-oi", "f-iv", "f-last"].map((name) => one(name));
	const marks = ["m-iv", "m-oi", "m-pub", "m-trade", "m-recv"].map((name) =>
		one(name),
	);
	const reqs = REQUIREMENTS.map((req) => one(`req-${req}`));
	const srcs = sources.map((_, i) => one(`src-${i}`));
	const verdictsFor = (req: Requirement) =>
		sources.map((_, i) => one(`v-${req}-${i}`));
	const covs = coverRows.map((_, i) => one(`cov-${i}`));

	d.hidden([
		...flat("q"),
		...heads,
		...fields,
		...kids("timeline"),
		one("now"),
		...marks,
		...reqs,
		...srcs,
		...REQUIREMENTS.flatMap(verdictsFor),
		...covs,
		one("plain"),
		one("total"),
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
	word(one("q-big"), 6.4);

	// ——— clocks: each field's own time ———
	tl.addLabel("clocks", 9.5);
	hide(flat("q"), 9.5);
	show(heads[0], 9.7, "above");
	fields.forEach((field, i) => {
		show(field, 10.0 + i * 0.2);
	});
	show(kids("timeline"), 10.6);
	d.pop(one("now"), 11.0);
	d.swap(heads[0], heads[1], 12.2);
	focus("f-iv", 12.6);
	d.pop(marks[0], 12.8);
	d.swap(heads[1], heads[2], 14.8);
	focus("f-oi", 15.2);
	d.pop(marks[1], 15.4);
	d.pop(marks[2], 15.9);
	d.swap(heads[2], heads[3], 17.6);
	focus("f-last", 18.0);
	d.pop(marks[3], 18.2);
	d.pop(marks[4], 19.0);

	// ——— sources: fresh enough for what? ———
	tl.addLabel("sources", 20.5);
	focus(null, 20.5);
	hide([heads[3], ...fields, ...kids("timeline"), one("now"), ...marks], 20.5);
	show(heads[4], 20.7, "above");
	srcs.forEach((src, i) => {
		show(src, 21.0 + i * 0.2, "right");
	});
	REQUIREMENTS.forEach((req, k) => {
		const at = 22.4 + k * 2.4;
		d.swap(heads[4 + k], heads[5 + k], at);
		if (k) hide([reqs[k - 1], ...verdictsFor(REQUIREMENTS[k - 1])], at, 0.3);
		show(reqs[k], at + 0.35, "above");
		verdictsFor(req).forEach((v, i) => {
			d.pop(v, at + 0.7 + i * 0.2);
		});
	});

	// ——— cover: blank is not zero ———
	tl.addLabel("cover", 30);
	hide([heads[7], reqs[2], ...srcs, ...verdictsFor("compare")], 30.0);
	show(heads[8], 30.2, "above");
	covs.forEach((cov, i) => {
		show(cov, 30.5 + i * 0.15, "right");
	});
	d.swap(heads[8], heads[9], 32.0);
	tl.to(
		[covs[3], covs[4]],
		{
			scale: 1.02,
			transformOrigin: "50% 50%",
			duration: 0.25,
			yoyo: true,
			repeat: 1,
		},
		32.4,
	);
	d.swap(heads[9], heads[10], 34.0);
	show(one("plain"), 34.3);
	d.flip(one("plain"), one("total"), 35.2);
	tl.set(one("plain"), { opacity: 0 }, 35.5);

	// ——— claim ———
	tl.addLabel("claim", 37);
	hide([heads[10], ...covs, one("total")], 37.0);
	word(one("z-big"), 37.3);
	show(one("z-sub"), 37.7);

	// ——— next ———
	tl.addLabel("next", 39.5);
	hide(kids("claim"), 39.5);
	d.close(39.5);
	return tl;
}

export const symbolDrawerFilm: Film = {
	id: "symbol-drawer",
	label: [
		`Data clocks, as a short film: ALFA's drawer at 10:30 on Monday, where the ${IV_PCT}% model IV and the open interest of ${OI} are as of Friday's close, the count published at 06:30, and the last trade happened at ${T1.time} but arrived at 10:20; three sources judged against three questions, today's volume, contracts outstanding and full-day comparisons; and Monday's volume across five Oct 18 call series, where a 0 is measured, a blank is missing, and the total is at least ${count(TOTAL)}`,
		`数据时钟短片：周一 10:30 的 ALFA 抽屉：${IV_PCT}% 的模型隐含波动率和 ${OI} 的未平仓量都截至周五收盘，统计在 06:30 发布，最新成交发生在 ${T1.time} 却在 10:20 才到达；三个来源对照三个问题：今天的成交量、存续合约、完整交易日比较；以及周一五个 10月18日 看涨序列的成交量：0 是测得的，空白是缺失，合计至少 ${count(TOTAL)}`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Data clocks", "数据时钟"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "clocks", label: ["Each clock", "各自的时钟"] },
		{ id: "sources", label: ["Fresh enough", "够不够新"] },
		{ id: "cover", label: ["Blank or zero", "空白还是零"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一步"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
