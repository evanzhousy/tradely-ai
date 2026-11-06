import { z } from "zod";

import savedPosts from "@/features/options-traders/data/reddit-posts.json";
import type {
	RedditPost,
	RedditSnapshot,
} from "@/features/options-traders/reddit-model";
import {
	createNotionClient,
	createSnapshotFeed,
	fieldsQuery,
	plainText,
	rowSchema,
	SourceUnavailable,
} from "./notion.server";

/**
 * The Reddit Options Posts database in Notion. People edit it by hand, so one unfinished or mistyped
 * row stays off the page instead of failing the read. A changed column still fails it, because then
 * every row would look unfinished and the whole list would vanish.
 */

/** Fixed ID: nothing in a request can choose a database. */
const REDDIT_POSTS_SOURCE = "965dc912-5e20-4127-9a85-2c321e2c11ca";
const READ_TIMEOUT_MS = 30_000;
/** More than a reader will scroll, and it keeps the feed small. */
const MAX_POSTS = 200;

const PROPERTY_TYPES: Record<string, string> = {
	Title: "title",
	"Post URL": "url",
	Subreddit: "select",
	Author: "rich_text",
	"Posted at": "date",
	Score: "number",
	Comments: "number",
	"Metrics captured at": "date",
	Summary: "rich_text",
	Tickers: "multi_select",
	Structure: "select",
	Hidden: "checkbox",
};

const REDDIT_POST_URL =
	/^https:\/\/(?:www\.|old\.|new\.)?reddit\.com\/r\/([A-Za-z0-9_]{2,21})\/comments\/([a-z0-9]{3,12})(?:\/[^?#]*)?(?:[?#].*)?$/;

const moment = z.union([z.iso.datetime({ offset: true }), z.iso.date()]);
const metric = z.number().int().nonnegative().nullable();

/** Rejects a deleted author (`[deleted]`) along with anything else Reddit would not accept as a name. */
const postSchema = z.object({
	id: z.string(),
	url: z.url(),
	subreddit: z.string(),
	author: z.string().regex(/^[A-Za-z0-9_-]{3,20}$/),
	title: z.string().trim().min(1).max(300),
	summary: z.string().trim().min(1).max(500),
	postedAt: moment,
	score: metric,
	comments: metric,
	metricsCapturedAt: moment.nullable(),
	tickers: z.array(z.string().min(1).max(30)).max(30),
	structure: z.string().max(100),
});

/** The row as a public post, or null while it is unfinished or does not add up. */
function toPost(row: unknown, now: number): RedditPost | null {
	const page = rowSchema.parse(row);
	if (page.in_trash || page.archived || page.is_archived) return null;
	const p = page.properties;
	for (const [name, type] of Object.entries(PROPERTY_TYPES)) {
		if (p[name]?.type !== type) {
			throw new SourceUnavailable("partial", "source_schema_changed");
		}
	}
	if (p.Hidden?.checkbox) return null;

	const match = p["Post URL"]?.url?.match(REDDIT_POST_URL);
	const subreddit = p.Subreddit?.select?.name;
	if (!match?.[1] || !match[2]) return null;
	if (match[1].toLowerCase() !== subreddit?.toLowerCase()) return null;

	const parsed = postSchema.safeParse({
		id: match[2],
		// One canonical link: no tracking parameters, and never a mirror of the site.
		url: `https://www.reddit.com/r/${match[1]}/comments/${match[2]}/`,
		subreddit,
		author: plainText(p.Author).trim().replace(/^u\//, ""),
		title: plainText(p.Title),
		summary: plainText(p.Summary),
		postedAt: p["Posted at"]?.date?.start,
		score: p.Score?.number ?? null,
		comments: p.Comments?.number ?? null,
		metricsCapturedAt: p["Metrics captured at"]?.date?.start ?? null,
		tickers: p.Tickers?.multi_select?.map((option) => option.name) ?? [],
		structure: p.Structure?.select?.name ?? "",
	});
	if (!parsed.success) return null;
	const post = parsed.data;

	const posted = Date.parse(post.postedAt);
	if (posted > now) return null;
	// A number needs the date it was read, and that date can't precede the post.
	const read = post.metricsCapturedAt && Date.parse(post.metricsCapturedAt);
	if ((post.score !== null || post.comments !== null) && !read) return null;
	if (read && (read > now || toDay(read) < toDay(posted))) return null;
	return post;
}

const toDay = (time: number) => Math.floor(time / 86_400_000);

/** `request` and `now` can be replaced to exercise a read without a real token. */
export function createRedditReader(
	token: string,
	request: typeof fetch = fetch,
	now: () => number = Date.now,
) {
	return async (signal: AbortSignal) => {
		const { paginate } = createNotionClient(token, signal, request, now);
		const rows = await paginate(
			`data_sources/${REDDIT_POSTS_SOURCE}/query?${fieldsQuery(Object.keys(PROPERTY_TYPES))}`,
			{
				page_size: 100,
				filter: { property: "Hidden", checkbox: { equals: false } },
				sorts: [{ property: "Score", direction: "descending" }],
			},
		);
		const posts = new Map<string, RedditPost>();
		for (const row of rows) {
			const post = toPost(row, now());
			if (post && !posts.has(post.id)) posts.set(post.id, post);
		}
		return { posts: [...posts.values()], skipped: rows.length - posts.size };
	};
}

/**
 * Notion is the only record here, so a read replaces the snapshot: hiding a row takes the post off
 * the page. The X feed merges instead because its snapshot also holds posts found outside Notion.
 */
export const redditOptionsFeedResponse = createSnapshotFeed({
	name: "Reddit options",
	saved: savedPosts as RedditSnapshot,
	refresh: async (token, _lastGood, attemptedAt) => {
		const { posts, skipped } = await createRedditReader(token)(
			AbortSignal.timeout(READ_TIMEOUT_MS),
		);
		if (skipped > 0) {
			console.warn(`Reddit options feed left out ${skipped} unfinished rows`);
		}
		return {
			version: 1 as const,
			freshness: {
				dataSyncedAt: attemptedAt,
				sourceUpdatedAt: null,
				lastAttemptedAt: attemptedAt,
				status: "success",
			},
			posts: posts.slice(0, MAX_POSTS),
		};
	},
});
