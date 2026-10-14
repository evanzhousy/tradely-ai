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
import {
	EARNINGS,
	EDITED,
	FRIEND,
	MESSAGES,
	type Step,
	TEMPLATE,
} from "./research-checklist-model";

/*
 * Research checklists, as a film. It opens on Home's question, "Before I sell a call, what
 * should I check?", and a friend's three-step answer whose last step, "Confirm ALFA stays
 * below $105", no tool can check: a forecast. Home's template has four steps, each opening
 * a tool. Add an earnings step and move call flow up, then refresh: the template is back,
 * because Home doesn't save. Last, Customize with AI asks one question before it proposes,
 * two replies cost two credits, and nothing is saved.
 *
 *   open       0–4        "Start from a research checklist"
 *   question   4–9.6      "Before I sell a call, what should I check?"
 *   inspect    9.6–19.75   a friend's three steps; one is a forecast; Home's four
 *   edits      19.75–30.85  add earnings, move flow; copy to notes; restore Home; lock the notes
 *   customize  30.85–44.55    a request, its question, an answer, a proposal; cut: the claim
 *   next       44.55–47.05    Next: ask TradingFlow AI, then verify
 */

const END = 47.05;
const FORECAST = FRIEND[FRIEND.length - 1];
const ROWS: readonly Step[] = [...TEMPLATE, EARNINGS, FORECAST];
const SLOTS = 5;
const at = (steps: readonly Step[], id: string) =>
	steps.findIndex((step) => step.id === id);
// The two carried rows have baked coordinates for their edited slots. Their parents
// therefore return to zero translation before the notes hand-over.
const baseSlot = (id: string) =>
	id === EARNINGS.id || id === "flow" ? at(EDITED, id) : 0;
/** Each step as a phone's row can hold it. */
const shortText: Record<string, Copy> = {
	vol: ["IV vs realized volatility", "隐含波动率与已实现波动率"],
	gex: ["GEX / OI structure", "GEX / OI 结构"],
	trade: ["The call's spread, liquidity, OI", "看涨的价差、流动性、未平仓量"],
	flow: ["Recent call flow", "近期看涨成交流"],
	earnings: ["Earnings Oct 3, before expiry", "10月3日财报，在到期前"],
	forecast: ["Confirm ALFA stays below $105", "确认 ALFA 一直低于 $105"],
};

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room, type: T } = frame;
	const top = H * (narrow ? 0.26 : 0.28);
	const rowH = H * (narrow ? 0.128 : 0.1);
	const step = rowH + H * (narrow ? 0.009 : 0.02);
	const numW = narrow ? 26 : 46;
	return {
		...frame,
		slotY: (k: number) => top + k * step,
		rowH,
		step,
		numW,
		rowX: margin + numW,
		rowW: room - numW,
		rowText: narrow ? T.small * 1.1 : T.body,
		toolText: narrow ? T.small : T.small * 1.15,
		bubbleW: narrow ? room : room * 0.62,
		bubbleText: narrow ? T.small * 1.1 : T.body,
		bubblePad: narrow ? 8 : 14,
		// On a phone the credits counter sits under the headline, so the chat starts lower.
		bubbleTop: H * (narrow ? 0.34 : 0.28),
		noteX: margin + 20,
		noteW: room - 40,
		noteSize: T.head * (narrow ? 1.5 : 1.8),
		noteY: (k: number) => H * (k === 0 ? 0.68 : 0.86),
		resetY: (k: number) => H * (0.27 + k * 0.071),
	};
}

