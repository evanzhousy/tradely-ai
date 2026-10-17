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
	toneClass,
	Word,
} from "../walkthrough/film-kit";
import {
	ALFA_AT,
	AUTO_EXERCISE_THRESHOLD,
	CALL_100,
	CALL_100_DELIVERY,
	EXPIRY_SCENARIOS,
	exitValues,
	expiryOutcome,
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
 * window: American any trading day, European only at expiry. The hero: a near-strike close
 * leaves the call in the money, and glowing brackets lock as it is exercised automatically;
 * the Monday account shows shares and strike cash due. Last, a writer:
 * a close just below the strike, then an after-hours rise; holder exercise precedes Monday assignment.
 *
 *   open      0–4        "Expiration"
 *   question  4–8.8      Oct 4: sell at $7.40, or exercise?
 *   exit      8.8–17.5   labelled parts; Oct 18 equality before the answer
 *   settle    17.5–21.4  ALFA: 100 shares for $9,500
 *   cash      21.4–25.3  IDX 500: $2,500 at the official 5,025
 *   window    25.3–29.7  American trading days; European at expiry
 *   pin       29.7–35.05  the close minus strike makes a bracketed expiry value
 *   writer    35.05–40.6 settled close/after-hours pair, exercise, then Monday short shares
 *   claim     40.6–45.0 check exercise instructions and the broker's cutoff
 *   next      45.0–47.5 Next: the module checkpoint
 */

const END = 47.5;
const OCT4 = exitValues("oct4");
const OCT18 = exitValues("oct18");
const PAYS = indexPayout(INDEX_SETTLES);
const HOLDER_CLOSE = EXPIRY_SCENARIOS.holder.close;
const WRITER_CLOSE = EXPIRY_SCENARIOS.writer.close;
const WRITER_AFTER = EXPIRY_SCENARIOS.writer.after;
const HOLDER_MONEYNESS_CENTS = Math.round(
	(HOLDER_CLOSE - CALL_100.strike) * 100,
);
const HOLDER_OUTCOME = expiryOutcome({
	role: "holder",
	close: HOLDER_CLOSE,
	after: null,
	decline: false,
	reveal: true,
});

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const barTop = H * (narrow ? 0.34 : 0.32);
	const barBottom = H * (narrow ? 0.72 : 0.74);
	const top = OCT4.bid;
	const barH = (cents: number) => (cents / top) * (barBottom - barTop);
	const barX = (i: number) =>
		width / 2 + (i === 0 ? -1 : 1) * room * (narrow ? 0.2 : 0.16);
	const barW = Math.min(room * 0.22, 120);
	const capY = (time: number) => barBottom - barH(OCT4.intrinsic + time / 2);
	const capLabelY = (time: number) =>
		narrow
			? H * 0.23 + frame.type.small * 1.3
			: capY(time) + frame.type.body * 0.35;
	const capLink = (time: number) => {
		const left = barX(0) - barW / 2;
		return narrow
			? `M${left - 10} ${capLabelY(time) + 7}V${capY(time)}H${left}`
			: `M${margin + room * 0.2} ${capY(time)}H${left}`;
	};
	return {
		...frame,
		barBottom,
		barH,
		barX,
		barW,
		capLabelY,
		capLink,
		dayX: (day: number) => margin + (day / WINDOW_DAYS) * room,
		dayY: (row: number) => H * (row === 0 ? 0.39 : 0.64),
		priceX: width * 0.64,
		priceY: H * 0.3,
		heroSize: frame.type.big * (narrow ? 0.9 : 0.78),
		heroY: narrow ? H * 0.54 : H * 0.51 + frame.type.big * 0.78 * 1.15,
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
	sameHead: ["By Oct 18: both $7.00.", "10月18日：两者均为 $7.00。"],
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
	thursday: ["Not Thu close", "不计周四收盘"],
	payout: ["writer pays", "义务方支付"],
	windowHead: [
		"American: any session; European: expiry.",
		"美式：交易日；欧式：仅到期日。",
	],
	american: ["American", "美式"],
	european: ["European", "欧式"],
	pinHead: ["At expiry: a $100-strike call.", "到期：$100 行权价看涨。"],
	autoHead: ["Broker threshold sets auto-exercise.", "券商门槛决定自动行权。"],
	holderClose: ["holder · Oct 18 close", "持有人 · 10月18日收盘"],
	writerClose: ["ALFA · close", "ALFA · 收盘"],
	afterHours: ["ALFA · after hours", "ALFA · 盘后"],
	inTheMoney: ["in the money · per share", "实值 · 每股"],
	defaultAction: ["No action; threshold met.", "未操作；门槛已达。"],
	holderExercises: ["Holder exercises", "持有人选择行权"],
	writerHead: [
		"A writer can be assigned after hours.",
		"义务方在盘后也可能被指派。",
	],
	strike: ["strike $100", "行权价 $100"],
	sharesUnit: ["shares", "股"],
	due: ["due", "应付"],
	monday: ["Monday", "周一"],
	mondayAccount: ["Monday account", "周一账户"],
	mondayAssigned: ["Assigned Monday", "周一被指派"],
	shortShares: ["ALFA shares · short", "ALFA 股 · 空头"],
	claimBig: ["A few cents can mean shares.", "几美分也能变成股票。"],
	claimSub: [
		"Send exercise instructions before cutoff.",
		"券商截止前确认行权指示。",
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
				<text
					data-f="component-in"
					x={L.barX(0)}
					y={
						L.barBottom -
						L.barH(OCT4.intrinsic) * 0.5 -
						(narrow ? T.small : T.body) * 0.3
					}
					textAnchor="middle"
					className="wt-film-type"
					style={{
						fontSize: narrow ? T.small : T.body,
						fill: "var(--film-bg)",
					}}
				>
					<tspan x={L.barX(0)}>{usd(OCT4.intrinsic)}</tspan>
					<tspan x={L.barX(0)} dy={(narrow ? T.small : T.body) * 1.35}>
						{t(copy.intrinsic)}
					</tspan>
				</text>
				<g data-f="component-tv">
					<path
						data-f="component-tv-link"
						d={L.capLink(OCT4.time)}
						className="wt-film-link"
						style={{ stroke: "var(--diagram-accent)" }}
					/>
					{narrow && (
						<text
							data-f="component-tv-label"
							x={margin}
							y={H * 0.23}
							className="wt-film-type wt-film-accent"
							style={{ fontSize: T.small }}
						>
							{t(copy.time)}
						</text>
					)}
					<text
						data-f="component-tv-amount"
						x={margin}
						y={L.capLabelY(OCT4.time)}
						className="wt-film-type wt-film-accent"
						style={{ fontSize: narrow ? T.small : T.body }}
					>
						{narrow ? usd(OCT4.time) : `${usd(OCT4.time)} ${t(copy.time)}`}
					</text>
				</g>
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
						[0, copy.cash, 1],
						[1, copy.shares, -1],
					] as const
				).map(([k, label, dir]) => {
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
								fill="none"
								stroke="var(--tone-ink)"
								strokeWidth={2}
								strokeLinecap="round"
							/>
							<path
								d={
									dir > 0
										? `M${x1 - 8} ${flowY(k) - 5}L${x1} ${flowY(k)}L${x1 - 8} ${flowY(k) + 5}`
										: `M${x0 + 8} ${flowY(k) - 5}L${x0} ${flowY(k)}L${x0 + 8} ${flowY(k) + 5}`
								}
								fill="none"
								stroke="var(--tone-ink)"
								strokeWidth={2}
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
							<text
								x={(x0 + x1) / 2}
								y={flowY(k) - 8}
								textAnchor="middle"
								className="wt-film-num"
								style={{ fontSize: text }}
							>
								{t(label)}
							</text>
						</g>
					);
				})}
			</g>
			<g data-f="cash">
				{/* The official input lives only in this calculation, never in a duplicate quote. */}
				<g data-f="c-official">
					<Word
						name="c-official-label"
						x={W / 2}
						y={H * 0.34}
						size={T.small}
						className="wt-film-tag"
					>
						{t(copy.official).toUpperCase()}
					</Word>
					<Word
						name="c-calculation"
						x={W / 2}
						y={H * 0.34 + T.num * 1.3}
						size={T.head}
						className="wt-film-num"
					>
						{`(${count(INDEX_SETTLES)} − ${count(INDEX_STRIKE)}) × $100`}
					</Word>
				</g>
				<g data-f="c-thursday">
					<Word
						name="c-thursday-label"
						x={W / 2}
						y={H * 0.85}
						size={T.small}
						className="wt-film-tag"
					>
						{t(copy.thursday).toUpperCase()}
					</Word>
					<Word
						name="c-thursday-value"
						x={W / 2}
						y={H * 0.85 + T.num * 1.3}
						size={T.num}
						className="wt-film-num"
					>
						{count(INDEX_LAST)}
					</Word>
				</g>
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
						className={`wt-film-num ${toneClass.focus}`}
						style={{ fontSize: T.big * 0.8 }}
					>
						{usd(PAYS, 0)}
					</text>
				</g>
			</g>

			{/* When exercise is allowed. */}
			{headline("w-head", copy.windowHead, copy.windowHead)}
			<g data-f="window">
				<g data-f="window-scaffold">
					{([copy.american, copy.european] as const).map((label, row) => (
						<g key={label[0]}>
							<Word
								name={row === 0 ? "am-tag" : "eu-tag"}
								x={margin}
								y={L.dayY(row) - T.head * 1.7}
								size={T.head}
								anchor="start"
								className="wt-film-type wt-film-accent"
							>
								{t(label)}
							</Word>
							<path
								d={`M${L.dayX(0)} ${L.dayY(row)}H${L.dayX(WINDOW_DAYS)}`}
								className="wt-axis"
								strokeWidth={2}
							/>
							{windowTicks
								.filter((_, i) => !narrow || i % 2 === 0)
								.map((tick) => (
									<text
										key={tick.day}
										x={L.dayX(tick.day)}
										y={L.dayY(row) + text * 2.2}
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
						</g>
					))}
				</g>
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
								cy={L.dayY(0)}
								r={narrow ? 3.5 : 5}
								className="wt-chip"
							/>
						))}
				</g>
				<circle
					data-f="eu-day"
					cx={L.dayX(WINDOW_DAYS)}
					cy={L.dayY(1)}
					r={narrow ? 6 : 8}
					className="wt-chip"
					stroke="var(--foreground)"
					strokeWidth={1.5}
				/>
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
			<Word
				name="pin-reference"
				x={margin + room * 0.25}
				y={L.priceY}
				size={T.body}
				className="wt-film-type wt-film-dim"
			>
				{t(copy.strike)}
			</Word>
			<Word
				name="pin-price"
				x={L.priceX}
				y={L.priceY}
				size={T.num}
				className="wt-film-num"
			>
				{usd(HOLDER_CLOSE * 100)}
			</Word>
			<Word
				name="holder-close"
				x={L.priceX}
				y={L.priceY - T.num * 1.3}
				size={T.small}
				className="wt-film-tag"
			>
				{t(copy.holderClose)}
			</Word>
			<g data-f="writer-prices">
				{(
					[
						["writer-close", copy.writerClose, WRITER_CLOSE, 0.25],
						["writer-after", copy.afterHours, WRITER_AFTER, 0.75],
					] as const
				).map(([name, label, price, column]) => (
					<g key={name}>
						<Word
							name={name}
							x={margin + room * column}
							y={H * 0.39 - T.num * 1.3}
							size={T.small}
							className="wt-film-tag"
						>
							{t(label)}
						</Word>
						<Word
							name={`${name}-price`}
							x={margin + room * column}
							y={H * 0.39}
							size={T.num}
							className="wt-film-num"
						>
							{usd(price * 100)}
						</Word>
					</g>
				))}
				<Word
					name="writer-strike"
					x={W / 2}
					y={H * 0.57}
					size={T.body}
					className="wt-film-type wt-film-dim"
				>
					{t(copy.strike)}
				</Word>
			</g>
			<Word
				name="pin-equation"
				x={W / 2}
				y={H * (narrow ? 0.39 : 0.51)}
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
				y={L.heroY + text * 1.7 + (narrow ? 40 : 0)}
				size={T.small}
				className="wt-film-tag"
			>
				{t(copy.inTheMoney)}
			</Word>
			<Lines
				name="pin-default"
				text={t(copy.defaultAction)}
				// Under the holder's close it follows from; on a phone, below the hero.
				x={narrow ? W / 2 : L.priceX}
				y={narrow ? H * 0.74 : L.priceY + T.num * 1.05}
				size={T.body}
				maxWidth={room}
				className="wt-film-type wt-film-dim"
			/>
			<Word
				name="writer-exercise"
				x={W / 2}
				y={H * 0.66}
				size={T.body}
				className="wt-film-type"
			>
				{t(copy.holderExercises)}
			</Word>
			{/* The existing answer supplies exercise; this after-beat supplies the account. */}
			<g data-f="pin-ex">
				<rect
					data-f="pin-ex-panel"
					x={margin + room * (narrow ? 0 : 0.12)}
					y={H * 0.79}
					width={room * (narrow ? 1 : 0.76)}
					height={H * 0.18}
					rx={12}
					className="wt-panel-shape"
				/>
				<Word
					name="holder-shares"
					x={margin + room * (narrow ? 0.25 : 0.3)}
					y={H * 0.91}
					size={T.head * (narrow ? 1.15 : 1)}
					className={`wt-film-num ${toneClass.focus}`}
				>
					{`${count(CALL_100_DELIVERY.shares)} ${t(copy.sharesUnit)}`}
				</Word>
				<Word
					name="holder-monday"
					x={W / 2}
					y={H * 0.83}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.mondayAccount)}
				</Word>
				<Word
					name="holder-due"
					x={margin + room * (narrow ? 0.75 : 0.7)}
					y={H * 0.91}
					size={T.head * (narrow ? 1.15 : 1)}
					className="wt-film-num"
				>
					{`${usd(CALL_100_DELIVERY.cashCents, 0)} ${t(copy.due)}`}
				</Word>
			</g>
			<g data-f="pin-as">
				<Word
					name="writer-monday"
					x={W / 2}
					y={H * 0.88 - T.title * 1.6}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.mondayAssigned)}
				</Word>
				<Word
					name="writer-short"
					x={W / 2}
					y={H * 0.88}
					size={T.title}
					className={`wt-film-num ${toneClass.focus}`}
				>
					{`−${count(CALL_100_DELIVERY.shares)}`}
				</Word>
				<Word
					name="writer-unit"
					x={W / 2}
					y={H * 0.88 + T.small * 2.2 + T.title * 0.15}
					size={T.small}
					className={`wt-film-tag ${toneClass.focus}`}
				>
					{t(copy.shortShares)}
				</Word>
			</g>
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
	const { tl, one, kids, show, hide } = d;
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
		"pin-reference",
		"pin-price",
		"holder-close",
		"pin-equation",
		"pin-value",
		"pin-unit",
		"pin-default",
		"pin-ex",
	].map((name) => one(name));
	const writerMarks = ["writer-prices", "writer-exercise", "pin-as"].map(
		(name) => one(name),
	);

	d.hidden([
		...flat("q"),
		...heads,
		...flat("exit"),
		...kids("shares"),
		...kids("cash"),
		...flat("window"),
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

	// Scaffold settles at 9.7, then stays still for a full second before data flies.
	tl.addLabel("exit", 8.8);
	hide([one("q-tag"), one("q-line"), one("q-sell-tag"), one("q-ex-tag")], 8.8);
	show(heads[0], 9.0);
	show(
		flat("exit").filter((el) => el.tagName === "path"),
		9.0,
	);
	show([one("d-oct4"), one("exit-basis")], 9.1);
	show([one("l-sell"), one("l-ex")], 9.2);
	d.carry(g("q-sell-num"), g("v-sell"), 10.7, { duration: 0.4, arc: "y" });
	d.carry(g("q-ex-num"), g("v-ex"), 10.8, { duration: 0.4, arc: "y" });
	const cap = one("b-sell-tv");
	const sale = one("v-sell");
	const timeLabel = one("component-tv-amount");
	const timeLink = one("component-tv-link");
	// The zero-height authored cap is prepared while its whole bar is still hidden.
	// Timeline-owned attributes restore both directions when the film is scrubbed.
	tl.set(
		cap,
		{
			attr: {
				y: L.barBottom - L.barH(OCT4.bid),
				height: L.barH(OCT4.time),
			},
		},
		11.2,
	);
	fade([one("b-sell"), one("b-ex")], 11.2);
	const comparisonMarks = [cap, sale, timeLabel, timeLink];
	const comparisonAttributes = (time: number) => {
		const attributes = (_: number, target: Element) => {
			if (target === cap)
				return {
					y: L.barBottom - L.barH(OCT4.intrinsic + time),
					height: L.barH(time),
				};
			if (target === sale)
				return { y: L.barBottom - L.barH(OCT4.intrinsic + time) - 10 };
			if (target === timeLabel) return { y: L.capLabelY(time) };
			return { d: L.capLink(time) };
		};
		// GSAP processes function-valued plugin vars per target; AttrVars omits this form.
		return attributes as unknown as gsap.TweenVars["attr"];
	};
	// There is no spare second between the accepted rests for a readable count.
	// Compare two settled states instead: fade out the Oct 4 marks, replace all
	// geometry and amounts together while invisible, then fade in expiry's state.
	// No eased clock or intermediate arithmetic is implied; the exercise bar stays up.
	tl.to(
		comparisonMarks,
		{ opacity: 0, duration: 0.4, ease: "power2.in" },
		12.8,
	);
	tl.set(comparisonMarks, { attr: comparisonAttributes(OCT18.time) }, 13.2);
	tl.set(sale, { textContent: usd(OCT18.bid) }, 13.2);
	tl.set(
		timeLabel,
		{
			textContent: L.narrow
				? usd(OCT18.time)
				: `${usd(OCT18.time)} ${d.t(copy.time)}`,
		},
		13.2,
	);
	tl.to(
		comparisonMarks,
		{ opacity: 1, duration: 0.4, ease: "power2.out" },
		13.2,
	);
	fade([one("component-in"), one("component-tv")], 11.3);
	// Construction and component labels settle at 11.8; quiet until 12.8.
	hide(one("d-oct4"), 12.8);
	// A final-date label must not describe a cap that still contains time value.
	fade(one("d-oct18"), 13.6, 0.3);
	// Final comparison settles at 13.6, then the date at 13.9. Equality is true first.
	show(heads[1], 13.9);

	tl.addLabel("settle", 17.5);
	hide([heads[0], heads[1], ...flat("exit")], 17.5);
	show(heads[2], 17.85);
	fade(
		kids("shares").filter((el) => !el.getAttribute("data-f")),
		17.8,
	);
	// Parties settle at 18.3, then stand for 1 s. Cash and shares are one exchange;
	// reveal both in place, keeping the completed proof's 19.8–21.4 rest intact.
	fade([one("flow-0"), one("flow-1")], 19.3);

	tl.addLabel("cash", 21.4);
	d.swap(heads[2], heads[3], 21.4);
	hide(kids("shares"), 21.4);
	// One calculation replaces the duplicated official quote. Both inputs settle at
	// 22.2; the excluded close gets a full second before focus moves to the payout.
	fade([one("c-official"), one("c-thursday")], 21.7);
	tl.to(one("c-thursday"), { opacity: 0.3, duration: 0.4 }, 23.2);
	// Keep the accepted payout settlement/quiet interval: 23.75–25.3. Its calculation
	// is already still and stays readable for 3.1 s, from 22.2 until the cut.
	fade(one("c-pays"), 23.2, 0.55);

	tl.addLabel("window", 25.3);
	hide([heads[3], ...kids("cash")], 25.3);
	show(heads[4], 25.65);
	fade(one("window-scaffold"), 25.65);
	// Both rows are still by 26.15, one second before either eligibility set enters.
	fade([one("am-days"), one("eu-day")], 27.15, 0.3);
	// Both completed proofs rest from 27.45 to 29.7 (2.25 s).

	tl.addLabel("pin", 29.7);
	hide([heads[4], ...flat("window")], 29.7);
	show(heads[5], 30.05);
	// A known close is compared exactly; no ruler or transient closing prices.
	fade(one("pin-reference"), 30.05);
	// Build the comparison in order; each mark keeps the 0.3 s motion floor.
	fade([one("pin-price"), one("holder-close"), one("pin-default")], 30.45, 0.3);
	fade(one("pin-equation"), 30.55, 0.3);
	fade([one("pin-value"), one("pin-unit")], 30.65, 0.3);
	// The settled operands and result are revealed, never counted after an equals sign.
	d.lock(g("lock-pin"), 30.95, { around: one("pin-value"), pad: 8 });
	tl.addLabel("hero-lock", 30.95);
	fade(heads[6], 30.95);
	// Answer settles at 31.45 (lock at 31.4), then 1.5 s of undivided quiet.
	fade(one("pin-ex"), 32.95, 0.3);

	tl.addLabel("writer", 35.05);
	d.swap([heads[5], heads[6]], heads[7], 35.05);
	hide([...holderMarks, g("lock-pin")], 35.05, 0.35, 0);
	// The writer comparison arrives as two explicitly labelled, settled states.
	// Remove the walk, its axis and the repeated close snapshot to fund cause → account.
	fade(one("writer-prices"), 35.4);
	// Both prices settle at 35.9, then a full second of quiet.
	fade(one("writer-exercise"), 36.9, 0.55);
	// Holder exercise settles at 37.45, then a full second of quiet.
	fade(one("pin-as"), 38.45, 0.55);
	// Monday's account settles at 39.0, then rests for 1.6 s before the claim.

	tl.addLabel("claim", 40.6);
	hide([heads[7], ...writerMarks], 40.6);
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
		`Expiration, as a short film: on Oct 4 the 95 call bids ${usd(OCT4.bid)} with ALFA at ${usd(ALFA_AT)}, where selling captures $7.00 of intrinsic value and $0.40 of time value and exercising only the $7.00, until Oct 18 when they are equal; settlement in ${count(CALL_100_DELIVERY.shares)} ALFA shares for ${usd(CALL_100_DELIVERY.cashCents, 0)}, or in cash for IDX 500, ${usd(PAYS, 0)} at the official ${count(INDEX_SETTLES)} rather than Thursday's ${count(INDEX_LAST)}; American exercise on any trading day against European only at expiry; at ${usd(HOLDER_CLOSE * 100)}, the ${usd(CALL_100.strike * 100, 0)} call is ${count(HOLDER_MONEYNESS_CENTS)} cents in the money, above the modeled ${usd(AUTO_EXERCISE_THRESHOLD * 100)} trigger. If the broker threshold is met and no opt-out is sent, ${HOLDER_OUTCOME.exercised ? `automatic exercise delivers ${count(CALL_100_DELIVERY.shares)} shares with ${usd(CALL_100_DELIVERY.cashCents, 0)} due Monday` : "it is not exercised automatically"}; a separate writer's call closes at ${usd(WRITER_CLOSE * 100)} and ALFA trades at ${usd(WRITER_AFTER * 100)} after hours`,
		`到期短片：10月4日 ALFA 为 ${usd(ALFA_AT)}，95 看涨买价 ${usd(OCT4.bid)}，卖出拿到 $7.00 内在价值加 $0.40 时间价值，行权只拿 $7.00，到 10月18日 两者相等；结算：ALFA 以 ${usd(CALL_100_DELIVERY.cashCents, 0)} 交收 ${count(CALL_100_DELIVERY.shares)} 股，IDX 500 以现金结算，按官方的 ${count(INDEX_SETTLES)} 支付 ${usd(PAYS, 0)}，而不是周四的 ${count(INDEX_LAST)}；美式任一交易日都能行权，欧式只在到期日；${usd(HOLDER_CLOSE * 100)} 收盘时，${usd(CALL_100.strike * 100, 0)} 看涨实值 ${count(HOLDER_MONEYNESS_CENTS)} 美分，高于模型 ${usd(AUTO_EXERCISE_THRESHOLD * 100)} 触发值。若券商门槛也达成且未发出放弃指示，${HOLDER_OUTCOME.exercised ? `期权会自动行权，周一持有 ${count(CALL_100_DELIVERY.shares)} 股并应付 ${usd(CALL_100_DELIVERY.cashCents, 0)}` : "期权不会自动行权"}；另一位义务方的看涨收于 ${usd(WRITER_CLOSE * 100)}，ALFA 盘后升至 ${usd(WRITER_AFTER * 100)}，持有人行权后可能导致周一被指派`,
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
