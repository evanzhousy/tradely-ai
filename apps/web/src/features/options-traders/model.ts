/** The public directory: reviewed profiles, the X posts saved for them, and how a reader narrows both. */

export type TraderPlatform = "x.com" | "youtube.com" | "reddit.com";

export const PLATFORMS: readonly {
	id: TraderPlatform;
	anchor: string;
	label: string;
	audience: string | null;
	handlePrefix: string;
}[] = [
	{
		id: "x.com",
		anchor: "x",
		label: "X",
		audience: "followers",
		handlePrefix: "@",
	},
	{
		id: "youtube.com",
		anchor: "youtube",
		label: "YouTube",
		audience: "subscribers",
		handlePrefix: "@",
	},
	{
		id: "reddit.com",
		anchor: "reddit",
		label: "Reddit",
		audience: null,
		handlePrefix: "u/",
	},
];

export type TraderProfile = {
	platform: TraderPlatform;
	handle: string;
	name: string;
	type: "individual" | "institutional";
	description: string;
	focus: string[];
	cadence: string | null;
	activity: string;
	followers: number | null;
	followersAsOf: string;
	profileUrl: string;
	avatar: string | null;
	languages: string[];
	/** Present only on the ranked Top 30 on X. */
	rank?: number;
};

export type SavedPost = {
	id: string;
	handle: string;
	url: string;
	postedAt: string;
	digestDate: string | null;
	capturedAt: string | null;
	metricsCapturedAt: string | null;
	text: string;
	language: string;
	authorLanguages: string[];
	tickers: string[];
	structure: string;
	bias: string;
	views: number | null;
	likes: number | null;
	reposts: number | null;
};

export type SnapshotFreshness = {
	dataSyncedAt: string | null;
	sourceUpdatedAt: string | null;
	lastAttemptedAt: string | null;
	status: "unrecorded" | "success" | "partial" | "failed";
};

export type PostSnapshot = {
	version: 1;
	digestWindow: { from: string; to: string };
	freshness: SnapshotFreshness;
	posts: SavedPost[];
};

export type PostWithAuthor = SavedPost & { author: TraderProfile };

export type DirectoryFilters = {
	view: "top" | "all";
	query: string;
	platform: string;
	topic: string;
	activity: string;
	language: string;
};

export const DEFAULT_FILTERS: DirectoryFilters = {
	view: "top",
	query: "",
	platform: "all",
	topic: "all",
	activity: "all",
	language: "all",
};

/** Saved posts at or above this many measured views also appear as full cards. */
export const FEATURED_VIEW_THRESHOLD = 10_000;

export function platformOf(profile: Pick<TraderProfile, "platform">) {
	return PLATFORMS.find((item) => item.id === profile.platform) ?? PLATFORMS[0];
}

export function formatHandle(
	profile: Pick<TraderProfile, "platform" | "handle">,
): string {
	return `${platformOf(profile).handlePrefix}${profile.handle}`;
}

/** Stable across platforms, so the same handle on X and YouTube keeps separate anchors. */
export function profileAnchor(
	profile: Pick<TraderProfile, "platform" | "handle">,
): string {
	const prefix =
		profile.platform === "x.com" ? "" : `${platformOf(profile).anchor}-`;
	return `trader-${prefix}${profile.handle.toLowerCase()}`;
}

export function languageLabel(language: string): string {
	if (language === "und") return "Not recorded";
	if (language === "zh") return "Chinese (中文)";
	if (language === "es") return "Spanish (Español)";
	return (
		new Intl.DisplayNames(["en"], { type: "language", fallback: "none" }).of(
			language,
		) ?? language
	);
}

/** Observed in saved posts, so a later read can add a language to a known author. */
export function withObservedLanguages(
	profiles: readonly TraderProfile[],
	posts: readonly SavedPost[],
): TraderProfile[] {
	return profiles.map((profile) => {
		if (profile.platform !== "x.com") return profile;
		const handle = profile.handle.toLowerCase();
		const observed = posts
			.filter((post) => post.handle.toLowerCase() === handle)
			.flatMap((post) => [
				...post.authorLanguages,
				...(post.language === "und" ? [] : [post.language]),
			]);
		return {
			...profile,
			languages: [...new Set([...profile.languages, ...observed])],
		};
	});
}

/** A reviewed profile is the only authority for who a post's author is. */
export function attachAuthors(
	profiles: readonly TraderProfile[],
	posts: readonly SavedPost[],
): PostWithAuthor[] {
	const authors = new Map(
		profiles
			.filter((profile) => profile.platform === "x.com")
			.map((profile) => [profile.handle.toLowerCase(), profile]),
	);
	return posts
		.flatMap((post) => {
			const author = authors.get(post.handle.toLowerCase());
			return author ? [{ ...post, author }] : [];
		})
		.sort(
			(a, b) => (b.views ?? -1) - (a.views ?? -1) || a.id.localeCompare(b.id),
		);
}

