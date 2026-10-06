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
	ASK,
	call100,
	observations,
	symbolParts,
} from "./option-contracts-model";

/*
 * Option contracts, as a film. It opens on two ALFA 100 calls, Oct 18 and Nov 15, and
 * asks whether they are the same contract. "Oct 18" flies into the symbol and becomes its
 * date, and the symbol is built part by part: the underlying, the expiry, call or put, the
 * strike; change the date and it is a different contract. Then units: a $4.20 quote is
 * per share, one contract is 100 shares, three are $1,260 of premium. The hero: the 300
 * shares light up block by block as their notional counts to $30,000, against the $1,260
 * paid. Last, a price belongs to a time: $4.20 at 10:30, $4.90 at 15:59.
 *
 *   open      0–4        "Option contracts"
 *   question  4–8.8      Oct 18 100 call, Nov 15 100 call: the same contract?
 *   symbol    8.8–17.2   ALFA · 301018 · C · 00100000; Nov 15 changes it
 *   units     17.2–30.2  $4.20 × 100 = $420; × 3 = $1,260; hero: notional $30,000
 *   time      30.2–34.2  10:30 $4.20; 15:59 $4.90
 *   claim     34.2–38.5  name the contract, count the shares, stamp the time
 *   next      38.5–41    Next: holders and writers
 */

const END = 41;
const PARTS = ["root", "date", "right", "strike"] as const;
const OCT = symbolParts(call100);
const NOV = symbolParts({ ...call100, expiry: "nov15" });
const THREE = 3;
const SPOT = 100;
const DOTS = 100;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, room, type: T } = frame;
	const chars = 21;
	const sym = Math.min(T.title * 1.1, room / (chars * 0.62));
	const symW = sym * 0.6;
	const dot = narrow ? 2.4 : 3.2;
	const gap = narrow ? 6.2 : 8.5;
	const block = gap * 10;
	return {
		...frame,
		sym,
		symW,
		symY: H * 0.46,
		symX: (W: number) => (W - chars * symW) / 2,
		dot,
		gap,
		block,
		gridY: H * (narrow ? 0.38 : 0.34),
		blockX: (i: number) =>
			width / 2 -
			(THREE * block + (THREE - 1) * block * 0.3) / 2 +
			i * block * 1.3,
		timeY: H * 0.32,
	};
}

