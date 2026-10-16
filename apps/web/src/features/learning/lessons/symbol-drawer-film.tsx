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
import { textWidth } from "../walkthrough/text-measure";
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
 * at Friday's close and published at 06:30. The hero judges three sources against two
 * questions: today's volume and contracts outstanding, where Friday's count is the latest
 * published count and glowing brackets lock its figure to its clock. Last, Monday close
 * volume: the covered subtotal is 1,065; one missing series leaves the whole total unknown.
 *
 *   open      0–4        "Data clocks"
 *   question  4–8.6      10:30 Monday, open interest 100: true when?
 *   clocks    8.6–19.2   the drawer; IV at Fri 16:00; a trade at 10:05, received 10:20;
 *                        OI counted Fri 16:00, published 06:30
 *   sources   19.2–32.95  hero: today's volume; contracts outstanding
 *   cover     32.95–40.25 Monday close volume; covered subtotal; unknown whole total
 *   claim     40.25–44.95 every value has its own clock
 *   next      44.95–47.45 Next: the module checkpoint
 */

const PROOF_SHIFT = 1.5;
const PUBLICATION_DELAY = 1.65;
const PUBLICATION_SHIFT = PROOF_SHIFT + PUBLICATION_DELAY;
const COVERAGE_SHIFT = PUBLICATION_SHIFT + 1.5;
const CLOSING_SHIFT = COVERAGE_SHIFT - 1.6;
const END = 47.45;
const IV_PCT = Math.round(IV * 100);
const REQUIREMENTS = [
	"today",
	"positions",
] as const satisfies readonly Requirement[];
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
		heroNum: Math.max(frame.type.num, frame.type.head * 1.3),
		clockSize: narrow ? frame.type.body : frame.type.small * 1.05,
		clockLift: narrow ? frame.type.body * 1.65 : frame.type.small * 1.5,
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
			H * (narrow ? 0.36 : 0.4) + i * H * (narrow ? 0.19 : 0.18),
		srcH: H * (narrow ? 0.17 : 0.15),
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
	received: ["received", "到达"],
	delay: ["+15 min", "+15 分钟"],
	phoneClock: {
		"m-iv": ["model", "模型"],
		"m-oi": ["count", "统计"],
		"m-pub": ["published", "发布"],
		"m-trade": ["trade", "成交"],
	} as Record<string, Copy>,
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
	oiClock: ["Fri close", "周五收盘"],
	oiLatest: ["Latest published count", "最新已发布统计"],
	oiPublished: ["Mon 06:30", "周一 06:30"],
	phoneWhy: {
		today: {
			friday: ["wrong session", "时段不对"],
			delayed: ["only to 10:15", "仅到 10:15"],
			oi: ["positions, not volume", "持仓，非成交量"],
		},
		positions: {
			friday: ["trades, not positions", "成交，非持仓"],
			delayed: ["trades, not positions", "成交，非持仓"],
		},
	} as Record<"today" | "positions", Record<string, Copy>>,
	req: {
		today: ["Today's volume so far?", "今天到目前的成交量？"],
		positions: ["Contracts outstanding?", "存续合约有多少？"],
		compare: ["Compare full days?", "比较完整的交易日？"],
	} as Record<Requirement, Copy>,
	kHead: ["Monday close volume in contracts.", "周一收盘成交量，单位：张。"],
	k2Head: [
		"Missing series: whole total unknown.",
		"缺失一个序列，全部合计未知。",
	],
	observed: ["observed", "观测"],
	zero: ["zero", "零"],
	missing: ["missing", "缺失"],
	subtotal: [
		`Covered subtotal · ${COVERED.length}/${coverRows.length} series`,
		`覆盖小计 · ${COVERED.length}/${coverRows.length} 序列`,
	],
	whole: ["Whole total: at least", "全部合计：至少"],
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
	const oi = sources.findIndex((source) => source.id === "oi");
	const clockSize = L.clockSize;
	const nowY = narrow
		? L.lineY - 14 - L.clockLift - clockSize * 2.8
		: L.lineY - 14 - T.small * 3.2;
	// Leave a clear lane between the Friday clock and its publication, in both languages.
	const clockWidth =
		textWidth(t(copy.oiClock), clockSize) * (locale === "en" ? 0.86 : 1);
	const linkStart = margin + 16 + L.heroNum * 2.1 + clockWidth + 12;
	const linkEnd =
		margin + room - 16 - textWidth(t(copy.oiPublished), clockSize) - 12;
	const linkY = L.srcY(oi) + L.srcH * 0.84 - clockSize * 0.35;
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
					<g data-f={`${name}-content`}>
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
								(narrow ? clockSize : T.small) * 2.2 +
								(narrow && (i === 3 || i === 1) ? clockSize * 1.7 : 0)
							}
							textAnchor={
								i === 0 ? "start" : i === STOPS.length - 1 ? "end" : "middle"
							}
							className="wt-film-num wt-film-dim"
							style={{ fontSize: narrow ? clockSize : T.small }}
						>
							{t(stop.label)}
						</text>
					</g>
				))}
			</g>
			<g data-f="now">
				<path
					d={`M${L.stopX(STOPS[4].at)} ${nowY + clockSize * 0.65}V${L.lineY + 8}`}
					style={{ stroke: "var(--diagram-accent)", strokeWidth: 2 }}
				/>
				<text
					x={L.stopX(STOPS[4].at)}
					y={nowY}
					textAnchor="end"
					className="wt-film-tag wt-film-accent"
					style={{ fontSize: narrow ? clockSize : T.small }}
				>
					{t(copy.now).toUpperCase()}
				</text>
			</g>
			<path
				data-f="trade-receipt-link"
				d={`M${L.stopX(STOPS[2].at) + 6} ${L.lineY}C${L.stopX(narrow ? 0.74 : 0.7)} ${L.lineY + (narrow ? 6 : 0)} ${L.stopX(narrow ? 0.78 : 0.74)} ${L.lineY - L.clockLift} ${L.stopX(STOPS[3].at) - 6} ${L.lineY - L.clockLift}`}
				fill="none"
				style={{ stroke: "var(--diagram-gain)", strokeWidth: 2 }}
			/>
			<path
				data-f="count-publication-link"
				d={`M${L.stopX(STOPS[0].at) + 6} ${L.lineY}H${L.stopX(STOPS[1].at) - 6}`}
				fill="none"
				style={{ stroke: "var(--diagram-accent)", strokeWidth: 2 }}
			/>
			{marks.map(([name, stop, label, tone, tier]) => {
				const x = L.stopX(STOPS[stop].at);
				/** Marks that share a moment, or sit close, take two tiers. */
				const lift = tier;
				const markY = L.lineY - (lift - 1) * L.clockLift;
				const captions = narrow
					? name === "m-recv"
						? [copy.received, copy.delay]
						: [copy.phoneClock[name]]
					: [label];
				const captionX = x + (name === "m-oi" ? 12 : 0);
				return (
					<g key={name} data-f={name}>
						<circle cx={x} cy={markY} r={6} className={tone} />
						<text
							data-f={`${name}-caption`}
							x={captionX}
							y={markY - 14 - (captions.length - 1) * clockSize * 1.2}
							textAnchor={stop === 0 ? "start" : "middle"}
							className={`wt-film-type wt-halo ${tone}`}
							style={{ fontSize: clockSize }}
						>
							{captions.map((caption, j) => (
								<tspan
									key={j === 0 ? "event" : "delay"}
									x={captionX}
									dy={j === 0 ? 0 : clockSize * 1.2}
								>
									{t(caption)}
								</tspan>
							))}
						</text>
					</g>
				);
			})}

			{/* Three sources, two questions. */}
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
						data-f={`req-${req}-text`}
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
						y={L.srcY(i) + L.srcH * (narrow || source.id === "oi" ? 0.3 : 0.4)}
						className="wt-film-type"
						style={{ fontSize: narrow ? T.body : T.head * 0.9 }}
					>
						{t(source.name)}
					</text>
					{source.id === "oi" ? (
						<>
							<text
								data-f="src-oi-count"
								x={margin + 16}
								y={L.srcY(i) + L.srcH * 0.84}
								className="wt-film-num wt-film-accent"
								style={{ fontSize: L.heroNum }}
							>
								{count(OI)}
							</text>
							<Word
								name="src-oi-clock"
								x={margin + 16 + L.heroNum * 2.1}
								y={L.srcY(i) + L.srcH * 0.84}
								size={clockSize}
								anchor="start"
								className="wt-film-type wt-film-accent"
							>
								{t(copy.oiClock)}
							</Word>
						</>
					) : (
						<text
							x={margin + 16}
							y={L.srcY(i) + L.srcH * (narrow ? 0.55 : 0.74)}
							className="wt-film-num wt-film-dim"
							style={{ fontSize: T.small * 1.05 }}
						>
							{t(source.detail)}
						</text>
					)}
				</g>
			))}
			{REQUIREMENTS.flatMap((req) =>
				sources.map((source, i) => {
					const v = verdicts[req][source.id];
					const why =
						req === "positions" && source.id === "oi"
							? copy.oiLatest
							: narrow
								? copy.phoneWhy[req][source.id]
								: v.why;
					return (
						<g key={`${req}-${source.id}`} data-f={`v-${req}-${i}`}>
							<text
								x={margin + room - 16}
								y={
									L.srcY(i) +
									L.srcH * (narrow || source.id === "oi" ? 0.3 : 0.4)
								}
								textAnchor="end"
								className={`wt-film-tag ${verdictTone[v.verdict]}`}
								style={{ fontSize: T.small * 1.05 }}
							>
								{t(verdictCopy[v.verdict]).toUpperCase()}
							</text>
							<Lines
								name={`v-${req}-${i}-why`}
								x={margin + room - 16}
								y={
									L.srcY(i) +
									L.srcH * (source.id === "oi" ? 0.55 : narrow ? 0.84 : 0.74)
								}
								size={narrow ? T.body : T.small * 1.05}
								maxWidth={narrow ? room - 32 : room * 0.46}
								anchor="end"
								className="wt-film-type wt-film-dim"
								text={t(why)}
							/>
							{req === "positions" && source.id === "oi" ? (
								<Word
									name="oi-publication"
									x={margin + room - 16}
									y={L.srcY(i) + L.srcH * 0.84}
									size={clockSize}
									anchor="end"
									className="wt-film-num wt-film-accent"
								>
									{t(copy.oiPublished)}
								</Word>
							) : null}
						</g>
					);
				}),
			)}

			<path
				data-f="hero-publication-link"
				d={`M${linkStart} ${linkY}H${linkEnd}L${linkEnd - 5} ${linkY - 3}L${linkEnd} ${linkY}L${linkEnd - 5} ${linkY + 3}`}
				fill="none"
				style={{ stroke: "var(--diagram-accent)", strokeWidth: 2 }}
			/>
			<Brackets name="lock-verdict" glow />

			{/* Missing, zero and observed. */}
			{headline("k-head", copy.kHead)}
			{/* The covered subtotal stays true; the whole total is bounded, not known. */}
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
			<path
				data-f="covered-group"
				d={`M${margin - 2} ${L.rowY(0) - 4}H${margin - 9}V${L.rowY(3) + L.rowH + 4}H${margin - 2}`}
				fill="none"
				style={{ stroke: "var(--diagram-accent)", strokeWidth: 2 }}
			/>
			<g data-f="subtotal">
				<Word
					name="subtotal-label"
					x={margin}
					y={L.totalY}
					size={T.small * 1.05}
					anchor="start"
					className="wt-film-type wt-film-dim"
				>
					{t(copy.subtotal)}
				</Word>
				<Word
					name="subtotal-value"
					x={margin + room}
					y={L.totalY}
					size={T.head}
					anchor="end"
					className="wt-film-num wt-film-accent"
				>
					{count(TOTAL)}
				</Word>
			</g>
			<g data-f="total">
				<Word
					name="total-label"
					x={margin}
					y={L.totalY + T.head * 1.8}
					size={T.small * 1.05}
					anchor="start"
					className="wt-film-type wt-film-dim"
				>
					{t(copy.whole)}
				</Word>
				<Word
					name="total-value"
					x={margin + room}
					y={L.totalY + T.head * 1.8}
					size={T.head}
					anchor="end"
					className="wt-film-num wt-film-accent"
				>
					{count(TOTAL)}
				</Word>
			</g>

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
	/** Scale single text only; a panel or a grouped clock proof fades in place. */
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			target.tagName === "text"
				? { opacity: 0, scale: 1.08, transformOrigin: "50% 50%" }
				: { opacity: 0 },
			{
				opacity: 1,
				...(target.tagName === "text" ? { scale: 1 } : {}),
				duration: 0.55,
				ease: "power3.out",
			},
			time,
		);
	/** Content dims as a unit; the selected field keeps its original colour and full contrast. */
	const focus = (name: string, time: number) => {
		for (const field of ["f-oi", "f-iv", "f-last"]) {
			tl.to(
				one(`${field}-content`),
				{
					opacity: field === name ? 1 : 0.3,
					duration: 0.3,
					ease: "power2.out",
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
	const clockLinks = ["trade-receipt-link", "count-publication-link"].map(
		(name) => one<SVGPathElement>(name),
	);
	const heroLink = one<SVGPathElement>("hero-publication-link");
	// Each pair is one construction: the connecting stroke and both clock stamps settle together.
	const connectClocks = (
		from: Element,
		to: Element,
		link: SVGPathElement,
		at: number,
	) => {
		tl.fromTo(
			[from, to],
			{ opacity: 0 },
			{ opacity: 1, duration: 0.55, ease: "power3.out" },
			at,
		);
		d.trace(link, at, { duration: 0.55 });
	};
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
		...clockLinks,
		heroLink,
		one("oi-publication"),
		...reqs,
		...srcs,
		...REQUIREMENTS.flatMap(verdictsFor),
		lockVerdict,
		...covs,
		one("covered-group"),
		one("subtotal"),
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
	show(one("q-line"), 4.8);
	word(one("q-big"), 5.1);

	// ——— clocks: each field's own time, open interest last ———
	tl.addLabel("clocks", 8.6);
	hide(flat("q"), 8.6);
	show(heads[0], 8.8);
	fields.forEach((field, i) => {
		show(field, 9.2 + i * 0.2);
	});
	show(kids("timeline"), 9.45);
	word(one("now"), 9.8);
	focus("f-iv", 10.95);
	word(marks[0], 10.95);
	// Event and receipt form one proof; it settles at 13.05, then rests for a second.
	focus("f-last", 12.5);
	connectClocks(marks[3], marks[4], clockLinks[0], 12.5);
	// Count and publication form one proof, complete a second before its answer arrives.
	focus("f-oi", 14.05);
	connectClocks(marks[1], marks[2], clockLinks[1], 14.05);
	show(heads[1], 15.6);

	// ——— sources: the hero. Fresh enough for which question? ———
	tl.addLabel("sources", 19.2);
	d.swap([heads[0], heads[1]], heads[2], 19.2);
	hide(
		[...fields, ...kids("timeline"), one("now"), ...marks, ...clockLinks],
		19.2,
	);
	srcs.forEach((src, i) => {
		show(src, 19.8 + i * 0.2, "right");
	});
	// Questions settle and rest for a second before their verdict constructions begin.
	show(reqs[REQUIREMENTS.indexOf("today")], 20.05);
	verdictsFor("today").forEach((v, i) => {
		word(v, 21.55 + i * 0.2);
	});
	hide(
		[reqs[REQUIREMENTS.indexOf("today")], ...verdictsFor("today")],
		24.85,
		0.3,
	);
	show(reqs[REQUIREMENTS.indexOf("positions")], 25.2);
	verdictsFor("positions").forEach((v) => {
		word(v, 25.2 + PROOF_SHIFT);
	});
	// Read all verdicts together before dimming the tapes; the OI card stays at full strength.
	tl.to(
		[
			...srcs.slice(0, 2),
			...verdictsFor("positions")
				.slice(0, 2)
				.flatMap((v) => [...v.children]),
		],
		{ opacity: 0.3, duration: 0.3, ease: "power2.out" },
		25.2 + PROOF_SHIFT + PUBLICATION_DELAY,
	);
	const oi = sources.findIndex((source) => source.id === "oi");
	// After the question rests, promote the count; its value and clock never change.
	tl.fromTo(
		one("src-oi-count"),
		{ fontSize: L.clockSize },
		{ fontSize: L.heroNum, duration: 0.55, ease: "power3.out" },
		25.2 + PROOF_SHIFT,
	);
	// Connect the same Friday count to its Monday publication; both settle before the lock.
	word(one("oi-publication"), 25.55 + PUBLICATION_SHIFT);
	d.trace(heroLink, 25.55 + PUBLICATION_SHIFT, { duration: 0.55 });
	// Enclose the constructed count, Friday clock and latest publication evidence together.
	d.lock(lockVerdict, 26.2 + PUBLICATION_SHIFT, {
		around: [srcs[oi], verdictsFor("positions")[oi]],
		pad: 6,
	});
	tl.addLabel("hero-lock", 26.2 + PUBLICATION_SHIFT);
	// Settle the answer with the brackets, so the complete stand has no secondary motion.
	show(heads[3], 26.2 + PUBLICATION_SHIFT, "below", 0.45);

	// ——— cover: blank is not zero ———
	tl.addLabel("cover", 29.8 + PUBLICATION_SHIFT);
	d.swap([heads[2], heads[3]], heads[4], 29.8 + PUBLICATION_SHIFT);
	hide(
		[
			reqs[REQUIREMENTS.indexOf("positions")],
			...srcs,
			...verdictsFor("positions"),
			heroLink,
			lockVerdict,
		],
		29.8 + PUBLICATION_SHIFT,
	);
	// The coverage heading settles at 33.80; its units stand a second before any row enters.
	const coverageAt = { observed: 30.15, zero: 30.3, missing: 30.5 };
	covs.forEach((cov, i) => {
		show(cov, coverageAt[coverRows[i].state] + COVERAGE_SHIFT, "right");
	});
	d.trace(one<SVGPathElement>("covered-group"), 32.0 + COVERAGE_SHIFT, {
		duration: 0.5,
	});
	show(one("subtotal"), 32.0 + COVERAGE_SHIFT);
	show(one("total"), 33.6 + COVERAGE_SHIFT);
	// The missing row already proves this qualification; preserve its hold as the bound rest shrinks.
	show(heads[5], 33.6 + CLOSING_SHIFT);

	// ——— claim ———
	tl.addLabel("claim", 37.2 + CLOSING_SHIFT);
	hide(
		[
			heads[4],
			heads[5],
			...covs,
			one("covered-group"),
			one("subtotal"),
			one("total"),
		],
		37.2 + CLOSING_SHIFT,
	);
	word(one("z-big"), 37.5 + CLOSING_SHIFT);
	show(one("z-sub"), 37.9 + CLOSING_SHIFT);

	// ——— next ———
	tl.addLabel("next", 41.9 + CLOSING_SHIFT);
	hide(kids("claim"), 41.9 + CLOSING_SHIFT);
	d.close(41.9 + CLOSING_SHIFT);
	return tl;
}

export const symbolDrawerFilm: Film = {
	id: "symbol-drawer",
	label: [
		`Data clocks, as a short film: ALFA's drawer at 10:30 on Monday, where the ${IV_PCT}% model IV and the open interest of ${OI} are as of Friday's close, the count published at 06:30, and the last trade happened at ${T1.time} but arrived at 10:20; three sources judged against today's volume and contracts outstanding; and Monday close volume across five Oct 18 call series, where a 0 is measured, a blank is missing, the covered subtotal is ${count(TOTAL)}, and the unknown whole total is at least ${count(TOTAL)}`,
		`数据时钟短片：周一 10:30 的 ALFA 抽屉：${IV_PCT}% 的模型隐含波动率和 ${OI} 的未平仓量都截至周五收盘，统计在 06:30 发布，最新成交发生在 ${T1.time} 却在 10:20 才到达；三个来源对照今天的成交量和存续合约；以及周一收盘时五个 10月18日 看涨序列的成交量：0 是测得的，空白是缺失，覆盖小计为 ${count(TOTAL)}，未知的全部合计至少 ${count(TOTAL)}`,
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
