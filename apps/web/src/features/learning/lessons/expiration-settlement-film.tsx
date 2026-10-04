import { gsap } from "gsap";
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
 * the question is what exercising gets instead. Exercise captures $7.00 and gives up the
 * $0.40 of time value; on Oct 18 the two are equal. Then settlement: ALFA delivers 100
 * shares for $9,500, an index pays cash, $2,500 at the official 5,025, not Thursday's
 * 5,030. Then the window: American any trading day, European only at expiry. Last, a few
 * cents: $100.02 is exercised automatically, and a writer at $99.98 can still be
 * assigned after hours.
 *
 *   open      0–4      "Expiration"
 *   question  4–9.5    Oct 4: sell at $7.40, or exercise?
 *   exit      9.5–17   sell $7.40 = $7.00 + $0.40; exercise $7.00; Oct 18 equal
 *   settle    17–25    shares for $9,500; IDX cash $2,500 at 5,025
 *   window    25–31.5  American any day; European at expiry
 *   pin       31.5–40.5 $100.02: exercised; $99.98 then $100.60: assigned; cut: the claim
 *   next      40.5–43  Next: the module checkpoint
 */

const END = 43;
const OCT4 = exitValues("oct4");
const OCT18 = exitValues("oct18");
const PAYS = indexPayout(INDEX_SETTLES);
const PIN = [99.9, 100.7] as const;

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
		pinY: H * (narrow ? 0.44 : 0.42),
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
	exitHead: [
		"Selling gets the $7.40 bid: $7.00 intrinsic plus $0.40 of time value.",
		"卖出拿到 $7.40 买价：$7.00 内在价值加 $0.40 时间价值。",
	],
	exitHeadShort: ["Sell: $7.00 + $0.40.", "卖出：$7.00 + $0.40。"],
	exHead: [
		"Exercising pays $9,500 for shares worth $10,200: $7.00, the time value given up.",
		"行权花 $9,500 买到值 $10,200 的股票：$7.00，放弃了时间价值。",
	],
	exHeadShort: [
		"Exercise: $7.00, no time value.",
		"行权：$7.00，没有时间价值。",
	],
	sameHead: [
		"On Oct 18 no time value is left: both capture $7.00.",
		"到 10月18日 时间价值归零：两者都是 $7.00。",
	],
	sameHeadShort: ["Oct 18: both $7.00.", "10月18日：都是 $7.00。"],
	intrinsic: ["intrinsic", "内在价值"],
	time: ["time value", "时间价值"],
	oct4: ["Oct 4", "10月4日"],
	oct18: ["Oct 18", "10月18日"],
	sharesHead: [
		"ALFA options settle in shares: $9,500 one way, 100 shares the other.",
		"ALFA 期权以股票交收：$9,500 一个方向，100 股另一个方向。",
	],
	sharesHeadShort: ["ALFA: shares for $9,500.", "ALFA：$9,500 换股票。"],
	cashHead: [
		`An index has nothing to deliver: IDX 500 pays cash at the official ${count(INDEX_SETTLES)}.`,
		`指数没有东西可交付：IDX 500 按官方的 ${count(INDEX_SETTLES)} 支付现金。`,
	],
	cashHeadShort: ["IDX 500: cash.", "IDX 500：现金。"],
	you: ["you · holder", "你 · 持有人"],
	writer: ["writer", "义务方"],
	cash: ["$9,500", "$9,500"],
	shares: ["100 ALFA", "100 股 ALFA"],
	official: ["official settlement", "官方结算值"],
	thursday: ["Thursday's close, ignored", "周四收盘，不算"],
	thursdayShort: ["Thu close · ignored", "周四收盘 · 不算"],
	payout: ["writer pays", "义务方支付"],
	windowHead: [
		"American (ALFA): exercise any trading day, so a writer can be assigned any day.",
		"美式（ALFA）：任一交易日都能行权，义务方任何一天都可能被指派。",
	],
	windowHeadShort: ["American: any day.", "美式：任一天。"],
	euroHead: [
		"European (IDX 500): exercise only at expiry. Before then, you sell.",
		"欧式（IDX 500）：只能在到期时行权。在此之前只能卖出。",
	],
	euroHeadShort: ["European: expiry only.", "欧式：仅到期日。"],
	american: ["American", "美式"],
	european: ["European", "欧式"],
	pinHead: [
		"Oct 18: ALFA closes at $100.02. Your 100 call is 2 cents in the money.",
		"10月18日：ALFA 收于 $100.02。你的 100 看涨实值 2 美分。",
	],
	pinHeadShort: ["Close $100.02: 2¢ in.", "收盘 $100.02：实值 2 美分。"],
	autoHead: [
		"$0.01 in the money is exercised automatically: Monday, 100 shares and $10,000 owed.",
		"实值 $0.01 就自动行权：周一你持有 100 股，欠 $10,000。",
	],
	autoHeadShort: ["Auto-exercised: $10,000 owed.", "自动行权：欠 $10,000。"],
	writerHead: [
		"Writer instead: $99.98 at the close, $100.60 after hours, and you're assigned.",
		"换成义务方：收盘 $99.98，盘后 $100.60，你被指派了。",
	],
	writerHeadShort: ["Writer: assigned after hours.", "义务方：盘后被指派。"],
	strike: ["strike $100", "行权价 $100"],
	exercised: ["exercised", "已行权"],
	assigned: ["assigned: short 100", "被指派：空头 100 股"],
	claimBig: [
		"Know how it ends before it does.",
		"结束之前，先弄清它怎么结束。",
	],
	claimSub: [
		"Sell or exercise, shares or cash, which days, and what a few cents at the close will do.",
		"卖出还是行权、股票还是现金、哪几天可以，以及收盘时几美分会带来什么。",
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
					y={L.barBottom - L.barH(parts.intrinsic + parts.time)}
					width={L.barW}
					height={L.barH(parts.time)}
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
							className={`wt-film-num ${i ? "wt-film-accent" : ""}`}
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
			{headline("e2-head", copy.exHead, copy.exHeadShort)}
			{headline("e3-head", copy.sameHead, copy.sameHeadShort)}
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
						["v-sell18", 0, usd(OCT18.bid), OCT18.bid],
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
			{headline("s1-head", copy.sharesHead, copy.sharesHeadShort)}
			{headline("s2-head", copy.cashHead, copy.cashHeadShort)}
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
			{headline("w1-head", copy.windowHead, copy.windowHeadShort)}
			{headline("w2-head", copy.euroHead, copy.euroHeadShort)}
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
			{headline("p1-head", copy.pinHead, copy.pinHeadShort)}
			{headline("p2-head", copy.autoHead, copy.autoHeadShort)}
			{headline("p3-head", copy.writerHead, copy.writerHeadShort)}
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
				<circle
					data-f="pin-dot"
					cx={L.pinX(100.02)}
					cy={L.pinY}
					r={7}
					className="wt-chip"
					stroke="var(--foreground)"
					strokeWidth={1.5}
				/>
			</g>
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
					y={H * 0.68}
					size={T.title}
					className={`wt-film-type ${tone}`}
				>
					{t(label)}
				</Word>
			))}
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
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
			time,
		);
	const heads = [
		"e1-head",
		"e2-head",
		"e3-head",
		"s1-head",
		"s2-head",
		"w1-head",
		"w2-head",
		"p1-head",
		"p2-head",
		"p3-head",
	].map((name) => one(name));
	const dot = one("pin-dot");

	d.hidden([
		...flat("q"),
		...heads,
		...flat("exit"),
		...kids("shares"),
		...kids("cash"),
		...flat("window"),
		...flat("pin"),
		one("pin-ex"),
		one("pin-as"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: sell or exercise ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	show([one("q-sell-tag"), one("q-ex-tag")], 4.9);
	word(one("q-sell-num"), 5.1);
	word(one("q-ex-num"), 5.5);
	show(one("q-line"), 6.6);

	// ——— exit: what each captures ———
	tl.addLabel("exit", 9.5);
	hide(flat("q"), 9.5);
	show(heads[0], 9.7, "above");
	show(
		flat("exit").filter((el) => el.tagName === "path"),
		10.0,
	);
	show(one("d-oct4"), 10.0);
	show(
		[one("b-sell"), one("b-sell-in"), one("b-sell-tv"), one("l-sell")],
		10.2,
	);
	show(one("v-sell"), 10.6);
	d.swap(heads[0], heads[1], 12.0);
	show([one("b-ex"), one("b-ex-in"), one("l-ex")], 12.4);
	show(one("v-ex"), 12.8);
	// Oct 18: the time value is gone.
	d.swap(heads[1], heads[2], 14.4);
	d.swap(one("d-oct4"), one("d-oct18"), 14.8);
	tl.to(
		one("b-sell-tv"),
		{
			attr: { y: L.barBottom - L.barH(OCT4.intrinsic), height: 0 },
			duration: 0.7,
			ease: "power2.inOut",
		},
		14.8,
	);
	hide(one("v-sell"), 14.8, 0.3);
	show(one("v-sell18"), 15.4);

	// ——— settle: shares or cash ———
	tl.addLabel("settle", 17);
	hide([heads[2], ...flat("exit")], 17.0);
	show(heads[3], 17.2, "above");
	kids("shares")
		.filter((el) => el.getAttribute("data-f")?.startsWith("flow-"))
		.forEach((flow, i) => {
			show(flow, 18.0 + i * 0.5, i ? "below" : "right");
		});
	show(
		kids("shares").filter((el) => !el.getAttribute("data-f")),
		17.5,
	);
	d.swap(heads[3], heads[4], 20.0);
	hide(kids("shares"), 20.0);
	show(one("c-official"), 20.5);
	show(one("c-thursday"), 20.9);
	tl.to(one("c-thursday"), { opacity: 0.4, duration: 0.4 }, 22.0);
	word(one("c-pays"), 22.0);

	// ——— window: which days ———
	tl.addLabel("window", 25);
	hide([heads[4], ...kids("cash")], 25.0);
	show(heads[5], 25.2, "above");
	show(
		flat("window").filter(
			(el) =>
				!["am-days", "eu-day", "am-tag", "eu-tag"].includes(
					el.getAttribute("data-f") ?? "",
				),
		),
		25.5,
	);
	show(one("am-tag"), 25.7);
	tl.fromTo(
		[...one("am-days").children],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.2, stagger: 0.03 },
		25.9,
	);
	tl.set(one("am-days"), { opacity: 1 }, 25.9);
	d.swap(heads[5], heads[6], 28.4);
	d.swap(one("am-tag"), one("eu-tag"), 28.8);
	tl.to(one("am-days"), { opacity: 0.12, duration: 0.4 }, 28.8);
	pop(one("eu-day"), 29.2);

	// ——— pin: a few cents ———
	tl.addLabel("pin", 31.5);
	hide([heads[6], ...flat("window")], 31.5);
	show(heads[7], 31.7, "above");
	show(
		flat("pin").filter((el) => el !== dot),
		32.0,
	);
	pop(dot, 32.4);
	d.swap(heads[7], heads[8], 33.8);
	word(one("pin-ex"), 34.2);
	// The writer's side.
	d.swap(heads[8], heads[9], 36.0);
	hide(one("pin-ex"), 36.0);
	const at = { price: 100.02 };
	tl.to(
		at,
		{
			price: 99.98,
			duration: 0.5,
			ease: "power2.inOut",
			onUpdate: () => gsap.set(dot, { attr: { cx: L.pinX(at.price) } }),
		},
		36.4,
	);
	tl.to(
		at,
		{
			price: 100.6,
			duration: 0.9,
			ease: "power2.inOut",
			onUpdate: () => gsap.set(dot, { attr: { cx: L.pinX(at.price) } }),
		},
		37.0,
	);
	word(one("pin-as"), 38.0);
	// Cut: the claim.
	hide([heads[9], ...flat("pin"), one("pin-as")], 39.4);
	word(one("z-big"), 39.7);
	show(one("z-sub"), 40.0);

	// ——— next ———
	tl.addLabel("next", 40.5);
	hide(kids("claim"), 40.9);
	d.close(40.9);
	return tl;
}

export const expirationSettlementFilm: Film = {
	id: "expiration-settlement",
	label: [
		`Expiration, as a short film: on Oct 4 the 95 call bids ${usd(OCT4.bid)} with ALFA at $102, where selling captures $7.00 of intrinsic value and $0.40 of time value and exercising only the $7.00, until Oct 18 when they are equal; settlement in 100 ALFA shares for $9,500, or in cash for IDX 500, ${usd(PAYS, 0)} at the official ${count(INDEX_SETTLES)} rather than Thursday's ${count(INDEX_LAST)}; American exercise on any trading day against European only at expiry; and a call exercised automatically at $100.02, beside a writer assigned after ALFA closed at $99.98 and traded to $100.60`,
		`到期短片：10月4日 ALFA 为 $102，95 看涨买价 ${usd(OCT4.bid)}，卖出拿到 $7.00 内在价值加 $0.40 时间价值，行权只拿 $7.00，到 10月18日 两者相等；结算：ALFA 以 $9,500 交收 100 股，IDX 500 以现金结算，按官方的 ${count(INDEX_SETTLES)} 支付 ${usd(PAYS, 0)}，而不是周四的 ${count(INDEX_LAST)}；美式任一交易日都能行权，欧式只在到期日；以及 $100.02 时自动行权的看涨，旁边是收盘 $99.98、盘后涨到 $100.60 而被指派的义务方`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Expiration", "到期"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "exit", label: ["Sell or exercise", "卖出或行权"] },
		{ id: "settle", label: ["Shares or cash", "股票或现金"] },
		{ id: "window", label: ["Which days", "哪些天"] },
		{ id: "pin", label: ["A few cents", "几美分"] },
		{ id: "next", label: ["Next", "下一步"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
