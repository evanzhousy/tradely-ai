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
	Word,
} from "../walkthrough/film-kit";
import type { EvidenceKind } from "../walkthrough/types";
import {
	COST,
	EDIT_BODY,
	INSIGHT_BODY,
	NAMES,
	NEAR,
	PASSED,
	STATEMENTS,
} from "./ai-verify-model";

/*
 * Verifying TradingFlow AI, as a film. It opens on one sentence the AI wrote, "Someone
 * opened a large bearish bet on CRUX ahead of news", and sorts the whole answer by what
 * backs each sentence: one is in the report's key figures, two can be calculated from the
 * rows, and two, the bet and a forecast that CRUX will fall, no data supports. Then the
 * bill: two text replies and one with a chart cost 4 credits. Last, the two AI actions on
 * a recipe: AI Insight explains a run and changes nothing; Edit with AI opens a private
 * draft.
 *
 *   open      0–4        "Ask TradingFlow AI, then verify"
 *   question  4–9.6      "Someone opened a large bearish bet on CRUX…"
 *   sort      9.6–23.5   five sentences, sorted; cut: a draft until sorted
 *   credits   23.5–29.4  1 + 1 + 2 = 4 credits, locked
 *   insight   29.4–42.5  AI Insight; Edit with AI; cut: the claim
 *   next      42.5–44.9  Next: build your own Rank column
 */

const END = 44.9;
const BET = STATEMENTS.find((item) => item.id === "bet") ?? STATEMENTS[0];
const REPLIES = [
	{ kind: "text", cost: COST.text },
	{ kind: "text", cost: COST.text },
	{ kind: "chart", cost: COST.chart },
] as const;
const TOTAL = REPLIES.reduce((sum, reply) => sum + reply.cost, 0);
/** Each statement as a phone's row can hold it beside its verdict. */
const shortText: Record<string, Copy> = {
	count: [
		`${PASSED.length} contracts across ${NAMES} names`,
		`${NAMES} 个标的共 ${PASSED.length} 份合约`,
	],
	ratio: ["CRUX put: 2.67× its OI", "CRUX 看跌：2.67 倍未平仓"],
	bet: ["A large bearish bet on CRUX", "CRUX 上的大额看空押注"],
	near: [
		`${NEAR} of ${PASSED.length} expire within 30 days`,
		`${PASSED.length} 份中 ${NEAR} 份 30 天内到期`,
	],
	fall: ["CRUX will fall before Oct 4", "CRUX 会在10月4日前下跌"],
};
const verdicts: Partial<Record<EvidenceKind, { text: Copy; color: string }>> = {
	observed: {
		text: ["in the report", "报告中有"],
		color: "var(--diagram-observed)",
	},
	calculated: {
		text: ["calculated", "可计算"],
		color: "var(--diagram-accent)",
	},
	unknown: { text: ["not supported", "无依据"], color: "var(--diagram-loss)" },
};

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room, type: T } = frame;
	const rowTop = H * (narrow ? 0.27 : 0.26);
	const rowH = H * (narrow ? 0.118 : 0.105);
	const rowStep = rowH + H * (narrow ? 0.012 : 0.018);
	const chipW = narrow ? 82 : 150;
	return {
		...frame,
		rowY: (i: number) => rowTop + i * rowStep,
		rowH,
		chipW,
		chipX: margin + room - chipW - (narrow ? 6 : 12),
		rowText: narrow ? T.small * 1.1 : T.body,
		basisText: T.small * 1.1,
		ledgerY: (i: number) => H * 0.3 + i * H * (narrow ? 0.13 : 0.12),
		ledgerH: H * (narrow ? 0.105 : 0.095),
		barY: H * 0.26,
		barH: H * (narrow ? 0.14 : 0.13),
		panelY: H * (narrow ? 0.45 : 0.44),
		panelW: narrow ? room : (room - 20) / 2,
		panelText: narrow ? T.small * 1.15 : T.body,
		panelPad: narrow ? 10 : 16,
	};
}

