import { type Copy, pick } from "@/content/world";
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
	breakEven,
	daysLeft,
	decayPerDay,
	deltaOf,
	dollars,
	EXPIRY_SPOT,
	type ExpiryRowId,
	exact,
	expiryCalls,
	expiryName,
	fixed2,
	paid,
	perShare,
	resultAtExpiry,
	resultSoon,
	SOON_SPOT,
	SPOT,
	type StrikeId,
	signedDollars,
	stock,
	strikeCall,
	strikeCalls,
	worthAtExpiry,
} from "./strike-and-expiry-model";

/*
 * Strike and expiry, as a film. A dark stage; type carries the claims and one table carries
 * the proof. One view: ALFA, $100 on Sep 16, will be higher in a month. Three Oct 18 calls
 * can say it, the 95, the 100 and the 105, and each row of the table is one of them: what
 * it costs, where it breaks even, and what one move in ALFA does to it. Both moves are
 * suppositions, said as such: a day later with ALFA at $102 all three could be sold for a
 * gain, the largest delta for the most dollars. Then the hero: ALFA closes at $106 on
 * Oct 18, the results land row by row, +$370, +$180 and, last and largest, −$115: glowing
 * brackets lock on the call that loses although ALFA rose $6 and stay to the cut, while the
 * other rows' break-evens step back and leave its $107.15. Last, the same strike with
 * three expiries: later costs more and loses less a day. The liquidity check (the spread and
 * open interest) is the playground's third scene, not a shot here.
 *
 *   open      0–4        "Strike and expiry"
 *   question  4–9.2      ALFA $100 → $106: three calls on the same rise, do all three gain?
 *   strikes   9.2–17     the table: in, at and out of the money; cost; break-even
 *   soon      17–23      Sep 17, ALFA $102: +$105, +$85, +$55 at the model bid
 *   result    23–31.5    hero: Oct 18, ALFA $106: +$370, +$180, −$115 locked at 27.35;
 *                        then the other break-evens dim, leaving its $107.15
 *   expiry    31.5–38.3  Sep 20, Oct 18, Nov 15: cost, break-even, time decay a day
 *   claim     38.3–43.1  strike sets how far, expiry sets how long
 *   next      43.1–45.6  Next: strategies
 */

const END = 45.6;
const ids: readonly StrikeId[] = ["itm", "atm", "otm"];
const HERO: StrikeId = "otm";
const hero = strikeCall(HERO).contract;
/** The strike the three expiries share. */
const SAME_STRIKE = expiryCalls[0].contract.strike;
/** How far each strike sits from ALFA's price, in whole dollars. */
const gap = (id: StrikeId) => Math.abs(strikeCall(id).contract.strike - SPOT);

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room, type: T } = frame;
	/** The table's columns: names start at the margin, results end at the right. */
	const costX = margin + room * (narrow ? 0.42 : 0.44);
	const evenX = margin + room * (narrow ? 0.61 : 0.64);
	// A phone's results end 4 px past the type's room, 24 px inside the frame: the notes
	// under them are set larger there and need the width.
	const endX = margin + room + (narrow ? 4 : -8);
	/** The grey notes under a row: the frame's small type, a size up on a phone. */
	const note = narrow ? T.body : T.small;
	const headerY = H * (narrow ? 0.29 : 0.28);
	const rows = (narrow ? [0.42, 0.59, 0.76] : [0.43, 0.6, 0.77]).map(
		(f) => H * f,
	);
	const figure = T.body * (narrow ? 1.1 : 1.25);
	/**
	 * A phone, and a wide frame under 800 px, have no room for a tag or a long header on one
	 * line: they stack them on two.
	 */
	const stack = width < 800;
	return {
		...frame,
		stack,
		costX,
		evenX,
		endX,
		headerY,
		rowY: (i: number) => rows[i],
		/** A row's name sits a little above its figures on a phone, over two lines of tag. */
		nameY: (i: number) => rows[i] - (stack ? 10 : 2),
		note,
		// A phone's note sits a little lower, clear of the moneyness word beside it.
		subY: (i: number) => rows[i] + note * (narrow ? 1.75 : 1.6),
		name: T.body * (narrow ? 1.15 : 1.25),
		figure,
		/** A result is the row's answer; the hero's is the loudest figure of the film. */
		result: T.num * 0.8,
		heroSize: T.num * 1.05,
		decay: narrow ? figure : T.num * 0.8,
	};
}

