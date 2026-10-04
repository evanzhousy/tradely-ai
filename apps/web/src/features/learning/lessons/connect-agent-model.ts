import type { Copy } from "@/content/world";

/** The clients, endpoint and limits the connect-agent lesson teaches with, shared by its film and its playground. */

export const ENDPOINT = "https://app.tradingflow.com/api/mcp";

export type Method = "signin" | "key" | "none";
export type ClientId =
	| "claudeCode"
	| "claudeApp"
	| "cursor"
	| "codex"
	| "chatgpt";

export const CLIENTS: Record<ClientId, { label: string; method: Method }> = {
	claudeCode: { label: "Claude Code", method: "signin" },
	claudeApp: { label: "claude.ai", method: "signin" },
	cursor: { label: "Cursor", method: "key" },
	codex: { label: "Codex", method: "key" },
	chatgpt: { label: "ChatGPT", method: "none" },
};
export const CLIENT_IDS = Object.keys(CLIENTS) as ClientId[];

export const GROUPS: readonly {
	method: Method;
	title: Copy;
	members: string;
}[] = [
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

/** Tool calls per key, or per Claude connection, in each 60-second window. */
export const LIMIT = 60;
