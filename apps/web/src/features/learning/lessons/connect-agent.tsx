import * as m from "motion/react-m";
import { type Copy, pick } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import { Label, Stage, useTeachMotion } from "../walkthrough/stage";
import { textWidth, wrapText } from "../walkthrough/text-measure";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

const ENDPOINT = "https://app.tradingflow.com/api/mcp";

// ——— Scene 1: which way in ———

type Method = "signin" | "key" | "none";
type ClientId = "claudeCode" | "claudeApp" | "cursor" | "codex" | "chatgpt";
type WayState = { client: ClientId; reveal: boolean };

const CLIENTS: Record<ClientId, { label: string; method: Method }> = {
	claudeCode: { label: "Claude Code", method: "signin" },
	claudeApp: { label: "claude.ai", method: "signin" },
	cursor: { label: "Cursor", method: "key" },
	codex: { label: "Codex", method: "key" },
	chatgpt: { label: "ChatGPT", method: "none" },
};
const CLIENT_IDS = Object.keys(CLIENTS) as ClientId[];

const GROUPS: readonly { method: Method; title: Copy; members: string }[] = [
	{
		method: "signin",
		title: ["Sign in · no API key", "登录 · 无需 API 密钥"],
		members: "Claude Code · claude.ai · Desktop · mobile · Cowork",
	},
	{
		method: "key",
		title: ["API key", "API 密钥"],
		members: "Cursor · Codex · OpenClaw",
	},
	{
		method: "none",
		title: ["Not supported yet", "暂不支持"],
		members: "ChatGPT · Gemini · Grok.com",
	},
];

/** What setting up looks like for a client: commands are typed as shown. */
function setupLines(client: ClientId): { code: boolean; text: Copy }[] {
	if (client === "claudeCode")
		return [
			{
				code: true,
				text: [
					`claude mcp add --transport http tradingflow ${ENDPOINT}`,
					`claude mcp add --transport http tradingflow ${ENDPOINT}`,
				],
			},
			{
				code: true,
				text: ["claude mcp login tradingflow", "claude mcp login tradingflow"],
			},
			{
				code: false,
				text: [
					"The second command opens your browser to sign in.",
					"第二条命令会打开浏览器让你登录。",
				],
			},
		];
	if (client === "claudeApp")
		return [
			{
				code: false,
				text: [
					"Add to Claude, check the URL, then Continue, Add and Connect.",
					"点 Add to Claude，核对网址，然后依次点 Continue、Add 和 Connect。",
				],
			},
			{
				code: false,
				text: [
					"Sign in with your TradingFlow account and choose Allow.",
					"用你的 TradingFlow 账户登录，并选择 Allow。",
				],
			},
		];
	if (client === "chatgpt")
		return [
			{
				code: false,
				text: [
					"Hosted chat sites can't connect yet.",
					"托管的聊天网站暂时无法连接。",
				],
			},
			{
				code: false,
				text: [
					"For quick questions, link Slack from Settings instead: 1 AI credit per question.",
					"如果只是问些简单问题，可以在设置中关联 Slack：每个问题 1 个 AI 积分。",
				],
			},
		];
	return [
		{
			code: false,
			text: [
				"Copy prompt creates an API key and puts it in the prompt.",
				"Copy prompt 会创建一个 API 密钥，并把它放进提示里。",
			],
		},
		{
			code: false,
			text: [
				"Paste it to your agent: it reads the reference and connects itself.",
				"把它粘贴给你的智能体：它会读取参考文档并自行连接。",
			],
		},
	];
}

const LINE = 16;

/** Each group card grows with its member list, which wraps on a phone. */
function groupLayout(width: number) {
	let y = 26;
	return GROUPS.map((group) => {
		const members = wrapText(group.members, width - 32, 11);
		const height = 32 + members.length * 14;
		const row = { top: y, height, members };
		y += height + 8;
		return row;
	});
}

function wayLayout(width: number, locale: Locale) {
	const groups = groupLayout(width);
	const last = groups[groups.length - 1];
	const setupTop = last.top + last.height + 18;
	const slots = Math.max(
		...CLIENT_IDS.map((client) =>
			setupLines(client).reduce(
				(sum, line) =>
					sum + wrapText(pick(line.text, locale), width - 32, 12).length,
				0,
			),
		),
	);
	return { setupTop, height: setupTop + 30 + slots * LINE + 12 };
}

