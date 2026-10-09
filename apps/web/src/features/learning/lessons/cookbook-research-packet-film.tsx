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
 *   fields    18.6–29.95 hero: every field; without the formula; without the exclusions,
 *                        held; then the field goes back and the figure is P1's again
 *   log       29.95–41.55 P1; add R5 to make P2; build the two-leg operand, then P3
 *   claim     41.55–45.95 work someone else can rerun
 *   next      45.95–47.5 Next: recaps
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
	subtotalGe: [`≥ ${dollars(MONDAY)}`, `≥ ${dollars(MONDAY)}`],
	coverage: [
		`${COVERED} of ${SERIES} series`,
		`${SERIES} 个序列中的 ${COVERED} 个`,
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
	spreadCause: ["spread legs · R2 + R3", "价差两条腿 · R2 + R3"],
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
	const spreadProofY = L.recY(2) + L.recH * 0.6;
	const spreadProofStep = spreadProofSize * 1.65;
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
							className={`wt-film-num ${premium === null ? "wt-film-warn" : ""}`}
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
						className="wt-film-num wt-film-accent"
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
			{(
				[
					["sum", dollars(0), "wt-film-accent"],
					["sum-ge", t(copy.subtotalGe), "wt-film-warn"],
				] as const
			).map(([name, value, tone]) => (
				<text
					key={name}
					data-f={name}
					x={margin + room - 12}
					y={L.traceY + (narrow ? T.small * 2 + T.head * 1.2 : T.small)}
					textAnchor="end"
					className={`wt-film-num ${tone}`}
					style={{ fontSize: narrow ? T.head : T.num }}
				>
					{value}
				</text>
			))}
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
					["rerun-back", null],
				] as const
			).map(([name, removed]) => (
				<text
					key={name}
					data-f={name}
					x={margin}
					y={L.rerunY + rerunSize * 1.3}
					className={`wt-film-num ${removed ? "wt-film-loss" : "wt-film-gain"}`}
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
					className="wt-film-type wt-film-loss"
					style={{ fontSize: text }}
				>
					{t(why)}
				</text>
			))}

			{[
				["formula-base", dollars(MONDAY), margin],
				[
					"formula-divisor",
					"÷ 100",
					margin + textWidth(dollars(MONDAY), text) + 12,
				],
				[
					"formula-result",
					`= ${rerunText("formula")}`,
					margin + textWidth(`${dollars(MONDAY)} ÷ 100`, text) + 24,
				],
			].map(([name, value, x]) => (
				<text
					key={name}
					data-f={name}
					x={x}
					y={L.rerunY + rerunSize * 1.3 + text * 3.5}
					className="wt-film-num wt-film-loss"
					style={{ fontSize: text }}
				>
					{value}
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
						className="wt-film-num wt-film-loss"
						style={{ fontSize: extraSize }}
					>
						{value}
					</text>
					<text
						x={x + textWidth(value, extraSize) + 12}
						y={y}
						className="wt-film-tag wt-film-loss"
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
				className="wt-film-num wt-film-loss"
				style={{ fontSize: extraSize }}
			>{`= ${dollars(extra(cancelled) + extra(repeated))}`}</text>
			<path
				data-f="exclusions-link"
				d={`M ${margin + room} ${L.fieldY(3) + L.fieldH} H ${margin + room + 4} V ${repeatedY + extraSize} H ${extraTotalX + textWidth(`= ${dollars(extra(cancelled) + extra(repeated))}`, extraSize) / 2}`}
				fill="none"
				className="wt-film-link"
				style={{ stroke: "var(--diagram-loss)", strokeWidth: 1.5 }}
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
					className={`wt-film-num ${i === 1 ? "wt-film-gain" : "wt-film-loss"}`}
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
					<text
						x={margin + 16}
						y={L.recY(i) + L.recH * 0.28}
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(record.head).toUpperCase()}
					</text>
					<text
						data-f={`rec-${i}-n`}
						x={margin + 16}
						y={L.recY(i) + L.recH * 0.6}
						className="wt-film-num"
						style={{ fontSize: narrow ? T.head : T.head * 1.1 }}
					>
						{dollars(record.cents)}
					</text>
					<text
						data-f={`rec-${i}-note`}
						x={margin + 16}
						y={L.recY(i) + L.recH * 0.85}
						className="wt-film-type wt-film-dim"
						style={{ fontSize: T.small * 1.05 }}
					>
						{t(record.note)}
					</text>
					<text
						data-f={`rec-${i}-tag`}
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
							className="wt-film-type wt-film-loss"
							style={{ fontSize: spreadProofSize }}
						>
							{t(label)}
						</text>
						<text
							x={margin + room - 16}
							y={spreadProofY + i * spreadProofStep}
							textAnchor="end"
							className="wt-film-num wt-film-loss"
							style={{ fontSize: spreadProofSize }}
						>
							{dollars(cents)}
						</text>
					</g>
				))}
				<text
					x={margin + 16}
					y={spreadProofY + spreadProofStep * 2}
					className="wt-film-num wt-film-loss"
					style={{ fontSize: spreadProofSize }}
				>
					=
				</text>
				<text
					data-f="log-spread-total"
					x={margin + room - 16}
					y={spreadProofY + spreadProofStep * 2}
					textAnchor="end"
					className="wt-film-num wt-film-loss"
					style={{ fontSize: spreadProofSize }}
				>
					{dollars(spreadLegs)}
				</text>
			</g>

			{/* Complete equations replace the cards' figures until their results are saved. */}
			{(
				[
					[1, `${dollars(MONDAY)} + ${dollars(TUESDAY - MONDAY)} = `, TUESDAY],
					[2, `${dollars(TUESDAY)} − `, WITHOUT_SPREAD],
				] as const
			).map(([i, expression, result]) => {
				const suffix = i === 2 ? `${dollars(spreadLegs)} = ` : "";
				const equationSize = narrow
					? Math.min(
							T.head,
							((room - 32) * 0.98) /
								textWidth(expression + suffix + dollars(result), 1),
						)
					: T.body;
				const operandX = margin + 16 + textWidth(expression, equationSize);
				return (
					<g key={`log-equation-${i}`}>
						<text
							data-f={`log-${i}-expression`}
							x={margin + 16}
							y={L.recY(i) + L.recH * 0.6}
							className={`wt-film-num ${i === 1 ? "wt-film-gain" : "wt-film-loss"}`}
							style={{ fontSize: equationSize }}
						>
							{expression}
						</text>
						{i === 2 && (
							<>
								<text
									data-f="log-2-operand"
									x={operandX}
									y={L.recY(i) + L.recH * 0.6}
									className="wt-film-num wt-film-loss"
									style={{ fontSize: equationSize }}
								>
									{dollars(spreadLegs)}
								</text>
								<text
									data-f="log-2-equals"
									x={
										operandX +
										textWidth(`${dollars(spreadLegs)} `, equationSize)
									}
									y={L.recY(i) + L.recH * 0.6}
									className="wt-film-num wt-film-loss"
									style={{ fontSize: equationSize }}
								>
									=
								</text>
							</>
						)}
						<text
							data-f={`log-${i}-result`}
							x={margin + 16 + textWidth(expression + suffix, equationSize)}
							y={L.recY(i) + L.recH * 0.6}
							className="wt-film-num"
							style={{ fontSize: equationSize }}
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
	const missing = mondayPacket.findIndex((row) => row.trades === null);
	const fieldRows = fields.map((field) => one(`field-${field.id}`));
	const rerunMarks = ["rerun-none", "rerun-formula", "rerun-exclusions"].map(
		(name) => one(name),
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
		one("sum"),
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
		one("rec-2-note"),
		one("log-spread-proof"),
		one("log-2-operand"),
		one("log-2-equals"),
		...[1, 2].flatMap((i) => [
			one(`rec-${i}-n`),
			one(`rec-${i}-tag`),
			one(`log-${i}-expression`),
			one(`log-${i}-result`),
		]),
		one("p1-says"),
		one("why-formula"),
		one("why-exclusions"),
		lockRerun,
		...[
			"formula-base",
			"formula-divisor",
			"formula-result",
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
	tl.set(one(`row-${r2}-box`), { attr: { class: "wt-focus-shape" } }, 9.95);
	show(one("trace"), 9.95, "below", 0.25);
	// The trace comes to R2's figure, which lights with it.
	// Both body-sized terms and their settled result read together for 10.4–12.4.
	show(one("trace-result"), 10.2, "below", 0.2);
	tl.to(
		one(`row-${r2}-premium`),
		{ attr: { class: "wt-film-num wt-film-accent" }, duration: 0.2 },
		10.2,
	);
	tl.set(one(`row-${r2}-box`), { attr: { class: "wt-panel-shape" } }, 12.4);
	tl.to(
		one(`row-${r2}-premium`),
		{ attr: { class: "wt-film-num" }, duration: 0.2 },
		12.4,
	);
	// Kept premiums travel down the right lane. Neighboring premiums step back while
	// the copy passes; series labels and contract counts stay outside that lane.
	tl.set(one("sum"), { opacity: 1 }, 12.4);
	// The phone trace reaches the lane; step it back until every premium has landed.
	tl.set(one("trace"), { opacity: 0.2 }, 12.4);
	let total = 0;
	let step = 0;
	mondayPacket.forEach((row, i) => {
		const premium = rowPremium(row);
		// Covered zero stays in the table; only positive contributions need a flight.
		if (premium === null || premium === 0) return;
		const at = 12.4 + step * 0.8;
		const figure = one<SVGGraphicsElement>(`row-${i}-premium`);
		const neighbors = mondayPacket
			.map((_, j) => one(`row-${j}-premium`))
			.filter((_, j) => j !== i);
		tl.set(neighbors, { opacity: 0.2 }, at);
		tl.set(one(`row-${i}-premium`), { opacity: 1 }, at);
		tl.set(figure, { attr: { class: "wt-film-num wt-film-accent" } }, at);
		const ticket = one<SVGGraphicsElement>(`sum-ticket-${i}`);
		// Land above the subtotal, then fold the ticket shut before its count starts.
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
				duration: 0.12,
				ease: "power2.in",
			},
			at + 0.45,
		);
		tl.set(ticket, { opacity: 0 }, at + 0.57);
		d.count(
			one<SVGTextElement>("sum"),
			total + premium,
			at + 0.57,
			(v) => dollars(Math.round(v / 100) * 100),
			total,
			0.2,
		);
		tl.set(figure, { attr: { class: "wt-film-num" } }, at + 0.8);
		total += premium;
		step += 1;
	});
	tl.set(
		mondayPacket.map((_, i) => one(`row-${i}-premium`)),
		{ opacity: 1 },
		14.8,
	);
	tl.set(one("trace"), { opacity: 1 }, 14.8);
	// R5 has no data: the sum can only be a floor.
	tl.fromTo(
		rows[missing],
		{ x: 0 },
		{ x: 6, duration: 0.08, yoyo: true, repeat: 3 },
		14.8,
	);
	d.flip(one("sum"), one("sum-ge"), 15.0);
	tl.set(one("sum"), { opacity: 0 }, 15.3);
	show(one("subtotal"), 15.05);
	show(heads[1], 15.05);
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
	show(one("rerun-tag"), 19.55);
	word(rerunMarks[0], 19.75);
	// Without the formula: against P1's figure, and why.
	drop("formula", 20.75);
	d.flip(rerunMarks[0], rerunMarks[1], 20.95);
	tl.set(rerunMarks[0], { opacity: 0 }, 21.25);
	show(one("p1-says"), 21.05);
	show(one("why-formula"), 21.25);
	// The answer, with the first break.
	show(heads[3], 21.3);
	show(one("formula-base"), 21.45, "below", 0.2);
	show(one("formula-divisor"), 21.95, "below", 0.2);
	show(one("formula-result"), 22.45, "below", 0.2);
	// Keep the first break's proof separate from the exclusions' after-beat.
	hide(
		[one("formula-base"), one("formula-divisor"), one("formula-result")],
		24.6,
		0.15,
		0,
	);
	// Without the exclusions instead.
	// The fields change while the old figure is folded shut: inputs and output never disagree.
	restore("formula", 25);
	drop("exclusions", 25);
	d.flip(rerunMarks[1], rerunMarks[2], 24.75);
	tl.set(rerunMarks[1], { opacity: 0 }, 25.05);
	d.flip(one("why-formula"), one("why-exclusions"), 24.75);
	tl.set(one("why-formula"), { opacity: 0 }, 25.05);
	// Both contributions land before their field is connected to the breakdown.
	show(one("extra-cancelled"), 25.55, "below", 0.2);
	show(one("extra-repeated"), 26, "below", 0.2);
	d.trace(one<SVGPathElement>("exclusions-link"), 26.2, { duration: 0.35 });
	// Establish the completed delta before its confirmation; it still holds for 2.05 s.
	show(one("extra-total"), 27.6, "below", 0.2);
	// Round the rerun with its label, P1's figure and its reason: no arm runs through a line.
	d.lock(lockRerun, 27.95, {
		around: [
			one("rerun-tag"),
			rerunMarks[2],
			one("p1-says"),
			one("why-exclusions"),
		],
		pad: 10,
	});
	tl.addLabel("hero-lock", 27.95);
	// After the lock, once its reason has been read: the brackets let go, the field goes
	// back, and the figure is P1's again.
	hide(
		[
			one("why-exclusions"),
			one("extra-cancelled"),
			one("extra-repeated"),
			one("extra-total"),
			one("exclusions-link"),
		],
		29.85,
	);
	// Recover 0.75 s from the lock window and 0.10 s from its release: 2.00 s from
	// entry to exit, 1.55 s fully settled, and the same 30.20 s release completion.
	hide(lockRerun, 29.95, 0.25);
	// Switch the field only after the old value has folded shut, then cut the fields.
	tl.set(one("field-exclusions"), { opacity: 1 }, 30.15);
	// Fold the wrong value away, then reveal the restored value settled for its carry.
	tl.to(
		rerunMarks[2],
		{ scaleY: 0, transformOrigin: "50% 50%", duration: 0.3, ease: "power2.in" },
		29.85,
	);
	tl.set(one("rerun-back"), { opacity: 1 }, 30.15);
	tl.set(rerunMarks[2], { opacity: 0 }, 30.15);

	// ——— log: rerun, or a new question ———
	tl.addLabel("log", 29.95);
	d.swap([heads[2], heads[3]], heads[4], 29.95);
	hide([one("rerun-tag"), one("p1-says")], 29.95);
	hide(fieldRows, 30.15, 0.15, 0);
	// The rerun's match stays up, then becomes P1's record: the figure a reader got back is
	// the one the log keeps.
	// The lock window and release fund 0.4 s for this handoff and 0.45 s for the ending.
	// The restored match stays green for 30.15–30.55; the panel settles before flight.
	show(recs[0], 30.3, "right", 0.25);
	tl.set(one("rerun-back"), { attr: { class: "wt-film-num" } }, 30.55);
	d.carry(
		one<SVGGraphicsElement>("rerun-back"),
		one<SVGGraphicsElement>("rec-0-n"),
		30.55,
		{
			duration: 0.4,
		},
	);
	// The note stays out of the flight lane, then appears with the landed P1 figure.
	tl.set(one("rec-0-note"), { opacity: 1 }, 30.95);
	// Equations enter settled; earlier P1/P2 staging funds the longer spread proof.
	// Every saved result retains its own uninterrupted 1.5 s reading interval.
	const saveResult = (i: number, saveAt: number) => {
		const operands = [one(`log-${i}-expression`)];
		if (i === 2) operands.push(one("log-2-operand"), one("log-2-equals"));
		tl.set(operands, { opacity: 0.2 }, saveAt);
		d.carry(
			one<SVGGraphicsElement>(`log-${i}-result`),
			one<SVGGraphicsElement>(`rec-${i}-n`),
			saveAt,
			{ duration: 0.2, arc: "x" },
		);
		tl.set(operands, { opacity: 0 }, saveAt + 0.2);
		tl.set(one(`rec-${i}-tag`), { opacity: 1 }, saveAt + 0.2);
	};
	// P1 holds 30.95–32.45; P2 equation 32.45–33.95; saved P2 34.15–35.65.
	tl.set(
		[
			recs[1],
			one("log-r5-cause"),
			one("log-1-expression"),
			one("log-1-result"),
		],
		{ opacity: 1 },
		32.45,
	);
	saveResult(1, 33.95);
	show(heads[5], 35.65);
	// P3's note row first identifies the two spread portions, not the entire R2/R3 rows.
	tl.set(
		[recs[2], one("log-spread-cause"), one("log-spread-proof")],
		{ opacity: 1 },
		35.65,
	);
	// Focus changes only after P2's uninterrupted result hold, including its old cause.
	tl.to(
		[recs[0], recs[1], one("log-r5-cause")],
		{ opacity: 0.45, duration: 0.2 },
		35.65,
	);
	// The complete two-leg sum holds 35.65–37.65 (2 s). Its total stays inside P3, clear
	// of the header and border; neighboring text steps back before the short flight.
	tl.set([one("log-spread-r2"), one("log-spread-r3")], { opacity: 0.2 }, 37.65);
	d.carry(
		one<SVGGraphicsElement>("log-spread-total"),
		one<SVGGraphicsElement>("log-2-operand"),
		37.65,
		{ duration: 0.2, arc: "x" },
	);
	tl.set(one("log-spread-proof"), { opacity: 0 }, 37.85);
	// Reveal the subtraction only with its settled operand: no incomplete equality.
	tl.set(
		[one("log-2-expression"), one("log-2-equals"), one("log-2-result")],
		{ opacity: 1 },
		37.85,
	);
	saveResult(2, 39.85);
	tl.set(one("rec-2-note"), { opacity: 1 }, 40.05);

	// ——— claim ———
	tl.addLabel("claim", 41.55);
	hide(
		[heads[4], heads[5], ...recs, one("log-r5-cause"), one("log-spread-cause")],
		41.55,
	);
	word(one("z-big"), 41.85);
	show(one("z-sub"), 42.25);

	// ——— next ———
	tl.addLabel("next", 45.95);
	hide(kids("claim"), 45.95);
	// One compact entrance after the claim clears; the complete card holds 1 s.
	d.hidden(kids("end"));
	show(kids("end"), 46.3, "below", 0.2);
	tl.to({}, { duration: END - 46.5 }, 46.5);
	// Retain the kit's 4 s source / 2 s player title-card convention.
	tl.shiftChildren(-2, true, 3.99);
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
