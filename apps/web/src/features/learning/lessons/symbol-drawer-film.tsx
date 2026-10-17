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
 *   clocks    8.6–19.2   scaffold, then IV, event/receipt and count/publication proofs
 *   sources   19.2–31.85 source layout; today's tape checks together, then OI's measure;
 *                        positions question rests before its verdict tour;
 *                        the same guide glows on Friday's latest published count
 *   cover     31.85–40.7 all rows and both readouts stay readable throughout the tour
 *   claim     40.7–45.4  every value has its own clock
 *   next      45.4–47.45 Next: the module checkpoint
 */

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
	tourDay: ["Day / cutoff", "日期 / 截止时间"],
	tourMeasure: ["Positions ≠ volume", "持仓 ≠ 成交量"],
	tourTapes: ["Trades ≠ positions", "成交 ≠ 持仓"],
	tourZero: ["Covered, including zero", "已覆盖，含零"],
	tourMissing: ["Missing ≠ zero", "缺失 ≠ 零"],
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
	coverSeries: ["Oct 18 calls · strike", "10月18日看涨 · 行权价"],
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

const TOUR_CAPTIONS = {
	day: copy.tourDay,
	measure: copy.tourMeasure,
	tapes: copy.tourTapes,
	latest: copy.oiLatest,
	zero: copy.tourZero,
	missing: copy.tourMissing,
} satisfies Record<string, Copy>;

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
		["f-iv", copy.iv, copy.ivShort, `${IV_PCT}%`, "wt-film-warn"],
		[
			"f-last",
			copy.last,
			copy.lastShort,
			`${T1.quantity} @ ${usd(T1.price)}`,
			"wt-film-gain",
		],
		["f-oi", copy.oi, copy.oiShort, count(OI), "wt-film-accent"],
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
						y={L.srcY(i) + L.srcH * 0.3}
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
							y={L.srcY(i) + L.srcH * 0.55}
							className="wt-film-num wt-film-dim"
							style={{ fontSize: T.small * 1.05 }}
						>
							{t(source.detail)
								.split(" · ")
								.map((line, j) => (
									<tspan
										key={j === 0 ? "quantity" : "session"}
										x={margin + 16}
										dy={j === 0 ? 0 : L.srcH * 0.29}
									>
										{line}
									</tspan>
								))}
						</text>
					)}
				</g>
			))}
			{REQUIREMENTS.flatMap((req) =>
				sources.map((source, i) => {
					const v = verdicts[req][source.id];
					return (
						<g key={`${req}-${source.id}`} data-f={`v-${req}-${i}`}>
							<text
								x={margin + room - 16}
								y={L.srcY(i) + L.srcH * 0.3}
								textAnchor="end"
								className={`wt-film-tag ${verdictTone[v.verdict]}`}
								style={{ fontSize: T.small * 1.05 }}
							>
								{t(verdictCopy[v.verdict]).toUpperCase()}
							</text>
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
			{/* One guide for the entire film; only its hero stop uses the glow. */}
			<Brackets name="tour-guide" glow />
			{Object.entries(TOUR_CAPTIONS).map(([id, caption]) => (
				<Word
					key={id}
					name={`tour-${id}`}
					x={margin}
					y={H * 0.955}
					size={T.body}
					anchor="start"
					className="wt-film-type wt-film-dim"
				>
					{t(caption)}
				</Word>
			))}

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
			<Word
				name="cover-series"
				x={margin + 14}
				y={L.rowY(0) - 14}
				size={T.small}
				anchor="start"
				className="wt-film-type wt-film-dim"
			>
				{t(copy.coverSeries)}
			</Word>
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
						{row.id}
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
	const L = layout(context.width);
	const d = createDirector(context, L, END);
	const { tl, one, kids, show, hide } = d;
	const flat = (name: string) =>
		kids(name).flatMap((el) =>
			el.tagName === "g" && !el.hasAttribute("data-f")
				? [...el.children]
				: [el],
		);
	/** A complete layout fades in at rest, with no stagger or grouped scaling. */
	const still = (targets: Element | Element[], at: number, duration = 0.5) =>
		tl.fromTo(
			targets,
			{ opacity: 0 },
			{ opacity: 1, duration, ease: "power3.out" },
			at,
		);
	const word = (target: Element, at: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			at,
		);
	const heads = [
		"c-head",
		"c2-head",
		"s-head",
		"s2-head",
		"k-head",
		"k2-head",
	].map((name) => one(name));
	const fieldNames = ["f-iv", "f-last", "f-oi"];
	const fields = fieldNames.map((name) => one(name));
	const markNames = ["m-iv", "m-oi", "m-pub", "m-trade", "m-recv"];
	const marks = markNames.map((name) => one(name));
	const clockLinks = ["trade-receipt-link", "count-publication-link"].map(
		(name) => one<SVGPathElement>(name),
	);
	/** Event/receipt and count/publication are built as paired clock proofs. */
	const connectClocks = (
		from: Element,
		to: Element,
		link: SVGPathElement,
		at: number,
	) => {
		still([from, to], at, 0.55);
		d.trace(link, at, { duration: 0.55 });
	};
	const heroLink = one<SVGPathElement>("hero-publication-link");
	const reqs = REQUIREMENTS.map((req) => one(`req-${req}`));
	const srcs = sources.map((_, i) => one(`src-${i}`));
	const verdictsFor = (req: Requirement) =>
		sources.map((_, i) => one(`v-${req}-${i}`));
	const covs = coverRows.map((_, i) => one(`cov-${i}`));
	const guide = one<SVGGraphicsElement>("tour-guide");
	const heroGlow = getComputedStyle(guide).filter;
	const captions = Object.keys(TOUR_CAPTIONS).map((id) => one(`tour-${id}`));
	// One bracket path throughout; its existing glow is enabled only at the hero.
	tl.set(guide, { filter: "none" }, 0);
	const dim = (targets: Element[], opacity: number, at: number) =>
		tl.to(targets, { opacity, duration: 0.3, ease: "power2.out" }, at);
	const focusClocks = (field: number, at: number) => {
		fieldNames.forEach((name, i) => {
			dim([one(`${name}-content`)], field === i ? 1 : 0.3, at);
		});
	};
	const focusSources = (selected: number[], at: number) => {
		srcs.forEach((_, i) => {
			const opacity = selected.includes(i) ? 1 : 0.3;
			// Dim children so each whole row still leaves as a unit at the cut.
			dim(kids(`src-${i}`), opacity, at);
			for (const req of REQUIREMENTS)
				dim(
					kids(`v-${req}-${i}`).filter((el) => el !== one("oi-publication")),
					opacity,
					at,
				);
		});
	};
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
		guide,
		...captions,
		...covs,
		one("cover-series"),
		one("subtotal"),
		one("total"),
		...kids("claim"),
	]);
	tl.addLabel("open", 0);
	d.open(0);
	tl.addLabel("question", 4);
	d.tag(4);
	show(one("q-tag"), 4.6);
	show(one("q-line"), 4.8);
	word(one("q-big"), 5.1);

	// Restore the pre-trial scaffold and the clock relationships it supports.
	tl.addLabel("clocks", 8.6);
	hide(flat("q"), 8.6);
	show(heads[0], 8.8);
	fields.forEach((field, i) => {
		show(field, 9.2 + i * 0.2);
	});
	show(kids("timeline"), 9.45);
	still(one("now"), 9.8, 0.55);
	// Axis labels settle at 9.95, one second before the first data stamp.
	focusClocks(0, 10.95);
	still(marks[0], 10.95, 0.55);
	focusClocks(1, 12.5);
	connectClocks(marks[3], marks[4], clockLinks[0], 12.5);
	// Each pair settles for one second before the next construction or answer.
	focusClocks(2, 14.05);
	connectClocks(marks[1], marks[2], clockLinks[1], 14.05);
	show(heads[1], 15.6);

	// Complete source layout settles at 20.05, one second before the first stop.
	tl.addLabel("sources", 19.2);
	d.swap([heads[0], heads[1]], heads[2], 19.2);
	hide(
		[...fields, ...kids("timeline"), one("now"), ...marks, ...clockLinks],
		19.2,
	);
	still(srcs, 19.55);
	show(reqs[0], 19.55);
	const today = verdictsFor("today");
	const positions = verdictsFor("positions");
	// Compare the tapes' named days and cutoff clocks together; their verdicts differ.
	focusSources([0, 1], 21.05);
	d.lock(guide, 21.05, { around: srcs.slice(0, 2), pad: 6 });
	still(today.slice(0, 2), 21.05, 0.3);
	still(one("tour-day"), 21.05, 0.3);
	d.swap(one("tour-day"), one("tour-measure"), 22.5);
	focusSources([2], 22.75);
	d.lock(guide, 22.75, { around: [srcs[2]], pad: 6 });
	still(today[2], 22.75, 0.3);

	// Positions question enters at 24.65, settles at 25.15, then rests a full second.
	d.swap(reqs[0], reqs[1], 24.3);
	hide(today, 24.3, 0.3);
	focusSources([0, 1, 2], 24.3);
	hide(guide, 24.3, 0.35, 0);
	hide(one("tour-measure"), 24.3);
	d.swap(one("tour-measure"), one("tour-tapes"), 25.8);
	focusSources([0, 1], 26.15);
	d.lock(guide, 26.15, { around: srcs.slice(0, 2), pad: 6 });
	still(positions.slice(0, 2), 26.15, 0.3);

	// Same Friday count, same Monday publication: construct the link before locking.
	d.swap(one("tour-tapes"), one("tour-latest"), 27.65);
	focusSources([2], 27.65);
	d.lock(guide, 27.65, { around: [srcs[2], positions[2]], pad: 6 });
	still(positions[2], 27.8);
	tl.fromTo(
		one("src-oi-count"),
		{ fontSize: L.clockSize },
		{ fontSize: L.heroNum, duration: 0.55, ease: "power3.out" },
		27.65,
	);
	still(one("oi-publication"), 27.65, 0.55);
	d.trace(heroLink, 27.65, { duration: 0.55 });
	tl.set(guide, { filter: heroGlow }, 28.25);
	d.lock(guide, 28.25, { around: [srcs[2], positions[2]], pad: 6 });
	tl.addLabel("hero-lock", 28.25);
	show(heads[3], 28.25, "below", 0.45);
	// Frozen from 28.70 through 31.85: the accepted 3.15 s hero stand.

	// All rows and both settled results arrive together, not result-by-result.
	tl.addLabel("cover", 31.85);
	d.swap([heads[2], heads[3]], heads[4], 31.85);
	focusSources([0, 1, 2], 31.85);
	hide([reqs[1], ...srcs, ...positions, heroLink, one("tour-latest")], 31.85);
	hide(guide, 31.85, 0.35, 0);
	tl.set(guide, { filter: "none" }, 32.2);
	still([...covs, one("cover-series"), one("subtotal"), one("total")], 32.2);
	// Whole layout still at 32.70; tour starts one second later.
	// Comparisons need their evidence: all rows and both readouts stay at full contrast.
	d.lock(guide, 33.7, { around: covs.slice(0, 4), pad: 6 });
	still(one("tour-zero"), 33.7, 0.3);
	d.swap(one("tour-zero"), one("tour-missing"), 35.35);
	d.lock(guide, 35.7, { around: [covs[4]], pad: 6 });
	show(heads[5], 35.7, "below", 0.45);
	d.lock(guide, 37.25, { around: [one("total")], pad: 6 });
	hide(one("tour-missing"), 37.25);
	// The lower bound remains beside its subtotal and all five rows until the cut.

	tl.addLabel("claim", 40.7);
	hide(
		[
			heads[4],
			heads[5],
			...covs,
			one("cover-series"),
			one("subtotal"),
			one("total"),
		],
		40.7,
	);
	hide(guide, 40.7, 0.35, 0);
	word(one("z-big"), 41);
	show(one("z-sub"), 41.4);
	tl.addLabel("next", 45.4);
	hide(kids("claim"), 45.4);
	d.close(45.4);
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
