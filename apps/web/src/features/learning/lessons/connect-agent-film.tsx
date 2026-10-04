import { type Copy, pick } from "@/content/world";
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
import { ENDPOINT, GROUPS, LIMIT, type Method } from "./connect-agent-model";

/*
 * Connecting an agent, as a film. It opens on the choice an agent makes, sign in or a key.
 * Claude signs in with your TradingFlow account and needs no key; Cursor, Codex and
 * OpenClaw get one from Copy prompt; hosted chat sites can't connect yet. Then proof: an
 * agent saying "Connected!" proves nothing, your client's own check does, and tools/list
 * with your key shows what that key reaches. Last, what a key allows: read-only tools, 60
 * calls a minute, and a revoke that refuses the very next call.
 *
 *   open      0–4      "Connect your own AI agent"
 *   question  4–9.5    sign in, or an API key?
 *   way       9.5–18.5 Claude signs in; agents use a key; chat sites can't yet
 *   prove     18.5–27.5 "Connected!"; /mcp; curl and tools/list
 *   key       27.5–38  60 a minute; 75: 15 refused; revoke; cut: the claim
 *   next      38–40.5  Next: the module checkpoint
 */

const END = 40.5;
const BURST = 75;
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
	return {
		...frame,
		cardY: (i: number) => H * 0.25 + i * H * 0.165,
		cardH: H * 0.14,
		panelY: H * 0.76,
		panelH: H * (narrow ? 0.17 : 0.15),
		pad: narrow ? 10 : 18,
		rowY: (i: number) => H * 0.26 + i * H * 0.165,
		rowH: H * 0.14,
		code: narrow ? T.small : Math.min(T.body * 0.95, (room - 36) / (80 * 0.6)),
		rowText: narrow ? T.small * 1.15 : T.body,
		meterY: H * (narrow ? 0.36 : 0.34),
		meterH: H * 0.07,
		keyY: H * (narrow ? 0.6 : 0.58),
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
		"Claude signs in with your TradingFlow account: no key.",
		"Claude 用你的 TradingFlow 账户登录：不需要密钥。",
	],
	signinHeadShort: ["Claude: sign in, no key.", "Claude：登录，无需密钥。"],
	keyHead: [
		"Cursor, Codex and OpenClaw connect with an API key.",
		"Cursor、Codex 和 OpenClaw 用 API 密钥连接。",
	],
	keyHeadShort: ["Other agents: a key.", "其他智能体：密钥。"],
	noneHead: [
		"Hosted chat sites can't connect yet.",
		"托管的聊天网站暂时无法连接。",
	],
	noneHeadShort: ["Chat sites: not yet.", "聊天网站：暂不支持。"],
	keyNote: [
		"Copy prompt creates a key and puts it in the prompt you paste to your agent.",
		"Copy prompt 会创建一把密钥，并放进你粘贴给智能体的提示里。",
	],
	keyNoteShort: [
		"Copy prompt → a key → paste to your agent",
		"Copy prompt → 密钥 → 粘贴给智能体",
	],
	noneNote: [
		"For quick questions, link Slack from Settings: 1 AI credit per question.",
		"简单问题可以在设置中关联 Slack：每个问题 1 个 AI 积分。",
	],
	noneNoteShort: [
		"Link Slack instead: 1 credit a question",
		"改用 Slack：每问 1 积分",
	],
	agentHead: [
		"“Connected, ready!” proves nothing: an agent can say it while nothing is registered.",
		"“已连接，准备好了！”什么都证明不了：什么都没注册时它也会这么说。",
	],
	agentHeadShort: ["“Connected!” proves nothing.", "“已连接！”证明不了什么。"],
	clientHead: [
		"Check it yourself: your client lists tradingflow and its tools.",
		"自己检查：客户端列出了 tradingflow 和它的工具。",
	],
	clientHeadShort: ["Your client's own check.", "客户端自己的检查。"],
	serverHead: [
		"Or ask the server: tools/list with your key shows what it reaches.",
		"或者问服务器：带密钥的 tools/list 显示它能用什么。",
	],
	serverHeadShort: ["Ask the server, with your key.", "带上密钥问服务器。"],
	rateHead: [
		`Every data tool is read-only, and a key gets ${LIMIT} calls a minute.`,
		`所有数据工具都是只读的，每把密钥每分钟 ${LIMIT} 次调用。`,
	],
	rateHeadShort: [
		`Read-only, ${LIMIT} calls a minute.`,
		`只读，每分钟 ${LIMIT} 次。`,
	],
	burstHead: [
		`A burst of ${BURST}: ${BURST - LIMIT} are refused until the window rolls on.`,
		`一口气 ${BURST} 次：${BURST - LIMIT} 次被拒，直到窗口滚过去。`,
	],
	burstHeadShort: [
		`${BURST} calls: ${BURST - LIMIT} refused.`,
		`${BURST} 次：${BURST - LIMIT} 次被拒。`,
	],
	revokeHead: [
		"Revoke the key: its very next call is refused.",
		"撤销密钥：它的下一次调用就被拒绝。",
	],
	revokeHeadShort: ["Revoke: the next call fails.", "撤销：下一次调用失败。"],
	meter: ["tool calls · this 60-second window", "工具调用 · 当前 60 秒窗口"],
	refused: ["refused", "被拒"],
	keyCard: ["Cursor key", "Cursor 密钥"],
	active: ["active · read-only data tools", "有效 · 只读数据工具"],
	revoked: ["revoked · next call refused", "已撤销 · 下一次调用被拒"],
	otherKeys: ["your other keys keep working", "你的其他密钥照常可用"],
	claimBig: [
		"Connect it, prove it yourself, know what the key can do.",
		"连接它，亲自证明，弄清密钥能做什么。",
	],
	claimSub: [
		"An agent's word isn't proof; access is checked on every call.",
		"智能体说的不算证明；每次调用都会检查访问权限。",
	],
	nextBig: ["Next: the module checkpoint", "下一步：本模块检查点"],
	nextSub: [
		"workflows in TradingFlow, on a new day",
		"在新的一天里运用在 TradingFlow 中构建工作流",
	],
} as const satisfies Record<string, Copy>;

