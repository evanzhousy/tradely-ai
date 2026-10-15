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
import { BURST, GROUPS, LIMIT, type Method } from "./connect-agent-model";

/*
 * Connecting an agent, as a film. It opens on the choice an agent makes, sign in or a key.
 * Claude signs in with your TradingFlow account and needs no key; Cursor, Codex and
 * OpenClaw get one from Copy prompt; hosted chat sites can't connect yet. Then proof: an
 * agent saying "Connected!" proves nothing, your client's own check does, and tools/list
 * with your key shows what that key reaches. Last, what a key allows: read-only tools, 60
 * calls a minute, and a revoke that refuses the very next call.
 *
 *   open      0–4        "Connect your own AI agent"
 *   question  4–9.6      sign in, or an API key?
 *   way       9.6–16.7   Claude signs in; agents use a key; chat sites can't yet
 *   prove     16.7–26.2  "Connected!"; Claude Code /mcp; keyed tools/list
 *   key       26.2–44    60 a minute; 75: 15 refused, locked; revoke; cut: the claim
 *   next      44–46.5    Next: the module checkpoint
 */

const END = 46.5;
const METHODS: readonly Method[] = ["signin", "key", "none"];
/** The sign-in group's clients as a phone's card can hold them. */
const MEMBERS_SHORT: Partial<Record<Method, string>> = {
	signin: "Claude Code · claude.ai · Desktop · mobile",
};
const TONE: Record<Method, string> = {
	signin: "wt-film-accent",
	key: "wt-film-accent",
	none: "wt-film-warn",
};

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, room, type: T } = frame;
	const meterY = H * (narrow ? 0.36 : 0.34);
	return {
		...frame,
		cardY: (i: number) => H * 0.25 + i * H * 0.165,
		cardH: H * 0.14,
		panelY: H * 0.76,
		panelH: H * (narrow ? 0.17 : 0.15),
		pad: narrow ? 10 : 18,
		rowY: (i: number) => H * 0.26 + i * H * 0.205,
		rowH: H * 0.18,
		code: narrow ? T.small : Math.min(T.body * 0.95, (room - 36) / (80 * 0.6)),
		rowText: narrow ? T.small * 1.15 : T.body,
		// Keep the figures and later request at their existing baselines. Move
		// only the bar and its labels clear of the lock's expanded top arms.
		meterY,
		barY: meterY - 40,
		meterH: H * 0.07,
		// The wider lock expands toward the desktop key during its entrance.
		keyY: H * (narrow ? 0.6 : 0.58) + (narrow ? 0 : 8),
		keyH: H * (narrow ? 0.2 : 0.18),
	};
}

