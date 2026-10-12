import {
	type Copy,
	mondayPacket,
	pick,
	rowPremium,
	usd,
} from "@/content/world";
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
import { textWidth } from "../walkthrough/text-measure";
import {
	claims,
	dollars,
	PREMIUM,
	premiumProof,
	REPORTED,
	type Status,
	sections,
} from "./audit-market-recap-model";

/*
 * Audits, as a film. A colleague's recap puts Monday's premium at $1,655.20, and its
 * contracts and prices match the tape: does it pass? The rows answer: recomputed from the
 * trades, covered amounts lack the ×100 multiplier; the covered subtotal is
 * $165,520. The hero audits the recap's five claims: one supported, three repaired, and
 * the forecast cut, where glowing brackets lock. Last, the signoff: what passed, what
 * changed, what is still open, and what would reopen it.
 *
 *   open      0–4        "Audits"
 *   question  4–8.6      $1,655.20 in premium: pass it?
 *   amount    8.6–19.4   source trades × 100; covered subtotal; missing stays missing
 *   claims    19.4–31.0  original claims held; repairs; lock at 27 after 1 s quiet
 *   signoff   31.0–37.4  compact findings, open items, reopening conditions
 *   claim     37.4–41.8  find it, fix it, say what's open
 *   next      41.8–44.3  Next: the module checkpoint
 */

const END = 44.3;
const ROWS = mondayPacket;
const statusTone: Record<Status, string> = {
	supported: "wt-film-gain",
	repaired: "wt-film-warn",
	removed: "wt-film-loss",
};
const sectionTone = {
	gain: "wt-film-gain",
	accent: "wt-film-accent",
	loss: "wt-film-loss",
	muted: "wt-film-dim",
} as const;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, room } = frame;
	return {
		...frame,
		rowY: (i: number) =>
			H * (narrow ? 0.29 : 0.29) + i * H * (narrow ? 0.075 : 0.075),
		rowH: H * 0.06,
		colReport: narrow ? 0.62 : 0.6,
		totalY: H * 0.9,
		claimY: (i: number) =>
			H * (narrow ? 0.26 : 0.27) + i * H * (narrow ? 0.12 : 0.12),
		claimH: H * (narrow ? 0.1 : 0.1),
		secY: (i: number) =>
			H * (narrow ? 0.235 : 0.25) + i * H * (narrow ? 0.18 : 0.165),
		secH: H * (narrow ? 0.17 : 0.15),
		labelW: narrow ? room * 0.3 : room * 0.18,
	};
}

