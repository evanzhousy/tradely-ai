import { useLocation } from "@tanstack/react-router";
import { Button } from "@tradely/ui/components/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@tradely/ui/components/empty";
import { Field, FieldLabel } from "@tradely/ui/components/field";
import { Input } from "@tradely/ui/components/input";
import {
	NativeSelect,
	NativeSelectOption,
} from "@tradely/ui/components/native-select";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@tradely/ui/components/toggle-group";
import { useEffect, useId, useMemo, useState } from "react";

import {
	availableLanguages,
	DEFAULT_FILTERS,
	type DirectoryFilters,
	FEATURED_VIEW_THRESHOLD,
	formatCompact,
	formatMetricsChecked,
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

function SelectField({
	id,
	label,
	value,
	onChange,
	children,
}: {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	children: React.ReactNode;
}) {
	return (
		<Field>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<NativeSelect
				aria-label={label}
				id={id}
				className="w-full"
				value={value}
				onChange={(event) => onChange(event.target.value)}
			>
				{children}
			</NativeSelect>
		</Field>
	);
}

/** One set of controls selects the profiles, the saved posts and every count on the page. */
export function TraderDirectory({
	profiles,
	posts,
	windowLabel,
}: {
	profiles: readonly TraderProfile[];
	posts: readonly PostWithAuthor[];
	windowLabel: string;
}) {
	const id = useId();
	const [filters, setFilters] = useState(DEFAULT_FILTERS);
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

	function changeFilters(next: DirectoryFilters) {
		setFilters(next);
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
		changeFilters({ ...DEFAULT_FILTERS, view: filters.view });

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
						<ToggleGroup
							aria-label="Profile collection"
							variant="outline"
							value={[filters.view]}
							onValueChange={(values) => {
								if (values[0]) {
									changeFilters({
										...DEFAULT_FILTERS,
										view: values[0] as DirectoryFilters["view"],
										language: filters.language,
									});
								}
							}}
						>
							<ToggleGroupItem value="top">Top 30 on X</ToggleGroupItem>
							<ToggleGroupItem value="all">
								All {profiles.length} profiles
							</ToggleGroupItem>
						</ToggleGroup>
						<div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
							<Field className="col-span-2 lg:col-span-1">
								<FieldLabel htmlFor={`${id}-search`}>
									Search profiles
								</FieldLabel>
								<Input
									id={`${id}-search`}
									className="ph-no-capture placeholder:text-muted-foreground"
									type="search"
									placeholder="Name, handle or topic"
									value={filters.query}
									onChange={(event) =>
										changeFilters({ ...filters, query: event.target.value })
									}
								/>
							</Field>
							<SelectField
								id={`${id}-language`}
								label="Content language"
								value={filters.language}
								onChange={(language) =>
									changeFilters({
										...filters,
										language,
										// A specific language opens the directory: the U.S.-focused
										// Top 30 would otherwise hide most of that audience.
										view: language === "all" ? filters.view : "all",
									})
								}
							>
								<NativeSelectOption value="all">
									All languages
								</NativeSelectOption>
								{languages.map((language) => (
									<NativeSelectOption key={language} value={language}>
										{languageLabel(language)}
									</NativeSelectOption>
								))}
							</SelectField>
							<SelectField
								id={`${id}-platform`}
								label="Platform"
								value={filters.platform}
								onChange={(platform) =>
									changeFilters({
										...filters,
										platform,
										view: platform === "all" ? filters.view : "all",
									})
								}
							>
								<NativeSelectOption value="all">
									All platforms
								</NativeSelectOption>
								{PLATFORMS.map((platform) => (
									<NativeSelectOption key={platform.id} value={platform.id}>
										{platform.label}
									</NativeSelectOption>
								))}
							</SelectField>
							<SelectField
								id={`${id}-topic`}
								label="Topic"
								value={filters.topic}
								onChange={(topic) => changeFilters({ ...filters, topic })}
							>
								<NativeSelectOption value="all">All topics</NativeSelectOption>
								{topics.map((topic) => (
									<NativeSelectOption key={topic} value={topic}>
										{topic}
									</NativeSelectOption>
								))}
							</SelectField>
							<SelectField
								id={`${id}-activity`}
								label="Activity"
								value={filters.activity}
								onChange={(activity) => changeFilters({ ...filters, activity })}
							>
								<NativeSelectOption value="all">
									Any activity
								</NativeSelectOption>
								{activities.map((activity) => (
									<NativeSelectOption key={activity} value={activity}>
										{activity}
									</NativeSelectOption>
								))}
							</SelectField>
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
							<Button variant="outline" size="sm" onClick={clearFilters}>
								Clear filters
							</Button>
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
					/>
					{selected.profiles.length === 0 ? (
						<Empty>
							<EmptyHeader>
								<EmptyTitle>No matching profiles</EmptyTitle>
								<EmptyDescription>
									Try a different name or topic, or explore all profiles.
								</EmptyDescription>
							</EmptyHeader>
							<Button
								variant="outline"
								onClick={() =>
									changeFilters({ ...DEFAULT_FILTERS, view: "all" })
								}
							>
								Show all profiles
							</Button>
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
				</div>
				{featured.length > 0 ? (
					<div className="flex flex-col gap-4">
						<h3 className="font-semibold text-xl">
							Over {formatCompact(FEATURED_VIEW_THRESHOLD)} views
						</h3>
						<FeaturedPosts posts={featured} />
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
						<Button variant="outline" onClick={clearFilters}>
							Clear post filters
						</Button>
					</Empty>
				)}
			</section>
		</>
	);
}