const copy = {
	title: ["Ask TradingFlow AI, then verify", "问 TradingFlow AI，然后核查"],
	titleSub: ["sort an answer by what backs it", "按依据给回答分类"],
	qTag: [
		"TradingFlow AI · about Monday's screen",
		"TradingFlow AI · 关于周一的筛选",
	],
	qLine: [
		"What does Monday's screen actually support?",
		"周一的筛选到底支持哪部分？",
	],
	sortHead: ["Sort every sentence by what backs it.", "按依据给每句话分类。"],
	sortHeadShort: ["Sort each sentence.", "给每句话分类。"],
	betHead: [
		"“A large bearish bet”: no screen shows who.",
		"“大额看空押注”：没有筛选能显示是谁。",
	],
	betHeadShort: ["The bet: not in any screen.", "押注：任何筛选都看不到。"],
	restHead: [
		"One count checks out; one forecast doesn't.",
		"一个计数可核对；一个预测无依据。",
	],
	restHeadShort: ["A count; and a forecast.", "一个计数；一个预测。"],
	draftBig: [
		"An AI answer is a draft until sorted.",
		"分类之前，AI 的回答只是草稿。",
	],
	draftSub: [
		"Flow data can't name who traded, why, or where a price will go.",
		"成交流数据无法说明谁交易、为什么，也无法说明价格走向。",
	],
	creditHead: [
		"Three replies, one with a chart.",
		"三条回复，其中一条含图表。",
	],
	totalHead: ["The chart reply costs double.", "含图表的回复收费翻倍。"],
	billing: ["Billing · AI usage history", "账单 · AI 使用记录"],
	total: ["total", "合计"],
	screener: [
		"Unusual Options Activity Screener",
		"Unusual Options Activity Screener",
	],
	screenerShort: ["UOA Screener", "UOA Screener"],
	official: ["Official recipe · unchanged", "官方 Recipe · 未改动"],
	drafted: [
		"Official recipe · unchanged · your private draft opened",
		"官方 Recipe · 未改动 · 已打开你的私有草稿",
	],
	draftedShort: [
		"Official unchanged · draft opened",
		"官方未改动 · 草稿已打开",
	],
	insightHead: [
		"AI Insight explains a run; nothing changes.",
		"AI Insight 解释一次运行；什么都不变。",
	],
	insightHeadShort: ["AI Insight explains.", "AI Insight 只解释。"],
	editHead: [
		"Edit with AI opens a private draft.",
		"Edit with AI 打开一份私有草稿。",
	],
	editHeadShort: ["Edit with AI: a draft.", "Edit with AI：草稿。"],
	claimBig: ["The AI drafts; you verify.", "AI 起草，你来核查。"],
	claimSub: [
		"Sort sentences, count credits, edit only in drafts.",
		"给句子分类，算清积分，只在草稿里修改。",
	],
	nextBig: ["Next: build your own Rank column", "下一课：构建你自己的 Rank 列"],
	nextSub: [
		"a formula with sensible units and a floor",
		"单位合理、带门槛的公式",
	],
} as const satisfies Record<string, Copy>;

const replyLabel = (i: number, kind: "text" | "chart"): Copy =>
	kind === "chart"
		? [`Reply ${i + 1} · with a chart`, `回复 ${i + 1} · 含图表`]
		: [`Reply ${i + 1} · text`, `回复 ${i + 1} · 文字`];
