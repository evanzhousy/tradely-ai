import type { SnapshotFreshness } from "./model";

/** A public Reddit post: its title and link, numbers with the date they were read, and our own summary. */
export type RedditPost = {
	id: string;
	url: string;
	subreddit: string;
	author: string;
	title: string;
	summary: string;
	postedAt: string;
	score: number | null;
	comments: number | null;
	metricsCapturedAt: string | null;
	tickers: string[];
	structure: string;
};

export type RedditSnapshot = {
	version: 1;
	freshness: SnapshotFreshness;
	posts: RedditPost[];
};

export type RedditFilters = {
	subreddit: string;
	sort: "score" | "newest";
};

export const DEFAULT_REDDIT_FILTERS: RedditFilters = {
	subreddit: "all",
	sort: "score",
};

export function selectRedditPosts(
	posts: readonly RedditPost[],
	{ subreddit, sort }: RedditFilters,
): RedditPost[] {
	return posts
		.filter((post) => subreddit === "all" || post.subreddit === subreddit)
		.sort((a, b) =>
			sort === "newest"
				? Date.parse(b.postedAt) - Date.parse(a.postedAt)
				: (b.score ?? -1) - (a.score ?? -1) || a.id.localeCompare(b.id),
		);
}

/** The subreddits these posts come from, most posts first. */
export function subredditCounts(
	posts: readonly RedditPost[],
): { name: string; count: number }[] {
	const counts = new Map<string, number>();
	for (const post of posts) {
		counts.set(post.subreddit, (counts.get(post.subreddit) ?? 0) + 1);
	}
	return [...counts]
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
