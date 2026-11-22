import { gsap } from "gsap";
import { useId } from "react";
import {
	type Copy,
	pick,
	signedUsd,
	usd,
	valueAtExpiry,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import type { Film, FilmContext } from "../walkthrough/film";
import {
	Backdrop,
	Brackets,
	clamp,
	createDirector,
	EndCard,
	filmFrame,
	Lines,
	lineCount,
	PenTip,
	TitleCard,
	toneClass,
	toneColor,
	Word,
} from "../walkthrough/film-kit";
import {
	CALL_COST,
	call100,
	positionPayoff,
	put100,
	putCost,
	shares,
	viewCost,
} from "./what-options-are-model";

/*
 * Options, as a film. It opens on an Oct 18 100 call bought for $420 and asks what it is
 * worth if ALFA ends at $95. The $420 lands on the chart as the premium line. The right to
 * buy at $100 is worthless at $95 and worth $1,000 at $110, the meter reading from the
 * marker itself; a put is the opposite right, $1,000 at $90. Then two uses next to owning
 * the shares. The hero is the first: as ALFA falls to $80 the shares lose $2,000 while the
 * shares with a 95 put stop at the −$715 floor, the difference filling in focus. Then a
 * purchased 105 call bought for $215 is the only extra example: its maximum loss is $215.
 * Last, the other side: at $110 you are up $580 and Ben, who wrote the call, is down $580.
 *
 * Drawn with less to read, by the owner's decision of 2026-11-21 (runbook, section 9). The
 * charts carry no axis numbers: each says what it measures, the prices a marker is tried at
 * stand under the axis as ticks, and the strike and the premium keep their labels. The
 * question card states the contract once, as 100 squares at $4.20 each. The call's value is a bar under the marker, split by the
 * premium line, so the net gain is the part above it. The contract's 100 shares sit with the
 * value they multiply, and the 100 shares Ben must deliver are drawn and cross from him to you.
 *
 *   open      0–4        "Options"
 *   question  4–8.6      $420 for the Oct 18 100 call; ALFA ends at $95?
 *   right     8.6–21.6   the call: $0 at $95, $1,000 at $110; the put at $90
 *   uses      21.6–36.0  hero: shares, then with a 95 put as ALFA falls, the floor at −$715;
 *                        a purchased 105 call, costing $215
 *   sides     36.0–41.1  you +$580, Ben −$580
 *   claim     41.1–45.5  a right for you, an obligation for someone else
 *   next      45.5–47.5  Next: trading an option
 */

const END = 47.5;
const X = [80, 120] as const;
const VALUE_TOP = 2_100;
const USE_Y = [-2_000, 2_000] as const;
const spots = Array.from({ length: X[1] - X[0] + 1 }, (_, i) => X[0] + i);
/** Dollars for one contract, 100 shares, at expiry. */
const callValue = (spot: number) => valueAtExpiry(call100, spot * 100);
const putValue = (spot: number) => valueAtExpiry(put100, spot * 100);
const PREMIUM = CALL_COST;
const LOW = 95;
const HIGH = 110;
const PUT_AT = 90;
const NET_HIGH = callValue(HIGH) - PREMIUM;
/** Where the 95 put starts to pay for itself: below it, the shares with the put lose less. */
const SAVES_BELOW = 95 - putCost / 100;
const FALL_TO = 80;
/** The shares Ben must deliver, drawn as squares: this many to a row. */
const LOT_COLUMNS = 10;
const LOT = 100;
/**
 * Rough rendered width of the films' sans at a size, to centre a row on its text. The kit's
 * `textWidth` is the mono measure, a quarter wider for a Latin sentence.
 */
const sansWidth = (text: string, size: number) => {
	let em = 0;
	for (const char of text)
		em +=
			(char.codePointAt(0) ?? 0) > 0x2e80
				? 1
				: /[\d$×]/.test(char)
					? 0.6
					: /[ :.,]/.test(char)
						? 0.27
						: 0.5;
	return em * size;
};

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, type: T } = frame;
	const left = Math.max(margin, narrow ? 46 : 0);
	const right = width * 0.965;
	/** The meter sits under the headline (two lines of it, at most), the chart under it. */
	const meterY = frame.headY + T.head * 2.6;
	const meterNum = meterY + T.head * 1.3;
	const top = narrow
		? H * 0.44
		: Math.max(H * 0.3, meterNum + T.small * 2.2 + 16);
	const bottom = H * 0.84;
	const x = (spot: number) =>
		left + ((spot - X[0]) / (X[1] - X[0])) * (right - left);
	const y = (dollars: number) =>
		bottom - (dollars / VALUE_TOP) * (bottom - top);
	const u = (dollars: number) =>
		bottom - ((dollars - USE_Y[0]) / (USE_Y[1] - USE_Y[0])) * (bottom - top);
	const path = (f: (spot: number) => number, scale: (v: number) => number) =>
		spots
			.map(
				(spot, i) =>
					`${i ? "L" : "M"}${x(spot).toFixed(1)} ${scale(f(spot)).toFixed(1)}`,
			)
			.join("");
	// The two results, and the block of 100 shares midway between them and the line under
	// them. Its squares shrink on a short stage so that it fits there.
	const sideNum = H * 0.4 + T.big * 0.95;
	const lotCell = clamp(3, H * 0.0098, 5);
	const lotY =
		(sideNum +
			T.big * 0.1 +
			(H * 0.78 - T.body) -
			(LOT / LOT_COLUMNS) * lotCell) /
		2;
	return {
		...frame,
		left,
		right,
		top,
		bottom,
		x,
		y,
		u,
		path,
		meterY,
		meterNum,
		meterCol: narrow ? 160 : 220,
		/** A price is named under the axis, where the marker stands. */
		spotY: bottom + 20,
		/** The 100 shares of the two-sides shot: a square's pitch, and the block's top. */
		lotCell,
		lotY,
		sideNum,
		pair: narrow ? [0.27, 0.73] : [0.3, 0.7],
	};
}

