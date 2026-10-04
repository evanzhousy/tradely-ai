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
	ASK,
	call100,
	observations,
	symbolParts,
} from "./option-contracts-model";

/*
 * Option contracts, as a film. It opens on two ALFA 100 calls, Oct 18 and Nov 15, and
 * asks whether they are the same contract. The symbol answers, built part by part: the
 * underlying, the expiry, call or put, the strike; change the date and it is a different
 * contract. Then units: a $4.20 quote is per share, one contract is 100 shares, three
 * are $1,260 of premium on $30,000 of shares. Last, a price belongs to a time: $4.20 at
 * 10:30, $4.90 at 15:59, the same contract.
 *
 *   open      0–4      "Option contracts"
 *   question  4–9.5    Oct 18 100 call, Nov 15 100 call: the same contract?
 *   symbol    9.5–19   ALFA · 301018 · C · 00100000; Nov 15 changes it
 *   units     19–29    $4.20 × 100 = $420; × 3 = $1,260; notional $30,000
 *   time      29–37.5  10:30 $4.20; 15:59 $4.90; cut: the claim
 *   next      37.5–40  Next: holders and writers
 */

const END = 40;
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
		"A contract is named by four facts, and so is its symbol.",
		"一份合约由四个事实确定，它的代码也是。",
	],
	symHeadShort: ["Four facts name it.", "四个事实确定它。"],
	novHead: [
		"Change the expiry to Nov 15 and it is a different contract.",
		"把到期日改成11月15日，就是另一份合约。",
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
		"A $4.20 quote is per share; one contract is 100 shares.",
		"$4.20 的报价是每股；一张合约是 100 股。",
	],
	unitHeadShort: ["$4.20 a share, 100 shares.", "每股 $4.20，100 股。"],
	threeHead: [
		`Three contracts: ${count(THREE * 100)} shares, ${usd(THREE * ASK * 100, 0)} of premium.`,
		`三张合约：${count(THREE * 100)} 股，权利金 ${usd(THREE * ASK * 100, 0)}。`,
	],
	threeHeadShort: [
		`Three: ${usd(THREE * ASK * 100, 0)}.`,
		`三张：${usd(THREE * ASK * 100, 0)}。`,
	],
	notionalHead: [
		`Those shares are worth ${usd(THREE * 100 * SPOT * 100, 0)}: the notional, not what you pay.`,
		`这些股票价值 ${usd(THREE * 100 * SPOT * 100, 0)}：这是名义价值，不是你付的钱。`,
	],
	notionalHeadShort: [
		`Notional: ${usd(THREE * 100 * SPOT * 100, 0)}.`,
		`名义价值：${usd(THREE * 100 * SPOT * 100, 0)}。`,
	],
	premium: ["premium", "权利金"],
	notional: ["notional", "名义价值"],
	shares: ["shares", "股"],
	timeHead: [
		"The same contract, two times, two prices.",
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
		"Premium is per share times 100; a price is an observation at a moment.",
		"权利金是每股价格乘以 100；价格是某一刻的观测值。",
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
				data-tone={i === 0 ? "total" : "neutral"}
			/>
		));
	const figY = L.gridY + L.block + T.body * 2.4;
	// On a phone premium and notional sit side by side; wider, one under the other.
	const figX = (row: number) => (narrow ? W * [0.27, 0.73][row] : W / 2);
	const figRowY = (row: number) => figY + (narrow ? 0 : row * T.num * 1.9);
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
						className="wt-film-num"
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
						"wt-film-dim",
						1,
					],
				] as const
			).map(([name, tag, text, tone, row]) => (
				<g key={name} data-f={name}>
					<text
						x={figX(row)}
						y={figRowY(row)}
						textAnchor="middle"
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(tag).toUpperCase()}
					</text>
					<text
						x={figX(row)}
						y={figRowY(row) + T.num * 1.1}
						textAnchor="middle"
						className={`wt-film-num ${tone}`}
						style={{ fontSize: narrow ? T.small * 1.15 : T.num * 0.8 }}
					>
						{text}
					</text>
				</g>
			))}

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
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
			time,
		);
	const blocks = [0, 1, 2].map((i) => one(`block-${i}`));
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
	show(one("q-tag"), 4.6);
	word(one("q-oct"), 4.8);
	word(one("q-nov"), 5.2);
	show(one("q-line"), 6.4);

	// ——— symbol: four facts ———
	tl.addLabel("symbol", 9.5);
	hide(flat("q"), 9.5);
	show(one("s-head"), 9.7, "above");
	PARTS.forEach((part, i) => {
		const at = 10.2 + i * 0.8;
		show(one(`sym-${part}`), at, "above");
		tl.to(one(`brace-${part}`), { opacity: 1, duration: 0.3 }, at + 0.3);
		show(one(`part-${part}`), at + 0.35);
	});
	show(one("terms"), 13.8);
	d.swap(one("s-head"), one("n-head"), 15.2);
	d.flip(one("sym-date"), one("sym-date-nov"), 15.6);
	tl.set(one("sym-date"), { opacity: 0 }, 15.9);

	// ——— units: per share, per contract ———
	tl.addLabel("units", 19);
	hide([one("n-head"), ...flat("symbol"), one("terms")], 19.0);
	show(one("u-head"), 19.2, "above");
	tl.fromTo(
		blocks[0],
		{ opacity: 0, y: 10 },
		{ opacity: 1, y: 0, duration: 0.5 },
		19.6,
	);
	show(one("u-shares"), 19.8);
	show(one("f-one"), 20.4);
	d.swap(one("u-head"), one("t-head"), 22.2);
	blocks.slice(1).forEach((block, i) => {
		tl.fromTo(
			block,
			{ opacity: 0, x: 18 },
			{ opacity: 1, x: 0, duration: 0.45 },
			22.6 + i * 0.3,
		);
	});
	d.swap(one("u-shares"), one("u-shares-3"), 22.6);
	d.swap(one("f-one"), one("f-three"), 23.2);
	d.swap(one("t-head"), one("v-head"), 25.2);
	show(one("f-notional"), 25.6);

	// ——— time: a price is an observation ———
	tl.addLabel("time", 29);
	hide(
		[
			one("v-head"),
			...blocks,
			one("u-shares-3"),
			one("f-three"),
			one("f-notional"),
		],
		29.0,
	);
	show(one("o-head"), 29.2, "above");
	show(one("obs-morning"), 29.6);
	show(one("obs-close"), 30.8);
	// Cut: the claim.
	hide([one("o-head"), one("obs-morning"), one("obs-close")], 33.0);
	word(one("z-big"), 33.4);
	show(one("z-sub"), 33.9);

	// ——— next ———
	tl.addLabel("next", 37.5);
	hide(kids("claim"), 37.5);
	d.close(37.5);
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
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
