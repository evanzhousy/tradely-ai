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
	BLOCKS,
	type BlockId,
	PROMPTS,
	STATUS,
	type Status,
} from "./edit-with-ai-model";

/*
 * Edit with AI, as a film. It opens on a prompt, "Make this an ALFA report.", and asks
 * what you now have to check. A vague prompt leaves every block of Daily Market Recap to
 * re-check; a bounded one leaves one block to review and four to confirm. Then a first
 * edit that changes Spotlight and quietly drops Index GEX: undo before asking again, with
 * "keep everything else unchanged". Last, a preview isn't a save: close the tab and the
 * draft is gone; save it and it is validated and listed under My recipes, private to you.
 *
 *   open      0–4        "Fork or write a recipe with AI"
 *   question  4–9.6      "Make this an ALFA report."
 *   scope     9.6–17.7   every block to re-check; bounded: one to review
 *   review    17.7–28.6  edit: Index GEX gone; undo; edit again, only Spotlight, locked
 *   save      28.6–41.6  unsaved; closed; saved; cut: the claim
 *   next      41.6–44.1  Next: connect your own AI agent
 */

const END = 44.1;
/** The states a block's status moves through, in the order the film uses them. */
const SHOWN: readonly Status[] = [
	"recheck",
	"review",
	"confirm",
	"changed",
	"removed",
	"same",
];
const TONE: Record<Status, string> = {
	unknown: "wt-film-dim",
	recheck: "wt-film-warn",
	review: "wt-film-accent",
	confirm: "wt-film-dim",
	changed: "wt-film-accent",
	removed: "wt-film-loss",
	same: "wt-film-dim",
};
/** Statuses and the long block label as a phone's row can hold them. */
const STATUS_SHORT: Record<Status, Copy> = {
	unknown: ["?", "?"],
	recheck: ["re-check", "重查"],
	review: ["review", "审阅"],
	confirm: ["confirm", "确认"],
	changed: ["changed", "已修改"],
	removed: ["removed", "已删除"],
	same: ["unchanged", "未改动"],
};
const LABEL_SHORT: Partial<Record<BlockId, Copy>> = {
	title: ["Title", "标题"],
};
const STEP_PILLS: readonly Copy[] = [
	["Fork", "分叉"],
	["Edit", "修改"],
	["Undo", "撤销"],
	["Edit again", "再次修改"],
];

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room, type: T } = frame;
	const rowTop = H * (narrow ? 0.41 : 0.42);
	const rowStep = H * (narrow ? 0.105 : 0.082);
	return {
		...frame,
		barY: H * (narrow ? 0.26 : 0.25),
		barPad: narrow ? 8 : 16,
		barText: narrow ? T.small * 1.1 : T.body,
		rowY: (i: number) => rowTop + i * rowStep,
		rowH: rowStep * 0.84,
		rowText: narrow ? T.small * 1.15 : T.body,
		pillW: (room - 3 * 8) / 4,
		cardY: narrow
			? [H * 0.25, H * 0.47, H * 0.69]
			: [H * 0.27, H * 0.49, H * 0.71],
		cardH: [0, 1, 2].map(() => H * (narrow ? 0.2 : 0.17)),
		cardPad: narrow ? 10 : 18,
		margin,
	};
}

