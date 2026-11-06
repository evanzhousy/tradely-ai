import { z } from "zod";

import type { PostSnapshot, SavedPost } from "@/features/options-traders/model";
import {
	savedProfiles,
	savedSnapshot,
} from "@/features/options-traders/saved-data";
import {
	createNotionClient,
	createSnapshotFeed,
	fieldsQuery,
	plainText,
	richText,
	rowSchema,
	SourceUnavailable,
} from "./notion.server";

/** Newer saved posts from the Options Ideas database in Notion. A read takes many paged requests. */

/** Fixed IDs: nothing in a request can choose a database. */
const OPTIONS_IDEAS_SOURCE = "bd6a9f65-2208-43ad-b87d-babe8e0c2756";
const FRESHNESS_PAGE = "3f491446-9b98-81ce-a18c-f1bcd36518b0";

/** A 21-day window of about 80 rows a day takes around 17 pages. */
const READ_TIMEOUT_MS = 60_000;
/** The same window and author cap the saved snapshot uses, so both look alike. */
const WINDOW_DAYS = 21;
const MAX_POSTS_PER_AUTHOR = 3;

const timestamp = z.iso.datetime({ offset: true });
const metric = z.number().int().nonnegative().nullable();
const languageCode = z.string().regex(/^[a-z]{2,3}$/);

const savedPostSchema = z.object({
	id: z.string().regex(/^\d{15,25}$/),
	handle: z.string().regex(/^[a-zA-Z0-9_]{1,15}$/),
	url: z.url(),
	postedAt: timestamp,
	digestDate: z.iso.date().nullable(),
	capturedAt: timestamp.nullable(),
	metricsCapturedAt: timestamp.nullable(),
	text: z
		.string()
		.max(20_000)
		.refine((value) => value.trim().length > 0),
	language: languageCode,
	authorLanguages: z.array(languageCode).max(30),
	tickers: z.array(z.string().min(1).max(30)).max(30),
	structure: z.string().max(100),
	bias: z.string().max(50),
	views: metric,
	likes: metric,
	reposts: metric,
});

const sourceStateSchema = z.object({
	source_updated_at: timestamp.nullable(),
	last_attempted_at: timestamp.nullable(),
	coverage_through: timestamp.nullable(),
	source_status: z.enum([
		"unrecorded",
		"complete",
		"partial",
		"failed",
		"blocked",
	]),
});

const PROPERTY_TYPES: Record<string, string> = {
	"Post ID": "rich_text",
	"Author handle": "rich_text",
	"Post URL": "url",
	"Post text": "rich_text",
	"Posted at": "date",
	"Captured at": "date",
	"Metrics captured at": "date",
	Date: "date",
	Views: "number",
	Likes: "number",
	Reposts: "number",
	"Post language": "select",
	"Author languages": "multi_select",
	"Language evidence": "rich_text",
	Tickers: "multi_select",
	Structure: "select",
	Bias: "select",
};

