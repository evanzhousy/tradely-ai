import { type Copy, count, pick, usd } from "@/content/world";
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
 * when was that true? A timeline answers, field by field: the model IV was Friday's close,
 * the last trade happened at 10:05 and arrived at 10:20, and the open interest was counted
 * at Friday's close and published at 06:30. The hero judges three sources against three
 * questions: today's volume, full days, and contracts outstanding, where Friday's count is
 * the newest there is and glowing brackets lock. Last, a total with one blank series,
 * which is at least 1,065, not 1,065.
 *
 *   open      0–4        "Data clocks"
 *   question  4–8.6      10:30 Monday, open interest 100: true when?
 *   clocks    8.6–19.2   the drawer; IV at Fri 16:00; a trade at 10:05, received 10:20;
 *                        OI counted Fri 16:00, published 06:30
 *   sources   19.2–29.8  hero: today's volume; full days; contracts outstanding
 *   cover     29.8–37.2  observed, zero, missing; at least 1,065
 *   claim     37.2–41.9  every value has its own clock
 *   next      41.9–44.4  Next: the module checkpoint
 */

const END = 44.4;
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
		/** Low enough on a phone that a two-line headline's answer rises in clear of it. */
		reqY: H * 0.28,
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
	cHead: [
		"Three values in one drawer, 10:30.",
		"同一个抽屉里的三个值，10:30。",
	],
	c2Head: [
		`Open interest ${OI}: Friday's close.`,
		`未平仓量 ${OI}：周五收盘的数。`,
	],
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
	sHead: [
		"Fresh enough depends on the question.",
		"够不够新，取决于你问什么。",
	],
	s2Head: [
		"Contracts outstanding: Friday's count.",
		"存续合约：就用周五的统计。",
	],
	req: {
		today: ["Today's volume so far?", "今天到目前的成交量？"],
		positions: ["Contracts outstanding?", "存续合约有多少？"],
		compare: ["Compare full days?", "比较完整的交易日？"],
	} as Record<Requirement, Copy>,
	kHead: ["Four numbers and a blank.", "四个数字，一个空白。"],
	k2Head: [
		`So the total is at least ${count(TOTAL)}.`,
		`所以合计至少 ${count(TOTAL)}。`,
	],
	observed: ["observed", "观测"],
	zero: ["zero", "零"],
	missing: ["missing", "缺失"],
	total: [
		`≥ ${count(TOTAL)} · ${COVERED.length} of ${coverRows.length} series`,
		`≥ ${count(TOTAL)} · ${coverRows.length} 个中 ${COVERED.length} 个`,
	],
	plain: [count(TOTAL), count(TOTAL)],
	claimBig: ["Every value has its own clock.", "每个值都有自己的时钟。"],
	claimSub: ["Match its clock to your question.", "让它的时钟对上你的问题。"],
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
			{headline("c-head", copy.cHead)}
			{/* The question's answer, as open interest's stamps come up. */}
			<Lines
				name="c2-head"
				text={t(copy.c2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.cHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
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
			{headline("s-head", copy.sHead)}
			{/* The hero's answer, as the brackets lock on the open interest's verdict. */}
			<Lines
				name="s2-head"
				text={t(copy.s2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.sHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
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

			<Brackets name="lock-verdict" glow />

			{/* Missing, zero and observed. */}
			{headline("k-head", copy.kHead)}
			{/* The answer, as the plain total turns into a floor. */}
			<Lines
				name="k2-head"
				text={t(copy.k2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.kHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
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
	/** A figure or stamp lands slightly large and settles in place, without overshoot. */
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
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
		"c-head",
		"c2-head",
		"s-head",
		"s2-head",
		"k-head",
		"k2-head",
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
	const lockVerdict = one<SVGGraphicsElement>("lock-verdict");

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
		lockVerdict,
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

	// ——— clocks: each field's own time, open interest last ———
	tl.addLabel("clocks", 8.6);
	hide(flat("q"), 8.6);
	show(heads[0], 8.8);
	fields.forEach((field, i) => {
		show(field, 9.2 + i * 0.2);
	});
	show(kids("timeline"), 9.8);
	word(one("now"), 10.2);
	focus("f-iv", 11.0);
	word(marks[0], 11.2);
	focus("f-last", 12.4);
	word(marks[3], 12.6);
	word(marks[4], 13.3);
	focus("f-oi", 14.6);
	word(marks[1], 14.8);
	word(marks[2], 15.4);
	show(heads[1], 15.6);

	// ——— sources: the hero. Fresh enough for which question? ———
	tl.addLabel("sources", 19.2);
	focus(null, 19.2);
	d.swap([heads[0], heads[1]], heads[2], 19.2);
	hide([...fields, ...kids("timeline"), one("now"), ...marks], 19.2);
	srcs.forEach((src, i) => {
		show(src, 19.8 + i * 0.2, "right");
	});
	// One question at a time; contracts outstanding, the drawer's own question, comes last.
	const order: Requirement[] = ["today", "compare", "positions"];
	order.forEach((req, k) => {
		const at = 21.2 + k * 2.0;
		const r = reqs[REQUIREMENTS.indexOf(req)];
		if (k) {
			const last = order[k - 1];
			hide(
				[reqs[REQUIREMENTS.indexOf(last)], ...verdictsFor(last)],
				at - 0.35,
				0.3,
			);
		}
		show(r, at);
		verdictsFor(req).forEach((v, i) => {
			word(v, at + 0.35 + i * 0.2);
		});
	});
	const oi = sources.findIndex((source) => source.id === "oi");
	// Round the open interest's whole card with its verdict: the tag alone is small on a phone.
	d.lock(lockVerdict, 26.2, {
		around: [srcs[oi], verdictsFor("positions")[oi]],
		pad: 6,
	});
	tl.addLabel("hero-lock", 26.2);
	show(heads[3], 26.2);

	// ——— cover: blank is not zero ———
	tl.addLabel("cover", 29.8);
	d.swap([heads[2], heads[3]], heads[4], 29.8);
	hide(
		[
			reqs[REQUIREMENTS.indexOf("positions")],
			...srcs,
			...verdictsFor("positions"),
			lockVerdict,
		],
		29.8,
	);
	covs.forEach((cov, i) => {
		show(cov, 30.5 + i * 0.15, "right");
	});
	tl.to(
		[covs[3], covs[4]],
		{
			scale: 1.02,
			transformOrigin: "50% 50%",
			duration: 0.25,
			yoyo: true,
			repeat: 1,
		},
		31.6,
	);
	show(one("plain"), 32.4);
	d.flip(one("plain"), one("total"), 33.2);
	tl.set(one("plain"), { opacity: 0 }, 33.5);
	show(heads[5], 33.6);

	// ——— claim ———
	tl.addLabel("claim", 37.2);
	hide([heads[4], heads[5], ...covs, one("total")], 37.2);
	word(one("z-big"), 37.5);
	show(one("z-sub"), 37.9);

	// ——— next ———
	tl.addLabel("next", 41.9);
	hide(kids("claim"), 41.9);
	d.close(41.9);
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
