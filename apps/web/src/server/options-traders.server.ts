import { z } from "zod";

import {
	type LiveSnapshot,
	PLATFORMS,
	type PostSnapshot,
	type SavedPost,
	type TraderPlatform,
	type TraderProfile,
} from "@/features/options-traders/model";
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

/**
 * Newer saved posts from the Options Ideas database in Notion, for the traders listed in the
 * Options Traders database. A read takes many paged requests.
 */

/** Fixed IDs: nothing in a request can choose a database. */
const OPTIONS_IDEAS_SOURCE = "bd6a9f65-2208-43ad-b87d-babe8e0c2756";
const FRESHNESS_PAGE = "3f491446-9b98-81ce-a18c-f1bcd36518b0";
const OPTIONS_TRADERS_SOURCE = "41891446-9b98-811c-9e45-000b4fb5fe3b";

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
			const linkedHandle = match?.[1]?.toLowerCase();
			// A row that names one account but links another cannot be attributed. Leaving it out keeps
			// one producer typo from failing every read once that trader is listed in Notion.
			if (declaredHandle && linkedHandle && declaredHandle !== linkedHandle) {
				continue;
			}
			const handle = declaredHandle || linkedHandle;
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

const ROSTER_PROPERTY_TYPES: Record<string, string> = {
	Handle: "title",
	Platform: "select",
	Name: "rich_text",
	Type: "select",
	Description: "rich_text",
	Focus: "multi_select",
	Cadence: "select",
	Activity: "select",
	Followers: "number",
	"Followers as of": "date",
	"Profile URL": "url",
	Languages: "multi_select",
	Rank: "number",
	"Show on Tradely": "checkbox",
};

/** A profile link is derived from its handle, so a typo in either shows up as a mismatch. */
const PROFILE_URLS: Record<TraderPlatform, (handle: string) => string> = {
	"x.com": (handle) => `https://x.com/${handle}`,
	"youtube.com": (handle) => `https://www.youtube.com/@${handle}`,
	"reddit.com": (handle) => `https://www.reddit.com/user/${handle}/`,
};
const HANDLES: Record<TraderPlatform, RegExp> = {
	"x.com": /^[a-zA-Z0-9_]{1,15}$/,
	"youtube.com": /^[a-zA-Z0-9_.-]{3,30}$/,
	"reddit.com": /^[a-zA-Z0-9_-]{3,20}$/,
};
const TOP_RANKS = 30;
/** Fewer listed X traders than this reads as a broken filter, not an edit. */
const MIN_LISTED_ON_X = 10;

const profileSchema = z.object({
	platform: z.enum(["x.com", "youtube.com", "reddit.com"]),
	handle: z.string(),
	name: z.string().trim().min(1).max(100),
	type: z.enum(["individual", "institutional"]),
	description: z.string().trim().min(1).max(400),
	focus: z.array(z.string().min(1).max(40)).max(12),
	cadence: z.string().min(1).max(40).nullable(),
	activity: z.string().min(1).max(40),
	followers: z.number().int().nonnegative().nullable(),
	followersAsOf: z.union([z.iso.date(), z.literal("")]),
	profileUrl: z.url(),
	avatar: z.string().nullable(),
	languages: z.array(languageCode).max(30),
	rank: z.number().int().min(1).max(TOP_RANKS).optional(),
});

const profileKey = (profile: Pick<TraderProfile, "platform" | "handle">) =>
	`${profile.platform}:${profile.handle.toLowerCase()}`;

/** Avatars are image files in this repository, written by the sync script. */
const savedAvatars = new Map(
	savedProfiles.map((profile) => [profileKey(profile), profile.avatar]),
);

/**
 * The listed traders from the Options Traders database. A row that fails a check is left out and
 * named in the log; a schema change or a near-empty list fails the whole read.
 */
