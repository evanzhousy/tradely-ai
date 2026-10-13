import { gsap } from "gsap";
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
	CALL_100,
	exitValues,
	INDEX_LAST,
	INDEX_SETTLES,
	INDEX_STRIKE,
	indexPayout,
	WINDOW_DAYS,
	windowTicks,
} from "./expiration-settlement-model";

/*
 * Expiration, as a film. It opens on Oct 4: the 95 call bids $7.40 with ALFA at $102, and
 * the question is what exercising gets instead. The $7.40 flies onto its bar, $7.00 of
 * intrinsic value and $0.40 of time value, and the "?" becomes exercise's $7.00; on Oct 18
 * the time value melts and the two are equal. Then settlement: ALFA delivers 100 shares for
 * $9,500; an index pays cash, $2,500 at the official 5,025, not Thursday's 5,030. Then the
 * window: American any trading day, European only at expiry. The hero: ALFA closes at
 * $100.02, two cents above the strike, and glowing brackets lock as the call is exercised
 * automatically. Last, a writer: $99.98 at the close, $100.60 after hours, assigned.
 *
 *   open      0–4        "Expiration"
 *   question  4–8.8      Oct 4: sell at $7.40, or exercise?
 *   exit      8.8–17.5   labelled parts; Oct 18 equality before the answer
 *   settle    17.5–21.4  ALFA: 100 shares for $9,500
 *   cash      21.4–25.3  IDX 500: $2,500 at the official 5,025
 *   window    25.3–29.7  American trading days; European at expiry
 *   pin       29.7–35.05  $100.02 − $100.00 makes the bracketed $0.02
 *   writer    35.05–40.6 separate close $99.98, after hours $100.60, holder exercises
 *   claim     40.6–45.0 check exercise instructions and the broker's cutoff
 *   next      45.0–47.5 Next: the module checkpoint
 */

const END = 47.5;
const OCT4 = exitValues("oct4");
const OCT18 = exitValues("oct18");
const PAYS = indexPayout(INDEX_SETTLES);
const PIN = [99.9, 100.7] as const;
const HOLDER_CLOSE = 100.02;
const WRITER_CLOSE = 99.98;
const WRITER_AFTER = 100.6;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const barTop = H * (narrow ? 0.34 : 0.32);
	const barBottom = H * (narrow ? 0.72 : 0.74);
	const top = OCT4.bid;
	return {
		...frame,
		barBottom,
		barH: (cents: number) => (cents / top) * (barBottom - barTop),
		barX: (i: number) =>
			width / 2 + (i === 0 ? -1 : 1) * room * (narrow ? 0.2 : 0.16),
		barW: Math.min(room * 0.22, 120),
		lineY: H * 0.5,
		dayX: (day: number) => margin + (day / WINDOW_DAYS) * room,
		pinX: (price: number) =>
			margin + ((price - PIN[0]) / (PIN[1] - PIN[0])) * room,
		pinY: H * 0.37,
		priceX: width * 0.64,
		priceY: H * 0.3,
		heroSize: frame.type.big * (narrow ? 0.9 : 0.78),
		heroY:
			H * 0.51 +
			frame.type.big * (narrow ? 0.9 : 0.78) * 1.15 +
			(narrow ? 28 : 0),
		partyY: H * (narrow ? 0.36 : 0.34),
		partyH: H * (narrow ? 0.14 : 0.13),
		partyW: room * (narrow ? 0.34 : 0.28),
	};
}

