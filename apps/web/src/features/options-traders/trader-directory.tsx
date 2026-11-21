import { useLocation } from "@tanstack/react-router";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@tradely/ui/components/empty";
import { useEffect, useMemo, useRef, useState } from "react";

import { useAnalytics } from "@/analytics/context";
import type { OptionsListFilter } from "@/analytics/events";

import { analyticsPlatformFilter } from "./analytics";
import { PlatformIcon } from "./brand-icons";
import {
	ActionButton,
	FilterSelect,
	SearchField,
	ViewSwitch,
} from "./controls";
import {
	availableLanguages,
	DEFAULT_FILTERS,
	type DirectoryFilters,
	FEATURED_VIEW_THRESHOLD,
	formatCompact,
	formatMetricsChecked,
	type LiveSnapshot,
	languageLabel,
	PLATFORMS,
	type PostWithAuthor,
	profileAnchor,
	selectDirectory,
	summarizePosts,
	type TraderProfile,
} from "./model";
import { FeaturedPosts, PostsTable } from "./saved-posts";
import { TraderRoster } from "./trader-roster";

/** One set of controls selects the profiles, the saved posts and every count on the page. */
export function TraderDirectory({
	profiles,
	posts,
	windowLabel,
	followerRead,
	embeds,
}: {
	profiles: readonly TraderProfile[];
	posts: readonly PostWithAuthor[];
	windowLabel: string;
	followerRead?: string;
	embeds?: LiveSnapshot["embeds"];
}) {
	const { capture } = useAnalytics();
	const [filters, setFilters] = useState(DEFAULT_FILTERS);
	const lastSearch = useRef("");
	const hash = useLocation({
		select: (location) => location.hash.toLowerCase(),
	});

	const topics = useMemo(
		() => [...new Set(profiles.flatMap((profile) => profile.focus))].sort(),
		[profiles],
	);
	const activities = useMemo(
		() => [...new Set(profiles.map((profile) => profile.activity))].sort(),
		[profiles],
	);
	const languages = useMemo(
		() => availableLanguages(profiles, posts),
		[profiles, posts],
	);
	const selected = useMemo(
		() => selectDirectory(profiles, posts, filters),
		[profiles, posts, filters],
	);
	const visible = useMemo(
		() => new Set(selected.profiles.map(profileAnchor)),
		[selected.profiles],
	);
	const summaries = useMemo(
		() => summarizePosts(selected.posts),
		[selected.posts],
	);

	const totalViews = selected.posts.reduce(
		(total, post) => total + (post.views ?? 0),
		0,
	);
	const unmeasured = selected.posts.filter((post) => post.views === null);
	const featured = selected.posts.filter(
		(post) => post.views !== null && post.views >= FEATURED_VIEW_THRESHOLD,
	);

	// A link to a profile, platform or post reveals its target even after filtering hid it.
	useEffect(() => {
		if (!hash) return;
		const platform = PLATFORMS.find((item) => item.anchor === hash);
		const profile = profiles.find((item) => profileAnchor(item) === hash);
		const post = posts.find((item) => `post-${item.id}` === hash);
		if (post && document.getElementById(hash)) return;
		if (!platform && !profile && !post) {
			if (hash !== "directory" && hash !== "roster") return;
		}
		setFilters({
			...DEFAULT_FILTERS,
			view:
				hash === "roster" || profile?.rank || post?.author.rank ? "top" : "all",
			platform: platform?.id ?? "all",
		});
	}, [hash, profiles, posts]);

	// Scroll after the filter change has committed, when a formerly hidden target has layout.
	// biome-ignore lint/correctness/useExhaustiveDependencies: filters decide what can be scrolled to.
	useEffect(() => {
		if (!hash) return;
		const target = document.getElementById(hash);
		if (target && !target.hidden) target.scrollIntoView();
	}, [hash, filters]);

	// A search counts once the visitor pauses typing; its text never leaves the page.
	const searched = filters.query.trim();
	const searchProfiles = selected.profiles.length;
	const searchPosts = selected.posts.length;
	useEffect(() => {
		if (!searched) {
			lastSearch.current = "";
			return;
		}
		if (searched === lastSearch.current) return;
		const timer = window.setTimeout(() => {
			lastSearch.current = searched;
			capture("options_list_filtered", {
				surface: "options_traders",
				filter: "search",
				matching_profiles: searchProfiles,
				matching_posts: searchPosts,
			});
		}, 1000);
		return () => window.clearTimeout(timer);
	}, [capture, searched, searchProfiles, searchPosts]);

	function changeFilters(
		next: DirectoryFilters,
		filter: OptionsListFilter,
		value?: string,
	) {
		setFilters(next);
		if (filter !== "search") {
			const matching = selectDirectory(profiles, posts, next);
			capture("options_list_filtered", {
				surface: "options_traders",
				filter,
				...(value === undefined ? {} : { value }),
				matching_profiles: matching.profiles.length,
				matching_posts: matching.posts.length,
			});
		}
		// Lets a later click on the same anchor navigate and reveal it again.
		if (window.location.hash) {
			window.history.replaceState(
				window.history.state,
				"",
				window.location.pathname + window.location.search,
			);
		}
	}
	const clearFilters = () =>
		changeFilters({ ...DEFAULT_FILTERS, view: filters.view }, "clear");

	return (
		<>
			<section
				id="roster"
				aria-labelledby="roster-title"
				className="trader-section"
			>
				<div className="flex flex-wrap items-end justify-between gap-3">
					<h2 id="roster-title" className="trader-section-title">
						Find traders to follow
					</h2>
					<p className="font-mono text-muted-foreground text-xs">
						Top 30 on X · Full directory across {PLATFORMS.length} platforms
					</p>
				</div>
				<div
					id="directory"
					className="relative flex scroll-mt-24 flex-col gap-6"
				>
					{PLATFORMS.map((platform) => (
						<span
							key={platform.id}
							id={platform.anchor}
							className="absolute scroll-mt-24"
						/>
					))}
					<div data-trader-controls className="flex flex-col gap-5">
						<ViewSwitch
							label="Profile collection"
							value={filters.view}
							options={[
								{ value: "top", label: "Top 30 on X" },
								{ value: "all", label: `All ${profiles.length} profiles` },
							]}
							onChange={(view) =>
								changeFilters(
									{ ...DEFAULT_FILTERS, view, language: filters.language },
									"view",
									view,
								)
							}
						/>
						<div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
							<SearchField
								label="Search profiles"
								placeholder="Name, handle or topic"
								value={filters.query}
								className="col-span-2 lg:col-span-1"
								onChange={(query) =>
									changeFilters(
										{
											...filters,
											query,
											// Search, topic and activity reach the whole directory, as platform and
											// language do: most matches sit outside the Top 30.
											view: query ? "all" : filters.view,
										},
										"search",
									)
								}
							/>
							<FilterSelect
								label="Content language"
								value={filters.language}
								options={[
									{ value: "all", label: "All languages" },
									...languages.map((language) => ({
										value: language,
										label: languageLabel(language),
									})),
								]}
								onChange={(language) =>
									changeFilters(
										{
											...filters,
											language,
											// A specific language opens the directory: the U.S.-focused
											// Top 30 would otherwise hide most of that audience.
											view: language === "all" ? filters.view : "all",
										},
										"language",
										language,
									)
								}
							/>
							<FilterSelect
								label="Platform"
								value={filters.platform}
								options={[
									{ value: "all", label: "All platforms" },
									...PLATFORMS.map((platform) => ({
										value: platform.id,
										label: platform.label,
										icon: <PlatformIcon platform={platform.id} size={13} />,
									})),
								]}
								onChange={(platform) =>
									changeFilters(
										{
											...filters,
											platform,
											view: platform === "all" ? filters.view : "all",
										},
										"platform",
										analyticsPlatformFilter(platform),
									)
								}
							/>
							<FilterSelect
								label="Topic"
								value={filters.topic}
								options={[
									{ value: "all", label: "All topics" },
									...topics.map((topic) => ({ value: topic, label: topic })),
								]}
								onChange={(topic) =>
									changeFilters(
										{
											...filters,
											topic,
											view: topic === "all" ? filters.view : "all",
										},
										"topic",
										topic,
									)
								}
							/>
							<FilterSelect
								label="Activity"
								value={filters.activity}
								options={[
									{ value: "all", label: "Any activity" },
									...activities.map((activity) => ({
										value: activity,
										label: activity,
									})),
								]}
								onChange={(activity) =>
									changeFilters(
										{
											...filters,
											activity,
											view: activity === "all" ? filters.view : "all",
										},
										"activity",
										activity,
									)
								}
							/>
						</div>
						<div className="flex flex-wrap items-center justify-between gap-3">
							<p
								role="status"
								aria-live="polite"
								aria-atomic="true"
								className="text-muted-foreground text-sm"
							>
								{selected.profiles.length}{" "}
								{selected.profiles.length === 1 ? "profile" : "profiles"} ·{" "}
								{selected.posts.length} saved{" "}
								{selected.posts.length === 1 ? "post" : "posts"} ·{" "}
								{filters.view === "top"
									? "Top 30 on X, in rank order"
									: "Full directory, grouped by platform"}
							</p>
							<ActionButton size="sm" onClick={clearFilters}>
								Clear filters
							</ActionButton>
						</div>
					</div>
					<p className="text-muted-foreground text-xs leading-relaxed">
						Language labels come from observed posting content; a profile
						without one has no recorded language yet. Saved posts are filtered
						by the language of their own text.
					</p>
					<noscript>
						<style>
							{
								"@layer base{[data-trader-profile][hidden]{display:flex!important}}[data-trader-controls]{display:none}"
							}
						</style>
						<p className="text-muted-foreground text-sm">
							All profiles are shown. Enable JavaScript to search and filter.
						</p>
					</noscript>
					<TraderRoster
						profiles={profiles}
						visible={visible}
						summaries={summaries}
						followerRead={followerRead}
						surface="options_traders"
						placement="directory"
					/>
					{selected.profiles.length === 0 ? (
						<Empty>
							<EmptyHeader>
								<EmptyTitle>No matching profiles</EmptyTitle>
								<EmptyDescription>
									Try a different name or topic, or explore all profiles.
								</EmptyDescription>
							</EmptyHeader>
							<ActionButton
								onClick={() =>
									changeFilters({ ...DEFAULT_FILTERS, view: "all" }, "clear")
								}
							>
								Show all profiles
							</ActionButton>
						</Empty>
					) : null}
				</div>
			</section>

			<section
				id="most-viewed-posts"
				aria-labelledby="posts-title"
				className="trader-section"
			>
				<div className="flex flex-col gap-2">
					<h2 id="posts-title" className="trader-section-title">
						Most-viewed posts
					</h2>
					<p className="max-w-3xl text-muted-foreground text-sm leading-relaxed">
						{selected.posts.length} matching saved X{" "}
						{selected.posts.length === 1 ? "post" : "posts"} from{" "}
						{summaries.size} {summaries.size === 1 ? "trader" : "traders"},
						covering {windowLabel}.{" "}
						{selected.posts.length > unmeasured.length
							? `Known view counts total ${formatCompact(totalViews)}${
									unmeasured.length > 0
										? `; ${unmeasured.length} ${unmeasured.length === 1 ? "post has" : "posts have"} no recorded view count`
										: ""
								}. `
							: "No view counts are recorded for this selection. "}
						{selected.posts.length > 0
							? `Metrics were checked ${formatMetricsChecked(selected.posts) ?? "at the per-post times below"}. `
							: ""}
						This recorded selection follows the profile and language filters; it
						is not every post by these accounts.
					</p>
					<p className="max-w-3xl text-muted-foreground text-sm leading-relaxed">
						Posts are shown as written. Some promote the author's paid rooms,
						newsletters or trade alerts; Tradely has not reviewed or endorsed
						any of them. Posts over {formatCompact(FEATURED_VIEW_THRESHOLD)}{" "}
						views appear as X embeds drawn from X's public post data; their
						images, and any video you play, load from X.
					</p>
				</div>
				{featured.length > 0 ? (
					<div className="flex flex-col gap-4">
						<h3 className="font-semibold text-xl">
							Over {formatCompact(FEATURED_VIEW_THRESHOLD)} views
						</h3>
						<FeaturedPosts posts={featured} embeds={embeds} />
					</div>
				) : null}
				{selected.posts.length > 0 ? (
					<div className="flex flex-col gap-4">
						<h3 className="font-semibold text-xl">
							All {selected.posts.length} matching{" "}
							{selected.posts.length === 1 ? "post" : "posts"}
						</h3>
						<PostsTable posts={selected.posts} />
					</div>
				) : (
					<Empty>
						<EmptyHeader>
							<EmptyTitle>No saved posts match these filters</EmptyTitle>
							<EmptyDescription>
								Try all languages or clear the filters. A profile can have a
								recorded language without a saved post in that language.
							</EmptyDescription>
						</EmptyHeader>
						<ActionButton onClick={clearFilters}>
							Clear post filters
						</ActionButton>
					</Empty>
				)}
			</section>
		</>
	);
}
