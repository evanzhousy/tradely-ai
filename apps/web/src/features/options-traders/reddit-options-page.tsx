import { buttonVariants } from "@tradely/ui/components/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@tradely/ui/components/empty";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@tradely/ui/components/table";
import { useMemo, useState } from "react";
import { useAnalytics } from "@/analytics/context";
import { AppLink } from "@/components/app-link";
import { EnglishOnlyNote } from "@/components/english-only-note";
import { PageIntro } from "@/components/page-intro";
import { FilterSelect } from "./controls";
import savedPosts from "./data/reddit-posts.json";
import {
	formatDate,
	formatMetric,
	formatMetricsChecked,
	formatRecordedTime,
	latestPostAt,
	profileAnchor,
} from "./model";
import {
	DEFAULT_REDDIT_FILTERS,
	type RedditFilters,
	type RedditPost,
	type RedditSnapshot,
	selectRedditPosts,
	subredditCounts,
} from "./reddit-model";
import { savedProfiles } from "./saved-data";
import {
	FreshnessPanel,
	isDelayed,
	OpenOptionTrades,
	RemovalContact,
	recordedDate,
	useLatestSnapshot,
} from "./snapshot-ui";
import { TraderRoster } from "./trader-roster";

const FEED_PATH = "/api/reddit-options";

/** Alphabetical on purpose: these are pseudonymous users, not a ranking of people. */
const contributors = savedProfiles
	.filter((profile) => profile.platform === "reddit.com")
	.sort((a, b) => a.handle.localeCompare(b.handle));
const contributorAnchors = new Set(contributors.map(profileAnchor));
const NO_SUMMARIES = new Map();

const subredditUrl = (name: string) => `https://www.reddit.com/r/${name}/`;
const userUrl = (name: string) => `https://www.reddit.com/user/${name}/`;

/** A post may have no numbers yet, so the dates cover only the posts that were read. */
const metricsRead = (posts: readonly RedditPost[]) =>
	formatMetricsChecked(posts.filter((post) => post.metricsCapturedAt));

/** "Other" is the database's placeholder, not a ticker or a structure a reader can look up. */
const postTags = (post: RedditPost) => [
	...post.tickers.filter((ticker) => ticker !== "Other"),
	...(post.structure && post.structure !== "Other" ? [post.structure] : []),
];

function ExternalText({
	href,
	onClick,
	children,
}: {
	href: string;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="trader-link [overflow-wrap:anywhere]"
			onClick={onClick}
		>
			{children}
			<span className="sr-only"> (opens on Reddit)</span>
		</a>
	);
}

