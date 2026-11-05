import { cn } from "@tradely/ui/lib/utils";
import { ArrowUpRightIcon } from "lucide-react";

import {
	formatCompact,
	formatHandle,
	languageLabel,
	type PostSummary,
	platformOf,
	profileAnchor,
	type TraderProfile,
} from "./model";
import { TraderAvatar } from "./trader-avatar";

function TraderCard({
	profile,
	summary,
	hidden,
}: {
	profile: TraderProfile;
	summary?: PostSummary;
	hidden: boolean;
}) {
	const platform = platformOf(profile);
	return (
		<li
			id={profileAnchor(profile)}
			data-trader-profile
			hidden={hidden}
			className="trader-surface flex min-w-0 scroll-mt-24 flex-col gap-3 p-6 [&[hidden]]:hidden"
		>
			<div className="flex items-center justify-between gap-4">
				{profile.rank ? (
					<span
						role="img"
						aria-label={`Top 30 on X, rank ${profile.rank}`}
						className={cn(
							"flex size-9 shrink-0 items-center justify-center rounded-full bg-muted font-mono font-semibold text-sm tabular-nums",
							profile.rank <= 3 && "trader-rank-podium",
						)}
					>
						{String(profile.rank).padStart(2, "0")}
					</span>
				) : (
					<span className="font-mono text-muted-foreground text-xs">
						{platform.label}
					</span>
				)}
				{profile.followers !== null && platform.audience ? (
					<span className="font-mono text-muted-foreground text-xs">
						<span className="font-semibold text-foreground text-sm tabular-nums">
							{formatCompact(profile.followers)}
						</span>{" "}
						{platform.audience}
					</span>
				) : null}
			</div>

			<div className="flex min-w-0 items-center gap-3">
				<TraderAvatar profile={profile} size={48} />
				<div className="min-w-0">
					<h3 className="font-semibold text-lg leading-tight [overflow-wrap:anywhere]">
						{profile.name}
					</h3>
					<a
						href={profile.profileUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="trader-link mt-0.5 inline-flex w-fit items-center gap-1 font-mono text-sm [overflow-wrap:anywhere]"
					>
						{formatHandle(profile)}
						<ArrowUpRightIcon aria-hidden="true" size={14} />
						<span className="sr-only">(opens {platform.label} profile)</span>
					</a>
				</div>
			</div>

			<p className="text-muted-foreground text-sm leading-relaxed">
				{profile.description}
			</p>

			<p className="text-muted-foreground text-xs">
				{[
					profile.rank ? "Top 30 on X" : null,
					profile.activity,
					...profile.languages.map(languageLabel),
					profile.type === "institutional" ? "Fund / desk" : null,
				]
					.filter(Boolean)
					.join(" · ")}
			</p>

			{profile.focus.length > 0 ? (
				<p className="font-mono text-foreground/80 text-xs leading-relaxed">
					<span className="sr-only">Focus: </span>
					{profile.focus.join(" · ")}
				</p>
			) : null}

			<p className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 text-muted-foreground text-xs">
				{profile.cadence ? (
					<span>Posts {profile.cadence.toLowerCase()}</span>
				) : null}
				{summary ? (
					<>
						{profile.cadence ? <span aria-hidden="true">·</span> : null}
						<a
							href={`#post-${summary.topPostId}`}
							className="trader-link font-medium"
						>
							{summary.count} tracked {summary.count === 1 ? "post" : "posts"} ·{" "}
							{summary.topViews === null
								? "views not recorded"
								: `top ${formatCompact(summary.topViews)} views`}
						</a>
					</>
				) : null}
			</p>
		</li>
	);
}

/**
 * Every profile stays in the HTML; filters only hide cards. Readers without JavaScript, and search
 * engines, still get the whole directory.
 */
export function TraderRoster({
	profiles,
	visible,
	summaries,
}: {
	profiles: readonly TraderProfile[];
	visible: ReadonlySet<string>;
	summaries: ReadonlyMap<string, PostSummary>;
}) {
	return (
		<ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{profiles.map((profile) => {
				const anchor = profileAnchor(profile);
				return (
					<TraderCard
						key={anchor}
						profile={profile}
						summary={
							profile.platform === "x.com"
								? summaries.get(profile.handle)
								: undefined
						}
						hidden={!visible.has(anchor)}
					/>
				);
			})}
		</ol>
	);
}