const CHECKS = [
	{
		id: "agent",
		label: ["Your agent replies", "你的智能体回复"],
		line: '"Connected to TradingFlow, ready!"',
		verdict: ["proves nothing", "证明不了"],
		tone: "wt-film-loss",
	},
	{
		id: "client",
		label: ["Your client's own check: /mcp", "客户端自己的检查：/mcp"],
		line: "tradingflow · connected · tools listed",
		verdict: ["proof", "证据"],
		tone: "wt-film-gain",
	},
	{
		id: "reach",
		label: ["curl -s, no key", "curl -s，不带密钥"],
		line: '{"name":"tradingflow-mcp","status":"ok",…}',
		verdict: ["endpoint up only", "仅说明端点在线"],
		tone: "wt-film-warn",
	},
	{
		id: "tools",
		label: ["tools/list, with your key", "tools/list，带上你的密钥"],
		line: '{"jsonrpc":"2.0","id":1,"result":{"tools":[…]}}',
		verdict: ["your key works", "密钥有效"],
		tone: "wt-film-gain",
	},
] as const satisfies readonly {
	id: string;
	label: Copy;
	line: string;
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
	const commands = narrow
		? ["claude mcp add … tradingflow", "claude mcp login tradingflow"]
		: [
				`claude mcp add --transport http tradingflow ${ENDPOINT}`,
				"claude mcp login tradingflow",
			];
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
			{headline("k-head", copy.keyHead, copy.keyHeadShort)}
			{headline("n-head", copy.noneHead, copy.noneHeadShort)}

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
			<g data-f="cmd">
				{commands.map((command, k) => (
					<text
						key={command}
						x={margin + L.pad}
						y={panelLine(k)}
						className="wt-film-num"
						style={{ fontSize: L.code }}
					>
						{`$ ${command}`}
					</text>
				))}
			</g>
			{(
				[
					["note-key", narrow ? copy.keyNoteShort : copy.keyNote],
					["note-none", narrow ? copy.noneNoteShort : copy.noneNote],
				] as const
			).map(([name, text]) => (
				<Lines
					key={name}
					name={name}
					text={t(text)}
					x={margin + L.pad}
					y={panelLine(0)}
					size={L.rowText}
					maxWidth={room - 2 * L.pad}
					anchor="start"
					className="wt-film-type wt-film-dim"
				/>
			))}

			{/* Four checks. */}
			{headline("a-head", copy.agentHead, copy.agentHeadShort)}
			{headline("c-head", copy.clientHead, copy.clientHeadShort)}
			{headline("v-head", copy.serverHead, copy.serverHeadShort)}
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
						x={margin + L.pad}
						y={L.rowY(i) + L.rowH * (narrow ? 0.6 : 0.4)}
						className="wt-film-type"
						style={{ fontSize: L.rowText }}
					>
						{t(check.label)}
					</text>
					{narrow ? null : (
						<text
							x={margin + L.pad}
							y={L.rowY(i) + L.rowH * 0.78}
							className="wt-film-num wt-film-dim"
							style={{ fontSize: L.code }}
						>
							{check.line}
						</text>
					)}
					<text
						data-f={`vd-${check.id}`}
						x={margin + room - L.pad}
						y={L.rowY(i) + L.rowH * (narrow ? 0.6 : 0.4)}
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
			{headline("b-head", copy.burstHead, copy.burstHeadShort)}
			{headline("x-head", copy.revokeHead, copy.revokeHeadShort)}
			<g data-f="meter">
				<text
					x={margin}
					y={L.meterY - T.small * 1.2}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.meter).toUpperCase()}
				</text>
				<rect
					x={margin}
					y={L.meterY}
					width={meterW}
					height={L.meterH}
					rx={6}
					className="wt-panel-shape"
				/>
				<rect
					data-f="m-fill"
					x={margin}
					y={L.meterY}
					width={fill(0)}
					height={L.meterH}
					rx={6}
					className="wt-film-bar"
					data-tone="total"
				/>
				<rect
					data-f="m-over"
					x={limitX}
					y={L.meterY}
					width={meterW - (limitX - margin)}
					height={L.meterH}
					rx={6}
					className="wt-band-loss"
					style={{ stroke: "var(--diagram-loss)", strokeDasharray: "4 3" }}
				/>
				<path
					d={`M${limitX} ${L.meterY - 6}V${L.meterY + L.meterH + 6}`}
					className="wt-axis"
					strokeWidth={2}
				/>
				<text
					x={limitX}
					y={L.meterY + L.meterH + T.small * 1.8}
					textAnchor="middle"
					className="wt-film-num"
					style={{ fontSize: T.small * 1.1 }}
				>
					{String(LIMIT)}
				</text>
				<text
					data-f="m-refused"
					x={margin + room}
					// On the counter's line, clear of the limit's label under the bar.
					y={L.meterY + L.meterH + T.num * 1.4}
					textAnchor="end"
					className="wt-film-type wt-film-loss"
					style={{ fontSize: T.small * 1.1 }}
				>
					{`${BURST - LIMIT} ${t(copy.refused)}`}
				</text>
			</g>
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
			{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
			time,
		);
	const way = (method: Method) => one(`way-${method}`);
	const on = (method: Method) => one(`way-on-${method}`);
	const check = (id: string) => one(`chk-${id}`);
	const verdict = (id: string) => one(`vd-${id}`);
	const counter = one<SVGTextElement>("m-count");
	const calls = (value: number) => String(Math.round(value));
	const fillTo = (n: number) => (Math.min(n, LIMIT) / BURST) * L.room;

	d.hidden([
		...flat("q"),
		...[
			"s-head",
			"k-head",
			"n-head",
			"a-head",
			"c-head",
			"v-head",
			"r-head",
			"b-head",
			"x-head",
		].map((name) => one(name)),
		...METHODS.flatMap((method) => [way(method), on(method)]),
		one("panel"),
		one("cmd"),
		one("note-key"),
		one("note-none"),
		...CHECKS.flatMap((item) => [check(item.id), verdict(item.id)]),
		one("meter"),
		one("m-over"),
		one("m-refused"),
		counter,
		one("key"),
		one("k-active"),
		one("k-revoked"),
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
	show(one("q-line"), 6.4);

	// ——— way: sign in, a key, or not yet ———
	tl.addLabel("way", 9.5);
	hide(flat("q"), 9.5);
	show(one("s-head"), 9.7, "above");
	METHODS.forEach((method, i) => {
		show(way(method), 10.0 + i * 0.2);
	});
	tl.to(on("signin"), { opacity: 1, duration: 0.3 }, 10.8);
	tl.to([way("key"), way("none")], { opacity: 0.4, duration: 0.3 }, 10.8);
	show(one("panel"), 11.0);
	show(one("cmd"), 11.3);
	d.swap(one("s-head"), one("k-head"), 13.0);
	tl.to(on("signin"), { opacity: 0, duration: 0.3 }, 13.4);
	tl.to(way("signin"), { opacity: 0.4, duration: 0.3 }, 13.4);
	tl.to(way("key"), { opacity: 1, duration: 0.3 }, 13.4);
	tl.to(on("key"), { opacity: 1, duration: 0.3 }, 13.4);
	d.swap(one("cmd"), one("note-key"), 13.4);
	d.swap(one("k-head"), one("n-head"), 15.6);
	tl.to(on("key"), { opacity: 0, duration: 0.3 }, 16.0);
	tl.to(way("key"), { opacity: 0.4, duration: 0.3 }, 16.0);
	tl.to(way("none"), { opacity: 1, duration: 0.3 }, 16.0);
	d.swap(one("note-key"), one("note-none"), 16.0);

	// ——— prove: check it yourself ———
	tl.addLabel("prove", 18.5);
	hide(
		[one("n-head"), ...METHODS.map(way), one("panel"), one("note-none")],
		18.5,
	);
	show(one("a-head"), 18.8, "above");
	show(check("agent"), 19.1);
	show(verdict("agent"), 19.8, "right");
	d.swap(one("a-head"), one("c-head"), 21.6);
	show(check("client"), 22.0);
	show(verdict("client"), 22.6, "right");
	d.swap(one("c-head"), one("v-head"), 24.2);
	show(check("reach"), 24.6);
	show(verdict("reach"), 25.0, "right");
	show(check("tools"), 25.4);
	show(verdict("tools"), 25.8, "right");

	// ——— key: read-only, rate-limited, revocable ———
	tl.addLabel("key", 27.5);
	hide(
		[
			one("v-head"),
			...CHECKS.flatMap((item) => [check(item.id), verdict(item.id)]),
		],
		27.5,
	);
	show(one("r-head"), 27.7, "above");
	show(one("meter"), 28.0);
	show(counter, 28.2);
	tl.to(
		one("m-fill"),
		{ attr: { width: fillTo(LIMIT) }, duration: 1.0, ease: "power2.out" },
		28.4,
	);
	d.count(counter, LIMIT, 28.4, calls, 0, 1.0);
	show([one("key"), one("k-active")], 29.0);
	d.swap(one("r-head"), one("b-head"), 30.4);
	tl.to(one("m-over"), { opacity: 1, duration: 0.4 }, 30.8);
	d.count(counter, BURST, 30.8, calls, LIMIT, 0.6);
	show(one("m-refused"), 31.2);
	d.swap(one("b-head"), one("x-head"), 32.6);
	d.flip(one("k-active"), one("k-revoked"), 33.0);
	tl.set(one("k-active"), { opacity: 0 }, 33.3);
	// Cut: the claim.
	hide(
		[one("x-head"), one("meter"), counter, one("key"), one("k-revoked")],
		34.8,
	);
	word(one("z-big"), 35.2);
	show(one("z-sub"), 35.7);

	// ——— next ———
	tl.addLabel("next", 38);
	hide(kids("claim"), 38.0);
	d.close(38.0);
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
