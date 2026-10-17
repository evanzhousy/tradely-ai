import { type Copy, pick, signedUsd, usd } from "@/content/world";
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
	toneClass,
	Word,
} from "../walkthrough/film-kit";
import {
	BEARISH,
	BULLISH,
	CALL_100,
	CALL_CREDIT,
	CREDIT,
	callSpread,
	condor,
	LEGS,
	legPremium,
	legPrice,
	MAX_LOSS,
	PACKAGE_CREDIT,
	PACKAGE_RISK,
	PUT_100,
	PUT_CREDIT,
	putSpread,
	RANGE,
	SIZE,
	STRADDLE_COST,
	STRADDLE_HIGH,
	STRADDLE_LOW,
	straddle,
	WIDTH,
	worth,
} from "./multi-leg-structures-model";

/*
 * Straddles, condors and multi-leg prints, as a film. Four linked ALFA prints in one second, 200
 * each: sold 95 puts, bought 90 puts, sold 105 calls, bought 110 calls. Bullish or
 * bearish? First a straddle, a V that needs a move of $8.40 either way. The hero is an
 * iron condor: two credit spreads that together keep $2.17 inside $95–$105 and risk $2.83
 * outside, and glowing brackets lock on what it keeps: it sells a range. Then the four
 * prints: labelled one by one they net −$1,400, "slightly bearish"; read as one package
 * they are 200 short iron condors.
 *
 *   open      0–4        "Straddles and condors"
 *   question  4–8.6      four prints in one second: bullish or bearish?
 *   straddle  8.6–18.2   call and put; a V at $100; break-even $91.60 and $108.40
 *   condor    18.2–30    hero: put spread and call spread; together; it sells a range
 *   package   30–40.4    four labels; directional tally; cash groups; one package
 *   claim     40.4–44.7  linked prints, one trade
 *   next      44.7–46.3  Next: checking one trade
 */

const END = 46.3;
const CENTS = (perShare: number) => Math.round(perShare * 100);
/** Dollars a share as whole dollars a contract: "+$375", "−$283". */
const perContract = (perShare: number) => signedUsd(CENTS(perShare) * 100, 0);
const share = (dollars: number) => usd(CENTS(dollars));
const NET_LABELS = BULLISH - BEARISH;
// Model curves use a 100-share contract; WIDTH is dollars per share.
const WING_PAYOUT = CENTS(WIDTH) * 100;
const SOLD_ROWS = LEGS.filter((leg) => leg.side === "sell");
const BOUGHT_ROWS = LEGS.filter((leg) => leg.side === "buy");
const SOLD_PREMIUM = SOLD_ROWS.reduce((sum, leg) => sum + legPremium(leg), 0);
const BOUGHT_PREMIUM = BOUGHT_ROWS.reduce(
	(sum, leg) => sum + legPremium(leg),
	0,
);
/** Each chart's own vertical range, in dollars a contract, and its ticks. */
const S_Y = [-1500, 2100] as const;
const C_Y = [-450, 400] as const;
const S_TICKS = [-1000, 0, 1000, 2000];
const C_TICKS = [-400, -200, 0, 200];

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const left = margin + (narrow ? 36 : 56);
	const right = margin + room;
	const top = H * (narrow ? 0.3 : 0.28);
	const bottom = H * 0.84;
	const cardY = H * (narrow ? 0.63 : 0.64);
	const cardH = H * (narrow ? 0.32 : 0.28);
	const compactCard = !narrow && width < 700;
	return {
		...frame,
		left,
		right,
		top,
		bottom,
		x: (spot: number) =>
			left + ((spot - RANGE[0]) / (RANGE[1] - RANGE[0])) * (right - left),
		y: (range: readonly [number, number], dollars: number) =>
			bottom - ((dollars - range[0]) / (range[1] - range[0])) * (bottom - top),
		rowY: (i: number) =>
			H * (narrow ? 0.26 : 0.27) + i * H * (narrow ? 0.085 : 0.09),
		rowH: H * (narrow ? 0.07 : 0.075),
		tallyY: H * (narrow ? 0.67 : 0.68),
		cardY,
		cardH,
		compactCard,
		saleSumY: cardY + cardH * (compactCard ? 0.26 : narrow ? 0.32 : 0.34),
		purchaseSumY: cardY + cardH * (narrow ? 0.48 : compactCard ? 0.26 : 0.34),
		netY: cardY + cardH * (compactCard ? 0.45 : narrow ? 0.64 : 0.56),
		resultY: cardY + cardH * (compactCard ? 0.72 : narrow ? 0.8 : 0.77),
		rangeY: cardY + cardH * (compactCard ? 0.93 : 0.94),
	};
}

