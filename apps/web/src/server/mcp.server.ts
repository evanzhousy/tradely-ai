import { createHash } from "node:crypto";
import {
	RESOURCE_MIME_TYPE,
	registerAppResource,
	registerAppTool,
} from "@modelcontextprotocol/ext-apps/server";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import {
	isMcpLesson,
	lessonUrl,
	type McpLessonSlug,
	mcpLessonSlugs,
} from "@/content/mcp-lessons";
import { syllabus } from "@/content/syllabus";
// Built by `pnpm --filter web mcp-app:build` (part of `build`): the lesson view as one HTML file.
import viewerHtml from "../../mcp-app/dist/index.html?raw";

/**
 * Tradely's MCP server for AI assistants (Claude, ChatGPT and other MCP clients). Read-only, no
 * sign-in: it lists the free course and shows five lessons' films and practice inside the
 * conversation through MCP Apps. Hosts without MCP Apps get the same lesson as text and a link.
 */

/** Hosts cache a view by its URI, so a changed view gets a new one. */
const VIEWER_URI = `ui://tradely/lesson-viewer-${createHash("sha256").update(viewerHtml).digest("hex").slice(0, 12)}.html`;
const COURSE_URL = "https://www.tradely.ai/courses/tradingflow-foundations";
const NOT_ADVICE = {
	en: "Educational only, not investment advice.",
	zh: "仅供学习，不构成投资建议。",
} as const;

type Locale = "en" | "zh";
const localeSchema = z
	.enum(["en", "zh"])
	.optional()
	.describe("Lesson language: en for English, zh for Simplified Chinese.");

const lessons = syllabus.filter((entry) => entry.kind !== "checkpoint");

const titleOf = (slug: string, locale: Locale) => {
	const entry = lessons.find((item) => item.id === slug);
	if (!entry) return slug;
	return locale === "zh" ? entry.titleZh : entry.title;
};
const summaryOf = (slug: string, locale: Locale) => {
	const entry = lessons.find((item) => item.id === slug);
	if (!entry) return "";
	return locale === "zh" ? entry.summaryZh : entry.summary;
};

/** One line per call in the function log: which tool and lesson, never the user's words. */
function logToolCall(tool: string, fields: Record<string, string>) {
	console.info(JSON.stringify({ event: "mcp_tool_called", tool, ...fields }));
}

const readOnly = {
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: false,
} as const;

export function createTradelyMcpServer() {
	const server = new McpServer(
		{ name: "tradely", title: "Tradely", version: "1.0.0" },
		{
			instructions:
				"Tradely is a free, visual options course. When someone wants to learn an options concept that show_lesson covers, call show_lesson to play that lesson's film and practice in the conversation. For other concepts, call list_lessons and point to the matching lesson's link. Lessons are educational, not investment advice.",
		},
	);

	server.registerTool(
		"list_lessons",
		{
			title: "List Tradely lessons",
			description:
				"List every lesson in Tradely's free options course, in order, with its title, a one-line summary and its link. Lessons marked [interactive] can be played in the conversation with show_lesson.",
			inputSchema: z.object({ locale: localeSchema }),
			annotations: { ...readOnly, title: "List Tradely lessons" },
		},
		async ({ locale = "en" }) => {
			logToolCall("list_lessons", { locale });
			const lines = lessons.map((entry) => {
				const mark = isMcpLesson(entry.id) ? " [interactive]" : "";
				return `- ${titleOf(entry.id, locale)}${mark} (${entry.id}): ${summaryOf(entry.id, locale)} ${lessonUrl(entry.id)}`;
			});
			return {
				content: [
					{
						type: "text",
						text: [
							locale === "zh"
								? `Tradely 免费期权课程（${lessons.length} 节课）：${COURSE_URL}`
								: `Tradely's free options course (${lessons.length} lessons): ${COURSE_URL}`,
							...lines,
							NOT_ADVICE[locale],
						].join("\n"),
					},
				],
			};
		},
	);

	registerAppTool(
		server,
		"show_lesson",
		{
			title: "Show a Tradely lesson",
			description:
				"Play an interactive Tradely lesson in the conversation: a short animated film with worked numbers, then a practice task. Use it when someone wants to learn or see one of these options concepts: what calls and puts are (what-options-are); premium, payoff and profit (premium-payoff); delta (delta); gamma exposure or GEX (gamma-exposure); implied versus realized volatility (implied-realized-volatility). Educational only, not investment advice.",
			inputSchema: z.object({
				lesson: z
					.enum(mcpLessonSlugs)
					.describe("The lesson to play, by its slug."),
				locale: localeSchema,
			}),
			annotations: { ...readOnly, title: "Show a Tradely lesson" },
			_meta: { ui: { resourceUri: VIEWER_URI } },
		},
		async ({ lesson, locale: requested }) => {
			// Without a requested language the view follows the host's; the text falls back to English.
			const locale = requested ?? "en";
			logToolCall("show_lesson", { lesson, locale: requested ?? "host" });
			const slug: McpLessonSlug = lesson;
			const title = titleOf(slug, locale);
			const url = lessonUrl(slug);
			return {
				content: [
					{
						type: "text",
						text: [
							`${locale === "zh" ? "Tradely 课程" : "Tradely lesson"}: ${title}`,
							summaryOf(slug, locale),
							locale === "zh"
								? `完整课程（含笔记与练习）：${url}`
								: `Full lesson with notes and practice: ${url}`,
							NOT_ADVICE[locale],
						].join("\n"),
					},
				],
				structuredContent: {
					lesson: slug,
					...(requested ? { locale: requested } : {}),
					title,
					url,
				},
			};
		},
	);

	registerAppResource(
		server,
		"Tradely lesson",
		VIEWER_URI,
		{
			description:
				"A Tradely lesson's animated film and practice task, playable in the conversation.",
		},
		async () => ({
			contents: [
				{
					uri: VIEWER_URI,
					mimeType: RESOURCE_MIME_TYPE,
					text: viewerHtml,
					// Everything is inlined, so the view needs no outside origin.
					_meta: { ui: { prefersBorder: true } },
				},
			],
		}),
	);

	return server;
}

const handler = createMcpHandler(createTradelyMcpServer);

export function handleMcpRequest(request: Request) {
	return handler.fetch(request);
}
