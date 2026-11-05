import { buttonVariants } from "@tradely/ui/components/button";
import { Link as HeroLink } from "@tradely/ui/components/link";
import { ArrowDownIcon, ExternalLinkIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAnalytics } from "@/analytics/context";
import { AppLink } from "@/components/app-link";
import { PageIntro } from "@/components/page-intro";
import {
	attachAuthors,
	formatDate,
	formatDateRange,
	formatRecordedTime,
	latestPostAt,
	PLATFORMS,
	type PostSnapshot,
	profileAnchor,
	withObservedLanguages,
} from "./model";
import { savedProfiles, savedSnapshot } from "./saved-data";
import { TopTraders } from "./top-traders";
import { TraderDirectory } from "./trader-directory";

const FIRST_SCREEN_TRADERS = 5;
const FEED_PATH = "/api/options-traders";
const OPTION_TRADES_URL =
	"https://app.tradingflow.com/app/option-trades/live?utm_source=tradely&utm_medium=options_traders";

function OpenOptionTrades({ surface }: { surface: "hero" | "closing" }) {
	const { capture } = useAnalytics();
	return (
		<HeroLink
			href={OPTION_TRADES_URL}
			target="_blank"
			rel="noopener noreferrer"
			onClick={() =>
				capture("tradingflow_link_opened", {
					surface: "options_traders",
					tool: "Option Trades",
				})
			}
			className={buttonVariants({
				variant: surface === "hero" ? "outline" : "default",
			})}
		>
			Open Option Trades
			<ExternalLinkIcon aria-hidden="true" size={14} className="ms-1.5" />
		</HeroLink>
	);
}

/**
 * The page renders the saved snapshot at once, then asks the feed for newer posts once per load, so
 * a slow or failing read never delays or empties the page. Filters are untouched by the swap.
 */
function useLatestSnapshot(saved: PostSnapshot): PostSnapshot {
	const [snapshot, setSnapshot] = useState(saved);
	useEffect(() => {
		const controller = new AbortController();
		async function checkForNewerPosts() {
			try {
				const response = await fetch(FEED_PATH, { signal: controller.signal });
				// No feed is configured here, so the saved snapshot is final and nothing is late.
				if (response.status === 204) return;
				if (!response.ok) throw new Error("Feed unavailable");
				setSnapshot((await response.json()) as PostSnapshot);
			} catch {
				if (controller.signal.aborted) return;
				setSnapshot((current) => ({
					...current,
					freshness: {
						...current.freshness,
						status: "failed",
						lastAttemptedAt: new Date().toISOString(),
					},
				}));
			}
		}
		void checkForNewerPosts();
		return () => controller.abort();
	}, []);
	return snapshot;
}

function Freshness({
	snapshot,
	postsThrough,
}: {
	snapshot: PostSnapshot;
	postsThrough: string | null;
}) {
	const { freshness, metricsCapturedAt } = snapshot;
	const delayed =
		freshness.status === "failed" || freshness.status === "partial";
	const live = snapshot !== savedSnapshot && freshness.status === "success";
	const dates = [
		// A sync that was never recorded is not a date to show.
		...(freshness.dataSyncedAt
			? [{ label: "Data synced", value: freshness.dataSyncedAt }]
			: []),
		{ label: "Posts through", value: postsThrough },
		{ label: "Metrics checked", value: metricsCapturedAt },
		...(freshness.sourceUpdatedAt
			? [{ label: "Source updated", value: freshness.sourceUpdatedAt }]
			: []),
	];
	return (
		<div className="flex flex-col gap-2">
			<dl
				aria-label="Saved-post data freshness"
				className="flex flex-wrap gap-x-10 gap-y-4"
			>
				{dates.map(({ label, value }) => (
					<div key={label} className="min-w-0">
						<dt className="font-mono text-muted-foreground text-xs">{label}</dt>
						<dd className="mt-1 font-medium text-sm">
							{value ? (
								<time dateTime={value}>{formatRecordedTime(value)}</time>
							) : (
								"Not recorded"
							)}
						</dd>
					</div>
				))}
			</dl>
			{delayed ? (
				<p role="status" className="text-sm">
					<strong>Refresh delayed.</strong> Showing the last saved data.
					{freshness.lastAttemptedAt ? (
						<>
							{" "}
							Last attempt:{" "}
							<time dateTime={freshness.lastAttemptedAt}>
								{formatRecordedTime(freshness.lastAttemptedAt)}
							</time>
							.
						</>
					) : null}
				</p>
			) : null}
			<p className="text-muted-foreground text-xs leading-relaxed">
				These dates describe the saved posts across all languages. Follower
				counts have separate as-of dates.
				{live ? " Newer digest posts were added when this page loaded." : ""}
			</p>
		</div>
	);
}

