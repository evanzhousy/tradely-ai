import { createFileRoute, Link } from "@tanstack/react-router";
import { PageIntro } from "@/components/page-intro";
import { changelog } from "@/content/changelog";
import { pageHead } from "@/seo/pages";

export const Route = createFileRoute("/changelog")({
	head: () => pageHead("/changelog"),
	component: ChangelogPage,
});

function ChangelogPage() {
	return (
		<main lang="en" className="page-shell">
			<PageIntro
				eyebrow="Product updates"
				title="Changelog"
				description="A running record of what’s new in Tradely. New lessons, better practice and improvements to the way you learn."
			/>
			<section
				aria-label="Latest updates"
				className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16"
			>
				{changelog.map((entry) => (
					<article
						key={entry.id}
						id={entry.id}
						aria-labelledby={`${entry.id}-title`}
						className="grid gap-6 border-border border-b pb-12 md:grid-cols-[180px_1fr] md:gap-12"
					>
						<div>
							<a
								href={`#${entry.id}`}
								aria-label={`Permalink to update for ${entry.dateLabel}`}
								className="font-mono text-muted-foreground text-xs underline-offset-4 hover:text-foreground hover:underline"
							>
								<time dateTime={entry.date}>{entry.dateLabel}</time>
							</a>
						</div>
						<div className="flex flex-col gap-6">
							<h2
								id={`${entry.id}-title`}
								className="font-semibold text-2xl tracking-tight sm:text-3xl"
							>
								{entry.title}
							</h2>
							<p className="text-muted-foreground leading-7">{entry.summary}</p>
							<ul className="flex flex-col gap-5">
								{entry.changes.map((change) => (
									<li key={change.title} className="flex flex-col gap-1">
										<h3 className="font-medium">{change.title}</h3>
										<p className="text-muted-foreground text-sm leading-6">
											{change.description}
										</p>
									</li>
								))}
							</ul>
							<Link
								to="/courses/tradingflow-foundations"
								className="w-fit text-sm underline underline-offset-4"
							>
								Explore the curriculum →
							</Link>
						</div>
					</article>
				))}
			</section>
		</main>
	);
}