const copy = {
	title: ["Options", "期权"],
	titleSub: ["a paid right with a deadline", "有期限的付费权利"],
	qTag: ["ALFA Oct 18 100 call", "ALFA 10月18日 100 看涨"],
	qLine: [
		`Expiry: ALFA $${LOW}. Call value?`,
		`到期 ALFA $${LOW}，看涨值多少？`,
	],
	rightHead: ["Right: buy ALFA at strike.", "看涨：有权按行权价买入 ALFA。"],
	rightHeadShort: ["Right: buy at strike.", "看涨：按行权价买入。"],
	callHead: ["Worth ALFA above $100.", "价值看 ALFA 高出 $100 多少。"],
	callHeadShort: ["Worth ALFA above $100.", "价值看 ALFA 高出 $100 多少。"],
	putHead: ["Put: right to sell at strike.", "看跌：有权按行权价卖出。"],
	putHeadShort: ["Put: sell at strike.", "看跌：按行权价卖出。"],
	premium: [
		`premium ${usd(PREMIUM * 100, 0)}`,
		`权利金 ${usd(PREMIUM * 100, 0)}`,
	],
	/** What each chart measures: the first is the right's value, the second a position's profit. */
	valueAxis: ["value at expiry", "到期价值"],
	profitAxis: ["profit at expiry", "到期盈亏"],
	/** The contract, said once and drawn as 100 squares beside it. */
	unit: [
		`1 contract: 100 shares × ${usd(PREMIUM)}`,
		`1 张合约：100 股 × ${usd(PREMIUM)}`,
	],
	strike: ["strike $100", "行权价 $100"],
	callLabel: ["call", "看涨"],
	putLabel: ["put", "看跌"],
	/** The contract is 100 shares: the unit sits with the value it multiplies. */
	value: ["value · 100 shares", "价值 · 100 股"],
	net: ["net", "净盈亏"],
	sharesAlone: ["100 shares", "100 股"],
	sharesEntry: ["bought at $100", "$100 买入"],
	withPut: ["with 95 put", "加 95 看跌"],
	protectPremium: [
		`premium ${usd(putCost * 100, 0)}`,
		`权利金 ${usd(putCost * 100, 0)}`,
	],
	putSpot: [`ALFA $${PUT_AT}`, `ALFA $${PUT_AT}`],
	spotLow: [`ALFA $${LOW}`, `ALFA $${LOW}`],
	spotHigh: [`ALFA $${HIGH}`, `ALFA $${HIGH}`],
	fallFrom: ["ALFA $100", "ALFA $100"],
	fallTo: [`ALFA $${FALL_TO}`, `ALFA $${FALL_TO}`],
	protectHead: [
		"Two uses: protect shares; buy a call alone.",
		"两种用途：保护持股，或单独买入看涨。",
	],
	protectHeadShort: [
		"Protect shares; buy a call alone.",
		"保护持股；单独买入看涨。",
	],
	viewContract: ["ALFA 105 call", "ALFA 105 看涨"],
	viewPremium: [
		`Premium ${usd(viewCost * 100, 0)}`,
		`权利金 ${usd(viewCost * 100, 0)}`,
	],
	sharesLabel: ["shares alone", "仅持股"],
	floor: ["loss floor", "亏损下限"],
	most: ["Max loss: premium", "最多亏权利金"],
	result: [
		`Your 100 call: ALFA ends at $${HIGH}.`,
		`你的 100 看涨：ALFA 收于 $${HIGH}。`,
	],
	sidesHead: ["The call has two sides.", "看涨合约的双方。"],
	sidesHeadShort: ["The call has two sides.", "看涨合约的双方。"],
	sidesObligation: [
		"If exercised, Ben delivers 100 shares.",
		"若被行权，Ben 必须交付 100 股。",
	],
	you: ["you · holder", "你 · 持有人"],
	ben: ["Ben · writer", "Ben · 义务方"],
	claimBig: ["Your right. Their obligation.", "你有权利，对方有义务。"],
	claimSub: ["The buyer can lose only the premium.", "买方最多只亏权利金。"],
	nextBig: ["Next: trading an option", "下一课：交易期权"],
	nextSub: ["from chain to order", "从期权链到下单"],
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
	const id = useId().replace(/:/g, "");
	// The question card's contract row: 100 squares and their line, centred under the $420.
	const lotSide = LOT_COLUMNS * L.lotCell;
	const unitY = H * 0.3 + T.big * 1.05 + lotSide / 2 + T.body * 1.9;
	const unitX =
		W / 2 - (lotSide + 12 + sansWidth(pick(copy.unit, locale), T.body)) / 2;
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
	/** A chart's only scaffold: the zero line. Prices are named where a marker stands. */
	const zeroLine = (name: string, y: number) => (
		<path data-f={name} d={`M${L.left} ${y}H${L.right}`} className="wt-axis" />
	);
	/** A price under the axis, at the spot it names. */
	const spotLabel = (name: string, text: Copy, spot: number, tone = "") => (
		<text
			data-f={name}
			x={L.x(spot)}
			y={L.spotY}
			textAnchor={spot === X[0] ? "start" : "middle"}
			className={`wt-halo wt-marker-label ${tone}`}
			style={tone ? undefined : { fill: "var(--tone-ink)" }}
		>
			{t(text)}
		</text>
	);
	/**
	 * A line's label at a point: below it and to the right, or above it and to the left, so a
	 * rising line climbs away from the text on both sides. A flat line can take either side.
	 */
	const useLabel = (
		name: string,
		text: Copy,
		spot: number,
		value: number,
		tone: string,
		below = false,
		right = below,
	) => (
		<text
			data-f={name}
			x={L.x(spot) + (right ? 6 : -6)}
			y={L.u(value) + (below ? 20 : -10)}
			textAnchor={right ? "start" : "end"}
			className={`wt-halo wt-marker-label ${tone}`}
			style={tone.startsWith("wt-") ? undefined : { fill: tone }}
		>
			{t(text)}
		</text>
	);
	return (
		<>
			<Backdrop frame={L} />
			<defs>
				<pattern
					id={`lotq-${id}`}
					x={unitX}
					y={unitY - lotSide / 2 - T.body * 0.34}
					width={L.lotCell}
					height={L.lotCell}
					patternUnits="userSpaceOnUse"
				>
					<rect
						width={L.lotCell * 0.7}
						height={L.lotCell * 0.7}
						rx={0.6}
						className="wt-film-bar"
						data-tone="total"
					/>
				</pattern>
				<pattern
					id={`lot-${id}`}
					x={W * L.pair[1] - (LOT_COLUMNS * L.lotCell) / 2}
					y={L.lotY}
					width={L.lotCell}
					height={L.lotCell}
					patternUnits="userSpaceOnUse"
				>
					<rect
						width={L.lotCell * 0.7}
						height={L.lotCell * 0.7}
						rx={0.6}
						className="wt-film-bar"
						data-tone="total"
					/>
				</pattern>
			</defs>

			<g data-f="depth">
				<g data-f="world">
					{/* The right's value at expiry. */}
					<g data-f="value-chart">
						<text x={L.left} y={L.top - 12} className="wt-small">
							{t(copy.valueAxis)}
						</text>
						{zeroLine("v-zero", L.y(0))}
						<path
							data-f="strike"
							d={`M${L.x(100)} ${L.top}V${L.bottom}`}
							className="wt-bracket"
							style={{ stroke: "var(--tone-dim)" }}
							strokeDasharray="4 3"
						/>
						<text
							data-f="strike-label"
							x={L.x(100) + 6}
							y={L.top + 14}
							className="wt-small wt-halo"
						>
							{t(copy.strike)}
						</text>
						<path
							data-f="premium"
							d={`M${L.left} ${L.y(PREMIUM)}H${L.right}`}
							className="wt-line-reference"
						/>
						<text
							data-f="premium-label"
							// At the line's right end; on a phone at its left, where the value bar
							// under the $110 marker does not reach.
							x={narrow ? L.left + 4 : L.right - 4}
							y={L.y(PREMIUM) - 8}
							textAnchor={narrow ? "start" : "end"}
							className="wt-small wt-halo"
						>
							{/* The figure white, like the question's $420 that lands on it. */}
							{t(copy.premium).replace(usd(PREMIUM * 100, 0), "")}
							<tspan className="wt-film-num">{usd(PREMIUM * 100, 0)}</tspan>
						</text>
						{/* The call's value, drawn: a bar under the marker. The premium line splits it
						    into the premium paid back and, above the line, the net gain. */}
						<rect
							data-f="v-bar-paid"
							x={L.x(LOW) - 5}
							y={L.y(0)}
							width={10}
							height={0}
							rx={2}
							className="wt-film-bar"
							data-tone="neutral"
						/>
						<rect
							data-f="v-bar-net"
							x={L.x(LOW) - 5}
							y={L.y(0)}
							width={10}
							height={0}
							rx={2}
							className="wt-film-bar"
							data-tone="gain"
						/>
						<path
							data-f="call-line"
							d={L.path(callValue, L.y)}
							className="wt-line-call"
							style={{ strokeWidth: 3 }}
						/>
						<path
							data-f="put-line"
							d={L.path(putValue, L.y)}
							className="wt-line-put"
						/>
						<text
							data-f="put-tag"
							x={L.x(83)}
							y={L.y(putValue(83)) - 10}
							className={`wt-halo wt-marker-label ${toneClass.put}`}
						>
							{t(copy.putLabel)}
						</text>
						<text
							data-f="call-tag"
							// Low on the line, clear of the meter in the corner.
							x={L.x(113) + 10}
							y={L.y(callValue(113)) + 16}
							className={`wt-halo wt-marker-label ${toneClass.call}`}
						>
							{t(copy.callLabel)}
						</text>
						<text
							data-f="put-spot"
							x={L.x(PUT_AT) + 10}
							y={L.y(putValue(PUT_AT)) - 10}
							className={`wt-halo wt-marker-label ${toneClass.put}`}
						>
							{t(copy.putSpot)}
						</text>
						{spotLabel("spot-low", copy.spotLow, LOW, toneClass.call)}
						{spotLabel("spot-high", copy.spotHigh, HIGH, toneClass.call)}
						<circle
							data-f="marker"
							cx={L.x(LOW)}
							cy={L.y(0)}
							r={6}
							className={`wt-chip ${toneClass.call}`}
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
					</g>

					{/* Protection beside the shares alone, then a purchased call. */}
					<g data-f="use-chart">
						<text x={L.left} y={L.top - 12} className="wt-small">
							{t(copy.profitAxis)}
						</text>
						{zeroLine("u-zero", L.u(0))}
						<text
							data-f="u-zero-label"
							x={L.left - 8}
							y={L.u(0) + 4}
							textAnchor="end"
							className="wt-small"
						>
							$0
						</text>
						{spotLabel("fall-from", copy.fallFrom, 100)}
						{spotLabel("fall-to", copy.fallTo, FALL_TO)}
						<path
							data-f="shares-line"
							d={L.path(shares, L.u)}
							className="wt-line-reference"
						/>
						<path
							data-f="protect-line"
							d={L.path(positionPayoff.protect, L.u)}
							className="wt-line-position"
						/>
						<path
							data-f="view-line"
							d={L.path(positionPayoff.view, L.u)}
							className="wt-line-position"
							style={{ strokeWidth: 2.5 }}
						/>
						{useLabel(
							"shares-tag",
							copy.sharesLabel,
							86,
							shares(86),
							"wt-film-dim",
							true,
						)}
						{/* Above the flat floor, to the right: the shares line runs below it. */}
						{useLabel(
							"floor-tag",
							copy.floor,
							narrow ? 80 : 84,
							positionPayoff.protect(narrow ? 80 : 84),
							"wt-accent",
							false,
							true,
						)}
						{/* Under the flat floor it names; on a phone it ends at the kink, clear of the edge. */}
						{useLabel(
							"most-tag",
							copy.most,
							104,
							positionPayoff.view(104),
							toneClass.focus,
							true,
							!narrow,
						)}
						{/* What the put saves: between the two lines, filled as ALFA falls. */}
						<clipPath id={`save-${id}`}>
							<rect
								data-f="save-clip"
								x={L.x(SAVES_BELOW)}
								y={L.top}
								width={0}
								height={L.bottom - L.top}
							/>
						</clipPath>
						<path
							data-f="save-area"
							d={`${L.path(positionPayoff.protect, L.u)}${[...spots]
								.reverse()
								.map(
									(spot) =>
										`L${L.x(spot).toFixed(1)} ${L.u(shares(spot)).toFixed(1)}`,
								)
								.join("")}Z`}
							style={{
								fill: `color-mix(in oklab, ${toneColor("focus")} 14%, transparent)`,
							}}
							clipPath={`url(#save-${id})`}
						/>
						<circle
							data-f="s-marker"
							cx={L.x(100)}
							cy={L.u(shares(100))}
							r={5}
							className="wt-chip"
							style={{ fill: "var(--tone-dim)" }}
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
						<circle
							data-f="p-marker"
							cx={L.x(100)}
							cy={L.u(positionPayoff.protect(100))}
							r={6}
							className="wt-chip"
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
					</g>
					<PenTip name="call-tip" color={toneColor("call")} />
					<PenTip name="tip" />
					<PenTip name="view-tip" color={toneColor("focus")} />
				</g>
			</g>
			<Brackets name="lock-floor" tone="loss" glow />
			{/* Readouts under the headline: the call's value and net, then each use's two positions. */}
			{(
				[
					[
						"meter",
						[
							// Worth nothing at the start: zero reads dim until the call has value.
							["m-value", copy.value, "$0", "wt-film-num wt-film-dim"],
							[
								"m-net",
								copy.net,
								signedUsd((callValue(LOW) - PREMIUM) * 100, 0),
								"wt-film-num wt-film-loss",
							],
						],
					],
					[
						"umeter",
						[
							["u-shares", copy.sharesAlone, "$0", "wt-film-num"],
							[
								"u-put",
								copy.withPut,
								signedUsd(positionPayoff.protect(100) * 100, 0),
								"wt-film-num wt-film-loss",
							],
						],
					],
				] as const
			).map(([group, cells]) => (
				<g key={group} data-f={group}>
					{cells.map(([name, tag, start, className], i) => {
						const column = margin + i * L.meterCol;
						return (
							<g key={name}>
								<Word
									name={`${name}-tag`}
									x={column}
									y={L.meterY - (group === "umeter" ? T.small * 1.5 : 0)}
									size={T.small}
									anchor="start"
									className="wt-film-tag"
								>
									{t(tag).toUpperCase()}
									{group === "umeter" && (
										<tspan x={column} dy={T.small * 1.5}>
											{t(
												name === "u-shares"
													? copy.sharesEntry
													: copy.protectPremium,
											).toUpperCase()}
										</tspan>
									)}
								</Word>
								<Word
									name={name}
									x={column}
									y={L.meterNum + (name === "u-put" ? T.head * 1.55 : 0)}
									size={T.head * (name === "u-put" ? 1.6 : 1.15)}
									anchor="start"
									className={className}
								>
									{start}
								</Word>
							</g>
						);
					})}
				</g>
			))}
			<Word
				name="m-net-next"
				x={margin + L.meterCol}
				y={L.meterNum}
				size={T.head * 1.15}
				anchor="start"
				className="wt-film-num wt-film-gain"
			>
				{signedUsd(NET_HIGH * 100, 0)}
			</Word>

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
				<Word
					name="q-big"
					x={W / 2}
					y={H * 0.3 + T.big * 1.05}
					size={T.big}
					className="wt-film-num"
				>
					{usd(PREMIUM * 100, 0)}
				</Word>
				{/* The contract, said once: 100 squares, one a share, and what each costs. */}
				<g data-f="q-unit">
					<rect
						x={unitX}
						y={unitY - lotSide / 2 - T.body * 0.34}
						width={lotSide}
						height={lotSide}
						fill={`url(#lotq-${id})`}
					/>
					<text
						x={unitX + lotSide + 12}
						y={unitY}
						className="wt-film-type wt-film-dim"
						style={{ fontSize: T.body }}
					>
						{t(copy.unit)}
					</text>
				</g>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.74}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("r-head", copy.rightHead, copy.rightHeadShort)}
			{headline("c-head", copy.callHead, copy.callHeadShort)}
			{headline("p-head", copy.putHead, copy.putHeadShort)}

			{headline("v-head", copy.protectHead, copy.protectHeadShort)}
			{headline("d-head", copy.sidesHead, copy.sidesHeadShort)}
			<g data-f="view-ticket">
				<Lines
					name="view-contract"
					text={t(copy.viewContract)}
					x={margin}
					y={L.meterY}
					size={T.body}
					maxWidth={room}
					anchor="start"
					className="wt-film-type"
				/>
				<Word
					name="view-premium"
					x={margin}
					y={L.meterY + T.body * 1.7}
					size={T.body}
					anchor="start"
					className="wt-film-num wt-film-dim"
				>
					{t(copy.viewPremium)}
				</Word>
			</g>
			<g data-f="sides">
				{(
					[
						["you", copy.you, signedUsd(NET_HIGH * 100, 0), "wt-film-gain"],
						["ben", copy.ben, signedUsd(-NET_HIGH * 100, 0), "wt-film-loss"],
					] as const
				).map(([name, tag, after, tone], i) => (
					<g key={name}>
						<Word
							name={`${name}-tag`}
							x={W * L.pair[i]}
							y={H * 0.4}
							size={T.small}
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`${name}-after`}
							x={W * L.pair[i]}
							y={L.sideNum}
							size={T.big * 0.8}
							className={`wt-film-num ${tone}`}
						>
							{after}
						</Word>
					</g>
				))}
				<Lines
					name="sides-line"
					text={t(copy.result)}
					x={W / 2}
					y={H * 0.26}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
				{/* The obligation, drawn: 100 squares, one a share, which the build moves from
				    Ben to you. */}
				<g data-f="lot">
					<rect
						x={W * L.pair[1] - (LOT_COLUMNS * L.lotCell) / 2}
						y={L.lotY}
						width={LOT_COLUMNS * L.lotCell}
						height={(LOT / LOT_COLUMNS) * L.lotCell}
						fill={`url(#lot-${id})`}
					/>
				</g>
				<Lines
					name="sides-obligation"
					text={t(copy.sidesObligation)}
					x={W / 2}
					y={H * 0.78}
					size={T.body}
					maxWidth={room}
					className="wt-film-type"
				/>
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
	const { tl, one, kids, show, hide, pop, rise, sink } = d;
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
	gsap.set(one("lock-floor"), {
		filter:
			"drop-shadow(0 0 2px var(--diagram-loss)) drop-shadow(0 0 9px color-mix(in oklab, var(--diagram-loss) 60%, transparent))",
	});
	const tip = one("tip");
	const line = (name: string) => one<SVGPathElement>(name);
	const marker = one("marker");
	const value = one<SVGTextElement>("m-value");
	const netResult = one<SVGTextElement>("m-net");
	const netResultNext = one<SVGTextElement>("m-net-next");
	const uShares = one<SVGTextElement>("u-shares");
	const uPut = one<SVGTextElement>("u-put");
	uShares.style.fill = "var(--tone-dim)";
	const sMarker = one("s-marker");
	const pMarker = one("p-marker");
	const saveClip = one("save-clip");
	const barPaid = one("v-bar-paid");
	const barNet = one("v-bar-net");
	const dollars = (v: number) => usd(Math.round(v) * 100, 0);
	const signed = (v: number) =>
		Math.round(v) === 0 ? "$0" : signedUsd(Math.round(v) * 100, 0);
	const tone = (v: number) =>
		`wt-film-num ${Math.round(v) > 0 ? "wt-film-gain" : Math.round(v) < 0 ? "wt-film-loss" : ""}`;
	const signColor = (target: SVGTextElement, v: number) => {
		target.setAttribute("class", tone(v));
		target.style.fill = Math.round(v) === 0 ? "var(--tone-dim)" : "";
	};
	/**
	 * A tween that walks a spot from one price to another and draws everything from it each
	 * frame. Not rendered up front, so nothing reads the walk's end before it begins.
	 */
	const walk = (
		from: number,
		to: number,
		at: number,
		duration: number,
		place: (spot: number) => void,
	) => {
		const spot = { at: from };
		tl.fromTo(
			spot,
			{ at: from },
			{
				at: to,
				duration,
				ease: "power2.inOut",
				immediateRender: false,
				onUpdate: () => place(spot.at),
			},
			at,
		);
	};
	/** The marker on a right's value line, and the meter read from the marker. */
	const onRight =
		(
			f: (spot: number) => number,
			netAt?: (spot: number) => number,
			role: string = toneClass.call,
		) =>
		(spot: number) => {
			gsap.set(marker, { attr: { cx: L.x(spot), cy: L.y(f(spot)) } });
			value.textContent = dollars(f(spot));
			// A right worth nothing reads dim; any value takes its right's colour.
			value.setAttribute(
				"class",
				`wt-film-num ${Math.round(f(spot)) === 0 ? "wt-film-dim" : role}`,
			);
			if (netAt) {
				// The value bar stands under the marker; the premium line splits it.
				const worth = f(spot);
				const paid = Math.min(worth, PREMIUM);
				for (const bar of [barPaid, barNet])
					bar.setAttribute("x", `${L.x(spot) - 5}`);
				barPaid.setAttribute("y", `${L.y(paid)}`);
				barPaid.setAttribute("height", `${L.y(0) - L.y(paid)}`);
				barNet.setAttribute("y", `${L.y(worth)}`);
				barNet.setAttribute(
					"height",
					`${Math.max(0, L.y(PREMIUM) - L.y(worth))}`,
				);
				const net = netAt(spot);
				netResult.textContent = signed(net);
				signColor(netResult, net);
				netResultNext.textContent = signed(net);
				signColor(netResultNext, net);
			}
		};
	/** Both positions as ALFA falls: the markers, the readouts and the saving behind them. */
	const onFall = (spot: number) => {
		gsap.set(sMarker, { attr: { cx: L.x(spot), cy: L.u(shares(spot)) } });
		gsap.set(pMarker, {
			attr: { cx: L.x(spot), cy: L.u(positionPayoff.protect(spot)) },
		});
		uShares.textContent = signed(shares(spot));
		signColor(uShares, shares(spot));
		uPut.textContent = signed(positionPayoff.protect(spot));
		signColor(uPut, positionPayoff.protect(spot));
		const left = Math.min(L.x(spot), L.x(SAVES_BELOW));
		gsap.set(saveClip, {
			attr: { x: left, width: L.x(SAVES_BELOW) - left },
		});
	};
	const heads = ["r-head", "c-head", "p-head", "v-head", "d-head"].map((name) =>
		one(name),
	);

	d.hidden([
		one("use-chart"),
		one("strike"),
		one("strike-label"),
		one("premium"),
		one("premium-label"),
		one("call-line"),
		one("put-line"),
		one("call-tag"),
		one("put-tag"),
		one("put-spot"),
		one("spot-low"),
		one("spot-high"),
		one("q-unit"),
		barPaid,
		barNet,
		one("fall-from"),
		one("fall-to"),
		one("lot"),
		marker,
		one("shares-line"),
		one("protect-line"),
		one("view-line"),
		one("shares-tag"),
		one("floor-tag"),
		one("most-tag"),
		one("save-area"),
		sMarker,
		pMarker,
		one("call-tip"),
		tip,
		one("view-tip"),
		one("lock-floor"),
		...kids("view-ticket"),
		...kids("meter"),
		one("m-net-next"),
		...kids("umeter"),
		uPut,
		...flat("q"),
		...heads,
		...flat("sides"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: a call for $420 ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.4);
	word(one("q-big"), 4.6);
	show(one("q-unit"), 4.9, "below", 0.3);
	show(one("q-line"), 5.1);

	// ——— right: what the call is worth at expiry ———
	tl.addLabel("right", 8.6);
	hide([one("q-tag"), one("q-unit"), one("q-line")], 8.6);
	rise(8.7);
	show([one("strike"), one("strike-label")], 9.2);
	// The $420 the question named lands on the chart as the premium line.
	d.carry(
		one<SVGGraphicsElement>("q-big"),
		one<SVGGraphicsElement>("premium-label"),
		8.8,
		{ duration: 1.1, arc: "y" },
	);
	tl.to(one("premium"), { opacity: 1, duration: 0.4 }, 9.7);
	show(heads[0], 10.0);
	d.trace(line("call-line"), 10.4, { tip: one("call-tip"), duration: 1.2 });
	show(one("call-tag"), 11.4);
	// The call at $95, then at $110: the meter reads from the marker.
	d.swap(heads[0], heads[1], 13.5);
	pop(marker, 13.9);
	// The two prices the call is tried at stand under the axis from here on, as ticks.
	show([one("spot-low"), one("spot-high")], 13.9, "below", 0.3);
	show(kids("meter"), 14.0);
	const onCallRight = onRight(callValue, (spot) => callValue(spot) - PREMIUM);
	walk(HIGH, HIGH, 13.89, 0.01, () => onCallRight(LOW));
	tl.set([barPaid, barNet], { opacity: 1 }, 15.5);
	walk(LOW, HIGH, 15.5, 1.2, onCallRight);
	d.flip(netResult, netResultNext, 16.05);
	tl.set(netResult, { opacity: 0 }, 16.35);
	// The call rests a full second after its 16.7 settlement. With the put's
	// walking demonstration removed, the curve and a settled $90 example each
	// get their own quiet time without compressing either entrance.
	d.swap(heads[1], heads[2], 17.7);
	hide([one("m-net-tag"), netResultNext], 17.7);
	// Keep the identical $1,000 value readable across both examples. The call's
	// marker stays with its dimmed curve until the put's $90 example takes over.
	tl.to(marker, { opacity: 0.3, duration: 0.4 }, 17.7);
	tl.to(
		[
			one("call-line"),
			one("call-tag"),
			barPaid,
			barNet,
			one("spot-low"),
			one("spot-high"),
		],
		{ opacity: 0.3, duration: 0.4 },
		17.7,
	);
	// Position and identity change with the put example, not its curve. Until
	// this handoff, the retained $1,000 still belongs to the call at $110.
	tl.set(
		marker,
		{
			attr: { cx: L.x(PUT_AT), cy: L.y(putValue(PUT_AT)) },
		},
		19.6,
	);
	tl.set(marker, { attr: { class: `wt-chip ${toneClass.put}` } }, 19.6);
	tl.set(value, { attr: { class: `wt-film-num ${toneClass.put}` } }, 19.6);
	walk(PUT_AT, PUT_AT, 19.6, 0.01, onRight(putValue, undefined, toneClass.put));
	d.trace(line("put-line"), 18.1, { duration: 0.5 });
	show(one("put-tag"), 18.1);
	// Curve settles at 18.6; the settled example arrives after 1 s of quiet,
	// then rests 1.5 s after its 20.1 settlement before the uses cut at 21.6.
	tl.fromTo(
		[marker, one("put-spot")],
		{ opacity: 0, y: 0 },
		{ opacity: 1, duration: 0.5, immediateRender: false },
		19.6,
	);

	// ——— uses: the hero first. Shares alone, then shares with a 95 put as ALFA falls. ———
	tl.addLabel("uses", 21.6);
	hide([heads[2], ...kids("meter")], 21.6);
	sink(21.6);
	tl.set(one("value-chart"), { opacity: 0 }, 22);
	tl.set(one("use-chart"), { opacity: 1 }, 22);
	show(heads[3], 22);
	// Cut to settled axes after the old chart clears. No rescale shares time
	// with the data; the scaffold stands for 1 s before the traces start.
	tl.set(one("depth"), { opacity: 1, scale: 1 }, 22.0);
	// Build one comparison, rather than two successive proofs. The reference and
	// protected position settle together; labels land with that construction.
	d.trace(line("shares-line"), 23.0, { duration: 1.2 });
	d.trace(line("protect-line"), 23.0, { tip, duration: 1.2 });
	// Where ALFA starts and where it falls to stand under the axis from here on, as ticks.
	show(
		[one("shares-tag"), one("fall-from"), one("fall-to"), ...kids("umeter")],
		24.2,
	);
	// Everything settles by 24.7. The paired markers fade in only after 1.15 s
	// of quiet, then the same 1.6 s walk constructs the −$715 loss floor.
	// The premium tag supplies the initial $215; reveal the protected readout
	// with its walk, rather than requiring another brief static result to read.
	tl.to(
		[sMarker, pMarker, one("save-area")],
		{ opacity: 1, duration: 0.35 },
		25.85,
	);
	tl.to(uPut, { opacity: 1, duration: 0.35 }, 26.3);
	walk(100, FALL_TO, 26.3, 1.6, onFall);
	show(one("floor-tag"), 27.7);
	d.lock(one<SVGGraphicsElement>("lock-floor"), 27.9, {
		around: uPut,
		pad: 5,
	});
	tl.addLabel("hero-lock", 27.9);
	// Keep one headline across both uses. The loss meter and brackets keep their
	// full 3.55 s settled stand before the comparison marks leave with the hero.
	hide(
		[
			one("u-shares-tag"),
			uShares,
			one("u-put-tag"),
			sMarker,
			pMarker,
			one("fall-from"),
			one("fall-to"),
		],
		31.9,
	);
	tl.to(
		[
			uPut,
			one("protect-line"),
			one("floor-tag"),
			one("shares-line"),
			one("shares-tag"),
			one("save-area"),
			one("lock-floor"),
		],
		{ opacity: 0, duration: 0.4 },
		31.9,
	);
	// One identified transaction owns the whole extra-use beat. No old curves
	// remain under the purchased call, and the bound explicitly names loss.
	show(kids("view-ticket"), 32.3);
	d.trace(line("view-line"), 32.7, { tip: one("view-tip"), duration: 1.2 });
	show(one("most-tag"), 33.9);
	// Label and pen settle by 34.4; the result rests 1.6 s before the cut.

	// ——— sides: holder and writer ———
	tl.addLabel("sides", 36.0);
	hide([heads[3], ...kids("view-ticket")], 36.0);
	sink(36.0);
	show(heads[4], 36.35);
	show(one("sides-line"), 36.35);
	show(one("sides-obligation"), 36.35);
	show([one("you-tag"), one("ben-tag")], 36.35);
	// The obligation first: the 100 shares stand under Ben, then cross to you. After they
	// settle, both results land together; their 2.7 s rest is unchanged.
	show(one("lot"), 36.35);
	tl.to(
		one("lot"),
		{
			x: W * (L.pair[0] - L.pair[1]),
			duration: 0.8,
			ease: "power2.inOut",
		},
		36.95,
	);
	word(one("you-after"), 37.85);
	word(one("ben-after"), 37.85);

	// ——— claim ———
	tl.addLabel("claim", 41.1);
	hide([heads[4], ...flat("sides")], 41.1);
	word(one("z-big"), 41.4);
	show(one("z-sub"), 41.7);

	// ——— next ———
	tl.addLabel("next", 45.5);
	hide(kids("claim"), 45.5);
	d.close(45.5);
	return tl;
}

export const whatOptionsAreFilm: Film = {
	id: "what-options-are",
	label: [
		`Options, as a short film: an Oct 18 100 call bought for ${usd(PREMIUM * 100, 0)} and its worth if ALFA ends at $${LOW}; the right to buy at $100, worthless at $${LOW} and worth $1,000 at $${HIGH}; a put worth $1,000 at $${PUT_AT}; 100 shares protected by a 95 put as ALFA falls to $80, with a loss floor of ${signedUsd(positionPayoff.protect(80) * 100, 0)}; an Oct 18 105 call bought for ${usd(viewCost * 100, 0)}, whose maximum loss is its premium; and the original 100 call at ALFA $${HIGH} on Oct 18, its $1,000 value minus $420 premium leaving you up $580 and Ben down $580`,
		`期权短片：花 ${usd(PREMIUM * 100, 0)} 买入的 10月18日 100 看涨，以及 ALFA 收于 $${LOW} 时它值多少；以 $100 买入的权利，在 $${LOW} 作废，在 $${HIGH} 值 $1,000；看跌在 $${PUT_AT} 值 $1,000；ALFA 跌到 $80 时，100 股加 95 看跌的亏损下限为 ${signedUsd(positionPayoff.protect(80) * 100, 0)}；花 ${usd(viewCost * 100, 0)} 买入 10月18日 105 看涨，最多只亏权利金；以及原来的 100 看涨在 10月18日 ALFA 收于 $${HIGH} 时，$1,000 价值减 $420 权利金，你赚 $580，Ben 亏 $580`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Options", "期权"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "right", label: ["The right", "权利"] },
		{ id: "uses", label: ["Two uses", "两种用途"] },
		{ id: "sides", label: ["Two sides", "两方"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
