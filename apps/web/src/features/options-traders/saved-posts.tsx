import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@tradely/ui/components/table";
import { ArrowUpRightIcon } from "lucide-react";

import { useAnalytics } from "@/analytics/context";
import { PlatformIcon } from "./brand-icons";
import {
	formatDate,
	formatHandle,
	formatMetric,
	formatRecordedTime,
	languageLabel,
	type PostWithAuthor,
} from "./model";
import { TraderAvatar } from "./trader-avatar";
import { savedXEmbed, XPostEmbed } from "./x-embed";

const textLanguage = (language: string) =>
	language === "und" ? undefined : language;

/** "Other" is the source's placeholder, not a ticker or a structure a reader can look up. */
const postTags = (post: PostWithAuthor) => [
	...post.tickers.filter((ticker) => ticker !== "Other"),
	...(post.structure && post.structure !== "Other" ? [post.structure] : []),
];

/**
 * Each post as an X-style embed drawn from data the weekly sync saved, or as Tradely's saved card
 * when there is none, as for a post the live feed added since. X's own embed is not used: it would
 * add X's script and cookies to this page.
 */
export function FeaturedPosts({ posts }: { posts: readonly PostWithAuthor[] }) {
	const { capture } = useAnalytics();
	return (
		<ul className="grid items-start gap-4 md:grid-cols-2">
			{posts.map((post, index) => {
				const tweet = savedXEmbed(post.id);
				if (tweet) {
					return (
						<li key={post.id} className="min-w-0">
							<XPostEmbed post={post} tweet={tweet} position={index + 1} />
						</li>
					);
				}
				return (
					<li
						key={post.id}
						className="trader-surface flex min-w-0 flex-col gap-3 p-6"
					>
						<div className="flex min-w-0 items-center gap-3">
							<TraderAvatar profile={post.author} size={40} />
							<div className="min-w-0">
								<p className="truncate font-semibold leading-tight">
									{post.author.name}
								</p>
								<p className="truncate font-mono text-muted-foreground text-xs">
									{formatHandle(post.author)} · {formatDate(post.postedAt)}
								</p>
							</div>
						</div>
						<p
							lang={textLanguage(post.language)}
							dir="auto"
							className="line-clamp-[10] whitespace-pre-line text-sm leading-relaxed [overflow-wrap:anywhere]"
						>
							{post.text}
						</p>
						<div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-2">
							<p className="font-mono text-muted-foreground text-xs tabular-nums">
								{formatMetric(post.views)} views · {formatMetric(post.likes)}{" "}
								likes · {formatMetric(post.reposts)} reposts
							</p>
							<a
								href={post.url}
								target="_blank"
								rel="noopener noreferrer"
								className="trader-link inline-flex items-center gap-1 font-medium text-sm"
								onClick={() =>
									capture("options_post_opened", {
										surface: "options_traders",
										placement: "featured",
										platform: "x",
										post_id: post.id,
										position: index + 1,
										handle: post.author.handle,
									})
								}
							>
								<PlatformIcon platform="x.com" size={12} />
								Open on X
								<ArrowUpRightIcon aria-hidden="true" size={14} />
							</a>
						</div>
					</li>
				);
			})}
		</ul>
	);
}

export function PostsTable({ posts }: { posts: readonly PostWithAuthor[] }) {
	const { capture } = useAnalytics();
	const maxViews = Math.max(posts[0]?.views ?? 0, 1);
	return (
		<Table>
			<TableCaption className="sr-only">
				Matching saved X posts, sorted by views
			</TableCaption>
			<TableHeader>
				<TableRow>
					<TableHead className="w-10">#</TableHead>
					<TableHead>Post</TableHead>
					<TableHead className="hidden md:table-cell">Trader</TableHead>
					<TableHead className="hidden md:table-cell">Posted</TableHead>
					<TableHead className="w-28 text-right sm:w-36">Views</TableHead>
					<TableHead className="hidden text-right lg:table-cell">
						Likes
					</TableHead>
					<TableHead className="hidden text-right lg:table-cell">
						Reposts
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
							<TableCell className="font-mono text-muted-foreground text-xs tabular-nums">
								{String(index + 1).padStart(2, "0")}
							</TableCell>
							<TableCell className="min-w-0 max-w-[26rem] whitespace-normal">
								{/* The text is not the link: a screen reader would read a whole post as one link name. */}
								<p
									lang={textLanguage(post.language)}
									dir="auto"
									className="line-clamp-3 font-medium leading-snug [overflow-wrap:anywhere]"
								>
									{post.text}
								</p>
								<p className="mt-1.5 text-muted-foreground text-xs md:hidden">
									{formatHandle(post.author)} · {formatDate(post.postedAt)}
								</p>
								<p className="mt-1 text-muted-foreground text-xs">
									Text language: {languageLabel(post.language)} · Metrics
									checked: {formatRecordedTime(post.metricsCapturedAt)} ·{" "}
									<a
										href={post.url}
										target="_blank"
										rel="noopener noreferrer"
										className="trader-link inline-flex items-center gap-0.5 font-medium text-foreground"
										onClick={() =>
											capture("options_post_opened", {
												surface: "options_traders",
												placement: "posts_table",
												platform: "x",
												post_id: post.id,
												position: index + 1,
												handle: post.author.handle,
											})
										}
									>
										<PlatformIcon platform="x.com" size={12} />
										Open on X
										<ArrowUpRightIcon aria-hidden="true" size={12} />
										<span className="sr-only">
											{" "}
											(post by {formatHandle(post.author)},{" "}
											{formatDate(post.postedAt)})
										</span>
									</a>
								</p>
								{tags.length > 0 ? (
									<p className="mt-1.5 font-mono text-muted-foreground text-xs">
										<span className="sr-only">Tickers and structure: </span>
										{tags.join(" · ")}
									</p>
								) : null}
							</TableCell>
							<TableCell className="hidden md:table-cell">
								<div className="flex items-start gap-2.5">
									<TraderAvatar
										profile={post.author}
										size={28}
										className="mt-0.5"
									/>
									<div className="min-w-0">
										<span className="block font-medium">
											{post.author.name}
										</span>
										<a
											href={post.author.profileUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="trader-link font-mono text-xs"
											onClick={() =>
												capture("options_profile_opened", {
													surface: "options_traders",
													placement: "post_author",
													platform: "x",
													handle: post.author.handle,
													rank: post.author.rank,
												})
											}
										>
											{formatHandle(post.author)}
										</a>
									</div>
								</div>
							</TableCell>
							<TableCell className="hidden whitespace-nowrap text-muted-foreground md:table-cell">
								{formatDate(post.postedAt)}
							</TableCell>
							<TableCell className="text-right">
								<span className="font-semibold tabular-nums">
									{formatMetric(post.views)}
								</span>
								{post.views !== null ? (
									<span
										aria-hidden="true"
										className="mt-2 block h-1.5 overflow-hidden rounded-full bg-muted"
									>
										<span
											className="trader-views-bar block h-full rounded-full"
											style={{
												width: `${Math.max((post.views / maxViews) * 100, 1)}%`,
											}}
										/>
									</span>
								) : null}
							</TableCell>
							<TableCell className="hidden text-right text-muted-foreground tabular-nums lg:table-cell">
								{formatMetric(post.likes)}
							</TableCell>
							<TableCell className="hidden text-right text-muted-foreground tabular-nums lg:table-cell">
								{formatMetric(post.reposts)}
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}
