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
	Lines,
	lineCount,
	TitleCard,
	toneClass,
	Word,
} from "../walkthrough/film-kit";
import { textWidth } from "../walkthrough/text-measure";
import {
	COVERED,
	cancelled,
	dollars,
	extra,
	fields,
	MONDAY,
	records,
	repeated,
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
const R2_TRADES = R2?.trades ?? [];
const SPREAD_R2 = extra(R2_TRADES.find((trade) => trade.id === "T-3"));
const SPREAD_R3 = extra(
	rowById("R3")?.trades?.find((trade) => trade.id === "leg"),
);

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
	coverage: [
		`${COVERED} of ${SERIES} series`,
		`${SERIES} 个序列中的 ${COVERED} 个`,
	],
	savedCoverage: [
		`Subtotal · ${COVERED} of ${SERIES} series`,
		`观测小计 · ${COVERED}/${SERIES} 个序列`,
	],
	p1Says: [`P1: ${dollars(MONDAY)}`, `P1：${dollars(MONDAY)}`],
	whyFormula: [
		`÷ 100 · ${reruns.formula.why[0]}`,
		`÷ 100 · ${reruns.formula.why[1]}`,
	],
	whyExclusions: [
		`+${dollars(reruns.exclusions.cents - MONDAY)} · ${reruns.exclusions.why[0]}`,
		`+${dollars(reruns.exclusions.cents - MONDAY)} · ${reruns.exclusions.why[1]}`,
	],
	noData: ["no data yet", "尚无数据"],
	coveredZero: ["covered, zero", "已覆盖，零"],
	cancelled: ["cancelled T-2", "T-2 已取消"],
	repeated: ["repeated T-1", "T-1 重复计入"],
	r5Cause: [
		`+${dollars(TUESDAY - MONDAY)} · R5 arrived`,
		`+${dollars(TUESDAY - MONDAY)} · R5 已到达`,
	],
	spreadCause: ["remove spread legs · R2 + R3", "去掉价差腿 · R2 + R3"],
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
	spreadR2: ["R2 · T-3", "R2 · T-3"],
	spreadR3: ["+ R3 · spread leg", "+ R3 · 价差腿"],
	spreadTotal: ["Spread total", "价差合计"],
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
	/** The rerun's figure: on a phone, larger than the type scale's floor. */
	const rerunSize = narrow ? T.num * 1.4 : T.num;
	// Keep the after-beat below the lock: one compact row on desktop, two on phone.
	const extraSize = T.body;
	const extraY = L.rerunY + rerunSize * 1.3 + text * 1.9 + T.small * 2.8;
	const repeatedX = narrow
		? margin
		: margin +
			textWidth(dollars(extra(cancelled)), extraSize) +
			textWidth(t(copy.cancelled), T.small) +
			24;
	const repeatedY = extraY + (narrow ? extraSize * 1.5 : 0);
	const extraTotalX =
		repeatedX +
		textWidth(`+ ${dollars(extra(repeated))}`, extraSize) +
		textWidth(t(copy.repeated), T.small) +
		24;
	const spreadProofSize = T.body;
	const spreadProofStep = spreadProofSize * 1.65;
	const spreadProofY = L.recY(2) + L.recH * 0.6 + spreadProofStep;
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
				{`≥ ${dollars(0)}`}
			</text>
			{mondayPacket.map((row, i) => {
				const premium = rowPremium(row);
				if (premium === null) return null;
				return (
					<text
						key={row.id}
						data-f={`sum-ticket-${i}`}
						x={margin + room - 12}
						y={
							L.traceY +
							(narrow ? T.small * 2 + T.head * 1.2 : T.small) -
							(narrow ? T.head : T.num) * 1.2 -
							text
						}
						textAnchor="end"
						className="wt-film-num wt-film-accent"
						style={{ fontSize: text }}
					>
						{dollars(premium)}
					</text>
				);
			})}
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

			{(
				[
					[
						"extra-cancelled",
						dollars(extra(cancelled)),
						copy.cancelled,
						margin,
						extraY,
					],
					[
						"extra-repeated",
						`+ ${dollars(extra(repeated))}`,
						copy.repeated,
						repeatedX,
						repeatedY,
					],
				] as const
			).map(([name, value, label, x, y]) => (
				<g key={name} data-f={name}>
					<text
						x={x}
						y={y}
						className="wt-film-num"
						style={{ fontSize: extraSize }}
					>
						{value}
					</text>
					<text
						x={x + textWidth(value, extraSize) + 12}
						y={y}
						className="wt-film-tag"
						style={{ fontSize: T.small, letterSpacing: 0 }}
					>
						{t(label)}
					</text>
				</g>
			))}
			<text
				data-f="extra-total"
				x={extraTotalX}
				y={repeatedY}
				className="wt-film-num"
				style={{ fontSize: extraSize }}
			>{`= ${dollars(extra(cancelled) + extra(repeated))}`}</text>
			<path
				data-f="exclusions-link"
				d={`M ${margin + room} ${L.fieldY(3) + L.fieldH} H ${margin + room + 4} V ${repeatedY + extraSize} H ${extraTotalX + textWidth(`= ${dollars(extra(cancelled) + extra(repeated))}`, extraSize) / 2}`}
				fill="none"
				className="wt-film-link"
				style={{ stroke: "var(--tone-ink)", strokeWidth: 1.5 }}
			/>

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
			{(
				[
					["log-r5-cause", copy.r5Cause, 1],
					["log-spread-cause", copy.spreadCause, 2],
				] as const
			).map(([name, value, i]) => (
				<text
					key={name}
					data-f={name}
					x={margin + 16}
					y={L.recY(i) - H * 0.009}
					className={`wt-film-num ${i === 1 ? toneClass.up : "wt-film-dim"}`}
					style={{ fontSize: T.small }}
				>
					{t(value)}
				</text>
			))}
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
					{i === 2 && (
						<rect
							data-f="rec-2-saved-box"
							x={margin}
							y={L.recY(i)}
							width={room}
							height={L.recH}
							rx={12}
							className="wt-panel-shape"
							style={{ strokeDasharray: "5 4" }}
						/>
					)}
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

			{/* Execution labels stay beside body-sized, stacked spread portions. */}
			<g data-f="log-spread-proof">
				{(
					[
						["log-spread-r2", copy.spreadR2, SPREAD_R2, 0],
						["log-spread-r3", copy.spreadR3, SPREAD_R3, 1],
					] as const
				).map(([name, label, cents, i]) => (
					<g key={name} data-f={name}>
						<text
							x={margin + 16}
							y={spreadProofY + i * spreadProofStep}
							className="wt-film-type"
							style={{ fontSize: spreadProofSize }}
						>
							{t(label)}
						</text>
						<text
							x={margin + room - 16}
							y={spreadProofY + i * spreadProofStep}
							textAnchor="end"
							className="wt-film-num"
							style={{ fontSize: spreadProofSize }}
						>
							{dollars(cents)}
						</text>
					</g>
				))}
			</g>

			{/* P3's selected total occupies its eventual subtraction-operand position.
			    Its result stays on this baseline when the portions below fold away. */}
			{(
				[
					[1, `${dollars(MONDAY)} + `, TUESDAY],
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
						{i === 2 && (
							<text
								data-f="log-spread-total-label"
								x={margin + 16}
								y={equationY}
								className="wt-film-type"
								style={{ fontSize: equationSize }}
							>
								{t(copy.spreadTotal)}
							</text>
						)}
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
							=
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
		one("trace"),
		one("trace-result"),
		...mondayPacket.flatMap((row, i) =>
			rowPremium(row) === null ? [] : [one(`sum-ticket-${i}`)],
		),
		one("sum-ge"),
		one("subtotal"),
		...fieldRows,
		one("rerun-tag"),
		...rerunMarks,
		one("rerun-back"),
		one("rec-0-n"),
		one("rec-0-note"),
		one("rec-2-saved-box"),
		one("log-spread-proof"),
		one("log-spread-r2"),
		one("log-spread-r3"),
		one("log-spread-total-label"),
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
		...[
			"extra-cancelled",
			"extra-repeated",
			"extra-total",
			"exclusions-link",
			"log-r5-cause",
			"log-spread-cause",
		].map((name) => one(name)),
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
		show(row, 9.2 + i * 0.1, "right", 0.35);
	});
	tl.set(one(`row-${r2}-box`), { attr: { class: "wt-focus-shape" } }, 9.8);
	show(one("trace"), 9.8, "below", 0.3);
	// The trace comes to R2's figure, which lights with it.
	// Both body-sized terms and their settled result read together for 10.4–12.4.
	show(one("trace-result"), 10.1, "below", 0.3);
	tl.set(
		one(`row-${r2}-premium`),
		{ attr: { class: `wt-film-num ${toneClass.focus}` } },
		10.2,
	);
	tl.set(one(`row-${r2}-box`), { attr: { class: "wt-panel-shape" } }, 12.4);
	tl.set(one(`row-${r2}-premium`), { attr: { class: "wt-film-num" } }, 12.4);
	// Kept premiums travel down the right lane. Neighboring premiums step back while
	// the copy passes; series labels and contract counts stay outside that lane.
	// The missing series is already visible: this is a floor throughout its construction.
	show(one("sum-ge"), 12.4, "below", 0.3);
	// The phone trace reaches the lane; step it back until every premium has landed.
	tl.to(one("trace"), { opacity: 0.2, duration: 0.3 }, 12.4);
	let total = 0;
	let step = 0;
	mondayPacket.forEach((row, i) => {
		const premium = rowPremium(row);
		// Covered zero stays in the table; only positive contributions need a flight.
		if (premium === null || premium === 0) return;
		const at = 12.7 + step * 0.8;
		const figure = one<SVGGraphicsElement>(`row-${i}-premium`);
		const neighbors = mondayPacket
			.map((_, j) => one(`row-${j}-premium`))
			.filter((_, j) => j !== i);
		tl.set(neighbors, { opacity: 0.2 }, at);
		tl.set(one(`row-${i}-premium`), { opacity: 1 }, at);
		tl.set(figure, { attr: { class: "wt-film-num wt-film-accent" } }, at);
		const ticket = one<SVGGraphicsElement>(`sum-ticket-${i}`);
		// Land above the subtotal, then fold the ticket shut before the exact total cuts in.
		d.carry(figure, ticket, at, {
			duration: 0.45,
			arc: "y",
			keep: true,
			fit: false,
		});
		tl.to(
			ticket,
			{
				scaleY: 0,
				transformOrigin: "50% 50%",
				duration: 0.3,
				ease: "power2.in",
			},
			at + 0.45,
		);
		tl.set(ticket, { opacity: 0 }, at + 0.75);
		d.count(
			one<SVGTextElement>("sum-ge"),
			total + premium,
			at + 0.77,
			(v) => `≥ ${dollars(Math.round(v / 100) * 100)}`,
			total,
			0,
		);
		tl.set(figure, { attr: { class: "wt-film-num" } }, at + 0.8);
		total += premium;
		step += 1;
	});
	tl.to(
		mondayPacket.map((_, i) => one(`row-${i}-premium`)),
		{ opacity: 1, duration: 0.3 },
		15.1,
	);
	tl.to(one("trace"), { opacity: 1, duration: 0.3 }, 15.1);
	// Coverage is established during the final contribution, then the whole proof
	// reads quietly from 15.4 until the coverage highlight at 16.5.
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
		],
		18.6,
	);
	// A compact table entrance leaves more time to establish the exclusions proof
	// before the lock; the complete fields and initial match retain their reading time.
	fieldRows.forEach((row, i) => {
		show(row, 18.95 + i * 0.05, "right", 0.35);
	});
	show(one("rerun-tag"), 19.55, "below", 0.3);
	// Establish P1's comparison once. The restored match supplies the correct rerun;
	// an earlier duplicate match and duplicate division line are unnecessary.
	drop("formula", 19.65);
	word(rerunMarks[0], 19.95);
	show(one("p1-says"), 19.95, "below", 0.3);
	show(one("why-formula"), 19.95, "below", 0.3);
	show(heads[3], 19.95);
	// The formula reason is fully settled for 3.5 s before it folds away.
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
	show(one("extra-cancelled"), 24.75, "below", 0.3);
	show(one("extra-repeated"), 25.2, "below", 0.3);
	d.trace(one<SVGPathElement>("exclusions-link"), 25.5, { duration: 0.35 });
	show(one("extra-total"), 25.85, "below", 0.3);
	// The complete exclusions sum settles at 26.15: 1.8 quiet seconds before lock.
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
	hide(
		[
			one("why-exclusions"),
			one("extra-cancelled"),
			one("extra-repeated"),
			one("extra-total"),
			one("exclusions-link"),
		],
		29.9,
	);
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
	// Save each arithmetic result on its existing baseline at its final type size.
	// Only the operands leave; the same figure remains as the record's readout.
	const saveResult = (i: 1 | 2, clearAt: number) => {
		const operands = [
			one(`log-${i}-expression`),
			one(`log-${i}-operand`),
			one(`log-${i}-equals`),
		];
		if (i === 2) operands.push(one("log-spread-proof"));
		hide(operands, clearAt, 0.3, 0);
	};
	// Qualified P1 reads alone for 32.85–33.85. P1 establishes the base amount;
	// R5 and the addition arrive next, followed by the settled equality/result.
	show(
		[
			recs[1],
			one("log-r5-cause"),
			one("log-1-expression"),
			one("log-1-operand"),
		],
		33.85,
		"below",
		0.3,
	);
	show([one("log-1-equals"), one("log-1-result")], 34.15, "below", 0.3);
	// Complete P2: 34.45–35.95 quiet; saved P2: 36.25–37.25 quiet.
	saveResult(1, 35.95);
	show(heads[5], 37.25, "below", 0.3);
	show([recs[2], one("log-spread-cause")], 37.25, "right", 0.3);
	// Identify both selected portions, then establish their total for a full second.
	// Both children are hidden: opening this mask reveals no visible mark by itself.
	tl.set(one("log-spread-proof"), { opacity: 1 }, 37.25);
	show([one("log-spread-r2"), one("log-spread-r3")], 37.25, "below", 0.3);
	tl.fromTo(
		[one("log-spread-total-label"), one("log-2-operand")],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		37.5,
	);
	tl.to(
		[recs[0], recs[1], one("log-1-result"), one("log-r5-cause")],
		{ opacity: 0.45, duration: 0.3 },
		37.25,
	);
	// The selected portions and their total are intact and quiet for 37.8–38.8.
	// Complementary opacity fades replace the short label with the subtraction;
	// both stay on their baseline, and neither overlaps the other above 0.5 opacity.
	tl.to(
		one("log-spread-total-label"),
		{ opacity: 0, duration: 0.3, ease: "power3.out" },
		38.8,
	);
	tl.fromTo(
		[one("log-2-expression"), one("log-2-equals"), one("log-2-result")],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		38.8,
	);
	// Complete subtraction: 39.1–40.1 quiet. Save the very same result in place;
	// crossfade the panel outlines so no moving border passes through outgoing type.
	saveResult(2, 40.1);
	hide(one("rec-2-box"), 40.1, 0.3, 0);
	tl.fromTo(
		one("rec-2-saved-box"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3, ease: "power2.in" },
		40.1,
	);
	// The compact saved P3 holds quietly for 40.4–41.4 (1 s).

	// ——— claim ———
	tl.addLabel("claim", 41.4);
	hide(
		[
			heads[4],
			heads[5],
			...recs,
			one("log-1-result"),
			one("log-2-result"),
			one("log-r5-cause"),
			one("log-spread-cause"),
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