const copy = {
	title: ["Option contracts", "期权合约"],
	titleSub: ["what you are buying", "你买的是什么"],
	qTag: ["ALFA 100 call", "ALFA 100 看涨"],
	oct: ["Oct 18", "10月18日"],
	nov: ["Nov 15", "11月15日"],
	qLine: ["The same contract?", "是同一份合约吗？"],
	symHead: [
		"Four facts name a contract, and its symbol.",
		"四个事实确定合约，也确定它的代码。",
	],
	symHeadShort: ["Four facts name it.", "四个事实确定它。"],
	novHead: [
		"Change the date: a different contract.",
		"换个到期日：就是另一份合约。",
	],
	novHeadShort: ["Nov 15: a different contract.", "11月15日：另一份合约。"],
	parts: {
		root: ["underlying", "标的"],
		date: ["expiry", "到期日"],
		right: ["call", "看涨"],
		strike: ["strike $100", "行权价 $100"],
	},
	termsLine: [
		"Plus the product terms: 100 shares per contract, settled by delivering shares.",
		"再加上产品条款：每张 100 股，以交付股票结算。",
	],
	unitHead: [
		"$4.20 a share; a contract is 100 shares.",
		"每股 $4.20；一张合约是 100 股。",
	],
	unitHeadShort: ["$4.20 a share, 100 shares.", "每股 $4.20，100 股。"],
	threeHead: [
		`Three contracts: ${usd(THREE * ASK * 100, 0)} of premium.`,
		`三张合约：权利金 ${usd(THREE * ASK * 100, 0)}。`,
	],
	threeHeadShort: [
		`Three: ${usd(THREE * ASK * 100, 0)}.`,
		`三张：${usd(THREE * ASK * 100, 0)}。`,
	],
	notionalHead: [
		`Those ${count(THREE * 100)} shares are worth ${usd(THREE * 100 * SPOT * 100, 0)}.`,
		`这 ${count(THREE * 100)} 股价值 ${usd(THREE * 100 * SPOT * 100, 0)}。`,
	],
	notionalHeadShort: [
		`Notional: ${usd(THREE * 100 * SPOT * 100, 0)}.`,
		`名义价值：${usd(THREE * 100 * SPOT * 100, 0)}。`,
	],
	premium: ["premium", "权利金"],
	notional: ["notional · not what you pay", "名义价值 · 不是你付的钱"],
	shares: ["shares", "股"],
	timeHead: [
		"Same contract, two times, two prices.",
		"同一份合约，两个时点，两个价格。",
	],
	timeHeadShort: ["Two times, two prices.", "两个时点，两个价格。"],
	alfaAt: ["ALFA", "ALFA"],
	ask: ["ask", "卖价"],
	claimBig: [
		"Name the contract, count the shares, stamp the time.",
		"写清合约，算清股数，标明时点。",
	],
	claimSub: [
		"Quotes are per share; every price has a time.",
		"报价按每股计；每个价格都有时点。",
	],
	nextBig: ["Next: holders and writers", "下一课：持有人与义务方"],
	nextSub: ["rights and obligations", "权利与义务"],
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
	// The symbol, character offsets for each part.
	const offset = { root: 0, date: 6, right: 12, strike: 13 } as const;
	const length = { root: 6, date: 6, right: 1, strike: 8 } as const;
	const x0 = L.symX(W);
	const partX = (part: (typeof PARTS)[number]) =>
		x0 + (offset[part] + length[part] / 2) * L.symW;
	const blockDots = (i: number) =>
		Array.from({ length: DOTS }, (_, k) => (
			<circle
				key={`d-${i}-${k}`}
				cx={L.blockX(i) + (k % 10) * L.gap + L.gap / 2}
				cy={L.gridY + Math.floor(k / 10) * L.gap + L.gap / 2}
				r={L.dot}
				className="wt-film-bar"
				data-tone="neutral"
			/>
		));
	const figY = L.gridY + L.block + T.body * 2.4;
	// Premium above, notional under it: the hero's figure is 1.3 times the premium's.
	const figX = () => W / 2;
	// A phone's rows leave room for the notional's brackets under the premium.
	const figRowY = (row: number) => figY + row * T.num * (narrow ? 2.3 : 1.9);
	const figSize = (row: number) =>
		(narrow ? T.small * 1.25 : T.num * 0.8) * (row ? 1.3 : 1);
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
				{(
					[
						["q-oct", copy.oct],
						["q-nov", copy.nov],
					] as const
				).map(([name, label], i) => (
					<Word
						key={name}
						name={name}
						x={W * (narrow ? [0.27, 0.73][i] : [0.32, 0.68][i])}
						y={H * 0.3 + T.big * 1.05}
						size={T.big * (locale === "zh" ? 0.6 : 0.8)}
						// As they will be in the symbol: Oct 18 its date, Nov 15 the one that changes it.
						className={`wt-film-num ${i ? "wt-film-warn" : "wt-film-accent"}`}
					>
						{t(label)}
					</Word>
				))}
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.74}
					size={T.head}
					maxWidth={room}
					className="wt-film-type wt-film-accent"
				/>
			</g>

			{/* The symbol, part by part. */}
			{headline("s-head", copy.symHead, copy.symHeadShort)}
			{headline("n-head", copy.novHead, copy.novHeadShort)}
			<g data-f="symbol">
				{PARTS.map((part) => (
					<g key={part}>
						<text
							data-f={`sym-${part}`}
							x={x0 + offset[part] * L.symW}
							y={L.symY}
							className={`wt-film-num ${part === "date" ? "wt-film-accent" : ""}`}
							style={{ fontSize: L.sym, whiteSpace: "pre" }}
						>
							{OCT[part]}
						</text>
						<path
							data-f={`brace-${part}`}
							d={`M${x0 + offset[part] * L.symW + 2} ${L.symY + L.sym * 0.35}V${L.symY + L.sym * 0.55}H${x0 + (offset[part] + (part === "root" ? 4 : length[part])) * L.symW - 2}V${L.symY + L.sym * 0.35}`}
							className="wt-film-link"
							style={{ strokeDasharray: "none" }}
						/>
						<text
							data-f={`part-${part}`}
							x={
								part === "root"
									? x0 + 2 * L.symW
									: part === "right"
										? partX(part) - L.symW * 0.2
										: partX(part)
							}
							// A phone has no room beside the one-letter part: its label drops a line.
							y={
								L.symY +
								L.sym * 0.55 +
								T.small * (narrow && part === "right" ? 3.3 : 1.8)
							}
							textAnchor="middle"
							className="wt-film-tag"
							style={{ fontSize: T.small }}
						>
							{t(copy.parts[part]).toUpperCase()}
						</text>
					</g>
				))}
				<text
					data-f="sym-date-nov"
					x={x0 + offset.date * L.symW}
					y={L.symY}
					className="wt-film-num wt-film-warn"
					style={{ fontSize: L.sym }}
				>
					{NOV.date}
				</text>
				<Lines
					name="terms"
					text={t(copy.termsLine)}
					x={W / 2}
					y={H * 0.78}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>

			{/* Shares and dollars. */}
			{headline("u-head", copy.unitHead, copy.unitHeadShort)}
			{headline("t-head", copy.threeHead, copy.threeHeadShort)}
			{headline("v-head", copy.notionalHead, copy.notionalHeadShort)}
			<g data-f="units">
				{[0, 1, 2].map((i) => (
					<g key={`b-${i + 1}`} data-f={`block-${i}`}>
						{blockDots(i)}
					</g>
				))}
				<Word
					name="u-shares"
					x={W / 2}
					y={L.gridY - T.body * 0.8}
					size={T.small}
					className="wt-film-tag"
				>
					{`100 ${t(copy.shares).toUpperCase()}`}
				</Word>
				<Word
					name="u-shares-3"
					x={W / 2}
					y={L.gridY - T.body * 0.8}
					size={T.small}
					className="wt-film-tag"
				>
					{`${count(THREE * 100)} ${t(copy.shares).toUpperCase()}`}
				</Word>
			</g>
			{(
				[
					[
						"f-one",
						copy.premium,
						`$4.20 × 100 = ${usd(ASK * 100, 0)}`,
						"wt-film-accent",
						0,
					],
					[
						"f-three",
						copy.premium,
						`3 × ${usd(ASK * 100, 0)} = ${usd(THREE * ASK * 100, 0)}`,
						"wt-film-accent",
						0,
					],
					[
						"f-notional",
						copy.notional,
						`${count(THREE * 100)} × $${SPOT} = ${usd(THREE * 100 * SPOT * 100, 0)}`,
						"wt-film-accent",
						1,
					],
				] as const
			).map(([name, tag, text, tone, row]) => (
				<g key={name} data-f={name}>
					<text
						x={figX()}
						y={figRowY(row)}
						textAnchor="middle"
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(tag).toUpperCase()}
					</text>
					<text
						data-f={`${name}-num`}
						x={figX()}
						y={figRowY(row) + figSize(row) * 1.35}
						textAnchor="middle"
						className={`wt-film-num ${tone}`}
						style={{ fontSize: figSize(row) }}
					>
						{text}
					</text>
				</g>
			))}

			<Brackets name="lock-notional" glow />

			{/* One contract, two observations. */}
			{headline("o-head", copy.timeHead, copy.timeHeadShort)}
			<g data-f="times">
				{(["morning", "close"] as const).map((key, i) => {
					const o = observations[key];
					const x = W * (narrow ? [0.27, 0.73][i] : [0.3, 0.7][i]);
					return (
						<g key={key} data-f={`obs-${key}`}>
							<text
								x={x}
								y={L.timeY}
								textAnchor="middle"
								className="wt-film-tag"
								style={{ fontSize: T.small }}
							>
								{o.time}
							</text>
							<text
								x={x}
								y={L.timeY + T.big * 1.05}
								textAnchor="middle"
								className={`wt-film-num ${i ? "wt-film-accent" : ""}`}
								style={{ fontSize: T.big * 0.8 }}
							>
								{usd(o.ask)}
							</text>
							<text
								x={x}
								y={L.timeY + T.big * 1.05 + T.body * 2}
								textAnchor="middle"
								className="wt-film-type wt-film-dim"
								style={{ fontSize: T.body }}
							>
								{`${t(copy.ask)} · ${t(copy.alfaAt)} ${usd(o.spot)}`}
							</text>
						</g>
					);
				})}
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
	const g = (name: string) => one<SVGGraphicsElement>(name);
	/** A figure lands slightly large and settles, without overshoot: it is data. */
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const blocks = [0, 1, 2].map((i) => one(`block-${i}`));
	const notional = one<SVGTextElement>("f-notional-num");
	const heads = [
		"s-head",
		"n-head",
		"u-head",
		"t-head",
		"v-head",
		"o-head",
	].map((name) => one(name));

	d.hidden([
		...flat("q"),
		...heads,
		...flat("symbol"),
		one("terms"),
		...blocks,
		one("u-shares"),
		one("u-shares-3"),
		one("f-one"),
		one("f-three"),
		one("f-notional"),
		g("lock-notional"),
		one("obs-morning"),
		one("obs-close"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: two calls, one strike ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.4);
	word(one("q-oct"), 4.6);
	word(one("q-nov"), 5.0);
	show(one("q-line"), 5.2);

	// ——— symbol: four facts. "Oct 18" flies in and becomes the symbol's date. ———
	tl.addLabel("symbol", 8.8);
	hide([one("q-tag"), one("q-line"), one("q-nov")], 8.8);
	show(heads[0], 9.0);
	// Along its row first, clear of the fading Nov 15, then down into the date's slot.
	d.carry(g("q-oct"), g("sym-date"), 9.2, { duration: 1.1, arc: "x" });
	// The other parts join the date once it has landed, so nothing enters under its flight.
	const joins = { date: 10.3, root: 10.4, right: 10.7, strike: 11.0 } as const;
	PARTS.forEach((part) => {
		const at = joins[part];
		if (part !== "date") show(one(`sym-${part}`), at);
		tl.to(one(`brace-${part}`), { opacity: 1, duration: 0.3 }, at + 0.4);
		show(one(`part-${part}`), at + 0.5);
	});
	show(one("terms"), 12.0);
	// Change the date to Nov 15: a different symbol, a different contract.
	d.swap(heads[0], heads[1], 13.2);
	d.flip(one("sym-date"), one("sym-date-nov"), 13.9);
	tl.set(one("sym-date"), { opacity: 0 }, 14.2);

	// ——— units: per share, per contract ———
	tl.addLabel("units", 17.2);
	hide([heads[1], ...flat("symbol"), one("terms")], 17.2);
	show(heads[2], 17.4);
	tl.fromTo(
		blocks[0],
		{ opacity: 0, y: 10 },
		{ opacity: 1, y: 0, duration: 0.5 },
		17.8,
	);
	show(one("u-shares"), 18.0);
	show(one("f-one"), 18.6);
	d.swap(heads[2], heads[3], 21.2);
	blocks.slice(1).forEach((block, i) => {
		tl.fromTo(
			block,
			{ opacity: 0, x: 18 },
			{ opacity: 1, x: 0, duration: 0.45 },
			21.6 + i * 0.3,
		);
	});
	d.swap(one("u-shares"), one("u-shares-3"), 21.6);
	d.swap(one("f-one"), one("f-three"), 22.2);
	// The hero: the 300 shares light up a block at a time as their notional counts up, to
	// $30,000 against the $1,260 paid, which steps back.
	d.swap(heads[3], heads[4], 25.2);
	tl.to(one("f-three"), { opacity: 0.45, duration: 0.4 }, 25.4);
	show(one("f-notional"), 25.8);
	blocks.forEach((block, i) => {
		const at = 25.8 + i * 0.8;
		tl.set(block.children, { attr: { "data-tone": "total" } }, at);
		tl.fromTo(
			block,
			{
				scale: 1.06,
				svgOrigin: `${L.blockX(i) + L.block / 2} ${L.gridY + L.block / 2}`,
				smoothOrigin: false,
			},
			{ scale: 1, duration: 0.45, ease: "power3.out" },
			at,
		);
		d.count(
			notional,
			(i + 1) * 100 * SPOT,
			at,
			(v) =>
				`${count(THREE * 100)} × $${SPOT} = ${usd(Math.round(v) * 100, 0)}`,
			i * 100 * SPOT,
			0.7,
		);
	});
	d.lock(g("lock-notional"), 28.3, { around: g("f-notional"), pad: 8 });

	// ——— time: a price is an observation ———
	tl.addLabel("time", 30.2);
	hide(
		[
			heads[4],
			...blocks,
			one("u-shares-3"),
			one("f-three"),
			one("f-notional"),
			g("lock-notional"),
		],
		30.2,
	);
	show(heads[5], 30.4);
	show(one("obs-morning"), 30.8);
	show(one("obs-close"), 31.8);

	// ——— claim ———
	tl.addLabel("claim", 34.2);
	hide([heads[5], one("obs-morning"), one("obs-close")], 34.2);
	word(one("z-big"), 34.5);
	show(one("z-sub"), 34.9);

	// ——— next ———
	tl.addLabel("next", 38.5);
	hide(kids("claim"), 38.5);
	d.close(38.5);
	return tl;
}

export const optionContractsFilm: Film = {
	id: "option-contracts",
	label: [
		`Option contracts, as a short film: two ALFA 100 calls, Oct 18 and Nov 15, and whether they are the same contract; the standard symbol built from four facts, ALFA ${OCT.date} ${OCT.right} ${OCT.strike}, which changes when the expiry does; a $4.20 quote per share, one contract of 100 shares for ${usd(ASK * 100, 0)}, three for ${usd(THREE * ASK * 100, 0)} on ${usd(THREE * 100 * SPOT * 100, 0)} of shares; and the same call at ${usd(observations.morning.ask)} at 10:30 and ${usd(observations.close.ask)} at 15:59`,
		`期权合约短片：10月18日 与 11月15日 两张 ALFA 100 看涨，是否是同一份合约；由四个事实构成的标准代码 ALFA ${OCT.date} ${OCT.right} ${OCT.strike}，到期日一变代码就变；$4.20 是每股报价，一张合约 100 股要 ${usd(ASK * 100, 0)}，三张 ${usd(THREE * ASK * 100, 0)}，对应 ${usd(THREE * 100 * SPOT * 100, 0)} 的股票；以及同一张看涨 10:30 卖价 ${usd(observations.morning.ask)}，15:59 卖价 ${usd(observations.close.ask)}`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Option contracts", "期权合约"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "symbol", label: ["Four facts", "四个事实"] },
		{ id: "units", label: ["Units", "单位"] },
		{ id: "time", label: ["A time", "时点"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
