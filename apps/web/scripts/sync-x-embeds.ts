/**
 * Saves X's own data for the most-viewed saved posts, so the options-traders page can show them as
 * X-style embeds (react-tweet's EmbeddedTweet) without loading X's script or cookies, and without
 * the browser asking any third party for the post. Runs at the end of the weekly sync, or alone:
 *
 *   pnpm --filter web options-traders:embeds
 *
 * Only posts at or above the featured view threshold are embedded; the table keeps its rows. A post
 * X no longer returns (deleted, private, suspended or not found) gets no entry, and the page keeps
 * its saved card for it. When the request itself fails, last week's entry is kept.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getTweet } from "react-tweet/api";

import { FEATURED_VIEW_THRESHOLD } from "../src/features/options-traders/model";

const SPACING_MS = 400;

const dataDirectory = join(
	dirname(fileURLToPath(import.meta.url)),
	"../src/features/options-traders/data",
);
const postsPath = join(dataDirectory, "posts.json");
const embedsPath = join(dataDirectory, "x-embeds.json");

type SavedPosts = { posts: { id: string; views: number | null }[] };

export async function syncXEmbeds(): Promise<string> {
	const { posts } = JSON.parse(readFileSync(postsPath, "utf8")) as SavedPosts;
	const featured = posts.filter(
		(post) => post.views !== null && post.views >= FEATURED_VIEW_THRESHOLD,
	);
	const previous: Record<string, unknown> = existsSync(embedsPath)
		? (JSON.parse(readFileSync(embedsPath, "utf8")).tweets ?? {})
		: {};
	const tweets: Record<string, unknown> = {};
	const missing: string[] = [];
	const kept: string[] = [];
	for (const [index, post] of featured.entries()) {
		if (index > 0) await new Promise((done) => setTimeout(done, SPACING_MS));
		try {
			const tweet = await getTweet(post.id);
			if (tweet && tweet.id_str === post.id) tweets[post.id] = tweet;
			else missing.push(post.id);
		} catch {
			if (previous[post.id]) {
				tweets[post.id] = previous[post.id];
				kept.push(post.id);
			} else missing.push(post.id);
		}
	}
	writeFileSync(
		embedsPath,
		`${JSON.stringify(
			{ version: 1, fetchedAt: new Date().toISOString(), tweets },
			null,
			"\t",
		)}\n`,
	);
	return `X embeds: ${Object.keys(tweets).length} of ${featured.length} featured posts saved${kept.length ? `; X failed, last week's kept: ${kept.join(", ")}` : ""}${missing.length ? `; not returned by X: ${missing.join(", ")}` : ""}.`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	console.log(await syncXEmbeds());
}
