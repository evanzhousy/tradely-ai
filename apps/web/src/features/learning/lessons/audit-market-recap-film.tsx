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
	createDirector,
	EndCard,
	filmFrame,
	Lines,
	lineCount,
	TitleCard,
	Word,
} from "../walkthrough/film-kit";
import {
	claims,
	dollars,
	PREMIUM,
	REPORTED,
	type Status,
	sections,
} from "./audit-market-recap-model";

/*
 * Audits, as a film. A colleague's recap puts Monday's premium at $1,655.20, and its
 * contracts and prices match the tape: does it pass? The rows answer: recomputed from the
 * trades each is 100 times the report; the multiplier is missing, and the total is
 * $165,520. Then the recap's five claims audited: one supported, three repaired, one
 * removed. Last, the signoff: what passed, what changed, what is still open, and what
 * would reopen it.
 *
 *   open      0–4      "Audits"
 *   question  4–9.5    $1,655.20 in premium: pass it?
 *   amount    9.5–19   the report's rows; recomputed; × 100 missing
 *   claims    19–29.5  five claims; supported, defects; repairs
 *   signoff   29.5–37  supported, repaired, open, reopen if
 *   claim     37–39.5  find it, fix it, say what's open
 *   next      39.5–42  Next: the module checkpoint
 */