const X_POST_URL =
	/^https:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]{1,15})\/status\/(\d{15,25})(?:\?[^#]*)?$/;

/** A post's base language, or `und` when the source has not recorded one. */
const baseLanguage = (value: string | null | undefined) =>
	value?.trim().toLowerCase().split("-")[0] || "und";

const toMinute = (time: number) => Math.floor(time / 60_000);

export type NotionRead = {
	posts: SavedPost[];
	sourceUpdatedAt: string;
	coverageThrough: string;
	from: string;
};

/** `request` and `now` can be replaced to exercise a read without a real token. */
export function createNotionReader(
	token: string,
	request: typeof fetch = fetch,
	now: () => number = Date.now,
) {
	return async (
		reviewedHandles: ReadonlySet<string>,
		signal: AbortSignal,
	): Promise<NotionRead> => {
		const { paginate } = createNotionClient(token, signal, request, now);

		/** Each value is the first paragraph under a root heading named for its field. */
		async function readSourceState() {
			const blocks = await paginate(
				`blocks/${FRESHNESS_PAGE}/children?page_size=100`,
			);
			const values: Record<string, string | null> = {};
			let field = "";
			for (const block of blocks) {
				const parsed = z.looseObject({ type: z.string() }).parse(block);
				const isHeading = parsed.type.startsWith("heading_");
				if (!isHeading && (parsed.type !== "paragraph" || !field)) continue;
				const text = richText
					.parse(
						z.object({ rich_text: z.unknown() }).parse(parsed[parsed.type])
							.rich_text,
					)
					.map((part) => part.plain_text)
					.join("")
					.trim();
				if (isHeading) {
					field = Object.hasOwn(sourceStateSchema.shape, text) ? text : "";
				} else if (field && text && !(field in values)) {
					values[field] = text === "unrecorded" ? null : text;
				}
			}
			// The status word itself is an enum that includes "unrecorded".
			if (values.source_status === null) values.source_status = "unrecorded";
			return sourceStateSchema.parse(values);
		}

		const before = await readSourceState();
		if (
			before.source_status !== "complete" ||
			!before.source_updated_at ||
			!before.coverage_through
		) {
			throw new SourceUnavailable(
				before.source_status === "failed" || before.source_status === "blocked"
					? "failed"
					: "partial",
				"source_not_complete",
			);
		}
		const sourceAt = Date.parse(before.source_updated_at);
		const through = Date.parse(before.coverage_through);
		if (
			sourceAt > now() + 60_000 ||
			through > sourceAt ||
			(before.last_attempted_at &&
				Date.parse(before.last_attempted_at) > sourceAt)
		) {
			throw new SourceUnavailable("partial", "invalid_source_times");
		}

		// Starts on a whole minute, as `Posted at` does, so the query and the check below agree on that minute's rows.
		const from = new Date(
			toMinute(through - WINDOW_DAYS * 24 * 60 * 60 * 1000) * 60_000,
		).toISOString();
		const rows = await paginate(
			`data_sources/${OPTIONS_IDEAS_SOURCE}/query?${fieldsQuery(Object.keys(PROPERTY_TYPES))}`,
			{
				page_size: 100,
				filter: {
					and: [
						{ property: "Posted at", date: { on_or_after: from } },
						{
							property: "Posted at",
							date: { on_or_before: before.coverage_through },
						},
					],
				},
				sorts: [{ property: "Posted at", direction: "descending" }],
			},
		);

		const posts = new Map<string, SavedPost>();
		let foundCoverage = false;
		for (const row of rows) {
			const page = rowSchema.parse(row);
			if (page.in_trash || page.archived || page.is_archived) continue;
			const p = page.properties;
			const postedAt = p["Posted at"]?.date?.start;
			// Notion keeps `Posted at` to the minute, while coverage records the post's exact second.
			if (postedAt && toMinute(Date.parse(postedAt)) === toMinute(through)) {
				foundCoverage = true;
			}
			const url = p["Post URL"]?.url;
			const match = url?.match(X_POST_URL);
			const declaredHandle = plainText(p["Author handle"])
				.trim()
				.replace(/^@/, "")
				.toLowerCase();
			const handle = declaredHandle || match?.[1]?.toLowerCase();
			if (!handle || !reviewedHandles.has(handle)) continue;

			for (const [name, type] of Object.entries(PROPERTY_TYPES)) {
				if (p[name] && p[name].type !== type) {
					throw new SourceUnavailable("partial", "source_schema_changed");
				}
			}
			if (!match || match[1]?.toLowerCase() !== handle) {
				throw new SourceUnavailable("partial", "invalid_post_identity");
			}
			const id = plainText(p["Post ID"]) || match[2];
			if (id !== match[2]) {
				throw new SourceUnavailable("partial", "invalid_post_identity");
			}
			const text = plainText(p["Post text"]);
			// A reply opens with the person it answers and rarely stands alone as an example.
			if (text.trimStart().startsWith("@")) continue;

			const capturedAt = p["Captured at"]?.date?.start ?? null;
			const metricsCapturedAt = p["Metrics captured at"]?.date?.start ?? null;
			if (
				!capturedAt ||
				!timestamp.safeParse(capturedAt).success ||
				Date.parse(capturedAt) > sourceAt ||
				(metricsCapturedAt &&
					(!timestamp.safeParse(metricsCapturedAt).success ||
						Date.parse(metricsCapturedAt) > sourceAt))
			) {
				throw new SourceUnavailable("partial", "unverified_capture");
			}
			const evidence = plainText(p["Language evidence"]);
			const post = savedPostSchema.parse({
				id,
				handle,
				url: `https://x.com/${handle}/status/${id}`,
				postedAt,
				digestDate: p.Date?.date?.start?.slice(0, 10) ?? null,
				capturedAt,
				metricsCapturedAt,
				text,
				language: baseLanguage(p["Post language"]?.select?.name),
				// Unknown stays empty: an author's language needs recorded evidence.
				authorLanguages: evidence
					? (p["Author languages"]?.multi_select ?? [])
							.map((option) => baseLanguage(option.name))
							.filter((code) => code !== "und")
					: [],
				tickers: p.Tickers?.multi_select?.map((option) => option.name) ?? [],
				structure: p.Structure?.select?.name ?? "",
				bias: p.Bias?.select?.name ?? "",
				views: p.Views?.number ?? null,
				likes: p.Likes?.number ?? null,
				reposts: p.Reposts?.number ?? null,
			});
			const posted = Date.parse(post.postedAt);
			if (
				posted < Date.parse(from) ||
				posted > through ||
				posted > Date.parse(capturedAt)
			) {
				throw new SourceUnavailable("partial", "invalid_post_times");
			}
			if (metricsCapturedAt && Date.parse(metricsCapturedAt) < posted) {
				throw new SourceUnavailable("partial", "invalid_metric_time");
			}
			const existing = posts.get(id);
			if (existing && JSON.stringify(existing) !== JSON.stringify(post)) {
				throw new SourceUnavailable("partial", "conflicting_duplicate");
			}
			posts.set(id, post);
		}
		if (!foundCoverage) {
			throw new SourceUnavailable("partial", "missing_coverage_post");
		}
		const after = await readSourceState();
		if (JSON.stringify(before) !== JSON.stringify(after)) {
			throw new SourceUnavailable("partial", "source_changed_during_read");
		}
		return {
			posts: [...posts.values()],
			sourceUpdatedAt: before.source_updated_at,
			coverageThrough: before.coverage_through,
			from,
		};
	};
}

/**
 * Notion adds newer posts to the saved snapshot rather than replacing it: the snapshot also holds
 * posts found outside the digest and metrics measured later. A saved value records only its date,
 * so a live one replaces it only from a later day.
 */
export function mergeLivePosts(
	saved: readonly SavedPost[],
	live: readonly SavedPost[],
): SavedPost[] {
	const byId = new Map(saved.map((post) => [post.id, post]));
	for (const post of live) {
		const current = byId.get(post.id);
		if (
			!current ||
			(post.metricsCapturedAt ?? "").slice(0, 10) >
				(current.metricsCapturedAt ?? "").slice(0, 10)
		) {
			byId.set(post.id, post);
		}
	}
	const perAuthor = new Map<string, number>();
	return [...byId.values()]
		.sort(
			(a, b) => (b.views ?? -1) - (a.views ?? -1) || a.id.localeCompare(b.id),
		)
		.filter((post) => {
			const key = post.handle.toLowerCase();
			const seen = perAuthor.get(key) ?? 0;
			perAuthor.set(key, seen + 1);
			return seen < MAX_POSTS_PER_AUTHOR;
		});
}

export function buildLiveSnapshot(
	saved: PostSnapshot,
	read: NotionRead,
	syncedAt: string,
): PostSnapshot {
	const posts = mergeLivePosts(saved.posts, read.posts);
	return {
		version: 1,
		digestWindow: {
			from:
				saved.digestWindow.from < read.from.slice(0, 10)
					? saved.digestWindow.from
					: read.from.slice(0, 10),
			to: read.coverageThrough.slice(0, 10),
		},
		freshness: {
			dataSyncedAt: syncedAt,
			sourceUpdatedAt: read.sourceUpdatedAt,
			lastAttemptedAt: syncedAt,
			status: "success",
		},
		posts,
	};
}

const reviewedHandles = new Set(
	savedProfiles
		.filter((profile) => profile.platform === "x.com")
		.map((profile) => profile.handle.toLowerCase()),
);

export const optionsTradersFeedResponse = createSnapshotFeed({
	name: "Options traders",
	saved: savedSnapshot,
	refresh: async (token, lastGood, attemptedAt) => {
		const read = await createNotionReader(token)(
			reviewedHandles,
			AbortSignal.timeout(READ_TIMEOUT_MS),
		);
		const known = lastGood.freshness.sourceUpdatedAt;
		if (known && Date.parse(read.sourceUpdatedAt) < Date.parse(known)) {
			throw new SourceUnavailable("partial", "source_regressed");
		}
		return buildLiveSnapshot(lastGood, read, attemptedAt);
	},
});
