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
 * $165,520. The hero audits the recap's five claims: one supported, three repaired, and
 * the forecast cut, where glowing brackets lock. Last, the signoff: what passed, what
 * changed, what is still open, and what would reopen it.
 *
 *   open      0–4        "Audits"
 *   question  4–8.6      $1,655.20 in premium: pass it?
 *   amount    8.6–19     the report's rows; recomputed; × 100 missing
 *   claims    19–28.6    hero: five claims; supported, defects; repairs; the forecast cut
 *   signoff   28.6–35    supported, repaired, open, reopen if
 *   claim     35–39.4    find it, fix it, say what's open
 *   next      39.4–41.9  Next: the module checkpoint
 */

const END = 41.9;
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
	mHead: ["Recompute each row from its trades.", "按成交逐行重算。"],
	m2Head: [
		`Every row is 100×: restored, ${dollars(PREMIUM)}.`,
		`每行都是 100 倍：补回后 ${dollars(PREMIUM)}。`,
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
	removed: ["removed", "已删除"],
	sHead: ["The signoff keeps the gaps in view.", "签核时把缺口摆在明处。"],
	s2Head: ["It passes, with what would reopen it.", "通过，并写明何时重审。"],
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
			<Brackets name="lock-cut" glow />
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
			{headline("s-head", copy.sHead)}
			<Lines
				name="s2-head"
				text={t(copy.s2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.sHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
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
	/** A figure lands slightly large and settles, without overshoot: it is data. */
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const heads = [
		"m-head",
		"m2-head",
		"c-head",
		"c2-head",
		"s-head",
		"s2-head",
	].map((name) => one(name));
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
	show(one("col-fixed"), 11.8);
	fixed.forEach((el, i) => {
		word(el, 12.0 + i * 0.25);
	});
	tl.set(one("total-report"), { textDecoration: "line-through" }, 14.0);
	tl.to(one("total-report"), { opacity: 0.5, duration: 0.3 }, 14.0);
	word(one("total-fixed"), 14.2);
	show(heads[1], 14.6);

	// ——— claims: the hero. All five, audited and repaired. ———
	tl.addLabel("claims", 19);
	d.swap([heads[0], heads[1]], heads[2], 19.0);
	hide(
		[
			...kids("cols"),
			one("col-fixed"),
			...rows,
			...fixed,
			one("total-report"),
			one("total-fixed"),
		],
		19.0,
	);
	claimRows.forEach((row, i) => {
		show(row, 19.8 + i * 0.15, "right");
	});
	tags.forEach((tag, i) => {
		word(tag, 21.4 + i * 0.3);
	});
	tl.set(one("claim-0-box"), { attr: { class: "wt-focus-shape" } }, 21.4);
	claims.forEach((claim, i) => {
		if (claim.status === "supported") return;
		tl.to(
			one(`claim-${i}-text`),
			{ opacity: 0.4, duration: 0.3 },
			23.2 + i * 0.3,
		);
	});
	fixes.forEach((fix, i) => {
		show(fix, 23.1 + i * 0.3, "right");
	});
	// A phone has one line for the tag and the repair: the repair takes it.
	if (L.narrow)
		claims.forEach((claim, i) => {
			if (claim.status !== "supported")
				tl.to(tags[i], { opacity: 0, duration: 0.25 }, 22.8 + i * 0.3);
		});
	// The forecast, cut: the repair that removes a claim outright.
	const cut = claims.findIndex((claim) => claim.status === "removed");
	d.lock(lockCut, 25.0, {
		around: [claimRows[cut], one(`fix-${cut}`)],
		pad: 3,
	});
	tl.addLabel("hero-lock", 25.0);
	show(heads[3], 25.0);

	// ——— signoff ———
	tl.addLabel("signoff", 28.6);
	d.swap([heads[2], heads[3]], heads[4], 28.6);
	hide([...claimRows, ...tags, ...fixes, lockCut], 28.6);
	secs.forEach((sec, i) => {
		show(sec, 29.4 + i * 0.6, "right");
	});
	show(heads[5], 31.4);

	// ——— claim ———
	tl.addLabel("claim", 35);
	hide([heads[4], heads[5], ...secs], 35.0);
	word(one("z-big"), 35.3);
	show(one("z-sub"), 35.7);

	// ——— next ———
	tl.addLabel("next", 39.4);
	hide(kids("claim"), 39.4);
	d.close(39.4);
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