const END = 42;
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
		totalY: H * (narrow ? 0.76 : 0.78),
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
	m0: [
		"Start from the source rows, not the prose: the report's premium by strike.",
		"从原始行开始，而不是从文字：报告里各行权价的权利金。",
	],
	m0Short: ["The report's rows.", "报告的各行。"],
	m1: [
		"Recompute each from its trades: every row is exactly 100 times the report.",
		"按成交逐行重算：每一行都恰好是报告的 100 倍。",
	],
	m1Short: ["Recomputed: × 100.", "重算：× 100。"],
	m2: [
		`The multiplier is missing. Restored: ${dollars(PREMIUM)}, with the 120 call still missing.`,
		`漏了乘数。补回后：${dollars(PREMIUM)}，120 看涨仍然缺失。`,
	],
	m2Short: [`Restored: ${dollars(PREMIUM)}.`, `补回：${dollars(PREMIUM)}。`],
	report: ["report", "报告"],
	recomputed: ["recomputed", "重算"],
	noData: ["no data", "无数据"],
	c0: [
		"The recap makes five claims. The premium is only one of them.",
		"复盘提出了五个结论。权利金只是其中之一。",
	],
	c0Short: ["Five claims.", "五个结论。"],
	c1: [
		"Checked against packet P1: the scope holds; units, positions, the missing strike and the forecast don't.",
		"对照研究包 P1：范围成立；单位、持仓、缺失的行权价和预测都不成立。",
	],
	c1Short: ["One holds; four don't.", "一个成立，四个不成立。"],
	c2: [
		"Rewrite each defect to what P1 shows, and cut the forecast.",
		"把每个缺陷改写成 P1 能显示的内容，删掉预测。",
	],
	c2Short: ["Repair; cut the forecast.", "修复；删掉预测。"],
	supported: ["supported", "有依据"],
	scopeShort: ["Oct 18 calls, 100–120, Mon", "10月18日 看涨 100–120，周一"],
	repaired: ["repaired", "已修复"],
	removed: ["removed", "已删除"],
	s0: [
		"The signoff: what the evidence supports, with its scope and packet.",
		"签核：证据支持什么，附上范围和研究包。",
	],
	s0Short: ["Supported.", "有依据。"],
	s1: [
		"Then each repair, and what is still open, with where it will come from.",
		"然后是每项修复，以及仍未解决的问题和数据来源。",
	],
	s1Short: ["Repaired; open.", "已修复；未解决。"],
	s2: [
		"Last, what would reopen it. It passes without pretending the gaps are closed.",
		"最后是重新审查的条件。通过，但不假装缺口已经补上。",
	],
	s2Short: ["And what reopens it.", "以及何时重审。"],
	claimBig: [
		"Find it, fix it, say what's open.",
		"找到它，修好它，说明未解决的。",
	],
	claimSub: [
		"Recompute from the source, check every claim, not only the one that failed, and sign off with the gaps in view.",
		"从源头重算，检查每一个结论而不只是出错的那个，签核时把缺口摆在明处。",
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
			{headline("m0", copy.m0, copy.m0Short)}
			{headline("m1", copy.m1, copy.m1Short)}
			{headline("m2", copy.m2, copy.m2Short)}
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
			{headline("c0", copy.c0, copy.c0Short)}
			{headline("c1", copy.c1, copy.c1Short)}
			{headline("c2", copy.c2, copy.c2Short)}
			{claims.map((claim, i) => (
				<g key={claim.id}>
					<g data-f={`claim-${i}`}>
						<rect
							data-f={`claim-${i}-box`}
							x={margin}
							y={L.claimY(i)}
							width={room}
							height={L.claimH}
							rx={10}
							className="wt-panel-shape"
						/>
						<text
							data-f={`claim-${i}-text`}
							x={margin + 14}
							y={L.claimY(i) + L.claimH * 0.42}
							className="wt-film-type"
							style={{ fontSize: text }}
						>
							{t(narrow && claim.id === "scope" ? copy.scopeShort : claim.text)}
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
							x={margin + 14}
							y={L.claimY(i) + L.claimH * 0.78}
							className={`wt-film-type ${claim.status === "removed" ? "wt-film-loss" : "wt-film-gain"}`}
							style={{ fontSize: narrow ? T.small : T.small * 1.1 }}
						>
							{claim.repair ? `→ ${t(claim.repair)}` : `✕ ${t(copy.removed)}`}
						</text>
					) : null}
				</g>
			))}

			{/* The signoff. */}
			{headline("s0", copy.s0, copy.s0Short)}
			{headline("s1", copy.s1, copy.s1Short)}
			{headline("s2", copy.s2, copy.s2Short)}
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
						size={narrow ? T.small * 0.95 : T.small * 1.2}
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
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
			time,
		);
	const heads = ["m0", "m1", "m2", "c0", "c1", "c2", "s0", "s1", "s2"].map(
		(name) => one(name),
	);
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
		one("total-report"),
		one("total-fixed"),
		...claimRows,
		...tags,
		...fixes,
		...secs,
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	show(one("q-line"), 5.1);
	word(one("q-big"), 6.6);

	// ——— amount: recompute from the rows ———
	tl.addLabel("amount", 9.5);
	hide(flat("q"), 9.5);
	show(heads[0], 9.7, "above");
	show(kids("cols"), 10.0);
	rows.forEach((row, i) => {
		show(row, 10.1 + i * 0.12, "right");
	});
	show(one("total-report"), 10.9);
	tl.set(one("total-report"), { textDecoration: "none" }, 10.9);
	d.swap(heads[0], heads[1], 12.4);
	show(one("col-fixed"), 12.8);
	fixed.forEach((el, i) => {
		d.pop(el, 13.0 + i * 0.25);
	});
	d.swap(heads[1], heads[2], 15.4);
	tl.set(one("total-report"), { textDecoration: "line-through" }, 15.8);
	tl.to(one("total-report"), { opacity: 0.5, duration: 0.3 }, 15.8);
	d.slam(one("total-fixed"), 16.0);

	// ——— claims: five, audited ———
	tl.addLabel("claims", 19);
	hide(
		[
			heads[2],
			...kids("cols"),
			one("col-fixed"),
			...rows,
			...fixed,
			one("total-report"),
			one("total-fixed"),
		],
		19.0,
	);
	show(heads[3], 19.2, "above");
	claimRows.forEach((row, i) => {
		show(row, 19.5 + i * 0.15, "right");
	});
	d.swap(heads[3], heads[4], 21.4);
	tags.forEach((tag, i) => {
		d.pop(tag, 21.8 + i * 0.3);
	});
	tl.set(one("claim-0-box"), { attr: { class: "wt-focus-shape" } }, 21.8);
	d.swap(heads[4], heads[5], 24.6);
	claims.forEach((claim, i) => {
		if (claim.status === "supported") return;
		tl.to(
			one(`claim-${i}-text`),
			{ opacity: 0.4, duration: 0.3 },
			25.0 + i * 0.3,
		);
	});
	fixes.forEach((fix, i) => {
		show(fix, 25.1 + i * 0.3, "right");
	});
	// A phone has one line for the tag and the repair: the repair takes it.
	if (L.narrow)
		claims.forEach((claim, i) => {
			if (claim.status !== "supported")
				tl.to(tags[i], { opacity: 0, duration: 0.25 }, 24.9 + i * 0.3);
		});

	// ——— signoff ———
	tl.addLabel("signoff", 29.5);
	hide([heads[5], ...claimRows, ...tags, ...fixes], 29.5);
	show(heads[6], 29.7, "above");
	show(secs[0], 30.0, "right");
	d.swap(heads[6], heads[7], 31.6);
	show(secs[1], 32.0, "right");
	show(secs[2], 32.6, "right");
	d.swap(heads[7], heads[8], 34.2);
	show(secs[3], 34.6, "right");

	// ——— claim ———
	tl.addLabel("claim", 37);
	hide([heads[8], ...secs], 37.0);
	word(one("z-big"), 37.3);
	show(one("z-sub"), 37.7);

	// ——— next ———
	tl.addLabel("next", 39.5);
	hide(kids("claim"), 39.5);
	d.close(39.5);
	return tl;
}

export const auditMarketRecapFilm: Film = {
	id: "audit-market-recap",
	label: [
		`Audits, as a short film: a colleague's recap that puts Monday's premium at ${usd(REPORTED)}, whose rows recomputed from their trades are each 100 times the report, ${dollars(PREMIUM)} with the multiplier restored; its five claims audited, the scope supported, the units, new positions and missing strike repaired, and the forecast removed; and a signoff listing what is supported, what was repaired, what is still open and what would reopen it`,
		`审核短片：一篇把周一权利金写成 ${usd(REPORTED)} 的同事复盘，按成交逐行重算后每一行都是报告的 100 倍，补回乘数后为 ${dollars(PREMIUM)}；它的五个结论逐一审核：范围有依据，单位、新增仓位和缺失的行权价已修复，预测被删除；以及一份签核，列出有依据的内容、已修复的内容、仍未解决的问题和重新审查的条件`,
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