const copy = {
	title: ["Audits", "审核"],
	titleSub: ["finding and repairing a flawed recap", "发现并修复有缺陷的复盘"],
	qTag: ["a colleague's recap · Monday", "同事的复盘 · 周一"],
	qLine: [
		`Premium: ${usd(REPORTED)}. Contracts and prices match the tape.`,
		`权利金：${usd(REPORTED)}。张数和价格都和成交记录一致。`,
	],
	qBig: ["Pass it?", "通过吗？"],
	mHead: ["Recompute from the trades.", "按成交重算。"],
	m2Head: [
		"Covered rows: ×100; missing stays missing.",
		"有数据行补回 ×100；缺失仍缺失。",
	],
	covered: ["covered subtotal · 4/5 strikes", "覆盖小计 · 4/5 行权价"],
	multiplier: [
		`× ${premiumProof.multiplier} shares/contract =`,
		`× ${premiumProof.multiplier} 股/张 =`,
	],
	report: ["report", "报告"],
	recomputed: ["recomputed", "重算"],
	noData: ["no data", "无数据"],
	cHead: ["Then check all five claims.", "再检查全部五个结论。"],
	c2Head: [
		"One holds; three repaired, one cut.",
		"一个成立；三个修复，一个删除。",
	],
	supported: ["supported", "有依据"],
	scopeShort: ["Oct 18 calls, 100–120, Mon", "10月18日 看涨 100–120，周一"],
	repaired: ["repaired", "已修复"],
	removed: ["Forecast removed", "预测已删除"],
	forecastShort: ["ALFA above $110", "预期高于 $110"],
	sHead: [
		"Sign off with gaps and reopening conditions.",
		"签核，写明缺口与重审条件。",
	],
	claimBig: [
		"Find it, fix it, say what's open.",
		"找到它，修好它，说明未解决的。",
	],
	claimSub: [
		"Recompute from the source; check every claim.",
		"从源头重算；检查每一个结论。",
	],
	nextBig: ["Next: the module checkpoint", "下一步：模块检查点"],
	nextSub: [
		"producing and auditing research, on a new day",
		"在新的一天里运用研究的产出与审核",
	],
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
	const proofOperands = premiumProof.trades.map(
		(trade, i) =>
			`${i === 0 ? "(" : "+ "}${trade.quantity} × ${usd(trade.price)}${i === premiumProof.trades.length - 1 ? ")" : ""}`,
	);
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
					y={H * 0.62}
					size={T.title}
					maxWidth={room}
				/>
			</g>

			{/* The amount, row by row. */}
			{headline("m-head", copy.mHead)}
			{/* Each answer, a line under its headline, as the stage makes it. */}
			<Lines
				name="m2-head"
				text={t(copy.m2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.mHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			<g data-f="cols">
				<text
					x={margin + room * L.colReport}
					y={L.rowY(0) - T.small * 0.9}
					textAnchor="end"
					className="wt-film-tag wt-film-loss"
					style={{ fontSize: T.small }}
				>
					{t(copy.report).toUpperCase()}
				</text>
			</g>
			<text
				data-f="col-fixed"
				x={margin + room - 12}
				y={L.rowY(0) - T.small * 0.9}
				textAnchor="end"
				className="wt-film-tag wt-film-gain"
				style={{ fontSize: T.small }}
			>
				{t(copy.recomputed).toUpperCase()}
			</text>
			{ROWS.map((row, i) => {
				const premium = rowPremium(row);
				return (
					<g key={row.id}>
						<g data-f={`row-${i}`}>
							<rect
								x={margin}
								y={L.rowY(i)}
								width={room}
								height={L.rowH}
								rx={9}
								className="wt-panel-shape"
								style={
									premium === null ? { strokeDasharray: "4 3" } : undefined
								}
							/>
							<text
								x={margin + 12}
								y={L.rowY(i) + L.rowH / 2 + text * 0.36}
								className="wt-film-type"
								style={{ fontSize: text }}
							>
								{t([`${row.strike} call`, `${row.strike} 看涨`])}
							</text>
							<text
								x={margin + room * L.colReport}
								y={L.rowY(i) + L.rowH / 2 + text * 0.36}
								textAnchor="end"
								className={`wt-film-num ${premium === null ? "wt-film-warn" : "wt-film-loss"}`}
								style={{ fontSize: text }}
							>
								{premium === null ? t(copy.noData) : usd(premium / 100)}
							</text>
						</g>
						{premium === null ? null : (
							<text
								data-f={`fixed-${i}`}
								x={margin + room - 12}
								y={L.rowY(i) + L.rowH / 2 + text * 0.36}
								textAnchor="end"
								className="wt-film-num wt-film-gain"
								style={{ fontSize: text }}
							>
								{dollars(premium)}
							</text>
						)}
					</g>
				);
			})}
			{/* Build the 105 row from the packet's two executions, never count an equality. */}
			<Word
				name="proof-label"
				x={margin + 14}
				y={H * 0.68}
				size={T.small}
				anchor="start"
				className="wt-film-tag"
			>
				{t([
					`${premiumProof.strike} call · source trades`,
					`${premiumProof.strike} 看涨 · 源成交`,
				])}
			</Word>
			{premiumProof.trades.map((trade, i) => (
				<Word
					key={trade.id}
					name={`proof-trade-${i}`}
					x={
						margin +
						14 +
						proofOperands
							.slice(0, i)
							.reduce(
								(sum, operand) => sum + textWidth(operand, T.body) + T.body,
								0,
							)
					}
					y={H * 0.735}
					size={T.body}
					anchor="start"
					className="wt-film-num"
				>
					{proofOperands[i]}
				</Word>
			))}
			<Word
				name="proof-multiplier"
				x={margin + 14}
				y={H * 0.79}
				size={T.small}
				anchor="start"
				className="wt-film-num"
			>
				{t(copy.multiplier)}
			</Word>
			<Word
				name="proof-result"
				x={margin + 14 + textWidth(t(copy.multiplier), T.small) + 14}
				y={H * 0.79}
				size={T.body}
				anchor="start"
				className="wt-film-num wt-film-gain"
			>
				{dollars(premiumProof.premium)}
			</Word>
			<Word
				name="total-label"
				x={margin + room - 12}
				y={H * 0.83}
				size={T.small}
				anchor="end"
				className="wt-film-tag wt-film-gain"
			>
				{t(copy.covered)}
			</Word>
			<text
				data-f="total-report"
				x={margin + room * L.colReport}
				y={L.totalY}
				textAnchor="end"
				className="wt-film-num wt-film-loss"
				style={{
					fontSize: narrow ? T.body * 1.1 : T.head,
					textDecoration: "line-through",
				}}
			>
				{usd(REPORTED)}
			</text>
			<text
				data-f="total-fixed"
				x={margin + room - 12}
				y={L.totalY}
				textAnchor="end"
				className="wt-film-num wt-film-gain"
				style={{ fontSize: narrow ? T.head : T.num }}
			>
				{dollars(PREMIUM)}
			</text>

			{/* Five claims. */}
			{headline("c-head", copy.cHead)}
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
			{claims.map((claim, i) => (
				<g key={claim.id}>
					<g data-f={`claim-${i}`}>
						<rect
							data-f={`claim-${i}-box`}
							x={margin}
							y={L.claimY(i)}
							width={room}
							height={claim.status === "removed" ? H * 0.2 : L.claimH}
							rx={10}
							className="wt-panel-shape"
						/>
						<text
							data-f={`claim-${i}-text`}
							x={
								narrow && claim.status === "removed"
									? margin + room / 2
									: margin + 14
							}
							textAnchor={
								narrow && claim.status === "removed" ? "middle" : "start"
							}
							y={L.claimY(i) + L.claimH * 0.42}
							className="wt-film-type"
							style={{ fontSize: text }}
						>
							{t(
								claim.status === "removed"
									? copy.forecastShort
									: narrow && claim.id === "scope"
										? copy.scopeShort
										: claim.text,
							)}
						</text>
					</g>
					<text
						data-f={`tag-${i}`}
						x={margin + room - 14}
						y={L.claimY(i) + L.claimH * (narrow ? 0.78 : 0.42)}
						textAnchor="end"
						className={`wt-film-tag ${statusTone[claim.status]}`}
						style={{ fontSize: T.small * 0.95 }}
					>
						{t(claim.defect ?? copy.supported).toUpperCase()}
					</text>
					{claim.repair || claim.status === "removed" ? (
						<text
							data-f={`fix-${i}`}
							x={claim.status === "removed" ? margin + room / 2 : margin + 14}
							textAnchor={claim.status === "removed" ? "middle" : "start"}
							y={
								L.claimY(i) +
								(claim.status === "removed" ? H * 0.12 : L.claimH * 0.78)
							}
							className={`wt-film-type ${claim.status === "removed" ? "wt-film-loss" : "wt-film-gain"}`}
							style={{
								fontSize:
									claim.status === "removed"
										? narrow
											? T.head * 1.5
											: T.num
										: T.small * 1.1,
							}}
						>
							{claim.repair ? `→ ${t(claim.repair)}` : t(copy.removed)}
						</text>
					) : null}
				</g>
			))}
			<Brackets name="lock-cut" glow />

			{/* The signoff. */}
			{headline("s-head", copy.sHead)}
			{sections.map((section, i) => (
				<g key={section.id} data-f={`sec-${i}`}>
					<rect
						x={margin}
						y={L.secY(i)}
						width={room}
						height={L.secH}
						rx={12}
						className={i === 0 ? "wt-focus-shape" : "wt-panel-shape"}
					/>
					<text
						x={margin + 14}
						y={L.secY(i) + T.small * 1.7}
						className={`wt-film-tag ${sectionTone[section.tone]}`}
						style={{ fontSize: T.small }}
					>
						{t(section.label).toUpperCase()}
					</text>
					<Lines
						name={`sec-${i}-text`}
						text={t(section.text)}
						x={margin + 14}
						y={L.secY(i) + T.small * 1.7 + T.small * (narrow ? 1.35 : 1.6)}
						size={T.body}
						maxWidth={room - 28}
						anchor="start"
						className="wt-film-type"
					/>
				</g>
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
	const heads = ["m-head", "m2-head", "c-head", "c2-head", "s-head"].map(
		(name) => one(name),
	);
	const proof = [
		one("proof-label"),
		...premiumProof.trades.map((_, i) => one(`proof-trade-${i}`)),
		one("proof-multiplier"),
		one("proof-result"),
	];
	const lockCut = one<SVGGraphicsElement>("lock-cut");
	const rows = ROWS.map((_, i) => one(`row-${i}`));
	const fixed = ROWS.flatMap((_, i) => {
		const el = one(`fixed-${i}`);
		return el ? [el] : [];
	});
	const claimRows = claims.map((_, i) => one(`claim-${i}`));
	const tags = claims.map((_, i) => one(`tag-${i}`));
	const fixes = claims.flatMap((_, i) => {
		const el = one(`fix-${i}`);
		return el ? [el] : [];
	});
	const secs = sections.map((_, i) => one(`sec-${i}`));

	d.hidden([
		...flat("q"),
		...heads,
		...kids("cols"),
		one("col-fixed"),
		...rows,
		...fixed,
		...proof,
		one("total-label"),
		one("total-report"),
		one("total-fixed"),
		...claimRows,
		...tags,
		...fixes,
		...secs,
		lockCut,
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

	// ——— amount: recompute from the rows ———
	tl.addLabel("amount", 8.6);
	hide(flat("q"), 8.6);
	show(heads[0], 8.8);
	show(kids("cols"), 9.2);
	rows.forEach((row, i) => {
		show(row, 9.3 + i * 0.12, "right");
	});
	show(one("total-report"), 10.1);
	tl.set(one("total-report"), { textDecoration: "none" }, 10.1);
	show(one("proof-label"), 9.9);
	// Each operand enters in place; the expression is readable before its result lands.
	premiumProof.trades.forEach((_, i) => {
		tl.fromTo(
			one(`proof-trade-${i}`),
			{ opacity: 0 },
			{ opacity: 1, duration: 0.5 },
			10.15 + i * 0.4,
		);
	});
	show(one("col-fixed"), 11.0);
	tl.fromTo(
		one("proof-multiplier"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		10.95,
	);
	fixed.forEach((el, i) => {
		word(el, [11.15, 11.55, 11.4, 11.9][i]);
	});
	word(one("proof-result"), 11.55);
	// The row construction finishes at 12.45, then stands a full second.
	tl.set(one("total-report"), { textDecoration: "line-through" }, 13.45);
	tl.to(one("total-report"), { opacity: 0.5, duration: 0.3 }, 13.45);
	// The label is close to the subtotal: enter in place, clear of the figure below.
	tl.fromTo(
		one("total-label"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		13.45,
	);
	word(one("total-fixed"), 13.45);
	// Subtotal settles at 14.0; the scoped answer follows after 1 s quiet.
	show(heads[1], 15.0);

	// ——— claims: the hero. All five, audited and repaired. ———
	tl.addLabel("claims", 19.4);
	d.swap([heads[0], heads[1]], heads[2], 19.4);
	hide(
		[
			...kids("cols"),
			one("col-fixed"),
			...rows,
			...fixed,
			...proof,
			one("total-label"),
			one("total-report"),
			one("total-fixed"),
		],
		19.4,
	);
	claimRows.forEach((row, i) => {
		show(row, 20.2 + i * 0.15, "right");
	});
	tags.forEach((tag, i) => {
		word(tag, 20.6 + i * 0.3);
	});
	tl.set(one("claim-0-box"), { attr: { class: "wt-focus-shape" } }, 20.6);
	claims.forEach((claim, i) => {
		if (claim.status === "supported") return;
		const at = 24.3 + (i - 1) * 0.3;
		// Keep every original claim readable for at least 3.5 s before dimming.
		// The phone defect then clears before its repair enters the same line.
		if (L.narrow) hide(tags[i], at, 0.3, 0);
		tl.to(
			one(`claim-${i}-text`),
			{ opacity: claim.status === "removed" ? 0.18 : 0.4, duration: 0.3 },
			at,
		);
	});
	fixes.forEach((fix, i) => {
		// Fade in place: enlarged verdict and phone repairs share crowded card lanes.
		tl.fromTo(
			fix,
			{ opacity: 0 },
			{ opacity: 1, duration: 0.5 },
			24.6 + i * 0.3,
		);
	});

	// The forecast, cut: the repair that removes a claim outright.
	const cut = claims.findIndex((claim) => claim.status === "removed");
	const verdict = one<SVGTextElement>(`fix-${cut}`);
	const cardBox = one<SVGRectElement>(`claim-${cut}-box`).getBBox();
	// Fit the kit's largest lock scale inside the card. Eleven pixels cover the 8 px
	// clearance plus both strokes; measure the actual EN/ZH font bounds.
	const pad = 10;
	let verdictBox = verdict.getBBox();
	for (let attempt = 0; attempt < 8; attempt++) {
		const width = verdictBox.width + pad * 2;
		const height = verdictBox.height + pad * 2;
		const scale = Math.min(1.4, 1 + 48 / Math.max(width, height));
		const fit = Math.min(
			(cardBox.width - 22) / (width * scale),
			(cardBox.height - 22) / (height * scale),
		);
		if (fit >= 1) break;
		verdict.style.fontSize = `${Number.parseFloat(verdict.style.fontSize) * Math.min(0.98, fit)}px`;
		verdictBox = verdict.getBBox();
	}
	verdict.setAttribute(
		"y",
		String(
			Number(verdict.getAttribute("y")) +
				cardBox.y +
				cardBox.height / 2 -
				(verdictBox.y + verdictBox.height / 2),
		),
	);
	d.lock(lockCut, 27.0, { around: verdict, pad });
	tl.addLabel("hero-lock", 27.0);
	show(heads[3], 27.0);

	// ——— signoff ———
	tl.addLabel("signoff", 31.0);
	d.swap([heads[2], heads[3]], heads[4], 31.0);
	hide([...claimRows, ...tags, ...fixes, lockCut], 31.0);
	secs.forEach((sec, i) => {
		show(sec, 31.8 + i * 0.6, "right");
	});

	// ——— claim ———
	tl.addLabel("claim", 37.4);
	hide([heads[4], ...secs], 37.4);
	word(one("z-big"), 37.7);
	show(one("z-sub"), 38.1);

	// ——— next ———
	tl.addLabel("next", 41.8);
	hide(kids("claim"), 41.8);
	d.close(41.8);
	return tl;
}

export const auditMarketRecapFilm: Film = {
	id: "audit-market-recap",
	label: [
		`Audits, as a short film: a colleague's recap that puts Monday's premium at ${usd(REPORTED)}, whose covered rows restore the ×100 multiplier, with a worked 105-call trade calculation and a covered subtotal of ${dollars(PREMIUM)}; its five claims audited, the scope supported, the units, new positions and missing strike repaired, and the forecast removed; and a signoff listing what is supported, what was repaired, what is still open and what would reopen it`,
		`审核短片：一篇把周一权利金写成 ${usd(REPORTED)} 的同事复盘，用 105 看涨的源成交演算，有数据的行补回 ×100 乘数后，覆盖小计为 ${dollars(PREMIUM)}；它的五个结论逐一审核：范围有依据，单位、新增仓位和缺失的行权价已修复，预测被删除；以及一份签核，列出有依据的内容、已修复的内容、仍未解决的问题和重新审查的条件`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Audits", "审核"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "amount", label: ["The amount", "金额"] },
		{ id: "claims", label: ["Five claims", "五个结论"] },
		{ id: "signoff", label: ["The signoff", "签核"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一步"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
