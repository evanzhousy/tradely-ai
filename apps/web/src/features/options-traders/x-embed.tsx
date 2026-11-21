import "react-tweet/theme.css";

import { type ComponentProps, type MouseEvent, useMemo } from "react";
import {
	enrichTweet,
	QuotedTweet,
	TweetActions,
	TweetBody,
	TweetContainer,
	TweetHeader,
	TweetInReplyTo,
	TweetMedia,
	TweetReplies,
} from "react-tweet";
import type { Tweet } from "react-tweet/api";

import { useAnalytics } from "@/analytics/context";

import savedEmbeds from "./data/x-embeds.json";
import { formatDate, type PostWithAuthor } from "./model";

// Saved by the weekly sync from X's own data, so the browser never asks X or a third party for
// the post: only its images load from X's image servers.
const embeds = (savedEmbeds as unknown as { tweets: Record<string, Tweet> })
	.tweets;

export function savedXEmbed(id: string): Tweet | undefined {
	return embeds[id];
}

export function XPostEmbed({
	post,
	tweet,
	position,
}: {
	post: PostWithAuthor;
	tweet: Tweet;
	position: number;
}) {
	const { capture } = useAnalytics();
	const enriched = useMemo(() => enrichTweet(tweet), [tweet]);
	// The author's picture comes from Tradely's own copy; quoted authors keep X's.
	const components = useMemo(
		() => ({
			AvatarImg: (props: ComponentProps<"img">) => (
				<img
					{...props}
					alt={props.alt ?? ""}
					src={
						props.alt === tweet.user.name && post.author.avatar
							? post.author.avatar
							: props.src
					}
				/>
			),
		}),
		[post.author.avatar, tweet.user.name],
	);

	function recordOpen(event: MouseEvent<HTMLDivElement>) {
		const link = (event.target as Element).closest("a");
		if (!link) return;
		const url = new URL(link.href);
		if (url.href.includes(post.id)) {
			capture("options_post_opened", {
				surface: "options_traders",
				placement: "featured",
				platform: "x",
				post_id: post.id,
				position,
				handle: post.author.handle,
			});
			return;
		}
		// The embed's name and picture link to the post; its only author link is Follow.
		const followed = url.searchParams.get("screen_name")?.toLowerCase();
		if (
			url.pathname === "/intent/follow" &&
			followed === post.author.handle.toLowerCase()
		) {
			capture("options_profile_opened", {
				surface: "options_traders",
				placement: "post_author",
				platform: "x",
				handle: post.author.handle,
				rank: post.author.rank,
			});
		}
	}

	return (
		// Records which of the embed's own links opened; it adds no control of its own.
		<div
			onClickCapture={recordOpen}
			className="min-w-0 [&_.react-tweet-theme]:max-w-none [&_.react-tweet-theme]:[--tweet-body-font-size:1rem] [&_.react-tweet-theme]:[--tweet-body-line-height:1.5rem] [&_.react-tweet-theme]:[--tweet-container-margin:0]"
		>
			<TweetContainer>
				<TweetHeader tweet={enriched} components={components} />
				{enriched.in_reply_to_status_id_str ? (
					<TweetInReplyTo tweet={enriched} />
				) : null}
				<TweetBody tweet={enriched} />
				{enriched.mediaDetails?.length ? (
					<TweetMedia tweet={enriched} components={components} />
				) : null}
				{enriched.quoted_tweet ? (
					<QuotedTweet tweet={enriched.quoted_tweet} components={components} />
				) : null}
				<PostedOn tweet={enriched} />
				<TweetActions tweet={enriched} />
				<TweetReplies tweet={enriched} />
			</TweetContainer>
		</div>
	);
}

// react-tweet's own date line formats in the reader's time zone, which the server can't match on
// hydration; this one uses Tradely's UTC date, keeping X's info link.
function PostedOn({ tweet }: { tweet: ReturnType<typeof enrichTweet> }) {
	const date = formatDate(tweet.created_at);
	return (
		<div className="text-(length:--tweet-info-font-size) mt-0.5 flex items-center overflow-hidden text-ellipsis whitespace-nowrap text-(--tweet-font-color-secondary) leading-(--tweet-info-line-height)">
			<a
				href={tweet.url}
				target="_blank"
				rel="noopener noreferrer"
				aria-label={date}
				className="text-inherit no-underline hover:underline"
			>
				<time dateTime={new Date(tweet.created_at).toISOString()}>{date}</time>
			</a>
			<a
				href="https://help.x.com/en/x-for-websites-ads-info-and-privacy"
				target="_blank"
				rel="noopener noreferrer"
				className="ms-auto -me-1 flex size-(--tweet-actions-icon-wrapper-size) items-center justify-center rounded-full text-inherit transition-colors hover:bg-(--tweet-color-blue-secondary-hover) hover:text-(--tweet-color-blue-secondary)"
			>
				<svg
					viewBox="0 0 24 24"
					aria-hidden="true"
					className="h-(--tweet-actions-icon-size) select-none fill-current"
				>
					<path d="M13.5 8.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5S11.17 7 12 7s1.5.67 1.5 1.5zM13 17v-5h-2v5h2zm-1 5.25c5.66 0 10.25-4.59 10.25-10.25S17.66 1.75 12 1.75 1.75 6.34 1.75 12 6.34 22.25 12 22.25zM20.25 12c0 4.56-3.69 8.25-8.25 8.25S3.75 16.56 3.75 12 7.44 3.75 12 3.75s8.25 3.69 8.25 8.25z" />
				</svg>
				<span className="sr-only">
					X for Websites, ads information and privacy
				</span>
			</a>
		</div>
	);
}