const copy = {
	title: ["Start from a research checklist", "从研究清单开始"],
	titleSub: ["steps a tool can check", "工具能核查的步骤"],
	qTag: ["TradingFlow Home", "TradingFlow Home"],
	qBig: [
		"Before I sell a call, what should I check?",
		"卖出看涨前，应该检查什么？",
	],
	qLine: [
		"A friend lists three steps. One doesn't belong.",
		"朋友列了三步，其中一步不该在清单上。",
	],
	friendHead: [
		"A friend's checklist for selling an ALFA call.",
		"朋友列的卖出 ALFA 看涨清单。",
	],
	friendHeadShort: ["A friend's checklist.", "朋友的清单。"],
	flagHead: ["“Stays below $105” is a forecast.", "“一直低于 $105”是预测。"],
	flagHeadShort: ["The last step is a forecast.", "最后一步是预测。"],
	templateHead: [
		"Home: replace the forecast with checks.",
		"Home：用核查步骤替换预测。",
	],
	templateHeadShort: [
		"Home: replace the forecast with checks.",
		"Home：用核查步骤替换预测。",
	],
	editHead: ["Add earnings; move call flow up.", "新增财报，上移看涨成交流。"],
	editHeadShort: ["Add earnings, move flow up.", "加财报，上移成交流。"],
	refreshHead: ["Copy steps, then refresh Home.", "先抄下步骤，再刷新 Home。"],
	refreshHeadShort: [
		"Copy steps, then refresh Home.",
		"先抄步骤，再刷新 Home。",
	],
	forecastNote: ["a forecast, not a check", "这是预测，不是核查"],
	notes: ["Your notes", "你的笔记"],
	noteEarnings: ["Earnings Oct 3", "10月3日财报"],
	noteExpiry: ["before Oct 18 expiry", "在10月18日到期前"],
	homeReset: ["Home reset", "Home 已重置"],
	askHead: [
		"Customize with AI asks one question first.",
		"Customize with AI 先问一个问题。",
	],
	askHeadShort: ["The AI asks first.", "AI 先提问。"],
	proposeHead: [
		"Then it proposes a step. Nothing is saved.",
		"然后提出一步建议。什么都没保存。",
	],
	proposeHeadShort: ["A proposal; nothing saved.", "提出建议；未保存。"],
	meter: ["AI replies", "AI 回复"],
	you: ["You", "你"],
	claimBig: [
		"A checklist inspects; it doesn't forecast.",
		"清单是核查，不是预测。",
	],
	claimSub: [
		"Each step opens today's evidence; test AI proposals too.",
		"每一步都打开今天的证据；AI 建议也照此检验。",
	],
	nextBig: [
		"Next: ask TradingFlow AI, then verify",
		"下一课：问 TradingFlow AI，然后核查",
	],
	nextSub: ["sort an answer by what backs it", "按依据给回答分类"],
} as const satisfies Record<string, Copy>;