/**
 * One selection drives profiles, posts and counts. Platform, topic, activity and search choose
 * the authors; language then checks a profile's languages and a post's own text independently.
 */
export function selectDirectory(
	profiles: readonly TraderProfile[],
	posts: readonly PostWithAuthor[],
	filters: DirectoryFilters,
): { profiles: TraderProfile[]; posts: PostWithAuthor[] } {
	const query = filters.query.trim().toLowerCase();
	const scoped = profiles.filter(
		(profile) =>
			(filters.view === "all" || profile.rank !== undefined) &&
			(filters.platform === "all" || profile.platform === filters.platform) &&
			(filters.topic === "all" || profile.focus.includes(filters.topic)) &&
			(filters.activity === "all" || profile.activity === filters.activity) &&
			(!query ||
				[profile.name, profile.handle, profile.description, ...profile.focus]
					.join(" ")
					.toLowerCase()
					.includes(query)),
	);
	const authors = new Set(scoped.map(profileAnchor));
	return {
		profiles: scoped.filter(
			(profile) =>
				filters.language === "all" ||
				(filters.language === "und"
					? profile.languages.length === 0
					: profile.languages.includes(filters.language)),
		),
		posts: posts.filter(
			(post) =>
				authors.has(profileAnchor(post.author)) &&
				(filters.language === "all" || post.language === filters.language),
		),
	};
}

/** Only languages a reader can actually find: English first, then codes, then "Not recorded". */
export function availableLanguages(
	profiles: readonly TraderProfile[],
	posts: readonly SavedPost[],
): string[] {
	const known = new Set([
		...profiles.flatMap((profile) => profile.languages),
		...posts.map((post) => post.language),
	]);
	known.delete("und");
	const hasUnknown =
		profiles.some((profile) => profile.languages.length === 0) ||
		posts.some((post) => post.language === "und");
	return [
		...(known.has("en") ? ["en"] : []),
		...[...known].filter((code) => code !== "en").sort(),
		...(hasUnknown ? ["und"] : []),
	];
}

export type PostSummary = {
	count: number;
	topViews: number | null;
	topPostId: string;
};

export function summarizePosts(
	posts: readonly PostWithAuthor[],
): Map<string, PostSummary> {
	const summary = new Map<string, PostSummary>();
	for (const post of posts) {
		const current = summary.get(post.author.handle);
		if (!current) {
			summary.set(post.author.handle, {
				count: 1,
				topViews: post.views,
				topPostId: post.id,
			});
			continue;
		}
		current.count += 1;
		if (
			post.views !== null &&
			(current.topViews === null || post.views > current.topViews)
		) {
			current.topViews = post.views;
			current.topPostId = post.id;
		}
	}
	return summary;
}

const compactNumber = new Intl.NumberFormat("en-US", {
	notation: "compact",
	maximumFractionDigits: 1,
});
const wholeNumber = new Intl.NumberFormat("en-US");
const utcDate = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
	timeZone: "UTC",
});
const utcTimestamp = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
	hour: "numeric",
	minute: "2-digit",
	timeZone: "UTC",
	timeZoneName: "short",
});

export const formatCompact = (value: number) => compactNumber.format(value);

export const formatMetric = (value: number | null) =>
	value === null ? "Not recorded" : wholeNumber.format(value);

/** Every date on the page is UTC, so server and browser always render the same text. */
export const formatDate = (value: string) => utcDate.format(new Date(value));

/** A date-only source value stays date-only; ICU whitespace is normalised for hydration. */
export function formatRecordedTime(value: string | null): string {
	if (!value) return "Not recorded";
	const formatted = /^\d{4}-\d{2}-\d{2}$/.test(value)
		? utcDate.format(new Date(`${value}T00:00:00Z`))
		: utcTimestamp.format(new Date(value));
	return formatted.replace(/\s/gu, " ");
}

export const formatDateRange = (from: string, to: string) =>
	utcDate.formatRange(new Date(from), new Date(to)).replace(/\s/gu, " ");

/** The days these posts' metrics were read, or null when any post has no recorded reading. */
export function formatMetricsChecked(
	posts: readonly Pick<SavedPost, "metricsCapturedAt">[],
): string | null {
	const readings = posts.flatMap((post) =>
		post.metricsCapturedAt ? [Date.parse(post.metricsCapturedAt)] : [],
	);
	if (readings.length === 0 || readings.length < posts.length) return null;
	return formatDateRange(
		new Date(Math.min(...readings)).toISOString(),
		new Date(Math.max(...readings)).toISOString(),
	);
}

export function latestPostAt(
	posts: readonly Pick<SavedPost, "postedAt">[],
): string | null {
	return posts.reduce<string | null>(
		(latest, post) =>
			!latest || Date.parse(post.postedAt) > Date.parse(latest)
				? post.postedAt
				: latest,
		null,
	);
}