function WayStage({
	width,
	state,
	locale,
}: {
	width: number;
	state: WayState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const client = CLIENTS[state.client];
	const layout = wayLayout(width, locale);
	let y = layout.setupTop + 44;
	const setup = setupLines(state.client).flatMap((line) =>
		wrapText(t(line.text), width - 32, 12).map((text) => {
			const row = { code: line.code, text, y };
			y += LINE;
			return row;
		}),
	);
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t([`Your client: ${client.label}`, `你的客户端：${client.label}`])}
			</Label>
			{GROUPS.map((group, i) => {
				const { top, height, members } = groupLayout(width)[i];
				const on = group.method === client.method;
				return (
					<g key={group.method}>
						<rect
							x={4}
							y={top}
							width={width - 8}
							height={height}
							rx={10}
							className={
								on && state.reveal ? "wt-focus-shape" : "wt-panel-shape"
							}
						/>
						<m.text
							key={`${group.method}-${state.reveal}`}
							x={16}
							y={top + 20}
							className={
								!state.reveal
									? "wt-muted"
									: on
										? "wt-accent"
										: group.method === "none"
											? "wt-loss"
											: undefined
							}
							initial={motion.enabled ? { opacity: 0 } : false}
							animate={{ opacity: 1 }}
							transition={motion.fade}
						>
							{state.reveal ? t(group.title) : "?"}
						</m.text>
						{members.map((line, k) => (
							<Label key={line} x={16} y={top + 38 + k * 14} tone="small">
								{line}
							</Label>
						))}
					</g>
				);
			})}
			<rect
				x={4}
				y={layout.setupTop}
				width={width - 8}
				height={layout.height - layout.setupTop - 4}
				rx={10}
				className="wt-panel-shape"
			/>
			<Label x={16} y={layout.setupTop + 22} tone="muted">
				{t(["Setting it up", "如何设置"])}
			</Label>
			<m.g
				key={`${state.client}-${state.reveal}`}
				initial={motion.enabled ? { opacity: 0 } : false}
				animate={{ opacity: 1 }}
				transition={motion.fade}
			>
				{state.reveal ? (
					setup.map((row) => (
						<Label
							key={`${row.y}-${row.text}`}
							x={16}
							y={row.y}
							tone="muted"
							className={row.code ? "wt-code" : undefined}
						>
							{row.text}
						</Label>
					))
				) : (
					<Label x={16} y={layout.setupTop + 44} tone="muted">
						?
					</Label>
				)}
			</m.g>
		</g>
	);
}