const credits = (n: number): Copy => [
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
	// Carried rows rest in their edited slots; other rows rest in the first slot.
	const y0 = L.slotY(0);
	const textY = narrow ? y0 + L.rowH * 0.4 : y0 + L.rowH / 2 + L.rowText * 0.36;
	const toolY = narrow ? y0 + L.rowH * 0.78 : textY;
	// The chat, in two pages of two bubbles.
	const bubbleH = (text: Copy) =>
		L.bubblePad * 2 +
		T.small * 1.5 +
		lineCount(t(text), L.bubbleW - 2 * L.bubblePad, L.bubbleText) *
			L.bubbleText *
			1.35;
	const bubbleY = (i: number) => {
		const first = MESSAGES[i - (i % 2)];
		return i % 2 === 0
			? L.bubbleTop
			: L.bubbleTop + bubbleH(first.text) + H * 0.03;
	};
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
				<Lines
					name="q-big"
					text={t(copy.qBig)}
					x={W / 2}
					y={H * 0.3 + T.title * 1.5}
					size={T.title}
					maxWidth={room}
				/>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={
						H * 0.3 +
						T.title * 1.5 +
						(lineCount(t(copy.qBig), room, T.title) - 1) * T.title * 1.35 +
						T.title * 1.4
					}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("f-head", copy.friendHead, copy.friendHeadShort)}
			<Lines
				name="x-head"
				text={t(narrow ? copy.flagHeadShort : copy.flagHead)}
				x={L.margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.friendHeadShort : copy.friendHead),
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
			{headline("p-head", copy.templateHead, copy.templateHeadShort)}
			{headline("e-head", copy.editHead, copy.editHeadShort)}
			<Lines
				name="r-head"
				text={t(narrow ? copy.refreshHeadShort : copy.refreshHead)}
				x={L.margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.editHeadShort : copy.editHead),
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

			{/* The slots' numbers stay; the steps move between them. */}
			<g data-f="nums">
				{Array.from({ length: SLOTS }, (_, k) => (
					<text
						key={`n-${k + 1}`}
						data-f={`num-${k}`}
						x={margin}
						y={L.slotY(k) + L.rowH / 2 + T.small * 0.36}
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{String(k + 1).padStart(2, "0")}
					</text>
				))}
			</g>
			<g data-f="rows">
				{ROWS.map((row) => {
					const forecast = row.id === FORECAST.id;
					const offset = baseSlot(row.id) * L.step;
					return (
						<g key={row.id} data-f={`row-${row.id}`}>
							<rect
								data-f={`panel-${row.id}`}
								x={L.rowX}
								y={y0 + offset}
								width={L.rowW}
								height={L.rowH}
								rx={9}
								className="wt-panel-shape"
							/>
							<rect
								data-f={`focus-${row.id}`}
								x={L.rowX}
								y={y0 + offset}
								width={L.rowW}
								height={L.rowH}
								rx={9}
								className={forecast ? "wt-band-loss" : "wt-focus-shape"}
								style={
									forecast
										? {
												stroke: "var(--diagram-loss)",
												strokeWidth: 1.5,
												strokeDasharray: "5 4",
											}
										: undefined
								}
							/>
							<text
								data-f={`step-${row.id}`}
								x={L.rowX + 14}
								y={textY + offset}
								className={`wt-film-type ${forecast ? "wt-film-loss" : ""}`}
								style={{ fontSize: L.rowText }}
							>
								{t(
									row.id === EARNINGS.id
										? copy.noteEarnings
										: narrow
											? shortText[row.id]
											: row.text,
								)}
							</text>
							{forecast ? (
								<text
									data-f="forecast-note"
									x={narrow ? L.rowX + 14 : L.rowX + L.rowW - 14}
									y={toolY + offset}
									textAnchor={narrow ? "start" : "end"}
									className="wt-film-type wt-film-loss"
									style={{ fontSize: L.toolText }}
								>
									{t(copy.forecastNote)}
								</text>
							) : (
								<text
									data-f={`tool-${row.id}`}
									x={narrow ? L.rowX + 14 : L.rowX + L.rowW - 14}
									y={toolY + offset}
									textAnchor={narrow ? "start" : "end"}
									className="wt-film-type wt-film-dim"
									style={{ fontSize: L.toolText }}
								>
									{t(row.tool)}
								</text>
							)}
						</g>
					);
				})}
			</g>
			<g data-f="notes">
				<Word
					name="notes-tag"
					x={L.noteX + L.noteW}
					y={H * 0.59}
					size={T.small}
					anchor="end"
					className="wt-film-tag"
				>
					{t(copy.notes)}
				</Word>
				{[EARNINGS, TEMPLATE[3]].map((step, k) => (
					<Lines
						key={`note-${step.id}`}
						name={`note-${step.id}`}
						text={t(
							k === 0
								? copy.noteEarnings
								: narrow
									? shortText[step.id]
									: step.text,
						)}
						x={L.noteX}
						y={L.noteY(k)}
						size={L.noteSize}
						maxWidth={L.noteW}
						anchor="start"
					/>
				))}
				<Word
					name="notes-expiry"
					x={L.noteX}
					y={H * 0.75}
					size={T.small}
					anchor="start"
					className="wt-film-type wt-film-dim"
				>
					{t(copy.noteExpiry)}
				</Word>
			</g>
			<g data-f="reset">
				{TEMPLATE.map((step, k) => (
					<Word
						key={`reset-${step.id}`}
						name={`reset-${step.id}`}
						x={margin}
						y={L.resetY(k)}
						size={L.rowText}
						anchor="start"
						className="wt-film-type wt-film-dim"
					>
						{t(shortText[step.id])}
					</Word>
				))}
				<Word
					name="reset-tag"
					x={margin}
					y={L.resetY(0) - T.small * 1.5}
					size={T.small}
					anchor="start"
					className="wt-film-tag"
				>
					{t(copy.homeReset)}
				</Word>
			</g>
			<Brackets name="lock-plan" glow />

			{/* Customize with AI. */}
			{headline("a-head", copy.askHead, copy.askHeadShort)}
			<Lines
				name="o-head"
				text={t(narrow ? copy.proposeHeadShort : copy.proposeHead)}
				x={L.margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.askHeadShort : copy.askHead),
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
			<g data-f="meter">
				<Word
					name="m-tag"
					x={margin + room}
					y={L.headY + T.head * 1.25}
					size={T.small}
					anchor="end"
					className="wt-film-tag"
				>
					{t(copy.meter).toUpperCase()}
				</Word>
				{[0, 1, 2].map((n) => (
					<Word
						key={`c-${n}`}
						name={`m-${n}`}
						x={margin + room}
						y={L.headY + T.head * 1.25 + T.num * 0.9}
						size={T.num * 0.8}
						anchor="end"
						className="wt-film-num wt-film-accent"
					>
						{t(credits(n))}
					</Word>
				))}
			</g>
			<g data-f="chat">
				{MESSAGES.map((message, i) => {
					const ai = message.from === "ai";
					const x = ai ? margin : margin + room - L.bubbleW;
					const y = bubbleY(i);
					return (
						<g key={message.id} data-f={`b-${message.id}`}>
							<rect
								x={x}
								y={y}
								width={L.bubbleW}
								height={bubbleH(message.text)}
								rx={14}
								className={ai ? "wt-focus-shape" : "wt-panel-shape"}
							/>
							<text
								x={x + L.bubblePad}
								y={y + L.bubblePad + T.small}
								className="wt-film-tag"
								style={{ fontSize: T.small }}
							>
								{ai ? "TRADINGFLOW AI" : t(copy.you).toUpperCase()}
							</text>
							<Lines
								name={`bt-${message.id}`}
								text={t(message.text)}
								x={x + L.bubblePad}
								y={y + L.bubblePad + T.small * 1.5 + L.bubbleText}
								size={L.bubbleText}
								maxWidth={L.bubbleW - 2 * L.bubblePad}
								anchor="start"
							/>
						</g>
					);
				})}
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
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const row = (id: string) => one(`row-${id}`);
	const focus = (id: string) => one(`focus-${id}`);
	const num = (k: number) => one(`num-${k}`);
	const lift = (k: number) => L.slotY(k) - L.slotY(0);
	/** A row arrives in its slot from the right: show() would reset its slot. */
	const enter = (id: string, slot: number, time: number) => {
		tl.set(row(id), { y: lift(slot) - lift(baseSlot(id)) }, time);
		tl.fromTo(
			row(id),
			{ opacity: 0, x: 24 },
			{ opacity: 1, x: 0, duration: 0.45 },
			time,
		);
	};
	const leave = (id: string, time: number) =>
		tl.to(
			row(id),
			{ opacity: 0, x: -24, duration: 0.35, ease: "power2.in" },
			time,
		);
	const move = (id: string, slot: number, time: number) =>
		tl.to(
			row(id),
			{
				y: lift(slot) - lift(baseSlot(id)),
				duration: 0.6,
				ease: "power2.inOut",
			},
			time,
		);
	/** Carry the existing row, with its text continuously visible. Only the single
	 * text changes size; panels and tool labels have already faded before the flight. */
	const carryRow = (id: string, noteSlot: number, time: number) => {
		const text = one<SVGTextElement>(`step-${id}`);
		const duration = 0.7;
		tl.to(
			row(id),
			{
				x: L.noteX - Number(text.getAttribute("x")),
				duration,
				ease: "power2.inOut",
			},
			time,
		);
		tl.to(
			row(id),
			{
				y: L.noteY(noteSlot) - Number(text.getAttribute("y")),
				duration,
				ease: "power3.out",
			},
			time,
		);
		tl.fromTo(
			text,
			{ fontSize: L.rowText },
			{
				fontSize: L.noteSize,
				duration,
				ease: "power2.inOut",
				immediateRender: false,
			},
			time,
		);
		tl.set(row(id), { opacity: 0 }, time + duration);
		tl.set(one(`note-${id}`), { opacity: 1 }, time + duration);
	};
	const bubbles = MESSAGES.map((message) => one(`b-${message.id}`));

	const lockPlan = one<SVGGraphicsElement>("lock-plan");

	d.hidden([
		...flat("q"),
		...[
			"f-head",
			"x-head",
			"p-head",
			"e-head",
			"r-head",
			"a-head",
			"o-head",
		].map((name) => one(name)),
		...Array.from({ length: SLOTS }, (_, k) => num(k)),
		...ROWS.flatMap((step) => [row(step.id), focus(step.id)]),
		one("forecast-note"),
		...kids("notes"),
		...kids("reset"),
		lockPlan,
		...kids("meter"),
		...bubbles,
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	word(one("q-big"), 4.8);
	show(one("q-line"), 6.0);

	// ——— inspect: three steps, one a forecast; then Home's four ———
	tl.addLabel("inspect", 9.6);
	hide(flat("q"), 9.6);
	show(one("f-head"), 9.8, "above");
	show([num(0), num(1), num(2)], 10.1);
	FRIEND.forEach((step, k) => {
		enter(step.id, k, 10.3 + k * 0.25);
	});
	show(one("x-head"), 12.25);
	tl.to(focus(FORECAST.id), { opacity: 1, duration: 0.4 }, 12.3);
	show(one("forecast-note"), 12.5, "right");
	// Home's template.
	d.swap([one("f-head"), one("x-head")], one("p-head"), 15.85);
	tl.to(focus(FORECAST.id), { opacity: 0, duration: 0.3 }, 15.6);
	hide(one("forecast-note"), 15.6);
	leave(FORECAST.id, 16.0);
	move("trade", at(TEMPLATE, "trade"), 16.0);
	enter("gex", at(TEMPLATE, "gex"), 16.35);
	show(num(3), 16.7);
	enter("flow", at(TEMPLATE, "flow"), 16.9);

	// ——— edits: Home doesn't keep them ———
	tl.addLabel("edits", 19.75);
	d.swap(one("p-head"), one("e-head"), 19.75);
	// Preserve every step while reordering. Fade only panels/tool labels, then use
	// two text lanes so the row labels stay readable and never pass through each other.
	const reordered = ["gex", "trade", "flow"];
	const furniture = reordered.flatMap((id) => [
		one(`panel-${id}`),
		one(`tool-${id}`),
	]);
	tl.to(furniture, { opacity: 0, duration: 0.35 }, 19.75);
	hide([num(1), num(2), num(3)], 19.75);
	const textX = L.rowX + 14;
	const laneX = (id: string, side: "left" | "right") =>
		(side === "left"
			? 16
			: W - 16 - one<SVGTextElement>(`step-${id}`).getBBox().width) - textX;
	for (const [id, side] of [
		["gex", "left"],
		["trade", "right"],
		["flow", "left"],
	] as const)
		tl.to(row(id), { x: laneX(id, side), duration: 0.3 }, 20.1);
	move("trade", at(EDITED, "trade"), 20.4);
	move("flow", at(EDITED, "flow"), 20.4);
	// Flow clears the left lane before GEX reaches its row on the way to slot five.
	tl.to(row("flow"), { x: laneX("flow", "right"), duration: 0.3 }, 21.0);
	move("gex", at(EDITED, "gex"), 21.0);
	enter(EARNINGS.id, at(EDITED, EARNINGS.id), 21.25);
	for (const id of reordered) tl.to(row(id), { x: 0, duration: 0.3 }, 21.6);
	tl.to(furniture, { opacity: 1, duration: 0.3 }, 21.9);
	show([num(1), num(2), num(3), num(4)], 21.9, "below", 0.3);
	tl.to(
		[focus(EARNINGS.id), focus("flow")],
		{ opacity: 1, duration: 0.4 },
		21.75,
	);
	// Keep the original carried text visible while the surrounding Home UI fades.
	show(one("r-head"), 23.7);
	tl.to(
		ROWS.filter((step) => step.id !== EARNINGS.id && step.id !== "flow").map(
			(step) => row(step.id),
		),
		{ opacity: 0, duration: 0.35 },
		23.9,
	);
	tl.to(
		[EARNINGS.id, "flow"].flatMap((id) => [
			one(`panel-${id}`),
			one(`tool-${id}`),
		]),
		{ opacity: 0, duration: 0.35 },
		23.9,
	);
	tl.to(
		[focus(EARNINGS.id), focus("flow")],
		{ opacity: 0, duration: 0.35 },
		23.9,
	);
	hide(
		Array.from({ length: SLOTS }, (_, k) => num(k)),
		23.9,
	);
	// The destination labels the kept fragment before its coordinated transfer.
	show(one("notes-tag"), 24.3, "above");
	// Transfer the kept fragment as one ordered pair: both labels share the same
	// horizontal path, and their vertical separation grows throughout the flight.
	carryRow("flow", 1, 24.3);
	carryRow(EARNINGS.id, 0, 24.3);
	show(one("notes-expiry"), 25.05, "above", 0.35);
	// One quiet second after the copied fragment, then Home restores independently.
	tl.fromTo(
		TEMPLATE.map((step) => one(`reset-${step.id}`)),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.35 },
		26.4,
	);
	hide(one("e-head"), 26.8);
	// Label the reset only after its rows have settled and rested for one second.
	show(one("reset-tag"), 27.75, "above", 0.35);
	d.lock(lockPlan, 27.95, {
		around: kids("notes"),
		pad: 10,
	});
	tl.addLabel("hero-lock", 27.95);

	// ——— customize: the AI asks before it proposes ———
	tl.addLabel("customize", 30.85);
	hide([one("r-head"), ...kids("notes"), ...kids("reset"), lockPlan], 30.85);
	show(one("a-head"), 31.2, "above");
	show([one("m-tag"), one("m-0")], 31.35, "above");
	show(bubbles[0], 31.65);
	show(bubbles[1], 32.35);
	d.flip(one("m-0"), one("m-1"), 32.55);
	tl.set(one("m-0"), { opacity: 0 }, 32.85);
	show(one("o-head"), 35.85);
	hide([bubbles[0], bubbles[1]], 35.85);
	show(bubbles[2], 36.15);
	show(bubbles[3], 36.65);
	d.flip(one("m-1"), one("m-2"), 36.85);
	tl.set(one("m-1"), { opacity: 0 }, 37.15);
	// Cut: the claim.
	hide(
		[
			one("a-head"),
			one("o-head"),
			bubbles[2],
			bubbles[3],
			one("m-tag"),
			one("m-2"),
		],
		40.15,
	);
	word(one("claim-big"), 40.55);
	show(one("claim-sub"), 40.95);

	// ——— next ———
	tl.addLabel("next", 44.55);
	hide(kids("claim"), 44.55);
	d.close(44.55);
	return tl;
}

export const researchChecklistFilm: Film = {
	id: "research-checklist",
	label: [
		"Research checklists, as a short film: Home's question, what to check before selling a call; a friend's three steps, the last of which, confirming ALFA stays below $105, is a forecast no tool can check; Home's template of four steps, each opening a tool; an earnings step added and call flow moved up, then a refresh that brings back the template because Home doesn't save; and Customize with AI asking one question before it proposes a step, two replies costing two credits and nothing saved",
		"研究清单短片：Home 的问题，卖出看涨前应该检查什么；朋友列的三步，最后一步“确认 ALFA 一直低于 $105”是没有工具能核查的预测；Home 的四步模板，每步打开一个工具；新增财报步骤、上移看涨成交流，然后一刷新又回到模板，因为 Home 不会保存；以及 Customize with AI 先问一个问题再提出一步建议，两条回复花 2 积分，什么都没保存",
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Checklists", "研究清单"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "inspect", label: ["Check, not forecast", "核查，不是预测"] },
		{ id: "edits", label: ["Edits reset", "编辑会重置"] },
		{ id: "customize", label: ["Customize with AI", "用 AI 定制"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