const legCopy: Record<string, Copy> = {
	a: ["sold 200 · 95 put", "卖出 200 · 95 看跌"],
	b: ["bought 200 · 90 put", "买入 200 · 90 看跌"],
	c: ["sold 200 · 105 call", "卖出 200 · 105 看涨"],
	d: ["bought 200 · 110 call", "买入 200 · 110 看涨"],
};

const legShortCopy: Record<string, Copy> = {
	a: ["sold 95P", "卖95看跌"],
	b: ["bought 90P", "买90看跌"],
	c: ["sold 105C", "卖105看涨"],
	d: ["bought 110C", "买110看涨"],
};

const copy = {
	title: ["Straddles and condors", "跨式与铁鹰"],
	titleSub: ["linked legs, printed in one second", "关联腿在同一秒分别成交"],
	qTag: [
		`ALFA · linked legs · ${SIZE} each`,
		`ALFA · 关联腿 · 每腿 ${SIZE} 张`,
	],
	qLegs: [
		"sold/bought: 95/90 puts · 105/110 calls",
		"卖出/买入：95/90 看跌 · 105/110 看涨",
	],
	qBig: ["Bullish or bearish?", "看涨还是看跌？"],
	sHead: ["A long straddle needs a big move.", "买入跨式需大幅变动。"],
	cHead: ["An iron condor: two credit spreads.", "铁鹰：两个收入价差。"],
	c2Head: ["It sells a range.", "它卖出的是一个区间。"],
	callLeg: ["100 call", "100 看涨"],
	putLeg: ["100 put", "100 看跌"],
	putSpread: [
		`put credit ${usd(CENTS(PUT_CREDIT) * 100, 0)}`,
		`看跌收入 ${usd(CENTS(PUT_CREDIT) * 100, 0)}`,
	],
	callSpread: [
		`call credit ${usd(CENTS(CALL_CREDIT) * 100, 0)}`,
		`看涨收入 ${usd(CENTS(CALL_CREDIT) * 100, 0)}`,
	],
	valueAxis: ["Oct 18 value · 100 shares/leg", "10月18日价值 · 每腿100股"],
	straddleAxis: ["Oct 18 profit · per straddle", "10月18日盈亏 · 每组跨式"],
	condorAxis: ["Oct 18 profit · per condor", "10月18日盈亏 · 每组铁鹰"],
	paid: [
		`${perContract(-STRADDLE_COST)} paid`,
		`支付 ${perContract(-STRADDLE_COST)}`,
	],
	pHead: ["Label the four prints one by one.", "四笔成交逐笔贴标签。"],
	p2Head: [
		`As one package: ${SIZE} short condors.`,
		`作为整体：${SIZE} 组铁鹰空头。`,
	],
	bullish: ["bullish", "看涨"],
	bearish: ["bearish", "看跌"],
	cashSales: ["sold", "卖出"],
	cashPurchases: ["bought", "买入"],
	tally: [
		`bullish ${usd(BULLISH, 0)} · bearish ${usd(BEARISH, 0)} · net ${signedUsd(NET_LABELS, 0)}`,
		`看涨 ${usd(BULLISH, 0)} · 看跌 ${usd(BEARISH, 0)} · 净额 ${signedUsd(NET_LABELS, 0)}`,
	],
	tallyShort: [
		`net ${signedUsd(NET_LABELS, 0)}: "slightly bearish"`,
		`净额 ${signedUsd(NET_LABELS, 0)}：“略偏看跌”`,
	],
	pkgCredit: [
		`${signedUsd(PACKAGE_CREDIT, 0)} collected`,
		`收入 ${signedUsd(PACKAGE_CREDIT, 0)}`,
	],
	pkgRange: [
		`Oct 18: $95–$105 · ${usd(PACKAGE_RISK, 0)} at risk`,
		`10月18日 $95–$105 · 风险 ${usd(PACKAGE_RISK, 0)}`,
	],
	claimBig: ["Linked prints, one trade.", "关联成交，一笔交易。"],
	claimSub: [
		"Same-second timing alone cannot prove linkage.",
		"仅凭同秒成交不能证明关联。",
	],
	nextBig: ["Next: checking one trade", "下一课：核查一笔成交"],
	nextSub: ["facts, inferences and unknowns", "事实、推断与未知"],
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
	const cashEquals = narrow && locale === "en" ? "=" : " = ";
	const KNOTS = [RANGE[0], 90, 95, 100, 105, 110, RANGE[1]];
	const path = (range: readonly [number, number], f: (s: number) => number) =>
		KNOTS.map(
			(s, i) =>
				`${i ? "L" : "M"}${L.x(s).toFixed(1)} ${L.y(range, f(s) * 100).toFixed(1)}`,
		).join("");
	const axes = (
		name: string,
		range: readonly [number, number],
		ticks: number[],
	) => (
		<g data-f={name}>
			{ticks.map((v) => (
				<g key={v}>
					<path
						d={`M${L.left} ${L.y(range, v)}H${L.right}`}
						className={v === 0 ? "wt-axis" : "wt-grid"}
					/>
					<text
						x={L.left - 8}
						y={L.y(range, v) + 4}
						textAnchor="end"
						className="wt-small"
					>
						{v === 0
							? "$0"
							: Math.abs(v) >= 1000
								? `${v < 0 ? "−" : "+"}${Math.abs(v) / 1000}k`
								: signedUsd(v * 100, 0)}
					</text>
				</g>
			))}
			{[80, 90, 100, 110, 120].map((v) => (
				<text
					key={v}
					x={L.x(v)}
					y={L.bottom + 16}
					textAnchor={
						v === RANGE[1] ? "end" : v === RANGE[0] ? "start" : "middle"
					}
					className="wt-small"
				>
					{`$${v}`}
				</text>
			))}
		</g>
	);
	const label = (
		name: string,
		x: number,
		y: number,
		value: string,
		className: string,
		anchor: "start" | "middle" | "end" = "middle",
	) => (
		<text
			data-f={name}
			x={x}
			y={y}
			textAnchor={anchor}
			className={`wt-film-num wt-halo ${className}`}
			style={{ fontSize: T.small * 1.15 }}
		>
			{value}
		</text>
	);
	/** A break-even: a dashed riser across the chart, starting under its price at the top. */
	const even = (name: string, spot: number) => (
		<g data-f={name}>
			<path
				d={`M${L.x(spot)} ${L.top + 22}V${L.bottom}`}
				className="wt-bracket"
				strokeDasharray="4 3"
			/>
			<text
				x={L.x(spot)}
				y={L.top + 14}
				textAnchor="middle"
				className="wt-film-num wt-halo wt-film-accent"
				style={{ fontSize: T.small * 1.1 }}
			>
				{share(spot)}
			</text>
		</g>
	);
	const callPay = (s: number) => worth(CALL_100, s);
	const putPay = (s: number) => worth(PUT_100, s);
	const profit = (s: number) => straddle(s) - STRADDLE_COST;
	return (
		<>
			<Backdrop frame={L} />

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
					name="q-line"
					text={t(copy.qLegs)}
					x={W / 2}
					y={H * 0.42}
					size={narrow ? T.body : T.head}
					maxWidth={narrow ? room * 0.8 : room}
					className="wt-film-type wt-film-accent"
				/>
				<Lines
					name="q-big"
					text={t(copy.qBig)}
					x={W / 2}
					y={H * 0.66}
					size={T.title}
					maxWidth={room}
				/>
			</g>

			{headline("s-head", copy.sHead)}
			{headline("c-head", copy.cHead)}
			{/* The hero's answer, as the brackets lock on what the condor keeps. */}
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
			<g data-f="depth">
				<g data-f="world">
					{/* The straddle, on its own scale. */}
					{axes("axes-s", S_Y, S_TICKS)}
					<text
						data-f="s-value-caption"
						x={L.left}
						y={L.top - 25}
						className="wt-small"
					>
						{t(copy.valueAxis)}
					</text>
					<text
						data-f="s-profit-caption"
						x={L.left}
						y={L.top - 25}
						className="wt-small"
					>
						{t(copy.straddleAxis)}
					</text>
					<path
						data-f="s-call"
						d={path(S_Y, callPay)}
						className="wt-line-call"
					/>
					<path data-f="s-put" d={path(S_Y, putPay)} className="wt-line-put" />
					<path
						data-f="s-profit"
						d={path(S_Y, profit)}
						className="wt-line-position"
					/>
					{label(
						"s-call-tag",
						L.x(116) - 6,
						L.y(S_Y, callPay(116) * 100) - 10,
						t(copy.callLeg),
						toneClass.call,
						"end",
					)}
					{label(
						"s-put-tag",
						L.x(84) + 6,
						L.y(S_Y, putPay(84) * 100) - 10,
						t(copy.putLeg),
						toneClass.put,
						"start",
					)}
					{label(
						"s-cost",
						L.x(100),
						L.y(S_Y, profit(100) * 100) + 22,
						t(copy.paid),
						"wt-film-loss",
					)}
					<path
						data-f="s-deduct"
						d={`M${L.x(100)} ${L.y(S_Y, 0)}V${L.y(S_Y, -STRADDLE_COST * 100)}m-4 -6 4 6 4 -6`}
						className="wt-line-position"
						style={{ stroke: "var(--diagram-loss)" }}
					/>
					{even("s-low", STRADDLE_LOW)}
					{even("s-high", STRADDLE_HIGH)}

					{/* The condor, on a closer scale. */}
					{axes("axes-c", C_Y, C_TICKS)}
					<text
						data-f="c-caption"
						x={L.left}
						y={L.top - 25}
						className="wt-small"
					>
						{t(copy.condorAxis)}
					</text>
					<path
						data-f="c-put"
						d={path(C_Y, putSpread)}
						className="wt-line-put"
					/>
					<path
						data-f="c-call"
						d={path(C_Y, callSpread)}
						className="wt-line-call"
					/>
					<path
						data-f="c-sum"
						d={path(C_Y, condor)}
						className="wt-line-position"
					/>
					<text
						data-f="c-put-tag"
						x={L.right - 6}
						y={L.y(C_Y, PUT_CREDIT * 100) - 16}
						textAnchor="end"
						className={`wt-film-type wt-halo ${toneClass.put}`}
						style={{ fontSize: T.small * 1.15 }}
					>
						{t(copy.putSpread)}
					</text>
					<text
						data-f="c-call-tag"
						x={L.left + 6}
						y={L.y(C_Y, CALL_CREDIT * 100) - 16}
						textAnchor="start"
						className={`wt-film-type wt-halo ${toneClass.call}`}
						style={{ fontSize: T.small * 1.15 }}
					>
						{t(copy.callSpread)}
					</text>
					<g data-f="c-range">
						<rect
							x={L.x(95)}
							y={L.y(C_Y, CREDIT * 100)}
							width={L.x(105) - L.x(95)}
							height={L.y(C_Y, 0) - L.y(C_Y, CREDIT * 100)}
							className="wt-film-gain"
							fill="currentColor"
							opacity={0.12}
						/>
						<text
							x={L.x(100)}
							y={(L.y(C_Y, CREDIT * 100) + L.y(C_Y, 0)) / 2 + T.small * 0.35}
							textAnchor="middle"
							className="wt-film-num"
							style={{ fontSize: T.small }}
						>
							$95–$105
						</text>
					</g>
					<path
						data-f="c-plateau"
						d={`M${L.x(95)} ${L.y(C_Y, CREDIT * 100)}H${L.x(105)}`}
						className="wt-line-position"
						style={{ strokeWidth: 5, stroke: "var(--diagram-gain)" }}
					/>
					<text
						data-f="c-keep"
						x={L.x(100)}
						y={L.y(C_Y, CREDIT * 100) - 32}
						textAnchor="middle"
						className="wt-film-num wt-halo wt-film-gain"
						style={{ fontSize: T.num * 1.4 }}
					>
						{perContract(CREDIT)}
					</text>
					<g data-f="c-risk">
						<text
							x={L.left + 6}
							y={L.y(C_Y, -MAX_LOSS * 100) + 22}
							className="wt-film-num wt-halo"
							style={{ fontSize: T.small * 1.15 }}
						>
							{`${pick(["wing", "翼宽"], locale)} ${usd(CENTS(WIDTH), 0)} × ${pick(["100 shares", "100股"], locale)} = ${usd(WING_PAYOUT, 0)}`}
						</text>
						<text
							x={L.left + 6}
							y={L.y(C_Y, -MAX_LOSS * 100) + 22 + T.small * 1.5}
							className="wt-film-num wt-halo"
							style={{ fontSize: T.small * 1.15 }}
						>
							<tspan className="wt-film-gain">{perContract(CREDIT)}</tspan>
							<tspan>{` − ${usd(WING_PAYOUT, 0)} = `}</tspan>
							<tspan className="wt-film-loss">{perContract(-MAX_LOSS)}</tspan>
						</text>
					</g>
					<Brackets name="lock-keep" glow />
				</g>
			</g>

			{/* Four prints, one package. */}
			{headline("p-head", copy.pHead)}
			{/* The answer, as the four rows become one package. */}
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
			{LEGS.map((leg, i) => (
				<g key={leg.key} data-f={`leg-${i}`}>
					<rect
						x={margin}
						y={L.rowY(i)}
						width={room}
						height={L.rowH}
						rx={10}
						className="wt-panel-shape"
					/>
					<text
						x={margin + 14}
						y={L.rowY(i) + L.rowH / 2 + text * 0.36}
						className="wt-film-num"
						style={{ fontSize: text }}
					>
						{`${t((narrow ? legShortCopy : legCopy)[leg.key])} @ ${usd(legPrice(leg))}`}
					</text>
					<text
						x={margin + room - (narrow ? 14 : room * 0.2)}
						y={L.rowY(i) + L.rowH / 2 + text * 0.36}
						textAnchor="end"
						className="wt-film-type"
						style={{ fontSize: text }}
					>
						<tspan data-f={`leg-direction-${i}`}>{t(copy[leg.label])}</tspan>
						{narrow ? (
							<tspan data-f={`leg-cash-${i}`} className="wt-film-type">
								{` ${usd(legPremium(leg), 0)}`}
							</tspan>
						) : null}
					</text>
					{narrow ? null : (
						<text
							data-f={`leg-cash-${i}`}
							x={margin + room - 14}
							y={L.rowY(i) + L.rowH / 2 + text * 0.36}
							textAnchor="end"
							className="wt-film-num wt-film-dim"
							style={{ fontSize: text }}
						>
							{usd(legPremium(leg), 0)}
						</text>
					)}
				</g>
			))}
			<Lines
				name="tally"
				text={t(narrow ? copy.tallyShort : copy.tally)}
				x={margin}
				y={L.tallyY}
				size={narrow ? T.body : T.body * 1.2}
				maxWidth={room}
				anchor="start"
				className="wt-film-type wt-film-warn"
			/>
			<g data-f="pkg">
				<rect
					x={margin}
					y={L.cardY}
					width={room}
					height={L.cardH}
					rx={14}
					className="wt-focus-shape"
				/>
				<text
					data-f="pkg-result"
					x={margin + 16}
					y={L.resultY}
					className="wt-film-num wt-film-gain"
					style={{ fontSize: narrow ? T.head : T.body * 1.25 }}
				>
					{t(copy.pkgCredit)}
				</text>
				<text
					x={margin + 16}
					y={L.rangeY}
					className="wt-film-type wt-film-dim"
					style={{ fontSize: T.small * 1.1 }}
				>
					{t(copy.pkgRange)}
				</text>
			</g>

			<g data-f="cash-additions">
				<text
					x={margin + 16}
					y={L.saleSumY}
					className="wt-film-num"
					style={{ fontSize: T.body }}
				>
					<tspan
						className="wt-film-tag"
						dy={L.compactCard ? -T.small * 1.25 : 0}
						style={{ fontSize: T.small, letterSpacing: narrow ? 0 : undefined }}
					>
						{`${t(copy.cashSales)} `}
					</tspan>
					<tspan
						x={L.compactCard ? margin + 16 : undefined}
						dy={L.compactCard ? T.small * 1.25 : 0}
					>
						{`${SOLD_ROWS.map((leg) => usd(legPremium(leg), 0)).join(" + ")}${cashEquals}${usd(SOLD_PREMIUM, 0)}`}
					</tspan>
				</text>
				<text
					x={narrow ? margin + 16 : margin + room / 2 + 8}
					y={L.purchaseSumY}
					className="wt-film-num"
					style={{ fontSize: T.body }}
				>
					<tspan
						className="wt-film-tag"
						dy={L.compactCard ? -T.small * 1.25 : 0}
						style={{ fontSize: T.small, letterSpacing: narrow ? 0 : undefined }}
					>
						{`${t(copy.cashPurchases)} `}
					</tspan>
					<tspan
						x={L.compactCard ? margin + room / 2 + 8 : undefined}
						dy={L.compactCard ? T.small * 1.25 : 0}
					>
						{`${BOUGHT_ROWS.map((leg) => usd(legPremium(leg), 0)).join(" + ")}${cashEquals}${usd(BOUGHT_PREMIUM, 0)}`}
					</tspan>
				</text>
			</g>
			<text
				data-f="pkg-equation"
				x={margin + 16}
				y={L.netY}
				className="wt-film-num"
				style={{ fontSize: T.body }}
			>
				<tspan>{`${pick(["sold", "卖出"], locale)} ${usd(SOLD_PREMIUM, 0)}`}</tspan>
				<tspan>{" − "}</tspan>
				<tspan>{`${pick(["bought", "买入"], locale)} ${usd(BOUGHT_PREMIUM, 0)}`}</tspan>
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
	/** A line lands slightly large and settles, without overshoot. */
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const draw = (path: SVGPathElement, time: number) =>
		d.trace(path, time, { duration: 0.7, ease: "power2.out" });
	const fadeIn = (target: Element | Element[], at: number, duration = 0.5) =>
		tl.fromTo(target, { opacity: 0 }, { opacity: 1, duration }, at);
	const p = (name: string) => one<SVGPathElement>(name);
	const heads = {
		straddle: one("s-head"),
		condor: one("c-head"),
		condorAnswer: one("c2-head"),
		package: one("p-head"),
		packageAnswer: one("p2-head"),
	};
	const legs = LEGS.map((_, i) => one(`leg-${i}`));
	const lockKeep = one<SVGGraphicsElement>("lock-keep");
	// Keep the wrapped copy and positions; only the signed net takes its loss tone.
	for (const line of one("tally").querySelectorAll("tspan")) {
		const text = line.textContent ?? "";
		const net = signedUsd(NET_LABELS, 0);
		const at = text.indexOf(net);
		if (at < 0) continue;
		const amount = line.ownerDocument.createElementNS(
			"http://www.w3.org/2000/svg",
			"tspan",
		);
		amount.setAttribute("class", toneClass.down);
		amount.textContent = net;
		line.replaceChildren(
			text.slice(0, at),
			amount,
			text.slice(at + net.length),
		);
	}

	d.hidden([
		...flat("q"),
		...Object.values(heads),
		...kids("world"),
		...legs,
		one("tally"),
		one("pkg"),
		one("cash-additions"),
		one("pkg-equation"),
		one("pkg-result"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: four prints ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	show(one("q-line"), 4.8);
	word(one("q-big"), 5.1);

	// ——— straddle: a V that needs a move ———
	tl.addLabel("straddle", 8.6);
	// Whole-beat cut: the settled scaffold stands 1 s before the first trace.
	tl.set(flat("q"), { opacity: 0 }, 8.6);
	tl.set(one("depth"), { opacity: 1, scale: 1 }, 8.6);
	tl.set(
		[heads.straddle, one("axes-s"), one("s-value-caption")],
		{ opacity: 1, x: 0, y: 0 },
		8.6,
	);
	draw(p("s-call"), 9.6);
	show(one("s-call-tag"), 9.6);
	draw(p("s-put"), 10.4);
	show(one("s-put-tag"), 10.4);
	// The component value V settles at 11.1; deduction begins after 1 s of quiet.
	fadeIn(one("s-cost"), 12.1);
	d.trace(p("s-deduct"), 12.1, { duration: 0.5, ease: "power2.out" });
	// The premium deduction settles at 12.6, then stands for a full second.
	hide(one("s-value-caption"), 12.1, 0.3, 0);
	fadeIn(one("s-profit-caption"), 13.6, 0.3);
	tl.to([p("s-call"), p("s-put")], { opacity: 0.2, duration: 0.4 }, 13.6);
	hide([one("s-call-tag"), one("s-put-tag")], 13.6, 0.3);
	draw(p("s-profit"), 13.6);
	// Profit settles at 14.3, then earns 1 s before its break-even guides.
	fadeIn([one("s-low"), one("s-high")], 15.3);

	// ——— condor: the hero. Two credit spreads that sell a range. ———
	tl.addLabel("condor", 18.2);
	// Cut the whole chart and headline together, then keep the new scale still 1 s.
	tl.set(
		[
			heads.straddle,
			one("axes-s"),
			one("s-profit-caption"),
			p("s-call"),
			p("s-put"),
			p("s-profit"),
			p("s-deduct"),
			one("s-cost"),
			one("s-low"),
			one("s-high"),
		],
		{ opacity: 0 },
		18.2,
	);
	tl.set(
		[heads.condor, one("axes-c"), one("c-caption")],
		{ opacity: 1, x: 0, y: 0 },
		18.2,
	);
	draw(p("c-put"), 19.2);
	fadeIn(one("c-put-tag"), 19.4);
	draw(p("c-call"), 20.9);
	fadeIn(one("c-call-tag"), 20.9);
	// Put settles at 19.9, call at 21.6: each gets 1 s before the next proof.
	tl.to([p("c-put"), p("c-call")], { opacity: 0.2, duration: 0.4 }, 22.6);
	hide(one("c-put-tag"), 22.6, 0.3);
	// Retain the call label's prior 2 s hold while the combined curve finishes.
	hide(one("c-call-tag"), 22.9, 0.3);
	draw(p("c-sum"), 22.6);
	// One result construction: emphasize the plateau, credit and bounded loss.
	fadeIn([one("c-range"), one("c-keep"), one("c-risk")], 24.3);
	draw(p("c-plateau"), 24.3);
	// Range settles at 25.0, then stands 1.4 s before the unchanged hero lock.
	d.lock(lockKeep, 26.4, { around: one("c-keep"), pad: 6 });
	tl.addLabel("hero-lock", 26.4);
	show(heads.condorAnswer, 26.4);

	// ——— package: four labels, one trade ———
	tl.addLabel("package", 30);
	d.swap([heads.condor, heads.condorAnswer], heads.package, 30.0);
	d.sink(30.0);
	legs.forEach((leg, i) => {
		show(leg, 30.5 + i * 0.25, "right");
	});
	show(one("tally"), 31.5);
	hide(one("tally"), 35.0, 0.3);
	// Preserve the tally's 1.6 s rest, then bring the cash amounts into focus.
	tl.to(
		LEGS.map((_, i) => one(`leg-direction-${i}`)),
		{ opacity: 0.25, duration: 0.4 },
		33.6,
	);
	LEGS.forEach((_, i) => {
		// Timeline-owned classes restore the dim desktop amounts on a backward seek.
		tl.set(
			one(`leg-cash-${i}`),
			{
				attr: {
					class: L.narrow ? "wt-film-type" : "wt-film-num",
				},
			},
			33.6,
		);
	});
	// Cash emphasis settles at 34.0; the named row additions reveal settled at 35.1.
	fadeIn(one("cash-additions"), 35.1);
	// Cash arithmetic settles at 35.6; preserve its existing 1.3 s quiet interval.
	tl.to(legs, { opacity: 0.45, duration: 0.4 }, 36.9);
	fadeIn(one("pkg"), 36.9);
	fadeIn(one("pkg-equation"), 36.9);
	fadeIn(one("pkg-result"), 36.9);
	show(heads.packageAnswer, 36.9);

	// ——— claim ———
	// Package settles at 37.4 and rests 3 s; its answer keeps a 3.5 s hold.
	tl.addLabel("claim", 40.4);
	hide(
		[
			heads.package,
			heads.packageAnswer,
			...legs,
			one("pkg"),
			one("cash-additions"),
			one("pkg-equation"),
		],
		40.4,
	);
	word(one("z-big"), 40.7);
	show(one("z-sub"), 41.1);

	// ——— next ———
	// The claim holds 4 s; the end card keeps the 1.6 s minimum the hero share leaves.
	tl.addLabel("next", 44.7);
	hide(kids("claim"), 44.7);
	d.close(44.7);
	return tl;
}

export const multiLegStructuresFilm: Film = {
	id: "multi-leg-structures",
	label: [
		`Straddles, condors and multi-leg prints, as a short film: a long Oct 18 100 straddle bought for ${share(STRADDLE_COST)}, a V with break-evens at ${share(STRADDLE_LOW)} and ${share(STRADDLE_HIGH)}; an iron condor sold for ${share(CREDIT)} as a 95/90 put spread and a 105/110 call spread, keeping ${perContract(CREDIT)} between $95 and $105 and risking ${perContract(-MAX_LOSS)}; and four linked prints in one second, ${SIZE} contracts each, that net ${signedUsd(NET_LABELS, 0)} when labelled leg by leg but are ${SIZE} short iron condors read as one package, ${signedUsd(PACKAGE_CREDIT, 0)} collected`,
		`跨式、铁鹰与多腿成交短片：以 ${share(STRADDLE_COST)} 买入 10月18日 100 跨式，一个 V 字，盈亏平衡在 ${share(STRADDLE_LOW)} 和 ${share(STRADDLE_HIGH)}；以 ${share(CREDIT)} 卖出的铁鹰，由 95/90 看跌价差和 105/110 看涨价差组成，$95 到 $105 之间保留 ${perContract(CREDIT)}，风险 ${perContract(-MAX_LOSS)}；以及同一秒的四笔关联成交，每笔 ${SIZE} 张：逐腿贴标签净额 ${signedUsd(NET_LABELS, 0)}，作为整体来读则是 ${SIZE} 组铁鹰空头，收入 ${signedUsd(PACKAGE_CREDIT, 0)}`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Straddles and condors", "跨式与铁鹰"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "straddle", label: ["A straddle", "跨式"] },
		{ id: "condor", label: ["An iron condor", "铁鹰"] },
		{ id: "package", label: ["One package", "一个整体"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