function WayView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: WayState;
	explore: WayState | null;
	setExplore: (next: WayState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const method = CLIENTS[shown.client].method;
	const result: ResultItem[] = [
		{
			id: "credential",
			label: t(["What you need", "你需要什么"]),
			value: !shown.reveal
				? "?"
				: method === "signin"
					? t(["Your sign-in", "你的登录"])
					: method === "key"
						? t(["An API key", "一把 API 密钥"])
						: t(["Not possible yet", "暂时不行"]),
			note: !shown.reveal
				? t(["to connect", "用于连接"])
				: method === "signin"
					? t(["acting as your account", "以你的账户身份操作"])
					: method === "key"
						? t(["one per agent, revocable", "每个智能体一把，可撤销"])
						: t(["hosted chat sites", "托管的聊天网站"]),
			tone: shown.reveal && method === "none" ? "loss" : undefined,
		},
		{
			id: "credits",
			label: t(["TradingFlow AI credits", "TradingFlow AI 积分"]),
			value: t(["None", "不消耗"]),
			note: t([
				"your agent's own budget pays for its reasoning",
				"智能体的推理由它自己的额度支付",
			]),
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Three ways AI clients reach TradingFlow: Claude signs in with your TradingFlow account and needs no API key; Cursor, Codex and OpenClaw use an API key; hosted chat sites such as ChatGPT can't connect yet",
						"AI 客户端连接 TradingFlow 的三种情况：Claude 用你的 TradingFlow 账户登录，无需 API 密钥；Cursor、Codex 和 OpenClaw 使用 API 密钥；ChatGPT 等托管聊天网站暂时无法连接",
					])}
					height={(width) => wayLayout(width, locale).height}
				>
					{(width) => <WayStage width={width} state={shown} locale={locale} />}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Client", "客户端"])}
						value={explore.client}
						options={CLIENT_IDS.map((id) => [id, CLIENTS[id].label] as const)}
						onChange={(client) => setExplore({ ...explore, client })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"TradingFlow runs a remote MCP server, one HTTP endpoint, so there's nothing to install. Claude, in claude.ai, Claude Desktop, mobile, Cowork and Claude Code, signs in with your TradingFlow account and needs no API key; it acts as the account you sign in with. Cursor, Codex and OpenClaw connect with an API key: Copy prompt on the Connect an AI agent page creates one and puts it in a prompt your agent follows to connect itself. ChatGPT, Gemini, Grok.com and other hosted chat sites can't connect yet. Tool calls run typed queries against TradingFlow's data, the same data layer as the in-app assistant, so they use no TradingFlow AI credits; your agent's own reasoning draws on its own usage or API budget.",
						"TradingFlow 运行一个远程 MCP 服务器，只有一个 HTTP 端点，所以无需安装任何东西。Claude（claude.ai、Claude Desktop、移动端、Cowork 和 Claude Code）用你的 TradingFlow 账户登录，无需 API 密钥，并以你登录的账户身份操作。Cursor、Codex 和 OpenClaw 通过 API 密钥连接：Connect an AI agent 页面上的 Copy prompt 会创建一把密钥，并把它放进一段提示，智能体按提示自行完成连接。ChatGPT、Gemini、Grok.com 等托管聊天网站暂时无法连接。工具调用是针对 TradingFlow 数据的类型化查询，与应用内助手使用同一数据层，所以不消耗 TradingFlow AI 积分；智能体自己的推理则使用它自己的用量或 API 额度。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: don't take the agent's word for it ———

type ProveState = { stage: 0 | 1 | 2; keyWorks: boolean };

/** Code breaks after commas as well as spaces, so a JSON reply wraps without losing a character. */
function wrapCode(text: string, maxWidth: number, size: number) {
	const lines: string[] = [];
	let line = "";
	for (const part of text.split(/(?<=[, ])/)) {
		if (line && textWidth((line + part).trimEnd(), size) > maxWidth) {
			lines.push(line.trimEnd());
			line = part.trimStart();
		} else line += part;
	}
	if (line) lines.push(line.trimEnd());
	return lines;
}
type Verdict = "none" | "proof" | "partial" | "fail";

function checks(state: ProveState): {
	id: string;
	at: 0 | 1 | 2;
	label: Copy;
	line: string;
	verdict: Copy;
	kind: Verdict;
}[] {
	return [
		{
			id: "agent",
			at: 0,
			label: ["Your agent replies", "你的智能体回复"],
			line: '"Connected to TradingFlow, ready!"',
			verdict: [
				"proves nothing: it can report success while nothing is registered",
				"什么都证明不了：它可能报告成功，实际却什么都没注册",
			],
			kind: "none",
		},
		{
			id: "client",
			at: 1,
			label: [
				"Your client's own check: /mcp in Claude Code",
				"客户端自己的检查：Claude Code 中的 /mcp",
			],
			line: "tradingflow · connected · tools listed",
			verdict: [
				"your client registered it and can see its tools",
				"你的客户端已注册它，并能看到它的工具",
			],
			kind: "proof",
		},
		{
			id: "reach",
			at: 2,
			label: [`curl -s ${ENDPOINT}`, `curl -s ${ENDPOINT}`],
			line: '{"name":"tradingflow-mcp","status":"ok",…}',
			verdict: [
				"the endpoint is up; it needs no key, so it says nothing about yours",
				"端点在线；它不需要密钥，所以说明不了你的密钥",
			],
			kind: "partial",
		},
		{
			id: "tools",
			at: 2,
			label: ["tools/list with your key", "带上你的密钥调用 tools/list"],
			line: state.keyWorks
				? '{"jsonrpc":"2.0","id":1,"result":{"tools":[…]}}'
				: '{"jsonrpc":"2.0","id":1,"error":{…}} · HTTP 200',
			verdict: state.keyWorks
				? [
						"your key works, and these are the tools it reaches",
						"你的密钥有效，这些就是它能用的工具",
					]
				: [
						"still HTTP 200, but an error: look the code up in the reference",
						"仍是 HTTP 200，但这是错误：去参考文档里查这个代码",
					],
			kind: state.keyWorks ? "proof" : "fail",
		},
	];
}

function proveLayout(width: number, locale: Locale) {
	const inner = width - 32;
	let y = 4;
	const rows = checks({ stage: 2, keyWorks: false }).map((check) => {
		const label = wrapText(pick(check.label, locale), inner, 12);
		const line = Math.max(
			wrapCode(check.line, inner, 12).length,
			check.id === "tools"
				? wrapCode(checks({ stage: 2, keyWorks: true })[3].line, inner, 12)
						.length
				: 0,
		);
		const verdict = Math.max(
			wrapText(pick(check.verdict, locale), inner, 11).length,
			check.id === "tools"
				? wrapText(
						pick(checks({ stage: 2, keyWorks: true })[3].verdict, locale),
						inner,
						11,
					).length
				: 0,
		);
		const height = 14 + (label.length + line) * 16 + verdict * 15 + 8;
		const row = { top: y, height };
		y += height + 8;
		return row;
	});
	return { rows, height: y };
}

function ProveStage({
	width,
	state,
	locale,
}: {
	width: number;
	state: ProveState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const layout = proveLayout(width, locale);
	const inner = width - 32;
	return (
		<g>
			{checks(state).map((check, i) => {
				const { top, height } = layout.rows[i];
				const label = wrapText(t(check.label), inner, 12);
				const line = wrapCode(check.line, inner, 12);
				const verdict = wrapText(t(check.verdict), inner, 11);
				const lineTop = top + 20 + label.length * 16;
				const verdictTop = lineTop + line.length * 16 + 2;
				const shownVerdict = state.stage >= 1 || check.at > 0;
				return (
					<m.g
						key={check.id}
						initial={false}
						animate={{ opacity: check.at > state.stage ? 0 : 1 }}
						transition={motion.fade}
					>
						<rect
							x={4}
							y={top}
							width={width - 8}
							height={height}
							rx={10}
							className={
								check.kind === "proof" && check.at <= state.stage
									? "wt-focus-shape"
									: "wt-panel-shape"
							}
						/>
						{label.map((text, k) => (
							<Label
								key={text}
								x={16}
								y={top + 20 + k * 16}
								tone="muted"
								className={check.id === "reach" ? "wt-code" : undefined}
							>
								{text}
							</Label>
						))}
						{line.map((text, k) => (
							<Label
								key={text}
								x={16}
								y={lineTop + k * 16}
								tone="muted"
								className="wt-code"
							>
								{text}
							</Label>
						))}
						<m.g
							key={`${check.id}-${check.kind}-${shownVerdict}`}
							initial={motion.enabled ? { opacity: 0 } : false}
							animate={{ opacity: shownVerdict ? 1 : 0 }}
							transition={motion.fade}
						>
							{verdict.map((text, k) => (
								<Label
									key={text}
									x={16}
									y={verdictTop + k * 15}
									tone="small"
									className={
										check.kind === "proof"
											? "wt-accent"
											: check.kind === "partial"
												? undefined
												: "wt-loss"
									}
								>
									{text}
								</Label>
							))}
						</m.g>
					</m.g>
				);
			})}
		</g>
	);
}

function ProveView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ProveState;
	explore: ProveState | null;
	setExplore: (next: ProveState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] = [
		{
			id: "proven",
			label: t(["Proven so far", "目前已证明"]),
			value:
				shown.stage === 0
					? t(["Nothing yet", "还没有"])
					: shown.stage === 1
						? t(["Registered", "已注册"])
						: shown.keyWorks
							? t(["Key works", "密钥有效"])
							: t(["Key fails", "密钥无效"]),
			note:
				shown.stage === 0
					? t(["only the agent's reply", "只有智能体的回复"])
					: shown.stage === 1
						? t(["by your client's own check", "由客户端自己的检查证明"])
						: t(["and the endpoint is up", "且端点在线"]),
			tone: shown.stage === 2 && !shown.keyWorks ? "loss" : undefined,
		},
	];
	if (shown.stage === 2)
		result.push({
			id: "http",
			label: t(["tools/list status", "tools/list 状态"]),
			value: "HTTP 200",
			note: shown.keyWorks
				? t(["with result.tools", "带 result.tools"])
				: t(["with an error object: not success", "带错误对象：不是成功"]),
			tone: shown.keyWorks ? undefined : "loss",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Four ways to check an agent connection: the agent's own reply proves nothing; the client's own check proves registration; a plain request proves only that the endpoint is up; a tools/list call with your key proves the key works, or returns an error object with HTTP 200",
						"检查智能体连接的四种方式：智能体自己的回复什么都证明不了；客户端自己的检查证明已注册；普通请求只证明端点在线；带密钥的 tools/list 调用证明密钥有效，或在 HTTP 200 下返回错误对象",
					])}
					height={(width) => proveLayout(width, locale).height}
				>
					{(width) => (
						<ProveStage width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Your key", "你的密钥"])}
						value={explore.keyWorks ? "works" : "revoked"}
						options={[
							["works", t(["Active", "有效"])],
							["revoked", t(["Revoked", "已撤销"])],
						]}
						onChange={(value) =>
							setExplore({ ...explore, keyWorks: value === "works" })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"An agent can say it's connected while nothing is registered, so prove the connection with your client's own check: /mcp or claude mcp get tradingflow in Claude Code, codex mcp list in Codex, the MCP section of Cursor's settings, or openclaw mcp doctor tradingflow --probe. You can also ask the server directly. A plain GET to the endpoint needs no key and only proves it's reachable; a tools/list call with your key lists exactly the tools that key can reach. A result.tools array means you're connected; an error object, still with HTTP 200, means something is wrong, and the full reference lists every error code with its fix.",
						"智能体可能说已经连上，实际却什么都没注册，所以要用客户端自己的检查来证明连接：在 Claude Code 中用 /mcp 或 claude mcp get tradingflow，在 Codex 中用 codex mcp list，在 Cursor 设置的 MCP 部分查看，或运行 openclaw mcp doctor tradingflow --probe。你也可以直接询问服务器。对端点的普通 GET 请求不需要密钥，只能证明它可以访问；带上你的密钥调用 tools/list，会列出这把密钥能用的全部工具。返回 result.tools 数组说明已连接；返回错误对象（HTTP 状态仍是 200）说明有问题，完整参考文档列出了每个错误代码及其解决办法。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: what a key allows ———

type KeyState = { calls: 12 | 60 | 75; revoked: boolean };

const LIMIT = 60;
const KEY_H = 236;

function KeyStage({
	width,
	state,
	locale,
}: {
	width: number;
	state: KeyState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const barW = width - 32;
	const used = Math.min(state.calls, LIMIT);
	const over = Math.max(0, state.calls - LIMIT);
	/** The window is full at the limit, so the next call waits for it to roll on. */
	const full = state.calls >= LIMIT;
	const permissions: { label: Copy; value: Copy; off?: boolean }[] = [
		{
			label: ["Data tools", "数据工具"],
			value: ["read-only", "只读"],
		},
		{
			label: ["Recipe editing", "编辑 Recipe"],
			value: ["off by default", "默认关闭"],
			off: true,
		},
	];
	const nextLabel = t(["Next tool call", "下一次工具调用"]);
	const nextOutcome = state.revoked
		? t(["refused: key revoked", "被拒绝：密钥已撤销"])
		: full
			? t(["stopped by the limit", "被限额挡住"])
			: t(["accepted", "接受"]);
	const stackNext =
		textWidth(nextLabel, 12) + textWidth(nextOutcome, 11) + 40 > barW;
	return (
		<g>
			<m.g
				initial={false}
				animate={{ opacity: state.revoked ? 0.5 : 1 }}
				transition={motion.fade}
			>
				<rect
					x={4}
					y={4}
					width={width - 8}
					height={KEY_H - 8}
					rx={12}
					className="wt-panel-shape"
				/>
				<Label x={16} y={28}>
					{t(["Cursor · API key", "Cursor · API 密钥"])}
				</Label>
				{permissions.map((item, i) => (
					<g key={item.label[0]}>
						<Label x={16} y={58 + i * 22} tone="muted">
							{t(item.label)}
						</Label>
						<Label
							x={width - 16}
							y={58 + i * 22}
							anchor="end"
							tone="small"
							className={item.off ? undefined : "wt-accent"}
						>
							{t(item.value)}
						</Label>
					</g>
				))}
				<Label x={16} y={118} tone="muted">
					{t(["Tool calls, this 60-second window", "工具调用，本 60 秒窗口"])}
				</Label>
				<rect
					x={16}
					y={130}
					width={barW}
					height={14}
					rx={7}
					className="wt-panel-shape"
				/>
				<m.rect
					x={16}
					y={130}
					height={14}
					rx={7}
					className={over ? "wt-short" : "wt-chip"}
					initial={false}
					animate={{ width: (barW * used) / LIMIT }}
					transition={motion.move}
				/>
				<Label x={16} y={164} tone="small">
					{`${used} / ${LIMIT}`}
				</Label>
				<m.text
					key={`over-${over}`}
					x={width - 16}
					y={164}
					textAnchor="end"
					className="wt-small wt-loss"
					initial={motion.enabled ? { opacity: 0 } : false}
					animate={{ opacity: over ? 1 : 0 }}
					transition={motion.fade}
				>
					{t([`+${over} over the limit`, `超出限额 ${over} 次`])}
				</m.text>
			</m.g>
			<rect
				x={16}
				y={182}
				width={barW}
				height={36}
				rx={8}
				className={state.revoked ? "wt-focus-shape" : "wt-panel-shape"}
			/>
			<Label x={28} y={stackNext ? 198 : 205} tone="muted">
				{nextLabel}
			</Label>
			{/* When the label and its outcome don't fit side by side, the outcome goes under it. */}
			<m.text
				key={`next-${state.revoked}-${full}`}
				x={stackNext ? 28 : width - 28}
				y={stackNext ? 212 : 205}
				textAnchor={stackNext ? "start" : "end"}
				className={
					state.revoked || full ? "wt-small wt-loss" : "wt-small wt-accent"
				}
				initial={motion.enabled ? { opacity: 0 } : false}
				animate={{ opacity: 1 }}
				transition={motion.fade}
			>
				{nextOutcome}
			</m.text>
		</g>
	);
}

function KeyView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: KeyState;
	explore: KeyState | null;
	setExplore: (next: KeyState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const over = Math.max(0, shown.calls - LIMIT);
	const result: ResultItem[] = [
		{
			id: "tools",
			label: t(["Data tools", "数据工具"]),
			value: t(["Read-only", "只读"]),
			note: t(["no tool writes or deletes data", "没有工具能写入或删除数据"]),
		},
		{
			id: "rate",
			label: t(["Calls this window", "本窗口调用次数"]),
			value: `${Math.min(shown.calls, LIMIT)} / ${LIMIT}`,
			note: over
				? t([`${over} more stopped by the limit`, `另有 ${over} 次被限额挡住`])
				: shown.calls >= LIMIT
					? t(["the window is full", "本窗口已满"])
					: t(["per key, per 60 seconds", "每把密钥，每 60 秒"]),
			tone: shown.calls >= LIMIT ? "loss" : undefined,
		},
		{
			id: "access",
			label: t(["Access", "访问权限"]),
			value: shown.revoked ? t(["Revoked", "已撤销"]) : t(["Active", "有效"]),
			note: shown.revoked
				? t(["checked on every call", "每次调用都会检查"])
				: t(["your other keys are independent", "你的其他密钥互不影响"]),
			tone: shown.revoked ? "loss" : undefined,
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"An agent's API key: read-only data tools, recipe editing off, a limit of 60 tool calls per 60 seconds, and a revoked key whose next call is refused",
						"智能体的 API 密钥：数据工具只读，Recipe 编辑关闭，每 60 秒最多 60 次工具调用；密钥撤销后，下一次调用就被拒绝",
					])}
					height={KEY_H}
				>
					{(width) => <KeyStage width={width} state={shown} locale={locale} />}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<>
						<ChoiceField
							label={t(["Calls in a minute", "一分钟内的调用"])}
							value={String(explore.calls) as "12" | "60" | "75"}
							options={[
								["12", "12"],
								["60", "60"],
								["75", "75"],
							]}
							onChange={(value) =>
								setExplore({
									...explore,
									calls: Number(value) as KeyState["calls"],
								})
							}
						/>
						<ChoiceField
							label={t(["Key", "密钥"])}
							value={explore.revoked ? "revoked" : "active"}
							options={[
								["active", t(["Active", "有效"])],
								["revoked", t(["Revoked", "已撤销"])],
							]}
							onChange={(value) =>
								setExplore({ ...explore, revoked: value === "revoked" })
							}
						/>
					</>
				) : null
			}
			details={
				<p>
					{t([
						"Every data tool is read-only: an agent can run read-only SQL and structured tools such as option trades, symbol candles and contract rank, but no tool can write, modify or delete TradingFlow data. Recipe editing is the one optional exception: a permission you grant per key from Manage keys, off by default, which Claude's sign-in never includes, and even then nothing saves until you confirm it. The limit is 60 tool calls per key, or per Claude connection, in each 60-second window. Access is re-checked on every call, so a lapsed subscription or a revoked or expired key stops working at once. Keys are independent: give each agent its own, and revoking one never affects the others. To disconnect Claude Code, run claude mcp logout tradingflow.",
						"所有数据工具都是只读的：智能体可以运行只读 SQL，以及期权成交、标的 K 线、合约排名等结构化工具，但没有任何工具能写入、修改或删除 TradingFlow 的数据。唯一可选的例外是编辑 Recipe：这是你在 Manage keys 中按密钥单独授予的权限，默认关闭，Claude 的登录方式从不包含它；即使开启，在你单独确认之前也不会保存任何内容。限额是每把密钥（或每个 Claude 连接）每 60 秒窗口 60 次工具调用。每次调用都会重新检查访问权限，所以订阅过期、密钥被撤销或过期，都会立刻失效。密钥彼此独立：给每个智能体单独一把，撤销其中一把不会影响其他密钥。要断开 Claude Code，运行 claude mcp logout tradingflow。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<WayState, WayState>({
		id: "way-in",
		label: ["Way in", "连接方式"],
		title: [
			"Claude signs in; other agents use a key",
			"Claude 用登录；其他智能体用密钥",
		],
		predict: {
			prompt: [
				"You work in Claude Code and want it to query TradingFlow's live data. What do you need from TradingFlow?",
				"你在 Claude Code 中工作，想让它查询 TradingFlow 的实时数据。你需要从 TradingFlow 获得什么？",
			],
			choices: [
				{
					id: "signin",
					label: ["Just your sign-in: no API key", "只需登录：无需 API 密钥"],
				},
				{
					id: "key",
					label: [
						"An API key from Manage keys",
						"Manage keys 里的一把 API 密钥",
					],
				},
				{
					id: "none",
					label: ["Nothing works yet", "暂时都不行"],
				},
			],
			answer: "signin",
			revealAt: 1,
			explain: [
				"Claude, including Claude Code, signs in with your TradingFlow account and acts as that account. Cursor, Codex and OpenClaw are the agents that need an API key.",
				"Claude（包括 Claude Code）用你的 TradingFlow 账户登录，并以该账户身份操作。需要 API 密钥的是 Cursor、Codex 和 OpenClaw。",
			],
		},
		beats: [
			{
				id: "client",
				label: ["Your client", "你的客户端"],
				caption: [
					"You work in Claude Code and want it to query TradingFlow's live data.",
					"你在 Claude Code 中工作，想让它查询 TradingFlow 的实时数据。",
				],
				state: { client: "claudeCode", reveal: false },
			},
			{
				id: "signin",
				label: ["Sign in", "登录"],
				caption: [
					"Claude signs in with your TradingFlow account, so there's no key: register the server, then sign in.",
					"Claude 用你的 TradingFlow 账户登录，所以不需要密钥：先注册服务器，再登录。",
				],
				state: { client: "claudeCode", reveal: true },
			},
			{
				id: "key",
				label: ["API key", "API 密钥"],
				caption: [
					"Cursor, Codex and OpenClaw connect with an API key. Copy prompt creates one and puts it in the prompt you paste to your agent.",
					"Cursor、Codex 和 OpenClaw 通过 API 密钥连接。Copy prompt 会创建一把密钥，并把它放进你粘贴给智能体的提示里。",
				],
				state: { client: "cursor", reveal: true },
			},
		],
		explore: {
			prompt: ["Pick a client.", "选择一个客户端。"],
			start: () => ({ client: "chatgpt", reveal: true }),
			task: {
				kind: "reach",
				prompt: [
					"Find a client that connects with an API key rather than your sign-in.",
					"找出一个用 API 密钥、而不是用你的登录来连接的客户端。",
				],
				reached: (e) => CLIENTS[e.client].method === "key",
				done: [
					"Cursor, Codex and OpenClaw need an API key, which Copy prompt creates for you; Claude signs in as your account instead. Hosted chat sites can't connect yet.",
					"Cursor、Codex 和 OpenClaw 需要 API 密钥，Copy prompt 会为你创建；Claude 则直接用你的账户登录。网页版聊天应用暂时还不能连接。",
				],
			},
		},
		View: WayView,
	}),
	defineScene<ProveState, ProveState>({
		id: "prove",
		label: ["Prove it", "证明"],
		title: ["Don't take the agent's word for it", "不要只听智能体怎么说"],
		predict: {
			prompt: [
				'Your agent replies "Connected to TradingFlow, ready!" What proves your client can actually call TradingFlow\'s tools?',
				"你的智能体回复：“Connected to TradingFlow, ready!”什么才能证明你的客户端真的能调用 TradingFlow 的工具？",
			],
			choices: [
				{
					id: "client",
					label: [
						"Your client's own check, like /mcp listing its tools",
						"客户端自己的检查，比如 /mcp 列出它的工具",
					],
				},
				{
					id: "agent",
					label: [
						"The reply: the agent ran the setup itself",
						"这条回复：设置是智能体自己完成的",
					],
				},
				{
					id: "get",
					label: [
						"A plain request to the endpoint returning status ok",
						"对端点的普通请求返回 status ok",
					],
				},
			],
			answer: "client",
			revealAt: 1,
			explain: [
				"An agent can report success while nothing is registered, and a plain request only shows the endpoint is up. Your client's own check shows tradingflow registered with its tools.",
				"智能体可能报告成功，实际却什么都没注册；普通请求也只能说明端点在线。客户端自己的检查才会显示 tradingflow 已注册，并列出它的工具。",
			],
		},
		beats: [
			{
				id: "reply",
				label: ["The reply", "回复"],
				caption: [
					"You pasted the prompt, and your agent says it's connected.",
					"你粘贴了提示，智能体说它已经连上了。",
				],
				state: { stage: 0, keyWorks: true },
			},
			{
				id: "client",
				label: ["Client check", "客户端检查"],
				caption: [
					"Check it yourself instead: your client's own check lists tradingflow and its tools.",
					"改为自己检查：客户端自己的检查列出了 tradingflow 及其工具。",
				],
				state: { stage: 1, keyWorks: true },
			},
			{
				id: "server",
				label: ["Server", "服务器"],
				caption: [
					"Or ask the server: a plain request shows the endpoint is up, and tools/list with your key lists exactly the tools that key reaches.",
					"或者询问服务器：普通请求说明端点在线，带密钥的 tools/list 会列出这把密钥能用的全部工具。",
				],
				state: { stage: 2, keyWorks: true },
			},
		],
		explore: {
			prompt: ["Revoke the key and look again.", "撤销密钥，再看一次。"],
			start: () => ({ stage: 2, keyWorks: false }),
			task: {
				kind: "answer",
				prompt: [
					"With the key revoked, what does tools/list return?",
					"密钥被撤销后，tools/list 返回什么？",
				],
				choices: [
					{
						id: "error",
						label: ["HTTP 200 with an error object", "HTTP 200，附带错误对象"],
					},
					{ id: "tools", label: ["The same list of tools", "同样的工具列表"] },
					{
						id: "down",
						label: ["Nothing: the endpoint is down", "什么都没有：端点宕机了"],
					},
				],
				answer: "error",
				done: [
					"The endpoint is still up, so the status is 200, but the body carries an error instead of tools. Read the result, not just the status code, and look the code up in the reference.",
					"端点仍然在线，所以状态是 200，但响应里是错误而不是工具。要读结果本身，而不只是状态码，并到参考文档里查错误代码。",
				],
			},
		},
		View: ProveView,
	}),
	defineScene<KeyState, KeyState>({
		id: "limits",
		label: ["Limits", "限制"],
		title: ["A key reads data, within limits", "一把密钥只读数据，而且有限额"],
		predict: {
			prompt: [
				"You revoke the key your Cursor agent uses while it's in the middle of a task. When does it lose access?",
				"你的 Cursor 智能体正在执行任务时，你撤销了它使用的密钥。它什么时候失去访问权限？",
			],
			choices: [
				{
					id: "next",
					label: ["On its next tool call", "下一次工具调用时"],
				},
				{
					id: "restart",
					label: ["When the agent restarts", "智能体重启时"],
				},
				{
					id: "expiry",
					label: ["When the key would have expired", "密钥原本到期时"],
				},
			],
			answer: "next",
			revealAt: 2,
			explain: [
				"Access is re-checked on every call, not only when the key is created, so the next call fails. Your other keys keep working.",
				"访问权限在每次调用时都会重新检查，而不只是在创建密钥时，所以下一次调用就会失败。你的其他密钥照常可用。",
			],
		},
		beats: [
			{
				id: "read-only",
				label: ["Read-only", "只读"],
				caption: [
					"Every data tool is read-only. Recipe editing is a separate permission per key, off by default, and Claude's sign-in never includes it.",
					"所有数据工具都是只读的。编辑 Recipe 是按密钥单独授予的权限，默认关闭，Claude 的登录方式从不包含它。",
				],
				state: { calls: 12, revoked: false },
			},
			{
				id: "limit",
				label: ["Limit", "限额"],
				caption: [
					"A burst of tool calls meets the limit: 60 per key, or per Claude connection, in each 60-second window.",
					"一连串工具调用碰到了限额：每把密钥（或每个 Claude 连接）每 60 秒窗口 60 次。",
				],
				state: { calls: 75, revoked: false },
			},
			{
				id: "revoke",
				label: ["Revoke", "撤销"],
				caption: [
					"Revoke the key and its very next call is refused: access is checked on every call. Your other keys keep working.",
					"撤销密钥后，它的下一次调用就被拒绝：每次调用都会检查访问权限。你的其他密钥照常可用。",
				],
				state: { calls: 12, revoked: true },
			},
		],
		explore: {
			prompt: ["Change the calls and the key.", "改变调用次数和密钥状态。"],
			start: () => ({ calls: 60, revoked: false }),
			task: {
				kind: "reach",
				prompt: [
					"Find a state in which the next tool call goes through.",
					"找出下一次工具调用能够成功的状态。",
				],
				reached: (e) => e.calls < 60 && !e.revoked,
				done: [
					"Under 60 calls in the window and with an active key, the next call is allowed. A full window stops it until the window moves on; a revoked key stops it for good.",
					"窗口内调用少于 60 次且密钥有效时，下一次调用就会成功。窗口用满会暂停调用，直到窗口滚动；撤销密钥则永久停止。",
				],
			},
		},
		View: KeyView,
	}),
] as const;

export function ConnectAgentWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="connect-agent"
			label={[
				"Interactive lesson on connecting an AI agent",
				"连接 AI 智能体互动课",
			]}
			scenes={scenes}
		/>
	);
}