const tag = (id: StrikeId): Copy =>
	id === "atm"
		? [
				`at the money · strike at ALFA's ${stock(SPOT)}`,
				`平值 · 行权价等于 ALFA 的 ${stock(SPOT)}`,
			]
		: id === "itm"
			? [
					`in the money · strike ${stock(gap(id))} below ALFA`,
					`实值 · 行权价比 ALFA 低 ${stock(gap(id))}`,
				]
			: [
					`out of the money · strike ${stock(gap(id))} above ALFA`,
					`虚值 · 行权价比 ALFA 高 ${stock(gap(id))}`,
				];
/** A stacked row sets the term and what it means on two short lines. */
const tagTerm = (id: StrikeId): Copy => strikeCall(id).moneyness;
const tagMeans = (id: StrikeId): Copy =>
	id === "atm"
		? [`at ALFA's ${stock(SPOT)}`, "等于 ALFA 现价"]
		: id === "itm"
			? [`${stock(gap(id))} below ALFA`, `比 ALFA 低 ${stock(gap(id))}`]
			: [`${stock(gap(id))} above ALFA`, `比 ALFA 高 ${stock(gap(id))}`];

const copy = {
	title: ["Strike and expiry", "行权价与到期日"],
	titleSub: ["choosing a contract", "选一张合约"],
	qFrom: [`ALFA ${stock(SPOT)}`, `ALFA ${stock(SPOT)}`],
	qTo: [`→ ${stock(EXPIRY_SPOT)}`, `→ ${stock(EXPIRY_SPOT)}`],
	qLine: [
		"Three calls on the same rise. Do all three gain?",
		"同一段上涨，三张看涨都赚吗？",
	],
	strikesHead: [
		"Lower strike: costs more, needs less.",
		"行权价越低：越贵，要求的涨幅越小。",
	],
	soonHead: [
		`Say ALFA is at ${stock(SOON_SPOT)} a day later.`,
		`假设第二天 ALFA 到了 ${stock(SOON_SPOT)}。`,
	],
	heroHead: [
		`Say ALFA closes at ${stock(EXPIRY_SPOT)}.`,
		`假设到期时 ALFA 收在 ${stock(EXPIRY_SPOT)}。`,
	],
	heroHead2: [
		`The ${hero.strike} call still loses.`,
		`${hero.strike} 看涨仍然亏损。`,
	],
	expiryHead: [
		"Later expiry: costs more, decays slower.",
		"到期越晚：越贵，损耗越慢。",
	],
	headCalls: [
		`Oct 18 calls · ALFA ${stock(SPOT)}`,
		`10月18日 看涨 · ALFA ${stock(SPOT)}`,
	],
	headCallsShort: ["Oct 18 calls", "10月18日 看涨"],
	headCost: ["cost", "成本"],
	headEven: ["break-even", "盈亏平衡"],
	headSoonDate: ["Sep 17", "9月17日"],
	headExpiryDate: ["Oct 18", "10月18日"],
	headAt: ["at", "股价"],
	headExpiries: [
		`${SAME_STRIKE} calls · ALFA ${stock(SPOT)}`,
		`${SAME_STRIKE} 看涨 · ALFA ${stock(SPOT)}`,
	],
	headExpiriesShort: [`${SAME_STRIKE} calls`, `${SAME_STRIKE} 看涨`],
	headDecay: ["time decay a day", "每天时间损耗"],
	headDecayTop: ["decay", "时间损耗"],
	headDecayBottom: ["a day", "每天"],
	callWord: ["call", "看涨"],
	aShare: ["a share × 100", "每股 × 100"],
	model: ["model", "模型"],
	delta: ["delta", "Delta"],
	daysLeft: ["days left", "天后到期"],
	perContract: ["per contract · model", "每张 · 模型"],
	perContractShort: ["per contract", "每张"],
	claimBig: [
		"Strike sets how far. Expiry sets how long.",
		"行权价定涨多远，到期日定等多久。",
	],
	claimSub: [
		"The move ALFA needs; the time it has.",
		"ALFA 要涨多少；它有多少时间。",
	],
	nextBig: ["Next: strategies", "下一课：策略"],
	nextSub: ["one leg, many positions", "一条腿，多种可能的持仓"],
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
	const { height: H, type: T, room, narrow, stack, margin } = L;
	const W = width;
	const headline = (name: string, text: Copy, short: Copy = text, line = 0) => (
		<Lines
			name={name}
			text={t(narrow ? short : text)}
			x={margin}
			y={L.headY + line * T.head * 1.35}
			size={T.head}
			maxWidth={narrow ? room : room * 0.74}
			anchor="start"
		/>
	);
	/** A column header in small capitals; a long one stacks on two lines where room is short. */
	const header = (
		name: string,
		lines: readonly string[],
		x: number,
		anchor: "start" | "middle" | "end",
	) => (
		<text
			data-f={name}
			x={x}
			y={L.headerY - (lines.length - 1) * T.small * 1.3}
			textAnchor={anchor}
			className="wt-film-tag"
			style={{ fontSize: T.small }}
		>
			{lines.map((line, i) => (
				<tspan key={line} x={x} dy={i === 0 ? 0 : T.small * 1.3}>
					{line.toUpperCase()}
				</tspan>
			))}
		</text>
	);
	/** A row's name with what it means under it. */
	const named = (
		name: string,
		i: number,
		title: string,
		under: readonly string[],
	) => (
		<g data-f={name}>
			<text
				x={margin}
				y={L.nameY(i)}
				className="wt-film-type"
				style={{ fontSize: L.name }}
			>
				{title}
			</text>
			{under.map((line, k) => (
				<text
					key={line}
					x={margin}
					y={L.nameY(i) + L.note * (stack ? 1.4 + k * 1.25 : 1.6)}
					className="wt-film-type wt-film-dim"
					style={{ fontSize: L.note }}
				>
					{line}
				</text>
			))}
		</g>
	);
	/** A figure with a small line under it, as one mark. */
	const cell = (
		name: string,
		i: number,
		x: number,
		anchor: "middle" | "end",
		value: string,
		under: string,
		size = L.figure,
		tone = "",
	) => (
		<g data-f={name}>
			<text
				x={x}
				y={L.rowY(i)}
				textAnchor={anchor}
				className={`wt-film-num ${tone}`}
				style={{ fontSize: size }}
			>
				{value}
			</text>
			<text
				x={x}
				y={L.subY(i)}
				textAnchor={anchor}
				className="wt-film-type wt-film-dim"
				style={{ fontSize: L.note }}
			>
				{under}
			</text>
		</g>
	);
	const tone = (value: number) =>
		value > 0 ? toneClass.up : value < 0 ? toneClass.down : "wt-film-dim";
	// A phone's column has room for the bare product; the header says what it is.
	const costUnder = (contract: Parameters<typeof paid>[0]) =>
		narrow
			? `${perShare(paid(contract))}×100`
			: `${perShare(paid(contract))} ${t(copy.aShare)}`;
	const claim = t(copy.claimBig);
	const claimLines = lineCount(claim, room, T.title);
	const claimY = H * 0.46 - ((claimLines - 1) * T.title * 1.35) / 2;
	return (
		<>
			<Backdrop frame={L} />
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				<Word
					name="q-from"
					x={W / 2 - 8}
					y={H * 0.4}
					size={T.num}
					anchor="end"
					className="wt-film-num"
				>
					{t(copy.qFrom)}
				</Word>
				<Word
					name="q-to"
					x={W / 2 + 8}
					y={H * 0.4}
					size={T.num}
					anchor="start"
					className="wt-film-num wt-film-accent"
				>
					{t(copy.qTo)}
				</Word>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.58}
					size={T.head}
					maxWidth={room}
				/>
			</g>

			{headline("s-head", copy.strikesHead)}
			{headline("soon-head", copy.soonHead)}
			{headline("hero-head", copy.heroHead)}
			{headline("answer-head", copy.heroHead2, copy.heroHead2, 1)}
			{headline("e-head", copy.expiryHead)}

			{/* The rule under both tables' headers. */}
			<path
				data-f="rule"
				d={`M${margin} ${L.headerY + T.small * 0.9}H${margin + room}`}
				className="wt-grid"
			/>

			{/* Three strikes, one expiry: the proof of the first three shots. */}
			{header(
				"sh-calls",
				[t(narrow ? copy.headCallsShort : copy.headCalls)],
				margin,
				"start",
			)}
			{header("sh-cost", [t(copy.headCost)], L.costX, "middle")}
			{header("sh-even", [t(copy.headEven)], L.evenX, "middle")}
			{header(
				"sh-soon",
				stack
					? [t(copy.headSoonDate), `${t(copy.headAt)} ${stock(SOON_SPOT)}`]
					: [`${t(copy.headSoonDate)} · ALFA ${stock(SOON_SPOT)}`],
				L.endX,
				"end",
			)}
			{header(
				"sh-expiry",
				stack
					? [t(copy.headExpiryDate), `${t(copy.headAt)} ${stock(EXPIRY_SPOT)}`]
					: [`${t(copy.headExpiryDate)} · ALFA ${stock(EXPIRY_SPOT)}`],
				L.endX,
				"end",
			)}
			{strikeCalls.map(({ id, contract }, i) => {
				const soon = resultSoon(contract);
				const result = resultAtExpiry(contract, EXPIRY_SPOT);
				return (
					<g key={id}>
						{named(
							`s-name-${id}`,
							i,
							`${contract.strike} ${t(copy.callWord)}`,
							// A phone has room for the term alone at a readable size.
							narrow
								? [t(tagTerm(id))]
								: stack
									? [t(tagTerm(id)), t(tagMeans(id))]
									: [t(tag(id))],
						)}
						{cell(
							`s-cost-${id}`,
							i,
							L.costX,
							"middle",
							dollars(paid(contract)),
							costUnder(contract),
						)}
						<text
							data-f={`s-even-${id}`}
							x={L.evenX}
							y={L.rowY(i)}
							textAnchor="middle"
							className="wt-film-num"
							style={{ fontSize: L.figure }}
						>
							{exact(breakEven(contract))}
						</text>
						{cell(
							`soon-${id}`,
							i,
							L.endX,
							"end",
							signedDollars(soon),
							narrow
								? t(copy.model)
								: `${t(copy.model)} · ${t(copy.delta)} ${fixed2(deltaOf(contract))}`,
							L.result,
							tone(soon),
						)}
						{/* The result and how it is made are two marks; the hero lock holds both. */}
						<text
							data-f={`exp-fig-${id}`}
							x={L.endX}
							y={L.rowY(i)}
							textAnchor="end"
							className={`wt-film-num ${tone(result)}`}
							style={{ fontSize: id === HERO ? L.heroSize : L.result }}
						>
							{signedDollars(result)}
						</text>
						<text
							data-f={`exp-sub-${id}`}
							x={L.endX}
							y={L.subY(i)}
							textAnchor="end"
							className="wt-film-num wt-film-dim"
							style={{ fontSize: L.note }}
						>
							{`${dollars(worthAtExpiry(contract, EXPIRY_SPOT))} − ${dollars(paid(contract))}`}
						</text>
					</g>
				);
			})}
			<Brackets name="lock-hero" glow />

			{/* One strike, three expiries. */}
			{header(
				"eh-calls",
				[t(narrow ? copy.headExpiriesShort : copy.headExpiries)],
				margin,
				"start",
			)}
			{header("eh-cost", [t(copy.headCost)], L.costX, "middle")}
			{header("eh-even", [t(copy.headEven)], L.evenX, "middle")}
			{header(
				"eh-decay",
				stack
					? [t(copy.headDecayTop), t(copy.headDecayBottom)]
					: [t(copy.headDecay)],
				L.endX,
				"end",
			)}
			{expiryCalls.map(({ id, contract }, i) => (
				<g key={id}>
					{named(`e-name-${id}`, i, t(expiryName(contract)), [
						`${daysLeft(contract)} ${t(copy.daysLeft)}`,
					])}
					{cell(
						`e-cost-${id}`,
						i,
						L.costX,
						"middle",
						dollars(paid(contract)),
						costUnder(contract),
					)}
					<text
						data-f={`e-even-${id}`}
						x={L.evenX}
						y={L.rowY(i)}
						textAnchor="middle"
						className="wt-film-num"
						style={{ fontSize: L.figure }}
					>
						{exact(breakEven(contract))}
					</text>
					{cell(
						`e-decay-${id}`,
						i,
						L.endX,
						"end",
						exact(decayPerDay(contract)),
						t(narrow ? copy.perContractShort : copy.perContract),
						L.decay,
						toneClass.down,
					)}
				</g>
			))}

			<g data-f="claim">
				<Lines
					name="z-big"
					text={claim}
					x={W / 2}
					y={claimY}
					size={T.title}
					maxWidth={room}
				/>
				<Lines
					name="z-sub"
					text={t(copy.claimSub)}
					x={W / 2}
					y={claimY + (claimLines - 1) * T.title * 1.35 + T.title * 1.1}
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
	const each = (prefix: string, list: readonly string[] = ids) =>
		list.map((id) => one(`${prefix}-${id}`));
	const expiryIds: readonly ExpiryRowId[] = expiryCalls.map((row) => row.id);
	const lockHero = one<SVGGraphicsElement>("lock-hero");
	const strikeTable = [
		one("sh-calls"),
		one("sh-cost"),
		one("sh-even"),
		...each("s-name"),
		...each("s-cost"),
		...each("s-even"),
	];
	const soon = [one("sh-soon"), ...each("soon")];
	const results = [one("sh-expiry"), ...each("exp-fig"), ...each("exp-sub")];
	const expiryTable = [
		one("eh-calls"),
		one("eh-cost"),
		one("eh-even"),
		one("eh-decay"),
		...each("e-name", expiryIds),
		...each("e-cost", expiryIds),
		...each("e-even", expiryIds),
		...each("e-decay", expiryIds),
	];

	// Everything at rest: hidden until its shot needs it.
	d.hidden([
		...kids("q"),
		one("s-head"),
		one("soon-head"),
		one("hero-head"),
		one("answer-head"),
		one("e-head"),
		one("rule"),
		...strikeTable,
		...soon,
		...results,
		lockHero,
		...expiryTable,
		...kids("claim"),
	]);

	// ——— open: the title ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: ALFA $100 → $106, three calls on the same rise ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-from"), 4.7);
	show(one("q-to"), 5.0, "right");
	show(one("q-line"), 5.4);

	// ——— strikes: three calls, what each costs and where it breaks even ———
	tl.addLabel("strikes", 9.2);
	hide(kids("q"), 9.2);
	show(one("s-head"), 9.55);
	// The scaffold first: headers and the three calls, each named in plain words.
	show([one("rule"), one("sh-calls"), one("sh-cost"), one("sh-even")], 9.7);
	each("s-name").forEach((row, i) => {
		show(row, 9.9 + i * 0.12);
	});
	// The names have settled at 10.64; the first figures wait a full second longer.
	each("s-cost").forEach((cell, i) => {
		show(cell, 11.9 + i * 0.1);
	});
	each("s-even").forEach((cell, i) => {
		show(cell, 13.6 + i * 0.1);
	});

	// ——— soon: a day later ALFA is $2 higher, and every call could be sold for more ———
	tl.addLabel("soon", 17);
	d.swap(one("s-head"), one("soon-head"), 17);
	show(one("sh-soon"), 17.5);
	each("soon").forEach((cell, i) => {
		show(cell, 19 + i * 0.15);
	});

	// ——— result: the hero. The same three calls at expiry, ALFA $6 higher ———
	tl.addLabel("result", 23);
	hide([one("soon-head"), ...soon], 23);
	show(one("hero-head"), 23.35);
	show(one("sh-expiry"), 23.4);
	// One row at a time, each result cut to its settled value with how it is made under it.
	ids.forEach((id, i) => {
		show([one(`exp-fig-${id}`), one(`exp-sub-${id}`)], 25 + i * 0.7);
	});
	// The last result has landed at 26.9. The lock, the answer and the step back of the two
	// gains happen together; from 27.85 nothing on the stage moves until 29.7.
	d.lock(lockHero, 27.35, {
		// The figure and how it is made, held together: brackets round the figure alone sat
		// on the derivation under it.
		around: [one(`exp-fig-${HERO}`), one(`exp-sub-${HERO}`)],
		pad: L.narrow ? 5 : 8,
	});
	tl.addLabel("hero-lock", 27.35);
	show(one("answer-head"), 27.35);
	tl.to(
		ids
			.filter((id) => id !== HERO)
			.flatMap((id) => [one(`exp-fig-${id}`), one(`exp-sub-${id}`)]),
		{ opacity: 0.4, duration: 0.4 },
		27.35,
	);
	// The after-beat, once the hero has stood 1.9 s: the other rows' break-evens step back,
	// leaving the one ALFA's close fell short of. The glow stays on the result to the cut.
	tl.to(
		ids.filter((id) => id !== HERO).map((id) => one(`s-even-${id}`)),
		{ opacity: 0.4, duration: 0.4 },
		29.7,
	);

	// ——— expiry: the same strike, three dates ———
	tl.addLabel("expiry", 31.5);
	hide(
		[
			one("hero-head"),
			one("answer-head"),
			...strikeTable,
			...results,
			lockHero,
		],
		31.5,
	);
	show(one("e-head"), 31.85);
	show(
		[one("eh-calls"), one("eh-cost"), one("eh-even"), one("eh-decay")],
		31.95,
	);
	each("e-name", expiryIds).forEach((row, i) => {
		show(row, 32.05 + i * 0.12);
	});
	// Cost and break-even are one reading of a row; they arrive together.
	expiryIds.forEach((id, i) => {
		show([one(`e-cost-${id}`), one(`e-even-${id}`)], 33.8 + i * 0.1);
	});
	each("e-decay", expiryIds).forEach((cell, i) => {
		show(cell, 35.3 + i * 0.15);
	});

	// ——— claim: cut to big type, held to be read ———
	tl.addLabel("claim", 38.3);
	hide([one("e-head"), one("rule"), ...expiryTable], 38.3);
	tl.fromTo(
		one("z-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
		38.7,
	);
	show(one("z-sub"), 39.1);

	// ——— next ———
	tl.addLabel("next", 43.1);
	hide(kids("claim"), 43.1);
	d.close(43.1);
	return tl;
}

const heroLoss = dollars(-resultAtExpiry(hero, EXPIRY_SPOT));
const figures = (pickResult: (id: StrikeId) => number) =>
	ids.map((id) => signedDollars(pickResult(id))).join(", ");

export const strikeAndExpiryFilm: Film = {
	id: "strike-and-expiry",
	label: [
		`Strike and expiry, as a short film: with ALFA at ${stock(SPOT)} on Sep 16, three Oct 18 calls, the 95 in the money, the 100 at the money and the 105 out of the money, cost ${ids.map((id) => dollars(paid(strikeCall(id).contract))).join(", ")} a contract and break even at ${ids.map((id) => exact(breakEven(strikeCall(id).contract))).join(", ")}; a day later with ALFA at ${stock(SOON_SPOT)} the model has them sold for ${figures((id) => resultSoon(strikeCall(id).contract))}; with ALFA at ${stock(EXPIRY_SPOT)} on Oct 18 their results are ${figures((id) => resultAtExpiry(strikeCall(id).contract, EXPIRY_SPOT))}, so the 105 call loses ${heroLoss} although ALFA rose; and the 100 call for Sep 20, Oct 18 and Nov 15 costs ${expiryCalls.map((row) => dollars(paid(row.contract))).join(", ")} and loses ${expiryCalls.map((row) => exact(-decayPerDay(row.contract))).join(", ")} a day to time decay in the model`,
		`行权价与到期日短片：9月16日 ALFA 为 ${stock(SPOT)}，三张 10月18日 看涨，95 实值、100 平值、105 虚值，每张成本 ${ids.map((id) => dollars(paid(strikeCall(id).contract))).join("、")}，盈亏平衡点 ${ids.map((id) => exact(breakEven(strikeCall(id).contract))).join("、")}；第二天 ALFA 为 ${stock(SOON_SPOT)} 时，按模型卖出的结果是 ${ids.map((id) => signedDollars(resultSoon(strikeCall(id).contract))).join("、")}；10月18日 ALFA 收在 ${stock(EXPIRY_SPOT)} 时，结果是 ${ids.map((id) => signedDollars(resultAtExpiry(strikeCall(id).contract, EXPIRY_SPOT))).join("、")}，ALFA 上涨了，105 看涨却亏 ${heroLoss}；同为 100 看涨，9月20日、10月18日、11月15日 到期的成本是 ${expiryCalls.map((row) => dollars(paid(row.contract))).join("、")}，按模型每天的时间损耗是 ${expiryCalls.map((row) => exact(-decayPerDay(row.contract))).join("、")}`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Strike and expiry", "行权价与到期日"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "strikes", label: ["Three strikes", "三个行权价"] },
		{ id: "soon", label: ["A day later", "一天之后"] },
		{ id: "result", label: ["At expiry", "到期时"] },
		{ id: "expiry", label: ["Three expiries", "三个到期日"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
