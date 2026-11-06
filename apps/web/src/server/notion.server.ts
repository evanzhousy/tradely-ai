import { env } from "@tradely/env/server";
import { z } from "zod";

import type { SnapshotFreshness } from "@/features/options-traders/model";

/**
 * Reads Notion through the read-only integration and serves the result as a CDN-cached feed.
 *
 * A page renders its saved snapshot, then asks its feed once, so a slow read never delays it. A read
 * either passes every check or changes nothing: a reader sees the last good data and an honest status.
 */

/** Fixed official origin: nothing in a request can choose a URL. */
const NOTION_ORIGIN = "https://api.notion.com/v1";
const NOTION_VERSION = "2026-03-11";

/** Notion allows about three requests per second; this keeps a read under that. */
const REQUEST_SPACING_MS = 350;
const MAX_ROWS = 5_000;
/** Between reads, so a CDN miss on every region or a burst of visitors shares one read. */
const READ_COOLDOWN_MS = 60_000;

const FRESH_CACHE =
	"public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";
/** Failures are cached briefly too, so visitors cannot multiply retries against Notion. */
const DELAYED_CACHE = "public, max-age=0, s-maxage=300";

type Health = "partial" | "failed";

export class SourceUnavailable extends Error {
	constructor(
		readonly health: Health,
		readonly code: string,
		readonly retryAfterMs = 0,
	) {
		super(code);
	}
}

export const richText = z.array(z.object({ plain_text: z.string() }));
const propertySchema = z.object({
	type: z.string(),
	title: richText.optional(),
	rich_text: richText.optional(),
	url: z.string().nullable().optional(),
	number: z.number().nullable().optional(),
	checkbox: z.boolean().optional(),
	date: z.object({ start: z.string() }).nullable().optional(),
	select: z.object({ name: z.string() }).nullable().optional(),
	multi_select: z.array(z.object({ name: z.string() })).optional(),
});
type NotionProperty = z.infer<typeof propertySchema>;

export const rowSchema = z.object({
	object: z.literal("page"),
	properties: z.record(z.string(), propertySchema),
	in_trash: z.boolean().optional(),
	is_archived: z.boolean().optional(),
	archived: z.boolean().optional(),
});
const listSchema = z.object({
	results: z.array(z.unknown()),
	has_more: z.boolean(),
	next_cursor: z.string().nullable(),
	request_status: z.object({ type: z.string() }).optional(),
});

export const plainText = (property: NotionProperty | undefined) =>
	(property?.rich_text ?? property?.title)
		?.map((part) => part.plain_text)
		.join("") ?? "";

/** `request` and `now` can be replaced to exercise a read without a real token. */
export function createNotionClient(
	token: string,
	signal: AbortSignal,
	request: typeof fetch = fetch,
	now: () => number = Date.now,
) {
	let lastRequestAt = 0;

	async function api(path: string, body?: object): Promise<unknown> {
		const wait = Math.max(0, lastRequestAt + REQUEST_SPACING_MS - now());
		if (wait > 0) {
			await new Promise((resolve) => setTimeout(resolve, wait));
		}
		signal.throwIfAborted();
		lastRequestAt = now();
		const response = await request(`${NOTION_ORIGIN}/${path}`, {
			method: body ? "POST" : "GET",
			redirect: "error",
			signal,
			headers: {
				Authorization: `Bearer ${token}`,
				"Notion-Version": NOTION_VERSION,
				"Content-Type": "application/json",
			},
			...(body ? { body: JSON.stringify(body) } : {}),
		});
		if (!response.ok) {
			const retryAfter = Number(response.headers.get("retry-after"));
			throw new SourceUnavailable(
				"failed",
				response.status === 429 ? "rate_limited" : "notion_unavailable",
				Number.isFinite(retryAfter) ? retryAfter * 1000 : 0,
			);
		}
		return response.json();
	}

	async function paginate(path: string, body?: object): Promise<unknown[]> {
		const rows: unknown[] = [];
		const seen = new Set<string>();
		let cursor: string | null = null;
		while (true) {
			const suffix =
				!body && cursor ? `&start_cursor=${encodeURIComponent(cursor)}` : "";
			const page = listSchema.parse(
				await api(
					`${path}${suffix}`,
					body
						? { ...body, ...(cursor ? { start_cursor: cursor } : {}) }
						: undefined,
				),
			);
			// Notion marks a result it capped; without this it looks complete.
			if (page.request_status?.type === "incomplete") {
				throw new SourceUnavailable("partial", "truncated_query");
			}
			rows.push(...page.results);
			if (rows.length > MAX_ROWS) {
				throw new SourceUnavailable("partial", "query_too_large");
			}
			if (!page.has_more) return rows;
			cursor = page.next_cursor;
			if (!cursor || seen.has(cursor)) {
				throw new SourceUnavailable("partial", "invalid_pagination");
			}
			seen.add(cursor);
		}
	}

	return { paginate };
}

/** The `filter_properties` query string, so a read asks only for the fields it uses. */
export const fieldsQuery = (names: readonly string[]) =>
	names
		.map((name) => `filter_properties=${encodeURIComponent(name)}`)
		.join("&");

/**
 * One feed per saved snapshot. `refresh` builds the next snapshot, or throws to keep the last good
 * one. Without a token the saved snapshot is final: 204 tells the page there is nothing to ask for.
 */
export function createSnapshotFeed<
	Snapshot extends { freshness: SnapshotFreshness },
>({
	name,
	saved,
	refresh,
}: {
	name: string;
	saved: Snapshot;
	refresh: (
		token: string,
		lastGood: Snapshot,
		attemptedAt: string,
	) => Promise<Snapshot>;
}) {
	type FeedResult = { snapshot: Snapshot; fresh: boolean };

	let lastGood = saved;
	let latest: FeedResult = { snapshot: saved, fresh: false };
	let pending: Promise<FeedResult> | undefined;
	let nextReadAt = 0;

	async function read(token: string): Promise<FeedResult> {
		const attemptedAt = new Date().toISOString();
		let cooldown = READ_COOLDOWN_MS;
		try {
			lastGood = await refresh(token, lastGood, attemptedAt);
			latest = { snapshot: lastGood, fresh: true };
		} catch (error) {
			const unavailable =
				error instanceof SourceUnavailable ? error : undefined;
			const invalid = error instanceof z.ZodError;
			cooldown = Math.max(cooldown, unavailable?.retryAfterMs ?? 0);
			const code =
				unavailable?.code ?? (invalid ? "invalid_source" : "read_failed");
			console.error(`${name} feed kept its last good data: ${code}`);
			latest = {
				fresh: false,
				snapshot: {
					...lastGood,
					freshness: {
						...lastGood.freshness,
						status: unavailable?.health ?? (invalid ? "partial" : "failed"),
						lastAttemptedAt: attemptedAt,
					},
				},
			};
		}
		nextReadAt = Date.now() + cooldown;
		return latest;
	}

	return async function feedResponse(): Promise<Response> {
		const token = env.NOTION_API_TOKEN;
		if (!token) {
			return new Response(null, {
				status: 204,
				headers: { "Cache-Control": DELAYED_CACHE },
			});
		}
		if (!pending && Date.now() >= nextReadAt) {
			pending = read(token).finally(() => {
				pending = undefined;
			});
		}
		const { snapshot, fresh } = pending ? await pending : latest;
		return Response.json(snapshot, {
			headers: { "Cache-Control": fresh ? FRESH_CACHE : DELAYED_CACHE },
		});
	};
}