const copy = {
	title: ["Connect your own AI agent", "连接你自己的 AI 智能体"],
	titleSub: ["read-only tools, a key you control", "只读工具，由你掌控的密钥"],
	qTag: ["Your agent → TradingFlow", "你的智能体 → TradingFlow"],
	qBig: ["Sign in, or an API key?", "登录，还是 API 密钥？"],
	qLine: ["It depends on the agent.", "取决于是哪个智能体。"],
	signinHead: [
		"Claude signs in with your account: no key.",
		"Claude 用你的账户登录：不需要密钥。",
	],
	signinHeadShort: ["Claude: sign in, no key.", "Claude：登录，无需密钥。"],
	keyHead: [
		"Cursor, Codex and OpenClaw use an API key.",
		"Cursor、Codex 和 OpenClaw 用 API 密钥连接。",
	],
	keyHeadShort: [
		"Other supported agents: a key.",
		"其他受支持的智能体：密钥。",
	],
	signinProcess: ["Register → sign in", "注册 → 登录"],
	keyNote: [
		"Copy prompt → a key → paste to your agent",
		"Copy prompt 会创建一把密钥，并放进你粘贴给智能体的提示里。",
	],
	keyNoteShort: [
		"Copy prompt → a key → paste to your agent",
		"Copy prompt → 密钥 → 粘贴给智能体",
	],
	agentHead: ["“Connected!” proves nothing.", "“已连接！”证明不了什么。"],
	agentHeadShort: ["“Connected!” proves nothing.", "“已连接！”证明不了什么。"],
	clientHead: ["Check the client and server.", "检查客户端和服务器。"],
	clientHeadShort: ["Check it yourself.", "自己检查。"],
	rateHead: [
		"Read-only tools. Every call is checked.",
		"只读工具，每次调用都检查。",
	],
	rateHeadShort: [
		"Read-only. Every call is checked.",
		"只读，每次调用都检查。",
	],
	meter: ["This key's calls · 60-second window", "本密钥调用 · 60 秒窗口"],
	meterShort: ["This key · 60-second window", "本密钥 · 60 秒窗口"],
	attempts: ["attempts", "尝试次数"],
	refused: ["refused", "被拒"],
	keyCard: ["Cursor key", "Cursor 密钥"],
	active: ["active · read-only data tools", "有效 · 只读数据工具"],
	revoked: ["revoked", "已撤销"],
	revokeAction: ["Revoke key", "撤销密钥"],
	nextWindow: ["Next window", "下一窗口"],
	rejected: ["refused: key revoked", "被拒：密钥已撤销"],
	claimBig: [
		"Connect it, prove it, know the key's reach.",
		"连接它，亲自证明，弄清密钥能做什么。",
	],
	claimSub: [
		"An agent's word isn't proof; every call is checked.",
		"智能体说的不算证明；每次调用都会检查访问权限。",
	],
	nextBig: ["Next: the module checkpoint", "下一步：本模块检查点"],
	nextSub: [
		"workflows in TradingFlow, on a new day",
		"在新的一天里，用 TradingFlow 构建工作流",
	],
} as const satisfies Record<string, Copy>;

// The MCP adapter exposes the registered symbol.search primitive as symbol_search.
// Keep its meaning beside the returned identifier, separate from tools/list.
const TOOL_RESULT = [
	"symbol_search · find tickers",
	"symbol_search · 查找股票代码",
] as const satisfies Copy;