const copy = {
	title: ["Fork or write a recipe with AI", "用 AI 分叉或编写 Recipe"],
	titleSub: ["scope it, review it, save it", "划范围、审阅、保存"],
	qTag: [
		"Edit with AI · Daily Market Recap",
		"Edit with AI · Daily Market Recap",
	],
	qLine: ["Which blocks do you now have to check?", "现在你得检查哪些区块？"],
	vagueHead: [
		"No boundary: every block may have changed.",
		"没有范围的提示：每个区块都可能被改过。",
	],
	vagueHeadShort: ["No boundary: re-check all.", "没有范围：全部重查。"],
	boundedHead: [
		"Bound it: review one, confirm four.",
		"划定范围：审阅一个，确认四个。",
	],
	boundedHeadShort: ["Bounded: review one.", "划定范围：审阅一个。"],
	boundedShort: ["Only Spotlight may change.", "只改 Spotlight，其余不变。"],
	editHead: [
		"Edit 1 changes Spotlight; Index GEX is gone.",
		"修改 1 改了 Spotlight；Index GEX 不见了。",
	],
	editHeadShort: ["Edit 1: Index GEX is gone.", "修改 1：Index GEX 不见了。"],
	undoHead: [
		"Undo first: back to what you reviewed.",
		"先撤销：回到你审阅过的版本。",
	],
	undoHeadShort: ["Undo first.", "先撤销。"],
	againHead: [
		"Ask again, bounded: only Spotlight differs.",
		"带上范围再问：只有 Spotlight 不同。",
	],
	againHeadShort: ["Ask again: only Spotlight.", "再问：只有 Spotlight。"],
	previewHead: ["A preview isn't a save.", "预览不是保存。"],
	savedHead: [
		"Save it: validated, and private to you.",
		"保存：通过校验，只有你可见。",
	],
	savedHeadShort: ["Save: private to you.", "保存：仅你可见。"],
	draft: ["Your draft · private", "你的草稿 · 私有"],
	unsaved: ["Unsaved changes", "有未保存的修改"],
	closed: ["Closed: draft gone", "已关闭：草稿没了"],
	saved: ["Saved", "已保存"],
	mine: ["My recipes", "我的 Recipe"],
	none: ["No recipes yet", "还没有 Recipe"],
	mineEntry: [
		"Daily Market Recap · private, only you",
		"Daily Market Recap · 私有，仅你可见",
	],
	official: [
		"Daily Market Recap · official, unchanged",
		"Daily Market Recap · 官方，未改动",
	],
	officialShort: ["Official · unchanged", "官方 · 未改动"],
	claimBig: [
		"Scope it, review it, save it on purpose.",
		"划定范围，逐次审阅，有意保存。",
	],
	claimSub: [
		"Undo the unasked; the official recipe never changes.",
		"撤销没要求的改动；官方 Recipe 从不改变。",
	],
	nextBig: [
		"Next: connect your own AI agent",
		"下一课：连接你自己的 AI 智能体",
	],
	nextSub: ["read-only tools, a key you control", "只读工具，由你掌控的密钥"],
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
	const prompts = [
		["pr-vague", PROMPTS.vague],
		["pr-bounded", narrow ? copy.boundedShort : PROMPTS.bounded],
	] as const;
	const barLines = Math.max(
		...prompts.map(([, text]) =>
			lineCount(`“${t(text)}”`, room - 2 * L.barPad, L.barText),
		),
	);
	const barH = L.barPad * 2 + barLines * L.barText * 1.35;
	const rowText = (i: number) => L.rowY(i) + L.rowH / 2 + L.rowText * 0.36;
	const pillH = L.barText * 2.4;
	const card = (
		i: number,
		name: string,
		title: Copy,
		lines: readonly (readonly [string, Copy, string])[],
	) => (
		<g data-f={name}>
			<rect
				x={margin}
				y={L.cardY[i]}
				width={room}
				height={L.cardH[i]}
				rx={12}
				className="wt-panel-shape"
			/>
			<text
				x={margin + L.cardPad}
				y={L.cardY[i] + L.cardPad + T.small}
				className="wt-film-tag"
				style={{ fontSize: T.small }}
			>
				{t(title).toUpperCase()}
			</text>
			{lines.map(([key, text, tone]) => (
				<text
					key={key}
					data-f={key}
					x={margin + L.cardPad}
					y={L.cardY[i] + L.cardH[i] - L.cardPad}
					className={`wt-film-type ${tone}`}
					style={{ fontSize: L.rowText * 1.1 }}
				>
					{t(text)}
				</text>
			))}
		</g>
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
					name="q-big"
					text={`“${t(PROMPTS.vague)}”`}
					x={W / 2}
					y={H * 0.32 + T.title * 1.6}
					size={T.title}
					maxWidth={room}
				/>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.74}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("v-head", copy.vagueHead, copy.vagueHeadShort)}
			<Lines
				name="b-head"
				text={t(narrow ? copy.boundedHeadShort : copy.boundedHead)}
				x={margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.vagueHeadShort : copy.vagueHead),
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
			{headline("e-head", copy.editHead, copy.editHeadShort)}
			<Lines
				name="u-head"
				text={t(narrow ? copy.undoHeadShort : copy.undoHead)}
				x={margin}
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
			{headline("a-head", copy.againHead, copy.againHeadShort)}
			<Brackets name="lock-spotlight" glow />

			{/* The prompt, or the edit's steps. */}
			<rect
				data-f="bar"
				x={margin}
				y={L.barY}
				width={room}
				height={barH}
				rx={10}
				className="wt-panel-shape"
			/>
			{prompts.map(([name, text]) => (
				<Lines
					key={name}
					name={name}
					text={`“${t(text)}”`}
					x={margin + L.barPad}
					y={L.barY + L.barPad + L.barText}
					size={L.barText}
					maxWidth={room - 2 * L.barPad}
					anchor="start"
					className="wt-film-type wt-film-accent"
				/>
			))}
			<g data-f="pills">
				{STEP_PILLS.map((pill, i) => (
					<g key={pill[0]}>
						<rect
							data-f={`pill-${i}`}
							x={margin + i * (L.pillW + 8)}
							y={L.barY}
							width={L.pillW}
							height={pillH}
							rx={pillH / 2}
							className="wt-panel-shape"
						/>
						<rect
							data-f={`pill-on-${i}`}
							x={margin + i * (L.pillW + 8)}
							y={L.barY}
							width={L.pillW}
							height={pillH}
							rx={pillH / 2}
							className="wt-focus-shape"
						/>
						<text
							data-f={`pill-text-${i}`}
							x={margin + i * (L.pillW + 8) + L.pillW / 2}
							y={L.barY + pillH / 2 + L.barText * 0.36}
							textAnchor="middle"
							className="wt-film-type"
							style={{ fontSize: L.barText }}
						>
							{t(pill)}
						</text>
					</g>
				))}
			</g>

			{/* The recap's blocks, each with what you must do about it. */}
			<g data-f="outline">
				{BLOCKS.map((block, i) => (
					<g key={block.id} data-f={`blk-${block.id}`}>
						<rect
							x={margin}
							y={L.rowY(i)}
							width={room}
							height={L.rowH}
							rx={9}
							className="wt-panel-shape"
						/>
						<rect
							data-f={`hl-${block.id}`}
							x={margin}
							y={L.rowY(i)}
							width={room}
							height={L.rowH}
							rx={9}
							className="wt-focus-shape"
						/>
						<rect
							data-f={`gone-${block.id}`}
							x={margin}
							y={L.rowY(i)}
							width={room}
							height={L.rowH}
							rx={9}
							className="wt-band-loss"
							style={{
								stroke: "var(--diagram-loss)",
								strokeWidth: 1.5,
								strokeDasharray: "5 4",
							}}
						/>
						<text
							x={margin + 14}
							y={rowText(i)}
							className="wt-film-type"
							style={{ fontSize: L.rowText }}
						>
							{t((narrow && LABEL_SHORT[block.id]) || block.label)}
						</text>
						{SHOWN.map((status) => (
							<text
								key={status}
								data-f={`st-${block.id}-${status}`}
								x={margin + room - 14}
								y={rowText(i)}
								textAnchor="end"
								className={`wt-film-type ${TONE[status]}`}
								style={{ fontSize: L.rowText }}
							>
								{t(narrow ? STATUS_SHORT[status] : STATUS[status])}
							</text>
						))}
					</g>
				))}
			</g>

			{/* Unsaved, closed, saved. */}
			{headline("p-head", copy.previewHead, copy.previewHead)}
			<Lines
				name="s-head"
				text={t(narrow ? copy.savedHeadShort : copy.savedHead)}
				x={margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.previewHead : copy.previewHead),
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
			{card(0, "card-draft", copy.draft, [
				["d-unsaved", copy.unsaved, "wt-film-warn"],
				["d-closed", copy.closed, "wt-film-loss"],
				["d-saved", copy.saved, "wt-film-gain"],
			])}
			{card(1, "card-mine", copy.mine, [
				["m-dash", ["—", "—"], "wt-film-dim"],
				["m-none", copy.none, "wt-film-dim"],
				["m-entry", copy.mineEntry, "wt-film-accent"],
			])}
			{card(
				2,
				"card-official",
				["Cookbooks", "Cookbooks"],
				[
					[
						"o-line",
						narrow ? copy.officialShort : copy.official,
						"wt-film-dim",
					],
				],
			)}
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
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const ids = BLOCKS.map((block) => block.id);
	const status = (id: BlockId, s: Status) => one(`st-${id}-${s}`);
	const allStatus = ids.flatMap((id) => SHOWN.map((s) => status(id, s)));
	/** Every block's status, from one map to the next, at once. */
	const set = (
		from: Partial<Record<BlockId, Status>>,
		to: Partial<Record<BlockId, Status>>,
		time: number,
	) => {
		for (const id of ids) {
			const a = from[id];
			const b = to[id];
			if (a === b) continue;
			if (a) hide(status(id, a), time, 0.25);
			if (b) show(status(id, b), time + 0.25, "right", 0.35);
		}
	};
	const every = (s: Status) =>
		Object.fromEntries(ids.map((id) => [id, s])) as Record<BlockId, Status>;
	const pill = (i: number, on: boolean, time: number) =>
		tl.to(one(`pill-on-${i}`), { opacity: on ? 1 : 0, duration: 0.3 }, time);

	const lockSpotlight = one<SVGGraphicsElement>("lock-spotlight");

	d.hidden([
		...flat("q"),
		...[
			"v-head",
			"b-head",
			"e-head",
			"u-head",
			"a-head",
			"p-head",
			"s-head",
		].map((name) => one(name)),
		lockSpotlight,
		one("bar"),
		one("pr-vague"),
		one("pr-bounded"),
		...flat("pills"),
		...ids.flatMap((id) => [
			one(`blk-${id}`),
			one(`hl-${id}`),
			one(`gone-${id}`),
		]),
		...allStatus,
		one("card-draft"),
		one("card-mine"),
		one("card-official"),
		...["d-unsaved", "d-closed", "d-saved", "m-dash", "m-none", "m-entry"].map(
			(name) => one(name),
		),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: a prompt ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	word(one("q-big"), 4.8);
	show(one("q-line"), 6.0);

	// ——— scope: the prompt decides what you check ———
	tl.addLabel("scope", 9.6);
	hide(flat("q"), 9.6);
	show(one("v-head"), 9.8, "above");
	show([one("bar"), one("pr-vague")], 10.1);
	ids.forEach((id, i) => {
		show(one(`blk-${id}`), 10.4 + i * 0.1);
	});
	set({}, every("recheck"), 11.1);
	show(one("b-head"), 13.7);
	d.flip(one("pr-vague"), one("pr-bounded"), 13.9);
	tl.set(one("pr-vague"), { opacity: 0 }, 14.2);
	const bounded = { ...every("confirm"), spotlight: "review" } as const;
	set(every("recheck"), bounded, 14.9);
	tl.to(one("hl-spotlight"), { opacity: 1, duration: 0.3 }, 15.2);

	// ——— review: undo before the next edit ———
	tl.addLabel("review", 17.7);
	d.swap([one("v-head"), one("b-head")], one("e-head"), 17.7);
	hide([one("bar"), one("pr-bounded")], 17.7);
	show(
		flat("pills").filter(
			(el) => !el.getAttribute("data-f")?.startsWith("pill-on"),
		),
		18.1,
	);
	pill(1, true, 18.3);
	const edited = {
		...every("same"),
		spotlight: "changed",
		gex: "removed",
	} as const;
	set(bounded, edited, 18.5);
	tl.to(one("gone-gex"), { opacity: 1, duration: 0.3 }, 18.8);
	// Undo.
	show(one("u-head"), 21.1);
	pill(1, false, 21.3);
	pill(2, true, 21.3);
	set(edited, every("same"), 21.4);
	tl.to(
		[one("gone-gex"), one("hl-spotlight")],
		{ opacity: 0, duration: 0.3 },
		21.4,
	);
	// Ask again, bounded. The hero: one block changed, as asked.
	d.swap([one("e-head"), one("u-head")], one("a-head"), 24.7);
	pill(2, false, 25.1);
	pill(3, true, 25.1);
	set(every("same"), { ...every("same"), spotlight: "changed" }, 25.3);
	tl.to(one("hl-spotlight"), { opacity: 1, duration: 0.3 }, 25.6);
	d.lock(lockSpotlight, 26.3, { around: one("blk-spotlight"), pad: 6 });
	tl.addLabel("hero-lock", 26.3);

	// ——— save: a preview isn't a save ———
	tl.addLabel("save", 28.6);
	hide(
		[
			one("a-head"),
			lockSpotlight,
			...flat("pills"),
			...ids.flatMap((id) => [one(`blk-${id}`), one(`hl-${id}`)]),
			...ids.map((id) => status(id, id === "spotlight" ? "changed" : "same")),
		],
		28.6,
	);
	show(one("p-head"), 28.95, "above");
	show([one("card-draft"), one("d-unsaved")], 29.2);
	show([one("card-mine"), one("m-dash")], 29.5);
	show([one("card-official"), one("o-line")], 29.8);
	// Close the tab: the draft is gone.
	d.flip(one("d-unsaved"), one("d-closed"), 30.1);
	tl.set(one("d-unsaved"), { opacity: 0 }, 30.4);
	d.flip(one("m-dash"), one("m-none"), 30.4);
	tl.set(one("m-dash"), { opacity: 0 }, 30.7);
	// Or save.
	show(one("s-head"), 32.8);
	d.flip(one("d-closed"), one("d-saved"), 33);
	tl.set(one("d-closed"), { opacity: 0 }, 33.3);
	d.flip(one("m-none"), one("m-entry"), 33.3);
	tl.set(one("m-none"), { opacity: 0 }, 33.6);
	// Cut: the claim.
	hide(
		[
			one("p-head"),
			one("s-head"),
			one("card-draft"),
			one("card-mine"),
			one("card-official"),
			one("d-saved"),
			one("m-entry"),
			one("o-line"),
		],
		37.1,
	);
	word(one("z-big"), 37.5);
	show(one("z-sub"), 37.9);

	// ——— next ———
	tl.addLabel("next", 41.6);
	hide(kids("claim"), 41.6);
	d.close(41.6);
	return tl;
}

export const editWithAiFilm: Film = {
	id: "edit-with-ai",
	label: [
		"Edit with AI, as a short film: the prompt “Make this an ALFA report.” and the question of what you now have to check; with no boundary every block of Daily Market Recap must be re-checked, while a bounded prompt leaves one block to review and four to confirm; a first edit that changes Spotlight and drops Index GEX, undone before asking again with “keep everything else unchanged”; and a preview that isn't a save, gone when the tab closes and, once saved, validated and listed under My recipes, private to you",
		"Edit with AI 短片：提示“把它改成一份 ALFA 报告。”以及现在得检查什么；没有范围时 Daily Market Recap 的每个区块都要重查，划定范围后只剩一个区块要审阅、四个只需确认；第一次修改改了 Spotlight 却删掉了 Index GEX，先撤销，再带上“其他一切保持不变”重新提问；以及预览不是保存，关掉标签页就没了，保存后通过校验并列在“我的 Recipe”里，只有你可见",
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Edit with AI", "用 AI 编辑"] },
		{ id: "question", label: ["The prompt", "提示"] },
		{ id: "scope", label: ["Scope", "范围"] },
		{ id: "review", label: ["Review, undo", "审阅、撤销"] },
		{ id: "save", label: ["Save", "保存"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