const copy = {
	title: ["Expiration", "到期"],
	titleSub: ["exercise, assignment and settlement", "行权、指派与结算"],
	qTag: [
		"Fri Oct 4 · Oct 18 95 call · ALFA $102",
		"10月4日 周五 · 10月18日 95 看涨 · ALFA $102",
	],
	qTagShort: ["Oct 4 · 95 call · ALFA $102", "10月4日 · 95 看涨 · ALFA $102"],
	sell: ["sell at the bid", "按买价卖出"],
	exercise: ["exercise", "行权"],
	qLine: ["Which gets you more?", "哪个拿到的更多？"],
	exitHead: ["Exercise gives up the time value.", "行权会放弃时间价值。"],
	exitHeadShort: ["Exercise drops the time value.", "行权丢掉时间价值。"],
	sameHead: ["On Oct 18, both are $7.00.", "10月18日，两者都是 $7.00。"],
	intrinsic: ["intrinsic", "内在价值"],
	time: ["time value", "时间价值"],
	exitBasis: ["ALFA $102 · per share", "ALFA $102 · 每股"],
	oct4: ["Oct 4", "10月4日"],
	oct18: ["Oct 18", "10月18日"],
	sharesHead: ["ALFA settles in shares.", "ALFA 以股票交收。"],
	cashHead: ["An index settles in cash.", "指数以现金结算。"],
	you: ["you · holder", "你 · 持有人"],
	writer: ["writer", "义务方"],
	cash: ["$9,500", "$9,500"],
	shares: ["100 ALFA", "100 股 ALFA"],
	official: ["official settlement", "官方结算值"],
	thursday: ["Thursday's close, ignored", "周四收盘，不算"],
	thursdayShort: ["Thu close · ignored", "周四收盘 · 不算"],
	payout: ["writer pays", "义务方支付"],
	windowHead: [
		"American: any trading day. European: at expiry.",
		"美式：任一交易日；欧式：到期日。",
	],
	american: ["American", "美式"],
	european: ["European", "欧式"],
	pinHead: ["At expiry: a $100-strike call.", "到期：$100 行权价看涨。"],
	autoHead: [
		"Two cents in: automatic exercise.",
		"实值 2 美分：默认自动行权。",
	],
	holderClose: ["holder · Oct 18 close", "持有人 · 10月18日收盘"],
	writerClose: ["writer · ALFA", "义务方 · ALFA"],
	afterHours: ["after hours", "盘后"],
	close: ["close", "收盘"],
	inTheMoney: ["in the money · per share", "实值 · 每股"],
	defaultAction: [
		"No action · no decline instruction.",
		"未操作，也未通知券商放弃行权。",
	],
	holderExercises: ["Holder exercises", "持有人选择行权"],
	writerHead: [
		"A writer can be assigned after hours.",
		"义务方在盘后也可能被指派。",
	],
	strike: ["strike $100", "行权价 $100"],
	exercised: ["automatic exercise", "自动行权"],
	assigned: ["assigned: short 100", "被指派：空头 100 股"],
	claimBig: [
		"A tiny expiry value can create shares.",
		"到期的几美分，也能变成股票。",
	],
	claimSub: [
		"Check exercise instructions and your broker’s cutoff.",
		"检查行权指示与券商截止时间。",
	],
	nextBig: ["Next: the module checkpoint", "下一步：本模块检查点"],
	nextSub: ["contracts and money, on a new day", "在新的一天里运用合约与金额"],
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
	const bar = (
		i: number,
		parts: { intrinsic: number; time: number },
		name: string,
	) => {
		const x = L.barX(i) - L.barW / 2;
		return (
			<g data-f={name}>
				<rect
					data-f={`${name}-in`}
					x={x}
					y={L.barBottom - L.barH(parts.intrinsic)}
					width={L.barW}
					height={L.barH(parts.intrinsic)}
					rx={3}
					className="wt-film-bar"
					data-tone="total"
				/>
				<rect
					data-f={`${name}-tv`}
					x={x}
					y={L.barBottom - L.barH(parts.intrinsic)}
					width={L.barW}
					height={0}
					rx={3}
					className="wt-film-bar"
					data-tone="model"
				/>
			</g>
		);
	};
	const partyX = (i: number) => (i === 0 ? margin : margin + room - L.partyW);
	const flowY = (k: number) => L.partyY + L.partyH * (0.3 + k * 0.4);
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
					{t(narrow ? copy.qTagShort : copy.qTag).toUpperCase()}
				</Word>
				{(
					[
						["q-sell", copy.sell, usd(OCT4.bid)],
						["q-ex", copy.exercise, "?"],
					] as const
				).map(([name, tag, num], i) => (
					<g key={name}>
						<Word
							name={`${name}-tag`}
							x={W * (narrow ? [0.27, 0.73][i] : [0.32, 0.68][i])}
							y={H * 0.44}
							size={T.small}
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`${name}-num`}
							x={W * (narrow ? [0.27, 0.73][i] : [0.32, 0.68][i])}
							y={H * 0.44 + T.big * 0.95}
							size={T.big * 0.85}
							className="wt-film-num"
						>
							{num}
						</Word>
					</g>
				))}
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.78}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>

			{/* Sell or exercise. */}
			{headline("e1-head", copy.exitHead, copy.exitHeadShort)}
			{/* The second half, a line under the first, as the time value melts. */}
			<Lines
				name="e2-head"
				text={t(copy.sameHead)}
				x={margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.exitHeadShort : copy.exitHead),
						narrow ? room : room * 0.74,
						T.head,
					) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			<g data-f="exit">
				<path
					d={`M${margin} ${L.barBottom}H${margin + room}`}
					className="wt-axis"
				/>
				{bar(0, OCT4, "b-sell")}
				{bar(1, { intrinsic: OCT4.intrinsic, time: 0 }, "b-ex")}
				{(
					[
						["l-sell", 0, copy.sell],
						["l-ex", 1, copy.exercise],
					] as const
				).map(([name, i, label]) => (
					<text
						key={name}
						data-f={name}
						x={L.barX(i)}
						y={L.barBottom + text * 1.6}
						textAnchor="middle"
						className="wt-film-type wt-film-dim"
						style={{ fontSize: text }}
					>
						{t(label)}
					</text>
				))}
				{(
					[
						["v-sell", 0, usd(OCT4.bid), OCT4.bid],
						["v-ex", 1, usd(OCT4.intrinsic), OCT4.intrinsic],
					] as const
				).map(([name, i, label, cents]) => (
					<text
						key={name}
						data-f={name}
						x={L.barX(i)}
						y={L.barBottom - L.barH(cents) - 10}
						textAnchor="middle"
						className="wt-film-num"
						style={{ fontSize: narrow ? T.head : T.num * 0.8 }}
					>
						{label}
					</text>
				))}
				<Word
					name="exit-basis"
					x={W / 2}
					y={H * 0.88}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.exitBasis)}
				</Word>
				{(
					[
						["component-in", copy.intrinsic, OCT4.intrinsic, margin],
						["component-tv", copy.time, OCT4.time, margin + room * 0.54],
					] as const
				).map(([name, label, cents, x]) => (
					<Word
						key={name}
						name={name}
						x={x}
						y={H * 0.95}
						size={T.body}
						anchor="start"
						className="wt-film-type wt-film-accent"
					>
						{`${usd(cents)} ${t(label)}`}
					</Word>
				))}
				{(
					[
						["d-oct4", copy.oct4],
						["d-oct18", copy.oct18],
					] as const
				).map(([name, label]) => (
					<text
						key={name}
						data-f={name}
						x={W / 2}
						y={L.barBottom + text * 3.4}
						textAnchor="middle"
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(label).toUpperCase()}
					</text>
				))}
			</g>

			{/* Shares or cash. */}
			{headline("s1-head", copy.sharesHead, copy.sharesHead)}
			{headline("s2-head", copy.cashHead, copy.cashHead)}
			<g data-f="shares">
				{[copy.you, copy.writer].map((label, i) => (
					<g key={label[0]}>
						<rect
							x={partyX(i)}
							y={L.partyY}
							width={L.partyW}
							height={L.partyH}
							rx={12}
							className={i === 0 ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						<text
							x={partyX(i) + L.partyW / 2}
							y={L.partyY + L.partyH / 2 + text * 0.36}
							textAnchor="middle"
							className="wt-film-type"
							style={{ fontSize: text }}
						>
							{t(label)}
						</text>
					</g>
				))}
				{(
					[
						[0, copy.cash, "wt-film-loss", 1],
						[1, copy.shares, "wt-film-gain", -1],
					] as const
				).map(([k, label, tone, dir]) => {
					const x0 = margin + L.partyW + 8;
					const x1 = margin + room - L.partyW - 8;
					return (
						<g key={label[0]} data-f={`flow-${k}`}>
							<path
								d={
									dir > 0
										? `M${x0} ${flowY(k)}H${x1}`
										: `M${x1} ${flowY(k)}H${x0}`
								}
								className="wt-film-riser"
							/>
							<path
								d={
									dir > 0
										? `M${x1 - 8} ${flowY(k) - 5}L${x1} ${flowY(k)}L${x1 - 8} ${flowY(k) + 5}`
										: `M${x0 + 8} ${flowY(k) - 5}L${x0} ${flowY(k)}L${x0 + 8} ${flowY(k) + 5}`
								}
								className="wt-film-riser"
							/>
							<text
								x={(x0 + x1) / 2}
								y={flowY(k) - 8}
								textAnchor="middle"
								className={`wt-film-num ${tone}`}
								style={{ fontSize: text }}
							>
								{t(label)}
							</text>
						</g>
					);
				})}
			</g>
			<g data-f="cash">
				{(
					[
						[
							"c-official",
							copy.official,
							count(INDEX_SETTLES),
							"wt-film-accent",
						],
						[
							"c-thursday",
							narrow ? copy.thursdayShort : copy.thursday,
							count(INDEX_LAST),
							"wt-film-dim",
						],
					] as const
				).map(([name, tag, num, tone], i) => (
					<g key={name} data-f={name}>
						<text
							x={W * (narrow ? [0.27, 0.73][i] : [0.32, 0.68][i])}
							y={H * 0.34}
							textAnchor="middle"
							className="wt-film-tag"
							style={{ fontSize: T.small }}
						>
							{t(tag).toUpperCase()}
						</text>
						<text
							x={W * (narrow ? [0.27, 0.73][i] : [0.32, 0.68][i])}
							y={H * 0.34 + T.num * 1.3}
							textAnchor="middle"
							className={`wt-film-num ${tone}`}
							style={{ fontSize: T.num }}
						>
							{num}
						</text>
					</g>
				))}
				<g data-f="c-pays">
					<text
						x={W / 2}
						y={H * 0.6}
						textAnchor="middle"
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(copy.payout).toUpperCase()}
					</text>
					<text
						x={W / 2}
						y={H * 0.6 + T.big * 0.9}
						textAnchor="middle"
						className="wt-film-num wt-film-gain"
						style={{ fontSize: T.big * 0.8 }}
					>
						{usd(PAYS, 0)}
					</text>
					<text
						x={W / 2}
						y={H * 0.6 + T.big * 0.9 + T.body * 2}
						textAnchor="middle"
						className="wt-film-num wt-film-dim"
						style={{ fontSize: text }}
					>
						{`(${count(INDEX_SETTLES)} − ${count(INDEX_STRIKE)}) × $100`}
					</text>
				</g>
			</g>

			{/* When exercise is allowed. */}
			{headline("w-head", copy.windowHead, copy.windowHead)}
			<g data-f="window">
				<path
					d={`M${L.dayX(0)} ${L.lineY}H${L.dayX(WINDOW_DAYS)}`}
					className="wt-axis"
					strokeWidth={2}
				/>
				{windowTicks.map((tick) => (
					<text
						key={tick.day}
						x={L.dayX(tick.day)}
						y={L.lineY + text * 2.2}
						textAnchor={
							tick.day === 0
								? "start"
								: tick.day === WINDOW_DAYS
									? "end"
									: "middle"
						}
						className="wt-small"
					>
						{t(tick.label)}
					</text>
				))}
				<g data-f="am-days">
					{Array.from({ length: WINDOW_DAYS + 1 }, (_, day) => day)
						.filter((day) => {
							const weekday = (1 + day) % 7;
							return weekday !== 6 && weekday !== 0;
						})
						.map((day) => (
							<circle
								key={day}
								cx={L.dayX(day)}
								cy={L.lineY}
								r={narrow ? 3.5 : 5}
								className="wt-chip"
							/>
						))}
				</g>
				<circle
					data-f="eu-day"
					cx={L.dayX(WINDOW_DAYS)}
					cy={L.lineY}
					r={narrow ? 6 : 8}
					className="wt-chip"
					stroke="var(--foreground)"
					strokeWidth={1.5}
				/>
				{(
					[
						["am-tag", copy.american],
						["eu-tag", copy.european],
					] as const
				).map(([name, label]) => (
					<text
						key={name}
						data-f={name}
						x={L.dayX(0)}
						y={L.lineY - text * 1.8}
						className="wt-film-type wt-film-accent"
						style={{ fontSize: T.head }}
					>
						{t(label)}
					</text>
				))}
			</g>

			{/* A few cents at the close. */}
			{headline("p1-head", copy.pinHead, copy.pinHead)}
			{/* The answer, a line under the close, as the brackets lock. */}
			<Lines
				name="p2-head"
				text={t(copy.autoHead)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.pinHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			{headline("p3-head", copy.writerHead, copy.writerHead)}
			<g data-f="pin">
				<path
					d={`M${L.pinX(PIN[0])} ${L.pinY}H${L.pinX(PIN[1])}`}
					className="wt-axis"
					strokeWidth={2}
				/>
				{/* On a phone a dime is too narrow for two labels: start at the strike. */}
				{(narrow
					? [100, 100.2, 100.4, 100.6]
					: [99.9, 100, 100.2, 100.4, 100.6]
				).map((v) => (
					<text
						key={v}
						x={L.pinX(v)}
						y={L.pinY + text * 2.2}
						textAnchor="middle"
						className="wt-small"
					>
						{`$${v.toFixed(2)}`}
					</text>
				))}
				<path
					data-f="pin-strike"
					d={`M${L.pinX(100)} ${L.pinY - 30}V${L.pinY + 8}`}
					className="wt-bracket"
				/>
				<text
					x={L.pinX(100)}
					y={L.pinY - 36}
					textAnchor="middle"
					className="wt-small wt-halo"
				>
					{t(copy.strike)}
				</text>
			</g>
			{(
				[
					["pin-dot", CALL_100.strike],
					["writer-dot", WRITER_CLOSE],
				] as const
			).map(([name, price]) => (
				<circle
					key={name}
					data-f={name}
					cx={L.pinX(price)}
					cy={L.pinY}
					r={7}
					className="wt-chip"
					stroke="var(--foreground)"
					strokeWidth={1.5}
				/>
			))}
			{(
				[
					["pin-price", CALL_100.strike],
					["writer-price", WRITER_CLOSE],
				] as const
			).map(([name, price]) => (
				<Word
					key={name}
					name={name}
					x={L.priceX}
					y={L.priceY}
					size={T.num}
					className="wt-film-num"
				>
					{usd(price * 100)}
				</Word>
			))}
			{(
				[
					["holder-close", copy.holderClose],
					["writer-close", copy.writerClose],
					["writer-after", copy.afterHours],
				] as const
			).map(([name, label]) => (
				<Word
					key={name}
					name={name}
					x={L.priceX}
					y={name === "writer-after" ? H * 0.51 : L.priceY - T.num * 1.3}
					size={T.small}
					className="wt-film-tag"
				>
					{t(label)}
				</Word>
			))}
			<Word
				name="pin-equation"
				x={W / 2}
				y={H * 0.51 - (narrow ? 6 : 0)}
				size={T.body}
				className="wt-film-num wt-film-dim"
			>
				{`${usd(HOLDER_CLOSE * 100)} − ${usd(CALL_100.strike * 100)} =`}
			</Word>
			<Word
				name="pin-value"
				x={W / 2}
				y={L.heroY}
				size={L.heroSize}
				className="wt-film-num wt-film-accent"
			>
				{usd(Math.round((HOLDER_CLOSE - CALL_100.strike) * 100))}
			</Word>
			<Word
				name="pin-unit"
				x={W / 2}
				y={L.heroY + text * 1.7 + (narrow ? 34 : 0)}
				size={T.small}
				className="wt-film-tag"
			>
				{t(copy.inTheMoney)}
			</Word>
			<Lines
				name="pin-default"
				text={t(copy.defaultAction)}
				x={W / 2}
				y={H * 0.82 + (narrow ? 12 : 0)}
				size={T.body}
				maxWidth={room}
				className="wt-film-type wt-film-dim"
			/>
			<Word
				name="writer-snapshot"
				x={W / 2}
				y={H * 0.59}
				size={T.body}
				className="wt-film-type wt-film-dim"
			>
				{`${t(copy.close)} ${usd(WRITER_CLOSE * 100)}`}
			</Word>
			<Word
				name="writer-exercise"
				x={W / 2}
				y={H * 0.72}
				size={T.body}
				className="wt-film-type"
			>
				{t(copy.holderExercises)}
			</Word>
			{(
				[
					["pin-ex", copy.exercised, "wt-film-accent"],
					["pin-as", copy.assigned, "wt-film-loss"],
				] as const
			).map(([name, label, tone]) => (
				<Word
					key={name}
					name={name}
					x={W / 2}
					y={H * 0.93}
					size={T.head}
					className={`wt-film-type ${tone}`}
				>
					{t(label)}
				</Word>
			))}
			<Brackets name="lock-pin" glow />
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
	const { tl, one, kids, show, hide, pop } = d;
	const flat = (name: string) =>
		kids(name).flatMap((el) =>
			el.tagName === "g" && !el.hasAttribute("data-f")
				? [...el.children]
				: [el],
		);
	const g = (name: string) => one<SVGGraphicsElement>(name);
	const fade = (targets: Element | Element[], at: number, duration = 0.5) =>
		tl.fromTo(targets, { opacity: 0 }, { opacity: 1, duration }, at);
	/** Only single text elements scale; figures settle without overshoot. */
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const heads = [
		"e1-head",
		"e2-head",
		"s1-head",
		"s2-head",
		"w-head",
		"p1-head",
		"p2-head",
		"p3-head",
	].map((name) => one(name));
	const holderMarks = [
		"pin-dot",
		"pin-price",
		"holder-close",
		"pin-equation",
		"pin-value",
		"pin-unit",
		"pin-default",
		"pin-ex",
	].map((name) => one(name));
	const writerMarks = [
		"writer-dot",
		"writer-price",
		"writer-close",
		"writer-after",
		"writer-snapshot",
		"writer-exercise",
		"pin-as",
	].map((name) => one(name));
	const moveDot = (
		name: string,
		from: number,
		to: number,
		at: number,
		duration: number,
	) => {
		const state = { price: from };
		const dot = one(`${name}-dot`);
		const price = one(`${name}-price`);
		tl.fromTo(
			state,
			{ price: from },
			{
				price: to,
				duration,
				ease: "power2.inOut",
				immediateRender: false,
				onUpdate: () => {
					gsap.set(dot, { attr: { cx: L.pinX(state.price) } });
					price.textContent = usd(Math.round(state.price * 100));
				},
			},
			at,
		);
	};

	d.hidden([
		...flat("q"),
		...heads,
		...flat("exit"),
		...kids("shares"),
		...kids("cash"),
		...flat("window"),
		...flat("pin"),
		...holderMarks,
		...writerMarks,
		g("lock-pin"),
		...kids("claim"),
	]);

	tl.addLabel("open", 0);
	d.open(0);

	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.4);
	show([one("q-sell-tag"), one("q-ex-tag")], 4.6);
	word(one("q-sell-num"), 4.7);
	word(one("q-ex-num"), 5.0);
	show(one("q-line"), 5.3);

	// The two carried figures keep their original paths and landing times.
	tl.addLabel("exit", 8.8);
	hide([one("q-tag"), one("q-line"), one("q-sell-tag"), one("q-ex-tag")], 8.8);
	show(heads[0], 9.0);
	show(
		flat("exit").filter((el) => el.tagName === "path"),
		9.0,
	);
	show([one("d-oct4"), one("exit-basis")], 9.1);
	show([one("l-sell"), one("l-ex")], 9.2);
	d.carry(g("q-sell-num"), g("v-sell"), 9.3, { duration: 1, arc: "y" });
	d.carry(g("q-ex-num"), g("v-ex"), 9.7, { duration: 1, arc: "y" });
	const grow = (name: string, from: number, cents: number, at: number) =>
		tl.fromTo(
			one(name),
			{ attr: { y: L.barBottom - L.barH(from), height: 0 } },
			{
				attr: { y: L.barBottom - L.barH(from + cents), height: L.barH(cents) },
				duration: 0.5,
				ease: "power2.out",
				immediateRender: false,
			},
			at,
		);
	tl.set([one("b-sell"), one("b-sell-in")], { opacity: 1 }, 10.3);
	grow("b-sell-in", 0, OCT4.intrinsic, 10.3);
	// The cap starts at zero height and only enters after its supporting bar settles.
	fade(one("b-sell-tv"), 10.8);
	const cap = one("b-sell-tv");
	const sale = one("v-sell");
	const timeLabel = one("component-tv");
	const comparison = { elapsed: 0 };
	const growthEase = gsap.parseEase("power2.out");
	const expiryEase = gsap.parseEase("power2.inOut");
	// One clock owns the cap for growth, rest and expiry, including reverse seeks.
	tl.fromTo(
		comparison,
		{ elapsed: 0 },
		{
			elapsed: 2.8,
			duration: 2.8,
			ease: "none",
			immediateRender: false,
			onUpdate: () => {
				const expiring = comparison.elapsed >= 2;
				const time = expiring
					? OCT4.time +
						(OCT18.time - OCT4.time) *
							expiryEase(Math.min(1, (comparison.elapsed - 2) / 0.8))
					: OCT4.time * growthEase(Math.min(1, comparison.elapsed / 0.5));
				gsap.set(cap, {
					attr: {
						y: L.barBottom - L.barH(OCT4.intrinsic + time),
						height: L.barH(time),
					},
				});
				// During construction this is the known bid carried from the question;
				// at expiry the cap, its component amount and the total change together.
				const cents = expiring ? Math.round(time) : OCT4.time;
				gsap.set(sale, {
					attr: {
						y:
							L.barBottom -
							L.barH(OCT4.intrinsic + (expiring ? time : OCT4.time)) -
							10,
					},
				});
				sale.textContent = usd(OCT4.intrinsic + cents);
				timeLabel.textContent = `${usd(cents)} ${d.t(copy.time)}`;
			},
		},
		10.8,
	);
	tl.set([one("b-ex"), one("b-ex-in")], { opacity: 1 }, 10.7);
	grow("b-ex-in", 0, OCT4.intrinsic, 10.7);
	fade([one("component-in"), one("component-tv")], 11.3);
	// Construction and component labels settle at 11.8; quiet until 12.8.
	hide(one("d-oct4"), 12.8);
	// A final-date label must not describe a cap that still contains time value.
	fade(one("d-oct18"), 13.6, 0.3);
	// Cap/total settle at 13.6, then the final date at 13.9. Equality is true first.
	show(heads[1], 13.9);

	tl.addLabel("settle", 17.5);
	hide([heads[0], heads[1], ...flat("exit")], 17.5);
	show(heads[2], 17.85);
	show(
		kids("shares").filter((el) => !el.getAttribute("data-f")),
		18.3,
	);
	kids("shares")
		.filter((el) => el.getAttribute("data-f")?.startsWith("flow-"))
		.forEach((flow, i) => {
			show(flow, 18.8 + i * 0.5, i ? "below" : "right");
		});

	tl.addLabel("cash", 21.4);
	d.swap(heads[2], heads[3], 21.4);
	hide(kids("shares"), 21.4);
	show(one("c-official"), 21.9);
	show(one("c-thursday"), 22.3);
	tl.to(one("c-thursday"), { opacity: 0.4, duration: 0.4 }, 23.1);
	// Fade the settled formula and payout as a group; never scale an SVG group.
	fade(one("c-pays"), 23.2, 0.55);

	tl.addLabel("window", 25.3);
	hide([heads[3], ...kids("cash")], 25.3);
	show(heads[4], 25.65);
	show(
		flat("window").filter(
			(el) =>
				!["am-days", "eu-day", "am-tag", "eu-tag"].includes(
					el.getAttribute("data-f") ?? "",
				),
		),
		25.8,
	);
	show(one("am-tag"), 25.8);
	// All eligible days light together, replacing the nonessential 0.03 s ripple.
	fade(one("am-days"), 26.2, 0.3);
	// American proof rests from 26.5 to 27.5.
	d.swap(one("am-tag"), one("eu-tag"), 27.5);
	tl.to(one("am-days"), { opacity: 0.12, duration: 0.4 }, 27.5);
	pop(one("eu-day"), 27.9);

	tl.addLabel("pin", 29.7);
	hide([heads[4], ...flat("window")], 29.7);
	show(heads[5], 30.05);
	// The calendar is entirely gone before a dollar scale occupies its lane.
	fade(flat("pin"), 30.05);
	fade(
		[one("pin-dot"), one("pin-price"), one("holder-close"), one("pin-default")],
		30.45,
	);
	moveDot("pin", CALL_100.strike, HOLDER_CLOSE, 30.45, 0.5);
	// The settled operands and result are revealed, never counted after an equals sign.
	fade([one("pin-equation"), one("pin-unit")], 30.95);
	fade(one("pin-value"), 30.95);
	d.lock(g("lock-pin"), 31.45, { around: one("pin-value"), pad: 8 });
	tl.addLabel("hero-lock", 31.45);
	show(heads[6], 31.45);
	word(one("pin-ex"), 31.65);

	tl.addLabel("writer", 35.05);
	d.swap([heads[5], heads[6]], heads[7], 35.05);
	hide([...holderMarks, g("lock-pin")], 35.05, 0.35, 0);
	// A separate writer case fades in at its own close, rather than walking the holder back.
	fade(
		[
			one("writer-dot"),
			one("writer-price"),
			one("writer-close"),
			one("writer-snapshot"),
		],
		35.4,
	);
	// Give the close a full second of quiet before the after-hours phase change.
	fade(one("writer-after"), 36.9);
	moveDot("writer", WRITER_CLOSE, WRITER_AFTER, 36.9, 0.9);
	// After hours settles at 37.8; its completed proof rests until 38.8.
	fade(one("writer-exercise"), 38.8, 0.55);
	word(one("pin-as"), 38.8);

	tl.addLabel("claim", 40.6);
	hide([heads[7], ...flat("pin"), ...writerMarks], 40.6);
	word(one("z-big"), 40.9);
	show(one("z-sub"), 41.2);

	tl.addLabel("next", 45);
	hide(kids("claim"), 45);
	d.close(45);
	return tl;
}