const CHECKS = [
	{
		id: "agent",
		label: ["Your agent replies", "你的智能体回复"],
		line: '"Connected!"',
		phoneLine: '"Connected!"',
		verdict: ["proves nothing", "证明不了"],
		tone: "wt-film-loss",
	},
	{
		id: "client",
		label: ["Claude Code: /mcp", "Claude Code：/mcp"],
		line: "tradingflow · connected · tools listed",
		phoneLine: "connected · tools listed",
		verdict: ["proof", "证据"],
		tone: "wt-film-gain",
	},
	{
		id: "tools",
		label: [
			"Keyed tools/list → result.tools",
			"带密钥 tools/list → result.tools",
		],
		line: TOOL_RESULT,
		phoneLine: TOOL_RESULT,
		verdict: ["your key works", "密钥有效"],
		tone: "wt-film-gain",
	},
] as const satisfies readonly {
	id: string;
	label: Copy;
	line: string | Copy;
	phoneLine: string | Copy;
	verdict: Copy;
	tone: string;
}[];

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
	const checkLine = (check: (typeof CHECKS)[number]) => {
		const value = narrow ? check.phoneLine : check.line;
		return typeof value === "string" ? value : t(value);
	};
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
	const panelLine = (k: number) => L.panelY + L.pad + (k + 0.8) * L.code * 1.6;
	const meterW = room;
	const fill = (calls: number) => (Math.min(calls, LIMIT) / BURST) * meterW;
	const limitX = margin + (LIMIT / BURST) * meterW;
	return (
		<>
			<Backdrop frame={L} />

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				<Word
					name="q-tag"
					x={W / 2}
					y={H * 0.34}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.qTag).toUpperCase()}
				</Word>
				<Lines
					name="q-big"
					text={t(copy.qBig)}
					x={W / 2}
					y={H * 0.34 + T.title * 1.6}
					size={T.title}
					maxWidth={room}
				/>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.72}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("s-head", copy.signinHead, copy.signinHeadShort)}
			<Lines
				name="k-head"
				text={t(narrow ? copy.keyHeadShort : copy.keyHead)}
				x={margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.signinHeadShort : copy.signinHead),
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

			{/* Three ways in. */}
			{METHODS.map((method, i) => {
				const group =
					GROUPS.find((item) => item.method === method) ?? GROUPS[0];
				return (
					<g key={method} data-f={`way-${method}`}>
						<rect
							x={margin}
							y={L.cardY(i)}
							width={room}
							height={L.cardH}
							rx={12}
							className="wt-panel-shape"
						/>
						<rect
							data-f={`way-on-${method}`}
							x={margin}
							y={L.cardY(i)}
							width={room}
							height={L.cardH}
							rx={12}
							className="wt-focus-shape"
						/>
						<text
							x={margin + L.pad}
							y={L.cardY(i) + L.cardH * 0.42}
							className={`wt-film-type ${TONE[method]}`}
							style={{ fontSize: L.rowText }}
						>
							{t(group.title)}
						</text>
						<text
							x={margin + L.pad}
							y={L.cardY(i) + L.cardH * 0.8}
							className="wt-film-type wt-film-dim"
							style={{ fontSize: L.rowText * 0.92 }}
						>
							{(narrow && MEMBERS_SHORT[method]) || group.members}
						</text>
					</g>
				);
			})}
			<rect
				data-f="panel"
				x={margin}
				y={L.panelY}
				width={room}
				height={L.panelH}
				rx={12}
				className="wt-panel-shape"
			/>
			<Word
				name="cmd"
				x={margin + L.pad}
				y={panelLine(0)}
				size={L.rowText}
				anchor="start"
			>
				{t(copy.signinProcess)}
			</Word>
			<Lines
				name="note-key"
				text={t(narrow ? copy.keyNoteShort : copy.keyNote)}
				x={margin + L.pad}
				y={panelLine(0)}
				size={L.rowText}
				maxWidth={room - 2 * L.pad}
				anchor="start"
				className="wt-film-type wt-film-dim"
			/>

			{/* An assertion, then client and server evidence. */}
			{headline("a-head", copy.agentHead, copy.agentHead)}
			<Lines
				name="c-head"
				text={t(narrow ? copy.clientHeadShort : copy.clientHead)}
				x={margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.agentHead : copy.agentHead),
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
			{CHECKS.map((check, i) => (
				<g key={check.id} data-f={`chk-${check.id}`}>
					<rect
						x={margin}
						y={L.rowY(i)}
						width={room}
						height={L.rowH}
						rx={10}
						className="wt-panel-shape"
					/>
					<text
						data-f={`chk-label-${check.id}`}
						x={margin + L.pad}
						y={L.rowY(i) + L.rowH * (narrow ? 0.28 : 0.4)}
						className="wt-film-type"
						style={{ fontSize: L.rowText }}
					>
						{t(check.label)}
					</text>
					<text
						data-f={`chk-payload-${check.id}`}
						x={margin + L.pad}
						y={L.rowY(i) + L.rowH * (narrow ? 0.57 : 0.78)}
						className="wt-film-num wt-film-dim"
						style={{ fontSize: L.code }}
					>
						{checkLine(check)}
					</text>
					<text
						data-f={`vd-${check.id}`}
						x={margin + room - L.pad}
						y={L.rowY(i) + L.rowH * (narrow ? 0.86 : 0.4)}
						textAnchor="end"
						className={`wt-film-type ${check.tone}`}
						style={{ fontSize: L.rowText }}
					>
						{t(check.verdict)}
					</text>
				</g>
			))}

			{/* What a key allows. */}
			{headline("r-head", copy.rateHead, copy.rateHeadShort)}
			<Brackets name="lock-burst" glow />
			<g data-f="meter">
				<text
					x={margin}
					y={L.barY - T.small * 1.2}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(narrow ? copy.meterShort : copy.meter).toUpperCase()}
				</text>
				<rect
					x={margin}
					y={L.barY}
					width={meterW}
					height={L.meterH}
					rx={6}
					className="wt-panel-shape"
				/>
				<rect
					data-f="m-fill"
					x={margin}
					y={L.barY}
					width={fill(0)}
					height={L.meterH}
					rx={6}
					className="wt-film-bar"
					data-tone="total"
				/>
				<rect
					data-f="m-over"
					x={limitX}
					y={L.barY}
					width={0}
					height={L.meterH}
					rx={6}
					className="wt-band-loss"
					style={{ stroke: "var(--diagram-loss)", strokeDasharray: "4 3" }}
				/>
				<path
					d={`M${limitX} ${L.barY - 6}V${L.barY + L.meterH + 6}`}
					className="wt-axis"
					strokeWidth={2}
				/>
				<text
					x={limitX}
					y={L.barY + L.meterH + T.small * 1.8}
					textAnchor="middle"
					className="wt-film-num"
					style={{ fontSize: T.small * 1.1 }}
				>
					{`${LIMIT} ${t(["limit", "上限"])}`}
				</text>
				<text
					data-f="m-refused"
					x={margin + T.num * 2.2}
					// Compact enforcement result, beside the smaller attempt count.
					y={L.meterY + L.meterH + T.num * 1.4}
					textAnchor="start"
					className="wt-film-num wt-film-loss"
					style={{ fontSize: T.num * 1.3 }}
				>
					{`${BURST - LIMIT} ${t(copy.refused)}`}
				</text>
			</g>
			<Word
				name="m-attempts"
				x={margin}
				y={L.barY + L.meterH + T.small * 1.8}
				size={T.small}
				anchor="start"
			>
				{t(copy.attempts)}
			</Word>
			<Word
				name="m-count"
				x={margin}
				y={L.meterY + L.meterH + T.num * 1.4}
				size={T.num}
				anchor="start"
				className="wt-film-num wt-film-accent"
			>
				0
			</Word>
			<g data-f="key">
				<rect
					x={margin}
					y={L.keyY}
					width={room}
					height={L.keyH}
					rx={12}
					className="wt-panel-shape"
				/>
				<text
					x={margin + L.pad}
					y={L.keyY + L.keyH * 0.36}
					className="wt-film-type"
					style={{ fontSize: L.rowText }}
				>
					{t(copy.keyCard)}
				</text>
				<text
					x={margin + room - L.pad}
					y={L.keyY + L.keyH * 0.36}
					textAnchor="end"
					className="wt-film-num wt-film-dim"
					style={{ fontSize: L.rowText }}
				>
					tf_live_••••3f9a
				</text>
			</g>
			{(
				[
					["k-active", copy.active, "wt-film-gain"],
					["k-revoked", copy.revoked, "wt-film-loss"],
				] as const
			).map(([name, text, tone]) => (
				<text
					key={name}
					data-f={name}
					x={margin + L.pad}
					y={L.keyY + L.keyH * 0.76}
					className={`wt-film-type ${tone}`}
					style={{ fontSize: L.rowText }}
				>
					{t(text)}
				</text>
			))}
			<Word
				name="k-revoke-action"
				x={margin + room - L.pad}
				y={L.keyY + L.keyH * 0.76}
				size={L.rowText}
				anchor="end"
				className="wt-film-type wt-film-loss"
			>
				{t(copy.revokeAction)}
			</Word>
			<g data-f="next-call">
				<rect
					x={margin}
					y={L.meterY}
					width={room}
					height={H * 0.17}
					rx={10}
					className="wt-panel-shape"
				/>
				<Word
					name="call-window"
					x={margin + L.pad}
					y={L.meterY + H * 0.05}
					size={L.rowText}
					anchor="start"
				>
					{t(copy.nextWindow)}
				</Word>
				<Word
					name="call-request"
					x={margin + room - L.pad}
					y={L.meterY + H * 0.05}
					size={L.rowText}
					anchor="end"
					className="wt-film-num"
				>
					tools/list →
				</Word>
				<Word
					name="call-rejected"
					x={margin + L.pad}
					y={L.meterY + H * 0.125}
					size={L.rowText}
					anchor="start"
					className="wt-film-type wt-film-loss"
				>
					{t(copy.rejected)}
				</Word>
			</g>
			<g data-f="claim">
				<Lines
					name="z-big"
					text={t(copy.claimBig)}
					x={W / 2}
					y={H * 0.4}
					size={T.title}
					maxWidth={room}
				/>
				<Lines
					name="z-sub"
					text={t(copy.claimSub)}
					x={W / 2}
					y={
						H * 0.4 +
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
	const way = (method: Method) => one(`way-${method}`);
	const on = (method: Method) => one(`way-on-${method}`);
	const check = (id: string) => one(`chk-${id}`);
	const verdict = (id: string) => one(`vd-${id}`);
	const counter = one<SVGTextElement>("m-count");
	const attemptsLabel = one("m-attempts");
	// One state drives the readouts and both regions, including backwards seeks.
	const attempt = { value: 0 };
	const fill = one("m-fill");
	const over = one("m-over");
	const refused = one<SVGTextElement>("m-refused");
	const updateCalls = () => {
		const n = Math.round(attempt.value);
		counter.textContent = String(n);
		fill.setAttribute("width", String((Math.min(n, LIMIT) / BURST) * L.room));
		over.setAttribute(
			"width",
			String((Math.max(0, n - LIMIT) / BURST) * L.room),
		);
		refused.textContent = `${Math.max(0, n - LIMIT)} ${d.t(copy.refused)}`;
	};
	const countCalls = (from: number, to: number, at: number, duration: number) =>
		tl.fromTo(
			attempt,
			{ value: from },
			{
				value: to,
				duration,
				ease: "power2.out",
				immediateRender: false,
				onUpdate: updateCalls,
			},
			at,
		);

	const lockBurst = one<SVGGraphicsElement>("lock-burst");

	d.hidden([
		...flat("q"),
		...["s-head", "k-head", "a-head", "c-head", "r-head"].map((name) =>
			one(name),
		),
		lockBurst,
		...METHODS.flatMap((method) => [way(method), on(method)]),
		one("panel"),
		one("cmd"),
		one("note-key"),
		...CHECKS.flatMap((item) => [check(item.id), verdict(item.id)]),
		one("meter"),
		one("m-over"),
		one("m-refused"),
		counter,
		attemptsLabel,
		one("key"),
		one("k-active"),
		one("k-revoked"),
		one("k-revoke-action"),
		one("next-call"),
		one("call-rejected"),
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

	// ——— way: sign in, a key, or not yet ———
	tl.addLabel("way", 9.6);
	hide(flat("q"), 9.6);
	show(one("s-head"), 9.8, "above");
	METHODS.forEach((method, i) => {
		show(way(method), 10.1 + i * 0.2);
	});
	tl.to(on("signin"), { opacity: 1, duration: 0.3 }, 10.9);
	// Unsupported clients remain fully readable beside the supported routes.
	tl.to(way("key"), { opacity: 0.4, duration: 0.3 }, 10.9);
	show([one("panel"), one("cmd")], 11.1);
	// The compact process settles at 11.6; 1.2 seconds before the key swap.
	show(one("k-head"), 12.8);
	tl.to(on("signin"), { opacity: 0, duration: 0.3 }, 12.8);
	tl.to(way("signin"), { opacity: 0.4, duration: 0.3 }, 12.8);
	tl.to(way("key"), { opacity: 1, duration: 0.3 }, 12.8);
	tl.to(on("key"), { opacity: 1, duration: 0.3 }, 12.8);
	d.swap(one("cmd"), one("note-key"), 12.8);
	// Cut the Slack-credit aside. The unsupported-client card stays visible
	// throughout the choice; no client capability qualification is removed.

	// ——— prove: check it yourself ———
	tl.addLabel("prove", 16.7);
	hide(
		[
			one("s-head"),
			one("k-head"),
			...METHODS.map(way),
			one("panel"),
			one("note-key"),
		],
		16.7,
	);
	show(one("a-head"), 17.05, "above");
	show(check("agent"), 17.1);
	show(verdict("agent"), 17.1, "right");
	// The assertion settles at 17.6; one second before the client proof.
	show(one("c-head"), 18.6);
	show(check("client"), 18.6);
	// Client payload settles at 19.1; let it read before its verdict.
	show(verdict("client"), 20.1, "right");
	// Client verdict settles at 20.6; one second before the server proof.
	show(check("tools"), 21.6);
	// Server payload settles at 22.1; one second before its verdict.
	show(verdict("tools"), 23.1, "right");
	// Settled at 23.6; preserve the accepted 2.6-second final proof rest.

	// ——— key: read-only, rate-limited, revocable ———
	tl.addLabel("key", 26.2);
	hide(
		[
			one("a-head"),
			one("c-head"),
			...CHECKS.flatMap((item) => [check(item.id), verdict(item.id)]),
		],
		26.2,
	);
	show(one("r-head"), 26.55, "above");
	show(one("meter"), 26.8);
	show([one("key"), one("k-active")], 26.8);
	show([counter, attemptsLabel], 27);
	countCalls(0, LIMIT, 27, 1.0);
	// The limit settles at 28; the burst starts after a full second.
	show([over, refused], 29);
	countCalls(LIMIT, BURST, 29, 0.6);
	// The hero: the window's limit, enforced. Preserve the accepted stand.
	d.lock(lockBurst, 30.6, { around: [counter, refused], pad: 6 });
	tl.addLabel("hero-lock", 30.6);
	hide(lockBurst, 34.2);
	// Brackets are gone at 34.55; only then retire the old burst.
	hide([one("meter"), counter, attemptsLabel], 34.55);
	tl.fromTo(
		one("k-revoke-action"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		34.2,
	);
	// Start the action as the protected stand ends. Its entrance and the
	// status fold are one event; their existing durations are unchanged.
	d.flip(one("k-active"), one("k-revoked"), 34.2);
	tl.set(one("k-active"), { opacity: 0 }, 34.5);
	// Revocation settles at 34.85. A fresh window rules out rate limiting.
	show(one("next-call"), 35.85, "below", 0.3);
	tl.fromTo(
		one("call-rejected"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		36.3,
	);
	// Rejection settles at 36.6; two seconds of quiet before the claim.
	hide(
		[
			one("r-head"),
			one("next-call"),
			one("key"),
			one("k-revoked"),
			one("k-revoke-action"),
		],
		38.6,
	);
	word(one("z-big"), 38.85);
	show(one("z-sub"), 39.25);

	// ——— next ———
	tl.addLabel("next", 44);
	hide(kids("claim"), 44);
	d.close(44);
	return tl;
}

export const connectAgentFilm: Film = {
	id: "connect-agent",
	label: [
		`Connecting your own AI agent, as a short film: sign in or an API key; Claude signs in with your TradingFlow account and needs no key, Cursor, Codex and OpenClaw get a key from Copy prompt, and hosted chat sites can't connect yet; proof that it works, where an agent saying it's connected proves nothing, your client's own check does, and tools/list with your key shows what the key reaches; and what a key allows, read-only data tools at ${LIMIT} calls a minute, a burst of ${BURST} with ${BURST - LIMIT} refused, and a revoke that refuses the very next call`,
		`连接你自己的 AI 智能体短片：登录还是 API 密钥；Claude 用你的 TradingFlow 账户登录、不需要密钥，Cursor、Codex 和 OpenClaw 从 Copy prompt 得到密钥，托管的聊天网站暂时无法连接；证明连接有效：智能体说已连接什么也证明不了，客户端自己的检查可以，带密钥的 tools/list 显示这把密钥能用什么；以及一把密钥允许什么：只读数据工具，每分钟 ${LIMIT} 次，一口气 ${BURST} 次就有 ${BURST - LIMIT} 次被拒，撤销后下一次调用就被拒绝`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Connect an agent", "连接智能体"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "way", label: ["Way in", "连接方式"] },
		{ id: "prove", label: ["Prove it", "证明"] },
		{ id: "key", label: ["What a key allows", "密钥能做什么"] },
		{ id: "next", label: ["Next", "下一步"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
