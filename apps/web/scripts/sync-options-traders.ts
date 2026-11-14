/**
 * Rebuilds the saved options-trader snapshot from Tradely's own feed, which reads Notion: posts
 * from Options Ideas and the listed traders from Options Traders. X numbers are then re-read from
 * FxTwitter's public mirror of X, which needs no login.
 *
 *   pnpm --filter web options-traders:sync [--feed <url or JSON file>]
 *
 * Nothing is written if the feed did not read both the posts and the trader list from Notion in
 * the last two hours, or if the mirror answers for fewer than half the traders or posts. A number
 * it cannot read keeps its last saved value (or Notion's, for a new trader), and the run
 * says how many those were. The output is committed: building or running Tradely never needs Notion.
 */
import { execFileSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const DEFAULT_FEED = "https://www.tradely.ai/api/options-traders";
const MIRROR = "https://api.fxtwitter.com";
const AVATAR_HOST = "pbs.twimg.com";
/** The same 21 calendar days and author cap the live feed uses. */
const WINDOW_DAYS = 21;
const MAX_POSTS_PER_AUTHOR = 3;
const MAX_READ_AGE_MS = 2 * 60 * 60 * 1000;
const MIRROR_SPACING_MS = 300;
const MAX_AVATAR_BYTES = 200_000;

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDirectory = join(webRoot, "src/features/options-traders/data");
const avatarDirectory = join(webRoot, "public/options-traders/avatars");
const AVATAR_PATH = "/options-traders/avatars";
const AVATAR_KEYS = {
	"x.com": "x",
	"youtube.com": "youtube",
	"reddit.com": "reddit",
};

const args = process.argv.slice(2);
if (args.includes("--source")) {
	throw new Error(
		"The sync reads Notion through Tradely's feed now; drop --source.",
	);
}
const feedFlag = args.indexOf("--feed");
const feedLocation =
	feedFlag === -1 ? `${DEFAULT_FEED}?sync=${Date.now()}` : args[feedFlag + 1];
if (!feedLocation) throw new Error("Pass --feed <url or JSON file>");

const timestamp = z.iso.datetime({ offset: true });
const metric = z.number().int().nonnegative().nullable();
const languageCode = z.string().regex(/^[a-z]{2,3}$/);

/** Explicit field lists: a field the feed adds later stays out until someone adds it here. */
const postSchema = z.object({
	id: z.string().regex(/^\d{15,25}$/),
	handle: z.string().regex(/^[a-zA-Z0-9_]{1,15}$/),
	url: z.url(),
	postedAt: timestamp,
	digestDate: z.iso.date().nullable(),
	capturedAt: timestamp.nullable(),
	metricsCapturedAt: z.union([z.iso.date(), timestamp]).nullable(),
	text: z.string().min(1).max(20_000),
	language: languageCode,
	authorLanguages: z.array(languageCode),
	tickers: z.array(z.string().min(1).max(30)),
	structure: z.string().max(100),
	bias: z.string().max(50),
	views: metric,
	likes: metric,
	reposts: metric,
});
const profileSchema = z.object({
	platform: z.enum(["x.com", "youtube.com", "reddit.com"]),
	handle: z.string().regex(/^[a-zA-Z0-9_.-]{1,30}$/),
	name: z.string().min(1).max(100),
	type: z.enum(["individual", "institutional"]),
	description: z.string().min(1).max(400),
	focus: z.array(z.string().min(1).max(40)),
	cadence: z.string().nullable(),
	activity: z.string().min(1),
	followers: metric,
	followersAsOf: z.union([z.iso.date(), z.literal("")]),
	profileUrl: z.url(),
	avatar: z.string().nullable(),
	languages: z.array(languageCode),
	rank: z.number().int().min(1).max(30).optional(),
});
const feedSchema = z.object({
	version: z.literal(1),
	digestWindow: z.object({ from: z.iso.date(), to: z.iso.date() }),
	freshness: z.object({
		dataSyncedAt: timestamp,
		sourceUpdatedAt: timestamp.nullable(),
		lastAttemptedAt: timestamp.nullable(),
		status: z.literal("success"),
	}),
	posts: z.array(postSchema),
	profiles: z.array(profileSchema).min(10),
});

async function readFeed() {
	const body = feedLocation.startsWith("https://")
		? await fetch(feedLocation, {
				headers: { accept: "application/json" },
			}).then((response) => {
				if (response.status !== 200) {
					throw new Error(
						`The feed answered ${response.status}; nothing written.`,
					);
				}
				return response.json();
			})
		: JSON.parse(readFileSync(feedLocation, "utf8"));
	const raw = z
		.looseObject({ freshness: z.looseObject({ status: z.string() }) })
		.parse(body);
	// A failed read returns the last good data, which may have no trader list at all.
	if (raw.freshness.status !== "success") {
		throw new Error(
			`The feed's last Notion read ended "${raw.freshness.status}" (often the digest's freshness page is not complete); nothing written.`,
		);
	}
	if (!("profiles" in raw)) {
		throw new Error(
			"The feed fell back to the saved trader list, so Notion's list was not read; nothing written.",
		);
	}
	const feed = feedSchema.parse(raw);
	const age = Date.now() - Date.parse(feed.freshness.dataSyncedAt);
	if (age > MAX_READ_AGE_MS) {
		throw new Error(
			`The feed's last Notion read is ${Math.round(age / 60_000)} minutes old; nothing written.`,
		);
	}
	return feed;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The mirror answers 5xx, 429 and even 404 intermittently; an unknown account is a redirect. */
async function mirror(path: string): Promise<Record<string, unknown> | null> {
	for (let attempt = 0; attempt < 4; attempt += 1) {
		if (attempt) await sleep(2_000 * 2 ** attempt);
		await sleep(MIRROR_SPACING_MS);
		try {
			const response = await fetch(`${MIRROR}/${path}`, {
				redirect: "manual",
				headers: { "user-agent": "tradely-options-traders-sync" },
			});
			if (response.status === 200) {
				return z.looseObject({}).parse(await response.json());
			}
			if (
				response.status !== 404 &&
				response.status !== 429 &&
				response.status < 500
			) {
				return null;
			}
		} catch {
			// Retried; a post or profile the mirror never answers keeps its last known numbers.
		}
	}
	return null;
}

const count = (value: unknown) =>
	typeof value === "number" && Number.isInteger(value) && value >= 0
		? value
		: null;
const field = (body: Record<string, unknown> | null, key: string) =>
	body && typeof body[key] === "object" && body[key] !== null
		? (body[key] as Record<string, unknown>)
		: null;

const feed = await readFeed();
const today = new Date().toISOString().slice(0, 10);
const to = feed.digestWindow.to;
const from = new Date(
	Date.parse(`${to}T00:00:00Z`) - (WINDOW_DAYS - 1) * 86_400_000,
)
	.toISOString()
	.slice(0, 10);

const listedOnX = new Set(
	feed.profiles
		.filter((profile) => profile.platform === "x.com")
		.map((profile) => profile.handle.toLowerCase()),
);
const inWindow = feed.posts.filter(
	(post) =>
		listedOnX.has(post.handle.toLowerCase()) &&
		post.postedAt.slice(0, 10) >= from &&
		post.postedAt.slice(0, 10) <= to,
);

let postsMeasured = 0;
const droppedPosts: string[] = [];
const measured: z.infer<typeof postSchema>[] = [];
for (const post of inWindow) {
	const tweet = field(
		await mirror(`${post.handle}/status/${post.id}`),
		"tweet",
	);
	if (!tweet) {
		measured.push(post);
		continue;
	}
	const author = String(field(tweet, "author")?.screen_name ?? "");
	if (author.toLowerCase() !== post.handle.toLowerCase() || tweet.replying_to) {
		droppedPosts.push(`${post.handle}/${post.id}`);
		continue;
	}
	postsMeasured += 1;
	measured.push({
		...post,
		views: count(tweet.views),
		likes: count(tweet.likes),
		reposts: count(tweet.retweets),
		metricsCapturedAt: today,
	});
}
const perAuthor = new Map<string, number>();
const posts = measured
	.sort((a, b) => (b.views ?? -1) - (a.views ?? -1) || a.id.localeCompare(b.id))
	.filter((post) => {
		const key = post.handle.toLowerCase();
		const seen = perAuthor.get(key) ?? 0;
		perAuthor.set(key, seen + 1);
		return seen < MAX_POSTS_PER_AUTHOR;
	});

mkdirSync(dataDirectory, { recursive: true });
const profilesPath = join(dataDirectory, "profiles.json");
const postsPath = join(dataDirectory, "posts.json");

/** Notion's follower column is never updated for X, so the last saved reading is the better fallback. */
const lastSaved = new Map(
	(existsSync(profilesPath)
		? z
				.array(profileSchema)
				.parse(JSON.parse(readFileSync(profilesPath, "utf8")))
		: []
	).map((profile) => [
		`${profile.platform}:${profile.handle.toLowerCase()}`,
		profile,
	]),
);

mkdirSync(avatarDirectory, { recursive: true });
const avatarFiles = new Set(readdirSync(avatarDirectory));
const avatarFor = (platform: keyof typeof AVATAR_KEYS, handle: string) => {
	const stem = `${AVATAR_KEYS[platform]}-${handle.toLowerCase()}`;
	return ["jpg", "png"]
		.map((ext) => `${stem}.${ext}`)
		.find((file) => avatarFiles.has(file));
};

let followersRead = 0;
const unreadFollowers: string[] = [];
/** Written only after the mirror checks below pass. */
const newAvatars: { file: string; bytes: Buffer }[] = [];
const profiles: z.infer<typeof profileSchema>[] = [];
for (const profile of feed.profiles) {
	let next = { ...profile, avatar: null as string | null };
	if (profile.platform === "x.com") {
		const user = field(
			await mirror(encodeURIComponent(profile.handle)),
			"user",
		);
		const sameAccount =
			String(user?.screen_name ?? "").toLowerCase() ===
			profile.handle.toLowerCase();
		if (user && sameAccount && count(user.followers) !== null) {
			followersRead += 1;
			next = {
				...next,
				followers: count(user.followers),
				followersAsOf: today,
			};
		} else {
			unreadFollowers.push(profile.handle);
			const saved = lastSaved.get(
				`${profile.platform}:${profile.handle.toLowerCase()}`,
			);
			if (
				saved?.followers != null &&
				saved.followersAsOf > profile.followersAsOf
			) {
				next = {
					...next,
					followers: saved.followers,
					followersAsOf: saved.followersAsOf,
				};
			}
		}
		const avatarUrl =
			typeof user?.avatar_url === "string" ? user.avatar_url : "";
		if (sameAccount && !avatarFor("x.com", profile.handle) && avatarUrl) {
			const url = new URL(avatarUrl);
			const response = url.hostname === AVATAR_HOST ? await fetch(url) : null;
			const type = response?.headers.get("content-type") ?? "";
			const bytes = response?.ok
				? Buffer.from(await response.arrayBuffer())
				: null;
			const ext =
				type === "image/png" ? "png" : type === "image/jpeg" ? "jpg" : null;
			if (bytes && ext && bytes.length <= MAX_AVATAR_BYTES) {
				const file = `x-${profile.handle.toLowerCase()}.${ext}`;
				newAvatars.push({ file, bytes });
				avatarFiles.add(file);
			}
		}
	}
	const file = avatarFor(profile.platform, profile.handle);
	profiles.push({ ...next, avatar: file ? `${AVATAR_PATH}/${file}` : null });
}

// An outage on the mirror would quietly freeze every number, so it stops the run instead.
const onX = feed.profiles.filter((profile) => profile.platform === "x.com");
if (followersRead < onX.length / 2 || postsMeasured < inWindow.length / 2) {
	throw new Error(
		`The X mirror answered for ${followersRead} of ${onX.length} traders and ${postsMeasured} of ${inWindow.length} posts; nothing written.`,
	);
}

for (const { file, bytes } of newAvatars) {
	writeFileSync(join(avatarDirectory, file), bytes);
}
// A trader taken off the list takes their picture with them.
const published = new Set(
	profiles.flatMap((profile) =>
		profile.avatar ? [profile.avatar.split("/").pop()] : [],
	),
);
const avatarsRemoved = [...avatarFiles].filter((file) => !published.has(file));
for (const file of avatarsRemoved) rmSync(join(avatarDirectory, file));

writeFileSync(profilesPath, `${JSON.stringify(profiles, null, "\t")}\n`);
writeFileSync(
	postsPath,
	`${JSON.stringify(
		{
			version: 1,
			digestWindow: { from, to },
			freshness: feed.freshness,
			posts,
		},
		null,
		"\t",
	)}\n`,
);
execFileSync(
	"pnpm",
	["exec", "biome", "format", "--write", profilesPath, postsPath],
	{
		cwd: webRoot,
		stdio: "inherit",
	},
);

const ranked = profiles.filter((profile) => profile.rank !== undefined).length;
console.log(
	[
		`Posts ${from} to ${to}: ${posts.length} saved, ${postsMeasured} re-measured on the mirror, ${inWindow.length - postsMeasured - droppedPosts.length} kept their last numbers.`,
		droppedPosts.length
			? `Left out (reply or different author on X): ${droppedPosts.join(", ")}.`
			: "",
		`Traders: ${profiles.length} listed (${ranked} ranked); followers re-read for ${followersRead} on X.`,
		unreadFollowers.length
			? `Followers not re-read (last saved or Notion value kept): ${unreadFollowers.join(", ")}.`
			: "",
		`Avatars: ${published.size} published, ${newAvatars.length} added, ${avatarsRemoved.length} removed${avatarsRemoved.length ? ` (${avatarsRemoved.join(", ")})` : ""}.`,
	]
		.filter(Boolean)
		.join("\n"),
);
