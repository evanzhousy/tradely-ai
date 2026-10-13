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
 *   scope     9.6–19.15   every block to re-check; bounded: one to review
 *   review    19.15–33.65  edit: Index GEX gone; undo; edit again, only Spotlight, locked
 *   save      33.65–44.95  unsaved; alternative close/save outcomes; claim
 *   next      44.95–47.45  Next: connect your own AI agent
 */

const END = 47.45;
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
	const rowStep = H * (narrow ? 0.085 : 0.082);
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
	boundedShort: [
		"Spotlight: choose a symbol, default ALFA. Keep others.",
		"Spotlight：可选标的，默认 ALFA。其余不变。",
	],
	editHead: [
		"Edit 1 changed Spotlight and removed Index GEX.",
		"修改 1 改了 Spotlight，删了 Index GEX。",
	],
	editHeadShort: ["Edit 1 removed Index GEX.", "修改 1 删了 Index GEX。"],
	undoHead: ["Undo: all five blocks are back.", "撤销：五个区块全部恢复。"],
	firstRequest: [
		"Spotlight: symbol input, default ALFA.",
		"Spotlight：标的输入，默认 ALFA。",
	],
	secondRequest: [
		"Keep others. Spotlight: symbol input, default ALFA.",
		"其余不变。Spotlight：标的输入，默认 ALFA。",
	],
	againHead: [
		"Ask again, bounded: only Spotlight differs.",
		"带上范围再问：只有 Spotlight 不同。",
	],
	againHeadShort: ["Ask again: only Spotlight.", "再问：只有 Spotlight。"],
	previewHead: ["A preview isn't a save.", "预览不是保存。"],
	draft: ["Your draft · private", "你的草稿 · 私有"],
	unsaved: ["Unsaved changes", "有未保存的修改"],
	closed: ["Draft gone · not listed", "草稿丢失 · 未列入列表"],
	closeChoice: ["Close without saving", "不保存，直接关闭"],
	saveChoice: ["Same preview · save instead", "同一预览 · 改选保存"],
	branchUnsaved: ["Unsaved preview", "未保存的预览"],
	fixedSymbol: ["Fixed symbol", "固定标的"],
	readerSymbol: ["Reader chooses · default", "读者可选 · 默认值"],
	saved: ["Saved · validated", "已保存 · 校验通过"],
	mine: ["My recipes", "我的 Recipe"],
	none: ["No recipes yet", "还没有 Recipe"],
	mineEntry: ["My recipes · private", "我的 Recipe · 私有"],
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
				data-f={`${name}-title`}
				x={margin + L.cardPad}
				y={L.cardY[i] + L.cardPad + T.small}
				className="wt-film-tag"
				style={{ fontSize: T.small }}
			>
				{t(title).toUpperCase()}
			</text>
			{i < 2 && (
				<text
					data-f={`${name}-choice`}
					x={margin + L.cardPad}
					y={L.cardY[i] + L.cardPad + T.small}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(i === 0 ? copy.closeChoice : copy.saveChoice).toUpperCase()}
				</text>
			)}
			{i === 1 && (
				<text
					data-f="m-saved"
					x={margin + L.cardPad}
					y={L.cardY[i] + L.cardH[i] * 0.57}
					className="wt-film-type wt-film-gain"
					style={{ fontSize: L.rowText * 1.1 }}
				>
					{t(copy.saved)}
				</text>
			)}
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
			{headline("u-head", copy.undoHead, copy.undoHead)}
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

			{(
				[
					["pr-first", copy.firstRequest],
					["pr-again", copy.secondRequest],
				] as const
			).map(([name, text]) => (
				<Lines
					key={name}
					name={name}
					text={`“${t(text)}”`}
					x={margin}
					y={L.barY + pillH + T.small * 1.8}
					size={T.small}
					maxWidth={room}
					anchor="start"
					className="wt-film-type wt-film-accent"
				/>
			))}

			{/* The recap's blocks, each with what you must do about it. */}
			<g data-f="outline">
				{BLOCKS.map((block, i) => (
					<g key={block.id} data-f={`blk-${block.id}`}>
						<rect
							x={margin}
							y={L.rowY(i)}
							width={room}
							height={L.rowH + (block.id === "spotlight" ? H * 0.1 : 0)}
							rx={9}
							className="wt-panel-shape"
						/>
						<rect
							data-f={`hl-${block.id}`}
							x={margin}
							y={L.rowY(i)}
							width={room}
							height={L.rowH + (block.id === "spotlight" ? H * 0.1 : 0)}
							rx={9}
							className="wt-focus-shape"
						/>
						<rect
							data-f={`gone-${block.id}`}
							x={margin}
							y={L.rowY(i)}
							width={room}
							height={L.rowH + (block.id === "spotlight" ? H * 0.1 : 0)}
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
						{block.id === "spotlight" && (
							<>
								<g data-f="symbol-fixed">
									<Word
										name="fixed-label"
										x={margin + 14}
										y={L.rowY(i) + L.rowH + H * 0.05}
										size={T.small}
										anchor="start"
										className="wt-film-tag"
									>
										{t(copy.fixedSymbol)}
									</Word>
									<Word
										name="fixed-alfa"
										x={margin + room - 14}
										y={L.rowY(i) + L.rowH + H * 0.07}
										size={T.num}
										anchor="end"
									>
										ALFA
									</Word>
								</g>
								<g data-f="symbol-input">
									<Word
										name="reader-label"
										x={margin + 14}
										y={L.rowY(i) + L.rowH + H * 0.05}
										size={T.small}
										anchor="start"
										className="wt-film-tag"
									>
										{t(copy.readerSymbol)}
									</Word>
									<rect
										x={margin + room * 0.62}
										y={L.rowY(i) + L.rowH + H * 0.012}
										width={room * 0.38 - 14}
										height={H * 0.075}
										rx={5}
										className="wt-focus-shape"
									/>
									<Word
										name="input-alfa"
										x={margin + room * 0.81 - 7}
										y={L.rowY(i) + L.rowH + H * 0.065}
										size={T.num}
										className="wt-film-type wt-film-accent"
									>
										ALFA
									</Word>
								</g>
							</>
						)}
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
			{card(0, "card-draft", copy.draft, [
				["d-unsaved", copy.unsaved, "wt-film-warn"],
				["d-closed", copy.closed, "wt-film-loss"],
			])}
			{card(1, "card-mine", copy.mine, [
				["m-unsaved", copy.branchUnsaved, "wt-film-warn"],
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
			if (a) hide(status(id, a), time, 0.35, 0);
			if (b) show(status(id, b), time + (a ? 0.35 : 0), "right", 0.35);
		}
	};
	const every = (s: Status) =>
		Object.fromEntries(ids.map((id) => [id, s])) as Record<BlockId, Status>;
	const pill = (i: number, on: boolean, time: number) =>
		tl.to(one(`pill-on-${i}`), { opacity: on ? 1 : 0, duration: 0.3 }, time);

	const lockSpotlight = one<SVGGraphicsElement>("lock-spotlight");

	d.hidden([
		...flat("q"),
		...["v-head", "b-head", "e-head", "u-head", "a-head", "p-head"].map(
			(name) => one(name),
		),
		lockSpotlight,
		one("bar"),
		one("pr-vague"),
		one("pr-bounded"),
		one("pr-first"),
		one("pr-again"),
		one("symbol-fixed"),
		one("symbol-input"),
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
		...[
			"d-unsaved",
			"d-closed",
			"m-unsaved",
			"m-none",
			"m-entry",
			"m-saved",
			"card-draft-choice",
			"card-mine-choice",
		].map((name) => one(name)),
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
	set({}, every("recheck"), 10.9);
	d.flip(one("pr-vague"), one("pr-bounded"), 13.9);
	tl.set(one("pr-vague"), { opacity: 0 }, 14.2);
	const bounded = { ...every("confirm"), spotlight: "review" } as const;
	set(every("recheck"), bounded, 14.45);
	tl.to(one("hl-spotlight"), { opacity: 1, duration: 0.3 }, 14.85);
	// Name the bounded workload only once its five statuses have settled.
	show(one("b-head"), 15.15);
	show(one("symbol-fixed"), 10.8);

	// ——— review: undo before the next edit ———
	tl.addLabel("review", 19.15);
	hide([one("v-head"), one("b-head")], 19.15);
	hide([one("bar"), one("pr-bounded")], 19.15);
	show(
		flat("pills").filter(
			(el) => !el.getAttribute("data-f")?.startsWith("pill-on"),
		),
		19.5,
	);
	pill(1, true, 19.5);
	// Fade requests in place, clear of the neighboring pills and block labels.
	tl.fromTo(
		one("pr-first"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.35 },
		19.5,
	);
	const edited = {
		...every("same"),
		spotlight: "changed",
		gex: "removed",
	} as const;
	set(bounded, edited, 19.5);
	hide(one("symbol-fixed"), 19.5, 0.35, 0);
	show(one("symbol-input"), 19.85, "right", 0.35);
	tl.to(one("gone-gex"), { opacity: 1, duration: 0.3 }, 19.9);
	show(one("e-head"), 20.25);
	// The first-edit claim leaves with its evidence, before Undo restores the draft.
	hide(one("e-head"), 23.8);
	pill(1, false, 23.8);
	pill(2, true, 23.8);
	set(edited, every("same"), 23.8);
	hide(one("symbol-input"), 23.8, 0.35, 0);
	show(one("symbol-fixed"), 24.15, "right", 0.35);
	tl.to(
		[one("gone-gex"), one("hl-spotlight")],
		{ opacity: 0, duration: 0.35 },
		23.8,
	);
	// Announce Undo only after all five blocks and the fixed symbol settle.
	show(one("u-head"), 24.5);
	hide(one("u-head"), 28.05);
	// The Undo headline holds for 3.55 s and leaves before the second edit starts.
	hide(one("pr-first"), 28.4, 0.35, 0);
	tl.fromTo(
		one("pr-again"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.35 },
		28.75,
	);
	pill(2, false, 28.4);
	pill(3, true, 28.4);
	set(every("same"), { ...every("same"), spotlight: "changed" }, 28.4);
	hide(one("symbol-fixed"), 28.4, 0.35, 0);
	show(one("symbol-input"), 28.75, "right", 0.35);
	tl.to(one("hl-spotlight"), { opacity: 1, duration: 0.3 }, 28.8);
	show(one("a-head"), 30.1);
	d.lock(lockSpotlight, 30.6, { around: one("blk-spotlight"), pad: 6 });
	tl.addLabel("hero-lock", 30.6);

	// ——— save: two choices from the same unsaved preview ———
	tl.addLabel("save", 33.65);
	hide(
		[
			one("a-head"),
			one("pr-again"),
			lockSpotlight,
			...flat("pills"),
			...ids.flatMap((id) => [one(`blk-${id}`), one(`hl-${id}`)]),
			...ids.map((id) => status(id, id === "spotlight" ? "changed" : "same")),
		],
		33.65,
	);
	show(one("p-head"), 34.0, "above");
	// All three context cards settle together; leave a full second before choosing.
	show(
		[
			one("card-draft"),
			one("d-unsaved"),
			one("card-mine"),
			one("m-none"),
			one("card-official"),
			one("o-line"),
		],
		34.25,
	);
	// Separate labeled branches: the closed draft never becomes the saved draft.
	d.flip(one("card-draft-title"), one("card-draft-choice"), 35.75);
	tl.set(one("card-draft-title"), { opacity: 0 }, 36.05);
	d.flip(one("card-mine-title"), one("card-mine-choice"), 35.75);
	tl.set(one("card-mine-title"), { opacity: 0 }, 36.05);
	d.flip(one("d-unsaved"), one("d-closed"), 35.75);
	tl.set(one("d-unsaved"), { opacity: 0 }, 36.05);
	d.flip(one("m-none"), one("m-unsaved"), 35.75);
	tl.set(one("m-none"), { opacity: 0 }, 36.05);
	// The alternative begins from its own unsaved preview, after the close proof rests.
	d.flip(one("m-unsaved"), one("m-entry"), 37.4);
	tl.set(one("m-unsaved"), { opacity: 0 }, 37.7);
	show(one("m-saved"), 37.7, "right", 0.35);
	// Cut: the claim, after 2.4 s of quiet on the complete saved result.
	hide(
		[one("p-head"), one("card-draft"), one("card-mine"), one("card-official")],
		40.45,
	);
	word(one("z-big"), 40.85);
	show(one("z-sub"), 41.25);

	// ——— next ———
	tl.addLabel("next", 44.95);
	hide(kids("claim"), 44.95);
	d.close(44.95);
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