const creditText = (n: number): Copy => [
	`${n} ${n === 1 ? "credit" : "credits"}`,
	`${n} 积分`,
];

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
	const claim = (name: string, big: Copy, sub: Copy) => (
		<g data-f={name}>
			<Lines
				name={`${name}-big`}
				text={t(big)}
				x={W / 2}
				y={H * 0.42}
				size={T.title}
				maxWidth={room}
			/>
			<Lines
				name={`${name}-sub`}
				text={t(sub)}
				x={W / 2}
				y={
					H * 0.42 +
					T.title * 1.15 +
					(lineCount(t(big), room, T.title) - 1) * T.title * 1.35
				}
				size={T.body}
				maxWidth={room}
				className="wt-film-type wt-film-dim"
			/>
		</g>
	);
	const textW = room - L.chipW - 40;
	const panelH =
		L.panelPad * 2 +
		T.body * 1.6 +
		Math.max(
			...[INSIGHT_BODY, EDIT_BODY].map((body) =>
				lineCount(t(body), L.panelW - 2 * L.panelPad, L.panelText),
			),
		) *
			L.panelText *
			1.35;
	const quote = `“${t(BET.text)}”`;
	const quoteSize = narrow ? T.head * 1.2 : T.title;
	const quoteY = H * 0.28 + quoteSize * 1.5;
	const panelX = (i: number) =>
		narrow ? margin : margin + i * (L.panelW + 20);
	return (
		<>
			<Backdrop frame={L} />

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				<Word
					name="q-tag"
					x={W / 2}
					y={H * 0.28}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.qTag).toUpperCase()}
				</Word>
				<Lines
					name="q-big"
					text={quote}
					x={W / 2}
					y={quoteY}
					size={quoteSize}
					maxWidth={room}
				/>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={
						quoteY +
						(lineCount(quote, room, quoteSize) - 1) * quoteSize * 1.35 +
						quoteSize * 1.3
					}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-accent"
				/>
			</g>
			{headline("s-head", copy.sortHead, copy.sortHeadShort)}
			{headline("b-head", copy.betHead, copy.betHeadShort)}
			<Lines
				name="r-head"
				text={t(narrow ? copy.restHeadShort : copy.restHead)}
				x={L.margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.betHeadShort : copy.betHead),
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

			{/* Five sentences and their verdicts. */}
			<g data-f="rows">
				{STATEMENTS.map((item, i) => {
					const y = L.rowY(i);
					const verdict = verdicts[item.evidence];
					const unsupported = item.evidence === "unknown";
					return (
						<g key={item.id} data-f={`row-${item.id}`}>
							<rect
								x={margin}
								y={y}
								width={room}
								height={L.rowH}
								rx={9}
								className="wt-panel-shape"
							/>
							<rect
								data-f={`flag-${item.id}`}
								x={margin}
								y={y}
								width={room}
								height={L.rowH}
								rx={9}
								className={unsupported ? "wt-band-loss" : "wt-focus-shape"}
								style={
									unsupported
										? {
												stroke: "var(--diagram-loss)",
												strokeWidth: 1.5,
												strokeDasharray: "5 4",
											}
										: undefined
								}
							/>
							<text
								x={margin + 14}
								y={
									narrow ? y + L.rowH / 2 + L.rowText * 0.36 : y + L.rowH * 0.42
								}
								className="wt-film-type"
								style={{ fontSize: L.rowText }}
							>
								{t(narrow ? shortText[item.id] : item.text)}
							</text>
							{narrow ? null : (
								<text
									data-f={`basis-${item.id}`}
									x={margin + 14}
									y={y + L.rowH * 0.78}
									className="wt-film-type wt-film-dim"
									style={{ fontSize: L.basisText }}
								>
									{t(item.basis).length * L.basisText * 0.5 > textW
										? `${t(item.basis).slice(0, Math.floor(textW / (L.basisText * 0.5)) - 1)}…`
										: t(item.basis)}
								</text>
							)}
							{verdict ? (
								<g data-f={`chip-${item.id}`}>
									<rect
										x={L.chipX}
										y={y + L.rowH / 2 - L.rowText * 0.9}
										width={L.chipW}
										height={L.rowText * 1.8}
										rx={L.rowText * 0.9}
										className="wt-panel-shape"
										style={{ stroke: verdict.color }}
									/>
									<text
										x={L.chipX + L.chipW / 2}
										y={y + L.rowH / 2 + L.rowText * 0.34}
										textAnchor="middle"
										className="wt-film-type"
										style={{ fontSize: L.rowText * 0.92, fill: verdict.color }}
									>
										{t(verdict.text)}
									</text>
								</g>
							) : null}
						</g>
					);
				})}
			</g>
			{claim("draft", copy.draftBig, copy.draftSub)}

			{/* The bill. */}
			{headline("c-head", copy.creditHead, copy.creditHead)}
			<Lines
				name="t-head"
				text={t(narrow ? copy.totalHead : copy.totalHead)}
				x={L.margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.creditHead : copy.creditHead),
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
			<Brackets name="lock-total" glow />
			<g data-f="ledger">
				<text
					data-f="billing"
					x={margin}
					y={L.ledgerY(0) - H * 0.035}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.billing).toUpperCase()}
				</text>
				{REPLIES.map((reply, i) => (
					<g key={`reply-${i + 1}`} data-f={`reply-${i}`}>
						<rect
							x={margin}
							y={L.ledgerY(i)}
							width={room}
							height={L.ledgerH}
							rx={9}
							className="wt-panel-shape"
						/>
						<text
							x={margin + 14}
							y={L.ledgerY(i) + L.ledgerH / 2 + L.rowText * 0.36}
							className="wt-film-type"
							style={{ fontSize: L.rowText }}
						>
							{t(replyLabel(i, reply.kind))}
						</text>
						<text
							data-f={`cost-${i}`}
							x={margin + room - 14}
							y={L.ledgerY(i) + L.ledgerH / 2 + L.rowText * 0.36}
							textAnchor="end"
							className={`wt-film-num ${reply.kind === "chart" ? "wt-film-accent" : ""}`}
							style={{ fontSize: L.rowText }}
						>
							{t(creditText(reply.cost))}
						</text>
					</g>
				))}
				<g data-f="total-row">
					<rect
						x={margin}
						y={L.ledgerY(3)}
						width={room}
						height={L.ledgerH}
						rx={9}
						className="wt-focus-shape"
					/>
					<text
						x={margin + 14}
						y={L.ledgerY(3) + L.ledgerH / 2 + L.rowText * 0.36}
						className="wt-film-type wt-film-accent"
						style={{ fontSize: L.rowText }}
					>
						{t(copy.total).toUpperCase()}
					</text>
				</g>
				<text
					data-f="total"
					x={margin + room - 14}
					y={L.ledgerY(3) + L.ledgerH / 2 + T.head * 0.36}
					textAnchor="end"
					className="wt-film-num wt-film-accent"
					style={{ fontSize: T.head }}
				>
					{t(creditText(0))}
				</text>
			</g>

			{/* Two AI actions on a recipe. */}
			{headline("i-head", copy.insightHead, copy.insightHeadShort)}
			{headline("e-head", copy.editHead, copy.editHeadShort)}
			<g data-f="recipe">
				<rect
					data-f="bar"
					x={margin}
					y={L.barY}
					width={room}
					height={L.barH}
					rx={12}
					className="wt-panel-shape"
				/>
				<text
					data-f="bar-title"
					x={margin + 16}
					y={L.barY + L.barH * 0.42}
					className="wt-film-type"
					style={{ fontSize: L.rowText * 1.05 }}
				>
					{t(narrow ? copy.screenerShort : copy.screener)}
				</text>
				{(
					[
						["st-official", copy.official, "wt-film-dim"],
						[
							"st-draft",
							narrow ? copy.draftedShort : copy.drafted,
							"wt-film-accent",
						],
					] as const
				).map(([name, text, tone]) => (
					<text
						key={name}
						data-f={name}
						x={margin + 16}
						y={L.barY + L.barH * 0.76}
						className={`wt-film-type ${tone}`}
						style={{ fontSize: T.small * 1.1 }}
					>
						{t(text)}
					</text>
				))}
				{(
					[
						["p-insight", "AI Insight", INSIGHT_BODY, 0],
						["p-edit", "Edit with AI", EDIT_BODY, 1],
					] as const
				).map(([name, title, body, i]) => (
					<g key={name} data-f={name}>
						<rect
							x={panelX(i)}
							y={L.panelY}
							width={L.panelW}
							height={panelH}
							rx={12}
							className={i === 1 ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						<text
							x={panelX(i) + L.panelPad}
							y={L.panelY + L.panelPad + T.body}
							className={`wt-film-type ${i === 1 ? "wt-film-accent" : ""}`}
							style={{ fontSize: T.body * 1.05 }}
						>
							{title}
						</text>
						<Lines
							name={`${name}-body`}
							text={t(body)}
							x={panelX(i) + L.panelPad}
							y={L.panelY + L.panelPad + T.body * 1.6 + L.panelText * 1.1}
							size={L.panelText}
							maxWidth={L.panelW - 2 * L.panelPad}
							anchor="start"
							className="wt-film-type wt-film-dim"
						/>
					</g>
				))}
			</g>
			{claim("claim", copy.claimBig, copy.claimSub)}
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
	const { width: W, locale } = context;
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
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const row = (id: string) => one(`row-${id}`);
	const chip = (id: string) => one(`chip-${id}`);
	const basis = (id: string) => one(`basis-${id}`);
	const flag = (id: string) => one(`flag-${id}`);
	const verdict = (id: string, time: number) => {
		show(chip(id), time, "right");
		const b = basis(id);
		if (b) show(b, time + 0.15);
	};
	const replies = REPLIES.map((_, i) => one(`reply-${i}`));
	const costs = REPLIES.map((_, i) => one(`cost-${i}`));
	const total = one<SVGTextElement>("total");
	const credits = (n: number) => pick(creditText(Math.round(n)), locale);
	const narrow = L.narrow;

	const lockTotal = one<SVGGraphicsElement>("lock-total");

	d.hidden([
		...flat("q"),
		...[
			"s-head",
			"b-head",
			"r-head",
			"c-head",
			"t-head",
			"i-head",
			"e-head",
		].map((name) => one(name)),
		...STATEMENTS.flatMap((item) =>
			[row(item.id), chip(item.id), basis(item.id), flag(item.id)].filter(
				Boolean,
			),
		),
		...kids("draft"),
		one("billing"),
		...replies,
		...costs,
		one("total-row"),
		total,
		lockTotal,
		one("bar"),
		one("bar-title"),
		one("st-official"),
		one("st-draft"),
		one("p-insight"),
		one("p-edit"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: one sentence the AI wrote ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	word(one("q-big"), 4.8);
	show(one("q-line"), 6.0);

	// ——— sort: what backs each sentence ———
	tl.addLabel("sort", 9.6);
	hide(flat("q"), 9.6);
	show(one("s-head"), 9.8, "above");
	STATEMENTS.forEach((item, i) => {
		show(row(item.id), 10.1 + i * 0.15);
	});
	verdict("count", 11.0);
	verdict("ratio", 11.6);
	d.swap(one("s-head"), one("b-head"), 13.4);
	tl.to(flag("bet"), { opacity: 1, duration: 0.4 }, 13.8);
	verdict("bet", 14.0);
	show(one("r-head"), 15.8);
	verdict("near", 16.1);
	tl.to(flag("fall"), { opacity: 1, duration: 0.4 }, 16.7);
	verdict("fall", 16.9);
	// Cut: a draft until sorted.
	hide(
		[
			one("b-head"),
			one("r-head"),
			...STATEMENTS.flatMap((item) =>
				[row(item.id), chip(item.id), basis(item.id), flag(item.id)].filter(
					Boolean,
				),
			),
		],
		19.4,
	);
	word(one("draft-big"), 19.8);
	show(one("draft-sub"), 20.0);

	// ——— credits: every reply has a price ———
	tl.addLabel("credits", 23.5);
	hide(kids("draft"), 23.5);
	show(one("c-head"), 23.85, "above");
	show(one("billing"), 24);
	replies.forEach((reply, i) => {
		show(reply, 24.2 + i * 0.3);
	});
	show(one("t-head"), 25.5);
	costs.forEach((cost, i) => {
		show(cost, 25.7 + i * 0.3, "right");
	});
	show([one("total-row"), total], 26.7);
	d.count(total, TOTAL, 26.9, credits, 0, 0.8);
	// The hero: what three replies cost.
	d.lock(lockTotal, 28.1, { around: total, pad: 6 });
	tl.addLabel("hero-lock", 28.1);

	// ——— insight: explain, or edit a draft ———
	tl.addLabel("insight", 29.4);
	hide(
		[
			one("c-head"),
			one("t-head"),
			one("billing"),
			...replies,
			...costs,
			one("total-row"),
			total,
			lockTotal,
		],
		29.4,
	);
	show(one("i-head"), 29.75, "above");
	show([one("bar"), one("bar-title")], 30);
	show(one("st-official"), 30.2);
	show(one("p-insight"), 30.6);
	d.swap(one("i-head"), one("e-head"), 33.6);
	// On a phone the panels share one place: Edit with AI replaces AI Insight.
	if (narrow) hide(one("p-insight"), 34.1);
	show(one("p-edit"), narrow ? 34.4 : 34.0, narrow ? "below" : "right");
	d.flip(one("st-official"), one("st-draft"), 34.6);
	tl.set(one("st-official"), { opacity: 0 }, 34.9);
	// Cut: the claim.
	hide(
		[
			one("e-head"),
			one("bar"),
			one("bar-title"),
			one("st-draft"),
			one("p-insight"),
			one("p-edit"),
		],
		38,
	);
	word(one("claim-big"), 38.4);
	show(one("claim-sub"), 38.8);

	// ——— next ———
	tl.addLabel("next", 42.5);
	hide(kids("claim"), 42.5);
	d.close(42.5);
	return tl;
}

export const aiVerifyFilm: Film = {
	id: "ai-verify",
	label: [
		`Verifying TradingFlow AI, as a short film: one sentence the AI wrote about Monday's screen, that someone opened a large bearish bet on CRUX ahead of news; the whole answer sorted by what backs each sentence, one in the report's key figures, two calculated from its rows, and the bet and a forecast that CRUX will fall supported by nothing in the data; a bill of two text replies and one with a chart for ${TOTAL} credits; and the recipe's two AI actions, AI Insight explaining a run without changing anything and Edit with AI opening a private draft`,
		`核查 TradingFlow AI 短片：AI 关于周一筛选写的一句话，“有人在消息公布前对 CRUX 建立了大额看空押注”；按依据给整段回答分类，一句在报告的关键数字里，两句可以从行数据算出，而押注和“CRUX 会下跌”的预测在数据里毫无依据；两条文字回复加一条含图表的回复，共 ${TOTAL} 积分；以及 Recipe 上的两种 AI 操作，AI Insight 只解释一次运行、什么都不改，Edit with AI 打开一份私有草稿`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Verify AI", "核查 AI"] },
		{ id: "question", label: ["The sentence", "那句话"] },
		{ id: "sort", label: ["Sort it", "分类"] },
		{ id: "credits", label: ["Credits", "积分"] },
		{ id: "insight", label: ["Insight vs edit", "解释与编辑"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
