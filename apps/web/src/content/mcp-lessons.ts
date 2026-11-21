/**
 * Lessons the Tradely MCP app can play inside an AI assistant (Claude, ChatGPT). Each has a film
 * and a playground, and none needs data from the server, so the assistant's sandboxed view can run
 * it without reaching tradely.ai.
 */
export const mcpLessonSlugs = [
	"what-options-are",
	"premium-payoff",
	"delta",
	"gamma-exposure",
	"implied-realized-volatility",
] as const;

export type McpLessonSlug = (typeof mcpLessonSlugs)[number];

export const isMcpLesson = (value: unknown): value is McpLessonSlug =>
	typeof value === "string" &&
	(mcpLessonSlugs as readonly string[]).includes(value);

export const lessonUrl = (slug: string) =>
	`https://www.tradely.ai/learn/${slug}`;