function RedditPostsTable({ posts }: { posts: readonly RedditPost[] }) {
	const { capture } = useAnalytics();
	const openSubreddit = (subreddit: string) => () =>
		capture("options_subreddit_opened", {
			surface: "options_traders_reddit",
			placement: "post",
			subreddit,
		});
	const openAuthor = (author: string) => () =>
		capture("options_profile_opened", {
			surface: "options_traders_reddit",
			placement: "post_author",
			platform: "reddit",
			handle: author,
		});
	return (
		<Table>
			<TableCaption className="sr-only">
				Public Reddit posts about U.S.-listed options
			</TableCaption>
			<TableHeader>
				<TableRow>
					<TableHead>Post</TableHead>
					<TableHead className="hidden md:table-cell">Where</TableHead>
					<TableHead className="hidden md:table-cell">Posted</TableHead>
					<TableHead className="w-20 text-right">Upvotes</TableHead>
					<TableHead className="hidden w-24 text-right sm:table-cell">
						Comments
					</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{posts.map((post, index) => {
					const tags = postTags(post);
					return (
						<TableRow
							key={post.id}
							id={`post-${post.id}`}
							className="scroll-mt-24 align-top"
						>
							<TableCell className="min-w-0 max-w-[30rem] whitespace-normal">
								<a
									href={post.url}
									target="_blank"
									rel="noopener noreferrer"
									dir="auto"
									className="trader-post-link line-clamp-3 font-medium leading-snug [overflow-wrap:anywhere]"
									onClick={() =>
										capture("options_post_opened", {
											surface: "options_traders_reddit",
											placement: "posts_table",
											platform: "reddit",
											post_id: post.id,
											position: index + 1,
											subreddit: post.subreddit,
										})
									}
								>
									{post.title}
									<span className="sr-only"> (opens on Reddit)</span>
								</a>
								<p className="mt-1.5 text-muted-foreground text-sm leading-snug">
									{post.summary}
								</p>
								{/* Phones lose the Where column, and the smallest the Comments column too. */}
								<p className="mt-1.5 text-muted-foreground text-xs md:hidden">
									<ExternalText
										href={subredditUrl(post.subreddit)}
										onClick={openSubreddit(post.subreddit)}
									>
										r/{post.subreddit}
									</ExternalText>{" "}
									·{" "}
									<ExternalText
										href={userUrl(post.author)}
										onClick={openAuthor(post.author)}
									>
										u/{post.author}
									</ExternalText>{" "}
									· {formatDate(post.postedAt)}
									<span className="sm:hidden">
										{" "}
										· {formatMetric(post.comments)}{" "}
										{post.comments === 1 ? "comment" : "comments"}
									</span>
								</p>
								{post.metricsCapturedAt ? (
									<p className="mt-1 text-muted-foreground text-xs">
										Upvotes and comments read:{" "}
										{formatRecordedTime(post.metricsCapturedAt)}
									</p>
								) : null}
								{tags.length > 0 ? (
									<p className="mt-1.5 font-mono text-muted-foreground text-xs">
										<span className="sr-only">Tickers and structure: </span>
										{tags.join(" · ")}
									</p>
								) : null}
							</TableCell>
							<TableCell className="hidden whitespace-normal text-sm md:table-cell">
								<span className="block">
									<ExternalText
										href={subredditUrl(post.subreddit)}
										onClick={openSubreddit(post.subreddit)}
									>
										r/{post.subreddit}
									</ExternalText>
								</span>
								<span className="block font-mono text-xs">
									<ExternalText
										href={userUrl(post.author)}
										onClick={openAuthor(post.author)}
									>
										u/{post.author}
									</ExternalText>
								</span>
							</TableCell>
							<TableCell className="hidden whitespace-nowrap text-sm md:table-cell">
								{formatDate(post.postedAt)}
							</TableCell>
							<TableCell className="whitespace-normal text-right font-semibold text-sm tabular-nums">
								{formatMetric(post.score)}
							</TableCell>
							<TableCell className="hidden whitespace-normal text-right text-sm tabular-nums sm:table-cell">
								{formatMetric(post.comments)}
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}

function PostControls({
	filters,
	setFilters,
	subreddits,
}: {
	filters: RedditFilters;
	setFilters: (filters: RedditFilters, filter: "subreddit" | "sort") => void;
	subreddits: readonly { name: string; count: number }[];
}) {
	return (
		<div data-trader-controls className="grid gap-4 sm:grid-cols-2 lg:w-2/3">
			<FilterSelect
				label="Subreddit"
				value={filters.subreddit}
				options={[
					{ value: "all", label: "All subreddits" },
					...subreddits.map(({ name, count }) => ({
						value: name,
						label: `r/${name} (${count})`,
					})),
				]}
				onChange={(subreddit) =>
					setFilters({ ...filters, subreddit }, "subreddit")
				}
			/>
			<FilterSelect
				label="Sort by"
				value={filters.sort}
				options={[
					{ value: "score", label: "Most upvoted" },
					{ value: "newest", label: "Newest" },
				]}
				onChange={(sort) =>
					setFilters(
						{ ...filters, sort: sort === "newest" ? "newest" : "score" },
						"sort",
					)
				}
			/>
		</div>
	);
}

const METHOD = [
	{
		title: "What gets listed",
		body: "Public posts about U.S.-listed options that name something you can check against the tape: a strike and expiry, an open-interest change, a gamma wall or a large print. Profit screenshots and general questions are left out.",
	},
	{
		title: "How the order works",
		body: "Posts sort by upvotes on the date we read them, and you can switch to newest. Upvotes measure attention, not accuracy, and neither listing nor order measures anyone's trading returns.",
	},
	{
		title: "Where the data comes from",
		body: "Each week a third-party Reddit data service suggests candidate posts and reads their upvotes and comments. We read every candidate and list only the ones we approve, keeping them in our own database. We link to the original post and write the summary ourselves rather than copying the post. Tradely is not affiliated with or endorsed by Reddit.",
	},
];

export function RedditOptionsPage() {
	const snapshot = useLatestSnapshot(savedPosts as RedditSnapshot, FEED_PATH);
	const { posts, freshness } = snapshot;
	const { capture } = useAnalytics();
	const [filters, setFilters] = useState(DEFAULT_REDDIT_FILTERS);
	const subreddits = useMemo(() => subredditCounts(posts), [posts]);
	// A subreddit can leave the list when a later read has no posts from it.
	const activeFilters = subreddits.some(
		({ name }) => name === filters.subreddit,
	)
		? filters
		: { ...filters, subreddit: "all" };
	const selected = useMemo(
		() => selectRedditPosts(posts, activeFilters),
		[posts, activeFilters],
	);
	const changeFilters = (next: RedditFilters, filter: "subreddit" | "sort") => {
		setFilters(next);
		capture("options_list_filtered", {
			surface: "options_traders_reddit",
			filter,
			value: next[filter],
			matching_posts: selectRedditPosts(posts, next).length,
		});
	};

	return (
		<main lang="en" className="page-shell options-traders-page">
			<EnglishOnlyNote />
			<PageIntro
				eyebrow="Who to read"
				title="Options posts on Reddit"
				description="Public Reddit posts that name something you can check against the tape, and the contributors we track. Sorted by upvotes, which measure attention, not accuracy."
			>
				<div className="flex flex-wrap gap-3">
					<AppLink to="/options-traders" className={buttonVariants()}>
						See traders on X and YouTube
					</AppLink>
					<OpenOptionTrades
						surface="options_traders_reddit"
						variant="outline"
					/>
				</div>
				<p className="max-w-[65ch] text-muted-foreground text-xs leading-relaxed">
					Listing is not an endorsement or financial advice. Option Trades is
					part of TradingFlow, a separate product that needs its own account and
					a free trial or paid plan.
				</p>
			</PageIntro>

			<section
				id="posts"
				aria-labelledby="posts-title"
				className="trader-section"
			>
				<h2 id="posts-title" className="trader-section-title">
					Posts worth checking
				</h2>
				{posts.length > 0 ? (
					<>
						<PostControls
							filters={activeFilters}
							setFilters={changeFilters}
							subreddits={subreddits}
						/>
						<p className="max-w-3xl text-muted-foreground text-sm leading-relaxed">
							{selected.length} {selected.length === 1 ? "post" : "posts"}.{" "}
							{metricsRead(selected)
								? `Upvotes and comments were read ${metricsRead(selected)}. They change over time.`
								: "No upvotes or comments have been read for these posts yet."}
						</p>
						<RedditPostsTable posts={selected} />
						<nav aria-label="Subreddits in this list">
							<ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
								{subreddits.map(({ name, count }) => (
									<li key={name}>
										<ExternalText
											href={subredditUrl(name)}
											onClick={() =>
												capture("options_subreddit_opened", {
													surface: "options_traders_reddit",
													placement: "subreddit_list",
													subreddit: name,
												})
											}
										>
											r/{name}
										</ExternalText>{" "}
										<span className="text-muted-foreground">
											{count} {count === 1 ? "post" : "posts"}
										</span>
									</li>
								))}
							</ul>
						</nav>
					</>
				) : (
					<Empty className="trader-surface">
						<EmptyHeader>
							<EmptyTitle>No posts listed yet</EmptyTitle>
							<EmptyDescription>
								Posts appear here once they have been reviewed and added.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</section>

			<section
				id="contributors"
				aria-labelledby="contributors-title"
				className="trader-section"
			>
				<div className="flex flex-col gap-2">
					<h2 id="contributors-title" className="trader-section-title">
						Reddit contributors we track
					</h2>
					<p className="max-w-3xl text-muted-foreground text-sm leading-relaxed">
						{contributors.length} users who have named levels or prints in
						public posts, in alphabetical order. They are tracked separately:
						the posts above come from anyone on Reddit and are chosen one by
						one. This is not a ranking, and inclusion is not an endorsement.
						Reddit karma is not tracked.
					</p>
				</div>
				<TraderRoster
					profiles={contributors}
					visible={contributorAnchors}
					summaries={NO_SUMMARIES}
					surface="options_traders_reddit"
					placement="contributors"
				/>
			</section>

			<section
				id="method"
				aria-labelledby="method-title"
				className="trader-section"
			>
				<h2 id="method-title" className="trader-section-title">
					How this list is built
				</h2>
				{posts.length > 0 || isDelayed(freshness) ? (
					<FreshnessPanel
						freshness={freshness}
						dates={[
							...(freshness.dataSyncedAt
								? [recordedDate("Data synced", freshness.dataSyncedAt)]
								: []),
							recordedDate("Posts through", latestPostAt(posts)),
							{
								label: "Metrics read",
								dateTime: null,
								text: metricsRead(posts) ?? "Not recorded",
							},
						]}
					>
						These dates describe every listed post, whichever filters are on.
					</FreshnessPanel>
				) : null}
				<div className="grid gap-4 md:grid-cols-3">
					{METHOD.map((step) => (
						<article key={step.title} className="trader-surface p-6">
							<h3 className="font-semibold text-lg">{step.title}</h3>
							<p className="mt-2 text-muted-foreground text-sm leading-relaxed">
								{step.body}
							</p>
						</article>
					))}
				</div>
			</section>

			<section
				aria-labelledby="check-title"
				className="trader-surface flex flex-col items-start gap-4 p-8"
			>
				<h2 id="check-title" className="font-semibold text-2xl tracking-tight">
					Check a print yourself
				</h2>
				<p className="max-w-[65ch] text-muted-foreground text-sm leading-relaxed sm:text-base">
					A post can name a strike without being right about it. Tradely's free
					course teaches you how to read one, and TradingFlow's Option Trades
					tape shows the prints behind a claim.
				</p>
				<div className="flex flex-wrap gap-3">
					<AppLink
						to="/courses/tradingflow-foundations"
						className={buttonVariants({ variant: "outline" })}
					>
						Explore the curriculum
					</AppLink>
					<OpenOptionTrades
						surface="options_traders_reddit"
						variant="default"
					/>
				</div>
			</section>

			<p className="text-muted-foreground text-xs leading-relaxed">
				Educational and informational only, not financial advice. See the{" "}
				<AppLink
					to="/risk-disclosure"
					className="trader-link underline underline-offset-4"
				>
					risk disclosure
				</AppLink>
				. <RemovalContact />
			</p>
		</main>
	);
}