export const expirationSettlementFilm: Film = {
	id: "expiration-settlement",
	label: [
		`Expiration, as a short film: on Oct 4 the 95 call bids ${usd(OCT4.bid)} with ALFA at $102, where selling captures $7.00 of intrinsic value and $0.40 of time value and exercising only the $7.00, until Oct 18 when they are equal; settlement in 100 ALFA shares for $9,500, or in cash for IDX 500, ${usd(PAYS, 0)} at the official ${count(INDEX_SETTLES)} rather than Thursday's ${count(INDEX_LAST)}; American exercise on any trading day against European only at expiry; and a call exercised automatically at $100.02 when the holder takes no action and has not declined exercise, beside a separate writer whose call is exercised after ALFA closed at $99.98 and traded to $100.60`,
		`到期短片：10月4日 ALFA 为 $102，95 看涨买价 ${usd(OCT4.bid)}，卖出拿到 $7.00 内在价值加 $0.40 时间价值，行权只拿 $7.00，到 10月18日 两者相等；结算：ALFA 以 $9,500 交收 100 股，IDX 500 以现金结算，按官方的 ${count(INDEX_SETTLES)} 支付 ${usd(PAYS, 0)}，而不是周四的 ${count(INDEX_LAST)}；美式任一交易日都能行权，欧式只在到期日；以及 $100.02 时，持有人未操作且未指示放弃行权，于是默认自动行权；另一位义务方面对收盘 $99.98、盘后涨到 $100.60，持有人选择行权而被指派`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Expiration", "到期"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "exit", label: ["Sell or exercise", "卖出或行权"] },
		{ id: "settle", label: ["Shares", "股票交收"] },
		{ id: "cash", label: ["Cash", "现金结算"] },
		{ id: "window", label: ["Which days", "哪些天"] },
		{ id: "pin", label: ["A few cents", "几美分"] },
		{ id: "writer", label: ["The writer", "义务方"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一步"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