export function createRosterReader(
	token: string,
	request: typeof fetch = fetch,
	now: () => number = Date.now,
) {
	return async (signal: AbortSignal): Promise<TraderProfile[]> => {
		const { paginate } = createNotionClient(token, signal, request, now);
		const rows = await paginate(
			`data_sources/${OPTIONS_TRADERS_SOURCE}/query?${fieldsQuery(Object.keys(ROSTER_PROPERTY_TYPES))}`,
			{
				page_size: 100,
				filter: { property: "Show on Tradely", checkbox: { equals: true } },
			},
		);
		const profiles = new Map<string, TraderProfile>();
		const ranked = new Set<number>();
		const skipped: string[] = [];
		for (const row of rows) {
			const page = rowSchema.parse(row);
			if (page.in_trash || page.archived || page.is_archived) continue;
			const p = page.properties;
			for (const [name, type] of Object.entries(ROSTER_PROPERTY_TYPES)) {
				if (p[name]?.type !== type) {
					throw new SourceUnavailable("partial", "roster_schema_changed");
				}
			}
			if (p["Show on Tradely"]?.checkbox !== true) continue;
			const handle = plainText(p.Handle).trim();
			const platform = p.Platform?.select?.name as TraderPlatform | undefined;
			const profileUrl = p["Profile URL"]?.url ?? "";
			if (
				!platform ||
				!Object.hasOwn(HANDLES, platform) ||
				!HANDLES[platform].test(handle) ||
				profileUrl.toLowerCase() !==
					PROFILE_URLS[platform](handle).toLowerCase()
			) {
				skipped.push(handle || "(no handle)");
				continue;
			}
			// A rank that is out of range, off X or taken is dropped, not the trader.
			const rankValue = p.Rank?.number;
			const rank =
				platform === "x.com" &&
				typeof rankValue === "number" &&
				Number.isInteger(rankValue) &&
				rankValue >= 1 &&
				rankValue <= TOP_RANKS &&
				!ranked.has(rankValue)
					? rankValue
					: undefined;
			const parsed = profileSchema.safeParse({
				platform,
				handle,
				name: plainText(p.Name),
				type: p.Type?.select?.name,
				description: plainText(p.Description),
				focus: p.Focus?.multi_select?.map((option) => option.name) ?? [],
				cadence: p.Cadence?.select?.name ?? null,
				activity: p.Activity?.select?.name ?? "Unknown",
				followers: p.Followers?.number ?? null,
				followersAsOf: p["Followers as of"]?.date?.start.slice(0, 10) ?? "",
				profileUrl,
				avatar: null,
				languages: [
					...new Set(
						(p.Languages?.multi_select ?? [])
							.map((option) => baseLanguage(option.name))
							.filter((code) => code !== "und"),
					),
				],
				...(rank === undefined ? {} : { rank }),
			});
			const key = `${platform}:${handle.toLowerCase()}`;
			if (!parsed.success || profiles.has(key)) {
				skipped.push(handle);
				continue;
			}
			if (rank !== undefined) ranked.add(rank);
			profiles.set(key, {
				...parsed.data,
				avatar: savedAvatars.get(key) ?? null,
			});
		}
		if (skipped.length > 0) {
			console.error(`Options traders roster left out: ${skipped.join(", ")}`);
		}
		const listed = [...profiles.values()];
		if (
			listed.filter((profile) => profile.platform === "x.com").length <
			MIN_LISTED_ON_X
		) {
			throw new SourceUnavailable("partial", "roster_too_small");
		}
		const platformOrder = (profile: TraderProfile) =>
			PLATFORMS.findIndex((item) => item.id === profile.platform);
		return listed.sort(
			(a, b) =>
				(a.rank ?? TOP_RANKS + 1) - (b.rank ?? TOP_RANKS + 1) ||
				platformOrder(a) - platformOrder(b) ||
				(b.followers ?? -1) - (a.followers ?? -1) ||
				a.handle.localeCompare(b.handle),
		);
	};
}

const reviewedHandlesOf = (profiles: readonly TraderProfile[]) =>
	new Set(
		profiles
			.filter((profile) => profile.platform === "x.com")
			.map((profile) => profile.handle.toLowerCase()),
	);

/** Posts are the page's main content, so a failed roster read falls back to the saved list. */
async function readRoster(token: string, signal: AbortSignal) {
	try {
		return await createRosterReader(token)(signal);
	} catch (error) {
		const code =
			error instanceof SourceUnavailable
				? error.code
				: error instanceof z.ZodError
					? "invalid_roster"
					: "roster_read_failed";
		console.error(`Options traders roster kept the saved list: ${code}`);
		return undefined;
	}
}

export const optionsTradersFeedResponse = createSnapshotFeed<LiveSnapshot>({
	name: "Options traders",
	saved: savedSnapshot,
	refresh: async (token, lastGood, attemptedAt) => {
		const signal = AbortSignal.timeout(READ_TIMEOUT_MS);
		const roster = await readRoster(token, signal);
		const read = await createNotionReader(token)(
			reviewedHandlesOf(roster ?? savedProfiles),
			signal,
		);
		const known = lastGood.freshness.sourceUpdatedAt;
		if (known && Date.parse(read.sourceUpdatedAt) < Date.parse(known)) {
			throw new SourceUnavailable("partial", "source_regressed");
		}
		const snapshot = buildLiveSnapshot(lastGood, read, attemptedAt);
		return roster ? { ...snapshot, profiles: roster } : snapshot;
	},
});