export function OptionsTradersPage() {
	const snapshot = useLatestSnapshot(savedSnapshot);
	const profiles = useMemo(
		() => withObservedLanguages(savedProfiles, snapshot.posts),
		[snapshot.posts],
	);
	const posts = useMemo(
		() => attachAuthors(profiles, snapshot.posts),
		[profiles, snapshot.posts],
	);
	const ranked = useMemo(
		() =>
			profiles
				.filter((profile) => profile.rank !== undefined)
				.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0)),
		[profiles],
	);
	const topTraders = ranked.slice(0, FIRST_SCREEN_TRADERS);
	const nextTrader = ranked[FIRST_SCREEN_TRADERS];
	const followerRead = topTraders
		.map((profile) => profile.followersAsOf)
		.sort()
		.at(-1);
	const platformCounts = PLATFORMS.map((platform) => ({
		...platform,
		count: profiles.filter((profile) => profile.platform === platform.id)
			.length,
	}));

	const method = [
		{
			title: "Who is included",
			body: `The directory covers ${profiles.length} profiles across X, YouTube and Reddit that discuss unusual options, open interest, GEX, IV or dealer hedging. It includes quieter accounts and fund or desk voices, labeled by activity and type; accounts that have gone inactive are left out. The Top 30 selects active U.S. individuals on X whose feeds are mostly on topic. Vendor, brand and fund accounts are excluded from that ranking.`,
		},
		{
			title: "How ranking works",
			body: "The Top 30 order favors traders whose typical post names a contract, an open-interest change or a gamma wall that can be checked against the tape. Posting pace and reach come next, and follower count carries little weight. The full directory is grouped by platform, with the same editorial order within each platform. Inclusion and rank do not measure trading returns.",
		},
		{
			title: "Where the data comes from",
			body: "TradingFlow, our practice partner, researches this directory and keeps a weekday digest of public X posts. For Top 30 accounts the digest missed, it also searches X for their recent options posts. Filters select posts by directory accounts, and each post keeps the date its metrics were measured.",
		},
	];

	return (
		<main lang="en" className="page-shell options-traders-page">
			<PageIntro
				eyebrow="Who to read"
				title="Options traders to follow"
				description={`The top five of ${ranked.length} U.S. traders on X, ranked mainly by whether their posts name something you can check against the tape.`}
				aside={<TopTraders traders={topTraders} />}
				className="options-traders-intro"
			>
				<div className="flex flex-wrap gap-3">
					{nextTrader ? (
						<a
							href={`#${profileAnchor(nextTrader)}`}
							className={buttonVariants()}
						>
							See ranks {FIRST_SCREEN_TRADERS + 1}–{ranked.length}
							<ArrowDownIcon aria-hidden="true" size={16} />
						</a>
					) : null}
					<OpenOptionTrades surface="hero" />
				</div>
				<p className="max-w-[65ch] text-muted-foreground text-xs leading-relaxed">
					Followers read{" "}
					{followerRead ? formatDate(followerRead) : "on the dates shown below"}
					. Rank does not measure trading returns; inclusion is not an
					endorsement or financial advice. Option Trades is part of TradingFlow,
					a separate product that needs its own account and a free trial or paid
					plan.
				</p>
			</PageIntro>

			<nav aria-label="On this page" className="flex flex-wrap gap-2">
				{[
					{ href: "#directory", label: `All ${profiles.length} profiles` },
					...platformCounts.map((platform) => ({
						href: `#${platform.anchor}`,
						label: `${platform.label} · ${platform.count}`,
					})),
					{ href: "#most-viewed-posts", label: "Most-viewed posts" },
					{ href: "#method", label: "Method" },
				].map((link) => (
					<a
						key={link.href}
						href={link.href}
						className={buttonVariants({ variant: "outline", size: "sm" })}
					>
						{link.label}
					</a>
				))}
			</nav>

			<TraderDirectory
				profiles={profiles}
				posts={posts}
				windowLabel={formatDateRange(
					snapshot.digestWindow.from,
					snapshot.digestWindow.to,
				)}
				metricsLabel={
					snapshot.metricsCapturedAt
						? `on or after ${formatDate(snapshot.metricsCapturedAt)}`
						: "at the per-post times below"
				}
			/>

			<section
				id="method"
				aria-labelledby="method-title"
				className="trader-section"
			>
				<h2 id="method-title" className="trader-section-title">
					How this list is built
				</h2>
				<Freshness
					snapshot={snapshot}
					postsThrough={latestPostAt(snapshot.posts)}
				/>
				<div className="grid gap-4 md:grid-cols-3">
					{method.map((step) => (
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
					Most of these posts name a strike, an open-interest change or a gamma
					wall. Tradely's free course teaches you how to read one, and
					TradingFlow's Option Trades tape shows the prints behind a claim.
				</p>
				<div className="flex flex-wrap gap-3">
					<AppLink
						to="/courses/tradingflow-foundations"
						className={buttonVariants({ variant: "outline" })}
					>
						Explore the curriculum
					</AppLink>
					<OpenOptionTrades surface="closing" />
				</div>
			</section>

			<p className="text-muted-foreground text-xs leading-relaxed">
				Educational and informational only, not financial advice. Inclusion is
				not an endorsement. Reddit karma is not tracked, and post metrics change
				over time. See the{" "}
				<AppLink
					to="/risk-disclosure"
					className="trader-link underline underline-offset-4"
				>
					risk disclosure
				</AppLink>
				.
			</p>
		</main>
	);
}
